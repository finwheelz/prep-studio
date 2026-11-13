/* Python runner. Runs in a Web Worker so a runaway loop can be terminated from the page. */
let pyodide = null;
let loadedFrom = null;

let LOCAL = "/pyodide/";
const CDN = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";

async function ensure(packages) {
  // The core runtime is self-hosted. Third-party wheels (pandas, numpy) are only on the CDN,
  // so problems that need them boot the runtime from there instead.
  const base = packages && packages.length ? CDN : LOCAL;
  if (!pyodide || loadedFrom !== base) {
    if (!self.loadPyodide) importScripts(LOCAL + "pyodide.js");
    pyodide = await self.loadPyodide({ indexURL: base });
    loadedFrom = base;
  }
  if (packages && packages.length) await pyodide.loadPackage(packages);
}

const HARNESS = `
import io, sys, json, time, traceback
def __run(user_code, setup_code, tests):
    out = {"stdout": "", "error": None, "tests": []}
    buf = io.StringIO()
    old = sys.stdout
    sys.stdout = buf
    ns = {"__name__": "__main__"}
    try:
        if setup_code:
            exec(setup_code, ns)
        exec(user_code, ns)
    except BaseException:
        out["error"] = traceback.format_exc(limit=4)
    if out["error"] is None:
        for t in tests:
            r = {"id": t["id"], "pass": False, "actual": None, "expected": None, "error": None, "ms": 0}
            t0 = time.perf_counter()
            try:
                exp = eval(t["expected"], dict(ns))
                act = eval(t["call"], ns)
                r["ms"] = (time.perf_counter() - t0) * 1000
                r["expected"] = repr(exp)
                r["actual"] = repr(act)
                r["pass"] = bool(act == exp)
            except BaseException:
                r["ms"] = (time.perf_counter() - t0) * 1000
                r["error"] = traceback.format_exc(limit=3)
            out["tests"].append(r)
    sys.stdout = old
    out["stdout"] = buf.getvalue()[-20000:]
    return json.dumps(out)
`;

self.onmessage = async (e) => {
  const { id, code, setup, tests, packages, base } = e.data;
  LOCAL = (base || "") + "/pyodide/"; // site may be served from a sub-path
  try {
    await ensure(packages);
    pyodide.runPython(HARNESS);
    const run = pyodide.globals.get("__run");
    const json = run(code, setup || "", pyodide.toPy(tests || []));
    self.postMessage({ id, ok: true, result: JSON.parse(json) });
  } catch (err) {
    self.postMessage({ id, ok: false, error: String(err && err.message ? err.message : err) });
  }
};
