// Two isolated browser-like DOMs and a deterministic in-memory cloud.
// No Supabase credentials, network requests or production records.
const assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
 const {createCloudController}=await import(pathToFileURL(path.resolve('shared/toolya/cloud-controller.mjs')).href);
 const {mountConnectPanel}=await import(pathToFileURL(path.resolve('shared/toolya/connect-panel.mjs')).href);
 const server=new Map();let offline=false;
 function device(account){
  let user=account;
  const repository={
   async read(){
    if(offline)throw Error('offline');
    const current=user,entry=server.get(current);
    await tick();
    if(user!==current)throw Error('account changed');
    return entry?{exists:true,revision:entry.revision,data:structuredClone(entry.data)}:{exists:false,revision:null,data:null};
   },
   async save(data,expected){
    if(offline)throw Error('offline');
    const current=user,entry=server.get(current);
    if((entry?.revision??null)!==expected)throw Error('revision conflict');
    await tick();
    if(user!==current)throw Error('account changed');
    const next={revision:(entry?.revision??0)+1,data:structuredClone(data)};
    server.set(current,next);
    return structuredClone(next);
   }
  };
  const controller=createCloudController({repository,initial:{entries:[]},validate:value=>{
   assert(Array.isArray(value.entries));return value;
  }});
  return {controller,switchAccount(next){user=next;controller.invalidate();}};
 }
 const a=device('owner-a'),b=device('owner-a');
 await Promise.all([a.controller.load(),b.controller.load()]);
 await a.controller.mutate(s=>{s.entries.push({id:'first-device'});});
 assert.equal(a.controller.revision,1);
 assert.equal(b.controller.revision,null);
 const {document}=parseHTML('<html><body><main></main></body></html>');
 global.document=document;
 let confirmed=false,rendered=0;
 const panel=mountConnectPanel({controller:b.controller,host:document.querySelector('main'),confirmReload:()=>confirmed,onReload:()=>{rendered++}});
 const [check,reload]=document.querySelectorAll('#toolya-connect-panel button');
 check.click();await tick();
 assert.equal(reload.hidden,false);
 assert.deepEqual(b.controller.snapshot().entries,[],'remote check must not silently load');
 reload.click();await tick();
 assert.equal(rendered,0,'cancelled load');
 confirmed=true;
 await a.controller.mutate(s=>{s.entries.push({id:'later-change'});});
 reload.click();await tick();
 assert.equal(rendered,0,'stale review cannot load');
 check.click();await tick();reload.click();await tick();
 assert.equal(rendered,1);
 assert.deepEqual(b.controller.snapshot().entries,[{id:'first-device'},{id:'later-change'}]);
 await a.controller.mutate(s=>{s.entries.push({id:'third-change'});});
 await assert.rejects(b.controller.mutate(s=>{s.entries.push({id:'conflicting-change'});}),/revision conflict/);
 assert.equal(b.controller.ready,false,'CAS conflict must fail closed');
 assert.deepEqual(server.get('owner-a').data.entries.map(x=>x.id),['first-device','later-change','third-change']);
 await b.controller.load();
 offline=true;
 await assert.rejects(b.controller.checkRemote(),/offline/);
 assert.equal(b.controller.ready,false,'network failure must disable writes');
 await assert.rejects(b.controller.mutate(s=>s),/noch nicht geladen/);
 offline=false;
 await b.controller.load();
 b.switchAccount('owner-b');
 await assert.rejects(b.controller.mutate(s=>s),/noch nicht geladen/);
 await b.controller.load();
 assert.deepEqual(b.controller.snapshot().entries,[],'account switch cannot expose old data');
 assert.equal(server.get('owner-a').revision,3,'account switch cannot mutate previous account');
 panel.dispose();
 console.log('PASS: isolated two-device DOM, explicit sync, stale review, CAS, offline and account switch');
})().catch(error=>{console.error(error);process.exitCode=1});
