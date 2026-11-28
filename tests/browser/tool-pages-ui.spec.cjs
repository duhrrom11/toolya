// Real Toolya HTML UI in Chromium. No external network, real account or database.
const {test,expect}=require('playwright/test');
const origin='http://127.0.0.1:4173';
const tools=[
  {path:'/tools/car/index.html',title:'Autokosten-Rechner',tool:'autokosten-reifenwechsel',form:'#carName'},
  {path:'/tools/budget/index.html',title:'Haushaltsbuch mit Kassenbon-Scanner',tool:'haushaltsbuch-kassenbon',form:'#receiptTitle'}
];
async function isolated(page,authenticated,displayCss=false,initialSnapshot=null){
  const outbound=[];
  page.on('pageerror',error=>console.log('[UI pageerror]',error.message));
  page.on('console',msg=>{if(msg.text().includes('[mock rpc]'))console.log('[browser]',msg.text());});
  await page.route('**/*',async route=>{
    const url=route.request().url();
    if(url.startsWith('http://127.0.0.1:4173/')){
      if(/^\/assets\/vendor\/supabase-2\.(?:57\.0|119\.2)\.js$/.test(new URL(url).pathname)){
        return route.fulfill({status:200,contentType:'text/javascript',body:`
          window.__toolyaMock={writes:[],signedIn:${authenticated},fixture:${JSON.stringify(initialSnapshot)}};
          window.supabase={createClient(){
            const m=window.__toolyaMock;
            return {
              auth:{
                async getUser(){return {data:{user:m.signedIn?{id:'ui-fixture-user',email:'mock@example.invalid',is_anonymous:false}:null},error:null}},
                async getSession(){return {data:{session:null},error:null}},
                onAuthStateChange(listener){
                  if(m.fixture?.__recovery)(m.authListeners??=[]).push(listener);
                   queueMicrotask(()=>listener('INITIAL_SESSION',m.signedIn?{access_token:'ui-fixture-token',user:{id:'ui-fixture-user'}}:null));
                  return {data:{subscription:{unsubscribe(){}}}};
                },
                async signOut(){m.signedIn=false;return {error:null}},
                async signInWithPassword(){m.signedIn=true;return {data:{user:{id:'ui-fixture-user'}},error:null}}
              },
              from(table){
                if(table==='wg_spaces'&&m.fixture?.__wg){
                  return {select(){return this},eq(){return this},async single(){m.wgReads=(m.wgReads||0)+1;return {data:m.fixture.__wg,error:null}},
                   update(){m.writes.push({table,operation:'update'});throw Error('Unexpected WG design-fixture write')},
                   insert(){m.writes.push({table,operation:'insert'});throw Error('Unexpected WG design-fixture write')},
                   delete(){m.writes.push({table,operation:'delete'});throw Error('Unexpected WG design-fixture write')}};
                }
                if(m.fixture?.__dashboard && ['dashboard_tasks','dashboard_reminders'].includes(table)){
                  const rows=table==='dashboard_tasks'?[{
                    id:'fixture-task',user_id:'ui-fixture-user',title:'Isolierte Aufgabe mit langem Text für die Prüfung der mobilen Bedienfläche und der Schaltfläche zum Entfernen',
                    completed:false,revision:1,deleted_at:null,due_at:null,created_at:'2026-11-20T12:00:00Z'
                  }]:[{
                    id:'fixture-reminder',user_id:'ui-fixture-user',title:'Isolierte Erinnerung mit langem Text',
                    completed:false,revision:1,deleted_at:null,due_at:'2030-01-01T12:00:00Z',created_at:'2026-11-20T12:00:00Z'
                  }];
                  const q={select(){return q},eq(){return q},is(){return q},order(){return q},async limit(){return {data:rows,error:null}}};
                  return q;
                }
                if(table!=='user_data')throw Error('unexpected table '+table);
                return {select(){return this},eq(key,value){if(key==='tool')this.tool=value;return this},async maybeSingle(){return {data:m.fixture&&!m.fixture.__dashboard?{id:1,user_id:'ui-fixture-user',tool:this.tool,data:m.fixture,revision:1}:null,error:null}}};
              },
              async rpc(name,args){
                if(name!=='toolya_save_snapshot')throw Error('unexpected RPC '+name);
                console.log('[mock rpc]',name,JSON.stringify(args).slice(0,220));
                m.writes.push(JSON.parse(JSON.stringify(args)));
                return {data:[{data:args.p_data,revision:m.writes.length}],error:null};
              }
            };
          }};
        `});
      }
      return route.continue();
    }
    // Only design checks allow the existing display-only Tailwind CDN; application traffic stays intercepted.
    if(displayCss && new URL(url).hostname==='cdn.tailwindcss.com' && route.request().method()==='GET')return route.continue();
    // Chart.js is a display-only dependency. Replace its CDN script with a
    // deterministic inert chart to keep the real budget UI executable offline.
    if(url.startsWith('https://cdn.jsdelivr.net/npm/chart.js')){
      return route.fulfill({status:200,contentType:'text/javascript',
        body:'window.Chart=class{constructor(ctx,config){this.data=config.data;this.options=config.options}update(){}destroy(){}};'});
    }
    outbound.push(url);
    return route.abort();
  });
  return outbound;
}
for(const item of tools){
  test(item.tool+': unauthenticated UI remains blocked',async({page})=>{
    const outbound=await isolated(page,false);
    await page.goto(origin+item.path);
    // The current verified-account gate redirects unauthenticated users home.
    // Old inline #toolya-cloud-gate assertions predate auth-page-gate.js.
    await expect(page).toHaveURL(/\/index\.html$/);
  await expect(page.locator('#settingsModal')).toBeVisible();
    await expect(page.locator(item.form)).toHaveCount(0);
    expect(outbound.every(u=>!u.startsWith(origin))).toBe(true);
  });
  test(item.tool+': cloud write failure blocks UI and never claims saved',async({page})=>{
    await isolated(page,true);
    await page.goto(origin+item.path);
    // The gate can be absent before async boot even starts. Wait for the real cloud-ready state.
    await expect.poll(()=>page.evaluate(()=>typeof toolyaCloudReady !== 'undefined' && toolyaCloudReady && !!toolyaCloudController?.ready)).toBe(true);
    await expect(page.locator('#toolya-cloud-gate')).toHaveCount(0);
    await page.evaluate(()=>{
      window.__toolyaMock.writes.length=0;
      window.supabaseClient.rpc=async()=>({data:null,error:{code:'40001',message:'mock conflict'}});
    });
    page.on('dialog',dialog=>{console.log('[UI dialog]',dialog.message());return dialog.dismiss();});
    if(item.tool==='autokosten-reifenwechsel'){
      await page.evaluate(async()=>{
        document.querySelector('#carName').value='Nicht gespeichert';
        if(document.querySelector('#carName').value!=='Nicht gespeichert') throw Error('Vehicle fixture not set');
        await saveCar();
      });
    }else{
      await page.evaluate(async()=>{
        document.querySelector('#receiptTitle').value='Nicht gespeichert';
        document.querySelector('#receiptDate').value='2026-11-15';
        document.querySelector('#receiptPrice').value='12.50';
        if(document.querySelector('#receiptTitle').value!=='Nicht gespeichert') throw Error('Receipt fixture not set');
        await saveReceipt();
      });
    }
    console.log('[UI diagnostic]',item.tool,await page.evaluate(()=>({url:location.href,ready:toolyaCloudReady,online:navigator.onLine,revision:toolyaCloudController?.revision,writes:window.__toolyaMock.writes.length,gate:document.querySelector('#toolya-cloud-gate')?.textContent,form:document.querySelector('#receiptTitle')?.value,car:document.querySelector('#carName')?.value})));
    await expect(page.locator('#toolya-cloud-gate')).toContainText('Toolya konnte die Speicherung nicht bestätigen');
    expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
  });
  test(item.tool+': authenticated UI loads real page with mock cloud',async({page})=>{
    const outbound=await isolated(page,true);
    await page.goto(origin+item.path);
    await expect(page.locator('.b3-tool-title h1')).toContainText(item.title);
    // The gate can be absent before async boot even starts. Wait for the real cloud-ready state.
    await expect.poll(()=>page.evaluate(()=>typeof toolyaCloudReady !== 'undefined' && toolyaCloudReady && !!toolyaCloudController?.ready)).toBe(true);
    await expect(page.locator('#toolya-cloud-gate')).toHaveCount(0);
    await expect(page.locator(item.form)).toBeVisible();
    if(item.tool==='autokosten-reifenwechsel'){
      await page.evaluate(async()=>{
        document.querySelector('#carName').value='Mock-Fahrzeug';
        if(document.querySelector('#carName').value!=='Mock-Fahrzeug') throw Error('Vehicle fixture not set');
        await saveCar();
      });
    }else{
      await page.evaluate(async()=>{
        document.querySelector('#receiptTitle').value='Mock-Einkauf';
        document.querySelector('#receiptDate').value='2026-11-15';
        document.querySelector('#receiptPrice').value='12.50';
        if(document.querySelector('#receiptTitle').value!=='Mock-Einkauf') throw Error('Receipt fixture not set');
        await saveReceipt();
      });
    }
    console.log('[UI diagnostic]',item.tool,await page.evaluate(()=>({ready:toolyaCloudReady,online:navigator.onLine,revision:toolyaCloudController?.revision,writes:window.__toolyaMock.writes.length,gate:document.querySelector('#toolya-cloud-gate')?.textContent,form:document.querySelector('#receiptTitle')?.value})));
    await expect.poll(()=>page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(1);
    const persisted=await page.evaluate(()=>window.__toolyaMock.writes[0].p_data);
    if(item.tool==='autokosten-reifenwechsel'){
      expect(persisted.cars.some(car=>car.name==='Mock-Fahrzeug')).toBe(true);
    }else{
      expect(persisted.entries.some(entry=>entry.title==='Mock-Einkauf')).toBe(true);
    }
    await page.locator('#settingsBtn').dispatchEvent('click');
    await expect(page.locator('#settingsModal')).toBeVisible();
    page.on('dialog',dialog=>dialog.dismiss());
    await page.evaluate(async()=>{
      await window.supabaseClient.auth.signOut();
      await window.toolyaCloudSave({__test_only:true});
    });
    await expect(page.locator('#toolya-cloud-gate')).toBeVisible();
    expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(1);
    expect(outbound.every(u=>!u.startsWith(origin))).toBe(true);
  });
}


test('autokosten-reifenwechsel: attached images await confirmed cloud save',async({page})=>{
  await isolated(page,true);
  await page.goto(origin+'/tools/car/index.html');
  await expect.poll(()=>page.evaluate(()=>typeof toolyaCloudReady!=='undefined' && toolyaCloudReady && !!toolyaCloudController?.ready)).toBe(true);
  await page.locator('#carPhotoInput').setInputFiles({name:'fixture.png',mimeType:'image/png',buffer:Buffer.from([137,80,78,71,13,10,26,10])});
  await page.locator('#carPapersInput').setInputFiles({name:'paper.png',mimeType:'image/png',buffer:Buffer.from([137,80,78,71,13,10,26,10])});
  const result=await page.evaluate(async()=>{
    // Controlled asynchronous compressor: no image decoding or external assets.
    compressImage=(file,callback)=>setTimeout(()=>callback('data:mock/'+file.name),10);
    document.querySelector('#carName').value='Fahrzeug mit Anhängen';
    await saveCar();
    return {writes:window.__toolyaMock.writes.length,
      car:window.__toolyaMock.writes[0]?.p_data?.cars?.[0],
      cleared:document.querySelector('#carName').value===''};
  });
  expect(result.writes).toBe(1);
  expect(result.car).toMatchObject({name:'Fahrzeug mit Anhängen',photo:'data:mock/fixture.png',papers:'data:mock/paper.png'});
  expect(result.cleared).toBe(true);
});


test('umzugskisten-inventar: unauthenticated browser cannot write',async({page})=>{
  await isolated(page,false);
  await page.goto(origin+'/tools/moving/index.html');
  await expect(page).toHaveURL(/\/index\.html$/);
  await expect(page.locator('#settingsModal')).toBeVisible();
  // The protected tool has navigated away; no authenticated cloud UI is available.
  await expect(page.locator('#toolya-cloud-gate')).toHaveCount(0);
});
test('umzugskisten-inventar: cloud-confirmed location save and blocked failure',async({page})=>{
  await isolated(page,true);
  await page.goto(origin+'/tools/moving/index.html');
  await expect.poll(()=>page.evaluate(()=>movingCloudReady && !!movingCloudController?.ready)).toBe(true);
  await page.evaluate(async()=>{
    document.querySelector('#locName').value='Keller';
    await saveLocation();
  });
  const result=await page.evaluate(()=>({
    writes:window.__toolyaMock.writes.length,
    snapshot:window.__toolyaMock.writes[0]?.p_data,
    input:document.querySelector('#locName').value
  }));
  expect(result.writes).toBe(1);
  expect(result.snapshot.locations[0].name).toBe('Keller');
  expect(result.input).toBe('');
  page.on('dialog',dialog=>dialog.dismiss());
  await page.evaluate(async()=>{
    window.supabaseClient.rpc=async()=>({data:null,error:{code:'40001',message:'mock conflict'}});
    document.querySelector('#locName').value='Dachboden';
    await saveLocation();
  });
  await expect(page.locator('#toolya-cloud-gate')).toContainText('Toolya konnte die Speicherung nicht bestätigen');
  expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(1);
  expect(await page.locator('#locName').inputValue()).toBe('Dachboden');
});


test('umzugskisten-inventar: box photo waits for confirmed cloud write',async({page})=>{
  await isolated(page,true);
  await page.goto(origin+'/tools/moving/index.html');
  await expect.poll(()=>page.evaluate(()=>movingCloudReady && !!movingCloudController?.ready)).toBe(true);
  await page.evaluate(async()=>{
    await saveData({locations:[{id:1,name:'Keller'}],boxes:[]});
    loadLocationsDropdown();
    document.querySelector('#boxLocationSelect').value='1';
    document.querySelector('#boxName').value='Fotokiste';
  });
  await page.locator('#boxPhotoInput').setInputFiles({
    name:'kiste.png',mimeType:'image/png',buffer:Buffer.from([137,80,78,71,13,10,26,10])
  });
  const result=await page.evaluate(async()=>{
    const OriginalReader=window.FileReader;
    window.FileReader=class {
      readAsDataURL(){setTimeout(()=>{this.result='data:image/png;base64,MOCK';this.onload?.()},15)}
    };
    try {await saveBox()} finally {window.FileReader=OriginalReader}
    return {writes:window.__toolyaMock.writes.length,
      photo:window.__toolyaMock.writes.at(-1)?.p_data?.boxes?.[0]?.photo,
      cleared:document.querySelector('#boxName').value===''};
  });
  expect(result.writes).toBe(2);
  expect(result.photo).toBe('data:image/png;base64,MOCK');
  expect(result.cleared).toBe(true);
});


test('verliehene-gegenstaende: unauthenticated UI blocks writes',async({page})=>{
  await isolated(page,false);
  await page.goto(origin+'/tools/loans/index.html');
  await expect(page).toHaveURL(/\/index\.html$/);
  await expect(page.locator('#settingsModal')).toBeVisible();
  // The protected tool has navigated away; no authenticated cloud UI is available.
  await expect(page.locator('#toolya-cloud-gate')).toHaveCount(0);
});
test('verliehene-gegenstaende: contact saved only after cloud confirmation',async({page})=>{
  await isolated(page,true);
  await page.goto(origin+'/tools/loans/index.html');
  await expect.poll(()=>page.evaluate(()=>loansCloudReady && !!loansCloudController?.ready)).toBe(true);
  page.on('dialog',dialog=>dialog.dismiss());
  await page.evaluate(async()=>{
    document.querySelector('#contactName').value='Anna';
    await saveContact();
  });
  const state=await page.evaluate(()=>({
    writes:window.__toolyaMock.writes.length,
    contact:window.__toolyaMock.writes[0]?.p_data?.contacts?.[0]?.name,
    cleared:document.querySelector('#contactName').value===''
  }));
  expect(state).toMatchObject({writes:1,contact:'Anna',cleared:true});
  await page.evaluate(async()=>{
    supabaseClient.rpc=async()=>({data:null,error:{code:'40001',message:'mock conflict'}});
    document.querySelector('#contactName').value='Nicht gespeichert';
    await saveContact();
  });
  await expect(page.locator('#toolya-cloud-gate')).toContainText('Toolya konnte die Speicherung nicht bestätigen');
  expect(await page.locator('#contactName').inputValue()).toBe('Nicht gespeichert');
  expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(1);
});
test('verliehene-gegenstaende: photo compression awaited before write',async({page})=>{
  await isolated(page,true);
  await page.goto(origin+'/tools/loans/index.html');
  await expect.poll(()=>page.evaluate(()=>loansCloudReady && !!loansCloudController?.ready)).toBe(true);
  await page.locator('#itemPhotoInput').setInputFiles({name:'photo.png',mimeType:'image/png',buffer:Buffer.from([137,80,78,71,13,10,26,10])});
  const result=await page.evaluate(async()=>{
    compressImage=(file,callback)=>setTimeout(()=>callback('data:mock/'+file.name),15);
    document.querySelector('#itemInventorySelect').value='';
    document.querySelector('#itemCustomPerson').value='Anna';
    document.querySelector('#itemDate').value='2026-11-15';
    const originalPrompt=window.prompt;window.prompt=()=> 'Bohrer';
    try {await saveItem()} finally {window.prompt=originalPrompt}
    return {writes:window.__toolyaMock.writes.length,
      photo:window.__toolyaMock.writes[0]?.p_data?.items?.[0]?.photo};
  });
  expect(result).toMatchObject({writes:1,photo:'data:mock/photo.png'});
});


test('zaehlerstaende-erfassen: unauthenticated browser cannot write',async({page})=>{
  await isolated(page,false);
  await page.goto(origin+'/tools/meters/index.html');
  await expect(page).toHaveURL(/\/index\.html$/);
  await expect(page.locator('#settingsModal')).toBeVisible();
  // The protected tool has navigated away; no authenticated cloud UI is available.
  await expect(page.locator('#toolya-cloud-gate')).toHaveCount(0);
});
test('zaehlerstaende-erfassen: cloud confirmed tariff and blocked conflict',async({page})=>{
  await isolated(page,true);
  await page.goto(origin+'/tools/meters/index.html');
  await expect.poll(()=>page.evaluate(()=>metersCloudReady && !!metersCloudController?.ready)).toBe(true);
  page.on('dialog',dialog=>dialog.dismiss());
  await page.evaluate(async()=>{
    document.querySelector('#tariffStromPriceHT').value='0.32';
    await saveTarifs();
  });
  const result=await page.evaluate(()=>({
    writes:window.__toolyaMock.writes.length,
    price:window.__toolyaMock.writes[0]?.p_data?.tarifs?.Strom?.priceHT
  }));
  expect(result).toMatchObject({writes:1,price:0.32});
  await page.evaluate(async()=>{
    supabaseClient.rpc=async()=>({data:null,error:{code:'40001',message:'mock conflict'}});
    document.querySelector('#tariffStromPriceHT').value='0.44';
    await saveTarifs();
  });
  await expect(page.locator('#toolya-cloud-gate')).toContainText('Toolya konnte die Speicherung nicht bestätigen');
  expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(1);
});
test('zaehlerstaende-erfassen: photo processing precedes confirmed cloud write',async({page})=>{
  await isolated(page,true);
  await page.goto(origin+'/tools/meters/index.html');
  await expect.poll(()=>page.evaluate(()=>metersCloudReady && !!metersCloudController?.ready)).toBe(true);
  await page.locator('#meterPhotoInput').setInputFiles({name:'meter.png',mimeType:'image/png',buffer:Buffer.from([137,80,78,71,13,10,26,10])});
  const result=await page.evaluate(async()=>{
    compressImage=(file,callback)=>setTimeout(()=>callback('data:mock/'+file.name),15);
    document.querySelector('#meterDate').value='2026-11-15';
    document.querySelector('#meterValue').value='120';
    await saveReading();
    return {writes:window.__toolyaMock.writes.length,
      photo:window.__toolyaMock.writes[0]?.p_data?.readings?.[0]?.photo};
  });
  expect(result).toMatchObject({writes:1,photo:'data:mock/meter.png'});
});


test('pflanzenpflege-giessplan: unauthenticated browser blocks writes',async({page})=>{
  await isolated(page,false);
  await page.goto(origin+'/tools/plants/index.html');
  await expect(page).toHaveURL(/\/index\.html$/);
  await expect(page.locator('#settingsModal')).toBeVisible();
  // The protected tool has navigated away; no authenticated cloud UI is available.
  await expect(page.locator('#toolya-cloud-gate')).toHaveCount(0);
});
test('pflanzenpflege-giessplan: confirmed save and cloud conflict',async({page})=>{
  await isolated(page,true);
  await page.goto(origin+'/tools/plants/index.html');
  await expect.poll(()=>page.evaluate(()=>plantsCloudReady&&!!plantsCloudController?.ready)).toBe(true);
  const result=await page.evaluate(async()=>{
    const data=getData();data.plants.push({id:1,name:'Rose'});
    const saved=await saveData(data);
    return {saved,writes:window.__toolyaMock.writes.length,plant:window.__toolyaMock.writes[0]?.p_data?.plants?.[0]?.name};
  });
  expect(result).toMatchObject({saved:true,writes:1,plant:'Rose'});
  await page.evaluate(async()=>{
    supabaseClient.rpc=async()=>({data:null,error:{code:'40001',message:'conflict'}});
    await saveData({...getData(),plants:[]});
  });
  await expect(page.locator('#toolya-cloud-gate')).toContainText('Toolya konnte die Speicherung nicht bestätigen');
  expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(1);
});
test('pflanzenpflege-giessplan: plant photo awaits compression before cloud write',async({page})=>{
  await isolated(page,true);
  await page.goto(origin+'/tools/plants/index.html');
  await expect.poll(()=>page.evaluate(()=>plantsCloudReady&&!!plantsCloudController?.ready)).toBe(true);
  await page.locator('#plantPhotoInput').setInputFiles({name:'plant.png',mimeType:'image/png',buffer:Buffer.from([137,80,78,71,13,10,26,10])});
  const result=await page.evaluate(async()=>{
    compressImage=(file,callback)=>setTimeout(()=>callback('data:mock/'+file.name),15);
    document.querySelector('#plantName').value='Rose';
    document.querySelector('#plantLastWatered').value='2026-11-15';
    document.querySelector('#plantInterval').value='7';
    await savePlant();
    return {writes:window.__toolyaMock.writes.length,photo:window.__toolyaMock.writes[0]?.p_data?.plants?.[0]?.photo};
  });
  expect(result).toMatchObject({writes:1,photo:'data:mock/plant.png'});
});


test('parkplatz-merker-parkschein-timer: unauthenticated browser cannot write',async({page})=>{
  await isolated(page,false);
  await page.goto(origin+'/tools/parking/index.html');
  await expect(page).toHaveURL(/\/index\.html$/);
  await expect(page.locator('#settingsModal')).toBeVisible();
  // The protected tool has navigated away; no authenticated cloud UI is available.
  await expect(page.locator('#toolya-cloud-gate')).toHaveCount(0);
});
test('parkplatz-merker-parkschein-timer: confirmed parking save and blocked conflict',async({page})=>{
  await isolated(page,true);
  await page.goto(origin+'/tools/parking/index.html');
  await expect.poll(()=>page.evaluate(()=>parkingCloudReady&&!!parkingCloudController?.ready)).toBe(true);
  const result=await page.evaluate(async()=>{
    const saved=await saveData({sessions:[{id:1,desc:'Bahnhof',cost:2,gps:null}]});
    return {saved,writes:window.__toolyaMock.writes.length,desc:window.__toolyaMock.writes[0]?.p_data?.sessions?.[0]?.desc};
  });
  expect(result).toMatchObject({saved:true,writes:1,desc:'Bahnhof'});
  await page.evaluate(async()=>{
    supabaseClient.rpc=async()=>({data:null,error:{code:'40001',message:'conflict'}});
    await saveData({sessions:[]});
  });
  await expect(page.locator('#toolya-cloud-gate')).toContainText('Toolya konnte die Speicherung nicht bestätigen');
  expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(1);
});
test('parkplatz-merker-parkschein-timer: cloud-backed parking timer',async({page})=>{
  await isolated(page,true);
  await page.goto(origin+'/tools/parking/index.html');
  await expect.poll(()=>page.evaluate(()=>parkingCloudReady&&!!parkingCloudController?.ready)).toBe(true);
  const result=await page.evaluate(async()=>{
    await startTimer(30);
    const end=getData().activeEndTime;
    await stopTimer();
    return {end,writes:window.__toolyaMock.writes.length,stopped:getData().activeEndTime};
  });
  expect(result.end).toBeGreaterThan(Date.now());
  expect(result.writes).toBe(2);
  expect(result.stopped).toBeNull();
});


test('haustier-gesundheitspass: unauthenticated browser cannot write',async({page})=>{
  await isolated(page,false);
  await page.goto(origin+'/tools/pet-health/index.html');
  await expect(page).toHaveURL(/\/index\.html$/);
  await expect(page.locator('#settingsModal')).toBeVisible();
  // The protected tool has navigated away; no authenticated cloud UI is available.
  await expect(page.locator('#toolya-cloud-gate')).toHaveCount(0);
});
test('haustier-gesundheitspass: confirmed save and blocked conflict',async({page})=>{
  await isolated(page,true);
  await page.goto(origin+'/tools/pet-health/index.html');
  await expect.poll(()=>page.evaluate(()=>petCloudReady&&!!petCloudController?.ready)).toBe(true);
  const result=await page.evaluate(async()=>{
    const saved=await saveData({pets:[{id:1,name:'Milo'}],events:[],meds:[]});
    return {saved,writes:window.__toolyaMock.writes.length,name:window.__toolyaMock.writes[0]?.p_data?.pets?.[0]?.name};
  });
  expect(result).toMatchObject({saved:true,writes:1,name:'Milo'});
  await page.evaluate(async()=>{
    supabaseClient.rpc=async()=>({data:null,error:{code:'40001',message:'conflict'}});
    await saveData({pets:[],events:[],meds:[]});
  });
  await expect(page.locator('#toolya-cloud-gate')).toContainText('Toolya konnte die Speicherung nicht bestätigen');
  expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(1);
});
test('haustier-gesundheitspass: photo processing precedes confirmed cloud write',async({page})=>{
  await isolated(page,true);
  await page.goto(origin+'/tools/pet-health/index.html');
  await expect.poll(()=>page.evaluate(()=>petCloudReady&&!!petCloudController?.ready)).toBe(true);
  await page.locator('#petPhotoInput').setInputFiles({name:'pet.png',mimeType:'image/png',buffer:Buffer.from([137,80,78,71,13,10,26,10])});
  const result=await page.evaluate(async()=>{
    compressImage=(file,callback)=>setTimeout(()=>callback('data:mock/'+file.name),15);
    document.querySelector('#petName').value='Milo';
    await savePet();
    return {writes:window.__toolyaMock.writes.length,photo:window.__toolyaMock.writes[0]?.p_data?.pets?.[0]?.photo};
  });
  expect(result).toMatchObject({writes:1,photo:'data:mock/pet.png'});
});


test('backform-umrechner: unauthenticated browser blocks recipe writes',async({page})=>{
  await isolated(page,false);
  await page.goto(origin+'/tools/baking/index.html');
  await expect(page).toHaveURL(/\/index\.html$/);
  await expect(page.locator('#settingsModal')).toBeVisible();
  // The protected tool has navigated away; no authenticated cloud UI is available.
  await expect(page.locator('#toolya-cloud-gate')).toHaveCount(0);
});
test('backform-umrechner: cloud recipe save and conflict lock',async({page})=>{
  await isolated(page,true);
  await page.goto(origin+'/tools/baking/index.html');
  await expect.poll(()=>page.evaluate(()=>bakingCloudReady&&!!bakingCloudController?.ready)).toBe(true);
  const result=await page.evaluate(async()=>{
    const saved=await persistRecipes([{name:'Kuchen',text:'Mehl',factor:1,note:''}]);
    return {saved,writes:window.__toolyaMock.writes.length,name:window.__toolyaMock.writes[0]?.p_data?.recipes?.[0]?.name};
  });
  expect(result).toMatchObject({saved:true,writes:1,name:'Kuchen'});
  await page.evaluate(async()=>{
    supabaseClient.rpc=async()=>({data:null,error:{code:'40001',message:'conflict'}});
    await persistRecipes([]);
  });
  await expect(page.locator('#toolya-cloud-gate')).toContainText('Toolya konnte die Speicherung nicht bestätigen');
  expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(1);
});
test('backform-umrechner: save and delete recipe await cloud confirmation',async({page})=>{
  await isolated(page,true);
  await page.goto(origin+'/tools/baking/index.html');
  await expect.poll(()=>page.evaluate(()=>bakingCloudReady&&!!bakingCloudController?.ready)).toBe(true);
  const result=await page.evaluate(async()=>{
    await saveRecipeToStorage('Kuchen','Mehl',1);
    await deleteRecipe(0);
    return {writes:window.__toolyaMock.writes.length,recipes:getRecipes()};
  });
  expect(result.writes).toBe(2);
  expect(result.recipes).toEqual([]);
});


async function isolatedWishlist(page,authenticated,profiles=[],detailError=false){
 await page.route('**/*',async route=>{
  const url=route.request().url();
  if(url.startsWith(origin)&&!/\/assets\/vendor\/supabase-2\.(?:57\.0|119\.2)\.js$/.test(url))return route.continue();
  if(url.includes('supabase.min.js')||/\/assets\/vendor\/supabase-2\.(?:57\.0|119\.2)\.js$/.test(url))return route.fulfill({status:200,contentType:'text/javascript',body:`
   window.__wishlistMock={user:${authenticated?"{id:'owner',email:'owner@example.invalid',is_anonymous:false}":"null"},writes:[],reads:0,searchError:false,detailError:${detailError},empty:false};
   window.supabase={createClient(){const m=window.__wishlistMock;return {
    auth:{
     async getUser(){m.reads++;return {data:{user:m.user},error:null}},
     onAuthStateChange(listener){queueMicrotask(()=>listener('INITIAL_SESSION',m.user?{access_token:'wishlist-fixture-token',user:m.user}:null));return {data:{subscription:{unsubscribe(){}}}}},
     async signOut(){m.user=null;return {error:null}}
    },
    rpc(name){if(name==='get_wishlist_public_profile')return Promise.resolve(m.detailError?{data:null,error:{message:'Synthetic detail outage'}}:{data:${JSON.stringify(profiles[0]||null)},error:null});if(name==='search_wishlist_directory'&&m.searchError)return Promise.resolve({data:null,error:{message:'Isolated unavailable'}});if(name==='search_wishlist_directory'&&m.empty)return Promise.resolve({data:[],error:null});return Promise.resolve({data:['search_wishlist_profiles','search_wishlist_directory'].includes(name)?${JSON.stringify(profiles)}:(name==='wishlist_directory_filters'?{countries:[],occasions:[],interests:[]}:[]),error:null})},
    from(table){return {
     select(){return this},eq(){return this},order(){return this},then(resolve){return Promise.resolve({data:[],error:null}).then(resolve)},limit(){return Promise.resolve({data:table==='wishlist_directory'?${JSON.stringify(profiles)}:[],error:null})},
     async maybeSingle(){if(table==='wishlist_directory'&&m.detailError)return {data:null,error:{message:'Synthetic detail outage'}};return {data:table==='wishlist_directory'?${JSON.stringify(profiles[0]||null)}:null,error:null}},
     upsert(payload){m.writes.push({table,payload});return {select(){return this},async single(){return {data:{user_id:'owner'},error:null}}}},
     insert(payload){m.writes.push({table,payload});return {select(){return this},async single(){return {data:{id:'11111111-1111-4111-8111-111111111111',...payload},error:null}}}}
    }},
    functions:{async invoke(){return {data:{status:'failed'},error:null}}}
   }}};
  `});
  return route.abort();
 });
}
test('wishlist: public discovery works without authentication and no private writes',async({page})=>{
 await isolatedWishlist(page,false);
 await page.goto(origin+'/tools/wishes/public.html');
 await expect(page.locator('#profile a[href*="wishes=add"]')).toBeVisible();
 expect(await page.evaluate(()=>window.__wishlistMock.writes.length)).toBe(0);
});
test('wishlist: published profiles can be paused and scrolled on mobile',async({page})=>{
 const profiles=Array.from({length:3},(_,i)=>({
  user_id:'11111111-1111-4111-8111-11111111111'+i,
  display_name:'Synthetisches Wunschprofil '+i,lists:[{url:'https://www.amazon.de/hz/wishlist/ls/ABC123'}]
 }));
 await isolatedWishlist(page,false,profiles);
 await page.setViewportSize({width:375,height:812});
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto(origin+'/tools/wishes/public.html');
 const viewport=page.locator('#wishPublicViewport');
 const toggle=page.getByRole('button',{name:'Karussell anhalten',exact:true});
 await expect(toggle).toBeVisible();
 await expect(viewport).toHaveClass(/is-auto/);
 await toggle.press('Enter');
 await expect(page.getByRole('button',{name:'Karussell fortsetzen',exact:true})).toBeFocused();
 await expect(viewport).not.toHaveClass(/is-auto/);
 await expect(viewport).toHaveCSS('overflow-x','auto');
 await expect(viewport.locator('[inert]')).toBeHidden();
 await viewport.evaluate(e=>e.scrollLeft=e.scrollWidth);
 expect(await viewport.evaluate(e=>e.scrollLeft)).toBeGreaterThan(0);
 await page.getByRole('button',{name:'Karussell fortsetzen',exact:true}).press('Enter');
 await expect(viewport).toHaveClass(/is-auto/);
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(toggle).toBeHidden();
 await expect(viewport).not.toHaveClass(/is-auto/);
 await expect(viewport.getByRole('link')).toHaveCount(3);
});
test('wishlist: public profile retry distinguishes connection failure from an unavailable profile',async({page})=>{
 await isolatedWishlist(page,false,[],true);
 await page.goto(origin+'/tools/wishes/public.html?profile=11111111-1111-4111-8111-111111111111');
 await expect(page.locator('#detailStatus')).toContainText('konnte gerade nicht geladen werden');
 const retry=page.getByRole('button',{name:'Profil erneut laden'});
 await expect(retry).toBeVisible();
 await page.evaluate(()=>{window.__wishlistMock.detailError=false});
 await retry.click();
 await expect(retry).toBeHidden();
 await expect(page.locator('#detailStatus')).toHaveText('Dieses Wunschprofil ist nicht mehr verfügbar.');
});
test('wishlist: account switch blocks profile write before network mutation',async({page})=>{
 await isolatedWishlist(page,true);
 await page.goto(origin+'/dashboard/?wishes=add#wish-profiles');
 const panel=page.locator('#wish-profiles');
 await panel.locator('[name=first]').fill('Anna');
 await panel.locator('[name=last]').fill('Muster');
 await panel.locator('[name=country]').fill('Deutschland');
 await page.evaluate(()=>{window.__wishlistMock.user={id:'other',email:'other@example.invalid'}});
 await panel.getByRole('button',{name:'Speichern',exact:true}).click();
 await expect(panel.getByRole('status')).toContainText('Konto gewechselt');
 expect(await page.evaluate(()=>window.__wishlistMock.writes.length)).toBe(0);
});
test('wishlist: verified profile is saved independently before the list form',async({page})=>{
 await isolatedWishlist(page,true);
 await page.goto(origin+'/dashboard/?wishes=add#wish-profiles');
 const panel=page.locator('#wish-profiles');
 await expect(panel.getByRole('heading',{name:'Profil anlegen'})).toBeVisible();
 await panel.locator('[name=first]').fill('Anna');
 await panel.locator('[name=last]').fill('Muster');
 await panel.locator('[name=country]').fill('Deutschland');
 await panel.getByRole('button',{name:'Speichern',exact:true}).click();
 await expect(panel.getByRole('heading',{name:'Amazon-Wunschliste hinzufügen'})).toBeVisible();
 await expect(panel.getByRole('status')).toContainText('Gespeichert');
 const result=await page.evaluate(()=>window.__wishlistMock.writes);
 expect(result).toHaveLength(1);
 expect(result[0].table).toBe('wishlist_directory_profiles');
 expect(result[0].payload).not.toHaveProperty('lists');
});

async function isolatedEstate(page,authenticated){
 await page.route('**/*',async route=>{
  const url=route.request().url();
  if(url.startsWith(origin)){
   if(/^\/assets\/vendor\/supabase-2\.(?:57\.0|119\.2)\.js$/.test(new URL(url).pathname))
    return route.fulfill({status:200,contentType:'text/javascript',body:`
     window.__estateMock={user:${authenticated?"{id:'owner',email:'owner@example.invalid',is_anonymous:false}":"null"},writes:[],conflict:false};
     window.supabase={createClient(){const m=window.__estateMock;return {
      auth:{async getUser(){return {data:{user:m.user},error:null}},async getSession(){return {data:{session:null}}},onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}}},
      from(table){if(table!=='vault_cloud_snapshots')throw Error('unexpected table');return {
       select(){return this},eq(){return this},update(data){this.payload=data;return this},insert(data){this.payload=data;return this},
       async maybeSingle(){return {data:null,error:null}},
       then(resolve,reject){m.writes.push(this.payload);return Promise.resolve({data:m.conflict?[]:[{updated_at:'2026-11-15T10:00:00Z'}],error:null}).then(resolve,reject)}
      }}
     }}};
    `});
   return route.continue();
  }
  return route.abort();
 });
}
test('estate: unauthenticated browser cannot write encrypted vault',async({page})=>{
 await isolatedEstate(page,false);await page.goto(origin+'/tools/estate/index.html');
 const result=await page.evaluate(async()=>{
  try{await EstateCloudGuard.saveEncryptedSnapshot({client:supabase.createClient(),ownerId:'owner',vaultId:'v_123',expectedStamp:null,encryptedData:{ciphertext:'x'},encryptedConfig:{ciphertext:'x'},recoveryKey:{ciphertext:'x'}})}catch(e){return e.message}
 });
 expect(result).toBe('login_required');
 expect(await page.evaluate(()=>window.__estateMock.writes.length)).toBe(0);
});
test('estate: encrypted cloud write confirmed, conflict blocks confirmation',async({page})=>{
 await isolatedEstate(page,true);await page.goto(origin+'/tools/estate/index.html');
 const result=await page.evaluate(async()=>{
  const client=supabase.createClient(),args={client,ownerId:'owner',vaultId:'v_123',expectedStamp:null,encryptedData:{ciphertext:'x'},encryptedConfig:{ciphertext:'y'},recoveryKey:{ciphertext:'z'}};
  const stamp=await EstateCloudGuard.saveEncryptedSnapshot(args);
  window.__estateMock.conflict=true;
  let conflict='';try{await EstateCloudGuard.saveEncryptedSnapshot(args)}catch(e){conflict=e.message}
  return {stamp,conflict,writes:window.__estateMock.writes.length};
 });
 expect(result).toEqual({stamp:'2026-11-15T10:00:00Z',conflict:'conflict',writes:2});
});

test('estate: browser rejects stale encrypted backup revision',async({page})=>{
 await isolatedEstate(page,true);await page.goto(origin+'/tools/estate/index.html');
 const result=await page.evaluate(async()=>{
  const client={auth:{async getUser(){return {data:{user:{id:'owner'}},error:null}}},from(){return {select(){return this},eq(){return this},async single(){return {data:{vault_id:'v',updated_at:'new',recovery_key:{ciphertext:'wrapped'}},error:null}}}}};
  let decrypts=0;
  try{await EstateCloudGuard.verifyEncryptedBackup({client,ownerId:'owner',vaultId:'v',expectedStamp:'old',key:'key',cryptoApi:{async decrypt(){decrypts++;return {entries:[]}}},validatePayload:x=>x})}
  catch(e){return {error:e.message,decrypts}}
 });
 expect(result).toEqual({error:'backup_unverified',decrypts:0});
});
test('estate: browser refuses unreadable cloud backup',async({page})=>{
 await isolatedEstate(page,true);await page.goto(origin+'/tools/estate/index.html');
 const result=await page.evaluate(async()=>{
  const client={auth:{async getUser(){return {data:{user:{id:'owner'}},error:null}}},from(){return {select(){return this},eq(){return this},async single(){return {data:{vault_id:'v',updated_at:'rev',recovery_key:{ciphertext:'wrapped'},encrypted_data:{ciphertext:'bad'},encrypted_config:{ciphertext:'bad'}},error:null}}}}};
  try{await EstateCloudGuard.verifyEncryptedBackup({client,ownerId:'owner',vaultId:'v',expectedStamp:'rev',key:'key',cryptoApi:{async decrypt(){throw Error('decrypt_failed')}},validatePayload:x=>x})}catch(e){return e.message}
 });
 expect(result).toBe('decrypt_failed');
});

test('estate: browser blocks emergency publish on mismatched recovery envelope',async({page})=>{
 await isolatedEstate(page,true);await page.goto(origin+'/tools/estate/index.html');
 const result=await page.evaluate(async()=>{
  const remote={vault_id:'v',updated_at:'rev',encrypted_data:{ciphertext:'data'},encrypted_config:{ciphertext:'config'},recovery_key:{ciphertext:'old'}};
  const client={auth:{async getUser(){return {data:{user:{id:'owner'}},error:null}}},from(){return {select(){return this},eq(){return this},async single(){return {data:remote,error:null}}}}};
  let decrypts=0;
  try{await EstateCloudGuard.verifyEncryptedBackup({client,ownerId:'owner',vaultId:'v',expectedStamp:'rev',key:'key',expectedEncryptedData:remote.encrypted_data,expectedEncryptedConfig:remote.encrypted_config,expectedRecoveryKey:{ciphertext:'new'},cryptoApi:{async decrypt(){decrypts++;return {entries:[]}}},validatePayload:x=>x})}
  catch(e){return {error:e.message,decrypts}}
 });
 expect(result).toEqual({error:'backup_unverified',decrypts:0});
});

test('estate: browser keeps existing vaults separate and refuses pending overwrite',async({page})=>{
 await isolatedEstate(page,true);await page.goto(origin+'/tools/estate/index.html');
 const result=await page.evaluate(()=>{
  const check=(local,remote)=>{try{EstateCloudGuard.assertRestoreCompatible(local,remote);return 'ok'}catch(e){return e.message}};
  return {
   different:check({version:2,vaultId:'old',pending:false},{vault_id:'new',updated_at:'r2'}),
   pending:check({version:2,vaultId:'same',pending:true,cloudStamp:'r1'},{vault_id:'same',updated_at:'r2'}),
   newDevice:check(null,{vault_id:'same',updated_at:'r2'})
  };
 });
 expect(result).toEqual({different:'vault_mismatch',pending:'conflict',newDevice:'ok'});
});

test('estate: new-device cloud recovery checks password and does not touch localStorage',async({page})=>{
 await isolatedEstate(page,true);await page.goto(origin+'/tools/estate/index.html');
 const result=await page.evaluate(async()=>{
  const remote={vault_id:'v',updated_at:'rev',recovery_key:{ciphertext:'wrapped'},encrypted_data:{ciphertext:'data'},encrypted_config:{ciphertext:'config'}};
  const client={auth:{async getUser(){return {data:{user:{id:'owner'}},error:null}}},from(){return {select(){return this},eq(){return this},async maybeSingle(){return {data:remote,error:null}}}}};
  localStorage.setItem('digital_estate_vault','existing-backup');
  const restored=await EstateCloudGuard.restoreCloudSnapshot({client,ownerId:'owner',password:'secret',cryptoApi:{
   async unwrap(){return 'key'},async decrypt(v){return v===remote.encrypted_data?{entries:[{id:'e'}]}:{ownerName:'Owner'}}
  },validatePayload:x=>x});
  return {vault:restored.config.vaultId,entries:restored.payload.entries.length,local:localStorage.getItem('digital_estate_vault')};
 });
 expect(result).toEqual({vault:'v',entries:1,local:'existing-backup'});
});

test('estate: browser refuses changed local encrypted snapshot before emergency publish',async({page})=>{
 await isolatedEstate(page,true);await page.goto(origin+'/tools/estate/index.html');
 const result=await page.evaluate(()=>{
  localStorage.setItem('digital_estate_vault','encrypted-original');
  const snapshot=localStorage.getItem('digital_estate_vault');
  localStorage.setItem('digital_estate_vault','encrypted-other-tab');
  try{EstateCloudGuard.assertLocalSnapshot(snapshot,localStorage.getItem('digital_estate_vault'));return 'unexpected'}
  catch(e){return {error:e.message,preserved:localStorage.getItem('digital_estate_vault')}}
 });
 expect(result).toEqual({error:'conflict',preserved:'encrypted-other-tab'});
});

test('estate: browser detects concurrent first local vault write',async({page})=>{
 await isolatedEstate(page,true);await page.goto(origin+'/tools/estate/index.html');
 const result=await page.evaluate(()=>{
  localStorage.removeItem('digital_estate_vault');
  const initial=localStorage.getItem('digital_estate_vault');
  localStorage.setItem('digital_estate_vault','other-tab-encrypted-vault');
  try{EstateCloudGuard.assertLocalSnapshot(initial,localStorage.getItem('digital_estate_vault'));return 'unexpected'}
  catch(e){return {error:e.message,preserved:localStorage.getItem('digital_estate_vault')}}
 });
 expect(result).toEqual({error:'conflict',preserved:'other-tab-encrypted-vault'});
});

test('estate: browser blocks conflicting legacy trustee and emergency contacts',async({page})=>{
 await isolatedEstate(page,true);await page.goto(origin+'/tools/estate/index.html');
 const result=await page.evaluate(()=>{
  const guard=EstateCloudGuard,local={entries:[],trusteeKeys:{p1:'a'.repeat(64)}},cloud={entries:[],trusteeKeys:{p1:'b'.repeat(64)}};
  const contacts={alarmPersons:[{id:'p1',contact:'first@example.invalid'}]};
  const check=(a,b,c,d)=>{try{guard.assertLegacyMergeSafe(a,b,c,d);return 'ok'}catch(e){return e.message}};
  return {key:check(local,contacts,cloud,contacts),
   contact:check(local,contacts,{entries:[],trusteeKeys:{p1:'a'.repeat(64)}},{alarmPersons:[{id:'p1',contact:'other@example.invalid'}]}),
   addition:check(local,contacts,{entries:[],trusteeKeys:{p2:'c'.repeat(64)}},{alarmPersons:[{id:'p2',contact:'new@example.invalid'}]})};
 });
 expect(result).toEqual({key:'conflict',contact:'conflict',addition:'ok'});
});

test('estate: browser rejects duplicate legacy emergency contact IDs',async({page})=>{
 await isolatedEstate(page,true);await page.goto(origin+'/tools/estate/index.html');
 const result=await page.evaluate(()=>{
  const data={entries:[],trusteeKeys:{p1:'a'.repeat(64)}};
  const people={alarmPersons:[{id:'p1',contact:'one@example.invalid'}]};
  const duplicate={alarmPersons:[...people.alarmPersons,{id:'p1',contact:'two@example.invalid'}]};
  try{EstateCloudGuard.assertLegacyMergeSafe(data,people,data,duplicate);return 'unexpected'}
  catch(e){return e.message}
 });
 expect(result).toBe('conflict');
});

test('estate: real browser crypto binds emergency envelopes to the correct trustee',async({page})=>{
 await isolatedEstate(page,true);await page.goto(origin+'/tools/estate/index.html');
 const result=await page.evaluate(async()=>{
  const C=EstateCrypto,a=C.random(),b=C.random();
  const people=[{id:'a',contact:'a@example.invalid'},{id:'b',contact:'b@example.invalid'}];
  const replica=await C.readReplica([{id:'entry',title:'Isolated fixture'}],people,{a,b});
  const opened=await C.openReplica({content:replica.content,envelope:replica.guardians[0].envelope},a);
  let swapped='unexpected',duplicate='unexpected';
  try{await C.openReplica({content:replica.content,envelope:replica.guardians[0].envelope},b)}catch{swapped='rejected'}
  try{await C.readReplica([],people,{a,b:a})}catch(e){duplicate=e.message}
  const uppercase=await C.openReplica({content:replica.content,envelope:replica.guardians[0].envelope},a.toUpperCase());
  const formatted=a.slice(0,32)+'-'+a.slice(32);
  const formattedReplica=await C.readReplica([{id:'e',title:'Formatted fixture'}],[{id:'a'}],{a:formatted});
  const formattedOpened=await C.openReplica({content:formattedReplica.content,envelope:formattedReplica.guardians[0].envelope},formatted);
  return {opened:opened.entries[0].title,uppercase:uppercase.entries[0].title,formatted:formattedOpened.entries[0].title,swapped,duplicate,unique:replica.guardians[0].hash!==replica.guardians[1].hash};
 });
 expect(result).toEqual({opened:'Isolated fixture',uppercase:'Isolated fixture',formatted:'Formatted fixture',swapped:'rejected',duplicate:'conflict',unique:true});
});

// Optional compact review images for isolated draft-PR checks when local image access is unavailable.
// Only the two synthetic, intercepted tool fixtures below call this helper.
async function reviewImage(page,id){
 if(process.env.TOOLYA_VISUAL_LOGS!=='1')return;
 const data=(await page.screenshot({type:'jpeg',quality:42,fullPage:false})).toString('base64');
 const size=10000,total=Math.ceil(data.length/size);
 for(let i=0;i<total;i++)console.log('TOOLYA_REVIEW|'+id+'|'+i+'|'+total+'|'+data.slice(i*size,(i+1)*size));
}

const previewImage='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAoAAAAFoCAIAAABIUN0GAAAE/ElEQVR42u3XsQnCUBSGUZ/cBSwFwdIRHCZNlrAOqV0ijcM4gmVAsLSws4mtWCmEp3meM0Hyv+Ljpv52nwEAec1NAAACDAACDAAIMAAIMAAgwAAgwACAAAOAAAMAAgwAAgwAAgwACDAACDAAIMAAIMAAgAADgAADAAIMAAIMAAIMAAgwAAgwACDAACDAAIAAA4AAAwACDAACDAACDAAIMAAIMAAgwAAgwACAAAOAAAMAAgwAAgwAAgwACDAACDAAIMAAIMAAgAADgAADAAIMAAIMAAIMAAgwAAgwACDAADBlMcWPXu8PXg6AZ/2ucgEDAAIMAAIMAAgwAAgwAAgwACDAAFCUKOlnhrb2ogBlS03nAgYABBgABBgAEGAAEGAAEGATAIAAA4AAAwACDAACDAAIMAAIMAAgwAAgwACAAAOAAAOAAAMAAgwAAgwACDAACDAAIMAAIMAAgAADgAADgAADAAIMAAIMAAgwAAgwACDAACDAAIAAA4AAA4AAAwACDAACDAAIMAAIMAAgwAAgwACAAAOAAAOAAAMAAgwAAgwACDAACDAAIMAAIMAAgAADwNeFCfJITWcEYCqGtjaCCxgABBgAEGAAEGAAQIABQIABAAEGAAEGAAEGAAQYAAQYABBgABBgAECAAUCAAQABBgABBgABBgAEGAAEGAAQYAAQYABAgAFAgAEAAQYAAQYAAQYABBgABBgAEGAAEGAAQIABQIABAAEGAAEGAAEGAAQYAAQYABhbmCCPoa2NAIALGAAEGAAEGAAQYAAQYABAgAFAgAEAAQYAAQYABBgABBgABBgAEGAAEGAAQIABQIABAAEGAAEGAF6ECfI4nC5GgOmqNksj4AIGAAEGAAQYAAQYABBgABBgABBgAECAAUCAAQABBgABBgAEGAAEGAAQYAAQYAAQYABAgAFAgAEAAQYAAQYABBgABBgAEGAAEGAAQIABQIABQIABAAEGAAEGAAQYAAQYABBgABBgAECAAUCAAUCAAQABBgABBgAEGAAEGAAQYAAQYABAgAFAgAFAgAEAAQYAAQYABBgABBgAEGAA+FVhgjyqzdIIALiAAUCAAUCAAQABBgABBgAEGAAEGAAQYAAQYABAgAFAgAFAgAEAAQYAAQYABBgABBgA+ECYII/FamsERnE9H40ALmAAQIABQIABAAEGAAEGAAEGAAQYAAQYABBgABBgAECAAUCAAQABBgABBgABNgEACDAACDAAIMAAIMAAgAADgAADAAIMAD8nTJDH9Xw0AgAuYAAQYAAQYABAgAFAgAEAAQYAAQYABBgABBgAEGAAEGAAEGAAQIABQIABAAEGAAEGAAQYAAQYABBgABBgABBgAECAAUCAAQABBgABBgAEGAAEGAAQYAAQYAAQYABAgAFAgAEAAQYAAQYABBgABBgAEGAAEGAA+GNR0s+kpvOiALiAAQABBgABBgABBgAEGAAEGAAQYAAoQepvdysAgAsYAAQYABBgABBgAECAAUCAAQABBgABBgABNgEACDAACDAAIMAAIMAAgAADgAADAAIMAAIMAAgwAAgwAAgwACDAACDAAIAAA4AAAwACDAACDAAIMAAIMAAIMAAgwAAgwACAAAOAAAMAAgwAAgwACDAACDAACDAAIMAAIMAAgAADgAADAAIMAAIMAAgwAAgwAAgwACDAACDAAIAAA4AAAwDvewClVR20r3nJugAAAABJRU5ErkJggg==';
async function verifyPhotoPreview(page,testInfo,tool,label){
 const trigger=page.getByRole('button',{name:label,exact:true});
 const dialog=page.getByRole('dialog',{name:'Bildvorschau',exact:true});
 const close=dialog.getByRole('button',{name:'Schließen',exact:true});
 for(const width of [320,768,1440]){
  await page.setViewportSize({width,height:1000});
  await trigger.focus();
  await trigger.press('Enter');
  await expect(dialog).toBeVisible();
  await expect(close).toBeFocused();
  const image=dialog.getByRole('img',{name:/Vergrößertes/});
  await expect(image).toBeVisible();
  await expect.poll(()=>image.evaluate(element=>element.naturalWidth)).toBe(640);
  expect((await close.boundingBox()).height).toBeGreaterThanOrEqual(44);
  expect((await dialog.boundingBox()).width).toBeLessThanOrEqual(width-28);
  await page.screenshot({path:testInfo.outputPath('photo-preview-'+tool+'-'+width+'.png')});
  if(width===768)await close.press('Space');
  else await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
 }
}
async function revealToolSetting(control){
 const group=control.locator('xpath=ancestor::details[@data-settings-section][1]');
 await expect(group).toHaveCount(1);
 if(await group.getAttribute('open')===null){
  const summary=group.locator(':scope>summary');
  await summary.focus();
  await summary.press('Enter');
  await expect(group).toHaveAttribute('open','');
 }
 await expect(control).toBeVisible();
}
for(const item of tools){
 test(item.tool+': shared controls on the real authenticated page at three widths',async({page},testInfo)=>{
  const fixture=item.tool==='autokosten-reifenwechsel'
   ?{cars:[{id:1,name:'Isoliertes Testfahrzeug',plate:'TEST',km:1000,photo:previewImage}],events:[{id:2,carId:1,title:'Isolierte Wartung',type:'Inspektion',date:'2026-11-17',cost:42}],tires:[]}
   :{entries:[{id:2,title:'Isolierter Testbeleg',entryType:'ausgabe',date:'2026-11-17',price:42,category:'Lebensmittel',photos:[]}],budgets:{Lebensmittel:100},goals:[{id:3,title:'Isoliertes Sparziel',target:100,current:20}]};
  await isolated(page,true,true,fixture);
  await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});
  await page.goto(origin+item.path);
  await expect.poll(()=>page.evaluate(()=>typeof toolyaCloudReady!=='undefined'&&toolyaCloudReady&&!!toolyaCloudController?.ready)).toBe(true);
  await expect(page.locator(item.form)).toBeVisible();
  // This gate confirms the actual display CSS, rather than accepting unstyled HTML.
  await expect.poll(()=>page.locator('#settingsModal').evaluate(e=>getComputedStyle(e).display)).toBe('none');
  if(await page.locator('#toolya-consent-panel').isVisible())await page.getByRole('button',{name:'Ablehnen',exact:true}).click();
  const contrast=async locator=>locator.evaluate(e=>{
   const c=getComputedStyle(e),lum=v=>v.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4}).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0);
   const a=lum(c.color),b=lum(c.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  });
  for(const width of [320,768,1440]){
   await page.setViewportSize({width,height:1000});
   expect(new URL(page.url()).pathname).toBe(item.path);
   expect(await page.locator('html').evaluate(e=>getComputedStyle(e).colorScheme)).toBe('light');
   const nav=page.locator('.b3-nav-links>a').first();
   await expect(nav).toHaveCSS('background-color','rgb(0, 126, 159)');
   expect(await contrast(nav)).toBeGreaterThanOrEqual(4.5);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
   await page.locator(item.form).focus();await page.keyboard.press('Tab');
   expect(await page.evaluate(()=>parseFloat(getComputedStyle(document.activeElement).outlineWidth))).toBeGreaterThanOrEqual(3);
   await page.locator('.ty-tool-hero').scrollIntoViewIfNeeded();
   await page.screenshot({path:testInfo.outputPath('b3-'+item.tool+'-'+width+'.png'),fullPage:true});
   await page.locator('#settingsBtn').click();
   await expect(page.locator('#settingsModal')).toBeVisible();
   await revealToolSetting(page.locator('#b3-edit-open'));
   await page.locator('#b3-edit-open').click();
   await expect(page.locator('#b3-editor')).toBeVisible();
   const save=page.locator('#b3-editor .b3-action:not(.b3-outline)').first();
   await expect(save).toHaveCSS('background-color','rgb(0, 126, 159)');
   expect(await contrast(save)).toBeGreaterThanOrEqual(4.5);
   await save.hover();await expect(save).toHaveCSS('transform','none');
   await expect(page.locator('#b3-editor button[disabled]').first()).toBeDisabled();
   await page.screenshot({path:testInfo.outputPath('b3-editor-'+item.tool+'-'+width+'.png'),fullPage:true});
   await page.locator('#b3-editor').getByRole('button',{name:'Abbrechen',exact:true}).click();
   await expect(page.locator('#b3-editor')).toBeHidden();
   const isCar=item.tool==='autokosten-reifenwechsel';
   const primary=page.locator(isCar?'button[onclick="saveCar()"]':'#saveBtn');
   for(const button of await page.locator('main.b3-dashboard button.b3-action:not(.b3-outline):visible').all()){
    await expect(button).toHaveCSS('background-color','rgb(0, 126, 159)');
    expect(await contrast(button)).toBeGreaterThanOrEqual(4.5);
    expect(await button.evaluate(e=>e.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
   }
   await expect(primary).toHaveCSS('font-weight','700');
   if(isCar){
    const heading=page.locator('.b3-car-card-heading').first();
    for(const button of await heading.locator('button').all()){
     expect(await button.evaluate(e=>{const a=e.getBoundingClientRect(),b=e.closest('.b3-car-card-heading').getBoundingClientRect();return a.left>=b.left-1&&a.right<=b.right+1})).toBe(true);
    }
    const km=heading.locator('button[onclick="updateCarKm(1)"]');
    expect(await km.evaluate(e=>{const r=document.createRange();r.selectNodeContents(e);return r.getBoundingClientRect().height<=parseFloat(getComputedStyle(e).lineHeight)+1})).toBe(true);
    const cols=await page.locator('.b3-car-form-grid').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length);
    expect(cols).toBe(width<1280?1:2);
    if(width===768)expect(await page.locator('#carPlate').evaluate(e=>e.getBoundingClientRect().width)).toBeGreaterThan(290);
   }else{
    expect(await page.locator('.b3-finance-details').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length)).toBe(width<768?1:3);
    await page.locator('button[onclick="editReceipt(2)"]').click();
    await expect(page.locator('#cancelEditBtn')).toBeVisible();
   }
   await page.locator(isCar?'#b3-create':'#formCard').evaluate(e=>e.scrollIntoView({block:'start'}));
   await page.screenshot({path:testInfo.outputPath('app-'+item.tool+'-form-'+width+'.jpg'),type:'jpeg',quality:42});
   await primary.scrollIntoViewIfNeeded();
   if(width===1440){
    await page.emulateMedia({reducedMotion:'no-preference'});
    await primary.hover();await expect(primary).toHaveCSS('transform','matrix(1, 0, 0, 1, 0, -2)');
    await page.mouse.down();
    try{await expect(primary).toHaveCSS('transform','matrix(1, 0, 0, 1, 0, 0)')}
    finally{await page.mouse.move(0,0);await page.mouse.up();await page.emulateMedia({reducedMotion:'reduce'})}
   }
   if(isCar)await page.locator('#eventCarSelect').evaluate(e=>e.parentElement.closest('div.bg-white').scrollIntoView({block:'start'}));
   else await primary.scrollIntoViewIfNeeded();
   await page.screenshot({path:testInfo.outputPath('app-'+item.tool+'-actions-'+width+'.jpg'),type:'jpeg',quality:42});
   if(isCar)await page.locator('button[onclick="openEditModal(2)"]').click();
   else{
    await page.locator('#cancelEditBtn').click();
    await page.locator('button[onclick="openBudgetModal()"]').click();
   }
   const modal=page.locator(isCar?'#editModal':'#budgetModal');
   await expect(modal).toBeVisible();
   const modalSave=modal.locator('button.b3-action:not(.b3-outline)');
   await expect(modalSave).toHaveCSS('background-color','rgb(0, 126, 159)');
   expect(await contrast(modalSave)).toBeGreaterThanOrEqual(4.5);
   await modal.locator('input:not([type=hidden])').first().focus();await page.keyboard.press('Tab');
   expect(await page.evaluate(()=>parseFloat(getComputedStyle(document.activeElement).outlineWidth))).toBeGreaterThanOrEqual(3);
   if(isCar){
    for(const button of await modal.locator('.b3-car-dialog-actions .b3-action').all()){
     expect(await button.evaluate(e=>{const r=document.createRange();r.selectNodeContents(e);return r.getBoundingClientRect().height<=parseFloat(getComputedStyle(e).lineHeight)+1})).toBe(true);
    }
   }
   await page.screenshot({path:testInfo.outputPath('app-'+item.tool+'-dialog-'+width+'.jpg'),type:'jpeg',quality:42});
   await modal.getByRole('button',{name:'Abbrechen',exact:true}).click();
   await expect(modal).toBeHidden();
   const danger=page.locator(isCar?'button[onclick="deleteEvent(2)"]':'button[onclick="deleteReceipt(2)"]');
   await expect(danger).not.toHaveClass(/b3-action/);
   const red=await danger.evaluate(e=>getComputedStyle(e).color.match(/[\d.]+/g).map(Number));
   expect(red[0]).toBeGreaterThan(red[1]);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  }
  if(item.tool==='autokosten-reifenwechsel')await verifyPhotoPreview(page,testInfo,'car','Fahrzeugfoto vergrößern');
  expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
  // Existing account warning actions retain their red treatment.
  await page.locator('#settingsBtn').click();
  const logout=page.locator('#settingsModal button[onclick="logoutUser()"]');
  const colour=await logout.evaluate(e=>getComputedStyle(e).backgroundColor);
  const channels=colour.match(/[\d.]+/g).map(Number);expect(channels[0]).toBeGreaterThan(channels[1]);
 });
}


// Real inventory UIs with synthetic cloud snapshots; no production accounts or writes.
for(const kind of ['moving','loans']){
 test(kind+': inventory actions, forms and edit dialog at three widths',async({page},testInfo)=>{
  const moving=kind==='moving',errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const snapshot=moving
   ?{locations:[{id:1,name:'Isolierter Lagerort',icon:'📦'}],boxes:[{id:2,locId:1,name:'Isolierte Kiste',desc:'Synthetische Prüfansicht',value:42,photo:previewImage,tag:'Standard',barcode:'1234567890123',expiry:'2027-01-17',lentTo:'',subItems:[{name:'Isolierter Artikel',value:5}]}]}
   :{contacts:[{id:1,name:'Isolierter Kontakt',phone:''}],inventory:[{id:3,title:'Isolierter Gegenstand',category:'Werkzeug',serial:'TEST'}],items:[{id:2,title:'Isolierter Testgegenstand',person:'Isolierter Kontakt',date:'2026-11-17',returnDate:'2026-12-17',category:'Werkzeug',status:'active',deposit:42,note:'Synthetische Prüfansicht',photo:''}]};
  await isolated(page,true,true,snapshot);
  await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});
  const route='/tools/'+kind+'/index.html';await page.goto(origin+route);
  await expect.poll(()=>page.evaluate(moving=>moving
   ?typeof movingCloudReady!=='undefined'&&movingCloudReady&&!!movingCloudController?.ready
   :typeof loansCloudReady!=='undefined'&&loansCloudReady&&!!loansCloudController?.ready,moving)).toBe(true);
  await page.locator('.toolya-signature-footer').waitFor();
  await expect.poll(()=>page.locator('#settingsModal').evaluate(e=>getComputedStyle(e).display)).toBe('none');
  if(await page.locator('#toolya-consent-panel').isVisible())await page.getByRole('button',{name:'Ablehnen',exact:true}).click();
  const capture=async(id)=>{
   await page.screenshot({path:testInfo.outputPath('inventory-'+kind+'-'+id+'.png'),fullPage:false});
   await page.screenshot({path:testInfo.outputPath('inventory-'+kind+'-'+id+'.jpg'),type:'jpeg',quality:42});
  };
  const fits=async locator=>locator.evaluate(e=>e.scrollWidth<=e.clientWidth+1);
  for(const width of [320,768,1440]){
   await page.setViewportSize({width,height:1000});
   expect(new URL(page.url()).pathname).toBe(route);
   await expect(page.locator('html')).toHaveCSS('color-scheme','light');
   const grid=page.locator(moving?'.b3-moving-form-grid':'.b3-loan-form-grid');
   expect(await grid.evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length)).toBe(width<1280?1:moving?2:3);
   for(const button of await page.locator('main.b3-dashboard button.b3-action:not(.b3-outline):visible').all()){
    await expect(button).toHaveCSS('background-color','rgb(0, 126, 159)');
    await expect(button).toHaveCSS('font-weight','700');
    expect(await button.evaluate(e=>e.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    expect(await button.evaluate(e=>{
     const c=getComputedStyle(e),lum=v=>v.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
     const a=lum(c.color),b=lum(c.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    })).toBeGreaterThanOrEqual(4.5);
   }
   await grid.evaluate(e=>e.scrollIntoView({block:'start'}));await capture('setup-'+width);
   await grid.locator(':scope>div').nth(1).evaluate(e=>e.scrollIntoView({block:'start'}));await capture('entry-'+width);
   const list=page.locator(moving?'#b3-inventory':'#b3-loans');
   await list.evaluate(e=>e.scrollIntoView({block:'start'}));
   expect(await fits(list)).toBe(true);
   if(moving){
    for(const input of await page.locator('.b3-moving-filters input,.b3-moving-filters select').all()){
     expect(await input.evaluate(e=>e.getBoundingClientRect().width)).toBeGreaterThan(180);
    }
   }else if(width===768){
    const top=await page.locator('.b3-loan-setup>div').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().top));
    expect(Math.abs(top[0]-top[1])).toBeLessThan(1);
   }
   await capture('list-'+width);
   const edit=page.locator(moving?'button[onclick="openEditBoxModal(2)"]':'button[data-loan-action="edit"]');
   await expect(edit).toHaveClass(/b3-outline/);await edit.click();
   const modal=page.locator(moving?'#editBoxModal':'#editModal'),surface=modal.locator(':scope>div');
   await expect(modal).toBeVisible();expect(await fits(surface)).toBe(true);
   await modal.locator('input:not([type=hidden]),select').first().focus();await page.keyboard.press('Tab');
   expect(await page.evaluate(()=>parseFloat(getComputedStyle(document.activeElement).outlineWidth))).toBeGreaterThanOrEqual(3);
   await surface.evaluate(e=>e.scrollTop=0);await capture('dialog-'+width);
   const save=modal.locator('button.b3-action:not(.b3-outline)').last();
   await expect(save).toHaveCSS('background-color','rgb(0, 126, 159)');
   await save.scrollIntoViewIfNeeded();await capture('dialog-actions-'+width);
   for(const button of await modal.locator('.b3-dialog-actions .b3-action').all()){
    expect(await button.evaluate(e=>{const r=document.createRange();r.selectNodeContents(e);return r.getBoundingClientRect().height<=parseFloat(getComputedStyle(e).lineHeight)+1})).toBe(true);
   }
   await modal.getByRole('button',{name:'Abbrechen',exact:true}).click();await expect(modal).toBeHidden();
   const danger=page.locator(moving?'button[onclick="deleteBox(2)"]':'button[data-loan-action="delete"]');
   await expect(danger).not.toHaveClass(/b3-action/);
   const rgb=await danger.evaluate(e=>getComputedStyle(e).color.match(/[\d.]+/g).map(Number));expect(rgb[0]).toBeGreaterThan(rgb[1]);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  }
  if(moving)await verifyPhotoPreview(page,testInfo,kind,'Kistenfoto vergrößern');
  expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
  expect(errors).toEqual([]);
 });
}

// P1 real-page review: read-only synthetic snapshots, including existing auxiliary dialogs.
for(const kind of ['meters','plants']){
 test(kind+': shared actions and readable care forms at three widths',async({page},testInfo)=>{
  test.setTimeout(60000);
  const meters=kind==='meters',errors=[];page.on('pageerror',e=>errors.push(e.message));
  const pixel='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jJ1sAAAAASUVORK5CYII=';
  const snapshot=meters
   ?{readings:[{id:2,type:'Strom',name:'Isolierter Hauptzähler',location:'Hauptwohnung',date:'2026-11-17',value:142,photo:previewImage,note:'Synthetische Prüfansicht'},{id:1,type:'Strom',name:'Isolierter Hauptzähler',location:'Hauptwohnung',date:'2026-10-17',value:100}],tarifs:{Strom:{priceHT:0.38,priceNT:0.28,abschlag:80},Wasser:{price:4.5,abschlag:30},Gas:{price:0.12,abschlag:100,calib:11.2}}}
   :{plants:[{id:2,name:'Isolierte Testpflanze',species:'Tomate',location:'Testzimmer',light:'half',potSize:15,interval:7,lastWatered:'2026-11-17',propagation:'Standard',note:'Synthetische Prüfansicht',diary:[{date:'2026-11-17',text:'Isolierte Notiz'}],harvestLog:[],galleryPhotos:[]}],monthWaterLiters:0,totalHarvestGrams:0,inventory:[{name:'Isolierter Lagerartikel',qty:'1 L'}],seeds:[{name:'Isoliertes Saatgut',year:2026}],beetSlots:[2,...Array(15).fill(null)],cisternMax:500,cisternCurrent:400};
  await isolated(page,true,true,snapshot);
  await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});
  const route='/tools/'+kind+'/index.html';await page.goto(origin+route);
  await expect.poll(()=>page.evaluate(meters=>meters
   ?typeof metersCloudReady!=='undefined'&&metersCloudReady&&!!metersCloudController?.ready
   :typeof plantsCloudReady!=='undefined'&&plantsCloudReady&&!!plantsCloudController?.ready,meters)).toBe(true);
  await page.locator('.toolya-signature-footer').waitFor();
  await expect.poll(()=>page.locator('#settingsModal').evaluate(e=>getComputedStyle(e).display)).toBe('none');
  if(await page.locator('#toolya-consent-panel').isVisible())await page.getByRole('button',{name:'Ablehnen',exact:true}).click();
  const capture=async id=>{
   await page.screenshot({path:testInfo.outputPath('care-'+kind+'-'+id+'.png')});
   await page.screenshot({path:testInfo.outputPath('care-'+kind+'-'+id+'.jpg'),type:'jpeg',quality:42});
  };
  const fits=async loc=>loc.evaluate(e=>e.scrollWidth<=e.clientWidth+1);
  const controls=async loc=>{
   for(const b of await loc.locator('button.b3-action:visible').all()){
    expect(await b.evaluate(e=>e.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    await expect(b).toHaveCSS('font-weight','700');
    if(!(await b.getAttribute('class')).includes('b3-outline')){
     await expect(b).toHaveCSS('background-color','rgb(0, 126, 159)');
     expect(await b.evaluate(e=>{
      const c=getComputedStyle(e),lum=v=>v.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
      const a=lum(c.color),b=lum(c.backgroundColor);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
     })).toBeGreaterThanOrEqual(4.5);
    }
   }
  };
  for(const width of [320,768,1440]){
   await page.setViewportSize({width,height:1000});expect(new URL(page.url()).pathname).toBe(route);
   if(meters)expect(await page.locator('#meterExchangeCheck').evaluate(e=>e.getBoundingClientRect().width)).toBeGreaterThanOrEqual(16);
   await expect(page.locator('html')).toHaveCSS('color-scheme','light');
   await controls(page.locator('main.b3-dashboard'));
   const grid=page.locator(meters?'.b3-meter-identity-grid':'.b3-plant-care-grid');
   expect(await grid.evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length)).toBe(width<768?1:width<1280?2:4);
   if(width===768)expect(await page.locator(meters?'#meterName':'#plantLight').evaluate(e=>e.getBoundingClientRect().width)).toBeGreaterThan(280);
   await page.locator(meters?'#b3-tariffs':'#b3-create').evaluate(e=>e.scrollIntoView({block:'start'}));await capture('form-'+width);
   await page.locator(meters?'#b3-create':'#waterMlHint').evaluate(e=>e.scrollIntoView({block:'start'}));await capture('entry-'+width);
   const list=page.locator(meters?'#b3-history':'#b3-plants');
   await list.evaluate(e=>e.scrollIntoView({block:'start'}));expect(await fits(list)).toBe(true);await capture('list-'+width);
   const danger=page.locator(meters?'button[onclick="deleteReading(2)"]':'button[onclick="deletePlant(2)"]');
   expect(await danger.evaluate(e=>e.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
   await expect(danger).not.toHaveClass(/b3-action/);
   const red=await danger.evaluate(e=>getComputedStyle(e).color.match(/[\d.]+/g).map(Number));expect(red[0]).toBeGreaterThan(red[1]);
   if(!meters){
    await page.locator('button[onclick="openEditModal(2)"]').click();
    const modal=page.locator('#editModal'),surface=modal.locator(':scope>div');
    await expect(modal).toBeVisible();expect(await fits(surface)).toBe(true);await controls(modal);
    await modal.locator('#editName').focus();await page.keyboard.press('Tab');
    expect(await page.evaluate(()=>parseFloat(getComputedStyle(document.activeElement).outlineWidth))).toBeGreaterThanOrEqual(3);
    await surface.evaluate(e=>e.scrollTop=0);await capture('edit-'+width);
    await modal.locator('button[onclick="updatePlant()"]').scrollIntoViewIfNeeded();await capture('edit-actions-'+width);
    await modal.getByRole('button',{name:'Abbrechen',exact:true}).click();
   }
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  }
  // Mobile is the narrowest surface for all other modified dialogs. Open real read-only handlers.
  await page.setViewportSize({width:320,height:1000});
  const dialogs=meters
   ?[['energyTipsModal','openEnergyTipsModal','closeEnergyTipsModal'],['photoModal','openPhotoModal','closePhotoModal']]
   :[['inventoryModal','openInventoryModal','closeInventoryModal'],['seedsModal','openSeedsModal','closeSeedsModal'],['roiModal','openRoiModal','closeRoiModal'],['cisternModal','openCisternModal','closeCisternModal'],['beetModal','openBeetModal','closeBeetModal'],['harvestModal','openHarvestModal','closeHarvestModal'],['diaryModal','openDiaryModal','closeDiaryModal'],['galleryModal','openGalleryModal','closeGalleryModal'],['helpModal','toggleHelpModal','toggleHelpModal'],['settingsModal','toggleSettingsModal','toggleSettingsModal']];
  for(const [id,open,close] of dialogs){
   await page.evaluate(({open,pixel})=>window[open](open==='openPhotoModal'?pixel:2),{open,pixel});
   const modal=page.locator('#'+id);await expect(modal).toBeVisible();
   const surface=modal.locator(':scope>div');expect(await fits(surface)).toBe(true);await controls(modal);
   await surface.evaluate(e=>e.scrollTop=0);await capture(id+'-320');
   if(['beetModal','energyTipsModal'].includes(id)){await surface.evaluate(e=>e.scrollTop=e.scrollHeight);await capture(id+'-end-320');}
   await page.evaluate(close=>window[close](),close);await expect(modal).toBeHidden();
  }
  if(meters)await verifyPhotoPreview(page,testInfo,kind,'Zählerfoto vergrößern');
  expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
  expect(errors).toEqual([]);
 });
}

// P1 parking/pet design fixtures: real HTML and read-only synthetic cloud snapshots.
for(const kind of ['parking','pet-health']){
 test(kind+': coherent actions and responsive forms at three widths',async({page},testInfo)=>{
  test.setTimeout(60000);
  const parking=kind==='parking',errors=[];page.on('pageerror',e=>errors.push(e.message));
  const pixel='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jJ1sAAAAASUVORK5CYII=';
  const snapshot=parking
   ?{sessions:[{id:2,desc:'Isoliertes Testparkhaus',sector:'Testdeck B / Platz 42',date:'17.11.2026',timestamp:'2026-11-17T12:00:00Z',cost:4.5,gps:{lat:0,lng:0},photo:previewImage}],activeEndTime:null}
   :{pets:[{id:1,name:'Isoliertes Testtier',species:'Test-Rasse',chip:'TEST-123',food:'Isoliertes Futter',allergies:'Synthetischer Hinweis',tasso:true,photo:previewImage,passport:pixel,vet:{name:'Isolierte Testpraxis',tel:'000',email:'fixture@example.invalid',address:'Synthetische Adresse'}}],events:[{id:2,petId:1,type:'Impfung',title:'Isolierter Testeintrag',date:'2026-11-17',expiryDate:'2027-11-17',cost:42,receipt:pixel}],meds:[{id:3,name:'Isolierter Vorrat',stock:'3 Packungen'},{id:4,name:'Isolierter Warnvorrat',stock:'fast leer'}]};
  await isolated(page,true,true,snapshot);
  await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});
  const route='/tools/'+kind+'/index.html';await page.goto(origin+route);
  await expect.poll(()=>page.evaluate(parking=>parking
   ?typeof parkingCloudReady!=='undefined'&&parkingCloudReady&&!!parkingCloudController?.ready
   :typeof petCloudReady!=='undefined'&&petCloudReady&&!!petCloudController?.ready,parking)).toBe(true);
  await page.locator('.toolya-signature-footer').waitFor();
  await expect.poll(()=>page.locator('#settingsModal').evaluate(e=>getComputedStyle(e).display)).toBe('none');
  if(await page.locator('#toolya-consent-panel').isVisible())await page.getByRole('button',{name:'Ablehnen',exact:true}).click();
  const capture=async id=>{await page.screenshot({path:testInfo.outputPath('mobility-'+kind+'-'+id+'.png')});await page.screenshot({path:testInfo.outputPath('mobility-'+kind+'-'+id+'.jpg'),type:'jpeg',quality:42})};
  const fits=async loc=>loc.evaluate(e=>e.scrollWidth<=e.clientWidth+1);
  const inspectActions=async loc=>{
   for(const b of await loc.locator('button.b3-action:visible').all()){
    expect(await b.evaluate(e=>e.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    await expect(b).toHaveCSS('font-weight','700');
    if(!(await b.getAttribute('class')).includes('b3-outline')){
     await expect(b).toHaveCSS('background-color','rgb(0, 126, 159)');
     expect(await b.evaluate(e=>{
      const c=getComputedStyle(e),lum=v=>v.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
      const a=lum(c.color),b=lum(c.backgroundColor);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
     })).toBeGreaterThanOrEqual(4.5);
    }
   }
  };
  for(const width of [320,768,1440]){
   await page.setViewportSize({width,height:1000});
   expect(new URL(page.url()).pathname).toBe(route);await expect(page.locator('html')).toHaveCSS('color-scheme','light');
   await inspectActions(page.locator('main.b3-dashboard'));
   const grid=page.locator(parking?'.b3-park-form-grid':'.b3-pet-create-grid');
   expect(await grid.evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length)).toBe(width<1280?1:2);
   if(width===768)expect(await page.locator(parking?'#parkDesc':'#petName').evaluate(e=>e.getBoundingClientRect().width)).toBeGreaterThan(600);
   await grid.evaluate(e=>e.scrollIntoView({block:'start'}));await capture('form-'+width);
   if(parking){
    await page.locator('button[onclick="setFavorite(\'⭐ Bahnhof\')"]').click();
    await expect(page.locator('#parkDesc')).toHaveValue('⭐ Bahnhof');
    await grid.locator(':scope>div').nth(1).evaluate(e=>e.scrollIntoView({block:'start'}));await capture('entry-'+width);
    await page.locator('#b3-history').evaluate(e=>e.scrollIntoView({block:'start'}));expect(await fits(page.locator('#b3-history'))).toBe(true);await capture('list-'+width);
   }else{
    expect(await page.locator('#petTasso').evaluate(e=>e.getBoundingClientRect().width)).toBeGreaterThanOrEqual(16);
    await page.locator('#petVetName').evaluate(e=>e.closest('div.border-t').scrollIntoView({block:'start'}));await capture('profile-end-'+width);
    await page.locator('#eventPetSelect').selectOption('1');
    await page.locator('#eventType').selectOption('Impfung');await expect(page.locator('#vaccineExpiryBox')).toBeVisible();
    await grid.locator(':scope>div').nth(1).evaluate(e=>e.scrollIntoView({block:'start'}));await capture('event-'+width);
    await page.locator('#eventType').selectOption('Gewicht');await expect(page.locator('#eventWeight')).toBeVisible();await expect(page.locator('#vaccineExpiryBox')).toBeHidden();
    if(width===320)await capture('weight-'+width);
    await page.locator('#b3-medication').evaluate(e=>e.scrollIntoView({block:'start'}));
    expect(await fits(page.locator('#b3-medication'))).toBe(true);
    for(const input of await page.locator('.b3-pet-med-fields input').all())expect(await input.evaluate(e=>e.getBoundingClientRect().width)).toBeGreaterThanOrEqual(width<768?200:120);
    const affiliate=await page.locator('#medList a').first().getAttribute('href');
    expect(new URL(affiliate).searchParams.get('tag')).toBe('duhrrom-21');
    await expect(page.locator('#medList')).toContainText('Fast leer!');
    if(width===768)expect(await page.locator('.b3-pet-med-card').first().evaluate(e=>e.getBoundingClientRect().width)).toBeGreaterThan(300);
    for(const card of await page.locator('.b3-pet-med-card').all()){
     expect(await card.locator('button').evaluate(e=>{const a=e.getBoundingClientRect(),b=e.parentElement.getBoundingClientRect();return a.top-b.top<15&&b.right-a.right<15})).toBe(true);
    }
    await capture('medication-'+width);
    await page.locator('#b3-records').evaluate(e=>e.scrollIntoView({block:'start'}));await capture('profiles-'+width);
    await page.locator('#eventsList').evaluate(e=>e.closest('div.bg-white').scrollIntoView({block:'start'}));await capture('events-'+width);
   }
   const danger=page.locator(parking?'button[onclick="deleteSession(2)"]':'button[onclick="deleteEvent(2)"]');
   await expect(danger).not.toHaveClass(/b3-action/);
   expect(await danger.evaluate(e=>e.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
   const red=await danger.evaluate(e=>getComputedStyle(e).color.match(/[\d.]+/g).map(Number));expect(red[0]).toBeGreaterThan(red[1]);
   const form=page.locator(parking?'#parkDesc':'#petName');await form.focus();await page.keyboard.press('Tab');
   expect(await page.evaluate(()=>parseFloat(getComputedStyle(document.activeElement).outlineWidth))).toBeGreaterThanOrEqual(3);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  }
  await page.setViewportSize({width:320,height:1000});
  if(parking){
   await page.evaluate(()=>toggleHelpModal());await expect(page.locator('#helpModal')).toBeVisible();
   expect(await fits(page.locator('#helpModal>div'))).toBe(true);
   await capture('help-320');await page.locator('#helpModal>div').evaluate(e=>e.scrollTop=e.scrollHeight);await capture('help-end-320');
   await page.evaluate(()=>toggleHelpModal());
  }else{
   await page.locator('#settingsBtn').click();
   await revealToolSetting(page.locator('#helpToggleBtn'));
   await page.locator('#helpToggleBtn').click();await expect(page.locator('#helpBox')).toBeVisible();
   expect(await fits(page.locator('#settingsModal>div'))).toBe(true);
   for(const title of await page.locator('#helpBox .text-white,#helpBox .text-teal-200').all()){
    await expect(title).toHaveCSS('color','rgb(16, 43, 69)');
    expect(await title.evaluate(e=>{
     const c=getComputedStyle(e),bg=getComputedStyle(e.closest('.grid')?e.closest('.grid').firstElementChild:e.closest('#helpBox')).backgroundColor;
     const lum=v=>v.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
     const a=lum(c.color),b=lum(bg);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    })).toBeGreaterThanOrEqual(4.5);
   }
   await page.locator('#helpBox').evaluate(e=>e.scrollIntoView({block:'start'}));await capture('help-320');
   await page.evaluate(()=>closeSettings());
  }
  await verifyPhotoPreview(page,testInfo,kind,parking?'Parkplatzfoto vergrößern':'Haustierfoto vergrößern');
  expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
  expect(errors).toEqual([]);
 });
}

// P1 WG/baking: real pages, cloud responses fully intercepted, no production accounts.
for(const kind of ['housemates','baking']){
 test(kind+': shared controls across actual tool sections and dialogs',async({page},testInfo)=>{
  test.setTimeout(90000);
  const wg=kind==='housemates',errors=[];page.on('pageerror',e=>errors.push(e.message));
  const fixture=wg?{__wg:{id:'00000000-0000-4000-8000-000000000109',updated_at:'2026-11-17T00:00:00Z',payload:{
   flatmates:[{vorname:'Mia',nachname:'Test'},{vorname:'Ben',nachname:'Test'}],
   notes:[{id:1,title:'Isolierte Notiz',content:'Synthetische Prüfansicht',author:'Mia Test',date:'17.11.2026',color:'yellow',pinned:true}],
   data:[{id:2,title:'Isolierter Kassenbon',price:42,payer:'Mia Test',date:'2026-11-17',category:'Lebensmittel',entryType:'ausgabe',splitWith:['Mia Test','Ben Test'],photos:[]}],
   budgets:{Lebensmittel:100},goals:[{id:3,title:'Isoliertes Sparziel',target:100,current:20}],
   events:[],inventory:[],diets:{},cleaning:[],shopping:[],contracts:[],
   cooking:['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'].map(day=>({day,chef:'Frei',dish:'',ingredients:''})),
   infoboard:{wifi:'Synthetisches WLAN',landlord:'Isolierte Prüfansicht',caretaker:'',trash:''}
  }}}:{recipes:[{name:'Isoliertes Rezept',text:'250g Mehl',factor:1,date:'17.11.2026',note:'Synthetische Prüfansicht'}]};
  await isolated(page,true,true,fixture);
  await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});
  const route='/tools/'+kind+'/index.html';
  await page.goto(origin+route+(wg?'?id=secure_00000000-0000-4000-8000-000000000109':''));
  await expect.poll(()=>page.evaluate(wg=>wg?typeof secureWgRevision!=='undefined'&&!!secureWgRevision:typeof bakingCloudReady!=='undefined'&&bakingCloudReady&&!!bakingCloudController?.ready,wg)).toBeTruthy();
  await page.locator('.toolya-signature-footer').waitFor();
  const settings=page.locator(wg?'#settingsModal':'#settings-modal');
  await expect.poll(()=>settings.evaluate(e=>getComputedStyle(e).display)).toBe('none');
  if(await page.locator('#toolya-consent-panel').isVisible())await page.getByRole('button',{name:'Ablehnen',exact:true}).click();
  const capture=async id=>{await page.screenshot({path:testInfo.outputPath('living-'+kind+'-'+id+'.png')});await reviewImage(page,'living-'+kind+'-'+id)};
  const fits=async loc=>loc.evaluate(e=>e.scrollWidth<=e.clientWidth+1);
  const inspect=async loc=>{
   for(const b of await loc.locator('button.b3-action:visible').all()){
    expect(await b.evaluate(e=>e.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    await expect(b).toHaveCSS('font-weight','700');
    if(!(await b.getAttribute('class')).includes('b3-outline')){
     await expect(b).toHaveCSS('background-color','rgb(0, 126, 159)');
     expect(await b.evaluate(e=>{
      const lum=v=>v.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
      const c=getComputedStyle(e),a=lum(c.color),d=lum(c.backgroundColor);return(Math.max(a,d)+.05)/(Math.min(a,d)+.05);
     })).toBeGreaterThanOrEqual(4.5);
    }
   }
  };
  for(const width of [320,768,1440]){
   await page.setViewportSize({width,height:1000});expect(new URL(page.url()).pathname).toBe(route);
   await expect(page.locator('html')).toHaveCSS('color-scheme','light');
   if(wg){
    for(const id of ['#b3-notes','#b3-info','#formCard']){
     const panel=page.locator(id);await panel.evaluate(e=>e.scrollIntoView({block:'start'}));expect(await fits(panel)).toBe(true);await inspect(panel);await capture(id.slice(1)+'-'+width);
    }
    if(width===320)for(const id of ['#b3-debts','#b3-cleaning','#b3-cooking']){
     const panel=page.locator(id);await panel.evaluate(e=>e.scrollIntoView({block:'start'}));expect(await fits(panel)).toBe(true);await capture(id.slice(1)+'-'+width);
    }
    if(width===320)expect(await page.locator('#newShoppingItem').evaluate(e=>e.getBoundingClientRect().width)).toBeGreaterThan(200);
    if(width===1440){expect(await page.locator('#savingsGoalsGrid>div').first().evaluate(e=>e.getBoundingClientRect().width)).toBeGreaterThanOrEqual(240);await page.locator('#savingsGoalsGrid').evaluate(e=>e.scrollIntoView({block:'start'}));await capture('goals-'+width)}
    expect(await page.locator('.b3-wg-finance-grid').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length)).toBe(width<768?1:3);
    await page.locator('button[onclick="editReceipt(2)"]').click();
    await expect(page.locator('#cancelEditBtn')).toBeVisible();await page.locator('#cancelEditBtn').click();
    await page.locator('button[onclick="openNoteModal()"]').click();
    await expect(page.locator('#noteModal')).toBeVisible();await inspect(page.locator('#noteModal'));
    expect(await fits(page.locator('#noteModal>div'))).toBe(true);
    await page.locator('#noteTitleInput').focus();await page.keyboard.press('Tab');
    expect(await page.evaluate(()=>parseFloat(getComputedStyle(document.activeElement).outlineWidth))).toBeGreaterThanOrEqual(3);
    await capture('note-dialog-'+width);await page.evaluate(()=>closeNoteModal());
    await expect(page.locator('button[onclick="deleteReceipt(2)"]')).not.toHaveClass(/b3-action/);
   }else{
    await page.locator('#btn-tab-rechner').click();
    await page.locator('#tab-rechner').evaluate(e=>e.scrollIntoView({block:'start'}));await inspect(page.locator('main'));await capture('calculator-'+width);
    const form = await page.locator('#bsui-source').boundingBox();
    const preview = await page.locator('#bsui-stage').boundingBox();
    if (width === 320) {
     expect(preview.y).toBeGreaterThanOrEqual(form.y + form.height);
     expect(Math.abs(preview.width - form.width)).toBeLessThanOrEqual(1);
    } else {
     expect(preview.x).toBeGreaterThanOrEqual(form.x + form.width);
     expect(Math.abs(preview.y - form.y)).toBeLessThanOrEqual(1);
     if (width === 1440) expect(preview.width).toBeGreaterThan(500);
    }
    const recipeDetails = page.locator('#bsui-recipe-details');
    if (await recipeDetails.getAttribute('open') === null) await recipeDetails.locator('summary').click();
    await page.locator('#recipe-input').fill('250g Mehl');
    await page.locator('#orig-d').fill('26');await page.locator('#target-d').fill('20');
    expect(Number(await page.locator('#res-factor').innerText())).toBeCloseTo(400/676,2);
    await page.locator('#recipe-input').focus();await page.keyboard.press('Tab');
    expect(await page.evaluate(()=>parseFloat(getComputedStyle(document.activeElement).outlineWidth))).toBeGreaterThanOrEqual(3);
    await page.locator('#recipe-input').evaluate(e=>e.scrollIntoView({block:'start'}));await capture('recipe-'+width);
    await page.locator('#b3-baking-results').evaluate(e=>e.scrollIntoView({block:'start'}));expect(await fits(page.locator('#b3-baking-results'))).toBe(true);await capture('results-'+width);
    for(const tab of ['substanz','tools','rezepte','finder']){
     if(tab==='finder')await page.evaluate(()=>openTab('finder'));else await page.locator('#btn-tab-'+tab).click();
     await expect(page.locator('#tab-'+tab)).toBeVisible();await page.locator('#tab-'+tab).evaluate(e=>e.scrollIntoView({block:'start'}));
     await inspect(page.locator('#tab-'+tab));expect(await fits(page.locator('#tab-'+tab))).toBe(true);await capture(tab+'-'+width);
    }
    await page.evaluate(()=>openCookMode());await expect(page.locator('#cook-modal')).toBeVisible();await inspect(page.locator('#cook-modal'));expect(await fits(page.locator('#cook-modal>div'))).toBe(true);await capture('timer-'+width);await page.evaluate(()=>closeCookMode());
    await page.evaluate(()=>openSettings());await revealToolSetting(page.locator('#b3-backform-edit'));await page.locator('#b3-backform-edit').click();await expect(page.locator('#b3-backform-editor')).toBeVisible();
    await inspect(page.locator('#b3-backform-editor'));await page.locator('#b3-backform-editor').evaluate(e=>e.scrollIntoView({block:'start'}));await capture('editor-'+width);
    await page.locator('#b3-backform-editor').getByRole('button',{name:'Abbrechen',exact:true}).click();await page.evaluate(()=>closeSettings());
    await expect(page.locator('button[onclick="deleteRecipe(0)"]')).not.toHaveClass(/b3-action/);
   }
   if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))console.log('WG_BAKING_OVERFLOW',JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('body *')].map(e=>({id:e.id,tag:e.tagName,cls:typeof e.className==='string'?e.className.slice(0,110):'',right:Math.round(e.getBoundingClientRect().right),width:Math.round(e.getBoundingClientRect().width)})).filter(x=>x.width>0&&x.right>innerWidth+1).slice(0,35))));
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  }
  if(wg){
   await page.setViewportSize({width:320,height:1000});
   const dialogs=[['eventModal','openAddEventModal','closeAddEventModal'],['inventoryModal','openAddInventoryModal','closeAddInventoryModal'],['dietModal','openDietModal','closeDietModal'],['budgetModal','openBudgetModal','closeBudgetModal'],['savingsModal','openAddGoalModal','closeSavingsModal'],['infoboardModal','openInfoboardModal','closeInfoboardModal'],['mitbewohnerModal','openMitbewohnerModal','closeMitbewohnerModal'],['cleanTaskModal','openAddCleanTaskModal','closeAddCleanTaskModal'],['cookingModal','openCookingModal','closeCookingModal'],['contractModal','openContractModal','closeContractModal'],['helpModal','toggleHelpModal','toggleHelpModal']];
   for(const[id,open,close]of dialogs){
    await page.evaluate(fn=>window[fn](),open);const modal=page.locator('#'+id);await expect(modal).toBeVisible();expect(await fits(modal.locator(':scope>div'))).toBe(true);await inspect(modal);
    await modal.locator(':scope>div').evaluate(e=>e.scrollTop=0);await capture(id+'-320');
    if(['mitbewohnerModal','cookingModal','budgetModal'].includes(id)){const scroller=page.locator(id==='cookingModal'?'#cookingInputList':id==='budgetModal'?'#budgetInputList':'#mitbewohnerModal>div');await scroller.evaluate(e=>e.scrollTop=e.scrollHeight);await capture(id+'-end-320')}
    if(id==='mitbewohnerModal'){expect(await page.locator('#flatmateList').evaluate(e=>e.getBoundingClientRect().height)).toBeGreaterThan(80);await page.locator('button[onclick="editFlatmateContact(0)"]').click();await expect(page.locator('#mateVorname')).toHaveValue('Mia');await page.locator('#mateCancelBtn').click();await expect(page.locator('#mateVorname')).toHaveValue('');}
    await page.evaluate(fn=>window[fn](),close);await expect(modal).toBeHidden();
   }
   expect(await page.evaluate(()=>window.__toolyaMock.wgReads)).toBeGreaterThan(0);
  }
  expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);expect(errors).toEqual([]);
 });
}

// Read-only account layout acceptance; no credential submission or production access.
for(const kind of ["car","budget","moving","loans","meters","plants","parking","pet-health","housemates","baking"]){
 test(kind+': account actions are consistent and usable at three widths',async({page},testInfo)=>{
  test.setTimeout(60000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await isolated(page,true,true);await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});
  await page.goto(origin+'/tools/'+kind+'/index.html');await page.locator('.toolya-signature-footer').waitFor();
  if(await page.locator('#toolya-consent-panel').isVisible())await page.getByRole('button',{name:'Ablehnen',exact:true}).click();
  for(const width of [320,768,1440]){
   await page.setViewportSize({width,height:1000});
   await page.evaluate(()=>{if(typeof openSettings==='function')openSettings();else toggleSettingsModal()});
   const modal=page.locator('#settingsModal,#settings-modal');await expect(modal).toBeVisible();
   const surface=modal.locator(':scope>div');await surface.evaluate(e=>e.scrollTop=0);
   for(const b of await modal.locator('button:visible').all())expect(await b.evaluate(e=>e.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
   expect(await surface.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
   for(const button of await modal.locator('button[onclick="supabaseLogin()"],button[onclick="loginUser()"],button[onclick="supabaseRegister()"],button[onclick="registerUser()"]').all()){
    await expect(button).toHaveClass(/b3-action/);expect(await button.evaluate(e=>e.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    await expect(button).toHaveCSS('font-weight','700');
    if(!((await button.getAttribute('class')).includes('b3-outline')))await expect(button).toHaveCSS('background-color','rgb(0, 126, 159)');
    await button.focus();expect(await button.evaluate(e=>parseFloat(getComputedStyle(e).outlineWidth))).toBeGreaterThanOrEqual(3);
   }
   await surface.evaluate(e=>e.scrollTop=0);await page.screenshot({path:testInfo.outputPath('account-'+kind+'-'+width+'.png')});await reviewImage(page,'account-'+kind+'-'+width);
   await page.evaluate(()=>{if(typeof closeSettings==='function')closeSettings();else toggleSettingsModal()});await expect(modal).toBeHidden();
  }
  expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);expect(errors).toEqual([]);
 });
}

test('wishlist: public cards and navigation remain usable at three widths',async({page},testInfo)=>{
 const profile={user_id:'11111111-1111-4111-8111-111111111111',display_name:'Isoliertes Wunschprofil mit langem Anzeigenamen',country:'Schweiz',city:'Isolierter Ort',bio:'Synthetische Prüfansicht für Bücher, Garten und gemeinsame Geschenkideen.',interests:['Bücher','Garten'],lists:[{name:'Geburtstagswünsche',url:'https://www.amazon.de/hz/wishlist/ls/ABC123',occasion:'Geburtstag'}]};
 await isolatedWishlist(page,true,[profile]);await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto(origin+'/tools/wishes/public.html');
 await expect(page.locator('#profile a[href*="wishes=add"]')).toBeVisible();await page.locator('#search').fill('Isoliertes');await expect(page.locator('#results .profile-card')).toHaveCount(1);
 await page.locator('.toolya-signature-footer').waitFor();await page.getByRole('button',{name:'Ablehnen',exact:true}).click();
 const navigation=page.getByRole('navigation',{name:'Wunschlisten',exact:true});
 const discoverLink=navigation.locator('a[href="#discover"]');
 const profileLink=navigation.locator('a[href="#profile"]');
 for(const width of [320,768,1440]){
  await page.setViewportSize({width,height:1000});
  for(const link of [discoverLink,profileLink]){
   expect((await link.boundingBox()).height).toBeGreaterThanOrEqual(40);
   await expect(link).toHaveCSS('background-color','rgb(255, 255, 255)');
  }
  await profileLink.focus();
  await expect(profileLink).toBeFocused();
  await expect(profileLink).toHaveCSS('outline-width','3px');
  // Programmatic focus does not necessarily trigger :focus-visible; keyboard focus is covered by the accessibility suite.
  await navigation.scrollIntoViewIfNeeded();
  await page.screenshot({path:testInfo.outputPath('wishlist-navigation-'+width+'.png')});
 }
 await page.keyboard.press('Enter');
 await expect(page).toHaveURL(/#profile$/);
 await discoverLink.click();
 await expect(page).toHaveURL(/#discover$/);
 for(const width of [320,768,1440]){
  await page.setViewportSize({width,height:1000});
  if(width<=600)expect(await page.locator('#results .profile-identity').evaluate(e=>{
   const hero=e.closest('.profile-hero'),style=getComputedStyle(hero);
   return e.getBoundingClientRect().width>=hero.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)-1;
  })).toBe(true);
  for(const [name,selector]of [['card','#results'],['actions','#profile .actions']]){
   const panel=page.locator(selector);await panel.evaluate(e=>e.scrollIntoView({block:'start'}));
   expect(await panel.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
   await page.screenshot({path:testInfo.outputPath('wishlist-'+name+'-'+width+'.png')});await reviewImage(page,'wishlist-'+name+'-'+width);
  }
 }
 expect(await page.evaluate(()=>window.__wishlistMock.writes.length)).toBe(0);
});

test('dashboard: shared actions, task rows and account dialog at three widths',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await isolated(page,true,true,{__dashboard:true});
 await page.addInitScript(()=>{
  localStorage.setItem('toolya_dashboard_tasks_v1',JSON.stringify([{id:'fixture-task',text:'Isolierte Aufgabe mit langem Text für die Prüfung der mobilen Bedienfläche und der Schaltfläche zum Entfernen',done:false}]));
  localStorage.setItem('toolya_dashboard_reminders_v1',JSON.stringify([{id:'fixture-reminder',text:'Isolierte Erinnerung mit langem Text',due:'2030-01-01T12:00:00Z',done:false}]));
  localStorage.setItem('hub_favorites',JSON.stringify(['wishlist','kassenbon']));
  localStorage.setItem('toolya_recent_tools_v1',JSON.stringify(['kfz']));
 });
 await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});
 await page.goto(origin+'/dashboard/');await page.locator('.toolya-signature-footer').waitFor();
 await expect(page.locator('#tasks input[type=checkbox]')).toHaveCount(1);
 await page.getByRole('button',{name:'Ablehnen',exact:true}).click();
 const capture=async name=>{await page.screenshot({path:testInfo.outputPath(name+'.png')});await reviewImage(page,name)};
 for(const width of [320,768,1440]){
  await page.setViewportSize({width,height:1000});await expect(page.locator('html')).toHaveCSS('color-scheme','light');
  for(const id of ['#favorites','#task-form','#reminder-form']){
   const panel=page.locator(id);await panel.evaluate(e=>e.closest('section').scrollIntoView({block:'start'}));
   expect(await panel.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);await capture('dashboard-'+id.slice(1)+'-'+width);
  }
  for(const b of await page.locator('main button:visible').all())expect(await b.evaluate(e=>e.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  if(width===320)for(const row of await page.locator('#tasks li,#reminders li').all()){
   const textBox=await row.locator('span').first().boundingBox();const removeBox=await row.locator('button').boundingBox();
   expect(textBox.width).toBeGreaterThanOrEqual(150);expect(removeBox.y).toBeGreaterThanOrEqual(textBox.y+textBox.height);
  }
  const checkbox=page.locator('#tasks input[type=checkbox]');expect(await checkbox.evaluate(e=>e.getBoundingClientRect().width)).toBeGreaterThanOrEqual(16);
  await page.locator('#task-text').focus();await page.keyboard.press('Tab');expect(await page.evaluate(()=>parseFloat(getComputedStyle(document.activeElement).outlineWidth))).toBeGreaterThanOrEqual(3);
  await page.locator('#settingsBtn').click();const modal=page.locator('#settingsModal');await expect(modal).toBeVisible();
  for(const b of await modal.locator('button:visible').all())expect(await b.evaluate(e=>e.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  await expect(page.locator('#registerUser')).toBeHidden(); // Existing authenticated dashboard hides sign-up.
  await expect(page.locator('#loginSubmit')).toBeHidden();
  await expect(page.locator('#logoutUser')).toBeVisible();
  expect(await page.locator('.dashboard-settings-panel').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);await capture('dashboard-account-'+width);
  await page.locator('#closeSettingsBtn').click();await expect(modal).toBeHidden();
  await expect(page.locator('#settingsBtn')).toBeFocused();
  for(const lang of ['en','de']){
   const localeButton=page.locator('button[data-dashboard-locale="'+lang+'"]');
   await localeButton.focus();await page.keyboard.press('Enter');
   await expect(page.locator('html')).toHaveAttribute('lang',lang);
   const settings=page.locator('#settingsBtn');
   const overlap=await page.evaluate(()=>{
    const a=document.querySelector('#settingsBtn').getBoundingClientRect(),b=document.querySelector('.ty-dashboard-locale').getBoundingClientRect();
    return Math.min(a.right,b.right)>Math.max(a.left,b.left)&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top);
   });
   expect(overlap).toBe(false);
   await settings.click();await expect(modal).toBeVisible();
   await expect(modal).toHaveAttribute('aria-labelledby','settingsTitle');
   expect(await modal.evaluate(el=>el.contains(document.activeElement))).toBe(true);
   await expect(page.locator('#cloudStatus')).toHaveAttribute('role','status');
   await expect(page.locator('#cloudStatus')).toHaveAttribute('aria-live','polite');
   await page.keyboard.press('Escape');await expect(modal).toBeHidden();await expect(settings).toBeFocused();
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }
 expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);expect(errors).toEqual([]);
});

test('dashboard recovery keeps English and restores manual sign-out after an auth failure',async({page})=>{
 await isolated(page,true,true,{__dashboard:true,__recovery:true});
 await page.setViewportSize({width:320,height:800});
 await page.goto(origin+'/dashboard/?auth=1&lang=en');
 await expect(page).toHaveURL(new RegExp('/dashboard/\\?lang=en$'));
 await expect(page.locator('button[data-dashboard-locale="en"]')).toHaveAttribute('aria-pressed','true');
 await page.evaluate(()=>{
  const mock=window.__toolyaMock;
  const auth=window.toolyaDashboardAuthClient.auth;
  mock.recoveryCalls=[];
  auth.updateUser=()=>new Promise(resolve=>{
   mock.recoveryCalls.push('update');
   mock.finishUpdate=(error)=>resolve({error});
  });
  auth.signOut=async()=>{
   mock.recoveryCalls.push('signOut');
   if(mock.recoveryCalls.filter(call=>call==='signOut').length===1)return {error:{message:'Synthetic network error'}};
   mock.signedIn=false;
   return {error:null};
  };
  for(const listener of mock.authListeners)listener('PASSWORD_RECOVERY',{access_token:'synthetic-token'});
 });
 const panel=page.locator('#passwordRecoveryPanel');
 const password=page.locator('#recoveryPassword');
 const confirmation=page.locator('#recoveryPasswordConfirm');
 const submit=page.locator('#saveRecovery');
 const status=page.locator('#loginMessage');
 const signOut=page.locator('#logoutUser');
 await expect(panel).toBeVisible();
 await expect(password).toBeFocused();
 await password.fill('synthetic-password');
 await confirmation.fill('synthetic-password');
 await submit.click();
 await expect(submit).toBeDisabled();
 await submit.dispatchEvent('click');
 expect(await page.evaluate(()=>window.__toolyaMock.recoveryCalls)).toEqual(['update']);
 await page.evaluate(()=>window.__toolyaMock.finishUpdate({message:'Synthetic update failure'}));
 await expect(status).toHaveText('The password could not be changed. Request a new reset link.');
 await expect(submit).toBeEnabled();
 await expect(password).toHaveValue('synthetic-password');
 await submit.click();
 await page.evaluate(()=>window.__toolyaMock.finishUpdate(null));
 await expect(panel).toBeHidden();
 await expect(password).toHaveValue('');
 await expect(confirmation).toHaveValue('');
 await expect(status).toHaveText('Password changed, but signing out failed. Please sign out manually.');
 await expect(signOut).toBeVisible();
 await signOut.click();
 await expect(status).toHaveText('Signed out.');
 await expect(page.locator('#signedOutControls')).toBeVisible();
 expect(await page.evaluate(()=>window.__toolyaMock.recoveryCalls)).toEqual(['update','update','signOut','signOut']);
 expect(await page.evaluate(()=>window.__toolyaMock.writes)).toEqual([]);
});

for(const kind of ['car','budget','moving','meters','pet-health'])test(kind+': help and backup controls stay readable and keyboard accessible',async({page},testInfo)=>{
 test.setTimeout(60000);await isolated(page,true,true);
 await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});
 await page.goto(origin+'/tools/'+kind+'/index.html');await page.locator('.toolya-signature-footer').waitFor();
 if(await page.locator('#toolya-consent-panel').isVisible())await page.getByRole('button',{name:'Ablehnen',exact:true}).click();
 for(const width of [320,768,1440]){
  await page.setViewportSize({width,height:1000});await page.evaluate(()=>openSettings());
  const actions=page.locator('.b3-backup-actions'),picker=actions.locator('.b3-backup-picker'),input=picker.locator('input');
  await revealToolSetting(actions);
  await actions.scrollIntoViewIfNeeded();
  for(const control of [actions.locator('button'),picker]){
   await expect(control).toHaveCSS('background-color','rgb(255, 255, 255)');
   expect(await control.evaluate(e=>e.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  }
  await actions.locator('button').focus();await page.keyboard.press('Tab');await expect(input).toBeFocused();
  expect(await picker.evaluate(e=>parseFloat(getComputedStyle(e).outlineWidth))).toBeGreaterThanOrEqual(3);
  expect(await actions.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('backup-'+kind+'-'+width+'.png')});
  if(kind==='meters'){await page.evaluate(()=>closeSettings());continue;}
  if(kind!=='budget'){
   const helpToggle=page.locator('#helpToggleBtn');
   await revealToolSetting(helpToggle);
   await helpToggle.click();
  }
  else{await page.evaluate(()=>closeSettings());await page.evaluate(()=>toggleGuide())}
  const help=page.locator(kind!=='budget'?'#helpBox':'#guideSection');await expect(help).toBeVisible();await help.scrollIntoViewIfNeeded();
  await expect(help).toHaveCSS('background-color','rgb(255, 255, 255)');
  for(const title of await help.locator('.text-red-200,.text-emerald-200,.text-white,.text-amber-200,.text-teal-200').all())await expect(title).toHaveCSS('color','rgb(16, 43, 69)');
  expect(await help.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
  for(const card of await help.locator('.grid>div').all())expect(await card.evaluate(e=>e.getBoundingClientRect().width)).toBeGreaterThanOrEqual(120);
  await page.screenshot({path:testInfo.outputPath('help-'+kind+'-'+width+'.png')});
  await help.locator('button').click();await expect(help).toBeHidden();
  if(kind!=='budget')await page.evaluate(()=>closeSettings());
 }
 expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
});

for(const kind of ['loans','plants','parking','housemates'])test(kind+': help disclosures and close controls at three widths',async({page},testInfo)=>{
 test.setTimeout(60000);await isolated(page,true,true);await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});
 await page.goto(origin+'/tools/'+kind+'/index.html');await page.locator('.toolya-signature-footer').waitFor();
 if(await page.locator('#toolya-consent-panel').isVisible())await page.getByRole('button',{name:'Ablehnen',exact:true}).click();
 for(const width of [320,768,1440]){
  await page.setViewportSize({width,height:1000});await page.evaluate(()=>toggleHelpModal());const help=page.locator('#helpModal');await expect(help).toBeVisible();
  const surface=help.locator(':scope>div');
  for(const b of await help.locator('button').all()){
   expect(await b.evaluate(e=>e.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
   await b.focus();expect(await b.evaluate(e=>parseFloat(getComputedStyle(e).outlineWidth))).toBeGreaterThanOrEqual(3);
  }
  const summary=help.locator('summary').first();await summary.focus();await page.keyboard.press('Enter');await expect(help.locator('details').first()).toHaveAttribute('open','');
  expect(await summary.evaluate(e=>e.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  expect(await surface.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
  await surface.evaluate(e=>e.scrollTop=0);await page.screenshot({path:testInfo.outputPath('help-'+kind+'-'+width+'.png')});
  await help.locator('button').first().click();await expect(help).toBeHidden();await page.evaluate(()=>document.querySelector('#helpModal details').open=false);
 }
 expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
});

for(const kind of ['meters','baking'])test(kind+': inline help remains readable at three widths',async({page},testInfo)=>{
 test.setTimeout(60000);await isolated(page,true,true);await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});
 await page.goto(origin+'/tools/'+kind+'/index.html');await page.locator('.toolya-signature-footer').waitFor();
 if(await page.locator('#toolya-consent-panel').isVisible())await page.getByRole('button',{name:'Ablehnen',exact:true}).click();
 for(const width of [320,768,1440]){
  await page.setViewportSize({width,height:1000});
  if(kind==='baking'){
   const more=page.locator('#b3-backform-more>summary');
   await more.press('Enter');
   await page.locator('#b3-backform-more').getByRole('button',{name:/Hilfe & Anleitung/}).press('Enter');
   await expect(page.locator('#help-box button')).toBeFocused();
  }else await page.locator('#b3-faq>button').click();
  const help=page.locator(kind==='baking'?'#help-box':'#accordionContent');await expect(help).toBeVisible();await help.scrollIntoViewIfNeeded();
  if(kind==='baking'){const editor=page.locator('#b3-backform-edit');expect(await editor.evaluate(e=>e.getBoundingClientRect().right<=e.parentElement.getBoundingClientRect().right+1)).toBe(true);}
  expect(await help.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
  for(const card of await help.locator('.grid>div').all())expect(await card.evaluate(e=>e.getBoundingClientRect().width)).toBeGreaterThanOrEqual(120);
  await page.screenshot({path:testInfo.outputPath('help-'+kind+'-'+width+'.png')});
  if(kind==='baking'){await help.locator('button').click();await page.evaluate(()=>closeSettings())}else await page.locator('#b3-faq>button').click();
  await expect(help).toBeHidden();
 }
 expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
});

// Retained wishlist subpages: signed-out appearance only, all application traffic intercepted.
for(const routeName of ['assistant','bookmarks','cockpit','collection','dashboard','discover','feed','gift-analytics','gift-tasks','notifications','occasions','planner','profile','report','reservations','social'])test('legacy wishes '+routeName+': signed-out light layout at three widths',async({page},testInfo)=>{
 test.setTimeout(60000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await isolated(page,false);
 await page.addInitScript(()=>document.addEventListener('DOMContentLoaded',()=>document.body.classList.add('wishlist-dark')));
 await page.route('**/tools/wishes/toolya-client.mjs',route=>route.fulfill({contentType:'text/javascript',body:`
 window.__legacyMock={reads:[],writes:[],authReads:0};
 const discovery=${routeName==='discover'};
 const listId='00000000-0000-4000-8000-000000000001';
 const result=table=>({data:discovery?(table==='wishlist_lists'?[{id:listId,user_id:'synthetic-owner',title:'Isolierte Sammlung',description:'Nur im abgefangenen Browser sichtbar',icon:'🎁',created_at:'2030-01-01T00:00:00Z'}]:table==='wishlist_profiles'?[{user_id:'synthetic-owner',handle:'isoliert',display_name:'Isolierte Person'}]:table==='wishlist_follows'?[{followed_id:'synthetic-owner'},{followed_id:'synthetic-owner'}]:[]):[],error:null});
 function query(table){const q={then(resolve){resolve(result(table))},async single(){return {data:null,error:null}},async maybeSingle(){return {data:null,error:null}}};
 for(const method of ['select','eq','neq','is','in','or','not','contains','order','limit','range','gte','lte','gt','lt','match','ilike'])q[method]=()=>q;
 for(const method of ['insert','update','upsert','delete'])q[method]=()=>{window.__legacyMock.writes.push({table,method});throw Error('Unexpected legacy fixture write')};return q;}
 export const db={auth:{async getUser(){window.__legacyMock.authReads++;return {data:{user:null},error:null}},async getSession(){window.__legacyMock.authReads++;return {data:{session:null},error:null}},onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}}},
 from(table){window.__legacyMock.reads.push(table);return query(table)},async rpc(name){if(name==='wishlist_collection_like_counts'){window.__legacyMock.reads.push(name);return {data:[{list_id:listId,like_count:3}],error:null}}window.__legacyMock.writes.push({rpc:name});throw Error('Unexpected legacy fixture RPC')}};
 `}));
 await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});
 await page.goto(origin+'/tools/wishes/'+routeName+'.html');await page.locator('.toolya-signature-footer').waitFor();await page.waitForLoadState('networkidle');
 if(await page.locator('#toolya-consent-panel').isVisible())await page.getByRole('button',{name:'Ablehnen',exact:true}).click();
 if(routeName==='assistant'){
  await expect(page.locator('#status')).toHaveText('Bitte anmelden.');
  // Exercise the actual language selector: it synchronizes the locale module's
  // active language, storage and translation observer (a synthetic event does not).
  await page.locator('[data-wishes-locale="en"]').click();
  await expect(page.locator('#status')).toHaveText('Please sign in.');
  await page.locator('[data-wishes-locale="de"]').click();
  await expect(page.locator('#status')).toHaveText('Bitte anmelden.');
 }
 await page.waitForFunction(()=>!!window.__legacyMock);
 if(routeName==='discover'){
  await expect(page.locator('#status')).toContainText('1 öffentliche Sammlungen gefunden');
  await expect(page.locator('#grid .badge')).toContainText('3 Likes · 👥 2 Profil-Follower');
  await page.locator('#search').fill('Keine synthetische Übereinstimmung');await expect(page.locator('#grid .empty')).toContainText('Keine passenden Sammlungen');
  await page.locator('#search').fill('');await expect(page.locator('#grid .card')).toHaveCount(1);
 }
 for(const width of [320,768,1440]){
  await page.setViewportSize({width,height:1000});await expect(page.locator('html')).toHaveCSS('color-scheme','light');
  await expect(page.locator('body')).toHaveCSS('background-color','rgb(243, 247, 251)');
  await expect(page.locator('footer')).toHaveCount(1);
  const settings=page.locator('.ty-tool-hero .toolya-settings-trigger');expect(await settings.evaluate(e=>e.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  for(const link of await page.locator('.wishes-navigation a:not([aria-current])').all()){await expect(link).toHaveCSS('background-color','rgb(255, 255, 255)');await expect(link).toHaveCSS('color','rgb(16, 43, 69)');if(width===320)expect(await link.evaluate(e=>e.getBoundingClientRect().width)).toBeGreaterThanOrEqual(100);}
  for(const panel of await page.locator('main>section:visible,main .metric:visible').all())await expect(panel).toHaveCSS('background-color','rgb(255, 255, 255)');
  for(const link of await page.locator('main .nav a:visible').all()){await expect(link).toHaveCSS('background-color','rgb(0, 126, 159)');await expect(link).toHaveCSS('color','rgb(255, 255, 255)');}
  if(width===320){const title=page.locator('.ty-tool-hero h1');expect(await title.evaluate(e=>e.getBoundingClientRect().width)).toBeGreaterThan(250);await expect(title).toHaveCSS('hyphens','auto');}
  await expect(page.locator('h1:visible')).toHaveCount(1);await expect(page.locator('body>header')).toBeHidden();await expect(page.locator('.toolya-idle')).toBeHidden();
  for(const panel of await page.locator('main .panel:visible,main .hero:visible,main .card:visible').all()){
   expect(await panel.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);await expect(panel).toHaveCSS('background-color','rgb(255, 255, 255)');
  }
  for(const b of await page.locator('main button:visible').all())expect(await b.evaluate(e=>e.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  const tab=page.locator('.wishes-navigation a').first();await tab.focus();expect(await tab.evaluate(e=>parseFloat(getComputedStyle(e).outlineWidth))).toBeGreaterThanOrEqual(3);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:testInfo.outputPath('legacy-'+routeName+'-'+width+'.png')});
 }
 expect(await page.evaluate(()=>window.__legacyMock.writes)).toEqual([]);expect(errors).toEqual([]);
});

// Public detail, empty/error/recovery states; every backend request is intercepted.
test('wishlist: public detail and search states stay usable without writes',async({page},testInfo)=>{
 const profile={user_id:'22222222-2222-4222-8222-222222222222',display_name:'Isoliertes öffentliches Wunschprofil mit langem Namen',country:'Schweiz',city:'Prüfort',bio:'Nur synthetische Browseransicht.',interests:['Bücher'],lists:[{id:'22222222-2222-4222-8222-222222222223',name:'Isolierte Bücherwünsche',url:'https://www.amazon.de/hz/wishlist/ls/ABC123'}]};
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await isolatedWishlist(page,false,[profile]);await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto(origin+'/tools/wishes/public.html?profile='+profile.user_id);await expect(page.locator('#profileDetail .profile-card')).toHaveCount(1);
 await page.locator('.toolya-signature-footer').waitFor();if(await page.locator('#toolya-consent-panel').isVisible())await page.getByRole('button',{name:'Ablehnen',exact:true}).click();
 const buttons=page.locator('[data-profile-favorite="'+profile.user_id+'"]');await expect(buttons).toHaveCount(1);
 await buttons.first().click();for(const b of await buttons.all()){await expect(b).toHaveAttribute('aria-pressed','true');await expect(b).toHaveAttribute('aria-label','Profil nicht mehr merken: '+profile.display_name);}
 await buttons.first().click();for(const b of await buttons.all()){await expect(b).toHaveAttribute('aria-pressed','false');await expect(b).toHaveAttribute('aria-label','Profil merken: '+profile.display_name);}
 for(const width of [320,768,1440]){
  await page.setViewportSize({width,height:1000});const panel=page.locator('#selectedProfile');await panel.evaluate(e=>e.scrollIntoView({block:'start'}));
  expect(await panel.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('wishlist-detail-'+width+'.png')});
  await panel.evaluate(e=>e.scrollIntoView({block:'end'}));await page.screenshot({path:testInfo.outputPath('wishlist-detail-bottom-'+width+'.png')});
 }
 for(const [state,message]of [['empty','Keine passende öffentliche Amazon-Wunschliste'],['searchError','gerade nicht geladen'],['recovery','1 passende Einträge auf dieser Seite']]){
  await page.evaluate(state=>{window.__wishlistMock.empty=state==='empty';window.__wishlistMock.searchError=state==='searchError'},state);
  if(state==='recovery')await page.locator('#retrySearch').click();
  else await page.locator('#search').fill('Isoliertes '+(state==='empty'?'leer':'Fehler'));
  await page.locator('#submitSearch').click();
  await expect(page.locator('#searchStatus')).toContainText(message);
  if(state==='searchError')await expect(page.locator('#nextPage')).toBeDisabled();
  for(const width of [320,768,1440]){await page.setViewportSize({width,height:1000});await page.locator('#discover').scrollIntoViewIfNeeded();await page.screenshot({path:testInfo.outputPath('wishlist-'+state+'-'+width+'.png')});}
 }
 expect(await page.evaluate(()=>window.__wishlistMock.writes)).toEqual([]);expect(errors).toEqual([]);
});

test('meter handover prints only the blank form on one A4 page', async ({ page }, testInfo) => {
  await isolated(page, false);
  await page.goto('/zaehlerstaende/');
  const example = page.locator('#uebergabe');
  const form = page.locator('#druckprotokoll');
  await expect(example).toBeVisible();

  await page.emulateMedia({ media: 'print' });
  await expect(example).toBeHidden();
  await expect(page.locator('#fragen')).toBeHidden();
  await expect(form.getByRole('heading')).toHaveText('Zählerprotokoll zur Wohnungsübergabe');
  await expect(form.getByText('Adresse / Wohnung:', { exact: false })).toBeVisible();
  await expect(form.getByText('Datum der Ablesung:', { exact: false })).toBeVisible();
  await expect(form.locator('tbody tr')).toHaveCount(5);
  await expect(form.getByText('Notizen:', { exact: false })).toBeVisible();

  const pdf = await page.pdf({ format: 'A4', displayHeaderFooter: false });
  expect(pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)).toHaveLength(1);
  await testInfo.attach('zaehlerprotokoll-a4', { body: pdf, contentType: 'application/pdf' });
});

test('moving boxes guide prints the sample QR label without the instructions', async ({ page }, testInfo) => {
  await isolated(page, false);
  await page.goto('/umzugskisten/');
  await expect(page.locator('#etiketten').getByRole('link', { name: 'öffentliche Musteretikett' }))
    .toHaveAttribute('href', '#musteretikett');

  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#musteretikett')).toBeHidden();
  await expect(page.locator('#fragen')).toBeHidden();
  const label = page.getByRole('region', { name: 'Druckbares Musteretikett' });
  await expect(label.getByText('Kiste 07 · Küche')).toBeVisible();
  const qr = label.getByRole('img', { name: 'QR-Code zum öffentlichen Musteretikett' });
  await expect(qr).toBeVisible();
  await expect(qr).toHaveJSProperty('naturalWidth', 328);
  const pdf = await page.pdf({format:'A4',displayHeaderFooter:false,printBackground:true});
  expect(pdf.subarray(0,5).toString('ascii')).toBe('%PDF-');
  expect(pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)).toHaveLength(1);
  expect(pdf.toString('latin1')).toMatch(/%%EOF\s*$/);
  await testInfo.attach('moving-sample-qr-print-a4',{body:pdf,contentType:'application/pdf'});
});

for (const path of ['/backform-rechner/', '/toolya-dashboard/', '/amazon-wunschliste-veroeffentlichen/']) {
  test(`guide controls and screenshot fit a narrow screen at ${path}`, async ({ page }) => {
    await isolated(page, false);
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto(path);
    const jumpLinks = await page.locator('main nav a').evaluateAll(links =>
      links.map(link => link.getBoundingClientRect().height));
    expect(jumpLinks.length).toBeGreaterThan(0);
    expect(Math.min(...jumpLinks)).toBeGreaterThanOrEqual(44);

    const toggle = page.locator('main details summary');
    await toggle.press('Enter');
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveCSS('outline-style', 'solid');
    expect((await toggle.boundingBox()).height).toBeGreaterThanOrEqual(44);

    const image = page.locator('main details figure img');
    await expect(image).toBeVisible();
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
    const bounds = await image.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);

    await toggle.press('Space');
    await expect(image).toBeHidden();
  });
}

for (const tool of ['budget', 'housemates']) {
  test(`${tool} loads receipt OCR on demand and retries a failed download`, async ({ page }) => {
    await isolated(page, true);
    let downloads = 0;
    await page.route('**/tesseract.min.js', async route => {
      downloads++;
      if (downloads === 1) return route.abort();
      return route.fulfill({
        contentType: 'application/javascript',
        body: "window.Tesseract = {createWorker: async () => ({recognize: async () => ({data: {text: 'Gesamt 12,34 EUR'}}), terminate: async () => {}})};"
      });
    });
    await page.goto(origin + '/tools/' + tool + '/index.html');
    await expect(page.locator('#receiptPhotoInput')).toHaveCount(1);
    expect(downloads).toBe(0);
    await page.locator('#receiptPhotoInput').setInputFiles({
      name: 'sample.png', mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jJ1sAAAAASUVORK5CYII=', 'base64')
    });
    const scan = page.getByRole('button', { name: tool === 'budget' ? /Text automatisch erkennen/ : /Texterkennung/ });
    await scan.dispatchEvent('click');
    await expect(page.locator('#ocrStatus')).toContainText('fehlgeschlagen');
    await scan.dispatchEvent('click');
    await expect(page.locator('#ocrStatus')).toContainText(tool === 'budget' ? 'ausgefüllt' : 'Erfolgreich');
    expect(downloads).toBe(2);
  });
}

for (const [tool, action] of [
  ['meters', 'exportHandoverPDF'], ['moving', 'exportInventoryPDF'],
  ['budget', 'exportPDF'], ['car', 'exportPDF'], ['parking', 'exportPDF'],
  ['housemates', 'exportAbrechnungPDF'], ['pet-health', 'exportPDF'],
  ['loans', 'exportPDF'], ['plants', 'exportPDF']
]) {
  test(`${tool} loads its PDF library on export and can retry`, async ({ page }) => {
    await isolated(page, true);
    let downloads = 0;
    await page.route('**/jspdf.umd.min.js', async route => {
      downloads++;
      if (downloads === 1) return route.abort();
      return route.fulfill({
        contentType: 'application/javascript',
        body: `window.jspdf = {jsPDF: class {
          setFont() {} setFontSize() {} text() {} addPage() {}
          splitTextToSize(value) { return [value]; }
          save(filename) { window.pdfExportFilename = filename; }
        }};`
      });
    });
    await page.goto(origin + '/tools/' + tool + '/index.html');
    expect(downloads).toBe(0);
    // Cloud-only vehicle and budget reports require a verified snapshot; await the isolated fixture.
    if (tool === 'car' || tool === 'budget') {
      await expect.poll(() => page.evaluate(() => typeof toolyaCloudReady !== 'undefined' && toolyaCloudReady && !!toolyaCloudController?.ready)).toBe(true);
    }
    await page.evaluate(() => { window.alert = message => { window.pdfExportError = message; }; });
    await page.evaluate(handler => window[handler](), action);
    await expect.poll(() => page.evaluate(() => window.pdfExportError)).toContain('Bitte versuche es erneut');
    await page.evaluate(handler => window[handler](), action);
    await expect.poll(() => page.evaluate(() => window.pdfExportFilename)).toMatch(/\.pdf$/);
    expect(downloads).toBe(2);
  });
}

test('moving boxes download the scanner only on demand and retry on error', async ({ page }) => {
  await isolated(page, true);
  let requests = 0;
  await page.route('**/html5-qrcode.min.js', async route => {
    if (++requests === 1) return route.abort();
    return route.fulfill({
      contentType: 'application/javascript',
      body: 'window.Html5Qrcode = class { async start() { window.mockScannerStarted = true; } };'
    });
  });
  await page.goto(origin + '/tools/moving/index.html');
  expect(requests).toBe(0);
  await page.evaluate(() => { window.alert = message => { window.mockScannerError = message; }; });
  await page.evaluate(() => openScannerModal());
  await expect.poll(() => page.evaluate(() => window.mockScannerError)).toContain('erneut');
  await page.evaluate(() => openScannerModal());
  await expect.poll(() => page.evaluate(() => window.mockScannerStarted)).toBe(true);
  expect(requests).toBe(2);
});

for (const tool of ['loans', 'plants', 'moving', 'budget', 'housemates']) {
  test(`${tool} downloads the QR generator on demand and retries on error`, async ({ page }) => {
    await isolated(page, true);
    let requests = 0;
    await page.route('**/qrcodejs/1.0.0/qrcode.min.js', async route => {
      if (++requests === 1) return route.abort();
      return route.fulfill({
        contentType: 'application/javascript',
        body: 'window.QRCode = class { constructor(element, options) { element.textContent = options.text; } };'
      });
    });
    await page.goto(origin + '/tools/' + tool + '/index.html');
    expect(requests).toBe(0);
    await page.evaluate(() => { window.alert = message => { window.mockQrError = message; }; });
    const show = () => page.evaluate(tool => {
      if (tool === 'moving') return showQrCode(7, 'Muster');
      if (tool === 'budget') {
        window.getData = () => [{ id: 7, title: 'Muster', date: '2026-11-20' }];
        return openQRModal(7);
      }
      if (tool === 'housemates') {
        window.prompt = question => question.includes('SSID') ? 'Muster' : 'Beispiel';
        return openWLANQRModal();
      }
      return showQrCode('Muster', 'Beispiel', '', 5);
    }, tool);
    await show();
    await expect.poll(() => page.evaluate(() => window.mockQrError)).toContain('erneut');
    await show();
    const qr = page.locator(tool === 'housemates' ? '#wlanQrcode' : '#qrcode');
    await expect(qr).toContainText(tool === 'moving' ? '?box=7' : 'Muster');
    expect(requests).toBe(2);
  });
}

for (const [tool, expected, remaining = 0] of [
  ['budget', 3], ['meters', 1], ['moving', 3], ['car', 1], ['parking', 1],
  ['housemates', 3], ['pet-health', 1], ['loans', 2], ['plants', 2]
]) {
  test(`compare mobile startup requests for ${tool}`, async ({ browser }) => {
    test.skip(!process.env.TOOLYA_STARTUP_COMPARISON, 'requires the fetched baseline commit');
    const { execFileSync } = require('node:child_process');
    const revision = 'eb1ed8a09831603aaaeb8ffe4c34d0f98716d4ab';
    const wgId = '00000000-0000-4000-8000-000000000109';
    const fixture = tool === 'housemates' ? { __wg: {
      id: wgId, updated_at: '2026-11-17T00:00:00Z', payload: { flatmates: [] }
    } } : null;
    const path = 'tools/' + tool + '/index.html';
    const url = origin + '/' + path + (fixture ? '?id=secure_' + wgId : '');
    const baseline = execFileSync('git', ['show', revision + ':' + path], { encoding: 'utf8' });
    const results = [];
    for (const html of [baseline, null]) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      try {
        await isolated(page, true, false, fixture);
        if (html !== null) {
          await page.route(url, route => route.fulfill({ contentType: 'text/html; charset=utf-8', body: html }));
        }
        const requests = [];
        page.on('request', request => {
          if (/\/(?:jspdf\.umd\.min|tesseract\.min|qrcode\.min|html5-qrcode\.min)\.js$/.test(new URL(request.url()).pathname)) {
            requests.push(request.url());
          }
        });
        await page.goto(url);
        await expect(page).toHaveURL(url);
        await expect.poll(() => page.evaluate(() => window.__toolyaMock?.signedIn)).toBe(true);
        await expect.poll(() => page.evaluate(tool => {
          if (tool === 'meters') return typeof metersCloudReady !== 'undefined' && metersCloudReady;
          if (tool === 'moving') return typeof movingCloudReady !== 'undefined' && movingCloudReady;
          if (tool === 'parking') return typeof parkingCloudReady !== 'undefined' && parkingCloudReady;
          if (tool === 'pet-health') return typeof petCloudReady !== 'undefined' && petCloudReady;
          if (tool === 'loans') return typeof loansCloudReady !== 'undefined' && loansCloudReady;
          if (tool === 'plants') return typeof plantsCloudReady !== 'undefined' && plantsCloudReady;
          if (tool === 'housemates') return typeof secureWgRevision !== 'undefined' && !!secureWgRevision;
          return typeof toolyaCloudReady !== 'undefined' && toolyaCloudReady;
        }, tool)).toBe(true);
        results.push(requests.length);
      } finally {
        await page.close();
      }
    }
    expect(results, tool).toEqual([expected, remaining]);
    console.log(`[mobile startup] ${tool}: ${results[0]} -> ${results[1]} optional library requests`);
  });
}

test('record mobile lab paint timings for public entry points', async ({ browser }, testInfo) => {
  test.skip(!process.env.TOOLYA_STARTUP_COMPARISON, 'runs in the isolated browser workflow');
  const results = [];
  for (const path of ['/', '/backform-rechner/', '/tools/wishes/public.html']) {
    const samples = [];
    for (let run = 0; run < 3; run++) {
      const page = await browser.newPage({
        viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce'
      });
      try {
        await isolated(page, false);
        await page.addInitScript(() => {
          new PerformanceObserver(list => {
            window.toolyaLabLcp = list.getEntries().at(-1)?.startTime;
          }).observe({ type: 'largest-contentful-paint', buffered: true });
        });
        await page.goto(origin + path);
        await expect(page).toHaveURL(origin + path);
        await expect.poll(() => page.evaluate(() => window.toolyaLabLcp || 0)).toBeGreaterThan(0);
        // Use a fixed observation window for late paint candidates after load.
        await page.waitForTimeout(1000);
        samples.push(await page.evaluate(() => ({
          fcpMs: Math.round(performance.getEntriesByName('first-contentful-paint')[0].startTime),
          lcpMs: Math.round(window.toolyaLabLcp)
        })));
      } finally {
        await page.close();
      }
    }
    results.push({ path, samples });
  }
  console.log('[mobile paint lab]', JSON.stringify(results));
  await testInfo.attach('mobile-paint-lab', { body: JSON.stringify(results, null, 2), contentType: 'application/json' });
});

const pdfLibrary = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
const qrLibrary = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
const startupLibraries = {
  budget: [pdfLibrary, qrLibrary, 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'],
  meters: [pdfLibrary],
  moving: [pdfLibrary, qrLibrary, 'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js']
};
for (const tool of Object.keys(startupLibraries)) {
  for (const loadLibraries of [false, true]) {
   const libraryUrls = startupLibraries[tool];
   test(`record mobile lab paint timings for ${tool}${loadLibraries ? ' with CDN downloads' : ''}`, async ({ browser }, testInfo) => {
     test.skip(!process.env.TOOLYA_STARTUP_COMPARISON, 'requires the fetched baseline commit');
     const { execFileSync } = require('node:child_process');
     const path = `tools/${tool}/index.html`;
     const baseline = execFileSync('git', ['show', `eb1ed8a09831603aaaeb8ffe4c34d0f98716d4ab:${path}`], { encoding: 'utf8' });
     const url = origin + '/' + path;
     const samples = { baseline: [], current: [] };
     const repetitions = loadLibraries ? 6 : tool === 'moving' ? 12 : 3;
     if (loadLibraries || tool === 'moving') test.setTimeout(loadLibraries ? 180000 : 90000);
     for (let run = 0; run < repetitions; run++) {
       for (const variant of run % 2 ? ['current', 'baseline'] : ['baseline', 'current']) {
         const page = await browser.newPage({
           viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce'
         });
         try {
           await isolated(page, true);
           const libraryResponses = [];
           if (loadLibraries) {
             for (const libraryUrl of libraryUrls) {
               await page.route(libraryUrl, route => route.continue());
             }
             page.on('response', response => {
               if (libraryUrls.includes(response.url())) libraryResponses.push(response);
             });
           }
           // Hold shared assets and mock services constant while comparing the HTML variants.
           if (variant === 'baseline') {
             await page.route(url, route => route.fulfill({ contentType: 'text/html; charset=utf-8', body: baseline }));
           }
           await page.addInitScript(() => {
             new PerformanceObserver(list => {
               window.toolyaLabLcp = list.getEntries().at(-1)?.startTime;
             }).observe({ type: 'largest-contentful-paint', buffered: true });
           });
           await page.goto(url);
           await expect(page).toHaveURL(url);
           if (loadLibraries) {
             expect(libraryResponses.map(response => response.url()).sort())
               .toEqual(variant === 'baseline' ? [...libraryUrls].sort() : []);
             expect(libraryResponses.every(response => response.ok())).toBe(true);
             await Promise.all(libraryResponses.map(response => response.finished()));
           }
           await expect.poll(() => page.evaluate(tool => {
             if (!window.__toolyaMock?.signedIn) return false;
             if (tool === 'meters') return typeof metersCloudReady !== 'undefined' && metersCloudReady;
             if (tool === 'moving') return typeof movingCloudReady !== 'undefined' && movingCloudReady;
             return typeof toolyaCloudReady !== 'undefined' && toolyaCloudReady;
           }, tool)).toBe(true);
           await page.waitForTimeout(1000);
           samples[variant].push(await page.evaluate(() => ({
             fcpMs: Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime),
             lcpMs: Math.round(window.toolyaLabLcp)
           })));
           expect(samples[variant].at(-1).fcpMs).toBeGreaterThan(0);
           expect(samples[variant].at(-1).lcpMs).toBeGreaterThan(0);
         } finally {
           await page.close();
         }
       }
     }
     console.log('[mobile tool paint lab]', JSON.stringify({ tool, loadLibraries, samples }));
     await testInfo.attach(`mobile-paint-${tool}${loadLibraries ? '-cdn' : ''}`, { body: JSON.stringify(samples, null, 2), contentType: 'application/json' });
   });
  }
}

const publicGuideRoutes = [...require('node:fs').readFileSync('sitemap.xml', 'utf8')
  .matchAll(/<loc>https:\/\/toolya\.app(\/[^/]+\/)<\/loc>/g)].map(match => match[1]).filter(path => path !== '/en/'); // English homepage is covered by the separate home accessibility tests.

for (const path of publicGuideRoutes) {
  test(`public guide has usable keyboard navigation at two widths: ${path}`, async ({ page }) => {
    await isolated(page, false);
    for (const width of [320, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(origin + path);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      const skip = page.getByRole('link', { name: 'Zum Inhalt', exact: true });
      await page.keyboard.press('Tab');
      await expect(skip).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('main')).toBeFocused();
      expect(await page.locator('nav[aria-label="Inhalt der Anleitung"] a').evaluateAll(links =>
        links.length > 0 && links.every(link => link.getBoundingClientRect().height >= 44))).toBe(true);
      expect(await page.evaluate(() =>
        document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    }
  });
}

for (const [path, tableCount] of [
  ['/backform-rechner/', 2], ['/haushaltsbuch/', 1],
  ['/wg-organisator/', 1], ['/zaehlerstaende/', 1]
]) {
  test(`guide tables retain accessible names, headers and keyboard focus: ${path}`, async ({ page }) => {
    await isolated(page, false);
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(origin + path);
    const regions = page.locator('.guide-table-scroll');
    await expect(regions).toHaveCount(tableCount);
    for (const region of await regions.all()) {
      const regionName = await region.getAttribute('aria-label');
      expect(regionName?.trim()).toBeTruthy();
      await expect(page.getByRole('region', { name: regionName, exact: true })).toHaveCount(1);
      const caption = await region.locator('caption').innerText();
      const table = region.getByRole('table', { name: caption, exact: true });
      await expect(table).toBeVisible();
      expect(await table.getByRole('columnheader').count()).toBeGreaterThan(1);
      await expect(region).toHaveAttribute('tabindex', '0');
      await region.focus();
      await expect(region).toBeFocused();
      await expect(region).toHaveCSS('outline-style', 'solid');
      if (await region.evaluate(element => element.scrollWidth > element.clientWidth)) {
        await page.keyboard.press('ArrowRight');
        await expect.poll(() => region.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
      }
    }
  });
}


// Sprint A: real DE/EN controls in Chromium at phone and tablet widths.
// All cloud responses are synthetic and all requests except local preview and
// display-only CSS are intercepted by isolated(). No production credentials.
test('i18n Sprint A moving: 320/768px preserve box draft and selected location',async({page},testInfo)=>{
 test.setTimeout(60000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await isolated(page,true,true,{
  locations:[{id:1,name:'Synthetic storage',icon:'📦'}],
  boxes:[{id:2,locId:1,name:'Synthetic box',desc:'Sample',value:12.5,tag:'Zerbrechlich',barcode:'',expiry:'',lentTo:'',subItems:[]}]
 });
 await page.goto(origin+'/tools/moving/index.html');
 await expect.poll(()=>page.evaluate(()=>typeof movingCloudReady!=='undefined'&&movingCloudReady&&!!movingCloudController?.ready)).toBe(true);
 if(await page.locator('#toolya-consent-panel').isVisible()) await page.getByRole('button',{name:'Ablehnen',exact:true}).click();
 for(const width of [320,768]){
  await page.setViewportSize({width,height:900});
  await page.locator('#boxLocationSelect').selectOption('1');
  await page.locator('#boxName').fill('Unsaved draft box');
  await page.evaluate(()=>{document.querySelector('[data-tool-locale="en"]').click()});
  await expect(page.locator('#boxLocationSelect')).toHaveValue('1');
  await expect(page.locator('#boxName')).toHaveValue('Unsaved draft box');
  await expect(page.locator('label[for="boxName"] .helferlein-field-label')).toHaveText('Box name');
  await expect(page.locator('#boxLocationSelect option[value=""]')).toHaveText('-- Choose location --');
  await expect(page.locator('#tagFilter option[value="Zerbrechlich"]')).toHaveText('Fragile');
  await page.evaluate(()=>toggleHelp());
  await expect(page.locator('#helpToggleBtn span')).toHaveText('Hide help and guide');
  await page.evaluate(()=>toggleHelp());
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('i18n-moving-'+width+'.png')});
  await page.evaluate(()=>{document.querySelector('[data-tool-locale="de"]').click()});
  await expect(page.locator('#boxLocationSelect')).toHaveValue('1');
  await expect(page.locator('#boxName')).toHaveValue('Unsaved draft box');
  await expect(page.locator('#tagFilter option[value="Zerbrechlich"]')).toHaveText('Zerbrechlich');
 }
 expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
 expect(errors).toEqual([]);
});

test('i18n Sprint A plants: 320/768px localize cistern without modifying capacity',async({page},testInfo)=>{
 test.setTimeout(60000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await isolated(page,true,true);
 await page.goto(origin+'/tools/plants/index.html');
 await expect.poll(()=>page.evaluate(()=>typeof plantsCloudReady!=='undefined'&&plantsCloudReady&&!!plantsCloudController?.ready)).toBe(true);
 if(await page.locator('#toolya-consent-panel').isVisible()) await page.getByRole('button',{name:'Ablehnen',exact:true}).click();
 await page.evaluate(()=>openCisternModal());
 for(const width of [320,768]){
  await page.setViewportSize({width,height:900});
  const capacity=page.locator('#cisternMaxLiters');
  await capacity.fill('15000');
  await page.evaluate(()=>{document.querySelector('[data-tool-locale="en"]').click()});
  await expect(capacity).toHaveValue('15000');
  await expect(page.locator('#cisternPercentText')).toContainText('% full');
  await expect(page.locator('#cisternModal p.text-sky-700')).toHaveText('Remaining volume');
  await expect(page.locator('#cisternModal button[onclick="closeCisternModal()"]')).toHaveText('Close');
  expect(await page.locator('#cisternModal > div').evaluate(el=>el.scrollWidth<=el.clientWidth+2)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('i18n-plants-'+width+'.png')});
  await page.evaluate(()=>{document.querySelector('[data-tool-locale="de"]').click()});
  await expect(capacity).toHaveValue('15000');
  await expect(page.locator('#cisternPercentText')).toContainText('% gefüllt');
 }
 expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
 expect(errors).toEqual([]);
});

test('i18n Sprint A baking: 320/768px preserve recipe draft and do not resave previews',async({page},testInfo)=>{
 test.setTimeout(60000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await isolated(page,true,true,{recipes:[{name:'Synthetic recipe',text:'100 g flour',factor:1,date:'2026-11-20',note:'Existing saved note'}]});
 await page.goto(origin+'/tools/baking/index.html');
 await expect.poll(()=>page.evaluate(()=>typeof bakingCloudReady!=='undefined'&&bakingCloudReady&&!!bakingCloudController?.ready)).toBe(true);
 if(await page.locator('#toolya-consent-panel').isVisible()) await page.getByRole('button',{name:'Ablehnen',exact:true}).click();
 for(const width of [320,768]){
  await page.setViewportSize({width,height:900});
  await page.locator('#recipe-input').fill('2 Eier\n100 g Mehl');
  await page.evaluate(()=>{
   document.querySelector('[data-recipe-note-input]').value='Unsaved draft note';
   renderRecipePreview();
   document.querySelector('[data-tool-locale="en"]').click();
  });
  await expect(page.locator('[data-recipe-note-input]')).toHaveValue('Unsaved draft note');
  await expect(page.locator('[data-recipe-note-label]')).toHaveText('Baking notes:');
  await expect(page.locator('#print-card')).toContainText('Factor');
  await expect(page.locator('label[for="recipe-name"] .helferlein-field-label')).toHaveText('My recipe');
  await expect(page.locator('label[for="recipe-input"] .helferlein-field-label')).toHaveText('My ingredients');
  await expect(page.locator('button[onclick="calculateRecipe()"]')).toContainText('Calculate quantities');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('i18n-baking-'+width+'.png')});
  await page.evaluate(()=>{document.querySelector('[data-tool-locale="de"]').click()});
  await expect(page.locator('[data-recipe-note-input]')).toHaveValue('Unsaved draft note');
  await expect(page.locator('[data-recipe-note-label]')).toHaveText('Geling-Protokoll / Notiz:');
  await expect(page.locator('#recipe-input')).toHaveValue('2 Eier\n100 g Mehl');
 }
 expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
 expect(errors).toEqual([]);
});

test('i18n Sprint A household: 320/768px budget and cooking editor drafts survive language changes',async({page},testInfo)=>{
 test.setTimeout(90000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const fixture={__wg:{id:'00000000-0000-4000-8000-000000000109',updated_at:'2026-11-17T00:00:00Z',payload:{
  flatmates:[{vorname:'Mia',nachname:'Test'},{vorname:'Ben',nachname:'Test'}],
  notes:[],data:[],budgets:{Lebensmittel:100},goals:[],events:[],inventory:[],
  diets:{},cleaning:[],shopping:[],contracts:[],
  cooking:['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'].map(day=>({day,chef:'Frei',dish:'',ingredients:''})),
  infoboard:{wifi:'',landlord:'',caretaker:'',trash:''}
 }}};
 await isolated(page,true,true,fixture);
 await page.goto(origin+'/tools/housemates/index.html?id=secure_00000000-0000-4000-8000-000000000109');
 await expect.poll(()=>page.evaluate(()=>typeof secureWgRevision!=='undefined'&&!!secureWgRevision)).toBe(true);
 if(await page.locator('#toolya-consent-panel').isVisible()) await page.getByRole('button',{name:'Ablehnen',exact:true}).click();
 for(const width of [320,768]){
  await page.setViewportSize({width,height:900});
  await page.evaluate(()=>openBudgetModal());
  const amount=page.locator('#budgetInputList input[data-cat="Lebensmittel"]');
  await amount.fill('175');
  await page.evaluate(()=>{document.querySelector('[data-tool-locale="en"]').click()});
  await expect(amount).toHaveValue('175');
  await expect(page.locator('label[for="budget-amount-0"]')).toHaveText('Groceries:');
  expect(await page.locator('#budgetModal > div').evaluate(el=>el.scrollWidth<=el.clientWidth+2)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('i18n-household-budget-'+width+'.png')});
  await page.evaluate(()=>closeBudgetModal());
  await page.evaluate(()=>openCookingModal());
  const dish=page.locator('#cookingInputList input.dishInput').first();
  await dish.fill('Unsaved dinner plan');
  await page.evaluate(()=>{document.querySelector('[data-tool-locale="de"]').click()});
  await expect(dish).toHaveValue('Unsaved dinner plan');
  await expect(page.locator('#cookingInputList [data-cooking-day]').first()).toHaveText('Montag');
  await page.evaluate(()=>{document.querySelector('[data-tool-locale="en"]').click()});
  await expect(dish).toHaveValue('Unsaved dinner plan');
  await expect(page.locator('#cookingInputList [data-cooking-day]').first()).toHaveText('Monday');
  await expect(dish).toHaveAttribute('placeholder','Dish');
  expect(await page.locator('#cookingModal > div').evaluate(el=>el.scrollWidth<=el.clientWidth+2)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('i18n-household-cooking-'+width+'.png')});
  await page.evaluate(()=>closeCookingModal());
  await page.evaluate(()=>{document.querySelector('[data-tool-locale="de"]').click()});
 }
 expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
 expect(errors).toEqual([]);
});


// Native-dialog boundary: verify the real locale selector and browser dialog
// wrappers with synthetic cloud fixtures; no migration, import or database calls.
for(const calendar of [
 {tool:'car',collection:'cars',relation:'carId',type:'TÜV',de:'KFZ-Termin',en:'Vehicle appointment'},
 {tool:'pet-health',collection:'pets',relation:'petId',type:'Impfung',de:'Haustier-Termin',en:'Pet appointment'}
]){
 test(calendar.tool+' downloads a bilingual all-day calendar file from the real event button',async({page})=>{
  const {readFile}=require('node:fs/promises');
  const name="Mia's favorite";
  const title='Prüftermin, Pflege & Öl';
  const event={id:8,[calendar.relation]:3,type:calendar.type,title,date:'2026-11-21',cost:0};
  await isolated(page,true,true,{
   [calendar.collection]:[{id:3,name}],events:[event],
   ...(calendar.tool==='car'?{tires:[]}:{meds:[]})
  });
  await page.goto(origin+'/tools/'+calendar.tool+'/index.html?lang=en');
  if(await page.locator('#toolya-consent-panel').isVisible())await page.getByRole('button',{name:'Reject',exact:true}).or(page.getByRole('button',{name:'Ablehnen',exact:true})).click();
  const button=page.locator('button[onclick="downloadEventICS(8)"]');
  await expect(button).toBeVisible();
  for(const language of ['en','de']){
   const choice=page.locator('[data-tool-locale="'+language+'"]');
   await choice.click();
   await expect(choice).toHaveAttribute('aria-pressed','true');
   await expect(button).toHaveAttribute('title',language==='en'?'Download calendar file':calendar.tool==='car'?'Apple / ICS Kalender':'ICS Kalender');
   await expect(page.locator('#eventsList')).toContainText(language==='en'?'Date: 21/11/2026':'Datum: 21.11.2026');
   await expect(page.locator('#eventsList')).toContainText(title);
   const [download]=await Promise.all([page.waitForEvent('download'),button.click()]);
   const content=(await readFile(await download.path(),'utf8')).replaceAll('\r\n ','');
   expect(download.suggestedFilename()).toMatch(/\.ics$/);
   expect(content).toContain("SUMMARY:Prüftermin\\, Pflege & Öl (Mia's favorite)\r\n");
   expect(content).toContain('DTSTART;VALUE=DATE:20261121\r\n');
   expect(content).toContain('DESCRIPTION:'+calendar[language]+'\r\n');
   expect(content).not.toContain('DTEND');
  }
  expect(await page.evaluate(()=>window.__toolyaMock.writes)).toEqual([]);
 });
}

test('i18n account status: real vehicle UI toggles both languages and signed-out state',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await isolated(page,true,true);
 await page.setViewportSize({width:320,height:800});
 await page.goto(origin+'/tools/car/index.html');
 await expect.poll(()=>page.evaluate(()=>typeof updateUserDisplay==='function'&&!!window.__toolyaMock)).toBe(true);
 const english = page.locator('[data-tool-locale="en"]');
 await english.click();
 await expect(english).toHaveAttribute('aria-pressed','true');
 await page.evaluate(()=>updateUserDisplay());
 await expect(page.locator('#cloudStatus')).toHaveText('✅ Signed in – mock@example.invalid');
 await expect(page.locator('#userInfo')).toHaveText('👤 mock@example.invalid');
 await page.evaluate(async()=>{window.__toolyaMock.signedIn=false;await updateUserDisplay()});
 await expect(page.locator('#cloudStatus')).toHaveText('Not signed in');
 await page.locator('[data-tool-locale="de"]').click();
 await page.evaluate(()=>updateUserDisplay());
 await expect(page.locator('#cloudStatus')).toHaveText('Nicht angemeldet');
 expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
 expect(errors).toEqual([]);
});

test('i18n Sprint A moving: mobile backup notices follow real DE/EN selector',async({page})=>{
 test.setTimeout(60000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await isolated(page,true,true,{locations:[],boxes:[]});
 await page.setViewportSize({width:320,height:800});
 await page.goto(origin+'/tools/moving/index.html');
 await expect.poll(()=>page.evaluate(()=>typeof movingCloudReady!=='undefined'&&movingCloudReady)).toBe(true);
 await page.locator('[data-tool-locale="en"]').click();
 const notice=page.getByRole('alertdialog',{name:'Toolya'});
 await page.evaluate(()=>alert('Backup erfolgreich importiert!'));
 await expect(notice.locator('#hl-alert-message')).toHaveText('Backup imported successfully!');
 await expect(notice.getByRole('button',{name:'OK'})).toBeFocused();
 expect(await notice.evaluate(el=>el.scrollWidth<=el.clientWidth+2)).toBe(true);
 await notice.getByRole('button',{name:'OK'}).press('Enter');
 await expect(notice).toHaveCount(0);
 await page.evaluate(()=>alert('Backup-Datei konnte nicht gelesen werden.'));
 await expect(notice.locator('#hl-alert-message')).toHaveText('The backup file could not be read.');
 await notice.getByRole('button',{name:'OK'}).click();
 await page.locator('[data-tool-locale="de"]').click();
 await page.evaluate(()=>alert('Backup erfolgreich importiert!'));
 await expect(notice.locator('#hl-alert-message')).toHaveText('Backup erfolgreich importiert!');
 await notice.getByRole('button',{name:'OK'}).click();
 expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
 expect(errors).toEqual([]);
});

test('i18n Sprint A household: mobile Wi-Fi prompt and custom member notice localize without writes',async({page})=>{
 test.setTimeout(90000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const seen=[];page.on('dialog',async d=>{seen.push({type:d.type(),message:d.message()});await d.dismiss()});
 const fixture={__wg:{id:'00000000-0000-4000-8000-000000000109',updated_at:'2026-11-17T00:00:00Z',payload:{
  flatmates:[{vorname:'Mia',nachname:'Test'}],notes:[],data:[],budgets:{},goals:[],events:[],inventory:[],diets:{},
  cleaning:[],shopping:[],contracts:[],cooking:[],infoboard:{wifi:'',landlord:'',caretaker:'',trash:''}
 }}};
 await isolated(page,true,true,fixture);
 await page.setViewportSize({width:320,height:800});
 await page.goto(origin+'/tools/housemates/index.html?id=secure_00000000-0000-4000-8000-000000000109');
 await expect.poll(()=>page.evaluate(()=>typeof secureWgRevision!=='undefined'&&!!secureWgRevision)).toBe(true);
 await page.locator('[data-tool-locale="en"]').click();
 await page.evaluate(()=>prompt('WLAN-Name (SSID):',''));
 expect(seen.at(-1)).toEqual({type:'prompt',message:'Wi-Fi network name (SSID):'});
 const notice=page.getByRole('alertdialog',{name:'Toolya'});
 await page.evaluate(()=>alert('Mitgliederverwaltung: Auth request failed'));
 await expect(notice.locator('#hl-alert-message')).toHaveText('Member management: Auth request failed');
 await expect(notice.getByRole('button',{name:'OK'})).toBeFocused();
 await notice.getByRole('button',{name:'OK'}).press('Enter');
 await expect(notice).toHaveCount(0);
 await page.locator('[data-tool-locale="de"]').click();
 await page.evaluate(()=>prompt('WLAN-Name (SSID):',''));
 expect(seen.at(-1)).toEqual({type:'prompt',message:'WLAN-Name (SSID):'});
 expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
 expect(errors).toEqual([]);
});


test('i18n Sprint A moving: malformed backup is rejected in isolated Chromium before cloud writes',async({page})=>{
 test.setTimeout(60000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await isolated(page,true,true,{locations:[],boxes:[]});
 await page.setViewportSize({width:320,height:800});
 await page.goto(origin+'/tools/moving/index.html');
 await expect.poll(()=>page.evaluate(()=>typeof movingCloudReady!=='undefined'&&movingCloudReady)).toBe(true);
 await page.locator('[data-tool-locale="en"]').click();
 const input=page.locator('input[type="file"][onchange="importBackup(event)"]');
 await input.setInputFiles({name:'invalid-backup.json',mimeType:'application/json',buffer:Buffer.from('{"locations":[],"boxes":"not-an-array"}')});
 const dialog=page.getByRole('alertdialog',{name:'Toolya'});
 await expect(dialog.locator('#hl-alert-message')).toHaveText('Invalid backup format.');
 await expect(dialog.getByRole('button',{name:'OK'})).toBeFocused();
 await dialog.getByRole('button',{name:'OK'}).click();
 await expect(input).toHaveValue('');
 expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
 await page.locator('[data-tool-locale="de"]').click();
 await input.setInputFiles({name:'invalid-backup.json',mimeType:'application/json',buffer:Buffer.from('not json')});
 await expect(dialog.locator('#hl-alert-message')).toHaveText('Fehler beim Lesen der Datei.');
 await dialog.getByRole('button',{name:'OK'}).click();
 expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
 expect(errors).toEqual([]);
});


test('i18n Sprint A moving: valid backup cancellation and oversized backup never touch cloud',async({page})=>{
 test.setTimeout(60000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const confirms=[];
 page.on('dialog',async dialog=>{
  confirms.push({type:dialog.type(),message:dialog.message()});
  if(dialog.message().includes('current backup')||dialog.message().includes('aktuelle Sicherung')) await dialog.accept();
  else await dialog.dismiss();
 });
 await isolated(page,true,true,{locations:[],boxes:[]});
 await page.setViewportSize({width:320,height:800});
 await page.goto(origin+'/tools/moving/index.html');
 await expect.poll(()=>page.evaluate(()=>typeof movingCloudReady!=='undefined'&&movingCloudReady)).toBe(true);
 const input=page.locator('input[type="file"][onchange="importBackup(event)"]');
 await page.locator('[data-tool-locale="en"]').click();
 await input.setInputFiles({name:'safe-synthetic-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({locations:[{id:123,name:'Synthetic location',icon:'📦'}],boxes:[]}))});
 await expect.poll(()=>confirms.length).toBe(3);
 expect(confirms).toEqual([
  {type:'confirm',message:'Before importing, download and check a current backup.'},
  {type:'confirm',message:'Did you successfully download the current backup?'},
  {type:'confirm',message:'Import backup? Existing data will be replaced.'}
 ]);
 expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
 await expect(input).toHaveValue('');
 await page.evaluate(()=>importBackup({target:{files:[{size:20*1024*1024+1}],value:'synthetic'}}));
 const notice=page.getByRole('alertdialog',{name:'Toolya'});
 await expect(notice.locator('#hl-alert-message')).toHaveText('Backup is too large (maximum 20 MB).');
 await expect(notice.getByRole('button',{name:'OK'})).toBeFocused();
 await notice.getByRole('button',{name:'OK'}).click();
 await page.locator('[data-tool-locale="de"]').click();
 await input.setInputFiles({name:'safe-synthetic-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({locations:[],boxes:[]}))});
 await expect.poll(()=>confirms.length).toBe(6);
 expect(confirms.slice(3)).toEqual([
  {type:'confirm',message:'Vor dem Import bitte eine aktuelle Sicherung herunterladen und überprüfen.'},
  {type:'confirm',message:'Hast du die aktuelle Sicherung erfolgreich heruntergeladen?'},
  {type:'confirm',message:'Backup importieren? Vorhandene Daten werden ersetzt.'}
 ]);
 expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
 expect(errors).toEqual([]);
});


test('i18n Sprint A moving: exported synthetic JSON matches stored snapshot byte-for-byte across locales',async({page})=>{
 test.setTimeout(60000);
 const fixture={locations:[{id:811,name:'Synthetic attic',icon:'📦'}],boxes:[{id:812,locId:811,name:'Demo crate',desc:'Synthetic only',tag:'Standard',value:12.5,subItems:[]}]};
 await isolated(page,true,true,fixture);
 await page.goto(origin+'/tools/moving/index.html');
 await expect.poll(()=>page.evaluate(()=>typeof movingCloudReady!=='undefined'&&movingCloudReady)).toBe(true);
 for(const lang of ['en','de']){
  await page.locator('[data-tool-locale="'+lang+'"]').click();
  const downloadPromise=page.waitForEvent('download');
  await page.evaluate(()=>exportBackup());
  const download=await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^homebox-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const parts=[];for await(const chunk of await download.createReadStream())parts.push(chunk);
  const payload=JSON.parse(Buffer.concat(parts).toString('utf8'));
  expect(payload).toEqual(fixture);
  expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
 }
});

test('i18n Sprint A moving: confirmed restore writes synthetic cloud snapshot only after consent',async({page})=>{
 test.setTimeout(90000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const confirmations=[];
 page.on('dialog',async dialog=>{
  confirmations.push({type:dialog.type(),message:dialog.message()});
  if(dialog.type()==='confirm')await dialog.accept();
  else await dialog.dismiss();
 });
 await isolated(page,true,true,{locations:[],boxes:[]});
 await page.setViewportSize({width:320,height:800});
 await page.goto(origin+'/tools/moving/index.html');
 await expect.poll(()=>page.evaluate(()=>typeof movingCloudReady!=='undefined'&&movingCloudReady)).toBe(true);
 await page.locator('[data-tool-locale="en"]').click();
 // Initial synthetic snapshot exists at revision 1. Honor the repository's
 // compare-and-swap response contract (next revision must be 2).
 await page.evaluate(()=>{
  const base=window.supabaseClient.rpc.bind(window.supabaseClient);
  window.supabaseClient.rpc=async(name,args)=>{
   const result=await base(name,args);
   if(result.data?.[0]) result.data[0].revision=(args.p_expected_revision??0)+1;
   return result;
  };
 });
 const snapshot={locations:[{id:911,name:'Synthetic pantry',icon:'📍'}],boxes:[{id:912,locId:911,name:'Synthetic box',desc:'Only mocked',tag:'Standard',value:5,subItems:[]}]};
 const file=page.locator('input[type="file"][onchange="importBackup(event)"]');
 await file.setInputFiles({name:'synthetic-restore.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(snapshot))});
 await expect.poll(()=>page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(1);
 expect(confirmations).toEqual([
  {type:'confirm',message:'Before importing, download and check a current backup.'},
  {type:'confirm',message:'Did you successfully download the current backup?'},
  {type:'confirm',message:'Import backup? Existing data will be replaced.'}
 ]);
 const writes=await page.evaluate(()=>window.__toolyaMock.writes);
 expect(writes[0].p_data).toEqual(snapshot);
 const dialog=page.getByRole('alertdialog',{name:'Toolya'});
 await expect(dialog.locator('#hl-alert-message')).toHaveText('Backup imported successfully!');
 await dialog.getByRole('button',{name:'OK'}).click();
 await expect(file).toHaveValue('');
 expect(errors).toEqual([]);
});


test('i18n Sprint A moving PDF report labels translate while source records stay untouched',async({page})=>{
 test.setTimeout(60000);
 const fixture={locations:[{id:501,name:'Synthetic loft',icon:'📍'}],boxes:[{id:502,locId:501,name:'My custom stored box',desc:'User description',lentTo:'Test borrower',tag:'Standard',value:21.5,subItems:[{name:'Personal item'}]}]};
 await isolated(page,true,true,fixture);
 await page.goto(origin+'/tools/moving/index.html');
 await expect.poll(()=>page.evaluate(()=>typeof movingCloudReady!=='undefined'&&movingCloudReady)).toBe(true);
 await page.evaluate(()=>{
  window.__pdfSpy={texts:[],files:[]};
  window.jspdf={jsPDF:class {
   setFont(){return this}setFontSize(){return this}
   splitTextToSize(v){return [String(v)]}
   text(v){window.__pdfSpy.texts.push(String(v));return this}
   addPage(){return this}
   save(v){window.__pdfSpy.files.push(v)}
  }};
 });
 for(const lang of ['en','de']){
  await page.locator('[data-tool-locale="'+lang+'"]').click();
  await page.evaluate(()=>{window.__pdfSpy.texts.length=0;return exportInventoryPDF()});
  const result=await page.evaluate(()=>({texts:window.__pdfSpy.texts.slice(),files:window.__pdfSpy.files.slice(),snapshot:getData(),writes:window.__toolyaMock.writes.length}));
  expect(result.snapshot).toEqual(fixture);
  expect(result.writes).toBe(0);
  expect(result.texts.join(' ')).toContain('My custom stored box');
  expect(result.texts.join(' ')).toContain('Test borrower');
  expect(result.texts.join(' ')).toContain('Personal item');
  if(lang==='en'){
   expect(result.files.at(-1)).toBe('moving-box-inventory-report.pdf');
   expect(result.texts.join(' ')).toContain('Total inventory value: 21.50 EUR');
   expect(result.texts.join(' ')).toContain('Lent to');
  }else{
   expect(result.files.at(-1)).toBe('kisten-inventar-report.pdf');
   expect(result.texts.join(' ')).toContain('Gesamtwert des Inventars: 21,50 EUR');
   expect(result.texts.join(' ')).toContain('Ausgeliehen an');
  }
 }
});

test('i18n Sprint A moving: blocked PDF library gives EN/DE error, no export or cloud write',async({page})=>{
 test.setTimeout(60000);
 await isolated(page,true,true,{locations:[],boxes:[]});
 await page.goto(origin+'/tools/moving/index.html');
 await expect.poll(()=>page.evaluate(()=>typeof movingCloudReady!=='undefined'&&movingCloudReady)).toBe(true);
 const dialog=page.getByRole('alertdialog',{name:'Toolya'});
 for(const [lang,message] of [['en','Could not create the PDF. Please try again.'],['de','Das PDF konnte nicht erstellt werden. Bitte versuche es erneut.']]){
  await page.evaluate(selected=>document.querySelector('[data-tool-locale="'+selected+'"]').click(),lang);
  await expect.poll(()=>page.evaluate(()=>window.__toolyaUILocale)).toBe(lang);
  await page.evaluate(()=>exportInventoryPDF());
  await expect(dialog.locator('#hl-alert-message')).toHaveText(message);
  await dialog.getByRole('button',{name:'OK'}).click();
 }
 expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
});


test('i18n Sprint A moving: QR label export text and deep links stay stable across language changes',async({page})=>{
 test.setTimeout(90000);
 const fixture={locations:[{id:100,name:'Synthetic shelf',icon:'📍'}],boxes:[
  {id:201,locId:100,name:'User box',desc:'Original stored contents',tag:'Zerbrechlich',value:12.5,subItems:[]},
  {id:202,locId:100,name:'Another box',desc:'Second contents',tag:'Standard',value:4.25,subItems:[]}
 ]};
 await isolated(page,true,true,fixture);
 await page.goto(origin+'/tools/moving/index.html');
 await expect.poll(()=>page.evaluate(()=>typeof movingCloudReady!=='undefined'&&movingCloudReady)).toBe(true);
 await page.evaluate(()=>{
  window.__qrPdfSpy={texts:[],images:[],files:[],urls:[]};
  window.QRCode=class{constructor(node,opts){window.__qrPdfSpy.urls.push(opts.text);const img=document.createElement('img');img.src='data:image/png;base64,iVBORw0KGgo=';node.append(img)}};
  window.jspdf={jsPDF:class{
   setFont(){return this}setFontSize(){return this}setDrawColor(){return this}
   roundedRect(){return this}addPage(){return this}
   text(v){window.__qrPdfSpy.texts.push(String(v));return this}
   addImage(v){window.__qrPdfSpy.images.push(v);return this}
   save(v){window.__qrPdfSpy.files.push(v)}
  }};
 });
 for(const lang of ['en','de']){
  await page.locator('[data-tool-locale="'+lang+'"]').click();
  await page.evaluate(()=>{window.__qrPdfSpy.texts=[];window.__qrPdfSpy.images=[];window.__qrPdfSpy.urls=[];return exportQrLabelsPDF()});
  const v=await page.evaluate(()=>({spy:window.__qrPdfSpy,snapshot:getData(),writes:window.__toolyaMock.writes.length}));
  expect(v.writes).toBe(0);
  expect(v.snapshot).toEqual(fixture);
  expect(v.spy.urls).toEqual([origin+'/tools/moving/index.html?box=201',origin+'/tools/moving/index.html?box=202']);
  expect(v.spy.images).toHaveLength(2);
  expect(v.spy.texts.join(' ')).toContain('User box');
  expect(v.spy.texts.join(' ')).toContain('Original stored contents');
  expect(v.spy.texts.join(' ')).toContain('Second contents');
  if(lang==='en'){
   expect(v.spy.files.at(-1)).toBe('moving-box-qr-labels.pdf');
   expect(v.spy.texts.join(' ')).toContain('Fragile');
   expect(v.spy.texts.join(' ')).toContain('Location');
  }else{
   expect(v.spy.files.at(-1)).toBe('kisten-qr-etiketten.pdf');
   expect(v.spy.texts.join(' ')).toContain('Zerbrechlich');
   expect(v.spy.texts.join(' ')).toContain('Ort');
  }
 }
});

test('i18n Sprint A moving: missing QR library reports localized failure and does not create a PDF',async({page})=>{
 test.setTimeout(60000);
 await isolated(page,true,true,{locations:[{id:1,name:'Synthetic',icon:'📍'}],boxes:[{id:2,locId:1,name:'Box',desc:'Synthetic',tag:'Standard',value:1}]});
 await page.goto(origin+'/tools/moving/index.html');
 await expect.poll(()=>page.evaluate(()=>typeof movingCloudReady!=='undefined'&&movingCloudReady)).toBe(true);
 for(const [lang,message] of [['en','The QR code could not be loaded. Please try again.'],['de','Der QR-Code konnte nicht geladen werden. Bitte versuche es erneut.']]){
  await page.locator('[data-tool-locale="'+lang+'"]').click();
  await page.evaluate(()=>{window.__movingQrExportForTest=exportQrLabelsPDF();});
  const dialog=page.getByRole('alertdialog',{name:'Toolya'});
  await expect(dialog.locator('#hl-alert-message')).toHaveText(message);
  await expect(dialog.getByRole('button',{name:'OK'})).toBeFocused();
  await dialog.getByRole('button',{name:'OK'}).click();
 }
 expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
});

// Real mobile UI, isolated Supabase stub. No production accounts or external calls.
test('i18n parking history renders historic ISO timestamps and escapes user content in both languages',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 const unsafe='<img src=x onerror="alert(1)">';
 const fixture={sessions:[{
  id:19,desc:unsafe,sector:'Zone <B> & C',date:'17.11.2026 13:00',
  timestamp:'2026-11-17T12:00:00Z',cost:4.5,
  gps:{lat:49.4,lng:7.1},photo:'javascript:alert(2)'
 }],activeEndTime:null};
 await isolated(page,true,false,fixture);
 await page.setViewportSize({width:320,height:800});
 await page.goto(origin+'/tools/parking/index.html?lang=en');
 await expect.poll(()=>page.evaluate(()=>parkingCloudReady&&!!parkingCloudController?.ready)).toBe(true);
 const list=page.locator('#parkingList');
 await expect(list).toContainText('Date: 17/11/2026');
 await expect(list.getByRole('button', {name:'Delete parking session'})).toHaveCount(1);
 await expect(list).toContainText('Fee: 4.50 €');
 await expect(list).toContainText('Zone <B> & C');
 await expect(list).toContainText(unsafe);
 await expect(list.locator('img')).toHaveCount(0);
 await expect(list.locator('a[href*="google.com/maps/search/"]')).toHaveCount(1);
 const authState=await page.evaluate(()=>({
  shellInert:document.querySelector('.b3-shell')?.inert || false,
  dialogHidden:getComputedStyle(document.getElementById('settingsModal')).display==='none'
 }));
 expect(authState.shellInert).toBe(false);
 expect(authState.dialogHidden).toBe(true);
 await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
 const deButton=page.locator('[data-tool-locale="de"]');
 await deButton.scrollIntoViewIfNeeded();
 await expect(deButton).toBeInViewport();
 await deButton.click();
 await expect(page.locator('[data-tool-locale="de"]')).toHaveAttribute('aria-pressed','true');
 expect(await page.evaluate(()=>window.__toolyaUILocale)).toBe('de');
 await expect(list).toContainText('Datum: 17.11.2026 13:00');
 await expect(list.getByRole('button', {name:'Parkvorgang löschen'})).toHaveCount(1);
 await expect(list).toContainText('Gebühr: 4,50 €');
 await page.locator('[data-tool-locale="en"]').click();
 await expect(list).toContainText('Date: 17/11/2026');
 const snapshot=await page.evaluate(()=>parkingCloudController.snapshot());
 expect(snapshot.sessions[0].desc).toBe(unsafe);
 expect(snapshot.sessions[0].sector).toBe('Zone <B> & C');
 expect(snapshot.sessions[0].timestamp).toBe(fixture.sessions[0].timestamp);
 expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
 expect(errors).toEqual([]);
});

test('i18n loans history translates returned status on mobile without rewriting the record',async({page})=>{
 const fixture={contacts:[],inventory:[],items:[{
  id:4,title:'Original <Widget>',person:'Borrower & friend',date:'2026-11-17',
  returnDate:'2026-12-17',category:'Werkzeug',status:'returned',deposit:12,photo:''
 }]};
 await isolated(page,true,false,fixture);
 await page.setViewportSize({width:320,height:800});
 await page.goto(origin+'/tools/loans/index.html?lang=en');
 await expect.poll(()=>page.evaluate(()=>loansCloudReady&&!!loansCloudController?.ready)).toBe(true);
 const list=page.locator('#itemsList');
 await expect(list.getByRole('button', {name:'Delete loan record'})).toHaveCount(1);
 await expect(list).toContainText('✅ Returned');
 await page.locator('[data-tool-locale="de"]').click();
 await expect(list.getByRole('button', {name:'Verleiheintrag löschen'})).toHaveCount(1);
 await expect(list).toContainText('✅ Zurückgegeben');
 await page.locator('[data-tool-locale="en"]').click();
 await expect(list).toContainText('✅ Returned');
 const snapshot=await page.evaluate(()=>loansCloudController.snapshot());
 expect(snapshot.items[0].status).toBe('returned');
 expect(snapshot.items[0].title).toBe('Original <Widget>');
 expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
});

test('i18n meter empty history changes only its presentation on mobile',async({page})=>{
 await isolated(page,true,false,{readings:[],tarifs:{}});
 await page.setViewportSize({width:320,height:800});
 await page.goto(origin+'/tools/meters/index.html?lang=en');
 await expect.poll(()=>page.evaluate(()=>metersCloudReady&&!!metersCloudController?.ready)).toBe(true);
 const list=page.locator('#readingsList');
 await expect(list).toContainText('No entries found.');
 await page.locator('[data-tool-locale="de"]').click();
 await expect(list).toContainText('Keine Einträge gefunden.');
 await page.locator('[data-tool-locale="en"]').click();
 await expect(list).toContainText('No entries found.');
 expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
});

test('i18n loan ICS download preserves title, stable UID and all-day date in DE/EN',async({page})=>{
 const {readFile}=require('node:fs/promises');
 const record={id:42,title:"Mia's Öl, Küche & Co",person:'Friend & neighbor',date:'2026-11-15',returnDate:'2026-12-05',category:'Sonstiges',status:'active',deposit:0,photo:''};
 await isolated(page,true,false,{contacts:[],inventory:[],items:[record]});
 await page.goto(origin+'/tools/loans/index.html?lang=en');
 await expect.poll(()=>page.evaluate(()=>loansCloudReady&&!!loansCloudController?.ready)).toBe(true);
 for(const lang of ['en','de']){
  await page.locator('[data-tool-locale="'+lang+'"]').click();
  const list=page.locator('#itemsList');
  await expect(list).toContainText(lang==='en'?'Loaned:':'Ausleihe:');
  const action=list.locator('[data-loan-action="ics"]');
  expect(await action.evaluate(button=>!!button.closest('[inert]'))).toBe(false);
  await action.scrollIntoViewIfNeeded();
  await expect(action).toBeInViewport();
  const [download]=await Promise.all([page.waitForEvent('download',{timeout:15000}),action.click()]);
  const content=(await readFile(await download.path(),'utf8')).replaceAll('\r\n ','');
  expect(content).toContain('UID:loan-42@toolya.app\r\n');
  expect(content).toContain('DTSTART;VALUE=DATE:20261205\r\n');
  expect(content).toContain("Mia's Öl\\, Küche & Co (Friend & neighbor)");
  expect(content).toContain('DESCRIPTION:'+(lang==='en'?'Item due for return':'Verleih-Rückgabe fällig')+'\r\n');
  expect(content).toContain('SUMMARY:'+(lang==='en'?'Return: ':'Rückgabe: '));
 }
 expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
});

test('i18n account dialog keyboard trap restores normal interaction after Escape without Tailwind CDN',async({page})=>{
 await isolated(page,true,false,{sessions:[],activeEndTime:null});
 await page.setViewportSize({width:320,height:800});
 await page.goto(origin+'/tools/parking/index.html?lang=en');
 await expect.poll(()=>page.evaluate(()=>parkingCloudReady)).toBe(true);
 const dialog=page.locator('#settingsModal');
 await expect(dialog).toBeHidden();
 expect(await page.evaluate(()=>!!document.querySelector('.b3-shell')?.inert)).toBe(false);
 const opener=page.locator('.ty-tool-hero .b3-settings-trigger');
 await opener.scrollIntoViewIfNeeded();
 await opener.click();
 await expect(dialog).toBeVisible();
 await expect(dialog).toHaveAttribute('aria-modal','true');
 await expect.poll(()=>page.evaluate(()=>!!document.querySelector('.b3-shell')?.inert)).toBe(true);
 expect(await page.evaluate(()=>document.getElementById('settingsModal').contains(document.activeElement))).toBe(true);
 await page.keyboard.press('Escape');
 await expect(dialog).toBeHidden();
 await expect(dialog).toHaveAttribute('aria-modal','false');
 await expect.poll(()=>page.evaluate(()=>!!document.querySelector('.b3-shell')?.inert)).toBe(false);
 expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
});

test('i18n loans dynamic contact and inventory options preserve selected values on DE/EN change',async({page})=>{
 const fixture={contacts:[{id:15,name:'Ada & Bob',phone:''}],
 inventory:[{id:17,title:'Kabel <1>',category:'Werkzeug',serial:'',gpsLink:''}],
 items:[{id:19,title:'Kabel <1>',person:'Ada & Bob',category:'Werkzeug',date:'2026-11-17',returnDate:'2026-12-05',status:'active',photo:''}]};
 await isolated(page,true,false,fixture);
 await page.setViewportSize({width:320,height:800});
 await page.goto(origin+'/tools/loans/index.html?lang=en');
 await expect.poll(()=>page.evaluate(()=>loansCloudReady&&!!loansCloudController?.ready)).toBe(true);
 const person=page.locator('#itemPersonSelect'),inv=page.locator('#itemInventorySelect'),filter=page.locator('#filterPerson');
 await expect(person.locator('option[value="custom"]')).toHaveText('+ Enter a new name');
 await expect(inv.locator('option[value=""]')).toHaveText('-- Choose inventory item --');
 await expect(filter.locator('option[value=""]')).toHaveText('All people');
 await person.selectOption({label:'Ada & Bob'});
 await expect(inv.locator('option[value="Kabel <1>"]')).toHaveText('Kabel <1> (Tools)');
 await inv.selectOption({label:'Kabel <1> (Tools)'});
 await filter.selectOption({label:'Ada & Bob'});
 const selected=await page.evaluate(()=>({
  person:document.getElementById('itemPersonSelect').value,
  inventory:document.getElementById('itemInventorySelect').value,
  filter:document.getElementById('filterPerson').value
 }));
 await page.locator('[data-tool-locale="de"]').click();
 await expect(person.locator('option[value="custom"]')).toHaveText('+ Neuen Namen eingeben');
 await expect(inv.locator('option[value="Kabel <1>"]')).toHaveText('Kabel <1> (Werkzeug)');
 await expect(filter.locator('option[value=""]')).toHaveText('Alle Personen');
 await page.locator('[data-tool-locale="en"]').click();
 await expect(inv.locator('option[value=""]')).toHaveText('-- Choose inventory item --');
 await expect(inv.locator('option[value="Kabel <1>"]')).toHaveText('Kabel <1> (Tools)');
 expect(await page.evaluate(()=>({
  person:document.getElementById('itemPersonSelect').value,
  inventory:document.getElementById('itemInventorySelect').value,
  filter:document.getElementById('filterPerson').value
 }))).toEqual(selected);
 expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
});

test('i18n meter share text localizes known types and keeps original records', async ({ page }) => {
 const readings = [
  { id: 1, type: 'Strom-NT', name: 'Strom Küche', date: '2026-11-19', value: 24 },
  { id: 2, type: 'Strom-NT', name: 'Strom Küche', date: '2026-11-18', value: 20 },
  { id: 3, type: 'Eigener Typ', name: 'Privater Zähler', date: '2026-11-19', value: 17 }
 ];
 await isolated(page, true, false, { readings, tarifs: {} });
 await page.addInitScript(() => {
  Object.defineProperty(navigator, 'clipboard', {
   value: { writeText: () => Promise.reject(new Error('Synthetic clipboard denial')) }
  });
 });
 await page.goto(origin + '/tools/meters/index.html?lang=en');
 await expect.poll(() => page.evaluate(() => metersCloudReady && !!metersCloudController?.ready)).toBe(true);
 for (const [locale, message, heading, reading] of [
  ['en', 'Clipboard unavailable. Copy the text manually:', '⚡ Meter readings overview:', '- Electricity (night tariff) (Strom Küche): 24 kWh (on 2026-11-19)'],
  ['de', 'Zwischenablage nicht verfügbar. Text manuell kopieren:', '⚡ Zählerstände-Übersicht:', '- Strom-NT (Strom Küche): 24 kWh (vom 2026-11-19)']
 ]) {
  await page.locator('[data-tool-locale="' + locale + '"]').click();
  const prompt = page.waitForEvent('dialog').then(async dialog => {
   const result = { type: dialog.type(), message: dialog.message(), text: dialog.defaultValue() };
   await dialog.dismiss();
   return result;
  });
  await page.evaluate(() => copyShareText());
  const result = await prompt;
  expect(result).toMatchObject({ type: 'prompt', message });
  expect(result.text.trimEnd().split('\n')).toEqual([
   heading,
   reading,
   '- Eigener Typ (Privater Zähler): 17 m³ (' + (locale === 'en' ? 'on' : 'vom') + ' 2026-11-19)'
  ]);
 }
 expect(await page.evaluate(() => metersCloudController.snapshot().readings)).toEqual(readings);
 expect(await page.evaluate(() => window.__toolyaMock.writes.length)).toBe(0);
});

test('i18n meter history and both PDFs translate stored labels without modifying readings', async ({ page }) => {
 const readings = [
  { id: 1, type: 'Kaltwasser', location: 'Garten', name: 'Mein Gartenzähler', date: '2026-11-18', value: 32, note: 'Eigene Notiz' },
  { id: 2, type: 'Strom-NT', name: 'Mein Nachtzähler', date: '2026-11-19', value: 17 },
  { id: 3, type: 'Eigener Typ', location: 'Bereich <B>', name: 'Mein Zähler', date: '2026-11-20', value: 21 }
 ];
 await isolated(page, true, false, { readings, tarifs: {} });
 await page.goto(origin + '/tools/meters/index.html?lang=de');
 await expect.poll(() => page.evaluate(() => metersCloudReady && !!metersCloudController?.ready)).toBe(true);
 await page.evaluate(() => {
  window.meterPdfTexts = [];
  window.jspdf = { jsPDF: class {
   setFont() {}
   setFontSize() {}
   addPage() {}
   splitTextToSize(value) { return [value]; }
   text(value) { window.meterPdfTexts.push(value); }
   save() {}
  } };
 });

 const history = page.locator('#readingsList');
 for (const [locale, type, location, nightType, mainLocation] of [
  ['en', 'Cold water', 'Garden', 'Electricity (night tariff)', 'Main'],
  ['de', 'Kaltwasser', 'Garten', 'Strom-NT', 'Haupt']
 ]) {
  await page.locator('[data-tool-locale="' + locale + '"]').click();
  await expect(history).toContainText(type + ' - ' + location);
  await expect(history).toContainText(nightType + ' - ' + mainLocation);
  await expect(history).toContainText('Eigener Typ - Bereich <B>');

  const [report, handover] = await page.evaluate(async () => {
   await exportPDF();
   const report = window.meterPdfTexts.splice(0).join('\n');
   await exportHandoverPDF();
   return [report, window.meterPdfTexts.splice(0).join('\n')];
  });
  expect(report).toContain(type + ' (Mein Gartenzähler - ' + location + ')');
  expect(report).toContain(nightType + ' (Mein Nachtzähler - ' + mainLocation + ')');
  expect(handover).toContain('[' + type + '] Mein Gartenzähler (' + location + ')');
  expect(handover).toContain('[' + nightType + '] Mein Nachtzähler (' + mainLocation + ')');
  for (const pdf of [report, handover]) {
   expect(pdf).toContain('Eigener Typ');
   expect(pdf).toContain('Bereich <B>');
   expect(pdf).toContain('Eigene Notiz');
  }
 }
 expect(await page.evaluate(() => getData().readings)).toEqual(readings);
 expect(await page.evaluate(() => window.__toolyaMock.writes.length)).toBe(0);
});


/*
 * Bilingual shell smoke for all ten main tools. This exercises the actual
 * pages behind a synthetic, local-only Supabase stub. Never edits or asserts
 * ownership of user-created records; only a disposable test input is added.
 * Full dynamic/auth/export acceptance is tracked separately in the release audit.
 */
for(const slug of ['moving','housemates','loans','plants','baking','budget','car','parking','meters','pet-health']){
 test('i18n ten-tool shell: '+slug+' changes DE/EN at 320, 375 and 768 without rewriting drafts',async({page})=>{
  const requests=await isolated(page,true);
  await page.setViewportSize({width:375,height:840});
  await page.goto(origin+'/tools/'+slug+'/index.html?lang=en',{waitUntil:'domcontentloaded'});
  const en=page.locator('.ty-tool-language [data-tool-locale="en"]:visible').first();
  const de=page.locator('.ty-tool-language [data-tool-locale="de"]:visible').first();
  await expect(en).toBeVisible({timeout:20000});
  await expect(de).toBeVisible();
  await expect(en).toHaveAttribute('aria-pressed','true');
  await page.evaluate(()=>{
    const fixture=document.createElement('input');
    fixture.type='text';fixture.id='i18n-synthetic-unchanged';
    fixture.value='Privat gespeicherte Notiz <Test> & 2040';
    // Keep the synthetic draft out of layout measurements.
    fixture.style.cssText='position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none';
    document.body.append(fixture);
  });
  const saved='Privat gespeicherte Notiz <Test> & 2040';
  const checkLayout=async(locale,width)=>{
    await expect(page.locator('html')).toHaveAttribute('lang',locale);
    const layout=await page.evaluate(()=>({width:innerWidth,
      excess:Math.max(0,document.documentElement.scrollWidth-innerWidth),
      offenders:[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.right>innerWidth+2}).slice(0,12).map(el=>({tag:el.tagName,id:el.id,className:String(el.className)}))}));
    expect.soft(layout.excess,slug+' '+locale+' '+width+'px: '+JSON.stringify(layout.offenders)).toBeLessThanOrEqual(2);
  };
  for(const width of [320,375,768]){
    await page.setViewportSize({width,height:840});
    await expect(en).toBeVisible();
    await en.focus();
    expect(await en.evaluate(el=>el===document.activeElement)).toBe(true);
    await de.focus();
    await page.keyboard.press('Enter');
    await expect(de).toBeFocused();
    await expect(de).toHaveAttribute('aria-label','Deutsch auswählen');
    await expect(en).toHaveAttribute('aria-label','Englisch auswählen');
    await page.keyboard.press('Tab');
    await expect(en).toBeFocused();
    expect(await en.evaluate(el=>el.matches(':focus-visible')&&getComputedStyle(el).outlineStyle!=='none')).toBe(true);
    await expect(de).toHaveAttribute('aria-pressed','true');
    await checkLayout('de',width);
    await expect(page.locator('#i18n-synthetic-unchanged')).toHaveValue(saved);
    await page.keyboard.press('Space');
    await expect(en).toBeFocused();
    await expect(en).toHaveAttribute('aria-label','English selected');
    await expect(de).toHaveAttribute('aria-label','Switch to German');
    await page.keyboard.press('Shift+Tab');
    await expect(de).toBeFocused();
    await expect(en).toHaveAttribute('aria-pressed','true');
    await checkLayout('en',width);
    await expect(page.locator('#i18n-synthetic-unchanged')).toHaveValue(saved);

  }
  expect(await page.evaluate(()=>window.__toolyaMock?.writes?.length||0)).toBe(0);
  expect(requests.every(url=>!url.startsWith(origin))).toBe(true);
 });
}

test('i18n runtime: home login and registration validation in both public locales',async({page})=>{
 await isolated(page,false);
 for(const lang of ['de','en']){
  await page.goto(origin+(lang==='en'?'/en/index.html':'/index.html'));
  await page.waitForFunction(()=>window.toolyaHomeReady===true);
  await page.evaluate(()=>{document.getElementById('loginEmail').value='';document.getElementById('loginPassword').value='';});
  const notice=page.locator('.hl-alert-panel');
  for(const action of ['loginUser','registerUser']){
   await page.evaluate(action=>window[action](),action);
   await expect(notice.locator('#hl-alert-message')).toHaveText(lang==='en'?'Enter your email and password.':'Bitte E-Mail und Passwort eingeben.');
   await notice.getByRole('button',{name:'OK'}).press('Enter');
   await expect(notice).toHaveCount(0);
  }
  await page.evaluate(()=>{document.getElementById('loginEmail').value='invalid';document.getElementById('loginPassword').value='fixture-password';});
  await page.evaluate(()=>window.loginUser());
  await expect(notice.locator('#hl-alert-message')).toHaveText(lang==='en'?'Enter a valid email address.':'Bitte eine gültige E-Mail-Adresse eingeben.');
  await notice.getByRole('button',{name:'OK'}).press('Enter');
  await page.evaluate(()=>{document.getElementById('loginEmail').value='fixture@example.invalid';document.getElementById('loginPassword').value='123';});
  await page.evaluate(()=>window.registerUser());
  await expect(notice.locator('#hl-alert-message')).toHaveText(lang==='en'?'Your password must be at least 6 characters long.':'Das Passwort muss mindestens 6 Zeichen lang sein.');
  await notice.getByRole('button',{name:'OK'}).press('Enter');
  expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
  expect(await page.evaluate(()=>window.__toolyaMock.signedIn)).toBe(false);
 }
});

test('i18n runtime: duplicate budget transaction cancellation preserves synthetic snapshot in both locales',async({page})=>{
 await isolated(page,true);
 await page.goto(origin+'/tools/budget/index.html?lang=de');
 await expect.poll(()=>page.evaluate(()=>typeof toolyaCloudReady!=='undefined'&&toolyaCloudReady&&!!toolyaCloudController?.ready)).toBe(true);
 const fill=()=>page.evaluate(()=>{
  document.querySelector('#receiptTitle').value='Isolierte Buchung';
  document.querySelector('#receiptDate').value='2026-11-15';
  document.querySelector('#receiptPrice').value='12.50';
 });
 await fill();await page.evaluate(()=>saveReceipt());
 await expect.poll(()=>page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(1);
 const before=await page.evaluate(()=>JSON.stringify(getData()));
 for(const lang of ['en','de']){
  await page.locator('[data-tool-locale="'+lang+'"]').click();
  await fill();
  const pending=page.waitForEvent('dialog',{timeout:5000});
  const action=page.evaluate(()=>saveReceipt());
  const dialog=await pending;
  const actual={type:dialog.type(),message:dialog.message()};
  await dialog.dismiss();await action;
  expect(actual).toEqual({type:'confirm',message:lang==='en'?'A transaction with the same date, title, amount and type already exists.\n\nSave another copy anyway?':'Eine Buchung mit gleichem Datum, Titel, Betrag und Typ existiert bereits.\n\nTrotzdem erneut speichern?'});
  expect(await page.evaluate(()=>JSON.stringify(getData()))).toBe(before);
  expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(1);
 }
});

test('i18n runtime: shared cloud replacement warning cancels before backup or write',async({page})=>{
 await isolated(page,true);
 await page.goto(origin+'/tools/parking/index.html?lang=de');
 for(const lang of ['en','de']){
  await page.locator('[data-tool-locale="'+lang+'"]').click();
  const pending=page.waitForEvent('dialog',{timeout:5000});
  const action=page.evaluate(async()=>{
   const {confirmCloudReplacement}=await import('/shared/toolya/cloud-backup.mjs');
   const original={fixture:'Private Löschen'},calls={backup:0,replace:0};
   const result=await confirmCloudReplacement({
    controller:{ready:true,revision:1,sessionGeneration:1,snapshot:()=>original,replace:async()=>{calls.replace++;throw Error('Unexpected replacement')}},
    incoming:{fixture:'Other'},validate:v=>v,confirm:message=>window.confirm(message),
    exportBackup:async()=>{calls.backup++;return true}
   });
   return {result,calls,original};
  });
  const dialog=await pending;
  const actual={type:dialog.type(),message:dialog.message()};
  await dialog.dismiss();
  expect(await action).toEqual({result:{status:'cancelled'},calls:{backup:0,replace:0},original:{fixture:'Private Löschen'}});
  expect(actual).toEqual({type:'confirm',message:lang==='en'?'Import replaces existing cloud data. Download a backup first?':'Import ersetzt vorhandene Cloud-Daten. Zuerst eine Sicherung herunterladen?'});
  expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
 }
});

test('i18n runtime: isolated lists dashboard selection counters and private notes in DE and EN',async({page})=>{
 await isolated(page,false);
 // Serve a synthetic page at the real module origin without booting a public route.
 await page.route('**/tools/wishes/__lists-fixture.html*',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="de"><head><title>Lists fixture</title></head><body><header></header></body></html>'}));
 await page.goto(origin+'/tools/wishes/__lists-fixture.html?lang=de');
 await page.evaluate(async ids=>{
  const root=document.createElement('section');root.id='listsDashboard';document.body.append(root);
  const selects={listWishPriority:['all'],listWishCategory:['all'],listWishMarker:['all'],listWishAssignment:['assigned','global-unassigned','all'],listWishSort:['newest'],listsView:['active','all'],listsSort:['favorites'],listVisibility:['private'],editListVisibility:['private'],listTemplate:['custom'],wishListSelect:[''],bulkMoveTarget:[''],listQuickSwitch:[''],wishDetailCategory:[''],wishDetailSelect:[''],listIcon:['🎁'],editListIcon:['🎁'],listColor:['#123456'],editListColor:['#123456']};
  const fields=new Set(['listWishSearch','listsSearch','listTitle','listDescription','editListTitle','editListDescription','editListCoverUrl','editListId','url']);
  const containers=new Set(['listWishCards','listsContent','homeRecentContent','homeFavoritesContent','bulkHistoryList','bulkResultContext','bulkConfirmSample','wishDetailLists','bulkProgressDetails','listItemsFeedback','bulkProgressPanel','bulkResultPanel','homeProgress','editor']);
  for(const id of ids){
   if(id==='listsDashboard')continue;
   const tag=Object.hasOwn(selects,id)?'select':fields.has(id)?'input':id.endsWith('Dialog')?'dialog':id==='editListForm'?'form':id==='newListPanel'?'details':containers.has(id)?'div':'button';
   const el=document.createElement(tag);el.id=id;
   if(tag==='button')el.type='button';
   if(tag==='select')for(const value of selects[id]){const opt=document.createElement('option');opt.value=value;opt.textContent=value;el.append(opt)}
   if(id==='editListForm'||id==='bulkResultPanel')el.hidden=true;
   root.append(el);
  }
  // Fixed application-owned controls, not private wish content.
  for(const id of ['wishSelectAssigned','wishSelectUnassigned','listsStatus'])document.getElementById(id).setAttribute('data-wish-copy','');
  const user={id:'isolated-owner'},list={id:'fixture-list',title:'Private Löschen',description:'Private Notiz',icon:'🎁',color:'#123456',visibility:'private',archived:false,created_at:'2026-01-01T00:00:00Z'};
  const wishes=Array.from({length:10},(_,i)=>({id:'wish-'+i,note:'Private Löschen '+i,priority:'normal',created_at:'2026-01-01T00:00:00Z',wishlist_products:{title:'Private Wunsch '+i,asin:'B00000000'+i,marketplace:'de',image_url:null,price:null,description:null}}));
  const memberships=wishes.slice(0,7).map(w=>({list_id:list.id,wish_id:w.id}));
  const tables={wishlist_lists:[list],wishlist_wishes:wishes,wishlist_list_items:memberships};
  const writes=[];window.__listFixture={writes,tables};
  const db={from(table){let rows=tables[table]||[];const q={};for(const method of ['select','eq','order','in','limit','is'])q[method]=()=>q;q.range=(start,end)=>{rows=rows.slice(start,end+1);return q};for(const method of ['insert','update','delete','upsert'])q[method]=()=>{writes.push({table,method});throw Error('Unexpected fixture write')};q.then=(resolve,reject)=>Promise.resolve({data:structuredClone(rows),error:null}).then(resolve,reject);return q}};
  const {mountListsDashboard}=await import('/tools/wishes/lists-dashboard.mjs');
  const dashboard=mountListsDashboard(db,()=>user);
  await dashboard.refresh();
  await import('/shared/toolya/i18n/wishes-entry.mjs');
 },["listsDashboard","listWishCards","listWishSearch","activeListHeading","wishDetailCategory","wishDetailDialog","listWishAssignment","listWishPriority","listWishCategory","listWishMarker","listWishSort","wishDetailLists","wishDetailSelect","wishDetailJump","wishDetailHeading","wishDetailPriority","wishDetailNote","wishDetailDate","homeRecentContent","assignedTotal","favoritesTotal","homeProgress","homeProgressFill","homeProgressNote","bulkResultPanel","homeFavoritesContent","wishListSelect","editListForm","editListId","listTitle","listDescription","listTemplate","listsSearch","listsView","listsSort","editListTitle","editListDescription","editListCoverUrl","listsStatus","editListFeedback","listsTotal","wishesTotal","bulkProgressPanel","bulkStop","bulkStatus","bulkProgressText","bulkProgressDetails","bulkProgressBar","bulkConfirmDialog","listsContent","listWishCount","wishLoadMore","listsViewCount","listsResetFilters","unassignedCount","showUnassigned","bulkMoveTarget","bulkSelectedCount","bulkSelectVisible","bulkAdd","bulkRemove","bulkClear","bulkSelectCategory","bulkMove","bulkHistoryList","bulkHistoryEmpty","bulkHistoryClear","bulkResultHeading","bulkResultSummary","bulkResultContext","bulkRetryFailed","bulkSelectRemaining","bulkResumeRemaining","bulkConfirmTitle","bulkConfirmDescription","bulkConfirmSample","wishViewCards","wishViewCompact","wishClearSelection","wishShowAssigned","wishSelectAssigned","wishSelectUnassigned","wishSelectedOnly","wishSelectShown","listItemsFeedback","listItemsFeedbackText","listItemsRetry","listQuickSwitch","activeListSummary","listItemsNewWish","editor","url","listItemsBack","quickAllWishes","quickAssignedWishes","quickUnassignedWishes","quickFavoriteWishes","wishClearFilters","bulkDismissResult","bulkConfirmCancel","bulkConfirmApply","homeFavorites","homeNewWish","homeNewList","newListPanel","wishDetailStar","wishDetailLater","listWishClearFilters","wishDetailSaveCategory","wishDetailClose","wishDetailDone","listIcon","listColor","editListIcon","editListColor","editListVisibility","cancelListEdit","saveListChanges","mobileNewWish","mobileMyLists","quickNewList","quickAddWish","quickOpenSelected","createList","listVisibility","refreshLists"]);
 await expect(page.locator('#wishSelectAssigned')).toHaveText('Zugeordnete auswählen (7)');
 await expect(page.locator('#wishSelectUnassigned')).toHaveText('Ohne Liste auswählen (3)');
 const before=await page.evaluate(()=>JSON.stringify(window.__listFixture.tables));
 for(const lang of ['en','de']){
  await page.locator('[data-wishes-locale="'+lang+'"]').click();
  await expect(page.locator('#wishSelectAssigned')).toHaveText(lang==='en'?'Select assigned (7)':'Zugeordnete auswählen (7)');
  await expect(page.locator('#wishSelectUnassigned')).toHaveText(lang==='en'?'Select unassigned (3)':'Ohne Liste auswählen (3)');
  await page.locator('#wishSelectUnassigned').click();
  await expect(page.locator('#listsStatus')).toHaveText(lang==='en'?'3 unassigned wishes selected. Use “Add” to assign them to the current list.':'3 Wünsche ohne Liste ausgewählt. Mit „Hinzufügen“ kannst du sie der aktuellen Liste zuordnen.');
  expect(await page.evaluate(()=>JSON.stringify(window.__listFixture.tables))).toBe(before);
  expect(await page.evaluate(()=>window.__listFixture.writes.length)).toBe(0);
 }
});

test('i18n runtime: gift dashboard template overwrite cancellation preserves private slot label and preferences',async({page})=>{
 await isolated(page,false);
 await page.route('**/tools/wishes/__gift-layout-fixture.html*',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="de"><head><title>Gift layout fixture</title></head><body><header></header></body></html>'}));
 await page.goto(origin+'/tools/wishes/__gift-layout-fixture.html?lang=de');
 await page.evaluate(async ids=>{
  const root=document.createElement('main');document.body.append(root);
  const selectOptions={homeTaskSort:['urgency','priority','due_date'],homeOccasionSort:['soonest','title'],homeLayoutSlot:['compact','daily','overview']};
  const checks=new Set(['homeShowMetrics','homeShowTasks','homeShowOccasions','homeShowProgress']);
  for(const id of ids){
   const tag=Object.hasOwn(selectOptions,id)?'select':checks.has(id)||id==='homeBackupFile'||id==='homeCheckpointViewName'?'input':id==='homeGiftSettingsForm'?'form':id==='homeGiftProgress'?'progress':/Save$|^homeSaveLayout$|Undo$|ConfirmPreview$|RestoreDefaults$/.test(id)?'button':'div';
   const el=document.createElement(tag);el.id=id;
   if(tag==='button'){el.type='button';el.textContent=id}
   if(checks.has(id))el.type='checkbox';
   if(id==='homeBackupFile')el.type='file';
   if(tag==='select')for(const value of selectOptions[id]){
    const option=document.createElement('option');option.value=value;
    option.textContent=id==='homeLayoutSlot'&&value==='compact'?'Löschen':value;
    if(id==='homeLayoutSlot')option.setAttribute('data-user-content','');
    el.append(option);
   }
   root.append(el);
  }
  const preferences={show_metrics:true,show_tasks:true,show_occasions:true,show_progress:true,task_sort:'urgency',occasion_sort:'soonest',section_order:['metrics','tasks','occasions','progress'],metric_keys:['open'],quick_links:[],favorite_links:[],active_layout:'custom',saved_layouts:{compact:{show_metrics:true,show_tasks:false,show_occasions:true,show_progress:true,task_sort:'urgency',occasion_sort:'soonest',section_order:['metrics','tasks','occasions','progress'],metric_keys:['open'],quick_links:[],favorite_links:[]}}};
  const writes=[];window.__giftLayoutFixture={preferences,writes};
  const db={auth:{async getUser(){return {data:{user:{id:'isolated-owner'}},error:null}},onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}}},from(table){
   const q={};for(const method of ['select','eq','order','range','limit','in','is'])q[method]=()=>q;
   q.maybeSingle=async()=>({data:table==='wishlist_gift_home_preferences'?structuredClone(preferences):null,error:null});
   for(const method of ['insert','update','upsert','delete'])q[method]=()=>{writes.push({table,method});throw Error('Unexpected fixture write')};
   q.then=(resolve,reject)=>Promise.resolve({data:[],error:null}).then(resolve,reject);return q;
  }};
  window.supabase={createClient:()=>db};
  await import('/shared/toolya/i18n/wishes-entry.mjs');
  await import('/tools/wishes/gift-start.mjs');
 },["homeMetricChoices","homeQuickChoices","homeFavoriteChoices","homeTaskSort","homeOccasionSort","homeSectionOrder","homeSettingsStatus","homeGiftSections","homeShowMetrics","homeShowTasks","homeShowOccasions","homeShowProgress","homeGiftSettingsForm","homeSettingsSave","homeGiftMetrics","homeGiftTasks","homeGiftOccasions","homeLayoutStatus","homeSaveLayout","homeConfirmPreview","homePreviewUndo","homeRestoreDefaults","homePreviewDraft","homeGiftSettings","homeLayoutSlot","homeCompareA","homeCompareB","homeCompareResult","homeCompareStatus","homeCompareShow","homeBackupDiff","homeBackupApply","homeBackupCancel","homeBackupStatus","homeBackupFile","homeBackupExport","homeBackupPreview","homeCheckpointCompare","homeCheckpointFrom","homeCheckpointTo","homeCheckpointField","homeCheckpointLayout","homeCheckpointViewSelect","homeCheckpointViewStatus","homeCheckpointViewPreview","homeCheckpointFavoriteStatus","homeCheckpointFavoritePreview","homeCheckpointFavoriteComparePanel","homeCheckpointFavoriteCompareA","homeCheckpointFavoriteCompareB","homeCheckpointFavoriteCompareResult","homeCheckpointFavoriteCompareRun","homeCheckpointFavoriteBar","homeCheckpointFavoriteNext","homeCheckpointFavoritePrevious","homeCheckpointFavoriteClear","homeCheckpointViewCards","homeCheckpointViewDetails","homeCheckpointViewSync","homeCheckpointViewSave","homeCheckpointViewName","homeCheckpointViewApply","homeCheckpointViewDelete","homeCheckpointViewImport","homeCheckpointViewRename","homeCheckpointViewDuplicate","homeCheckpointStats","homeCheckpointCategories","homeCheckpointMonthly","homeCheckpointEntries","homeCheckpointMonths","homeCheckpointSummary","homeCheckpointStatus","homeCheckpointActiveCategories","homeCheckpointCompareA","homeCheckpointCompareB","homeCheckpointCompareShow","homeCheckpointCompareStatus","homeCheckpointClear","homeCheckpointReload","homeGiftCheckpoints","homeHistoryStatus","homeHistoryEntries","homeHistoryReload","homeGiftHistory","homeGiftQuickLinks","homeGiftFavorites","homeGiftProgress","homeGiftProgressText","homeGiftStatus","homeGiftStart"]);
 await expect(page.locator('#homeGiftStatus')).toHaveText('Privater Überblick – nur für dein angemeldetes Konto. Keine Daten verändert.');
 const before=await page.evaluate(()=>JSON.stringify(window.__giftLayoutFixture.preferences));
 for(const lang of ['de','en','de']){
  await page.locator('[data-wishes-locale="'+lang+'"]').click();
  await page.locator('#homeLayoutSlot').selectOption('compact');
  expect(await page.locator('#homeLayoutSlot option:checked').textContent()).toBe('Löschen');
  const pending=page.waitForEvent('dialog',{timeout:5000});
  const action=page.locator('#homeSaveLayout').click();
  const dialog=await pending;
  const actual={type:dialog.type(),message:dialog.message()};
  await dialog.dismiss();await action;
  expect(actual).toEqual({type:'confirm',message:lang==='en'?'Save current settings in template slot “Löschen”? An existing template will be overwritten.':'Aktuelle Einstellungen im Vorlagenplatz „Löschen“ speichern? Eine vorhandene Vorlage wird überschrieben.'});
  expect(await page.evaluate(()=>JSON.stringify(window.__giftLayoutFixture.preferences))).toBe(before);
  expect(await page.evaluate(()=>window.__giftLayoutFixture.writes.length)).toBe(0);
  expect(await page.locator('#homeLayoutSlot').inputValue()).toBe('compact');
 }
});

test('i18n runtime: B3 layout storage failure keeps draft open and cancel restores original layout in DE and EN',async({page})=>{
 await isolated(page,true,true);
 await page.goto(origin+'/tools/car/index.html?lang=de');
 await expect.poll(()=>page.evaluate(()=>typeof toolyaCloudReady!=='undefined'&&toolyaCloudReady&&!!toolyaCloudController?.ready)).toBe(true);
 if(await page.locator('#toolya-consent-panel').isVisible())await page.getByRole('button',{name:'Ablehnen',exact:true}).click();
 const key=await page.evaluate(()=> 'helferlein_ui_layout_'+window.HELFERLEIN_B3.key+'_v1');
 const original=await page.evaluate(key=>({stored:localStorage.getItem(key),panels:[...document.querySelectorAll('[data-b3-panel]')].map(p=>[p.dataset.b3Panel,p.dataset.b3Size,p.dataset.b3Hidden,p.style.getPropertyValue('--b3-order')])}),key);
 for(const lang of ['en','de']){
  await page.locator('[data-tool-locale="'+lang+'"]').click();
  await page.locator('#settingsBtn').click();
  await revealToolSetting(page.locator('#b3-edit-open'));
  await page.locator('#b3-edit-open').click();
  const editor=page.locator('#b3-editor');
  await expect(editor).toBeVisible();
  const size=editor.locator('select').first();
  const previous=await size.inputValue();
  await size.selectOption(previous==='s'?'l':'s');
  await page.evaluate(key=>{
   const set=Storage.prototype.setItem;
   window.__restoreLayoutStorage=()=>{Storage.prototype.setItem=set};
   Storage.prototype.setItem=function(k,v){if(this===localStorage&&k===key)throw new DOMException('Isolated layout storage failure','QuotaExceededError');return set.call(this,k,v)};
  },key);
  try{
   await editor.locator('.b3-action:not(.b3-outline)').first().click();
   const notice=page.getByRole('alertdialog',{name:'Toolya'});
   await expect(notice.locator('#hl-alert-message')).toHaveText(lang==='en'?'Could not save the dashboard layout.':'Layout konnte nicht gespeichert werden.');
   await notice.getByRole('button',{name:'OK'}).press('Enter');
   await expect(editor).toBeVisible();
   expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(original.stored);
   await editor.getByRole('button',{name:lang==='en'?'Cancel':'Abbrechen',exact:true}).click();
   await expect(editor).toBeHidden();
   expect(await page.evaluate(key=>({stored:localStorage.getItem(key),panels:[...document.querySelectorAll('[data-b3-panel]')].map(p=>[p.dataset.b3Panel,p.dataset.b3Size,p.dataset.b3Hidden,p.style.getPropertyValue('--b3-order')])}),key)).toEqual(original);
  }finally{await page.evaluate(()=>window.__restoreLayoutStorage())}
  expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
 }
});

test('i18n runtime: home backup password and wrong file type validation in DE and EN',async({page})=>{
 await isolated(page,false);
 for(const lang of ['de','en']){
  await page.goto(origin+(lang==='en'?'/en/index.html':'/index.html'));
  await page.waitForFunction(()=>window.toolyaHomeReady===true);
  const pending=page.evaluate(()=>window.requestBackupPassword('Fixture backup',true));
  const dialog=page.getByRole('dialog',{name:lang==='en'?'Backup password':'Backup-Passwort',exact:true});
  await expect(dialog).toBeVisible();
  const passwords=dialog.locator('input[type="password"]');
  await passwords.nth(0).fill('short');await passwords.nth(1).fill('short');
  await dialog.locator('button[type="submit"]').click();
  await expect(dialog).toContainText(lang==='en'?'Use at least 12 characters.':'Bitte mindestens 12 Zeichen verwenden.');
  await page.keyboard.press('Escape');
  expect(await pending).toBeNull();
  await page.evaluate(()=>window.importGlobalBackup({target:{files:[new File(['fixture'],'fixture.txt',{type:'text/plain'})],value:'fixture.txt'}}));
  const notice=page.getByRole('alertdialog',{name:'Toolya'});
  await expect(notice.locator('#hl-alert-message')).toHaveText(lang==='en'?'Select a JSON backup file.':'Bitte eine JSON-Backupdatei auswählen.');
  await notice.getByRole('button',{name:'OK'}).press('Enter');
  expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
 }
});

test('i18n runtime: cookie settings follow tool language without changing denied consent',async({page})=>{
 const outbound=await isolated(page,true);
 const key='toolya.analytics.consent.v2';
 // Legacy refusal must migrate, without enabling either analytics service.
 await page.addInitScript(()=>localStorage.setItem('toolya.analytics.consent.v1','no'));
 await page.goto(origin+'/tools/car/index.html');
 await expect.poll(()=>page.evaluate(()=>typeof toolyaCloudReady!=='undefined'&&toolyaCloudReady&&!!toolyaCloudController?.ready)).toBe(true);
 const link=page.locator('#toolya-consent-settings'),panel=page.locator('#toolya-consent-panel');
 await expect(panel).toBeHidden();
 for(const lang of ['de','en','de']){
  await page.locator('[data-tool-locale="'+lang+'"]').click();
  await expect(link).toHaveText(lang==='en'?'Cookie settings':'Cookie-Einstellungen');
  await expect(link).toHaveAttribute('lang',lang);
  await link.click();
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAttribute('aria-label',lang==='en'?'Analytics settings':'Statistik-Einstellungen');
  await expect(panel.locator('strong')).toHaveText(lang==='en'?'Analytics at Toolya':'Statistik bei Toolya');
  await expect(panel.locator('.reject')).toHaveText(lang==='en'?'Reject':'Ablehnen');
  await expect(panel.locator('.accept')).toHaveText(lang==='en'?'Accept':'Akzeptieren');
  await expect(panel.locator('p a')).toHaveAttribute('href',lang==='en'?'/en/privacy.html':'/privacy.html');
  await expect(panel.locator('.reject')).toBeFocused();
  expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe('no');
  // Reaffirm the existing denial only to close the panel before changing language.
  await panel.locator('.reject').click();
  await expect(panel).toBeHidden();
  expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe('no');
 }
 expect(outbound.filter(url=>/googletagmanager|google-analytics|analytics\.google|metricool\.com/.test(url))).toEqual([]);
 expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
});

test('i18n runtime: homepage backup rejects invalid format and decryption without changing stored data',async({page})=>{
 await isolated(page,false);
 for(const lang of ['de','en']){
  await page.goto(origin+(lang==='en'?'/en/index.html':'/index.html'));
  await page.waitForFunction(()=>window.toolyaHomeReady===true);
  const key='helferlein_ui_layout_pflanzen_v1',fixture='[{"id":"fixture","visible":true}]';
  await page.evaluate(({key,fixture})=>localStorage.setItem(key,fixture),{key,fixture});
  const load=payload=>page.evaluate(payload=>window.importGlobalBackup({target:{files:[new File([JSON.stringify(payload)],'fixture.json',{type:'application/json'})],value:'fixture.json'}}),payload);
  const notice=page.getByRole('alertdialog',{name:'Toolya'});
  const check=async(de,en)=>{
   await expect(notice.locator('#hl-alert-message')).toHaveText(lang==='en'?en:de);
   await notice.getByRole('button',{name:'OK'}).press('Enter');
   expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(fixture);
   expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
  };
  await load({app:'Toolya',version:'1.0',localStorage:{[key]:'changed'}});
  await check('Diese Backup-Version wird nicht unterstützt.','This backup version is unsupported.');
  await load({app:'Toolya',format:'encrypted-backup-v1',kdf:'unsupported'});
  await check('Dieses verschlüsselte Backup-Format wird nicht unterstützt.','This encrypted backup format is unsupported.');
  await load({app:'Toolya',format:'encrypted-backup-v1',kdf:'PBKDF2-SHA256',cipher:'AES-256-GCM',iterations:600000,salt:'AA==',iv:'AA==',ciphertext:'AA=='});
  const password=page.getByRole('dialog',{name:lang==='en'?'Backup password':'Backup-Passwort',exact:true});
  await password.locator('input[type="password"]').fill('isolated-password');
  await password.locator('button[type="submit"]').click();
  await check('Entschlüsselung fehlgeschlagen. Passwort oder Sicherungsdatei ist ungültig.','Decryption failed. The password or backup file is invalid.');
  await page.evaluate(key=>localStorage.removeItem(key),key);
 }
});

test('i18n runtime: cookie settings follow tool language without changing granted consent',async({page})=>{
 const outbound=await isolated(page,true);
 const key='toolya.analytics.consent.v2';
 // A previous GA-only approval must not authorize the additional Metricool service.
 await page.addInitScript(()=>localStorage.setItem('toolya.analytics.consent.v1','yes'));
 // Establish consent through the actual UI, then test the persisted opt-in
 // on a fresh document. Do not rely on an injected storage write at startup.
 await page.goto(origin+'/tools/car/index.html');
 await expect.poll(()=>page.evaluate(()=>typeof toolyaCloudReady!=='undefined'&&toolyaCloudReady&&!!toolyaCloudController?.ready)).toBe(true);
 const link=page.locator('#toolya-consent-settings'),panel=page.locator('#toolya-consent-panel');
 await expect(panel).toBeVisible();
 expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBeNull();
 expect(outbound.some(url=>/googletagmanager|google-analytics|metricool\.com/.test(url))).toBe(false);
 await panel.locator('.accept').click();
 await expect(panel).toBeHidden();
 expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe('yes');
 await page.reload();
 await expect.poll(()=>page.evaluate(()=>typeof toolyaCloudReady!=='undefined'&&toolyaCloudReady&&!!toolyaCloudController?.ready)).toBe(true);
 expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe('yes');
 await expect(panel).toBeHidden();
 for(const lang of ['de','en','de']){
  await page.locator('[data-tool-locale="'+lang+'"]').click();
  await expect(link).toHaveText(lang==='en'?'Cookie settings':'Cookie-Einstellungen');
  await expect(link).toHaveAttribute('lang',lang);
  await link.click();
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAttribute('aria-label',lang==='en'?'Analytics settings':'Statistik-Einstellungen');
  await expect(panel.locator('strong')).toHaveText(lang==='en'?'Analytics at Toolya':'Statistik bei Toolya');
  await expect(panel.locator('.reject')).toHaveText(lang==='en'?'Reject':'Ablehnen');
  await expect(panel.locator('.accept')).toHaveText(lang==='en'?'Accept':'Akzeptieren');
  await expect(panel.locator('p a')).toHaveAttribute('href',lang==='en'?'/en/privacy.html':'/privacy.html');
  await expect(panel.locator('.reject')).toBeFocused();
  expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe('yes');
  // Reaffirm the existing consent only to close the panel before changing language.
  await panel.locator('.accept').click();
  await expect(panel).toBeHidden();
  expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe('yes');
 }
 expect(outbound.some(url=>url.includes('www.googletagmanager.com/gtag/js'))).toBe(true);
 expect(outbound.some(url=>url.includes('tracker.metricool.com/resources/be.js'))).toBe(true);
 // isolated() aborts every external analytics request, even after consent.
 expect(await page.evaluate(()=>window.dataLayer.filter(e=>e[0]==='consent'&&e[1]==='update'&&e[2].analytics_storage==='granted').length)).toBe(1);
 expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
});

for(const fixture of [
 {tool:'car',handler:'saveTireSet',fields:{tireCarSelect:'',tireLocation:'Private Löschen',tireDot:'0426'},de:'Bitte ein Fahrzeug wählen!',en:'Select a vehicle.'},
 {tool:'car',handler:'saveEvent',fields:{eventCarSelect:'',eventTitle:'Private Löschen',eventDate:'2026-11-25',eventCost:'12.5'},de:'Bitte Fahrzeug, Datum und Bezeichnung angeben!',en:'Enter a vehicle, date and description.'},
 {tool:'car',handler:'updateEvent',fields:{editTitle:'Private Löschen',editDate:'',editCost:'12.5'},de:'Bitte Bezeichnung und Datum eingeben!',en:'Enter a description and date.'},
 {tool:'car',handler:'saveCar',fields:{carName:'',carPlate:'PRIVATE Löschen 42',carInsurance:'Private Versicherung'},de:'Bitte einen Fahrzeugnamen eingeben!',en:'Enter a vehicle name.'},
 {tool:'meters',handler:'saveReading',fields:{meterName:'Private Löschen',meterNote:'Private Zählernotiz',meterDate:'',meterValue:'12'},de:'Bitte gültiges Ablesedatum und Zählerstand eingeben!',en:'Enter a valid reading date and meter value.'},
 {tool:'meters',handler:'saveTarifs',fields:{meterName:'Private Löschen',meterNote:'Private Tarifnotiz',tariffStromPriceHT:'0.29',tariffGasCalib:'0'},de:'Bitte gültige, nichtnegative Tarife und einen positiven Gasfaktor eingeben.',en:'Enter valid non-negative tariffs and a positive gas factor.'}
]){
 test('i18n runtime catalogue: '+fixture.handler+' validates in DE and EN without changing private data',async({page},testInfo)=>{
  testInfo.annotations.push({type:'toolya-runtime-message',description:JSON.stringify({file:'tools/'+fixture.tool+'/index.html',handler:fixture.handler,de:fixture.de,en:fixture.en,line:fixture.line||null})});
  await isolated(page,true);
  await page.goto(origin+'/tools/'+fixture.tool+'/index.html');
  await expect.poll(()=>page.evaluate(tool=>tool==='meters'?metersCloudReady&&!!metersCloudController?.ready:toolyaCloudReady&&!!toolyaCloudController?.ready,fixture.tool)).toBe(true);
  await page.evaluate(fields=>{for(const [id,value] of Object.entries(fields)){const el=document.getElementById(id);if(!el)throw Error('Missing fixture input '+id);el.value=value;}},fixture.fields);
  const snapshot=await page.evaluate(tool=>JSON.stringify((tool==='meters'?metersCloudController:toolyaCloudController).snapshot()),fixture.tool);
  const writes=await page.evaluate(()=>window.__toolyaMock.writes.length);
  expect(writes).toBe(0);
  for(const lang of ['de','en','de']){
   await page.locator('[data-tool-locale="'+lang+'"]').click();
   await page.evaluate(handler=>window[handler](),fixture.handler);
   const notice=page.getByRole('alertdialog',{name:'Toolya'});
   await expect(notice.locator('#hl-alert-message')).toHaveText(fixture[lang]);
   await notice.getByRole('button',{name:'OK'}).press('Enter');
   expect(await page.evaluate(ids=>Object.fromEntries(ids.map(id=>[id,document.getElementById(id).value])),Object.keys(fixture.fields))).toEqual(fixture.fields);
   expect(await page.evaluate(tool=>JSON.stringify((tool==='meters'?metersCloudController:toolyaCloudController).snapshot()),fixture.tool)).toBe(snapshot);
   expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
  }
 });
}

for(const mode of ['denied','missing']){
 test('parking GPS regression: '+mode+' required GPS refuses write; ordinary save falls back in DE and EN',async({page})=>{
  await isolated(page,true);
  await page.addInitScript(mode=>{
   Object.defineProperty(navigator,'geolocation',{configurable:true,value:mode==='missing'?undefined:{
    getCurrentPosition(success,failure){queueMicrotask(()=>failure({code:1,message:'Synthetic permission denial'}))}
   }});
  },mode);
  await page.goto(origin+'/tools/parking/index.html');
  await expect.poll(()=>page.evaluate(()=>parkingCloudReady&&!!parkingCloudController?.ready)).toBe(true);
  for(const lang of ['de','en']){
   await page.locator('[data-tool-locale="'+lang+'"]').click();
   const fields={parkDesc:'Private Löschen '+lang,parkSector:'Private Zone',parkCost:'0'};
   await page.evaluate(fields=>{for(const [id,value] of Object.entries(fields))document.getElementById(id).value=value},fields);
   const before=await page.evaluate(()=>({snapshot:JSON.stringify(parkingCloudController.snapshot()),writes:window.__toolyaMock.writes.length}));
   await page.evaluate(()=>saveParkingSession(true));
   await expect(page.locator('#parkingGpsFeedback')).toHaveText(lang==='en'?'GPS location unavailable. Allow location access and try again.':'GPS-Standort nicht verfügbar. Bitte Standortzugriff erlauben und erneut versuchen.');
   await expect(page.locator('#saveParkingGpsBtn')).toBeEnabled();
   expect(await page.evaluate(()=>({snapshot:JSON.stringify(parkingCloudController.snapshot()),writes:window.__toolyaMock.writes.length}))).toEqual(before);
   expect(await page.evaluate(ids=>Object.fromEntries(ids.map(id=>[id,document.getElementById(id).value])),Object.keys(fields))).toEqual(fields);
   await page.evaluate(()=>saveParkingSession(false));
   await expect.poll(()=>page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(before.writes+1);
   await expect(page.locator('#saveParkingGpsBtn')).toBeEnabled();
   const saved=await page.evaluate(()=>parkingCloudController.snapshot().sessions.at(-1));
   expect(saved.desc).toBe(fields.parkDesc);
   expect(saved.sector).toBe(fields.parkSector);
   expect(saved.gps).toBeNull();
  }
 });
}

for(const mode of ['saved','denied','missing','current']){
 test('parking nearby: '+mode+' location, blocked popup, bilingual search and private data isolation',async({page})=>{
  const gps=mode==='saved'?{lat:12.345,lng:23.456}:null;
  const fixture={sessions:gps?[{id:1,desc:'Private Löschen',sector:'Private A2',date:'25.11.2026',timestamp:1795608000000,cost:2,gps,photo:''}]:[],activeEndTime:null};
  const outbound=await isolated(page,true,false,fixture);
  await page.addInitScript(mode=>{
   window.__nearbyProbe={geo:0,opens:[],destinations:[],blocked:true};
   window.open=(url,target)=>{const p=window.__nearbyProbe;p.opens.push([url,target]);return p.blocked?null:{opener:window,closed:false,location:{replace:url=>p.destinations.push(url)}}};
   Object.defineProperty(navigator,'geolocation',{configurable:true,value:mode==='missing'?undefined:{getCurrentPosition(ok,fail){window.__nearbyProbe.geo++;queueMicrotask(()=>mode==='current'?ok({coords:{latitude:34.567,longitude:45.678}}):fail({code:1,message:'Synthetic denial'}))}}});
  },mode);
  await page.goto(origin+'/tools/parking/index.html');
  await expect.poll(()=>page.evaluate(()=>parkingCloudReady&&!!parkingCloudController?.ready)).toBe(true);
  const before=await page.evaluate(()=>JSON.stringify(parkingCloudController.snapshot()));
  const probe=()=>page.evaluate(()=>window.__nearbyProbe);
  expect((await probe()).geo).toBe(0);
  expect((await probe()).opens).toEqual([]);
  const status=page.locator('#nearby-status'),fallback=page.locator('#nearby-fallback'),query=page.locator('#nearby-query');
  const expectedState=lang=>mode==='saved'?(lang==='en'?'Near your parked car':'Rund um deinen Parkplatz'):mode==='current'?(lang==='en'?'Near your current location':'Rund um deinen Standort'):(lang==='en'?'Search without location':'Suche ohne Standort');
  const checkUrl=(href,term)=>{
   const u=new URL(href);expect(u.origin).toBe('https://www.google.com');
   if(mode==='saved'||mode==='current'){expect(decodeURIComponent(u.pathname)).toBe('/maps/search/'+term+'/@'+(mode==='saved'?'12.345,23.456':'34.567,45.678')+',16z');}
   else{expect(u.pathname).toBe('/maps/search/');expect(u.searchParams.get('query')).toBe(term);expect(u.searchParams.get('api')).toBe('1');}
   expect(href).not.toContain('Private');
  };
  for(const lang of ['de','en','de']){
   await page.locator('[data-tool-locale="'+lang+'"]').click();
   await expect(page.locator('#nearby-title')).toHaveText(lang==='en'?'Nearby':'In der Nähe');
   await page.locator('[data-poi="toilet"]').click();
   await expect(status).toHaveText(expectedState(lang));
   await expect(fallback).toBeVisible();
   await expect(fallback).toHaveAttribute('rel','noopener noreferrer');
   checkUrl(await fallback.getAttribute('href'),lang==='en'?'Public restroom':'Öffentliche Toilette');
   await query.fill('Bäcker & Café');
   await page.locator('#nearby-form button[type="submit"]').click();
   await expect(fallback).toBeVisible();
   checkUrl(await fallback.getAttribute('href'),'Bäcker & Café');
   await expect(query).toHaveValue('Bäcker & Café');
   expect(await page.evaluate(()=>JSON.stringify(parkingCloudController.snapshot()))).toBe(before);
   expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
  }
  expect((await probe()).geo).toBe(mode==='saved'||mode==='missing'?0:6);
  expect((await probe()).opens).toHaveLength(6);
  await page.evaluate(()=>window.__nearbyProbe.blocked=false);
  await page.locator('[data-poi="atm"]').click();
  await expect.poll(async()=>(await probe()).destinations.length).toBe(1);
  checkUrl((await probe()).destinations[0],'Geldautomat');
  await expect(fallback).toBeHidden();
  expect(await page.evaluate(()=>JSON.stringify(parkingCloudController.snapshot()))).toBe(before);
  expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
  expect(outbound.filter(url=>/google\.com\/maps/.test(url))).toEqual([]);
 });
}

/* Real validation branches, isolated account and snapshot; no save RPC expected. */
for(const fixture of [
 {
  "tool": "loans",
  "handler": "saveContact",
  "fields": {
   "contactName": "",
   "contactPhone": "123456"
  },
  "de": "Bitte einen Namen eingeben!",
  "en": "Please enter a name!",
  "line": 490
 },
 {
  "tool": "loans",
  "handler": "saveInventoryItem",
  "fields": {
   "invTitle": "",
   "invSerial": "Private Löschen 42"
  },
  "de": "Bitte eine Bezeichnung für den Gegenstand angeben!",
  "en": "Please enter an item description!",
  "line": 509
 },
 {
  "tool": "loans",
  "handler": "updateItem",
  "fields": {
   "editTitle": "Private Löschen",
   "editPerson": "Private Person",
   "editDate": "",
   "editNote": "Private Notiz"
  },
  "de": "Bitte Gegenstand, Person und Ausleihdatum angeben!",
  "en": "Please enter an item, person and loan date!",
  "line": 767
 },
 {
  "tool": "moving",
  "handler": "saveBox",
  "fields": {
   "boxName": "",
   "boxDesc": "Private Löschen",
   "boxBarcode": "PRIVATE-42"
  },
  "de": "Bitte Standort und Kisten-Name angeben!",
  "en": "Please enter a location and box name!",
  "line": 719
 },
 {
  "tool": "moving",
  "handler": "addSubItem",
  "fields": {
   "newSubItemName": "",
   "newSubItemVal": "12.5"
  },
  "de": "Bitte Artikel-Name eingeben!",
  "en": "Please enter an item name!",
  "line": 808
 },
 {
  "tool": "moving",
  "handler": "updateBox",
  "fields": {
   "editBoxName": "",
   "editBoxDesc": "Private Löschen",
   "editBoxBarcode": "PRIVATE-42"
  },
  "de": "Bitte Standort und Kisten-Name angeben!",
  "en": "Please enter a location and box name!",
  "line": 831
 },
 {
  "tool": "pet-health",
  "handler": "savePet",
  "fields": {
   "petName": "",
   "petChip": "PRIVATE-42",
   "petAllergies": "Private Löschen"
  },
  "de": "Bitte einen Namen für das Haustier eingeben!",
  "en": "Please enter a pet name!",
  "line": 554
 },
 {
  "tool": "pet-health",
  "handler": "saveMedication",
  "fields": {
   "medName": "",
   "medStock": "12"
  },
  "de": "Bitte Medikamenten-Namen angeben!",
  "en": "Please enter a medication name!",
  "line": 634
 },
 {"tool":"plants","handler":"updateCisternCapacity","fields":{"cisternMaxLiters":"0"},"de":"Bitte ein gültiges Fassungsvermögen größer als 0 eingeben.","en":"Enter a valid capacity greater than 0.","line":685},
 {"tool":"plants","handler":"addSeedItem","fields":{"seedName":"Private Löschen","seedYear":"1800"},"de":"Bitte ein gültiges Saatgutjahr eingeben.","en":"Enter a valid seed year.","line":741},
 {"tool":"plants","handler":"saveHarvest","fields":{"harvestPlantId":"1","harvestWeightGrams":"0"},"de":"Bitte eine gültige Erntemenge in ganzen Gramm eingeben.","en":"Enter a valid harvest amount in whole grams.","line":844},
 {"tool":"budget","handler":"saveReceipt","fields":{"receiptTitle":"Private Löschen","receiptDate":"2026-11-25","receiptPrice":"0","receiptNote":"Private Notiz"},"de":"Bitte Titel, gültiges Kaufdatum und einen positiven Betrag angeben!","en":"Enter a title, valid purchase date and positive amount.","line":1225},
 {"tool":"budget","handler":"saveSavingsGoal","fields":{"goalTitle":"Private Löschen","goalTarget":"0","goalCurrent":"2"},"de":"Bitte gültigen Titel, positiven Zielbetrag und Startbetrag ab 0 € eingeben!","en":"Enter a valid title, a positive target amount and a starting amount of at least €0.","line":1741},
 {"tool":"pet-health","handler":"saveEvent","fields":{"eventTitle":"Private Löschen","eventDate":"","eventCost":"12.5"},"de":"Bitte Haustier, Datum und Bezeichnung angeben!","en":"Please enter a pet, date and description!","line":664},
 {"tool":"plants","handler":"savePlant","fields":{"plantName":"","plantLastWatered":"2026-11-25","plantNote":"Private Löschen"},"de":"Bitte Name und gültiges Gießdatum angeben!","en":"Enter a name and valid watering date.","line":985},
 {"tool":"plants","handler":"savePlant","fields":{"plantName":"Private Löschen","plantLastWatered":"2026-11-25","plantInterval":"0","plantNote":"Private Notiz"},"de":"Bitte ein Gießintervall zwischen 1 und 3650 Tagen eingeben.","en":"Enter a watering interval between 1 and 3650 days.","line":986},
 {"tool":"plants","handler":"updatePlant","fields":{"editId":"invalid","editName":"Private Löschen"},"de":"Ungültige Pflanzen-ID. Die Änderungen wurden nicht gespeichert.","en":"Invalid plant ID. Changes were not saved.","line":1131},
 {"tool":"plants","handler":"saveDiaryEntry","fields":{"diaryPlantId":"invalid","diaryText":"Private Löschen"},"de":"Ungültige Pflanzen-ID.","en":"Invalid plant ID.","line":1088},
 {"tool":"budget","handler":"runOCR","fields":{"receiptTitle":"Private Löschen","receiptNote":"Private Notiz"},"de":"Bitte wähle zuerst ein Belegfoto aus!","en":"Select a receipt photo first.","line":1134},
 {"tool":"budget","handler":"saveReceipt","fields":{"receiptTitle":"Private Löschen","receiptDate":"2026-11-25","receiptPrice":"12.5","receiptWarranty":"-1","receiptReturnDays":"0","receiptLifespan":"5","receiptNote":"Private Notiz"},"de":"Bitte gültige Garantie-, Rückgabe- und Lebensdauerwerte angeben.","en":"Enter valid warranty, return period and useful-life values.","line":1230}
]){
 test('i18n runtime catalogue: '+fixture.tool+' '+fixture.handler+' line '+fixture.line+' preserves draft on validation in DE and EN',async({page},testInfo)=>{
  testInfo.annotations.push({type:'toolya-runtime-message',description:JSON.stringify({file:'tools/'+fixture.tool+'/index.html',handler:fixture.tool==='budget'&&fixture.handler==='saveReceipt'?'saveReceiptInternal':fixture.handler,de:fixture.de,en:fixture.en,line:fixture.line||null})});
  await isolated(page,true);
  await page.goto(origin+'/tools/'+fixture.tool+'/index.html');
  const state=()=>page.evaluate(tool=>{
   const controller=tool==='loans'?loansCloudController:tool==='moving'?movingCloudController:tool==='plants'?plantsCloudController:tool==='budget'?toolyaCloudController:petCloudController;
   const ready=tool==='loans'?loansCloudReady:tool==='moving'?movingCloudReady:tool==='plants'?plantsCloudReady:tool==='budget'?toolyaCloudReady:petCloudReady;
   return {ready:!!(ready&&controller?.ready),snapshot:controller?.ready?JSON.stringify(controller.snapshot()):null,writes:window.__toolyaMock?.writes.length};
  },fixture.tool);
  await expect.poll(async()=>(await state()).ready).toBe(true);
  await page.evaluate(fields=>{for(const [id,value] of Object.entries(fields)){const node=document.getElementById(id);if(!node)throw Error('Missing fixture input '+id);node.value=value;}},fixture.fields);
  const draft=()=>page.evaluate(ids=>Object.fromEntries(ids.map(id=>[id,document.getElementById(id).value])),Object.keys(fixture.fields));
  expect(await draft()).toEqual(fixture.fields);
  const before=await state();
  expect(before.writes).toBe(0);
  for(const lang of ['de','en','de']){
   await page.locator('[data-tool-locale="'+lang+'"]').click();
   await expect(page.locator('html')).toHaveAttribute('lang',lang);
   expect(await draft()).toEqual(fixture.fields);
   await page.evaluate(handler=>window[handler](),fixture.handler);
   const notice=page.getByRole('alertdialog',{name:'Toolya'});
   await expect(notice.locator('#hl-alert-message')).toHaveText(fixture[lang]);
   await notice.getByRole('button',{name:'OK'}).press('Enter');
   await expect(notice).toBeHidden();
   expect(await draft()).toEqual(fixture.fields);
   expect(await state()).toEqual(before);
  }
 });
}


test('budget warranty ICS: actual DE/EN downloads retain dates, alarm and private data without writes',async({page})=>{
 const {readFile}=require('node:fs/promises');
 const receipt={id:82,title:'Öl, Pflege; Gerät',store:'Privater Laden',sn:'SN-82',location:'Privater Ort',entryType:'ausgabe',date:'2028-01-31',price:42,category:'Lebensmittel',warrantyMonths:1,photos:[]};
 await isolated(page,true,true,{entries:[receipt],budgets:{},goals:[]});
 await page.goto(origin+'/tools/budget/index.html?lang=en');
 await expect.poll(()=>page.evaluate(()=>typeof toolyaCloudReady!=='undefined'&&toolyaCloudReady&&!!toolyaCloudController?.ready)).toBe(true);
 if(await page.locator('#toolya-consent-panel').isVisible())await page.getByRole('button',{name:'Reject',exact:true}).or(page.getByRole('button',{name:'Ablehnen',exact:true})).click();
 const button=page.locator('button[onclick="downloadICS(82)"]');
 await expect(button).toBeVisible();
 const before=await page.evaluate(()=>JSON.stringify(getData()));
 for(const lang of ['en','de']){
  const choice=page.locator('[data-tool-locale="'+lang+'"]');
  await choice.click();
  await expect(choice).toHaveAttribute('aria-pressed','true');
  const [download]=await Promise.all([page.waitForEvent('download'),button.click()]);
  const content=(await readFile(await download.path(),'utf8')).replaceAll('\r\n ','');
  expect(download.suggestedFilename()).toMatch(lang==='en'?/^warranty-.*\.ics$/:/^garantie-.*\.ics$/);
  expect(content).toContain('SUMMARY:'+(lang==='en'?'Warranty expiry: ':'Garantie-Ablauf: ')+'Öl\\, Pflege\\; Gerät\r\n');
  expect(content).toContain('UID:82-20280130@helferlein.local\r\n');
  expect(content).toContain('DTSTART;VALUE=DATE:20280130\r\n');
  expect(content).toContain('DTEND;VALUE=DATE:20280131\r\n');
  expect(content).toContain(lang==='en'?'expires on 29/02/2028':'läuft am 29.2.2028');
  expect(content).toContain('TRIGGER;RELATED=START:PT9H\r\n');
  expect(content).toContain(lang==='en'?'DESCRIPTION:Warranty expires in 30 days!':'DESCRIPTION:Garantie läuft in 30 Tagen ab!');
  expect(content).toContain('Privater Laden');
  expect(content).toContain('SN-82');
  expect(content).toContain('Privater Ort');
  expect(await page.evaluate(()=>JSON.stringify(getData()))).toBe(before);
 }
 expect(await page.evaluate(()=>window.__toolyaMock.writes)).toEqual([]);
});


test('Wishes annual JSON: DE/EN downloads preserve private snapshot and reject account switch',async({page})=>{
 const {readFile}=require('node:fs/promises');
 const gift={id:'gift-fixture',occasion_id:'occasion-fixture',title:'Privates Geschenk, Öl 🎁',status:'gifted',actual_amount:42.5};
 const closing={id:'closing-fixture',closing_year:2025,closed_at:'2026-01-01T00:00:00Z',gift_count:1,gifted_count:1,planned_total:50,actual_total:42.5,budget_total:60,task_count:0,task_done_count:0,gifts_snapshot:[gift],budgets_snapshot:[{occasion_id:'occasion-fixture',occasion_title:'Privater Anlass',budget_amount:60}],tasks_snapshot:[]};
 await isolated(page,false);
 await page.route('**/tools/wishes/toolya-client.mjs',route=>route.fulfill({contentType:'text/javascript',body:
  'window.__annualMock={owner:"fixture-owner",writes:[],closing:'+JSON.stringify(closing)+'};'+
  'const m=window.__annualMock;export const db={auth:{async getUser(){return {data:{user:m.owner?{id:m.owner}:null},error:null}},async getSession(){return {data:{session:null},error:null}},onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}}},from(table){const q={select(){return q},eq(){return q},order(){return q},limit(){return q},then(resolve){resolve({data:table==="wishlist_gift_year_closings"?[m.closing]:[],error:null})}};for(const method of ["insert","update","upsert","delete"])q[method]=()=>{m.writes.push(method);throw Error("Unexpected write")};return q},async rpc(name){m.writes.push(name);throw Error("Unexpected RPC")}};'
 }));
 await page.goto(origin+'/tools/wishes/gift-analytics.html?lang=en');
 await expect(page.locator('#content')).toBeVisible();
 await page.locator('#reviewYear').selectOption('2025');
 const button=page.locator('#exportYearJson');
 let first;
 for(const lang of ['en','de']){
  const choice=page.locator('[data-wishes-locale="'+lang+'"]');
  await choice.click();
  await expect(choice).toHaveAttribute('aria-pressed','true');
  const [download]=await Promise.all([page.waitForEvent('download'),button.click()]);
  expect(download.suggestedFilename()).toBe('helferlein-geschenk-jahresrueckblick-2025.json');
  const payload=JSON.parse(await readFile(await download.path(),'utf8'));
  expect(payload.schema_version).toBe(1);
  expect(payload.report.gifts).toEqual([gift]);
  expect(payload.report.actual_total).toBe(42.5);
  expect(payload.report.year).toBe(2025);
  expect(JSON.stringify(payload)).not.toContain('fixture-owner');
  expect(JSON.stringify(payload)).not.toContain('closing-fixture');
  expect(Number.isFinite(Date.parse(payload.exported_at))).toBe(true);
  delete payload.exported_at;
  if(first)expect(payload).toEqual(first);else first=payload;
 }
 const downloads=[];page.on('download',d=>downloads.push(d));
 for(const lang of ['en','de']){
  await page.locator('[data-wishes-locale="'+lang+'"]').click();
  await page.evaluate(()=>{window.__annualMock.owner='different-owner'});
  await button.click();
  await expect(page.locator('#reviewStatus')).toContainText(lang==='de'?'Export abgebrochen':/session|account/i);
  await expect(button).toBeEnabled();
 }
 expect(downloads).toEqual([]);
 expect(await page.evaluate(()=>window.__annualMock.closing)).toEqual(closing);
 expect(await page.evaluate(()=>window.__annualMock.writes)).toEqual([]);
});


test('Wishes gift task report: bilingual JSON download, cancellation, print and account guard',async({page})=>{
 const {readFile}=require('node:fs/promises');
 const event={id:1,task_title:'Private Aufgabe, Öl 🎁',event_type:'completed',old_status:'open',new_status:'done',old_due_date:'2026-11-20',new_due_date:'2026-11-21',occurred_at:'2026-11-21T12:00:00Z',occasion_id:'fixture-occasion',occasion_title:'Privater Anlass'};
 await isolated(page,false);
 await page.route('**/tools/wishes/toolya-client.mjs',route=>route.fulfill({contentType:'text/javascript',body:
  'window.__taskReportMock={owner:"fixture-owner",writes:[],events:'+JSON.stringify([event])+'};'+
  'const m=window.__taskReportMock;export const db={auth:{async getUser(){return {data:{user:m.owner?{id:m.owner}:null},error:null}},async getSession(){return {data:{session:null},error:null}},onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}}},from(table){const q={select(){return q},eq(){return q},order(){return q},range(){return q},then(resolve){resolve({data:table==="wishlist_gift_task_events"?m.events:[],error:null})}};for(const method of ["insert","update","upsert","delete"])q[method]=()=>{m.writes.push(method);throw Error("Unexpected write")};return q},async rpc(name){m.writes.push(name);throw Error("Unexpected RPC")}};'
 }));
 await page.goto(origin+'/tools/wishes/report.html?lang=en');
 await expect(page.locator('#report')).toBeVisible();
 const button=page.locator('#exportEvents');
 let first;
 for(const lang of ['en','de']){
  const choice=page.locator('[data-wishes-locale="'+lang+'"]');
  await choice.click();
  await expect(choice).toHaveAttribute('aria-pressed','true');
  await page.evaluate(()=>{window.__printed=0;window.print=()=>{window.__printed++}});
  await page.locator('#printReport').click();
  expect(await page.evaluate(()=>window.__printed)).toBe(1);
  const cancelled=[];const listener=d=>cancelled.push(d);page.on('download',listener);
  page.once('dialog',d=>d.dismiss());
  await button.click();
  expect(cancelled).toEqual([]);page.off('download',listener);
  page.once('dialog',d=>d.accept());
  const [download]=await Promise.all([page.waitForEvent('download'),button.click()]);
  expect(download.suggestedFilename()).toMatch(/^helferlein-private-aufgabenereignisse-\d{4}-\d{2}-\d{2}\.json$/);
  const payload=JSON.parse(await readFile(await download.path(),'utf8'));
  expect(payload.format).toBe('helferlein-wishes-task-events-v1');
  expect(payload.event_count).toBe(1);
  expect(payload.events).toEqual([event]);
  expect(JSON.stringify(payload)).not.toContain('fixture-owner');
  expect(Number.isFinite(Date.parse(payload.exported_at))).toBe(true);
  delete payload.exported_at;
  if(first)expect(payload).toEqual(first);else first=payload;
 }
 const blocked=[];page.on('download',d=>blocked.push(d));
 for(const lang of ['en','de']){
  await page.locator('[data-wishes-locale="'+lang+'"]').click();
  await page.evaluate(()=>{window.__taskReportMock.owner='different-owner'});
  page.once('dialog',d=>d.accept());
  await button.click();
  await expect(page.locator('#status')).toContainText(lang==='de'?'Export abgebrochen':/session|account/i);
  await expect(button).toBeEnabled();
 }
 expect(blocked).toEqual([]);
 expect(await page.evaluate(()=>window.__taskReportMock.events)).toEqual([event]);
 expect(await page.evaluate(()=>window.__taskReportMock.writes)).toEqual([]);
});


test('Dashboard linked global backup: DE/EN actual JSON downloads exclude session and unknown keys',async({page})=>{
 const {readFile}=require('node:fs/promises');
 await isolated(page,false);
 const fixture='["Private Öl & Pflege"]';
 let first;
 for(const lang of ['de','en']){
  await page.goto(origin+(lang==='en'?'/en/index.html':'/index.html'));
  await page.waitForFunction(()=>window.toolyaHomeReady===true);
  await page.evaluate(value=>{
   localStorage.setItem('hub_favorites',value);
   localStorage.setItem('sb-fixture-auth-token','private-session-marker');
   localStorage.setItem('unrelated-fixture','private-unknown-marker');
  },fixture);
  const before=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
  const cancelled=[];const listener=d=>cancelled.push(d);page.on('download',listener);
  page.once('dialog',d=>d.dismiss());
  await page.evaluate(()=>window.exportGlobalBackup(false));
  expect(cancelled).toEqual([]);page.off('download',listener);
  page.once('dialog',d=>d.accept());
  const pending=page.waitForEvent('download');
  await page.evaluate(()=>window.exportGlobalBackup(false));
  const download=await pending;
  expect(download.suggestedFilename()).toMatch(/^helferlein-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const payload=JSON.parse(await readFile(await download.path(),'utf8'));
  expect(payload.app).toBe('Toolya');
  expect(payload.version).toBe('2.0');
  expect(payload.localStorage.hub_favorites).toBe(fixture);
  expect(payload.tools.hub).toContain('hub_favorites');
  expect(JSON.stringify(payload)).not.toContain('private-session-marker');
  expect(JSON.stringify(payload)).not.toContain('private-unknown-marker');
  expect(Number.isFinite(Date.parse(payload.created))).toBe(true);
  delete payload.created;
  if(first)expect(payload.localStorage.hub_favorites).toBe(first.localStorage.hub_favorites);else first=payload;
  expect(await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)))).toEqual(before);
  expect(await page.evaluate(()=>window.__toolyaMock.writes)).toEqual([]);
 }
});


test('Global encrypted backup DE/EN: actual downloads decrypt, exclude secrets and reject wrong password',async({page})=>{
 const {readFile}=require('node:fs/promises');
 const {pbkdf2Sync,createDecipheriv}=require('node:crypto');
 const password='isolated-fixture-password-2026';
 const fixture='["Privates Öl & Pflege"]';
 await isolated(page,false);
 const envelopes=[];
 for(const lang of ['de','en']){
  await page.goto(origin+(lang==='en'?'/en/index.html':'/index.html'));
  await page.waitForFunction(()=>window.toolyaHomeReady===true);
  await page.evaluate(value=>{
   localStorage.setItem('hub_favorites',value);
   localStorage.setItem('sb-fixture-auth-token','private-session-marker');
   localStorage.setItem('unrelated-fixture','private-unknown-marker');
  },fixture);
  const before=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
  const start=()=>{page.once('dialog',d=>d.accept());return page.evaluate(()=>window.exportGlobalBackup(true))};
  const dialog=page.locator('form[role="dialog"]').filter({has:page.locator('input[type="password"]')});
  const cancelled=[];const listener=d=>cancelled.push(d);page.on('download',listener);
  const cancelAction=start();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button',{name:lang==='de'?'Abbrechen':'Cancel',exact:true}).click();
  await cancelAction;
  expect(cancelled).toEqual([]);page.off('download',listener);
  const action=start();
  await expect(dialog).toBeVisible();
  const fields=dialog.locator('input[type="password"]');
  await fields.nth(0).fill(password);
  await fields.nth(1).fill(password+'-wrong');
  const submit=dialog.locator('button[type="submit"]');
  await submit.click();
  await expect(dialog.getByRole('alert')).toHaveText(lang==='de'?'Die Passwörter stimmen nicht überein.':'Passwords do not match.');
  await fields.nth(1).fill(password);
  const pending=page.waitForEvent('download');
  await submit.click();
  const download=await pending;await action;
  expect(download.suggestedFilename()).toMatch(/^helferlein-backup-(?:verschluesselt|encrypted)-\d{4}-\d{2}-\d{2}\.json$/);
  const raw=await readFile(await download.path(),'utf8');
  expect(raw).not.toContain(fixture);
  expect(raw).not.toContain(password);
  const e=JSON.parse(raw);
  expect(e).toMatchObject({app:'Toolya',format:'encrypted-backup-v1',kdf:'PBKDF2-SHA256',iterations:600000,cipher:'AES-256-GCM'});
  const salt=Buffer.from(e.salt,'base64'),iv=Buffer.from(e.iv,'base64'),ciphertext=Buffer.from(e.ciphertext,'base64');
  expect(salt.length).toBe(16);expect(iv.length).toBe(12);
  const decrypt=secret=>{
   const key=pbkdf2Sync(secret,salt,e.iterations,32,'sha256');
   const decipher=createDecipheriv('aes-256-gcm',key,iv);
   decipher.setAuthTag(ciphertext.subarray(-16));
   return JSON.parse(Buffer.concat([decipher.update(ciphertext.subarray(0,-16)),decipher.final()]).toString('utf8'));
  };
  expect(()=>decrypt(password+'-wrong')).toThrow();
  const payload=decrypt(password);
  expect(payload).toMatchObject({app:'Toolya',version:'2.0',localStorage:{hub_favorites:fixture}});
  expect(JSON.stringify(payload)).not.toContain('private-session-marker');
  expect(JSON.stringify(payload)).not.toContain('private-unknown-marker');
  expect(await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)))).toEqual(before);
  expect(await page.evaluate(()=>window.__toolyaMock.writes)).toEqual([]);
  envelopes.push(e);
 }
 expect(envelopes[0].salt).not.toBe(envelopes[1].salt);
 expect(envelopes[0].iv).not.toBe(envelopes[1].iv);
});


test('Global encrypted restore DE/EN: password and overwrite cancellation preserve local data',async({page})=>{
 const {pbkdf2Sync,createCipheriv,randomBytes}=require('node:crypto');
 const password='isolated-restore-password-2026';
 const key='helferlein_ui_layout_pflanzen_v1';
 const original='[{"id":"original","visible":true}]',replacement='[{"id":"replacement","visible":false}]';
 const salt=randomBytes(16),iv=randomBytes(12);
 const cipher=createCipheriv('aes-256-gcm',pbkdf2Sync(password,salt,600000,32,'sha256'),iv);
 const plaintext=JSON.stringify({app:'Toolya',version:'2.0',created:'2026-11-25T12:00:00Z',localStorage:{[key]:replacement,'sb-fixture-auth-token':'must-not-import','unrelated-fixture':'must-not-import'}});
 const encrypted=Buffer.concat([cipher.update(plaintext,'utf8'),cipher.final(),cipher.getAuthTag()]);
 const envelope={app:'Toolya',format:'encrypted-backup-v1',kdf:'PBKDF2-SHA256',iterations:600000,cipher:'AES-256-GCM',salt:salt.toString('base64'),iv:iv.toString('base64'),ciphertext:encrypted.toString('base64')};
 await isolated(page,false);
 for(const lang of ['de','en']){
  await page.goto(origin+(lang==='en'?'/en/index.html':'/index.html'));
  await page.waitForFunction(()=>window.toolyaHomeReady===true);
  await page.evaluate(({key,original})=>{localStorage.setItem(key,original);localStorage.setItem('unrelated-fixture','keep-original')},{key,original});
  const snapshot=()=>page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
  const before=await snapshot();
  const load=()=>page.evaluate(payload=>window.importGlobalBackup({target:{files:[new File([JSON.stringify(payload)],'fixture.json',{type:'application/json'})],value:'fixture.json'}}),envelope);
  const dialog=page.getByRole('dialog',{name:lang==='en'?'Backup password':'Backup-Passwort',exact:true});
  const submit=dialog.locator('button[type="submit"]');
  await load();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button',{name:lang==='en'?'Cancel':'Abbrechen',exact:true}).click();
  await expect(dialog).toHaveCount(0);
  expect(await snapshot()).toEqual(before);
  await load();
  await dialog.locator('input[type="password"]').fill(password+'-wrong');
  await submit.click();
  const notice=page.getByRole('alertdialog',{name:'Toolya'});
  await expect(notice.locator('#hl-alert-message')).toHaveText(lang==='en'?'Decryption failed. The password or backup file is invalid.':'Entschlüsselung fehlgeschlagen. Passwort oder Sicherungsdatei ist ungültig.');
  await notice.getByRole('button',{name:'OK'}).press('Enter');
  expect(await snapshot()).toEqual(before);
  await load();
  await dialog.locator('input[type="password"]').fill(password);
  const confirmation=page.waitForEvent('dialog');
  await submit.click();
  const cancel=await confirmation;
  expect(cancel.type()).toBe('confirm');await cancel.dismiss();
  expect(await snapshot()).toEqual(before);
  await load();
  await dialog.locator('input[type="password"]').fill(password);
  const approval=page.waitForEvent('dialog');
  await submit.click();
  const confirm=await approval;expect(confirm.type()).toBe('confirm');await confirm.accept();
  await expect(notice).toBeVisible();
  await notice.getByRole('button',{name:'OK'}).press('Enter');
  expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(replacement);
  expect(await page.evaluate(()=>localStorage.getItem('unrelated-fixture'))).toBe('keep-original');
  expect(await page.evaluate(()=>localStorage.getItem('sb-fixture-auth-token'))).toBe(before['sb-fixture-auth-token']??null);
  expect(await page.evaluate(()=>window.__toolyaMock.writes)).toEqual([]);
 }
});


test('Budget CSV DE/EN: real all and tax downloads preserve private records and prevent formula injection',async({page})=>{
 const {readFile}=require('node:fs/promises');
 const entries=[
  {id:91,date:'2026-11-20',entryType:'ausgabe',title:'Private Öl; "Pflege"',store:'=1+1',category:'Lebensmittel',price:-12.5,paymentMethod:'Bar',isTax:true,isFixkosten:true,sn:'SN-91',location:'Privater Ort',note:'@private\nNotiz',photos:[]},
  {id:92,date:'2026-11-10',entryType:'einnahme',title:'Nicht steuerrelevant',store:'Privater Händler',category:'Sonstiges',price:20,isTax:false,photos:[]},
  {id:93,date:'2026-11-15',entryType:'ausgabe',title:'  ＋private',store:'Privater Laden',category:'Sonstiges',price:null,isTax:true,photos:[]}
 ];
 await isolated(page,true,true,{entries,budgets:{},goals:[]});
 await page.goto(origin+'/tools/budget/index.html?lang=en');
 await expect.poll(()=>page.evaluate(()=>typeof toolyaCloudReady!=='undefined'&&toolyaCloudReady&&!!toolyaCloudController?.ready)).toBe(true);
 const before=await page.evaluate(()=>JSON.stringify(getData()));
 const {parseCsv}=await import('../../supabase/functions/wishlist-discovery/model.mjs');
 for(const lang of ['en','de']){
  const choice=page.locator('[data-tool-locale="'+lang+'"]');
  await choice.click();await expect(choice).toHaveAttribute('aria-pressed','true');
  for(const tax of [false,true]){
   const pending=page.waitForEvent('download');
   await page.evaluate(tax=>tax?exportSteuerCSV():exportAllBookingsCSV(),tax);
   const download=await pending;
   const prefix=lang==='en'?(tax?'tax-transactions-':'all-transactions-'):(tax?'steuer-buchungen-':'alle-buchungen-');
   expect(download.suggestedFilename()).toMatch(new RegExp('^'+prefix+'\\d{4}-\\d{2}-\\d{2}\\.csv$'));
   const raw=await readFile(await download.path(),'utf8');
   expect(raw.charCodeAt(0)).toBe(0xfeff);
   expect(raw).toContain('\r\n');
   const rows=parseCsv(raw);
   const date=lang==='en'?'Date':'Datum',title=lang==='en'?'Title':'Titel',merchant=lang==='en'?'Merchant':'Haendler',note=lang==='en'?'Note':'Notiz';
   expect(rows.map(r=>r[date])).toEqual(tax?['2026-11-15','2026-11-20']:['2026-11-10','2026-11-15','2026-11-20']);
   const last=rows.at(-1);
   expect(last[title]).toBe(entries[0].title);
   expect(last[merchant]).toBe("'=1+1");
   expect(last[note]).toBe("'@private\nNotiz");
   expect(last.Price_EUR??last.Preis_EUR).toBe('-12.50');
   expect(rows.at(-2)[title]).toBe("'  ＋private");
   expect(rows.at(-2).Price_EUR??rows.at(-2).Preis_EUR).toBe('');
   expect(last[lang==='en'?'Serial_number':'Seriennummer']).toBe('SN-91');
   if(!tax){
    expect(last[lang==='en'?'Storage_location':'Lagerort']).toBe('Privater Ort');
    expect(last[lang==='en'?'Tax_relevant':'Steuerrelevant']).toBe(lang==='en'?'Yes':'Ja');
    expect(rows[0][lang==='en'?'Tax_relevant':'Steuerrelevant']).toBe(lang==='en'?'No':'Nein');
   }else expect(raw).not.toContain('Nicht steuerrelevant');
   expect(await page.evaluate(()=>JSON.stringify(getData()))).toBe(before);
   expect(await page.evaluate(()=>window.__toolyaMock.writes)).toEqual([]);
  }
 }
});


test('Budget PDF DE/EN: signed totals, missing values, chronological private entries and immutable data',async({page})=>{
 const entries=[
  {id:91,date:'2026-11-20',entryType:'ausgabe',title:'Private Rückerstattung Öl',store:'Privater Laden',category:'Lebensmittel',price:-12.5,paymentMethod:'Bar',photos:[]},
  {id:92,date:'2026-11-10',entryType:'einnahme',title:'Privates Einkommen',category:'Einnahme',price:100,photos:[]},
  {id:93,date:'2026-11-15',entryType:'ausgabe',title:'Betrag fehlt',category:'Sonstiges',price:null,photos:[]},
  {id:94,date:'2026-11-12',entryType:'ausgabe',title:'Private Ausgabe',category:'Sonstiges',price:40,photos:[]},
  {id:95,date:'2026-11-13',entryType:'einnahme',title:'Einnahmekorrektur',category:'Einnahme',price:-5,photos:[]}
 ];
 await isolated(page,true,true,{entries,budgets:{},goals:[]});
 await page.goto(origin+'/tools/budget/index.html?lang=en');
 await expect.poll(()=>page.evaluate(()=>typeof toolyaCloudReady!=='undefined'&&toolyaCloudReady&&!!toolyaCloudController?.ready)).toBe(true);
 const before=await page.evaluate(()=>JSON.stringify(getData()));
 await page.evaluate(()=>{
  window.__budgetPdf={texts:[],files:[]};
  window.jspdf={jsPDF:class{
   setFontSize(){return this}
   text(v){window.__budgetPdf.texts.push(String(v));return this}
   splitTextToSize(v){return [String(v)]}
   addPage(){return this}
   save(v){window.__budgetPdf.files.push(v)}
  }};
 });
 for(const lang of ['en','de']){
  const choice=page.locator('[data-tool-locale="'+lang+'"]');
  await choice.click();await expect(choice).toHaveAttribute('aria-pressed','true');
  await page.evaluate(()=>{window.__budgetPdf.texts=[];window.__budgetPdf.files=[];return exportPDF()});
  const result=await page.evaluate(()=>window.__budgetPdf);
  const en=lang==='en';
  expect(result.files).toHaveLength(1);
  expect(result.files[0]).toMatch(en?/^financial-report-\d{4}-\d{2}-\d{2}\.pdf$/:/^finanz-bericht-\d{4}-\d{2}-\d{2}\.pdf$/);
  const text=result.texts;
  expect(text).toContain(en?'Household finances and receipts overview':'Haushalts-, Finanz- & Kassenbon-Übersicht');
  expect(text).toContain(en?'Transactions: 4':'Buchungen: 4');
  expect(text).toContain(en?'Income: 95.00 EUR':'Einnahmen: 95,00 EUR');
  expect(text).toContain(en?'Expenses: 27.50 EUR':'Ausgaben: 27,50 EUR');
  expect(text).toContain(en?'Balance: 67.50 EUR':'Saldo: 67,50 EUR');
  expect(text).toContain(en?'Period: 10/11/2026 to 20/11/2026':'Zeitraum: 10.11.2026 bis 20.11.2026');
  const rows=text.filter(v=>/^\d{4}-\d{2}-\d{2} \|/.test(v));
  expect(rows.map(v=>v.slice(0,10))).toEqual(['2026-11-10','2026-11-12','2026-11-13','2026-11-15','2026-11-20']);
  for(const [index,title,amount] of [[0,'Privates Einkommen',en?'+100.00':'+100,00'],[1,'Private Ausgabe',en?'-40.00':'-40,00'],[2,'Einnahmekorrektur',en?'-5.00':'-5,00'],[3,'Betrag fehlt',en?'n/a':'k.A.'],[4,'Private Rückerstattung Öl',en?'+12.50':'+12,50']]){
   expect(rows[index]).toContain(title);expect(rows[index]).toContain(': '+amount+' €');
  }
  expect(await page.evaluate(()=>JSON.stringify(getData()))).toBe(before);
  expect(await page.evaluate(()=>window.__toolyaMock.writes)).toEqual([]);
 }
});


const pdfReportCases=[
 {tool:'car',ready:'toolyaCloudReady',fixture:{cars:[{id:1,name:'Privates Fahrzeug Öl',plate:'TEST-42',km:1000,insurance:'Privater Versicherer'}],events:[{id:2,carId:1,title:'Private Wartung',type:'Inspektion',date:'2026-11-17',cost:42},{id:3,carId:1,title:'Private Erstattung',type:'Inspektion',date:'2026-11-18',cost:-2}],tires:[]},de:['KFZ- & Wartungs-Report','Gesamtkosten: 40.00 EUR','KM: 1000','Vers.: Privater Versicherer'],en:['Vehicle and maintenance report','Total costs: 40.00 EUR','Mileage: 1000','Insurance: Privater Versicherer'],private:['Privates Fahrzeug Öl','TEST-42','Private Wartung','Private Erstattung'],files:['kfz-wartungs-report.pdf','vehicle-maintenance-report.pdf']},
 {tool:'parking',ready:'parkingCloudReady',fixture:{sessions:[{id:1,desc:'Privater Parkplatz Öl',sector:'Privates Deck',date:'17.11.2026',timestamp:'2026-11-17T12:00:00Z',cost:4.5,gps:null},{id:2,desc:'Privater Stellplatz',date:'18.11.2026',timestamp:'2026-11-18T12:00:00Z',cost:2,gps:null}],activeEndTime:null},de:['Parkschein- & Parkplatz-Report','Parkvorgänge: 2 | Gesamtkosten: 6,50 EUR','Sektor: Privates Deck'],en:['Parking session and location report','Parking sessions: 2 | Total costs: 6.50 EUR','Sector: Privates Deck'],private:['Privater Parkplatz Öl','Privater Stellplatz'],files:['park-report.pdf','parking-report.pdf']},
 {tool:'pet-health',ready:'petCloudReady',fixture:{pets:[{id:1,name:'Privates Tier Öl',species:'Hund',chip:'TEST-123',tasso:true,vet:{name:'Private Praxis',tel:'000'}}],events:[{id:2,petId:1,type:'Impfung',title:'Private Impfung',date:'2026-11-17',expiryDate:'2027-11-17',cost:42},{id:3,petId:1,type:'Kontrolle',title:'Private Kontrolle',date:'2026-11-18',cost:8}],meds:[]},de:['Haustier-Gesundheits-Pass Report','Gesamtkosten: 50.00 EUR','(Hund)','[Impfung]','TA: Private Praxis'],en:['Pet health report','Total costs: 50.00 EUR','(Dog)','[Vaccination]','Vet: Private Praxis'],private:['Privates Tier Öl','TEST-123','Private Impfung','Private Kontrolle'],files:['haustier-gesundheits-report.pdf','pet-health-report.pdf']},
 {tool:'loans',ready:'loansCloudReady',fixture:{contacts:[],inventory:[],items:[{id:1,title:'Privates Werkzeug Öl',person:'Private Person',serial:'TEST-42',date:'2026-11-17',returnDate:'2026-12-17',status:'active',deposit:42},{id:2,title:'Privates Buch',person:'Andere Person',date:'2026-11-18',status:'returned',deposit:10}]},de:['Leih- & Verleih-Report Pro','Offene Kaution / Wert: 42.00 EUR','[AKTIV]','[ZURÜCK]'],en:['Lending and borrowing report','Outstanding deposit / value: 42.00 EUR','[ACTIVE]','[RETURNED]'],private:['Privates Werkzeug Öl','Private Person','TEST-42','Privates Buch'],files:['verleih-report-pro.pdf','lending-report.pdf']},
 {tool:'plants',ready:'plantsCloudReady',fixture:{plants:[{id:2,name:'Private Pflanze Öl',species:'Tomate',location:'Privates Zimmer',light:'half',potSize:15,interval:7,lastWatered:'2026-11-17',diary:[],harvestLog:[],galleryPhotos:[]}],monthWaterLiters:0,totalHarvestGrams:0,inventory:[],seeds:[],beetSlots:Array(16).fill(null),cisternMax:500,cisternCurrent:400},de:['Pflanzen- & Garten-Pass Report','Pflanzen: 1','Ort: Privates Zimmer','Gießen: 7T'],en:['Plant and Garden Report','Plants: 1','Location: Privates Zimmer','Watering: 7d'],private:['Private Pflanze Öl','Tomate'],files:['pflanzen-report.pdf','plant-garden-report.pdf']},
 {tool:'housemates',ready:'secureWgRevision',fixture:{__wg:{id:'00000000-0000-4000-8000-000000000109',updated_at:'2026-11-17T00:00:00Z',payload:{flatmates:[{vorname:'Mia',nachname:'Test'}],data:[{id:2,title:'Private Buchung Öl',price:42,payer:'Mia Test',date:'2026-11-17',category:'Lebensmittel',entryType:'ausgabe',photos:[]}],budgets:{},goals:[],notes:[],events:[],inventory:[],diets:{},cleaning:[],shopping:[],contracts:[],cooking:['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'].map(day=>({day,chef:'Frei',dish:'',ingredients:''})),infoboard:{}}}},de:['WG- & Haushaltsbuch Abrechnung','Buchungen: 1','42,00 EUR'],en:['Household Finance Report','Transactions: 1','42.00 EUR'],private:['Private Buchung Öl','Mia Test'],files:['haushaltsbericht','household-finance-report']}
];
for(const spec of pdfReportCases)test(spec.tool+' PDF DE/EN: report content and unchanged private records',async({page})=>{
 await isolated(page,true,true,spec.fixture);
 const wg=spec.tool==='housemates';
 await page.goto(origin+'/tools/'+spec.tool+'/index.html?lang=en'+(wg?'&id=secure_00000000-0000-4000-8000-000000000109':''));
 await expect.poll(()=>page.evaluate(tool=>{
  switch(tool){
   case 'car':return typeof toolyaCloudReady!=='undefined'&&!!toolyaCloudReady;
   case 'parking':return typeof parkingCloudReady!=='undefined'&&!!parkingCloudReady;
   case 'pet-health':return typeof petCloudReady!=='undefined'&&!!petCloudReady;
   case 'loans':return typeof loansCloudReady!=='undefined'&&!!loansCloudReady;
   case 'plants':return typeof plantsCloudReady!=='undefined'&&!!plantsCloudReady;
   case 'housemates':return typeof secureWgRevision!=='undefined'&&!!secureWgRevision;
  }
 },spec.tool)).toBe(true);
 const before=await page.evaluate(()=>JSON.stringify(getData()));
 await page.evaluate(()=>{
  window.__reportPdf={texts:[],files:[]};
  window.jspdf={jsPDF:class{
   setFont(){return this}setFontSize(){return this}addPage(){return this}
   splitTextToSize(v){return [String(v)]}
   text(v){window.__reportPdf.texts.push(String(v));return this}
   save(v){window.__reportPdf.files.push(v)}
  }};
 });
 for(const lang of ['de','en']){
  const choice=page.locator('[data-tool-locale="'+lang+'"]');
  await choice.click();await expect(choice).toHaveAttribute('aria-pressed','true');
  await page.evaluate(wg=>{window.__reportPdf={texts:[],files:[]};return wg?exportAbrechnungPDF():exportPDF()},wg);
  const result=await page.evaluate(()=>window.__reportPdf);
  expect(result.files).toHaveLength(1);
  const filename=spec.files[lang==='en'?1:0];
  if(wg)expect(result.files[0]).toMatch(new RegExp('^'+filename+'-\\d{4}-\\d{2}-\\d{2}\\.pdf$'));
  else expect(result.files[0]).toBe(filename);
  const text=result.texts.join('\n');
  for(const value of [...spec[lang],...spec.private])expect(text).toContain(value);
  expect(await page.evaluate(()=>JSON.stringify(getData()))).toBe(before);
  expect(await page.evaluate(()=>window.__toolyaMock.writes)).toEqual([]);
 }
});


const qrCases=[
 {tool:'budget',fixture:{entries:[{id:82,title:'Privates Gerät Öl',store:'Privater Laden',sn:'SN-82',entryType:'ausgabe',date:'2028-01-31',price:42,category:'Lebensmittel',warrantyMonths:1,photos:[]}],budgets:{},goals:[]},payload:'GERÄT: Privates Gerät Öl\nKAUFDATUM: 2028-01-31\nHÄNDLER: Privater Laden\nSERIENNR: SN-82',size:120},
 {tool:'loans',fixture:{contacts:[],inventory:[],items:[{id:1,title:'Privates Werkzeug Öl',person:'Private Person',date:'2026-11-17',returnDate:'2026-12-17',status:'active',deposit:42}]},payload:'Gegenstand: Privates Werkzeug Öl | Verliehen an: Private Person',size:180},
 {tool:'plants',fixture:{plants:[{id:2,name:'Private Pflanze Öl',species:'Tomate',location:'Privates Zimmer',light:'half',potSize:15,interval:7,lastWatered:'2026-11-17',diary:[],harvestLog:[],galleryPhotos:[]}],monthWaterLiters:0,totalHarvestGrams:0,inventory:[],seeds:[],beetSlots:Array(16).fill(null),cisternMax:500,cisternCurrent:400},payload:'Pflanze: Private Pflanze Öl | Gießen: alle 7T',size:160},
 {tool:'housemates',fixture:{__wg:{id:'00000000-0000-4000-8000-000000000109',updated_at:'2026-11-17T00:00:00Z',payload:{flatmates:[],data:[],notes:[],events:[],inventory:[],diets:{},cleaning:[],shopping:[],contracts:[],budgets:{},goals:[],cooking:[],infoboard:{wifi:'Nicht als Passwort verwenden'}}}},payload:'WIFI:T:WPA;S:Privat\\;Netz;P:Test\\:Pass\\,wort\\\\42;;',size:140}
];
for(const spec of qrCases)test(spec.tool+' QR DE/EN: stable private payload, cancellation and no writes',async({page})=>{
 const outbound=await isolated(page,true,true,spec.fixture);
 const wg=spec.tool==='housemates';
 await page.goto(origin+'/tools/'+spec.tool+'/index.html?lang=en'+(wg?'&id=secure_00000000-0000-4000-8000-000000000109':''));
 await expect.poll(()=>page.evaluate(tool=>{
  if(tool==='budget')return typeof toolyaCloudReady!=='undefined'&&!!toolyaCloudReady;
  if(tool==='loans')return typeof loansCloudReady!=='undefined'&&!!loansCloudReady;
  if(tool==='plants')return typeof plantsCloudReady!=='undefined'&&!!plantsCloudReady;
  return typeof secureWgRevision!=='undefined'&&!!secureWgRevision;
 },spec.tool)).toBe(true);
 const before=await page.evaluate(()=>JSON.stringify(getData()));
 const storage=()=>page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>k!=='toolya-locale-v1')));
 await page.evaluate(()=>{
  window.__qrCaptured=[];window.__prints=0;
  window.QRCode=class{constructor(el,options){window.__qrCaptured.push({...options});el.textContent='QR fixture'}};
  window.print=()=>window.__prints++;
 });
 for(const lang of ['de','en']){
  const choice=page.locator('[data-tool-locale="'+lang+'"]');
  await choice.click();await expect(choice).toHaveAttribute('aria-pressed','true');
  const stored=await storage();
  await page.evaluate(async tool=>{
   if(tool==='budget')return openQRModal(82);
   if(tool==='loans'){const item=getData().items[0];return showQrCode(item.title,item.person)}
   if(tool==='plants'){const p=getData().plants[0];return showQrCode(p.name,p.species,p.location,p.interval)}
   window.prompt=q=>q.includes('SSID')?'Privat;Netz':'Test:Pass,wort\\42';
   return openWLANQRModal();
  },spec.tool);
  const modal=page.locator(wg?'#wlanQrModal':'#qrModal');
  await expect(modal).toBeVisible();
  expect(await page.evaluate(()=>window.__qrCaptured.at(-1))).toMatchObject({text:spec.payload,width:spec.size,height:spec.size});
  if(spec.tool==='budget'){
   await expect(page.locator('#stickerTitle')).toHaveText('Privates Gerät Öl');
   await expect(page.locator('#stickerWarranty')).toHaveText(lang==='en'?'Warranty until: 29/02/2028':'Garantie bis: 29.2.2028');
   await modal.locator('button[onclick="window.print()"]').click();
   expect(await page.evaluate(()=>window.__prints)).toBe(lang==='de'?1:2);
  }
  await page.evaluate(tool=>tool==='budget'?closeQRModal():tool==='housemates'?closeWLANQRModal():closeQrModal(),spec.tool);
  await expect(modal).toBeHidden();
  if(wg){
   const count=await page.evaluate(()=>window.__qrCaptured.length);
   await page.evaluate(()=>{window.prompt=q=>q.includes('SSID')?'Privat;Netz':null;return openWLANQRModal()});
   await expect(page.locator('#wlanQrcode')).toHaveText(lang==='en'?'QR code creation cancelled.':'QR-Erstellung abgebrochen.');
   expect(await page.evaluate(()=>window.__qrCaptured.length)).toBe(count);
   await page.evaluate(()=>closeWLANQRModal());
  }
  expect(await page.evaluate(()=>JSON.stringify(getData()))).toBe(before);
  expect(await storage()).toEqual(stored);
  expect(await page.evaluate(()=>window.__toolyaMock.writes)).toEqual([]);
 }
 expect(outbound.every(url=>!url.includes('Privat')&&!url.includes('Pass%'))).toBe(true);
});

for(const fixture of [
 {handler:'deleteReceipt',id:82,de:'⚠️ Diese Buchung wirklich löschen?',en:'⚠️ Delete this transaction?',line:1389},
 {handler:'deleteSavingsGoal',id:83,de:'Sparziel löschen?',en:'Delete this savings goal?',line:1768}
]){
 test('i18n runtime catalogue: budget '+fixture.handler+' cancels deletion in DE and EN',async({page},testInfo)=>{
  testInfo.annotations.push({type:'toolya-runtime-message',description:JSON.stringify({file:'tools/budget/index.html',handler:fixture.handler,kind:'confirm',de:fixture.de,en:fixture.en,line:fixture.line})});
  await isolated(page,true,false,{entries:[{id:82,title:'Private Buchung Öl',date:'2026-11-17',price:42,category:'Lebensmittel',photos:[]}],budgets:{},goals:[{id:83,title:'Privates Sparziel',target:100,current:20}]});
  await page.goto(origin+'/tools/budget/index.html?lang=de');
  await expect.poll(()=>page.evaluate(()=>typeof toolyaCloudReady!=='undefined'&&toolyaCloudReady&&!!toolyaCloudController?.ready)).toBe(true);
  const state=()=>page.evaluate(()=>({snapshot:toolyaCloudController.snapshot(),writes:window.__toolyaMock.writes}));
  const before=await state();
  expect(before.writes).toEqual([]);
  expect(before.snapshot.entries.some(r=>r.id===82)).toBe(true);
  expect(before.snapshot.goals.some(r=>r.id===83)).toBe(true);
  for(const lang of ['de','en','de']){
   await page.locator('[data-tool-locale="'+lang+'"]').click();
   await expect(page.locator('html')).toHaveAttribute('lang',lang);
   const pending=page.waitForEvent('dialog',{timeout:5000});
   const action=page.evaluate(({handler,id})=>window[handler](id),fixture);
   const dialog=await pending;
   const actual={type:dialog.type(),message:dialog.message()};
   await dialog.dismiss();await action;
   expect(actual).toEqual({type:'confirm',message:fixture[lang]});
   expect(await state()).toEqual(before);
  }
 });
}

for(const fixture of [
 {handler:'loadPhotosToCanvas',selector:'#receiptPhotoInput',name:'invalid.txt',mime:'text/plain',size:1,line:929,de:'Bitte nur JPG-, PNG-, GIF- oder WebP-Bilder auswählen. Bereits vorhandene Belegbilder bleiben erhalten.',en:'Select JPG, PNG, GIF or WebP images only. Existing receipt images will be kept.'},
 {handler:'loadPhotosToCanvas',selector:'#receiptPhotoInput',name:'oversize.png',mime:'image/png',size:4*1024*1024+1,line:938,de:'Die ausgewählten Belegbilder sind zusammen zu groß (maximal 4 MB). Bitte kleinere Fotos auswählen. Bereits vorhandene Belegbilder bleiben erhalten.',en:'The selected receipt images are too large together (maximum 4 MB). Choose smaller photos. Existing receipt images will be kept.'},
 {handler:'importBackup',selector:'.b3-backup-input',name:'oversize.json',mime:'application/json',size:20*1024*1024+1,line:2081,de:'Backup zu groß (maximal 20 MB).',en:'Backup too large (maximum 20 MB).'},
 {handler:'importBackup',selector:'.b3-backup-input',name:'unreadable.json',mime:'application/json',size:1,line:2107,readError:true,de:'Backup-Datei konnte nicht gelesen werden.',en:'The backup file could not be read.'}
]){
 test('i18n runtime catalogue: budget '+fixture.handler+' line '+fixture.line+' rejects invalid files in DE and EN',async({page},testInfo)=>{
  testInfo.annotations.push({type:'toolya-runtime-message',description:JSON.stringify({file:'tools/budget/index.html',handler:fixture.handler,kind:'alert',line:fixture.line,de:fixture.de,en:fixture.en})});
  await isolated(page,true,false,{entries:[],budgets:{},goals:[]});
  await page.goto(origin+'/tools/budget/index.html?lang=de');
  await expect.poll(()=>page.evaluate(()=>typeof toolyaCloudReady!=='undefined'&&toolyaCloudReady&&!!toolyaCloudController?.ready)).toBe(true);
  await page.evaluate(()=>{currentUploadedPhotos=['data:image/png;base64,iVBORw0KGgo='];document.getElementById('receiptTitle').value='Private Buchung Öl';});
  const state=()=>page.evaluate(()=>({snapshot:toolyaCloudController.snapshot(),writes:window.__toolyaMock.writes,photos:[...currentUploadedPhotos],title:document.getElementById('receiptTitle').value}));
  const before=await state();
  expect(before.writes).toEqual([]);
  for(const lang of ['de','en','de']){
   await page.locator('[data-tool-locale="'+lang+'"]').click();
   await expect(page.locator('html')).toHaveAttribute('lang',lang);
   if(fixture.readError)await page.evaluate(()=>{const original=FileReader.prototype.readAsText;FileReader.prototype.readAsText=function(){FileReader.prototype.readAsText=original;queueMicrotask(()=>this.dispatchEvent(new ProgressEvent('error')));};});
   const input=page.locator(fixture.selector).first();
   await input.setInputFiles({name:fixture.name,mimeType:fixture.mime,buffer:Buffer.alloc(fixture.size)});
   const notice=page.getByRole('alertdialog',{name:'Toolya'});
   await expect(notice.locator('#hl-alert-message')).toHaveText(fixture[lang]);
   await notice.getByRole('button',{name:'OK'}).press('Enter');
   await expect(notice).toBeHidden();
   await expect(input).toHaveValue('');
   expect(await state()).toEqual(before);
  }
 });
}

for(const existing of [false,true]){
 test('i18n runtime catalogue: budget cloud migration '+(existing?'existing cloud':'new cloud')+' cancellation in DE and EN',async({page},testInfo)=>{
  const de=existing?'Es gibt sowohl Cloud-Daten als auch Gerätedaten. Die Cloud bleibt maßgeblich; lokale Daten werden nicht zusammengeführt oder gelöscht. Lokale Daten jetzt sichern und ausschließlich die Cloud-Daten verwenden?':'Vorhandene Gerätedaten in dein Toolya-Konto übernehmen? Cloud-Daten werden niemals überschrieben. Auf gemeinsam genutzten Geräten bitte zuerst die Zugehörigkeit der Daten prüfen.';
  const en=existing?'Both cloud and device data exist. Cloud data remains authoritative; local data will not be merged or deleted. Back up device data now and use cloud data only?':'Import existing device data into your Toolya account? Cloud data will never be overwritten. On shared devices, first check who owns the data.';
  testInfo.annotations.push({type:'toolya-runtime-message',description:JSON.stringify({file:'tools/budget/index.html',handler:'toolyaCloudBoot',kind:'confirm',line:existing?608:607,de,en})});
  await isolated(page,true,false,existing?{entries:[],budgets:{},goals:[]}:null);
  await page.goto(origin+'/tools/budget/index.html?lang=de');
  await expect.poll(()=>page.evaluate(()=>typeof toolyaCloudReady!=='undefined'&&toolyaCloudReady&&!!toolyaCloudController?.ready)).toBe(true);
  for(const lang of ['de','en','de']){
   await page.locator('[data-tool-locale="'+lang+'"]').click();
   await expect(page.locator('html')).toHaveAttribute('lang',lang);
   const before=await page.evaluate(()=>{const local=JSON.stringify([{id:94,title:'Private Altbuchung',date:'2026-01-01',price:12,category:'Lebensmittel',photos:[]}]);localStorage.setItem('kassenbon_data',local);return {local,writes:window.__toolyaMock.writes.length};});
   const pending=page.waitForEvent('dialog',{timeout:5000});
   const action=page.evaluate(()=>toolyaCloudBoot('haushaltsbuch-kassenbon'));
   const dialog=await pending;
   const actual={type:dialog.type(),message:dialog.message()};
   await dialog.dismiss();await action;
   expect(actual).toEqual({type:'confirm',message:lang==='en'?en:de});
   expect(await page.evaluate(()=>({local:localStorage.getItem('kassenbon_data'),writes:window.__toolyaMock.writes.length}))).toEqual(before);
   expect(await page.evaluate(()=>toolyaCloudReady)).toBe(false);
   await page.evaluate(async()=>{localStorage.removeItem('kassenbon_data');await toolyaCloudBoot('haushaltsbuch-kassenbon');});
   await expect.poll(()=>page.evaluate(()=>toolyaCloudReady)).toBe(true);
  }
 });
}

test('i18n runtime catalogue: budget backup download acknowledgement cancellation in DE and EN',async({page},testInfo)=>{
 const de='Bitte bestätigen, dass die Cloud-Sicherung tatsächlich heruntergeladen und sicher gespeichert wurde.';
 const en='Confirm that the cloud backup has been downloaded and stored safely.';
 testInfo.annotations.push({type:'toolya-runtime-message',description:JSON.stringify({file:'tools/budget/index.html',handler:'toolyaSafeCloudImport',kind:'confirm',line:585,de,en})});
 await isolated(page,true,false,{entries:[],budgets:{},goals:[]});
 await page.goto(origin+'/tools/budget/index.html?lang=de');
 await expect.poll(()=>page.evaluate(()=>typeof toolyaCloudReady!=='undefined'&&toolyaCloudReady&&!!toolyaCloudController?.ready)).toBe(true);
 const state=()=>page.evaluate(()=>({snapshot:toolyaCloudController.snapshot(),writes:window.__toolyaMock.writes}));
 const before=await state();
 for(const lang of ['de','en','de']){
  await page.locator('[data-tool-locale="'+lang+'"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang',lang);
  const dialogs=[];
  const onDialog=async dialog=>{dialogs.push({type:dialog.type(),message:dialog.message()});if(dialogs.length===1)await dialog.accept();else await dialog.dismiss();};
  page.on('dialog',onDialog);
  const downloaded=page.waitForEvent('download',{timeout:5000});
  try{
   const result=await page.evaluate(async()=>{try{await toolyaSafeCloudImport(toolyaCloudController.snapshot());return {rejected:false};}catch(e){return {rejected:true,message:e.message};}});
   const download=await downloaded;
   expect(download.suggestedFilename()).toBe('toolya-cloud-vor-import-haushaltsbuch.json');
   expect(await download.failure()).toBeNull();
   expect(result).toEqual({rejected:true,message:'Cloud-Sicherung nicht bestätigt. Import abgebrochen.'});
   expect(dialogs).toEqual([{type:'confirm',message:lang==='en'?'Import replaces existing cloud data. Download a backup first?':'Import ersetzt vorhandene Cloud-Daten. Zuerst eine Sicherung herunterladen?'},{type:'confirm',message:lang==='en'?en:de}]);
   expect(await state()).toEqual(before);
  }finally{page.off('dialog',onDialog);}
 }
});

for(const change of ['revision','sessionGeneration']){
 test('i18n runtime: budget cloud replacement rejects changed '+change+' after backup',async({page})=>{
  await isolated(page,true,false,{entries:[],budgets:{},goals:[]});
  await page.goto(origin+'/tools/budget/index.html?lang=de');
  await expect.poll(()=>page.evaluate(()=>typeof toolyaCloudReady!=='undefined'&&toolyaCloudReady&&!!toolyaCloudController?.ready)).toBe(true);
  for(const lang of ['de','en','de']){
   await page.locator('[data-tool-locale="'+lang+'"]').click();
   await expect(page.locator('html')).toHaveAttribute('lang',lang);
   const result=await page.evaluate(async change=>{
    const {confirmCloudReplacement}=await import('/shared/toolya/cloud-backup.mjs');
    const {validateBudgetSnapshot}=await import('/shared/toolya/cloud-controller.mjs');
    const original=toolyaCloudController.snapshot(),before=JSON.stringify(original);
    const controller={ready:true,revision:1,sessionGeneration:1,snapshot:()=>structuredClone(original),replace:async()=>{throw Error('Unexpected replacement');}};
    const messages=[];let backupCount=0;
    try{
     await confirmCloudReplacement({controller,incoming:original,validate:validateBudgetSnapshot,confirm:async message=>{messages.push(message);return true;},exportBackup:async previous=>{if(JSON.stringify(previous)!==before)throw Error('Incorrect backup');backupCount++;controller[change]++;return true;}});
     return {rejected:false};
    }catch(error){return {rejected:true,message:error.message,messages,backupCount,unchanged:JSON.stringify(toolyaCloudController.snapshot())===before,writes:window.__toolyaMock.writes.length};}
   },change);
   expect(result).toEqual({rejected:true,message:'Cloud-Sitzung oder Datenstand hat sich geändert.',messages:['Import ersetzt vorhandene Cloud-Daten. Zuerst eine Sicherung herunterladen?','Sicherung kontrolliert? Vorhandene Cloud-Daten jetzt wirklich ersetzen?'],backupCount:1,unchanged:true,writes:0});
  }
 });
}

for(const fixture of [
 {handler:'openQRModal',line:1827,de:'Der QR-Code konnte nicht geladen werden. Bitte versuche es erneut.',en:'The QR code could not be loaded. Try again.',qr:true,id:94},
 {handler:'openGoogleCalendar',line:1866,de:'Für diesen Beleg fehlt ein gültiges Kaufdatum oder eine Garantiedauer.',en:'This receipt lacks a valid purchase date or warranty duration.',id:94},
 {handler:'downloadICS',line:1899,de:'Für diesen Beleg fehlt ein gültiges Kaufdatum oder eine Garantiedauer.',en:'This receipt lacks a valid purchase date or warranty duration.',id:94},
 {handler:'exportAllBookingsCSV',line:1974,de:'Keine Buchungen für den CSV-Export vorhanden.',en:'No transactions available for CSV export.'},
 {handler:'exportSteuerCSV',line:2003,de:'Keine steuerrelevanten Buchungen gefunden!',en:'No tax-relevant transactions found.',id:94}
]){
 test('i18n runtime catalogue: budget '+fixture.handler+' rejects unavailable export in DE and EN',async({page},testInfo)=>{
  testInfo.annotations.push({type:'toolya-runtime-message',description:JSON.stringify({file:'tools/budget/index.html',handler:fixture.handler,kind:'alert',line:fixture.line,de:fixture.de,en:fixture.en})});
  await isolated(page,true,false,{entries:fixture.id?[{id:94,title:'Privater Beleg Öl',date:'2026-01-01',price:12,category:'Lebensmittel',warrantyMonths:0,photos:[]}]:[],budgets:{},goals:[]});
  if(fixture.qr)await page.route('**/shared/toolya/qr-generator.mjs',route=>route.fulfill({contentType:'text/javascript',body:'export async function loadQrGenerator(){return null;}'}));
  await page.goto(origin+'/tools/budget/index.html?lang=de');
  await expect.poll(()=>page.evaluate(()=>typeof toolyaCloudReady!=='undefined'&&toolyaCloudReady&&!!toolyaCloudController?.ready)).toBe(true);
  const state=()=>page.evaluate(()=>({snapshot:toolyaCloudController.snapshot(),writes:window.__toolyaMock.writes}));
  const before=await state();
  const exports=[];page.on('download',()=>exports.push('download'));page.on('popup',()=>exports.push('popup'));
  for(const lang of ['de','en','de']){
   await page.locator('[data-tool-locale="'+lang+'"]').click();
   await expect(page.locator('html')).toHaveAttribute('lang',lang);
   await page.evaluate(({handler,id})=>window[handler](id),fixture);
   const notice=page.getByRole('alertdialog',{name:'Toolya'});
   await expect(notice.locator('#hl-alert-message')).toHaveText(fixture[lang]);
   await notice.getByRole('button',{name:'OK'}).press('Enter');
   await expect(notice).toBeHidden();
   expect(await state()).toEqual(before);
   expect(exports).toEqual([]);
  }
 });
}
