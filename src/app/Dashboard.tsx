"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useStore, competencyStats, streakOf } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { COMPETENCIES } from "@/data/taxonomy";
import { TRACK_META } from "@/data/syllabus";
import { trackProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { Bar } from "@/components/ui/bits";
import { ActivityMatrix, Radar } from "@/components/dashboard/charts";
import { Triad } from "@/components/dashboard/Triad";

export function Dashboard() {
  const hydrated = useHydrated();
  const attemptsRaw = useStore((s) => s.attempts);
  const activityRaw = useStore((s) => s.activity);
  const attempts = hydrated ? attemptsRaw : {};
  const activity = hydrated ? activityRaw : {};
  const stats = useMemo(() => competencyStats(attempts), [attempts]);
  const streak = streakOf(activity);
  const totals = Object.values(stats).reduce((a, s) => ({ solved: a.solved + s.solved, total: a.total + s.total, submits: a.submits + s.submits, passes: a.passes + s.passes }), { solved: 0, total: 0, submits: 0, passes: 0 });
  const quizRaw = useStore((s) => s.quiz);
  const cardsRaw = useStore((s) => s.cards);
  const readRaw = useStore((s) => s.read);
  const coverage = TRACK_META.map((t) => ({ t, p: trackProgress(t.id, hydrated ? readRaw : {}, hydrated ? quizRaw : {}, attempts, hydrated ? cardsRaw : {}) }));
  const dueAll = coverage.reduce((n, c) => n + c.p.cardDue, 0);

  return (
    <div className="max-w-[1200px] mx-auto p-4 space-y-4">
      {/* Row 1: daily target */}
      <section aria-labelledby="h-today">
        <div className="flex items-baseline gap-3 mb-2">
          <h1 id="h-today" className="text-xl font-semibold tracking-tight">Today</h1>
          <span className="text-xs text-muted">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</span>
          <span className="ml-auto text-xs text-muted">One SQL query, one ML concept, one case.</span>
        </div>
        <Triad />
      </section>

      {/* Row 2: readiness */}
      <section aria-labelledby="h-ready" className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3">
        <div className="pane">
          <div className="pane-head">
            <h2 id="h-ready" className="text-fg font-medium">Placement readiness</h2>
            <span>syllabus coverage by competency</span>
            <span className="ml-auto num">{totals.solved}/{totals.total} solved</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr]">
            <div className="p-3 md:border-r border-line flex items-center">
              <Radar stats={stats} />
            </div>
            <div className="overflow-x-auto">
              <table className="dt">
                <thead>
                  <tr>
                    <th>Competency</th>
                    <th className="text-right">Solved</th>
                    <th className="text-right" title="Passing submissions / all graded submissions">Win rate</th>
                    <th className="w-[34%]">Coverage</th>
                    <th className="text-right" />
                  </tr>
                </thead>
                <tbody>
                  {COMPETENCIES.map((c) => {
                    const s = stats[c.id];
                    return (
                      <tr key={c.id}>
                        <td className="text-fg">{c.label}</td>
                        <td className="num text-right">{s?.solved ?? 0}<span className="text-faint">/{s?.total ?? 0}</span></td>
                        <td className="num text-right">{s?.winRate == null ? <span className="text-faint">—</span> : `${Math.round(s.winRate * 100)}%`}</td>
                        <td><Bar value={s?.coverage ?? 0} /></td>
                        <td className="num text-right text-muted">{Math.round((s?.coverage ?? 0) * 100)}%</td>
                      </tr>
                    );
                  })}
                  <tr className="[&>td]:bg-inset">
                    <td className="font-medium">All</td>
                    <td className="num text-right">{totals.solved}<span className="text-faint">/{totals.total}</span></td>
                    <td className="num text-right">{totals.submits ? `${Math.round((totals.passes / totals.submits) * 100)}%` : <span className="text-faint">—</span>}</td>
                    <td><Bar value={totals.total ? totals.solved / totals.total : 0} tone="fg" /></td>
                    <td className="num text-right text-muted">{totals.total ? Math.round((totals.solved / totals.total) * 100) : 0}%</td>
                  </tr>
                </tbody>
              </table>
              {totals.submits === 0 && <p className="px-3 py-2 text-xs text-faint">Nothing submitted yet. Start with today&apos;s three problems; the radar fills in as you solve.</p>}
            </div>
          </div>
        </div>

        <div className="pane lg:w-[400px]">
          <div className="pane-head">
            <h2 className="text-fg font-medium">Activity</h2>
            <span>last 26 weeks</span>
          </div>
          <div className="grid grid-cols-2 border-b border-line">
            <div className="px-3 py-2 border-r border-line">
              <div className="label">Current streak</div>
              <div className="num text-2xl leading-8">{streak.current}<span className="text-sm text-muted ml-1">days</span></div>
            </div>
            <div className="px-3 py-2">
              <div className="label">Longest streak</div>
              <div className="num text-2xl leading-8">{streak.best}<span className="text-sm text-muted ml-1">days</span></div>
            </div>
          </div>
          <div className="p-3">
            <ActivityMatrix activity={activity} />
          </div>
        </div>
      </section>

      {/* Row 3: syllabus coverage by track */}
      <section aria-labelledby="h-tracks" className="pane overflow-x-auto">
        <div className="pane-head">
          <h2 id="h-tracks" className="text-fg font-medium">Syllabus coverage</h2>
          <span>learn, practise and revise by track</span>
          <span className="ml-auto flex gap-2">
            <Link className="btn" href="/quiz/mix-all">Mixed quiz</Link>
            <Link className="btn" href="/revise">Review cards{dueAll ? ` · ${dueAll} due` : ""}</Link>
          </span>
        </div>
        <table className="dt">
          <thead>
            <tr><th>Track</th><th className="text-right">Topics read</th><th>Questions correct</th><th className="text-right">Problems solved</th><th className="text-right">Cards learned</th><th className="text-right">Due</th><th /></tr>
          </thead>
          <tbody>
            {coverage.map(({ t, p }) => (
              <tr key={t.id} className="group">
                <td className="!whitespace-normal min-w-56 py-1.5">
                  <Link href={`/learn?track=${t.id}`} className="text-fg font-medium group-hover:underline underline-offset-2">{t.label}</Link>
                  <div className="text-muted leading-4">{t.blurb}</div>
                </td>
                <td className="num text-right">{p.read}/{p.topics}</td>
                <td className="w-52"><div className="flex items-center gap-2"><Bar value={p.quizTotal ? p.quizRight / p.quizTotal : 0} /><span className="num text-muted w-16 text-right">{p.quizRight}/{p.quizTotal}</span></div></td>
                <td className="num text-right">{p.probTotal ? `${p.probSolved}/${p.probTotal}` : "—"}</td>
                <td className="num text-right">{p.cardSeen}/{p.cardTotal}</td>
                <td className={cn("num text-right", p.cardDue > 0 && "text-warn")}>{p.cardDue}</td>
                <td className="text-right"><Link className="btn" href={`/quiz/mix-${t.id}`}>Quiz</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
