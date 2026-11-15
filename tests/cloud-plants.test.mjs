import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePlantsSnapshot,createPlantsCloudController} from '../shared/toolya/cloud-controller.mjs';
import {prepareCloudTool} from '../shared/toolya/cloud-tool-adapters.mjs';
const snapshot={plants:[{id:1,name:'Rose'}],inventory:[],seeds:[],beetSlots:Array(16).fill(null)};
test('plants validates all persistent collections',()=>{
  assert.deepEqual(validatePlantsSnapshot(snapshot),snapshot);
  for(const bad of [null,{},[],{...snapshot,plants:[null]},{...snapshot,seeds:null},{...snapshot,beetSlots:{}}])
    assert.throws(()=>validatePlantsSnapshot(bad));
});
test('plants cloud confirms revisions and fails closed on conflict',async()=>{
  let row=null,fail=false,writes=0;
  const client={
    auth:{async getUser(){return {data:{user:{id:'fixture-user',is_anonymous:false}},error:null}}},
    from(){return {select(){return this},eq(){return this},async maybeSingle(){return {data:row,error:null}}}},
    async rpc(name,args){
      assert.equal(name,'toolya_save_snapshot');
      if(fail)return {data:null,error:{code:'40001',message:'conflict'}};
      row={data:args.p_data,revision:++writes};
      return {data:[row],error:null};
    }
  };
  const adapter=await prepareCloudTool({client,tool:'pflanzenpflege-giessplan',storage:{getItem(){return null}}});
  await adapter.savePlants(snapshot);
  assert.deepEqual(adapter.controller.snapshot(),snapshot);
  fail=true;
  await assert.rejects(adapter.savePlants(snapshot));
  assert.equal(adapter.controller.ready,false);
  assert.equal(writes,1);
});
test('plants rejects writes before loading',async()=>{
  const controller=createPlantsCloudController({read:async()=>({exists:false,data:null,revision:null}),save:async()=>{throw Error('unexpected')}});
  await assert.rejects(controller.replace(snapshot),/Cloud-Daten noch nicht geladen/);
});
