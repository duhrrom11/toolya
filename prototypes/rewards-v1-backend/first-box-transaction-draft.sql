-- Toolya Rewards V1: atomic, server-owned first-box write + private reward draft.
-- REQUIRES schema-draft.sql in an ISOLATED test database. Never run on production.
-- RPC is public-schema only for service_role REST access. It is NOT publicly callable.
-- No change to existing toolya_save_snapshot or user_data policies/grants.
begin;

create function public.toolya_rewards_pilot_first_box(
  p_user_id uuid,
  p_expected_revision bigint,
  p_location_id bigint,
  p_box_name text
) returns table(persisted_revision bigint, box_id bigint, reward_granted boolean, total_xp bigint, organisation_kp bigint)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_original jsonb;
  v_next jsonb;
  v_old_revision bigint;
  v_box_id bigint;
  v_box jsonb;
  v_reward record;
begin
  if p_user_id is null or p_expected_revision is null or p_expected_revision < 1
     or p_location_id is null or p_location_id < 1
     or p_box_name is null or length(btrim(p_box_name)) not between 1 and 150
     or octet_length(p_box_name) > 600 then
    raise exception 'Invalid pilot request' using errcode='22023';
  end if;

  -- Lock existing snapshot: no client-provided before/after, revision or proof flags.
  select d.data,d.revision into v_original,v_old_revision
    from public.user_data d
   where d.user_id=p_user_id and d.tool='umzugskisten-inventar'
   for update;
  if not found or v_old_revision <> p_expected_revision then
    raise exception 'Pilot revision conflict' using errcode='40001';
  end if;
  if jsonb_typeof(v_original->'locations') <> 'array'
     or jsonb_typeof(v_original->'boxes') <> 'array'
     or jsonb_array_length(v_original->'boxes') <> 0 then
    raise exception 'Not eligible for first-box pilot' using errcode='22023';
  end if;
  if not exists (
    select 1 from pg_catalog.jsonb_array_elements(v_original->'locations') as loc(value)
    where pg_catalog.jsonb_typeof(loc.value)='object'
      and pg_catalog.jsonb_typeof(loc.value->'id')='number'
      and (loc.value->>'id')::bigint=p_location_id
      and pg_catalog.jsonb_typeof(loc.value->'name')='string'
      and length(btrim(loc.value->>'name'))>0
  ) then
    raise exception 'Unknown location' using errcode='22023';
  end if;

  -- Snapshot uses JS Date.now() for IDs: preserve number semantics.
  -- One-box-only transaction avoids collision with existing box IDs.
  v_box_id := floor(extract(epoch from clock_timestamp())*1000)::bigint;
  v_box := pg_catalog.jsonb_build_object(
    'id',v_box_id,'locId',p_location_id,'name',btrim(p_box_name),
    'desc','','value',0,'tag','Standard','barcode','','expiry','',
    'lentTo','','subItems','[]'::jsonb,'photo',''
  );
  v_next := pg_catalog.jsonb_set(v_original,'{boxes}',
      pg_catalog.jsonb_build_array(v_box),false);

  update public.user_data d
     set data=v_next,revision=v_old_revision+1,updated_at=now()
   where d.user_id=p_user_id and d.tool='umzugskisten-inventar'
     and d.revision=v_old_revision;
  if not found then raise exception 'Pilot write conflict' using errcode='40001'; end if;

  -- Grant in the same transaction; uniqueness ensures idempotency.
  -- This internal function does NOT accept user-supplied reward amounts.
  select g.granted,g.total_xp,g.organisation_kp
    into v_reward
    from toolya_rewards.record_verified_first_box(p_user_id) g;

  return query select v_old_revision+1,v_box_id,
    v_reward.granted,v_reward.total_xp,v_reward.organisation_kp;
end $$;

revoke all on function public.toolya_rewards_pilot_first_box(uuid,bigint,bigint,text) from public, anon, authenticated;
grant execute on function public.toolya_rewards_pilot_first_box(uuid,bigint,bigint,text) to service_role;

-- SECURITY GATE:
-- Only the server-side Edge Function may call this RPC using service_role.
-- A client can still directly write its own user_data JSON by design, so no
-- physically provable box authenticity is claimed. One-time grant caps risk.
-- A failed grant rolls back the *pilot transaction*. Existing UI remains
-- on the original cloud-save path until explicit safe migration/integration.
commit;
