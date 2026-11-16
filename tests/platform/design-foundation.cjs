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
  const page=await context.newPage();fs.mkdirSync('test-results',{recursive:true});
  for(const route of ['/index.html','/privacy.html','/legal.html','/tools/wishes/public.html','/tools/estate/index.html','/tools/estate/heirs.html']){
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
    if(route==='/index.html')assert.equal(await page.locator('.b3-hub-logo').evaluate(el=>getComputedStyle(el).fontFamily),brand.font,'home and footer font match');
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
   await page.reload();await page.locator('.ty-footer-mascot').waitFor();
   assert((await page.locator('.ty-footer-mascot').getAttribute('src')).includes(character),'footer follows '+character);
  }
  console.log('Design foundation: 6 routes × 3 widths; both consent initialization orders; both characters passed. Production application/analytics requests blocked.');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
