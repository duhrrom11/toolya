// Local-only browser smoke. No signups, writes, or remote authentication.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {extname,join,resolve,sep} from 'node:path';
const root=resolve('.release-preview');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.webmanifest':'application/manifest+json'};
const server=createServer((req,res)=>{
 let path;try{path=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400).end();return}
 let target=resolve(root,'.'+path);if(target!==root&&!target.startsWith(root+sep)){res.writeHead(403).end();return}
 if(existsSync(target)&&statSync(target).isDirectory())target=join(target,'index.html');
 if(!existsSync(target)){res.writeHead(404).end('Not found');return}
 res.writeHead(200,{'Content-Type':mime[extname(target)]||'application/octet-stream'});res.end(readFileSync(target));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;
const browser=await chromium.launch({headless:true});const problems=[];
const routes=['/index.html','/tools/wishes/index.html','/tools/baking/index.html','/tools/budget/index.html','/tools/estate/index.html'];
try{
 for(const route of routes){
  const page=await browser.newPage();const errs=[];
  page.on('pageerror',e=>errs.push('JS '+e.message.slice(0,180)));
  page.on('response',r=>{if(r.url().startsWith('http://127.0.0.1:'+port+'/')&&r.status()>=400)errs.push('HTTP '+r.status()+' '+r.url())});
  const resp=await page.goto('http://127.0.0.1:'+port+route,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(1300);
  const title=await page.title();if(resp.status()!==200||!title)errs.push('invalid document '+resp.status());
  console.log('BROWSER '+route+' title='+JSON.stringify(title)+' errors='+errs.length);
  for(const e of errs)problems.push(route+': '+e);
  await page.close();
 }
}finally{await browser.close();await new Promise(r=>server.close(r))}
for(const e of problems.slice(0,80))console.error('BROWSER_ERROR '+e);
if(problems.length)process.exitCode=1;
