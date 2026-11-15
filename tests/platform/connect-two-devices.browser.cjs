// Real Playwright browser contexts, fake isolated HTTP cloud, no Supabase or user data.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const store=new Map();let offline=false,delayRead=false;
 const root=path.resolve('.');
 const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  res.setHeader('Access-Control-Allow-Origin','*');
  if(url.pathname==='/api/read'||url.pathname==='/api/save'){
   let body='';for await(const chunk of req)body+=chunk;
   const payload=JSON.parse(body),key=payload.user;
   if(offline){res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'offline'}));return;}
   if(url.pathname==='/api/read'){
    if(delayRead)await new Promise(resolve=>setTimeout(resolve,80));
    const row=store.get(key);
    res.setHeader('Content-Type','application/json');
    res.end(JSON.stringify(row?{exists:true,revision:row.revision,data:row.data}:{exists:false,revision:null,data:null}));return;
   }
   const row=store.get(key),current=row?.revision??null;
   if(current!==payload.expected){res.writeHead(409,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'revision conflict'}));return;}
   const next={revision:(current??0)+1,data:payload.data};
   store.set(key,next);res.setHeader('Content-Type','application/json');res.end(JSON.stringify(next));return;
  }
  if(url.pathname==='/connect-test.html'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><body></body></html>');return;}\n  const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',file.endsWith('.mjs')?'text/javascript':'text/html');
  res.end(fs.readFileSync(file));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox']});
 async function makeDevice(){
  const context=await browser.newContext(),page=await context.newPage();
  await page.goto(origin+'/connect-test.html');
  await page.evaluate(async()=>{
   const {createCloudController}=await import('/shared/toolya/cloud-controller.mjs');
   const {mountConnectPanel}=await import('/shared/toolya/connect-panel.mjs');
   let account='test-owner-a';
   const send=async(endpoint,payload)=>{
    const response=await fetch('/api/'+endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,user:account})});
    const data=await response.json();
    if(!response.ok)throw Error(data.error);
    return data;
   };
   const repository={read:()=>send('read',{}),save:(data,expected)=>send('save',{data,expected})};
   const controller=createCloudController({repository,initial:{entries:[]},validate:s=>{if(!Array.isArray(s.entries))throw Error('invalid');return s;}});
   await controller.load();
   window.__connect={controller,async switchAccount(user){account=user;controller.invalidate();await controller.load();}};
   const host=document.createElement('div');host.id='connect-test-host';document.body.prepend(host);
   window.__connect.panel=mountConnectPanel({controller,host,confirmReload:()=>window.__connect.confirmed,onReload:()=>{window.__connect.rendered++;}});
   window.__connect.confirmed=false;window.__connect.rendered=0;
  });
  return {context,page};
 }
 const a=await makeDevice(),b=await makeDevice();
 const evaluate=(device,fn,...args)=>device.page.evaluate(fn,...args);
 try{
  await evaluate(a,()=>window.__connect.controller.mutate(s=>{s.entries.push({id:'a1'});}));
  await b.page.locator('#toolya-connect-panel button').first().click();
  await b.page.waitForFunction(()=>!document.querySelector('#toolya-connect-panel button').disabled);
  assert.deepEqual(await evaluate(b,()=>window.__connect.controller.snapshot().entries),[]);
  assert.equal(await b.page.locator('#toolya-connect-panel button').nth(1).isVisible(),true);
  await b.page.locator('#toolya-connect-panel button').nth(1).click();
  assert.equal(await evaluate(b,()=>window.__connect.rendered),0,'cancel must not load');
  await evaluate(b,()=>{window.__connect.confirmed=true;});
  await evaluate(a,()=>window.__connect.controller.mutate(s=>{s.entries.push({id:'a2'});}));
  await b.page.locator('#toolya-connect-panel button').nth(1).click();
  assert.equal(await evaluate(b,()=>window.__connect.rendered),0,'stale review must not load');
  await b.page.locator('#toolya-connect-panel button').first().click();
  await b.page.waitForFunction(()=>!document.querySelector('#toolya-connect-panel button').disabled);
  await b.page.locator('#toolya-connect-panel button').nth(1).click();
  await b.page.waitForFunction(()=>window.__connect.rendered===1);
  assert.deepEqual(await evaluate(b,()=>window.__connect.controller.snapshot().entries.map(x=>x.id)),['a1','a2']);
  await evaluate(a,()=>window.__connect.controller.mutate(s=>{s.entries.push({id:'a3'});}));
  const conflict=await evaluate(b,async()=>{try{await window.__connect.controller.mutate(s=>{s.entries.push({id:'b-conflict'});});return false;}catch{return true;}});
  assert.equal(conflict,true);assert.equal(await evaluate(b,()=>window.__connect.controller.ready),false);
  assert.deepEqual(store.get('test-owner-a').data.entries.map(x=>x.id),['a1','a2','a3']);
  await evaluate(b,()=>window.__connect.controller.load());
  offline=true;
  assert.equal(await evaluate(b,async()=>{try{await window.__connect.controller.checkRemote();return false;}catch{return true;}}),true);
  assert.equal(await evaluate(b,()=>window.__connect.controller.ready),false);
  offline=false;
  await evaluate(b,()=>window.__connect.switchAccount('test-owner-b'));
  assert.deepEqual(await evaluate(b,()=>window.__connect.controller.snapshot().entries),[]);
  assert.equal(store.get('test-owner-a').revision,3);
  console.log('PASS: real two-context Playwright sync, confirmation, stale revision, conflict, offline and account switch');
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
