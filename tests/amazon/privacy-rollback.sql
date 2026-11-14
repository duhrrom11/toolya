-- Only synthetic rows inside one fully rolled-back transaction.
begin;
insert into auth.users(id) values('aa100000-0000-4000-8000-000000000001'),('aa100000-0000-4000-8000-000000000002');
insert into public.wishlist_profiles(user_id,handle,display_name) values('aa100000-0000-4000-8000-000000000001','privacy_rollback_a','Fixture A'),('aa100000-0000-4000-8000-000000000002','privacy_rollback_b','Fixture B');
insert into public.wishlist_products(marketplace,asin,title) values('amazon.de','TSTPRIV001','Private fixture'),('amazon.de','TSTPUB0001','Public fixture');
insert into public.wishlist_wishes(user_id,product_id,visibility) select 'aa100000-0000-4000-8000-000000000001',id,case when asin='TSTPRIV001' then 'private' else 'public' end from public.wishlist_products where asin in ('TSTPRIV001','TSTPUB0001');
insert into public.wishlist_lists(id,user_id,title,visibility) values('cc100000-0000-4000-8000-000000000001','aa100000-0000-4000-8000-000000000001','Private list','private'),('cc100000-0000-4000-8000-000000000002','aa100000-0000-4000-8000-000000000001','Public list','public');
insert into public.wishlist_list_items(list_id,user_id,wish_id) select l.id,w.user_id,w.id from public.wishlist_lists l cross join public.wishlist_wishes w where l.user_id='aa100000-0000-4000-8000-000000000001' and w.user_id=l.user_id;
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $$begin
 if (select count(*) from public.wishlist_lists where user_id='aa100000-0000-4000-8000-000000000001')<>1 then raise exception 'Guest list visibility'; end if;
 if (select count(*) from public.wishlist_wishes where user_id='aa100000-0000-4000-8000-000000000001')<>1 then raise exception 'Guest wish visibility'; end if;
 if (select count(*) from public.wishlist_list_items where user_id='aa100000-0000-4000-8000-000000000001')<>1 then raise exception 'Private wish leaked through public collection'; end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claims','{"role":"authenticated","sub":"aa100000-0000-4000-8000-000000000002"}',true);
do $$declare changed integer;begin
 update public.wishlist_lists set title='forbidden' where user_id='aa100000-0000-4000-8000-000000000001';get diagnostics changed=row_count;if changed<>0 then raise exception 'Other user edited list'; end if;
 delete from public.wishlist_wishes where user_id='aa100000-0000-4000-8000-000000000001';get diagnostics changed=row_count;if changed<>0 then raise exception 'Other user deleted wish'; end if;
 if (select count(*) from public.wishlist_list_items where user_id='aa100000-0000-4000-8000-000000000001')<>1 then raise exception 'Cross-account privacy'; end if;
end $$;
select set_config('request.jwt.claims','{"role":"authenticated","sub":"aa100000-0000-4000-8000-000000000001"}',true);
do $$begin
 if (select count(*) from public.wishlist_wishes where user_id=auth.uid())<>2 then raise exception 'Owner cannot read private wishes'; end if;
 if (select count(*) from public.wishlist_list_items where user_id=auth.uid())<>4 then raise exception 'Owner cannot read own memberships'; end if;
end $$;
update public.wishlist_lists set archived=true where id='cc100000-0000-4000-8000-000000000002';
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $$begin
 if exists(select 1 from public.wishlist_lists where user_id='aa100000-0000-4000-8000-000000000001') then raise exception 'Archived collection remains public'; end if;
 if exists(select 1 from public.wishlist_list_items where user_id='aa100000-0000-4000-8000-000000000001') then raise exception 'Archived membership remains public'; end if;
end $$;
rollback;
