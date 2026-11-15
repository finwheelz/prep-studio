"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { Difficulty } from "@/lib/types";
import { PROBLEMS, KIND_LABEL } from "@/data/problems";
import { CATEGORIES, COMPANIES, PILLARS, TRACKS, categoryById, companyById, pillarById } from "@/data/taxonomy";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { DifficultyBadge, Empty, ICON, SourceTag, StatusDot } from "@/components/ui/bits";

const DIFFS: Difficulty[] = ["Easy", "Medium", "Hard"];
const STATUS = [
  { id: "todo", label: "Not started" },
  { id: "attempted", label: "Attempted" },
  { id: "solved", label: "Solved" },
];

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={active} className={cn("h-6 px-2 rounded border text-xs whitespace-nowrap transition-colors", active ? "border-fg bg-fg text-bg" : "border-line text-muted hover:text-fg hover:border-line-strong")}>
      {children}
    </button>
  );
}

export function ProblemList() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const attempts = useStore((s) => s.attempts);

  const f = {
    pillar: params.get("pillar"),
    track: params.get("track"),
    company: params.get("company"),
    category: params.get("category"),
    difficulty: params.get("difficulty"),
    status: params.get("status"),
    q: params.get("q"),
  };
  // Filters live in the URL so a filtered view can be bookmarked or opened from the palette.
  const [query, setQuery] = useState(params.get("q") ?? "");
  const set = (key: keyof typeof f, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value === null || value === "" || (key !== "q" && next.get(key) === value)) next.delete(key);
    else next.set(key, value);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const rows = useMemo(
    () =>
      PROBLEMS.filter((p) => {
        if (f.q) {
          const hay = `${p.title} ${categoryById(p.category)?.label ?? ""} ${KIND_LABEL[p.kind]} ${p.source.kind === "reported" ? companyById(p.source.companyId)?.name ?? "" : ""}`.toLowerCase();
          if (!f.q.toLowerCase().split(/\s+/).every((w) => hay.includes(w))) return false;
        }
        if (f.pillar && p.pillar !== f.pillar) return false;
        if (f.track && !p.tracks.includes(f.track as never)) return false;
        if (f.company && !(p.source.kind === "reported" && p.source.companyId === f.company)) return false;
        if (f.category && p.category !== f.category) return false;
        if (f.difficulty && p.difficulty !== f.difficulty) return false;
        if (f.status && hydrated) {
          const st = attempts[p.id]?.status ?? "todo";
          if (st !== f.status) return false;
        }
        return true;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [f.pillar, f.track, f.company, f.category, f.difficulty, f.status, f.q, attempts, hydrated],
  );

  const pillar = f.pillar ? pillarById(f.pillar) : null;
  const company = f.company ? companyById(f.company) : null;
  const cats = CATEGORIES.filter((c) => !f.pillar || c.pillar === f.pillar);
  const solved = hydrated ? rows.filter((p) => attempts[p.id]?.status === "solved").length : 0;
  const anyFilter = Object.values(f).some(Boolean);

  return (
    <div className="max-w-[1200px] mx-auto p-4 space-y-3">
      <header className="flex flex-wrap items-end gap-x-4 gap-y-1">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{pillar?.label ?? company?.name ?? "All problems"}</h1>
          <p className="text-xs text-muted mt-0.5">
            {pillar ? `${pillar.blurb} Workspace: ${pillar.modality.toLowerCase()}.` : company ? `${company.roles.join(", ")} · questions students reported from this company` : "Every problem across the three practice pillars."}
          </p>
        </div>
        <div className="ml-auto text-xs text-muted num">
          {solved}/{rows.length} solved
        </div>
      </header>

      {company && (
        <div className="pane grid md:grid-cols-[1fr_1fr_auto] text-xs">
          <div className="p-3 border-b md:border-b-0 md:border-r border-line">
            <div className="label mb-1">Process ({company.cycle})</div>
            <ol className="space-y-0.5">{company.process.map((s, i) => <li key={i}><span className="num text-faint mr-1.5">{i + 1}</span>{s}</li>)}</ol>
          </div>
          <div className="p-3 border-b md:border-b-0 md:border-r border-line">
            <div className="label mb-1">What was tested</div>
            <ul className="space-y-0.5">{company.tested.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
          <div className="p-3">
            <div className="label mb-1">CGPA cut-off</div>
            <div className="num text-lg">{company.cgpaCut ?? "None"}</div>
          </div>
        </div>
      )}

      <div className="pane p-2.5 space-y-2">
        <label className="flex items-center gap-2 h-8 rounded border border-line bg-bg px-2 focus-within:border-line-strong">
          <Search {...ICON} className="text-faint shrink-0" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              set("q", e.target.value.trim() || null);
            }}
            placeholder="Search by title, topic, language or company…"
            aria-label="Search problems"
            className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-faint"
          />
        </label>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="label w-16">Pillar</span>
          {PILLARS.filter((p) => p.id !== "drill").map((p) => (
            <Pill key={p.id} active={f.pillar === p.id} onClick={() => set("pillar", p.id)}>{p.short}</Pill>
          ))}
          <span className="label ml-3">Difficulty</span>
          {DIFFS.map((d) => (
            <Pill key={d} active={f.difficulty === d} onClick={() => set("difficulty", d)}>{d}</Pill>
          ))}
          <span className="label ml-3">Status</span>
          {STATUS.map((s) => (
            <Pill key={s.id} active={f.status === s.id} onClick={() => set("status", s.id)}>{s.label}</Pill>
          ))}
          {anyFilter && (
            <button className="btn-ghost h-6 ml-auto" onClick={() => {
              setQuery("");
              router.replace(pathname);
            }}>
              <X {...ICON} size={12} /> Clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="label w-16">Track</span>
          {TRACKS.map((t) => (
            <Pill key={t.id} active={f.track === t.id} onClick={() => set("track", t.id)}>{t.label}</Pill>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="label w-16">Topic</span>
          {cats.map((c) => (
            <Pill key={c.id} active={f.category === c.id} onClick={() => set("category", c.id)}>{c.label}</Pill>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="label w-16" title="Only companies with a question reported in the Placement Chronicles">Reported</span>
          {COMPANIES.filter((c) => PROBLEMS.some((p) => p.source.kind === "reported" && p.source.companyId === c.id)).map((c) => (
            <Pill key={c.id} active={f.company === c.id} onClick={() => set("company", c.id)}>{c.name}</Pill>
          ))}
        </div>
      </div>

      <div className="pane overflow-x-auto">
        {rows.length === 0 ? (
          <Empty title="No problems match these filters" hint="Clear a filter to widen the list." />
        ) : (
          <table className="dt">
            <thead>
              <tr>
                <th className="w-8" />
                <th>Title</th>
                <th>Type</th>
                <th>Topic</th>
                <th>Difficulty</th>
                <th>Source</th>
                <th className="text-right">Target</th>
                <th className="text-right" title="Your passing submissions / all your graded submissions">Your pass rate</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const a = hydrated ? attempts[p.id] : undefined;
                return (
                  <tr key={p.id} className="group">
                    <td><StatusDot status={a?.status} /></td>
                    <td className="max-w-[420px]">
                      <Link href={`/p/${p.id}`} className="block truncate text-fg font-medium group-hover:underline underline-offset-2">{p.title}</Link>
                    </td>
                    <td className="text-muted">{KIND_LABEL[p.kind]}</td>
                    <td className="text-muted">{categoryById(p.category)?.label}</td>
                    <td><DifficultyBadge d={p.difficulty} /></td>
                    <td><SourceTag source={p.source} /></td>
                    <td className="num text-right text-muted">{p.targetMin}m</td>
                    <td className="num text-right">{a?.submits ? <>{Math.round((a.passes / a.submits) * 100)}% <span className="text-faint">({a.passes}/{a.submits})</span></> : <span className="text-faint">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
