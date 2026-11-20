import test from 'node:test';
import assert from 'node:assert/strict';
import {projectWgSnapshot,createWgConnect} from '../shared/toolya/connect-wg-lists.mjs';
import {createConnectRegistry} from '../shared/toolya/connect-source-registry.mjs';
import {createUnifiedShopping} from '../dashboard/modules/unified-shopping.mjs';
const WG='77777777-7777-4777-8777-777777777777';
const stamp='2026-11-20T18:00:00.000Z';
const snapshot=()=>({shopping:[{id:4,title:'Hafermilch'},{id:5,title:'Hafermilch',done:true}],
  cleaning:[{id:8,task:'Küche reinigen',assignee:'A',done:false}],data:[{id:40,price:25}],notes:[{content:'private'}]});
function fixture(){
  let user='A', stale=false, wgWrites=0, shoppingWrites=0;
  const wg={id:WG,owner_id:'A',payload:snapshot(),updated_at:stamp};
  const items=[{id:'d8b80362-ff07-44ee-98c8-24afae194440',user_id:'A',title:'Spülmittel',completed:false,
    revision:1,created_at:stamp,deleted_at:null}];
  const client={
    auth:{async getUser(){return {data:{user:{id:user,is_anonymous:false}},error:null};}},
    from(table) {
      const filters=[];
      let mode='select',changes=null, inserted=null;
      const q={
        select(){return q;},
        eq(col,val){filters.push(row=>String(row[col])===String(val));return q;},
        is(col,val){filters.push(row=>row[col]===val);return q;},
        order(){return q;},
        limit(){return Promise.resolve(result());},
        update(value){mode='update';changes=value;return q;},
        insert(value){mode='insert';inserted=value;return q;},
        single(){return Promise.resolve(result(true));},
        maybeSingle(){return Promise.resolve(result(true));},
        then(resolve,reject){return Promise.resolve(result()).then(resolve,reject);}
      };
      function result(single=false) {
        if(table==='wg_spaces'){
          if(mode==='select'){
            const rows=user==='A'?[wg]:[];
            const value=rows.filter(r=>filters.every(fn=>fn(r)));
            return {data:single?structuredClone(value[0]||null):structuredClone(value),error:null};
          }
          if(mode==='update'){
            wgWrites++;
            if(user!=='A'||stale||!filters.every(fn=>fn(wg)))return {data:null,error:null};
            Object.assign(wg,structuredClone(changes));
            return {data:single?{id:WG,updated_at:wg.updated_at}:[{id:WG}],error:null};
          }
        }
        if(table==='dashboard_shopping_items'){
          if(mode==='select'){
            const values=items.filter(r=>r.user_id===user&&filters.every(fn=>fn(r)));
            return {data:single?structuredClone(values[0]||null):structuredClone(values),error:null};
          }
          if(mode==='insert'){
            shoppingWrites++;
            if(inserted.user_id!==user)return {data:null,error:{message:'RLS'}};
            const row={id:'d7ebddce-7452-476d-8a2e-ec241e2c2500',user_id:user,
              title:inserted.title,completed:false,revision:1,deleted_at:null,created_at:stamp};
            items.push(row);
            return {data:single?structuredClone(row):[structuredClone(row)],error:null};
          }
          if(mode==='update'){
            shoppingWrites++;
            const row=items.find(r=>r.user_id===user&&filters.every(fn=>fn(r)));
            if(!row)return {data:single?null:[],error:null};
            Object.assign(row,changes);
            return {data:single?structuredClone(row):[structuredClone(row)],error:null};
          }
        }
        throw Error('Unexpected table '+table);
      }
      return q;
    }
  };
  return {client,wg,items,setUser:x=>user=x,setStale:x=>stale=x,counts:()=>({wgWrites,shoppingWrites})};
}
test('WG projector retains duplicate titles with distinct IDs and never exports unrelated private fields',()=>{
  const result=projectWgSnapshot({id:WG,updated_at:stamp,payload:snapshot()});
  assert.equal(result.shopping.length,2);
  assert.notEqual(result.shopping[0].id,result.shopping[1].id);
  assert.equal(result.tasks.length,1);
  assert.equal(result.tasks[0].text,'Küche reinigen');
  assert.equal(result.shopping[0].url,'/tools/housemates/?id=secure_'+WG);
  assert.ok(!('notes' in result.shopping[0]));
});
test('registry selects verified sources and fails closed for invalid sources',async()=>{
  assert.throws(()=>createConnectRegistry([{id:'wg',load(){},setDone(){}},{id:'wg',load(){},setDone(){}}]),/Ungültiger/);
  const source=createConnectRegistry([{id:'wg',load:async()=>({shopping:[],tasks:[]}),setDone:async()=>true}]);
  assert.deepEqual(await source.load(),{shopping:[],tasks:[],partial:false});
  await assert.rejects(source.setDone({source:'unknown'},true),/Unbekannte/);
});
test('merged shopping, authenticated WG buying, household task acknowledgement and CAS',async()=>{
  const f=fixture(),app=createUnifiedShopping(f.client);
  let state=await app.load();
  assert.equal(state.shopping.length,3);
  assert.equal(state.tasks.length,1);
  const wgItem=state.shopping.find(i=>i.source==='wg'&&!i.done);
  state=await app.setDone(wgItem,true);
  assert.equal(f.wg.payload.shopping[0].done,true);
  assert.deepEqual(f.wg.payload.data,[{id:40,price:25}],'unrelated WG data preserved');
  assert.equal(state.shopping.filter(i=>i.done).length,2);
  state=await app.setDone(state.tasks[0],true);
  assert.equal(f.wg.payload.cleaning[0].done,true);
  assert.equal(state.tasks[0].done,true);
  state=await app.add('Reis');
  assert.ok(state.shopping.some(i=>i.text==='Reis'));
  const own=state.shopping.find(i=>i.text==='Reis');
  state=await app.setDone(own,true);
  assert.equal(state.shopping.find(i=>i.id===own.id).done,true);
  assert.equal(f.counts().shoppingWrites,2);
  await app.remove(own);
  assert.ok(f.items.find(i=>i.id===own.id).deleted_at,'soft delete rather than hard erase');
  f.setStale(true);
  await assert.rejects(app.setDone(state.shopping.find(i=>i.source==='wg'),false),/WG-Konflikt/);
  f.setUser('B');
  await assert.rejects(app.add('Fremd'),/neu laden/);
  const other=await app.load();
  assert.equal(other.shopping.length,0);
  assert.equal(other.tasks.length,0);
});
test('invalid user input and anonymous-account isolation',async()=>{
  const f=fixture(),app=createUnifiedShopping(f.client);
  await app.load();
  await assert.rejects(app.add(''),/Artikelbezeichnung/);
  await assert.rejects(app.add('x'.repeat(161)),/Artikelbezeichnung/);
  assert.equal(f.counts().shoppingWrites,0);
});
