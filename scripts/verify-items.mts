// Recomputes the answer of every quiz item that carries a `check` and writes src/data/verified.json:
// one entry per item whose stored answer was reproduced, holding the hash of what was verified.
// Python checks run in Pyodide with the self-hosted wheels (the site's own runtime); generator
// checks re-solve the generated set. Items without a check stay [UNVERIFIED].
//
//   npx tsx scripts/verify-items.mts           verify and rewrite verified.json
//   npx tsx scripts/verify-items.mts --check   verify; fail if verified.json is not exactly what this run produces (CI)
import { loadPyodide } from "pyodide";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { QUIZ } from "../src/data/syllabus";
import { GEN_VERIFIERS } from "../src/data/gen";
import { itemHash } from "../src/lib/verified";

const CHECK = process.argv.includes("--check");
const OUT = "src/data/verified.json";
const dir = resolve("public/pyodide") + "/";
if (!existsSync(dir + "pyodide-lock.json")) throw new Error("public/pyodide missing: run node scripts/copy-pyodide.mjs");

const items = QUIZ.filter((q) => q.check);
const py = await loadPyodide({ indexURL: dir, stdout: () => {}, stderr: () => {} });
const loaded = new Set<string>();

const verified: Record<string, string> = {};
let bad = 0;
for (const q of items) {
  const c = q.check!;
  let ok = false;
  let why = "";
  try {
    if ("gen" in c) {
      const v = GEN_VERIFIERS[c.gen];
      if (!v) throw new Error(`unknown generator ${c.gen}`);
      ({ ok, why = "" } = v(q));
    } else {
      const need = (c.packages ?? []).filter((p) => !loaded.has(p));
      if (need.length) {
        await py.loadPackage(need, { messageCallback: () => {} });
        need.forEach((p) => loaded.add(p));
      }
      const ns = py.globals.get("dict")();
      py.runPython(c.py, { globals: ns });
      const got = ns.get("answer");
      ns.destroy();
      if (typeof got !== "number" || !Number.isFinite(got)) throw new Error(`check did not assign a number to answer (got ${got})`);
      if (q.options) {
        ok = got === q.answer;
        why = `computed option ${got}, stored ${q.answer}`;
      } else {
        // The accepted range is answer ± tol; the true value must sit well inside it.
        const margin = q.tol ? q.tol / 2 : 1e-9;
        ok = Math.abs(got - q.answer) <= margin;
        why = `computed ${got}, stored ${q.answer} ± ${q.tol ?? 0}`;
      }
    }
  } catch (e) {
    why = String(e).split("\n").slice(-2).join(" ");
  }
  if (ok) verified[q.id] = itemHash(q);
  else {
    bad++;
    console.log("FAIL", q.id, why);
  }
}

const sorted = Object.fromEntries(Object.keys(verified).sort().map((k) => [k, verified[k]]));
const text = JSON.stringify(sorted, null, 1) + "\n";
console.log(`${items.length} items with a check: ${items.length - bad} verified, ${bad} failed; ${QUIZ.length - items.length} items have no check`);
if (CHECK) {
  const committed = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  if (committed.trim() !== text.trim()) {
    console.log(`${OUT} is out of date: run npx tsx scripts/verify-items.mts and commit the result`);
    process.exit(1);
  }
} else writeFileSync(OUT, text);
process.exit(bad ? 1 : 0);
