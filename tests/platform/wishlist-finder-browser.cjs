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
      if (body.action === 'publish') {
        status = 'published';
        return route.fulfill({ headers, json: { published: 1, duplicates: 0 } });
      }
      return route.fulfill({ headers, json: { configured: false, rows: [{ ...row, status }], health: { total: 66, http_reachable: 4, review: 1, unknown: 2, not_checked: 59 }, healthReview: [{ profile_id: row.id, name: 'Isolierter Verein', http_status: 404 }] } });
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
    assert.match(await page.locator('.finder-row img').getAttribute('src'), /toolya_wishlist_turquoise/);
    await checkNavigation('← Admin-Dashboard', 'finder-navigation', 'Quelle ↗');
    await page.locator('#publish').click();
    assert.match(await page.locator('#result').innerText(), /Noch keine Wunschlisten ausgewählt/);
    await page.locator('#selectAll').click();
    assert.match(await page.locator('#selection').innerText(), /1 von 1 sichtbaren neuen Wunschlisten ausgewählt/);
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
  } finally {
    await browser?.close();
    server.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
