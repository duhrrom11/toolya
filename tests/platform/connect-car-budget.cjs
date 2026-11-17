// Isolated Connect client contract. No credentials, production data or network.
const assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{
  const {document}=parseHTML('<html><body><main><button onclick="saveEvent()">Eintrag speichern</button></main></body></html>');
  global.document=document;
  let accepted=true;
  global.window={confirm:()=>accepted};
  const {mountCarBudgetConnect}=await import(pathToFileURL(path.resolve('shared/toolya/connect-car-budget.mjs')).href);
  const data={events:[
    {id:5,title:'Tanken',cost:45.25,date:'2026-11-01'},
    {id:6,title:'Kostenlos',cost:0,date:'2026-11-02'}
  ]};
  let calls=0, current='user-a', status='imported', expectedRevision=4;
  const controller={get ready(){return true},get revision(){return 3},snapshot(){return structuredClone(data)}};
  const client={
    auth:{async getUser(){return {data:{user:{id:current,is_anonymous:false}},error:null}}},
    from(name){
      assert.equal(name,'user_data');
      return {select(){return this},eq(){return this},async maybeSingle(){
        return {data:{revision:expectedRevision},error:null};
      }};
    },
    async rpc(name,args){
      calls++;
      assert.equal(name,'toolya_connect_car_to_budget');
      assert.deepEqual(args,{p_source_id:'5',p_source_revision:3,p_target_revision:4});
      return {data:[{status,receipt_id:12,target_revision:5}],error:null};
    }
  };
  const panel=mountCarBudgetConnect({host:document.querySelector('main'),controller,client,userId:'user-a'});
  const choice=document.querySelector('#toolya-connect-budget-choice');
  assert(choice,'opt-in must appear next to expense save button');
  assert.equal(Boolean(choice.checked),false,'opt-in is off by default');
  choice.checked=true;
  assert.equal(panel.selected,true);
  await panel.transferEvent(5);
  assert.equal(calls,1);
  assert.match(document.querySelector('[role=status]').textContent,/bestätigt/);
  assert.equal(Boolean(choice.checked),false,'successful transfer clears opt-in');
  accepted=false;
  assert.equal(await panel.transferEvent(5),false);
  const retry=document.querySelector('#toolya-connect-car-budget button');
  assert.equal(retry.hidden,false,'cancelled Connect can be retried from the same expense');
  assert.equal(calls,1,'cancel must not call RPC');
  accepted=true;
  status='already_imported';
  await panel.transferEvent(5);
  assert.equal(calls,2);
  assert.equal(retry.hidden,true,'confirmed transfer hides retry');
  assert.match(document.querySelector('[role=status]').textContent,/keine Doppelbuchung/);
  current='user-b';
  assert.equal(await panel.transferEvent(5),false);
  assert.equal(calls,2,'account change must fail closed before RPC');
  panel.dispose();
  assert.equal(document.querySelector('#toolya-connect-car-budget'),null);

  const fs=require('node:fs');
  const migration=fs.readFileSync('supabase/migrations/20261117180000_toolya_connect_car_budget.sql','utf8');
  for (const rule of [
    /create table if not exists public\.connect_transfers/,
    /constraint connect_transfer_unique unique/,
    /enable row level security/,
    /security definer set search_path = ''/,
    /coalesce\(\(auth\.jwt\(\)->>'is_anonymous'\)/,
    /where user_id=v_uid and tool='autokosten-reifenwechsel' for update/,
    /where user_id=v_uid and tool='haushaltsbuch-kassenbon' for update/,
    /where id=v_target\.id and user_id=v_uid and revision=p_target_revision/,
    /revoke all on table public\.connect_transfers from anon, authenticated/,
    /revoke all on function public\.toolya_connect_car_to_budget/
  ]) assert.match(migration,rule);
  const html=fs.readFileSync('tools/car/index.html','utf8');
  assert.match(html,/mountCarBudgetConnect/);
  assert.match(html,/connectRequested/);
  assert.match(html,/transferEvent\(newEventId\)/);
  assert.match(html,/carEventSaveInProgress/);
  assert.match(html,/const connectRequested = Boolean\(window\.toolyaCarConnectPanel\?\.selected\)/);
  assert.match(html,/Beleg konnte nicht verarbeitet werden/);
  console.log('PASS: isolated explicit Connect UI, account guard, RPC contract, migration structural checks');
})().catch(error=>{console.error(error);process.exitCode=1});
