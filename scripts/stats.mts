// Content inventory + integrity checks.
import { CARDS, QUIZ, TOPICS } from "../src/data/syllabus";
import { PROBLEMS } from "../src/data/problems";
import { CATEGORIES } from "../src/data/taxonomy";
import VERIFIED from "../src/data/verified.json";
import { itemHash } from "../src/lib/verified";

let bad = 0;
const ids = new Set<string>();
for (const t of TOPICS) { if (ids.has(t.id)) { bad++; console.log("DUP topic", t.id); } ids.add(t.id); }
for (const q of QUIZ) {
  if (q.options && (q.answer < 0 || q.answer >= q.options.length)) { bad++; console.log("BAD answer index", q.id); }
  if (q.options && new Set(q.options).size !== q.options.length) { bad++; console.log("DUP options", q.id); }
  if (!q.options && q.tol === undefined) { bad++; console.log("NO tol", q.id); }
}
// New content (authored with Item()) must carry a time benchmark; ids must be unique across the bank.
const qids = new Set<string>();
for (const q of QUIZ) {
  if (qids.has(q.id)) { bad++; console.log("DUP quiz id", q.id); }
  qids.add(q.id);
  if (q.fixedId && !(q.secs && q.secs > 0)) { bad++; console.log("NO time benchmark", q.id); }
}
// Every committed verification entry must still match its item; a stale entry fails the build.
for (const [id, h] of Object.entries(VERIFIED as Record<string, string>)) {
  const q = QUIZ.find((x) => x.id === id);
  if (!q) { bad++; console.log("verified.json: unknown id", id); }
  else if (itemHash(q) !== h) { bad++; console.log("verified.json: item changed since verification", id); }
}
const nVerified = QUIZ.filter((q) => (VERIFIED as Record<string, string>)[q.id] === itemHash(q)).length;
const cats = new Set(CATEGORIES.map((c) => c.id));
for (const p of PROBLEMS) if (!cats.has(p.category)) { bad++; console.log("UNKNOWN category", p.id, p.category); }
const covered = new Set(TOPICS.flatMap((t) => t.categories ?? []));
for (const c of cats) if (!covered.has(c)) console.log("note: category not linked to a topic:", c);
const pid = new Set<string>(); for (const p of PROBLEMS) { if (pid.has(p.id)) { bad++; console.log("DUP problem", p.id); } pid.add(p.id); }

const by = (k: (t: (typeof TOPICS)[number]) => string) => Object.entries(TOPICS.reduce<Record<string, number>>((a, t) => ((a[k(t)] = (a[k(t)] ?? 0) + 1), a), {}));
console.log("topics", TOPICS.length, by((t) => t.track));
console.log("quiz", QUIZ.length, "mcq", QUIZ.filter((q) => q.options).length, "numeric", QUIZ.filter((q) => !q.options).length);
console.log("verified quiz items", nVerified, "of", QUIZ.length, "(the rest show [UNVERIFIED])");
console.log("cards", CARDS.length);
console.log("problems", PROBLEMS.length, Object.entries(PROBLEMS.reduce<Record<string, number>>((a, p) => ((a[p.kind] = (a[p.kind] ?? 0) + 1), a), {})));
console.log("notes chars", TOPICS.reduce((a, t) => a + t.notes.length, 0));
const min = TOPICS.map((t) => [t.id, QUIZ.filter((q) => q.topic === t.id).length] as const).sort((a, b) => a[1] - b[1]).slice(0, 4);
console.log("fewest quiz items:", min);
console.log(bad ? `${bad} problems` : "integrity OK");
process.exit(bad ? 1 : 0);
