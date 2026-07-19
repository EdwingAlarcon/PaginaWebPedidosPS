alter table public.customers
  add column if not exists locality text not null default '';
