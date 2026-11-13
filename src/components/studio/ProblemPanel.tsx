"use client";

import * as Tabs from "@radix-ui/react-tabs";
import * as Collapsible from "@radix-ui/react-collapsible";
import Link from "next/link";
import { ChevronRight, KeyRound, Link2, Lock } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { Dataset, Problem } from "@/lib/types";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { categoryById, TRACKS } from "@/data/taxonomy";
import { KIND_LABEL } from "@/data/problems";
import { DifficultyBadge, ICON, SourceTag, StatusDot, Tag } from "@/components/ui/bits";
import { Md } from "@/components/ui/Md";
import { cn } from "@/lib/utils";

export function SchemaViewer({ dataset }: { dataset: Dataset }) {
  return (
    <div className="space-y-4">
      {dataset.tables.map((t) => (
        <div key={t.name} className="pane">
          <div className="pane-head">
            <span className="font-mono text-fg">{t.name}</span>
            <span className="truncate">{t.description}</span>
          </div>
          <table className="dt">
            <thead>
              <tr>
                <th>Column</th>
                <th>Type</th>
                <th>Key</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {t.columns.map((c) => (
                <tr key={c.name}>
                  <td className="font-mono text-fg">{c.name}</td>
                  <td className="font-mono text-muted">{c.type}</td>
                  <td>
                    {c.key === "PK" && (
                      <span className="inline-flex items-center gap-1 text-fg">
                        <KeyRound {...ICON} size={12} /> PK
                      </span>
                    )}
                    {c.key === "FK" && (
                      <span className="inline-flex items-center gap-1 text-muted">
                        <Link2 {...ICON} size={12} /> FK <span className="font-mono text-faint">→ {c.ref}</span>
                      </span>
                    )}
                  </td>
                  <td className="text-muted !whitespace-normal">{c.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function HintLadder({ hints }: { hints: string[] }) {
  const [shown, setShown] = useState(0);
  return (
    <div className="mt-5">
      <div className="label mb-1.5">Hints</div>
      <ol className="space-y-1.5">
        {hints.slice(0, shown).map((h, i) => (
          <li key={i} className="flex gap-2 text-sm">
            <span className="num text-faint shrink-0">{i + 1}.</span>
            <span>{h}</span>
          </li>
        ))}
      </ol>
      {shown < hints.length ? (
        <button className="btn mt-2" onClick={() => setShown((s) => s + 1)}>
          Show hint {shown + 1} of {hints.length}
        </button>
      ) : (
        <div className="text-xs text-faint mt-2">No more hints.</div>
      )}
    </div>
  );
}

export interface ExtraTab {
  id: string;
  label: string;
  content: ReactNode;
}

/**
 * Left pane of every workspace: header + Description / (extra tabs) / Interview context.
 * `solution` is gated: visible once solved, or after an explicit reveal.
 */
export function ProblemPanel({ problem, extraTabs = [], solution }: { problem: Problem; extraTabs?: ExtraTab[]; solution?: ReactNode }) {
  const hydrated = useHydrated();
  const attempt = useStore((s) => s.attempts[problem.id]);
  const [revealed, setRevealed] = useState(false);
  const cat = categoryById(problem.category);
  const solved = hydrated && attempt?.status === "solved";

  return (
    <Tabs.Root defaultValue="desc" className="h-full flex flex-col bg-panel">
      <div className="px-4 pt-3 pb-2 border-b border-line shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-muted mb-1.5">
          <Link href={`/problems?pillar=${problem.pillar}`} className="hover:text-fg">
            {KIND_LABEL[problem.kind]}
          </Link>
          <ChevronRight {...ICON} size={12} className="text-faint" />
          <Link href={`/problems?category=${encodeURIComponent(problem.category)}`} className="hover:text-fg truncate">
            {cat?.label}
          </Link>
        </div>
        <h1 className="text-lg font-semibold leading-snug tracking-tight flex items-start gap-2">
          <span className="mt-1.5 shrink-0">{hydrated && <StatusDot status={attempt?.status} />}</span>
          {problem.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2">
          <DifficultyBadge d={problem.difficulty} />
          <SourceTag source={problem.source} />
          {problem.tracks.map((t) => (
            <Tag key={t}>{TRACKS.find((x) => x.id === t)?.label}</Tag>
          ))}
          <span className="text-xs text-muted" title="Your passing submissions / all your graded submissions on this problem. Stored in this browser.">
            Your pass rate{" "}
            <span className="num text-fg">{hydrated && attempt?.submits ? `${Math.round((attempt.passes / attempt.submits) * 100)}%` : "—"}</span>
            {hydrated && attempt?.submits ? <span className="num text-faint"> ({attempt.passes}/{attempt.submits})</span> : null}
          </span>
          <span className="text-xs text-muted">
            Target <span className="num text-fg">{problem.targetMin} min</span>
          </span>
        </div>
      </div>

      <Tabs.List className="flex border-b border-line px-1 shrink-0 overflow-x-auto" aria-label="Problem sections">
        <Tabs.Trigger value="desc" className="tab">Description</Tabs.Trigger>
        {extraTabs.map((t) => (
          <Tabs.Trigger key={t.id} value={t.id} className="tab">
            {t.label}
          </Tabs.Trigger>
        ))}
        <Tabs.Trigger value="ctx" className="tab">Interview context</Tabs.Trigger>
        {solution && <Tabs.Trigger value="sol" className="tab">Solution</Tabs.Trigger>}
      </Tabs.List>

      <div className="flex-1 min-h-0 overflow-auto">
        <Tabs.Content value="desc" className="p-4 outline-none">
          <Md source={problem.statement} />
          {problem.constraints && (
            <>
              <div className="label mt-4 mb-1.5">Constraints</div>
              <ul className="space-y-1 text-sm">
                {problem.constraints.map((c, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-faint">–</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {"sample" in problem && problem.sample && (
            <>
              <div className="label mt-4 mb-1.5">Sample</div>
              <div className="pane">
                <div className="grid grid-cols-[72px_1fr] text-xs">
                  <div className="px-2.5 py-1.5 text-muted border-b border-r border-line bg-inset">Input</div>
                  <pre className="px-2.5 py-1.5 font-mono border-b border-line whitespace-pre-wrap">{problem.sample.input}</pre>
                  <div className="px-2.5 py-1.5 text-muted border-r border-line bg-inset">Output</div>
                  <pre className="px-2.5 py-1.5 font-mono overflow-x-auto">{problem.sample.output}</pre>
                </div>
              </div>
            </>
          )}
          <div className="flex flex-wrap gap-1.5 mt-4">
            {problem.tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
          {problem.hints && problem.hints.length > 0 && <HintLadder hints={problem.hints} />}
        </Tabs.Content>

        {extraTabs.map((t) => (
          <Tabs.Content key={t.id} value={t.id} className="p-4 outline-none">
            {t.content}
          </Tabs.Content>
        ))}

        <Tabs.Content value="ctx" className="p-4 outline-none space-y-5">
          <section>
            <div className="label mb-1.5">Why interviewers ask this</div>
            <p className="text-sm leading-6">{problem.context.why}</p>
            {problem.source.kind === "reported" && (
              <div className="mt-2">
                <SourceTag source={problem.source} withRound />
              </div>
            )}
          </section>
          <section>
            <div className="label mb-1.5">Common traps</div>
            <ul className="space-y-1.5 text-sm">
              {problem.context.traps.map((x, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-danger shrink-0">×</span>
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <div className="label mb-1.5">Follow-up variations</div>
            <Collapsible.Root defaultOpen>
              <Collapsible.Content>
                <ul className="space-y-1.5 text-sm">
                  {problem.context.followUps.map((x, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-faint shrink-0">→</span>
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
              </Collapsible.Content>
            </Collapsible.Root>
          </section>
        </Tabs.Content>

        {solution && (
          <Tabs.Content value="sol" className="p-4 outline-none">
            {solved || revealed ? (
              solution
            ) : (
              <div className={cn("pane p-4 flex flex-col items-start gap-2")}>
                <div className="flex items-center gap-2 text-sm">
                  <Lock {...ICON} /> The reference solution unlocks when all tests pass.
                </div>
                <p className="text-xs text-muted">Revealing it early is fine for revision, but the attempt is the part that sticks.</p>
                <button className="btn" onClick={() => setRevealed(true)}>
                  Reveal anyway
                </button>
              </div>
            )}
          </Tabs.Content>
        )}
      </div>
    </Tabs.Root>
  );
}
