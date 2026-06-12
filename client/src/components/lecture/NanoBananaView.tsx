import { useState } from "react";
import { Slide } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { downloadSlidesPptx } from "@/lib/aiService";
import { Sparkles, CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface NanoBananaViewProps {
  slides: Slide[];
  title?: string;
}

interface NanoTheme {
  id: string;
  name: string;
  nameAr: string;
  baseTheme: "clean" | "dark" | "academic" | "modern" | "tech" | "corporate" | "creative" | "eco";
  // Slide-thumbnail colors
  bg: string;        // slide background
  panel: string;     // right panel / accent area
  titleBar: string;  // title text color or title bar
  accent: string;    // bullet / line color
  // PPT generation config
  pptColor: string;
  visualStyle: string;
  layoutStyle: string;
}

// A mini slide preview rendered entirely in CSS — no images needed
function SlideThumbPreview({ theme, selected }: { theme: NanoTheme; selected: boolean }) {
  return (
    <div
      className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden transition-all duration-300"
      style={{ backgroundColor: theme.bg, border: `2px solid ${selected ? theme.accent : "transparent"}` }}
    >
      {/* Right accent panel (mimics split layout) */}
      <div
        className="absolute right-0 top-0 bottom-0 w-[38%]"
        style={{ backgroundColor: theme.panel }}
      />

      {/* Title bar */}
      <div
        className="absolute left-[8%] top-[18%] h-[12%] rounded-sm"
        style={{ width: "52%", backgroundColor: theme.titleBar, opacity: 0.9 }}
      />

      {/* Accent underline */}
      <div
        className="absolute left-[8%]"
        style={{ top: "32%", width: "20%", height: "3px", backgroundColor: theme.accent, borderRadius: 2 }}
      />

      {/* Body lines */}
      {[42, 52, 62, 72].map((top, i) => (
        <div
          key={i}
          className="absolute left-[8%] h-[5%] rounded-sm"
          style={{
            top: `${top}%`,
            width: `${i % 2 === 0 ? 46 : 38}%`,
            backgroundColor: theme.titleBar,
            opacity: 0.35
          }}
        />
      ))}

      {/* Selected check */}
      {selected && (
        <div
          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center shadow-lg"
          style={{ backgroundColor: theme.accent }}
        >
          <CheckCircle2 className="w-3 h-3 text-white" />
        </div>
      )}
    </div>
  );
}

export function NanoBananaView({ slides, title }: NanoBananaViewProps) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const uiDir = language === "ar" ? "rtl" : "ltr";

  const [selectedThemeId, setSelectedThemeId] = useState<string>("clean");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);

  // ── 5 spec themes (matches themes.py from spec) ──────────────────────
  const themes: NanoTheme[] = [
    {
      id: "clean",
      name: "Minimal",
      nameAr: "بسيط",
      baseTheme: "clean",
      bg: "#F8FAFC", panel: "#E2E8F0", titleBar: "#0F172A", accent: "#F05A22",
      pptColor: "#F05A22", visualStyle: "minimalist", layoutStyle: "side_by_side"
    },
    {
      id: "dark",
      name: "Midnight",
      nameAr: "داكن",
      baseTheme: "dark",
      bg: "#09090B", panel: "#1C1C1F", titleBar: "#FFFFFF", accent: "#8B5CF6",
      pptColor: "#8B5CF6", visualStyle: "photographic", layoutStyle: "side_by_side"
    },
    {
      id: "academic",
      name: "Classic Ivory",
      nameAr: "أكاديمي",
      baseTheme: "academic",
      bg: "#FFFBF0", panel: "#F3E8C8", titleBar: "#1E1B16", accent: "#B49454",
      pptColor: "#B49454", visualStyle: "photographic", layoutStyle: "side_by_side"
    },
    {
      id: "modern",
      name: "Vibrant Flow",
      nameAr: "عصري",
      baseTheme: "modern",
      bg: "#F0FDF4", panel: "#D1FAE5", titleBar: "#064E3B", accent: "#10B981",
      pptColor: "#10B981", visualStyle: "photographic", layoutStyle: "side_by_side"
    },
    {
      id: "tech",
      name: "Cyber Matrix",
      nameAr: "تقني",
      baseTheme: "tech",
      bg: "#0A0A0F", panel: "#1A1A2E", titleBar: "#00E5FF", accent: "#00E5FF",
      pptColor: "#00E5FF", visualStyle: "minimalist", layoutStyle: "side_by_side"
    },
    {
      id: "corporate",
      name: "Executive Blue",
      nameAr: "احترافي",
      baseTheme: "corporate",
      bg: "#F8FAFC", panel: "#E2E8F0", titleBar: "#1E293B", accent: "#2563EB",
      pptColor: "#2563EB", visualStyle: "minimalist", layoutStyle: "side_by_side"
    },
    {
      id: "creative",
      name: "Neon Pop",
      nameAr: "إبداعي",
      baseTheme: "creative",
      bg: "#FAFAF9", panel: "#F5F5F4", titleBar: "#1C1917", accent: "#D946EF",
      pptColor: "#D946EF", visualStyle: "minimalist", layoutStyle: "side_by_side"
    },
    {
      id: "eco",
      name: "Eco Green",
      nameAr: "طبيعي",
      baseTheme: "eco",
      bg: "#F0FDF4", panel: "#DCFCE7", titleBar: "#14532D", accent: "#16A34A",
      pptColor: "#16A34A", visualStyle: "minimalist", layoutStyle: "side_by_side"
    },
  ];

  const handleGenerate = async () => {
    if (!slides || slides.length === 0) {
      toast({ title: language === "ar" ? "لا توجد بيانات" : "No Data", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setGenerationStep(1);

    try {
      await new Promise(r => setTimeout(r, 900));
      setGenerationStep(2);
      await new Promise(r => setTimeout(r, 1100));
      setGenerationStep(3);

      await downloadSlidesPptx(
        slides,
        currentTheme.id as any, // spec theme key: modern_dark | clean_light | academic_blue | elegant_gray | green_nature
        title || "Nano Banana Presentation",
        currentTheme.pptColor,
        {
          nanobanana: true,
          visualStyle: currentTheme.visualStyle,
          layoutStyle: currentTheme.layoutStyle,
          nbBgColor: currentTheme.bg,
          nbPanelColor: currentTheme.panel,
          nbTitleColor: currentTheme.titleBar,
        }
      );

      setGenerationStep(4);
      await new Promise(r => setTimeout(r, 400));

      toast({ title: language === "ar" ? "تم التوليد" : "Success", description: "Your professional deck is ready." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
      setGenerationStep(0);
    }
  };

  const steps = [
    { num: 1, text: language === "ar" ? "تحليل طابع الثيم..." : "Analyzing theme..." },
    { num: 2, text: language === "ar" ? "جلب الصور من Pexels..." : "Sourcing images..." },
    { num: 3, text: language === "ar" ? "تطبيق التصميم النهائي..." : "Applying design..." },
    { num: 4, text: language === "ar" ? "تصدير الملف..." : "Exporting..." }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10 py-10 px-4" dir={uiDir}>

      {/* Header */}
      <div className={cn("space-y-3", uiDir === "rtl" ? "text-right" : "text-left")}>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-black uppercase tracking-[0.2em]">
          <Sparkles className="w-3 h-3" />
          Premium Themes
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          {language === "ar" ? "اختر مظهرك المفضل" : "Choose Your Look"}
        </h2>
        <p className="text-slate-500 text-sm font-medium max-w-lg">
          {language === "ar"
            ? "اختر ثيماً جاهزاً وسيقوم Nano Banana بتوليد عرضك مع صور ذكية."
            : "Pick a ready-made theme and Nano Banana will generate your deck with smart images."}
        </p>
      </div>

      {/* Theme Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {themes.map(theme => {
          const isSelected = selectedThemeId === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => setSelectedThemeId(theme.id)}
              className={cn(
                "group flex flex-col items-center gap-3 p-3 rounded-2xl border-2 transition-all duration-200 outline-none",
                isSelected
                  ? "border-slate-900 bg-slate-50 shadow-md scale-[1.04]"
                  : "border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm"
              )}
            >
              <SlideThumbPreview theme={theme} selected={isSelected} />
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest transition-colors",
                isSelected ? "text-slate-900" : "text-slate-400"
              )}>
                {language === "ar" ? theme.nameAr : theme.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Generate Button */}
      <div className="flex justify-center pt-4">
        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div
              key="gen"
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-slate-900 text-white rounded-[2rem] px-8 py-4 shadow-2xl flex items-center gap-6 min-w-[320px]"
            >
              <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-amber-400 animate-spin flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                  {language === "ar" ? "جاري العمل" : "Processing"}
                </span>
                <span className="text-sm font-bold">{steps[generationStep > 0 ? generationStep - 1 : 0].text}</span>
              </div>
              <div className="flex gap-1.5 ml-auto">
                {[1,2,3,4].map(s => (
                  <div
                    key={s}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-500",
                      generationStep >= s ? "bg-amber-400 w-5" : "bg-white/15 w-1.5"
                    )}
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="btn" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Button
                onClick={handleGenerate}
                className="h-16 px-10 rounded-[2rem] bg-slate-900 hover:bg-slate-800 text-white font-black text-lg shadow-2xl shadow-slate-900/30 border-b-4 border-slate-700 active:border-b-0 active:translate-y-0.5 transition-all flex items-center gap-3"
              >
                {language === "ar" ? "توليد باستخدام" : "Generate with"}
                <span style={{ color: currentTheme.accent }}>
                  {language === "ar" ? currentTheme.nameAr : currentTheme.name}
                </span>
                <ChevronRight className={cn("w-5 h-5", language === "ar" && "rotate-180")} />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
