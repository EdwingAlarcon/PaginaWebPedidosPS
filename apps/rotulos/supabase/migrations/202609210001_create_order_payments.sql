-- Abonos/pagos por pedido. Un pedido puede tener varios abonos; el saldo se
-- calcula en la app (total del pedido menos la suma de sus pagos).
-- Tabla aparte (no columnas en orders) para no tocar las RPC save_order /
-- update_order ni el flujo existente de pedidos.
create table if not exists public.order_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  method text not null default 'efectivo'
    check (method in ('efectivo', 'transferencia', 'nequi', 'daviplata', 'otro')),
  paid_at date not null default (timezone('America/Bogota', now()))::date,
  note text not null default '',
  created_by text not null default (coalesce(auth.jwt() ->> 'email', auth.uid()::text, 'sistema')),
  created_at timestamptz not null default now()
);

create index if not exists order_payments_order_id_idx on public.order_payments (order_id);

alter table public.order_payments enable row level security;
grant select, insert, delete on public.order_payments to authenticated;

drop policy if exists "Authenticated users can read order payments." on public.order_payments;
create policy "Authenticated users can read order payments."
  on public.order_payments for select to authenticated
  using (true);

drop policy if exists "Authenticated users can insert order payments." on public.order_payments;
create policy "Authenticated users can insert order payments."
  on public.order_payments for insert to authenticated
  with check (true);

drop policy if exists "Authenticated users can delete order payments." on public.order_payments;
create policy "Authenticated users can delete order payments."
  on public.order_payments for delete to authenticated
  using (true);
