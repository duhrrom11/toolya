// Runs ONLY against an explicitly selected loopback PostgreSQL 17 instance.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {Client}=require('pg');
const C=require('../../assets/estate-crypto.js');
const url=process.env.ESTATE_TEST_DATABASE_URL;
if(!url||!['127.0.0.1','localhost'].includes(new URL(url).hostname))throw Error('Loopback isolated database required');
(async()=>{
 const a=new Client({connectionString:url}),b=new Client({connectionString:url});await a.connect();await b.connect();
 try{
  await a.query(`do $$ begin create role anon; exception when duplicate_object then null; end $$; do $$ begin create role authenticated; exception when duplicate_object then null; end $$; do $$ begin create role service_role; exception when duplicate_object then null; end $$; create schema auth; create table auth.users(id uuid primary key); create table auth.sessions(id uuid primary key,user_id uuid references auth.users); create table public.vault_cloud_snapshots(owner_user_id uuid primary key,vault_id text,encrypted_data jsonb);`);
  const sql=fs.readFileSync('supabase/migrations/20261113113731_estate_read_release_v2.sql','utf8');await a.query(sql);await a.query(fs.readFileSync('supabase/migrations/20261113125230_estate_reporter_notifications_v2.sql','utf8'));
  const owner=crypto.randomUUID(),other=crypto.randomUUID(),session=crypto.randomUUID(),otherSession=crypto.randomUUID();
  await a.query('insert into auth.users values($1),($2)',[owner,other]);await a.query('insert into auth.sessions values($1,$2),($3,$4)',[session,owner,otherSession,other]);
  const vault='v_synthetic_12345678';await a.query('insert into vault_cloud_snapshots values($1,$2,$3)',[owner,vault,{ciphertext:'owner-only'}]);
  const keys={a:C.random(),b:C.random(),c:C.random()},people=[{id:'a'},{id:'b'},{id:'c'}],entries=[{id:1,title:'Synthetic only',content:'Synthetic secret'}];
  const replica=await C.readReplica(entries,people,keys);replica.guardians=replica.guardians.map(g=>({...g,email:g.id+'@example.invalid'}));const hashes={};for(const id of Object.keys(keys))hashes[id]=await C.hash(keys[id]);
  const rpc=async(action,data={},who=null,client=a)=>(await client.query('select public.estate_release_v2($1,$2,$3) as r',[action,who,data])).rows[0].r;
  const publish=(version,rep=replica)=>rpc('publish',{session,vaultId:vault,version,...rep,reminderDays:30,remindersEnabled:false},owner);
  assert.equal((await rpc('publish',{session:otherSession,vaultId:vault,version:0,...replica},owner)).error,'login_required');
  assert.equal((await publish(0)).version,1);
  assert.equal((await rpc('open',{hash:hashes.a})).error,'two_keys_required');
  assert.equal((await rpc('open',{hash:hashes.a,secondHash:hashes.a})).error,'invalid_keys');
  assert.equal((await rpc('open',{hash:hashes.a,secondHash:'f'.repeat(64)})).error,'invalid_keys');
  const opened=await rpc('open',{hash:hashes.a,secondHash:hashes.b});assert.deepEqual(await C.openReplica(opened,keys.a),{entries});assert(!JSON.stringify(opened).includes('owner-only'));
  await assert.rejects(C.openReplica(opened,keys.c));
  assert.equal((await rpc('open',{hash:'0'.repeat(64)})).error,'invalid_keys');
  assert.equal((await rpc('alarm',{hash:hashes.a})).status,'notifying');
  assert.equal((await rpc('open',{hash:hashes.a})).error,'two_keys_required');
  const job=await rpc('claim');assert.equal(job.kind,'alarm');await rpc('delivered',{id:job.id});
  const started=await a.query('select alarm_started_at,alarm_deadline from estate_private.read_vaults where owner_id=$1',[owner]);assert.equal(started.rows[0].alarm_deadline-started.rows[0].alarm_started_at,24*60*60*1000);
  const confirmation=await rpc('claim');assert.equal(confirmation.kind,'reporter-started');assert.equal(confirmation.recipient,'a@example.invalid');assert.equal(new Date(confirmation.deadline).getTime(),started.rows[0].alarm_deadline.getTime());
  await rpc('delivered',{id:confirmation.id});await rpc('delivered',{id:job.id});
  assert.equal((await a.query("select count(*)::int n from estate_private.delivery_jobs where kind='reporter-started'")).rows[0].n,1);
  assert.equal((await rpc('open',{hash:hashes.a})).error,'two_keys_required');
  const before=await rpc('trustee-status',{hash:hashes.a});await rpc('alarm',{hash:hashes.b});assert.equal((await rpc('trustee-status',{hash:hashes.a})).deadline,before.deadline);
  // Advance isolated server fixture only. No client clock parameter exists in the API.
  await a.query("update estate_private.read_vaults set alarm_deadline=now()-interval '1 millisecond' where owner_id=$1",[owner]);
  assert.deepEqual(await C.openReplica(await rpc('open',{hash:hashes.a}),keys.a),{entries});
  await rpc('cancel',{session},owner);const stopped=await rpc('claim');assert.equal(stopped.kind,'reporter-stopped');assert.equal(stopped.recipient,'a@example.invalid');await rpc('delivered',{id:stopped.id});await rpc('cancel',{session},owner);assert.equal((await a.query("select count(*)::int n from estate_private.delivery_jobs where kind='reporter-stopped'")).rows[0].n,1);assert.equal((await rpc('open',{hash:hashes.a})).error,'two_keys_required');
  await rpc('delivered',{id:job.id});assert.equal((await rpc('open',{hash:hashes.a})).error,'two_keys_required');
  assert.equal((await rpc('alarm',{hash:hashes.a})).error,'cooldown');
  const removed={...replica,guardians:replica.guardians.filter(x=>x.id!=='a')};await publish(1,removed);assert.equal((await rpc('open',{hash:hashes.a,secondHash:hashes.b})).error,'invalid_keys');
  assert.equal((await publish(1)).error,'conflict');
  await assert.rejects(publish(2,{...replica,guardians:[replica.guardians[0],replica.guardians[0]]}));
  await a.query('set role anon');await assert.rejects(rpc('open',{hash:hashes.b,secondHash:hashes.c}));await assert.rejects(a.query('select * from estate_private.read_guardians'));await a.query('reset role');
  await a.query('set role authenticated');await assert.rejects(rpc('cancel',{session},owner));await a.query('reset role');
  // Revoke in one session, start open in another: open must wait then reject.
  await a.query('begin');await a.query('select * from estate_private.read_vaults where owner_id=$1 for update',[owner]);
  let complete=false;const racing=rpc('open',{hash:hashes.b,secondHash:hashes.c},null,b).then(x=>{complete=true;return x;});await new Promise(r=>setTimeout(r,80));assert.equal(complete,false);
  await a.query('delete from estate_private.read_guardians where key_hash=$1',[hashes.b]);await a.query('commit');assert.equal((await racing).error,'invalid_keys');
  // Reminder delivery never changes a canceled alarm into a release.
  await a.query("update estate_private.read_vaults set reminders_enabled=true,next_reminder=now()-interval '1 day' where owner_id=$1",[owner]);const reminder=await rpc('claim');assert.equal(reminder.kind,'reminder');await rpc('delivered',{id:reminder.id});assert.equal((await rpc('trustee-status',{hash:hashes.c})).status,'normal');
  // Legacy contacts keep two-key access, but cannot start an alarm until owner syncs an address.
  await a.query("update estate_private.read_vaults set alarm_block_until=null where owner_id=$1",[owner]);
  await a.query('update estate_private.read_guardians set notification_email=null where key_hash=$1',[hashes.c]);
  assert.equal((await rpc('alarm',{hash:hashes.c})).error,'notification_contact_missing');
  await a.query("update estate_private.read_guardians set notification_email='c@example.invalid' where key_hash=$1",[hashes.c]);
  await rpc('alarm',{hash:hashes.c});const pending=await rpc('claim');assert.equal(pending.kind,'alarm');
  await rpc('cancel',{session},owner);await rpc('delivered',{id:pending.id});
  const pendingStopped=await rpc('claim');assert.equal(pendingStopped.kind,'reporter-stopped');await rpc('delivered',{id:pendingStopped.id});
  assert.equal((await rpc('claim')).id,undefined);assert.equal((await rpc('trustee-status',{hash:hashes.c})).status,'normal');
  await a.query("update estate_private.read_vaults set alarm_block_until=null where owner_id=$1",[owner]);
  await rpc('alarm',{hash:hashes.c});const active=await rpc('claim');await rpc('delivered',{id:active.id});await rpc('cancel',{session},owner);
  assert.equal((await rpc('claim')).id,undefined,'unsent start confirmation is suppressed after cancellation');
  const finalStop=await rpc('claim');assert.equal(finalStop.kind,'reporter-stopped');await rpc('delivered',{id:finalStop.id});
  const wrapped=await C.wrap('a'.repeat(64),'Synthetic password only');assert.equal(await C.unwrap(wrapped,'Synthetic password only'),'a'.repeat(64));await assert.rejects(C.unwrap(wrapped,'wrong'));
  const encrypted=await C.encrypt({entries,trusteeKeys:keys},'a'.repeat(64));assert.deepEqual(await C.decrypt(encrypted,'a'.repeat(64)),{entries,trusteeKeys:keys});assert(!JSON.stringify(replica).includes(keys.a));
  console.log('PASS: PostgreSQL '+(await a.query('show server_version')).rows[0].server_version+'; two keys, timed one key, pending mail, exact 24h, cancel, stale callback, revocation, duplicate keys, CAS, RLS/EXECUTE, cross-owner sessions, concurrent revoke, reminders, encryption/recovery');
 }finally{await a.end();await b.end();}
})().catch(e=>{console.error(e);process.exitCode=1;});
