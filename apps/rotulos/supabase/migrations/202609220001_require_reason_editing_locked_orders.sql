-- update_order: exige motivo de ajuste (adjustmentReason) al tocar items,
-- descuento o envio de un pedido ya completado o pagado en su totalidad.
-- Antes solo habia un window.confirm() en el navegador, facil de saltar y
-- sin rastro; ahora la RPC rechaza el cambio si no viene un motivo, tanto
-- para "completado" como para "pagado" (el estado de pago no se guarda en
-- orders, se calcula sumando order_payments).
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
  v_paid numeric;
  v_locked boolean;
  v_touches_money boolean;
begin
  select * into v_current from public.orders where id = p_order_id;
  if v_current is null then
    raise exception 'order_not_found';
  end if;

  select coalesce(sum(amount), 0) into v_paid
  from public.order_payments where order_id = p_order_id;

  v_locked := v_current.status = 'completed' or v_paid >= v_current.total;
  -- El cliente siempre manda discount/shippingCost en el patch aunque no cambien;
  -- comparar contra el valor actual evita pedir motivo quando solo se edito, por
  -- ejemplo, el nombre del cliente.
  v_touches_money := v_items_patch is not null
    or (p_patch ? 'discount' and (p_patch->>'discount')::numeric is distinct from v_current.discount)
    or (p_patch ? 'shippingCost' and (p_patch->>'shippingCost')::numeric is distinct from v_current.shipping_cost);

  if v_locked and v_touches_money and (v_reason is null or length(trim(v_reason)) = 0) then
    raise exception 'adjustment_reason_required';
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
