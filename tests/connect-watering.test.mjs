import test from 'node:test';
import assert from 'node:assert/strict';
import {wateringDueDate,projectWateringTasks,scheduleWatering,applyWatering,createWateringConnect} from '../shared/toolya/connect-watering.mjs';

function sample() {
  return {plants:[{id:42,name:'Monstera',interval:3,lastWatered:'2026-11-18',potSize:'15',
    waterHistory:['2026-11-18'],location:'Wohnzimmer'},{id:43,name:'Ficus',interval:7,
    lastWatered:'2026-11-19',potSize:'20',waterHistory:[]}],
    inventory:[],seeds:[],beetSlots:Array(16).fill(null),monthWaterLiters:0,cisternMax:10,cisternCurrent:9};
}
test('watering schedule derives exactly one item per plant, with no replicated todo',()=>{
  const data=sample();
  assert.equal(wateringDueDate(data.plants[0]),'2026-11-21');
  assert.deepEqual(projectWateringTasks(data,'2026-11-20').map(x=>x.id),['42','43']);
  assert.equal(projectWateringTasks(data,'2026-11-22')[0].overdue,true);
  assert.equal(scheduleWatering(data,42,'2026-11-24','2026-11-20'),true);
  assert.equal(wateringDueDate(data.plants[0]),'2026-11-24');
  assert.equal(projectWateringTasks(data,'2026-11-20').find(t=>t.id==='42').planned,true);
  assert.equal(scheduleWatering(data,42,'2026-11-24','2026-11-20'),false);
  assert.throws(()=>scheduleWatering(data,42,'2026-11-19','2026-11-20'),/zukünftigen/);
  assert.throws(()=>scheduleWatering(data,404,'2026-11-24','2026-11-20'),/nicht mehr vorhanden/);
  assert.deepEqual(data.plants.map(p=>p.id),[42,43]);
});
test('dashboard completion records a real watering event and updates plant cistern',()=>{
  const data=sample();
  scheduleWatering(data,42,'2026-11-24','2026-11-20');
  assert.equal(applyWatering(data,42,'2026-11-20'),true);
  assert.equal(data.plants[0].lastWatered,'2026-11-20');
  assert.equal(data.plants[0].connectDue,undefined);
  assert.deepEqual(data.plants[0].waterHistory,['2026-11-20','2026-11-18']);
  assert.equal(data.monthWaterLiters,0.3);
  assert.equal(data.cisternCurrent,8.7);
  assert.equal(wateringDueDate(data.plants[0]),'2026-11-23');
  assert.throws(()=>applyWatering(data,42,'2026-11-20'),/bereits gegossen/);
});
test('connect reads and mutates the plant snapshot by revision, without writing duplicate dashboard tasks',async()=>{
  const data=sample();
  let revision=1, userId='A', saved=0, fail=false;
  const client={
    auth:{async getUser(){return {data:{user:{id:userId,is_anonymous:false}},error:null};}},
    from(name){
      assert.equal(name,'user_data');
      const q={select(){return q},eq(){return q},async maybeSingle(){
        return {data:{id:4,user_id:userId,tool:'pflanzenpflege-giessplan',data:structuredClone(data),revision},error:null};
      }};
      return q;
    },
    async rpc(name,args){
      assert.equal(name,'toolya_save_snapshot');
      assert.equal(args.p_tool,'pflanzenpflege-giessplan');
      if(fail||args.p_expected_revision!==revision)return {data:null,error:{code:'40001',message:'conflict'}};
      Object.assign(data,structuredClone(args.p_data));revision++;saved++;
      return {data:[{data:structuredClone(data),revision}],error:null};
    }
  };
  const connect=createWateringConnect(client);
  assert.equal((await connect.read()).tasks.length,2);
  await connect.schedule(42,'2026-11-24');
  assert.equal(saved,1);
  assert.equal(data.plants[0].connectDue,'2026-11-24');
  fail=true;
  await assert.rejects(connect.complete(42),/Konflikt/);
  assert.equal(data.plants[0].lastWatered,'2026-11-18','conflict must not modify persisted plant');
  fail=false;
  await connect.complete(42);
  assert.equal(saved,2);
  assert.match(data.plants[0].lastWatered,/^\d{4}-\d{2}-\d{2}$/);
  assert.notEqual(data.plants[0].lastWatered,'2026-11-18');
  assert.equal(data.plants[0].connectDue,undefined);
  userId='B';
  assert.equal((await connect.read()).userId,'B');
});
