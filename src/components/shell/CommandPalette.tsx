"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CornerDownLeft, Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { PROBLEMS, KIND_LABEL } from "@/data/problems";
import { CATEGORIES, COMPANIES, PILLARS, TRACKS, categoryById, companyById } from "@/data/taxonomy";
import { OA_SETS } from "@/data/oa";
import { cn } from "@/lib/utils";
import { ICON, Kbd, StatusDot } from "@/components/ui/bits";

interface Item {
  id: string;
  group: "Go to" | "Problems" | "Tracks" | "Companies" | "Assessments" | "Actions";
  label: string;
  hint?: string;
  keywords: string;
  problemId?: string;
  run: () => void;
}

export function CommandPalette() {
  const open = useStore((s) => s.paletteOpen);
  const setOpen = useStore((s) => s.setPalette);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const attempts = useStore((s) => s.attempts);
  const router = useRouter();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const items = useMemo<Item[]>(() => {
    const go = (href: string) => () => router.push(href);
    return [
      { id: "go-dash", group: "Go to", label: "Dashboard", keywords: "home readiness radar", run: go("/") },
      ...PILLARS.filter((p) => p.id !== "drill").map<Item>((p) => ({
        id: `go-${p.id}`,
        group: "Go to",
        label: p.label,
        hint: p.modality,
        keywords: p.blurb,
        run: go(`/problems?pillar=${p.id}`),
      })),
      { id: "go-drill", group: "Go to", label: "Daily Drill & OA Simulator", keywords: "triad streak timed assessment", run: go("/drill") },
      ...PROBLEMS.map<Item>((p) => ({
        id: p.id,
        group: "Problems",
        label: p.title,
        hint: `${KIND_LABEL[p.kind]} · ${p.difficulty}`,
        keywords: [p.tags.join(" "), categoryById(p.category)?.label, p.source.kind === "reported" ? companyById(p.source.companyId)?.name : "", p.kind].join(" "),
        problemId: p.id,
        run: go(`/p/${p.id}`),
      })),
      ...TRACKS.map<Item>((t) => ({ id: `t-${t.id}`, group: "Tracks", label: t.label, hint: t.blurb, keywords: "track company", run: go(`/problems?track=${t.id}`) })),
      ...COMPANIES.map<Item>((c) => ({
        id: `c-${c.id}`,
        group: "Companies",
        label: c.name,
        hint: c.roles.join(", "),
        keywords: c.tested.join(" "),
        run: go(`/problems?company=${c.id}`),
      })),
      ...OA_SETS.map<Item>((s) => ({ id: s.id, group: "Assessments", label: s.title, hint: `${s.minutes} min`, keywords: "oa timed test", run: go(`/drill/oa/${s.id}`) })),
      ...CATEGORIES.map<Item>((c) => ({ id: `cat-${c.id}`, group: "Go to", label: `Topic: ${c.label}`, keywords: c.id, run: go(`/problems?category=${encodeURIComponent(c.id)}`) })),
      { id: "act-theme", group: "Actions", label: "Toggle light / dark theme", keywords: "appearance", run: toggleTheme },
    ];
  }, [router, toggleTheme]);

  const results = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return items.filter((i) => i.group !== "Companies" && !i.id.startsWith("cat-")).slice(0, 30);
    return items
      .map((it) => {
        const label = it.label.toLowerCase();
        const hay = `${label} ${it.hint ?? ""} ${it.keywords}`.toLowerCase();
        if (!terms.every((t) => hay.includes(t))) return null;
        // Rank: label prefix > label contains > keyword only.
        const score = terms.reduce((s, t) => s + (label.startsWith(t) ? 3 : label.includes(t) ? 2 : 1), 0);
        return { it, score };
      })
      .filter((x): x is { it: Item; score: number } => !!x)
      .sort((a, b) => b.score - a.score)
      .slice(0, 40)
      .map((x) => x.it);
  }, [q, items]);

  useEffect(() => setIdx(0), [q, open]);
  useEffect(() => {
    if (!open) setQ("");
  }, [open]);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${idx}"]`)?.scrollIntoView({ block: "nearest" });
  }, [idx]);

  const choose = (it?: Item) => {
    if (!it) return;
    setOpen(false);
    it.run();
  };

  let lastGroup = "";
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 animate-fade-in" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed z-50 left-1/2 top-[14vh] w-[min(640px,calc(100vw-24px))] -translate-x-1/2 pane shadow-2xl animate-fade-in"
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setIdx((i) => Math.min(results.length - 1, i + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setIdx((i) => Math.max(0, i - 1));
            } else if (e.key === "Enter") {
              e.preventDefault();
              choose(results[idx]);
            }
          }}
        >
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <div className="flex items-center gap-2 h-11 px-3 border-b border-line">
            <Search {...ICON} size={15} className="text-faint" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search problems, topics, companies, assessments…"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-faint"
              aria-label="Search"
            />
            <Kbd>Esc</Kbd>
          </div>
          <div ref={listRef} className="max-h-[52vh] overflow-auto p-1" role="listbox">
            {results.length === 0 && <div className="px-3 py-8 text-center text-xs text-muted">No matches for “{q}”.</div>}
            {results.map((it, i) => {
              const header = it.group !== lastGroup ? it.group : null;
              lastGroup = it.group;
              return (
                <div key={it.id}>
                  {header && <div className="label px-2 pt-2 pb-1">{header}</div>}
                  <button
                    role="option"
                    aria-selected={i === idx}
                    data-idx={i}
                    onMouseMove={() => setIdx(i)}
                    onClick={() => choose(it)}
                    className={cn("w-full flex items-center gap-2 h-8 px-2 rounded text-left text-sm", i === idx ? "bg-inset text-fg" : "text-muted")}
                  >
                    {it.problemId ? <StatusDot status={attempts[it.problemId]?.status} /> : <span className="w-3.5" />}
                    <span className="truncate">{it.label}</span>
                    {it.hint && <span className="ml-auto pl-3 text-xs text-faint truncate max-w-[45%]">{it.hint}</span>}
                    {i === idx && <CornerDownLeft {...ICON} size={12} className="text-faint shrink-0" />}
                  </button>
                </div>
              );
            })}
          </div>
          <div className="h-8 px-3 border-t border-line flex items-center gap-3 text-2xs text-faint">
            <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
            <span className="flex items-center gap-1"><Kbd>↵</Kbd> open</span>
            <span className="ml-auto num">{results.length} results</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
