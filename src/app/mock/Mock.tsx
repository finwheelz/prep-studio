"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Mic } from "lucide-react";
import { ROADMAPS } from "@/data/curriculum";
import { ROUND_SIZE, SECS_PER_Q, loadResults, roundsFor, saveResult, type MockResult } from "@/lib/mock";
import { useHydrated } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { ICON } from "@/components/ui/bits";
import { Md } from "@/components/ui/Md";

const mmss = (s: number) => `${Math.floor(Math.max(s, 0) / 60)}:${String(Math.max(s, 0) % 60).padStart(2, "0")}`;

/** Role mock rounds: timed spoken answers, self-graded against what the interviewer listens for. */
export function Mock() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const role = ROADMAPS.find((r) => r.id === params.get("role")) ?? ROADMAPS[0];
  const roundN = Number(params.get("round") ?? 0);
  const go = (q: string) => router.replace(`${pathname}?${q}`, { scroll: false });
  const [results, setResults] = useState<MockResult[]>([]);
  useEffect(() => { if (hydrated) setResults(loadResults()); }, [hydrated, roundN]);
  // Each new attempt at a round draws a fresh set of questions.
  const draws = [1, 2, 3].map((n) => results.filter((x) => x.role === role.id && x.round === n).length);
  const rounds = useMemo(() => roundsFor(role.id, draws), [role.id, draws.join()]);
  const round = rounds.find((r) => r.n === roundN);

  if (!round) {
    return (
      <div className="max-w-[900px] mx-auto p-4 space-y-4">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Mock rounds</h1>
          <p className="text-sm text-muted mt-1">{ROUND_SIZE} questions per round, {SECS_PER_Q / 60} minutes each. Answer out loud, then tick off what the interviewer listens for. Questions come from the role&apos;s roadmap, in order.</p>
        </header>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Roles">
          {ROADMAPS.map((r) => (
            <button key={r.id} role="tab" aria-selected={r.id === role.id} onClick={() => go(`role=${r.id}`)} className={cn("btn", r.id === role.id && "border-accent text-accent")}>{r.label}</button>
          ))}
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {rounds.map((r) => {
            const past = results.filter((x) => x.role === role.id && x.round === r.n);
            const best = past.length ? Math.max(...past.map((x) => x.score / x.total)) : null;
            return (
              <div key={r.n} className="pane p-3.5 flex flex-col gap-2">
                <div className="flex items-baseline gap-2"><span className="num text-xs text-faint">Round {r.n}</span><span className="font-semibold">{r.title}</span></div>
                <p className="text-xs text-muted leading-5 flex-1">{r.modules.join(" · ")}</p>
                <div className="text-2xs text-muted num">{r.qs.length} questions · {Math.round((r.qs.length * SECS_PER_Q) / 60)} min{past.length ? ` · ${past.length} attempt${past.length > 1 ? "s" : ""}, best ${Math.round((best ?? 0) * 100)}% · new questions each attempt` : ""}</div>
                <button className="btn-accent self-start" disabled={!r.qs.length} onClick={() => go(`role=${role.id}&round=${r.n}`)}>Start round</button>
              </div>
            );
          })}
        </div>
        {results.filter((x) => x.role === role.id).length > 0 && (
          <section className="pane">
            <div className="pane-head"><h2 className="text-fg font-medium">Past attempts</h2></div>
            <ul className="divide-y divide-line">
              {results.filter((x) => x.role === role.id).slice(0, 10).map((x) => (
                <li key={x.at} className="px-3 py-2 text-xs flex gap-3">
                  <span className="num text-muted">{new Date(x.at).toLocaleDateString("en-IN")}</span>
                  <span>Round {x.round}</span>
                  <span className="num ml-auto">{x.score}/{x.total} points</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        <Link href={`/roadmap?role=${role.id}`} className="text-xs text-muted hover:text-fg inline-flex items-center gap-1"><ArrowLeft {...ICON} size={12} /> {role.label} roadmap</Link>
      </div>
    );
  }
  return <Round key={`${role.id}-${round.n}`} roleId={role.id} roleLabel={role.label} round={round} onExit={() => go(`role=${role.id}`)} />;
}

function Round({ roleId, roleLabel, round, onExit }: { roleId: string; roleLabel: string; round: ReturnType<typeof roundsFor>[number]; onExit: () => void }) {
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<"answer" | "grade" | "done">("answer");
  const [left, setLeft] = useState(SECS_PER_Q);
  const [ticks, setTicks] = useState<Record<string, boolean[]>>({});
  const [showModel, setShowModel] = useState(false);
  const q = round.qs[i];

  useEffect(() => {
    if (phase !== "answer") return;
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [phase, i]);

  const got = (id: string) => (ticks[id] ?? []).filter(Boolean).length;
  const total = round.qs.reduce((a, x) => a + x.rubric.length, 0);
  const score = round.qs.reduce((a, x) => a + got(x.id), 0);

  const next = () => {
    setShowModel(false);
    if (i + 1 < round.qs.length) {
      setI(i + 1);
      setLeft(SECS_PER_Q);
      setPhase("answer");
    } else {
      saveResult({ role: roleId, round: round.n, at: Date.now(), score, total, misses: round.qs.filter((x) => got(x.id) < x.rubric.length / 2).map((x) => x.lessonId) });
      setPhase("done");
    }
  };

  if (phase === "done") {
    const weak = round.qs.filter((x) => got(x.id) < x.rubric.length / 2);
    return (
      <div className="max-w-[800px] mx-auto p-4 space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">{roleLabel} · Round {round.n} done</h1>
        <div className="pane p-4">
          <div className="num text-3xl font-semibold">{score}/{total}</div>
          <div className="text-xs text-muted mt-1">points the interviewer listens for ({Math.round((score / Math.max(total, 1)) * 100)}%). Below half on a question means revisit its lesson.</div>
        </div>
        <section className="pane">
          <div className="pane-head"><h2 className="text-fg font-medium">By question</h2></div>
          <ul className="divide-y divide-line">
            {round.qs.map((x) => (
              <li key={x.id} className="px-3 py-2.5 flex items-start gap-3 text-sm">
                <span className={cn("num text-xs mt-0.5 w-10 shrink-0", got(x.id) < x.rubric.length / 2 ? "text-danger" : "text-accent")}>{got(x.id)}/{x.rubric.length}</span>
                <span className="flex-1"><Md source={x.q} /></span>
                <Link href={`/learn/${x.lessonId}`} className="text-xs text-muted hover:text-fg underline underline-offset-2 shrink-0">{x.lessonTitle}</Link>
              </li>
            ))}
          </ul>
        </section>
        <div className="flex gap-2">
          {weak[0] && <Link className="btn-accent" href={`/learn/${weak[0].lessonId}`}>Revisit weakest lesson</Link>}
          <button className="btn" onClick={onExit}>Back to rounds</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto p-4 space-y-4">
      <div className="flex items-center gap-3 text-xs text-muted">
        <button className="hover:text-fg inline-flex items-center gap-1" onClick={onExit}><ArrowLeft {...ICON} size={12} /> Rounds</button>
        <span>{roleLabel} · Round {round.n}: {round.title}</span>
        <span className="num ml-auto">Question {i + 1}/{round.qs.length}</span>
        <span className={cn("num font-medium", phase === "answer" && left <= 30 ? "text-danger" : "text-fg")} aria-live="polite">{phase === "answer" ? mmss(left) : "grading"}</span>
      </div>
      <div className="pane p-4 space-y-3">
        <div className="flex items-start gap-2"><Mic {...ICON} className="mt-1 shrink-0 text-accent" /><Md source={q.q} className="text-lg font-medium [&_p]:leading-7" /></div>
        <p className="text-xs text-muted">From {q.module} · {q.lessonTitle}</p>
      </div>
      {phase === "answer" ? (
        <div className="flex gap-2">
          <button className="btn-accent" onClick={() => setPhase("grade")}>Done answering</button>
          {left <= 0 && <span className="text-xs text-danger self-center">Time&apos;s up: wrap up and grade.</span>}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="pane p-3 space-y-2">
            <div className="label">Did you cover…</div>
            {q.rubric.map((c, k) => (
              <label key={k} className="flex items-start gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="mt-1 accent-[rgb(var(--accent))]" checked={!!ticks[q.id]?.[k]} onChange={() => setTicks((t) => { const a = [...(t[q.id] ?? [])]; a[k] = !a[k]; return { ...t, [q.id]: a }; })} />
                <span className={ticks[q.id]?.[k] ? "text-fg" : "text-muted"}>{c}</span>
              </label>
            ))}
          </div>
          {showModel ? (
            <div className="pane p-3"><div className="label mb-1">Model answer</div><Md source={q.answer} className="[&_p]:leading-7" /></div>
          ) : (
            <button className="btn" onClick={() => setShowModel(true)}>Show model answer</button>
          )}
          <div><button className="btn-accent" onClick={next}>{i + 1 < round.qs.length ? "Next question" : "Finish round"}</button></div>
        </div>
      )}
    </div>
  );
}
