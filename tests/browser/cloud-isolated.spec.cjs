// Browser-level cloud integration without network calls, real accounts or DB writes.
// Run against the local read-only preview: npm run dev -- --host 127.0.0.1 --port 4173
// Then: npx playwright test tests/browser/cloud-isolated.spec.cjs
const { test, expect } = require('playwright/test');

const origin = 'http://127.0.0.1:4173';

for (const [tool, empty, changed] of [
  ['autokosten-reifenwechsel',
    {cars:[],events:[],tires:[]},
    {cars:[{id:'car-1',name:'Testfahrzeug'}],events:[],tires:[]}],
  ['haushaltsbuch-kassenbon',
    {entries:[],budgets:{},goals:[]},
    {entries:[{id:'entry-1',amount:12}],budgets:{},goals:[]}]
]) {
  test(`${tool}: browser load, save, backup replacement and auth failure (mock only)`, async ({page}) => {
    // Strictly prevent all non-local requests, including Supabase and CDN.
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      return url.origin === origin ? route.continue() : route.abort();
    });
    // Load an inert same-origin document: never execute the real tool UI or its CDN scripts.
    await page.route(origin + '/__toolya_browser_fixture__', route => route.fulfill({
      status: 200, contentType: 'text/html', body: '<!doctype html><title>Toolya isolated cloud fixture</title>'
    }));
    await page.goto(origin + '/__toolya_browser_fixture__');
    const result = await page.evaluate(async ({tool,empty,changed}) => {
      const {prepareCloudTool} = await import('/shared/toolya/cloud-tool-adapters.mjs');
      const {confirmCloudReplacement} = await import('/shared/toolya/cloud-backup.mjs');
      let user = 'browser-fixture', row = null, revision = 0, writes = 0;
      const clone = value => JSON.parse(JSON.stringify(value));
      const client = {
        auth: { async getUser() { return {data:{user:user?{id:user,is_anonymous:false}:null},error:null}; } },
        from(table) {
          if (table !== 'user_data') throw Error('unexpected table');
          const filters = {};
          return {
            select(){return this;},
            eq(key,value){filters[key]=value;return this;},
            async maybeSingle(){
              return {data:row && row.user_id===filters.user_id && row.tool===filters.tool ? clone(row):null,error:null};
            }
          };
        },
        async rpc(name,args) {
          if(name !== 'toolya_save_snapshot') throw Error('unexpected RPC');
          if(args.p_expected_revision !== (row ? revision : null))
            return {data:null,error:{code:'40001',message:'conflict'}};
          revision++;writes++;
          row={user_id:user,tool:args.p_tool,data:clone(args.p_data),revision};
          return {data:[{data:clone(row.data),revision}],error:null};
        }
      };
      const storage={getItem(){return null;},key(){return null;},get length(){return 0;}};
      const prepared=await prepareCloudTool({client,tool,storage});
      const loaded=prepared.controller.snapshot();
      if(JSON.stringify(loaded)!==JSON.stringify(empty)) throw Error('empty snapshot mismatch');
      if(tool==='autokosten-reifenwechsel') await prepared.saveCar(changed);
      else {
        await prepared.saveEntries(changed.entries);
      }
      const saved=prepared.controller.snapshot();
      if(JSON.stringify(saved)!==JSON.stringify(changed)) throw Error('save mismatch');
      const replacement=await confirmCloudReplacement({
        controller:prepared.controller,incoming:empty,
        validate: tool==='autokosten-reifenwechsel'
          ? (await import('/shared/toolya/cloud-controller.mjs')).validateCarSnapshot
          : (await import('/shared/toolya/cloud-controller.mjs')).validateBudgetSnapshot,
        confirm:async()=>true,exportBackup:async()=>true
      });
      if(replacement.status!=='confirmed') throw Error('backup replacement not confirmed: '+replacement.status);
      user=null;
      let blocked=false;
      try { await prepared.controller.replace(changed); } catch(_) { blocked=true; }
      if(!blocked) throw Error('signed-out write not blocked');
      return {writes,loaded,saved,blocked};
    },{tool,empty,changed});
    expect(result.writes).toBe(2);
    expect(result.blocked).toBe(true);
    expect(result.saved).toEqual(changed);
  });
}


test('isolated Chromium: DE/EN dynamic failures preserve literal backend details and never write cloud data', async ({page}) => {
 // Browser runs on an inert same-origin fixture and never opens a real tool or account.
 await page.route('**/*', route => {
  const url = new URL(route.request().url());
  return url.origin === origin ? route.continue() : route.abort();
 });
 await page.route(origin+'/__toolya_i18n_safety__', route => route.fulfill({
  status:200, contentType:'text/html', body:'<!doctype html><html lang="de"><body><output id="status" role="alert"></output></body></html>'
 }));
 await page.setViewportSize({width:320,height:720});
 await page.goto(origin+'/__toolya_i18n_safety__');
 const result = await page.evaluate(async () => {
  const {translateToolDialog,translateAccountStatus} = await import('/shared/toolya/i18n/interface.mjs');
  const status=document.getElementById('status');
  let writes=0;
  const backend='40001: revision conflict; user@example.test';
  const responses=[];
  for(const lang of ['de','en']) {
   document.documentElement.lang=lang;
   const text=translateToolDialog('housemates',lang,'Registrierung fehlgeschlagen: '+backend);
   status.textContent=text;
   responses.push({lang,text:status.textContent,role:status.getAttribute('role')});
  }
  const odd=['__proto__','constructor','toString'].map(key=>({
   key,dialog:translateToolDialog('moving','en',key),
   account:translateAccountStatus('en',key),
   nested:translateToolDialog('housemates','en','Mitgliederverwaltung: '+key)
  }));
  return {responses,odd,writes};
 });
 expect(result.responses).toEqual([
  {lang:'de',text:'Registrierung fehlgeschlagen: 40001: revision conflict; user@example.test',role:'alert'},
  {lang:'en',text:'Registration failed: 40001: revision conflict; user@example.test',role:'alert'}
 ]);
 for(const {key,dialog,account,nested} of result.odd) {
  expect(dialog).toBe(key);
  expect(account).toBe(key);
  expect(nested).toBe('Member management: '+key);
 }
 expect(result.writes).toBe(0);
});

test('Wishes cloud extras: real insert and update handlers retain uncertainty and diagnostic suffix after network rejection',async({page})=>{
 await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
 await page.route('**/tools/wishes/__network-fixture.html*',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="de"><body><header></header><button id="saveWishExtrasCloud">Save</button><button id="updateWishExtrasCloud">Update</button><output id="wishExtrasCloudFeedback" role="status" aria-live="polite"></output></body></html>'}));
 await page.goto(origin+'/tools/wishes/__network-fixture.html?lang=de');
 const result=await page.evaluate(async()=>{
  const response=await fetch('/tools/wishes/app.mjs');
  if(!response.ok)throw Error('Could not load real handlers');
  const source=await response.text();
  const start=source.indexOf('let wishExtrasCloudOperation=0;'),end=source.indexOf("$('restoreHiddenWishes').onclick",start);
  if(start<0||end<=start)throw Error('Cloud handler extraction markers changed');
  const {wishlistErrorMessage}=await import('/tools/wishes/wishlist-utils.mjs');
  const {wishesText}=await import('/shared/toolya/i18n/wishes-copy.mjs');
  const diagnostic='PRIVATE Löschen: fixture@example.invalid / NET-42';
  const original={image_url:null,target_price:12,quantity:1,wish_status:'open',version:7};
  const attempts=[],filters=[],reports=[];
  const user={id:'fixture-owner'},editingWishId='fixture-wish',editingWishBaseline={id:editingWishId},wishEditorRevision=1;
  const db={from(table){
   if(table!=='wishlist_wish_extras')throw Error('Unexpected table');
   let operation='read';const q={select:()=>q,eq:(key,value)=>{if(operation==='update')filters.push([key,value]);return q},maybeSingle:async()=>({data:structuredClone(original),error:null})};
   for(const method of ['insert','update'])q[method]=()=>{operation=method;attempts.push(method);return q};
   const reject=()=>Promise.reject(new Error(diagnostic));
   q.single=reject;q.then=(resolve,rejectFn)=>reject().then(resolve,rejectFn);return q;
  }};
  const $=id=>document.getElementById(id);
  const run=fn=>fn,requireUser=()=>user.id,readValidatedWishExtras=()=>({imageUrl:'',price:15,quantity:2,status:'open'});
  const buddy={confirm:async()=>true},wishCopy=(de,en)=>document.documentElement.lang==='en'?en:de,report=value=>reports.push(value);
  // Execute the unchanged source handlers with a narrow injected fixture, not the full account bootstrap.
  new Function('$','run','requireUser','user','editingWishId','editingWishBaseline','wishEditorRevision','readValidatedWishExtras','db','wishlistErrorMessage','buddy','wishCopy','report',source.slice(start,end))($,run,requireUser,user,editingWishId,editingWishBaseline,wishEditorRevision,readValidatedWishExtras,db,wishlistErrorMessage,buddy,wishCopy,report);
  await import('/shared/toolya/i18n/wishes-entry.mjs');
  const messages=[];
  for(const lang of ['de','en','de']){
   document.querySelector('[data-wishes-locale="'+lang+'"]').click();
   for(const id of ['saveWishExtrasCloud','updateWishExtrasCloud']){
    await $(id).onclick();
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    messages.push({lang,id,text:$('wishExtrasCloudFeedback').textContent});
   }
  }
  return {messages,attempts,filters,reports,original,diagnostic};
 });
 const prefixes={
  de:['Cloud-Speicherung wegen Netzwerkfehler fehlgeschlagen. Ob die Anfrage den Server erreicht hat, ist unklar; bitte Cloud-Stand prüfen, bevor du erneut speicherst. ','Cloud-Aktualisierung durch Netzwerkfehler unterbrochen. Ob sie gespeichert wurde, ist unklar; bitte den Cloud-Stand erneut prüfen. '],
  en:['Cloud saving failed because of a network error. It is unclear whether the request reached the server; check the cloud state before saving again. ','The cloud update was interrupted by a network error. It is unclear whether it was saved; check the cloud state again. ']
 };
 for(const item of result.messages)expect(item.text).toBe(prefixes[item.lang][item.id==='saveWishExtrasCloud'?0:1]+result.diagnostic);
 expect(result.attempts).toEqual(['insert','update','insert','update','insert','update']);
 expect(result.filters).toEqual(Array.from({length:3},()=>[['user_id','fixture-owner'],['wish_id','fixture-wish'],['version',7]]).flat());
 expect(result.reports).toEqual([]);
 expect(result.original).toEqual({image_url:null,target_price:12,quantity:1,wish_status:'open',version:7});
});
