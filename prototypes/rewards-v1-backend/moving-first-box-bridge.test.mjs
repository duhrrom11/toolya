import test from 'node:test';
import assert from 'node:assert/strict';
import {isQualifiedFirstBoxTransition,grantAfterVerifiedMovingSave,PILOT_EVENT} from './moving-first-box-bridge.mjs';
const uid='c8fa7231-1b1a-4268-826e-c85e761370f0';
const before=()=>({locations:[{id:7,name:'Keller'}],boxes:[]});
const after=()=>({locations:[{id:7,name:'Keller'}],boxes:[{
  id:1791234567890,locId:7,name:'Bücher',desc:'',value:0,tag:'Standard',photo:''
}]});
const receipt=()=>({toolId:PILOT_EVENT.toolId,persistenceConfirmed:true,isMigration:false,previousRevision:2,persistedRevision:3});
const context=()=>({authenticatedUserId:uid,before:before(),after:after(),receipt:receipt()});
test('valid first saved box transition is eligible',()=>assert.equal(isQualifiedFirstBoxTransition(before(),after(),receipt()),true));
test('no grant when save confirmation missing',()=>assert.equal(isQualifiedFirstBoxTransition(before(),after(),{...receipt(),persistenceConfirmed:false}),false));
test('no grant on migration, even if snapshot appears new',()=>assert.equal(isQualifiedFirstBoxTransition(before(),after(),{...receipt(),isMigration:true}),false));
test('no grant on non-contiguous or client-zero revision',()=>{
  assert.equal(isQualifiedFirstBoxTransition(before(),after(),{...receipt(),persistedRevision:7}),false);
  assert.equal(isQualifiedFirstBoxTransition(before(),after(),{...receipt(),previousRevision:0,persistedRevision:1}),false);
});
test('no grant on editing or deleting existing box',()=>{
  const old=after();const newer=after();newer.boxes[0].name='Andere Kiste';
  assert.equal(isQualifiedFirstBoxTransition(old,newer,receipt()),false);
  assert.equal(isQualifiedFirstBoxTransition(old,before(),receipt()),false);
});
test('no grant on invalid name or missing location',()=>{
  const bad=after();bad.boxes[0].name='  ';
  assert.equal(isQualifiedFirstBoxTransition(before(),bad,receipt()),false);
  const orphan=after();orphan.boxes[0].locId=99;
  assert.equal(isQualifiedFirstBoxTransition(before(),orphan,receipt()),false);
});
test('changing locations concurrently is not accepted',()=>{
  const bad=after();bad.locations[0].name='Anderer Standort';
  assert.equal(isQualifiedFirstBoxTransition(before(),bad,receipt()),false);
});
test('only minimal metadata is sent to internal grant',async()=>{
  let received;const res=await grantAfterVerifiedMovingSave(context(),async p=>{received=p;return {granted:true}});
  assert.deepEqual(res,{status:'granted'});
  assert.deepEqual(received,{authenticatedUserId:uid,eventType:PILOT_EVENT.eventType});
  assert.ok(!Object.hasOwn(received,'box'));
});
test('repeated grant is reported as already granted, not granted twice',async()=>{
  let n=0;const save=async()=>({granted:++n===1});
  assert.deepEqual(await grantAfterVerifiedMovingSave(context(),save),{status:'granted'});
  assert.deepEqual(await grantAfterVerifiedMovingSave(context(),save),{status:'already-granted'});
});
test('invalid transition does not invoke callback',async()=>{
  let invoked=false;const c=context();c.receipt.isMigration=true;
  const response=await grantAfterVerifiedMovingSave(c,async()=>{invoked=true;return {granted:true}});
  assert.deepEqual(response,{status:'ineligible'});assert.equal(invoked,false);
});
test('reject client-submitted fake account ID and invalid grant result',async()=>{
  const c=context();c.authenticatedUserId='different-user';
  assert.deepEqual(await grantAfterVerifiedMovingSave(c,async()=>({granted:true})),{status:'ineligible'});
  await assert.rejects(grantAfterVerifiedMovingSave(context(),async()=>({status:'ok'})),/invalid receipt/);
});
