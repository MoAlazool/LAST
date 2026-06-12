import React from "react";
import type { SlideVisual } from "./types";

/**
 * Renders an AI diagram inside a slide.
 * - svg:     inline via a data: URI <img> (sync, safe, identical on server & client).
 * - mermaid: emits a .mermaid node; both environments run mermaid to upgrade it
 *            to SVG before capture/paint (see server slideRenderer + client preview).
 */
export function SlideDiagram({ visual }: { visual: SlideVisual }): React.ReactElement | null {
  if (!visual?.code) return null;

  if (visual.type === "mermaid") {
    // Unescape literal \n / \t the model/JSON pipeline may leave, and drop emojis
    // that break the mermaid parser (keeps Arabic/Latin).
    const code = visual.code
      .replace(/\\r\\n|\\n|\\r/g, "\n")
      .replace(/\\t/g, " ")
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, "");
    return (
      <figure className="s-figure">
        <div className="mermaid" data-slide-mermaid="1">{code}</div>
        {visual.caption ? <figcaption className="cap">{visual.caption}</figcaption> : null}
      </figure>
    );
  }

  const src = `data:image/svg+xml;utf8,${encodeURIComponent(visual.code)}`;
  return (
    <figure className="s-figure">
      <img src={src} alt={visual.caption || "diagram"} />
      {visual.caption ? <figcaption className="cap">{visual.caption}</figcaption> : null}
    </figure>
  );
}
