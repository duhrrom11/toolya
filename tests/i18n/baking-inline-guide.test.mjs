import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';

test('baking inline guide follows DE/EN and keeps its link and private data intact',async()=>{
 const {document}=parseHTML('<!doctype html><html lang="de"><head><title>Backform-Rechner | Toolya</title></head><body>'+
 '<header class="b3-header"><div class="b3-header-inner"><div class="b3-tool-title"><h1>Backform-Rechner</h1><p>Ein Rezept umrechnen</p></div></div></header>'+
 '<div id="help-box"><p><a href="/backform-rechner/" data-tool-en="Step-by-step guide with an example calculation">Schritt-für-Schritt-Anleitung mit Rechenbeispiel</a></p></div>'+
 '<textarea id="recipe-input">Omas privates Rezept</textarea></body></html>');
 const prior={document:globalThis.document,location:globalThis.location,localStorage:globalThis.localStorage,history:globalThis.history};
 const saved=new Map();
 globalThis.document=document;
 globalThis.location=new URL('https://toolya.app/tools/baking/?lang=en');
 globalThis.localStorage={getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value)};
 globalThis.history={state:null,replaceState(state,title,url){globalThis.location=new URL(url,globalThis.location.href)}};
 try{
  await import('../../shared/toolya/i18n/tool-entry.mjs?test=baking-inline-guide');
  document.dispatchEvent(new document.defaultView.Event('DOMContentLoaded'));
  const link=document.querySelector('#help-box a');
  assert.equal(link.getAttribute('href'),'/en/cake-pan-calculator/');
  assert.equal(link.getAttribute('lang'),'en');
  assert.equal(document.querySelector('#recipe-input').value,'Omas privates Rezept');
  document.querySelector('[data-tool-locale="de"]').click();
  assert.equal(link.getAttribute('href'),'/backform-rechner/');
  assert.equal(link.getAttribute('lang'),'de');
  document.querySelector('[data-tool-locale="en"]').click();
  assert.equal(link.getAttribute('href'),'/en/cake-pan-calculator/');
  assert.equal(document.querySelector('#help-box a'),link);
  assert.equal(document.querySelector('#recipe-input').value,'Omas privates Rezept');
 }finally{
  Object.assign(globalThis,prior);
 }
});
