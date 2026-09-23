/**
 * Prompts for slide generation. The model is asked to (1) analyse the whole source,
 * (2) plan a narrative that fits the document type, and only then (3) write slides —
 * each tied to a supporting excerpt from the source. The server re-checks grounding,
 * math, and layout afterwards (see slidePipeline.ts).
 */

export interface PromptFigure {
  index: number;
  description?: string;
}

/** Recommended slide range from the amount of source text (content decides the count, not a template). */
export function slideRange(sourceWords: number): [number, number] {
  if (sourceWords < 350) return [4, 7];
  if (sourceWords < 900) return [5, 9];
  if (sourceWords < 2500) return [7, 12];
  if (sourceWords < 6000) return [9, 15];
  return [12, 20];
}

export function buildSlidesPrompt(opts: {
  source: string;
  truncated: boolean;
  summary?: string;
  figures: PromptFigure[];
  language: "Arabic" | "English";
  sourceWords: number;
}): string {
  const [minS, maxS] = slideRange(opts.sourceWords);
  const figuresBlock = opts.figures.length
    ? opts.figures.map((f) => `[${f.index}] ${f.description?.trim() || "(no description)"}`).join("\n")
    : "(none — do not use the \"figure\" type)";

  return `You are an editor and information designer turning a source document into a presentation.
You are NOT a copywriter: your job is to present what the source says — clearly, faithfully and well laid out.

Return ONLY a JSON object (no markdown fences, no commentary):
{ "analysis": { ... }, "slides": [ ... ] }

━━━━━━━━ STEP 1 — READ AND ANALYSE THE WHOLE SOURCE (fill "analysis") ━━━━━━━━
"analysis": {
  "document_type": "lecture" | "research_paper" | "student_project" | "technical_report" | "business_report" | "textbook" | "poster" | "article" | "other",
  "language": "en" | "ar",
  "main_topic": "<the topic in the source's own words>",
  "sections": ["<the source's main sections/themes, in source order>"],
  "source_has": { "equations": bool, "numeric_data": bool, "tables": bool, "processes": bool, "comparisons": bool,
                  "swot": bool, "code": bool, "definitions": bool, "architecture": bool, "conclusions": bool, "future_work": bool },
  "useful_figures": [<indices from AVAILABLE FIGURES that carry real information>]
}
Every flag must reflect what the source ACTUALLY contains — not what a document of this kind usually contains.

━━━━━━━━ STEP 2 — PLAN THE NARRATIVE FOR THIS DOCUMENT TYPE ━━━━━━━━
Follow the source's own structure and emphasis. Use only the parts the source really has:
- lecture / textbook: learning order — key concepts and definitions → explanations and examples from the source → key takeaways.
- research_paper: problem and motivation → method → results/findings → discussion/limitations → conclusion.
- student_project / technical_report: problem → proposed solution → architecture/components → how it works → features/results → evaluation → conclusion (and future work only if stated).
- business_report: context → key findings/figures → analysis → recommendations.
- poster / short documents: few slides, roughly one per panel/section of the source.
Slide count: about ${minS}–${maxS} for this source (${opts.sourceWords} words). The content decides the count: do not pad
with thin slides and do not cram. One focused idea per slide. Avoid near-duplicate slides.

━━━━━━━━ STEP 3 — GROUNDING (MOST IMPORTANT) ━━━━━━━━
- Use ONLY information stated in the source. You may reorganise, condense, simplify and rephrase — never change the meaning.
- NEVER introduce anything the source does not state: statistics, percentages, numbers, thresholds, dates, durations,
  specifications, research findings, formulas, variables, features, benefits, future plans, or scientific claims.
  If the source gives no number for something, do not write one.
- Keep the source's terminology (system/method/component names, technical and medical terms). Do not "upgrade" a simple
  description into something more technical, academic or impressive than the source.
- Titles state plainly what the slide covers in the source — no marketing, dramatic or clever titles.
- "lead" (subtitle under the title) is OPTIONAL: include it only when it adds concrete context from the source. Omit filler.
- Never put the uploaded file name, page labels, figure numbers or extraction artifacts on slides.
- Each slide has "source": a short verbatim excerpt (≤ 30 words) from the source that supports it.

━━━━━━━━ STEP 4 — CHOOSE EACH LAYOUT FROM THE CONTENT'S ACTUAL SHAPE ━━━━━━━━
Simple text slides are fine and often best. Use a special layout ONLY when the content really has that shape.
Vary layouts only because the content varies — never for decoration.
"intro"      { title, subtitle? }  — first slide; title = the document's real title/topic. subtitle only if the source provides one.
"section"    { title, subtitle? }  — divider; only for decks > 10 slides with clearly separate parts.
"bullets"    { title, lead?, bullets: [{ text }] (2–6), callout?: { label?, text } }  — general explanatory content.
                callout = one key definition/statement taken from the source (not a slogan).
"definition" { title, term, definition, bullets?: [{ text }] (0–3) }  — one central term the source defines.
"cards"      { title, lead?, cards: [{ title, text, icon? }] (2–4) }  — parallel items of equal weight (features, components, types).
"process"    { title, lead?, steps: [{ title, text? }] (3–6) }  — steps the source describes in order.
"timeline"   same shape as process — dated/chronological events from the source.
"comparison" { title, lead?, left_label, right_label, left_points: [], right_points: [] }  — the source explicitly contrasts two things.
"table"      { title, lead?, table: { columns: [], rows: [[]] } }  — the source has a table or item-by-attribute data (≤ 6 rows, ≤ 5 columns).
"swot"       { title, swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] } }  — ONLY if the source contains a SWOT analysis.
"chart"      { title, lead?, chart: { labels: [], values: [numbers], unit?, caption? } }  — ≥ 3 numeric values from the source in one unit, copied exactly.
"stats"      { title, lead?, stats: [{ value, label }] (2–4) }  — headline numbers stated in the source, copied exactly.
"equation"   { title, lead?, equations: [{ latex, label?, explanation? }] (1–3) }  — formulas that appear in the source.
"layers"     { title, lead?, layers: [{ title, items: [] }] (2–6) }  — architecture / technology stack / layered structure named in the source.
"figure"     { title, lead?, imageRef: <index>, bullets: [{ text }] (0–4) }  — a source figure that carries information
                (screenshot, diagram, chart, photo of the subject). Bullets explain what the figure shows, per the source.
"diagram"    { title, lead?, visual: { type: "mermaid", code, caption? }, bullets?: [{ text }] (0–3) }  — a flow/relationship the source
                describes and no source figure shows. Simple mermaid only ("graph LR" / "graph TD", ≤ 8 nodes, no styling).
"code"       { title, code, codeLanguage, bullets?: [{ text }] (0–3) }  — code copied verbatim from the source.
"quote"      { quote }  — a notable sentence copied verbatim from the source.
"summary"    { title, bullets: [{ text }] }  — conclusions/takeaways as stated in the source (future work only if the source states it).

MATHEMATICS: use "equation" slides or inline $...$ math ONLY when the source itself contains that formula or explicitly states a
quantitative relationship. Conceptual descriptions stay conceptual. Example: a source saying "the app uses accelerometer and
gyroscope data to detect crashes" does NOT justify vectors, magnitudes, gravity formulas, thresholds or collision equations.
Copy formulas faithfully as valid LaTeX; inside JSON strings every backslash must be escaped (write \\\\frac, \\\\alpha).
Never use equations, charts, stats, tables or diagrams as decoration.

FIGURES: prefer a meaningful source figure over a generated diagram. Use each figure at most once; skip logos, covers, and
decorative images. Screenshots of an app/UI are good evidence for the feature they show.
ICONS: omit by default. Only "cards" may carry an "icon" (a simple English keyword such as "database", "shield", "sensor") and
only when it clearly identifies the item. Never add icons just to decorate.

TEXT LIMITS (split into two slides of the same type rather than overfilling):
title ≤ 9 words · lead ≤ 18 words · bullet ≤ 24 words · card text ≤ 26 words · step text ≤ 22 words ·
table cell ≤ 8 words · swot item ≤ 12 words · speaker_notes ≤ 50 words.
No markdown, asterisks, emojis or decorative symbols in any text.

━━━━━━━━ STEP 5 — CHECK BEFORE ANSWERING ━━━━━━━━
For every slide: can each statement be pointed to in the source? Remove anything that can't. Remove numbers or formulas not in
the source. Does the title match the content? Is the layout the right one for this content? Does it fit the text limits?

Every slide object includes: "type", "title" (except quote), the fields of its type, "source", "speaker_notes".
Language: write in ${opts.language === "Arabic" ? "formal Arabic (فصحى); keep technical names as in the source" : "clear professional English"}. Never mix languages on a slide.

━━━━━━━━ AVAILABLE FIGURES (real images extracted from this source; reference by index) ━━━━━━━━
${figuresBlock}

━━━━━━━━ SOURCE${opts.truncated ? " (long document — the beginning is shown in full; an overview of the rest follows)" : ""} ━━━━━━━━
${opts.source}${opts.truncated && opts.summary ? `\n\n━━━━━━━━ OVERVIEW OF THE FULL DOCUMENT ━━━━━━━━\n${opts.summary}` : ""}`;
}

export function buildRepairPrompt(opts: {
  slidesJson: string;
  issues: string[];
  source: string;
  language: "Arabic" | "English";
}): string {
  return `The slides below were generated from the SOURCE, but a validation check found problems.
Fix ONLY the listed problems. Keep each slide's "type", layout fields and all correct content unchanged.
- Remove or correct any statement, number, formula or claim that is not supported by the SOURCE. Do not replace it with other
  unsupported content; if nothing in the source supports it, delete it.
- Keep the source's terminology. Write in ${opts.language}.
- LaTeX backslashes inside JSON strings must be escaped (\\\\frac).
Return ONLY a JSON array with the corrected slides, same count and same order.

PROBLEMS:
${opts.issues.map((i) => `- ${i}`).join("\n")}

SLIDES:
${opts.slidesJson}

SOURCE:
${opts.source}`;
}
