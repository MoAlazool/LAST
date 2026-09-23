import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
// Vite resolves the worker from node_modules to a real served asset URL.
// (new URL("pdfjs-dist/...", import.meta.url) does NOT resolve bare specifiers → 404 → fallback.)
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, MessageSquareQuote, AlertTriangle, MessageSquareText } from "lucide-react";
import { cn } from "@/lib/utils";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface PdfAskPayload {
  text: string;
  page: number;
  kind: "explain" | "ask";
}

interface PdfReaderProps {
  url: string;
  language?: string;
  isRTL?: boolean;
  onAsk: (payload: PdfAskPayload) => void;
  onFallback?: () => void;
  onAskPage?: (page: number) => void;
}

interface PopoverState {
  text: string;
  top: number;
  left: number;
}

export default function PdfReader({ url, language = "en", isRTL = false, onAsk, onFallback, onAskPage }: PdfReaderProps) {
  const isAr = language === "ar";

  // Cross-origin PDFs must go through our same-origin proxy or PDF.js can't fetch them (CORS).
  const fileUrl = useMemo(() => {
    if (!url || url.startsWith("/") || url.startsWith("data:") || url.startsWith("blob:")) return url;
    try {
      const u = new URL(url, window.location.origin);
      if (u.origin === window.location.origin) return url;
      return `/api/pdf-proxy?url=${encodeURIComponent(url)}`;
    } catch {
      return url;
    }
  }, [url]);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [baseWidth, setBaseWidth] = useState(0);
  const [failed, setFailed] = useState(false);
  const [popover, setPopover] = useState<PopoverState | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const t = {
    explain: isAr ? "اشرح هذا" : "Explain",
    ask: isAr ? "اسأل عن هذا" : "Ask about this",
    askPage: isAr ? "اسأل عن الصفحة" : "Ask about page",
    page: isAr ? "صفحة" : "Page",
    of: isAr ? "من" : "of",
    hint: isAr ? "ظلّل أي نص لتشرحه أو تسأل عنه" : "Highlight any text to explain or ask about it",
    loading: isAr ? "جاري تحميل المستند..." : "Loading document…",
    failedTitle: isAr ? "تعذّر العرض التفاعلي" : "Interactive view unavailable",
    failedDesc: isAr
      ? "نعرض المستند بالوضع العادي. التحديد التفاعلي يتطلب ملفاً يسمح بالوصول المباشر."
      : "Showing the document in basic mode. Interactive selection needs a file that allows direct access.",
  };

  // Measure available width so pages fit the panel.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setBaseWidth(el.clientWidth - 32);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Clear the selection popover whenever the page or zoom changes.
  useEffect(() => {
    setPopover(null);
  }, [page, zoom]);

  const handleSelection = useCallback(() => {
    const sel = window.getSelection();
    const container = containerRef.current;
    if (!sel || sel.isCollapsed || !container) {
      setPopover(null);
      return;
    }
    const text = sel.toString().trim();
    if (text.length < 2) {
      setPopover(null);
      return;
    }
    // Ensure the selection is inside the PDF container.
    const anchorNode = sel.anchorNode;
    if (anchorNode && !container.contains(anchorNode)) return;

    const rect = sel.getRangeAt(0).getBoundingClientRect();
    const cRect = container.getBoundingClientRect();
    setPopover({
      text,
      top: rect.top - cRect.top + container.scrollTop - 8,
      left: rect.left - cRect.left + rect.width / 2 + container.scrollLeft,
    });
  }, []);

  const trigger = (kind: "explain" | "ask") => {
    if (!popover) return;
    onAsk({ text: popover.text, page, kind });
    setPopover(null);
    window.getSelection()?.removeAllRanges();
  };

  const renderWidth = useMemo(() => Math.max(240, baseWidth * zoom), [baseWidth, zoom]);

  if (failed) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border-b border-amber-100 text-amber-700">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold">{t.failedTitle}</p>
            <p className="text-[11px] leading-tight opacity-80">{t.failedDesc}</p>
          </div>
        </div>
        <iframe src={`${url}#zoom=100`} title="PDF" className="flex-1 w-full border-none bg-white" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" dir={isRTL ? "rtl" : "ltr"}>
      {/* Toolbar */}
      <div className="h-11 shrink-0 border-b border-slate-200 bg-white flex items-center justify-between px-3 gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="w-8 h-8 grid place-items-center rounded-lg text-slate-500 hover:text-primary hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            aria-label="Previous page"
          >
            {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <span className="text-xs font-bold text-slate-600 tabular-nums px-1 select-none">
            {t.page} {page} <span className="text-slate-300">/</span> {numPages || "—"}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(numPages || p, p + 1))}
            disabled={page >= numPages}
            className="w-8 h-8 grid place-items-center rounded-lg text-slate-500 hover:text-primary hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            aria-label="Next page"
          >
            {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {onAskPage && (
          <button
            onClick={() => onAskPage(page)}
            className="hidden sm:flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-bold text-primary bg-primary/10 hover:bg-primary hover:text-white transition-colors"
            title={t.askPage}
          >
            <MessageSquareQuote className="w-3.5 h-3.5" />
            <span>{t.askPage}</span>
          </button>
        )}

        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.15).toFixed(2)))}
            className="w-8 h-8 grid place-items-center rounded-lg text-slate-500 hover:text-primary hover:bg-slate-50 transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-bold text-slate-500 tabular-nums w-9 text-center select-none">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.15).toFixed(2)))}
            className="w-8 h-8 grid place-items-center rounded-lg text-slate-500 hover:text-primary hover:bg-slate-50 transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Page surface */}
      <div
        ref={containerRef}
        onMouseUp={handleSelection}
        className="flex-1 overflow-auto bg-slate-100 relative custom-scrollbar"
      >
        <Document
          file={fileUrl}
          onLoadSuccess={({ numPages: n }) => setNumPages(n)}
          onLoadError={() => { setFailed(true); onFallback?.(); }}
          onSourceError={() => { setFailed(true); onFallback?.(); }}
          loading={
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs font-medium">{t.loading}</span>
            </div>
          }
          error={<div className="p-8 text-center text-sm text-slate-400">{t.failedTitle}</div>}
          className="flex justify-center py-4"
        >
          {baseWidth > 0 && (
            <Page
              pageNumber={page}
              width={renderWidth}
              renderTextLayer
              renderAnnotationLayer={false}
              className="shadow-[0_4px_24px_rgba(0,0,0,0.10)] rounded-lg overflow-hidden bg-white"
              loading={
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              }
            />
          )}
        </Document>

        {/* Selection popover */}
        {popover && (
          <div
            className="absolute z-30 -translate-x-1/2 -translate-y-full"
            style={{ top: popover.top, left: popover.left }}
          >
            <div className="flex items-center gap-1 bg-slate-900 rounded-xl shadow-2xl p-1 animate-in fade-in zoom-in-95 duration-150">
              <button
                onClick={() => trigger("explain")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:bg-white/10 transition-colors"
              >
                <MessageSquareText className="w-3.5 h-3.5 text-primary" />
                {t.explain}
              </button>
              <div className="w-px h-5 bg-white/15" />
              <button
                onClick={() => trigger("ask")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:bg-white/10 transition-colors"
              >
                <MessageSquareQuote className="w-3.5 h-3.5 text-primary" />
                {t.ask}
              </button>
            </div>
            <div className="w-2 h-2 bg-slate-900 rotate-45 mx-auto -mt-1" />
          </div>
        )}
      </div>

      {/* Hint bar */}
      <div className="h-8 shrink-0 border-t border-slate-200 bg-white flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
        <MessageSquareQuote className="w-3 h-3" />
        {t.hint}
      </div>
    </div>
  );
}
