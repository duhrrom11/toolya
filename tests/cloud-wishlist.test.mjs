import test from 'node:test';
import assert from 'node:assert/strict';
import {requireWishlistWriter,guardedWishlistWrite} from '../tools/wishes/wishlist-auth.mjs';
const client=(user,error=null)=>({auth:{async getUser(){return {data:{user},error}}}});
test('public wishlist rejects anonymous, missing and switched accounts',async()=>{
 for(const [c,id] of [[client(null),'owner'],[client({id:'owner',is_anonymous:true}),'owner'],[client({id:'other'}),'owner'],[client({id:'owner'},Error('offline')),'owner'],[client({id:'owner'}),null]])
  await assert.rejects(requireWishlistWriter(c,id));
});
test('wishlist write confirms registered user before mutation',async()=>{
 let writes=0;
 const result=await guardedWishlistWrite(client({id:'owner',is_anonymous:false}),'owner',async id=>{writes++;return id});
 assert.equal(result,'owner');assert.equal(writes,1);
 await assert.rejects(guardedWishlistWrite(client({id:'other'}),'owner',()=>{writes++}));
 assert.equal(writes,1);
});
test('wishlist refuses write when auth verification fails',async()=>{
 let writes=0;
 await assert.rejects(guardedWishlistWrite(client(null),'owner',()=>{writes++}));
 assert.equal(writes,0);
});
