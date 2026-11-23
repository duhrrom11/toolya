-- Toolya Rewards V1 | OFFLINE SCHEMA DRAFT -- NEVER APPLY TO PRODUCTION AUTOMATICALLY
-- This file is NOT an active Supabase migration. It is a reviewable prototype.
-- Scope: one first-success pilot, XP, competency points, nine badges. No frontend grants.
-- Execute only in an isolated local/staging Postgres with Supabase auth schema/roles.
-- Security assumptions: service_role is server-side ONLY, schema is NOT Data API exposed.
begin;

create schema if not exists toolya_rewards;
revoke all on schema toolya_rewards from public, anon, authenticated;
grant usage on schema toolya_rewards to service_role;

create table toolya_rewards.event_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  tool_id text not null,
  competency text not null check (competency in ('organisation','finanzen','fuersorge','planung','vorsorge')),
  xp integer not null check (xp >= 0 and xp <= 20),
  kp integer not null check (kp >= 0 and kp <= 10),
  awarded_at timestamptz not null default now(),
  constraint reward_pilot_event_allowed check (
    event_type = 'moving.first_box_saved.v1'
    and tool_id = 'umzugskisten-inventar'
    and competency = 'organisation'
    and xp = 20 and kp = 10
  ),
  constraint reward_one_first_box_per_user unique (user_id, event_type)
);

create table toolya_rewards.user_badges (
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id text not null check (badge_id in (
    'first_success','three_tools','five_tools','organization_30',
    'finance_30','care_20','planning_20','prepared_20','three_days'
  )),
  awarded_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

create index reward_ledger_user_date on toolya_rewards.event_ledger(user_id, awarded_at);

alter table toolya_rewards.event_ledger enable row level security;
alter table toolya_rewards.user_badges enable row level security;
-- No client RLS policies: tables are completely inaccessible to anon/authenticated.
revoke all on all tables in schema toolya_rewards from public, anon, authenticated;
revoke all on all sequences in schema toolya_rewards from public, anon, authenticated;
grant select, insert on toolya_rewards.event_ledger to service_role;
grant select, insert on toolya_rewards.user_badges to service_role;
grant usage, select on all sequences in schema toolya_rewards to service_role;

-- The function deliberately DOES NOT verify a real new box.
-- Caller must be a trusted, separately reviewed server-side workflow, never the browser.
-- One grant per authenticated account across retries and concurrent calls.
create function toolya_rewards.record_verified_first_box(p_user_id uuid)
returns table(granted boolean, total_xp bigint, organisation_kp bigint, badges text[])
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_new bigint;
  v_xp bigint;
  v_kp bigint;
  v_badges text[];
begin
  if p_user_id is null then
    raise exception 'Missing verified user ID' using errcode = '22023';
  end if;

  -- Serialize all user-specific first-box grants: conflict-safe even with retries.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 0));

  insert into toolya_rewards.event_ledger(user_id,event_type,tool_id,competency,xp,kp)
  values (p_user_id,'moving.first_box_saved.v1','umzugskisten-inventar','organisation',20,10)
  on conflict (user_id,event_type) do nothing
  returning id into v_new;

  -- Only the existing first-success badge is reachable in the current one-tool pilot.
  -- The other eight badge definitions are reserved for verified tool adapters later.
  if v_new is not null then
    insert into toolya_rewards.user_badges(user_id,badge_id)
    values (p_user_id,'first_success')
    on conflict (user_id,badge_id) do nothing;
  end if;

  select coalesce(sum(l.xp),0), coalesce(sum(l.kp) filter (where l.competency='organisation'),0)
  into v_xp,v_kp
  from toolya_rewards.event_ledger l where l.user_id=p_user_id;

  select coalesce(array_agg(b.badge_id order by b.badge_id),array[]::text[])
  into v_badges from toolya_rewards.user_badges b where b.user_id=p_user_id;

  return query select (v_new is not null),v_xp,v_kp,v_badges;
end $$;

revoke all on function toolya_rewards.record_verified_first_box(uuid) from public, anon, authenticated;
grant execute on function toolya_rewards.record_verified_first_box(uuid) to service_role;

-- Explicit default-privilege guidance: future objects require separate privilege review.
-- There is intentionally NO public-facing claim endpoint and NO browser integration here.
commit;
