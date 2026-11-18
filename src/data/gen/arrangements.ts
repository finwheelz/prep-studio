/**
 * Seating-arrangement sets (linear and circular), generated from fixed seeds.
 *
 * Generation: pick a hidden arrangement, add true clues until exactly one arrangement satisfies them,
 * then drop every clue that is not needed. Questions are answered from the hidden arrangement.
 * Verification (verifyArrangementItem) solves each set again by brute force, requires exactly one
 * solution, and requires exactly one true option per question, equal to the stored answer.
 *
 * Conventions (stated in every prompt): in a row everyone faces north, so "right" is the reader's
 * right. Around a table everyone faces the centre, so a person's right is anticlockwise.
 * Seats are numbered so that seat s + 1 is immediately to the right of seat s.
 */

export type Kind = "row" | "circle";
type Seat = Record<string, number>; // name -> seat

export type Clue =
  | { t: "end"; x: string }
  | { t: "pos"; x: string; k: number; from: "left" | "right" }
  | { t: "adj"; x: string; y: string }
  | { t: "notAdj"; x: string; y: string }
  | { t: "immRight"; x: string; y: string } // x is immediately right of y
  | { t: "leftOf"; x: string; y: string } // row: x somewhere left of y
  | { t: "between"; x: string; y: string; k: number } // row: exactly k people between
  | { t: "opposite"; x: string; y: string } // circle of 6
  | { t: "secondRight"; x: string; y: string }; // circle: x is second to the right of y

export type Ask =
  | { t: "atPos"; k: number; from: "left" | "right" }
  | { t: "rightOf"; y: string }
  | { t: "leftOfImm"; y: string }
  | { t: "countBetween"; x: string; y: string }
  | { t: "ends" }
  | { t: "oppositeOf"; y: string }
  | { t: "secondRightOf"; y: string }
  | { t: "neighbours" };

export interface ArrSet {
  id: string;
  kind: Kind;
  names: string[];
  clues: Clue[];
  questions: { id: string; ask: Ask; options: string[]; answer: number }[];
}

// ───────────── seeded RNG ─────────────
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle<T>(a: T[], r: () => number): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

// ───────────── semantics ─────────────
const mod = (a: number, n: number) => ((a % n) + n) % n;

export function holds(c: Clue, s: Seat, kind: Kind, n: number): boolean {
  const near = (a: number, b: number) => (kind === "row" ? Math.abs(a - b) === 1 : mod(a - b, n) === 1 || mod(b - a, n) === 1);
  switch (c.t) {
    case "end":
      return s[c.x] === 0 || s[c.x] === n - 1;
    case "pos":
      return c.from === "left" ? s[c.x] === c.k - 1 : s[c.x] === n - c.k;
    case "adj":
      return near(s[c.x], s[c.y]);
    case "notAdj":
      return !near(s[c.x], s[c.y]);
    case "immRight":
      return kind === "row" ? s[c.x] === s[c.y] + 1 : mod(s[c.y] + 1, n) === s[c.x];
    case "leftOf":
      return s[c.x] < s[c.y];
    case "between":
      return Math.abs(s[c.x] - s[c.y]) - 1 === c.k;
    case "opposite":
      return mod(s[c.x] - s[c.y], n) === n / 2;
    case "secondRight":
      return mod(s[c.y] + 2, n) === s[c.x];
  }
}

function permutations<T>(a: T[]): T[][] {
  if (a.length <= 1) return [a];
  const out: T[][] = [];
  a.forEach((x, i) => {
    for (const p of permutations([...a.slice(0, i), ...a.slice(i + 1)])) out.push([x, ...p]);
  });
  return out;
}

/** Every arrangement that satisfies the clues. Circles are counted up to rotation (first name fixed at seat 0). */
export function solve(kind: Kind, names: string[], clues: Clue[]): Seat[] {
  const n = names.length;
  const free = kind === "circle" ? names.slice(1) : names;
  const out: Seat[] = [];
  for (const p of permutations(free)) {
    const order = kind === "circle" ? [names[0], ...p] : p;
    const s: Seat = {};
    order.forEach((x, i) => (s[x] = i));
    if (clues.every((c) => holds(c, s, kind, n))) out.push(s);
  }
  return out;
}

/** The option strings that are true for an arrangement. */
function truths(ask: Ask, s: Seat, kind: Kind, n: number): (opt: string) => boolean {
  const at = (i: number) => Object.keys(s).find((k) => s[k] === mod(i, n));
  switch (ask.t) {
    case "atPos":
      return (o) => o === at(ask.from === "left" ? ask.k - 1 : n - ask.k);
    case "rightOf":
      return (o) => (kind === "row" && s[ask.y] === n - 1 ? o === "No one" : o === at(s[ask.y] + 1));
    case "leftOfImm":
      return (o) => (kind === "row" && s[ask.y] === 0 ? o === "No one" : o === at(s[ask.y] - 1));
    case "countBetween":
      return (o) => o === String(Math.abs(s[ask.x] - s[ask.y]) - 1);
    case "ends":
      return (o) => {
        const [a, b] = o.split(" and ");
        return new Set([s[a], s[b]]).size === 2 && [s[a], s[b]].every((v) => v === 0 || v === n - 1);
      };
    case "oppositeOf":
      return (o) => o === at(s[ask.y] + n / 2);
    case "secondRightOf":
      return (o) => o === at(s[ask.y] + 2);
    case "neighbours":
      return (o) => {
        const [a, b] = o.split(" and ");
        return mod(s[a] - s[b], n) === 1 || mod(s[b] - s[a], n) === 1;
      };
  }
}

// ───────────── text ─────────────
const ORD = ["", "first", "second", "third", "fourth", "fifth", "sixth", "seventh"];
export function clueText(c: Clue): string {
  switch (c.t) {
    case "end": return `${c.x} sits at one of the ends.`;
    case "pos": return `${c.x} sits ${ORD[c.k]} from the ${c.from} end.`;
    case "adj": return `${c.x} sits next to ${c.y}.`;
    case "notAdj": return `${c.x} does not sit next to ${c.y}.`;
    case "immRight": return `${c.x} sits immediately to the right of ${c.y}.`;
    case "leftOf": return `${c.x} sits somewhere to the left of ${c.y}.`;
    case "between": return `Exactly ${c.k} ${c.k === 1 ? "person sits" : "people sit"} between ${c.x} and ${c.y}.`;
    case "opposite": return `${c.x} sits opposite ${c.y}.`;
    case "secondRight": return `${c.x} sits second to the right of ${c.y}.`;
  }
}
function askText(a: Ask): string {
  switch (a.t) {
    case "atPos": return `Who sits ${ORD[a.k]} from the ${a.from} end?`;
    case "rightOf": return `Who sits immediately to the right of ${a.y}?`;
    case "leftOfImm": return `Who sits immediately to the left of ${a.y}?`;
    case "countBetween": return `How many people sit between ${a.x} and ${a.y}?`;
    case "ends": return "Which pair sits at the two ends of the row?";
    case "oppositeOf": return `Who sits opposite ${a.y}?`;
    case "secondRightOf": return `Who sits second to the right of ${a.y}?`;
    case "neighbours": return "Which of these pairs sit next to each other?";
  }
}

export function setStem(set: Pick<ArrSet, "kind" | "names" | "clues" | "id">): string {
  const who = set.names.join(", ");
  const frame =
    set.kind === "row"
      ? `${set.names.length} people (${who}) sit in a row, all facing north, so their right is your right.`
      : `${set.names.length} people (${who}) sit around a circular table, all facing the centre, so a person's right is anticlockwise.`;
  return `**Set ${set.id}.** ${frame}\n\n${set.clues.map((c, i) => `${i + 1}. ${clueText(c)}`).join("\n")}`;
}
export const questionPrompt = (set: ArrSet, q: ArrSet["questions"][number]) => `${setStem(set)}\n\n**Q.** ${askText(q.ask)}`;

// ───────────── generation ─────────────
function cluePool(kind: Kind, names: string[], s: Seat): Clue[] {
  const n = names.length;
  const pool: Clue[] = [];
  for (const x of names) {
    if (kind === "row") {
      if (s[x] === 0 || s[x] === n - 1) pool.push({ t: "end", x });
      const k = s[x] + 1;
      if (k <= 3) pool.push({ t: "pos", x, k, from: "left" });
      if (n - s[x] <= 3) pool.push({ t: "pos", x, k: n - s[x], from: "right" });
    }
    for (const y of names) {
      if (x === y) continue;
      const cand: Clue[] =
        kind === "row"
          ? [{ t: "immRight", x, y }, { t: "leftOf", x, y }, { t: "between", x, y, k: Math.abs(s[x] - s[y]) - 1 }, { t: "adj", x, y }, { t: "notAdj", x, y }]
          : [{ t: "immRight", x, y }, { t: "secondRight", x, y }, { t: "opposite", x, y }, { t: "adj", x, y }, { t: "notAdj", x, y }];
      for (const c of cand) {
        if (c.t === "between" && (c.k < 1 || c.k > 3)) continue;
        if ((c.t === "adj" || c.t === "notAdj" || c.t === "opposite" || c.t === "between") && x > y) continue; // symmetric
        if (holds(c, s, kind, n)) pool.push(c);
      }
    }
  }
  return pool;
}

const WEIGHT: Partial<Record<Clue["t"], number>> = { end: 0.35, pos: 0.25, notAdj: 0.6, leftOf: 0.7 };

function makeQuestions(id: string, kind: Kind, names: string[], s: Seat, r: () => number): ArrSet["questions"] {
  const n = names.length;
  const at = (i: number) => Object.keys(s).find((k) => s[k] === mod(i, n))!;
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const others = (correct: string, pool: string[]) => shuffle(pool.filter((p) => p !== correct), r).slice(0, 3);
  const asks: Ask[] =
    kind === "row"
      ? [
          { t: "atPos", k: pick([2, 3]), from: pick(["left", "right"] as const) },
          { t: "rightOf", y: at(Math.floor(r() * (n - 1))) },
          (() => { const [x, y] = shuffle(names, r); return { t: "countBetween", x, y } as Ask; })(),
          { t: "ends" },
        ]
      : [
          { t: "oppositeOf", y: pick(names) },
          { t: "secondRightOf", y: pick(names) },
          { t: "leftOfImm", y: pick(names) },
          { t: "neighbours" },
        ];
  return asks.map((ask, qi) => {
    let opts: string[];
    let correct: string;
    const truth = truths(ask, s, kind, n);
    if (ask.t === "countBetween") {
      correct = String(Math.abs(s[ask.x] - s[ask.y]) - 1);
      opts = [correct, ...shuffle(["0", "1", "2", "3", "4"].filter((v) => v !== correct), r).slice(0, 3)];
    } else if (ask.t === "ends") {
      const [a, b] = [at(0), at(n - 1)].sort();
      correct = `${a} and ${b}`;
      const wrong = new Set<string>();
      while (wrong.size < 3) {
        const [p, q] = shuffle(names, r).slice(0, 2).sort();
        const o = `${p} and ${q}`;
        if (!truth(o)) wrong.add(o);
      }
      opts = [correct, ...wrong];
    } else if (ask.t === "neighbours") {
      const i = Math.floor(r() * n);
      const [a, b] = [at(i), at(i + 1)].sort();
      correct = `${a} and ${b}`;
      const wrong = new Set<string>();
      while (wrong.size < 3) {
        const [p, q] = shuffle(names, r).slice(0, 2).sort();
        const o = `${p} and ${q}`;
        if (!truth(o)) wrong.add(o);
      }
      opts = [correct, ...wrong];
    } else {
      correct = names.find((x) => truth(x)) ?? "No one";
      const y = "y" in ask ? ask.y : "";
      opts = [correct, ...others(correct, names.filter((x) => x !== y))];
    }
    const options = shuffle(opts, r);
    return { id: `${id}-q${qi + 1}`, ask, options, answer: options.indexOf(correct) };
  });
}

function generate(id: string, kind: Kind, names: string[], seed: number): ArrSet {
  const r = mulberry32(seed);
  const order = kind === "circle" ? [names[0], ...shuffle(names.slice(1), r)] : shuffle(names, r);
  const s: Seat = {};
  order.forEach((x, i) => (s[x] = i));
  // Weighted shuffle: absolute clues are rarer so the sets need reasoning, not lookup.
  const pool = cluePool(kind, names, s)
    .map((c) => ({ c, k: r() * (WEIGHT[c.t] ?? 1) }))
    .sort((a, b) => b.k - a.k)
    .map((x) => x.c);
  const clues: Clue[] = [];
  for (const c of pool) {
    clues.push(c);
    if (solve(kind, names, clues).length === 1) break;
  }
  // Drop clues that are not needed, last added first kept.
  for (let i = clues.length - 2; i >= 0; i--) {
    const without = clues.filter((_, j) => j !== i);
    if (solve(kind, names, without).length === 1) clues.splice(i, 1);
  }
  const shown = shuffle(clues, r);
  return { id, kind, names, clues: shown, questions: makeQuestions(id, kind, names, s, r) };
}

/** Fixed seeds: changing a seed changes the set, so treat these like ids. */
export const ARR_SETS: ArrSet[] = [
  generate("L1", "row", ["P", "Q", "R", "S", "T", "U"], 101),
  generate("L2", "row", ["A", "B", "C", "D", "E", "F"], 202),
  generate("L3", "row", ["G", "H", "J", "K", "M", "N"], 303),
  generate("C1", "circle", ["P", "Q", "R", "S", "T", "U"], 404),
  generate("C2", "circle", ["A", "B", "C", "D", "E", "F"], 505),
  generate("C3", "circle", ["G", "H", "J", "K", "M", "N"], 606),
];

/** Independent re-check used by scripts/verify-items.mts. */
export function verifyArrangementSet(set: ArrSet): { ok: boolean; why?: string } {
  const sols = solve(set.kind, set.names, set.clues);
  if (sols.length !== 1) return { ok: false, why: `${sols.length} arrangements satisfy the clues` };
  for (const q of set.questions) {
    const t = truths(q.ask, sols[0], set.kind, set.names.length);
    const trueIdx = q.options.map((o, i) => (t(o) ? i : -1)).filter((i) => i >= 0);
    if (trueIdx.length !== 1 || trueIdx[0] !== q.answer) return { ok: false, why: `${q.id}: true options ${JSON.stringify(trueIdx)}, stored ${q.answer}` };
  }
  return { ok: true };
}
