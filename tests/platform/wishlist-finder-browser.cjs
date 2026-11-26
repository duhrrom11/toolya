/* Isolated admin flow. The browser uses only local pages and intercepted API responses. */
const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const root = process.cwd();
  const mime = { '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
  const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + req.url.split('?')[0]);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.setHeader('Content-Type', mime[path.extname(file)] || 'text/html');
    res.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/usr/bin/google-chrome',
      args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    const calls = [];
    let status = 'new';
    let allowAdmin = true;
    const row = {
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Isolierter Verein',
      wishlist_url: 'https://www.amazon.de/hz/wishlist/ls/ABC?tag=duhrrom-21',
      logo_url: '',
      email: 'fixture@example.org',
      source_url: 'https://example.org/',
      country: 'Luxemburg',
      found_at: '2026-11-17T00:00:00Z'
    };
    await page.addInitScript(() => {
      Object.defineProperty(window, 'supabase', {
        configurable: true,
        value: {
          createClient: () => ({
            auth: {
              getSession: async () => ({ data: { session: { access_token: 'isolated-fixture' } } }),
              onAuthStateChange: () => {}
            }
          })
        },
        writable: false
      });
    });
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.origin === origin) return route.continue();
      if (url.origin !== 'https://yheogmeaosuigyaxkwth.supabase.co') return route.abort();
      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
      };
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      if (!allowAdmin) return route.fulfill({ status: 403, headers, json: { error: 'Zugriff verweigert.' } });
      if (url.pathname.endsWith('/admin-stats')) return route.fulfill({ headers, json: { sources: [], metrics: [] } });
      const body = JSON.parse(route.request().postData() || '{}');
      calls.push(body);
      if (body.action === 'dismiss') {
        status = 'dismissed';
        return route.fulfill({ headers, json: { ok: true, dismissed: 1 } });
      }
      if (body.action === 'restore') {
        status = 'new';
        return route.fulfill({ headers, json: { ok: true } });
      }
      if (body.action === 'publish') {
        status = 'published';
        return route.fulfill({ headers, json: { published: 1, duplicates: 0 } });
      }
      return route.fulfill({ headers, json: { configured: false, rows: body.status === status || body.status === 'all' && status !== 'dismissed' ? [{ ...row, status }] : [], health: { total: 66, http_reachable: 4, review: 1, unknown: 2, not_checked: 59 }, healthReview: [{ profile_id: row.id, name: 'Isolierter Verein', http_status: 404 }] } });
    });

    const checkNavigation = async (linkName, evidence, extraLinkName) => {
      const backLink = page.getByRole('link', { name: linkName, exact: true });
      for (const width of [320, 768, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        const layout = await page.evaluate(() => ({
          width: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          overflowing: [...document.querySelectorAll('body *')]
            .filter(element => !element.closest('.indexing-scroll') && element.getBoundingClientRect().right > innerWidth + 1)
            .slice(0, 10)
            .map(element => element.id || element.className || element.tagName)
        }));
        assert.ok(layout.scrollWidth <= width, evidence + ': ' + JSON.stringify(layout));
        assert.ok((await backLink.boundingBox()).height >= 44, 'admin navigation has a 44 px target');
        if (extraLinkName) {
          const source = page.getByRole('link', { name: extraLinkName, exact: true });
          assert.ok((await source.boundingBox()).height >= 44, 'source link has a 44 px target');
        }
        await backLink.focus();
        assert.equal(await backLink.evaluate(link => getComputedStyle(link).outlineStyle), 'solid');
        await page.screenshot({ path: 'test-results/' + evidence + '-' + width + '.png' });
      }
    };

    await page.goto(origin + '/admin-stats-dashboard/wishlist-finder.html');
    await page.locator('#finder').waitFor({ state: 'visible' });
    assert.match(await page.locator('#healthStatus').innerText(), /66 erfasst.*1 zur manuellen Prüfung/);
    assert.match(await page.locator('#healthReview a').innerText(), /Isolierter Verein.*HTTP 404/);
    assert.equal(await page.locator('#start').isDisabled(), true);
    await page.waitForFunction(() => {
      const src = document.querySelector('.finder-row img')?.getAttribute('src') || '';
      return src.includes('toolya_wishlist_turquoise');
    });
    await checkNavigation('← Admin-Dashboard', 'finder-navigation', 'Quelle ↗');
    await page.getByRole('button', {name:'Fund ausblenden: Isolierter Verein'}).click();
    await page.locator('.finder-row').waitFor({state:'detached'});
    assert.equal(calls.filter(call => call.action === 'dismiss').length,1);
    await page.locator('#filter').selectOption('dismissed');
    await page.getByRole('button', {name:'Fund wieder anzeigen: Isolierter Verein'}).click();
    await page.locator('#filter').selectOption('new');
    await page.locator('.finder-row').waitFor({state:'visible'});
    assert.equal(calls.filter(call => call.action === 'restore').length,1);
    await page.locator('#publish').click();
    assert.match(await page.locator('#result').innerText(), /Noch keine Wunschlisten ausgewählt/);
    await page.locator('#selectAll').click();
    assert.match(await page.locator('#selection').innerText(), /1 von 1 sichtbaren neuen Wunschlisten ausgewählt/);

    // Actual selected-row downloads, no discovery API writes or private fixture mutation.
    const {parseCsv}=await import('../../supabase/functions/wishlist-discovery/model.mjs');
    const exportCalls=calls.length;
    const expected={name:row.name,type:'',logo_url:row.logo_url,wishlist_url:row.wishlist_url,email:row.email,source_url:row.source_url,country:row.country,found_at:row.found_at,status:'new'};
    const baseline={};
    for(const lang of ['en','de']){
      await page.locator('[data-admin-locale="'+lang+'"]').click();
      assert.equal(await page.locator('[data-admin-locale="'+lang+'"]').getAttribute('aria-pressed'),'true');
      for(const kind of ['csv','json']){
        const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#'+kind).click()]);
        assert.equal(download.suggestedFilename(),'toolya-wunschlisten.'+kind);
        const content=fs.readFileSync(await download.path(),'utf8');
        assert.deepEqual(kind==='csv'?parseCsv(content):JSON.parse(content),[expected]);
        if(lang==='en')baseline[kind]=content;else assert.equal(content,baseline[kind]);
      }
      assert.equal(await page.locator('.finder-row input[type=checkbox]').isChecked(),true);
    }
    assert.equal(calls.length,exportCalls);
    console.log('Admin CSV/JSON actual downloads passed in DE/EN with stable schema and no API calls.');

    page.once('dialog', async dialog => {
      assert.match(dialog.message(), /Namens-\/Organisationszuordnung/);
      await dialog.accept();
    });
    await page.locator('#publish').click();
    await page.waitForFunction(() => document.getElementById('result').textContent.includes('1 Wunschlisten veröffentlicht'));
    assert.equal(calls.filter(call => call.action === 'publish').length, 1);
    assert.equal(await page.locator('#publish').isDisabled(), false);
    await page.locator('#publish').click();
    assert.match(await page.locator('#result').innerText(), /Noch keine Wunschlisten ausgewählt/);
    await page.reload();
    await page.locator('#finder').waitFor({ state: 'visible' });
    await page.locator('#filter').selectOption('published');
    assert.match(await page.locator('.finder-row').innerText(), /Veröffentlicht/);

    await page.goto(origin + '/admin-stats-dashboard/index.html');
    await page.locator('#panel').waitFor({ state: 'visible' });
    await checkNavigation('← Mein Dashboard', 'stats-navigation');
    assert.match(await page.locator('#tool-ranking').innerText(), /Noch keine auswertbaren Tool-Starts/);

    allowAdmin = false;
    await page.reload();
    await page.getByText('Zugriff verweigert:', { exact: false }).waitFor();
    assert.equal(await page.locator('#panel').isVisible(), false);
    await page.goto(origin + '/admin-stats-dashboard/wishlist-finder.html');
    await page.getByText('Zugriff verweigert.', { exact: true }).waitFor();
    assert.equal(await page.locator('#finder').isVisible(), false);
    console.log('Isolated admin UI: responsive navigation, denied access, empty state and publication fixture passed.');

    // Public settings and dashboard share the real browser presentation. No external
    // requests are allowed in this separate fresh context, including service workers.
    const settingsContext=await browser.newContext({serviceWorkers:'block'});
    try{
      await settingsContext.route('**/*', route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
      const settingsPage=await settingsContext.newPage();
      const readStyle=locator=>locator.evaluate(node=>{
        const s=getComputedStyle(node);
        return Object.fromEntries(['display','paddingTop','paddingRight','paddingBottom','paddingLeft','borderTopWidth','borderTopColor','borderRadius','backgroundColor','color','fontSize','fontWeight','minHeight','lineHeight'].map(k=>[k,s[k]]));
      });
      for(const width of [320,768,1440]){
        await settingsPage.setViewportSize({width,height:900});
        let reference;
        for(const [url,trigger,backupId] of [
          ['/dashboard/index.html','#settingsBtn',null],
          ['/tools/wishes/public.html','#wishlistSettingsBtn','#wishlistBackupSettings']
        ]){
          await settingsPage.goto(origin+url);
          const modal=settingsPage.locator('#settingsModal');
          await modal.locator('.ty-pwa-settings').waitFor({state:'attached'});
          await settingsPage.locator(trigger).click();
          await modal.waitFor({state:'visible'});
          const backup=backupId?modal.locator(backupId):modal.locator('details[data-settings-section=backup]');
          const summary=backup.locator(':scope > summary');
          const content=backup.locator(':scope > .ty-unified-settings-content');
          assert.equal(await backup.count(),1,'exactly one backup accordion');
          assert.equal(await backup.getAttribute('open'),null);
          assert.equal(await content.isVisible(),false);
          assert.equal(await summary.innerText(),'Datensicherung');
          const styles={group:await readStyle(backup),summary:await readStyle(summary)};
          if(!reference)reference=styles;
          else assert.deepEqual(styles,reference,'shared backup presentation at '+width+'px');
          assert.ok((await summary.boundingBox()).height>=44,'backup target at least 44px');
          await summary.focus();
          await summary.press('Enter');
          assert.equal(await content.isVisible(),true,'keyboard opens backup');
          assert.equal(await content.locator('a[href="/?settings=1#datensicherung"]').count(),1);
          const fits=await modal.locator('.ty-unified-settings-panel').evaluate(p=>p.scrollWidth<=p.clientWidth+1 && p.getBoundingClientRect().width<=innerWidth);
          assert.equal(fits,true,'settings fit viewport '+width);
          await summary.click();
          assert.equal(await content.isVisible(),false,'pointer closes backup');
          for(const id of ['loginEmail','loginPassword','forgotPassword','registerUser','loginSubmit','logoutUser','passwordRecoveryPanel'])assert.equal(await modal.locator('#'+id).count(),1,'preserve '+id);
          assert.equal(await modal.locator('details.toolya-appearance').count(),1);
          assert.equal(await modal.locator('.ty-pwa-settings').count(),1);
          await settingsPage.screenshot({path:'test-results/settings-'+(backupId?'wishlist':'dashboard')+'-'+width+'.png'});
          await modal.locator('#closeSettingsBtn').click();
          assert.equal(await modal.isVisible(),false);
        }
      }
      console.log('PASS: real dashboard and Wishlist settings, shared styles, 320/768/1440px, keyboard/pointer backup accordion and preserved account controls; no external requests');
    }finally{await settingsContext.close();}

  } finally {
    await browser?.close();
    server.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
