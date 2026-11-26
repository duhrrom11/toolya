// Appended to the existing offline-only service worker by the isolated build.
const PERF_ASSETS = __PERF_ASSET_MAP__;
const PERF_CACHE = 'toolya-public-perf-__PERF_VERSION__';
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
