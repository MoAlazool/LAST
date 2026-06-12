import {
  LayoutDashboard,
  BookOpen,
  LayoutGrid,
  LogOut,
  BarChart3
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLectures } from "@/hooks/useLectures";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";



export default function Sidebar() {
  const [loc] = useLocation();
  const { signOut } = useAuth();
  const { lectures } = useLectures();
  const { language, isRTL } = useLanguage();

  const t = {
    dashboard: language === "ar" ? "تحليل جديد" : "New Analysis",
    dashboardOverview: language === "ar" ? "لوحة التحكم" : "Dashboard",
    library: language === "ar" ? "مكتبتي" : "My Library",
    categories: language === "ar" ? "التصنيفات" : "Categories",
    curation: language === "ar" ? "التنسيق" : "CURATION",
    logout: language === "ar" ? "الخروج من النظام" : "Logout",
    catLabels: {
      science: language === "ar" ? "العلوم" : "Science",
      technology: language === "ar" ? "التكنولوجيا" : "Technology",
      mathematics: language === "ar" ? "الرياضيات" : "Mathematics",
      medicine: language === "ar" ? "الطب" : "Medicine",
      art: language === "ar" ? "الفن" : "Art & Design",
      history: language === "ar" ? "التاريخ" : "History",
      other: language === "ar" ? "أخرى" : "Other"
    } as Record<string, string>
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
      <div className="px-8 mb-10">
        <Link href="/" className="no-underline block hover:opacity-90 transition-opacity">
          <div className={cn("flex items-center gap-3", isRTL ? "" : "flex-row")}>
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20">
              L
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tighter">
              Lecture<span className="text-primary">Mate</span>
            </h1>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3">
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
                "flex items-center gap-3.5 py-3 px-5 transition-all duration-200 no-underline rounded-xl group",
                isRTL ? "flex-row text-right" : "flex-row text-left",
                isActive
                  ? "bg-primary/10 text-primary font-bold shadow-sm"
                  : "text-slate-500 hover:text-primary hover:bg-slate-50"
              )}
            >
              <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} className={cn(isActive ? "text-primary" : "text-slate-400 group-hover:text-primary")} />
              <span className="text-[14px]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className={cn("px-6 pt-6 space-y-4 border-t border-slate-100 mt-auto", isRTL ? "text-right" : "text-left")}>
        <button
          type="button"
          onClick={() => void signOut()}
          className={cn(
            "flex items-center gap-3 text-slate-500 hover:text-red-600 px-3 py-2 rounded-lg transition-colors w-full bg-transparent border-0 cursor-pointer group",
            isRTL && "flex-row-reverse"
          )}
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">{t.logout}</span>
        </button>
      </div>
    </aside>
  );
}
