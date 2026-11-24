// Real static-page browser coverage. Offline: never contacts production services.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const root=process.cwd();
const cdn='https://cdn.jsdelivr.net/npm/i18next@23.16.8/dist/umd/i18next.min.js';
const bundle=fs.readFileSync(path.join(root,'node_modules/i18next/dist/umd/i18next.min.js'));
const pages=['/','/en/','/en/parking-spot/','/en/moving-boxes/','/en/plant-care/','/en/household-budget/'];
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 const relative=pathname.endsWith('/')?pathname+'index.html':pathname;
 const file=path.resolve(root,'.'+relative);
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{
  const type=file.endsWith('.html')?'text/html':/\.(mjs|js)$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':'application/octet-stream';
  res.writeHead(200,{'content-type':type}).end(fs.readFileSync(file));
 }catch{res.writeHead(404).end();}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 try{
  for(const mode of ['loaded','blocked']){
   const context=await browser.newContext();
   await context.route('**/*',route=>{
    const url=route.request().url();
    if(url===cdn)return mode==='loaded'?route.fulfill({status:200,contentType:'text/javascript',body:bundle}):route.abort();
    return url.startsWith(base)?route.continue():route.abort();
   });
   const page=await context.newPage();
   await page.goto(base+'/',{waitUntil:'domcontentloaded'});
   assert.equal(await page.locator('html').getAttribute('lang'),'de');
   assert.equal(await page.locator('h3[data-i18n-marketing]').count(),10);
   const english=page.locator('a[data-set-locale="en"][href="/en/"]').first();
   assert.equal(await english.count(),1,'German homepage must link to English homepage');
   await english.click();
   await page.waitForURL(base+'/en/');
   assert.equal(await page.locator('html').getAttribute('lang'),'en');
   assert.equal(await page.locator('#toolsGrid .tool-card').count(),12);
   assert.equal(await page.locator('.ty-guide-card').count(),14);
   assert.equal(await page.locator('#toolsGrid .tool-card h3').first().textContent(),'Find Amazon wish lists');
   await page.locator('[data-b3-category-filter="tiere"]').click();
   assert.equal(await page.locator('#toolsGrid .tool-card:visible').count(),1);
   await page.locator('[data-b3-category-filter="alle"]').click();
   assert.equal(await page.locator('#toolsGrid .tool-card:visible').count(),12);
   assert.equal(await page.evaluate(()=>localStorage.getItem('toolya-locale-v1')),'en');
   await page.locator('#toolSearch').fill('vaccinations');
   assert.equal(await page.locator('#toolsGrid .tool-card:visible').count(),1);
   assert.equal(await page.locator('#toolsGrid .tool-card:visible').getAttribute('data-id'),'haustier');
   await page.locator('[data-b3-category-filter="finanzen"]').click();
   assert.equal(await page.locator('#toolsGrid .tool-card:visible').count(),0);
   await page.locator('#b3-reset-filters').click();
   assert.equal(await page.locator('#toolSearch').inputValue(),'');
   assert.equal(await page.locator('#toolsGrid .tool-card:visible').count(),12);
   await page.locator('[data-id="haustier"] .fav-btn').click();
   assert.equal(await page.locator('[data-id="haustier"] .fav-btn').getAttribute('aria-pressed'),'true');
   await page.locator('[data-id="haustier"] .fav-btn').click();
   await page.locator('#settingsBtn').click();
   assert.equal(await page.locator('#settingsTitle').textContent().then(t=>t.trim()),'⚙️ Settings');
   await page.locator('#cancelSettingsBtn').click();
   await page.locator('[data-id="wishlist"] .ty-tool-link').click();
   await page.waitForURL(base+'/tools/wishes/public.html?lang=en');
   await page.goto(base+'/en/',{waitUntil:'load'});
   const german=page.locator('a[data-set-locale="de"][href="/"]').first();
   assert.equal(await german.count(),1,'English homepage must link to German homepage');
   await german.click();
   await page.waitForURL(base+'/');
   assert.equal(await page.locator('html').getAttribute('lang'),'de');
   for(const url of pages.slice(2)){
    await page.goto(base+url,{waitUntil:'domcontentloaded'});
    assert.equal(await page.locator('html').getAttribute('lang'),'en');
    const heading=page.locator('h1[data-i18n-marketing]');
    assert.equal(await heading.count(),1,'Guide heading missing: '+url);
    const original=await heading.textContent();
    if(mode==='loaded')await page.waitForFunction(()=>window.i18next?.isInitialized===true);
    assert.equal(await heading.textContent(),original,'English guide fallback changed: '+url);
    assert.equal(await page.locator('a[data-set-locale="de"]').count()>0,true,'Guide language navigation missing: '+url);
   }
   await context.close();
   console.log('PASS real homepages navigation and four guides ('+mode+')');
  }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;server.close();});
