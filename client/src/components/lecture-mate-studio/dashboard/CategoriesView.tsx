import { BookOpen, GraduationCap, Microscope, Palette, Binary, LineChart, Brain, Quote, Sparkles, Monitor, Cpu, Languages, Briefcase, Pencil, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useLectures } from "@/hooks/useLectures";
import type { LectureCategory } from "@/lib/mockData";
import { useLanguage } from "@/contexts/LanguageContext";

const CATEGORY_MAP_RAW: Record<LectureCategory, { nameEn: string; nameAr: string; icon: any; iconBg: string }> = {
  science: { nameEn: "Science", nameAr: "العلوم", icon: Microscope, iconBg: "bg-blue-50" },
  technology: { nameEn: "Technology", nameAr: "التكنولوجيا", icon: Cpu, iconBg: "bg-slate-50" },
  engineering: { nameEn: "Engineering", nameAr: "الهندسة", icon: Cpu, iconBg: "bg-violet-50" },
  mathematics: { nameEn: "Mathematics", nameAr: "الرياضيات", icon: Binary, iconBg: "bg-orange-50" },
  medicine: { nameEn: "Medicine", nameAr: "الطب", icon: Brain, iconBg: "bg-red-50" },
  history: { nameEn: "History", nameAr: "التاريخ", icon: BookOpen, iconBg: "bg-amber-50" },
  art: { nameEn: "Art & Design", nameAr: "الفن والتصميم", icon: Palette, iconBg: "bg-pink-50" },
  language: { nameEn: "Languages", nameAr: "اللغات", icon: Languages, iconBg: "bg-indigo-50" },
  business: { nameEn: "Business", nameAr: "الأعمال", icon: Briefcase, iconBg: "bg-emerald-50" },
  education: { nameEn: "Education", nameAr: "التعليم", icon: GraduationCap, iconBg: "bg-cyan-50" },
  other: { nameEn: "Other Topics", nameAr: "مواضيع أخرى", icon: BoxIcon, iconBg: "bg-slate-50" }
};

function BoxIcon({ size, className }: { size?: number, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
            <path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
        </svg>
    );
}

export default function CategoriesView() {
  const { lectures, isLoading } = useLectures();
  const { language, isRTL } = useLanguage();

  const t = {
    title: language === "ar" ? "مجالات المعرفة" : "Knowledge Domains",
    desc: language === "ar" 
        ? "استكشف الفئات الأكاديمية المنسقة وتحليلات المحاضرات الخاصة بك." 
        : "Browse through curated academic categories and your personalized lecture analytics.",
    emptyTitle: language === "ar" ? "لا توجد تصنيفات بعد" : "No Domains Identified",
    emptyDesc: language === "ar" 
        ? "بمجرد رفع وتحليل محاضرتك الأولى، ستظهر هنا تلقائياً مجمعة حسب الموضوع." 
        : "Once you upload and analyze your first lecture, it will appear here automatically grouped by subject.",
    curatorStats: language === "ar" ? "إحصائيات المنسق" : "CURATOR ANALYTICS",
    speedTitle: language === "ar" 
        ? <>زادت سرعة تحليلك بنسبة <span className="text-[#F05A22]">14%</span> هذا الشهر.</>
        : <>Analysis velocity increased by <span className="text-[#F05A22]">14%</span> this month.</>,
    totalLectures: language === "ar" ? "إجمالي المحاضرات" : "Total Sessions",
    timeSaved: language === "ar" ? "الوقت الموفر" : "Cognitive Time Saved",
    didYouKnow: language === "ar" ? "هل تعلم؟" : "Did you know?",
    aiFact: language === "ar"
        ? "يقوم الذكاء الاصطناعي بتصنيف محاضراتك تلقائياً بناءً على المحتوى، مما يسهل اكتشاف المفاهيم الأكاديمية ذات الصلة وتوفير وقت البحث."
        : "Our AI automatically categorizes your lectures based on semantic content, making it easier to discover related academic concepts and save research time."
  };

  // Group lectures by category
  const groupedCategories = lectures.reduce((acc, lecture) => {
    const cat = lecture.category || "other";
    const mapData = CATEGORY_MAP_RAW[cat] || CATEGORY_MAP_RAW.other;
    if (!acc[cat]) {
      acc[cat] = {
        id: cat,
        count: 0,
        lectures: [],
        name: language === "ar" ? mapData.nameAr : mapData.nameEn,
        icon: mapData.icon,
        iconBg: mapData.iconBg
      };
    }
    acc[cat].count++;
    acc[cat].lectures.push(lecture);
    return acc;
  }, {} as Record<string, any>);

  const displayedCategories = Object.values(groupedCategories);

  return (
    <div className="space-y-12 animate-in fade-in duration-700" dir={isRTL ? "rtl" : "ltr"}>
      <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-6", isRTL ? "" : "flex-row")}>
        <div className={isRTL ? "text-right" : "text-left"}>
          <h2 className="text-4xl font-black text-on-surface tracking-tight font-headline mb-2">
            {t.title}
          </h2>
          <p className="text-on-surface-variant/70 font-medium">
            {t.desc}
          </p>
        </div>
      </div>

      {displayedCategories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayedCategories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-[2.5rem] p-16 text-center border-2 border-dashed border-outline-variant/30">
            <div className="w-20 h-20 rounded-full bg-surface-container-low flex items-center justify-center mx-auto mb-6 text-on-surface-variant/40">
                <Monitor size={40} />
            </div>
            <h3 className="text-2xl font-bold text-on-surface mb-2">{t.emptyTitle}</h3>
            <p className="text-on-surface-variant/70 max-w-sm mx-auto font-medium">
                {t.emptyDesc}
            </p>
        </div>
      )}

      {/* Analytics Summary - Only show if there are lectures */}
      {lectures.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-4">
           <div className={cn(
             "lg:col-span-8 bg-[#f5e6e0]/40 rounded-[2.5rem] p-12 border border-[#F05A22]/5 relative overflow-hidden",
             isRTL ? "text-right" : "text-left"
           )}>
              <div className={cn(
                "absolute top-0 w-[40%] h-full bg-[#f5e6e0]/60",
                isRTL ? "left-0 skew-x-12 -translate-x-12" : "right-0 -skew-x-12 translate-x-12"
              )} />
              
              <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#F05A22] mb-4">{t.curatorStats}</p>
                  <h3 className={cn(
                    "text-3xl font-black text-on-surface leading-tight max-w-md mb-10",
                    isRTL ? "mr-0 ml-auto" : "ml-0 mr-auto"
                  )}>
                     {t.speedTitle}
                  </h3>
                  
                  <div className={cn("flex items-end gap-12", isRTL ? "flex-row justify-end" : "flex-row justify-start")}>
                     <div>
                        <p className="text-5xl font-black text-on-surface tabular-nums mb-1">{lectures.length}</p>
                        <p className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-wider">{t.totalLectures}</p>
                     </div>
                     <div>
                        <p className="text-5xl font-black text-on-surface tabular-nums mb-1">
                            {Math.round(lectures.length * 0.4)}h
                        </p>
                        <p className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-wider">{t.timeSaved}</p>
                     </div>
                  </div>
              </div>
           </div>

           <div className={cn(
             "lg:col-span-4 bg-white rounded-[2.5rem] p-10 shadow-sm border border-outline-variant/30 flex flex-col justify-center",
             isRTL ? "text-right" : "text-left"
           )}>
              <div className={cn(
                "w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-[#F05A22] mb-6",
                isRTL ? "mr-0 ml-auto" : "ml-0 mr-auto"
              )}>
                  <Sparkles size={24} />
              </div>
              <h4 className="text-lg font-bold text-on-surface mb-3">{t.didYouKnow}</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                 {t.aiFact}
              </p>
           </div>
        </div>
      )}
    </div>
  );
}

function CategoryCard({ category }: { category: any }) {
  const { language, isRTL } = useLanguage();
  
  const countLabel = language === "ar"
    ? (category.count === 1 ? 'محاضرة تم تحليلها' : 'محاضرات منسقة')
    : (category.count === 1 ? 'Lecture Analyzed' : 'Lectures Curated');

  const viewLibrary = language === "ar" ? "عرض المكتبة" : "View Library";

  return (
    <Link 
      href={`/history?category=${category.id}`}
      className="no-underline block h-full group"
    >
      <div className={cn(
        "bg-white h-full rounded-[3rem] p-10 shadow-[0_4px_25px_rgba(0,0,0,0.02)] border border-outline-variant/30 group-hover:border-[#F05A22]/30 group-hover:shadow-[0_20px_60px_rgba(0,0,0,0.06)] transition-all duration-500 relative overflow-hidden flex flex-col h-full",
        isRTL ? "text-right" : "text-left"
      )}>
        <div className={cn(
          "absolute top-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700",
          isRTL ? "left-0" : "right-0"
        )}>
           <category.icon size={140} />
        </div>

        <div className={cn("flex items-center gap-6 mb-8", isRTL ? "flex-row" : "flex-row")}>
          <div className={cn("w-16 h-16 rounded-[1.25rem] flex items-center justify-center shadow-inner", category.iconBg)}>
            <category.icon size={30} className="text-[#F05A22]" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-on-surface tracking-tight group-hover:text-[#F05A22] transition-colors leading-tight">
              {category.name}
            </h3>
            <p className="text-[12px] font-black text-on-surface-variant/40 uppercase tracking-[0.1em]">
              {category.count} {countLabel}
            </p>
          </div>
        </div>

        <div className={cn("mt-auto pt-6 border-t border-outline-variant/20 flex items-center justify-between gap-4", isRTL ? "flex-row" : "flex-row")}>
          <div className={cn("flex overflow-hidden", isRTL ? "-space-x-3 space-x-reverse" : "-space-x-3")}>
              {category.lectures.slice(0, 4).map((l: any) => (
                  <div key={l.id} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden shadow-sm">
                      {l.thumbnailUrl ? (
                          <img src={l.thumbnailUrl} className="w-full h-full object-cover" alt="" title={l.title} />
                      ) : (
                          <div className="w-full h-full bg-[#F05A22]/10 flex items-center justify-center text-[8px] font-bold text-[#F05A22]">
                              DOC
                          </div>
                      )}
                  </div>
              ))}
              {category.count > 4 && (
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-surface-container-low flex items-center justify-center text-[10px] font-black text-on-surface-variant z-10">
                      +{category.count - 4}
                  </div>
              )}
          </div>

          <div className={cn(
            "flex items-center group/link text-on-surface no-underline relative z-20",
            isRTL ? "justify-start flex-row" : "justify-end flex-row"
          )}>
              <span className={cn(
                "font-bold text-sm tracking-tight group-hover/link:text-[#F05A22] transition-colors whitespace-nowrap",
                isRTL ? "ml-3" : "mr-3"
              )}>{viewLibrary}</span>
              <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center group-hover/link:bg-[#F05A22] group-hover/link:text-white transition-all shadow-sm shrink-0">
                  {isRTL ? (
                    <ArrowRight size={18} className="rotate-180" />
                  ) : (
                    <ArrowRight size={18} />
                  )}
              </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
