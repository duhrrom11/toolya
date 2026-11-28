'use strict';
// Isolated Playwright smoke for generated drafts. Never contacts production.
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const {generateTool} = require('../../scripts/create-tool.cjs');

const root = path.resolve(__dirname, '../..');
const slug = 'ci-ai-draft-smoke';
const atlasManifest = path.join(root, 'assets/toolya/optimized/outfits-q85.json');
const expectedAtlas = fs.existsSync(atlasManifest)
  ? JSON.parse(fs.readFileSync(atlasManifest, 'utf8')).output
  : 'assets/toolya/outfits.webp';
const mime = {'.html':'text/html; charset=utf-8','.mjs':'text/javascript','.js':'text/javascript',
  '.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml',
  '.json':'application/json','.woff2':'font/woff2'};
let created = false;
let server, browser;

async function main() {
  const draft = generateTool({
    repoRoot:root, slug, title:'Isolierter Toolya-Entwurf',
    description:'Eine rein lokale Vorschau mit gemeinsamer Toolya-Plattform.',
    outfit:'plants'
  });
  created = draft.created;
  server = http.createServer((req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://local.test').pathname); }
    catch { res.writeHead(400); return res.end(); }
    let target = path.resolve(root, '.' + pathname);
    if (!target.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
    if (pathname.endsWith('/')) target = path.join(target, 'index.html');
    fs.readFile(target, (error, file) => {
      if (error) { res.writeHead(404); return res.end(); }
      res.writeHead(200, {'Content-Type': mime[path.extname(target)] || 'application/octet-stream'});
      res.end(req.method === 'HEAD' ? undefined : file);
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({headless:true, executablePath:process.env.CHROME_PATH || '/usr/bin/google-chrome',
    args:['--no-sandbox']});
  const spritePositions = [];
  for (const character of ['turquoise', 'purple']) {
    const context = await browser.newContext({viewport:{width:320,height:812}, reducedMotion:'reduce'});
    const pageErrors = [];
    const rejectedExternal = [];
    const rejectedWrites = [];
    try {
      await context.addInitScript(character => {
        localStorage.setItem('helferlein-toolya-preferences-v1', JSON.stringify({character,motion:'off'}));
      }, character);
      await context.route('**/*', route => {
        const request = route.request();
        const url = new URL(request.url());
        if (request.method() !== 'GET') {
          rejectedWrites.push(request.method() + ' ' + url.pathname);
          return route.abort();
        }
        if (url.origin !== origin) {
          rejectedExternal.push(url.hostname);
          return route.abort();
        }
        return route.continue();
      });
      const page = await context.newPage();
      page.on('pageerror', error => pageErrors.push(error.message));
      await page.goto(origin + '/tools/' + slug + '/', {waitUntil:'domcontentloaded'});
      await page.waitForFunction(() => {
        const hero = document.querySelector('.ty-tool-hero');
        return hero && hero.dataset.character && hero.querySelector('.ty-sprite-wrap .ty-frame')
          && document.querySelector('.toolya-signature-footer')
          && window.toolyaBuddy?.character;
      }, null, {timeout:12000});
      const result = await page.evaluate(() => {
        const hero = document.querySelector('.ty-tool-hero');
        const frame = hero.querySelector('.ty-sprite-wrap .ty-frame');
        return {
          tool:hero.dataset.tool,
          character:hero.dataset.character,
          buddy:window.toolyaBuddy.character,
          title:hero.querySelector('h1')?.textContent,
          position:frame.style.getPropertyValue('--ty-a'),
          background:frame.style.backgroundImage,
          originalHidden:document.querySelector('header.b3-header')?.classList.contains('ty-tool-original-header'),
          footerCount:document.querySelectorAll('.toolya-signature-footer').length,
          heroWordmark:hero.querySelector('.ty-tool-wordmark')?.textContent.trim(),
          footerWordmark:document.querySelector('.ty-footer-wordmark')?.textContent.trim(),
          noIndex:document.querySelector('meta[name="robots"]')?.content,
          status:document.querySelector('#draft-status')?.textContent
        };
      });
      assert.equal(result.tool, slug);
      assert.equal(result.character, character);
      assert.equal(result.buddy, character);
      assert.match(result.title, /Isolierter Toolya-Entwurf/);
      assert.equal(result.originalHidden, true);
      assert.equal(result.footerCount, 1);
      assert.equal(result.heroWordmark.replace(/^✳\s*/, ''), result.footerWordmark);
      assert.equal(result.footerWordmark, 'Toolya');
      assert.equal(result.noIndex, 'noindex,nofollow');
      assert.ok(result.background.includes('/' + expectedAtlas), 'sprite uses the current Toolya atlas');
      assert.ok(result.position.endsWith('%'), 'sprite position is resolved');
      spritePositions.push(result.position);
      await page.locator('#draft-action').click();
      await assert.doesNotReject(page.locator('#draft-status').getByText(/Vorlage bereit/).waitFor());
      assert.deepEqual(rejectedWrites, [], 'no cloud or other writes attempted');
      assert.deepEqual(pageErrors, [], 'no local application errors: ' + pageErrors.join('; '));
      // External static resources are intentionally blocked. Never visit production.
      assert.ok(rejectedExternal.every(host => host !== 'toolya.app'), 'no live Toolya origin');
    } finally {
      await context.close();
    }
  }
  assert.notEqual(spritePositions[0], spritePositions[1], 'outfit atlas responds to character selection');
  process.stdout.write('PASS: generated draft, shared hero/footer, both characters, offline-only browser checks\n');
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close().catch(() => {});
  if (server) await new Promise(resolve => server.close(resolve));
  if (created) fs.rmSync(path.join(root, 'tools', slug), {recursive:true, force:true});
});
