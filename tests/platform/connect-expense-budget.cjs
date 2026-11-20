// Isolated UI contract for parking and pet-expense Connect; no network or production data.
const assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');
(async()=>{
  const {document}=parseHTML('<html><body><main><input id="expenseCost" value="3.50"><button onclick="saveEvent()">Speichern</button></main></body></html>');
  global.document=document;
  let approve=true;
  global.window={confirm:()=>approve};
  const {mountExpenseConnect}=await import('../../shared/toolya/connect-expense-budget.mjs');
  const records=[{id:101,desc:'Parkhaus',date:'20.11.2026 10:00',cost:3.50}];
  let calls=0,actor='a',responseStatus='imported';
  const controller={ready:true,revision:1,snapshot:()=>({sessions:structuredClone(records)})};
  const client={
    auth:{getUser:async()=>({data:{user:{id:actor,is_anonymous:false}},error:null})},
    from:name=>{assert.equal(name,'user_data');return {select(){return this},eq(){return this},
      maybeSingle:async()=>({data:{revision:1},error:null})};},
    rpc:async(name,args)=>{
      assert.equal(name,'toolya_connect_expense_to_budget');
      assert.deepEqual(args,{p_source_tool:'parkplatz-merker-parkschein-timer',
        p_source_id:'101',p_source_revision:1,p_target_revision:1});
      calls++;return {data:[{status:responseStatus,target_revision:2}],error:null};
    }
  };
  const mounted=mountExpenseConnect({host:document.querySelector('main'),
    saveSelector:'[onclick="saveEvent()"]',costSelector:'#expenseCost',
    controller,client,userId:'a',
    sourceTool:'parkplatz-merker-parkschein-timer',recordsKey:'sessions'});
  const choice=document.getElementById('toolya-connect-expense-choice');
  const retry=document.querySelector('#toolya-connect-expense button');
  assert(choice&&!choice.checked&&!choice.disabled,'valid opt-in must be off by default');
  const amountInput=document.getElementById('expenseCost');
  amountInput.value='0';amountInput.dispatchEvent(new document.defaultView.Event('input'));
  assert.equal(choice.disabled,true,'free activities must not show an actionable transfer');
  amountInput.value='3.50';amountInput.dispatchEvent(new document.defaultView.Event('input'));
  assert.equal(choice.disabled,false);
  choice.checked=true;assert.equal(mounted.selected,true);
  approve=false;
  assert.equal(await mounted.transfer(101),false);
  assert.equal(calls,0);assert.equal(retry.hidden,false);
  approve=true;
  assert.equal(await mounted.transfer(101),true);
  assert.equal(calls,1);assert.equal(retry.hidden,true);
  assert.equal(choice.checked,false);
  responseStatus='already_imported';
  assert.equal(await mounted.transfer(101),true);
  assert.equal(calls,2);
  records[0].cost=0;
  assert.equal(await mounted.transfer(101),false);
  assert.equal(calls,2,'zero-cost records must never transfer');
  records[0].cost=3.50;actor='other';
  assert.equal(await mounted.transfer(101),false);
  assert.equal(calls,2,'account mismatch must not reach RPC');
  mounted.dispose();
  assert.equal(document.getElementById('toolya-connect-expense'),null);
  const fs=require('node:fs');
  for(const [tool,source] of [['parking','parkplatz-merker-parkschein-timer'],
    ['pet-health','haustier-gesundheitspass']]){
    const html=fs.readFileSync('tools/'+tool+'/index.html','utf8');
    assert(html.includes('mountExpenseConnect')&&html.includes(source),
      'missing inline Connect for '+tool);
    assert(html.includes('connectRequested')&&html.includes('.transfer('),
      'missing post-save Connect for '+tool);
    assert(html.includes('SaveInProgress'),'double-submit guard missing: '+tool);
  }
  console.log('PASS: inline opt-in, cancellation/retry, account scope and positive expenses');
})().catch(err=>{console.error(err);process.exitCode=1;});
