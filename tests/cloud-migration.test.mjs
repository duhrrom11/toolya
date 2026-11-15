import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLegacyMigration } from '../shared/toolya/legacy-cloud-migration.mjs';

function setup({ cloud = null, owner = null } = {}) {
  const items = new Map([['kfz_tracker_pro_v3',JSON.stringify({cars:[{id:1}],events:[],tires:[]})]]);
  if(owner)items.set('helferlein_cloud_owner_autokosten-reifenwechsel',owner);
  const storage={getItem:k=>items.has(k)?items.get(k):null};
  let writes=0, current=cloud;
  const client={auth:{getUser:async()=>({data:{user:{id:'user-a',is_anonymous:false}},error:null})}};
  const repository={
    async read(){return {exists:current!==null,data:current,revision:current?1:null};},
    async save(data,rev){
      assert.equal(rev,null);writes++;current=structuredClone(data);
      return {data:current,revision:1};
    }
  };
  return {migration:createLegacyMigration({client,repository,tool:'autokosten-reifenwechsel',storage}),
    get writes(){return writes;},items};
}
test('existing cloud is never overwritten',async()=>{
  const ctx=setup({cloud:{cars:[{id:2}],events:[],tires:[]}});
  assert.equal((await ctx.migration.inspect()).status,'cloud-already-exists');
  await assert.rejects(ctx.migration.migrate({confirm:async()=>true,exportBackup:async()=>true}),/cloud-already-exists/);
  assert.equal(ctx.writes,0);
});
test('explicit approval and backup required',async()=>{
  const ctx=setup();
  const cancelled=await ctx.migration.migrate({confirm:async()=>false,exportBackup:async()=>true});
  assert.equal(cancelled.status,'cancelled');assert.equal(ctx.writes,0);
  await assert.rejects(ctx.migration.migrate({confirm:async()=>true,exportBackup:async()=>false}),/Sicherung/);
  assert.equal(ctx.writes,0);
});
test('confirmed migration preserves local keys',async()=>{
  const ctx=setup();
  const result=await ctx.migration.migrate({confirm:async()=>true,exportBackup:async()=>true});
  assert.equal(result.status,'confirmed');assert.equal(ctx.writes,1);
  assert.ok(ctx.items.has('kfz_tracker_pro_v3'));
});
test('foreign device ownership blocks migration',async()=>{
  const ctx=setup({owner:'other-user'});
  await assert.rejects(ctx.migration.inspect(),/anderen Konto/);
  assert.equal(ctx.writes,0);
});

test('JSONB key reordering does not falsely fail confirmed migration',async()=>{
  const local={cars:[{id:1,name:'Demo'}],events:[],tires:[]};
  const storage={getItem:key=>key==='kfz_tracker_pro_v3'?JSON.stringify(local):null};
  const client={auth:{getUser:async()=>({data:{user:{id:'user-a',is_anonymous:false}},error:null})}};
  let cloud=null, writes=0;
  const repository={
    async read(){return {exists:cloud!==null,data:cloud,revision:cloud?1:null};},
    async save(data,revision){
      assert.equal(revision,null);
      writes++;
      cloud={tires:data.tires,events:data.events,cars:data.cars.map(c=>({name:c.name,id:c.id}))};
      return {data:cloud,revision:1};
    }
  };
  const migration=createLegacyMigration({client,repository,tool:'autokosten-reifenwechsel',storage});
  const result=await migration.migrate({confirm:async()=>true,exportBackup:async()=>true});
  assert.equal(result.status,'confirmed');
  assert.equal(writes,1);
});

test('legacy key-set changes during backup abort migration even if values match',async()=>{
  const items=new Map([['kassenbon_data','[]']]);
  const storage={getItem:key=>items.has(key)?items.get(key):null};
  const client={auth:{getUser:async()=>({data:{user:{id:'user-a',is_anonymous:false}},error:null})}};
  let writes=0;
  const repository={
    async read(){return {exists:false,data:null,revision:null};},
    async save(){writes++;throw Error('must not write');}
  };
  const migration=createLegacyMigration({client,repository,tool:'haushaltsbuch-kassenbon',storage});
  await assert.rejects(migration.migrate({
    confirm:async()=>true,
    exportBackup:async()=>{items.set('budgetbuch_goals','[]');return true;}
  }),/verändert/);
  assert.equal(writes,0);
});
