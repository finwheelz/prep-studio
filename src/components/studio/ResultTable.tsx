"use client";

import { useRef, useState, type UIEvent } from "react";
import type { ResultSet } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROW_H = 28;
const OVERSCAN = 12;

function fmt(c: string | number | boolean | null) {
  if (c === null) return <span className="text-faint italic">NULL</span>;
  if (typeof c === "boolean") return c ? "true" : "false";
  return String(c);
}

const isNum = (c: unknown) => typeof c === "number" || (typeof c === "string" && c.trim() !== "" && Number.isFinite(Number(c)) && !/^\d{4}-\d{2}-\d{2}/.test(c));

/**
 * Result grid with windowed rows: only the rows in view (plus overscan) are in the DOM,
 * so a 100k-row result scrolls as smoothly as a 10-row one.
 * `diff` marks cells that differ from the other side in the diff viewer.
 */
export function ResultTable({ data, diff, maxHeight }: { data: ResultSet; diff?: (row: number, col: number) => boolean; maxHeight?: number }) {
  const [scrollTop, setScrollTop] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const viewH = ref.current?.clientHeight ?? 400;
  const n = data.rows.length;
  const start = Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN);
  const end = Math.min(n, Math.ceil((scrollTop + viewH) / ROW_H) + OVERSCAN);
  const numeric = data.columns.map((_, j) => data.rows.slice(0, 50).every((r) => r[j] === null || isNum(r[j])));

  if (!data.columns.length) return <div className="p-3 text-xs text-muted">Statement ran. No rows returned.</div>;

  return (
    <div ref={ref} className="overflow-auto h-full" style={maxHeight ? { maxHeight } : undefined} onScroll={(e: UIEvent<HTMLDivElement>) => setScrollTop(e.currentTarget.scrollTop)}>
      <table className="dt font-mono">
        <thead>
          <tr>
            <th className="w-10 text-right text-faint font-normal">#</th>
            {data.columns.map((c, j) => (
              <th key={j} className={cn(numeric[j] && "text-right")}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {start > 0 && (
            <tr aria-hidden style={{ height: start * ROW_H }}>
              <td colSpan={data.columns.length + 1} className="!border-0 !p-0" />
            </tr>
          )}
          {data.rows.slice(start, end).map((r, i) => {
            const ri = start + i;
            return (
              <tr key={ri}>
                <td className="text-right text-faint num">{ri + 1}</td>
                {r.map((c, j) => (
                  <td key={j} className={cn("num", numeric[j] && "text-right", diff?.(ri, j) && "bg-danger/15 text-danger")}>
                    {fmt(c)}
                  </td>
                ))}
              </tr>
            );
          })}
          {end < n && (
            <tr aria-hidden style={{ height: (n - end) * ROW_H }}>
              <td colSpan={data.columns.length + 1} className="!border-0 !p-0" />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
