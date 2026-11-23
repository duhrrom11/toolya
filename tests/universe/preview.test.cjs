const assert = require('node:assert/strict');
const { once } = require('node:events');
const { get } = require('node:http');
const { test } = require('node:test');
const { previewConfig, previewServer } = require('../../scripts/universe-preview.cjs');

const isolated = {
  TOOLYA_PREVIEW_SUPABASE_REF: 'abcdefghijklmnopqrst',
  TOOLYA_PREVIEW_SUPABASE_KEY: 'sb_publishable_synthetic_preview_key',
};

test('isolated preview rejects both existing project refs and non-publishable keys', () => {
  assert.throws(() => previewConfig({}), /separate test project/);
  for (const ref of ['yheogmeaosuigyaxkwth', 'avapuibsidubuzxjtyld']) {
    assert.throws(() => previewConfig({ ...isolated, TOOLYA_PREVIEW_SUPABASE_REF: ref }), /are blocked/);
  }
  assert.throws(() => previewConfig({ ...isolated, TOOLYA_PREVIEW_SUPABASE_KEY: 'sb_secret_fixture' }), /publishable key/);
  assert.throws(() => previewConfig({ ...isolated, TOOLYA_PREVIEW_PORT: '80' }), /Invalid preview port/);
});

test('candidate HTML and clients use the isolated backend and loopback redirects', async t => {
  const config = previewConfig(isolated);
  const server = previewServer(config);
  t.after(() => server.close());
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  config.origin = `http://127.0.0.1:${server.address().port}`;

  for (const path of ['/', '/account/register.html', '/tools/gamification/',
    '/tools/moving/', '/tools/wishes/public.html', '/shared/toolya/universe-account.mjs']) {
    const response = await fetch(config.origin + path);
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.match(response.headers.get('x-robots-tag'), /noindex/);
    assert.ok(response.headers.get('content-security-policy').includes(`connect-src 'self' ${config.backend};`));
    const page = await response.text();
    assert.ok(page.includes(config.backend), path);
    assert.doesNotMatch(page, /yheogmeaosuigyaxkwth|sb_publishable_PK20oOP|https:\/\/toolya\.app[/'"]/u, path);
    if (path === '/') assert.ok(page.includes("const redirect = new URL('/index.html', location.origin)"));
  }
  for (const path of ['/.git/config', '/supabase/config.toml', '/assets/%2e%2e%2fREADME.md']) {
    assert.equal((await fetch(config.origin + path)).status, 404, path);
  }
  assert.equal((await fetch(config.origin + '/', { method: 'POST' })).status, 405);
  const [wrongHost] = await once(get(config.origin, { headers: { Host: 'external.invalid' } }), 'response');
  wrongHost.resume();
  assert.equal(wrongHost.statusCode, 403);
});
