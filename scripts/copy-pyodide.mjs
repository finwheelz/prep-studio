// Copies the Pyodide runtime (core only) into /public so Python runs fully client-side.
import { cpSync, mkdirSync, existsSync } from "node:fs";
const src = "node_modules/pyodide";
const dst = "public/pyodide";
if (existsSync(src)) {
  mkdirSync(dst, { recursive: true });
  for (const f of ["pyodide.js", "pyodide.asm.js", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json"]) {
    cpSync(`${src}/${f}`, `${dst}/${f}`);
  }
  console.log("pyodide runtime copied to public/pyodide");
}
