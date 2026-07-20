alter table public.orders
  add column if not exists source text not null default 'app';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_source_check'
  ) then
    alter table public.orders
      add constraint orders_source_check check (source in ('app', 'excel_import'));
  end if;
end $$;

alter table public.orders
  add column if not exists import_batch_id uuid;

alter table public.orders
  add column if not exists import_row_key text;

create unique index if not exists orders_import_row_key_unique_idx
  on public.orders (import_row_key)
  where source = 'excel_import';
