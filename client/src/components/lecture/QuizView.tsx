import { useState, useEffect, useMemo, useRef } from "react";
import { Question } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, ArrowLeft, Bot, X, Timer, Search, BookText, PlayCircle, Globe, Zap, GraduationCap, Flag, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { AgentChatView } from "./AgentChatView";
import { TextWithMath } from "./MathRenderer";

import { generateQuiz, evaluateEssayAnswer, type EssayEvaluation } from "@/lib/aiService";
import { useLectures } from "@/hooks/useLectures";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface QuizViewProps {
  questions?: Question[];
  title?: string;
  lectureId?: string;
  transcript?: string;
  modelType?: "gpu" | "api";
}

type Stage = "menu" | "ready" | "mode" | "quiz" | "complete";
type AnswerMode = "practice" | "learn";
type Level = "comprehensive" | "advanced" | "expert";

// --- Session persistence (so closing the tab doesn't lose the quiz / progress) ---
const sessionKey = (id?: string) => (id ? `quiz_session_${id}` : null);
function readSession(id?: string): any | null {
  const k = sessionKey(id);
  if (!k) return null;
  try {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// --- Per-level quiz cache (every generated difficulty is kept so the student can start any of them) ---
const levelsKey = (id?: string) => (id ? `quiz_levels_${id}` : null);
function readLevels(id?: string): Record<string, Question[]> {
  const k = levelsKey(id);
  if (!k) return {};
  try {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function writeLevels(id: string | undefined, data: Record<string, Question[]>) {
  const k = levelsKey(id);
  if (!k) return;
  try {
    localStorage.setItem(k, JSON.stringify(data));
  } catch {
    /* ignore quota */
  }
}

export function QuizView({ questions: initialQuestions, lectureId, transcript, modelType = "api" }: QuizViewProps) {
  const { updateLecture } = useLectures();
  const { language } = useLanguage();
  const { toast } = useToast();
  const isRTL = language === "ar";

  const initialSession = useMemo(() => readSession(lectureId), [lectureId]);
  const hasInitialQ = (initialQuestions?.length || 0) > 0;

  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions || []);

  const [stage, setStage] = useState<Stage>(() => {
    if (!hasInitialQ) return "menu";
    if (initialSession?.completed) return "complete";
    if (initialSession?.started) return "quiz";
    return "ready";
  });
  const [answerMode, setAnswerMode] = useState<AnswerMode>(initialSession?.answerMode || "learn");
  const [level, setLevel] = useState<Level | undefined>(initialSession?.level);
  // All generated levels, kept so the student can switch/start any of them.
  const [levels, setLevels] = useState<Record<string, Question[]>>(() => {
    const cached = readLevels(lectureId);
    // Seed the cache with the existing quiz if we know its level (e.g. lectures from before this feature).
    if (hasInitialQ && initialSession?.level && !(cached[initialSession.level]?.length)) {
      cached[initialSession.level] = initialQuestions as Question[];
    }
    return cached;
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(() =>
    initialSession?.started && !initialSession?.completed ? initialSession.index || 0 : 0,
  );
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState<number>(() => (initialSession?.started ? initialSession.score || 0 : 0));
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(40);
  const [showHint, setShowHint] = useState(false);

  // Essay states
  const [essayAnswer, setEssayAnswer] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EssayEvaluation | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const restoredRef = useRef(hasInitialQ);

  // Keep questions in sync with props, and restore session once they arrive (async load).
  useEffect(() => {
    if (!initialQuestions || initialQuestions.length === 0) return;
    setQuestions(initialQuestions);
    if (restoredRef.current) return;
    restoredRef.current = true;
    const s = readSession(lectureId);
    if (s) {
      if (s.answerMode) setAnswerMode(s.answerMode);
      if (s.level) setLevel(s.level);
      setCurrentQuestionIndex(s.started && !s.completed ? Math.min(s.index || 0, initialQuestions.length - 1) : 0);
      setScore(s.started ? s.score || 0 : 0);
      setStage(s.completed ? "complete" : s.started ? "quiz" : "ready");
    } else {
      setStage((prev) => (prev === "menu" ? "ready" : prev));
    }
  }, [initialQuestions, lectureId]);

  // Persist session whenever meaningful state changes (skip the pre-generation menu).
  useEffect(() => {
    const k = sessionKey(lectureId);
    if (!k || stage === "menu") return;
    const data = {
      stage,
      answerMode,
      level,
      index: currentQuestionIndex,
      score,
      started: stage === "quiz" || stage === "complete",
      completed: stage === "complete",
    };
    try {
      localStorage.setItem(k, JSON.stringify(data));
    } catch {
      /* ignore quota */
    }
  }, [stage, answerMode, level, currentQuestionIndex, score, lectureId]);

  // Timer — only in Practice mode (Learn mode is self-paced).
  useEffect(() => {
    if (stage !== "quiz" || answerMode !== "practice" || isAnswered || currentQuestion?.type === "open_ended") return;
    if (timeLeft <= 0) {
      setIsAnswered(true);
      return;
    }
    if (timeLeft === 20) setShowHint(true);
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [stage, answerMode, isAnswered, timeLeft, currentQuestion]);

  useEffect(() => {
    setTimeLeft(40);
    setShowHint(false);
  }, [currentQuestionIndex]);

  const t = {
    title: language === "ar" ? "اختر مستوى الاختبار" : "Choose Your Quiz Level",
    subtitle:
      language === "ar"
        ? "خصص رحلتك التعليمية. اختر مستوى الصعوبة الذي يناسب استيعابك للمادة لإنشاء تقييم مخصص."
        : "Tailor your learning journey. Select a difficulty level that matches your current grasp of the material to generate a custom-curated assessment.",
    beginner: {
      name: language === "ar" ? "مبتدئ" : "Beginner",
      desc: language === "ar" ? "يركز على المفاهيم التأسيسية والمصطلحات الرئيسية. مثالي للمراجعة الأولى." : "Focuses on foundational concepts, key terminology, and primary lecture takeaways.",
      points: language === "ar" ? ["تعريفات أساسية", "اختيار من متعدد"] : ["Core Definitions", "Multiple Choice Focus"],
    },
    intermediate: {
      name: language === "ar" ? "متوسط" : "Intermediate",
      desc: language === "ar" ? "يتحدى قدرتك على ربط وحدات المحاضرة وتطبيق المفاهيم على مواقف واقعية." : "Challenges your ability to connect modules and apply concepts to real-world scenarios.",
      points: language === "ar" ? ["ربط المفاهيم", "تحليل سيناريوهات"] : ["Conceptual Mapping", "Scenario Analysis"],
    },
    advanced: {
      name: language === "ar" ? "متقدم" : "Advanced",
      desc: language === "ar" ? "تقييم صارم يتميز بحل المشكلات المعقدة والتركيب النقدي." : "Rigorous assessment featuring complex problem-solving and critical synthesis.",
      points: language === "ar" ? ["تركيب نظري", "تقييم نقدي"] : ["Theoretical Synthesis", "Critical Evaluation"],
    },
    generate: language === "ar" ? "إنشاء الاختبار" : "Generate Quiz",
    start: language === "ar" ? "ابدأ" : "Start",
    regenerate: language === "ar" ? "إعادة الإنشاء" : "Regenerate",
    readyBadge: language === "ar" ? "جاهز" : "Ready",
    levelNames: {
      comprehensive: language === "ar" ? "مبتدئ" : "Beginner",
      advanced: language === "ar" ? "متوسط" : "Intermediate",
      expert: language === "ar" ? "متقدم" : "Advanced",
    } as Record<Level, string>,
    ready: {
      tag: language === "ar" ? "الاختبار جاهز" : "Quiz Ready",
      title: language === "ar" ? "اختبارك جاهز! 🎉" : "Your quiz is ready! 🎉",
      startNow: language === "ar" ? "ابدأ الآن" : "Start Now",
      later: language === "ar" ? "لاحقاً" : "Maybe Later",
      saved: language === "ar" ? "تم حفظ اختبارك. يمكنك العودة والبدء في أي وقت." : "Your quiz is saved — come back and start anytime.",
      changeLevel: language === "ar" ? "إنشاء اختبار بمستوى آخر" : "Generate a different level",
      questionsWord: language === "ar" ? "سؤال جاهز" : "questions ready",
      backToQuiz: language === "ar" ? "العودة لاختبارك الحالي" : "Back to your quiz",
    },
    mode: {
      title: language === "ar" ? "كيف تريد أداء الاختبار؟" : "How do you want to take it?",
      subtitle: language === "ar" ? "اختر النمط الذي يناسب هدفك الآن." : "Pick the style that fits your goal right now.",
      practice: {
        name: language === "ar" ? "وضع الاختبار" : "Test Mode",
        desc: language === "ar" ? "تحقق سريع مع مؤقّت زمني — صح أم خطأ فقط." : "Quick timed check — just right or wrong.",
        points: language === "ar" ? ["مؤقّت لكل سؤال", "نتيجة فورية", "بدون شرح"] : ["Per-question timer", "Instant result", "No explanations"],
      },
      learn: {
        name: language === "ar" ? "وضع التعلّم" : "Learn Mode",
        desc: language === "ar" ? "بدون وقت، مع شرح مفصّل ومساعد ذكي للنقاش." : "No timer, with full explanations and an AI tutor to chat.",
        points: language === "ar" ? ["بدون مؤقّت", "شرح لكل إجابة", "مساعد AI للنقاش"] : ["No timer", "Explanation per answer", "AI tutor chat"],
      },
      begin: language === "ar" ? "ابدأ" : "Begin",
    },
  };

  const handleGenerate = async (lvl: Level) => {
    if (!lectureId || !transcript) return;
    try {
      setIsGenerating(true);
      const newQuestions = await generateQuiz(transcript, modelType, lvl);
      if (newQuestions && newQuestions.length > 0) {
        setQuestions(newQuestions);
        setLevel(lvl);
        // Save this level to the per-level cache (keeps every generated difficulty).
        const nextLevels = { ...levels, [lvl]: newQuestions as Question[] };
        setLevels(nextLevels);
        writeLevels(lectureId, nextLevels);
        await updateLecture({ lectureId, updates: { questions: newQuestions as any } });
        // Fresh quiz → reset progress and land on the "ready" screen.
        setCurrentQuestionIndex(0);
        setScore(0);
        setSelectedOption(null);
        setIsAnswered(false);
        setEvaluation(null);
        setEssayAnswer("");
        restoredRef.current = true;
        setStage("ready");
      }
    } catch (err) {
      toast({ title: language === "ar" ? "فشل إنشاء الاختبار" : "Generation Failed", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  // Load an already-generated level from the cache and go to its "ready" screen.
  const startLevel = (lvl: Level) => {
    const qs = levels[lvl];
    if (!qs || qs.length === 0) return;
    setQuestions(qs);
    setLevel(lvl);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setEvaluation(null);
    setEssayAnswer("");
    restoredRef.current = true;
    if (lectureId) updateLecture({ lectureId, updates: { questions: qs as any } });
    setStage("ready");
  };

  const beginQuiz = (mode: AnswerMode) => {
    setAnswerMode(mode);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setEvaluation(null);
    setEssayAnswer("");
    setTimeLeft(40);
    setShowHint(false);
    setStage("quiz");
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((i) => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(40);
      setShowHint(false);
      setEssayAnswer("");
      setEvaluation(null);
    } else {
      setStage("complete");
    }
  };

  const handleFinishNow = () => {
    const confirmMsg = language === "ar"
      ? "هل تريد إنهاء الاختبار الآن؟ سيتم احتساب الأسئلة التي لم تُجب عليها كخطأ."
      : "Finish the quiz now? Unanswered questions will be counted as incorrect.";
    if (window.confirm(confirmMsg)) {
      setStage("complete");
    }
  };

  const handleOptionSelect = (idx: number) => {
    if (isAnswered || !currentQuestion) return;
    setSelectedOption(idx);
  };

  const handleCheckAnswer = () => {
    if (selectedOption === null || isAnswered || !currentQuestion) return;
    if (selectedOption === currentQuestion.correctIndex) setScore((s) => s + 1);
    setIsAnswered(true);
  };

  const handleEssaySubmit = async () => {
    if (!essayAnswer.trim() || isEvaluating || !currentQuestion) return;
    try {
      setIsEvaluating(true);
      const res = await evaluateEssayAnswer(
        currentQuestion.text,
        essayAnswer,
        currentQuestion.correct_answer || "",
        currentQuestion.expected_keywords || [],
        !!currentQuestion.is_numerical,
      );
      setEvaluation(res);
      setIsAnswered(true);
      if (res.isCorrect) setScore((s) => s + 1);
    } catch (error) {
      toast({ title: language === "ar" ? "فشل التقييم" : "Evaluation Failed", variant: "destructive" });
    } finally {
      setIsEvaluating(false);
    }
  };

  // ============================ GENERATING ============================
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] space-y-8 bg-white">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
          <div className="absolute inset-2 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-black text-[#1A1A1A] tracking-tight">
            {language === "ar" ? "جاري تجهيز اختبارك..." : "Curating your Assessment..."}
          </h3>
          <p className="text-[#666] font-medium animate-pulse">
            {language === "ar" ? "نحلل المحاضرة ونصيغ الأسئلة" : "Analyzing lecture nuances and synthesizing questions"}
          </p>
        </div>
      </div>
    );
  }

  // ============================ MENU (choose level) ============================
  if (stage === "menu") {
    const cards: { lvl: Level; emoji: string; data: typeof t.beginner; popular?: boolean }[] = [
      { lvl: "comprehensive", emoji: "😊", data: t.beginner },
      { lvl: "advanced", emoji: "🧠", data: t.intermediate, popular: true },
      { lvl: "expert", emoji: "🔥", data: t.advanced },
    ];
    return (
      <div className={cn("min-h-screen bg-[#FDFDFD] py-20 px-6", isRTL && "rtl text-right")}>
        <div className="max-w-6xl mx-auto">
          {questions.length > 0 && (
            <div className={cn("mb-10 flex", isRTL ? "justify-start" : "justify-end")}>
              <button
                onClick={() => setStage("ready")}
                className={cn(
                  "inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-primary/30 bg-white text-primary font-black text-sm hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm active:scale-95"
                )}
              >
                {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                {t.ready.backToQuiz}
                <span className="text-[11px] font-bold opacity-70 tabular-nums">({questions.length})</span>
              </button>
            </div>
          )}
          <div className="text-center mb-16">
            <div className="flex justify-center mb-8">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 flex items-center justify-center overflow-hidden">
                <img src="/logo.png" className="w-full h-full object-contain" alt="Lecture Mate Logo" />
              </motion.div>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-[#1A1A1A] mb-4 tracking-tight">{t.title}</h1>
            <p className="text-lg text-[#666] max-w-2xl mx-auto leading-relaxed font-medium">{t.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {cards.map((c) => {
              const generated = (levels[c.lvl]?.length || 0) > 0;
              const count = levels[c.lvl]?.length || 0;
              return (
              <motion.div
                key={c.lvl}
                whileHover={{ y: -10 }}
                className={cn(
                  "bg-white rounded-[40px] p-10 flex flex-col items-center text-center relative overflow-hidden border",
                  generated ? "border-2 border-emerald-200" : c.popular ? "shadow-[0_30px_70px_rgba(0,0,0,0.08)] border-2 border-primary/10" : "shadow-[0_20px_50px_rgba(0,0,0,0.04)] border-[#F0F0F0]",
                )}
              >
                <div className={cn("absolute top-6 flex items-center gap-2", isRTL ? "left-10" : "right-10")}>
                  {generated && (
                    <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[10px] py-1 px-3 uppercase flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> {t.readyBadge}
                    </Badge>
                  )}
                  {c.popular && !generated && (
                    <Badge className="bg-[#FFF1ED] text-primary border-none font-black text-[10px] py-1 px-3 uppercase">
                      {language === "ar" ? "الأكثر شيوعاً" : "Popular"}
                    </Badge>
                  )}
                </div>
                <div className="w-16 h-16 rounded-3xl bg-[#FFF5F2] flex items-center justify-center mb-8 shadow-inner text-2xl">{c.emoji}</div>
                <h3 className="text-2xl font-black text-[#1A1A1A] mb-4">{c.data.name}</h3>
                <p className="text-sm text-[#777] leading-relaxed mb-8 min-h-[4.5rem] font-medium">{c.data.desc}</p>
                <div className="space-y-3 mb-10 w-full">
                  {c.data.points.map((p, i) => (
                    <div key={i} className={cn("flex items-center gap-3 text-[13px] font-bold text-[#444]")}>
                      <CheckCircle className="w-4 h-4 text-[#C64B1D]" />
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
                {generated ? (
                  <div className="w-full space-y-2">
                    <Button onClick={() => startLevel(c.lvl)} className="w-full h-14 rounded-3xl bg-emerald-600 hover:bg-emerald-700 text-white font-black flex items-center justify-center gap-2">
                      {t.start}
                      <span className="text-[11px] font-bold opacity-80 tabular-nums">({count})</span>
                    </Button>
                    <button onClick={() => handleGenerate(c.lvl)} className="w-full text-xs font-bold text-[#A0A0A0] hover:text-primary transition-colors py-1 border-0 bg-transparent cursor-pointer">
                      {t.regenerate}
                    </button>
                  </div>
                ) : (
                  <Button onClick={() => handleGenerate(c.lvl)} className="w-full h-14 rounded-3xl bg-[#C14416] hover:bg-[#A13912] text-white font-black">
                    {t.generate}
                  </Button>
                )}
              </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ============================ READY (start now / later) ============================
  if (stage === "ready") {
    return (
      <div className={cn("min-h-screen bg-[#FDFDFD] flex items-center justify-center py-16 px-6", isRTL && "rtl text-right")}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl bg-white rounded-[40px] p-10 md:p-12 shadow-[0_30px_80px_rgba(240,90,34,0.08)] border border-[#FFE4DE] text-center"
        >
          <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} className="w-24 h-24 rounded-full bg-[#F0FFF4] border-4 border-white shadow-xl flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-12 h-12 text-[#10B981]" />
          </motion.div>
          <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4">
            {t.ready.tag}
          </span>
          <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tight mb-3">{t.ready.title}</h1>
          <p className="text-[#666] font-medium mb-2">
            <span className="font-black text-[#1A1A1A] tabular-nums">{questions.length}</span> {t.ready.questionsWord}
            {level && (
              <>
                {" · "}
                <span className="font-bold text-primary">{t.levelNames[level]}</span>
              </>
            )}
          </p>
          <p className="text-xs text-[#A0A0A0] font-medium mb-8">{t.ready.saved}</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => setStage("mode")} className="h-14 px-10 rounded-2xl bg-[#1A1A1A] hover:bg-primary text-white font-black text-base transition-all shadow-xl shadow-black/10 flex items-center gap-2">
              {t.ready.startNow}
              <ArrowRight className={cn("w-5 h-5", isRTL && "rotate-180")} />
            </Button>
            <Button
              variant="outline"
              onClick={() => toast({ title: t.ready.saved })}
              className="h-14 px-10 rounded-2xl border-2 border-[#E5E5E5] font-black text-[#1A1A1A] hover:bg-[#F9F9F9]"
            >
              {t.ready.later}
            </Button>
          </div>

          <button onClick={() => setStage("menu")} className="mt-6 text-xs font-bold text-[#A0A0A0] hover:text-primary transition-colors border-0 bg-transparent cursor-pointer underline underline-offset-4">
            {t.ready.changeLevel}
          </button>
        </motion.div>
      </div>
    );
  }

  // ============================ MODE SELECT (practice / learn) ============================
  if (stage === "mode") {
    const modes: { id: AnswerMode; icon: React.ReactNode; data: typeof t.mode.practice; accent: string }[] = [
      { id: "practice", icon: <Zap className="w-7 h-7" />, data: t.mode.practice, accent: "text-primary bg-primary/10" },
      { id: "learn", icon: <GraduationCap className="w-7 h-7" />, data: t.mode.learn, accent: "text-emerald-600 bg-emerald-500/10" },
    ];
    return (
      <div className={cn("min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center py-16 px-6", isRTL && "rtl text-right")}>
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tight mb-3">{t.mode.title}</h1>
          <p className="text-[#666] font-medium">{t.mode.subtitle}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          {modes.map((m) => (
            <motion.button
              key={m.id}
              whileHover={{ y: -6 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => beginQuiz(m.id)}
              className={cn("text-left bg-white rounded-[32px] p-8 border-2 border-[#F0F0F0] hover:border-primary/40 shadow-[0_20px_50px_rgba(0,0,0,0.04)] hover:shadow-[0_24px_60px_rgba(240,90,34,0.12)] transition-all group", isRTL && "text-right")}
            >
              <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110", m.accent)}>{m.icon}</div>
              <h3 className="text-xl font-black text-[#1A1A1A] mb-2">{m.data.name}</h3>
              <p className="text-sm text-[#777] leading-relaxed mb-6 min-h-[2.5rem] font-medium">{m.data.desc}</p>
              <div className="space-y-2.5 mb-7">
                {m.data.points.map((p, i) => (
                  <div key={i} className={cn("flex items-center gap-2.5 text-[13px] font-bold text-[#444]")}>
                    <CheckCircle className="w-4 h-4 text-[#10B981]" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
              <div className={cn("inline-flex items-center gap-2 font-black text-sm text-primary group-hover:gap-3 transition-all")}>
                {t.mode.begin} <ArrowRight className={cn("w-4 h-4", isRTL && "rotate-180")} />
              </div>
            </motion.button>
          ))}
        </div>
        <button onClick={() => setStage("ready")} className="mt-8 text-xs font-bold text-[#A0A0A0] hover:text-primary transition-colors border-0 bg-transparent cursor-pointer">
          {isRTL ? "→ رجوع" : "← Back"}
        </button>
      </div>
    );
  }

  // ============================ COMPLETE ============================
  if (stage === "complete") {
    const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    const isHighScore = pct >= 80;
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white relative overflow-hidden">
        {isHighScore && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: "100vh", x: `${Math.random() * 100}vw`, scale: 0.5 + Math.random() }}
                animate={{ opacity: [0, 1, 0], y: "-20vh", rotate: [0, 360] }}
                transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 3 }}
                className="absolute"
              >
                {/* Simple confetti pieces in the brand palette (instead of emoji). */}
                <span className={["block w-2.5 h-2.5 rounded-[2px] bg-primary", "block w-2 h-3 rounded-[2px] bg-slate-800", "block w-2 h-2 rounded-full bg-primary/50", "block w-3 h-1.5 rounded-[2px] bg-amber-400"][i % 4]} />
              </motion.div>
            ))}
          </div>
        )}

        <div className="max-w-2xl px-6 py-12 text-center space-y-10 relative z-10">
          <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} className="w-32 h-32 rounded-full bg-[#FFF5F2] flex items-center justify-center mx-auto shadow-2xl border-4 border-white">
            <span className="text-6xl">{isHighScore ? "🏆" : "🎓"}</span>
          </motion.div>

          <div className="space-y-4">
            <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tight">
              {isHighScore ? (language === "ar" ? "إنجاز مذهل!" : "Stunning Mastery!") : (language === "ar" ? "اكتمل التقييم" : "Assessment Complete")}
            </h2>
            <p className="text-lg text-[#666] font-medium max-w-lg mx-auto leading-relaxed">
              {language === "ar"
                ? `أجبت بشكل صحيح على ${score} من ${questions.length} سؤالاً.`
                : `You answered ${score} of ${questions.length} questions correctly.`}
            </p>
          </div>

          <div className="relative">
            <div className="text-8xl font-black text-primary mb-2">{pct}%</div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#A0A0A0]">
              {language === "ar" ? "نسبة الإتقان" : "Knowledge Retention Score"}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button onClick={() => setStage("mode")} variant="outline" className="rounded-2xl h-16 px-10 border-2 border-[#E5E5E5] font-black text-[#1A1A1A] hover:bg-[#F9F9F9] transition-all">
              {language === "ar" ? "إعادة الاختبار" : "Retake Quiz"}
            </Button>
            <Button onClick={() => setStage("menu")} className="rounded-2xl h-16 px-10 bg-[#1A1A1A] hover:bg-primary text-white font-black text-lg transition-all shadow-xl shadow-black/10">
              {language === "ar" ? "اختبار جديد" : "New Quiz"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ============================ QUIZ ============================
  if (stage === "quiz" && currentQuestion) {
    const showLearnExtras = answerMode === "learn";
    const showTimer = answerMode === "practice" && currentQuestion.type !== "open_ended";
    return (
      <div className={cn("max-w-4xl mx-auto py-10 px-6 bg-[#FDFDFD] min-h-screen", isRTL && "rtl text-right")}>
        {/* Mode + progress strip */}
        <div className={cn("flex items-center justify-between mb-5")}>
          <div className={cn("flex items-center gap-2 text-[11px] font-black uppercase tracking-wider")}>
            <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full", answerMode === "learn" ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary")}>
              {answerMode === "learn" ? <GraduationCap className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
              {answerMode === "learn" ? t.mode.learn.name : t.mode.practice.name}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-[#A0A0A0] tabular-nums">
              {currentQuestionIndex + 1} / {questions.length}
            </span>
            <button
              type="button"
              onClick={handleFinishNow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-colors"
            >
              <Flag className="w-3.5 h-3.5" />
              {language === "ar" ? "إنهاء الاختبار" : "Finish Quiz"}
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-[#F0F0F0] overflow-hidden mb-6">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${((currentQuestionIndex + (isAnswered ? 1 : 0)) / questions.length) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        <div className="bg-white rounded-[32px] shadow-[0_20px_60px_rgba(240,90,34,0.06)] border border-[#FFE4DE] overflow-hidden">
          <div className="bg-[#FFF8F6] p-6 md:p-8 border-b border-[#FFE4DE]">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-0.5">{language === "ar" ? "السؤال" : "QUESTION"}</span>
                  <div className="text-xl font-black text-[#1A1A1A] flex items-baseline gap-1">
                    {currentQuestionIndex + 1}
                    <span className="text-[#A0A0A0] text-xs font-bold">/ {questions.length}</span>
                  </div>
                </div>
                {showTimer && (
                  <>
                    <div className="h-8 w-px bg-[#FFE4DE] mx-2 hidden md:block" />
                    <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-2xl font-black text-sm">
                      <Timer className="w-4 h-4" />
                      <span>{timeLeft}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="text-[11px] font-black text-primary uppercase tracking-widest bg-primary/5 px-4 py-1.5 rounded-full">
                {currentQuestion.type === "open_ended" ? (language === "ar" ? "سؤال مقالي" : "Open-Ended Question") : (language === "ar" ? "خيار من متعدد" : "Multiple Choice")}
              </div>
            </div>
            <div className="mt-4">
              <h2 className="text-lg md:text-xl font-black text-[#1A1A1A] leading-tight">
                <TextWithMath text={currentQuestion.text || (language === "ar" ? "جاري تحميل السؤال..." : "Loading question...")} />
              </h2>
            </div>

            <AnimatePresence>
              {showHint && !isAnswered && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-6 p-4 rounded-2xl bg-[#FFF5F2] border-l-4 border-primary text-[#C14416] flex items-start gap-3">
                  <Bot className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black text-sm uppercase block mb-1">{language === "ar" ? "تلميح للحل:" : "Study Hint:"}</span>
                    <p className="text-sm font-medium italic">
                      <TextWithMath text={currentQuestion.hint || (language === "ar" ? "فكر في المفاهيم الأساسية التي تم شرحها في المحاضرة." : "Think about the core concepts explained in the lecture.")} />
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-6 md:p-8 space-y-6 bg-white">
            {currentQuestion.type === "open_ended" ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="text-sm font-black text-[#666] uppercase tracking-widest">{language === "ar" ? "إجابتك:" : "Your Answer:"}</label>
                  <Textarea
                    value={essayAnswer}
                    onChange={(e) => setEssayAnswer(e.target.value)}
                    disabled={isAnswered}
                    placeholder={language === "ar" ? "اكتب إجابتك هنا بالتفصيل..." : "Compose your detailed response here..."}
                    className="min-h-[200px] rounded-[30px] border-2 border-[#F0F0F0] focus:border-primary focus:ring-0 p-6 text-base font-medium leading-relaxed transition-all"
                  />
                </div>
                {!isAnswered && (
                  <Button onClick={handleEssaySubmit} disabled={!essayAnswer.trim() || isEvaluating} className="w-full h-16 rounded-[25px] bg-[#1A1A1A] hover:bg-primary text-white font-black text-lg transition-all shadow-xl flex items-center justify-center gap-3">
                    {isEvaluating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {language === "ar" ? "جاري تقييم الإجابة..." : "Evaluating Response..."}
                      </>
                    ) : (
                      language === "ar" ? "إرسال الإجابة للتقييم" : "Submit for Evaluation"
                    )}
                  </Button>
                )}
                {evaluation && showLearnExtras && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-8 rounded-[35px] border-2 border-dashed border-primary/20 bg-[#FFF8F6] flex flex-col items-center text-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-white shadow-xl flex items-center justify-center border-4 border-primary">
                      <span className="text-2xl font-black text-primary">{evaluation.similarityScore}%</span>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-black text-[#1A1A1A]">
                        {evaluation.similarityScore < 20 ? (language === "ar" ? "الإجابة غير مرتبطة بالموضوع" : "Irrelevant Response") : (language === "ar" ? "مستوى المطابقة" : "Conceptual Alignment")}
                      </h4>
                      <p className="text-[#666] font-medium max-w-md mx-auto italic">"{evaluation.feedback}"</p>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {currentQuestion.options?.map((opt, i) => {
                  const letter = String.fromCharCode(65 + i);
                  const isSelected = selectedOption === i;
                  const isCorrect = i === currentQuestion.correctIndex;
                  const showResult = isAnswered;
                  return (
                    <motion.button
                      key={i}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleOptionSelect(i)}
                      disabled={isAnswered}
                      className={cn(
                        "w-full p-3 md:p-4 rounded-2xl text-left transition-all border-2 font-bold relative flex items-center gap-3 group min-h-[60px]",
                        showResult
                          ? isCorrect
                            ? "bg-[#F0FFF4] border-[#10B981] text-[#047857] shadow-sm shadow-green-100"
                            : isSelected
                              ? "bg-[#FFF5F5] border-[#EF4444] text-[#B91C1C]"
                              : "bg-white border-[#F0F0F0] text-[#9CA3AF] opacity-60"
                          : isSelected
                            ? "bg-[#FFF5F2] border-primary text-primary shadow-sm"
                            : "bg-white border-[#F0F0F0] hover:border-primary/30 text-[#444]",
                      )}
                    >
                      <span className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-colors uppercase",
                        showResult && isCorrect ? "bg-[#10B981] text-white" : showResult && isSelected && !isCorrect ? "bg-[#EF4444] text-white" : isSelected ? "bg-primary text-white" : "bg-[#F3F4F6] text-primary",
                      )}>
                        {letter}.
                      </span>
                      <span className={cn("flex-1 text-[13px] md:text-sm font-bold tracking-tight", isRTL ? "text-right" : "text-left")}>
                        <TextWithMath text={opt} />
                      </span>
                      {showResult && isCorrect && <CheckCircle className="w-5 h-5 text-[#10B981] shrink-0" />}
                      {showResult && isSelected && !isCorrect && <X className="w-5 h-5 text-[#EF4444] shrink-0" />}
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Feedback */}
            <AnimatePresence>
              {isAnswered && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="pt-6 space-y-6 border-t border-[#F0F0F0] mt-6">
                  {/* Result banner — shown in both modes */}
                  {currentQuestion.type !== "open_ended" && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={cn(
                        "p-5 rounded-[28px] flex items-center gap-4 border-2 transition-all shadow-sm",
                        selectedOption === currentQuestion.correctIndex ? "bg-[#F0FFF4] border-[#10B981] text-[#10B981] shadow-[#10B981]/10" : "bg-[#FFF5F5] border-[#EF4444] text-[#EF4444] shadow-[#EF4444]/10",
                      )}
                    >
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0", selectedOption === currentQuestion.correctIndex ? "bg-[#10B981]" : "bg-[#EF4444]")}>
                        {selectedOption === currentQuestion.correctIndex ? <CheckCircle className="w-6 h-6" /> : <X className="w-6 h-6" />}
                      </div>
                      <div>
                        <h4 className="font-black text-lg leading-tight mb-0.5">
                          {selectedOption === currentQuestion.correctIndex ? (language === "ar" ? "رائع! إجابة دقيقة" : "Great! Accurate Answer") : (language === "ar" ? "للأسف، إجابة غير صحيحة" : "Oops, Incorrect Answer")}
                        </h4>
                        <p className="text-[13px] font-bold opacity-80">
                          {showLearnExtras
                            ? selectedOption === currentQuestion.correctIndex
                              ? (language === "ar" ? "لقد استوعبت هذا المفهوم جيداً." : "You've grasped this concept well.")
                              : (language === "ar" ? "لا تقلق، تعلم من الشرح أدناه." : "Don't worry, learn from the explanation below.")
                            : (language === "ar" ? "تابع للسؤال التالي." : "Move on to the next question.")}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Learn-mode only: explanation, reference, AI tutor */}
                  {showLearnExtras && (
                    <>
                      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="p-6 md:p-8 rounded-[32px] bg-white border-2 border-[#FFE4DE] relative overflow-hidden group shadow-sm">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                          <Bot className="w-24 h-24 text-primary" />
                        </div>
                        <div className="flex items-center gap-3 mb-5">
                          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                            <Lightbulb className="w-5 h-5 text-white" />
                          </div>
                          <h4 className="font-black text-[#1A1A1A] text-lg tracking-tight">
                            {currentQuestion.type === "open_ended" ? (language === "ar" ? "التحليل التعليمي الذكي:" : "Smart Educational Analysis:") : (language === "ar" ? "شرح المفهوم:" : "Concept Explanation:")}
                          </h4>
                        </div>
                        <div className="text-[#333] font-bold leading-[1.8] text-[15px] relative z-10 bg-[#FFF8F6]/50 p-4 rounded-2xl border border-[#FFE4DE]/30">
                          <TextWithMath text={(currentQuestion.type === "open_ended" ? evaluation?.correctAnswer || currentQuestion.explanation : currentQuestion.explanation) || (language === "ar" ? "الشرح لهذا السؤال سيكون متاحاً قريباً." : "Detailed explanation for this question will be available shortly.")} />
                        </div>
                      </motion.div>

                      <div className="p-5 rounded-[32px] bg-white border border-[#F0F0F0] shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-center justify-between gap-4 px-8">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                          <div className="flex flex-col items-center md:items-start gap-1">
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.1em]">{language === "ar" ? "المصدر من المحاضرة:" : "Lecture Reference:"}</span>
                            <div className="flex items-center gap-2">
                              <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm", currentQuestion.reference?.source_type === "uploaded_content" ? "bg-[#1A1A1A] text-white" : "bg-[#F3F4F6] text-[#666]")}>
                                {currentQuestion.reference?.source_type === "uploaded_content" ? (
                                  <>
                                    <BookText className="w-3 h-3 mr-1" />
                                    {language === "ar" ? "من محتوى المحاضرة" : "From Lecture Content"}
                                  </>
                                ) : (
                                  <>
                                    <Globe className="w-3 h-3 mr-1" />
                                    {language === "ar" ? "معرفة خارجية" : "General Knowledge"}
                                  </>
                                )}
                              </div>
                              {currentQuestion.reference?.location && (
                                <div className="flex items-center gap-1.5 text-[#444] text-xs font-black bg-primary/5 px-3 py-1 rounded-lg border border-primary/10">
                                  <PlayCircle className="w-3.5 h-3.5 text-primary" />
                                  <span>{currentQuestion.reference.location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="h-10 w-[1.5px] bg-[#F3F4F6] hidden md:block" />
                          <div className="flex flex-col items-center md:items-start gap-1">
                            <span className="text-[10px] font-black text-[#A0A0A0] uppercase tracking-wider">{language === "ar" ? "المفهوم المرتبط:" : "Related Concept:"}</span>
                            <div className="flex items-center gap-2">
                              <Search className="w-3.5 h-3.5 text-primary" />
                              <span className="text-sm font-black text-[#1A1A1A]">{currentQuestion.reference?.concept || (language === "ar" ? "المفهوم الأساسي" : "Core Concept")}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.01, y: -2 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setIsChatOpen(true)}
                        className="w-full h-14 bg-white border-2 border-primary rounded-[24px] flex items-center justify-between px-6 shadow-md hover:shadow-primary/20 transition-all group overflow-hidden relative"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex items-center gap-4 relative z-10">
                          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 group-hover:rotate-12 transition-transform">
                            <Bot className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col items-start">
                            <span className="text-[#1A1A1A] font-black text-[14px] leading-tight">{language === "ar" ? "هل لديك استفسار إضافي؟" : "Have more questions?"}</span>
                            <span className="text-[#666] font-bold text-[10px] uppercase tracking-widest">{language === "ar" ? "تحدث مع الوكيل الذكي الآن" : "Chat with the AI Agent"}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-primary relative z-10">
                          <ArrowRight className={cn("w-5 h-5 group-hover:translate-x-1 transition-transform", isRTL && "rotate-180")} />
                        </div>
                      </motion.button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Controls */}
            <div className="pt-8 flex justify-between items-center">
              {isAnswered && selectedOption === null && currentQuestion.type !== "open_ended" && (
                <div className="px-4 py-2 rounded-xl bg-red-50 text-red-600 font-bold border border-red-100 flex items-center gap-2 text-xs">
                  <Timer className="w-3 h-3" />
                  {language === "ar" ? "انتهى الوقت!" : "Time's up!"}
                </div>
              )}
              <div className="flex gap-3 w-full">
                {!isAnswered && currentQuestion.type !== "open_ended" && (
                  <Button
                    onClick={handleCheckAnswer}
                    disabled={selectedOption === null}
                    className={cn("h-12 px-8 rounded-xl font-black text-white transition-all shadow-md flex-1 text-sm", selectedOption !== null ? "bg-[#1A1A1A] hover:bg-primary shadow-black/10" : "bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed shadow-none")}
                  >
                    {language === "ar" ? "تحقق" : "Check"}
                  </Button>
                )}
                {isAnswered && (
                  <Button onClick={handleNext} className="h-12 px-8 rounded-xl font-black text-white bg-primary hover:bg-[#D44A1B] shadow-md flex-1 transition-all text-sm">
                    {currentQuestionIndex < questions.length - 1 ? (language === "ar" ? "التالي" : "Next Question") : (language === "ar" ? "إنهاء" : "Finish Quiz")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chat drawer */}
        <AnimatePresence>
          {isChatOpen && (
            <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-4 bg-black/20 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="w-full max-w-4xl h-[80vh] bg-white rounded-[40px] shadow-2xl border border-[#F0F0F0] overflow-hidden flex flex-col relative">
                <div className="p-6 border-b border-[#F0F0F0] flex justify-between items-center bg-[#FDFDFD]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Bot className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-black text-[#1A1A1A]">AI Agent</h3>
                      <p className="text-[10px] text-[#A0A0A0] font-bold uppercase tracking-widest">{language === "ar" ? "نناقش:" : "Discussing:"} {currentQuestion.reference?.concept}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)} className="rounded-full hover:bg-red-50 hover:text-red-500">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <AgentChatView
                    transcript={transcript || ""}
                    title={currentQuestion.reference?.concept || "Question Analysis"}
                    initialMessage={language === "ar" ? `مرحباً، أريد الاستفسار عن المفهوم التالي من المحاضرة: "${currentQuestion.reference?.concept || currentQuestion.text}"` : `Hi, I want to discuss the following concept from the lecture: "${currentQuestion.reference?.concept || currentQuestion.text}"`}
                  />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return null;
}
