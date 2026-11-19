-- Store the public identity type separately; existing profiles remain "legacy".
alter table public.wishlist_public_profiles
 add column if not exists profile_kind text not null default 'legacy',
 add column if not exists first_name text not null default '',
 add column if not exists last_name text not null default '',
 add column if not exists organization_name text not null default '';

alter table public.wishlist_public_profiles
 add constraint wishlist_public_profiles_identity_kind_check
 check (
  profile_kind = 'legacy'
  or (
   profile_kind = 'person'
   and length(btrim(first_name)) between 1 and 80
   and length(btrim(last_name)) between 1 and 80
   and btrim(organization_name) = ''
   and display_name = btrim(first_name) || ' ' || btrim(last_name)
   and length(btrim(display_name)) <= 80
   and length(btrim(country)) between 1 and 80
  )
  or (
   profile_kind = 'organization'
   and length(btrim(organization_name)) between 1 and 80
   and btrim(first_name) = '' and btrim(last_name) = ''
   and display_name = btrim(organization_name)
   and length(btrim(country)) between 1 and 80
  )
 );

grant insert(profile_kind,first_name,last_name,organization_name),
 update(profile_kind,first_name,last_name,organization_name)
 on public.wishlist_public_profiles to authenticated;
