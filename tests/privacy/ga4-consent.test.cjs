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
    assert.equal(await page.locator('#toolya-consent-panel').isVisible(), false, 'Rejected banner stays hidden after reload');
    assert.match(await page.evaluate(() => document.cookie), /toolya_analytics_consent=no/, 'First-party cookie preserves rejection');
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
    const sensitive = await context.newPage();
    await sensitive.goto(url + 'tools/estate/index.html');
    const beforeSensitive = requests.length;
    await sensitive.reload();
    assert.equal(requests.length, beforeSensitive, 'Sensitive estate pages must never request Google, even with opt-in');
    await sensitive.goto(url + 'tools/estate');
    const beforeExact = requests.length;
    await sensitive.reload();
    assert.equal(requests.length, beforeExact, 'Exact estate route must never request Google');
    await sensitive.close();
    await second.close();
    await page.close();
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
});
