"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { GuesstimateProblem } from "@/lib/types";
import { useStore } from "@/lib/store";
import { useHotkey, useHydrated } from "@/lib/hooks";
import { cn, fmtInt } from "@/lib/utils";
import { ICON } from "@/components/ui/bits";
import { ProblemPanel } from "@/components/studio/ProblemPanel";
import { SplitLayout } from "@/components/studio/SplitLayout";
import { Clarifications, NoteArea } from "./shared";

interface Row {
  segment: string;
  factors: string;
}
interface Build {
  rows: Row[];
  multiplier: string;
}

/** "300 × 0.8 × 6" or "300*0.8*6" → 1440. Fractions like 1/60 are allowed inside a factor. */
export function evalFactors(s: string): number | null {
  const parts = s.split(/[×x*]/i).map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return null;
  let out = 1;
  for (const p of parts) {
    const m = p.replace(/,/g, "").match(/^(-?\d*\.?\d+)\s*(%)?(?:\s*\/\s*(\d*\.?\d+))?$/);
    if (!m) return null;
    let v = parseFloat(m[1]);
    if (m[2]) v /= 100;
    if (m[3]) v /= parseFloat(m[3]);
    out *= v;
  }
  return Number.isFinite(out) ? out : null;
}

const EMPTY: Build = { rows: [{ segment: "", factors: "" }, { segment: "", factors: "" }], multiplier: "1" };

export function GuesstimateStudio({ problem }: { problem: GuesstimateProblem }) {
  const hydrated = useHydrated();
  const raw = useStore((s) => s.notes[`${problem.id}:build`]);
  const setNote = useStore((s) => s.setNote);
  const recordSubmit = useStore((s) => s.recordSubmit);
  const [revealed, setRevealed] = useState(false);

  const build: Build = hydrated && raw ? JSON.parse(raw) : EMPTY;
  const save = (b: Build) => setNote(`${problem.id}:build`, JSON.stringify(b));
  const setRow = (i: number, patch: Partial<Row>) => save({ ...build, rows: build.rows.map((r, k) => (k === i ? { ...r, ...patch } : r)) });

  const values = build.rows.map((r) => evalFactors(r.factors));
  const sum = values.reduce<number>((a, v) => a + (v ?? 0), 0);
  const mult = evalFactors(build.multiplier) ?? 1;
  const total = sum * mult;
  const filled = build.rows.filter((r, i) => r.segment.trim() && values[i] != null).length;

  const modelRows = problem.model.map((r) => ({ ...r, value: r.factors.reduce((a, b) => a * b, 1) }));
  const modelSum = modelRows.reduce((a, r) => a + r.value, 0);
  const modelTotal = modelSum * (problem.modelMultiplier?.value ?? 1);
  const inRange = total >= problem.range[0] && total <= problem.range[1];

  const compare = () => {
    if (filled < 2 || revealed) return;
    setRevealed(true);
    recordSubmit(problem.id, inRange);
  };
  useHotkey("mod+enter", (e) => {
    e.preventDefault();
    compare();
  });

  const right = (
    <div className="h-full flex flex-col bg-panel">
      <div className="shrink-0 h-10 border-b border-line flex items-center gap-3 px-4 text-xs">
        <span className="label">Approach</span>
        <span className="text-fg">{problem.approach === "supply" ? "Supply-side (capacity → utilisation)" : "Demand-side (population → usage)"}</span>
        <span className="ml-auto text-muted">Estimate in <span className="text-fg">{problem.unit}</span></span>
      </div>
      <div className="flex-1 min-h-0 overflow-auto p-4 space-y-4">
        <section>
          <div className="label mb-1.5">1 · Clarify scope</div>
          <Clarifications items={problem.clarifications} storageKey={`${problem.id}:asked`} />
        </section>

        <section>
          <div className="label mb-1.5">2 · Build your estimate <span className="normal-case tracking-normal text-faint">one row per segment; factors multiply, e.g. 300 × 80% × 6</span></div>
          <div className="pane">
            <table className="dt">
              <thead>
                <tr><th className="w-[34%]">Segment</th><th>Factors</th><th className="text-right w-28">Value</th><th className="w-8" /></tr>
              </thead>
              <tbody>
                {build.rows.map((r, i) => (
                  <tr key={i}>
                    <td className="!p-0"><input aria-label={`Segment ${i + 1}`} value={r.segment} onChange={(e) => setRow(i, { segment: e.target.value })} placeholder="e.g. Pickers" className="w-full h-7 bg-transparent px-2.5 outline-none focus:bg-inset placeholder:text-faint" /></td>
                    <td className="!p-0"><input aria-label={`Factors ${i + 1}`} value={r.factors} onChange={(e) => setRow(i, { factors: e.target.value })} placeholder="200 × 3 × 1/60" className={cn("w-full h-7 bg-transparent px-2.5 font-mono outline-none focus:bg-inset placeholder:text-faint", r.factors && values[i] == null && "text-danger")} /></td>
                    <td className="num text-right">{values[i] != null ? fmtInt(values[i]!) : r.factors ? <span className="text-danger">invalid</span> : "–"}</td>
                    <td className="!px-1">
                      <button aria-label={`Remove row ${i + 1}`} className="btn-ghost w-6 h-6 px-0" onClick={() => save({ ...build, rows: build.rows.filter((_, k) => k !== i) })} disabled={build.rows.length <= 1}>
                        <Trash2 {...ICON} size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="text-muted">Sum of segments</td><td /><td className="num text-right">{fmtInt(sum)}</td><td />
                </tr>
                <tr>
                  <td className="text-muted">Multiplier <span className="text-faint">(shifts, unit conversion)</span></td>
                  <td className="!p-0"><input aria-label="Multiplier" value={build.multiplier} onChange={(e) => save({ ...build, multiplier: e.target.value })} className="w-full h-7 bg-transparent px-2.5 font-mono outline-none focus:bg-inset" /></td>
                  <td className="num text-right">× {mult.toFixed(2)}</td><td />
                </tr>
                <tr className="[&>td]:bg-inset">
                  <td className="font-medium text-fg">Your estimate</td><td className="text-muted">{problem.unit}</td><td className="num text-right text-base text-fg">{fmtInt(total)}</td><td />
                </tr>
              </tbody>
            </table>
          </div>
          <button className="btn mt-2" onClick={() => save({ ...build, rows: [...build.rows, { segment: "", factors: "" }] })}>
            <Plus {...ICON} /> Add segment
          </button>
        </section>

        <section>
          <div className="label mb-1.5">3 · Sanity check</div>
          <NoteArea noteKey={`${problem.id}:sanity`} label="Sanity check" rows={2} placeholder="Cross-check with a second method or a per-unit ratio. Which assumption swings the answer most?" />
        </section>

        <section className="pane">
          <div className="p-3 flex flex-wrap items-center gap-3">
            {revealed ? (
              <>
                <span className={cn("text-sm font-medium", inRange ? "text-accent" : "text-danger")}>{inRange ? "Within the plausible range" : "Outside the plausible range"}</span>
                <span className="text-xs text-muted num">yours {fmtInt(total)} · model {fmtInt(modelTotal)} · range {fmtInt(problem.range[0])}–{fmtInt(problem.range[1])}</span>
                <button className="btn ml-auto" onClick={() => setRevealed(false)}>Hide model</button>
              </>
            ) : (
              <>
                <button className="btn-accent" onClick={compare} disabled={filled < 2}>Compare with model build</button>
                <span className="text-xs text-muted">{filled < 2 ? "Fill at least two segments first." : "The range is wide on purpose: the structure is what gets scored."}</span>
              </>
            )}
          </div>
          {revealed && (
            <div className="border-t border-line animate-fade-in">
              <table className="dt">
                <thead><tr><th>Segment</th><th>Assumption</th><th className="text-right">Value</th></tr></thead>
                <tbody>
                  {modelRows.map((r) => (
                    <tr key={r.segment}><td>{r.segment}</td><td className="!whitespace-normal text-muted">{r.assumption}</td><td className="num text-right">{fmtInt(r.value)}</td></tr>
                  ))}
                  {problem.modelMultiplier && (
                    <tr><td className="text-muted">Multiplier</td><td className="!whitespace-normal text-muted">{problem.modelMultiplier.label}</td><td className="num text-right">× {problem.modelMultiplier.value.toFixed(2)}</td></tr>
                  )}
                  <tr className="[&>td]:bg-inset"><td className="font-medium">Model estimate</td><td className="text-muted">{problem.unit}</td><td className="num text-right text-fg">{fmtInt(modelTotal)}</td></tr>
                </tbody>
              </table>
              <p className="p-3 text-sm leading-6 border-t border-line">{problem.sanity}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );

  return <SplitLayout id="guess" left={<ProblemPanel problem={problem} />} right={right} defaultLeft={34} />;
}
