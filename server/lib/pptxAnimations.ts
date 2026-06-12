/**
 * Post-processes a pptxgenjs-generated .pptx buffer to inject basic entrance
 * animations — since pptxgenjs (v3.12) cannot author animations itself.
 *
 * Effect: each slide's text fades in on click. The title appears first, then the
 * body bullet list builds one paragraph at a time ("show text" bullet-by-bullet).
 * Decorative shapes (accent bar, separators, stat boxes, dividers), the footer,
 * and embedded images are left visible from the start.
 *
 * The whole operation is best-effort: callers wrap it in try/catch and fall back
 * to the un-animated buffer, so a malformed slide can never corrupt the download.
 */

import JSZip from "jszip";

interface ShapeInfo {
  id: string;
  paraCount: number;
  text: string;
}

/** Pull the ordered list of <p:sp> text shapes (id, paragraph count, text). */
function parseShapes(slideXml: string): ShapeInfo[] {
  const shapes: ShapeInfo[] = [];
  const spRe = /<p:sp>([\s\S]*?)<\/p:sp>/g;
  let m: RegExpExecArray | null;
  while ((m = spRe.exec(slideXml)) !== null) {
    const block = m[1];
    const idMatch = block.match(/<p:cNvPr[^>]*\bid="(\d+)"/);
    if (!idMatch) continue;
    const hasText = /<a:t>/.test(block);
    if (!hasText) continue; // skip decorative rects
    const paraCount = (block.match(/<a:p\b/g) || []).length;
    const text = (block.match(/<a:t>([\s\S]*?)<\/a:t>/g) || [])
      .map((t) => t.replace(/<\/?a:t>/g, ""))
      .join(" ")
      .trim();
    shapes.push({ id: idMatch[1], paraCount, text });
  }
  return shapes;
}

const isFooter = (s: ShapeInfo) => /LECTUREMATE/i.test(s.text) || /^\d+$/.test(s.text);

function spTgt(spid: string, paraIndex?: number): string {
  if (paraIndex == null) return `<p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl>`;
  return `<p:tgtEl><p:spTgt spid="${spid}"><p:txEl><p:pRg st="${paraIndex}" end="${paraIndex}"/></p:txEl></p:spTgt></p:tgtEl>`;
}

/** One "fade in on click" effect targeting a shape (or a single paragraph). */
function clickFade(nextId: () => number, spid: string, paraIndex?: number): string {
  const a = nextId(), b = nextId(), c = nextId(), d = nextId(), e = nextId();
  const tgt = spTgt(spid, paraIndex);
  return (
    `<p:par><p:cTn id="${a}" fill="hold"><p:stCondLst><p:cond delay="indefinite"/></p:stCondLst><p:childTnLst>` +
    `<p:par><p:cTn id="${b}" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>` +
    `<p:par><p:cTn id="${c}" presetID="10" presetClass="entr" presetSubtype="0" fill="hold" grpId="0" nodeType="clickEffect"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>` +
    `<p:animEffect transition="in" filter="fade"><p:cBhvr><p:cTn id="${d}" dur="500"/>${tgt}</p:cBhvr></p:animEffect>` +
    `<p:set><p:cBhvr><p:cTn id="${e}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn>${tgt}<p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set>` +
    `</p:childTnLst></p:cTn></p:par>` +
    `</p:childTnLst></p:cTn></p:par>` +
    `</p:childTnLst></p:cTn></p:par>`
  );
}

/** Build the full <p:timing> block for one slide, or "" if nothing to animate. */
function buildTimingXml(shapes: ShapeInfo[]): string {
  const animatable = shapes.filter((s) => !isFooter(s));
  if (animatable.length === 0) return "";

  // The body = the text shape with the most paragraphs (and > 1) → build by paragraph.
  let body: ShapeInfo | null = null;
  for (const s of animatable) {
    if (s.paraCount > 1 && (!body || s.paraCount > body.paraCount)) body = s;
  }

  let id = 2; // ids 1 (tmRoot) and 2 (mainSeq) are assigned below; effects start after
  const nextId = () => {
    id += 1;
    return id;
  };

  const effects: string[] = [];
  for (const s of animatable) {
    if (body && s.id === body.id) {
      for (let p = 0; p < s.paraCount; p++) effects.push(clickFade(nextId, s.id, p));
    } else {
      effects.push(clickFade(nextId, s.id));
    }
  }
  if (effects.length === 0) return "";

  const bldLst = body
    ? `<p:bldLst><p:bldP spid="${body.id}" grpId="0" build="p"/></p:bldLst>`
    : "";

  return (
    `<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>` +
    `<p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>` +
    effects.join("") +
    `</p:childTnLst></p:cTn>` +
    `<p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>` +
    `<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst>` +
    `</p:seq></p:childTnLst></p:cTn></p:par></p:tnLst>${bldLst}</p:timing>`
  );
}

/**
 * Inject a smooth fade transition between slides (used for the image-based deck,
 * where per-object build animations don't apply). Best-effort.
 */
export async function injectSlideTransitions(buffer: Buffer): Promise<Buffer> {
  const zip = await JSZip.loadAsync(buffer);
  const slidePaths = Object.keys(zip.files).filter((p) =>
    /^ppt\/slides\/slide\d+\.xml$/.test(p),
  );
  const transition = `<p:transition spd="med"><p:fade/></p:transition>`;
  for (const path of slidePaths) {
    const xml = await zip.files[path].async("string");
    if (xml.includes("<p:transition") || !xml.includes("</p:sld>")) continue;
    // <p:transition> must come after <p:clrMapOvr> and before </p:sld>
    const updated = xml.replace("</p:sld>", `${transition}</p:sld>`);
    zip.file(path, updated);
  }
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

/**
 * Inject fade + build-by-paragraph animations into every slide of a .pptx buffer.
 * Returns a new buffer; throws on a genuinely unreadable file (caller handles it).
 */
export async function injectFadeAnimations(buffer: Buffer): Promise<Buffer> {
  const zip = await JSZip.loadAsync(buffer);
  const slidePaths = Object.keys(zip.files).filter((p) =>
    /^ppt\/slides\/slide\d+\.xml$/.test(p),
  );

  for (const path of slidePaths) {
    const xml = await zip.files[path].async("string");
    if (xml.includes("<p:timing>") || !xml.includes("</p:sld>")) continue;
    const timing = buildTimingXml(parseShapes(xml));
    if (!timing) continue;
    const updated = xml.replace("</p:sld>", `${timing}</p:sld>`);
    zip.file(path, updated);
  }

  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}
