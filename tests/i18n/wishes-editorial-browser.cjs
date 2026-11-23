'use strict';

// Synthetic, local-only public Wishlist translation browser smoke.
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

 for(const width of [320,390]){
  const context=await browser.newContext({viewport:{width,height:850},reducedMotion:'reduce'});
  const external=[];
  await context.route('**/*',route=>{
   const request=route.request();
   let target;try{target=new URL(request.url())}catch{return route.abort()}
   if(target.origin!==origin||!['GET','HEAD'].includes(request.method())){
    external.push({url:target.hostname,method:request.method()});
    return route.abort();
   }
   return route.continue();
  });
  await context.addInitScript(()=>{
   localStorage.setItem('toolya-locale-v1','en');
   localStorage.setItem('synthetic-private-wish','Meine private Notiz');
   localStorage.setItem('helferlein-toolya-preferences-v1',
    JSON.stringify({character:'purple',motion:'off'}));
  });
  const page=await context.newPage();
  try{
   await page.goto(origin+'/tools/wishes/public.html?lang=en',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.documentElement.lang==='en'&&
    !!document.querySelector('.ty-wishes-language')&&
    document.querySelector('p[data-wishes-copy]')?.textContent.includes('Discover public Amazon'),{timeout:20000});
   assert.equal(await page.title(),'Find Amazon wish lists by name – no link needed | Toolya');
   assert.equal(await page.locator('p[data-wishes-copy]').first().textContent(),translation);
   assert.equal(await page.locator('.wish-creation-adnote').textContent(),legalEnglish);
   // Some author-owned elements are removed or replaced when the wishlist app
   // initializes. The DOM unit test verifies all 28 source nodes and mappings.
   const activeEditorial=await page.locator('p[data-wishes-copy],span[data-wishes-copy]').count();
   assert.ok(activeEditorial>=24&&activeEditorial<=28,
    'Expected the majority of author-owned copy to remain visible, got '+activeEditorial);
   const before=await page.evaluate(()=>({
    private:localStorage.getItem('synthetic-private-wish'),
    mascot:localStorage.getItem('helferlein-toolya-preferences-v1')
   }));
   await page.locator('[data-wishes-locale="de"]').click();
   await page.waitForFunction(()=>document.documentElement.lang==='de');
   assert.equal(await page.locator('p[data-wishes-copy]').first().textContent(),source);
   assert.equal(await page.locator('.wish-creation-adnote').textContent(),legalGerman);
   await page.locator('[data-wishes-locale="en"]').click();
   await page.waitForFunction(()=>document.documentElement.lang==='en');
   assert.equal(await page.locator('.wish-creation-adnote').textContent(),legalEnglish);
   const after=await page.evaluate(()=>({
    private:localStorage.getItem('synthetic-private-wish'),
    mascot:localStorage.getItem('helferlein-toolya-preferences-v1')
   }));
   assert.deepEqual(after,before,'switching language must not modify saved user/mascot data');
   assert.ok(external.every(x=>x.url!=='127.0.0.1'&&x.url!=='localhost'),
    'external API requests must be blocked before network access');
   console.log('PASS: public Wishlist editorial English/German at '+width+'px, locally isolated');
  }finally{
   await context.close();
  }
 }
}

run().catch(err=>{console.error(err);process.exitCode=1;}).finally(async()=>{
 if(browser)await browser.close().catch(()=>{});
 if(server)await new Promise(resolve=>server.close(resolve));
});
