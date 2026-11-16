// Every Supabase, mail, analytics and non-static external request is blocked.
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve('.'),routes=['budget','moving','housemates','estate','car','pet-health','parking','loans','plants','meters','baking','wishes'];
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
(async()=>{const server=http.createServer((req,res)=>{let url=new URL(req.url,'http://local').pathname;if(url.endsWith('/'))url+='index.html';const file=path.resolve(root,'.'+decodeURI(url));if(!file.startsWith(root+'/'))return res.writeHead(403).end();try{res.setHeader('content-type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404).end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin='http://127.0.0.1:'+server.address().port,staticHosts=new Set(['cdn.tailwindcss.com','unpkg.com','cdn.jsdelivr.net','cdnjs.cloudflare.com','www.gstatic.com','fonts.googleapis.com','fonts.gstatic.com']);
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox']});fs.mkdirSync('test-results',{recursive:true});
 try{const context=await browser.newContext({viewport:{width:320,height:812},isMobile:true,hasTouch:true});let blockedWrites=0;const blockedWriteUrls=[];
 const guard=r=>{const u=new URL(r.request().url());
 // Isolated registered user for the plant-page mascot interaction only.
 // No Supabase request is ever sent; all snapshot reads are in-memory.
 if(u.origin===origin&&u.pathname==='/assets/vendor/supabase-2.57.0.js'&&r.request().frame()?.url().includes('/tools/plants/')){
  return r.fulfill({status:200,contentType:'text/javascript',body:`
   window.supabase={createClient(){return {
    auth:{
     async getUser(){return {data:{user:{id:'mascot-fixture-user',is_anonymous:false}},error:null}},
     async getSession(){return {data:{session:null},error:null}},
     onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}},
     async signOut(){return {error:null}}
    },
    from(table){if(table!=='user_data')throw Error('Unexpected table');return {
     select(){return this},eq(){return this},
     async maybeSingle(){return {data:null,error:null}}
    }},
    async rpc(){throw Error('Unexpected cloud write in mascot fixture')}
   }}};
  `});
 }
if(u.origin===origin&&r.request().method()==='GET')return r.continue();if(staticHosts.has(u.hostname)&&r.request().method()==='GET')return r.continue();if(r.request().method()!=='GET'&&(u.pathname.includes('/rest/v1/')||u.pathname.includes('/functions/v1/'))&&!u.pathname.endsWith('/rest/v1/rpc/search_public_amazon_wishlists')){blockedWrites++;blockedWriteUrls.push(r.request().method()+' '+u.hostname+u.pathname)}return r.abort()};await context.route('**/*',guard);
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/tools/plants/');await page.waitForFunction(()=>document.getElementById('toolya-cloud-gate')===null,null,{timeout:10000}).catch(async e=>{console.error('PLANTS FIXTURE DIAGNOSTIC',await page.evaluate(()=>({gate:document.getElementById('toolya-cloud-gate')?.textContent?.slice(0,180)||null,ready:typeof plantsCloudReady!=='undefined'?plantsCloudReady:null})));throw e;});await page.waitForFunction(()=>window.toolyaBuddy);await page.evaluate(()=>{toolyaBuddy.dismiss();toolyaBuddy.setMotion('off')});
 await page.waitForFunction(()=>{const f=document.querySelector('.toolya-idle .ty-frame');return f&&!f.hidden});
 assert.equal(await page.locator('.toolya-idle .ty-frame').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)','sprite frame must not add a white image background');
 await page.addStyleTag({content:'.ty-frame{background-color:#fff}'});
 assert.equal(await page.locator('.toolya-idle .ty-frame').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)','alpha stylesheet wins over cached white CSS');
 const cachedAtlas=await page.locator('.toolya-idle .ty-frame').evaluate(e=>{const previous=e.style.backgroundImage;e.style.backgroundImage='url("/assets/toolya/outfits.webp")';const resolved=getComputedStyle(e).backgroundImage;e.style.backgroundImage=previous;return resolved});
 assert(cachedAtlas.includes('outfits.webp?v=20261115-alpha'),'old cached module URL is replaced by versioned alpha artwork');

 // The thematic header mascot replaces the removed idle strip for touch and keyboard.
 for(let i=0;i<5;i++)await page.locator('.ty-tool-hero-mascot').tap();
 await page.waitForFunction(()=>document.querySelector('.tb-body').textContent.includes('kitzlig'));
 assert.equal(await page.evaluate(()=>toolyaBuddy.tickle()),false,'cooldown');
 await page.evaluate(()=>{toolyaBuddy.dismiss();toolyaBuddy.tickleCooldown=0});await page.locator('.ty-tool-hero-mascot').focus();for(let i=0;i<5;i++)await page.keyboard.press('Enter');
 await page.waitForFunction(()=>document.querySelector('.tb-body').textContent.includes('Ohren'));
 assert.equal(await page.locator('.tb-avatar').evaluate(i=>i===document.activeElement),true);
 await page.evaluate(()=>{toolyaBuddy.show('warning','Wichtiger Hinweis');for(let i=0;i<5;i++)toolyaBuddy.tickle()});assert.equal(await page.locator('.tb-body').textContent(),'Wichtiger Hinweis');
 // Notices must remain centered in the current viewport, even after scrolling.
 const centered=async()=>page.locator('.tb-message-box').evaluate(el=>{const r=el.getBoundingClientRect();return {dx:Math.abs((r.left+r.right)/2-innerWidth/2),dy:Math.abs((r.top+r.bottom)/2-innerHeight/2),visible:r.width>0&&r.height>0}});
 let pos=await centered();assert(pos.visible&&pos.dx<3&&pos.dy<3,'notice centered at initial scroll '+JSON.stringify(pos));
 await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));pos=await centered();assert(pos.visible&&pos.dx<3&&pos.dy<3,'notice follows viewport after scrolling '+JSON.stringify(pos));

 await page.evaluate(()=>{window.confirmed=toolyaBuddy.confirm({message:'Sicher bestätigen?'})});assert.equal(await page.evaluate(()=>toolyaBuddy.tickle()),false);await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>window.confirmed),false);
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.tb-message-box .ty-frame').evaluate(e=>getComputedStyle(e).animationName),'none');
 await page.evaluate(()=>{toolyaBuddy.dismiss();toolyaBuddy.setCharacter('purple')});await page.getByRole('button',{name:'Einstellungen öffnen',exact:true}).click();await page.getByLabel('Begleiter',{exact:true}).selectOption('purple');
 assert.equal(await page.locator('.toolya-settings').count(),0);assert.equal(await page.locator('#settingsModal .toolya-preferences').count(),1);await page.keyboard.press('Escape');
 // New homepage duo replaces the old idle shortcut. Existing shared buddy checks above
 // intentionally stay on a tool route where that shortcut remains part of the UI.
 await page.goto(origin);await page.waitForFunction(()=>window.toolyaHomeReady===true);await page.evaluate(()=>toolyaBuddy.dismiss());
 // Regression: Swiss-French AltGr+2 and native paste must work in the account email field.
 await page.setViewportSize({width:1280,height:812});
 await page.locator('#settingsBtn').click();
 const email=page.locator('#loginEmail');await email.waitFor({state:'visible'});await email.fill('romi');
 await email.focus();await page.keyboard.insertText('@');
 assert.equal(await email.inputValue(),'romi@','native text insertion supports @');
 // Keyboard layout translation is OS-specific; test the produced @ input separately.
 await email.evaluate(el=>el.dispatchEvent(new InputEvent('beforeinput',{data:'@',inputType:'insertText',bubbles:true,cancelable:true})));
 await page.evaluate(async()=>{const field=document.getElementById('loginEmail');field.focus();const dt=new DataTransfer();dt.setData('text/plain','@example.ch');const ev=new ClipboardEvent('paste',{clipboardData:dt,bubbles:true,cancelable:true});window.__loginPasteAllowed=field.dispatchEvent(ev)});
 assert.equal(await page.evaluate(()=>window.__loginPasteAllowed),true,'login must not cancel native paste');
 assert.equal(await email.inputValue(),'romi@','synthetic clipboard event does not insert data');
 await email.fill('romi@example.ch');assert.equal(await email.inputValue(),'romi@example.ch','login accepts @');
 await page.keyboard.press('Escape');
 // Login regression: Swiss-French AltGr+2, native Ctrl+V and explicit clipboard controls.
 await page.setViewportSize({width:1280,height:812});
 await page.locator('#settingsBtn').click();
 const email=page.locator('#loginEmail');await email.waitFor({state:'visible'});await email.fill('test');
 await email.evaluate(el=>el.dispatchEvent(new KeyboardEvent('keydown',{key:'2',code:'Digit2',ctrlKey:true,altKey:true,bubbles:true,cancelable:true})));
 assert.equal(await email.inputValue(),'test@','AltGr+2 fallback inserts @');
 await page.locator('#loginInsertAt').click();assert.equal(await email.inputValue(),'test@@','accessible @ control inserts character');
 await page.evaluate(()=>{window.__nativePasteNotBlocked=true;const el=document.getElementById('loginEmail');el.focus();const e=new KeyboardEvent('keydown',{key:'v',code:'KeyV',ctrlKey:true,bubbles:true,cancelable:true});window.__nativePasteNotBlocked=el.dispatchEvent(e)});
 assert.equal(await page.evaluate(()=>window.__nativePasteNotBlocked),true,'Ctrl+V must preserve native default');
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{readText:async()=> 'example.ch'}}));
 await email.fill('user@');await page.locator('#loginPasteEmail').click();
 await page.waitForFunction(()=>document.getElementById('loginEmail').value==='user@example.ch');
 await page.locator('#loginPastePassword').click();
 await page.waitForFunction(()=>document.getElementById('loginPassword').value==='example.ch');
 await page.keyboard.press('Escape');
 // Regression: a visible homepage notice must stay fully within the viewport in mobile and desktop-layout widths.
 for(const width of [320,390,900,960,1280]){
  await page.setViewportSize({width,height:812});
  await page.evaluate(()=>toolyaBuddy.show('warning','Willkommen bei Toolya'));
  const rect=await page.locator('.tb-message-box').evaluate(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,viewportWidth:innerWidth,viewportHeight:innerHeight}});
  assert(rect.left>=0&&rect.right<=rect.viewportWidth+1&&rect.top>=0&&rect.bottom<=rect.viewportHeight+1,'home notice clipped at '+width+': '+JSON.stringify(rect));
  await page.evaluate(()=>toolyaBuddy.dismiss());
 }
 await page.setViewportSize({width:320,height:812});
 await page.emulateMedia({reducedMotion:'reduce'});
 assert.equal(await page.locator('.ty-hero-stage').getAttribute('data-poses-ready'),'true','pose assets loaded');
 const hero=page.locator('.ty-hero-stage'),tickleButton=page.getByRole('button',{name:'Türkisfarbenes Maskottchen kitzeln',exact:true});
 for(let i=0;i<4;i++)await tickleButton.tap();
 assert.equal(await page.locator('.ty-duo-message').isVisible(),false,'four taps do not trigger Easter egg');
 await tickleButton.tap();assert.match(await page.locator('.ty-duo-message').textContent(),/kitzlig/);
 assert.equal(await hero.getAttribute('data-reaction'),null,'reduced motion does not animate');
 await page.getByRole('button',{name:/Finanzen/,exact:false}).click();
 assert.equal(await page.locator('#toolsGrid .tool-card:visible').count(),3,'finance filters actual cards');
 await page.getByRole('button',{name:/Alle 12/,exact:true}).click();
 assert.equal(await page.locator('#toolsGrid .tool-card:visible').count(),12,'all original tools retained');
 for(const id of ['wishlist','kassenbon','pflanzen','kisten'])await page.locator('.fav-btn[data-id="'+id+'"]').click();
 assert.equal(await page.locator('#b3-quickstart-list a').count(),3,'three real favorites in quickstart');
 await page.reload();await page.waitForFunction(()=>window.toolyaHomeReady===true);
 assert.equal(await page.locator('.fav-btn[aria-pressed="true"]').count(),4,'favorite state preserved across reload');
 assert.equal(await page.locator('#b3-quickstart-list a').count(),3);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'home mobile overflow');
 assert(await page.locator('.ty-hero-copy h1').evaluate(e=>e.getBoundingClientRect().right<=innerWidth&&e.scrollWidth<=e.clientWidth+1),'hero text fits mobile width');
 assert(await page.locator('#settingsBtn img').isVisible(),'mobile gear icon visible');
 await page.getByRole('button',{name:'Einstellungen öffnen',exact:true}).click();
 await page.getByLabel('Animation',{exact:true}).selectOption('Aus');
 await page.getByLabel('Begleiter ausblenden',{exact:true}).check();
 await page.locator('#cancelSettingsBtn').click();
 assert(await hero.evaluate(e=>e.classList.contains('ty-duo-hidden')),'duo honors hidden preference');
 await page.getByRole('button',{name:'Einstellungen öffnen',exact:true}).click();
 await page.getByLabel('Begleiter ausblenden',{exact:true}).uncheck();
 await page.locator('#cancelSettingsBtn').click();
 assert.equal(await page.locator('body').getAttribute('data-home-motion'),'off');
 assert(await page.locator('.ty-tool-card').evaluateAll(cards=>cards.every(e=>e.getBoundingClientRect().right<=innerWidth+1)),'every mobile card fits the viewport');
 await page.screenshot({path:'test-results/mascot-home-mobile.png',fullPage:true});
 const desktopContext=await browser.newContext({viewport:{width:1440,height:1024},storageState:await context.storageState()});
 await desktopContext.route('**/*',guard);const desktop=await desktopContext.newPage();desktop.on('pageerror',e=>errors.push(e.message));
 await desktop.goto(origin);await desktop.waitForFunction(()=>window.toolyaHomeReady===true);await desktop.evaluate(()=>toolyaBuddy.dismiss());
 await desktop.getByRole('button',{name:'Einstellungen öffnen',exact:true}).click();
 await desktop.getByLabel('Animation',{exact:true}).selectOption('Normal');
 await desktop.locator('#cancelSettingsBtn').click();
 await desktop.locator('.ty-primary').hover();
 assert.equal(await desktop.locator('.ty-hero-stage').getAttribute('data-reaction'),null,'both header mascots remain static on hover');
 assert.equal(await desktop.locator('.ty-hero-character').count(),2,'both independent characters');
 await desktop.locator('.b3-hub-logo').hover();
 await desktop.waitForFunction(()=>!document.querySelector('.ty-hero-stage').dataset.reaction&&getComputedStyle(document.querySelector('.ty-hero-art')).opacity==='1'&&getComputedStyle(document.querySelector('.ty-live-duo')).opacity==='0');
 await desktop.screenshot({path:'test-results/mascot-home-desktop.png',fullPage:true});
 await desktop.locator('.ty-tool-card[data-id="wishlist"]').hover();
 await desktop.screenshot({path:'test-results/mascot-home-hover.png'});await desktopContext.close();

 for(const route of routes){await page.goto(origin+'/tools/'+route+'/');await page.waitForFunction(()=>window.toolyaBuddy);assert.equal(await page.locator('.toolya-buddy').count(),1,route);await page.evaluate(()=>toolyaBuddy.dismiss());await page.waitForFunction(()=>{const f=document.querySelector('.toolya-idle .ty-frame');return f&&!f.hidden});
  const measurement=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth,overflow:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();if(r.right<=321||r.width===0)return false;for(let p=e.parentElement;p;p=p.parentElement){if(/auto|scroll|hidden|clip/.test(getComputedStyle(p).overflowX)&&p.getBoundingClientRect().right<=321)return false}return true}).slice(0,20).map(e=>({tag:e.tagName,id:e.id,class:e.className,right:e.getBoundingClientRect().right}))}));
  if(route==='wishes')await page.screenshot({path:'test-results/mascot-wishes-mobile.png',fullPage:true});
  assert(measurement.scroll<=322,route+' overflow '+JSON.stringify(measurement));assert.equal(await page.evaluate(()=>toolyaBuddy.character),'purple');
  assert.equal(await page.locator('.toolya-settings').count(),0,route+' no standalone settings');
  // CloudOnly pages are intentionally blocked without a verified account.
  // Assert the real gate instead of bypassing it to click protected controls.
  // Cloud initialization is asynchronous: wait briefly for a late gate before interacting.
  await page.locator('#toolya-cloud-gate').waitFor({state:'visible',timeout:2500}).catch(()=>{});
  if(await page.locator('#toolya-cloud-gate').isVisible()){
   assert.equal(await page.locator('#toolya-cloud-gate').getAttribute('role'),'alert',route+' authentication gate');
   assert(await page.locator('#toolya-cloud-gate').isVisible(),route+' gate remains visible');
   assert.equal(await page.evaluate(()=>{const gate=document.getElementById('toolya-cloud-gate');const r=gate.getBoundingClientRect();return document.elementFromPoint(Math.min(innerWidth-1,Math.max(0,r.left+r.width/2)),Math.min(innerHeight-1,Math.max(0,r.top+r.height/2)))?.closest('#toolya-cloud-gate')===gate}),true,route+' gate intercepts unauthenticated input');
   continue;
  }
  if(await page.locator('#settingsModal[aria-modal="true"]').isVisible().catch(()=>false))await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Einstellungen öffnen',exact:true}).click();await page.getByLabel('Begleiter',{exact:true}).waitFor({state:'visible'});assert.equal(await page.locator('.toolya-preferences').count(),1,route+' single preferences panel');await page.keyboard.press('Escape');await page.screenshot({path:'test-results/mascot-'+route+'-mobile.png',fullPage:true});assert.equal(await page.locator('.toolya-idle').isVisible(),false,route+' redundant strip hidden');if(await page.locator('.ty-tool-hero-mascot').count())await page.locator('.ty-tool-hero-mascot').screenshot({path:'test-results/mascot-'+route+'-detail.png'});
 }
 for(const route of ['/privacy.html','/legal.html','/mascots.html','/tools/wishes/dashboard.html','/tools/estate/heirs.html','/tools/estate/handover.html']){await page.goto(origin+route);await page.waitForFunction(()=>window.toolyaBuddy);assert.equal(await page.locator('.toolya-settings').count(),0,route);await page.getByRole('button',{name:'Einstellungen öffnen',exact:true}).click();await page.getByLabel('Begleiter',{exact:true}).waitFor({state:'visible'});assert.equal(await page.locator('.toolya-preferences').count(),1,route);await page.keyboard.press('Escape');}
 await page.goto(origin+'/tools/wishes/');assert(['/', '/index.html', '/tools/wishes/', '/tools/wishes/index.html', '/tools/wishes/public.html'].includes(new URL(page.url()).pathname),'wishlist entry stays within approved routes');await page.goto(origin+'/tools/wishes/public.html');await page.locator('#amazonUrl').waitFor();
 assert.equal(await page.locator('#homeNewWish,#homeNewList,.wishes-navigation').count(),0,'legacy private wishlist controls not shown');
 assert.equal(await page.locator('#search,#amazonUrl,#password').count(),3,'public wishlist controls present');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'public wishlist mobile overflow');
 await page.screenshot({path:'test-results/wishes-amazon-public-mobile.png',fullPage:true});
 await page.goto(origin+'/tools/wishes/');await page.waitForFunction(()=>window.toolyaBuddy);
 for(const emotion of ['happy','proud','curious','thoughtful','surprised','concerned','sad','shy','cheeky','sleepy','laughing','grateful','motivated','puzzled','celebrating','affectionate']){
  await page.evaluate(async emotion=>{const p=await import('/shared/toolya/platform.mjs');p.buddy.dismiss();p.previewEmotion(emotion)},emotion);await page.waitForFunction(()=>{const f=document.querySelector('.tb-message-box .ty-frame');return f&&!f.hidden});
 }
 const donations=page.locator('.ty-kofi-banner .ty-kofi-action');await donations.first().waitFor({state:'attached'});assert.equal(await donations.first().getAttribute('href'),'https://ko-fi.com/duhrrom');assert.equal(await page.locator('.ty-kofi-banner').count(),1,'exactly one donation banner');assert.equal(await page.evaluate(()=>document.querySelector('.ty-kofi-banner').nextElementSibling?.classList.contains('toolya-signature-footer')),true,'donation banner directly before footer');assert.equal(await page.locator('.ty-kofi-joke').isVisible(),true);assert.equal(await page.locator('.ty-kofi-mascot').isVisible(),true);assert.equal(await page.locator('.ty-kofi-banner').textContent().then(t=>t.includes('Freiwillig unterstützen · Ko-fi')),false,'unwanted small print removed');
 assert.deepEqual(errors,[],'runtime errors');assert.equal(blockedWrites,0,'no production writes attempted: '+blockedWriteUrls.join(', '));console.log('PASS: 12 tool routes, 320px reflow, both-character preferences, 16 emotions, atlas loading, touch/keyboard tickle, cooldown, critical and modal locks, reduced motion, Ko-fi and no runtime errors');
 }finally{for(const c of browser.contexts())for(const p of c.pages())if(!p.isClosed())await p.screenshot({path:'test-results/last-browser-state.png',fullPage:true}).catch(()=>{});await browser.close();server.close()}})().catch(e=>{console.error(e);process.exit(1)});
