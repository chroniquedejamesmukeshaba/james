// ===== SYSTEME DE NOTIFICATIONS (WEB PUSH) =====
(function () {
  var STR = {
    title: 'Recevez les derni\u00e8res actualit\u00e9s',
    desc: 'Activez les notifications pour \u00eatre alert\u00e9 d\u00e8s la publication d\u2019un article ou d\u2019une Breaking News.',
    label_news: 'Derni\u00e8res actualit\u00e9s',
    label_breaking: 'Breaking News',
    label_rdc: 'Actualit\u00e9s de la RDC',
    label_intl: 'Actualit\u00e9s internationales',
    btn_on: 'Activer les notifications',
    btn_off: 'D\u00e9sactiver',
    ok_push: 'Notifications activ\u00e9es. Merci !',
    ok_prefs: 'Pr\u00e9f\u00e9rences enregistr\u00e9es. Les notifications push ne sont pas disponibles sur ce navigateur.',
    err: 'Une erreur est survenue. R\u00e9essayez plus tard.',
    already: 'Notifications d\u00e9j\u00e0 activ\u00e9es.'
  };
  function L(k) {
    if (typeof t === 'function') {
      var v = t('ntf_' + k);
      if (v !== 'ntf_' + k) return v;
    }
    return STR[k] || k;
  }

  function post(url, data) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (r) { return r.json(); });
  }
  function toast(msg) {
    if (typeof showToast === 'function') { showToast(msg); return; }
    alert(msg);
  }
  function b64url(bytes) {
    var s = '';
    bytes.forEach(function (b) { s += String.fromCharCode(b); });
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function urlB64ToUint8Array(b64) {
    var pad = '='.repeat((4 - (b64.length % 4)) % 4);
    var b = (b64 + pad).replace(/-/g, '+').replace(/_/g, '/');
    var raw = atob(b);
    var out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }

  var state = { enabled: false, registered: false, saved: false };

  function collect(host) {
    return {
      name: (host.querySelector('.ntf-name') || {}).value ? host.querySelector('.ntf-name').value.trim() : '',
      email: (host.querySelector('.ntf-email') || {}).value ? host.querySelector('.ntf-email').value.trim() : '',
      news: !!(host.querySelector('[data-pref="news"]') || {}).checked,
      breaking: !!(host.querySelector('[data-pref="breaking"]') || {}).checked,
      rdc: !!(host.querySelector('[data-pref="rdc"]') || {}).checked,
      international: !!(host.querySelector('[data-pref="intl"]') || {}).checked
    };
  }

  function savePrefs(host, extra) {
    var p = collect(host);
    var payload = {
      name: p.name, email: p.email,
      news: p.news, breaking: p.breaking, rdc: p.rdc, international: p.international
    };
    if (extra && extra.endpoint) {
      payload.endpoint = extra.endpoint;
      payload.p256dh = extra.p256dh;
      payload.auth = extra.auth;
    }
    return post('/api/notifications', payload).then(function (r) {
      if (r && r.ok) { state.saved = true; return true; }
      return false;
    });
  }

  function trySubscribe(host) {
    if (!('PushManager' in window) || !('serviceWorker' in navigator)) {
      return savePrefs(host).then(function (ok) {
        toast(ok ? L('ok_prefs') : L('err'));
      });
    }
    return post('/api/push/setup', {}).then(function (s) {
      if (!s || !s.ok || !s.vapid_public_key) {
        return savePrefs(host).then(function (ok) { toast(ok ? L('ok_prefs') : L('err')); });
      }
      return navigator.serviceWorker.ready.then(function (reg) {
        return reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8Array(s.vapid_public_key)
        });
      }).then(function (sub) {
        return savePrefs(host, {
          endpoint: sub.endpoint,
          p256dh: b64url(new Uint8Array(sub.getKey('p256dh'))),
          auth: b64url(new Uint8Array(sub.getKey('auth')))
        }).then(function (ok) {
          if (ok) { state.enabled = true; toast(L('ok_push')); }
          else toast(L('err'));
        });
      }).catch(function () {
        return savePrefs(host).then(function (ok) { toast(ok ? L('ok_prefs') : L('err')); });
      });
    }).catch(function () {
      toast(L('err'));
    });
  }

  window.NotifUI = {
    init: function (host) {
      host = host || document.getElementById('notif-block');
      if (!host) return;
      if (typeof t === 'function') {
        host.querySelector('.ntf-title') && (host.querySelector('.ntf-title').textContent = L('title'));
        host.querySelector('.ntf-desc') && (host.querySelector('.ntf-desc').textContent = L('desc'));
        host.querySelectorAll('[data-pref-label]').forEach(function (el) {
          el.textContent = L(el.dataset.prefLabel);
        });
        host.querySelector('.ntf-btn') && (host.querySelector('.ntf-btn').textContent = L('btn_on'));
      }
      var btn = host.querySelector('.ntf-btn');
      if (!btn) return;
      btn.addEventListener('click', function () {
        if (state.enabled) return;
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          toast(L('already'));
          trySubscribe(host);
          return;
        }
        if (typeof Notification === 'undefined' || !('PushManager' in window)) {
          trySubscribe(host);
          return;
        }
        Notification.requestPermission().then(function (perm) {
          if (perm === 'granted') trySubscribe(host);
          else toast(L('err'));
        }).catch(function () { trySubscribe(host); });
      });
    }
  };
})();