-- 202608250002_add_catalog_contact_settings.sql
alter table public.settings
  add column if not exists email text not null default '',
  add column if not exists facebook_user text not null default '',
  add column if not exists tiktok_user text not null default '';
