-- Toolya Dashboard Sprint 1: additive, owner-scoped cloud storage.
-- Existing user_data, wishlist and browser localStorage are deliberately untouched.
create table if not exists public.dashboard_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  legacy_id text,
  title text not null check (char_length(title) between 1 and 160),
  completed boolean not null default false,
  due_at timestamptz,
  revision bigint not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint dashboard_tasks_legacy_id_length check (legacy_id is null or char_length(legacy_id) between 1 and 180),
  constraint dashboard_tasks_user_legacy_unique unique (user_id, legacy_id)
);
create index if not exists dashboard_tasks_user_due_idx on public.dashboard_tasks(user_id, due_at) where deleted_at is null;

create table if not exists public.dashboard_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  legacy_id text,
  title text not null check (char_length(title) between 1 and 160),
  due_at timestamptz not null,
  completed boolean not null default false,
  revision bigint not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint dashboard_reminders_legacy_id_length check (legacy_id is null or char_length(legacy_id) between 1 and 180),
  constraint dashboard_reminders_user_legacy_unique unique (user_id, legacy_id)
);
create index if not exists dashboard_reminders_user_due_idx on public.dashboard_reminders(user_id, due_at) where deleted_at is null;

create table if not exists public.dashboard_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object'),
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);

alter table public.dashboard_tasks enable row level security;
alter table public.dashboard_reminders enable row level security;
alter table public.dashboard_preferences enable row level security;

create policy dashboard_tasks_select_own on public.dashboard_tasks
  for select to authenticated using (user_id = (select auth.uid()));
create policy dashboard_tasks_insert_own on public.dashboard_tasks
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy dashboard_tasks_update_own on public.dashboard_tasks
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy dashboard_tasks_delete_own on public.dashboard_tasks
  for delete to authenticated using (user_id = (select auth.uid()));

create policy dashboard_reminders_select_own on public.dashboard_reminders
  for select to authenticated using (user_id = (select auth.uid()));
create policy dashboard_reminders_insert_own on public.dashboard_reminders
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy dashboard_reminders_update_own on public.dashboard_reminders
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy dashboard_reminders_delete_own on public.dashboard_reminders
  for delete to authenticated using (user_id = (select auth.uid()));

create policy dashboard_preferences_select_own on public.dashboard_preferences
  for select to authenticated using (user_id = (select auth.uid()));
create policy dashboard_preferences_insert_own on public.dashboard_preferences
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy dashboard_preferences_update_own on public.dashboard_preferences
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy dashboard_preferences_delete_own on public.dashboard_preferences
  for delete to authenticated using (user_id = (select auth.uid()));

revoke all on public.dashboard_tasks, public.dashboard_reminders, public.dashboard_preferences from anon;
grant select, insert, update, delete on public.dashboard_tasks, public.dashboard_reminders, public.dashboard_preferences to authenticated;
