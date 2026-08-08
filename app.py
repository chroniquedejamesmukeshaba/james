import os, json, time, uuid, base64, urllib.request, hmac, hashlib, re, unicodedata
from io import BytesIO
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory, redirect, Response

app = Flask(__name__)
DATA_DIR = os.path.join(os.path.dirname(__file__), 'server_data')
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), 'assets', 'uploads')
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

def read_json(name):
    path = os.path.join(DATA_DIR, name + '.json')
    if not os.path.exists(path): return []
    try:
        with open(path, 'r', encoding='utf-8') as f: return json.load(f)
    except Exception:
        return []

def write_json(name, data):
    path = os.path.join(DATA_DIR, name + '.json')
    with open(path, 'w', encoding='utf-8') as f: json.dump(data, f, ensure_ascii=False, indent=2)

def read_obj(name, default):
    path = os.path.join(DATA_DIR, name + '.json')
    if not os.path.exists(path): return default
    try:
        with open(path, 'r', encoding='utf-8') as f: return json.load(f)
    except Exception:
        return default

# --- SECURITY ---
ADMINS = {
    'Shine2026':    'YAGIRWA GEDEON GUIDE',
    'Lufumica2026': 'LUFUNGULO MICHAEL',
    'Sergio2026':   'SERGE IRENGE',
    'Christvie2026':'MUKESHABA JAMES MPALA',
}
TOKEN_TTL = 12 * 3600

def admin_ok():
    t = request.headers.get('X-Admin-Token', '')
    if t and t in ADMINS:
        return True
    bear = request.headers.get('Authorization', '')
    if bear.startswith('Bearer '):
        part = bear[7:]
        if ':' in part:
            tok, ts = part.rsplit(':', 1)
            if tok in ADMINS and ts.isdigit() and (time.time() - float(ts)) < TOKEN_TTL:
                digest = hmac.new(tok.encode(), ts.encode(), hashlib.sha256).hexdigest()
                if part == tok + ':' + ts and digest == ts:
                    return True
        elif part in ADMINS:
            return True
    return False

def admin_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not admin_ok():
            return jsonify({'ok': False, 'error': 'non autorise'}), 401
        return f(*args, **kwargs)
    return wrapper

RATE_CACHE = {}
def rate_limit(route, limit, window):
    def deco(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            ip = request.remote_addr or '?'
            key = (route, ip)
            now = time.time()
            items = [t for t in RATE_CACHE.get(key, []) if now - t < window]
            if len(items) >= limit:
                return jsonify({'ok': False, 'error': 'trop de requetes'}), 429
            items.append(now)
            RATE_CACHE[key] = items
            return f(*args, **kwargs)
        return wrapper
    return deco

@app.after_request
def security_headers(resp):
    resp.headers['X-Content-Type-Options'] = 'nosniff'
    resp.headers['X-Frame-Options'] = 'SAMEORIGIN'
    resp.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    resp.headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()'
    resp.headers['Content-Security-Policy'] = ("default-src 'self'; script-src 'self' 'unsafe-inline' https://ipapi.co; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: https:; connect-src 'self' https://ip-api.com https://ipapi.co; "
        "frame-ancestors 'self'; base-uri 'self'; form-action 'self'")
    if request.path.startswith('/assets/'):
        resp.headers['Cache-Control'] = 'public, max-age=604800'
    elif request.path.startswith('/api/'):
        resp.headers['Cache-Control'] = 'no-store'
    else:
        resp.headers['Cache-Control'] = 'no-cache'
    return resp

def apply_lang(a, lang):
    if lang and lang != 'fr':
        for f in ('title', 'content', 'excerpt'):
            k = f + '_' + lang
            if k in a and a[k]:
                a[f] = a[k]
    return a

# --- RECHERCHE & CATEGORIES ---
def fold(s):
    """Normalise un texte pour la recherche (minuscules, sans accents ni signes)."""
    s = unicodedata.normalize('NFKD', s or '')
    s = s.encode('ascii', 'ignore').decode('ascii', 'ignore')
    return re.sub(r'[^a-z0-9]', '', s.lower())

CAT_ALIAS = {
    'social': 'societe', 'societe': 'societe',
    'sante': 'sante', 'education': 'education',
    'national': 'national', 'nationale': 'national',
    'sport': 'sport', 'international': 'international',
    'environnement': 'environnement', 'securite': 'securite',
    'insecurite': 'securite', 'politique': 'politique',
    'culture': 'culture', 'enfance': 'enfance', 'medias': 'medias',
    'religion': 'religion', 'humanitaire': 'humanitaire',
}

CATEGORIES = {
    'societe': ('Société', "Les faits divers, la vie sociale et les initiatives de la communauté."),
    'sante': ('Santé', "Épidémies, campagnes de prévention et actualité des structures de santé."),
    'national': ('Nationale', "L'actualité du pays : institutions, éducation et gestion publique."),
    'education': ('Éducation', "Écoles, examens d'État et vie académique des jeunes congolais."),
    'sport': ('Sport', "Football, Coupe du Monde et toutes les disciplines sportives."),
    'international': ('International', "L'actualité du monde vue depuis la RDC et les Grands Lacs."),
    'environnement': ('Environnement', "Climat, nature et initiatives de protection de l'environnement."),
    'securite': ('Sécurité', "Sécurité publique, insécurité et mesures des autorités."),
    'politique': ('Politique', "La vie politique et les décisions des institutions du pays."),
    'culture': ('Culture', "Kermesses, arts, patrimoine et événements culturels."),
    'enfance': ('Enfance', "La protection des droits de l'enfant et les campagnes associées."),
    'medias': ('Médias', "L'actualité des médias et la lutte contre la désinformation."),
    'religion': ('Religion', "Vie religieuse et communautés de foi."),
    'humanitaire': ('Humanitaire', "L'action humanitaire et la crise dans l'Est de la RDC."),
}


def cat_slug(cat):
    key = fold(cat)
    slug = CAT_ALIAS.get(key, key)
    return slug


def cat_display(slug, raw):
    if slug in CATEGORIES:
        return CATEGORIES[slug][0]
    return (raw or slug).strip().title()


def cat_desc(slug, raw):
    return CATEGORIES.get(slug, (None, ''))[1] or "Articles de la catégorie « " + ((raw or slug).strip()) + " »."


def popularities():
    try:
        reactions = read_obj('reactions', {})
    except Exception:
        reactions = {}
    try:
        visits = read_json('visits')
    except Exception:
        visits = []
    score = {}
    for aid, slot in reactions.items():
        score[aid] = sum(int(v) for v in slot.values()) * 25
    for v in visits:
        if isinstance(v, dict) and v.get('articleId'):
            aid = str(v['articleId'])
            score[aid] = score.get(aid, 0) + 1
    return score


def article_lite(a, lang='fr'):
    cp = dict(a)
    cp.pop('content', None)
    for k in list(cp):
        if k.startswith('content_'):
            cp.pop(k, None)
    img = cp.get('image') or ''
    if img.startswith('data:'):
        cp['image'] = ''
    cp['cat'] = cat_slug(cp.get('category'))
    if lang and lang != 'fr':
        for f in ('title', 'excerpt'):
            k = f + '_' + lang
            if k in cp and cp[k]:
                cp[f] = cp[k]
    return cp

# --- ARTICLES ---
@app.route('/api/articles', methods=['GET'])
def get_articles():
    lang = request.args.get('lang', 'fr')
    articles = read_json('articles')
    if lang and lang != 'fr':
        for a in articles:
            apply_lang(a, lang)
    return jsonify(articles)

@app.route('/api/articles/lite')
def get_articles_lite():
    lang = request.args.get('lang', 'fr')
    out = []
    for a in read_json('articles'):
        cp = dict(a)
        cp.pop('content', None)
        for k in list(cp):
            if k.startswith('content_'): cp.pop(k, None)
        img = cp.get('image') or ''
        if img.startswith('data:'):
            cp['image'] = ''
        if lang and lang != 'fr':
            for f in ('title', 'excerpt'):
                k = f + '_' + lang
                if k in cp and cp[k]: cp[f] = cp[k]
        out.append(cp)
    return jsonify(out)

@app.route('/api/articles/<int:aid>')
def get_article(aid):
    lang = request.args.get('lang', 'fr')
    for a in read_json('articles'):
        if str(a.get('id')) == str(aid):
            cp = dict(a)
            apply_lang(cp, lang)
            return jsonify(cp)
    return jsonify({'error': 'not found'}), 404

@app.route('/api/articles', methods=['POST'])
@admin_required
def save_article():
    articles = read_json('articles')
    data = request.json or {}
    if data.get('id'):
        for i, a in enumerate(articles):
            if a['id'] == data['id']:
                articles[i] = {**a, **data}
                break
    else:
        data['id'] = int(time.time() * 1000)
        data['featured'] = False
        articles.insert(0, data)
    write_json('articles', articles)
    return jsonify({'ok': True, 'id': data['id']})

@app.route('/api/articles/<int:aid>', methods=['PUT'])
@admin_required
def update_article(aid):
    articles = read_json('articles')
    data = request.json or {}
    data['id'] = aid
    data['modified'] = time.strftime('%Y-%m-%dT%H:%M:%S')
    for i, a in enumerate(articles):
        if a['id'] == aid:
            articles[i] = {**a, **data}
            break
    else:
        data['featured'] = False
        articles.insert(0, data)
    write_json('articles', articles)
    return jsonify({'ok': True, 'id': aid})

@app.route('/api/articles/<int:aid>', methods=['DELETE'])
@admin_required
def delete_article(aid):
    articles = [a for a in read_json('articles') if a['id'] != aid]
    write_json('articles', articles)
    return jsonify({'ok': True})

@app.route('/api/categories')
def list_categories():
    cats = {}
    for a in read_json('articles'):
        slug = cat_slug(a.get('category'))
        cats[slug] = cats.get(slug, 0) + 1
    out = []
    for slug, count in sorted(cats.items(), key=lambda x: (-x[1], x[0])):
        raw = ''
        for a in read_json('articles'):
            if cat_slug(a.get('category')) == slug:
                raw = a.get('category') or ''
                break
        out.append({'slug': slug, 'name': cat_display(slug, raw), 'count': count})
    return jsonify(out)


@app.route('/api/category/<slug>')
def get_category(slug):
    lang = request.args.get('lang', 'fr')
    articles = read_json('articles')
    members = []
    for a in articles:
        if cat_slug(a.get('category')) == slug:
            members.append(a)
    if not members:
        return jsonify({'error': 'categorie inconnue'}), 404
    raw = ''
    for m in members:
        if m.get('category'):
            raw = m['category']
            break
    sorted_members = sorted(members, key=lambda x: -(x.get('id') or 0))
    pop = popularities()
    by_pop = sorted(members, key=lambda x: (-pop.get(str(x.get('id')), 0), -(x.get('id') or 0)))
    principal = None
    for m in sorted_members:
        if str(m.get('priority', '')).lower() in ('breaking', 'important'):
            principal = m
            break
    if principal is None:
        for m in sorted_members:
            if m.get('image'):
                principal = m
                break
    if principal is None and sorted_members:
        principal = sorted_members[0]
    cats = {}
    for a in articles:
        s2 = cat_slug(a.get('category'))
        cats[s2] = cats.get(s2, 0) + 1
    all_cats = [{'slug': s2, 'name': cat_display(s2, ''), 'count': c}
                for s2, c in sorted(cats.items(), key=lambda x: (-x[1], x[0]))]
    return jsonify({
        'slug': slug,
        'name': cat_display(slug, raw),
        'description': cat_desc(slug, raw),
        'count': len(members),
        'principal': article_lite(principal, lang) if principal else None,
        'articles': [dict(article_lite(a, lang), pop=pop.get(str(a.get('id')), 0)) for a in sorted_members],
        'popular': [dict(article_lite(a, lang), pop=pop.get(str(a.get('id')), 0)) for a in by_pop[:5]],
        'categories': all_cats
    })


@app.route('/api/search')
def search_articles():
    lang = request.args.get('lang', 'fr')
    q = (request.args.get('q') or '').strip()
    limit = int(request.args.get('limit', 20))
    fq = fold(q)
    articles = read_json('articles')
    pop = popularities()
    results = []
    cat_hits = {}
    if fq:
        for a in articles:
            slug = cat_slug(a.get('category'))
            haystacks = {
                'title': a.get('title') or '',
                'content': a.get('content') or '',
                'excerpt': a.get('excerpt') or '',
                'category': cat_display(slug, a.get('category')),
                'author': a.get('author') or '',
                'date': a.get('date') or '',
                'keywords': ' '.join([
                    str(a.get(k, '')) for k in ('tags', 'keywords', 'key', 'theme')
                    if a.get(k)
                ]),
            }
            score = 0
            matched = []
            for field, text in haystacks.items():
                if fq in fold(text):
                    w = {'title': 8, 'excerpt': 3, 'content': 1, 'category': 2,
                         'author': 2, 'date': 1, 'keywords': 3}[field]
                    score += w
                    matched.append(field)
            if score:
                results.append((score, a, matched))
                cat_hits[slug] = cat_hits.get(slug, 0) + 1
        results.sort(key=lambda x: (-x[0], -(x[1].get('id') or 0)))
        results = results[:limit]
    else:
        results = [(0, a, []) for a in sorted(articles, key=lambda x: -(x.get('id') or 0))[:8]]
    recent_all = sorted(articles, key=lambda x: -(x.get('id') or 0))[:5]
    popular_all = sorted(articles, key=lambda x: (-pop.get(str(x.get('id')), 0), -(x.get('id') or 0)))[:5]
    cat_list = []
    seen = set()
    for slug, cnt in sorted(cat_hits.items(), key=lambda x: -x[1]):
        if slug in seen:
            continue
        seen.add(slug)
        cat_list.append({'slug': slug, 'name': cat_display(slug, ''), 'count': cnt})
    cat_list = cat_list[:4]
    cats_all = {}
    for a in articles:
        s2 = cat_slug(a.get('category'))
        cats_all[s2] = cats_all.get(s2, 0) + 1
    all_cats = [{'slug': s2, 'name': cat_display(s2, ''), 'count': c}
                for s2, c in sorted(cats_all.items(), key=lambda x: (-x[1], x[0]))]
    return jsonify({
        'query': q,
        'total': len(results),
        'results': [dict(article_lite(a, lang), matched=matched, score=sc, pop=pop.get(str(a.get('id')), 0)) for sc, a, matched in results],
        'categories': cat_list,
        'recent': [dict(article_lite(a, lang), pop=pop.get(str(a.get('id')), 0)) for a in recent_all],
        'popular': [dict(article_lite(a, lang), pop=pop.get(str(a.get('id')), 0)) for a in popular_all],
        'all_categories': all_cats
    })

# --- PAGES ---
@app.route('/api/pages', methods=['GET'])
def get_pages():
    return jsonify(read_json('pages'))

@app.route('/api/pages', methods=['POST'])
@admin_required
def save_page():
    pages = read_json('pages')
    data = request.json or {}
    if data.get('id'):
        for i, p in enumerate(pages):
            if p['id'] == data['id']:
                pages[i] = {**p, **data}
                break
    else:
        data['id'] = int(time.time() * 1000)
        pages.append(data)
    write_json('pages', pages)
    return jsonify({'ok': True, 'id': data['id']})

@app.route('/api/pages/<int:pid>', methods=['PUT'])
@admin_required
def update_page(pid):
    pages = read_json('pages')
    data = request.json or {}
    data['id'] = pid
    for i, p in enumerate(pages):
        if p['id'] == pid:
            pages[i] = {**p, **data}
            break
    else:
        pages.append(data)
    write_json('pages', pages)
    return jsonify({'ok': True, 'id': pid})

@app.route('/api/pages/<int:pid>', methods=['DELETE'])
@admin_required
def delete_page(pid):
    pages = [p for p in read_json('pages') if p['id'] != pid]
    write_json('pages', pages)
    return jsonify({'ok': True})

# --- COMMENTS ---
@app.route('/api/comments/<int:article_id>', methods=['GET'])
def get_comments(article_id):
    key = f'comments_{article_id}'
    return jsonify(read_json(key))

@app.route('/api/comments/<int:article_id>', methods=['POST'])
@rate_limit('comment_post', 50, 24 * 3600)
def add_comment(article_id):
    key = f'comments_{article_id}'
    data = request.json or {}
    name = (data.get('name') or '').strip()[:40]
    text = (data.get('text') or '').strip()[:2000]
    if not name or not text:
        return jsonify({'ok': False, 'error': 'champs requis'}), 400
    if not any(ch.isalpha() for ch in text):
        return jsonify({'ok': False, 'error': 'texte invalide'}), 400
    if text.lower().count('http') > 2:
        return jsonify({'ok': False, 'error': 'trop de liens'}), 400
    if name.lower() in read_obj('blocked', []):
        return jsonify({'ok': False, 'error': 'compte bloque'}), 403
    comments = read_json(key)
    entry = {
        'id': int(time.time() * 1000),
        'name': name,
        'text': text[:1500],
        'date': data.get('date') or time.strftime('%Y-%m-%d'),
        'pending': True,
        'status': 'pending'
    }
    comments.append(entry)
    write_json(key, comments)
    return jsonify({'ok': True, 'id': entry['id']})

@app.route('/api/comments/<int:article_id>/<int:cid>/approve', methods=['POST'])
@admin_required
def approve_comment(article_id, cid):
    key = f'comments_{article_id}'
    comments = read_json(key)
    for c in comments:
        if c['id'] == cid:
            c['pending'] = False
            c['status'] = 'visible'
            break
    write_json(key, comments)
    return jsonify({'ok': True})

@app.route('/api/comments/<int:article_id>/<int:cid>/status', methods=['POST'])
@admin_required
def set_comment_status(article_id, cid):
    st = (request.json or {}).get('status')
    if st not in ('visible', 'hidden'):
        return jsonify({'ok': False, 'error': 'status invalide'}), 400
    key = f'comments_{article_id}'
    comments = read_json(key)
    for c in comments:
        if c['id'] == cid:
            c['status'] = st
            c['pending'] = False
            break
    write_json(key, comments)
    return jsonify({'ok': True})

@app.route('/api/comments/<int:article_id>/<int:cid>/flag', methods=['POST'])
@rate_limit('comment_flag', 10, 24 * 3600)
def flag_comment(article_id, cid):
    key = f'comments_{article_id}'
    comments = read_json(key)
    for c in comments:
        if c['id'] == cid:
            c['flagged'] = True
            c['flag_reason'] = ((request.json or {}).get('reason') or '')[:200]
            break
    write_json(key, comments)
    return jsonify({'ok': True})

@app.route('/api/comments/<int:article_id>/<int:cid>', methods=['DELETE'])
@admin_required
def delete_comment(article_id, cid):
    key = f'comments_{article_id}'
    comments = [c for c in read_json(key) if c['id'] != cid]
    write_json(key, comments)
    return jsonify({'ok': True})

# --- BLOCKED USERS ---
@app.route('/api/blocked', methods=['GET'])
@admin_required
def list_blocked():
    return jsonify(read_obj('blocked', []))

@app.route('/api/blocked', methods=['POST'])
@admin_required
def block_user():
    name = ((request.json or {}).get('name') or '').strip().lower()[:40]
    if not name:
        return jsonify({'ok': False, 'error': 'nom vide'}), 400
    bl = read_obj('blocked', [])
    if name not in bl:
        bl.append(name)
    write_json('blocked', bl)
    return jsonify({'ok': True})

@app.route('/api/blocked/<path:name>', methods=['DELETE'])
@admin_required
def unblock_user(name):
    bl = [n for n in read_obj('blocked', []) if n != name.lower()]
    write_json('blocked', bl)
    return jsonify({'ok': True})

# --- REACTIONS ---
REACTION_TYPES = ('like', 'love', 'wow', 'sad', 'angry')

@app.route('/api/reactions/<int:article_id>', methods=['GET'])
def get_reactions(article_id):
    return jsonify(read_obj('reactions', {}).get(str(article_id), {}))

@app.route('/api/reactions/<int:article_id>', methods=['POST'])
@rate_limit('reaction_post', 40, 24 * 3600)
def add_reaction(article_id):
    rtype = (request.json or {}).get('type')
    if rtype not in REACTION_TYPES:
        return jsonify({'ok': False, 'error': 'type inconnu'}), 400
    data = read_obj('reactions', {})
    key = str(article_id)
    slot = dict(data.get(key) or {})
    slot[rtype] = int(slot.get(rtype, 0)) + 1
    data[key] = slot
    write_json('reactions', data)
    return jsonify({'ok': True, 'count': slot[rtype]})

# --- SETTINGS (BREAKING NEWS) ---
DEFAULT_SETTINGS = {'breaking_news_enabled': True, 'breaking_article_id': None}

@app.route('/api/settings', methods=['GET'])
def get_settings():
    s = read_obj('settings', DEFAULT_SETTINGS)
    out = dict(DEFAULT_SETTINGS)
    out.update(s)
    out['breaking_article_id'] = out.get('breaking_article_id') or None
    if not out['breaking_article_id']:
        for a in read_json('articles'):
            if str(a.get('priority', '')).lower() == 'breaking':
                out['breaking_article_id'] = a.get('id')
                break
    if out['breaking_article_id']:
        for a in read_json('articles'):
            if a.get('id') == out['breaking_article_id']:
                out['breaking_title'] = a.get('title')
                break
    return jsonify(out)

@app.route('/api/settings', methods=['POST'])
@admin_required
def save_settings():
    d = read_obj('settings', DEFAULT_SETTINGS)
    data = request.json or {}
    if 'breaking_news_enabled' in data:
        d['breaking_news_enabled'] = bool(data['breaking_news_enabled'])
    if 'breaking_article_id' in data:
        d['breaking_article_id'] = data['breaking_article_id']
    write_json('settings', d)
    return jsonify({'ok': True})

# --- NEWSLETTER ---
@app.route('/api/newsletter', methods=['GET'])
@admin_required
def get_subscribers():
    return jsonify(read_json('newsletter'))

@app.route('/api/newsletter', methods=['POST'])
@rate_limit('newsletter_post', 10, 24 * 3600)
def subscribe():
    subs = read_json('newsletter')
    email = (request.json or {}).get('email')
    if email and email not in subs:
        subs.append(email)
        write_json('newsletter', subs)
    return jsonify({'ok': True})

# --- LOST & FOUND ---
@app.route('/api/lost-found', methods=['GET'])
def get_lost_found():
    return jsonify(read_json('lost_found'))

@app.route('/api/lost-found', methods=['POST'])
@rate_limit('lost_found_post', 10, 24 * 3600)
def add_lost_found():
    ads = read_json('lost_found')
    data = request.json or {}
    data['id'] = int(time.time() * 1000)
    ads.insert(0, data)
    write_json('lost_found', ads)
    return jsonify({'ok': True})

@app.route('/api/lost-found/<int:lid>', methods=['DELETE'])
@admin_required
def delete_lost_found(lid):
    ads = [a for a in read_json('lost_found') if a['id'] != lid]
    write_json('lost_found', ads)
    return jsonify({'ok': True})

# --- CAMPAIGNS ---
@app.route('/api/campaigns', methods=['GET'])
def get_campaigns():
    return jsonify(read_json('campaigns'))

@app.route('/api/campaigns', methods=['POST'])
@admin_required
def save_campaign():
    campaigns = read_json('campaigns')
    data = request.json or {}
    if data.get('id'):
        for i, c in enumerate(campaigns):
            if c['id'] == data['id']:
                campaigns[i] = {**c, **data}
                break
    else:
        data['id'] = int(time.time() * 1000)
        data['status'] = 'active'
        data['createdAt'] = time.strftime('%Y-%m-%dT%H:%M:%S', time.gmtime())
        campaigns.insert(0, data)
    write_json('campaigns', campaigns)
    return jsonify({'ok': True, 'id': data['id']})

@app.route('/api/campaigns/<int:cid>', methods=['PUT'])
@admin_required
def update_campaign(cid):
    campaigns = read_json('campaigns')
    data = request.json or {}
    data['id'] = cid
    for i, c in enumerate(campaigns):
        if c['id'] == cid:
            campaigns[i] = {**c, **data}
            break
    else:
        campaigns.insert(0, data)
    write_json('campaigns', campaigns)
    return jsonify({'ok': True, 'id': cid})

@app.route('/api/campaigns/<int:cid>', methods=['DELETE'])
@admin_required
def delete_campaign(cid):
    campaigns = [c for c in read_json('campaigns') if c['id'] != cid]
    write_json('campaigns', campaigns)
    return jsonify({'ok': True})

@app.route('/api/campaigns/<int:cid>/stop', methods=['POST'])
@admin_required
def stop_campaign(cid):
    campaigns = read_json('campaigns')
    for c in campaigns:
        if c['id'] == cid:
            c['status'] = 'archived'
            c['archivedAt'] = time.strftime('%Y-%m-%dT%H:%M:%S', time.gmtime())
            break
    write_json('campaigns', campaigns)
    return jsonify({'ok': True})

@app.route('/api/campaigns/<int:cid>/speed', methods=['POST'])
@admin_required
def set_campaign_speed(cid):
    campaigns = read_json('campaigns')
    speed = (request.json or {}).get('speed', 5000)
    for c in campaigns:
        if c['id'] == cid:
            c['speed'] = speed
            break
    write_json('campaigns', campaigns)
    return jsonify({'ok': True})

# --- DONATIONS ---
@app.route('/api/donations', methods=['GET'])
@admin_required
def get_donations():
    return jsonify(read_json('donations'))

@app.route('/api/donations', methods=['POST'])
@rate_limit('donation_post', 10, 24 * 3600)
def add_donation():
    dons = read_json('donations')
    dons.append(request.json or {})
    write_json('donations', dons)
    return jsonify({'ok': True})

# --- VISITS ---
@app.route('/api/visits', methods=['GET'])
@admin_required
def get_visits():
    return jsonify(read_json('visits'))

@app.route('/api/visits', methods=['POST'])
@rate_limit('visit_post', 180, 24 * 3600)
def track_visit():
    visits = read_json('visits')
    data = request.json or {}
    country = data.get('country', '')
    if not country and request.remote_addr:
        try:
            ip = request.remote_addr
            with urllib.request.urlopen('http://ip-api.com/json/' + ip + '?fields=country', timeout=3) as resp:
                g = json.loads(resp.read())
                country = g.get('country', '')
        except Exception:
            pass
    visits.append({'date': data.get('date', ''), 'path': data.get('path', ''), 'articleId': data.get('articleId', ''), 'country': country})
    if len(visits) > 50000: visits = visits[-50000:]
    write_json('visits', visits)
    return jsonify({'ok': True})

@app.route('/api/visits/analytics', methods=['GET'])
@admin_required
def visit_analytics():
    period = request.args.get('period', 'all')
    raw = read_json('visits')
    art_list = read_json('articles')
    art_map = {str(a['id']): a['title'] for a in art_list}
    visits = []
    for v in raw:
        if isinstance(v, str):
            visits.append({'date': v, 'path': '', 'articleId': '', 'ip': ''})
        else:
            visits.append(v)
    now = time.time()
    cutoff_time = None
    if period == 'day':
        cutoff_time = now - 86400
    elif period == 'week':
        cutoff_time = now - 7 * 86400
    elif period == 'month':
        cutoff_time = now - 30 * 86400
    elif period == 'year':
        cutoff_time = now - 365 * 86400
    if cutoff_time:
        cutoff_str = time.strftime('%Y-%m-%dT%H:%M:%S', time.gmtime(cutoff_time))
        visits = [v for v in visits if v.get('date', '')[:19] >= cutoff_str]
    article_data = {}
    page_data = {}
    country_data = {}
    for v in visits:
        aid = v.get('articleId', '')
        path = v.get('path', '')
        country = v.get('country', '')
        if not country: country = 'Inconnu'
        if aid:
            article_data[aid] = article_data.get(aid, 0) + 1
        page_data[path] = page_data.get(path, 0) + 1
        country_data[country] = country_data.get(country, 0) + 1
    articles_out = []
    for aid, cnt in sorted(article_data.items(), key=lambda x: -x[1]):
        articles_out.append({'id': aid, 'title': art_map.get(aid, 'Article #' + aid), 'visits': cnt})
    pages_out = []
    for p, cnt in sorted(page_data.items(), key=lambda x: -x[1]):
        label = p or '/'
        if '/article' in label: label = 'Article (' + p + ')'
        elif label in ('/', '/index.html'): label = 'Accueil'
        else: label = label.replace('.html', '').replace('/', '')
        pages_out.append({'page': label, 'visits': cnt})
    countries_out = []
    for c, cnt in sorted(country_data.items(), key=lambda x: -x[1]):
        countries_out.append({'country': c, 'visits': cnt})
    days = {}
    for v in visits:
        d = v.get('date', '')[:10]
        if d: days[d] = days.get(d, 0) + 1
    day_labels = sorted(days.keys())
    day_data = [days[d] for d in day_labels]
    return jsonify({
        'total': len(visits),
        'articles': articles_out,
        'pages': pages_out,
        'countries': countries_out,
        'chart': {'labels': day_labels, 'data': day_data}
    })

# --- STATS ---
@app.route('/api/stats', methods=['GET'])
@admin_required
def get_stats():
    articles = len(read_json('articles'))
    comments = sum(len(read_json(f)) for f in os.listdir(DATA_DIR) if f.startswith('comments_'))
    subs = len(read_json('newsletter'))
    visitsData = read_json('visits')
    visits = len(visitsData)
    visitsList = [v if isinstance(v, str) else v.get('date', '') for v in visitsData]
    return jsonify({'articles': articles, 'comments': comments, 'subs': subs, 'visits': visits, 'visitsList': visitsList})

# --- AUTH ---
@app.route('/api/auth', methods=['POST'])
@rate_limit('auth_post', 8, 300)
def auth():
    d = request.json or {}
    name = ADMINS.get(d.get('pass', ''))
    if d.get('user') == 'admin' and name:
        return jsonify({'ok': True, 'name': name, 'token': d.get('pass', '')})
    return jsonify({'ok': False}), 401

# --- IMAGE UPLOAD ---
def compress_image(img_bytes, target_bytes=70000, max_dim=1200):
    if not HAS_PIL:
        return img_bytes
    try:
        img = Image.open(BytesIO(img_bytes))
        if img.mode in ('RGBA', 'P'): img = img.convert('RGB')
        w, h = img.size
        if w > max_dim or h > max_dim:
            ratio = min(max_dim / w, max_dim / h)
            w, h = int(w * ratio), int(h * ratio)
            img = img.resize((w, h), Image.LANCZOS)
        quality = 85
        output = BytesIO()
        while quality > 10:
            output.seek(0)
            output.truncate()
            img.save(output, 'JPEG', quality=quality, optimize=True)
            if output.tell() <= target_bytes:
                break
            quality -= 5
        return output.getvalue()
    except Exception:
        return img_bytes

@app.route('/api/upload', methods=['POST'])
@admin_required
def upload_image():
    data = request.json
    if not data or not data.get('image'):
        return jsonify({'error': 'no image'}), 400
    raw = data['image']
    if ',' in raw: raw = raw.split(',', 1)[1]
    ext = 'jpg'
    try:
        img_bytes = base64.b64decode(raw)
    except Exception:
        return jsonify({'error': 'invalid base64'}), 400
    img_bytes = compress_image(img_bytes, 70000)
    filename = str(uuid.uuid4()) + '.' + ext
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, 'wb') as f:
        f.write(img_bytes)
    return jsonify({'url': '/assets/uploads/' + filename})

# --- SEO ---
@app.route('/robots.txt')
def robots():
    base = request.host_url.rstrip('/')
    txt = ("User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n"
           "Disallow: /assets/uploads/\nSitemap: " + base + "/sitemap.xml\n")
    return Response(txt, mimetype='text/plain')

@app.route('/sitemap.xml')
def sitemap():
    base = request.host_url.rstrip('/')
    pages = [
        ('/', None),
        ('/index.html', None), ('/actualites.html', None), ('/qui-sommes-nous.html', None),
        ('/projets.html', None), ('/sensibilisation.html', None), ('/objets-perdus.html', None),
        ('/heritage.html', None), ('/faq.html', None), ('/donation.html', None), ('/page.html', None),
    ]
    lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for p, _d in pages:
        lines.append('<url><loc>' + base + p + '</loc></url>')
    lines.append('<url><loc>' + base + '/recherche</loc></url>')
    seen_cats = set()
    for a in read_json('articles'):
        slug = cat_slug(a.get('category'))
        if slug and slug not in seen_cats:
            seen_cats.add(slug)
            lines.append('<url><loc>' + base + '/categorie/' + slug + '</loc></url>')
    for a in read_json('articles'):
        aid = a.get('id')
        d = a.get('date', '') or ''
        lines.append('<url><loc>' + base + '/article?id=' + str(aid) + '</loc>' + (('<lastmod>' + d + '</lastmod>') if d else '') + '</url>')
    lines.append('</urlset>')
    return Response('\n'.join(lines), mimetype='application/xml')

# --- SERVE STATIC FILES ---
BASE = os.path.dirname(__file__)

@app.route('/article.html')
def redirect_article():
    aid = request.args.get('id')
    lang = request.args.get('lang')
    url = '/article?id=' + (aid or '')
    if lang:
        url += '&lang=' + lang
    return redirect(url)

@app.route('/article')
def serve_article_og():
    aid = request.args.get('id')
    lang = request.args.get('lang', 'fr')
    article = None
    if aid:
        for a in read_json('articles'):
            if str(a['id']) == str(aid):
                article = dict(a)
                apply_lang(article, lang)
                break
    html = open(os.path.join(BASE, 'article.html'), 'r', encoding='utf-8').read()
    if article:
        title = article.get('title', '')
        desc = article.get('excerpt', '')
        img = article.get('image', '')
        if img and img.startswith('data:'):
            img = ''
        if not img:
            img = request.host_url.rstrip('/') + '/assets/images/logo.png'
        if not img.startswith(('http://', 'https://')):
            img = request.host_url.rstrip('/') + '/' + img.lstrip('/')
        def safe(s):
            return s.replace('&', '&amp;').replace('"', '&quot;').replace('<', '&lt;').replace('>', '&gt;')
        stitle = safe(title)
        sdesc = safe(desc or "Chronique de James Mukeshaba - MÃ©dia d'information")
        site = request.host_url.rstrip('/')
        ld = {
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            'headline': title,
            'description': desc or '',
            'image': img,
            'datePublished': article.get('date', ''),
            'author': {'@type': 'Person', 'name': article.get('author', 'Chronique de James Mukeshaba')},
            'publisher': {'@type': 'Organization', 'name': 'Chronique de James Mukeshaba',
                          'logo': {'@type': 'ImageObject', 'url': site + '/assets/images/logo.png'}},
            'mainEntityOfPage': site + '/article?id=' + str(aid)
        }
        json_ld = '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False) + '</script>'
        og = f'''
<meta property="og:title" content="{stitle}">
<meta property="og:description" content="{sdesc}">
<meta property="og:image" content="{img}">
<meta property="og:url" content="{site}/article?id={aid}">
<meta property="og:type" content="article">
<meta name="twitter:card" content="summary_large_image">
{json_ld}
'''
        html = html.replace('<title>Article - Chronique de James Mukeshaba</title>', '<title>' + stitle + ' - Chronique de James Mukeshaba</title>' + og)
    return html

@app.route('/')
def serve_index():
    return send_from_directory(BASE, 'index.html')

@app.route('/recherche')
def serve_search_page():
    return send_from_directory(BASE, 'recherche.html')

@app.route('/categorie/<slug>')
def serve_categorie_page(slug):
    return send_from_directory(BASE, 'categorie.html')

@app.route('/<path:path>')
def serve_static(path):
    full = os.path.join(BASE, path)
    if os.path.isfile(full):
        return send_from_directory(BASE, path)
    if '.' in os.path.basename(path):
        return jsonify({'error': 'not found'}), 404
    return send_from_directory(BASE, 'index.html')

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=int(os.environ.get('PORT', '5000')), debug=(os.environ.get('FLASK_DEBUG', '0') == '1'))