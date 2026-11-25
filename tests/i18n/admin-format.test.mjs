import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {readFileSync} from 'node:fs';
import {adminNumber,adminDate,createAdminPresentation} from '../../shared/toolya/i18n/admin-format.mjs';

test('admin numeric and calendar displays follow language',()=>{
 assert.equal(adminNumber(1234.5,'de'),'1.234,5');
 assert.equal(adminNumber(1234.5,'en'),'1,234.5');
 assert.equal(adminDate('2026-11-24T12:00:00','de'),'24.11.2026');
 assert.equal(adminDate('2026-11-24T12:00:00','en'),'24/11/2026');
 assert.equal(adminDate('invalid','en'),'');
});
test('repainting changes only registered presentation nodes and preserves drafts and selection',()=>{
 const {document}=parseHTML('<html><body><details open><form><input value="original"><input type="checkbox" checked><select><option value="30" selected>30</option></select></form><p id="date"></p><strong id="value"></strong><p id="private">Private 1.234,5</p></details></body></html>');
 const input=document.querySelector('input');input.value='Unsaved draft';
 const checkbox=document.querySelector('[type="checkbox"]');
 const select=document.querySelector('select');
 const date=document.querySelector('#date'),value=document.querySelector('#value');
 const presentation=createAdminPresentation(document);
 presentation.bind(date,lang=>{date.textContent=adminDate('2026-11-24T12:00:00',lang)},'de');
 presentation.bind(value,lang=>{value.textContent=adminNumber(1234.5,lang)},'de');
 for(const lang of ['en','de']){
  presentation.refresh(lang);
  assert.equal(document.querySelector('input'),input);
  assert.equal(input.value,'Unsaved draft');
  assert.equal(document.querySelector('[type="checkbox"]'),checkbox);
  assert.equal(checkbox.hasAttribute('checked'),true);
  assert.equal(select.value,'30');
  assert.equal(document.querySelector('details').hasAttribute('open'),true);
  assert.equal(document.querySelector('#private').textContent,'Private 1.234,5');
  assert.equal(date.textContent,adminDate('2026-11-24T12:00:00',lang));
  assert.equal(value.textContent,adminNumber(1234.5,lang));
 }
});
test('admin locale handlers refresh registered display nodes without calling load or render',()=>{
 for(const file of ['stats.js','wishlist-finder.mjs']){
  const source=readFileSync(new URL('../../admin-stats-dashboard/'+file,import.meta.url),'utf8');
  assert.ok(source.includes("document.addEventListener('toolya:admin-locale-change',()=>presentation.refresh("));
  assert.ok(!source.includes("toLocaleString('de-DE')"));
  assert.ok(!source.includes("toLocaleDateString('de-DE')"));
 }
});
