const CACHE_NAME = 'princess-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.css',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Use Promise.allSettled so one failing asset doesn't abort the whole install
    const results = await Promise.allSettled(
      ASSETS_TO_CACHE.map(async (url) => {
        try {
          const res = await fetch(url, { cache: 'no-cache' });
          if (!res || !res.ok) throw new Error(`Failed to fetch ${url}: ${res && res.status}`);
          await cache.put(url, res.clone());
          return { url, ok: true };
        } catch (err) {
          console.warn('sw: cache install warning for', url, err && err.message);
          return { url, ok: false, err: err && err.message };
        }
      })
    );

    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.ok));
    if (failed.length > 0) {
      console.warn('sw: some assets failed to cache during install', failed.map(f => f.status === 'fulfilled' ? f.value.url : 'rejected'));
    }
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map(k => k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network first for API requests, cache-first for others
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).catch(() => caches.match('/index.html')))
  );
});
