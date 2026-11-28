-- Admin-only managed profiles use existing directory tables and stable UUIDs.
alter table public.wishlist_directory_profiles add column managed_by_finder boolean not null default false;
alter table public.wishlist_directory_profiles drop constraint wishlist_directory_profiles_owner_id_kind_key;
drop index public.wishlist_profile_kind_slot;
create unique index wishlist_profile_kind_slot on public.wishlist_directory_profiles
 (owner_id,(case when kind='legacy' then 'organization' else kind end)) where not managed_by_finder;
alter table public.wishlist_directory_profiles drop constraint wishlist_directory_profiles_check;
alter table public.wishlist_directory_profiles add constraint wishlist_directory_profiles_check check (
 (managed_by_finder and kind='organization') or kind='legacy' or
 (length(btrim(country))>0 and ((kind='person' and btrim(first_name)<>'' and btrim(last_name)<>'' and organization_name='' and website='' and display_name=btrim(first_name)||' '||btrim(last_name))
 or (kind='organization' and first_name='' and last_name='' and display_name=btrim(organization_name)))));
-- The service role is the only writer of managed_by_finder; normal column grants are unchanged.
create table public.wishlist_admin_audit (
 id bigint generated always as identity primary key,
 actor_id uuid not null,
 action text not null,
 entity_id uuid,
 details jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
alter table public.wishlist_admin_audit enable row level security;
revoke all on public.wishlist_admin_audit from public,anon,authenticated;
grant select,insert on public.wishlist_admin_audit to service_role;
grant usage,select on sequence public.wishlist_admin_audit_id_seq to service_role;
grant insert,update,delete on public.wishlist_directory_profiles,public.wishlist_directory_lists to service_role;
-- Atomic merge, with explicit account scope and no deletion of the source profile.
create function public.wishlist_admin_merge(p_actor uuid,p_source uuid,p_target uuid)
returns void language plpgsql security invoker set search_path='' as $$
declare n integer;
begin
 if p_source=p_target then raise exception 'Identische Profile'; end if;
 perform id from public.wishlist_directory_profiles where id in(p_source,p_target) and owner_id=p_actor order by id for update;
 get diagnostics n=row_count;
 if n<>2 then raise exception 'Profil nicht verwaltbar'; end if;
 -- Preserve list IDs; prevent accidental exposure of lists from private profiles.
 update public.wishlist_directory_lists l set profile_id=p_target,
 visibility=case when p.visibility='private' then 'private' when p.visibility='link' and l.visibility='directory' then 'link' else l.visibility end
 from public.wishlist_directory_profiles p where p.id=p_source and l.profile_id=p_source;
 update public.wishlist_directory_profiles set visibility='private' where id=p_source;
 insert into public.wishlist_admin_audit(actor_id,action,entity_id,details) values(p_actor,'merge',p_source,jsonb_build_object('target',p_target));
end $$;
revoke all on function public.wishlist_admin_merge(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.wishlist_admin_merge(uuid,uuid,uuid) to service_role;
