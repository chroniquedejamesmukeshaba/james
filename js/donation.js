(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var currentCampaign = null;
  var txnId = null;
  var submittedAmount = null;
  var submittedMethod = '';

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmtUSD(v) { return Number(v || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' }); }
  function newIdem() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'don-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
  }
  function methodLabel(val) {
    var labels = { paypal: 'PayPal', card: 'Visa / Mastercard', airtel_money: 'Airtel Money', orange_money: 'Orange Money', vodacom_mpesa: 'Vodacom M-PESA' };
    return labels[val] || val || '—';
  }
  function showError(msg) {
    var e = $('don-error');
    e.style.display = 'block';
    e.textContent = msg;
  }
  function hideError() { $('don-error').style.display = 'none'; }
  function setPending(msg) {
    var p = $('don-pending');
    p.style.display = msg ? 'block' : 'none';
    if (msg) p.textContent = msg;
  }
  function showSuccess(note) {
    $('donation-form').style.display = 'none';
    $('don-success').style.display = 'block';
    $('receipt-details').innerHTML =
      'R&eacute;f&eacute;rence : <strong>' + esc(txnId || '—') + '</strong><br>' +
      'Montant : <strong>' + fmtUSD(submittedAmount) + '</strong><br>' +
      'M&eacute;thode : ' + esc(methodLabel(submittedMethod)) + '<br>' +
      'Date : ' + new Date().toLocaleString('fr-FR');
    if (note) $('don-receipt-note').textContent = note;
  }

  function bindAmounts() {
    document.querySelectorAll('.donation-amount').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.donation-amount').forEach(function (b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
        var custom = $('don-custom');
        if (btn.dataset.val === 'custom') {
          custom.style.display = 'block';
          $('don-amount').value = '';
          custom.focus();
        } else {
          custom.style.display = 'none';
          $('don-amount').value = btn.dataset.val;
        }
      });
    });
    $('don-custom').addEventListener('input', function () {
      if ($('don-custom').style.display === 'block') $('don-amount').value = this.value;
    });
  }

  function loadCampaigns() {
    if (window.location.protocol === 'file:') return;
    fetch('/api/campaigns?_=' + Date.now()).then(function (r) { return r.json(); }).then(function (list) {
      var actives = (list || []).filter(function (c) { return c.status === 'active'; });
      if (actives.length) {
        currentCampaign = actives[0];
        $('don-campaign-id').value = currentCampaign.id;
        $('don-campaign-strong').textContent = currentCampaign.title;
      } else {
        $('don-campaign-strong').textContent = 'aucune campagne active pour le moment';
      }
    }).catch(function () {});
  }

  function loadPaymentMethods() {
    if (window.location.protocol === 'file:') return;
    fetch('/api/payments/methods?_=' + Date.now()).then(function (r) { return r.json(); }).then(function (cfg) {
      if (!cfg || !cfg.providers) return;
      if (cfg.payment_unavailable) {
        $('pay-unavailable-note').textContent = 'Le paiement en ligne sera bientôt disponible. Votre don sera enregistré et confirmé dès son activation.';
      }
    }).catch(function () {});
  }

  function submitDonation(ev) {
    ev.preventDefault();
    hideError();
    var anonymous = $('don-anon').checked;
    var amount = parseFloat($('don-amount').value || '0');
    if (!amount || isNaN(amount) || amount < 1) { showError('Veuillez choisir un montant valide (minimum 1 USD).'); return; }
    if (amount > 100000) { showError('Le montant ne peut pas dépasser 100 000 USD.'); return; }
    if (!currentCampaign) { showError('Aucune campagne active pour le moment. Votre don ne peut pas encore être enregistré.'); return; }
    var method = document.querySelector('input[name="pay-method"]:checked');
    if (!method) { showError('Veuillez choisir une méthode de paiement.'); return; }
    if (!anonymous) {
      if (!$('don-name').value.trim()) { showError('Veuillez indiquer votre nom.'); return; }
      var email = $('don-email').value.trim();
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { showError('Veuillez indiquer une adresse email valide.'); return; }
    }
    submittedAmount = Math.round(amount * 100) / 100;
    submittedMethod = method.value;
    var payload = {
      campaignId: currentCampaign.id,
      amount: submittedAmount.toFixed(2),
      name: anonymous ? '' : $('don-name').value.trim(),
      email: anonymous ? '' : $('don-email').value.trim(),
      phone: anonymous ? '' : $('don-phone').value.trim(),
      message: anonymous ? '' : $('don-message').value.trim(),
      method: method.value,
      anonymous: anonymous,
      idempotency_key: newIdem()
    };
    var btn = $('don-submit');
    btn.disabled = true;
    btn.textContent = 'Traitement en cours…';
    fetch('/api/donations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json().then(function (d) { return { status: r.status, body: d }; }); })
      .then(function (res) {
        if (res.body && res.body.ok) {
          txnId = res.body.txn_id;
          $('don-txn-id').value = txnId;
          initPayment(txnId);
          return;
        }
        btn.disabled = false;
        btn.textContent = '❤️ FAIRE UN DON';
        if (res.body && res.body.errors) {
          showError(Object.keys(res.body.errors).map(function (k) { return res.body.errors[k]; }).join(' '));
        } else {
          showError('Une erreur est survenue. Veuillez réessayer.');
        }
      })
      .catch(function () {
        btn.disabled = false;
        btn.textContent = '❤️ FAIRE UN DON';
        showError('Connexion impossible au serveur. Veuillez réessayer.');
      });
  }

  function initPayment(txn) {
    setPending('Votre demande est en cours de traitement…');
    fetch('/api/payments/init', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ txn_id: txn }) })
      .then(function (r) { return r.json().then(function (d) { return { status: r.status, body: d }; }); })
      .then(function (res) {
        var d = res.body || {};
        if (d.redirect_url) {
          setPending('Vous êtes redirigé vers le prestataire de paiement…');
          window.location.href = d.redirect_url;
          return;
        }
        if (res.status === 402 || d.code === 'payment_unavailable') {
          setPending('');
          showSuccess('Votre don de ' + fmtUSD(submittedAmount) + ' a bien été enregistré (référence ' + txn + '). Dès l\'activation du paiement en ligne, il sera confirmé et un reçu vous sera envoyé par email.');
          return;
        }
        if (d.status === 'confirmed') {
          setPending('');
          showSuccess('Merci ! Votre paiement a été confirmé et votre don comptabilisé. Le reçu vous est envoyé par email.');
          return;
        }
        setPending(d.error || 'Le paiement n\'a pas pu être initié. Votre don reste enregistré (référence ' + txn + ').');
      })
      .catch(function () {
        setPending('Impossible de joindre le prestataire pour le moment. Votre don reste enregistré (référence ' + txn + ').');
      });
  }

  function checkReturn() {
    var m = (window.location.search || '').match(/[?&]txn_id=([^&]+)/);
    if (!m) return;
    var txn = decodeURIComponent(m[1]);
    txnId = txn;
    fetch('/api/payments/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ txn_id: txn }) })
      .then(function (r) { return r.json().then(function (d) { return { status: r.status, body: d }; }); })
      .then(function (res) {
        var d = res.body || {};
        if (res.status === 404) return;
        if (d.status === 'confirmed') {
          setPending('');
          showSuccess('Merci ! Votre paiement a été confirmé et votre don comptabilisé. Le reçu vous est envoyé par email.');
        } else if (d.status === 'failed' || d.status === 'cancelled') {
          setPending('Votre paiement a été annulé. Vous pouvez réessayer ci-dessus.');
        } else {
          setPending('Votre paiement est en cours de confirmation. La confirmation vous sera envoyée par email.');
        }
      })
      .catch(function () {});
  }

  document.addEventListener('DOMContentLoaded', function () {
    var form = $('donation-form');
    if (!form) return;
    bindAmounts();
    loadCampaigns();
    loadPaymentMethods();
    form.addEventListener('submit', submitDonation);
    var printBtn = $('don-print');
    if (printBtn) printBtn.addEventListener('click', function () { window.print(); });
    checkReturn();
  });
})();
