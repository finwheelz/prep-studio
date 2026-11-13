"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { TrackId } from "@/lib/types";
import { useStore, competencyStats, streakOf } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { COMPANIES, COMPETENCIES, TRACKS } from "@/data/taxonomy";
import { PROBLEMS, KIND_LABEL } from "@/data/problems";
import { cn } from "@/lib/utils";
import { Bar, DifficultyBadge, SourceTag, StatusDot } from "@/components/ui/bits";
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
  const [track, setTrack] = useState<TrackId>("fintech");

  const totals = Object.values(stats).reduce((a, s) => ({ solved: a.solved + s.solved, total: a.total + s.total, submits: a.submits + s.submits, passes: a.passes + s.passes }), { solved: 0, total: 0, submits: 0, passes: 0 });
  const trackProblems = PROBLEMS.filter((p) => p.tracks.includes(track));
  const trackCompanies = COMPANIES.filter((c) => c.tracks.includes(track));
  const trackSolved = trackProblems.filter((p) => attempts[p.id]?.status === "solved").length;

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

      {/* Row 3: company tracks */}
      <section aria-labelledby="h-tracks" className="pane">
        <div className="pane-head h-auto py-2 flex-wrap">
          <h2 id="h-tracks" className="text-fg font-medium mr-2">Company tracks</h2>
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Tracks">
            {TRACKS.map((t) => (
              <button key={t.id} role="tab" aria-selected={track === t.id} onClick={() => setTrack(t.id)} className={cn("h-6 px-2 rounded border text-xs whitespace-nowrap", track === t.id ? "border-fg bg-fg text-bg" : "border-line text-muted hover:text-fg")}>
                {t.label}
              </button>
            ))}
          </div>
          <span className="ml-auto num">{trackSolved}/{trackProblems.length} solved</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr]">
          <div className="lg:border-r border-line">
            <div className="label px-3 pt-2.5 pb-1">Companies with a documented process</div>
            <ul>
              {trackCompanies.map((c) => (
                <li key={c.id} className="px-3 py-2 border-t border-line first:border-t-0">
                  <Link href={`/problems?company=${c.id}`} className="flex items-baseline gap-2 group">
                    <span className="text-sm font-medium group-hover:underline underline-offset-2">{c.name}</span>
                    <span className="text-xs text-muted truncate">{c.roles.join(", ")}</span>
                    <span className="ml-auto text-xs text-faint num whitespace-nowrap">{c.cgpaCut ? `CGPA ≥ ${c.cgpaCut}` : "no cut-off"}</span>
                  </Link>
                  <div className="text-xs text-muted mt-0.5 leading-5">{c.tested.join(" · ")}</div>
                </li>
              ))}
            </ul>
            <p className="px-3 py-2 border-t border-line text-2xs text-faint leading-4">Source: BITS Hyderabad Placement Chronicles, Sem 2 AY 2025-26; Eternal from the AY 2026-27 cycle.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="dt">
              <thead><tr><th className="w-8" /><th>Problem</th><th>Type</th><th>Difficulty</th><th>Source</th></tr></thead>
              <tbody>
                {trackProblems.map((p) => (
                  <tr key={p.id} className="group">
                    <td><StatusDot status={attempts[p.id]?.status} /></td>
                    <td className="max-w-[380px]"><Link href={`/p/${p.id}`} className="block truncate text-fg font-medium group-hover:underline underline-offset-2">{p.title}</Link></td>
                    <td className="text-muted">{KIND_LABEL[p.kind]}</td>
                    <td><DifficultyBadge d={p.difficulty} /></td>
                    <td><SourceTag source={p.source} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
