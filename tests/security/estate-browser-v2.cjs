const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
const {Client}=require('pg');
const {transform}=require('esbuild');
const C=require('../../assets/estate-crypto.js');
const url=process.env.ESTATE_TEST_DATABASE_URL;
if(!url||!['127.0.0.1','localhost'].includes(new URL(url).hostname))throw Error('Loopback isolated database required');
const root=path.resolve(__dirname,'../..');
(async()=>{
 const pg=new Client({connectionString:url});await pg.connect();
 await pg.query('alter table vault_cloud_snapshots add column if not exists encrypted_config jsonb, add column if not exists recovery_key jsonb, add column if not exists updated_at timestamptz default now()');
 const owner=crypto.randomUUID(),session=crypto.randomUUID(),password='Abcd1!',email='synthetic@example.invalid';
 await pg.query('insert into auth.users values($1)',[owner]);await pg.query('insert into auth.sessions values($1,$2)',[session,owner]);
 const user={id:owner,email,email_confirmed_at:new Date().toISOString(),aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{}};
 const jwt=()=>['eyJhbGciOiJIUzI1NiJ9',Buffer.from(JSON.stringify({sub:owner,session_id:session,exp:Math.floor(Date.now()/1000)+3600,amr:[{method:'password',timestamp:Math.floor(Date.now()/1000)}]})).toString('base64url'),'synthetic-signature'].join('.');
 global.__estateAdmin={rpc:async(name,params)=>{try{return {data:(await pg.query('select public.estate_release_v2($1,$2,$3) as r',[params.p_action,params.p_owner,params.p_data])).rows[0].r,error:null};}catch(error){return {data:null,error};}},auth:{getUser:async(token)=>({data:{user:token===jwt()||token?.endsWith('.synthetic-signature')?user:null},error:null}),admin:{getUserById:async(id)=>({data:{user:id===owner?user:null},error:null})}}};
 const mails=[];const originalFetch=global.fetch;global.fetch=async(url,options)=>{if(String(url)==='https://api.brevo.com/v3/smtp/email'){mails.push(JSON.parse(options.body));return new Response('{"messageId":"<synthetic-mail>"}',{status:201});}throw Error('Unexpected network '+url);};
 let mailConfigured=true;
 global.Deno={env:{get:name=>({SUPABASE_URL:'https://synthetic.invalid',SUPABASE_SERVICE_ROLE_KEY:'isolated',BREVO_API_KEY:mailConfigured?'synthetic':undefined,ESTATE_MAIL_FROM:'synthetic@example.invalid'})[name]},serve:()=>{}};
 const edge=fs.readFileSync('supabase/functions/estate-emergency/index.ts','utf8').replace("import { createClient } from 'npm:@supabase/supabase-js@2.57.0';","const createClient=()=>globalThis.__estateAdmin;");
 const compiled=await transform(edge,{loader:'ts',format:'esm',target:'es2022'});const tempfile='/tmp/estate-handler-'+crypto.randomUUID()+'.mjs';fs.writeFileSync(tempfile,compiled.code);const {handler}=await import(pathToFileURL(tempfile));
 const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://local').pathname;const file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'application/javascript');res.end(data);});});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.ESTATE_CHROMIUM||undefined,args:['--no-sandbox']});
 const context=await browser.newContext();const errors=[];
 context.on('page',p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!m.text().includes('status of 4'))errors.push(m.text());});});
 await context.addInitScript(()=>{window.print=()=>{document.body.dataset.printReady='true';};});
 await context.route('https://yheogmeaosuigyaxkwth.supabase.co/**',async route=>{
  const req=route.request(),u=new URL(req.url()),method=req.method(),body=req.postDataJSON();
  const fulfill=async(status,obj)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(obj)});
  if(u.pathname.startsWith('/auth/v1/')){
   if(u.pathname.endsWith('/token')){if(body.password!==password)return fulfill(400,{error:'wrong'});return fulfill(200,{access_token:jwt(),refresh_token:'synthetic-refresh',expires_in:3600,token_type:'bearer',user});}
   if(u.pathname.endsWith('/user'))return fulfill(200,user);
   if(u.pathname.endsWith('/logout'))return fulfill(204,null);
   throw Error('Unexpected auth '+u.pathname);
  }
  if(u.pathname.includes('/functions/v1/estate-emergency')){
   // Browser origin checks remain production-exact in the actual handler.
   const headers={...req.headers(),origin:'https://toolya.app'};
   const response=await handler(new Request(req.url(),{method,headers,body:JSON.stringify(body)}));return route.fulfill({status:response.status,headers:{...Object.fromEntries(response.headers),'access-control-allow-origin':origin},body:await response.text()});
  }
  if(u.pathname==='/rest/v1/vault_cloud_snapshots'){
   if(method==='GET')return fulfill(200,(await pg.query('select * from vault_cloud_snapshots where owner_user_id=$1',[owner])).rows);
   if(method==='POST'){const data=Array.isArray(body)?body[0]:body;return fulfill(201,(await pg.query('insert into vault_cloud_snapshots(owner_user_id,vault_id,encrypted_data,encrypted_config,recovery_key,updated_at) values($1,$2,$3,$4,$5,$6) returning updated_at',[owner,data.vault_id,data.encrypted_data,data.encrypted_config,data.recovery_key,data.updated_at])).rows);}
   if(method==='PATCH')return fulfill(200,(await pg.query('update vault_cloud_snapshots set encrypted_data=$1,encrypted_config=$2,recovery_key=$3,updated_at=$4 where owner_user_id=$5 and updated_at=$6 returning updated_at',[body.encrypted_data,body.encrypted_config,body.recovery_key,body.updated_at,owner,u.searchParams.get('updated_at')?.replace(/^eq\./,'')])).rows);
  }
  throw Error('Unexpected request '+u.pathname);
 });
 try{
  const legacyKey=C.random(),preparationKey=C.random();const legacy={vaultId:'v_browser_'+C.random().slice(0,16),ownerEmail:email,ownerName:'Synthetic owner',masterKeyHex:legacyKey,alarmPersons:[{id:'p_'+C.random().slice(0,32),name:'Existing person',contact:'existing@example.invalid'}],trustees:[],checkInIntervalDays:30,lastCheckIn:new Date().toISOString()};
  legacy.encryptedData=await C.encrypt({entries:[{id:1,title:'Existing document',content:'Original content',category:'Digital'}],trusteeKeys:{[legacy.alarmPersons[0].id]:preparationKey}},legacyKey);
  const page=await context.newPage();await page.goto(origin+'/tools/estate/index.html');await page.evaluate(record=>localStorage.setItem('digital_estate_vault',JSON.stringify(record)),legacy);await page.reload();
  await page.locator('#email').fill(email);await page.locator('#password').fill(password);await page.locator('#login-form button[type=submit]').click();await page.locator('#confirm-dialog[open]').waitFor();await page.locator('#confirm-dialog button[value=ok]').click();
  await page.waitForFunction(()=>document.getElementById('message').textContent.includes('geöffnet und online gesichert'));assert.equal(await page.locator('#entries h3').textContent(),'Existing document');
  const stored=JSON.parse(await page.evaluate(()=>localStorage.getItem('digital_estate_vault')));assert(!JSON.stringify(stored).includes(legacyKey));assert(!JSON.stringify(stored).includes(preparationKey));assert.equal(stored.version,2);
  await page.locator('[data-tab=people]').click();await page.locator('#person-name').fill('Second person');await page.locator('#person-email').fill('second@example.invalid');await page.locator('#save-person').click();await page.waitForFunction(()=>document.getElementById('message').textContent.includes('Vertrauensperson gespeichert'));
  const current=JSON.parse(await page.evaluate(()=>localStorage.getItem('digital_estate_vault'))),ownerPayload=await C.decrypt(current.encryptedData,legacyKey),cfg=await C.decrypt(current.encryptedConfig,legacyKey);assert.equal(ownerPayload.trusteeKeys[legacy.alarmPersons[0].id],preparationKey);const second=ownerPayload.trusteeKeys[cfg.alarmPersons[1].id];
  // Capture actual generated handoff URLs without navigating to mail or WhatsApp.
  await page.evaluate(()=>{window.__links=[];HTMLAnchorElement.prototype.click=function(){window.__links.push(this.href);};});
  await page.locator('.person').first().getByRole('button',{name:'✉ Schlüssel per E-Mail'}).click();await page.waitForFunction(()=>window.__links.length===1);let link=await page.evaluate(()=>window.__links[0]);assert(link.startsWith('mailto:existing%40example.invalid'));assert(decodeURIComponent(link).includes(preparationKey));assert(!link.includes(second));
  await page.locator('.person').nth(1).getByRole('button',{name:'Schlüssel per WhatsApp'}).click();await page.waitForFunction(()=>window.__links.length===2);link=await page.evaluate(()=>window.__links[1]);assert(decodeURIComponent(link).includes(second));assert(!link.includes(preparationKey));
  const popupPromise=context.waitForEvent('page');await page.locator('#print-selected').click();const popup=await popupPromise;await popup.waitForFunction(()=>document.body.dataset.printReady==='true');assert.equal(await popup.locator('.page').count(),2);assert.equal(await popup.locator('.page').nth(0).locator('code').count(),1);assert.equal((await popup.locator('code').nth(0).textContent()).replace(/\s/g,''),preparationKey);assert.equal((await popup.locator('code').nth(1).textContent()).replace(/\s/g,''),second);assert((await popup.locator('img').first().getAttribute('src')).startsWith('data:image/png'));await popup.pdf({path:'/tmp/estate-keys-isolated.pdf',preferCSSPageSize:true});await popup.close();
  // Real browser -> actual Edge handler -> PostgreSQL gate -> browser AES-GCM.
  const trustee=await context.newPage();await trustee.goto(origin+'/tools/estate/heirs.html');await trustee.locator('#first-key').fill(preparationKey);await trustee.locator('#open-form button').click();await trustee.waitForFunction(()=>document.getElementById('message').textContent.includes('zweiten Vertrauensperson'));
  await trustee.locator('#second-key').fill(preparationKey);await trustee.locator('#open-form button').click();await trustee.waitForFunction(()=>document.getElementById('message').textContent.includes('passen nicht'));
  await trustee.locator('#second-key').fill(second);await trustee.locator('#open-form button').click();await trustee.locator('#read-panel').waitFor({state:'visible'});assert((await trustee.locator('#read-entries').textContent()).includes('Original content'));assert.equal(await trustee.locator('#read-entries button').count(),0);await trustee.locator('#close-vault').click();
  await trustee.locator('#first-key').fill(preparationKey);await trustee.locator('#alarm-button').click();await trustee.locator('#alarm-confirm[open]').waitFor();await trustee.locator('#alarm-confirm button[value=ok]').click();await trustee.waitForFunction(()=>document.getElementById('message').textContent.includes('Frist läuft'));assert.equal(mails.length,1);assert.equal(mails[0].to[0].email,email);assert(!JSON.stringify(mails).includes(preparationKey));
  const worker=()=>handler(new Request('https://synthetic.invalid',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"action":"worker"}'}));
  await worker();assert.equal(mails.length,2);assert.equal(mails[1].to[0].email,'existing@example.invalid');assert(mails[1].subject.includes('gestartet'));
  await trustee.locator('#countdown').waitFor({state:'visible'});assert((await trustee.locator('#countdown').textContent()).includes('Verbleibende Zeit'));
  await trustee.locator('#open-form button').click();await trustee.waitForFunction(()=>document.getElementById('message').textContent.includes('zweiten Vertrauensperson'));
  await pg.query("update estate_private.read_vaults set alarm_deadline=now()-interval '1 second' where owner_id=$1",[owner]);await trustee.locator('#open-form button').click();await trustee.locator('#read-panel').waitFor({state:'visible'});await trustee.locator('#close-vault').click();
  await page.locator('[data-tab=alarm]').click();await page.locator('#check-in').click();await page.locator('#confirm-password').fill(password);await page.locator('#confirm-dialog button[value=ok]').click();await page.waitForFunction(()=>document.getElementById('message').textContent.includes('Lebenszeichen ist angekommen'));
  await worker();assert.equal(mails.length,3);assert.equal(mails[2].to[0].email,'existing@example.invalid');assert(mails[2].subject.includes('Entwarnung'));
  await trustee.locator('#first-key').fill(preparationKey);await trustee.locator('#status-button').click();await trustee.waitForFunction(()=>document.getElementById('message').textContent.includes('Kein aktiver Notfallalarm'));assert.equal(await trustee.locator('#countdown').isHidden(),true);await trustee.locator('#open-form button').click();await trustee.waitForFunction(()=>document.getElementById('message').textContent.includes('zweiten Vertrauensperson'));
  await page.locator('[data-tab=documents]').click();await page.locator('#entries').getByRole('button',{name:'Bearbeiten'}).click();await page.locator('#entry-content').fill('Updated synthetic content');await page.locator('#entry-form').getByRole('button',{name:'Eintrag speichern',exact:true}).click();await page.waitForFunction(()=>document.getElementById('message').textContent==='Eintrag gespeichert.');
  await page.locator('#lock').click();assert.equal(await page.locator('#owner-app').isHidden(),true);assert.equal(await page.locator('#entries').textContent(),'');await page.locator('#password').fill(password);await page.locator('#login-form button[type=submit]').click();await page.waitForFunction(()=>document.getElementById('message').textContent.includes('geöffnet und online gesichert'));assert((await page.locator('#entries').textContent()).includes('Updated synthetic content'));
  for(const width of [320,375,768,1280]){await page.setViewportSize({width,height:900});for(const name of ['documents','people','alarm','settings']){await page.locator('[data-tab='+name+']').click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'overflow '+name+' '+width+' '+JSON.stringify(await page.evaluate(()=>Array.from(document.querySelectorAll('body *')).filter(e=>e.getBoundingClientRect().right>innerWidth+1).slice(0,8).map(e=>({tag:e.tagName,id:e.id,class:e.className,right:e.getBoundingClientRect().right})))));}await trustee.setViewportSize({width,height:900});assert(await trustee.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
  await page.setViewportSize({width:1280,height:950});await page.locator('[data-tab=people]').click();await page.screenshot({path:'/tmp/estate-owner-isolated.png',fullPage:true});await trustee.screenshot({path:'/tmp/estate-trustee-isolated.png',fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('PASS: Chromium actual owner/trustee UI, legacy data/key preservation, password-protected local storage, local QR, per-person mail/WhatsApp, A4 print, two-key open, one-key refusal, alarm mail, 24h gate, authenticated cancellation, edit persistence, lock, 320/375/768/1280px');
 }catch(error){for(const p of context.pages()){try{console.error('BROWSER DIAGNOSTIC',p.url(),await p.locator('body').innerText({timeout:2000}));await p.screenshot({path:'/tmp/estate-failure-'+context.pages().indexOf(p)+'.png',fullPage:true});}catch{}}console.error('BROWSER ERRORS',errors);throw error;}finally{global.fetch=originalFetch;await browser.close();server.close();await pg.end();fs.unlinkSync(tempfile);}
})().catch(e=>{console.error(e);process.exitCode=1;});
