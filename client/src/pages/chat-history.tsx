import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { chatHistoryService, type ChatSession } from "@/lib/chatHistoryService";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Bot, User, Trash2, Search, MessageSquare, FileText,
  Video, Presentation, File, ChevronDown, ChevronRight,
  Clock, BookOpen, X, AlertTriangle
} from "lucide-react";
import { Link } from "wouter";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

// Icon per lecture type
function LectureTypeIcon({ type }: { type: ChatSession["lectureType"] }) {
  const cls = "w-4 h-4";
  if (type === "pdf") return <FileText className={cn(cls, "text-red-500")} />;
  if (type === "pptx") return <Presentation className={cn(cls, "text-orange-500")} />;
  if (type === "docx") return <FileText className={cn(cls, "text-blue-500")} />;
  if (type === "youtube" || type === "video") return <Video className={cn(cls, "text-rose-500")} />;
  if (type === "audio") return <MessageSquare className={cn(cls, "text-purple-500")} />;
  return <File className={cn(cls, "text-slate-400")} />;
}

function LectureTypeBadge({ type }: { type: ChatSession["lectureType"] }) {
  const map: Record<string, { label: string; color: string }> = {
    pdf:     { label: "PDF",        color: "bg-red-50 text-red-600 border-red-200" },
    pptx:    { label: "PowerPoint", color: "bg-orange-50 text-orange-600 border-orange-200" },
    docx:    { label: "Word",       color: "bg-blue-50 text-blue-600 border-blue-200" },
    youtube: { label: "YouTube",    color: "bg-rose-50 text-rose-600 border-rose-200" },
    video:   { label: "Video",      color: "bg-rose-50 text-rose-600 border-rose-200" },
    audio:   { label: "Audio",      color: "bg-purple-50 text-purple-600 border-purple-200" },
    unknown: { label: "Lecture",    color: "bg-slate-50 text-slate-500 border-slate-200" },
  };
  const { label, color } = map[type] ?? map.unknown;
  return (
    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider", color)}>
      {label}
    </span>
  );
}

function formatRelativeTime(ts: number, lang: string): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (lang === "ar") {
    if (mins < 1) return "الآن";
    if (mins < 60) return `منذ ${mins} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${days} يوم`;
  }
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export default function ChatHistoryPage() {
  const { user } = useAuth();
  const { language, isRTL } = useLanguage();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [clearAll, setClearAll] = useState(false);

  const t = {
    title: language === "ar" ? "سجل المحادثات" : "Chat History",
    subtitle: language === "ar" ? "جميع محادثاتك مع المنسق الأكاديمي مرتبة حسب المحاضرة" : "All your Academic Curator conversations, organized by lecture",
    search: language === "ar" ? "ابحث في المحادثات..." : "Search conversations...",
    empty: language === "ar" ? "لا توجد محادثات بعد" : "No conversations yet",
    emptyHint: language === "ar" ? "ابدأ التحدث مع المنسق الأكاديمي في أي محاضرة" : "Start chatting with the AI Curator inside any lecture",
    messages: language === "ar" ? "رسالة" : "messages",
    deleteSession: language === "ar" ? "حذف المحادثة" : "Delete Session",
    deleteAll: language === "ar" ? "حذف الكل" : "Clear All",
    confirmDelete: language === "ar" ? "هل أنت متأكد؟" : "Are you sure?",
    confirmDeleteBtn: language === "ar" ? "نعم، احذف" : "Yes, delete",
    cancelBtn: language === "ar" ? "إلغاء" : "Cancel",
    openLecture: language === "ar" ? "فتح المحاضرة" : "Open Lecture",
    noResults: language === "ar" ? "لا توجد نتائج مطابقة" : "No matching conversations",
    you: language === "ar" ? "أنت" : "You",
    agent: language === "ar" ? "المنسق" : "Agent",
  };

  const allSessions = useMemo((): ChatSession[] => {
    if (!user?.uid) return [];
    return chatHistoryService.getAllSessions(user.uid);
  }, [user?.uid]);

  const [sessions, setSessions] = useState<ChatSession[]>(allSessions);

  const filtered = useMemo(() => {
    if (!search.trim()) return sessions;
    const q = search.toLowerCase();
    return sessions.filter(s =>
      s.lectureTitle.toLowerCase().includes(q) ||
      s.messages.some(m => m.content.toLowerCase().includes(q))
    );
  }, [sessions, search]);

  const handleDeleteSession = (lectureId: string) => {
    if (!user?.uid) return;
    chatHistoryService.clearSession(user.uid, lectureId);
    setSessions(prev => prev.filter(s => s.lectureId !== lectureId));
    setConfirmDelete(null);
    if (expandedId === lectureId) setExpandedId(null);
  };

  const handleClearAll = () => {
    if (!user?.uid) return;
    chatHistoryService.clearAllSessions(user.uid);
    setSessions([]);
    setClearAll(false);
  };

  return (
    <AppLayout currentTab="chat">
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 max-w-5xl mx-auto w-full" dir={isRTL ? "rtl" : "ltr"}>
        {/* Header */}
        <div className={cn("flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8", isRTL && "md:flex-row-reverse")}>
          <div>
            <p className="text-[#F05A22] font-black text-[10px] uppercase tracking-widest mb-2">
              {language === "ar" ? "المنسق الأكاديمي" : "Academic Curator"}
            </p>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t.title}</h1>
            <p className="text-slate-500 text-sm mt-1">{t.subtitle}</p>
          </div>
          {sessions.length > 0 && (
            <button
              onClick={() => setClearAll(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-xs font-bold transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t.deleteAll}
            </button>
          )}
        </div>

        {/* Search */}
        {sessions.length > 0 && (
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.search}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F05A22]/20 focus:border-[#F05A22]/50 transition-all"
              dir="auto"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Empty states */}
        {sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-[#F05A22]/10 flex items-center justify-center mb-6">
              <MessageSquare className="w-10 h-10 text-[#F05A22]" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">{t.empty}</h3>
            <p className="text-slate-500 text-sm max-w-xs">{t.emptyHint}</p>
            <Link href="/">
              <button className="mt-6 px-6 py-3 bg-[#F05A22] text-white rounded-2xl font-bold text-sm hover:bg-[#D44A1B] transition-all shadow-lg shadow-[#F05A22]/20">
                {language === "ar" ? "تصفح المحاضرات" : "Browse Lectures"}
              </button>
            </Link>
          </div>
        )}

        {sessions.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="w-8 h-8 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">{t.noResults}</p>
            <button onClick={() => setSearch("")} className="mt-3 text-sm text-[#F05A22] font-bold hover:underline">
              {language === "ar" ? "مسح البحث" : "Clear search"}
            </button>
          </div>
        )}

        {/* Session cards */}
        <div className="space-y-4">
          <AnimatePresence>
            {filtered.map(session => {
              const isExpanded = expandedId === session.lectureId;
              const userMessages = session.messages.filter(m => m.role === "user");
              const lastMsg = session.messages[session.messages.length - 1];
              const isDeleting = confirmDelete === session.lectureId;

              return (
                <motion.div
                  key={session.lectureId}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                >
                  {/* Session header */}
                  <div
                    className={cn(
                      "flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors",
                      isRTL && "flex-row-reverse"
                    )}
                    onClick={() => setExpandedId(isExpanded ? null : session.lectureId)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#F05A22]/10 flex items-center justify-center shrink-0">
                      <LectureTypeIcon type={session.lectureType} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={cn("flex items-center gap-2 mb-0.5", isRTL && "flex-row-reverse")}>
                        <p className="font-bold text-slate-900 text-sm truncate max-w-[280px]">{session.lectureTitle}</p>
                        <LectureTypeBadge type={session.lectureType} />
                      </div>
                      <div className={cn("flex items-center gap-3 text-[11px] text-slate-400", isRTL && "flex-row-reverse")}>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {userMessages.length} {t.messages}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(session.lastUpdated, language)}
                        </span>
                      </div>
                    </div>
                    <div className={cn("flex items-center gap-2 shrink-0", isRTL && "flex-row-reverse")}>
                      <Link href={`/lecture/${session.lectureId}?tab=chat`}>
                        <button
                          onClick={e => e.stopPropagation()}
                          className="text-[10px] px-3 py-1.5 rounded-lg border border-[#F05A22]/30 text-[#F05A22] hover:bg-[#F05A22]/5 font-bold transition-all"
                        >
                          {t.openLecture}
                        </button>
                      </Link>
                      <button
                        onClick={e => { e.stopPropagation(); setConfirmDelete(session.lectureId); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                        title={t.deleteSession}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className={cn("transition-transform duration-200", isExpanded ? "rotate-180" : "")}>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  {/* Delete confirm inline */}
                  <AnimatePresence>
                    {isDeleting && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-center justify-between px-5 py-3 bg-red-50 border-t border-red-100">
                          <div className={cn("flex items-center gap-2 text-red-600 text-sm font-medium", isRTL && "flex-row-reverse")}>
                            <AlertTriangle className="w-4 h-4" />
                            {t.confirmDelete}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
                            >
                              {t.cancelBtn}
                            </button>
                            <button
                              onClick={() => handleDeleteSession(session.lectureId)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500 text-white hover:bg-red-600 transition-all"
                            >
                              {t.confirmDeleteBtn}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Expanded message log */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-slate-100 max-h-[500px] overflow-y-auto px-5 py-4 space-y-4 custom-scrollbar bg-slate-50">
                          {session.messages.map(msg => (
                            <div
                              key={msg.id}
                              className={cn(
                                "flex gap-3",
                                msg.role === "user" ? "flex-row-reverse" : "flex-row"
                              )}
                            >
                              <div className={cn(
                                "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                                msg.role === "ai" ? "bg-[#F05A22]/10" : "bg-slate-200"
                              )}>
                                {msg.role === "ai"
                                  ? <Bot className="w-3.5 h-3.5 text-[#F05A22]" />
                                  : <User className="w-3.5 h-3.5 text-slate-500" />
                                }
                              </div>
                              <div className={cn(
                                "flex flex-col gap-1 max-w-[80%]",
                                msg.role === "user" ? "items-end" : "items-start"
                              )}>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                                  {msg.role === "ai" ? t.agent : t.you}
                                </p>
                                <div className={cn(
                                  "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                                  msg.role === "ai"
                                    ? "bg-white border border-slate-200 text-slate-800"
                                    : "bg-[#F05A22] text-white"
                                )}>
                                  {msg.image && (
                                    <div className="mb-2 rounded-lg overflow-hidden max-w-[200px]">
                                      <img src={msg.image} alt="attachment" className="w-full h-auto object-cover" />
                                    </div>
                                  )}
                                  {msg.role === "ai" ? (
                                    <div className="prose prose-sm prose-slate max-w-none text-slate-800">
                                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                        {msg.content.length > 600 ? msg.content.substring(0, 600) + "..." : msg.content}
                                      </ReactMarkdown>
                                    </div>
                                  ) : (
                                    <div dir="auto">{msg.content}</div>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 px-1">
                                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Clear All confirm modal */}
        <AnimatePresence>
          {clearAll && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setClearAll(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full"
                onClick={e => e.stopPropagation()}
              >
                <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mb-5 mx-auto">
                  <Trash2 className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="text-xl font-black text-slate-900 text-center mb-2">
                  {language === "ar" ? "حذف جميع المحادثات" : "Delete All Conversations"}
                </h3>
                <p className="text-slate-500 text-sm text-center mb-6">
                  {language === "ar"
                    ? "سيتم حذف جميع سجلات المحادثات نهائياً. هذا الإجراء لا يمكن التراجع عنه."
                    : "All chat history will be permanently deleted. This action cannot be undone."}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setClearAll(false)}
                    className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all"
                  >
                    {t.cancelBtn}
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                  >
                    {t.confirmDeleteBtn}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
