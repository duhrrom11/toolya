import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requireVerifiedUser, createCloudOnlyGuard } from '../shared/toolya/cloud-auth-gate.mjs';

function clientFor(getUser) {
  let listener, unsubscribed = false;
  const client = {
    auth: {
      getUser,
      onAuthStateChange(fn) {
        listener = fn;
        return { data: { subscription: { unsubscribe() { unsubscribed = true; } } } };
      }
    }
  };
  return { client, emit() { listener('SIGNED_IN', null); }, get unsubscribed() { return unsubscribed; } };
}

test('registered user is accepted; anonymous and missing sessions are rejected', async () => {
  assert.equal((await requireVerifiedUser(clientFor(async () => ({data:{user:{id:'a',is_anonymous:false}},error:null})).client)).id,'a');
  await assert.rejects(requireVerifiedUser(clientFor(async () => ({data:{user:{id:'a',is_anonymous:true}},error:null})).client),/registriertes/);
  await assert.rejects(requireVerifiedUser(clientFor(async () => ({data:{user:null},error:null})).client),/anmelden/);
});

test('auth service errors are not misclassified as signed-out sessions', async () => {
  const failure = new Error('network');
  await assert.rejects(requireVerifiedUser(clientFor(async () => ({data:{user:null},error:failure})).client),/nicht geprüft/);
  const calls = [];
  const fixture = clientFor(async () => ({data:{user:null},error:failure}));
  const guard = createCloudOnlyGuard(fixture.client, {
    onUnauthorized: async () => calls.push('unauthorized'),
    onError: async () => calls.push('error')
  });
  await guard.verify();
  assert.deepEqual(calls,['error']);
  guard.dispose();
  assert.equal(fixture.unsubscribed,true);
});

test('stale authorization result after dispose cannot reopen gate', async () => {
  let resolveUser;
  const fixture = clientFor(() => new Promise(resolve => { resolveUser = resolve; }));
  let authorized = 0;
  const guard = createCloudOnlyGuard(fixture.client, {onAuthorized:async () => { authorized++; }});
  const pending = guard.verify();
  guard.dispose();
  resolveUser({data:{user:{id:'a',is_anonymous:false}},error:null});
  await pending;
  assert.equal(authorized,0);
});
