import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../../tools/parking/index.html', import.meta.url), 'utf8');

test('parking GPS status localises in both directions without persistence or changing coordinates', () => {
 const matched = source.match(/        function refreshParkingGpsLocale\(\) \{[\s\S]*?\n        \}\n\n        async function stopTimer/);
 assert.ok(matched, 'GPS locale handler must exist');
 const status = { textContent: 'Nicht gespeichert' };
 const gps = { lat: 48.8566, lng: 2.3522 };
 const originalGps = JSON.stringify(gps);
 const calls = [];
 const context = {
  window: { __toolyaUILocale: 'en' },
  document: { getElementById(id) { calls.push(id); return id === 'statGps' ? status : null; } }
 };
 const refresh = runInNewContext(matched[0].replace(/\n\n        async function stopTimer$/, '') + '\nrefreshParkingGpsLocale', context);
 refresh();
 assert.equal(status.textContent, 'Not saved');
 status.textContent = 'Gespeichert ✓';
 refresh();
 assert.equal(status.textContent, 'Saved ✓');
 context.window.__toolyaUILocale = 'de';
 refresh();
 assert.equal(status.textContent, 'Gespeichert ✓');
 status.textContent = 'Not saved';
 refresh();
 assert.equal(status.textContent, 'Nicht gespeichert');
 status.textContent = 'Custom user text';
 context.window.__toolyaUILocale = 'en';
 refresh();
 assert.equal(status.textContent, 'Custom user text');
 assert.deepEqual(calls, Array(5).fill('statGps'));
 assert.equal(JSON.stringify(gps), originalGps);
});

test('parking geolocation callback and locale event consistently refresh the status', () => {
 assert.match(source, /id="statGps"[^>]*data-tool-en="Not saved"/);
 assert.match(source, /getElementById\('statGps'\)\.innerText=window\.__toolyaUILocale === 'en' \? 'Saved ✓' : 'Gespeichert ✓'/);
 assert.match(source, /document\.addEventListener\('toolya:locale-change', \(\) => \{\s*refreshParkingTimerLocale\(\);\s*refreshParkingGpsLocale\(\);/);
});
