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
