-- Toolya dashboard unified shopping: additive only.
-- Existing WG shopping, wishlist and all other Toolya snapshots are untouched.
create table if not exists public.dashboard_shopping_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 160),
  completed boolean not null default false,
  revision bigint not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint dashboard_shopping_title_no_control check (title !~ '[[:cntrl:]]')
);
create index if not exists dashboard_shopping_user_idx
 on public.dashboard_shopping_items (user_id,created_at) where deleted_at is null;
alter table public.dashboard_shopping_items enable row level security;
create policy dashboard_shopping_select_own on public.dashboard_shopping_items
  for select to authenticated using (user_id = (select auth.uid()));
create policy dashboard_shopping_insert_own on public.dashboard_shopping_items
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy dashboard_shopping_update_own on public.dashboard_shopping_items
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy dashboard_shopping_delete_own on public.dashboard_shopping_items
  for delete to authenticated using (user_id = (select auth.uid()));
revoke all on public.dashboard_shopping_items from anon;
grant select,insert,update,delete on public.dashboard_shopping_items to authenticated;
