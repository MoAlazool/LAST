try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None

from .config import GEMINI_API_KEY, IMAGE_WIDTH, IMAGE_HEIGHT, MAX_RETRIES

if genai and GEMINI_API_KEY:
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception:
        client = None
else:
    client = None

def generate_with_imagen(prompt: str) -> bytes | None:
    """
    Generate an image with Imagen 3.
    Returns raw image bytes or None on failure.
    """
    if not client:
        print("    [WARNING] Imagen 3 not available (missing google-genai or API key)")
        return None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = client.models.generate_images(
                model="imagen-3.0-generate-002",
                prompt=prompt,
                config=types.GenerateImagesConfig(
                    number_of_images=1,
                    aspect_ratio="4:3",
                    safety_filter_level="block_low_and_above",
                )
            )
            img = response.generated_images[0].image.image_bytes
            print(f"    [SUCCESS] Imagen 3 success (attempt {attempt})")
            return img

        except Exception as e:
            print(f"    [WARNING] Imagen 3 attempt {attempt} failed: {e}")

    return None
