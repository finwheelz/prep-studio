"use client";

import type { PythonProblem, RunOutput, TestResult } from "./types";

interface PyTestOut {
  id: string;
  pass: boolean;
  actual: string | null;
  expected: string | null;
  error: string | null;
  ms: number;
}
interface PyOut {
  stdout: string;
  error: string | null;
  tests: PyTestOut[];
  /** Base64 PNGs of matplotlib figures left open after the run. */
  figures?: string[];
}

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
const TIMEOUT_MS = 10_000;
/** First boot downloads the runtime and any wheels from this site, so allow longer. */
const BOOT_TIMEOUT_MS = 90_000;

let worker: Worker | null = null;
let booted = false;
let seq = 0;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(`${BASE}/py-worker.js`);
    booted = false;
  }
  return worker;
}

function call(payload: Record<string, unknown>): Promise<PyOut> {
  return new Promise((resolve, reject) => {
    const w = getWorker();
    const id = ++seq;
    const timer = setTimeout(() => {
      // Kill the worker: this is the only way to stop a tight Python loop.
      w.terminate();
      worker = null;
      reject(new Error(booted ? `Time limit exceeded (${TIMEOUT_MS / 1000}s). Check for an infinite loop.` : "Python runtime failed to load in time."));
    }, booted ? TIMEOUT_MS : BOOT_TIMEOUT_MS);
    const onMsg = (e: MessageEvent) => {
      if (e.data.id !== id) return;
      clearTimeout(timer);
      w.removeEventListener("message", onMsg);
      booted = true;
      if (e.data.ok) resolve(e.data.result as PyOut);
      else reject(new Error(e.data.error));
    };
    w.addEventListener("message", onMsg);
    w.postMessage({ id, base: BASE, ...payload });
  });
}

/** Run the code and evaluate the first visible test call, printing its value. */
export async function runPython(problem: PythonProblem, code: string): Promise<RunOutput> {
  const t0 = performance.now();
  const sample = problem.tests.find((t) => !t.hidden);
  try {
    const out = await call({
      code,
      setup: problem.setup,
      packages: problem.packages,
      tests: sample ? [{ id: sample.id, call: sample.call, expected: sample.expected }] : [],
    });
    const ms = performance.now() - t0;
    if (out.error) return { ok: false, ms, error: out.error, stdout: out.stdout, figures: out.figures };
    const t = out.tests[0];
    const lines = [out.stdout.trimEnd()];
    if (t && sample) lines.push(`>>> ${sample.call}\n${t.error ? t.error : t.actual}`);
    return { ok: !t?.error, ms, stdout: lines.filter(Boolean).join("\n"), error: t?.error ?? undefined, figures: out.figures };
  } catch (e) {
    return { ok: false, ms: performance.now() - t0, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function testPython(problem: PythonProblem, code: string): Promise<TestResult[]> {
  try {
    const out = await call({
      code,
      setup: problem.setup,
      packages: problem.packages,
      tests: problem.tests.map((t) => ({ id: t.id, call: t.call, expected: t.expected })),
    });
    if (out.error) {
      return problem.tests.map((t) => ({ id: t.id, name: t.name, hidden: t.hidden, pass: false, ms: 0, error: out.error! }));
    }
    return problem.tests.map((t) => {
      const r = out.tests.find((x) => x.id === t.id);
      return {
        id: t.id,
        name: t.name,
        hidden: t.hidden,
        pass: !!r?.pass,
        ms: r?.ms ?? 0,
        expected: r?.expected ?? undefined,
        actual: r?.actual ?? undefined,
        error: r?.error ?? undefined,
      };
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return problem.tests.map((t) => ({ id: t.id, name: t.name, hidden: t.hidden, pass: false, ms: 0, error: msg }));
  }
}
