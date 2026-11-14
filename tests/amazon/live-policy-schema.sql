-- Isolated PostgreSQL 17 fixture. Policies read from Toolya on 2026-11-14.
-- Run only in a disposable local/CI container, never on Supabase.
create role anon nologin;
create role authenticated nologin;
create schema auth;
grant usage on schema auth to anon,authenticated;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$select (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid$$;
create table public.wishlist_profiles(user_id uuid primary key references auth.users(id),handle text unique,display_name text);
create table public.wishlist_products(id bigint generated always as identity primary key,marketplace text,asin text unique,title text);
create table public.wishlist_wishes(id bigint generated always as identity primary key,user_id uuid references public.wishlist_profiles(user_id),product_id bigint references public.wishlist_products(id),visibility text default 'public',unique(id,user_id));
create table public.wishlist_lists(id uuid primary key default gen_random_uuid(),user_id uuid references public.wishlist_profiles(user_id),title text,visibility text default 'private',archived boolean default false,unique(id,user_id));
create table public.wishlist_list_items(list_id uuid,user_id uuid,wish_id bigint,primary key(list_id,wish_id),foreign key(list_id,user_id) references public.wishlist_lists(id,user_id),foreign key(wish_id,user_id) references public.wishlist_wishes(id,user_id));
alter table public.wishlist_lists enable row level security;
alter table public.wishlist_wishes enable row level security;
alter table public.wishlist_list_items enable row level security;
grant select on all tables in schema public to anon;
grant select,insert,update,delete on all tables in schema public to authenticated;
grant usage,select on all sequences in schema public to authenticated;
create policy "list items owner delete" on public.wishlist_list_items for DELETE to authenticated using ((( SELECT auth.uid() AS uid) = user_id));
create policy "list items owner insert" on public.wishlist_list_items for INSERT to authenticated with check (((( SELECT auth.uid() AS uid) = user_id) AND (EXISTS ( SELECT 1
   FROM wishlist_lists l
  WHERE ((l.id = wishlist_list_items.list_id) AND (l.user_id = ( SELECT auth.uid() AS uid))))) AND (EXISTS ( SELECT 1
   FROM wishlist_wishes w
  WHERE ((w.id = wishlist_list_items.wish_id) AND (w.user_id = ( SELECT auth.uid() AS uid)))))));
create policy "list items owner read" on public.wishlist_list_items for SELECT to authenticated using ((( SELECT auth.uid() AS uid) = user_id));
create policy "public collection items read" on public.wishlist_list_items for SELECT to anon, authenticated using (((EXISTS ( SELECT 1
   FROM wishlist_lists l
  WHERE ((l.id = wishlist_list_items.list_id) AND (l.user_id = wishlist_list_items.user_id) AND (l.visibility = 'public'::text) AND (l.archived = false)))) AND (EXISTS ( SELECT 1
   FROM wishlist_wishes w
  WHERE ((w.id = wishlist_list_items.wish_id) AND (w.user_id = wishlist_list_items.user_id) AND (w.visibility = 'public'::text))))));
create policy "lists owner delete" on public.wishlist_lists for DELETE to authenticated using ((( SELECT auth.uid() AS uid) = user_id));
create policy "lists owner insert" on public.wishlist_lists for INSERT to authenticated with check ((( SELECT auth.uid() AS uid) = user_id));
create policy "lists owner read" on public.wishlist_lists for SELECT to authenticated using ((( SELECT auth.uid() AS uid) = user_id));
create policy "lists owner update" on public.wishlist_lists for UPDATE to authenticated using ((( SELECT auth.uid() AS uid) = user_id)) with check ((( SELECT auth.uid() AS uid) = user_id));
create policy "public collections read" on public.wishlist_lists for SELECT to anon, authenticated using (((visibility = 'public'::text) AND (archived = false)));
create policy "wishlist wishes owner delete" on public.wishlist_wishes for DELETE to authenticated using ((( SELECT auth.uid() AS uid) = user_id));
create policy "wishlist wishes owner insert" on public.wishlist_wishes for INSERT to authenticated with check ((( SELECT auth.uid() AS uid) = user_id));
create policy "wishlist wishes owner update" on public.wishlist_wishes for UPDATE to authenticated using ((( SELECT auth.uid() AS uid) = user_id)) with check ((( SELECT auth.uid() AS uid) = user_id));
create policy "wishlist wishes visible or owner read" on public.wishlist_wishes for SELECT to anon, authenticated using (((visibility = 'public'::text) OR (user_id = ( SELECT auth.uid() AS uid))));
