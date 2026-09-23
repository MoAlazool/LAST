import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Globe, ArrowLeft, ArrowRight, FileText, Bot, BrainCircuit, ListChecks } from "lucide-react";

/**
 * Split-screen auth layout: an editorial marketing panel on one side and the form on the other.
 * Direction-aware (the panel flips for RTL) and bilingual.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  const { language, isRTL, toggleLanguage } = useLanguage();
  const isAr = language === "ar";

  const t = {
    backHome: isAr ? "العودة للرئيسية" : "Back to home",
    eyebrow: isAr ? "منصة الدراسة الذكية" : "AI study platform",
    headline: isAr ? "حوّل أي محاضرة إلى إتقان." : "Turn any lecture into mastery.",
    sub: isAr
      ? "ارفع فيديو أو PDF أو رابط، ودَع الذكاء الاصطناعي ينشئ لك ملخصات وخرائط مفاهيم واختبارات وبطاقات ومساعداً ذكياً."
      : "Upload a video, PDF, or link and let AI build summaries, concept maps, quizzes, flashcards, and a smart tutor.",
    quote: isAr
      ? "«اختصرت عليّ ساعات من المراجعة قبل كل امتحان.»"
      : "“It cut hours off my revision before every exam.”",
    quoteBy: isAr ? "طالب طب — سنة ثالثة" : "Medical student — 3rd year",
  };

  const features = [
    { icon: FileText, label: isAr ? "تفريغ وملخصات ذكية" : "Transcripts & smart summaries" },
    { icon: BrainCircuit, label: isAr ? "خرائط مفاهيم بصرية" : "Visual concept maps" },
    { icon: ListChecks, label: isAr ? "اختبارات وبطاقات تكيفية" : "Adaptive quizzes & flashcards" },
    { icon: Bot, label: isAr ? "وكيل ذكي يجيب عن أسئلتك" : "An AI agent that answers you" },
  ];

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className={cn("min-h-screen w-full flex bg-[#FAFAF8]")} dir={isRTL ? "rtl" : "ltr"}>
      {/* Marketing panel */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-1/2 relative overflow-hidden bg-[#17120F] text-white p-12 xl:p-16 flex-col justify-between">
        {/* texture + glow */}
        <div
          className="absolute inset-0 opacity-[0.5] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)", backgroundSize: "24px 24px" }}
        />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/25 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-10 w-80 h-80 rounded-full bg-primary/10 blur-[100px] pointer-events-none" />

        {/* brand */}
        <Link href="/landing" className="relative z-10 flex items-center gap-3 no-underline w-fit">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-black text-xl shadow-lg shadow-primary/30">L</div>
          <span className="text-xl font-black tracking-tight text-white">
            Lecture<span className="text-primary">Mate</span>
          </span>
        </Link>

        {/* center content */}
        <div className="relative z-10 max-w-md">
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-white/40">{t.eyebrow}</span>
          <h1 className="mt-4 text-4xl xl:text-5xl font-black leading-[1.1] tracking-tight">{t.headline}</h1>
          <p className="mt-5 text-white/55 text-[15px] leading-relaxed font-medium">{t.sub}</p>

          <div className="mt-9 space-y-3.5">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: isRTL ? 12 : -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.08 }}
                className={cn("flex items-center gap-3.5")}
              >
                <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-primary shrink-0">
                  <f.icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-white/80">{f.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* testimonial */}
        <div className="relative z-10 border-t border-white/10 pt-6 max-w-md">
          <p className="text-white/70 italic text-[15px] leading-relaxed">{t.quote}</p>
          <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-white/30">{t.quoteBy}</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 lg:w-[54%] xl:w-1/2 flex flex-col">
        <div className={cn("flex items-center justify-between p-5 sm:p-6")}>
          <Link
            href="/landing"
            className={cn("inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-primary transition-colors no-underline")}
          >
            <BackArrow className="w-4 h-4" />
            {t.backHome}
          </Link>
          <button
            onClick={toggleLanguage}
            className={cn("inline-flex items-center gap-2 text-xs font-bold text-slate-500 border border-slate-200 rounded-full px-3.5 py-2 hover:border-primary/40 hover:text-primary transition-colors bg-white")}
          >
            <Globe className="w-3.5 h-3.5" />
            {isAr ? "EN" : "عربي"}
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-5 sm:px-6 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
