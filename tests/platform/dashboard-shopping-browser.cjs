// Isolated signed-in browser fixture. Never connects to a real Supabase account or external service.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
(async()=>{
 const root=path.resolve(__dirname,'../..');
 const contentTypes={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
   '.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
 const server=http.createServer(async(req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const file=path.resolve(root,'.'+decodeURIComponent(pathname).replace(/\/$/,'/index.html'));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try{const data=await fs.readFile(file);res.writeHead(200,{'content-type':contentTypes[path.extname(file)]||'application/octet-stream'});res.end(data)}
  catch{res.writeHead(404).end()}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:375,height:900}});
  const errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.addInitScript(()=>{
   const uid='11111111-1111-4111-8111-111111111111';
   const group='77777777-7777-4777-8777-777777777777';
   const wg={id:group,owner_id:uid,updated_at:'2026-11-20T17:00:00.000Z',
     payload:{shopping:[{id:42,title:'Hafermilch'},{id:43,title:'Kaffee'}],
       cleaning:[{id:71,task:'Küche reinigen',assignee:'Ada',done:false}],
       notes:[{text:'existing-data'}],data:[{id:7,price:3}]}};
   const own=[{id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',user_id:uid,title:'Spülmittel',
     completed:false,revision:1,deleted_at:null,created_at:'2026-11-20T17:00:00Z'}];
   const today=new Date().toLocaleDateString('sv-SE');
   const plusDays=n=>new Date(Date.parse(today+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
   const tools={
    'verliehene-gegenstaende-verwalten':{items:[{id:91,title:'Bohrmaschine',person:'Tim',date:plusDays(-10),returnDate:plusDays(-1),status:'active',note:'Beleg bleibt'}],contacts:[],inventory:[]},
    'autokosten-reifenwechsel':{cars:[{id:4,name:'Kombi'}],events:[{id:9,carId:4,type:'TÜV / HU',date:plusDays(7),title:'HU prüfen'}],tires:[]},
    'haustier-gesundheitspass':{pets:[{id:3,name:'Milo'}],events:[{id:13,petId:3,type:'Impfung',date:plusDays(-340),expiryDate:plusDays(10),title:'Auffrischung'}],meds:[]}
   };
   const snapshots=Object.fromEntries(Object.entries(tools).map(([tool,data])=>[tool,{id:6,user_id:uid,tool,data,revision:1}]));
   const fixture={uid,wg,own,snapshots,writes:[],printCalls:0};
   window.__shoppingFixture=fixture;
   window.print=()=>{fixture.printCalls++;};
   const client={
    auth:{
     async getUser(){return {data:{user:{id:uid,email:'fixture@example.invalid',is_anonymous:false}},error:null};},
     onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}}
    },
    from(table){
     let mode='select',values=null,filters=[];
     const q={
      select(){return q;},
      eq(key,value){filters.push(r=>String(r[key])===String(value));return q;},
      is(key,value){filters.push(r=>r[key]===value);return q;},
      order(){return q;},
      limit(){return Promise.resolve(run());},
      insert(value){mode='insert';values=value;return q;},
      update(value){mode='update';values=value;return q;},
      single(){return Promise.resolve(run(true));},
      maybeSingle(){return Promise.resolve(run(true));},
      then(resolve,reject){return Promise.resolve(run()).then(resolve,reject);}
     };
     const source=()=>table==='wg_spaces'?[fixture.wg]:
       table==='dashboard_shopping_items'?fixture.own:
       table==='user_data'?Object.values(fixture.snapshots):[];
     function run(single=false){
      if(!['wg_spaces','dashboard_shopping_items','dashboard_tasks','dashboard_reminders','user_data'].includes(table))
        return {data:null,error:{message:'unsupported table'}};
      if(mode==='insert'){
       const row={id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',revision:1,deleted_at:null,
         created_at:new Date().toISOString(),...values};
       fixture.own.push(row);fixture.writes.push({table,mode});
       return {data:single?structuredClone(row):[structuredClone(row)],error:null};
      }
      if(mode==='update'){
       const row=source().find(r=>filters.every(fn=>fn(r)));
       if(!row)return {data:single?null:[],error:null};
       Object.assign(row,structuredClone(values));fixture.writes.push({table,mode});
       return {data:single?structuredClone(row):[structuredClone(row)],error:null};
      }
      const data=source().filter(r=>filters.every(fn=>fn(r)));
      return {data:single?structuredClone(data[0]||null):structuredClone(data),error:null};
     }
     return q;
    },
    async rpc(name,args) {
      if(name!=='toolya_save_snapshot'||!fixture.snapshots[args.p_tool])
        return {data:null,error:{message:'unavailable'}};
      const row=fixture.snapshots[args.p_tool];
      if(row.revision!==args.p_expected_revision)return {data:null,error:{code:'40001',message:'revision conflict'}};
      row.data=structuredClone(args.p_data);
      row.revision++;
      fixture.writes.push({table:'user_data',tool:args.p_tool,mode:'rpc'});
      return {data:[{data:structuredClone(row.data),revision:row.revision}],error:null};
    }
   };
   window.supabase={createClient(){return client}};
  });
  await page.route('**/*',route=>{
   const requestUrl=new URL(route.request().url());
   if(requestUrl.origin!==origin)return route.abort();
   if(requestUrl.pathname==='/assets/vendor/supabase-2.57.0.js')
     return route.fulfill({status:200,contentType:'text/javascript',body:''});
   return route.continue();
  });
  const response=await page.goto(origin+'/dashboard/',{waitUntil:'domcontentloaded'});
  assert.equal(response.status(),200);
  await page.waitForFunction(()=>document.querySelector('#shopping-items')?.querySelectorAll('li.shopping-entry').length===3,{timeout:15000});
  assert.equal(await page.locator('#shopping-items .shopping-entry').count(),3);
  await page.waitForFunction(()=>document.querySelectorAll('#tasks li.connect-task').length===4,{timeout:15000});
  assert.equal(await page.locator('#tasks li.connect-task').count(),4);
  assert.equal(await page.getByRole('checkbox',{name:/Verliehene Dinge.*Rückgabe: Bohrmaschine/}).count(),1);
  assert.equal(await page.getByText(/Kombi.*TÜV/).count(),1);
  assert.equal(await page.getByText(/Milo.*Impfung auffrischen/).count(),1);
  assert.equal(await page.locator('#shopping-print').isEnabled(),true);
  await page.getByRole('checkbox',{name:'Hafermilch gekauft'}).click();
  await page.waitForFunction(()=>document.querySelector('#shopping-items').querySelectorAll('li.shopping-entry').length===2);
  assert.equal(await page.evaluate(()=>window.__shoppingFixture.wg.payload.shopping[0].done),true);
  await page.locator('#shopping-show-completed').check();
  await page.waitForFunction(()=>document.querySelector('#shopping-items').querySelectorAll('li.shopping-entry').length===3);
  await page.emulateMedia({media:'print'});
  const doneDisplay=await page.locator('#shopping-items li.done').first().evaluate(e=>getComputedStyle(e).display);
  assert.equal(doneDisplay,'none','purchased items excluded from print');
  await page.emulateMedia({media:'screen'});
  await page.locator('#shopping-print').click();
  assert.equal(await page.evaluate(()=>window.__shoppingFixture.printCalls),1);
  await page.locator('#shopping-title').fill('Reis');
  await page.locator('#shopping-form button[type=submit]').click();
  await page.waitForFunction(()=>document.querySelector('#shopping-items')?.textContent.includes('Reis'));
  assert.equal(await page.locator('#shopping-items li.shopping-entry').count(),4);
  await page.getByRole('checkbox',{name:/WG-Putzplan.*Küche reinigen/}).click();
  await page.waitForFunction(()=>window.__shoppingFixture.wg.payload.cleaning[0].done===true);
  assert.equal(await page.locator('#tasks li.connect-task').count(),3);
  await page.getByRole('checkbox',{name:/Verliehene Dinge.*Rückgabe: Bohrmaschine/}).click();
  await page.waitForFunction(()=>window.__shoppingFixture.snapshots['verliehene-gegenstaende-verwalten'].data.items[0].status==='returned');
  assert.equal(await page.locator('#tasks li.connect-task').count(),2);
  assert.equal(await page.locator('#tasks li.connect-task input[type=checkbox]').count(),0);
  assert.equal(await page.evaluate(()=>window.__shoppingFixture.snapshots['verliehene-gegenstaende-verwalten'].data.items[0].note),'Beleg bleibt');
  assert.equal(await page.evaluate(()=>window.__shoppingFixture.writes.filter(w=>w.table==='user_data').length),1);
  const rest=await page.evaluate(()=>({notes:window.__shoppingFixture.wg.payload.notes,entries:window.__shoppingFixture.wg.payload.data}));
  assert.deepEqual(rest,{notes:[{text:'existing-data'}],entries:[{id:7,price:3}]},'WG data outside lists is not touched');
  // Switch the actual dashboard UI, not a synthetic text replacement. The two
  // remaining car/pet deadlines are read-only, including in the English view.
  const writesBefore=await page.evaluate(()=>window.__shoppingFixture.writes.length);
  await page.locator('[data-dashboard-locale="en"]').click();
  await page.waitForFunction(()=>document.documentElement.dataset.dashboardLocale==='en' &&
    document.querySelectorAll('#tasks li.connect-task').length===2);
  const translated=await page.locator('#tasks').innerText();
  assert.match(translated,/Kombi · Vehicle inspection · HU prüfen/);
  assert.match(translated,/Milo · Vaccination booster due · Auffrischung/);
  assert.match(translated,/Open tool/);
  assert.equal(await page.locator('#tasks li.connect-task input[type=checkbox]').count(),0);
  assert.equal(await page.evaluate(()=>window.__shoppingFixture.writes.length),writesBefore,
    'display-only EN switch must not write any CloudOnly data');
  await page.locator('[data-dashboard-locale="de"]').click();
  await page.waitForFunction(()=>document.documentElement.dataset.dashboardLocale==='de');
  assert.match(await page.locator('#tasks').innerText(),/Kombi · TÜV \/ HU · HU prüfen/);
  assert.equal(await page.evaluate(()=>window.__shoppingFixture.writes.length),writesBefore);
  assert.deepEqual(errors,[],'no unhandled browser errors');
  console.log('PASS: DE/EN source-owned shopping, readonly due dates, print and safe locale change');
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
