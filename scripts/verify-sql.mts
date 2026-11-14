// Runs every SQL reference solution against every seed in Node and prints the result.
import { PGlite } from "@electric-sql/pglite";
import { CODE_PROBLEMS as BASE } from "../src/data/problems-code";
import { SQL_MORE } from "../src/data/problems-sql-more";
const CODE_PROBLEMS = [...BASE, ...SQL_MORE];
const QUIET = process.argv.includes("--quiet");
import { DATASETS } from "../src/data/datasets";

const pg = new PGlite();
let bad = 0;
for (const p of CODE_PROBLEMS) {
  if (p.kind !== "sql") continue;
  const ds = DATASETS.find((d) => d.id === p.datasetId)!;
  for (const seed of Object.keys(ds.seeds)) {
    await pg.exec(`DROP SCHEMA IF EXISTS work CASCADE; CREATE SCHEMA work; SET search_path TO work;`);
    await pg.exec(ds.ddl);
    await pg.exec(ds.seeds[seed]);
    try {
      const res = await pg.exec(p.solution, { rowMode: "array" });
      const last = res[res.length - 1];
      console.log(`${QUIET ? "" : "\n"}${p.id} [${seed}] ${last.fields.map((f) => f.name).join(" | ")} -> ${last.rows.length} rows`);
      if (!QUIET) for (const r of last.rows as unknown[][]) console.log("  " + r.map((c) => (c instanceof Date ? c.toISOString().slice(0, 10) : String(c))).join(" | "));
      // Starter must at least parse and run.
      await pg.exec(p.starter);
    } catch (e) {
      bad++;
      console.error(`FAIL ${p.id} [${seed}]:`, (e as Error).message);
    }
  }
}
console.log(bad ? `\n${bad} failures` : "\nall SQL solutions and starters ran");
process.exit(bad ? 1 : 0);
