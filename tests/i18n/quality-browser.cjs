'use strict';

// Local-only responsive locale QA. Never connects to production services.
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');

const ROOT=path.resolve(__dirname,'../..');
const config=JSON.parse(fs.readFileSync(path.join(ROOT,'docs/i18n/quality-config.json'),'utf8'));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript',
  '.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml',
  '.woff2':'font/woff2','.json':'application/json'};
let server,browser;
const warnings=[],pages=[];

async function main(){
 server=http.createServer((req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
  let pathname;
  try{pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);}
  catch{res.writeHead(400);return res.end();}
  if(pathname.includes('\\')||pathname.split('/').some(x=>x==='..')){
   res.writeHead(403);return res.end();
  }
  let target=path.resolve(ROOT,'.'+pathname);
  if(pathname.endsWith('/'))target=path.join(target,'index.html');
  if(!target.startsWith(ROOT+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(target,(error,bytes)=>{
   if(error){res.writeHead(404);return res.end();}
   res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream',
     'Cache-Control':'no-store'});
   if(req.method==='HEAD')res.end();else res.end(bytes);
  });
 });
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({headless:true,
  executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox']});
 for(const width of [320,390]){
  const context=await browser.newContext({viewport:{width,height:812},reducedMotion:'reduce'});
  await context.addInitScript(()=>{
   if(!localStorage.getItem('toolya-locale-v1')) localStorage.setItem('toolya-locale-v1','en');
   localStorage.setItem('synthetic-private-note','Bitte privat lassen.');
   localStorage.setItem('helferlein-toolya-preferences-v1',
    JSON.stringify({character:'purple',motion:'off'}));
  });
  const blocked=[];
  await context.route('**/*',route=>{
   const request=route.request(),target=new URL(request.url());
   if(request.method()!=='GET'||target.origin!==origin){
    blocked.push({method:request.method(),host:target.host});
    return route.abort();
   }
   return route.continue();
  });
  const page=await context.newPage();
  try{
   for(const entry of config.marketingPages){
    await page.goto(origin+'/'+entry.en,{waitUntil:'networkidle'});
    // Measure after local styles, modules and two complete layout frames settle.
    await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
    const state=await page.evaluate(()=>{
      const switcher=document.querySelector('[data-set-locale="de"]');
      const r=switcher?.getBoundingClientRect();
      const visible=r&&r.width>0&&r.height>0&&getComputedStyle(switcher).visibility!=='hidden';
      return {lang:document.documentElement.lang,
        switcherVisible:!!visible,
        switcherInViewport:!!(visible&&r.left>=-1&&r.right<=innerWidth+1),
        scrollWidth:document.documentElement.scrollWidth,
        innerWidth, title:document.title,
        noindex:document.querySelector('meta[name="robots"]')?.content};
    });
    assert.equal(state.lang,'en',entry.en);
    assert.equal(state.noindex,'noindex,follow',entry.en);
    assert.equal(state.switcherVisible,true,'Language switch hidden: '+entry.en+' at '+width);
    if(!state.switcherInViewport)warnings.push({kind:'clipped-language-choice',page:entry.en,width});
    if(state.scrollWidth>state.innerWidth+2){
      warnings.push({kind:'horizontal-overflow',page:entry.en,width,
        pixels:state.scrollWidth-state.innerWidth});
    }
    pages.push({route:entry.en,width,...state});
   }
   // Actual language-switch interaction in a controlled browser context.
   await page.goto(origin+'/en/moving-boxes/index.html',{waitUntil:'domcontentloaded'});
   const before=await page.evaluate(()=>({
     note:localStorage.getItem('synthetic-private-note'),
     mascot:localStorage.getItem('helferlein-toolya-preferences-v1')
   }));
   await page.locator('[data-set-locale="de"]').first().click();
   await page.waitForFunction(()=>localStorage.getItem('toolya-locale-v1')==='de');
   const after=await page.evaluate(()=>({
     lang:localStorage.getItem('toolya-locale-v1'),
     note:localStorage.getItem('synthetic-private-note'),
     mascot:localStorage.getItem('helferlein-toolya-preferences-v1')
   }));
   assert.equal(after.lang,'de');
   assert.equal(after.note,before.note,'user-authored local data must not change');
   assert.equal(after.mascot,before.mascot,'saved mascot setting must not change');
  }finally{await context.close();}
  assert.ok(blocked.every(x=>!x.method.startsWith('POST')),
    'No network POST requests can be permitted');
 }
 const dir=path.join(ROOT,'test-results/i18n-quality');
 fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(path.join(dir,'layout-report.json'),JSON.stringify({
   schemaVersion:1,source:'isolated-local-Chromium',
   widths:[320,390],pages,warningCount:warnings.length,warnings
 },null,2)+'\n');
 console.log('PASS: '+pages.length+' local bilingual layout checks; '+warnings.length+
  ' existing visual review warnings; language choice preserves local user data and mascot.');
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{
 if(browser)await browser.close().catch(()=>{});
 if(server)await new Promise(ok=>server.close(ok));
});
