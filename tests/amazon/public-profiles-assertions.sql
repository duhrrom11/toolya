\set ON_ERROR_STOP on
begin;
insert into auth.users values('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
insert into public.wishlist_public_profiles(user_id,display_name,country,city,bio,interests,lists) values('11111111-1111-4111-8111-111111111111','Anna Beispiel','Schweiz','Zürich','Bücher und Garten',array['Bücher','Garten'],'[{"name":"Hochzeit","url":"https://www.amazon.de/hz/wishlist/ls/ABC123?tag=wrong-21","occasion":"Hochzeit"}]');
do $$begin
 if (select lists->0->>'url' from public.wishlist_public_profiles limit 1) <> 'https://www.amazon.de/hz/wishlist/ls/ABC123?tag=duhrrom-21' then raise exception 'Affiliate enforcement failed'; end if;
 if (select count(*) from public.search_wishlist_profiles('Anna Schweiz','Schweiz','Hochzeit','Bücher',0))<>1 then raise exception 'Combined search/filter failed'; end if;
 begin
  insert into public.wishlist_public_profiles(user_id,display_name,lists) values('22222222-2222-4222-8222-222222222222','Wrong owner','[{"name":"Test","url":"https://amazon.de/hz/wishlist/ls/ABC"}]');
  raise exception 'Cross-owner insert allowed';
 exception when insufficient_privilege then null; end;
 begin
  update public.wishlist_public_profiles set lists='[{"name":"Unsafe","url":"https://amazon.de.evil.test/hz/wishlist/ls/ABC"}]';
  raise exception 'Unsafe link accepted';
 exception when raise_exception then if sqlerrm='Unsafe link accepted' then raise; end if; end;
end $$;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
do $$declare n integer;begin
 update public.wishlist_public_profiles set bio='Hacked'; get diagnostics n=row_count;
 if n<>0 then raise exception 'Cross-owner update allowed'; end if;
 delete from public.wishlist_public_profiles; get diagnostics n=row_count;
 if n<>0 then raise exception 'Cross-owner deletion allowed'; end if;
end $$;
set local role anon;
do $$begin
 if (select count(*) from public.search_wishlist_profiles())<>1 then raise exception 'Anonymous discovery failed'; end if;
end $$;
rollback;
