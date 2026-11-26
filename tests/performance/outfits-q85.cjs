// Compare every outfit cell with actual CSS sprite rendering and all live platform entry points.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const [baseline,candidate,report]=process.argv.slice(2).map(p=>path.resolve(p));
const manifest=JSON.parse(fs.readFileSync(path.join(candidate,'assets/toolya/optimized/outfits-q85.json')));
const old='/'+manifest.source+'?v=20261115-alpha',next='/'+manifest.output;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'};
async function serve(root){
 const server=http.createServer((req,res)=>{
  if(!['GET','HEAD'].includes(req.method))return res.writeHead(405).end();
  const url=new URL(req.url,'http://127.0.0.1');
  let file=path.resolve(root,'.'+url.pathname);
  if(file!==root&&!file.startsWith(root+path.sep))return res.writeHead(403).end();
  try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(fs.readFileSync(file));}
  catch{res.writeHead(404).end();}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 return {server,origin:'http://127.0.0.1:'+server.address().port};
}
function htmlFiles(dir,prefix=''){
 const excluded=new Set(['.git','node_modules','tests','test-results','docs','scripts','assets','shared']);
 return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
  const p=prefix+e.name;
  if(e.isDirectory())return excluded.has(e.name)||e.name.startsWith('.')?[]:htmlFiles(path.join(dir,e.name),p+'/');
  return e.isFile()&&e.name.endsWith('.html')?[p]:[];
 });
}
const required=['index.html','en/index.html',...['wishes','budget','housemates','moving','estate','car','pet-health','parking','loans','plants','meters','baking'].map(s=>'tools/'+s+'/index.html')];
const discovered=htmlFiles(baseline).filter(p=>/<script\b[^>]*\bsrc=["'][^"']*\/platform\.mjs(?:\?[^"']*)?["']/i.test(fs.readFileSync(path.join(baseline,p),'utf8')));
const routes=[...new Set([...required,...discovered])].sort();
fs.mkdirSync(report,{recursive:true});
(async()=>{
 const sites=[await serve(baseline),await serve(candidate)];
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox']});
 try{
  const result=[];
  // Actual CSS background-size/position, both backgrounds, all 16 roles × 2 characters.
  for(const [i,site] of sites.entries()){
   const ctx=await browser.newContext({viewport:{width:1280,height:640},deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});
   await ctx.route('**/*',r=>new URL(r.request().url()).origin===site.origin?r.continue():r.abort());
   const page=await ctx.newPage();await page.goto(site.origin+'/offline.html');
   for(const bg of ['light','dark']){
    await page.setContent('<style>body{margin:0;background:'+(bg==='light'?'#fff':'#20232d')+'}#grid{display:grid;grid-template-columns:repeat(8,160px);width:1280px;height:640px}.cell{width:160px;height:160px;background-size:800% 400%;background-repeat:no-repeat;mix-blend-mode:normal}</style><div id="grid"></div>');
    await page.evaluate(async({src})=>{
     const image=new Image();image.src=src;await image.decode();
     for(let k=0;k<32;k++){
      const e=document.createElement('div');e.className='cell';e.style.backgroundImage='url("'+src+'")';e.style.backgroundPosition=((k%8)*100/7)+'% '+(Math.floor(k/8)*100/3)+'%';document.getElementById('grid').append(e);
     }
    },{src:site.origin+(i?next:old)});
    await page.locator('#grid').screenshot({path:path.join(report,'cells-'+bg+'-'+i+'.png'),animations:'disabled'});
   }
   await ctx.close();
  }
  for(const route of routes){
   for(const character of ['turquoise','purple']){
    const states=[];
    for(const [i,site] of sites.entries()){
     const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});
     await ctx.addInitScript(character=>localStorage.setItem('helferlein-toolya-preferences-v1',JSON.stringify({character,motion:'off'})),character);
     await ctx.route('**/*',r=>new URL(r.request().url()).origin===site.origin&&['GET','HEAD'].includes(r.request().method())?r.continue():r.abort());
     const page=await ctx.newPage();
     const failed=[],requests=[];page.on('response',r=>{if(r.url().includes('outfits')&&r.status()>=400)failed.push(r.url())});page.on('request',r=>{if(r.url().includes('outfits'))requests.push(r.url())});
     await page.goto(site.origin+'/'+route,{waitUntil:'domcontentloaded',timeout:20000});
     await page.waitForFunction(()=>window.toolyaBuddy&&document.querySelector('.toolya-signature-footer'),null,{timeout:15000});
     await page.evaluate(()=>toolyaBuddy.dismiss());
     await page.waitForFunction(()=>[...document.querySelectorAll('.ty-frame')].some(e=>!e.hidden&&e.style.backgroundImage.includes('outfits')),null,{timeout:10000});
     const state=await page.evaluate(()=>{
      const frames=[...document.querySelectorAll('.ty-frame')].filter(e=>!e.hidden&&e.style.backgroundImage.includes('outfits')).map(e=>{
       const style=getComputedStyle(e),r=e.getBoundingClientRect();
       return {url:style.backgroundImage,position:style.backgroundPosition,size:style.backgroundSize,blend:style.mixBlendMode,rect:[r.width,r.height].map(Math.round),kind:e.closest('.ty-tool-hero')?'header':e.closest('.ty-kofi-action')?'donation':e.closest('.toolya-idle')?'idle':'other'};
      });
      return {character:toolyaBuddy.character,hero:document.querySelector('.ty-tool-hero')?.dataset.character??null,path:location.pathname,frames};
     });
     assert.equal(state.character,character,route);
     if(state.hero)assert.equal(state.hero,character,route+' hero');
     assert.ok(state.frames.length,route);
     assert.equal(failed.length,0,route);
     if(i){
      assert.ok(state.frames.every(f=>f.url.includes(next)&&f.blend==='normal'),route+' '+JSON.stringify(state.frames));
      assert.ok(!requests.some(u=>new URL(u).pathname===('/'+manifest.source)),route+' duplicate legacy atlas transfer');
     }else assert.ok(state.frames.every(f=>f.url.includes('outfits.webp')),route+' baseline');
     states.push(state);
     await ctx.close();
    }
    const normalized=s=>s.frames.map(({url,...rest})=>rest);
    assert.deepEqual(normalized(states[1]),normalized(states[0]),route+' '+character);
    assert.equal(states[1].path,states[0].path,route);
    result.push({route,character,frames:states[1].frames.length,header:states[1].hero!==null});
    console.log('ROUTE_OK',route,character,states[1].frames.length);
   }
  }
  assert.ok(required.every(r=>result.filter(x=>x.route===r).length===2));
  fs.writeFileSync(path.join(report,'route-results.json'),JSON.stringify({routes:routes.length,checks:result},null,2));
  console.log('ROUTE_GATE',routes.length,'routes',result.length,'character checks');
 }finally{await browser.close();for(const s of sites)s.server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
