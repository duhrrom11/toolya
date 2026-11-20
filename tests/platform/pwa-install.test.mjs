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
  assert.ok(read('index.html').includes('id="toolyaInstallBtn"'));
});
test('PWA manifest and installer linked from main destinations', () => {
  for (const path of ['index.html','mascots.html','dashboard/index.html','tools/baking/index.html','tools/wishes/public.html']) {
    const html=read(path);
    assert.match(html, /rel="manifest" href="\/manifest\.json"/);
    assert.match(html, /src="\/assets\/toolya-pwa\.js"/);
  }
});
