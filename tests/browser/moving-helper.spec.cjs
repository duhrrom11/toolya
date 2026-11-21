const {test,expect}=require('playwright/test');
const origin='http://127.0.0.1:4173';
const token='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef0123456789-';
test('temporary helper sees only minimal projection and persists sequential status',async({page})=>{
 let version=0,status='planned',writes=0;
 await page.route('**/*',async route=>{
  const url=route.request().url();
  if(url.includes('/functions/v1/moving-helper')){
   const req=JSON.parse(route.request().postData()||'{}');
   expect(req.token).toBe(token);
   if(req.action==='view')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({projectName:'Umzug',helperLabel:'Team',boxes:[{assignmentId:'00000000-0000-4000-8000-000000000021',label:'Kiste 3',room:'Küche',status,version,priority:'first_day'}]})});
   if(req.action==='transition'){
    expect(req.expectedVersion).toBe(version);
    expect(req.status).toBe('packed');
    expect(req.requestId).toMatch(/^[0-9a-f-]{36}$/i);
    version++;status='packed';writes++;
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({assignmentId:req.assignmentId,status,version})});
   }
   throw Error('Unexpected action '+req.action);
  }
  if(url.startsWith(origin+'/'))return route.continue();
  return route.abort();
 });
 await page.goto(origin+'/tools/moving/helper/index.html#t='+token);
 await expect(page.locator('.box strong')).toBeVisible();
 await expect(page.locator('.box small').first()).toBeVisible();
 await expect(page.getByText('Geplant')).toBeVisible();
 expect(await page.locator('body').innerText()).not.toContain('Private Inventarinhalte: Goldschmuck');
 await page.getByRole('button',{name:'Nächster Status'}).click();
 await expect(page.getByText('Gepackt',{exact:true})).toBeVisible();
 expect(writes).toBe(1);
 await page.getByRole('button',{name:/Aktualisieren/}).click();
 await expect(page.getByText('Gepackt',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'English',exact:true}).click();
 await expect(page.locator('html')).toHaveAttribute('lang','en');
 await expect(page.getByRole('heading',{name:'Moving helper'})).toBeVisible();
 await expect(page.getByText('Packed',{exact:true})).toBeVisible();
 await expect(page.locator('.box strong')).toHaveText('Kiste 3');
 await expect(page.locator('.box small').first()).toContainText('Küche');
 expect(new URL(page.url()).hash).toBe('#t='+token);
 expect(writes).toBe(1);
 await page.getByRole('button',{name:'Deutsch',exact:true}).click();
 await expect(page.locator('html')).toHaveAttribute('lang','de');
 await expect(page.getByText('Gepackt',{exact:true})).toBeVisible();
 expect(writes).toBe(1);
});
test('helper without a token exposes no private data and makes no requests',async({page})=>{
 let requests=0;
 await page.route('**/functions/v1/moving-helper',r=>{requests++;r.abort();});
 await page.goto(origin+'/tools/moving/helper/index.html');
 await expect(page.getByText('Kein Helferlink vorhanden')).toBeVisible();
 expect(requests).toBe(0);
});

test('helper reports missing box without viewing private incident notes',async({page})=>{
 let reports=0;
 const assignmentId='00000000-0000-4000-8000-000000000021';
 await page.route('**/*',async route=>{
  const url=route.request().url();
  if(url.includes('/functions/v1/moving-helper')){
   const request=JSON.parse(route.request().postData()||'{}');
   expect(request.token).toBe(token);
   if(request.action==='view')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
    projectName:'Umzug',helperLabel:'Team',
    boxes:[{assignmentId,label:'Kiste 3',room:'Küche',status:'packed',version:1,priority:'normal'}],
    incidents:reports?[{id:'00000000-0000-4000-8000-000000000099',assignmentId,kind:'missing',resolved:false}]:[]
   })});
   if(request.action==='report-incident'){
    expect(request.assignmentId).toBe(assignmentId);
    expect(request.kind).toBe('missing');
    expect(request.note).toBe('Letzte Suche im Flur');
    expect(request.requestId).toMatch(/^[0-9a-f-]{36}$/i);
    reports++;
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({incidentId:'00000000-0000-4000-8000-000000000099'})});
   }
   throw Error('Unexpected action '+request.action);
  }
  if(url.startsWith(origin+'/'))return route.continue();
  return route.abort();
 });
 page.on('dialog',dialog=>dialog.accept('Letzte Suche im Flur'));
 await page.goto(origin+'/tools/moving/helper/index.html#t='+token);
 await expect(page.getByRole('button',{name:'Fehlend melden'})).toBeVisible();
 await page.getByRole('button',{name:'Fehlend melden'}).click();
 await expect(page.getByText('Vorfall gemeldet. Der Besitzer kann ihn bearbeiten.')).toBeVisible();
 await expect(page.getByText('Gemeldet: Fehlend')).toBeVisible();
 expect(reports).toBe(1);
 expect(await page.locator('body').innerText()).not.toContain('Letzte Suche im Flur');
});
