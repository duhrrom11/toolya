// Isolated real Chromium check: never opens the live site or loads Supabase.
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.cwd();
const i18nextBundle=path.join(root,"node_modules/i18next/dist/umd/i18next.min.js");
const cdn="https://cdn.jsdelivr.net/npm/i18next@23.16.8/dist/umd/i18next.min.js";
const html=`<!doctype html><html lang="de"><head><title>Parkplatz-Merker</title></head><body>
<header class="b3-header"><div class="b3-tool-title"><h1>Parkplatz-Merker</h1><p>Parken verwalten</p></div></header>
<div id="timerStatus">Kein aktiver Parkschein-Timer</div>\n<button onclick="saveLocation()">Standort speichern</button>\n<span class="toolya-auth-loading" data-tool-en="Checking your sign-in…">Wir prüfen deine Anmeldung …</span>\n<a href="/umzugskisten/" data-tool-en="Step-by-step guide to moving boxes">Schritt-für-Schritt-Anleitung für Umzugskisten</a>
<script src="${cdn}"></script>\n<script type="module" src="/shared/toolya/i18n/tool-entry.mjs"></script>
</body></html>`;
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname==='/tools/parking/index.html'||pathname==='/tools/moving/index.html'){res.writeHead(200,{'content-type':'text/html; charset=utf-8'}).end(html);return;}
 if(!pathname.startsWith('/shared/toolya/i18n/')){res.writeHead(404).end();return;}
 const file=path.resolve(root,'.'+pathname);
 if(!file.startsWith(path.join(root,'shared','toolya','i18n')+path.sep)){res.writeHead(403).end();return;}
 try{res.writeHead(200,{'content-type':'text/javascript'}).end(fs.readFileSync(file));}
 catch{res.writeHead(404).end();}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  for(const tool of ['parking','moving'])for(const mode of ['loaded','cdn-blocked']){
   const context=await browser.newContext();
   // Prevent any external traffic and avoid production auth/storage.
   await context.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:')?route.continue():route.abort());
   await context.addInitScript({content:'window.__lastDialog=null;window.alert=message=>{window.__lastDialog=message};'});
   await context.route(cdn,route=>mode==='loaded'?route.fulfill({status:200,contentType:'text/javascript',body:fs.readFileSync(i18nextBundle)}):route.abort());
   const page=await context.newPage();
   const errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/tools/'+tool+'/index.html');
   await page.locator('.ty-tool-language [data-tool-locale="en"]').click();
   if(tool==='parking')assert.equal(await page.locator('#timerStatus').textContent(),'No active parking timer',mode+' English status');
   assert.equal(await page.locator('.ty-tool-language [data-tool-locale="en"]').getAttribute('aria-pressed'),'true');
   if(tool==='moving'){
    assert.equal(await page.locator('button[onclick="saveLocation()"]' ).textContent(),'Save location',mode+' moving selector');
    assert.equal(await page.locator('.toolya-auth-loading').textContent(),'Checking your sign-in…',mode+' moving sign-in text');
    assert.equal(await page.locator('a[href="/umzugskisten/"]').textContent(),'Step-by-step guide to moving boxes',mode+' moving guide');
   }
   const translated=await page.evaluate(()=>{window.alert('Anmeldung fehlgeschlagen: Error 401');return window.__lastDialog;});
   assert.equal(translated,'Sign-in failed: Error 401',mode+' dialog prefix');
   if(tool==='moving'){
    const dialog=await page.evaluate(()=>{window.alert('Diese Kiste ist einem aktiven Umzug zugeordnet. Bitte den Umzug erst abschließen.');return window.__lastDialog;});
    assert.equal(dialog,'This box is assigned to an active move. Finish the move first.',mode+' moving dialog');
   }
   await page.locator('.ty-tool-language [data-tool-locale="de"]').click();
   if(tool==='parking')assert.equal(await page.locator('#timerStatus').textContent(),'Kein aktiver Parkschein-Timer',mode+' German status');
   if(tool==='moving'){
    assert.equal(await page.locator('button[onclick="saveLocation()"]' ).textContent(),'Standort speichern',mode+' German moving selector');
    assert.equal(await page.locator('.toolya-auth-loading').textContent(),'Wir prüfen deine Anmeldung …',mode+' German sign-in text');
    assert.equal(await page.locator('a[href="/umzugskisten/"]').textContent(),'Schritt-für-Schritt-Anleitung für Umzugskisten',mode+' German guide');
   }
   assert.equal(await page.locator('.ty-tool-language [data-tool-locale="de"]').getAttribute('aria-pressed'),'true');
   assert.deepEqual(errors,[],mode+' page errors');
   if(mode==='loaded')assert.equal(await page.evaluate(()=>window.i18next.isInitialized),true);
   else assert.equal(await page.evaluate(()=>typeof window.i18next),'undefined');
   await context.close();
   console.log('PASS '+tool+' DE/EN/DE and prefix translation ('+mode+')');
  }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;server.close();});
