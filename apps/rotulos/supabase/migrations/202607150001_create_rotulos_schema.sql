create extension if not exists pgcrypto;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  department text not null default '',
  city text not null default '',
  address text not null default '',
  neighborhood text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  default_sender jsonb not null,
  logo_url text not null default '/purple-shop-logo.png',
  qr_url text not null default '/purple-shop-qr.png',
  instagram_user text not null default '@PURPLESHOP.ONLINE',
  brand_phrase text not null default 'Detalles que viajan con amor',
  brand_colors jsonb not null,
  label_size jsonb not null default '{"widthCm":14,"heightCm":11}'::jsonb,
  default_template text not null default 'purpleshop-classic',
  order_number_config jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_sequences (
  id uuid primary key default gen_random_uuid(),
  scope_key text not null unique,
  current_value bigint not null default 0,
  reset_policy text not null default 'annual',
  updated_at timestamptz not null default now()
);

create table if not exists public.labels (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  sender jsonb not null,
  recipient jsonb not null,
  shipment jsonb not null,
  payment_method text not null check (payment_method in ('pagado', 'contraentrega')),
  cod_amount numeric not null default 0,
  package_count integer not null default 1 check (package_count > 0),
  carrier text not null,
  status text not null default 'generado' check (status in ('borrador', 'generado', 'impreso', 'anulado')),
  pdf_url text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists labels_created_at_idx on public.labels (created_at desc);
create index if not exists labels_order_number_idx on public.labels (order_number);
create index if not exists labels_recipient_city_idx on public.labels ((recipient->>'city'));
create index if not exists customers_phone_idx on public.customers (phone);

alter table public.customers enable row level security;
alter table public.settings enable row level security;
alter table public.order_sequences enable row level security;
alter table public.labels enable row level security;

grant select, insert, update, delete on public.customers to authenticated;
grant select, insert, update, delete on public.settings to authenticated;
grant select, insert, update, delete on public.labels to authenticated;

create policy "Authenticated users can read customers."
  on public.customers for select to authenticated
  using (true);

create policy "Authenticated users can insert customers."
  on public.customers for insert to authenticated
  with check (true);

create policy "Authenticated users can update customers."
  on public.customers for update to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete customers."
  on public.customers for delete to authenticated
  using (true);

create policy "Authenticated users can read settings."
  on public.settings for select to authenticated
  using (true);

create policy "Authenticated users can insert settings."
  on public.settings for insert to authenticated
  with check (true);

create policy "Authenticated users can update settings."
  on public.settings for update to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can read labels."
  on public.labels for select to authenticated
  using (true);

create policy "Authenticated users can insert labels."
  on public.labels for insert to authenticated
  with check (true);

create policy "Authenticated users can update labels."
  on public.labels for update to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete labels."
  on public.labels for delete to authenticated
  using (true);

create or replace function public.reserve_order_number(
  p_scope_key text,
  p_prefix text,
  p_suffix text,
  p_pattern text,
  p_sequence_digits integer,
  p_date_format text,
  p_reset_policy text,
  p_label_date date,
  p_city text,
  p_department text,
  p_manual_order_number text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_value bigint;
  sequence_text text;
  v_order_number text;
  year_text text;
  month_text text;
  day_text text;
  date_text text;
  city_text text;
  department_text text;
begin
  if p_manual_order_number is not null and length(trim(p_manual_order_number)) > 0 then
    if exists (select 1 from public.labels where order_number = trim(p_manual_order_number)) then
      raise exception 'duplicate_order_number';
    end if;
    return trim(p_manual_order_number);
  end if;

  insert into public.order_sequences (scope_key, current_value, reset_policy)
  values (p_scope_key, 0, p_reset_policy)
  on conflict (scope_key) do nothing;

  update public.order_sequences
  set current_value = current_value + 1,
      reset_policy = p_reset_policy,
      updated_at = now()
  where scope_key = p_scope_key
  returning current_value into next_value;

  year_text := to_char(p_label_date, 'YYYY');
  month_text := to_char(p_label_date, 'MM');
  day_text := to_char(p_label_date, 'DD');
  date_text := case p_date_format
    when 'YYYYMMDD' then to_char(p_label_date, 'YYYYMMDD')
    when 'YYYYMM' then to_char(p_label_date, 'YYYYMM')
    else to_char(p_label_date, 'YYYY')
  end;
  city_text := upper(regexp_replace(coalesce(p_city, ''), '[^[:alnum:]]+', '', 'g'));
  department_text := upper(regexp_replace(coalesce(p_department, ''), '[^[:alnum:]]+', '', 'g'));
  sequence_text := next_value::text;
  sequence_text := case
    when length(sequence_text) >= p_sequence_digits then sequence_text
    else lpad(sequence_text, p_sequence_digits, '0')
  end;

  v_order_number := p_pattern;
  v_order_number := replace(v_order_number, '{PREFIX}', upper(regexp_replace(coalesce(p_prefix, ''), '[^[:alnum:]]+', '', 'g')));
  v_order_number := replace(v_order_number, '{SUFFIX}', upper(regexp_replace(coalesce(p_suffix, ''), '[^[:alnum:]]+', '', 'g')));
  v_order_number := replace(v_order_number, '{YEAR}', year_text);
  v_order_number := replace(v_order_number, '{MONTH}', month_text);
  v_order_number := replace(v_order_number, '{DAY}', day_text);
  v_order_number := replace(v_order_number, '{DATE}', date_text);
  v_order_number := replace(v_order_number, '{SEQUENCE}', sequence_text);
  v_order_number := replace(v_order_number, '{CITY}', city_text);
  v_order_number := replace(v_order_number, '{DEPARTMENT}', department_text);

  if exists (select 1 from public.labels where labels.order_number = v_order_number) then
    raise exception 'duplicate_order_number';
  end if;

  return v_order_number;
end;
$$;

revoke all on function public.reserve_order_number(text, text, text, text, integer, text, text, date, text, text, text) from public;
grant execute on function public.reserve_order_number(text, text, text, text, integer, text, text, date, text, text, text) to authenticated;
