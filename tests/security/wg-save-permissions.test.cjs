const assert = require('node:assert/strict');
const fs = require('node:fs');
const { Client } = require('pg');

const service = new URL(process.env.ESTATE_TEST_DATABASE_URL);
assert.equal(service.hostname, '127.0.0.1', 'requires the isolated PostgreSQL service');
assert.equal(service.pathname, '/estate_synthetic', 'requires the isolated PostgreSQL service');

const owner = '00000000-0000-4000-8000-000000000001';
const member = '00000000-0000-4000-8000-000000000002';
const stranger = '00000000-0000-4000-8000-000000000003';
const space = '00000000-0000-4000-8000-000000000010';
const revision = '2030-01-01T00:00:00.000Z';
const migration = fs.readFileSync('supabase/migrations/20261118133027_restore_wg_save_permissions.sql', 'utf8');

(async () => {
  const serviceClient = new Client({ connectionString: service.href });
  await serviceClient.connect();
  try {
    await serviceClient.query('create database toolya_wg_permissions');
  } finally {
    await serviceClient.end();
  }

  service.pathname = '/toolya_wg_permissions';
  const client = new Client({ connectionString: service.href });
  await client.connect();
  try {
    await client.query(`
      do $$ begin
        if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
        if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
      end $$;
      create schema auth;
      create function auth.uid() returns uuid language sql stable
        as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to authenticated;

      create table public.wg_spaces (
        id uuid primary key,
        owner_id uuid not null,
        payload jsonb not null,
        updated_at timestamptz not null
      );
      create table public.wg_members (
        wg_id uuid not null,
        user_id uuid not null,
        owner_id uuid not null
      );
      alter table public.wg_spaces enable row level security;
      alter table public.wg_members enable row level security;
      grant select on public.wg_spaces, public.wg_members to authenticated;
      create policy wg_members_select on public.wg_members for select to authenticated
        using (user_id = (select auth.uid()) or owner_id = (select auth.uid()));
      create policy wg_spaces_owner_or_member_select on public.wg_spaces for select to authenticated
        using (owner_id = (select auth.uid()) or exists (
          select 1 from public.wg_members member where member.wg_id = wg_spaces.id and member.user_id = (select auth.uid())
        ));
    `);
    await assert.rejects(client.query(migration), /WG row-level update policy is missing/);
    await client.query(`
      create policy wg_spaces_owner_or_member_update on public.wg_spaces for update to authenticated
        using (owner_id = (select auth.uid()) or exists (
          select 1 from public.wg_members member where member.wg_id = wg_spaces.id and member.user_id = (select auth.uid())
        ))
        with check (owner_id = (select auth.uid()) or exists (
          select 1 from public.wg_members member where member.wg_id = wg_spaces.id and member.user_id = (select auth.uid())
        ));
    `);
    await client.query("insert into public.wg_spaces values ($1, $2, '{}', $3)", [space, owner, revision]);
    await client.query('insert into public.wg_members values ($1, $2, $3)', [space, member, owner]);

    const save = (expected, next) => client.query(
      "update public.wg_spaces set payload = '{\"saved\":true}', updated_at = $1 where id = $2 and updated_at = $3 returning updated_at",
      [next, space, expected]
    );
    const next = '2030-01-01T00:00:01.000Z';
    const after = '2030-01-01T00:00:02.000Z';
    const future = '2030-01-01T00:00:03.000Z';
    const actAs = user => client.query("select set_config('request.jwt.claim.sub', $1, false)", [user]);

    await client.query('set role authenticated');
    await actAs(owner);
    await assert.rejects(save(revision, next), { code: '42501' });
    await client.query('reset role');
    await client.query(migration);

    await client.query('set role authenticated');
    assert.equal((await save(revision, next)).rows[0].updated_at.toISOString(), next, 'owner can save');
    assert.equal((await save(revision, after)).rowCount, 0, 'stale revision fails closed');
    await assert.rejects(client.query('update public.wg_spaces set owner_id = $1 where id = $2', [stranger, space]), { code: '42501' });
    await assert.rejects(client.query('update public.wg_spaces set id = $1 where id = $2', [stranger, space]), { code: '42501' });

    await actAs(member);
    assert.equal((await save(next, after)).rows[0].updated_at.toISOString(), after, 'member can save');
    await actAs(stranger);
    assert.equal((await save(after, future)).rowCount, 0, 'outsider cannot save');

    await client.query('reset role');
    await client.query('set role anon');
    await assert.rejects(save(after, future), { code: '42501' });
    await client.query('reset role');
    await client.query('revoke update (payload, updated_at) on public.wg_spaces from authenticated');
    await client.query('set role authenticated');
    await actAs(owner);
    await assert.rejects(save(after, future), { code: '42501' });
    console.log('PASS: WG owner/member save, stale revision, outsider and anonymous access, immutable identity, rollback');
  } finally {
    await client.end();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
