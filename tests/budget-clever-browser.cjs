// Real Chromium UI checks with in-memory synthetic data only. No requests to real accounts.
'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const root=path.resolve(__dirname,'..'),images=path.join(root,'tmp','budget-clever-checks');
const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html'};
const server=http.createServer((req,res)=>{
 const name=new URL(req.url,'http://127.0.0.1').pathname;
 const permitted=name==='/'?'/tests/fixtures/budget-clever.html':name;
 if(!['/tests/fixtures/budget-clever.html','/tools/budget/clever-core.js','/tools/budget/clever-ui.js','/tools/budget/clever.css'].includes(permitted)){
  res.writeHead(404).end();return
 }
 const file=path.join(root,permitted.slice(1));
 res.writeHead(200,{'Content-Type':mime[path.extname(file)],'Cache-Control':'no-store'}).end(fs.readFileSync(file));
});
async function run(){
 let browser;const contexts=[],errors=[];
 fs.mkdirSync(images,{recursive:true});
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const desktop=await browser.newContext({viewport:{width:1440,height:900},locale:'de-DE'});
  contexts.push(desktop);
  const page=await desktop.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(!r.url().startsWith(origin))errors.push('Unexpected external request '+r.url())});
  await page.goto(origin,{waitUntil:'load'});
  await page.getByRole('heading',{name:'Clever sparen'}).waitFor();
  assert.equal(await page.locator('.cs-tab').count(),4);
  assert.equal(await page.locator('.cs-metric').count(),4);
  await page.screenshot({path:path.join(images,'desktop-ueberblick.png'),fullPage:true});
  await page.getByRole('button',{name:'Einkaufen'}).click();
  assert.match(await page.locator('#cs-panel').innerText(),/Butter 250g/);
  const list=page.locator('.cs-card').filter({has:page.getByRole('heading',{name:'2 · Mein nächster Einkauf'})});
  await list.getByRole('textbox',{name:'Artikel'}).fill('Butter 250g');
  await list.getByRole('spinbutton',{name:'Anzahl'}).fill('2');
  assert.equal(await list.getByRole('spinbutton',{name:'Anzahl'}).evaluate(el=>el.validity.valid),true,'Whole item quantities must satisfy HTML form constraints');
  await list.getByRole('button',{name:'+ Zur Liste'}).click();
  await page.getByText('Bekannte Preise: 4,58',{exact:false}).waitFor({timeout:10000});
  assert.equal((await page.evaluate(()=>window.__fixture.get().cleverSparen.shopping)).length,1);
  await list.getByRole('checkbox',{name:'Butter 250g eingekauft'}).check();
  await page.getByText('Bekannte Preise: 0,00',{exact:false}).waitFor();
  await page.screenshot({path:path.join(images,'desktop-einkaufen.png'),fullPage:true});
  await page.getByRole('button',{name:'Planen'}).click();
  assert.match(await page.locator('#cs-panel').innerText(),/Kann ich mir das leisten/);
  await page.getByRole('spinbutton',{name:'Was möchtest du ausgeben? (€)'}).fill('75');
  assert.match(await page.locator('#cs-panel').innerText(),/Nach diesem Kauf blieben/);
  await page.screenshot({path:path.join(images,'desktop-planen.png'),fullPage:true});
  await page.getByRole('button',{name:'Prüfen'}).click();
  assert.match(await page.locator('#cs-panel').innerText(),/Mögliche Doppelbuchung/);
  await page.screenshot({path:path.join(images,'desktop-pruefen.png'),fullPage:true});
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent('toolya:receipt-ocr',{detail:{text:'BUTTER 250G 2,29\nSUMME 2,29'}})));
  const rows=page.locator('#cs-receipt-rows .cs-receipt-item');
  await rows.first().waitFor();
  assert.equal(await rows.count(),1);
  assert.equal(await page.evaluate(()=>window.__fixture.get().entries[0].lineItems.length),2,'OCR must not save silently');
  assert.equal(await page.evaluate(()=>window.toolyaCleverBudgetReceiptItems().length),1);
  const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:'de-DE'});
  contexts.push(mobile);
  const handset=await mobile.newPage();
  handset.on('pageerror',e=>errors.push(e.message));
  handset.on('request',r=>{if(!r.url().startsWith(origin))errors.push('Unexpected external request '+r.url())});
  await handset.goto(origin,{waitUntil:'load'});
  await handset.getByRole('heading',{name:'Clever sparen'}).waitFor();
  const width=await handset.evaluate(()=>({doc:document.documentElement.scrollWidth,view:window.innerWidth}));
  assert.ok(width.doc<=width.view+2,'Mobile overview horizontal overflow: '+JSON.stringify(width));
  await handset.screenshot({path:path.join(images,'mobil-ueberblick.png'),fullPage:true});
  await handset.getByRole('button',{name:'Einkaufen'}).click();
  assert.equal(await handset.locator('.cs-tab[aria-pressed="true"]').count(),1);
  const width2=await handset.evaluate(()=>({doc:document.documentElement.scrollWidth,view:window.innerWidth}));
  assert.ok(width2.doc<=width2.view+2,'Mobile shopping horizontal overflow: '+JSON.stringify(width2));
  await handset.screenshot({path:path.join(images,'mobil-einkaufen.png'),fullPage:true});
  assert.deepEqual(errors,[]);
  process.stdout.write('PASS: Desktop/mobile view, tabs, receipt OCR review, grocery list, budget and duplicates. No external data access. Screenshots in '+images+'\n');
 }finally{
  for(const c of contexts)await c.close().catch(()=>{});
  if(browser)await browser.close().catch(()=>{});
  if(server.listening)await new Promise(resolve=>server.close(resolve));
 }
}
run().catch(error=>{console.error(error);process.exitCode=1});
