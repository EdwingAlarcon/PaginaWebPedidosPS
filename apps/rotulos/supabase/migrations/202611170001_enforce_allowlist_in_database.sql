-- Seguridad (auditoria 2026-11-17): la lista allowed_users solo se validaba
-- en la app (proxy.ts / require-session.ts). Las politicas RLS dejaban pasar a
-- CUALQUIER usuario con rol `authenticated`, y Supabase Auth permite crear
-- cuentas desde fuera de la app con la anon key publica. Resultado: alguien
-- ajeno podia leer y modificar clientes, pedidos, pagos, etc. llamando a la
-- API de Supabase directamente, sin pasar por la app.
--
-- Esta migracion hace cumplir la lista en la base de datos, en tres capas:
--   1. public.is_allowed_user(): el JWT debe venir de Microsoft (azure) y su
--      email debe estar en allowed_users.
--   2. Politicas RESTRICTIVAS en todas las tablas de negocio y en Storage:
--      se suman (AND) a las politicas existentes, que no se tocan.
--   3. Guardia previa de PostgREST (db_pre_request): cubre tambien las
--      funciones `security definer` (save_order, update_order,
--      merge_customers, reserve_order_number), que se saltan RLS.
--
-- Es idempotente y no modifica ni borra datos.
--
-- REVERSION (si algo fallara tras aplicarla):
--   alter role authenticator reset pgrst.db_pre_request;
--   notify pgrst, 'reload config';
--   -- y, por tabla: drop policy "Solo usuarios de la lista." on public.<tabla>;

create or replace function public.is_allowed_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce((auth.jwt() -> 'app_metadata' -> 'providers') ? 'azure', false)
    and exists (
      select 1
      from public.allowed_users
      where lower(email) = lower(auth.jwt() ->> 'email')
    );
$$;

revoke all on function public.is_allowed_user() from public;
grant execute on function public.is_allowed_user() to anon, authenticated, service_role;

-- 2a. Politicas restrictivas en las tablas de negocio.
do $$
declare
  t text;
begin
  foreach t in array array[
    'customers', 'orders', 'order_items', 'product_codes', 'settings',
    'order_sequences', 'labels', 'products', 'stock_movements',
    'order_edits', 'order_payments', 'backup_restore_runs'
  ]
  loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('drop policy if exists "Solo usuarios de la lista." on public.%I', t);
      execute format(
        'create policy "Solo usuarios de la lista." on public.%I as restrictive for all to authenticated using ((select public.is_allowed_user())) with check ((select public.is_allowed_user()))',
        t
      );
    end if;
  end loop;
end
$$;

-- allowed_users: solo lectura de la fila propia (politica existente). Se
-- retiran permisos de escritura por si quedaron de los grants por defecto; la
-- administracion de la lista va por /api/allowed-users con service role.
revoke insert, update, delete, truncate on public.allowed_users from anon, authenticated;

-- 2b. Storage. Los buckets `backups` (privado) y `product-images` (publico por
-- URL) solo aceptan operaciones via API de usuarios de la lista.
drop policy if exists "Solo usuarios de la lista (storage)." on storage.objects;
create policy "Solo usuarios de la lista (storage)."
  on storage.objects as restrictive for all to authenticated
  using ((select public.is_allowed_user()))
  with check ((select public.is_allowed_user()));

-- El bucket product-images es publico: las fotos se siguen viendo por su URL
-- publica (catalogo, PDF) sin necesidad de politica. La politica `to public`
-- solo servia para que cualquiera LISTARA todo el bucket sin sesion.
drop policy if exists "Anyone can read product images." on storage.objects;
drop policy if exists "Allowed users can read product images." on storage.objects;
create policy "Allowed users can read product images."
  on storage.objects for select to authenticated
  using (bucket_id = 'product-images');

-- 3. Guardia previa de PostgREST: toda peticion REST/RPC con rol
-- `authenticated` debe ser de un usuario de la lista. `anon` (sin permisos
-- sobre las tablas) y `service_role` (servidor) pasan sin cambio. Se deja
-- pasar la lectura de allowed_users para que la app pueda responder
-- "cuenta sin acceso" en vez de un error.
create or replace function public.enforce_allowlist()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.role() = 'authenticated'
     and coalesce(current_setting('request.path', true), '') not like '%/allowed_users'
     and not public.is_allowed_user() then
    raise exception 'Cuenta sin acceso a Purple Shop.'
      using errcode = '42501';
  end if;
end
$$;

revoke all on function public.enforce_allowlist() from public;
grant execute on function public.enforce_allowlist() to anon, authenticated, service_role;

alter role authenticator set pgrst.db_pre_request = 'public.enforce_allowlist';
notify pgrst, 'reload config';
