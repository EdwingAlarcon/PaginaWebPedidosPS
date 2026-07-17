create table if not exists public.allowed_users (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.allowed_users enable row level security;

create policy "usuario autenticado lee su propia fila"
  on public.allowed_users
  for select
  using (email = (auth.jwt() ->> 'email'));
