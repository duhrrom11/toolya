// Isolated real Chromium check: never opens the live site or loads Supabase.
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.cwd();
const html=`<!doctype html><html lang="de"><head><title>Parkplatz-Merker</title></head><body>
<header class="b3-header"><div class="b3-tool-title"><h1>Parkplatz-Merker</h1><p>Parken verwalten</p></div></header>
<div id="timerStatus">Kein aktiver Parkschein-Timer</div>
<script type="module" src="/shared/toolya/i18n/tool-entry.mjs"></script>
</body></html>`;
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname==='/tools/parking/index.html'){res.writeHead(200,{'content-type':'text/html'}).end(html);return;}
 if(!pathname.startsWith('/shared/toolya/i18n/')){res.writeHead(404).end();return;}
 const file=path.resolve(root,'.'+pathname);
 if(!file.startsWith(path.join(root,'shared','toolya','i18n')+path.sep)){res.writeHead(403).end();return;}
 try{res.writeHead(200,{'content-type':'text/javascript'}).end(fs.readFileSync(file));}
 catch{res.writeHead(404).end();}
});
const fakeI18next=`window.i18next={
 isInitialized:false,bundles:{},init(options){this.isInitialized=true;this.options=options;return Promise.resolve(this)},
 addResourceBundle(lang,ns,data){(this.bundles[lang]??={})[ns]={...(this.bundles[lang]?.[ns]||{}),...data}},
 getResourceBundle(lang,ns){return this.bundles[lang]?.[ns]},
 t(key,o){return this.bundles[o.lng]?.[o.ns]?.[key]??o.defaultValue}
};`;
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  for(const mode of ['loaded','cdn-blocked']){
   const context=await browser.newContext();
   // Prevent any external traffic and avoid production auth/storage.
   await context.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:')?route.continue():route.abort());
   await context.addInitScript({content:'window.__lastDialog=null;window.alert=message=>{window.__lastDialog=message};'});
   if(mode==='loaded')await context.addInitScript({content:fakeI18next});
   const page=await context.newPage();
   const errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/tools/parking/index.html');
   await page.locator('.ty-tool-language [data-tool-locale="en"]').click();
   assert.equal(await page.locator('#timerStatus').textContent(),'No active parking timer',mode+' English status');
   assert.equal(await page.locator('.ty-tool-language [data-tool-locale="en"]').getAttribute('aria-pressed'),'true');
   const translated=await page.evaluate(()=>{window.alert('Anmeldung fehlgeschlagen: Error 401');return window.__lastDialog;});
   assert.equal(translated,'Sign-in failed: Error 401',mode+' dialog prefix');
   await page.locator('.ty-tool-language [data-tool-locale="de"]').click();
   assert.equal(await page.locator('#timerStatus').textContent(),'Kein aktiver Parkschein-Timer',mode+' German status');
   assert.equal(await page.locator('.ty-tool-language [data-tool-locale="de"]').getAttribute('aria-pressed'),'true');
   assert.deepEqual(errors,[],mode+' page errors');
   if(mode==='loaded')assert.equal(await page.evaluate(()=>window.i18next.isInitialized),true);
   await context.close();
   console.log('PASS parking DE/EN/DE and prefix translation ('+mode+')');
  }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;server.close();});
