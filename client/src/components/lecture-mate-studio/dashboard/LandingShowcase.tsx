import { motion } from "framer-motion";
import {
  Upload,
  Sparkles,
  GraduationCap,
  FileText,
  HelpCircle,
  Layers,
  Presentation,
  Share2,
  Sigma,
  Image as ImageIcon,
  Bot,
  ArrowRight,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export default function LandingShowcase() {
  const { language, isRTL } = useLanguage();
  const ar = language === "ar";

  const t = {
    stepsKicker: ar ? "كيف يعمل" : "How it works",
    stepsTitle: ar ? "ثلاث خطوات للإتقان" : "From source to study guide in 3 steps",
    featuresKicker: ar ? "ماذا ستحصل" : "What you get",
    featuresTitle: ar ? "كل ما تحتاجه من محاضرة واحدة" : "Everything you need from a single lecture",
    featuresDesc: ar
      ? "يحوّل LectureMate أي مصدر إلى مجموعة كاملة من أدوات المذاكرة الذكية تلقائيًا."
      : "LectureMate turns any source into a complete set of AI study tools — automatically.",
  };

  const steps = [
    {
      icon: Upload,
      title: ar ? "أضف مصدرك" : "Add your source",
      desc: ar ? "ارفع ملفًا أو ألصق رابط فيديو." : "Upload a file or paste a video link.",
    },
    {
      icon: Sparkles,
      title: ar ? "الذكاء الاصطناعي يعمل" : "AI does the work",
      desc: ar ? "ينسخ، يلخّص، ويهيكل المحتوى." : "Transcribes, summarizes & structures it.",
    },
    {
      icon: GraduationCap,
      title: ar ? "ذاكر بذكاء" : "Study smarter",
      desc: ar ? "ملخصات، كويزات، شرائح وأكثر." : "Summaries, quizzes, slides & more.",
    },
  ];

  const features = [
    { icon: FileText, label: ar ? "ملخصات" : "Summaries" },
    { icon: HelpCircle, label: ar ? "كويزات" : "Quizzes" },
    { icon: Layers, label: ar ? "بطاقات تعليمية" : "Flashcards" },
    { icon: Presentation, label: ar ? "شرائح عرض" : "Slides" },
    { icon: Share2, label: ar ? "خرائط مفاهيم" : "Concept Maps" },
    { icon: Sigma, label: ar ? "معادلات" : "Formulas" },
    { icon: ImageIcon, label: ar ? "صور رئيسية" : "Key Images" },
    { icon: Bot, label: ar ? "محادثة ذكية" : "AI Chat" },
  ];

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="space-y-12 sm:space-y-16">
      {/* How it works */}
      <section className={cn(isRTL && "text-right")}>
        <div className="text-center mb-8">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F05A22]">
            {t.stepsKicker}
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-headline text-on-surface mt-2">
            {t.stepsTitle}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-3 relative">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.08 }}
                className="relative flex sm:flex-col items-center sm:text-center gap-4 sm:gap-3 rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-5 sm:p-6"
              >
                <div className="relative shrink-0 grid place-items-center h-12 w-12 rounded-2xl bg-[#F05A22]/10 text-[#F05A22]">
                  <Icon size={24} strokeWidth={2} />
                  <span className="absolute -top-2 -right-2 grid place-items-center h-5 w-5 rounded-full bg-[#F05A22] text-white text-[10px] font-bold">
                    {i + 1}
                  </span>
                </div>
                <div className={cn(isRTL ? "text-right sm:text-center" : "text-left sm:text-center")}>
                  <p className="font-bold text-on-surface">{s.title}</p>
                  <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">{s.desc}</p>
                </div>

                {i < steps.length - 1 && (
                  <ArrowRight
                    size={20}
                    className={cn(
                      "hidden sm:block absolute top-1/2 -translate-y-1/2 text-outline-variant z-10",
                      isRTL ? "-left-3 rotate-180" : "-right-3",
                    )}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* What you get */}
      <section className={cn(isRTL && "text-right")}>
        <div className="text-center mb-8 max-w-2xl mx-auto">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F05A22]">
            {t.featuresKicker}
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-headline text-on-surface mt-2">
            {t.featuresTitle}
          </h3>
          <p className="text-sm sm:text-base text-on-surface-variant mt-3 leading-relaxed">
            {t.featuresDesc}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: (i % 4) * 0.05 }}
                className="group flex flex-col items-center text-center gap-3 rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-5 sm:p-6 hover:border-[#F05A22]/40 hover:shadow-[0_8px_30px_rgba(240,90,34,0.08)] transition-all"
              >
                <div className="grid place-items-center h-11 w-11 rounded-xl bg-[#F05A22]/10 text-[#F05A22] group-hover:scale-110 transition-transform">
                  <Icon size={22} strokeWidth={2} />
                </div>
                <span className="text-sm font-semibold text-on-surface">{f.label}</span>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
