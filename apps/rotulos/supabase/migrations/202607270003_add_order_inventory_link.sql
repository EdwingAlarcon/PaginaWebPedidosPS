alter table public.order_items
  add column if not exists product_id uuid references public.products(id) on delete set null;

alter table public.stock_movements
  add column if not exists order_id uuid references public.orders(id) on delete set null;

create index if not exists order_items_product_id_idx on public.order_items (product_id);
create index if not exists stock_movements_order_id_idx on public.stock_movements (order_id);

-- save_order: ahora tambien registra la salida de stock por cada linea
-- con product_id, en la misma transaccion (revierte todo si falta stock).
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

  insert into public.order_items (order_id, product_id, product_code, product_name, category, quantity, unit_price, total)
  select
    v_order.id, (item->>'productId')::uuid, item->>'productCode', item->>'productName', coalesce(item->>'category', ''),
    (item->>'quantity')::numeric, (item->>'unitPrice')::numeric,
    (item->>'quantity')::numeric * (item->>'unitPrice')::numeric
  from jsonb_array_elements(p_items) as item;

  insert into public.stock_movements (product_id, type, quantity, order_id, reason)
  select
    (item->>'productId')::uuid, 'salida', (item->>'quantity')::numeric, v_order.id,
    'Pedido ' || v_order.id
  from jsonb_array_elements(p_items) as item
  where (item->>'productId') is not null;

  return v_order;
end;
$$;

revoke all on function public.save_order(jsonb, jsonb, jsonb) from public;
grant execute on function public.save_order(jsonb, jsonb, jsonb) to authenticated;

-- update_order: ahora tambien genera movimientos compensatorios de stock
-- (devolucion completa al cancelar, delta al cambiar cantidades, devolucion
-- completa al eliminar una linea), en la misma transaccion.
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
  v_new_status text := p_patch->>'status';
  v_cancelling boolean;
  v_old_item record;
begin
  select * into v_current from public.orders where id = p_order_id;
  if v_current is null then
    raise exception 'order_not_found';
  end if;

  v_cancelling := v_new_status = 'cancelled' and v_current.status <> 'cancelled';

  if v_cancelling then
    for v_old_item in
      select product_id, quantity from public.order_items
      where order_id = p_order_id and product_id is not null
    loop
      insert into public.stock_movements (product_id, type, quantity, order_id, reason)
      values (v_old_item.product_id, 'entrada', v_old_item.quantity, p_order_id, 'Cancelacion pedido ' || p_order_id);
    end loop;
  end if;

  v_discount := coalesce((p_patch->>'discount')::numeric, v_current.discount);
  v_shipping_cost := coalesce((p_patch->>'shippingCost')::numeric, v_current.shipping_cost);

  if v_items_patch is not null then
    select array_agg((item->>'id')::uuid) into v_kept_ids
    from jsonb_array_elements(v_items_patch) as item;

    if not v_cancelling then
      for v_old_item in
        select product_id, quantity from public.order_items
        where order_id = p_order_id
          and product_id is not null
          and (v_kept_ids is null or not (id = any(v_kept_ids)))
      loop
        insert into public.stock_movements (product_id, type, quantity, order_id, reason)
        values (v_old_item.product_id, 'entrada', v_old_item.quantity, p_order_id, 'Linea eliminada, pedido ' || p_order_id);
      end loop;
    end if;

    delete from public.order_items
    where order_id = p_order_id
      and (v_kept_ids is null or not (id = any(v_kept_ids)));

    for v_item in select * from jsonb_array_elements(v_items_patch) loop
      if not v_cancelling then
        select product_id, quantity into v_old_item
        from public.order_items where id = (v_item->>'id')::uuid and order_id = p_order_id;

        if v_old_item.product_id is not null and v_old_item.quantity is distinct from (v_item->>'quantity')::numeric then
          insert into public.stock_movements (product_id, type, quantity, order_id, reason)
          values (
            v_old_item.product_id,
            case when (v_item->>'quantity')::numeric < v_old_item.quantity then 'entrada' else 'salida' end,
            abs((v_item->>'quantity')::numeric - v_old_item.quantity),
            p_order_id,
            'Ajuste de cantidad, pedido ' || p_order_id
          );
        end if;
      end if;

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
    status = coalesce(v_new_status, status),
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
