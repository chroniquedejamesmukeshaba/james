// ===== SERVICE WORKER / PWA =====
var deferredPrompt;
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function () {});
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
    { id: 2, slug: 'projets', title: 'Nos Projets', meta: 'Découvrez les initiatives et projets communautaires portés par la Chronique de James Mukeshaba en RDC.', content: '<div class="cards-grid"><div class="card"><div class="card-img" style="background:linear-gradient(135deg,#27ae60,#2ecc71);color:white;font-size:3rem;">🌱</div><div class="card-body"><div class="card-category">Environnement</div><h3 class="card-title">Bukavu Ville Propre</h3><p class="card-text">Mobilisation citoyenne pour le nettoyage et l\'assainissement des quartiers périphériques de Bukavu.</p></div></div><div class="card"><div class="card-img" style="background:linear-gradient(135deg,#3498db,#2980b9);color:white;font-size:3rem;">📚</div><div class="card-body"><div class="card-category">Éducation</div><h3 class="card-title">Bibliothèque Mobile</h3><p class="card-text">Un projet de bibliothèque itinérante pour offrir l\'accès à la lecture aux enfants des zones rurales.</p></div></div><div class="card"><div class="card-img" style="background:linear-gradient(135deg,#8e44ad,#9b59b6);color:white;font-size:3rem;">💻</div><div class="card-body"><div class="card-category">Numérique</div><h3 class="card-title">Formation au Numérique</h3><p class="card-text">Ateliers de formation aux compétences numériques pour les jeunes de Bukavu et Goma.</p></div></div><div class="card"><div class="card-img" style="background:linear-gradient(135deg,#e67e22,#f39c12);color:white;font-size:3rem;">🤝</div><div class="card-body"><div class="card-category">Communauté</div><h3 class="card-title">Diaspora Connect</h3><p class="card-text">Programme de connexion entre la diaspora congolaise au Canada et les communautés locales en RDC.</p></div></div></div>', date: '2026-06-25', image: '' },
    { id: 3, slug: 'sensibilisation', title: 'Sensibilisation', meta: 'Campagnes d\'impact social et communautaire de la Chronique de James Mukeshaba.', content: '<div class="cards-grid"><div class="card"><div class="card-img" style="background:linear-gradient(135deg,#c0392b,#e74c3c);color:white;font-size:3rem;">✋</div><div class="card-body"><div class="card-category">Violences faites aux femmes</div><h3 class="card-title">Brisons le Silence</h3><p class="card-text">Campagne de sensibilisation contre les violences basées sur le genre à Bukavu.</p></div></div><div class="card"><div class="card-img" style="background:linear-gradient(135deg,#2980b9,#3498db);color:white;font-size:3rem;">💧</div><div class="card-body"><div class="card-category">Santé publique</div><h3 class="card-title">Eau Potable pour Tous</h3><p class="card-text">Campagne d\'information sur l\'eau potable dans les communautés rurales.</p></div></div><div class="card"><div class="card-img" style="background:linear-gradient(135deg,#27ae60,#2ecc71);color:white;font-size:3rem;">🌍</div><div class="card-body"><div class="card-category">Environnement</div><h3 class="card-title">Agir pour le Climat</h3><p class="card-text">Protection de l\'environnement contre la déforestation dans la région des Grands Lacs.</p></div></div><div class="card"><div class="card-img" style="background:linear-gradient(135deg,#8e44ad,#9b59b6);color:white;font-size:3rem;">🎓</div><div class="card-body"><div class="card-category">Éducation</div><h3 class="card-title">Tous à l\'École</h3><p class="card-text">Scolarisation des enfants dans les zones rurales du Sud-Kivu.</p></div></div></div>', date: '2026-06-25', image: '' },
    { id: 4, slug: 'heritage', title: 'Héritage', meta: 'Archives, culture et mémoires du Congo. Plongez au coeur du patrimoine congolais.', content: '<div class="cards-grid"><div class="card"><div class="card-img" style="background:linear-gradient(135deg,#8e44ad,#9b59b6);color:white;font-size:3rem;">💃</div><div class="card-body"><div class="card-category">Culture</div><h3 class="card-title">Les danses traditionnelles du Sud-Kivu</h3><p class="card-text">Plongée au coeur du patrimoine culturel du Sud-Kivu à travers les danses et rituels.</p></div></div><div class="card"><div class="card-img" style="background:linear-gradient(135deg,#c0392b,#e74c3c);color:white;font-size:3rem;">📜</div><div class="card-body"><div class="card-category">Histoire</div><h3 class="card-title">L\'histoire du Royaume du Bushi</h3><p class="card-text">À la découverte des traditions et de l\'histoire du Royaume du Bushi.</p></div></div><div class="card"><div class="card-img" style="background:linear-gradient(135deg,#2980b9,#3498db);color:white;font-size:3rem;">🎵</div><div class="card-body"><div class="card-category">Musique</div><h3 class="card-title">Anthologie de la musique congolaise</h3><p class="card-text">Voyage à travers les grands classiques de la musique congolaise.</p></div></div><div class="card"><div class="card-img" style="background:linear-gradient(135deg,#e67e22,#f39c12);color:white;font-size:3rem;">📖</div><div class="card-body"><div class="card-category">Littérature</div><h3 class="card-title">Les écrivains du Sud-Kivu</h3><p class="card-text">Portraits des figures littéraires du Sud-Kivu.</p></div></div></div>', date: '2026-06-25', image: '' }
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

  // ===== MOBILE MENU =====
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('nav ul');
  if (menuToggle) {
    menuToggle.addEventListener('click', function () {
      navMenu.classList.toggle('open');
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('header')) navMenu.classList.remove('open');
    });
  }

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
      const email = this.querySelector('input[type="email"]').value;
      if (email) {
        if (window.location.protocol !== 'file:') {
          fetch('/api/newsletter', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email})}).catch(function(){});
        }
        let subs = JSON.parse(localStorage.getItem('nl_subscribers') || '[]');
        if (!subs.includes(email)) {
          subs.push(email);
          localStorage.setItem('nl_subscribers', JSON.stringify(subs));
        }
        showToast('Merci ! Vous êtes abonné à notre newsletter.');
        this.querySelector('input[type="email"]').value = '';
      }
    });
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

window._renderComments = function(list) {
  const container = document.getElementById('comments-list');
  if (!container) return;
  if (!list || list.length === 0) {
    container.innerHTML = '<p class="text-muted">Aucun commentaire pour le moment. Soyez le premier à commenter !</p>';
    return;
  }
  container.innerHTML = list.map(c =>
    '<div class="comment"><div><span class="comment-author">' + c.name + '</span><span class="comment-date">' + c.date + '</span></div><div class="comment-text">' + c.text + '</div></div>'
  ).join('');
};

// ===== AUTO-CLEAN EVERY 3 MIN =====
if (!document.querySelector('.admin-body')) {
  setInterval(function(){
    var keep = ['admin_logged','admin_name','admin_articles','cms_pages','cms_campaigns'];
    Object.keys(localStorage).forEach(function(k){
      if (keep.indexOf(k) === -1) localStorage.removeItem(k);
    });
    document.cookie.split(';').forEach(function(c){
      document.cookie = c.replace(/^ +/,'').replace(/=.*/,'=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/');
    });
  }, 180000);
}

// ===== TOAST =====
window.showToast = function (message, type) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  if (type === 'error') toast.style.background = 'var(--secondary)';
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed', bottom: '20px', right: '20px', zIndex: '9999',
    background: '#27ae60', color: '#fff', padding: '14px 24px',
    borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
    fontSize: '0.95rem', maxWidth: '360px',
    transform: 'translateY(100px)', opacity: '0',
    transition: 'all 0.4s ease'
  });
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  });
  setTimeout(() => {
    toast.style.transform = 'translateY(100px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 3500);
};
