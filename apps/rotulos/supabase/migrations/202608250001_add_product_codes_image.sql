-- 202608250001_add_product_codes_image.sql
alter table public.product_codes
  add column if not exists image_url text;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload product images."
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images');

create policy "Authenticated users can update product images."
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images');

create policy "Authenticated users can delete product images."
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images');

create policy "Anyone can read product images."
  on storage.objects for select to public
  using (bucket_id = 'product-images');
