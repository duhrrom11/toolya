import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCloudRepository} from '../shared/toolya/cloud-repository.mjs';

function fakeClient() {
  let row=null, version=0, identity='owner', calls=0;
  const client={
    auth:{async getUser(){return {data:{user:{id:identity,is_anonymous:false}},error:null};}},
    from(table){
      assert.equal(table,'user_data');
      const filters={};
      return {
        select(){return this;},
        eq(k,v){filters[k]=v;return this;},
        async maybeSingle(){
          return {data:row&&row.user_id===filters.user_id&&row.tool===filters.tool?
            structuredClone(row):null,error:null};
        }
      };
    },
    async rpc(name,args){
      assert.equal(name,'toolya_save_snapshot');calls++;
      if(args.p_expected_revision!==version && !(args.p_expected_revision===null && !row))
        return {data:null,error:{code:'40001',message:'conflict'}};
      if(args.p_expected_revision===null && row)
        return {data:null,error:{code:'40001',message:'exists'}};
      version++;row={id:'row',user_id:identity,tool:args.p_tool,
        data:structuredClone(args.p_data),revision:version};
      return {data:[{data:structuredClone(row.data),revision:version}],error:null};
    }
  };
  return {client,setUser(id){identity=id;},get calls(){return calls;}};
}
test('RPC creates and updates with integer revisions',async()=>{
  const fake=fakeClient(),repo=createCloudRepository(fake.client,'autokosten-reifenwechsel');
  assert.equal((await repo.read()).revision,null);
  const a=await repo.save({cars:[],events:[],tires:[]},null);
  assert.equal(a.revision,1);
  assert.equal((await repo.read()).revision,1);
  const b=await repo.save({cars:[{id:1}],events:[],tires:[]},1);
  assert.equal(b.revision,2);
});
test('stale revision and duplicate insert are rejected',async()=>{
  const fake=fakeClient(),repo=createCloudRepository(fake.client,'haushaltsbuch-kassenbon');
  await repo.save({entries:[],budgets:{},goals:[]},null);
  await assert.rejects(repo.save({entries:[],budgets:{},goals:[]},null),/Konflikt/);
  await assert.rejects(repo.save({entries:[],budgets:{},goals:[]},999),/Konflikt/);
});
test('account switch after write rejects confirmation',async()=>{
  const fake=fakeClient(),repo=createCloudRepository(fake.client,'autokosten-reifenwechsel');
  const rpc=fake.client.rpc.bind(fake.client);
  fake.client.rpc=async(...args)=>{const result=await rpc(...args);fake.setUser('other');return result;};
  await assert.rejects(repo.save({cars:[],events:[],tires:[]},null),/bestätigt/);
});

test('multibyte UTF-8 snapshots are rejected before RPC when oversized',async()=>{
  const fake=fakeClient(),repo=createCloudRepository(fake.client,'autokosten-reifenwechsel');
  await assert.rejects(repo.save({cars:[],events:[],tires:[],note:'😀'.repeat(1_000_001)},null),/zu große/);
  assert.equal(fake.calls,0);
});
test('multibyte UTF-8 snapshots below conservative limit are accepted',async()=>{
  const fake=fakeClient(),repo=createCloudRepository(fake.client,'autokosten-reifenwechsel');
  const result=await repo.save({cars:[],events:[],tires:[],note:'😀'.repeat(100)},null);
  assert.equal(result.revision,1);
  assert.equal(fake.calls,1);
});
