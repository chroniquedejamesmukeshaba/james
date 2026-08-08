// ===== HOME MODERNE : breaking, à la une, sections, recherche =====
(function () {
  var articles = [];
  var siteLang = 'fr';
  var PREF_CATS = ['RDC', 'International', 'Politique', 'Société', 'Économie', 'Santé', 'Éducation', 'Sport', 'Technologie'];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function hasImg(a) {
    return a.image && (a.image[0] === '/' || a.image.indexOf('http') === 0 || a.image.indexOf('data:') === 0);
  }
  function imgOf(a) { return hasImg(a) ? a.image : ''; }
  function thumbOf(a) {
    var src = imgOf(a);
    return src
      ? '<img src="' + esc(src) + '" alt="' + esc(a.title) + '" loading="lazy" decoding="async">'
      : '<span aria-hidden="true">📰</span>';
  }
  function fmtDate(d) { return String(d || ''); }
  function authorOf(a) { return esc(a.author || 'Chronique'); }
  function catOf(a) { return esc(normCat(a.category)); }
  function linkOf(a) { return '/article?id=' + esc(a.id); }

  function sorted() {
    return articles.slice().sort(function (x, y) { return (y.id || 0) - (x.id || 0); });
  }
  function normCat(c) {
    c = String(c || '').trim();
    if (!c) return 'Actualité';
    return c.charAt(0).toUpperCase() + c.slice(1);
  }
  function byCat(list) {
    var map = {};
    list.forEach(function (a) {
      var c = normCat(a.category);
      if (!map[c]) map[c] = [];
      map[c].push(a);
    });
    return map;
  }

  // ---------- BREAKING TICKER ----------
  function renderTicker(list) {
    var itemsEl = document.getElementById('ticker-items');
    if (!itemsEl) return;
    if (!list.length) { itemsEl.closest('.breaking-ticker').style.display = 'none'; return; }
    var n = Math.min(5, list.length);
    var html = '';
    for (var i = 0; i < n; i++) {
      var a = list[i];
      html += '<li' + (i === 0 ? ' class="active"' : '') + '>' +
        '<strong>' + (typeof t === 'function' ? t('home_breaking') : 'Dernière heure') + '</strong>' +
        '<a href="' + linkOf(a) + '">' + esc(a.title) + '</a></li>';
    }
    itemsEl.innerHTML = html;
    var lis = itemsEl.querySelectorAll('li');
    var cur = 0;
    if (lis.length < 2) return;
    var timer = setInterval(function () {
      lis[cur].classList.remove('active'); cur = (cur + 1) % lis.length;
      lis[cur].classList.add('active');
    }, 5000);
    itemsEl.addEventListener('mouseenter', function () { clearInterval(timer); });
    itemsEl.addEventListener('mouseleave', function () {
      timer = setInterval(function () {
        lis[cur].classList.remove('active'); cur = (cur + 1) % lis.length;
        lis[cur].classList.add('active');
      }, 5000);
    });
    itemsEl.closest('.breaking-ticker').querySelector('.ticker-prev').onclick = function () {
      lis[cur].classList.remove('active'); cur = (cur - 1 + lis.length) % lis.length; lis[cur].classList.add('active');
    };
    itemsEl.closest('.breaking-ticker').querySelector('.ticker-next').onclick = function () {
      lis[cur].classList.remove('active'); cur = (cur + 1) % lis.length; lis[cur].classList.add('active');
    };
  }

  // ---------- HERO : BREAKING + À LA UNE ----------
  function renderHero(list) {
    var feat = document.getElementById('hero-feature');
    var side = document.getElementById('side-list');
    if (!feat || !side) return;
    if (!list.length) { document.getElementById('home-hero').innerHTML = '<p class="search-empty">Aucun article pour le moment.</p>'; return; }
    var main = list[0];
    for (var i = 1; i < list.length; i++) { if (hasImg(list[i])) { main = list[i]; list.splice(i, 1); break; } }
    var bg = imgOf(main);
    feat.innerHTML =
      (bg ? '<img class="bg" src="' + esc(bg) + '" alt="" loading="eager" decoding="async">' : '') +
      '<div class="fade"></div>' +
      '<div class="content">' +
      '<span class="chip red">' + (typeof t === 'function' ? t('home_breaking') : 'Dernière heure') + '</span>' +
      '<h2><a href="' + linkOf(main) + '">' + esc(main.title) + '</a></h2>' +
      (main.excerpt ? '<p class="excerpt">' + esc(main.excerpt) + '</p>' : '') +
      '<div class="meta-line">' +
      '<span><b>' + catOf(main) + '</b></span>' +
      '<span>' + fmtDate(main.date) + '</span>' +
      '<span>' + (typeof t === 'function' ? t('article_by') : 'Par') + ' ' + authorOf(main) + '</span>' +
      '</div>' +
      '<a href="' + linkOf(main) + '" class="btn btn-accent">' + (typeof t === 'function' ? t('read_article') : 'Lire l\'article') + ' →</a>' +
      '</div>';
    var rest = list.slice(0, 5);
    if (!rest.length) { side.innerHTML = ''; return; }
    side.innerHTML = rest.map(function (a) {
      return '<a class="side-item" href="' + linkOf(a) + '">' + thumbOf(a) +
        '<div><div class="t">' + esc(a.title) + '</div>' +
        '<div class="m">' + catOf(a) + ' • ' + fmtDate(a.date) + '</div></div></a>';
    }).join('');
  }

  // ---------- CARTE ----------
  function catLink(a) { return a && a.cat ? '/categorie/' + esc(a.cat) : ''; }
  function cardHtml(a) {
    var cl = catLink(a);
    return '<article class="home-card"><a class="thumb" href="' + linkOf(a) + '" tabindex="-1" aria-hidden="true">' + thumbOf(a) + '</a>' +
      '<div class="body"><div class="cat">' + (cl ? '<a href="' + cl + '">' + catOf(a) + '</a>' : catOf(a)) + '</div>' +
      '<h3><a href="' + linkOf(a) + '">' + esc(a.title) + '</a></h3>' +
      '<div class="foot"><span>' + fmtDate(a.date) + '</span><span>' + authorOf(a) + '</span></div></div></article>';
  }

  // ---------- SECTIONS THÉMATIQUES ----------
  function sectionHtml(titleKey, titleFallback, list, viewMore, slug) {
    if (!list.length) return '';
    var tt = (typeof t === 'function' ? t(titleKey) : '') || '';
    if (!tt || tt === titleKey) tt = titleFallback;
    var more = '';
    if (viewMore) {
      var href = slug ? '/categorie/' + esc(slug) : 'actualites.html';
      more = '<a class="head-link" href="' + href + '">' + (typeof t === 'function' ? t('home_view_more') : 'Voir plus') + ' →</a>';
    }
    return '<section class="home-section"><div class="container"><div class="head">' +
      '<h2>' + esc(tt) + '</h2>' + more +
      '</div><div class="section-grid">' + list.slice(0, 4).map(cardHtml).join('') + '</div></div></section>';
  }

  function slugOf(catName) {
    var list = articles;
    for (var i = 0; i < list.length; i++) {
      if (normCat(list[i].category) === catName && list[i].cat) return list[i].cat;
    }
    return '';
  }

  function renderSections() {
    var wrap = document.getElementById('home-sections');
    if (!wrap) return;
    var list = sorted();
    var html = sectionHtml('home_latest', 'Dernières actualités', list, true, '');
    var map = byCat(list);
    var used = {};
    PREF_CATS.forEach(function (c) {
      if (map[c] && map[c].length) {
        used[c] = true;
        html += sectionHtml('cat_' + c, c, map[c], true, slugOf(c));
      }
    });
    Object.keys(map).forEach(function (c) {
      if (!used[c] && map[c].length) {
        html += sectionHtml('cat_' + c, c, map[c], true, slugOf(c));
      }
    });
    wrap.innerHTML = html;
  }

  // ---------- RECHERCHE ----------
  function initSearch() {
    var overlay = document.getElementById('search-overlay');
    var input = document.getElementById('search-input');
    var results = document.getElementById('search-results');
    var openBtn = document.getElementById('search-open');
    var closeBtn = document.getElementById('search-close');
    if (!overlay) return;
    openBtn.onclick = function () { overlay.classList.add('open'); setTimeout(function () { input.focus(); }, 60); };
    function closeIt() { overlay.classList.remove('open'); input.value = ''; }
    closeBtn.onclick = closeIt;
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeIt(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeIt(); });
    if (window.LiveSearch) {
      // Recherche intelligente : suggestions instantanees via /api/search
      window.LiveSearch.bind(input, results, {
        onEnter: function (q) {
          if (q) window.location.href = '/recherche?q=' + encodeURIComponent(q);
        },
        onEscape: closeIt,
        onPick: closeIt
      });
      results.classList.add('live-in-overlay');
      return;
    }
    // Fallback local (hors-ligne / sans serveur)
    function show(q) {
      q = (q || '').toLowerCase();
      var hits = sorted().filter(function (a) {
        return (a.title || '').toLowerCase().indexOf(q) > -1 ||
          (a.excerpt || '').toLowerCase().indexOf(q) > -1 ||
          (a.category || '').toLowerCase().indexOf(q) > -1;
      }).slice(0, 8);
      if (!q) { results.innerHTML = '<div class="search-empty">' + (typeof t === 'function' ? t('home_search_hint') : 'Tapez pour rechercher un article...') + '</div>'; return; }
      if (!hits.length) { results.innerHTML = '<div class="search-empty">' + (typeof t === 'function' ? t('home_search_none') : 'Aucun r\u00e9sultat pour cette recherche.') + '</div>'; return; }
      results.innerHTML = '<div class="search-hit-title">' + hits.length + ' - ' + (typeof t === 'function' ? t('home_search_title') : 'R\u00e9sultats') + '</div>' +
        hits.map(function (a) {
          return '<a class="search-hit" href="' + linkOf(a) + '">' + thumbOf(a) +
            '<div><div class="t">' + esc(a.title) + '</div><div class="c">' + catOf(a) + '</div></div></a>';
        }).join('');
    }
    input.addEventListener('input', function () { show(input.value); });
  }

  // ---------- CHARGEMENT ----------
  function renderAll() {
    var list = sorted();
    renderTicker(list);
    renderHero(list);
    renderSections();
  }

  function loadLocal() {
    articles = JSON.parse(localStorage.getItem('admin_articles') || '[]');
    if (articles.length === 0) {
      articles = [
        { id: 1, title: 'Lancement officiel de la Chronique au Canada', category: 'International', excerpt: 'Le média annonce son expansion au Canada avec l\'ouverture d\'un bureau à Alberta.', image: '', date: '2026-06-20', author: 'James Mukeshaba' },
        { id: 2, title: 'Campagne : Ensemble contre les violences faites aux femmes', category: 'Sensibilisation', excerpt: 'Une nouvelle campagne de sensibilisation est lancée à Bukavu.', image: '', date: '2026-06-18', author: 'Équipe Sensibilisation' },
        { id: 3, title: 'Projet d\'assainissement : Bukavu ville propre', category: 'Projets', excerpt: 'Découvrez notre nouveau projet communautaire.', image: '', date: '2026-06-15', author: 'James Mukeshaba' }
      ];
    }
    if (siteLang !== 'fr') applyLocalLang();
    renderAll();
  }

  function applyLocalLang() {
    articles.forEach(function (a) {
      ['title', 'excerpt'].forEach(function (f) {
        var k = f + '_' + siteLang;
        if (a[k]) a[f] = a[k];
      });
    });
  }

  function loadFromServer() {
    if (window.location.protocol === 'file:') { loadLocal(); return; }
    fetch('/api/articles/lite?lang=' + siteLang).then(function (r) { return r.json(); }).then(function (d) {
      if (d && d.length) { articles = d; renderAll(); }
      else loadLocal();
    }).catch(function () { loadLocal(); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    siteLang = (typeof localStorage !== 'undefined' ? localStorage.getItem('cms_lang') : null) || 'fr';
    initSearch();
    loadFromServer();
    document.addEventListener('langchange', function () {
      siteLang = (typeof localStorage !== 'undefined' ? localStorage.getItem('cms_lang') : null) || 'fr';
      loadFromServer();
    });
  });
})();