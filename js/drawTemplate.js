// ============================================================
//  Fig. 1: Normalized filter template (Gp / Ga / Wan tolerance scheme)
// ============================================================

function drawTemplate(Gp, Ga, Wan) {
  const dpr = window.devicePixelRatio || 1;
  templateCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const W = TEMPLATE_W;
  const H = TEMPLATE_H;
  templateCtx.clearRect(0, 0, W, H);

  const xMax = 4.2;
  const yMax = 1.15;
  const margin = 40;
  const plotW = W - 2 * margin;
  const plotH = H - 2 * margin;

  function xToPixel(x) { return margin + (x / xMax) * plotW; }
  function yToPixel(y) { return margin + (1 - y / yMax) * plotH; }

  // Forbidden region 1: passband floor, w in [0,1], G in [0,Gp]
  drawHatchedRect(templateCtx, xToPixel(0), yToPixel(Gp), xToPixel(1), yToPixel(0), 7, HATCH);
  // Forbidden region 2: stopband ceiling, w in [Wan,xMax], G in [Ga,1]
  drawHatchedRect(templateCtx, xToPixel(Wan), yToPixel(1), xToPixel(xMax), yToPixel(Ga), 7, HATCH);

  // Boundary outlines — only the constraint edges (Gp top / w=1 right for the
  // passband box, Ga bottom / w=Wan left for the stopband box).
  templateCtx.strokeStyle = INK;
  templateCtx.lineWidth = 1;
  templateCtx.beginPath();
  templateCtx.moveTo(xToPixel(0), yToPixel(Gp)); templateCtx.lineTo(xToPixel(1), yToPixel(Gp)); // top
  templateCtx.moveTo(xToPixel(1), yToPixel(Gp)); templateCtx.lineTo(xToPixel(1), yToPixel(0));  // right
  templateCtx.moveTo(xToPixel(Wan), yToPixel(Ga)); templateCtx.lineTo(xToPixel(xMax), yToPixel(Ga)); // bottom
  templateCtx.moveTo(xToPixel(Wan), yToPixel(1)); templateCtx.lineTo(xToPixel(Wan), yToPixel(Ga));   // left
  templateCtx.stroke();

  // Reference line at G=1 (dotted)
  templateCtx.strokeStyle = AUX;
  templateCtx.lineWidth = 0.8;
  templateCtx.setLineDash([1, 3]);
  templateCtx.beginPath();
  templateCtx.moveTo(margin, yToPixel(1));
  templateCtx.lineTo(W - margin, yToPixel(1));
  templateCtx.stroke();
  templateCtx.setLineDash([]);

  // Axes with arrowheads
  drawAxisArrow(templateCtx, xToPixel(0), yToPixel(0), xToPixel(0), margin - 8);       // vertical (up)
  drawAxisArrow(templateCtx, xToPixel(0), yToPixel(0), W - margin + 8, yToPixel(0));    // horizontal (right)

  // Labels (serif italic)
  templateCtx.fillStyle = INK;
  templateCtx.font = SERIF;
  const gwBaselineY = margin - 10;
  templateCtx.fillText('G(w)', xToPixel(0) + 6, gwBaselineY);
  const gwMetrics = templateCtx.measureText('G(w)');
  gwLabelTopCanvasY = gwBaselineY - (gwMetrics.actualBoundingBoxAscent || 10);
  templateCtx.fillText('w', W - margin - 16, yToPixel(0) + 10);
  templateCtx.font = SERIF_SM;
  templateCtx.fillText('1', xToPixel(0) - 14, yToPixel(1) + 3);
  templateCtx.fillText('Gp', xToPixel(0) - 22, yToPixel(Gp) + 3);
  templateCtx.fillText('Ga', W - margin + 6, yToPixel(Ga) + 3);
  templateCtx.fillText('0', xToPixel(0) - 12, yToPixel(0) + 13);
  templateCtx.fillText('1', xToPixel(1) - 3, yToPixel(0) + 14);
  templateCtx.fillText('ω', xToPixel(Wan) - 12, yToPixel(0) + 14);
  templateCtx.font = 'italic 8px "Latin Modern Roman", Georgia, serif';
  templateCtx.fillText('AN', xToPixel(Wan) + 2, yToPixel(0) + 18);
}

// ------------------------------------------------------------
//  Overlay the actual filter magnitude response on the template:
//  G(w) = 1 / sqrt(1 + ε² · R_N(w)²), ε² = 1/Gp² − 1.
// ------------------------------------------------------------
function drawTemplateResponse(zeros, poles, Ggain, epsSq, Wan) {
  const dpr = window.devicePixelRatio || 1;
  templateCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const W = TEMPLATE_W;
  const H = TEMPLATE_H;
  const xMax = 4.2;
  const yMax = 1.15;
  const margin = 40;
  const plotW = W - 2 * margin;
  const plotH = H - 2 * margin;

  function xToPixel(x) { return margin + (x / xMax) * plotW; }
  function yToPixel(y) { return margin + (1 - y / yMax) * plotH; }

  const steps = 500;
  templateCtx.strokeStyle = INK;
  templateCtx.lineWidth = 1.6;
  templateCtx.beginPath();
  let started = false;
  for (let i = 0; i <= steps; i++) {
    const w = xMax * i / steps;
    const r = evalRational(w, zeros, poles, Ggain);
    const gVal = 1 / Math.sqrt(1 + epsSq * r * r);
    if (isFinite(gVal)) {
      const x = xToPixel(w);
      const y = yToPixel(Math.min(gVal, yMax));
      if (!started) { templateCtx.moveTo(x, y); started = true; }
      else { templateCtx.lineTo(x, y); }
    } else { started = false; }
  }
  templateCtx.stroke();
}