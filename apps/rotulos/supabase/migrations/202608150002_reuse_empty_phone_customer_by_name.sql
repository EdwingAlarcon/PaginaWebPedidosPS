-- Evita duplicar clientes importados sin telefono cuando luego llega un
-- pedido real del mismo nombre con telefono. Mantiene el criterio principal
-- por telefono para no mezclar homonimos con telefonos distintos.
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
  v_phone text := coalesce(p_customer->>'phone', '');
  v_customer_name text := lower(regexp_replace(trim(coalesce(p_customer->>'fullName', '')), '\s+', ' ', 'g'));
  v_order public.orders;
begin
  if v_phone <> '' then
    select id into v_customer_id from public.customers where phone = v_phone;

    if v_customer_id is null and v_customer_name <> '' then
      select id into v_customer_id
      from public.customers
      where phone = ''
        and lower(regexp_replace(trim(full_name), '\s+', ' ', 'g')) = v_customer_name
      order by updated_at desc
      limit 1;
    end if;
  end if;

  if v_customer_id is null then
    insert into public.customers (full_name, phone, email, department, city, locality, address, neighborhood)
    values (
      p_customer->>'fullName', v_phone, coalesce(p_customer->>'email', ''),
      coalesce(p_customer->>'department', ''), coalesce(p_customer->>'city', ''),
      coalesce(p_customer->>'locality', ''), coalesce(p_customer->>'address', ''),
      coalesce(p_customer->>'neighborhood', '')
    )
    returning id into v_customer_id;
  else
    update public.customers set
      full_name = p_customer->>'fullName',
      phone = case when v_phone <> '' then v_phone else phone end,
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

-- Limpieza unica del caso ya creado: si un nombre tiene exactamente un
-- cliente con telefono y uno o mas clientes sin telefono, mueve los pedidos
-- de los clientes sin telefono al cliente con telefono y borra las fichas
-- vacias.
do $$
declare
  v_group record;
  v_source record;
  v_target public.customers;
begin
  for v_group in
    select lower(regexp_replace(trim(full_name), '\s+', ' ', 'g')) as match_name
    from public.customers
    group by 1
    having count(*) filter (where phone <> '') = 1
       and count(*) filter (where phone = '') >= 1
  loop
    select * into v_target
    from public.customers
    where lower(regexp_replace(trim(full_name), '\s+', ' ', 'g')) = v_group.match_name
      and phone <> ''
    order by updated_at desc
    limit 1;

    for v_source in
      select *
      from public.customers
      where lower(regexp_replace(trim(full_name), '\s+', ' ', 'g')) = v_group.match_name
        and phone = ''
        and id <> v_target.id
    loop
      update public.orders
      set
        customer_id = v_target.id,
        customer_snapshot = jsonb_build_object(
          'fullName', v_target.full_name,
          'phone', v_target.phone,
          'email', v_target.email,
          'department', v_target.department,
          'city', v_target.city,
          'locality', coalesce(v_target.locality, ''),
          'address', v_target.address,
          'neighborhood', v_target.neighborhood
        ),
        updated_at = now()
      where customer_id = v_source.id;

      delete from public.customers where id = v_source.id;
    end loop;
  end loop;
end;
$$;
