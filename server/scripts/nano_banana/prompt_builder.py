import google.generativeai as genai
from .config import GEMINI_API_KEY, IMAGE_STYLE_SUFFIX

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    _model = genai.GenerativeModel("gemini-3.5-flash")
else:
    _model = None

IMAGE_PROMPT_SYSTEM = """
You are an expert at converting educational slide content into precise image generation prompts.

Rules:
- Output ONLY the image prompt. No explanation, no preamble, nothing else.
- Maximum 18 words total
- Describe a SPECIFIC visual concept that directly represents the slide topic
- Be literal and concrete - not abstract or metaphorical
- Focus on the main concept only
- Do NOT include: text, letters, words, people's faces, flags, logos, brands
- Style is always: flat illustration, educational, white background, no text
- Examples of good prompts:
    "plant cell with chloroplasts and cell wall, cross-section diagram"
    "water cycle showing evaporation condensation precipitation arrows"
    "neural network layers connected nodes diagram"
    "photosynthesis sunlight carbon dioxide oxygen glucose plant leaf"
"""

def build_image_prompt(title: str, bullets: list, language: str = "en") -> str:
    """
    Ask Gemini to generate a focused image prompt from slide content.
    Works for both Arabic and English input.
    """
    if not _model:
        return "illustration"
        
    bullets_text = "\n".join(f"- {b}" for b in bullets)

    user_message = f"""
{IMAGE_PROMPT_SYSTEM}

Slide title: {title}
Slide bullets:
{bullets_text}
Language: {language}

Generate an image prompt for this slide.
"""
    try:
        response = _model.generate_content(
            user_message,
            generation_config={"temperature": 0.3, "max_output_tokens": 60}
        )
        raw_prompt = response.text.strip().strip('"').strip("'")
        return raw_prompt + IMAGE_STYLE_SUFFIX
    except Exception as e:
        print(f"Error building prompt: {e}")
        # fallback string
        return title[:50] + IMAGE_STYLE_SUFFIX
