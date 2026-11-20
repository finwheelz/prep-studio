"use client";

/**
 * Small SVG charts for data-interpretation questions, embedded in markdown as a ```chart fence:
 *   {"type": "bar" | "line" | "pie", "title": "...", "unit": "...", "labels": [...], "series": [{"name": "...", "values": [...]}]}
 * DI questions need exact readings, so every bar, point and slice carries its value (as OA charts do).
 * Colours are the validated categorical slots in fixed order (globals.css --series-N), never cycled.
 */
export interface ChartSpec {
  type: "bar" | "line" | "pie";
  title?: string;
  unit?: string;
  labels: string[];
  series: { name: string; values: number[] }[];
}

const W = 520;
const H = 260;
const PAD = { l: 48, r: 12, t: 30, b: 38 };
const color = (i: number) => `rgb(var(--series-${(i % 5) + 1}))`;

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}
const fmt = (v: number) => (Number.isInteger(v) ? v.toLocaleString("en-IN") : v.toFixed(1));

function Legend({ series }: { series: ChartSpec["series"] }) {
  if (series.length < 2) return null;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 px-1 pt-1 text-xs text-muted">
      {series.map((s, i) => (
        <span key={s.name} className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: color(i) }} />
          {s.name}
        </span>
      ))}
    </div>
  );
}

function Axes({ max, unit }: { max: number; unit?: string }) {
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const y = (v: number) => PAD.t + (H - PAD.t - PAD.b) * (1 - v / max);
  return (
    <g>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="rgb(var(--line))" strokeWidth={1} />
          <text x={PAD.l - 6} y={y(t) + 4} textAnchor="end" fontSize={13} fill="rgb(var(--faint))">{fmt(t)}</text>
        </g>
      ))}
      {unit && <text x={PAD.l} y={14} fontSize={13} fill="rgb(var(--faint))">{unit}</text>}
    </g>
  );
}

function Bar({ spec }: { spec: ChartSpec }) {
  const max = niceMax(Math.max(...spec.series.flatMap((s) => s.values)));
  const n = spec.labels.length, k = spec.series.length;
  const band = (W - PAD.l - PAD.r) / n;
  const gap = 2;
  const bw = Math.min(36, (band * 0.7 - gap * (k - 1)) / k);
  const plotH = H - PAD.t - PAD.b;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={describe(spec)}>
      <Axes max={max} unit={spec.unit} />
      {spec.labels.map((lab, i) => {
        const x0 = PAD.l + i * band + (band - (bw * k + gap * (k - 1))) / 2;
        return (
          <g key={lab}>
            {spec.series.map((s, j) => {
              const v = s.values[i];
              const h = (v / max) * plotH;
              const x = x0 + j * (bw + gap);
              return (
                <g key={s.name}>
                  <path d={`M${x},${PAD.t + plotH} V${PAD.t + plotH - h + 3} Q${x},${PAD.t + plotH - h} ${x + 3},${PAD.t + plotH - h} H${x + bw - 3} Q${x + bw},${PAD.t + plotH - h} ${x + bw},${PAD.t + plotH - h + 3} V${PAD.t + plotH} Z`} fill={color(j)}>
                    <title>{`${s.name}, ${lab}: ${fmt(v)}`}</title>
                  </path>
                  <text x={x + bw / 2} y={PAD.t + plotH - h - 4} textAnchor="middle" fontSize={13} fill="rgb(var(--fg))">{fmt(v)}</text>
                </g>
              );
            })}
            <text x={PAD.l + i * band + band / 2} y={H - PAD.b + 16} textAnchor="middle" fontSize={14} fill="rgb(var(--muted))">{lab}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Line({ spec }: { spec: ChartSpec }) {
  const max = niceMax(Math.max(...spec.series.flatMap((s) => s.values)));
  const n = spec.labels.length;
  const plotH = H - PAD.t - PAD.b;
  const x = (i: number) => PAD.l + 16 + (i * (W - PAD.l - PAD.r - 32)) / Math.max(1, n - 1);
  const y = (v: number) => PAD.t + plotH * (1 - v / max);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={describe(spec)}>
      <Axes max={max} unit={spec.unit} />
      {spec.labels.map((lab, i) => (
        <text key={lab} x={x(i)} y={H - PAD.b + 16} textAnchor="middle" fontSize={14} fill="rgb(var(--muted))">{lab}</text>
      ))}
      {spec.series.map((s, j) => (
        <g key={s.name}>
          <polyline points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")} fill="none" stroke={color(j)} strokeWidth={2} strokeLinejoin="round" />
          {s.values.map((v, i) => (
            <g key={i}>
              <circle cx={x(i)} cy={y(v)} r={4} fill={color(j)} stroke="rgb(var(--panel))" strokeWidth={2}>
                <title>{`${s.name}, ${spec.labels[i]}: ${fmt(v)}`}</title>
              </circle>
              <text x={x(i)} y={y(v) + (j % 2 ? 16 : -9)} textAnchor="middle" fontSize={13} fill="rgb(var(--fg))">{fmt(v)}</text>
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}

function Pie({ spec }: { spec: ChartSpec }) {
  const vals = spec.series[0].values;
  const total = vals.reduce((a, b) => a + b, 0);
  const cx = W / 2, cy = H / 2 + 6, r = 84;
  let a0 = -Math.PI / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={describe(spec)}>
      {vals.map((v, i) => {
        const a1 = a0 + (v / total) * 2 * Math.PI;
        const large = a1 - a0 > Math.PI ? 1 : 0;
        const p = `M${cx},${cy} L${cx + r * Math.cos(a0)},${cy + r * Math.sin(a0)} A${r},${r} 0 ${large} 1 ${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} Z`;
        const mid = (a0 + a1) / 2;
        const lx = cx + (r + 16) * Math.cos(mid), ly = cy + (r + 16) * Math.sin(mid);
        const el = (
          <g key={i}>
            <path d={p} fill={color(i)} stroke="rgb(var(--panel))" strokeWidth={2}>
              <title>{`${spec.labels[i]}: ${fmt(v)}${spec.unit ?? ""}`}</title>
            </path>
            <text x={lx} y={ly} textAnchor={Math.cos(mid) >= 0 ? "start" : "end"} dominantBaseline="middle" fontSize={14} fill="rgb(var(--fg))">
              {spec.labels[i]} {fmt(v)}{spec.unit ?? ""}
            </text>
          </g>
        );
        a0 = a1;
        return el;
      })}
    </svg>
  );
}

function describe(spec: ChartSpec) {
  return `${spec.title ?? spec.type + " chart"}. ` + spec.series.map((s) => `${s.name}: ${spec.labels.map((l, i) => `${l} ${s.values[i]}`).join(", ")}`).join("; ");
}

export function MiniChart({ source }: { source: string }) {
  let spec: ChartSpec;
  try {
    spec = JSON.parse(source);
  } catch {
    return <pre>{source}</pre>;
  }
  return (
    <figure className="my-3 rounded border border-line bg-panel p-2 not-prose">
      {spec.title && <figcaption className="px-1 pb-1 text-xs font-medium text-fg">{spec.title}</figcaption>}
      {spec.type === "pie" ? <Pie spec={spec} /> : spec.type === "line" ? <Line spec={spec} /> : <Bar spec={spec} />}
      {spec.type !== "pie" && <Legend series={spec.series} />}
    </figure>
  );
}
