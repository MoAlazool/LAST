import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const HERO_IMAGE = "/assets/logo-hero.png";

export default function Hero() {
  const { language, isRTL } = useLanguage();

  const t = {
    titlePrefix: language === "ar" ? "حول أي مادة تعليمية إلى" : "Transform any lecture into",
    titleSuffix: language === "ar" ? "دليلك الدراسي الخاص." : "your personal study guide.",
    description: language === "ar"
      ? "حول المحاضرات المتناثرة، ملفات الـ PDF المكثيرة، والفيديوهات الطويلة إلى قطع أكاديمية منسقة. اتقن موادك الدراسية بمساعدة الذكاء الاصطناعي."
      : "Turn scattered lectures, dense PDFs, and long videos into curated academic Masterpieces. Master your materials with AI assistance. Studio has never been simpler."
  };

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl bg-surface-container-lowest p-10 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-10 border border-outline-variant/40 shadow-[0_4px_24px_rgba(0,0,0,0.06)]",
        isRTL ? "flex-row" : "flex-row"
      )}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className={cn("max-w-2xl z-10 w-full", isRTL ? "text-right" : "text-left")}>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-5xl font-extrabold text-on-surface leading-[1.12] tracking-tight mb-6 font-headline"
        >
          {t.titlePrefix}{" "}
          <span className="text-[#F05A22]">{t.titleSuffix}</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "text-base sm:text-lg text-on-surface-variant font-normal max-w-lg leading-relaxed",
            isRTL ? "mr-0 ml-auto" : "ml-0 mr-auto"
          )}
        >
          {t.description}
        </motion.p>
      </div>

      <div className={cn(
        "hidden lg:block absolute w-[520px] h-[520px] bg-[#F05A22]/[0.06] rounded-full blur-3xl pointer-events-none",
        isRTL ? "-right-24 -top-24" : "-left-24 -top-24"
      )} />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, rotate: 0 }}
        animate={{ opacity: 1, scale: 1, rotate: 2.5 }}
        transition={{ delay: 0.25, duration: 0.65 }}
        className="relative shrink-0 w-full max-w-[340px] lg:max-w-[380px] aspect-square lg:w-[380px] lg:h-[380px] rounded-2xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.12)] ring-1 ring-black/5"
      >
        <img
          src={HERO_IMAGE}
          alt="LectureMate Curator Illustration"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-[#F05A22]/[0.08] mix-blend-multiply pointer-events-none" />
      </motion.div>
    </section>
  );
}
