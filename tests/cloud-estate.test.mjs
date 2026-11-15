import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const ctx={};vm.runInNewContext(readFileSync(new URL('../assets/estate-cloud-guard.js',import.meta.url),'utf8'),ctx);
const {requireOwner,saveEncryptedSnapshot}=ctx.EstateCloudGuard;
const cipher={ciphertext:'encrypted'};
function fixture(user={id:'owner',is_anonymous:false}){
 let row=null,writes=0,conflict=false;
 const client={
  auth:{async getUser(){return {data:{user},error:null}}},
  from(table){assert.equal(table,'vault_cloud_snapshots');return {
   select(){return this},eq(){return this},update(data){this.payload=data;return this},insert(data){this.payload=data;return this},
   async maybeSingle(){return {data:row,error:null}},
   then(resolve,reject){writes++;if(conflict)return Promise.resolve({data:[],error:null}).then(resolve,reject);row={vault_id:'v_123',updated_at:'2026-11-15T10:00:00Z'};return Promise.resolve({data:[row],error:null}).then(resolve,reject)}
  }}
 };
 return {client,get writes(){return writes},setUser(x){user=x},setConflict(x){conflict=x}};
}
const args=(client)=>({client,ownerId:'owner',vaultId:'v_123',expectedStamp:null,encryptedData:cipher,encryptedConfig:cipher,recoveryKey:cipher});
test('estate refuses anonymous and switched owner',async()=>{
 for(const user of [null,{id:'owner',is_anonymous:true},{id:'other'}]){
  const f=fixture(user);await assert.rejects(requireOwner(f.client,'owner'));await assert.rejects(saveEncryptedSnapshot(args(f.client)));assert.equal(f.writes,0);
 }
});
test('estate saves only encrypted snapshot after verified owner',async()=>{
 const f=fixture();const stamp=await saveEncryptedSnapshot(args(f.client));assert.equal(stamp,'2026-11-15T10:00:00Z');assert.equal(f.writes,1);
});
test('estate blocks failed revision confirmation',async()=>{
 const f=fixture();f.setConflict(true);await assert.rejects(saveEncryptedSnapshot(args(f.client)),/conflict/);assert.equal(f.writes,1);
});
