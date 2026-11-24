-- Seguridad (auditoria 2026-11-24): las RPC `security definer` no validan quien
-- llama en su cuerpo y solo hacian `revoke ... from public`, que NO quita el
-- permiso directo que Supabase otorga a `anon` por privilegios por defecto.
-- Ademas `enforce_allowlist` deja pasar a `anon`. Con la anon key publica
-- cualquiera podria llamar /rest/v1/rpc/<funcion> sin cuenta.
--
-- Antes de aplicar, verificar (solo lectura):
--   select p.oid::regprocedure as fn, has_function_privilege('anon', p.oid, 'execute') as anon_can_execute
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'public'
--     and p.proname in ('save_order','update_order','merge_customers','reserve_order_number');
--
-- Idempotente; no toca datos.

revoke execute on function public.save_order(jsonb, jsonb, jsonb) from anon;
revoke execute on function public.update_order(uuid, jsonb) from anon;
revoke execute on function public.merge_customers(uuid, uuid) from anon;
revoke execute on function public.reserve_order_number(text, text, text, text, integer, text, text, date, text, text, text) from anon;

-- Que las funciones futuras no hereden el permiso de anon.
alter default privileges in schema public revoke execute on functions from anon;
