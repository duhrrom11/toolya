import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const ctx={};vm.runInNewContext(readFileSync(new URL('../assets/estate-cloud-guard.js',import.meta.url),'utf8'),ctx);
const {requireOwner,saveEncryptedSnapshot,verifyEncryptedBackup}=ctx.EstateCloudGuard;
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

test('estate backup readback decrypts ciphertext and checks revision',async()=>{
 let user={id:'owner',is_anonymous:false},decrypts=0;
 const remote={vault_id:'v_123',updated_at:'revision-1',recovery_key:{ciphertext:'wrapped'},encrypted_data:{ciphertext:'entries'},encrypted_config:{ciphertext:'config'}};
 const client={auth:{async getUser(){return {data:{user},error:null}}},from(){return {select(){return this},eq(){return this},async single(){return {data:remote,error:null}}}}};
 const options={client,ownerId:'owner',vaultId:'v_123',expectedStamp:'revision-1',key:'secret',
  cryptoApi:{async decrypt(value){decrypts++;return value===remote.encrypted_data?{entries:[{id:'1'}]}:{alarmPersons:[]}}},
  validatePayload(p){if(!Array.isArray(p.entries))throw Error('invalid_vault');return p}};
 const result=await verifyEncryptedBackup(options);
 assert.equal(result.entries,1);assert.equal(decrypts,2);
 await assert.rejects(verifyEncryptedBackup({...options,expectedStamp:'old'}),/backup_unverified/);
 user={id:'other'};await assert.rejects(verifyEncryptedBackup(options),/login_required/);
});
test('estate backup readback refuses invalid ciphertext without claiming success',async()=>{
 const client={auth:{async getUser(){return {data:{user:{id:'owner'}},error:null}}},from(){return {select(){return this},eq(){return this},async single(){return {data:{vault_id:'v',updated_at:'rev',recovery_key:{ciphertext:'wrapped'},encrypted_data:{ciphertext:'bad'},encrypted_config:{ciphertext:'config'}},error:null}}}}};
 await assert.rejects(verifyEncryptedBackup({client,ownerId:'owner',vaultId:'v',expectedStamp:'rev',key:'key',cryptoApi:{async decrypt(){throw Error('decrypt_failed')}},validatePayload:x=>x}),/decrypt_failed/);
});
