import test from 'node:test';
import assert from 'node:assert/strict';
import { translateToolRuntimeStatus } from '../../shared/toolya/i18n/interface.mjs';

test('runtime locale lookup ignores inherited/prototype tool keys without throwing', () => {
 for (const tool of ['constructor', '__proto__', 'toString', 'valueOf', 'hasOwnProperty']) {
  for (const locale of ['en', 'de']) {
   for (const message of ['Private user text', '✏️ Buchung bearbeiten: Private user text', 'Gespeichert ✓']) {
    assert.equal(translateToolRuntimeStatus(tool, locale, message), message, `${tool}/${locale}`);
   }
  }
 }
});

test('known runtime status translations remain reversible and keep user suffixes untouched', () => {
 assert.equal(translateToolRuntimeStatus('parking', 'en', 'Gespeichert ✓'), 'Saved ✓');
 assert.equal(translateToolRuntimeStatus('parking', 'de', 'Saved ✓'), 'Gespeichert ✓');
 const userText = '<img src=x onerror=alert(1)> __proto__';
 const de = '✏️ Buchung bearbeiten: ' + userText;
 const en = '✏️ Edit transaction: ' + userText;
 assert.equal(translateToolRuntimeStatus('budget', 'en', de), en);
 assert.equal(translateToolRuntimeStatus('budget', 'de', en), de);
 assert.equal(translateToolRuntimeStatus('budget', 'en', userText), userText);
});
