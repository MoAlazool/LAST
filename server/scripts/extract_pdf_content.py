import sys
import json
import fitz  # PyMuPDF
import os
import re

# Import text cleaner
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from text_cleaner import clean_text

def extract_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    chunks = []  # Store text chunks with associated images
    
    # Store images in temp folder alongside the PDF
    temp_dir = os.path.dirname(pdf_path)
    base_name = os.path.basename(pdf_path).split('.')[0]
    
    image_count = 0
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        page_text = page.get_text()
        
        # Clean the page text
        cleaned_page_text = clean_text(page_text)
        
        # Extract images from this page
        page_images = []
        image_list = page.get_images(full=True)
        for img_index, img in enumerate(image_list):
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            image_ext = base_image["ext"]
            
            # Keep most meaningful visuals, but skip tiny decorative assets.
            if len(image_bytes) < 30000:
                continue
                
            image_filename = f"{base_name}_p{page_num}_{img_index}.{image_ext}"
            image_filepath = os.path.join(temp_dir, image_filename)
            
            with open(image_filepath, "wb") as f:
                f.write(image_bytes)
                
            page_images.append(image_filepath)
            
            image_count += 1
            if image_count > 120: # Allow more visuals while keeping runtime bounded
                break
        if image_count > 120:
            break
        
        # Store chunk with text and images from this page
        if cleaned_page_text.strip():
            chunks.append({
                "text": cleaned_page_text,
                "images": page_images,
                "page_number": page_num + 1
            })
    
    # Combine all chunks into full transcript
    full_text = "\n\n".join([chunk["text"] for chunk in chunks])
    all_images = []
    for chunk in chunks:
        all_images.extend(chunk["images"])
    
    return {
        "success": True,
        "transcript": full_text,
        "chunks": chunks,
        "images": all_images,
        "page_count": len(doc)
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No PDF path provided"}))
        sys.exit(1)
        
    # We must set PYTHONIOENCODING=utf-8 or similar, but stdout encoding is mostly handled
    # Reconfigure stdout to use utf-8
    sys.stdout.reconfigure(encoding='utf-8')
    pdf_path = sys.argv[1]
    
    try:
        result = extract_pdf(pdf_path)
        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))
