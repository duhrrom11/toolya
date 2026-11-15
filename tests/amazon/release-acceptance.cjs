// Isolated acceptance: local HTML, synthetic Supabase client, no production requests or writes.
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=process.cwd(),server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!p.startsWith(root+'/'))return res.writeHead(403).end();try{res.setHeader('content-type',/\\.m?js$/.test(p)?'text/javascript':p.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(p))}catch{res.writeHead(404).end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
 try{
  const origin='http://127.0.0.1:'+server.address().port,context=await browser.newContext({viewport:{width:375,height:812}});
  await context.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.fulfill({body:'',contentType:'text/javascript'}));
  await context.addInitScript(()=>{
   const user={id:'offline-user',email:'offline@example.invalid'};let loggedIn=false;window.__authCalls=[];
   const rows=[{id:'offline-list',user_id:user.id,amazon_url:'https://www.amazon.de/hz/wishlist/ls/ABC12345',title:'Amazon-Liste',scrape_status:'complete',first_name:'Ada',last_name:'Muster',country:'DE'}];
   const db={auth:{getUser:async()=>({data:{user:loggedIn?user:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signInWithPassword:async()=>{loggedIn=true;window.__authCalls.push('login');return {data:{session:{user}},error:null}},signUp:async()=>{window.__authCalls.push('signup');return {data:{session:null},error:null}},signOut:async()=>{loggedIn=false;window.__authCalls.push('logout');return {error:null}}},rpc:async()=>({data:rows,error:null}),from:table=>{let q;q=new Proxy({}, {get(_t,k){if(k==='then')return resolve=>Promise.resolve({data:table==='wishlist_amazon_publication_products'?[{publication_id:'offline-list',title:'Beispielprodukt',description:'Produktbeschreibung',image_url:'https://m.media-amazon.com/fixture.jpg',product_url:'https://www.amazon.de/dp/B012345678'}]:[],error:null}).then(resolve);if(k==='maybeSingle')return ()=>Promise.resolve({data:null,error:null});return ()=>q}});return q}};
   window.supabase={createClient:()=>db};
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/tools/wishes/index.html');await page.waitForURL(/\/tools\/wishes\/public\.html/);await page.locator('#amazonUrl').waitFor();
  assert.equal(await page.locator('#homeNewWish,#homeNewList,#createList').count(),0);
  assert.equal(await page.locator('#search').count(),1);assert.equal(await page.locator('#profileForm').count(),1);assert.match(fs.readFileSync('tools/wishes/public-amazon.mjs','utf8'),/image_url/);
  assert.equal(await page.locator('#tickerTrack').count(),1);
  for(const width of [320,375,768]){await page.setViewportSize({width,height:900});const dims=await page.evaluate(()=>({w:innerWidth,s:document.documentElement.scrollWidth}));assert.ok(dims.s<=dims.w+1,'Public wishlist overflow '+JSON.stringify(dims))}
  assert.equal(await page.locator('#email').count(),1);assert.equal(await page.locator('#password').count(),1);assert.equal(await page.locator('#login').count(),1);assert.equal(await page.locator('#signup').count(),1);
  assert.equal(await page.locator('#logoutPublic').count(),1);
  console.log('PASS Amazon-only public UI, safe image integration, mobile widths, auth controls; no production data');
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
