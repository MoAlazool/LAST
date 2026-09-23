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
import { createRequire } from "module";
import { SlideDeck, slidesCss, getSlideTheme, resolveAccent, FIT_SOURCE, SLIDE_W, SLIDE_H } from "@shared/slides";
import type { Slide } from "@shared/slides";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const requireFromHere = createRequire(import.meta.url);

// Asset paths must work both in dev (tsx: server/lib/slideRenderer.ts) and in the
// production bundle (dist/index.mjs, where __dirname is <app>/dist). A plain
// __dirname-relative path breaks in the bundle — fonts/KaTeX/Mermaid silently went
// missing, so the "Designed" export no longer matched the in-app preview.
function firstExisting(candidates: string[]): string | null {
  for (const c of candidates) {
    try { if (fs.existsSync(c)) return c; } catch { /* ignore */ }
  }
  return null;
}
function resolveModule(spec: string): string | null {
  try { return requireFromHere.resolve(spec); } catch { /* fall through */ }
  return firstExisting([path.join(process.cwd(), "node_modules", spec)]);
}

const FONT_DIR = firstExisting([
  path.join(process.cwd(), "server", "assets", "fonts"),
  path.join(__dirname, "..", "assets", "fonts"),          // dev: server/lib -> server/assets
  path.join(__dirname, "..", "server", "assets", "fonts"), // bundle: dist -> server/assets
]);
const KATEX_CSS = resolveModule("katex/dist/katex.min.css");
const MERMAID_JS = resolveModule("mermaid/dist/mermaid.min.js");

let warnedAssets = false;
function warnMissingAssets() {
  if (warnedAssets) return;
  warnedAssets = true;
  if (!FONT_DIR) console.warn("[slideRenderer] slide fonts directory not found — designed slides will use fallback fonts");
  if (!KATEX_CSS) console.warn("[slideRenderer] katex.min.css not found — math will render unstyled");
  if (!MERMAID_JS) console.warn("[slideRenderer] mermaid.min.js not found — diagrams will stay as source");
}

export { SLIDE_W, SLIDE_H };

const fontFace = (family: string, file: string, weight: string) => {
  if (!FONT_DIR) return "";
  const f = path.join(FONT_DIR, file);
  if (!fs.existsSync(f)) return "";
  return `@font-face{font-family:'${family}';src:url('file://${f}') format('truetype');font-weight:${weight};font-style:normal;font-display:block;}`;
};

// KaTeX CSS is inlined with its font URLs made absolute, so math renders exactly
// like the in-app preview regardless of the working directory.
let katexCssCache: string | null = null;
function katexCss(): string {
  if (katexCssCache !== null) return katexCssCache;
  katexCssCache = "";
  if (KATEX_CSS) {
    try {
      const dir = path.dirname(KATEX_CSS);
      katexCssCache = fs.readFileSync(KATEX_CSS, "utf-8")
        .replace(/url\((['"]?)fonts\//g, (_m, q) => `url(${q}file://${dir}/fonts/`);
    } catch { /* ignore */ }
  }
  return katexCssCache;
}

function headCss(themeName: string, accent: string): string {
  warnMissingAssets();
  const theme = getSlideTheme(themeName);
  return `
<style>${katexCss()}</style>
<style>
${fontFace("Plus Jakarta Sans", "PlusJakartaSans.ttf", "200 800")}
${fontFace("Tajawal", "Tajawal-Regular.ttf", "400")}
${fontFace("Tajawal", "Tajawal-Bold.ttf", "700")}
${fontFace("Tajawal", "Tajawal-ExtraBold.ttf", "800")}
${fontFace("Source Serif 4", "SourceSerif4.ttf", "200 900")}
${fontFace("Noto Naskh Arabic", "NotoNaskhArabic.ttf", "400 700")}
html,body{margin:0;padding:0;background:#222;}
${slidesCss(theme, accent)}
</style>`;
}

export function buildSlidesHtml(slides: Slide[], themeName: string, customColor?: string, deckTitle?: string): string {
  const accent = resolveAccent(customColor, getSlideTheme(themeName).accent);
  const markup = renderToStaticMarkup(
    React.createElement(SlideDeck, { slides: slides as Slide[], themeName, deckTitle }),
  );
  return `<!doctype html><html><head><meta charset="utf-8">${headCss(themeName, accent)}</head>
<body>${markup}</body></html>`;
}

const RENDER_TIMEOUT_MS = 90_000;

/**
 * Chrome for the headless render. Order: PUPPETEER_EXECUTABLE_PATH (containers) →
 * Puppeteer's own downloaded Chrome → a locally installed Chrome/Chromium/Edge.
 * Without the last step, a machine where Puppeteer's download was skipped could not
 * render at all, and every "Designed" export fell back to the plain text deck.
 */
function resolveChromePath(puppeteer: any): string | undefined {
  const envPath = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (envPath && fs.existsSync(envPath)) return envPath;
  try {
    const bundled = puppeteer.executablePath?.();
    if (bundled && fs.existsSync(bundled)) return bundled;
  } catch { /* not downloaded */ }
  const local = process.env.LOCALAPPDATA || "";
  const system = firstExisting([
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    local ? path.join(local, "Google", "Chrome", "Application", "chrome.exe") : "",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean));
  return system || envPath || undefined;
}

/**
 * Opens the deck HTML in headless Chromium, waits until it looks exactly like the
 * in-app preview (fonts loaded, images decoded, Mermaid upgraded), then hands the
 * page to `fn`. Always cleans up the browser and temp file.
 */
async function withSlidePage<T>(slides: Slide[], html: string, fn: (page: any) => Promise<T>): Promise<T> {
  const { default: puppeteer } = await import("puppeteer");

  // Inline the Mermaid UMD bundle only when a slide actually needs it.
  const hasMermaid = (slides || []).some((s: any) => s?.visual?.type === "mermaid" && s?.visual?.code);
  let mermaidScript = "";
  if (hasMermaid && MERMAID_JS) {
    try { mermaidScript = `<script>${fs.readFileSync(MERMAID_JS, "utf-8")}</script>`; } catch {}
  }
  if (mermaidScript) html = html.replace("</body>", `${mermaidScript}</body>`);

  const tmp = path.join(os.tmpdir(), `lm-slides-${Date.now()}-${Math.random().toString(36).slice(2)}.html`);
  fs.writeFileSync(tmp, html, "utf-8");

  let browser: any;
  try {
    browser = await puppeteer.launch({
      headless: "new" as any,
      executablePath: resolveChromePath(puppeteer),
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=none", "--allow-file-access-from-files"],
      timeout: RENDER_TIMEOUT_MS,
      protocolTimeout: RENDER_TIMEOUT_MS,
    });
    const page = await browser.newPage();
    page.setDefaultTimeout(RENDER_TIMEOUT_MS);
    await page.setViewport({ width: SLIDE_W, height: SLIDE_H, deviceScaleFactor: 2 });
    await page.goto("file://" + tmp, { waitUntil: "networkidle0", timeout: RENDER_TIMEOUT_MS });
    try { await page.evaluate(() => (document as any).fonts.ready); } catch {}
    // Make sure every figure image is decoded before we capture.
    try {
      await page.evaluate(() => Promise.all(Array.from(document.images).map((img) =>
        img.complete ? Promise.resolve() : img.decode().catch(() => undefined))));
    } catch {}

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

    // Fit every slide's content to its box — the same engine the web preview runs.
    try {
      await page.evaluate((src: string) => {
        const f = new Function("slide", src) as (el: Element) => string;
        document.querySelectorAll(".slide").forEach((el) => { try { f(el); } catch { /* keep as is */ } });
      }, FIT_SOURCE);
    } catch { /* never block the export */ }

    return await fn(page);
  } finally {
    if (browser) { try { await browser.close(); } catch {} }
    try { fs.unlinkSync(tmp); } catch {}
  }
}

/** Render every slide to a PNG buffer via headless Chromium — pixel-identical to the web preview. */
export async function renderSlidesToPngs(slides: Slide[], themeName: string, customColor?: string, deckTitle?: string): Promise<Buffer[]> {
  const html = buildSlidesHtml(slides, themeName, customColor, deckTitle);
  return withSlidePage(slides, html, async (page) => {
    const handles = await page.$$(".slide");
    const pngs: Buffer[] = [];
    for (const h of handles) {
      const buf = await h.screenshot({ type: "png" });
      pngs.push(Buffer.from(buf));
    }
    return pngs;
  });
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
  serif?: boolean;   // rendered with a serif face (academic headings) → use a serif PPTX font
}
export interface HybridSlide { bg: Buffer; texts: HybridTextBox[]; }

/**
 * Hybrid render: each slide's DESIGN (background, cards, accent shapes, icons,
 * diagrams, math) is captured as a PNG with the plain text made transparent, and
 * the text elements are measured so the caller can place native, EDITABLE PPTX
 * text boxes on top. Text containing KaTeX math is left in the image (not editable).
 */
export async function renderSlidesHybrid(slides: Slide[], themeName: string, customColor?: string, deckTitle?: string): Promise<HybridSlide[]> {
  let html = buildSlidesHtml(slides, themeName, customColor, deckTitle);
  // Hide flagged text in the captured background (layout unchanged → measured boxes still valid).
  html = html.replace("</head>", `<style>[data-hyb-hide]{color:transparent !important;}</style></head>`);
  return withSlidePage(slides, html, async (page) => {
    const handles = await page.$$(".slide");
    const out: HybridSlide[] = [];
    for (const h of handles) {
      // 1) measure + flag the editable text nodes (skip math/diagram text)
      const texts: HybridTextBox[] = await h.evaluate((slideEl: any) => {
        // Whether this slide is RTL/Arabic. For RTL the "Text only" export keeps every
        // line (even math) as raw editable text, so hybrid must do the same instead of
        // baking math lines into the image. LTR math stays a rendered image (prettier,
        // and what the editable export does for LTR too).
        const slideRtl = slideEl.classList.contains("ar") || getComputedStyle(slideEl).direction === "rtl";
        const sel = ".s-title, .s-lead, .s-hero-title, .s-hero-sub, .s-sec-title, .s-quote, .s-card h4, .s-card p, .s-step h4, .s-step p, .s-stat .val, .s-stat .lbl, .s-col .ch, .s-callout .lbl, .s-callout .txt, .s-def .term, .s-def .def, .s-table th, .s-table td, .s-swot .qh, .s-swot li, .s-chart .lab, .s-chart .val, .s-chart .cap, .s-eq .lbl, .s-eq .exp, .s-layers .lt, .s-layers .chip, .s-figure .cap";
        const nodes: Element[] = Array.from(slideEl.querySelectorAll(sel));
        slideEl.querySelectorAll(".s-bullets li, .s-col li").forEach((li: Element) => {
          const sp = li.querySelector("span:last-child");
          if (sp) nodes.push(sp);
        });
        const root = slideEl.getBoundingClientRect();
        const res: any[] = [];
        for (const n of nodes) {
          const hasMath = !!((n as any).querySelector && (n as any).querySelector(".katex"));
          if (hasMath && !slideRtl) continue; // LTR: leave rendered math in the image
          // For RTL math lines, reconstruct the ORIGINAL source by replacing each rendered
          // KaTeX subtree with its raw LaTeX (from the <annotation> KaTeX embeds), so the
          // line stays editable text — matching the "Text only" export. (Inline-only, no
          // named helper: a named function here would be esbuild-wrapped with __name and
          // break once puppeteer serializes this function into the browser.)
          let txt: string;
          if (hasMath) {
            const clone = (n as any).cloneNode(true);
            clone.querySelectorAll(".katex").forEach((k: any) => {
              const ann = k.querySelector('annotation[encoding="application/x-tex"]');
              k.replaceWith(document.createTextNode((ann ? ann.textContent : k.textContent) || ""));
            });
            txt = clone.textContent || "";
          } else {
            txt = n.textContent || "";
          }
          txt = txt.replace(/\s+/g, " ").trim();
          if (!txt) continue;
          // Measure the text itself (not the padded box) so the editable text box lands exactly
          // where the design shows it — table cells, chips and cards all have padding.
          const box = n.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(n);
          const tr = range.getBoundingClientRect();
          const r = tr.width > 2 && tr.height > 2
            ? { left: tr.left, top: tr.top, width: Math.min(tr.width + 6, box.right - tr.left), height: tr.height }
            : box;
          if (r.width < 4 || r.height < 4) continue;
          const cs = getComputedStyle(n as any);
          res.push({
            x: r.left - root.left, y: r.top - root.top, w: r.width, h: r.height,
            // the fit engine may have scaled the body with CSS zoom — use the rendered size
            text: txt, sizePx: (parseFloat(cs.fontSize) || 18) * (() => { let z = 1; for (let p: any = n; p && p !== slideEl; p = p.parentElement) z *= parseFloat(p.style?.zoom) || 1; return z; })(), color: cs.color || "rgb(0,0,0)",
            bold: (parseInt(cs.fontWeight, 10) || 400) >= 600,
            italic: cs.fontStyle === "italic",
            align: cs.textAlign === "right" ? "right" : cs.textAlign === "center" ? "center" : "left",
            rtl: cs.direction === "rtl",
            serif: /serif 4|georgia|times/i.test((cs.fontFamily || "").split(",")[0] || ""),
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
  });
}

/**
 * Layout validation for freshly generated slides: renders the deck with the real
 * renderer + fit engine and reports, per slide, whether the content fits
 * ("ok" | "tight" | "zoom") or still overflows ("overflow"). Used by the generator
 * to split or trim slides before they ever reach the user.
 */
export async function measureSlides(slides: Slide[], themeName = "clean_light"): Promise<string[]> {
  const html = buildSlidesHtml(slides, themeName);
  return withSlidePage(slides, html, async (page) =>
    page.evaluate(() => Array.from(document.querySelectorAll(".slide")).map((el) => el.getAttribute("data-fit") || "ok")),
  );
}
