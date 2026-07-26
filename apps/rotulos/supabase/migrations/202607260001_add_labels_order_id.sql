-- Vincula un rotulo a un pedido real (orders.id). Nullable: no se migra
-- retroactivamente historicos sin vinculo (mismo criterio de riesgo aceptado
-- que la normalizacion a mayuscula, ver CLAUDE.md).
alter table public.labels
  add column if not exists order_id uuid references public.orders(id) on delete set null;

create index if not exists labels_order_id_idx on public.labels (order_id);
