// Features the user can pick before "Start Analysis". Each one maps to a separate
// AI call, so skipping a feature skips its tokens entirely. The transcript (and the
// cheap category classification) always run — every other feature depends on them.

export type AnalysisFeature =
  | "summary"
  | "flashcards"
  | "conceptMap"
  | "slides"
  | "formulas"
  | "quiz"
  | "insights";

export const ALL_ANALYSIS_FEATURES: AnalysisFeature[] = [
  "summary",
  "flashcards",
  "conceptMap",
  "slides",
  "formulas",
  "quiz",
  "insights",
];

export const DEFAULT_ANALYSIS_FEATURES: AnalysisFeature[] = ["summary", "flashcards"];

export const ANALYSIS_FEATURE_LABELS: Record<AnalysisFeature, { en: string; ar: string; descEn: string; descAr: string }> = {
  summary:    { en: "Summary", ar: "الملخص", descEn: "Structured summary of the key points", descAr: "ملخص منظم لأهم النقاط" },
  flashcards: { en: "Flashcards", ar: "البطاقات التعليمية", descEn: "Study cards for quick revision", descAr: "بطاقات للمراجعة السريعة" },
  conceptMap: { en: "Concept map", ar: "خريطة المفاهيم", descEn: "Visual map of how ideas connect", descAr: "خريطة بصرية لترابط الأفكار" },
  slides:     { en: "Slides", ar: "الشرائح", descEn: "Presentation slides you can download", descAr: "شرائح عرض قابلة للتحميل" },
  formulas:   { en: "Equations & formulas", ar: "المعادلات والقوانين", descEn: "Extracts the math and formulas", descAr: "استخراج المعادلات والقوانين" },
  quiz:       { en: "Quiz", ar: "الاختبار", descEn: "Pre-generate quiz questions (can also be made later)", descAr: "إنشاء أسئلة مسبقًا (يمكن إنشاؤها لاحقًا)" },
  insights:   { en: "Specialized insights", ar: "رؤى متخصصة", descEn: "Medical / engineering lab (only if the lecture fits)", descAr: "رؤى طبية / هندسية (إن كانت المحاضرة مناسبة)" },
};

const STORAGE_KEY = "lecturemate_analysis_features";

export function loadSavedAnalysisFeatures(): AnalysisFeature[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ANALYSIS_FEATURES;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return DEFAULT_ANALYSIS_FEATURES;
    return arr.filter((f): f is AnalysisFeature => ALL_ANALYSIS_FEATURES.includes(f));
  } catch {
    return DEFAULT_ANALYSIS_FEATURES;
  }
}

export function saveAnalysisFeatures(features: AnalysisFeature[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(features)); } catch { /* ignore */ }
}

/** Legacy lectures (no requestedFeatures stored) behave as if everything was requested. */
export function lectureRequested(requested: string[] | undefined | null, feature: AnalysisFeature): boolean {
  if (!requested) return true;
  return requested.includes(feature);
}
