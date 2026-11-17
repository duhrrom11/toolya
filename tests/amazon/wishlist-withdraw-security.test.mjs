import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const edge=readFileSync(new URL('../../supabase/functions/wishlist-discovery/index.ts',import.meta.url),'utf8');
const ui=readFileSync(new URL('../../admin-stats-dashboard/wishlist-finder.mjs',import.meta.url),'utf8');
const withdraw=edge.slice(edge.indexOf("if(body.action==='withdraw')"),edge.indexOf("if(body.action==='dismiss')"));
test('withdraw never deletes by wishlist key alone',()=>{
 assert.ok(withdraw.includes(".delete().eq('id',matching[0].id)"),'must target a verified row id');
 for(const f of ['display_name','logo_url','wishlist_url','source_url','country'])
  assert.ok(withdraw.includes(".eq('"+f+"',existing."),'metadata comparison missing: '+f);
 assert.ok(withdraw.includes('matching.length!==1'),'ambiguous matches must fail closed');
 assert.ok(withdraw.includes('removed.length!==1'),'missing or changed row must fail');
 assert.ok(withdraw.includes("eq('status','published')"),'candidate must still be published');
 assert.ok(!withdraw.includes(".delete().eq('list_key',existing.list_key)"),'unsafe key-only deletion is forbidden');
});
test('withdraw requires explicit administrator confirmation',()=>{
 assert.ok(ui.includes("window.confirm("));
 assert.ok(ui.includes("api('withdraw',{id:r.id})"));
});
