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
