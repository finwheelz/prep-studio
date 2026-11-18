// Runs every Python reference solution against all its tests, in Pyodide under Node, with the
// same wheels and the same harness (public/py-harness.py) the browser uses. Also checks that every
// starter compiles. Exit code 1 on any failure. Needs `node scripts/copy-pyodide.mjs` first.
import { loadPyodide } from "pyodide";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { PROBLEMS } from "../src/data/problems";
import type { PythonProblem } from "../src/lib/types";

const quiet = process.argv.includes("--quiet");
const dir = resolve("public/pyodide") + "/";
if (!existsSync(dir + "pyodide-lock.json")) throw new Error("public/pyodide missing: run node scripts/copy-pyodide.mjs");
const EXTRA: Record<string, { file: string; deps: string[] }> = {
  seaborn: { file: "seaborn-0.13.2-py3-none-any.whl", deps: ["numpy", "pandas", "matplotlib", "scipy"] },
};

const py = await loadPyodide({ indexURL: dir, stdout: () => {}, stderr: () => {} });
py.runPython(readFileSync("public/py-harness.py", "utf8"));
const run = py.globals.get("__run");
const loaded = new Set<string>();
async function ensure(pkgs: string[] = []) {
  for (const p of pkgs) {
    if (loaded.has(p)) continue;
    if (EXTRA[p]) {
      await py.loadPackage(EXTRA[p].deps, { messageCallback: () => {} });
      await py.loadPackage(dir + EXTRA[p].file, { messageCallback: () => {} });
    } else await py.loadPackage([p], { messageCallback: () => {} });
    loaded.add(p);
  }
}

const probs = PROBLEMS.filter((p): p is PythonProblem => p.kind === "python");
let bad = 0;
for (const p of probs) {
  await ensure(p.packages);
  try {
    py.globals.get("compile")(p.starter, p.id, "exec");
  } catch (e) {
    bad++; console.log("FAIL starter does not compile", p.id, String(e).split("\n").pop());
  }
  if (p.tests.length === 0) { bad++; console.log("FAIL no tests", p.id); continue; }
  const out = JSON.parse(run(p.solution, p.setup ?? "", py.toPy(p.tests.map((t) => ({ id: t.id, call: t.call, expected: t.expected })))));
  if (out.error) { bad++; console.log("FAIL", p.id, "solution raised\n", out.error); continue; }
  for (const t of out.tests) {
    if (!t.pass) { bad++; console.log("FAIL", p.id, t.id, t.error ?? `got ${t.actual} want ${t.expected}`); }
  }
  if (!quiet) console.log("ok", p.id, `${out.tests.length} tests`);
}
console.log(`${probs.length} python problems, ${probs.reduce((a, p) => a + p.tests.length, 0)} tests: ${bad ? `${bad} failures` : "ALL PASS"}`);
process.exit(bad ? 1 : 0);
