import sys
import json
import os

# Ensure the parent directory is in the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from nano_banana import get_images_for_all_slides, get_image_for_slide

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing input JSON. Usage: python cli.py '<json_data>'"}), file=sys.stdout)
        sys.exit(1)
        
    try:
        input_data = json.loads(sys.argv[1])
    except json.JSONDecodeError as e:
        # Try reading from stdin if argv[1] is '-'
        if sys.argv[1] == '-':
            try:
                input_data = json.loads(sys.stdin.read())
            except Exception as stdin_e:
                print(json.dumps({"error": f"Invalid JSON from stdin: {stdin_e}"}), file=sys.stdout)
                sys.exit(1)
        else:
            print(json.dumps({"error": f"Invalid JSON string: {e}"}), file=sys.stdout)
            sys.exit(1)

    if isinstance(input_data, dict) and 'slides' in input_data:
        # Batch mode
        results = get_images_for_all_slides(input_data['slides'])
        print(json.dumps({"images": results}), file=sys.stdout)
    elif isinstance(input_data, list):
        # Batch mode directly with list
        results = get_images_for_all_slides(input_data)
        print(json.dumps({"images": results}), file=sys.stdout)
    elif isinstance(input_data, dict):
        # Single slide mode
        title = input_data.get('title', '')
        bullets = input_data.get('bullets', input_data.get('content', []))
        language = input_data.get('language', 'en')
        slide_number = input_data.get('slide_number', 0)
        use_scorer = input_data.get('use_scorer', True)
        
        path = get_image_for_slide(title, bullets, language, slide_number, use_scorer)
        if path:
            print(json.dumps({"image_path": path}), file=sys.stdout)
        else:
            print(json.dumps({"image_path": None, "error": "No relevant image found"}), file=sys.stdout)
    else:
        print(json.dumps({"error": "Invalid input format. Expected list of slides or a single slide dict."}), file=sys.stdout)
        sys.exit(1)

if __name__ == "__main__":
    # Ensure stdout only has JSON, suppress other prints by redirecting to stderr in the actual modules
    main()
