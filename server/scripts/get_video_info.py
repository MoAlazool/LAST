#!/usr/bin/env python3
"""
YouTube Video Info Extractor (resilient)

Title + channel come from the lightweight oEmbed endpoint (fast, rarely blocked).
Duration is a best-effort extra from the watch page. Every network call has a
timeout so this can NEVER hang the server (the old version had no timeout and
would block until the caller killed it after 60s when YouTube throttled the IP).
"""
import sys
import json
import re
import urllib.request
import urllib.parse
from html import unescape

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"


def _fetch(url, timeout=12):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", "replace")


def _fmt_duration(secs):
    if not secs:
        return "0:00"
    h, m, s = secs // 3600, (secs % 3600) // 60, secs % 60
    return f"{h}:{m:02d}:{s:02d}" if h > 0 else f"{m}:{s:02d}"


def get_video_info(video_id):
    watch_url = f"https://www.youtube.com/watch?v={video_id}"
    title = None
    channel = None
    duration_seconds = None

    # 1) oEmbed — fast, reliable: title + channel + thumbnail
    try:
        oembed = (
            "https://www.youtube.com/oembed?url="
            + urllib.parse.quote(watch_url, safe="")
            + "&format=json"
        )
        data = json.loads(_fetch(oembed, timeout=10))
        title = (data.get("title") or "").strip() or None
        channel = (data.get("author_name") or "").strip() or None
    except Exception:
        pass

    # 2) Watch page — best-effort for duration (+ title/channel fallback). Timed,
    #    so a throttled/hanging response fails fast instead of blocking forever.
    try:
        html = _fetch(watch_url, timeout=10)
        if not title:
            m = re.search(r"<title>(.*?)</title>", html, re.S)
            if m:
                title = unescape(m.group(1).replace(" - YouTube", "").strip())
        m = re.search(r'"lengthSeconds":"(\d+)"', html)
        if m:
            duration_seconds = int(m.group(1))
        else:
            m = re.search(r'"approxDurationMs":"(\d+)"', html)
            if m:
                duration_seconds = int(m.group(1)) // 1000
        if not channel:
            cm = re.search(r'"ownerChannelName":"([^"]+)"', html)
            if cm:
                channel = unescape(cm.group(1))
    except Exception:
        pass

    if not title:
        title = f"YouTube Video {video_id}"

    return {
        "success": True,
        "videoId": video_id,
        "title": title,
        "duration": _fmt_duration(duration_seconds),
        "durationSeconds": duration_seconds,
        "channelName": channel,
        "thumbnailUrl": f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg",
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Video ID is required"}))
        sys.exit(1)
    print(json.dumps(get_video_info(sys.argv[1])))
