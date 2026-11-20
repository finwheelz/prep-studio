/**
 * Batch 5 generator: logical reasoning (blood relations, directions, syllogisms, ordering and
 * ranking, data sufficiency) and data interpretation (tables, bar/line, pie, mixed charts, caselets).
 * Every answer is recomputed in Python by an independent route: kinship by rewriting the relation
 * chain, walks by vector simulation, syllogisms and data sufficiency by brute force over all models,
 * rankings by permutation search, DI by recomputing from the raw data.
 */
import { build, int, pick, type GenQ, type Rng, type Tpl } from "./quant";

const r2 = (x: number) => Math.round(x * 100) / 100;
function shuffle<T>(a: T[], r: Rng): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
function mcq(r: Rng, correct: string, pool: string[], n = 4) {
  const wrong = shuffle([...new Set(pool.filter((w) => w !== correct))], r).slice(0, n - 1);
  const options = shuffle([correct, ...wrong], r);
  return { options, answer: options.indexOf(correct) };
}
const D2 = " Give 2 decimals if needed.";

// ───────────────────────── Blood relations ─────────────────────────
const MALE = ["Arjun", "Ravi", "Kabir", "Vikram", "Rohan", "Sameer", "Neel", "Dev", "Manav", "Tarun", "Ishaan", "Om"];
const FEMALE = ["Asha", "Meera", "Priya", "Nisha", "Tara", "Kavya", "Riya", "Sana", "Isha", "Diya", "Pooja", "Lata"];
const STEP: Record<string, [string, string]> = { P: ["father", "mother"], C: ["son", "daughter"], S: ["brother", "sister"], M: ["husband", "wife"] };
const TERM: Record<string, [string, string]> = {
  parent: ["father", "mother"], child: ["son", "daughter"], gp: ["grandfather", "grandmother"], gc: ["grandson", "granddaughter"],
  nn: ["nephew", "niece"], ua: ["uncle", "aunt"], cousin: ["cousin", "cousin"], pil: ["father-in-law", "mother-in-law"],
  cil: ["son-in-law", "daughter-in-law"], sil: ["brother-in-law", "sister-in-law"],
};
/** Relation chain (how each person relates to the next) → relation of the first to the last. */
const CHAIN: Record<string, keyof typeof TERM> = {
  PP: "gp", CC: "gc", CS: "nn", SP: "ua", PM: "pil", MC: "cil", SM: "sil", MS: "sil",
  CSP: "cousin", PPS: "gp", CSC: "gc", PSP: "gp",
  SC: "child", PS: "parent", CM: "child", MP: "parent",
};
const PY_KIN = `def kin(chain, g):
    rules = [("SC", "C"), ("PS", "P"), ("CM", "C"), ("MP", "P")]
    changed = True
    while changed:
        changed = False
        for a, b in rules:
            if a in chain:
                chain = chain.replace(a, b, 1)
                changed = True
    names = {"P": ("father", "mother"), "C": ("son", "daughter"), "PP": ("grandfather", "grandmother"), "CC": ("grandson", "granddaughter"),
             "CS": ("nephew", "niece"), "SP": ("uncle", "aunt"), "CSP": ("cousin", "cousin"), "PM": ("father-in-law", "mother-in-law"),
             "MC": ("son-in-law", "daughter-in-law"), "SM": ("brother-in-law", "sister-in-law"), "MS": ("brother-in-law", "sister-in-law")}
    return names[chain][0 if g == "m" else 1]
`;
const ALL_TERMS = [...new Set(Object.values(TERM).flat())];
function people(r: Rng, chain: string) {
  const males = shuffle(MALE, r), females = shuffle(FEMALE, r);
  const g: ("m" | "f")[] = [];
  g.push(r() < 0.5 ? "m" : "f");
  for (let i = 0; i < chain.length; i++) g.push(chain[i] === "M" ? (g[i] === "m" ? "f" : "m") : r() < 0.5 ? "m" : "f");
  let mi = 0, fi = 0;
  const names = g.map((x) => (x === "m" ? males[mi++] : females[fi++]));
  return { g, names };
}
function bloodItem(r: Rng, chains: string[], coded = false) {
  const chain = pick(r, chains);
  const { g, names } = people(r, chain);
  const term = TERM[CHAIN[chain]][g[0] === "m" ? 0 : 1];
  const opp = TERM[CHAIN[chain]][g[0] === "m" ? 1 : 0];
  // Always include the opposite-gender term (the most common slip), plus two other relations.
  const others = shuffle(ALL_TERMS.filter((t) => t !== term && t !== opp), r);
  const wrong = opp !== term ? [opp, ...others.slice(0, 2)] : others.slice(0, 3);
  const options = shuffle([term, ...wrong], r);
  const answer = options.indexOf(term);
  const X = names[0], Y = names[names.length - 1];
  let prompt: string;
  if (!coded) {
    const facts = [...chain].map((s, i) => `${names[i]} is the ${STEP[s][g[i] === "m" ? 0 : 1]} of ${names[i + 1]}.`);
    prompt = `${facts.join(" ")} How is ${X} related to ${Y}?`;
  } else {
    const SYM: Record<string, [string, string]> = { P: ["+", "−"], S: ["×", "÷"], M: ["@", "#"], C: ["$", "%"] };
    const expr = names.map((n, i) => (i < chain.length ? `${n} ${SYM[chain[i]][g[i] === "m" ? 0 : 1]} ` : n)).join("");
    prompt = `In a code, A + B means A is the father of B; A − B: A is the mother of B; A × B: A is the brother of B; A ÷ B: A is the sister of B; A @ B: A is the husband of B; A # B: A is the wife of B; A $ B: A is the son of B; A % B: A is the daughter of B.\n\nIf ${expr}, how is ${X} related to ${Y}?`;
  }
  return {
    prompt, options, answer,
    explain: `Chain: ${[...chain].map((s, i) => `${names[i]} is ${STEP[s][g[i] === "m" ? 0 : 1]} of ${names[i + 1]}`).join(" → ")}. So ${X} is ${Y}'s ${term}.`,
    py: `${PY_KIN}\nopts = OPTS\nanswer = opts.index(kin("${chain}", "${g[0]}"))`,
  };
}
const BLOOD: Tpl[] = [
  { key: "two", d: 1, secs: 45, fast: "Draw it: generations up and down, = for couples, a horizontal line for siblings.", trap: "Reading the relation backwards (Y to X instead of X to Y).",
    make: (r) => bloodItem(r, ["PP", "CC", "CS", "SP", "PM", "MC", "SM", "MS"]) },
  { key: "three", d: 2, secs: 75, fast: "Collapse the chain two links at a time, keeping track of generations.", trap: "Losing track of which generation each person is in.",
    make: (r) => bloodItem(r, ["CSP", "PPS", "CSC", "PSP"]) },
  { key: "trick", d: 2, secs: 45, fast: "A sibling's child is your own child too; a parent's spouse is a parent (assume full siblings and the usual family).", trap: "Answering nephew or uncle when the chain collapses to parent or child.",
    make: (r) => bloodItem(r, ["SC", "PS", "CM", "MP"]) },
  { key: "coded", d: 2, secs: 75, fast: "Decode each symbol into a sentence first, then solve as a normal chain.", trap: "Mixing up which side of the symbol is the subject.",
    make: (r) => bloodItem(r, ["CS", "SP", "PM", "MC", "CSP", "PSP"], true) },
];

// ───────────────────────── Directions ─────────────────────────
const DIR8 = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];
const VEC: Record<string, [number, number]> = { north: [0, 1], east: [1, 0], south: [0, -1], west: [-1, 0] };
const dir8 = (dx: number, dy: number) => {
  const ns = dy > 0 ? "north" : dy < 0 ? "south" : "";
  const ew = dx > 0 ? "east" : dx < 0 ? "west" : "";
  return ns && ew ? `${ns}-${ew}` : ns || ew;
};
const PY_DIRS = `DIRS = ["north", "east", "south", "west"]
VEC = {"north": (0, 1), "east": (1, 0), "south": (0, -1), "west": (-1, 0)}
def name8(dx, dy):
    ns = "north" if dy > 0 else "south" if dy < 0 else ""
    ew = "east" if dx > 0 else "west" if dx < 0 else ""
    return f"{ns}-{ew}" if ns and ew else ns or ew
`;
const DIRS: Tpl[] = [
  {
    key: "dist", d: 1, secs: 60,
    fast: "Add up the north–south and east–west movements separately, then use Pythagoras.",
    trap: "Adding all the distances walked.",
    make: (r) => {
      const legs = Array.from({ length: int(r, 3, 4) }, () => [pick(r, ["north", "east", "south", "west"]), int(r, 1, 12)] as [string, number]);
      for (let i = 1; i < legs.length; i++) if (legs[i][0] === legs[i - 1][0]) return null;
      const dx = legs.reduce((s, [d, n]) => s + VEC[d][0] * n, 0), dy = legs.reduce((s, [d, n]) => s + VEC[d][1] * n, 0);
      const dist = Math.hypot(dx, dy);
      if (!Number.isInteger(dist) || dist === 0) return null;
      const name = pick(r, MALE);
      return {
        prompt: `${name} walks ${legs.map(([d, n], i) => `${i ? "then " : ""}${n} km ${d}`).join(", ")}. How far is he from his starting point, in km?`,
        answer: dist, tol: 0,
        explain: `Net east ${dx} km, net north ${dy} km: √(${dx}² + ${dy}²) = ${dist} km.`,
        py: `${PY_DIRS}\nx = y = 0\nfor d, n in ${JSON.stringify(legs).replace(/"/g, "'")}:\n    x += VEC[d][0] * n; y += VEC[d][1] * n\nanswer = round((x * x + y * y) ** 0.5, 9)`,
      };
    },
  },
  {
    key: "where", d: 2, secs: 75,
    fast: "Track the facing direction after each turn (right = clockwise), then the net displacement.",
    trap: "Treating 'turns right' as 'goes east' regardless of the current facing.",
    make: (r) => {
      const start = pick(r, ["north", "east", "south", "west"]);
      const turns = Array.from({ length: int(r, 2, 3) }, () => pick(r, ["right", "left"]));
      const lens = Array.from({ length: turns.length + 1 }, () => int(r, 2, 10));
      const order = ["north", "east", "south", "west"];
      let f = order.indexOf(start), x = 0, y = 0;
      lens.forEach((n, i) => {
        x += VEC[order[f]][0] * n; y += VEC[order[f]][1] * n;
        if (i < turns.length) f = (f + (turns[i] === "right" ? 1 : 3)) % 4;
      });
      if (x === 0 && y === 0) return null;
      const ans = dir8(x, y);
      const name = pick(r, FEMALE);
      const text = lens.map((n, i) => `walks ${n} m${i < turns.length ? `, turns ${turns[i]}` : ""}`).join(", ");
      return {
        prompt: `${name} starts facing ${start}, ${text}. In which direction is she now from her starting point?`,
        ...mcq(r, ans, DIR8),
        explain: `Net displacement: ${x} m east, ${y} m north → ${ans}.`,
        py: `${PY_DIRS}\nf, x, y = DIRS.index("${start}"), 0, 0\nlens, turns = ${JSON.stringify(lens)}, ${JSON.stringify(turns)}\nfor i, n in enumerate(lens):\n    x += VEC[DIRS[f]][0] * n; y += VEC[DIRS[f]][1] * n\n    if i < len(turns): f = (f + (1 if turns[i] == "right" else -1)) % 4\nopts = OPTS\nanswer = opts.index(name8(x, y))`,
      };
    },
  },
  {
    key: "face", d: 1, secs: 45,
    fast: "Convert every turn to degrees clockwise and add them modulo 360.",
    trap: "Treating anticlockwise turns as clockwise.",
    make: (r) => {
      const start = pick(r, DIR8);
      const moves = Array.from({ length: int(r, 2, 4) }, () => pick(r, [["turns 90° clockwise", 90], ["turns 90° anticlockwise", -90], ["turns 45° clockwise", 45], ["turns 135° anticlockwise", -135], ["turns right", 90], ["turns left", -90], ["turns around (180°)", 180]] as [string, number][]));
      const total = moves.reduce((s, [, d]) => s + d, 0);
      const end = DIR8[(((DIR8.indexOf(start) + total / 45) % 8) + 8) % 8];
      return {
        prompt: `A man is facing ${start}. He ${moves.map(([t]) => t).join(", then ")}. Which direction is he facing now?`,
        ...mcq(r, end, DIR8),
        explain: `Net turn ${total}° (clockwise positive) from ${start}: ${end}.`,
        py: `D8 = ${JSON.stringify(DIR8)}\nturns = ${JSON.stringify(moves.map(([, d]) => d))}\nang = (D8.index("${start}") * 45 + sum(turns)) % 360\nopts = OPTS\nanswer = opts.index(D8[ang // 45])`,
      };
    },
  },
  {
    key: "shadow", d: 2, secs: 60,
    fast: "Morning: the sun is in the east, so shadows point west. Evening: shadows point east.",
    trap: "Putting the sun in the west in the morning.",
    make: (r) => {
      const time = pick(r, ["morning", "evening"]), face = pick(r, ["north", "east", "south", "west"]);
      const order = ["north", "east", "south", "west"];
      const shadow = time === "morning" ? "west" : "east";
      const rel = (order.indexOf(shadow) - order.indexOf(face) + 4) % 4;
      const side = ["in front of", "to the right of", "behind", "to the left of"][rel];
      const name = pick(r, FEMALE);
      return {
        prompt: `One ${time}, ${name}'s shadow falls ${side} her. Which direction is she facing?`,
        ...mcq(r, face, order),
        explain: `In the ${time} the shadow points ${shadow}. If ${shadow} is ${side.replace(" of", "")} her, she faces ${face}.`,
        py: `${PY_DIRS}\nshadow = "${shadow}"\nfits = [f for f in DIRS if ["in front of", "to the right of", "behind", "to the left of"][(DIRS.index(shadow) - DIRS.index(f)) % 4] == "${side}"]\nassert len(fits) == 1\nopts = OPTS\nanswer = opts.index(fits[0])`,
      };
    },
  },
];

// ───────────────────────── Syllogisms (brute force over Venn models) ─────────────────────────
type Q = "all" | "no" | "some" | "somenot";
const NOUNS = ["pens", "books", "chairs", "tables", "cats", "dogs", "birds", "trees", "phones", "cups", "kites", "rings", "boxes", "lamps", "coins"];
const say = (q: Q, a: string, b: string) => ({ all: `All ${a} are ${b}.`, no: `No ${a} are ${b}.`, some: `Some ${a} are ${b}.`, somenot: `Some ${a} are not ${b}.` })[q];
// Regions 1..7 encode membership in sets 0,1,2 as bits. A model is a set of non-empty regions.
const MODELS: number[][] = [];
for (let m = 1; m < 128; m++) {
  const regs = [1, 2, 3, 4, 5, 6, 7].filter((rg) => m & (1 << (rg - 1)));
  if ([0, 1, 2].every((s) => regs.some((rg) => rg & (1 << s)))) MODELS.push(regs);
}
const holds = (regs: number[], q: Q, a: number, b: number) => {
  const inA = regs.filter((rg) => rg & (1 << a));
  if (q === "all") return inA.every((rg) => rg & (1 << b));
  if (q === "no") return inA.every((rg) => !(rg & (1 << b)));
  if (q === "some") return inA.some((rg) => rg & (1 << b));
  return inA.some((rg) => !(rg & (1 << b)));
};
type St = [Q, number, number];
const SYL_OPTS = ["Only conclusion I follows", "Only conclusion II follows", "Either I or II follows", "Neither I nor II follows", "Both I and II follow"];
function sylAnswer(prem: St[], c1: St, c2: St): number | null {
  const ok = MODELS.filter((m) => prem.every(([q, a, b]) => holds(m, q, a, b)));
  if (!ok.length) return null;
  const f1 = ok.every((m) => holds(m, ...c1)), f2 = ok.every((m) => holds(m, ...c2));
  if (f1 && f2) return 4;
  if (f1) return 0;
  if (f2) return 1;
  const comp = c1[1] === c2[1] && c1[2] === c2[2] && new Set([c1[0], c2[0]]).size === 2 && ((["some", "no"].includes(c1[0]) && ["some", "no"].includes(c2[0])) || (["all", "somenot"].includes(c1[0]) && ["all", "somenot"].includes(c2[0])));
  if (comp && ok.every((m) => holds(m, ...c1) || holds(m, ...c2))) return 2;
  return 3;
}
const PY_SYL = `import itertools
MODELS = []
for m in range(1, 128):
    regs = [rg for rg in range(1, 8) if m & (1 << (rg - 1))]
    if all(any(rg & (1 << s) for rg in regs) for s in range(3)):
        MODELS.append(regs)
def holds(regs, q, a, b):
    inA = [rg for rg in regs if rg & (1 << a)]
    if q == "all": return all(rg & (1 << b) for rg in inA)
    if q == "no": return all(not rg & (1 << b) for rg in inA)
    if q == "some": return any(rg & (1 << b) for rg in inA)
    return any(not rg & (1 << b) for rg in inA)
def verdict(prem, c1, c2):
    ok = [m for m in MODELS if all(holds(m, *p) for p in prem)]
    f1 = all(holds(m, *c1) for m in ok); f2 = all(holds(m, *c2) for m in ok)
    if f1 and f2: return "Both I and II follow"
    if f1: return "Only conclusion I follows"
    if f2: return "Only conclusion II follows"
    pair = {c1[0], c2[0]}
    comp = c1[1:] == c2[1:] and pair in ({"some", "no"}, {"all", "somenot"})
    if comp and all(holds(m, *c1) or holds(m, *c2) for m in ok): return "Either I or II follows"
    return "Neither I nor II follows"
`;
function sylItem(r: Rng, want: number[], forceComp = false) {
  const nouns = shuffle(NOUNS, r).slice(0, 3);
  const qs: Q[] = ["all", "no", "some", "somenot"];
  const prem: St[] = [[pick(r, qs), 0, 1], [pick(r, qs), 1, 2]];
  const c1: St = [pick(r, qs), pick(r, [0, 2]), 0];
  c1[2] = c1[1] === 0 ? 2 : 0;
  let c2: St;
  if (forceComp) {
    c2 = [({ some: "no", no: "some", all: "somenot", somenot: "all" } as Record<Q, Q>)[c1[0]], c1[1], c1[2]];
  } else {
    const pairs: [number, number][] = [[0, 1], [1, 0], [1, 2], [2, 1], [0, 2], [2, 0]];
    const [a, b] = pick(r, pairs);
    c2 = [pick(r, qs), a, b];
    if (c2[0] === c1[0] && c2[1] === c1[1] && c2[2] === c1[2]) return null;
  }
  const ans = sylAnswer(prem, c1, c2);
  if (ans === null || !want.includes(ans)) return null;
  const N = (i: number) => nouns[i];
  return {
    prompt: `Statements:\n\n- ${say(prem[0][0], N(0), N(1))}\n- ${say(prem[1][0], N(1), N(2))}\n\nConclusions:\n\n1. ${say(c1[0], N(c1[1]), N(c1[2]))}\n2. ${say(c2[0], N(c2[1]), N(c2[2]))}`,
    options: SYL_OPTS, answer: ans,
    explain: `Draw the Venn diagram for the statements and test each conclusion in every possible diagram: ${SYL_OPTS[ans].toLowerCase()}.`,
    py: `${PY_SYL}\nprem = ${JSON.stringify(prem)}\nanswer = ${JSON.stringify(SYL_OPTS)}.index(verdict(prem, ${JSON.stringify(c1)}, ${JSON.stringify(c2)}))`,
  };
}
const SYL: Tpl[] = [
  { key: "one", d: 2, secs: 75, fast: "Draw the minimum overlap the statements force; a conclusion follows only if it is true in every possible diagram.", trap: "Accepting a conclusion that is merely possible.", make: (r) => sylItem(r, [0, 1]) },
  { key: "both", d: 2, secs: 75, fast: "'All A are B' also gives 'Some B are A' (sets are non-empty).", trap: "Forgetting conversions such as All → Some.", make: (r) => sylItem(r, [4]) },
  { key: "neither", d: 2, secs: 75, fast: "Two 'some' statements never give a definite conclusion between the end terms.", trap: "Chaining 'some … some' into a conclusion.", make: (r) => sylItem(r, [3]) },
  { key: "either", d: 3, secs: 90, fast: "Either–or applies when neither follows, the two conclusions share subject and predicate, and one of them must be true (some/no or all/some-not).", trap: "Choosing 'neither' for a complementary pair.", make: (r) => sylItem(r, [2], true) },
];

// ───────────────────────── Ordering and ranking ─────────────────────────
const ORDER: Tpl[] = [
  {
    key: "total", d: 1, secs: 30, fast: "Total = rank from left + rank from right − 1.", trap: "Forgetting the − 1 (the person is counted twice).",
    make: (r) => {
      const l = int(r, 5, 30), rr = int(r, 5, 30), name = pick(r, MALE);
      return { prompt: `In a row of students, ${name} is ${l}th from the left and ${rr}th from the right. How many students are in the row?`, answer: l + rr - 1, tol: 0,
        explain: `${l} + ${rr} − 1 = ${l + rr - 1}.`, py: `answer = next(n for n in range(1, 200) if n - ${l} + 1 == ${rr})` };
    },
  },
  {
    key: "between", d: 2, secs: 60, fast: "Convert both to positions from the left; people between = |difference| − 1.", trap: "Not converting the 'from the right' rank.",
    make: (r) => {
      const n = int(r, 20, 50), pa = int(r, 1, n), qb = int(r, 1, n);
      const pb = n - qb + 1;
      if (Math.abs(pa - pb) < 2) return null;
      const [a, b] = shuffle(FEMALE, r);
      return { prompt: `In a row of ${n} girls, ${a} is ${pa}th from the left and ${b} is ${qb}th from the right. How many girls stand between them?`, answer: Math.abs(pa - pb) - 1, tol: 0,
        explain: `${b} is ${pb}th from the left. Between ${pa} and ${pb}: ${Math.abs(pa - pb) - 1}.`,
        py: `row = list(range(1, ${n} + 1))\na = row[${pa} - 1]\nb = row[-${qb}]\nanswer = abs(row.index(a) - row.index(b)) - 1` };
    },
  },
  {
    key: "swap", d: 2, secs: 60, fast: "After swapping, A takes B's place: A's new rank from the left + B's old rank from the right − 1 = total.", trap: "Using A's old rank.",
    make: (r) => {
      const p = int(r, 3, 15), q = int(r, 3, 15), p2 = int(r, p + 2, p + 15);
      const [a, b] = shuffle(MALE, r);
      return { prompt: `In a row, ${a} is ${p}th from the left and ${b} is ${q}th from the right. They swap places, and ${a} is now ${p2}th from the left. How many people are in the row?`, answer: p2 + q - 1, tol: 0,
        explain: `${a} now stands where ${b} was: ${p2}th from the left and ${q}th from the right, so ${p2} + ${q} − 1 = ${p2 + q - 1}.`,
        py: `answer = next(n for n in range(1, 200) if n - ${q} + 1 == ${p2})` };
    },
  },
  {
    key: "compare", d: 2, secs: 90, fast: "Turn each clue into an inequality and build the chain; only answer what the clues force.", trap: "Assuming an order between people the clues never compare.",
    make: (r) => {
      const names = shuffle(FEMALE, r).slice(0, 5);
      const order = shuffle(names, r); // tallest first
      const k = int(r, 1, 5);
      const ranks = new Map(order.map((n, i) => [n, i]));
      const perms = (a: string[]): string[][] => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
      const all = perms(names);
      const clues: [string, string][] = [];
      const pool = shuffle(names.flatMap((x) => names.filter((y) => ranks.get(x)! < ranks.get(y)!).map((y) => [x, y] as [string, string])), r);
      const answerOf = (p: string[]) => p[k - 1];
      for (const c of pool) {
        clues.push(c);
        const ok = all.filter((p) => clues.every(([x, y]) => p.indexOf(x) < p.indexOf(y)));
        if (new Set(ok.map(answerOf)).size === 1) break;
      }
      const ok = all.filter((p) => clues.every(([x, y]) => p.indexOf(x) < p.indexOf(y)));
      if (new Set(ok.map(answerOf)).size !== 1 || clues.length > 6) return null;
      const ans = order[k - 1];
      const ord = ["tallest", "second tallest", "third tallest", "fourth tallest", "shortest"][k - 1];
      const text = clues.map(([x, y]) => (r() < 0.5 ? `${x} is taller than ${y}.` : `${y} is shorter than ${x}.`)).join(" ");
      return { prompt: `${text} Who is the ${ord}?`, ...mcq(r, ans, names),
        explain: `The clues force ${ans} into position ${k} from the top in every order consistent with them.`,
        py: `import itertools\nnames = ${JSON.stringify(names)}\nclues = ${JSON.stringify(clues)}\nfits = {p[${k - 1}] for p in itertools.permutations(names) if all(p.index(x) < p.index(y) for x, y in clues)}\nassert len(fits) == 1, fits\nopts = OPTS\nanswer = opts.index(fits.pop())` };
    },
  },
];

// ───────────────────────── Data sufficiency (brute force over the domain) ─────────────────────────
const DS_OPTS = [
  "Statement I alone is sufficient, but II alone is not",
  "Statement II alone is sufficient, but I alone is not",
  "Both statements together are sufficient, but neither alone is",
  "Each statement alone is sufficient",
  "Both statements together are not sufficient",
];
type DsStmt = { text: string; py: string; f: (x: number, y: number) => boolean };
function dsPool(r: Rng, x0: number, y0: number): DsStmt[] {
  const isPrime = (n: number) => n > 1 && [...Array(n).keys()].slice(2).every((d) => n % d !== 0);
  const out: DsStmt[] = [
    { text: `x + y = ${x0 + y0}`, py: `x + y == ${x0 + y0}`, f: (x, y) => x + y === x0 + y0 },
    { text: `x − y = ${x0 - y0}`, py: `x - y == ${x0 - y0}`, f: (x, y) => x - y === x0 - y0 },
    { text: `xy = ${x0 * y0}`, py: `x * y == ${x0 * y0}`, f: (x, y) => x * y === x0 * y0 },
    { text: `y = ${y0}`, py: `y == ${y0}`, f: (_x, y) => y === y0 },
    { text: `2x + y = ${2 * x0 + y0}`, py: `2 * x + y == ${2 * x0 + y0}`, f: (x, y) => 2 * x + y === 2 * x0 + y0 },
    { text: `x is ${x0 % 2 ? "odd" : "even"}`, py: `x % 2 == ${x0 % 2}`, f: (x) => x % 2 === x0 % 2 },
    { text: `x > ${Math.max(1, x0 - int(r, 1, 3))}`, py: "", f: () => true },
  ];
  out[6].py = `x > ${out[6].text.split("> ")[1]}`;
  out[6].f = (x) => x > +out[6].text.split("> ")[1];
  if (isPrime(x0)) out.push({ text: "x is a prime number", py: "is_prime(x)", f: (x) => isPrime(x) });
  return out;
}
type DsQ = { text: string; py: string; f: (x: number, y: number) => number | boolean };
const DS_Q: DsQ[] = [
  { text: "What is the value of x?", py: "x", f: (x) => x },
  { text: "Is x greater than y?", py: "x > y", f: (x, y) => x > y },
  { text: "What is the value of x + y?", py: "x + y", f: (x, y) => x + y },
];
function dsItem(r: Rng, want: number[]) {
  const x0 = int(r, 2, 20), y0 = int(r, 1, 20);
  const pool = dsPool(r, x0, y0);
  const [s1, s2] = shuffle(pool, r).slice(0, 2);
  const q = pick(r, DS_Q);
  const dom: [number, number][] = [];
  for (let x = 1; x <= 20; x++) for (let y = 1; y <= 20; y++) dom.push([x, y]);
  const suff = (fs: DsStmt[]) => new Set(dom.filter(([x, y]) => fs.every((s) => s.f(x, y))).map(([x, y]) => String(q.f(x, y)))).size === 1;
  const a = suff([s1]), b = suff([s2]), c = suff([s1, s2]);
  const ans = a && b ? 3 : a ? 0 : b ? 1 : c ? 2 : 4;
  if (!want.includes(ans)) return null;
  return {
    prompt: `x and y are integers from 1 to 20. ${q.text}\n\n1. ${s1.text}\n2. ${s2.text}`,
    options: DS_OPTS, answer: ans,
    explain: `Test each statement against every possible (x, y): ${DS_OPTS[ans].toLowerCase()}.`,
    py: `def is_prime(n): return n > 1 and all(n % d for d in range(2, n))\ndom = [(x, y) for x in range(1, 21) for y in range(1, 21)]\ndef suff(conds):\n    vals = {(${q.py}) for x, y in dom if all(c(x, y) for c in conds)}\n    return len(vals) == 1\nI = lambda x, y: ${s1.py}\nII = lambda x, y: ${s2.py}\na, b, c = suff([I]), suff([II]), suff([I, II])\nanswer = 3 if a and b else 0 if a else 1 if b else 2 if c else 4`,
  };
}
const DS: Tpl[] = [
  { key: "alone", d: 2, secs: 90, fast: "Test statement I alone, then II alone, before combining.", trap: "Combining the statements first and answering C too early.", make: (r) => dsItem(r, [0, 1]) },
  { key: "together", d: 2, secs: 90, fast: "Only combine when neither works alone.", trap: "Treating 'x is odd' style facts as enough to fix a value.", make: (r) => dsItem(r, [2]) },
  { key: "each", d: 2, secs: 75, fast: "If each statement alone pins the answer, the answer is D, even if they look different.", trap: "Answering C because both statements were used.", make: (r) => dsItem(r, [3]) },
  { key: "neither", d: 2, secs: 90, fast: "Look for two different (x, y) pairs that satisfy both statements but give different answers.", trap: "Assuming two equations always fix two unknowns (they may be the same equation in disguise or nonlinear).", make: (r) => dsItem(r, [4]) },
];

// ───────────────────────── Data interpretation ─────────────────────────
const chart = (spec: object) => "```chart\n" + JSON.stringify(spec) + "\n```";
const tableBlock = (head: string[], rows: (string | number)[][]) => {
  const all = [head, ...rows.map((r) => r.map(String))];
  const w = head.map((_, j) => Math.max(...all.map((r) => String(r[j]).length)));
  const line = (r: (string | number)[]) => r.map((c, j) => (j === 0 ? String(c).padEnd(w[j]) : String(c).padStart(w[j]))).join("  ");
  return "```\n" + [line(head), line(w.map((x) => "-".repeat(x))), ...rows.map(line)].join("\n") + "\n```";
};
const COS = ["Arka", "Bento", "Cobalt", "Delta", "Ember"];
const YEARS = ["2021", "2022", "2023", "2024"];
function tableData(r: Rng) {
  return COS.map(() => YEARS.map(() => int(r, 12, 60) * 10));
}
const TABLE: Tpl[] = [
  {
    key: "growth", d: 1, secs: 60, fast: "% change = (new − old)/old × 100.", trap: "Dividing by the new value.",
    make: (r) => {
      const d = tableData(r), c = int(r, 0, 4);
      const v = ((d[c][3] - d[c][0]) / d[c][0]) * 100;
      return { prompt: `Units produced (thousands):\n\n${tableBlock(["Company", ...YEARS], COS.map((n, i) => [n, ...d[i]]))}\n\nWhat was the percentage change in ${COS[c]}'s production from 2021 to 2024?${D2}`, answer: r2(v), tol: 0.02,
        explain: `(${d[c][3]} − ${d[c][0]})/${d[c][0]} × 100 = ${r2(v)}%.`, py: `d = ${JSON.stringify(d)}\nanswer = (d[${c}][3] - d[${c}][0]) / d[${c}][0] * 100` };
    },
  },
  {
    key: "ratio", d: 2, secs: 75, fast: "Add each company's row, then divide.", trap: "Taking the ratio of a single year.",
    make: (r) => {
      const d = tableData(r);
      const [a, b] = shuffle([0, 1, 2, 3, 4], r);
      const sa = d[a].reduce((x, y) => x + y, 0), sb = d[b].reduce((x, y) => x + y, 0);
      return { prompt: `Units produced (thousands):\n\n${tableBlock(["Company", ...YEARS], COS.map((n, i) => [n, ...d[i]]))}\n\nWhat is the ratio of ${COS[a]}'s total production over the four years to ${COS[b]}'s?${D2}`, answer: r2(sa / sb), tol: 0.02,
        explain: `${sa}/${sb} = ${r2(sa / sb)}.`, py: `d = ${JSON.stringify(d)}\nanswer = sum(d[${a}]) / sum(d[${b}])` };
    },
  },
  {
    key: "avg", d: 1, secs: 60, fast: "Add the column and divide by 5.", trap: "Averaging across years instead of companies.",
    make: (r) => {
      const d = tableData(r), y = int(r, 0, 3);
      const v = d.reduce((s, row) => s + row[y], 0) / 5;
      return { prompt: `Units produced (thousands):\n\n${tableBlock(["Company", ...YEARS], COS.map((n, i) => [n, ...d[i]]))}\n\nWhat was the average production per company in ${YEARS[y]}, in thousands?${D2}`, answer: r2(v), tol: 0.02,
        explain: `Column total ${d.reduce((s, row) => s + row[y], 0)} ÷ 5 = ${r2(v)}.`, py: `d = ${JSON.stringify(d)}\nanswer = sum(row[${y}] for row in d) / len(d)` };
    },
  },
  {
    key: "best", d: 2, secs: 90, fast: "Estimate each ratio 2024/2021 first; only compute the close ones exactly.", trap: "Picking the largest absolute increase instead of the largest percentage.",
    make: (r) => {
      const d = tableData(r);
      const g = d.map((row) => (row[3] - row[0]) / row[0]);
      const sorted = [...g].sort((a, b) => b - a);
      if (sorted[0] - sorted[1] < 0.02) return null;
      const bestI = g.indexOf(sorted[0]);
      const absI = d.map((row) => row[3] - row[0]).indexOf(Math.max(...d.map((row) => row[3] - row[0])));
      if (absI === bestI) return null; // make the absolute-vs-relative trap live
      return { prompt: `Units produced (thousands):\n\n${tableBlock(["Company", ...YEARS], COS.map((n, i) => [n, ...d[i]]))}\n\nWhich company had the highest percentage growth from 2021 to 2024?`, ...mcq(r, COS[bestI], COS),
        explain: `Growth: ${COS.map((n, i) => `${n} ${r2(g[i] * 100)}%`).join(", ")}. ${COS[absI]} grew most in absolute terms, but ${COS[bestI]} grew most in percentage terms.`,
        py: `d = ${JSON.stringify(d)}\nnames = ${JSON.stringify(COS)}\ng = [(row[3] - row[0]) / row[0] for row in d]\nopts = OPTS\nanswer = opts.index(names[g.index(max(g))])` };
    },
  },
];

const Y5 = ["2020", "2021", "2022", "2023", "2024"];
const MONTHS6 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const BARLINE: Tpl[] = [
  {
    key: "gap", d: 1, secs: 45, fast: "Scan the pairs of bars for the widest gap; confirm with subtraction.", trap: "Picking the year with the tallest bar.",
    make: (r) => {
      const a = Y5.map(() => int(r, 20, 90) * 5), b = Y5.map(() => int(r, 20, 90) * 5);
      const gaps = a.map((v, i) => Math.abs(v - b[i]));
      const mx = Math.max(...gaps);
      if (gaps.filter((g) => g === mx).length > 1) return null;
      const yr = Y5[gaps.indexOf(mx)];
      return { prompt: `${chart({ type: "bar", title: "Production of two products (tonnes)", labels: Y5, series: [{ name: "Product A", values: a }, { name: "Product B", values: b }] })}\n\nIn which year was the difference between the production of A and B the largest?`,
        ...mcq(r, yr, Y5), explain: `Differences: ${Y5.map((y, i) => `${y} ${gaps[i]}`).join(", ")}. Largest in ${yr}.`,
        py: `a, b = ${JSON.stringify(a)}, ${JSON.stringify(b)}\nyears = ${JSON.stringify(Y5)}\ngaps = [abs(x - y) for x, y in zip(a, b)]\nopts = OPTS\nanswer = opts.index(years[gaps.index(max(gaps))])` };
    },
  },
  {
    key: "total", d: 2, secs: 60, fast: "Add A and B for the two years first, then compute the percentage change.", trap: "Averaging the two products' separate growth rates.",
    make: (r) => {
      const a = Y5.map(() => int(r, 20, 90) * 5), b = Y5.map(() => int(r, 20, 90) * 5);
      const t0 = a[0] + b[0], t4 = a[4] + b[4];
      return { prompt: `${chart({ type: "bar", title: "Production of two products (tonnes)", labels: Y5, series: [{ name: "Product A", values: a }, { name: "Product B", values: b }] })}\n\nBy what percentage did total production (A + B) change from 2020 to 2024? Give a negative number for a fall.${D2}`,
        answer: r2(((t4 - t0) / t0) * 100), tol: 0.02, explain: `Totals ${t0} → ${t4}: (${t4} − ${t0})/${t0} × 100 = ${r2(((t4 - t0) / t0) * 100)}%.`,
        py: `a, b = ${JSON.stringify(a)}, ${JSON.stringify(b)}\nt = [x + y for x, y in zip(a, b)]\nanswer = (t[-1] - t[0]) / t[0] * 100` };
    },
  },
  {
    key: "share", d: 2, secs: 45, fast: "X as a percentage of Y = X/Y × 100.", trap: "Computing Y as a percentage of X.",
    make: (r) => {
      const x = MONTHS6.map(() => int(r, 30, 120)), y = MONTHS6.map(() => int(r, 30, 120)), m = int(r, 0, 5);
      return { prompt: `${chart({ type: "line", title: "Monthly sales (₹ lakh)", labels: MONTHS6, series: [{ name: "Store X", values: x }, { name: "Store Y", values: y }] })}\n\nIn ${MONTHS6[m]}, Store X's sales were what percentage of Store Y's?${D2}`,
        answer: r2((x[m] / y[m]) * 100), tol: 0.02, explain: `${x[m]}/${y[m]} × 100 = ${r2((x[m] / y[m]) * 100)}%.`,
        py: `x, y = ${JSON.stringify(x)}, ${JSON.stringify(y)}\nanswer = x[${m}] / y[${m}] * 100` };
    },
  },
  {
    key: "count", d: 1, secs: 45, fast: "Compare the two points month by month.", trap: "Counting months where X rose instead of months where X beat Y.",
    make: (r) => {
      const x = MONTHS6.map(() => int(r, 30, 120)), y = MONTHS6.map(() => int(r, 30, 120));
      if (x.some((v, i) => Math.abs(v - y[i]) < 3)) return null;
      const n = x.filter((v, i) => v > y[i]).length;
      return { prompt: `${chart({ type: "line", title: "Monthly sales (₹ lakh)", labels: MONTHS6, series: [{ name: "Store X", values: x }, { name: "Store Y", values: y }] })}\n\nIn how many months did Store X sell more than Store Y?`,
        answer: n, tol: 0, explain: `X beat Y in ${MONTHS6.filter((_, i) => x[i] > y[i]).join(", ") || "no month"}: ${n}.`,
        py: `x, y = ${JSON.stringify(x)}, ${JSON.stringify(y)}\nanswer = sum(1 for a, b in zip(x, y) if a > b)` };
    },
  },
];

const HEADS = ["Salaries", "Raw material", "Marketing", "Transport", "Research"];
function shares(r: Rng): number[] | null {
  const s = HEADS.map(() => int(r, 8, 35));
  const total = s.reduce((a, b) => a + b, 0);
  const scaled = s.map((v) => Math.round((v / total) * 100));
  const diff = 100 - scaled.reduce((a, b) => a + b, 0);
  scaled[0] += diff;
  if (scaled.some((v) => v < 5) || new Set(scaled).size < 5) return null;
  return scaled;
}
const PIE: Tpl[] = [
  {
    key: "amount", d: 1, secs: 45, fast: "Amount = total × share/100.", trap: "Using the central angle instead of the percentage.",
    make: (r) => {
      const s = shares(r); if (!s) return null;
      const T = int(r, 20, 90) * 100, h = int(r, 0, 4);
      return { prompt: `A company's annual budget of ₹${T.toLocaleString("en-IN")} lakh is split as shown.\n\n${chart({ type: "pie", title: "Budget share (%)", unit: "%", labels: HEADS, series: [{ name: "Share", values: s }] })}\n\nHow much is spent on ${HEADS[h]}, in ₹ lakh?${D2}`,
        answer: r2((T * s[h]) / 100), tol: 0.02, explain: `${T} × ${s[h]}% = ${r2((T * s[h]) / 100)}.`, py: `s = ${JSON.stringify(s)}\nanswer = ${T} * s[${h}] / 100` };
    },
  },
  {
    key: "angle", d: 1, secs: 30, fast: "Central angle = share × 3.6°.", trap: "Multiplying by 360 without dividing by 100.",
    make: (r) => {
      const s = shares(r); if (!s) return null;
      const h = int(r, 0, 4);
      return { prompt: `${chart({ type: "pie", title: "Budget share (%)", unit: "%", labels: HEADS, series: [{ name: "Share", values: s }] })}\n\nWhat is the central angle of the ${HEADS[h]} sector, in degrees?${D2}`,
        answer: r2(s[h] * 3.6), tol: 0.02, explain: `${s[h]} × 3.6 = ${r2(s[h] * 3.6)}°.`, py: `s = ${JSON.stringify(s)}\nanswer = s[${h}] / sum(s) * 360` };
    },
  },
  {
    key: "more", d: 2, secs: 45, fast: "(a − b)/b × 100, using the shares directly; the total cancels.", trap: "Subtracting the percentages and calling that the answer.",
    make: (r) => {
      const s = shares(r); if (!s) return null;
      const [a, b] = shuffle([0, 1, 2, 3, 4], r);
      if (s[a] <= s[b]) return null;
      return { prompt: `${chart({ type: "pie", title: "Budget share (%)", unit: "%", labels: HEADS, series: [{ name: "Share", values: s }] })}\n\nBy what percentage is spending on ${HEADS[a]} more than spending on ${HEADS[b]}?${D2}`,
        answer: r2(((s[a] - s[b]) / s[b]) * 100), tol: 0.02, explain: `(${s[a]} − ${s[b]})/${s[b]} × 100 = ${r2(((s[a] - s[b]) / s[b]) * 100)}%.`,
        py: `s = ${JSON.stringify(s)}\nT = 1000.0\nA, B = T * s[${a}] / 100, T * s[${b}] / 100\nanswer = (A - B) / B * 100` };
    },
  },
  {
    key: "next", d: 3, secs: 75, fast: "New amount = new total × new share; subtract the old amount.", trap: "Applying the growth and the share change to the old amount separately and adding.",
    make: (r) => {
      const s = shares(r); if (!s) return null;
      const T = int(r, 20, 90) * 100, h = int(r, 0, 4), g = pick(r, [10, 20, 25]), dd = pick(r, [-3, -2, 2, 3]);
      const old = (T * s[h]) / 100, nw = (T * (1 + g / 100) * (s[h] + dd)) / 100;
      return { prompt: `This year's budget of ₹${T.toLocaleString("en-IN")} lakh is split as shown.\n\n${chart({ type: "pie", title: "Budget share (%)", unit: "%", labels: HEADS, series: [{ name: "Share", values: s }] })}\n\nNext year the total budget grows by ${g}% and ${HEADS[h]}'s share ${dd > 0 ? "rises" : "falls"} by ${Math.abs(dd)} percentage points. By how much, in ₹ lakh, does spending on ${HEADS[h]} change? Give a negative number for a fall.${D2}`,
        answer: r2(nw - old), tol: 0.02, explain: `Old ${r2(old)}; new ${T} × ${1 + g / 100} × ${s[h] + dd}% = ${r2(nw)}; change ${r2(nw - old)}.`,
        py: `s = ${JSON.stringify(s)}\nT = ${T}\nold = T * s[${h}] / 100\nnew = T * (1 + ${g} / 100) * (s[${h}] + (${dd})) / 100\nanswer = new - old` };
    },
  },
];

const REGIONS = ["North", "South", "East", "West", "Central"];
const MIXED: Tpl[] = [
  {
    key: "region", d: 2, secs: 60, fast: "Read the year's total from the bar chart, then take the region's share from the pie.", trap: "Applying the share to the wrong year's total.",
    make: (r) => {
      const tot = Y5.map(() => int(r, 40, 120) * 5); const s = shares(r); if (!s) return null;
      const k = int(r, 0, 4), h = int(r, 0, 4);
      return { prompt: `${chart({ type: "bar", title: "Total revenue (₹ crore)", labels: Y5, series: [{ name: "Revenue", values: tot }] })}\n\n${chart({ type: "pie", title: `Revenue share by region in ${Y5[k]} (%)`, unit: "%", labels: REGIONS, series: [{ name: "Share", values: s }] })}\n\nWhat was the revenue from the ${REGIONS[h]} region in ${Y5[k]}, in ₹ crore?${D2}`,
        answer: r2((tot[k] * s[h]) / 100), tol: 0.02, explain: `${tot[k]} × ${s[h]}% = ${r2((tot[k] * s[h]) / 100)}.`, py: `tot, s = ${JSON.stringify(tot)}, ${JSON.stringify(s)}\nanswer = tot[${k}] * s[${h}] / 100` };
    },
  },
  {
    key: "sameshare", d: 2, secs: 75, fast: "With constant shares, the regional change is the share × the change in total.", trap: "Using the share of the other year's chart for both.",
    make: (r) => {
      const tot = Y5.map(() => int(r, 40, 120) * 5); const s = shares(r); if (!s) return null;
      const [a, b] = shuffle([0, 1, 2, 3, 4], r).slice(0, 2).sort(), h = int(r, 0, 4);
      return { prompt: `${chart({ type: "bar", title: "Total revenue (₹ crore)", labels: Y5, series: [{ name: "Revenue", values: tot }] })}\n\n${chart({ type: "pie", title: "Revenue share by region (%), same every year", unit: "%", labels: REGIONS, series: [{ name: "Share", values: s }] })}\n\nBy how much did the ${REGIONS[h]} region's revenue change from ${Y5[a]} to ${Y5[b]}, in ₹ crore? Give a negative number for a fall.${D2}`,
        answer: r2(((tot[b] - tot[a]) * s[h]) / 100), tol: 0.02, explain: `(${tot[b]} − ${tot[a]}) × ${s[h]}% = ${r2(((tot[b] - tot[a]) * s[h]) / 100)}.`,
        py: `tot, s = ${JSON.stringify(tot)}, ${JSON.stringify(s)}\nanswer = tot[${b}] * s[${h}] / 100 - tot[${a}] * s[${h}] / 100` };
    },
  },
  {
    key: "growth", d: 1, secs: 45, fast: "(later − earlier)/earlier × 100 from the bar chart only.", trap: "Bringing the pie into a question about totals.",
    make: (r) => {
      const tot = Y5.map(() => int(r, 40, 120) * 5); const s = shares(r); if (!s) return null;
      const [a, b] = shuffle([0, 1, 2, 3, 4], r).slice(0, 2).sort();
      return { prompt: `${chart({ type: "bar", title: "Total revenue (₹ crore)", labels: Y5, series: [{ name: "Revenue", values: tot }] })}\n\n${chart({ type: "pie", title: `Revenue share by region in ${Y5[b]} (%)`, unit: "%", labels: REGIONS, series: [{ name: "Share", values: s }] })}\n\nWhat was the percentage change in total revenue from ${Y5[a]} to ${Y5[b]}? Give a negative number for a fall.${D2}`,
        answer: r2(((tot[b] - tot[a]) / tot[a]) * 100), tol: 0.02, explain: `(${tot[b]} − ${tot[a]})/${tot[a]} × 100 = ${r2(((tot[b] - tot[a]) / tot[a]) * 100)}%.`, py: `tot = ${JSON.stringify(tot)}\nanswer = (tot[${b}] - tot[${a}]) / tot[${a}] * 100` };
    },
  },
  {
    key: "over", d: 2, secs: 60, fast: "Convert the threshold to a share: threshold / total × 100, then count shares above it.", trap: "Comparing the threshold to the percentages directly.",
    make: (r) => {
      const tot = Y5.map(() => int(r, 40, 120) * 5); const s = shares(r); if (!s) return null;
      const k = int(r, 0, 4);
      const amounts = s.map((v) => (tot[k] * v) / 100);
      const thr = int(r, 4, 20) * 5;
      if (amounts.some((v) => Math.abs(v - thr) < 1)) return null;
      const n = amounts.filter((v) => v > thr).length;
      if (n === 0 || n === 5) return null;
      return { prompt: `${chart({ type: "bar", title: "Total revenue (₹ crore)", labels: Y5, series: [{ name: "Revenue", values: tot }] })}\n\n${chart({ type: "pie", title: `Revenue share by region in ${Y5[k]} (%)`, unit: "%", labels: REGIONS, series: [{ name: "Share", values: s }] })}\n\nIn ${Y5[k]}, how many regions earned more than ₹${thr} crore?`,
        answer: n, tol: 0, explain: `Regional revenue in ${Y5[k]}: ${REGIONS.map((g, i) => `${g} ${r2(amounts[i])}`).join(", ")}. ${n} exceed ${thr}.`,
        py: `tot, s = ${JSON.stringify(tot)}, ${JSON.stringify(s)}\nanswer = sum(1 for v in s if tot[${k}] * v / 100 > ${thr})` };
    },
  },
];

const CASE: Tpl[] = [
  {
    key: "college", d: 2, secs: 90, fast: "Split into the two groups first, then apply each group's percentage.", trap: "Applying one percentage to the whole college.",
    make: (r) => {
      const n = int(r, 8, 30) * 100, g = pick(r, [30, 35, 40, 45, 55, 60]), a = pick(r, [10, 15, 20, 25, 30]), b = pick(r, [20, 25, 30, 35, 40]);
      const girls = (n * g) / 100, boys = n - girls, play = (girls * a) / 100 + (boys * b) / 100;
      if (!Number.isInteger(play)) return null;
      return { prompt: `A college has ${n.toLocaleString("en-IN")} students, of whom ${g}% are girls. ${a}% of the girls and ${b}% of the boys play cricket. How many students play cricket?`,
        answer: play, tol: 0, explain: `Girls ${girls} × ${a}% = ${(girls * a) / 100}; boys ${boys} × ${b}% = ${(boys * b) / 100}; total ${play}.`,
        py: `n = ${n}\ngirls = n * ${g} // 100\nboys = n - girls\nanswer = girls * ${a} / 100 + boys * ${b} / 100` };
    },
  },
  {
    key: "neither", d: 2, secs: 75, fast: "Neither = total − (A + B − both).", trap: "Forgetting to subtract the overlap once.",
    make: (r) => {
      const n = int(r, 4, 20) * 100, p = int(r, 30, 70), q = int(r, 20, 60), both = int(r, 5, Math.min(p, q) - 5);
      if (p + q - both > 100) return null;
      const ans = (n * (100 - (p + q - both))) / 100;
      return { prompt: `In a survey of ${n.toLocaleString("en-IN")} people, ${p}% like tea, ${q}% like coffee and ${both}% like both. How many people like neither?`,
        answer: ans, tol: 0, explain: `Tea or coffee: ${p} + ${q} − ${both} = ${p + q - both}%. Neither: ${100 - (p + q - both)}% of ${n} = ${ans}.`,
        py: `n = ${n}\npeople = [(i < n * ${p} // 100, (i < n * ${both} // 100) or (n * ${p} // 100 <= i < n * ${p} // 100 + n * (${q} - ${both}) // 100)) for i in range(n)]\nanswer = sum(1 for t, c in people if not t and not c)` };
    },
  },
  {
    key: "defects", d: 3, secs: 90, fast: "Defective units = Σ (shift's units × its defect rate); overall rate = that ÷ total units.", trap: "Averaging the defect rates without weighting by output.",
    make: (r) => {
      const total = int(r, 10, 40) * 1000, sh = pick(r, [[50, 30, 20], [40, 35, 25], [45, 30, 25], [60, 25, 15]]), dr = [pick(r, [1, 2, 3]), pick(r, [2, 3, 4]), pick(r, [4, 5, 6])];
      const units = sh.map((s) => (total * s) / 100), def = units.reduce((a, u, i) => a + (u * dr[i]) / 100, 0);
      return { prompt: `A factory makes ${total.toLocaleString("en-IN")} units a day across three shifts: Morning ${sh[0]}%, Evening ${sh[1]}% and Night ${sh[2]}% of the output. The defect rates are ${dr[0]}%, ${dr[1]}% and ${dr[2]}% respectively. What is the overall defect rate, in %?${D2}`,
        answer: r2((def / total) * 100), tol: 0.02, explain: `Defective: ${units.map((u, i) => `${u} × ${dr[i]}%`).join(" + ")} = ${def}. Rate ${def}/${total} = ${r2((def / total) * 100)}%.`,
        py: `units = [${total} * s / 100 for s in ${JSON.stringify(sh)}]\ndefects = sum(u * d / 100 for u, d in zip(units, ${JSON.stringify(dr)}))\nanswer = defects / ${total} * 100` };
    },
  },
  {
    key: "shop", d: 2, secs: 90, fast: "Profit per item = cost × (markup − discount effect); multiply by quantities and add.", trap: "Applying the discount to the cost price.",
    make: (r) => {
      const items = ["shirts", "trousers", "jackets"].map((nm) => ({ nm, cost: int(r, 3, 20) * 50, q: int(r, 5, 40), m: pick(r, [20, 25, 40, 50]), d: pick(r, [0, 10, 20]) }));
      const profit = items.reduce((s, it) => s + it.q * (it.cost * (1 + it.m / 100) * (1 - it.d / 100) - it.cost), 0);
      return { prompt: `A shop sells ${items.map((it) => `${it.q} ${it.nm} (cost ₹${it.cost} each, marked up ${it.m}%, sold at ${it.d}% off the marked price)`).join("; ")}. What is the total profit in rupees? Give a negative number for a loss.${D2}`,
        answer: r2(profit), tol: 0.02, explain: items.map((it) => `${it.nm}: ${it.q} × (${it.cost} × ${1 + it.m / 100} × ${1 - it.d / 100} − ${it.cost})`).join("; ") + ` = ${r2(profit)}.`,
        py: `items = ${JSON.stringify(items.map((it) => [it.cost, it.q, it.m, it.d]))}\ntotal = 0\nfor cost, q, m, d in items:\n    sp = cost * (100 + m) / 100\n    sp -= sp * d / 100\n    total += q * (sp - cost)\nanswer = total` };
    },
  },
];

function finish(items: GenQ[]): GenQ[] {
  return items.map((q) => (q.options ? { ...q, py: q.py.replace("OPTS", JSON.stringify(q.options)) } : q));
}

export const B5_TOPICS = {
  blood: "lr2-blood-relations",
  dirs: "lr2-directions",
  syl: "lr2-syllogisms",
  order: "lr2-ordering-ranking",
  ds: "lr2-data-sufficiency",
  table: "di-tables",
  barline: "di-bar-line",
  pie: "di-pie",
  mixed: "di-mixed",
  case: "di-caselets",
} as const;

export const B5_ITEMS: GenQ[] = finish([
  ...build(B5_TOPICS.blood, "blood", 5101, BLOOD),
  ...build(B5_TOPICS.dirs, "dirs", 5102, DIRS),
  ...build(B5_TOPICS.syl, "syl", 5103, SYL),
  ...build(B5_TOPICS.order, "order", 5104, ORDER),
  ...build(B5_TOPICS.ds, "ds", 5105, DS),
  ...build(B5_TOPICS.table, "table", 5106, TABLE),
  ...build(B5_TOPICS.barline, "barline", 5107, BARLINE),
  ...build(B5_TOPICS.pie, "pie", 5108, PIE),
  ...build(B5_TOPICS.mixed, "mixed", 5109, MIXED),
  ...build(B5_TOPICS.case, "case", 5110, CASE),
]);
