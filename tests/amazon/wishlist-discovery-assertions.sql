begin;
insert into public.wishlist_discovery_candidates(name,list_key,wishlist_url,source_url,email) values('Isolierter Verein','DISCOVERYFIXTURE','https://www.amazon.de/hz/wishlist/ls/DISCOVERYFIXTURE?tag=duhrrom-21','https://example.org/spenden','private@example.org');
set local role service_role;
select public.publish_discovered_wishlists(array[(select id from public.wishlist_discovery_candidates where list_key='DISCOVERYFIXTURE')]);
select public.publish_discovered_wishlists(array[(select id from public.wishlist_discovery_candidates where list_key='DISCOVERYFIXTURE')]);
do $$ begin if (select count(*) from public.wishlist_imported_entries where list_key='DISCOVERYFIXTURE')<>1 then raise exception 'Import not idempotent'; end if; end $$;
reset role;
set local role anon;
do $$ begin
 if (select count(*) from public.search_wishlist_directory('Isolierter Verein'))<>1 then raise exception 'Public discovery missing'; end if;
 if has_table_privilege('anon','public.wishlist_discovery_candidates','select') or has_table_privilege('authenticated','public.wishlist_discovery_candidates','select') then raise exception 'Contact details exposed'; end if;
 if has_function_privilege('authenticated','public.wishlist_discovery_key(text)','execute') or has_function_privilege('anon','public.publish_discovered_wishlists(uuid[])','execute') then raise exception 'Privileged RPC exposed'; end if;
 if (select public.wishlist_link_key('https://amazon.fr/gp/registry/wishlist/abc123?tag=other'))<>'ABC123' then raise exception 'URL identity mismatch'; end if;
end $$;
reset role;
rollback;
