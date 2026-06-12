#!/usr/bin/env python3
"""
Text Cleaning Utility
Cleans and normalizes text from PDFs, PPTs, and video transcripts
Removes strange symbols, artifacts, and formatting issues
"""
import re
import unicodedata
import sys

def remove_duplicate_lines(text):
    """
    Remove consecutive duplicate lines (common in PDF/PPT extraction).
    PPT slides often have overlay text that gets extracted twice.
    """
    lines = text.split('\n')
    cleaned = []
    prev = None
    for line in lines:
        stripped = line.strip()
        if stripped == prev and stripped:
            continue
        cleaned.append(line)
        prev = stripped
    return '\n'.join(cleaned)

def remove_duplicate_sentences(text):
    """
    Remove duplicate sentences within the text.
    PDF/PPT extraction often duplicates entire sentences on the same line.
    """
    # Split into sentences (rough split by period, question mark, exclamation)
    # Handle both English and Arabic punctuation
    sentences = re.split(r'(?<=[.!?؛؟])\s+', text)
    seen = set()
    cleaned = []
    for s in sentences:
        s_stripped = s.strip()
        if not s_stripped:
            continue
        # Normalize for comparison: lowercase, collapse spaces
        key = re.sub(r'\s+', ' ', s_stripped.lower()).strip()
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(s_stripped)
    return ' '.join(cleaned)

def remove_inline_duplicates(text):
    """
    Remove inline duplicated phrases like:
    'YARN Architectural Overview(Contd..) YARN Architectural Overview(Contd..)'
    This happens when PPT text layers overlap.
    """
    # Pattern: a phrase repeated immediately after itself
    # Try word-level: if the same sequence of words appears twice in a row
    words = text.split()
    if len(words) < 4:
        return text

    result = []
    i = 0
    while i < len(words):
        # Try phrase lengths from 20 down to 3
        found_dup = False
        for phrase_len in range(min(20, len(words) // 2), 2, -1):
            if i + phrase_len * 2 <= len(words):
                phrase1 = ' '.join(words[i:i+phrase_len])
                phrase2 = ' '.join(words[i+phrase_len:i+phrase_len*2])
                # Normalize for comparison
                p1_norm = re.sub(r'\s+', ' ', phrase1.lower().strip())
                p2_norm = re.sub(r'\s+', ' ', phrase2.lower().strip())
                if p1_norm == p2_norm and len(p1_norm) > 10:
                    # Found duplicate, keep only one copy
                    result.extend(words[i:i+phrase_len])
                    i += phrase_len * 2
                    found_dup = True
                    break
        if not found_dup:
            result.append(words[i])
            i += 1

    return ' '.join(result)

def clean_text(text, language=None):
    """
    Clean and normalize text by removing strange symbols and artifacts

    Args:
        text: Raw text to clean
        language: Language code ('ar', 'en', etc.) for language-specific cleaning

    Returns:
        Cleaned text
    """
    if not text:
        return ""

    # Step 0: Remove inline duplicated phrases (PPT overlay text)
    text = remove_inline_duplicates(text)

    # Step 1: Normalize Unicode (NFKC decomposition)
    text = unicodedata.normalize('NFKC', text)

    # Step 2: Remove control characters (except newlines and tabs)
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)

    # Step 3: Remove common PDF artifacts and strange symbols
    # Remove bullet symbols and replace with standard bullets
    text = re.sub(r'[\u2022\u2023\u25e6\u2043]', '•', text)

    # Remove fancy quotes and replace with standard quotes
    text = re.sub(r'[\u201c\u201d]', '"', text)  # Curly double quotes
    text = re.sub(r'[\u2018\u2019]', "'", text)  # Curly single quotes

    # Remove em-dash and en-dash, replace with standard dash
    text = re.sub(r'[\u2013\u2014\u2015]', '-', text)

    # Remove weird spaces and replace with normal space
    text = re.sub(r'[\u00a0\u2000-\u200b\u202f\u205f\u3000]', ' ', text)

    # Remove arrow symbols and other decorative characters
    text = re.sub(r'[→←↑↓↔↕↖↗↘↙]', '', text)

    # Remove box drawing characters
    text = re.sub(r'[\u2500-\u257f]', '', text)

    # Remove geometric shapes
    text = re.sub(r'[\u25a0-\u25ff]', '', text)

    # Remove mathematical operators that might be artifacts (keep basic ones)
    text = re.sub(r'[∀∁∂∃∄∅∆∇∈∉∊∋∌∍∎∏∐∑−∓∔∕∖∗∘∙√∛∜∝∞∟∠∡∢∣∤∥∦∧∨∩∪∫∬∭∮∯∰∱∲∳]', '', text)

    # Remove currency symbols (keep $, €, £ if needed)
    text = re.sub(r'[\u20a0-\u20cf]', '', text)

    # Remove other decorative Unicode symbols
    text = re.sub(r'[\u2600-\u26ff\u2700-\u27bf]', '', text)  # Symbols and emojis

    # Step 4: Fix multiple spaces
    text = re.sub(r'[ \t]+', ' ', text)

    # Step 5: Fix multiple newlines (max 2 consecutive)
    text = re.sub(r'\n{3,}', '\n\n', text)

    # Step 6: Fix punctuation spacing
    # Remove space before punctuation
    text = re.sub(r'\s+([.,!?;:،؛۔])', r'\1', text)

    # Add space after punctuation if missing
    text = re.sub(r'([.,!?;:،؛۔])([^\s])', r'\1 \2', text)

    # Step 7: Remove repeated punctuation (more than 2)
    text = re.sub(r'([.,!?;:،؛۔])\1{2,}', r'\1\1', text)

    # Step 8: Remove standalone numbers that are likely page numbers or artifacts
    # But keep numbers that are part of text
    text = re.sub(r'(?<!\w)\d{1,3}(?!\w)', '', text)

    # Step 9: Remove common PDF extraction artifacts
    # Remove things like "Page 1 of 10", "1/10", etc.
    text = re.sub(r'Page\s+\d+\s+of\s+\d+', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\d+\s*/\s*\d+', '', text)

    # Remove URLs (optional - comment out if you want to keep them)
    text = re.sub(r'https?://\S+', '', text)

    # Remove email addresses
    text = re.sub(r'\S+@\S+\.\S+', '', text)

    # Step 10: Fix Arabic-specific issues if Arabic text detected
    if language == 'ar' or re.search(r'[\u0600-\u06FF]', text):
        # Fix Arabic letter forms (optional - Unicode normalization should handle most)
        # Remove tatweel (stretching character) if excessive
        text = re.sub(r'ـ{3,}', '', text)

        # Fix Arabic comma
        text = re.sub(r'،', '،', text)

        # Ensure proper Arabic punctuation spacing
        text = re.sub(r'([،؛؟])([^\s])', r'\1 \2', text)

    # Step 11: Remove duplicate lines (consecutive identical lines)
    text = remove_duplicate_lines(text)

    # Step 12: Remove duplicate sentences across the text
    text = remove_duplicate_sentences(text)

    # Step 13: Remove lines that are too short and likely artifacts
    lines = text.split('\n')
    cleaned_lines = []
    for line in lines:
        stripped = line.strip()
        # Skip lines that are too short (less than 2 chars) and not meaningful
        if len(stripped) < 2:
            continue
        # Skip lines that are just numbers or special characters
        if re.match(r'^[\d\s\W]+$', stripped):
            continue
        cleaned_lines.append(stripped)

    text = '\n'.join(cleaned_lines)

    # Step 14: Final cleanup
    # Remove leading/trailing whitespace
    text = text.strip()

    # Remove extra spaces around newlines
    text = re.sub(r' *\n *', '\n', text)

    return text

def clean_transcript_segment(text, language=None):
    """
    Clean transcript segments with more aggressive cleaning for speech-to-text
    
    Args:
        text: Raw transcript text
        language: Language code
    
    Returns:
        Cleaned transcript text
    """
    if not text:
        return ""
    
    # Apply basic cleaning
    text = clean_text(text, language)
    
    # Remove speech disfluencies (um, uh, etc.)
    text = re.sub(r'\b(um|uh|ah|er|mm)\b', '', text, flags=re.IGNORECASE)
    
    # Remove repeated words (stuttering)
    text = re.sub(r'\b(\w+)\s+\1\b', r'\1', text, flags=re.IGNORECASE)
    
    # Remove filler phrases
    filler_phrases = [
        r'\byou know\b',
        r'\blike\b',
        r'\bI mean\b',
        r'\bkind of\b',
        r'\bsort of\b',
    ]
    for phrase in filler_phrases:
        text = re.sub(phrase, '', text, flags=re.IGNORECASE)
    
    # Clean up again after removing fillers
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    
    return text

if __name__ == "__main__":
    # Test the cleaner
    if len(sys.argv) > 1:
        test_text = sys.argv[1]
        cleaned = clean_text(test_text)
        print(cleaned)
    else:
        # Run with sample text
        sample = """
        This is a test text with strange symbols: → ← ↑ ↓ ∆ ∇ ∞ √
        And some weird spaces:  hello    world  
        And bad punctuation: hello . world
        And artifacts: Page 1 of 10
        """
        print("Original:")
        print(sample)
        print("\nCleaned:")
        print(clean_text(sample))
