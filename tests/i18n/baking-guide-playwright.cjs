/* Browser smoke test for the public English baking guide (no account/data writes). */
const assert=require('node:assert/strict');
const {createServer}=require('node:http');
const {readFileSync}=require('node:fs');
const {resolve,extname}=require('node:path');
const {chromium}=require('playwright');
const root=resolve(__dirname,'../..');
const types={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
const server=createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 const file=resolve(root,'.'+(url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname));
 if(!file.startsWith(root+'/')){res.writeHead(403).end();return}
 try{res.setHeader('content-type',types[extname(file)]||'application/octet-stream');res.end(readFileSync(file))}
 catch{res.writeHead(404).end()}
});
(async()=>{
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/en/cake-pan-calculator/');
  await page.locator('#ty-en-pan-calculator button[type=submit]').click();
  const result=await page.locator('#ty-en-pan-calculator output').innerText();
  assert.match(result,/0[.,]64/,'10-inch recipe converted to 8-inch pan');
  assert.match(await page.locator('#studio-guide').innerText(),/Recipe photo and OCR/);
  assert.match(await page.locator('#faq').innerText(),/Bundt pan/);
  assert.equal(errors.length,0,'page script must not throw');
  console.log('English baking guide browser checks passed:',result.replace(/\s+/g,' ').slice(0,150));
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>server.close());
