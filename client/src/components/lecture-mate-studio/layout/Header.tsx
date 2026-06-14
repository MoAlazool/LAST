import { useMemo, useState, useEffect } from "react";
import { Search, UserCircle, Languages } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export default function Header() {
  const [searchValue, setSearchValue] = useState(() => {
    if (typeof window === 'undefined') return "";
    return new URLSearchParams(window.location.search).get("q") || "";
  });
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handlePopState = () => {
      setSearchValue(new URLSearchParams(window.location.search).get("q") || "");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  const { language, toggleLanguage, isRTL } = useLanguage();
  const { user } = useAuth();

  const t = {
    recent: language === "ar" ? "المحاضرات الأخيرة" : "Recent Lectures",
    search: language === "ar" ? "ابحث في موادك..." : "Search materials...",
    account: language === "ar" ? "الحساب الشخصي" : "Account"
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    
    // Update the URL search parameter
    const params = new URLSearchParams(window.location.search);
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    
    // If we aren't on history or dashboard, we might want to redirect to history to show results
    const currentPath = window.location.pathname;
    if (currentPath !== "/history" && currentPath !== "/dashboard") {
       setLocation(`/history?${params.toString()}`);
    } else {
       window.history.replaceState({}, "", `${currentPath}?${params.toString()}`);
       // Dispatch a custom event to notify components that the URL changed
       window.dispatchEvent(new Event("popstate"));
    }
  };

  return (
    <header className={cn(
      "flex justify-end items-center w-full px-12 py-5 sticky top-0 bg-surface/95 backdrop-blur-sm z-40 border-b border-outline-variant/40",
      isRTL ? "flex-row" : "flex-row"
    )} dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center gap-5">
        <button 
          onClick={toggleLanguage}
          className="p-2 rounded-full hover:bg-surface-container-low text-on-surface-variant hover:text-[#F05A22] transition-all flex items-center gap-2 border-0 bg-transparent cursor-pointer font-bold text-xs"
          title={language === "ar" ? "Switch to English" : "التحويل للعربية"}
        >
          <Languages size={18} />
          <span>{language === "ar" ? "EN" : "AR"}</span>
        </button>

        <div className="relative">
          <Search
            className={cn(
              "absolute top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none",
              isRTL ? "right-3.5" : "left-3.5"
            )}
            size={17}
          />
          <input
            type="search"
            value={searchValue}
            onChange={handleSearchChange}
            placeholder={t.search}
            className={cn(
              "bg-surface-container-lowest rounded-full py-2.5 border border-outline-variant/50 focus:ring-2 focus:ring-[#F05A22]/25 focus:border-transparent w-[220px] sm:w-64 text-sm text-on-surface placeholder:text-on-surface-variant/70 shadow-sm",
              isRTL ? "pr-10 pl-4 text-right" : "pl-10 pr-4 text-left"
            )}
          />
        </div>

        <Link
          href="/profile"
          className="text-on-surface-variant hover:text-[#F05A22] transition-colors rounded-full p-0.5 inline-flex no-underline overflow-hidden"
          aria-label={t.account}
        >
          {user?.photoURL ? (
            <div className="w-7 h-7 rounded-full border border-outline-variant overflow-hidden">
              <img 
                src={user.photoURL} 
                alt="Profile" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <UserCircle size={26} strokeWidth={1.75} />
          )}
        </Link>
      </div>
    </header>
  );
}
