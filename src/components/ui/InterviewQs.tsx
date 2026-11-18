"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { InterviewQ } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ICON } from "./bits";
import { Md } from "./Md";

/** Interview questions: answer out loud first, then reveal the model answer and tick off the rubric. */
export function InterviewQs({ items }: { items: InterviewQ[] }) {
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const [ticks, setTicks] = useState<Record<string, boolean>>({});
  return (
    <section className="pane mt-5" aria-labelledby="h-interview">
      <div className="pane-head">
        <h2 id="h-interview" className="text-fg font-medium">Interview questions</h2>
        <span>answer out loud first, then check yourself against the rubric</span>
      </div>
      <ol className="divide-y divide-line">
        {items.map((it, i) => {
          const got = it.rubric.filter((_, j) => ticks[`${i}.${j}`]).length;
          return (
            <li key={i} className="p-3">
              <button className="w-full flex items-start gap-2 text-left" onClick={() => setOpen((o) => ({ ...o, [i]: !o[i] }))} aria-expanded={!!open[i]}>
                {open[i] ? <ChevronDown {...ICON} className="mt-1 shrink-0 text-faint" /> : <ChevronRight {...ICON} className="mt-1 shrink-0 text-faint" />}
                <span className="text-sm font-medium">{it.q}</span>
                {open[i] && <span className="ml-auto num text-xs text-muted shrink-0">{got}/{it.rubric.length}</span>}
              </button>
              {open[i] && (
                <div className="pl-6 mt-2 space-y-3">
                  <div>
                    <div className="label mb-1">A strong answer covers</div>
                    <ul className="space-y-1">
                      {it.rubric.map((r, j) => {
                        const k = `${i}.${j}`;
                        return (
                          <li key={j}>
                            <label className="flex items-start gap-2 text-xs cursor-pointer">
                              <input type="checkbox" className="mt-0.5 accent-[rgb(var(--accent))]" checked={!!ticks[k]} onChange={() => setTicks((t) => ({ ...t, [k]: !t[k] }))} />
                              <span className={cn(ticks[k] ? "text-fg" : "text-muted")}>{r}</span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  <div>
                    <div className="label mb-1">Model answer</div>
                    <Md source={it.answer} />
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
