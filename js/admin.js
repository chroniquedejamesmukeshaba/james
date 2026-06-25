document.addEventListener('DOMContentLoaded', function () {

  // ===== LOGIN =====
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      if (username === 'admin' && password === 'chronique2026') {
        localStorage.setItem('admin_logged', 'true');
        window.location.href = 'index.html';
      } else {
        showToast('Identifiants incorrects.', 'error');
      }
    });
  }

  // ===== CHECK AUTH =====
  if (document.querySelector('.admin-body') && !document.querySelector('.login-page')) {
    if (localStorage.getItem('admin_logged') !== 'true') {
      window.location.href = 'login.html';
      return;
    }
    document.getElementById('logout-btn')?.addEventListener('click', function (e) {
      e.preventDefault();
      localStorage.removeItem('admin_logged');
      window.location.href = 'login.html';
    });
  }

  // ===== LOAD ARTICLES =====
  const articlesTable = document.getElementById('articles-table-body');
  if (articlesTable) {
    loadArticles();

    document.getElementById('new-article-btn')?.addEventListener('click', function () {
      document.getElementById('article-form-container').style.display = 'block';
      document.getElementById('article-form').reset();
      resetImageUpload();
      document.getElementById('form-title').textContent = 'Nouvel article';
      document.getElementById('article-id').value = '';
      window.scrollTo({ top: document.getElementById('article-form-container').offsetTop - 100, behavior: 'smooth' });
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
      const id = document.getElementById('article-id').value;
      const preview = document.getElementById('img-preview');
      const imageData = preview && preview.src ? preview.src : '';
      const article = {
        title: document.getElementById('art-title').value,
        category: document.getElementById('art-category').value,
        image: imageData,
        excerpt: document.getElementById('art-excerpt').value,
        content: document.getElementById('art-content').value,
        author: document.getElementById('art-author').value,
        date: new Date().toISOString().split('T')[0]
      };
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
      document.getElementById('article-form-container').style.display = 'none';
      loadArticles();
      showToast(id ? 'Article modifié avec succès.' : 'Article publié avec succès !');
    });
  }

  function loadArticles() {
    const tbody = document.getElementById('articles-table-body');
    if (!tbody) return;
    let articles = JSON.parse(localStorage.getItem('admin_articles') || '[]');
    if (articles.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px;color:#999;">Aucun article publié. Cliquez sur "Nouvel article" pour commencer.</td></tr>';
      return;
    }
    tbody.innerHTML = articles.map(a => `
      <tr>
        <td>${a.id}</td>
        <td><strong>${a.title}</strong></td>
        <td>${a.category}</td>
        <td>${a.date}</td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="editArticle(${a.id})" style="padding:4px 10px;font-size:0.8rem;">✏ Modifier</button>
          <button class="btn btn-sm btn-secondary" onclick="deleteArticle(${a.id})" style="padding:4px 10px;font-size:0.8rem;">🗑 Supprimer</button>
        </td>
      </tr>
    `).join('');
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
    if (article.image) {
      const preview = document.getElementById('img-preview');
      preview.src = article.image;
      document.getElementById('img-upload-area').classList.add('has-image');
    }
    window.scrollTo({ top: document.getElementById('article-form-container').offsetTop - 100, behavior: 'smooth' });
  };

  window.deleteArticle = function (id) {
    if (!confirm('Supprimer cet article définitivement ?')) return;
    let articles = JSON.parse(localStorage.getItem('admin_articles') || '[]');
    articles = articles.filter(a => a.id !== id);
    localStorage.setItem('admin_articles', JSON.stringify(articles));
    loadArticles();
    showToast('Article supprimé.');
  };

  // ===== COMMENTS MODERATION =====
  const commentsTable = document.getElementById('comments-table-body');
  if (commentsTable) {
    loadPendingComments();
  }

  function loadPendingComments() {
    const tbody = document.getElementById('comments-table-body');
    if (!tbody) return;
    let allComments = [];
    const keys = Object.keys(localStorage).filter(k => k.startsWith('comments_'));
    keys.forEach(key => {
      const articleId = key.replace('comments_', '');
      const comments = JSON.parse(localStorage.getItem(key) || '[]');
      comments.forEach(c => { c.articleId = articleId; allComments.push(c); });
    });
    allComments.sort((a, b) => b.id - a.id);
    if (allComments.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px;color:#999;">Aucun commentaire pour le moment.</td></tr>';
      return;
    }
    tbody.innerHTML = allComments.map(c => `
      <tr style="${c.pending ? 'background:#fff8e1;' : ''}">
        <td>${c.name}</td>
        <td>${c.text.substring(0, 60)}${c.text.length > 60 ? '...' : ''}</td>
        <td>${c.date}</td>
        <td>Article #${c.articleId}</td>
        <td>
          ${c.pending ? `
            <button class="btn btn-sm btn-primary" onclick="approveComment('${c.articleId}', ${c.id})" style="padding:4px 10px;font-size:0.8rem;">✓ Approuver</button>
            <button class="btn btn-sm btn-secondary" onclick="rejectComment('${c.articleId}', ${c.id})" style="padding:4px 10px;font-size:0.8rem;">✕ Rejeter</button>
          ` : '<span style="color:#27ae60;">Approuvé</span>'}
        </td>
      </tr>
    `).join('');
  }

  window.approveComment = function (articleId, commentId) {
    const comments = JSON.parse(localStorage.getItem('comments_' + articleId) || '[]');
    const idx = comments.findIndex(c => c.id === commentId);
    if (idx >= 0) { comments[idx].pending = false; }
    localStorage.setItem('comments_' + articleId, JSON.stringify(comments));
    loadPendingComments();
    showToast('Commentaire approuvé.');
  };

  window.rejectComment = function (articleId, commentId) {
    if (!confirm('Rejeter ce commentaire ?')) return;
    let comments = JSON.parse(localStorage.getItem('comments_' + articleId) || '[]');
    comments = comments.filter(c => c.id !== commentId);
    localStorage.setItem('comments_' + articleId, JSON.stringify(comments));
    loadPendingComments();
    showToast('Commentaire rejeté.');
  };

  // ===== DASHBOARD STATS =====
  const dashboard = document.getElementById('dashboard-stats');
  if (dashboard) {
    const articles = JSON.parse(localStorage.getItem('admin_articles') || '[]');
    let totalComments = 0;
    const keys = Object.keys(localStorage).filter(k => k.startsWith('comments_'));
    keys.forEach(key => { totalComments += JSON.parse(localStorage.getItem(key) || '[]').length; });
    const subs = JSON.parse(localStorage.getItem('nl_subscribers') || '[]');
    const visits = JSON.parse(localStorage.getItem('visit_stats') || '[]');

    document.getElementById('stat-articles').textContent = articles.length;
    document.getElementById('stat-comments').textContent = totalComments;
    document.getElementById('stat-subs').textContent = subs.length;
    document.getElementById('stat-visits').textContent = visits.length;

    updateChart(visits);
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
      data.push(visits.filter(v => v.startsWith(key)).length);
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
    const visits = JSON.parse(localStorage.getItem('visit_stats') || '[]');
    visits.push(new Date().toISOString());
    if (visits.length > 10000) visits.splice(0, visits.length - 10000);
    localStorage.setItem('visit_stats', JSON.stringify(visits));
  }
});
