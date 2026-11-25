"use client";

import Link from "next/link";
import { PracticePanel } from "@/components/practice/PracticePanel";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Card, TrackKey } from "@/lib/types";
import { CARDS, TOPICS, TRACK_META, ACTIVE_TRACKS, topicById } from "@/data/syllabus";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { cn, dayKey } from "@/lib/utils";
import { Bar, Kbd } from "@/components/ui/bits";

const NEW_PER_SESSION = 15;
const GRADES = [
  { g: 0 as const, label: "Again", hint: "today" },
  { g: 1 as const, label: "Hard", hint: "shorter gap" },
  { g: 2 as const, label: "Good", hint: "normal gap" },
  { g: 3 as const, label: "Easy", hint: "longer gap" },
];

export function Revise() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const cardState = useStore((s) => s.cards);
  const gradeCard = useStore((s) => s.gradeCard);
  const topicId = params.get("topic");
  const track = params.get("track") as TrackKey | null;
  const today = dayKey();

  const scope = useMemo(() => {
    if (topicId) return CARDS.filter((c) => c.topic === topicId);
    if (track) {
      const ids = new Set(TOPICS.filter((t) => t.track === track).map((t) => t.id));
      return CARDS.filter((c) => ids.has(c.topic));
    }
    return CARDS;
  }, [topicId, track]);

  // Session queue is built once: everything due, then a batch of new cards.
  const frozen = useRef<{ key: string; queue: Card[] } | null>(null);
  const key = `${topicId}|${track}`;
  const queue = useMemo(() => {
    if (!hydrated) return [];
    if (frozen.current?.key === key) return frozen.current.queue;
    const due = scope.filter((c) => cardState[c.id] && cardState[c.id].due <= today);
    const fresh = scope.filter((c) => !cardState[c.id]).slice(0, topicId ? scope.length : NEW_PER_SESSION);
    frozen.current = { key, queue: [...due, ...fresh] };
    return frozen.current.queue;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, key]);

  const [pos, setPos] = useState(0);
  const [again, setAgain] = useState<Card[]>([]);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    setPos(0);
    setAgain([]);
    setShown(false);
  }, [key]);

  const all = [...queue, ...again];
  const card = all[pos];
  const grade = (g: 0 | 1 | 2 | 3) => {
    if (!card || !shown) return;
    gradeCard(card.id, g);
    if (g === 0) setAgain((a) => [...a, card]); // see it again before the session ends
    setPos((p) => p + 1);
    setShown(false);
  };

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (!card) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setShown(true);
      } else if (shown && /^[1-4]$/.test(e.key)) grade((Number(e.key) - 1) as 0 | 1 | 2 | 3);
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  });

  const st = hydrated ? cardState : {};
  const learned = scope.filter((c) => st[c.id]).length;
  const dueNow = scope.filter((c) => st[c.id] && st[c.id].due <= today).length;
  const scopeLabel = topicId ? topicById(topicId)?.title : track ? TRACK_META.find((t) => t.id === track)?.label : "All tracks";
  const setScope = (t: string | null) => router.replace(t ? `${pathname}?track=${t}` : pathname, { scroll: false });

  return (
    <div className="max-w-[760px] mx-auto p-4 space-y-3">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Revise</h1>
        <p className="text-xs text-muted mt-0.5">Spaced repetition: cards you find hard come back sooner, easy ones later. Each session is everything due plus up to {NEW_PER_SESSION} new cards.</p>
      </header>

      <PracticePanel />

      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Scope">
        <button role="tab" aria-selected={!track && !topicId} onClick={() => setScope(null)} className={cn("h-6 px-2 rounded border text-xs", !track && !topicId ? "border-fg bg-fg text-bg" : "border-line text-muted hover:text-fg")}>All tracks</button>
        {ACTIVE_TRACKS.map((t) => (
          <button key={t.id} role="tab" aria-selected={track === t.id} onClick={() => setScope(t.id)} className={cn("h-6 px-2 rounded border text-xs", track === t.id ? "border-fg bg-fg text-bg" : "border-line text-muted hover:text-fg")}>{t.label}</button>
        ))}
        {topicId && <span className="h-6 px-2 rounded border border-fg bg-fg text-bg text-xs inline-flex items-center">{scopeLabel}</span>}
      </div>

      <div className="pane grid grid-cols-3 text-xs">
        <div className="p-2.5 border-r border-line"><div className="label">Due now</div><div className="num text-lg">{dueNow}</div></div>
        <div className="p-2.5 border-r border-line"><div className="label">Learned</div><div className="num text-lg">{learned}<span className="text-muted text-sm">/{scope.length}</span></div></div>
        <div className="p-2.5"><div className="label">This session</div><div className="num text-lg">{Math.min(pos, all.length)}<span className="text-muted text-sm">/{all.length}</span></div></div>
      </div>
      <Bar value={all.length ? pos / all.length : 0} tone="fg" />

      {!hydrated ? null : !card ? (
        <div className="pane p-5">
          <div className="text-sm font-medium">{all.length ? "Session complete" : "Nothing due in this scope"}</div>
          <p className="text-xs text-muted mt-1">{all.length ? `${all.length} reviews done. Cards are rescheduled; come back tomorrow for what is due.` : "Every card here is scheduled for a later day."}</p>
          <div className="flex gap-2 mt-3">
            <Link className="btn-accent" href="/learn">Back to syllabus</Link>
            {scope.some((c) => !st[c.id]) && <a className="btn" href="">Learn more new cards</a>}
          </div>
        </div>
      ) : (
        <div className="pane">
          <div className="pane-head"><span className="truncate">{topicById(card.topic)?.title}</span><span className="ml-auto">{st[card.id] ? `seen ${st[card.id].reps}×` : "new"}</span></div>
          <button className="block w-full text-left p-5 min-h-40" onClick={() => setShown(true)} aria-label={shown ? "Card answer shown" : "Show answer"}>
            <div className="text-lg font-medium leading-snug">{card.front}</div>
            {shown ? (
              <div className="mt-4 pt-4 border-t border-line text-base leading-7 animate-fade-in">{card.back}</div>
            ) : (
              <div className="mt-6 text-xs text-faint flex items-center gap-1.5"><Kbd>Space</Kbd> show answer</div>
            )}
          </button>
          <div className="grid grid-cols-4 border-t border-line">
            {GRADES.map(({ g, label, hint }) => (
              <button key={g} disabled={!shown} onClick={() => grade(g)} className={cn("h-12 border-r border-line last:border-r-0 text-xs disabled:opacity-40", shown && "hover:bg-inset", g === 0 && shown && "text-danger", g === 3 && shown && "text-accent")}>
                <span className="font-medium">{label}</span> <span className="kbd ml-1">{g + 1}</span>
                <div className="text-2xs text-faint">{hint}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
