// Shared slide schema + theme types — used by BOTH the server PPTX renderer
// (react-dom/server) and the client live preview, so preview === export.

export type SlideType =
  | "intro"
  | "section"
  | "bullets"
  | "cards"
  | "process"
  | "timeline"
  | "stats"
  | "comparison"
  | "diagram"
  | "figure" // real extracted lecture image + AI explanation
  | "code" // code snippet + AI explanation
  | "quote"
  | "summary"
  | "content"; // legacy alias of "bullets"

export interface SlideVisual {
  type: "svg" | "mermaid";
  code: string;
  caption?: string;
}

export interface BulletItem {
  text: string;
  icon?: string; // lucide icon name hint
}

export interface SlideCard {
  icon?: string;
  title: string;
  text: string;
}

export interface SlideStep {
  title: string;
  text?: string;
}

export interface SlideStat {
  value: string;
  label: string;
}

export interface Slide {
  id?: number;
  type?: SlideType;
  title?: string;
  lead?: string; // one-line insight under the title
  subtitle?: string; // intro / section
  quote?: string; // quote
  // bullets / summary — accept rich items OR legacy string[]
  bullets?: (BulletItem | string)[];
  content?: string[]; // legacy plain bullets
  callout?: { label?: string; text: string };
  // cards
  cards?: SlideCard[];
  // process / timeline
  steps?: SlideStep[];
  // stats
  stats?: SlideStat[];
  // comparison
  left_label?: string;
  right_label?: string;
  left_points?: string[];
  right_points?: string[];
  // diagram
  visual?: SlideVisual;
  // figure — a real image extracted from the uploaded lecture
  imageUrl?: string; // resolved URL (http / /uploads / data:) of the real figure
  imageRef?: number; // transient: index into the AI-offered figures, mapped to imageUrl server-side
  // code
  code?: string;
  codeLanguage?: string;
  // meta
  speaker_notes?: string;
  direction?: "ltr" | "rtl";
  language?: "en" | "ar";
}

export interface SlideTheme {
  key: string;
  bg: string; // CSS background (may be a gradient)
  title: string;
  text: string;
  sub: string;
  card: string;
  cardBorder: string;
  dark: boolean;
}

// Normalize a bullet (rich or legacy string) to a consistent shape.
export function normalizeBullet(b: BulletItem | string): BulletItem {
  return typeof b === "string" ? { text: b } : { text: b?.text || "", icon: b?.icon };
}

// Get the bullets for a slide, accepting both the new and legacy fields.
export function slideBullets(s: Slide): BulletItem[] {
  const raw = (s.bullets && s.bullets.length ? s.bullets : s.content) || [];
  return raw.map(normalizeBullet).filter((b) => b.text);
}
