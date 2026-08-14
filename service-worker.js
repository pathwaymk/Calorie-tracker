const CACHE_NAME = 'calorie-tracker-v1';
const ASSETS_TO_CACHE = [
  './',
  './calorie-tracker.html',
  './calorie-tracker.css',
  './calorie-tracker.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          // Put a copy in the cache for next time.
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // If request is for a navigation, show cached shell.
          if (event.request.mode === 'navigate' || event.request.destination === 'document') {
            return caches.match('./calorie-tracker.html');
          }
        });
    })
  );
});
