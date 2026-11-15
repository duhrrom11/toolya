-- DEVELOPMENT ONLY. Apply to an isolated Supabase project, never production.
-- Prerequisites: public.user_data(user_id uuid, tool text, data jsonb,
-- updated_at timestamptz), UNIQUE(user_id,tool), owner-only RLS policies.
begin;
alter table public.user_data add column if not exists revision bigint;
update public.user_data set revision = 1 where revision is null;
alter table public.user_data alter column revision set default 1;
alter table public.user_data alter column revision set not null;
do $guard$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.user_data'::regclass
      and conname = 'user_data_revision_positive'
  ) then
    alter table public.user_data
      add constraint user_data_revision_positive check (revision > 0);
  end if;
end;
$guard$;

create or replace function public.toolya_save_snapshot(
  p_tool text, p_data jsonb, p_expected_revision bigint
)
returns table(data jsonb, revision bigint)
language plpgsql security invoker
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_data jsonb;
  v_revision bigint;
begin
  if v_uid is null or (select auth.jwt()->>'is_anonymous') = 'true' then
    raise exception 'Registered user required' using errcode = '28000';
  end if;
  if p_tool is null or p_tool !~ '^[A-Za-z0-9_-]{1,80}$'
     or p_data is null or jsonb_typeof(p_data) <> 'object'
     or octet_length(p_data::text) > 5000000 then
    raise exception 'Invalid snapshot' using errcode = '22023';
  end if;
  if p_expected_revision is null then
    insert into public.user_data(user_id,tool,data,revision,updated_at)
    values (v_uid,p_tool,p_data,1,clock_timestamp())
    on conflict (user_id,tool) do nothing
    returning public.user_data.data,public.user_data.revision
    into v_data,v_revision;
  else
    update public.user_data as d
       set data = p_data, revision = d.revision + 1,
           updated_at = clock_timestamp()
     where d.user_id = v_uid and d.tool = p_tool
       and d.revision = p_expected_revision
    returning d.data,d.revision into data,revision;
  end if;
  if v_revision is null then
    raise exception 'Cloud revision conflict' using errcode = '40001';
  end if;
  data := v_data;
  revision := v_revision;
  return next;
end;
$$;
revoke all on function public.toolya_save_snapshot(text,jsonb,bigint) from public, anon;
grant execute on function public.toolya_save_snapshot(text,jsonb,bigint) to authenticated;
commit;
