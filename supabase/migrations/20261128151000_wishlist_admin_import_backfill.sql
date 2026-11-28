-- Preserve legacy import records for provenance; suppress their public projection after conversion.
alter table public.wishlist_imported_entries add column if not exists migrated_to_directory boolean not null default false;
insert into public.wishlist_directory_profiles (id,owner_id,kind,display_name,country,image_url,visibility,show_other_lists,managed_by_finder,created_at)
select i.id,u.id,'organization',i.display_name,i.country,i.logo_url,'directory',true,true,i.created_at
from public.wishlist_imported_entries i cross join auth.users u
where lower(u.email)='info@toolya.app' and u.raw_app_meta_data->>'toolya_stats_admin'='true' and not i.migrated_to_directory;
insert into public.wishlist_directory_lists (id,profile_id,name,url,visibility,created_at)
select i.id,i.id,'Wunschliste',i.wishlist_url,'directory',i.created_at from public.wishlist_imported_entries i where not i.migrated_to_directory;
update public.wishlist_imported_entries set migrated_to_directory=true where not migrated_to_directory;
create or replace view public.wishlist_directory with (security_invoker=false,security_barrier=true) as
 select p.id as user_id,p.display_name,p.country,p.city,p.bio,p.interests,
 coalesce(l.lists,'[]'::jsonb) lists,p.created_at,greatest(p.updated_at,l.updated_at) updated_at,
 p.image_url logo_url,coalesce(i.source_url,'') source_url,p.managed_by_finder imported
 from public.wishlist_directory_profiles p
 left join public.wishlist_imported_entries i on i.id=p.id and i.migrated_to_directory
 left join lateral (select jsonb_agg(jsonb_build_object('id',id,'name',name,'url',url,'occasion',occasion) order by created_at,id) lists,max(updated_at) updated_at from public.wishlist_directory_lists where profile_id=p.id and visibility='directory') l on true
 where p.visibility='directory'
 union all
 select id,display_name,country,'','',array[]::text[],jsonb_build_array(jsonb_build_object('id',id,'name','Wunschliste','url',wishlist_url,'occasion','')),created_at,created_at,logo_url,source_url,true
 from public.wishlist_imported_entries where not migrated_to_directory;
-- Archived import rows must not reappear after a directory profile is deleted.
