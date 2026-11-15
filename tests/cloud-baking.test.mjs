import test from 'node:test';
import assert from 'node:assert/strict';
import {validateBakingSnapshot,createBakingCloudController} from '../shared/toolya/cloud-controller.mjs';
import {prepareCloudTool} from '../shared/toolya/cloud-tool-adapters.mjs';
const snapshot={recipes:[{name:'Kuchen',text:'Mehl',factor:1,note:''}]};
test('baking validates recipe collection',()=>{
  assert.deepEqual(validateBakingSnapshot(snapshot),snapshot);
  for(const bad of [null,{},[],{recipes:[null]},{recipes:'bad'}])
    assert.throws(()=>validateBakingSnapshot(bad));
});
test('baking confirms saves and blocks conflicts',async()=>{
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
  const adapter=await prepareCloudTool({client,tool:'backform-umrechner',storage:{getItem(){return null}}});
  await adapter.saveBaking(snapshot);
  assert.deepEqual(adapter.controller.snapshot(),snapshot);
  fail=true;await assert.rejects(adapter.saveBaking(snapshot));
  assert.equal(adapter.controller.ready,false);
  assert.equal(writes,1);
});
test('baking refuses writes before loading',async()=>{
  const controller=createBakingCloudController({read:async()=>({exists:false,data:null,revision:null}),save:async()=>{throw Error('unexpected')}});
  await assert.rejects(controller.replace(snapshot),/Cloud-Daten noch nicht geladen/);
});
