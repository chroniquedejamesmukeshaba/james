import os, json, time, uuid, base64, urllib.request
from io import BytesIO
from flask import Flask, request, jsonify, send_from_directory, redirect

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
    with open(path, 'r', encoding='utf-8') as f: return json.load(f)

def write_json(name, data):
    path = os.path.join(DATA_DIR, name + '.json')
    with open(path, 'w', encoding='utf-8') as f: json.dump(data, f, ensure_ascii=False, indent=2)

# --- ARTICLES ---
@app.route('/api/articles', methods=['GET'])
def get_articles():
    lang = request.args.get('lang', 'fr')
    articles = read_json('articles')
    if lang and lang != 'fr':
        for a in articles:
            for f in ('title', 'content', 'excerpt'):
                k = f + '_' + lang
                if k in a and a[k]:
                    a[f] = a[k]
    return jsonify(articles)

@app.route('/api/articles', methods=['POST'])
def save_article():
    articles = read_json('articles')
    data = request.json
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

@app.route('/api/articles/<int:aid>', methods=['DELETE'])
def delete_article(aid):
    articles = [a for a in read_json('articles') if a['id'] != aid]
    write_json('articles', articles)
    return jsonify({'ok': True})

# --- PAGES ---
@app.route('/api/pages', methods=['GET'])
def get_pages():
    return jsonify(read_json('pages'))

@app.route('/api/pages', methods=['POST'])
def save_page():
    pages = read_json('pages')
    data = request.json
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

@app.route('/api/pages/<int:pid>', methods=['DELETE'])
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
def add_comment(article_id):
    key = f'comments_{article_id}'
    comments = read_json(key)
    data = request.json
    data['id'] = int(time.time() * 1000)
    data['pending'] = True
    comments.append(data)
    write_json(key, comments)
    return jsonify({'ok': True})

@app.route('/api/comments/<int:article_id>/<int:cid>/approve', methods=['POST'])
def approve_comment(article_id, cid):
    key = f'comments_{article_id}'
    comments = read_json(key)
    for c in comments:
        if c['id'] == cid: c['pending'] = False; break
    write_json(key, comments)
    return jsonify({'ok': True})

@app.route('/api/comments/<int:article_id>/<int:cid>', methods=['DELETE'])
def delete_comment(article_id, cid):
    key = f'comments_{article_id}'
    comments = [c for c in read_json(key) if c['id'] != cid]
    write_json(key, comments)
    return jsonify({'ok': True})

# --- NEWSLETTER ---
@app.route('/api/newsletter', methods=['GET'])
def get_subscribers():
    return jsonify(read_json('newsletter'))

@app.route('/api/newsletter', methods=['POST'])
def subscribe():
    subs = read_json('newsletter')
    email = request.json.get('email')
    if email and email not in subs:
        subs.append(email)
        write_json('newsletter', subs)
    return jsonify({'ok': True})

# --- LOST & FOUND ---
@app.route('/api/lost-found', methods=['GET'])
def get_lost_found():
    return jsonify(read_json('lost_found'))

@app.route('/api/lost-found', methods=['POST'])
def add_lost_found():
    ads = read_json('lost_found')
    data = request.json
    data['id'] = int(time.time() * 1000)
    ads.insert(0, data)
    write_json('lost_found', ads)
    return jsonify({'ok': True})

@app.route('/api/lost-found/<int:lid>', methods=['DELETE'])
def delete_lost_found(lid):
    ads = [a for a in read_json('lost_found') if a['id'] != lid]
    write_json('lost_found', ads)
    return jsonify({'ok': True})

# --- CAMPAIGNS ---
@app.route('/api/campaigns', methods=['GET'])
def get_campaigns():
    return jsonify(read_json('campaigns'))

@app.route('/api/campaigns', methods=['POST'])
def save_campaign():
    campaigns = read_json('campaigns')
    data = request.json
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

@app.route('/api/campaigns/<int:cid>', methods=['DELETE'])
def delete_campaign(cid):
    campaigns = [c for c in read_json('campaigns') if c['id'] != cid]
    write_json('campaigns', campaigns)
    return jsonify({'ok': True})

@app.route('/api/campaigns/<int:cid>/stop', methods=['POST'])
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
def set_campaign_speed(cid):
    campaigns = read_json('campaigns')
    speed = request.json.get('speed', 5000)
    for c in campaigns:
        if c['id'] == cid:
            c['speed'] = speed
            break
    write_json('campaigns', campaigns)
    return jsonify({'ok': True})

# --- DONATIONS ---
@app.route('/api/donations', methods=['GET'])
def get_donations():
    return jsonify(read_json('donations'))

@app.route('/api/donations', methods=['POST'])
def add_donation():
    dons = read_json('donations')
    dons.append(request.json)
    write_json('donations', dons)
    return jsonify({'ok': True})

# --- VISITS ---
@app.route('/api/visits', methods=['GET'])
def get_visits():
    return jsonify(read_json('visits'))

@app.route('/api/visits', methods=['POST'])
def track_visit():
    visits = read_json('visits')
    data = request.json
    country = data.get('country', '')
    if not country and request.remote_addr:
        try:
            ip = request.remote_addr
            with urllib.request.urlopen('http://ip-api.com/json/'+ip+'?fields=country', timeout=3) as resp:
                g = json.loads(resp.read())
                country = g.get('country','')
        except Exception:
            pass
    visits.append({'date': data.get('date',''), 'path': data.get('path',''), 'articleId': data.get('articleId',''), 'country': country})
    if len(visits) > 50000: visits = visits[-50000:]
    write_json('visits', visits)
    return jsonify({'ok': True})

@app.route('/api/visits/analytics', methods=['GET'])
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
        visits = [v for v in visits if v.get('date','')[:19] >= cutoff_str]
    article_data = {}
    page_data = {}
    country_data = {}
    for v in visits:
        aid = v.get('articleId','')
        path = v.get('path','')
        country = v.get('country', '')
        if not country: country = 'Inconnu'
        if aid:
            article_data[aid] = article_data.get(aid, 0) + 1
        page_data[path] = page_data.get(path, 0) + 1
        country_data[country] = country_data.get(country, 0) + 1
    articles_out = []
    for aid, cnt in sorted(article_data.items(), key=lambda x:-x[1]):
        articles_out.append({'id': aid, 'title': art_map.get(aid, 'Article #'+aid), 'visits': cnt})
    pages_out = []
    for p, cnt in sorted(page_data.items(), key=lambda x:-x[1]):
        label = p or '/'
        if '/article' in label: label = 'Article (' + p + ')'
        elif label in ('/', '/index.html'): label = 'Accueil'
        else: label = label.replace('.html','').replace('/','')
        pages_out.append({'page': label, 'visits': cnt})
    countries_out = []
    for c, cnt in sorted(country_data.items(), key=lambda x:-x[1]):
        countries_out.append({'country': c, 'visits': cnt})
    days = {}
    for v in visits:
        d = v.get('date','')[:10]
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
def get_stats():
    articles = len(read_json('articles'))
    comments = sum(len(read_json(f)) for f in os.listdir(DATA_DIR) if f.startswith('comments_'))
    subs = len(read_json('newsletter'))
    visitsData = read_json('visits')
    visits = len(visitsData)
    visitsList = [v if isinstance(v, str) else v.get('date','') for v in visitsData]
    return jsonify({'articles': articles, 'comments': comments, 'subs': subs, 'visits': visits, 'visitsList': visitsList})

# --- AUTH ---
ADMINS = {
    'Shine2026':    'YAGIRWA GEDEON GUIDE',
    'Lufumica2026': 'LUFUNGULO MICHAEL',
    'Sergio2026':   'SERGE IRENGE',
    'Christvie2026':'MUKESHABA JAMES MPALA',
}
@app.route('/api/auth', methods=['POST'])
def auth():
    d = request.json
    name = ADMINS.get(d.get('pass', ''))
    if d.get('user') == 'admin' and name:
        return jsonify({'ok': True, 'name': name})
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
                if lang and lang != 'fr':
                    for f in ('title', 'content', 'excerpt'):
                        k = f + '_' + lang
                        if k in a and a[k]:
                            article[f] = a[k]
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
        safe = lambda s: s.replace('&','&amp;').replace('"','&quot;').replace('<','&lt;').replace('>','&gt;')
        stitle = safe(title)
        sdesc = safe(desc or "Chronique de James Mukeshaba - Média d'information")
        og = f'''
<meta property="og:title" content="{stitle}">
<meta property="og:description" content="{sdesc}">
<meta property="og:image" content="{img}">
<meta property="og:url" content="{request.host_url.rstrip('/')}/article?id={aid}">
<meta property="og:type" content="article">
<meta name="twitter:card" content="summary_large_image">
'''
        html = html.replace('<title>Article - Chronique de James Mukeshaba</title>', '<title>' + stitle + ' - Chronique de James Mukeshaba</title>' + og)
    return html

@app.route('/')
def serve_index():
    return send_from_directory(BASE, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    full = os.path.join(BASE, path)
    if os.path.isfile(full):
        return send_from_directory(BASE, path)
    return send_from_directory(BASE, 'index.html')

if __name__ == '__main__':
    app.run(debug=True)
