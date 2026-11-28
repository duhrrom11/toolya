-- Legacy public URLs and bookmark IDs existed before the directory schema.
insert into auth.users(id) values
 ('a1111111-1111-4111-8111-111111111111'),
 ('a2222222-2222-4222-8222-222222222222');
insert into public.wishlist_public_profiles
 (user_id,display_name,country,lists,profile_kind,first_name,last_name)
values ('a1111111-1111-4111-8111-111111111111','Zoë Schröder','Österreich',
 '[{"name":"Öffentlich","url":"https://www.amazon.de/hz/wishlist/ls/PUBLIC123","occasion":"Hochzeit"}]',
 'person','Zoë','Schröder');
insert into public.wishlist_amazon_publications(id,user_id,title,amazon_url,scrape_status,published_at)
values ('aa111111-1111-4111-8111-111111111111','a1111111-1111-4111-8111-111111111111','Legacy',
 'https://www.amazon.de/hz/wishlist/ls/PUBLIC123','success',now());
alter table public.wishlist_amazon_publications enable row level security;
alter table public.wishlist_amazon_publication_products enable row level security;
create policy "Successful public list or owner read" on public.wishlist_amazon_publications for select to anon,authenticated using (scrape_status='success');
grant select on public.wishlist_amazon_publications to anon,authenticated;

create schema if not exists toolya_private;
create table toolya_private.wishlist_link_health(
 list_key text primary key, request_id bigint, requested_at timestamptz, next_check_at timestamptz default now(),
 http_status integer, outcome text default 'not_checked', checked_at timestamptz, updated_at timestamptz default now()
);
