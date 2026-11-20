from pathlib import Path
from PIL import Image

try:
    import pillow_avif  # noqa: F401  (adds .avif support)
except ImportError:
    pass

folder = Path("tests/assets")
mapping = {
    "cat.jpg.webp": "cat.jpg",
    "cow.jpg.webp": "cattle.jpg",
    "dog.jpg.avif": "dog.jpg",
}

for src, dst in mapping.items():
    img = Image.open(folder / src).convert("RGB")
    img.save(folder / dst, "JPEG", quality=95)
    print("created", dst)