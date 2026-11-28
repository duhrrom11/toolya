import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const edge=readFileSync(new URL('../../supabase/functions/wishlist-discovery/index.ts',import.meta.url),'utf8');
const ui=readFileSync(new URL('../../admin-stats-dashboard/wishlist-finder.mjs',import.meta.url),'utf8');
const withdraw=edge.slice(edge.indexOf("if(body.action==='withdraw')"),edge.indexOf("if(body.action==='dismiss')"));
const sql=readFileSync(new URL('../../supabase/migrations/20261128153000_wishlist_admin_service_role_fix.sql',import.meta.url),'utf8');
const rpc=sql.slice(sql.indexOf('create or replace function public.wishlist_admin_withdraw'));
test('withdraw never deletes by wishlist key alone',()=>{
 assert.match(withdraw,/db\.rpc\('wishlist_admin_withdraw',\{p_actor:data\.user\.id,p_candidate:body\.id\}\)/);
 assert.match(rpc,/select \* into strict c .*status='published' for update/);
 assert.match(rpc,/select \* into strict i .*migrated_to_directory/);
 for(const [f,g] of [['display_name','name'],['logo_url','logo_url'],['wishlist_url','wishlist_url'],['source_url','source_url'],['country','country']])assert.ok(rpc.includes(f+'=c.'+g));
 assert.match(rpc,/created_at>=c\.found_at/);
 assert.match(rpc,/select \* into strict p .*id=i\.id and owner_id=p_actor and managed_by_finder for update/);
 assert.match(rpc,/select \* into strict l .*id=i\.id and profile_id=p\.id for update/);
 assert.match(rpc,/p\.updated_at>greatest/);
 assert.match(rpc,/l\.updated_at>greatest/);
 assert.match(rpc,/count\(\*\).*profile_id=p\.id\)<>1/);
 assert.match(rpc,/update public\.wishlist_directory_lists set visibility='private' where id=l\.id/);
 assert.match(rpc,/update public\.wishlist_directory_profiles set visibility='private' where id=p\.id/);
 assert.doesNotMatch(rpc,/delete from/i);
 assert.match(rpc,/revoke all on function public\.wishlist_admin_withdraw\(uuid,uuid\) from public,anon,authenticated/);
});
test('withdraw requires explicit administrator confirmation',()=>{
 assert.ok(ui.includes("window.confirm("));
 assert.ok(ui.includes("api('withdraw',{id:r.id})"));
});
