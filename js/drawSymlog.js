// ============================================================
//  Fig. 3: Symlog R_N(w) plot
// ============================================================

function drawSymlogPlot(zeros, poles, G, k1, k2) {
  const dpr = window.devicePixelRatio || 1;
  ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
  const W2 = SYMLOG_W;
  const H2 = SYMLOG_H;

  const xMinS = -10, xMaxS = 10;
  const yMinS = -10000, yMaxS = 10000;
  const margin2 = 40;
  const plotW2 = W2 - 2 * margin2;
  const plotH2 = H2 - 2 * margin2;
  const thresh = 1;

  function s(v) { return Math.asinh(v / thresh); }

  const sxMin = s(xMinS), sxMax = s(xMaxS);
  const syMin = s(yMinS), syMax = s(yMaxS);

  function xp(x) { return margin2 + (s(x) - sxMin) / (sxMax - sxMin) * plotW2; }
  function yp(y) { return margin2 + (1 - (s(y) - syMin) / (syMax - syMin)) * plotH2; }

  // Faint grid lines at powers of 10
  ctx2.strokeStyle = GRIDLINE;
  ctx2.lineWidth = 0.5;
  for (let p = -2; p <= 1; p++) {
    const v = Math.pow(10, p);
    if (v >= 1 && v <= 10) {
      const xv = xp(v); ctx2.beginPath(); ctx2.moveTo(xv, margin2); ctx2.lineTo(xv, H2 - margin2); ctx2.stroke();
      const xnv = xp(-v); ctx2.beginPath(); ctx2.moveTo(xnv, margin2); ctx2.lineTo(xnv, H2 - margin2); ctx2.stroke();
    }
  }
  for (let p = 0; p <= 4; p++) {
    const v = Math.pow(10, p);
    if (v >= 1 && v <= 10000) {
      const yv = yp(v); ctx2.beginPath(); ctx2.moveTo(margin2, yv); ctx2.lineTo(W2 - margin2, yv); ctx2.stroke();
      const ynv = yp(-v); ctx2.beginPath(); ctx2.moveTo(margin2, ynv); ctx2.lineTo(W2 - margin2, ynv); ctx2.stroke();
    }
  }

  // Region overlay
  drawRegionOverlay(ctx2, xp, yp, xMinS, xMaxS, yMinS, yMaxS, k1, k2, margin2, W2, H2);

  // Axes with arrowheads (both directions)
  drawAxisArrow(ctx2, xp(0), yp(0), xp(0), margin2 - 8);       // up
  drawAxisArrow(ctx2, xp(0), yp(0), xp(0), H2 - margin2 + 8);  // down
  drawAxisArrow(ctx2, xp(0), yp(0), W2 - margin2 + 8, yp(0)); // right
  drawAxisArrow(ctx2, xp(0), yp(0), margin2 - 8, yp(0));       // left

  // Sample points: uniform in symlog-space, plus geometric refinement
  // clusters approaching each pole from both sides (never touching it),
  // so the steep rise/fall near a pole is rendered smoothly.
  const steps2 = 1200;
  let wSamples2 = [];
  for (let i = 0; i <= steps2; i++) {
    const sVal = sxMin + (sxMax - sxMin) * i / steps2;
    wSamples2.push(thresh * Math.sinh(sVal));
  }
  for (let j = 0; j < poles.length; j++) {
    const p = poles[j];
    if (p <= xMinS || p >= xMaxS) continue;
    for (let k = 1; k <= 12; k++) {
      const delta = Math.abs(p) * Math.pow(10, -k);
      wSamples2.push(p - delta);
      wSamples2.push(p + delta);
    }
  }
  wSamples2 = wSamples2.filter(w => w >= xMinS && w <= xMaxS);
  wSamples2.sort((a, b) => a - b);

  // Draw R(w) using the refined sample set
  ctx2.strokeStyle = INK;
  ctx2.lineWidth = 1.6;
  ctx2.beginPath();
  let started2 = false;
  let prevW2 = null;
  let prevX2 = null, prevR2 = null;
  let pendingEdgeEntry2 = false;

  // Whenever the curve is about to break (approaching a pole from the
  // near side), extend it straight up/down to the plot's top/bottom edge
  // from the last plotted point, so it always visually terminates at
  // ±yMaxS instead of stopping short. Symmetrically, the next branch (the
  // far side of that same pole) is started from the opposite edge down to
  // its first in-range point, so both sides of every pole reach ±yMaxS.
  function extendToEdge2(signSource) {
    if (started2 && prevX2 !== null) {
      const edgeVal = signSource >= 0 ? yMaxS : -yMaxS;
      ctx2.lineTo(prevX2, yp(edgeVal));
    }
  }

  for (let i = 0; i < wSamples2.length; i++) {
    const w = wSamples2[i];
    const r = evalRational(w, zeros, poles, G);

    let crossesPole = false;
    if (prevW2 !== null) {
      for (let j = 0; j < poles.length; j++) {
        const p = poles[j];
        if ((prevW2 < p && w >= p) || (prevW2 > p && w <= p)) { crossesPole = true; break; }
      }
    }
    if (crossesPole) {
      extendToEdge2(prevR2 !== null ? prevR2 : 1);
      started2 = false;
      pendingEdgeEntry2 = true;
    }

    if (isFinite(r) && Math.abs(r) <= yMaxS) {
      const x = xp(w);
      const y = yp(r);
      if (x >= margin2 && x <= W2 - margin2) {
        if (!started2) {
          if (pendingEdgeEntry2) {
            const edgeVal = r >= 0 ? yMaxS : -yMaxS;
            ctx2.moveTo(x, yp(edgeVal));
            ctx2.lineTo(x, y);
            pendingEdgeEntry2 = false;
          } else {
            ctx2.moveTo(x, y);
          }
          started2 = true;
        } else {
          ctx2.lineTo(x, y);
        }
        prevX2 = x; prevR2 = r;
      } else { started2 = false; }
    } else {
      extendToEdge2(isFinite(r) ? r : (prevR2 !== null ? prevR2 : 1));
      started2 = false;
      pendingEdgeEntry2 = true;
    }
    prevW2 = w;
  }
  ctx2.stroke();

  // Pole markers (small ×)
  ctx2.strokeStyle = AUX;
  ctx2.lineWidth = 1;
  for (let i = 0; i < poles.length; i++) {
    const x = xp(poles[i]);
    if (x >= margin2 && x <= W2 - margin2) {
      ctx2.beginPath();
      ctx2.moveTo(x - 2.5, yp(0) - 2.5); ctx2.lineTo(x + 2.5, yp(0) + 2.5);
      ctx2.moveTo(x + 2.5, yp(0) - 2.5); ctx2.lineTo(x - 2.5, yp(0) + 2.5);
      ctx2.stroke();
    }
  }

  // Labels
  ctx2.fillStyle = INK;
  ctx2.font = SERIF;
  ctx2.fillText('w', W2 - margin2 + 20, yp(0) + 4);
  ctx2.fillText('R(w)', xp(0) + 6, margin2 - 10);
  ctx2.font = SERIF_SM;
  // x ticks: ±10, ±100 (pushed below the forbidden-band rectangles, clear of the hatching)
  const invK1forTicks = 1 / k1;
  const tickY = yp(Math.max(-invK1forTicks, yMinS)) + 14;
  for (let p = 0; p <= 2; p++) {
    const v = Math.pow(10, p);
    if (v > 1 && v < 100) {
      ctx2.fillText('' + v, xp(v) - 6, tickY);
      ctx2.fillText('-' + v, xp(-v) - 14, tickY);
    }
  }
  // y ticks: ±1, ±10, ±100, ±1000, ±10000
  for (let p = 0; p <= 4; p++) {
    const v = Math.pow(10, p);
    if (v <= 10000) {
      ctx2.fillText('' + v, xp(0) + 4, yp(v) + 4);
      ctx2.fillText('-' + v, xp(0) + 4, yp(-v) + 4);
    }
  }
}