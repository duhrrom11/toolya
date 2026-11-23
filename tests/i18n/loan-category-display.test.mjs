import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../../tools/loans/index.html', import.meta.url), 'utf8');
const start = source.indexOf('const loanCategoryLabels = Object.freeze(');
const end = source.indexOf('function loadDropdowns()', start);
assert.ok(start > 0 && end > start, 'display-only loan category helper available');
const helper = source.slice(start, end);

function setup(locale = 'en') {
 const window = { __toolyaUILocale: locale };
 const unknown = '__proto__';
 const original = [
  {value: 'My & <private> drill', textContent: '', dataset: {category: 'Werkzeug', serial: 'SN-123'}, selected: true},
  {value: 'Custom record', textContent: '', dataset: {category: unknown, serial: ''}, selected: false},
  {value: '', textContent: '-- Inventar-Gegenstand wählen --', dataset: {}, selected: false}
 ];
 const select = { options: original, get value() {return original.find(o => o.selected)?.value ?? '';} };
 const document = { getElementById(id) { return id === 'itemInventorySelect' ? select : null; } };
 const context = { window, document };
 const api = runInNewContext(helper + '\n({ display: loanCategoryDisplay, refresh: localizeLoanSelectPlaceholders })', context);
 return { api, window, select, original };
}

test('loan categories translate only five canonical display values', () => {
 const { api, window } = setup();
 const entries = [
  ['Werkzeug', 'Tools'], ['Elektronik', 'Electronics & IT'],
  ['Bücher & Medien', 'Books & media'], ['Sport & Freizeit', 'Sports & leisure'],
  ['Sonstiges', 'Other']
 ];
 for (const [de,en] of entries) {
  assert.equal(api.display(de), en);
  window.__toolyaUILocale = 'de';
  assert.equal(api.display(de), de);
  window.__toolyaUILocale = 'en';
 }
 for (const value of ['__proto__', 'constructor', 'toString', '<script>alert(1)</script>', 'Tools']) {
  assert.equal(api.display(value), value);
 }
});

test('loan inventory selector refreshes text reversibly, retaining values, selection, and metadata', () => {
 const { api, window, select, original } = setup();
 const before = original.map(o => ({value:o.value,category:o.dataset.category,serial:o.dataset.serial,selected:o.selected}));
 const selectedBefore = select.value;
 api.refresh();
 assert.equal(original[0].textContent, 'My & <private> drill (Tools | SN: SN-123)');
 assert.equal(original[1].textContent, 'Custom record (__proto__)');
 window.__toolyaUILocale = 'de';
 api.refresh();
 assert.equal(original[0].textContent, 'My & <private> drill (Werkzeug | SN: SN-123)');
 assert.equal(select.value, selectedBefore);
 assert.deepEqual(original.map(o => ({value:o.value,category:o.dataset.category,serial:o.dataset.serial,selected:o.selected})), before);
 assert.doesNotMatch(helper, /saveData\(|localStorage\.|innerHTML\s*=|replaceChildren\(/);
});

test('canonical category badges are HTML-escaped and static selects keep canonical values', () => {
 assert.match(source, /escapeHtml\(loanCategoryDisplay\(i\.category\)\)/);
 assert.match(source, /escapeHtml\(i\.category \? loanCategoryDisplay\(i\.category\)/);
 assert.match(source, /loanCategoryDisplay\(i\.category\).*?option\.dataset\.category = String\(i\.category/s);
 for (const category of ['Werkzeug','Elektronik','Bücher & Medien','Sport & Freizeit','Sonstiges']) {
  const escaped = category.replace(/[.*+?^$\{\}()|[\]\\]/g, '\\$&');
  assert.equal([...source.matchAll(new RegExp('<option value="' + escaped + '" data-tool-en=', 'g'))].length, 2, category);
 }
});
