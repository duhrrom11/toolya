import test from 'node:test';
import assert from 'node:assert/strict';
import {attemptFirstBoxWithRewards} from './moving-first-box-ui-adapter.mjs';
const box=()=>({name:'Bücher',desc:'',value:0,tag:'Standard',barcode:'',expiry:'',lentTo:'',subItems:[],photo:''});
const req=()=>({expectedRevision:2,locationId:7,box:box()});
const fixture=()=>{
 let rev=2, snapshot={locations:[{id:7,name:'Keller'}],boxes:[]},loads=0,invalidated=false,submitted=0,identity='current-account';
 const controller={
   get ready(){return !invalidated},
   get revision(){return rev},
   snapshot(){return structuredClone(snapshot)},
   async load(){loads++;rev=3;snapshot.boxes=[{id:123,locId:7,name:'Bücher'}]},
   invalidate(){invalidated=true}
 };
 const submit=async()=>{submitted++;return {saved:true,revision:3,boxId:123,reward:{granted:true,xp:20,kp:10}}};
 return {controller,submit,verifySameAccount:async()=>identity,initialAccountId:'current-account',request:req(),meta:()=>({loads,submitted,invalidated}),changeAccount:()=>{identity='other'}};
};
test('successful Edge save reloads cloud revision before rendering reward',async()=>{
 const f=fixture(),r=await attemptFirstBoxWithRewards(f);
 assert.deepEqual(r,{handled:true,status:'saved',rewardGranted:true});
 assert.equal(f.controller.revision,3);assert.equal(f.meta().loads,1);
});
test('no pilot attempt for existing boxes',async()=>{
 const f=fixture();f.controller.snapshot=()=>({locations:[{id:7,name:'Keller'}],boxes:[{id:1}]});
 assert.equal((await attemptFirstBoxWithRewards(f)).handled,false);assert.equal(f.meta().submitted,0);
});
test('stale expected revision rejected before network call',async()=>{
 const f=fixture();f.request.expectedRevision=1;
 await assert.rejects(attemptFirstBoxWithRewards(f),/stale/);assert.equal(f.meta().submitted,0);
});
test('unexpected location rejected',async()=>{
 const f=fixture();f.request.locationId=9;
 await assert.rejects(attemptFirstBoxWithRewards(f),/Location/);assert.equal(f.meta().submitted,0);
});
test('a lost response never causes fallback write or blind retry',async()=>{
 const f=fixture();f.submit=async()=>{throw Error('Network closed after commit')};
 assert.deepEqual(await attemptFirstBoxWithRewards(f),{handled:true,status:'uncertain'});
 assert.equal(f.meta().loads,1);
});
test('malformed response forces reconciliation, no reward toast',async()=>{
 const f=fixture();f.submit=async()=>({saved:true,revision:999,boxId:123,reward:{granted:true}});
 assert.equal((await attemptFirstBoxWithRewards(f)).status,'uncertain');
 assert.equal(f.meta().loads,1);
});
test('account change is rejected before submit',async()=>{
 const f=fixture();f.changeAccount();
 await assert.rejects(attemptFirstBoxWithRewards(f),/Account changed/);assert.equal(f.meta().submitted,0);
});
test('a changed account after server commit yields uncertainty, never reward',async()=>{
 const f=fixture();f.submit=async()=>{f.changeAccount();return {saved:true,revision:3,boxId:123,reward:{granted:true}}};
 assert.equal((await attemptFirstBoxWithRewards(f)).status,'uncertain');
 assert.equal(f.meta().invalidated,true);
});
