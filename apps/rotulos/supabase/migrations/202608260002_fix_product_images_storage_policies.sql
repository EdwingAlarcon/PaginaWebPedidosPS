-- 202608260002_fix_product_images_storage_policies.sql
--
-- La migracion 202608250001_add_product_codes_image.sql nunca se aplico
-- completa en produccion -- confirmado el 2026-08-26: la columna
-- product_codes.image_url no existia (error 42703 al hacer select) y el
-- bucket product-images tampoco (storage.listBuckets() vacio). El boton
-- de subir foto de producto estuvo roto desde que se lanzo (25 de
-- agosto) sin que nadie lo notara porque nunca se probo con un archivo
-- real. El bucket ya se creo via Storage API con service role
-- (equivalente al insert de abajo, sin necesidad de correrlo de nuevo):
--   insert into storage.buckets (id, name, public)
--   values ('product-images', 'product-images', true)
--   on conflict (id) do nothing;
--
-- Esta migracion agrega la columna que falta y re-asegura las policies
-- de storage.objects de forma idempotente (drop + create).
alter table public.product_codes
  add column if not exists image_url text;
drop policy if exists "Authenticated users can upload product images." on storage.objects;
create policy "Authenticated users can upload product images."
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images');

drop policy if exists "Authenticated users can update product images." on storage.objects;
create policy "Authenticated users can update product images."
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images');

drop policy if exists "Authenticated users can delete product images." on storage.objects;
create policy "Authenticated users can delete product images."
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images');

drop policy if exists "Anyone can read product images." on storage.objects;
create policy "Anyone can read product images."
  on storage.objects for select to public
  using (bucket_id = 'product-images');
