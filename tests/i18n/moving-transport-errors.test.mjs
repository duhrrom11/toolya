import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../../tools/moving/moving-transport.mjs', import.meta.url), 'utf8')
  .replace(/^import[^\n]*\n/gm, '');

function setup(fetch) {
  const listeners = new Map();
  const root = { hidden: false, innerHTML: '', addEventListener() {} };
  const document = {
    getElementById: id => id === 'toolya-moving-transport' ? root : null,
    addEventListener: (name, callback) => listeners.set(name, callback),
  };
  const window = {
    movingCloudReady: true,
    __toolyaUILocale: 'de',
    getData: () => ({ moving: { projects: [{ id: 'fixture', status: 'active' }] } }),
    supabaseClient: { auth: { getSession: async () => ({ data: { session: { access_token: 'fixture' } } }) } },
  };
  const load = runInNewContext(source + '\nload;', { document, window, fetch });
  return {
    root,
    load,
    switchLanguage(locale) {
      window.__toolyaUILocale = locale;
      listeners.get('toolya:locale-change')();
    },
  };
}

test('transport errors follow the selected language without another API request', async () => {
  let requests = 0;
  const view = setup(async () => {
    requests++;
    return { ok: false, status: 503, json: async () => ({ error: 'Gateway fixture detail' }) };
  });

  await view.load();
  assert.match(view.root.innerHTML, /Transportdienst nicht erreichbar/);
  view.switchLanguage('en');
  assert.match(view.root.innerHTML, /Transport service unavailable/);
  assert.doesNotMatch(view.root.innerHTML, /Gateway fixture detail/);
  view.switchLanguage('de');
  assert.match(view.root.innerHTML, /Transportdienst nicht erreichbar/);
  assert.equal(requests, 1);
});

test('an expired transport session uses the sign-in message in both languages', async () => {
  const view = setup(async () => ({ ok: false, status: 401 }));
  await view.load();
  assert.match(view.root.innerHTML, /Bitte erneut anmelden/);
  view.switchLanguage('en');
  assert.match(view.root.innerHTML, /Please sign in again/);
});
