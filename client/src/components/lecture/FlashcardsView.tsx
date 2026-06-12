import { useMemo, useState, useEffect } from "react";
import { 
  Brain, 
  ChevronRight, 
  Share2, 
  Download, 
  Maximize, 
  RotateCcw, 
  Flag, 
  Clock, 
  Library, 
  BarChart3, 
  Plus, 
  Settings, 
  Flame, 
  Zap,
  CheckCircle2,
  MoreVertical,
  Search,
  User,
  Info,
  ExternalLink,
  BrainCircuit,
  Layout
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { lectureService } from "@/lib/lectureService";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Flashcard {
  id: number | string;
  term: string;
  definition: string;
  flagged?: boolean;
  reviewBucket?: "again" | "hard" | "good" | "easy";
  interval?: number; // for spaced repetition (in days)
  easeFactor?: number; // for spaced repetition
  nextReviewDate?: string; // ISO date
  masteryLevel?: number; // 0-100
  relatedConcept?: string;
}

interface FlashcardsViewProps {
  flashcards?: Flashcard[];
  lectureId?: string;
  lectureTitle?: string;
}

type StudyMode = "current" | "spaced" | "flagged";

export function FlashcardsView({ flashcards: initialFlashcards = [], lectureId, lectureTitle }: FlashcardsViewProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [flashcards, setFlashcards] = useState<Flashcard[]>(initialFlashcards);
  const [activeMode, setActiveMode] = useState<StudyMode>("current");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isNewDeckOpen, setIsNewDeckOpen] = useState(false);

  // Sync with initial props
  useEffect(() => {
    if (initialFlashcards && initialFlashcards.length > 0) {
      setFlashcards(initialFlashcards);
    }
  }, [initialFlashcards]);

  // Derived collections
  const filteredCards = useMemo(() => {
    switch (activeMode) {
      case "spaced":
        // Show ONLY cards explicitly marked as "again" or "hard" for focused practice
        return flashcards.filter(c => c.reviewBucket === "again" || c.reviewBucket === "hard");
      case "flagged":
        return flashcards.filter(c => c.flagged);
      case "current":
      default:
        // Current deck shows ALL flashcards
        return flashcards;
    }
  }, [flashcards, activeMode]);

  const activeCard = filteredCards[currentIndex];
  const progress = filteredCards.length > 0 ? ((currentIndex) / filteredCards.length) * 100 : 0;

  const t = {
    modes: {
      current: language === "ar" ? "البطاقات الحالية" : "Current Deck",
      spaced: language === "ar" ? "التكرار المتباعد" : "Spaced Repetition",
      flagged: language === "ar" ? "المميزة" : "Flagged",
    },
    actions: {
      newDeck: language === "ar" ? "إنشاء مجموعة جديدة" : "New Deck",
      settings: language === "ar" ? "الإعدادات" : "Settings",
      reveal: language === "ar" ? "إظهار الإجابة" : "Reveal Answer",
      flag: language === "ar" ? "تمميز" : "Flag",
      unflag: language === "ar" ? "إزالة التمييز" : "Unflag",
      endSession: language === "ar" ? "إنهاء الجلسة" : "End Session",
    },
    intervals: {
      again: language === "ar" ? "إعادة" : "Again",
      hard: language === "ar" ? "صعب" : "Hard",
      good: language === "ar" ? "جيد" : "Good",
      easy: language === "ar" ? "سهل" : "Easy",
    },
    stats: {
      mastery: language === "ar" ? "مستوى الإتقان" : "Mastery Level",
      streak: language === "ar" ? "سلسلة التعلم" : "Session Streak",
      progress: language === "ar" ? "تقدم المجموعة" : "Deck Progress",
      related: language === "ar" ? "مفهوم مرتبط" : "Related Concept",
    }
  };

  const handleFlag = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeCard) return;

    const updatedCards = flashcards.map(c => 
      c.id === activeCard.id ? { ...c, flagged: !c.flagged } : c
    );
    setFlashcards(updatedCards);

    if (user && lectureId) {
      try {
        await lectureService.updateLecture(user.uid, lectureId, { flashcards: updatedCards });
        toast({
          title: !activeCard.flagged ? "تم التمييز" : "تمت الإزالة",
          description: !activeCard.flagged ? "البطاقة الآن في قائمة المفضلات." : "تمت إزالة البطاقة من المفضلات.",
        });
      } catch (err) {
        console.error("Failed to update flag", err);
      }
    }
  };

  const handleRating = async (rating: "again" | "hard" | "good" | "easy") => {
    if (!activeCard) return;

    // Simple SM-2 like logic for mockup
    let interval = activeCard.interval || 1;
    let ease = activeCard.easeFactor || 2.5;
    let nextReview = new Date();

    switch(rating) {
      case "again": 
        interval = 0; 
        nextReview.setMinutes(nextReview.getMinutes() + 1); 
        break;
      case "hard": 
        interval = Math.max(1, interval * 1.2); 
        nextReview.setDate(nextReview.getDate() + Math.ceil(interval)); 
        break;
      case "good": 
        interval = interval === 0 ? 1 : interval * 2.5; 
        nextReview.setDate(nextReview.getDate() + Math.ceil(interval)); 
        break;
      case "easy": 
        interval = interval === 0 ? 4 : interval * 3.5; 
        nextReview.setDate(nextReview.getDate() + Math.ceil(interval)); 
        break;
    }

    const updatedCards = flashcards.map(c => 
      c.id === activeCard.id ? { 
        ...c, 
        reviewBucket: rating,
        interval, 
        easeFactor: ease, 
        nextReviewDate: nextReview.toISOString(),
        masteryLevel: Math.min(100, (c.masteryLevel || 0) + (rating === "easy" ? 20 : 10))
      } : c
    );
    
    setFlashcards(updatedCards);
    setIsFlipped(false);
    
    // Move to next card
    if (currentIndex < filteredCards.length - 1) {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 300);
    } else {
      toast({ title: "Session Complete!", description: "You've reviewed all cards in this mode." });
    }

    if (user && lectureId) {
      await lectureService.updateLecture(user.uid, lectureId, { flashcards: updatedCards });
    }
  };

  const isRTL = language === "ar";

  return (
    <div className="flex bg-[#F8FAFC] min-h-[85vh] rounded-3xl overflow-hidden border border-slate-200 shadow-sm font-body" dir={isRTL ? "rtl" : "ltr"}>
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-e border-slate-100 flex flex-col p-6 space-y-8 shrink-0">
        <div className="flex items-center gap-3 px-2">
           <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Brain className="w-6 h-6" />
           </div>
           <div>
              <h3 className="font-bold text-sm text-slate-900 truncate max-w-[120px]">{lectureTitle || "Lecture"}</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                {activeMode === "spaced" 
                  ? `${filteredCards.length} ${language === "ar" ? "بطاقات للمراجعة" : "to review"}`
                  : `${filteredCards.length} ${language === "ar" ? "بطاقات متبقية" : "cards remaining"}`
                }
              </p>
           </div>
        </div>

        <nav className="space-y-1">
           {[
             { id: "current", label: t.modes.current, icon: Library },
             { id: "spaced", label: t.modes.spaced, icon: Clock },
             { id: "flagged", label: t.modes.flagged, icon: Flag },
           ].map(item => (
             <button
               key={item.id}
               onClick={() => { setActiveMode(item.id as StudyMode); setCurrentIndex(0); setIsFlipped(false); }}
               className={cn(
                 "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                 activeMode === item.id 
                  ? "bg-primary/5 text-primary shadow-sm" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
               )}
             >
               <item.icon className={cn("w-5 h-5", activeMode === item.id ? "text-primary" : "text-slate-400")} />
               {item.label}
             </button>
           ))}
        </nav>

        <div className="pt-4 mt-auto border-t border-slate-50">
           <button 
             onClick={() => setIsNewDeckOpen(true)}
             className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-sm flex items-center justify-center gap-2 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
           >
              <Plus className="w-4 h-4" />
              {t.actions.newDeck}
           </button>
        </div>


      </aside>

      {/* MAIN STUDY AREA */}
      <main className="flex-1 flex flex-col p-8 md:p-12 relative overflow-hidden">
        {/* TOP BAR */}
        <header className="flex items-center justify-between mb-12">
           <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Mode: {t.modes[activeMode]}</span>
              <h2 className="text-3xl font-black text-slate-900">{activeCard?.term || "Session Complete"}</h2>
           </div>
           
           <div className="flex items-center gap-8">
              <div className="flex flex-col items-center">
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                   {activeMode === "spaced" 
                     ? (language === "ar" ? "بطاقات صعبة" : "Difficult Cards")
                     : t.stats.streak
                   }
                 </span>
                 <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-slate-900">
                      {filteredCards.length} {language === "ar" ? "بطاقة" : "Cards"}
                    </span>
                    {activeMode === "spaced" ? (
                      <Clock className="w-5 h-5 text-primary" />
                    ) : (
                      <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
                    )}
                 </div>
              </div>
              <div className="flex flex-col items-end">
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{t.stats.progress}</span>
                 <div className="flex items-center gap-3">
                    <span className="text-xl font-black text-slate-900">
                       {String(currentIndex + 1).padStart(2, '0')} <span className="text-slate-300">/ {filteredCards.length}</span>
                    </span>
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-primary" style={{ width: `${progress}%` }}></div>
                    </div>
                 </div>
              </div>
           </div>
        </header>

        {/* STUDY CARD CONTAINER */}
        <div className="flex-1 flex flex-col items-center justify-center">
           {!activeCard ? (
             activeMode === "spaced" && filteredCards.length === 0 ? (
               // No difficult cards in spaced repetition
               <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                     <Clock className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">
                    {language === "ar" ? "لا توجد بطاقات صعبة" : "No Difficult Cards"}
                  </h3>
                  <p className="text-slate-500 font-medium max-w-md">
                    {language === "ar" 
                      ? "لم تقم بتمييز أي بطاقات كـ 'صعبة' أو 'إعادة'. ارجع للوضع العادي للدراسة."
                      : "You haven't marked any cards as 'Hard' or 'Again'. Go back to Current Deck to study more cards."
                    }
                  </p>
                  <Button onClick={() => setActiveMode("current")} className="mt-4 rounded-full px-8 py-6">
                    {language === "ar" ? "العودة للبطاقات الحالية" : "Back to Current Deck"}
                  </Button>
               </div>
             ) : (
               // Normal completion or no cards in other modes
               <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                     <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">All Done!</h3>
                  <p className="text-slate-500 font-medium">
                    {activeMode === "spaced" 
                      ? (language === "ar" 
                          ? "لقد راجعت جميع البطاقات الصعبة. أحسنت!" 
                          : "You've reviewed all difficult cards. Great job!")
                      : "You have reviewed all cards in this section."
                    }
                  </p>
                  <Button onClick={() => setActiveMode("current")} className="mt-4 rounded-full px-8 py-6">
                    {language === "ar" ? "العودة للبطاقات الحالية" : "Back to Current Deck"}
                  </Button>
               </div>
             )
           ) : (
             <div className="w-full max-w-4xl space-y-12">
                {/* THE CARD */}
                <div className="relative group w-full">
                   <div 
                     className={cn(
                       "relative min-h-[280px] w-full transition-all duration-700 [transform-style:preserve-3d]",
                       isFlipped ? "[transform:rotateX(180deg)]" : ""
                     )}
                   >
                      {/* FRONT */}
                      <div className="absolute inset-0 bg-white rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col p-8 md:p-10 text-center items-center justify-center [backface-visibility:hidden]">
                         <div className="absolute top-6 right-10 flex items-center gap-2">
                            <button 
                              onClick={handleFlag}
                              className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs border transition-all",
                                activeCard.flagged 
                                 ? "bg-orange-500 text-white border-orange-500 shadow-md" 
                                 : "bg-white text-slate-400 border-slate-100 hover:text-slate-700"
                              )}
                            >
                               <Flag className={cn("w-3.5 h-3.5", activeCard.flagged && "fill-current")} />
                               {activeCard.flagged ? t.actions.unflag : t.actions.flag}
                            </button>
                         </div>

                         <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-8">
                            <BrainCircuit className="w-8 h-8 text-primary/30" />
                         </div>

                         <h3 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight max-w-2xl">
                            {activeCard.term}
                         </h3>

                         <button 
                           onClick={() => setIsFlipped(true)}
                           className="mt-10 bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-2xl shadow-slate-900/20 hover:-translate-y-1 transition-all active:scale-95"
                         >
                            {t.actions.reveal}
                         </button>
                      </div>

                      {/* BACK */}
                      <div className="absolute inset-0 bg-white rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col p-8 md:p-10 [transform:rotateX(180deg)] [backface-visibility:hidden] overflow-hidden">
                          <div className="h-full flex flex-col overflow-hidden">
                             <div className="flex items-center justify-between mb-8 shrink-0">
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 border-b-2 border-primary/20 pb-1">Flashcard Answer</span>
                                <button onClick={handleFlag} className={cn("text-slate-400 hover:text-orange-500", activeCard.flagged && "text-orange-500")}>
                                   <Flag className={cn("w-5 h-5", activeCard.flagged && "fill-current")} />
                                </button>
                             </div>
                             
                             <div className="flex flex-1 items-center justify-center overflow-hidden py-4">
                                <div className="w-full h-full overflow-y-auto px-2 custom-scrollbar flex flex-col items-center justify-center">
                                   <div className="text-xl md:text-2xl text-slate-800 leading-relaxed font-medium text-center">
                                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                         {activeCard.definition}
                                      </ReactMarkdown>
                                   </div>
                                </div>
                             </div>
                          </div>
                      </div>
                   </div>
                </div>

                {/* BOTTOM CONTROLS / STATS */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                   <div className="md:col-span-8 flex flex-col items-center">
                      <AnimatePresence mode="wait">
                         {isFlipped ? (
                           <motion.div 
                             initial={{ opacity: 0, y: 20 }}
                             animate={{ opacity: 1, y: 0 }}
                             className="w-full space-y-8"
                           >
                              <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">{language === 'ar' ? 'كيف كان تقييمك لاستذكارك؟' : 'RATE YOUR RECALL'}</p>
                              <div className="grid grid-cols-4 gap-4">
                                 {[
                                   { id: "again", label: t.intervals.again, color: "text-red-500", bg: "bg-red-50", time: "1 MIN" },
                                   { id: "hard", label: t.intervals.hard, color: "text-slate-600", bg: "bg-slate-50", time: "2 DAYS" },
                                   { id: "good", label: t.intervals.good, color: "text-orange-500", bg: "bg-orange-50", time: "4 DAYS" },
                                   { id: "easy", label: t.intervals.easy, color: "text-emerald-500", bg: "bg-emerald-50", time: "7 DAYS" }
                                 ].map(item => (
                                   <button 
                                     key={item.id}
                                     onClick={() => handleRating(item.id as any)}
                                     className={cn(
                                       "flex flex-col items-center p-6 rounded-[1.5rem] transition-all hover:-translate-y-2 active:scale-95",
                                       item.bg
                                     )}
                                   >
                                      <span className={cn("font-black text-lg", item.color)}>{item.label}</span>
                                      <span className="text-[10px] font-bold text-slate-400 mt-1">{item.time}</span>
                                      <div className={cn("w-1.5 h-1.5 rounded-full mt-4 bg-current", item.color)}></div>
                                   </button>
                                 ))}
                              </div>
                              
                              <div className="bg-white rounded-[2rem] p-8 border border-slate-100 flex items-start gap-6">
                                 <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-[#F05A22]">
                                    <Brain className="w-8 h-8" />
                                 </div>
                                 <div className="space-y-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#F05A22]">{t.stats.related}</span>
                                    <h5 className="text-xl font-black text-slate-900">{activeCard.relatedConcept || "Synaptic Tagging"}</h5>
                                    <p className="text-sm text-slate-500 font-medium leading-relaxed">How the brain identifies which synapses to strengthen specifically during LTP. This process involves local protein synthesis...</p>

                                 </div>
                              </div>
                           </motion.div>
                         ) : (
                           <div className="flex gap-4 opacity-40 select-none grayscale pt-12">
                              <span className="px-3 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-400">SPACE FLIP CARD</span>
                              <span className="px-3 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-400">1-4 RATE ANSWER</span>
                              <span className="px-3 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-400">ESC EXIT MODULE</span>
                           </div>
                         )}
                      </AnimatePresence>
                   </div>
                   
                   <div className="md:col-span-4 self-end">
                      <div className="bg-white rounded-[2rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/20 text-center flex flex-col items-center relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Layout className="w-40 h-40" />
                         </div>
                         <h3 className="text-5xl font-black text-primary mb-2">{activeCard.masteryLevel || 88}%</h3>
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">{t.stats.mastery}</span>
                         <p className="text-xs text-slate-500 font-bold leading-relaxed relative z-10 px-4">
                            {language === 'ar' ? `لقد واجهت هذا المفهوم ${Math.floor(Math.random() * 15) + 5} مرات هذا الشهر.` : `You've encountered this concept ${Math.floor(Math.random() * 15) + 5} times this month.`}
                         </p>
                         
                         <div className="mt-8 flex gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary animate-bounce"></span>
                            <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce [animation-delay:0.2s]"></span>
                            <span className="w-2 h-2 rounded-full bg-primary/20 animate-bounce [animation-delay:0.4s]"></span>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
           )}
        </div>
      </main>

      <Dialog open={isNewDeckOpen} onOpenChange={setIsNewDeckOpen}>
         <DialogContent className="max-w-md">
            <DialogHeader>
               <DialogTitle>{t.actions.newDeck}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
               <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">{language === 'ar' ? 'المصطلح / المفهوم' : 'Term / Concept'}</label>
                  <input className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none" placeholder="..." />
               </div>
               <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">{language === 'ar' ? 'التعريف / الشرح' : 'Definition / Explanation'}</label>
                  <textarea className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none h-32" placeholder="..." />
               </div>
               <Button className="w-full py-6 rounded-2xl font-black text-lg">{language === 'ar' ? 'إضافة للبطاقات' : 'Add to Deck'}</Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}
