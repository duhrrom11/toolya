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
   const fixture={uid,wg,own,writes:[],printCalls:0};
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
       table==='dashboard_shopping_items'?fixture.own:[];
     function run(single=false){
      if(table==='user_data')return {data:single?null:[],error:null};
      if(!['wg_spaces','dashboard_shopping_items','dashboard_tasks','dashboard_reminders'].includes(table))
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
  assert.equal(await page.locator('#tasks li.connect-task').count(),1);
  assert.equal(await page.locator('#shopping-print').isEnabled(),true);
  await page.locator('#shopping-items input[type=checkbox]').first().check();
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
  await page.locator('#tasks li.connect-task input[type=checkbox]').check();
  await page.waitForFunction(()=>window.__shoppingFixture.wg.payload.cleaning[0].done===true);
  assert.equal(await page.locator('#tasks li.connect-task').count(),0);
  const rest=await page.evaluate(()=>({notes:window.__shoppingFixture.wg.payload.notes,entries:window.__shoppingFixture.wg.payload.data}));
  assert.deepEqual(rest,{notes:[{text:'existing-data'}],entries:[{id:7,price:3}]},'WG data outside lists is not touched');
  assert.deepEqual(errors,[],'no unhandled browser errors');
  console.log('PASS: three source-owned shopping rows, acknowledgement, print-only, add and WG task callback');
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
