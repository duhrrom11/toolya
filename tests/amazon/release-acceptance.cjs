// Isolated acceptance: local HTML, synthetic Supabase client, no production requests or writes.
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=process.cwd(),server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));if(!p.startsWith(root+'/'))return res.writeHead(403).end();try{res.setHeader('content-type',/\.m?js$/.test(p)?'text/javascript':p.endsWith('.css')?'text/css':p.endsWith('.webp')?'image/webp':p.endsWith('.png')?'image/png':'text/html');res.end(fs.readFileSync(p))}catch{res.writeHead(404).end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
 try{
  const origin='http://127.0.0.1:'+server.address().port,context=await browser.newContext({viewport:{width:375,height:812}});
  await context.route('**/*',route=>{const url=route.request().url();if(url.startsWith(origin)&&url.endsWith('/assets/vendor/supabase-2.57.0.js'))return route.fulfill({body:'',contentType:'text/javascript'});return url.startsWith(origin)?route.continue():route.fulfill({body:'',contentType:'text/javascript'});});
  await context.addInitScript(()=>{
   const user={id:'offline-user',email:'offline@example.invalid'};let loggedIn=false;window.__authCalls=[];
   const rows=[{user_id:'11111111-1111-4111-8111-111111111111',display_name:'Ada Muster',country:'Schweiz',city:'Zürich',bio:'Bücher und Garten',interests:['Bücher'],lists:[{name:'Meine Wünsche',url:'https://www.amazon.de/hz/wishlist/ls/ABC123?tag=duhrrom-21',occasion:'Geburtstag'}]}];
   const db={auth:{getUser:async()=>({data:{user:loggedIn?user:null}}),onAuthStateChange:callback=>{queueMicrotask(()=>callback('INITIAL_SESSION',null));return {data:{subscription:{unsubscribe(){}}}}},signInWithPassword:async()=>{loggedIn=true;window.__authCalls.push('login');return {data:{user,session:{user,access_token:'offline-token'}},error:null}},signUp:async()=>{window.__authCalls.push('signup');return {data:{session:null},error:null}},signOut:async()=>{loggedIn=false;window.__authCalls.push('logout');return {error:null}}},rpc:async(name)=>({data:name==='wishlist_profile_filters'?{countries:['Schweiz'],interests:['Bücher'],occasions:['Geburtstag']}:rows,error:null}),from:table=>{let q;q=new Proxy({}, {get(_t,k){if(k==='then')return resolve=>Promise.resolve({data:table==='wishlist_directory'?rows:table==='wishlist_amazon_publication_products'?[{publication_id:'offline-list',title:'Beispielprodukt',description:'Produktbeschreibung',image_url:'https://m.media-amazon.com/fixture.jpg',product_url:'https://www.amazon.de/dp/B012345678'}]:[],count:table==='wishlist_directory'?rows.length:0,error:null}).then(resolve);if(k==='maybeSingle')return ()=>Promise.resolve({data:null,error:null});return ()=>q}});return q}};
   window.supabase={createClient:()=>db};
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/tools/wishes/public.html');await page.locator('#wishPublicTrack .wish-public-card').waitFor();
  assert.equal(await page.locator('#homeNewWish,#homeNewList,#createList').count(),0);
  assert.equal(await page.locator('#search').count(),1);assert.equal(await page.locator('#profileForm').count(),1);assert.doesNotMatch(fs.readFileSync('tools/wishes/public-amazon.mjs','utf8'),/renderIdeas|rankProducts|amazonSearchUrl/,'removed Amazon recommendations must stay removed');
  assert.equal(await page.locator('#countryFilter').count(),1);
  assert.equal(await page.locator('#bio,#interests,#interestFilter').count(),0,'old biography and interest controls removed');
  assert.equal(await page.locator('#wishPublicTrack .wish-public-card').count(),1,'published profile carousel renders');
  assert.equal(await page.locator('#results .profile-card').count(),0);
  assert.equal(await page.locator('#favorites').isVisible(),false,'empty favorites stay compact');
  assert.equal(await page.locator('#wishCreateSection .wish-creation-tile').count(),3,'three creation cards');
  // Wishlist remains the only gift-themed role; header and Ko-fi share the selected outfit atlas.
  const verifyOutfit=async character=>{
   await page.waitForFunction(character=>{
    const hero=document.querySelector('.ty-tool-hero');
    const headerFrame=hero?.querySelector(':scope>.ty-tool-hero-inner>.ty-sprite-wrap>.ty-frame');
    const kofiFrame=document.querySelector('.ty-kofi-action>.ty-sprite-wrap>.ty-frame');
    const expected=character==='purple'?100/7:0;
    return hero?.dataset.character===character&&[headerFrame,kofiFrame].every(frame=>
     frame&&!frame.hidden&&frame.style.backgroundImage.includes('outfits.webp')&&
     Math.abs(parseFloat(frame.style.getPropertyValue('--ty-a'))-expected)<.01&&
     parseFloat(frame.style.getPropertyValue('--ty-y'))===0);
   },character);
   assert((await page.locator('.ty-tool-hero-mascot').getAttribute('src')).startsWith('data:image/gif;'),
    'the header avatar must not load a hard-coded gift image');
   assert((await page.locator('.ty-kofi-button-mascot').getAttribute('src')).startsWith('data:image/gif;'),
    'the support avatar must not load a hard-coded gift image');
  };
  await verifyOutfit('turquoise');
  // Wishlist must use the same shared Toolya settings surface, not a minimal fallback.
  assert.equal(await page.locator('#toolya-display-settings').count(),0,'no standalone fallback settings');
  assert.equal(await page.locator('#settingsModal .toolya-preferences').count(),1,'shared appearance panel mounted once');
  await page.locator('#settingsBtn').click();
  assert.equal(await page.locator('#settingsModal').isVisible(),true,'real Wishlist settings open');
  assert.equal(await page.locator('#accountSettings > summary').textContent(),'Toolya-Konto');
  assert.equal(await page.locator('#settingsBackupTitle').textContent(),'💾 Datensicherung');
  assert.equal(await page.locator('#settingsModal .toolya-preferences').count(),1);
  assert.equal(await page.locator('#settingsModal details.toolya-appearance').count(),1,'one collapsible mascot section');
  assert.equal(await page.locator('#settingsModal details.toolya-appearance').evaluate(e=>e.open),false,'mascot section collapsed by default');
  assert.equal(await page.locator('#settingsModal .ty-settings-kofi-button').count(),1,'Ko-fi at end of settings');
  assert.equal(await page.locator('#settingsModal .ty-settings-kofi-button').getAttribute('href'),'https://ko-fi.com/duhrrom');
  assert.equal(await page.locator('#signedOutControls').isVisible(),true);
  await page.locator('#forgotPassword').click();
  assert.match(await page.locator('#loginMessage').textContent(),/E-Mail-Adresse/);
  await page.locator('#loginEmail').fill('offline@example.invalid');
  await page.locator('#loginPassword').fill('offline-password');
  await page.locator('#loginSubmit').click();
  await page.locator('#profileForm').waitFor({state:'visible'});
  assert.equal(await page.locator('#settingsModal').isVisible(),false,'shared login closes settings');
  await page.locator('#settingsBtn').click();
  assert.equal(await page.locator('#signedOutControls').isVisible(),false,'account panel responds to sign-in');
  assert.equal(await page.locator('#logoutUser').isVisible(),true);
  await page.locator('#logoutUser').click();
  await page.waitForFunction(()=>document.querySelector('#cloudStatus')?.textContent?.includes('Nicht angemeldet'));
  assert.equal(await page.locator('#profileForm').isVisible(),false);
  assert.equal(await page.locator('#wishPublicTrack .wish-public-card').count(),1,'carousel remains public after logout');
  await page.locator('details.toolya-appearance summary').click();
  await page.getByLabel('Begleiter',{exact:true}).selectOption('purple');
  await verifyOutfit('purple');
  await page.locator('#cancelSettingsBtn').click();
  assert.equal(await page.locator('#settingsModal').isVisible(),false,'close button works');
  await page.locator('#settingsBtn').click();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#settingsModal').isVisible(),false,'native Escape closes settings');

  for(const character of ['turquoise','purple']){
   await page.evaluate(character=>{
    const key='helferlein-toolya-preferences-v1';
    const preferences=JSON.parse(localStorage.getItem(key)||'{}');
    localStorage.setItem(key,JSON.stringify({...preferences,character}));
    window.dispatchEvent(new StorageEvent('storage',{key}));
   },character);
   await verifyOutfit(character);
  }
  await page.locator('#search').fill('Ada');await page.locator('#results .profile-card').waitFor();
  assert.equal(await page.locator('#results .profile-card').count(),1);
  await page.locator('#resetFilters').click();await page.locator('#wishPublicTrack .wish-public-card').waitFor();
  assert.equal(await page.locator('#profile input[type=checkbox]').count(),0);
  assert.equal(await page.locator('#amazonDiscovery,#mainAmazonSearch').count(),0);
  for(const width of [320,375,768]){await page.setViewportSize({width,height:900});const dims=await page.evaluate(()=>({w:innerWidth,s:document.documentElement.scrollWidth}));assert.ok(dims.s<=dims.w+1,'Public wishlist overflow '+JSON.stringify(dims))}
  assert.equal(await page.locator('#email,#password,#login,#signup,#logoutPublic').count(),0);
  assert.equal(await page.locator('#loginEmail,#loginPassword,#loginSubmit,#registerUser,#logoutUser').count(),5);
  assert.equal(await page.locator('#profileAccountOpen').count(),1);
  await page.locator('#settingsBtn').click();
  const guide=page.getByRole('link',{name:'Wunschlisten-Anleitung',exact:true});
  await guide.waitFor({state:'visible'});
  await guide.click();
  await page.waitForURL(origin+'/amazon-wunschliste-veroeffentlichen/');
  await page.locator('#link-kopieren').waitFor();
  assert.equal(await page.locator('a[href="/tools/wishes/public.html#wishCreateSection"]').count(),1);
  console.log('PASS Amazon-only public UI, safe image integration, mobile widths, auth controls; no production data');
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
