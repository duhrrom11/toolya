import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'../..');
const read=path=>readFileSync(resolve(root,path),'utf8');
const origin='https://toolya.app';
function assertEnglishToolLinks(html, target, expectedCount, guide){
  const expected=new URL(target,origin);
  const links=[...html.matchAll(/<a\b[^>]*\bdata-tool-link\s+href="([^"]+)"/g)];
  assert.equal(links.length,expectedCount,guide);
  for(const [,href] of links){
    const url=new URL(href,origin);
    assert.equal(url.origin,expected.origin,guide);
    assert.equal(url.pathname,expected.pathname,guide);
    assert.equal(url.search,'?lang=en',guide);
    assert.equal(url.hash,expected.hash,guide);
  }
}
const pages={
 '/en/':'en/index.html',
 '/en/moving-boxes/':'en/moving-boxes/index.html',
 '/en/roommate-organizer/':'en/roommate-organizer/index.html',
 '/en/plant-care/':'en/plant-care/index.html',
 '/en/cake-pan-calculator/':'en/cake-pan-calculator/index.html',
 '/en/vehicle-costs/':'en/vehicle-costs/index.html',
 '/en/household-budget/':'en/household-budget/index.html',
 '/en/digital-estate/':'en/digital-estate/index.html',
 '/en/parking-spot/':'en/parking-spot/index.html',
 '/en/pet-health/':'en/pet-health/index.html',
 '/en/lent-items/':'en/lent-items/index.html',
 '/en/meter-readings/':'en/meter-readings/index.html',
 '/en/publish-amazon-wishlist/':'en/publish-amazon-wishlist/index.html',
 '/en/toolya-dashboard/':'en/toolya-dashboard/index.html'
};
const pairs=[
 ['index.html','/en/'],
 ['umzugskisten/index.html','/en/moving-boxes/'],
 ['wg-organisator/index.html','/en/roommate-organizer/'],
 ['pflanzenpflege/index.html','/en/plant-care/'],
 ['backform-rechner/index.html','/en/cake-pan-calculator/'],
 ['autokosten/index.html','/en/vehicle-costs/'],
 ['haushaltsbuch/index.html','/en/household-budget/'],
 ['digitaler-nachlass/index.html','/en/digital-estate/'],
 ['parkplatz-merker/index.html','/en/parking-spot/'],
 ['tiergesundheit/index.html','/en/pet-health/'],
 ['verliehene-dinge/index.html','/en/lent-items/'],
 ['zaehlerstaende/index.html','/en/meter-readings/'],
 ['amazon-wunschliste-veroeffentlichen/index.html','/en/publish-amazon-wishlist/'],
 ['toolya-dashboard/index.html','/en/toolya-dashboard/']
];

test('English public pages have unique correct canonical URLs and language',()=>{
  for(const [url,path] of Object.entries(pages)){
    const html=read(path);
    assert.match(html,/<html lang="en"(?:\s[^>]*)?>/);
    assert.ok(html.includes('href="https://toolya.app'+url+'"'),'missing canonical '+path);
    assert.ok(html.includes('content="index,follow"'),'released English pages are indexable');
    assert.ok(html.includes('data-set-locale="de"'),'missing DE return');
    assert.ok(html.includes('class="brand"') || html.includes('class="b3-hub-logo ty-info-brand"') || (path==='en/index.html' && html.includes('class="b3-hub-logo"')),'missing brand');
    assert.ok(!html.includes('brand-symbol'),'no invented brand mark');
    assert.ok(html.includes('name="description"'),'missing description');
    assert.ok(html.includes('name="twitter:card"'),'missing Twitter card');
    assert.ok(/"inLanguage"\s*:\s*"en"/.test(html),'missing language in schema');
  }
});

test('German pages have exact matching English navigation and no auto-redirects',()=>{
  for(const [path,en] of pairs){
    const html=read(path);
    assert.ok(html.includes('href="'+en+'" lang="en" hreflang="en" data-set-locale="en"'),path);
    assert.ok(html.includes('/shared/toolya/i18n/switcher.mjs'),path);
    assert.ok(html.includes('/shared/toolya/i18n/switcher.css'),path);
    assert.ok(!html.includes('location.replace("/en/")'),path);
  }
});

test('English guides link to existing applications and disclose partial translation',()=>{
  const apps=['moving','housemates','plants','baking'];
  for(const [i,slug] of Object.keys(pages).slice(1,5).entries()){
    const html=read(pages[slug]);
    assertEnglishToolLinks(html,'/tools/'+apps[i]+'/index.html',apps[i]==='baking'?1:2,slug);
    assert.ok(html.includes('offers a partial English interface'),slug);
  }
});

test('no Supabase or mascot preference changes introduced',()=>{
  for(const path of Object.values(pages)){
    const html=read(path);
    assert.doesNotMatch(html,/service_role|helferlein-toolya-preferences-v1/i);
    if(path==='en/index.html'){
      assert.match(html,/supabaseClient\.auth\.signInWithPassword/);
      const de=read('index.html');
      for(const method of ['signInWithPassword','signUp','signOut','resetPasswordForEmail','updateUser','getUser']){
        const calls=s=>[...s.matchAll(new RegExp('\\.auth\\.'+method+'\\(', 'g'))].length;
        assert.equal(calls(html),calls(de),method);
      }
    }else assert.doesNotMatch(html,/supabaseClient|signInWithPassword/i);
  }
});

test('new English guides preserve reciprocal DE/EN links and use real application routes',()=>{
 const guides=[{"slug":"vehicle-costs","de":"autokosten","app":"car","appFile":"index.html"},{"slug":"household-budget","de":"haushaltsbuch","app":"budget","appFile":"index.html"},{"slug":"digital-estate","de":"digitaler-nachlass","app":"estate","appFile":"index.html"},{"slug":"parking-spot","de":"parkplatz-merker","app":"parking","appFile":"index.html"},{"slug":"pet-health","de":"tiergesundheit","app":"pet-health","appFile":"index.html"},{"slug":"lent-items","de":"verliehene-dinge","app":"loans","appFile":"index.html"},{"slug":"meter-readings","de":"zaehlerstaende","app":"meters","appFile":"index.html"},{"slug":"publish-amazon-wishlist","de":"amazon-wunschliste-veroeffentlichen","app":"wishes","appFile":"public.html#profile"}];
 for(const guide of guides){
  const html=read('en/'+guide.slug+'/index.html');
  const de=read(guide.de+'/index.html');
  assert.ok(html.includes('href="/'+guide.de+'/" lang="de"')||html.includes('href="/'+guide.de+'/" data-set-locale="de"'),guide.slug);
  assert.ok(de.includes('href="/en/'+guide.slug+'/" lang="en"'),guide.de);
  assertEnglishToolLinks(html,'/tools/'+guide.app+'/'+guide.appFile,2,guide.slug);
  assert.ok(html.includes('content="index,follow"'),'released English guide is indexable');
 }
});

test('retired galleries remain absent and bilingual mascot preferences live in settings',()=>{
 for(const path of ['mascots.html','en/mascots.html'])assert.equal(existsSync(resolve(root,path)),false,path);
 const platform=read('shared/toolya/platform.mjs');
 assert.ok(platform.includes("homeCopy('Maskottchen',\"Mascots\")"));
 assert.ok(platform.includes('toolya-appearance'));
 assert.ok(platform.includes('toolya-preferences'));
 assert.doesNotMatch(read('sitemap.xml'),/mascots\.html/);
});

test('English legal and privacy notices preserve disclosure details and reciprocal language links',()=>{
 for(const path of ['legal.html','privacy.html']){
  const en=read('en/'+path),de=read(path);
  assert.match(en,/<html lang="en">/);
  assert.ok(en.includes('href="https://toolya.app/en/'+path+'"'));
  assert.ok(en.includes('href="/'+path+'"'));
  assert.ok(de.includes('href="/en/'+path+'" lang="en"'));
  assert.match(en,/content="index,follow"/);
 }
 assert.match(read('en/legal.html'),/Section 5 DDG/);
 assert.match(read('en/privacy.html'),/Google Analytics 4/);
 assert.match(read('en/privacy.html'),/duhrrom-21/);
});

test('English dashboard CTA preserves opt-in language and public legal footers link to EN translations',()=>{
 const page=read('en/toolya-dashboard/index.html');
 const helper=read('shared/toolya/i18n/marketing.mjs');
 assertEnglishToolLinks(page,'/dashboard/',2,'Dashboard guide');
 assert.ok(helper.includes("url.pathname === '/dashboard/'"));
 for(const p of Object.values(pages)){
  const html=read(p);
  assert.doesNotMatch(html,/Privacy information \(German\)|Legal notice \(German\)/);
 }
});

test('offline and unknown URLs offer German and English messages with correct page language',()=>{
 for(const path of ['404.html','offline.html']){
  const html=read(path);
  assert.ok(html.includes('id="ty-message-de"'));
  assert.ok(html.includes('id="ty-message-en"'));
  assert.ok(html.includes('document.documentElement.lang=chosen'));
  assert.ok(html.includes('toolya-locale-v1'));
 }
 const redir=read('tools/wishes/index.html');
 assert.match(redir,/location\.search \+ location\.hash/);
});
