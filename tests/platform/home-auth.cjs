// Real vendored SDK and homepage; synthetic Auth responses only, all remote traffic intercepted.
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=process.cwd(),server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));if(!p.startsWith(root+'/'))return res.writeHead(403).end();try{res.setHeader('content-type',p.endsWith('.html')?'text/html':/\.m?js$/.test(p)?'text/javascript':p.endsWith('.css')?'text/css':'application/octet-stream');res.end(fs.readFileSync(p));}catch{res.writeHead(404).end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox']});
 try{
 const page=await browser.newPage(),origin='http://127.0.0.1:'+server.address().port;
 const user={id:'11111111-1111-4111-8111-111111111111',email:'synthetic@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{}};
 const b64=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
 const token=b64({alg:'HS256',typ:'JWT'})+'.'+b64({sub:user.id,exp:Math.floor(Date.now()/1000)+3600,aud:'authenticated',role:'authenticated'})+'.synthetic';
 let requests=0,refreshes=0;
 await page.route('**/*',r=>{
  const u=new URL(r.request().url());if(u.origin===origin)return r.continue();
  if(u.hostname!=='yheogmeaosuigyaxkwth.supabase.co')return r.abort();
  requests++;
  const reply=(body,status=200)=>r.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
  if(u.pathname==='/auth/v1/token'){if(u.searchParams.get('grant_type')==='refresh_token')refreshes++;return reply({access_token:token,refresh_token:'synthetic-refresh',expires_in:3600,token_type:'bearer',user});}
  if(u.pathname==='/auth/v1/user')return reply(user);
  if(u.pathname==='/auth/v1/logout')return reply({});
  if(u.pathname.startsWith('/rest/v1/')&&r.request().method()==='GET')return reply([]);
  if(u.pathname.startsWith('/rest/v1/'))return r.abort();
  throw Error('Unexpected synthetic auth request '+u.pathname);
 });
 await page.goto(origin);await page.waitForFunction(()=>window.supabaseClient);
 // An empty session must settle, not recursively emit SIGNED_OUT.
 await page.evaluate(()=>{window.__signedOutEvents=0;supabaseClient.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT')window.__signedOutEvents++})});
 await page.waitForTimeout(200);
 assert(await page.evaluate(()=>window.__signedOutEvents<3),'guest status must not create a SIGNED_OUT loop');
 await page.locator('#userInfo').click();await page.locator('#loginEmail').fill(user.email);await page.locator('#loginPassword').fill('synthetic-only-password');
 await page.locator('#loginSubmit').click();
 await page.waitForFunction(()=>document.querySelector('#settingsModal').classList.contains('hidden'),{},{timeout:5000});
 await page.waitForFunction(()=>document.querySelector('#userInfo').textContent==='Angemeldet',{},{timeout:5000});
 await page.reload();await page.waitForFunction(()=>document.querySelector('#userInfo').textContent==='Angemeldet',{},{timeout:5000});
 // One login must survive navigation through every legacy tool and back home.
 for(const tool of ['budget','moving','car','pet-health','meters','plants','parking','loans','baking','housemates']){
  await page.goto(origin+'/tools/'+tool+'/');
  await page.waitForFunction(email=>['userInfo','cloud-user-display','cloud-user-email','header-user-email'].some(id=>document.getElementById(id)?.textContent.includes(email)),user.email,{timeout:7000});
  await page.reload();
  await page.waitForFunction(email=>['userInfo','cloud-user-display','cloud-user-email','header-user-email'].some(id=>document.getElementById(id)?.textContent.includes(email)),user.email,{timeout:7000});
 }
 for(const tool of ['wishes','estate']){
  await page.goto(origin+'/tools/'+tool+'/');
  await page.waitForFunction(tool=>tool==='wishes'?document.querySelector('#wishlistAuthStatus')?.textContent.includes('Angemeldet'):document.querySelector('#account-label')?.textContent.includes('@'),tool,{timeout:7000});
 }
 await page.goto(origin);
 await page.waitForFunction(()=>document.querySelector('#userInfo').textContent==='Angemeldet',{},{timeout:5000});
 // Expired persisted sessions must refresh without losing the shared identity.
 await page.evaluate(()=>{const key='sb-yheogmeaosuigyaxkwth-auth-token';const session=JSON.parse(localStorage.getItem(key));session.expires_at=Math.floor(Date.now()/1000)-60;localStorage.setItem(key,JSON.stringify(session));});
 await page.reload();
 await page.waitForFunction(()=>document.querySelector('#userInfo').textContent==='Angemeldet',{},{timeout:5000});
 assert(refreshes>0,'expired persisted session must use the refresh endpoint');

 await page.evaluate(()=>{window.__signedOutEvents=0;supabaseClient.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT')window.__signedOutEvents++});window.__logoutDone=false;logoutUser().then(()=>window.__logoutDone=true)});
 await page.waitForFunction(()=>window.__logoutDone&&document.querySelector('#userInfo').textContent==='Anmelden',{},{timeout:5000});
 await page.waitForFunction(()=>document.querySelector('#cloudStatus').textContent==='Nicht angemeldet',{},{timeout:5000});
 await page.waitForTimeout(200);
 assert(await page.evaluate(()=>window.__signedOutEvents<3),'logout must settle without recursive Auth events');
 assert(requests>=3);console.log('PASS real SDK: sign-in completes, verified display, all 12 tools, 10 tool reloads, return home, token refresh, sign-out, normal guest status; no production requests');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1)});
