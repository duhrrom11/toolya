-- Isolated fixtures. Verify the transition and incident RPCs independently of the browser.
begin;
insert into auth.users(id) values ('00000000-0000-4000-8000-000000000001');
insert into public.moving_helper_grants(owner_id,project_id,helper_label,token_hash,expires_at,allowed_assignment_ids)
values('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000011',
  'Room team',repeat('a',64),now()+interval '2 hours',array['00000000-0000-4000-8000-000000000021'::uuid]);
insert into public.moving_transport_state(owner_id,project_id,assignment_id,box_id,status) values
('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000021',12,'planned'),
('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000022',13,'planned');
do $$
declare result jsonb;
begin
 select public.moving_helper_transition(repeat('a',64),'00000000-0000-4000-8000-000000000021',
  0,'packed','00000000-0000-4000-8000-000000000031') into result;
 if result->>'status'<>'packed' then raise exception 'Permitted transition not applied'; end if;
 perform public.moving_helper_report_incident(repeat('a',64),'00000000-0000-4000-8000-000000000021',
  'missing','','00000000-0000-4000-8000-000000000032');
 begin
  perform public.moving_helper_transition(repeat('a',64),'00000000-0000-4000-8000-000000000022',
   0,'packed','00000000-0000-4000-8000-000000000033');
  raise exception 'Transition outside grant scope allowed';
 exception when sqlstate '42501' then null; end;
 begin
  perform public.moving_helper_report_incident(repeat('a',64),'00000000-0000-4000-8000-000000000022',
   'missing','','00000000-0000-4000-8000-000000000034');
  raise exception 'Incident outside grant scope allowed';
 exception when sqlstate '42501' then null; end;
 if (select count(*) from public.moving_transport_events)<>1 or
    (select count(*) from public.moving_transport_incidents)<>1 then
  raise exception 'Restricted operation mutated state';
 end if;
end $$;
rollback;
