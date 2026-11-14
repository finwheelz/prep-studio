"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import type { QuizItem, TrackKey } from "@/lib/types";
import { QUIZ, TOPICS, TRACK_META, topicById } from "@/data/syllabus";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { cn, shuffled } from "@/lib/utils";
import { Bar, ICON, Kbd } from "@/components/ui/bits";
import { Md } from "@/components/ui/Md";

function correct(q: QuizItem, v: string | number | undefined) {
  if (v === undefined || v === "") return false;
  if (q.options) return Number(v) === q.answer;
  const n = parseFloat(String(v).replace(/[,₹%\s]/g, ""));
  return Number.isFinite(n) && Math.abs(n - q.answer) <= (q.tol ?? 0) + 1e-9;
}

const DIFF = ["", "Easy", "Medium", "Hard"];

export function QuizRunner({ id }: { id: string }) {
  const params = useSearchParams();
  const mode = params.get("mode") ?? "all";
  const hydrated = useHydrated();
  const quizStats = useStore((s) => s.quiz);
  const answerQuiz = useStore((s) => s.answerQuiz);
  const topic = topicById(id);
  const mixTrack = id.startsWith("mix-") ? id.slice(4) : null;

  // The question set is fixed once, when persisted history is available, so it does not reshuffle mid-quiz.
  const [seed] = useState(() => Math.floor(Math.random() * 1e9));
  const frozen = useRef<QuizItem[] | null>(null);
  const items = useMemo(() => {
    if (!hydrated) return [];
    if (frozen.current) return frozen.current;
    let pool: QuizItem[];
    if (topic) {
      pool = QUIZ.filter((q) => q.topic === topic.id);
      if (mode === "new") pool = pool.filter((q) => !quizStats[q.id]);
      if (mode === "wrong") pool = pool.filter((q) => quizStats[q.id] && !quizStats[q.id].ok);
    } else {
      const ids = new Set(TOPICS.filter((t) => mixTrack === "all" || t.track === (mixTrack as TrackKey)).map((t) => t.id));
      const all = shuffled(QUIZ.filter((q) => ids.has(q.topic)), seed);
      // Weight toward what needs work: wrong last time, then never tried, then the rest.
      const rank = (q: QuizItem) => (quizStats[q.id] ? (quizStats[q.id].ok ? 2 : 0) : 1);
      pool = [...all].sort((a, b) => rank(a) - rank(b)).slice(0, 20);
      pool = shuffled(pool, seed + 1);
    }
    frozen.current = pool;
    return pool;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const [i, setI] = useState(0);
  const [value, setValue] = useState<string | number | undefined>(undefined);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const q = items[i];
  const done = items.length > 0 && i >= items.length;
  const order = useMemo(() => (q?.options ? shuffled(q.options.map((_, k) => k), seed + i) : []), [q, seed, i]);

  const check = () => {
    if (!q || checked || value === undefined || value === "") return;
    const ok = correct(q, value);
    setChecked(true);
    setResults((r) => [...r, ok]);
    answerQuiz(q.id, ok);
  };
  const nextQ = () => {
    setI((n) => n + 1);
    setValue(undefined);
    setChecked(false);
  };

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (!q) return;
      if (e.key === "Enter") {
        e.preventDefault();
        if (checked) nextQ();
        else check();
      } else if (q.options && !checked && /^[1-9]$/.test(e.key) && Number(e.key) <= order.length) {
        setValue(order[Number(e.key) - 1]);
      }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  });
  useEffect(() => {
    if (q && !q.options) inputRef.current?.focus();
  }, [q]);

  const title = topic ? topic.title : mixTrack === "all" ? "Mixed quiz: all tracks" : `Mixed quiz: ${TRACK_META.find((t) => t.id === mixTrack)?.label}`;
  const back = topic ? `/learn/${topic.id}` : `/learn${mixTrack && mixTrack !== "all" ? `?track=${mixTrack}` : ""}`;
  const right = results.filter(Boolean).length;

  if (!hydrated) return null;

  if (items.length === 0)
    return (
      <div className="max-w-[720px] mx-auto p-4">
        <div className="pane p-4">
          <div className="text-sm font-medium">Nothing to practise in this set</div>
          <p className="text-xs text-muted mt-1">{mode === "wrong" ? "No questions are currently marked wrong for this topic." : mode === "new" ? "You have tried every question in this topic." : "This set is empty."}</p>
          <Link className="btn mt-3" href={back}>Back</Link>
        </div>
      </div>
    );

  if (done) {
    const byTopic: Record<string, { right: number; total: number }> = {};
    items.forEach((it, k) => {
      const name = topicById(it.topic)?.title ?? it.topic;
      (byTopic[name] ??= { right: 0, total: 0 }).total++;
      if (results[k]) byTopic[name].right++;
    });
    const missed = items.filter((_, k) => !results[k]);
    return (
      <div className="max-w-[720px] mx-auto p-4 space-y-3">
        <div className="pane">
          <div className="pane-head">{title}</div>
          <div className="p-4">
            <div className="label">Score</div>
            <div className="num text-2xl">{right}<span className="text-muted text-base">/{items.length}</span> <span className="text-base text-muted">({Math.round((right / items.length) * 100)}%)</span></div>
            <div className="flex flex-wrap gap-2 mt-3">
              <Link className="btn-accent" href={back}>Back to {topic ? "topic" : "syllabus"}</Link>
              {topic && missed.length > 0 && <a className="btn" href={`?mode=wrong`}>Redo the {missed.length} missed</a>}
              <a className="btn" href="">Try again</a>
            </div>
          </div>
        </div>
        {Object.keys(byTopic).length > 1 && (
          <div className="pane">
            <div className="pane-head">By topic</div>
            <table className="dt">
              <tbody>
                {Object.entries(byTopic).sort((a, b) => a[1].right / a[1].total - b[1].right / b[1].total).map(([k, v]) => (
                  <tr key={k}><td>{k}</td><td className="num text-right w-20">{v.right}/{v.total}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {missed.length > 0 && (
          <div className="pane divide-y divide-line">
            <div className="pane-head">Review what you missed</div>
            {missed.map((m) => (
              <div key={m.id} className="p-3 text-sm">
                <Md source={m.prompt} className="[&_p]:mb-1" />
                <div className="text-xs mt-1">Answer: <span className="num text-fg font-medium">{m.options ? m.options[m.answer] : m.answer}</span></div>
                <div className="text-xs text-muted mt-1 leading-5">{m.explain}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const ok = checked && correct(q, value);
  return (
    <div className="max-w-[720px] mx-auto p-4">
      <div className="flex items-center gap-3 text-xs text-muted mb-2">
        <Link href={back} className="hover:text-fg truncate">{title}</Link>
        <span className="ml-auto num whitespace-nowrap">{i + 1} / {items.length}</span>
        <span className="num whitespace-nowrap">{right} correct</span>
      </div>
      <Bar value={(i + (checked ? 1 : 0)) / items.length} tone="fg" />

      <div className={cn("pane mt-3", checked && (ok ? "border-accent/60" : "border-danger/60"))}>
        <div className="pane-head">
          <span>{DIFF[q.d]}</span>
          {!topic && <span className="truncate">· {topicById(q.topic)?.title}</span>}
          <span className="ml-auto">{q.options ? "Choose one" : "Numeric answer"}</span>
        </div>
        <div className="p-4">
          <Md source={q.prompt} className="[&_p]:text-base [&_p]:leading-7 [&_p]:mb-0" />
          {q.options ? (
            <div className="mt-4 grid gap-1.5" role="radiogroup" aria-label="Options">
              {order.map((k, pos) => {
                const sel = value === k;
                return (
                  <button
                    key={k}
                    role="radio"
                    aria-checked={sel}
                    disabled={checked}
                    onClick={() => setValue(k)}
                    className={cn(
                      "flex items-start gap-2.5 px-3 py-2 rounded border text-sm text-left",
                      sel ? "border-fg bg-inset" : "border-line hover:border-line-strong",
                      checked && k === q.answer && "border-accent bg-accent/10",
                      checked && sel && k !== q.answer && "border-danger bg-danger/10",
                    )}
                  >
                    <span className="kbd shrink-0 mt-0.5">{pos + 1}</span>
                    <span className="min-w-0"><Md source={q.options![k]} className="[&_p]:mb-0" /></span>
                    {checked && k === q.answer && <Check {...ICON} className="ml-auto mt-0.5 text-accent shrink-0" />}
                    {checked && sel && k !== q.answer && <X {...ICON} className="ml-auto mt-0.5 text-danger shrink-0" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-3">
              <input
                ref={inputRef}
                key={q.id}
                inputMode="decimal"
                value={value ?? ""}
                disabled={checked}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Your answer"
                aria-label="Numeric answer"
                className="h-9 w-48 rounded border border-line bg-bg px-3 text-sm num outline-none focus:border-fg"
              />
              {checked && !ok && <span className="text-sm">Answer: <span className="num font-medium">{q.answer}</span></span>}
            </div>
          )}
          {checked && (
            <div className="mt-4 rounded border border-line bg-inset p-3 animate-fade-in">
              <div className={cn("text-sm font-medium flex items-center gap-1.5", ok ? "text-accent" : "text-danger")}>
                {ok ? <Check {...ICON} /> : <X {...ICON} />} {ok ? "Correct" : "Not quite"}
              </div>
              <p className="text-sm mt-1 leading-6">{q.explain}</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 px-4 h-11 border-t border-line">
          {checked ? (
            <button className="btn-accent" onClick={nextQ}>{i === items.length - 1 ? "See results" : "Next question"}</button>
          ) : (
            <button className="btn-accent" onClick={check} disabled={value === undefined || value === ""}>Check</button>
          )}
          <span className="ml-auto text-2xs text-faint flex items-center gap-1.5">
            {q.options && <><Kbd>1</Kbd>–<Kbd>{order.length}</Kbd> choose</>}
            <Kbd>↵</Kbd> {checked ? "next" : "check"}
          </span>
        </div>
      </div>
    </div>
  );
}
