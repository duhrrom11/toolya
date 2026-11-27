import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseHTML} from 'linkedom';
import {bindDisplay,dateLabel,stampLabel,timeLabel,money,ui} from '../../tools/wishes/display-format.mjs';
import {applyWishLocale} from '../../shared/toolya/i18n/wishes-dom.mjs';
const read=name=>readFileSync(new URL('../../tools/wishes/'+name+'.mjs',import.meta.url),'utf8');

test('legacy formatting uses locale-specific EUR amounts and date-only displays',()=>{
 const old=globalThis.__toolyaWishesLocale;
 try{
  globalThis.__toolyaWishesLocale='de';
  assert.equal(money(1234.5),'1.234,50\u00a0€');
  assert.equal(dateLabel('2026-12-01T00:00:00Z',{timeZone:'UTC'}),'1.12.2026');
  assert.equal(ui('Wunschpreis: '),'Wunschpreis: ');
  globalThis.__toolyaWishesLocale='en';
  assert.equal(money(1234.5),'€1,234.50');
  assert.equal(dateLabel('2026-12-01T00:00:00Z',{timeZone:'UTC'}),'01/12/2026');
  assert.equal(ui('Wunschpreis: '),'Target price: ');
  assert.equal(ui('Menge: '),'Quantity: ');
  assert.equal(ui('Hinzugefügt: '),'Added: ');
  assert.equal(ui('Zuletzt geändert: '),'Last changed: ');
  assert.equal(ui('📌 Geplant'),'📌 Planned');
  const stamp=Date.parse('2026-12-01T12:34:00Z');
  assert.equal(stampLabel(stamp),new Date(stamp).toLocaleString('en-GB'));
  assert.equal(timeLabel(stamp),new Date(stamp).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}));
 }finally{if(old===undefined)delete globalThis.__toolyaWishesLocale;else globalThis.__toolyaWishesLocale=old}
});

test('format bindings preserve data and explicitly owned mixed text',()=>{
 const {document}=parseHTML('<html><body><p></p><select><option value="123"></option></select><div></div></body></html>');
 const old=globalThis.__toolyaWishesLocale;
 try{
  globalThis.__toolyaWishesLocale='en';
  const p=document.querySelector('p'),option=document.querySelector('option'),div=document.querySelector('div');
  const title='Speichern';
  bindDisplay(p,()=>ui('Hinzufügen zu ')+title);
  bindDisplay(option,()=>dateLabel('2026-12-01T00:00:00Z',{timeZone:'UTC'}));
  bindDisplay(div,()=>ui('Zuletzt geändert: ')+'123','aria-label');
  assert.equal(p.textContent,'Add to Speichern');
  assert.equal(option.value,'123');
  assert.equal(div.getAttribute('aria-label'),'Last changed: 123');
  applyWishLocale(document,'de');
  assert.equal(p.textContent,'Add to Speichern');
  assert.equal(option.value,'123');
  assert.ok(p.hasAttribute('data-user-content'));
 }finally{if(old===undefined)delete globalThis.__toolyaWishesLocale;else globalThis.__toolyaWishesLocale=old}
});

test('legacy wishlist display paths no longer hardcode German date or currency formatting',()=>{
 for(const name of ['app','lists-dashboard','gift-start']){
  const source=read(name);
  assert.doesNotMatch(source,/toLocale(?:Date|Time)?String\('de-DE'|new Intl.NumberFormat\('de-DE'/,name);
  assert.match(source,/from '\.\/display-format\.mjs'/);
 }
 const app=read('app'),lists=read('lists-dashboard'),home=read('gift-start');
 assert.match(app,/toolya:wishes-locale-change',updateWishExtrasPreview/);
 assert.match(app,/money\(data\.price\)/);
 assert.match(lists,/time:Date\.now\(\)/);
 assert.match(lists,/money\(extras\.price\)/);
 assert.match(home,/bindDisplay\(option,\(\)=>stampLabel\(row\.changed_at\)/);
 assert.match(home,/new Option\('',String\(row\.id\)\)/);
});
