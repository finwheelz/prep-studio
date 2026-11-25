"use client";

import { useMemo, useState } from "react";
import { GRID, SIGMA, decompose, fit, mse, predict, sample, truth } from "@/lib/polyfit";
import { cn, mulberry32 } from "@/lib/utils";
import { GradientDescentLab, ParamSlider, RegularizationLab, Stat, ThresholdLab } from "./labs";

const f3 = (v: number) => (v >= 100 ? v.toExponential(1) : v.toFixed(3));

type Pt = [number, number];

/** Minimal line chart: neutral ink for series, accent only for the current operating point. */
function Plot({ w = 300, h = 200, xr, yr, xlog, lines, dots, vline, hline, xlabel, ylabel, aria }: {
  w?: number; h?: number; xr: [number, number]; yr: [number, number]; xlog?: boolean;
  lines: { pts: Pt[]; dash?: boolean; faint?: boolean; width?: number; label?: string }[];
  dots?: Pt[]; vline?: number; hline?: { y: number; label: string }; xlabel: string; ylabel: string; aria: string;
}) {
  const P = { l: 34, r: 8, t: 18, b: 26 };
  const tx = (v: number) => (xlog ? Math.log(v) - Math.log(xr[0]) : v - xr[0]) / (xlog ? Math.log(xr[1]) - Math.log(xr[0]) : xr[1] - xr[0]);
  const X = (v: number) => P.l + tx(v) * (w - P.l - P.r);
  const Y = (v: number) => P.t + (1 - (Math.min(Math.max(v, yr[0]), yr[1]) - yr[0]) / (yr[1] - yr[0])) * (h - P.t - P.b);
  const path = (pts: Pt[]) => pts.map(([a, b], i) => `${i ? "L" : "M"}${X(a).toFixed(1)},${Y(b).toFixed(1)}`).join("");
  const yt = [yr[0], (yr[0] + yr[1]) / 2, yr[1]];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" role="img" aria-label={aria}>
      {yt.map((v) => (
        <g key={v}>
          <line x1={P.l} x2={w - P.r} y1={Y(v)} y2={Y(v)} stroke="rgb(var(--line))" />
          <text x={P.l - 4} y={Y(v) + 3} textAnchor="end" className="fill-[rgb(var(--faint))] text-[9px] font-mono">{Number(v.toFixed(2))}</text>
        </g>
      ))}
      <text x={(P.l + w - P.r) / 2} y={h - 4} textAnchor="middle" className="fill-[rgb(var(--muted))] text-[9px]">{xlabel}</text>
      <text x={P.l} y={10} className="fill-[rgb(var(--muted))] text-[9px]">{ylabel}</text>
      {hline && (
        <g>
          <line x1={P.l} x2={w - P.r} y1={Y(hline.y)} y2={Y(hline.y)} stroke="rgb(var(--faint))" strokeDasharray="2 3" />
          <text x={w - P.r - 2} y={Y(hline.y) - 3} textAnchor="end" className="fill-[rgb(var(--faint))] text-[9px]">{hline.label}</text>
        </g>
      )}
      {vline !== undefined && <line x1={X(vline)} x2={X(vline)} y1={P.t} y2={h - P.b} stroke="rgb(var(--accent))" strokeWidth={1} />}
      {lines.map((l, i) => (
        <g key={i}>
          <path d={path(l.pts)} fill="none" stroke={l.faint ? "rgb(var(--faint))" : "rgb(var(--fg))"} strokeOpacity={l.faint ? 0.45 : 1} strokeWidth={l.width ?? 1.5} strokeDasharray={l.dash ? "4 3" : undefined} />
          {l.label && l.pts.length > 0 && (
            <text x={X(l.pts[l.pts.length - 1][0]) - 4} y={Y(l.pts[l.pts.length - 1][1]) + (l.dash || Y(l.pts[l.pts.length - 1][1]) < P.t + 12 ? 12 : -4)} textAnchor="end" className="fill-[rgb(var(--muted))] text-[9px]">{l.label}</text>
          )}
        </g>
      ))}
      {dots?.map(([a, b], i) => <circle key={i} cx={X(a)} cy={Y(b)} r={2.5} fill="rgb(var(--panel))" stroke="rgb(var(--fg))" strokeWidth={1.2} />)}
    </svg>
  );
}

const MAXD = 12;

/** Fit polynomials of growing degree to 20 noisy points; refit on fresh samples to see variance. */
export function PolyFitLab() {
  const [d, setD] = useState(3);
  const [seed, setSeed] = useState(7);
  const [many, setMany] = useState(false);
  const s = useMemo(() => sample(20, mulberry32(seed)), [seed]);
  const val = useMemo(() => sample(200, mulberry32(424242)), []);
  const w = useMemo(() => fit(s, d), [s, d]);
  const curves = useMemo(() => Array.from({ length: MAXD + 1 }, (_, k) => decompose(k, 20, 40, 1000 + k)), []);
  const cur = curves[d];
  const trueLine: Pt[] = GRID.map((x) => [x, truth(x)]);
  const fitLine: Pt[] = GRID.map((x) => [x, predict(w, x)]);
  const refits = many ? cur.preds.slice(0, 25).map((p) => ({ pts: GRID.map((x, g) => [x, p[g]] as Pt), faint: true, width: 1 })) : [];
  const tr = mse(w, s);
  const va = mse(w, val);
  const verdict = d <= 2 ? "underfitting: high bias (a sine needs at least a cubic)" : d >= 7 ? "overfitting: variance is now the bigger term" : "close to the best trade-off";

  return (
    <div className="space-y-3">
      <ParamSlider label="Polynomial degree" value={d} min={0} max={MAXD} step={1} onChange={setD} />
      <div className="flex flex-wrap gap-2">
        <button className="btn" onClick={() => setSeed((v) => v + 1)}>Draw a new training sample</button>
        <button className={cn("btn", many && "border-accent text-accent")} onClick={() => setMany((m) => !m)} aria-pressed={many}>{many ? "Hide" : "Show"} 25 fits on fresh samples</button>
      </div>
      <div className="pane grid grid-cols-2 sm:grid-cols-4">
        <Stat label="Train MSE" value={f3(tr)} sub="this sample" />
        <Stat label="Validation MSE" value={f3(va)} sub="200 unseen points" tone={va > 2 * (SIGMA ** 2 + 0.05) ? "danger" : undefined} />
        <Stat label="Bias²" value={f3(cur.bias2)} sub="avg over 40 samples" />
        <Stat label="Variance" value={f3(cur.variance)} sub="avg over 40 samples" />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="pane">
          <div className="pane-head">Data and fit <span className="ml-auto text-faint">dashed = true curve</span></div>
          <Plot xr={[0, 1]} yr={[-2, 2]} xlabel="x" ylabel="y" lines={[...refits, { pts: trueLine, dash: true, faint: true }, { pts: fitLine, width: 2 }]} dots={s.x.map((x, i) => [x, s.y[i]] as Pt)} aria={`Degree ${d} polynomial fitted to 20 points. Train MSE ${f3(tr)}, validation MSE ${f3(va)}.`} />
        </div>
        <div className="pane">
          <div className="pane-head">Expected error vs degree <span className="ml-auto text-faint">dotted = noise σ²</span></div>
          <Plot xr={[0, MAXD]} yr={[0, 0.8]} xlabel="degree" ylabel="MSE" vline={d} hline={{ y: SIGMA ** 2, label: "σ² = 0.09" }}
            lines={[{ pts: curves.map((c, k) => [k, c.test] as Pt), label: "test" }, { pts: curves.map((c, k) => [k, c.train] as Pt), dash: true, label: "train" }]}
            aria="Average train error falls with degree; average test error is U-shaped." />
        </div>
      </div>
      <p className="text-xs text-muted leading-5">
        Degree <span className="num">{d}</span>: {verdict}. Expected test error ≈ bias² + variance + σ² = <span className="num">{f3(cur.bias2)} + {f3(cur.variance)} + 0.090 = {f3(cur.bias2 + cur.variance + SIGMA ** 2)}</span> (Monte Carlo: <span className="num">{f3(cur.test)}</span>). Turn on the 25 refits at degree 1 and at degree 12: one is consistently wrong, the other is wrong in a different way every time.
      </p>
    </div>
  );
}

const SIZES = [5, 8, 12, 16, 20, 30, 45, 70, 100, 150, 200];
const DEGS = [1, 3, 9] as const;

/** Learning curves: average train and validation error as the training set grows. */
export function LearningCurveLab() {
  const [d, setD] = useState<(typeof DEGS)[number]>(1);
  const [ni, setNi] = useState(4);
  const all = useMemo(() => Object.fromEntries(DEGS.map((k) => [k, SIZES.map((n, i) => decompose(k, n, 30, 50 + i * 7 + k))])) as Record<number, ReturnType<typeof decompose>[]>, []);
  const c = all[d];
  const at = c[ni];
  const gap = at.test - at.train;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted w-36">Model</span>
        {DEGS.map((k) => (
          <button key={k} className={cn("btn", d === k && "border-accent text-accent")} aria-pressed={d === k} onClick={() => setD(k)}>
            {k === 1 ? "Line (degree 1)" : k === 3 ? "Cubic (degree 3)" : "Degree 9"}
          </button>
        ))}
      </div>
      <ParamSlider label="Training-set size" value={ni} min={0} max={SIZES.length - 1} step={1} onChange={setNi} format={(i) => `n = ${SIZES[i]}`} />
      <div className="pane grid grid-cols-3">
        <Stat label="Train MSE" value={f3(at.train)} />
        <Stat label="Validation MSE" value={f3(at.test)} />
        <Stat label="Gap" value={f3(gap)} sub={gap > 0.1 ? "variance dominates" : at.test > 0.2 ? "both high: bias" : "small"} />
      </div>
      <div className="pane">
        <div className="pane-head">Learning curve <span className="ml-auto text-faint">average over 30 samples per size · dotted = σ²</span></div>
        <Plot w={620} h={220} xr={[5, 200]} xlog yr={[0, 0.8]} xlabel="training-set size n (log scale)" ylabel="MSE" vline={SIZES[ni]} hline={{ y: SIGMA ** 2, label: "irreducible noise" }}
          lines={[{ pts: c.map((r, i) => [SIZES[i], r.test] as Pt), label: "validation" }, { pts: c.map((r, i) => [SIZES[i], r.train] as Pt), dash: true, label: "train" }]}
          aria={`Learning curve for degree ${d}. At n = ${SIZES[ni]} train MSE ${f3(at.train)}, validation MSE ${f3(at.test)}.`} />
      </div>
      <p className="text-xs text-muted leading-5">
        The line levels off near <span className="num">0.3</span> (bias² ≈ 0.2 plus noise 0.09): train and validation meet well above the noise floor, so more data can&apos;t help. The cubic reaches about σ² by n ≈ 30. Degree 9 has 10 coefficients: its validation error shoots off the chart around n = 8–16, where it can just barely interpolate the points, then falls as data grows.
      </p>
    </div>
  );
}

export const WIDGETS = { "poly-fit": PolyFitLab, "learning-curve": LearningCurveLab, threshold: ThresholdLab, regularization: RegularizationLab, "gradient-descent": GradientDescentLab } as const;
