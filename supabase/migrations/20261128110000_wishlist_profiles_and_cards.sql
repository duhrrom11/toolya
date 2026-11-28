-- Stable publication IDs, independent profiles and owner-only cards and bookmarks.
create schema if not exists extensions;
create schema if not exists toolya_private;
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;
grant usage on schema extensions to anon,authenticated;

create table public.wishlist_directory_profiles (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 kind text not null check (kind in ('person','organization','legacy')),
 first_name text not null default '' check (length(first_name) <= 80),
 last_name text not null default '' check (length(last_name) <= 80),
 organization_name text not null default '' check (length(organization_name) <= 80),
 display_name text not null check (length(btrim(display_name)) between 1 and 161),
 country text not null check (length(country) <= 80),
 city text not null default '' check (length(city) <= 100),
 bio text not null default '' check (length(bio) <= 600),
 interests text[] not null default '{}' check (cardinality(interests) <= 12),
 image_url text not null default '' check (length(image_url) <= 2048 and (image_url = '' or image_url ~* '^https://[^/@[:space:]]+(/[^[:space:]]*)?$')),
 website text not null default '' check (length(website) <= 2048 and (website = '' or website ~* '^https://[^/@[:space:]]+(/[^[:space:]]*)?$')),
 visibility text not null default 'private' check (visibility in ('private','link','directory')),
 show_other_lists boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique (owner_id, kind),
 check (kind = 'legacy' or (
   length(btrim(country)) > 0 and (
     (kind = 'person' and btrim(first_name) <> '' and btrim(last_name) <> '' and organization_name = '' and website = ''
       and display_name = btrim(first_name) || ' ' || btrim(last_name))
     or (kind = 'organization' and first_name = '' and last_name = '' and display_name = btrim(organization_name))
   )
 ))
);

create unique index wishlist_profile_kind_slot on public.wishlist_directory_profiles
 (owner_id, (case when kind='legacy' then 'organization' else kind end));

create table public.wishlist_directory_lists (
 id uuid primary key default gen_random_uuid(),
 profile_id uuid not null references public.wishlist_directory_profiles(id) on delete cascade,
 name text not null check (length(btrim(name)) between 1 and 100),
 url text not null check (length(url) <= 2048 and url ~* '^https://(www[.])?amazon[.](de|com|co[.]uk|fr|it|es|nl|pl|se|com[.]be|co[.]jp|ca|com[.]au)/(hz/wishlist/ls|gp/registry/wishlist|registry/wishlist)/[a-z0-9]+/?[?]tag=duhrrom-21$'),
 occasion text not null default '' check (length(occasion) <= 80),
 visibility text not null default 'private' check (visibility in ('private','link','directory')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index wishlist_directory_lists_profile_idx on public.wishlist_directory_lists(profile_id);
create index wishlist_directory_lists_key_idx on public.wishlist_directory_lists(public.wishlist_link_key(url));
create table toolya_private.wishlist_list_aliases (
 id uuid primary key,
 list_id uuid not null references public.wishlist_directory_lists(id) on delete cascade
);
create table public.wishlist_directory_favorites (
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 profile_id uuid not null,
 created_at timestamptz not null default now(),
 primary key (owner_id, profile_id)
);
create table public.wishlist_card_drafts (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 title text not null check (length(btrim(title)) between 1 and 100),
 draft jsonb not null check (jsonb_typeof(draft) = 'object' and octet_length(draft::text) <= 1800000),
 updated_at timestamptz not null default now()
);
create index wishlist_card_drafts_owner_idx on public.wishlist_card_drafts(owner_id, updated_at desc);

-- Retire legacy writes while copying their data so a concurrent save cannot fall
-- between the backfill and the policy change.
do $backfill$
begin
 lock table public.wishlist_public_profiles in share row exclusive mode;
 lock table public.wishlist_amazon_publications in share row exclusive mode;
 drop policy if exists "Owner public profile insert" on public.wishlist_public_profiles;
 drop policy if exists "Owner public profile update" on public.wishlist_public_profiles;
 drop policy if exists "Owner public profile delete" on public.wishlist_public_profiles;
 drop policy if exists "Owner insert with complete profile" on public.wishlist_amazon_publications;
 revoke insert on public.wishlist_amazon_publications from authenticated;

 -- Existing profile UUIDs were public links and browser bookmark keys.
 insert into public.wishlist_directory_profiles
  (id,owner_id,kind,first_name,last_name,organization_name,display_name,country,city,bio,interests,visibility,created_at,updated_at)
 select user_id,user_id,profile_kind,first_name,last_name,organization_name,display_name,country,city,bio,interests,'directory',created_at,updated_at
 from public.wishlist_public_profiles;

 insert into public.wishlist_directory_lists (profile_id,name,url,occasion,visibility,created_at,updated_at)
 select p.user_id,l->>'name',l->>'url',coalesce(l->>'occasion',''),'directory',p.created_at,p.updated_at
 from public.wishlist_public_profiles p cross join lateral jsonb_array_elements(p.lists) l;

 -- Earlier Amazon publications used ?list=<id>. Preserve URLs for the lists still published
 -- in the directory, and retain a safe profile redirect hint for withdrawn older lists.
 insert into toolya_private.wishlist_list_aliases (id,list_id)
 select a.id,l.id
 from public.wishlist_amazon_publications a
 join lateral (
  select d.id from public.wishlist_directory_lists d where d.profile_id=a.user_id
  and public.wishlist_link_key(d.url)=public.wishlist_link_key(a.amazon_url)
  order by d.id limit 1
 ) l on true;
end $backfill$;

alter table public.wishlist_directory_profiles enable row level security;
alter table public.wishlist_directory_lists enable row level security;
alter table public.wishlist_directory_favorites enable row level security;
alter table public.wishlist_card_drafts enable row level security;
alter table toolya_private.wishlist_list_aliases enable row level security;

create policy wishlist_profiles_owner on public.wishlist_directory_profiles to authenticated
 using (owner_id=(select auth.uid()) and not coalesce((select (auth.jwt()->>'is_anonymous')::boolean),false));
create policy wishlist_lists_owner on public.wishlist_directory_lists to authenticated
 using (exists (select 1 from public.wishlist_directory_profiles p where p.id=profile_id and p.owner_id=(select auth.uid())));
create policy wishlist_favorites_owner on public.wishlist_directory_favorites to authenticated
 using (owner_id=(select auth.uid()) and not coalesce((select (auth.jwt()->>'is_anonymous')::boolean),false));
create policy wishlist_drafts_owner on public.wishlist_card_drafts to authenticated
 using (owner_id=(select auth.uid()) and not coalesce((select (auth.jwt()->>'is_anonymous')::boolean),false));

revoke all on public.wishlist_directory_profiles,public.wishlist_directory_lists,public.wishlist_directory_favorites,public.wishlist_card_drafts from public,anon,authenticated;
revoke all on toolya_private.wishlist_list_aliases from public,anon,authenticated;
grant select on public.wishlist_directory_profiles,public.wishlist_directory_lists,public.wishlist_directory_favorites,public.wishlist_card_drafts to authenticated;
grant insert (kind,first_name,last_name,organization_name,display_name,country,city,bio,interests,image_url,website,visibility,show_other_lists),
 update (kind,first_name,last_name,organization_name,display_name,country,city,bio,interests,image_url,website,visibility,show_other_lists)
 on public.wishlist_directory_profiles to authenticated;
grant insert (profile_id,name,url,occasion,visibility), update (profile_id,name,url,occasion,visibility)
 on public.wishlist_directory_lists to authenticated;
grant insert (profile_id), delete on public.wishlist_directory_favorites to authenticated;
grant insert (title,draft), update (title,draft), delete on public.wishlist_card_drafts to authenticated;
grant select on public.wishlist_directory_profiles, public.wishlist_directory_lists to service_role;

create function toolya_private.wishlist_touch() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=now(); return new; end
$$;
create function toolya_private.wishlist_legacy_kind_read_only()
returns trigger language plpgsql set search_path='' as $$
begin
 if new.kind='legacy' and (tg_op='INSERT' or old.kind<>'legacy') then
  raise exception 'Choose a person or organization profile.' using errcode='23514';
 end if;
 return new;
end
$$;
create trigger wishlist_legacy_kind_read_only before insert or update of kind on public.wishlist_directory_profiles
 for each row execute function toolya_private.wishlist_legacy_kind_read_only();
create trigger wishlist_profiles_touch before update on public.wishlist_directory_profiles for each row execute function toolya_private.wishlist_touch();
create trigger wishlist_lists_touch before update on public.wishlist_directory_lists for each row execute function toolya_private.wishlist_touch();
create trigger wishlist_cards_touch before update on public.wishlist_card_drafts for each row execute function toolya_private.wishlist_touch();

-- Preserve the view contract used by the carousel, filters, the Finder and health review.
-- The view deliberately projects only published fields from owner-only base tables.
create or replace view public.wishlist_directory with (security_invoker=false,security_barrier=true) as
 select p.id as user_id,p.display_name,p.country,p.city,p.bio,p.interests,
   coalesce(l.lists,'[]'::jsonb) lists,p.created_at,greatest(p.updated_at,l.updated_at) updated_at,
   p.image_url logo_url,''::text source_url,false imported
 from public.wishlist_directory_profiles p
 left join lateral (
   select jsonb_agg(jsonb_build_object('id',id,'name',name,'url',url,'occasion',occasion) order by created_at,id) lists,max(updated_at) updated_at
   from public.wishlist_directory_lists where profile_id=p.id and visibility='directory'
 ) l on true
 where p.visibility='directory'
 union all
 select id,display_name,country,'','',array[]::text[],
   jsonb_build_array(jsonb_build_object('id',id,'name','Wunschliste','url',wishlist_url,'occasion','')),
   created_at,created_at,logo_url,source_url,true
 from public.wishlist_imported_entries;

-- Only the existing service-side health checks see explicitly shared link-only lists.
create view toolya_private.wishlist_health_directory as
 select user_id,display_name,lists,updated_at from public.wishlist_directory
 union all
 select p.id,p.display_name,jsonb_agg(jsonb_build_object('url',l.url)),max(l.updated_at)
 from public.wishlist_directory_profiles p join public.wishlist_directory_lists l on l.profile_id=p.id
 where p.visibility <> 'private' and l.visibility <> 'private'
 and (p.visibility='link' or l.visibility='link')
 group by p.id,p.display_name;
revoke all on toolya_private.wishlist_health_directory from public,anon,authenticated;

-- The legacy snapshots are kept for rollback and audit. They cannot bypass publication settings.
drop policy if exists "Public directory read" on public.wishlist_public_profiles;
create policy "Legacy profile owner read" on public.wishlist_public_profiles for select to authenticated using (user_id=(select auth.uid()));
drop policy if exists "Public list read" on public.wishlist_amazon_publications;
drop policy if exists "Successful public list or owner read" on public.wishlist_amazon_publications;
create policy "Legacy publication owner read" on public.wishlist_amazon_publications for select to authenticated using (user_id=(select auth.uid()));
revoke select on public.wishlist_amazon_publications from anon;
drop policy if exists "Public products read" on public.wishlist_amazon_publication_products;
drop policy if exists "Successful list products or owner read" on public.wishlist_amazon_publication_products;
create policy "Legacy publication products owner read" on public.wishlist_amazon_publication_products for select to authenticated
 using (exists (select 1 from public.wishlist_amazon_publications a where a.id=publication_id and a.user_id=(select auth.uid())));
revoke select on public.wishlist_amazon_publication_products from anon;

create function public.get_wishlist_public_profile(profile_id uuid)
returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(
   (select to_jsonb(p) || jsonb_build_object('website',d.website)
    from public.wishlist_directory p left join public.wishlist_directory_profiles d on d.id=p.user_id
    where p.user_id=$1),
   (select jsonb_build_object('user_id',p.id,'display_name',p.display_name,'city',p.city,
     'country',p.country,'bio',p.bio,'logo_url',p.image_url,'website',p.website,
     'lists',coalesce((select jsonb_agg(jsonb_build_object('id',l.id,'name',l.name,'url',l.url,'occasion',l.occasion) order by l.created_at,l.id)
                        from public.wishlist_directory_lists l where l.profile_id=p.id and l.visibility='directory'),'[]'::jsonb))
    from public.wishlist_directory_profiles p where p.id=$1 and p.visibility='link')
 )
$$;

create function public.get_wishlist_public_list(list_id uuid)
returns jsonb language sql stable security definer set search_path='' as $$
 with item as (
   select l.*,p.visibility profile_visibility,p.show_other_lists
   from public.wishlist_directory_lists l join public.wishlist_directory_profiles p on p.id=l.profile_id
   where l.id=coalesce((select a.list_id from toolya_private.wishlist_list_aliases a where a.id=$1),$1)
 ), found as (
   select jsonb_build_object('profile_id',case when profile_visibility<>'private' then profile_id end,
     'list',case when visibility<>'private' and profile_visibility<>'private' then
       jsonb_build_object('id',id,'name',name,'url',url,'occasion',occasion) end,
     'other_lists',coalesce((select jsonb_agg(x) from jsonb_array_elements(
       case when visibility<>'private' and profile_visibility<>'private' and show_other_lists
         then public.get_wishlist_public_profile(profile_id)->'lists' else '[]'::jsonb end
     ) x where x->>'id'<>item.id::text),'[]'::jsonb)) value from item where profile_visibility<>'private'
 )
 select coalesce((select value from found),
   (select jsonb_build_object('profile_id',p.user_id,'list',p.lists->0,'other_lists','[]'::jsonb)
    from public.wishlist_directory p where p.imported and p.user_id=$1),
   (select jsonb_build_object('profile_id',p.id) from public.wishlist_amazon_publications a
    join public.wishlist_directory_profiles p on p.id=a.user_id where a.id=$1 and p.visibility<>'private'))
$$;
revoke all on function public.get_wishlist_public_profile(uuid),public.get_wishlist_public_list(uuid) from public;
grant execute on function public.get_wishlist_public_profile(uuid),public.get_wishlist_public_list(uuid) to anon,authenticated;

-- Superseded RPCs must not expose the archival snapshots.
revoke execute on function public.search_wishlist_profiles(text,text,text,text,integer) from anon,authenticated;
revoke execute on function public.wishlist_profile_filters() from anon,authenticated;

create or replace function public.publish_discovered_wishlists(candidate_ids uuid[]) returns jsonb language plpgsql security invoker set search_path='' as $$
declare c record; n integer=0; d integer=0;
begin
 if cardinality(candidate_ids)>200 then raise exception 'Maximal 200 pro Stapel'; end if;
 perform pg_advisory_xact_lock(77171117);
 for c in select * from public.wishlist_discovery_candidates where id=any(candidate_ids) and status='new' for update loop
  if exists(select 1 from public.wishlist_imported_entries where list_key=c.list_key)
   or exists(select 1 from public.wishlist_directory_lists l where public.wishlist_link_key(l.url)=c.list_key)
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
create or replace function public.classify_discovered_wishlist() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if exists(select 1 from public.wishlist_imported_entries where list_key=new.list_key)
 or exists(select 1 from public.wishlist_directory_lists l where public.wishlist_link_key(l.url)=new.list_key)
 or exists(select 1 from public.wishlist_amazon_publications where public.wishlist_link_key(amazon_url)=new.list_key) then new.status:='duplicate'; end if;
 return new;
end $$;
revoke all on function public.classify_discovered_wishlist() from public,anon,authenticated;

-- Extension schemas can differ across existing Supabase environments.
do $setup$
declare unaccent_schema text; trgm_schema text;
begin
 select n.nspname into strict unaccent_schema from pg_extension e join pg_namespace n on n.oid=e.extnamespace where e.extname='unaccent';
 select n.nspname into strict trgm_schema from pg_extension e join pg_namespace n on n.oid=e.extnamespace where e.extname='pg_trgm';
 execute format($definition$
 create or replace function public.search_wishlist_directory(
  search_term text default '',country_filter text default '',occasion_filter text default '',interest_filter text default '',page_offset integer default 0
 )
 returns setof public.wishlist_directory language sql stable security invoker set search_path='' as $body$
 with input as (
  select lower(%1$I.unaccent(btrim(coalesce(search_term,'')))) q
 ), candidates as (
  select p, i.q, lower(%1$I.unaccent(p.display_name)) name,
    lower(%1$I.unaccent(concat_ws(' ',p.display_name,p.country,p.city,p.bio,array_to_string(p.interests,' '),p.lists::text))) corpus
  from public.wishlist_directory p cross join input i
  where length(coalesce(search_term,''))<=150
   and (btrim(coalesce(country_filter,''))='' or lower(%1$I.unaccent(btrim(p.country)))=lower(%1$I.unaccent(btrim(country_filter))))
   and (coalesce(interest_filter,'')='' or interest_filter=any(p.interests))
   and (coalesce(occasion_filter,'')='' or exists(select 1 from jsonb_array_elements(p.lists) l where l->>'occasion'=occasion_filter))
 )
 select (p).* from candidates
 where q='' or not exists (
   select 1 from regexp_split_to_table(q,'[[:space:]]+') token
   where token<>'' and strpos(corpus,token)=0
     and (length(token)<3 or %2$I.word_similarity(token,name)<0.42)
 )
 order by case when q='' then 5 when name=q then 0
   when strpos(' '||name||' ',' '||q||' ')>0 then 1
   when strpos(name,q)=1 then 2 when strpos(name,q)>1 then 3
   when strpos(corpus,q)>0 then 4 else 5 end,
   case when q<>'' then %2$I.word_similarity(q,name) end desc, (p).display_name,(p).user_id
 limit 25 offset least(greatest(coalesce(page_offset,0),0),100000)
 $body$
 $definition$, unaccent_schema, trgm_schema);
end $setup$;

CREATE OR REPLACE FUNCTION toolya_private.wishlist_link_check_dispatch()
RETURNS integer LANGUAGE plpgsql SET search_path TO '' AS $$
DECLARE rec record; submitted integer := 0; request bigint;
BEGIN
  -- Read-only source: only lists already published in the public directory.
  INSERT INTO toolya_private.wishlist_link_health(list_key)
  SELECT DISTINCT public.wishlist_link_key(item->>'url')
  FROM toolya_private.wishlist_health_directory d
  CROSS JOIN LATERAL jsonb_array_elements(d.lists) item
  WHERE public.wishlist_link_key(item->>'url') IS NOT NULL
  ON CONFLICT(list_key) DO NOTHING;


  -- At most five previously published official Amazon wishlist links per day.
  FOR rec IN
    SELECT h.list_key,
      (
        SELECT split_part(item->>'url','?',1)
        FROM toolya_private.wishlist_health_directory d
        CROSS JOIN LATERAL jsonb_array_elements(d.lists) item
        WHERE public.wishlist_link_key(item->>'url')=h.list_key
          AND (item->>'url') ~* '^https://(www[.])?amazon[.](de|com|co[.]uk|fr|it|es|nl|pl|se|com[.]be|co[.]jp|ca|com[.]au)/(hz/wishlist/ls|gp/registry/wishlist|registry/wishlist)/[a-z0-9]+/?([?]|$)'
        ORDER BY d.updated_at DESC LIMIT 1
      ) AS url
    FROM toolya_private.wishlist_link_health h
    WHERE h.outcome <> 'pending'
      AND h.next_check_at <= now()
      AND length(h.list_key) BETWEEN 8 AND 40
      AND h.list_key ~ '^[A-Z0-9]+$'
      AND EXISTS (
        SELECT 1 FROM toolya_private.wishlist_health_directory d
        CROSS JOIN LATERAL jsonb_array_elements(d.lists) item
        WHERE public.wishlist_link_key(item->>'url')=h.list_key
      )
    ORDER BY h.next_check_at,h.list_key
    LIMIT 5
    FOR UPDATE OF h SKIP LOCKED
  LOOP
    IF rec.url IS NULL THEN CONTINUE; END IF;
    request := net.http_get(
      url => rec.url,
      headers => '{"User-Agent":"ToolyaWishlistHealth/1.0 (+https://toolya.app)","Accept":"text/html"}'::jsonb,
      timeout_milliseconds => 7000
    );
    UPDATE toolya_private.wishlist_link_health
      SET request_id=request,requested_at=now(),outcome='pending',updated_at=now()
      WHERE list_key=rec.list_key;
    submitted := submitted+1;
  END LOOP;
  RETURN submitted;
END $$;
REVOKE ALL ON FUNCTION toolya_private.wishlist_link_check_dispatch() FROM PUBLIC,anon,authenticated;


-- Service-role only: manually inspect HTTP 404/410 review flags.
-- These are hints, never automatic unpublishing decisions.
CREATE OR REPLACE FUNCTION public.wishlist_link_health_review()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
 SELECT coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
   'list_key',r.list_key,
   'profile_id',r.user_id,
   'name',r.display_name,
   'http_status',r.http_status,
   'checked_at',r.checked_at
 ) ORDER BY r.checked_at DESC), '[]'::jsonb)
 FROM (
   SELECT h.list_key,h.http_status,h.checked_at,d.user_id,d.display_name
   FROM toolya_private.wishlist_link_health h
   JOIN LATERAL (
     SELECT p.user_id,p.display_name
     FROM toolya_private.wishlist_health_directory p
     CROSS JOIN LATERAL pg_catalog.jsonb_array_elements(p.lists) l
     WHERE public.wishlist_link_key(l->>'url')=h.list_key
     ORDER BY p.updated_at DESC LIMIT 1
   ) d ON TRUE
   WHERE h.outcome='review_404_410'
   ORDER BY h.checked_at DESC LIMIT 50
 ) r
$$;
REVOKE ALL ON FUNCTION public.wishlist_link_health_review() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wishlist_link_health_review() TO service_role;
