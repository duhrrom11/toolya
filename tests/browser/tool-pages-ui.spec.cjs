// Real Toolya HTML UI in Chromium. No external network, real account or database.
const {test,expect}=require('playwright/test');
const origin='http://127.0.0.1:4173';
const tools=[
  {path:'/tools/car/index.html',title:'Autokosten-Rechner & Reifenwechsel',tool:'autokosten-reifenwechsel',form:'#carName'},
  {path:'/tools/budget/index.html',title:'Haushaltsbuch mit Kassenbon-Scanner',tool:'haushaltsbuch-kassenbon',form:'#receiptTitle'}
];
async function isolated(page,authenticated){
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
    await expect(page.locator('.b3-tool-title h1')).toContainText(item.title);
    await expect(page.locator('#toolya-cloud-gate')).toContainText('Registrierte Anmeldung erforderlich');
    await expect(page.locator(item.form)).toHaveCount(1);
    await expect(page.locator('#toolya-cloud-gate')).toBeVisible();
    expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
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
  await expect(page.locator('#toolya-cloud-gate')).toContainText('Registrierte Anmeldung erforderlich');
  expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
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
  await expect(page.locator('#toolya-cloud-gate')).toContainText('Registrierte Anmeldung erforderlich');
  expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
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
  await expect(page.locator('#toolya-cloud-gate')).toContainText('Registrierte Anmeldung erforderlich');
  expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
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
  await expect(page.locator('#toolya-cloud-gate')).toContainText('Registrierte Anmeldung erforderlich');
  expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
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
  await expect(page.locator('#toolya-cloud-gate')).toContainText('Registrierte Anmeldung erforderlich');
  expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
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
  await expect(page.locator('#toolya-cloud-gate')).toContainText('Registrierte Anmeldung erforderlich');
  expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
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
  await expect(page.locator('#toolya-cloud-gate')).toContainText('Registrierte Anmeldung erforderlich');
  expect(await page.evaluate(()=>window.__toolyaMock.writes.length)).toBe(0);
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
