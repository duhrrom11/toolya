-- Toolya Moving R2.1: incident reporting is orthogonal to the five transport states.
-- No direct client access. Test only in an isolated PostgreSQL fixture.
create table if not exists public.moving_transport_incidents (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 project_id uuid not null,
 assignment_id uuid not null,
 grant_id uuid references public.moving_helper_grants(id) on delete set null,
 request_id uuid not null,
 kind text not null check (kind in ('missing','damaged')),
 note text not null default '' check (char_length(note) <= 300),
 reported_at timestamptz not null default now(),
 resolved_at timestamptz,
 unique(owner_id,request_id),
 foreign key(owner_id,project_id,assignment_id)
 references public.moving_transport_state(owner_id,project_id,assignment_id) on delete cascade
);
create index if not exists moving_incidents_open_idx
 on public.moving_transport_incidents(owner_id,project_id,reported_at desc) where resolved_at is null;
alter table public.moving_transport_incidents enable row level security;
revoke all on public.moving_transport_incidents from public,anon,authenticated;
grant select,insert,update,delete on public.moving_transport_incidents to service_role;
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
 or p_kind not in ('missing','damaged') or p_note is null
 or char_length(p_note)>300 then
   raise exception 'Invalid incident' using errcode='22023';
 end if;
 select * into g from public.moving_helper_grants
 where token_hash=p_token_hash and scope='transport'
 and revoked_at is null and expires_at>now() for update;
 if not found then raise exception 'No helper permission' using errcode='42501'; end if;
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
