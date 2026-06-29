document.addEventListener('DOMContentLoaded', function () {

  // ===== LOGIN =====
  const ADMINS = { 'Shine2026':'YAGIRWA GEDEON GUIDE', 'Lufumica2026':'LUFUNGULO MICHAEL', 'Sergio2026':'SERGE IRENGE', 'Christvie2026':'MUKESHABA JAMES MPALA' };
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      if (username === 'admin' && ADMINS[password]) {
        localStorage.setItem('admin_logged', 'true');
        localStorage.setItem('admin_name', ADMINS[password]);
        if (window.location.protocol !== 'file:') {
          fetch('/api/auth', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user:username,pass:password})}).catch(function(){});
        }
        window.location.href = 'index.html';
      } else {
        showToast('Identifiants incorrects.', 'error');
      }
    });
  }

  // ===== DATA API HELPERS =====
var useServer = window.location.protocol !== 'file:';

function apiGet(path) {
  if (!useServer) return null;
  return fetch('/api' + path).then(function(r){return r.ok?r.json():null}).catch(function(){return null});
}
function apiPost(path, data) {
  if (!useServer) return null;
  return fetch('/api' + path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
    .then(function(r){return r.ok?r.json():null}).catch(function(){return null});
}
function apiDel(path) {
  if (!useServer) return null;
  return fetch('/api' + path,{method:'DELETE'}).then(function(r){return r.ok}).catch(function(){return false});
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
      localStorage.removeItem('admin_logged');
      localStorage.removeItem('admin_name');
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
        var row = c.pending ? ' style="background:#fff8e1;"' : '';
        var actions = c.pending
          ? '<button class="btn btn-sm btn-primary" onclick="approveComment(' + c.articleId + ',' + c.id + ')" style="padding:4px 10px;font-size:0.8rem;">✓ Approuver</button> <button class="btn btn-sm btn-secondary" onclick="rejectComment(' + c.articleId + ',' + c.id + ')" style="padding:4px 10px;font-size:0.8rem;">✕ Rejeter</button>'
          : '<span style="color:#27ae60;">Approuvé</span>';
        return '<tr' + row + '><td>' + c.name + '</td><td>' + c.text.substring(0, 60) + (c.text.length > 60 ? '...' : '') + '</td><td>' + c.date + '</td><td>Article #' + c.articleId + '</td><td>' + actions + '</td></tr>';
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

  // ===== DASHBOARD STATS =====
  var statEls = {
    articles: document.getElementById('stat-articles'),
    comments: document.getElementById('stat-comments'),
    subs: document.getElementById('stat-subs'),
    visits: document.getElementById('stat-visits'),
    chart: document.getElementById('visits-chart')
  };
  if (statEls.articles) {
    function loadStats(data) {
      if (data) {
        statEls.articles.textContent = data.articles || 0;
        statEls.comments.textContent = data.comments || 0;
        statEls.subs.textContent = data.subs || 0;
        statEls.visits.textContent = data.visits || 0;
        updateChart(data.visitsList || []);
      } else {
        var a = JSON.parse(localStorage.getItem('admin_articles') || '[]');
        var subs = JSON.parse(localStorage.getItem('nl_subscribers') || '[]');
        var visits = JSON.parse(localStorage.getItem('visit_stats') || '[]').map(function(v){return typeof v === 'string' ? v : (v.date||'');});
        var totalComments = 0;
        Object.keys(localStorage).filter(function(k){return k.startsWith('comments_');}).forEach(function(k){
          totalComments += JSON.parse(localStorage.getItem(k) || '[]').length;
        });
        statEls.articles.textContent = a.length;
        statEls.comments.textContent = totalComments;
        statEls.subs.textContent = subs.length;
        statEls.visits.textContent = visits.length;
        updateChart(visits);
      }
    }
    apiGet('/stats').then(function(s) { loadStats(s); }).catch(function(){ loadStats(null); });
  }

  function updateChart(visits) {
    const ctx = document.getElementById('visits-chart');
    if (!ctx) return;
    const days = 7;
    const labels = [];
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      labels.push(d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }));
      data.push(visits.filter(function(v){return typeof v === 'string' ? v.startsWith(key) : (v.date && v.date.startsWith(key));}).length);
    }
    const maxVal = Math.max(...data, 1);
    let bars = '';
    data.forEach((val, i) => {
      const h = Math.max(4, (val / maxVal) * 150);
      bars += `
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;">
          <div style="width:30px;height:${h}px;background:var(--primary);border-radius:4px 4px 0 0;transition:0.3s;" title="${val} visites"></div>
          <span style="font-size:0.7rem;color:var(--text-light);text-align:center;">${labels[i]}</span>
          <span style="font-size:0.7rem;font-weight:600;">${val}</span>
        </div>
      `;
    });
    ctx.innerHTML = `<div style="display:flex;align-items:flex-end;gap:4px;height:180px;padding:10px 0;">${bars}</div>`;
  }

  // ===== VISIT TRACKER (public pages) =====
  if (!document.querySelector('.admin-body')) {
    trackVisit();
  }

  function trackVisit() {
    var params = new URLSearchParams(window.location.search);
    var articleId = params.get('id') || '';
    var path = window.location.pathname.replace('/index.html','/') || '/';
    var data = {date:new Date().toISOString(), path:path, articleId:articleId};
    if (window.location.protocol !== 'file:') {
      fetch('https://ipapi.co/json/').then(function(r){return r.json();}).then(function(g){
        data.country = g.country_name || g.country || '';
      }).catch(function(){}).then(function(){
        fetch('/api/visits', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).catch(function(){});
      });
    }
    var visits = JSON.parse(localStorage.getItem('visit_stats') || '[]');
    visits.push(data);
    if (visits.length > 10000) visits.splice(0, visits.length - 10000);
    localStorage.setItem('visit_stats', JSON.stringify(visits));
  }
});
