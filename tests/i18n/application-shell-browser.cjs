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
 const results=[];
 for(const width of [320,768]){
  const context=await browser.newContext({viewport:{width,height:850},reducedMotion:'reduce',serviceWorkers:'block'});
  await context.route('**/*',route=>{
   const request=route.request(),target=new URL(request.url());
   return target.origin===origin&&['GET','HEAD'].includes(request.method())?route.continue():route.abort();
  });
  for(const entry of cases){
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
     const selector=lang=>'[data-'+entry.family+'-locale="'+lang+'"]';
     for(const lang of ['de','en','de']){
      const button=page.locator(selector(lang)).first();
      await button.click({timeout:4000});
      await page.waitForFunction(({key,lang})=>globalThis[key]===lang,{key:entry.global,lang},{timeout:4000});
      assert.equal(await button.getAttribute('aria-pressed'),'true');
      assert.equal(await page.evaluate(()=>localStorage.getItem('synthetic-private-note')),'Meine private Notiz');
      const layout=await page.evaluate(()=>({lang:document.documentElement.lang,overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth)}));
      row.checks.push({lang,title:await page.title(),...layout});
     }
    }
   }catch(e){row.errors.push(String(e.message).slice(0,500))}
   finally{await page.close()}
  }
  await context.close();
 }
 const dir=path.join(ROOT,'test-results/i18n-quality');
 fs.mkdirSync(dir,{recursive:true});
 const report={schemaVersion:1,scope:'Unauthenticated read-only shell smoke; not full runtime acceptance',results};
 fs.writeFileSync(path.join(dir,'application-shell-report.json'),JSON.stringify(report,null,2)+'\n');
 console.log('APPLICATION SHELL REVIEW '+JSON.stringify({views:results.length,passed:results.filter(r=>!r.errors.length).length,review:results.filter(r=>r.errors.length).map(r=>({path:r.path,width:r.width,errors:r.errors}))}));
}
run().catch(err=>{console.error(err);process.exitCode=1;}).finally(async()=>{
 if(browser)await browser.close().catch(()=>{});
 if(server)await new Promise(resolve=>server.close(resolve));
});
