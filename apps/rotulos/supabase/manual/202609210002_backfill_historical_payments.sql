-- ============================================================================
-- PAGOS HISTORICOS -> transferencia            (correr en el SQL Editor de Supabase)
-- ============================================================================
-- Registra como pagados por TRANSFERENCIA todos los pedidos COMPLETADOS que aun
-- no tienen ningun pago: un pago por el total, con fecha = fecha del pedido, nota
-- marcadora 'PAGO HISTORICO (ASUMIDO)'. No toca pedidos pendientes ni cancelados
-- ni los que ya tienen pagos (los 2 que registraste a mano se respetan).
--
-- Idempotente: se puede volver a correr (por ejemplo tras cada import de Excel).
-- Esta carpeta NO es de migraciones: `supabase db push` no la ejecuta; se corre a mano.
--
-- Orden: 1) vista previa   2) escritura   3) verificacion
-- ============================================================================


-- 1) VISTA PREVIA (no escribe). Esperado hoy: pedidos = 97, total = 13366200
select count(*) as pedidos, sum(o.total) as total
from public.orders o
where o.status = 'completed'
  and o.total > 0
  and not exists (select 1 from public.order_payments p where p.order_id = o.id);


-- 2) ESCRITURA
insert into public.order_payments (order_id, amount, method, paid_at, note, created_by)
select o.id, o.total, 'transferencia', o.order_date, 'PAGO HISTORICO (ASUMIDO)', 'sistema'
from public.orders o
where o.status = 'completed'
  and o.total > 0
  and not exists (select 1 from public.order_payments p where p.order_id = o.id);


-- 3) VERIFICACION. Esperado: sin_pago = 0 (todos los completados con pago) y
--    historicos = 97; el pedido pendiente (ZAIDA 212000) sigue sin pago a proposito.
select
  count(*) filter (where o.status = 'completed'
                     and not exists (select 1 from public.order_payments p where p.order_id = o.id)) as completados_sin_pago,
  (select count(*) from public.order_payments where note = 'PAGO HISTORICO (ASUMIDO)') as historicos,
  (select count(*) from public.order_payments) as pagos_total
from public.orders o;


-- ----------------------------------------------------------------------------
-- SOLO SI YA HABIAS CORRIDO UNA VERSION ANTERIOR con metodo 'otro': pasalos a
-- transferencia (descomenta y ejecuta).
-- ----------------------------------------------------------------------------
-- update public.order_payments
-- set method = 'transferencia'
-- where note = 'PAGO HISTORICO (ASUMIDO)' and created_by = 'sistema';


-- ----------------------------------------------------------------------------
-- REVERTIR (borra solo los pagos historicos asumidos; los tuyos no se tocan).
-- ----------------------------------------------------------------------------
-- delete from public.order_payments
-- where note = 'PAGO HISTORICO (ASUMIDO)' and created_by = 'sistema';
