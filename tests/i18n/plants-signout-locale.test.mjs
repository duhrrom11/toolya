import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const html=readFileSync(new URL('../../tools/plants/index.html',import.meta.url),'utf8');
test('plant sign-out error fallbacks follow locale without changing diagnostics',()=>{
 const expressions=[...html.matchAll(/return alert\((\(window\.__toolyaUILocale === 'en' \? 'Sign-out failed: ' : 'Abmeldung fehlgeschlagen: '\) \+ \([^\n]+\))\);/g)].map(m=>m[1]);
 assert.equal(expressions.length,2);
 for(const expression of expressions){
  for(const [locale,prefix,fallback] of [['en','Sign-out failed: ','Unknown error'],['de','Abmeldung fehlgeschlagen: ','Unbekannter Fehler']]){
   for(const message of ['', 'Server diagnostic: E123']){
    const err={message};
    assert.equal(runInNewContext(expression,{window:{__toolyaUILocale:locale},error:err}),prefix+(message||fallback));
   }
  }
 }
});
