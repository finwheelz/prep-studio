"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Flag, Loader2, Maximize, X } from "lucide-react";
import type { CodeProblem, OaItem, OaResult } from "@/lib/types";
import { oaSetById } from "@/data/oa";
import { problemById } from "@/data/problems";
import { datasetById } from "@/data/datasets";
import { useStore } from "@/lib/store";
import { testSql, warmSql } from "@/lib/sql-engine";
import { testPython } from "@/lib/py-engine";
import { cn, fmtClock, shuffled } from "@/lib/utils";
import { ICON } from "@/components/ui/bits";
import { Md } from "@/components/ui/Md";
import { SchemaViewer } from "@/components/studio/ProblemPanel";

const Editor = dynamic(() => import("@/components/studio/Editor"), { ssr: false });

type Q = { kind: "item"; item: OaItem; order: number[] } | { kind: "code"; problem: CodeProblem };
type Phase = "lobby" | "live" | "grading" | "review";

function gradeItem(it: OaItem, v: string | number | undefined): boolean {
  if (v === undefined || v === "") return false;
  if (it.options) return Number(v) === it.answer;
  const n = parseFloat(String(v).replace(/[,₹%\s]/g, ""));
  return Number.isFinite(n) && Math.abs(n - it.answer) <= (it.tol ?? 0) + 1e-9;
}

export function OaRoom({ setId }: { setId: string }) {
  const set = oaSetById(setId)!;
  const addOaResult = useStore((s) => s.addOaResult);
  const recordSubmit = useStore((s) => s.recordSubmit);
  const [phase, setPhase] = useState<Phase>("lobby");
  const [seed, setSeed] = useState(1);
  const [cur, setCur] = useState(0);
  const [ans, setAns] = useState<Record<string, string | number>>({});
  const [code, setCode] = useState<Record<string, string>>({});
  const [flags, setFlags] = useState<Set<number>>(new Set());
  const [left, setLeft] = useState(set.minutes * 60);
  const [blur, setBlur] = useState(0);
  const [marks, setMarks] = useState<boolean[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  // Question and option order is reshuffled on every attempt.
  const qs = useMemo<Q[]>(() => {
    const items = shuffled(set.items, seed).map<Q>((item, i) => ({
      kind: "item",
      item,
      order: item.options ? shuffled(item.options.map((_, k) => k), seed + i + 1) : [],
    }));
    const coding = set.codingIds.map<Q>((id) => ({ kind: "code", problem: problemById(id) as CodeProblem }));
    return [...items, ...coding];
  }, [set, seed]);
  const qid = (q: Q) => (q.kind === "item" ? q.item.id : q.problem.id);
  const answered = (q: Q) => (q.kind === "item" ? ans[q.item.id] !== undefined && ans[q.item.id] !== "" : (code[q.problem.id] ?? "") !== "" && code[q.problem.id] !== q.problem.starter);

  const start = async () => {
    setSeed(Date.now() % 2147483647);
    setAns({});
    setCode({});
    setFlags(new Set());
    setCur(0);
    setLeft(set.minutes * 60);
    setBlur(0);
    setPhase("live");
    if (set.codingIds.some((id) => problemById(id)?.kind === "sql")) warmSql();
    try {
      await rootRef.current?.requestFullscreen?.();
    } catch {
      /* fullscreen can be refused; the room still works */
    }
  };

  const finish = useCallback(async () => {
    setPhase("grading");
    const out: boolean[] = [];
    for (const q of qs) {
      if (q.kind === "item") out.push(gradeItem(q.item, ans[q.item.id]));
      else {
        const src = code[q.problem.id] ?? q.problem.starter;
        const res = q.problem.kind === "sql" ? await testSql(q.problem, src) : await testPython(q.problem, src);
        const pass = res.length > 0 && res.every((r) => r.pass);
        out.push(pass);
        if (src !== q.problem.starter) recordSubmit(q.problem.id, pass);
      }
    }
    const byTopic: OaResult["byTopic"] = {};
    qs.forEach((q, i) => {
      const topic = q.kind === "item" ? q.item.topic : q.problem.kind === "sql" ? "SQL coding" : "Python coding";
      const t = (byTopic[topic] ??= { right: 0, total: 0 });
      t.total++;
      if (out[i]) t.right++;
    });
    setMarks(out);
    addOaResult({ setId: set.id, at: Date.now(), score: out.filter(Boolean).length, total: out.length, secUsed: set.minutes * 60 - left, byTopic });
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
    setPhase("review");
  }, [qs, ans, code, set, left, addOaResult, recordSubmit]);

  // Countdown; auto-submit at zero.
  const finishRef = useRef(finish);
  finishRef.current = finish;
  useEffect(() => {
    if (phase !== "live") return;
    const t = setInterval(() => setLeft((s) => (s <= 1 ? (clearInterval(t), finishRef.current(), 0) : s - 1)), 1000);
    return () => clearInterval(t);
  }, [phase]);
  // Count how often the candidate leaves the tab, as a proctored OA would.
  useEffect(() => {
    if (phase !== "live") return;
    const on = () => document.hidden && setBlur((b) => b + 1);
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, [phase]);
  // Arrow-key navigation when not typing.
  useEffect(() => {
    if (phase !== "live") return;
    const on = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, .cm-editor")) return;
      if (e.key === "ArrowRight") setCur((c) => Math.min(qs.length - 1, c + 1));
      if (e.key === "ArrowLeft") setCur((c) => Math.max(0, c - 1));
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [phase, qs.length]);

  const q = qs[cur];
  const nAnswered = qs.filter(answered).length;

  // ───────── Lobby ─────────
  if (phase === "lobby")
    return (
      <div ref={rootRef} className="h-full bg-bg flex items-center justify-center p-4">
        <div className="pane w-full max-w-lg">
          <div className="pane-head">Assessment room</div>
          <div className="p-4 space-y-3">
            <h1 className="text-lg font-semibold tracking-tight">{set.title}</h1>
            <p className="text-sm text-muted">{set.mirrors}.</p>
            <dl className="grid grid-cols-3 pane text-xs">
              <div className="p-2.5 border-r border-line"><dt className="label">Time</dt><dd className="num text-lg">{set.minutes} min</dd></div>
              <div className="p-2.5 border-r border-line"><dt className="label">Questions</dt><dd className="num text-lg">{set.items.length}</dd></div>
              <div className="p-2.5"><dt className="label">Coding</dt><dd className="num text-lg">{set.codingIds.length}</dd></div>
            </dl>
            <ul className="text-sm space-y-1 text-muted list-disc pl-5">
              <li>Opens full screen. One countdown for the whole paper; it submits itself at zero.</li>
              <li>Questions and options are shuffled on every attempt.</li>
              <li>No feedback until you submit. Coding answers are run against hidden tests at the end.</li>
              <li>Leaving the tab is counted and shown in your result.</li>
            </ul>
            <div className="flex items-center gap-2 pt-1">
              <button className="btn-accent h-8 px-3" onClick={start}><Maximize {...ICON} /> Start assessment</button>
              <Link href="/drill" className="btn h-8 px-3">Back</Link>
            </div>
          </div>
        </div>
      </div>
    );

  // ───────── Review ─────────
  if (phase === "review" || phase === "grading") {
    const score = marks.filter(Boolean).length;
    const topics: Record<string, { right: number; total: number }> = {};
    qs.forEach((x, i) => {
      const t = x.kind === "item" ? x.item.topic : x.problem.kind === "sql" ? "SQL coding" : "Python coding";
      (topics[t] ??= { right: 0, total: 0 }).total++;
      if (marks[i]) topics[t].right++;
    });
    return (
      <div ref={rootRef} className="h-full bg-bg overflow-auto">
        {phase === "grading" ? (
          <div className="h-full flex items-center justify-center text-sm text-muted gap-2"><Loader2 {...ICON} className="animate-spin" /> Grading, running hidden tests…</div>
        ) : (
          <div className="max-w-3xl mx-auto p-4 space-y-3">
            <div className="pane">
              <div className="pane-head">Result · {set.title}</div>
              <div className="grid grid-cols-3">
                <div className="p-3 border-r border-line"><div className="label">Score</div><div className="num text-2xl">{score}<span className="text-muted text-base">/{qs.length}</span></div></div>
                <div className="p-3 border-r border-line"><div className="label">Time used</div><div className="num text-2xl">{fmtClock(set.minutes * 60 - left)}</div></div>
                <div className="p-3"><div className="label">Left the tab</div><div className={cn("num text-2xl", blur > 0 && "text-warn")}>{blur}×</div></div>
              </div>
            </div>
            <div className="pane">
              <div className="pane-head">Accuracy by topic</div>
              <table className="dt">
                <thead><tr><th>Topic</th><th className="text-right">Right</th><th className="w-1/2" /><th className="text-right">Accuracy</th></tr></thead>
                <tbody>
                  {Object.entries(topics).sort((a, b) => a[1].right / a[1].total - b[1].right / b[1].total).map(([t, v]) => (
                    <tr key={t}>
                      <td>{t}</td>
                      <td className="num text-right">{v.right}/{v.total}</td>
                      <td><div className="h-1.5 rounded-sm bg-inset"><div className="h-full rounded-sm bg-fg/70" style={{ width: `${(v.right / v.total) * 100}%` }} /></div></td>
                      <td className="num text-right">{Math.round((v.right / v.total) * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pane divide-y divide-line">
              <div className="pane-head">Review</div>
              {qs.map((x, i) => (
                <div key={qid(x)} className="p-3 text-sm">
                  <div className="flex gap-2">
                    {marks[i] ? <Check {...ICON} size={15} className="text-accent mt-0.5 shrink-0" aria-label="Correct" /> : <X {...ICON} size={15} className="text-danger mt-0.5 shrink-0" aria-label="Incorrect" />}
                    <div className="min-w-0">
                      {x.kind === "item" ? (
                        <>
                          <div>{x.item.prompt}</div>
                          <div className="text-xs text-muted mt-1">
                            Your answer: <span className="num text-fg">{ans[x.item.id] === undefined || ans[x.item.id] === "" ? "blank" : x.item.options ? x.item.options[Number(ans[x.item.id])] : String(ans[x.item.id])}</span>
                            {!marks[i] && <> · Correct: <span className="num text-fg">{x.item.options ? x.item.options[x.item.answer] : x.item.answer}</span></>}
                          </div>
                          <div className="text-xs text-muted mt-1">{x.item.explain}</div>
                        </>
                      ) : (
                        <>
                          <div>{x.problem.title}</div>
                          <div className="text-xs text-muted mt-1">{marks[i] ? "All hidden tests passed." : "Did not pass all tests."} <Link className="underline underline-offset-2 text-fg" href={`/p/${x.problem.id}`}>Open in the studio</Link></div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pb-6">
              <button className="btn" onClick={() => setPhase("lobby")}>Retake (reshuffled)</button>
              <Link href="/drill" className="btn-accent">Back to drill</Link>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ───────── Live ─────────
  const low = left <= 120;
  return (
    <div ref={rootRef} className="h-full bg-bg flex flex-col">
      <header className="h-11 shrink-0 border-b border-line bg-panel flex items-center gap-3 px-3">
        <span className="text-sm font-medium truncate">{set.title}</span>
        <span className="text-xs text-muted num whitespace-nowrap">{nAnswered}/{qs.length} answered</span>
        <span className={cn("ml-auto num text-base tabular-nums px-2 h-7 inline-flex items-center rounded border", low ? "border-danger/50 text-danger" : "border-line text-fg")} role="timer" aria-label="Time remaining">{fmtClock(left)}</span>
        <button className="btn-accent" onClick={() => { if (window.confirm(`Submit now? ${qs.length - nAnswered} unanswered.`)) finish(); }}>Submit</button>
      </header>
      <div className="flex-1 min-h-0 flex">
        <nav className="w-44 shrink-0 border-r border-line bg-panel p-2 overflow-auto max-sm:hidden" aria-label="Questions">
          <div className="label mb-1.5">Questions</div>
          <div className="grid grid-cols-5 gap-1">
            {qs.map((x, i) => (
              <button key={qid(x)} onClick={() => setCur(i)} aria-current={i === cur} aria-label={`Question ${i + 1}${answered(x) ? ", answered" : ""}${flags.has(i) ? ", flagged" : ""}`}
                className={cn("relative h-7 rounded border text-xs num", i === cur ? "border-fg text-fg" : "border-line text-muted", answered(x) && "bg-inset text-fg")}>
                {i + 1}
                {flags.has(i) && <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-warn" />}
              </button>
            ))}
          </div>
          <div className="mt-3 space-y-1 text-2xs text-faint">
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border border-line bg-inset" /> answered</div>
            <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-warn" /> flagged for review</div>
          </div>
        </nav>
        <main className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-auto">
            {q.kind === "item" ? (
              <div className="max-w-2xl mx-auto p-6">
                <div className="flex items-center gap-2 text-xs text-muted mb-3"><span className="num">Question {cur + 1} of {qs.length}</span><span>· {q.item.topic}</span></div>
                <p className="text-base leading-7">{q.item.prompt}</p>
                {q.item.options ? (
                  <div className="mt-4 grid gap-1.5" role="radiogroup">
                    {q.order.map((k) => (
                      <label key={k} className={cn("flex items-start gap-2.5 px-3 py-2 rounded border text-sm cursor-pointer", ans[q.item.id] === k ? "border-fg bg-inset" : "border-line hover:border-line-strong")}>
                        <input type="radio" name={q.item.id} className="mt-1 accent-[rgb(var(--fg))]" checked={ans[q.item.id] === k} onChange={() => setAns((a) => ({ ...a, [q.item.id]: k }))} />
                        {q.item.options![k]}
                      </label>
                    ))}
                  </div>
                ) : (
                  <input autoFocus key={q.item.id} inputMode="decimal" value={ans[q.item.id] ?? ""} onChange={(e) => setAns((a) => ({ ...a, [q.item.id]: e.target.value }))} placeholder="Numeric answer" aria-label="Numeric answer"
                    className="mt-4 h-9 w-56 rounded border border-line bg-panel px-3 text-sm num outline-none focus:border-fg" />
                )}
              </div>
            ) : (
              <div className="h-full grid grid-cols-1 lg:grid-cols-2">
                <div className="overflow-auto p-4 lg:border-r border-line">
                  <div className="text-xs text-muted num mb-2">Question {cur + 1} of {qs.length} · {q.problem.kind === "sql" ? "SQL · PostgreSQL" : "Python 3.12"}</div>
                  <h2 className="text-base font-semibold mb-2">{q.problem.title}</h2>
                  <Md source={q.problem.statement} />
                  {q.problem.kind === "sql" && <div className="mt-3"><SchemaViewer dataset={datasetById(q.problem.datasetId)} /></div>}
                </div>
                <div className="min-h-64 bg-panel">
                  <Editor key={q.problem.id} language={q.problem.kind} value={code[q.problem.id] ?? q.problem.starter} onChange={(v) => setCode((c) => ({ ...c, [q.problem.id]: v }))} />
                </div>
              </div>
            )}
          </div>
          <footer className="h-11 shrink-0 border-t border-line bg-panel flex items-center gap-2 px-3">
            <button className="btn" onClick={() => setCur((c) => c - 1)} disabled={cur === 0}>Previous</button>
            <button className="btn" onClick={() => setCur((c) => c + 1)} disabled={cur === qs.length - 1}>Next</button>
            <button className={cn("btn", flags.has(cur) && "border-warn text-warn")} onClick={() => setFlags((f) => { const n = new Set(f); n.has(cur) ? n.delete(cur) : n.add(cur); return n; })}><Flag {...ICON} /> {flags.has(cur) ? "Flagged" : "Flag"}</button>
            {blur > 0 && <span className="ml-auto text-xs text-warn num">Left the tab {blur}×</span>}
          </footer>
        </main>
      </div>
    </div>
  );
}
