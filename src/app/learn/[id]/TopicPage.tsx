"use client";

import * as Tabs from "@radix-ui/react-tabs";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronRight, ExternalLink } from "lucide-react";
import { TOPICS, TRACK_META, cardsFor, quizFor, topicById } from "@/data/syllabus";
import { KIND_LABEL } from "@/data/problems";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { problemsFor, topicProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { Bar, DifficultyBadge, ICON, SourceTag, StatusDot } from "@/components/ui/bits";
import { Md } from "@/components/ui/Md";

export function TopicPage({ id }: { id: string }) {
  const t = topicById(id)!;
  const hydrated = useHydrated();
  const s = useStore();
  const quiz = hydrated ? s.quiz : {};
  const attempts = hydrated ? s.attempts : {};
  const cardState = hydrated ? s.cards : {};
  const isRead = hydrated && !!s.read[t.id];
  const qs = quizFor(t.id);
  const cs = cardsFor(t.id);
  const ps = problemsFor(t);
  const p = topicProgress(t, quiz, attempts, cardState);
  const idx = TOPICS.findIndex((x) => x.id === t.id);
  const prev = TOPICS[idx - 1];
  const next = TOPICS[idx + 1];
  const track = TRACK_META.find((x) => x.id === t.track)!;
  const wrong = qs.filter((q) => quiz[q.id] && !quiz[q.id].ok).length;
  const [open, setOpen] = useState<Record<string, boolean>>({});

  return (
    <div className="max-w-[900px] mx-auto p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted mb-1.5">
        <Link href={`/learn?track=${t.track}`} className="hover:text-fg">{track.label}</Link>
        <ChevronRight {...ICON} size={12} className="text-faint" />
        <span>{t.module}</span>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
      <p className="text-sm text-muted mt-1">{t.summary}</p>

      <div className="pane grid grid-cols-3 mt-3 text-xs">
        <div className="p-2.5 border-r border-line">
          <div className="label">Questions correct</div>
          <div className="num text-lg">{p.quizRight}<span className="text-muted text-sm">/{p.quizTotal}</span></div>
          <Bar value={p.quizTotal ? p.quizRight / p.quizTotal : 0} />
        </div>
        <div className="p-2.5 border-r border-line">
          <div className="label">Problems solved</div>
          <div className="num text-lg">{p.probTotal ? <>{p.probSolved}<span className="text-muted text-sm">/{p.probTotal}</span></> : <span className="text-faint">—</span>}</div>
          <Bar value={p.probTotal ? p.probSolved / p.probTotal : 0} />
        </div>
        <div className="p-2.5">
          <div className="label">Cards learned</div>
          <div className="num text-lg">{p.cardSeen}<span className="text-muted text-sm">/{p.cardTotal}</span>{p.cardDue > 0 && <span className="text-warn text-xs"> · {p.cardDue} due</span>}</div>
          <Bar value={p.cardTotal ? p.cardSeen / p.cardTotal : 0} />
        </div>
      </div>

      <Tabs.Root defaultValue="learn" className="mt-3">
        <Tabs.List className="flex border-b border-line" aria-label="Topic sections">
          <Tabs.Trigger value="learn" className="tab">Learn</Tabs.Trigger>
          <Tabs.Trigger value="practice" className="tab">Practise <span className="ml-1.5 num text-faint">{qs.length + ps.length}</span></Tabs.Trigger>
          <Tabs.Trigger value="revise" className="tab">Revise <span className="ml-1.5 num text-faint">{cs.length}</span></Tabs.Trigger>
          {t.resources?.length ? <Tabs.Trigger value="resources" className="tab">Resources</Tabs.Trigger> : null}
        </Tabs.List>

        <Tabs.Content value="learn" className="pt-4 outline-none">
          <Md source={t.notes} className="[&_p]:leading-7 [&_li]:leading-7" />
          <div className="flex flex-wrap items-center gap-2 mt-5 pt-3 border-t border-line">
            <button className={cn("btn", isRead && "border-accent text-accent")} onClick={() => s.toggleRead(t.id)}>
              <Check {...ICON} /> {isRead ? "Marked as read" : "Mark as read"}
            </button>
            <Link className="btn-accent" href={`/quiz/${t.id}`}>Test yourself: {qs.length} questions</Link>
          </div>
        </Tabs.Content>

        <Tabs.Content value="practice" className="pt-4 outline-none space-y-4">
          <section className="pane">
            <div className="pane-head"><span className="text-fg font-medium">Question bank</span><span className="num">{qs.length} questions · {p.quizTried} tried · {wrong} to fix</span></div>
            <div className="p-3 flex flex-wrap gap-2">
              <Link className="btn-accent" href={`/quiz/${t.id}`}>All questions</Link>
              <Link className={cn("btn", p.quizTried === qs.length && "opacity-50 pointer-events-none")} href={`/quiz/${t.id}?mode=new`}>Not yet tried ({qs.length - p.quizTried})</Link>
              <Link className={cn("btn", wrong === 0 && "opacity-50 pointer-events-none")} href={`/quiz/${t.id}?mode=wrong`}>Got wrong last time ({wrong})</Link>
            </div>
          </section>
          {ps.length > 0 && (
            <section className="pane overflow-x-auto">
              <div className="pane-head"><span className="text-fg font-medium">Problems</span><span className="num">{p.probSolved}/{p.probTotal} solved</span></div>
              <table className="dt">
                <thead><tr><th className="w-8" /><th>Problem</th><th>Type</th><th>Difficulty</th><th>Source</th></tr></thead>
                <tbody>
                  {ps.map((pr) => (
                    <tr key={pr.id} className="group">
                      <td><StatusDot status={attempts[pr.id]?.status} /></td>
                      <td className="max-w-[380px]"><Link href={`/p/${pr.id}`} className="block truncate text-fg font-medium group-hover:underline underline-offset-2">{pr.title}</Link></td>
                      <td className="text-muted">{KIND_LABEL[pr.kind]}</td>
                      <td><DifficultyBadge d={pr.difficulty} /></td>
                      <td><SourceTag source={pr.source} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </Tabs.Content>

        <Tabs.Content value="revise" className="pt-4 outline-none space-y-3">
          <div className="flex items-center gap-2">
            <Link className="btn-accent" href={`/revise?topic=${t.id}`}>Review these cards</Link>
            <span className="text-xs text-muted">Click a card to show its answer. Reviewing schedules each card for spaced repetition.</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {cs.map((c) => (
              <button key={c.id} onClick={() => setOpen((o) => ({ ...o, [c.id]: !o[c.id] }))} aria-expanded={!!open[c.id]} className="pane p-3 text-left hover:border-line-strong">
                <div className="text-sm font-medium">{c.front}</div>
                {open[c.id] ? <div className="text-sm text-muted mt-1.5 pt-1.5 border-t border-line animate-fade-in">{c.back}</div> : <div className="text-2xs text-faint mt-1.5">Show answer</div>}
              </button>
            ))}
          </div>
        </Tabs.Content>

        {t.resources?.length ? (
          <Tabs.Content value="resources" className="pt-4 outline-none">
            <p className="text-xs text-muted mb-2">External material for more depth and more practice. The questions on this site are original; these are where to go for volume.</p>
            <ul className="pane divide-y divide-line">
              {t.resources.map((r) => (
                <li key={r.url}>
                  <a href={r.url} target="_blank" rel="noreferrer" className="flex items-start gap-2 p-3 hover:bg-inset">
                    <ExternalLink {...ICON} className="mt-0.5 shrink-0 text-muted" />
                    <span><span className="text-sm font-medium">{r.label}</span>{r.note && <span className="block text-xs text-muted">{r.note}</span>}</span>
                  </a>
                </li>
              ))}
            </ul>
          </Tabs.Content>
        ) : null}
      </Tabs.Root>

      <nav className="flex items-center gap-2 mt-6 pt-3 border-t border-line text-xs" aria-label="Topic navigation">
        {prev && <Link className="btn" href={`/learn/${prev.id}`}><ArrowLeft {...ICON} /> {prev.title}</Link>}
        {next && <Link className="btn ml-auto" href={`/learn/${next.id}`}>{next.title} <ArrowRight {...ICON} /></Link>}
      </nav>
    </div>
  );
}
