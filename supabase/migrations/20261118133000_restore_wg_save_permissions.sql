-- The WG client updates only the shared contents and their optimistic revision.
-- Row access continues to be decided by the existing owner-or-member policy.
do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_class as relation
    join pg_catalog.pg_policy as policy on policy.polrelid = relation.oid
    where relation.oid = 'public.wg_spaces'::pg_catalog.regclass
      and relation.relrowsecurity
      and policy.polname = 'wg_spaces_owner_or_member_update'
      and policy.polcmd = 'w'
      and policy.polqual is not null
      and policy.polwithcheck is not null
  ) then
    raise exception 'WG row-level update policy is missing';
  end if;

  grant update (payload, updated_at) on public.wg_spaces to authenticated;
end
$$;
