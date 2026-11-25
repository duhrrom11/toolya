'use strict';

// Read-only shell acceptance across remaining application routes; not authenticated E2E.
// Production API traffic is blocked before it leaves Chromium.
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');

const ROOT=path.resolve(__dirname,'../..');
const MIME={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8',
 '.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
 '.json':'application/json','.png':'image/png','.webp':'image/webp',
 '.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2'};
let server,browser;
const source='Öffentliche Amazon-Wunschlisten entdecken – ohne vorher nach dem Link fragen zu müssen.';
const translation='Discover public Amazon wish lists without having to ask for a link.';
const legalGerman='Werbung · Amazon-Partnerlinks. Als Amazon-Partner verdiene ich an qualifizierten Verkäufen.';
const legalEnglish='Advertisement · Amazon affiliate links. As an Amazon Associate, I earn from qualifying purchases.';

async function run(){
 server=http.createServer((req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
  let requestPath;
  try{requestPath=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);}
  catch{res.writeHead(400);return res.end();}
  if(requestPath.includes('\\')||requestPath.split('/').includes('..')){
   res.writeHead(403);return res.end();
  }
  const filename=path.resolve(ROOT,'.'+requestPath);
  if(!filename.startsWith(ROOT+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(filename,(error,data)=>{
   if(error){res.writeHead(404);return res.end();}
   res.writeHead(200,{'Content-Type':MIME[path.extname(filename)]||'application/octet-stream',
    'Cache-Control':'no-store'});
   if(req.method==='HEAD')res.end();else res.end(data);
  });
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({headless:true,
  executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
  args:['--no-sandbox']});


 const cases=[
 ...['public','dashboard','collection','discover','feed','planner','profile','occasions','reservations','assistant','bookmarks','cockpit','gift-analytics','gift-tasks','notifications','report','social'].map(name=>({path:'/tools/wishes/'+name+'.html',family:'wishes',global:'__toolyaWishesLocale'})),
 ...['index','heirs','handover','print-key'].map(name=>({path:'/tools/estate/'+name+'.html',family:'estate',global:'__toolyaEstateLocale',print:name==='print-key'})),
 {path:'/dashboard/index.html',family:'dashboard',global:'__toolyaDashboardLocale'},
 ...['index','wishlist-finder'].map(name=>({path:'/admin-stats-dashboard/'+name+'.html',family:'admin',global:'__toolyaAdminLocale'}))
 ];
 const authenticated=process.env.TOOLYA_AUTH_SHELL==='1';
 const results=[];
 // A read-only synthetic account, served only inside Chromium. No real API requests.
 const mock=`
 (() => {
  const uid='11111111-1111-4111-8111-111111111111';
  const user={id:uid,email:'fixture@example.invalid',is_anonymous:false,email_confirmed_at:'2026-01-01T00:00:00Z',app_metadata:{provider:'email'},user_metadata:{}};
  const session={user,access_token:'isolated-fixture',refresh_token:'isolated-fixture'};
  const collection={id:'22222222-2222-4222-8222-222222222222',user_id:uid,title:'Meine synthetische Sammlung',description:'Private Testbeschreibung bleibt unverändert',visibility:'public',archived:false,icon:'🎁'};
  const profile={user_id:uid,handle:'fixture_profile',display_name:'Synthetisches Profil',bio:'Meine Testbiografie bleibt unverändert'};
  const occasion={id:'33333333-3333-4333-8333-333333333333',user_id:uid,title:'Anlass speichern',person_name:'Meine private Person',occasion_date:'2099-11-24',repeats_yearly:false,reminder_days:14,notes:'Änderungen speichern'};
  const calls={auth:0,reads:[],writes:[]};window.__toolyaAuthFixture=calls;
  const ok=data=>({data,error:null});
  const denied=(table,operation)=>{calls.writes.push({table,operation});return {data:null,error:{message:'Read-only browser fixture'}}};
  const client={
   auth:{async getUser(){calls.auth++;return ok({user})},async getSession(){calls.auth++;return ok({session})},onAuthStateChange(fn){queueMicrotask(()=>fn('INITIAL_SESSION',session));return {data:{subscription:{unsubscribe(){}}}}}},
   from(table){
    calls.reads.push(table);
    let operation='select',single=false;
    const q={};
    for(const method of ['select','eq','neq','is','in','order','limit','range','gt','gte','lt','lte','or','not','filter','match','ilike','like'])q[method]=()=>q;
    for(const method of ['insert','update','delete','upsert'])q[method]=()=>{operation=method;return q};
    q.single=q.maybeSingle=()=>{single=true;return q};
    q.then=(resolve,reject)=>{
     const route=location.pathname;
     const rows=route.endsWith('/occasions.html')&&table==='wishlist_occasions'?[occasion]:
      route.endsWith('/collection.html')&&table==='wishlist_lists'?[collection]:
      route.endsWith('/profile.html')&&table==='wishlist_profiles'?[profile]:
      route.endsWith('/profile.html')&&table==='wishlist_lists'?[collection]:[];
     return Promise.resolve(operation==='select'?{data:single?rows[0]||null:rows,error:null,count:rows.length}:denied(table,operation)).then(resolve,reject);
    };
    return q;
   },
   async rpc(name){calls.reads.push('rpc:'+name);return ok([])},
   functions:{async invoke(name){return {data:null,error:{message:'Offline fixture: '+name}}}},
   channel(){const q={on:()=>q,subscribe:()=>q,unsubscribe:()=>q};return q},
   removeChannel(){}
  };
  window.supabase={createClient:()=>client};
 })();
 `;

 for(const width of [320,375,768]){
  const context=await browser.newContext({viewport:{width,height:850},reducedMotion:'reduce',serviceWorkers:'block'});
  let adminReads=0;
  await context.route('**/*',route=>{
   const request=route.request(),target=new URL(request.url());
   if(authenticated&&target.origin===origin&&target.pathname==='/assets/vendor/supabase-2.57.0.js')return route.fulfill({status:200,contentType:'text/javascript',body:mock});
   if(authenticated&&target.pathname==='/functions/v1/admin-stats'&&target.hostname==='yheogmeaosuigyaxkwth.supabase.co'&&request.method()==='GET'){
    adminReads++;
    return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({sources:[],metrics:[],seoTrends:[{source:'google',points:[{date:'2026-11-24',clicks:1234,impressions:2345}]}]})});
   }
   if(authenticated&&target.pathname==='/functions/v1/admin-stats'&&target.hostname==='yheogmeaosuigyaxkwth.supabase.co'&&request.method()==='OPTIONS')return route.fulfill({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-methods':'GET','access-control-allow-headers':'authorization,apikey'}});
   return target.origin===origin&&['GET','HEAD'].includes(request.method())?route.continue():route.abort();
  });
  for(const entry of cases.filter(entry=>!authenticated||entry.family==='wishes'||entry.family==='dashboard'||entry.path==='/admin-stats-dashboard/index.html')){
   const page=await context.newPage();
   const row={path:entry.path,width,checks:[],errors:[],pageErrors:[]};
   results.push(row);
   page.on('pageerror',e=>row.pageErrors.push(e.message.slice(0,300)));
   try{
    await page.addInitScript(()=>{localStorage.setItem('synthetic-private-note','Meine private Notiz');});
    const occasion=authenticated&&entry.path==='/tools/wishes/occasions.html';
    const admin=authenticated&&entry.path==='/admin-stats-dashboard/index.html';
    const collection=authenticated&&entry.path==='/tools/wishes/collection.html';
    const profile=authenticated&&entry.path==='/tools/wishes/profile.html';
    const query=collection?'&id=22222222-2222-4222-8222-222222222222':profile?'&handle=fixture_profile':'';
    await page.goto(origin+entry.path+'?lang=de'+query,{waitUntil:'domcontentloaded',timeout:15000});
    if(admin)await page.waitForFunction(()=>!document.getElementById('panel')?.hidden&&!!document.querySelector('#seo-google svg'),null,{timeout:6000});
    const adminReadsBefore=adminReads;
    if(occasion){await page.locator('#events article button').first().click({timeout:6000});await page.locator('#notes').fill('Unveränderter privater Entwurf');}
    if(collection)await page.waitForFunction(()=>!document.getElementById('collection')?.hidden&&document.getElementById('title')?.textContent==='Meine synthetische Sammlung',null,{timeout:6000});
    if(profile)await page.waitForFunction(()=>!document.getElementById('profile')?.hidden&&document.getElementById('name')?.textContent==='Synthetisches Profil',null,{timeout:6000});
    if(authenticated&&entry.path==='/tools/wishes/dashboard.html')await page.waitForFunction(()=>!document.getElementById('content')?.hidden&&!!document.querySelector('#taskReminders .empty')&&!!document.querySelector('#tasks .empty'),null,{timeout:6000});
    if(new URL(page.url()).pathname!==entry.path)throw Error('Protected route redirected; authenticated fixture required');
    if(entry.print){
     for(const lang of ['de','en']){
      await page.goto(origin+entry.path+'?lang='+lang,{waitUntil:'domcontentloaded',timeout:15000});
      await page.waitForFunction(({key,lang})=>globalThis[key]===lang,{key:entry.global,lang},{timeout:4000});
      assert.equal(await page.locator('html').getAttribute('lang'),lang,'print document language');
      row.checks.push({lang,title:await page.title(),documentLang:lang});
     }
    }else{
     // Dashboard also stores the active locale on <html>; target actual controls only.
     const selector=lang=>'button[data-'+entry.family+'-locale="'+lang+'"]';
     for(const lang of ['de','en','de']){
      const button=page.locator(selector(lang)).first();
      await button.click({timeout:4000});
      await page.waitForFunction(({key,lang})=>globalThis[key]===lang,{key:entry.global,lang},{timeout:4000});
      assert.equal(await button.getAttribute('aria-pressed'),'true');
      assert.equal(await page.locator(selector(lang==='en'?'de':'en')).first().getAttribute('aria-pressed'),'false');
      assert.equal(await page.evaluate(()=>localStorage.getItem('synthetic-private-note')),'Meine private Notiz');
      if(collection){assert.equal(await page.locator('#title').textContent(),'Meine synthetische Sammlung');assert.equal(await page.locator('#description').textContent(),'Private Testbeschreibung bleibt unverändert');}
      if(profile){assert.equal(await page.locator('#name').textContent(),'Synthetisches Profil');assert.equal(await page.locator('#bio').textContent(),'Meine Testbiografie bleibt unverändert');}
      if(occasion){
       const en=lang==='en';
       await page.waitForFunction(({en})=>document.getElementById('formTitle')?.textContent===(en?'✏️ Edit occasion':'✏️ Anlass bearbeiten'),{en});
       assert.equal(await page.locator('#events h3').textContent(),'Anlass speichern · Meine private Person');
       assert.equal(await page.locator('#events article p').textContent(),'Änderungen speichern');
       assert.equal(await page.locator('#title').inputValue(),'Anlass speichern');
       assert.equal(await page.locator('#notes').inputValue(),'Unveränderter privater Entwurf');
       assert.equal(await page.locator('#date').inputValue(),'2099-11-24');
       assert.equal(await page.locator('#events time').getAttribute('datetime'),'2099-11-24');
       assert.match(await page.locator('#events time').textContent(),en?/24 November 2099/:/24\. November 2099/);
       assert.equal(await page.locator('#save').textContent(),en?'Save changes':'Änderungen speichern');
       assert.equal(await page.locator('#events .badge').textContent(),en?'📅 One-off':'📅 Einmalig');
       assert.equal(await page.locator('#events article button').last().textContent(),en?'🗑️ Delete':'🗑️ Löschen');
      }
      if(admin){
       const en=lang==='en';
       await page.waitForFunction(({en})=>document.querySelector('#seo-google h4')?.textContent===(en?'Clicks':'Klicks'),{en});
       assert.equal(await page.locator('#seo-google .seo-legend').textContent(),en?'Clicks and impressions · separate scales':'Klicks und Impressionen · getrennte Skalen');
       assert.equal(await page.locator('#seo-google svg').first().getAttribute('aria-label'),en?'Clicks from 24/11/2026 to 24/11/2026':'Klicks vom 24.11.2026 bis 24.11.2026');
       assert.match(await page.locator('#seo-google svg title').first().textContent(),en?/1,234 Clicks/:/1\.234 Klicks/);
       assert.equal(await page.locator('#pages').textContent(),en?'No recorded data for this period yet.':'Noch keine erfassten Daten für diesen Zeitraum.');
       assert.equal(await page.locator('#trend').textContent(),en?'No daily values available yet.':'Noch keine Tageswerte verfügbar.');
       assert.equal(adminReads,adminReadsBefore,'locale switch must not refetch statistics');
      }
      const layout=await page.evaluate(()=>({lang:document.documentElement.lang,overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth)}));
      assert.equal(layout.lang,lang,'document language must follow selected language');
      assert.ok(layout.overflow<=1,'horizontal overflow: '+layout.overflow+'px');
      row.checks.push({lang,title:await page.title(),documentLang:layout.lang,overflow:layout.overflow});
     }
    }
   }catch(e){row.errors.push(String(e.message).slice(0,500))}
   finally{
    if(row.pageErrors.length)row.errors.push('Uncaught JavaScript errors: '+row.pageErrors.join(' | '));
    if(authenticated){row.fixture=await page.evaluate(()=>window.__toolyaAuthFixture||null).catch(()=>null);if(row.fixture?.writes.length)row.errors.push('Unexpected attempted write in read-only fixture');if(entry.path==='/tools/wishes/profile.html'){if(!row.fixture?.reads.includes('wishlist_profiles'))row.errors.push('Public profile read not observed');}else if(!row.fixture?.auth)row.errors.push('Synthetic authentication not observed');}
    await page.close()
   }
  }
  await context.close();
 }
 const dir=path.join(ROOT,'test-results/i18n-quality');
 fs.mkdirSync(dir,{recursive:true});
 const report={schemaVersion:1,scope:authenticated?'Authenticated read-only synthetic shell smoke; not full functional acceptance':'Unauthenticated read-only shell smoke; not full runtime acceptance',results};
 fs.writeFileSync(path.join(dir,authenticated?'authenticated-shell-report.json':'application-shell-report.json'),JSON.stringify(report,null,2)+'\n');
 const failures=results.filter(r=>r.errors.length);
 console.log((authenticated?'AUTHENTICATED SHELL REVIEW ':'APPLICATION SHELL REVIEW ')+JSON.stringify({views:results.length,passed:results.length-failures.length,review:failures.map(r=>({path:r.path,width:r.width,errors:r.errors}))}));
 assert.equal(failures.length,0,'application shell failures; see JSON report for individual routes');
}
run().catch(err=>{console.error(err);process.exitCode=1;}).finally(async()=>{
 if(browser)await browser.close().catch(()=>{});
 if(server)await new Promise(resolve=>server.close(resolve));
});
