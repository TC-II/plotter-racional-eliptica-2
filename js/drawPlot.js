// ============================================================
//  Fig. 2: Linear R_N(w) plot
// ============================================================

function drawLinearPlot(zeros, poles, G) {
  const dpr = window.devicePixelRatio || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const W = PLOT_W;
  const H = PLOT_H;

  // Fixed symmetric range — square ±1 occupies most of plot
  const fixedRange = 1.5;
  const xMin = -1.5;
  const xMax = 1.5;
  let yMin = -1.5, yMax = 1.5;
  const margin = 40;
  const plotW = W - 2 * margin;
  const plotH = H - 2 * margin;

  // Equal aspect ratio: use same pixel scale for both axes
  const maxRange = xMax - xMin;
  const xCenter = 0, yCenter = 0;
  const pixelsPerUnit = Math.min(plotW, plotH) / maxRange;
  const plotCenterX = margin + plotW / 2;
  const plotCenterY = margin + plotH / 2;

  function xToPixel(x) { return plotCenterX + (x - xCenter) * pixelsPerUnit; }
  function yToPixel(y) { return plotCenterY - (y - yCenter) * pixelsPerUnit; }

  // Dashed unit square at ±1
  ctx.strokeStyle = AUX;
  ctx.lineWidth = 0.9;
  ctx.setLineDash([4, 3]);
  ctx.strokeRect(xToPixel(-1), yToPixel(1), xToPixel(1) - xToPixel(-1), yToPixel(-1) - yToPixel(1));
  ctx.setLineDash([]);

  // Axes with arrowheads (both positive and negative directions)
  drawAxisArrow(ctx, xToPixel(0), yToPixel(0), xToPixel(0), margin - 8);       // up
  drawAxisArrow(ctx, xToPixel(0), yToPixel(0), xToPixel(0), H - margin + 8);   // down
  drawAxisArrow(ctx, xToPixel(0), yToPixel(0), W - margin + 8, yToPixel(0));   // right
  drawAxisArrow(ctx, xToPixel(0), yToPixel(0), margin - 8, yToPixel(0));       // left

  // Labels
  ctx.fillStyle = INK;
  ctx.font = SERIF;
  ctx.fillText('R(w)', xToPixel(0) + 6, margin - 10);
  ctx.fillText('w', W - margin + 4, yToPixel(0) - 12);
  ctx.font = SERIF_SM;
  ctx.fillText('0', xToPixel(0) - 12, yToPixel(0) + 13);

  // Sample points: uniform, plus geometric refinement clusters approaching
  // each pole from both sides (never touching it). This guarantees the
  // last sample before a pole crossing has genuinely large |R(w)|, so the
  // edge-extension below reflects the true asymptote instead of jumping
  // from whatever moderate value the coarse uniform grid happened to land on.
  const steps = 600;
  let wSamples = [];
  for (let i = 0; i <= steps; i++) {
    wSamples.push(xMin + (xMax - xMin) * i / steps);
  }
  for (let j = 0; j < poles.length; j++) {
    const p = poles[j];
    if (p <= xMin || p >= xMax) continue;
    for (let k = 1; k <= 12; k++) {
      const delta = Math.max(Math.abs(p), 0.01) * Math.pow(10, -k);
      wSamples.push(p - delta);
      wSamples.push(p + delta);
    }
  }
  wSamples = wSamples.filter(w => w >= xMin && w <= xMax);
  wSamples.sort((a, b) => a - b);

  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  let started = false;
  let prevW = null;
  let prevX = null, prevR = null;
  let pendingEdgeEntry = false;

  // Extend curve to Y limits when approaching poles or exceeding range
  function extendToEdge(signSource) {
    if (started && prevX !== null) {
      const edgeVal = signSource >= 0 ? yMax : yMin;
      ctx.lineTo(prevX, yToPixel(edgeVal));
    }
  }

  for (let i = 0; i < wSamples.length; i++) {
    const w = wSamples[i];
    const r = evalRational(w, zeros, poles, G);

    let crossesPole = false;
    if (prevW !== null) {
      for (let j = 0; j < poles.length; j++) {
        const p = poles[j];
        if ((prevW < p && w >= p) || (prevW > p && w <= p)) { crossesPole = true; break; }
      }
    }
    if (crossesPole) {
      extendToEdge(prevR !== null ? prevR : 1);
      started = false;
      pendingEdgeEntry = true;
    }

    if (isFinite(r) && Math.abs(r) <= yMax) {
      const x = xToPixel(w);
      const y = yToPixel(r);
      if (!started) {
        if (pendingEdgeEntry) {
          const edgeVal = r >= 0 ? yMax : yMin;
          ctx.moveTo(x, yToPixel(edgeVal));
          ctx.lineTo(x, y);
          pendingEdgeEntry = false;
        } else {
          ctx.moveTo(x, y);
        }
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
      prevX = x; prevR = r;
    } else {
      extendToEdge(isFinite(r) ? r : (prevR !== null ? prevR : 1));
      started = false;
      pendingEdgeEntry = true;
    }
    prevW = w;
  }
  ctx.stroke();

  // Pole markers (small ×)
  ctx.strokeStyle = AUX;
  ctx.lineWidth = 1;
  for (let i = 0; i < poles.length; i++) {
    const x = xToPixel(poles[i]);
    const y = yToPixel(0);
    ctx.beginPath();
    ctx.moveTo(x - 2.5, y - 2.5); ctx.lineTo(x + 2.5, y + 2.5);
    ctx.moveTo(x + 2.5, y - 2.5); ctx.lineTo(x - 2.5, y + 2.5);
    ctx.stroke();
  }
}