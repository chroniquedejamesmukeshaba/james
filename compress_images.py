import os
from io import BytesIO
try:
    from PIL import Image
except ImportError:
    print("PIL not installed. Run: pip install Pillow")
    exit(1)

TARGET_BYTES = 70000
MAX_DIM = 1200
EXTS = ('.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp')

def compress_file(path):
    try:
        img = Image.open(path)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        w, h = img.size
        if w > MAX_DIM or h > MAX_DIM:
            ratio = min(MAX_DIM / w, MAX_DIM / h)
            w, h = int(w * ratio), int(h * ratio)
            img = img.resize((w, h), Image.LANCZOS)
        quality = 85
        output = BytesIO()
        while quality > 10:
            output.seek(0)
            output.truncate()
            img.save(output, 'JPEG', quality=quality, optimize=True)
            if output.tell() <= TARGET_BYTES:
                break
            quality -= 5
        with open(path, 'wb') as f:
            f.write(output.getvalue())
        new_size = os.path.getsize(path)
        print(f"Compressed: {os.path.basename(path)} -> {new_size/1024:.0f}KB (q={quality})")
    except Exception as e:
        print(f"Error: {os.path.basename(path)} -> {e}")

base = os.path.dirname(os.path.abspath(__file__))
for folder in ['assets/images', 'assets/uploads']:
    full = os.path.join(base, folder)
    if not os.path.isdir(full):
        continue
    for fname in os.listdir(full):
        if fname.lower().endswith(EXTS) and fname != '.gitkeep':
            compress_file(os.path.join(full, fname))
print("All images compressed.")
