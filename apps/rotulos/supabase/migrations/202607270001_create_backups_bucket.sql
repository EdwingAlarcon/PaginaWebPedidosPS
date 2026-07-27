insert into storage.buckets (id, name, public)
values ('backups', 'backups', false)
on conflict (id) do nothing;
