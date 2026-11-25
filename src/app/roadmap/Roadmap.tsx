"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TOPICS, TRACK_META } from "@/data/syllabus";
import { ROADMAPS } from "@/data/curriculum";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { Bar } from "@/components/ui/bits";

/** Role roadmaps: an ordered list of modules across tracks, with progress. */
export function Roadmap() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const read = useStore((s) => s.read);
  const role = ROADMAPS.find((r) => r.id === params.get("role")) ?? ROADMAPS[0];
  const steps = role.steps.map((st) => {
    const ls = TOPICS.filter((t) => t.track === st.track && t.module === st.module);
    const done = hydrated ? ls.filter((t) => read[t.id]).length : 0;
    const mins = ls.reduce((a, t) => a + (t.lesson?.mins ?? 0), 0);
    return { ...st, ls, done, mins };
  });
  const built = steps.filter((s) => s.ls.length);
  const total = built.reduce((a, s) => a + s.ls.length, 0);
  const done = built.reduce((a, s) => a + s.done, 0);
  let lastTrack = "";
  return (
    <div className="max-w-[900px] mx-auto p-4 space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Roadmaps</h1>
        <p className="text-sm text-muted mt-1">The modules to cover for a role, in order. Progress is saved in this browser.</p>
      </header>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Roles">
        {ROADMAPS.map((r) => (
          <button key={r.id} role="tab" aria-selected={r.id === role.id} onClick={() => router.replace(`${pathname}?role=${r.id}`, { scroll: false })} className={cn("btn", r.id === role.id && "border-accent text-accent")}>{r.label}</button>
        ))}
      </div>
      <section className="pane">
        <div className="p-3 border-b border-line">
          <div className="text-base font-semibold">{role.label}</div>
          <p className="text-xs text-muted mt-0.5">{role.blurb}</p>
          <div className="text-2xs text-muted num mt-2">{steps.length} modules · {built.length} ready · {done}/{total} lessons done</div>
          <Bar className="mt-1.5" value={total ? done / total : 0} />
          <Link href={`/mock?role=${role.id}`} className="btn mt-3 inline-flex">Mock rounds for {role.label}</Link>
        </div>
        <ol>
          {steps.map((s, i) => {
            const head = s.track !== lastTrack;
            lastTrack = s.track;
            const label = TRACK_META.find((t) => t.id === s.track)?.label;
            return (
              <li key={`${s.track}-${s.module}`}>
                {head && <div className="label px-3 py-1.5 bg-inset border-y border-line">{label}</div>}
                {s.ls.length ? (
                  <Link href={`/learn/${(s.ls.find((t) => !read[t.id]) ?? s.ls[0]).id}`} className="flex items-center gap-3 px-3 py-2 hover:bg-inset">
                    <span className="num text-xs text-faint w-6">{i + 1}</span>
                    <span className="flex-1 text-sm font-medium">{s.module}</span>
                    <span className="num text-2xs text-muted">{s.done}/{s.ls.length} · {s.mins} min</span>
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 px-3 py-2 text-muted">
                    <span className="num text-xs text-faint w-6">{i + 1}</span>
                    <span className="flex-1 text-sm">{s.module}</span>
                    <span className="text-2xs text-faint">being built</span>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
