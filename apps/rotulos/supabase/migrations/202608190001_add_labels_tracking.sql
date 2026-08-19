-- Numero de guia de la transportadora y, opcionalmente, el link de rastreo
-- que da la transportadora (se pega a mano; no se genera automaticamente
-- porque el formato de URL varia por transportadora y cambia con el tiempo).
alter table public.labels
  add column if not exists tracking_number text,
  add column if not exists tracking_url text;
