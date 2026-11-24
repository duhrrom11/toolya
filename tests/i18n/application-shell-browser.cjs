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
    q.then=(resolve,reject)=>Promise.resolve(operation==='select'?{data:single?null:[],error:null,count:0}:denied(table,operation)).then(resolve,reject);
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

 for(const width of [320,768]){
  const context=await browser.newContext({viewport:{width,height:850},reducedMotion:'reduce',serviceWorkers:'block'});
  await context.route('**/*',route=>{
   const request=route.request(),target=new URL(request.url());
   if(authenticated&&target.origin===origin&&target.pathname==='/assets/vendor/supabase-2.57.0.js')return route.fulfill({status:200,contentType:'text/javascript',body:mock});
   return target.origin===origin&&['GET','HEAD'].includes(request.method())?route.continue():route.abort();
  });
  for(const entry of cases.filter(entry=>!authenticated||entry.family==='wishes'||entry.family==='dashboard')){
   const page=await context.newPage();
   const row={path:entry.path,width,checks:[],errors:[],pageErrors:[]};
   results.push(row);
   page.on('pageerror',e=>row.pageErrors.push(e.message.slice(0,300)));
   try{
    await page.addInitScript(()=>{localStorage.setItem('synthetic-private-note','Meine private Notiz');});
    await page.goto(origin+entry.path+'?lang=de',{waitUntil:'domcontentloaded',timeout:15000});
    if(new URL(page.url()).pathname!==entry.path)throw Error('Protected route redirected; authenticated fixture required');
    if(entry.print){
     for(const lang of ['de','en']){
      await page.goto(origin+entry.path+'?lang='+lang,{waitUntil:'domcontentloaded',timeout:15000});
      await page.waitForFunction(({key,lang})=>globalThis[key]===lang,{key:entry.global,lang},{timeout:4000});
      row.checks.push({lang,title:await page.title()});
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
      const layout=await page.evaluate(()=>({lang:document.documentElement.lang,overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth)}));
      row.checks.push({lang,title:await page.title(),...layout});
     }
    }
   }catch(e){row.errors.push(String(e.message).slice(0,500))}
   finally{
    if(authenticated){row.fixture=await page.evaluate(()=>window.__toolyaAuthFixture||null).catch(()=>null);if(row.fixture?.writes.length)row.errors.push('Unexpected attempted write in read-only fixture');if(!row.fixture?.auth)row.errors.push('Synthetic authentication not observed');}
    await page.close()
   }
  }
  await context.close();
 }
 const dir=path.join(ROOT,'test-results/i18n-quality');
 fs.mkdirSync(dir,{recursive:true});
 const report={schemaVersion:1,scope:authenticated?'Authenticated read-only synthetic shell smoke; not full functional acceptance':'Unauthenticated read-only shell smoke; not full runtime acceptance',results};
 fs.writeFileSync(path.join(dir,authenticated?'authenticated-shell-report.json':'application-shell-report.json'),JSON.stringify(report,null,2)+'\n');
 console.log((authenticated?'AUTHENTICATED SHELL REVIEW ':'APPLICATION SHELL REVIEW ')+JSON.stringify({views:results.length,passed:results.filter(r=>!r.errors.length).length,review:results.filter(r=>r.errors.length).map(r=>({path:r.path,width:r.width,errors:r.errors}))}));
}
run().catch(err=>{console.error(err);process.exitCode=1;}).finally(async()=>{
 if(browser)await browser.close().catch(()=>{});
 if(server)await new Promise(resolve=>server.close(resolve));
});
