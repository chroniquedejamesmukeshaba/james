const CACHE_NAME = 'chronique-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/actualites.html',
  '/article.html',
  '/qui-sommes-nous.html',
  '/projets.html',
  '/sensibilisation.html',
  '/objets-perdus.html',
  '/heritage.html',
  '/faq.html',
  '/donation.html',
  '/page.html',
  '/css/style.css',
  '/js/main.js',
  '/js/admin.js',
  '/manifest.json',
  '/assets/images/logo.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request).then(function(fetchResponse) {
        if (event.request.url.startsWith(self.location.origin) &&
            event.request.url.indexOf('admin') === -1) {
          return caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        }
        return fetchResponse;
      });
    }).catch(function() {
      return caches.match('/index.html');
    })
  );
});
