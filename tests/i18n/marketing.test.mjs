import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'../..');
const read=path=>readFileSync(resolve(root,path),'utf8');
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
 '/en/toolya-dashboard/':'en/toolya-dashboard/index.html',
 '/en/mascots.html':'en/mascots.html'
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
 ['toolya-dashboard/index.html','/en/toolya-dashboard/'],
 ['mascots.html','/en/mascots.html']
];

test('English public pages have unique correct canonical URLs and language',()=>{
  for(const [url,path] of Object.entries(pages)){
    const html=read(path);
    assert.match(html,/<html lang="en">/);
    assert.ok(html.includes('href="https://toolya.app'+url+'"'),'missing canonical '+path);
    assert.ok(html.includes('content="noindex,follow"'),'English pages stay noindex until UI translation');
    assert.ok(html.includes('data-set-locale="de"'),'missing DE return');
    assert.ok(html.includes('class="brand"') || html.includes('class="b3-hub-logo ty-info-brand"'),'missing brand');
    assert.ok(!html.includes('brand-symbol'),'no invented brand mark');
    assert.ok(html.includes('name="description"'),'missing description');
    assert.ok(html.includes('name="twitter:card"'),'missing Twitter card');
    assert.ok(html.includes('"inLanguage":"en"'),'missing language in schema');
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

test('English guides link only to existing non-localized tool app paths and warn users',()=>{
  const apps=['moving','housemates','plants','baking'];
  for(const [i,slug] of Object.keys(pages).slice(1,5).entries()){
    const html=read(pages[slug]);
    assert.ok(html.includes('href="/tools/'+apps[i]+'/index.html"'),slug);
    assert.ok(html.includes('currently has a German interface'),slug);
  }
});

test('no Supabase or mascot preference changes introduced',()=>{
  for(const path of Object.values(pages)){
    const html=read(path);
    assert.doesNotMatch(html,/service_role|supabaseClient|signInWithPassword|helferlein-toolya-preferences-v1/i);
  }
});

test('new English guides preserve reciprocal DE/EN links and use real application routes',()=>{
 const guides=[{"slug":"vehicle-costs","de":"autokosten","app":"car","appFile":"index.html"},{"slug":"household-budget","de":"haushaltsbuch","app":"budget","appFile":"index.html"},{"slug":"digital-estate","de":"digitaler-nachlass","app":"estate","appFile":"index.html"},{"slug":"parking-spot","de":"parkplatz-merker","app":"parking","appFile":"index.html"},{"slug":"pet-health","de":"tiergesundheit","app":"pet-health","appFile":"index.html"},{"slug":"lent-items","de":"verliehene-dinge","app":"loans","appFile":"index.html"},{"slug":"meter-readings","de":"zaehlerstaende","app":"meters","appFile":"index.html"},{"slug":"publish-amazon-wishlist","de":"amazon-wunschliste-veroeffentlichen","app":"wishes","appFile":"public.html#profile"}];
 for(const guide of guides){
  const html=read('en/'+guide.slug+'/index.html');
  const de=read(guide.de+'/index.html');
  assert.ok(html.includes('href="/'+guide.de+'/" lang="de"')||html.includes('href="/'+guide.de+'/" data-set-locale="de"'),guide.slug);
  assert.ok(de.includes('href="/en/'+guide.slug+'/" lang="en"'),guide.de);
  assert.ok(html.includes('href="/tools/'+guide.app+'/'+guide.appFile+'"'),guide.slug);
  assert.ok(html.includes('noindex,follow'),'keep unreleased English guide out of index');
 }
});

test('English mascot gallery keeps all outfit values and loads matching translated emotion labels',()=>{
 const de=read('mascots.html'),en=read('en/mascots.html');
 const src=read('shared/toolya/gallery.mjs');
 for(let index=0;index<16;index++){
  assert.ok(de.includes('<option value="'+index+'">'),index);
  assert.ok(en.includes('<option value="'+index+'">'),index);
 }
 assert.ok(src.includes("emotionLabelsForLocale(document.documentElement.lang)"),'gallery uses document language');
 assert.match(en,/src="\/shared\/toolya\/gallery\.mjs"/);
 assert.match(en,/href="\/shared\/toolya\/info-pages\.css"/);
});

test('English legal and privacy notices preserve disclosure details and reciprocal language links',()=>{
 for(const path of ['legal.html','privacy.html']){
  const en=read('en/'+path),de=read(path);
  assert.match(en,/<html lang="en">/);
  assert.ok(en.includes('href="https://toolya.app/en/'+path+'"'));
  assert.ok(en.includes('href="/'+path+'"'));
  assert.ok(de.includes('href="/en/'+path+'" lang="en"'));
  assert.match(en,/noindex,follow/);
 }
 assert.match(read('en/legal.html'),/Section 5 DDG/);
 assert.match(read('en/privacy.html'),/Google Analytics 4/);
 assert.match(read('en/privacy.html'),/duhrrom-21/);
});

test('English dashboard CTA preserves opt-in language and public legal footers link to EN translations',()=>{
 const page=read('en/toolya-dashboard/index.html');
 const helper=read('shared/toolya/i18n/marketing.mjs');
 assert.ok(page.includes('data-tool-link href="/dashboard/"'));
 assert.ok(helper.includes("url.pathname === '/dashboard/'"));
 for(const p of Object.values(pages)){
  const html=read(p);
  if(p==='en/mascots.html')continue;
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
