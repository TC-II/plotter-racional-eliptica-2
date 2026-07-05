// ============================================================
//  UI Logic — formatting and slider alignment
// ============================================================

// Slider and value display elements (set up by main.js)
let gpSlider, gaSlider, wanSlider;
let gpVal, gaVal, wanVal;
let gpExact, gaExact, wanExact;
let k1El, k2El, L1El, L2El, Li1El, Li2El, ratioEl, NEl;
let k1dotEl, L1dotEl, Li1dotEl, MEl;
let zerosBox, zerosListEl, polesBox, polesListEl, funcBox, funcStrEl;
let templateCanvas, templateCtx;
let canvas, ctx;
let canvas2, ctx2;
let gwLabelTopCanvasY = null; // canvas-space y of the top of the "G(w)" label, set by drawTemplate()
let TEMPLATE_W = 420, TEMPLATE_H = 300;
let PLOT_W = 420, PLOT_H = 300;
let SYMLOG_W = 960, SYMLOG_H = 320;

function initUI() {
  gpSlider  = document.getElementById('gp');
  gaSlider  = document.getElementById('ga');
  wanSlider = document.getElementById('wan');
  gpVal   = document.getElementById('gp-val');
  gaVal   = document.getElementById('ga-val');
  wanVal  = document.getElementById('wan-val');
  gpExact  = document.getElementById('gp-exact');
  gaExact  = document.getElementById('ga-exact');
  wanExact = document.getElementById('wan-exact');
  k1El    = document.getElementById('k1');
  k2El    = document.getElementById('k2');
  L1El    = document.getElementById('L1');
  L2El    = document.getElementById('L2');
  Li1El   = document.getElementById('Li1');
  Li2El   = document.getElementById('Li2');
  ratioEl = document.getElementById('ratio');
  NEl     = document.getElementById('N');
  k1dotEl = document.getElementById('k1dot');
  L1dotEl = document.getElementById('L1dot');
  Li1dotEl = document.getElementById('Li1dot');
  MEl     = document.getElementById('Mval');
  zerosBox = document.getElementById('zerosBox');
  zerosListEl = document.getElementById('zerosList');
  polesBox = document.getElementById('polesBox');
  polesListEl = document.getElementById('polesList');
  funcBox = document.getElementById('funcBox');
  funcStrEl = document.getElementById('funcStr');
  templateCanvas = document.getElementById('templateCanvas');
  templateCtx = templateCanvas.getContext('2d');
  canvas = document.getElementById('plotCanvas');
  ctx = canvas.getContext('2d');
  canvas2 = document.getElementById('plotCanvasSymlog');
  ctx2 = canvas2.getContext('2d');
}

function formatVal(v) {
  if (!isFinite(v)) return v !== v ? 'N/A' : '∞';
  if (Math.abs(v) >= 1000) return v.toExponential(6);
  return v.toFixed(10);
}

function formatShort(v) {
  if (!isFinite(v)) return v !== v ? 'N/A' : '∞';
  if (Math.abs(v) >= 1000) return v.toExponential(4);
  return v.toFixed(6);
}

// ------------------------------------------------------------
//  Keep the Gp/Ga vertical slider tracks aligned with the
//  template plot's Y-axis (arrow tip to axis bottom), which
//  scales with the canvas's rendered (aspect-ratio-preserved)
//  size rather than a fixed pixel value.
// ------------------------------------------------------------
function syncVSliderAlignment() {
  const rect = templateCanvas.getBoundingClientRect();
  const scale = rect.height / TEMPLATE_H; // TEMPLATE_H = 300 (logical CSS pixels)
  const marginJS = 40; // matches the `margin` used in drawTemplate()
  const axisTopOffset = (marginJS - 8) * scale;
  const axisBottomOffset = (TEMPLATE_H - marginJS) * scale;

  // Position labels first (top aligned with the "G(w)" glyph top).
  const labelTopOffset = gwLabelTopCanvasY !== null ? gwLabelTopCanvasY * scale : axisTopOffset;
  document.querySelectorAll('.vlabel').forEach(el => {
    el.style.top = labelTopOffset + 'px';
  });

  // Tracks span from just below the label down to the axis bottom, so
  // they never overlap the Gp/Ga text even though the axis arrow tip
  // sits close to the "G(w)" label.
  document.querySelectorAll('.vslider-wrap').forEach(el => {
    const label = el.parentElement.querySelector('.vlabel');
    const labelHeight = label ? label.getBoundingClientRect().height : 0;
    const topOffset = Math.max(axisTopOffset, labelTopOffset + labelHeight + 8);
    const length = axisBottomOffset - topOffset;
    el.style.marginTop = topOffset + 'px';
    el.style.height = length + 'px';
    const input = el.querySelector('input[type="range"]');
    if (input) input.style.width = length + 'px';
  });
}