-- Existing links retain project-wide access. Restricted links keep the exact
-- assignment IDs approved when the owner created the link.
alter table public.moving_helper_grants
  add column allowed_assignment_ids uuid[],
  add constraint moving_helper_assignment_scope_valid check (
    allowed_assignment_ids is null or (
      cardinality(allowed_assignment_ids) between 1 and 1500
      and array_position(allowed_assignment_ids, null) is null
    )
  );


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
 if v_grant.allowed_assignment_ids is not null and
    not (p_assignment_id = any(v_grant.allowed_assignment_ids)) then
   raise exception 'Assignment unavailable for this grant' using errcode='42501';
 end if;
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

create or replace function public.moving_helper_report_incident(
 p_token_hash text, p_assignment_id uuid, p_kind text, p_note text, p_request_id uuid
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare g public.moving_helper_grants%rowtype;
        report public.moving_transport_incidents%rowtype;
begin
 if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$'
 or p_assignment_id is null or p_request_id is null
 or p_kind is null or p_kind not in ('missing','damaged') or p_note is null
 or char_length(p_note)>300 then
   raise exception 'Invalid incident' using errcode='22023';
 end if;
 select * into g from public.moving_helper_grants
 where token_hash=p_token_hash and scope='transport'
 and revoked_at is null and expires_at>now() for update;
 if not found then raise exception 'No helper permission' using errcode='42501'; end if;
 if g.allowed_assignment_ids is not null and
    not (p_assignment_id = any(g.allowed_assignment_ids)) then
   raise exception 'Assignment unavailable for this grant' using errcode='42501';
 end if;
 select * into report from public.moving_transport_incidents
 where owner_id=g.owner_id and request_id=p_request_id;
 if found then
   if report.assignment_id<>p_assignment_id or report.kind<>p_kind
   or report.note<>p_note or report.grant_id is distinct from g.id then
     raise exception 'Idempotency conflict' using errcode='23505';
   end if;
   return jsonb_build_object('incidentId',report.id,'replayed',true);
 end if;
 if not exists (
   select 1 from public.moving_transport_state
   where owner_id=g.owner_id and project_id=g.project_id
   and assignment_id=p_assignment_id
 ) then raise exception 'Invalid assignment' using errcode='42501'; end if;
 insert into public.moving_transport_incidents
 (owner_id,project_id,assignment_id,grant_id,request_id,kind,note)
 values(g.owner_id,g.project_id,p_assignment_id,g.id,p_request_id,p_kind,p_note)
 returning * into report;
 return jsonb_build_object('incidentId',report.id,'replayed',false);
end;
$$;
revoke all on function public.moving_helper_report_incident(text,uuid,text,text,uuid) from public,anon,authenticated;
grant execute on function public.moving_helper_report_incident(text,uuid,text,text,uuid) to service_role;
