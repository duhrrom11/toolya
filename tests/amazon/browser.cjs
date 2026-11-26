const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(fs.existsSync('staging/tools/wishes')?'staging':'.');
(async()=>{
 const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!p.startsWith(root+'/'))return res.writeHead(403).end();try{const body=fs.readFileSync(p);res.setHeader('content-type',p.endsWith('.mjs')||p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':p.endsWith('.png')?'image/png':p.endsWith('.webp')?'image/webp':p.endsWith('.svg')?'image/svg+xml':'text/html');res.end(body)}catch{res.writeHead(404).end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
 try{const page=await browser.newPage({viewport:{width:375,height:812},serviceWorkers:'block'});await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());await page.goto('http://127.0.0.1:'+server.address().port+'/tools/wishes/public.html',{waitUntil:'domcontentloaded'});assert.equal(await page.locator('#listFields').count(),1);assert.equal(await page.locator('#search').count(),1);assert.equal(await page.locator('#homeNewWish').count(),0);assert.equal(await page.locator('#homeNewList').count(),0);assert.equal(await page.locator('#password').count(),0);assert.equal(await page.locator('#loginPassword').count(),1);assert.equal(await page.locator('#profileAccountOpen').count(),1);assert.equal(await page.locator('#wishPublicTrack').count(),1);console.log('Amazon-only wishlist entry and public UI verified without production data');
 const modal=page.locator('#settingsModal');
 await modal.locator('.ty-pwa-settings').waitFor({state:'attached'});
 await page.locator('#settingsBtn').click();
 await modal.waitFor({state:'visible'});
 const backup=modal.locator('#wishlistBackupSettings');
 const account=modal.locator('#accountSettings');
 const summary=backup.locator(':scope > summary');
 const content=backup.locator(':scope > .ty-unified-settings-content');
 assert.equal(await backup.count(),1);
 assert.equal(await content.isVisible(),false);
 const style=node=>node.evaluate(el=>{const s=getComputedStyle(el);return [s.display,s.paddingTop,s.paddingRight,s.borderRadius,s.minHeight,s.color,s.fontWeight]});
 assert.deepEqual(await style(summary),await style(account.locator(':scope > summary')),'both sections use the same summary styling');
 await summary.focus();await summary.press('Enter');
 assert.equal(await content.isVisible(),true);
 assert.equal(await content.locator('a[href="/?settings=1#datensicherung"]').count(),1);
 await summary.click();assert.equal(await content.isVisible(),false);
 await modal.locator('#closeSettingsBtn').click();assert.equal(await modal.isVisible(),false);
 console.log('PASS: Wishlist backup uses the same accordion as account, keyboard and pointer operation, backup link and dialog close; no production requests');}finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
