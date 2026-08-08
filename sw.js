const CACHE = 'chronique-v3';
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
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      return Promise.all(STATIC.map(function(url) {
        return c.add(url).catch(function() {});
      }));
    })
  );
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
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);

  if (url.pathname.indexOf('/api/') > -1) {
    e.respondWith(fetch(req).catch(function() { return new Response('[]', {status: 200, headers: {'Content-Type': 'application/json'}}); }));
    return;
  }

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function(resp) {
        if (resp && resp.ok) {
          var copy = resp.clone();
          caches.open(CACHE).then(function(c) { c.put(url.origin + url.pathname, copy); });
        }
        return resp;
      }).catch(function() {
        return caches.match(req).then(function(cached) { return cached || caches.match('/index.html'); });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function(r) { return r || fetch(req); })
  );
});