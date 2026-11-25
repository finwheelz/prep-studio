"use client";

import * as Tabs from "@radix-ui/react-tabs";
import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, Clock, ExternalLink, Mic } from "lucide-react";
import type { Lesson, Topic } from "@/lib/types";
import { topicById } from "@/data/syllabus";
import { WIDGETS } from "@/components/ml/fitlabs";
import { cn } from "@/lib/utils";
import { ICON } from "./bits";
import { Md } from "./Md";

const KIND: Record<Lesson["kind"], string> = { concept: "Concept", interview: "Interview", quiz: "Quiz", design: "Design" };

export function LessonMeta({ l }: { l: Lesson }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted mt-2">
      <span className="px-1.5 py-0.5 rounded border border-line text-fg">{KIND[l.kind]}</span>
      <span className="flex items-center gap-1"><Clock {...ICON} size={12} /> {l.mins} min</span>
      {l.prereq?.length ? (
        <span>
          Know first:{" "}
          {l.prereq.map((id, i) => {
            const p = topicById(id);
            return p ? <span key={id}>{i > 0 && ", "}<Link href={`/learn/${id}`} className="underline underline-offset-2 hover:text-fg">{p.title}</Link></span> : null;
          })}
        </span>
      ) : null}
    </div>
  );
}

function SayIt({ s }: { s: NonNullable<Lesson["say"]> }) {
  const [step, setStep] = useState(0);
  const [ticks, setTicks] = useState<Record<number, boolean>>({});
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const steps = ["Say it", "Check", "Follow-ups", "Answer"];
  return (
    <div className="space-y-3">
      <ol className="flex gap-1 text-xs" aria-label="Steps">
        {steps.map((t, i) => (
          <li key={t}>
            <button onClick={() => setStep(i)} className={cn("px-2 py-1 rounded border", i === step ? "border-accent text-accent" : i < step ? "border-line text-fg" : "border-line text-faint")} aria-current={i === step ? "step" : undefined}>
              {i + 1}. {t}
            </button>
          </li>
        ))}
      </ol>
      {step === 0 && (
        <div className="pane p-3 space-y-3">
          <div className="flex items-start gap-2"><Mic {...ICON} className="mt-0.5 shrink-0 text-accent" /><p className="text-sm font-medium">{s.prompt}</p></div>
          <p className="text-xs text-muted">Answer out loud in about {s.secs} seconds, as you would to an interviewer. Don&apos;t read ahead.</p>
          <div className="flex gap-2"><button className="btn-accent" onClick={() => setStep(1)}>Done, check me</button><button className="btn" onClick={() => setStep(3)}>Skip to the answer</button></div>
        </div>
      )}
      {step === 1 && (
        <div className="pane p-3 space-y-2">
          <div className="label">Did you say…</div>
          {s.check.map((c, i) => (
            <label key={i} className="flex items-start gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="mt-1 accent-[rgb(var(--accent))]" checked={!!ticks[i]} onChange={() => setTicks((t) => ({ ...t, [i]: !t[i] }))} />
              <span className={ticks[i] ? "text-fg" : "text-muted"}>{c}</span>
            </label>
          ))}
          <div className="flex items-center gap-2 pt-1">
            <span className="num text-xs text-muted">{s.check.filter((_, i) => ticks[i]).length}/{s.check.length}</span>
            <button className="btn-accent ml-auto" onClick={() => setStep(2)}>Next: follow-ups</button>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="pane divide-y divide-line">
          {s.followups.map((f, i) => (
            <div key={i} className="p-3">
              <p className="text-sm font-medium">{f.q}</p>
              {open[i] ? <div className="mt-2 text-sm text-muted animate-fade-in"><Md source={f.a} /></div> : <button className="btn mt-2" onClick={() => setOpen((o) => ({ ...o, [i]: true }))}>Answer it, then reveal</button>}
            </div>
          ))}
          <div className="p-3 flex"><button className="btn-accent ml-auto" onClick={() => setStep(3)}>Next: model answer</button></div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-3">
          <div className="pane p-3"><div className="label mb-1">The answer</div><Md source={s.answer} className="[&_p]:leading-7" /></div>
          {s.avoid.length > 0 && (
            <div className="pane p-3">
              <div className="label mb-1">What not to say</div>
              <ul className="space-y-1">{s.avoid.map((a, i) => <li key={i} className="text-sm text-muted flex gap-2"><span className="text-danger">✕</span><span>{a}</span></li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** v2 lesson: Intuition · Maths/Code · In practice (with traps) · Say it, then terms and sources. */
export function LessonView({ t }: { t: Topic }) {
  const l = t.lesson!;
  const Widget = l.widget ? WIDGETS[l.widget as keyof typeof WIDGETS] : null;
  const tabs = [
    l.intuition || Widget ? "intuition" : null,
    l.maths ? "maths" : null,
    l.practice || l.traps?.length ? "practice" : null,
    l.say ? "say" : null,
  ].filter(Boolean) as string[];
  const label: Record<string, string> = { intuition: "Intuition", maths: l.mathsLabel ?? "Maths", practice: "In practice", say: "Say it" };
  return (
    <div>
      <p className="text-base text-fg font-medium border-l-2 border-accent pl-3">{l.hook}</p>
      {tabs.length > 0 && (
        <Tabs.Root defaultValue={tabs[0]} className="mt-4">
          <Tabs.List className="flex border-b border-line" aria-label="Lesson parts">
            {tabs.map((k) => <Tabs.Trigger key={k} value={k} className="tab">{label[k]}</Tabs.Trigger>)}
          </Tabs.List>
          <Tabs.Content value="intuition" className="pt-4 outline-none space-y-4">
            {l.intuition && <Md source={l.intuition} className="[&_p]:leading-7 [&_li]:leading-7" />}
            {Widget && <section className="pane p-3" aria-label="Interactive"><div className="label mb-2">Play</div><Widget /></section>}
          </Tabs.Content>
          <Tabs.Content value="maths" className="pt-4 outline-none">
            {l.maths && <Md source={l.maths} className="[&_p]:leading-7 [&_li]:leading-7" />}
          </Tabs.Content>
          <Tabs.Content value="practice" className="pt-4 outline-none space-y-4">
            {l.practice && <Md source={l.practice} className="[&_p]:leading-7 [&_li]:leading-7" />}
            {l.traps?.length ? (
              <section className="pane" aria-labelledby="h-traps">
                <div className="pane-head"><AlertTriangle {...ICON} className="text-warn" /><h2 id="h-traps" className="text-fg font-medium">The answer that sounds right</h2></div>
                <ul className="divide-y divide-line">
                  {l.traps.map((x, i) => (
                    <li key={i} className="p-3">
                      <p className="text-sm font-medium">&ldquo;{x.trap}&rdquo;</p>
                      <div className="text-sm text-muted mt-1"><Md source={x.why} /></div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </Tabs.Content>
          <Tabs.Content value="say" className="pt-4 outline-none">{l.say && <SayIt s={l.say} />}</Tabs.Content>
        </Tabs.Root>
      )}
      {l.terms?.length ? (
        <section className="pane mt-5 overflow-x-auto" aria-labelledby="h-terms">
          <div className="pane-head"><h2 id="h-terms" className="text-fg font-medium">Key terms</h2></div>
          <table className="dt"><tbody>{l.terms.map(([a, b]) => <tr key={a}><td className="font-medium whitespace-nowrap align-top">{a}</td><td className="text-muted">{b}</td></tr>)}</tbody></table>
        </section>
      ) : null}
      {l.sources?.length ? (
        <section className="mt-4" aria-labelledby="h-src">
          <h2 id="h-src" className="label mb-1">Sources</h2>
          <ul className="space-y-1 text-xs text-muted">
            {l.sources.map((s) => (
              <li key={s.label} className="flex items-start gap-1.5">
                {s.url ? <a href={s.url} target="_blank" rel="noreferrer" className="flex items-start gap-1.5 hover:text-fg"><ExternalLink {...ICON} size={12} className="mt-0.5 shrink-0" />{s.label}</a> : <span>{s.label}</span>}
                <span className="text-faint whitespace-nowrap">· checked {s.checked}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
