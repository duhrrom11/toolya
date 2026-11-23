'use strict';

// Browser acceptance for all generated functional templates via the real loopback preview.
// Never uses live accounts, remote APIs, database services or production data.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const {generateTool} = require('../../scripts/create-tool.cjs');
const {createPreviewServer} = require('../../scripts/preview-tool.cjs');
const root = path.resolve(__dirname, '../..');

let browser;
async function main() {
  browser = await chromium.launch({
    headless:true, executablePath:process.env.CHROME_PATH || '/usr/bin/google-chrome',
    args:['--no-sandbox']
  });
  for (const template of ['counter','percentage','checklist']) {
    const slug = 'ci-builder-browser-' + template;
    const folder = path.join(root,'tools',slug);
    let server, context;
    let created = false;
    try {
      const result = generateTool({
        repoRoot:root,slug,template,title:'Test ' + template,
        description:'Isolierte Browservorschau des Toolya Tool Builders.',
        outfit:'plants'
      });
      created = result.created;
      server = createPreviewServer({repoRoot:root,slug});
      await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
      const origin = 'http://127.0.0.1:' + server.address().port;
      context = await browser.newContext({viewport:{width:320,height:812},reducedMotion:'reduce'});
      await context.addInitScript(() => {
        localStorage.setItem('helferlein-toolya-preferences-v1',
          JSON.stringify({character:'purple',motion:'off'}));
      });
      const external = [], writes = [], pageErrors = [];
      await context.route('**/*', route => {
        const request = route.request(), url = new URL(request.url());
        if (request.method() !== 'GET') {
          writes.push(request.method() + ' ' + url.pathname);
          return route.abort();
        }
        if (url.origin !== origin) {
          external.push(url.href);
          return route.abort();
        }
        return route.continue();
      });
      const page = await context.newPage();
      page.on('pageerror', error => pageErrors.push(error.message));
      await page.goto(origin+'/tools/'+slug+'/',{waitUntil:'domcontentloaded'});
      await page.locator('.ty-tool-hero[data-character="purple"]').waitFor();
      await page.locator('.toolya-signature-footer').waitFor();
      assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'),
        'noindex,nofollow');
      if (template === 'counter') {
        await page.locator('#counter-plus').click();
        assert.equal(await page.locator('#counter-value').textContent(),'1');
        await page.locator('#counter-minus').click();
        assert.equal(await page.locator('#counter-value').textContent(),'0');
        await page.locator('#counter-minus').click();
        assert.equal(await page.locator('#counter-value').textContent(),'0');
      } else if (template === 'percentage') {
        await page.locator('#percentage-part').fill('25');
        await page.locator('#percentage-total').fill('100');
        await page.locator('#percentage-form button').click();
        assert.match(await page.locator('#percentage-result').textContent(),/25/);
        await page.locator('#percentage-total').fill('0');
        await page.locator('#percentage-form button').click();
        assert.equal(await page.locator('#percentage-result').textContent(),'–');
      } else {
        await page.locator('#checklist-input').fill('<svg onload=alert(1)>');
        await page.locator('#checklist-form button').click();
        assert.equal(await page.locator('#checklist-items li span').textContent(),
          '<svg onload=alert(1)>');
        assert.equal(await page.locator('#checklist-items svg').count(),0);
        await page.locator('#checklist-items li button').click();
        assert.equal(await page.locator('#checklist-items li').count(),0);
      }
      assert.deepEqual(writes,[],template+': no writes');
      assert.deepEqual(pageErrors,[],template+': no client errors');
      assert.ok(external.every(url => !url.includes('supabase.co')),
        template+': no attempted production Supabase connection');
      process.stdout.write('PASS: '+template+' generated preview (local browser)\n');
    } finally {
      if (context) await context.close().catch(()=>{});
      if (server) await new Promise(resolve=>server.close(resolve));
      if (created) fs.rmSync(folder,{recursive:true,force:true});
    }
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{
  if(browser)await browser.close().catch(()=>{});
});
