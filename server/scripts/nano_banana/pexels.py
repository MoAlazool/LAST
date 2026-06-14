import os
import requests
from .config import PEXELS_API_KEY

def fetch_from_pexels(prompt: str) -> bytes | None:
    """
    Search Pexels using the first 4 words of the prompt as keywords.
    Returns raw image bytes or None.
    """
    if not PEXELS_API_KEY:
        print("    [WARNING] No Pexels API key - skipping fallback")
        return None

    # Use first 4 words as keyword (avoid style words like "flat illustration")
    keywords = " ".join(prompt.split()[:4])
    url = (
        f"https://api.pexels.com/v1/search"
        f"?query={keywords}&per_page=1&orientation=landscape"
    )

    try:
        resp = requests.get(
            url,
            headers={"Authorization": PEXELS_API_KEY},
            timeout=10
        )
        data = resp.json()

        if not data.get("photos"):
            print(f"    [WARNING] Pexels: no results for '{keywords}'")
            return None

        img_url = data["photos"][0]["src"]["large"]
        img_resp = requests.get(img_url, timeout=15)
        print(f"    [SUCCESS] Pexels image found for '{keywords}'")
        return img_resp.content

    except Exception as e:
        print(f"    [WARNING] Pexels failed: {e}")
        return None
