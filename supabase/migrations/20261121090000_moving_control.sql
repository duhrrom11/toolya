-- Toolya Moving Control R2: additive, private service-owned projection.
-- The browser never receives access to these tables via PostgREST.
create table if not exists public.moving_helper_grants (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 project_id uuid not null,
 helper_label text not null check (char_length(helper_label) between 1 and 80),
 token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
 scope text not null default 'transport' check (scope = 'transport'),
 expires_at timestamptz not null,
 revoked_at timestamptz,
 created_at timestamptz not null default now(),
 last_used_at timestamptz,
 request_window_at timestamptz not null default now(),
 request_count integer not null default 0 check (request_count>=0)
);
create index if not exists moving_helper_grants_owner_idx on public.moving_helper_grants(owner_id,project_id);
create table if not exists public.moving_transport_state (
 owner_id uuid not null references auth.users(id) on delete cascade,
 project_id uuid not null,
 assignment_id uuid not null,
 box_id bigint not null,
 status text not null default 'planned' check(status in ('planned','packed','loaded','arrived','unpacked')),
 version integer not null default 0 check(version >= 0),
 updated_at timestamptz not null default now(),
 primary key(owner_id,project_id,assignment_id),
 unique(owner_id,project_id,box_id)
);
create table if not exists public.moving_public_box_views (
 owner_id uuid not null,
 project_id uuid not null,
 assignment_id uuid not null,
 display_label text not null check (char_length(display_label) between 1 and 100),
 room_label text not null default '' check (char_length(room_label) <= 80),
 priority text not null default 'normal' check(priority in ('normal','important','first_day')),
 primary key(owner_id,project_id,assignment_id),
 foreign key(owner_id,project_id,assignment_id)
 references public.moving_transport_state(owner_id,project_id,assignment_id) on delete cascade
);
create table if not exists public.moving_transport_events (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null,
 project_id uuid not null,
 assignment_id uuid not null,
 grant_id uuid references public.moving_helper_grants(id) on delete set null,
 request_id uuid not null,
 from_status text not null,
 to_status text not null,
 resulting_version integer not null,
 created_at timestamptz not null default now(),
 unique(grant_id,request_id)
);
create index if not exists moving_transport_events_owner_idx on public.moving_transport_events(owner_id,project_id,created_at desc);
alter table public.moving_helper_grants enable row level security;
alter table public.moving_transport_state enable row level security;
alter table public.moving_public_box_views enable row level security;
alter table public.moving_transport_events enable row level security;
revoke all on public.moving_helper_grants,public.moving_transport_state,public.moving_public_box_views,public.moving_transport_events from public,anon,authenticated;
grant select,insert,update,delete on public.moving_helper_grants,public.moving_transport_state,public.moving_public_box_views,public.moving_transport_events to service_role;
-- Mutation with a row lock, monotonically increasing revision and idempotency.
create or replace function public.moving_helper_transition(
 p_token_hash text, p_assignment_id uuid, p_expected_version integer,
 p_next_status text, p_request_id uuid
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
 v_grant public.moving_helper_grants%rowtype;
 v_state public.moving_transport_state%rowtype;
 v_existing public.moving_transport_events%rowtype;
 v_steps text[] := array['planned','packed','loaded','arrived','unpacked'];
begin
 if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' or p_request_id is null
 or p_assignment_id is null or p_expected_version is null or p_next_status is null then
   raise exception 'Invalid transition' using errcode='22023';
 end if;
 select * into v_grant from public.moving_helper_grants
 where token_hash=p_token_hash and revoked_at is null and expires_at>now()
 and scope='transport' for update;
 if not found then raise exception 'Grant unavailable' using errcode='42501'; end if;
 select * into v_existing from public.moving_transport_events
 where grant_id=v_grant.id and request_id=p_request_id;
 if found then
   if v_existing.assignment_id <> p_assignment_id or v_existing.to_status <> p_next_status then
     raise exception 'Request id collision' using errcode='23505';
   end if;
   return jsonb_build_object('assignmentId',v_existing.assignment_id,'status',v_existing.to_status,'version',v_existing.resulting_version,'replayed',true);
 end if;
 select * into v_state from public.moving_transport_state
 where owner_id=v_grant.owner_id and project_id=v_grant.project_id
 and assignment_id=p_assignment_id for update;
 if not found then raise exception 'Assignment unavailable' using errcode='42501'; end if;
 -- recheck after row lock so racing retried request is idempotent.
 select * into v_existing from public.moving_transport_events
 where grant_id=v_grant.id and request_id=p_request_id;
 if found then
   if v_existing.assignment_id <> p_assignment_id or v_existing.to_status <> p_next_status then
     raise exception 'Request id collision' using errcode='23505';
   end if;
   return jsonb_build_object('assignmentId',v_existing.assignment_id,'status',v_existing.to_status,'version',v_existing.resulting_version,'replayed',true);
 end if;
 if v_state.version <> p_expected_version then
   raise exception 'Revision conflict' using errcode='40001';
 end if;
 if array_position(v_steps,p_next_status) is null or
 abs(array_position(v_steps,p_next_status)-array_position(v_steps,v_state.status)) <> 1 then
   raise exception 'Invalid status sequence' using errcode='22023';
 end if;
 update public.moving_transport_state set status=p_next_status,version=version+1,updated_at=now()
 where owner_id=v_state.owner_id and project_id=v_state.project_id
 and assignment_id=v_state.assignment_id;
 insert into public.moving_transport_events(owner_id,project_id,assignment_id,grant_id,request_id,from_status,to_status,resulting_version)
 values (v_state.owner_id,v_state.project_id,v_state.assignment_id,v_grant.id,p_request_id,v_state.status,p_next_status,v_state.version+1);
 update public.moving_helper_grants set last_used_at=now() where id=v_grant.id;
 return jsonb_build_object('assignmentId',v_state.assignment_id,'status',p_next_status,'version',v_state.version+1,'replayed',false);
end;
$$;
revoke all on function public.moving_helper_transition(text,uuid,integer,text,uuid) from public,anon,authenticated;
grant execute on function public.moving_helper_transition(text,uuid,integer,text,uuid) to service_role;

-- Owner workflow uses the same CAS and audit semantics, without issuing a helper grant.
create unique index if not exists moving_transport_events_owner_request_idx
on public.moving_transport_events(owner_id,request_id);
create or replace function public.moving_owner_transition(
 p_owner_id uuid,p_project_id uuid,p_assignment_id uuid,p_expected_version integer,
 p_next_status text,p_request_id uuid
) returns jsonb language plpgsql security definer set search_path=''
as $$
declare
 v_state public.moving_transport_state%rowtype;
 v_existing public.moving_transport_events%rowtype;
 v_steps text[] := array['planned','packed','loaded','arrived','unpacked'];
begin
 if p_owner_id is null or p_project_id is null or p_assignment_id is null
 or p_request_id is null or p_expected_version is null or p_next_status is null then
   raise exception 'Invalid transition' using errcode='22023';
 end if;
 select * into v_existing from public.moving_transport_events
 where owner_id=p_owner_id and request_id=p_request_id;
 if found then
   if v_existing.assignment_id<>p_assignment_id or v_existing.to_status<>p_next_status then
     raise exception 'Request id collision' using errcode='23505';
   end if;
   return jsonb_build_object('assignmentId',p_assignment_id,'status',p_next_status,'version',v_existing.resulting_version,'replayed',true);
 end if;
 select * into v_state from public.moving_transport_state
 where owner_id=p_owner_id and project_id=p_project_id and assignment_id=p_assignment_id for update;
 if not found then raise exception 'Assignment unavailable' using errcode='42501'; end if;
 if v_state.version<>p_expected_version then raise exception 'Revision conflict' using errcode='40001'; end if;
 if array_position(v_steps,p_next_status) is null or
 abs(array_position(v_steps,p_next_status)-array_position(v_steps,v_state.status))<>1 then
   raise exception 'Invalid status sequence' using errcode='22023';
 end if;
 update public.moving_transport_state set status=p_next_status,version=version+1,updated_at=now()
 where owner_id=p_owner_id and project_id=p_project_id and assignment_id=p_assignment_id;
 insert into public.moving_transport_events(owner_id,project_id,assignment_id,request_id,from_status,to_status,resulting_version)
 values(p_owner_id,p_project_id,p_assignment_id,p_request_id,v_state.status,p_next_status,v_state.version+1);
 return jsonb_build_object('assignmentId',p_assignment_id,'status',p_next_status,'version',v_state.version+1,'replayed',false);
end;
$$;
revoke all on function public.moving_owner_transition(uuid,uuid,uuid,integer,text,uuid) from public,anon,authenticated;
grant execute on function public.moving_owner_transition(uuid,uuid,uuid,integer,text,uuid) to service_role;

-- Bounded per-grant request rate across all edge instances (including reads).
create or replace function public.moving_helper_rate_limit(p_token_hash text)
returns boolean language plpgsql security definer set search_path=''
as $$
declare g public.moving_helper_grants%rowtype;
begin
 if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' then return false; end if;
 select * into g from public.moving_helper_grants
 where token_hash=p_token_hash and revoked_at is null and expires_at>now()
 for update;
 if not found then return false; end if;
 if g.request_window_at<now()-interval '1 minute' then
   update public.moving_helper_grants set request_window_at=now(),request_count=1,last_used_at=now() where id=g.id;
   return true;
 end if;
 if g.request_count>=80 then return false; end if;
 update public.moving_helper_grants set request_count=request_count+1,last_used_at=now() where id=g.id;
 return true;
end;
$$;
revoke all on function public.moving_helper_rate_limit(text) from public,anon,authenticated;
grant execute on function public.moving_helper_rate_limit(text) to service_role;
