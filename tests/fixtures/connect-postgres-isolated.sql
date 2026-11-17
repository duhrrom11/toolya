-- Synthetic PostgreSQL fixture, deliberately detached from any Supabase instance.
create role authenticated nologin;
create role anon nologin;
create schema auth;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as
$$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create function auth.jwt() returns jsonb language sql stable as
$$select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb)$$;
grant usage on schema auth to authenticated,anon;
grant execute on function auth.uid() to authenticated,anon;
grant execute on function auth.jwt() to authenticated,anon;
create table public.user_data(
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id),
 tool text not null,
 data jsonb not null,
 revision bigint not null,
 updated_at timestamp default now(),
 unique (user_id,tool)
);
alter table public.user_data enable row level security;
grant select,insert,update,delete on public.user_data to authenticated;
create policy owner_select on public.user_data for select to authenticated using (auth.uid()=user_id);
create policy owner_update on public.user_data for update to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
insert into auth.users(id) values
 ('11111111-1111-4111-8111-111111111111'),
 ('22222222-2222-4222-8222-222222222222');
insert into public.user_data(user_id,tool,data,revision) values
 ('11111111-1111-4111-8111-111111111111','autokosten-reifenwechsel',
 '{"cars":[],"events":[{"id":101,"title":"Tanken","date":"2026-11-01","cost":20.50}],"tires":[]}',1),
 ('11111111-1111-4111-8111-111111111111','haushaltsbuch-kassenbon',
 '{"entries":[],"budgets":{},"goals":[]}',1),
 ('22222222-2222-4222-8222-222222222222','autokosten-reifenwechsel',
 '{"cars":[],"events":[{"id":999,"title":"Eigene Ausgabe","date":"2026-11-01","cost":15}],"tires":[]}',1),
 ('22222222-2222-4222-8222-222222222222','haushaltsbuch-kassenbon',
 '{"entries":[],"budgets":{},"goals":[]}',1);
\i supabase/migrations/20261117180000_toolya_connect_car_budget.sql

do $$
begin
 if has_function_privilege('anon','public.toolya_connect_car_to_budget(text,bigint,bigint)','EXECUTE') then
  raise exception 'anon RPC exposure';
 end if;
 if has_table_privilege('authenticated','public.connect_transfers','INSERT') then
  raise exception 'browser can forge journal';
 end if;
end $$;

set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
select set_config('request.jwt.claims','{"is_anonymous":false}',false);
do $$
declare r record; n bigint;
begin
 select * into r from public.toolya_connect_car_to_budget('101',1,1);
 if r.status <> 'imported' or r.target_revision <> 2 then
  raise exception 'transfer failed %',row_to_json(r);
 end if;
 select count(*) into n from public.user_data
  where tool='haushaltsbuch-kassenbon'
  and data->'entries'->0->>'title'='Tanken'
  and data->'entries'->0->>'category'='Auto'
  and data->'entries'->0->>'price'='20.50';
 if n <> 1 then raise exception 'mapping failed'; end if;
 select * into r from public.toolya_connect_car_to_budget('101',1,2);
 if r.status <> 'already_imported' then raise exception 'idempotency failed'; end if;
 select count(*) into n from public.connect_transfers;
 if n <> 1 then raise exception 'journal count failed'; end if;
 begin
  perform public.toolya_connect_car_to_budget('101',1,1);
  raise exception 'expected stale target conflict';
 exception when sqlstate '40001' then null; end;
end $$;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
do $$
declare n bigint;
begin
 select count(*) into n from public.connect_transfers;
 if n <> 0 then raise exception 'RLS cross-user leak'; end if;
 begin
  perform public.toolya_connect_car_to_budget('101',1,1);
  raise exception 'cross-account transfer unexpectedly succeeded';
 exception when sqlstate '22023' then null; end;
end $$;
reset role;
do $$
declare n bigint;
begin
 select jsonb_array_length(data->'entries') into n from public.user_data
  where user_id='11111111-1111-4111-8111-111111111111' and tool='haushaltsbuch-kassenbon';
 if n<>1 then raise exception 'unexpected double entry'; end if;
 select jsonb_array_length(data->'entries') into n from public.user_data
  where user_id='22222222-2222-4222-8222-222222222222' and tool='haushaltsbuch-kassenbon';
 if n<>0 then raise exception 'cross-account data changed'; end if;
end $$;
\echo 'PASS: isolated PostgreSQL atomic Connect / idempotency / CAS / RLS / owner scope'
