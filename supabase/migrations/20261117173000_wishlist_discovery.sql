-- Finder staging is private. Public entries contain no contact email or auth identity.
create table public.wishlist_discovery_candidates (
 id uuid primary key default gen_random_uuid(), list_key text not null unique,
 name text not null check(length(name) between 1 and 160), type text not null default 'unknown',
 logo_url text not null default '', wishlist_url text not null, email text not null default '',
 source_url text not null default '', country text not null default '',
 found_at timestamptz not null default now(), status text not null default 'new' check(status in ('new','published','duplicate','dismissed'))
);
create table public.wishlist_discovery_sources (
 source_url text primary key, checked_at timestamptz not null default now(), status text not null default 'checking'
);
create table public.wishlist_discovery_queries (
 query text not null, country text not null, lang text not null, page integer not null default 0,
 primary key(query,country,lang)
);
create table public.wishlist_imported_entries (
 id uuid primary key default gen_random_uuid(), list_key text not null unique,
 display_name text not null, logo_url text not null default '', wishlist_url text not null,
 source_url text not null default '', country text not null default '', created_at timestamptz not null default now()
);
alter table public.wishlist_discovery_candidates enable row level security;
alter table public.wishlist_discovery_sources enable row level security;
alter table public.wishlist_discovery_queries enable row level security;
alter table public.wishlist_imported_entries enable row level security;
revoke all on public.wishlist_discovery_candidates,public.wishlist_discovery_sources,public.wishlist_discovery_queries,public.wishlist_imported_entries from public,anon,authenticated;
grant all on public.wishlist_discovery_candidates,public.wishlist_discovery_sources,public.wishlist_discovery_queries,public.wishlist_imported_entries to service_role;
grant select on public.wishlist_imported_entries to anon,authenticated;
create policy "Public imported wishlist links" on public.wishlist_imported_entries for select to anon,authenticated using(true);
create function public.wishlist_link_key(link text) returns text language sql immutable set search_path='' as $$
 select upper(substring(link from '(?i)/(?:hz/wishlist/ls|gp/registry/wishlist|registry/wishlist)/([a-z0-9]+)'))
$$;
revoke all on function public.wishlist_link_key(text) from public;
grant execute on function public.wishlist_link_key(text) to anon,authenticated,service_role;
-- Existing owner profiles retain their model; found entries never create auth.users.
create view public.wishlist_directory with (security_invoker=true) as
 select user_id,display_name,country,city,bio,interests,lists,created_at,updated_at,''::text logo_url,''::text source_url,false imported from public.wishlist_public_profiles
 union all
 select id,display_name,country,'','',array[]::text[],jsonb_build_array(jsonb_build_object('name','Wunschliste','url',wishlist_url,'occasion','')),created_at,created_at,logo_url,source_url,true from public.wishlist_imported_entries;
grant select on public.wishlist_directory to anon,authenticated,service_role;
create function public.search_wishlist_directory(search_term text default '',country_filter text default '',occasion_filter text default '',interest_filter text default '',page_offset integer default 0)
returns setof public.wishlist_directory language sql stable security invoker set search_path='' as $$
 select p.* from public.wishlist_directory p where length(coalesce(search_term,''))<=150
 and (coalesce(country_filter,'')='' or p.country=country_filter)
 and (coalesce(interest_filter,'')='' or interest_filter=any(p.interests))
 and (coalesce(occasion_filter,'')='' or exists(select 1 from jsonb_array_elements(p.lists) l where l->>'occasion'=occasion_filter))
 and not exists(select 1 from regexp_split_to_table(lower(btrim(coalesce(search_term,''))),'\s+') term where term<>'' and strpos(lower(concat_ws(' ',p.display_name,p.country,p.city,p.bio,array_to_string(p.interests,' '),p.lists::text)),term)=0)
 order by p.updated_at desc,p.user_id limit 25 offset least(greatest(coalesce(page_offset,0),0),100000)
$$;
revoke all on function public.search_wishlist_directory(text,text,text,text,integer) from public;
grant execute on function public.search_wishlist_directory(text,text,text,text,integer) to anon,authenticated;
create function public.wishlist_directory_filters() returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('countries',(select coalesce(jsonb_agg(x order by x),'[]') from(select distinct country x from public.wishlist_directory where country<>'')s),'interests',(select coalesce(jsonb_agg(x order by x),'[]') from(select distinct unnest(interests) x from public.wishlist_directory)s),'occasions',(select coalesce(jsonb_agg(x order by x),'[]') from(select distinct l->>'occasion' x from public.wishlist_directory p cross join lateral jsonb_array_elements(p.lists) l where coalesce(l->>'occasion','')<>'')s))
$$;
revoke all on function public.wishlist_directory_filters() from public;
grant execute on function public.wishlist_directory_filters() to anon,authenticated;
-- Service-only transaction serializes concurrent import requests and checks all existing lists.
create function public.publish_discovered_wishlists(candidate_ids uuid[]) returns jsonb language plpgsql security invoker set search_path='' as $$
declare c record; n integer=0; d integer=0;
begin
 if cardinality(candidate_ids)>200 then raise exception 'Maximal 200 pro Stapel'; end if;
 perform pg_advisory_xact_lock(77171117);
 for c in select * from public.wishlist_discovery_candidates where id=any(candidate_ids) and status='new' for update loop
  if exists(select 1 from public.wishlist_imported_entries where list_key=c.list_key)
   or exists(select 1 from public.wishlist_public_profiles p cross join lateral jsonb_array_elements(p.lists) l where public.wishlist_link_key(l->>'url')=c.list_key)
   or exists(select 1 from public.wishlist_amazon_publications where public.wishlist_link_key(amazon_url)=c.list_key) then
    update public.wishlist_discovery_candidates set status='duplicate' where id=c.id; d:=d+1;
  else
   insert into public.wishlist_imported_entries(list_key,display_name,logo_url,wishlist_url,source_url,country) values(c.list_key,c.name,c.logo_url,c.wishlist_url,c.source_url,c.country);
   update public.wishlist_discovery_candidates set status='published' where id=c.id; n:=n+1;
  end if;
 end loop;
 return jsonb_build_object('published',n,'duplicates',d);
end $$;
revoke all on function public.publish_discovered_wishlists(uuid[]) from public,anon,authenticated;
grant execute on function public.publish_discovered_wishlists(uuid[]) to service_role;
-- The API key is encrypted by Vault, never returned to the browser.
create function public.wishlist_discovery_key(new_key text default null) returns text language plpgsql security definer set search_path='' as $$
declare secret_id uuid; secret_value text;
begin
 select id,decrypted_secret into secret_id,secret_value from vault.decrypted_secrets where name='toolya_wishlist_brave_key';
 if new_key is not null then
  if length(new_key) not between 10 and 300 then raise exception 'Ungültiger API-Schlüssel'; end if;
  if secret_id is null then perform vault.create_secret(new_key,'toolya_wishlist_brave_key','Wishlist discovery search API');
  else perform vault.update_secret(secret_id,new_key); end if;
  return 'configured';
 end if;
 return secret_value;
end $$;
revoke all on function public.wishlist_discovery_key(text) from public,anon,authenticated;
grant execute on function public.wishlist_discovery_key(text) to service_role;
create table public.wishlist_discovery_pending(source_url text primary key,country text not null default '',created_at timestamptz not null default now());
alter table public.wishlist_discovery_pending enable row level security;
revoke all on public.wishlist_discovery_pending from public,anon,authenticated;
grant all on public.wishlist_discovery_pending to service_role;
create function public.classify_discovered_wishlist() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if exists(select 1 from public.wishlist_imported_entries where list_key=new.list_key)
 or exists(select 1 from public.wishlist_public_profiles p cross join lateral jsonb_array_elements(p.lists) l where public.wishlist_link_key(l->>'url')=new.list_key)
 or exists(select 1 from public.wishlist_amazon_publications where public.wishlist_link_key(amazon_url)=new.list_key) then new.status:='duplicate'; end if;
 return new;
end $$;
revoke all on function public.classify_discovered_wishlist() from public,anon,authenticated;
create trigger classify_discovered_wishlist before insert on public.wishlist_discovery_candidates for each row execute function public.classify_discovered_wishlist();
