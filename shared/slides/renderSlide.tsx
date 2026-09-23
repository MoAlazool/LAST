import React from "react";
import type { Slide, SlideType, BulletItem } from "./types";
import { slideBullets } from "./types";
import { RichText } from "./Math";
import { SlideIcon, matchIcon } from "./icons";
import { SlideDiagram } from "./Diagram";
import { getSlideTheme } from "./tokens";

const AR_RE = /[؀-ۿݐ-ݿࢠ-ࣿ]/;
function slideIsArabic(s: Slide): boolean {
  const text = [
    s.title, s.subtitle, s.quote, s.lead, s.left_label, s.right_label, s.term, s.definition,
    ...slideBullets(s).map((b) => b.text),
    ...(s.left_points || []), ...(s.right_points || []),
    ...(s.cards || []).flatMap((c) => [c.title, c.text]),
    ...(s.steps || []).flatMap((st) => [st.title, st.text]),
    ...(s.stats || []).flatMap((x) => [x?.value, x?.label]),
    ...(s.table?.columns || []),
    ...(s.layers || []).map((l) => l.title),
  ].filter(Boolean).join(" ");
  if (s.direction === "rtl") return true;
  if (s.language === "ar") return true;
  return AR_RE.test(text);
}

function Head({ s }: { s: Slide }) {
  return (
    <div className="s-head">
      <h2 className="s-title">
        <RichText text={s.title} inline />
        <span className="bar" />
      </h2>
      {s.lead ? <p className="s-lead"><RichText text={s.lead} inline /></p> : null}
    </div>
  );
}

function Footer({ index, themeName, total, deckTitle }: { index: number; themeName: string; total?: number; deckTitle?: string }) {
  // Academic theme: lecture title + page number, like a university lecture deck.
  if (getSlideTheme(themeName).variant === "academic") {
    return (
      <div className="s-footer">
        <span className="s-foot-title">{deckTitle || ""}</span>
        <span>{index + 1}{total ? ` / ${total}` : ""}</span>
      </div>
    );
  }
  return (
    <div className="s-footer">
      <span>LectureMate</span>
      <span>{index + 1}{total ? ` / ${total}` : ""}</span>
    </div>
  );
}

/**
 * A bullet list. Icons are shown only when the content supplied a meaningful one;
 * otherwise a plain marker — so decks don't turn into rows of identical icon chips.
 */
function BulletList({ bullets, className = "" }: { bullets: BulletItem[]; className?: string }) {
  const withIcons = bullets.some((b) => matchIcon(b.icon));
  return (
    <ul className={`s-bullets ${withIcons ? "has-ico" : "plain"} ${className}`}>
      {bullets.map((b, i) => (
        <li key={i}>
          {withIcons
            ? <span className="s-ico"><SlideIcon name={b.icon} size={20} /></span>
            : <span className="s-mark" aria-hidden />}
          <span className="s-txt"><RichText text={b.text} inline /></span>
        </li>
      ))}
    </ul>
  );
}

const SWOT_LABELS = {
  en: { strengths: "Strengths", weaknesses: "Weaknesses", opportunities: "Opportunities", threats: "Threats" },
  ar: { strengths: "نقاط القوة", weaknesses: "نقاط الضعف", opportunities: "الفرص", threats: "التهديدات" },
};

function fmtNum(n: number): string {
  if (!Number.isFinite(n)) return "";
  return Math.abs(n) >= 1000 ? n.toLocaleString("en-US") : String(Math.round(n * 100) / 100);
}

function Body({ s, ar }: { s: Slide; ar: boolean }): React.ReactElement {
  const type: SlideType = (s.type as SlideType) || "bullets";

  if (type === "intro") {
    return (
      <div className="s-body center">
        <h1 className="s-hero-title"><RichText text={s.title} inline /></h1>
        <div className="s-hero-rule" />
        {s.subtitle ? <p className="s-hero-sub"><RichText text={s.subtitle} inline /></p> : null}
      </div>
    );
  }

  if (type === "section") {
    return (
      <div className="s-body center">
        <h1 className="s-sec-title"><RichText text={s.title} inline /></h1>
        {s.subtitle ? <p className="s-hero-sub" style={{ marginTop: 18 }}><RichText text={s.subtitle} inline /></p> : null}
      </div>
    );
  }

  if (type === "quote") {
    return (
      <div className="s-body center">
        <div className="s-qmark">“</div>
        <p className="s-quote"><RichText text={s.quote || s.title} inline /></p>
      </div>
    );
  }

  if (type === "definition" && (s.term || s.definition)) {
    const bullets = slideBullets(s);
    return (
      <div className="s-body">
        <Head s={s} />
        <div className="s-def">
          {s.term && s.term.trim().toLowerCase() !== (s.title || "").trim().toLowerCase()
            ? <div className="term"><RichText text={s.term} inline /></div> : null}
          {s.definition ? <p className="def"><RichText text={s.definition} inline /></p> : null}
          {bullets.length ? <BulletList bullets={bullets} className="dense" /> : null}
        </div>
      </div>
    );
  }

  if (type === "cards" && (s.cards?.length || 0) > 0) {
    const cards = s.cards!.slice(0, 4);
    const n = cards.length <= 2 ? "n2" : cards.length === 3 ? "n3" : "n4";
    return (
      <div className="s-body">
        <Head s={s} />
        <div className={`s-cards ${n}`}>
          {cards.map((c, i) => (
            <div className="s-card" key={i}>
              {matchIcon(c.icon) ? <span className="s-ico"><SlideIcon name={c.icon} size={22} /></span> : null}
              <h4><RichText text={c.title} inline /></h4>
              {c.text ? <p><RichText text={c.text} inline /></p> : null}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if ((type === "process" || type === "timeline") && (s.steps?.length || 0) > 0) {
    const offset = s.stepOffset || 0;
    const steps = s.steps!.slice(0, 6);
    return (
      <div className="s-body">
        <Head s={s} />
        <div className={`s-steps ${steps.length >= 5 ? "many" : ""}`}>
          {steps.map((st, i) => (
            <div className="s-step" key={i}>
              <span className="num">{offset + i + 1}</span>
              <div className="sc">
                <h4><RichText text={st.title} inline /></h4>
                {st.text ? <p><RichText text={st.text} inline /></p> : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "stats" && (s.stats?.length || 0) > 0) {
    return (
      <div className="s-body">
        <Head s={s} />
        <div className="s-stats">
          {s.stats!.slice(0, 4).map((st, i) => (
            <div className="s-stat" key={i}>
              <div className="val"><RichText text={st.value} inline /></div>
              <div className="lbl"><RichText text={st.label} inline /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "comparison") {
    const Side = ({ label, points }: { label?: string; points?: string[] }) => (
      <div className="s-col">
        <div className="ch"><RichText text={label} inline /></div>
        <ul>{(points || []).map((p, i) => (
          <li key={i}><span className="d" /><span><RichText text={p} inline /></span></li>
        ))}</ul>
      </div>
    );
    return (
      <div className="s-body">
        <Head s={s} />
        <div className="s-cmp">
          <Side label={s.left_label} points={s.left_points} />
          <Side label={s.right_label} points={s.right_points} />
        </div>
      </div>
    );
  }

  if (type === "table" && s.table && s.table.columns?.length && s.table.rows?.length) {
    const cols = s.table.columns;
    const rows = s.table.rows;
    const dense = rows.length > 5 || cols.length > 4;
    return (
      <div className="s-body">
        <Head s={s} />
        <div className="s-tablewrap">
          <table className={`s-table ${dense ? "dense" : ""}`}>
            <thead><tr>{cols.map((c, i) => <th key={i}><RichText text={c} inline /></th>)}</tr></thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>{cols.map((_, ci) => <td key={ci}><RichText text={r[ci] ?? ""} inline /></td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (type === "swot" && s.swot) {
    const L = ar ? SWOT_LABELS.ar : SWOT_LABELS.en;
    const quads: (keyof typeof L)[] = ["strengths", "weaknesses", "opportunities", "threats"];
    return (
      <div className="s-body">
        <Head s={s} />
        <div className="s-swot">
          {quads.map((q) => (
            <div className={`q q-${q}`} key={q}>
              <div className="qh">{L[q]}</div>
              <ul>
                {(s.swot![q] || []).slice(0, 4).map((t, i) => <li key={i}><RichText text={t} inline /></li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "chart" && s.chart && s.chart.labels?.length && s.chart.values?.length) {
    const n = Math.min(s.chart.labels.length, s.chart.values.length, 8);
    const vals = s.chart.values.slice(0, n).map(Number);
    const max = Math.max(...vals.map((v) => Math.abs(v)), 0) || 1;
    return (
      <div className="s-body">
        <Head s={s} />
        <div className="s-chart">
          {Array.from({ length: n }).map((_, i) => (
            <div className="row" key={i}>
              <div className="lab"><RichText text={s.chart!.labels[i]} inline /></div>
              <div className="track"><div className="fill" style={{ width: `${Math.max(2, (Math.abs(vals[i]) / max) * 100)}%` }} /></div>
              <div className="val" dir="ltr">{fmtNum(vals[i])}{s.chart!.unit ? ` ${s.chart!.unit}` : ""}</div>
            </div>
          ))}
          {s.chart.caption ? <div className="cap"><RichText text={s.chart.caption} inline /></div> : null}
        </div>
      </div>
    );
  }

  if (type === "equation" && (s.equations?.length || 0) > 0) {
    const eqs = s.equations!.slice(0, 3);
    return (
      <div className="s-body">
        <Head s={s} />
        <div className={`s-eqs n${eqs.length}`}>
          {eqs.map((e, i) => (
            <div className="s-eq" key={i}>
              {e.label ? <div className="lbl"><RichText text={e.label} inline /></div> : null}
              <div className="math" dir="ltr"><RichText text={`$$${e.latex}$$`} /></div>
              {e.explanation ? <p className="exp"><RichText text={e.explanation} inline /></p> : null}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "layers" && (s.layers?.length || 0) > 0) {
    return (
      <div className="s-body">
        <Head s={s} />
        <div className="s-layers">
          {s.layers!.slice(0, 6).map((l, i) => (
            <div className="layer" key={i}>
              <div className="lt"><RichText text={l.title} inline /></div>
              <div className="li">
                {(l.items || []).slice(0, 6).map((it, j) => <span className="chip" key={j}><RichText text={it} inline /></span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "diagram" && s.visual?.code) {
    const bullets = slideBullets(s);
    return (
      <div className="s-body">
        <Head s={s} />
        <SlideDiagram visual={s.visual} />
        {bullets.length ? <BulletList bullets={bullets} className="dense after-fig" /> : null}
      </div>
    );
  }

  // figure — a real image extracted from the source + explanation. The image pane sizes
  // itself to the image (portrait screenshots get height, wide figures get width).
  if (type === "figure" && s.imageUrl) {
    const bullets = slideBullets(s);
    if (bullets.length === 0) {
      return (
        <div className="s-body">
          <Head s={s} />
          <div className="s-figure">
            <img className="s-figimg solo" src={s.imageUrl} alt={s.title || "figure"} />
          </div>
        </div>
      );
    }
    return (
      <div className="s-body">
        <Head s={s} />
        <div className="s-figrow">
          <div className="s-figpane">
            <img className="s-figimg" src={s.imageUrl} alt={s.title || "figure"} />
          </div>
          <BulletList bullets={bullets} className="figbul" />
        </div>
      </div>
    );
  }

  // code — a code snippet from the source (always LTR) + explanation.
  if (type === "code" && s.code) {
    const bullets = slideBullets(s);
    return (
      <div className="s-body">
        <Head s={s} />
        <pre className="s-code" dir="ltr"><code>{s.code}</code></pre>
        {bullets.length ? <BulletList bullets={bullets} className="dense after-fig" /> : null}
      </div>
    );
  }

  // bullets / summary / content (default)
  const bullets = slideBullets(s);
  const dense = bullets.length > 5 || bullets.reduce((n, b) => n + b.text.length, 0) > 360;
  return (
    <div className="s-body">
      <Head s={s} />
      <BulletList bullets={bullets} className={dense ? "dense" : ""} />
      {s.callout?.text ? (
        <div className="s-callout">
          <div>
            {s.callout.label ? <div className="lbl"><RichText text={s.callout.label} inline /></div> : null}
            <div className="txt"><RichText text={s.callout.text} inline /></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** One slide (used by both the server PPTX render and the client preview). */
export function SlideView({ slide, index, themeName, total, deckTitle }: { slide: Slide; index: number; themeName: string; total?: number; deckTitle?: string }): React.ReactElement {
  const ar = slideIsArabic(slide);
  const type = (slide.type as string) || "bullets";
  return (
    <div className={`slide t-${type} ${ar ? "ar" : ""}`} dir={ar ? "rtl" : "ltr"}>
      <div className="topbar" />
      <div className="glow" />
      <div className="glow2" />
      <Body s={slide} ar={ar} />
      <Footer index={index} themeName={themeName} total={total} deckTitle={deckTitle} />
    </div>
  );
}

/** Full deck (server renders this to static markup, then screenshots each .slide). */
export function SlideDeck({ slides, themeName, deckTitle }: { slides: Slide[]; themeName: string; deckTitle?: string }): React.ReactElement {
  return (
    <div className="slide-root">
      {slides.map((s, i) => (
        <SlideView key={i} slide={s} index={i} themeName={themeName} total={slides.length} deckTitle={deckTitle} />
      ))}
    </div>
  );
}
