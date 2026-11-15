import test from 'node:test';
import assert from 'node:assert/strict';
import {validateLoansSnapshot,createLoansCloudController} from '../shared/toolya/cloud-controller.mjs';
import {prepareCloudTool} from '../shared/toolya/cloud-tool-adapters.mjs';

const empty={items:[],contacts:[],inventory:[]};
const filled={items:[{id:1,title:'Bohrer',person:'Anna'}],contacts:[{id:2,name:'Anna'}],inventory:[{id:3,title:'Bohrer'}]};
test('loans snapshot requires all three object arrays',()=>{
  assert.deepEqual(validateLoansSnapshot(filled),filled);
  for(const invalid of [null,[],{}, {items:[],contacts:[]},{items:[null],contacts:[],inventory:[]},{items:[],contacts:{},inventory:[]}])
    assert.throws(()=>validateLoansSnapshot(invalid));
});
test('loans cloud saves only confirmed revisions and invalidates on conflicts',async()=>{
  let row=null,fail=false,writes=0,signedIn=true;
  const client={
    auth:{async getUser(){return {data:{user:signedIn?{id:'fixture-user',is_anonymous:false}:null},error:null}}},
    from(){return {select(){return this},eq(){return this},async maybeSingle(){return {data:row,error:null}}}},
    async rpc(name,args){
      assert.equal(name,'toolya_save_snapshot');
      if(fail)return {data:null,error:{code:'40001',message:'conflict'}};
      row={user_id:'fixture-user',tool:'verliehene-gegenstaende-verwalten',data:args.p_data,revision:++writes};
      return {data:[row],error:null};
    }
  };
  const adapter=await prepareCloudTool({client,tool:'verliehene-gegenstaende-verwalten',storage:{getItem(){return null}}});
  assert.deepEqual(adapter.controller.snapshot(),empty);
  await adapter.saveLoans(filled);
  assert.deepEqual(adapter.controller.snapshot(),filled);
  assert.equal(writes,1);
  fail=true;
  await assert.rejects(adapter.saveLoans(empty),/Cloud-Konflikt/);
  assert.equal(adapter.controller.ready,false);
  assert.equal(writes,1);
  signedIn=false;
  await assert.rejects(adapter.saveLoans(filled));
});
test('loans cloud controller refuses writes before loading',async()=>{
  const controller=createLoansCloudController({read:async()=>({exists:false,data:null,revision:null}),save:async()=>{throw Error('unexpected')}});
  await assert.rejects(controller.replace(filled),/Cloud-Daten noch nicht geladen/);
});
