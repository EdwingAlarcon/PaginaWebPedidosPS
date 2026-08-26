-- 202608260001_add_product_codes_supplier_price.sql
alter table public.product_codes
  add column if not exists supplier_price numeric not null default 0;
