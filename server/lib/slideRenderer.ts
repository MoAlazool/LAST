/**
 * Renders lecture slides as fully-designed images by rendering the SHARED
 * React slide components (the same ones the in-app preview uses) to static
 * markup, then screenshotting each slide with headless Chromium (Puppeteer).
 * Equations render server-side via KaTeX; AI diagrams render as inline SVG or
 * (optionally) Mermaid upgraded in-page. The PPTX embeds one full-bleed image
 * per slide. Heavy deps (puppeteer) are imported lazily.
 */

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import path from "path";
import os from "os";
import fs from "fs";
import { fileURLToPath } from "url";
import { SlideDeck, slidesCss, getSlideTheme, resolveAccent, SLIDE_W, SLIDE_H } from "@shared/slides";
import type { Slide } from "@shared/slides";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const FONT_DIR = path.join(__dirname, "..", "assets", "fonts");
const KATEX_CSS = path.join(ROOT, "node_modules", "katex", "dist", "katex.min.css");
const MERMAID_JS = path.join(ROOT, "node_modules", "mermaid", "dist", "mermaid.min.js");

export { SLIDE_W, SLIDE_H };

const fontFace = (family: string, file: string, weight: string) =>
  `@font-face{font-family:'${family}';src:url('file://${path.join(FONT_DIR, file)}') format('truetype');font-weight:${weight};font-style:normal;font-display:block;}`;

function headCss(themeName: string, accent: string): string {
  const theme = getSlideTheme(themeName);
  return `
<link rel="stylesheet" href="file://${KATEX_CSS}">
<style>
${fontFace("Plus Jakarta Sans", "PlusJakartaSans.ttf", "200 800")}
${fontFace("Tajawal", "Tajawal-Regular.ttf", "400")}
${fontFace("Tajawal", "Tajawal-Bold.ttf", "700")}
${fontFace("Tajawal", "Tajawal-ExtraBold.ttf", "800")}
html,body{margin:0;padding:0;background:#222;}
${slidesCss(theme, accent)}
</style>`;
}

export function buildSlidesHtml(slides: Slide[], themeName: string, customColor?: string): string {
  const accent = resolveAccent(customColor);
  const markup = renderToStaticMarkup(
    React.createElement(SlideDeck, { slides: slides as Slide[], themeName }),
  );
  return `<!doctype html><html><head><meta charset="utf-8">${headCss(themeName, accent)}</head>
<body>${markup}</body></html>`;
}

/** Render every slide to a PNG buffer via headless Chromium. */
export async function renderSlidesToPngs(slides: Slide[], themeName: string, customColor?: string): Promise<Buffer[]> {
  const { default: puppeteer } = await import("puppeteer");

  // Inline the Mermaid UMD bundle only when a slide actually needs it.
  const hasMermaid = (slides || []).some((s: any) => s?.visual?.type === "mermaid" && s?.visual?.code);
  let mermaidScript = "";
  if (hasMermaid && fs.existsSync(MERMAID_JS)) {
    try { mermaidScript = `<script>${fs.readFileSync(MERMAID_JS, "utf-8")}</script>`; } catch {}
  }

  let html = buildSlidesHtml(slides, themeName, customColor);
  if (mermaidScript) html = html.replace("</body>", `${mermaidScript}</body>`);

  const tmp = path.join(os.tmpdir(), `lm-slides-${Date.now()}-${Math.random().toString(36).slice(2)}.html`);
  fs.writeFileSync(tmp, html, "utf-8");

  let browser: any;
  try {
    browser = await puppeteer.launch({
      headless: "new" as any,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=none"],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: SLIDE_W, height: SLIDE_H, deviceScaleFactor: 2 });
    await page.goto("file://" + tmp, { waitUntil: "networkidle0" });
    try { await page.evaluate(() => (document as any).fonts.ready); } catch {}

    if (mermaidScript) {
      try {
        await page.evaluate(async () => {
          const m = (window as any).mermaid;
          if (m) {
            m.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "loose" });
            await m.run({ querySelector: ".mermaid" });
          }
        });
        await new Promise((r) => setTimeout(r, 250));
      } catch { /* leave raw if mermaid fails — never block the deck */ }
    }

    const handles = await page.$$(".slide");
    const pngs: Buffer[] = [];
    for (const h of handles) {
      const buf = await h.screenshot({ type: "png" });
      pngs.push(Buffer.from(buf));
    }
    return pngs;
  } finally {
    if (browser) { try { await browser.close(); } catch {} }
    try { fs.unlinkSync(tmp); } catch {}
  }
}

export interface HybridTextBox {
  x: number; y: number; w: number; h: number; // pixels within the 1280x720 slide
  text: string;
  sizePx: number;
  color: string;     // rgb(...) computed
  bold: boolean;
  italic: boolean;
  align: "left" | "center" | "right";
  rtl: boolean;
}
export interface HybridSlide { bg: Buffer; texts: HybridTextBox[]; }

/**
 * Hybrid render: each slide's DESIGN (background, cards, accent shapes, icons,
 * diagrams, math) is captured as a PNG with the plain text made transparent, and
 * the text elements are measured so the caller can place native, EDITABLE PPTX
 * text boxes on top. Text containing KaTeX math is left in the image (not editable).
 */
export async function renderSlidesHybrid(slides: Slide[], themeName: string, customColor?: string): Promise<HybridSlide[]> {
  const { default: puppeteer } = await import("puppeteer");
  const hasMermaid = (slides || []).some((s: any) => s?.visual?.type === "mermaid" && s?.visual?.code);
  let mermaidScript = "";
  if (hasMermaid && fs.existsSync(MERMAID_JS)) {
    try { mermaidScript = `<script>${fs.readFileSync(MERMAID_JS, "utf-8")}</script>`; } catch {}
  }
  let html = buildSlidesHtml(slides, themeName, customColor);
  // Hide flagged text in the captured background (layout unchanged → measured boxes still valid).
  html = html.replace("</head>", `<style>[data-hyb-hide]{color:transparent !important;}</style></head>`);
  if (mermaidScript) html = html.replace("</body>", `${mermaidScript}</body>`);

  const tmp = path.join(os.tmpdir(), `lm-hyb-${Date.now()}-${Math.random().toString(36).slice(2)}.html`);
  fs.writeFileSync(tmp, html, "utf-8");

  let browser: any;
  try {
    browser = await puppeteer.launch({
      headless: "new" as any,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=none"],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: SLIDE_W, height: SLIDE_H, deviceScaleFactor: 2 });
    await page.goto("file://" + tmp, { waitUntil: "networkidle0" });
    try { await page.evaluate(() => (document as any).fonts.ready); } catch {}
    if (mermaidScript) {
      try {
        await page.evaluate(async () => {
          const m = (window as any).mermaid;
          if (m) { m.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "loose" }); await m.run({ querySelector: ".mermaid" }); }
        });
        await new Promise((r) => setTimeout(r, 250));
      } catch { /* noop */ }
    }

    const handles = await page.$$(".slide");
    const out: HybridSlide[] = [];
    for (const h of handles) {
      // 1) measure + flag the editable text nodes (skip math/diagram text)
      const texts: HybridTextBox[] = await h.evaluate((slideEl: any) => {
        const sel = ".s-title, .s-lead, .s-hero-title, .s-hero-sub, .s-sec-title, .s-quote, .s-card h4, .s-card p, .s-step h4, .s-step p, .s-stat .val, .s-stat .lbl, .s-col .ch, .s-callout .lbl, .s-callout .txt";
        const nodes: Element[] = Array.from(slideEl.querySelectorAll(sel));
        slideEl.querySelectorAll(".s-bullets li, .s-col li").forEach((li: Element) => {
          const sp = li.querySelector("span:last-child");
          if (sp) nodes.push(sp);
        });
        const root = slideEl.getBoundingClientRect();
        const res: any[] = [];
        for (const n of nodes) {
          if ((n as any).querySelector && (n as any).querySelector(".katex")) continue; // leave math in image
          const txt = (n.textContent || "").trim();
          if (!txt) continue;
          const r = n.getBoundingClientRect();
          if (r.width < 4 || r.height < 4) continue;
          const cs = getComputedStyle(n as any);
          res.push({
            x: r.left - root.left, y: r.top - root.top, w: r.width, h: r.height,
            text: txt, sizePx: parseFloat(cs.fontSize) || 18, color: cs.color || "rgb(0,0,0)",
            bold: (parseInt(cs.fontWeight, 10) || 400) >= 600,
            italic: cs.fontStyle === "italic",
            align: cs.textAlign === "right" ? "right" : cs.textAlign === "center" ? "center" : "left",
            rtl: cs.direction === "rtl",
          });
          (n as HTMLElement).setAttribute("data-hyb-hide", "1");
        }
        return res;
      });
      // 2) screenshot the design-only background (flagged text now transparent)
      const buf = await h.screenshot({ type: "png" });
      out.push({ bg: Buffer.from(buf), texts });
    }
    return out;
  } finally {
    if (browser) { try { await browser.close(); } catch {} }
    try { fs.unlinkSync(tmp); } catch {}
  }
}
