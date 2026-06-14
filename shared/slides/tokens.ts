import type { SlideTheme } from "./types";

// 8 theme palettes (ported from the server SPEC_THEMES / client themeConfig).
export const SLIDE_THEMES: Record<string, SlideTheme> = {
  modern_dark:       { key: "modern_dark",       bg: "#0A0A0F", title: "#FF1493", text: "#FFFFFF", sub: "#CBD5E1", card: "rgba(255,255,255,0.055)", cardBorder: "rgba(255,255,255,0.12)", dark: true },
  clean_light:       { key: "clean_light",       bg: "#FFFFFF", title: "#DC2626", text: "#0F172A", sub: "#64748B", card: "#F8FAFC", cardBorder: "#E2E8F0", dark: false },
  academic_blue:     { key: "academic_blue",     bg: "#001529", title: "#22D3EE", text: "#FFFFFF", sub: "#94A3B8", card: "rgba(255,255,255,0.05)", cardBorder: "rgba(255,255,255,0.13)", dark: true },
  midnight_gold:     { key: "midnight_gold",     bg: "#0A0A0A", title: "#FFD700", text: "#FFFFFF", sub: "#CBD5E1", card: "rgba(255,255,255,0.06)", cardBorder: "rgba(255,215,0,0.25)", dark: true },
  vibrant_sunset:    { key: "vibrant_sunset",    bg: "linear-gradient(135deg,#DC2626 0%,#F97316 100%)", title: "#FFFFFF", text: "#FFF7ED", sub: "#FFE4CC", card: "rgba(255,255,255,0.16)", cardBorder: "rgba(255,255,255,0.32)", dark: true },
  cyber_neon:        { key: "cyber_neon",        bg: "#08080C", title: "#00FF7F", text: "#FFFFFF", sub: "#94A3B8", card: "rgba(255,255,255,0.05)", cardBorder: "rgba(0,255,127,0.25)", dark: true },
  professional_gray: { key: "professional_gray", bg: "#EEF1F5", title: "#DC2626", text: "#0F172A", sub: "#64748B", card: "#FFFFFF", cardBorder: "#D8DEE6", dark: false },
  emerald_forest:    { key: "emerald_forest",    bg: "#00140A", title: "#34D399", text: "#FFFFFF", sub: "#94A3B8", card: "rgba(255,255,255,0.05)", cardBorder: "rgba(52,211,153,0.25)", dark: true },
};

const THEME_ALIAS: Record<string, string> = {
  clean: "clean_light", dark: "modern_dark", academic: "academic_blue",
  corporate: "professional_gray", eco: "emerald_forest", vibrant: "vibrant_sunset",
};

export function getSlideTheme(name?: string): SlideTheme {
  if (!name) return SLIDE_THEMES.clean_light;
  return SLIDE_THEMES[name] || SLIDE_THEMES[THEME_ALIAS[name]] || SLIDE_THEMES.clean_light;
}

export function resolveAccent(customColor?: string, fallback = "#4A90D9"): string {
  if (customColor && /^#?[0-9a-fA-F]{6}$/.test(customColor)) {
    return customColor.startsWith("#") ? customColor : "#" + customColor;
  }
  return fallback;
}

export const SLIDE_W = 1280;
export const SLIDE_H = 720;
