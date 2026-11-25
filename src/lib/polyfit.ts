import { mulberry32 } from "./utils";

/**
 * Polynomial regression on y = sin(2πx) + noise, x in [0, 1], for the generalisation widgets.
 * Features are Chebyshev polynomials of u = 2x − 1 so degree 12 stays well conditioned.
 */
export const truth = (x: number) => Math.sin(2 * Math.PI * x);
export const SIGMA = 0.3;

export type Sample = { x: number[]; y: number[] };

function normal(r: () => number) {
  return Math.sqrt(-2 * Math.log(r() || 1e-12)) * Math.cos(2 * Math.PI * r());
}

export function sample(n: number, r: () => number, sigma = SIGMA): Sample {
  const x: number[] = [];
  const y: number[] = [];
  // Stratified x (one point per 1/n slice) keeps the demo about model flexibility rather than
  // about lucky gaps in a uniform draw, which make high-degree fits explode.
  for (let i = 0; i < n; i++) {
    const xi = (i + r()) / n;
    x.push(xi);
    y.push(truth(xi) + sigma * normal(r));
  }
  return { x, y };
}

function basis(x: number, d: number) {
  const u = 2 * x - 1;
  const row = [1];
  if (d >= 1) row.push(u);
  for (let k = 2; k <= d; k++) row.push(2 * u * row[k - 1] - row[k - 2]);
  return row;
}

/** Least squares with a tiny ridge so n < d + 1 still has a (near minimum-norm) solution. */
export function fit(s: Sample, d: number, lam = 1e-6): number[] {
  const p = d + 1;
  const A = Array.from({ length: p }, () => new Array(p).fill(0));
  const b = new Array(p).fill(0);
  for (let i = 0; i < s.x.length; i++) {
    const row = basis(s.x[i], d);
    for (let j = 0; j < p; j++) {
      b[j] += row[j] * s.y[i];
      for (let k = 0; k < p; k++) A[j][k] += row[j] * row[k];
    }
  }
  for (let j = 0; j < p; j++) A[j][j] += lam;
  // Gaussian elimination with partial pivoting.
  for (let c = 0; c < p; c++) {
    let piv = c;
    for (let r = c + 1; r < p; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
    [A[c], A[piv]] = [A[piv], A[c]];
    [b[c], b[piv]] = [b[piv], b[c]];
    for (let r = c + 1; r < p; r++) {
      const f = A[r][c] / A[c][c];
      for (let k = c; k < p; k++) A[r][k] -= f * A[c][k];
      b[r] -= f * b[c];
    }
  }
  const w = new Array(p).fill(0);
  for (let r = p - 1; r >= 0; r--) {
    let acc = b[r];
    for (let k = r + 1; k < p; k++) acc -= A[r][k] * w[k];
    w[r] = acc / A[r][r];
  }
  return w;
}

export function predict(w: number[], x: number) {
  const row = basis(x, w.length - 1);
  let v = 0;
  for (let j = 0; j < w.length; j++) v += w[j] * row[j];
  return v;
}

export function mse(w: number[], s: Sample) {
  let e = 0;
  for (let i = 0; i < s.x.length; i++) e += (predict(w, s.x[i]) - s.y[i]) ** 2;
  return e / s.x.length;
}

export const GRID = Array.from({ length: 101 }, (_, i) => i / 100);

/**
 * Monte Carlo over `reps` training sets of size n: average train MSE, average test MSE on a fixed
 * large test set, and the bias² / variance split of the prediction on the grid.
 */
export function decompose(d: number, n: number, reps: number, seed: number) {
  const r = mulberry32(seed);
  const test = sample(400, mulberry32(seed ^ 0x9e3779b9));
  const preds: number[][] = [];
  let train = 0;
  let tst = 0;
  for (let k = 0; k < reps; k++) {
    const s = sample(n, r);
    const w = fit(s, d);
    train += mse(w, s);
    tst += mse(w, test);
    preds.push(GRID.map((x) => predict(w, x)));
  }
  let bias2 = 0;
  let variance = 0;
  for (let g = 0; g < GRID.length; g++) {
    let m = 0;
    for (const p of preds) m += p[g];
    m /= reps;
    bias2 += (m - truth(GRID[g])) ** 2;
    let v = 0;
    for (const p of preds) v += (p[g] - m) ** 2;
    variance += v / reps;
  }
  return { train: train / reps, test: tst / reps, bias2: bias2 / GRID.length, variance: variance / GRID.length, preds };
}
