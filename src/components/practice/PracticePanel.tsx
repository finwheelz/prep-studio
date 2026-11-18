"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { QUIZ, topicById } from "@/data/syllabus";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { dueItems, topicStats, weakTopics } from "@/lib/practice";
import { dayKey } from "@/lib/utils";

const byId = new Map(QUIZ.map((q) => [q.id, q]));

/** Repeats due (1/3/7 days after a miss), weak-topic drill, per-topic accuracy and time, and the error log. */
export function PracticePanel() {
  const hydrated = useHydrated();
  const quiz = useStore((s) => s.quiz);
  const repeats = useStore((s) => s.repeats);
  const errors = useStore((s) => s.errors);
  const [showAll, setShowAll] = useState(false);
  const today = dayKey();
  const stats = useMemo(() => topicStats(QUIZ, quiz, errors), [quiz, errors]);
  if (!hydrated) return null;
  const due = dueItems(QUIZ, repeats, today).length;
  const queued = Object.keys(repeats ?? {}).length;
  const weak = weakTopics(stats);
  const worst = [...stats].sort((a, b) => a.accuracy - b.accuracy).slice(0, 8);
  const log = (errors ?? []).slice(0, showAll ? 200 : 15);

  return (
    <div className="space-y-3">
      <div className="pane grid grid-cols-3 text-xs">
        <div className="p-2.5 border-r border-line">
          <div className="label">Repeats due</div>
          <div className="num text-lg">{due}<span className="text-muted text-sm"> / {queued} queued</span></div>
          {due > 0 && <Link className="btn-accent mt-1.5" href="/quiz/mix-due">Start repeats</Link>}
        </div>
        <div className="p-2.5 border-r border-line">
          <div className="label">Weak topics</div>
          <div className="num text-lg">{weak.length}</div>
          {weak.length > 0 && <Link className="btn mt-1.5" href="/quiz/mix-weak">Weak topics only</Link>}
        </div>
        <div className="p-2.5">
          <div className="label">Errors logged</div>
          <div className="num text-lg">{(errors ?? []).length}</div>
          <Link className="btn mt-1.5" href="/quiz/mix-weak?timed=1">Weak, timed</Link>
        </div>
      </div>

      {worst.length > 0 && (
        <div className="pane">
          <div className="pane-head">Accuracy and time by topic (lowest first)</div>
          <table className="dt">
            <thead><tr><th>Topic</th><th className="text-right">Attempts</th><th className="text-right">Accuracy</th><th className="text-right">Avg time</th><th className="text-right">Errors, 30 d</th></tr></thead>
            <tbody>
              {worst.map((t) => (
                <tr key={t.topic}>
                  <td><Link className="hover:underline" href={`/learn/${t.topic}`}>{topicById(t.topic)?.title ?? t.topic}</Link>{weak.includes(t.topic) && <span className="text-warn ml-1.5 text-2xs">weak</span>}</td>
                  <td className="num text-right">{t.attempts}</td>
                  <td className="num text-right">{Math.round(t.accuracy * 100)}%</td>
                  <td className="num text-right">{t.avgSecs == null ? "–" : `${Math.round(t.avgSecs)} s`}</td>
                  <td className="num text-right">{t.recentErrors}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {log.length > 0 && (
        <div className="pane divide-y divide-line">
          <div className="pane-head">Error log<span className="ml-auto">newest first</span></div>
          {log.map((e, k) => {
            const q = byId.get(e.item);
            return (
              <div key={`${e.item}-${e.at}-${k}`} className="p-2.5 text-xs">
                <div className="flex gap-2 text-faint num">
                  <span>{new Date(e.at).toLocaleDateString()}</span>
                  <span>{topicById(e.topic)?.title ?? e.topic}</span>
                  <span>{e.secs} s</span>
                  {e.timeout && <span className="text-warn">timed out</span>}
                  <span className="ml-auto">{e.from === "oa" ? "mock" : "quiz"}</span>
                </div>
                <div className="mt-1 text-fg line-clamp-2">{q?.prompt ?? e.item}</div>
                <div className="mt-0.5 text-muted">You: <span className="num">{e.given || "blank"}</span>{q && <> · Answer: <span className="num text-fg">{q.options ? q.options[q.answer] : q.answer}</span></>}</div>
              </div>
            );
          })}
          {(errors ?? []).length > 15 && <button className="w-full h-9 text-xs text-muted hover:text-fg" onClick={() => setShowAll((v) => !v)}>{showAll ? "Show fewer" : "Show more"}</button>}
        </div>
      )}
    </div>
  );
}
