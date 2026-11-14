"use client";

import { useMemo } from "react";
import type { CompetencyStat } from "@/lib/store";
import { COMPETENCIES } from "@/data/taxonomy";
import { addDays, cn, dayKey } from "@/lib/utils";

/**
 * Readiness radar. One series (syllabus coverage), so no legend: the pane title names it.
 * The table beside it carries the exact numbers; the radar is for shape at a glance.
 */
export function Radar({ stats }: { stats: Record<string, CompetencyStat> }) {
  const W = 300, H = 250, CX = W / 2, C = H / 2, R = 84;
  const n = COMPETENCIES.length;
  const pt = (i: number, f: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [CX + Math.cos(a) * R * f, C + Math.sin(a) * R * f] as const;
  };
  const poly = (f: (i: number) => number) => COMPETENCIES.map((_, i) => pt(i, f(i)).map((v) => v.toFixed(1)).join(",")).join(" ");
  const cov = (i: number) => stats[COMPETENCIES[i].id]?.coverage ?? 0;
  const summary = COMPETENCIES.map((c, i) => `${c.label} ${Math.round(cov(i) * 100)}%`).join(", ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[300px] h-auto mx-auto" role="img" aria-label={`Syllabus coverage by competency: ${summary}.`}>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={poly(() => f)} fill="none" stroke="rgb(var(--line))" strokeWidth={1} />
      ))}
      {COMPETENCIES.map((_, i) => {
        const [x, y] = pt(i, 1);
        return <line key={i} x1={CX} y1={C} x2={x} y2={y} stroke="rgb(var(--line))" strokeWidth={1} />;
      })}
      <text x={CX + 3} y={C - R * 0.5 + 3} className="fill-[rgb(var(--faint))] text-[8px] font-mono">50%</text>
      <text x={CX + 3} y={C - R + 3} className="fill-[rgb(var(--faint))] text-[8px] font-mono">100%</text>
      <polygon points={poly((i) => Math.max(cov(i), 0.02))} fill="rgb(var(--accent) / 0.18)" stroke="rgb(var(--accent))" strokeWidth={2} strokeLinejoin="round" />
      {COMPETENCIES.map((c, i) => {
        const [x, y] = pt(i, Math.max(cov(i), 0.02));
        const [lx, ly] = pt(i, 1.16);
        const s = stats[c.id];
        return (
          <g key={c.id}>
            <circle cx={x} cy={y} r={4} fill="rgb(var(--accent))" stroke="rgb(var(--panel))" strokeWidth={2}>
              <title>{`${c.label}: ${s?.solved ?? 0}/${s?.total ?? 0} solved (${Math.round(cov(i) * 100)}% coverage)`}</title>
            </circle>
            {/* generous invisible hit target */}
            <circle cx={x} cy={y} r={12} fill="transparent">
              <title>{`${c.label}: ${s?.solved ?? 0}/${s?.total ?? 0} solved (${Math.round(cov(i) * 100)}% coverage)`}</title>
            </circle>
            <text x={lx} y={ly + 3} textAnchor={Math.abs(lx - CX) < 8 ? "middle" : lx > CX ? "start" : "end"} className="fill-[rgb(var(--muted))] text-[10px]">
              {c.short}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const LEVELS = ["bg-inset border border-line", "bg-accent/25", "bg-accent/50", "bg-accent/75", "bg-accent"];
const level = (n: number) => (n <= 0 ? 0 : n < 1.5 ? 1 : n < 3 ? 2 : n < 5 ? 3 : 4);

/** GitHub-style activity grid: columns are weeks, rows are weekdays (Mon first). Sequential, one hue. */
export function ActivityMatrix({ activity, weeks = 26 }: { activity: Record<string, number>; weeks?: number }) {
  const { cols, months } = useMemo(() => {
    const today = new Date();
    const dow = (today.getDay() + 6) % 7; // Mon = 0
    const start = addDays(today, -(dow + (weeks - 1) * 7));
    const cols: { key: string; date: Date; future: boolean }[][] = [];
    const months: { col: number; label: string }[] = [];
    let lastMonth = -1;
    for (let w = 0; w < weeks; w++) {
      const col = [];
      for (let d = 0; d < 7; d++) {
        const date = addDays(start, w * 7 + d);
        col.push({ key: dayKey(date), date, future: date > today });
      }
      if (col[0].date.getMonth() !== lastMonth) {
        lastMonth = col[0].date.getMonth();
        months.push({ col: w, label: col[0].date.toLocaleString("en", { month: "short" }) });
      }
      cols.push(col);
    }
    return { cols, months };
  }, [weeks]);
  const total = Math.round(Object.values(activity).reduce((a, b) => a + b, 0));
  const active = Object.values(activity).filter((v) => v > 0).length;

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="inline-block">
          <div className="relative h-4 ml-7" style={{ width: weeks * 13 }}>
            {months.map((m) => (
              <span key={m.col} className="absolute text-2xs text-faint" style={{ left: m.col * 13 }}>
                {m.label}
              </span>
            ))}
          </div>
          <div className="flex gap-[3px]">
            <div className="flex flex-col gap-[3px] w-6 text-2xs text-faint leading-[10px]">
              {["Mon", "", "Wed", "", "Fri", "", ""].map((d, i) => (
                <span key={i} className="h-[10px]">{d}</span>
              ))}
            </div>
            {cols.map((col, i) => (
              <div key={i} className="flex flex-col gap-[3px]">
                {col.map((c) => {
                  const n = Math.round((activity[c.key] ?? 0) * 10) / 10;
                  return c.future ? (
                    <span key={c.key} className="h-[10px] w-[10px]" />
                  ) : (
                    <span
                      key={c.key}
                      className={cn("h-[10px] w-[10px] rounded-[2px]", LEVELS[level(n)])}
                      title={`${c.date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}: ${n} activity point${n === 1 ? "" : "s"} (1 per solved problem, 0.1 per correct quiz answer)`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-2 text-2xs text-faint">
        <span><span className="num text-muted">{total}</span> activity {total === 1 ? "point" : "points"} on <span className="num text-muted">{active}</span> {active === 1 ? "day" : "days"}</span>
        <span className="ml-auto flex items-center gap-1">
          Less
          {LEVELS.map((l, i) => (
            <span key={i} className={cn("h-[10px] w-[10px] rounded-[2px]", l)} />
          ))}
          More
        </span>
      </div>
    </div>
  );
}
