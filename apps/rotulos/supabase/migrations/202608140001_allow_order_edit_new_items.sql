-- update_order: permite agregar lineas nuevas al editar pedidos, manteniendo
-- movimientos compensatorios de stock y registro en order_edits.
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
  v_item_id uuid;
  v_product_id uuid;
  v_new_status text := p_patch->>'status';
  v_cancelling boolean;
  v_old_item record;
  v_changes jsonb := '{}'::jsonb;
  v_items_changes jsonb := '[]'::jsonb;
  v_item_change jsonb;
begin
  select * into v_current from public.orders where id = p_order_id;
  if v_current is null then
    raise exception 'order_not_found';
  end if;

  v_cancelling := coalesce(v_new_status = 'cancelled' and v_current.status <> 'cancelled', false);

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
    select array_remove(array_agg((item->>'id')::uuid), null) into v_kept_ids
    from jsonb_array_elements(v_items_patch) as item;

    if not v_cancelling then
      for v_old_item in
        select id, product_id, quantity, unit_price, product_name from public.order_items
        where order_id = p_order_id
          and (v_kept_ids is null or not (id = any(v_kept_ids)))
      loop
        v_items_changes := v_items_changes || jsonb_build_array(jsonb_build_object(
          'id', v_old_item.id,
          'productName', v_old_item.product_name,
          'removed', true
        ));
        if v_old_item.product_id is not null then
          insert into public.stock_movements (product_id, type, quantity, order_id, reason)
          values (v_old_item.product_id, 'entrada', v_old_item.quantity, p_order_id, 'Linea eliminada, pedido ' || p_order_id);
        end if;
      end loop;
    end if;

    delete from public.order_items
    where order_id = p_order_id
      and (v_kept_ids is null or not (id = any(v_kept_ids)));

    for v_item in select * from jsonb_array_elements(v_items_patch) loop
      v_item_id := (v_item->>'id')::uuid;
      v_product_id := nullif(v_item->>'productId', '')::uuid;
      v_old_item := null;
      select id, product_id, quantity, unit_price, product_name into v_old_item
      from public.order_items where id = v_item_id and order_id = p_order_id;

      if v_old_item.id is null then
        if not v_cancelling and v_product_id is not null then
          insert into public.stock_movements (product_id, type, quantity, order_id, reason)
          values (v_product_id, 'salida', (v_item->>'quantity')::numeric, p_order_id, 'Linea agregada, pedido ' || p_order_id);
        end if;

        insert into public.order_items (
          id,
          order_id,
          product_id,
          product_code,
          product_name,
          category,
          quantity,
          unit_price,
          total
        )
        values (
          v_item_id,
          p_order_id,
          v_product_id,
          v_item->>'productCode',
          v_item->>'productName',
          coalesce(v_item->>'category', ''),
          (v_item->>'quantity')::numeric,
          (v_item->>'unitPrice')::numeric,
          (v_item->>'quantity')::numeric * (v_item->>'unitPrice')::numeric
        );

        v_items_changes := v_items_changes || jsonb_build_array(jsonb_build_object(
          'id', v_item_id,
          'productName', v_item->>'productName',
          'added', true,
          'quantity', (v_item->>'quantity')::numeric,
          'unitPrice', (v_item->>'unitPrice')::numeric
        ));
      else
        if not v_cancelling and v_old_item.product_id is distinct from v_product_id then
          if v_old_item.product_id is not null then
            insert into public.stock_movements (product_id, type, quantity, order_id, reason)
            values (v_old_item.product_id, 'entrada', v_old_item.quantity, p_order_id, 'Cambio de producto, pedido ' || p_order_id);
          end if;
          if v_product_id is not null then
            insert into public.stock_movements (product_id, type, quantity, order_id, reason)
            values (v_product_id, 'salida', (v_item->>'quantity')::numeric, p_order_id, 'Cambio de producto, pedido ' || p_order_id);
          end if;
        elsif not v_cancelling and v_old_item.product_id is not null and v_old_item.quantity is distinct from (v_item->>'quantity')::numeric then
          insert into public.stock_movements (product_id, type, quantity, order_id, reason)
          values (
            v_old_item.product_id,
            case when (v_item->>'quantity')::numeric < v_old_item.quantity then 'entrada' else 'salida' end,
            abs((v_item->>'quantity')::numeric - v_old_item.quantity),
            p_order_id,
            'Ajuste de cantidad, pedido ' || p_order_id
          );
        end if;

        v_item_change := '{}'::jsonb;
        if v_old_item.quantity is distinct from (v_item->>'quantity')::numeric then
          v_item_change := v_item_change || jsonb_build_object('quantity', jsonb_build_object('before', v_old_item.quantity, 'after', (v_item->>'quantity')::numeric));
        end if;
        if v_old_item.unit_price is distinct from (v_item->>'unitPrice')::numeric then
          v_item_change := v_item_change || jsonb_build_object('unitPrice', jsonb_build_object('before', v_old_item.unit_price, 'after', (v_item->>'unitPrice')::numeric));
        end if;
        if v_item_change <> '{}'::jsonb then
          v_items_changes := v_items_changes || jsonb_build_array(
            jsonb_build_object('id', v_item_id, 'productName', v_item->>'productName') || v_item_change
          );
        end if;

        update public.order_items set
          product_id = v_product_id,
          product_code = v_item->>'productCode',
          product_name = v_item->>'productName',
          category = coalesce(v_item->>'category', ''),
          quantity = (v_item->>'quantity')::numeric,
          unit_price = (v_item->>'unitPrice')::numeric,
          total = (v_item->>'quantity')::numeric * (v_item->>'unitPrice')::numeric
        where id = v_item_id and order_id = p_order_id;
      end if;

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

  if p_patch->'customer' is not null and v_current.customer_snapshot is distinct from p_patch->'customer' then
    v_changes := v_changes || jsonb_build_object('customer', jsonb_build_object('before', v_current.customer_snapshot, 'after', p_patch->'customer'));
  end if;
  if p_patch->>'orderDate' is not null and v_current.order_date is distinct from (p_patch->>'orderDate')::date then
    v_changes := v_changes || jsonb_build_object('orderDate', jsonb_build_object('before', v_current.order_date, 'after', (p_patch->>'orderDate')::date));
  end if;
  if v_new_status is not null and v_current.status is distinct from v_new_status then
    v_changes := v_changes || jsonb_build_object('status', jsonb_build_object('before', v_current.status, 'after', v_new_status));
  end if;
  if v_current.notes is distinct from v_notes then
    v_changes := v_changes || jsonb_build_object('notes', jsonb_build_object('before', v_current.notes, 'after', v_notes));
  end if;
  if v_current.discount is distinct from v_discount then
    v_changes := v_changes || jsonb_build_object('discount', jsonb_build_object('before', v_current.discount, 'after', v_discount));
  end if;
  if v_current.shipping_cost is distinct from v_shipping_cost then
    v_changes := v_changes || jsonb_build_object('shippingCost', jsonb_build_object('before', v_current.shipping_cost, 'after', v_shipping_cost));
  end if;
  if v_current.subtotal is distinct from v_subtotal then
    v_changes := v_changes || jsonb_build_object('subtotal', jsonb_build_object('before', v_current.subtotal, 'after', v_subtotal));
  end if;
  if v_current.total is distinct from v_total then
    v_changes := v_changes || jsonb_build_object('total', jsonb_build_object('before', v_current.total, 'after', v_total));
  end if;
  if jsonb_array_length(v_items_changes) > 0 then
    v_changes := v_changes || jsonb_build_object('items', v_items_changes);
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

  if v_reason is null and v_changes ? 'customer' and (select count(*) from jsonb_object_keys(v_changes)) = 1 then
    v_changes := '{}'::jsonb;
  end if;

  if v_changes <> '{}'::jsonb then
    insert into public.order_edits (order_id, changes, reason)
    values (p_order_id, v_changes, v_reason);
  end if;

  return v_current;
end;
$$;

revoke all on function public.update_order(uuid, jsonb) from public;
grant execute on function public.update_order(uuid, jsonb) to authenticated;
