import { useMemo, useState, useEffect } from "react";
import { Link } from "wouter";
import {
  BookOpen,
  Clock,
  TrendingUp,
  Zap,
  ArrowRight,
  FileText,
  FileVideo,
  Presentation,
  CheckCircle2,
  BarChart3,
  Calendar,
  Flame,
  Target,
  Award,
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

function StatCard({
  icon,
  value,
  label,
  accent,
  sub,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  accent: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.05)] border border-slate-100/80 flex flex-col gap-4 hover:shadow-[0_8px_32px_rgba(240,90,34,0.10)] transition-all duration-300 group">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", accent)}>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-black text-slate-900 leading-none">{value}</p>
        {sub && <p className="text-xs text-[#F05A22] font-bold mt-1">{sub}</p>}
        <p className="text-sm font-medium text-slate-500 mt-1">{label}</p>
      </div>
    </div>
  );
}

function LectureCard({ lecture }: { lecture: Lecture }) {
  const fileType = getFileType(lecture);
  const isVideo = fileType === "video";
  const isCompleted = lecture.status === "completed";

  const accentColor =
    fileType === "pdf"
      ? "bg-blue-600"
      : fileType === "pptx"
      ? "bg-orange-500"
      : "bg-red-600";

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
      className="group block bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-[#F05A22]/30 shadow-sm hover:shadow-[0_8px_32px_rgba(240,90,34,0.12)] transition-all duration-300 no-underline"
    >
      <div className="relative w-full aspect-video bg-slate-100 overflow-hidden">
        {isVideo && lecture.thumbnailUrl?.startsWith("http") ? (
          <img
            src={lecture.thumbnailUrl}
            alt={lecture.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div
            className={cn(
              "w-full h-full flex flex-col items-center justify-center gap-2",
              fileType === "pdf"
                ? "bg-blue-50"
                : fileType === "pptx"
                ? "bg-orange-50"
                : "bg-red-50"
            )}
          >
            <div
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md",
                accentColor
              )}
            >
              <FileIcon lecture={lecture} size={24} />
            </div>
          </div>
        )}
        <div
          className={cn(
            "absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-black text-white uppercase tracking-wide",
            isCompleted ? "bg-emerald-500" : "bg-amber-500"
          )}
        >
          {isCompleted ? "Ready" : "Processing"}
        </div>
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 py-1 text-[9px] font-black text-white text-center uppercase tracking-widest",
            accentColor,
            "opacity-90"
          )}
        >
          {fileType === "pdf" ? "PDF" : fileType === "pptx" ? "PPTX" : "VIDEO"}
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
  const { isRTL } = useLanguage();
  const [updateKey, setUpdateKey] = useState(0);

  // Sync with URL changes for search
  useEffect(() => {
    const handlePopState = () => setUpdateKey(t => t + 1);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const searchQuery = useMemo(() => {
    if (typeof window === 'undefined') return "";
    const params = new URLSearchParams(window.location.search);
    return params.get("q")?.toLowerCase() || "";
  }, [lectures, updateKey]); // Re-calculate when lectures update or URL changes

  const stats = useMemo(() => {
    const completed = lectures.filter((l) => l.status === "completed");
    const totalFlashcards = completed.reduce(
      (acc, l) => acc + (l.flashcards?.length || 0),
      0
    );
    const totalQuestions = completed.reduce(
      (acc, l) => acc + (l.questions?.length || 0),
      0
    );
    const quizAvg = totalQuestions > 0 ? Math.round((totalFlashcards / Math.max(totalQuestions, 1)) * 100) : 0;

    // Streak: lectures in last 7 days
    const recentDays = new Set(
      completed
        .filter((l) => isAfter(new Date(l.createdAt || 0), subDays(new Date(), 7)))
        .map((l) => format(new Date(l.createdAt || 0), "yyyy-MM-dd"))
    ).size;

    return {
      total: lectures.length,
      completed: completed.length,
      flashcards: totalFlashcards,
      streak: recentDays,
      quizAvg,
    };
  }, [lectures]);

  const recentLectures = useMemo(() => {
    let result = lectures;
    if (searchQuery) {
      result = result.filter((l) =>
        (l.title || "").toLowerCase().includes(searchQuery)
      );
    }
    return [...result]
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      )
      .slice(0, 6);
  }, [lectures, searchQuery]);

  const inProgress = useMemo(
    () => lectures.filter((l) => l.status === "processing").slice(0, 1)[0],
    [lectures]
  );

  const firstName = user?.displayName?.split(" ")[0] || "Scholar";

  return (
    <div className="flex min-h-screen bg-[#fafafa]" dir={isRTL ? "rtl" : "ltr"}>
      <Sidebar />
      <main className={cn("flex-1 min-h-screen flex flex-col", isRTL ? "mr-64" : "ml-64")}>
        <Header />

        <div className="px-8 py-8 flex-1 max-w-7xl mx-auto w-full space-y-8">
          {/* Welcome Banner */}
          <div className="relative bg-gradient-to-br from-[#F05A22] via-[#e84d18] to-[#c73d0e] rounded-3xl p-8 overflow-hidden shadow-[0_16px_48px_rgba(240,90,34,0.35)]">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white -translate-y-16 translate-x-16" />
              <div className="absolute bottom-0 left-1/2 w-40 h-40 rounded-full bg-white translate-y-10" />
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <p className="text-white/70 text-sm font-semibold mb-1 uppercase tracking-widest">
                  Welcome Back
                </p>
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {firstName} 👋
                </h1>
                <p className="text-white/75 mt-2 font-medium">
                  Here's what's happening with your learning today.
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<BookOpen size={22} className="text-white" />}
              value={stats.total}
              label="Total Lectures"
              accent="bg-[#F05A22]"
            />
            <StatCard
              icon={<TrendingUp size={22} className="text-white" />}
              value={`${stats.quizAvg}%`}
              label="Quiz Average"
              accent="bg-emerald-500"
              sub={stats.quizAvg >= 80 ? "Excellent!" : stats.quizAvg >= 50 ? "Keep going!" : "Keep studying"}
            />
            <StatCard
              icon={<Clock size={22} className="text-white" />}
              value={`${stats.completed}`}
              label="Completed"
              accent="bg-violet-500"
            />
            <StatCard
              icon={<Award size={22} className="text-white" />}
              value={stats.flashcards}
              label="Cards Created"
              accent="bg-amber-500"
            />
          </div>


          {/* Activity Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F05A22]/10 flex items-center justify-center text-[#F05A22]">
                <Flame size={22} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{stats.streak}</p>
                <p className="text-xs font-bold text-slate-500">Day Streak</p>
              </div>
            </div>
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{stats.completed}</p>
                <p className="text-xs font-bold text-slate-500">Lectures Done</p>
              </div>
            </div>
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-600">
                <Target size={22} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{stats.flashcards}</p>
                <p className="text-xs font-bold text-slate-500">Flashcards</p>
              </div>
            </div>
          </div>

          {/* Recent Uploads */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-[#F05A22]" />
                <h2 className="text-lg font-black text-slate-900">Recent Uploads</h2>
              </div>
              <Link
                href="/history"
                className="no-underline flex items-center gap-1.5 text-sm font-bold text-[#F05A22] hover:underline"
              >
                View All <ArrowRight size={14} />
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
              <div className="bg-white rounded-3xl p-16 text-center border border-slate-100">
                <div className="w-16 h-16 rounded-2xl bg-[#F05A22]/10 flex items-center justify-center text-[#F05A22] mx-auto mb-4">
                  <BookOpen size={32} />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">No lectures yet</h3>
                <p className="text-slate-500 text-sm mb-6">Upload your first lecture to get started.</p>
                <Link
                  href="/"
                  className="no-underline inline-flex items-center gap-2 bg-[#F05A22] text-white font-bold text-sm px-6 py-3 rounded-2xl"
                >
                  <Zap size={16} /> Analyze First Lecture
                </Link>
              </div>
            ) : recentLectures.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mx-auto mb-4">
                  <Search size={32} />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">No matching lectures</h3>
                <p className="text-slate-500 text-sm">We couldn't find anything matching "{searchQuery}"</p>
                <button 
                  onClick={() => {
                    const params = new URLSearchParams(window.location.search);
                    params.delete("q");
                    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
                    window.dispatchEvent(new Event("popstate"));
                  }}
                  className="mt-4 text-[#F05A22] font-bold text-sm hover:underline border-0 bg-transparent cursor-pointer"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {recentLectures.map((lecture) => (
                  <LectureCard key={lecture.id} lecture={lecture} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
