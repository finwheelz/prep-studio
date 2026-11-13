"use client";

import { useState } from "react";
import { Eye, MessageCircleQuestion } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { ICON } from "@/components/ui/bits";
import { cn } from "@/lib/utils";

/** Textarea persisted to the local store under `${problemId}:${field}`. */
export function NoteArea({ noteKey, placeholder, rows = 4, label }: { noteKey: string; placeholder: string; rows?: number; label: string }) {
  const hydrated = useHydrated();
  const value = useStore((s) => s.notes[noteKey] ?? "");
  const setNote = useStore((s) => s.setNote);
  return (
    <textarea
      aria-label={label}
      rows={rows}
      value={hydrated ? value : ""}
      onChange={(e) => setNote(noteKey, e.target.value)}
      placeholder={placeholder}
      className="w-full rounded border border-line bg-bg px-2.5 py-2 text-sm leading-6 outline-none focus:border-line-strong placeholder:text-faint resize-y"
    />
  );
}

/** Model answer, hidden until asked for. Nudges the candidate to write first. */
export function ModelAnswer({ text, hasDraft }: { text: string; hasDraft: boolean }) {
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <button className="btn" onClick={() => setOpen(true)} title={hasDraft ? undefined : "Write your own answer first; the comparison is where the learning is."}>
        <Eye {...ICON} /> {hasDraft ? "Compare with model answer" : "Reveal model answer"}
      </button>
    );
  return (
    <div className="rounded border border-line bg-inset p-3 animate-fade-in">
      <div className="label mb-1">Model answer</div>
      <p className="text-sm leading-6">{text}</p>
    </div>
  );
}

/** Clarifying questions: the interviewer only answers what you ask. */
export function Clarifications({ items, storageKey }: { items: { q: string; a: string }[]; storageKey: string }) {
  const hydrated = useHydrated();
  const raw = useStore((s) => s.notes[storageKey]);
  const setNote = useStore((s) => s.setNote);
  const asked: number[] = hydrated && raw ? JSON.parse(raw) : [];
  const ask = (i: number) => setNote(storageKey, JSON.stringify([...new Set([...asked, i])]));
  return (
    <div className="pane divide-y divide-line">
      {items.map((it, i) => {
        const open = asked.includes(i);
        return (
          <div key={i} className="p-2.5">
            <button onClick={() => ask(i)} disabled={open} className={cn("flex items-start gap-2 text-left text-sm w-full", open ? "text-fg" : "text-muted hover:text-fg")}>
              <MessageCircleQuestion {...ICON} size={15} className="mt-0.5 shrink-0" />
              <span>{it.q}</span>
              {!open && <span className="ml-auto text-xs text-faint whitespace-nowrap pl-2">Ask</span>}
            </button>
            {open && <p className="mt-1.5 ml-[23px] text-sm leading-6 text-fg border-l-2 border-line-strong pl-2.5 animate-fade-in">{it.a}</p>}
          </div>
        );
      })}
    </div>
  );
}
