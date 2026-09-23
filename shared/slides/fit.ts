/**
 * Slide fit engine — shared by the browser preview and the headless-Chrome export,
 * so what you see is what you download.
 *
 * It measures the REAL rendered slide and, when content doesn't fit its box:
 *   1. tightens spacing (.fit-tight),
 *   2. then scales the slide body down in small steps (CSS zoom, floor 0.78 so text
 *      stays readable).
 * When content is short it does the opposite: enlarges the content area (not the title)
 * up to 1.3× so the slide isn't mostly empty.
 * If it still doesn't fit, the slide is marked data-fit="overflow" so the generator can
 * split it — content is never allowed to run over the title, other blocks or the footer.
 *
 * Kept as a plain JS source string (not a TS function) so it can be injected into
 * Puppeteer pages without bundler helpers leaking into the serialized code.
 */
export const FIT_SOURCE = `
  var body = slide.querySelector('.s-body');
  if (!body) return 'ok';
  var parts = Array.prototype.filter.call(body.children, function (c) { return !c.classList.contains('s-head'); });
  var setParts = function (z) { parts.forEach(function (p) { p.style.zoom = z === 1 ? '' : String(z); }); };
  slide.classList.remove('fit-tight');
  body.style.zoom = '';
  setParts(1);

  var fits = function () {
    if (body.scrollHeight > body.clientHeight + 1 || body.scrollWidth > body.clientWidth + 1) return false;
    var br = body.getBoundingClientRect();
    var tol = 1.5;
    var all = body.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (e.closest('.katex, .mermaid, svg')) continue;
      var r = e.getBoundingClientRect();
      if (!r.width && !r.height) continue;
      // anything leaving the body box would overlap the footer or be clipped
      if (r.bottom > br.bottom + tol || r.right > br.right + tol || r.left < br.left - tol || r.top < br.top - tol) return false;
      // containers whose own content overflows them (text spilling out of a card, list or cell).
      // Text leaves and math wrappers are skipped: their "overflow" is glyph/strut geometry
      // (descenders, KaTeX struts), not layout — their real extent is covered by the box check above.
      if (e.classList.contains('s-math-block')) { if (e.scrollWidth > e.clientWidth + 2) return false; continue; }
      if (!e.children.length || e.classList.contains('s-math')) continue;
      var onlyMath = true;
      for (var c = 0; c < e.children.length; c++) {
        var cl = e.children[c].classList;
        if (!(cl.contains('s-math-block') || cl.contains('s-math') || cl.contains('katex'))) { onlyMath = false; break; }
      }
      if (onlyMath) { if (e.scrollWidth > e.clientWidth + 2) return false; continue; }
      // text with inline pieces (a title with its accent bar, a bullet with inline math) is a
      // line box, not a container — glyph overshoot there isn't layout overflow
      var blockKids = false;
      for (var k2 = 0; k2 < e.children.length; k2++) {
        var dsp = getComputedStyle(e.children[k2]).display;
        if (dsp !== 'none' && dsp.indexOf('inline') !== 0) { blockKids = true; break; }
      }
      if (!blockKids) continue;
      var cs = getComputedStyle(e);
      // tolerance scales with the box: fractional zoom rounds client sizes by a few pixels
      if (cs.display !== 'inline' && e.clientHeight > 0 && e.scrollHeight > e.clientHeight + Math.max(3, e.clientHeight * 0.02) && cs.overflowY !== 'auto' && cs.overflowY !== 'scroll') return false;
      if (cs.display !== 'inline' && e.clientWidth > 0 && e.scrollWidth > e.clientWidth + Math.max(3, e.clientWidth * 0.02) && e.tagName !== 'TABLE') return false;
    }
    return true;
  };

  if (fits()) {
    // Room to spare: enlarge the content (never the title) to the largest size that still
    // fits comfortably, so short content doesn't sit small in a large empty slide.
    if (!body.classList.contains('center') && parts.length) {
      var grow = [1.3, 1.22, 1.15, 1.08];
      for (var g = 0; g < grow.length; g++) {
        setParts(grow[g]);
        if (fits()) { slide.setAttribute('data-fit', 'grow'); return 'ok'; }
      }
      setParts(1);
    }
    slide.setAttribute('data-fit', 'ok');
    return 'ok';
  }
  slide.classList.add('fit-tight');
  if (fits()) { slide.setAttribute('data-fit', 'tight'); return 'tight'; }
  var steps = [0.94, 0.88, 0.83, 0.78];
  for (var k = 0; k < steps.length; k++) {
    body.style.zoom = String(steps[k]);
    if (fits()) { slide.setAttribute('data-fit', 'zoom:' + steps[k]); return 'zoom'; }
  }
  slide.setAttribute('data-fit', 'overflow');
  return 'overflow';
`;

let compiled: ((slide: HTMLElement) => string) | null = null;

/** Browser helper: fit one rendered `.slide` element. Returns ok | tight | zoom | overflow. */
export function fitSlideElement(slide: HTMLElement): string {
  if (!compiled) compiled = new Function("slide", FIT_SOURCE) as (slide: HTMLElement) => string;
  try {
    return compiled(slide);
  } catch {
    return "ok";
  }
}
