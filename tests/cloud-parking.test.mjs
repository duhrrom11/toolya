import test from 'node:test';
import assert from 'node:assert/strict';
import {validateParkingSnapshot,createParkingCloudController} from '../shared/toolya/cloud-controller.mjs';
import {prepareCloudTool} from '../shared/toolya/cloud-tool-adapters.mjs';
const snapshot={sessions:[{id:1,desc:'Bahnhof',cost:2,gps:{lat:49.5,lng:6.4}}],activeEndTime:1000};
test('parking rejects malformed snapshots',()=>{
  assert.deepEqual(validateParkingSnapshot(snapshot),snapshot);
  for(const bad of [null,{},[],{sessions:[null]},{sessions:[{id:-1,desc:'x',cost:1}]},{sessions:[{id:1,desc:'x',cost:NaN}]}])
    assert.throws(()=>validateParkingSnapshot(bad));
});
test('parking confirms writes and invalidates after cloud conflict',async()=>{
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
  const adapter=await prepareCloudTool({client,tool:'parkplatz-merker-parkschein-timer',storage:{getItem(){return null}}});
  await adapter.saveParking(snapshot);
  assert.deepEqual(adapter.controller.snapshot(),snapshot);
  fail=true;await assert.rejects(adapter.saveParking(snapshot));
  assert.equal(adapter.controller.ready,false);
  assert.equal(writes,1);
});
test('parking cannot write before cloud load',async()=>{
  const controller=createParkingCloudController({read:async()=>({exists:false,data:null,revision:null}),save:async()=>{throw Error('unexpected')}});
  await assert.rejects(controller.replace(snapshot),/Cloud-Daten noch nicht geladen/);
});
