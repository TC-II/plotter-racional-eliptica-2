// ============================================================
//  Canvas helpers
// ============================================================

function drawHatchedRect(ctx, x0, y0, x1, y1, spacing, color) {
  // x0,y0 = top-left pixel; x1,y1 = bottom-right pixel
  const left = Math.min(x0, x1), right = Math.max(x0, x1);
  const top = Math.min(y0, y1), bottom = Math.max(y0, y1);
  ctx.save();
  ctx.beginPath();
  ctx.rect(left, top, right - left, bottom - top);
  ctx.clip();
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.6;
  const h = bottom - top;
  for (let d = -h; d <= (right - left); d += spacing) {
    ctx.beginPath();
    ctx.moveTo(left + d, bottom);
    ctx.lineTo(left + d + h, top);
    ctx.stroke();
  }
  ctx.restore();
}

// Draw a line segment with an arrowhead at (x2,y2) — LaTeX axis style.
function drawAxisArrow(ctx, x1, y1, x2, y2) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.stroke();
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const len = 7, spread = 0.38;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - len * Math.cos(ang - spread), y2 - len * Math.sin(ang - spread));
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - len * Math.cos(ang + spread), y2 - len * Math.sin(ang + spread));
  ctx.stroke();
}

// ---- High-DPI canvas: match the canvas pixel buffer to its actual rendered size ×dpr ----
// Returns [logicalW, logicalH] that drawing code should use as coordinate space.
function resizeCanvasToDisplay(c) {
  const dpr  = window.devicePixelRatio || 1;
  const rect = c.getBoundingClientRect();
  const physW = Math.round(rect.width  * dpr);
  const physH = Math.round(rect.height * dpr);
  if (c.width !== physW || c.height !== physH) {
    c.width  = physW;
    c.height = physH;
  }
  return [rect.width, rect.height];  // logical CSS-pixel dimensions
}

// ------------------------------------------------------------
//  Region overlay for R_N(w) plots: a small dashed box at ±1,
//  plus hatched forbidden bands where |w| > 1/k2 and |R(w)| < 1/k1.
// ------------------------------------------------------------
function drawRegionOverlay(c, xToPixel, yToPixel, xMin, xMax, yMin, yMax, k1, k2, margin, W, H) {
  const invK1 = 1 / k1;
  const invK2 = 1 / k2;

  // Small dashed box at (-1,-1)..(1,1)
  if (xMin < 1 && xMax > -1 && yMin < 1 && yMax > -1) {
    const bx0 = xToPixel(Math.max(-1, xMin));
    const bx1 = xToPixel(Math.min(1, xMax));
    const by0 = yToPixel(Math.min(1, yMax));
    const by1 = yToPixel(Math.max(-1, yMin));
    c.strokeStyle = AUX;
    c.lineWidth = 0.9;
    c.setLineDash([4, 3]);
    c.strokeRect(bx0, by0, bx1 - bx0, by1 - by0);
    c.setLineDash([]);
  }

  // Forbidden bands: |w| > 1/k2 with |R(w)| < 1/k1 (insufficient stopband attenuation)
  if (isFinite(invK1) && isFinite(invK2)) {
    const yTopVal = Math.min(invK1, yMax);
    const yBotVal = Math.max(-invK1, yMin);
    const by0 = yToPixel(yTopVal);
    const by1 = yToPixel(yBotVal);

    if (invK2 < xMax) {
      const rx0 = xToPixel(Math.max(invK2, xMin));
      const rx1 = xToPixel(xMax);
      drawHatchedRect(c, rx0, by0, rx1, by1, 8, HATCH);
      // Border: only top, bottom, and left edges (omit right-most edge)
      c.strokeStyle = HATCH_EDGE;
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(rx0, by0); c.lineTo(rx0, by1); // left
      c.moveTo(rx0, by0); c.lineTo(rx1, by0); // top
      c.moveTo(rx0, by1); c.lineTo(rx1, by1); // bottom
      c.stroke();
      c.fillStyle = '#000000';
      c.font = 'italic 9px "Latin Modern Roman", Georgia, serif';
      c.textAlign = 'left';
      c.fillText('1/k₁', rx1 + 4, by0 + 3);
      c.fillText('1/k₁', rx1 + 4, by1 + 3);
      c.fillText('1/k₂', rx0 + 4, yToPixel(0) + 14);
    }
    if (-invK2 > xMin) {
      const rx0 = xToPixel(xMin);
      const rx1 = xToPixel(Math.min(-invK2, xMax));
      drawHatchedRect(c, rx0, by0, rx1, by1, 8, HATCH);
      // Border: only top, bottom, and right edges (omit left-most edge)
      c.strokeStyle = HATCH_EDGE;
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(rx1, by0); c.lineTo(rx1, by1); // right
      c.moveTo(rx0, by0); c.lineTo(rx1, by0); // top
      c.moveTo(rx0, by1); c.lineTo(rx1, by1); // bottom
      c.stroke();
      c.fillStyle = '#000000';
      c.font = 'italic 9px "Latin Modern Roman", Georgia, serif';
      c.textAlign = 'right';
      c.fillText('1/k₁', rx0 - 4, by0 + 3);
      c.fillText('1/k₁', rx0 - 4, by1 + 3);
      c.fillText('-1/k₂', rx1 - 4, yToPixel(0) + 14);
      c.textAlign = 'left';
    }
  }
}