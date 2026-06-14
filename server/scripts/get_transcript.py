#!/usr/bin/env python3
"""
YouTube Transcript Extractor
Returns text segmented by real timestamps (1-minute chunks).
"""
import sys
import json
import math
import os
import socket

# Bound every network call. YouTube now IP-blocks the caption scraper, and the
# library has no timeout of its own — without this, a blocked/throttled request
# hangs for minutes before failing. A short default makes it fail fast so the
# caller can fall back to audio→Gemini transcription quickly.
socket.setdefaulttimeout(15)

from youtube_transcript_api import YouTubeTranscriptApi, NoTranscriptFound, TranscriptsDisabled

# Import text cleaner
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from text_cleaner import clean_text


def fmt_time(seconds):
    """Format seconds as MM:SS"""
    m = int(seconds // 60)
    s = int(seconds % 60)
    return f"{m:02d}:{s:02d}"


def fetch_transcript(video_id, start_time=None, end_time=None):
    """
    Fetch transcript from YouTube video and return it segmented into
    1-minute chunks with real timestamps.
    """
    try:
        try:
            transcript = YouTubeTranscriptApi().fetch(video_id, languages=['ar', 'en'])
        except Exception:
            transcript = YouTubeTranscriptApi().fetch(video_id)

        # Collect all valid snippets into a list with timing
        snippets = []
        for snippet in transcript:
            s_start = snippet.start
            s_end   = s_start + snippet.duration

            # Apply time-range filter if provided
            if start_time is not None and s_end < start_time:
                continue
            if end_time is not None and s_start > end_time:
                continue

            text = snippet.text.strip()
            if text:
                snippets.append({"start": s_start, "text": text})

        if not snippets:
            return {"success": False, "error": "No transcript text found after filtering."}

        # Group into 1-minute buckets using the actual start timestamps
        CHUNK_SECONDS = 60
        chunks = {}  # key = minute_bucket (int)

        for snip in snippets:
            bucket = int(snip["start"] // CHUNK_SECONDS)
            if bucket not in chunks:
                chunks[bucket] = {"start": snip["start"], "texts": []}
            chunks[bucket]["texts"].append(snip["text"])

        # Build the formatted transcript text with real timestamp labels
        lines = []
        transcript_chunks = []
        for bucket in sorted(chunks.keys()):
            chunk_data  = chunks[bucket]
            real_ts     = chunk_data["start"]  # first snippet's real start time
            label       = f"[{fmt_time(real_ts)}]"
            chunk_text  = " ".join(chunk_data["texts"])
            lines.append(f"{label} {chunk_text}")
            
            # Also create structured chunk for frontend
            transcript_chunks.append({
                "text": f"{label} {chunk_text}",
                "page_number": bucket,  # Use minute bucket as page number
                "images": []
            })

        # Join with double newline so the frontend paragraph-splitter works
        full_text = "\n\n".join(lines)
        
        # Clean the transcript to remove strange symbols and artifacts
        cleaned_text = clean_text(full_text)

        return {
            "success":    True,
            "transcript": cleaned_text,
            "wordCount":  len(cleaned_text.split()),
            "language":   "auto",
            "chunks":     transcript_chunks
        }

    except NoTranscriptFound:
        return {
            "success": False,
            "error":   "No transcript available for this video (no manual or automatic captions).",
            "details": "Try another video, or check if the video has CC (captions) enabled on YouTube."
        }
    except TranscriptsDisabled:
        return {
            "success": False,
            "error":   "Transcripts are disabled by the video creator."
        }
    except Exception as e:
        return {
            "success": False,
            "error":   f"Error: {str(e)}"
        }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Video ID is required"}))
        sys.exit(1)

    video_id = sys.argv[1]

    start_time = None
    if len(sys.argv) > 2 and sys.argv[2].strip():
        try:
            start_time = float(sys.argv[2])
        except ValueError:
            start_time = None

    end_time = None
    if len(sys.argv) > 3 and sys.argv[3].strip():
        try:
            v = float(sys.argv[3])
            end_time = v if v != 0 else None
        except ValueError:
            end_time = None

    result = fetch_transcript(video_id, start_time, end_time)
    print(json.dumps(result))
