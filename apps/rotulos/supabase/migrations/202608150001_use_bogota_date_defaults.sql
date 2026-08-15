alter table public.orders
  alter column order_date set default ((now() at time zone 'America/Bogota')::date);
