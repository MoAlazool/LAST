import { useEffect, useState } from "react";
import { AlignLeft, Layers, Network, Presentation, Sigma, ListChecks, Stethoscope, FileText, Lock, Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import {
  ALL_ANALYSIS_FEATURES,
  ANALYSIS_FEATURE_LABELS,
  loadSavedAnalysisFeatures,
  saveAnalysisFeatures,
  type AnalysisFeature,
} from "@/lib/analysisFeatures";

const ICONS: Record<AnalysisFeature, any> = {
  summary: AlignLeft,
  flashcards: Layers,
  conceptMap: Network,
  slides: Presentation,
  formulas: Sigma,
  quiz: ListChecks,
  insights: Stethoscope,
};

interface AnalysisOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (features: AnalysisFeature[]) => void;
  /** PPTX uploads are already a deck, so the Slides option is hidden for them. */
  hideSlides?: boolean;
}

/**
 * Shown when the user clicks "Start Analysis": pick exactly which AI outputs to
 * generate. Every unselected feature is a model call that never happens.
 */
export default function AnalysisOptionsDialog({ open, onOpenChange, onConfirm, hideSlides }: AnalysisOptionsDialogProps) {
  const { language, isRTL } = useLanguage();
  const ar = language === "ar";
  const [selected, setSelected] = useState<AnalysisFeature[]>(loadSavedAnalysisFeatures);

  // Re-read the saved choice each time the dialog opens.
  useEffect(() => {
    if (open) setSelected(loadSavedAnalysisFeatures());
  }, [open]);

  const options = ALL_ANALYSIS_FEATURES.filter((f) => !(hideSlides && f === "slides"));
  const chosen = selected.filter((f) => options.includes(f));

  const t = {
    title: ar ? "ماذا تريد أن نُنشئ؟" : "What should we generate?",
    desc: ar
      ? "اختر ما تحتاجه فقط — كل خيار غير محدد يوفّر وقتًا وتكلفة معالجة. يمكنك إنشاء أي جزء لاحقًا من صفحة المحاضرة."
      : "Pick only what you need — every option you skip saves processing time and tokens. You can generate anything later from the lecture page.",
    transcript: ar ? "النص الكامل / المحتوى المستخرج" : "Transcript / extracted text",
    always: ar ? "مطلوب دائمًا" : "Always included",
    selectAll: ar ? "تحديد الكل" : "Select all",
    clear: ar ? "مسح" : "Clear",
    selectedCount: ar ? `${chosen.length} محدد` : `${chosen.length} selected`,
    cancel: ar ? "إلغاء" : "Cancel",
    start: ar ? "ابدأ التحليل" : "Start Analysis",
    onlyTranscript: ar ? "سيتم استخراج النص فقط" : "Only the transcript will be extracted",
  };

  const toggle = (f: AnalysisFeature) =>
    setSelected((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  const confirm = () => {
    // Keep a hidden option's saved state untouched (e.g. Slides while uploading a PPTX).
    const toSave = hideSlides && selected.includes("slides") ? [...chosen, "slides" as const] : chosen;
    saveAnalysisFeatures(toSave);
    onConfirm(chosen);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={isRTL ? "rtl" : "ltr"} className="max-w-xl rounded-3xl p-0 overflow-hidden gap-0">
        <DialogHeader className={cn("px-6 pt-6 pb-4", isRTL && "text-right sm:text-right")}>
          <DialogTitle className="text-xl font-extrabold tracking-tight flex items-center gap-2">
            
            {t.title}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">{t.desc}</DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-2 max-h-[60vh] overflow-y-auto space-y-2">
          {/* Locked: transcript */}
          <div className="flex items-center gap-3 rounded-2xl border border-outline-variant/60 bg-surface-container-low px-4 py-3 opacity-80">
            <div className="grid place-items-center h-9 w-9 rounded-xl bg-primary/10 text-primary shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold">{t.transcript}</div>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              <Lock className="w-3 h-3" /> {t.always}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 pb-1">
            <span className="text-xs font-bold text-muted-foreground">{t.selectedCount}</span>
            <div className="flex gap-3 text-xs font-bold">
              <button type="button" className="text-primary hover:underline" onClick={() => setSelected(options)}>
                {t.selectAll}
              </button>
              <button type="button" className="text-muted-foreground hover:underline" onClick={() => setSelected([])}>
                {t.clear}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {options.map((f) => {
              const Icon = ICONS[f];
              const label = ANALYSIS_FEATURE_LABELS[f];
              const on = chosen.includes(f);
              return (
                <button
                  key={f}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => toggle(f)}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border px-4 py-3 transition-all",
                    isRTL ? "text-right" : "text-left",
                    on
                      ? "border-primary bg-primary/[0.06] shadow-sm"
                      : "border-outline-variant/60 hover:border-primary/50",
                  )}
                >
                  <div
                    className={cn(
                      "grid place-items-center h-9 w-9 rounded-xl shrink-0 transition-colors",
                      on ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant",
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold leading-tight">{ar ? label.ar : label.en}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{ar ? label.descAr : label.descEn}</div>
                  </div>
                  <div
                    className={cn(
                      "mt-0.5 grid place-items-center h-5 w-5 rounded-md border shrink-0",
                      on ? "bg-primary border-primary text-white" : "border-outline-variant",
                    )}
                  >
                    {on && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                  </div>
                </button>
              );
            })}
          </div>
          {chosen.length === 0 && (
            <p className="text-xs text-muted-foreground text-center pt-1">{t.onlyTranscript}</p>
          )}
        </div>

        <div className="flex gap-2 px-6 py-5 border-t border-outline-variant/40 mt-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex-1 py-3 rounded-2xl text-sm font-bold border border-outline-variant/60 hover:bg-surface-container-high transition-colors"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={confirm}
            className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-white bg-primary shadow-lg shadow-primary/20 active:scale-[0.99] transition-all"
          >
            
            {t.start}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
