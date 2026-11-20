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
