import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {parseHTML} from 'linkedom';

const root=resolve(import.meta.dirname,'../..');
const read=path=>readFileSync(resolve(root,path),'utf8');

test('four existing tool pages include opt-in shell only, not i18n text replacements in business logic',()=>{
 for(const tool of ['moving','housemates','plants','baking']){
   const html=read('tools/'+tool+'/index.html');
   assert.match(html,/shared\/toolya\/i18n\/tool-entry\.mjs/);
   assert.match(html,/shared\/toolya\/i18n\/tool-entry\.css/);
   assert.match(html,/<html lang="de"/);
   assert.match(html,/shared\/toolya\/auth-page-gate\.js/);
   assert.match(html,/shared\/toolya\/platform\.mjs/);
 }
});

test('language selection works in an isolated document without changing mascot preferences',async()=>{
 const {document}=parseHTML('<!doctype html><html lang="de"><head><title>Pflanzenpflege-App mit Gießplan | Toolya</title></head><body><section class="ty-tool-hero"><div class="ty-tool-hero-copy"><h1><span aria-hidden="true">🌿</span>Pflanzenpflege-App mit Gießplan</h1><p>Gießplan und Fotos</p></div><img data-mascot src="purple.webp" alt="Begleiter"></section><header class="b3-header"><div class="b3-header-inner"><div class="b3-tool-title"><h1>Pflanzenpflege-App mit Gießplan</h1><p>Gießplan und Fotos</p></div></div></header><main></main></body></html>');
 const saved=new Map([['helferlein-toolya-preferences-v1','{"character":"purple"}']]);
 const old={document:globalThis.document,location:globalThis.location,localStorage:globalThis.localStorage,history:globalThis.history};
 globalThis.document=document;
 globalThis.location=new URL('https://toolya.app/tools/plants/?lang=en&utm_source=test#garden');
 const historyState={kept:true};
 globalThis.history={state:historyState,replaceState(state,title,url){
   assert.equal(state,historyState);
   globalThis.location=new URL(url);
 }};
 globalThis.localStorage={getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)};
 try {
   await import('../../shared/toolya/i18n/tool-entry.mjs');
   document.dispatchEvent(new document.defaultView.Event('DOMContentLoaded'));
   const en=document.querySelector('[data-tool-locale="en"]');
   assert.ok(en,'English control exists');
   assert.equal(en.getAttribute('aria-pressed'),'true');
   assert.ok(en.closest('.ty-tool-hero'));
   const heading=document.querySelector('.ty-tool-hero h1');
   const icon=heading.firstElementChild;
   assert.equal(heading.textContent,'🌿Plant care tracker');
   assert.equal(heading.lang,'en');
   assert.equal(document.documentElement.lang,'de','do not falsely claim fully translated application');
   assert.equal(document.querySelector('.ty-tool-language-notice').hidden,false);
   const de=document.querySelector('[data-tool-locale="de"]');
   de.click();
   assert.equal(heading.textContent,'🌿Pflanzenpflege-App mit Gießplan');
   assert.equal(heading.firstElementChild,icon);
   assert.equal(heading.lang,'de');
   assert.equal(document.querySelector('[data-mascot]').getAttribute('src'),'purple.webp');
   assert.equal(saved.get('toolya-locale-v1'),'de');
   assert.equal(location.href,'https://toolya.app/tools/plants/?lang=de&utm_source=test#garden');
   assert.equal(saved.get('helferlein-toolya-preferences-v1'),'{"character":"purple"}');
 } finally {
   globalThis.document=old.document;
   globalThis.location=old.location;
   globalThis.localStorage=old.localStorage;
   globalThis.history=old.history;
 }
});

test('marketing only adds English locale to same-origin tool URLs',()=>{
 const js=read('shared/toolya/i18n/marketing.mjs');
 assert.match(js,/url\.origin!==location\.origin/);
 assert.match(js,/url\.pathname\.startsWith\('\/tools\/'\)/);
 assert.match(js,/url\.searchParams\.set\('lang','en'\)/);
 assert.doesNotMatch(js,/service_role|supabase\.auth/i);
});
