import Sidebar from "@/components/lecture-mate-studio/layout/Sidebar";
import Header from "@/components/lecture-mate-studio/layout/Header";
import LectureHistoryView from "@/components/lecture-mate-studio/dashboard/LectureHistoryView";
import Footer from "@/components/lecture-mate-studio/layout/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export default function History() {
  const { isRTL } = useLanguage();

  return (
    <div className="flex min-h-screen" dir={isRTL ? "rtl" : "ltr"}>
      <Sidebar />

      <main className={cn(
        "flex-1 bg-surface min-h-screen flex flex-col",
        isRTL ? "mr-64" : "ml-64"
      )}>
        <Header />

        <div className="px-8 sm:px-12 py-8 sm:py-10 flex-1">
          <div className="max-w-7xl mx-auto">
            <LectureHistoryView />
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
}
