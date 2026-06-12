import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export default function MasterySection() {
  const { language, isRTL } = useLanguage();

  const t = {
    dailyGoal: language === "ar" ? "الهدف اليومي" : "DAILY TARGET",
    goalDesc: language === "ar" ? "إكمال محاضرتين" : "2 Lectures Complete",
    profTitle: language === "ar" ? "رؤية المركز الأكاديمي" : "Academic Curator Insight",
    profName: language === "ar" ? "محمد شريف القصاص" : "Mohamed Sherif El-Ksasy",
    profQuote: language === "ar" 
      ? "\"ركز على الروابط العصبية بين هذه المفاهيم. مراجعتك اليوم تبدو دقيقة ومركزة للغاية، يا صديقي المبدع.\"" 
      : "\"Your synthesis of these concepts is remarkable. Focus on the interplay between these theories; that's where true mastery resides.\"",
    titlePrefix: language === "ar" ? "الإتقان من خلال" : "Mastery through",
    titleSuffix: language === "ar" ? "التنسيق التحريري الذكي" : "Curatorial Precision",
    desc: language === "ar" 
      ? "Lecture Mate ليس مجرد أرشيف للمحاضرات؛ إنه مساحة عمل حية تفهم رحلتك الدراسية وتتعمق في احتياجاتك. نحن ننسق محتواك بدقة لنسمح لك بالتركيز على بناء الروابط المعرفية التي تؤدي إلى الإتقان الحقيقي للمادة." 
      : "LectureMate transcends traditional note-taking. It's a living workspace that understands your cognitive requirements. We curate your content with surgical precision, allowing you to focus on the neural connections that lead to genuine subject mastery.",
    features: [
      language === "ar" ? "تلخيص مدعوم بالذكاء الاصطناعي" : "AI-Powered Narrative Synthesis",
      language === "ar" ? "مجموعات دراسة تعاونية متطورة" : "Advanced Collaborative Workspaces",
      language === "ar" ? "توليف شامل للمواد التعليمية" : "Holistic Material Integration",
    ]
  };

  return (
    <section className="py-16 sm:py-20 relative" dir={isRTL ? "rtl" : "ltr"}>
      <div className={cn("flex flex-col lg:flex-row items-center gap-14 lg:gap-20", isRTL ? "" : "flex-row-reverse")}>
        <div className="lg:w-1/2 relative h-[400px] w-full min-h-[400px]">
          <div className={cn(
            "absolute inset-0 bg-[#f8f5f2] rounded-[2rem] shadow-inner shadow-black/[0.03]",
            isRTL ? "rotate-[1deg]" : "-rotate-[1deg]"
          )} />

          <motion.div
            initial={{ opacity: 0, x: isRTL ? -20 : 20, rotate: isRTL ? 2 : -2 }}
            animate={{ opacity: 1, x: 0, rotate: isRTL ? 2 : -2 }}
            transition={{ delay: 0.2 }}
            className={cn(
              "absolute top-8 z-20 bg-surface-container-lowest p-7 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.1)] max-w-[280px] sm:max-w-sm w-[calc(100%-2rem)] border border-outline-variant/20",
              isRTL ? "left-6 sm:left-10 text-right" : "right-6 sm:right-10 text-left"
            )}
          >
            <h5 className="text-[#F05A22] font-bold mb-2 uppercase text-xs tracking-widest font-headline">
              {t.dailyGoal}
            </h5>
            <p className="font-extrabold text-2xl mb-6 font-headline tracking-tight text-on-surface">
              {t.goalDesc}
            </p>
            <div className={cn("flex gap-2", isRTL ? "flex-row" : "flex-row")}>
              <div className="h-1.5 flex-1 bg-[#F05A22] rounded-full" />
              <div className="h-1.5 flex-1 bg-[#F05A22] rounded-full" />
              <div className="h-1.5 flex-1 bg-surface-container-low rounded-full" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: isRTL ? 20 : -20, rotate: isRTL ? -4 : 4 }}
            animate={{ opacity: 1, x: 0, rotate: isRTL ? -4 : 4 }}
            transition={{ delay: 0.4 }}
            className={cn(
              "absolute bottom-8 z-10 bg-surface-container-lowest p-7 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] max-w-md w-[calc(100%-1rem)] border border-outline-variant/20",
              isRTL ? "right-2 lg:right-0 lg:-right-6 text-right" : "left-2 lg:left-0 lg:-left-6 text-left"
            )}
          >
            <div className={cn("flex items-center gap-4 mb-4", isRTL ? "flex-row" : "flex-row")}>
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
                <img
                  src="https://picsum.photos/seed/prof1/80/80"
                  alt="Mohamed Sherif El-Ksasy"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className={isRTL ? "text-right" : "text-left"}>
                <p className="text-[10px] font-bold text-[#F05A22] uppercase tracking-widest font-headline">
                  {t.profTitle}
                </p>
                <p className="font-bold text-on-surface font-headline">
                  {t.profName}
                </p>
              </div>
            </div>
            <p className="italic text-on-surface-variant font-medium leading-relaxed">
              {t.profQuote}
            </p>
          </motion.div>
        </div>

        <div className={cn("lg:w-1/2", isRTL ? "text-right" : "text-left")}>
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold mb-8 font-headline leading-tight tracking-tight text-on-surface"
          >
            {isRTL ? (
              <>الإتقان من خلال <br /></>
            ) : (
              <>Ignite Mastery through <br /></>
            )}
            <span className="text-[#F05A22] underline decoration-[#F05A22]/20 underline-offset-8">
              {t.titleSuffix}
            </span>
          </motion.h3>
          <p className="text-lg text-on-surface-variant mb-10 font-medium leading-relaxed">
            {t.desc}
          </p>

          <div className="space-y-6">
            {t.features.map((feature, idx) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + idx * 0.1 }}
                className={cn("flex items-center gap-4 font-bold text-on-surface font-headline", isRTL ? "flex-row" : "flex-row")}
              >
                <div className="bg-[#F05A22]/10 p-1 rounded-full text-[#F05A22]">
                  <CheckCircle2 size={24} />
                </div>
                <span>{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
