// Two real isolated Chromium contexts; only local HTTP and in-memory snapshots.
// Never visits production or sends Supabase requests.
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve('.');
const mime={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html'};
const snapshots=new Map();
let disconnected=false,requests=0;
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1');
 if(url.pathname==='/api/snapshot'){
  requests++;
  if(disconnected)return res.writeHead(503).end('offline');
  const user=req.headers['x-test-user'];
  if(!['account-a','account-b'].includes(user))return res.writeHead(401).end('unauthorized');
  const current=snapshots.get(user);
  if(req.method==='GET')return res.writeHead(200,{'content-type':'application/json'}).end(JSON.stringify(snapshots.get(user)||{exists:false,revision:null,data:null}));
  if(req.method==='POST'){
   let body='';for await(const chunk of req)body+=chunk;
   const payload=JSON.parse(body),expected=payload.expectedRevision;
   const current=snapshots.get(user); // CAS is evaluated after receiving the entire request.
   if((current?.revision??null)!==expected)return res.writeHead(409).end('conflict');
   const next={exists:true,revision:(current?.revision??0)+1,data:payload.data};
   snapshots.set(user,next);
   return res.writeHead(200,{'content-type':'application/json'}).end(JSON.stringify(next));
  }
  return res.writeHead(405).end();
 }
 if(url.pathname==='/test-connect'){
  res.writeHead(200,{'content-type':'text/html'}).end('<!doctype html><html><body><main></main></body></html>');return;
 }
 const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return res.writeHead(404).end();
 res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'}).end(fs.readFileSync(file));
});
const delay=()=>new Promise(resolve=>setTimeout(resolve,80));
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||chromium.executablePath(),args:['--no-sandbox']});
 const contexts=[],pages=[];
 try{
  for(let i=0;i<2;i++){
   const context=await browser.newContext();contexts.push(context);
   await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
   const page=await context.newPage();pages.push(page);await page.goto(origin+'/test-connect');
   await page.evaluate(async()=>{
    const {createCloudController}=await import('/shared/toolya/cloud-controller.mjs');
    const {mountConnectPanel}=await import('/shared/toolya/connect-panel.mjs');
    let user='account-a';
    const call=async(method,body)=>{
     const response=await fetch('/api/snapshot',{method,headers:{'x-test-user':user,'content-type':'application/json'},body:body?JSON.stringify(body):undefined});
     if(!response.ok)throw Error(response.status===409?'revision conflict':'offline or unauthorized');
     return response.json();
    };
    const repository={
     async read(){return call('GET')},
     async save(data,expectedRevision){return call('POST',{data,expectedRevision})}
    };
    const controller=createCloudController({repository,initial:{entries:[]},validate:s=>{if(!Array.isArray(s.entries))throw Error('invalid');return s}});
    let rendered=0,confirmed=false;
    const panel=mountConnectPanel({controller,host:document.querySelector('main'),confirmReload:()=>confirmed,onReload:()=>{rendered++}});
    window.testDevice={
     async load(){return controller.load()},
     async add(id){return controller.mutate(s=>{s.entries.push({id})})},
     async inspect(){return controller.checkRemote()},
     async state(){return {ready:controller.ready,revision:controller.revision,entries:controller.ready?controller.snapshot().entries:null,rendered}},
     switchAccount(next){user=next;controller.invalidate()},
     confirm(value){confirmed=value},
     dispose(){panel.dispose()}
    };
   });
   await page.evaluate(()=>window.testDevice.load());
  }
  const [a,b]=pages;
  await a.evaluate(()=>window.testDevice.add('from-a'));
  await b.locator('#toolya-connect-panel button').first().click();
  await assert.doesNotReject(async()=>b.locator('#toolya-connect-panel button').nth(1).waitFor({state:'visible'}));
  assert.deepEqual((await b.evaluate(()=>window.testDevice.state())).entries,[],'remote check must preserve view');
  await b.locator('#toolya-connect-panel button').nth(1).click();await delay();
  assert.equal((await b.evaluate(()=>window.testDevice.state())).rendered,0,'cancel must not load');
  await b.evaluate(()=>window.testDevice.confirm(true));
  await a.evaluate(()=>window.testDevice.add('newer-a'));
  await b.locator('#toolya-connect-panel button').nth(1).click();await delay();
  assert.equal((await b.evaluate(()=>window.testDevice.state())).rendered,0,'stale review must not load');
  await b.locator('#toolya-connect-panel button').first().click();
  await b.locator('#toolya-connect-panel button').nth(1).click();
  await b.waitForFunction(()=>window.testDevice&&document.querySelector('#toolya-connect-panel [role=status]').textContent.includes('nach Bestätigung geladen'),null,{timeout:5000}).catch(async error=>{throw Error('Connect confirmation: '+await b.locator('#toolya-connect-panel [role=status]').textContent()+'; '+error.message)});
  assert.deepEqual((await b.evaluate(()=>window.testDevice.state())).entries,[{id:'from-a'},{id:'newer-a'}]);
  await a.evaluate(()=>window.testDevice.add('third-a'));
  await assert.rejects(b.evaluate(()=>window.testDevice.add('conflict-b')),/revision conflict/);
  assert.equal((await b.evaluate(()=>window.testDevice.state())).ready,false,'conflict disables writes');
  await b.evaluate(()=>window.testDevice.load());
  disconnected=true;
  await assert.rejects(b.evaluate(()=>window.testDevice.inspect()),/offline/);
  assert.equal((await b.evaluate(()=>window.testDevice.state())).ready,false,'offline disables writes');
  disconnected=false;
  await b.evaluate(()=>window.testDevice.load());
  await b.evaluate(()=>window.testDevice.switchAccount('account-b'));
  assert.equal((await b.evaluate(()=>window.testDevice.state())).ready,false);
  await b.evaluate(()=>window.testDevice.load());
  assert.deepEqual((await b.evaluate(()=>window.testDevice.state())).entries,[],'account isolation');
  assert.deepEqual(snapshots.get('account-a').data.entries.map(x=>x.id),['from-a','newer-a','third-a']);
  assert(requests>0);
  console.log('PASS: two real Chromium contexts, manual sync, stale review, CAS, offline and account switching; no external requests');
 }finally{for(const context of contexts)await context.close().catch(()=>{});await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;server.close();});
