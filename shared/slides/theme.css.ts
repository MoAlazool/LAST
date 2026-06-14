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
  font-family:'Plus Jakarta Sans','Tajawal','Segoe UI',system-ui,sans-serif;
  font-feature-settings:"ss01","cv01";-webkit-font-smoothing:antialiased;}
.slide.ar{font-family:'Tajawal','Plus Jakarta Sans',sans-serif;direction:rtl;}
.slide .topbar{height:8px;width:100%;flex:none;z-index:4;
  background:linear-gradient(90deg, ${a}, rgba(${ar},0.35));}
.slide .glow{position:absolute;width:620px;height:620px;border-radius:50%;
  background:radial-gradient(circle, rgba(${ar},0.22), transparent 68%);
  top:-230px;inset-inline-end:-150px;pointer-events:none;z-index:0;filter:blur(8px);}
.slide .glow2{position:absolute;width:420px;height:420px;border-radius:50%;
  background:radial-gradient(circle, rgba(${ar},0.12), transparent 70%);
  bottom:-200px;inset-inline-start:-120px;pointer-events:none;z-index:0;}
.s-body{flex:1;display:flex;flex-direction:column;padding:56px 76px 12px;position:relative;z-index:2;min-height:0;}
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
.s-title .bar{display:block;width:74px;height:5px;border-radius:3px;margin-top:16px;
  background:linear-gradient(90deg, ${a}, rgba(${ar},0.4));}
.slide.ar .s-title .bar{margin-inline-start:0;}
.s-lead{font-size:21px;font-weight:600;line-height:1.4;color:${t.sub};margin-top:14px;max-width:980px;}

/* Bullets with icon chips */
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
.s-cmp{display:flex;gap:28px;flex:1;align-items:stretch;}
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

/* Figure slide — real lecture image + explanation. flex row; RTL puts image on the right automatically. */
.s-figrow{flex:1;display:flex;gap:34px;align-items:center;min-height:0;}
.s-figpane{flex:0 0 48%;max-width:48%;display:flex;align-items:center;justify-content:center;min-height:0;}
.s-figimg{max-width:100%;max-height:420px;width:auto;height:auto;object-fit:contain;border-radius:16px;
  background:${t.card};border:1px solid ${t.cardBorder};padding:8px;box-shadow:0 12px 34px rgba(0,0,0,${t.dark ? "0.35" : "0.12"});}
.s-figimg.solo{max-height:440px;}
.s-bullets.figbul{flex:1;gap:16px;}
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
`;
}
