do $$ begin create role service_role bypassrls; exception when duplicate_object then null; end $$;
grant usage on schema public to service_role;
grant select on public.wishlist_public_profiles,public.wishlist_amazon_publications to service_role;
create schema vault;
create table vault.decrypted_secrets(id uuid,decrypted_secret text,name text);
create function vault.create_secret(text,text,text) returns uuid language sql as $$ select '00000000-0000-0000-0000-000000000000'::uuid $$;
create function vault.update_secret(uuid,text) returns void language plpgsql as $$ begin return; end $$;
