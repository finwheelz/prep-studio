/* Python runner. Runs in a Web Worker so a runaway loop can be terminated from the page.
 * Everything (runtime and wheels) is served from this site's /pyodide/ folder; no CDN. */
let pyodide = null;
let run = null;
const loaded = new Set();
/** Wheels that are not in the Pyodide distribution, vendored next to it. */
const EXTRA = { seaborn: { file: "seaborn-0.13.2-py3-none-any.whl", deps: ["numpy", "pandas", "matplotlib", "scipy"] } };

async function ensure(base, packages) {
  const local = base + "/pyodide/";
  if (!pyodide) {
    importScripts(local + "pyodide.js");
    pyodide = await self.loadPyodide({ indexURL: local });
    const harness = await (await fetch(base + "/py-harness.py")).text();
    pyodide.runPython(harness);
    run = pyodide.globals.get("__run");
  }
  const want = (packages || []).filter((p) => !loaded.has(p));
  if (!want.length) return;
  const std = want.flatMap((p) => (EXTRA[p] ? EXTRA[p].deps : [p]));
  if (std.length) await pyodide.loadPackage(std);
  for (const p of want) if (EXTRA[p]) await pyodide.loadPackage(local + EXTRA[p].file);
  for (const p of [...want, ...std]) loaded.add(p);
}

self.onmessage = async (e) => {
  const { id, code, setup, tests, packages, base } = e.data;
  try {
    await ensure(base || "", packages);
    const json = run(code, setup || "", pyodide.toPy(tests || []));
    self.postMessage({ id, ok: true, result: JSON.parse(json) });
  } catch (err) {
    self.postMessage({ id, ok: false, error: String(err && err.message ? err.message : err) });
  }
};
