import base64
import google.generativeai as genai
from .config import GEMINI_API_KEY, RELEVANCE_PASS

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    _model = genai.GenerativeModel("gemini-3.5-flash")
else:
    _model = None

SCORE_PROMPT = """
You are evaluating whether an image is relevant to a slide's content.

Respond with ONLY a decimal number between 0.0 and 1.0:
- 1.0 = image perfectly represents the slide topic
- 0.7 = image is clearly related but not perfect
- 0.5 = image is loosely related
- 0.3 = image is barely related
- 0.0 = image has nothing to do with the topic

Return ONLY the number. Nothing else. No explanation.
"""

def score_image(image_bytes: bytes, title: str, bullets: list) -> float:
    """
    Ask Gemini Vision to score how relevant the image is to the slide.
    Returns a float 0.0 - 1.0.
    """
    if not _model:
        return 1.0 # bypass if no model
        
    bullets_text = "\n".join(f"- {b}" for b in bullets)
    user_text = f"Slide title: {title}\nSlide content:\n{bullets_text}"

    try:
        response = _model.generate_content([
            SCORE_PROMPT,
            user_text,
            {
                "inline_data": {
                    "mime_type": "image/png", # Assume PNG or JPEG, gemini handles it
                    "data": base64.b64encode(image_bytes).decode("utf-8")
                }
            }
        ])
        score = float(response.text.strip())
        score = max(0.0, min(1.0, score))
        print(f"    [SCORE] Relevance score: {score:.2f} (threshold: {RELEVANCE_PASS})")
        return score

    except Exception as e:
        print(f"    [WARNING] Scorer failed: {e} - defaulting to 0.5")
        return 0.5

def is_relevant(image_bytes: bytes, title: str, bullets: list) -> bool:
    score = score_image(image_bytes, title, bullets)
    return score >= RELEVANCE_PASS
