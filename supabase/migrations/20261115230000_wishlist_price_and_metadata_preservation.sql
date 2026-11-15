-- Preserve existing records; only schema and transactional import logic change.
alter table public.wishlist_amazon_publication_products
  add column if not exists price numeric(12,2)
  check (price is null or (price >= 0 and price <= 999999));

CREATE OR REPLACE FUNCTION public.commit_amazon_wishlist_scrape(p_publication_id uuid, p_user_id uuid, p_products jsonb, p_title text)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare v_count integer;
begin
 if pg_catalog.jsonb_typeof(p_products)<>'array' or pg_catalog.jsonb_array_length(p_products)=0 or pg_catalog.jsonb_array_length(p_products)>500 then raise exception 'invalid products'; end if;
 perform 1 from public.wishlist_amazon_publications where id=p_publication_id and user_id=p_user_id and scrape_status='processing' for update;
 if not found then raise exception 'publication not processing'; end if;
 if exists(select 1 from pg_catalog.jsonb_to_recordset(p_products) as x(asin text,title text,product_url text,price numeric) where asin !~ '^[A-Z0-9]{10}$' or nullif(pg_catalog.btrim(title),'') is null or product_url !~ '^https://www[.]amazon[.]de/dp/[A-Z0-9]{10}' or (price is not null and (price<0 or price>999999))) then raise exception 'invalid product'; end if;
 update public.wishlist_amazon_publication_products existing
 set title=x.title, description=coalesce(nullif(pg_catalog.btrim(x.description),''),existing.description),
 product_url=x.product_url,image_url=coalesce(x.image_url,existing.image_url),price=coalesce(x.price,existing.price)
 from pg_catalog.jsonb_to_recordset(p_products) as x(asin text,title text,description text,product_url text,image_url text,price numeric)
 where existing.publication_id=p_publication_id and existing.asin=x.asin;
 insert into public.wishlist_amazon_publication_products(publication_id,asin,title,description,product_url,image_url,price)
 select p_publication_id,x.asin,x.title,nullif(pg_catalog.btrim(x.description),''),x.product_url,x.image_url,x.price
 from pg_catalog.jsonb_to_recordset(p_products) as x(asin text,title text,description text,product_url text,image_url text,price numeric)
 where not exists(select 1 from public.wishlist_amazon_publication_products old where old.publication_id=p_publication_id and old.asin=x.asin);
 delete from public.wishlist_amazon_publication_products existing where existing.publication_id=p_publication_id and not exists(select 1 from pg_catalog.jsonb_to_recordset(p_products) as x(asin text) where x.asin=existing.asin);
 v_count=pg_catalog.jsonb_array_length(p_products);
 update public.wishlist_amazon_publications set scrape_status='success',scrape_error=null,title=coalesce(nullif(pg_catalog.btrim(p_title),''),title),updated_at=pg_catalog.now() where id=p_publication_id and user_id=p_user_id;
 return v_count;
end $function$
;

revoke all on function public.commit_amazon_wishlist_scrape(uuid,uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.commit_amazon_wishlist_scrape(uuid,uuid,jsonb,text) to service_role;
