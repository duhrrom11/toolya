import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePetHealthSnapshot,createPetHealthCloudController} from '../shared/toolya/cloud-controller.mjs';
import {prepareCloudTool} from '../shared/toolya/cloud-tool-adapters.mjs';
const snapshot={pets:[{id:1,name:'Milo'}],events:[],meds:[]};
test('pet health validates all three collections',()=>{
  assert.deepEqual(validatePetHealthSnapshot(snapshot),snapshot);
  for(const bad of [null,{},[],{...snapshot,pets:[null]},{...snapshot,events:null},{...snapshot,meds:[false]}])
    assert.throws(()=>validatePetHealthSnapshot(bad));
});
test('pet health confirms cloud saves and fails closed on conflict',async()=>{
  let row=null,fail=false,writes=0;
  const client={
    auth:{async getUser(){return {data:{user:{id:'fixture-user',is_anonymous:false}},error:null}}},
    from(){return {select(){return this},eq(){return this},async maybeSingle(){return {data:row,error:null}}}},
    async rpc(name,args){
      assert.equal(name,'toolya_save_snapshot');
      if(fail)return {data:null,error:{code:'40001',message:'conflict'}};
      row={data:args.p_data,revision:++writes};return {data:[row],error:null};
    }
  };
  const adapter=await prepareCloudTool({client,tool:'haustier-gesundheitspass',storage:{getItem(){return null}}});
  await adapter.savePetHealth(snapshot);
  assert.deepEqual(adapter.controller.snapshot(),snapshot);
  fail=true;await assert.rejects(adapter.savePetHealth(snapshot));
  assert.equal(adapter.controller.ready,false);
  assert.equal(writes,1);
});
test('pet health rejects writes before cloud load',async()=>{
  const controller=createPetHealthCloudController({read:async()=>({exists:false,data:null,revision:null}),save:async()=>{throw Error('unexpected')}});
  await assert.rejects(controller.replace(snapshot),/Cloud-Daten noch nicht geladen/);
});
