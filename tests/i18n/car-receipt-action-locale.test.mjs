import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../../tools/car/index.html',import.meta.url),'utf8');
const line=source.split('\n').find(line=>line.includes('let receiptBtn = e.receipt ?'));
assert.ok(line,'vehicle receipt button template exists');

function render(locale,receipt='data:image/png;base64,AAAA') {
 const expression=`(()=>{const english=${JSON.stringify(locale==='en')}; const label=(de,en)=>english?en:de; const e={receipt:${JSON.stringify(receipt)}}; ${line} return receiptBtn;})()`;
 return runInNewContext(expression);
}

test('vehicle receipt button and tooltip localise without modifying the receipt URL or click behavior',()=>{
 const en=render('en'),de=render('de');
 assert.match(en,/title="View receipt"/);
 assert.match(en,/>🧾 Receipt<\/button>/);
 assert.match(de,/title="Beleg anzeigen"/);
 assert.match(de,/>🧾 Beleg<\/button>/);
 for(const html of [en,de]) {
  assert.match(html,/onclick="zoomImage\('data:image\/png;base64,AAAA'\)"/);
  assert.match(html,/class="px-2 py-1 bg-red-50/);
 }
 assert.equal(render('en',''), '');
 assert.equal(render('de',''), '');
});

test('vehicle receipt translation is in the existing read-only rendering path',()=>{
 assert.match(source,/function renderApp\(\) \{\s*const english = window\.__toolyaUILocale === 'en';/);
 assert.match(source,/const label = \(de, en\) => english \? en : de;/);
 assert.doesNotMatch(line,/saveData\(|localStorage\.|\.insertAdjacentHTML\(/);
});
