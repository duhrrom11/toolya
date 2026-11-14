-- Synthetic checks run in one rolled-back transaction; nothing is persisted.
begin;
insert into auth.users(id) values('aa000000-0000-4000-8000-000000000001'),('aa000000-0000-4000-8000-000000000002');
insert into public.wishlist_profiles(user_id,handle,display_name) values('aa000000-0000-4000-8000-000000000001','rollback_amazon_a','Rollback A');
insert into public.toolya_amazon_previews(id,user_id,payload) values('bb000000-0000-4000-8000-000000000001','aa000000-0000-4000-8000-000000000001','{"kind":"list","complete":true,"products":[{"asin":"TST0000001","title":"Rollback fixture","imageUrl":"https://m.media-amazon.com/a.jpg","price":19.99,"description":"Synthetic","quantity":2,"scrapedAt":"2026-11-14T00:00:00Z"}]}');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"aa000000-0000-4000-8000-000000000001","role":"authenticated","is_anonymous":false}',true);
select public.toolya_amazon_take_quota();
select public.toolya_amazon_import('bb000000-0000-4000-8000-000000000001','Rollback Liste','private',null);
select public.toolya_amazon_import('bb000000-0000-4000-8000-000000000001','Rollback Liste','private',null);
do $$begin
 if (select count(*) from public.wishlist_lists where user_id=auth.uid())<>1 then raise exception 'Duplicate list'; end if;
 if (select count(*) from public.wishlist_wishes where user_id=auth.uid())<>1 then raise exception 'Duplicate wish'; end if;
 if not exists(select 1 from public.wishlist_wish_extras where user_id=auth.uid() and quantity=2 and target_price=19.99) then raise exception 'Missing metadata'; end if;
 if exists(select 1 from public.wishlist_wishes where user_id=auth.uid() and visibility<>'private') then raise exception 'Visibility incorrect'; end if;
 begin
  update public.toolya_amazon_previews set payload='{}';
  raise exception 'Snapshot could be modified';
 exception when insufficient_privilege then null;
 end;
end $$;
select set_config('request.jwt.claims','{"sub":"aa000000-0000-4000-8000-000000000002","role":"authenticated","is_anonymous":false}',true);
do $$begin
 if exists(select 1 from public.toolya_amazon_previews) then raise exception 'Cross-user preview leak'; end if;
 begin
  perform public.toolya_amazon_import('bb000000-0000-4000-8000-000000000001','Other user','public',null);
  raise exception 'Cross-user import succeeded';
 exception when raise_exception then if sqlerrm<>'Preview not found' then raise; end if;
 end;
end $$;
rollback;
