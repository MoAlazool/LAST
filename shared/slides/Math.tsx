import React from "react";
import katex from "katex";

// Greek letters / common symbols for the plain-text fallback.
const SYMBOLS: Record<string, string> = {
  alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", varepsilon: "ε", zeta: "ζ", eta: "η",
  theta: "θ", vartheta: "θ", iota: "ι", kappa: "κ", lambda: "λ", mu: "μ", nu: "ν", xi: "ξ", pi: "π",
  rho: "ρ", sigma: "σ", tau: "τ", upsilon: "υ", phi: "φ", varphi: "φ", chi: "χ", psi: "ψ", omega: "ω",
  Gamma: "Γ", Delta: "Δ", Theta: "Θ", Lambda: "Λ", Xi: "Ξ", Pi: "Π", Sigma: "Σ", Phi: "Φ", Psi: "Ψ", Omega: "Ω",
  times: "×", cdot: "·", div: "÷", pm: "±", leq: "≤", le: "≤", geq: "≥", ge: "≥", neq: "≠", ne: "≠",
  approx: "≈", infty: "∞", to: "→", rightarrow: "→", leftarrow: "←", Rightarrow: "⇒", sum: "Σ", int: "∫",
  partial: "∂", nabla: "∇", degree: "°", circ: "°", propto: "∝", in: "∈",
};

/**
 * Best-effort readable text for a LaTeX expression KaTeX couldn't parse, so a
 * malformed formula degrades to legible text instead of raw syntax or a red error.
 */
export function texToPlain(tex: string): string {
  let s = String(tex || "");
  for (let i = 0; i < 3; i++) {
    s = s
      .replace(/\\(?:d|t)?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "($1)/($2)")
      .replace(/\\sqrt\s*\{([^{}]*)\}/g, "√($1)")
      .replace(/\\(?:text|mathrm|mathbf|mathit|operatorname|vec|hat|bar|overline)\s*\{([^{}]*)\}/g, "$1");
  }
  s = s
    .replace(/\\left|\\right|\\,|\\;|\\!|\\quad|\\qquad/g, " ")
    .replace(/\\([A-Za-z]+)/g, (_m, name) => SYMBOLS[name] ?? name)
    .replace(/[{}]/g, "")
    .replace(/\\/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return s;
}

// Isomorphic: katex.renderToString works in node (server PPTX) and the browser.
// Returns null when the expression is not valid LaTeX (caller falls back to text).
function katexOrNull(tex: string, display: boolean): string | null {
  const t = tex.trim();
  if (!t) return null;
  try {
    return katex.renderToString(t, { throwOnError: true, displayMode: display, strict: "ignore", output: "html" });
  } catch {
    return null;
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function katexHtml(tex: string, display: boolean): string {
  return katexOrNull(tex, display) ?? escapeHtml(texToPlain(tex));
}

/** True when the LaTeX parses cleanly (used by the server to drop broken equations). */
export function isValidTex(tex: string): boolean {
  return katexOrNull(tex, false) !== null;
}

// $$display$$ or $inline$. Inline math must hug its delimiters ("$x$", not "$ 5 and $")
// and must not be followed by a digit, so currency like "$5 or $10" stays plain text.
const MATH_RE = /\$\$([^$]+?)\$\$|\$(?=[^\s$])([^$\n]+?)(?<=[^\s$\\])\$(?!\d)/g;

/**
 * Renders text that may contain inline $...$ or display $$...$$ math.
 * - Invalid LaTeX degrades to readable text (never raw syntax / red errors).
 * - `inline` forces display math to render inline, so a formula inside a bullet
 *   or card can't break out of its line box.
 * - Stray unmatched "$" characters are removed.
 */
export function RichText({ text, inline = false }: { text: any; inline?: boolean }): React.ReactElement {
  const str = String(text ?? "");
  if (!str.includes("$")) return <>{str}</>;

  const parts: React.ReactNode[] = [];
  let last = 0;
  let k = 0;
  const pushText = (t: string) => {
    const clean = t.replace(/\$/g, "");
    if (clean) parts.push(<React.Fragment key={k++}>{clean}</React.Fragment>);
  };
  MATH_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = MATH_RE.exec(str)) !== null) {
    if (m.index > last) pushText(str.slice(last, m.index));
    const display = m[1] !== undefined && !inline;
    const tex = (m[1] ?? m[2] ?? "").trim();
    parts.push(
      <span
        key={k++}
        className={display ? "s-math-block" : "s-math"}
        dangerouslySetInnerHTML={{ __html: katexHtml(tex, display) }}
      />,
    );
    last = MATH_RE.lastIndex;
  }
  if (last < str.length) pushText(str.slice(last));
  return <>{parts}</>;
}

export { katexHtml };
