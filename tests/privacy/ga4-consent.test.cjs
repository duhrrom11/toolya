const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../..');
const consent = fs.readFileSync(path.join(root, 'assets/toolya-consent.js'), 'utf8');
const GA = /google-analytics\.com|googletagmanager\.com|doubleclick\.net/;
test('GA4 opt-in lifecycle: reject, accept, withdraw, reload, cross-tab', { timeout: 120000 }, async () => {
  const server = http.createServer((req, res) => {
    if (req.url === '/assets/toolya-consent.js') { res.setHeader('content-type','text/javascript'); res.end(consent); return; }
    res.setHeader('content-type','text/html');
    res.end('<!doctype html><html><head><title>Toolya Test</title><script src="/assets/toolya-consent.js" defer></script></head><body><main>Test</main><footer></footer></body></html>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const requests = [];
  await context.route(/google-analytics\.com|googletagmanager\.com|doubleclick\.net/, route => {
    requests.push(route.request().url());
    // Fake Google script to avoid external network while verifying the real request initiation.
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
  });
  const url = 'http://127.0.0.1:' + server.address().port + '/';
  try {
    const page = await context.newPage();
    await page.goto(url);
    await assert.equal(await page.locator('#toolya-consent-panel').isVisible(), true);
    assert.equal(requests.length, 0, 'Google must not be requested before consent');
    await page.getByRole('button', { name: 'Ablehnen' }).click();
    assert.equal(requests.length, 0, 'Reject must not request Google');
    await page.reload();
    assert.equal(requests.length, 0, 'Rejected consent must persist');
    await page.locator('#toolya-consent-settings').click();
    await page.getByRole('button', { name: 'Akzeptieren' }).click();
    await page.waitForTimeout(200);
    assert.ok(requests.some(x => x.includes('gtag/js?id=G-11L9Y8YK7B')), 'Accept must request GA tag');
    await page.evaluate(() => { document.cookie = '_ga=GA1.1.test; path=/'; document.cookie = '_ga_TEST=test; path=/'; });
    await page.locator('#toolya-consent-settings').click();
    await Promise.all([page.waitForNavigation(), page.getByRole('button', { name: 'Ablehnen' }).click()]);
    assert.equal(await page.evaluate(() => document.cookie.includes('_ga=')), false, 'Withdrawal removes GA cookies');
    assert.equal(await page.evaluate(() => document.cookie.includes('_ga_TEST=')), false, 'Withdrawal removes GA property cookies');
    const before = requests.length;
    await page.reload();
    assert.equal(requests.length, before, 'Withdrawal must prevent further Google requests');
    const second = await context.newPage();
    await second.goto(url);
    await second.locator('#toolya-consent-settings').click();
    await second.getByRole('button', { name: 'Akzeptieren' }).click();
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => localStorage.getItem('toolya.analytics.consent.v1')), 'yes', 'Cross-tab consent must sync');
    // Current production policy permits consent-gated, data-minimized page
    // statistics on estate pages too. No keys, queries, fragments or form data.
    const sensitive = await context.newPage();
    for (const route of ['tools/estate/index.html?key=synthetic-private#synthetic-secret', 'tools/estate']) {
      const beforeSensitive = requests.length;
      await sensitive.goto(url + route);
      await sensitive.waitForFunction(() => window.dataLayer?.some(entry => entry[0] === 'event' && entry[1] === 'page_view'));
      assert.equal(requests.length, beforeSensitive + 1, 'Opt-in requests one analytics script on estate routes');
      const view = await sensitive.evaluate(() => Array.from(window.dataLayer).find(entry => entry[0] === 'event' && entry[1] === 'page_view')[2]);
      assert.equal(view.page_location, new URL(route, url).origin + new URL(route, url).pathname);
      assert.equal(view.page_referrer, '', 'Referrers must not carry sensitive links');
      assert.equal(JSON.stringify(view).includes('synthetic-private'), false, 'Private query values excluded');
      assert.equal(JSON.stringify(view).includes('synthetic-secret'), false, 'Private key fragments excluded');
      await sensitive.reload();
      assert.equal(requests.length, beforeSensitive + 2, 'Consent remains effective after reload');
    }
    for (const route of ['tools/estate/handover.html', 'tools/estate/print-key.html']) {
      const beforeLocal = requests.length;
      await sensitive.goto(url + route);
      await sensitive.reload();
      assert.equal(requests.length, beforeLocal, 'Local handover/print must not request Google with stored opt-in');
      assert.equal(await sensitive.evaluate(() => typeof window.dataLayer), 'undefined', 'No analytics events on local-only pages');
      assert.equal(await sensitive.locator('script[src*="googletagmanager"]').count(), 0);
    }
    await sensitive.close();
    await second.close();
    await page.close();
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
});
