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
      if(new URL(url).pathname==='/assets/vendor/supabase-2.57.0.js'){
        return route.fulfill({status:200,contentType:'text/javascript',body:`
          window.__toolyaMock={writes:[],signedIn:${authenticated},fixture:${JSON.stringify(initialSnapshot)}};
          window.supabase={createClient(){
            const m=window.__toolyaMock;
            return {
              auth:{
                async getUser(){return {data:{user:m.signedIn?{id:'ui-fixture-user',email:'mock@example.invalid',is_anonymous:false}:null},error:null}},
                async getSession(){return {data:{session:null},error:null}},
                onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}},
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
  if(url.startsWith(origin)&&!url.endsWith('/assets/vendor/supabase-2.57.0.js'))return route.continue();
  if(url.includes('supabase.min.js')||url.endsWith('/assets/vendor/supabase-2.57.0.js'))return route.fulfill({status:200,contentType:'text/javascript',body:`
   window.__wishlistMock={user:${authenticated?"{id:'owner',email:'owner@example.invalid',is_anonymous:false}":"null"},writes:[],reads:0,searchError:false,detailError:${detailError},empty:false};
   window.supabase={createClient(){const m=window.__wishlistMock;return {
    auth:{
     async getUser(){m.reads++;return {data:{user:m.user},error:null}},
     onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}},
     async signOut(){m.user=null;return {error:null}}
    },
    rpc(name){if(name==='search_wishlist_directory'&&m.searchError)return Promise.resolve({data:null,error:{message:'Isolated unavailable'}});if(name==='search_wishlist_directory'&&m.empty)return Promise.resolve({data:[],error:null});return Promise.resolve({data:['search_wishlist_profiles','search_wishlist_directory'].includes(name)?${JSON.stringify(profiles)}:(name==='wishlist_directory_filters'?{countries:[],occasions:[],interests:[]}:[]),error:null})},
    from(table){return {
     select(){return this},eq(){return this},order(){return this},limit(){return Promise.resolve({data:table==='wishlist_directory'?${JSON.stringify(profiles)}:[],error:null})},
     async maybeSingle(){if(table==='wishlist_directory'&&m.detailError)return {data:null,error:{message:'Synthetic detail outage'}};return {data:table==='wishlist_directory'?${JSON.stringify(profiles[0]||null)}:null,error:null}},
     upsert(payload){m.writes.push({table,payload});return {select(){return this},async single(){return {data:{user_id:'owner'},error:null}}}},
     insert(payload){m.writes.push({table,payload});return {select(){return this},async single(){return {data:{id:'new-id'},error:null}}}}
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
 await expect(page.locator('#profileStatus')).toHaveText('');
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
 await page.goto(origin+'/tools/wishes/public.html');
 await expect(page.locator('#profileForm')).toBeVisible();
 await page.locator('#firstName').fill('Anna');
 await page.locator('#lastName').fill('Muster');
 await page.locator('#country').fill('Deutschland');
 await page.locator('#listFields [name=name]').fill('Meine Wünsche');
 await page.locator('#amazonUrl').fill('https://www.amazon.de/hz/wishlist/ls/ABC123');
 await page.evaluate(()=>{window.__wishlistMock.user={id:'other',email:'other@example.invalid'}});
 await page.locator('#saveProfile').click();
 await expect(page.locator('#profileStatus')).toContainText('Konto gewechselt');
 expect(await page.evaluate(()=>window.__wishlistMock.writes.length)).toBe(0);
});
test('wishlist: verified profile write uses cloud and no localStorage',async({page})=>{
 await isolatedWishlist(page,true);
 await page.goto(origin+'/tools/wishes/public.html');
 await expect(page.locator('#profileForm')).toBeVisible();
 await page.locator('#firstName').fill('Anna');
 await page.locator('#lastName').fill('Muster');
 await page.locator('#country').fill('Deutschland');
 await page.locator('#listFields [name=name]').fill('Meine Wünsche');
 await page.locator('#amazonUrl').fill('https://www.amazon.de/hz/wishlist/ls/ABC123');
 await page.locator('#saveProfile').click();
 await expect(page.locator('#profileStatus')).toContainText('Gespeichert');
 const result=await page.evaluate(()=>({writes:window.__wishlistMock.writes,keys:Object.keys(localStorage)}));
 expect(result.writes).toHaveLength(1);
 expect(result.writes[0].table).toBe('wishlist_public_profiles');
 expect(result.keys).toEqual([]);
});


test('wishlist: public preview, five named lists and affiliate attribution',async({page})=>{
 await isolatedWishlist(page,true);
 await page.goto(origin+'/tools/wishes/public.html');
 await expect(page.locator('#profileForm')).toBeVisible();
 await expect(page.locator('#profile .public-notice')).toContainText('Alle Angaben sind öffentlich sichtbar');
 await page.locator('#firstName').fill('Anna');
 await page.locator('#lastName').fill('Muster');
 await page.locator('#country').fill('Schweiz');
 await page.locator('#listFields [name=name]').fill('Meine Wünsche');
 await page.locator('#amazonUrl').fill('https://www.amazon.de/hz/wishlist/ls/ABC123?tag=other-21');
 await page.locator('#previewProfile').click();
 await expect(page.locator('#previewDialog')).toBeVisible();
 await expect(page.locator('#previewContent a')).toHaveAttribute('href','https://www.amazon.de/hz/wishlist/ls/ABC123?tag=duhrrom-21');
 expect(await page.evaluate(()=>window.__wishlistMock.writes.length)).toBe(0);
 await page.locator('#closePreview').click();
 for(let n=0;n<4;n++)await page.locator('#addList').click();
 await expect(page.locator('#listFields fieldset')).toHaveCount(5);
 await expect(page.locator('#addList')).toBeDisabled();
});


async function isolatedEstate(page,authenticated){
 await page.route('**/*',async route=>{
  const url=route.request().url();
  if(url.startsWith(origin)){
   if(new URL(url).pathname==='/assets/vendor/supabase-2.57.0.js')
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
    expect(await page.locator('main.b3-backform-main').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length)).toBe(width<1280?1:3);
    if(width===1440)expect(await page.locator('.b3-baking-calculator-column').evaluate(e=>e.getBoundingClientRect().width)).toBeGreaterThan(750);
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

test('wishlist: removing and adding lists keeps numbers and the first URL unique',async({page})=>{
 await isolatedWishlist(page,true);await page.goto(origin+'/tools/wishes/public.html');
 await expect(page.locator('#profileForm')).toBeVisible();
 for(let n=0;n<4;n++)await page.locator('#addList').click();
 await expect(page.locator('#listFields fieldset').last().locator('[name=name]')).toBeFocused();
 await page.locator('#listFields fieldset').nth(1).getByRole('button',{name:'Diese Liste entfernen',exact:true}).click();
 await expect(page.locator('#listFields fieldset').nth(1).locator('[name=name]')).toBeFocused();
 await page.locator('#addList').click();
 await expect(page.locator('#listFields legend')).toHaveText(['Wunschliste 1','Wunschliste 2','Wunschliste 3','Wunschliste 4','Wunschliste 5']);
 await page.locator('#listFields fieldset').first().getByRole('button',{name:'Diese Liste entfernen',exact:true}).click();
 await expect(page.locator('#amazonUrl')).toHaveCount(1);
 await expect(page.locator('#listFields fieldset').first().locator('[name=url]')).toHaveAttribute('id','amazonUrl');
 for(let n=0;n<3;n++)await page.locator('#listFields fieldset').last().getByRole('button',{name:'Diese Liste entfernen',exact:true}).click();
 await page.locator('#listFields fieldset').first().getByRole('button',{name:'Diese Liste entfernen',exact:true}).click();
 await expect(page.locator('#listFields fieldset')).toHaveCount(1);
 await expect(page.locator('#profileStatus')).toContainText('mindestens eine');
 expect(await page.evaluate(()=>window.__wishlistMock.writes.length)).toBe(0);
});
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

test('wishlist: public cards and five-list form remain usable at three widths',async({page},testInfo)=>{
 const profile={user_id:'11111111-1111-4111-8111-111111111111',display_name:'Isoliertes Wunschprofil mit langem Anzeigenamen',country:'Schweiz',city:'Isolierter Ort',bio:'Synthetische Prüfansicht für Bücher, Garten und gemeinsame Geschenkideen.',interests:['Bücher','Garten'],lists:[{name:'Geburtstagswünsche',url:'https://www.amazon.de/hz/wishlist/ls/ABC123',occasion:'Geburtstag'}]};
 await isolatedWishlist(page,true,[profile]);await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto(origin+'/tools/wishes/public.html');
 await expect(page.locator('#profileForm')).toBeVisible();await page.locator('#search').fill('Isoliertes');await expect(page.locator('#results .profile-card')).toHaveCount(1);
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
 await page.getByRole('radio',{name:'Organisation'}).check();
 await page.locator('#organizationName').fill(profile.display_name);await page.locator('#country').fill(profile.country);
 for(let i=0;i<4;i++)await page.locator('#addList').click();
 for(const [i,fs]of (await page.locator('#listFields fieldset').all()).entries()){
  await fs.locator('[name=name]').fill('Isolierte Wunschliste '+(i+1));await fs.locator('[name=url]').fill('https://www.amazon.de/hz/wishlist/ls/ABC'+i);
 }
 for(const width of [320,768,1440]){
  await page.setViewportSize({width,height:1000});
  if(width<=600)expect(await page.locator('#results .profile-identity').evaluate(e=>{
   const hero=e.closest('.profile-hero'),style=getComputedStyle(hero);
   return e.getBoundingClientRect().width>=hero.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)-1;
  })).toBe(true);
  for(const [name,selector]of [['card','#results'],['form','#profileForm'],['actions','#profileForm .actions']]){
   const panel=page.locator(selector);await panel.evaluate(e=>e.scrollIntoView({block:'start'}));
   expect(await panel.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
   await page.screenshot({path:testInfo.outputPath('wishlist-'+name+'-'+width+'.png')});await reviewImage(page,'wishlist-'+name+'-'+width);
  }
 }
 await page.locator('#previewProfile').press('Enter');
 await expect(page.getByRole('dialog',{name:'Profilvorschau',exact:true})).toBeVisible();
 await expect(page.locator('#closePreview')).toBeFocused();
 await expect(page.locator('#previewContent .list-links a')).toHaveCount(5);
 for(const a of await page.locator('#previewContent .list-links a').all())expect(new URL(await a.getAttribute('href')).searchParams.get('tag')).toBe('duhrrom-21');
 for(const width of [320,768,1440]){
  await page.setViewportSize({width,height:1000});const dialog=page.locator('#previewDialog');
  expect(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
  expect(await dialog.evaluate(e=>e.getBoundingClientRect().height<=innerHeight*.91)).toBe(true);
  await dialog.evaluate(e=>e.scrollTop=0);await page.screenshot({path:testInfo.outputPath('wishlist-preview-'+width+'.png')});
  await dialog.evaluate(e=>e.scrollTop=e.scrollHeight);await page.screenshot({path:testInfo.outputPath('wishlist-preview-bottom-'+width+'.png')});
 }
 await page.keyboard.press('Escape');
 await expect(page.locator('#previewDialog')).toBeHidden();
 await expect(page.locator('#previewProfile')).toBeFocused();
 await page.locator('#amazonUrl').fill('https://example.invalid/not-amazon');await page.locator('#previewProfile').click();
 await expect(page.locator('#profileStatus')).toContainText('gültige Amazon-Wunschlisten');await expect(page.locator('#previewDialog')).toBeHidden();
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
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }
 expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);expect(errors).toEqual([]);
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
 const profile={user_id:'22222222-2222-4222-8222-222222222222',display_name:'Isoliertes öffentliches Wunschprofil mit langem Namen',country:'Schweiz',city:'Prüfort',bio:'Nur synthetische Browseransicht.',interests:['Bücher'],lists:[{name:'Isolierte Bücherwünsche',url:'https://www.amazon.de/hz/wishlist/ls/ABC123'}]};
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

test('moving boxes guide prints the sample QR label without the instructions', async ({ page }) => {
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
  .matchAll(/<loc>https:\/\/toolya\.app(\/[^/]+\/)<\/loc>/g)].map(match => match[1]);

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
 await expect(notice.locator('#hl-alert-message')).toHaveText('Backup too large (maximum 20 MB).');
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
   expect(result.texts.join(' ')).toContain('Total inventory value');
   expect(result.texts.join(' ')).toContain('Lent to');
  }else{
   expect(result.files.at(-1)).toBe('kisten-inventar-report.pdf');
   expect(result.texts.join(' ')).toContain('Gesamtwert des Inventars');
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
  {id:201,locId:100,name:'User box',desc:'Original stored contents',tag:'Zerbrechlich',value:'12.50',subItems:[]},
  {id:202,locId:999,name:'Another box',desc:'Second contents',tag:'Custom tag',value:4.25,subItems:[]}
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
  expect(v.spy.texts.join(' ')).toContain('Custom tag');
  if(lang==='en'){
   expect(v.spy.files.at(-1)).toBe('moving-box-qr-labels.pdf');
   expect(v.spy.texts.join(' ')).toContain('Fragile');
   expect(v.spy.texts.join(' ')).toContain('Unknown');
  }else{
   expect(v.spy.files.at(-1)).toBe('kisten-qr-etiketten.pdf');
   expect(v.spy.texts.join(' ')).toContain('Zerbrechlich');
   expect(v.spy.texts.join(' ')).toContain('Unbekannt');
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
  await page.evaluate(()=>exportQrLabelsPDF());
  const dialog=page.getByRole('alertdialog',{name:'Toolya'});
  await expect(dialog.locator('#hl-alert-message')).toHaveText(message);
  await expect(dialog.getByRole('button',{name:'OK'})).toBeFocused();
  await dialog.getByRole('button',{name:'OK'}).click();
 }
 expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
});
