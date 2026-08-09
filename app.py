import os, json, time, uuid, base64, urllib.request, hmac, hashlib, re, unicodedata, secrets, calendar
from io import BytesIO
from functools import wraps
from urllib.parse import quote
from flask import Flask, request, jsonify, send_from_directory, redirect, Response
import payments as pay

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

# --- SECURITY (authentification securisee) ---
_LEGACY_ADMINS = {
    'Shine2026':    'YAGIRWA GEDEON GUIDE',
    'Lufumica2026': 'LUFUNGULO MICHAEL',
    'Sergio2026':   'SERGE IRENGE',
    'Christvie2026':'MUKESHABA JAMES MPALA',
}
TOKEN_TTL = 12 * 3600
PBKDF2_ITER = 200000

def _hash_pass(password, salt=None):
    if not salt:
        salt = base64.urlsafe_b64encode(os.urandom(16)).decode().rstrip('=')
    dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), PBKDF2_ITER)
    return ('pbkdf2$%d$%s$%s' % (PBKDF2_ITER, salt, base64.urlsafe_b64encode(dk).decode().rstrip('=')))

_hash = _hash_pass

def _check_pass(password, stored):
    try:
        _, it, salt, dk = stored.split('$')
        dk2 = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), int(it))
        return hmac.compare_digest(base64.urlsafe_b64encode(dk2).decode().rstrip('='), dk)
    except Exception:
        return False

def _new_token():
    return secrets.token_urlsafe(28)

def load_admins():
    """Charge les comptes admin. A la premiere execution, migre les comptes legacy (haches PBKDF2)."""
    items = read_obj('admins', None)
    if items is None or not items.get('admins'):
        accounts = []
        for i, (pwd, name) in enumerate(_LEGACY_ADMINS.items(), 1):
            accounts.append({
                'id': i, 'user': 'admin', 'name': name,
                'pass_hash': _hash(pwd), 'pass_changed': '',
                'twofa': False, 'totp_secret': '',
                'recovery_codes': [_hash(secrets.token_urlsafe(9)) for _ in range(3)],
                'created': time.strftime('%Y-%m-%d'),
            })
        write_json('admins', {'admins': accounts})
        return accounts
    return items.get('admins')

def _save_admins(accounts):
    write_json('admins', {'admins': accounts})

def _grant_token(acct):
    token = _new_token()
    tokens = read_obj('admin_tokens', {})
    tokens[token] = {'user': acct.get('user'), 'name': acct.get('name'),
                     'exp': time.time() + TOKEN_TTL, 'created': time.time()}
    # purge des jetons expires
    now = time.time()
    tokens = {k: v for k, v in tokens.items() if v.get('exp', 0) > now}
    write_json('admin_tokens', tokens)
    return token

def admin_ok():
    t = request.headers.get('X-Admin-Token', '')
    if not t:
        return None
    tokens = read_obj('admin_tokens', {})
    entry = tokens.get(t)
    if not entry:
        return None
    if entry.get('exp', 0) < time.time():
        return None
    # fenetre glissante
    entry['exp'] = time.time() + TOKEN_TTL
    write_json('admin_tokens', tokens)
    return entry

def admin_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not admin_ok():
            return jsonify({'ok': False, 'error': 'non autorise'}), 401
        return f(*args, **kwargs)
    return wrapper

# --- TOTP (RFC 6238) : 2FA sans dependance externe ---
def totp_new_secret():
    return base64.b32encode(os.urandom(10)).decode().rstrip('=')

def totp_code(secret, t=None):
    key = base64.b32decode(secret.upper() + '=' * ((8 - len(secret) % 8) % 8))
    counter = int((t if t is not None else time.time()) // 30).to_bytes(8, 'big')
    h = hmac.new(key, counter, hashlib.sha1).digest()
    off = h[-1] & 0x0F
    code = ((h[off] & 0x7F) << 24 | (h[off + 1] & 0xFF) << 16 |
            (h[off + 2] & 0xFF) << 8 | (h[off + 3] & 0xFF))
    return ('%06d' % (code % 1000000))

def totp_valid(secret, code, drift=1):
    code = re.sub(r'\D', '', str(code or ''))
    if len(code) != 6 or not secret:
        return False
    now = int(time.time()) // 30
    return any(totp_code(secret, (now + d) * 30) == code for d in range(-drift, drift + 1))

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
    'societe': ('SociÃ©tÃ©', "Les faits divers, la vie sociale et les initiatives de la communautÃ©."),
    'sante': ('SantÃ©', "Ã‰pidÃ©mies, campagnes de prÃ©vention et actualitÃ© des structures de santÃ©."),
    'national': ('Nationale', "L'actualitÃ© du pays : institutions, Ã©ducation et gestion publique."),
    'education': ('Ã‰ducation', "Ã‰coles, examens d'Ã‰tat et vie acadÃ©mique des jeunes congolais."),
    'sport': ('Sport', "Football, Coupe du Monde et toutes les disciplines sportives."),
    'international': ('International', "L'actualitÃ© du monde vue depuis la RDC et les Grands Lacs."),
    'environnement': ('Environnement', "Climat, nature et initiatives de protection de l'environnement."),
    'securite': ('SÃ©curitÃ©', "SÃ©curitÃ© publique, insÃ©curitÃ© et mesures des autoritÃ©s."),
    'politique': ('Politique', "La vie politique et les dÃ©cisions des institutions du pays."),
    'culture': ('Culture', "Kermesses, arts, patrimoine et Ã©vÃ©nements culturels."),
    'enfance': ('Enfance', "La protection des droits de l'enfant et les campagnes associÃ©es."),
    'medias': ('MÃ©dias', "L'actualitÃ© des mÃ©dias et la lutte contre la dÃ©sinformation."),
    'religion': ('Religion', "Vie religieuse et communautÃ©s de foi."),
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
    return CATEGORIES.get(slug, (None, ''))[1] or "Articles de la catÃ©gorie Â« " + ((raw or slug).strip()) + " Â»."


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

# --- MEDIATHEQUE : upload / listing / suppression d'images ---
MEDIA_DIR = os.path.join(os.path.dirname(__file__), 'static', 'uploads')

def _media_meta():
    meta = {}
    try:
        if os.path.exists(os.path.join(BASE, 'server_data', 'media.json')):
            meta = json.load(open(os.path.join(BASE, 'server_data', 'media.json'), 'r', encoding='utf-8'))
    except Exception:
        meta = {}
    return meta

def _save_media_meta(meta):
    try:
        with open(os.path.join(BASE, 'server_data', 'media.json'), 'w', encoding='utf-8') as f:
            json.dump(meta, f, ensure_ascii=False, indent=2)
    except Exception:
        pass

@app.route('/api/media', methods=['POST'])
@admin_required
def media_upload():
    d = request.get_json(silent=True) or {}
    b64 = str(d.get('image') or '')
    if not b64 or ',' not in b64:
        return jsonify({'error': 'donnee image invalide'}), 400
    head, data = b64.split(',', 1)
    try:
        raw = base64.b64decode(data)
    except Exception:
        return jsonify({'error': 'base64 invalide'}), 400
    fmt = 'jpg'
    if 'png' in head: fmt = 'png'
    elif 'webp' in head: fmt = 'webp'
    elif 'gif' in head: fmt = 'gif'
    if len(raw) > 16 * 1024 * 1024:
        return jsonify({'error': 'fichier trop lourd (max 16 Mo)'}), 413
    fname = uuid.uuid4().hex + '.' + fmt
    os.makedirs(MEDIA_DIR, exist_ok=True)
    path = os.path.join(MEDIA_DIR, fname)
    try:
        with open(path, 'wb') as f:
            f.write(raw)
    except Exception as e:
        return jsonify({'error': 'ecriture impossible: ' + str(e)}), 500
    meta = _media_meta()
    meta[fname] = {'url': '/media/' + fname, 'name': fname, 'type': fmt,
                   'size': len(raw), 'created': time.time()}
    _save_media_meta(meta)
    return jsonify({'ok': True, 'url': '/media/' + fname})

@app.route('/api/media', methods=['GET'])
@admin_required
def media_list():
    q = (request.args.get('q') or '').strip().lower()
    media = []
    for fn, info in _media_meta().items():
        fnl = fn.lower()
        if q and q not in fnl:
            continue
        media.append(info)
    media.sort(key=lambda m: -m.get('created', 0))
    return jsonify(media)

@app.route('/api/media/<fname>', methods=['DELETE'])
@admin_required
def media_delete(fname):
    fname = os.path.basename(fname or '')
    if not fname:
        return jsonify({'error': 'fichier inconnu'}), 404
    path = os.path.join(MEDIA_DIR, fname)
    if os.path.exists(path):
        try:
            os.remove(path)
        except Exception:
            pass
    meta = _media_meta()
    meta.pop(fname, None)
    _save_media_meta(meta)
    return jsonify({'ok': True})

@app.route('/media/<path:fname>')
def media_serve(fname):
    return send_from_directory(MEDIA_DIR, os.path.basename(fname))

# --- STATUTS ARTICLES (publie / brouillon / programme / corbeille) ---
def _norm_status(a):
    st = str(a.get('status') or 'publie').strip().lower()
    return st if st in ('publie', 'brouillon', 'programme', 'corbeille') else 'publie'

def promote_scheduled():
    """Public automatiquement les articles programmes dont l'echeance est passee."""
    arts = read_json('articles')
    changed = False
    now = time.time()
    for a in arts:
        if _norm_status(a) == 'programme':
            try:
                st = float(a.get('scheduledAt') or 0)
            except (TypeError, ValueError):
                st = 0
            if st and st <= now:
                a['status'] = 'publie'
                a['scheduledAt'] = ''
                changed = True
    if changed:
        write_json('articles', arts)

def _public_articles():
    """Articles visibles du public (apres promotion des programmes echus)."""
    promote_scheduled()
    arts = read_json('articles')
    out = []
    for a in arts:
        if _norm_status(a) not in ('brouillon', 'programme', 'corbeille'):
            out.append(a)
    return out

def _sanitize_article(data):
    st = str(data.get('status') or 'publie').strip().lower()
    if st not in ('publie', 'brouillon', 'programme', 'corbeille'):
        st = 'publie'
    data['status'] = st
    scheduled = data.get('scheduledAt') or ''
    try:
        data['scheduledAt'] = float(scheduled) if str(scheduled).strip() else ''
    except (TypeError, ValueError):
        data['scheduledAt'] = ''
    tags = data.get('tags') or []
    if isinstance(tags, str):
        tags = [t.strip() for t in tags.split(',') if t.strip()]
    data['tags'] = [str(t)[:40] for t in tags[:20]]
    data['seoTitle'] = str(data.get('seoTitle') or '')[:200]
    data['seoDescription'] = str(data.get('seoDescription') or '')[:300]
    gal = data.get('gallery') or []
    if isinstance(gal, str):
        gal = [g.strip() for g in gal.splitlines() if g.strip()]
    data['gallery'] = [str(g)[:300] for g in gal[:20]]
    data['videoUrl'] = str(data.get('videoUrl') or '')[:300]
    return data

# --- ARTICLES ---
@app.route('/api/articles', methods=['GET'])
def get_articles():
    lang = request.args.get('lang', 'fr')
    articles = _public_articles()
    if lang and lang != 'fr':
        for a in articles:
            apply_lang(a, lang)
    return jsonify(articles)

@app.route('/api/articles/lite')
def get_articles_lite():
    lang = request.args.get('lang', 'fr')
    out = []
    for a in _public_articles():
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
    for a in _public_articles():
        if str(a.get('id')) == str(aid):
            cp = dict(a)
            apply_lang(cp, lang)
            return jsonify(cp)
    return jsonify({'error': 'not found'}), 404

@app.route('/api/articles', methods=['POST'])
@admin_required
def save_article():
    articles = read_json('articles')
    data = _sanitize_article(request.json or {})
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
    data = _sanitize_article(request.json or {})
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

@app.route('/api/admin/articles', methods=['GET'])
@admin_required
def admin_articles():
    promote_scheduled()
    return jsonify(read_json('articles'))

@app.route('/api/articles/<int:aid>/duplicate', methods=['POST'])
@admin_required
def duplicate_article(aid):
    arts = read_json('articles')
    for i, a in enumerate(arts):
        if a.get('id') == aid:
            cp = dict(a)
            cp['id'] = int(time.time() * 1000)
            cp['title'] = (a.get('title') or 'Article') + ' (copie)'
            cp['status'] = 'brouillon'
            cp['scheduledAt'] = ''
            cp['featured'] = False
            cp.pop('modified', None)
            arts.insert(i + 1, cp)
            write_json('articles', arts)
            return jsonify({'ok': True, 'id': cp['id']})
    return jsonify({'ok': False, 'error': 'article introuvable'}), 404

@app.route('/api/articles/<int:aid>/trash', methods=['POST'])
@admin_required
def trash_article(aid):
    arts = read_json('articles')
    for a in arts:
        if a.get('id') == aid:
            a['status'] = 'corbeille'
            a['scheduledAt'] = ''
            write_json('articles', arts)
            return jsonify({'ok': True})
    return jsonify({'ok': False, 'error': 'article introuvable'}), 404

@app.route('/api/articles/<int:aid>/restore', methods=['POST'])
@admin_required
def restore_article(aid):
    arts = read_json('articles')
    for a in arts:
        if a.get('id') == aid:
            a['status'] = 'publie'
            a['scheduledAt'] = ''
            write_json('articles', arts)
            return jsonify({'ok': True})
    return jsonify({'ok': False, 'error': 'article introuvable'}), 404

@app.route('/api/articles/<int:aid>/publish', methods=['POST'])
@admin_required
def publish_article_now(aid):
    arts = read_json('articles')
    for a in arts:
        if a.get('id') == aid:
            a['status'] = 'publie'
            a['scheduledAt'] = ''
            write_json('articles', arts)
            return jsonify({'ok': True})
    return jsonify({'ok': False, 'error': 'article introuvable'}), 404

@app.route('/api/categories')
def list_categories():
    cats = {}
    public_articles = _public_articles()
    for a in public_articles:
        slug = cat_slug(a.get('category'))
        cats[slug] = cats.get(slug, 0) + 1
    out = []
    for slug, count in sorted(cats.items(), key=lambda x: (-x[1], x[0])):
        raw = ''
        for a in public_articles:
            if cat_slug(a.get('category')) == slug:
                raw = a.get('category') or ''
                break
        out.append({'slug': slug, 'name': cat_display(slug, raw), 'count': count})
    return jsonify(out)


@app.route('/api/category/<slug>')
def get_category(slug):
    lang = request.args.get('lang', 'fr')
    articles = _public_articles()
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
    articles = _public_articles()
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

# --- POPULARITE (vues, lecture, partages, reactions, commentaires) ---
READ_MAX = 300

@app.route('/api/read', methods=['POST'])
@rate_limit('read_post', 200, 24 * 3600)
def track_read():
    d = request.json or {}
    aid = str(d.get('articleId') or '')
    seconds = int(d.get('seconds') or 0)
    if not aid or seconds <= 0:
        return jsonify({'ok': False, 'error': 'champs requis'}), 400
    seconds = min(seconds, READ_MAX)
    data = read_obj('reads', [])
    data.append({'a': aid, 's': seconds, 't': time.time()})
    if len(data) > 200000:
        data = data[-200000:]
    write_json('reads', data)
    return jsonify({'ok': True})

@app.route('/api/share', methods=['POST'])
@rate_limit('share_post', 60, 24 * 3600)
def track_share():
    d = request.json or {}
    aid = str(d.get('articleId') or '')
    channel = (d.get('channel') or 'other')[:20]
    if not aid:
        return jsonify({'ok': False, 'error': 'champs requis'}), 400
    data = read_obj('shares', [])
    data.append({'a': aid, 'c': channel, 't': time.time()})
    if len(data) > 100000:
        data = data[-100000:]
    write_json('shares', data)
    return jsonify({'ok': True})


def period_cutoff(period):
    now = time.time()
    if period == 'today':
        return now - (now % 86400)
    if period == 'week':
        return now - 7 * 86400
    if period == 'month':
        return now - 30 * 86400
    return None


@app.route('/api/popular')
def get_popular():
    lang = request.args.get('lang', 'fr')
    period = request.args.get('period', 'week')
    limit = min(int(request.args.get('limit', 20)), 50)
    cutoff = period_cutoff(period)
    views = {}
    for v in read_json('visits'):
        if not isinstance(v, dict):
            continue
        aid = str(v.get('articleId') or '')
        if not aid:
            continue
        d = v.get('date') or ''
        if cutoff is not None and (d[:19] < time.strftime('%Y-%m-%dT%H:%M:%S', time.gmtime(cutoff))):
            continue
        views[aid] = views.get(aid, 0) + 1
    read_secs = {}
    for r in read_obj('reads', []):
        if cutoff is not None and float(r.get('t', 0) or 0) < cutoff:
            continue
        aid = str(r.get('a') or '')
        read_secs[aid] = read_secs.get(aid, 0) + int(r.get('s') or 0)
    share_n = {}
    for s in read_obj('shares', []):
        if cutoff is not None and float(s.get('t', 0) or 0) < cutoff:
            continue
        aid = str(s.get('a') or '')
        share_n[aid] = share_n.get(aid, 0) + 1
    reactions = read_obj('reactions', {})
    comments_n = {}
    for f in os.listdir(DATA_DIR):
        if not f.startswith('comments_'):
            continue
        aid = f[len('comments_'):-5]
        for c in read_json(f[:-5]):
            if c.get('status') == 'hidden':
                continue
            d = str(c.get('date') or '')[:10]
            if cutoff is not None and d and d < time.strftime('%Y-%m-%d', time.gmtime(cutoff)):
                continue
            comments_n[aid] = comments_n.get(aid, 0) + 1
    scored = []
    for a in _public_articles():
        aid = str(a.get('id'))
        v = views.get(aid, 0)
        rd = read_secs.get(aid, 0)
        sh = share_n.get(aid, 0)
        rx = sum(int(x) for x in (reactions.get(aid) or {}).values())
        cm = comments_n.get(aid, 0)
        if not (v or rd or sh or rx or cm):
            continue
        score = v * 2 + (rd / 60.0) * 2 + sh * 10 + rx * 5 + cm * 8
        scored.append((score, aid))
    scored.sort(key=lambda x: -x[0])
    top = [aid for _, aid in scored[:limit]]
    out = []
    for a in _public_articles():
        aid = str(a.get('id'))
        if aid not in top:
            continue
        v = views.get(aid, 0)
        rd = read_secs.get(aid, 0)
        sh = share_n.get(aid, 0)
        rx = sum(int(x) for x in (reactions.get(aid) or {}).values())
        cm = comments_n.get(aid, 0)
        item = dict(article_lite(a, lang),
                    views=v, read_min=round(rd / 60.0, 1), shares=sh,
                    reactions=rx, comments=cm,
                    score=round(v * 2 + (rd / 60.0) * 2 + sh * 10 + rx * 5 + cm * 8, 1))
        out.append(item)
    order = {aid: i for i, aid in enumerate(top)}
    out.sort(key=lambda x: order.get(str(x.get('id')), 99))
    return jsonify({'period': period, 'items': out})

# --- SETTINGS (BREAKING NEWS) ---
DEFAULT_SETTINGS = {'breaking_news_enabled': True, 'breaking_article_id': None}

@app.route('/api/settings', methods=['GET'])
def get_settings():
    s = read_obj('settings', DEFAULT_SETTINGS)
    out = dict(DEFAULT_SETTINGS)
    out.update(s)
    out['breaking_article_id'] = out.get('breaking_article_id') or None
    if not out['breaking_article_id']:
        for a in _public_articles():
            if str(a.get('priority', '')).lower() == 'breaking':
                out['breaking_article_id'] = a.get('id')
                break
    if out['breaking_article_id']:
        for a in _public_articles():
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
    # Notification push automatique aux abonnes Breaking News
    try:
        if bool(d.get('breaking_news_enabled')) and d.get('breaking_article_id'):
            aid = d['breaking_article_id']
            for a in read_json('articles'):
                if a.get('id') == aid:
                    t = a.get('title') or ''
                    if t:
                        push_broadcast('Breaking News', t[:140], '/article?id=' + str(aid), 'breaking')
                    break
    except Exception:
        pass
    return jsonify({'ok': True})

# --- NEWSLETTER ---
@app.route('/api/newsletter', methods=['GET'])
@admin_required
def get_subscribers():
    raw = read_json('newsletter')
    out = []
    for s in raw:
        if isinstance(s, str):
            out.append({'email': s, 'name': '', 'categories': [], 'date': ''})
        else:
            out.append(s)
    return jsonify(out)

@app.route('/api/newsletter', methods=['POST'])
@rate_limit('newsletter_post', 10, 24 * 3600)
def subscribe():
    subs = read_json('newsletter')
    d = request.json or {}
    email = (d.get('email') or '').strip().lower()[:120]
    if not email or '@' not in email:
        return jsonify({'ok': False, 'error': 'email invalide'}), 400
    entry = {
        'email': email,
        'name': (d.get('name') or '').strip()[:60],
        'categories': [str(c).strip()[:40] for c in (d.get('categories') or [])][:8],
        'date': time.strftime('%Y-%m-%d'),
    }
    for i, s in enumerate(subs):
        cur = s if isinstance(s, str) else s.get('email', '')
        if cur.lower() == email:
            entry['date'] = (s.get('date') if isinstance(s, dict) else '') or entry['date']
            subs[i] = entry
            break
    else:
        subs.append(entry)
    write_json('newsletter', subs)
    return jsonify({'ok': True})

@app.route('/api/newsletter/<path:email>', methods=['DELETE'])
@admin_required
def delete_subscriber(email):
    email = email.lower()
    subs = [s for s in read_json('newsletter')
            if (s if isinstance(s, str) else s.get('email', '')).lower() != email]
    write_json('newsletter', subs)
    return jsonify({'ok': True})

# --- NOTIFICATIONS (WEB PUSH) ---
def webpush_send(sub, title, body, url=''):
    try:
        from pywebpush import webpush
    except Exception:
        return False
    try:
        info = read_obj('push', {})
        priv = info.get('vapid_private_key') or ''
        if not priv:
            return False
        payload = json.dumps({'title': title, 'body': body, 'url': url}, ensure_ascii=False)
        webpush(
            subscription_info={
                'endpoint': sub.get('endpoint', ''),
                'keys': {'p256dh': sub.get('p256dh', ''), 'auth': sub.get('auth', '')},
            },
            data=payload,
            vapid_private_key=priv,
            vapid_claims={'sub': 'mailto:contact@chroniquedejamesmukeshaba.com'},
        )
        return True
    except Exception:
        return False


def push_broadcast(title, body, url='', scope=None):
    sent = 0
    for s in read_json('notifications'):
        if not s.get('endpoint'):
            continue
        prefs = s.get('prefs') or {}
        if scope == 'news' and not prefs.get('news'):
            continue
        if scope == 'breaking' and not prefs.get('breaking'):
            continue
        if scope == 'rdc' and not prefs.get('rdc'):
            continue
        if scope == 'international' and not prefs.get('international'):
            continue
        if webpush_send(s, title, body, url):
            sent += 1
    return sent


@app.route('/api/push/status', methods=['GET'])
@admin_required
def push_status():
    try:
        import pywebpush
        available = True
    except Exception:
        available = False
    info = read_obj('push', {})
    return jsonify({
        'available': available,
        'vapid_configured': bool(info.get('vapid_private_key')),
        'vapid_public_key': info.get('vapid_public_key') or '',
    })


@app.route('/api/push/setup', methods=['POST'])
@rate_limit('push_setup', 10, 24 * 3600)
def push_setup():
    try:
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.primitives.asymmetric import ec
    except Exception:
        return jsonify({'ok': False, 'error': 'push indisponible'}), 501
    info = read_obj('push', {})
    if not info.get('vapid_private_key'):
        try:
            private_key = ec.generate_private_key(ec.SECP256R1())
            priv_pem = private_key.private_bytes(
                serialization.Encoding.PEM,
                serialization.PrivateFormat.PKCS8,
                serialization.NoEncryption()).decode().replace('\n', '')
            public_key = private_key.public_key().public_bytes(
                serialization.Encoding.X962,
                serialization.PublicFormat.UncompressedPoint).hex()
            info['vapid_private_key'] = priv_pem
            info['vapid_public_key'] = public_key
            write_json('push', info)
        except Exception:
            return jsonify({'ok': False, 'error': 'generation impossible'}), 500
    return jsonify({'ok': True, 'vapid_public_key': info['vapid_public_key']})


@app.route('/api/notifications', methods=['POST'])
@rate_limit('notif_post', 20, 24 * 3600)
def save_notification_prefs():
    d = request.json or {}
    entry = {
        'id': int(time.time() * 1000),
        'name': (d.get('name') or '').strip()[:60],
        'email': (d.get('email') or '').strip().lower()[:120],
        'prefs': {
            'news': bool(d.get('news', False)),
            'breaking': bool(d.get('breaking', False)),
            'rdc': bool(d.get('rdc', False)),
            'international': bool(d.get('international', False)),
        },
        'endpoint': (d.get('endpoint') or '').strip()[:500],
        'p256dh': (d.get('p256dh') or '').strip()[:500],
        'auth': (d.get('auth') or '').strip()[:200],
        'created': time.strftime('%Y-%m-%dT%H:%M:%S'),
    }
    subs = read_json('notifications')
    for i, s in enumerate(subs):
        same = (entry['endpoint'] and s.get('endpoint') == entry['endpoint']) or \
               (entry['email'] and s.get('email') == entry['email'])
        if same:
            entry['id'] = s['id']
            subs[i] = entry
            break
    else:
        subs.append(entry)
    write_json('notifications', subs)
    return jsonify({'ok': True, 'id': entry['id']})

@app.route('/api/notifications', methods=['GET'])
@admin_required
def list_notifications():
    out = []
    for s in read_json('notifications'):
        cp = dict(s)
        if cp.get('endpoint'):
            cp['endpoint'] = cp['endpoint'][:64] + ('...' if len(cp['endpoint']) > 64 else '')
        out.append(cp)
    return jsonify(out)

@app.route('/api/notifications/<int:nid>', methods=['DELETE'])
@admin_required
def delete_notification(nid):
    subs = [s for s in read_json('notifications') if s.get('id') != nid]
    write_json('notifications', subs)
    return jsonify({'ok': True})

@app.route('/api/push/send', methods=['POST'])
@admin_required
def push_send():
    d = request.json or {}
    title = (d.get('title') or '').strip()[:120]
    body = (d.get('body') or '').strip()[:300]
    url = (d.get('url') or '').strip()[:300]
    scope = (d.get('scope') or '')[:20]
    if not title:
        return jsonify({'ok': False, 'error': 'titre requis'}), 400
    sent = push_broadcast(title, body, url, scope or None)
    return jsonify({'ok': True, 'sent': sent})

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
def _sanitize_campaign(data):
    """Normalise les champs financiers / dates d'une campagne."""
    clean = {}
    for k in ('id', 'title', 'description', 'image', 'status', 'createdAt', 'archivedAt', 'speed', 'type'):
        if k in data and data[k] is not None:
            clean[k] = data[k]
    try:
        clean['goal'] = round(min(max(float(data.get('goal') or 0), 0), 1e9), 2)
    except (TypeError, ValueError):
        clean['goal'] = 0.0
    try:
        clean['collected'] = round(min(max(float(data.get('collected') or 0), 0), 1e9), 2)
    except (TypeError, ValueError):
        clean['collected'] = 0.0
    for k in ('startDate', 'endDate'):
        v = data.get(k)
        clean[k] = v if isinstance(v, str) and len(v) <= 40 else ''
    if clean.get('status') not in ('active', 'paused', 'ended', 'archived'):
        clean['status'] = 'active'
    return clean


def _campaign_progress(c, donations=None):
    """Ajoute la barre de progression et le nombre de dons confirmes."""
    out = dict(c)
    goal = float(c.get('goal') or 0)
    col = float(c.get('collected') or 0)
    out['progress'] = round(min(col / goal * 100, 100), 1) if goal > 0 else 0.0
    out['remaining'] = round(max(goal - col, 0), 2) if goal > 0 else 0.0
    if donations is not None:
        out['donationCount'] = sum(1 for d in donations
                                   if d.get('campaignId') == c.get('id') and d.get('status') == 'confirmed')
    return out


@app.route('/api/campaigns', methods=['GET'])
def get_campaigns():
    campaigns = read_json('campaigns')
    donations = read_json('donations')
    return jsonify([_campaign_progress(c, donations) for c in campaigns])

@app.route('/api/campaigns', methods=['POST'])
@admin_required
def save_campaign():
    campaigns = read_json('campaigns')
    data = _sanitize_campaign(request.json or {})
    if data.get('id'):
        for i, c in enumerate(campaigns):
            if c['id'] == data['id']:
                data['collected'] = float(c.get('collected') or 0)
                data['createdAt'] = c.get('createdAt', '')
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
    data = _sanitize_campaign(request.json or {})
    data['id'] = cid
    for i, c in enumerate(campaigns):
        if c['id'] == cid:
            data['collected'] = float(data.get('collected', c.get('collected') or 0))
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

# --- DONATIONS (intentions de don securisees) ---
def _find_donation(txn_id):
    for d in read_json('donations'):
        if d.get('txn_id') == txn_id:
            return d
    return None

def _valid_donation_payload(data, required_key=True):
    """Validation serveur d'un don : montant borne, infos obligatoires."""
    errors = {}
    try:
        amount = float(data.get('amount'))
    except (TypeError, ValueError):
        errors['amount'] = 'Montant invalide.'
    else:
        amount = round(amount, 2)
        if not (1 <= amount <= 100000):
            errors['amount'] = 'Le montant doit etre compris entre 1 et 100000 USD.'
    for field, label in (('campaignId', 'campagne'), ('name', 'nom'), ('email', 'email'), ('method', 'methode de paiement')):
        if not str(data.get(field) or '').strip():
            errors[field] = 'Le champ "%s" est obligatoire.' % label
    if required_key and not str(data.get('idempotency_key') or '').strip():
        errors['idempotency_key'] = 'Cle d idempotence manquante.'
    email = str(data.get('email') or '')
    if email and not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', email):
        errors['email'] = 'Adresse email invalide.'
    return errors, amount

@app.route('/api/donations', methods=['GET'])
@admin_required
def get_donations():
    return jsonify(read_json('donations'))

@app.route('/api/donations', methods=['POST'])
@rate_limit('donation_post', 10, 24 * 3600)
def add_donation():
    """Cree une INTENTION de don. Aucun credit n'est applique ici :
    la campagne ne sera creditee qu'apres confirmation serveur (webhook/verify).
    """
    data = (request.json or {})
    errors, amount = _valid_donation_payload(data)
    if errors:
        return jsonify({'ok': False, 'errors': errors}), 400

    # Idempotence : une cle deja utilisee (meme si le don a echoue) est refusee,
    # ce qui protege contre les doublons de formulaire et les doubles paiements.
    idem = data['idempotency_key'].strip()[:80]
    for d in read_json('donations'):
        if d.get('idempotency_key') == idem:
            return jsonify({'ok': False, 'errors': {'idempotency_key': 'Demande deja traitee. Merci de recharger la page.'}}), 409

    try:
        campaign_id = int(str(data.get('campaignId') or '').strip() or 0)
    except (TypeError, ValueError):
        campaign_id = None
    campaign = next((c for c in read_json('campaigns') if c['id'] == campaign_id), None)
    if not campaign:
        return jsonify({'ok': False, 'errors': {'campaignId': 'Campagne introuvable.'}}), 404
    if campaign.get('status') not in ('active',):
        return jsonify({'ok': False, 'errors': {'campaignId': 'Cette campagne est terminee ou en pause.'}}), 409

    method = str(data.get('method') or '').strip()[:40]
    allowed = {p['id'] for p in pay.PROVIDERS}
    if method not in allowed:
        return jsonify({'ok': False, 'errors': {'method': 'Moyen de paiement inconnu.'}}), 400

    txn_id = 'DON-' + time.strftime('%Y%m%d%H%M%S', time.gmtime()) + '-' + uuid.uuid4().hex[:10].upper()
    donation = {
        'txn_id': txn_id,
        'idempotency_key': idem,
        'amount': amount,
        'currency': 'USD',
        'name': str(data.get('name') or '').strip()[:120],
        'email': str(data.get('email') or '').strip()[:200],
        'message': str(data.get('message') or '').strip()[:1000],
        'method': method,
        'campaignId': campaign_id,
        'status': 'pending',
        'createdAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'confirmedAt': '',
        'provider_txn_id': '',
        'ip': request.headers.get('X-Forwarded-For', '').split(',')[0].strip() or request.remote_addr or '',
    }
    dons = read_json('donations')
    dons.append(donation)
    write_json('donations', dons)
    pay.log_event(read_json, write_json, 'donation_intent', {'txn_id': txn_id, 'amount': amount, 'method': method,
                                                  'campaign_id': donation['campaignId']})
    return jsonify({'ok': True, 'txn_id': txn_id, 'idempotency_key': idem})

def _confirm_donation(txn_id, provider_status='confirmed', provider_txn_id=''):
    """Confirmation COTE SERVEUR d'un don. Idempotent : la campagne n'est
    creditee qu'une seule fois, uniquement lors du passage pending -> confirmed.
    """
    dons = read_json('donations')
    don = next((d for d in dons if d.get('txn_id') == txn_id), None)
    if not don:
        return {'ok': False, 'error': 'transaction inconnue'}
    if don.get('status') != 'pending':
        return {'ok': True, 'already_processed': True}
    don['status'] = 'confirmed'
    don['confirmedAt'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    don['provider_status'] = str(provider_status)[:80]
    if provider_txn_id:
        don['provider_txn_id'] = str(provider_txn_id)[:120]
    write_json('donations', dons)

    # Credit unique de la campagne (protections anti-double-paiement).
    campaigns = read_json('campaigns')
    for c in campaigns:
        if c['id'] == don.get('campaignId'):
            c['collected'] = round(float(c.get('collected') or 0) + float(don.get('amount') or 0), 2)
            break
    write_json('campaigns', campaigns)
    pay.log_event(read_json, write_json, 'donation_confirmed', {'txn_id': txn_id, 'amount': don.get('amount'),
                                                     'campaign_id': don.get('campaignId')})
    return {'ok': True}

# --- PAIEMENTS : initiation, webhooks, verification, configuration ---
@app.route('/api/payments/methods', methods=['GET'])
def payment_methods():
    """Methodes disponibles pour le public (aucun secret expose)."""
    return jsonify(pay.public_config(read_json))

@app.route('/api/payments/init', methods=['POST'])
@rate_limit('payment_init', 20, 3600)
def payment_init():
    """Initie le paiement aupres du prestataire (appel serveur). Le retrait
    navigateur est IGNORE comme preuve de succes : seule la confirmation
    serveur (webhook ou verify) fera office de preuve.
    """
    data = request.json or {}
    txn_id = str(data.get('txn_id') or '')
    don = _find_donation(txn_id)
    if not don:
        return jsonify({'ok': False, 'error': 'transaction inconnue'}), 404
    if don.get('status') != 'pending':
        return jsonify({'ok': False, 'error': 'transaction deja traitee'}), 409
    try:
        adapter = pay.get_adapter(read_json, don.get('method'))
        result = adapter.init_payment(don)
        provider_txn_id = str(result.get('provider_txn_id') or '')[:120]
        if provider_txn_id:
            dons = read_json('donations')
            for d in dons:
                if d['txn_id'] == txn_id:
                    d['provider_txn_id'] = provider_txn_id
            write_json('donations', dons)
        pay.log_event(read_json, write_json, 'payment_initiated', {'txn_id': txn_id, 'method': don.get('method'),
                                                        'provider_txn_id': provider_txn_id})
        return jsonify({'ok': True, 'redirect_url': result.get('redirect_url') or '',
                        'provider_txn_id': provider_txn_id})
    except pay.PaymentError as e:
        pay.log_event(read_json, write_json, 'payment_init_failed', {'txn_id': txn_id, 'method': don.get('method'),
                                                          'error': e.code})
        return jsonify({'ok': False, 'error': e.msg, 'code': e.code}), 402 if e.code == 'payment_unavailable' else 400

@app.route('/api/payments/webhook/<provider>', methods=['POST'])
def payment_webhook(provider):
    """Webhook signe du prestataire : SEULE source de confirmation officielle."""
    if provider not in pay.ADAPTERS:
        return jsonify({'error': 'unknown provider'}), 404
    signature = (request.headers.get('X-Signature') or request.headers.get('X-Paypal-Signature') or '').strip()
    raw = request.get_data(cache=False)
    try:
        pay.verify_webhook_signature(read_json, provider, raw, signature)
    except pay.PaymentError as e:
        pay.log_event(read_json, write_json, 'webhook_bad_signature', {'provider': provider, 'error': e.code})
        return jsonify({'error': 'signature invalide'}), 401

    # Mapping du payload propre a chaque prestataire -> txn serveur.
    try:
        body = json.loads(raw or b'{}')
    except Exception:
        body = {}
    provider_txn_id = (body.get('id') or body.get('provider_txn_id') or
                       (body.get('resource') or {}).get('id') or
                       (body.get('purchase_units') or [{}])[0].get('payments', {}).get('captures', [{}])[0].get('id') or '')
    txn_id = (body.get('custom_id') or body.get('reference') or body.get('invoice_id') or '').strip()
    if not txn_id:
        root = str(body.get('txn_id') or '')
        if root.startswith('DON-'):
            txn_id = root  # certains prestataires renvoient la reference serveur a la racine
    if not txn_id or not _find_donation(txn_id):
        pay.log_event(read_json, write_json, 'webhook_unknown_txn', {'provider': provider, 'txn': txn_id})
        return jsonify({'ok': True})  # jamais d'erreur au webhook : reponse 2xx pour arrete les retries
    pay.log_event(read_json, write_json, 'webhook_received', {'provider': provider, 'txn': txn_id,
                                                   'provider_txn': str(provider_txn_id)[:120]})
    res = _confirm_donation(txn_id, provider_status='confirmed', provider_txn_id=provider_txn_id)
    return jsonify(res)

@app.route('/api/payments/verify', methods=['POST'])
@rate_limit('payment_verify', 20, 3600)
def payment_verify():
    """Verification serveur du statut aupres du prestataire (methode de secours
    pour les flux sans webhook, ou apres retour de la page de paiement)."""
    data = request.json or {}
    txn_id = str(data.get('txn_id') or '')
    don = _find_donation(txn_id)
    if not don:
        return jsonify({'ok': False, 'error': 'transaction inconnue'}), 404
    if don.get('status') == 'confirmed':
        return jsonify({'ok': True, 'status': 'confirmed'})
    if don.get('status') in ('failed', 'cancelled'):
        return jsonify({'ok': True, 'status': don['status']})
    if not don.get('provider_txn_id'):
        return jsonify({'ok': True, 'status': don.get('status', 'pending')})
    try:
        adapter = pay.get_adapter(read_json, don.get('method'))
        status = adapter.verify_txn(don['provider_txn_id'])
        if str(status.get('status') or '').upper() in ('COMPLETED', 'SUCCESS', 'APPROVED', 'CAPTURED', 'SUCCESSFUL'):
            res = _confirm_donation(txn_id, provider_status=status.get('status'),
                                    provider_txn_id=don['provider_txn_id'])
            return jsonify({'ok': True, 'status': 'confirmed'})
        pay.log_event(read_json, write_json, 'payment_verify_pending', {'txn_id': txn_id, 'status': status.get('status')})
        return jsonify({'ok': True, 'status': str(status.get('status') or 'pending')})
    except pay.PaymentError as e:
        return jsonify({'ok': False, 'error': e.msg, 'code': e.code}), 400

@app.route('/api/payments/log', methods=['GET'])
@admin_required
def get_payment_log():
    """Journal d'audit des paiements (append-only)."""
    logs = read_json(pay.LOG_FILE)
    return jsonify(list(reversed(logs)) if isinstance(logs, list) else [])

@app.route('/api/payments/config', methods=['GET'])
@admin_required
def get_payment_config():
    """Config de paiement pour l'admin : les secrets ne sont JAMAIS renvoyes."""
    cfg = pay.config_snapshot(read_json)
    out = {'mode': cfg.get('mode', 'sandbox')}
    providers = {}
    for pid, p in cfg.get('providers', {}).items():
        providers[pid] = {k: (v if k != 'client_secret' and k != 'webhook_secret' and k != 'api_key'
                              else ('*****' if v else ''))
                          for k, v in p.items()}
    out['providers'] = providers
    return jsonify(out)

@app.route('/api/payments/config', methods=['POST'])
@admin_required
def set_payment_config():
    data = request.json or {}
    cfg = pay.config_snapshot(read_json)
    if data.get('mode') in ('sandbox', 'live'):
        cfg['mode'] = data['mode']
    providers = data.get('providers') or {}
    for pid, p in providers.items():
        if pid not in cfg.get('providers', {}):
            continue
        cur = cfg['providers'][pid]
        for k, v in p.items():
            if k in ('client_secret', 'webhook_secret', 'api_key') and v == '*****':
                continue  # ne pas ecraser un secret par un masque
            cur[k] = v
        cur['enabled'] = bool(p.get('enabled'))
    write_json('payments_config', cfg)
    try:
        p = os.path.join(DATA_DIR, 'payments_config.json')
        if os.path.exists(p):
            os.chmod(p, 0o600)
    except OSError:
        pass
    pay.log_event(read_json, write_json, 'payment_config_updated', {'mode': cfg.get('mode')})
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
    visits.append({'date': data.get('date', ''), 'path': data.get('path', ''), 'articleId': data.get('articleId', ''),
                   'country': country,
                   'ip': request.headers.get('X-Forwarded-For', '').split(',')[0].strip() or request.remote_addr or '',
                   'ua': (request.headers.get('User-Agent') or '')[:200],
                   'ref': (data.get('ref') or '')[:300]})
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

# --- ANALYTICS AVANCEES (tableau de bord + par article) ---
def _visit_epoch(v):
    d = v if isinstance(v, str) else (v.get('date') or '') if isinstance(v, dict) else ''
    if not d:
        return None
    try:
        return calendar.timegm(time.strptime(d[:19], '%Y-%m-%dT%H:%M:%S'))
    except Exception:
        return None

def _detect_device(ua):
    ua = (ua or '').lower()
    if not ua:
        return 'inconnu'
    if 'mobile' in ua or 'android' in ua:
        return 'mobile'
    if 'ipad' in ua or 'tablet' in ua:
        return 'tablette'
    return 'ordinateur'

def _detect_browser(ua):
    ua = (ua or '').lower()
    if 'edg' in ua:
        return 'Edge'
    if 'firefox' in ua:
        return 'Firefox'
    if 'chrome' in ua or 'crios' in ua:
        return 'Chrome'
    if 'safari' in ua:
        return 'Safari'
    return 'Autre'

def _classify_source(ref):
    r = (ref or '').lower()
    if not r:
        return 'Direct'
    for k in ('facebook', 'twitter', 'x.com', 'whatsapp', 'instagram', 'telegram', 'tiktok', 'linkedin'):
        if k in r:
            return 'Reseaux sociaux'
    for k in ('google', 'bing', 'yahoo', 'duckduckgo'):
        if k in r:
            return 'Moteurs de recherche'
    return 'Autres sites'

@app.route('/api/analytics/overview', methods=['GET'])
@admin_required
def analytics_overview():
    period = request.args.get('period', '30d')
    days = {'7d': 7, '30d': 30, '90d': 90, '12m': 365}.get(period, 30)
    cutoff = time.time() - days * 86400
    raw_visits = read_json('visits')
    visits = []
    for v in raw_visits:
        e = _visit_epoch(v)
        if e is not None and e >= cutoff:
            visits.append(v)
    art_list = read_json('articles')
    art_map = {str(a['id']): a for a in art_list}
    uniq = set()
    dev, brw, src = {}, {}, {}
    countries = {}
    cat_visits = {}
    art_visits = {}
    art_uniq = {}
    for v in visits:
        if not isinstance(v, dict):
            continue
        ip = (v.get('ip') or '').strip()
        if ip:
            uniq.add(ip)
        dk = _detect_device(v.get('ua', ''))
        dev[dk] = dev.get(dk, 0) + 1
        bk = _detect_browser(v.get('ua', ''))
        brw[bk] = brw.get(bk, 0) + 1
        sk = _classify_source(v.get('ref', ''))
        src[sk] = src.get(sk, 0) + 1
        c = v.get('country') or 'Inconnu'
        countries[c] = countries.get(c, 0) + 1
        aid = v.get('articleId', '')
        if aid:
            art_visits[aid] = art_visits.get(aid, 0) + 1
            art_uniq.setdefault(aid, set()).add(ip) if ip else None
            cat = ((art_map.get(aid) or {}).get('category') or 'Autre').strip()
            cat_visits[cat] = cat_visits.get(cat, 0) + 1
    reads_all = read_json('reads')
    shares_all = read_json('shares')
    read_n = read_sec = shares_n = 0
    art_reads = {}
    for r in reads_all:
        if float(r.get('t', 0)) >= cutoff:
            read_n += 1
            sec = int(r.get('s', 0))
            read_sec += sec
            art_reads.setdefault(r.get('a', ''), []).append(sec)
    art_shares = {}
    for s in shares_all:
        if float(s.get('t', 0)) >= cutoff:
            shares_n += 1
            a = s.get('a', '')
            art_shares[a] = art_shares.get(a, 0) + 1
    reactions = read_obj('reactions', {})
    reactions_total = sum(sum(v.values()) for v in reactions.values() if isinstance(v, dict))
    comments_total = 0
    for f in os.listdir(DATA_DIR):
        if f.startswith('comments_'):
            comments_total += len(read_json(f[:-5]))
    top = []
    for aid, cnt in sorted(art_visits.items(), key=lambda x: -x[1])[:8]:
        a = art_map.get(aid) or {}
        rs = art_reads.get(aid, [])
        top.append({
            'id': aid,
            'title': (a.get('title') or 'Article #' + aid)[:80],
            'category': (a.get('category') or 'Autre').strip(),
            'visits': cnt,
            'uniques': len(art_uniq.get(aid, set())),
            'readers': len(rs),
            'readMinutes': round(sum(rs) / 60.0, 1),
            'avgReadSec': round(sum(rs) / len(rs)) if rs else 0,
            'shares': art_shares.get(aid, 0),
            'reactions': sum(v for v in (reactions.get(aid) or {}).values()),
            'comments': len(read_json('comments_' + aid)),
        })
    now = time.time()
    today_start = now - (now % 86400)
    labels, sv, su = [], [], []
    # index des visites par jour (un seul passage au lieu de jours x visites)
    day_visits = {}
    for v in visits:
        if not isinstance(v, dict):
            continue
        e = _visit_epoch(v)
        if e is None:
            continue
        key = int(e // 86400)
        day_visits.setdefault(key, {'cnt': 0, 'ips': set()})
        day_visits[key]['cnt'] += 1
        ip = (v.get('ip') or '').strip()
        if ip:
            day_visits[key]['ips'].add(ip)
    for i in range(days - 1, -1, -1):
        start = today_start - i * 86400
        labels.append(time.strftime('%d/%m', time.gmtime(start)))
        d = day_visits.get(int(start // 86400))
        sv.append(d['cnt'] if d else 0)
        su.append(len(d['ips']) if d else 0)
    return jsonify({
        'period': period,
        'totals': {
            'visits': len(visits), 'uniques': len(uniq), 'readers': read_n,
            'readSeconds': read_sec, 'avgReadSec': round(read_sec / read_n) if read_n else 0,
            'shares': shares_n, 'reactions': reactions_total, 'comments': comments_total,
            'subs': len(read_json('newsletter')), 'donations': len(read_json('donations')),
            'articles': len(art_list),
        },
        'series': {'labels': labels, 'visits': sv, 'uniques': su},
        'topArticles': top,
        'topCategories': sorted([{'category': k, 'visits': v} for k, v in cat_visits.items()], key=lambda x: -x['visits'])[:8],
        'countries': sorted([{'country': k, 'visits': v} for k, v in countries.items()], key=lambda x: -x['visits'])[:8],
        'devices': sorted([{'name': k, 'count': v} for k, v in dev.items()], key=lambda x: -x['count']),
        'browsers': sorted([{'name': k, 'count': v} for k, v in brw.items()], key=lambda x: -x['count']),
        'sources': sorted([{'name': k, 'count': v} for k, v in src.items()], key=lambda x: -x['count']),
    })

@app.route('/api/analytics/<int:article_id>', methods=['GET'])
@admin_required
def analytics_article(article_id):
    aid = str(article_id)
    art_list = read_json('articles')
    art = next((a for a in art_list if str(a['id']) == aid), None)
    if not art:
        return jsonify({'ok': False, 'error': 'article introuvable'}), 404
    page = max(1, int(request.args.get('page', 1)))
    per = min(max(int(request.args.get('per', 25)), 5), 100)
    raw_visits = read_json('visits')
    visits = []
    for v in raw_visits:
        if isinstance(v, dict) and v.get('articleId') == aid:
            e = _visit_epoch(v)
            if e is not None:
                w = dict(v)
                w['_e'] = e
                visits.append(w)
    total = len(visits)
    uniq = set()
    countries = {}
    dev = {}
    for v in visits:
        ip = (v.get('ip') or '').strip()
        if ip:
            uniq.add(ip)
        c = v.get('country') or 'Inconnu'
        countries[c] = countries.get(c, 0) + 1
        dk = _detect_device(v.get('ua', ''))
        dev[dk] = dev.get(dk, 0) + 1
    reads = [int(r.get('s', 0)) for r in read_json('reads') if r.get('a') == aid]
    read_sec = sum(reads)
    shares = [s for s in read_json('shares') if s.get('a') == aid]
    reactions = read_obj('reactions', {})
    react = reactions.get(aid, {})
    views_react = sum(v for v in react.values() if isinstance(v, int))
    comments = len(read_json('comments_' + aid))
    now = time.time()
    today_start = now - (now % 86400)
    labels, sv, su = [], [], []
    for i in range(29, -1, -1):
        start = today_start - i * 86400
        end = start + 86400
        labels.append(time.strftime('%d/%m', time.gmtime(start)))
        cnt, ips = 0, set()
        for v in visits:
            e = v.get('_e', 0)
            if e >= start and e < end:
                cnt += 1
                ip = (v.get('ip') or '').strip()
                if ip:
                    ips.add(ip)
        sv.append(cnt)
        su.append(len(ips))
    exit_rate = visit_sess = exit_sess = 0
    if total:
        by_ip = {}
        for v in raw_visits:
            if not isinstance(v, dict):
                continue
            ip = (v.get('ip') or '').strip()
            e = _visit_epoch(v)
            if not ip or e is None:
                continue
            by_ip.setdefault(ip, []).append((e, v.get('articleId', '')))
        for ip, lst in by_ip.items():
            lst.sort()
            cur = None
            a_last = ''
            sess_aids = set()
            for e, a in lst:
                if cur is not None and e - cur > 1800:
                    if aid in sess_aids:
                        visit_sess += 1
                        if a_last == aid:
                            exit_sess += 1
                    sess_aids = set()
                sess_aids.add(a)
                a_last = a
                cur = e
            if sess_aids and aid in sess_aids:
                visit_sess += 1
                if a_last == aid:
                    exit_sess += 1
        exit_rate = round(100.0 * exit_sess / visit_sess, 1) if visit_sess else 0
    else:
        exit_rate = 0
    ordered = sorted(visits, key=lambda x: -x.get('_e', 0))
    total_pages = max(1, -(-total // per))
    page = min(page, total_pages)
    start_i = (page - 1) * per
    views_out = []
    for v in ordered[start_i:start_i + per]:
        views_out.append({
            'date': time.strftime('%d/%m/%Y %H:%M', time.gmtime(v.get('_e', 0))),
            'country': v.get('country') or 'Inconnu',
            'device': _detect_device(v.get('ua', '')),
            'browser': _detect_browser(v.get('ua', '')),
            'source': _classify_source(v.get('ref', '')),
        })
    channels = {}
    for s in shares:
        ch = s.get('c', 'autre')
        channels[ch] = channels.get(ch, 0) + 1
    return jsonify({
        'article': {'id': aid, 'title': art.get('title'), 'category': art.get('category'), 'date': art.get('date')},
        'totals': {
            'visits': total, 'uniques': len(uniq), 'readers': len(reads),
            'readSeconds': read_sec, 'avgReadSec': round(read_sec / len(reads)) if reads else 0,
            'shares': len(shares), 'reactions': views_react, 'comments': comments, 'exitRate': exit_rate,
        },
        'series': {'labels': labels, 'visits': sv, 'uniques': su},
        'readHistogram': [
            len([r for r in reads if r < 10]), len([r for r in reads if 10 <= r < 30]),
            len([r for r in reads if 30 <= r < 60]), len([r for r in reads if 60 <= r < 180]),
            len([r for r in reads if r >= 180]),
        ],
        'countries': sorted([{'country': k, 'visits': v} for k, v in countries.items()], key=lambda x: -x['visits'])[:6],
        'devices': sorted([{'name': k, 'count': v} for k, v in dev.items()], key=lambda x: -x['count']),
        'shareChannels': sorted([{'name': k, 'count': v} for k, v in channels.items()], key=lambda x: -x['count']),
        'views': {'page': page, 'per': per, 'total': total, 'totalPages': total_pages, 'items': views_out},
    })

# --- AUTH ---
# --- AUTH: connexion, deconnexion, mot de passe, recuperation, 2FA ---
AUTH_FAILS = {}
AUTH_MAX_FAILS = 5
AUTH_LOCK_WINDOW = 900  # 15 minutes

def _lock_info(ip):
    """Retourne (verrouille, nb de fautes enregistrees)."""
    now = time.time()
    fails = [t for t in AUTH_FAILS.get(ip, []) if now - t < AUTH_LOCK_WINDOW]
    AUTH_FAILS[ip] = fails
    return len(fails) >= AUTH_MAX_FAILS, len(fails)

def _record_fail(ip):
    now = time.time()
    AUTH_FAILS.setdefault(ip, []).append(now)

def _find_account(user, password):
    if user != 'admin':
        return None
    for acct in load_admins():
        if _check_pass(password, acct.get('pass_hash') or ''):
            return acct
    return None

def _grant_token(acct):
    token = _new_token()
    tokens = read_obj('admin_tokens', {})
    now = time.time()
    tokens = {k: v for k, v in tokens.items() if v.get('exp', 0) > now}
    tokens[token] = {'account': acct.get('user'), 'name': acct.get('name'),
                     'exp': now + TOKEN_TTL, 'created': now}
    write_json('admin_tokens', tokens)
    return token

@app.route('/api/auth', methods=['POST'])
@rate_limit('auth_post', 20, 300)
def auth():
    ip = request.remote_addr or '?'
    locked, _ = _lock_info(ip)
    if locked:
        return jsonify({'ok': False, 'error': 'locked'}), 429
    d = request.json or {}
    acct = _find_account(d.get('user', ''), d.get('pass', ''))
    if not acct:
        _record_fail(ip)
        return jsonify({'ok': False, 'error': 'identifiants invalides'}), 401
    acct = dict(acct)
    if acct.get('twofa'):
        code = re.sub(r'\D', '', str(d.get('totp') or ''))
        if not totp_valid(acct.get('totp_secret') or '', code):
            _record_fail(ip)
            return jsonify({'ok': False, 'error': 'code de securite invalide', 'totp': True}), 401
    AUTH_FAILS.pop(ip, None)
    token = _grant_token(acct)
    return jsonify({'ok': True, 'name': acct.get('name'), 'token': token,
                    'twofa': bool(acct.get('twofa'))})

@app.route('/api/auth/logout', methods=['POST'])
def auth_logout():
    t = request.headers.get('X-Admin-Token', '')
    tokens = read_obj('admin_tokens', {})
    tokens.pop(t, None)
    write_json('admin_tokens', tokens)
    return jsonify({'ok': True})

@app.route('/api/auth/status', methods=['GET'])
@admin_required
def auth_status():
    entry = admin_ok()
    twofa = False
    for a in load_admins():
        if a.get('name') == entry.get('name'):
            twofa = bool(a.get('twofa'))
            break
    return jsonify({'ok': True, 'name': entry.get('name'), 'twofa': twofa})

@app.route('/api/auth/password', methods=['POST'])
@admin_required
def auth_password():
    entry = admin_ok()
    accounts = load_admins()
    acct = None
    for a in accounts:
        if a.get('name') == entry.get('name'):
            acct = a
            break
    if not acct:
        return jsonify({'ok': False, 'error': 'compte introuvable'}), 404
    d = request.json or {}
    if not _check_pass(d.get('current') or '', acct.get('pass_hash') or ''):
        return jsonify({'ok': False, 'error': 'mot de passe actuel incorrect'}), 400
    nxt = str(d.get('next') or '')
    if len(nxt) < 8:
        return jsonify({'ok': False, 'error': 'nouveau mot de passe trop court (8 caracteres min)'}), 400
    acct['pass_hash'] = _hash(nxt)
    acct['pass_changed'] = time.strftime('%Y-%m-%dT%H:%M:%S')
    _save_admins(accounts)
    tokens = read_obj('admin_tokens', {})
    tokens = {k: v for k, v in tokens.items() if v.get('name') != acct['name']}
    write_json('admin_tokens', tokens)
    return jsonify({'ok': True})

@app.route('/api/auth/recovery', methods=['POST'])
def auth_recovery():
    """Recuperation securisee : un code de recuperation a usage unique change le mot de passe."""
    d = request.json or {}
    if d.get('user') != 'admin':
        return jsonify({'ok': False, 'error': 'identifiants invalides'}), 401
    code = str(d.get('code') or '').strip()
    nxt = str(d.get('next') or d.get('pass') or '')
    if len(nxt) < 8:
        return jsonify({'ok': False, 'error': 'nouveau mot de passe trop court (8 caracteres min)'}), 400
    if not code:
        return jsonify({'ok': False, 'error': 'code requis'}), 400
    accounts = load_admins()
    for acct in accounts:
        codes = list(acct.get('recovery_codes') or [])
        for i, stored in enumerate(codes):
            if _check_pass(code, stored):
                codes.pop(i)
                new_code = secrets.token_urlsafe(12)
                codes.append(_hash(new_code))
                acct['recovery_codes'] = codes
                acct['pass_hash'] = _hash(nxt)
                acct['pass_changed'] = time.strftime('%Y-%m-%dT%H:%M:%S')
                _save_admins(accounts)
                tokens = read_obj('admin_tokens', {})
                tokens = {k: v for k, v in tokens.items() if v.get('name') != acct['name']}
                write_json('admin_tokens', tokens)
                return jsonify({'ok': True, 'new_recovery_code': new_code})
    return jsonify({'ok': False, 'error': 'code invalide ou deja utilise'}), 400

@app.route('/api/auth/totp/start', methods=['POST'])
@admin_required
def auth_totp_start():
    entry = admin_ok()
    accounts = load_admins()
    for acct in accounts:
        if acct.get('name') == entry.get('name'):
            sec = totp_new_secret()
            acct['totp_secret'] = sec
            _save_admins(accounts)
            uri = ('otpauth://totp/Chronique:%s?secret=%s&issuer=Chronique' %
                   (quote(acct['name']), sec))
            return jsonify({'ok': True, 'secret': sec, 'uri': uri})
    return jsonify({'ok': False, 'error': 'compte introuvable'}), 404

@app.route('/api/auth/totp/activate', methods=['POST'])
@admin_required
def auth_totp_activate():
    entry = admin_ok()
    d = request.json or {}
    accounts = load_admins()
    for acct in accounts:
        if acct.get('name') == entry.get('name'):
            if not totp_valid(acct.get('totp_secret') or '', d.get('code')):
                return jsonify({'ok': False, 'error': 'code de securite invalide'}), 400
            acct['twofa'] = True
            _save_admins(accounts)
            return jsonify({'ok': True})
    return jsonify({'ok': False, 'error': 'compte introuvable'}), 404

@app.route('/api/auth/totp/deactivate', methods=['POST'])
@admin_required
def auth_totp_deactivate():
    entry = admin_ok()
    d = request.json or {}
    accounts = load_admins()
    for acct in accounts:
        if acct.get('name') == entry.get('name'):
            if not totp_valid(acct.get('totp_secret') or '', d.get('code')):
                return jsonify({'ok': False, 'error': 'code de securite invalide'}), 400
            acct['twofa'] = False
            acct['totp_secret'] = ''
            _save_admins(accounts)
            return jsonify({'ok': True})
    return jsonify({'ok': False, 'error': 'compte introuvable'}), 404

@app.route('/api/admin/recovery-codes/regenerate', methods=['POST'])
@admin_required
def admin_recovery_regenerate():
    """Regenere les codes de recuperation et les retourne UNE SEULE fois, en clair."""
    entry = admin_ok()
    accounts = load_admins()
    for acct in accounts:
        if acct.get('name') == entry.get('name'):
            codes = [secrets.token_urlsafe(12) for _ in range(3)]
            acct['recovery_codes'] = [_hash(c) for c in codes]
            _save_admins(accounts)
            return jsonify({'ok': True, 'codes': codes})
    return jsonify({'ok': False, 'error': 'compte introuvable'}), 404# --- IMAGE UPLOAD ---
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
    for a in _public_articles():
        slug = cat_slug(a.get('category'))
        if slug and slug not in seen_cats:
            seen_cats.add(slug)
            lines.append('<url><loc>' + base + '/categorie/' + slug + '</loc></url>')
    for a in _public_articles():
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
        for a in _public_articles():
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
        sdesc = safe(desc or "Chronique de James Mukeshaba - MÃƒÂ©dia d'information")
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

@app.route('/soutenir')
@app.route('/don')
def serve_soutenir_page():
    return send_from_directory(BASE, 'soutenir.html')

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