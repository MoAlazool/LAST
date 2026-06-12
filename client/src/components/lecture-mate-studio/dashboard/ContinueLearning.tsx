import { ChevronRight, Ruler, Microscope, BookMarked, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export default function ContinueLearning() {
  const { language, isRTL } = useLanguage();

  const mockCourses = [
    {
      title: language === "ar" ? "مقدمة في الاقتصاد الكلي" : "Intro to Macroeconomics",
      description: language === "ar" 
        ? "قوانين العرض والطلب، توازن السوق، ومحاسبة الدخل القومي." 
        : "Supply and demand laws, market equilibrium, and national income accounting.",
      progress: 75,
      updated: language === "ar" ? "تم التحديث منذ ساعتين" : "Updated 2h ago",
      icon: Ruler,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: language === "ar" ? "الكيمياء العضوية: روابط الكربون" : "Organic Chemistry: Carbon Bonds",
      description: language === "ar" 
        ? "تصور التهجين والهندسة الجزيئية في الهياكل العضوية." 
        : "Visualizing hybridization and molecular geometry in organic structures.",
      progress: 42,
      updated: language === "ar" ? "تم التحديث بالأمس" : "Updated yesterday",
      icon: Microscope,
      color: "bg-emerald-100 text-emerald-600",
    },
    {
      title: language === "ar" ? "الحداثة في الأدب الغربي" : "Modernism in Western Literature",
      description: language === "ar" 
        ? "استكشاف حركات القرن العشرين وتقنيات السرد التجريبية المعاصرة." 
        : "Exploring 20th-century movements and contemporary experimental narrative techniques.",
      progress: 89,
      updated: language === "ar" ? "تم التحديث منذ 3 أيام" : "Updated 3 days ago",
      icon: BookMarked,
      color: "bg-orange-100 text-orange-600",
    },
  ];

  const t = {
    title: language === "ar" ? "متابعة التعلم" : "Continue Learning",
    desc: language === "ar" ? "أكمل من حيث توقفت في محاضراتك." : "Pick up exactly where you left off.",
    viewAll: language === "ar" ? "عرض الكل" : "View Collection",
    progress: language === "ar" ? "التقدم الدراسي" : "Mastery Progress"
  };

  return (
    <section className="mb-16" dir={isRTL ? "rtl" : "ltr"}>
      <div className={cn("flex justify-between items-end mb-8", isRTL ? "flex-row" : "flex-row")}>
        <div className={isRTL ? "text-right" : "text-left"}>
          <h3 className="text-3xl font-extrabold tracking-tight font-headline">
            {t.title}
          </h3>
          <p className="text-on-surface-variant text-[15px] mt-1">
            {t.desc}
          </p>
        </div>
        <button
          type="button"
          className={cn(
            "text-[#F05A22] text-[15px] font-semibold flex items-center gap-0.5 hover:gap-1.5 transition-all font-sans",
            isRTL ? "flex-row" : "flex-row"
          )}
        >
          {t.viewAll} 
          {isRTL ? (
            <ChevronLeft size={18} strokeWidth={2.5} />
          ) : (
            <ChevronRight size={18} strokeWidth={2.5} />
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {mockCourses.map((course, idx) => (
          <motion.div
            key={course.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={cn(
              "bg-surface-container-lowest p-6 rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_28px_rgba(192,72,24,0.08)] transition-all group cursor-pointer border border-outline-variant/30",
              isRTL ? "text-right" : "text-left"
            )}
          >
            <div className={cn("flex items-start justify-between mb-5", isRTL ? "flex-row" : "flex-row")}>
              <div
                className={cn(
                  "p-3.5 rounded-full transition-colors group-hover:bg-[#F05A22] group-hover:text-white",
                  course.color
                )}
              >
                <course.icon size={22} />
              </div>
              <span className={cn(
                "text-[9px] font-bold text-on-surface-variant tracking-[0.12em] max-w-[48%] leading-tight",
                isRTL ? "text-left" : "text-right"
              )}>
                {course.updated}
              </span>
            </div>

            <h4 className="text-xl font-bold mb-2 font-headline leading-tight">
              {course.title}
            </h4>
            <p className="text-sm text-on-surface-variant mb-8 line-clamp-2 font-medium leading-relaxed">
              {course.description}
            </p>

            <div className="space-y-3">
              <div className={cn("flex justify-between text-xs font-bold font-headline", isRTL ? "flex-row" : "flex-row")}>
                <span className="text-on-surface-variant">{t.progress}</span>
                <span className="text-[#F05A22]">{course.progress}%</span>
              </div>
              <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${course.progress}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="bg-[#F05A22] h-full rounded-full"
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
