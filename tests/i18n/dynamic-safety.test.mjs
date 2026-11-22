import test from 'node:test';
import assert from 'node:assert/strict';
import { translateToolDialog, translateAccountStatus } from '../../shared/toolya/i18n/interface.mjs';

// Inputs can contain arbitrary user/server text. No inherited Object keys may
// turn a translation into a function, object, or injected copy.
test('dynamic dialog translation treats prototype names as literal messages', () => {
 for (const tool of ['moving','housemates','plants','baking','unknown']) {
  for (const message of ['__proto__','constructor','toString','hasOwnProperty']) {
   assert.equal(translateToolDialog(tool,'en',message),message,tool+': '+message);
   assert.equal(translateToolDialog(tool,'de',message),message);
  }
 }
});
test('auth and import failure prefixes preserve untrusted detail byte-for-byte', () => {
 for (const tool of ['moving','housemates','plants','baking']) {
  for (const detail of ['__proto__','constructor','toString','<img src=x onerror=alert(1)>','user@example.test','40001: revision conflict']) {
   const source='Registrierung fehlgeschlagen: '+detail;
   assert.equal(translateToolDialog(tool,'en',source),'Registration failed: '+detail);
   assert.equal(translateToolDialog(tool,'de',source),source);
  }
 }
});
test('account statuses return unknown server strings unchanged, never inherited properties', () => {
 for (const message of ['__proto__','constructor','toString','hasOwnProperty','40001: revision conflict','user@example.test']) {
  assert.equal(translateAccountStatus('en',message),message);
  assert.equal(translateAccountStatus('de',message),message);
 }
 assert.equal(translateAccountStatus('en','✅ Angemeldet – user@example.test'),'✅ Signed in – user@example.test');
 assert.equal(translateAccountStatus('de','✅ Signed in – user@example.test'),'✅ Angemeldet – user@example.test');
});
