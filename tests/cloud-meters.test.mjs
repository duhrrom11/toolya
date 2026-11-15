import test from 'node:test';
import assert from 'node:assert/strict';
import {validateMetersSnapshot,createMetersCloudController} from '../shared/toolya/cloud-controller.mjs';
import {prepareCloudTool} from '../shared/toolya/cloud-tool-adapters.mjs';
const empty={readings:[],tarifs:{}};
const filled={readings:[{id:1,type:'Strom',name:'Hauptzähler',date:'2026-11-15',value:120}],tarifs:{Strom:{priceHT:0.3}}};
test('meters rejects malformed snapshots',()=>{
  assert.deepEqual(validateMetersSnapshot(filled),filled);
  for(const bad of [null,[],{}, {readings:[]},{readings:[null],tarifs:{}},{readings:[],tarifs:[]}])
    assert.throws(()=>validateMetersSnapshot(bad));
});
test('meters confirms cloud writes and invalidates on conflicts',async()=>{
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
  const adapter=await prepareCloudTool({client,tool:'zaehlerstaende-erfassen',storage:{getItem(){return null}}});
  assert.deepEqual(adapter.controller.snapshot(),empty);
  await adapter.saveMeters(filled);
  assert.deepEqual(adapter.controller.snapshot(),filled);
  fail=true;
  await assert.rejects(adapter.saveMeters(empty));
  assert.equal(adapter.controller.ready,false);
  assert.equal(writes,1);
});
test('meters cannot write before cloud load',async()=>{
  const controller=createMetersCloudController({read:async()=>({exists:false,data:null,revision:null}),save:async()=>{throw Error('unexpected')}});
  await assert.rejects(controller.replace(filled),/Cloud-Daten noch nicht geladen/);
});
