-- Public directory only. Separate from other wishlist profiles and private tool data.
create table public.wishlist_public_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check(length(btrim(display_name)) between 1 and 80),
 country text not null default '' check(length(country)<=80),
 city text not null default '' check(length(city)<=100),
 bio text not null default '' check(length(bio)<=600),
 interests text[] not null default '{}' check(cardinality(interests)<=12 and length(array_to_string(interests,','))<=400),
 lists jsonb not null check(jsonb_typeof(lists)='array' and jsonb_array_length(lists) between 1 and 5),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create function public.validate_public_wishlist_profile() returns trigger language plpgsql set search_path='' as $$
declare item jsonb; normalized jsonb='[]'::jsonb; link text;
begin
 for item in select value from jsonb_array_elements(new.lists) loop
  link:=item->>'url';
  if length(btrim(coalesce(item->>'name',''))) not between 1 and 100 or length(coalesce(item->>'occasion',''))>80 or link is null or length(link)>2048 or link !~* '^https://(www[.])?amazon[.](de|com|co[.]uk|fr|it|es|nl|pl|se|com[.]be|co[.]jp|ca|com[.]au)/(hz/wishlist/ls|gp/registry/wishlist|registry/wishlist)/[a-z0-9]+/?([?][^#]*)?$' then
   raise exception 'Bitte gültige Amazon-Wunschlisten mit Namen eingeben.';
  end if;
  -- Canonical destination and affiliate attribution enforced for every writer.
  normalized:=normalized||jsonb_build_array(jsonb_build_object('name',btrim(item->>'name'),'occasion',btrim(coalesce(item->>'occasion','')),'url',split_part(link,'?',1)||'?tag=duhrrom-21'));
 end loop;
 new.lists:=normalized; new.updated_at:=now();
 return new;
end $$;
create trigger validate_public_wishlist_profile before insert or update on public.wishlist_public_profiles for each row execute function public.validate_public_wishlist_profile();
alter table public.wishlist_public_profiles enable row level security;
create policy "Public directory read" on public.wishlist_public_profiles for select to anon,authenticated using(true);
create policy "Owner public profile insert" on public.wishlist_public_profiles for insert to authenticated with check(user_id=(select auth.uid()) and not coalesce((select (auth.jwt()->>'is_anonymous')::boolean),false));
create policy "Owner public profile update" on public.wishlist_public_profiles for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "Owner public profile delete" on public.wishlist_public_profiles for delete to authenticated using(user_id=(select auth.uid()));
revoke all on public.wishlist_public_profiles from public,anon,authenticated;
grant select on public.wishlist_public_profiles to anon,authenticated;
grant insert(user_id,display_name,country,city,bio,interests,lists),update(user_id,display_name,country,city,bio,interests,lists),delete on public.wishlist_public_profiles to authenticated;
-- Preserve only previously published public names and lists. Never copy private bios.
insert into public.wishlist_public_profiles(user_id,display_name,country,lists)
select p.user_id,left(concat_ws(' ',p.first_name,p.last_name),80),coalesce(p.country,''),
 (select jsonb_agg(jsonb_build_object('name',coalesce(nullif(l.title,''),'Meine Wünsche'),'url',l.amazon_url,'occasion','')) from (select title,amazon_url from public.wishlist_amazon_publications where user_id=p.user_id and scrape_status='success' order by published_at limit 5) l)
from public.wishlist_profiles p where exists(select 1 from public.wishlist_amazon_publications l where l.user_id=p.user_id and l.scrape_status='success') and length(btrim(concat_ws(' ',p.first_name,p.last_name)))>0;
create function public.search_wishlist_profiles(search_term text default '',country_filter text default '',occasion_filter text default '',interest_filter text default '',page_offset integer default 0)
returns setof public.wishlist_public_profiles language sql stable security invoker set search_path='' as $$
 select p.* from public.wishlist_public_profiles p
 where length(coalesce(search_term,''))<=150
 and (coalesce(country_filter,'')='' or p.country=country_filter)
 and (coalesce(interest_filter,'')='' or interest_filter=any(p.interests))
 and (coalesce(occasion_filter,'')='' or exists(select 1 from jsonb_array_elements(p.lists) l where l->>'occasion'=occasion_filter))
 and not exists(select 1 from regexp_split_to_table(lower(btrim(coalesce(search_term,''))),'\s+') term where term<>'' and strpos(lower(concat_ws(' ',p.display_name,p.country,p.city,p.bio,array_to_string(p.interests,' '),p.lists::text)),term)=0)
 order by p.updated_at desc,p.user_id limit 25 offset least(greatest(coalesce(page_offset,0),0),100000)
$$;
revoke all on function public.search_wishlist_profiles(text,text,text,text,integer) from public;
grant execute on function public.search_wishlist_profiles(text,text,text,text,integer) to anon,authenticated;
create function public.wishlist_profile_filters() returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('countries',(select coalesce(jsonb_agg(x order by x),'[]') from(select distinct country x from public.wishlist_public_profiles where country<>'')s),'interests',(select coalesce(jsonb_agg(x order by x),'[]') from(select distinct unnest(interests) x from public.wishlist_public_profiles)s),'occasions',(select coalesce(jsonb_agg(x order by x),'[]') from(select distinct l->>'occasion' x from public.wishlist_public_profiles p cross join lateral jsonb_array_elements(p.lists) l where coalesce(l->>'occasion','')<>'')s))
$$;
revoke all on function public.wishlist_profile_filters() from public;
grant execute on function public.wishlist_profile_filters() to anon,authenticated;
