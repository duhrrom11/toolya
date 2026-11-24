import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseHTML} from 'linkedom';
import {applyToolInterfaceLocale} from '../../shared/toolya/i18n/interface.mjs';

test('baking Amazon equipment link text is reversible while preserving icon and link',()=>{
 const source=readFileSync(new URL('../../tools/baking/index.html',import.meta.url),'utf8');
 assert.match(source,/<span data-tool-en="Search Amazon">Amazon Suche<\/span>\s*<i data-lucide="external-link"/);
 const {document}=parseHTML('<html><body><main id="main-content">'+
  '<a href="https://www.amazon.de/s?k=backzubehoer" target="_blank">'+
  '<span data-tool-en="Search Amazon">Amazon Suche</span> <i data-lucide="external-link"></i></a></main></body></html>');
 const link=document.querySelector('a'),icon=link.querySelector('i'),span=link.querySelector('span');
 for(const [locale,expected] of [['en','Search Amazon'],['de','Amazon Suche'],['en','Search Amazon']]){
  applyToolInterfaceLocale(document,'baking',locale);
  assert.equal(span.textContent,expected);
  assert.equal(link.getAttribute('href'),'https://www.amazon.de/s?k=backzubehoer');
  assert.equal(link.querySelector('i'),icon);
 }
});
