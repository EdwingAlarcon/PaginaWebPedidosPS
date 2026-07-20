alter table public.customers
  add column if not exists source text not null default 'app';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'customers_source_check'
  ) then
    alter table public.customers
      add constraint customers_source_check check (source in ('app', 'excel_import'));
  end if;
end $$;
