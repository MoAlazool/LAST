import sys
import os
import json
import zipfile
import re

# Import text cleaner
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from text_cleaner import clean_text

def extract_images(pptx_path):
    images = []
    chunks = []
    slide_count = 0
    temp_dir = os.path.dirname(pptx_path)
    base_name = os.path.basename(pptx_path).split('.')[0]

    try:
        with zipfile.ZipFile(pptx_path, 'r') as archive:
            # Get sorted list of slide XML files
            slide_entries = sorted([
                item for item in archive.namelist()
                if item.startswith('ppt/slides/slide') and item.endswith('.xml')
                and re.match(r'ppt/slides/slide\d+\.xml$', item)
            ], key=lambda x: int(re.search(r'slide(\d+)', x).group(1)))
            slide_count = len(slide_entries)

            # Build a map of relationship IDs to media files
            # Each slide has a .rels file that maps rId to media path
            rels_map = {}
            for rels_item in archive.namelist():
                if rels_item.startswith('ppt/slides/_rels/') and rels_item.endswith('.rels'):
                    rels_content = archive.read(rels_item).decode('utf-8', errors='ignore')
                    slide_num_match = re.search(r'slide(\d+)', rels_item)
                    if slide_num_match:
                        slide_num = int(slide_num_match.group(1))
                        rels_map[slide_num] = {}
                        # Parse relationships
                        for match in re.finditer(r'Id="([^"]+)"[^>]*Target="([^"]+)"', rels_content):
                            rid = match.group(1)
                            target = match.group(2)
                            if target.startswith('../media/') or target.startswith('media/'):
                                media_name = target.replace('../media/', '').replace('media/', '')
                                rels_map[slide_num][rid] = f'ppt/media/{media_name}'

            # Extract all media files first
            media_files = {}
            for item in archive.namelist():
                if item.startswith('ppt/media/') and item.lower().endswith(('.png', '.jpeg', '.jpg', '.gif')):
                    file_data = archive.read(item)
                    if len(file_data) < 30000:
                        continue
                    filename = os.path.basename(item)
                    image_filename = f"{base_name}_{filename}"
                    image_filepath = os.path.join(temp_dir, image_filename)
                    with open(image_filepath, "wb") as f:
                        f.write(file_data)
                    media_files[item] = image_filepath
                    images.append(image_filepath)
                    if len(images) >= 180:
                        break

            # Extract text per slide and create chunks
            for slide_entry in slide_entries:
                slide_num_match = re.search(r'slide(\d+)', slide_entry)
                if not slide_num_match:
                    continue
                slide_num = int(slide_num_match.group(1))

                slide_xml = archive.read(slide_entry).decode('utf-8', errors='ignore')

                # Extract text from XML - remove all tags and get content
                # Remove XML tags but keep text content
                text = re.sub(r'<[^>]+>', ' ', slide_xml)
                # Clean up whitespace
                text = re.sub(r'\s+', ' ', text).strip()
                # Remove common XML artifacts
                text = re.sub(r'xmlns[^=]*="[^"]*"', '', text)
                text = clean_text(text)

                # Get images for this slide from rels
                slide_images = []
                if slide_num in rels_map:
                    for rid, media_path in rels_map[slide_num].items():
                        if media_path in media_files:
                            slide_images.append(media_files[media_path])

                if text and len(text) > 5:
                    chunks.append({
                        "text": text,
                        "images": slide_images,
                        "page_number": slide_num
                    })

    except Exception as e:
        import traceback
        print(json.dumps({"success": False, "error": str(e), "traceback": traceback.format_exc()}))
        return {"success": False, "error": str(e)}

    return {"success": True, "images": images, "slide_count": slide_count, "chunks": chunks}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No PPTX path provided"}))
        sys.exit(1)

    pptx_path = sys.argv[1]
    result = extract_images(pptx_path)
    print(json.dumps(result))
