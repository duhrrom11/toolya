// Isolated local dashboard smoke: exercises the PR's actual browser modules without touching Supabase.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

(async()=>{
  const root=path.resolve(__dirname,'../..');
  const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
  const server=http.createServer(async(req,res)=>{
    const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/\/$/,'/index.html'));
    if(!p.startsWith(root+path.sep)){res.writeHead(403).end();return}
    try{const data=await fs.readFile(p);res.writeHead(200,{'content-type':mime[path.extname(p)]||'application/octet-stream'});res.end(data)}
    catch{res.writeHead(404).end()}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  let browser;
  try{
    browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox']});
    const context=await browser.newContext({viewport:{width:375,height:812}});
    await context.route('**/*',route=>{
      const request=route.request();
      if(new URL(request.url()).origin!==origin)return route.abort();
      return route.continue();
    });
    const page=await context.newPage();
    const response=await page.goto(origin+'/dashboard/',{waitUntil:'domcontentloaded'});
    assert.equal(response.status(),200);
    await page.waitForFunction(()=>document.querySelector('#sync-status')?.textContent==='Nur auf diesem Gerät',{timeout:15000});
    assert.equal(await page.locator('#import-local').isHidden(),true);
    await page.locator('#task-text').fill('Isolierter Cloud-Sprint-Test');
    await page.locator('#task-form button[type=submit]').click();
    assert.equal(await page.locator('#task-count').innerText(),'1');
    await page.getByRole('checkbox',{name:'Aufgabe Isolierter Cloud-Sprint-Test erledigt'}).check();
    assert.equal(await page.locator('#task-count').innerText(),'0');
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelector('#sync-status')?.textContent==='Nur auf diesem Gerät');
    assert.equal(await page.getByRole('checkbox',{name:'Aufgabe Isolierter Cloud-Sprint-Test erledigt'}).isChecked(),true);
    await page.getByRole('button',{name:'Aufgabe entfernen: Isolierter Cloud-Sprint-Test'}).click();
    assert.equal(await page.locator('#task-count').innerText(),'0');
    await page.locator('#reminder-text').fill('Lokale Erinnerung');
    await page.locator('#reminder-date').fill('2026-11-25T12:00');
    await page.locator('#reminder-form button[type=submit]').click();
    assert.equal(await page.locator('#reminder-count').innerText(),'1');
    await page.getByRole('button',{name:'Erinnerung entfernen: Lokale Erinnerung'}).click();
    assert.equal(await page.locator('#reminder-count').innerText(),'0');
    for(const width of [320,375,768,1280]){
      await page.setViewportSize({width,height:900});
      const scroll=await page.evaluate(()=>document.documentElement.scrollWidth);
      assert.ok(scroll<=width+1,'Horizontal overflow at '+width+': '+scroll);
    }
    console.log('PASS: local dashboard guest lifecycle, persistence and responsive widths');
    await context.close();
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(err=>{console.error(err);process.exitCode=1});
