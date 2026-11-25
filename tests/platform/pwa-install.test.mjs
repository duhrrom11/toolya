import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const root = process.cwd();
const read = path => readFileSync(join(root, path), 'utf8');
test('Toolya exposes a valid installable PWA manifest', () => {
  const app = JSON.parse(read('manifest.json'));
  assert.equal(app.id, '/');
  assert.equal(app.start_url, '/');
  assert.equal(app.scope, '/');
  assert.equal(app.display, 'standalone');
  assert.ok(app.name && app.short_name);
  for (const size of [192, 512]) {
    const icon = app.icons.find(item => item.sizes === size + 'x' + size);
    assert.ok(icon, size + 'px icon missing');
    const path = join(root, icon.src.slice(1));
    assert.ok(existsSync(path), 'Icon file missing: ' + path);
    const image = readFileSync(path);
    assert.equal(image.toString('hex', 0, 8), '89504e470d0a1a0a');
    assert.equal(image.readUInt32BE(16), size);
    assert.equal(image.readUInt32BE(20), size);
  }
});
test('Toolya exposes an offline-only service worker and install flow', () => {
  const worker = read('sw.js');
  assert.match(worker, /addEventListener\('fetch'/);
  assert.match(worker, /request\.mode !== 'navigate'/);
  assert.match(worker, /caches\.match\(OFFLINE_URL\)/);
  assert.doesNotMatch(worker, /cache\.put\(/);
  const install = read('assets/toolya-pwa.js');
  assert.match(install, /beforeinstallprompt/);
  assert.match(install, /serviceWorker\.register\('\/sw\.js'/);
  assert.doesNotMatch(read('index.html'), /id="toolyaInstallBtn"|ty-pwa-install/);
  const settings = read('shared/toolya/platform.mjs');
  assert.match(settings, /className='ty-settings-group ty-pwa-settings'/);
  assert.match(settings, /data-toolya-install/);
  assert.match(settings, /insertBefore\(install,anchor\|\|support\)/);
  assert.match(install, /addEventListener\('click'/);
  assert.match(install, /closest\?\.\('\[data-toolya-install\]'\)/);
  assert.match(install, /toolya:pwa-settings-mounted/);
  assert.match(read('shared/toolya/settings-accordion.css'), /\.ty-pwa-action/);
});
test('PWA manifest and installer linked from main destinations', () => {
  for (const path of ['index.html','en/index.html','dashboard/index.html','tools/baking/index.html','tools/wishes/public.html']) {
    const html=read(path);
    assert.match(html, /rel="manifest" href="\/manifest\.json"/);
    assert.match(html, /src="\/assets\/toolya-pwa\.js"/);
  }
});

test('Install action works from dynamically mounted settings with a browser prompt', async () => {
  const { runInNewContext } = await import('node:vm');
  const listeners = { document: new Map(), window: new Map() };
  const button = { hidden: false };
  const status = { hidden: true, textContent: '' };
  const document = {
    querySelector: selector => selector === '[data-toolya-install]' ? button :
      selector === '[data-toolya-install-status]' ? status : null,
    addEventListener: (event, handler) => listeners.document.set(event, handler)
  };
  const window = {
    isSecureContext: false,
    addEventListener: (event, handler) => listeners.window.set(event, handler),
    matchMedia: () => ({ matches: false })
  };
  const navigator = { userAgent: 'Chrome Android', standalone: false, platform: 'Linux' };
  runInNewContext(read('assets/toolya-pwa.js'), { window, document, navigator });
  let prevented = false, prompted = 0;
  listeners.window.get('beforeinstallprompt')({
    preventDefault: () => { prevented = true; },
    prompt: async () => { prompted++; },
    userChoice: Promise.resolve({ outcome: 'accepted' })
  });
  assert.equal(prevented, true);
  await listeners.document.get('click')({
    target: { closest: selector => selector === '[data-toolya-install]' ? button : null }
  });
  assert.equal(prompted, 1);
  assert.equal(button.hidden, true);
  assert.match(status.textContent, /Installation bestätigt/);
});

test('Installed app hides installation action and leaves existing settings intact', async () => {
  const { runInNewContext } = await import('node:vm');
  const button = { hidden: false };
  const status = { hidden: true, textContent: '' };
  const document = {
    querySelector: selector => selector === '[data-toolya-install]' ? button :
      selector === '[data-toolya-install-status]' ? status : null,
    addEventListener: () => {}
  };
  const window = {
    isSecureContext: false,
    addEventListener: () => {},
    matchMedia: () => ({ matches: true })
  };
  runInNewContext(read('assets/toolya-pwa.js'), { window, document, navigator: {} });
  assert.equal(button.hidden, true);
  assert.match(status.textContent, /bereits als App geöffnet/);
});
