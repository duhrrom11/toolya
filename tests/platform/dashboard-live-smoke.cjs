// Production read-only browser smoke: all state changes stay in an isolated browser profile.
// Never send POST/PUT/PATCH/DELETE or requests to third-party services.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const origin = 'https://toolya.app';
  const browser = await chromium.launch({headless:true, executablePath:process.env.CHROME_PATH || '/usr/bin/google-chrome', args:['--no-sandbox']});
  try {
    const context = await browser.newContext({viewport:{width:375,height:812}});
    let blockedWrites = 0;
    await context.route('**/*', route => {
      const request = route.request();
      const url = new URL(request.url());
      if (!['GET','HEAD'].includes(request.method())) {
        blockedWrites++;
        return route.abort();
      }
      if (url.origin !== origin) return route.abort();
      return route.continue();
    });
    const page = await context.newPage();
    const response = await page.goto(origin+'/dashboard/', {waitUntil:'domcontentloaded',timeout:30000});
    assert.equal(response.status(),200,'Dashboard must return HTTP 200');
    await page.locator('#buddy-toggle[aria-pressed="true"]').waitFor();
    assert.match(await page.locator('#welcome-heading').innerText(),/Dein Alltag/);
    assert.equal(await page.locator('#task-count').innerText(),'0','Fresh isolated browser starts without tasks');

    // Task lifecycle: create, mark complete, reload (local persistence), remove.
    await page.locator('#task-text').fill('Isolierter Browsercheck');
    await page.locator('#task-form button[type="submit"]').click();
    assert.equal(await page.locator('#task-count').innerText(),'1');
    await page.getByRole('checkbox',{name:'Aufgabe Isolierter Browsercheck erledigt'}).check();
    assert.equal(await page.locator('#task-count').innerText(),'0');
    await page.reload({waitUntil:'domcontentloaded'});
    assert.equal(await page.getByRole('checkbox',{name:'Aufgabe Isolierter Browsercheck erledigt'}).isChecked(),true);
    await page.getByRole('button',{name:'Aufgabe entfernen: Isolierter Browsercheck'}).click();
    assert.equal(await page.locator('#tasks li').filter({hasText:'Isolierter Browsercheck'}).count(),0);

    // Reminder lifecycle (localStorage only).
    await page.locator('#reminder-text').fill('Isolierte Erinnerung');
    await page.locator('#reminder-date').fill(new Date(Date.now()+86400000).toISOString().slice(0,16));
    await page.locator('#reminder-form button[type="submit"]').click();
    assert.equal(await page.locator('#reminder-count').innerText(),'1');
    await page.getByRole('button',{name:'Erinnerung entfernen: Isolierte Erinnerung'}).click();
    assert.equal(await page.locator('#reminder-count').innerText(),'0');

    // Companion preference persists only in this temporary browser context.
    await page.locator('#buddy-toggle').click();
    assert.equal(await page.locator('#buddy-toggle').getAttribute('aria-pressed'),'false');
    await page.reload({waitUntil:'domcontentloaded'});
    assert.equal(await page.locator('#buddy-toggle').getAttribute('aria-pressed'),'false');
    await page.locator('#buddy-toggle').click();
    await page.evaluate(() => localStorage.setItem('helferlein-toolya-preferences-v1',JSON.stringify({character:'purple'})));
    await page.reload({waitUntil:'domcontentloaded'});
    assert.match(await page.locator('#dashboard-mascot').getAttribute('src'),/purple/);

    for (const width of [320,375,768,1280]) {
      await page.setViewportSize({width,height:900});
      const dimensions = await page.evaluate(() => ({viewport:innerWidth,document:document.documentElement.scrollWidth}));
      assert.ok(dimensions.document <= dimensions.viewport+1,'Dashboard horizontal overflow: '+JSON.stringify(dimensions));
    }
    assert.equal(blockedWrites,0,'Dashboard must not issue network writes');
    console.log('PASS: live dashboard interactive smoke; all writes isolated to ephemeral browser localStorage');
    await context.close();
  } finally {
    await browser.close();
  }
})().catch(error => {console.error(error);process.exitCode=1;});
