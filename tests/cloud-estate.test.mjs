import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import {TextEncoder,TextDecoder} from 'node:util';
const ctx={};vm.runInNewContext(readFileSync(new URL('../assets/estate-cloud-guard.js',import.meta.url),'utf8'),ctx);
const {requireOwner,saveEncryptedSnapshot,verifyEncryptedBackup,assertRestoreCompatible,restoreCloudSnapshot,assertLocalSnapshot}=ctx.EstateCloudGuard;
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

test('estate backup refuses mismatched ciphertext or recovery envelope even with matching revision',async()=>{
 const remote={vault_id:'v',updated_at:'rev',encrypted_data:{ciphertext:'cloud-data'},encrypted_config:{ciphertext:'cloud-config'},recovery_key:{ciphertext:'cloud-recovery'}};
 const client={auth:{async getUser(){return {data:{user:{id:'owner'}},error:null}}},from(){return {select(){return this},eq(){return this},async single(){return {data:remote,error:null}}}}};
 const base={client,ownerId:'owner',vaultId:'v',expectedStamp:'rev',key:'key',
  cryptoApi:{async decrypt(v){return v===remote.encrypted_data?{entries:[]}:{alarmPersons:[]}}},
  validatePayload:x=>x,expectedEncryptedData:remote.encrypted_data,expectedEncryptedConfig:remote.encrypted_config,expectedRecoveryKey:remote.recovery_key};
 assert.equal((await verifyEncryptedBackup(base)).entries,0);
 for(const changed of [{expectedEncryptedData:{ciphertext:'other'}},{expectedEncryptedConfig:{ciphertext:'other'}},{expectedRecoveryKey:{ciphertext:'other'}}])
  await assert.rejects(verifyEncryptedBackup({...base,...changed}),/backup_unverified/);
});

test('estate restoration preserves different local and remote vaults',()=>{
 assert.throws(()=>assertRestoreCompatible({version:2,vaultId:'local',pending:false},{vault_id:'remote',updated_at:'rev'}),/vault_mismatch/);
 assert.doesNotThrow(()=>assertRestoreCompatible(null,{vault_id:'remote'}));
 assert.doesNotThrow(()=>assertRestoreCompatible({version:2,vaultId:'same',pending:false},{vault_id:'same',updated_at:'rev'}));
});
test('estate restoration refuses newer cloud revision when unsynced local changes exist',()=>{
 assert.throws(()=>assertRestoreCompatible({version:2,vaultId:'same',pending:true,cloudStamp:'old'},{vault_id:'same',updated_at:'new'}),/conflict/);
 assert.doesNotThrow(()=>assertRestoreCompatible({version:2,vaultId:'same',pending:true,cloudStamp:'same'},{vault_id:'same',updated_at:'same'}));
});

test('estate restores encrypted cloud snapshot on new device without local storage',async()=>{
 let calls=0;const remote={vault_id:'v_1',updated_at:'rev1',recovery_key:{ciphertext:'wrapped'},encrypted_data:{ciphertext:'data'},encrypted_config:{ciphertext:'config'}};
 const client={auth:{async getUser(){calls++;return {data:{user:{id:'owner'}},error:null}}},from(){return {select(){return this},eq(){return this},async maybeSingle(){return {data:remote,error:null}}}}};
 const restored=await restoreCloudSnapshot({client,ownerId:'owner',password:'password',cryptoApi:{
  async unwrap(envelope,password){assert.equal(envelope,remote.recovery_key);assert.equal(password,'password');return 'secret'},
  async decrypt(encrypted,key){assert.equal(key,'secret');return encrypted===remote.encrypted_data?{entries:[{id:'entry'}]}:{ownerName:'Test'}}
 },validatePayload:p=>p});
 assert.equal(restored.payload.entries.length,1);assert.equal(restored.config.vaultId,'v_1');assert.equal(restored.stamp,'rev1');assert.equal(calls,2);
});
test('estate refuses invalid new-device recovery and changed identity',async()=>{
 let user={id:'owner'};const remote={vault_id:'v_1',updated_at:'rev1',recovery_key:{ciphertext:'wrapped'},encrypted_data:{ciphertext:'data'},encrypted_config:{ciphertext:'config'}};
 const client={auth:{async getUser(){return {data:{user},error:null}}},from(){return {select(){return this},eq(){return this},async maybeSingle(){return {data:remote,error:null}}}}};
 const base={client,ownerId:'owner',password:'password',cryptoApi:{async unwrap(){return 'key'},async decrypt(v){user={id:'other'};return v===remote.encrypted_data?{entries:[]}:{vaultId:'v_1'}}},validatePayload:p=>p};
 await assert.rejects(restoreCloudSnapshot(base),/login_required/);
 user={id:'owner'};
 await assert.rejects(restoreCloudSnapshot({...base,cryptoApi:{async unwrap(){throw Error('wrong_password')},async decrypt(){return {entries:[]}}}}),/wrong_password/);
});

test('estate local encrypted backup revision remains unchanged through cloud verification',()=>{
 const encrypted='{"version":2,"ciphertext":"original"}';
 assert.doesNotThrow(()=>assertLocalSnapshot(encrypted,encrypted));
 assert.throws(()=>assertLocalSnapshot(encrypted,'{"version":2,"ciphertext":"other"}'),/conflict/);
 assert.throws(()=>assertLocalSnapshot(encrypted,null),/conflict/);
});

test('estate first local recovery write refuses a vault created by another tab',()=>{
 assert.doesNotThrow(()=>assertLocalSnapshot(null,null));
 assert.throws(()=>assertLocalSnapshot(null,'{"version":2,"ciphertext":"other-tab"}'),/conflict/);
});

test('estate legacy merge rejects conflicting trustee keys and contact identities',()=>{
 const guard=ctx.EstateCloudGuard;
 const local={entries:[],trusteeKeys:{p1:'a'.repeat(64)}},cloud={entries:[],trusteeKeys:{p1:'b'.repeat(64)}};
 const contacts={alarmPersons:[{id:'p1',contact:'first@example.invalid'}]};
 assert.throws(()=>guard.assertLegacyMergeSafe(local,contacts,cloud,contacts),/conflict/);
 assert.throws(()=>guard.assertLegacyMergeSafe(local,contacts,{entries:[],trusteeKeys:{p1:'a'.repeat(64)}},{alarmPersons:[{id:'p1',contact:'second@example.invalid'}]}),/conflict/);
 assert.doesNotThrow(()=>guard.assertLegacyMergeSafe(local,contacts,{entries:[],trusteeKeys:{p2:'c'.repeat(64)}},{alarmPersons:[{id:'p2',contact:'new@example.invalid'}]}));
});

test('estate legacy merge rejects duplicate contacts and malformed issued keys',()=>{
 const guard=ctx.EstateCloudGuard;
 const local={entries:[],trusteeKeys:{p1:'a'.repeat(64)}};
 const people={alarmPersons:[{id:'p1',contact:'one@example.invalid'}]};
 const duplicate={alarmPersons:[{id:'p1',contact:'one@example.invalid'},{id:'p1',contact:'two@example.invalid'}]};
 assert.throws(()=>guard.assertLegacyMergeSafe(local,people,local,duplicate),/conflict/);
 assert.throws(()=>guard.assertLegacyMergeSafe({entries:[],trusteeKeys:{p1:'invalid'}},people,local,people),/conflict/);
});

test('estate restores real AES-GCM/PBKDF2 encrypted snapshot without production services',async()=>{
 const cryptoContext={crypto:webcrypto,TextEncoder,TextDecoder,Uint8Array,atob,btoa};
 vm.runInNewContext(readFileSync(new URL('../assets/estate-crypto.js',import.meta.url),'utf8'),cryptoContext);
 const C=cryptoContext.EstateCrypto,key=C.random(),password='isolated-fixture-password';
 const payload={entries:[{id:'document-1',title:'Encrypted fixture'}],trusteeKeys:{p1:C.random()}};
 const config={vaultId:'v_fixture',alarmPersons:[{id:'p1',contact:'fixture@example.invalid'}]};
 const remote={vault_id:'v_fixture',updated_at:'revision-fixture',recovery_key:await C.wrap(key,password),
  encrypted_data:await C.encrypt(payload,key),encrypted_config:await C.encrypt(config,key)};
 const client={auth:{async getUser(){return {data:{user:{id:'fixture-owner',is_anonymous:false}},error:null}}},
  from(){return {select(){return this},eq(){return this},async maybeSingle(){return {data:remote,error:null}}}}};
 const options={client,ownerId:'fixture-owner',password,cryptoApi:C,validatePayload:p=>{if(!Array.isArray(p.entries))throw Error('invalid_vault');return p}};
 const restored=await restoreCloudSnapshot(options);
 assert.equal(restored.payload.entries[0].title,'Encrypted fixture');
 assert.equal(restored.config.alarmPersons[0].contact,'fixture@example.invalid');
 assert.equal(restored.payload.trusteeKeys.p1,payload.trusteeKeys.p1);
 await assert.rejects(restoreCloudSnapshot({...options,password:'wrong-password'}));
 const broken={...remote,encrypted_config:{...remote.encrypted_config,ciphertext:remote.encrypted_config.ciphertext.slice(0,-4)+'AAAA'}};
 const brokenClient={...client,from(){return {select(){return this},eq(){return this},async maybeSingle(){return {data:broken,error:null}}}}};
 await assert.rejects(restoreCloudSnapshot({...options,client:brokenClient}));
});

test('estate emergency replica maps distinct tokens to the same authenticated encrypted documents',async()=>{
 const sandbox={crypto:webcrypto,TextEncoder,TextDecoder,Uint8Array,atob,btoa};
 vm.runInNewContext(readFileSync(new URL('../assets/estate-crypto.js',import.meta.url),'utf8'),sandbox);
 const C=sandbox.EstateCrypto,first=C.random(),second=C.random();
 const entries=[{id:'e1',title:'Isolated confidential fixture'}];
 const people=[{id:'p1',contact:'first@example.invalid'},{id:'p2',contact:'second@example.invalid'}];
 const replica=await C.readReplica(entries,people,{p1:first,p2:second});
 assert.equal(replica.guardians.length,2);
 assert.notEqual(replica.guardians[0].hash,replica.guardians[1].hash);
 for(const [i,token] of [first,second].entries()){
  const opened=await C.openReplica({content:replica.content,envelope:replica.guardians[i].envelope},token);
  assert.equal(opened.entries[0].title,entries[0].title);
  await assert.rejects(C.openReplica({content:replica.content,envelope:replica.guardians[i].envelope},i===0?second:first));
 }
 await assert.rejects(C.readReplica(entries,people,{p1:first,p2:first}),/conflict/);
 await assert.rejects(C.readReplica(entries,[people[0],people[0]],{p1:first}),/conflict/);
 const canonical=await C.readReplica(entries,[people[0]],{p1:first.toUpperCase()});
 assert.equal(canonical.guardians[0].hash,await C.hash(first));
});
