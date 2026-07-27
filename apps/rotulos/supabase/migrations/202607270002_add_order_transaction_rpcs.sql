-- save_order: upsert cliente por telefono + insert pedido + insert lineas,
-- todo en una sola transaccion (si insertar una linea falla, revierte el
-- pedido y el upsert de cliente).
create or replace function public.save_order(
  p_customer jsonb,
  p_order jsonb,
  p_items jsonb
)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid;
  v_phone text := p_customer->>'phone';
  v_order public.orders;
begin
  if v_phone is not null and v_phone <> '' then
    select id into v_customer_id from public.customers where phone = v_phone;
  end if;

  if v_customer_id is null then
    insert into public.customers (full_name, phone, email, department, city, locality, address, neighborhood)
    values (
      p_customer->>'fullName', coalesce(v_phone, ''), coalesce(p_customer->>'email', ''),
      coalesce(p_customer->>'department', ''), coalesce(p_customer->>'city', ''),
      coalesce(p_customer->>'locality', ''), coalesce(p_customer->>'address', ''),
      coalesce(p_customer->>'neighborhood', '')
    )
    returning id into v_customer_id;
  else
    update public.customers set
      full_name = p_customer->>'fullName',
      email = coalesce(p_customer->>'email', ''),
      department = coalesce(p_customer->>'department', ''),
      city = coalesce(p_customer->>'city', ''),
      locality = coalesce(p_customer->>'locality', ''),
      address = coalesce(p_customer->>'address', ''),
      neighborhood = coalesce(p_customer->>'neighborhood', ''),
      updated_at = now()
    where id = v_customer_id;
  end if;

  insert into public.orders (customer_id, customer_snapshot, order_date, status, notes, discount, shipping_cost, subtotal, total)
  values (
    v_customer_id, p_customer, (p_order->>'orderDate')::date, p_order->>'status', coalesce(p_order->>'notes', ''),
    (p_order->>'discount')::numeric, (p_order->>'shippingCost')::numeric,
    (p_order->>'subtotal')::numeric, (p_order->>'total')::numeric
  )
  returning * into v_order;

  insert into public.order_items (order_id, product_code, product_name, category, quantity, unit_price, total)
  select
    v_order.id, item->>'productCode', item->>'productName', coalesce(item->>'category', ''),
    (item->>'quantity')::numeric, (item->>'unitPrice')::numeric,
    (item->>'quantity')::numeric * (item->>'unitPrice')::numeric
  from jsonb_array_elements(p_items) as item;

  return v_order;
end;
$$;

revoke all on function public.save_order(jsonb, jsonb, jsonb) from public;
grant execute on function public.save_order(jsonb, jsonb, jsonb) to authenticated;

-- update_order: aplica un patch parcial (cliente/fecha/estado/notas/
-- descuento/envio/lineas) recalculando subtotal/total desde las lineas
-- finales, en una sola transaccion (borrar+actualizar lineas y actualizar
-- el pedido no pueden quedar a medias).
create or replace function public.update_order(
  p_order_id uuid,
  p_patch jsonb
)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current public.orders;
  v_items_patch jsonb := p_patch->'items';
  v_kept_ids uuid[];
  v_discount numeric;
  v_shipping_cost numeric;
  v_subtotal numeric := 0;
  v_total numeric;
  v_notes text;
  v_reason text := p_patch->>'adjustmentReason';
  v_item jsonb;
begin
  select * into v_current from public.orders where id = p_order_id;
  if v_current is null then
    raise exception 'order_not_found';
  end if;

  v_discount := coalesce((p_patch->>'discount')::numeric, v_current.discount);
  v_shipping_cost := coalesce((p_patch->>'shippingCost')::numeric, v_current.shipping_cost);

  if v_items_patch is not null then
    select array_agg((item->>'id')::uuid) into v_kept_ids
    from jsonb_array_elements(v_items_patch) as item;

    delete from public.order_items
    where order_id = p_order_id
      and (v_kept_ids is null or not (id = any(v_kept_ids)));

    for v_item in select * from jsonb_array_elements(v_items_patch) loop
      update public.order_items set
        product_code = v_item->>'productCode',
        product_name = v_item->>'productName',
        category = coalesce(v_item->>'category', ''),
        quantity = (v_item->>'quantity')::numeric,
        unit_price = (v_item->>'unitPrice')::numeric,
        total = (v_item->>'quantity')::numeric * (v_item->>'unitPrice')::numeric
      where id = (v_item->>'id')::uuid and order_id = p_order_id;
      v_subtotal := v_subtotal + (v_item->>'quantity')::numeric * (v_item->>'unitPrice')::numeric;
    end loop;
  else
    select coalesce(sum(quantity * unit_price), 0) into v_subtotal
    from public.order_items where order_id = p_order_id;
  end if;

  v_total := greatest(0, v_subtotal - v_discount + v_shipping_cost);

  v_notes := coalesce(p_patch->>'notes', v_current.notes);
  if v_reason is not null and length(trim(v_reason)) > 0 then
    v_notes := case
      when length(trim(v_notes)) > 0 then v_notes || E'\n' || 'AJUSTE: ' || trim(v_reason)
      else 'AJUSTE: ' || trim(v_reason)
    end;
  end if;

  update public.orders set
    customer_snapshot = coalesce(p_patch->'customer', customer_snapshot),
    order_date = coalesce((p_patch->>'orderDate')::date, order_date),
    status = coalesce(p_patch->>'status', status),
    notes = v_notes,
    discount = v_discount,
    shipping_cost = v_shipping_cost,
    subtotal = v_subtotal,
    total = v_total,
    updated_at = now()
  where id = p_order_id
  returning * into v_current;

  return v_current;
end;
$$;

revoke all on function public.update_order(uuid, jsonb) from public;
grant execute on function public.update_order(uuid, jsonb) to authenticated;

-- merge_customers: mueve los pedidos relacionados (por customer_id o por
-- coincidencia de nombre normalizado, mismo criterio que
-- isRelatedOrderToCustomer en business-store.ts) al cliente destino y
-- borra el cliente origen, en una sola transaccion.
create or replace function public.merge_customers(
  p_source_id uuid,
  p_target_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_source public.customers;
  v_target public.customers;
  v_target_snapshot jsonb;
  v_source_name text;
  v_updated integer;
begin
  if p_source_id = p_target_id then
    raise exception 'same_customer';
  end if;

  select * into v_source from public.customers where id = p_source_id;
  select * into v_target from public.customers where id = p_target_id;
  if v_source is null or v_target is null then
    raise exception 'customer_not_found';
  end if;

  v_target_snapshot := jsonb_build_object(
    'fullName', v_target.full_name,
    'phone', v_target.phone,
    'email', v_target.email,
    'department', v_target.department,
    'city', v_target.city,
    'locality', coalesce(v_target.locality, ''),
    'address', v_target.address,
    'neighborhood', v_target.neighborhood
  );
  v_source_name := lower(regexp_replace(trim(v_source.full_name), '\s+', ' ', 'g'));

  with orders_norm as (
    select o.id, o.customer_id,
           lower(regexp_replace(trim(coalesce(o.customer_snapshot->>'fullName', '')), '\s+', ' ', 'g')) as o_name
    from public.orders o
  ),
  matched as (
    select id from orders_norm
    where customer_id = p_source_id
      or (
        o_name <> '' and v_source_name <> '' and (
          o_name = v_source_name
          or (length(o_name) >= 4 and left(v_source_name, length(o_name) + 1) = o_name || ' ')
        )
      )
  ),
  updated as (
    update public.orders o set
      customer_id = v_target.id,
      customer_snapshot = v_target_snapshot,
      updated_at = now()
    where o.id in (select id from matched)
    returning o.id
  )
  select count(*) into v_updated from updated;

  delete from public.customers where id = p_source_id;

  return v_updated;
end;
$$;

revoke all on function public.merge_customers(uuid, uuid) from public;
grant execute on function public.merge_customers(uuid, uuid) to authenticated;
