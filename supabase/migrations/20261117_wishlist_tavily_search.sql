-- Tavily free-tier integration: only service_role may read the encrypted key or consume quota.
create table if not exists toolya_private.wishlist_tavily_monthly_quota (
  month_utc date primary key,
  used integer not null default 0 check (used between 0 and 900)
);
alter table toolya_private.wishlist_tavily_monthly_quota enable row level security;
revoke all on toolya_private.wishlist_tavily_monthly_quota from public, anon, authenticated;
grant select,insert,update on toolya_private.wishlist_tavily_monthly_quota to service_role;

create or replace function public.wishlist_tavily_key(new_key text default null)
returns text language plpgsql security definer set search_path = ''
as $fn$
declare secret_id uuid; secret_value text;
begin
 select id,decrypted_secret into secret_id,secret_value
 from vault.decrypted_secrets where name='toolya_wishlist_tavily_key';
 if new_key is not null then
  if length(new_key) not between 20 and 200 or left(new_key,5)<>'tvly-' then
   raise exception 'Ungültiger Tavily-Schlüssel';
  end if;
  if secret_id is null then
   perform vault.create_secret(new_key,'toolya_wishlist_tavily_key','Toolya wishlist Tavily Search API');
  else
   perform vault.update_secret(secret_id,new_key);
  end if;
  return 'configured';
 end if;
 return secret_value;
end $fn$;
revoke all on function public.wishlist_tavily_key(text) from public, anon, authenticated;
grant execute on function public.wishlist_tavily_key(text) to service_role;

-- Claim one credit atomically before any external API call. No paid overage in Toolya.
-- The reserve (900) leaves headroom within Tavily's free 1,000-credit allowance.
create or replace function public.wishlist_tavily_quota(claim boolean default false)
returns jsonb language plpgsql security definer set search_path = ''
as $fn$
declare m date := date_trunc('month',now() at time zone 'UTC')::date;
        n integer := 0; allowed boolean := true;
begin
 if claim then
  insert into toolya_private.wishlist_tavily_monthly_quota(month_utc,used)
  values(m,1)
  on conflict (month_utc) do update
   set used=toolya_private.wishlist_tavily_monthly_quota.used+1
   where toolya_private.wishlist_tavily_monthly_quota.used<900
  returning used into n;
  if not found then allowed := false; end if;
 else
  select used into n from toolya_private.wishlist_tavily_monthly_quota where month_utc=m;
 end if;
 n:=coalesce(n,900);
 if not claim and not exists(select 1 from toolya_private.wishlist_tavily_monthly_quota where month_utc=m) then n:=0; end if;
 return jsonb_build_object('allowed',allowed and n<=900, 'used',n,'limit',900,'remaining',greatest(0,900-n));
end $fn$;
revoke all on function public.wishlist_tavily_quota(boolean) from public, anon, authenticated;
grant execute on function public.wishlist_tavily_quota(boolean) to service_role;
