// ===== THEME CLAIR / SOMBRE =====
(function () {
  var KEY = 'site_theme';
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t === 'dark' ? 'dark' : 'light');
  }
var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  applyTheme(saved);
  var SVG_MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" width="19" height="19"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  var SVG_SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" width="19" height="19"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
  function initToggle() {
    if (!document.body) { setTimeout(initToggle, 50); return; }
    var existing = document.getElementById('theme-toggle');
    if (existing) return;
    if (document.body.classList.contains('admin-body')) return;
    var btn = document.createElement('button');
    btn.id = 'theme-toggle';
    btn.className = 'theme-toggle';
    btn.title = 'Basculer entre le mode clair et le mode sombre';
    btn.setAttribute('aria-label', 'Basculer le thème');
    function icon() {
      btn.innerHTML = document.documentElement.getAttribute('data-theme') === 'dark' ? SVG_SUN : SVG_MOON;
    }
    icon();
    btn.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem(KEY, next); } catch (e) {}
      icon();
    });
    var actions = document.querySelector('.header-actions');
    if (actions) {
      btn.classList.add('in-header');
      var menuBtn = actions.querySelector('.menu-toggle');
      if (menuBtn) actions.insertBefore(btn, menuBtn);
      else actions.appendChild(btn);
    } else {
      document.body.appendChild(btn);
    }
  }
  initToggle();
})();

// ===== SERVICE WORKER / PWA =====
var deferredPrompt;
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  });
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    var btn = document.getElementById('pwa-install-btn');
  });
  window.addEventListener('appinstalled', function () {
    var btn = document.getElementById('pwa-install-btn');
    if (btn) btn.textContent = '✅ Installé';
  });
}
function getBrowser() {
  var ua = navigator.userAgent;
  if (ua.indexOf('Edg/') > -1) return 'edge';
  if (ua.indexOf('Chrome/') > -1) return 'chrome';
  if (ua.indexOf('Firefox/') > -1) return 'firefox';
  if (ua.indexOf('Safari/') > -1) return 'safari';
  return 'other';
}
function showInstallGuide() {
  var existing = document.getElementById('install-modal');
  if (existing) existing.remove();
  var browser = getBrowser();
  var steps = {
    chrome: [
      { icon: '🔍', text: 'Ouvrez le menu ⋮ en haut à droite' },
      { icon: '📲', text: 'Appuyez sur "Installer l\'application" ou "Ajouter à l\'écran d\'accueil"' },
      { icon: '✅', text: 'Confirmez l\'installation' }
    ],
    edge: [
      { icon: '🔍', text: 'Ouvrez le menu ⋯ en haut à droite' },
      { icon: '📲', text: 'Appuyez sur "Applications" → "Installer ce site en tant qu\'application"' },
      { icon: '✅', text: 'Confirmez l\'installation' }
    ],
    safari: [
      { icon: '🔍', text: 'Appuyez sur le bouton Partager 📤' },
      { icon: '📲', text: 'Faites défiler et appuyez sur "Ajouter à l\'écran d\'accueil"' },
      { icon: '✅', text: 'Appuyez sur "Ajouter" en haut à droite' }
    ],
    firefox: [
      { icon: '🔍', text: 'Ouvrez le menu ☰ en haut à droite' },
      { icon: '📲', text: 'Appuyez sur "Installer" ou "Ajouter à l\'écran d\'accueil"' },
      { icon: '✅', text: 'Confirmez l\'installation' }
    ],
    other: [
      { icon: '🔍', text: 'Ouvrez le menu du navigateur' },
      { icon: '📲', text: 'Cherchez "Installer l\'application" ou "Ajouter à l\'écran d\'accueil"' },
      { icon: '✅', text: 'Suivez les instructions à l\'écran' }
    ]
  };
  var s = steps[browser] || steps.other;
  var modal = document.createElement('div');
  modal.id = 'install-modal';
  modal.innerHTML =
    '<div style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9998;display:flex;align-items:center;justify-content:center;padding:20px;" onclick="if(event.target===this)document.getElementById(\'install-modal\').remove()">' +
    '<div style="background:#fff;border-radius:12px;padding:30px;max-width:400px;width:100%;box-shadow:0 10px 40px rgba(0,0,0,0.3);position:relative;">' +
    '<button onclick="document.getElementById(\'install-modal\').remove()" style="position:absolute;top:10px;right:15px;background:none;border:none;font-size:1.5rem;cursor:pointer;color:#999;">✕</button>' +
    '<h3 style="color:var(--primary);margin-bottom:15px;font-size:1.3rem;">📲 Installer l\'application</h3>' +
    '<p style="color:var(--text-light);font-size:0.9rem;margin-bottom:20px;">Suivez ces étapes pour installer la Chronique de James Mukeshaba sur votre appareil :</p>' +
    '<div style="display:flex;flex-direction:column;gap:15px;">' +
    s.map(function (step, i) {
      return '<div style="display:flex;align-items:center;gap:12px;background:#f8f9fa;border-radius:8px;padding:12px;">' +
        '<div style="width:32px;height:32px;background:var(--primary);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:0.85rem;flex-shrink:0;">' + (i + 1) + '</div>' +
        '<span style="font-size:0.95rem;">' + step.icon + ' ' + step.text + '</span></div>';
    }).join('') +
    '</div>' +
    '<p style="margin-top:20px;font-size:0.8rem;color:var(--text-light);text-align:center;">' +
    'Si vous utilisez un autre navigateur, cherchez "Installer" ou "Ajouter à l\'écran d\'accueil" dans le menu.</p></div></div>';
  document.body.appendChild(modal);
}
window.installPWA = function () {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function () { deferredPrompt = null; });
  } else {
    showInstallGuide();
  }
};

// ===== PAGES INIT =====
(function initPages() {
  if (localStorage.getItem('cms_pages_init')) return;
  var defaults = [
    { id: 1, slug: 'qui-sommes-nous', title: 'Qui sommes-nous', meta: 'Histoire, vision, équipe et présence internationale de la Chronique de James Mukeshaba.', content: '<h2 style="color:var(--primary);margin-bottom:20px;">Notre Histoire</h2><p style="margin-bottom:15px;font-size:1.05rem;">La Chronique de James Mukeshaba est née de la volonté de créer un espace d\'information indépendant, ancré dans les réalités du Sud-Kivu tout en rayonnant à l\'international. Fondée à Bukavu, notre plateforme s\'est rapidement imposée comme une référence pour l\'actualité locale, les projets communautaires et les campagnes de sensibilisation.</p><p style="margin-bottom:15px;font-size:1.05rem;">Aujourd\'hui, nous sommes présents dans plusieurs villes de la RDC (Goma, Kinshasa, Lubumbashi) et avons ouvert un bureau à Alberta, Canada, pour servir la diaspora congolaise.</p><h2 class="section-title" style="margin-top:50px;">Notre Présence</h2><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;"><div style="background:var(--white);padding:25px;border-radius:var(--radius);box-shadow:var(--shadow);text-align:center;"><div style="font-size:2rem;margin-bottom:10px;">📍</div><h3 style="color:var(--primary);">Bukavu</h3><p style="font-size:0.9rem;color:var(--text-light);">Siège social</p></div><div style="background:var(--white);padding:25px;border-radius:var(--radius);box-shadow:var(--shadow);text-align:center;"><div style="font-size:2rem;margin-bottom:10px;">📍</div><h3 style="color:var(--primary);">Goma</h3><p style="font-size:0.9rem;color:var(--text-light);">Bureau régional</p></div><div style="background:var(--white);padding:25px;border-radius:var(--radius);box-shadow:var(--shadow);text-align:center;"><div style="font-size:2rem;margin-bottom:10px;">📍</div><h3 style="color:var(--primary);">Kinshasa</h3><p style="font-size:0.9rem;color:var(--text-light);">Bureau régional</p></div><div style="background:var(--white);padding:25px;border-radius:var(--radius);box-shadow:var(--shadow);text-align:center;"><div style="font-size:2rem;margin-bottom:10px;">📍</div><h3 style="color:var(--primary);">Alberta, Canada</h3><p style="font-size:0.9rem;color:var(--text-light);">Bureau international</p></div></div>', date: '2026-06-25', image: '' },
    { id: 2, slug: 'projets', title: 'Nos Projets', meta: 'Découvrez les initiatives et projets communautaires portés par la Chronique de James Mukeshaba en RDC.', content: '<div class="cards-grid"><div class="card"><div class="card-img" style="background:linear-gradient(135deg,#27ae60,#2ecc71);color:white;font-size:3rem;">🌱</div><div class="card-body"><div class="card-category">Environnement</div><h2 class="card-title">Bukavu Ville Propre</h2><p class="card-text">Mobilisation citoyenne pour le nettoyage et l\'assainissement des quartiers périphériques de Bukavu.</p></div></div><div class="card"><div class="card-img" style="background:linear-gradient(135deg,#3498db,#2980b9);color:white;font-size:3rem;">📚</div><div class="card-body"><div class="card-category">Éducation</div><h2 class="card-title">Bibliothèque Mobile</h2><p class="card-text">Un projet de bibliothèque itinérante pour offrir l\'accès à la lecture aux enfants des zones rurales.</p></div></div><div class="card"><div class="card-img" style="background:linear-gradient(135deg,#8e44ad,#9b59b6);color:white;font-size:3rem;">💻</div><div class="card-body"><div class="card-category">Numérique</div><h2 class="card-title">Formation au Numérique</h2><p class="card-text">Ateliers de formation aux compétences numériques pour les jeunes de Bukavu et Goma.</p></div></div><div class="card"><div class="card-img" style="background:linear-gradient(135deg,#e67e22,#f39c12);color:white;font-size:3rem;">🤝</div><div class="card-body"><div class="card-category">Communauté</div><h2 class="card-title">Diaspora Connect</h2><p class="card-text">Programme de connexion entre la diaspora congolaise au Canada et les communautés locales en RDC.</p></div></div></div>', date: '2026-06-25', image: '' },
    { id: 3, slug: 'sensibilisation', title: 'Sensibilisation', meta: 'Campagnes d\'impact social et communautaire de la Chronique de James Mukeshaba.', content: '<div class="cards-grid"><div class="card"><div class="card-img" style="background:linear-gradient(135deg,#c0392b,#e74c3c);color:white;font-size:3rem;">✋</div><div class="card-body"><div class="card-category">Violences faites aux femmes</div><h2 class="card-title">Brisons le Silence</h2><p class="card-text">Campagne de sensibilisation contre les violences basées sur le genre à Bukavu.</p></div></div><div class="card"><div class="card-img" style="background:linear-gradient(135deg,#2980b9,#3498db);color:white;font-size:3rem;">💧</div><div class="card-body"><div class="card-category">Santé publique</div><h2 class="card-title">Eau Potable pour Tous</h2><p class="card-text">Campagne d\'information sur l\'eau potable dans les communautés rurales.</p></div></div><div class="card"><div class="card-img" style="background:linear-gradient(135deg,#27ae60,#2ecc71);color:white;font-size:3rem;">🌍</div><div class="card-body"><div class="card-category">Environnement</div><h2 class="card-title">Agir pour le Climat</h2><p class="card-text">Protection de l\'environnement contre la déforestation dans la région des Grands Lacs.</p></div></div><div class="card"><div class="card-img" style="background:linear-gradient(135deg,#8e44ad,#9b59b6);color:white;font-size:3rem;">🎓</div><div class="card-body"><div class="card-category">Éducation</div><h2 class="card-title">Tous à l\'École</h2><p class="card-text">Scolarisation des enfants dans les zones rurales du Sud-Kivu.</p></div></div></div>', date: '2026-06-25', image: '' },
    { id: 4, slug: 'heritage', title: 'Héritage', meta: 'Archives, culture et mémoires du Congo. Plongez au coeur du patrimoine congolais.', content: '<div class="cards-grid"><div class="card"><div class="card-img" style="background:linear-gradient(135deg,#8e44ad,#9b59b6);color:white;font-size:3rem;">💃</div><div class="card-body"><div class="card-category">Culture</div><h2 class="card-title">Les danses traditionnelles du Sud-Kivu</h2><p class="card-text">Plongée au coeur du patrimoine culturel du Sud-Kivu à travers les danses et rituels.</p></div></div><div class="card"><div class="card-img" style="background:linear-gradient(135deg,#c0392b,#e74c3c);color:white;font-size:3rem;">📜</div><div class="card-body"><div class="card-category">Histoire</div><h2 class="card-title">L\'histoire du Royaume du Bushi</h2><p class="card-text">À la découverte des traditions et de l\'histoire du Royaume du Bushi.</p></div></div><div class="card"><div class="card-img" style="background:linear-gradient(135deg,#2980b9,#3498db);color:white;font-size:3rem;">🎵</div><div class="card-body"><div class="card-category">Musique</div><h2 class="card-title">Anthologie de la musique congolaise</h2><p class="card-text">Voyage à travers les grands classiques de la musique congolaise.</p></div></div><div class="card"><div class="card-img" style="background:linear-gradient(135deg,#e67e22,#f39c12);color:white;font-size:3rem;">📖</div><div class="card-body"><div class="card-category">Littérature</div><h2 class="card-title">Les écrivains du Sud-Kivu</h2><p class="card-text">Portraits des figures littéraires du Sud-Kivu.</p></div></div></div>', date: '2026-06-25', image: '' }
  ];
  var existing = JSON.parse(localStorage.getItem('cms_pages') || '[]');
  var slugs = existing.map(function (p) { return p.slug; });
  defaults.forEach(function (d) {
    if (slugs.indexOf(d.slug) === -1) existing.push(d);
  });
  localStorage.setItem('cms_pages', JSON.stringify(existing));
  localStorage.setItem('cms_pages_init', '1');
})();

document.addEventListener('DOMContentLoaded', function () {

  // ===== MOBILE MENU (drawer animé) =====
  const menuToggle = document.querySelector('.menu-toggle');
  const mainNav = document.getElementById('main-nav');
  const navMenu = mainNav ? mainNav.querySelector('ul') : document.querySelector('nav ul');

  function buildMobileNav() {
    if (!navMenu || navMenu.querySelector('.mobile-nav-extra')) return;
    var li = document.createElement('li');
    li.className = 'mobile-nav-extra';
    li.innerHTML =
      '<div class="mne-box">' +
      '<label class="mne-search">' +
      '<span aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>' +
      '<input type="search" class="mne-input" placeholder="' + (typeof t === 'function' ? t('home_search_ph') : 'Rechercher un article...') + '" autocomplete="off" aria-label="Rechercher">' +
      '</label>' +
      '<div class="mne-cats" aria-label="Catégories"></div>' +
      '<a class="btn btn-primary btn-sm mne-support" href="soutenir.html"><span aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></span>' + (typeof t === 'function' ? t('home_support') : 'Soutenir nos actions') + '</a>' +
      '</div>';
    navMenu.appendChild(li);
    var inp = li.querySelector('.mne-input');
    if (inp) inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && inp.value.trim()) window.location.href = '/recherche?q=' + encodeURIComponent(inp.value.trim());
    });
    var catsEl = li.querySelector('.mne-cats');
    if (catsEl && window.location.protocol !== 'file:') {
      fetch('/api/categories?_=' + Date.now()).then(function (r) { return r.json(); }).then(function (list) {
        if (!list || !list.length) return;
        catsEl.innerHTML = list.slice(0, 10).map(function (c) {
          var nm = String(c.name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          return '<a class="category-chip" href="/categorie/' + encodeURIComponent(c.slug) + '">' + nm + '</a>';
        }).join('');
      }).catch(function () {});
    }
  }

  if (menuToggle && navMenu) {
    var closeBtn = document.createElement('button');
    closeBtn.id = 'nav-close';
    closeBtn.setAttribute('aria-label', 'Fermer le menu');
    closeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    var backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';

    function openMenu() {
      navMenu.classList.add('open');
      menuToggle.setAttribute('aria-expanded', 'true');
      backdrop.classList.add('show');
      document.body.style.overflow = 'hidden';
      buildMobileNav();
    }
    function closeMenu() {
      navMenu.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      backdrop.classList.remove('show');
      document.body.style.overflow = '';
    }
    menuToggle.addEventListener('click', function () {
      if (navMenu.classList.contains('open')) closeMenu();
      else openMenu();
    });
    navMenu.appendChild(closeBtn);
    closeBtn.addEventListener('click', closeMenu);
    if (backdrop) { document.body.appendChild(backdrop); backdrop.addEventListener('click', closeMenu); }
    navMenu.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (a && !e.target.closest('.mne-input')) setTimeout(closeMenu, 250);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && navMenu.classList.contains('open')) closeMenu(); });
  }

  // ===== HEADER : ombre au scroll =====
  (function () {
    var header = document.querySelector('.site-header');
    if (!header) return;
    function onScroll() { header.classList.toggle('is-scrolled', (window.pageYOffset || document.documentElement.scrollTop) > 8); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();

  // ===== SLIDER =====
  window.initSlider = function () {
    const slider = document.querySelector('.hero-slider');
    if (!slider) return;
    const slides = slider.querySelectorAll('.slide');
    const dots = slider.querySelectorAll('.slider-dot');
    const prevBtn = slider.querySelector('.slider-btn.prev');
    const nextBtn = slider.querySelector('.slider-btn.next');
    if (slides.length === 0) return;
    if (slider._interval) clearInterval(slider._interval);
    let current = 0;

    function goTo(index) {
      slides.forEach(s => s.classList.remove('active'));
      dots.forEach(d => d.classList.remove('active'));
      current = (index + slides.length) % slides.length;
      slides[current].classList.add('active');
      dots[current].classList.add('active');
    }

    function nextSlide() { goTo(current + 1); }
    function prevSlide() { goTo(current - 1); }

    if (prevBtn) prevBtn.onclick = prevSlide;
    if (nextBtn) nextBtn.onclick = nextSlide;
    dots.forEach((dot, i) => dot.onclick = () => goTo(i));

    slider._interval = setInterval(nextSlide, 5000);
    slider.onmouseenter = () => clearInterval(slider._interval);
    slider.onmouseleave = () => { slider._interval = setInterval(nextSlide, 5000); };
  };
  initSlider();

  // ===== FAQ ACCORDION =====
  document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', function () {
      this.classList.toggle('active');
      const answer = this.nextElementSibling;
      answer.classList.toggle('open');
    });
  });

  // ===== DONATION AMOUNT SELECTOR =====
  document.querySelectorAll('.donation-amount').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.donation-amount').forEach(b => b.classList.remove('selected'));
      this.classList.add('selected');
    });
  });

  // ===== NEWSLETTER FORM =====
  const nlForm = document.getElementById('newsletter-form');
  if (nlForm) {
    nlForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const emailEl = this.querySelector('input[type="email"]');
      const email = emailEl ? emailEl.value.trim() : '';
      if (!email) { showToast('Veuillez renseigner votre adresse email.', 'error'); return; }
      const nameEl = this.querySelector('input[name="nl-name"]');
      const cats = [];
      this.querySelectorAll('input[name="nl-cat"]:checked').forEach(function (c) { cats.push(c.value); });
      const payload = { email: email, name: nameEl ? nameEl.value.trim() : '', categories: cats };
      if (window.location.protocol !== 'file:') {
        fetch('/api/newsletter', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).catch(function(){});
      }
      let subs = JSON.parse(localStorage.getItem('nl_subscribers') || '[]');
      if (!subs.includes(email)) {
        subs.push(email);
        localStorage.setItem('nl_subscribers', JSON.stringify(subs));
      }
      showToast('Merci ! Vous êtes abonné à notre newsletter.');
      this.reset();
    });
    // Catégories préférées remplies depuis l'API
    const nlCats = nlForm.querySelector('.nl-cats');
    if (nlCats) {
      function fillCats() {
        fetch('/api/categories').then(function (r) { return r.json(); }).then(function (list) {
          if (!list || !list.length) { nlCats.style.display = 'none'; return; }
          nlCats.innerHTML = list.slice(0, 6).map(function (c) {
            var esc = String(c.name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            return '<label class="nl-cat-label"><input type="checkbox" name="nl-cat" value="' + esc + '"> ' + esc + '</label>';
          }).join('');
          nlCats.style.display = '';
        }).catch(function () { nlCats.style.display = 'none'; });
      }
      fillCats();
      document.addEventListener('langchange', function () { setTimeout(fillCats, 300); });
    }
  }

  // ===== COMMENT FORM =====
  const commentForm = document.getElementById('comment-form');
  if (commentForm) {
    commentForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const name = document.getElementById('comment-name').value.trim();
      const text = document.getElementById('comment-text').value.trim();
      if (!name || !text) { showToast('Veuillez remplir tous les champs.', 'error'); return; }
      const articleId = this.dataset.articleId || '1';
      const data = { name: name, text: text, date: new Date().toLocaleDateString('fr-FR') };
      if (window.location.protocol !== 'file:') {
        fetch('/api/comments/' + articleId, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).catch(function(){});
      }
      const comments = JSON.parse(localStorage.getItem('comments_' + articleId) || '[]');
      data.id = Date.now(); data.pending = true;
      comments.push(data);
      localStorage.setItem('comments_' + articleId, JSON.stringify(comments));
      showToast('Commentaire soumis et en attente de modération.');
      this.reset();
    });
  }
});

// ===== COMMENTS LOADER (global) =====
window.loadComments = function() {
  const container = document.getElementById('comments-list');
  if (!container) return;
  const articleId = container.dataset.articleId || '1';
  if (window.location.protocol !== 'file:') {
    fetch('/api/comments/' + articleId).then(function(r){return r.json()}).then(function(apiComments){
      if (apiComments) {
        var approved = apiComments.filter(function(c){return !c.pending});
        window._renderComments(approved);
        return;
      }
      window._loadLocalComments(articleId);
    }).catch(function(){window._loadLocalComments(articleId);});
  } else { window._loadLocalComments(articleId); }
};

window._loadLocalComments = function(articleId) {
  const container = document.getElementById('comments-list');
  if (!container) return;
  const comments = JSON.parse(localStorage.getItem('comments_' + articleId) || '[]');
  const approved = comments.filter(c => !c.pending);
  window._renderComments(approved);
};

window._esc = function(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
};

window._renderComments = function(list) {
  const container = document.getElementById('comments-list');
  if (!container) return;
  if (!list || list.length === 0) {
    container.innerHTML = '<p class="text-muted">'+(typeof t==='function'?t('no_comments'):'Aucun commentaire pour le moment. Soyez le premier à commenter !')+'</p>';
    return;
  }
  container.innerHTML = list.map(c =>
    '<div class="comment"><div><span class="comment-author">' + window._esc(c.name) + '</span><span class="comment-date">' + window._esc(c.date) + '</span></div>' +
    '<div class="comment-text">' + window._esc(c.text) + '</div>' +
    '<div><button class="comment-report" data-cid="' + window._esc(c.id) + '" aria-label="Signaler ce commentaire">🚩 Signaler</button></div></div>'
  ).join('');
  container.querySelectorAll('.comment-report').forEach(function(btn){
    btn.onclick = function(){
      if (typeof window.flagComment === 'function') window.flagComment(parseInt(this.dataset.cid), this);
    };
  });
};

window.flagComment = function (cid, btn) {
  if (!confirm('Signaler ce commentaire à la modération ?')) return;
  const aid = document.getElementById('comments-list') ? document.getElementById('comments-list').dataset.articleId : null;
  if (window.location.protocol !== 'file:' && aid) {
    fetch('/api/comments/' + aid + '/' + cid + '/flag', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({reason:'signale par un lecteur'})})
      .then(function(r){ if(r.ok) done(); }).catch(function(){ done(); });
  } else { done(); }
  function done(){ if (btn) btn.textContent = '🚩 Signalé'; showToast('Merci, votre signalement a été transmis à la modération.'); }
};

// ===== AUTO-CLEAN EVERY 3 MIN =====
if (!document.querySelector('.admin-body')) {
  setInterval(function(){
    var keep = ['admin_logged','admin_name','admin_token','admin_articles','cms_pages','cms_campaigns','cms_lang','nl_subscribers','visit_stats','donations'];
    Object.keys(localStorage).forEach(function(k){
      var keepKey = keep.indexOf(k) !== -1 || k.indexOf('comments_') === 0;
      if (!keepKey) localStorage.removeItem(k);
    });
    document.cookie.split(';').forEach(function(c){
      document.cookie = c.replace(/^ +/,'').replace(/=.*/,'=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/');
    });
  }, 180000);
}

// ===== BREAKING NEWS BAR =====
(function () {
  if (document.body.classList.contains('admin-body')) return;
  function attach(s) {
    if (!s || !s.breaking_news_enabled || !s.breaking_article_id) return;
    if (document.querySelector('.breaking-bar')) return;
    var bar = document.createElement('div');
    bar.className = 'breaking-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Derni\u00e8re heure');
    bar.innerHTML =
      '<span class="bb-dot" aria-hidden="true"></span>' +
      '<span class="bb-label">' + (typeof t === 'function' ? t('home_breaking') : 'Derni\u00e8re heure') + '</span>' +
      '<a class="bb-title" href="/article?id=' + s.breaking_article_id + '">' + (s.breaking_title || '') + '</a>' +
      '<a class="bb-link" href="/article?id=' + s.breaking_article_id + '">' + (typeof t === 'function' ? t('read_article') : 'Lire') + ' \u2192</a>';
    document.body.insertBefore(bar, document.body.firstChild);
  }
  function load() {
    if (window.location.protocol === 'file:') return;
    fetch('/api/settings?_=' + Date.now()).then(function (r) { return r.json(); }).then(attach).catch(function () {});
  }
  document.addEventListener('DOMContentLoaded', load);
})();

// ===== TOAST =====
window.showToast = function (message, type) {
  const existing = document.querySelector('.toast-msg');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast-msg' + (type === 'error' ? ' err' : '');
  toast.textContent = message;
  toast.setAttribute('role', 'status');
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 3500);
};

// ===== UI : icônes SVG cohérentes + date du jour (header) =====
(function () {
  if (document.body.classList.contains('admin-body')) return;

  var S = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">';

  var ICONS = {
    search: S + '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    menu: S + '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
    heart: S + '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    zap: S + '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    chevL: S + '<polyline points="15 18 9 12 15 6"/></svg>',
    chevR: S + '<polyline points="9 18 15 12 9 6"/></svg>',
    calendar: S + '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
  };

  function init() {
    var s = document.getElementById('search-open');
    if (s && s.textContent.replace(/\s/g, '') === '🔍') s.innerHTML = ICONS.search;
    var m = document.querySelector('.menu-toggle');
    if (m && m.textContent.replace(/\s/g, '') === '☰') m.innerHTML = ICONS.menu;
    document.querySelectorAll('.btn-support span[aria-hidden="true"]').forEach(function (sp) { sp.innerHTML = ICONS.heart; });
    document.querySelectorAll('.breaking-label span[aria-hidden="true"]').forEach(function (sp) { if (sp.textContent === '⚡') sp.innerHTML = ICONS.zap; });
    document.querySelectorAll('.ticker-prev').forEach(function (b) { b.innerHTML = ICONS.chevL; });
    document.querySelectorAll('.ticker-next').forEach(function (b) { b.innerHTML = ICONS.chevR; });
    document.querySelectorAll('.search-overlay .qrow > span[aria-hidden="true"]').forEach(function (sp) { sp.innerHTML = ICONS.search; });
    document.querySelectorAll('.sr-searchbox > span[aria-hidden="true"]').forEach(function (sp) { if (sp.textContent.indexOf('🔍') !== -1) sp.innerHTML = ICONS.search; });
    var ICON_X = S + '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    document.querySelectorAll('.search-panel #search-close').forEach(function (b) { if (b.textContent.indexOf('✕') !== -1) b.innerHTML = ICON_X; });
    document.querySelectorAll('.top-bar .container').forEach(function (c) {
      if (c.querySelector('.tb-date')) return;
      var d = document.createElement('span');
      d.className = 'tb-date';
      var txtSpan = document.createElement('span');
      var now = new Date();
      var txt = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      txtSpan.textContent = txt.charAt(0).toUpperCase() + txt.slice(1);
      d.appendChild(txtSpan);
      var social = c.querySelector('.social-links');
      if (social) { c.insertBefore(d, social); if (social.style.margin) social.style.margin = '0 0 0 auto'; }
      else c.insertBefore(d, c.firstChild);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

// ===== SIDEBAR INTELLIGENTE (widgets À la une / populaires / catégories / newsletter) =====
(function () {
  if (document.body.classList.contains('admin-body')) return;
  var S = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">';
  var IC = {
    clock: S + '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    eye: S + '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    newspaper: S + '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0V7"/><line x1="10" y1="7" x2="18" y2="7"/><line x1="10" y1="11" x2="18" y2="11"/><line x1="10" y1="15" x2="14" y2="15"/></svg>'
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function langP() {
    return (typeof localStorage !== 'undefined' ? localStorage.getItem('cms_lang') : null) || 'fr';
  }
  function hasImg(a) { return a && a.image && (a.image[0] === '/' || a.image.indexOf('http') === 0 || a.image.indexOf('data:') === 0); }
  function compactRow(a) {
    var img = hasImg(a) ? '<img src="' + esc(a.image) + '" alt="' + esc(a.title) + '" loading="lazy" decoding="async">' : '';
    return '<a class="compact-card" href="/article?id=' + esc(a.id) + '">' +
      (img || '<span class="no-thumb" style="width:96px;height:68px;border-radius:8px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;background:linear-gradient(140deg,var(--primary),var(--primary-hover));color:rgba(255,255,255,0.85);">' + IC.newspaper + '</span>') +
      '<span class="cc-body"><span class="cc-cat">' + esc(a.category || '') + '</span>' +
      '<span class="cc-title">' + esc(a.title) + '</span>' +
      '<span class="cc-meta">' + (a.date ? '<span>' + esc(String(a.date).slice(0, 10)) + '</span>' : '') +
      (a.readMins ? '<span>' + IC.clock + ' ' + a.readMins + ' min</span>' : '') +
      (a.views > 0 ? '<span>' + IC.eye + ' ' + esc(a.views) + '</span>' : '') +
      '</span></span></a>';
  }
  function widgetCats(el) {
    fetch('/api/categories?_=' + Date.now()).then(function (r) { return r.json(); }).then(function (list) {
      if (!list || !list.length) return;
      el.innerHTML = list.slice(0, 10).map(function (c) {
        return '<a class="category-chip" href="/categorie/' + encodeURIComponent(c.slug) + '">' + esc(c.name) + '</a>';
      }).join('');
    }).catch(function () {});
  }
  function widgetNewsletter(el) {
    var form = el.querySelector('form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = form.querySelector('input[type="email"]').value.trim();
      if (!email) { window.showToast('Veuillez renseigner votre adresse email.', 'error'); return; }
      if (window.location.protocol !== 'file:') {
        fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email }) }).catch(function () {});
      }
      var subs = JSON.parse(localStorage.getItem('nl_subscribers') || '[]');
      if (subs.indexOf(email) === -1) subs.push(email);
      localStorage.setItem('nl_subscribers', JSON.stringify(subs));
      window.showToast('Merci ! Vous êtes abonné à notre newsletter.');
      form.reset();
    });
  }
  function init() {
    var alaune = document.querySelector('[data-widget="alaune"] .widget-list');
    var popular = document.querySelector('[data-widget="popular"] .widget-list');
    var cats = document.querySelector('[data-widget="categories"] .widget-cats');
    var nl = document.querySelector('[data-widget="newsletter"]');
    if (alaune && window.location.protocol !== 'file:') {
      fetch('/api/articles/lite?lang=' + langP() + '&_=' + Date.now()).then(function (r) { return r.json(); }).then(function (d) {
        if (d && d.length) alaune.innerHTML = d.slice(0, 5).map(compactRow).join('');
      }).catch(function () {});
    }
    if (popular && window.location.protocol !== 'file:') {
      fetch('/api/popular?period=all&limit=5&lang=' + langP() + '&_=' + Date.now()).then(function (r) { return r.json(); }).then(function (d) {
        if (d && d.items && d.items.length) popular.innerHTML = d.items.slice(0, 5).map(compactRow).join('');
      }).catch(function () {});
    }
    if (cats) widgetCats(cats);
    if (nl) widgetNewsletter(nl);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

// ===== UI KIT (composants reutilisables : Modal, Spinner, Confirm) =====
(function () {
  var overlay = null;
  function ensureOverlay() {
    if (overlay && overlay.parentNode) return overlay;
    overlay = document.createElement('div');
    overlay.className = 'ui-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.style.display = 'none';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });
    return overlay;
  }
  function close() {
    if (!overlay) return;
    overlay.style.display = 'none';
    overlay.innerHTML = '';
    document.body.classList.remove('ui-no-scroll');
    var f = overlay._lastFocus;
    if (f && document.body.contains(f)) f.focus();
    overlay._lastFocus = null;
  }
  function open(html) {
    ensureOverlay();
    overlay._lastFocus = document.activeElement;
    overlay.innerHTML = html;
    overlay.style.display = 'flex';
    document.body.classList.add('ui-no-scroll');
    var closeBtn = overlay.querySelector('.ui-close');
    var primary = overlay.querySelector('.ui-primary');
    if (closeBtn) closeBtn.focus();
    else if (primary) primary.focus();
    function onKey(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); }
      if (e.key === 'Tab') {
        var focusables = overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!focusables.length) return;
        var first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', onKey);
  }
  window.UI = window.UI || {};
  window.UI.closeModal = close;
  window.UI.confirm = function (message, onConfirm, opts) {
    opts = opts || {};
    var title = opts.title || 'Confirmation';
    var okLabel = opts.okLabel || 'Confirmer';
    var cancelLabel = opts.cancelLabel || 'Annuler';
    open('<div class="ui-modal">' +
      '<button type="button" class="ui-close" aria-label="Fermer">&times;</button>' +
      '<h3 class="ui-title">' + escHtml(title) + '</h3>' +
      '<p class="ui-message">' + escHtml(message) + '</p>' +
      '<div class="ui-actions">' +
      '<button type="button" class="btn btn-ghost ui-cancel">' + escHtml(cancelLabel) + '</button>' +
      '<button type="button" class="btn btn-accent ui-primary">' + escHtml(okLabel) + '</button>' +
      '</div></div>');
    overlay.querySelector('.ui-close').onclick = close;
    overlay.querySelector('.ui-cancel').onclick = close;
    overlay.querySelector('.ui-primary').onclick = function () { close(); if (onConfirm) onConfirm(); };
  };
  window.UI.spinner = function (show, opts) {
    opts = opts || {};
    if (show) {
      var msg = opts.message || '';
      open('<div class="ui-modal ui-spinner-modal">' +
        '<span class="ui-spinner" aria-hidden="true"></span>' +
        (msg ? '<p class="ui-message">' + escHtml(msg) + '</p>' : '') +
        '</div>');
      var cb = overlay.querySelector('.ui-close');
      if (cb) cb.style.display = 'none';
    } else {
      close();
    }
  };
  function escHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
})();

// ===== CONTACT : POPUP APPEL / WHATSAPP SUR LES NUMEROS DE TELEPHONE =====
(function () {
  var overlay = null;
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  function digitsOf(telHref) {
    return String(telHref || '').replace(/^tel:/, '').replace(/[^\d]/g, '');
  }
  function close() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    document.body.classList.remove('ui-no-scroll');
  }
  function openModal(telHref, label) {
    close();
    overlay = document.createElement('div');
    overlay.className = 'ui-overlay contact-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    var digits = digitsOf(telHref);
    var waHref = 'https://wa.me/' + digits;
    var icoPhone = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
    var icoWa = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
    overlay.innerHTML =
      '<div class="ui-modal contact-modal">' +
      '<button type="button" class="ui-close" aria-label="' + esc(t('contact_close')) + '" title="' + esc(t('contact_close')) + '">&times;</button>' +
      '<h3 class="ui-title">' + esc(t('contact_title')) + '</h3>' +
      '<p class="ui-message">' + esc(t('contact_desc')) + '</p>' +
      '<p class="contact-number">' + esc(label || telHref) + '</p>' +
      '<div class="contact-options">' +
      '<a class="contact-opt contact-call" href="' + esc(telHref) + '"><span class="co-ico">' + icoPhone + '</span><span>' + esc(t('contact_call')) + '</span></a>' +
      '<a class="contact-opt contact-wa" href="' + esc(waHref) + '" target="_blank" rel="noopener noreferrer"><span class="co-ico">' + icoWa + '</span><span>' + esc(t('contact_whatsapp')) + '</span></a>' +
      '</div></div>';
    document.body.appendChild(overlay);
    document.body.classList.add('ui-no-scroll');
    var closeBtn = overlay.querySelector('.ui-close');
    if (closeBtn) closeBtn.focus();
    function onKey(e) {
      if (e.key === 'Escape') { document.removeEventListener('keydown', onKey); close(); }
      if (e.key === 'Tab') {
        var f = overlay.querySelectorAll('button, [href]');
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', onKey);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) { document.removeEventListener('keydown', onKey); close(); }
    });
    if (closeBtn) closeBtn.addEventListener('click', function () { document.removeEventListener('keydown', onKey); close(); });
    overlay.querySelectorAll('.contact-opt').forEach(function (opt) {
      opt.addEventListener('click', function (e) {
        var isWa = opt.classList.contains('contact-wa');
        var url = opt.href;
        document.removeEventListener('keydown', onKey);
        close();
        if (isWa) { window.open(url, '_blank', 'noopener'); }
        else { setTimeout(function () { window.location.href = url; }, 80); }
      });
    });
  }
  function init() {
    if (!document.body) { setTimeout(init, 60); return; }
    if (document.body.classList.contains('admin-body')) return;
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href^="tel:"]') : null;
      if (!a) return;
      if (a.closest('.contact-overlay')) return;
      e.preventDefault();
      var label = a.textContent.trim();
      if (!/\d/.test(label)) label = a.getAttribute('href');
      openModal(a.getAttribute('href'), label);
    });
  }
  init();
})();

// ===== EDITORIAL 2026 : révélation douce des cartes au scroll =====
(function () {
  if (document.body.classList.contains('admin-body')) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;
  var SEL = '.hero-feature, .sub-item, .home-card, .cat-card, .r-card, .pop-card, .compact-card, .widget, .campaign-slide, .pager-card, .about-point';
  function bind(el) {
    if (!el || el.classList.contains('reveal')) return;
    el.classList.add('reveal');
    io.observe(el);
  }
  var els = document.querySelectorAll(SEL);
  if (!els.length) { els = []; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -40px 0px', threshold: 0.08 });
  els.forEach(bind);
  if (window.MutationObserver && document.getElementById('main-content')) {
    var mo = new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        m.addedNodes.forEach(function (n) {
          if (n.nodeType !== 1) return;
          if (n.matches && n.matches(SEL)) bind(n);
          if (n.querySelectorAll) n.querySelectorAll(SEL).forEach(bind);
        });
      });
    });
    mo.observe(document.getElementById('main-content'), { childList: true, subtree: true });
  }
})();
