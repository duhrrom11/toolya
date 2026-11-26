/* Toolya: offline fallback only. No personal data or tool responses are cached. */
const OFFLINE_CACHE = 'toolya-pwa-offline-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(OFFLINE_CACHE)
      .then(cache => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys => Promise.all(
        keys.filter(key => key.startsWith('toolya-pwa-offline-') && key !== OFFLINE_CACHE)
          .map(key => caches.delete(key))
      )),
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || request.mode !== 'navigate') return;
  if (new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(request).catch(async () => {
      // Never cache authenticated HTML, API requests, photos or other user content.
      return await caches.match(OFFLINE_URL) || Response.error();
    })
  );
});

// Appended to the existing offline-only service worker by the isolated build.
const PERF_ASSETS = {"/assets/perf/autokosten.a3e3a5fda08bcba2cdd2fffcfc66956f7491583b94734c5d4024d0f1d7c983aa.webp":"a3e3a5fda08bcba2cdd2fffcfc66956f7491583b94734c5d4024d0f1d7c983aa","/assets/perf/backform-rechner.7d31f1dd69b04236d96f3721b4fc150f3b0d81fa63061f09e17e4dc162c55485.webp":"7d31f1dd69b04236d96f3721b4fc150f3b0d81fa63061f09e17e4dc162c55485","/assets/perf/budget.d911cd5abbae235758a87d11310ede36f90e8ee64c1585d5918eea75d6a0814f.webp":"d911cd5abbae235758a87d11310ede36f90e8ee64c1585d5918eea75d6a0814f","/assets/perf/digitaler-nachlass.19cbc9f663af73cac36189fdb3faa5182ceaf116ec59a6e4afe19627167e2ad8.webp":"19cbc9f663af73cac36189fdb3faa5182ceaf116ec59a6e4afe19627167e2ad8","/assets/perf/helferlein-accessibility.0ee1345222287a1c61b71504af4f688568ef9d1edb4e611463ff1f0017845d2a.js":"0ee1345222287a1c61b71504af4f688568ef9d1edb4e611463ff1f0017845d2a","/assets/perf/helferlein-b3-startseite.12c2a2917916c2823a18a725acf5e2d080703801202fb50bf8c6db569d8431e4.js":"12c2a2917916c2823a18a725acf5e2d080703801202fb50bf8c6db569d8431e4","/assets/perf/helferlein-dialogs.4c1e8da5ec5a18264b53d209b44643f6ca90c210f2c1b0e81b4b174400007fbc.js":"4c1e8da5ec5a18264b53d209b44643f6ca90c210f2c1b0e81b4b174400007fbc","/assets/perf/hero-duo-480.85ad9571e45ed983e03e47d06062fe4f96093292500c0f41d36e77690fac4d7b.webp":"85ad9571e45ed983e03e47d06062fe4f96093292500c0f41d36e77690fac4d7b","/assets/perf/hero-duo-960.3c80d41aaef1aaf64baab98d459452a8771b943e8ff61708de8c08f061a7441a.webp":"3c80d41aaef1aaf64baab98d459452a8771b943e8ff61708de8c08f061a7441a","/assets/perf/hero-duo.3e5c026125ac2aa9f03494e2cb7358ad7a6d329e15aedf45f0ebe920ca2df2b8.webp":"3e5c026125ac2aa9f03494e2cb7358ad7a6d329e15aedf45f0ebe920ca2df2b8","/assets/perf/home-styles.6446e70faa0c117d3cfa6a3a5f684ffe8b28c4bf127f75ace73384647039bd1b.css":"6446e70faa0c117d3cfa6a3a5f684ffe8b28c4bf127f75ace73384647039bd1b","/assets/perf/home-utilities.de727db268f7b3c26a107ea38c25df9b26d43ef11e3bf1796c4d6e8cf4626853.css":"de727db268f7b3c26a107ea38c25df9b26d43ef11e3bf1796c4d6e8cf4626853","/assets/perf/moving.a29e8c38b0bf6c732a8ed73c00b0e45b53fce77e3e28c6eb30f48b20b82519a0.webp":"a29e8c38b0bf6c732a8ed73c00b0e45b53fce77e3e28c6eb30f48b20b82519a0","/assets/perf/parkplatz-merker.075eda5aafef65057504a7e36bee354494c5ff7040f768cf144787a3710ed438.webp":"075eda5aafef65057504a7e36bee354494c5ff7040f768cf144787a3710ed438","/assets/perf/plants.184bbdebd59d8d70f63f1b07a64dd0b032b2a0c408997019ccc3c0155bc9022b.webp":"184bbdebd59d8d70f63f1b07a64dd0b032b2a0c408997019ccc3c0155bc9022b","/assets/perf/tiergesundheit.f3d0bd2b68d1184d5c3261b16b117fdd593c0fcc54e86de86f5a97ccb7058e71.webp":"f3d0bd2b68d1184d5c3261b16b117fdd593c0fcc54e86de86f5a97ccb7058e71","/assets/perf/toolya-pwa.20e494ad417cd5354d6769c2f8b28f7a2dd251d753358133b0d1636bd4571c62.js":"20e494ad417cd5354d6769c2f8b28f7a2dd251d753358133b0d1636bd4571c62","/assets/perf/verliehene-dinge.81bf5cfc131c732baf7fa8ca1b33ac8fc9bb09deca147c44d2ddc402b2ba8ff2.webp":"81bf5cfc131c732baf7fa8ca1b33ac8fc9bb09deca147c44d2ddc402b2ba8ff2","/assets/perf/wg-organisator.e01b90f2b53ad46f446e6cc6a9ede0e3ad9f8d0d97e90dd3b135ec49c90c83e3.webp":"e01b90f2b53ad46f446e6cc6a9ede0e3ad9f8d0d97e90dd3b135ec49c90c83e3","/assets/perf/wishlist.ad492cebabf219685fdaf3d74960616675d569631d0ccd7965cbd925a38a40e9.webp":"ad492cebabf219685fdaf3d74960616675d569631d0ccd7965cbd925a38a40e9","/assets/perf/zaehlerstaende.76d965f10a150372ca710fd6a4bb6d48c5ce30d398eaef57a704a89dadb09a4a.webp":"76d965f10a150372ca710fd6a4bb6d48c5ce30d398eaef57a704a89dadb09a4a"};
const PERF_CACHE = 'toolya-public-perf-aad6a3d87465303c';
function publicPerfAsset(request) {
 if(request.method!=='GET'||request.mode==='navigate'||request.headers.has('authorization'))return null;
 const u=new URL(request.url);
 if(u.origin!==self.location.origin||u.search||u.hash||!Object.hasOwn(PERF_ASSETS,u.pathname))return null;
 return u;
}
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('toolya-public-perf-')&&k!==PERF_CACHE).map(k=>caches.delete(k)))));
});
self.addEventListener('fetch',event=>{
 const u=publicPerfAsset(event.request);
 if(!u)return;
 event.respondWith((async()=>{
  let cache;
  try{cache=await caches.open(PERF_CACHE);}catch{}
  const key=u.href;
  if(cache&&event.request.cache!=='reload'&&event.request.cache!=='no-store'&&event.request.cache!=='no-cache'){
   try{const hit=await cache.match(key);if(hit)return hit;}catch{}
  }
  // Only explicitly generated, content-addressed, public static resources.
  // Omit credentials and do not follow redirects to another resource.
  const response=await fetch(key,{credentials:'omit',redirect:'error',cache:'no-cache'});
  if(cache&&response.ok&&event.request.cache!=='no-store'&&!/private|no-store/i.test(response.headers.get('cache-control')||'')&&!response.headers.has('set-cookie')){
   try{
    const expected=PERF_ASSETS[u.pathname],bytes=await response.clone().arrayBuffer();
    const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
    const type=response.headers.get('content-type')||'';
    if(digest===expected&&(/\.webp$/.test(u.pathname)?/^image\/webp\b/i.test(type):/\.css$/.test(u.pathname)?/^text\/css\b/i.test(type):/^(?:application|text)\/(?:javascript|ecmascript)\b/i.test(type)))await cache.put(key,response.clone());
   }catch{} // cache unavailable or invalid content: return network response only
  }
  return response;
 })());
});
