const CACHE = 'chronique-v19';
const STATIC = [
  '/', '/index.html', '/actualites.html', '/recherche', '/categorie/societe',
  '/qui-sommes-nous.html', '/projets.html', '/sensibilisation.html',
  '/objets-perdus.html', '/heritage.html', '/faq.html', '/soutenir.html',
  '/transparence.html', '/donation.html', '/page.html', '/article.html',
  '/categorie.html', '/recherche.html', '/cookies.html', '/privacy.html',
  '/mentions-legales.html', '/publicite.html',
  '/css/tokens.css', '/css/style.css', '/css/home.css', '/css/redesign.css',
  '/js/main.js', '/js/admin.js', '/js/data.js', '/js/i18n.js', '/js/search.js', '/js/notify.js', '/js/home.js', '/js/donation.js', '/js/actions.js', '/js/consent.js', '/js/ads.js',
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
    caches.match(req).then(function(r) {
      if (r) {
        fetch(req).then(function(netResp) {
          if (netResp && netResp.ok) {
            caches.open(CACHE).then(function(c) { c.put(req, netResp); });
          }
        }).catch(function() {});
        return r;
      }
      return fetch(req);
    })
  );
});

// ===== NOTIFICATIONS PUSH =====
self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) {}
  var title = data.title || 'Chronique de James Mukeshaba';
  var options = {
    body: data.body || '',
    icon: '/assets/images/icon-192.png',
    badge: '/assets/images/icon-192.png',
    data: { url: data.url || '/' }
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(list) {
      for (var i = 0; i < list.length; i++) {
        if ('focus' in list[i]) {
          list[i].navigate(url);
          return list[i].focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});