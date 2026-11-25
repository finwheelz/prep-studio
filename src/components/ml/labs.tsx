"use client";

import * as Slider from "@radix-ui/react-slider";
import { useMemo, useState, type ReactNode } from "react";
import { cn, fmtInt, mulberry32 } from "@/lib/utils";

/**
 * Chart conventions for the labs: one measure per plot, neutral ink for data, the accent only
 * for the current operating point (a state, not a series), recessive axes, direct labels.
 * Where two series share a plot they differ by fill (solid vs outlined), not by hue alone.
 */

export function ParamSlider({ label, value, min, max, step, onChange, format }: { label: ReactNode; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format?: (v: number) => string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-xs text-muted w-36 shrink-0">{label}</div>
      <Slider.Root className="relative flex items-center h-5 flex-1 touch-none select-none" value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)}>
        <Slider.Track className="relative h-1 grow rounded-full bg-inset border border-line">
          <Slider.Range className="absolute h-full rounded-full bg-fg/60" />
        </Slider.Track>
        <Slider.Thumb className="block h-3.5 w-3.5 rounded-full bg-fg border-2 border-panel shadow focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent" aria-label={typeof label === "string" ? label : "parameter"} />
      </Slider.Root>
      <div className="num text-xs text-fg w-16 text-right">{format ? format(value) : value}</div>
    </div>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "accent" | "danger" }) {
  return (
    <div className="px-3 py-2 border-r border-line last:border-r-0 min-w-0">
      <div className="label">{label}</div>
      <div className={cn("num text-lg leading-6", tone === "accent" && "text-accent", tone === "danger" && "text-danger")}>{value}</div>
      {sub && <div className="text-2xs text-faint truncate">{sub}</div>}
    </div>
  );
}

// ───────────────────────── Threshold lab ─────────────────────────

const C_FN = 5000;
const C_FP = 100;

function useFraudScores() {
  return useMemo(() => {
    const r = mulberry32(20261113);
    // Box-Muller normals, clamped to (0, 1). Fraud scores centre high, genuine scores low, with real overlap.
    const z = () => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());
    const clamp = (v: number) => Math.min(0.999, Math.max(0.001, v));
    const pos: number[] = [];
    const neg: number[] = [];
    for (let i = 0; i < 200; i++) pos.push(clamp(0.6 + 0.2 * z()));
    for (let i = 0; i < 9800; i++) neg.push(clamp(0.15 + 0.11 * z()));
    return { pos, neg };
  }, []);
}

export function ThresholdLab() {
  const { pos, neg } = useFraudScores();
  const [t, setT] = useState(0.5);

  const at = (th: number) => {
    const tp = pos.filter((s) => s >= th).length;
    const fp = neg.filter((s) => s >= th).length;
    const fn = pos.length - tp;
    const tn = neg.length - fp;
    const precision = tp + fp ? tp / (tp + fp) : 0;
    const recall = tp / pos.length;
    const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
    return { tp, fp, fn, tn, precision, recall, f1, acc: (tp + tn) / 10000, cost: fn * C_FN + fp * C_FP };
  };
  const curve = useMemo(() => Array.from({ length: 99 }, (_, i) => ({ th: (i + 1) / 100, ...at((i + 1) / 100) })), [pos, neg]); // eslint-disable-line react-hooks/exhaustive-deps
  const best = curve.reduce((a, b) => (b.cost < a.cost ? b : a));
  const bestF1 = curve.reduce((a, b) => (b.f1 > a.f1 ? b : a));
  const m = at(t);

  const W = 520, H = 170, P = { l: 44, r: 12, t: 14, b: 22 };
  const maxCost = Math.max(...curve.map((c) => c.cost));
  const x = (th: number) => P.l + th * (W - P.l - P.r);
  const y = (c: number) => P.t + (1 - c / maxCost) * (H - P.t - P.b);
  const path = curve.map((c, i) => `${i ? "L" : "M"}${x(c.th).toFixed(1)},${y(c.cost).toFixed(1)}`).join(" ");

  return (
    <div className="space-y-3">
      <ParamSlider label="Decision threshold" value={t} min={0.01} max={0.99} step={0.01} onChange={setT} format={(v) => v.toFixed(2)} />
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-3">
        <div className="pane">
          <div className="pane-head">Confusion matrix <span className="text-faint">10,000 transactions</span></div>
          <table className="text-xs num">
            <tbody>
              <tr>
                <td className="p-2" />
                <td className="p-2 text-muted text-center border-b border-line">Predicted fraud</td>
                <td className="p-2 text-muted text-center border-b border-line">Predicted genuine</td>
              </tr>
              <tr>
                <td className="p-2 text-muted border-r border-line">Actual fraud</td>
                <td className="p-2 text-center w-28"><div className="text-lg text-fg">{m.tp}</div><div className="text-2xs text-faint">TP</div></td>
                <td className="p-2 text-center w-28 bg-danger/10"><div className="text-lg text-danger">{m.fn}</div><div className="text-2xs text-faint">FN · ₹{fmtInt(m.fn * C_FN)}</div></td>
              </tr>
              <tr>
                <td className="p-2 text-muted border-r border-line">Actual genuine</td>
                <td className="p-2 text-center bg-warn/10"><div className="text-lg text-warn">{fmtInt(m.fp)}</div><div className="text-2xs text-faint">FP · ₹{fmtInt(m.fp * C_FP)}</div></td>
                <td className="p-2 text-center"><div className="text-lg text-fg">{fmtInt(m.tn)}</div><div className="text-2xs text-faint">TN</div></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="pane min-w-0">
          <div className="pane-head">Total cost by threshold <span className="text-faint">₹5,000 per miss, ₹100 per false alarm</span></div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`Cost curve. Minimum ₹${fmtInt(best.cost)} at threshold ${best.th.toFixed(2)}. Current ₹${fmtInt(m.cost)} at ${t.toFixed(2)}.`}>
            {[0, 0.5, 1].map((f) => (
              <g key={f}>
                <line x1={P.l} x2={W - P.r} y1={y(maxCost * f)} y2={y(maxCost * f)} stroke="rgb(var(--line))" strokeWidth={1} />
                <text x={P.l - 6} y={y(maxCost * f) + 3} textAnchor="end" className="fill-[rgb(var(--faint))] text-[9px] font-mono">{f === 0 ? "0" : `₹${(maxCost * f / 1e5).toFixed(1)}L`}</text>
              </g>
            ))}
            {[0, 0.25, 0.5, 0.75, 1].map((f) => (
              <text key={f} x={x(f)} y={H - 6} textAnchor="middle" className="fill-[rgb(var(--faint))] text-[9px] font-mono">{f.toFixed(2)}</text>
            ))}
            <path d={path} fill="none" stroke="rgb(var(--fg))" strokeWidth={2} strokeLinejoin="round" />
            {/* minimum-cost marker, direct-labelled */}
            <line x1={x(best.th)} x2={x(best.th)} y1={P.t} y2={H - P.b} stroke="rgb(var(--line-strong))" strokeDasharray="3 3" />
            <text x={x(best.th) + 4} y={P.t + 8} className="fill-[rgb(var(--muted))] text-[9px]">min cost at {best.th.toFixed(2)}</text>
            {/* current operating point */}
            <line x1={x(t)} x2={x(t)} y1={P.t} y2={H - P.b} stroke="rgb(var(--accent))" strokeWidth={1} />
            <circle cx={x(t)} cy={y(m.cost)} r={4.5} fill="rgb(var(--accent))" stroke="rgb(var(--panel))" strokeWidth={2} />
          </svg>
        </div>
      </div>
      <div className="pane grid grid-cols-3 sm:grid-cols-6">
        <Stat label="Precision" value={m.precision.toFixed(3)} />
        <Stat label="Recall" value={m.recall.toFixed(3)} />
        <Stat label="F1" value={m.f1.toFixed(3)} sub={`max ${bestF1.f1.toFixed(3)} at ${bestF1.th.toFixed(2)}`} />
        <Stat label="Accuracy" value={(m.acc * 100).toFixed(1) + "%"} sub="98.0% if you flag nothing" />
        <Stat label="Total cost" value={`₹${fmtInt(m.cost)}`} tone={m.cost <= best.cost * 1.05 ? "accent" : undefined} sub={`min ₹${fmtInt(best.cost)}`} />
        <Stat label="Flagged" value={fmtInt(m.tp + m.fp)} sub="sent to review" />
      </div>
      <p className="text-xs text-muted leading-5">
        The F1-optimal threshold ({bestF1.th.toFixed(2)}) sits above the cost-optimal one ({best.th.toFixed(2)}). F1 weighs both errors equally; here a miss costs 50× a false alarm, so the
        cost curve prefers flagging more. Operating at the F1 optimum instead would cost ₹{fmtInt(at(bestF1.th).cost - best.cost)} more on this sample.
        These scores are not calibrated probabilities, so the empirical minimum differs from the closed-form <span className="num">t* ≈ 0.02</span>; with calibrated scores they coincide.
      </p>
    </div>
  );
}

// ───────────────────────── Regularisation lab ─────────────────────────

const OLS = [2.4, -1.6, 0.9, 0.45, -0.25, 0.1];

export function RegularizationLab() {
  const [lam, setLam] = useState(0.3);
  const ridge = OLS.map((b) => b / (1 + lam));
  const lasso = OLS.map((b) => Math.sign(b) * Math.max(Math.abs(b) - lam, 0));
  const zeros = lasso.filter((b) => b === 0).length;
  const W = 520, H = 190, P = { l: 30, r: 10, t: 12, b: 24 };
  const band = (W - P.l - P.r) / OLS.length;
  const y = (v: number) => P.t + ((2.6 - v) / 5.2) * (H - P.t - P.b);
  const bw = 16;

  return (
    <div className="space-y-3">
      <ParamSlider label={<>Penalty strength λ</>} value={lam} min={0} max={3} step={0.05} onChange={setLam} format={(v) => v.toFixed(2)} />
      <div className="pane">
        <div className="pane-head">
          Coefficients
          <span className="ml-auto flex items-center gap-3">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-fg" /> Ridge (L2)</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border-[1.5px] border-fg" /> Lasso (L1)</span>
            <span className="flex items-center gap-1.5"><span className="h-px w-3 bg-faint" /> OLS</span>
          </span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`Ridge and lasso coefficients at lambda ${lam.toFixed(2)}. Lasso has set ${zeros} of 6 to zero.`}>
          {[-2, -1, 0, 1, 2].map((v) => (
            <g key={v}>
              <line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} stroke={v === 0 ? "rgb(var(--line-strong))" : "rgb(var(--line))"} />
              <text x={P.l - 6} y={y(v) + 3} textAnchor="end" className="fill-[rgb(var(--faint))] text-[9px] font-mono">{v}</text>
            </g>
          ))}
          {OLS.map((b, i) => {
            const cx = P.l + band * (i + 0.5);
            const bar = (v: number, dx: number, filled: boolean) => {
              const top = Math.min(y(v), y(0));
              const h = Math.max(Math.abs(y(v) - y(0)), v === 0 ? 0 : 1);
              return (
                <rect x={cx + dx} y={top} width={bw} height={h} rx={2} fill={filled ? "rgb(var(--fg))" : "rgb(var(--panel))"} stroke="rgb(var(--fg))" strokeWidth={filled ? 0 : 1.5}>
                  <title>{`${filled ? "Ridge" : "Lasso"} β${i + 1} = ${v.toFixed(3)} (OLS ${b})`}</title>
                </rect>
              );
            };
            return (
              <g key={i}>
                {bar(ridge[i], -bw - 1, true)}
                {bar(lasso[i], 1, false)}
                <line x1={cx - bw - 4} x2={cx + bw + 4} y1={y(b)} y2={y(b)} stroke="rgb(var(--faint))" strokeWidth={1} />
                {lasso[i] === 0 && <text x={cx + 1 + bw / 2} y={y(0) + (b > 0 ? -4 : 10)} textAnchor="middle" className="fill-[rgb(var(--muted))] text-[9px] font-mono">0</text>}
                <text x={cx} y={H - 8} textAnchor="middle" className="fill-[rgb(var(--muted))] text-[10px] font-mono">β{i + 1}</text>
              </g>
            );
          })}
        </svg>
        <table className="dt num border-t border-line">
          <thead>
            <tr><th>Method</th>{OLS.map((_, i) => <th key={i} className="text-right">β{i + 1}</th>)}<th className="text-right">Zeros</th></tr>
          </thead>
          <tbody>
            <tr><td className="text-muted">OLS</td>{OLS.map((b, i) => <td key={i} className="text-right">{b.toFixed(2)}</td>)}<td className="text-right">0</td></tr>
            <tr><td className="text-muted">Ridge</td>{ridge.map((b, i) => <td key={i} className="text-right">{b.toFixed(2)}</td>)}<td className="text-right">0</td></tr>
            <tr><td className="text-muted">Lasso</td>{lasso.map((b, i) => <td key={i} className={cn("text-right", b === 0 && "text-faint")}>{b.toFixed(2)}</td>)}<td className="text-right text-fg">{zeros}</td></tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted leading-5">Ridge divides every coefficient by <span className="num">1 + λ = {(1 + lam).toFixed(2)}</span>, so none reaches zero. Lasso subtracts <span className="num">λ = {lam.toFixed(2)}</span> from each magnitude and stops at zero: {zeros} of 6 features are out of the model.</p>
    </div>
  );
}

// ───────────────────────── Gradient descent lab ─────────────────────────

export function GradientDescentLab() {
  const [eta, setEta] = useState(0.1);
  const steps = 12;
  const ws = useMemo(() => {
    const a = [4];
    for (let i = 0; i < steps; i++) a.push(a[i] * (1 - 2 * eta));
    return a;
  }, [eta]);
  const mult = 1 - 2 * eta;
  const status = Math.abs(mult) >= 1 ? (Math.abs(mult) === 1 ? "Stuck: bounces between ±4" : "Diverges") : mult < 0 ? "Converges, alternating sign" : "Converges monotonically";
  const diverges = Math.abs(mult) >= 1;
  const W = 520, H = 190, P = { l: 30, r: 10, t: 10, b: 22 };
  const X = 6;
  const x = (w: number) => P.l + ((w + X) / (2 * X)) * (W - P.l - P.r);
  const y = (f: number) => P.t + (1 - Math.min(f, 36) / 36) * (H - P.t - P.b);
  const parab = Array.from({ length: 121 }, (_, i) => {
    const w = -X + (i / 120) * 2 * X;
    return `${i ? "L" : "M"}${x(w).toFixed(1)},${y(w * w).toFixed(1)}`;
  }).join(" ");
  const vis = ws.filter((w) => Math.abs(w) <= X);

  return (
    <div className="space-y-3">
      <ParamSlider label={<>Learning rate η</>} value={eta} min={0.01} max={1.2} step={0.01} onChange={setEta} format={(v) => v.toFixed(2)} />
      <div className="pane">
        <div className="pane-head">
          f(w) = w², start w₀ = 4
          <span className={cn("ml-auto font-medium", diverges ? "text-danger" : "text-accent")}>{status}</span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`Gradient descent path with learning rate ${eta.toFixed(2)}: ${status}.`}>
          <line x1={P.l} x2={W - P.r} y1={y(0)} y2={y(0)} stroke="rgb(var(--line-strong))" />
          {[-4, -2, 0, 2, 4].map((v) => (
            <text key={v} x={x(v)} y={H - 6} textAnchor="middle" className="fill-[rgb(var(--faint))] text-[9px] font-mono">{v}</text>
          ))}
          <path d={parab} fill="none" stroke="rgb(var(--line-strong))" strokeWidth={1.5} />
          <polyline points={vis.map((w) => `${x(w).toFixed(1)},${y(w * w).toFixed(1)}`).join(" ")} fill="none" stroke="rgb(var(--fg))" strokeWidth={1} strokeDasharray="3 3" />
          {vis.map((w, i) => (
            <circle key={i} cx={x(w)} cy={y(w * w)} r={i === 0 ? 4.5 : 3.5} fill={i === 0 ? "rgb(var(--fg))" : "rgb(var(--accent))"} stroke="rgb(var(--panel))" strokeWidth={2}>
              <title>{`step ${ws.indexOf(w)}: w = ${w.toFixed(4)}`}</title>
            </circle>
          ))}
          <text x={x(4) + 8} y={y(16) + 3} className="fill-[rgb(var(--muted))] text-[9px]">w₀</text>
        </svg>
        <div className="border-t border-line overflow-x-auto">
          <table className="dt num">
            <thead><tr><th>t</th>{ws.slice(0, 9).map((_, i) => <th key={i} className="text-right">{i}</th>)}</tr></thead>
            <tbody><tr><td className="text-muted">w</td>{ws.slice(0, 9).map((w, i) => <td key={i} className="text-right">{Math.abs(w) > 9999 ? w.toExponential(1) : w.toFixed(3)}</td>)}</tr></tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-muted leading-5">Each step multiplies w by <span className="num">1 − 2η = {mult.toFixed(2)}</span>. Inside (−1, 1) it converges; negative values overshoot the minimum every step; at or beyond ±1 it never settles.</p>
    </div>
  );
}

// ───────────────────────── A/B sample-size lab ─────────────────────────

const Z_ALPHA: Record<string, number> = { "0.10": 1.645, "0.05": 1.96, "0.01": 2.576 };
const Z_POWER: Record<string, number> = { "0.80": 0.8416, "0.90": 1.2816, "0.95": 1.645 };

function NumField({ label, value, onChange, suffix, step = 1, min = 0 }: { label: string; value: number; onChange: (v: number) => void; suffix?: string; step?: number; min?: number }) {
  return (
    <label className="block">
      <div className="label mb-1">{label}</div>
      <div className="flex items-center h-7 rounded border border-line bg-bg focus-within:border-line-strong">
        <input type="number" value={Number.isFinite(value) ? value : ""} min={min} step={step} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full bg-transparent px-2 text-xs num outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
        {suffix && <span className="px-2 text-xs text-faint">{suffix}</span>}
      </div>
    </label>
  );
}

function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: T[]; onChange: (v: T) => void }) {
  return (
    <div>
      <div className="label mb-1">{label}</div>
      <div className="inline-flex rounded border border-line overflow-hidden" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button key={o} role="radio" aria-checked={o === value} onClick={() => onChange(o)} className={cn("h-7 px-2.5 text-xs num border-r border-line last:border-r-0", o === value ? "bg-inset text-fg" : "text-muted hover:text-fg")}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AbLab() {
  const [base, setBase] = useState(10);
  const [lift, setLift] = useState(5);
  const [alpha, setAlpha] = useState("0.05");
  const [power, setPower] = useState("0.80");
  const [traffic, setTraffic] = useState(40000);

  const p1 = base / 100;
  const p2 = p1 * (1 + lift / 100);
  const delta = p2 - p1;
  const valid = p1 > 0 && p2 < 1 && delta > 0 && traffic > 0;
  const z = Z_ALPHA[alpha] + Z_POWER[power];
  const n = valid ? Math.ceil((z * z * (p1 * (1 - p1) + p2 * (1 - p2))) / (delta * delta)) : NaN;
  const rule = valid ? Math.ceil((16 * p1 * (1 - p1)) / (delta * delta)) : NaN;
  const days = valid ? Math.ceil((2 * n) / traffic) : NaN;
  const weeks = valid ? Math.max(1, Math.ceil(days / 7)) : NaN;

  // Sensitivity: sample size at other detectable lifts, same settings.
  const lifts = [2, 3, 5, 8, 10, 15, 20];
  const rows = lifts.map((l) => {
    const q2 = p1 * (1 + l / 100);
    const d = q2 - p1;
    const nn = Math.ceil((z * z * (p1 * (1 - p1) + q2 * (1 - q2))) / (d * d));
    return { l, n: nn, days: Math.ceil((2 * nn) / traffic) };
  });
  const maxN = Math.max(...rows.map((r) => r.n));

  return (
    <div className="space-y-3">
      <div className="pane p-3 grid grid-cols-2 md:grid-cols-5 gap-3">
        <NumField label="Baseline rate" value={base} onChange={setBase} suffix="%" step={0.5} />
        <NumField label="Relative lift (MDE)" value={lift} onChange={setLift} suffix="%" step={0.5} />
        <NumField label="Sessions / day" value={traffic} onChange={setTraffic} step={1000} />
        <Seg label="Significance α" value={alpha} options={["0.10", "0.05", "0.01"]} onChange={setAlpha} />
        <Seg label="Power 1 − β" value={power} options={["0.80", "0.90", "0.95"]} onChange={setPower} />
      </div>
      {valid ? (
        <>
          <div className="pane grid grid-cols-2 sm:grid-cols-4">
            <Stat label="Per arm" value={fmtInt(n)} sub={`rule of thumb ${fmtInt(rule)}`} />
            <Stat label="Total" value={fmtInt(2 * n)} sub="two arms, 50/50" />
            <Stat label="Days of traffic" value={String(days)} sub={`${p1 * 100}% → ${(p2 * 100).toFixed(2)}%`} />
            <Stat label="Run for" value={`${weeks} wk`} tone="accent" sub="whole weeks only" />
          </div>
          <div className="pane">
            <div className="pane-head">Sample per arm by detectable lift <span className="text-faint">halving the lift roughly quadruples the sample</span></div>
            <table className="dt num">
              <thead><tr><th>Relative lift</th><th className="text-right">Per arm</th><th className="w-1/2" /><th className="text-right">Days</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.l} className={cn(r.l === lift && "[&>td]:bg-inset")}>
                    <td>{r.l}%</td>
                    <td className="text-right">{fmtInt(r.n)}</td>
                    <td><div className="h-1.5 rounded-sm bg-fg/70" style={{ width: `${Math.max(1, (r.n / maxN) * 100)}%` }} title={`${fmtInt(r.n)} per arm`} /></td>
                    <td className="text-right">{r.days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="pane p-3 text-xs text-danger">Enter a baseline between 0 and 100%, a positive lift, and daily traffic above zero.</div>
      )}
    </div>
  );
}
