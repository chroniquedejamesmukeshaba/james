// ===== HOME : breaking, à la une, sections, recherche, plus lus =====
(function () {
  var articles = [];
  var siteLang = 'fr';
  var PREF_CATS = ['Société', 'Santé', 'Politique', 'International', 'Éducation', 'Sport', 'Environnement', 'Sécurité', 'Culture'];

  // ---- petite lib d'icônes SVG (lucide-like, stroke currentColor) ----
  var IC = {
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
    zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    newspaper: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0V7"/><line x1="10" y1="7" x2="18" y2="7"/><line x1="10" y1="11" x2="18" y2="11"/><line x1="10" y1="15" x2="14" y2="15"/></svg>',
    fire: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22c4.418 0 8-3.582 8-8 0-3.5-2-5.5-3-6.5C16 6 15.5 4.5 15.5 3c-2 1.5-3 3.5-3 4.5C11 7 10 6.5 9.5 6c.5 2.5-1 5-1.5 6-.5 1 0 2 1 2.5 0-1 1-1.5 1.5-2 .5 1 .5 2.5 1 3.5 0 .8-2 3-2 4.5 0 1 .9 1.5 2 1.5z" transform="scale(0.95) translate(0.6 1)"/></svg>',
    megaphone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>'
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function hasImg(a) {
    return a.image && (a.image[0] === '/' || a.image.indexOf('http') === 0 || a.image.indexOf('data:') === 0);
  }
  function imgOf(a) { return hasImg(a) ? a.image : ''; }
  function fmtDate(d) { return String(d || ''); }
  function authorOf(a) { return esc(a.author || 'Chronique'); }
  function catOf(a) { return esc(normCat(a.category)); }
  function linkOf(a) { return '/article?id=' + esc(a.id); }
  function catLink(a) { return a && a.cat ? '/categorie/' + esc(a.cat) : ''; }

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
  function t(key, fb) {
    return (typeof window !== 'undefined' && typeof window.t === 'function' && window.t(key) !== key)
      ? window.t(key) : fb;
  }
  function readMinsOf(a) {
    var m = parseInt(a.readMins || a.readMin || 0, 10);
    return m > 0 ? m : 2;
  }
  function viewsOf(a) {
    var v = parseInt(a.views, 10);
    return isNaN(v) || v <= 0 ? null : v;
  }
  function metaTags(a) {
    var v = viewsOf(a);
    return '<span class="fc">' + IC.calendar + '</span><span>' + fmtDate(a.date) + '</span>' +
      '<span class="fc">' + IC.clock + '</span><span>' + readMinsOf(a) + ' min</span>' +
      (v !== null ? '<span class="fc">' + IC.eye + '</span><span>' + v + '</span>' : '');
  }

  // ---------- SKELETON ----------
  function injectSkeletons(wrap, n) {
    if (!wrap) return;
    wrap.innerHTML = Array.apply(null, new Array(n)).map(function () {
      return '<div class="home-card sk-card"><div class="sk-thumb skeleton"></div>' +
        '<div class="sk-line skeleton"></div><div class="sk-line sk-w80 skeleton"></div>' +
        '<div class="sk-line sk-w60 skeleton"></div></div>';
    }).join('');
  }
  function injectHeroSkeleton() {
    var feat = document.getElementById('hero-feature');
    var subWrap = document.getElementById('hero-sub');
    if (feat) feat.innerHTML = '<div class="skeleton" style="width:100%;height:100%;min-height:430px;border-radius:14px;"></div>';
    if (subWrap) subWrap.innerHTML = Array.from({ length: 2 }).map(function () {
      return '<div class="skeleton" style="width:100%;height:215px;border-radius:14px;"></div>';
    }).join('');
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
        '<strong>' + t('home_breaking', 'Dernière heure') + '</strong>' +
        '<a href="' + linkOf(a) + '">' + esc(a.title) + '</a></li>';
    }
    itemsEl.innerHTML = html;
    var lis = itemsEl.querySelectorAll('li');
    var cur = 0;
    if (lis.length < 2) return;
    var timer, start = function () {
      timer = setInterval(function () {
        lis[cur].classList.remove('active'); cur = (cur + 1) % lis.length;
        lis[cur].classList.add('active');
      }, 5000);
    };
    start();
    itemsEl.addEventListener('mouseenter', function () { clearInterval(timer); });
    itemsEl.addEventListener('mouseleave', start);
    itemsEl.closest('.breaking-ticker').querySelector('.ticker-prev').onclick = function () {
      clearInterval(timer); lis[cur].classList.remove('active'); cur = (cur - 1 + lis.length) % lis.length; lis[cur].classList.add('active'); start();
    };
    itemsEl.closest('.breaking-ticker').querySelector('.ticker-next').onclick = function () {
      clearInterval(timer); lis[cur].classList.remove('active'); cur = (cur + 1) % lis.length; lis[cur].classList.add('active'); start();
    };
  }

  // ---------- HERO : article principal + secondaires + À la une ----------
  function subItemHtml(a) {
    var src = imgOf(a);
    var style = src ? '' : ' style="background:linear-gradient(140deg,var(--primary),var(--primary-hover));"';
    return '<a class="sub-item" href="' + linkOf(a) + '"' + style + '>' +
      (src ? '<img src="' + esc(src) + '" alt="" loading="lazy" decoding="async">' : '') +
      '<div class="fade"></div>' +
      '<div class="meta"><span class="cat">' + catOf(a) + '</span>' +
      '<h3>' + esc(a.title) + '</h3>' +
      '<span class="when">' + IC.calendar + '<span>' + fmtDate(a.date) + '</span></span></div></a>';
  }

  function renderHero(list) {
    var feat = document.getElementById('hero-feature');
    var subWrap = document.getElementById('hero-sub');
    if (!feat) return;
    if (!list.length) {
      var zone = document.getElementById('home-hero');
      if (zone) zone.innerHTML = '<div class="card" style="padding:30px;text-align:center;color:var(--text-light);">' +
        '<p style="font-size:1.05rem;">' + t('home_empty', 'Aucun article disponible pour le moment.') + '</p></div>';
      return;
    }
    var main = list[0], mainIdx = 0;
    for (var i = 1; i < list.length; i++) { if (hasImg(list[i])) { main = list[i]; mainIdx = i; break; } }
    var rest = [];
    list.forEach(function (a, i) { if (i !== mainIdx) rest.push(a); });
    var sub = [], subIdx = [];
    rest.forEach(function (a, i) { if (sub.length < 2 && hasImg(a)) { sub.push(a); subIdx.push(i); } });

    var bg = imgOf(main);
    feat.innerHTML =
      (bg ? '<img class="bg" src="' + esc(bg) + '" alt="" loading="eager" decoding="async">' : '') +
      '<div class="fade"></div>' +
      '<div class="content">' +
      '<span class="chip">' + IC.zap + '<span>' + t('home_breaking', 'Dernière heure') + '</span></span>' +
      '<h2><a href="' + linkOf(main) + '">' + esc(main.title) + '</a></h2>' +
      (main.excerpt ? '<p class="excerpt">' + esc(main.excerpt) + '</p>' : '') +
      '<div class="meta-line">' +
      '<span class="met">' + IC.calendar + '<span>' + fmtDate(main.date) + '</span></span>' +
      '<span class="met"><b>' + catOf(main) + '</b></span>' +
      '<span class="met">' + IC.user + '<span>' + authorOf(main) + '</span></span>' +
      '<span class="met">' + IC.clock + '<span>' + readMinsOf(main) + ' min</span></span>' +
      '</div>' +
      '<a href="' + linkOf(main) + '" class="btn btn-accent">' + t('read_article', 'Lire l\'article') + '</a>' +
      '</div>';
    if (subWrap) subWrap.innerHTML = sub.length ? sub.map(subItemHtml).join('') : '';
  }

  // ---------- NewsCard ----------
  function thumbOf(a) {
    var src = imgOf(a);
    return src
      ? '<img src="' + esc(src) + '" alt="' + esc(a.title) + '" loading="lazy" decoding="async">'
      : '<span class="no-thumb">' + IC.newspaper + '</span>';
  }
  function cardHtml(a, featured) {
    var cl = catLink(a);
    var ncomments = parseInt(a.comments, 10);
    return '<article class="home-card' + (featured ? ' nc-featured' : '') + '">' +
      '<a class="thumb" href="' + linkOf(a) + '" tabindex="-1" aria-hidden="true">' + thumbOf(a) + '</a>' +
      '<div class="body">' +
      '<div class="cat">' + (cl ? '<a href="' + cl + '">' + catOf(a) + '</a>' : catOf(a)) + '</div>' +
      '<h3><a href="' + linkOf(a) + '">' + esc(a.title) + '</a></h3>' +
      (a.excerpt ? '<p class="p-summary">' + esc(a.excerpt) + '</p>' : '') +
      '<div class="foot">' + metaTags(a) +
      (ncomments > 0 ? '<span class="fc">' + IC.user + '<span>' + ncomments + '</span></span>' : '') +
      '<a class="read-link" href="' + linkOf(a) + '">' + t('home_view', 'Lire') + ' ' + IC.arrow + '</a>' +
      '</div></div></article>';
  }

  // ---------- SECTIONS THÉMATIQUES ----------
  function sectionHtml(titleKey, titleFallback, list, viewMore, slug, limit, featured) {
    if (!list.length) return '';
    var tt = t(titleKey, titleFallback);
    var more = '';
    if (viewMore) {
      var href = slug ? '/categorie/' + esc(slug) : 'actualites.html';
      more = '<a class="head-link" href="' + href + '">' + t('home_view_more', 'Voir plus') + ' ' + IC.arrow + '</a>';
    }
    return '<section class="home-section"><div class="container"><div class="head">' +
      '<h2>' + esc(tt) + '</h2>' + more +
      '</div><div class="section-grid">' + list.slice(0, limit || 4).map(function (a, i) {
        return cardHtml(a, !!(featured && i === 0));
      }).join('') + '</div></div></section>';
  }

  function slugOf(catName) {
    for (var i = 0; i < articles.length; i++) {
      if (normCat(articles[i].category) === catName && articles[i].cat) return articles[i].cat;
    }
    return '';
  }

  var PER_PAGE = 12;

  function renderSections() {
    var wrap = document.getElementById('home-sections');
    if (!wrap) return;
    var list = sorted();
    var html = sectionHtml('home_latest', 'Dernières actualités', list, true, '', 5, true);
    var map = byCat(list);

    // Onglets par rubrique (comme les campagnes de financement, les projets et
    // les sensibilisations occupent l'accueil, on evite une liste interminable)
    var cats = [];
    var PREF_CATS_ALL = ['Projets', 'Sensibilisation'].concat(PREF_CATS);
    PREF_CATS_ALL.forEach(function (c) { if (map[c] && map[c].length && cats.indexOf(c) === -1) cats.push(c); });
    Object.keys(map).forEach(function (c) { if (cats.indexOf(c) === -1) cats.push(c); });

    function pageButtons(page, totalPages) {
      var btns = '<button type="button" class="pg-btn" data-page="' + (page - 1) + '"' + (page <= 1 ? ' disabled' : '') + '>&lsaquo;</button>';
      var shown = [];
      for (var i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) shown.push(i);
      }
      var prev = 0;
      shown.forEach(function (p) {
        if (prev && p - prev > 1) btns += '<span class="pg-ell" style="padding:0 4px;color:#94a3b8;">&hellip;</span>';
        btns += '<button type="button" class="pg-btn' + (p === page ? ' active' : '') + '" data-page="' + p + '">' + p + '</button>';
        prev = p;
      });
      btns += '<button type="button" class="pg-btn" data-page="' + (page + 1) + '"' + (page >= totalPages ? ' disabled' : '') + '>&rsaquo;</button>';
      return btns;
    }

    function cardGrid(selected, page) {
      var sel = selected === '__all__' ? list : map[selected];
      var items = sel || [];
      var totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));
      if (!page || page < 1) page = 1;
      if (page > totalPages) page = totalPages;
      var slice = items.slice((page - 1) * PER_PAGE, page * PER_PAGE);
      var pager = totalPages > 1
        ? '<nav class="pagination" style="grid-column:1/-1;margin-top:8px;">' + pageButtons(page, totalPages) + '</nav>'
        : '';
      return slice.map(function (a) { return cardHtml(a); }).join('') + pager;
    }

    var tabs = ['__all__'].concat(cats);
    var currentCat = '__all__';
    var currentPage = 1;
    html += '<section class="home-section"><div class="container"><div class="head">' +
      '<h2>' + t('home_cats', 'Toutes les actualités') + '</h2>' +
      '<div class="pop-tabs" role="tablist" aria-label="Rubriques">' +
      tabs.map(function (c, i) {
        return '<button type="button" role="tab" class="pop-tab' + (i === 0 ? ' active' : '') + '" data-cat="' + c + '">' +
          (c === '__all__' ? t('home_cats_all', 'Tout') : esc(c)) + '</button>';
      }).join('') + '</div></div>' +
      '<div class="section-grid cat-grid">' + cardGrid(currentCat, currentPage) + '</div>' +
      '<div style="display:flex;justify-content:center;margin-top:18px;"><a class="head-link" href="actualites.html">' + t('home_view_more', 'Voir plus') + ' ' + IC.arrow + '</a></div>' +
      '</div></section>';
    wrap.innerHTML = html;

    var grid = wrap.querySelector('.cat-grid');
    wrap.querySelectorAll('.pop-tab').forEach(function (b) {
      b.addEventListener('click', function () {
        wrap.querySelectorAll('.pop-tab').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        currentCat = b.dataset.cat;
        currentPage = 1;
        grid.innerHTML = cardGrid(currentCat, currentPage);
      });
    });
    grid.addEventListener('click', function (ev) {
      var b = ev.target.closest('.pg-btn');
      if (!b || b.disabled) return;
      var p = parseInt(b.dataset.page, 10);
      if (!(p > 0)) return;
      currentPage = p;
      grid.innerHTML = cardGrid(currentCat, currentPage);
    });
  }

  // ---------- RECHERCHE ----------
  function initSearch() {
    var overlay = document.getElementById('search-overlay');
    var input = document.getElementById('search-input');
    var results = document.getElementById('search-results');
    var openBtn = document.getElementById('search-open');
    var closeBtn = document.getElementById('search-close');
    if (!overlay) return;
    if (openBtn) openBtn.onclick = function () { overlay.classList.add('open'); setTimeout(function () { input && input.focus(); }, 60); };
    function closeIt() { overlay.classList.remove('open'); if (input) input.value = ''; }
    if (closeBtn) closeBtn.onclick = closeIt;
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeIt(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeIt(); });
    if (window.LiveSearch && input) {
      window.LiveSearch.bind(input, results, {
        onEnter: function (q) { if (q) window.location.href = '/recherche?q=' + encodeURIComponent(q); },
        onEscape: closeIt,
        onPick: closeIt
      });
      results.classList.add('live-in-overlay');
      return;
    }
    function show(q) {
      q = (q || '').toLowerCase();
      var hits = sorted().filter(function (a) {
        return (String(a.title || '')).toLowerCase().indexOf(q) > -1 ||
          String(a.excerpt || '').toLowerCase().indexOf(q) > -1 ||
          String(a.category || '').toLowerCase().indexOf(q) > -1;
      }).slice(0, 8);
      if (!q) { results.innerHTML = '<div class="search-empty">' + t('home_search_hint', 'Tapez pour rechercher un article...') + '</div>'; return; }
      if (!hits.length) { results.innerHTML = '<div class="search-empty">' + t('home_search_none', 'Aucun résultat pour cette recherche.') + '</div>'; return; }
      results.innerHTML = '<div class="search-hit-title">' + hits.length + ' ' + t('home_search_title', 'Résultats') + '</div>' +
        hits.map(function (a) {
          var src = imgOf(a);
          return '<a class="search-hit" href="' + linkOf(a) + '">' +
            (src ? '<img src="' + esc(src) + '" alt="" loading="lazy" decoding="async">' : '<span class="skeleton" style="width:64px;height:48px;border-radius:6px;flex-shrink:0;"></span>') +
            '<div><div class="t">' + esc(a.title) + '</div><div class="c">' + catOf(a) + '</div></div></a>';
        }).join('');
    }
    if (input) input.addEventListener('input', function () { show(input.value); });
  }

  // ---------- LES PLUS LUS ----------
  var POP_PERIODS = [['today', 'popular_today', "Aujourd'hui"], ['week', 'popular_week', 'Cette semaine'], ['month', 'popular_month', 'Ce mois'], ['all', 'popular_all', 'Depuis la publication']];
  var popPeriod = 'week';

  function renderMostRead() {
    var wrap = document.getElementById('home-popular');
    if (!wrap) return;
    if (window.location.protocol === 'file:') { wrap.style.display = 'none'; return; }
    wrap.innerHTML = '<div class="container"><div class="head"><h2>' + t('popular_title', 'Les plus lus') + '</h2></div>' +
      '<div class="section-grid">' + Array.from({ length: 4 }).map(function () {
        return '<div class="home-card sk-card"><div class="skeleton sk-thumb"></div><div class="sk-line skeleton"></div><div class="sk-line sk-w80 skeleton"></div><div class="sk-line sk-w60 skeleton"></div></div>';
      }).join('') + '</div></div>';
    fetch('/api/popular?period=' + popPeriod + '&limit=8&lang=' + siteLang)
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) {
        if (!d || !d.items || !d.items.length) { wrap.style.display = 'none'; return; }
        var tabs = POP_PERIODS.map(function (p) {
          return '<button type="button" class="pop-tab' + (p[0] === popPeriod ? ' active' : '') + '" data-period="' + p[0] + '">' + t(p[1], p[2]) + '</button>';
        }).join('');
        wrap.innerHTML = '<div class="container"><div class="head">' +
          '<h2>' + t('popular_title', 'Les plus lus') + '</h2>' +
          '<div class="pop-tabs" role="group" aria-label="Période">' + tabs + '</div>' +
          '</div><div class="section-grid pop-grid">' +
          d.items.map(function (a, i) {
            return '<article class="home-card pop-card"><span class="pop-rank">' + (i + 1) + '</span>' +
              '<a class="thumb" href="' + linkOf(a) + '" tabindex="-1" aria-hidden="true">' + thumbOf(a) + '</a>' +
              '<div class="body"><div class="cat">' + normCat(a.category) + '</div>' +
              '<h3><a href="' + linkOf(a) + '">' + esc(a.title) + '</a></h3>' +
              '<div class="pop-metrics">' +
              '<span>' + IC.eye + esc(a.views || 0) + '</span>' +
              '<span>' + IC.fire + esc(a.reactions || 0) + '</span>' +
              (a.comments > 0 ? '<span>' + IC.user + esc(a.comments) + '</span>' : '') +
              '<span>' + IC.arrow + esc(a.shares || 0) + '</span>' +
              '</div></div></article>';
          }).join('') + '</div></div>';
        wrap.querySelectorAll('.pop-tab').forEach(function (b) {
          b.addEventListener('click', function () {
            popPeriod = b.dataset.period;
            renderMostRead();
          });
        });
      })
      .catch(function () {
        wrap.innerHTML = '<div class="container"><div class="head"><h2>' + t('popular_title', 'Les plus lus') + '</h2></div>' +
          '<p class="search-empty">' + t('home_error', 'Impossible de charger les articles les plus lus.') + '</p></div>';
      });
  }

  // ---------- PUBLICITÉS (validées par l'admin) ----------
  function renderAds() {
    var wrap = document.getElementById('home-ads');
    if (!wrap) return;
    if (window.location.protocol === 'file:') { wrap.style.display = 'none'; return; }
    fetch('/api/ads/public?lang=' + siteLang + '&_=' + Date.now())
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) {
        if (!d || !d.length) { wrap.style.display = 'none'; return; }
        wrap.style.display = '';
        wrap.innerHTML = '<div class="container"><div class="head">' +
          '<h2>' + t('home_ads', 'Espace publicitaire') + '</h2>' +
          '<a class="head-link" href="publicite.html">' + t('home_ads_cta', 'Faire de la publicité') + ' ' + IC.arrow + '</a>' +
          '</div><div class="ads-grid">' +
          d.map(function (a) {
            var src = a.image && (a.image[0] === '/' || a.image.indexOf('http') === 0) ? a.image : '';
            return '<article class="ad-card">' +
              (src ? '<img src="' + esc(src) + '" alt="' + esc(a.title) + '" loading="lazy" decoding="async">' : '<div class="ad-noimg">' + IC.megaphone + '</div>') +
              '<div class="ad-body"><h3>' + esc(a.title) + '</h3>' +
              '<p>' + esc(a.description) + '</p>' +
              '<span class="ad-by">' + esc(a.name || '') + '</span></div></article>';
          }).join('') + '</div></div>';
      })
      .catch(function () { wrap.style.display = 'none'; });
  }

  // ---------- CARROUSEL PUBLICITAIRE (colonne « Espace publicitaire ») ----------
  function renderAdsCarousel() {
    var car = document.getElementById('ad-carousel');
    if (!car) return;
    var slides = document.getElementById('ad-slides');
    var dots = document.getElementById('ad-dots');
    if (!slides) return;
    var timer = null, idx = 0, items = [];

    function startLoop(speed) {
      if (timer) clearInterval(timer);
      if (items.length < 2) return;
      timer = setInterval(function () { idx = (idx + 1) % items.length; updateView(); }, speed);
    }
    function updateView() {
      slides.style.transform = 'translateX(-' + (idx * 100) + '%)';
      if (!dots) return;
      dots.querySelectorAll('.campaign-dot').forEach(function (el, i) { el.classList.toggle('active', i === idx); });
    }
    function goTo(i) {
      if (timer) clearInterval(timer);
      idx = i; updateView(); startLoop(5000);
    }
    function render(list) {
      if (!list || !list.length) {
        slides.innerHTML = '<div class="ad-empty">' + t('home_ads_empty', 'Votre publicité pourrait s\'afficher ici.') + '</div>';
        if (dots) dots.innerHTML = '';
        items = []; return;
      }
      var slidesHtml = '', dotsHtml = '';
      list.forEach(function (a, i) {
        var src = a.image && (a.image[0] === '/' || a.image.indexOf('http') === 0 || a.image.indexOf('data:') === 0) ? a.image : '';
        slidesHtml += '<div class="ad-slide">' +
          (src ? '<div class="ad-slide-img" style="background-image:url(' + esc(src) + ');"></div>' : '<div class="ad-slide-noimg">' + IC.megaphone + '</div>') +
          '<div class="ad-slide-text"><strong>' + esc(a.title) + '</strong>' +
          (a.description ? '<p>' + esc(a.description) + '</p>' : '') +
          '</div></div>';
        dotsHtml += '<button class="campaign-dot' + (i === 0 ? ' active' : '') + '" data-idx="' + i + '" aria-label="' + (i + 1) + '"></button>';
      });
      slides.innerHTML = slidesHtml;
      slides.style.transform = 'translateX(0)';
      if (dots) dots.innerHTML = dotsHtml;
      items = list; idx = 0;
      startLoop(5000);
    }

    if (window.location.protocol === 'file:') { render([]); return; }
    fetch('/api/ads/public?lang=' + siteLang + '&_=' + Date.now())
      .then(function (r) { return r.json(); })
      .then(function (d) { render(d || []); })
      .catch(function () { render([]); });
    car.addEventListener('click', function (e) {
      var tEl = e.target;
      if (tEl.classList.contains('campaign-dot') && tEl.dataset.idx !== undefined) goTo(parseInt(tEl.dataset.idx, 10));
      else if (tEl.classList.contains('ad-prev')) goTo((idx - 1 + items.length) % items.length);
      else if (tEl.classList.contains('ad-next')) goTo((idx + 1) % items.length);
    });
  }

  // ---------- CHARGEMENT ----------
  function renderAll() {
    var list = sorted();
    renderTicker(list);
    renderHero(list);
    renderSections();
    renderAds();
    renderAdsCarousel();
    renderMostRead();
  }

  function loadLocal() {
    articles = JSON.parse(localStorage.getItem('admin_articles') || '[]');
    if (articles.length === 0) {
      articles = [
        { id: 1, title: 'Lancement officiel de la Chronique au Canada', category: 'International', excerpt: 'Le média annonce son expansion au Canada avec l\'ouverture d\'un bureau à Alberta.', image: '', date: '2026-06-20', author: 'James Mukeshaba' },
        { id: 2, title: 'Campagne : Ensemble contre les violences faites aux femmes', category: 'Sensibilisation', excerpt: 'Une nouvelle campagne de sensibilisation est lancée à Bukavu.', image: '', date: '2026-06-18', author: 'Équipe Sensibilisation' },
        { id: 3, title: 'Projet d\'assainissement : Bukavu ville propre', category: 'Projets', excerpt: 'Découvrez notre nouveau projet communautaire.', image: '', date: '2026-06-15', author: 'Mukeshaba' }
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
    injectSkeletons(document.getElementById('home-sections'), 4);
    injectHeroSkeleton();
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