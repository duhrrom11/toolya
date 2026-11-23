-- Toolya Rewards V1: atomic full-fidelity first-box save + private reward DRAFT.
-- NOT an active migration. Run only in isolated local/staging Postgres after review.
-- Requires schema-draft.sql, existing public.user_data and auth users.
-- Does NOT alter existing RPCs, grants or existing cloud storage paths.
begin;

create function public.toolya_rewards_pilot_first_box(
  p_user_id uuid,
  p_expected_revision bigint,
  p_location_id bigint,
  p_box jsonb
) returns table(persisted_revision bigint, box_id bigint, reward_granted boolean, total_xp bigint, organisation_kp bigint)
language plpgsql security invoker set search_path = ''
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
     or p_box is null or pg_catalog.jsonb_typeof(p_box) <> 'object'
     or (select count(*) from pg_catalog.jsonb_object_keys(p_box)) <> 9
     or (select count(*) from pg_catalog.jsonb_object_keys(p_box) k
         where k in ('name','desc','value','tag','barcode','expiry','lentTo','subItems','photo')) <> 9 then
    raise exception 'Invalid pilot request' using errcode='22023';
  end if;
  if pg_catalog.jsonb_typeof(p_box->'name') <> 'string'
     or length(btrim(p_box->>'name')) not between 1 and 150
     or pg_catalog.octet_length(p_box->>'name') > 600
     or pg_catalog.jsonb_typeof(p_box->'desc') <> 'string'
     or length(p_box->>'desc') > 20000
     or pg_catalog.jsonb_typeof(p_box->'tag') <> 'string'
     or length(p_box->>'tag') > 100
     or pg_catalog.jsonb_typeof(p_box->'barcode') <> 'string'
     or length(p_box->>'barcode') > 300
     or pg_catalog.jsonb_typeof(p_box->'expiry') <> 'string'
     or length(p_box->>'expiry') > 20
     or ((p_box->>'expiry') <> '' and (p_box->>'expiry') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$')
     or pg_catalog.jsonb_typeof(p_box->'lentTo') <> 'string'
     or length(p_box->>'lentTo') > 300
     or pg_catalog.jsonb_typeof(p_box->'photo') <> 'string'
     or pg_catalog.octet_length(p_box->>'photo') > 3000000
     or ((p_box->>'photo') <> '' and
         (p_box->>'photo') !~ '^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$')
     or pg_catalog.jsonb_typeof(p_box->'value') <> 'number'
     or pg_catalog.jsonb_typeof(p_box->'subItems') <> 'array'
     or pg_catalog.jsonb_array_length(p_box->'subItems') > 1000
     or pg_catalog.octet_length(p_box::text) > 4000000 then
    raise exception 'Invalid box fields' using errcode='22023';
  end if;
  if (p_box->>'value')::numeric < 0 or (p_box->>'value')::numeric > 100000000 then
    raise exception 'Invalid box value' using errcode='22023';
  end if;
  if exists (
    select 1 from pg_catalog.jsonb_array_elements(p_box->'subItems') as item(value)
    where pg_catalog.jsonb_typeof(item.value) <> 'object'
       or (select count(*) from pg_catalog.jsonb_object_keys(item.value)) <> 2
       or pg_catalog.jsonb_typeof(item.value->'name') <> 'string'
       or length(btrim(item.value->>'name')) not between 1 and 300
       or pg_catalog.jsonb_typeof(item.value->'value') <> 'number'
       or (case when pg_catalog.jsonb_typeof(item.value->'value')='number'
           then (item.value->>'value')::numeric < 0 or (item.value->>'value')::numeric > 100000000
           else true end)
  ) then
    raise exception 'Invalid subitems' using errcode='22023';
  end if;

  -- Lock the real saved snapshot. Client cannot provide prior state or trust flags.
  select d.data,d.revision into v_original,v_old_revision
    from public.user_data d
   where d.user_id=p_user_id and d.tool='umzugskisten-inventar'
   for update;
  if not found or v_old_revision <> p_expected_revision then
    raise exception 'Pilot revision conflict' using errcode='40001';
  end if;
  if pg_catalog.jsonb_typeof(v_original->'locations') <> 'array'
     or pg_catalog.jsonb_typeof(v_original->'boxes') <> 'array'
     or pg_catalog.jsonb_array_length(v_original->'boxes') <> 0 then
    raise exception 'Not eligible for first-box pilot' using errcode='22023';
  end if;
  if not exists (
    select 1 from pg_catalog.jsonb_array_elements(v_original->'locations') as loc(value)
    where pg_catalog.jsonb_typeof(loc.value)='object'
      and pg_catalog.jsonb_typeof(loc.value->'id')='number'
      and (loc.value->>'id')::numeric=p_location_id
      and pg_catalog.jsonb_typeof(loc.value->'name')='string'
      and length(btrim(loc.value->>'name'))>0
  ) then
    raise exception 'Unknown location' using errcode='22023';
  end if;

  -- One box only. The full legacy fields are preserved unchanged except trim name.
  -- A millisecond timestamp remains the old tool's ID shape, but its uniqueness
  -- and first-box-only assumption must be validated in real staging.
  v_box_id := floor(extract(epoch from clock_timestamp())*1000)::bigint;
  v_box := pg_catalog.jsonb_build_object(
    'id',v_box_id,
    'locId',p_location_id,
    'name',btrim(p_box->>'name'),
    'desc',p_box->>'desc',
    'value',p_box->'value',
    'tag',p_box->>'tag',
    'barcode',p_box->>'barcode',
    'expiry',p_box->>'expiry',
    'lentTo',p_box->>'lentTo',
    'subItems',p_box->'subItems',
    'photo',p_box->>'photo'
  );
  v_next := pg_catalog.jsonb_set(v_original,'{boxes}',pg_catalog.jsonb_build_array(v_box),false);
  if pg_catalog.octet_length(v_next::text)>4200000 then
    raise exception 'Snapshot exceeds cloud limit' using errcode='22023';
  end if;
  update public.user_data d
     set data=v_next,revision=v_old_revision+1,updated_at=pg_catalog.now()
   where d.user_id=p_user_id and d.tool='umzugskisten-inventar'
     and d.revision=v_old_revision;
  if not found then raise exception 'Pilot write conflict' using errcode='40001'; end if;

  -- One transaction: reject ALL changes if the private grant fails.
  -- This does not pretend to prove physical-world box authenticity.
  select g.granted,g.total_xp,g.organisation_kp into v_reward
    from toolya_rewards.record_verified_first_box(p_user_id) g;
  return query select v_old_revision+1,v_box_id,
    v_reward.granted,v_reward.total_xp,v_reward.organisation_kp;
end $$;

revoke all on function public.toolya_rewards_pilot_first_box(uuid,bigint,bigint,jsonb) from public, anon, authenticated;
grant execute on function public.toolya_rewards_pilot_first_box(uuid,bigint,bigint,jsonb) to service_role;
commit;
