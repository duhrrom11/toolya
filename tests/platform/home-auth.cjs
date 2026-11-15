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
 let requests=0;
 await page.route('**/*',r=>{
  const u=new URL(r.request().url());if(u.origin===origin)return r.continue();
  if(u.hostname!=='yheogmeaosuigyaxkwth.supabase.co')return r.abort();
  requests++;
  const reply=(body,status=200)=>r.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
  if(u.pathname==='/auth/v1/token')return reply({access_token:token,refresh_token:'synthetic-refresh',expires_in:3600,token_type:'bearer',user});
  if(u.pathname==='/auth/v1/user')return reply(user);
  if(u.pathname==='/auth/v1/logout')return reply({});
  throw Error('Unexpected synthetic auth request '+u.pathname);
 });
 await page.goto(origin);await page.waitForFunction(()=>window.supabaseClient);
 await page.locator('#userInfo').click();await page.locator('#loginEmail').fill(user.email);await page.locator('#loginPassword').fill('synthetic-only-password');
 await page.evaluate(()=>{window.__loginDone=false;loginUser().then(()=>window.__loginDone=true)});
 await page.waitForFunction(()=>window.__loginDone,{},{timeout:5000});
 await page.waitForFunction(()=>document.querySelector('#userInfo').textContent==='Angemeldet',{},{timeout:5000});
 await page.reload();await page.waitForFunction(()=>document.querySelector('#userInfo').textContent==='Angemeldet',{},{timeout:5000});
 await page.evaluate(()=>{window.__logoutDone=false;logoutUser().then(()=>window.__logoutDone=true)});
 await page.waitForFunction(()=>window.__logoutDone&&document.querySelector('#userInfo').textContent==='Anmelden',{},{timeout:5000});
 await page.waitForFunction(()=>document.querySelector('#cloudStatus').textContent==='Nicht angemeldet',{},{timeout:5000});
 assert(requests>=3);console.log('PASS real SDK: sign-in completes, verified display, reload, sign-out, normal guest status; no production requests');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1)});
