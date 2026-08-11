// =====================================================
// ADMIN LAYOUT — Layout professionnel « Media Management
// Dashboard » injecté sur toutes les pages admin.
// Préserve les IDs utilisés par admin.js (admin-name-display,
// logout-btn, .admin-sidebar, .admin-header .container).
// Chargé AVANT admin.js.
// =====================================================
(function () {
  if (!document.querySelector('.admin-body')) return;

  var ICONS = {
    dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"></rect><rect x="14" y="3" width="7" height="5" rx="1.5"></rect><rect x="14" y="12" width="7" height="9" rx="1.5"></rect><rect x="3" y="16" width="7" height="5" rx="1.5"></rect></svg>',
    article: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path><path d="M9 13h6M9 17h6M9 9h2"></path></svg>',
    draft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"></path></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><path d="M22 4L12 14.01l-3-3"></path></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><circle cx="7" cy="7" r="1.5"></circle></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path></svg>',
    comment: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"></path></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
    megaphone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-5v12L3 14v-3z"></path><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path></svg>',
    coin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v10M9.5 9.5c0-1 1.1-1.5 2.5-1.5s2.5.5 2.5 1.5-1 1.4-2.5 1.5-2.5.5-2.5 1.5 1 1.5 2.5 1.5 2.5-.5 2.5-1.5"></path></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M22 7l-10 6L2 7"></path></svg>',
    file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><path d="M9 22V12h6v10"></path></svg>'
  };

  function ico(name) {
    return '<span class="side-ico" aria-hidden="true">' + (ICONS[name] || ICONS.file) + '</span>';
  }

  // ---- MENU STRUCTURÉ (§19 : entrées mappées aux pages existantes) ----
  var MENU = [
    { group: 'Pilotage' },
    { label: 'Tableau de bord', href: 'index.html', icon: 'dashboard' },
    { label: 'Articles', href: 'articles.html', icon: 'article' },
    { label: 'Ajouter un article', href: 'articles.html#nouveau', icon: 'draft' },
    { label: 'Brouillons', href: 'articles.html#brouillons', icon: 'draft' },
    { label: 'Articles publiés', href: 'articles.html#publies', icon: 'check' },
    { label: 'Catégories', href: 'articles.html#cats', icon: 'tag' },
    { label: 'Auteurs', href: 'articles.html#auteurs', icon: 'user' },
    { group: 'Audience' },
    { label: 'Commentaires', href: 'comments.html', icon: 'comment' },
    { label: 'Statistiques', href: 'analytics.html', icon: 'chart' },
    { label: 'Newsletter', href: 'newsletter.html', icon: 'mail' },
    { label: 'Médias', href: 'media.html', icon: 'media' },
    { group: 'Gestion' },
    { label: 'Faire un Don', href: 'campaigns.html', icon: 'megaphone' },
    { label: 'Dons & paiements', href: 'donations.html', icon: 'coin' },
    { label: 'Publicit\u00e9s', href: 'ads.html', icon: 'megaphone' },
    { label: 'Pages', href: 'pages.html', icon: 'file' },
    { label: 'Utilisateurs & rôles', href: 'security.html#comptes', icon: 'shield' },
    { label: 'Sécurité', href: 'security.html', icon: 'shield' },
    { label: 'Journal d\u2019activités', href: 'journal.html', icon: 'clock' },
    { group: 'Lien' },
    { label: 'Voir le site', href: '../index.html', icon: 'home' }
  ];

  function pageName() {
    return (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  }

  // Filtrage RBAC (ROLE_PAGES exposé globalement par admin.js, chargé après).
  function applyRoleFilter() {
    var nav = document.querySelector('.admin-sidebar');
    var pages = window.ROLE_PAGES;
    var role = localStorage.getItem('admin_role') || '';
    if (!nav || !pages || !role) return;
    nav.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href').split('/').pop();
      var page = href.split('#')[0];
      if (!href || !page) return;
      if (!(page in pages)) return;
      if (pages[page].indexOf(role) === -1) a.style.display = 'none';
    });
  }

  function buildSidebar() {
    var nav = document.querySelector('.admin-sidebar');
    if (!nav) return;
    var cur = pageName();
    var html = '';
    MENU.forEach(function (m) {
      if (m.group) { html += '<div class="side-group">' + m.group + '</div>'; return; }
      var href = m.href.split('#')[0];
      var isActive = (href === cur) && (cur !== 'index.html' || m.href === 'index.html');
      if (cur === 'index.html' && m.href === 'index.html') isActive = true;
      if (m.href === 'articles.html' && (cur === 'articles.html' || cur === '')) isActive = true;
      html += '<a href="' + m.href + '" data-base="' + href + '"' + (isActive ? ' class="active" aria-current="page"' : '') + '>' +
        ico(m.icon) + '<span>' + m.label + '</span></a>';
    });
    nav.innerHTML = html;
    var role = (localStorage.getItem('admin_role') || '').toLowerCase();
    var canArticles = ['super_admin', 'admin', 'editeur', 'journaliste'].indexOf(role) !== -1;
    if (!canArticles && role) {
      nav.querySelectorAll('a[data-base="articles.html"]').forEach(function (a) { a.style.display = 'none'; });
    }
  }

  function buildHeader() {
    var container = document.querySelector('.admin-header .container');
    if (!container) return;
    var isLogin = !!document.querySelector('.login-page');
    var nameEl = document.getElementById('admin-name-display');
    var logout = document.getElementById('logout-btn');
    var newHtml =
      (isLogin ? '' : '<button type="button" class="adm-burger" id="adm-burger" aria-label="Ouvrir le menu">' +
        '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"></path></svg></button>') +
      '<a class="adm-brand" href="index.html" aria-label="Administration — retour au tableau de bord">' +
      '<span class="adm-logo" aria-hidden="true">' + (isLogin ? '' : 'J') + '</span>' +
      '<span>' + (isLogin ? 'Administration' : 'Chronique de James') + '<small>Media Management</small></span></a>';
    if (!isLogin) {
      newHtml += '<div class="adm-head-right">' +
        (nameEl ? '<span class="adm-user-chip"><span class="adm-avatar" aria-hidden="true">' + (nameEl.textContent ? nameEl.textContent.trim().charAt(0).toUpperCase() : 'A') + '</span><span id="admin-name-display"></span></span>' : '') +
        (logout ? '<a href="#" id="logout-btn" class="adm-link">Déconnexion</a>' : '') +
        '</div>';
    } else {
      newHtml += '<span style="font-size:0.78rem;color:var(--adm-muted);margin-left:auto;">Espace sécurisé</span>';
    }
    container.innerHTML = newHtml;
    if (!isLogin && document.querySelector('.admin-sidebar')) {
      var bd = document.createElement('div');
      bd.className = 'adm-sidebar-backdrop';
      bd.id = 'adm-backdrop';
      document.body.appendChild(bd);
      var burger = document.getElementById('adm-burger');
      var nav = document.querySelector('.admin-sidebar');
      function toggle(open) {
        nav.classList.toggle('open', open);
        bd.classList.toggle('show', open);
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
        document.body.style.overflow = open ? 'hidden' : '';
      }
      burger.addEventListener('click', function () { toggle(!nav.classList.contains('open')); });
      bd.addEventListener('click', function () { toggle(false); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && nav.classList.contains('open')) { toggle(false); }
      });
    }
  }

  // ---- FILTRE PAR HASH (articles.html#nouveau / #brouillons / #publies / #programmes / #corbeille) ----
  function applyHashFilter() {
    if (!document.querySelector('#articles-table-body')) return;
    var h = window.location.hash.replace('#', '').toLowerCase();
    if (h === 'nouveau') {
      var nb = document.getElementById('new-article-btn');
      if (nb) {
        var delay = 0;
        var attempt = setInterval(function () {
          var form = document.getElementById('article-form-container');
          var shown = form && form.style.display !== 'none';
          if (shown || delay > 2000) {
            clearInterval(attempt);
            if (!shown) nb.click();
          }
          delay += 120;
        }, 120);
      }
      if (history.replaceState) history.replaceState(null, '', window.location.pathname);
      return;
    }
    var map = { brouillons: 'brouillon', publies: 'publie', programmes: 'programme', corbeille: 'corbeille' };
    var filter = map[h];
    if (!filter) return;
    var tab = document.querySelector('.art-filter-tab[data-filter="' + filter + '"]');
    if (!tab) return;
    var delay = 0;
    var attempt = setInterval(function () {
      var ready = document.querySelector('#articles-table-body').children.length > 0;
      if (ready || delay > 2500) {
        clearInterval(attempt);
        if (ready) tab.click();
        if (history.replaceState) history.replaceState(null, '', window.location.pathname);
      }
      delay += 120;
    }, 120);
  }

  function init() {
    buildSidebar();
    buildHeader();
    applyHashFilter();
    applyRoleFilter();
    var nav = document.querySelector('.admin-sidebar');
    if (nav) { nav.setAttribute('aria-label', 'Navigation administrateur'); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
