"use client";

import { useState } from "react";
import type { OpenProblem } from "@/lib/types";
import { useStore } from "@/lib/store";
import { useHotkey, useHydrated } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { ProblemPanel } from "@/components/studio/ProblemPanel";
import { SplitLayout } from "@/components/studio/SplitLayout";
import { ModelAnswer, NoteArea } from "./shared";

/** Structured free-response with a self-graded rubric. Used for metric and product-execution questions. */
export function OpenStudio({ problem }: { problem: OpenProblem }) {
  const hydrated = useHydrated();
  const notes = useStore((s) => s.notes);
  const recordSubmit = useStore((s) => s.recordSubmit);
  const [ticks, setTicks] = useState<boolean[]>(() => problem.rubric.map(() => false));
  const [done, setDone] = useState(false);
  const n = ticks.filter(Boolean).length;
  const need = Math.ceil(problem.rubric.length * 0.7);
  const written = problem.sections.filter((s) => (notes[`${problem.id}:${s.id}`]?.trim().length ?? 0) > 20).length;

  const record = () => {
    if (done || !hydrated || written < problem.sections.length) return;
    setDone(true);
    recordSubmit(problem.id, n >= need);
  };
  useHotkey("mod+enter", (e) => {
    e.preventDefault();
    record();
  });

  const right = (
    <div className="h-full flex flex-col bg-panel">
      <div className="shrink-0 h-10 border-b border-line flex items-center gap-3 px-4 text-xs">
        <span className="label">Product framework</span>
        <span className="text-muted">Write each section, then compare</span>
        <span className="ml-auto num text-muted">{hydrated ? written : 0}/{problem.sections.length} sections written</span>
      </div>
      <div className="flex-1 min-h-0 overflow-auto p-4 space-y-5">
        {problem.sections.map((s, i) => {
          const key = `${problem.id}:${s.id}`;
          const has = hydrated && (notes[key]?.trim().length ?? 0) > 20;
          return (
            <section key={s.id}>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="num text-xs text-faint">{i + 1}</span>
                <h2 className="text-sm font-medium">{s.title}</h2>
              </div>
              <p className="text-xs text-muted mb-1.5 ml-4">{s.prompt}</p>
              <div className="ml-4 space-y-2">
                <NoteArea noteKey={key} label={s.title} rows={3} placeholder="Your answer. Saved in this browser." />
                <ModelAnswer text={s.model} hasDraft={has} />
              </div>
            </section>
          );
        })}

        <section className="pane">
          <div className="pane-head">Self-check rubric <span className="text-faint">what an interviewer scores</span><span className="ml-auto num">{n}/{problem.rubric.length}</span></div>
          <ul className="p-2">
            {problem.rubric.map((r, i) => (
              <li key={i}>
                <label className="flex items-start gap-2 px-1.5 py-1 rounded text-sm cursor-pointer hover:bg-inset">
                  <input type="checkbox" className="mt-1 accent-[rgb(var(--fg))]" checked={ticks[i]} disabled={done} onChange={(e) => setTicks((t) => t.map((x, k) => (k === i ? e.target.checked : x)))} />
                  <span>{r}</span>
                </label>
              </li>
            ))}
          </ul>
          <div className="p-3 border-t border-line flex flex-wrap items-center gap-3">
            {done ? (
              <>
                <span className={cn("text-sm font-medium", n >= need ? "text-accent" : "text-danger")}>{n >= need ? "Recorded as solved" : "Recorded as attempted"}</span>
                <span className="text-xs text-muted">Self-graded: {n} of {problem.rubric.length} rubric points (need {need}).</span>
                <button className="btn ml-auto" onClick={() => setDone(false)}>Regrade</button>
              </>
            ) : (
              <>
                <button className="btn-accent" onClick={record} disabled={!hydrated || written < problem.sections.length}>Record self-score</button>
                <span className="text-xs text-muted">{written < problem.sections.length ? "Write every section before scoring yourself." : `Self-graded. ${need} of ${problem.rubric.length} counts as solved.`}</span>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );

  return <SplitLayout id="open" left={<ProblemPanel problem={problem} />} right={right} defaultLeft={36} />;
}
