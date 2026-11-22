begin;

create schema if not exists toolya_universe;
revoke all on schema toolya_universe from public, anon, authenticated;

create table if not exists toolya_universe.players (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb,
  active boolean not null default false,
  chapter integer not null default 0 check (chapter between 0 and 3),
  decor text not null default '' check (decor in ('', 'lantern', 'chart', 'window')),
  visible boolean not null default false,
  handle text,
  check (not visible or (active and handle is not null)),
  check (handle is null or handle ~ '^[A-Za-z0-9][A-Za-z0-9 _-]{1,22}[A-Za-z0-9]$')
);
create unique index if not exists toolya_universe_unique_handle on toolya_universe.players (lower(handle)) where visible;
alter table toolya_universe.players enable row level security;

create table if not exists toolya_universe.wish_bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  target uuid not null references public.wishlist_public_profiles(user_id) on delete cascade,
  primary key (user_id, target)
);
alter table toolya_universe.wish_bookmarks enable row level security;

create table if not exists toolya_universe.ledger (
  user_id uuid not null references toolya_universe.players(user_id) on delete cascade,
  source text not null check (source in ('wishlist','budget','moving','plants','housemates','estate','car','pets','parking','loans','meters','baking')),
  points integer generated always as (40) stored,
  primary key (user_id, source)
);
alter table toolya_universe.ledger enable row level security;
revoke all on all tables in schema toolya_universe from public, anon, authenticated;

create or replace function toolya_universe.profile_values(p jsonb)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare
  first_name text := btrim(p->>'first');
  last_name text := btrim(p->>'last');
  country text := nullif(p->>'country', '');
  avatar text := nullif(btrim(p->>'avatar'), '');
begin
  if jsonb_typeof(p->'first') is distinct from 'string' or jsonb_typeof(p->'last') is distinct from 'string'
     or first_name !~ '^[^[:cntrl:]]{1,80}$' or last_name !~ '^[^[:cntrl:]]{1,80}$'
     or first_name !~ '[^[:space:]]' or last_name !~ '[^[:space:]]'
     or (country is not null and not country = any(string_to_array('AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW', ' ')))
     or (avatar is not null and (length(avatar) > 1000 or avatar !~ '^https://[^/@:[:space:]]+\.[^/@:[:space:]]+([/:?#][^[:space:]]*)?$'
         or position(chr(92) in avatar) > 0)) then
    raise exception 'Invalid profile fields' using errcode = '22023';
  end if;
  return jsonb_build_object('first', first_name, 'last', last_name, 'country', country, 'avatar', avatar);
end;
$$;

create or replace function toolya_universe.signup_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.is_anonymous or new.email is null then return new; end if;
  if tg_op = 'INSERT' then
    if new.raw_user_meta_data ? 'toolya_profile' then
      new.raw_user_meta_data := jsonb_set(new.raw_user_meta_data, '{toolya_profile}',
        toolya_universe.profile_values(new.raw_user_meta_data->'toolya_profile'));
    elsif nullif(new.encrypted_password, '') is not null and new.invited_at is null then
      raise exception 'Name required for registration' using errcode = '22023';
    end if;
  end if;
  return new;
end;
$$;

create or replace function toolya_universe.confirm_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.email_confirmed_at is not null and not new.is_anonymous and new.raw_user_meta_data ? 'toolya_profile' then
    begin
      insert into toolya_universe.players(user_id, profile)
        values (new.id, toolya_universe.profile_values(new.raw_user_meta_data->'toolya_profile'))
        on conflict (user_id) do nothing;
    exception when invalid_parameter_value then
      -- A preexisting account with stale metadata can complete its profile in the UI.
      null;
    end;
  end if;
  return new;
end;
$$;

drop trigger if exists toolya_universe_signup_profile on auth.users;
create trigger toolya_universe_signup_profile before insert on auth.users
for each row execute function toolya_universe.signup_profile();
drop trigger if exists toolya_universe_confirm_profile on auth.users;
create trigger toolya_universe_confirm_profile after insert or update of email_confirmed_at on auth.users
for each row execute function toolya_universe.confirm_profile();

create or replace function toolya_universe.account()
returns uuid language plpgsql stable set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null or (auth.jwt()->>'is_anonymous') = 'true'
     or not exists (select 1 from auth.users where id = uid and email_confirmed_at is not null and not is_anonymous) then
    raise exception 'A verified account is required' using errcode = '42501';
  end if;
  return uid;
end;
$$;

create or replace function public.universe_state()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  uid uuid := toolya_universe.account();
  player toolya_universe.players%rowtype;
  xp integer;
begin
  select * into player from toolya_universe.players where user_id = uid;
  select coalesce(sum(points), 0) into xp from toolya_universe.ledger where user_id = uid;
  return jsonb_build_object('active', coalesce(player.active, false), 'chapter', coalesce(player.chapter, 0),
    'decor', coalesce(player.decor, ''), 'visible', coalesce(player.visible, false), 'handle', player.handle,
    'profile', player.profile, 'xp', xp);
end;
$$;

create or replace function public.universe_save_profile(p_profile jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := toolya_universe.account();
begin
  insert into toolya_universe.players(user_id, profile) values (uid, toolya_universe.profile_values(p_profile))
  on conflict (user_id) do update set profile = excluded.profile;
  return public.universe_state();
end;
$$;

create or replace function public.universe_toggle(p_active boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := toolya_universe.account();
begin
  insert into toolya_universe.players(user_id, active) values (uid, p_active)
  on conflict (user_id) do update set active = excluded.active,
    visible = excluded.active and players.visible;
  return public.universe_state();
end;
$$;

create or replace function public.universe_answer(p_step integer, p_answer integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := toolya_universe.account();
begin
  if p_step between 0 and 2 and p_answer = (array[1,0,2])[p_step + 1] then
    update toolya_universe.players set chapter = chapter + 1
    where user_id = uid and active and chapter = p_step;
  end if;
  return public.universe_state();
end;
$$;

create or replace function public.universe_decorate(p_decor text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := toolya_universe.account();
begin
  update toolya_universe.players set decor = p_decor where user_id = uid and active
    and (p_decor = '' or array_position(array['lantern','chart','window'], p_decor) <= chapter);
  if not found then raise exception 'Decoration is unavailable' using errcode = '22023'; end if;
  return public.universe_state();
end;
$$;

create or replace function public.universe_visibility(p_visible boolean, p_handle text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := toolya_universe.account();
begin
  update toolya_universe.players
  set handle = case when p_visible then nullif(btrim(p_handle), '') else null end, visible = p_visible
  where user_id = uid and active;
  if not found then raise exception 'Universe is paused' using errcode = '42501'; end if;
  return public.universe_state();
end;
$$;

create or replace function public.universe_ranking()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  uid uuid := toolya_universe.account();
  result jsonb;
begin
  if not exists (select 1 from toolya_universe.players where user_id = uid and active) then return '[]'::jsonb; end if;
  select coalesce(jsonb_agg(jsonb_build_object('handle', r.handle, 'xp', r.xp)
    order by r.xp desc, lower(r.handle)), '[]'::jsonb)
  into result
  from (
    select p.handle, coalesce(sum(l.points), 0) xp
    from toolya_universe.players p left join toolya_universe.ledger l
      on l.user_id = p.user_id and l.source not in ('estate', 'pets')
    where p.active and p.visible
    group by p.handle
    order by xp desc, lower(p.handle)
    limit 30
  ) r;
  return result;
end;
$$;

create or replace function toolya_universe.has_objects(value jsonb)
returns boolean language sql immutable set search_path = '' as $$
  select case when jsonb_typeof(value) = 'array' then exists (
    select 1 from jsonb_array_elements(value) item where jsonb_typeof(item) = 'object' and item <> '{}'::jsonb
  ) else false end;
$$;

create or replace function public.universe_collect(p_private boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := toolya_universe.account();
begin
  -- Serialize against pause and other collects. Replays cannot change the ledger.
  perform 1 from toolya_universe.players where user_id = uid and active for update;
  if not found then raise exception 'Universe is paused' using errcode = '42501'; end if;
  if p_private then
    insert into toolya_universe.ledger(user_id, source)
    select uid, 'estate' where exists (
      select 1 from public.vault_cloud_snapshots
      where owner_user_id = uid and recovery_key is not null and encrypted_config is not null and encrypted_data is not null
    )
    union all
    select uid, 'pets' where exists (
      select 1 from public.user_data
      where user_id = uid and tool = 'haustier-gesundheitspass' and toolya_universe.has_objects(data->'pets')
    ) on conflict do nothing;
  else
    insert into toolya_universe.ledger(user_id, source)
    select uid, eligible.source from (values
      ('budget', 'haushaltsbuch-kassenbon', 'entries'), ('moving', 'umzugskisten-inventar', 'boxes'),
      ('plants', 'pflanzenpflege-giessplan', 'plants'), ('car', 'autokosten-reifenwechsel', 'cars'),
      ('parking', 'parkplatz-merker-parkschein-timer', 'sessions'), ('loans', 'verliehene-gegenstaende-verwalten', 'items'),
      ('meters', 'zaehlerstaende-erfassen', 'readings')
    ) eligible(source, tool, field)
    where exists (
      select 1 from public.user_data where user_id = uid and tool = eligible.tool
        and toolya_universe.has_objects(data->eligible.field)
    )
    union all
    select uid, 'baking' where exists (
      select 1 from public.user_data u
      cross join lateral jsonb_array_elements(case when jsonb_typeof(u.data->'recipes') = 'array'
        then u.data->'recipes' else '[]'::jsonb end) r
      where u.user_id = uid and u.tool = 'backform-umrechner'
        and (r->>'text') ~ '(^|[[:space:]])[0-9]+([.,][0-9]+)?[[:space:]]*[^[:space:][:digit:]]'
        and case when jsonb_typeof(r->'factor') = 'number' then (r->>'factor')::numeric > 0 else false end
    )
    union all
    select uid, 'wishlist' where exists (
      select 1 from toolya_universe.wish_bookmarks where user_id = uid
    )
    union all
    select uid, 'housemates' where exists (
      select 1 from public.wg_spaces w
      where (w.owner_id = uid or exists (select 1 from public.wg_members m where m.wg_id = w.id and m.user_id = uid))
        and jsonb_path_exists(w.payload, '$.shopping[*] ? (@.done == true)')
    ) on conflict do nothing;
  end if;
  return public.universe_state();
end;
$$;

create or replace function public.universe_wish_bookmarks()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare uid uuid := toolya_universe.account();
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object('user_id', p.user_id, 'display_name', p.display_name) order by p.display_name, p.user_id)
    from toolya_universe.wish_bookmarks b join public.wishlist_public_profiles p on p.user_id = b.target
    where b.user_id = uid
  ), '[]'::jsonb);
end;
$$;

create or replace function public.universe_wish_bookmark(p_target uuid, p_save boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := toolya_universe.account();
begin
  if p_save then
    perform pg_advisory_xact_lock(hashtextextended(uid::text, 852739));
    if (select count(*) from toolya_universe.wish_bookmarks where user_id = uid) < 100 then
      insert into toolya_universe.wish_bookmarks(user_id, target) values (uid, p_target) on conflict do nothing;
    elsif not exists (select 1 from toolya_universe.wish_bookmarks where user_id = uid and target = p_target) then
      raise exception 'Bookmark limit reached' using errcode = '22023';
    end if;
  else
    delete from toolya_universe.wish_bookmarks where user_id = uid and target = p_target;
  end if;
  return public.universe_wish_bookmarks();
end;
$$;

revoke all on all functions in schema toolya_universe from public, anon, authenticated;
revoke all on function public.universe_state(), public.universe_save_profile(jsonb), public.universe_toggle(boolean),
  public.universe_answer(integer, integer), public.universe_decorate(text), public.universe_visibility(boolean, text),
  public.universe_ranking(), public.universe_collect(boolean),
  public.universe_wish_bookmarks(), public.universe_wish_bookmark(uuid, boolean) from public, anon, authenticated;
grant execute on function public.universe_state(), public.universe_save_profile(jsonb), public.universe_toggle(boolean),
  public.universe_answer(integer, integer), public.universe_decorate(text), public.universe_visibility(boolean, text),
  public.universe_ranking(), public.universe_collect(boolean),
  public.universe_wish_bookmarks(), public.universe_wish_bookmark(uuid, boolean) to authenticated;
commit;
