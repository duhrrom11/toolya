-- Reviewed deployment candidate; apply only after isolated RLS acceptance.
begin;
create table public.budget_households (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 title text not null check (length(btrim(title)) between 1 and 120)
);
create table public.budget_household_invites (
 household_id uuid not null references public.budget_households(id) on delete cascade,
 owner_id uuid not null references auth.users(id) on delete cascade,
 invitee_id uuid not null references auth.users(id) on delete cascade,
 accepted boolean not null default false,
 primary key(household_id,invitee_id),
 check(owner_id<>invitee_id)
);
create table public.budget_household_shares (
 household_id uuid not null references public.budget_households(id) on delete cascade,
 author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 booking_id bigint not null check(booking_id>=0),
 title text not null check(length(btrim(title)) between 1 and 200),
 booking_date date not null,
 cents bigint not null check(cents between 1 and 9007199254740991),
 primary key(household_id,author_id,booking_id)
);
alter table public.budget_households enable row level security;
alter table public.budget_household_invites enable row level security;
alter table public.budget_household_shares enable row level security;
revoke all on public.budget_households,public.budget_household_invites,public.budget_household_shares from public,anon,authenticated;
grant select,insert,delete on public.budget_households to authenticated;
grant select,insert,delete on public.budget_household_invites to authenticated;
grant update(accepted) on public.budget_household_invites to authenticated;
grant select,insert,delete on public.budget_household_shares to authenticated;
-- Invitation visibility depends only on the two identities, avoiding recursive RLS.
create policy budget_invite_read on public.budget_household_invites for select to authenticated
using ((select auth.uid()) in (owner_id,invitee_id) and (select auth.jwt()->>'is_anonymous')='false');
create policy budget_household_read on public.budget_households for select to authenticated
using ((select auth.jwt()->>'is_anonymous')='false' and (owner_id=(select auth.uid()) or exists(
 select 1 from public.budget_household_invites i where i.household_id=id and i.invitee_id=(select auth.uid()) and i.accepted)));
create policy budget_household_create on public.budget_households for insert to authenticated
with check(owner_id=(select auth.uid()) and (select auth.jwt()->>'is_anonymous')='false');
create policy budget_household_delete on public.budget_households for delete to authenticated
using(owner_id=(select auth.uid()) and (select auth.jwt()->>'is_anonymous')='false');
create policy budget_invite_create on public.budget_household_invites for insert to authenticated
with check(owner_id=(select auth.uid()) and not accepted and (select auth.jwt()->>'is_anonymous')='false'
 and exists(select 1 from public.budget_households h where h.id=household_id and h.owner_id=(select auth.uid())));
create policy budget_invite_accept on public.budget_household_invites for update to authenticated
using(invitee_id=(select auth.uid()) and not accepted and (select auth.jwt()->>'is_anonymous')='false')
with check(invitee_id=(select auth.uid()) and accepted and (select auth.jwt()->>'is_anonymous')='false');
create policy budget_invite_revoke on public.budget_household_invites for delete to authenticated
using((select auth.uid()) in (owner_id,invitee_id) and (select auth.jwt()->>'is_anonymous')='false');
create policy budget_share_read on public.budget_household_shares for select to authenticated
using ((select auth.jwt()->>'is_anonymous')='false' and exists(
 select 1 from public.budget_households h where h.id=household_id));
create policy budget_share_create on public.budget_household_shares for insert to authenticated
with check(author_id=(select auth.uid()) and (select auth.jwt()->>'is_anonymous')='false' and exists(
 select 1 from public.budget_households h where h.id=household_id));
create policy budget_share_revoke on public.budget_household_shares for delete to authenticated
using(author_id=(select auth.uid()) and (select auth.jwt()->>'is_anonymous')='false');
-- Revoked members' shared copies must not reappear after reinvitation.
-- Delete them in the same transaction, using an internal trigger with no client execute grant.
create schema if not exists budget_household_internal;
revoke all on schema budget_household_internal from public,anon,authenticated;
create function budget_household_internal.cleanup_member() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 delete from public.budget_household_shares where household_id=old.household_id and author_id=old.invitee_id;
 return old;
end;
$$;
revoke all on function budget_household_internal.cleanup_member() from public,anon,authenticated;
create trigger budget_household_member_cleanup after delete on public.budget_household_invites
for each row execute function budget_household_internal.cleanup_member();
commit;
