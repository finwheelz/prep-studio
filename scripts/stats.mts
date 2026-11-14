// Content inventory + integrity checks.
import { CARDS, QUIZ, TOPICS } from "../src/data/syllabus";
import { PROBLEMS } from "../src/data/problems";
import { CATEGORIES } from "../src/data/taxonomy";

let bad = 0;
const ids = new Set<string>();
for (const t of TOPICS) { if (ids.has(t.id)) { bad++; console.log("DUP topic", t.id); } ids.add(t.id); }
for (const q of QUIZ) {
  if (q.options && (q.answer < 0 || q.answer >= q.options.length)) { bad++; console.log("BAD answer index", q.id); }
  if (q.options && new Set(q.options).size !== q.options.length) { bad++; console.log("DUP options", q.id); }
  if (!q.options && q.tol === undefined) { bad++; console.log("NO tol", q.id); }
}
const cats = new Set(CATEGORIES.map((c) => c.id));
for (const p of PROBLEMS) if (!cats.has(p.category)) { bad++; console.log("UNKNOWN category", p.id, p.category); }
const covered = new Set(TOPICS.flatMap((t) => t.categories ?? []));
for (const c of cats) if (!covered.has(c)) console.log("note: category not linked to a topic:", c);
const pid = new Set<string>(); for (const p of PROBLEMS) { if (pid.has(p.id)) { bad++; console.log("DUP problem", p.id); } pid.add(p.id); }

const by = (k: (t: (typeof TOPICS)[number]) => string) => Object.entries(TOPICS.reduce<Record<string, number>>((a, t) => ((a[k(t)] = (a[k(t)] ?? 0) + 1), a), {}));
console.log("topics", TOPICS.length, by((t) => t.track));
console.log("quiz", QUIZ.length, "mcq", QUIZ.filter((q) => q.options).length, "numeric", QUIZ.filter((q) => !q.options).length);
console.log("cards", CARDS.length);
console.log("problems", PROBLEMS.length, Object.entries(PROBLEMS.reduce<Record<string, number>>((a, p) => ((a[p.kind] = (a[p.kind] ?? 0) + 1), a), {})));
console.log("notes chars", TOPICS.reduce((a, t) => a + t.notes.length, 0));
const min = TOPICS.map((t) => [t.id, QUIZ.filter((q) => q.topic === t.id).length] as const).sort((a, b) => a[1] - b[1]).slice(0, 4);
console.log("fewest quiz items:", min);
console.log(bad ? `${bad} problems` : "integrity OK");
process.exit(bad ? 1 : 0);
