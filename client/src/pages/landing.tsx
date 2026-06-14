import { useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  FileText, Sparkles, BrainCircuit, Bot, HelpCircle, Layers,
  Stethoscope, CircuitBoard, Presentation, Upload, Cpu, GraduationCap,
  ArrowRight, Globe, Check, Play, Star, Pill, Code2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export default function Landing() {
  const { user } = useAuth();
  const { language, isRTL, toggleLanguage } = useLanguage();
  const [, setLocation] = useLocation();
  const isAr = language === "ar";

  // Scroll-driven progress for the showcase timeline spine.
  const timelineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: timelineRef, offset: ["start 60%", "end 60%"] });
  const spineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  // Logged-in users skip the landing page.
  useEffect(() => {
    if (user) setLocation("/");
  }, [user, setLocation]);

  const t = {
    navFeatures: isAr ? "المميزات" : "Features",
    navHow: isAr ? "كيف يعمل" : "How it works",
    signIn: isAr ? "تسجيل الدخول" : "Sign in",
    getStarted: isAr ? "ابدأ مجاناً" : "Get started",
    heroTag: isAr ? "مدعوم بالذكاء الاصطناعي" : "Powered by AI",
    heroTitleA: isAr ? "حوّل محاضراتك إلى" : "Turn your lectures into",
    heroTitleHi: isAr ? "معرفة تبقى." : "knowledge that sticks.",
    heroSub: isAr
      ? "ارفع فيديو محاضرة أو ملف PDF أو رابط يوتيوب — وخلال دقائق تحصل على تفريغ، ملخصات، خرائط مفاهيم، اختبارات، بطاقات، ومساعد ذكي يجيب عن أسئلتك."
      : "Upload a lecture video, a PDF, or a YouTube link — and in minutes get transcripts, summaries, concept maps, quizzes, flashcards, and an AI tutor that answers your questions.",
    ctaPrimary: isAr ? "ابدأ مجاناً" : "Start free",
    ctaSecondary: isAr ? "لدي حساب" : "I have an account",
    noCard: isAr ? "بدون بطاقة ائتمان · إلغاء في أي وقت" : "No credit card · Cancel anytime",
    stats: [
      { v: "8+", l: isAr ? "أدوات دراسة" : "study tools" },
      { v: "3", l: isAr ? "صيغ مدخلات" : "input types" },
      { v: "2", l: isAr ? "لغتان" : "languages" },
      { v: "∞", l: isAr ? "محاضرات" : "lectures" },
    ],
    featuresTitle: isAr ? "كل ما تحتاجه للمذاكرة في مكان واحد" : "Everything you need to study, in one place",
    featuresSub: isAr ? "محرك واحد يحوّل أي محتوى إلى مجموعة أدوات تعلّم كاملة." : "One engine that turns any content into a full learning toolkit.",
    features: [
      { icon: FileText, title: isAr ? "تفريغ النص" : "Transcription", desc: isAr ? "نص كامل ودقيق من الصوت والفيديو." : "Accurate full text from audio & video." },
      { icon: Sparkles, title: isAr ? "ملخص ذكي" : "Smart Summary", desc: isAr ? "أهم النقاط مستخلصة ومنظّمة." : "Core points distilled and organized." },
      { icon: BrainCircuit, title: isAr ? "خريطة المفاهيم" : "Concept Map", desc: isAr ? "روابط الأفكار في مخطط بصري." : "Ideas connected in a visual schema." },
      { icon: Bot, title: isAr ? "الوكيل الذكي" : "AI Agent", desc: isAr ? "اسأل عن أي لحظة أو نص محدد." : "Ask about any moment or selection." },
      { icon: HelpCircle, title: isAr ? "الاختبارات" : "Assessments", desc: isAr ? "اختبارات تكيفية بمستويات." : "Adaptive, multi-level quizzes." },
      { icon: Layers, title: isAr ? "البطاقات" : "Flashcards", desc: isAr ? "تكرار متباعد للحفظ الطويل." : "Spaced repetition that lasts." },
      { icon: Stethoscope, title: isAr ? "رؤى طبية" : "Medical Insights", desc: isAr ? "مصطلحات وأدوية وحسابات سريرية." : "Terms, drugs & clinical calculations." },
      { icon: CircuitBoard, title: isAr ? "مختبر الهندسة" : "Engineering Lab", desc: isAr ? "مكوّنات ودوائر وأكواد مشروحة." : "Components, circuits & explained code." },
    ],
    howTitle: isAr ? "ثلاث خطوات فقط" : "Just three steps",
    steps: [
      { icon: Upload, title: isAr ? "ارفع المحتوى" : "Upload content", desc: isAr ? "فيديو، PDF، صوت، أو رابط يوتيوب." : "Video, PDF, audio, or a YouTube link." },
      { icon: Cpu, title: isAr ? "يعالجه الذكاء الاصطناعي" : "AI processes it", desc: isAr ? "ينشئ كل أدوات الدراسة تلقائياً." : "Builds every study tool automatically." },
      { icon: GraduationCap, title: isAr ? "ذاكر وأتقن" : "Study & master", desc: isAr ? "راجع، اختبر نفسك، واسأل الوكيل." : "Review, test yourself, ask the agent." },
    ],
    finalTitle: isAr ? "جاهز لمذاكرة أذكى؟" : "Ready to study smarter?",
    finalSub: isAr ? "انضم وابدأ بتحويل أول محاضرة لك الآن." : "Join and turn your first lecture into a study guide now.",
    rights: isAr ? "جميع الحقوق محفوظة." : "All rights reserved.",
    showcaseTitle: isAr ? "شاهده وهو يعمل" : "See it in action",
    showcaseSub: isAr ? "هذا ما ستحصل عليه بالضبط من كل محاضرة." : "Exactly what you get from every lecture.",
    navShowcase: isAr ? "بالعرض" : "Showcase",
  };

  const showcase: { key: string; icon: any; tag: string; title: string; desc: string; points: string[] }[] = [
    {
      key: "summary",
      icon: Sparkles,
      tag: isAr ? "ملخص ذكي" : "Smart Summary",
      title: isAr ? "أهم النقاط، مستخلصة في ثوانٍ" : "The key points, distilled in seconds",
      desc: isAr ? "نظرة عامة واضحة ونقاط جوهرية ومصطلحات — جاهزة للمراجعة السريعة قبل الامتحان." : "A clear overview, core takeaways, and terminology — ready for a fast pre-exam review.",
      points: isAr ? ["نقاط جوهرية مرتبة", "تحليل المصطلحات", "تصدير PDF"] : ["Ordered key points", "Terminology analysis", "Export to PDF"],
    },
    {
      key: "conceptMap",
      icon: BrainCircuit,
      tag: isAr ? "خريطة المفاهيم" : "Concept Map",
      title: isAr ? "اربط الأفكار بصرياً" : "Connect ideas visually",
      desc: isAr ? "مخطط تفاعلي يربط المفاهيم الأساسية ببعضها لتفهم الصورة الكاملة بسرعة." : "An interactive schema linking core concepts so you grasp the whole picture fast.",
      points: isAr ? ["عقد قابلة للتوسيع", "روابط منطقية", "نظرة شاملة"] : ["Expandable nodes", "Logical links", "Big-picture view"],
    },
    {
      key: "agent",
      icon: Bot,
      tag: isAr ? "الوكيل الذكي" : "AI Agent",
      title: isAr ? "اسأل عن أي شيء في محاضرتك" : "Ask anything about your lecture",
      desc: isAr ? "حدّد نصاً في الـ PDF أو أوقف الفيديو عند أي لحظة، واسأل الوكيل ليشرح لك فوراً." : "Highlight PDF text or pause the video at any moment, and ask the agent to explain instantly.",
      points: isAr ? ["شرح للنص المحدد", "أسئلة عن لحظة الفيديو", "يجيب بلغتك"] : ["Explain a selection", "Ask about a video moment", "Answers in your language"],
    },
    {
      key: "quiz",
      icon: HelpCircle,
      tag: isAr ? "الاختبارات" : "Assessments",
      title: isAr ? "اختبر نفسك واتقن" : "Test yourself and master it",
      desc: isAr ? "اختبارات بمستويات متعددة مع وضع تعلّم يشرح كل إجابة ومساعد ذكي للنقاش." : "Multi-level quizzes with a Learn mode that explains every answer and an AI tutor to discuss.",
      points: isAr ? ["ثلاثة مستويات", "وضع اختبار ووضع تعلّم", "نتيجة فورية"] : ["Three levels", "Test & Learn modes", "Instant scoring"],
    },
    {
      key: "medical",
      icon: Stethoscope,
      tag: isAr ? "الرؤى الطبية" : "Medical Insights",
      title: isAr ? "للطلاب في المجال الطبي" : "Built for medical students",
      desc: isAr ? "بطاقات للأدوية والمصطلحات والحسابات السريرية مع دواعي الاستعمال والآثار الجانبية ورسوم توضيحية." : "Cards for drugs, terms, and clinical calculations — with indications, side effects, and visuals.",
      points: isAr ? ["بطاقات أدوية ومصطلحات", "حسابات سريرية", "نماذج تشريح ثلاثية الأبعاد"] : ["Drug & term cards", "Clinical calculations", "3D anatomy models"],
    },
    {
      key: "engineering",
      icon: CircuitBoard,
      tag: isAr ? "مختبر الهندسة" : "Engineering Lab",
      title: isAr ? "للمهندسين والمبرمجين" : "For engineers & coders",
      desc: isAr ? "مكوّنات ودوائر وقوانين، وأكواد كاملة مشروحة سطراً بسطر مستخرجة من المحاضرة." : "Components, circuits, laws — plus complete, line-by-line explained code pulled from the lecture.",
      points: isAr ? ["كود كامل قابل للتشغيل", "شرح سطراً بسطر", "دوائر ومخططات"] : ["Full runnable code", "Line-by-line breakdown", "Circuits & diagrams"],
    },
  ];

  const renderMock = (k: string) => {
    if (k === "summary") {
      return (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-6 w-full">
          <div className={cn("flex items-center gap-2.5 mb-5", isRTL && "flex-row-reverse")}>
            <div className="w-8 h-8 rounded-xl bg-[#F05A22]/10 flex items-center justify-center"><Sparkles className="w-4 h-4 text-[#F05A22]" /></div>
            <div className="h-3 w-32 rounded-full bg-slate-800/80" />
          </div>
          <div className="space-y-3.5">
            {[92, 78, 96, 70, 85].map((w, i) => (
              <div key={i} className={cn("flex items-start gap-2.5", isRTL && "flex-row-reverse")}>
                <div className="w-1.5 h-1.5 rounded-full bg-[#F05A22] mt-1.5 shrink-0" />
                <div className="h-2.5 rounded-full bg-slate-100" style={{ width: `${w}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-5 flex gap-2">
            <div className="h-6 w-20 rounded-lg bg-[#F05A22]/10" />
            <div className="h-6 w-16 rounded-lg bg-slate-100" />
          </div>
        </div>
      );
    }
    if (k === "conceptMap") {
      return (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-6 w-full">
          <div className="relative h-[210px]">
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              <line x1="50%" y1="22%" x2="22%" y2="72%" stroke="#F05A22" strokeOpacity="0.3" strokeWidth="2" />
              <line x1="50%" y1="22%" x2="50%" y2="72%" stroke="#F05A22" strokeOpacity="0.3" strokeWidth="2" />
              <line x1="50%" y1="22%" x2="78%" y2="72%" stroke="#F05A22" strokeOpacity="0.3" strokeWidth="2" />
            </svg>
            <div className="absolute top-[10%] left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-[#F05A22] text-white text-[11px] font-black shadow-lg">
              {isAr ? "الموضوع" : "Topic"}
            </div>
            {[isAr ? "مفهوم" : "Concept", isAr ? "مبدأ" : "Principle", isAr ? "تطبيق" : "Application"].map((n, i) => (
              <div key={i} className="absolute top-[68%] px-3 py-1.5 rounded-lg bg-white border-2 border-slate-200 text-[10px] font-bold text-slate-600 shadow-sm" style={{ left: `${[16, 42, 70][i]}%` }}>
                {n}
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (k === "agent") {
      return (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-5 w-full space-y-3">
          <div className={cn("flex items-center gap-2 pb-3 border-b border-slate-100", isRTL && "flex-row-reverse")}>
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#F05A22] to-[#f5793f] flex items-center justify-center"><Bot className="w-3.5 h-3.5 text-white" /></div>
            <span className="text-xs font-black text-slate-800">AI Agent</span>
            <span className="ml-auto inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Online</span>
          </div>
          <div className={cn("max-w-[80%] rounded-2xl bg-slate-50 border border-slate-100 p-3 space-y-1.5", isRTL ? "mr-auto" : "")}>
            <div className="h-2 w-40 rounded-full bg-slate-200" />
            <div className="h-2 w-28 rounded-full bg-slate-200" />
          </div>
          <div className={cn("max-w-[80%] rounded-2xl bg-[#F05A22] p-3 space-y-1.5", isRTL ? "ml-auto" : "ml-auto")}>
            <div className="h-2 w-32 rounded-full bg-white/50" />
            <div className="h-2 w-20 rounded-full bg-white/50" />
          </div>
          <div className={cn("flex items-center gap-1 px-2", isRTL && "flex-row-reverse")}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#F05A22]/60 animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#F05A22]/60 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[#F05A22]/60 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      );
    }
    if (k === "medical") {
      return (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-5 w-full">
          <div className={cn("flex items-center gap-2.5 mb-4", isRTL && "flex-row-reverse")}>
            <div className="w-8 h-8 rounded-xl bg-[#F05A22]/10 flex items-center justify-center"><Stethoscope className="w-4 h-4 text-[#F05A22]" /></div>
            <div className="h-3 w-28 rounded-full bg-slate-800/80" />
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
            <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
              <span className="text-[9px] font-black uppercase tracking-wider text-[#F05A22] bg-[#F05A22]/10 px-2 py-0.5 rounded">{isAr ? "مضاد حيوي" : "Antibiotic"}</span>
              <Pill className="w-4 h-4 text-[#F05A22]" />
            </div>
            <div className="h-3 w-32 rounded-full bg-slate-700/70" />
            <div className="h-2 w-full rounded-full bg-slate-200" />
            <div>
              <span className="text-[9px] font-black uppercase text-slate-400">{isAr ? "دواعي الاستعمال" : "Indications"}</span>
              <div className={cn("flex flex-wrap gap-1.5 mt-1.5", isRTL && "flex-row-reverse")}>
                {[44, 60, 36].map((w, i) => <span key={i} className="h-5 rounded-md bg-emerald-50 border border-emerald-100" style={{ width: w }} />)}
              </div>
            </div>
            <div>
              <span className="text-[9px] font-black uppercase text-slate-400">{isAr ? "الآثار الجانبية" : "Side effects"}</span>
              <div className={cn("flex flex-wrap gap-1.5 mt-1.5", isRTL && "flex-row-reverse")}>
                {[50, 38].map((w, i) => <span key={i} className="h-5 rounded-md bg-amber-50 border border-amber-100" style={{ width: w }} />)}
              </div>
            </div>
          </div>
        </div>
      );
    }
    if (k === "engineering") {
      const lines = [
        { ind: 0, w: "55%", c: "bg-slate-500" },
        { ind: 0, w: "70%", c: "bg-[#F05A22]/70" },
        { ind: 1, w: "60%", c: "bg-sky-400/70" },
        { ind: 1, w: "48%", c: "bg-emerald-400/70" },
        { ind: 0, w: "30%", c: "bg-slate-600" },
        { ind: 0, w: "65%", c: "bg-[#F05A22]/70" },
        { ind: 1, w: "52%", c: "bg-sky-400/70" },
      ];
      return (
        <div className="rounded-2xl bg-[#1E293B] border border-slate-700 shadow-[0_20px_60px_rgba(0,0,0,0.18)] overflow-hidden w-full" dir="ltr">
          <div className="h-9 bg-[#0F172A] border-b border-slate-700 flex items-center justify-between px-3">
            <div className="flex items-center gap-2">
              <Code2 className="w-3.5 h-3.5 text-[#F05A22]" />
              <span className="text-[10px] font-mono text-slate-400">blink.ino</span>
            </div>
            <span className="text-[8px] font-black uppercase tracking-wider text-[#F05A22] bg-[#F05A22]/15 px-1.5 py-0.5 rounded">arduino</span>
          </div>
          <div className="p-4 space-y-2.5 font-mono">
            {lines.map((l, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[9px] text-slate-600 w-3 text-right shrink-0">{i + 1}</span>
                <span className={cn("block h-2 rounded-full", l.c)} style={{ width: l.w, marginLeft: l.ind * 16 }} />
              </div>
            ))}
          </div>
        </div>
      );
    }
    // quiz
    return (
      <div className="rounded-2xl bg-white border border-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-6 w-full">
        <div className={cn("flex items-center justify-between mb-4", isRTL && "flex-row-reverse")}>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#F05A22]">{isAr ? "السؤال ٢ / ١٠" : "Question 2 / 10"}</span>
          <span className="text-[10px] font-bold text-slate-400">00:24</span>
        </div>
        <div className="h-3 w-3/4 rounded-full bg-slate-800/80 mb-5" />
        <div className="space-y-2.5">
          {[{ c: false }, { c: true }, { c: false }, { c: false }].map((o, i) => (
            <div key={i} className={cn("flex items-center gap-3 p-3 rounded-xl border-2", o.c ? "border-emerald-400 bg-emerald-50" : "border-slate-100 bg-white", isRTL && "flex-row-reverse")}>
              <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0", o.c ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400")}>
                {o.c ? <Check className="w-3.5 h-3.5" /> : String.fromCharCode(65 + i)}
              </span>
              <div className={cn("h-2 rounded-full", o.c ? "bg-emerald-300" : "bg-slate-100")} style={{ width: `${[55, 70, 48, 62][i]}%` }} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-slate-900 antialiased" dir={isRTL ? "rtl" : "ltr"}>
      {/* NAV */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#FAFAF8]/80 border-b border-slate-200/60">
        <div className={cn("max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between", isRTL && "flex-row-reverse")}>
          <Link href="/landing" className={cn("flex items-center gap-2.5 no-underline", isRTL && "flex-row-reverse")}>
            <div className="w-9 h-9 rounded-xl bg-[#F05A22] flex items-center justify-center text-white font-black text-lg shadow-lg shadow-[#F05A22]/20">L</div>
            <span className="text-lg font-black tracking-tight">Lecture<span className="text-[#F05A22]">Mate</span></span>
          </Link>
          <nav className={cn("hidden md:flex items-center gap-8", isRTL && "flex-row-reverse")}>
            <a href="#features" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors no-underline">{t.navFeatures}</a>
            <a href="#showcase" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors no-underline">{t.navShowcase}</a>
            <a href="#how" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors no-underline">{t.navHow}</a>
          </nav>
          <div className={cn("flex items-center gap-2.5", isRTL && "flex-row-reverse")}>
            <button onClick={toggleLanguage} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 border border-slate-200 rounded-full px-3 py-1.5 hover:border-[#F05A22]/40 hover:text-[#F05A22] transition-colors">
              <Globe className="w-3.5 h-3.5" />{isAr ? "EN" : "عربي"}
            </button>
            <Link href="/sign-in" className="hidden sm:inline-block text-sm font-bold text-slate-600 hover:text-slate-900 px-3 py-2 no-underline">{t.signIn}</Link>
            <Link href="/sign-up" className="inline-flex items-center gap-1.5 text-sm font-black bg-slate-900 hover:bg-[#F05A22] text-white px-4 py-2 rounded-full shadow-lg shadow-slate-900/10 transition-all no-underline">
              {t.getStarted}
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[#F05A22]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-16 relative">
          <div className="max-w-3xl mx-auto text-center">
            <motion.span
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.15em] text-[#F05A22] bg-[#F05A22]/10 border border-[#F05A22]/20 rounded-full px-4 py-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> {t.heroTag}
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="mt-6 text-4xl sm:text-6xl font-black tracking-tight leading-[1.05]"
            >
              {t.heroTitleA}{" "}
              <span className="relative inline-block text-[#F05A22]">
                {t.heroTitleHi}
                <svg className="absolute -bottom-2 left-0 w-full" height="10" viewBox="0 0 200 10" preserveAspectRatio="none">
                  <path d="M2,7 Q100,1 198,7" fill="none" stroke="#F05A22" strokeWidth="3" strokeOpacity="0.35" strokeLinecap="round" />
                </svg>
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="mt-6 text-lg text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto"
            >
              {t.heroSub}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className={cn("mt-9 flex flex-col sm:flex-row items-center justify-center gap-3", isRTL && "sm:flex-row-reverse")}
            >
              <Link href="/sign-up" className="inline-flex items-center gap-2 bg-slate-900 hover:bg-[#F05A22] text-white font-black text-base px-7 py-3.5 rounded-full shadow-xl shadow-slate-900/15 transition-all active:scale-95 no-underline">
                {t.ctaPrimary}
                <ArrowRight className={cn("w-5 h-5", isRTL && "rotate-180")} />
              </Link>
              <Link href="/sign-in" className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-base px-7 py-3.5 rounded-full transition-all no-underline">
                {t.ctaSecondary}
              </Link>
            </motion.div>
            <p className="mt-4 text-xs text-slate-400 font-medium">{t.noCard}</p>
          </div>

          {/* App preview mock */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="mt-16 max-w-4xl mx-auto"
          >
            <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_40px_120px_rgba(0,0,0,0.10)] overflow-hidden">
              <div className="h-10 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 px-4">
                <span className="w-3 h-3 rounded-full bg-red-300" />
                <span className="w-3 h-3 rounded-full bg-amber-300" />
                <span className="w-3 h-3 rounded-full bg-green-300" />
                <span className="ml-3 text-[11px] font-bold text-slate-400 truncate">lecturemate.ai/lecture</span>
              </div>
              <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FBFAF8]">
                {t.features.slice(0, 8).map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.05 }}
                    className="rounded-2xl border border-slate-100 bg-white p-4 flex flex-col gap-2 shadow-sm"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#F05A22]/10 flex items-center justify-center text-[#F05A22]"><f.icon className="w-4 h-4" /></div>
                    <span className="text-[12px] font-black text-slate-700 leading-tight">{f.title}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* stats */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {t.stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl sm:text-4xl font-black text-slate-900 tabular-nums">{s.v}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">{t.featuresTitle}</h2>
            <p className="mt-4 text-slate-500 font-medium text-lg">{t.featuresSub}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {t.features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 4) * 0.06 }}
                className="group rounded-[24px] border border-slate-200/70 bg-white p-6 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] hover:border-[#F05A22]/30 transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#F05A22]/10 flex items-center justify-center text-[#F05A22] group-hover:scale-110 transition-transform">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="mt-5 text-lg font-black text-slate-900">{f.title}</h3>
                <p className="mt-1.5 text-sm text-slate-500 font-medium leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SHOWCASE — scroll-driven product tour */}
      <section id="showcase" className="py-20 sm:py-28 bg-white border-y border-slate-200/60 overflow-hidden">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-24">
            <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.15em] text-[#F05A22] bg-[#F05A22]/10 rounded-full px-4 py-1.5">
              <Play className="w-3.5 h-3.5" /> {isAr ? "جولة سريعة" : "Product tour"}
            </span>
            <h2 className="mt-5 text-3xl sm:text-4xl font-black tracking-tight">{t.showcaseTitle}</h2>
            <p className="mt-4 text-slate-500 font-medium text-lg">{t.showcaseSub}</p>
          </div>

          {/* Timeline */}
          <div ref={timelineRef} className="relative">
            {/* center spine (desktop) */}
            <div className="hidden lg:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-slate-200/80 rounded-full">
              <motion.div style={{ scaleY: spineScale }} className="origin-top w-full h-full bg-gradient-to-b from-[#F05A22] to-[#f5793f] rounded-full" />
            </div>

            <div className="space-y-20 sm:space-y-28">
              {showcase.map((s, idx) => {
                const flip = idx % 2 === 1;
                // Text sits on the outer side, mock on the inner — slide them in from opposite directions.
                const baseText = flip ? 50 : -50;
                const baseMock = flip ? -50 : 50;
                const textX = isRTL ? -baseText : baseText;
                const mockX = isRTL ? -baseMock : baseMock;
                return (
                  <div key={s.key} className="relative grid lg:grid-cols-2 gap-10 lg:gap-24 items-center">
                    {/* numbered node on the spine */}
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true, margin: "-30% 0px -30% 0px" }}
                      transition={{ type: "spring", stiffness: 220, damping: 18 }}
                      className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-14 h-14 rounded-full bg-white border-2 border-[#F05A22] text-[#F05A22] font-black text-sm items-center justify-center shadow-[0_8px_24px_rgba(240,90,34,0.25)]"
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </motion.div>

                    {/* Text */}
                    <motion.div
                      initial={{ opacity: 0, x: textX }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={{ duration: 0.55, ease: "easeOut" }}
                      className={cn(flip && "lg:order-2", isRTL ? "text-right" : "text-left")}
                    >
                      <div className={cn("inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-[#F05A22] bg-[#F05A22]/10 rounded-full px-3 py-1.5 mb-5", isRTL && "flex-row-reverse")}>
                        <s.icon className="w-3.5 h-3.5" /> {s.tag}
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 leading-tight">{s.title}</h3>
                      <p className="mt-4 text-slate-500 font-medium text-[15px] leading-relaxed">{s.desc}</p>
                      <ul className="mt-6 space-y-3">
                        {s.points.map((p, i) => (
                          <li key={i} className={cn("flex items-center gap-3 text-sm font-bold text-slate-700", isRTL && "flex-row-reverse")}>
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><Check className="w-3 h-3" /></span>
                            {p}
                          </li>
                        ))}
                      </ul>
                    </motion.div>

                    {/* Mock preview */}
                    <motion.div
                      initial={{ opacity: 0, x: mockX, scale: 0.95 }}
                      whileInView={{ opacity: 1, x: 0, scale: 1 }}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={{ duration: 0.55, ease: "easeOut", delay: 0.05 }}
                      className={cn("relative", flip && "lg:order-1")}
                    >
                      <div className="absolute inset-0 -m-5 bg-gradient-to-br from-[#F05A22]/12 to-transparent rounded-[36px] blur-2xl pointer-events-none" />
                      <div className="relative">{renderMock(s.key)}</div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-20 sm:py-24 bg-[#17120F] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.5] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)", backgroundSize: "26px 26px" }} />
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#F05A22]/15 blur-[120px] pointer-events-none" />
        <div className="max-w-6xl mx-auto px-5 sm:px-8 relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">{t.howTitle}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {t.steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="relative text-center"
              >
                <div className="mx-auto w-16 h-16 rounded-3xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-[#F05A22] mb-6">
                  <s.icon className="w-7 h-7" />
                </div>
                <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 text-[80px] font-black text-white/[0.04] select-none leading-none">{i + 1}</span>
                <h3 className="text-xl font-black">{s.title}</h3>
                <p className="mt-2 text-white/50 font-medium leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <div className="relative rounded-[36px] bg-gradient-to-br from-[#F05A22] to-[#d4430f] text-white p-10 sm:p-16 text-center overflow-hidden shadow-[0_30px_80px_rgba(240,90,34,0.3)]">
            <div className="absolute -top-16 -right-10 w-60 h-60 bg-white/10 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex justify-center gap-1 mb-5">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-white text-white" />)}
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">{t.finalTitle}</h2>
              <p className="mt-4 text-white/80 font-medium text-lg max-w-xl mx-auto">{t.finalSub}</p>
              <Link href="/sign-up" className="mt-8 inline-flex items-center gap-2 bg-white text-slate-900 font-black text-base px-8 py-4 rounded-full shadow-xl hover:scale-105 transition-transform no-underline">
                {t.getStarted}
                <ArrowRight className={cn("w-5 h-5", isRTL && "rotate-180")} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200/60 py-10">
        <div className={cn("max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4", isRTL && "sm:flex-row-reverse")}>
          <div className={cn("flex items-center gap-2.5", isRTL && "flex-row-reverse")}>
            <div className="w-8 h-8 rounded-lg bg-[#F05A22] flex items-center justify-center text-white font-black">L</div>
            <span className="font-black tracking-tight">Lecture<span className="text-[#F05A22]">Mate</span></span>
          </div>
          <p className="text-xs text-slate-400 font-medium">© {new Date().getFullYear()} LectureMate. {t.rights}</p>
        </div>
      </footer>
    </div>
  );
}
