import test from 'node:test';
import assert from 'node:assert/strict';
import {validateMoving,readMoving,createProject,createRoom,assignBox,updateStatus,finishProject,priorityList} from '../tools/moving/moving-state.mjs';
const base=()=>({locations:[{id:5,name:'Keller'}],boxes:[{id:16,locId:5,name:'Gläser',desc:'Zerbrechlich',value:100,tag:'Zerbrechlich'}]});
test('old snapshots are untouched and readable',()=>{
  const old=base();assert.strictEqual(validateMoving(old),old);
  assert.equal(old.moving,undefined);assert.deepEqual(readMoving(old).assignments,[]);
});
test('project room and assigned box preserve inventory and allow sequential transitions',()=>{
  const original=base(),p=createProject(original,'Mein Umzug','2026-12-01');
  assert.deepEqual(original,base());assert.deepEqual(p.boxes,original.boxes);
  const project=p.moving.projects[0];
  const withRoom=createRoom(p,project.id,'Küche','EG');
  const room=withRoom.moving.rooms[0];
  let assigned=assignBox(withRoom,project.id,16,room.id,'first_day');
  assert.equal(priorityList(assigned,project.id)[0].priority,'first_day');
  assert.throws(()=>updateStatus(assigned,assigned.moving.assignments[0].id,'arrived'),/Statuswechsel/);
  for(const status of ['packed','loaded','arrived','unpacked'])
    assigned=updateStatus(assigned,assigned.moving.assignments[0].id,status);
  assert.equal(assigned.moving.assignments[0].status,'unpacked');
  assert.deepEqual(assigned.boxes,original.boxes);
  assert.equal(finishProject(assigned,project.id).moving.projects[0].status,'completed');
});
test('invalid references and schema versions are rejected',()=>{
  let a=createProject(base(),'Umzug');
  assert.throws(()=>createProject(a,'Noch einer'),/bisherigen/);
  assert.throws(()=>assignBox(a,a.moving.projects[0].id,999),/Kistenzuordnung/);
  a.moving.schemaVersion=2;
  assert.throws(()=>validateMoving(a),/Unbekannte/);
});
test('same box gets updated rather than duplicated',()=>{
  let s=createProject(base(),'Umzug');
  const id=s.moving.projects[0].id;
  s=assignBox(s,id,16);s=assignBox(s,id,16,null,'important');
  assert.equal(s.moving.assignments.length,1);
  assert.equal(s.moving.assignments[0].priority,'important');
});

test('first-night entries retain user titles and refer only to boxes in the move', async () => {
  const {createProject,assignBox,updateFirstNight}=await import('../tools/moving/moving-state.mjs');
  let data=createProject({locations:[],boxes:[{id:42,name:'Kitchen 01'}]},'Move');
  const project=data.moving.projects[0].id;
  assert.throws(()=>updateFirstNight(data,project,{type:'assign',id:'charger',boxId:42}));
  data=assignBox(data,project,42);
  const ready=updateFirstNight(data,project,{type:'assign',id:'charger',boxId:42});
  assert.equal(ready.moving.projects[0].firstNight[0].boxId,42);
  assert.equal(data.moving.projects[0].firstNight,undefined);
  const custom=updateFirstNight(ready,project,{type:'add',title:'Lieblingsbecher'});
  assert.equal(custom.moving.projects[0].firstNight.at(-1).title,'Lieblingsbecher');
});
