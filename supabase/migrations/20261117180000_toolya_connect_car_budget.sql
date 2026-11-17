-- Toolya Connect Phase 1: explicit, atomic Autokosten -> Haushaltsbuch transfer.
-- No existing user_data rows are modified by this migration.
create table if not exists public.connect_transfers (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  source_tool text not null check (source_tool = 'autokosten-reifenwechsel'),
  source_id text not null,
  target_tool text not null check (target_tool = 'haushaltsbuch-kassenbon'),
  source_revision bigint not null check (source_revision >= 1),
  target_receipt_id bigint not null check (target_receipt_id >= 0),
  amount_cents bigint not null check (amount_cents > 0),
  created_at timestamptz not null default now(),
  constraint connect_transfer_unique unique (user_id,source_tool,source_id,target_tool)
);
alter table public.connect_transfers enable row level security;
revoke all on table public.connect_transfers from anon, authenticated;
grant select on table public.connect_transfers to authenticated;
create policy "Connect owners can read their transfers"
on public.connect_transfers for select to authenticated
using ((select auth.uid()) = user_id);
-- The journal is append-only from the browser's point of view.
revoke all on sequence public.connect_transfers_id_seq from anon, authenticated;

create or replace function public.toolya_connect_car_to_budget(
  p_source_id text, p_source_revision bigint, p_target_revision bigint
) returns table (status text, receipt_id bigint, target_revision bigint)
language plpgsql security definer set search_path = ''
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_source public.user_data%rowtype;
  v_target public.user_data%rowtype;
  v_event jsonb;
  v_entry jsonb;
  v_new_entries jsonb;
  v_cents bigint;
  v_new_id bigint;
  v_existing bigint;
  v_title text;
  v_date text;
  v_cost numeric;
  v_target_rev bigint;
begin
  if v_uid is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then
    raise exception 'Verified account required' using errcode='28000';
  end if;
  if p_source_id is null or length(p_source_id) < 1 or length(p_source_id) > 80
     or p_source_revision is null or p_source_revision < 1
     or p_target_revision is null or p_target_revision < 1 then
    raise exception 'Invalid transfer arguments' using errcode='22023';
  end if;

  -- Lock the two records in a deterministic order and use CAS before writing.
  select * into v_source from public.user_data
    where user_id=v_uid and tool='autokosten-reifenwechsel' for update;
  select * into v_target from public.user_data
    where user_id=v_uid and tool='haushaltsbuch-kassenbon' for update;
  if not found or v_source.id is null then
    raise exception 'Both Cloud tools must be initialized' using errcode='22023';
  end if;
  if v_source.revision <> p_source_revision or v_target.revision <> p_target_revision then
    raise exception 'Cloud revision conflict' using errcode='40001';
  end if;
  select t.target_receipt_id into v_existing from public.connect_transfers t
    where t.user_id=v_uid and t.source_tool='autokosten-reifenwechsel'
      and t.source_id=p_source_id and t.target_tool='haushaltsbuch-kassenbon';
  if found then
    return query select 'already_imported'::text,v_existing,v_target.revision;
    return;
  end if;
  if jsonb_typeof(v_source.data->'events') <> 'array'
     or jsonb_typeof(v_target.data->'entries') <> 'array' then
    raise exception 'Invalid Cloud snapshot' using errcode='22023';
  end if;
  select e.value into v_event
    from jsonb_array_elements(v_source.data->'events') as e(value)
    where e.value->>'id'=p_source_id
    limit 1;
  if v_event is null then raise exception 'Source entry missing' using errcode='22023'; end if;
  if (select count(*) from jsonb_array_elements(v_source.data->'events') e
      where e->>'id'=p_source_id) <> 1 then
    raise exception 'Ambiguous source entry' using errcode='22023';
  end if;
  v_title := nullif(btrim(v_event->>'title'),'');
  v_date := v_event->>'date';
  if v_title is null or length(v_title)>160 or
     v_date !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
    raise exception 'Invalid source entry' using errcode='22023';
  end if;
  begin
    if to_char(v_date::date,'YYYY-MM-DD') <> v_date then
      raise exception 'Invalid date' using errcode='22023';
    end if;
    v_cost := (v_event->>'cost')::numeric;
  exception when others then
    raise exception 'Invalid cost or date' using errcode='22023';
  end;
  if v_cost <= 0 or v_cost > 1000000 or v_cost * 100 <> trunc(v_cost * 100) then
    raise exception 'Expected positive EUR amount with two decimal places' using errcode='22023';
  end if;
  v_cents := (v_cost*100)::bigint;
  -- Existing household receipts use a positive numeric id.
  select coalesce(max((e->>'id')::bigint),0)+1 into v_new_id
    from jsonb_array_elements(v_target.data->'entries') e
    where jsonb_typeof(e->'id')='number'
      and (e->>'id') ~ '^[0-9]{1,15}$';
  if v_new_id is null or v_new_id > 9007199254740991 then
    raise exception 'Receipt ID limit reached' using errcode='22023';
  end if;
  v_entry := jsonb_build_object(
    'id', v_new_id, 'title', v_title,
    'store', 'Autokosten', 'date', v_date, 'price', v_cost,
    'category', 'Auto', 'paymentMethod', 'Bargeld',
    'warrantyMonths', 0, 'returnDays', 0, 'lifespan', 1,
    'sn', '', 'location', '', 'isFixkosten', false, 'isTax', false,
    'note', 'Aus Toolya Connect importiert – Zahlungsart prüfen',
    'entryType', 'ausgabe', 'photos', '[]'::jsonb,
    'toolyaConnectSource', jsonb_build_object('tool','autokosten-reifenwechsel','id',p_source_id)
  );
  v_new_entries := (v_target.data->'entries') || jsonb_build_array(v_entry);
  if octet_length(jsonb_set(v_target.data,'{entries}',v_new_entries)::text)>4200000 then
    raise exception 'Target Cloud snapshot too large' using errcode='22023';
  end if;
  update public.user_data set data=jsonb_set(v_target.data,'{entries}',v_new_entries),
    revision=revision+1, updated_at=now()
    where id=v_target.id and user_id=v_uid and revision=p_target_revision
    returning revision into v_target_rev;
  if v_target_rev is null then
    raise exception 'Cloud revision conflict' using errcode='40001';
  end if;
  insert into public.connect_transfers
    (user_id,source_tool,source_id,target_tool,source_revision,target_receipt_id,amount_cents)
    values(v_uid,'autokosten-reifenwechsel',p_source_id,'haushaltsbuch-kassenbon',
           p_source_revision,v_new_id,v_cents);
  return query select 'imported'::text,v_new_id,v_target_rev;
end;
$function$;
revoke all on function public.toolya_connect_car_to_budget(text,bigint,bigint) from public,anon;
grant execute on function public.toolya_connect_car_to_budget(text,bigint,bigint) to authenticated;
