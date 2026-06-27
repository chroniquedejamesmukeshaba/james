import os, json, time, uuid, base64
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__)
DATA_DIR = os.path.join(os.path.dirname(__file__), 'server_data')
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), 'assets', 'uploads')
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)

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
    return jsonify(read_json('articles'))

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
    visits.append(request.json.get('date', ''))
    if len(visits) > 10000: visits = visits[-10000:]
    write_json('visits', visits)
    return jsonify({'ok': True})

# --- STATS ---
@app.route('/api/stats', methods=['GET'])
def get_stats():
    articles = len(read_json('articles'))
    comments = sum(len(read_json(f)) for f in os.listdir(DATA_DIR) if f.startswith('comments_'))
    subs = len(read_json('newsletter'))
    visitsData = read_json('visits')
    visits = len(visitsData)
    return jsonify({'articles': articles, 'comments': comments, 'subs': subs, 'visits': visits, 'visitsList': visitsData})

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
@app.route('/api/upload', methods=['POST'])
def upload_image():
    data = request.json
    if not data or not data.get('image'):
        return jsonify({'error': 'no image'}), 400
    raw = data['image']
    if ',' in raw: raw = raw.split(',', 1)[1]
    ext = 'jpg'
    if raw.startswith('/9j/'): ext = 'jpg'
    elif raw.startswith('iVBOR'): ext = 'png'
    elif raw.startswith('UklGR'): ext = 'webp'
    try:
        img_bytes = base64.b64decode(raw)
    except Exception:
        return jsonify({'error': 'invalid base64'}), 400
    filename = str(uuid.uuid4()) + '.' + ext
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, 'wb') as f:
        f.write(img_bytes)
    return jsonify({'url': '/assets/uploads/' + filename})

# --- SERVE STATIC FILES ---
BASE = os.path.dirname(__file__)

@app.route('/article')
def serve_article_og():
    aid = request.args.get('id')
    article = None
    if aid:
        for a in read_json('articles'):
            if str(a['id']) == str(aid):
                article = a
                break
    html = open(os.path.join(BASE, 'article.html'), 'r', encoding='utf-8').read()
    if article:
        title = article.get('title', '')
        desc = article.get('excerpt', '')
        img = article.get('image', '')
        if img and img.startswith('data:'):
            img = ''
        og = f'''
<meta property="og:title" content="{title.replace('"','&quot;')}">
<meta property="og:description" content="{desc.replace('"','&quot;')}">
<meta property="og:image" content="{img}">
<meta property="og:url" content="{request.url}">
<meta name="twitter:card" content="summary_large_image">
'''
        html = html.replace('</title>', '</title>' + og)
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
