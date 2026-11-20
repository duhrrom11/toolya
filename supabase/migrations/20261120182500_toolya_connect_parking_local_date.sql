create or replace function public.toolya_connect_expense_to_budget(
  p_source_tool text, p_source_id text,
  p_source_revision bigint, p_target_revision bigint
) returns table (status text, receipt_id bigint, target_revision bigint)
language plpgsql security definer set search_path = ''
as $fn$
declare
  v_uid uuid := (select auth.uid());
  v_source public.user_data%rowtype;
  v_target public.user_data%rowtype;
  v_event jsonb;
  v_events jsonb;
  v_amount numeric;
  v_title text;
  v_date date;
  v_date_raw text;
  v_category text;
  v_entry jsonb;
  v_entries jsonb;
  v_new_id bigint;
  v_existing bigint;
  v_revision bigint;
begin
  if v_uid is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then
    raise exception 'Verified account required' using errcode='28000';
  end if;
  if p_source_tool not in ('parkplatz-merker-parkschein-timer','haustier-gesundheitspass')
     or p_source_id is null or length(p_source_id)<1 or length(p_source_id)>80
     or p_source_id !~ '^[0-9]{1,15}$'
     or p_source_revision is null or p_source_revision<1
     or p_target_revision is null or p_target_revision<1 then
    raise exception 'Invalid transfer arguments' using errcode='22023';
  end if;
  select * into v_source from public.user_data
    where user_id=v_uid and tool=p_source_tool for update;
  select * into v_target from public.user_data
    where user_id=v_uid and tool='haushaltsbuch-kassenbon' for update;
  if v_source.id is null or v_target.id is null then
    raise exception 'Both Cloud tools must be initialized' using errcode='22023';
  end if;

  -- Find duplicates under the same locked target; retries never create another receipt.
  select t.target_receipt_id into v_existing from public.connect_transfers t
    where t.user_id=v_uid and t.source_tool=p_source_tool
      and t.source_id=p_source_id and t.target_tool='haushaltsbuch-kassenbon';
  if found then
    return query select 'already_imported'::text,v_existing,v_target.revision;
    return;
  end if;
  if v_source.revision<>p_source_revision or v_target.revision<>p_target_revision then
    raise exception 'Cloud revision conflict' using errcode='40001';
  end if;
  if jsonb_typeof(v_target.data->'entries')<>'array' then
    raise exception 'Invalid target snapshot' using errcode='22023';
  end if;
  v_events := case when p_source_tool='parkplatz-merker-parkschein-timer'
    then v_source.data->'sessions' else v_source.data->'events' end;
  if jsonb_typeof(v_events)<>'array' then
    raise exception 'Invalid source snapshot' using errcode='22023';
  end if;
  if (select count(*) from jsonb_array_elements(v_events) e where e->>'id'=p_source_id)<>1 then
    raise exception 'Source entry missing or ambiguous' using errcode='22023';
  end if;
  select e.value into v_event from jsonb_array_elements(v_events) e(value)
    where e.value->>'id'=p_source_id limit 1;
  begin
    v_amount := (v_event->>'cost')::numeric;
    if p_source_tool='parkplatz-merker-parkschein-timer' then
      v_title := 'Parkgebühr: ' || coalesce(nullif(btrim(v_event->>'desc'),''),'Parkplatz');
      v_date_raw := split_part(v_event->>'date',' ',1);
      if v_date_raw !~ '^[0-9]{1,2}\\.[0-9]{1,2}\\.[0-9]{4}$' then
        raise exception 'Invalid parking date';
      end if;
      v_date := make_date(
        split_part(v_date_raw,'.',3)::integer,
        split_part(v_date_raw,'.',2)::integer,
        split_part(v_date_raw,'.',1)::integer
      );
      v_category := 'Auto';
    else
      v_title := coalesce(nullif(btrim(v_event->>'title'),''),'Haustierkosten');
      v_date_raw := v_event->>'date';
      v_date := to_date(v_date_raw,'YYYY-MM-DD');
      if to_char(v_date,'YYYY-MM-DD')<>v_date_raw then
        raise exception 'Invalid pet date';
      end if;
      v_category := 'Haustiere';
    end if;
  exception when others then
    raise exception 'Invalid expense data' using errcode='22023';
  end;
  if v_amount is null or v_amount<=0 or v_amount>1000000
     or v_amount*100<>trunc(v_amount*100)
     or length(v_title)>160 or length(v_title)=0 then
    raise exception 'Invalid positive expense' using errcode='22023';
  end if;
  select coalesce(max((e->>'id')::bigint),0)+1 into v_new_id
    from jsonb_array_elements(v_target.data->'entries') e
    where jsonb_typeof(e->'id')='number' and (e->>'id')~'^[0-9]{1,15}$';
  if v_new_id is null or v_new_id>9007199254740991 then
    raise exception 'Receipt ID limit reached' using errcode='22023';
  end if;
  v_entry := jsonb_build_object(
    'id',v_new_id,'title',v_title,'store','Toolya Connect',
    'date',to_char(v_date,'YYYY-MM-DD'),'price',v_amount,
    'category',v_category,'paymentMethod','Bargeld',
    'warrantyMonths',0,'returnDays',0,'lifespan',1,
    'sn','','location','','isFixkosten',false,'isTax',false,
    'note','Aus Toolya Connect übernommen – Zahlungsart prüfen',
    'entryType','ausgabe','photos','[]'::jsonb,
    'toolyaConnectSource',jsonb_build_object('tool',p_source_tool,'id',p_source_id)
  );
  v_entries := (v_target.data->'entries') || jsonb_build_array(v_entry);
  if octet_length(jsonb_set(v_target.data,'{entries}',v_entries)::text)>4200000 then
    raise exception 'Target Cloud snapshot too large' using errcode='22023';
  end if;
  update public.user_data
    set data=jsonb_set(v_target.data,'{entries}',v_entries),
        revision=revision+1,updated_at=now()
    where id=v_target.id and user_id=v_uid and revision=p_target_revision
    returning revision into v_revision;
  if v_revision is null then
    raise exception 'Cloud revision conflict' using errcode='40001';
  end if;
  insert into public.connect_transfers
    (user_id,source_tool,source_id,target_tool,source_revision,target_receipt_id,amount_cents)
    values (v_uid,p_source_tool,p_source_id,'haushaltsbuch-kassenbon',
      p_source_revision,v_new_id,(v_amount*100)::bigint);
  return query select 'imported'::text,v_new_id,v_revision;
end;
$fn$;
revoke all on function public.toolya_connect_expense_to_budget(text,text,bigint,bigint)
  from public,anon;
grant execute on function public.toolya_connect_expense_to_budget(text,text,bigint,bigint)
  to authenticated;
