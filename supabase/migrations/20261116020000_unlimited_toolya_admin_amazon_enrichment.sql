-- Only the verified auth.users account info@toolya.app may bypass enrichment request quotas.
-- Ownership checks, valid ASINs and advisory lock remain mandatory.
create or replace function public.claim_amazon_wishlist_enrichment(p_publication_id uuid,p_user_id uuid,p_asin text)
returns text language plpgsql security invoker set search_path='' as $claim$
declare v_count integer; v_unlimited boolean;
begin
 if p_asin !~ '^[A-Z0-9]{10}$' then return 'invalid_asin'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text,7219));
 if not exists(
  select 1 from public.wishlist_amazon_publications w
  join public.wishlist_amazon_publication_products p on p.publication_id=w.id
  where w.id=p_publication_id and w.user_id=p_user_id and w.scrape_status='success' and p.asin=p_asin
 ) then return 'not_found'; end if;
 select exists(select 1 from auth.users where id=p_user_id and pg_catalog.lower(email)='info@toolya.app')
 into v_unlimited;
 if not v_unlimited then
   if exists(select 1 from public.wishlist_amazon_enrichment_attempts a
    where a.user_id=p_user_id and a.publication_id=p_publication_id and a.asin=p_asin
      and a.attempted_at>pg_catalog.now()-interval '10 minutes')
   then return 'recently_attempted'; end if;
   select count(*) into v_count from public.wishlist_amazon_enrichment_attempts a
   where a.user_id=p_user_id and a.attempted_at>pg_catalog.now()-interval '1 hour';
   if v_count>=20 then return 'rate_limited'; end if;
 end if;
 insert into public.wishlist_amazon_enrichment_attempts(user_id,publication_id,asin)
 values(p_user_id,p_publication_id,p_asin);
 return 'claimed';
end $claim$;
revoke all on function public.claim_amazon_wishlist_enrichment(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.claim_amazon_wishlist_enrichment(uuid,uuid,text) to service_role;