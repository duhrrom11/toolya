create or replace function public.publish_discovered_wishlists(candidate_ids uuid[]) returns jsonb language plpgsql security invoker set search_path='' as $$
declare c record; n integer=0; d integer=0; actor uuid; pid uuid;
begin
 actor := '53d185ba-d248-4e8e-899e-836e4090e87f'::uuid; -- Edge endpoint verifies the authenticated admin before using service_role.
 if cardinality(candidate_ids)>200 then raise exception 'Maximal 200 pro Stapel'; end if;
 perform pg_advisory_xact_lock(77171117);
 for c in select * from public.wishlist_discovery_candidates where id=any(candidate_ids) and status='new' for update loop
  if exists(select 1 from public.wishlist_imported_entries where list_key=c.list_key)
   or exists(select 1 from public.wishlist_directory_lists l where public.wishlist_link_key(l.url)=c.list_key)
   or exists(select 1 from public.wishlist_amazon_publications where public.wishlist_link_key(amazon_url)=c.list_key) then
    update public.wishlist_discovery_candidates set status='duplicate' where id=c.id; d:=d+1;
  else
   pid:=gen_random_uuid();
   insert into public.wishlist_directory_profiles(id,owner_id,kind,display_name,country,image_url,visibility,show_other_lists,managed_by_finder)
   values(pid,actor,'organization',c.name,c.country,c.logo_url,'directory',true,true);
   insert into public.wishlist_directory_lists(id,profile_id,name,url,visibility) values(pid,pid,'Wunschliste',c.wishlist_url,'directory');
   insert into public.wishlist_imported_entries(id,list_key,display_name,logo_url,wishlist_url,source_url,country,migrated_to_directory)
   values(pid,c.list_key,c.name,c.logo_url,c.wishlist_url,c.source_url,c.country,true);
   update public.wishlist_discovery_candidates set status='published' where id=c.id;
   insert into public.wishlist_admin_audit(actor_id,action,entity_id,details) values(actor,'finder_publish',pid,jsonb_build_object('candidate',c.id));
   n:=n+1;
  end if;
 end loop;
 return jsonb_build_object('published',n,'duplicates',d);
end $$;
revoke all on function public.publish_discovered_wishlists(uuid[]) from public,anon,authenticated;
grant execute on function public.publish_discovered_wishlists(uuid[]) to service_role;
create or replace function public.wishlist_admin_withdraw(p_actor uuid,p_candidate uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
declare c record; i record; p record; l record;
begin
 if p_actor is distinct from '53d185ba-d248-4e8e-899e-836e4090e87f'::uuid then raise exception 'Nicht berechtigt'; end if;
 perform pg_advisory_xact_lock(77171117);
 select * into strict c from public.wishlist_discovery_candidates where id=p_candidate and status='published' for update;
 select * into strict i from public.wishlist_imported_entries where list_key=c.list_key and migrated_to_directory and display_name=c.name and logo_url=c.logo_url and wishlist_url=c.wishlist_url and source_url=c.source_url and country=c.country and created_at>=c.found_at for update;
 select * into strict p from public.wishlist_directory_profiles where id=i.id and owner_id=p_actor and managed_by_finder for update;
 select * into strict l from public.wishlist_directory_lists where id=i.id and profile_id=p.id for update;
 if p.display_name<>i.display_name or p.image_url<>i.logo_url or p.country<>i.country or p.bio<>'' or l.url<>i.wishlist_url or l.name<>'Wunschliste' or l.occasion<>'' or p.visibility<>'directory' or l.visibility<>'directory' or p.updated_at>greatest(p.created_at,l.created_at) or l.updated_at>greatest(p.created_at,l.created_at) or (select count(*) from public.wishlist_directory_lists where profile_id=p.id)<>1 then raise exception 'Eintrag wurde verändert; bitte manuell verwalten'; end if;
 update public.wishlist_directory_lists set visibility='private' where id=l.id;
 update public.wishlist_directory_profiles set visibility='private' where id=p.id;
 update public.wishlist_discovery_candidates set status='dismissed' where id=c.id;
 insert into public.wishlist_admin_audit(actor_id,action,entity_id,details) values(p_actor,'finder_withdraw',p.id,jsonb_build_object('candidate',c.id));
 return jsonb_build_object('ok',true);
end $$;
revoke all on function public.wishlist_admin_withdraw(uuid,uuid) from public,anon,authenticated;
grant execute on function public.wishlist_admin_withdraw(uuid,uuid) to service_role;
