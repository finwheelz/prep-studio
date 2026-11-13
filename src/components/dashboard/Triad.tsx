"use client";

import Link from "next/link";
import { ArrowRight, BrainCircuit, Database, Workflow } from "lucide-react";
import type { TriadSlot } from "@/lib/types";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { dailyFor, SLOT_LABEL } from "@/lib/daily";
import { problemById, KIND_LABEL } from "@/data/problems";
import { categoryById } from "@/data/taxonomy";
import { dayKey, cn } from "@/lib/utils";
import { Bar, DifficultyBadge, ICON, SourceTag } from "@/components/ui/bits";

const SLOT_ICON = { sql: Database, ml: BrainCircuit, case: Workflow } as const;

/** Today's three problems. Progress: 0 not started, half attempted, full solved today. */
export function Triad() {
  const hydrated = useHydrated();
  const today = dayKey();
  const done = useStore((s) => s.dailyDone[today]);
  const attempts = useStore((s) => s.attempts);
  const daily = dailyFor(today);
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {(Object.keys(daily.slots) as TriadSlot[]).map((slot) => {
        const p = problemById(daily.slots[slot])!;
        const Icon = SLOT_ICON[slot];
        const isDone = hydrated && !!done?.[slot];
        const a = hydrated ? attempts[p.id] : undefined;
        const touchedToday = a && dayKey(new Date(a.lastAt)) === today;
        const progress = isDone ? 1 : touchedToday ? 0.5 : 0;
        return (
          <Link key={slot} href={`/p/${p.id}`} className="pane p-3 flex flex-col gap-2 hover:border-line-strong transition-colors group">
            <div className="flex items-center gap-2 text-xs text-muted">
              <Icon {...ICON} />
              <span className="label">{SLOT_LABEL[slot]}</span>
              <span className={cn("ml-auto", isDone ? "text-accent" : "text-faint")}>{isDone ? "Done today" : touchedToday ? "In progress" : "Not started"}</span>
            </div>
            <div className="text-sm font-medium leading-snug min-h-10">{p.title}</div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <DifficultyBadge d={p.difficulty} />
              <span className="text-xs text-muted">{categoryById(p.category)?.label ?? KIND_LABEL[p.kind]}</span>
              <SourceTag source={p.source} />
            </div>
            <div className="mt-auto pt-1 flex items-center gap-3">
              <Bar value={progress} />
              <span className="text-xs text-muted num whitespace-nowrap">{p.targetMin} min</span>
              <ArrowRight {...ICON} className="text-faint group-hover:text-fg transition-colors" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
