// Checks one v2 content file in isolation (no writes): lesson anatomy, curriculum module names,
// unique ids, MCQ indices, time benchmarks, and recomputes every `check` in Pyodide.
//   npx tsx scripts/check-v2.mts src/data/syllabus/v2-dl-a.ts
import { loadPyodide } from "pyodide";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const file = process.argv[2];
if (!file) throw new Error("usage: check-v2.mts <content file>");
const { TOPICS, QUIZ, CARDS } = await import("../src/data/syllabus/build");
const { CURRICULUM } = await import("../src/data/curriculum");
await import(pathToFileURL(resolve(file)).href);

let bad = 0;
const fail = (...m: unknown[]) => { bad++; console.log("FAIL", ...m); };
const ids = new Set<string>();
for (const t of TOPICS) {
  if (ids.has(t.id)) fail("dup topic", t.id);
  ids.add(t.id);
  const mods = CURRICULUM[t.track];
  if (!mods) fail("track not v2", t.id, t.track);
  else if (!mods.includes(t.module)) fail("module not in curriculum", t.id, t.module);
  const l = t.lesson;
  if (!l) { fail("no lesson", t.id); continue; }
  if (l.kind === "concept" || l.kind === "design") {
    for (const k of ["intuition", "maths", "practice", "say", "traps", "sources"] as const) if (!l[k]) fail("missing", k, t.id);
    if (l.say && (l.say.check.length < 4 || l.say.followups.length < 3)) fail("thin say-it", t.id);
    if ((l.traps?.length ?? 0) < 2) fail("<2 traps", t.id);
    if (QUIZ.filter((q) => q.topic === t.id).length < 3) fail("<3 quiz items", t.id);
    if (CARDS.filter((c) => c.topic === t.id).length < 1) fail("no cards", t.id);
  }
}
const qids = new Set<string>();
for (const q of QUIZ) {
  if (qids.has(q.id)) fail("dup quiz id", q.id);
  qids.add(q.id);
  if (!ids.has(q.topic)) fail("quiz topic unknown", q.id, q.topic);
  if (q.options && (q.answer < 0 || q.answer >= q.options.length)) fail("bad MCQ index", q.id);
  if (q.options && new Set(q.options).size !== q.options.length) fail("dup options", q.id);
  if (!q.options && q.tol === undefined) fail("no tol", q.id);
  if (!q.secs) fail("no secs", q.id);
  if (!q.check) fail("no check", q.id);
}
const cids = new Set<string>();
for (const c of CARDS) { if (cids.has(c.id)) fail("dup card", c.id); cids.add(c.id); }

const dir = resolve("public/pyodide") + "/";
if (!existsSync(dir + "pyodide-lock.json")) throw new Error("public/pyodide missing");
const py = await loadPyodide({ indexURL: dir, stdout: () => {}, stderr: () => {} });
const loaded = new Set<string>();
for (const q of QUIZ) {
  const c = q.check;
  if (!c || !("py" in c)) continue;
  try {
    const need = (c.packages ?? []).filter((p) => !loaded.has(p));
    if (need.length) { await py.loadPackage(need, { messageCallback: () => {} }); need.forEach((p) => loaded.add(p)); }
    const ns = py.globals.get("dict")();
    py.runPython(c.py, { globals: ns });
    const got = ns.get("answer");
    ns.destroy();
    if (typeof got !== "number" || !Number.isFinite(got)) { fail("no numeric answer", q.id, got); continue; }
    const ok = q.options ? got === q.answer : Math.abs(got - q.answer) <= (q.tol ? q.tol / 2 : 1e-9);
    if (!ok) fail("answer mismatch", q.id, "computed", got, "stored", q.answer, "tol", q.tol);
  } catch (e) {
    fail("check error", q.id, String(e).split("\n").slice(-2).join(" "));
  }
}
console.log(`${TOPICS.length} lessons, ${QUIZ.length} items, ${CARDS.length} cards`);
console.log(bad ? `${bad} problems` : "OK");
process.exit(bad ? 1 : 0);
