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
 await expect(page.getByText('Kiste 3')).toBeVisible();
 await expect(page.getByText('Küche')).toBeVisible();
 await expect(page.getByText('Geplant')).toBeVisible();
 expect(await page.locator('body').innerText()).not.toContain('Private Inventarinhalte: Goldschmuck');
 await page.getByRole('button',{name:'Nächster Status'}).click();
 await expect(page.getByText('Gepackt')).toBeVisible();
 expect(writes).toBe(1);
 await page.getByRole('button',{name:/Aktualisieren/}).click();
 await expect(page.getByText('Gepackt')).toBeVisible();
});
test('helper without a token exposes no private data and makes no requests',async({page})=>{
 let requests=0;
 await page.route('**/functions/v1/moving-helper',r=>{requests++;r.abort();});
 await page.goto(origin+'/tools/moving/helper/index.html');
 await expect(page.getByText('Kein Helferlink vorhanden')).toBeVisible();
 expect(requests).toBe(0);
});
