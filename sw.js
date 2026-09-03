const CACHE_NAME = 'linguaflip-cache-v1.8';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './effects.css', 
  './app.js',
  './effects.js',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './data_en.js',
  './data_es.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames.map((cacheName) => {
        if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
      })
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Игнорируем любые запросы, кроме GET (например, POST-запросы от RuStore или расширений)
  if (event.request.method !== 'GET') return;
  
  // Игнорируем запросы от браузерных расширений
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || (networkResponse.status !== 200 && networkResponse.type !== 'opaque')) return networkResponse;
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        return networkResponse;
      }).catch(() => {
        if (event.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});