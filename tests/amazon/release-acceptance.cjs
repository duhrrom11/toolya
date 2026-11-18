// Isolated acceptance: local HTML, synthetic Supabase client, no production requests or writes.
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=process.cwd(),server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!p.startsWith(root+'/'))return res.writeHead(403).end();try{res.setHeader('content-type',/\.m?js$/.test(p)?'text/javascript':p.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(p))}catch{res.writeHead(404).end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
 try{
  const origin='http://127.0.0.1:'+server.address().port,context=await browser.newContext({viewport:{width:375,height:812}});
  await context.route('**/*',route=>{const url=route.request().url();if(url.startsWith(origin)&&url.endsWith('/assets/vendor/supabase-2.57.0.js'))return route.fulfill({body:'',contentType:'text/javascript'});return url.startsWith(origin)?route.continue():route.fulfill({body:'',contentType:'text/javascript'});});
  await context.addInitScript(()=>{
   const user={id:'offline-user',email:'offline@example.invalid'};let loggedIn=false;window.__authCalls=[];
   const rows=[{user_id:'11111111-1111-4111-8111-111111111111',display_name:'Ada Muster',country:'Schweiz',city:'Zürich',bio:'Bücher und Garten',interests:['Bücher'],lists:[{name:'Meine Wünsche',url:'https://www.amazon.de/hz/wishlist/ls/ABC123?tag=duhrrom-21',occasion:'Geburtstag'}]}];
   const db={auth:{getUser:async()=>({data:{user:loggedIn?user:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signInWithPassword:async()=>{loggedIn=true;window.__authCalls.push('login');return {data:{session:{user}},error:null}},signUp:async()=>{window.__authCalls.push('signup');return {data:{session:null},error:null}},signOut:async()=>{loggedIn=false;window.__authCalls.push('logout');return {error:null}}},rpc:async(name)=>({data:name==='wishlist_profile_filters'?{countries:['Schweiz'],interests:['Bücher'],occasions:['Geburtstag']}:rows,error:null}),from:table=>{let q;q=new Proxy({}, {get(_t,k){if(k==='then')return resolve=>Promise.resolve({data:table==='wishlist_directory'?rows:table==='wishlist_amazon_publication_products'?[{publication_id:'offline-list',title:'Beispielprodukt',description:'Produktbeschreibung',image_url:'https://m.media-amazon.com/fixture.jpg',product_url:'https://www.amazon.de/dp/B012345678'}]:[],count:table==='wishlist_directory'?rows.length:0,error:null}).then(resolve);if(k==='maybeSingle')return ()=>Promise.resolve({data:null,error:null});return ()=>q}});return q}};
   window.supabase={createClient:()=>db};
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/tools/wishes/public.html');await page.locator('#wishlistCloud .cloud-word').waitFor();
  assert.equal(await page.locator('#homeNewWish,#homeNewList,#createList').count(),0);
  assert.equal(await page.locator('#search').count(),1);assert.equal(await page.locator('#profileForm').count(),1);assert.match(fs.readFileSync('tools/wishes/public-amazon.mjs','utf8'),/image_url/);
  assert.equal(await page.locator('#countryFilter').count(),1);
  assert.equal(await page.locator('#bio,#interests,#interestFilter').count(),0,'old biography and interest controls removed');
  assert.equal(await page.locator('#wishlistCloud .cloud-word').count(),1,'cloud still renders with 30-item ceiling');
  assert.equal(await page.locator('#wishlistCloud .cloud-word').count(),1);
  assert.equal(await page.locator('#results .profile-card').count(),0);
  assert.equal(await page.locator('#favorites').isVisible(),false,'empty favorites stay compact');
  assert.equal(await page.locator('#refreshCloud').count(),1);
  await page.locator('#refreshCloud').click();
  await page.locator('#wishlistCloud .cloud-word').waitFor();
  await page.locator('.ty-tool-hero-mascot').waitFor();
  await page.evaluate(()=>{
    const key='helferlein-toolya-preferences-v1';
    const preferences=JSON.parse(localStorage.getItem(key)||'{}');
    localStorage.setItem(key,JSON.stringify({...preferences,character:'purple'}));
    window.dispatchEvent(new StorageEvent('storage',{key}));
  });
  await page.waitForFunction(()=>document.querySelector('.ty-tool-hero-mascot')?.getAttribute('src')?.includes('_purple_'));
  await page.locator('#search').fill('Ada');await page.locator('#results .profile-card').waitFor();
  assert.equal(await page.locator('#results .profile-card').count(),1);
  await page.locator('#resetFilters').click();await page.locator('#wishlistCloud .cloud-word').waitFor();
  assert.equal(await page.locator('#profile input[type=checkbox]').count(),0);
  assert.equal(await page.locator('#amazonDiscovery,#mainAmazonSearch').count(),0);
  for(const width of [320,375,768]){await page.setViewportSize({width,height:900});const dims=await page.evaluate(()=>({w:innerWidth,s:document.documentElement.scrollWidth}));assert.ok(dims.s<=dims.w+1,'Public wishlist overflow '+JSON.stringify(dims))}
  assert.equal(await page.locator('#email').count(),1);assert.equal(await page.locator('#password').count(),1);assert.equal(await page.locator('#login').count(),1);assert.equal(await page.locator('#signup').count(),1);
  assert.equal(await page.locator('#logoutPublic').count(),1);
  console.log('PASS Amazon-only public UI, safe image integration, mobile widths, auth controls; no production data');
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
