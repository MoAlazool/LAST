/**
 * Server-side LaTeX renderer for PPTX export.
 *
 * Converts a line of text that may contain inline math ($...$ or $$...$$) into a
 * single PNG image (via MathJax tex2svg -> resvg rasterization) so equations look
 * identical to the on-screen KaTeX rendering. Lines without math are left to the
 * caller to render as native (selectable, animatable) PPTX text.
 *
 * All heavy modules are loaded lazily and guarded: if anything fails to initialise
 * (e.g. the resvg native binary), rendering degrades to `null` and the caller falls
 * back to plain text — math export can never break the whole download.
 */

const MATH_RE = /\$\$?([^$]+?)\$\$?/;

export interface RenderedMath {
  dataUri: string; // data:image/png;base64,...
  aspect: number; // pixelWidth / pixelHeight
}

/** True if the line contains at least one $...$ or $$...$$ segment. */
export function lineHasMath(line: string): boolean {
  if (!line) return false;
  return MATH_RE.test(line);
}

// ── Lazy singletons ──────────────────────────────────────────────────────────
let mathReady: Promise<{
  toSvg: (tex: string) => string;
  Resvg: any;
} | null> | null = null;

async function getEngine() {
  if (mathReady) return mathReady;
  mathReady = (async () => {
    try {
      const [{ mathjax }, { TeX }, { SVG }, { liteAdaptor }, { RegisterHTMLHandler }, resvg] =
        await Promise.all([
          import("mathjax-full/js/mathjax.js"),
          import("mathjax-full/js/input/tex.js"),
          import("mathjax-full/js/output/svg.js"),
          import("mathjax-full/js/adaptors/liteAdaptor.js"),
          import("mathjax-full/js/handlers/html.js"),
          import("@resvg/resvg-js"),
        ]);

      const adaptor = liteAdaptor();
      RegisterHTMLHandler(adaptor);
      const tex = new TeX({ packages: ["base", "ams"] });
      const svg = new SVG({ fontCache: "none" });
      const doc = mathjax.document("", { InputJax: tex, OutputJax: svg });

      const toSvg = (texStr: string): string => {
        const node = doc.convert(texStr, { display: false });
        return adaptor.innerHTML(node); // the <svg>…</svg> element
      };

      return { toSvg, Resvg: resvg.Resvg };
    } catch (err) {
      console.error("[mathRender] engine init failed, math will fall back to text:", err);
      return null;
    }
  })();
  return mathReady;
}

/** Escape a non-math text segment for use inside \text{ }. */
function escapeText(s: string): string {
  return s
    .replace(/\\/g, "\\textbackslash ")
    .replace(/([{}#%&_$])/g, "\\$1")
    .replace(/\^/g, "\\textasciicircum ")
    .replace(/~/g, "\\textasciitilde ");
}

/** Turn a mixed "text $math$ text" line into one TeX string MathJax can render. */
function lineToTex(line: string): string {
  const re = /\$\$?([^$]+?)\$\$?/g;
  let out = "";
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    const plain = line.slice(last, m.index);
    if (plain) out += `\\text{${escapeText(plain)}}`;
    out += ` ${m[1].trim()} `;
    last = re.lastIndex;
  }
  const tail = line.slice(last);
  if (tail) out += `\\text{${escapeText(tail)}}`;
  return out.trim() || `\\text{${escapeText(line)}}`;
}

const cache = new Map<string, RenderedMath | null>();

/**
 * Render a line containing math to a PNG data URI.
 * Returns null (caller falls back to plain text) for RTL lines or on any failure.
 */
export async function renderLineToPng(
  line: string,
  colorHex: string,
  isRtl: boolean,
): Promise<RenderedMath | null> {
  if (isRtl) return null; // MathJax \text{} doesn't shape Arabic well
  const color = "#" + colorHex.replace("#", "");
  const key = `${color}::${line}`;
  if (cache.has(key)) return cache.get(key)!;

  const result = await (async (): Promise<RenderedMath | null> => {
    const engine = await getEngine();
    if (!engine) return null;
    try {
      let svg = engine.toSvg(lineToTex(line));
      // MathJax colors glyphs with currentColor; bake in the theme text color.
      svg = svg.replace(/currentColor/g, color);
      // Rebuild the opening <svg> tag keeping ONLY xmlns + viewBox, so resvg scales
      // purely from the viewBox aspect (the original ex-based width/height confuse it).
      svg = svg.replace(/<svg\b[^>]*>/, (tag) => {
        const vb = tag.match(/viewBox="[^"]*"/)?.[0] || "";
        return `<svg xmlns="http://www.w3.org/2000/svg" ${vb}>`;
      });

      // Render tall for crisp scaling in the slide.
      const r = new engine.Resvg(svg, { fitTo: { mode: "height", value: 220 } });
      const rendered = r.render();
      const png = rendered.asPng();
      const aspect = rendered.width / rendered.height;
      return {
        dataUri: `data:image/png;base64,${Buffer.from(png).toString("base64")}`,
        aspect: isFinite(aspect) && aspect > 0 ? aspect : 4,
      };
    } catch (err) {
      console.error("[mathRender] render failed for line, falling back to text:", err);
      return null;
    }
  })();

  cache.set(key, result);
  return result;
}
