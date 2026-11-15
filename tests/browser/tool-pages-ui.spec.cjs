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
