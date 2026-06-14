import { Slide } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Download,
  Presentation,
  Edit2,
  Save,
  X,
  Check,
  Sparkles,
  Palette,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect, useMemo, useRef } from "react";
import { downloadSlidesPptx, SlideTheme } from "@/lib/aiService";
import { SlideView, slidesCss, getSlideTheme, resolveAccent, SLIDE_W } from "@shared/slides";
import "katex/dist/katex.min.css";
import { useLectures } from "@/hooks/useLectures";
import { useAuth } from "@/contexts/AuthContext";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { TextWithMath } from "./MathRenderer";
import { motion, AnimatePresence } from "framer-motion";

interface SlidesViewProps {
  slides: Slide[];
  title?: string;
  transcript?: string;
  summary?: string | string[];
  lectureId?: string;
}

export function SlidesView({ slides, title, lectureId }: SlidesViewProps) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { updateLecture } = useLectures();

  const detectContentLanguage = useMemo(() => {
    if (!slides || slides.length === 0) return language;
    const allText = slides
      .map((slide) => `${slide.title} ${Array.isArray(slide.content) ? slide.content.join(" ") : ""}`)
      .join(" ");
    const hasArabic = /[؀-ۿ]/.test(allText);
    return hasArabic ? "ar" : language;
  }, [slides, language]);

  const contentDir = detectContentLanguage === "ar" ? "rtl" : "ltr";
  const contentTextAlign = detectContentLanguage === "ar" ? "right" : "left";
  const uiDir = language === "ar" ? "rtl" : "ltr";

  const [theme, setTheme] = useState<string>("clean_light");
  const [customColor, setCustomColor] = useState<string>("#4A90D9");
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState<number | null>(null);
  const [editedSlides, setEditedSlides] = useState<Slide[]>(slides);
  const [isSaving, setIsSaving] = useState(false);

  // Viewer state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setEditedSlides(slides);
  }, [slides]);

  // Keep current index within range when the deck changes
  useEffect(() => {
    setCurrentIndex((i) => Math.min(i, Math.max(0, editedSlides.length - 1)));
  }, [editedSlides.length]);

  const goPrev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const goNext = () => setCurrentIndex((i) => Math.min(editedSlides.length - 1, i + 1));

  // Keyboard navigation (disabled while editing)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFullscreen(false);
        return;
      }
      if (editingSlideId !== null) return;
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editedSlides.length, editingSlideId]);

  const defaultTitle = language === "ar" ? "شرائح المحاضرة" : "Lecture Slides";
  const displayTitle = title || defaultTitle;

  const t = {
    generatedSlides: language === "ar" ? "الشرائح المُنشأة" : "Generated Slides",
    downloadPPTX: language === "ar" ? "تحميل (.pptx)" : "Download (.pptx)",
    noSlides: language === "ar" ? "لا توجد شرائح متاحة" : "No slides available",
    selectThemeLabel: language === "ar" ? "اختر نمط العرض" : "Theme & Style",
    saved: language === "ar" ? "تم الحفظ" : "Saved",
    savedDesc: language === "ar" ? "تم حفظ التغييرات بنجاح." : "Changes saved successfully.",
    themeCount: language === "ar" ? "اختر من بين الأنماط الاحترافية" : "Choose a professional layout style",
    edit: language === "ar" ? "تعديل" : "Edit",
    save: language === "ar" ? "حفظ" : "Save",
    cancel: language === "ar" ? "إلغاء" : "Cancel",
    fullscreen: language === "ar" ? "ملء الشاشة" : "Fullscreen",
  };

  const themeConfig: Record<string, any> = {
    modern_dark: {
      label: language === "ar" ? "أسود ليلي" : "Midnight Black",
      defaultColor: "#FF1493", font: "Inter, sans-serif",
      colors: { bg: "bg-[#000000]", title: "text-[#FF1493]", text: "text-white" },
    },
    clean_light: {
      label: language === "ar" ? "أبيض ناصع" : "Pure White",
      defaultColor: "#DC2626", font: "Inter, sans-serif",
      colors: { bg: "bg-white", title: "text-[#DC2626]", text: "text-black" },
    },
    academic_blue: {
      label: language === "ar" ? "أزرق عميق" : "Deep Ocean",
      defaultColor: "#00FFFF", font: "Inter, sans-serif",
      colors: { bg: "bg-[#001529]", title: "text-[#00FFFF]", text: "text-white" },
    },
    midnight_gold: {
      label: language === "ar" ? "ذهبي فاخر" : "Luxury Gold",
      defaultColor: "#FFD700", font: "Inter, sans-serif",
      colors: { bg: "bg-[#000000]", title: "text-[#FFD700]", text: "text-white" },
    },
    vibrant_sunset: {
      label: language === "ar" ? "غروب برتقالي" : "Orange Sunset",
      defaultColor: "#FFFFFF", font: "Inter, sans-serif",
      colors: { bg: "bg-gradient-to-br from-red-600 to-orange-500", title: "text-white", text: "text-white" },
    },
    cyber_neon: {
      label: language === "ar" ? "سايبر نيون" : "Cyber Neon",
      defaultColor: "#00FF00", font: "Inter, sans-serif",
      colors: { bg: "bg-[#0a0a0a]", title: "text-[#00FF00]", text: "text-white" },
    },
    professional_gray: {
      label: language === "ar" ? "رمادي عملي" : "Soft Gray",
      defaultColor: "#DC2626", font: "Inter, sans-serif",
      colors: { bg: "bg-[#E5E7EB]", title: "text-[#DC2626]", text: "text-black" },
    },
    emerald_forest: {
      label: language === "ar" ? "غابة الزمرد" : "Emerald Forest",
      defaultColor: "#00FF00", font: "Inter, sans-serif",
      colors: { bg: "bg-[#001a00]", title: "text-[#00FF00]", text: "text-white" },
    },
  };

  const handleEditSlide = (slideId: number) => setEditingSlideId(slideId);
  const handleCancelEdit = () => {
    setEditingSlideId(null);
    setEditedSlides(slides);
  };

  const handleSaveSlide = async () => {
    if (!user?.uid || !lectureId) return;
    setIsSaving(true);
    try {
      await updateLecture({ lectureId, updates: { slides: editedSlides } });
      setEditingSlideId(null);
      toast({ title: t.saved, description: t.savedDesc });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateSlideTitle = (slideId: number, newTitle: string) => {
    setEditedSlides((prev) => prev.map((s) => (s.id === slideId ? { ...s, title: newTitle } : s)));
  };

  const handleUpdateSlideContent = (slideId: number, newRawText: string) => {
    setEditedSlides((prev) =>
      prev.map((s) => {
        if (s.id !== slideId) return s;
        const lines = newRawText.split("\n");
        if (s.type === "quote") return { ...s, quote: newRawText };
        if (s.type === "intro") return { ...s, subtitle: newRawText };
        if (s.type === "stats") {
          const newStats = lines.slice(0, 3).map((line) => {
            const [value, ...labelParts] = line.split(":");
            return { value: value?.trim() || "", label: labelParts.join(":")?.trim() || "" };
          });
          return { ...s, stats: newStats };
        }
        return { ...s, content: lines };
      }),
    );
  };

  const handleDownloadPPTX = async (format: "image" | "editable" | "hybrid" = "image") => {
    if (editedSlides.length === 0) return;
    setIsDownloading(true);
    try {
      await downloadSlidesPptx(editedSlides, theme as SlideTheme, displayTitle, customColor, { format });
      toast({
        title: language === "ar" ? "تم التحميل" : "Downloaded",
        description: format === "editable"
          ? (language === "ar" ? "نسخة نصية قابلة للتعديل." : "Editable text PowerPoint downloaded.")
          : format === "hybrid"
          ? (language === "ar" ? "تصميم + نص قابل للتعديل." : "Designed + editable text downloaded.")
          : (language === "ar" ? "نسخة التصميم (صور)." : "Designed (image) PowerPoint downloaded."),
      });
    } catch (error: any) {
      toast({ title: "Error", description: error?.message, variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const conf = themeConfig[theme] || themeConfig["clean_light"];
  const currentSlide = editedSlides[currentIndex];
  const isEditing = currentSlide ? editingSlideId === currentSlide.id : false;

  if (!editedSlides || editedSlides.length === 0) {
    return (
      <div className="rounded-3xl border border-border/40 bg-card p-16 text-center" dir={uiDir}>
        <div className="w-16 h-16 rounded-full bg-primary/10 grid place-items-center mx-auto mb-5 text-primary">
          <Presentation className="w-8 h-8" />
        </div>
        <p className="text-muted-foreground font-medium">{t.noSlides}</p>
      </div>
    );
  }

  const NavButton = ({ dir, onClick, disabled }: { dir: "prev" | "next"; onClick: () => void; disabled: boolean }) => {
    const isLeft = uiDir === "rtl" ? dir === "next" : dir === "prev";
    const Icon = isLeft ? ChevronLeft : ChevronRight;
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        aria-label={dir}
        className={cn(
          "absolute top-1/2 -translate-y-1/2 z-30 grid place-items-center h-11 w-11 rounded-full bg-background/90 backdrop-blur border border-border shadow-lg text-foreground hover:bg-primary hover:text-white hover:border-primary transition-all disabled:opacity-0 disabled:pointer-events-none",
          isLeft ? "left-2 sm:-left-5" : "right-2 sm:-right-5",
        )}
      >
        <Icon className="w-5 h-5" />
      </button>
    );
  };

  return (
    <div className="space-y-6" dir={uiDir}>
      {/* Header */}
      <div className={cn("flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4", uiDir === "rtl" && "sm:flex-row-reverse")}>
        <div className={cn("flex items-center gap-3", uiDir === "rtl" && "flex-row-reverse")}>
          <div className="p-2 rounded-xl bg-primary/10">
            <Presentation className="w-6 h-6 text-primary" />
          </div>
          <div className={uiDir === "rtl" ? "text-right" : "text-left"}>
            <h3 className="text-xl font-black tracking-tight leading-none">{t.generatedSlides}</h3>
            <p className="text-sm text-muted-foreground font-medium mt-1 line-clamp-1">{displayTitle}</p>
          </div>
        </div>
        <div className={cn("flex items-center gap-2", uiDir === "rtl" && "flex-row-reverse")}>
          <Button
            onClick={() => handleDownloadPPTX("image")}
            disabled={isDownloading || editedSlides.length === 0}
            className="rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 font-bold"
          >
            <Download className={cn("w-4 h-4", uiDir === "rtl" ? "ml-2" : "mr-2")} />
            {isDownloading ? "..." : (language === "ar" ? "تصميم (صور)" : "Designed")}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleDownloadPPTX("hybrid")}
            disabled={isDownloading || editedSlides.length === 0}
            className="rounded-xl transition-all active:scale-95 font-bold"
            title={language === "ar" ? "تصميم كامل مع نص قابل للتعديل في PowerPoint" : "Designed look with editable text on top"}
          >
            <Sparkles className={cn("w-4 h-4", uiDir === "rtl" ? "ml-2" : "mr-2")} />
            {language === "ar" ? "تصميم + تعديل" : "Designed + Editable"}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleDownloadPPTX("editable")}
            disabled={isDownloading || editedSlides.length === 0}
            className="rounded-xl transition-all active:scale-95 font-bold"
            title={language === "ar" ? "نسخة نصية قابلة للتعديل في PowerPoint" : "Editable native-text version"}
          >
            <Edit2 className={cn("w-4 h-4", uiDir === "rtl" ? "ml-2" : "mr-2")} />
            {language === "ar" ? "نص فقط" : "Text only"}
          </Button>
        </div>
      </div>

      {/* Theme Selector (collapsed by default) */}
      <Collapsible open={isThemeOpen} onOpenChange={setIsThemeOpen} className="border rounded-2xl bg-card shadow-sm overflow-hidden border-border/50">
        <CollapsibleTrigger className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
          <div className={cn("flex items-center gap-3", uiDir === "rtl" && "flex-row-reverse")}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 grid place-items-center text-white shadow">
              <Palette className="w-5 h-5" />
            </div>
            <div className={uiDir === "rtl" ? "text-right" : "text-left"}>
              <p className="font-bold text-sm">{t.selectThemeLabel}</p>
              <p className="text-xs text-muted-foreground">{conf.label}</p>
            </div>
          </div>
          <div className="p-1.5 rounded-full bg-muted">
            {isThemeOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="p-5 border-t border-border/50 bg-muted/5 space-y-5">
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {Object.entries(themeConfig).map(([key, c]: [any, any]) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className={cn(
                  "relative p-2 rounded-xl border-2 transition-all",
                  theme === key ? "border-primary bg-primary/5 shadow-lg scale-105" : "border-border hover:border-primary/40",
                )}
              >
                <div className={cn("aspect-video rounded-md p-2 flex flex-col justify-between mb-2 border shadow-inner", c.colors.bg)}>
                  <div className="w-full h-1 rounded-full" style={{ backgroundColor: theme === key ? customColor : "#ffffff60" }} />
                  <div className="space-y-1">
                    <div className="w-3/4 h-0.5 bg-current opacity-20 rounded-full" />
                    <div className="w-1/2 h-0.5 bg-current opacity-10 rounded-full" />
                  </div>
                </div>
                <p className="text-[8px] font-black uppercase tracking-wider text-center truncate">{c.label}</p>
                {theme === key && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-white rounded-full shadow grid place-items-center">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </button>
            ))}
          </div>
          <div className={cn("flex items-center gap-4 p-4 bg-muted/40 rounded-2xl border border-dashed border-border/60", uiDir === "rtl" && "flex-row-reverse")}>
            <div className="flex-1">
              <p className="text-sm font-bold">{language === "ar" ? "لون مميز" : "Accent color"}</p>
              <p className="text-xs text-muted-foreground">{language === "ar" ? "يُطبّق على العناصر التزيينية" : "Applied to decorative highlights"}</p>
            </div>
            <input
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="w-16 h-11 rounded-xl border-2 border-white cursor-pointer bg-transparent shadow"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* ---- Deck Viewer ---- */}
      <div className="relative max-w-4xl mx-auto w-full">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-border/10 aspect-[16/9] bg-card">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0"
            >
              <SlideCanvas
                slide={currentSlide}
                conf={conf}
                customColor={customColor}
                contentDir={contentDir}
                contentTextAlign={contentTextAlign}
                language={language}
                themeName={theme}
                isEditing={isEditing}
                onUpdateTitle={handleUpdateSlideTitle}
                onUpdateContent={handleUpdateSlideContent}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {!isEditing && (
          <>
            <NavButton dir="prev" onClick={goPrev} disabled={currentIndex === 0} />
            <NavButton dir="next" onClick={goNext} disabled={currentIndex === editedSlides.length - 1} />
          </>
        )}
      </div>

      {/* Controls */}
      <div className={cn("flex items-center justify-between gap-4 max-w-4xl mx-auto", uiDir === "rtl" && "flex-row-reverse")}>
        <span className="text-sm font-bold text-muted-foreground tabular-nums">
          {currentIndex + 1} / {editedSlides.length}
        </span>
        <div className={cn("flex gap-2", uiDir === "rtl" && "flex-row-reverse")}>
          {isEditing ? (
            <>
              <Button size="sm" onClick={handleSaveSlide} disabled={isSaving} className="rounded-xl font-bold gap-2">
                <Save className="w-4 h-4" /> {t.save}
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="rounded-xl font-bold gap-2">
                <X className="w-4 h-4" /> {t.cancel}
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => handleEditSlide(currentSlide.id)} className="rounded-xl border-2 font-bold gap-2">
                <Edit2 className="w-4 h-4" /> {t.edit}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsFullscreen(true)} className="rounded-xl border-2 font-bold gap-2">
                <Maximize2 className="w-4 h-4" /> <span className="hidden sm:inline">{t.fullscreen}</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar" dir={uiDir}>
        {editedSlides.map((s, i) => (
          <button
            key={s.id}
            onClick={() => editingSlideId === null && setCurrentIndex(i)}
            disabled={editingSlideId !== null}
            className={cn(
              "relative shrink-0 w-32 aspect-[16/9] rounded-lg overflow-hidden border-2 transition-all",
              i === currentIndex ? "border-primary ring-2 ring-primary/30 scale-[1.03]" : "border-border/40 opacity-60 hover:opacity-100",
              editingSlideId !== null && "cursor-not-allowed",
            )}
          >
            <div className={cn("w-full h-full p-2 flex flex-col text-left", conf.colors.bg)}>
              <div className="h-1 w-2/3 rounded-full mb-1.5 shrink-0" style={{ backgroundColor: customColor }} />
              <p className={cn("text-[7px] font-black leading-tight line-clamp-4", conf.colors.title)}>{s.title}</p>
            </div>
            <span className="absolute bottom-1 right-1 text-[8px] font-black text-white bg-black/50 rounded px-1 leading-tight">
              {i + 1}
            </span>
          </button>
        ))}
      </div>

      {/* Fullscreen overlay */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 sm:p-10"
            dir={uiDir}
          >
            <button
              onClick={() => setIsFullscreen(false)}
              aria-label="Close"
              className="absolute top-4 right-4 z-50 grid place-items-center h-11 w-11 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative w-full max-w-6xl">
              <div className="aspect-[16/9] rounded-xl overflow-hidden shadow-2xl">
                <SlideCanvas
                  slide={currentSlide}
                  conf={conf}
                  customColor={customColor}
                  contentDir={contentDir}
                  contentTextAlign={contentTextAlign}
                  language={language}
                  themeName={theme}
                  isEditing={false}
                  onUpdateTitle={handleUpdateSlideTitle}
                  onUpdateContent={handleUpdateSlideContent}
                />
              </div>
              <NavButton dir="prev" onClick={goPrev} disabled={currentIndex === 0} />
              <NavButton dir="next" onClick={goNext} disabled={currentIndex === editedSlides.length - 1} />
            </div>

            <span className="text-white/80 font-bold mt-5 tabular-nums">
              {currentIndex + 1} / {editedSlides.length}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface SlideCanvasProps {
  slide: Slide;
  conf: any;
  customColor: string;
  contentDir: "rtl" | "ltr";
  contentTextAlign: "left" | "right";
  language: string;
  themeName: string;
  isEditing: boolean;
  onUpdateTitle: (id: number, value: string) => void;
  onUpdateContent: (id: number, value: string) => void;
}

const SLIDE_FONTS_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Tajawal:wght@400;700;800&display=swap');";

// Preview canvas — renders the SAME shared <SlideView/> the server rasterizes for the
// PPTX (scaled to fit), so what you see is exactly what you get.
function SlideCanvas({
  slide,
  customColor,
  language,
  themeName,
  isEditing,
  onUpdateTitle,
  onUpdateContent,
}: SlideCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  const accent = resolveAccent(customColor);
  const css = useMemo(() => SLIDE_FONTS_IMPORT + slidesCss(getSlideTheme(themeName), accent), [themeName, accent]);

  // Scale the fixed 1280px slide down to the container width.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / SLIDE_W);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Upgrade any Mermaid diagram in the previewed slide.
  useEffect(() => {
    if (slide.visual?.type !== "mermaid" || !slideRef.current) return;
    let cancelled = false;
    import("mermaid").then((m) => {
      if (cancelled) return;
      const M = m.default;
      try {
        M.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "loose" });
        const nodes = slideRef.current?.querySelectorAll<HTMLElement>(".mermaid[data-slide-mermaid]");
        if (nodes && nodes.length) M.run({ nodes: Array.from(nodes) });
      } catch { /* leave raw on failure */ }
    });
    return () => { cancelled = true; };
  }, [slide]);

  if (isEditing) {
    const bulletText = (slide.bullets && slide.bullets.length
      ? slide.bullets.map((b: any) => (typeof b === "string" ? b : b?.text || "")).join("\n")
      : (slide.content || []).join("\n"));
    const editVal =
      slide.type === "quote" ? slide.quote || ""
      : slide.type === "intro" || slide.type === "section" ? slide.subtitle || ""
      : bulletText;
    return (
      <div className="w-full h-full flex flex-col gap-3 p-6 bg-card overflow-y-auto" dir={language === "ar" ? "rtl" : "ltr"}>
        <Input
          value={slide.title || ""}
          onChange={(e) => onUpdateTitle(slide.id!, e.target.value)}
          className="text-lg font-black h-12"
          placeholder={language === "ar" ? "العنوان" : "Title"}
        />
        <Textarea
          value={editVal}
          onChange={(e) => onUpdateContent(slide.id!, e.target.value)}
          className="flex-1 min-h-[160px] resize-none font-medium text-base p-4 leading-relaxed"
          placeholder={language === "ar" ? "المحتوى (سطر لكل نقطة)" : "Content (one line per point)"}
        />
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative w-full h-full overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div
        ref={slideRef}
        style={{ position: "absolute", top: 0, insetInlineStart: 0, transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        <div className="slide-root">
          <SlideView slide={slide as any} index={(slide.id ?? 1) - 1} themeName={themeName} />
        </div>
      </div>
    </div>
  );
}

// (legacy bespoke canvas removed — superseded by the shared <SlideView/>)
function _LegacySlideCanvasUnused({
  slide,
  conf,
  customColor,
  contentDir,
  contentTextAlign,
  language,
  themeName,
  isEditing,
  onUpdateTitle,
  onUpdateContent,
}: SlideCanvasProps) {
  return (
    <div className={cn("w-full h-full relative flex flex-col overflow-hidden", conf.colors.bg)} style={{ fontFamily: conf.font }}>
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 z-20" style={{ backgroundColor: customColor }} />

      <div className="absolute inset-0 flex flex-col justify-start items-stretch overflow-hidden">
        {/* Header title (content/structured slides only) */}
        {!isEditing && slide.type !== "intro" && slide.type !== "section" && (
          <div className="shrink-0 pt-8 px-8 md:px-12 z-20">
            <h4
              className={cn("text-xl md:text-2xl font-black mb-4 leading-tight tracking-tight border-b-2 pb-3", conf.colors.title)}
              style={{ borderColor: `${customColor}40` }}
            >
              <TextWithMath text={slide.title} />
            </h4>
          </div>
        )}

        {/* Editor title */}
        {isEditing && (
          <div className="shrink-0 pt-8 px-8 md:px-12 z-20">
            <Input
              value={slide.title}
              onChange={(e) => onUpdateTitle(slide.id, e.target.value)}
              className="text-xl font-black bg-white/10 border-2 rounded-xl h-12 px-4 w-full"
            />
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative px-8 md:px-12 flex flex-col justify-center min-h-0">
          {isEditing ? (
            <div className="my-4 flex-1">
              <Textarea
                value={
                  slide.type === "quote"
                    ? slide.quote || ""
                    : slide.type === "intro"
                      ? slide.subtitle || ""
                      : slide.type === "stats"
                        ? (slide.stats || []).map((st) => `${st.value}: ${st.label}`).join("\n")
                        : slide.content.join("\n")
                }
                onChange={(e) => onUpdateContent(slide.id, e.target.value)}
                className="w-full h-full min-h-[140px] resize-none bg-white/10 border-2 rounded-xl font-medium text-base p-4 leading-relaxed"
              />
            </div>
          ) : (
            <div className="w-full">
              {/* INTRO / SECTION */}
              {(slide.type === "intro" || slide.type === "section") && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-full text-center px-8">
                  {slide.type === "intro" && (
                    <h3 className={cn("text-3xl md:text-5xl font-black mb-4", conf.colors.title)}>
                      <TextWithMath text={slide.title} />
                    </h3>
                  )}
                  {!slide.content?.length && slide.type === "section" && (
                    <h3 className={cn("text-3xl md:text-5xl font-black", conf.colors.title)}>
                      <TextWithMath text={slide.title} />
                    </h3>
                  )}
                  {slide.subtitle && (
                    <p className={cn("text-lg md:text-2xl font-bold opacity-70", conf.colors.text)}>
                      <TextWithMath text={slide.subtitle} />
                    </p>
                  )}
                </motion.div>
              )}

              {/* QUOTE */}
              {slide.type === "quote" && slide.quote && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-8">
                  <p className={cn("text-xl md:text-3xl font-black italic leading-tight text-center px-8", conf.colors.text)} dir={contentDir}>
                    <span className="text-primary text-5xl block mb-3 opacity-50">"</span>
                    <TextWithMath text={slide.quote} />
                    <span className="text-primary text-5xl block mt-3 opacity-50">"</span>
                  </p>
                </motion.div>
              )}

              {/* STATS */}
              {slide.type === "stats" && slide.stats && (
                <div className="grid grid-cols-3 gap-4 py-4">
                  {slide.stats.slice(0, 3).map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white/5 rounded-2xl p-4 border-2 border-white/10 flex flex-col items-center justify-center text-center shadow-lg"
                    >
                      <span className="text-2xl md:text-4xl font-black text-primary mb-1 truncate w-full">{stat.value}</span>
                      <span className={cn("text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-60", conf.colors.text)}>{stat.label}</span>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* COMPARISON */}
              {slide.type === "comparison" && (
                <div className="grid grid-cols-2 gap-8 py-4 h-full items-start">
                  <div className="space-y-4 flex flex-col">
                    <h5 className="text-lg font-black uppercase tracking-widest text-primary border-b-2 border-primary/20 pb-2">{slide.left_label || "Side A"}</h5>
                    <ul className="space-y-3">
                      {(slide.left_points || []).map((pt, i) => (
                        <li key={i} className={cn("flex items-start gap-3 text-sm md:text-base font-medium", conf.colors.text)}>
                          <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ backgroundColor: customColor }} />
                          <TextWithMath text={pt} />
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-4 flex flex-col">
                    <h5 className="text-lg font-black uppercase tracking-widest text-primary border-b-2 border-primary/20 pb-2">{slide.right_label || "Side B"}</h5>
                    <ul className="space-y-3">
                      {(slide.right_points || []).map((pt, i) => (
                        <li key={i} className={cn("flex items-start gap-3 text-sm md:text-base font-medium", conf.colors.text)}>
                          <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ backgroundColor: customColor }} />
                          <TextWithMath text={pt} />
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* DEFAULT CONTENT / SUMMARY */}
              {(slide.type === "content" || slide.type === "summary" || !slide.type) && slide.content?.length > 0 && (
                <ul className={cn("font-medium m-0 p-0", conf.colors.text)} dir={contentDir} style={{ marginTop: 0, paddingTop: 0 }}>
                  {slide.content
                    .filter((item) => item.trim())
                    .map((item, i) => {
                      const totalChars = slide.content.join("").length;
                      const numBullets = slide.content.length;
                      const isSparse = numBullets <= 4 && totalChars < 250;
                      const isMedium = numBullets <= 8 && totalChars < 600;

                      const fontSize = isSparse ? "text-xl md:text-2xl" : isMedium ? "text-lg md:text-xl" : "text-base md:text-lg";
                      const gapSize = isSparse ? "gap-5" : isMedium ? "gap-4" : "gap-3";
                      const bulletSize = isSparse ? "w-3.5 h-3.5" : isMedium ? "w-3 h-3" : "w-2.5 h-2.5";
                      const leading = isSparse ? "leading-relaxed" : "leading-normal";
                      const dotMargin = isSparse ? "mt-3" : isMedium ? "mt-2.5" : "mt-2";
                      const itemPadding = isSparse ? "pt-6" : isMedium ? "pt-4" : "pt-3";

                      return (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: contentDir === "rtl" ? 10 : -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.02 }}
                          className={cn("flex items-start", gapSize)}
                          style={{ textAlign: contentTextAlign, marginTop: 0, paddingTop: itemPadding }}
                        >
                          <div className={cn("rounded-full shrink-0 shadow-sm", bulletSize, dotMargin)} style={{ backgroundColor: customColor }} />
                          <div className="flex-1 min-w-0">
                            <TextWithMath text={item} className={cn(fontSize, leading, conf.colors.text)} />
                          </div>
                        </motion.li>
                      );
                    })}
                </ul>
              )}

              {/* EMPTY */}
              {(!slide.type || slide.type === "content") && (!slide.content || slide.content.length === 0) && !slide.subtitle && !slide.quote && (
                <div className="text-center opacity-20">
                  <Presentation className="w-14 h-14 mx-auto mb-3" />
                  <p className="text-sm font-bold uppercase tracking-widest">{language === "ar" ? "لا يوجد محتوى إضافي" : "No additional content"}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer branding */}
        <div className={cn("shrink-0 pt-3 pb-4 px-8 md:px-12 z-30 border-t border-white/10", conf.colors.bg)}>
          <div className="flex justify-between items-center text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mix-blend-difference text-white">
            <span className="flex items-center gap-2"><Sparkles className="w-3 h-3 text-primary" /> LECTUREMATE AI</span>
            <span className="opacity-60">SLIDE {slide.id} — {themeName.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
