/* =========================================================================
 * Soutenir nos actions communautaires - JS public
 * Flux securise :
 *   1. POST /api/donations  -> cree une intention de don (txn_id unique,
 *      cle d'idempotence). Aucun credit n'est applique.
 *   2. POST /api/payments/init -> initie le paiement chez le prestataire
 *      (appel cote serveur). Retour navigateur IGNORE comme preuve.
 *   3. La campagne n'est creditee qu'apres confirmation serveur
 *      (webhook signe du prestataire ou POST /api/payments/verify).
 * AUCUNE simulation de paiement.
 * ========================================================================= */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var campaigns = [];
  var selectedCampaignId = null;
  var idempotencyKey = newIdem();
  var busy = false;
  var feePct = 0.035;
  var currency = 'USD';
  var QUICK_AMOUNTS = { USD: [1, 5, 10, 25, 50, 100], CDF: [2000, 5000, 10000, 25000, 50000, 100000] };
  var LIMITS = { USD: { min: 1, max: 100000 }, CDF: { min: 1000, max: 250000000 } };

  function newIdem() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return 'don-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
  }

  function fmtUSD(v) {
    return Number(v || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }

  function fmtCDF(v) {
    return Number(v || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' FC';
  }

  function fmtMoney(v, cur) {
    return cur === 'CDF' ? fmtCDF(v) : fmtUSD(v);
  }

  function showError(msg) {
    var e = $('don-error');
    if (msg) {
      e.textContent = msg;
      e.style.display = 'block';
    } else {
      e.style.display = 'none';
    }
  }

  function showInfo(msg) {
    var i = $('don-info');
    if (msg) {
      i.textContent = msg;
      i.style.display = 'block';
    } else {
      i.style.display = 'none';
    }
  }

  /* ---------- Campagnes ---------- */
  function renderCampaigns(list) {
    var box = $('campaign-list');
    if (!list.length) {
      box.innerHTML = '<div class="sg-empty" style="grid-column:1/-1;text-align:center;padding:40px;opacity:0.75;">' +
        'Aucune campagne de financement en cours pour le moment. Revenez bient&ocirc;t.</div>';
      return;
    }
    var html = '';
    list.forEach(function (c) {
      var goal = Number(c.goal || 0);
      var col = Number(c.collected || 0);
      var colCDF = Number(c.collected_cdf || 0);
      var pct = goal > 0 ? Math.min(col / goal * 100, 100) : 0;
      var isDone = goal > 0 && col >= goal;
      var isVideo = c.video && (c.video[0] === '/' || c.video.indexOf('http') === 0 || c.video.indexOf('data:') === 0);
      var img = (c.image && (c.image[0] === '/' || c.image.indexOf('http') === 0 || c.image.indexOf('data:') === 0)) ? c.image : '';
      var endBadge = '';
      if (c.status === 'ended') {
        endBadge = '<span class="cat-chip" style="background:rgba(192,57,43,.12);color:#c0392b;">Cl&ocirc;tur&eacute;e</span>';
      } else if (c.endDate) {
        var end = new Date(c.endDate);
        if (!isNaN(end.getTime()) && end < new Date()) endBadge = '<span class="cat-chip" style="background:rgba(192,57,43,.12);color:#c0392b;">Termin&eacute;e</span>';
      }
      var media = img
        ? '<div class="card-banner" style="height:170px;background:url(' + img + ') center/cover;"></div>'
        : '<div class="card-banner" style="height:170px;background:linear-gradient(135deg,var(--primary),var(--primary-light));"></div>';
      if (isVideo) {
        media = '<div class="card-banner card-banner-video" style="height:185px;background:#08121f;">' +
          '<video src="' + c.video + '" controls muted playsinline preload="metadata" style="width:100%;height:100%;object-fit:cover;"></video>' +
          '</div>';
      }
      var collecte = '<strong>' + pct.toFixed(0) + ' %</strong> de l\u2019objectif atteint';
      html += '<article class="wcard campaign-card" data-id="' + c.id + '" style="cursor:pointer;display:flex;flex-direction:column;overflow:hidden;border:2px solid transparent;transition:border-color .2s;">' +
        media +
        '<div class="wcard-body" style="padding:20px;flex:1;display:flex;flex-direction:column;gap:10px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">' +
        '<h2 style="margin:0;font-size:1.05rem;">' + esc(c.title) + '</h2>' + endBadge + '</div>' +
        '<p style="margin:0;font-size:0.92rem;opacity:0.8;flex:1;">' + esc(c.description || '') + '</p>' +
        '<div class="campaign-progress" style="margin-top:4px;">' +
        '  <div class="campaign-progress-bar"><div class="campaign-progress-fill" style="width:' + pct.toFixed(1) + '%;"></div></div>' +
        '  <div class="campaign-progress-labels"><span>' + collecte + '</span>' +
        '  <span>objectif ' + fmtUSD(goal) + '</span></div>' +
        '</div>' +
        (c.status === 'ended' ? '<div class="cat-chip" style="background:rgba(192,57,43,.1);color:#c0392b;">' + esc(c.closedReason || 'Collecte clôturée') + '</div>' : '') +
        (isDone ? '<span class="cat-chip" style="background:rgba(31,111,235,.12);color:var(--primary);">Objectif atteint &mdash; merci !</span>' : '') +
        (c.status === 'ended'
          ? '<button class="btn-primary" style="border:none;padding:11px;border-radius:8px;font-weight:600;background:#5c6f85;color:#fff;cursor:not-allowed;" disabled>Collecte cl&ocirc;tur&eacute;e</button>'
          : '<button class="btn-primary" style="border:none;padding:11px;border-radius:8px;font-weight:600;cursor:pointer;">Je fais un don</button>') +
        '</div></article>';
    });
    box.innerHTML = html;

    box.querySelectorAll('.campaign-card').forEach(function (card) {
      card.addEventListener('click', function (ev) {
        if (ev.target.closest('video')) return;
        box.querySelectorAll('.campaign-card').forEach(function (x) { x.style.borderColor = 'transparent'; });
        card.style.borderColor = 'var(--primary)';
        selectCampaign(Number(card.dataset.id));
      });
    });
    var firstActive = list.filter(function (x) { return x.status === 'active'; })[0];
    if (firstActive) selectCampaign(Number(firstActive.id));
    else if (list.length) selectCampaign(Number(list[0].id));
  }

  function selectCampaign(id) {
    var c = null;
    campaigns.forEach(function (x) { if (x.id === id) c = x; });
    if (!c) return;
    selectedCampaignId = id;
    $('don-campaign-id').value = id;
    var goal = Number(c.goal || 0);
    var col = Number(c.collected || 0);
    var colCDF = Number(c.collected_cdf || 0);
    var pctS = goal > 0 ? Math.min((col + colCDF / 2900) / goal * 100, 100) : 0;
    $('don-form-campaign').textContent = c.title + ' — ' + pctS.toFixed(0) + ' % de l\u2019objectif de ' + fmtUSD(goal) + ' atteint. Merci pour votre générosité !';
    var closedNote = $('don-closed-note');
    if (c.status === 'ended' && c.closedReason && closedNote) {
      closedNote.textContent = 'Collecte cl\u00f4tur\u00e9e : ' + c.closedReason;
      closedNote.style.display = 'block';
    } else if (closedNote) {
      closedNote.style.display = 'none';
    }
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function loadCampaigns() {
    var sl = (typeof localStorage !== 'undefined' ? localStorage.getItem('cms_lang') : null) || 'fr';
    fetch('/api/campaigns?lang=' + sl + '&_=' + Date.now())
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (list) {
        campaigns = (list || []).filter(function (c) { return c.status === 'active' || c.status === 'ended'; });
        renderCampaigns(campaigns);
      })
      .catch(function () {
        $('campaign-list').innerHTML = '<div class="sg-empty" style="grid-column:1/-1;text-align:center;padding:40px;opacity:0.75;">Impossible de charger les campagnes. R&eacute;essayez plus tard.</div>';
      });
  }

  /* ---------- Moyens de paiement ---------- */
  function loadPaymentMethods() {
    fetch('/api/payments/methods?_=' + Date.now())
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (cfg) {
        if (!cfg) return;
        var enabled = cfg.providers || {};
        if (cfg.fee_pct && cfg.fee_pct > 0) feePct = cfg.fee_pct;
        document.querySelectorAll('.pay-method').forEach(function (label) {
          var input = label.querySelector('input');
          var disabled = !enabled[input.value] || !enabled[input.value].enabled;
          label.style.opacity = disabled ? '0.45' : '1';
          input.disabled = disabled;
          if (disabled && input.checked) input.checked = false;
        });
        var first = document.querySelector('.pay-method input:not(:disabled)');
        if (first) first.checked = true;
        var note = $('pay-unavailable-note');
        if (cfg.payment_unavailable) {
          note.textContent = 'Les paiements en ligne seront bientôt disponibles. Merci de réessayer plus tard ou de nous contacter pour un don manuel.';
        } else {
          note.textContent = 'Paiement sécurisé : vos données bancaires ne sont jamais stockées sur ce site.';
        }
        refreshPhoneReq();
        updateFeeSummary();
      })
      .catch(function () {});
  }

  /* ---------- Méthode active / résumé des frais ---------- */
  function currentMethod() {
    var el = document.querySelector('.pay-method input[name="pay-method"]:not(:disabled):checked');
    return el ? el.value : '';
  }

  var MONEY_METHODS = ['airtel_money', 'orange_money', 'vodacom_mpesa'];
  function isMoneyMethod(m) { return MONEY_METHODS.indexOf(m) !== -1; }

  function refreshPhoneReq() {
    var req = isMoneyMethod(currentMethod());
    var lbl = $('don-phone-req');
    if (lbl) lbl.textContent = req ? ' (requis pour Airtel, Orange, M-Pesa)' : ' (facultatif pour PayPal / carte)';
    var inp = $('don-phone');
    if (inp) inp.required = req;
  }

  function updateFeeSummary() {
    var box = $('don-fee-summary');
    if (!box) return;
    if (!isMoneyMethod(currentMethod())) { box.style.display = 'none'; return; }
    var net = parseFloat($('don-amount').value || '0');
    if (!(net > 0)) { box.style.display = 'none'; return; }
    var fee = currency === 'CDF' ? Math.round(net * feePct) : net * feePct;
    var total = currency === 'CDF' ? Math.round(net + fee) : net + fee;
    var curLabel = currency === 'CDF' ? ' CDF' : ' USD';
    $('fee-net').textContent = fmtMoney(net, currency);
    $('fee-amount').textContent = fmtMoney(fee, currency) + ' (' + (feePct * 100).toFixed(1) + ' %)';
    $('fee-total').textContent = fmtMoney(total, currency) + curLabel;
    box.style.display = 'block';
  }

  /* ---------- Devise + montants ---------- */
  function setCurrency(cur) {
    currency = cur === 'CDF' ? 'CDF' : 'USD';
    var lim = LIMITS[currency];
    var inp = $('don-amount');
    var curVal = parseFloat(inp.value || '0');
    var defaultVal = currency === 'CDF' ? 5000 : 25;
    inp.value = (curVal > 0 && QUICK_AMOUNTS[currency].indexOf(curVal) === -1 && lim.min <= curVal && curVal <= lim.max)
      ? curVal : (curVal > 0 ? (currency === 'CDF' ? curVal * 1000 : Math.round(curVal / 1000)) : defaultVal);
    if (!(inp.value > 0) || isNaN(inp.value)) inp.value = defaultVal;
    inp.min = lim.min;
    inp.max = lim.max;
    inp.step = currency === 'CDF' ? '1' : '0.01';
    $('don-amount-label').textContent = currency === 'CDF' ? '(Francs CDF)' : '(USD)';

    var lblNet = $('fee-net'), lblTot = $('fee-total');
    document.querySelectorAll('.currency-btn').forEach(function (b) {
      var on = b.dataset.cur === currency;
      b.classList.toggle('selected', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    renderQuickAmounts();
    updateFeeSummary();
  }

  function renderQuickAmounts() {
    var box = $('don-quick-amounts');
    box.innerHTML = QUICK_AMOUNTS[currency].map(function (v) {
      var label = currency === 'CDF' ? v.toLocaleString('fr-FR') + ' FC' : v + ' $';
      return '<button type="button" class="donation-amount' + (String($('don-amount').value) === String(v) ? ' selected' : '') + '" data-val="' + v + '">' + label + '</button>';
    }).join('');
  }

  function bindAmounts() {
    $('don-quick-amounts').addEventListener('click', function (ev) {
      var b = ev.target.closest('.donation-amount');
      if (!b) return;
      setAmount(b.dataset.val);
    });
    $('don-amount').addEventListener('input', function () {
      document.querySelectorAll('.donation-amount').forEach(function (x) { x.classList.remove('selected'); });
      updateFeeSummary();
    });
    document.querySelectorAll('.currency-btn').forEach(function (b) {
      b.addEventListener('click', function () { setCurrency(b.dataset.cur); });
    });
    document.querySelectorAll('.pay-method input[name="pay-method"]').forEach(function (r) {
      r.addEventListener('change', function () {
        refreshPhoneReq();
        updateFeeSummary();
      });
    });
  }

  function setAmount(v) {
    document.querySelectorAll('.donation-amount').forEach(function (x) { x.classList.remove('selected'); });
    $('don-amount').value = v;
    var btn = document.querySelector('.donation-amount[data-val="' + v + '"]');
    if (btn) btn.classList.add('selected');
    updateFeeSummary();
  }

  /* ---------- Soumission : intention puis initiation paiement ---------- */
  function submitDonation(ev) {
    ev.preventDefault();
    if (busy) return;
    showError(null); showInfo(null);

    var campaignId = $('don-campaign-id').value;
    if (!campaignId) { showError('Veuillez s\u00e9lectionner une campagne active.'); return; }
    var selected = null;
    campaigns.forEach(function (x) { if (String(x.id) === String(campaignId)) selected = x; });
    if (!selected) { showError('Veuillez s\u00e9lectionner une campagne active.'); return; }
    if (selected.status === 'ended') { showError('Cette collecte est cl\u00f4tur\u00e9e : les dons ne sont plus accept\u00e9s pour celle-ci. Merci de votre compr\u00e9hension.'); return; }
    var amount = parseFloat($('don-amount').value);
    var lim = LIMITS[currency];
    if (!(amount >= lim.min && amount <= lim.max)) {
      showError(currency === 'CDF'
        ? 'Le montant doit \u00eatre compris entre 1 000 et 250 000 000 Francs (CDF).'
        : 'Le montant doit \u00eatre compris entre 1 et 100000 USD.');
      return;
    }
    if (currency === 'CDF' && amount % 1 !== 0) {
      showError('Le montant en Francs doit \u00eatre un nombre entier.');
      return;
    }
    var name = $('don-name').value.trim();
    if (!name) { showError('Veuillez indiquer votre nom complet.'); return; }
    var methodEl = document.querySelector('.pay-method input[name="pay-method"]:not(:disabled):checked');
    if (!methodEl) { showError('Aucun moyen de paiement disponible pour le moment.'); return; }
    var method = methodEl.value;
    var phone = $('don-phone').value.trim();
    if (isMoneyMethod(method)) {
      if (!phone) { showError('Veuillez indiquer votre num\u00e9ro de t\u00e9l\u00e9phone pour le paiement mobile money.'); return; }
      if (phone.replace(/[^0-9]/g, '').length < 10) { showError('Num\u00e9ro de t\u00e9l\u00e9phone invalide (ex : +243XXXXXXXXX).'); return; }
    }

    busy = true;
    var submit = $('don-submit');
    submit.disabled = true;
    submit.textContent = 'Traitement en cours\u2026';
    var txnRef = '';

    var payload = {
      campaignId: campaignId,
      amount: amount.toFixed(2),
      currency: currency,
      name: name,
      phone: phone,
      message: $('don-message').value.trim(),
      method: method,
      idempotency_key: idempotencyKey
    };

    fetch('/api/donations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json().then(function (d) { return { status: r.status, body: d }; }); })
      .then(function (res) {
        if (!res.body.ok) {
          var msg = res.body.errors ? Object.values(res.body.errors)[0] : (res.body.error || 'Erreur lors de l\u2019enregistrement du don.');
          throw new Error(msg);
        }
        var txn = res.body.txn_id;
        txnRef = txn;
        $('don-txn-id').value = txn;
        $('don-ref').textContent = txn;
        return initPayment(txn, method);
      })
      .then(function (res) {
        // Intentions renouvelees a chaque tentative : une nouvelle cle permet
        // de reessayer sans creer de doublon cote prestataire.
        idempotencyKey = newIdem();
        if (res.redirect_url) {
          $('don-pending').style.display = 'block';
          $('don-pending-msg').textContent = 'Vous allez \u00eatre redirig\u00e9(e) vers ' + method.replace('_', ' ') + ' pour finaliser votre paiement.';
          window.location.href = res.redirect_url;
          return;
        }
        if (res.ok) {
          // Paiement initie sans redirection web : mobile money via USSD.
          $('don-pending').style.display = 'block';
          $('don-pending-msg').textContent = 'Une demande de paiement a \u00e9t\u00e9 envoy\u00e9e sur votre t\u00e9l\u00e9phone. Confirmez-la avec votre code PIN, puis patientez : la confirmation est v\u00e9rifi\u00e9e automatiquement.';
          pollVerify(txnRef, 0);
          return;
        }
        // Paiement non configure : on garde l'intention mais on informe
        // honnetement (aucune simulation).
        $('don-pending').style.display = 'block';
        $('don-pending-msg').textContent = 'Votre don est enregistr\u00e9 avec la r\u00e9f\u00e9rence ' + txnRef + '. Le paiement en ligne sera bient\u00f4t disponible : votre demande restera valide d\u00e8s l\u2019activation du prestataire.';
      })
      .catch(function (err) {
        showError(err.message || 'Une erreur est survenue. R&eacute;essayez.');
      })
      .finally(function () {
        busy = false;
        submit.disabled = false;
        submit.textContent = '\u2764\uFE0F Proc&eacute;der au paiement s&eacute;curis&eacute;';
      });
  }

  function initPayment(txnId, method) {
    return fetch('/api/payments/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txn_id: txnId })
    }).then(function (r) {
      return r.json().then(function (d) {
        if (!d.ok && d.code !== 'payment_unavailable') throw new Error(d.error || 'Initiation du paiement impossible.');
        if (!d.ok && d.code === 'payment_unavailable') return { redirect_url: '' };
        return d;
      });
    });
  }

  /* ---------- Retour depuis le prestataire : verification serveur ---------- */
  function pollVerify(txn, tries) {
    if (tries > 40) {
      $('don-pending-msg').textContent = 'La confirmation du paiement est en cours c\u00f4t\u00e9 prestataire. Vous serez inform\u00e9(e) d\u00e8s validation.';
      return;
    }
    setTimeout(function () {
      fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txn_id: txn })
      }).then(function (r) { return r.json(); }).then(function (d) {
        if (d.ok && d.status === 'confirmed') {
          $('don-pending-msg').textContent = 'MERCI ! Votre paiement a \u00e9t\u00e9 confirm\u00e9 et votre don comptabilis\u00e9. Toute la Chronique de James Mukeshaba vous remercie chaleureusement pour votre g\u00e9n\u00e9rosit\u00e9.';
          loadCampaigns();
          return;
        }
        if (d.ok && (d.status === 'failed' || d.status === 'cancelled')) {
          $('don-pending-msg').textContent = 'Votre paiement a \u00e9t\u00e9 annul\u00e9 ou n\u2019a pas abouti. Vous pouvez r\u00e9essayer ci-dessus.';
          idempotencyKey = newIdem();
          return;
        }
        pollVerify(txn, tries + 1);
      }).catch(function () {
        pollVerify(txn, tries + 1);
      });
    }, 6000);
  }

  function checkReturn() {
    var q = new URLSearchParams(window.location.search);
    var txn = q.get('txn_id');
    if (!txn) return;
    $('don-pending').style.display = 'block';
    $('don-ref').textContent = txn;
    $('don-pending-msg').textContent = 'V\u00e9rification du paiement aupr\u00e8s du prestataire\u2026';
    fetch('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txn_id: txn })
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (d.ok && d.status === 'confirmed') {
        $('don-pending-msg').textContent = 'MERCI ! Votre don (' + txn + ') a \u00e9t\u00e9 confirm\u00e9 et comptabilis\u00e9. Toute la Chronique de James Mukeshaba vous remercie chaleureusement pour votre g\u00e9n\u00e9rosit\u00e9.';
        loadCampaigns();
      } else if (d.ok && (d.status === 'failed' || d.status === 'cancelled')) {
        $('don-pending-msg').textContent = 'Votre paiement a \u00e9t\u00e9 annul\u00e9 ou n\u2019a pas abouti. Vous pouvez r\u00e9essayer.';
        idempotencyKey = newIdem();
      } else {
        $('don-pending-msg').textContent = 'Votre paiement est en cours de confirmation c\u00f4t\u00e9 prestataire. Vous serez inform\u00e9(e) d\u00e8s validation.';
      }
    }).catch(function () {
      $('don-pending-msg').textContent = 'Impossible de v\u00e9rifier le paiement pour le moment. Vous serez inform\u00e9(e) d\u00e8s validation.';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    loadCampaigns();
    loadPaymentMethods();
    bindAmounts();
    $('donation-form').addEventListener('submit', submitDonation);
    checkReturn();
    document.addEventListener('langchange', loadCampaigns);
  });
})();
