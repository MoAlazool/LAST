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
export function SidebarContent({ currentTab }: { currentTab?: string }) {
  const [location] = useLocation();
  const { user } = useAuth();
   const { language, isRTL, toggleLanguage } = useLanguage();

  const t = {
    brand: "Luminary AI",
    subBrand: language === "ar" ? "المنسق الأكاديمي" : "Academic Curator",
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
      <div className="p-6">
        <div className={cn("flex items-center justify-between mb-10", isRTL && "flex-row-reverse")}>
          <Link href="/" className={cn("flex flex-col cursor-pointer hover:opacity-80 transition-opacity", isRTL && "items-end")}>
            <span className="font-extrabold text-[20px] tracking-tight text-[#F05A22]">
              {t.brand}
            </span>
            <span className="font-semibold text-[11.5px] text-[#222]">
              {t.subBrand}
            </span>
          </Link>
          <button
            onClick={toggleLanguage}
            className="w-6 h-6 rounded-full border border-sidebar-border flex items-center justify-center hover:bg-[#FFF7ED] transition-colors group/lang"
            title={language === "ar" ? "تبديل اللغة" : "Toggle language"}
          >
            <Globe className="w-3.5 h-3.5 text-[#F05A22] group-hover/lang:scale-110 transition-transform" />
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
                    : "text-muted-foreground hover:bg-[#F9F9F9] hover:text-[#111827]",
                  isRTL && "flex-row-reverse"
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
      </div>

      <div className="mt-auto p-4 border-t border-sidebar-border space-y-4">


        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-3 p-3 rounded-2xl bg-sidebar-accent/50 cursor-pointer hover:bg-sidebar-accent transition-all duration-200 border border-transparent hover:border-sidebar-border no-underline",
            isRTL && "flex-row-reverse"
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

export function Sidebar({ currentTab }: { currentTab?: string }) {
  const { isRTL } = useLanguage();
  
  return (
    <div className={cn(
      "w-64 h-screen bg-sidebar hidden md:flex flex-col flex-shrink-0 transition-all duration-300",
      isRTL ? "border-l border-sidebar-border" : "border-r border-sidebar-border"
    )}>
      <SidebarContent currentTab={currentTab} />
    </div>
  );
}
