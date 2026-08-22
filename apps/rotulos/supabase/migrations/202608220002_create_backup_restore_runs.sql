create table if not exists public.backup_restore_runs (
  id uuid primary key default gen_random_uuid(),
  requested_by text not null,
  requested_at timestamptz not null default now(),
  mode text not null check (mode in ('dry_run', 'execute')),
  source_backup_generated_at timestamptz,
  pre_restore_backup_filename text,
  status text not null check (status in ('planned', 'completed', 'failed')),
  summary jsonb not null default '{}'::jsonb,
  selected_changes jsonb not null default '[]'::jsonb,
  error text
);

alter table public.backup_restore_runs enable row level security;

grant select on public.backup_restore_runs to authenticated;

drop policy if exists "Authenticated users can read backup restore runs." on public.backup_restore_runs;
create policy "Authenticated users can read backup restore runs."
  on public.backup_restore_runs
  for select
  to authenticated
  using (true);
