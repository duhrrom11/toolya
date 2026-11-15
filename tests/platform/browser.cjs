// Every Supabase, mail, analytics and non-static external request is blocked.
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve('.'),routes=['budget','moving','housemates','estate','car','pet-health','parking','loans','plants','meters','baking','wishes'];
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
(async()=>{const server=http.createServer((req,res)=>{let url=new URL(req.url,'http://local').pathname;if(url.endsWith('/'))url+='index.html';const file=path.resolve(root,'.'+decodeURI(url));if(!file.startsWith(root+'/'))return res.writeHead(403).end();try{res.setHeader('content-type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404).end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin='http://127.0.0.1:'+server.address().port,staticHosts=new Set(['cdn.tailwindcss.com','unpkg.com','cdn.jsdelivr.net','cdnjs.cloudflare.com','www.gstatic.com','fonts.googleapis.com','fonts.gstatic.com']);
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox']});fs.mkdirSync('test-results',{recursive:true});
 try{const context=await browser.newContext({viewport:{width:320,height:812},isMobile:true,hasTouch:true});let blockedWrites=0;
 const guard=r=>{const u=new URL(r.request().url());if(u.origin===origin&&r.request().method()==='GET')return r.continue();if(staticHosts.has(u.hostname)&&r.request().method()==='GET')return r.continue();if(r.request().method()!=='GET')blockedWrites++;return r.abort()};await context.route('**/*',guard);
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/tools/plants/');await page.waitForFunction(()=>window.toolyaBuddy);await page.evaluate(()=>{toolyaBuddy.dismiss();toolyaBuddy.setMotion('off')});
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
  assert.equal(await page.locator('.toolya-settings').count(),0,route+' no standalone settings');await page.getByRole('button',{name:'Einstellungen öffnen',exact:true}).click();await page.getByLabel('Begleiter',{exact:true}).waitFor({state:'visible'});assert.equal(await page.locator('.toolya-preferences').count(),1,route+' single preferences panel');await page.keyboard.press('Escape');await page.screenshot({path:'test-results/mascot-'+route+'-mobile.png',fullPage:true});assert.equal(await page.locator('.toolya-idle').isVisible(),false,route+' redundant strip hidden');await page.locator('.ty-tool-hero-mascot').screenshot({path:'test-results/mascot-'+route+'-detail.png'});
 }
 for(const route of ['/privacy.html','/legal.html','/mascots.html','/tools/wishes/dashboard.html','/tools/estate/heirs.html','/tools/estate/handover.html']){await page.goto(origin+route);await page.waitForFunction(()=>window.toolyaBuddy);assert.equal(await page.locator('.toolya-settings').count(),0,route);await page.getByRole('button',{name:'Einstellungen öffnen',exact:true}).click();await page.getByLabel('Begleiter',{exact:true}).waitFor({state:'visible'});assert.equal(await page.locator('.toolya-preferences').count(),1,route);await page.keyboard.press('Escape');}
 await page.goto(origin+'/tools/wishes/');await page.waitForFunction(()=>document.querySelector('.wishes-navigation'));
 assert.equal(await page.locator('.wishes-navigation a').count(),4);
 assert.equal(await page.locator('.wishlist-hub-nav,.wishlist-welcome').count(),0);
 for(const [name,area] of [['Entdecken','discover'],['Geschenke','gifts'],['Konto','account'],['Meine Listen','lists']]){
  await page.locator('.wishes-navigation').getByRole('link',{name,exact:true}).click();
  assert.equal(await page.locator('[data-wishes-area]:visible').count(),1);
  assert.equal(await page.locator('[data-wishes-area="'+area+'"]').isVisible(),true);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'workspace mobile overflow '+area);
 }
 await page.goto(origin+'/tools/wishes/#giftFinder');await page.waitForFunction(()=>document.querySelector('[data-wishes-area="discover"]')?.hidden===false);
 assert.equal(await page.locator('#giftFinder').isVisible(),true,'deep link opens finder disclosure');
 // Isolated UI state only: never sign into or write to production.
 await page.evaluate(()=>{document.getElementById('editor').hidden=false;document.getElementById('listsDashboard').hidden=false});
 await page.locator('.wishes-navigation').getByRole('link',{name:'Meine Listen',exact:true}).click();
 await page.locator('#wishNote').fill('Isolated draft');
 await page.locator('.wishes-navigation').getByRole('link',{name:'Konto',exact:true}).click();
 assert.equal(await page.locator('#handle').isVisible(),true,'profile under account');
 await page.locator('.wishes-navigation').getByRole('link',{name:'Meine Listen',exact:true}).click();
 assert.equal(await page.locator('#wishNote').inputValue(),'Isolated draft','switching areas preserves drafts');
 await page.screenshot({path:'test-results/wishes-simplified-lists-mobile.png',fullPage:true});
 await page.goto(origin+'/tools/wishes/');await page.waitForFunction(()=>window.toolyaBuddy);
 for(const emotion of ['happy','proud','curious','thoughtful','surprised','concerned','sad','shy','cheeky','sleepy','laughing','grateful','motivated','puzzled','celebrating','affectionate']){
  await page.evaluate(async emotion=>{const p=await import('/shared/toolya/platform.mjs');p.buddy.dismiss();p.previewEmotion(emotion)},emotion);await page.waitForFunction(()=>{const f=document.querySelector('.tb-message-box .ty-frame');return f&&!f.hidden});
 }
 const donations=page.locator('.ty-kofi-banner .ty-kofi-action');await donations.first().waitFor({state:'attached'});assert.equal(await donations.first().getAttribute('href'),'https://ko-fi.com/duhrrom');assert.equal(await page.locator('.ty-kofi-banner').count(),1,'exactly one donation banner');assert.equal(await page.evaluate(()=>document.querySelector('.ty-kofi-banner').nextElementSibling?.classList.contains('toolya-signature-footer')),true,'donation banner directly before footer');assert.equal(await page.locator('.ty-kofi-joke').isVisible(),true);assert.equal(await page.locator('.ty-kofi-mascot').isVisible(),true);assert.equal(await page.locator('.ty-kofi-banner').textContent().then(t=>t.includes('Freiwillig unterstützen · Ko-fi')),false,'unwanted small print removed');
 assert.deepEqual(errors,[],'runtime errors');assert.equal(blockedWrites,0,'no production writes attempted');console.log('PASS: 12 tool routes, 320px reflow, both-character preferences, 16 emotions, atlas loading, touch/keyboard tickle, cooldown, critical and modal locks, reduced motion, Ko-fi and no runtime errors');
 }finally{for(const c of browser.contexts())for(const p of c.pages())if(!p.isClosed())await p.screenshot({path:'test-results/last-browser-state.png',fullPage:true}).catch(()=>{});await browser.close();server.close()}})().catch(e=>{console.error(e);process.exit(1)});
