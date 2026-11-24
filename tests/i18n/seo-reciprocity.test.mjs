import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {parseHTML} from 'linkedom';

const root=resolve(import.meta.dirname,'../..');
const config=JSON.parse(readFileSync(resolve(root,'docs/i18n/quality-config.json'),'utf8'));
const expectedUrl=path=>'https://toolya.app/'+(path.endsWith('index.html')?path.slice(0,-10):path);
const sourcePage=path=>parseHTML(readFileSync(resolve(root,path),'utf8')).document;

test('all 16 public DE/EN marketing pages have reciprocal hreflang and self-canonical links',()=>{
 assert.equal(config.marketingPages.length,16);
 for(const pair of config.marketingPages){
  const expected={de:expectedUrl(pair.de),en:expectedUrl(pair.en)};
  for(const locale of ['de','en']){
   const path=pair[locale],document=sourcePage(path);
   assert.equal(document.documentElement.getAttribute('lang'),locale,path+' language');
   const canonical=document.head.querySelector('link[rel="canonical"]');
   assert.ok(canonical,path+' missing canonical');
   assert.equal(canonical.getAttribute('href'),expected[locale],path+' canonical');
   for(const lang of ['de','en']){
    const matching=[...document.head.querySelectorAll('link[rel="alternate"][hreflang]')]
      .filter(el=>el.getAttribute('hreflang')===lang);
    assert.equal(matching.length,1,path+' missing or duplicate '+lang+' hreflang');
    assert.equal(matching[0].getAttribute('href'),expected[lang],path+' wrong '+lang+' URL');
   }
   assert.ok(document.head.querySelector('meta[property="og:title"]'),path+' OG title');
   assert.ok(document.head.querySelector('meta[property="og:description"]'),path+' OG description');
   if(locale==='en'){
    const robots=document.head.querySelector('meta[name="robots"]')?.getAttribute('content')||'';
    assert.match(robots,/\bnoindex\b/i,path+' must retain noindex before release');
   }
  }
 }
});
