"use client";

import type { ResultSet, RunOutput, SqlProblem, TestResult } from "./types";
import { datasetById } from "@/data/datasets";

/**
 * In-browser PostgreSQL (PGlite, Postgres compiled to WASM). One instance per tab.
 * Every run rebuilds the dataset in a scratch schema, so a user's DROP or UPDATE cannot
 * leak into the next run or into the reference query.
 */
type PG = import("@electric-sql/pglite").PGlite;
let dbPromise: Promise<PG> | null = null;

async function db(): Promise<PG> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const { PGlite } = await import("@electric-sql/pglite");
      const pg = new PGlite();
      await pg.waitReady;
      return pg;
    })();
  }
  return dbPromise;
}

/** Warm the engine so the first Run is not slow. */
export const warmSql = () => void db().catch(() => {});

type Cell = string | number | boolean | null;

function normalise(v: unknown): Cell {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) {
    const iso = v.toISOString();
    return iso.endsWith("T00:00:00.000Z") ? iso.slice(0, 10) : iso.replace("T", " ").replace(".000Z", "");
  }
  if (typeof v === "bigint") return v.toString();
  if (typeof v === "number" || typeof v === "boolean" || typeof v === "string") return v;
  return JSON.stringify(v);
}

async function load(pg: PG, datasetId: string, seedId: string) {
  const ds = datasetById(datasetId);
  await pg.exec(`DROP SCHEMA IF EXISTS work CASCADE; CREATE SCHEMA work; SET search_path TO work;`);
  await pg.exec(ds.ddl);
  await pg.exec(ds.seeds[seedId] ?? ds.seeds.default);
}

async function query(pg: PG, sql: string): Promise<ResultSet> {
  const results = await pg.exec(sql, { rowMode: "array" });
  const last = [...results].reverse().find((r) => r.fields.length > 0);
  if (!last) return { columns: [], rows: [] };
  return {
    columns: last.fields.map((f) => f.name),
    rows: (last.rows as unknown[][]).map((r) => r.map(normalise)),
  };
}

const stripTrailing = (sql: string) => sql.trim().replace(/;+\s*$/, "");
const isSingleSelect = (sql: string) => {
  const s = stripTrailing(sql.replace(/--.*$/gm, ""));
  return !s.includes(";") && /^\s*(with|select)\b/i.test(s);
};

export async function runSql(datasetId: string, sql: string, seedId = "default"): Promise<RunOutput> {
  const t0 = performance.now();
  try {
    const pg = await db();
    await load(pg, datasetId, seedId);
    const t1 = performance.now();
    const result = await query(pg, sql);
    const ms = performance.now() - t1;
    let plan: string | undefined;
    if (isSingleSelect(sql)) {
      try {
        const p = await query(pg, `EXPLAIN (ANALYZE, COSTS OFF, TIMING ON, SUMMARY ON) ${stripTrailing(sql)}`);
        plan = p.rows.map((r) => String(r[0])).join("\n");
      } catch {
        /* plan is best-effort */
      }
    }
    return { ok: true, ms, result, plan };
  } catch (e) {
    return { ok: false, ms: performance.now() - t0, error: e instanceof Error ? e.message : String(e) };
  }
}

// ───────────────────────── Result comparison ─────────────────────────

function cellEq(a: Cell, b: Cell): boolean {
  if (a === null || b === null) return a === b;
  const na = typeof a === "number" ? a : typeof a === "string" && a.trim() !== "" ? Number(a) : NaN;
  const nb = typeof b === "number" ? b : typeof b === "string" && b.trim() !== "" ? Number(b) : NaN;
  if (Number.isFinite(na) && Number.isFinite(nb)) return Math.abs(na - nb) < 1e-9;
  return String(a) === String(b);
}

const canon = (c: Cell) => {
  if (c === null) return "\u0000";
  const n = typeof c === "number" ? c : typeof c === "string" && c.trim() !== "" ? Number(c) : NaN;
  return Number.isFinite(n) ? `#${n}` : String(c);
};
const rowKey = (r: Cell[]) => r.map(canon).join("\u0001");

export function compareResults(expected: ResultSet, actual: ResultSet, ordered: boolean): { pass: boolean; reason?: string } {
  if (actual.columns.length !== expected.columns.length) {
    return { pass: false, reason: `Expected ${expected.columns.length} columns (${expected.columns.join(", ")}), got ${actual.columns.length}.` };
  }
  const exCols = expected.columns.map((c) => c.toLowerCase());
  const acCols = actual.columns.map((c) => c.toLowerCase());
  if (exCols.some((c, i) => c !== acCols[i])) {
    return { pass: false, reason: `Column names or order differ. Expected: ${expected.columns.join(", ")}.` };
  }
  if (actual.rows.length !== expected.rows.length) {
    return { pass: false, reason: `Expected ${expected.rows.length} rows, got ${actual.rows.length}.` };
  }
  const ex = ordered ? expected.rows : [...expected.rows].sort((a, b) => rowKey(a).localeCompare(rowKey(b)));
  const ac = ordered ? actual.rows : [...actual.rows].sort((a, b) => rowKey(a).localeCompare(rowKey(b)));
  for (let i = 0; i < ex.length; i++) {
    for (let j = 0; j < ex[i].length; j++) {
      if (!cellEq(ex[i][j], ac[i][j])) {
        return { pass: false, reason: ordered ? `Row ${i + 1}, column ${expected.columns[j]} differs.` : `Row values differ (order ignored).` };
      }
    }
  }
  return { pass: true };
}

export async function testSql(problem: SqlProblem, sql: string): Promise<TestResult[]> {
  const pg = await db();
  const out: TestResult[] = [];
  for (const t of problem.tests) {
    const seed = t.seedId ?? "default";
    const t0 = performance.now();
    try {
      await load(pg, problem.datasetId, seed);
      const expected = await query(pg, problem.solution);
      await load(pg, problem.datasetId, seed);
      const t1 = performance.now();
      const actual = await query(pg, sql);
      const ms = performance.now() - t1;
      const cmp = compareResults(expected, actual, problem.ordered);
      out.push({ id: t.id, name: t.name, hidden: t.hidden, pass: cmp.pass, ms, expected, actual, error: cmp.reason });
    } catch (e) {
      out.push({
        id: t.id,
        name: t.name,
        hidden: t.hidden,
        pass: false,
        ms: performance.now() - t0,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
  return out;
}
