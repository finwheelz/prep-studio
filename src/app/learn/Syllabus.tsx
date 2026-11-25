"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, BookOpen, Check, Clock } from "lucide-react";
import type { Topic, TrackKey } from "@/lib/types";
import { ACTIVE_TRACKS, TOPICS, TRACK_META, modulesOf } from "@/data/syllabus";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { topicProgress, trackProgress } from "@/lib/progress";
import { Bar, ICON } from "@/components/ui/bits";

const KIND = { concept: "Concept", interview: "Interview", quiz: "Quiz", design: "Design" } as const;
const mins = (ts: Topic[]) => ts.reduce((a, t) => a + (t.lesson?.mins ?? 0), 0);
const hours = (m: number) => (m >= 60 ? `${Math.round(m / 6) / 10} h` : `${m} min`);

/** Learn: a hub of tracks (no ?track) or one track's modules and lessons. */
export function Syllabus() {
  const params = useSearchParams();
  const hydrated = useHydrated();
  const s = useStore();
  const read = hydrated ? s.read : {};
  const quiz = hydrated ? s.quiz : {};
  const attempts = hydrated ? s.attempts : {};
  const cards = hydrated ? s.cards : {};
  const track = TRACK_META.find((t) => t.id === params.get("track"))?.id as TrackKey | undefined;

  if (!track) {
    const v2 = TRACK_META.filter((t) => t.v2);
    const old = ACTIVE_TRACKS.filter((t) => !t.v2);
    return (
      <div className="max-w-[1100px] mx-auto p-4 space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Learn</h1>
          <p className="text-sm text-muted mt-1 max-w-[70ch]">Short lessons that end with you saying the answer out loud. Each one has intuition, the maths or code, where it shows up in practice, the traps interviewers listen for, then a question bank and revision cards.</p>
        </header>
        <section aria-labelledby="h-tracks">
          <h2 id="h-tracks" className="label mb-2">Tracks</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {v2.map((t, i) => {
              const ts = TOPICS.filter((x) => x.track === t.id);
              const p = trackProgress(t.id, read, quiz, attempts, cards);
              const live = ts.length > 0;
              const inner = (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="num text-xs text-faint">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-base font-semibold">{t.label}</span>
                  </div>
                  <p className="text-xs text-muted mt-1.5 leading-5 min-h-[40px]">{t.blurb}</p>
                  <div className="text-2xs text-muted num mt-3">{live ? `${ts.length} lessons · ${hours(mins(ts))} · ${p.read} done` : "Being built"}</div>
                  <Bar className="mt-1.5" value={live && ts.length ? p.read / ts.length : 0} />
                </>
              );
              return live ? (
                <Link key={t.id} href={`/learn?track=${t.id}`} className="pane p-3.5 hover:border-line-strong transition-colors">{inner}</Link>
              ) : (
                <div key={t.id} className="pane p-3.5 opacity-55" aria-disabled>{inner}</div>
              );
            })}
          </div>
        </section>
        <section aria-labelledby="h-old">
          <h2 id="h-old" className="label mb-2">Earlier material (kept as it is)</h2>
          <div className="flex flex-wrap gap-2">
            {old.map((t) => <Link key={t.id} href={`/learn?track=${t.id}`} className="btn">{t.label}</Link>)}
          </div>
        </section>
      </div>
    );
  }

  const meta = TRACK_META.find((t) => t.id === track)!;
  const tp = trackProgress(track, read, quiz, attempts, cards);
  const mods = modulesOf(track);
  return (
    <div className="max-w-[1000px] mx-auto p-4 space-y-4">
      <Link href="/learn" className="text-xs text-muted hover:text-fg inline-flex items-center gap-1"><ArrowLeft {...ICON} size={12} /> All tracks</Link>
      <header className="flex flex-wrap items-end gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{meta.label}</h1>
          <p className="text-sm text-muted mt-1">{meta.blurb}</p>
          <p className="text-xs text-muted num mt-1">{tp.topics} lessons · {mods.length} modules · {tp.read} done · {tp.quizRight}/{tp.quizTotal} questions correct</p>
        </div>
        <span className="ml-auto flex gap-2">
          <Link className="btn" href={`/quiz/mix-${track}`}>Mixed quiz (20)</Link>
          <Link className="btn" href={`/revise?track=${track}`}>Review cards{tp.cardDue ? ` · ${tp.cardDue} due` : ""}</Link>
        </span>
      </header>
      {mods.map((m, mi) => (
        <section key={m.module} className="pane" aria-labelledby={`m-${mi}`}>
          <div className="pane-head">
            <span className="num text-faint">{String(mi + 1).padStart(2, "0")}</span>
            <h2 id={`m-${mi}`} className="text-fg font-medium">{m.module}</h2>
            <span className="ml-auto num">{m.topics.length} lessons{mins(m.topics) ? ` · ${hours(mins(m.topics))}` : ""}</span>
          </div>
          <ol className="divide-y divide-line">
            {m.topics.map((t) => {
              const p = topicProgress(t, quiz, attempts, cards);
              return (
                <li key={t.id} className="group">
                  <Link href={`/learn/${t.id}`} className="flex items-start gap-3 px-3 py-2.5 hover:bg-inset">
                    <span className="mt-0.5 shrink-0">{read[t.id] ? <Check {...ICON} className="text-accent" aria-label="Done" /> : <BookOpen {...ICON} className="text-line-strong" aria-label="Not done" />}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-fg font-medium group-hover:underline underline-offset-2">{t.title}</span>
                      <span className="block text-xs text-muted leading-5">{t.summary}</span>
                    </span>
                    <span className="shrink-0 text-right text-2xs text-muted num space-y-0.5">
                      {t.lesson && <span className="flex items-center justify-end gap-1">{KIND[t.lesson.kind]} · <Clock {...ICON} size={11} /> {t.lesson.mins}m</span>}
                      {p.quizTotal > 0 && <span className="block">{p.quizRight}/{p.quizTotal} correct</span>}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
