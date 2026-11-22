create table public.user_data (user_id uuid, tool text, data jsonb, primary key (user_id, tool));
create table public.vault_cloud_snapshots (owner_user_id uuid primary key, recovery_key jsonb, encrypted_config jsonb, encrypted_data jsonb);
create table public.wishlist_public_profiles (user_id uuid primary key, display_name text not null);
create table public.wg_spaces (id uuid primary key, owner_id uuid, payload jsonb);
create table public.wg_members (wg_id uuid, user_id uuid);
