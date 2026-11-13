import type { DailyChallenge, Problem, TriadSlot } from "./types";
import { PROBLEMS } from "@/data/problems";
import { hashStr } from "./utils";

/** Which problems are eligible for each slot of the daily triad. */
export const SLOT_POOL: Record<TriadSlot, (p: Problem) => boolean> = {
  sql: (p) => p.kind === "sql",
  ml: (p) => p.kind === "concept" && p.pillar === "ml",
  case: (p) => p.pillar === "product",
};

export const SLOT_LABEL: Record<TriadSlot, string> = {
  sql: "Daily SQL Challenge",
  ml: "Daily ML Diagnostic",
  case: "Daily RCA Drill",
};

/**
 * Exactly one SQL + one ML concept + one product case per day. The pick is a pure function
 * of the date, so it is stable across reloads and needs no backend. Each pool is walked in
 * a fixed order offset by the day number, so nothing repeats until the pool is exhausted.
 */
export function dailyFor(date: string): DailyChallenge {
  const dayNum = Math.floor(new Date(date + "T00:00:00").getTime() / 86_400_000);
  const pick = (slot: TriadSlot) => {
    const pool = PROBLEMS.filter(SLOT_POOL[slot]).sort((a, b) => hashStr(a.id) - hashStr(b.id));
    return pool[((dayNum % pool.length) + pool.length) % pool.length].id;
  };
  return { date, slots: { sql: pick("sql"), ml: pick("ml"), case: pick("case") } };
}
