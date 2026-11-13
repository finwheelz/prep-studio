"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, ChevronRight, Clock, X } from "lucide-react";
import type { Check as CheckT, ConceptProblem, DerivationStep, PipelineStep } from "@/lib/types";
import { useStore } from "@/lib/store";
import { useHotkey, useIsMac } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { ICON, Kbd } from "@/components/ui/bits";
import { Md, Tex } from "@/components/ui/Md";
import { ProblemPanel } from "@/components/studio/ProblemPanel";
import { SplitLayout } from "@/components/studio/SplitLayout";
import { AbLab, GradientDescentLab, RegularizationLab, ThresholdLab } from "./labs";

const LABS = {
  threshold: ThresholdLab,
  regularization: RegularizationLab,
  "gradient-descent": GradientDescentLab,
  "ab-sample-size": AbLab,
} as const;

// ───────────────────────── Pipeline walkthrough ─────────────────────────

function Pipeline({ title, steps }: { title: string; steps: PipelineStep[] }) {
  const [i, setI] = useState(0);
  const [seen, setSeen] = useState<Set<number>>(new Set([0]));
  const go = (n: number) => {
    const k = Math.max(0, Math.min(steps.length - 1, n));
    setI(k);
    setSeen((s) => new Set(s).add(k));
  };
  const s = steps[i];
  return (
    <div
      className="space-y-3 outline-none"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(i + 1);
        if (e.key === "ArrowLeft") go(i - 1);
      }}
      aria-label={`${title}. Use left and right arrow keys to step.`}
    >
      <div className="flex items-center justify-between">
        <div className="label">{title}</div>
        <div className="text-xs text-faint num">{seen.size}/{steps.length} stages visited</div>
      </div>
      <ol className="flex flex-wrap items-center gap-y-2">
        {steps.map((st, k) => (
          <li key={st.id} className="flex items-center">
            <button
              onClick={() => go(k)}
              aria-current={k === i ? "step" : undefined}
              className={cn(
                "h-8 px-2.5 rounded border text-xs flex items-center gap-1.5 transition-colors",
                k === i ? "border-fg bg-inset text-fg" : seen.has(k) ? "border-line-strong text-fg" : "border-line text-muted hover:text-fg",
              )}
            >
              <span className="num text-faint">{k + 1}</span>
              {st.label}
            </button>
            {k < steps.length - 1 && <ChevronRight {...ICON} size={13} className="mx-0.5 text-faint" />}
          </li>
        ))}
      </ol>
      <div className="pane">
        <div className="pane-head">
          <span className="num text-faint">{i + 1}</span>
          <span className="text-fg font-medium">{s.label}</span>
          {s.latency && (
            <span className="ml-auto inline-flex items-center gap-1 num">
              <Clock {...ICON} size={12} /> {s.latency}
            </span>
          )}
        </div>
        <div className="p-3 space-y-3">
          <div>
            <div className="label mb-1">What it does</div>
            <p className="text-sm">{s.role}</p>
          </div>
          <div>
            <div className="label mb-1">What matters</div>
            <p className="text-sm leading-6">{s.detail}</p>
          </div>
          <div className="rounded border border-warn/40 bg-warn/10 p-2.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-warn mb-0.5">
              <AlertTriangle {...ICON} size={13} /> How it fails
            </div>
            <p className="text-sm">{s.failure}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 h-10 border-t border-line">
          <button className="btn" onClick={() => go(i - 1)} disabled={i === 0}>
            <ArrowLeft {...ICON} /> Previous
          </button>
          <button className="btn" onClick={() => go(i + 1)} disabled={i === steps.length - 1}>
            Next <ArrowRight {...ICON} />
          </button>
          <span className="ml-auto text-2xs text-faint flex items-center gap-1"><Kbd>←</Kbd><Kbd>→</Kbd> step</span>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── Derivation ─────────────────────────

function Derivation({ title, steps }: { title: string; steps: DerivationStep[] }) {
  const [shown, setShown] = useState(1);
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="label">{title}</div>
        {shown < steps.length && (
          <button className="btn-ghost h-6" onClick={() => setShown(steps.length)}>
            Show all
          </button>
        )}
      </div>
      <ol className="pane divide-y divide-line">
        {steps.slice(0, shown).map((s, i) => (
          <li key={i} className="p-3 grid grid-cols-[20px_1fr] gap-x-2 animate-fade-in">
            <span className="num text-xs text-faint pt-0.5">{i + 1}</span>
            <div className="min-w-0">
              <p className="text-sm leading-6">{s.say}</p>
              {s.tex && <Tex block tex={s.tex} className="text-fg" />}
            </div>
          </li>
        ))}
      </ol>
      {shown < steps.length && (
        <button className="btn mt-2" onClick={() => setShown((n) => n + 1)}>
          Next step <span className="num text-faint">{shown}/{steps.length}</span>
        </button>
      )}
    </div>
  );
}

// ───────────────────────── Checks ─────────────────────────

export function isCorrect(c: CheckT, v: string | number | undefined): boolean {
  if (v === undefined || v === "") return false;
  if (c.type === "mcq") return Number(v) === c.answer;
  const n = parseFloat(String(v).replace(/[,₹%\s]/g, ""));
  return Number.isFinite(n) && Math.abs(n - c.answer) <= c.tol + 1e-9;
}

export function Checks({ checks, onGraded }: { checks: CheckT[]; onGraded: (allCorrect: boolean, right: number) => void }) {
  const [ans, setAns] = useState<Record<string, string | number>>({});
  const [graded, setGraded] = useState(false);
  const mac = useIsMac();
  const answered = checks.filter((c) => ans[c.id] !== undefined && ans[c.id] !== "").length;
  const right = checks.filter((c) => isCorrect(c, ans[c.id])).length;

  const grade = () => {
    if (answered < checks.length) return;
    setGraded(true);
    onGraded(right === checks.length, right);
  };
  useHotkey("mod+enter", (e) => {
    e.preventDefault();
    grade();
  });

  return (
    <div className="space-y-3">
      {checks.map((c, i) => {
        const ok = graded && isCorrect(c, ans[c.id]);
        return (
          <fieldset key={c.id} className={cn("pane", graded && (ok ? "border-accent/50" : "border-danger/50"))}>
            <legend className="sr-only">Question {i + 1}</legend>
            <div className="p-3">
              <div className="flex gap-2 text-sm">
                <span className="num text-faint shrink-0">{i + 1}.</span>
                <div className="min-w-0 flex-1">
                  <Md source={c.prompt} className="[&_p]:mb-0" />
                </div>
                {graded && (ok ? <Check {...ICON} size={16} className="text-accent shrink-0" aria-label="Correct" /> : <X {...ICON} size={16} className="text-danger shrink-0" aria-label="Incorrect" />)}
              </div>
              {c.type === "mcq" ? (
                <div className="mt-2 ml-5 grid gap-1">
                  {c.options.map((o, k) => {
                    const sel = ans[c.id] === k;
                    const showRight = graded && k === c.answer;
                    return (
                      <label key={k} className={cn("flex items-start gap-2 px-2 py-1.5 rounded border text-sm cursor-pointer", sel ? "border-line-strong bg-inset" : "border-transparent hover:bg-inset/60", showRight && "border-accent/60", graded && sel && k !== c.answer && "border-danger/60")}>
                        <input type="radio" name={c.id} className="mt-1 accent-[rgb(var(--fg))]" checked={sel} disabled={graded} onChange={() => setAns((a) => ({ ...a, [c.id]: k }))} />
                        <span>{o}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-2 ml-5 flex items-center gap-2">
                  <input
                    inputMode="decimal"
                    value={ans[c.id] ?? ""}
                    disabled={graded}
                    onChange={(e) => setAns((a) => ({ ...a, [c.id]: e.target.value }))}
                    placeholder="Your answer"
                    aria-label={`Answer to question ${i + 1}`}
                    className="h-7 w-40 rounded border border-line bg-bg px-2 text-xs num outline-none focus:border-line-strong"
                  />
                  {c.unit && <span className="text-xs text-faint">{c.unit}</span>}
                  {graded && !ok && <span className="text-xs text-muted">Answer: <span className="num text-fg">{c.answer}</span></span>}
                </div>
              )}
              {graded && <p className="mt-2 ml-5 text-xs text-muted leading-5">{c.explain}</p>}
            </div>
          </fieldset>
        );
      })}
      <div className="flex items-center gap-2 sticky bottom-0 bg-panel py-2 border-t border-line -mx-4 px-4">
        {graded ? (
          <>
            <span className={cn("text-sm font-medium", right === checks.length ? "text-accent" : "text-fg")}>
              {right}/{checks.length} correct
            </span>
            <button
              className="btn"
              onClick={() => {
                setGraded(false);
                setAns({});
              }}
            >
              Try again
            </button>
          </>
        ) : (
          <>
            <button className="btn-accent" onClick={grade} disabled={answered < checks.length}>
              Check answers
            </button>
            <span className="text-xs text-faint num">{answered}/{checks.length} answered</span>
            <span className="ml-auto text-2xs text-faint flex items-center gap-1"><Kbd>{mac ? "⌘" : "Ctrl"}</Kbd><Kbd>↵</Kbd></span>
          </>
        )}
      </div>
    </div>
  );
}

// ───────────────────────── Canvas ─────────────────────────

export function ConceptCanvas({ problem }: { problem: ConceptProblem }) {
  const recordSubmit = useStore((s) => s.recordSubmit);
  const Lab = problem.lab !== "none" ? LABS[problem.lab] : null;
  const first = Lab ? "lab" : problem.pipeline ? "pipeline" : problem.derivation ? "derivation" : "checks";
  const [tab, setTab] = useState(first);
  const [score, setScore] = useState<number | null>(null);
  useEffect(() => setTab(first), [problem.id, first]);

  const right = (
    <Tabs.Root value={tab} onValueChange={setTab} className="h-full flex flex-col bg-panel">
      <Tabs.List className="flex border-b border-line px-1 shrink-0 h-10 items-end overflow-x-auto" aria-label="Workspace">
        {Lab && <Tabs.Trigger value="lab" className="tab">Lab</Tabs.Trigger>}
        {problem.pipeline && <Tabs.Trigger value="pipeline" className="tab">Pipeline</Tabs.Trigger>}
        {problem.derivation && <Tabs.Trigger value="derivation" className="tab">Derivation</Tabs.Trigger>}
        <Tabs.Trigger value="checks" className="tab">
          Checks
          <span className={cn("ml-1.5 num", score === problem.checks.length ? "text-accent" : "text-faint")}>{score ?? 0}/{problem.checks.length}</span>
        </Tabs.Trigger>
      </Tabs.List>
      <div className="flex-1 min-h-0 overflow-auto">
        {Lab && (
          <Tabs.Content value="lab" className="p-4 outline-none">
            <Lab />
          </Tabs.Content>
        )}
        {problem.pipeline && (
          <Tabs.Content value="pipeline" className="p-4 outline-none">
            <Pipeline {...problem.pipeline} />
          </Tabs.Content>
        )}
        {problem.derivation && (
          <Tabs.Content value="derivation" className="p-4 outline-none">
            <Derivation {...problem.derivation} />
          </Tabs.Content>
        )}
        <Tabs.Content value="checks" className="px-4 pt-4 outline-none">
          <Checks
            key={problem.id}
            checks={problem.checks}
            onGraded={(all, right) => {
              setScore(right);
              recordSubmit(problem.id, all);
            }}
          />
        </Tabs.Content>
      </div>
    </Tabs.Root>
  );

  return <SplitLayout id="concept" left={<ProblemPanel problem={problem} />} right={right} defaultLeft={36} />;
}
