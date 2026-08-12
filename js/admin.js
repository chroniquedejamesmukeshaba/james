// ===== mini-rendu apercu d'article (markdown leger) =====
function editorPreview(src) {
  if (!src) return '<p style="color:#bbb;">Aperçu vide.</p>';
  function esc(x) {
    return String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function inline(x) {
    x = esc(x);
    x = x.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    x = x.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    x = x.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
    x = x.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;margin:8px 0;">');
    return x;
  }
  var lines = String(src).split(/\r?\n/);
  var html = [], i, ln;
  for (i = 0; i < lines.length; i++) {
    ln = lines[i];
    if (/^###\s+/.test(ln)) { html.push('<h3>' + inline(ln.replace(/^###\s+/, '')) + '</h3>'); }
    else if (/^##\s+/.test(ln)) { html.push('<h2>' + inline(ln.replace(/^##\s+/, '')) + '</h2>'); }
    else if (/^#\s+/.test(ln)) { html.push('<h1>' + inline(ln.replace(/^#\s+/, '')) + '</h1>'); }
    else if (/^>\s?/.test(ln)) { html.push('<blockquote style="border-left:4px solid #ffb703;margin:8px 0;padding:4px 14px;color:#555;background:#fdf3d8;">' + inline(ln.replace(/^>\s?/, '')) + '</blockquote>'); }
    else if (/^[-*]\s+/.test(ln)) { html.push('<li style="margin-left:20px;">' + inline(ln.replace(/^[-*]\s+/, '')) + '</li>'); }
    else if (!ln.trim()) { html.push('<br>'); }
    else { html.push('<p style="margin:6px 0;">' + inline(ln) + '</p>'); }
  }
  return html.join('');
}

document.addEventListener('DOMContentLoaded', function () {

  // ===== LOGIN (authentification securisee : token serveur + 2FA) =====
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    const totpWrap = document.getElementById('totp-wrap');
    const totpInput = document.getElementById('totp-code');
    const loginError = document.getElementById('login-error');
    const loginSubmit = document.getElementById('login-submit');
    const loginCard = document.getElementById('login-card');
    function setError(msg, isInfo) {
      if (!loginError) { showToast(msg, 'error'); return; }
      loginError.hidden = false;
      loginError.className = 'login-error' + (isInfo ? ' is-info' : '');
      loginError.innerHTML =
        '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        (isInfo
          ? '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
          : '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>') +
        '<span></span>';
      loginError.querySelector('span').textContent = msg;
      if (loginCard && !isInfo) {
        loginCard.classList.remove('shake');
        void loginCard.offsetWidth;
        loginCard.classList.add('shake');
      }
    }
    function clearError() { if (loginError) loginError.hidden = true; }
    function setLoading(on) {
      if (!loginSubmit) return;
      loginSubmit.disabled = on;
      var lbl = loginSubmit.querySelector('.login-btn-label');
      var sp = loginSubmit.querySelector('.login-btn-spinner');
      if (lbl) lbl.textContent = on ? 'Connexion en cours\u2026' : 'Se connecter';
      if (sp) sp.hidden = !on;
    }
    function showTotp() {
      if (!totpWrap) return;
      totpWrap.hidden = false;
      totpWrap.classList.remove('totp-reveal');
      void totpWrap.offsetWidth;
      totpWrap.classList.add('totp-reveal');
      if (totpInput) totpInput.focus();
    }
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (window.location.protocol === 'file:') {
        showToast('La connexion nécessite le serveur (ouvrez le site via http://).', 'error');
        return;
      }
      clearError();
      setLoading(true);
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const payload = { user: username, pass: password };
      if (totpInput && totpInput.value) payload.totp = totpInput.value;
      function grant(res) {
        localStorage.setItem('admin_logged', 'true');
        localStorage.setItem('admin_name', res.name || '');
        localStorage.setItem('admin_token', res.token || '');
        localStorage.setItem('admin_role', res.role || '');
        localStorage.removeItem('admin_redirecting');
        window.location.href = 'index.html';
      }
      fetch('/api/auth', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
        .then(function(r){ return r.json().then(function(b){ return {status:r.status, body:b}; }); })
        .then(function(res){
          setLoading(false);
          if (res.body && res.body.ok && res.body.token) { grant(res.body); return; }
          if (res.body && res.body.totp) {
            showTotp();
            setError('Entrez le code 2FA affiché dans votre application d\u2019authentification.', true);
            return;
          }
          if (res.status === 429) { setError('Trop de tentatives. Réessayez dans quelques minutes.'); showToast('Trop de tentatives. Reessayez dans quelques minutes.', 'error'); return; }
          setError('Identifiants incorrects.');
          showToast('Identifiants incorrects.', 'error');
        })
        .catch(function(){
          setLoading(false);
          setError('Serveur injoignable. Vérifiez la connexion.');
          showToast('Serveur injoignable. Vérifiez la connexion.', 'error');
        });
    });
  }

  // ===== DATA API HELPERS =====
var useServer = window.location.protocol !== 'file:';
function authHeaders(extra) {
  var h = extra || {'Content-Type':'application/json'};
  var token = localStorage.getItem('admin_token');
  if (token) h['X-Admin-Token'] = token;
  return h;
}

function apiGet(path) {
  if (!useServer) return null;
  return fetch('/api' + path, {headers: authHeaders()}).then(function(r){
    if (r.status === 401) { forceLogin(); return null; }
    return r.ok ? r.json() : null;
  }).catch(function(){return null});
}
function apiPost(path, data) {
  if (!useServer) return null;
  return fetch('/api' + path,{method:'POST',headers:authHeaders(),body:JSON.stringify(data)})
    .then(function(r){
      if (r.status === 401) { forceLogin(); return null; }
      return r.ok ? r.json() : null;
    }).catch(function(){return null});
}
function apiDel(path) {
  if (!useServer) return null;
  return fetch('/api' + path,{method:'DELETE',headers:authHeaders()}).then(function(r){
    if (r.status === 401) { forceLogin(); return null; }
    return r.ok;
  }).catch(function(){return false});
}
function apiPut(path, data) {
  if (!useServer) return null;
  return fetch('/api' + path,{method:'PUT',headers:authHeaders(),body:JSON.stringify(data)})
    .then(function(r){
      if (r.status === 401) { forceLogin(); return null; }
      return r.ok ? r.json() : null;
    }).catch(function(){return null});
}
function forceLogin() {
  if (window.location.protocol === 'file:') return;
  var last = parseInt(localStorage.getItem('admin_redirecting') || '0', 10);
  var now = Date.now();
  // anti-boucle : max 1 redirection / 3 s (le flag n'est plus permanent)
  if (now - last < 3000) return;
  localStorage.setItem('admin_redirecting', String(now));
  localStorage.removeItem('admin_logged');
  localStorage.removeItem('admin_name');
  localStorage.removeItem('admin_token');
  window.location.href = 'login.html';
}

// ===== RBAC : roles et acces aux pages =====
const ROLE_LABELS = { super_admin:'Super administrateur', admin:'Administrateur', editeur:'Éditeur', moderateur:'Modérateur', journaliste:'Journaliste', analyste:'Analyste' };
const ROLE_PAGES = {
  'index.html': ['super_admin','admin','editeur','moderateur','journaliste','analyste'],
  'articles.html': ['super_admin','admin','editeur','journaliste'],
  'media.html': ['super_admin','admin','editeur','journaliste'],
  'comments.html': ['super_admin','admin','moderateur'],
  'analytics.html': ['super_admin','admin','analyste'],
  'pages.html': ['super_admin','admin'],
  'campaigns.html': ['super_admin','admin'],
  'donations.html': ['super_admin','admin'],
  'ads.html': ['super_admin','admin'],
  'newsletter.html': ['super_admin','admin'],
  'security.html': ['super_admin','admin','editeur','moderateur','journaliste','analyste'],
  'journal.html': ['super_admin','admin']
};
function currentAdminRole() { return localStorage.getItem('admin_role') || ''; }
function pageAllowed(page, role) {
  var allowed = ROLE_PAGES[page] || [];
  return allowed.indexOf(role) !== -1;
}

// ===== CHECK AUTH =====
  if (document.querySelector('.admin-body') && !document.querySelector('.login-page')) {
    if (localStorage.getItem('admin_logged') !== 'true') {
      window.location.href = 'login.html';
      return;
    }
    var adminName = localStorage.getItem('admin_name') || '';
    var nameDisplay = document.getElementById('admin-name-display');
    if (nameDisplay && adminName) {
      nameDisplay.textContent = adminName;
      nameDisplay.style.display = 'inline';
    }
    document.getElementById('logout-btn')?.addEventListener('click', function (e) {
      e.preventDefault();
      var token = localStorage.getItem('admin_token');
      if (token && window.location.protocol !== 'file:') {
        fetch('/api/auth/logout', { method: 'POST', headers: { 'X-Admin-Token': token } }).catch(function () {});
      }
      localStorage.removeItem('admin_logged');
      localStorage.removeItem('admin_name');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_role');
      window.location.href = 'login.html';
    });

    // rafraichit nom + role depuis le serveur (reflete les changements de role)
    var curRole = currentAdminRole();
    if (useServer && adminName) {
      apiGet('/auth/status').then(function (st) {
        if (!st) return;
        localStorage.setItem('admin_name', st.name || '');
        localStorage.setItem('admin_role', st.role || '');
        var dsp = document.getElementById('admin-name-display');
        if (dsp && st.name) {
          dsp.textContent = st.name;
          dsp.style.display = 'inline';
        }
        applyRoleUi();
      });
    } else {
      applyRoleUi();
    }
    function applyRoleUi() {
      var role = currentAdminRole();
      var page = window.location.pathname.split('/').pop() || 'index.html';
      if (page === 'login.html') return;
      if (pageAllowed(page, role)) {
        var label = ROLE_LABELS[role] || role;
        var badge = document.createElement('span');
        badge.id = 'admin-role-badge';
        badge.textContent = label;
        badge.style.cssText = 'font-size:0.75rem;background:rgba(255,255,255,0.10);padding:2px 10px;border-radius:20px;';
        var nm = document.getElementById('admin-name-display');
        if (nm && !document.getElementById('admin-role-badge')) nm.insertAdjacentElement('afterend', badge);
      } else {
        // acces refuse : retour au tableau de bord ou deconnexion
        if (pageAllowed('index.html', role)) { window.location.href = 'index.html'; return; }
        forceLogin();
      }
      // filtre la sidebar : masque les liens inaccesibles + injecte Comptes & Journal
      var sidebar = document.querySelector('.admin-sidebar');
      if (sidebar) {        sidebar.querySelectorAll('a[href$=".html"]').forEach(function (a) {
          var href = a.getAttribute('href').split('/').pop();
          if (href === '../index.html') href = 'index.html';
          if (!pageAllowed(href, role)) a.style.display = 'none';
        });
        if (pageAllowed('journal.html', role) && !sidebar.querySelector('a[href="journal.html"]')) {
          var li = document.createElement('a');
          li.href = 'journal.html';
          li.textContent = '📜 Journal d\'activités';
          sidebar.insertBefore(li, sidebar.querySelector('a[href="security.html"]'));
        }
        if (pageAllowed('security.html', role) && !sidebar.querySelector('a[href="security.html#comptes"]')) {
          var li2 = document.createElement('a');
          li2.href = 'security.html#comptes';
          li2.textContent = '👥 Comptes & rôles';
          sidebar.insertBefore(li2, sidebar.querySelector('a[href="security.html"]'));
        }
      }
      // journaliste : pas de changement de statut (brouillon force par le serveur)
      if (role === 'journaliste') {
        var stSel = document.getElementById('art-status');
        if (stSel) { stSel.style.display = 'none'; }
        var schedWrap = document.getElementById('art-sched-wrap');
        if (schedWrap) { schedWrap.style.display = 'none'; }
        var authorEl = document.getElementById('art-author');
        if (authorEl) { authorEl.readOnly = true; }
      }
    }
  }

  // ===== EDITEUR : barre de formatage + apercu + mediathèque =====
    var editorContent = document.getElementById('art-content');
    if (editorContent) {
      // apercu
      var previewPane = document.getElementById('art-content-preview');
      var previewToggles = document.querySelectorAll('.editor-preview-toggle');
      previewToggles.forEach(function(btn){
        btn.addEventListener('click', function(){
          var show = previewPane.style.display === 'none';
          previewPane.style.display = show ? 'block' : 'none';
          editorContent.style.display = show ? 'none' : '';
          btn.textContent = show ? '✏️ Édition' : '👁️ Aperçu';
          if (show) previewPane.innerHTML = editorPreview(editorContent.value);
        });
      });
      editorContent.addEventListener('input', function(){
        if (previewPane.style.display !== 'none') previewPane.innerHTML = editorPreview(editorContent.value);
      });

      // boutons de la barre d'outils
      document.querySelectorAll('.editor-btn').forEach(function(btn){
        btn.addEventListener('click', function(){
          var wrap = btn.dataset.wrap, line = btn.dataset.line, prefix = btn.dataset.prefix, link = btn.dataset.link;
          if (wrap) {
            var s = editorContent.selectionStart, e = editorContent.selectionEnd;
            var sel = editorContent.value.slice(s, e) || 'texte';
            editorContent.value = editorContent.value.slice(0, s) + wrap + sel + wrap + editorContent.value.slice(e);
            editorContent.focus();
            editorContent.setSelectionRange(s + wrap.length, e + wrap.length + sel.length);
          } else if (line) {
            var cur = editorContent.value;
            var selStart = editorContent.selectionStart;
            var lineStart = cur.lastIndexOf('\n', selStart - 1) + 1;
            editorContent.value = cur.slice(0, lineStart) + line + cur.slice(lineStart);
            editorContent.selectionStart = editorContent.selectionEnd = lineStart + line.length;
            editorContent.focus();
          } else if (prefix) {
            var c = editorContent.value;
            var selSt = editorContent.selectionStart;
            var lnSt = c.lastIndexOf('\n', selSt - 1) + 1;
            editorContent.value = c.slice(0, lnSt) + prefix + c.slice(lnSt);
            editorContent.focus();
          } else if (link) {
            var url = prompt('Adresse du lien (https://...) :');
            if (!url) return;
            var s2 = editorContent.selectionStart, e2 = editorContent.selectionEnd;
            var txt = editorContent.value.slice(s2, e2) || 'texte du lien';
            var mark = '[' + txt + '](' + url + ')';
            editorContent.value = editorContent.value.slice(0, s2) + mark + editorContent.value.slice(e2);
            editorContent.focus();
          }
        });
      });

      window.editorInsertImage = function(url) {
        var s = editorContent.selectionStart, e = editorContent.selectionEnd;
        var mark = '\n![image](' + url + ')\n';
        editorContent.value = editorContent.value.slice(0, s) + mark + editorContent.value.slice(e);
        editorContent.focus();
      };

      // ---- Mediatheque intégrée ----
      var mediaPicker = document.getElementById('media-picker');
      var mediaGrid = document.getElementById('media-grid');
      var mediaSearch = document.getElementById('media-search');
      var mediaUploadInput = document.getElementById('media-upload-input');
      var editorMediaBtn = document.getElementById('editor-media-btn');
      window.loadedMediaPicker = function(){ mediaFilterAndDraw(); };
      function mediaFilterAndDraw() {
        apiGet('/media').then(function(media){
          if (!mediaGrid) return;
          var q = (mediaSearch ? mediaSearch.value : '').toLowerCase();
          var items = (media || []).filter(function(m){ return !q || (m.name || '').toLowerCase().indexOf(q) !== -1; });
          if (!items.length) { mediaGrid.innerHTML = '<div style="color:#999;font-size:0.85rem;grid-column:1/-1;">Aucune image. Utilisez « Importer » pour en ajouter.</div>'; return; }
          mediaGrid.innerHTML = items.map(function(m){
            return '<div style="border:1px solid #e0e0e0;border-radius:6px;overflow:hidden;background:#fafafa;">' +
              '<img src="' + m.url + '" alt="" style="width:100%;height:65px;object-fit:cover;cursor:pointer;" onclick="editorInsertImage(\'' + m.url + '\')">' +
              '<div style="padding:3px 6px;display:flex;justify-content:space-between;align-items:center;">' +
              '<span style="font-size:0.62rem;color:#888;max-width:64px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (m.name || '') + '</span>' +
              '<button onclick="deleteMediaItem(\'' + m.url + '\')" style="border:none;background:none;cursor:pointer;color:#c0392b;font-size:0.8rem;padding:0;">🗑</button>' +
              '</div></div>';
          }).join('');
        });
      }
      if (editorMediaBtn) editorMediaBtn.addEventListener('click', function(){
        if (!mediaPicker) return;
        var show = mediaPicker.style.display === 'none';
        mediaPicker.style.display = show ? 'block' : 'none';
        if (show) window.loadedMediaContent();
      });
      if (mediaSearch) mediaSearch.addEventListener('input', function(){
        clearTimeout(window._mpT);
        window._mpT = setTimeout(function(){ window.loadedMediaContent(); }, 300);
      });
      if (mediaUploadInput) mediaUploadInput.addEventListener('change', function(e){
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev){
          apiPost('/media', { image: ev.target.result }).then(function(res){
            if (res && res.url) { window.loadedMediaContent(); showToast('Image importée dans la médiathèque.'); }
            else showToast('Import impossible.', 'error');
          });
        };
        reader.readAsDataURL(file);
      });
      window.deleteMediaItem = function(url) {
        if (!confirm('Supprimer ce fichier de la médiathèque ?')) return;
        var name = url.split('/').pop();
        fetch('/api/media/' + encodeURIComponent(name), { method: 'DELETE', headers: authHeaders() }).then(function(r){
          if (r.status === 401) { forceLogin(); return; }
          if (r.ok) { window.loadedMediaContent(); showToast('Fichier supprimé.'); }
        });
      };
    }

  // ===== LOAD ARTICLES =====
  const articlesTable = document.getElementById('articles-table-body');
  if (articlesTable) {
    loadArticles();

    var adminName = localStorage.getItem('admin_name') || '';
    var authorField = document.getElementById('art-author');
    if (authorField && adminName) authorField.value = adminName;

    document.getElementById('new-article-btn')?.addEventListener('click', function () {
      document.getElementById('article-form-container').style.display = 'block';
      document.getElementById('article-form').reset();
      resetImageUpload();
      document.getElementById('form-title').textContent = 'Nouvel article';
      document.getElementById('article-id').value = '';
      var st = document.getElementById('art-status'); if (st) st.value = currentAdminRole() === 'journaliste' ? 'brouillon' : 'publie';
      window.toggleArticleStatusFields ? toggleArticleStatusFields() : null;
      if (authorField && adminName) authorField.value = adminName;
      window.scrollTo({ top: document.getElementById('article-form-container').offsetTop - 100, behavior: 'smooth' });
    });

    // Tabs de filtres par statut
    document.querySelectorAll('.art-filter-tab').forEach(function(tab){
      tab.addEventListener('click', function(){
        document.querySelectorAll('.art-filter-tab').forEach(function(t){ t.classList.remove('active'); });
        this.classList.add('active');
        currentFilter = this.dataset.filter || 'all';
        renderArticles();
      });
    });

    // Language tabs
    document.querySelectorAll('.lang-tab').forEach(function(tab){
      tab.addEventListener('click', function(){
        document.querySelectorAll('.lang-tab').forEach(function(t){ t.style.background = '#ddd'; t.style.color = '#333'; });
        this.style.background = 'var(--primary)'; this.style.color = '#fff';
        var lang = this.dataset.lang;
        document.querySelectorAll('.lang-field').forEach(function(f){ f.style.display = f.dataset.lang === lang ? '' : 'none'; });
        document.querySelectorAll('.lang-label').forEach(function(l){ l.textContent = '(' + (lang ? {_en:'English',_sw:'Kiswahili',_es:'Espa\u00f1ol'}[lang]||lang.substring(1) : 'Fran\u00e7ais') + ')'; });
      });
    });

    document.getElementById('cancel-article')?.addEventListener('click', function () {
      document.getElementById('article-form-container').style.display = 'none';
    });

    document.getElementById('art-image-input')?.addEventListener('change', function (e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (ev) {
        const preview = document.getElementById('img-preview');
        preview.src = ev.target.result;
        document.getElementById('img-upload-area').classList.add('has-image');
      };
      reader.readAsDataURL(file);
    });

    window.removeImage = function () {
      document.getElementById('art-image-input').value = '';
      resetImageUpload();
    };

    function resetImageUpload() {
      const area = document.getElementById('img-upload-area');
      if (area) area.classList.remove('has-image');
      const preview = document.getElementById('img-preview');
      if (preview) preview.src = '';
    }

    // Champ de programmation : affiché uniquement en statut "programme"
    window.toggleArticleStatusFields = function () {
      var st = (document.getElementById('art-status') || {}).value || 'publie';
      var wrap = document.getElementById('art-sched-wrap');
      if (wrap) wrap.style.display = (st === 'programme') ? 'block' : 'none';
    };
    var toggleArticleFieldEl = document.getElementById('art-status');
    if (toggleArticleFieldEl) toggleArticleFieldEl.addEventListener('change', window.toggleArticleStatusFields);

    document.getElementById('article-form')?.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = this.querySelector('button[type="submit"]');
      btn.disabled = true; btn.textContent = 'Enregistrement en cours...';
      const id = document.getElementById('article-id').value;
      const preview = document.getElementById('img-preview');
      var imageData = preview && preview.src ? preview.src : '';

      function saveArticle(imgUrl) {
        var status = (document.getElementById('art-status') || {}).value || 'publie';
        var schedEl = document.getElementById('art-scheduled-at');
        var scheduledAt = '';
        if (status === 'programme' && schedEl && schedEl.value) {
          scheduledAt = new Date(schedEl.value).getTime();
        }
        const article = {
          title: document.getElementById('art-title').value,
          category: document.getElementById('art-category').value,
          image: imgUrl || imageData,
          excerpt: document.getElementById('art-excerpt').value,
          content: document.getElementById('art-content').value,
          author: document.getElementById('art-author').value,
          priority: (document.getElementById('art-priority') || {}).value || 'normal',
          status: status,
          scheduledAt: scheduledAt,
          tags: (document.getElementById('art-tags') || {}).value ? document.getElementById('art-tags').value.split(',').map(function(t){return t.trim();}).filter(Boolean) : [],
          seoTitle: (document.getElementById('art-seo-title') || {}).value || '',
          seoDescription: (document.getElementById('art-seo-desc') || {}).value || '',
          videoUrl: (document.getElementById('art-video') || {}).value || '',
          gallery: (document.getElementById('art-gallery') || {}).value ? document.getElementById('art-gallery').value.split(/\r?\n/).map(function(l){return l.trim();}).filter(Boolean) : [],
          date: new Date().toISOString().split('T')[0]
        };
        // Include translations
        ['_en','_sw','_es'].forEach(function(sfx){
          var t = document.getElementById('art-title'+sfx); if (t && t.value) article['title'+sfx] = t.value;
          var e = document.getElementById('art-excerpt'+sfx); if (e && e.value) article['excerpt'+sfx] = e.value;
          var c = document.getElementById('art-content'+sfx); if (c && c.value) article['content'+sfx] = c.value;
        });
        if (id) article.id = Number(id);
        apiPost('/articles', article).then(function() { btn.disabled = false; btn.textContent = '💾 Enregistrer et publier'; loadArticles(); });
        if (!useServer) {
          let articles = JSON.parse(localStorage.getItem('admin_articles') || '[]');
          if (id) {
            const idx = articles.findIndex(a => a.id == id);
            if (idx >= 0) {
              const existing = articles[idx];
              if (!article.image) article.image = existing.image;
              articles[idx] = { ...existing, ...article };
            }
          } else {
            article.id = Date.now();
            article.featured = false;
            articles.unshift(article);
          }
          localStorage.setItem('admin_articles', JSON.stringify(articles));
        }
        document.getElementById('article-form-container').style.display = 'none';
        loadArticles();
        showToast(id ? 'Article modifié avec succès.' : 'Article enregistré !');
      }

      if (useServer && imageData.startsWith('data:')) {
        fetch('/api/upload', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image:imageData})})
          .then(function(r){return r.json()})
          .then(function(res){ saveArticle(res.url || imageData); })
          .catch(function(){ saveArticle(imageData); });
      } else {
        saveArticle(imageData);
      }
    });
  }

  var currentFilter = 'all';

  function loadArticles() {
    const tbody = document.getElementById('articles-table-body');
    if (!tbody) return;
    localStorage.removeItem('admin_articles');
    var load = useServer ? apiGet('/admin/articles') : null;
    if (load) {
      load.then(function(articles) {
        if (articles) {
          localStorage.setItem('admin_articles', JSON.stringify(articles));
          renderArticles();
        } else { renderFromLocal(); }
      });
    } else { renderFromLocal(); }
    function renderFromLocal() {
      var a = JSON.parse(localStorage.getItem('admin_articles') || '[]');
      allArticles = a;
      renderArticles();
    }
  }

  var allArticles = [];

  function renderArticles() {
    const tbody = document.getElementById('articles-table-body');
    if (!tbody) return;
    var stored = JSON.parse(localStorage.getItem('admin_articles') || '[]');
    if (stored.length) allArticles = stored;
    var articles = allArticles;
    var filter = currentFilter || 'all';
    var counts = { all: articles.length, publie: 0, brouillon: 0, programme: 0, corbeille: 0 };
    articles.forEach(function(a){
      var s = a.status || 'publie';
      if (counts[s] !== undefined) counts[s]++;
    });
    document.querySelectorAll('.art-filter-tab').forEach(function(tab){
      var k = tab.dataset.filter;
      var badge = tab.querySelector('.art-filter-count');
      if (badge) badge.textContent = counts[k] || 0;
    });
    var visible = filter === 'all' ? articles : articles.filter(function(a){ return (a.status || 'publie') === filter; });
    if (!visible || visible.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:#999;">Aucun article dans cette catégorie.</td></tr>';
      return;
    }
    var statusLabels = { publie: '✅ Publié', brouillon: '📝 Brouillon', programme: '⏰ Programmé', corbeille: '🗑️ Corbeille' };
    var isJournalist = currentAdminRole() === 'journaliste';
    tbody.innerHTML = visible.map(function(a) {
      var st = a.status || 'publie';
      var badge = '<span style="font-size:0.75rem;padding:2px 8px;border-radius:12px;background:' +
        (st === 'publie' ? '#e6f6e6;color:#2e7d32' : st === 'brouillon' ? '#fff3e0;color:#e65100' : st === 'programme' ? '#e3f2fd;color:#1565c0' : '#fbe9e7;color:#bf360c') + ';">' + (statusLabels[st] || st) + '</span>';
      var btns = '✏ <button class="btn btn-sm btn-outline" onclick="editArticle(' + a.id + ')" style="padding:4px 10px;font-size:0.8rem;">Modifier</button>';
      if (st === 'corbeille') {
        btns += ' <button class="btn btn-sm btn-outline" onclick="restoreArticle(' + a.id + ')" style="padding:4px 10px;font-size:0.8rem;color:#2e7d32;">♻️ Restaurer</button>' +
                ' <button class="btn btn-sm btn-secondary" onclick="deleteArticle(' + a.id + ')" style="padding:4px 10px;font-size:0.8rem;">🗑️ Suppr. définitivement</button>';
      } else {
        btns += ' <button class="btn btn-sm btn-outline" onclick="duplicateArticle(' + a.id + ')" style="padding:4px 10px;font-size:0.8rem;">📄 Dupliquer</button>';
        if (!isJournalist) {
          if (st !== 'publie') {
            btns += ' <button class="btn btn-sm btn-outline" onclick="publishArticle(' + a.id + ')" style="padding:4px 10px;font-size:0.8rem;color:#2e7d32;">✅ Publier</button>';
          } else {
            btns += ' <button class="btn btn-sm btn-outline" onclick="unpublishArticle(' + a.id + ')" style="padding:4px 10px;font-size:0.8rem;color:#e65100;">⏸️ Dépublier</button>';
          }
        }
        btns += ' <button class="btn btn-sm btn-secondary" onclick="trashArticle(' + a.id + ')" style="padding:4px 10px;font-size:0.8rem;">🗑️ Corbeille</button>';
      }
      var sch = '';
      if (st === 'programme' && a.scheduledAt) {
        var d = new Date(a.scheduledAt);
        sch = '<div style="font-size:0.72rem;color:#1565c0;margin-top:2px;">📅 ' + d.toLocaleString('fr-FR') + '</div>';
      }
      return '<tr><td>' + a.id + '</td><td><strong>' + a.title + '</strong>' + sch + '</td><td>' + (a.category || '') + '</td><td>' + (a.date || '') + '</td><td>' + badge + '</td><td>' + btns + '</td></tr>';
    }).join('');
  }

  window.editArticle = function (id) {
    let articles = JSON.parse(localStorage.getItem('admin_articles') || '[]');
    if (!articles.length) articles = allArticles;
    const article = articles.find(a => a.id === id);
    if (!article) return;
    document.getElementById('article-form-container').style.display = 'block';
    document.getElementById('form-title').textContent = 'Modifier l\'article';
    document.getElementById('article-id').value = id;
    document.getElementById('art-title').value = article.title;
    document.getElementById('art-category').value = article.category;
    document.getElementById('art-excerpt').value = article.excerpt;
    document.getElementById('art-content').value = article.content;
    document.getElementById('art-author').value = article.author;
    var prioEl = document.getElementById('art-priority');
    if (prioEl) prioEl.value = ['breaking','important','normal'].indexOf(article.priority) !== -1 ? article.priority : 'normal';
    var stEl = document.getElementById('art-status');
    if (stEl) stEl.value = ['publie','brouillon','programme','corbeille'].indexOf(article.status) !== -1 ? article.status : 'publie';
    var schEl = document.getElementById('art-scheduled-at');
    if (schEl) {
      schEl.value = article.scheduledAt ? new Date(Number(article.scheduledAt)).toISOString().slice(0,16) : '';
    }
    window.toggleArticleStatusFields ? toggleArticleStatusFields() : null;
    var tagsEl = document.getElementById('art-tags'); if (tagsEl) tagsEl.value = (article.tags || []).join(', ');
    var seoT = document.getElementById('art-seo-title'); if (seoT) seoT.value = article.seoTitle || '';
    var seoD = document.getElementById('art-seo-desc'); if (seoD) seoD.value = article.seoDescription || '';
    var vid = document.getElementById('art-video'); if (vid) vid.value = article.videoUrl || '';
    var gal = document.getElementById('art-gallery'); if (gal) gal.value = (article.gallery || []).join('\n');
    // Load translations
    ['_en','_sw','_es'].forEach(function(sfx){
      var t = document.getElementById('art-title'+sfx); if (t) t.value = article['title'+sfx] || '';
      var e = document.getElementById('art-excerpt'+sfx); if (e) e.value = article['excerpt'+sfx] || '';
      var c = document.getElementById('art-content'+sfx); if (c) c.value = article['content'+sfx] || '';
    });
    if (article.image) {
      const preview = document.getElementById('img-preview');
      preview.src = article.image;
      document.getElementById('img-upload-area').classList.add('has-image');
      if (!article.image.startsWith('data:') && article.image.startsWith('/')) {
        preview.style.display = 'block';
      }
    }
    window.scrollTo({ top: document.getElementById('article-form-container').offsetTop - 100, behavior: 'smooth' });
  };

  // Actions rapides sur les articles
  function postArticleAction(path, id, msg) {
    if (useServer) {
      apiPost(path + id, {}).then(function(res){
        if (res) { loadArticles(); showToast(msg); }
        else showToast('Action impossible.', 'error');
      });
    } else {
      reduceLocalArticle(id, function(a){});
      loadArticles(); showToast(msg);
    }
  }
  function reduceLocalArticle(id, fn2) {
    let arts = JSON.parse(localStorage.getItem('admin_articles') || '[]');
    const a = arts.find(x => x.id === id);
    if (a) fn2(a);
    localStorage.setItem('admin_articles', JSON.stringify(arts));
  }
  function setLocalStatus(id, status) {
    let arts = JSON.parse(localStorage.getItem('admin_articles') || '[]');
    arts.forEach(function(a){ if (a.id === id) { a.status = status; a.scheduledAt = ''; } });
    localStorage.setItem('admin_articles', JSON.stringify(arts));
    loadArticles();
  }
  window.trashArticle = function (id) {
    if (!confirm('Mettre cet article à la corbeille ?')) return;
    if (useServer) postArticleAction('/articles/' + id + '/trash', id, 'Article mis à la corbeille.');
    else setLocalStatus(id, 'corbeille');
  };
  window.restoreArticle = function (id) {
    if (useServer) postArticleAction('/articles/' + id + '/restore', id, 'Article restauré.');
    else setLocalStatus(id, 'publie');
  };
  window.publishArticle = function (id) {
    if (useServer) postArticleAction('/articles/' + id + '/publish', id, 'Article publié !');
    else setLocalStatus(id, 'publie');
  };
  window.unpublishArticle = function (id) {
    if (useServer) {
      apiGet('/admin/articles').then(function(arts){
        var a = (arts || []).find(function(x){ return x.id === id; });
        if (a && useServer) {
          a.status = 'brouillon'; a.scheduledAt = '';
          apiPost('/articles/' + id, a).then(function(){ loadArticles(); showToast('Article dépublié.'); });
        }
      });
    } else setLocalStatus(id, 'brouillon');
  };
  window.duplicateArticle = function (id) {
    if (useServer) {
      apiPost('/articles/' + id + '/duplicate', {}).then(function(res){
        if (res && res.ok) { loadArticles(); showToast('Copie créée en brouillon.'); }
        else showToast('Impossible de dupliquer.', 'error');
      });
    } else {
      let arts = JSON.parse(localStorage.getItem('admin_articles') || '[]');
      const src = arts.find(x => x.id === id);
      if (src) {
        var cp = Object.assign({}, src);
        cp.id = Date.now(); cp.title = (src.title || 'Article') + ' (copie)';
        cp.status = 'brouillon'; cp.scheduledAt = ''; cp.featured = false;
        arts.push(cp); localStorage.setItem('admin_articles', JSON.stringify(arts));
        loadArticles(); showToast('Copie créée en brouillon.');
      }
    }
  };

  window.deleteArticle = function (id) {
    if (!confirm('Supprimer cet article définitivement ? Cette action est irréversible.')) return;
    apiDel('/articles/' + id);
    if (!useServer) {
      let articles = JSON.parse(localStorage.getItem('admin_articles') || '[]');
      articles = articles.filter(a => a.id !== id);
      localStorage.setItem('admin_articles', JSON.stringify(articles));
    }
    loadArticles();
    showToast('Article supprimé définitivement.');
  };

  // ===== COMMENTS MODERATION =====
  const commentsTable = document.getElementById('comments-table-body');
  if (commentsTable) {
    loadPendingComments();
  }

  function loadAllComments() {
    if (useServer) {
      return apiGet('/articles').then(function(arts) {
        if (!arts) return loadLocalComments();
        var promises = arts.map(function(a) {
          return apiGet('/comments/' + a.id).then(function(cs) {
            if (cs) cs.forEach(function(c){c.articleId=a.id;});
            return cs || [];
          });
        });
        return Promise.all(promises).then(function(results) {
          var all = [];
          results.forEach(function(arr){arr.forEach(function(c){all.push(c);});});
          all.sort(function(a,b){return b.id - a.id;});
          return all;
        });
      });
    }
    return Promise.resolve(loadLocalComments());
  }

  function loadLocalComments() {
    var all = [];
    Object.keys(localStorage).filter(function(k){return k.startsWith('comments_');}).forEach(function(key){
      var aid = key.replace('comments_', '');
      JSON.parse(localStorage.getItem(key) || '[]').forEach(function(c){c.articleId = aid; all.push(c);});
    });
    all.sort(function(a,b){return b.id - a.id;});
    return all;
  }

  function loadPendingComments() {
    loadAllComments().then(function(allComments) {
      var tbody = document.getElementById('comments-table-body');
      if (!tbody) return;
      if (!allComments || allComments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px;color:#999;">Aucun commentaire pour le moment.</td></tr>';
        return;
      }
      tbody.innerHTML = allComments.map(function(c) {
        var row = '';
        var badge = '';
        if (c.pending) { row = ' style="background:#fff8e1;"'; badge = '<span style="font-size:0.7rem;color:#b8860b;font-weight:700;">EN ATTENTE</span> '; }
        else if (c.status === 'hidden') { row = ' style="opacity:0.55;"'; badge = '<span style="font-size:0.7rem;color:#999;font-weight:700;">MASQUÉ</span> '; }
        if (c.flagged) badge += '<span style="font-size:0.7rem;color:var(--secondary);font-weight:700;">🚩 SIGNALÉ' + (c.flag_reason ? ' : ' + c.flag_reason : '') + '</span> ';
        var actions = '';
        if (c.pending) {
          actions = '<button class="btn btn-sm btn-primary" onclick="approveComment(' + c.articleId + ',' + c.id + ')" style="padding:4px 10px;font-size:0.8rem;">✓ Approuver</button> <button class="btn btn-sm btn-secondary" onclick="rejectComment(' + c.articleId + ',' + c.id + ')" style="padding:4px 10px;font-size:0.8rem;">✕ Rejeter</button>';
        } else {
          actions = '<button class="btn btn-sm btn-outline" onclick="setCommentStatus(' + c.articleId + ',' + c.id + ',' + (c.status === 'hidden' ? "'visible'" : "'hidden'") + ')" style="padding:4px 10px;font-size:0.8rem;">' + (c.status === 'hidden' ? '👁 Afficher' : '🙈 Masquer') + '</button> ';
        }
        actions += '<button class="btn btn-sm btn-outline" onclick="blockCommentUser(' + c.articleId + ',' + c.id + ')" style="padding:4px 10px;font-size:0.8rem;">🚫 Bloquer</button>';
        actions += ' <button class="btn btn-sm btn-secondary" onclick="rejectComment(' + c.articleId + ',' + c.id + ')" style="padding:4px 10px;font-size:0.8rem;">🗑</button>';
        return '<tr' + row + '><td>' + esc(c.name) + '</td><td>' + badge + esc(c.text.substring(0, 60)) + (c.text.length > 60 ? '...' : '') + '</td><td>' + esc(c.date) + '</td><td>Article #' + c.articleId + '</td><td>' + actions + '</td></tr>';
      }).join('');
    });
  }

  window.approveComment = function (articleId, commentId) {
    if (useServer) apiPost('/comments/' + articleId + '/' + commentId + '/approve', {});
    const comments = JSON.parse(localStorage.getItem('comments_' + articleId) || '[]');
    const idx = comments.findIndex(c => c.id === commentId);
    if (idx >= 0) { comments[idx].pending = false; }
    localStorage.setItem('comments_' + articleId, JSON.stringify(comments));
    loadPendingComments();
    showToast('Commentaire approuvé.');
  };

  window.rejectComment = function (articleId, commentId) {
    if (!confirm('Rejeter ce commentaire ?')) return;
    if (useServer) apiDel('/comments/' + articleId + '/' + commentId);
    let comments = JSON.parse(localStorage.getItem('comments_' + articleId) || '[]');
    comments = comments.filter(c => c.id !== commentId);
    localStorage.setItem('comments_' + articleId, JSON.stringify(comments));
    loadPendingComments();
    showToast('Commentaire rejeté.');
  };

  window.setCommentStatus = function (articleId, commentId, status) {
    if (useServer) apiPost('/comments/' + articleId + '/' + commentId + '/status', { status: status });
    const comments = JSON.parse(localStorage.getItem('comments_' + articleId) || '[]');
    const c = comments.find(c => c.id === commentId);
    if (c) { c.status = status; c.pending = false; }
    localStorage.setItem('comments_' + articleId, JSON.stringify(comments));
    loadPendingComments();
    showToast(status === 'hidden' ? 'Commentaire masqué.' : 'Commentaire affiché.');
  };

  window.blockCommentUser = function (articleId, commentId) {
    const comments = JSON.parse(localStorage.getItem('comments_' + articleId) || '[]');
    const c = comments.find(c => c.id === commentId);
    const name = c ? c.name : '';
    if (!name) return;
    if (!confirm('Bloquer « ' + name + ' » ? Ses commentaires seront refusés.')) return;
    if (useServer) apiPost('/blocked', { name: name }).then(function (r) {
      if (r && r.ok) showToast('Utilisateur bloqué : ' + name);
    });
    loadPendingComments();
  };

  // ===== BREAKING NEWS SETTINGS (dashboard) =====
  var bnsEnabled = document.getElementById('bns-enabled');
  if (bnsEnabled) {
    (function () {
      var sel = document.getElementById('bns-article');
      var saveBtn = document.getElementById('bns-save');
      var statusEl = document.getElementById('bns-status');
      apiGet('/articles').then(function (arts) {
        if (!arts) return;
        arts.forEach(function (a) {
          var opt = document.createElement('option');
          opt.value = a.id;
          var p = a.priority === 'breaking' ? ' 🔴 ' : (a.priority === 'important' ? ' ⭐ ' : '');
          opt.textContent = p + (a.title || 'Sans titre').substring(0, 60);
          sel.appendChild(opt);
        });
        apiGet('/settings').then(function (s) {
          if (s) {
            bnsEnabled.checked = !!s.breaking_news_enabled;
            if (s.breaking_article_id) sel.value = String(s.breaking_article_id);
          }
        }).catch(function () {});
      }).catch(function () {});
      saveBtn.addEventListener('click', function () {
        var payload = {
          breaking_news_enabled: bnsEnabled.checked,
          breaking_article_id: sel.value ? Number(sel.value) : null
        };
        var done = function () { statusEl.textContent = '✅ Réglages enregistrés.'; setTimeout(function () { statusEl.textContent = ''; }, 3000); };
        if (useServer) apiPost('/settings', payload).then(done).catch(function () {});
        else done();
      });
    })();
  }

  // ===== DASHBOARD PRO =====
  window.Dash = {
    fmt: function (n) { return n.toLocaleString('fr-FR'); },
    secs: function (s) {
      s = s || 0;
      if (s < 60) return Math.round(s) + ' s';
      if (s < 3600) return (s / 60).toFixed(1).replace('.', ',') + ' min';
      return (s / 3600).toFixed(1).replace('.', ',') + ' h';
    },
    bars: function (items, color) {
      if (!items || !items.length) return '<div class="dash-empty">Aucune donnée.</div>';
      var max = 1;
      items.forEach(function (it) { if (it.v > max) max = it.v; });
      return items.map(function (it) {
        var w = Math.max(2, Math.round(it.v / max * 100));
        return '<div class="progress-row"><span class="p-label" title="' + it.n + '">' + it.n + '</span>' +
          '<div class="progress-track"><div class="progress-fill" style="width:' + w + '%;background:' + color + ';"></div></div>' +
          '<span class="progress-val">' + it.v + '</span></div>';
      }).join('');
    },
    line: function (canvas, series, palette) {
      if (!canvas) return;
      var dpr = window.devicePixelRatio || 1;
      var w = canvas.clientWidth || 600;
      var h = 240;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.height = h + 'px';
      var ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);
      var padL = 36, padR = 10, padT = 12, padB = 24;
      var plotW = w - padL - padR, plotH = h - padT - padB;
      var n = series[0] ? series[0].data.length : 0;
      if (!n) {
        ctx.fillStyle = '#8b949e'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Aucune visite sur cette période.', w / 2, h / 2);
        return;
      }
      var max = 1;
      series.forEach(function (s) {
        s.data.forEach(function (v) { if (v > max) max = v; });
      });
      max = Math.ceil(max * 1.15);
      ctx.strokeStyle = '#21262d'; ctx.fillStyle = '#8b949e'; ctx.font = '10px sans-serif'; ctx.textAlign = 'right';
      for (var i = 0; i <= 4; i++) {
        var y = padT + plotH - (plotH * i / 4);
        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
        ctx.fillText(Math.round(max * i / 4), padL - 6, y + 3);
      }
      ctx.textAlign = 'center';
      var step = Math.max(1, Math.ceil(n / 12));
      for (var li = 0; li < n; li += step) {
        ctx.fillText(series[0].labels[li], padL + plotW * li / (n - 1), h - 7);
      }
      function xAt(k) { return padL + plotW * k / (n - 1); }
      function yAt(v) { return padT + plotH - (v / max) * plotH; }
      series.forEach(function (s, si) {
        var color = s.color || palette[si % palette.length];
        ctx.beginPath();
        s.data.forEach(function (v, k) {
          if (k === 0) ctx.moveTo(xAt(k), yAt(v)); else ctx.lineTo(xAt(k), yAt(v));
        });
        if (si === 0) {
          ctx.lineTo(xAt(n - 1), padT + plotH); ctx.lineTo(xAt(0), padT + plotH); ctx.closePath();
          ctx.fillStyle = 'rgba(88,166,255,0.08)'; ctx.fill();
          ctx.beginPath();
          s.data.forEach(function (v, k) {
            if (k === 0) ctx.moveTo(xAt(k), yAt(v)); else ctx.lineTo(xAt(k), yAt(v));
          });
        }
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineJoin = 'round';
        ctx.stroke();
        s.data.forEach(function (v, k) {
          ctx.beginPath();
          ctx.arc(xAt(k), yAt(v), 2.2, 0, Math.PI * 2);
          ctx.fillStyle = color; ctx.fill();
        });
      });
      var tip = canvas._tip;
      if (tip) { ctx.fillStyle = tip.line + '33'; ctx.fillRect(tip.x, padT, 1.5, plotH); }
      canvas._draw = function (ev) {
        var rect = canvas.getBoundingClientRect();
        var mx = ev.clientX - rect.left;
        var min = 1e9, k = -1;
        for (var i2 = 0; i2 < n; i2++) {
          var d = Math.abs(xAt(i2) - mx);
          if (d < min) { min = d; k = i2; }
        }
        canvas._tip = { x: xAt(k), width: 14 };
        var t = document.getElementById('db-line-tip');
        var txt = series[0].labels[k] + ' — ' + series.map(function (s) { return s.name + ' : ' + s.data[k]; }).join(' · ');
        if (!t) {
          t = document.createElement('div');
          t.id = 'db-line-tip';
          t.style.cssText = 'position:absolute;background:#0d1117;border:1px solid #30363d;color:#c9d1d9;padding:4px 9px;border-radius:6px;font-size:0.75rem;pointer-events:none;z-index:5;';
          canvas.parentNode.appendChild(t);
        }
        t.textContent = txt;
        t.style.left = Math.min(rect.width - 180, mx + 8) + 'px';
        t.style.top = '8px';
        t.style.display = 'block';
        window.Dash.line(canvas, series, palette);
      };
      canvas.addEventListener('mousemove', canvas._draw);
      if (!canvas._cl) {
        canvas._cl = true;
        canvas.addEventListener('mouseleave', function () {
          canvas._tip = null;
          var t = document.getElementById('db-line-tip');
          if (t) t.style.display = 'none';
          window.Dash.line(canvas, series, palette);
        });
      }
    },
    doughnut: function (canvas, items, centerText) {
      if (!canvas) return;
      var dpr = window.devicePixelRatio || 1;
      var w = canvas.clientWidth || 220;
      var h = 230;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.height = h + 'px';
      var ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);
      var cx = w / 2, cy = h / 2, r = Math.min(h / 2 - 8, 95), th = 22;
      var total = 0;
      items.forEach(function (it) { total += it.v || 0; });
      if (!total) {
        ctx.fillStyle = '#8b949e'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Aucune donnée', cx, cy);
        return;
      }
      var colors = ['#58a6ff', '#3fb950', '#f0883e', '#d2a8ff', '#f778ba', '#39c5cf', '#e3b341', '#f85149'];
      var start = -Math.PI / 2;
      var legend = '';
      items.forEach(function (it, i) {
        var angle = (it.v / total) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r, start, start + angle);
        ctx.arc(cx, cy, r - th, start + angle, start, true);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        legend += '<div style="display:flex;align-items:center;gap:7px;font-size:0.78rem;color:#c9d1d9;"><span style="width:10px;height:10px;border-radius:3px;background:' + colors[i % colors.length] + ';display:inline-block;"></span>' + it.n + ' <b style="color:#8b949e;margin-left:auto;">' + it.v + '</b></div>';
        start += angle;
      });
      ctx.fillStyle = '#c9d1d9'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(centerText, cx, cy - 2);
      ctx.fillStyle = '#8b949e'; ctx.font = '10px sans-serif';
      ctx.fillText('visites', cx, cy + 14);
      var lg = canvas.parentNode.querySelector('.dash-legend');
      if (lg) lg.innerHTML = legend;
    }
  };
  window.Dash.doughnutLegend = true;

  function initDashboard() {
    var els = {
      visits: document.getElementById('db-visits'),
      uniques: document.getElementById('db-uniques'),
      readers: document.getElementById('db-readers'),
      readsec: document.getElementById('db-readsec'),
      readsub: document.getElementById('db-readsub'),
      avgread: document.getElementById('db-avg-read'),
      articles: document.getElementById('db-articles'),
      comments: document.getElementById('db-comments'),
      shares: document.getElementById('db-shares'),
      subs: document.getElementById('db-subs'),
      donations: document.getElementById('db-donations'),
      sub: document.getElementById('db-visits-sub'),
      top: document.getElementById('db-top-body'),
      topHint: document.getElementById('db-top-hint'),
      topSearch: document.getElementById('db-top-search'),
      chart: document.getElementById('db-line-chart'),
      cat: document.getElementById('db-cat-chart'),
      devs: document.getElementById('db-devices'),
      bowsers: document.getElementById('db-browsers'),
      sources: document.getElementById('db-sources'),
      countries: document.getElementById('db-countries')
    };
    if (!els.visits) return;
    var period = '30d';
    var periodLabel = { '7d': '7 derniers jours', '30d': '30 derniers jours', '90d': '90 derniers jours', '12m': '12 derniers mois' };
    var tabs = document.querySelectorAll('#db-period-tabs .dash-tab');
    tabs.forEach(function (b) {
      b.addEventListener('click', function () {
        tabs.forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        period = b.dataset.period;
        load();
      });
    });
    var trendEls = {
      visits: document.getElementById('db-visits-trend'),
      uniques: document.getElementById('db-uniques-trend'),
      readers: document.getElementById('db-readers-trend'),
      comments: document.getElementById('db-comments-trend'),
      shares: document.getElementById('db-shares-trend'),
      donations: document.getElementById('db-donations-trend')
    };
    function load() {
      apiGet('/analytics/overview?period=' + period).then(render).catch(function () {
        els.visits.textContent = '—';
        els.chart && els.chart.getContext && Dash.line(els.chart, [], []);
      });
    }
    function trendBadge(tr) {
      if (!tr) return '';
      var cls = tr.flat ? 'trend-flat' : (tr.up ? 'trend-up' : 'trend-down');
      var arrow = tr.flat ? '→' : (tr.up ? '↑' : '↓');
      var txt = tr.pct == null ? (tr.delta > 0 ? '+' + Dash.fmt(tr.delta) : Dash.fmt(tr.delta)) : ((tr.pct > 0 ? '+' : '') + tr.pct + ' %');
      return '<span class="trend-badge ' + cls + '">' + arrow + ' ' + txt + '</span>';
    }
    function renderTrends(d) {
      var t = d.trends || {};
      Object.keys(trendEls).forEach(function (k) {
        var el = trendEls[k];
        if (el) el.innerHTML = trendBadge(t[k]);
      });
    }
    function render(d) {
      if (!d) {
        ['visits','uniques','readers','readsec','articles','comments','shares','subs','donations'].forEach(function (k) {
          var el = els[k];
          if (el) el.textContent = '—';
        });
        if (els.chart && els.chart.getContext) Dash.line(els.chart, [], []);
        return;
      }
      var t = d.totals || {};
      els.visits.textContent = Dash.fmt(t.visits || 0);
      els.sub.textContent = periodLabel[period] || '';
      els.uniques.textContent = Dash.fmt(t.uniques || 0);
      els.readers.textContent = Dash.fmt(t.readers || 0);
      els.readsec.textContent = Dash.secs(t.readSeconds || 0);
      els.readsub.textContent = 'moy. ' + Dash.secs(t.avgReadSec || 0) + '/lecteur';
      els.articles.textContent = Dash.fmt(t.articles || 0);
      els.comments.textContent = Dash.fmt(t.comments || 0);
      els.shares.textContent = Dash.fmt(t.shares || 0);
      els.subs.textContent = Dash.fmt(t.subs || 0);
      if (els.donations) els.donations.textContent = Dash.fmt(t.donations || 0);
      els.topHint.textContent = '(' + periodLabel[period] + ')';
      var s = d.series || {};
      var hasData = (s.visits || []).some(function (v) { return v > 0; });
      Dash.line(els.chart, [
        { labels: s.labels || [], data: s.visits || [], name: 'Visites', color: '#58a6ff' },
        { labels: s.labels || [], data: s.uniques || [], name: 'Uniques', color: '#3fb950' }
      ], ['#58a6ff', '#3fb950']);
      renderTop(d.topArticles || []);
      renderTrends(d);
      var cats = (d.topCategories || []).map(function (c) { return { n: c.category, v: c.visits }; });
      var total = cats.reduce(function (a, b) { return a + b.v; }, 0);
      Dash.doughnut(els.cat, cats, total);
      var colors = ['#58a6ff', '#3fb950'];
      els.devs.innerHTML = Dash.bars((d.devices || []).map(function (x) { return { n: x.name, v: x.count }; }), colors[0]);
      els.bowsers.innerHTML = Dash.bars((d.browsers || []).map(function (x) { return { n: x.name, v: x.count }; }), colors[1]);
      els.sources.innerHTML = Dash.bars((d.sources || []).map(function (x) { return { n: x.name, v: x.count }; }), '#f0883e');
      els.countries.innerHTML = Dash.bars((d.countries || []).map(function (x) { return { n: x.country, v: x.visits }; }), '#a371f7');
      var r = document.getElementById('db-refresh-time');
      if (r) r.textContent = 'Actualisé à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    var lastTop = [];
    function renderTop(arts) {
      lastTop = arts || [];
      applyTopFilter(els.topSearch ? els.topSearch.value.toLowerCase() : '');
    }
    function applyTopFilter(q) {
      if (!els.top) return;
      var list = q ? lastTop.filter(function (a) {
        return (a.title || '').toLowerCase().indexOf(q) !== -1 || (a.category || '').toLowerCase().indexOf(q) !== -1;
      }) : lastTop;
      els.top.innerHTML = list.length ? list.map(function (a) {
        return '<tr><td><strong>' + a.title + '</strong><br><span style="color:#8b949e;font-size:0.75rem;">' + a.category + '</span></td>' +
          '<td>' + Dash.fmt(a.visits) + '</td><td>' + Dash.fmt(a.uniques) + '</td>' +
          '<td>' + Dash.fmt(a.readers) + ' <span style="color:#8b949e;font-size:0.72rem;">(' + Dash.secs(a.avgReadSec) + ')</span></td>' +
          '<td>' + Dash.fmt(a.shares) + '</td></tr>';
      }).join('') : '<tr><td colspan="5" class="dash-empty" style="text-align:center;">' +
        (q ? 'Aucun article ne correspond à la recherche.' : 'Aucune visite d\'article.') + '</td></tr>';
    }
    if (els.topSearch) {
      els.topSearch.addEventListener('input', function () { applyTopFilter(els.topSearch.value.toLowerCase()); });
    }
    load();
    // Données en temps réel : rafraîchissement silencieux toutes les 60 s
    var live = document.getElementById('db-live');
    setInterval(function () {
      if (document.hidden) return;
      load();
      if (live) {
        live.classList.remove('live-flash');
        void live.offsetWidth;
        live.classList.add('live-flash');
      }
    }, 60000);
  }
  initDashboard();

  // ===== CLOCHES NOTIFICATIONS ADMIN (toutes les pages admin) =====
  function initAdminNotifications() {
    var header = document.querySelector('.admin-header .container');
    if (!header) return;
    var logged = localStorage.getItem('admin_logged') === 'true';
    if (!logged) return;
    var wrap = document.createElement('div');
    wrap.className = 'admin-bell';
    wrap.innerHTML =
      '<button type="button" class="bell-btn" id="admin-bell-btn" aria-label="Notifications">' +
        '<span class="bell-icon">🔔</span><span class="bell-badge" id="admin-bell-badge" style="display:none;">0</span>' +
      '</button>' +
      '<div class="bell-drop" id="admin-bell-drop" hidden>' +
        '<div class="bell-head"><strong>Notifications</strong>' +
          '<button type="button" id="bell-read-all" class="bell-readall">Tout marquer lu</button></div>' +
        '<ul class="bell-list" id="admin-bell-list"><li class="bell-empty">Chargement…</li></ul>' +
      '</div>';
    header.appendChild(wrap);
    var dropdown = wrap.querySelector('#admin-bell-drop');
    var badge = wrap.querySelector('#admin-bell-badge');
    var list = wrap.querySelector('#admin-bell-list');
    var bellBtn = wrap.querySelector('#admin-bell-btn');
    function fmtWhen(ts) {
      var secs = Math.round((Date.now() / 1000) - (ts || 0));
      if (secs < 60) return 'à l\'instant';
      if (secs < 3600) return 'il y a ' + Math.floor(secs / 60) + ' min';
      if (secs < 86400) return 'il y a ' + Math.floor(secs / 3600) + ' h';
      return 'il y a ' + Math.floor(secs / 86400) + ' j';
    }
    function esc(s) {
      return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function refresh() {
      apiGet('/admin/notifications').then(function (d) {
        if (!d || !d.items) return;
        var unread = d.unread || 0;
        badge.textContent = unread;
        badge.style.display = unread > 0 ? 'block' : 'none';
        if (!d.items.length) {
          list.innerHTML = '<li class="bell-empty">Aucune notification.</li>';
          return;
        }
        list.innerHTML = d.items.map(function (n) {
          var icons = { commentaire: '💬', don: '💰', paiement_ok: '✅', paiement_ko: '⚠️', abonne: '👥', top_article: '🔥', probleme: '🛠️' };
          var body = '<li class="bell-item' + (n.read ? ' read' : '') + '" data-id="' + (n.id || '') + '">' +
            '<div class="bell-item-head"><span class="bell-item-ico">' + (icons[n.kind] || '🔔') + '</span>' +
            '<strong>' + esc(n.title) + '</strong>' + (n.read ? '' : '<span class="bell-new"></span>') + '</div>' +
            '<div class="bell-item-msg">' + esc(n.message) + '</div>' +
            '<div class="bell-item-meta"><span>' + fmtWhen(n.ts) + '</span>' +
            (n.link ? '<a href="' + esc(n.link) + '">Ouvrir</a>' : '') + '</div></li>';
          return body;
        }).join('');
      });
    }
    bellBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (dropdown.hidden) {
        dropdown.hidden = false;
        refresh();
      } else {
        dropdown.hidden = true;
      }
    });
    wrap.querySelector('#bell-read-all').addEventListener('click', function (e) {
      e.stopPropagation();
      apiPost('/admin/notifications/read', {}).then(function () { refresh(); });
    });
    list.addEventListener('click', function (e) {
      var item = e.target.closest('.bell-item');
      if (!item) return;
      var id = item.dataset.id;
      if (id) apiPost('/admin/notifications/read', { ids: [Number(id)] }).then(function () { refresh(); });
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.admin-bell')) dropdown.hidden = true;
    });
    refresh();
    setInterval(refresh, 45000);
  }
  initAdminNotifications();

  // ===== VISIT TRACKER (public pages) =====
  if (!document.querySelector('.admin-body')) {
    trackVisit();
  }

  function trackVisit() {
    // Respect du consentement : suivi UNIQUEMENT si l'utilisateur a cliqué « Tout accepter »
    if (!(window.Consent && window.Consent.allowed())) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var articleId = params.get('id') || '';
    var path = window.location.pathname.replace('/index.html','/') || '/';
    var data = {date:new Date().toISOString(), path:path, articleId:articleId, ref:(document.referrer||'').slice(0,300)};
    if (window.location.protocol !== 'file:') {
      fetch('/api/visits', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).catch(function(){});
    }
    var visits = JSON.parse(localStorage.getItem('visit_stats') || '[]');
    visits.push(data);
    if (visits.length > 10000) visits.splice(0, visits.length - 10000);
    localStorage.setItem('visit_stats', JSON.stringify(visits));
  }
});
