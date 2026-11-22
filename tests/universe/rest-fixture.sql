-- Model the managed Supabase data API roles and claim helpers in the disposable database.
create role universe_authenticator login noinherit password 'isolated-rest-only';
grant anon, authenticated to universe_authenticator;
grant usage on schema public to anon, authenticated;

create or replace function auth.jwt()
returns jsonb language sql stable set search_path = ''
as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb) $$;

create or replace function auth.uid()
returns uuid language sql stable set search_path = ''
as $$ select nullif(auth.jwt()->>'sub', '')::uuid $$;
