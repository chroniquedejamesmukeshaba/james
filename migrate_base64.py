import os, json, base64, uuid
from io import BytesIO

BASE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE, 'server_data')
UPLOAD_DIR = os.path.join(BASE, 'assets', 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

def compress_image(img_bytes, target_bytes=120000, max_dim=1200):
    if not HAS_PIL:
        return img_bytes
    try:
        img = Image.open(BytesIO(img_bytes))
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
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

def extract_image(value):
    if not isinstance(value, str) or not value.startswith('data:image'):
        return value, 0
    raw = value.split(',', 1)[1] if ',' in value else value
    try:
        img_bytes = base64.b64decode(raw)
    except Exception:
        return value, 0
    img_bytes = compress_image(img_bytes)
    if not img_bytes:
        return value, 0
    filename = str(uuid.uuid4()) + '.jpg'
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, 'wb') as f:
        f.write(img_bytes)
    return '/assets/uploads/' + filename, len(img_bytes)

def migrate(name, fields):
    path = os.path.join(DATA_DIR, name + '.json')
    if not os.path.exists(path):
        print(name + ': absent, ignore')
        return
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    items = data if isinstance(data, list) else list(data.values())
    converted = 0
    for it in items:
        if not isinstance(it, dict):
            continue
        for field in fields:
            if field in it:
                new, size = extract_image(it[field])
                if new != it[field]:
                    it[field] = new
                    converted += 1
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(name + ': ' + str(converted) + ' image(s) extraites')

migrate('articles', ['image'])
migrate('pages', ['image'])
migrate('campaigns', ['image'])
print('Termine. Fichiers dans ' + UPLOAD_DIR)