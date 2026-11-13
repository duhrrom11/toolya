#!/usr/bin/env node
// Read-only synthetic CloudStore checks. No network client; from() throws if invoked.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('staging/shared/helferlein-cloud-store.js','utf8');
const uid='mock-user',other='other-user',tool='budget';
const pendingKey=u=>`helferlein_cloud_${tool}_${u}_pending`;
function create(seed={},signedIn=uid,sessionOverrides={}){
 const data=new Map(Object.entries(seed));let calls=0;
 const storage={getItem:k=>data.get(k)??null,setItem(k,v){data.set(k,String(v))},removeItem:k=>data.delete(k)};
 const client={auth:{
  async getUser(){calls++;throw Error('getUser must not be called offline')},
  async getSession(){return {data:{session:signedIn?{user:{id:signedIn},expires_at:Date.now()/1000+3600,...sessionOverrides}:null},error:null}}
 },from(){calls++;throw Error('network access prohibited')}};
 const window={};const ctx=vm.createContext({window,localStorage:storage,navigator:{onLine:false},Date,JSON,Object,Error});
 vm.runInContext(source,ctx);
 return {store:window.HelferleinCloudStore.createStore(client,tool),data,networkCalls:()=>calls};
}
(async()=>{
 const seed={['helferlein_cloud_owner_'+tool]:uid,[pendingKey(uid)]:JSON.stringify({synthetic:true}),[pendingKey(other)]:JSON.stringify({foreign:true})};
 const a=create(seed);
 assert.equal(await a.store.hasPending(),true);
 assert.equal((await a.store.inspect()).pending,true);
 assert.equal(a.networkCalls(),0);
 console.log('PASS offline owner pending visible without network');
 const b=create(seed,other);
 assert.equal(await b.store.hasPending(),false);
 assert.equal((await b.store.inspect()).signedOut,true);
 assert.equal(b.networkCalls(),0);
 console.log('PASS mismatched account cannot claim pending while offline');
 const c=create(seed,null);
 assert.equal((await c.store.inspect()).signedOut,true);
 assert.equal(c.networkCalls(),0);
 console.log('PASS signed-out pending remains inaccessible');
 const d=create({['helferlein_cloud_owner_'+tool]:uid});
 assert.equal(await d.store.hasPending(),false);
 assert.equal(d.networkCalls(),0);
 console.log('PASS no fabricated pending queue; no cloud requests');
 const before=Object.fromEntries(a.data);
 assert.deepEqual(Object.fromEntries(a.data),before);
 console.log('PASS inspection never writes synthetic pending data');
 const expired=create(seed,uid,{expires_at:Date.now()/1000-10});
 assert.equal((await expired.store.inspect()).signedOut,true);
 assert.equal(expired.networkCalls(),0);
 console.log('PASS expired offline session cannot access pending data');
 const malformed=create(seed,'invalid/user');
 assert.equal((await malformed.store.inspect()).signedOut,true);
 assert.equal(malformed.networkCalls(),0);
 console.log('PASS malformed offline user identity rejected');
 const wrongOwner=create({['helferlein_cloud_owner_'+tool]:other,[pendingKey(uid)]:JSON.stringify({synthetic:true})},uid);
 assert.equal((await wrongOwner.store.inspect()).signedOut,true);
 assert.equal(wrongOwner.networkCalls(),0);
 console.log('PASS owner mismatch rejects even matching user pending key');
 const corrupt=create({['helferlein_cloud_owner_'+tool]:uid,[pendingKey(uid)]:'{not-json'});
 const original=Object.fromEntries(corrupt.data);
 await assert.rejects(()=>corrupt.store.load(),/not valid JSON/);
 assert.deepEqual(Object.fromEntries(corrupt.data),original);
 assert.equal(corrupt.networkCalls(),0);
 console.log('PASS malformed pending JSON rejected without modifying storage');
 console.log('TOTAL 9');
})().catch(e=>{console.error('FAIL',e);process.exitCode=1});
