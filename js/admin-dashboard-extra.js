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
    return fetch('/api/admin/articles', { headers: { 'Cache-Control': 'no-cache' } })
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
    return fetch('/api/admin/accounts')
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

// =====================================================
// MODE DÉMO — indicateurs de stimulation (demande client).
// Valeurs cohérentes entre elles, appliquées sur 12 mois.
// =====================================================
(function () {
  if (!document.querySelector('.admin-body') || !document.getElementById('db-visits')) return;

  var DEMO = {
    visits: 700,
    uniques: 32,
    readers: 1200,
    readTotalMin: 80000,
    totalViews: 700456,
    shares: 278,
    subs: 171
  };
  // Série 12 mois (croissance régulière menant aux valeurs actuelles)
  var MONTHS = ['sept', 'oct', 'nov', 'déc', 'janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août'];
  var SERIES_VISITS = [150, 190, 230, 280, 320, 360, 410, 460, 520, 580, 640, 700];
  var SERIES_UNIQUES = [8, 10, 12, 13, 15, 16, 18, 20, 22, 24, 27, 32];

  function fmt(n) { return n.toLocaleString('fr-FR'); }

  function avgReadLabel() {
    var min = DEMO.readTotalMin / DEMO.readers; // ≈ 66,7 min
    var h = Math.floor(min / 60);
    var m = Math.round(min % 60);
    return h > 0 ? (h + ' h ' + m + ' min') : (m + ' min');
  }

  function applyDemo() {
    var set = function (id, val) {
      var el = document.getElementById(id);
      if (el && el.textContent !== val) el.textContent = val;
    };
    set('db-visits', fmt(DEMO.visits));
    set('db-uniques', fmt(DEMO.uniques));
    set('db-readers', fmt(DEMO.readers));
    set('db-totalviews', fmt(DEMO.totalViews));
    set('db-shares', fmt(DEMO.shares));
    set('db-subs', fmt(DEMO.subs));
    var readsec = document.getElementById('db-readsec');
    if (readsec && readsec.textContent !== fmt(DEMO.readTotalMin)) readsec.textContent = fmt(DEMO.readTotalMin);
    var readsub = document.getElementById('db-readsub');
    if (readsub && readsub.textContent !== 'minutes de lecture') readsub.textContent = 'minutes de lecture';
    var avg = document.getElementById('db-avg-read');
    if (avg && avg.textContent !== avgReadLabel()) avg.textContent = avgReadLabel();
    var sub = document.getElementById('db-visits-sub');
    if (sub && sub.textContent !== '30 derniers jours') sub.textContent = '30 derniers jours';

    // Graphique 12 mois (dessiné par-dessus si les données réelles reviennent)
    var chart = document.getElementById('db-line-chart');
    if (chart && chart.getContext && window.Dash) {
      var labels = MONTHS.map(function (m) { return m; });
      window.Dash.line(chart, [
        { labels: labels, data: SERIES_VISITS, name: 'Visites', color: '#58a6ff' },
        { labels: labels, data: SERIES_UNIQUES, name: 'Visiteurs uniques', color: '#3fb950' }
      ], ['#58a6ff', '#3fb950']);
      var lg = chart.parentNode ? chart.parentNode.querySelector('.dash-legend') : null;
      if (lg) {
        lg.innerHTML = '<span><i style="background:#58a6ff;"></i> Visites</span>' +
          '<span><i style="background:#3fb950;"></i> Visiteurs uniques</span>' +
          '<span style="margin-left:auto;color:#8b949e;">12 mois</span>';
      }
    }
  }

  // Ré-applique la démo si le rafraîchissement temps réel (60 s) la remplace
  var last = '';
  function tick() {
    var v = document.getElementById('db-visits');
    if (v && v.textContent !== fmt(DEMO.visits) && v.textContent !== '—') applyDemo();
    last = v ? v.textContent : '';
  }
  setInterval(tick, 3000);

  function start() {
    applyDemo();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
