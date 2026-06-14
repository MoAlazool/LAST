import { useRef, useState, useCallback } from "react";
import {
  CloudUpload,
  Link2,
  Video,
  FileText,
  Presentation,
  FileBox,
  FileAudio,
  FileVideo,
  Loader2,
  X,
  ClipboardPaste,
  CheckCircle2,
  Scissors,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import ProcessingModeSelector from "./ProcessingModeSelector";

interface NewAnalysisProps {
  handleAnalyze: (url: string, startTimeSeconds?: number | null, endTimeSeconds?: number | null) => Promise<void>;
  handleFileAnalyze: (file: File) => Promise<void>;
  isAnalyzing: boolean;
  selectedModel: "gpu" | "api";
  setSelectedModel: (mode: "gpu" | "api") => void;
}

const ACCEPT = "audio/*,video/*,.pdf,.doc,.docx,.ppt,.pptx";
const MAX_BYTES = 50 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function iconForFile(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["pdf"].includes(ext)) return FileText;
  if (["ppt", "pptx"].includes(ext)) return Presentation;
  if (["doc", "docx"].includes(ext)) return FileBox;
  if (["mp3", "wav", "m4a", "aac", "ogg", "flac"].includes(ext)) return FileAudio;
  if (["mp4", "mov", "mkv", "webm", "avi"].includes(ext)) return FileVideo;
  return FileBox;
}

function timeToSeconds(timeStr: string): number | undefined {
  if (!timeStr) return undefined;
  if (timeStr.includes(":")) {
    const parts = timeStr.split(":").reverse();
    let seconds = 0;
    if (parts[0]) seconds += parseInt(parts[0]) || 0;
    if (parts[1]) seconds += (parseInt(parts[1]) || 0) * 60;
    if (parts[2]) seconds += (parseInt(parts[2]) || 0) * 3600;
    return seconds;
  }
  return parseInt(timeStr);
}

export default function NewAnalysis({
  handleAnalyze,
  handleFileAnalyze,
  isAnalyzing,
  selectedModel,
  setSelectedModel,
}: NewAnalysisProps) {
  const { language, isRTL } = useLanguage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const [tab, setTab] = useState<"file" | "link">("file");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [url, setUrl] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [showTrim, setShowTrim] = useState(false);

  const t = {
    heading: language === "ar" ? "تحليل جديد" : "New Analysis",
    subheading:
      language === "ar"
        ? "ارفع ملفًا أو ألصق رابط فيديو لتبدأ المعالجة الذكية."
        : "Upload a file or paste a video link to begin smart processing.",
    tabFile: language === "ar" ? "رفع ملف" : "Upload File",
    tabLink: language === "ar" ? "رابط فيديو" : "Video Link",
    drop: language === "ar" ? "أفلت ملفك هنا" : "Drag & drop your file",
    or: language === "ar" ? "أو" : "or",
    browse: language === "ar" ? "تصفّح الملفات" : "browse files",
    formats:
      language === "ar"
        ? "PDF · PPTX · DOCX · صوت · فيديو — حتى 50 ميجابايت"
        : "PDF · PPTX · DOCX · Audio · Video — up to 50MB",
    remove: language === "ar" ? "إزالة" : "Remove",
    urlLabel: language === "ar" ? "رابط الفيديو" : "Video URL",
    urlPlaceholder: "https://youtube.com/watch?v=...",
    paste: language === "ar" ? "لصق" : "Paste",
    validYoutube: language === "ar" ? "تم اكتشاف رابط يوتيوب" : "YouTube link detected",
    trim: language === "ar" ? "اقتطاع مقطع (اختياري)" : "Trim segment (optional)",
    start: language === "ar" ? "البداية" : "Start",
    end: language === "ar" ? "النهاية" : "End",
    analyzing: language === "ar" ? "جاري التحليل..." : "Analyzing...",
    cta: language === "ar" ? "ابدأ التحليل الآن" : "Start Analysis",
    pasteFail: language === "ar" ? "تعذّر الوصول للحافظة" : "Couldn't read clipboard",
    tooBig: language === "ar" ? "الملف أكبر من 50 ميجابايت" : "File exceeds 50MB limit",
  };

  const acceptFile = useCallback(
    (f: File | undefined | null) => {
      if (!f) return;
      if (f.size > MAX_BYTES) {
        toast({ title: t.tooBig, variant: "destructive" });
        return;
      }
      setFile(f);
    },
    [toast, t.tooBig],
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    acceptFile(e.target.files?.[0]);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    if (isAnalyzing) return;
    acceptFile(e.dataTransfer.files?.[0]);
  };

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current += 1;
    if (!isAnalyzing) setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) setIsDragging(false);
  };

  const pasteUrl = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {
      toast({ title: t.pasteFail, variant: "destructive" });
    }
  };

  const isYoutube = /(?:youtube\.com|youtu\.be)/i.test(url);
  const canSubmit = tab === "file" ? !!file : url.trim().length > 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAnalyzing || !canSubmit) return;
    if (tab === "file" && file) {
      handleFileAnalyze(file);
    } else if (tab === "link") {
      handleAnalyze(url.trim(), timeToSeconds(startTime), timeToSeconds(endTime));
    }
  };

  const SelectedIcon = file ? iconForFile(file.name) : FileBox;

  return (
    <section
      dir={isRTL ? "rtl" : "ltr"}
      className="relative overflow-hidden rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-[0_8px_40px_rgba(0,0,0,0.06)]"
    >
      {/* Brand glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#F05A22]/[0.07] blur-3xl" />

      <div className="relative z-10 p-6 sm:p-8 lg:p-10">
        {/* Header */}
        <div className={cn("flex items-start gap-4 mb-6", isRTL && "flex-row-reverse text-right")}>
          <div className="shrink-0 grid place-items-center h-12 w-12 rounded-2xl bg-[#F05A22]/10 text-[#F05A22]">
            <Sparkles size={24} strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-headline text-on-surface">
              {t.heading}
            </h2>
            <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">{t.subheading}</p>
          </div>
          <div className="shrink-0 pt-1">
            <ProcessingModeSelector selectedMode={selectedModel} onChange={setSelectedModel} disabled={isAnalyzing} />
          </div>
        </div>

        {/* Tab switcher */}
        <div
          className="relative grid grid-cols-2 gap-1 p-1 rounded-2xl bg-surface-container-low border border-outline-variant/50 mb-6"
          role="tablist"
        >
          {(["file", "link"] as const).map((key) => {
            const active = tab === key;
            const Icon = key === "file" ? CloudUpload : Link2;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                disabled={isAnalyzing}
                onClick={() => setTab(key)}
                className={cn(
                  "relative z-10 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60",
                  active ? "text-white" : "text-on-surface-variant hover:text-on-surface",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="new-analysis-tab"
                    className="absolute inset-0 -z-10 rounded-xl bg-[#242424] shadow-md"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon size={16} />
                <span>{key === "file" ? t.tabFile : t.tabLink}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={submit}>
          <AnimatePresence mode="wait">
            {tab === "file" ? (
              <motion.div
                key="file"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={onFileChange}
                  className="hidden"
                  accept={ACCEPT}
                  aria-label="Upload lecture files"
                />

                {file ? (
                  /* Selected file preview */
                  <div className="flex items-center gap-4 rounded-2xl border border-outline-variant/70 bg-surface-container-low p-4">
                    <div className="grid place-items-center h-12 w-12 rounded-xl bg-[#F05A22]/10 text-[#F05A22] shrink-0">
                      <SelectedIcon size={24} />
                    </div>
                    <div className={cn("min-w-0 flex-1", isRTL ? "text-right" : "text-left")}>
                      <p className="truncate font-semibold text-on-surface" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{formatBytes(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      disabled={isAnalyzing}
                      aria-label={t.remove}
                      className="shrink-0 grid place-items-center h-9 w-9 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors disabled:opacity-50"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  /* Dropzone */
                  <div
                    onClick={() => !isAnalyzing && fileInputRef.current?.click()}
                    onDrop={onDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnter={onDragEnter}
                    onDragLeave={onDragLeave}
                    className={cn(
                      "flex flex-col items-center justify-center text-center rounded-2xl border-2 border-dashed px-6 py-12 cursor-pointer transition-all duration-200",
                      isDragging
                        ? "border-[#F05A22] bg-[#F05A22]/[0.06] scale-[1.01]"
                        : "border-outline-variant hover:border-[#F05A22]/50 hover:bg-surface-container-low/60",
                    )}
                  >
                    <motion.div
                      animate={isDragging ? { scale: 1.12 } : { scale: 1 }}
                      className="grid place-items-center h-16 w-16 rounded-full bg-[#F05A22]/10 mb-4"
                    >
                      <CloudUpload className="text-[#F05A22]" size={32} strokeWidth={2} />
                    </motion.div>
                    <p className="text-lg font-bold text-on-surface">
                      {t.drop}
                    </p>
                    <p className="text-sm text-on-surface-variant mt-1">
                      {t.or}{" "}
                      <span className="font-semibold text-[#F05A22] underline underline-offset-2">{t.browse}</span>
                    </p>
                    <p className="text-xs text-on-surface-variant/80 mt-4">{t.formats}</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="link"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-2 block">
                    {t.urlLabel}
                  </label>
                  <div className="relative flex items-center gap-2">
                    <div className="relative flex-1">
                      <Video
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                      />
                      <input
                        type="text"
                        dir="ltr"
                        placeholder={t.urlPlaceholder}
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        disabled={isAnalyzing}
                        className="w-full bg-surface-container-lowest rounded-xl py-3 pl-10 pr-4 border border-outline-variant/60 shadow-inner shadow-black/[0.02] focus:ring-2 focus:ring-[#F05A22]/25 focus:border-transparent text-sm text-on-surface outline-none transition-shadow"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={pasteUrl}
                      disabled={isAnalyzing}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-3 rounded-xl border border-outline-variant/60 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors disabled:opacity-50"
                    >
                      <ClipboardPaste size={16} />
                      <span className="hidden sm:inline">{t.paste}</span>
                    </button>
                  </div>
                  <AnimatePresence>
                    {isYoutube && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 mt-2"
                      >
                        <CheckCircle2 size={14} />
                        {t.validYoutube}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Trim toggle */}
                <div className="rounded-xl border border-outline-variant/60 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowTrim((s) => !s)}
                    disabled={isAnalyzing}
                    className="w-full flex items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50"
                  >
                    <span className="flex items-center gap-2">
                      <Scissors size={15} className="text-[#F05A22]" />
                      {t.trim}
                    </span>
                    <ChevronDown
                      size={16}
                      className={cn("transition-transform", showTrim && "rotate-180")}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {showTrim && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-2 gap-3 px-4 pb-4 pt-1">
                          {[
                            { label: t.start, val: startTime, set: setStartTime, ph: "00:00" },
                            { label: t.end, val: endTime, set: setEndTime, ph: "--:--" },
                          ].map((f) => (
                            <div key={f.label}>
                              <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant mb-1.5 block">
                                {f.label}
                              </label>
                              <input
                                type="text"
                                dir="ltr"
                                placeholder={f.ph}
                                value={f.val}
                                onChange={(e) => f.set(e.target.value)}
                                disabled={isAnalyzing}
                                className="w-full bg-surface-container-lowest rounded-lg py-2 px-3 border border-outline-variant/60 focus:ring-2 focus:ring-[#F05A22]/25 focus:border-transparent text-sm text-on-surface outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action */}
          <button
            type="submit"
            disabled={isAnalyzing || !canSubmit}
            className="mt-7 w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-[15px] font-bold text-white bg-gradient-to-r from-[#F05A22] to-[#ff7a45] shadow-lg shadow-[#F05A22]/20 hover:shadow-xl hover:shadow-[#F05A22]/25 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:from-[#242424] disabled:to-[#242424]"
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>{t.analyzing}</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>{t.cta}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </section>
  );
}
