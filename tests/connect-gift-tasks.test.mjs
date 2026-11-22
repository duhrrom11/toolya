import test from 'node:test';
import assert from 'node:assert/strict';
import {createGiftTasksConnect,projectGiftTasks} from '../shared/toolya/connect-gift-tasks.mjs';
const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
const ID='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const TS='2026-11-21T09:00:00.000Z';
function fixture(){
 let uid=A,stale=false,writes=0;
 const rows=[{id:ID,user_id:A,title:'Geschenk verpacken',due_date:'2026-12-24',
   status:'in_progress',archived_at:null,updated_at:TS},
  {id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',user_id:A,title:'Archiv',
   status:'open',archived_at:TS,updated_at:TS},
  {id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',user_id:B,title:'Fremd',
   status:'open',archived_at:null,updated_at:TS}];
 const client={auth:{async getUser(){return {data:{user:{id:uid,is_anonymous:false}},error:null}}},
  from(table){
   assert.equal(table,'wishlist_gift_tasks');
   let filters=[],mode='select',update;
   const q={
    select(){return q;},eq(k,v){filters.push(x=>String(x[k])===String(v));return q;},
    is(k,v){filters.push(x=>x[k]===v);return q;},
    order(){return q;},limit(){return Promise.resolve(run());},
    update(v){mode='update';update=v;return q;},
    then(ok,bad){return Promise.resolve(run()).then(ok,bad)}
   };
   function run(){
    if(mode==='select')return {data:structuredClone(rows.filter(r=>r.user_id===uid&&filters.every(f=>f(r)))),error:null};
    writes++;
    const row=rows.find(r=>r.user_id===uid&&filters.every(f=>f(r)));
    if(!row||stale)return {data:[],error:null};
    Object.assign(row,update);return {data:[{id:row.id,user_id:row.user_id,status:row.status,updated_at:row.updated_at}],error:null};
   }
   return q;
  }};
 return {client,rows,setUser:v=>uid=v,setStale:v=>stale=v,getWrites:()=>writes};
}
test('projection excludes archived and other users, retains source identity and due date',()=>{
 const f=fixture();
 const rows=projectGiftTasks(f.rows,A);
 assert.equal(rows.length,1);
 assert.equal(rows[0].id,'gift:'+ID);
 assert.equal(rows[0].due,'2026-12-24');
 assert.equal(rows[0].done,false);
});
test('source status is confirmed without overwriting gift metadata',async()=>{
 const f=fixture(),a=createGiftTasksConnect(f.client);
 const initial=await a.load();
 assert.equal(initial.tasks.length,1);
 const result=await a.setDone(initial.tasks[0],true);
 assert.equal(result.tasks[0].done,true);
 assert.equal(f.rows[0].status,'done');
 assert.equal(f.rows[0].title,'Geschenk verpacken');
 assert.equal(f.rows[0].due_date,'2026-12-24');
 assert.equal(f.getWrites(),1);
 await a.setDone(result.tasks[0],false);
 assert.equal(f.rows[0].status,'open');
});
test('stale revision rejects writes and account switches fail closed',async()=>{
 const f=fixture(),a=createGiftTasksConnect(f.client);
 const row=(await a.load()).tasks[0];
 f.setStale(true);
 await assert.rejects(a.setDone(row,true),/Konflikt/);
 f.setUser(B);
 await assert.rejects(a.setDone(row,true),/neu geladen/);
 assert.equal((await a.load()).tasks.length,1);
 assert.equal((await a.load()).tasks[0].text,'Fremd');
});
