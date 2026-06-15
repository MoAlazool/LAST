import { Link, useLocation } from "wouter";
import {
  LayoutGrid,
  Library,
  GraduationCap,
  Settings,
  LogOut,
  PlusCircle,
  Globe,
  Play,
  Clock,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
export type LectureNavItem = { key: string; tab: string; label: string; icon: string };
export type LectureNav = { items: LectureNavItem[]; activeTab: string; onSelect: (tab: string) => void; onBack?: () => void };

export function SidebarContent({ currentTab, lectureNav }: { currentTab?: string; lectureNav?: LectureNav }) {
  const [location] = useLocation();
  const { user } = useAuth();
   const { language, isRTL, toggleLanguage } = useLanguage();

  const t = {
    brand: "LectureMate AI",
    subBrand: language === "ar" ? "المنسق الأكاديمي" : "Academic Curator",
    lectureSections: language === "ar" ? "أقسام المحاضرة" : "Lecture Sections",
    backToOverview: language === "ar" ? "العودة للوحة الأقسام" : "Back to Overview",
    chatHistory: language === "ar" ? "سجل المحادثات" : "Chat History",
    settings: language === "ar" ? "الإعدادات" : "Settings",
    languageShort: language === "ar" ? "عربي" : "EN",
  };

  const links = [
    { href: "/", icon: LayoutGrid, label: language === "ar" ? "تحليل جديد" : "New Analysis" },
    ...(currentTab === 'chat' ? [{ href: "/chat-history", icon: Clock, label: t.chatHistory }] : []),
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 flex-1 overflow-y-auto">
        <div className={cn("flex items-center justify-between gap-2 mb-10")}>
          <Link href="/" className="no-underline block hover:opacity-90 transition-opacity">
            <h1 className="text-xl font-black text-slate-900 tracking-tighter">
              Lecture<span className="text-primary">Mate</span>
            </h1>
          </Link>
          <button
            type="button"
            onClick={toggleLanguage}
            className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center hover:bg-primary/5 hover:border-primary/30 transition-colors shrink-0 group/lang"
            title={language === "ar" ? "تبديل اللغة" : "Toggle language"}
          >
            <Globe className="w-3.5 h-3.5 text-primary group-hover/lang:scale-110 transition-transform" />
          </button>
        </div>

        <nav className="space-y-2">
          {links.map((link) => {
            const isActive = location === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl text-[15px] font-medium transition-all duration-200 cursor-pointer group no-underline",
                  isActive
                    ? "bg-white shadow-[0_4px_20px_rgba(240,90,34,0.06)] text-[#F05A22] border border-[#F05A22]/10"
                    : "text-muted-foreground hover:bg-[#F9F9F9] hover:text-[#111827]"
                )}
              >
                <link.icon
                  size={20}
                  className={cn(
                    "shrink-0 transition-colors",
                    isActive
                      ? "text-[#F05A22]"
                      : "text-muted-foreground group-hover:text-[#111827]"
                  )}
                />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {lectureNav && lectureNav.items.length > 0 && (
          <div className="mt-8">
            <p className={cn("px-4 mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60", isRTL ? "text-right" : "text-left")}>
              {t.lectureSections}
            </p>
            <nav className="space-y-1">
              {lectureNav.items.map((item) => {
                const isActive = lectureNav.activeTab === item.tab;
                return (
                  <button
                    key={item.key}
                    onClick={() => lectureNav.onSelect(item.tab)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-[14px] font-medium transition-all duration-200 cursor-pointer group",
                      isActive
                        ? "bg-white shadow-[0_4px_20px_rgba(240,90,34,0.06)] text-[#F05A22] border border-[#F05A22]/10"
                        : "text-muted-foreground hover:bg-[#F9F9F9] hover:text-[#111827]",
                      isRTL ? "text-right" : "flex-row"
                    )}
                  >
                    <span
                      className={cn(
                        "material-symbols-outlined text-[20px] shrink-0 transition-colors",
                        isActive ? "text-[#F05A22]" : "text-muted-foreground group-hover:text-[#111827]"
                      )}
                    >
                      {item.icon}
                    </span>
                    <span className="truncate flex-1 text-start">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {lectureNav.onBack && (
              <button
                onClick={lectureNav.onBack}
                className={cn(
                  "mt-4 w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-[13px] font-bold transition-all duration-200 cursor-pointer border border-[#F05A22]/20 text-[#F05A22] hover:bg-[#F05A22] hover:text-white hover:border-[#F05A22] group",
                  isRTL ? "text-right" : "flex-row"
                )}
              >
                <span className={cn("material-symbols-outlined text-[20px] shrink-0", isRTL && "-scale-x-100")}>arrow_back</span>
                <span className="truncate flex-1 text-start">{t.backToOverview}</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-auto p-4 border-t border-sidebar-border space-y-4">


        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-3 p-3 rounded-2xl bg-sidebar-accent/50 cursor-pointer hover:bg-sidebar-accent transition-all duration-200 border border-transparent hover:border-sidebar-border no-underline"
          )}
        >
          <Avatar className="w-10 h-10 border-2 border-white shadow-sm shrink-0">
            <AvatarImage src={user?.photoURL || undefined} />
            <AvatarFallback className="bg-slate-800 text-white">
              {user?.displayName?.charAt(0).toUpperCase() ||
                user?.email?.charAt(0).toUpperCase() ||
                "U"}
            </AvatarFallback>
          </Avatar>
          <div className={cn("flex flex-col min-w-0 flex-1", isRTL ? "text-right" : "text-left")}>
            <span className="text-[14px] font-semibold text-[#111827] leading-tight truncate">
              {user?.displayName || "Bassiony"}
            </span>
            <span className="text-xs text-muted-foreground truncate leading-tight">
              {user?.email || "bassiony58@gmail.com"}
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}

export function Sidebar({ currentTab, lectureNav }: { currentTab?: string; lectureNav?: LectureNav }) {
  const { isRTL } = useLanguage();

  return (
    <div className={cn(
      "w-64 h-screen bg-sidebar hidden md:flex flex-col flex-shrink-0 transition-all duration-300",
      isRTL ? "border-l border-sidebar-border" : "border-r border-sidebar-border"
    )}>
      <SidebarContent currentTab={currentTab} lectureNav={lectureNav} />
    </div>
  );
}
