-- Synthetic, rollback-only incident security tests.
begin;
insert into auth.users(id) values ('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002');
insert into public.moving_helper_grants(owner_id,project_id,helper_label,token_hash,expires_at)
values('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000011','Team',repeat('a',64),now()+interval '2 hours');
insert into public.moving_transport_state(owner_id,project_id,assignment_id,box_id,status)
values('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000021',12,'planned');
do $$
declare r jsonb; oid uuid;
begin
 if has_table_privilege('anon','public.moving_transport_incidents','select')
 or has_table_privilege('authenticated','public.moving_transport_incidents','insert')
 or has_function_privilege('anon','public.moving_helper_report_incident(text,uuid,text,text,uuid)','execute')
 or has_function_privilege('authenticated','public.moving_helper_report_incident(text,uuid,text,text,uuid)','execute')
 then raise exception 'Incident data leaked through public privileges'; end if;
 if not (select relrowsecurity from pg_class where oid='public.moving_transport_incidents'::regclass)
 then raise exception 'RLS disabled'; end if;
 select public.moving_helper_report_incident(repeat('a',64),
 '00000000-0000-4000-8000-000000000021','damaged','Glasschaden',
 '00000000-0000-4000-8000-000000000031') into r;
 oid:=(r->>'incidentId')::uuid;
 if oid is null or (r->>'replayed')::boolean then raise exception 'Incident insert failed'; end if;
 select public.moving_helper_report_incident(repeat('a',64),
 '00000000-0000-4000-8000-000000000021','damaged','Glasschaden',
 '00000000-0000-4000-8000-000000000031') into r;
 if not (r->>'replayed')::boolean or (select count(*) from public.moving_transport_incidents)<>1
 then raise exception 'Incident replay not idempotent'; end if;
 begin
  perform public.moving_helper_report_incident(repeat('a',64),
  '00000000-0000-4000-8000-000000000021','missing','different',
  '00000000-0000-4000-8000-000000000031');
  raise exception 'Idempotency collision accepted';
 exception when sqlstate '23505' then null; end;
 begin
  perform public.moving_helper_report_incident(repeat('a',64),
  '00000000-0000-4000-8000-000000000099','missing','',
  '00000000-0000-4000-8000-000000000032');
  raise exception 'Cross-assignment report accepted';
 exception when sqlstate '42501' then null; end;
 update public.moving_helper_grants set revoked_at=now() where token_hash=repeat('a',64);
 begin
  perform public.moving_helper_report_incident(repeat('a',64),
  '00000000-0000-4000-8000-000000000021','missing','',
  '00000000-0000-4000-8000-000000000033');
  raise exception 'Revoked helper report accepted';
 exception when sqlstate '42501' then null; end;
 raise notice 'MOVING_INCIDENTS_SECURITY_OK';
end $$;
rollback;
