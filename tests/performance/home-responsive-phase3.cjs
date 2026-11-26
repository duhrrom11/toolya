// Offline comparison: only loopback requests, synthetic browser state.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const base=path.resolve(process.argv[2]),candidate=path.resolve(process.argv[3]),report=path.resolve(process.argv[4]);
fs.mkdirSync(report,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'};
async function serve(root){
 const server=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://localhost');
  if(u.pathname==='/__private-fixture'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'private, no-store'});return res.end('{"synthetic":true}');}
  let p=path.resolve(root,'.'+u.pathname);
  if(p!==root&&!p.startsWith(root+path.sep))return res.writeHead(403).end();
  try{if(fs.statSync(p).isDirectory())p=path.join(p,'index.html');res.writeHead(200,{'Content-Type':types[path.extname(p)]||'application/octet-stream','Cache-Control':'public, max-age=60'});res.end(fs.readFileSync(p));}
  catch{res.writeHead(404).end();}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 return {server,origin:'http://127.0.0.1:'+server.address().port};
}
(async()=>{
 const a=await serve(base),b=await serve(candidate);
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox']});
 try{
  const result=[];
  for(const locale of ['de','en'])for(const width of [390,1440]){
   const shots=[];
   for(const [label,site] of [['baseline',a],['candidate',b]]){
    const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:width===390?2:1,reducedMotion:'reduce',serviceWorkers:'block',locale:locale==='de'?'de-DE':'en-GB'});
    await context.route('**/*',r=>new URL(r.request().url()).origin===site.origin?r.continue():r.abort());
    const page=await context.newPage(),errors=[],failed=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.url().startsWith(site.origin)&&r.status()>=400)failed.push(r.url());});
    await page.goto(site.origin+(locale==='de'?'/':'/en/'),{waitUntil:'load'});
    await page.evaluate(async()=>{await document.fonts.ready;await document.querySelector('.ty-hero-art').decode();});
    await page.locator('.ty-tool-card').first().waitFor();
    const data=await page.evaluate(()=>{
     const rect=e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height].map(x=>Math.round(x));};
     return {hero:rect(document.querySelector('.ty-hero-art')),cards:[...document.querySelectorAll('.ty-tool-card')].map(e=>({text:e.querySelector('h3').textContent,rect:rect(e),href:e.querySelector('a.ty-tool-link').getAttribute('href')})),overflow:document.documentElement.scrollWidth>innerWidth,lang:document.documentElement.lang};
    });
    assert.equal(data.cards.length,12);
    assert.equal(data.lang,locale);
    const selected=new URL(await page.locator('.ty-hero-art').evaluate(e=>e.currentSrc)).pathname;
    data.heroSource=selected;
    await page.locator('.ty-hero-art').screenshot({path:path.join(report,locale+'-'+width+'-'+label+'-hero.png'),animations:'disabled'});
    for(let i=0;i<12;i++){
      const card=page.locator('.ty-tool-card').nth(i);
      await card.scrollIntoViewIfNeeded();
      const art=card.locator('img.ty-tool-art');
      await art.evaluate(e=>e.decode());
      await card.screenshot({path:path.join(report,locale+'-'+width+'-'+label+'-card-'+i+'.png'),animations:'disabled'});
    }
    await page.locator('#settingsBtn').click();await page.locator('#settingsModal').waitFor({state:'visible'});await page.keyboard.press('Escape');
    assert.equal(await page.locator('#settingsModal').isHidden(),true);
    if(label==='candidate'){
      assert.ok(!failed.some(u=>u.includes('/assets/perf/')),JSON.stringify(failed));
      assert.ok(!errors.some(e=>!shots[0].errors.includes(e)),JSON.stringify(errors));
    }
    shots.push({data,errors,failed});
    await context.close();
   }
   assert.deepEqual(shots[1].data.cards.map(x=>[x.text,x.href]),shots[0].data.cards.map(x=>[x.text,x.href]));
   assert.equal(shots[1].data.overflow,shots[0].data.overflow);
   const close=(x,y)=>assert.ok(x.every((v,i)=>Math.abs(v-y[i])<=2),JSON.stringify({x,y}));
   close(shots[1].data.hero,shots[0].data.hero);
   assert.equal(shots[1].data.heroSource,shots[0].data.heroSource,'keep verified hero source at every tested size');
   shots[1].data.cards.forEach((x,i)=>close(x.rect,shots[0].data.cards[i].rect));
   result.push({locale,width,baseline:shots[0].data,candidate:shots[1].data});
  }
  // Separate service-worker session. Never send credentials or requests outside loopback.
  const context=await browser.newContext({serviceWorkers:'allow'});
  const page=await context.newPage();
  await page.goto(b.origin+'/offline.html');
  const manifest=JSON.parse(fs.readFileSync(path.join(candidate,'assets/perf/manifest.json'),'utf8'));
  const asset='/'+manifest.files.find(p=>p.endsWith('.css'));
  const cacheEvidence=await page.evaluate(async asset=>{
   await navigator.serviceWorker.register('/sw.js');
   await navigator.serviceWorker.ready;
   if(!navigator.serviceWorker.controller)await new Promise((resolve,reject)=>{
    const t=setTimeout(()=>reject(Error('controller timeout')),10000);
    navigator.serviceWorker.addEventListener('controllerchange',()=>{clearTimeout(t);resolve();},{once:true});
    if(navigator.serviceWorker.controller){clearTimeout(t);resolve();}
   });
   await (await fetch(asset)).text();
   await (await fetch('/__private-fixture',{credentials:'include'})).json();
   await (await fetch(asset+'?synthetic=1')).text();
   const keys=await caches.keys(),entries=[];
   for(const key of keys.filter(k=>k.startsWith('toolya-public-perf-'))){
    const cache=await caches.open(key);
    entries.push(...(await cache.keys()).map(r=>new URL(r.url).pathname+new URL(r.url).search));
   }
   return entries;
  },asset);
  assert.deepEqual(cacheEvidence,[asset]);
  await context.close();
  fs.writeFileSync(path.join(report,'browser-report.json'),JSON.stringify({result,cacheEvidence},null,2));
  console.log('Homepage DE/EN visual geometry, settings and public cache checks passed');
 }finally{await browser.close();a.server.close();b.server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
