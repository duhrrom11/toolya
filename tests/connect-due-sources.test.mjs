import test from 'node:test';
import assert from 'node:assert/strict';
import {projectDueTasks,createDueSource,validDay,addDays} from '../shared/toolya/connect-due-sources.mjs';

const today='2026-11-22';
const loans={items:[
 {id:11,title:'Bohrmaschine',person:'Ada',returnDate:'2026-11-21',status:'active',note:'nicht löschen'},
 {id:12,title:'Leiter',person:'Tim',returnDate:'2026-12-10',status:'active'},
 {id:13,title:'Säge',person:'Eva',returnDate:'2026-11-20',status:'returned'},
 {id:14,title:'Buch',person:'Max',returnDate:'2027-04-01',status:'active'}],contacts:[],inventory:[]};
const car={cars:[{id:3,name:'VW Golf'}],events:[
 {id:7,carId:3,date:'2026-12-01',type:'TÜV / HU',title:'HU',cost:0},
 {id:8,carId:3,date:'2026-10-01',type:'TÜV / HU',title:'Bereits vergangen'},
 {id:9,carId:3,date:'2026-11-30',type:'Tanken',title:'Tankbeleg'},
 {id:10,carId:3,date:'2027-01-15',type:'Versicherung',title:'Jahresbeitrag'}],tires:[]};
const pet={pets:[{id:5,name:'Milo'}],meds:[],events:[
 {id:20,petId:5,type:'Impfung',title:'Tollwut',date:'2025-11-01',expiryDate:'2026-11-25'},
 {id:21,petId:5,type:'Entwurmung',date:'2026-09-01'},
 {id:22,petId:5,type:'Entwurmung',date:'2026-10-01'},
 {id:23,petId:5,type:'Medikament',date:'2026-11-27',expiryDate:'2026-12-01'}]};
test('strict date and loan return task projection preserves original status',()=>{
 assert.equal(validDay('2026-02-29'),false);
 assert.equal(validDay('2028-02-29'),true);
 assert.equal(addDays('2026-12-30',3),'2027-01-02');
 const tasks=projectDueTasks('loans',structuredClone(loans),today);
 assert.equal(tasks.length,2);
 assert.equal(tasks[0].due,'2026-11-21');
 assert.equal(tasks[0].readonly,false);
 assert.equal(tasks[0].kind,'task');
 assert.equal(loans.items[0].status,'active');
});
test('car entries are only upcoming planned relevant dates, not past records or fuel receipts',()=>{
 const tasks=projectDueTasks('car',structuredClone(car),today);
 assert.deepEqual(tasks.map(x=>x.itemId),['7']);
 assert.equal(tasks[0].readonly,true);
 assert.match(tasks[0].text,/VW Golf.*TÜV/);
});
test('pet booster and latest worming interval shown as notices, not false medical completion',()=>{
 const tasks=projectDueTasks('pet',structuredClone(pet),today);
 assert.equal(tasks.length,2);
 assert.ok(tasks.some(x=>x.text.includes('Impfung auffrischen')));
 assert.ok(tasks.some(x=>x.text.includes('Entwurmung prüfen')));
 assert.ok(tasks.every(x=>x.readonly&&x.source==='pet'));
});
function fixture(){
 const user={id:'11111111-1111-4111-8111-111111111111',is_anonymous:false};
 let revision=1, writes=0, fail=false;
 const snapshot=structuredClone(loans);
 const client={
  auth:{async getUser(){return {data:{user},error:null};}},
  from(table){
   assert.equal(table,'user_data');
   const q={select(){return q;},eq(){return q;},async maybeSingle(){
    return {data:{id:1,user_id:user.id,tool:'verliehene-gegenstaende-verwalten',data:structuredClone(snapshot),revision},error:null};
   }};
   return q;
  },
  async rpc(name,args){
   assert.equal(name,'toolya_save_snapshot');
   assert.equal(args.p_tool,'verliehene-gegenstaende-verwalten');
   writes++;
   if(fail||args.p_expected_revision!==revision)return {data:null,error:{code:'40001',message:'conflict'}};
   Object.assign(snapshot,structuredClone(args.p_data));revision++;
   return {data:[{data:structuredClone(snapshot),revision}],error:null};
  }
 };
 return {client,snapshot,setUser:id=>user.id=id,setFail:v=>fail=v,counts:()=>writes};
}
test('loan return changes original source by atomic CAS, never by parallel dashboard copy',async()=>{
 const f=fixture(),connector=createDueSource(f.client,'loans');
 const first=await connector.load();
 const item=first.tasks[0];
 assert.equal(item.itemId,'11');
 await assert.rejects(connector.setDone({...item,id:'loans:999'},true),/neu geladen/);
 await assert.rejects(connector.setDone(item,false),/Original-Tool/);
 const result=await connector.setDone(item,true);
 assert.equal(f.snapshot.items[0].status,'returned');
 assert.equal(f.snapshot.items[0].note,'nicht löschen');
 assert.equal(result.tasks.length,1);
 assert.equal(f.counts(),1);
 await assert.rejects(connector.setDone(item,true),/neu geladen/);
 f.setFail(true);
 await assert.rejects(connector.setDone(result.tasks[0],true),/Konflikt/);
 assert.equal(f.snapshot.items[1].status,'active');
 f.setFail(false);
 f.setUser('22222222-2222-4222-8222-222222222222');
 await assert.rejects(connector.setDone(result.tasks[0],true),/neu geladen/);
});
test('readonly car/pet connectors do not mark medical or vehicle maintenance as done',async()=>{
 const f=fixture();
 const connector=createDueSource(f.client,'car');
 await assert.rejects(connector.setDone({source:'car',kind:'task',id:'car:7',itemId:'7'},true),/neu geladen/);
});
