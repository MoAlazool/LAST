import React from "react";
import katex from "katex";

// Isomorphic: katex.renderToString works in node (server PPTX) and the browser.
function katexHtml(tex: string, display: boolean): string {
  try {
    return katex.renderToString(tex, { throwOnError: false, displayMode: display });
  } catch {
    return tex.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  }
}

/**
 * Renders text that may contain inline $...$ or display $$...$$ math.
 * Text segments render as plain React text; math segments via KaTeX HTML.
 */
export function RichText({ text }: { text: any }): React.ReactElement {
  const str = String(text ?? "");
  if (!str.includes("$")) return <>{str}</>;

  const re = /(\$\$[^$]+\$\$|\$[^$]+\$)/g;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(str)) !== null) {
    if (m.index > last) parts.push(<React.Fragment key={k++}>{str.slice(last, m.index)}</React.Fragment>);
    const seg = m[0];
    const display = seg.startsWith("$$");
    const tex = seg.replace(/^\$\$|^\$|\$\$$|\$$/g, "");
    parts.push(
      <span
        key={k++}
        style={display ? { display: "block", margin: "6px 0" } : undefined}
        dangerouslySetInnerHTML={{ __html: katexHtml(tex, display) }}
      />,
    );
    last = re.lastIndex;
  }
  if (last < str.length) parts.push(<React.Fragment key={k++}>{str.slice(last)}</React.Fragment>);
  return <>{parts}</>;
}

export { katexHtml };
