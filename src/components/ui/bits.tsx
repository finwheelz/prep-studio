"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Check, Circle, CircleDot } from "lucide-react";
import type { ReactNode } from "react";
import type { AttemptStatus, Difficulty, Source } from "@/lib/types";
import { companyById } from "@/data/taxonomy";
import { cn } from "@/lib/utils";

export const ICON = { strokeWidth: 1.5, size: 14 } as const;

/** Difficulty is encoded by text + a 1–3 bar glyph, not by colour alone. */
export function DifficultyBadge({ d, className }: { d: Difficulty; className?: string }) {
  const n = d === "Easy" ? 1 : d === "Medium" ? 2 : 3;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-muted", className)} title={`Difficulty: ${d}`}>
      <span className="inline-flex items-end gap-px h-2.5" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span key={i} className={cn("w-[3px] rounded-[1px]", i <= n ? "bg-fg" : "bg-line-strong")} style={{ height: 4 + i * 2 }} />
        ))}
      </span>
      {d}
    </span>
  );
}

export function Tag({ children, className, title }: { children: ReactNode; className?: string; title?: string }) {
  return (
    <span title={title} className={cn("inline-flex items-center h-5 px-1.5 rounded-sm border border-line bg-inset text-2xs text-muted whitespace-nowrap", className)}>
      {children}
    </span>
  );
}

/** "Reported: Company" only when a student reported the question; otherwise "Practice". */
export function SourceTag({ source, withRound = false }: { source: Source; withRound?: boolean }) {
  if (source.kind === "practice") return <Tag title="Written for this bank, modelled on reported question patterns">Practice</Tag>;
  const c = companyById(source.companyId);
  return (
    <Tag className="border-line-strong text-fg" title={`Reported in the Placement Chronicles${source.round ? `: ${source.round}` : ""}`}>
      Reported · {c?.name ?? source.companyId}
      {withRound && source.round ? <span className="text-muted ml-1">({source.round})</span> : null}
    </Tag>
  );
}

export function StatusDot({ status }: { status?: AttemptStatus }) {
  if (status === "solved") return <Check {...ICON} className="text-accent" aria-label="Solved" />;
  if (status === "attempted") return <CircleDot {...ICON} className="text-warn" aria-label="Attempted" />;
  return <Circle {...ICON} className="text-line-strong" aria-label="Not started" />;
}

export function Tip({ label, children, side = "bottom" }: { label: ReactNode; children: ReactNode; side?: "top" | "bottom" | "left" | "right" }) {
  return (
    <TooltipPrimitive.Root delayDuration={300}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className="z-50 rounded border border-line-strong bg-panel px-2 py-1 text-xs text-fg shadow-sm animate-fade-in"
        >
          {label}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="kbd">{children}</kbd>;
}

/** Thin progress bar. `value` in [0, 1]. */
export function Bar({ value, className, tone = "accent" }: { value: number; className?: string; tone?: "accent" | "fg" }) {
  return (
    <div className={cn("h-1 w-full rounded-full bg-inset overflow-hidden", className)} role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full transition-[width] duration-300", tone === "accent" ? "bg-accent" : "bg-fg")} style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }} />
    </div>
  );
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="h-full min-h-24 flex flex-col items-center justify-center text-center px-6 py-8">
      <div className="text-xs text-muted">{title}</div>
      {hint && <div className="text-xs text-faint mt-1 max-w-sm">{hint}</div>}
    </div>
  );
}
