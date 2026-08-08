document.addEventListener('DOMContentLoaded', function () {

  // ===== LOGIN (authentification securisee : token serveur + 2FA) =====
  const ADMINS = { 'Shine2026':'YAGIRWA GEDEON GUIDE', 'Lufumica2026':'LUFUNGULO MICHAEL', 'Sergio2026':'SERGE IRENGE', 'Christvie2026':'MUKESHABA JAMES MPALA' };
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    const totpWrap = document.getElementById('totp-wrap');
    const totpInput = document.getElementById('totp-code');
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const payload = { user: username, pass: password };
      if (totpInput && totpInput.value) payload.totp = totpInput.value;
      function grant(res) {
        localStorage.setItem('admin_logged', 'true');
        localStorage.setItem('admin_name', res.name || '');
        localStorage.setItem('admin_token', res.token || '');
        window.location.href = 'index.html';
      }
      if (window.location.protocol !== 'file:') {
        fetch('/api/auth', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
          .then(function(r){ return r.json().then(function(b){ return {status:r.status, body:b}; }); })
          .then(function(res){
            if (res.body && res.body.ok && res.body.token) { grant(res.body); return; }
            if (res.body && res.body.totp) {
              if (totpWrap) {
                totpWrap.style.display = 'block';
                if (totpInput) totpInput.focus();
                showToast('Entrez votre code de securite 2FA.', 'error');
              }
              return;
            }
            if (res.status === 429) { showToast('Trop de tentatives. Reessayez dans quelques minutes.', 'error'); return; }
            showToast('Identifiants incorrects.', 'error');
          })
          .catch(function(){ showToast('Serveur injoignable. Vérifiez la connexion.', 'error'); });
      } else if (username === 'admin' && Object.prototype.hasOwnProperty.call(ADMINS, password)) {
        grant({ name: ADMINS[password], token: password });
      } else {
        showToast('Identifiants incorrects.', 'error');
      }
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
function forceLogin() {
  if (window.location.protocol === 'file:' || localStorage.getItem('admin_redirecting')) return;
  localStorage.setItem('admin_redirecting', '1');
  localStorage.removeItem('admin_logged');
  localStorage.removeItem('admin_name');
  localStorage.removeItem('admin_token');
  window.location.href = 'login.html';
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
      window.location.href = 'login.html';
    });
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
      if (authorField && adminName) authorField.value = adminName;
      window.scrollTo({ top: document.getElementById('article-form-container').offsetTop - 100, behavior: 'smooth' });
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

    document.getElementById('article-form')?.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = this.querySelector('button[type="submit"]');
      btn.disabled = true; btn.textContent = 'Publication en cours...';
      const id = document.getElementById('article-id').value;
      const preview = document.getElementById('img-preview');
      var imageData = preview && preview.src ? preview.src : '';

      function saveArticle(imgUrl) {
        const article = {
          title: document.getElementById('art-title').value,
          category: document.getElementById('art-category').value,
          image: imgUrl || imageData,
          excerpt: document.getElementById('art-excerpt').value,
          content: document.getElementById('art-content').value,
          author: document.getElementById('art-author').value,
          priority: (document.getElementById('art-priority') || {}).value || 'normal',
          date: new Date().toISOString().split('T')[0]
        };
        // Include translations
        ['_en','_sw','_es'].forEach(function(sfx){
          var t = document.getElementById('art-title'+sfx); if (t && t.value) article['title'+sfx] = t.value;
          var e = document.getElementById('art-excerpt'+sfx); if (e && e.value) article['excerpt'+sfx] = e.value;
          var c = document.getElementById('art-content'+sfx); if (c && c.value) article['content'+sfx] = c.value;
        });
        if (id) article.id = Number(id);
        apiPost('/articles', article).then(function() { btn.disabled = false; btn.textContent = '💾 Publier l\'article'; loadArticles(); });
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
        showToast(id ? 'Article modifié avec succès.' : 'Article publié avec succès !');
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

  function loadArticles() {
    const tbody = document.getElementById('articles-table-body');
    if (!tbody) return;
    var load = useServer ? apiGet('/articles') : null;
    if (load) {
      load.then(function(articles) {
        if (articles) {
          localStorage.setItem('admin_articles', JSON.stringify(articles));
          renderArticles(articles);
        } else { renderFromLocal(); }
      });
    } else { renderFromLocal(); }
    function renderFromLocal() {
      var a = JSON.parse(localStorage.getItem('admin_articles') || '[]');
      renderArticles(a);
    }
    function renderArticles(articles) {
      if (!articles || articles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px;color:#999;">Aucun article publié. Cliquez sur "Nouvel article" pour commencer.</td></tr>';
        return;
      }
      tbody.innerHTML = articles.map(function(a) {
        return '<tr><td>' + a.id + '</td><td><strong>' + a.title + '</strong></td><td>' + a.category + '</td><td>' + a.date + '</td><td>' +
          '<button class="btn btn-sm btn-outline" onclick="editArticle(' + a.id + ')" style="padding:4px 10px;font-size:0.8rem;">✏ Modifier</button> ' +
          '<button class="btn btn-sm btn-secondary" onclick="deleteArticle(' + a.id + ')" style="padding:4px 10px;font-size:0.8rem;">🗑 Supprimer</button></td></tr>';
      }).join('');
    }
  }

  window.editArticle = function (id) {
    let articles = JSON.parse(localStorage.getItem('admin_articles') || '[]');
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

  window.deleteArticle = function (id) {
    if (!confirm('Supprimer cet article définitivement ?')) return;
    apiDel('/articles/' + id);
    if (!useServer) {
      let articles = JSON.parse(localStorage.getItem('admin_articles') || '[]');
      articles = articles.filter(a => a.id !== id);
      localStorage.setItem('admin_articles', JSON.stringify(articles));
    }
    loadArticles();
    showToast('Article supprimé.');
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
        return '<tr' + row + '><td>' + c.name + '</td><td>' + badge + c.text.substring(0, 60) + (c.text.length > 60 ? '...' : '') + '</td><td>' + c.date + '</td><td>Article #' + c.articleId + '</td><td>' + actions + '</td></tr>';
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
    line: function (canvas, labels, series, palette) {
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
      sub: document.getElementById('db-visits-sub'),
      top: document.getElementById('db-top-body'),
      topHint: document.getElementById('db-top-hint'),
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
    function load() {
      apiGet('/analytics/overview?period=' + period).then(render).catch(function () {
        els.visits.textContent = '—';
        els.chart && els.chart.getContext && Dash.line(els.chart, [], []);
      });
    }
    function render(d) {
      if (!d) return;
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
      els.topHint.textContent = '(' + periodLabel[period] + ')';
      var s = d.series || {};
      var hasData = (s.visits || []).some(function (v) { return v > 0; });
      Dash.line(els.chart, [
        { labels: s.labels || [], data: s.visits || [], name: 'Visites', color: '#58a6ff' },
        { labels: s.labels || [], data: s.uniques || [], name: 'Uniques', color: '#3fb950' }
      ], ['#58a6ff', '#3fb950']);
      if (els.top) {
        var arts = d.topArticles || [];
        els.top.innerHTML = arts.length ? arts.map(function (a) {
          return '<tr><td><strong>' + a.title + '</strong><br><span style="color:#8b949e;font-size:0.75rem;">' + a.category + '</span></td>' +
            '<td>' + Dash.fmt(a.visits) + '</td><td>' + Dash.fmt(a.uniques) + '</td>' +
            '<td>' + Dash.fmt(a.readers) + ' <span style="color:#8b949e;font-size:0.72rem;">(' + Dash.secs(a.avgReadSec) + ')</span></td>' +
            '<td>' + Dash.fmt(a.shares) + '</td></tr>';
        }).join('') : '<tr><td colspan="5" class="dash-empty" style="text-align:center;">Aucune visite d\'article.</td></tr>';
      }
      var cats = (d.topCategories || []).map(function (c) { return { n: c.category, v: c.visits }; });
      var total = cats.reduce(function (a, b) { return a + b.v; }, 0);
      Dash.doughnut(els.cat, cats, total);
      var colors = ['#58a6ff', '#3fb950'];
      els.devs.innerHTML = Dash.bars((d.devices || []).map(function (x) { return { n: x.name, v: x.count }; }), colors[0]);
      els.bowsers.innerHTML = Dash.bars((d.browsers || []).map(function (x) { return { n: x.name, v: x.count }; }), colors[1]);
      els.sources.innerHTML = Dash.bars((d.sources || []).map(function (x) { return { n: x.name, v: x.count }; }), '#f0883e');
      els.countries.innerHTML = Dash.bars((d.countries || []).map(function (x) { return { n: x.country, v: x.visits }; }), '#a371f7');
    }
    load();
  }
  initDashboard();

  // ===== VISIT TRACKER (public pages) =====
  if (!document.querySelector('.admin-body')) {
    trackVisit();
  }

  function trackVisit() {
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
