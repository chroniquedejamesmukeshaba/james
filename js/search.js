// ===== MOTEUR DE RECHERCHE INTELLIGENTE =====
(function () {
  var STR = {
    placeholder: 'Rechercher un article, une cat\u00e9gorie, un auteur\u2026',
    categories: 'Cat\u00e9gories',
    recent: 'Derniers articles',
    popular: 'Les plus lus',
    results: 'R\u00e9sultats',
    all: 'Voir tous les r\u00e9sultats',
    none: 'Aucun r\u00e9sultat pour cette recherche.',
    hint: 'Tapez au moins 2 caract\u00e8res\u2026',
    total: 'r\u00e9sultat(s)',
    page: 'Page',
    prev: 'Pr\u00e9c\u00e9dent',
    next: 'Suivant',
    loading: 'Recherche en cours\u2026',
    date_from: 'Du',
    date_to: 'au',
    author: 'Auteur',
    sort: 'Trier par',
    sort_relevance: 'Pertinence',
    sort_recent: 'Plus r\u00e9cents',
    sort_popular: 'Plus populaires',
    sort_commented: 'Plus comment\u00e9s',
    filter_category: 'Cat\u00e9gorie',
    all_cats: 'Toutes',
    clear: 'Effacer les filtres',
    popular_side: 'Les plus lus',
    other_cats: 'Autres cat\u00e9gories',
    principal: '\u00c0 la une de la cat\u00e9gorie',
    cat_articles: 'articles',
    empty: 'Aucun article pour le moment.',
    notfound: 'Cat\u00e9gorie introuvable.',
    noq: 'Entrez un mot-cl\u00e9 pour lancer la recherche.'
  };

  function L(k) {
    if (typeof t === 'function') {
      var v = t('sr_' + k);
      if (v !== 'sr_' + k) return v;
    }
    return STR[k] || k;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function hasImg(a) {
    return a && a.image && (a.image[0] === '/' || a.image.indexOf('http') === 0 || a.image.indexOf('data:') === 0);
  }
  function thumbOf(a) {
    var src = hasImg(a) ? a.image : '';
    return src
      ? '<img src="' + esc(src) + '" alt="' + esc(a.title) + '" loading="lazy" decoding="async">'
      : '<span class="noimg" aria-hidden="true">C</span>';
  }
  function fmtDate(d) {
    d = String(d || '').slice(0, 10);
    if (!d) return '';
    var p = d.split('-');
    return (p[2] || '') + '/' + (p[1] || '') + '/' + (p[0] || '');
  }
  function linkOf(a) { return '/article?id=' + esc(a.id); }
  function catLink(slug) { return '/categorie/' + esc(slug); }
  var S = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">';
  var ICONS = {
    clock: S + '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    eye: S + '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    arrow: S + '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>'
  };
  function readMinOf(a) {
    var m = parseInt(a.readMins || a.readMin || 0, 10);
    return m > 0 ? m : 2;
  }
  function statsOf(a) {
    var v = parseInt(a.views, 10);
    var html = '<span class="r-stat">' + ICONS.clock + ' ' + readMinOf(a) + ' min</span>';
    if (!isNaN(v) && v > 0) html += '<span class="r-stat">' + ICONS.eye + ' ' + v + '</span>';
    return html;
  }
  function metaOf(a) {
    var html = '';
    if (a.category) html += '<a class="r-cat" href="' + catLink(a.cat || '') + '">' + esc(a.category) + '</a>';
    if (a.date) html += '<span class="r-date">' + fmtDate(a.date) + '</span>';
    if (a.author) html += '<span class="r-author">' + esc(a.author) + '</span>';
    return html;
  }

  // ---------- CARTE RESULTAT ----------
  function card(a) {
    return '<article class="r-card">' +
      '<a class="r-thumb" href="' + linkOf(a) + '" tabindex="-1" aria-hidden="true">' + thumbOf(a) + '</a>' +
      '<div class="r-body">' +
      '<div class="r-meta">' + metaOf(a) + '</div>' +
      '<h3><a href="' + linkOf(a) + '">' + esc(a.title) + '</a></h3>' +
      (a.excerpt ? '<p class="r-excerpt">' + esc(a.excerpt) + '</p>' : '') +
      '<div class="r-foot">' + statsOf(a) + '<a class="r-link" href="' + linkOf(a) + '">' + L('results') + ' ' + ICONS.arrow + '</a>' +
      '</div></div></article>';
  }

  function miniRow(a) {
    return '<a class="sg-item" href="' + linkOf(a) + '">' +
      '<span class="sg-thumb">' + thumbOf(a) + '</span>' +
      '<span class="sg-txt"><b>' + esc(a.title) + '</b><i>' + esc(a.category || '') + ' &middot; ' + fmtDate(a.date) + '</i></span></a>';
  }

  function chips(list, active) {
    var html = '<button class="cat-chip' + (!active ? ' active' : '') + '" data-cat="">' + esc(L('all_cats')) + '</button>';
    (list || []).forEach(function (c) {
      html += '<button class="cat-chip' + (c.slug === active ? ' active' : '') + '" data-cat="' + esc(c.slug) + '">' +
        esc(c.name) + ' <span>' + c.count + '</span></button>';
    });
    return html;
  }

  function get(url) {
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
  }

  var langParam = function () {
    return (typeof localStorage !== 'undefined' ? localStorage.getItem('cms_lang') : null) || 'fr';
  };

  // ================= PANNEAU DE SUGGESTIONS INSTANTANEES =================
  // LivePanel.bind(input, panel, opts)
  var LivePanel = {
    bind: function (input, panel, opts) {
      if (!input || !panel) return;
      opts = opts || {};
      var timer = null, busy = false, items = [], cur = -1;

      function render(q, d) {
        if (!q) { panel.innerHTML = '<div class="sg-note">' + esc(L('hint')) + '</div>'; return; }
        if (!d || (!d.results.length && !d.categories.length && !d.recent.length && !d.popular.length)) {
          panel.innerHTML = '<div class="sg-note">' + esc(L('none')) + '</div>';
          return;
        }
        var html = '';
        if (d.categories && d.categories.length) {
          html += '<div class="sg-title">' + esc(L('categories')) + '</div>' +
            '<div class="sg-chips">' + d.categories.map(function (c) {
              return '<a class="cat-chip" href="' + catLink(c.slug) + '">' + esc(c.name) + ' <span>' + c.count + '</span></a>';
            }).join('') + '</div>';
        }
        if (d.recent && d.recent.length) {
          html += '<div class="sg-title">' + esc(L('recent')) + '</div>' +
            d.recent.slice(0, 3).map(miniRow).join('');
        }
        if (d.popular && d.popular.length) {
          html += '<div class="sg-title">' + esc(L('popular')) + '</div>' +
            d.popular.slice(0, 3).map(miniRow).join('');
        }
        if (d.results && d.results.length) {
          html += '<div class="sg-title">' + esc(L('results')) + ' <em>(' + d.total + ')</em></div>' +
            d.results.slice(0, 5).map(miniRow).join('');
        }
        html += '<a class="sg-footer" href="/recherche?q=' + encodeURIComponent(q) + '">' + esc(L('all')) + ' &#10148;</a>';
        panel.innerHTML = html;
        items = panel.querySelectorAll('.sg-item');
        cur = -1;
      }

      function run() {
        var q = input.value.trim();
        if (q.length < 2) { render(q, null); busy = false; return; }
        busy = true;
        get('/api/search?q=' + encodeURIComponent(q) + '&lang=' + langParam() + '&limit=6')
          .then(function (d) { if (input.value.trim() === q) render(q, d); })
          .catch(function () { if (input.value.trim() === q) render(q, null); })
          .then(function () { busy = false; });
      }

      input.addEventListener('input', function () {
        panel.style.display = 'block';
        clearTimeout(timer);
        timer = setTimeout(run, 250);
      });
      input.addEventListener('focus', function () {
        if (input.value.trim().length >= 2 || input.value.trim().length === 0) {
          panel.style.display = 'block';
          if (input.value.trim().length >= 2) run();
          else panel.innerHTML = '<div class="sg-note">' + esc(L('hint')) + '</div>';
        }
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); cur = Math.min(items.length - 1, cur + 1); mark(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); cur = Math.max(0, cur - 1); mark(); }
        else if (e.key === 'Enter') {
          e.preventDefault();
          if (cur >= 0 && items[cur]) { window.location.href = items[cur].getAttribute('href'); return; }
          if (opts.onEnter) { opts.onEnter(input.value.trim()); }
          else if (input.value.trim()) { window.location.href = '/recherche?q=' + encodeURIComponent(input.value.trim()); }
        } else if (e.key === 'Escape') {
          panel.style.display = 'none';
          if (opts.onEscape) opts.onEscape();
        }
      });
      function mark() {
        items.forEach(function (el, i) { el.classList.toggle('active', i === cur); });
        if (cur >= 0 && items[cur]) items[cur].scrollIntoView({ block: 'nearest' });
      }
      panel.addEventListener('click', function (e) {
        var link = e.target.closest('a,button');
        if (link && !link.closest('.sg-footer')) {
          panel.style.display = 'none';
          if (opts.onPick) opts.onPick(link);
        }
      });
      document.addEventListener('click', function (e) {
        if (!panel.contains(e.target) && e.target !== input) panel.style.display = 'none';
      });
      panel.style.display = 'none';
    }
  };

  // ================= PAGE RECHERCHE COMPLETE =================
  function parseParams() {
    var p = {};
    var s = (window.location.search || '').replace(/^\?/, '').split('&');
    s.forEach(function (kv) {
      if (!kv) return;
      var parts = kv.split('=');
      p[decodeURIComponent(parts[0])] = decodeURIComponent(parts.slice(1).join('='));
    });
    return p;
  }

  var PER_PAGE = 9;
  function SearchPage(els) {
    var data = null;
    var input = els.input, panel = els.panel, catsEl = els.cats, fromEl = els.from,
        toEl = els.to, authorEl = els.author, sortEl = els.sort,
        resultsEl = els.results, metaEl = els.meta, pagerEl = els.pager,
        defaultEl = els.default, clearBtn = els.clear, countEl = els.count;

    function currentFilters() {
      var chip = catsEl ? catsEl.querySelector('.cat-chip.active') : null;
      return {
        q: input.value.trim(),
        cat: chip && chip.dataset ? chip.dataset.cat || '' : '',
        from: fromEl ? fromEl.value : '',
        to: toEl ? toEl.value : '',
        author: authorEl ? authorEl.value.trim() : '',
        sort: sortEl ? sortEl.value : 'relevance'
      };
    }

    function filtered() {
      var f = currentFilters();
      var list = data ? data.results : [];
      if (f.cat) list = list.filter(function (a) { return (a.cat || '') === f.cat; });
      if (f.from) list = list.filter(function (a) { return String(a.date || '').slice(0, 10) >= f.from; });
      if (f.to) list = list.filter(function (a) { return String(a.date || '').slice(0, 10) <= f.to; });
      if (f.author) {
        var fa = f.author.toLowerCase().replace(/[^a-z0-9]/g, '');
        list = list.filter(function (a) {
          return String(a.author || '').toLowerCase().replace(/[^a-z0-9]/g, '').indexOf(fa) > -1;
        });
      }
      if (f.sort === 'recent') list = list.slice().sort(function (x, y) { return (y.id || 0) - (x.id || 0); });
      else if (f.sort === 'popular') list = list.slice().sort(function (x, y) { return (y.pop || 0) - (x.pop || 0); });
      else list = list.slice().sort(function (x, y) { return (y.score || 0) - (x.score || 0); });
      return list;
    }

    function pageCount(list) { return Math.max(1, Math.ceil(list.length / PER_PAGE)); }

    function renderList(list, page) {
      var start = (page - 1) * PER_PAGE;
      var slice = list.slice(start, start + PER_PAGE);
      resultsEl.innerHTML = slice.length
        ? slice.map(card).join('')
        : '<div class="sg-note">' + esc(L('none')) + '</div>';
      pagerEl.innerHTML = pagerHtml(page, pageCount(list));
      wirePager(page);
    }

    function pagerHtml(page, total) {
      if (total <= 1) return '';
      var html = '<button class="pg-btn' + (page <= 1 ? ' disabled' : '') + '" data-pg="' + (page - 1) + '">&#10094; ' + esc(L('prev')) + '</button>';
      for (var i = 1; i <= total; i++) {
        if (total > 7 && i > 2 && i < total - 1 && Math.abs(i - page) > 1) {
          if (html.indexOf('&hellip;') === -1) html += '<span class="pg-dots">&hellip;</span>';
          continue;
        }
        html += '<button class="pg-btn' + (i === page ? ' active' : '') + '" data-pg="' + i + '">' + i + '</button>';
      }
      html += '<button class="pg-btn' + (page >= total ? ' disabled' : '') + '" data-pg="' + (page + 1) + '">' + esc(L('next')) + ' &#10095;</button>';
      return html;
    }

    function wirePager(page) {
      pagerEl.querySelectorAll('.pg-btn').forEach(function (b) {
        b.addEventListener('click', function () {
          if (b.classList.contains('disabled')) return;
          renderList(filtered(), parseInt(b.dataset.pg, 10));
          window.scrollTo({ top: resultsEl.offsetTop - 80, behavior: 'smooth' });
        });
      });
    }

    function renderDefault(d) {
      if (!defaultEl) return;
      var html = '';
      if (d.recent && d.recent.length) {
        html += '<section class="sr-block"><div class="sr-block-title">' + esc(L('recent')) + '</div>' +
          '<div class="r-grid">' + d.recent.map(card).join('') + '</div></section>';
      }
      if (d.popular && d.popular.length) {
        html += '<section class="sr-block"><div class="sr-block-title">' + esc(L('popular')) + '</div>' +
          '<div class="r-grid">' + d.popular.map(card).join('') + '</div></section>';
      }
      if (d.all_categories && d.all_categories.length) {
        html += '<section class="sr-block"><div class="sr-block-title">' + esc(L('categories')) + '</div>' +
          '<div class="sg-chips">' + d.all_categories.map(function (c) {
            return '<a class="cat-chip" href="' + catLink(c.slug) + '">' + esc(c.name) + ' <span>' + c.count + '</span></a>';
          }).join('') + '</div></section>';
      }
      defaultEl.innerHTML = html;
    }

    function run() {
      var f = currentFilters();
      if (catsEl) catsEl.innerHTML = '<span class="f-label">' + esc(L('filter_category')) + '</span>' + chips(data ? data.all_categories : [], f.cat);
      var q = f.q;
      if (!q) {
        if (countEl) countEl.textContent = '';
        if (metaEl) metaEl.textContent = L('noq');
        renderDefault(data);
        return;
      }
      if (!data) return;
      var list = filtered();
      if (countEl) countEl.textContent = list.length + ' ' + L('total');
      metaEl.innerHTML = '<strong>' + esc(q) + '</strong>';
      defaultEl.innerHTML = '';
      renderList(list, 1);
    }

    function pushUrl() {
      var f = currentFilters();
      var qs = [];
      if (f.q) qs.push('q=' + encodeURIComponent(f.q));
      if (f.cat) qs.push('cat=' + encodeURIComponent(f.cat));
      if (f.from) qs.push('from=' + encodeURIComponent(f.from));
      if (f.to) qs.push('to=' + encodeURIComponent(f.to));
      if (f.author) qs.push('author=' + encodeURIComponent(f.author));
      if (f.sort !== 'relevance') qs.push('sort=' + f.sort);
      try { history.replaceState(null, '', '/recherche' + (qs.length ? '?' + qs.join('&') : '')); } catch (e) {}
    }

    function bindEvents() {
      var f = currentFilters();
      if (sortEl) sortEl.value = f.sort || 'relevance';
      if (fromEl) fromEl.value = f.from || '';
      if (toEl) toEl.value = f.to || '';
      if (authorEl) authorEl.value = f.author || '';
      LivePanel.bind(input, panel, { onEnter: function (q) { input.value = q; pushUrl(); run(); } });
      input.addEventListener('input', pushUrl);
      if (catsEl) catsEl.addEventListener('click', function (e) {
        var chip = e.target.closest('.cat-chip');
        if (!chip) return;
        catsEl.querySelectorAll('.cat-chip').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        pushUrl(); run();
      });
      [fromEl, toEl, authorEl, sortEl].forEach(function (el) {
        if (el) el.addEventListener('change', function () { pushUrl(); run(); });
      });
      if (clearBtn) clearBtn.addEventListener('click', function () {
        input.value = '';
        if (fromEl) fromEl.value = '';
        if (toEl) toEl.value = '';
        if (authorEl) authorEl.value = '';
        if (sortEl) sortEl.value = 'relevance';
        if (catsEl) catsEl.innerHTML = '';
        pushUrl(); run();
      });
    }

    get('/api/search?q=' + encodeURIComponent(els.initQ || '') + '&lang=' + langParam() + '&limit=200')
      .then(function (d) {
        data = d;
        bindEvents();
        run();
      })
      .catch(function () {
        if (metaEl) metaEl.textContent = L('none');
      });
  }

  // ================= PAGE CATEGORIE =================
  function CategoryPage(els) {
    var slug = (els.slug || '').replace(/[^a-z0-9\-]/g, '');
    var heroEl = els.hero, listEl = els.list, sideEl = els.side, pagerEl = els.pager,
        breadEl = els.bread, toolsEl = els.tools;
    var sort = 'recent';

    function sortList(articles) {
      var list = articles.slice();
      if (sort === 'popular') {
        list.sort(function (x, y) { return ((y.pop || 0) - (x.pop || 0)) || ((y.id || 0) - (x.id || 0)); });
      } else if (sort === 'commented') {
        list.sort(function (x, y) { return ((y.comments || 0) - (x.comments || 0)) || ((y.id || 0) - (x.id || 0)); });
      } else {
        list.sort(function (x, y) { return (y.id || 0) - (x.id || 0); });
      }
      return list;
    }

    function renderList(articles, page) {
      var list = sortList(articles);
      var total = Math.max(1, Math.ceil(list.length / PER_PAGE));
      var start = (page - 1) * PER_PAGE;
      var slice = list.slice(start, start + PER_PAGE);
      listEl.innerHTML = slice.map(function (a) { return card(a); }).join('');
      pagerEl.innerHTML = '';
      if (total > 1) {
        var html = '<button class="pg-btn' + (page <= 1 ? ' disabled' : '') + '" data-pg="' + (page - 1) + '">&#10094; ' + esc(L('prev')) + '</button>';
        for (var i = 1; i <= total; i++) {
          if (total > 7 && i > 2 && i < total - 1 && Math.abs(i - page) > 1) {
            if (html.indexOf('&hellip;') === -1) html += '<span class="pg-dots">&hellip;</span>';
            continue;
          }
          html += '<button class="pg-btn' + (i === page ? ' active' : '') + '" data-pg="' + i + '">' + i + '</button>';
        }
        html += '<button class="pg-btn' + (page >= total ? ' disabled' : '') + '" data-pg="' + (page + 1) + '">' + esc(L('next')) + ' &#10095;</button>';
        pagerEl.innerHTML = html;
        pagerEl.querySelectorAll('.pg-btn').forEach(function (b) {
          b.addEventListener('click', function () {
            if (b.classList.contains('disabled')) return;
            renderList(articles, parseInt(b.dataset.pg, 10));
            window.scrollTo({ top: (toolsEl || listEl).offsetTop - 80, behavior: 'smooth' });
          });
        });
      }
    }

    function render(d) {
      var p = d.principal;
      if (breadEl) breadEl.innerHTML = '<a href="index.html">Accueil</a> &#8250; <a href="actualites.html">Actualit\u00e9s</a> &#8250; <span>' + esc(d.name) + '</span>';
      heroEl.innerHTML =
        '<div class="cat-hero-top">' +
        '<h1>' + esc(d.name) + '</h1>' +
        '<p class="cat-desc">' + esc(d.description) + '</p>' +
        '<div class="cat-count">' + d.count + ' ' + esc(L('cat_articles')) + '</div>' +
        '</div>' +
        (p ? '<div class="cat-principal">' +
          '<a class="cp-thumb" href="' + linkOf(p) + '">' + thumbOf(p) + '</a>' +
          '<div class="cp-body">' +
          '<span class="cp-label">' + esc(L('principal')) + '</span>' +
          '<h2><a href="' + linkOf(p) + '">' + esc(p.title) + '</a></h2>' +
          (p.excerpt ? '<p>' + esc(p.excerpt) + '</p>' : '') +
          '<div class="r-meta">' + metaOf(p) + '</div>' +
          '<div class="r-foot">' + statsOf(p) + '</div>' +
          '</div></div>' : '');
      document.title = d.name + ' - Chronique de James Mukeshaba';
      renderList(d.articles, 1);
      var side = '';
      if (d.popular && d.popular.length) {
        side += '<div class="cat-side-title">' + esc(L('popular_side')) + '</div>' +
          d.popular.map(function (a) {
            return '<a class="side-item" href="' + linkOf(a) + '">' +
              '<span class="sg-thumb">' + thumbOf(a) + '</span>' +
              '<span class="sg-txt"><b>' + esc(a.title) + '</b><i>' + fmtDate(a.date) + '</i></span></a>';
          }).join('');
      }
      if (d.categories && d.categories.length > 1) {
        side += '<div class="cat-side-title">' + esc(L('other_cats')) + '</div>' +
          '<div class="sg-chips">' + d.categories.filter(function (c) { return c.slug !== slug; }).map(function (c) {
            return '<a class="cat-chip" href="' + catLink(c.slug) + '">' + esc(c.name) + ' <span>' + c.count + '</span></a>';
          }).join('') + '</div>';
      }
      sideEl.innerHTML = side || '';
      if (toolsEl) {
        var lbl = toolsEl.querySelector('.cat-tools-label');
        if (lbl) lbl.textContent = L('sort');
        toolsEl.querySelectorAll('.cat-sort-btn').forEach(function (b) {
          b.textContent = b.dataset.sort === 'popular' ? L('sort_popular') : (b.dataset.sort === 'commented' ? L('sort_commented') : L('sort_recent'));
          b.addEventListener('click', function () {
            sort = b.dataset.sort || 'recent';
            toolsEl.querySelectorAll('.cat-sort-btn').forEach(function (x) { x.classList.toggle('active', x === b); });
            renderList(d.articles, 1);
          });
        });
      }
    }

    get('/api/category/' + slug + '?lang=' + langParam())
      .then(function (d) { render(d); })
      .catch(function () {
        heroEl.innerHTML = '<div class="sg-note">' + esc(L('notfound')) + '</div>';
        if (toolsEl) toolsEl.style.display = 'none';
      });
  }

  window.LiveSearch = {
    bind: LivePanel.bind,
    page: SearchPage,
    category: CategoryPage,
    PER_PAGE: PER_PAGE
  };
})();
