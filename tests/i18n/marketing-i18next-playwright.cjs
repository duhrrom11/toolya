// Offline Chromium regression for the shared homepage/guide i18next catalogue.
const {chromium}=require('playwright');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=process.cwd();
const bundle=fs.readFileSync(path.join(root,'node_modules/i18next/dist/umd/i18next.min.js'));
const cdn='https://cdn.jsdelivr.net/npm/i18next@23.16.8/dist/umd/i18next.min.js';
const html=locale=>'<!doctype html><html lang="'+locale+'"><body><h1 data-i18n-marketing="Alle Tools">Alle Tools</h1><p data-i18n-marketing="Diese Anleitung auf Deutsch ansehen">Diese Anleitung auf Deutsch ansehen</p><p id="user-content">Meine privaten Notizen</p><script src="'+cdn+'"></script><script type="module" src="/shared/toolya/i18n/marketing.mjs"></script></body></html>';
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname==='/'||pathname==='/de'){res.writeHead(200,{'content-type':'text/html'}).end(html(pathname==='/de'?'de':'en'));return;}
 if(!pathname.startsWith('/shared/')){res.writeHead(404).end();return;}
 const file=path.resolve(root,'.'+pathname);
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.writeHead(200,{'content-type':'text/javascript'}).end(fs.readFileSync(file));}catch{res.writeHead(404).end();}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  for(const locale of ['en','de'])for(const mode of ['loaded','blocked']){
   const context=await browser.newContext();
   await context.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:')?route.continue():route.abort());
   await context.route(cdn,route=>mode==='loaded'?route.fulfill({status:200,contentType:'text/javascript',body:bundle}):route.abort());
   const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:'+server.address().port+(locale==='de'?'/de':'/'),{waitUntil:'load'});
   await page.waitForFunction(()=>document.querySelector('[data-i18n-marketing]')?.textContent===(window.i18next&&document.documentElement.lang==='en'?'All tools':'Alle Tools'));
   await page.waitForFunction(()=>document.querySelector('p[data-i18n-marketing]')?.textContent===(window.i18next&&document.documentElement.lang==='en'?'Read this guide in German':'Diese Anleitung auf Deutsch ansehen'));
   assert.equal(await page.locator('h1').textContent(),mode==='loaded'&&locale==='en'?'All tools':'Alle Tools');
   assert.equal(await page.locator('p[data-i18n-marketing]').textContent(),mode==='loaded'&&locale==='en'?'Read this guide in German':'Diese Anleitung auf Deutsch ansehen');
   assert.equal(await page.locator('#user-content').textContent(),'Meine privaten Notizen');
   assert.deepEqual(errors,[]);
   await context.close();
  }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
