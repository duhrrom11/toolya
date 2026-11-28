insert into public.wishlist_imported_entries(list_key,display_name,wishlist_url)
values('PREFIX789','Schrodermann e.V.','https://www.amazon.de/hz/wishlist/ls/PREFIX789');

set role anon;
do $$
begin
 if (public.get_wishlist_public_profile('a1111111-1111-4111-8111-111111111111')->>'display_name') is distinct from 'Zoë Schröder' then
  raise exception 'Legacy profile/bookmark ID lost';
 end if;
 if (public.get_wishlist_public_list('aa111111-1111-4111-8111-111111111111')->'list'->>'url') is distinct from
 'https://www.amazon.de/hz/wishlist/ls/PUBLIC123?tag=duhrrom-21' then
  raise exception 'Legacy list URL or partner tag lost';
 end if;
 if (select display_name from public.search_wishlist_directory('Zoe Schroder','Osterreich','Hochzeit') limit 1) is distinct from 'Zoë Schröder' then
  raise exception 'Accent/country/occasion search failed';
 end if;
 if (select display_name from public.search_wishlist_directory('Schroder') limit 1) is distinct from 'Zoë Schröder' then
  raise exception 'An exact last name must precede an inexact name prefix';
 end if;
 if (select display_name from public.search_wishlist_directory('Shroder') limit 1) is distinct from 'Zoë Schröder' then
  raise exception 'Typo-tolerant search failed';
 end if;
 if exists(select 1 from public.search_wishlist_directory('Zoe','','Geburtstag')) then raise exception 'Occasion filter ignored'; end if;
 if exists(select 1 from public.search_wishlist_directory('Zoe','','','',24)) then raise exception 'Offset ignored'; end if;
 if has_table_privilege('public.wishlist_directory_profiles','select') or has_table_privilege('public.wishlist_amazon_publications','select') then
  raise exception 'Anonymous raw table access';
 end if;
end $$;
reset role;

set role authenticated;
set request.jwt.claim.sub='a1111111-1111-4111-8111-111111111111';
insert into public.wishlist_directory_profiles(kind,organization_name,display_name,country,image_url,website,visibility)
 values('organization','Verein Beispiel','Verein Beispiel','Schweiz','https://example.invalid/logo.png','https://example.invalid/','link');
insert into public.wishlist_directory_lists(profile_id,name,url,visibility)
 select id,'Nur Link','https://www.amazon.de/hz/wishlist/ls/LINK789?tag=duhrrom-21','link'
 from public.wishlist_directory_profiles where kind='organization';
insert into public.wishlist_directory_favorites(profile_id) values('a1111111-1111-4111-8111-111111111111') on conflict do nothing;
insert into public.wishlist_directory_favorites(profile_id) values('a1111111-1111-4111-8111-111111111111') on conflict do nothing;
insert into public.wishlist_card_drafts(title,draft) values('Sprachen','{"lang":"العربية 日本語 Українська Zoë"}');
update public.wishlist_directory_lists set url='https://www.amazon.de/hz/wishlist/ls/NEW456?tag=duhrrom-21'
 where profile_id='a1111111-1111-4111-8111-111111111111';
do $$
declare org uuid; list_id uuid;
begin
 select id into org from public.wishlist_directory_profiles where kind='organization';
 select id into list_id from public.wishlist_directory_lists where profile_id=org;
 if (select count(*) from public.wishlist_directory_favorites)<>1 then raise exception 'Duplicate favorite'; end if;
 if exists(select 1 from public.wishlist_directory where user_id=org) or exists(select 1 from public.search_wishlist_directory('Verein Beispiel')) then
  raise exception 'Link-only profile was discoverable';
 end if;
 if (public.get_wishlist_public_profile(org)->>'website') is distinct from 'https://example.invalid/' then raise exception 'Link-only profile was unavailable'; end if;
 if public.get_wishlist_public_profile(org) ? 'owner_id' then raise exception 'Owner identity leaked'; end if;
 if (public.get_wishlist_public_list(list_id)->'list'->>'name') is distinct from 'Nur Link' then raise exception 'Link-only list was unavailable'; end if;
 if jsonb_array_length(public.get_wishlist_public_profile(org)->'lists')<>0 then raise exception 'Link-only list leaked on profile'; end if;
 if (public.get_wishlist_public_list('aa111111-1111-4111-8111-111111111111')->'list'->>'url') not like '%/NEW456?%' then raise exception 'List ID changed on edit'; end if;
 update public.wishlist_directory_lists set visibility='private' where id=list_id;
 if (public.get_wishlist_public_list(list_id)->'list') is distinct from 'null'::jsonb or
    (public.get_wishlist_public_list(list_id)->>'profile_id') is distinct from org::text then raise exception 'Withdrawn list leaked or lost public profile hint'; end if;
 update public.wishlist_directory_profiles set visibility='private' where id=org;
 if public.get_wishlist_public_profile(org) is not null or public.get_wishlist_public_list(list_id)->>'profile_id' is not null then
  raise exception 'Private organization leaked';
 end if;
 begin
  insert into public.wishlist_directory_profiles(kind,organization_name,display_name,country)
    values('organization','Second','Second','CH');
  raise exception 'Duplicate type accepted';
 exception when unique_violation then null;
 end;
end $$;

set request.jwt.claim.sub='a2222222-2222-4222-8222-222222222222';
do $$
begin
 if exists(select 1 from public.wishlist_directory_profiles) or exists(select 1 from public.wishlist_directory_lists)
    or exists(select 1 from public.wishlist_card_drafts) or exists(select 1 from public.wishlist_directory_favorites) then
  raise exception 'An account can read another account’s data';
 end if;
 begin
  insert into public.wishlist_directory_lists(profile_id,name,url)
    values('a1111111-1111-4111-8111-111111111111','Wrong owner','https://www.amazon.de/hz/wishlist/ls/WRONG?tag=duhrrom-21');
  raise exception 'Wrong account could publish a list';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
