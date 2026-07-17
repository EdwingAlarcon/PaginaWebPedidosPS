alter table public.labels
  add column if not exists size text not null default '14x12' check (size in ('10x9', '14x12'));
