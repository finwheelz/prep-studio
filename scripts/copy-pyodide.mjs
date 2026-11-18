// Self-hosts the Python runtime: Pyodide core (from the npm package) plus every wheel the site
// needs (from the official Pyodide GitHub release), verified against the sha256 in pyodide-lock.json.
// Nothing Python-related is fetched from a CDN at runtime.
//
//   node scripts/copy-pyodide.mjs            core + wheels (CI, verify-py)
//   node scripts/copy-pyodide.mjs --core     core only (fast local install)
import { cpSync, mkdirSync, existsSync, readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const src = "node_modules/pyodide";
const dst = "public/pyodide";
if (!existsSync(src)) process.exit(0);
mkdirSync(dst, { recursive: true });
for (const f of ["pyodide.js", "pyodide.asm.js", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json", "pyodide.mjs"]) {
  if (existsSync(`${src}/${f}`)) cpSync(`${src}/${f}`, `${dst}/${f}`);
}
// Seaborn is not in the Pyodide distribution; its pure-Python wheel is vendored in the repo.
for (const f of ["seaborn-0.13.2-py3-none-any.whl"]) cpSync(`vendor/${f}`, `${dst}/${f}`);
console.log("pyodide core copied to public/pyodide");
if (process.argv.includes("--core")) process.exit(0);

/** Top-level packages the content may use. Dependencies are resolved from the lock file. */
export const ROOTS = ["numpy", "pandas", "matplotlib", "scipy", "scikit-learn", "statsmodels", "micropip"];

const version = JSON.parse(readFileSync(`${src}/package.json`, "utf8")).version;
const lock = JSON.parse(readFileSync(`${src}/pyodide-lock.json`, "utf8")).packages;
const need = new Set();
const stack = [...ROOTS];
while (stack.length) {
  const k = stack.pop();
  if (need.has(k)) continue;
  if (!lock[k]) throw new Error(`package ${k} not in pyodide-lock.json`);
  need.add(k);
  stack.push(...lock[k].depends);
}
const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");
const missing = [...need].filter((k) => {
  const p = `${dst}/${lock[k].file_name}`;
  return !existsSync(p) || sha(p) !== lock[k].sha256;
});
if (missing.length) {
  const tar = process.env.PYODIDE_TARBALL || join(tmpdir(), `pyodide-${version}.tar.bz2`);
  if (!existsSync(tar) || statSync(tar).size < 1e8) {
    const url = `https://github.com/pyodide/pyodide/releases/download/${version}/pyodide-${version}.tar.bz2`;
    console.log("downloading", url);
    execFileSync("curl", ["-sSfL", "--retry", "3", "-o", tar, url], { stdio: "inherit" });
  }
  const out = join(tmpdir(), `pyodide-x-${version}`);
  mkdirSync(out, { recursive: true });
  execFileSync("tar", ["-xjf", tar, "-C", out, ...missing.map((k) => `pyodide/${lock[k].file_name}`)], { stdio: "inherit" });
  for (const k of missing) cpSync(`${out}/pyodide/${lock[k].file_name}`, `${dst}/${lock[k].file_name}`);
}
let bad = 0;
for (const k of need) {
  const p = `${dst}/${lock[k].file_name}`;
  if (sha(p) !== lock[k].sha256) { bad++; console.error("sha256 mismatch", p); }
}
if (bad) process.exit(1);
console.log(`${need.size} wheels self-hosted and verified (pyodide ${version})`);
