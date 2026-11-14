// Runs every pure-Python reference solution against its tests with the local python3.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { CODE_PROBLEMS } from "../src/data/problems-code";
import { PY_MORE } from "../src/data/problems-py-more";

const all = [...CODE_PROBLEMS, ...PY_MORE].filter((p) => p.kind === "python" && !p.packages);
writeFileSync("/tmp/py-probs.json", JSON.stringify(all.map((p) => (p.kind === "python" ? { id: p.id, sol: p.solution, starter: p.starter, tests: p.tests } : null))));
const runner = `
import json
bad = 0
for p in json.load(open('/tmp/py-probs.json')):
    compile(p['starter'], p['id'], 'exec')
    ns = {}
    exec(p['sol'], ns)
    for t in p['tests']:
        exp = eval(t['expected'], dict(ns)); act = eval(t['call'], ns)
        if act != exp:
            bad += 1; print('FAIL', p['id'], t['call'], 'got', repr(act), 'want', repr(exp))
print('python problems:', 'ALL PASS' if not bad else f'{bad} failures')
raise SystemExit(1 if bad else 0)
`;
process.stdout.write(execFileSync("python3", ["-c", runner], { encoding: "utf8" }));
console.log(`${all.length} problems checked`);
