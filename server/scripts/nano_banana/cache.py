import os
import hashlib
from .config import CACHE_DIR

def _key(title: str, bullets: list) -> str:
    """Generate a stable cache key from slide content."""
    raw = title.strip().lower() + "|".join(b.strip().lower() for b in bullets)
    return hashlib.md5(raw.encode("utf-8")).hexdigest()[:16]

def get_cached(title: str, bullets: list) -> str | None:
    """Return cached image path if it exists."""
    key = _key(title, bullets)
    for ext in ("png", "jpg"):
        path = os.path.join(CACHE_DIR, f"{key}.{ext}")
        if os.path.exists(path):
            return path
    return None

def save_to_cache(title: str, bullets: list,
                  image_bytes: bytes, ext: str = "png") -> str:
    """Save image bytes to cache and return the path."""
    os.makedirs(CACHE_DIR, exist_ok=True)
    key = _key(title, bullets)
    path = os.path.join(CACHE_DIR, f"{key}.{ext}")
    with open(path, "wb") as f:
        f.write(image_bytes)
    return path

def save_file_to_cache(title: str, bullets: list,
                       src_path: str) -> str:
    """Copy an existing file into cache."""
    import shutil
    os.makedirs(CACHE_DIR, exist_ok=True)
    ext = src_path.rsplit(".", 1)[-1]
    key = _key(title, bullets)
    dst = os.path.join(CACHE_DIR, f"{key}.{ext}")
    shutil.copy2(src_path, dst)
    return dst
