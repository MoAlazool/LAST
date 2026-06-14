import os
import sys

# Add parent directory to path to allow absolute imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from .cache import get_cached, save_to_cache
from .prompt_builder import build_image_prompt
from .imagen import generate_with_imagen
from .pexels import fetch_from_pexels
from .scorer import is_relevant
from .config import CACHE_DIR

def get_image_for_slide(
    title: str,
    bullets: list,
    language: str = "en",
    slide_number: int = 0,
    use_scorer: bool = True
) -> str | None:
    """
    Main public function. Call this for every slide that needs an image.
    """
    label = f"Slide {slide_number}" if slide_number else "Slide"
    print(f"\\nNano Banana - {label}: '{title[:40]}'", file=sys.stderr)

    # 1. Check cache
    cached = get_cached(title, bullets)
    if cached:
        print(f"    [Cache hit] {cached}", file=sys.stderr)
        return cached

    # 2. Build image prompt
    print("    [Building image prompt...]", file=sys.stderr)
    prompt = build_image_prompt(title, bullets, language)
    print(f"    [Prompt] {prompt[:80]}...", file=sys.stderr)

    # 3. Try Imagen 3
    print("    [Trying Imagen 3...]", file=sys.stderr)
    img_bytes = generate_with_imagen(prompt)

    if img_bytes:
        if use_scorer and not is_relevant(img_bytes, title, bullets):
            print("    [FAILED] Imagen 3 image rejected (low relevance) - trying Pexels", file=sys.stderr)
            img_bytes = None
        else:
            path = save_to_cache(title, bullets, img_bytes, ext="png")
            print(f"    [SUCCESS] Saved: {path}", file=sys.stderr)
            return path

    # 4. Fallback to Pexels
    if img_bytes is None:
        print("    [Falling back to Pexels...]", file=sys.stderr)
        pexels_bytes = fetch_from_pexels(prompt)

        if pexels_bytes:
            if use_scorer and not is_relevant(pexels_bytes, title, bullets):
                print("    [FAILED] Pexels image also rejected - no image for this slide", file=sys.stderr)
                return None
            path = save_to_cache(title, bullets, pexels_bytes, ext="jpg")
            print(f"    [SUCCESS] Pexels saved: {path}", file=sys.stderr)
            return path

    print("    [FAILED] No suitable image found for this slide", file=sys.stderr)
    return None

def get_images_for_all_slides(slides_data: list) -> dict:
    """
    Process all slides and return a dict: {str(slide_number): image_path}
    Only processes slides of type: content, summary, quote.
    """
    ELIGIBLE_TYPES = {"content", "summary", "quote"}
    results = {}

    for slide in slides_data:
        slide_type = slide.get("type", "content")
        slide_number = slide.get("id", slide.get("slide_number", 0)) # handle both id and slide_number
        language = slide.get("language", "en")

        if slide_type not in ELIGIBLE_TYPES:
            continue

        title = slide.get("title", "")
        bullets = slide.get("bullets", slide.get("content", []))

        if not title:
            continue

        path = get_image_for_slide(
            title=title,
            bullets=bullets,
            language=language,
            slide_number=slide_number
        )
        if path:
            results[str(slide_number)] = path

    print(f"\\n[DONE] Nano Banana - {len(results)}/{len(slides_data)} slides got images", file=sys.stderr)
    return results
