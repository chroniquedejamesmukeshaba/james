(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmtUSD(v) { return Number(v || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' }); }
  function fmtDate(s) {
    if (!s) return '';
    var d = new Date(String(s).slice(0, 10) + 'T00:00:00');
    if (isNaN(d)) return esc(String(s).slice(0, 10));
    return d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function campaignCard(c) {
    var goal = Number(c.goal || 0);
    var collected = Number(c.collected || 0);
    var progress = Number(c.progress || 0);
    var pct = Math.min(progress, 100).toFixed(1).replace('.', ',') + ' %';
    var bar = goal > 0
      ? '<div class="campaign-progress">' +
        '<div class="campaign-progress-bar"><div class="campaign-progress-fill" style="width:' + Math.min(progress, 100) + '%;"></div></div>' +
        '<div class="campaign-progress-labels"><span>Collect&eacute; : <strong>' + fmtUSD(collected) + '</strong></span>' +
        '<span>Objectif : <strong>' + fmtUSD(goal) + '</strong></span>' +
        '<span>' + pct + '</span></div>' +
        '</div>'
      : '<p style="font-size:0.85rem;color:var(--text-light);">Collect&eacute; : <strong>' + fmtUSD(collected) + '</strong></p>';
    var badges = '';
    if (c.status === 'ended') badges = '<span style="background:#f1f5f9;color:#475569;padding:2px 10px;border-radius:12px;font-size:0.75rem;">Termin&eacute;e</span>';
    if (goal > 0 && collected >= goal) badges = '<span style="background:#e7f6ec;color:#166534;padding:2px 10px;border-radius:12px;font-size:0.75rem;">Objectif atteint</span>';
    return '<div class="wcard" style="padding:22px;display:flex;flex-direction:column;gap:10px;">' +
      (c.image ? '<img src="' + esc(c.image) + '" alt="' + esc(c.title) + '" style="width:100%;height:150px;object-fit:cover;border-radius:10px;">' : '') +
      '<div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;">' +
      '<h3 style="color:var(--primary);margin:0;">' + esc(c.title) + '</h3>' + badges + '</div>' +
      '<p style="font-size:0.88rem;color:var(--text-light);margin:0;">' + esc(c.description || '') + '</p>' +
      bar +
      (c.donationCount > 0 ? '<small style="color:var(--text-light);">' + c.donationCount + ' don' + (c.donationCount > 1 ? 's' : '') + ' confirm&eacute;' + (c.donationCount > 1 ? 's' : '') + '</small>' : '') +
      '<a href="donation.html" style="margin-top:auto;text-align:center;" class="btn-primary">Faire un don</a>' +
      '</div>';
  }

  function loadCampaigns() {
    if (window.location.protocol === 'file:') return;
    fetch('/api/campaigns?_=' + Date.now()).then(function (r) { return r.json(); }).then(function (list) {
      var box = $('actions-campaigns');
      var items = (list || []).filter(function (c) { return c.status !== 'archived'; });
      if (!items.length) {
        box.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#999;">Aucune campagne en cours pour le moment. Revenez bient&ocirc;t !</p>';
        return;
      }
      box.innerHTML = items.map(campaignCard).join('');
    }).catch(function () {
      $('actions-campaigns').innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#999;">Impossible de charger les campagnes.</p>';
    });
  }

  function loadReports() {
    if (window.location.protocol === 'file:') return;
    fetch('/api/reports?_=' + Date.now()).then(function (r) { return r.json(); }).then(function (list) {
      var box = $('reports-list');
      if (!Array.isArray(list) || !list.length) {
        box.innerHTML = '<p style="text-align:center;color:#999;">Les rapports et r&eacute;sultats seront publi&eacute;s ici bient&ocirc;t.</p>';
        return;
      }
      box.innerHTML = list.slice().sort(function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')); }).map(function (r) {
        return '<div class="wcard" style="padding:20px;">' +
          '<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:baseline;">' +
          '<h3 style="color:var(--primary);margin:0;font-size:1.05rem;">' + esc(r.title) + '</h3>' +
          '<small style="color:var(--text-light);white-space:nowrap;">' + fmtDate(r.date) + (r.category ? ' &middot; ' + esc(r.category) : '') + '</small>' +
          '</div>' +
          (r.body ? '<p style="font-size:0.9rem;color:var(--text-light);margin:10px 0 0;white-space:pre-line;">' + esc(r.body) + '</p>' : '') +
          '</div>';
      }).join('');
    }).catch(function () {
      $('reports-list').innerHTML = '<p style="text-align:center;color:#999;">Impossible de charger les rapports.</p>';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if ($('actions-campaigns')) loadCampaigns();
    if ($('reports-list')) loadReports();
  });
})();
