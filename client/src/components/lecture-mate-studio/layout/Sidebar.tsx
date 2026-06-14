import {
  LayoutDashboard,
  BookOpen,
  LayoutGrid,
  LogOut,
  BarChart3,
  Globe
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";



export default function Sidebar() {
  const [loc] = useLocation();
  const { signOut, user } = useAuth();
  const { language, isRTL, toggleLanguage } = useLanguage();

  const t = {
    dashboard: language === "ar" ? "تحليل جديد" : "New Analysis",
    dashboardOverview: language === "ar" ? "لوحة التحكم" : "Dashboard",
    library: language === "ar" ? "مكتبتي" : "My Library",
    categories: language === "ar" ? "التصنيفات" : "Categories",
    curation: language === "ar" ? "التنسيق" : "CURATION",
    logout: language === "ar" ? "الخروج من النظام" : "Logout",
  };

  const navItems = [
    { href: "/", icon: LayoutDashboard, label: t.dashboard },
    { href: "/dashboard", icon: BarChart3, label: t.dashboardOverview },
    { href: "/history", icon: BookOpen, label: t.library },
    { href: "/categories", icon: LayoutGrid, label: t.categories },
  ];



  return (
    <aside className={cn(
      "fixed top-0 h-screen w-64 bg-white z-50 flex flex-col py-8 border-slate-100 shadow-[2px_0_12px_rgba(0,0,0,0.02)] selection:bg-primary/10 selection:text-primary",
      isRTL ? "right-0 border-l" : "left-0 border-r"
    )} dir={isRTL ? "rtl" : "ltr"}>
      <div className="px-6 mb-10">
        <div className={cn("flex items-center justify-between gap-2", isRTL && "flex-row-reverse")}>
          <Link href="/" className="no-underline block hover:opacity-90 transition-opacity">
            <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20">
                L
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tighter">
                Lecture<span className="text-primary">Mate</span>
              </h1>
            </div>
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
      </div>

      <nav className="flex-1 space-y-1 px-3 overflow-y-auto">
        <div className="px-5 mb-4">
          <h2 className={cn("text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]", isRTL ? "text-right" : "text-left")}>
            {t.curation}
          </h2>
        </div>

        {navItems.map((item) => {
          const isActive = loc === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3.5 py-3 px-5 transition-all duration-200 no-underline rounded-xl group relative",
                isRTL ? "flex-row-reverse text-right" : "flex-row text-left",
                isActive
                  ? "bg-primary/10 text-primary font-bold shadow-sm"
                  : "text-slate-500 hover:text-primary hover:bg-slate-50"
              )}
            >
              {isActive && (
                <span className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-primary", isRTL ? "right-0" : "left-0")} />
              )}
              <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} className={cn(isActive ? "text-primary" : "text-slate-400 group-hover:text-primary")} />
              <span className="text-[14px]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pt-5 mt-auto border-t border-slate-100 space-y-2">
        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors no-underline border border-transparent hover:border-slate-200",
            isRTL && "flex-row-reverse"
          )}
        >
          <Avatar className="w-9 h-9 border-2 border-white shadow-sm shrink-0">
            <AvatarImage src={user?.photoURL || undefined} />
            <AvatarFallback className="bg-primary text-white text-sm font-bold">
              {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className={cn("flex flex-col min-w-0 flex-1", isRTL ? "text-right" : "text-left")}>
            <span className="text-[13px] font-semibold text-slate-900 leading-tight truncate">
              {user?.displayName || "Student"}
            </span>
            <span className="text-[11px] text-slate-400 truncate leading-tight">
              {user?.email || ""}
            </span>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => void signOut()}
          className={cn(
            "flex items-center gap-3 text-slate-500 hover:text-red-600 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors w-full bg-transparent border-0 cursor-pointer",
            isRTL && "flex-row-reverse text-right"
          )}
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">{t.logout}</span>
        </button>
      </div>
    </aside>
  );
}
