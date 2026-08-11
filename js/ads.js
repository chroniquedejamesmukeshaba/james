/* =========================================================================
 * BANDEAU PUBLICITAIRE GLOBAL + POP-UP « VOTRE PUBLICITÉ ICI »
 * - Bandeau affiché en haut de chaque page (première vue) : publicités
 *   validées en carrousel, sinon rappel « votre publicité ici ».
 * - Bouton VOTRE PUBLICITÉ ICI : ouvre un pop-up avec le logo de la
 *   Chronique et un formulaire complet (soumission -> /api/ad-requests).
 * ========================================================================= */
(function () {
  'use strict';

  var ads = [];
  var cur = 0;
  var timer = null;
  var modal = null;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ---------- POP-UP FORMULAIRE ---------- */
  function buildModal() {
    if (modal) return modal;
    modal = document.createElement('div');
    modal.className = 'ad-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML =
      '<div class="ad-modal-backdrop" data-ad-close></div>' +
      '<div class="ad-modal-card">' +
      '<button type="button" class="ad-modal-close" data-ad-close aria-label="Fermer">&times;</button>' +
      '<div class="ad-modal-head">' +
      '<img src="assets/images/logo.png" alt="Chronique de James Mukeshaba" width="52" height="52" loading="lazy">' +
      '<div><h3>VOTRE PUBLICIT\u00c9 ICI</h3>' +
      '<p>Faites conna\u00eetre votre activit\u00e9 \u00e0 toute l\u2019audience de la Chronique de James Mukeshaba, en RDC et au Canada.</p></div>' +
      '</div>' +
      '<div class="ad-modal-body">' +
      '<div id="ad-modal-info" style="display:none;background:#e8f4fd;color:#0c4a6e;border:1px solid #cfe9fb;border-radius:8px;padding:12px 16px;margin-bottom:14px;font-size:0.9rem;"></div>' +
      '<div id="ad-modal-error" style="display:none;background:#fde8e8;color:#b91c1c;border:1px solid #f5c6c6;border-radius:8px;padding:12px 16px;margin-bottom:14px;font-size:0.9rem;"></div>' +
      '<form id="ad-modal-form" novalidate>' +
      '<div class="ad-field"><label>Nom de votre entreprise ou votre nom *</label>' +
      '<input type="text" id="ad-m-name" maxlength="120" placeholder="Ex : Boutique Mwangaza, Goma"></div>' +
      '<div class="ad-field"><label>Votre adresse email *</label>' +
      '<input type="email" id="ad-m-email" maxlength="200" placeholder="vous@exemple.com"></div>' +
      '<div class="ad-field"><label>Titre de la publicit\u00e9 *</label>' +
      '<input type="text" id="ad-m-title" maxlength="120" placeholder="Ex : Ouverture d\u2019une succursale \u00e0 Bukavu"></div>' +
      '<div class="ad-field"><label>Description *</label>' +
      '<textarea id="ad-m-description" rows="4" maxlength="2000" placeholder="D\u00e9crivez votre activit\u00e9, vos produits, votre \u00e9v\u00e9nement..."></textarea></div>' +
      '<div class="ad-field"><label>Photo de votre publicit\u00e9 *</label>' +
      '<div class="ad-drop" id="ad-m-drop">' +
      '<input type="file" id="ad-m-file" accept="image/*" style="display:none;">' +
      '<span style="font-size:1.8rem;display:block;margin-bottom:6px;">&#128247;</span>' +
      '<span style="font-weight:600;font-size:0.9rem;">Cliquez pour choisir une photo</span>' +
      '<span style="display:block;color:#94a3b8;font-size:0.78rem;margin-top:3px;">JPG, PNG, WebP - compress\u00e9e automatiquement</span>' +
      '<img id="ad-m-preview" alt="Aper\u00e7u" style="max-width:100%;max-height:200px;border-radius:8px;margin-top:10px;display:none;">' +
      '</div></div>' +
      '<button type="submit" id="ad-m-submit" class="ad-modal-submit">Envoyer ma demande</button>' +
      '</form>' +
      '<p style="font-size:0.78rem;opacity:0.7;margin:12px 0 0;">Chaque publicit\u00e9 est examin\u00e9e par la r\u00e9daction avant publication. R\u00e9ponse par email.</p>' +
      '</div></div>';
    document.body.appendChild(modal);

    function closeIt() { modal.classList.remove('open'); document.body.classList.remove('ad-modal-lock'); }
    modal.querySelectorAll('[data-ad-close]').forEach(function (el) {
      el.addEventListener('click', closeIt);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeIt(); });

    var drop = document.getElementById('ad-m-drop');
    var file = document.getElementById('ad-m-file');
    var preview = document.getElementById('ad-m-preview');
    var imageData = '';
    drop.addEventListener('click', function () { file.click(); });
    file.addEventListener('change', function (e) {
      var f = e.target.files[0];
      if (!f) return;
      if (f.size > 15 * 1024 * 1024) { showErr('Image trop volumineuse (15 Mo maximum).'); file.value = ''; return; }
      var r = new FileReader();
      r.onload = function (ev) { imageData = ev.target.result; preview.src = imageData; preview.style.display = 'block'; hideErr(); };
      r.readAsDataURL(f);
    });

    function showErr(m) {
      var el = document.getElementById('ad-modal-error');
      el.textContent = m; el.style.display = 'block';
    }
    function hideErr() { document.getElementById('ad-modal-error').style.display = 'none'; }
    function showOk(m) {
      var el = document.getElementById('ad-modal-info');
      el.textContent = m; el.style.display = 'block';
    }

    document.getElementById('ad-modal-form').addEventListener('submit', function (e) {
      e.preventDefault();
      hideErr();
      document.getElementById('ad-modal-info').style.display = 'none';
      if (!imageData) { showErr('Ajoutez une photo pour votre publicit\u00e9.'); return; }
      var payload = {
        title: document.getElementById('ad-m-title').value.trim(),
        name: document.getElementById('ad-m-name').value.trim(),
        email: document.getElementById('ad-m-email').value.trim(),
        description: document.getElementById('ad-m-description').value.trim(),
        image: imageData
      };
      if (payload.title.length < 5) { showErr('Le titre doit faire au moins 5 caract\u00e8res.'); return; }
      if (payload.name.length < 2) { showErr('Indiquez votre nom ou celui de votre entreprise.'); return; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.email)) { showErr('Adresse email invalide.'); return; }
      if (payload.description.length < 10) { showErr('La description doit faire au moins 10 caract\u00e8res.'); return; }
      var btn = document.getElementById('ad-m-submit');
      btn.disabled = true; btn.textContent = 'Envoi en cours\u2026';
      fetch('/api/ad-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) { return r.json().then(function (d) { return { status: r.status, body: d }; }); })
        .then(function (res) {
          if (!res.body.ok) {
            var msg = res.body.errors ? Object.values(res.body.errors)[0] : (res.body.error || 'Erreur lors de l\u2019envoi.');
            throw new Error(msg);
          }
          document.getElementById('ad-modal-form').reset();
          imageData = ''; preview.style.display = 'none';
          showOk('Merci ! Votre demande a bien \u00e9t\u00e9 transmise \u00e0 la r\u00e9daction. Vous serez inform\u00e9(e) par email d\u00e8s la d\u00e9cision.');
        })
        .catch(function (err) { showErr(err.message || 'Une erreur est survenue. R\u00e9essayez.'); })
        .finally(function () { btn.disabled = false; btn.textContent = 'Envoyer ma demande'; });
    });
    return modal;
  }

  window.openAdModal = function () {
    if (window.location.protocol === 'file:') return;
    var m = buildModal();
    m.classList.add('open');
    document.body.classList.add('ad-modal-lock');
  };

  /* ---------- BANDEAU ---------- */
  function buildBar(list) {
    var bar = document.getElementById('global-ads-bar');
    if (!bar) return;
    if (!list.length) {
      bar.innerHTML =
        '<div class="gads-bar gads-empty-bar">' +
        '<div class="gads-label">Espace publicitaire</div>' +
        '<div class="gads-empty">Votre publicit\u00e9 pourrait s\u2019afficher ici</div>' +
        '<button type="button" class="gads-cta" onclick="window.openAdModal()">VOTRE PUBLICIT\u00c9 ICI</button>' +
        '</div>';
      bar.style.display = 'block';
      return;
    }
    var html = '<div class="gads-bar">' +
      '<div class="gads-label">Espace publicitaire</div>' +
      '<div class="gads-track" id="gads-track">' +
      list.map(function (a, i) {
        var src = a.image && (a.image[0] === '/' || a.image.indexOf('http') === 0) ? a.image : '';
        return '<div class="gads-slide' + (i === 0 ? ' on' : '') + '" data-i="' + i + '">' +
          (src ? '<img src="' + esc(src) + '" alt="" loading="lazy">' : '<span class="gads-noimg">\uD83D\uDDBC\uFE0F</span>') +
          '<div class="gads-slide-text"><strong>' + esc(a.title) + '</strong>' +
          '<span>' + esc(a.description || '') + '</span></div></div>';
      }).join('') +
      '</div>' +
      '<button type="button" class="gads-nav gads-prev" aria-label="Pr\u00e9c\u00e9dent">&lsaquo;</button>' +
      '<button type="button" class="gads-nav gads-next" aria-label="Suivant">&rsaquo;</button>' +
      '<button type="button" class="gads-cta" onclick="window.openAdModal()">VOTRE PUBLICIT\u00c9 ICI</button>' +
      '</div>';
    bar.innerHTML = html;
    bar.style.display = 'block';

    var slides = bar.querySelectorAll('.gads-slide');
    function show(i) {
      if (!slides.length) return;
      cur = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('on', k === cur); });
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function start() {
      stop();
      if (slides.length > 1) timer = setInterval(function () { show(cur + 1); }, 5000);
    }
    var track = document.getElementById('gads-track');
    if (track) { track.addEventListener('mouseenter', stop); track.addEventListener('mouseleave', start); }
    var prev = bar.querySelector('.gads-prev');
    var next = bar.querySelector('.gads-next');
    if (prev) prev.addEventListener('click', function () { show(cur - 1); start(); });
    if (next) next.addEventListener('click', function () { show(cur + 1); start(); });
    start();
  }

  function load() {
    var bar = document.getElementById('global-ads-bar');
    if (!bar || window.location.protocol === 'file:') return;
    fetch('/api/ads/public?_=' + Date.now())
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { buildBar(d || []); })
      .catch(function () {});
  }

  document.addEventListener('DOMContentLoaded', load);
})();
