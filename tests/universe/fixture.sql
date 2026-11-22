create role anon;
create role authenticated;
create schema auth;
create function auth.uid() returns uuid language sql stable
  as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
create function auth.jwt() returns jsonb language sql stable
  as $$ select coalesce(nullif(current_setting('test.jwt', true), ''), '{}')::jsonb $$;
create table auth.users (
  id uuid primary key, email text, email_confirmed_at timestamptz, is_anonymous boolean default false,
  role text default 'authenticated', raw_user_meta_data jsonb default '{}', raw_app_meta_data jsonb default '{"provider":"email"}',
  invited_at timestamptz
);
create table public.user_data (user_id uuid, tool text, data jsonb, primary key (user_id, tool));
create table public.vault_cloud_snapshots (owner_user_id uuid primary key, recovery_key jsonb, encrypted_config jsonb, encrypted_data jsonb);
create table public.wishlist_public_profiles (user_id uuid primary key, display_name text not null);
create table public.wg_spaces (id uuid primary key, owner_id uuid, payload jsonb);
create table public.wg_members (wg_id uuid, user_id uuid);
insert into auth.users (id, email, email_confirmed_at) values
 ('00000000-0000-4000-8000-000000000001', 'a@example.invalid', now()),
 ('00000000-0000-4000-8000-000000000002', 'b@example.invalid', now()),
 ('00000000-0000-4000-8000-000000000003', 'c@example.invalid', null);
