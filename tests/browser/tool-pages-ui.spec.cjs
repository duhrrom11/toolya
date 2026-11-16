// Real Toolya HTML UI in Chromium. No external network, real account or database.
const {test,expect}=require('playwright/test');
const origin='http://127.0.0.1:4173';
const tools=[
  {path:'/tools/car/index.html',title:'Autokosten-Rechner & Reifenwechsel',tool:'autokosten-reifenwechsel',form:'#carName'},
  {path:'/tools/budget/index.html',title:'Haushaltsbuch mit Kassenbon-Scanner',tool:'haushaltsbuch-kassenbon',form:'#receiptTitle'}
];
async function isolated(page,authenticated,displayCss=false){
  const outbound=[];
  page.on('pageerror',error=>console.log('[UI pageerror]',error.message));
  page.on('console',msg=>{if(msg.text().includes('[mock rpc]'))console.log('[browser]',msg.text());});
  await page.route('**/*',async route=>{
    const url=route.request().url();
    if(url.startsWith('http://127.0.0.1:4173/')){
      if(new URL(url).pathname==='/assets/vendor/supabase-2.57.0.js'){
        return route.fulfill({status:200,contentType:'text/javascript',body:`
          window.__toolyaMock={writes:[],signedIn:${authenticated}};
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
                if(table!=='user_data')throw Error('unexpected table '+table);
                return {select(){return this},eq(){return this},async maybeSingle(){return {data:null,error:null}}};
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
    await expect(page.locator('#toolya-cloud-gate')).toContainText('Cloud-Speicherung unbestätigt');
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
  await expect(page.locator('#toolya-cloud-gate')).toContainText('Cloud-Speicherung unbestätigt');
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
  await expect(page.locator('#toolya-cloud-gate')).toContainText('Cloud-Speicherung unbestätigt');
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
  await expect(page.locator('#toolya-cloud-gate')).toContainText('Cloud-Speicherung unbestätigt');
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
  await expect(page.locator('#toolya-cloud-gate')).toContainText('Cloud-Speicherung unbestätigt');
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
  await expect(page.locator('#toolya-cloud-gate')).toContainText('Cloud-Speicherung unbestätigt');
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
  await expect(page.locator('#toolya-cloud-gate')).toContainText('Cloud-Speicherung unbestätigt');
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
  await expect(page.locator('#toolya-cloud-gate')).toContainText('Cloud-Speicherung unbestätigt');
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


async function isolatedWishlist(page,authenticated){
 await page.route('**/*',async route=>{
  const url=route.request().url();
  if(url.startsWith(origin))return route.continue();
  if(url.includes('supabase.min.js'))return route.fulfill({status:200,contentType:'text/javascript',body:`
   window.__wishlistMock={user:${authenticated?"{id:'owner',email:'owner@example.invalid',is_anonymous:false}":"null"},writes:[],reads:0};
   window.supabase={createClient(){const m=window.__wishlistMock;return {
    auth:{
     async getUser(){m.reads++;return {data:{user:m.user},error:null}},
     onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}},
     async signOut(){m.user=null;return {error:null}}
    },
    rpc(){return Promise.resolve({data:[],error:null})},
    from(table){return {
     select(){return this},eq(){return this},order(){return this},limit(){return this},
     async maybeSingle(){return {data:null,error:null}},
     upsert(payload){m.writes.push({table,payload});return Promise.resolve({error:null})},
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
 await expect(page.locator('#profileStatus')).toContainText('Bitte zuerst anmelden');
 expect(await page.evaluate(()=>window.__wishlistMock.writes.length)).toBe(0);
});
test('wishlist: account switch blocks profile write before network mutation',async({page})=>{
 await isolatedWishlist(page,true);
 await page.goto(origin+'/tools/wishes/public.html');
 await expect(page.locator('#profileForm')).toBeVisible();
 await page.locator('#firstName').fill('Anna');
 await page.locator('#lastName').fill('Muster');
 await page.evaluate(()=>{window.__wishlistMock.user={id:'other',email:'other@example.invalid'}});
 await page.locator('#profileForm button').click();
 await expect(page.locator('#profileStatus')).toContainText('Konto gewechselt');
 expect(await page.evaluate(()=>window.__wishlistMock.writes.length)).toBe(0);
});
test('wishlist: verified profile write uses cloud and no localStorage',async({page})=>{
 await isolatedWishlist(page,true);
 await page.goto(origin+'/tools/wishes/public.html');
 await expect(page.locator('#profileForm')).toBeVisible();
 await page.locator('#firstName').fill('Anna');
 await page.locator('#lastName').fill('Muster');
 await page.locator('#profileForm button').click();
 await expect(page.locator('#profileStatus')).toContainText('Profil gespeichert');
 const result=await page.evaluate(()=>({writes:window.__wishlistMock.writes,keys:Object.keys(localStorage)}));
 expect(result.writes).toHaveLength(1);
 expect(result.writes[0].table).toBe('wishlist_profiles');
 expect(result.keys).toEqual([]);
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

for(const item of tools){
 test(item.tool+': shared controls on the real authenticated page at three widths',async({page},testInfo)=>{
  await isolated(page,true,true);
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
   await reviewImage(page,item.tool+'-page-'+width);
   await page.locator('#settingsBtn').click();
   await expect(page.locator('#settingsModal')).toBeVisible();
   await page.locator('#b3-edit-open').click();
   await expect(page.locator('#b3-editor')).toBeVisible();
   const save=page.locator('#b3-editor .b3-action:not(.b3-outline)').first();
   await expect(save).toHaveCSS('background-color','rgb(0, 126, 159)');
   expect(await contrast(save)).toBeGreaterThanOrEqual(4.5);
   await save.hover();await expect(save).toHaveCSS('transform','none');
   await expect(page.locator('#b3-editor button[disabled]').first()).toBeDisabled();
   await page.screenshot({path:testInfo.outputPath('b3-editor-'+item.tool+'-'+width+'.png'),fullPage:true});
   await reviewImage(page,item.tool+'-editor-'+width);
   await page.locator('#b3-editor').getByRole('button',{name:'Abbrechen',exact:true}).click();
   await expect(page.locator('#b3-editor')).toBeHidden();
  }
  expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
  // Existing account warning actions retain their red treatment.
  await page.locator('#settingsBtn').click();
  const logout=page.locator('#settingsModal button[onclick="logoutUser()"]');
  const colour=await logout.evaluate(e=>getComputedStyle(e).backgroundColor);
  const channels=colour.match(/[\d.]+/g).map(Number);expect(channels[0]).toBeGreaterThan(channels[1]);
 });
}
