// =====================================================
// ADMIN DASHBOARD EXTRA — §20 : brouillons, utilisateurs,
// vues cumulées, répartition par statut et contenus
// récents. Données réelles uniquement (aucune donnée
// inventée). Chargé après admin.js sur admin/index.html.
// =====================================================
(function () {
  if (!document.querySelector('.admin-body') || !document.getElementById('db-drafts')) return;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fmtDate(d) {
    if (!d) return '—';
    var s = String(d);
    return s.replace('T', ' ').slice(0, 16);
  }

  function badge(st) {
    var map = {
      publie: '<span class="badge badge-ok">Publié</span>',
      brouillon: '<span class="badge badge-warn">Brouillon</span>',
      programme: '<span class="badge badge-info">Programmé</span>',
      corbeille: '<span class="badge badge-danger">Corbeille</span>'
    };
    return map[st] || '<span class="badge badge-muted">' + esc(st || 'publie') + '</span>';
  }

  function setN(id, n) {
    var el = document.getElementById(id);
    if (el) el.textContent = (n == null ? '—' : String(n));
  }

  function loadArticlesStats() {
    var h = (window.authHeaders || function (x) { return x || {}; })({ 'Cache-Control': 'no-cache' });
    return fetch('/api/admin/articles', { headers: h })
      .then(function (r) { return r.ok ? r.json() : null; });
  }

  function renderStatusDist(articles) {
    var wrap = document.getElementById('db-status-dist');
    if (!wrap) return;
    var counts = { publie: 0, brouillon: 0, programme: 0, corbeille: 0 };
    articles.forEach(function (a) {
      var s = a.status || 'publie';
      if (counts[s] !== undefined) counts[s]++;
    });
    var total = articles.length || 1;
    var labels = {
      publie: ['Publiés', 'badge-ok'],
      brouillon: ['Brouillons', 'badge-warn'],
      programme: ['Programmés', 'badge-info'],
      corbeille: ['Corbeille', 'badge-danger']
    };
    wrap.innerHTML = Object.keys(counts).map(function (k) {
      var pct = Math.round((counts[k] / total) * 100);
      return '<div class="progress-row">' +
        '<span class="p-label"><span class="badge ' + labels[k][1] + '">' + labels[k][0] + '</span></span>' +
        '<div class="progress-track"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
        '<span class="progress-val">' + counts[k] + '</span></div>';
    }).join('');
  }

  function renderRecent(articles) {
    var tbody = document.getElementById('db-recent-body');
    var empty = document.getElementById('db-recent-empty');
    var hint = document.getElementById('db-recent-hint');
    if (!tbody) return;
    var sorted = articles.slice().sort(function (a, b) {
      var da = a.date || String(a.id);
      var db = b.date || String(b.id);
      return da < db ? 1 : da > db ? -1 : 0;
    }).slice(0, 8);
    if (!sorted.length) {
      if (empty) empty.style.display = 'block';
      tbody.innerHTML = '';
      if (hint) hint.textContent = '';
      return;
    }
    if (empty) empty.style.display = 'none';
    if (hint) hint.textContent = sorted.length + ' derniers articles';
    tbody.innerHTML = sorted.map(function (a) {
      return '<tr>' +
        '<td class="art-title-cell">' + esc(a.title || '') + '<small>par ' + esc(a.author || '—') + '</small></td>' +
        '<td>' + esc(a.category || '') + '</td>' +
        '<td>' + badge(a.status || 'publie') + '</td>' +
        '<td>' + (a.views || 0) + '</td>' +
        '<td>' + fmtDate(a.date) + '</td>' +
        '</tr>';
    }).join('');
  }

  function loadViewsTotal() {
    return fetch('/api/articles/lite')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (list) {
        if (!list) return null;
        return list.reduce(function (s, a) { return s + (a.views || 0); }, 0);
      })
      .catch(function () { return null; });
  }

  function loadUsers() {
    var h = (window.authHeaders || function (x) { return x || {}; })();
    return fetch('/api/admin/accounts', { headers: h })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  function init() {
    var dashState = document.getElementById('db-status-dist');
    if (dashState) dashState.innerHTML = '<div class="skeleton" style="height:18px;margin:8px 0;"></div><div class="skeleton" style="height:18px;margin:8px 0;"></div><div class="skeleton" style="height:18px;margin:8px 0;"></div>';

    loadArticlesStats().then(function (articles) {
      if (!articles) {
        var tbody = document.getElementById('db-recent-body');
        if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="ui-state"><div class="ui-title">Une erreur est survenue. Veuillez réessayer.</div></td></tr>';
        var d = document.getElementById('db-status-dist');
        if (d) d.innerHTML = '';
        setN('db-drafts', null);
        return;
      }
      var drafts = articles.filter(function (a) { return (a.status || 'publie') === 'brouillon'; }).length;
      setN('db-drafts', drafts);
      renderStatusDist(articles);
      renderRecent(articles);
    }).catch(function () { });

    loadViewsTotal().then(function (n) { setN('db-totalviews', n); });
    loadUsers().then(function (res) {
      setN('db-users', res && res.accounts ? res.accounts.length : null);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
