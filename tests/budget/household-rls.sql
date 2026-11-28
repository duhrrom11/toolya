\set ON_ERROR_STOP on
-- Run ONLY against a disposable PostgreSQL instance.
create role authenticated nologin;
create role anon nologin;
create schema auth;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$
 select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
create function auth.jwt() returns jsonb language sql stable as $$
 select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb
$$;
grant usage on schema auth to authenticated,anon;
grant execute on function auth.uid(),auth.jwt() to authenticated,anon;
insert into auth.users values ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002'),('00000000-0000-0000-0000-000000000003');
\ir ../../supabase/release-candidates/budget-household.sql
begin;
set local role authenticated;
select set_config('request.jwt.claims','{"is_anonymous":false}',true);
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
insert into public.budget_households(id,title) values ('10000000-0000-0000-0000-000000000001','Test household');
insert into public.budget_household_invites(household_id,owner_id,invitee_id) values ('10000000-0000-0000-0000-000000000001',auth.uid(),'00000000-0000-0000-0000-000000000002');
insert into public.budget_household_shares(household_id,booking_id,title,booking_date,cents) values ('10000000-0000-0000-0000-000000000001',1,'Shared expense','2026-01-01',1000);
do $$ begin
 update public.budget_household_invites set accepted=true;
 if found then raise exception 'Owner accepted own invitation'; end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',true);
do $$ begin
 if exists(select 1 from public.budget_households) or exists(select 1 from public.budget_household_shares) or exists(select 1 from public.budget_household_invites) then raise exception 'Outsider data leak'; end if;
 begin
 insert into public.budget_household_shares(household_id,booking_id,title,booking_date,cents) values ('10000000-0000-0000-0000-000000000001',2,'Forbidden','2026-01-01',100);
 raise exception 'Outsider inserted share';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
do $$ begin
 if exists(select 1 from public.budget_household_shares) then raise exception 'Pending member sees shares'; end if;
 if (select count(*) from public.budget_household_invites)<>1 then raise exception 'Invitation invisible'; end if;
 update public.budget_household_invites set accepted=true;
 if not found then raise exception 'Acceptance failed'; end if;
 if (select count(*) from public.budget_household_shares)<>1 then raise exception 'Accepted member cannot read share'; end if;
 delete from public.budget_household_shares where booking_id=1;
 if found then raise exception 'Member deleted foreign share'; end if;
end $$;
insert into public.budget_household_shares(household_id,booking_id,title,booking_date,cents) values ('10000000-0000-0000-0000-000000000001',2,'Member expense','2026-01-02',2000);
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
do $$ begin
 if (select count(*) from public.budget_household_shares)<>2 then raise exception 'Owner cannot see member share'; end if;
 delete from public.budget_household_invites;
 if (select count(*) from public.budget_household_shares)<>1 then raise exception 'Revocation cleanup failed'; end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
do $$ begin
 if exists(select 1 from public.budget_household_shares) then raise exception 'Revoked member sees data'; end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
select set_config('request.jwt.claims','{"is_anonymous":true}',true);
do $$ begin
 if exists(select 1 from public.budget_households) then raise exception 'Anonymous identity sees data'; end if;
end $$;
rollback;
