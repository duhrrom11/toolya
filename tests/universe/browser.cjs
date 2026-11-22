// The browser receives synthetic accounts and RPC responses exclusively through Playwright.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const demo = process.argv.includes('--demo');
const origin = 'http://toolya.test';
const remote = 'https://yheogmeaosuigyaxkwth.supabase.co';
const state = { active: false, chapter: 0, decor: '', visible: false, handle: null, xp: 0, profile: null };

async function run() {
  const browser = await chromium.launch({
    executablePath: process.env.UNIVERSE_CHROMIUM || undefined,
    headless: !demo,
    args: ['--no-sandbox'],
  });
  try {
    const context = await browser.newContext({ viewport: { width: 1360, height: 920 }, serviceWorkers: 'block' });
    await context.route('**/*', async route => {
      const address = new URL(route.request().url());
      if (address.origin !== origin && !(address.origin === remote && address.pathname === '/__auth')) return route.abort();
      if (address.pathname === '/assets/vendor/supabase-2.57.0.js') {
        return route.fulfill({ contentType: 'text/javascript', body: `
          window.supabase = {createClient: () => ({
            auth: {
              getUser: async () => ({data:{user:sessionStorage.testUser ? {id:sessionStorage.testUser}:null}}),
              onAuthStateChange(callback) { window.testAuthChange = callback; },
              signUp: async options => ({data:await (await fetch('${remote}/__auth', {method:'POST',body:JSON.stringify(options)})).json()}),
            },
            rpc: async (name,args) => await (await fetch('/__rpc/'+name, {method:'POST',body:JSON.stringify(args||{})})).json(),
          })};
        ` });
      }
      if (address.pathname === '/__auth') {
        const { options, email, password } = route.request().postDataJSON();
        if (demo) return route.fulfill({ headers: { 'access-control-allow-origin': origin }, json: { session: null } });
        assert.deepEqual(options.data.toolya_profile, { first: 'Éva', last: 'Nguyễn', country: 'DE', avatar: null });
        assert.equal(email, 'example@example.invalid');
        assert(password.length >= 8);
        assert.equal(new URL(options.emailRedirectTo).searchParams.get('next'), '/tools/moving/?fixture=1#anchor');
        return route.fulfill({ headers: { 'access-control-allow-origin': origin }, json: { session: null } });
      }
      if (address.pathname.startsWith('/__rpc/')) {
        const action = address.pathname.split('/').at(-1).replace('universe_', '');
        const values = route.request().postDataJSON();
        switch (action) {
          case 'toggle':
            state.active = values.p_active;
            if (!state.active) state.visible = false;
            break;
          case 'answer':
            if (values.p_step === state.chapter && [1, 0, 2][state.chapter] === values.p_answer) state.chapter++;
            break;
          case 'decorate': state.decor = values.p_decor; break;
          case 'collect': state.xp = values.p_private ? 480 : 400; break;
          case 'save_profile': state.profile = values.p_profile; break;
          case 'visibility':
            state.visible = values.p_visible;
            state.handle = values.p_handle;
            break;
          case 'ranking': return route.fulfill({ json: { data: state.visible ? [{ handle: state.handle, xp: 400 }] : [] } });
          case 'state': break;
          default: throw Error('Unexpected RPC ' + action);
        }
        return route.fulfill({ json: { data: state } });
      }
      const pathname = address.pathname.replace(/\/$/, '/index.html');
      const file = path.resolve('.' + pathname);
      if (!file.startsWith(process.cwd() + path.sep)) return route.abort();
      const type = { '.html': 'text/html', '.css': 'text/css', '.mjs': 'text/javascript', '.js': 'text/javascript', '.webp': 'image/webp' };
      try { return route.fulfill({ contentType: type[path.extname(file)] || 'application/octet-stream', body: await fs.readFile(file) }); }
      catch { return route.fulfill({ status: 404 }); }
    });
    const page = await context.newPage();
    if (demo) {
      await page.addInitScript(() => { sessionStorage.testUser = 'fixture-account'; });
      await page.goto(origin + '/tools/gamification/');
      console.log('Toolya Universe demo · synthetic account, no external traffic.');
      if (!page.isClosed()) await new Promise(resolve => page.once('close', resolve));
      return;
    }
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + '/tools/gamification/');
    await page.getByRole('link', { name: 'Anmelden', exact: true }).waitFor();
    const mapRoutes = await page.locator('#regions li a').evaluateAll(links => links.map(link => new URL(link.href).pathname));
    assert.equal(new Set(mapRoutes).size, 12);
    for (const route of mapRoutes) assert((await fs.stat('.' + route)).isFile());
    assert(await page.locator('#quest').isHidden());
    assert(await page.locator('#profile').isHidden());
    assert.equal(new URL(await page.locator('#sign-in').getAttribute('href')).searchParams.get('next'), '/tools/gamification/');
    await page.evaluate(() => {
      localStorage.setItem('helferlein-toolya-preferences-v1', JSON.stringify({ character: 'purple', quiet: true }));
      sessionStorage.testUser = 'fixture-account';
    });
    await page.reload();
    await page.getByRole('button', { name: 'Mitspielen' }).click();
    await page.locator('#level-line').filter({ hasText: '0 XP' }).waitFor();
    assert.match(await page.locator('#buddy').getAttribute('src'), /purple-welcome/);
    assert.equal(await page.locator('#buddy').evaluate(node => getComputedStyle(node).animationName), 'none');
    await page.getByRole('button', { name: 'Tool-Erfolge abholen' }).click();
    await page.getByText(/400 XP/).first().waitFor();
    await page.getByLabel('Windbogen').check();
    await page.getByRole('button', { name: 'Weiter', exact: true }).click();
    await page.getByText(/Schau dir den Hinweis/).waitFor();
    for (const answer of ['Fundsteg', 'Tauglashaus', 'Sternwarte der Stunden']) {
      await page.getByLabel(answer).check();
      await page.getByRole('button', { name: 'Weiter', exact: true }).click();
    }
    await page.getByRole('heading', { name: 'Die Laterne brennt wieder' }).waitFor();
    await page.getByLabel('Dekoration').selectOption('window');
    await page.locator('#decoration button').click();
    await page.getByText('Gespeichert.', { exact: true }).waitFor();
    await page.getByText('Blick aus dem Fenster', { exact: true }).click();
    await page.getByText(/Insel ohne Namen/).waitFor();
    await page.getByLabel('Vorname').fill('Éva');
    await page.getByLabel('Nachname').fill('Nguyễn');
    await page.locator('#profile-form button').click();
    await page.getByText('Gespeichert.', { exact: true }).waitFor();
    await page.getByLabel('In der Rangliste erscheinen').check();
    await page.getByLabel('Anzeigename').fill('Nebel-Wanderer');
    await page.locator('#ranking-form button').click();
    await page.locator('#ranking').getByText('Nebel-Wanderer · 400 XP').waitFor();

    await fs.mkdir('test-results', { recursive: true });
    await page.screenshot({ path: 'test-results/universe-desktop.png', fullPage: true });
    await page.setViewportSize({ width: 320, height: 720 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(origin + '/tools/gamification/?lang=en');
    await page.getByRole('heading', { name: 'The Mist Isles' }).waitFor();
    await page.getByRole('heading', { name: 'The lantern shines again' }).waitFor();
    await page.locator('#ranking').getByText('Nebel-Wanderer · 400 XP').waitFor();
    assert.equal(await page.locator('#decor').inputValue(), 'window');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: 'test-results/universe-mobile.png', fullPage: true });
    await page.getByRole('button', { name: 'Pause the game' }).click();
    await page.getByRole('button', { name: 'Join the adventure' }).waitFor();
    assert(await page.locator('#ranking-form').isHidden());
    assert.equal(state.xp, 400);

    await page.goto(origin + '/account/register.html?lang=en&next=' + encodeURIComponent('/tools/moving/?fixture=1#anchor'));
    await page.getByRole('heading', { name: 'Create a Toolya account' }).waitFor();
    await page.getByLabel('First name').fill('Éva');
    await page.getByLabel('Last name').fill('Nguyễn');
    await page.getByLabel('Email address').fill('example@example.invalid');
    await page.getByLabel(/Password/).fill('synthetic-password');
    await page.getByLabel(/Country/).selectOption('DE');
    await page.getByRole('button', { name: 'Create account' }).click();
    await page.getByText('Check your inbox to confirm your email address.').waitFor();
    await page.goto(origin + '/account/register.html?next=' + encodeURIComponent('//other.test/'));
    assert.equal(new URL(await page.locator('#back').getAttribute('href'), page.url()).origin, origin);
    assert.deepEqual(errors, []);
    assert.equal(await context.cookies(remote).then(cookies => cookies.length), 0);
    console.log('Universe browser: guest, account opt-in, all map links, quest, profile, leaderboard, mobile, registration');
  } finally { await browser.close(); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
