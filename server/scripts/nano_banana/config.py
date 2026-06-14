import os

GEMINI_API_KEY  = os.getenv("GEMINI_API_KEY",  "")
PEXELS_API_KEY  = os.getenv("PEXELS_API_KEY",  "")

CACHE_DIR       = "nano_banana_cache"
IMAGE_WIDTH     = 1024   # Imagen 3 output width
IMAGE_HEIGHT    = 768    # Imagen 3 output height (4:3 ratio)
RELEVANCE_PASS  = 0.65   # Minimum score to accept an image (0.0 - 1.0)
MAX_RETRIES     = 2      # How many times to retry Imagen 3 on failure

IMAGE_STYLE_SUFFIX = (
    ", flat illustration, educational style, "
    "white background, no text, no letters, "
    "clean lines, professional, high quality"
)
