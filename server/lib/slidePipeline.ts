/**
 * Slide generation pipeline:
 *   model output → LaTeX-safe JSON parse → normalise + clean artifacts
 *   → math policy (no math unless the source has math; broken LaTeX never reaches a slide)
 *   → grounding check (numbers must come from the source) → targeted repair call, then
 *     deterministic removal of anything still unsupported
 *   → content budgets (split overfull slides) → real-renderer layout check (split what
 *     still doesn't fit).
 */
import type { Slide } from "@shared/slides";
import { isValidTex, texToPlain } from "@shared/slides";
import { buildSlidesPrompt, buildRepairPrompt } from "./slidePrompt";

// ─────────────────────────────── JSON parsing ───────────────────────────────

// LaTeX commands that start with a letter JSON treats as an escape (\b \f \n \r \t \u).
// "\frac" written with a single backslash would otherwise parse as form-feed + "rac".
const LATEX_ESCAPE_WORDS = new Set([
  "beta", "bar", "bf", "binom", "big", "bigl", "bigr", "bigg", "biggl", "biggr", "bot", "boxed", "bullet", "backslash", "bmod", "bm",
  "frac", "forall", "flat", "footnotesize", "frown",
  "nu", "nabla", "neq", "ne", "neg", "not", "nolimits", "newline", "nexists", "ni", "nmid", "nleq", "ngeq", "nsubseteq",
  "rho", "right", "rightarrow", "rangle", "rceil", "rfloor", "rm", "rvert", "rVert", "rbrace", "rbrack",
  "tau", "theta", "text", "textbf", "textit", "textrm", "texttt", "textstyle", "times", "tan", "tanh", "tfrac", "to", "top",
  "triangle", "tilde", "therefore", "tbinom", "textnormal",
  "underline", "underbrace", "uparrow", "upsilon", "cup",
]);

/** Repairs backslash escapes inside JSON strings so LaTeX survives JSON.parse. */
function fixJsonEscapes(text: string): string {
  let out = "";
  let inStr = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (!inStr) {
      if (ch === '"') inStr = true;
      out += ch;
      continue;
    }
    if (ch === '"') { inStr = false; out += ch; continue; }
    if (ch === "\n") { out += "\\n"; continue; }
    if (ch === "\r") { continue; }
    if (ch === "\t") { out += " "; continue; }
    if (ch !== "\\") { out += ch; continue; }

    const next = text[i + 1] ?? "";
    if (next === '"' || next === "\\" || next === "/") { out += ch + next; i++; continue; }
    const word = (/^[A-Za-z]+/.exec(text.slice(i + 1)) || [""])[0];
    if (next === "u" && /^[0-9a-fA-F]{4}/.test(text.slice(i + 2, i + 6)) && !LATEX_ESCAPE_WORDS.has(word)) {
      out += text.slice(i, i + 6); i += 5; continue;
    }
    if ("bfnrt".includes(next) && next !== "") {
      if (LATEX_ESCAPE_WORDS.has(word)) { out += "\\\\"; continue; } // LaTeX command → literal backslash
      out += ch + next; i++; continue; // a real \n, \t …
    }
    out += "\\\\"; // invalid JSON escape (\a, \s, \l, \( …) → literal backslash (LaTeX)
  }
  return out;
}

function firstBalancedJson(text: string): string | null {
  const start = text.search(/[{[]/);
  if (start < 0) return null;
  const open = text[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (c === "\\") { i++; continue; }
      if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) return text.slice(start, i + 1); }
  }
  return null;
}

export function parseModelJson(raw: string): any {
  const stripped = String(raw || "").replace(/```(?:json)?/gi, "").trim();
  const block = firstBalancedJson(stripped) ?? stripped;
  const fixed = fixJsonEscapes(block);
  try {
    return JSON.parse(fixed);
  } catch {
    // drop trailing commas and retry once
    return JSON.parse(fixed.replace(/,\s*([}\]])/g, "$1"));
  }
}

// ─────────────────────────────── text cleanup ───────────────────────────────

const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\u{2B50}\u{2728}]/gu;
const FILE_RE = /\b[\w\- ()]+\.(pdf|docx?|pptx?|txt|md)\b/gi;
// Same delimiters as the renderer (shared/slides/Math.tsx).
const MATH_RE = /\$\$([^$]+?)\$\$|\$(?=[^\s$])([^$\n]+?)(?<=[^\s$\\])\$(?!\d)/g;

function cleanText(v: any, opts: { title?: boolean } = {}): string | undefined {
  if (v == null) return undefined;
  let s = String(v)
    .replace(/[\r\n\t\f\v]+/g, " ")
    .replace(/\*\*|__|`/g, "")
    .replace(/^\s*#{1,6}\s*/, "")
    .replace(/^\s*(slide|شريحة)\s*\d+\s*[:.\-–]\s*/i, "")
    .replace(/^\s*(fig(ure)?\.?|شكل)\s*\d+\s*[:.\-–]\s*/i, "")
    .replace(EMOJI_RE, "")
    .replace(/^[\s•●▪■◦▸►✓✔\-–—*]+/, "");
  if (opts.title) s = s.replace(FILE_RE, (m) => m.replace(/\.(pdf|docx?|pptx?|txt|md)$/i, "").replace(/_/g, " "));
  s = s.replace(/\s+/g, " ").trim();
  return s || undefined;
}

/** A leftover that isn't real content (isolated symbol, lone punctuation, "Step 3:"…). */
function isJunk(s?: string): boolean {
  if (!s) return true;
  const letters = s.replace(/\$[^$]*\$/g, "x").replace(/[^\p{L}\p{N}]/gu, "");
  return letters.length < 2;
}

// ─────────────────────────────── math policy ───────────────────────────────

export function sourceHasMath(src: string): boolean {
  return (
    /\\(frac|sqrt|sum|int|alpha|beta|theta|lambda|sigma|pi|Delta|partial|cdot|times)\b/.test(src) ||
    /[∑∫√±≤≥≈∞∂∆πθλμσΩ²³]/.test(src) ||
    /\b[A-Za-z][A-Za-z0-9_]{0,3}\s*=\s*[^=\n]{0,30}[+\-*/^×÷·]/.test(src) ||
    /\b[A-Z][a-z]?\s*=\s*[A-Za-z]\s*[A-Za-z]\b/.test(src) || // V = I R, F = m a
    /\b(equation|formula|theorem|derivative|integral)s?\b|معادلة|معادلات|صيغة رياضية/i.test(src)
  );
}

/** Applies the math policy to one text: drop math when the source has none; never keep broken LaTeX. */
function applyMath(text: string | undefined, allowMath: boolean): string | undefined {
  if (!text || !text.includes("$")) return text;
  const out = text
    .replace(MATH_RE, (_m, disp, inl) => {
      const tex = String(disp ?? inl ?? "").trim();
      if (!allowMath) return "";
      if (!isValidTex(tex)) return texToPlain(tex);
      return disp !== undefined ? `$$${tex}$$` : `$${tex}$`;
    })
    .replace(/\s+([,.;:)])/g, "$1")
    .replace(/\(\s*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!allowMath && /[:=]$/.test(out)) return undefined; // the text only existed to introduce a formula
  return out || undefined;
}

// ─────────────────────────────── grounding ───────────────────────────────

function normDigits(s: string): string {
  return s
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x6f0))
    .replace(/٫/g, ".");
}

function extractNumbers(s: string, all = false): string[] {
  const t = normDigits(s).replace(/(\d),(?=\d{3}\b)/g, "$1");
  const out: string[] = [];
  for (const m of t.matchAll(/(\d+(?:\.\d+)?)\s*(%|٪|percent|بالمئة)?/g)) {
    const n = m[1].replace(/\.0+$/, "");
    const v = parseFloat(n);
    // small counts ("3 steps", "Step 2", exponents) aren't meaningful claims to verify
    if (!all && !m[2] && Number.isInteger(v) && v <= 10) continue;
    out.push(n);
  }
  return out;
}

export interface SourceIndex {
  numbers: Set<string>;
  allowMath: boolean;
}

export function buildSourceIndex(source: string): SourceIndex {
  return { numbers: new Set(extractNumbers(source, true)), allowMath: sourceHasMath(source) };
}

function unsupportedNumbers(text: string | undefined, idx: SourceIndex): string[] {
  if (!text) return [];
  return extractNumbers(text).filter((n) => !idx.numbers.has(n));
}

/** Removes sentences that contain an unsupported number; undefined when nothing supported remains. */
function stripUnsupported(text: string | undefined, idx: SourceIndex): string | undefined {
  if (!text || unsupportedNumbers(text, idx).length === 0) return text;
  const parts = text.split(/(?<=[.!?؟;])\s+/);
  const kept = parts.filter((p) => unsupportedNumbers(p, idx).length === 0);
  const out = kept.join(" ").trim();
  return out && !isJunk(out) ? out : undefined;
}

/** Every rendered text field of a slide, with a setter — used for checks and fixes. */
function textFields(s: Slide): { get: () => string | undefined; set: (v: string | undefined) => void }[] {
  const f: { get: () => string | undefined; set: (v: string | undefined) => void }[] = [];
  const add = (obj: any, key: string) => f.push({ get: () => obj[key], set: (v) => { obj[key] = v; } });
  (["title", "lead", "subtitle", "quote", "term", "definition", "left_label", "right_label"] as const).forEach((k) => add(s, k));
  (s.bullets as any[] | undefined)?.forEach((b) => add(b, "text"));
  if (s.callout) { add(s.callout, "label"); add(s.callout, "text"); }
  s.cards?.forEach((c) => { add(c, "title"); add(c, "text"); });
  s.steps?.forEach((st) => { add(st, "title"); add(st, "text"); });
  s.equations?.forEach((e) => { add(e, "label"); add(e, "explanation"); add(e, "latex"); });
  s.layers?.forEach((l) => { add(l, "title"); l.items?.forEach((_, i) => add(l.items, String(i))); });
  s.left_points?.forEach((_, i) => add(s.left_points, String(i)));
  s.right_points?.forEach((_, i) => add(s.right_points, String(i)));
  if (s.swot) (["strengths", "weaknesses", "opportunities", "threats"] as const).forEach((q) => s.swot![q]?.forEach((_, i) => add(s.swot![q], String(i))));
  s.table?.rows?.forEach((r) => r.forEach((_, i) => add(r, String(i))));
  s.table?.columns?.forEach((_, i) => add(s.table!.columns, String(i)));
  s.stats?.forEach((st) => { add(st, "value"); add(st, "label"); });
  if (s.chart) { add(s.chart, "caption"); s.chart.labels?.forEach((_, i) => add(s.chart!.labels, String(i))); }
  if (s.visual) add(s.visual, "caption");
  return f;
}

export function groundingIssues(s: Slide, idx: SourceIndex): string[] {
  const issues: string[] = [];
  const nums = new Set<string>();
  for (const f of textFields(s)) unsupportedNumbers(f.get(), idx).forEach((n) => nums.add(n));
  s.chart?.values?.forEach((v) => { const n = String(v).replace(/\.0+$/, ""); if (!idx.numbers.has(n)) nums.add(n); });
  if (nums.size) issues.push(`contains numbers not found in the source: ${Array.from(nums).join(", ")}`);
  if (!idx.allowMath && s.type === "equation") issues.push("uses equations, but the source contains no mathematics");
  return issues;
}

/** Deterministic last resort: remove whatever is still unsupported. */
function enforceGrounding(s: Slide, idx: SourceIndex): Slide {
  const x: Slide = JSON.parse(JSON.stringify(s));
  if (x.stats) x.stats = x.stats.filter((st) => extractNumbers(`${st.value}`, true).every((n) => idx.numbers.has(n)));
  if (x.chart && x.chart.values?.some((v) => !idx.numbers.has(String(v).replace(/\.0+$/, "")))) x.chart = undefined;
  for (const f of textFields(x)) f.set(stripUnsupported(f.get(), idx));
  return x;
}

// ─────────────────────────────── normalisation ───────────────────────────────

const VALID_TYPES = new Set(["intro", "section", "bullets", "content", "cards", "process", "timeline", "stats", "comparison",
  "diagram", "figure", "code", "quote", "summary", "table", "swot", "chart", "equation", "definition", "layers"]);

const arr = (v: any): any[] => (Array.isArray(v) ? v : []);
const strList = (v: any, max = 12) => arr(v).map((x) => cleanText(typeof x === "string" ? x : x?.text)).filter((x): x is string => !isJunk(x)).slice(0, max);

function normalizeOne(r: any, ar: boolean): Slide | null {
  if (!r || typeof r !== "object") return null;
  let type = VALID_TYPES.has(r.type) ? (r.type === "content" ? "bullets" : r.type) : "bullets";
  const bullets = arr(r.bullets?.length ? r.bullets : r.content)
    .map((b: any) => (typeof b === "string" ? { text: cleanText(b) } : { text: cleanText(b?.text) }))
    .filter((b: any) => !isJunk(b.text)) as { text: string }[];

  const s: Slide = {
    type: type as any,
    title: cleanText(r.title, { title: true }) || "",
    lead: cleanText(r.lead),
    subtitle: cleanText(r.subtitle, { title: true }),
    quote: cleanText(r.quote),
    bullets,
    callout: r.callout?.text && !isJunk(cleanText(r.callout.text)) ? { label: cleanText(r.callout.label), text: cleanText(r.callout.text)! } : undefined,
    cards: arr(r.cards).map((c: any) => ({ icon: cleanText(c?.icon), title: cleanText(c?.title) || "", text: cleanText(c?.text) || "" })).filter((c) => !isJunk(c.title + c.text)),
    steps: arr(r.steps).map((st: any) => ({ title: cleanText(st?.title) || "", text: cleanText(st?.text) })).filter((st) => !isJunk(st.title + (st.text || ""))),
    stats: arr(r.stats).map((st: any) => ({ value: cleanText(st?.value) || "", label: cleanText(st?.label) || "" })).filter((st) => st.value && st.label),
    left_label: cleanText(r.left_label),
    right_label: cleanText(r.right_label),
    left_points: strList(r.left_points),
    right_points: strList(r.right_points),
    term: cleanText(r.term),
    definition: cleanText(r.definition),
    source: cleanText(r.source),
    speaker_notes: cleanText(r.speaker_notes) || "",
    direction: ar ? "rtl" : "ltr",
    language: ar ? "ar" : "en",
  };

  if (r.table && arr(r.table.columns).length && arr(r.table.rows).length) {
    const columns = arr(r.table.columns).map((c: any) => cleanText(c) || "").slice(0, 6);
    const rows = arr(r.table.rows).filter(Array.isArray).map((row: any[]) => columns.map((_, i) => cleanText(row[i]) || ""))
      .filter((row: string[]) => row.some((c) => c));
    if (columns.length && rows.length) s.table = { columns, rows };
  }
  if (r.swot) {
    const q = (k: string) => strList(r.swot[k], 6);
    s.swot = { strengths: q("strengths"), weaknesses: q("weaknesses"), opportunities: q("opportunities"), threats: q("threats") };
  }
  if (r.chart && arr(r.chart.labels).length && arr(r.chart.values).length) {
    const values = arr(r.chart.values).map((v: any) => Number(String(v).replace(/[^\d.\-]/g, "")));
    if (values.every((v) => Number.isFinite(v))) {
      s.chart = { kind: "bar", labels: arr(r.chart.labels).map((l: any) => cleanText(l) || ""), values, unit: cleanText(r.chart.unit), caption: cleanText(r.chart.caption) };
    }
  }
  s.equations = arr(r.equations).map((e: any) => ({
    latex: String(e?.latex ?? "").replace(/^\$+|\$+$/g, "").trim(),
    label: cleanText(e?.label),
    explanation: cleanText(e?.explanation),
  })).filter((e) => e.latex);
  s.layers = arr(r.layers).map((l: any) => ({ title: cleanText(l?.title) || "", items: strList(l?.items, 8) })).filter((l) => l.title || l.items.length);
  if (r.visual?.code && r.visual.type === "mermaid") s.visual = { type: "mermaid", code: String(r.visual.code), caption: cleanText(r.visual.caption) };
  if (type === "figure" && Number.isInteger(r.imageRef)) s.imageRef = r.imageRef;
  if (type === "code" && typeof r.code === "string" && r.code.trim()) { s.code = r.code.replace(/\s+$/, ""); s.codeLanguage = cleanText(r.codeLanguage); }
  return s;
}

/** Math policy on every text field + equations; degrades layouts whose special data didn't survive. */
function finalizeSlide(s: Slide, allowMath: boolean): Slide | null {
  const x = s;
  for (const f of textFields(x)) f.set(applyMath(f.get(), allowMath));
  // equation slides: keep only valid equations the policy allows
  x.equations = (x.equations || []).filter((e) => allowMath && e.latex && isValidTex(e.latex));
  // drop emptied items
  x.bullets = (x.bullets as any[] | undefined)?.filter((b) => !isJunk(b?.text));
  x.cards = x.cards?.filter((c) => !isJunk(`${c.title || ""}${c.text || ""}`));
  x.steps = x.steps?.filter((st) => !isJunk(`${st.title || ""}${st.text || ""}`));
  x.left_points = x.left_points?.filter((p) => !isJunk(p));
  x.right_points = x.right_points?.filter((p) => !isJunk(p));
  x.stats = x.stats?.filter((st) => st.value && st.label);
  x.layers = x.layers?.map((l) => ({ ...l, items: (l.items || []).filter((i) => !isJunk(i)) })).filter((l) => l.title || l.items.length);
  if (x.swot) (["strengths", "weaknesses", "opportunities", "threats"] as const).forEach((q) => { x.swot![q] = (x.swot![q] || []).filter((i) => !isJunk(i)); });
  if (x.callout && isJunk(x.callout.text)) x.callout = undefined;

  const toBullets = (extra: string[] = []) => {
    const b = [...extra.filter((t) => !isJunk(t)).map((text) => ({ text })), ...((x.bullets as any[]) || [])];
    x.type = "bullets";
    x.bullets = b;
  };
  switch (x.type) {
    case "equation":
      if (!x.equations.length) toBullets(((s.equations || []) as any[]).map((e) => e.explanation).filter(Boolean));
      break;
    case "cards": if ((x.cards?.length || 0) < 2) toBullets((x.cards || []).map((c) => [c.title, c.text].filter(Boolean).join(": "))); break;
    case "process": case "timeline": if ((x.steps?.length || 0) < 2) toBullets((x.steps || []).map((st) => [st.title, st.text].filter(Boolean).join(": "))); break;
    case "stats": if ((x.stats?.length || 0) < 2) toBullets((x.stats || []).map((st) => `${st.label}: ${st.value}`)); break;
    case "chart": if (!x.chart || x.chart.labels.length < 2) toBullets(); break;
    case "table": if (!x.table) toBullets(); break;
    case "swot": {
      const n = x.swot ? Object.values(x.swot).reduce((a, q) => a + (q?.length || 0), 0) : 0;
      if (n < 4) toBullets();
      break;
    }
    case "layers": if ((x.layers?.length || 0) < 2) toBullets((x.layers || []).map((l) => `${l.title}: ${l.items.join(", ")}`)); break;
    case "definition": if (!x.term || !x.definition) toBullets([x.term && x.definition ? `${x.term}: ${x.definition}` : x.definition || ""]); break;
    case "comparison": if (!(x.left_points?.length) || !(x.right_points?.length)) toBullets([...(x.left_points || []), ...(x.right_points || [])]); break;
    case "diagram": if (!x.visual) toBullets(); break;
    case "code": if (!x.code) toBullets(); break;
    default: break;
  }

  const hasContent = x.type === "intro" || x.type === "section" || x.type === "quote"
    ? !isJunk(x.title || x.quote)
    : (x.bullets?.length || 0) + (x.cards?.length || 0) + (x.steps?.length || 0) + (x.stats?.length || 0) +
      (x.left_points?.length || 0) + (x.equations?.length || 0) + (x.layers?.length || 0) +
      (x.table ? 1 : 0) + (x.swot ? 1 : 0) + (x.chart ? 1 : 0) + (x.visual ? 1 : 0) + (x.code ? 1 : 0) +
      (x.imageUrl ? 1 : 0) + (x.definition ? 1 : 0) > 0 || !!x.callout;
  return hasContent && (x.title || x.quote) ? x : null;
}

// ─────────────────────────────── budgets & splitting ───────────────────────────────

function chunk<T>(a: T[], parts: number): T[][] {
  const size = Math.ceil(a.length / parts);
  const out: T[][] = [];
  for (let i = 0; i < a.length; i += size) out.push(a.slice(i, i + size));
  return out;
}

const contTitle = (s: Slide, i: number) => (i === 0 ? s.title : `${s.title} ${s.language === "ar" ? "(تابع)" : "(cont.)"}`);

/** Splits a slide into `parts` slides of the same layout (content preserved, order kept). */
export function splitSlide(s: Slide, parts = 2): Slide[] {
  const clone = (patch: Partial<Slide>, i: number): Slide => ({ ...s, ...patch, title: contTitle(s, i), lead: i === 0 ? s.lead : undefined });
  switch (s.type) {
    case "bullets": case "summary": case "content": {
      const b = (s.bullets as any[]) || [];
      if (b.length < 2) return [s];
      return chunk(b, parts).map((c, i, all) => clone({ bullets: c, callout: i === all.length - 1 ? s.callout : undefined }, i));
    }
    case "cards": return (s.cards?.length || 0) < 3 ? [s] : chunk(s.cards!, parts).map((c, i) => clone({ cards: c }, i));
    case "process": case "timeline": {
      if ((s.steps?.length || 0) < 3) return [s];
      let off = s.stepOffset || 0;
      return chunk(s.steps!, parts).map((c, i) => { const r = clone({ steps: c, stepOffset: off }, i); off += c.length; return r; });
    }
    case "table": return (s.table?.rows.length || 0) < 3 ? [s] : chunk(s.table!.rows, parts).map((rows, i) => clone({ table: { columns: s.table!.columns, rows } }, i));
    case "equation": return (s.equations?.length || 0) < 2 ? [s] : chunk(s.equations!, parts).map((e, i) => clone({ equations: e }, i));
    case "layers": return (s.layers?.length || 0) < 3 ? [s] : chunk(s.layers!, parts).map((l, i) => clone({ layers: l }, i));
    case "comparison": {
      const L = s.left_points || [], R = s.right_points || [];
      if (L.length < 2 && R.length < 2) return [s];
      const lc = chunk(L, parts), rc = chunk(R, parts);
      return Array.from({ length: Math.max(lc.length, rc.length) }).map((_, i) => clone({ left_points: lc[i] || [], right_points: rc[i] || [] }, i));
    }
    case "figure": case "definition": case "diagram": case "code": {
      // keep the main element; move the explanation into a following text slide
      const b = (s.bullets as any[]) || [];
      if (b.length < 2) return [s];
      const keep = s.type === "figure" ? 2 : 1;
      return [{ ...s, bullets: b.slice(0, keep) }, { ...s, type: "bullets", imageUrl: undefined, visual: undefined, code: undefined,
        term: undefined, definition: undefined, bullets: b.slice(keep), title: contTitle(s, 1), lead: undefined }];
    }
    case "swot": {
      if (!s.swot) return [s];
      const trim = (q: string[]) => q.slice(0, 3);
      return [{ ...s, swot: { strengths: trim(s.swot.strengths), weaknesses: trim(s.swot.weaknesses), opportunities: trim(s.swot.opportunities), threats: trim(s.swot.threats) } }];
    }
    default: return [s];
  }
}

// Content budgets per layout — beyond these a slide is split before it is ever rendered.
function overBudget(s: Slide): number {
  const chars = (v?: string) => (v || "").length;
  switch (s.type) {
    case "bullets": case "summary": case "content": {
      const b = (s.bullets as any[]) || [];
      const total = b.reduce((n, x) => n + chars(x.text), 0) + chars(s.callout?.text);
      return b.length > 6 || total > 620 ? Math.ceil(Math.max(b.length / 5, total / 520)) : 1;
    }
    case "cards": return (s.cards?.length || 0) > 4 ? 2 : 1;
    case "process": case "timeline": return (s.steps?.length || 0) > 6 ? Math.ceil(s.steps!.length / 5) : 1;
    case "table": return (s.table?.rows.length || 0) > 7 ? Math.ceil(s.table!.rows.length / 6) : 1;
    case "equation": return (s.equations?.length || 0) > 3 ? Math.ceil(s.equations!.length / 3) : 1;
    case "layers": return (s.layers?.length || 0) > 6 ? 2 : 1;
    case "comparison": return Math.max(s.left_points?.length || 0, s.right_points?.length || 0) > 6 ? 2 : 1;
    case "figure": return ((s.bullets as any[])?.length || 0) > 4 ? 2 : 1;
    default: return 1;
  }
}

function applyBudgets(slides: Slide[]): Slide[] {
  return slides.flatMap((s) => { const n = overBudget(s); return n > 1 ? splitSlide(s, n) : [s]; });
}

// ─────────────────────────────── pipeline ───────────────────────────────

export interface PipelineOptions {
  transcript: string;
  summary?: string | string[];
  figures: { index: number; url: string; description?: string }[];
  /** Calls the model; `json` asks for JSON output mode where supported. */
  callModel: (prompt: string, json: boolean) => Promise<string>;
  /** Renders slides with the real renderer + fit engine; returns per-slide fit state. */
  measure?: (slides: Slide[]) => Promise<string[]>;
  resolveImage?: (url: string) => Promise<string | null>;
}

export interface PipelineResult {
  slides: Slide[];
  lectureTitle: string;
  language: "Arabic" | "English";
  analysis?: any;
  report: { repaired: number; strippedMath: boolean; split: number; overflowRemaining: number };
}

const MAX_SOURCE_CHARS = 60000;

export async function generateGroundedSlides(o: PipelineOptions): Promise<PipelineResult> {
  // Deck language = the source's dominant script (a mostly-English poster with a few Arabic
  // labels is English), not "contains any Arabic".
  const arLetters = (o.transcript.match(/[؀-ۿ]/g) || []).length;
  const latinLetters = (o.transcript.match(/[A-Za-z]/g) || []).length;
  const hasArabic = arLetters > latinLetters * 0.6;
  const language: "Arabic" | "English" = hasArabic ? "Arabic" : "English";
  const summaryText = Array.isArray(o.summary) ? o.summary.join("\n") : (o.summary || "");
  const truncated = o.transcript.length > MAX_SOURCE_CHARS;
  const source = truncated ? o.transcript.slice(0, MAX_SOURCE_CHARS) : o.transcript;
  const sourceWords = o.transcript.split(/\s+/).filter(Boolean).length;
  const idx = buildSourceIndex(`${o.transcript}\n${truncated ? summaryText : ""}`);

  // 1) plan + write
  const raw = await o.callModel(buildSlidesPrompt({
    source, truncated, summary: summaryText.slice(0, 8000), sourceWords, language,
    figures: o.figures.map((f) => ({ index: f.index, description: f.description })),
  }), true);
  const parsed = parseModelJson(raw);
  const rawSlides: any[] = Array.isArray(parsed) ? parsed : arr(parsed?.slides);
  const analysis = Array.isArray(parsed) ? undefined : parsed?.analysis;
  if (!rawSlides.length) throw new Error("The model returned no slides");

  // 2) normalise, resolve figures, apply the math policy
  const figureUrl = new Map(o.figures.map((f) => [f.index, f.url]));
  const usedFigures = new Set<number>();
  let slides = rawSlides
    .map((r) => normalizeOne(r, hasArabic))
    .filter((s): s is Slide => !!s)
    .map((s) => {
      if (s.type === "figure") {
        const url = s.imageRef !== undefined ? figureUrl.get(s.imageRef) : undefined;
        if (url && !usedFigures.has(s.imageRef!)) { usedFigures.add(s.imageRef!); s.imageUrl = url; }
        else s.type = "bullets";
        s.imageRef = undefined;
      }
      return s;
    })
    .map((s) => finalizeSlide(s, idx.allowMath))
    .filter((s): s is Slide => !!s);

  // 3) grounding: one targeted repair round for flagged slides, then deterministic enforcement
  const flagged = slides.map((s, i) => ({ i, issues: groundingIssues(s, idx) })).filter((x) => x.issues.length);
  let repaired = 0;
  if (flagged.length) {
    try {
      const subset = flagged.map((f) => slides[f.i]);
      const issues = flagged.map((f, k) => `Slide ${k + 1} ("${slides[f.i].title}"): ${f.issues.join("; ")}`);
      const fixedRaw = await o.callModel(buildRepairPrompt({
        slidesJson: JSON.stringify(subset.map(({ imageUrl, ...rest }) => rest)),
        issues, source: source.slice(0, 40000), language,
      }), true);
      const fixedParsed = parseModelJson(fixedRaw);
      const fixedArr: any[] = Array.isArray(fixedParsed) ? fixedParsed : arr(fixedParsed?.slides);
      if (fixedArr.length === flagged.length) {
        flagged.forEach((f, k) => {
          const n = normalizeOne({ ...fixedArr[k], type: fixedArr[k]?.type || slides[f.i].type }, hasArabic);
          const fin = n && finalizeSlide({ ...n, imageUrl: slides[f.i].imageUrl }, idx.allowMath);
          if (fin) { slides[f.i] = fin; repaired++; }
        });
      }
    } catch (e: any) {
      console.warn("[slides] repair round failed, enforcing deterministically:", e?.message);
    }
  }
  slides = slides
    .map((s) => (groundingIssues(s, idx).length ? enforceGrounding(s, idx) : s))
    .map((s) => finalizeSlide(s, idx.allowMath))
    .filter((s): s is Slide => !!s);

  // 4) the deck opens with its real title (never a file name)
  if (slides[0]?.type !== "intro") {
    const topic = cleanText(analysis?.main_topic, { title: true });
    if (topic) slides.unshift({ type: "intro", title: topic, direction: hasArabic ? "rtl" : "ltr", language: hasArabic ? "ar" : "en" });
  }

  // 5) layout: content budgets, then verify with the real renderer and split what still overflows
  const before = slides.length;
  slides = applyBudgets(slides);
  let overflowRemaining = 0;
  if (o.measure) {
    try {
      const withImages = async (list: Slide[]) => Promise.all(list.map(async (s) =>
        s.imageUrl && o.resolveImage ? { ...s, imageUrl: (await o.resolveImage(s.imageUrl)) || s.imageUrl } : s));
      for (let pass = 0; pass < 2; pass++) {
        const states = await o.measure(await withImages(slides));
        // split what doesn't fit — and what only fits by shrinking text noticeably
        const needsSplit = (st: string) => st === "overflow" || (st.startsWith("zoom:") && parseFloat(st.slice(5)) <= 0.83);
        const bad = states.map((st, i) => (needsSplit(st) ? i : -1)).filter((i) => i >= 0);
        overflowRemaining = bad.length;
        if (!bad.length) break;
        const next: Slide[] = [];
        slides.forEach((s, i) => { next.push(...(bad.includes(i) ? splitSlide(s, 2) : [s])); });
        if (next.length === slides.length) break; // nothing splittable left
        slides = next;
      }
    } catch (e: any) {
      console.warn("[slides] layout check skipped:", e?.message);
    }
  }

  const intro = slides.find((s) => s.type === "intro");
  const lectureTitle = intro?.title || (hasArabic ? "شرائح المحاضرة" : "Lecture Slides");
  return {
    slides: slides.map((s, i) => ({ ...s, id: i + 1, content: ((s.bullets as any[]) || []).map((b) => b.text) } as any)),
    lectureTitle,
    language,
    analysis,
    report: { repaired, strippedMath: !idx.allowMath, split: slides.length - before, overflowRemaining },
  };
}
