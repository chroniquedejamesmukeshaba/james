/* ===== Consentement cookies / confidentialité (RGPD) =====
   - Aucun tracking (visites, lectures, partages) sans consentement.
   - Le choix est conservé (localStorage) et modifiable via le lien Cookies du pied de page. */

(function () {
  'use strict';
  var KEY = 'chronique_cookies_consent';

  function get() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function set(v) {
    try { localStorage.setItem(KEY, v); } catch (e) {}
  }

  function buildBanner() {
    var wrap = document.createElement('div');
    wrap.id = 'consent-banner';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'false');
    wrap.setAttribute('aria-label', 'Gestion des cookies et de la confidentialité');
    wrap.innerHTML =
      '<div class="consent-inner">' +
        '<p class="consent-text">Ce site utilise des cookies et collecte des données de navigation uniquement pour mesurer ' +
        'l\u2019audience et améliorer le contenu. Vous pouvez refuser dès maintenant ; vos visites ne seront alors pas suivies. ' +
        '<a href="cookies.html">Notre politique de cookies</a> et <a href="privacy.html">politique de confidentialité</a> détaillent nos pratiques.</p>' +
        '<div class="consent-actions">' +
          '<button type="button" id="consent-accept" class="btn btn-primary">Tout accepter</button>' +
          '<button type="button" id="consent-refuse" class="btn btn-outline">Refuser</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap);

    wrap.querySelector('#consent-accept').addEventListener('click', function () {
      set('accepted');
      hideBanner();
      window.dispatchEvent(new CustomEvent('consentchange', { detail: 'accepted' }));
    });
    wrap.querySelector('#consent-refuse').addEventListener('click', function () {
      set('refused');
      hideBanner();
      window.dispatchEvent(new CustomEvent('consentchange', { detail: 'refused' }));
    });
  }
  function hideBanner() {
    var b = document.getElementById('consent-banner');
    if (b) b.remove();
  }
  function showBanner() {
    if (document.getElementById('consent-banner')) return;
    if (!get()) buildBanner();
    else if (get() === 'refused') {
      // l'utilisateur peut revenir sur son choix via le lien du pied de page
      buildBanner();
      document.getElementById('consent-banner').classList.add('consent-reopen');
    }
  }

  // API publique : window.Consent
  window.Consent = {
    // a-t-on déjà un choix ?
    decided: function () { return !!get(); },
    // le tracking passif est-il autorisé ?
    allowed: function () { return get() === 'accepted'; },
    open: showBanner
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (!window.Consent.decided()) buildBanner();
  });
  // lien « 🍪 Cookies » éventuel dans le pied de page : consentement re-ouvrable
  window.manageCookies = showBanner;
})();