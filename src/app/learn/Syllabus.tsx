"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Check } from "lucide-react";
import type { TrackKey } from "@/lib/types";
import { TRACK_META, modulesOf } from "@/data/syllabus";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { topicProgress, trackProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { Bar, ICON } from "@/components/ui/bits";

export function Syllabus() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const s = useStore();
  const read = hydrated ? s.read : {};
  const quiz = hydrated ? s.quiz : {};
  const attempts = hydrated ? s.attempts : {};
  const cards = hydrated ? s.cards : {};
  const track = (TRACK_META.find((t) => t.id === params.get("track"))?.id ?? "foundations") as TrackKey;
  const meta = TRACK_META.find((t) => t.id === track)!;
  const tp = trackProgress(track, read, quiz, attempts, cards);

  return (
    <div className="max-w-[1200px] mx-auto p-4 space-y-3">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Learn</h1>
        <p className="text-xs text-muted mt-0.5">Every topic has study notes, a question bank, flashcards and, where it applies, coding or case problems.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2" role="tablist" aria-label="Tracks">
        {TRACK_META.map((t) => {
          const p = trackProgress(t.id, read, quiz, attempts, cards);
          const active = t.id === track;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => router.replace(`${pathname}?track=${t.id}`, { scroll: false })}
              className={cn("pane p-2.5 text-left transition-colors", active ? "border-fg" : "hover:border-line-strong")}
            >
              <div className="text-sm font-medium">{t.label}</div>
              <div className="text-2xs text-muted num mt-0.5">{p.read}/{p.topics} topics read · {p.quizRight}/{p.quizTotal} questions</div>
              <Bar className="mt-2" value={p.quizTotal ? p.quizRight / p.quizTotal : 0} />
            </button>
          );
        })}
      </div>

      <div className="pane">
        <div className="pane-head flex-wrap py-1.5">
          <span className="text-fg font-medium">{meta.label}</span>
          <span>{meta.blurb}</span>
          <span className="ml-auto flex gap-2">
            <Link className="btn" href={`/quiz/mix-${track}`}>Mixed quiz (20)</Link>
            <Link className="btn" href={`/revise?track=${track}`}>Review cards{tp.cardDue ? ` · ${tp.cardDue} due` : ""}</Link>
          </span>
        </div>
        {modulesOf(track).map((m) => (
          <section key={m.module}>
            <div className="label px-3 py-1.5 bg-inset border-y border-line">{m.module}</div>
            <div className="overflow-x-auto">
              <table className="dt">
                <thead className="sr-only">
                  <tr><th>Read</th><th>Topic</th><th>Questions</th><th>Problems</th><th>Cards</th></tr>
                </thead>
                <tbody>
                  {m.topics.map((t) => {
                    const p = topicProgress(t, quiz, attempts, cards);
                    return (
                      <tr key={t.id} className="group">
                        <td className="w-8">{read[t.id] ? <Check {...ICON} className="text-accent" aria-label="Read" /> : <BookOpen {...ICON} className="text-line-strong" aria-label="Not read" />}</td>
                        <td className="!whitespace-normal py-1.5 min-w-64">
                          <Link href={`/learn/${t.id}`} className="text-fg font-medium group-hover:underline underline-offset-2">{t.title}</Link>
                          <div className="text-muted leading-4">{t.summary}</div>
                        </td>
                        <td className="w-44">
                          <div className="flex items-center gap-2"><Bar value={p.quizTotal ? p.quizRight / p.quizTotal : 0} /><span className="num text-muted w-14 text-right">{p.quizRight}/{p.quizTotal}</span></div>
                          <div className="text-2xs text-faint">questions correct</div>
                        </td>
                        <td className="w-28 num text-muted">{p.probTotal ? <>{p.probSolved}/{p.probTotal} <span className="text-faint">problems</span></> : <span className="text-faint">—</span>}</td>
                        <td className="w-28 num text-muted">{p.cardSeen}/{p.cardTotal} <span className="text-faint">cards</span>{p.cardDue > 0 && <span className="text-warn"> · {p.cardDue} due</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
