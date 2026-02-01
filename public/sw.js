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

// Handle push notifications with sound and vibration
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification received:', event);
  
  if (!event.data) {
    console.warn('⚠️ Push notification without data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('📬 Push data:', data);
    
    const options = {
      body: data.message || 'You have a new notification',
      icon: data.icon || '/icons/icon-192.svg',
      badge: '/icons/icon-192.svg',
      tag: 'booking-notification',
      requireInteraction: true,
      vibrate: data.vibrate || [200, 100, 200, 100, 200],
      // Note: Sound/audio in push notifications is limited in browsers
      // but we can control it through the notification options
      actions: [
        { action: 'open', title: 'Open App', icon: '/icons/icon-192.svg' },
        { action: 'close', title: 'Close', icon: '/icons/icon-192.svg' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || '🔔 Princess Parlor Service', options)
        .then(() => {
          console.log('✅ Push notification shown in system tray');
        })
        .catch((err) => {
          console.error('❌ Error showing push notification:', err);
        })
    );
  } catch (err) {
    console.error('❌ Error parsing push notification:', err);
    event.waitUntil(
      self.registration.showNotification('🔔 Princess Parlor Service', {
        body: event.data.text(),
        icon: '/icons/icon-192.svg',
        badge: '/icons/icon-192.svg',
        vibrate: [200, 100, 200, 100, 200],
        requireInteraction: true
      })
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked with action:', event.action);
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if window is already open
      for (let client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          console.log('✅ Focusing existing app window');
          return client.focus();
        }
      }
      // Open new window if not found
      if (clients.openWindow) {
        console.log('🪟 Opening new app window');
        return clients.openWindow('/');
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed');
});

