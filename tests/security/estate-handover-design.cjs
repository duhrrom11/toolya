// Actual handover page and crypto, synthetic files only. Every network request is audited.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os');
(async()=>{
 const root=process.cwd(),work=fs.mkdtempSync(path.join(os.tmpdir(),'toolya-handover-'));
 const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
 const server=http.createServer((req,res)=>{if(!['GET','HEAD'].includes(req.method))return res.writeHead(405).end();const pathname=new URL(req.url,'http://local').pathname;if(pathname==='/favicon.ico')return res.writeHead(204).end();const file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep))return res.writeHead(403).end();try{res.setHeader('content-type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404).end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const allowed=new Set(['/tools/estate/handover.html','/tools/estate/print-key.html','/favicon.ico','/assets/heir-e2ee-handoff.js','/assets/helferlein-dialogs.js','/assets/toolya-consent.js','/assets/toolya-consent.css','/assets/estate-print.css','/assets/estate-print-ready.js','/shared/toolya/platform.mjs','/shared/toolya/settings-unify.mjs','/shared/toolya/settings-accordion.css','/shared/toolya/buddy.mjs','/shared/toolya/tokens.css','/shared/toolya/buddy.css','/shared/toolya/platform.css','/shared/toolya/footer.css','/shared/toolya/header.css','/shared/toolya/alpha.css','/assets/toolya/outfits.webp','/assets/toolya/emotions-turquoise.webp','/assets/toolya/emotions-purple.webp',...['turquoise','purple'].flatMap(c=>[
   '/assets/toolya/headers/toolya_wishlist_'+c+'_welcome_400.webp',
   ...['welcome','error','tip','success'].map(p=>'/assets/toolya/originals/toolya_wishlist_'+c+'_'+p+'_1024.png')
 ]),
  '/shared/toolya/i18n/estate-choice.css',
  '/shared/toolya/i18n/locale.mjs',
  '/shared/toolya/i18n/estate-entry.mjs',
  '/shared/toolya/i18n/estate-copy.mjs',
  '/shared/toolya/i18n/estate-dom.mjs'
 ]);
 const marker='synthetic-private-content-marker',passphrase='Synthetic passphrase marker 1234';
 const traffic=[],unexpected=[],errors=[];let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox']});
  const context=await browser.newContext({acceptDownloads:true,colorScheme:'dark',reducedMotion:'reduce'});
  await context.addInitScript(()=>{try{localStorage.setItem('toolya.analytics.consent.v1','yes')}catch{}});
  await context.route('**/*',route=>{const req=route.request(),u=new URL(req.url());if(!['http:','https:'].includes(u.protocol))return route.continue();traffic.push({url:req.url(),method:req.method(),body:req.postData()||'',headers:req.headers()});if(u.origin!==origin||!allowed.has(u.pathname)||req.method()!=='GET'||[...u.searchParams.keys()].some(key=>key!=='v')){unexpected.push(u.pathname);return route.abort()}return route.continue()});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/tools/estate/handover.html');await page.locator('.ty-tool-hero').waitFor();
  const policy=await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  const directives=Object.fromEntries(policy.split(';').map(s=>s.trim().split(/\s+/)).filter(a=>a[0]).map(([name,...values])=>[name,values.sort()]));
  for(const name of ['default-src','connect-src','form-action','object-src','base-uri'])assert.deepEqual(directives[name],["'none'"],name+' remains blocked');
  assert.deepEqual(directives['script-src'],["'self'"]);assert.deepEqual(directives['img-src'],["'self'",'data:']);assert.deepEqual(directives['style-src'],["'self'","'unsafe-inline'"]);
  assert.equal(await page.evaluate(()=>typeof window.dataLayer),'undefined','no analytics events even with stored consent');
  assert.equal(await page.locator('script[src*="googletagmanager"]').count(),0,'no Google script');
  assert.equal(await page.locator('#downloadPublicKey').isDisabled(),true);
  fs.mkdirSync('test-results',{recursive:true});
  for(const width of [320,768,1440]){
   await page.setViewportSize({width,height:900});
   assert.equal(await page.locator('html').evaluate(e=>getComputedStyle(e).colorScheme),'light');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'handover fits '+width);
   assert.equal(await page.locator('footer').count(),1);
   const hero=await page.locator('.ty-tool-hero').evaluate(e=>getComputedStyle(e).borderRadius);assert.notEqual(hero,'0px','same-origin shared header stylesheet applied');
   await page.locator('#keyPassphrase').focus();await page.keyboard.press('Tab');assert(await page.evaluate(()=>getComputedStyle(document.activeElement).outlineStyle!=='none'),'visible keyboard focus');
   await page.locator('.ty-tool-hero h1').click();await page.screenshot({path:'test-results/handover-design-'+width+'.png',fullPage:false});
  }
  await page.locator('#exportEstate').click();assert.match(await page.locator('#exportStatus').textContent(),/ausdrücklich bestätigen/,'irreversible export still requires confirmation');
  await page.locator('#keyPassphrase').fill(passphrase);await page.locator('#keyPassphraseConfirm').fill(passphrase);
  const [privateDownload]=await Promise.all([page.waitForEvent('download'),page.locator('#createKey').click()]);const privateFile=path.join(work,'private.json');await privateDownload.saveAs(privateFile);
  const protectedKey=JSON.parse(fs.readFileSync(privateFile,'utf8'));assert.equal(protectedKey.version,2);assert.equal(protectedKey.kind,'helferlein-heir-private-key-protected');assert(!protectedKey.privateKey&&!protectedKey.d,'private key remains encrypted');
  assert.equal(await page.locator('#keyPassphrase').inputValue(),'');assert.equal(await page.locator('#keyPassphraseConfirm').inputValue(),'');
  const [publicDownload]=await Promise.all([page.waitForEvent('download'),page.locator('#downloadPublicKey').click()]);const publicFile=path.join(work,'public.json');await publicDownload.saveAs(publicFile);
  const masterHex=await page.evaluate(async marker=>{
   const enc=new TextEncoder(),raw=crypto.getRandomValues(new Uint8Array(32)),iv=crypto.getRandomValues(new Uint8Array(12));
   const key=await crypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt']);
   const ciphertext=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,enc.encode(JSON.stringify({entries:[{id:1,title:'Synthetic estate',content:marker+' <img src="https://example.invalid/secret">'}]}))));
   const b64=bytes=>btoa(Array.from(bytes,x=>String.fromCharCode(x)).join('')),hex=Array.from(raw,x=>x.toString(16).padStart(2,'0')).join('');
   localStorage.setItem('digital_estate_vault',JSON.stringify({masterKeyHex:hex,encryptedData:{iv:b64(iv),ciphertext:b64(ciphertext)}}));return hex;
  },marker);
  await page.locator('#publicKeyFile').setInputFiles(publicFile);await page.locator('#confirmRelease').check();
  const [estateDownload]=await Promise.all([page.waitForEvent('download'),page.locator('#exportEstate').click()]);const estateFile=path.join(work,'estate.json');await estateDownload.saveAs(estateFile);assert(!fs.readFileSync(estateFile,'utf8').includes(marker),'estate package contains no plaintext marker');
  await page.locator('#privateKeyFile').setInputFiles(privateFile);await page.locator('#estateFile').setInputFiles(estateFile);await page.locator('#unlockPassphrase').fill(passphrase);await page.locator('#openEstate').click();await page.locator('#estateOutput pre').waitFor();
  assert((await page.locator('#estateOutput').textContent()).includes(marker),'real RSA/AES file roundtrip works');assert.equal(await page.locator('#estateOutput img').count(),0,'decrypted markup remains text');assert.equal(await page.locator('#unlockPassphrase').inputValue(),'');
  await page.locator('#unlockPassphrase').fill('Incorrect synthetic password');await page.locator('#openEstate').click();await page.waitForFunction(()=>document.querySelector('#openStatus').textContent.includes('fehlgeschlagen'));assert.equal(await page.locator('#estateOutput').textContent(),'','failed unlock clears prior plaintext');
  await page.locator('[data-estate-locale="en"]').click();
  assert.equal(await page.locator('[data-estate-locale="en"]').getAttribute('aria-pressed'),'true');
  await page.goto(origin+'/tools/estate/print-key.html');assert.equal(await page.locator('script[src*="toolya-consent"]').count(),0,'print page stays isolated');assert.equal(await page.evaluate(()=>typeof window.dataLayer),'undefined');
  await page.getByRole('button',{name:'Print / Save as PDF',exact:true}).waitFor();
  assert.deepEqual(unexpected,[],'only fixed same-origin assets requested');
  const network=JSON.stringify(traffic);for(const secret of [marker,passphrase,masterHex])assert(!network.includes(secret),'no synthetic secret in any network URL, headers or body');
  assert.deepEqual(errors,[]);console.log('PASS: handover 320/768/1440 light layout, focus, same-origin CSS, unchanged data/network guards, consent exclusion, protected key/export/roundtrip/wrong-password/text-only rendering; '+traffic.length+' audited static GETs. Synthetic files only.');
 }finally{await browser?.close();await new Promise(r=>server.close(r));fs.rmSync(work,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1});
