-- Run only after estate-release-v2-isolated.sql in an ephemeral PostgreSQL database.
DO $test$
DECLARE
 owner uuid := '00000000-0000-4000-8000-000000000001';
 alarm_job uuid;
 session_id uuid := '00000000-0000-4000-8000-000000000002';
 response jsonb;
 h1 text := repeat('a',64);
 h2 text := repeat('b',64);
BEGIN
 INSERT INTO estate_private.read_vaults(owner_id,vault_id,content) VALUES(owner,'fixture-vault','{"iv":"isolated","ciphertext":"fixture"}'::jsonb);
 INSERT INTO estate_private.read_guardians(key_hash,owner_id,contact_id,envelope,notification_email) VALUES
 (h1,owner,'person-one','{"iv":"first"}'::jsonb,'first@example.invalid'),
 (h2,owner,'person-two','{"iv":"second"}'::jsonb,'second@example.invalid');
 response:=public.estate_release_v2('open',null,jsonb_build_object('hash',h1));
 IF response->>'error' IS DISTINCT FROM 'two_keys_required' THEN RAISE EXCEPTION 'single key opened before alarm: %',response; END IF;
 response:=public.estate_release_v2('open',null,jsonb_build_object('hash',h1,'secondHash',h1));
 IF response->>'error' IS DISTINCT FROM 'invalid_keys' THEN RAISE EXCEPTION 'duplicate trustee keys accepted: %',response; END IF;
 response:=public.estate_release_v2('open',null,jsonb_build_object('hash',h1,'secondHash',repeat('c',64)));
 IF response->>'error' IS DISTINCT FROM 'invalid_keys' THEN RAISE EXCEPTION 'unknown second trustee accepted: %',response; END IF;
 response:=public.estate_release_v2('open',null,jsonb_build_object('hash',h1,'secondHash',h2));
 IF response->'content' IS NULL OR response->'envelope'->>'iv' IS DISTINCT FROM 'first' THEN RAISE EXCEPTION 'two trustees cannot open or envelope misassigned: %',response; END IF;
 response:=public.estate_release_v2('alarm',null,jsonb_build_object('hash',h1));
 IF response->>'status' IS DISTINCT FROM 'notifying' THEN RAISE EXCEPTION 'alarm not awaiting delivery: %',response; END IF;
 response:=public.estate_release_v2('open',null,jsonb_build_object('hash',h1));
 IF response->>'error' IS DISTINCT FROM 'two_keys_required' THEN RAISE EXCEPTION 'single key opened before delivery: %',response; END IF;
 SELECT id INTO alarm_job FROM estate_private.delivery_jobs WHERE kind='alarm' AND owner_id=owner;
 PERFORM public.estate_release_v2('delivered',null,jsonb_build_object('id',alarm_job));
 response:=public.estate_release_v2('trustee-status',null,jsonb_build_object('hash',h1));
 IF response->>'status' IS DISTINCT FROM 'countdown' THEN RAISE EXCEPTION 'delivery did not begin countdown: %',response; END IF;
 response:=public.estate_release_v2('open',null,jsonb_build_object('hash',h1));
 IF response->>'error' IS DISTINCT FROM 'two_keys_required' THEN RAISE EXCEPTION 'single key opened during countdown: %',response; END IF;
 UPDATE estate_private.read_vaults SET alarm_started_at=now()-interval '25 hours',alarm_deadline=now()-interval '1 hour' WHERE owner_id=owner;
 response:=public.estate_release_v2('open',null,jsonb_build_object('hash',h1));
 IF response->'content' IS NULL THEN RAISE EXCEPTION 'single key denied after elapsed deadline: %',response; END IF;
 -- A partially written alarm must never grant one-key access even with a missing deadline.
 UPDATE estate_private.read_vaults SET alarm_deadline=NULL WHERE owner_id=owner;
 response:=public.estate_release_v2('open',null,jsonb_build_object('hash',h1));
 IF response->>'error' IS DISTINCT FROM 'two_keys_required' THEN RAISE EXCEPTION 'NULL deadline granted one-key access: %',response; END IF;
 UPDATE estate_private.read_vaults SET alarm_deadline=now()-interval '1 hour' WHERE owner_id=owner;
 INSERT INTO auth.sessions(id,user_id) VALUES(session_id,owner);
 response:=public.estate_release_v2('cancel',owner,jsonb_build_object('session',session_id));
 IF response->>'status' IS DISTINCT FROM 'normal' THEN RAISE EXCEPTION 'owner cancellation did not reset status: %',response; END IF;
 response:=public.estate_release_v2('open',null,jsonb_build_object('hash',h1));
 IF response->>'error' IS DISTINCT FROM 'two_keys_required' THEN RAISE EXCEPTION 'canceled alarm still grants single-key access: %',response; END IF;
 response:=public.estate_release_v2('open',null,jsonb_build_object('hash',h1,'secondHash',h2));
 IF response->'content' IS NULL THEN RAISE EXCEPTION 'cancellation broke valid two-key access: %',response; END IF;
 -- A stale delivery acknowledgement must never restart a canceled alarm.
 PERFORM public.estate_release_v2('delivered',null,jsonb_build_object('id',alarm_job));
 response:=public.estate_release_v2('trustee-status',null,jsonb_build_object('hash',h1));
 IF response->>'status' IS DISTINCT FROM 'normal' THEN RAISE EXCEPTION 'stale callback revived canceled alarm: %',response; END IF;
 IF EXISTS(SELECT 1 FROM estate_private.read_vaults WHERE owner_id=owner AND alarm_canceled_at IS NULL) THEN RAISE EXCEPTION 'cancellation marker was cleared'; END IF;
 RAISE NOTICE 'estate_release_v2 isolated integration assertions passed';
END
$test$;
