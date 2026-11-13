"use client";

import Link from "next/link";
import { ArrowRight, Timer } from "lucide-react";
import { useStore, streakOf } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { OA_SETS, oaSetById } from "@/data/oa";
import { TRACKS } from "@/data/taxonomy";
import { dayKey, fmtClock } from "@/lib/utils";
import { ICON, Tag } from "@/components/ui/bits";
import { ActivityMatrix } from "@/components/dashboard/charts";
import { Triad } from "@/components/dashboard/Triad";

export function Drill() {
  const hydrated = useHydrated();
  const activity = useStore((s) => s.activity);
  const dailyDone = useStore((s) => s.dailyDone);
  const oaResults = useStore((s) => s.oaResults);
  const act = hydrated ? activity : {};
  const streak = streakOf(act);
  const done = hydrated ? Object.values(dailyDone[dayKey()] ?? {}).filter(Boolean).length : 0;
  const fullDays = hydrated ? Object.values(dailyDone).filter((d) => d.sql && d.ml && d.case).length : 0;
  const results = hydrated ? oaResults : [];

  return (
    <div className="max-w-[1200px] mx-auto p-4 space-y-4">
      <section>
        <div className="flex items-baseline gap-3 mb-2">
          <h1 className="text-xl font-semibold tracking-tight">Daily triad</h1>
          <span className="text-xs text-muted">Exactly one SQL query, one ML concept drill and one case per day. Picks change at local midnight.</span>
          <span className="ml-auto text-xs num text-muted">{done}/3 today</span>
        </div>
        <Triad />
      </section>

      <section className="pane">
        <div className="pane-head"><h2 className="text-fg font-medium">Streak and activity</h2></div>
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr]">
          <div className="grid grid-cols-3 md:grid-cols-1 md:w-44 md:border-r border-line max-md:border-b">
            {[
              ["Current streak", streak.current, "days"],
              ["Longest streak", streak.best, "days"],
              ["Full triads", fullDays, "days"],
            ].map(([l, v, u]) => (
              <div key={l as string} className="px-3 py-2 border-line max-md:border-r md:border-b last:border-0">
                <div className="label">{l}</div>
                <div className="num text-2xl leading-8">{v}<span className="text-sm text-muted ml-1">{u}</span></div>
              </div>
            ))}
          </div>
          <div className="p-3">
            <ActivityMatrix activity={act} weeks={40} />
            <p className="text-2xs text-faint mt-2">A day counts toward the streak when at least one submission passes. Progress is stored in this browser only.</p>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-baseline gap-3 mb-2">
          <h2 className="text-xl font-semibold tracking-tight">Timed assessment room</h2>
          <span className="text-xs text-muted">Full screen, one countdown, shuffled questions, graded at the end.</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {OA_SETS.map((s) => {
            const last = results.find((r) => r.setId === s.id);
            return (
              <Link key={s.id} href={`/drill/oa/${s.id}`} className="pane p-3 flex flex-col gap-2 hover:border-line-strong transition-colors group">
                <div className="flex items-center gap-2 text-xs text-muted">
                  <Timer {...ICON} />
                  <span className="num">{s.minutes} min</span>
                  <span className="num">· {s.items.length} questions{s.codingIds.length ? ` + ${s.codingIds.length} coding` : ""}</span>
                </div>
                <div className="text-sm font-medium leading-snug">{s.title}</div>
                <p className="text-xs text-muted leading-5">{s.mirrors}.</p>
                <div className="flex flex-wrap gap-1.5">{s.tracks.map((t) => <Tag key={t}>{TRACKS.find((x) => x.id === t)?.label}</Tag>)}</div>
                <div className="mt-auto pt-1 flex items-center text-xs">
                  <span className="text-muted">Last score <span className="num text-fg">{last ? `${last.score}/${last.total}` : "—"}</span></span>
                  <span className="ml-auto inline-flex items-center gap-1 text-fg">Enter room <ArrowRight {...ICON} className="text-faint group-hover:text-fg" /></span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="pane">
        <div className="pane-head"><h2 className="text-fg font-medium">Assessment history</h2></div>
        {results.length === 0 ? (
          <p className="p-3 text-xs text-muted">No assessments taken yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="dt">
              <thead><tr><th>Date</th><th>Assessment</th><th className="text-right">Score</th><th className="text-right">Time used</th><th>Weakest topic</th></tr></thead>
              <tbody>
                {results.map((r, i) => {
                  const weak = Object.entries(r.byTopic).sort((a, b) => a[1].right / a[1].total - b[1].right / b[1].total)[0];
                  return (
                    <tr key={i}>
                      <td className="num text-muted">{new Date(r.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                      <td>{oaSetById(r.setId)?.title ?? r.setId}</td>
                      <td className="num text-right">{r.score}/{r.total} <span className="text-faint">({Math.round((r.score / r.total) * 100)}%)</span></td>
                      <td className="num text-right">{fmtClock(r.secUsed)}</td>
                      <td className="text-muted">{weak && weak[1].right < weak[1].total ? `${weak[0]} (${weak[1].right}/${weak[1].total})` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
