"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronDown, FlaskConical, X } from "lucide-react";
import type { HypothesisNode, RcaProblem, Verdict } from "@/lib/types";
import { useStore } from "@/lib/store";
import { useHotkey, useHydrated } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { ICON } from "@/components/ui/bits";
import { ProblemPanel } from "@/components/studio/ProblemPanel";
import { SplitLayout } from "@/components/studio/SplitLayout";
import { Clarifications, ModelAnswer, NoteArea } from "./shared";

const VERDICTS: { id: Verdict; label: string }[] = [
  { id: "ruled_out", label: "Ruled out" },
  { id: "contributing", label: "Contributing" },
  { id: "root", label: "Root cause" },
];
const VERDICT_LABEL: Record<Verdict, string> = { ruled_out: "Ruled out", contributing: "Contributing", root: "Root cause" };

interface TreeState {
  tested: string[];
  verdicts: Record<string, Verdict>;
}

function useTreeState(id: string) {
  const hydrated = useHydrated();
  const raw = useStore((s) => s.notes[`${id}:tree`]);
  const setNote = useStore((s) => s.setNote);
  const state: TreeState = hydrated && raw ? JSON.parse(raw) : { tested: [], verdicts: {} };
  const save = (next: TreeState) => setNote(`${id}:tree`, JSON.stringify(next));
  return {
    state,
    test: (leaf: string) => save({ ...state, tested: [...new Set([...state.tested, leaf])] }),
    mark: (leaf: string, v: Verdict) => save({ ...state, verdicts: { ...state.verdicts, [leaf]: v } }),
    reset: () => save({ tested: [], verdicts: {} }),
  };
}

const leavesOf = (nodes: HypothesisNode[]): HypothesisNode[] => nodes.flatMap((n) => (n.children ? leavesOf(n.children) : [n]));

function Leaf({ node, tree, graded }: { node: HypothesisNode; tree: ReturnType<typeof useTreeState>; graded: boolean }) {
  const tested = tree.state.tested.includes(node.id);
  const verdict = tree.state.verdicts[node.id];
  const right = graded && verdict === node.verdict;
  return (
    <div className="pl-3 py-2.5 pr-2.5 border-t border-line first:border-t-0">
      <div className="flex items-start gap-2">
        <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-line-strong shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-sm">{node.label}</div>
          <div className="text-xs text-muted mt-0.5">
            <span className="text-faint">Data to ask for:</span> {node.ask}
          </div>
          {tested ? (
            <p className="mt-1.5 text-sm leading-6 border-l-2 border-line-strong pl-2.5 animate-fade-in">{node.evidence}</p>
          ) : (
            <button className="btn mt-1.5" onClick={() => tree.test(node.id)}>
              <FlaskConical {...ICON} /> Test this hypothesis
            </button>
          )}
          {tested && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded border border-line overflow-hidden" role="radiogroup" aria-label={`Verdict for: ${node.label}`}>
                {VERDICTS.map((v) => (
                  <button
                    key={v.id}
                    role="radio"
                    aria-checked={verdict === v.id}
                    disabled={graded}
                    onClick={() => tree.mark(node.id, v.id)}
                    className={cn("h-6 px-2 text-xs border-r border-line last:border-r-0", verdict === v.id ? "bg-fg text-bg" : "text-muted hover:text-fg")}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
              {graded &&
                (right ? (
                  <span className="inline-flex items-center gap-1 text-xs text-accent"><Check {...ICON} size={13} /> Agreed</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-danger"><X {...ICON} size={13} /> Model: {VERDICT_LABEL[node.verdict!]}</span>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Tree({ nodes, tree, graded }: { nodes: HypothesisNode[]; tree: ReturnType<typeof useTreeState>; graded: boolean }) {
  return (
    <div className="space-y-2">
      {nodes.map((b) => {
        const leaves = leavesOf([b]);
        const done = leaves.filter((l) => tree.state.verdicts[l.id]).length;
        return (
          <Collapsible.Root key={b.id} defaultOpen className="pane">
            <Collapsible.Trigger className="pane-head w-full text-left group hover:bg-inset">
              <ChevronDown {...ICON} className="transition-transform group-data-[state=closed]:-rotate-90" />
              <span className="text-fg font-medium">{b.label}</span>
              <span className="ml-auto num">{done}/{leaves.length} judged</span>
            </Collapsible.Trigger>
            <Collapsible.Content>
              {leaves.map((l) => (
                <Leaf key={l.id} node={l} tree={tree} graded={graded} />
              ))}
            </Collapsible.Content>
          </Collapsible.Root>
        );
      })}
    </div>
  );
}

export function RcaStudio({ problem }: { problem: RcaProblem }) {
  const [step, setStep] = useState(0);
  const [graded, setGraded] = useState<null | { right: number; total: number; pass: boolean }>(null);
  const tree = useTreeState(problem.id);
  const recordSubmit = useStore((s) => s.recordSubmit);
  const notes = useStore((s) => s.notes);
  const hydrated = useHydrated();

  const allLeaves = useMemo(() => leavesOf(problem.tree), [problem]);
  // Step 2 covers measurement + external buckets; step 3 covers everything internal.
  const isExternal = (n: HypothesisNode) => n.id.startsWith("meas") || n.id.startsWith("ext");
  const external = problem.tree.filter(isExternal);
  const internal = problem.tree.filter((n) => !isExternal(n));
  const judged = allLeaves.filter((l) => tree.state.verdicts[l.id]).length;

  const grade = () => {
    const right = allLeaves.filter((l) => tree.state.verdicts[l.id] === l.verdict).length;
    const roots = allLeaves.filter((l) => l.verdict === "root");
    const marked = allLeaves.filter((l) => tree.state.verdicts[l.id] === "root");
    // Pass = you named exactly the root causes. Contributing vs ruled-out slips are shown but do not fail you.
    const pass = roots.every((r) => tree.state.verdicts[r.id] === "root") && marked.length === roots.length;
    setGraded({ right, total: allLeaves.length, pass });
    recordSubmit(problem.id, pass);
  };
  useHotkey("mod+enter", (e) => {
    e.preventDefault();
    if (step === 3 && judged === allLeaves.length && !graded) grade();
  });

  const s = problem.steps[step];
  const noteKey = `${problem.id}:${s.id}`;
  const hasDraft = hydrated && (notes[noteKey]?.trim().length ?? 0) > 20;
  const sc = problem.scenario;

  const right = (
    <div className="h-full flex flex-col bg-panel">
      {/* Scenario card */}
      <div className="shrink-0 border-b border-line">
        <div className="px-4 pt-3 pb-2">
          <div className="label">Scenario</div>
          <div className="text-base font-medium leading-snug">{sc.headline}</div>
        </div>
        <dl className="grid grid-cols-2 lg:grid-cols-4 border-t border-line text-xs">
          {[
            ["Metric", sc.metric],
            ["Change", sc.delta],
            ["Window", sc.window],
            ["Segment", sc.segment],
          ].map(([k, v]) => (
            <div key={k} className="px-4 py-2 border-r border-line last:border-r-0 max-lg:[&:nth-child(2)]:border-r-0 max-lg:[&:nth-child(-n+2)]:border-b">
              <dt className="label">{k}</dt>
              <dd className={cn("mt-0.5 leading-5", k === "Change" && "num text-fg font-medium")}>{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Framework stepper */}
      <ol className="shrink-0 grid grid-cols-4 border-b border-line" aria-label="Framework steps">
        {problem.steps.map((st, i) => (
          <li key={st.id} className="border-r border-line last:border-r-0">
            <button
              onClick={() => setStep(i)}
              aria-current={i === step ? "step" : undefined}
              className={cn("w-full h-10 px-3 flex items-center gap-2 text-xs text-left", i === step ? "bg-inset text-fg" : "text-muted hover:text-fg")}
            >
              <span className={cn("num h-4.5 w-4.5 shrink-0 rounded-full border flex items-center justify-center text-2xs", i === step ? "border-fg text-fg" : i < step ? "border-line-strong text-fg" : "border-line")}>{i + 1}</span>
              <span className="truncate">{st.title}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="flex-1 min-h-0 overflow-auto p-4 space-y-4">
        <p className="text-sm text-muted">{s.prompt}</p>

        {step === 0 && (
          <div>
            <div className="label mb-1.5">Clarifying questions <span className="normal-case tracking-normal text-faint">(the interviewer answers only what you ask)</span></div>
            <Clarifications items={problem.clarifications} storageKey={`${problem.id}:asked`} />
          </div>
        )}
        {step === 1 && <Tree nodes={external} tree={tree} graded={!!graded} />}
        {step === 2 && <Tree nodes={internal} tree={tree} graded={!!graded} />}
        {step === 3 && (
          <div className="pane">
            <div className="pane-head">Hypothesis matrix <span className="ml-auto num">{judged}/{allLeaves.length} judged</span></div>
            <div className="overflow-x-auto">
              <table className="dt">
                <thead>
                  <tr><th>Branch</th><th>Hypothesis</th><th>Tested</th><th>Your verdict</th>{graded && <th>Model</th>}</tr>
                </thead>
                <tbody>
                  {problem.tree.flatMap((b) =>
                    leavesOf([b]).map((l) => {
                      const v = tree.state.verdicts[l.id];
                      return (
                        <tr key={l.id}>
                          <td className="text-muted">{b.label.split(":")[0]}</td>
                          <td className="!whitespace-normal min-w-56">{l.label}</td>
                          <td>{tree.state.tested.includes(l.id) ? <Check {...ICON} size={13} className="text-fg" /> : <span className="text-faint">–</span>}</td>
                          <td className={cn(v === "root" && "text-fg font-medium", !v && "text-faint")}>{v ? VERDICT_LABEL[v] : "Not judged"}</td>
                          {graded && <td className={v === l.verdict ? "text-accent" : "text-danger"}>{VERDICT_LABEL[l.verdict!]}</td>}
                        </tr>
                      );
                    }),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div>
          <div className="label mb-1.5">Your notes for this step</div>
          <NoteArea noteKey={noteKey} label={s.title} rows={step === 3 ? 5 : 3} placeholder="Write what you would say aloud. Saved in this browser." />
        </div>
        <ModelAnswer key={s.id} text={s.model} hasDraft={hasDraft} />

        {step === 3 && (
          <div className="pane p-3 flex flex-wrap items-center gap-3">
            {graded ? (
              <>
                <span className={cn("text-sm font-medium", graded.pass ? "text-accent" : "text-danger")}>{graded.pass ? "Root cause identified" : "Root cause not fully identified"}</span>
                <span className="text-xs text-muted num">{graded.right}/{graded.total} verdicts match the model</span>
                <button
                  className="btn ml-auto"
                  onClick={() => {
                    tree.reset();
                    setGraded(null);
                    setStep(0);
                  }}
                >
                  Reset case
                </button>
              </>
            ) : (
              <>
                <button className="btn-accent" onClick={grade} disabled={judged < allLeaves.length}>
                  Grade my diagnosis
                </button>
                <span className="text-xs text-muted">{judged < allLeaves.length ? `Judge all ${allLeaves.length} hypotheses in steps 2 and 3 first (${allLeaves.length - judged} left).` : "Checks whether you named exactly the root causes."}</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 h-10 border-t border-line flex items-center gap-2 px-3">
        <button className="btn" onClick={() => setStep((n) => n - 1)} disabled={step === 0}>
          <ArrowLeft {...ICON} /> Back
        </button>
        <button className="btn" onClick={() => setStep((n) => n + 1)} disabled={step === 3}>
          Next step <ArrowRight {...ICON} />
        </button>
        <span className="ml-auto text-xs text-faint num">Step {step + 1} of 4</span>
      </div>
    </div>
  );

  return <SplitLayout id="rca" left={<ProblemPanel problem={problem} />} right={right} defaultLeft={34} />;
}
