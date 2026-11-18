/**
 * Batch 2 generator: permutations and combinations. Every answer is a closed-form count in
 * TypeScript; every Python check counts the same thing by brute-force enumeration with itertools.
 */
import { build, gcd, int, pick, type GenQ, type Tpl } from "./quant";

const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));
const nCr = (n: number, r: number) => (r < 0 || r > n ? 0 : Math.round(fact(n) / (fact(r) * fact(n - r))));
const nPr = (n: number, r: number) => Math.round(fact(n) / fact(n - r));
const derange = (n: number): number => (n === 0 ? 1 : n === 1 ? 0 : (n - 1) * (derange(n - 1) + derange(n - 2)));
void gcd;
/** Seeded Fisher–Yates: identical in every JS engine (a random sort comparator is not). */
function shuffle<T>(a: T[], r: () => number): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

const WORDS = ["BANANA", "LETTER", "BALLOON", "SUCCESS", "APPLE", "COFFEE", "GOOGLE", "ENGINEER", "PEPPER", "CHEESE", "ASSESS", "TOMATO"];

const ARRANGE: Tpl[] = [
  {
    key: "word", d: 1, secs: 45,
    fast: "n! divided by the factorial of each letter's count.",
    trap: "Using n! and counting identical letters as different.",
    make: (r) => {
      const w = pick(r, WORDS);
      const counts = [...new Set(w)].map((c) => [...w].filter((x) => x === c).length);
      const ans = fact(w.length) / counts.reduce((a, c) => a * fact(c), 1);
      const rep = [...new Set(w)].filter((c) => w.split(c).length - 1 > 1).map((c) => `${c} × ${w.split(c).length - 1}`).join(", ");
      return {
        prompt: `In how many distinct ways can the letters of the word ${w} be arranged?`,
        answer: ans, tol: 0,
        explain: `${w.length} letters with repeats (${rep}): ${w.length}! / (${counts.filter((c) => c > 1).map((c) => `${c}!`).join(" × ")}) = ${ans}.`,
        py: `from itertools import permutations\nanswer = len(set(permutations("${w}")))`,
      };
    },
  },
  {
    key: "together", d: 2, secs: 45,
    fast: "Glue the pair into one block: (n − 1)! arrangements of blocks × 2! inside the block.",
    trap: "Forgetting the 2! for the order inside the block.",
    make: (r) => {
      const n = int(r, 4, 8);
      return {
        prompt: `${n} friends, including Asha and Ravi, stand in a row for a photo. In how many arrangements do Asha and Ravi stand next to each other?`,
        answer: 2 * fact(n - 1), tol: 0,
        explain: `Treat Asha and Ravi as one block: ${n - 1}! = ${fact(n - 1)} orders, × 2 for the order within the block = ${2 * fact(n - 1)}.`,
        py: `from itertools import permutations\nanswer = sum(1 for p in permutations(range(${n})) if abs(p.index(0) - p.index(1)) == 1)`,
      };
    },
  },
  {
    key: "apart", d: 2, secs: 60,
    fast: "Never together = all arrangements − arrangements with them together = n! − 2(n − 1)!.",
    trap: "Computing 'never together' directly and missing cases; the complement is faster and safer.",
    make: (r) => {
      const n = int(r, 4, 8);
      const ans = fact(n) - 2 * fact(n - 1);
      return {
        prompt: `${n} people, including Meera and Kabir, sit in a row of ${n} chairs. In how many ways can they sit so that Meera and Kabir are never next to each other?`,
        answer: ans, tol: 0,
        explain: `Total ${n}! = ${fact(n)}; together 2 × ${n - 1}! = ${2 * fact(n - 1)}. Never together = ${ans}.`,
        py: `from itertools import permutations\nanswer = sum(1 for p in permutations(range(${n})) if abs(p.index(0) - p.index(1)) != 1)`,
      };
    },
  },
  {
    key: "digits", d: 3, secs: 90,
    fast: "Fill the restricted places first: the leading digit cannot be 0, and an even number must end in 0, 2, 4, 6 or 8. Split by whether the last digit is 0.",
    trap: "Allowing a leading zero, or not splitting the 'ends in 0' case for even numbers.",
    make: (r) => {
      const pool = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const k = int(r, 5, 7);
      const digits = [0, ...shuffle(pool.slice(1), r).slice(0, k - 1)].sort((a, b) => a - b);
      const len = int(r, 3, 4);
      const even = r() < 0.5;
      let ans = 0;
      if (!even) ans = (k - 1) * nPr(k - 1, len - 1);
      else {
        const evens = digits.filter((d) => d % 2 === 0);
        const nonzeroEven = evens.filter((d) => d !== 0).length;
        // last digit 0: remaining len-1 places from k-1 digits
        ans = nPr(k - 1, len - 1) + nonzeroEven * (k - 2) * nPr(k - 2, len - 2);
      }
      if (ans <= 0) return null;
      return {
        prompt: `How many ${len}-digit ${even ? "even " : ""}numbers can be formed from the digits ${digits.join(", ")} if no digit is repeated?`,
        answer: ans, tol: 0,
        explain: even
          ? `Ends in 0: ${nPr(k - 1, len - 1)}. Ends in another even digit (${digits.filter((d) => d % 2 === 0 && d !== 0).join(", ")}): first digit from ${k - 2} non-zero choices, then ${nPr(k - 2, len - 2)} ways for the middle: ${digits.filter((d) => d % 2 === 0 && d !== 0).length * (k - 2) * nPr(k - 2, len - 2)}. Total ${ans}.`
          : `First digit: ${k - 1} choices (not 0). Remaining ${len - 1} places from the other ${k - 1} digits: ${nPr(k - 1, len - 1)}. Total ${ans}.`,
        py: `from itertools import permutations\nds = [${digits.join(", ")}]\nanswer = sum(1 for p in permutations(ds, ${len}) if p[0] != 0${even ? " and p[-1] % 2 == 0" : ""})`,
      };
    },
  },
];

const SELECT: Tpl[] = [
  {
    key: "committee", d: 2, secs: 75,
    fast: "Split 'at least j women' into exact cases (j, j + 1, …) and add C(w, i) × C(m, k − i); or subtract the bad cases from C(m + w, k).",
    trap: "Choosing j women first and then any k − j people: that counts some committees more than once.",
    make: (r) => {
      const m = int(r, 4, 8), w = int(r, 3, 7), k = int(r, 3, 5), j = int(r, 1, Math.min(w, k) - 1);
      let ans = 0;
      for (let i = j; i <= Math.min(w, k); i++) ans += nCr(w, i) * nCr(m, k - i);
      return {
        prompt: `A committee of ${k} is to be chosen from ${m} men and ${w} women. In how many ways can it be formed if it must include at least ${j} ${j === 1 ? "woman" : "women"}?`,
        answer: ans, tol: 0,
        explain: `Add the exact cases: ${Array.from({ length: Math.min(w, k) - j + 1 }, (_, t) => j + t).map((i) => `C(${w},${i})·C(${m},${k - i})`).join(" + ")} = ${ans}.`,
        py: `from itertools import combinations\npeople = ["M"] * ${m} + ["W"] * ${w}\nanswer = sum(1 for c in combinations(range(len(people)), ${k}) if sum(people[i] == "W" for i in c) >= ${j})`,
      };
    },
  },
  {
    key: "stars", d: 3, secs: 75,
    fast: "n identical items into k distinct boxes: C(n + k − 1, k − 1); if every box needs at least one, C(n − 1, k − 1).",
    trap: "Using k^n, which treats the items as distinct.",
    make: (r) => {
      const n = int(r, 5, 12), k = int(r, 3, 4), atLeast1 = r() < 0.5;
      const ans = atLeast1 ? nCr(n - 1, k - 1) : nCr(n + k - 1, k - 1);
      return {
        prompt: `In how many ways can ${n} identical chocolates be distributed among ${k} children${atLeast1 ? " so that every child gets at least one" : " (some may get none)"}?`,
        answer: ans, tol: 0,
        explain: atLeast1 ? `Stars and bars with each ≥ 1: C(${n} − 1, ${k} − 1) = C(${n - 1}, ${k - 1}) = ${ans}.` : `Stars and bars: C(${n} + ${k} − 1, ${k} − 1) = C(${n + k - 1}, ${k - 1}) = ${ans}.`,
        py: `from itertools import product\nlo = ${atLeast1 ? 1 : 0}\nanswer = sum(1 for xs in product(range(lo, ${n} + 1), repeat=${k}) if sum(xs) == ${n})`,
      };
    },
  },
  {
    key: "diag", d: 1, secs: 30,
    fast: "Diagonals = C(n, 2) − n = n(n − 3)/2.",
    trap: "Counting the sides as diagonals (C(n, 2) alone).",
    make: (r) => {
      const n = int(r, 5, 20);
      return {
        prompt: `How many diagonals does a convex polygon with ${n} sides have?`,
        answer: (n * (n - 3)) / 2, tol: 0,
        explain: `Pairs of vertices C(${n}, 2) = ${nCr(n, 2)}, minus ${n} sides = ${(n * (n - 3)) / 2}.`,
        py: `from itertools import combinations\nn = ${n}\nanswer = sum(1 for a, b in combinations(range(n), 2) if (b - a) % n not in (1, n - 1))`,
      };
    },
  },
  {
    key: "atleast1", d: 2, secs: 60,
    fast: "Identical items of each kind: (a + 1)(b + 1)(c + 1) − 1, where the −1 removes taking nothing.",
    trap: "Using 2^(a + b + c) − 1, which treats identical fruits as distinct.",
    make: (r) => {
      const a = int(r, 2, 6), b = int(r, 2, 6), c = int(r, 1, 5);
      const ans = (a + 1) * (b + 1) * (c + 1) - 1;
      return {
        prompt: `A basket has ${a} identical apples, ${b} identical bananas and ${c} identical mangoes. In how many ways can you pick at least one fruit?`,
        answer: ans, tol: 0,
        explain: `Choose 0–${a} apples, 0–${b} bananas, 0–${c} mangoes: ${a + 1} × ${b + 1} × ${c + 1} = ${(a + 1) * (b + 1) * (c + 1)}, minus the empty choice = ${ans}.`,
        py: `from itertools import product\nanswer = sum(1 for x in product(range(${a + 1}), range(${b + 1}), range(${c + 1})) if sum(x) > 0)`,
      };
    },
  },
];

// Canonical form of a circular seating: rotate so person 0 is first (and optionally also mirror).
const PY_CANON = `def canon(p, mirror=False):
    i = p.index(0)
    r = p[i:] + p[:i]
    if mirror:
        m = (r[0],) + tuple(reversed(r[1:]))
        return min(r, m)
    return r`;

const CIRCLE: Tpl[] = [
  {
    key: "round", d: 1, secs: 30,
    fast: "Fix one person; arrange the rest: (n − 1)!.",
    trap: "Using n!: rotations of the same seating are counted as different.",
    make: (r) => {
      const n = int(r, 4, 8);
      return {
        prompt: `In how many ways can ${n} people be seated around a round table? (Seatings that are rotations of each other are the same.)`,
        answer: fact(n - 1), tol: 0,
        explain: `Fix one person and arrange the other ${n - 1}: ${n - 1}! = ${fact(n - 1)}.`,
        py: `from itertools import permutations\n${PY_CANON}\nanswer = len({canon(p) for p in permutations(range(${n}))})`,
      };
    },
  },
  {
    key: "roundApart", d: 2, secs: 60,
    fast: "Total (n − 1)! minus together 2 × (n − 2)!.",
    trap: "Using the row formulas n! − 2(n − 1)! at a round table.",
    make: (r) => {
      const n = int(r, 5, 8);
      const ans = fact(n - 1) - 2 * fact(n - 2);
      return {
        prompt: `${n} people, including Neel and Tara, sit around a round table. In how many seatings are Neel and Tara not next to each other? (Rotations are the same seating.)`,
        answer: ans, tol: 0,
        explain: `All seatings ${n - 1}! = ${fact(n - 1)}. Together: block of 2 with ${n - 2} others around the table, (${n - 2})! × 2 = ${2 * fact(n - 2)}. Apart = ${ans}.`,
        py: `from itertools import permutations\n${PY_CANON}\nn = ${n}\nseats = {canon(p) for p in permutations(range(n))}\nanswer = sum(1 for s in seats if (s.index(0) - s.index(1)) % n not in (1, n - 1))`,
      };
    },
  },
  {
    key: "derange", d: 3, secs: 60,
    fast: "Derangements: D(n) = (n − 1)(D(n − 1) + D(n − 2)); D(2) = 1, D(3) = 2, D(4) = 9, D(5) = 44, D(6) = 265.",
    trap: "Using (n − 1)!, or subtracting only the cases where one letter is correct.",
    make: (r) => {
      const n = int(r, 3, 7);
      return {
        prompt: `${n} letters are put into ${n} addressed envelopes, one per envelope. In how many ways can this be done so that no letter is in its correct envelope?`,
        answer: derange(n), tol: 0,
        explain: `This is the derangement number D(${n}) = ${n}! × (1 − 1/1! + 1/2! − … ) = ${derange(n)}.`,
        py: `from itertools import permutations\nanswer = sum(1 for p in permutations(range(${n})) if all(p[i] != i for i in range(${n})))`,
      };
    },
  },
  {
    key: "necklace", d: 2, secs: 45,
    fast: "A necklace can be flipped as well as rotated: (n − 1)!/2 for n ≥ 3 distinct beads.",
    trap: "Using (n − 1)!: that is a round table, where clockwise and anticlockwise differ.",
    make: (r) => {
      const n = int(r, 4, 8);
      return {
        prompt: `How many different necklaces can be made from ${n} distinct beads? (A necklace can be rotated and turned over.)`,
        answer: fact(n - 1) / 2, tol: 0,
        explain: `Circular arrangements (${n} − 1)! = ${fact(n - 1)}, halved because turning the necklace over gives the same one: ${fact(n - 1) / 2}.`,
        py: `from itertools import permutations\n${PY_CANON}\nanswer = len({canon(p, mirror=True) for p in permutations(range(${n}))})`,
      };
    },
  },
];

export const PNC_TOPICS = { arrange: "a2-pnc-arrangements", select: "a2-pnc-selections", circle: "a2-pnc-circular" } as const;

export const PNC_ITEMS: GenQ[] = [
  ...build(PNC_TOPICS.arrange, "pnc-arr", 2201, ARRANGE),
  ...build(PNC_TOPICS.select, "pnc-sel", 2202, SELECT),
  ...build(PNC_TOPICS.circle, "pnc-cir", 2203, CIRCLE),
];
