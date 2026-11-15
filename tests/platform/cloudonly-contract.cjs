// Isolated CloudOnly contract: no network, accounts, or production records.
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{
 const mod=await import(pathToFileURL(path.resolve('shared/toolya/cloud-controller.mjs')).href);
 const calls=[];
 let remote=null,rev=null;
 const repository={
  async read(){return remote===null?{exists:false,data:null,revision:null}:{exists:true,data:structuredClone(remote),revision:rev}},
  async save(data,expected){
   calls.push({data:structuredClone(data),expected});
   if(expected!==rev)throw Error('Cloud revision conflict');
   rev=rev===null?1:rev+1;remote=structuredClone(data);
   return {revision:rev,data:structuredClone(remote)};
  }
 };
 const c=mod.createCloudController({repository,validate:data=>{
  assert(data&&Array.isArray(data.entries));return data;
 },initial:{entries:[]}});
 assert.equal(c.ready,false);
 await assert.rejects(c.replace({entries:[]}),/noch nicht geladen/);
 await c.load();assert.equal(c.ready,true);
 await c.mutate(s=>{s.entries.push({id:1});});
 assert.equal(c.revision,1);assert.equal(calls[0].expected,null);
 assert.deepEqual(c.snapshot().entries,[{id:1}]);
 const unchanged=await c.checkRemote();
 assert.deepEqual(unchanged,{changed:false,remoteRevision:1,localRevision:1});
 remote={entries:[{id:2}]};rev=2; // Simulate another device, no real user data.
 const changed=await c.checkRemote();
 assert.deepEqual(changed,{changed:true,remoteRevision:2,localRevision:1});
 assert.deepEqual(c.snapshot().entries,[{id:1}],'remote check must not silently overwrite local cache');
 await assert.rejects(c.replace({entries:[{id:3}]}),/Cloud revision conflict/);
 assert.equal(c.ready,false,'conflict must block further writes until explicit reload');
 await c.load();assert.deepEqual(c.snapshot().entries,[{id:2}]);
 const first=c.snapshot();first.entries.push({id:999});
 assert.deepEqual(c.snapshot().entries,[{id:1}],'read cache must be cloned');
 await assert.rejects(c.replace({entries:[]},{expectedRevision:0}),/Datenstand/);
 assert.equal(c.revision,2);
 repository.save=async()=>{throw Error('write outcome unknown')};
 await assert.rejects(c.replace({entries:[]}),/write outcome unknown/);
 assert.equal(c.ready,false,'unknown writes fail closed');
 await assert.rejects(c.replace({entries:[]}),/noch nicht geladen/);
 console.log('PASS: isolated CloudOnly CAS, cloned snapshots and fail-closed uncertain writes');
})().catch(e=>{console.error(e);process.exitCode=1});
