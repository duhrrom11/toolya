-- Additive rollout: existing wishlist and gift records are retained.
alter table public.wishlist_profiles add column if not exists first_name text;
alter table public.wishlist_profiles add column if not exists last_name text;
alter table public.wishlist_profiles add column if not exists country text;
create table if not exists public.wishlist_amazon_publications (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 amazon_url text not null,
 title text,
 scrape_status text not null default 'pending' check (scrape_status in ('pending','processing','success','failed')),
 scrape_error text,
 published_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(user_id,amazon_url),
 constraint amazon_url_valid check (length(amazon_url) <= 2048 and amazon_url ~* '^https://(www[.])?amazon[.](de|com|co[.]uk|fr|it|es|nl|pl|se|com[.]be|co[.]jp|ca|com[.]au)/(hz/wishlist/ls|gp/registry/wishlist|registry/wishlist)/[a-z0-9]+/?$')
);
create table if not exists public.wishlist_amazon_publication_products (
 id uuid primary key default gen_random_uuid(),
 publication_id uuid references public.wishlist_amazon_publications(id) on delete cascade,
 title text not null,
 description text,
 product_url text,
 image_url text,
 asin text,
 created_at timestamptz not null default now()
);
alter table public.wishlist_amazon_publications enable row level security;
alter table public.wishlist_amazon_publication_products enable row level security;
create policy "Public list read" on public.wishlist_amazon_publications for select to anon,authenticated using (true);
create policy "Owner insert with complete profile" on public.wishlist_amazon_publications for insert to authenticated with check (
 user_id=(select auth.uid()) and exists (
 select 1 from public.wishlist_profiles p where p.user_id=(select auth.uid())
 and nullif(btrim(p.first_name),'') is not null and nullif(btrim(p.last_name),'') is not null
 )
);
create policy "Owner delete" on public.wishlist_amazon_publications for delete to authenticated using (user_id=(select auth.uid()));
create policy "Public products read" on public.wishlist_amazon_publication_products for select to anon,authenticated using (true);
create index if not exists wishlist_amazon_latest on public.wishlist_amazon_publications(published_at desc);
create index if not exists wishlist_amazon_product_parent on public.wishlist_amazon_publication_products(publication_id);
-- Substring search via strpos does not use a full-text GIN index; add pg_trgm indexes only after a query-plan review.
-- Existing profiles without names remain readable but cannot publish until completed.

-- Server-side, paginated discovery. Invoker rights preserve table RLS.
create or replace function public.search_public_amazon_wishlists(search_term text default '', page_limit integer default 24, page_offset integer default 0)
returns table(id uuid,user_id uuid,amazon_url text,title text,scrape_status text,published_at timestamptz,first_name text,last_name text,country text)
language sql stable security invoker set search_path = '' as $$
 select l.id,l.user_id,l.amazon_url,l.title,l.scrape_status,l.published_at,p.first_name,p.last_name,p.country
 from public.wishlist_amazon_publications l
 join public.wishlist_profiles p on p.user_id=l.user_id
 where length(coalesce(search_term,''))<=150
 and (nullif(btrim(search_term),'') is null
 or strpos(lower(concat_ws(' ',p.first_name,p.last_name,p.country,p.display_name,p.handle,l.title,l.amazon_url)),lower(btrim(search_term)))>0
 or exists (select 1 from public.wishlist_amazon_publication_products x where x.publication_id=l.id
 and strpos(lower(concat_ws(' ',x.title,x.description,x.asin,x.product_url)),lower(btrim(search_term)))>0))
 order by l.published_at desc,l.id desc
 limit least(greatest(coalesce(page_limit,24),1),50)
 offset least(greatest(coalesce(page_offset,0),0),100000)
$$;
revoke all on function public.search_public_amazon_wishlists(text,integer,integer) from public;
grant execute on function public.search_public_amazon_wishlists(text,integer,integer) to anon,authenticated;
grant select on public.wishlist_amazon_publications,public.wishlist_amazon_publication_products to anon,authenticated;
grant select (user_id,first_name,last_name,country,display_name,handle) on public.wishlist_profiles to anon,authenticated;
grant insert,delete on public.wishlist_amazon_publications to authenticated;
grant insert (first_name,last_name,country),update (first_name,last_name,country) on public.wishlist_profiles to authenticated;
revoke insert,update,delete on public.wishlist_amazon_publication_products from anon,authenticated;
revoke update on public.wishlist_amazon_publications from anon,authenticated;
-- Only the server-side service role may modify scraped products or publication status.
-- Immutable attempt ledger: publication status timestamps must never reset the hourly cap.
create table if not exists public.wishlist_amazon_scrape_attempts (
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 publication_id uuid references public.wishlist_amazon_publications(id) on delete set null,
 attempted_at timestamptz not null default now()
);
create index if not exists wishlist_amazon_attempts_user_time on public.wishlist_amazon_scrape_attempts(user_id,attempted_at desc);
alter table public.wishlist_amazon_scrape_attempts enable row level security;
revoke all on public.wishlist_amazon_scrape_attempts from public,anon,authenticated;
grant select,insert on public.wishlist_amazon_scrape_attempts to service_role;
-- Service-role-only atomic claim: at most 5 scrape attempts per user per rolling hour.
-- A stale processing claim can be retried after 15 minutes, but never bypasses the rate limit.
create or replace function public.claim_amazon_wishlist_scrape(p_publication_id uuid, p_user_id uuid)
returns text language plpgsql security invoker set search_path = '' as $$
declare
  v_status text;
  v_updated_at timestamptz;
  v_recent integer;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 7159));
  select scrape_status, updated_at into v_status, v_updated_at
  from public.wishlist_amazon_publications
  where id = p_publication_id and user_id = p_user_id for update;
  if not found then return 'not_found'; end if;
  if v_status not in ('pending','processing') then return 'already_processed'; end if;
  if v_status = 'processing' and v_updated_at > pg_catalog.now() - interval '15 minutes' then
    return 'in_progress';
  end if;
  select count(*) into v_recent from public.wishlist_amazon_scrape_attempts
  where user_id = p_user_id and attempted_at > pg_catalog.now() - interval '1 hour';
  if v_recent >= 5 then return 'rate_limited'; end if;
  insert into public.wishlist_amazon_scrape_attempts(user_id,publication_id)
  values (p_user_id,p_publication_id);
  update public.wishlist_amazon_publications
  set scrape_status = 'processing', scrape_error = null, updated_at = pg_catalog.now()
  where id = p_publication_id and user_id = p_user_id;
  return 'claimed';
end $$;
revoke all on function public.claim_amazon_wishlist_scrape(uuid,uuid) from public,anon,authenticated;
grant execute on function public.claim_amazon_wishlist_scrape(uuid,uuid) to service_role;
