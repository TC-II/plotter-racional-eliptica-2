// ============================================================
//  LaTeX-style theme constants (black ink on white paper)
// ============================================================
const INK       = '#111111';   // primary line/label ink
const HATCH     = '#9a9a9a';   // gray diagonal hatching for forbidden regions
const HATCH_EDGE= '#555555';   // outline of forbidden regions
const GRIDLINE  = '#dddddd';   // faint grid
const AUX        = '#666666';  // dashed auxiliary lines (unit square)
const SERIF     = 'italic 13px "Latin Modern Roman", Georgia, "Times New Roman", serif';
const SERIF_SM  = 'italic 11px "Latin Modern Roman", Georgia, "Times New Roman", serif';

// ============================================================
//  Complete Elliptic Integral of the First Kind  K(k)
//  via the Arithmetic-Geometric Mean (AGM)
// ============================================================
function ellipticK(k) {
  if (k < 0) k = -k;
  if (k >= 1) return k === 1 ? Infinity : NaN;
  if (k === 0) return Math.PI / 2;
  const tol = 1e-12;
  let a = 1.0;
  let b = Math.sqrt(1 - k * k);
  let c = k;
  while (Math.abs(c) > tol) {
    const a_next = (a + b) / 2;
    const b_next = Math.sqrt(a * b);
    c = (a - b) / 2;
    a = a_next;
    b = b_next;
  }
  return Math.PI / (2 * a);
}

function ellipticKprime(k) {
  const kp = Math.sqrt(1 - k * k);
  return ellipticK(kp);
}

function tau(k) {
  return ellipticKprime(k) / ellipticK(k);
}

function findKFromTau(target, tol) {
  if (target <= 0) return 1.0;
  if (target >= tau(0)) return 0.0;
  let lo = 0.0, hi = 1.0;
  while (tau(hi) > target && hi < 0.999999) {
    hi = (hi + 1.0) / 2;
  }
  for (let iter = 0; iter < 200; iter++) {
    const mid = (lo + hi) / 2;
    const tMid = tau(mid);
    if (Math.abs(tMid - target) < tol) return mid;
    if (tMid > target) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

function jacobiSn(u, k) {
  if (k === 0) return Math.sin(u);
  if (k === 1) return Math.tanh(u);
  if (u === 0) return 0;
  const K = ellipticK(k);
  const q = Math.exp(-Math.PI * ellipticKprime(k) / K);
  const v = Math.PI * u / (2 * K);
  let th1 = 0, th2 = 0, th3 = 0, th4 = 0;
  for (let n = 0; n < 50; n++) {
    const qn1 = Math.pow(q, (n + 0.5) * (n + 0.5));
    const qn2 = Math.pow(q, n * n);
    const sign = (n % 2 === 0) ? 1 : -1;
    th1 += sign * qn1 * Math.sin((2 * n + 1) * v);
    th2 += qn1;
    if (n > 0) { th3 += qn2; th4 += sign * qn2 * Math.cos(2 * n * v); }
    if (qn2 < 1e-16 && qn1 < 1e-16) break;
  }
  th1 *= 2; th2 *= 2; th3 = 1 + 2 * th3; th4 = 1 + 2 * th4;
  return (th3 / th2) * (th1 / th4);
}

// ============================================================
//  Evaluate the rational function R_N(w) from zeros/poles
//  R(w) = G * prod(w^2 - z_i^2) / prod(w^2 - p_i^2)
// ============================================================
function evalRational(w, zeros, poles, G) {
  // zeros/poles arrays hold both +v and -v for each pair; the pair ±v
  // corresponds to a single (w² - v²) factor, so only count positive entries
  // (plus the origin, which is a single simple zero contributing one factor of w).
  let num = G;
  for (let i = 0; i < zeros.length; i++) {
    if (Math.abs(zeros[i]) < 1e-14) {
      num *= w; // single (odd) zero at the origin
    } else if (zeros[i] > 0) {
      num *= (w * w - zeros[i] * zeros[i]); // simple zeros at ±zeros[i]
    }
  }
  let den = 1;
  for (let i = 0; i < poles.length; i++) {
    if (poles[i] > 0) {
      den *= (w * w - poles[i] * poles[i]); // simple poles at ±poles[i]
    }
  }
  return num / den;
}