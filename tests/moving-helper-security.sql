begin;
insert into auth.users(id) values ('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002');
insert into public.moving_helper_grants(owner_id,project_id,helper_label,token_hash,expires_at)
values('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000011','Team',repeat('a',64),now()+interval '2 hours');
insert into public.moving_transport_state(owner_id,project_id,assignment_id,box_id,status)
values('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000021',12,'planned');
insert into public.moving_public_box_views(owner_id,project_id,assignment_id,display_label,room_label,priority)
values('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000021','Gläser','Küche','first_day');
do $$
declare r jsonb; v boolean;
begin
 if has_table_privilege('anon','public.moving_helper_grants','select') or has_table_privilege('authenticated','public.moving_public_box_views','select') or has_table_privilege('anon','public.moving_transport_events','insert') then raise exception 'Direct data grants leak';end if;
 if has_function_privilege('anon','public.moving_helper_transition(text,uuid,integer,text,uuid)','execute')
 or has_function_privilege('authenticated','public.moving_owner_transition(uuid,uuid,uuid,integer,text,uuid)','execute') then raise exception 'RPC grant leak';end if;
 if (select count(*) from pg_policies where schemaname='public' and tablename like 'moving_%') <> 0 then raise exception 'Direct RLS policies exist';end if;
 select public.moving_helper_rate_limit(repeat('a',64)) into v;if not v then raise exception 'Active grant denied';end if;
 select public.moving_helper_transition(repeat('a',64),'00000000-0000-4000-8000-000000000021',0,'packed','00000000-0000-4000-8000-000000000031') into r;
 if r->>'status'<>'packed' or (r->>'version')::int <> 1 then raise exception 'Transition failed';end if;
 select public.moving_helper_transition(repeat('a',64),'00000000-0000-4000-8000-000000000021',0,'packed','00000000-0000-4000-8000-000000000031') into r;
 if r->>'replayed'<>'true' or (select count(*) from public.moving_transport_events)<>1 then raise exception 'Idempotence failed';end if;
 begin
  perform public.moving_helper_transition(repeat('a',64),'00000000-0000-4000-8000-000000000021',0,'arrived','00000000-0000-4000-8000-000000000032');
  raise exception 'Wrong CAS accepted';
 exception when sqlstate '40001' then null;end;
 begin
  perform public.moving_helper_transition(repeat('a',64),'00000000-0000-4000-8000-000000000021',1,'unpacked','00000000-0000-4000-8000-000000000033');
  raise exception 'Skipped status accepted';
 exception when sqlstate '22023' then null;end;
 begin
  perform public.moving_helper_transition(repeat('a',64),'00000000-0000-4000-8000-000000000099',0,'packed','00000000-0000-4000-8000-000000000034');
  raise exception 'Unknown assignment accepted';
 exception when sqlstate '42501' then null;end;
 update public.moving_helper_grants set revoked_at=now() where token_hash=repeat('a',64);
 select public.moving_helper_rate_limit(repeat('a',64)) into v;if v then raise exception 'Revoked grant rate accepted';end if;
 begin
  perform public.moving_helper_transition(repeat('a',64),'00000000-0000-4000-8000-000000000021',1,'loaded','00000000-0000-4000-8000-000000000035');
  raise exception 'Revoked grant accepted';
 exception when sqlstate '42501' then null;end;
 raise notice 'MOVING_R2_DB_SECURITY_OK';
end $$;
rollback;
