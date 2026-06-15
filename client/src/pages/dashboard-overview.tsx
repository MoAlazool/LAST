import { useMemo, useState, useEffect } from "react";
import { Link } from "wouter";
import {
  BookOpen,
  TrendingUp,
  ArrowRight,
  FileText,
  FileVideo,
  Presentation,
  CheckCircle2,
  Calendar,
  Flame,
  Award,
  Search,
  Sparkles,
  Loader2,
  Play,
  BarChart3,
  Layers,
} from "lucide-react";
import { useLectures } from "@/hooks/useLectures";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import Sidebar from "@/components/lecture-mate-studio/layout/Sidebar";
import Header from "@/components/lecture-mate-studio/layout/Header";
import { format, formatDistanceToNow, isAfter, subDays } from "date-fns";
import type { Lecture } from "@/lib/mockData";

function getFileType(lecture: Lecture) {
  const title = (lecture.title || "").toLowerCase();
  const type =
    lecture.sourceType ||
    (lecture.geminiFileMimeType?.includes("pdf")
      ? "pdf"
      : lecture.geminiFileMimeType?.includes("presentation")
      ? "pptx"
      : "");
  if (type === "pdf" || title.includes(".pdf")) return "pdf";
  if (type === "pptx" || title.includes(".ppt")) return "pptx";
  if (type === "youtube" || type === "video") return "video";
  return "video";
}

function FileIcon({ lecture, size = 18 }: { lecture: Lecture; size?: number }) {
  const t = getFileType(lecture);
  if (t === "pdf") return <FileText size={size} />;
  if (t === "pptx") return <Presentation size={size} />;
  return <FileVideo size={size} />;
}

function StatTile({
  icon,
  value,
  label,
  tint,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  tint: string;
}) {
  return (
    <div className="rounded-[22px] bg-white border border-slate-200/70 p-4 flex items-center gap-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_14px_32px_rgba(0,0,0,0.08)] transition-all duration-300 group">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110", tint)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-black text-slate-900 leading-none tabular-nums">{value}</p>
        <p className="text-[12.5px] font-semibold text-slate-400 mt-1 truncate">{label}</p>
      </div>
    </div>
  );
}

function LectureCard({ lecture, label }: { lecture: Lecture; label: { ready: string; processing: string } }) {
  const fileType = getFileType(lecture);
  const isVideo = fileType === "video";
  const isCompleted = lecture.status === "completed";

  const typeLabel = fileType === "pdf" ? "PDF" : fileType === "pptx" ? "PPTX" : "VIDEO";
  const typeTint =
    fileType === "pdf"
      ? "text-blue-600"
      : fileType === "pptx"
      ? "text-orange-600"
      : "text-rose-600";
  const placeholderBg =
    fileType === "pdf"
      ? "from-blue-50 to-blue-100/40 text-blue-500"
      : fileType === "pptx"
      ? "from-orange-50 to-orange-100/40 text-orange-500"
      : "from-rose-50 to-rose-100/40 text-rose-500";
  const hasThumb = isVideo && lecture.thumbnailUrl?.startsWith("http");

  const dateStr = (() => {
    try {
      const d = new Date(lecture.createdAt || Date.now());
      return isAfter(d, subDays(new Date(), 6))
        ? formatDistanceToNow(d, { addSuffix: true })
        : format(d, "MMM d, yyyy");
    } catch {
      return lecture.date || "";
    }
  })();

  return (
    <Link
      href={isCompleted ? `/lecture/${lecture.id}` : "#"}
      className="group block bg-white rounded-[20px] overflow-hidden border border-slate-200/70 hover:border-[#F05A22]/40 shadow-sm hover:shadow-[0_14px_38px_rgba(240,90,34,0.14)] hover:-translate-y-1 transition-all duration-300 no-underline"
    >
      <div className="relative w-full aspect-video overflow-hidden">
        {hasThumb ? (
          <>
            <img
              src={lecture.thumbnailUrl}
              alt={lecture.title}
              className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700 ease-out"
            />
            {/* legibility gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/10" />
            {/* play affordance */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-[#F05A22] transition-all duration-300">
                <Play size={18} className="text-white fill-white ml-0.5" />
              </div>
            </div>
          </>
        ) : (
          <div className={cn("relative w-full h-full bg-gradient-to-br flex items-center justify-center", placeholderBg)}>
            <div
              className="absolute inset-0 opacity-[0.6]"
              style={{
                backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
                backgroundSize: "16px 16px",
                color: "rgba(15,23,42,0.06)",
              }}
            />
            <div className="relative w-16 h-16 rounded-2xl bg-white/70 backdrop-blur-sm flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
              <FileIcon lecture={lecture} size={26} />
            </div>
          </div>
        )}

        {/* status badge */}
        <div
          className={cn(
            "absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide backdrop-blur-md",
            isCompleted ? "bg-emerald-500/90 text-white" : "bg-amber-500/90 text-white"
          )}
        >
          {!isCompleted && <Loader2 size={9} className="animate-spin" />}
          {isCompleted ? label.ready : label.processing}
        </div>

        {/* file-type pill */}
        <div
          className={cn(
            "absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/90 backdrop-blur-md shadow-sm",
            hasThumb ? "text-rose-600" : typeTint
          )}
        >
          {typeLabel}
        </div>
      </div>
      <div className="p-4">
        <p className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 mb-2 group-hover:text-[#F05A22] transition-colors">
          {lecture.title}
        </p>
        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
          <Calendar size={11} />
          <span>{dateStr}</span>
        </div>
      </div>
    </Link>
  );
}

export default function DashboardOverview() {
  const { lectures, isLoading } = useLectures();
  const { user } = useAuth();
  const { isRTL, language } = useLanguage();
  const isAr = language === "ar";
  const [updateKey, setUpdateKey] = useState(0);

  // Sync with URL changes for search
  useEffect(() => {
    const handlePopState = () => setUpdateKey((t) => t + 1);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const searchQuery = useMemo(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return params.get("q")?.toLowerCase() || "";
  }, [lectures, updateKey]);

  const stats = useMemo(() => {
    const completed = lectures.filter((l) => l.status === "completed");
    const totalFlashcards = completed.reduce((acc, l) => acc + (l.flashcards?.length || 0), 0);
    const totalQuestions = completed.reduce((acc, l) => acc + (l.questions?.length || 0), 0);
    const quizAvg = totalQuestions > 0 ? Math.round((totalFlashcards / Math.max(totalQuestions, 1)) * 100) : 0;

    const recentDays = new Set(
      completed
        .filter((l) => isAfter(new Date(l.createdAt || 0), subDays(new Date(), 7)))
        .map((l) => format(new Date(l.createdAt || 0), "yyyy-MM-dd"))
    ).size;

    const completion = lectures.length > 0 ? Math.round((completed.length / lectures.length) * 100) : 0;

    return {
      total: lectures.length,
      completed: completed.length,
      flashcards: totalFlashcards,
      streak: recentDays,
      quizAvg,
      completion,
    };
  }, [lectures]);

  const recentLectures = useMemo(() => {
    let result = lectures;
    if (searchQuery) {
      result = result.filter((l) => (l.title || "").toLowerCase().includes(searchQuery));
    }
    return [...result]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 6);
  }, [lectures, searchQuery]);

  const inProgress = useMemo(
    () => lectures.filter((l) => l.status === "processing")[0],
    [lectures]
  );

  // Uploads per day over the last 7 days.
  const weekly = useMemo(() => {
    const days: { label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const key = format(day, "yyyy-MM-dd");
      const count = lectures.filter((l) => {
        try {
          return format(new Date(l.createdAt || 0), "yyyy-MM-dd") === key;
        } catch {
          return false;
        }
      }).length;
      days.push({ label: format(day, "EEEEE"), count });
    }
    return days;
  }, [lectures]);
  const weeklyMax = Math.max(1, ...weekly.map((d) => d.count));
  const weeklyTotal = weekly.reduce((a, d) => a + d.count, 0);

  // Distribution of lectures by subject/category.
  const categories = useMemo(() => {
    const map = new Map<string, number>();
    lectures.forEach((l) => {
      const c = (l.category || "Other").trim() || "Other";
      map.set(c, (map.get(c) || 0) + 1);
    });
    return [...map.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [lectures]);
  const catMax = Math.max(1, ...categories.map((c) => c.count));

  const firstName = user?.displayName?.split(" ")[0] || (isAr ? "صديقي" : "Scholar");
  const hour = new Date().getHours();

  const t = {
    eyebrow: isAr ? "لوحة التحكم" : "Dashboard",
    greeting: isAr
      ? hour < 12 ? "صباح الخير" : "مساء الخير"
      : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening",
    subline: isAr ? "نظرة واضحة على رحلتك التعليمية." : "A clear view of your learning journey.",
    newAnalysis: isAr ? "تحليل جديد" : "New Analysis",
    dayStreak: isAr ? "أيام متتالية" : "day streak",
    progressEyebrow: isAr ? "تقدّم التعلّم" : "Learning Progress",
    completedOf: isAr ? "مكتملة من أصل" : "completed of",
    lecturesWord: isAr ? "محاضرة" : "lectures",
    quizShort: isAr ? "متوسط الاختبار" : "Quiz avg",
    cardsShort: isAr ? "بطاقة" : "cards",
    totalLectures: isAr ? "إجمالي المحاضرات" : "Total Lectures",
    quizAverage: isAr ? "متوسط الاختبارات" : "Quiz Average",
    completed: isAr ? "مكتملة" : "Completed",
    cardsCreated: isAr ? "البطاقات المنشأة" : "Cards Created",
    completeLabel: isAr ? "نسبة الإنجاز" : "Completion",
    weeklyActivity: isAr ? "النشاط الأسبوعي" : "Weekly Activity",
    thisWeek: isAr ? "هذا الأسبوع" : "this week",
    uploadsWord: isAr ? "رفعات" : "uploads",
    bySubject: isAr ? "حسب المادة" : "By Subject",
    noSubjects: isAr ? "لا توجد بيانات بعد" : "No data yet",
    recent: isAr ? "أحدث الملفات" : "Recent Uploads",
    viewAll: isAr ? "عرض الكل" : "View All",
    processingNow: isAr ? "قيد المعالجة الآن" : "Processing now",
    processingDesc: isAr ? "نقوم بتحليل محاضرتك، ستكون جاهزة قريباً." : "We're analyzing your lecture — it'll be ready shortly.",
    emptyTitle: isAr ? "لا توجد محاضرات بعد" : "No lectures yet",
    emptyDesc: isAr ? "ارفع أول محاضرة لتبدأ رحلتك." : "Upload your first lecture to get started.",
    analyzeFirst: isAr ? "حلّل أول محاضرة" : "Analyze First Lecture",
    noMatch: isAr ? "لا توجد محاضرات مطابقة" : "No matching lectures",
    noMatchDesc: isAr ? "لم نعثر على شيء يطابق" : "We couldn't find anything matching",
    clearSearch: isAr ? "مسح البحث" : "Clear search",
    cardLabel: { ready: isAr ? "جاهزة" : "Ready", processing: isAr ? "معالجة" : "Processing" },
  };

  return (
    <div className="flex min-h-screen bg-surface" dir={isRTL ? "rtl" : "ltr"}>
      <Sidebar />
      <main className={cn("flex-1 min-h-screen flex flex-col", isRTL ? "mr-64" : "ml-64")}>
        <Header />

        <div className="px-6 lg:px-10 py-8 flex-1 max-w-7xl mx-auto w-full space-y-7">
          {/* Masthead */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-slate-200/80 pb-7">
            <div className="min-w-0">
              <div className={cn("flex items-center gap-2.5 mb-3")}>
                <span className="font-mono text-[11px] tracking-[0.22em] uppercase text-slate-400">
                  {format(new Date(), "EEE, d MMM")}
                </span>
                <span className="h-1 w-1 rounded-full bg-[#F05A22]" />
                <span className="font-mono text-[11px] tracking-[0.22em] uppercase text-[#F05A22]">
                  {t.eyebrow}
                </span>
              </div>
              <h1 className="text-4xl lg:text-[44px] font-black tracking-tight text-slate-900 leading-[1.05]">
                {t.greeting},{" "}
                <span className="relative inline-block text-[#F05A22]">
                  {firstName}
                  <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 100 6" preserveAspectRatio="none">
                    <path d="M0,4 Q50,0 100,4" fill="none" stroke="#F05A22" strokeWidth="2" strokeOpacity="0.35" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>
              <p className="text-slate-500 mt-3 font-medium">{t.subline}</p>

              {stats.total > 0 && (
                <div className="mt-5 max-w-xs">
                  <div className={cn("flex items-center justify-between text-[11px] font-bold mb-1.5")}>
                    <span className="text-slate-400 uppercase tracking-wider">{t.completeLabel}</span>
                    <span className="text-[#F05A22] tabular-nums">{stats.completion}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200/70 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#F05A22] transition-[width] duration-[1000ms] ease-out"
                      style={{ width: `${stats.completion}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className={cn("flex items-center gap-3 shrink-0")}>
              <div className={cn("flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2.5 shadow-sm")}>
                <Flame className="w-4 h-4 text-[#F05A22]" />
                <span className="text-sm font-black text-slate-900 tabular-nums">{stats.streak}</span>
                <span className="text-xs text-slate-400 font-medium">{t.dayStreak}</span>
              </div>
              <Link
                href="/"
                className={cn(
                  "no-underline inline-flex items-center gap-2 bg-slate-900 hover:bg-[#F05A22] text-white font-bold text-sm px-5 py-3 rounded-full shadow-lg shadow-slate-900/10 hover:shadow-[#F05A22]/25 transition-all active:scale-95"
                )}
              >
                <Sparkles size={16} />
                {t.newAnalysis}
              </Link>
            </div>
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile
              icon={<BookOpen size={20} className="text-[#F05A22]" />}
              value={stats.total}
              label={t.totalLectures}
              tint="bg-[#F05A22]/10"
            />
            <StatTile
              icon={<TrendingUp size={20} className="text-emerald-600" />}
              value={`${stats.quizAvg}%`}
              label={t.quizAverage}
              tint="bg-emerald-500/10"
            />
            <StatTile
              icon={<CheckCircle2 size={20} className="text-violet-600" />}
              value={stats.completed}
              label={t.completed}
              tint="bg-violet-500/10"
            />
            <StatTile
              icon={<Award size={20} className="text-amber-600" />}
              value={stats.flashcards}
              label={t.cardsCreated}
              tint="bg-amber-500/10"
            />
          </div>

          {/* Insights: weekly activity + subject breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Weekly activity */}
            <div className="lg:col-span-2 rounded-[26px] bg-white border border-slate-200/70 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <div className={cn("flex items-center justify-between mb-5")}>
                <div className={cn("flex items-center gap-2")}>
                  <BarChart3 size={17} className="text-[#F05A22]" />
                  <h3 className="font-black text-slate-900">{t.weeklyActivity}</h3>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  <span className="text-slate-900 tabular-nums">{weeklyTotal}</span> {t.uploadsWord} · {t.thisWeek}
                </span>
              </div>
              <div className={cn("flex items-end gap-2 sm:gap-3 h-36")}>
                {weekly.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
                    <span className="text-[10px] font-bold text-slate-400 tabular-nums h-3">{d.count > 0 ? d.count : ""}</span>
                    <div className="w-full flex items-end justify-center h-full">
                      <div
                        className={cn(
                          "w-full max-w-[30px] rounded-lg transition-all duration-700 ease-out",
                          d.count > 0 ? "bg-[#F05A22] group-hover:bg-[#F05A22]" : "bg-slate-100"
                        )}
                        style={{
                          height: d.count > 0 ? `${Math.max(10, (d.count / weeklyMax) * 100)}%` : "6px",
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* By subject */}
            <div className="rounded-[26px] bg-white border border-slate-200/70 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <div className={cn("flex items-center gap-2 mb-5")}>
                <Layers size={17} className="text-violet-500" />
                <h3 className="font-black text-slate-900">{t.bySubject}</h3>
              </div>
              {categories.length === 0 ? (
                <div className="flex items-center justify-center h-28 text-sm text-slate-400 font-medium">
                  {t.noSubjects}
                </div>
              ) : (
                <div className="space-y-3.5">
                  {categories.map((c, i) => (
                    <div key={i}>
                      <div className={cn("flex items-center justify-between mb-1.5")}>
                        <span className="text-[13px] font-bold text-slate-700 capitalize truncate">{c.name}</span>
                        <span className="text-[11px] font-black text-slate-400 tabular-nums shrink-0">{c.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#F05A22] to-[#f5793f] transition-[width] duration-700 ease-out"
                          style={{ width: `${(c.count / catMax) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* In-progress banner */}
          {inProgress && (
            <Link
              href="#"
              className={cn(
                "no-underline flex items-center gap-4 rounded-[24px] bg-white border border-amber-200/80 p-5 shadow-sm",
                isRTL && "text-right"
              )}
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                <Loader2 size={22} className="animate-spin" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                  </span>
                  {t.processingNow}
                </p>
                <p className="text-slate-500 text-xs mt-0.5 truncate">{inProgress.title} — {t.processingDesc}</p>
              </div>
            </Link>
          )}

          {/* Recent Uploads */}
          <div>
            <div className={cn("flex items-center justify-between mb-5")}>
              <div className={cn("flex items-center gap-2.5")}>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">{t.recent}</h2>
                {!isLoading && recentLectures.length > 0 && (
                  <span className="font-mono text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
                    {recentLectures.length}
                  </span>
                )}
              </div>
              <Link
                href="/history"
                className={cn(
                  "no-underline group flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-[#F05A22] transition-colors"
                )}
              >
                {t.viewAll}
                <ArrowRight size={15} className={cn("transition-transform group-hover:translate-x-0.5", isRTL && "rotate-180 group-hover:-translate-x-0.5")} />
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden border border-slate-100 animate-pulse">
                    <div className="aspect-video bg-slate-100" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-slate-100 rounded w-3/4" />
                      <div className="h-3 bg-slate-50 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : lectures.length === 0 ? (
              <div className="bg-white rounded-[28px] p-16 text-center border border-slate-200/70">
                <div className="w-16 h-16 rounded-2xl bg-[#F05A22]/10 flex items-center justify-center text-[#F05A22] mx-auto mb-4">
                  <BookOpen size={32} />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{t.emptyTitle}</h3>
                <p className="text-slate-500 text-sm mb-6">{t.emptyDesc}</p>
                <Link
                  href="/"
                  className="no-underline inline-flex items-center gap-2 bg-[#F05A22] text-white font-bold text-sm px-6 py-3 rounded-2xl hover:brightness-110 transition-all"
                >
                  <Sparkles size={16} /> {t.analyzeFirst}
                </Link>
              </div>
            ) : recentLectures.length === 0 ? (
              <div className="bg-white rounded-[28px] p-12 text-center border border-slate-200/70">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mx-auto mb-4">
                  <Search size={32} />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{t.noMatch}</h3>
                <p className="text-slate-500 text-sm">{t.noMatchDesc} "{searchQuery}"</p>
                <button
                  onClick={() => {
                    const params = new URLSearchParams(window.location.search);
                    params.delete("q");
                    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
                    window.dispatchEvent(new Event("popstate"));
                  }}
                  className="mt-4 text-[#F05A22] font-bold text-sm hover:underline border-0 bg-transparent cursor-pointer"
                >
                  {t.clearSearch}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {recentLectures.map((lecture) => (
                  <LectureCard key={lecture.id} lecture={lecture} label={t.cardLabel} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
