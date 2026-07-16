create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default '',
  sku text not null default '',
  unit_price numeric not null default 0,
  current_stock numeric not null default 0,
  min_stock numeric not null default 0,
  max_stock numeric,
  last_restock_date timestamptz,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  type text not null check (type in ('entrada', 'salida', 'ajuste', 'transferencia')),
  quantity numeric not null check (quantity <> 0),
  reason text not null default '',
  supplier text not null default '',
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category);
create unique index if not exists products_sku_unique_idx on public.products (sku) where sku <> '';
create index if not exists stock_movements_product_id_idx on public.stock_movements (product_id);
create index if not exists stock_movements_created_at_idx on public.stock_movements (created_at desc);

alter table public.products enable row level security;
alter table public.stock_movements enable row level security;

grant select, insert, update, delete on public.products to authenticated;
grant select, insert on public.stock_movements to authenticated;

create policy "Authenticated users can read products."
  on public.products for select to authenticated
  using (true);

create policy "Authenticated users can insert products."
  on public.products for insert to authenticated
  with check (created_by = auth.uid());

create policy "Authenticated users can update products."
  on public.products for update to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete products."
  on public.products for delete to authenticated
  using (true);

create policy "Authenticated users can read stock movements."
  on public.stock_movements for select to authenticated
  using (true);

create policy "Authenticated users can insert stock movements."
  on public.stock_movements for insert to authenticated
  with check (created_by = auth.uid());

create or replace function public.apply_stock_movement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_stock numeric;
begin
  select current_stock into v_current_stock from public.products where id = new.product_id for update;

  if new.type = 'salida' and v_current_stock < new.quantity then
    raise exception 'stock_insuficiente';
  end if;

  if new.type = 'entrada' then
    update public.products
    set current_stock = current_stock + new.quantity,
        last_restock_date = now(),
        updated_at = now()
    where id = new.product_id;
  elsif new.type = 'salida' then
    update public.products
    set current_stock = current_stock - new.quantity,
        updated_at = now()
    where id = new.product_id;
  else
    update public.products
    set current_stock = current_stock + new.quantity,
        updated_at = now()
    where id = new.product_id;
  end if;

  return new;
end;
$$;

create trigger stock_movements_apply
  after insert on public.stock_movements
  for each row execute function public.apply_stock_movement();
