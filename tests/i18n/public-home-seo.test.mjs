import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mountPublicHome} from '../../shared/toolya/i18n/public-home.mjs';

function fixture(lang='en', search='?utm_source=news&utm_campaign=spring&utm_content=bad%20value') {
 const items=[{dataset:{i18nMarketing:'Haushaltsbuch'},textContent:lang==='en'?'Household budget':'Haushaltsbuch'},{dataset:{i18nMarketing:'WG-Organisator'},textContent:'Roommate organiser'},{dataset:{i18nMarketing:'unmapped'},textContent:'unchanged'}];
 const handlers={}; const link={dataset:{setLocale:'de'},addEventListener(type,handler){handlers[type]=handler;}};
 const links=[{href:'https://toolya.app/tools/baking/index.html#calc'},{href:'https://example.org/tools/test'}];
 const writes=[];
 const doc={documentElement:{lang},querySelectorAll(selector){return ({'[data-i18n-marketing]':items,'[data-set-locale]':[link],'a[data-tool-link]':links})[selector]||[];}};
 const location=new URL('https://toolya.app/en/'+search);
 return {items,links,handlers,writes,link,doc,location,storage:{setItem(...args){writes.push(args);}}};
}
test('public homepage translates exact reviewed copy only and persists explicit language selection',()=>{
 const f=fixture(); mountPublicHome(f.doc,f.location,f.storage);
 assert.equal(f.items[0].textContent,'Household budget');
 assert.equal(f.items[1].textContent,'Roommate organizer');
 assert.equal(f.items[2].textContent,'unchanged');
 assert.deepEqual(f.writes,[]);
 f.handlers.click(); assert.deepEqual(f.writes,[['toolya-locale-v1','de']]);
 f.link.dataset.setLocale='invalid';f.handlers.click();assert.equal(f.writes.length,1);
 assert.equal(f.links[0].href,'/tools/baking/index.html?lang=en&utm_source=news&utm_campaign=spring#calc');
 assert.equal(f.links[1].href,'https://example.org/tools/test');
});
test('German homepage text remains unchanged and blocked storage is tolerated',()=>{
 const f=fixture('de');mountPublicHome(f.doc,f.location,{setItem(){throw new Error('blocked');}});
 assert.equal(f.items[0].textContent,'Haushaltsbuch');assert.doesNotThrow(()=>f.handlers.click());
});
const read=path=>readFileSync(new URL('../../'+path,import.meta.url),'utf8');
test('homepage preloads match responsive image, existing application scripts stay present and JSON-LD parses',()=>{
 for(const path of ['index.html','en/index.html']){
  const h=read(path);
  const preload=h.match(/<link rel="preload" as="image" imagesrcset="([^"]+)" imagesizes="([^"]+)"/);
  const hero=h.match(/<img class="ty-hero-art"[\s\S]*?>/)[0];
  assert.ok(preload,path);
  assert.ok(hero.includes('srcset="'+preload[1]+'"'));
  assert.ok(hero.includes('sizes="'+preload[2]+'"'));
  assert.match(hero,/fetchpriority="high"/);
  assert.doesNotMatch(hero,/loading="lazy"/);
  assert.match(h,/public-home\.mjs/);
  assert.doesNotMatch(h,/i18next@23\.16\.8/);
  assert.match(h,/supabase-client\.js/);
  assert.match(h,/platform\.mjs/);
  assert.match(h,/home\.mjs/);
  assert.match(h,/hreflang="x-default" href="https:\/\/toolya\.app\//);
  for(const m of h.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g))assert.doesNotThrow(()=>JSON.parse(m[1]));
 }
});
test('sitemap has reciprocal alternates, self references and an existing fallback for all 16 bilingual pairs',()=>{
 const sitemap=read('sitemap.xml');
 const entries=[...sitemap.matchAll(/<url><loc>([^<]+)<\/loc>([\s\S]*?)<\/url>/g)];
 assert.equal(entries.length,33);
 const grouped=new Map(entries.map(([,url,body])=>[url,Object.fromEntries([...body.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map(([,lang,href])=>[lang,href]))]));
 let count=0;
 for(const [url,links] of grouped){
  if(!links.de)continue;
  count++;assert.ok(url===links.de||url===links.en);
  assert.equal(links['x-default'],links.de);
  assert.deepEqual(grouped.get(links.de),links);
  assert.deepEqual(grouped.get(links.en),links);
 }
 assert.equal(count,32);
});
