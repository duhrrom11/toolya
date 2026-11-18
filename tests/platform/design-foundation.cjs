// Regression coverage for footer replacement, consent withdrawal access and shared branding.
// Application/analytics traffic is blocked; only the existing display CSS CDN is allowed.
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=process.cwd(),mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
 const server=http.createServer((req,res)=>{let target=new URL(req.url,'http://fixture').pathname;if(target.endsWith('/'))target+='index.html';const file=path.resolve(root,'.'+target);if(!file.startsWith(root+path.sep))return res.writeHead(403).end();try{res.setHeader('content-type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404).end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 let browser;
 try{browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({reducedMotion:'reduce'});
  await context.route('**/*',route=>{const u=new URL(route.request().url());return u.origin===origin||(u.hostname==='cdn.tailwindcss.com'&&route.request().method()==='GET')?route.continue():route.abort()});
  const page=await context.newPage();const galleryErrors=[];page.on('pageerror',e=>{if(new URL(page.url()).pathname==='/mascots.html')galleryErrors.push(e.message)});fs.mkdirSync('test-results',{recursive:true});
  for(const route of ['/index.html','/privacy.html','/legal.html','/mascots.html','/tools/wishes/public.html','/tools/estate/index.html','/tools/estate/heirs.html']){
   for(const width of [320,768,1440]){
    await page.setViewportSize({width,height:900});await page.emulateMedia({colorScheme:route.includes('/estate/')?'dark':'light'});await page.goto(origin+route);
    await page.locator('.toolya-signature-footer .ty-footer-links #toolya-consent-settings').waitFor();
    assert.equal(await page.locator('footer').count(),1,route+' single footer');
    assert.equal(await page.locator('#toolya-consent-settings').count(),1,'single consent link');
    if(await page.locator('#toolya-consent-panel').isVisible())await page.getByRole('button',{name:'Ablehnen',exact:true}).click();
    await page.locator('#toolya-consent-settings').click();assert(await page.locator('#toolya-consent-panel').isVisible(),'settings can be reopened after footer replacement');
    await page.getByRole('button',{name:'Ablehnen',exact:true}).click();
    const brand=await page.locator('.ty-footer-wordmark').evaluate(el=>({font:getComputedStyle(el).fontFamily,weight:getComputedStyle(el).fontWeight,text:el.textContent}));
    assert(brand.font.startsWith('Inter'),'shared existing brand font');assert.equal(brand.weight,'900');assert.equal(brand.text,'Toolya');
    if(route==='/index.html'){
     assert.equal(await page.locator('.b3-hub-logo').evaluate(el=>getComputedStyle(el).fontFamily),brand.font,'home and footer font match');
     const dashboardCard=page.locator('.b3-dashboard-card');
     assert.equal(await dashboardCard.getAttribute('href'),'dashboard/','dashboard card opens personal dashboard');
     assert.equal(await page.locator('.b3-hero-preview .b3-preview-list').count(),0,'favorite preview removed');
     assert.equal(await page.locator('.b3-hub-topbar .b3-hub-logo img').count(),0,'brand has no mascot');
     if(width<=790){
      assert(await dashboardCard.isVisible(),'Dashboard card must be visible at '+width);
      const rect=await dashboardCard.boundingBox();
      assert(rect&&rect.height>=74&&rect.x>=0&&rect.x+rect.width<=width+1,'Dashboard card fits mobile width '+width);
      const topbar=await page.locator('.b3-hub-topbar').evaluate(el=>({
       row:[...el.querySelectorAll('.b3-hub-logo,#userInfo,#settingsBtn')].map(node=>({top:node.getBoundingClientRect().top,bottom:node.getBoundingClientRect().bottom})),
       width:el.getBoundingClientRect().width
      }));
      assert(Math.max(...topbar.row.map(x=>x.top))-Math.min(...topbar.row.map(x=>x.top))<19,'brand/account/settings stay on one row at '+width);
     }
     const guides=page.locator('#anleitungen .ty-guide-card');
     assert.equal(await guides.count(),13,'all public guides are visible as links');
     const guideIds=await guides.evaluateAll(links=>links.map(a=>a.dataset.id));
     const toolIds=await page.locator('#toolsGrid .tool-card').evaluateAll(cards=>cards.map(card=>card.dataset.id));
     assert.deepEqual(guideIds,['dashboard',...toolIds],'guides follow tool cards and begin with Dashboard');
     const boxes=await guides.evaluateAll(links=>links.map(link=>{
      const bounds=link.getBoundingClientRect();
      return {left:bounds.left,right:bounds.right,height:bounds.height};
     }));
     assert(boxes.every(box=>box.left>=0&&box.right<=width+1&&box.height>=44),'guide cards fit the viewport and have large tap targets');
     assert.equal(boxes[0].left===boxes[1].left,width===320,'guide grid adapts to the viewport');
     await guides.first().focus();
     await page.keyboard.press('Tab');
     assert.equal(await guides.nth(1).evaluate(link=>document.activeElement===link&&getComputedStyle(link).outlineStyle!=='none'),true,'guide links show keyboard focus');
    }
    if(['/privacy.html','/legal.html','/mascots.html'].includes(route)){
     assert.equal(await page.locator('.ty-info-header').count(),1,'shared information header');
     assert.equal(await page.locator('h1').count(),1,'single main title');
     assert.equal(await page.locator('.ty-info-header [aria-current=page]').count(),1,'current page marked');
     assert.equal(await page.locator('.ty-info-brand').evaluate(el=>getComputedStyle(el).fontFamily),brand.font,'header/footer brand match');
     for(const a of await page.locator('.ty-info-header nav a').all())assert((await a.boundingBox()).height>=44);
     const infoContrasts=await page.locator('.ty-info-header nav a').evaluateAll(links=>{
      const rgb=s=>s.match(/[\d.]+/g).map(Number),lum=v=>v.slice(0,3).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4}).reduce((n,x,i)=>n+x*[.2126,.7152,.0722][i],0);
      const stops=getComputedStyle(document.querySelector('.ty-info-header')).backgroundImage.match(/rgba?\([^)]+\)/g).map(rgb);
      return links.map(a=>{const c=getComputedStyle(a),fg=lum(rgb(c.color)),overlay=rgb(c.backgroundColor),alpha=overlay[3]??1;
       return Math.min(...stops.map(stop=>{const bg=lum(stop.map((x,i)=>x*(1-alpha)+overlay[i]*alpha));return (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)}));});
     });assert(infoContrasts.every(r=>r>=4.5),'information navigation contrast '+JSON.stringify(infoContrasts));

     if(route!=='/mascots.html')assert.equal(await page.locator('.toolya-idle').isVisible(),false,'no separate companion card on legal text pages');
     assert((await page.locator('.toolya-settings-trigger').boundingBox()).height>=44);
     assert.equal(await page.locator('.ty-info-controls>.toolya-settings-trigger').count(),1,'settings button uses the information navigation slot');
     await page.locator('.toolya-settings-trigger').click();assert(await page.locator('#toolya-display-settings').isVisible());
     await page.getByRole('button',{name:'Einstellungen schließen',exact:true}).click();
     if(route==='/mascots.html'){
      assert.equal(await page.locator('#feelings button').count(),16);
      await page.locator('#feelings button').first().click();assert(await page.locator('.tb-message-box').isVisible(),'gallery emotion preview still works');
      await page.locator('#outfit').selectOption('5');assert.equal(await page.locator('#outfit').inputValue(),'5');
      await page.waitForFunction(()=>document.querySelector('.toolya-buddy')?.dataset.pose==='idle');
      assert(await page.locator('.toolya-idle').isVisible(),'outfit preview returns to visible companion');assert.deepEqual(galleryErrors,[],'gallery previews have no JavaScript errors');
     }
     await page.locator('#info-main h1').click();await page.screenshot({path:'test-results/info-'+route.slice(1,-5)+'-'+width+'.png'});
    }
    if(route.includes('/estate/')){
     assert.equal(await page.locator('html').evaluate(el=>getComputedStyle(el).colorScheme),'light','estate stays light with dark OS preference');
     assert(await page.locator(route.endsWith('heirs.html')?'#access-panel':'#login-panel').isVisible(),'actual estate route rendered');
     if(route.endsWith('heirs.html'))assert(await page.locator('.estate-key-reminder').isVisible(),'key reminder preserved in main content');
     else assert(await page.locator('#owner-app').isHidden(),'private owner UI remains gated');
     const contrast=await page.locator(route.endsWith('heirs.html')?'#open-form button':'#login-form button[type=submit]').evaluate(el=>{
      const c=getComputedStyle(el),rgb=value=>value.match(/[\d.]+/g).slice(0,3).map(Number);
      const lum=values=>values.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
      const fg=lum(rgb(c.color)),colors=c.backgroundImage.match(/rgba?\([^)]+\)/g)||[c.backgroundColor];
      return Math.min(...colors.map(value=>{const bg=lum(rgb(value));return (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)}));
     });
     assert(contrast>=4.5,'estate primary-button text contrast '+contrast);
     await page.locator(route.endsWith('heirs.html')?'#first-key':'#email').focus();await page.keyboard.press('Tab');
     assert(await page.evaluate(()=>getComputedStyle(document.activeElement).outlineStyle!=='none'&&parseFloat(getComputedStyle(document.activeElement).outlineWidth)>=2),'keyboard focus remains visible');
     await page.locator(route.endsWith('heirs.html')?'#access-panel h2':'#login-title').first().click();
     await page.screenshot({path:'test-results/design-estate-'+(route.endsWith('heirs.html')?'trustee':'login')+'-'+width+'.png',fullPage:false});
    }
    const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>innerWidth+1&&getComputedStyle(e).position!=='fixed'}).slice(0,8).map(e=>({tag:e.tagName,id:e.id,class:e.className}))}));
    if(layout.scroll>width+1){await page.screenshot({path:'test-results/design-failure.png',fullPage:true});throw Error(route+' fits '+width+': '+JSON.stringify(layout));}
    const footer=page.locator('.toolya-signature-footer');await footer.scrollIntoViewIfNeeded();
    assert(await footer.evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1}),'footer fits viewport');
    await page.screenshot({path:'test-results/design-'+route.slice(1,-5).replaceAll('/','-')+'-'+width+'.png',fullPage:false});
   }
  }
  // Force the opposite initialization order: shared footer exists before consent.
  await page.route('**/assets/toolya-consent.js*',route=>route.fulfill({contentType:'text/javascript',body:''}));
  await page.goto(origin+'/index.html');await page.locator('.toolya-signature-footer').waitFor();await page.unroute('**/assets/toolya-consent.js*');
  await page.addScriptTag({url:origin+'/assets/toolya-consent.js'});
  await page.locator('.ty-footer-links #toolya-consent-settings').waitFor();
  await page.locator('#toolya-consent-settings').click();assert(await page.locator('#toolya-consent-panel').isVisible(),'late consent initialization works');
  for(const character of ['purple','turquoise']){
   await page.evaluate(character=>{localStorage.setItem('helferlein-toolya-preferences-v1',JSON.stringify({character}));},character);
   await page.reload();await page.locator('.toolya-signature-footer .ty-footer-wordmark').waitFor();
   assert.equal(await page.locator('.toolya-signature-footer img').count(),0,'footer has no mascot regardless of '+character);
   assert.equal(await page.evaluate(()=>toolyaBuddy.character),character,'selected companion still follows '+character);
  }
  console.log('Design foundation: 7 routes × 3 widths; both consent initialization orders; both characters passed. Production application/analytics requests blocked.');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
