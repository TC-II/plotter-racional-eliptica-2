// ============================================================
//  Main: computation pipeline, orchestration, event listeners
// ============================================================

function resizeAllCanvases() {
  [TEMPLATE_W, TEMPLATE_H] = resizeCanvasToDisplay(templateCanvas);
  [PLOT_W,     PLOT_H    ] = resizeCanvasToDisplay(canvas);
  [SYMLOG_W,   SYMLOG_H  ] = resizeCanvasToDisplay(canvas2);
}

function update() {
  resizeAllCanvases();
  const Gp  = parseFloat(gpSlider.value);
  const Ga  = parseFloat(gaSlider.value);
  const Wan = parseFloat(wanSlider.value);

  gpVal.textContent = Gp.toFixed(2);
  gaVal.textContent = Ga.toFixed(2);
  wanVal.textContent = Wan.toFixed(2);
  gpExact.textContent = `= ${Gp}`;
  gaExact.textContent = `= ${Ga}`;
  wanExact.textContent = `= ${Wan}`;

  drawTemplate(Gp, Ga, Wan);

  const k2 = 1 / Wan;
  const epsSq  = 1 / (Gp * Gp) - 1;  // ε²  = 1/Gp² − 1 (passband ripple factor)
  const epsASq = 1 / (Ga * Ga) - 1;  // εA² = 1/Ga² − 1 (stopband ripple factor)
  const k1sq = epsSq / epsASq;
  const k1 = Math.sqrt(k1sq);

  k1El.textContent = formatVal(k1);
  k2El.textContent = formatVal(k2);

  const L1  = ellipticK(k1);
  const L2  = ellipticK(k2);
  const Li1 = ellipticKprime(k1);
  const Li2 = ellipticKprime(k2);

  L1El.textContent  = formatVal(L1);
  L2El.textContent  = formatVal(L2);
  Li1El.textContent = formatVal(Li1);
  Li2El.textContent = formatVal(Li2);

  const ratio = (Li1 / Li2) * (L2 / L1);
  ratioEl.textContent = formatShort(ratio);

  const N = Math.ceil(ratio);
  NEl.textContent = isFinite(N) ? N : (N === N ? '∞' : 'N/A');

  // Clear R_N(w) plots up front; only populated inside the valid branch below.
  const _dpr = window.devicePixelRatio || 1;
  ctx.setTransform(_dpr, 0, 0, _dpr, 0, 0);
  ctx2.setTransform(_dpr, 0, 0, _dpr, 0, 0);
  ctx.clearRect(0, 0, PLOT_W, PLOT_H);
  ctx2.clearRect(0, 0, SYMLOG_W, SYMLOG_H);

  if (isFinite(N) && N > 0 && k2 > 0 && isFinite(k1) && k1 > 0 && k1 < 1) {
    const targetTau = N * tau(k2);
    const k1dot = findKFromTau(targetTau, 1e-10);
    const L1dot = ellipticK(k1dot);
    const Li1dot = ellipticKprime(k1dot);
    const M = N * L1dot / L2;

    k1dotEl.textContent = k1dot.toFixed(6);
    L1dotEl.textContent = formatVal(L1dot);
    Li1dotEl.textContent = formatVal(Li1dot);
    MEl.textContent = formatVal(M);

    // ---- Build zeros and poles ----
    const isOdd = (N % 2 === 1);
    let zeros = [];  // all distinct zero values (including negatives)
    let poles = [];  // all distinct pole values

    if (isOdd) {
      zeros.push(0);  // origin zero
      const nPos = (N - 1) / 2;
      for (let m = 1; m <= nPos; m++) {
        const arg = 2 * m * L2 / N;
        const z = jacobiSn(arg, k2);
        zeros.push(z);
        zeros.push(-z);
      }
    } else {
      const nPos = N / 2;
      for (let m = 1; m <= nPos; m++) {
        const arg = (2 * m - 1) * L2 / N;
        const z = jacobiSn(arg, k2);
        zeros.push(z);
        zeros.push(-z);
      }
    }

    // Poles: for each positive zero, Wp = 1 / (k2 * Wz)
    for (let i = 0; i < zeros.length; i++) {
      if (zeros[i] > 1e-14) {
        const p = 1 / (k2 * zeros[i]);
        poles.push(p);
        poles.push(-p);
      }
    }

    // ---- Display zeros ----
    let zHtml = '';
    for (let i = 0; i < zeros.length; i++) {
      const z = zeros[i];
      zHtml += '<div class="item">' + (Math.abs(z) < 1e-14 ? '0' : formatShort(z)) + '</div>';
    }
    zerosListEl.innerHTML = zHtml;
    zerosBox.style.display = 'block';

    // ---- Display poles ----
    let pHtml = '';
    for (let i = 0; i < poles.length; i++) {
      pHtml += '<div class="item">' + formatShort(poles[i]) + '</div>';
    }
    polesListEl.innerHTML = pHtml;
    polesBox.style.display = 'block';

    // ---- Compute gain G so that R(1) = 1 ----
    let numG = 1, denG = 1;
    for (let i = 0; i < zeros.length; i++) {
      if (zeros[i] > 1e-14) denG *= (1 - zeros[i] * zeros[i]);
    }
    for (let i = 0; i < poles.length; i++) {
      if (poles[i] > 1e-14) numG *= (1 - poles[i] * poles[i]);
    }
    const G = numG / denG;

    // ---- Overlay the actual filter magnitude response on the template ----
    drawTemplateResponse(zeros, poles, G, epsSq, Wan);

    // ---- Build factored form string ----
    let funcStr = 'R<sub>N</sub>(w) = ' + formatShort(G);
    if (isOdd) {
      funcStr += ' · w';
    }
    for (let i = 0; i < zeros.length; i++) {
      if (Math.abs(zeros[i]) < 1e-14) continue;
      if (zeros[i] > 0) {
        const zs = formatShort(Math.abs(zeros[i]));
        funcStr += ' · (w² − ' + zs + '²)';
      }
    }
    funcStr += ' /';
    let firstPole = true;
    for (let i = 0; i < poles.length; i++) {
      if (poles[i] > 0) {
        const ps = formatShort(Math.abs(poles[i]));
        funcStr += (firstPole ? '' : ' ·') + ' (w² − ' + ps + '²)';
        firstPole = false;
      }
    }
    funcStrEl.innerHTML = funcStr;
    funcBox.style.display = 'block';

    // ---- Fig. 2: linear plot ----
    drawLinearPlot(zeros, poles, G);

    // ---- Fig. 3: Symlog Plot (x: -10..10, y: -10000..10000) ----
    drawSymlogPlot(zeros, poles, G, k1, k2);

  } else {
    k1dotEl.textContent = '—';
    L1dotEl.textContent = '—';
    Li1dotEl.textContent = '—';
    MEl.textContent = '—';
    zerosBox.style.display = 'none';
    polesBox.style.display = 'none';
    funcBox.style.display = 'none';

    ctx.fillStyle = AUX;
    ctx.font = SERIF;
    ctx.fillText('invalid parameters (need Gp > Ga)', 24, canvas.height / 2);
    ctx2.fillStyle = AUX;
    ctx2.font = SERIF;
    ctx2.fillText('invalid parameters (need Gp > Ga)', 24, canvas2.height / 2);
  }
}

// ---- Initialize everything ----
function main() {
  initUI();

  gpSlider.addEventListener('input', update);
  gaSlider.addEventListener('input', update);
  wanSlider.addEventListener('input', update);

  // Observe layout changes and redraw
  const _ro = new ResizeObserver(() => { resizeAllCanvases(); update(); syncVSliderAlignment(); });
  _ro.observe(templateCanvas);
  _ro.observe(canvas);
  _ro.observe(canvas2);

  window.addEventListener('resize', syncVSliderAlignment);

  update();
  syncVSliderAlignment();
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}