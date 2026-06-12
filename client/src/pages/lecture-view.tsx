import { useParams } from "wouter";
import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, List, HelpCircle, Presentation, Share2, Download, ChevronLeft, Trash2, X, Sparkles, Clock, Calendar, Sigma, Maximize2, LayoutGrid, Stethoscope, CircuitBoard } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { TranscriptView } from "@/components/lecture/TranscriptView";
import { SummaryView } from "@/components/lecture/SummaryView";
import { QuizView } from "@/components/lecture/QuizView";
import { SlidesView } from "@/components/lecture/SlidesView";
import { FlashcardsView } from "@/components/lecture/FlashcardsView";
import { FormulasView } from "@/components/lecture/FormulasView";
import { MedicalInsightsView } from "@/components/lecture/MedicalInsightsView";
import { EngineeringLabView } from "@/components/lecture/EngineeringLabView";
import { ConceptMapView } from "@/components/lecture/ConceptMapView";
import { ImagesView } from "@/components/lecture/ImagesView";
import { Brain, MessageSquare, BrainCircuit, Image as ImageIcon, Bot } from "lucide-react";
import { AgentChatView } from "@/components/lecture/AgentChatView";
import { NanoBananaView } from "@/components/lecture/NanoBananaView";
import { useLecture, useLectures } from "@/hooks/useLectures";
import { generateSummary, generateQuiz, generateSlides, generateFlashcards, generateFormulas as extractMathFormulas, generateConceptMap, generateMedicalInsights, generateEngineeringInsights, analyzeImageWithAI } from "@/lib/aiService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Cpu, Cloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Progress } from "@/components/ui/progress";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function LectureView() {
  const { id } = useParams();
  const lectureId = id;
  const { lecture, isLoading } = useLecture(id);
  const { lectures, deleteLecture, updateLecture, isDeleting, isUpdating } = useLectures();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { language, isRTL } = useLanguage();
  const [selectedModel, setSelectedModel] = useState<"gpu" | "api">("api");
  const [activeTab, setActiveTab] = useState("summary");
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupTab, setPopupTab] = useState("summary");
  const [forceShowContent, setForceShowContent] = useState(false);

  // Determine visibility states based on lecture data with safety checks
  const sourceHint = `${lecture?.title || ""} ${lecture?.sourceUrl || ""} ${lecture?.sourceType || ""}`.toLowerCase();
  const isPresentation = /\.(pptx?|ppsx)\b/.test(sourceHint) || lecture?.sourceType === "pptx";
  const status = lecture?.status || "processing"; // Default to processing if status is missing

  const isRealMathFormula = (value?: string) => {
    if (!value) return false;
    const txt = value.trim();
    if (txt.length < 3) return false;
    // Needs math signal: operators, LaTeX keywords, greek letters, or equation shape.
    return /[=+\-*/^]|\\(frac|sum|int|sqrt|alpha|beta|theta|pi|lambda)|[∑∫√πΔΩθλμσ]|[a-zA-Z]\s*=\s*|[0-9]\s*[\+\-\*/^]\s*[0-9]/.test(txt);
  };

  // Check if transcript contains real mathematical/scientific laws and formulas
  const containsRealMathContent = (text: string): boolean => {
    if (!text || text.length < 50) return false;

    // Patterns for real mathematical/scientific formulas and laws
    const formulaPatterns = [
      // Physical laws and equations
      /(?:newton|einstein|maxwell|ohm|faraday|coulomb|gauss|ampere|kelvin|boltzmann|planck|heisenberg|schrodinger)[\s']+(?:law|equation|formula|principle|theorem)/i,
      // Mathematical theorems and formulas
      /(?:pythagorean|quadratic|binomial|logarithm|exponential|trigonometric|integral|derivative|differential|matrix|vector|tensor)[\s']+(?:theorem|formula|equation|law|identity)/i,
      // LaTeX math notation
      /\\(?:frac|sum|int|prod|sqrt|sin|cos|tan|log|ln|exp|lim|infty|partial|nabla|alpha|beta|gamma|delta|theta|lambda|mu|pi|sigma|omega)/i,
      // Mathematical symbols and operators in context
      /\$[^$]*[=+\-*/^∫∑∏√∞∂∇∆Ωθλμσπ][^$]*\$/,
      // Equations with variables (e.g., E=mc², F=ma)
      /[A-Z][a-z]?\s*=\s*[^\s]{1,20}/,
      // Mathematical expressions
      /\d+\s*[\+\-\*/^]\s*\d+\s*[=\+\-\*/^]\s*\d+/,
      // Chemical equations
      /[A-Z][a-z]?\d*\s*[\+\-\→⇌]\s*[A-Z][a-z]?\d*/,
      // Units that indicate scientific formulas (Joules, Newtons, Watts, etc.)
      /\d+\s*(?:J|N|W|Pa|Hz|V|A|Ω|mol|K|kg|m|s|cd|rad|sr)\b/,
    ];

    return formulaPatterns.some(pattern => pattern.test(text));
  };

  // Check for mathematical subject keywords in title/category
  const isMathSubject = (text: string): boolean => {
    if (!text) return false;
    const mathSubjects = /\b(?:math|mathematics|algebra|calculus|geometry|trigonometry|statistics|probability|linear代数|微积分|数学|هندسة|جبر|إحصاء|فيزياء|كيمياء|طبيعة| mechanics|electromagnetism|thermodynamics|quantum|relativity|kinematics|dynamics|optics|electromagnetic|nuclear|atomic|particle)\b/i;
    return mathSubjects.test(text);
  };

  const hasFormulas = !!(lecture?.formulas && Array.isArray(lecture.formulas) && lecture.formulas.length > 0 && lecture.formulas.some(f => isRealMathFormula(f.formula) || isRealMathFormula(f.name)));

  // Only show formulas tab if:
  // 1. We have actual formulas in the data, OR
  // 2. The transcript contains real mathematical content, OR
  // 3. The title/category clearly indicates a math/science subject
  const contentToCheck = `${lecture?.title || ""} ${lecture?.category || ""} ${lecture?.transcript?.slice(0, 5000) || ""}`;
  const hasRealMathContent = containsRealMathContent(contentToCheck) || isMathSubject(contentToCheck);

  // Show tab only if we have formulas AND the content is actually mathematical
  const showFormulasTab = hasFormulas && hasRealMathContent;

  // Medical Insights: generated only for medical lectures, so presence implies a medical lecture.
  const med = lecture?.medical;
  const hasMedical = !!(med && (
    (med.terms?.length || 0) +
    (med.drugs?.length || 0) +
    (med.calculations?.length || 0) +
    (med.procedures?.length || 0) > 0
  ));
  // While processing, allow the pending tab to show for medical-category lectures.
  const isMedicalLecture = lecture?.category === "medicine";

  // Engineering Lab: generated only for engineering lectures.
  const eng = lecture?.engineering;
  const hasEngineering = !!(eng && (
    (eng.components?.length || 0) +
    (eng.circuits?.length || 0) +
    (eng.code?.length || 0) +
    (eng.formulas?.length || 0) +
    (eng.procedures?.length || 0) > 0
  ));
  const isEngineeringLecture = lecture?.category === "engineering";

  // Track previous state to detect completion
  const prevStateRef = useRef({
    transcript: false,
    summary: false,
    conceptMap: false,
    quiz: false,
    slides: false,
    flashcards: false,
    formulas: false,
    medical: false,
    engineering: false,
  });

  // Function to play notification sound
  const playNotificationSound = () => {
    try {
      // Create a simple notification sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // Higher pitch for success
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      // Fallback: use browser notification sound if available
      console.log("Audio notification played");
    }
  };

  // Track section completions and show notifications
  useEffect(() => {
    if (!lecture || lecture.status !== "processing") return;

    const currentState = {
      transcript: !!(lecture.transcript && lecture.transcript.length > 0),
      summary: !!(lecture.summary && (typeof lecture.summary === 'string' ? lecture.summary.length > 0 : Array.isArray(lecture.summary) && lecture.summary.length > 0)),
      conceptMap: !!(lecture.conceptMap && typeof lecture.conceptMap === 'string' && lecture.conceptMap.length > 0),
      quiz: !!(lecture.quiz_sets && Object.values(lecture.quiz_sets).some(set => set.length > 0)),
      slides: !!(lecture.slides && lecture.slides.length > 0),
      flashcards: !!(lecture.flashcards && lecture.flashcards.length > 0),
      formulas: !!(lecture.formulas && lecture.formulas.length > 0),
      medical: hasMedical,
      engineering: hasEngineering,
    };

    const prevState = prevStateRef.current;

    // Check for newly completed sections
    if (currentState.transcript && !prevState.transcript) {
      playNotificationSound();
      toast({
        title: language === "ar" ? "اكتمل النص" : "Transcript Ready",
        description: language === "ar" ? "تم استخراج النص بنجاح" : "Transcript has been extracted successfully",
        duration: 3000,
      });
    }
    if (currentState.summary && !prevState.summary) {
      playNotificationSound();
      toast({
        title: language === "ar" ? "اكتمل الملخص" : "Summary Ready",
        description: language === "ar" ? "تم إنشاء الملخص بنجاح" : "Summary has been generated successfully",
        duration: 3000,
      });
    }
    if (currentState.conceptMap && !prevState.conceptMap) {
      playNotificationSound();
      toast({
        title: language === "ar" ? "اكتملت الخريطة" : "Concept Map Ready",
        description: language === "ar" ? "تم إنشاء الخريطة المفاهيمية بنجاح" : "Concept map has been generated successfully",
        duration: 3000,
      });
    }
    if (currentState.quiz && !prevState.quiz) {
      playNotificationSound();
      toast({
        title: language === "ar" ? "اكتمل الاختبار" : "Quiz Ready",
        description: language === "ar" ? "تم إنشاء الاختبار بنجاح" : "Quiz has been generated successfully",
        duration: 3000,
      });
    }


    if (currentState.slides && !prevState.slides) {
      playNotificationSound();
      toast({
        title: language === "ar" ? "اكتملت الشرائح" : "Slides Ready",
        description: language === "ar" ? "تم إنشاء الشرائح بنجاح" : "Slides have been generated successfully",
        duration: 3000,
      });
    }
    if (currentState.flashcards && !prevState.flashcards) {
      playNotificationSound();
      toast({
        title: language === "ar" ? "اكتملت البطاقات" : "Flashcards Ready",
        description: language === "ar" ? "تم إنشاء البطاقات بنجاح" : "Flashcards have been generated successfully",
        duration: 3000,
      });
    }

    if (currentState.formulas && !prevState.formulas) {
      playNotificationSound();
      toast({
        title: language === "ar" ? "اكتملت المعادلات" : "Formulas Ready",
        description: language === "ar" ? "تم استخراج المعادلات والقوانين الرياضية" : "Math formulas and laws have been extracted",
        duration: 3000,
      });
    }

    if (currentState.medical && !prevState.medical) {
      playNotificationSound();
      toast({
        title: language === "ar" ? "اكتملت الرؤى الطبية" : "Medical Insights Ready",
        description: language === "ar" ? "تم تحليل المحتوى الطبي" : "Medical content has been analyzed",
        duration: 3000,
      });
    }

    if (currentState.engineering && !prevState.engineering) {
      playNotificationSound();
      toast({
        title: language === "ar" ? "اكتمل مختبر الهندسة" : "Engineering Lab Ready",
        description: language === "ar" ? "تم تحليل المحتوى الهندسي" : "Engineering content has been analyzed",
        duration: 3000,
      });
    }

    // Update previous state
    prevStateRef.current = currentState;
  }, [lecture?.transcript, lecture?.summary, lecture?.conceptMap, lecture?.quiz_sets, lecture?.slides, lecture?.flashcards, lecture?.formulas, lecture?.medical, lecture?.engineering, lecture?.status, toast, language]);

  const t = {
    loadingLecture: language === "ar" ? "جاري تحميل المحاضرة..." : "Loading lecture...",
    notFound: language === "ar" ? "المحاضرة غير موجودة." : "Lecture not found.",
    backToDashboard: language === "ar" ? "العودة لتحليل جديد" : "Back to New Analysis",
    stopProcessing: language === "ar" ? "إيقاف المعالجة" : "Stop Processing",
    rerunAI: language === "ar" ? "إعادة تشغيل الذكاء الاصطناعي" : "Re-run AI",
    share: language === "ar" ? "مشاركة" : "Share",
    exportAll: language === "ar" ? "تصدير الكل" : "Export All",
    openInNewWindow: language === "ar" ? "فتح في نافذة جديدة" : "Open in New Window",
    openInPopup: language === "ar" ? "فتح في نافذة منبثقة" : "Open in Popup",
    delete: language === "ar" ? "حذف" : "Delete",
    deleting: language === "ar" ? "جاري الحذف..." : "Deleting...",
    areYouSure: language === "ar" ? "هل أنت متأكد؟" : "Are you sure?",
    deleteConfirm: language === "ar"
      ? "لا يمكن التراجع عن هذا الإجراء. سيتم حذف المحاضرة وكل بياناتها نهائياً."
      : "This action cannot be undone. This will permanently delete the lecture and all of its data.",
    cancel: language === "ar" ? "إلغاء" : "Cancel",
    transcript: language === "ar" ? "النص الكامل" : "Transcript",
    summary: language === "ar" ? "الملخص" : "Summary",
    conceptMap: language === "ar" ? "خريطة المفاهيم" : "Concept Map",
    quiz: language === "ar" ? "الاختبار" : "Quiz",
    slides: language === "ar" ? "الشرائح" : "Slides",
    cards: language === "ar" ? "البطاقات" : "Cards",
    formulas: language === "ar" ? "المعادلات" : "Formulas",
    medical: language === "ar" ? "الرؤى الطبية" : "Medical Insights",
    engineering: language === "ar" ? "مختبر الهندسة" : "Engineering Lab",
    images: language === "ar" ? "الصور" : "Images",
    chat: language === "ar" ? "المحادثة" : "Chat Agent",
    status: {
      completed: language === "ar" ? "مكتمل" : "completed",
      processing: language === "ar" ? "جاري المعالجة" : "processing",
      failed: language === "ar" ? "فشل" : "failed",
    },
    toast: {
      exportSuccess: language === "ar" ? "تم التصدير بنجاح" : "Export successful",
      exportSuccessDesc: language === "ar" ? "تم تصدير كل المحتوى كملف PDF." : "All content has been exported as PDF.",
      exportFailed: language === "ar" ? "فشل التصدير" : "Export failed",
      exportFailedDesc: language === "ar" ? "فشل تصدير PDF. يرجى المحاولة مرة أخرى." : "Failed to export PDF. Please try again.",
      deleted: language === "ar" ? "تم حذف المحاضرة" : "Lecture deleted",
      deletedDesc: language === "ar" ? "تم حذف المحاضرة بنجاح." : "The lecture has been deleted successfully.",
      error: language === "ar" ? "خطأ" : "Error",
      stopProcessing: language === "ar" ? "تم إيقاف المعالجة" : "Processing stopped",
      stopProcessingDesc: language === "ar" ? "تم إيقاف معالجة المحاضرة." : "The lecture processing has been stopped.",
      cannotReprocess: language === "ar" ? "لا يمكن إعادة المعالجة" : "Cannot re-process",
      cannotReprocessDesc: language === "ar" ? "النص مفقود أو قصير جداً للمعالجة." : "Transcript is missing or too short to process.",
      reprocessStarted: language === "ar" ? "بدأت إعادة المعالجة" : "Re-processing started",
      reprocessStartedDesc: language === "ar" ? "جاري إعادة إنشاء الملخص والاختبار والشرائح لهذه المحاضرة." : "Regenerating summary, quiz, and slides for this lecture.",
      reprocessComplete: language === "ar" ? "اكتملت إعادة المعالجة" : "Re-processing complete",
      reprocessCompleteDesc: language === "ar" ? "تم إعادة إنشاء محتوى الذكاء الاصطناعي لهذه المحاضرة." : "AI content for this lecture has been regenerated.",
      reprocessFailed: language === "ar" ? "فشلت إعادة المعالجة" : "Re-processing failed",
      shared: language === "ar" ? "تمت المشاركة بنجاح" : "Shared successfully",
      sharedDesc: language === "ar" ? "تم مشاركة رابط المحاضرة." : "The lecture link has been shared.",
      copied: language === "ar" ? "تم النسخ" : "Copied to clipboard",
      copiedDesc: language === "ar" ? "تم نسخ رابط المحاضرة إلى الحافظة." : "Lecture link has been copied to your clipboard.",
    },
    selectModel: language === "ar" ? "اختر الموديل" : "Select Model",
    modelGpu: language === "ar" ? "LM-Titan (GPU)" : "LM-Titan (GPU)",
    modelApi: language === "ar" ? "LM-Cloud (API)" : "LM-Cloud (API)",
    loading: {
      transcript: language === "ar" ? "جاري استخراج النص..." : "Extracting transcript...",
      summary: language === "ar" ? "جاري إنشاء الملخص..." : "Generating summary...",
      conceptMap: language === "ar" ? "جاري إنشاء الخريطة..." : "Generating concept map...",
      quiz: language === "ar" ? "جاري إنشاء الاختبار..." : "Generating quiz...",
      slides: language === "ar" ? "جاري إنشاء الشرائح..." : "Generating slides...",
      flashcards: language === "ar" ? "جاري إنشاء البطاقات..." : "Generating flashcards...",
      formulas: language === "ar" ? "جاري استخراج المعادلات..." : "Extracting formulas...",
      medical: language === "ar" ? "جاري تحليل المحتوى الطبي..." : "Analyzing medical content...",
      engineering: language === "ar" ? "جاري تحليل المحتوى الهندسي..." : "Analyzing engineering content...",
    },
    agentStatus: {
      systemStatus: language === "ar" ? "الحالة الحالية للنظام" : "Current System Status",
      intelAgent: language === "ar" ? "وكيل الذكاء" : "Intel Agent",
      processing: language === "ar" ? "قيد المعالجة" : "Processing",
      agentDescription: language === "ar" 
        ? "يقوم وكيل الذكاء الاصطناعي حالياً بتفكيك وتحليل محاضرتك:" 
        : "The AI agent is currently deconstructing and analyzing your lecture:",
      agentDescriptionEnd: language === "ar"
        ? ". يتم الآن تنسيق المعلومات في وحدات تعليمية متميزة."
        : ". Organizing information into distinct curated modules.",
      systemActive: language === "ar" ? "النظام نشط" : "System Active",
      overallProgress: language === "ar" ? "التقدم الإجمالي" : "Overall Progress",
      modulesComplete: language === "ar" ? "اكتمل {count} من أصل {total} من الوحدات" : "Completed {count} of {total} modules",
      ofUnits: language === "ar" ? "من الوحدات" : "of modules",
      curated: language === "ar" ? "مُنظم" : "Curated",
      success: language === "ar" ? "نجاح" : "Success",
      active: language === "ar" ? "نشط" : "Active",
      exploreModule: language === "ar" ? "استكشاف الوحدة" : "Explore Module",
      coordinating: language === "ar" ? "جاري التنسيق…" : "Coordinating…",
      efficiency: language === "ar" ? "كفاءة المعالجة" : "Processing Efficiency",
      estimatedTime: language === "ar" ? "الوقت المقدر" : "Estimated Time",
      min: language === "ar" ? "دقيقة" : "min",
      knowledgeBlocks: language === "ar" ? "كتل المعرفة" : "Knowledge Blocks",
      points: language === "ar" ? "نقطة" : "pts",
      coreIntelActive: language === "ar" ? "الذكاء الجوهري نشط" : "Core Intel Active",
      highPrecisionDesc: language === "ar"
        ? "بناء روابط عالية الدقة في بنية المفاهيم لتحقيق الإتقان الأمثل للمادة."
        : "Building high-precision links in Concept Architecture for optimal mastery.",
      analyzingNow: language === "ar" ? "جاري التنسيق والتحليل." : "Coordinating & Analyzing.",
      masterMaterialsDesc: language === "ar"
        ? "يتم الآن استخلاص موادك الدراسية وتحويلها إلى تجربة تعليمية متميزة وفريدة."
        : "Your study materials are being distilled into a premium, curated educational experience.",
      neuralSync: language === "ar" ? "المزامنة العصبية نشطة" : "Neural Sync Active",
      cancelOperation: language === "ar" ? "إلغاء العملية" : "Cancel Operation",
      stopping: language === "ar" ? "جاري الإيقاف..." : "Stopping...",
      statusMonitor: language === "ar" ? "لوحة المتابعة" : "Status Monitor"
    }
  };

  // Helper function to check if a section is loading
  const isSectionLoading = (section: "transcript" | "summary" | "conceptMap" | "quiz" | "slides" | "flashcards" | "formulas" | "medical" | "engineering") => {
    if (!lecture || lecture.status !== "processing") return false;
    const progress = lecture.progress || 0;

    switch (section) {
      case "transcript":
        return (progress < 40 || !lecture.transcript || lecture.transcript.length === 0);
      case "summary":
        return (progress < 60 || !lecture.summary || (typeof lecture.summary === 'string' ? lecture.summary.length === 0 : Array.isArray(lecture.summary) && lecture.summary.length === 0));
      case "conceptMap":
        return (progress < 65 || !lecture.conceptMap || lecture.conceptMap.length === 0);
      case "quiz":
        return (progress < 80 || !lecture.quiz_sets || !Object.values(lecture.quiz_sets).some(set => set.length > 0));
      case "slides":
        return (progress < 90 || !lecture.slides || lecture.slides.length === 0);
      case "flashcards":
        return (progress < 100 || !lecture.flashcards || lecture.flashcards.length === 0);
      case "formulas":
        return (lecture.status === "processing" && (!lecture.formulas || lecture.formulas.length === 0));
      case "medical":
        return (lecture.status === "processing" && !hasMedical);
      case "engineering":
        return (lecture.status === "processing" && !hasEngineering);
      default:
        return false;
    }
  };

  const SectionLoading = ({ section, icon: Icon }: { section: "transcript" | "summary" | "conceptMap" | "quiz" | "slides" | "flashcards" | "formulas" | "medical" | "engineering", icon: any }) => {
    const getProgress = () => {
      if (!lecture?.progress) return 0;
      const progress = lecture.progress;

      switch (section) {
        case "transcript":
          if (progress >= 40) return 100;
          return Math.min((progress / 40) * 100, 100);
        case "summary":
          if (progress < 40) return 0;
          if (progress >= 60) return 100;
          return Math.min(((progress - 40) / 20) * 100, 100);
        case "conceptMap":
          if (progress < 60) return 0;
          if (progress >= 70) return 100;
          return Math.min(((progress - 60) / 10) * 100, 100);
        case "quiz":
          if (progress < 70) return 0;
          if (progress >= 80) return 100;
          return Math.min(((progress - 70) / 10) * 100, 100);
        case "slides":
          if (progress < 80) return 0;
          if (progress >= 90) return 100;
          return Math.min(((progress - 80) / 10) * 100, 100);
        case "flashcards":
          if (progress < 90) return 0;
          if (progress >= 100) return 100;
          return Math.min(((progress - 90) / 10) * 100, 100);
        case "formulas":
          if (progress < 60) return 0;
          if (progress >= 80) return 100;
          return Math.min(((progress - 60) / 20) * 100, 100);
        case "medical":
          if (progress < 60) return 0;
          if (progress >= 80) return 100;
          return Math.min(((progress - 60) / 20) * 100, 100);
        case "engineering":
          if (progress < 60) return 0;
          if (progress >= 80) return 100;
          return Math.min(((progress - 60) / 20) * 100, 100);
        default:
          return 0;
      }
    };

    const progressValue = getProgress();

    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] space-y-10 p-12 bg-white rounded-[3.5rem] shadow-[0_40px_100px_rgba(240,90,34,0.03)] border-2 border-[#F05A22]/5 animate-in zoom-in-95 duration-700">
        <div className="relative group">
          <div className="absolute -inset-10 bg-[#F05A22]/10 rounded-full blur-[60px] animate-pulse"></div>
          <div className="relative w-32 h-32 bg-white border-2 border-[#F05A22]/10 rounded-[2.5rem] flex items-center justify-center shadow-2xl transition-transform duration-700 group-hover:scale-110">
            <Icon className="w-14 h-14 text-[#F05A22] animate-bounce duration-[2000ms]" />
          </div>
        </div>

        <div className="text-center space-y-4 max-w-md relative z-10">
          <h3 className="text-4xl font-black text-[#111827] tracking-tight">
             {t.loading[section]}
          </h3>
          <p className="text-lg text-[#111827]/40 font-bold leading-relaxed">
            {language === "ar" ? "يقوم الذكاء الاصطناعي بتنظيم المحتوى الخاص بك الآن..." : "Our AI is currently drafting your high-precision content..."}
          </p>
        </div>

        <div className="w-full max-w-sm space-y-5 relative z-10">
          <div className="h-2.5 w-full bg-[#111827]/5 rounded-full overflow-hidden p-0.5 border border-[#111827]/5 shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressValue}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-[#F05A22] rounded-full shadow-[0_0_20px_rgba(240,90,34,0.4)]"
            />
          </div>
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-black text-[#F05A22] uppercase tracking-[0.3em]">{Math.round(progressValue)}% {t.agentStatus.curated}</span>
            <span className="text-[10px] font-black text-[#111827]/20 uppercase tracking-[0.3em] animate-pulse">{language === "ar" ? "قيد المعالجة" : "IN PROGRESS"}</span>
          </div>
        </div>
      </div>
    );
  };

  const handleExportAll = async () => {
    if (!lecture) return;

    try {
      const contentText = [
        lecture.title,
        lecture.transcript,
        Array.isArray(lecture.summary) ? lecture.summary.join(" ") : lecture.summary || "",
        lecture.quiz_sets ? [
          ...(lecture.quiz_sets.easy || []),
          ...(lecture.quiz_sets.medium || []),
          ...(lecture.quiz_sets.hard || [])
        ].map((q: any) => q.text || "").join(" ") : "",
        lecture.slides?.map((s: any) => Array.isArray(s.content) ? s.content.join(" ") : s.content || "").join(" "),
      ].join(" ");
      const hasArabic = /[\u0600-\u06FF]/.test(contentText);
      const dir = hasArabic ? "rtl" : "ltr";
      const textAlign = hasArabic ? "right" : "left";

      const primaryColor = "#F05A22"; 
      const primaryDark = "#F05A22";
      const primaryLight = "#feecdc";
      const textColor = "#1a1a1a";
      const mutedBg = "#f8f9fa";
      const borderColor = "#e5e7eb";
      const successColor = "#059669";

      let htmlContent = `
        <div style="font-family: ${hasArabic ? "Tajawal, Arial, sans-serif" : "Arial, sans-serif"}; direction: ${dir}; color: ${textColor};">
          <div style="margin-bottom: 30px; padding-bottom: 15px; border-bottom: 3px solid ${primaryColor};">
            <h1 style="font-size: 24px; font-weight: bold; color: ${primaryColor}; margin: 0; text-align: ${textAlign};">
              ${lecture.title}
            </h1>
          </div>
      `;

      if (lecture.transcript) {
        htmlContent += `
          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 18px; font-weight: bold; color: ${primaryColor}; border-bottom: 2px solid ${primaryColor}; padding-bottom: 8px; margin-bottom: 15px; text-align: ${textAlign};">
              ${language === "ar" ? "📝 النص الكامل" : "📝 Transcript"}
            </h2>
            <div style="font-size: 12px; line-height: 1.8; text-align: justify; padding: 15px; background-color: ${mutedBg}; border-${hasArabic ? "right" : "left"}: 4px solid ${primaryColor}; border-radius: 8px;">
              ${lecture.transcript.replace(/\n/g, "<br>")}
            </div>
          </div>
        `;
      }

      if (lecture.summary) {
        htmlContent += `
          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 18px; font-weight: bold; color: ${primaryColor}; border-bottom: 2px solid ${primaryColor}; padding-bottom: 8px; margin-bottom: 15px; text-align: ${textAlign};">
              ${language === "ar" ? "📊 الملخص" : "📊 Summary"}
            </h2>
            <div style="font-size: 13px; line-height: 1.9; text-align: justify; padding: 15px; background-color: ${primaryLight}; border-${hasArabic ? "right" : "left"}: 4px solid ${primaryDark}; border-radius: 8px;">
        `;

        if (Array.isArray(lecture.summary)) {
          lecture.summary.forEach((item: string, index: number) => {
            htmlContent += `<div style="margin-bottom: 10px;">${index + 1}. ${item.replace(/\*\*(.+?)\*\*/g, `<strong style="color: ${primaryDark};">$1</strong>`)}</div>`;
          });
        } else if (typeof lecture.summary === "string") {
          htmlContent += lecture.summary.replace(/\*\*(.+?)\*\*/g, `<strong style="color: ${primaryDark};">$1</strong>`).replace(/\n/g, "<br>");
        }

        htmlContent += `</div></div>`;
      }

      if (lecture.quiz_sets) {
        htmlContent += `
          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 18px; font-weight: bold; color: ${primaryColor}; border-bottom: 2px solid ${primaryColor}; padding-bottom: 8px; margin-bottom: 15px; text-align: ${textAlign};">
              ${language === "ar" ? "❓ بنك الأسئلة الشامل" : "❓ Comprehensive Question Bank"}
            </h2>
        `;

        const allSets = [
          { name: language === "ar" ? "مستوى سهل" : "Easy", q: lecture.quiz_sets.easy || [] },
          { name: language === "ar" ? "مستوى متوسط" : "Medium", q: lecture.quiz_sets.medium || [] },
          { name: language === "ar" ? "مستوى متقدم" : "Hard", q: lecture.quiz_sets.hard || [] }
        ];

        allSets.forEach(set => {
          if (set.q.length === 0) return;
          htmlContent += `<h3 style="margin-top: 20px; color: ${primaryDark}; text-decoration: underline;">${set.name}</h3>`;
          set.q.forEach((q: any, index: number) => {
            const questionText = q.text || "";
            htmlContent += `
              <div style="margin-bottom: 15px; padding: 12px; background-color: ${mutedBg}; border-radius: 8px;">
                <div style="font-size: 13px; font-weight: bold; margin-bottom: 8px;">
                  ${index + 1}: ${questionText.replace(/\*\*(.+?)\*\*/g, `<strong>$1</strong>`)}
                </div>
            `;
            if (q.options && q.options.length > 0) {
              q.options.forEach((opt: string, optIndex: number) => {
                const isCorrect = optIndex === q.correctIndex;
                htmlContent += `
                  <div style="margin-bottom: 3px; font-size: 12px; ${isCorrect ? `color: ${successColor}; font-weight: bold;` : ""}">
                    ${String.fromCharCode(65 + optIndex)}. ${opt} ${isCorrect ? " ✓" : ""}
                  </div>
                `;
              });
            } else if (q.type === "open_ended") {
              htmlContent += `
                <div style="font-size: 12px; color: #6b7280; font-style: italic;">
                  ${language === "ar" ? "الكلمات المفتاحية المطلوبة:" : "Keywords matching:"} ${q.expected_keywords?.join(", ") || ""}
                </div>
              `;
            }
            htmlContent += `</div>`;
          });
        });
        htmlContent += `</div>`;
      }

      if (lecture.slides && lecture.slides.length > 0) {
        htmlContent += `
          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 18px; font-weight: bold; color: ${primaryColor}; border-bottom: 2px solid ${primaryColor}; padding-bottom: 8px; margin-bottom: 15px; text-align: ${textAlign};">
              ${language === "ar" ? "📊 الشرائح" : "📊 Slides"}
            </h2>
        `;
        lecture.slides.forEach((slide: any, index: number) => {
          const slideTitle = slide.title || `${language === "ar" ? "شريحة" : "Slide"} ${index + 1}`;
          const slideContent = Array.isArray(slide.content) ? slide.content : [slide.content || ""];
          htmlContent += `
            <div style="margin-bottom: 20px; padding: 15px; background-color: ${primaryLight}; border-radius: 8px; border-${hasArabic ? "right" : "left"}: 4px solid ${primaryDark};">
              <h3 style="font-size: 16px; font-weight: bold; color: ${primaryDark}; margin-bottom: 10px;">
                ${slideTitle}
              </h3>
              <div style="font-size: 13px; line-height: 1.8;">
                ${slideContent.map((item: string) => `<div style="margin-bottom: 5px;">• ${item}</div>`).join("")}
              </div>
            </div>
          `;
        });
        htmlContent += `</div>`;
      }
      htmlContent += `</div>`;

      const container = document.createElement("div");
      container.innerHTML = htmlContent;
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.width = "210mm";
      container.style.padding = "15mm";
      container.style.backgroundColor = "white";
      container.style.fontFamily = hasArabic ? "Tajawal, Arial, sans-serif" : "Arial, sans-serif";
      document.body.appendChild(container);

      await new Promise(resolve => setTimeout(resolve, 200));

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 794,
        windowHeight: container.scrollHeight,
      });

      document.body.removeChild(container);

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      const pdf = new jsPDF("p", "mm", "a4");
      const imgData = canvas.toDataURL("image/jpeg", 0.95);

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `${lecture.title.replace(/[^a-z0-9\u0600-\u06FF]/gi, "_")}_export.pdf`;
      pdf.save(fileName);

      toast({
        title: t.toast.exportSuccess,
        description: t.toast.exportSuccessDesc,
      });
    } catch (error: any) {
      console.error("Error exporting PDF:", error);
      toast({
        title: t.toast.exportFailed,
        description: error?.message || t.toast.exportFailedDesc,
        variant: "destructive",
      });
    }
  };

  const handleImageAnalysis = async (imgUrl: string) => {
    if (!lecture || !lecture.extractedImages) return;
    const imgIndex = lecture.extractedImages.findIndex(img => img.url === imgUrl);
    if (imgIndex === -1) return;
    toast({
      title: language === "ar" ? "جاري تحليل الصورة..." : "Analyzing Image...",
      description: language === "ar" ? "الذكاء الاصطناعي يقوم بقراءة محتوى الصورة." : "AI is reading the image content.",
    });
    try {
      const updatedImages = [...lecture.extractedImages];
      updatedImages[imgIndex] = { ...updatedImages[imgIndex], description: "Analyzing..." };
      const description = await analyzeImageWithAI(imgUrl, lecture.transcript || "");
      updatedImages[imgIndex] = { ...updatedImages[imgIndex], description };
      await updateLecture({
        lectureId: lecture.id,
        updates: { extractedImages: updatedImages }
      });
      toast({
        title: language === "ar" ? "نجح التحليل" : "Analysis Complete",
        description: language === "ar" ? "تم إضافة شرح الصورة." : "Image description added.",
      });
    } catch (e: any) {
      console.error("Image analysis failed:", e);
      toast({
        title: language === "ar" ? "فشل التحليل" : "Analysis Failed",
        description: e.message || "Could not analyze the image",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    if (!lecture) return;
    try {
      if (lecture.status === "processing") {
          await apiRequest("POST", `/api/lectures/${lectureId}/cancel`);
      }
      await apiRequest("DELETE", `/api/lectures/${lectureId}`);
      queryClient.invalidateQueries({ queryKey: ["/api/lectures"] });
      setLocation("/");
      toast({
        title: language === "ar" ? "نجاح" : "Success",
        description: language === "ar" ? "تم حذف المحاضرة بنجاح" : "Lecture deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: error.message || "Failed to delete lecture",
        variant: "destructive",
      });
    }
  };

  const handleStopProcessing = async () => {
    if (!lecture) return;
    try {
      await updateLecture({ lectureId: lecture.id, updates: { status: "failed" } });
      toast({ title: t.toast.stopProcessing, description: t.toast.stopProcessingDesc });
    } catch (err: any) {
      toast({ title: t.toast.error, description: err.message, variant: "destructive" });
    }
  };

  const handleReprocess = async () => {
    if (!lecture) return;
    if (!lecture.transcript || lecture.transcript.length < 100) {
      toast({ title: t.toast.cannotReprocess, description: t.toast.cannotReprocessDesc, variant: "destructive" });
      return;
    }
    try {
      toast({ title: t.toast.reprocessStarted, description: t.toast.reprocessStartedDesc });
      await updateLecture({ lectureId: lecture.id, updates: { status: "processing", progress: 40 } });
      const [summary, quiz, slides, flashcards, formulas, conceptMap, medical, engineering] = await Promise.allSettled([
        generateSummary(lecture.transcript, selectedModel),
        generateQuiz(lecture.transcript, selectedModel, "comprehensive", lecture.title),
        generateSlides(lecture.transcript, lecture.summary as any || lecture.title, lecture.extractedImages),
        generateFlashcards(lecture.transcript, selectedModel),
        extractMathFormulas(lecture.transcript, selectedModel),
        generateConceptMap(lecture.transcript, selectedModel),
        lecture.category === "medicine"
          ? generateMedicalInsights(lecture.transcript, selectedModel, lecture.geminiFileUri, lecture.geminiFileMimeType)
          : Promise.resolve(lecture.medical),
        lecture.category === "engineering"
          ? generateEngineeringInsights(lecture.transcript, selectedModel, lecture.geminiFileUri, lecture.geminiFileMimeType)
          : Promise.resolve(lecture.engineering),
      ]);
      await updateLecture({
        lectureId: lecture.id,
        updates: {
          status: "completed",
          progress: 100,
          summary: summary.status === "fulfilled" ? summary.value : lecture.summary,
          slides: slides.status === "fulfilled" ? slides.value : lecture.slides,
          flashcards: flashcards.status === "fulfilled" ? flashcards.value : lecture.flashcards,
          formulas: formulas.status === "fulfilled" ? (formulas.value as any) : lecture.formulas,
          conceptMap: conceptMap.status === "fulfilled" ? (conceptMap.value as any) : lecture.conceptMap,
          medical: medical.status === "fulfilled" ? (medical.value as any) : lecture.medical,
          engineering: engineering.status === "fulfilled" ? (engineering.value as any) : lecture.engineering,
        }
      });
      toast({ title: t.toast.reprocessComplete, description: t.toast.reprocessCompleteDesc });
    } catch (err: any) {
      toast({ title: t.toast.reprocessFailed, description: err.message, variant: "destructive" });
    }
  };

  const handleOpenInPopup = (tab: string) => {
    setPopupTab(tab);
    setPopupOpen(true);
  };

  const handleOpenInNewWindow = (tab: string) => {
    window.open(`${window.location.href}?tab=${tab}`, '_blank', 'noopener,noreferrer');
  };
  const isTaskComplete = (task: string) => {
    if (!lecture) return false;
    const isFullyDone = lecture.status === "completed";
    switch (task) {
      case 'transcript': return !!(lecture.transcript && lecture.transcript.length > 0);
      case 'summary':    return !!(lecture.summary && (typeof lecture.summary === 'string' ? lecture.summary.length > 0 : Array.isArray(lecture.summary) && lecture.summary.length > 0));
      case 'conceptMap': return !!(lecture.conceptMap && lecture.conceptMap.length > 0);
      // 'questions' is the field saved by useLectureProcessor, quiz_sets is legacy
      case 'quiz':       return !!(
                           (lecture as any).questions && (lecture as any).questions.length > 0
                         ) || !!(
                           lecture.quiz_sets && Object.values(lecture.quiz_sets).some((s: any) => Array.isArray(s) && s.length > 0)
                         );
      case 'slides':     return !!(lecture.slides && lecture.slides.length > 0);
      case 'flashcards': return !!(lecture.flashcards && lecture.flashcards.length > 0);
      case 'formulas':   return !!(lecture.formulas && lecture.formulas.length > 0) || isFullyDone;
      case 'medical':    return hasMedical || isFullyDone;
      case 'engineering':return hasEngineering || isFullyDone;
      case 'chat':       return !!(lecture.transcript && lecture.transcript.length > 0);
      case 'images':     return !!(lecture.extractedImages && lecture.extractedImages.length > 0) || isFullyDone;
      default:           return isFullyDone;
    }
  };


  if (isLoading) {
    return (
      <AppLayout currentTab={activeTab}>
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <Spinner className="w-8 h-8 text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!lecture) {
    return (
      <AppLayout currentTab={activeTab}>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] space-y-4">
          <h2 className="text-2xl font-black text-[#1d1d1f] dark:text-white">{t.notFound}</h2>
          <Button onClick={() => setLocation("/")}>{t.backToDashboard}</Button>
        </div>
      </AppLayout>
    );
  }

  const tasksInfo = [
    { key: 'transcript', icon: 'description', label: language === "ar" ? 'تفريغ النص' : 'Transcription', doneMsg: language === "ar" ? 'اكتمل استخراج النص بالكامل' : 'Full transcript extracted', pendingMsg: language === "ar" ? 'جاري استخراج النص من الصوت...' : 'Extracting text from audio...', tab: 'transcript' },
    { key: 'summary',    icon: 'summarize',   label: language === "ar" ? 'الملخص الذكي' : 'Smart Summary',    doneMsg: language === "ar" ? 'تم استخلاص النقاط الجوهرية' : 'Core insights distilled',       pendingMsg: language === "ar" ? 'تحليل المفاهيم الأساسية...' : 'Analyzing key concepts...',  tab: 'summary' },
    { key: 'conceptMap', icon: 'hub',          label: language === "ar" ? 'خريطة المفاهيم' : 'Concept Map',    doneMsg: language === "ar" ? 'تم إنشاء المخطط البصري' : 'Visual schema created',    pendingMsg: language === "ar" ? 'بناء خريطة الروابط...' : 'Building link map...',   tab: 'conceptMap' },
    { key: 'quiz',       icon: 'quiz',         label: language === "ar" ? 'الاختبارات' : 'Assessments',       doneMsg: language === "ar" ? 'الأسئلة جاهزة للمراجعة' : 'Questions ready for review',               pendingMsg: language === "ar" ? 'صياغة أسئلة التقييم...' : 'Formulating assessment questions...',        tab: 'quiz' },
    { key: 'slides',     icon: 'slideshow',    label: language === "ar" ? 'الشرائح' : 'Slides',     doneMsg: language === "ar" ? 'العرض التقديمي جاهز' : 'Presentation ready',            pendingMsg: language === "ar" ? 'تنسيق هيكل الشرائح...' : 'Structuring slide deck...',        tab: 'slides' },
    { key: 'formulas',   icon: 'functions',    label: language === "ar" ? 'المعادلات' : 'Formulas',   doneMsg: language === "ar" ? 'تم استخراج كافة المعادلات' : 'All equations extracted',     pendingMsg: language === "ar" ? 'استخراج لغة LaTeX...' : 'Extracting LaTeX syntax...',          tab: 'formulas' },
    { key: 'medical',    icon: 'medical_services', label: language === "ar" ? 'الرؤى الطبية' : 'Medical Insights', doneMsg: language === "ar" ? 'تم تحليل المحتوى الطبي' : 'Medical content analyzed', pendingMsg: language === "ar" ? 'تحليل المفاهيم الطبية...' : 'Analyzing medical content...', tab: 'medical' },
    { key: 'engineering', icon: 'memory', label: language === "ar" ? 'مختبر الهندسة' : 'Engineering Lab', doneMsg: language === "ar" ? 'تم تحليل المحتوى الهندسي' : 'Engineering content analyzed', pendingMsg: language === "ar" ? 'تحليل المحتوى الهندسي...' : 'Analyzing engineering content...', tab: 'engineering' },
    { key: 'flashcards', icon: 'style',        label: language === "ar" ? 'البطاقات' : 'Flashcards',    doneMsg: language === "ar" ? 'بطاقات التكرار المتباعد جاهزة' : 'Spaced repetition cards ready',               pendingMsg: language === "ar" ? 'إنشاء بطاقات الذاكرة...' : 'Generating memory cards...',         tab: 'flashcards' },
    { key: 'chat',       icon: 'smart_toy',    label: language === "ar" ? 'المنسق الأكاديمي' : 'AI Curator', doneMsg: language === "ar" ? 'جاهز للإجابة على استفساراتك' : 'Ready to answer all your questions', pendingMsg: language === "ar" ? 'تهيئة العقل المدبر...' : 'Initializing AI Agent...', tab: 'chat' },
    { key: 'images',     icon: 'image',        label: language === "ar" ? 'الصور' : 'Imagery',     doneMsg: language === "ar" ? 'تم استخراج الصور المساعدة' : 'Supporting images extracted',         pendingMsg: language === "ar" ? 'جاري المعالجة المرئية...' : 'Visual processing...',                   tab: 'images' },
  ];
  const visibleTasks = tasksInfo.filter(task => {
    if (task.key === 'formulas') {
      // If task is complete (either naturally or through lecture completion), only show if it has results
      if (isTaskComplete('formulas')) return hasFormulas;
      // If still pending, show only for subjects with real mathematical content
      return hasRealMathContent;
    }
    if (task.key === 'medical') {
      // Once done, only show if we actually extracted medical insights
      if (isTaskComplete('medical')) return hasMedical;
      // While pending, show only for medical-category lectures
      return isMedicalLecture;
    }
    if (task.key === 'engineering') {
      if (isTaskComplete('engineering')) return hasEngineering;
      return isEngineeringLecture;
    }
    if (task.key === 'images') {
      if (status === "completed") return !!(lecture.extractedImages && lecture.extractedImages.length > 0);
      return true;
    }
    if (task.key === 'slides') {
      return !isPresentation;
    }
    return true;
  });
  const completedCount = visibleTasks.filter(t => isTaskComplete(t.key)).length;
  const realProgress = Math.round((completedCount / visibleTasks.length) * 100);

  if (!forceShowContent) {
    return (
      <AppLayout currentTab={activeTab}>
        <main className="flex-1 p-6 lg:p-10 font-display bg-surface min-h-[calc(100vh-64px)] 2xl:min-h-screen">
          <div className={cn("mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-6 max-w-[1400px] mx-auto", isRTL ? "flex-row" : "flex-row")} dir={isRTL ? "rtl" : "ltr"}>
            <div className={isRTL ? "text-right" : "text-left"}>
              <span className="text-[#F05A22] font-black tracking-widest text-[10px] uppercase mb-3 block animate-[pulse_2s_ease-in-out_infinite] opacity-60">
                {t.agentStatus.systemStatus}
              </span>
              <h1 className="text-5xl lg:text-7xl font-black tracking-tight text-on-surface mb-6 font-headline leading-[1.1]">
                {t.agentStatus.intelAgent} — <br/><span className="text-[#F05A22]">{t.agentStatus.processing}</span>
              </h1>
              <p className="text-on-surface-variant max-w-2xl leading-relaxed text-xl font-medium">
                {t.agentStatus.agentDescription} <span className="font-black text-on-surface">"{lecture.title}"</span>{t.agentStatus.agentDescriptionEnd}
              </p>
            </div>
            <div className={cn("flex flex-col items-center sm:items-end gap-4", isRTL ? "flex-row" : "flex-row")}>

              <div className={cn("flex items-center gap-3 bg-surface-container-lowest px-6 py-3 rounded-full text-[#F05A22] font-black text-xs uppercase tracking-widest shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-outline-variant/30", isRTL ? "flex-row" : "flex-row")}>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F05A22] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#F05A22]"></span>
                </span>
                {t.agentStatus.systemActive}
              </div>
            </div>
          </div>

          <div className="max-w-[1400px] mx-auto">
                <div className="mb-10 bg-surface-container-lowest rounded-[3rem] p-8 md:p-10 border border-outline-variant/30 shadow-[0_20px_60px_rgba(0,0,0,0.03)]" dir={isRTL ? "rtl" : "ltr"}>
                  <div className={cn("flex items-center justify-between mb-5", isRTL ? "flex-row" : "flex-row")}>
                    <span className={cn("text-xs font-black text-on-surface-variant uppercase tracking-[0.15em]", isRTL ? "text-right" : "text-left")}>
                      {t.agentStatus.overallProgress} — <span className="text-[#F05A22] underline decoration-[#F05A22]/20 underline-offset-4">
                        {t.agentStatus.modulesComplete.replace('{count}', String(completedCount)).replace('{total}', String(tasksInfo.length))}
                      </span>
                    </span>
                    <span className="text-4xl font-black text-on-surface tabular-nums tracking-tighter">
                       <span className={cn("text-xl text-[#F05A22] opacity-40", isRTL ? "ml-1" : "mr-1")}>%</span>{realProgress}
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-low h-4 rounded-full overflow-hidden shadow-inner p-1">
                    <motion.div
                      className="bg-[#F05A22] h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round(realProgress)}%` }}
                      transition={{ duration: 1.5, ease: "circOut" }}
                    />
                  </div>
                </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {visibleTasks.map((task, idx) => {
                    const done = isTaskComplete(task.key);
                    const stepNum = String(idx + 1).padStart(2, '0');
                    return (
                      <div key={task.key} className={cn(
                        "rounded-[2.5rem] p-10 flex flex-col justify-between hover:shadow-[0_40px_80px_rgba(0,0,0,0.1)] transition-all duration-700 group relative overflow-hidden h-[340px] border",
                        done 
                          ? "bg-surface-container-lowest border-primary/20 shadow-[0_10px_40px_rgba(0,0,0,0.02)]" 
                          : "bg-surface-container-lowest/50 border-outline-variant/30 opacity-80"
                      )}>
                        <div className={cn("absolute -bottom-4 text-[120px] font-black text-on-surface/[0.03] select-none leading-none group-hover:text-primary/[0.05] transition-colors duration-700 group-hover:scale-110 group-hover:-rotate-6", isRTL ? "-left-4" : "-right-4")}>
                           {stepNum}
                        </div>
                        
                        <div className="absolute -top-16 -right-16 w-40 h-40 bg-primary/[0.03] rounded-full group-hover:scale-125 transition-transform duration-1000 ease-out" />
                        <div className="relative z-10">
                          <div className={cn("flex justify-between items-start mb-8", isRTL ? "flex-row" : "flex-row")}>
                            <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-700 group-hover:rotate-12",
                                done ? "bg-[#F05A22]/10 text-[#F05A22] shadow-lg shadow-[#F05A22]/10" : "bg-surface-container-low text-on-surface-variant/40"
                            )}>
                                <span className="material-symbols-outlined text-3xl">{task.icon}</span>
                            </div>
                            <div className={cn("flex flex-col gap-1", isRTL ? "items-end" : "items-start")}>
                                <span className={cn(
                                    "text-[9px] font-black uppercase tracking-[0.2em] transition-all",
                                    done ? "text-[#F05A22]" : "text-on-surface-variant/40"
                                )}>
                                  Step {stepNum}
                                </span>
                                <span className={cn(
                                    "text-[10px] font-black uppercase tracking-[0.1em] px-3 py-1 rounded-full",
                                    done ? "text-[#F05A22] bg-[#F05A22]/10" : "text-on-surface-variant/40 bg-surface-container-low"
                                )}>
                                  {done ? t.agentStatus.success : t.agentStatus.active}
                                </span>
                            </div>
                          </div>
                          <h3 className={cn("text-3xl font-black mb-3 text-[#111827] tracking-tight group-hover:text-[#F05A22] transition-colors", isRTL ? "text-right" : "text-left")}>{task.label}</h3>
                          <p className={cn("text-base text-[#111827]/80 font-bold leading-relaxed", isRTL ? "text-right" : "text-left")}>{done ? task.doneMsg : task.pendingMsg}</p>
                        </div>
                        <div className="mt-6 relative z-10">
                          {(done || ['quiz', 'transcript', 'chat'].includes(task.key)) ? (
                            <button
                              onClick={() => { setActiveTab(task.tab); setForceShowContent(true); }}
                              className={cn(
                                "w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-black/5",
                                done 
                                  ? "bg-on-surface text-white hover:bg-[#F05A22]" 
                                  : "bg-surface-container-low text-on-surface-variant/60 hover:bg-surface-container-high"
                              )}
                            >
                              {done ? t.agentStatus.exploreModule : (language === "ar" ? "فتح القسم" : "Open Section")} 
                              <span className={cn("material-symbols-outlined text-[14px]", isRTL ? "-rotate-90" : "rotate-0")}>
                                {done ? "north_east" : "open_in_new"}
                              </span>
                            </button>
                          ) : (
                            <div className={cn("flex items-center justify-center gap-3 text-xs font-black text-[#F05A22] uppercase tracking-[0.2em] animate-pulse", isRTL ? "flex-row" : "flex-row")}>
                              <span className="w-2 h-2 rounded-full bg-[#F05A22]" />
                              {t.agentStatus.coordinating}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

            <div className={cn("mt-16 flex flex-col xl:flex-row gap-8 items-stretch pb-20", isRTL ? "flex-row" : "flex-row")}>
              <div className="bg-surface-container-lowest rounded-[3rem] p-10 lg:p-14 flex-1 relative overflow-hidden border border-outline-variant/30 shadow-[0_20px_60px_rgba(0,0,0,0.03)]">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
                  <span className="material-symbols-outlined text-[#F05A22] text-[220px] leading-none select-none">analytics</span>
                </div>
                <div className={cn("relative z-10", isRTL ? "text-right" : "text-left")} dir={isRTL ? "rtl" : "ltr"}>
                  <h3 className="text-3xl font-black mb-12 text-on-surface font-headline tracking-tight">{t.agentStatus.efficiency}</h3>
                  <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-12 mb-12", isRTL ? "flex-row-reverse" : "flex-row")}>
                    <div className={isRTL ? "text-right" : "text-left"}>
                      <p className="text-on-surface-variant/50 font-black mb-3 tracking-[0.2em] uppercase text-[10px]">{t.agentStatus.estimatedTime}</p>
                      <p className={cn("text-6xl font-black text-[#F05A22] tracking-tighter tabular-nums flex items-baseline", isRTL ? "justify-end flex-row-reverse" : "justify-start flex-row")}>
                         <span className={cn("text-xs font-black uppercase tracking-[0.3em] text-on-surface-variant/30", isRTL ? "ml-2" : "mr-2")}>{t.agentStatus.min}</span> 0{Math.max(1, Math.round((100 - realProgress) / 20))}:{(realProgress) % 60 < 10 ? '0' : ''}{(realProgress) % 60}
                      </p>
                    </div>
                    <div className={isRTL ? "text-right" : "text-left"}>
                      <p className="text-on-surface-variant/50 font-black mb-3 tracking-[0.2em] uppercase text-[10px]">{t.agentStatus.knowledgeBlocks}</p>
                      <p className={cn("text-6xl font-black text-on-surface tracking-tighter tabular-nums opacity-80 flex items-baseline", isRTL ? "justify-end flex-row-reverse" : "justify-start flex-row")}>
                         <span className={cn("text-xs font-black uppercase tracking-[0.3em] text-on-surface-variant/30", isRTL ? "ml-2" : "mr-2")}>{t.agentStatus.points}</span> {Math.round((lecture.transcript?.length || 50000) / 4 / 1000)}k
                      </p>
                    </div>
                  </div>
                  <div className={cn("bg-white p-8 rounded-3xl border-2 border-[#F05A22]/10 flex flex-col sm:items-center gap-8 shadow-sm", isRTL ? "sm:flex-row-reverse" : "sm:flex-row")}>
                      <div className="w-1.5 h-16 bg-[#F05A22] rounded-full hidden sm:block shadow-[0_0_15px_rgba(232,93,26,0.2)]"></div>
                      <div className={isRTL ? "text-right" : "text-left"}>
                        <p className={cn("text-[10px] font-black uppercase tracking-[0.3em] text-[#F05A22] mb-2 flex items-center gap-2", isRTL ? "flex-row-reverse" : "flex-row")}>
                          <span className="sm:hidden w-2 h-2 rounded-full bg-[#F05A22] animate-pulse"></span>
                          {t.agentStatus.coreIntelActive}
                        </p>
                        <p className="text-lg text-[#111827] font-black leading-relaxed">
                          {t.agentStatus.highPrecisionDesc}
                        </p>
                      </div>
                  </div>
                </div>
              </div>

              <div className="w-full xl:w-[500px] bg-[#F05A22] p-10 lg:p-14 rounded-[3.5rem] text-white shadow-[0_30px_70px_rgba(232,93,26,0.3)] relative flex flex-col justify-between overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-[0.08] group-hover:scale-110 group-hover:rotate-12 transition-all duration-[2000ms]">
                   <span className="material-symbols-outlined text-white text-[240px] leading-none select-none">architecture</span>
                </div>
                
                <div className={cn("relative z-10 mb-10", isRTL ? "text-right" : "text-left")}>
                  <h3 className="text-5xl font-black mb-8 leading-[1.1] tracking-tight">{t.agentStatus.analyzingNow}</h3>
                  <p className="text-white/80 text-lg font-medium leading-relaxed">
                      {t.agentStatus.masterMaterialsDesc}
                  </p>
                </div>
                
                <div className="space-y-4 relative z-10 mt-auto">
                  <button 
                    onClick={handleReprocess}
                    className={cn("w-full flex items-center gap-6 bg-white/20 p-6 rounded-[2rem] border border-white/30 backdrop-blur-md group/item hover:bg-white/30 transition-all cursor-pointer active:scale-[0.98]", isRTL ? "flex-row-reverse" : "flex-row")}
                  >
                    <div className="bg-white p-4 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover/item:rotate-12">
                      <span className="material-symbols-outlined text-[#F05A22] text-2xl">auto_awesome</span>
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest text-white drop-shadow-sm">{t.agentStatus.neuralSync}</span>
                  </button>
                  
                   <button onClick={handleStopProcessing} disabled={isUpdating} className={cn("w-full mt-6 py-5 rounded-2xl bg-black/20 hover:bg-black/40 text-white font-black text-xs uppercase tracking-[0.25em] transition-all border border-white/10 shadow-lg active:scale-[0.98] flex items-center justify-center gap-3", isRTL ? "flex-row-reverse" : "flex-row")}>
                      <span className="material-symbols-outlined text-lg">stop_circle</span>
                      {isUpdating ? t.agentStatus.stopping : t.agentStatus.cancelOperation}
                    </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout currentTab={activeTab}>
      <div className="space-y-6 pb-20 pt-8 px-4 md:px-8 max-w-[1600px] mx-auto" dir={isRTL ? "rtl" : "ltr"}>
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 0.3 }}
        >
          <div className="mb-6">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              {lecture?.title || "Lecture Content"}
            </h1>
          </div>

          <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className={cn("flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-[#F05A22]/10 mb-8 gap-4", isRTL ? "flex-row" : "flex-row")}>
              <div className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setForceShowContent(false)}
                className={cn("shrink-0 rounded-xl border-2 border-[#F05A22]/30 text-[#F05A22] hover:bg-[#F05A22] hover:text-white font-black flex items-center gap-2 px-6 shadow-sm transition-all", isRTL ? "mr-4" : "ml-4")}
              >
                <span className="material-symbols-outlined text-sm">analytics</span>
                {language === "ar" ? "لوحة المتابعة" : "Status Monitor"}
              </Button>
            </div>

            <div className="min-h-[500px]">
              <TabsContent value="transcript" className="mt-0 animate-in fade-in-50 duration-300">
                {isSectionLoading("transcript") ? (
                  <SectionLoading section="transcript" icon={FileText} />
                ) : (
                  <TranscriptView text={lecture.transcript || "No transcript available."} title={lecture.title} images={lecture.extractedImages || []} transcriptChunks={lecture.transcriptChunks || []} />
                )}
              </TabsContent>

              <TabsContent value="summary" className="mt-0 animate-in fade-in-50 duration-300">
                {isSectionLoading("summary") ? (
                  <SectionLoading section="summary" icon={List} />
                ) : (
                  <SummaryView 
                    summary={lecture.summary || []} 
                    title={lecture.title} 
                    images={lecture.extractedImages || []} 
                    formulas={lecture.formulas || []}
                  />
                )}
              </TabsContent>

              <TabsContent value="conceptMap" className="mt-0 animate-in fade-in-50 duration-300">
                {isSectionLoading("conceptMap") ? (
                  <SectionLoading section="conceptMap" icon={BrainCircuit} />
                ) : (
                  <ConceptMapView mindmapCode={lecture.conceptMap} lectureId={lectureId} />
                )}
              </TabsContent>

              <TabsContent value="quiz" className="mt-0 animate-in fade-in-50 duration-300">
                {isSectionLoading("quiz") ? (
                  <SectionLoading section="quiz" icon={HelpCircle} />
                ) : (
                  <QuizView
                    questions={lecture.questions}
                    title={lecture.title}
                    lectureId={lecture.id}
                    transcript={lecture.transcript}
                    modelType={selectedModel}
                  />
                )}
              </TabsContent>

              {!isPresentation && (
                <TabsContent value="slides" className="mt-0 animate-in fade-in-50 duration-300">
                  {isSectionLoading("slides") ? (
                    <SectionLoading section="slides" icon={Presentation} />
                  ) : (
                    <SlidesView
                      slides={lecture.slides || []}
                      title={lecture.title}
                      transcript={lecture.transcript}
                      summary={lecture.summary}
                      lectureId={lecture.id}
                    />
                  )}
                </TabsContent>
              )}

              {hasFormulas && (
                <TabsContent value="formulas" className="mt-0 animate-in fade-in-50 duration-300">
                  {isSectionLoading("formulas") ? (
                    <SectionLoading section="formulas" icon={Sigma} />
                  ) : (
                    <FormulasView formulas={lecture.formulas || []} />
                  )}
                </TabsContent>
              )}

              {(hasMedical || isMedicalLecture) && (
                <TabsContent value="medical" className="mt-0 animate-in fade-in-50 duration-300">
                  {isSectionLoading("medical") ? (
                    <SectionLoading section="medical" icon={Stethoscope} />
                  ) : (
                    <MedicalInsightsView medical={lecture.medical || {}} lectureTitle={lecture.title} />
                  )}
                </TabsContent>
              )}

              {(hasEngineering || isEngineeringLecture) && (
                <TabsContent value="engineering" className="mt-0 animate-in fade-in-50 duration-300">
                  {isSectionLoading("engineering") ? (
                    <SectionLoading section="engineering" icon={CircuitBoard} />
                  ) : (
                    <EngineeringLabView engineering={lecture.engineering || {}} lectureTitle={lecture.title} />
                  )}
                </TabsContent>
              )}

              <TabsContent value="flashcards" className="mt-0 animate-in fade-in-50 duration-300">
                {isSectionLoading("flashcards") ? (
                  <SectionLoading section="flashcards" icon={Brain} />
                ) : (
                  <FlashcardsView flashcards={lecture.flashcards || []} />
                )}
              </TabsContent>

              <TabsContent value="images" className="mt-0 animate-in fade-in-50 duration-300">
                {(lecture.extractedImages && lecture.extractedImages.length > 0) ? (
                  <ImagesView
                    lectureId={lecture.id}
                    images={lecture.extractedImages}
                    onAnalysisRequested={handleImageAnalysis}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground bg-card rounded-lg border border-border">
                    <ImageIcon className="w-12 h-12 mb-4 text-muted" />
                    <h3 className="text-lg font-semibold mb-2">
                      {language === "ar" ? "لا توجد صور" : "No Images Found"}
                    </h3>
                    <p>
                      {language === "ar"
                        ? "لم يتم العثور على أي صور في هذا الملف، أو تعذر استخراجها."
                        : "No images were found in this document, or they could not be extracted."}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="nanobanana" className="mt-0 animate-in fade-in-50 duration-300">
                <NanoBananaView slides={lecture.slides || []} title={lecture.title} />
              </TabsContent>

              <TabsContent value="chat" className="mt-0 h-full border-none p-0 focus-visible:ring-0 overflow-hidden rounded-2xl shadow-sm">
                <AgentChatView
                  transcript={lecture.transcript || ""}
                  title={lecture.title}
                  lectureId={lecture.id}
                  mode={selectedModel}
                  sourceUrl={lecture.sourceUrl}
                  documentPageCount={lecture.documentPageCount || (Array.isArray(lecture.slides) && lecture.slides.length > 0 ? lecture.slides.length : undefined)}
                  userId={user?.uid}
                  lectureSourceType={lecture.sourceType}
                  relatedLectures={lectures
                    .filter(l => l.id !== lecture.id && l.status === "completed")
                    .map(l => ({
                      id: l.id,
                      title: l.title,
                      summary: l.summary,
                      category: l.category,
                      sourceType: l.sourceType,
                    }))
                  }
                />
              </TabsContent>
            </div>
          </Tabs>
        </motion.div>

        <Dialog open={popupOpen} onOpenChange={setPopupOpen}>
          <DialogContent className="max-w-5xl w-[95vw] h-[90vh] overflow-y-auto p-0 border-none bg-transparent">
            <div className="bg-background rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full border">
              <DialogHeader className="p-4 border-b bg-card">
                <DialogTitle className={cn("flex items-center gap-2", isRTL ? "flex-row-reverse" : "flex-row")}>
                  {popupTab === "transcript" && <><FileText className="w-5 h-5 text-[#F05A22]" /> {t.transcript}</>}
                  {popupTab === "summary" && <><List className="w-5 h-5 text-[#F05A22]" /> {t.summary}</>}
                  {popupTab === "conceptMap" && <><BrainCircuit className="w-5 h-5 text-[#F05A22]" /> {t.conceptMap}</>}
                  {popupTab === "quiz" && <><HelpCircle className="w-5 h-5 text-[#F05A22]" /> {t.quiz}</>}
                  {popupTab === "slides" && <><Presentation className="w-5 h-5 text-[#F05A22]" /> {t.slides}</>}
                  {popupTab === "formulas" && <><Sigma className="w-5 h-5 text-[#F05A22]" /> {t.formulas}</>}
                  {popupTab === "medical" && <><Stethoscope className="w-5 h-5 text-[#F05A22]" /> {t.medical}</>}
                  {popupTab === "engineering" && <><CircuitBoard className="w-5 h-5 text-[#F05A22]" /> {t.engineering}</>}
                  {popupTab === "flashcards" && <><Brain className="w-5 h-5 text-[#F05A22]" /> {t.cards}</>}
                  {popupTab === "images" && <><ImageIcon className="w-5 h-5 text-[#F05A22]" /> {t.images}</>}
                  {popupTab === "nanobanana" && <><Sparkles className="w-5 h-5 text-[#F05A22]" /> {language === "ar" ? "نانو بانانا" : "Nano Banana"}</>}
                  {popupTab === "chat" && <><Bot className="w-5 h-5 text-[#F05A22]" /> {t.chat}</>}
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto p-6 bg-background">
                {popupTab === "transcript" && (
                  <TranscriptView text={lecture.transcript || "No transcript available."} title={lecture.title} images={lecture.extractedImages || []} transcriptChunks={lecture.transcriptChunks || []} />
                )}
                {popupTab === "summary" && (
                  <SummaryView summary={lecture.summary || []} title={lecture.title} />
                )}
                {popupTab === "conceptMap" && (
                  <ConceptMapView mindmapCode={lecture.conceptMap} lectureId={lectureId} />
                )}
                {popupTab === "quiz" && (
                  <QuizView
                    questions={lecture.questions}
                    title={lecture.title}
                    lectureId={lecture.id}
                    transcript={lecture.transcript}
                    modelType={selectedModel}
                  />
                )}
                {popupTab === "slides" && (
                  <SlidesView
                    slides={lecture.slides || []}
                    title={lecture.title}
                    transcript={lecture.transcript}
                    summary={lecture.summary}
                    lectureId={lecture.id}
                  />
                )}
                {popupTab === "formulas" && (
                  <FormulasView formulas={lecture.formulas || []} />
                )}
                {popupTab === "medical" && (
                  <MedicalInsightsView medical={lecture.medical || {}} lectureTitle={lecture.title} />
                )}
                {popupTab === "engineering" && (
                  <EngineeringLabView engineering={lecture.engineering || {}} lectureTitle={lecture.title} />
                )}
                {popupTab === "flashcards" && (
                  <FlashcardsView flashcards={lecture.flashcards || []} />
                )}
                {popupTab === "images" && (
                  <ImagesView
                    lectureId={lecture.id}
                    images={(lecture.extractedImages || []) as any[]}
                    onAnalysisRequested={handleImageAnalysis}
                  />
                )}
                {popupTab === "nanobanana" && (
                  <NanoBananaView slides={lecture.slides || []} title={lecture.title} />
                )}
                {popupTab === "chat" && (
                  <AgentChatView
                    transcript={lecture.transcript || ""}
                    title={lecture.title}
                    lectureId={lecture.id}
                    mode={selectedModel}
                    sourceUrl={lecture.sourceUrl}
                    documentPageCount={lecture.documentPageCount || (Array.isArray(lecture.slides) && lecture.slides.length > 0 ? lecture.slides.length : undefined)}
                  />
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
