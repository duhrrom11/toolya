import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source=readFileSync(new URL('../../tools/budget/index.html', import.meta.url),'utf8');
const start=source.indexOf('function refreshBudgetPhotoPreviewLocale()');
const end=source.indexOf('// Read-only locale refresh: keep open budget inputs',start);
assert.ok(start>0&&end>start,'photo preview locale helper exists');
const helper=source.slice(start,end);

test('budget photo preview alt text follows locale without changing image content or user drafts',()=>{
 const images=[
  {src:'data:image/png;base64,AAAA',dataset:{photoIndex:'3'},alt:'Vorschau des Belegfotos 4'},
  {src:'data:image/png;base64,BBBB',dataset:{photoIndex:'0'},alt:'Vorschau des Belegfotos 1'},
  {src:'data:image/png;base64,CCCC',dataset:{},alt:'Vorschau des Belegfotos 3'}
 ];
 const input={value:'Private draft text'};
 const window={__toolyaUILocale:'en'};
 const document={querySelectorAll(selector){assert.equal(selector,'#uploadGalleryPreview img');return images;}};
 const originals=images.map(image=>image.src);
 const refresh=runInNewContext(helper+'\nrefreshBudgetPhotoPreviewLocale',{window,document});
 refresh();
 assert.deepEqual(images.map(image=>image.alt),['Receipt photo preview 4','Receipt photo preview 1','Receipt photo preview 3']);
 window.__toolyaUILocale='de';
 refresh();
 assert.deepEqual(images.map(image=>image.alt),['Vorschau des Belegfotos 4','Vorschau des Belegfotos 1','Vorschau des Belegfotos 3']);
 assert.deepEqual(images.map(image=>image.src),originals);
 assert.equal(input.value,'Private draft text');
 assert.doesNotMatch(helper,/saveData\(|localStorage\.|innerHTML\s*=|\.src\s*=|\.value\s*=/);
});

test('both receipt preview creation paths and existing in-place locale listener use bilingual labels',()=>{
 assert.equal((source.match(/imgThumb\.alt = \(window\.__toolyaUILocale === 'en' \? 'Receipt photo preview '/g)||[]).length,2);
 assert.match(source,/refreshBudgetStickerLabels\(\);\s*refreshBudgetPhotoPreviewLocale\(\);/);
 assert.match(source,/document\.addEventListener\('toolya:locale-change', refreshBudgetDynamicLocale\)/);
 assert.match(source,/imgThumb\.dataset\.photoIndex = String\(index\)/);
});
