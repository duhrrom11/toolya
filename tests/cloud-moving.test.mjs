import test from 'node:test';
import assert from 'node:assert/strict';
import {createMovingCloudController,validateMovingSnapshot} from '../shared/toolya/cloud-controller.mjs';
import {prepareCloudTool} from '../shared/toolya/cloud-tool-adapters.mjs';

const changed={locations:[{id:1,name:'Keller'}],boxes:[{id:2,locId:1,name:'Bücher'}]};
test('moving schema rejects malformed snapshots',()=>{
  assert.deepEqual(validateMovingSnapshot(changed),changed);
  for(const value of [null,[],{}, {locations:{},boxes:[]},{locations:[],boxes:[null]}])
    assert.throws(()=>validateMovingSnapshot(value));
});
test('moving controller confirms writes and fails closed on conflict',async()=>{
  let row=null, fail=false, writes=0;
  const client={
    auth:{async getUser(){return {data:{user:{id:'user1',is_anonymous:false}},error:null}}},
    from(){return {select(){return this},eq(){return this},async maybeSingle(){return {data:row,error:null}}}},
    async rpc(name,args){
      assert.equal(name,'toolya_save_snapshot');
      if(fail)return {data:null,error:{code:'40001',message:'conflict'}};
      writes++;row={data:args.p_data,revision:writes};
      return {data:[row],error:null};
    }
  };
  const adapter=await prepareCloudTool({client,tool:'umzugskisten-inventar',storage:{getItem(){return null}}});
  assert.deepEqual(adapter.controller.snapshot(),{locations:[],boxes:[]});
  await adapter.saveMoving(changed);
  assert.deepEqual(adapter.controller.snapshot(),changed);
  fail=true;
  await assert.rejects(adapter.saveMoving(changed));
  assert.equal(adapter.controller.ready,false);
  assert.equal(writes,1);
});
test('moving controller rejects writes before load',async()=>{
  const controller=createMovingCloudController({read:async()=>({exists:false,revision:null,data:null}),save:async()=>{throw Error('unexpected')}});
  await assert.rejects(controller.replace(changed));
});
