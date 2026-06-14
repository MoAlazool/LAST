import { useEffect, useRef, useState } from "react";
import { Clock, MessageSquareQuote } from "lucide-react";

export interface VideoMomentPayload {
  time: string;
  seconds: number;
  nearbyText?: string;
}

interface LectureVideoProps {
  url: string;
  isYouTube: boolean;
  transcript?: string;
  language?: string;
  isRTL?: boolean;
  onAskMoment: (payload: VideoMomentPayload) => void;
}

function formatTime(total: number): string {
  const s = Math.max(0, Math.floor(total));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

// Approximate the transcript text near a moment by time-proportion (transcript has no timestamps).
function nearbyTranscript(seconds: number, duration: number, transcript?: string): string | undefined {
  if (!transcript || !duration || duration <= 0) return undefined;
  const frac = Math.min(1, Math.max(0, seconds / duration));
  const len = transcript.length;
  const center = Math.floor(frac * len);
  const half = 1100;
  return transcript.slice(Math.max(0, center - half), center + half).trim() || undefined;
}

function getYouTubeId(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes("v=")) return url.split("v=")[1].split("&")[0];
  if (lower.includes("youtu.be/")) return url.split("youtu.be/")[1].split(/[?&]/)[0];
  if (lower.includes("/embed/")) return url.split("/embed/")[1].split(/[?&]/)[0];
  return url.split("/").pop() || "";
}

function useYouTubeApi(enabled: boolean) {
  const [ready, setReady] = useState(() => !!(window as any).YT?.Player);
  useEffect(() => {
    if (!enabled || (window as any).YT?.Player) {
      if ((window as any).YT?.Player) setReady(true);
      return;
    }
    if (!document.getElementById("yt-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "yt-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
    const prev = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => {
      prev?.();
      setReady(true);
    };
    const iv = setInterval(() => {
      if ((window as any).YT?.Player) {
        setReady(true);
        clearInterval(iv);
      }
    }, 300);
    return () => clearInterval(iv);
  }, [enabled]);
  return ready;
}

export default function LectureVideo({
  url,
  isYouTube,
  transcript,
  language = "en",
  isRTL = false,
  onAskMoment,
}: LectureVideoProps) {
  const isAr = language === "ar";
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytHostRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const apiReady = useYouTubeApi(isYouTube);
  const [lastMoment, setLastMoment] = useState<string | null>(null);

  const t = {
    askMoment: isAr ? "اسأل عن هذه اللحظة" : "Ask about this moment",
    captured: isAr ? "تم التقاط اللحظة" : "Moment captured",
    hint: isAr
      ? "أوقف الفيديو عند أي لحظة ثم اسأل عنها"
      : "Pause at any moment, then ask about it",
  };

  const videoId = isYouTube ? getYouTubeId(url) : "";

  useEffect(() => {
    if (!isYouTube || !apiReady || !ytHostRef.current || !videoId) return;
    ytPlayerRef.current = new (window as any).YT.Player(ytHostRef.current, {
      videoId,
      playerVars: { modestbranding: 1, rel: 0, playsinline: 1 },
    });
    return () => {
      try {
        ytPlayerRef.current?.destroy?.();
      } catch {
        /* ignore */
      }
    };
  }, [isYouTube, apiReady, videoId]);

  const emit = (seconds: number, duration: number) => {
    const time = formatTime(seconds);
    onAskMoment({ time, seconds, nearbyText: nearbyTranscript(seconds, duration, transcript) });
    setLastMoment(time);
    setTimeout(() => setLastMoment(null), 2500);
  };

  const handleAsk = () => {
    if (isYouTube) {
      const p = ytPlayerRef.current;
      if (!p?.getCurrentTime) return;
      try {
        p.pauseVideo?.();
      } catch {
        /* ignore */
      }
      emit(Math.floor(p.getCurrentTime() || 0), Math.floor(p.getDuration?.() || 0));
    } else {
      const v = videoRef.current;
      if (!v) return;
      v.pause();
      emit(Math.floor(v.currentTime || 0), Math.floor(v.duration || 0));
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {isYouTube ? (
          <div className="w-full h-full">
            <div ref={ytHostRef} className="w-full h-full" />
          </div>
        ) : (
          <video
            ref={videoRef}
            src={url}
            controls
            className="w-full h-full object-contain bg-black"
          />
        )}
      </div>

      {/* Action bar */}
      <div className="shrink-0 bg-slate-900 border-t border-white/10 px-4 py-3 flex items-center justify-between gap-3">
        <span className="text-[11px] text-white/40 font-medium hidden sm:flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          {t.hint}
        </span>
        <button
          onClick={handleAsk}
          className="ml-auto inline-flex items-center gap-2 bg-[#F05A22] hover:bg-[#d44a1b] text-white text-sm font-bold px-4 py-2 rounded-xl shadow-lg shadow-[#F05A22]/20 active:scale-95 transition-all"
        >
          {lastMoment ? (
            <>
              <Clock className="w-4 h-4" />
              {t.captured} · {lastMoment}
            </>
          ) : (
            <>
              <MessageSquareQuote className="w-4 h-4" />
              {t.askMoment}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
