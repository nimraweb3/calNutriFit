-- Run in a fresh Supabase / Lovable PostgreSQL project.
-- Catalog snapshots are intentionally stored in the user-owned document.
create table if not exists public.tracker_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint object_data check (jsonb_typeof(data) = 'object'),
  constraint bounded_data check (octet_length(data::text) < 5000000),
  constraint valid_entries check (data ? 'entries' and jsonb_typeof(data->'entries') = 'array'),
  constraint valid_workouts check (data ? 'workouts' and jsonb_typeof(data->'workouts') = 'array')
);
alter table public.tracker_state enable row level security;
revoke all on public.tracker_state from anon;
grant select, insert, update, delete on public.tracker_state to authenticated;
create policy "Read own journal" on public.tracker_state for select to authenticated using ((select auth.uid()) = user_id);
create policy "Create own journal" on public.tracker_state for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own journal" on public.tracker_state for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Delete own journal" on public.tracker_state for delete to authenticated using ((select auth.uid()) = user_id);
