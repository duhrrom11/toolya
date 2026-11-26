// Read-only measurement: immutable release snapshots, empty browser profiles, no app backend.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),zlib=require('node:zlib'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const [snapshots,report,modules]=process.argv.slice(2).map(p=>path.resolve(p));
const names=['phase2','sprite'];
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2','.ico':'image/x-icon'};
const CDN='https://cdn.jsdelivr.net/npm/i18next@23.16.8/dist/umd/i18next.min.js';
const localCDN='/_benchmark/i18next.min.js';
const cdnBytes=fs.readFileSync(path.join(modules,'i18next/dist/umd/i18next.min.js'));
let active='phase2';
const server=http.createServer((req,res)=>{
 if(!['GET','HEAD'].includes(req.method))return res.writeHead(405).end();
 const url=new URL(req.url,'http://127.0.0.1');
 let file,bytes,type;
 try{
  if(url.pathname===localCDN){bytes=cdnBytes;type=mime['.js'];}
  else{
   const root=path.join(snapshots,active);
   file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
   if(file!==root&&!file.startsWith(root+path.sep))return res.writeHead(403).end();
   if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
   bytes=fs.readFileSync(file);type=mime[path.extname(file)]||'application/octet-stream';
   if(active==='baseline'&&file===path.join(root,'index.html')){
    const original=bytes.toString('utf8');
    assert.ok(original.includes(CDN));
    // Mirror the exact pinned dependency, not a missing script or a production CDN call.
    bytes=Buffer.from(original.replace(CDN,localCDN));
   }
  }
  const headers={'Content-Type':type,'Cache-Control':'no-store'};
  if(/text\/|javascript|json|svg/.test(type)&&/\bgzip\b/.test(req.headers['accept-encoding']||'')){
   bytes=zlib.gzipSync(bytes);headers['Content-Encoding']='gzip';headers.Vary='Accept-Encoding';
  }
  headers['Content-Length']=bytes.length;
  res.writeHead(200,headers);res.end(req.method==='HEAD'?undefined:bytes);
 }catch(e){res.writeHead(404).end();}
});
function median(values){const v=[...values].sort((a,b)=>a-b);return v[Math.floor(v.length/2)];}
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
(async()=>{
 fs.mkdirSync(report,{recursive:true});
 const {default:lighthouse}=await import(pathToFileURL(require.resolve('lighthouse',{paths:[modules]})).href);
 const {launch}=await import(pathToFileURL(require.resolve('chrome-launcher',{paths:[modules]})).href);
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 const results=[];
 const liveEligible=false;
 async function measure(name,round){
  const live=name==='live';active=live?'phase2':name;
  const target=live?'https://toolya.app/':origin+'/';
  // A fresh profile per measurement, no login, no interactions, no third-party DNS.
  const chrome=await launch({chromePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',chromeFlags:[
   '--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-background-networking','--no-proxy-server',
   '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE '+(live?'toolya.app':'127.0.0.1')
  ]});
  try{
   const out=await lighthouse(target,{port:chrome.port,output:'json',logLevel:'error',onlyCategories:['performance'],formFactor:'mobile',throttlingMethod:'simulate',disableStorageReset:false,...(live?{}:{blockedUrlPatterns:['https://*']})});
   const lhr=out.lhr;
   assert.ok(!lhr.runtimeError,JSON.stringify(lhr.runtimeError));
   const a=lhr.audits;
   const val=id=>{const n=a[id]?.numericValue;assert.ok(Number.isFinite(n),id+' missing');return n;};
   const row={name,round,version:lhr.lighthouseVersion,score:Math.round(lhr.categories.performance.score*100),
    lcpMs:Math.round(val('largest-contentful-paint')),fcpMs:Math.round(val('first-contentful-paint')),
    tbtMs:Math.round(val('total-blocking-time')),cls:Number(val('cumulative-layout-shift').toFixed(4)),
    speedIndexMs:Math.round(val('speed-index')),bytes:Math.round(val('total-byte-weight')),
    requests:a['network-requests']?.details?.items?.length??null,
    lcpElement:a['largest-contentful-paint-element']?.details?.items?.[0]?.node?.snippet??null,
    warnings:lhr.runWarnings,config:lhr.configSettings.throttling};
   fs.writeFileSync(path.join(report,name+'-'+round+'.json'),JSON.stringify(lhr));
   results.push(row);console.log('LIGHTHOUSE_RUN',JSON.stringify(row));
  }finally{await chrome.kill();}
 }
 try{
  for(let round=0;round<3;round++)for(let j=0;j<names.length;j++)await measure(names[(j+round)%names.length],round+1);
  // Public static HTTPS navigation only; external hosts blocked, no authenticated session.
  if(liveEligible){
   for(let round=1;round<=3;round++)await measure('live',round);
  }
  const metrics=['score','lcpMs','fcpMs','tbtMs','cls','speedIndexMs','bytes','requests'];
  const summary=Object.fromEntries([...names,...(liveEligible?['live']:[])].map(name=>{
   const rows=results.filter(x=>x.name===name);assert.equal(rows.length,3,name);
   return [name,Object.fromEntries(metrics.map(m=>[m,median(rows.map(x=>x[m]))]))];
  }));
  fs.writeFileSync(path.join(report,'summary.json'),JSON.stringify({summary,results,liveEligible,method:'Lighthouse 12.8.0 mobile simulated throttling; 3 cold loopback runs for phase2 and sprite candidate, gzip, external hosts blocked; not field data'},null,2));
  console.log('LIGHTHOUSE_MEDIANS',JSON.stringify(summary));
 }finally{server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
