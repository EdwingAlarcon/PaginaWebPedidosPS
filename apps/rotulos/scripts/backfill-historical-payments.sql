-- Equivalente en SQL de scripts/backfill-historical-payments.ts, para correr en el
-- SQL Editor de Supabase (rol postgres, sin service role en la maquina).
-- Registra como pagados los pedidos COMPLETADOS sin ningun abono: un pago por el
-- total, fecha = fecha del pedido, metodo 'transferencia', nota marcadora para revertir.
-- Idempotente: no toca pedidos con pagos, pendientes ni cancelados.

-- 1) Vista previa (no escribe). Esperado hoy: 97 pedidos / 13366200.
select count(*) as pedidos, sum(o.total) as total
from public.orders o
where o.status = 'completed'
  and o.total > 0
  and not exists (select 1 from public.order_payments p where p.order_id = o.id);

-- 2) Escritura.
insert into public.order_payments (order_id, amount, method, paid_at, note, created_by)
select o.id, o.total, 'transferencia', o.order_date, 'PAGO HISTORICO (ASUMIDO)', 'sistema'
from public.orders o
where o.status = 'completed'
  and o.total > 0
  and not exists (select 1 from public.order_payments p where p.order_id = o.id);

-- Si ya habias corrido este script con metodo 'otro', pasalos a transferencia:
-- update public.order_payments set method = 'transferencia'
-- where note = 'PAGO HISTORICO (ASUMIDO)' and created_by = 'sistema';

-- Revertir:
-- delete from public.order_payments
-- where note = 'PAGO HISTORICO (ASUMIDO)' and created_by = 'sistema';
