create schema if not exists toolya_private;
revoke all on schema toolya_private from public;
grant usage on schema toolya_private to authenticated;
alter table public.wishlist_products add column if not exists image_url text;
alter table public.wishlist_products add column if not exists price numeric;
alter table public.wishlist_products add column if not exists description text;
alter table public.wishlist_products add column if not exists scraped_at timestamptz;
create table public.toolya_amazon_previews (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 payload jsonb not null, created_at timestamptz not null default now(), result jsonb
);
alter table public.toolya_amazon_previews enable row level security;
revoke all on public.toolya_amazon_previews from anon,authenticated;
grant select on public.toolya_amazon_previews to authenticated;
grant all on public.toolya_amazon_previews to service_role;
create policy "own amazon previews" on public.toolya_amazon_previews for select to authenticated using (user_id=(select auth.uid()));
create table toolya_private.amazon_quotas (user_id uuid primary key references auth.users(id) on delete cascade, window_start timestamptz not null, requests integer not null);
alter table toolya_private.amazon_quotas enable row level security;
create function toolya_private.amazon_take_quota() returns void language plpgsql security definer set search_path='' as $$
declare uid uuid := auth.uid(); n integer;
begin
 if uid is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'Authentication required'; end if;
 insert into toolya_private.amazon_quotas values(uid,now(),1)
 on conflict(user_id) do update set requests=case when amazon_quotas.window_start<now()-interval '1 hour' then 1 else amazon_quotas.requests+1 end,
 window_start=case when amazon_quotas.window_start<now()-interval '1 hour' then now() else amazon_quotas.window_start end returning requests into n;
 if n>10 then raise exception 'Rate limit'; end if;
 delete from public.toolya_amazon_previews where user_id=uid and created_at<now()-interval '1 day';
end $$;
revoke all on function toolya_private.amazon_take_quota() from public;
grant execute on function toolya_private.amazon_take_quota() to authenticated;
create function public.toolya_amazon_take_quota() returns void language sql security invoker set search_path='' as $$select toolya_private.amazon_take_quota()$$;
revoke all on function public.toolya_amazon_take_quota() from public,anon;
grant execute on function public.toolya_amazon_take_quota() to authenticated;
create function toolya_private.amazon_import(preview_id uuid,list_title text,visibility text,target_list uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); snap public.toolya_amazon_previews%rowtype; item jsonb; lid uuid; pid bigint; wid bigint; inserted integer:=0; linked integer:=0; output jsonb;
begin
 if uid is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'Authentication required'; end if;
 if visibility not in ('public','private') or visibility is null then raise exception 'Invalid visibility'; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 select * into snap from public.toolya_amazon_previews where id=preview_id and user_id=uid for update;
 if not found then raise exception 'Preview not found'; end if;
 if snap.result is not null then return snap.result; end if;
 if snap.created_at<now()-interval '15 minutes' then raise exception 'Preview expired; please reload'; end if;
 if (snap.payload->>'complete')::boolean is distinct from true or jsonb_array_length(snap.payload->'products') not between 1 and 500 then raise exception 'Incomplete preview'; end if;
 if not exists(select 1 from public.wishlist_profiles where user_id=uid) then raise exception 'Bitte zuerst dein Profil speichern.'; end if;
 if snap.payload->>'kind'='list' then
  if length(trim(list_title)) not between 1 and 80 or list_title is null then raise exception 'Listenname muss 1 bis 80 Zeichen enthalten.'; end if;
  insert into public.wishlist_lists(user_id,title,visibility) values(uid,trim(list_title),visibility) returning id into lid;
 elsif target_list is not null then
  select id into lid from public.wishlist_lists where id=target_list and user_id=uid and not archived;
  if not found then raise exception 'Zielliste nicht verfügbar.'; end if;
 end if;
 for item in select value from jsonb_array_elements(snap.payload->'products') loop
  if item->>'asin' !~ '^[A-Z0-9]{10}$' or length(item->>'title') not between 1 and 250 then raise exception 'Invalid product'; end if;
  insert into public.wishlist_products(marketplace,asin,title,image_url,price,description,scraped_at)
  values('amazon.de',item->>'asin',item->>'title',item->>'imageUrl',(item->>'price')::numeric,item->>'description',(item->>'scrapedAt')::timestamptz)
  on conflict(marketplace,asin) do update set title=excluded.title,image_url=excluded.image_url,price=excluded.price,description=excluded.description,scraped_at=excluded.scraped_at returning id into pid;
  wid:=null;
  insert into public.wishlist_wishes(user_id,product_id,visibility) values(uid,pid,visibility) on conflict(user_id,product_id) do nothing returning id into wid;
  if wid is not null then
   inserted:=inserted+1;
   insert into public.wishlist_wish_extras(wish_id,user_id,image_url,target_price,quantity) values(wid,uid,item->>'imageUrl',(item->>'price')::numeric,coalesce((item->>'quantity')::integer,1));
  else select id into wid from public.wishlist_wishes where user_id=uid and product_id=pid;
  end if;
  if lid is not null then insert into public.wishlist_list_items(list_id,user_id,wish_id) values(lid,uid,wid) on conflict do nothing;linked:=linked+1;end if;
 end loop;
 output:=jsonb_build_object('listId',lid,'inserted',inserted,'linked',linked,'existing',jsonb_array_length(snap.payload->'products')-inserted);
 update public.toolya_amazon_previews set result=output where id=preview_id;
 return output;
end $$;
revoke all on function toolya_private.amazon_import(uuid,text,text,uuid) from public;
grant execute on function toolya_private.amazon_import(uuid,text,text,uuid) to authenticated;
create function public.toolya_amazon_import(p_preview_id uuid,p_list_title text default null,p_visibility text default 'private',p_target_list uuid default null) returns jsonb language sql security invoker set search_path='' as $$select toolya_private.amazon_import(p_preview_id,p_list_title,p_visibility,p_target_list)$$;
revoke all on function public.toolya_amazon_import(uuid,text,text,uuid) from public,anon;
grant execute on function public.toolya_amazon_import(uuid,text,text,uuid) to authenticated;
