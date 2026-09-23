import type { SlideTheme } from "./types";
import { SLIDE_W, SLIDE_H } from "./tokens";

// Hex (#rrggbb) -> "r,g,b" so we can build rgba() with opacity in CSS.
function rgb(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "74,144,217";
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

/**
 * The shared slide design-system CSS (no @font-face — each environment injects
 * its own fonts). Parameterized by the resolved accent + theme palette so the
 * exact same markup looks identical on the server (PPTX) and client (preview).
 */
export function slidesCss(theme: SlideTheme, accent: string): string {
  const a = accent;
  const ar = rgb(accent);
  const t = theme;
  const onAccent = "#FFFFFF";
  return `
.slide-root *{margin:0;padding:0;box-sizing:border-box;}
.slide{position:relative;width:${SLIDE_W}px;height:${SLIDE_H}px;overflow:hidden;display:flex;
  flex-direction:column;background:${t.bg};color:${t.text};
  font-family:${t.bodyFont || "'Plus Jakarta Sans','Tajawal','Segoe UI',system-ui,sans-serif"};
  font-feature-settings:"ss01","cv01";-webkit-font-smoothing:antialiased;}
.slide.ar{font-family:${t.arabicFont || "'Tajawal','Plus Jakarta Sans',sans-serif"};direction:rtl;}
.slide .topbar{height:8px;width:100%;flex:none;z-index:4;
  background:linear-gradient(90deg, ${a}, rgba(${ar},0.35));}
.slide .glow{position:absolute;width:620px;height:620px;border-radius:50%;
  background:radial-gradient(circle, rgba(${ar},0.12), transparent 68%);
  top:-230px;inset-inline-end:-150px;pointer-events:none;z-index:0;filter:blur(8px);}
.slide .glow2{position:absolute;width:420px;height:420px;border-radius:50%;
  background:radial-gradient(circle, rgba(${ar},0.06), transparent 70%);
  bottom:-200px;inset-inline-start:-120px;pointer-events:none;z-index:0;}
.s-body{flex:1;display:flex;flex-direction:column;padding:52px 76px 12px;position:relative;z-index:2;min-height:0;overflow:hidden;}
.s-body.center{justify-content:center;align-items:center;text-align:center;}
.slide.ar .s-body:not(.center){text-align:right;}
.s-footer{flex:none;display:flex;justify-content:space-between;align-items:center;
  padding:14px 76px 22px;font-size:12px;letter-spacing:3px;text-transform:uppercase;font-weight:700;
  opacity:.4;color:${t.sub};position:relative;z-index:2;}

/* Title block */
.s-head{margin-bottom:26px;}
.s-eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:800;
  letter-spacing:2px;text-transform:uppercase;color:${a};margin-bottom:12px;}
.s-title{font-size:44px;font-weight:800;line-height:1.12;letter-spacing:-0.5px;color:${t.title};}
.s-title .bar{display:block;width:64px;height:4px;border-radius:2px;margin-top:14px;background:${a};}
.slide.ar .s-title .bar{margin-inline-start:0;}
.s-lead{font-size:21px;font-weight:500;line-height:1.4;color:${t.sub};margin-top:12px;max-width:1000px;}

/* Bullets: plain accent markers by default; icon chips only when content supplied icons */
.s-mark{flex:none;width:9px;height:9px;border-radius:2px;background:${a};margin-top:0.6em;}
.s-txt{flex:1;min-width:0;overflow-wrap:anywhere;}
.s-bullets{list-style:none;display:flex;flex-direction:column;gap:20px;flex:1;justify-content:center;min-height:0;}
.s-bullets li{display:flex;align-items:flex-start;gap:18px;font-size:24px;line-height:1.4;font-weight:500;color:${t.text};}
/* RTL: direction:rtl on .slide.ar already places the icon on the right — no row-reverse */
.s-ico{flex:none;width:42px;height:42px;border-radius:13px;display:flex;align-items:center;justify-content:center;
  background:rgba(${ar},0.14);color:${a};box-shadow:0 0 0 1px rgba(${ar},0.22) inset;}
.s-ico svg{width:22px;height:22px;}
.s-bullets.dense li{font-size:20px;gap:14px;}
.s-bullets.dense .s-ico{width:36px;height:36px;border-radius:11px;}
.s-bullets.dense{gap:14px;}

/* Callout */
.s-callout{margin-top:22px;border-radius:18px;padding:20px 24px;display:flex;gap:16px;align-items:flex-start;
  background:rgba(${ar},0.1);border:1px solid rgba(${ar},0.28);}
.slide.ar .s-callout{text-align:right;}
.s-callout .s-ico{background:${a};color:${onAccent};box-shadow:none;}
.s-callout .lbl{font-size:13px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:${a};margin-bottom:4px;}
.s-callout .txt{font-size:19px;font-weight:600;line-height:1.4;color:${t.text};}

/* Card grid */
.s-cards{flex:1;display:grid;gap:22px;align-content:center;min-height:0;}
.s-cards.n2{grid-template-columns:repeat(2,1fr);}
.s-cards.n3{grid-template-columns:repeat(3,1fr);}
.s-cards.n4{grid-template-columns:repeat(2,1fr);}
.s-card{background:${t.card};border:1px solid ${t.cardBorder};border-radius:20px;padding:26px 24px;
  display:flex;flex-direction:column;gap:12px;box-shadow:0 10px 30px rgba(0,0,0,${t.dark ? "0.25" : "0.05"});}
.slide.ar .s-card{text-align:right;}
.s-card .s-ico{width:46px;height:46px;border-radius:14px;}
.s-card h4{font-size:22px;font-weight:800;color:${t.title};line-height:1.2;}
.s-card p{font-size:17px;font-weight:500;line-height:1.45;color:${t.sub};}

/* Process / timeline */
.s-steps{flex:1;display:flex;flex-direction:column;gap:13px;justify-content:center;min-height:0;}
.s-step{display:flex;align-items:flex-start;gap:18px;}
.slide.ar .s-step{text-align:right;}
.s-step .num{flex:none;width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-size:19px;font-weight:800;color:${onAccent};background:linear-gradient(135deg, ${a}, rgba(${ar},0.6));}
.s-step .sc{flex:1;background:${t.card};border:1px solid ${t.cardBorder};border-radius:14px;padding:12px 20px;}
.s-step h4{font-size:20px;font-weight:800;color:${t.title};margin-bottom:2px;}
.s-step p{font-size:16px;font-weight:500;color:${t.sub};line-height:1.38;}
/* tighten when many steps */
.s-steps:has(.s-step:nth-child(5)){gap:9px;}
.s-steps:has(.s-step:nth-child(5)) .s-step .sc{padding:9px 18px;}
.s-steps:has(.s-step:nth-child(5)) .s-step .num{width:38px;height:38px;font-size:17px;}

/* Stats */
.s-stats{flex:1;display:flex;gap:26px;align-items:center;justify-content:center;}
.s-stat{flex:1;max-width:330px;border-radius:24px;padding:40px 24px;text-align:center;
  background:${t.card};border:1px solid ${t.cardBorder};display:flex;flex-direction:column;align-items:center;gap:10px;
  box-shadow:0 10px 30px rgba(0,0,0,${t.dark ? "0.25" : "0.05"});}
.s-stat .val{font-size:64px;font-weight:800;line-height:1;color:${a};letter-spacing:-1px;}
.s-stat .lbl{font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${t.sub};}

/* Comparison */
/* columns share the height of the taller one, but the pair is only as tall as its content */
.s-cmp{display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:stretch;flex:none;margin-top:4px;}
.s-col{flex:1;background:${t.card};border:1px solid ${t.cardBorder};border-radius:20px;padding:24px 26px;
  display:flex;flex-direction:column;gap:14px;}
.slide.ar .s-col{text-align:right;}
.s-col .ch{font-size:21px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:${a};
  padding-bottom:12px;border-bottom:2px solid rgba(${ar},0.3);}
.s-col ul{list-style:none;display:flex;flex-direction:column;gap:13px;}
.s-col li{display:flex;align-items:flex-start;gap:12px;font-size:19px;line-height:1.35;font-weight:500;color:${t.text};}
.s-col li .d{flex:none;width:9px;height:9px;border-radius:50%;background:${a};margin-top:9px;}

/* Diagram */
.s-figure{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;min-height:0;}
.s-figure img,.s-figure svg{max-width:100%;max-height:430px;height:auto;}
.s-figure .cap{font-size:16px;font-weight:600;color:${t.sub};font-style:italic;}

/* Figure slide — real source image + explanation. The pane shrinks to the image, so a
   portrait screenshot gets full height and a wide figure gets up to ~58% of the width. */
.s-figrow{flex:1;display:flex;gap:40px;align-items:center;min-height:0;}
.s-figpane{flex:0 1 auto;max-width:58%;display:flex;align-items:center;justify-content:center;min-height:0;}
.s-figimg{display:block;max-width:100%;max-height:450px;width:auto;height:auto;object-fit:contain;border-radius:10px;
  background:${t.card};border:1px solid ${t.cardBorder};padding:6px;box-shadow:0 8px 24px rgba(0,0,0,${t.dark ? "0.30" : "0.08"});}
.s-figimg.solo{max-height:470px;}
.s-bullets.figbul{flex:1;gap:16px;min-width:0;}
.s-bullets.figbul li{font-size:21px;}

/* Code slide — always LTR monospace block. */
.s-code{flex:1;min-height:0;overflow:hidden;direction:ltr !important;text-align:left;
  background:${t.dark ? "rgba(0,0,0,0.32)" : "#0f172a"};color:#e2e8f0;border-radius:16px;
  border:1px solid rgba(${ar},0.4);border-inline-start:5px solid ${a};
  padding:22px 26px;margin-top:6px;font-size:18px;line-height:1.5;
  font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;
  white-space:pre-wrap;word-break:break-word;}
.s-code code{font-family:inherit;color:inherit;white-space:inherit;}

/* Hero / section / quote */
.s-hero-title{font-size:62px;font-weight:800;line-height:1.12;letter-spacing:-1.2px;color:${t.title};max-width:1040px;}
.s-hero-rule{width:150px;height:5px;border-radius:3px;margin:28px 0;background:linear-gradient(90deg, ${a}, rgba(${ar},0.4));}
.s-hero-sub{font-size:26px;font-weight:600;line-height:1.5;color:${t.sub};max-width:900px;}
.s-eyebrow.center{justify-content:center;}
.s-sec-title{font-size:58px;font-weight:800;letter-spacing:-1px;color:${t.title};max-width:1040px;}
.s-qmark{font-size:120px;line-height:.6;font-weight:800;color:${a};opacity:.3;}
.s-quote{font-size:38px;font-style:italic;font-weight:700;line-height:1.4;color:${t.title};max-width:1000px;margin-top:8px;}

.katex{font-size:1.03em;}
.slide .katex-display{margin:0;}
/* ── Math ── */
.s-math{white-space:nowrap;}
.s-math-block{display:block;margin:4px 0;padding:0.2em 0;max-width:100%;}
.s-math .katex,.s-math-block .katex{font-size:1.02em;}

/* ── Definition ── */
.s-def{flex:1;display:flex;flex-direction:column;justify-content:center;gap:18px;min-height:0;max-width:1040px;}
.s-def .term{font-size:34px;font-weight:800;color:${a};line-height:1.15;}
.s-def .def{font-size:26px;line-height:1.5;font-weight:500;color:${t.text};
  padding-inline-start:22px;border-inline-start:4px solid rgba(${ar},0.35);}
.s-def .s-bullets{flex:none;margin-top:6px;}

/* ── Table ── */
.s-tablewrap{flex:1;min-height:0;display:flex;align-items:center;}
.s-table{width:100%;border-collapse:collapse;font-size:19px;line-height:1.35;color:${t.text};}
.s-table th{text-align:start;font-weight:800;font-size:16px;letter-spacing:.3px;color:${t.title};
  padding:12px 16px;border-bottom:2px solid ${a};background:rgba(${ar},0.06);}
.s-table td{padding:11px 16px;border-bottom:1px solid ${t.cardBorder};vertical-align:top;}
.s-table tbody tr:nth-child(even) td{background:${t.dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"};}
.s-table.dense{font-size:16px;}
.s-table.dense th{font-size:14px;padding:9px 12px;}
.s-table.dense td{padding:8px 12px;}

/* ── SWOT ── */
.s-swot{flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:14px;}
.s-swot .q{border:1px solid ${t.cardBorder};border-radius:10px;padding:16px 20px;background:${t.card};
  display:flex;flex-direction:column;gap:8px;min-height:0;overflow:hidden;border-top:4px solid var(--qc);}
.s-swot .q-strengths{--qc:#15803D;} .s-swot .q-weaknesses{--qc:#B45309;}
.s-swot .q-opportunities{--qc:#1D4ED8;} .s-swot .q-threats{--qc:#B91C1C;}
.s-swot .qh{font-size:16px;font-weight:800;letter-spacing:.5px;color:var(--qc);text-transform:uppercase;}
.slide.ar .s-swot .qh{text-transform:none;letter-spacing:0;font-size:18px;}
.s-swot ul{list-style:disc;padding-inline-start:20px;display:flex;flex-direction:column;gap:5px;}
.s-swot li{font-size:17px;line-height:1.35;color:${t.text};}

/* ── Chart (horizontal bars keep long labels readable) ── */
.s-chart{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;gap:14px;}
.s-chart .row{display:grid;grid-template-columns:minmax(160px,30%) 1fr auto;align-items:center;gap:16px;}
.s-chart .lab{font-size:18px;font-weight:600;color:${t.text};line-height:1.25;}
.s-chart .track{height:26px;border-radius:4px;background:${t.dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"};overflow:hidden;}
.s-chart .fill{height:100%;background:${a};border-radius:4px;}
.s-chart .val{font-size:18px;font-weight:800;color:${t.title};min-width:64px;text-align:end;font-variant-numeric:tabular-nums;}
.s-chart .cap{font-size:15px;color:${t.sub};margin-top:6px;}

/* ── Equations ── */
.s-eqs{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;gap:18px;}
.s-eq{background:${t.card};border:1px solid ${t.cardBorder};border-radius:10px;padding:16px 26px;
  display:flex;flex-direction:column;gap:6px;min-width:0;}
.s-eq .lbl{font-size:15px;font-weight:800;letter-spacing:.4px;color:${a};}
.s-eq .math{font-size:30px;color:${t.title};text-align:center;}
.s-eqs.n3 .s-eq .math{font-size:24px;}
.s-eq .math .s-math-block{margin:2px 0;}
.s-eq .exp{font-size:18px;line-height:1.4;color:${t.sub};}

/* ── Layers (architecture / technology stack) ── */
.s-layers{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;gap:10px;}
.s-layers .layer{display:grid;grid-template-columns:220px 1fr;gap:18px;align-items:center;
  background:${t.card};border:1px solid ${t.cardBorder};border-radius:10px;padding:12px 18px;}
.s-layers .lt{font-size:18px;font-weight:800;color:${t.title};line-height:1.2;}
.s-layers .li{display:flex;flex-wrap:wrap;gap:8px;}
.s-layers .chip{font-size:16px;font-weight:600;padding:5px 12px;border-radius:6px;
  background:rgba(${ar},0.09);color:${t.text};border:1px solid rgba(${ar},0.18);}

/* bullets that follow a diagram/code block */
.s-bullets.after-fig{flex:none;margin-top:14px;justify-content:flex-start;}

/* ── Fit engine step (applied by fitSlide when content is too tall) ── */
.slide.fit-tight .s-head{margin-bottom:16px;}
.slide.fit-tight .s-bullets{gap:12px;}
.slide.fit-tight .s-steps{gap:8px;}
.slide.fit-tight .s-cards{gap:14px;}
.slide.fit-tight .s-card{padding:18px 18px;gap:8px;}
.slide.fit-tight .s-callout{margin-top:12px;padding:14px 18px;}

${t.variant === "academic" ? academicCss(t, a, ar) : ""}
`;
}

/**
 * Academic (university lecture) variant — same markup, restrained decoration:
 * no glows or gradients, serif headings, hairline rules, flat cards, small square
 * bullet markers, and a "lecture title · n / N" footer.
 */
function academicCss(t: SlideTheme, a: string, ar: string): string {
  const serif = t.headingFont || "Georgia,serif";
  return `
.slide{font-feature-settings:normal;}
.slide .glow,.slide .glow2{display:none;}
.slide .topbar{height:6px;background:${t.title};box-shadow:0 3px 0 ${a};margin-bottom:3px;}
.s-body{padding:50px 84px 10px;}
.s-head{margin-bottom:24px;padding-bottom:14px;border-bottom:1px solid ${t.cardBorder};}
.s-title{font-family:${serif};font-weight:700;font-size:42px;letter-spacing:-0.2px;line-height:1.15;}
.slide.ar .s-title,.slide.ar .s-hero-title,.slide.ar .s-sec-title{font-family:${t.arabicFont || serif};}
.s-title .bar{display:none;}
.s-lead{font-size:20px;font-weight:500;font-style:italic;color:${t.sub};}
.slide.ar .s-lead{font-style:normal;}
.s-eyebrow{color:${a};letter-spacing:2.5px;font-weight:700;}

/* Bullets: small accent square instead of icon chips */
.s-bullets{gap:18px;justify-content:flex-start;padding-top:6px;}
.s-bullets li{font-size:23px;font-weight:400;line-height:1.45;gap:18px;}
.s-bullets .s-ico{width:9px;height:9px;border-radius:1px;background:${a};box-shadow:none;margin-top:13px;}
.s-bullets .s-ico svg{display:none;}
.s-bullets.dense li{font-size:20px;}
.s-bullets.dense .s-ico{width:8px;height:8px;border-radius:1px;margin-top:11px;}

/* Callout: definition / theorem box */
.s-callout{border-radius:4px;background:#FFFFFF;border:1px solid ${t.cardBorder};border-inline-start:4px solid ${a};}
.s-callout .s-ico{display:none;}
.s-callout .lbl{font-family:${serif};font-style:italic;text-transform:none;letter-spacing:0;font-size:17px;font-weight:700;}
.s-callout .txt{font-weight:500;}

/* Cards, steps, stats, columns: flat, thin borders, no shadows */
.s-card,.s-stat,.s-col,.s-step .sc{border-radius:6px;box-shadow:none;background:${t.card};border:1px solid ${t.cardBorder};}
.s-card{border-top:3px solid ${t.title};}
.s-card .s-ico{width:38px;height:38px;border-radius:4px;background:rgba(${ar},0.08);box-shadow:none;}
.s-card h4,.s-step h4{font-family:${serif};font-weight:700;}
.s-card p,.s-step p{font-weight:400;}
.s-step .num{border-radius:4px;background:${t.title};font-family:${serif};font-weight:700;}
.s-stat .val{font-family:${serif};font-weight:700;color:${t.title};}
.s-stat .lbl{letter-spacing:1px;}
.s-col .ch{font-family:${serif};text-transform:none;letter-spacing:0;color:${t.title};border-bottom:2px solid ${a};}
.s-col li .d{border-radius:1px;width:8px;height:8px;}
.s-figimg{border-radius:4px;box-shadow:none;padding:6px;}
.s-figure .cap{font-family:${serif};}
.s-code{border-radius:4px;border:1px solid ${t.cardBorder};border-inline-start:4px solid ${a};}

/* Title / section / quote slides */
.s-hero-title{font-family:${serif};font-weight:700;font-size:58px;letter-spacing:-0.5px;}
.s-hero-rule{width:120px;height:2px;border-radius:0;background:${a};margin:26px 0;}
.s-hero-sub{font-weight:500;font-size:24px;}
.s-sec-title{font-family:${serif};font-weight:700;font-size:54px;letter-spacing:-0.3px;
  padding-bottom:18px;border-bottom:2px solid ${a};}
.s-qmark{font-family:${serif};opacity:.5;}
.s-quote{font-family:${serif};font-weight:500;}

/* Footer: lecture title + page number */
.s-footer{opacity:1;color:${t.sub};font-size:13px;letter-spacing:0.5px;text-transform:none;font-weight:500;
  margin:0 84px;padding:12px 0 20px;border-top:1px solid ${t.cardBorder};}
.s-foot-title{font-family:${serif};font-style:italic;max-width:900px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}
`;
}
