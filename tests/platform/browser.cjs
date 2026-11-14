// Every Supabase, mail, analytics and non-static external request is blocked.
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve('.'),routes=['budget','moving','housemates','estate','car','pet-health','parking','loans','plants','meters','baking','wishes'];
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
(async()=>{const server=http.createServer((req,res)=>{let url=new URL(req.url,'http://local').pathname;if(url.endsWith('/'))url+='index.html';const file=path.resolve(root,'.'+decodeURI(url));if(!file.startsWith(root+'/'))return res.writeHead(403).end();try{res.setHeader('content-type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404).end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin='http://127.0.0.1:'+server.address().port,staticHosts=new Set(['cdn.tailwindcss.com','unpkg.com','cdn.jsdelivr.net','cdnjs.cloudflare.com','www.gstatic.com','fonts.googleapis.com','fonts.gstatic.com']);
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox']});fs.mkdirSync('test-results',{recursive:true});
 try{const context=await browser.newContext({viewport:{width:320,height:812},isMobile:true,hasTouch:true});let blockedWrites=0;
 await context.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin===origin&&r.request().method()==='GET')return r.continue();if(staticHosts.has(u.hostname)&&r.request().method()==='GET')return r.continue();if(r.request().method()!=='GET')blockedWrites++;return r.abort()});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin);await page.waitForFunction(()=>window.toolyaBuddy);await page.evaluate(()=>{toolyaBuddy.dismiss();toolyaBuddy.setMotion('off')});
 await page.waitForFunction(()=>{const f=document.querySelector('.toolya-idle .ty-frame');return f&&!f.hidden});
 // Persistent idle button works on touch and keyboard; no storage/user-data write needed.
 for(let i=0;i<5;i++)await page.locator('.toolya-idle').tap();
 await page.waitForFunction(()=>document.querySelector('.tb-body').textContent.includes('kitzlig'));
 assert.equal(await page.evaluate(()=>toolyaBuddy.tickle()),false,'cooldown');
 await page.evaluate(()=>{toolyaBuddy.dismiss();toolyaBuddy.tickleCooldown=0});await page.locator('.toolya-idle').focus();for(let i=0;i<5;i++)await page.keyboard.press('Enter');
 await page.waitForFunction(()=>document.querySelector('.tb-body').textContent.includes('Ohren'));
 assert.equal(await page.locator('.tb-avatar').evaluate(i=>i===document.activeElement),true);
 await page.evaluate(()=>{toolyaBuddy.show('warning','Wichtiger Hinweis');for(let i=0;i<5;i++)toolyaBuddy.tickle()});assert.equal(await page.locator('.tb-body').textContent(),'Wichtiger Hinweis');
 await page.evaluate(()=>{window.confirmed=toolyaBuddy.confirm({message:'Sicher bestätigen?'})});assert.equal(await page.evaluate(()=>toolyaBuddy.tickle()),false);await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>window.confirmed),false);
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.tb-message-box .ty-frame').evaluate(e=>getComputedStyle(e).animationName),'none');
 await page.evaluate(()=>{toolyaBuddy.dismiss();toolyaBuddy.setCharacter('purple')});await page.locator('.toolya-settings').evaluate(d=>d.open=true);await page.getByLabel('Begleiter',{exact:true}).selectOption('purple');
 await page.screenshot({path:'test-results/mascot-home-mobile.png',fullPage:true});
 for(const route of routes){await page.goto(origin+'/tools/'+route+'/');await page.waitForFunction(()=>window.toolyaBuddy);assert.equal(await page.locator('.toolya-buddy').count(),1,route);await page.evaluate(()=>toolyaBuddy.dismiss());await page.waitForFunction(()=>{const f=document.querySelector('.toolya-idle .ty-frame');return f&&!f.hidden});
  const measurement=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth,overflow:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();if(r.right<=321||r.width===0)return false;for(let p=e.parentElement;p;p=p.parentElement){if(/auto|scroll|hidden|clip/.test(getComputedStyle(p).overflowX)&&p.getBoundingClientRect().right<=321)return false}return true}).slice(0,20).map(e=>({tag:e.tagName,id:e.id,class:e.className,right:e.getBoundingClientRect().right}))}));
  if(route==='wishes')await page.screenshot({path:'test-results/mascot-wishes-mobile.png',fullPage:true});
  assert(measurement.scroll<=321,route+' overflow '+JSON.stringify(measurement));assert.equal(await page.evaluate(()=>toolyaBuddy.character),'purple');
  await page.screenshot({path:'test-results/mascot-'+route+'-mobile.png',fullPage:true});await page.locator('.toolya-buddy').screenshot({path:'test-results/mascot-'+route+'-detail.png'});
 }
 await page.goto(origin+'/tools/wishes/');await page.waitForFunction(()=>window.toolyaBuddy);
 for(const emotion of ['happy','proud','curious','thoughtful','surprised','concerned','sad','shy','cheeky','sleepy','laughing','grateful','motivated','puzzled','celebrating','affectionate']){
  await page.evaluate(async emotion=>{const p=await import('/shared/toolya/platform.mjs');p.buddy.dismiss();p.previewEmotion(emotion)},emotion);await page.waitForFunction(()=>{const f=document.querySelector('.tb-message-box .ty-frame');return f&&!f.hidden});
 }
 const donations=page.locator('a.toolya-donation');await donations.first().waitFor({state:'attached'});assert.equal(await donations.first().getAttribute('href'),'https://ko-fi.com/duhrrom');assert.match(await donations.first().textContent(),/Freiwillig/);
 assert.deepEqual(errors,[],'runtime errors');assert.equal(blockedWrites,0,'no production writes attempted');console.log('PASS: 12 tool routes, 320px reflow, both-character preferences, 16 emotions, atlas loading, touch/keyboard tickle, cooldown, critical and modal locks, reduced motion, Ko-fi and no runtime errors');
 }finally{await browser.close();server.close()}})().catch(e=>{console.error(e);process.exit(1)});
