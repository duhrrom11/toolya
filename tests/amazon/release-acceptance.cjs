// Localhost-only acceptance checks; all Supabase, mail and share operations are mocked.
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve('.'),listId='dc200000-0000-4000-8000-000000000001';
(async()=>{
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+'/'))return res.writeHead(403).end();try{res.setHeader('content-type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file))}catch{res.writeHead(404).end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
 const origin=`http://127.0.0.1:${server.address().port}`;fs.mkdirSync('test-results',{recursive:true});
 try{
  const context=await browser.newContext({viewport:{width:375,height:812},hasTouch:true,isMobile:true,userAgent:'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'});
  await context.route('**/*',route=>{const u=route.request().url();if(u.startsWith(origin)&&!u.includes('/vendor/supabase-'))return route.continue();if(u.endsWith('/fixture.svg'))return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="teal"/></svg>'});return route.fulfill({contentType:route.request().resourceType()==='script'?'text/javascript':'text/plain',body:''});});
  await context.addInitScript(()=>{
   const params=new URLSearchParams(location.search),mode=params.get('mode')||'owner',collection=location.pathname.endsWith('/collection.html');
   const user={id:'aa200000-0000-4000-8000-000000000001'},lid='dc200000-0000-4000-8000-000000000001';
   let signedIn=!collection,callbacks=[];
   window.__authCalls=[];window.__dbCalls=[];window.__shareCalls=[];window.__clientCount=0;
   Object.defineProperty(navigator,'share',{configurable:true,value:async data=>window.__shareCalls.push(data)});
   const list={id:lid,user_id:user.id,title:'Meine Wunschliste für besonders schöne Geschenkideen',description:'Eine öffentliche Sammlung',visibility:'public',archived:false,icon:'🎁',color:'#9D78E8'};
   const product=id=>({asin:'B012345678',title:'Produkt '+id+' – ein vollständiger Titel für eine kleine mobile Wunschkarte',marketplace:'amazon.de',image_url:'https://m.media-amazon.com/fixture.svg',price:19.99,description:'Produktbeschreibung aus dem Import.'});
   function query(table){let single=false,start=0,end=99,ids=null,filters=[];
    const result=()=>{
     window.__dbCalls.push({table,single,start,end,ids,filters});
     if(table==='wishlist_profiles')return {data:single?{user_id:user.id,display_name:'Offline',handle:'offline'}:[],error:null};
     if(table==='wishlist_lists')return {data:single?(mode==='private'?null:list):(mode==='empty-lists'?[]:[list]),error:null};
     if(collection&&table==='wishlist_list_items')return {data:Array.from({length:121},(_,i)=>({wish_id:1000+i})).slice(start,end+1),error:null};
     if(collection&&table==='wishlist_wishes')return {data:(ids||[]).map(id=>({id,note:'',priority:2,visibility:id===1040?'private':'public',wishlist_products:product(id)})),error:null};
     return {data:[],error:null};
    };
    let q;q=new Proxy({}, {get(_t,key){if(key==='then')return resolve=>Promise.resolve(result()).then(resolve);if(key==='single'||key==='maybeSingle')return ()=>{single=true;return Promise.resolve(result())};if(key==='range')return (a,b)=>{start=a;end=b;return q};if(key==='in')return (_f,values)=>{ids=values;return q};if(key==='eq')return (f,v)=>{filters.push([f,v]);return q};return ()=>q}});return q;
   }
   const emit=event=>callbacks.forEach(fn=>fn(event));
   const db={from:query,functions:{invoke:async()=>({data:null,error:new Error('No live network')})},rpc:async(name)=>mode==='likes-error'?{data:null,error:{message:'offline'}}:{data:name==='wishlist_collection_like_counts'?[{list_id:lid,like_count:2}]:[],error:null},auth:{
    getUser:async()=>({data:{user:signedIn?user:null},error:null}),getSession:async()=>({data:{session:signedIn?{user,access_token:'local-fixture'}:null},error:null}),
    onAuthStateChange:fn=>{callbacks.push(fn);return {data:{subscription:{unsubscribe(){callbacks=callbacks.filter(x=>x!==fn)}}}}},
    signOut:async()=>{signedIn=false;window.__authCalls.push({kind:'logout'});emit('SIGNED_OUT');return {error:null}},
    signUp:async data=>{window.__authCalls.push({kind:'signup',redirect:data.options.emailRedirectTo});return {data:{user:null},error:null}},
    signInWithPassword:async()=>{signedIn=true;window.__authCalls.push({kind:'login'});emit('SIGNED_IN');return {data:{user},error:null}}
   }};
   window.supabase={createClient:url=>{window.__clientCount++;if(!url.includes('yheogmeaosuigyaxkwth'))throw Error('Wrong Supabase project');return db}};
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/tools/wishes/index.html');await page.locator('#logout').waitFor();assert.equal(await page.evaluate(()=>window.__clientCount),1);
  await page.locator('#homeNewList').click();assert.doesNotMatch(await page.locator('#listsStatus').textContent(),/Cannot read|undefined|TypeError/);
  for(const width of [320,375,768]){await page.setViewportSize({width,height:900});await page.screenshot({path:`test-results/wishlist-${width}.png`});const size=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert.ok(size.scroll<=size.width+1,'Wishlist overflow '+JSON.stringify(size));assert.ok((await page.locator('#createList').boundingBox()).width>=150,'Manual list button squeezed');assert.ok((await page.locator('.amazon-import input[type=url]').first().boundingBox()).width>=150,'Amazon URL input squeezed');}
  await page.locator('#logout').click();
  if(!await page.locator('#wishlistAuthMenu').evaluate(el=>el.open))await page.locator('#wishlistAuthMenu > summary').click();
  await page.locator('#email').fill('fixture@example.test');await page.locator('#password').fill('Local-Only-2026!');await page.locator('#signup').click();
  await page.waitForFunction(()=>window.__authCalls.some(x=>x.kind==='signup'));
  assert.equal(await page.evaluate(()=>window.__authCalls.find(x=>x.kind==='signup').redirect),origin+'/tools/wishes/index.html');
  await page.locator('#password').fill('Local-Only-2026!');await page.locator('#signin').click();await page.locator('#logout').waitFor();assert.equal(await page.evaluate(()=>window.__clientCount),1);
  await page.goto(origin+'/tools/wishes/index.html?mode=empty-lists');await page.getByText('Noch keine Listen. Erstelle deine erste Wunschliste.',{exact:true}).waitFor();assert.doesNotMatch(await page.locator('#listsStatus').textContent(),/Cannot read|undefined|TypeError/);assert.equal(await page.locator('#createList').isEnabled(),true);console.log('PASS isolated login/logout/signup redirect, empty list dashboard, one shared client; Android widths 320, 375, 768');
  await page.goto(origin+'/tools/wishes/collection.html?id='+listId);await page.locator('#collection').waitFor();
  assert.equal(await page.locator('#grid .card').count(),120);assert.equal(await page.locator('#grid .cover img').count(),120);assert.match(await page.locator('#grid').textContent(),/19,99/);
  const membershipCalls=await page.evaluate(()=>window.__dbCalls.filter(x=>x.table==='wishlist_list_items'));assert.equal(membershipCalls.length,2);assert.equal(membershipCalls[1].start,100);
  assert.equal(await page.locator('#grid h2').filter({hasText:'Produkt 1040 –'}).count(),0);
  for(const width of [320,375,768]){await page.setViewportSize({width,height:900});await page.screenshot({path:`test-results/collection-${width}.png`});const size=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert.ok(size.scroll<=size.width+1,'Collection overflow '+JSON.stringify(size));}
  await page.locator('#share').click();assert.equal(await page.evaluate(()=>window.__shareCalls.length),1);
  await page.goto(origin+'/tools/wishes/collection.html?id='+listId+'&mode=private');await page.getByText('Diese Sammlung ist nicht öffentlich verfügbar oder wurde archiviert.',{exact:true}).waitFor();assert.equal(await page.locator('#collection').isVisible(),false);
  await page.goto(origin+'/tools/wishes/collection.html?id='+listId+'&mode=likes-error');await page.locator('#collection').waitFor();assert.equal(await page.locator('#grid .card').count(),120);assert.match(await page.locator('#reactionStatus').textContent(),/gerade nicht verfügbar/);
  assert.deepEqual(errors,[]);console.log('PASS public sharing, 121 memberships across pages, private wish excluded, all visible metadata, private link closed, reaction failure isolated');
 }finally{await browser.close();server.close()}
})().catch(error=>{console.error(error);process.exit(1)});
