import React from "react";
import type { Slide, SlideType } from "./types";
import { slideBullets } from "./types";
import { RichText } from "./Math";
import { SlideIcon } from "./icons";
import { SlideDiagram } from "./Diagram";

const AR_RE = /[؀-ۿݐ-ݿࢠ-ࣿ]/;
function slideIsArabic(s: Slide): boolean {
  const text = [
    s.title, s.subtitle, s.quote, s.lead, s.left_label, s.right_label,
    ...slideBullets(s).map((b) => b.text),
    ...(s.left_points || []), ...(s.right_points || []),
    ...(s.cards || []).flatMap((c) => [c.title, c.text]),
    ...(s.steps || []).flatMap((st) => [st.title, st.text]),
    ...(s.stats || []).flatMap((x) => [x?.value, x?.label]),
  ].filter(Boolean).join(" ");
  if (s.direction === "rtl") return true;
  if (s.language === "ar") return true;
  return AR_RE.test(text);
}

function Head({ s }: { s: Slide }) {
  return (
    <div className="s-head">
      <h2 className="s-title">
        <RichText text={s.title} />
        <span className="bar" />
      </h2>
      {s.lead ? <p className="s-lead"><RichText text={s.lead} /></p> : null}
    </div>
  );
}

function Footer({ index, themeName }: { index: number; themeName: string }) {
  return (
    <div className="s-footer">
      <span>✦ LECTUREMATE AI</span>
      <span>SLIDE {index + 1} · {themeName.toUpperCase()}</span>
    </div>
  );
}

function Body({ s, index, themeName }: { s: Slide; index: number; themeName: string }): React.ReactElement {
  const type: SlideType = (s.type as SlideType) || "bullets";

  if (type === "intro") {
    return (
      <div className="s-body center">
        <h1 className="s-hero-title"><RichText text={s.title} /></h1>
        <div className="s-hero-rule" />
        {s.subtitle ? <p className="s-hero-sub"><RichText text={s.subtitle} /></p> : null}
      </div>
    );
  }

  if (type === "section") {
    return (
      <div className="s-body center">
        <h1 className="s-sec-title"><RichText text={s.title} /></h1>
        {s.subtitle ? <p className="s-hero-sub" style={{ marginTop: 18 }}><RichText text={s.subtitle} /></p> : null}
      </div>
    );
  }

  if (type === "quote") {
    return (
      <div className="s-body center">
        <div className="s-qmark">“</div>
        <p className="s-quote"><RichText text={s.quote || s.title} /></p>
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
              {c.icon ? <span className="s-ico"><SlideIcon name={c.icon} size={24} /></span> : null}
              <h4><RichText text={c.title} /></h4>
              <p><RichText text={c.text} /></p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if ((type === "process" || type === "timeline") && (s.steps?.length || 0) > 0) {
    return (
      <div className="s-body">
        <Head s={s} />
        <div className="s-steps">
          {s.steps!.slice(0, 6).map((st, i) => (
            <div className="s-step" key={i}>
              <span className="num">{i + 1}</span>
              <div className="sc">
                <h4><RichText text={st.title} /></h4>
                {st.text ? <p><RichText text={st.text} /></p> : null}
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
              <div className="val"><RichText text={st.value} /></div>
              <div className="lbl"><RichText text={st.label} /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "comparison") {
    const Side = ({ label, points }: { label?: string; points?: string[] }) => (
      <div className="s-col">
        <div className="ch"><RichText text={label} /></div>
        <ul>{(points || []).map((p, i) => (
          <li key={i}><span className="d" /><span><RichText text={p} /></span></li>
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

  if (type === "diagram" && s.visual?.code) {
    return (
      <div className="s-body">
        <Head s={s} />
        <SlideDiagram visual={s.visual} />
      </div>
    );
  }

  // figure — a real image extracted from the lecture + AI explanation.
  if (type === "figure" && s.imageUrl) {
    const bullets = slideBullets(s);
    if (bullets.length === 0) {
      // No explanation bullets → big centered image + the lead as a caption.
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
          <ul className="s-bullets figbul">
            {bullets.map((b, i) => (
              <li key={i}>
                <span className="s-ico"><SlideIcon name={b.icon} size={18} /></span>
                <span><RichText text={b.text} /></span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // code — a code snippet from the lecture (always LTR) + AI explanation.
  if (type === "code" && s.code) {
    const bullets = slideBullets(s);
    return (
      <div className="s-body">
        <Head s={s} />
        <pre className="s-code" dir="ltr"><code>{s.code}</code></pre>
        {bullets.length ? (
          <ul className="s-bullets figbul">
            {bullets.map((b, i) => (
              <li key={i}>
                <span className="s-ico"><SlideIcon name={b.icon} size={16} /></span>
                <span><RichText text={b.text} /></span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  // bullets / summary / content (default)
  const bullets = slideBullets(s);
  const dense = bullets.length > 5 || bullets.reduce((n, b) => n + b.text.length, 0) > 360;
  return (
    <div className="s-body">
      <Head s={s} />
      <ul className={`s-bullets ${dense ? "dense" : ""}`}>
        {bullets.map((b, i) => (
          <li key={i}>
            <span className="s-ico"><SlideIcon name={b.icon} size={dense ? 18 : 22} /></span>
            <span><RichText text={b.text} /></span>
          </li>
        ))}
      </ul>
      {s.callout?.text ? (
        <div className="s-callout">
          <span className="s-ico"><SlideIcon name="key" size={22} /></span>
          <div>
            {s.callout.label ? <div className="lbl"><RichText text={s.callout.label} /></div> : null}
            <div className="txt"><RichText text={s.callout.text} /></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** One slide (used by both the server PPTX render and the client preview). */
export function SlideView({ slide, index, themeName }: { slide: Slide; index: number; themeName: string }): React.ReactElement {
  const ar = slideIsArabic(slide);
  return (
    <div className={`slide ${ar ? "ar" : ""}`} dir={ar ? "rtl" : "ltr"}>
      <div className="topbar" />
      <div className="glow" />
      <div className="glow2" />
      <Body s={slide} index={index} themeName={themeName} />
      <Footer index={index} themeName={themeName} />
    </div>
  );
}

/** Full deck (server renders this to static markup, then screenshots each .slide). */
export function SlideDeck({ slides, themeName }: { slides: Slide[]; themeName: string }): React.ReactElement {
  return (
    <div className="slide-root">
      {slides.map((s, i) => (
        <SlideView key={i} slide={s} index={i} themeName={themeName} />
      ))}
    </div>
  );
}
