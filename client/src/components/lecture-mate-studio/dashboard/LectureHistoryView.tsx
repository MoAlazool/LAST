import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  ArrowRight, 
  ArrowLeft, 
  Filter, 
  Trash2, 
  Eye,
  FileText,
  FileVideo,
  Presentation,
  RotateCcw,
  CalendarDays
} from "lucide-react";
import { format, formatDistanceToNow, isAfter, subDays } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useLectures } from "@/hooks/useLectures";
import { cn } from "@/lib/utils";
import type { Lecture, LectureCategory } from "@/lib/mockData";
import { useLanguage } from "@/contexts/LanguageContext";

const CATEGORY_LABELS: Record<string, { en: string; ar: string }> = {
  science: { en: "Science", ar: "العلوم" },
  technology: { en: "Technology", ar: "التكنولوجيا" },
  mathematics: { en: "Mathematics", ar: "الرياضيات" },
  medicine: { en: "Medicine", ar: "الطب" },
  history: { en: "History", ar: "التاريخ" },
  art: { en: "Art & Design", ar: "الفن والتصميم" },
  language: { en: "Languages", ar: "اللغات" },
  business: { en: "Business", ar: "الأعمال" },
  education: { en: "Education", ar: "التعليم" },
  other: { en: "Other Topics", ar: "مواضيع أخرى" }
};

export default function LectureHistoryView() {
  const { lectures, isLoading, deleteLecture } = useLectures();
  const [location, setLocation] = useLocation();
  const { language, isRTL } = useLanguage();
  
  // Make search params reactive
  const [search, setSearch] = useState(typeof window !== 'undefined' ? window.location.search : '');
  
  // Detect search changes even if pathname is the same
  useEffect(() => {
    const handlePopState = () => setSearch(window.location.search);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Also listen to wouter's location changes for initial mount and path changes
  useEffect(() => {
    setSearch(window.location.search);
  }, [location]);

  const { urlCategory, searchQuery } = useMemo(() => {
    const params = new URLSearchParams(search);
    return {
      urlCategory: params.get('category') as LectureCategory | null,
      searchQuery: params.get('q')?.toLowerCase() || ""
    };
  }, [search]);

  const [filter, setFilter] = useState<"all" | "pdf" | "youtube" | "ppt">("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const t = {
    eyebrow: language === "ar" ? "المكتبة" : "Library",
    historyTitle: language === "ar" ? "مكتبتي" : "My Library",
    libraryTitle: language === "ar" ? "مجموعة" : "Collection",
    backToDomains: language === "ar" ? "العودة للتصنيفات" : "Back to Categories",
    newest: language === "ar" ? "الأحدث" : "Newest",
    oldest: language === "ar" ? "الأقدم" : "Oldest",
    results: language === "ar" ? "محاضرة" : "lectures",
    searchingFor: language === "ar" ? "نتائج البحث عن" : "matching",
    clear: language === "ar" ? "مسح" : "Clear",
    filters: [
      { id: "all", label: language === "ar" ? "الكل" : "All" },
      { id: "pdf", label: language === "ar" ? "بي دي إف" : "PDFs" },
      { id: "youtube", label: language === "ar" ? "فيديو" : "Videos" },
      { id: "ppt", label: language === "ar" ? "شرائح" : "Slides" }
    ],
    prev: language === "ar" ? "السابق" : "Previous",
    next: language === "ar" ? "التالي" : "Next",
    noResults: language === "ar" ? "لم يتم العثور على محاضرات تطابق الفلتر الحالي." : "No lectures found matching the current filter.",
    resetFilters: language === "ar" ? "إعادة ضبط المرشحات" : "Reset Filters"
  };

  const getType = (l: Lecture) =>
    l.sourceType ||
    (l.geminiFileMimeType?.includes("pdf")
      ? "pdf"
      : l.geminiFileMimeType?.includes("presentation")
      ? "pptx"
      : "youtube");

  // Scope = category + search (before the type filter), so chip counts reflect the visible set.
  const scoped = useMemo(() => {
    let result = lectures;
    if (urlCategory) result = result.filter(l => (l.category || 'other') === urlCategory);
    if (searchQuery) result = result.filter(l => (l.title || "").toLowerCase().includes(searchQuery));
    return result;
  }, [lectures, urlCategory, searchQuery]);

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = { all: scoped.length, pdf: 0, youtube: 0, ppt: 0 };
    scoped.forEach(l => {
      const ty = getType(l);
      if (ty === "pdf") c.pdf++;
      else if (ty === "pptx") c.ppt++;
      else c.youtube++;
    });
    return c;
  }, [scoped]);

  const filteredLectures = useMemo(() => {
    const result = scoped.filter(l => {
      const type = getType(l);
      if (filter === "all") return true;
      if (filter === "youtube") return type === "youtube";
      if (filter === "pdf") return type === "pdf";
      if (filter === "ppt") return type === "pptx";
      return true;
    });
    return [...result].sort((a, b) => {
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      return sortOrder === "newest" ? tb - ta : ta - tb;
    });
  }, [scoped, filter, sortOrder]);

  const categoryName = urlCategory ? (language === "ar" ? CATEGORY_LABELS[urlCategory]?.ar : CATEGORY_LABELS[urlCategory]?.en) || urlCategory : "";

  // --- Pagination ---
  const PAGE_SIZE = 9;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredLectures.length / PAGE_SIZE));

  // Reset to first page whenever the filter/search/category changes
  useEffect(() => {
    setPage(1);
  }, [filter, urlCategory, searchQuery, sortOrder]);

  // Clamp current page if items shrink (e.g. after deletion)
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagedLectures = useMemo(
    () => filteredLectures.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredLectures, page],
  );

  const pageList = getPageList(page, totalPages);

  return (
    <div className="space-y-7" dir={isRTL ? "rtl" : "ltr"}>
      {/* Masthead */}
      <div className={cn("flex flex-col lg:flex-row lg:items-end justify-between gap-5 border-b border-slate-200/70 pb-6", isRTL && "text-right")}>
        <div className="min-w-0">
          <div className={cn("flex items-center gap-2.5 mb-3")}>
            {urlCategory ? (
              <Link href="/categories" className={cn("font-mono text-[11px] tracking-[0.22em] uppercase text-slate-400 hover:text-primary transition-colors flex items-center gap-1.5 no-underline")}>
                {isRTL ? <ArrowRight size={12} /> : <ArrowLeft size={12} />}
                {t.backToDomains}
              </Link>
            ) : (
              <span className="font-mono text-[11px] tracking-[0.22em] uppercase text-slate-400">
                {format(new Date(), "EEE, d MMM")}
              </span>
            )}
            <span className="h-1 w-1 rounded-full bg-primary" />
            <span className="font-mono text-[11px] tracking-[0.22em] uppercase text-primary">{t.eyebrow}</span>
          </div>
          <h2 className="text-4xl lg:text-[44px] font-black text-slate-900 tracking-tight leading-[1.05]">
            {urlCategory ? `${categoryName} ${t.libraryTitle}` : t.historyTitle}
          </h2>
          <p className={cn("text-slate-500 mt-2.5 font-medium flex items-center gap-2 flex-wrap")}>
            <span><span className="text-slate-900 font-bold tabular-nums">{filteredLectures.length}</span> {t.results}</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 text-sm bg-slate-100 text-slate-600 rounded-full px-3 py-0.5">
                {t.searchingFor} "<span className="font-bold">{searchQuery}</span>"
                <button
                  onClick={() => {
                    const params = new URLSearchParams(window.location.search);
                    params.delete("q");
                    setLocation(`/history${params.toString() ? `?${params.toString()}` : ""}`);
                  }}
                  className="ml-0.5 text-slate-400 hover:text-red-500 bg-transparent border-0 cursor-pointer p-0 leading-none"
                  aria-label={t.clear}
                >
                  ✕
                </button>
              </span>
            )}
          </p>
        </div>

        {/* Sort toggle (functional) */}
        <div className={cn("flex items-center gap-1 bg-white border border-slate-200 rounded-full p-1 shrink-0 shadow-sm")}>
          {([
            { id: "newest", label: t.newest },
            { id: "oldest", label: t.oldest },
          ] as const).map((s) => (
            <button
              key={s.id}
              onClick={() => setSortOrder(s.id)}
              className={cn(
                "px-4 py-1.5 rounded-full text-[13px] font-bold transition-all border-0 cursor-pointer",
                sortOrder === s.id ? "bg-slate-900 text-white shadow-sm" : "bg-transparent text-slate-500 hover:text-slate-900"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter chips with counts */}
      <div className={cn("flex flex-wrap gap-2.5")}>
        {t.filters.map((f) => {
          const isActive = filter === f.id;
          const count = typeCounts[f.id] ?? 0;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all border cursor-pointer",
                isActive
                  ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              {f.label}
              <span className={cn(
                "text-[11px] tabular-nums px-1.5 py-0.5 rounded-full font-black",
                isActive ? "bg-white/25 text-white" : "bg-slate-100 text-slate-400"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filteredLectures.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pagedLectures.map((lecture) => (
            <HistoryCard
              key={lecture.id}
              lecture={lecture}
              onDelete={() => deleteLecture(lecture.id)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-[2.5rem] p-16 text-center border border-outline-variant/30">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 text-primary">
            <Filter size={32} />
          </div>
          <p className="text-on-surface-variant font-medium mb-6">{t.noResults}</p>
          <button 
            onClick={() => { setFilter("all"); setLocation("/history"); }}
            className="px-8 py-3 bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] rounded-full font-bold text-sm shadow-lg hover:shadow-primary/20 transition-all hover:-translate-y-0.5"
          >
            {t.resetFilters}
          </button>
        </div>
      )}

      {totalPages > 1 && (
        <div className={cn("flex items-center justify-center gap-2 pt-8 pb-4")}>
          <button
            aria-label={t.prev}
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-lowest border border-outline-variant/40 text-on-surface-variant hover:text-primary hover:border-primary/40 transition-colors shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-on-surface-variant disabled:hover:border-outline-variant/40"
          >
            {isRTL ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
          </button>

          {pageList.map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="text-on-surface-variant/40 px-1.5 select-none">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all cursor-pointer",
                  p === page
                    ? "bg-primary text-white shadow-md scale-105"
                    : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low border border-outline-variant/40",
                )}
              >
                {p}
              </button>
            ),
          )}

          <button
            aria-label={t.next}
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-lowest border border-outline-variant/40 text-on-surface-variant hover:text-primary hover:border-primary/40 transition-colors shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-on-surface-variant disabled:hover:border-outline-variant/40"
          >
            {isRTL ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
          </button>
        </div>
      )}
    </div>
  );
}

/** Build a page list with ellipses, e.g. [1, "...", 4, 5, 6, "...", 12] */
function getPageList(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("...");
  pages.push(total);
  return pages;
}

function HistoryCard({ lecture, onDelete }: { lecture: Lecture, onDelete: () => void }) {
  const { language, isRTL } = useLanguage();
  
  const getFileStyle = () => {
    const title = (lecture.title || "").toLowerCase();
    const isPdfByTitle = title.includes(".pdf");
    const isPptByTitle = title.includes(".ppt") || title.includes(".pptx");

    let type = lecture.sourceType || (lecture.geminiFileMimeType?.includes("pdf") ? "pdf" : lecture.geminiFileMimeType?.includes("presentation") ? "pptx" : "");

    // Fallback to title-based detection if explicit type is missing or generic
    if (!type || type === "youtube" || type === "video" || type === "audio") {
      if (isPdfByTitle) type = "pdf";
      else if (isPptByTitle) type = "pptx";
      else if (!type) type = "youtube"; // Default to youtube if nothing else fits
    }

    switch (type) {
      case "youtube":
      case "video":
        return {
          icon: <FileVideo size={28} />,
          gradient: "from-red-500/15 to-rose-600/[0.05]",
          chip: "bg-red-600",
          label: language === "ar" ? "فيديو" : "Video",
          isVideo: true,
        };
      case "pptx":
        return {
          icon: <Presentation size={28} />,
          gradient: "from-primary/15 to-amber-500/[0.05]",
          chip: "bg-primary",
          label: "PPTX",
          isVideo: false,
        };
      case "pdf":
        return {
          icon: <FileText size={28} />,
          gradient: "from-blue-500/15 to-indigo-500/[0.05]",
          chip: "bg-blue-600",
          label: "PDF",
          isVideo: false,
        };
      default:
        return {
          icon: <FileText size={28} />,
          gradient: "from-slate-500/15 to-slate-400/[0.05]",
          chip: "bg-primary",
          label: language === "ar" ? "ملف" : "File",
          isVideo: false,
        };
    }
  };

  const style = getFileStyle();
  const isArchived = lecture.status === "failed" || lecture.status === "archived";

  const getFormattedDate = () => {
    if (lecture.date && (lecture.date.includes("Today") || lecture.date.includes("Yesterday"))) {
      return lecture.date;
    }

    try {
      const dateObj = new Date(lecture.createdAt || lecture.date || Date.now());
      if (isNaN(dateObj.getTime())) return lecture.date || "";
      const locale = language === "ar" ? ar : enUS;
      if (isAfter(dateObj, subDays(new Date(), 6))) {
        return formatDistanceToNow(dateObj, { addSuffix: true, locale });
      }
      return format(dateObj, language === "ar" ? "d MMMM yyyy" : "MMMM d, yyyy", { locale });
    } catch (e) {
      return lecture.date || "";
    }
  };

  const t = {
    archived: language === "ar" ? "مؤرشفة" : "Archived",
    completed: language === "ar" ? "مكتملة" : "Complete",
    analyzed: language === "ar" ? "تم التحليل" : "Analyzed",
    restore: language === "ar" ? "استعادة" : "Restore",
    view: language === "ar" ? "عرض" : "View",
  };

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="group relative flex flex-col bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/40 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_14px_44px_rgba(0,0,0,0.10)] hover:-translate-y-1 transition-all duration-300"
    >
      {/* Media header */}
      <div
        className={cn(
          "relative h-36 w-full overflow-hidden",
          !style.isVideo && `bg-gradient-to-br ${style.gradient}`,
        )}
      >
        {style.isVideo && lecture.thumbnailUrl && lecture.thumbnailUrl.startsWith("http") ? (
          <img
            src={lecture.thumbnailUrl}
            alt={lecture.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <div className={cn("grid place-items-center h-16 w-16 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300", style.chip)}>
              {style.icon}
            </div>
          </div>
        )}

        {/* Type chip */}
        <span
          className={cn(
            "absolute top-3 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow",
            style.chip,
            isRTL ? "right-3" : "left-3",
          )}
        >
          {style.label}
        </span>

        {/* Status chip */}
        <span
          className={cn(
            "absolute top-3 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border",
            isRTL ? "left-3" : "right-3",
            isArchived
              ? "bg-primary/10 text-primary border-primary/20"
              : "bg-emerald-50 text-emerald-600 border-emerald-100",
          )}
        >
          {isArchived ? t.archived : t.completed}
        </span>
      </div>

      {/* Body */}
      <div className={cn("flex flex-col flex-1 p-5", isRTL ? "text-right" : "text-left")}>
        <h3 className="text-base font-bold text-on-surface leading-snug line-clamp-2 min-h-[2.6rem]">
          {lecture.title}
        </h3>

        <div className={cn("flex items-center gap-1.5 text-xs text-on-surface-variant mt-2 mb-5")}>
          <CalendarDays size={14} className="text-primary shrink-0" />
          <span className="font-medium truncate">{t.analyzed}: {getFormattedDate()}</span>
        </div>

        {/* Actions */}
        <div className={cn("mt-auto flex items-center gap-2.5")}>
          <Link
            href={isArchived ? "#" : `/lecture/${lecture.id}`}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all no-underline flex items-center justify-center gap-2 active:scale-[0.98]",
              isArchived
                ? "bg-surface-container-low text-on-surface-variant cursor-default border border-outline-variant/50"
                : "bg-[#242424] text-white hover:bg-[#1a1a1a] shadow-md",
            )}
          >
            {isArchived ? (
              <>
                <RotateCcw size={16} />
                <span>{t.restore}</span>
              </>
            ) : (
              <>
                <Eye size={16} />
                <span>{t.view}</span>
              </>
            )}
          </Link>

          <button
            onClick={(e) => { e.preventDefault(); onDelete(); }}
            aria-label="Delete"
            className="w-10 h-10 shrink-0 rounded-xl bg-surface-container-low text-on-surface-variant border border-outline-variant/50 grid place-items-center hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all cursor-pointer"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
