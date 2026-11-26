import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { createHash, webcrypto } from 'node:crypto';
import { runInNewContext } from 'node:vm';

const root = process.cwd();
const read = path => readFileSync(join(root, path), 'utf8');
test('Toolya exposes a valid installable PWA manifest', () => {
  const app = JSON.parse(read('manifest.json'));
  assert.equal(app.id, '/');
  assert.equal(app.start_url, '/');
  assert.equal(app.scope, '/');
  assert.equal(app.display, 'standalone');
  assert.ok(app.name && app.short_name);
  for (const size of [192, 512]) {
    const icon = app.icons.find(item => item.sizes === size + 'x' + size);
    assert.ok(icon, size + 'px icon missing');
    const path = join(root, icon.src.slice(1));
    assert.ok(existsSync(path), 'Icon file missing: ' + path);
    const image = readFileSync(path);
    assert.equal(image.toString('hex', 0, 8), '89504e470d0a1a0a');
    assert.equal(image.readUInt32BE(16), size);
    assert.equal(image.readUInt32BE(20), size);
  }
});
test('Toolya retains offline navigation fallback and restricts static caching to verified public assets', () => {
  const worker = read('sw.js');
  assert.match(worker, /addEventListener\('fetch'/);
  assert.match(worker, /request\.mode !== 'navigate'/);
  assert.match(worker, /caches\.match\(OFFLINE_URL\)/);
  const [offline,staticCache] = worker.split('// Appended to the existing offline-only service worker by the isolated build.');
  assert.doesNotMatch(offline, /cache\.put\(/);
  if (!existsSync(join(root,'assets/perf/manifest.json'))) {
    assert.equal(staticCache,undefined);
    assert.doesNotMatch(worker,/cache\.put\(/);
  } else {
    assert.ok(staticCache);
    const manifest=JSON.parse(read('assets/perf/manifest.json'));
    const expected=Object.fromEntries(manifest.files.map(p=>{
      const match=/^assets\/perf\/[a-z0-9-]+\.([a-f0-9]{64})\.(css|js|webp)$/.exec(p);
      assert.ok(match,p);
      assert.equal(createHash('sha256').update(readFileSync(join(root,p))).digest('hex'),match[1],p);
      return ['/'+p,match[1]];
    }));
    const actual=JSON.parse(staticCache.match(/const PERF_ASSETS = (\{[^\n]+\});/)[1]);
    assert.deepEqual(actual,expected);
    assert.equal((staticCache.match(/cache\.put\(/g)||[]).length,1);
    assert.match(staticCache,/credentials:'omit',redirect:'error'/);
    assert.match(staticCache,/digest===expected/);
  }
  const install = read('assets/toolya-pwa.js');
  assert.match(install, /beforeinstallprompt/);
  assert.match(install, /serviceWorker\.register\('\/sw\.js'/);
  assert.doesNotMatch(read('index.html'), /id="toolyaInstallBtn"|ty-pwa-install/);
  const settings = read('shared/toolya/platform.mjs');
  assert.match(settings, /className='ty-settings-group ty-pwa-settings'/);
  assert.match(settings, /data-toolya-install/);
  assert.match(settings, /insertBefore\(install,anchor\|\|support\)/);
  assert.match(install, /addEventListener\('click'/);
  assert.match(install, /closest\?\.\('\[data-toolya-install\]'\)/);
  assert.match(install, /toolya:pwa-settings-mounted/);
  assert.match(read('shared/toolya/settings-accordion.css'), /\.ty-pwa-action/);
});
test('PWA manifest and installer linked from main destinations', () => {
  for (const path of ['index.html','en/index.html','dashboard/index.html','tools/baking/index.html','tools/wishes/public.html']) {
    const html=read(path);
    assert.match(html, /rel="manifest" href="\/manifest\.json"/);
    if(['index.html','en/index.html'].includes(path)&&existsSync(join(root,'assets/perf/manifest.json'))){
      const src=html.match(/src="\/(assets\/perf\/toolya-pwa\.([a-f0-9]{64})\.js)"/);
      assert.ok(src,path);
      const manifest=JSON.parse(read('assets/perf/manifest.json'));
      assert.ok(manifest.files.includes(src[1]),path);
      assert.equal(createHash('sha256').update(readFileSync(join(root,src[1]))).digest('hex'),src[2],path);
      const install=read(src[1]);
      assert.match(install,/beforeinstallprompt/);
      assert.match(install,/toolya:pwa-settings-mounted/);
    }else assert.match(html, /src="\/assets\/toolya-pwa\.js"/);
  }
});

test('Install action works from dynamically mounted settings with a browser prompt', async () => {
  const { runInNewContext } = await import('node:vm');
  const listeners = { document: new Map(), window: new Map() };
  const button = { hidden: false };
  const status = { hidden: true, textContent: '' };
  const document = {
    querySelector: selector => selector === '[data-toolya-install]' ? button :
      selector === '[data-toolya-install-status]' ? status : null,
    addEventListener: (event, handler) => listeners.document.set(event, handler)
  };
  const window = {
    isSecureContext: false,
    addEventListener: (event, handler) => listeners.window.set(event, handler),
    matchMedia: () => ({ matches: false })
  };
  const navigator = { userAgent: 'Chrome Android', standalone: false, platform: 'Linux' };
  runInNewContext(read('assets/toolya-pwa.js'), { window, document, navigator });
  let prevented = false, prompted = 0;
  listeners.window.get('beforeinstallprompt')({
    preventDefault: () => { prevented = true; },
    prompt: async () => { prompted++; },
    userChoice: Promise.resolve({ outcome: 'accepted' })
  });
  assert.equal(prevented, true);
  await listeners.document.get('click')({
    target: { closest: selector => selector === '[data-toolya-install]' ? button : null }
  });
  assert.equal(prompted, 1);
  assert.equal(button.hidden, true);
  assert.match(status.textContent, /Installation bestätigt/);
});

test('Installed app hides installation action and leaves existing settings intact', async () => {
  const { runInNewContext } = await import('node:vm');
  const button = { hidden: false };
  const status = { hidden: true, textContent: '' };
  const document = {
    querySelector: selector => selector === '[data-toolya-install]' ? button :
      selector === '[data-toolya-install-status]' ? status : null,
    addEventListener: () => {}
  };
  const window = {
    isSecureContext: false,
    addEventListener: () => {},
    matchMedia: () => ({ matches: true })
  };
  runInNewContext(read('assets/toolya-pwa.js'), { window, document, navigator: {} });
  assert.equal(button.hidden, true);
  assert.match(status.textContent, /bereits als App geöffnet/);
});

test('Static cache refuses personal, unversioned, credentialed and invalid responses',async()=>{
  if(!existsSync(join(root,'assets/perf/manifest.json')))return;
  const manifest=JSON.parse(read('assets/perf/manifest.json'));
  const asset=manifest.files.find(p=>p.endsWith('.css'));
  assert.ok(asset);
  const bytes=readFileSync(join(root,asset));
  const origin='https://toolya.app',url=origin+'/'+asset;
  const listeners=new Map(),stored=new Map(),network=[];
  const cache={match:async key=>stored.get(key)?.clone(),put:async(key,value)=>{stored.set(key,value.clone());}};
  let response=()=>new Response(bytes,{headers:{'content-type':'text/css'}});
  const fetch=async(input,opts)=>{network.push({input,opts});return response();};
  const caches={open:async()=>cache,match:async()=>new Response('offline'),keys:async()=>[],delete:async()=>true};
  const self={location:{origin},addEventListener:(name,fn)=>{if(!listeners.has(name))listeners.set(name,[]);listeners.get(name).push(fn);}};
  runInNewContext(read('sw.js'),{self,caches,fetch,URL,Response,Headers,Uint8Array,crypto:webcrypto});
  async function dispatch(target,overrides={}){
    let result;
    const event={request:{url:target,method:'GET',mode:'cors',cache:'default',headers:new Headers(),...overrides},respondWith:p=>{assert.equal(result,undefined);result=p;}};
    for(const fn of listeners.get('fetch'))fn(event);
    return result===undefined?undefined:await result;
  }
  for(const [target,options] of [
    [origin+'/rest/v1/user_data',{}],[origin+'/tools/budget/index.html',{}],
    [origin+'/assets/other.webp',{}],[url+'?token=synthetic',{}],
    [url,{method:'POST'}],[url,{headers:new Headers({authorization:'Bearer synthetic'})}],
    ['https://example.invalid/'+asset,{}]
  ]){
    assert.equal(await dispatch(target,options),undefined,target);
    assert.equal(stored.size,0,target);
  }
  // Existing navigation fallback remains network-only; no authenticated HTML stored.
  await dispatch(origin+'/dashboard/',{mode:'navigate'});
  assert.equal(stored.size,0);
  for(const make of [
    ()=>new Response('incorrect bytes',{headers:{'content-type':'text/css'}}),
    ()=>new Response(bytes,{headers:{'content-type':'text/html'}}),
    ()=>new Response(bytes,{headers:{'content-type':'text/css','cache-control':'private, no-store'}}),
    ()=>new Response(bytes,{status:404,headers:{'content-type':'text/css'}})
  ]){
    response=make;
    await dispatch(url);
    assert.equal(stored.size,0);
  }
  response=()=>new Response(bytes,{headers:{'content-type':'text/css'}});
  await dispatch(url,{cache:'no-store'});
  assert.equal(stored.size,0);
  await dispatch(url);
  assert.deepEqual([...stored.keys()],[url]);
  const last=network.at(-1);
  assert.equal(last.opts.credentials,'omit');
  assert.equal(last.opts.redirect,'error');
  const count=network.length;
  assert.equal((await dispatch(url)).status,200);
  assert.equal(network.length,count,'verified asset must use cache on subsequent request');
  assert.equal(await dispatch(url,{headers:new Headers({authorization:'Bearer synthetic'})}),undefined);
});
