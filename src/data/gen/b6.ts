/**
 * Batch 6 generator: DILR logic sets (multi-attribute grids, scheduling, tournaments, Venn counting)
 * and probability (8 concepts).
 *
 * Logic sets are built as 3 puzzles × 4 questions. Each puzzle gets clues until brute force finds
 * exactly one solution (tournaments: until every question has one answer); the Python check solves
 * the puzzle again from the structured clues. Probability answers use closed forms here and are
 * recomputed in Python by enumerating outcomes (dice, cards, permutations, sequences) or by
 * numerical integration.
 */
import { build, int, pick, type GenQ, type Rng, type Tpl } from "./quant";

const r4 = (x: number) => Math.round(x * 10000) / 10000;
const D4 = " Give 4 decimals.";
function mulberry32(seed: number): Rng {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle<T>(a: T[], r: Rng): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
const perms = <T,>(a: T[]): T[][] => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));
const comb = (n: number, k: number) => (k < 0 || k > n ? 0 : fact(n) / (fact(k) * fact(n - k)));
function mcqOpts(r: Rng, correct: string, pool: string[]) {
  const wrong = shuffle([...new Set(pool.filter((p) => p !== correct))], r).slice(0, 3);
  const options = shuffle([correct, ...wrong], r);
  return { options, answer: options.indexOf(correct) };
}

// ═════════════════════════ Logic-puzzle engine (grids and schedules) ═════════════════════════
type Ref = { p: number } | { c: number; v: number };
type Clue = { t: "is" | "not" | "before" | "next"; a: Ref; b: Ref } | { t: "gap"; a: Ref; b: Ref; k: number };
interface Cat { name: string; values: string[]; pred: (v: string) => string; npred: (v: string) => string; noun: (v: string) => string; ordered?: boolean }
interface Puzzle { people: string[]; cats: Cat[]; sol: number[][]; clues: Clue[] }

const who = (a: number[][], ref: Ref) => ("p" in ref ? ref.p : a[ref.c].indexOf(ref.v));
function sat(a: number[][], cl: Clue): boolean {
  const x = who(a, cl.a), y = who(a, cl.b);
  if (cl.t === "is") return x === y;
  if (cl.t === "not") return x !== y;
  const dx = a[0][x], dy = a[0][y];
  if (cl.t === "before") return dx < dy;
  if (cl.t === "next") return dy === dx + 1;
  return Math.abs(dx - dy) === (cl as Extract<Clue, { t: "gap" }>).k + 1;
}
function solveAll(n: number, ncat: number, clues: Clue[], limit = 2): number[][][] {
  const P = perms([...Array(n).keys()]);
  const out: number[][][] = [];
  const rec = (a: number[][]) => {
    if (out.length >= limit) return;
    if (a.length === ncat) {
      if (clues.every((c) => sat(a, c))) out.push(a.map((x) => [...x]));
      return;
    }
    for (const p of P) {
      const b = [...a, p];
      // prune with clues that only touch categories assigned so far
      if (clues.every((c) => refsCats(c).every((k) => k < b.length) ? sat(b, c) : true)) rec(b);
      if (out.length >= limit) return;
    }
  };
  rec([]);
  return out;
}
const refsCats = (c: Clue) => {
  const cs = [c.a, c.b].filter((x) => "c" in x).map((x) => (x as { c: number }).c);
  return c.t === "before" || c.t === "next" || c.t === "gap" ? [...cs, 0] : cs;
};
function refText(pz: Puzzle, r: Ref) {
  return "p" in r ? pz.people[r.p] : pz.cats[r.c].noun(pz.cats[r.c].values[r.v]);
}
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
function clueText(pz: Puzzle, cl: Clue): string {
  const A = cap(refText(pz, cl.a));
  const B = refText(pz, cl.b);
  if (cl.t === "is" || cl.t === "not") {
    const b = cl.b as { c: number; v: number };
    const cat = pz.cats[b.c];
    return `${A} ${(cl.t === "is" ? cat.pred : cat.npred)(cat.values[b.v])}.`;
  }
  if (cl.t === "before") return `${A} is scheduled on an earlier day than ${B}.`;
  if (cl.t === "next") return `${cap(B)} is on the day immediately after ${refText(pz, cl.a)}.`;
  const k = (cl as Extract<Clue, { t: "gap" }>).k;
  return `Exactly ${k} day${k === 1 ? "" : "s"} lie${k === 1 ? "s" : ""} between ${refText(pz, cl.a)} and ${B}.`;
}
function makePuzzle(r: Rng, people: string[], cats: Cat[], maxClues: number): Puzzle | null {
  const n = people.length;
  const sol = cats.map(() => shuffle([...Array(n).keys()], r));
  const pz: Puzzle = { people, cats, sol, clues: [] };
  const pool: { c: Clue; w: number }[] = [];
  for (let p = 0; p < n; p++)
    for (let c = 0; c < cats.length; c++) {
      pool.push({ c: { t: "is", a: { p }, b: { c, v: sol[c][p] } }, w: cats[c].ordered ? 0.3 : 0.5 });
      for (let v = 0; v < n; v++) if (v !== sol[c][p]) pool.push({ c: { t: "not", a: { p }, b: { c, v } }, w: 0.35 });
    }
  for (let c1 = 0; c1 < cats.length; c1++)
    for (let c2 = 0; c2 < cats.length; c2++) {
      if (c1 === c2) continue;
      for (let p = 0; p < n; p++) {
        pool.push({ c: { t: "is", a: { c: c1, v: sol[c1][p] }, b: { c: c2, v: sol[c2][p] } }, w: 0.8 });
        const q = (p + 1 + Math.floor(r() * (n - 1))) % n;
        pool.push({ c: { t: "not", a: { c: c1, v: sol[c1][p] }, b: { c: c2, v: sol[c2][q] } }, w: 0.6 });
      }
    }
  if (cats[0].ordered) {
    const refs: Ref[] = [...people.map((_, p) => ({ p })), ...sol[1].map((v) => ({ c: 1, v }))];
    for (const x of refs) for (const y of refs) {
      const px = who(sol, x), py = who(sol, y);
      if (px === py) continue;
      const dx = sol[0][px], dy = sol[0][py];
      if (dx < dy) pool.push({ c: { t: "before", a: x, b: y }, w: 0.9 });
      if (dy === dx + 1) pool.push({ c: { t: "next", a: x, b: y }, w: 1 });
      if (dx < dy && dy - dx >= 2) pool.push({ c: { t: "gap", a: x, b: y, k: dy - dx - 1 }, w: 0.8 });
    }
  }
  const order = pool.map((x) => ({ ...x, k: r() * x.w })).sort((a, b) => b.k - a.k).map((x) => x.c);
  const clues: Clue[] = [];
  for (const c of order) {
    clues.push(c);
    if (clues.length >= 3 && solveAll(n, cats.length, clues).length === 1) break;
  }
  if (solveAll(n, cats.length, clues).length !== 1) return null;
  for (let i = clues.length - 2; i >= 0; i--) {
    const w = clues.filter((_, j) => j !== i);
    if (solveAll(n, cats.length, w).length === 1) clues.splice(i, 1);
  }
  if (clues.length > maxClues) return null;
  pz.clues = shuffle(clues, r);
  return pz;
}
const PY_LOGIC = `import itertools
def who(a, ref):
    return ref["p"] if "p" in ref else a[ref["c"]].index(ref["v"])
def sat(a, c):
    x, y = who(a, c["a"]), who(a, c["b"])
    t = c["t"]
    if t == "is": return x == y
    if t == "not": return x != y
    dx, dy = a[0][x], a[0][y]
    if t == "before": return dx < dy
    if t == "next": return dy == dx + 1
    return abs(dx - dy) == c["k"] + 1
def solve(n, ncat, clues):
    out = []
    for combo in itertools.product(itertools.permutations(range(n)), repeat=ncat):
        a = [list(p) for p in combo]
        if all(sat(a, c) for c in clues):
            out.append(a)
            if len(out) > 1: break
    return out
`;
type LogicQ = { ask: string; correct: string; pool: string[]; py: string };
function logicSet(r: Rng, id: string, topic: string, pz: Puzzle, qs: LogicQ[], d: 1 | 2 | 3, secs: number, fast: string, trap: string): GenQ[] {
  const stem = `${pz.people.length} people (${pz.people.join(", ")}) each have exactly one ${pz.cats.map((c) => c.name).join(" and one ")}, all different.\n\n${pz.clues.map((c, i) => `${i + 1}. ${clueText(pz, c)}`).join("\n")}`;
  return qs.map((q, i) => {
    const { options, answer } = mcqOpts(r, q.correct, q.pool);
    return {
      id: `${id}-q${i + 1}`, topic, d, secs, fast, trap,
      prompt: `**Set ${id.split("-").pop()}.** ${stem}\n\n**Q.** ${q.ask}`,
      options, answer,
      explain: `The clues allow exactly one arrangement; in it, ${q.correct}.`,
      py: `${PY_LOGIC}\nclues = ${JSON.stringify(pz.clues)}\nsols = solve(${pz.people.length}, ${pz.cats.length}, clues)\nassert len(sols) == 1, len(sols)\na = sols[0]\npeople = ${JSON.stringify(pz.people)}\ncats = ${JSON.stringify(pz.cats.map((c) => c.values))}\n${q.py}\nopts = ${JSON.stringify(options)}\nanswer = opts.index(got)`,
    };
  });
}
function askAttr(pz: Puzzle, p: number, c: number): LogicQ {
  const cat = pz.cats[c];
  return { ask: `What is ${pz.people[p]}'s ${cat.name}?`, correct: cat.values[pz.sol[c][p]], pool: cat.values, py: `got = cats[${c}][a[${c}][${p}]]` };
}
function askPerson(pz: Puzzle, c: number, v: number): LogicQ {
  const cat = pz.cats[c];
  return { ask: `Who is ${cat.noun(cat.values[v])}?`, correct: pz.people[pz.sol[c].indexOf(v)], pool: pz.people, py: `got = people[a[${c}].index(${v})]` };
}
function askCross(pz: Puzzle, c1: number, v: number, c2: number): LogicQ {
  const p = pz.sol[c1].indexOf(v);
  return { ask: `What is the ${pz.cats[c2].name} of ${pz.cats[c1].noun(pz.cats[c1].values[v])}?`, correct: pz.cats[c2].values[pz.sol[c2][p]], pool: pz.cats[c2].values, py: `got = cats[${c2}][a[${c2}][a[${c1}].index(${v})]]` };
}

const GRID_CATS: Cat[] = [
  { name: "city", values: ["Delhi", "Pune", "Goa", "Agra"], pred: (v) => `lives in ${v}`, npred: (v) => `does not live in ${v}`, noun: (v) => `the person from ${v}` },
  { name: "job", values: ["doctor", "lawyer", "teacher", "chef"], pred: (v) => `is the ${v}`, npred: (v) => `is not the ${v}`, noun: (v) => `the ${v}` },
  { name: "pet", values: ["cat", "dog", "parrot", "rabbit"], pred: (v) => `owns the ${v}`, npred: (v) => `does not own the ${v}`, noun: (v) => `the ${v} owner` },
];
const SCHED_CATS: Cat[] = [
  { name: "day", values: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], ordered: true, pred: (v) => `is scheduled on ${v}`, npred: (v) => `is not scheduled on ${v}`, noun: (v) => `the ${v} speaker` },
  { name: "subject", values: ["Maths", "Physics", "Chemistry", "Biology", "History"], pred: (v) => `gives the ${v} talk`, npred: (v) => `does not give the ${v} talk`, noun: (v) => `the ${v} talk` },
];
const NAMES = ["Asha", "Ravi", "Meera", "Kabir", "Tara", "Neel", "Isha", "Om", "Priya", "Dev"];

function gridItems(): GenQ[] {
  const r = mulberry32(6101);
  const out: GenQ[] = [];
  for (let s = 1; s <= 3; s++) {
    let pz: Puzzle | null = null;
    for (let t = 0; t < 200 && !pz; t++) pz = makePuzzle(r, shuffle(NAMES, r).slice(0, 4), GRID_CATS, 10);
    if (!pz) throw new Error("grid puzzle failed");
    const qs = [askAttr(pz, int(r, 0, 3), 0), askPerson(pz, 1, int(r, 0, 3)), askCross(pz, 2, int(r, 0, 3), 0), askCross(pz, 0, int(r, 0, 3), 1)];
    out.push(...logicSet(r, `p2-grid-G${s}`, "di-logic-grids", pz, qs, 2, 75, "Draw a people × attributes grid; mark ✓ and ✗; every ✓ crosses out its row and column.", "Treating a 'not' clue as telling you where something is."));
  }
  return out;
}
function schedItems(): GenQ[] {
  const r = mulberry32(6102);
  const out: GenQ[] = [];
  for (let s = 1; s <= 3; s++) {
    let pz: Puzzle | null = null;
    for (let t = 0; t < 200 && !pz; t++) pz = makePuzzle(r, shuffle(NAMES, r).slice(0, 5), SCHED_CATS, 9);
    if (!pz) throw new Error("schedule puzzle failed");
    const qs = [askAttr(pz, int(r, 0, 4), 0), askPerson(pz, 0, int(r, 0, 4)), askCross(pz, 1, int(r, 0, 4), 0), askCross(pz, 0, int(r, 0, 4), 1)];
    out.push(...logicSet(r, `p2-sched-S${s}`, "di-scheduling", pz, qs, 2, 90, "Lay out Monday–Friday as slots; place fixed clues, then blocks ('the day after'), then branch on 'earlier than' and gap clues.", "Reading 'exactly two days between' as two days apart."));
  }
  return out;
}

// ═════════════════════════ Tournaments ═════════════════════════
const TEAMS = ["Lions", "Tigers", "Eagles", "Sharks"];
const MATCHES: [number, number][] = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
function tourItems(): GenQ[] {
  const r = mulberry32(6103);
  const out: GenQ[] = [];
  const all: number[][] = [];
  for (let m = 0; m < 729; m++) all.push(MATCHES.map((_, i) => Math.floor(m / 3 ** i) % 3)); // 0 first wins, 1 draw, 2 second wins
  const points = (o: number[], w: number) => TEAMS.map((_, t) => MATCHES.reduce((s, [a, b], i) => s + (a === t ? [w, 1, 0][o[i]] : b === t ? [0, 1, w][o[i]] : 0), 0));
  let s = 0;
  while (out.length < 12) {
    const w = pick(r, [3, 2]);
    const o = MATCHES.map(() => pick(r, [0, 0, 1, 2, 2]));
    const pts = points(o, w);
    const draws = (x: number[]) => x.filter((v) => v === 1).length;
    const wins = (x: number[], t: number) => MATCHES.filter(([a, b], i) => (a === t && x[i] === 0) || (b === t && x[i] === 2)).length;
    const losses = (x: number[], t: number) => MATCHES.filter(([a, b], i) => (a === t && x[i] === 2) || (b === t && x[i] === 0)).length;
    const qm = int(r, 0, 5), tw = int(r, 0, 3), tl = int(r, 0, 3);
    const res = (x: number[], i: number) => (x[i] === 1 ? "Drawn" : `${TEAMS[x[i] === 0 ? MATCHES[i][0] : MATCHES[i][1]]} won`);
    const answers = (x: number[]) => [String(draws(x)), res(x, qm), String(wins(x, tw)), String(losses(x, tl))];
    const facts: number[] = [];
    const consistent = () => all.filter((x) => points(x, w).every((v, i) => v === pts[i]) && facts.every((i) => x[i] === o[i]));
    let cons = consistent();
    const order = shuffle([0, 1, 2, 3, 4, 5].filter((i) => i !== qm), r);
    for (const i of order) {
      if (answers(o).every((a, k) => cons.every((x) => answers(x)[k] === a))) break;
      facts.push(i);
      cons = consistent();
    }
    if (!answers(o).every((a, k) => cons.every((x) => answers(x)[k] === a))) continue;
    s++;
    const id = `p2-tour-T${s}`;
    const stem = `${TEAMS.length} teams (${TEAMS.join(", ")}) play a round robin: each pair meets once. A win earns ${w} points, a draw 1, a loss 0. Final points: ${TEAMS.map((t, i) => `${t} ${pts[i]}`).join(", ")}.${facts.length ? ` Also: ${facts.map((i) => (o[i] === 1 ? `${TEAMS[MATCHES[i][0]]} drew with ${TEAMS[MATCHES[i][1]]}` : `${TEAMS[o[i] === 0 ? MATCHES[i][0] : MATCHES[i][1]]} beat ${TEAMS[o[i] === 0 ? MATCHES[i][1] : MATCHES[i][0]]}`)).join("; ")}.` : ""}`;
    const A = answers(o);
    const py = `import itertools\nM = ${JSON.stringify(MATCHES)}\nT = ${JSON.stringify(TEAMS)}\ndef pts(x):\n    p = [0] * 4\n    for (a, b), v in zip(M, x):\n        if v == 0: p[a] += ${w}\n        elif v == 2: p[b] += ${w}\n        else: p[a] += 1; p[b] += 1\n    return p\ncons = [x for x in itertools.product(range(3), repeat=6) if pts(x) == ${JSON.stringify(pts)} and all(x[i] == v for i, v in ${JSON.stringify(facts.map((i) => [i, o[i]]))})]\ndef res(x, i): return "Drawn" if x[i] == 1 else T[M[i][0] if x[i] == 0 else M[i][1]] + " won"\ndef ans(x): return [str(sum(v == 1 for v in x)), res(x, ${qm}), str(sum(1 for (a, b), v in zip(M, x) if (a == ${tw} and v == 0) or (b == ${tw} and v == 2))), str(sum(1 for (a, b), v in zip(M, x) if (a == ${tl} and v == 2) or (b == ${tl} and v == 0)))]\nvals = {tuple(ans(x)) for x in cons}\nassert len(vals) == 1, vals\nV = vals.pop()`;
    const qText = [`How many matches ended in a draw?`, `What was the result of ${TEAMS[MATCHES[qm][0]]} vs ${TEAMS[MATCHES[qm][1]]}?`, `How many matches did ${TEAMS[tw]} win?`, `How many matches did ${TEAMS[tl]} lose?`];
    const pools = [["0", "1", "2", "3", "4"], [`${TEAMS[MATCHES[qm][0]]} won`, `${TEAMS[MATCHES[qm][1]]} won`, "Drawn"], ["0", "1", "2", "3"], ["0", "1", "2", "3"]];
    qText.forEach((q, k) => {
      const { options, answer } = mcqOpts(r, A[k], pools[k]);
      out.push({
        id: `${id}-q${k + 1}`, topic: "di-tournaments", d: 3, secs: 90, prompt: `**Set T${s}.** ${stem}\n\n**Q.** ${q}`, options, answer,
        explain: `Work out each team's record from its points (with ${w} for a win: points = ${w} × wins + draws). Only one set of results fits; it gives ${A[k]}.`,
        fast: w === 3
          ? "Each decisive match hands out 3 points and each draw 2, so total points = 18 − draws: the total fixes the number of draws immediately."
          : "With 2 points for a win, every match hands out exactly 2 points, so the total says nothing about draws. Work from each team's points: odd points mean an odd number of draws for that team.",
        trap: "Assuming the team with the most points won every match.",
        py: `${py}\nopts = ${JSON.stringify(options)}\nanswer = opts.index(V[${k}])`,
      });
    });
  }
  return out;
}

// ═════════════════════════ Venn counting ═════════════════════════
const SURVEYS = [["Hindi", "Tamil", "Marathi", "speak"], ["cricket", "football", "hockey", "play"], ["Netflix", "Prime", "Hotstar", "subscribe to"], ["Python", "SQL", "Excel", "know"]];
function vennData(r: Rng) {
  const reg = { a: int(r, 5, 60), b: int(r, 5, 60), c: int(r, 5, 60), ab: int(r, 2, 30), bc: int(r, 2, 30), ca: int(r, 2, 30), abc: int(r, 1, 20), none: int(r, 0, 40) };
  const A = reg.a + reg.ab + reg.ca + reg.abc, B = reg.b + reg.ab + reg.bc + reg.abc, C = reg.c + reg.bc + reg.ca + reg.abc;
  const AB = reg.ab + reg.abc, BC = reg.bc + reg.abc, CA = reg.ca + reg.abc;
  const N = Object.values(reg).reduce((s, v) => s + v, 0);
  return { reg, A, B, C, AB, BC, CA, N };
}
function vennStem(v: ReturnType<typeof vennData>, s: string[]) {
  return `In a survey of ${v.N} people about which of ${s[0]}, ${s[1]} and ${s[2]} they ${s[3]}: ${v.A} ${s[3]} ${s[0]}, ${v.B} ${s[3]} ${s[1]}, ${v.C} ${s[3]} ${s[2]}; ${v.AB} ${s[3]} both ${s[0]} and ${s[1]}, ${v.BC} both ${s[1]} and ${s[2]}, ${v.CA} both ${s[0]} and ${s[2]}; and ${v.reg.abc} ${s[3]} all three.`;
}
const PY_VENN = (v: ReturnType<typeof vennData>) => `N, A, B, C, AB, BC, CA, ABC = ${v.N}, ${v.A}, ${v.B}, ${v.C}, ${v.AB}, ${v.BC}, ${v.CA}, ${v.reg.abc}`;
const VENN: Tpl[] = [
  { key: "onlya", d: 1, secs: 60, fast: "Only A = A − (A∩B) − (A∩C) + (A∩B∩C).", trap: "Subtracting the triple overlap instead of adding it back.",
    make: (r) => { const v = vennData(r), s = pick(r, SURVEYS);
      return { prompt: `${vennStem(v, s)} How many ${s[3]} only ${s[0]}?`, answer: v.reg.a, tol: 0, explain: `${v.A} − ${v.AB} − ${v.CA} + ${v.reg.abc} = ${v.reg.a}.`, py: `${PY_VENN(v)}\nanswer = A - AB - CA + ABC` }; } },
  { key: "exactly2", d: 2, secs: 75, fast: "Exactly two = (A∩B + B∩C + C∩A) − 3 × (A∩B∩C).", trap: "Subtracting the triple overlap only once.",
    make: (r) => { const v = vennData(r), s = pick(r, SURVEYS);
      return { prompt: `${vennStem(v, s)} How many ${s[3]} exactly two of them?`, answer: v.reg.ab + v.reg.bc + v.reg.ca, tol: 0, explain: `${v.AB} + ${v.BC} + ${v.CA} − 3 × ${v.reg.abc} = ${v.reg.ab + v.reg.bc + v.reg.ca}.`, py: `${PY_VENN(v)}\nanswer = AB + BC + CA - 3 * ABC` }; } },
  { key: "none", d: 2, secs: 75, fast: "At least one = A + B + C − (pairwise) + (all three); none = total − at least one.", trap: "Forgetting to add the triple overlap back.",
    make: (r) => { const v = vennData(r), s = pick(r, SURVEYS);
      return { prompt: `${vennStem(v, s)} How many ${s[3]} none of the three?`, answer: v.reg.none, tol: 0, explain: `At least one = ${v.A} + ${v.B} + ${v.C} − ${v.AB} − ${v.BC} − ${v.CA} + ${v.reg.abc} = ${v.N - v.reg.none}; none = ${v.reg.none}.`, py: `${PY_VENN(v)}\nanswer = N - (A + B + C - AB - BC - CA + ABC)` }; } },
  { key: "atleast2", d: 2, secs: 75, fast: "At least two = pairwise sum − 2 × (all three).", trap: "Adding exactly-two and all-three but double counting the triple.",
    make: (r) => { const v = vennData(r), s = pick(r, SURVEYS);
      return { prompt: `${vennStem(v, s)} How many ${s[3]} at least two of them?`, answer: v.reg.ab + v.reg.bc + v.reg.ca + v.reg.abc, tol: 0, explain: `${v.AB} + ${v.BC} + ${v.CA} − 2 × ${v.reg.abc} = ${v.reg.ab + v.reg.bc + v.reg.ca + v.reg.abc}.`, py: `${PY_VENN(v)}\nanswer = AB + BC + CA - 2 * ABC` }; } },
];

// ═════════════════════════ Probability ═════════════════════════
const DECK = `deck = [(r, s) for r in range(1, 14) for s in "SHDC"]  # 1 = ace, 11–13 = J, Q, K`;
const BASICS: Tpl[] = [
  { key: "dice", d: 1, secs: 45, fast: "Two dice: 36 equally likely ordered pairs. Count the pairs.", trap: "Counting (2, 5) and (5, 2) as one outcome.",
    make: (r) => { const s = int(r, 3, 11), ge = r() < 0.5;
      const n = [...Array(36).keys()].filter((i) => { const t = Math.floor(i / 6) + (i % 6) + 2; return ge ? t >= s : t === s; }).length;
      return { prompt: `Two fair dice are rolled. What is the probability that the sum is ${ge ? `at least ${s}` : `exactly ${s}`}?${D4}`, answer: r4(n / 36), tol: 0.0002, explain: `${n} of 36 ordered outcomes: ${n}/36 = ${r4(n / 36)}.`,
        py: `import itertools\nout = list(itertools.product(range(1, 7), repeat=2))\nanswer = sum(1 for a, b in out if a + b ${ge ? ">=" : "=="} ${s}) / len(out)` }; } },
  { key: "coins", d: 1, secs: 45, fast: "P(at least k heads) = Σ C(n, j) / 2ⁿ for j ≥ k; use the complement when k is small.", trap: "Treating 'at least 2' as 'exactly 2'.",
    make: (r) => { const n = int(r, 3, 7), k = int(r, 1, n - 1);
      let c = 0; for (let j = k; j <= n; j++) c += comb(n, j);
      return { prompt: `${n} fair coins are tossed. What is the probability of getting at least ${k} heads?${D4}`, answer: r4(c / 2 ** n), tol: 0.0002, explain: `Σ C(${n}, j) for j = ${k}…${n} = ${c}; ${c}/${2 ** n} = ${r4(c / 2 ** n)}.`,
        py: `import itertools\nout = list(itertools.product("HT", repeat=${n}))\nanswer = sum(1 for o in out if o.count("H") >= ${k}) / len(out)` }; } },
  { key: "cards", d: 2, secs: 60, fast: "P(A or B) = P(A) + P(B) − P(A and B).", trap: "Counting the card that is in both groups twice.",
    make: (r) => { const suit = pick(r, [["heart", "H"], ["spade", "S"], ["diamond", "D"], ["club", "C"]] as const), rk = pick(r, [["king", 13], ["queen", 12], ["ace", 1], ["jack", 11]] as const);
      return { prompt: `One card is drawn from a standard 52-card deck. What is the probability that it is a ${suit[0]} or a ${rk[0]}?${D4}`, answer: r4(16 / 52), tol: 0.0002, explain: `13 ${suit[0]}s + 4 ${rk[0]}s − 1 ${rk[0]} of ${suit[0]}s = 16; 16/52 = ${r4(16 / 52)}.`,
        py: `${DECK}\nanswer = sum(1 for r, s in deck if s == "${suit[1]}" or r == ${rk[1]}) / len(deck)` }; } },
  { key: "atleastone", d: 2, secs: 45, fast: "P(at least one) = 1 − P(none).", trap: "Adding 1/6 for each roll, which can exceed 1.",
    make: (r) => { const n = int(r, 2, 5);
      return { prompt: `A fair die is rolled ${n} times. What is the probability of getting at least one six?${D4}`, answer: r4(1 - (5 / 6) ** n), tol: 0.0002, explain: `1 − (5/6)^${n} = ${r4(1 - (5 / 6) ** n)}.`,
        py: `import itertools\nout = list(itertools.product(range(1, 7), repeat=${n}))\nanswer = sum(1 for o in out if 6 in o) / len(out)` }; } },
];
const COND: Tpl[] = [
  { key: "dice", d: 2, secs: 60, fast: "Restrict the sample space to the given event, then count.", trap: "Dividing by 36 instead of the size of the given event.",
    make: (r) => { const s = int(r, 4, 10), par = pick(r, ["even", "odd"]);
      const given = [...Array(36).keys()].map((i) => [Math.floor(i / 6) + 1, (i % 6) + 1]).filter(([a, b]) => a + b === s);
      const fav = given.filter(([a]) => (par === "even" ? a % 2 === 0 : a % 2 === 1)).length;
      if (!given.length) return null;
      return { prompt: `Two fair dice are rolled and the sum is ${s}. What is the probability that the first die shows an ${par} number?${D4}`, answer: r4(fav / given.length), tol: 0.0002, explain: `${given.length} outcomes have sum ${s}; ${fav} of them have an ${par} first die: ${fav}/${given.length}.`,
        py: `import itertools\nB = [(a, b) for a, b in itertools.product(range(1, 7), repeat=2) if a + b == ${s}]\nanswer = sum(1 for a, b in B if a % 2 == ${par === "even" ? 0 : 1}) / len(B)` }; } },
  { key: "cards", d: 2, secs: 60, fast: "Without replacement: P(both) = P(first) × P(second | first).", trap: "Using 13/52 × 13/52 as if the first card were replaced.",
    make: (r) => { const g = pick(r, [["aces", 4, "r == 1"], ["hearts", 13, 's == "H"'], ["face cards (J, Q, K)", 12, "r >= 11"], ["kings", 4, "r == 13"]] as const);
      const v = (g[1] / 52) * ((g[1] - 1) / 51);
      return { prompt: `Two cards are drawn from a standard deck without replacement. What is the probability that both are ${g[0]}?${D4}`, answer: r4(v), tol: 0.0002, explain: `${g[1]}/52 × ${g[1] - 1}/51 = ${r4(v)}.`,
        py: `import itertools\n${DECK}\nok = lambda c: (lambda r, s: ${g[2]})(*c)\npairs = list(itertools.permutations(deck, 2))\nanswer = sum(1 for x, y in pairs if ok(x) and ok(y)) / len(pairs)` }; } },
  { key: "indep", d: 2, secs: 60, fast: "A and B are independent exactly when P(A and B) = P(A) × P(B).", trap: "Confusing independent with mutually exclusive (disjoint events with positive probability are dependent).",
    make: (r) => { const evs: [string, string, (a: number, b: number) => boolean][] = [
        ["the first die is even", "a % 2 == 0", (a) => a % 2 === 0], ["the sum is 7", "a + b == 7", (a, b) => a + b === 7], ["the sum is 8", "a + b == 8", (a, b) => a + b === 8],
        ["the second die shows 6", "b == 6", (_a, b) => b === 6], ["the sum is even", "(a + b) % 2 == 0", (a, b) => (a + b) % 2 === 0], ["both dice are equal", "a == b", (a, b) => a === b], ["the first die is at most 2", "a <= 2", (a) => a <= 2]];
      const [e1, e2] = shuffle(evs, r).slice(0, 2);
      const out = [...Array(36).keys()].map((i) => [Math.floor(i / 6) + 1, (i % 6) + 1]);
      const pa = out.filter(([a, b]) => e1[2](a, b)).length, pb = out.filter(([a, b]) => e2[2](a, b)).length, pab = out.filter(([a, b]) => e1[2](a, b) && e2[2](a, b)).length;
      const ind = pab * 36 === pa * pb;
      const options = ["Independent", "Not independent"];
      return { prompt: `Two fair dice are rolled. Let A be "${e1[0]}" and B be "${e2[0]}". Are A and B independent?`, options, answer: ind ? 0 : 1, explain: `P(A) = ${pa}/36, P(B) = ${pb}/36, P(A and B) = ${pab}/36. ${ind ? "These satisfy" : "These do not satisfy"} P(A and B) = P(A)P(B).`,
        py: `import itertools\nfrom fractions import Fraction as F\nout = list(itertools.product(range(1, 7), repeat=2))\nP = lambda f: F(sum(1 for a, b in out if f(a, b)), 36)\nA = lambda a, b: ${e1[1]}\nB = lambda a, b: ${e2[1]}\nanswer = 0 if P(lambda a, b: A(a, b) and B(a, b)) == P(A) * P(B) else 1` }; } },
  { key: "children", d: 3, secs: 60, fast: "List the equally likely birth orders (BB, BG, GB, GG …) and cross out those the condition rules out.", trap: "Answering 1/2 for 'at least one is a boy' (it is 1/3 with two children).",
    make: (r) => { const v = pick(r, [["two", "at least one is a boy", "both are boys", 2, "'B' in o", "o.count('B') == 2", 1 / 3], ["two", "the older child is a boy", "both are boys", 2, "o[0] == 'B'", "o.count('B') == 2", 1 / 2], ["three", "at least one is a girl", "all three are girls", 3, "'G' in o", "o.count('G') == 3", 1 / 7], ["three", "at least two are boys", "all three are boys", 3, "o.count('B') >= 2", "o.count('B') == 3", 1 / 4]] as const);
      return { prompt: `A family has ${v[0]} children; each is equally likely to be a boy or a girl. Given that ${v[1]}, what is the probability that ${v[2]}?${D4}`, answer: r4(v[6]), tol: 0.0002, explain: `List the ${2 ** v[3]} equally likely birth orders, keep those where ${v[1]}, and count those where ${v[2]}: ${r4(v[6])}.`,
        py: `import itertools\nout = list(itertools.product("BG", repeat=${v[3]}))\ngiven = [o for o in out if ${v[4]}]\nanswer = sum(1 for o in given if ${v[5]}) / len(given)` }; } },
];
const BAYES: Tpl[] = [
  { key: "total", d: 2, secs: 60, fast: "Total probability: P(D) = Σ P(machine) × P(D | machine).", trap: "Averaging the defect rates without weighting by output.",
    make: (r) => { const sh = pick(r, [[50, 30, 20], [40, 35, 25], [60, 25, 15], [45, 35, 20]]), dr = [pick(r, [1, 2, 3]), pick(r, [2, 3, 4]), pick(r, [3, 4, 5, 6])];
      const pd = sh.reduce((s, x, i) => s + (x / 100) * (dr[i] / 100), 0);
      return { prompt: `Machines A, B and C make ${sh[0]}%, ${sh[1]}% and ${sh[2]}% of a factory's output, with defect rates ${dr[0]}%, ${dr[1]}% and ${dr[2]}%. What is the probability that a randomly chosen item is defective?${D4}`, answer: r4(pd), tol: 0.0002, explain: `${sh.map((x, i) => `${x / 100} × ${dr[i] / 100}`).join(" + ")} = ${r4(pd)}.`,
        py: `units = [${sh.join(", ")}]\nunits = [u * 1000 for u in units]\ndefects = [u * d // 100 for u, d in zip(units, ${JSON.stringify(dr)})]\nanswer = sum(defects) / sum(units)` }; } },
  { key: "machine", d: 3, secs: 75, fast: "Bayes: P(A | D) = P(A)P(D | A) / P(D).", trap: "Reporting P(D | A) instead of P(A | D).",
    make: (r) => { const sh = pick(r, [[50, 30, 20], [40, 35, 25], [60, 25, 15], [45, 35, 20]]), dr = [pick(r, [1, 2, 3]), pick(r, [2, 3, 4]), pick(r, [3, 4, 5, 6])], m = int(r, 0, 2);
      const pd = sh.reduce((s, x, i) => s + (x / 100) * (dr[i] / 100), 0), v = ((sh[m] / 100) * (dr[m] / 100)) / pd;
      return { prompt: `Machines A, B and C make ${sh[0]}%, ${sh[1]}% and ${sh[2]}% of a factory's output, with defect rates ${dr[0]}%, ${dr[1]}% and ${dr[2]}%. An item is found to be defective. What is the probability that machine ${"ABC"[m]} made it?${D4}`, answer: r4(v), tol: 0.0002, explain: `P(${"ABC"[m]} and defective) = ${r4((sh[m] / 100) * (dr[m] / 100))}; P(defective) = ${r4(pd)}; ratio ${r4(v)}.`,
        py: `units = [u * 1000 for u in ${JSON.stringify(sh)}]\ndefects = [u * d // 100 for u, d in zip(units, ${JSON.stringify(dr)})]\nanswer = defects[${m}] / sum(defects)` }; } },
  { key: "test", d: 3, secs: 90, fast: "Use 1,000,000 people: count true positives and false positives, then TP / (TP + FP).", trap: "Confusing sensitivity P(+ | disease) with P(disease | +).",
    make: (r) => { const prev = pick(r, [0.5, 1, 2, 5]), sens = pick(r, [90, 95, 99]), spec = pick(r, [90, 95, 98, 99]);
      const tp = (prev / 100) * (sens / 100), fp = (1 - prev / 100) * (1 - spec / 100), v = tp / (tp + fp);
      return { prompt: `A disease affects ${prev}% of people. A test detects it in ${sens}% of people who have it (sensitivity) and correctly clears ${spec}% of people who don't (specificity). A random person tests positive. What is the probability they have the disease?${D4}`, answer: r4(v), tol: 0.0002, explain: `True positives ${r4(tp)}, false positives ${r4(fp)}: ${r4(tp)} / (${r4(tp)} + ${r4(fp)}) = ${r4(v)}.`,
        py: `N = 10_000_000\nsick = round(N * ${prev} / 100)\nwell = N - sick\ntp = round(sick * ${sens} / 100)\nfp = round(well * (100 - ${spec}) / 100)\nanswer = tp / (tp + fp)` }; } },
  { key: "urn", d: 2, secs: 75, fast: "P(urn 1 | red) = P(urn 1)P(red | urn 1) / P(red).", trap: "Pooling all the balls together, which ignores that each urn is equally likely to be chosen.",
    make: (r) => { const r1 = int(r, 1, 8), b1 = int(r, 1, 8), r2 = int(r, 1, 8), b2 = int(r, 1, 8);
      const v = (0.5 * r1) / (r1 + b1) / (0.5 * (r1 / (r1 + b1)) + 0.5 * (r2 / (r2 + b2)));
      return { prompt: `Urn 1 has ${r1} red and ${b1} blue balls; urn 2 has ${r2} red and ${b2} blue. An urn is chosen at random and a ball drawn from it is red. What is the probability that it came from urn 1?${D4}`, answer: r4(v), tol: 0.0002, explain: `P(red) = ½ × ${r1}/${r1 + b1} + ½ × ${r2}/${r2 + b2}; P(urn 1 | red) = ${r4(v)}.`,
        py: `from fractions import Fraction as F\nurns = [["R"] * ${r1} + ["B"] * ${b1}, ["R"] * ${r2} + ["B"] * ${b2}]\nw = {}\nfor u, balls in enumerate(urns):\n    for ball in balls:\n        w[(u, ball)] = w.get((u, ball), 0) + F(1, 2) / len(balls)\nanswer = float(w.get((0, "R"), 0) / (w.get((0, "R"), 0) + w.get((1, "R"), 0)))` }; } },
];
const DRV: Tpl[] = [
  { key: "k", d: 1, secs: 45, fast: "Probabilities sum to 1: solve for k.", trap: "Forgetting that every probability must be between 0 and 1.",
    make: (r) => { const w = [int(r, 1, 4), int(r, 1, 5), int(r, 1, 6), int(r, 1, 4)];
      const k = 1 / w.reduce((a, b) => a + b, 0);
      return { prompt: `X takes the values 0, 1, 2, 3 with probabilities ${w.map((x) => (x === 1 ? "k" : `${x}k`)).join(", ")}. What is k?${D4}`, answer: r4(k), tol: 0.0002, explain: `${w.join(" + ")} = ${w.reduce((a, b) => a + b, 0)}, so k = 1/${w.reduce((a, b) => a + b, 0)} = ${r4(k)}.`,
        py: `from fractions import Fraction as F\nw = ${JSON.stringify(w)}\nk = next(F(1, n) for n in range(1, 1000) if sum(F(x, n) for x in w) == 1)\nanswer = float(k)` }; } },
  { key: "mean", d: 1, secs: 45, fast: "E[X] = Σ x · P(X = x).", trap: "Averaging the values without weighting by probability.",
    make: (r) => { const w = [int(r, 1, 4), int(r, 1, 5), int(r, 1, 6), int(r, 1, 4)], S = w.reduce((a, b) => a + b, 0);
      const e = w.reduce((s, x, i) => s + i * x, 0) / S;
      return { prompt: `X takes the values 0, 1, 2, 3 with probabilities ${w.map((x) => `${x}/${S}`).join(", ")}. What is E[X]?${D4}`, answer: r4(e), tol: 0.0002, explain: `(0·${w[0]} + 1·${w[1]} + 2·${w[2]} + 3·${w[3]})/${S} = ${r4(e)}.`,
        py: `w = ${JSON.stringify(w)}\noutcomes = [x for x, n in enumerate(w) for _ in range(n)]\nanswer = sum(outcomes) / len(outcomes)` }; } },
  { key: "cdf", d: 1, secs: 30, fast: "F(a) = P(X ≤ a): add the probabilities up to a.", trap: "Using < instead of ≤.",
    make: (r) => { const w = [int(r, 1, 4), int(r, 1, 5), int(r, 1, 6), int(r, 1, 4)], S = w.reduce((a, b) => a + b, 0), a = int(r, 0, 2), ge = r() < 0.5;
      const v = ge ? w.slice(a).reduce((s, x) => s + x, 0) / S : w.slice(0, a + 1).reduce((s, x) => s + x, 0) / S;
      return { prompt: `X takes the values 0, 1, 2, 3 with probabilities ${w.map((x) => `${x}/${S}`).join(", ")}. What is P(X ${ge ? "≥" : "≤"} ${a})?${D4}`, answer: r4(v), tol: 0.0002, explain: `Add the probabilities of the values ${ge ? `${a} and above` : `up to ${a}`}: ${r4(v)}.`,
        py: `w = ${JSON.stringify(w)}\noutcomes = [x for x, n in enumerate(w) for _ in range(n)]\nanswer = sum(1 for x in outcomes if x ${ge ? ">=" : "<="} ${a}) / len(outcomes)` }; } },
  { key: "game", d: 2, secs: 60, fast: "Expected value of a game = Σ payoff × probability; a negative value means you lose on average.", trap: "Ignoring the cost of playing.",
    make: (r) => { const win = int(r, 2, 10), cost = int(r, 1, 6);
      const ev = ([2, 4, 6].reduce((s, f) => s + f * win, 0) - 3 * cost) / 6;
      return { prompt: `You roll a fair die. If it shows an even number you win ₹${win} times the number shown; if it is odd you pay ₹${cost}. What is your expected gain in rupees? Give a negative number for an expected loss.${D4}`, answer: r4(ev), tol: 0.0002, explain: `(${win}(2 + 4 + 6) − 3 × ${cost})/6 = ${r4(ev)}.`,
        py: `answer = sum((${win} * f) if f % 2 == 0 else -${cost} for f in range(1, 7)) / 6` }; } },
];
const SIMPSON = `def integrate(f, a, b, n=20000):
    h = (b - a) / n
    s = f(a) + f(b) + sum((4 if i % 2 else 2) * f(a + i * h) for i in range(1, n))
    return s * h / 3`;
const CRV: Tpl[] = [
  { key: "c", d: 2, secs: 60, fast: "A density must integrate to 1: ∫₀ᵃ c·x dx = c·a²/2 = 1.", trap: "Setting f(a) = 1 instead of the total area.",
    make: (r) => { const a = int(r, 2, 6);
      return { prompt: `X has density f(x) = c·x for 0 ≤ x ≤ ${a} (and 0 elsewhere). What is c?${D4}`, answer: r4(2 / (a * a)), tol: 0.0002, explain: `c × ${a}²/2 = 1, so c = 2/${a * a} = ${r4(2 / (a * a))}.`,
        py: `${SIMPSON}\nanswer = 1 / integrate(lambda x: x, 0, ${a})` }; } },
  { key: "prob", d: 2, secs: 60, fast: "P(X < b) = ∫₀ᵇ f(x) dx; for f(x) = 2x/a² it is b²/a².", trap: "Using b/a, which is right only for a uniform density.",
    make: (r) => { const a = int(r, 2, 6), b = r4(a * pick(r, [0.25, 0.4, 0.5, 0.6, 0.75]));
      return { prompt: `X has density f(x) = 2x/${a * a} for 0 ≤ x ≤ ${a}. What is P(X < ${b})?${D4}`, answer: r4((b * b) / (a * a)), tol: 0.0002, explain: `∫₀^${b} 2x/${a * a} dx = ${b}²/${a * a} = ${r4((b * b) / (a * a))}.`,
        py: `${SIMPSON}\nanswer = integrate(lambda x: 2 * x / ${a * a}, 0, ${b})` }; } },
  { key: "uniform", d: 1, secs: 45, fast: "Uniform on [a, b]: probability = length of the interval / (b − a).", trap: "Including the part of the interval outside [a, b].",
    make: (r) => { const a = int(r, 0, 10), b = a + int(r, 5, 20), c = int(r, a, b - 2), d = int(r, c + 1, b);
      return { prompt: `X is uniformly distributed on [${a}, ${b}]. What is P(${c} < X < ${d})?${D4}`, answer: r4((d - c) / (b - a)), tol: 0.0002, explain: `(${d} − ${c})/(${b} − ${a}) = ${r4((d - c) / (b - a))}.`,
        py: `${SIMPSON}\nanswer = integrate(lambda x: 1 / (${b} - ${a}), ${c}, ${d})` }; } },
  { key: "expo", d: 2, secs: 60, fast: "Exponential with rate λ: P(X > t) = e^(−λt). Memoryless.", trap: "Using λ as the mean (the mean is 1/λ).",
    make: (r) => { const mean = pick(r, [2, 4, 5, 10]), t = int(r, 1, 2 * mean);
      return { prompt: `The time between bus arrivals is exponentially distributed with a mean of ${mean} minutes. What is the probability you wait more than ${t} minutes?${D4}`, answer: r4(Math.exp(-t / mean)), tol: 0.0002, explain: `λ = 1/${mean}; P(X > ${t}) = e^(−${t}/${mean}) = ${r4(Math.exp(-t / mean))}.`,
        py: `import math\n${SIMPSON}\nlam = 1 / ${mean}\nanswer = 1 - integrate(lambda x: lam * math.exp(-lam * x), 0, ${t})` }; } },
];
const EXP: Tpl[] = [
  { key: "dice", d: 1, secs: 30, fast: "Linearity: E[sum] = sum of E's = 3.5 per die.", trap: "Listing every outcome instead of using linearity.",
    make: (r) => { const n = int(r, 2, 4), k = pick(r, [1, 2, 3]);
      return { prompt: `${n} fair dice are rolled. What is the expected value of ${k === 1 ? "the sum" : `${k} times the sum`} of the faces?${D4}`, answer: r4(3.5 * n * k), tol: 0.0002, explain: `${k} × ${n} × 3.5 = ${3.5 * n * k}.`,
        py: `import itertools\nout = list(itertools.product(range(1, 7), repeat=${n}))\nanswer = sum(${k} * sum(o) for o in out) / len(out)` }; } },
  { key: "adjacent", d: 3, secs: 75, fast: "Indicator trick: E[count] = Σ P(each event). Each of the n − 1 pairs (i, i + 1) is adjacent in that order with probability 1/n.", trap: "Trying to find the full distribution of the count.",
    make: (r) => { const n = int(r, 3, 6);
      return { prompt: `The numbers 1 to ${n} are arranged in a random order. What is the expected number of values i for which i + 1 comes immediately after i?${D4}`, answer: r4((n - 1) / n), tol: 0.0002, explain: `${n - 1} possible pairs, each in place with probability 1/${n}: ${n - 1}/${n} = ${r4((n - 1) / n)}.`,
        py: `import itertools\nps = list(itertools.permutations(range(1, ${n} + 1)))\nanswer = sum(sum(1 for a, b in zip(p, p[1:]) if b == a + 1) for p in ps) / len(ps)` }; } },
  { key: "distinct", d: 3, secs: 75, fast: "Indicator per face: P(face appears) = 1 − (5/6)ⁿ, so E = 6(1 − (5/6)ⁿ).", trap: "Assuming n rolls show n distinct faces.",
    make: (r) => { const n = int(r, 2, 5);
      return { prompt: `A fair die is rolled ${n} times. What is the expected number of distinct faces that appear?${D4}`, answer: r4(6 * (1 - (5 / 6) ** n)), tol: 0.0002, explain: `6 × (1 − (5/6)^${n}) = ${r4(6 * (1 - (5 / 6) ** n))}.`,
        py: `import itertools\nout = list(itertools.product(range(1, 7), repeat=${n}))\nanswer = sum(len(set(o)) for o in out) / len(out)` }; } },
  { key: "runs", d: 2, secs: 60, fast: "Runs = 1 + number of changes; each of the n − 1 gaps is a change with probability ½.", trap: "Counting heads instead of runs.",
    make: (r) => { const n = int(r, 3, 10);
      return { prompt: `A fair coin is tossed ${n} times. A run is a maximal block of identical results (HHTH has 3 runs). What is the expected number of runs?${D4}`, answer: r4(1 + (n - 1) / 2), tol: 0.0002, explain: `1 + (${n} − 1)/2 = ${1 + (n - 1) / 2}.`,
        py: `import itertools\nout = list(itertools.product("HT", repeat=${n}))\nanswer = sum(1 + sum(1 for a, b in zip(o, o[1:]) if a != b) for o in out) / len(out)` }; } },
];
const VAR: Tpl[] = [
  { key: "uniform", d: 1, secs: 45, fast: "A fair die numbered 1 to k has variance (k² − 1)/12.", trap: "Using E[X²] without subtracting (E[X])².",
    make: (r) => { const k = pick(r, [4, 6, 8, 10, 12, 20]);
      return { prompt: `A fair ${k}-sided die shows 1 to ${k}. What is the variance of the result?${D4}`, answer: r4((k * k - 1) / 12), tol: 0.0002, explain: `(${k}² − 1)/12 = ${r4((k * k - 1) / 12)}.`,
        py: `xs = range(1, ${k} + 1)\nm = sum(xs) / ${k}\nanswer = sum((x - m) ** 2 for x in xs) / ${k}` }; } },
  { key: "linear", d: 2, secs: 60, fast: "Var(aX + b) = a² Var(X): shifting does nothing, scaling squares.", trap: "Multiplying the variance by a instead of a², or adding b.",
    make: (r) => { const w = [int(r, 1, 4), int(r, 1, 5), int(r, 1, 4)], S = w.reduce((a, b) => a + b, 0), a = pick(r, [2, 3, -2]), b = int(r, 1, 9);
      const m = (w[1] + 2 * w[2]) / S, v = (w[1] + 4 * w[2]) / S - m * m;
      return { prompt: `X takes the values 0, 1, 2 with probabilities ${w.map((x) => `${x}/${S}`).join(", ")}. What is Var(${a}X + ${b})?${D4}`, answer: r4(a * a * v), tol: 0.0002, explain: `Var(X) = E[X²] − (E[X])² = ${r4(v)}; × ${a}² = ${r4(a * a * v)}.`,
        py: `w = ${JSON.stringify(w)}\nys = [${a} * x + ${b} for x, n in enumerate(w) for _ in range(n)]\nm = sum(ys) / len(ys)\nanswer = sum((y - m) ** 2 for y in ys) / len(ys)` }; } },
  { key: "sum", d: 2, secs: 45, fast: "For independent X and Y, Var(X ± Y) = Var(X) + Var(Y).", trap: "Subtracting variances for X − Y.",
    make: (r) => { const v = pick(r, [["Two", "the first minus the second", "a - b", 2], ["Two", "their sum", "a + b", 2], ["Three", "their sum", "a + b + c", 3], ["Three", "the first two minus the third", "a + b - c", 3]] as const);
      return { prompt: `${v[0]} fair six-sided dice are rolled. What is the variance of ${v[1]}?${D4}`, answer: r4((v[3] * 35) / 12), tol: 0.0002, explain: `Each die has variance 35/12 and they are independent, so the variance is ${v[3]} × 35/12 = ${r4((v[3] * 35) / 12)}, whether you add or subtract.`,
        py: `import itertools\nvs = [${v[2]} for a, b, c in itertools.product(range(1, 7), repeat=3)]\nm = sum(vs) / len(vs)\nanswer = sum((x - m) ** 2 for x in vs) / len(vs)` }; } },
  { key: "corr", d: 2, secs: 90, fast: "r = Σ(x − x̄)(y − ȳ) / √(Σ(x − x̄)² Σ(y − ȳ)²).", trap: "Forgetting to centre the data, or dividing by n in one place and n − 1 in another.",
    make: (r) => { const x = [1, 2, 3, 4, 5], y = x.map(() => int(r, 1, 12));
      const mx = 3, my = y.reduce((a, b) => a + b, 0) / 5;
      const sxy = x.reduce((s, xi, i) => s + (xi - mx) * (y[i] - my), 0), sxx = 10, syy = y.reduce((s, yi) => s + (yi - my) ** 2, 0);
      if (syy === 0) return null;
      return { prompt: `What is the Pearson correlation between x = (${x.join(", ")}) and y = (${y.join(", ")})?${D4}`, answer: r4(sxy / Math.sqrt(sxx * syy)), tol: 0.0002, explain: `Σ(x − x̄)(y − ȳ) = ${r4(sxy)}, Σ(x − x̄)² = 10, Σ(y − ȳ)² = ${r4(syy)}: r = ${r4(sxy / Math.sqrt(sxx * syy))}.`,
        py: `import statistics\nanswer = statistics.correlation(${JSON.stringify(x)}, ${JSON.stringify(y)})` }; } },
];
const DIST: Tpl[] = [
  { key: "binom", d: 2, secs: 60, fast: "Binomial: P(X = k) = C(n, k) pᵏ (1 − p)ⁿ⁻ᵏ.", trap: "Forgetting the C(n, k) arrangements.",
    make: (r) => { const n = int(r, 4, 10), p = pick(r, [0.2, 0.3, 0.5, 0.6, 0.8]), k = int(r, 1, n - 1);
      const v = comb(n, k) * p ** k * (1 - p) ** (n - k);
      return { prompt: `A basketball player scores each free throw with probability ${p}, independently. In ${n} throws, what is the probability of exactly ${k} successes?${D4}`, answer: r4(v), tol: 0.0002, explain: `C(${n}, ${k}) × ${p}^${k} × ${r4(1 - p)}^${n - k} = ${r4(v)}.`,
        py: `import itertools\nanswer = sum(${p} ** sum(o) * (1 - ${p}) ** (${n} - sum(o)) for o in itertools.product((0, 1), repeat=${n}) if sum(o) == ${k})` }; } },
  { key: "poisson", d: 2, secs: 60, fast: "Poisson: P(X = k) = e^(−λ) λᵏ / k!.", trap: "Using the rate for the wrong interval (rescale λ to the asked time window).",
    make: (r) => { const lam = pick(r, [1, 2, 3, 4]), k = int(r, 0, 5);
      const v = (Math.exp(-lam) * lam ** k) / fact(k);
      return { prompt: `A call centre gets on average ${lam} calls per minute (Poisson). What is the probability of exactly ${k} calls in a given minute?${D4}`, answer: r4(v), tol: 0.0002, explain: `e^(−${lam}) × ${lam}^${k} / ${k}! = ${r4(v)}.`,
        py: `import math\nn = 200000\np = ${lam} / n\nanswer = math.comb(n, ${k}) * p ** ${k} * (1 - p) ** (n - ${k})  # binomial with many small trials -> Poisson` }; } },
  { key: "geom", d: 1, secs: 45, fast: "Geometric: P(first success on trial k) = (1 − p)ᵏ⁻¹ p.", trap: "Using pᵏ (all successes) instead.",
    make: (r) => { const p = pick(r, [1 / 6, 0.2, 0.25, 0.3, 0.5]), k = int(r, 2, 6);
      const ps = p === 1 / 6 ? "1/6" : String(p);
      return { prompt: `Each attempt succeeds with probability ${ps}, independently. What is the probability that the first success comes on attempt ${k}?${D4}`, answer: r4((1 - p) ** (k - 1) * p), tol: 0.0002, explain: `(1 − ${ps})^${k - 1} × ${ps} = ${r4((1 - p) ** (k - 1) * p)}.`,
        py: `import itertools\np = ${p}\nanswer = sum(p ** sum(o) * (1 - p) ** (${k} - sum(o)) for o in itertools.product((0, 1), repeat=${k}) if o[-1] == 1 and sum(o) == 1)` }; } },
  { key: "hyper", d: 2, secs: 75, fast: "Hypergeometric: C(K, x) C(N − K, n − x) / C(N, n) (drawing without replacement).", trap: "Using the binomial, which assumes replacement.",
    make: (r) => { const N = int(r, 8, 14), K = int(r, 3, N - 3), n = int(r, 2, 5), x = int(r, 1, Math.min(K, n));
      const v = (comb(K, x) * comb(N - K, n - x)) / comb(N, n);
      if (n - x > N - K) return null;
      return { prompt: `A box has ${N} bulbs, ${K} of them faulty. ${n} bulbs are taken at random without replacement. What is the probability that exactly ${x} are faulty?${D4}`, answer: r4(v), tol: 0.0002, explain: `C(${K}, ${x}) × C(${N - K}, ${n - x}) / C(${N}, ${n}) = ${r4(v)}.`,
        py: `import itertools\nbox = [1] * ${K} + [0] * ${N - K}\nhands = list(itertools.combinations(range(${N}), ${n}))\nanswer = sum(1 for h in hands if sum(box[i] for i in h) == ${x}) / len(hands)` }; } },
];

function finish(items: GenQ[]): GenQ[] {
  return items.map((q) => (q.options ? { ...q, py: q.py.replace("OPTS", JSON.stringify(q.options)) } : q));
}

export const B6_TOPICS = {
  grid: "di-logic-grids", sched: "di-scheduling", tour: "di-tournaments", venn: "di-venn",
  basics: "pr-basics", cond: "pr-conditional", bayes: "pr-bayes", drv: "pr-discrete-rv", crv: "pr-continuous-rv", exp: "pr-expectation", var: "pr-variance", dist: "pr-distributions",
} as const;

export const B6_ITEMS: GenQ[] = finish([
  ...gridItems(),
  ...schedItems(),
  ...tourItems(),
  ...build(B6_TOPICS.venn, "venn", 6104, VENN),
  ...build(B6_TOPICS.basics, "pr-basics", 6201, BASICS),
  ...build(B6_TOPICS.cond, "pr-cond", 6202, COND),
  ...build(B6_TOPICS.bayes, "pr-bayes", 6203, BAYES),
  ...build(B6_TOPICS.drv, "pr-drv", 6204, DRV),
  ...build(B6_TOPICS.crv, "pr-crv", 6205, CRV),
  ...build(B6_TOPICS.exp, "pr-exp", 6206, EXP),
  ...build(B6_TOPICS.var, "pr-var", 6207, VAR),
  ...build(B6_TOPICS.dist, "pr-dist", 6208, DIST),
]);
