-- Separate read-only ciphertext: never release the owner's master key or trustee list.
create schema if not exists estate_private;
revoke all on schema estate_private from public, anon, authenticated;
create table estate_private.read_vaults (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 vault_id text not null unique check(vault_id ~ '^v_[A-Za-z0-9_-]{8,80}$'),
 version bigint not null default 0,
 content jsonb not null,
 alarm_id uuid,
 alarm_requested_at timestamptz,
 alarm_started_at timestamptz,
 alarm_deadline timestamptz,
 alarm_canceled_at timestamptz,
 alarm_block_until timestamptz,
 last_check_in timestamptz not null default now(),
 reminder_days integer not null default 30 check(reminder_days between 1 and 365),
 reminders_enabled boolean not null default false,
 next_reminder timestamptz not null default now()+interval '30 days',
 updated_at timestamptz not null default now()
);
create table estate_private.read_guardians (
 key_hash text primary key check(key_hash ~ '^[a-f0-9]{64}$'),
 owner_id uuid not null references estate_private.read_vaults(owner_id) on delete cascade,
 contact_id text not null check(length(contact_id) between 1 and 100),
 envelope jsonb not null,
 unique(owner_id,contact_id)
);
create table estate_private.delivery_jobs (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references estate_private.read_vaults(owner_id) on delete cascade,
 kind text not null check(kind in ('alarm','reminder')), alarm_id uuid,
 created_at timestamptz not null default now(), leased_until timestamptz,
 attempts integer not null default 0, delivered_at timestamptz,
 unique(owner_id,alarm_id)
);
create table estate_private.request_limits (
 bucket text primary key, window_at timestamptz not null, hits integer not null
);
alter table estate_private.read_vaults enable row level security;
alter table estate_private.read_guardians enable row level security;
alter table estate_private.delivery_jobs enable row level security;
alter table estate_private.request_limits enable row level security;
revoke all on all tables in schema estate_private from public,anon,authenticated;
-- Only the Edge Function's service identity may call this bounded dispatcher.
create function public.estate_release_v2(p_action text,p_owner uuid default null,p_data jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v estate_private.read_vaults%rowtype; g estate_private.read_guardians%rowtype;
 keys jsonb; n integer; h text; second_hash text; j estate_private.delivery_jobs%rowtype; result jsonb;
begin
 if p_action='limit' then
  h:=p_data->>'bucket';
  if h is null or length(h)>150 then return '{"allowed":false}'; end if;
  insert into estate_private.request_limits(bucket,window_at,hits) values(h,now(),1)
  on conflict(bucket) do update set hits=case when estate_private.request_limits.window_at < now()-interval '1 minute' then 1 else estate_private.request_limits.hits+1 end,
   window_at=case when estate_private.request_limits.window_at < now()-interval '1 minute' then now() else estate_private.request_limits.window_at end
  returning hits into n;
  delete from estate_private.request_limits where window_at<now()-interval '2 hours';
  return jsonb_build_object('allowed',n<=60);
 end if;
 if p_action='claim' then
  -- Reminder jobs never change alarm state. Consent is per owner, disabled by default.
  for v in select * from estate_private.read_vaults where reminders_enabled and next_reminder<=now() for update skip locked limit 10 loop
   insert into estate_private.delivery_jobs(owner_id,kind) values(v.owner_id,'reminder');
   update estate_private.read_vaults set next_reminder=now()+make_interval(days=>reminder_days) where owner_id=v.owner_id;
  end loop;
  select * into j from estate_private.delivery_jobs where delivered_at is null and attempts<20 and (leased_until is null or leased_until<now()) order by created_at for update skip locked limit 1;
  if not found then return '{}'::jsonb; end if;
  update estate_private.delivery_jobs set attempts=attempts+1,leased_until=now()+interval '5 minutes' where id=j.id;
  select * into v from estate_private.read_vaults where owner_id=j.owner_id;
  if j.kind='alarm' and (v.alarm_id is distinct from j.alarm_id or v.alarm_canceled_at is not null) then
   update estate_private.delivery_jobs set delivered_at=now() where id=j.id; return '{}'::jsonb;
  end if;
  return jsonb_build_object('id',j.id,'owner',j.owner_id,'kind',j.kind,'alarm',j.alarm_id);
 end if;
 if p_action='delivered' then
  select * into j from estate_private.delivery_jobs where id=(p_data->>'id')::uuid;
  if not found then return '{}'::jsonb; end if;
  -- Same owner lock order as cancellation/publish: no stale callback can revive a canceled alarm.
  select * into v from estate_private.read_vaults where owner_id=j.owner_id for update;
  select * into j from estate_private.delivery_jobs where id=j.id for update;
  if j.delivered_at is null then
   update estate_private.delivery_jobs set delivered_at=now() where id=j.id;
   if j.kind='alarm' then
    update estate_private.read_vaults set alarm_started_at=now(),alarm_deadline=now()+interval '24 hours'
     where owner_id=j.owner_id and alarm_id=j.alarm_id and alarm_canceled_at is null and alarm_started_at is null;
   end if;
  end if;
  return '{"ok":true}';
 end if;
 if p_action in ('publish','status','cancel') then
  if p_owner is null or not exists(select 1 from auth.sessions where id=(p_data->>'session')::uuid and user_id=p_owner) then return '{"error":"login_required"}'; end if;
  -- Serialize initial creation too, without relying on an uncommitted row.
  perform pg_advisory_xact_lock(hashtextextended(p_owner::text,2719));
  select * into v from estate_private.read_vaults where owner_id=p_owner for update;
  if p_action='publish' then
   keys:=p_data->'guardians';
   if keys is null or jsonb_typeof(keys)<>'array' or jsonb_array_length(keys)>10 then raise exception 'invalid_guardians'; end if;
   n:=jsonb_array_length(keys);
   if (select count(distinct x->>'id') from jsonb_array_elements(keys) x)<>n or
      (select count(distinct x->>'hash') from jsonb_array_elements(keys) x)<>n or
      exists(select 1 from jsonb_array_elements(keys) x where coalesce(x->>'id','')='' or length(x->>'id')>100 or coalesce(x->>'hash','')!~'^[a-f0-9]{64}$' or jsonb_typeof(x->'envelope') is distinct from 'object') then raise exception 'invalid_guardians'; end if;
   if p_data->>'vaultId' is null or jsonb_typeof(p_data->'content') is distinct from 'object' or octet_length(p_data::text)>1500000 then raise exception 'invalid_content'; end if;
   if v.owner_id is not null and (v.vault_id<>p_data->>'vaultId' or v.version<>(p_data->>'version')::bigint) then return '{"error":"conflict"}'; end if;
   if v.owner_id is null and coalesce((p_data->>'version')::bigint,0)<>0 then return '{"error":"conflict"}'; end if;
   -- Bind to the authenticated owner's actual backup; never to a caller-chosen other vault.
   if not exists(select 1 from public.vault_cloud_snapshots where owner_user_id=p_owner and vault_id=p_data->>'vaultId') then return '{"error":"backup_required"}'; end if;
   insert into estate_private.read_vaults(owner_id,vault_id,content,version) values(p_owner,p_data->>'vaultId',p_data->'content',1)
    on conflict(owner_id) do update set content=excluded.content,version=estate_private.read_vaults.version+1,updated_at=now();
   -- Any trustee membership/key change cancels a pending or expired single-person grant.
   if exists((select contact_id,key_hash from estate_private.read_guardians where owner_id=p_owner except select x->>'id',x->>'hash' from jsonb_array_elements(keys) x)
    union all (select x->>'id',x->>'hash' from jsonb_array_elements(keys) x except select contact_id,key_hash from estate_private.read_guardians where owner_id=p_owner)) then
    update estate_private.read_vaults set alarm_canceled_at=now() where owner_id=p_owner and alarm_id is not null;
   end if;
   delete from estate_private.read_guardians where owner_id=p_owner;
   insert into estate_private.read_guardians(owner_id,contact_id,key_hash,envelope) select p_owner,x->>'id',x->>'hash',x->'envelope' from jsonb_array_elements(keys) x;
   update estate_private.read_vaults set next_reminder=case when reminder_days is distinct from (p_data->>'reminderDays')::integer or reminders_enabled is distinct from coalesce((p_data->>'remindersEnabled')::boolean,false) then now()+make_interval(days=>(p_data->>'reminderDays')::integer) else next_reminder end, reminder_days=(p_data->>'reminderDays')::integer,reminders_enabled=coalesce((p_data->>'remindersEnabled')::boolean,false) where owner_id=p_owner;
   return (select jsonb_build_object('version',version) from estate_private.read_vaults where owner_id=p_owner);
  end if;
  if p_action='cancel' and v.owner_id is not null then
   update estate_private.read_vaults set alarm_canceled_at=case when alarm_id is null then null else now() end,
    alarm_block_until=case when alarm_id is not null and alarm_canceled_at is null then now()+interval '10 minutes' else alarm_block_until end,
    last_check_in=now(),next_reminder=now()+make_interval(days=>reminder_days) where owner_id=p_owner;
   select * into v from estate_private.read_vaults where owner_id=p_owner;
  end if;
  return jsonb_build_object('version',coalesce(v.version,0),'status',case when v.alarm_id is null or v.alarm_canceled_at is not null then 'normal' when v.alarm_started_at is null then 'notifying' when v.alarm_deadline>now() then 'countdown' else 'released' end,
   'deadline',v.alarm_deadline,'serverTime',now(),'lastCheckIn',v.last_check_in,'nextReminder',v.next_reminder);
 end if;
 -- Trustee route: plaintext random bearer keys never enter the database.
 h:=p_data->>'hash';
 select * into g from estate_private.read_guardians where key_hash=h;
 if not found then return '{"error":"invalid_keys"}'; end if;
 select * into v from estate_private.read_vaults where owner_id=g.owner_id for update;
 -- Re-check after obtaining owner lock: concurrent revocation must be authoritative.
 select * into g from estate_private.read_guardians where key_hash=h and owner_id=v.owner_id;
 if not found then return '{"error":"invalid_keys"}'; end if;
 if p_action='alarm' then
  if v.alarm_block_until>now() then return '{"error":"cooldown"}'; end if;
  if v.alarm_id is null or v.alarm_canceled_at is not null then
   update estate_private.read_vaults set alarm_id=gen_random_uuid(),alarm_requested_at=now(),alarm_started_at=null,alarm_deadline=null,alarm_canceled_at=null where owner_id=v.owner_id returning * into v;
   insert into estate_private.delivery_jobs(owner_id,kind,alarm_id) values(v.owner_id,'alarm',v.alarm_id);
  end if;
 elsif p_action='open' then
  second_hash:=p_data->>'secondHash';
  if second_hash is not null then
   if second_hash=h or not exists(select 1 from estate_private.read_guardians where key_hash=second_hash and owner_id=v.owner_id and contact_id<>g.contact_id) then return '{"error":"invalid_keys"}'; end if;
  elsif v.alarm_started_at is null or v.alarm_deadline>now() or v.alarm_canceled_at is not null then
   return jsonb_build_object('error','two_keys_required','deadline',v.alarm_deadline);
  end if;
  return jsonb_build_object('content',v.content,'envelope',g.envelope,'version',v.version);
 elsif p_action<>'trustee-status' then return '{"error":"invalid_action"}';
 end if;
 return jsonb_build_object('status',case when v.alarm_id is null or v.alarm_canceled_at is not null then 'normal' when v.alarm_started_at is null then 'notifying' when v.alarm_deadline>now() then 'countdown' else 'released' end,'deadline',v.alarm_deadline,'serverTime',now());
end $$;
revoke all on function public.estate_release_v2(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.estate_release_v2(text,uuid,jsonb) to service_role;
