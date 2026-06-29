const CACHE = 'chronique-v2';
const STATIC = [
  '/', '/index.html', '/actualites.html',
  '/qui-sommes-nous.html', '/projets.html', '/sensibilisation.html',
  '/objets-perdus.html', '/heritage.html', '/faq.html', '/donation.html',
  '/page.html',
  '/css/style.css', '/js/main.js', '/js/admin.js', '/js/data.js', '/js/i18n.js',
  '/manifest.json', '/assets/images/logo.png',
  '/assets/images/icon-192.png', '/assets/images/icon-512.png'
];

self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE).then(function(c) { return c.addAll(STATIC); }));
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  if (e.request.url.indexOf('/api/') > -1) {
    e.respondWith(fetch(e.request).catch(function() { return new Response('[]', {status:200}); }));
    return;
  }
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function(r) { return r || fetch(e.request); })
  );
});
