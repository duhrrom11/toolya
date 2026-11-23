do $$
begin
  if has_function_privilege('anon', 'public.universe_state()', 'EXECUTE') or
     has_function_privilege('anon', 'public.universe_export()', 'EXECUTE') or
     has_schema_privilege('authenticated', 'toolya_universe', 'USAGE') then
    raise exception 'Unexpected private schema or API access';
  end if;
  begin
    insert into auth.users(id, email, encrypted_password)
    values ('00000000-0000-4000-8000-000000000004', 'missing@example.invalid', 'synthetic-hash');
    raise exception 'Signup accepted missing names';
  exception when invalid_parameter_value then null;
  end;
end $$;
insert into auth.users(id, email, raw_user_meta_data)
values ('00000000-0000-4000-8000-000000000004', 'new@example.invalid',
        '{"provider_marker":"fixture","toolya_profile":{"first":" Éva ","last":"Nguyễn","country":"DE","avatar":"https://example.invalid/profile.png"}}');
update auth.users set email_confirmed_at = now() where email = 'new@example.invalid';
do $$
begin
  if (select raw_user_meta_data from auth.users where email = 'new@example.invalid')
      is distinct from '{"provider_marker":"fixture"}'::jsonb then
    raise exception 'Confirmation did not remove only temporary registration fields';
  end if;
end $$;

insert into public.user_data values
 ('00000000-0000-4000-8000-000000000001', 'haushaltsbuch-kassenbon', '{"entries":[{"id":1}]}'),
 ('00000000-0000-4000-8000-000000000001', 'umzugskisten-inventar', '{"boxes":[{"id":2}]}'),
 ('00000000-0000-4000-8000-000000000001', 'pflanzenpflege-giessplan', '{"plants":[{"id":3}]}'),
 ('00000000-0000-4000-8000-000000000001', 'autokosten-reifenwechsel', '{"cars":[{"id":4}]}'),
 ('00000000-0000-4000-8000-000000000001', 'parkplatz-merker-parkschein-timer', '{"sessions":[{"id":5}]}'),
 ('00000000-0000-4000-8000-000000000001', 'verliehene-gegenstaende-verwalten', '{"items":[{"id":6}]}'),
 ('00000000-0000-4000-8000-000000000001', 'zaehlerstaende-erfassen', '{"readings":[{"id":7}]}'),
 ('00000000-0000-4000-8000-000000000001', 'backform-umrechner', '{"recipes":[{"text":"100 g flour","factor":1.4}]}'),
 ('00000000-0000-4000-8000-000000000001', 'haustier-gesundheitspass', '{"pets":[{"id":9,"name":"fixture only"}]}'),
 ('00000000-0000-4000-8000-000000000002', 'backform-umrechner', '{"recipes":[{"text":"  ","factor":"1.4"}]}'),
 ('00000000-0000-4000-8000-000000000002', 'umzugskisten-inventar', '{"boxes":[{},false,null]}');
insert into public.wg_spaces values ('00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000001', '{"shopping":[{"done":true}]}');
insert into public.wishlist_public_profiles values ('00000000-0000-4000-8000-000000000002', 'B Test');
insert into public.vault_cloud_snapshots values ('00000000-0000-4000-8000-000000000001', '{}', '{}', '{}');

set role authenticated;
select set_config('test.uid', '00000000-0000-4000-8000-000000000004', false);
do $$
begin
  if public.universe_state()->'profile'->>'first' is distinct from 'Éva' then raise exception 'Verified profile missing'; end if;
  begin
    perform public.universe_save_profile('{"first":"Éva","last":"Nguyễn","country":"ZZ"}');
    raise exception 'Unexpected country accepted';
  exception when invalid_parameter_value then null;
  end;
end $$;

select set_config('test.uid', '00000000-0000-4000-8000-000000000003', false);
do $$
begin
  begin
    perform public.universe_state();
    raise exception 'Unverified account has access';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.universe_export();
    raise exception 'Unverified account can export';
  exception when insufficient_privilege then null;
  end;
end $$;

select set_config('test.uid', '00000000-0000-4000-8000-000000000001', false);
do $$
begin
  if public.universe_state()->>'active' <> 'false' then raise exception 'Opt-in default wrong'; end if;
  begin
    perform public.universe_collect(false);
    raise exception 'Unexpected collection before opting in';
  exception when insufficient_privilege then null;
  end;
  perform public.universe_save_profile('{"first":"First","last":"Private"}');
  perform public.universe_toggle(true);
  perform public.universe_wish_bookmark('00000000-0000-4000-8000-000000000002', true);
  if public.universe_collect(false)->>'xp' is distinct from '400'
      or public.universe_collect(false)->>'xp' is distinct from '400' then
    raise exception 'Ten regular milestones expected exactly once';
  end if;
  if public.universe_collect(true)->>'xp' is distinct from '480'
      or public.universe_collect(true)->>'xp' is distinct from '480' then
    raise exception 'Two private milestones expected exactly once';
  end if;
  if public.universe_ranking() <> '[]'::jsonb then raise exception 'Unconsented leaderboard entry'; end if;
  perform public.universe_visibility(true, 'Nebel-Wanderer');
  if public.universe_ranking() <> '[{"handle":"Nebel-Wanderer","xp":400}]'::jsonb then
    raise exception 'Ranking includes hidden fields or private points';
  end if;
  begin
    perform public.universe_decorate('window');
    raise exception 'Locked decoration accepted';
  exception when invalid_parameter_value then null;
  end;
  perform public.universe_answer(2, 2);
  perform public.universe_answer(0, 0);
  if public.universe_state()->>'chapter' <> '0' then raise exception 'Invalid sequence accepted'; end if;
  perform public.universe_answer(0, 1);
  perform public.universe_answer(0, 1);
  perform public.universe_answer(1, 0);
  perform public.universe_answer(2, 2);
  if public.universe_decorate('window')->>'chapter' <> '3' then raise exception 'Valid story did not save'; end if;
end $$;

select set_config('test.uid', '00000000-0000-4000-8000-000000000002', false);
do $$
declare export jsonb;
begin
  perform public.universe_toggle(true);
  if public.universe_collect(false)->>'xp' <> '0' or public.universe_collect(true)->>'xp' <> '0'
     or public.universe_state()->'profile' <> 'null'::jsonb
     or public.universe_wish_bookmarks() <> '[]'::jsonb then
    raise exception 'Other account state leaked or invalid records counted';
  end if;
  export := public.universe_export();
  if export->>'account_id' is distinct from '00000000-0000-4000-8000-000000000002' or
     export->'player' is distinct from public.universe_state() or
     export->'milestones' is distinct from '[]'::jsonb or
     export->'wishlist_bookmarks' is distinct from '[]'::jsonb then
    raise exception 'Export leaked another account';
  end if;
  begin
    perform public.universe_visibility(true, 'nebel-wanderer');
    raise exception 'Duplicate handle accepted';
  exception when unique_violation then null;
  end;
end $$;

select set_config('test.uid', '00000000-0000-4000-8000-000000000001', false);
do $$
declare export jsonb;
begin
  perform public.universe_toggle(false);
  export := public.universe_export();
  if export->'player' is distinct from public.universe_state() or
     jsonb_array_length(export->'milestones') is distinct from 12 or
     not (export->'milestones' @> '[{"source":"pets","points":40},{"source":"estate","points":40}]') or
     export->'wishlist_bookmarks' is distinct from '["00000000-0000-4000-8000-000000000002"]'::jsonb then
    raise exception 'Own export is incomplete';
  end if;
  perform public.universe_toggle(true);
  if public.universe_ranking() <> '[]'::jsonb or public.universe_state()->>'xp' <> '480' then
    raise exception 'Pause visibility or progress regression';
  end if;
end $$;
reset role;

insert into auth.users (id, email, raw_user_meta_data) values
 ('00000000-0000-4000-8000-000000000005', 'pending@example.invalid',
  '{"toolya_profile":{"first":"Pending","last":"Fixture"}}');
do $$
begin
  if (select p.profile->>'first'
      from auth.users u left join toolya_universe.players p on p.user_id = u.id
      where u.id = '00000000-0000-4000-8000-000000000005'
        and lower(u.email) = lower('pending@example.invalid')
        and u.email_confirmed_at is null and not u.is_anonymous) is distinct from 'Pending' then
    raise exception 'The operator could not find the pending profile';
  end if;
  delete from auth.users where id = '00000000-0000-4000-8000-000000000005';
  if exists (select 1 from toolya_universe.players where user_id = '00000000-0000-4000-8000-000000000005')
      or not exists (select 1 from toolya_universe.players where user_id = '00000000-0000-4000-8000-000000000001') then
    raise exception 'Pending account deletion failed to remove exactly its own profile';
  end if;
end $$;
