/**
 * Batch 1 question generator: arithmetic, clocks and calendars, number systems.
 *
 * Each template picks parameters from a seeded RNG (retrying until the answer is clean), computes the
 * answer in TypeScript, and emits a Python `check` that recomputes it a different way where possible
 * (simulation, brute-force search, datetime) so a wrong formula here does not verify itself.
 * Seeds are part of the item identity: changing a seed or a template changes the items.
 */

export interface GenQ {
  id: string;
  topic: string;
  d: 1 | 2 | 3;
  secs: number;
  prompt: string;
  answer: number;
  tol?: number;
  options?: string[];
  explain: string;
  fast: string;
  trap: string;
  py: string;
  /** Pyodide packages the Python check needs (e.g. scipy). */
  packages?: string[];
}

export type Rng = () => number;
export type Made = Pick<GenQ, "prompt" | "answer" | "explain" | "py"> & { tol?: number; options?: string[]; packages?: string[] };
export interface Tpl {
  key: string;
  d: 1 | 2 | 3;
  secs: number;
  fast: string;
  trap: string;
  make: (r: Rng) => Made | null;
}

function mulberry32(seed: number): Rng {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const pick = <T,>(r: Rng, a: readonly T[]): T => a[Math.floor(r() * a.length)];
export const int = (r: Rng, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
const r2 = (x: number) => Math.round(x * 100) / 100;
const isInt = (x: number) => Math.abs(x - Math.round(x)) < 1e-9;
const is2dp = (x: number) => isInt(x * 100);
export const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
const lcm = (a: number, b: number) => (a / gcd(a, b)) * b;
const fmt = (x: number) => (isInt(x) ? String(Math.round(x)) : String(r2(x)));
const money = (x: number) => `₹${x.toLocaleString("en-IN")}`;
const D2 = " Give 2 decimals.";
const sg = (x: number) => (x < 0 ? `(−${-x})` : String(x));
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function build(topic: string, code: string, seed: number, tpls: Tpl[], per = 3): GenQ[] {
  const r = mulberry32(seed);
  const out: GenQ[] = [];
  for (const t of tpls) {
    const seen = new Set<string>();
    for (let k = 1; k <= per; k++) {
      let m: Made | null = null;
      for (let tries = 0; tries < 500 && !m; tries++) {
        const c = t.make(r);
        if (c && !seen.has(c.prompt)) m = c;
      }
      if (!m) throw new Error(`generator ${code}-${t.key} could not make item ${k}`);
      seen.add(m.prompt);
      out.push({ id: `p2-${code}-${t.key}-${k}`, topic, d: t.d, secs: t.secs, fast: t.fast, trap: t.trap, ...m });
    }
  }
  return out;
}

// ───────────────────────── Percentages ─────────────────────────
const PCT: Tpl[] = [
  {
    key: "succ", d: 1, secs: 45,
    fast: "Net change = a + b + ab/100, with decreases negative.",
    trap: "Adding the two percentages (a + b) and ignoring the change on the change.",
    make: (r) => {
      const x = pick(r, [10, 20, 25, 30, 40, 50]), y = pick(r, [10, 20, 25, 30, 40, 50]);
      const up = r() < 0.5;
      const a = up ? x : -x, b = up ? -y : y;
      const net = r2(a + b + (a * b) / 100);
      return {
        prompt: `A price ${up ? "rises" : "falls"} by ${x}% and then ${up ? "falls" : "rises"} by ${y}%. What is the net percentage change? Give a negative number for a decrease.`,
        answer: net, tol: 0.01,
        explain: `Net = ${sg(a)} + ${sg(b)} + ${sg(a)} × ${sg(b)} / 100 = ${net < 0 ? `−${-net}` : net}%.`,
        py: `p = 100.0\np *= 1 + (${a}) / 100\np *= 1 + (${b}) / 100\nanswer = p - 100`,
      };
    },
  },
  {
    key: "less", d: 2, secs: 45,
    fast: "If A is x% more than B, B is x/(100 + x) × 100 % less than A.",
    trap: "Answering x%: the base changes from B to A.",
    make: (r) => {
      const x = pick(r, [20, 25, 40, 50, 60, 75, 100, 150]);
      const ans = r2((x / (100 + x)) * 100);
      return {
        prompt: `A's salary is ${x}% more than B's. By what percentage is B's salary less than A's?${D2}`,
        answer: ans, tol: 0.02,
        explain: `Let B = 100, so A = ${100 + x}. B is less by ${x} on a base of ${100 + x}: ${x}/${100 + x} × 100 = ${ans}%.`,
        py: `a, b = 100 + ${x}, 100\nanswer = (a - b) / a * 100`,
      };
    },
  },
  {
    key: "votes", d: 2, secs: 60,
    fast: "Valid votes = total × (1 − invalid share); then take the candidate's share of valid votes.",
    trap: "Taking the candidate's percentage of all votes cast instead of valid votes.",
    make: (r) => {
      const n = pick(r, [6000, 8000, 12000, 15000, 20000, 24000]), inv = pick(r, [10, 15, 20, 25]), xa = pick(r, [40, 45, 52, 55, 60, 65]);
      const valid = (n * (100 - inv)) / 100, a = (valid * xa) / 100;
      if (!isInt(valid) || !isInt(a)) return null;
      return {
        prompt: `In an election, ${n.toLocaleString("en-IN")} votes were cast and ${inv}% were invalid. Candidate A received ${xa}% of the valid votes. How many votes did A receive?`,
        answer: a, tol: 0,
        explain: `Valid votes = ${n} × ${100 - inv}% = ${valid}. A's votes = ${valid} × ${xa}% = ${a}.`,
        py: `n, inv, xa = ${n}, ${inv}, ${xa}\nvalid = n - n * inv // 100\nanswer = sum(1 for _ in range(valid * xa // 100))`,
      };
    },
  },
  {
    key: "rev", d: 2, secs: 45,
    fast: "Original = new price ÷ (1 ± x/100).",
    trap: "Subtracting x% of the new price, which uses the wrong base.",
    make: (r) => {
      const x = pick(r, [10, 12, 15, 20, 25, 30, 40]), orig = int(r, 4, 100) * 50;
      const up = r() < 0.6;
      const now = (orig * (100 + (up ? x : -x))) / 100;
      if (!isInt(now)) return null;
      return {
        prompt: `After a ${x}% ${up ? "increase" : "decrease"}, the price of a phone is ${money(now)}. What was the original price in rupees?`,
        answer: orig, tol: 0,
        explain: `${money(now)} is ${up ? 100 + x : 100 - x}% of the original, so the original = ${now} × 100 / ${up ? 100 + x : 100 - x} = ${orig}.`,
        py: `now, f = ${now}, ${up ? 100 + x : 100 - x}\nanswer = next(o for o in range(1, 10**6) if o * f == now * 100)`,
      };
    },
  },
];

// ───────────────────────── Profit, loss, discount ─────────────────────────
const PLD: Tpl[] = [
  {
    key: "disc2", d: 1, secs: 45,
    fast: "Apply each discount to the already-discounted price: M × (1 − d1)(1 − d2).",
    trap: "Adding the discounts: 20% + 10% is not 30% off.",
    make: (r) => {
      const m = int(r, 10, 50) * 100, d1 = pick(r, [5, 10, 15, 20, 25]), d2 = pick(r, [5, 10, 15, 20, 25]);
      const sp = (m * (100 - d1) * (100 - d2)) / 10000;
      return {
        prompt: `An item is marked at ${money(m)}. The shop gives successive discounts of ${d1}% and ${d2}%. What is the selling price in rupees? Give 2 decimals if needed.`,
        answer: r2(sp), tol: 0.01,
        explain: `${m} × ${(100 - d1) / 100} × ${(100 - d2) / 100} = ${fmt(sp)}.`,
        py: `sp = ${m}\nsp -= sp * ${d1} / 100\nsp -= sp * ${d2} / 100\nanswer = sp`,
      };
    },
  },
  {
    key: "markup", d: 2, secs: 60,
    fast: "Take CP = 100: MP = 100 + x, SP = MP × (1 − y/100), profit % = SP − 100.",
    trap: "Profit % = markup − discount. The discount is on the marked price, not the cost.",
    make: (r) => {
      const x = pick(r, [20, 25, 30, 40, 50, 60]), y = pick(r, [10, 15, 20, 25]);
      const p = r2(((100 + x) * (100 - y)) / 100 - 100);
      return {
        prompt: `A trader marks goods ${x}% above cost price and then gives a ${y}% discount. What is the profit percentage? Give a negative number for a loss.`,
        answer: p, tol: 0.01,
        explain: `CP = 100 → MP = ${100 + x} → SP = ${100 + x} × ${(100 - y) / 100} = ${r2(100 + p)}. Profit = ${p}%.`,
        py: `cp = 250.0\nmp = cp * (1 + ${x} / 100)\nsp = mp * (1 - ${y} / 100)\nanswer = (sp - cp) / cp * 100`,
      };
    },
  },
  {
    key: "regain", d: 2, secs: 60,
    fast: "Recover CP from the first sale, then apply the target margin: S2 = S1 × (100 + g) / (100 − l).",
    trap: "Adding l + g percent to S1: S1 is already below cost.",
    make: (r) => {
      const cp = int(r, 10, 100) * 20, l = pick(r, [5, 10, 12, 15, 20, 25]), g = pick(r, [5, 10, 15, 20, 25, 30]);
      const s1 = (cp * (100 - l)) / 100, s2 = (cp * (100 + g)) / 100;
      if (!isInt(s1) || !isInt(s2)) return null;
      return {
        prompt: `Selling a bicycle for ${money(s1)} causes a loss of ${l}%. At what price, in rupees, should it be sold to make a profit of ${g}%?`,
        answer: s2, tol: 0,
        explain: `CP = ${s1} × 100 / ${100 - l} = ${cp}. Required SP = ${cp} × ${(100 + g) / 100} = ${s2}.`,
        py: `s1, l, g = ${s1}, ${l}, ${g}\ncp = next(c for c in range(1, 10**6) if c * (100 - l) == s1 * 100)\nanswer = cp * (100 + g) / 100`,
      };
    },
  },
  {
    key: "weight", d: 2, secs: 45,
    fast: "Gain % = error / (true weight − error) × 100 = (1000 − w) / w × 100.",
    trap: "Dividing by 1000 instead of by the weight actually given.",
    make: (r) => {
      const w = pick(r, [800, 850, 875, 900, 950, 960, 975]);
      const ans = r2(((1000 - w) / w) * 100);
      return {
        prompt: `A shopkeeper claims to sell at cost price but uses a weight of ${w} g in place of 1 kg. What is his gain percentage?${D2}`,
        answer: ans, tol: 0.02,
        explain: `He gives ${w} g but charges for 1000 g. Gain = ${1000 - w}/${w} × 100 = ${ans}%.`,
        py: `cost_per_g = 1.0\ncost = ${w} * cost_per_g\nrevenue = 1000 * cost_per_g\nanswer = (revenue - cost) / cost * 100`,
      };
    },
  },
];

// ───────────────────────── Simple and compound interest ─────────────────────────
const INT: Tpl[] = [
  {
    key: "si", d: 1, secs: 30,
    fast: "SI = P × R × T / 100.",
    trap: "Compounding: simple interest is always on the original principal.",
    make: (r) => {
      const p = int(r, 4, 40) * 500, rate = pick(r, [4, 5, 6, 7.5, 8, 10, 12]), t = pick(r, [2, 3, 4, 5]);
      const si = (p * rate * t) / 100;
      return {
        prompt: `What is the simple interest on ${money(p)} at ${rate}% per annum for ${t} years? Give 2 decimals if needed.`,
        answer: r2(si), tol: 0.01,
        explain: `${p} × ${rate} × ${t} / 100 = ${fmt(si)}.`,
        py: `p, rate, t = ${p}, ${rate}, ${t}\ninterest = 0.0\nfor _ in range(t):\n    interest += p * rate / 100\nanswer = interest`,
      };
    },
  },
  {
    key: "ci", d: 2, secs: 75,
    fast: "A = P(1 + R/100)^T; CI = A − P. For 10% use the 1.1, 1.21, 1.331 ladder.",
    trap: "Reporting the amount A instead of the interest A − P.",
    make: (r) => {
      const p = pick(r, [5000, 8000, 10000, 12000, 15000, 16000, 20000]), rate = pick(r, [5, 10, 20]), t = pick(r, [2, 3]);
      const ci = (p * (100 + rate) ** t) / 100 ** t - p;
      if (!is2dp(r2(ci)) || Math.abs(ci - r2(ci)) > 1e-6) return null;
      return {
        prompt: `What is the compound interest on ${money(p)} at ${rate}% per annum for ${t} years, compounded annually? Give 2 decimals if needed.`,
        answer: r2(ci), tol: 0.01,
        explain: `A = ${p} × ${1 + rate / 100}^${t} = ${fmt(p + ci)}. CI = ${fmt(p + ci)} − ${p} = ${fmt(ci)}.`,
        py: `amt = ${p}.0\nfor _ in range(${t}):\n    amt += amt * ${rate} / 100\nanswer = amt - ${p}`,
      };
    },
  },
  {
    key: "diff", d: 2, secs: 45,
    fast: "For 2 years, CI − SI = P(R/100)².",
    trap: "Using P × R/100: that is one year's interest, not the interest on interest.",
    make: (r) => {
      const p = int(r, 4, 40) * 500, rate = pick(r, [4, 5, 8, 10, 12, 15]);
      const d = (p * rate * rate) / 10000;
      return {
        prompt: `On a sum of ${money(p)} at ${rate}% per annum, what is the difference between compound interest (compounded annually) and simple interest for 2 years? Give 2 decimals if needed.`,
        answer: r2(d), tol: 0.01,
        explain: `CI − SI = ${p} × (${rate}/100)² = ${fmt(d)}.`,
        py: `p, rate = ${p}, ${rate}\namt = float(p)\nfor _ in range(2):\n    amt += amt * rate / 100\nci = amt - p\nsi = p * rate * 2 / 100\nanswer = ci - si`,
      };
    },
  },
  {
    key: "times", d: 2, secs: 45,
    fast: "At SI, growing to k times means (k − 1) × P of interest, so it takes (k − 1) × the doubling time.",
    trap: "Doubling the doubling time for tripling, as if interest compounded.",
    make: (r) => {
      const n = pick(r, [4, 5, 8, 10, 16, 20, 25]), k = pick(r, [3, 4, 5]);
      return {
        prompt: `A sum of money doubles itself in ${n} years at simple interest. In how many years will it become ${k} times itself at the same rate?`,
        answer: (k - 1) * n, tol: 0,
        explain: `Doubling means interest = P in ${n} years. ${k} times needs interest = ${k - 1}P, so ${k - 1} × ${n} = ${(k - 1) * n} years.`,
        py: `from fractions import Fraction\nrate = Fraction(100, ${n})\np = Fraction(1)\nyears, amt = 0, p\nwhile amt < ${k} * p:\n    years += 1\n    amt += p * rate / 100\nanswer = years`,
      };
    },
  },
];

// ───────────────────────── Ratio, proportion, partnership ─────────────────────────
const RATIO: Tpl[] = [
  {
    key: "split", d: 1, secs: 30,
    fast: "One part = total ÷ sum of ratio terms.",
    trap: "Dividing the total by the share's own term only.",
    make: (r) => {
      const a = int(r, 1, 9), b = int(r, 1, 9), c = int(r, 1, 9);
      if (new Set([a, b, c]).size < 3 || gcd(gcd(a, b), c) !== 1) return null;
      const k = int(r, 5, 50) * 10, n = k * (a + b + c);
      return {
        prompt: `${money(n)} is divided among X, Y and Z in the ratio ${a} : ${b} : ${c}. How much, in rupees, does Y get?`,
        answer: k * b, tol: 0,
        explain: `Total parts = ${a + b + c}; one part = ${n} / ${a + b + c} = ${k}. Y gets ${b} × ${k} = ${k * b}.`,
        py: `n, a, b, c = ${n}, ${a}, ${b}, ${c}\nanswer = n * b / (a + b + c)`,
      };
    },
  },
  {
    key: "partner", d: 2, secs: 90,
    fast: "Profit shares are in the ratio of capital × months.",
    trap: "Splitting by capital alone and ignoring how long each partner's money was in.",
    make: (r) => {
      const x = int(r, 2, 18) * 5000, y = int(r, 2, 18) * 5000, j = pick(r, [2, 3, 4, 6, 8]);
      let ua = x * 12, ub = y * (12 - j);
      const g = gcd(ua, ub);
      ua /= g; ub /= g;
      if (ua + ub > 60) return null;
      const k = int(r, 20, 400) * 50, p = k * (ua + ub);
      return {
        prompt: `A starts a business with ${money(x)}. After ${j} months, B joins with ${money(y)}. At the end of the year the profit is ${money(p)}. What is B's share in rupees?`,
        answer: k * ub, tol: 0,
        explain: `A : B = ${x} × 12 : ${y} × ${12 - j} = ${ua} : ${ub}. B's share = ${p} × ${ub}/${ua + ub} = ${k * ub}.`,
        py: `from fractions import Fraction\na_cap = sum(${x} for month in range(12))\nb_cap = sum(${y} for month in range(12) if month >= ${j})\nanswer = Fraction(${p}) * b_cap / (a_cap + b_cap)\nanswer = float(answer)`,
      };
    },
  },
  {
    key: "ages", d: 2, secs: 75,
    fast: "Write the ages as ak and bk, set (ak + t)/(bk + t) equal to the later ratio, and solve for k.",
    trap: "Adding t to the ratio terms themselves instead of to the ages.",
    make: (r) => {
      const a = int(r, 2, 7), b = int(r, 1, a - 1);
      if (gcd(a, b) !== 1) return null;
      const k = int(r, 3, 12), t = pick(r, [4, 5, 6, 8, 10]);
      const A = a * k, B = b * k;
      if (A > 60 || B < 4) return null;
      const g = gcd(A + t, B + t), c = (A + t) / g, d = (B + t) / g;
      if (c > 15 || d > 15) return null;
      return {
        prompt: `The ages of a father and his son are in the ratio ${a} : ${b}. After ${t} years, the ratio will be ${c} : ${d}. What is the father's present age in years?`,
        answer: A, tol: 0,
        explain: `Ages ${a}k and ${b}k: (${a}k + ${t}) / (${b}k + ${t}) = ${c}/${d} gives k = ${k}, so the father is ${A}.`,
        py: `sols = [f for f in range(1, 121) for s in range(1, 121) if f * ${b} == s * ${a} and (f + ${t}) * ${d} == (s + ${t}) * ${c}]\nassert len(sols) == 1\nanswer = sols[0]`,
      };
    },
  },
  {
    key: "fourth", d: 1, secs: 30,
    fast: "a : b = c : x gives x = bc / a.",
    trap: "Computing ac / b: mixing up the order of the terms.",
    make: (r) => {
      const a = int(r, 2, 30), b = int(r, 2, 60), c = int(r, 2, 60);
      const x = (b * c) / a;
      if (!isInt(x) || a === b || b === c) return null;
      return {
        prompt: `Find the fourth proportional to ${a}, ${b} and ${c}.`,
        answer: x, tol: 0,
        explain: `${a} : ${b} = ${c} : x, so x = ${b} × ${c} / ${a} = ${x}.`,
        py: `answer = next(x for x in range(1, 10**5) if x * ${a} == ${b} * ${c})`,
      };
    },
  },
];

// ───────────────────────── Mixtures and alligation ─────────────────────────
const MIX: Tpl[] = [
  {
    key: "allig", d: 2, secs: 60,
    fast: "Alligation: cheaper : dearer = (dearer − mean) : (mean − cheaper).",
    trap: "Writing the differences the wrong way round, which flips the ratio.",
    make: (r) => {
      const p1 = int(r, 20, 60), p2 = p1 + int(r, 10, 40), m = int(r, p1 + 2, p2 - 2);
      const q = (p2 - m) / (m - p1);
      if (!is2dp(r2(q)) || Math.abs(q - r2(q)) > 0.004) return null;
      return {
        prompt: `Rice at ₹${p1}/kg is mixed with rice at ₹${p2}/kg so that the mixture is worth ₹${m}/kg. How many kg of the cheaper rice are used per kg of the dearer rice?${D2}`,
        answer: r2(q), tol: 0.02,
        explain: `Cheaper : dearer = (${p2} − ${m}) : (${m} − ${p1}) = ${p2 - m} : ${m - p1}, so ${r2(q)} kg per kg.`,
        py: `from fractions import Fraction\n# cost of q kg cheaper + 1 kg dearer equals mean price × (q + 1)\n# ${p1}q + ${p2} = ${m}(q + 1)  ->  solve for q\nq = Fraction(${p2} - ${m}, ${m} - ${p1})\nassert ${p1} * q + ${p2} == ${m} * (q + 1)\nanswer = float(q)`,
      };
    },
  },
  {
    key: "addwater", d: 2, secs: 75,
    fast: "The milk does not change: new water = milk × d / c, so water to add = that − old water.",
    trap: "Scaling the whole mixture to the new ratio, which changes the amount of milk.",
    make: (r) => {
      const a = int(r, 2, 9), b = int(r, 1, a - 1);
      if (gcd(a, b) !== 1) return null;
      const v = (a + b) * int(r, 2, 12), milk = (v * a) / (a + b), water = v - milk;
      const w = int(r, 1, 20);
      const g = gcd(milk, water + w), c = milk / g, d = (water + w) / g;
      if (c > 12 || d > 12) return null;
      return {
        prompt: `A ${v}-litre mixture has milk and water in the ratio ${a} : ${b}. How many litres of water must be added to make the ratio ${c} : ${d}?`,
        answer: w, tol: 0,
        explain: `Milk = ${milk} L, water = ${water} L. For ${c} : ${d}, water must be ${milk} × ${d}/${c} = ${water + w} L, so add ${w} L.`,
        py: `from fractions import Fraction\nmilk, water = Fraction(${v} * ${a}, ${a + b}), Fraction(${v} * ${b}, ${a + b})\nanswer = next(w for w in range(0, 1000) if milk * ${d} == (water + w) * ${c})`,
      };
    },
  },
  {
    key: "replace", d: 3, secs: 90,
    fast: "Milk left = V × (1 − x/V)^n after n replacements.",
    trap: "Subtracting x litres of milk every time; after the first round, each draw is part water.",
    make: (r) => {
      const v = pick(r, [20, 40, 50, 60, 80, 100]), x = pick(r, [4, 5, 8, 10, 20]), n = pick(r, [2, 3]);
      if (x >= v / 2) return null;
      const left = v * (1 - x / v) ** n;
      return {
        prompt: `A container holds ${v} litres of pure milk. ${x} litres are taken out and replaced with water. This is done ${n} times in all. How many litres of milk are left?${D2}`,
        answer: r2(left), tol: 0.02,
        explain: `${v} × (1 − ${x}/${v})^${n} = ${v} × ${r2(1 - x / v)}^${n} = ${r2(left)} L.`,
        py: `milk, total = ${v}.0, ${v}.0\nfor _ in range(${n}):\n    milk -= ${x} * milk / total\nanswer = milk`,
      };
    },
  },
  {
    key: "conc", d: 1, secs: 45,
    fast: "Add up the pure substance, divide by total volume.",
    trap: "Averaging the two percentages without weighting by volume.",
    make: (r) => {
      const q1 = int(r, 2, 20) * 5, q2 = int(r, 2, 20) * 5, c1 = int(r, 1, 9) * 5, c2 = int(r, 1, 9) * 5;
      if (c1 === c2 || q1 === q2) return null;
      const c = (q1 * c1 + q2 * c2) / (q1 + q2);
      return {
        prompt: `${q1} litres of a ${c1}% acid solution are mixed with ${q2} litres of a ${c2}% acid solution. What is the acid percentage of the mixture?${D2}`,
        answer: r2(c), tol: 0.02,
        explain: `Acid = ${q1} × ${c1}% + ${q2} × ${c2}% = ${(q1 * c1 + q2 * c2) / 100} L in ${q1 + q2} L, so ${r2(c)}%.`,
        py: `acid = ${q1} * ${c1} / 100 + ${q2} * ${c2} / 100\nanswer = acid / (${q1} + ${q2}) * 100`,
      };
    },
  },
];

// ───────────────────────── Averages ─────────────────────────
const AVG: Tpl[] = [
  {
    key: "remove", d: 1, secs: 45,
    fast: "Removed value = old total − new total = nA − (n − 1)B.",
    trap: "Taking the difference of the two averages as the removed number.",
    make: (r) => {
      const n = int(r, 5, 12), A = int(r, 20, 80), B = A + pick(r, [-3, -2, -1, 1, 2, 3]);
      const x = n * A - (n - 1) * B;
      if (x <= 0) return null;
      return {
        prompt: `The average of ${n} numbers is ${A}. When one number is removed, the average of the rest is ${B}. What number was removed?`,
        answer: x, tol: 0,
        explain: `Old total ${n} × ${A} = ${n * A}; new total ${n - 1} × ${B} = ${(n - 1) * B}. Removed = ${x}.`,
        py: `total = ${n} * ${A}\nrest = ${n - 1} * ${B}\nanswer = total - rest`,
      };
    },
  },
  {
    key: "innings", d: 2, secs: 60,
    fast: "Runs needed = old average + rise × (innings after this one).",
    trap: "Adding only the rise to the old average, forgetting it applies to every innings.",
    make: (r) => {
      const n = int(r, 10, 25), A = int(r, 30, 60), k = int(r, 1, 5);
      const need = A + k * (n + 1);
      return {
        prompt: `A batter has an average of ${A} runs after ${n} innings. How many runs must they score in the next innings to raise the average by ${k}?`,
        answer: need, tol: 0,
        explain: `New total must be ${A + k} × ${n + 1} = ${(A + k) * (n + 1)}; current total is ${A * n}. Needed = ${need}.`,
        py: `runs = [${A}] * ${n}\nanswer = next(x for x in range(0, 1000) if (sum(runs) + x) == (${A} + ${k}) * (${n} + 1))`,
      };
    },
  },
  {
    key: "consec", d: 1, secs: 45,
    fast: "Consecutive odd numbers are symmetric about their average: smallest = A − (n − 1), largest = A + (n − 1).",
    trap: "Stepping by 1 instead of 2 for odd numbers.",
    make: (r) => {
      const n = pick(r, [5, 7, 9]), A = int(r, 10, 60) * 2 + 1;
      const lo = A - (n - 1), hi = A + (n - 1);
      return {
        prompt: `The average of ${n} consecutive odd numbers is ${A}. What is the product of the smallest and the largest of them?`,
        answer: lo * hi, tol: 0,
        explain: `They run from ${A} − ${n - 1} = ${lo} to ${A} + ${n - 1} = ${hi}. Product = ${lo * hi}.`,
        py: `nums = next(list(range(s, s + 2 * ${n}, 2)) for s in range(1, 1000, 2) if sum(range(s, s + 2 * ${n}, 2)) == ${n} * ${A})\nanswer = nums[0] * nums[-1]`,
      };
    },
  },
  {
    key: "weighted", d: 2, secs: 45,
    fast: "Combined average = (n1a1 + n2a2)/(n1 + n2); it sits closer to the larger group.",
    trap: "Averaging the two averages.",
    make: (r) => {
      const n1 = int(r, 10, 50), n2 = int(r, 10, 50), a1 = int(r, 40, 90), a2 = int(r, 40, 90);
      if (n1 === n2 || a1 === a2) return null;
      const c = (n1 * a1 + n2 * a2) / (n1 + n2);
      return {
        prompt: `Section A has ${n1} students with an average score of ${a1}; section B has ${n2} students averaging ${a2}. What is the average of all students together?${D2}`,
        answer: r2(c), tol: 0.02,
        explain: `(${n1} × ${a1} + ${n2} × ${a2}) / ${n1 + n2} = ${n1 * a1 + n2 * a2} / ${n1 + n2} = ${r2(c)}.`,
        py: `scores = [${a1}] * ${n1} + [${a2}] * ${n2}\nanswer = sum(scores) / len(scores)`,
      };
    },
  },
];

// ───────────────────────── Time and work, pipes and cisterns ─────────────────────────
const WORK: Tpl[] = [
  {
    key: "together", d: 1, secs: 45,
    fast: "Together = ab / (a + b) days.",
    trap: "Averaging the two times, or adding them.",
    make: (r) => {
      const a = int(r, 4, 30), b = int(r, 4, 30);
      if (a === b) return null;
      const t = (a * b) / (a + b);
      return {
        prompt: `A can finish a job in ${a} days and B in ${b} days. Working together, in how many days will they finish it?${D2}`,
        answer: r2(t), tol: 0.02,
        explain: `Rates 1/${a} + 1/${b} = ${a + b}/${a * b} per day, so ${a * b}/${a + b} = ${r2(t)} days.`,
        py: `from fractions import Fraction\nrate = Fraction(1, ${a}) + Fraction(1, ${b})\nanswer = float(1 / rate)`,
      };
    },
  },
  {
    key: "alone", d: 2, secs: 60,
    fast: "B's rate = together rate − A's rate; B alone = at / (a − t).",
    trap: "Subtracting the days (a − t) instead of the rates.",
    make: (r) => {
      const a = int(r, 6, 60), b = int(r, 6, 120);
      const t = (a * b) / (a + b);
      if (!isInt(t) || a === b) return null;
      return {
        prompt: `A and B together finish a job in ${t} days. A alone takes ${a} days. How many days would B take alone?`,
        answer: b, tol: 0,
        explain: `B's rate = 1/${t} − 1/${a} = 1/${b}, so ${b} days.`,
        py: `from fractions import Fraction\nb_rate = Fraction(1, ${t}) - Fraction(1, ${a})\nanswer = float(1 / b_rate)`,
      };
    },
  },
  {
    key: "pipes", d: 2, secs: 60,
    fast: "Net rate = fill rate − empty rate; time = ab / (b − a).",
    trap: "Adding the outlet's rate as if it also filled the tank.",
    make: (r) => {
      const a = int(r, 2, 15), b = a + int(r, 1, 15);
      const t = (a * b) / (b - a);
      if (t > 200) return null;
      return {
        prompt: `Pipe P fills a tank in ${a} hours. Pipe Q empties the full tank in ${b} hours. If both are opened on an empty tank, how many hours will it take to fill?${D2}`,
        answer: r2(t), tol: 0.02,
        explain: `Net rate = 1/${a} − 1/${b} = ${b - a}/${a * b}, so ${a * b}/${b - a} = ${r2(t)} hours.`,
        py: `from fractions import Fraction\nnet = Fraction(1, ${a}) - Fraction(1, ${b})\nanswer = float(1 / net)`,
      };
    },
  },
  {
    key: "leaves", d: 2, secs: 75,
    fast: "Work left after A's k days is 1 − k/a; B takes b × (1 − k/a).",
    trap: "Subtracting days: b − k.",
    make: (r) => {
      const a = int(r, 8, 30), b = int(r, 8, 30), k = int(r, 2, a - 2);
      const days = b * (1 - k / a);
      return {
        prompt: `A can do a job in ${a} days and B in ${b} days. A works alone for ${k} days and then leaves. How many days does B take to finish the rest?${D2}`,
        answer: r2(days), tol: 0.02,
        explain: `A does ${k}/${a} of the job; ${a - k}/${a} is left. B needs ${b} × ${a - k}/${a} = ${r2(days)} days.`,
        py: `from fractions import Fraction\nleft = 1 - ${k} * Fraction(1, ${a})\nanswer = float(left / Fraction(1, ${b}))`,
      };
    },
  },
];

// ───────────────────────── Speed, distance, time ─────────────────────────
const SDT: Tpl[] = [
  {
    key: "avgspeed", d: 2, secs: 45,
    fast: "Equal distances: average speed = 2uv / (u + v), the harmonic mean.",
    trap: "Taking (u + v)/2: you spend longer at the slower speed.",
    make: (r) => {
      const u = int(r, 3, 15) * 5, v = int(r, 3, 15) * 5;
      if (u === v) return null;
      const s = (2 * u * v) / (u + v);
      return {
        prompt: `A car goes from city A to city B at ${u} km/h and returns at ${v} km/h. What is its average speed for the round trip, in km/h?${D2}`,
        answer: r2(s), tol: 0.02,
        explain: `2 × ${u} × ${v} / (${u} + ${v}) = ${2 * u * v}/${u + v} = ${r2(s)} km/h.`,
        py: `d = 600.0\ntime = d / ${u} + d / ${v}\nanswer = 2 * d / time`,
      };
    },
  },
  {
    key: "pole", d: 1, secs: 40,
    fast: "km/h × 5/18 = m/s; time = length ÷ speed.",
    trap: "Forgetting to convert km/h to m/s.",
    make: (r) => {
      const l = int(r, 10, 50) * 10, v = pick(r, [36, 45, 54, 60, 72, 90, 108]);
      const t = l / ((v * 5) / 18);
      return {
        prompt: `A train ${l} m long runs at ${v} km/h. How many seconds does it take to pass a pole?${D2}`,
        answer: r2(t), tol: 0.02,
        explain: `${v} km/h = ${r2((v * 5) / 18)} m/s. ${l} / ${r2((v * 5) / 18)} = ${r2(t)} s.`,
        py: `speed_ms = ${v} * 1000 / 3600\nanswer = ${l} / speed_ms`,
      };
    },
  },
  {
    key: "trains", d: 2, secs: 60,
    fast: "Distance = sum of the lengths; relative speed = sum (opposite) or difference (same direction).",
    trap: "Using only one train's length, or adding speeds for trains in the same direction.",
    make: (r) => {
      const l1 = int(r, 10, 40) * 10, l2 = int(r, 10, 40) * 10, v1 = int(r, 6, 24) * 5, v2 = int(r, 6, 24) * 5;
      const same = r() < 0.5;
      if (same && v1 === v2) return null;
      const rel = same ? Math.abs(v1 - v2) : v1 + v2;
      const t = (l1 + l2) / ((rel * 5) / 18);
      if (t > 300) return null;
      return {
        prompt: `Two trains ${l1} m and ${l2} m long run on parallel tracks ${same ? "in the same direction" : "towards each other"} at ${v1} km/h and ${v2} km/h. How many seconds do they take to cross each other completely?${D2}`,
        answer: r2(t), tol: 0.02,
        explain: `Relative speed = ${rel} km/h = ${r2((rel * 5) / 18)} m/s. Distance = ${l1 + l2} m. Time = ${r2(t)} s.`,
        py: `v1, v2 = ${v1} * 1000 / 3600, ${v2} * 1000 / 3600\nrel = ${same ? "abs(v1 - v2)" : "v1 + v2"}\nanswer = (${l1} + ${l2}) / rel`,
      };
    },
  },
  {
    key: "boat", d: 2, secs: 60,
    fast: "Stream speed = (downstream speed − upstream speed) / 2.",
    trap: "Dividing the difference by 1 or reporting the boat's speed.",
    make: (r) => {
      const u = int(r, 6, 20), s = int(r, 1, u - 2);
      const down = u + s, up = u - s, D = lcm(down, up) * int(r, 1, 2);
      if (D > 300) return null;
      return {
        prompt: `A boat covers ${D} km downstream in ${D / down} hours and the same distance upstream in ${D / up} hours. What is the speed of the stream in km/h?`,
        answer: s, tol: 0,
        explain: `Downstream ${down} km/h, upstream ${up} km/h. Stream = (${down} − ${up}) / 2 = ${s}.`,
        py: `down, up = ${D} / ${D / down}, ${D} / ${D / up}\nanswer = (down - up) / 2`,
      };
    },
  },
];

// ───────────────────────── Clocks and calendars ─────────────────────────
function weekday(y: number, m: number, d: number) {
  // Sakamoto's method; 0 = Sunday.
  const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
  if (m < 3) y -= 1;
  const w = (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + t[m - 1] + d) % 7;
  return DAYS[(w + 6) % 7]; // map Sunday=0 to index 6
}
const daysIn = (y: number, m: number) => [31, (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
function dayOptions(r: Rng, correct: string) {
  const others = DAYS.filter((d) => d !== correct);
  const chosen: string[] = [];
  while (chosen.length < 3) {
    const o = pick(r, others);
    if (!chosen.includes(o)) chosen.push(o);
  }
  const opts = [correct, ...chosen].sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b));
  return { options: opts, answer: opts.indexOf(correct) };
}
const CLOCK: Tpl[] = [
  {
    key: "angle", d: 1, secs: 45,
    fast: "Angle = |30H − 5.5M|; if over 180°, subtract from 360°.",
    trap: "Leaving the hour hand on the hour: it moves 0.5° every minute.",
    make: (r) => {
      const h = int(r, 1, 12), m = int(r, 1, 59);
      let a = Math.abs(30 * (h % 12) - 5.5 * m);
      if (a > 180) a = 360 - a;
      return {
        prompt: `What is the smaller angle, in degrees, between the hour and minute hands at ${h}:${String(m).padStart(2, "0")}? Give 1 decimal if needed.`,
        answer: a, tol: 0.01,
        explain: `|30 × ${h % 12} − 5.5 × ${m}| = ${Math.abs(30 * (h % 12) - 5.5 * m)}°${Math.abs(30 * (h % 12) - 5.5 * m) > 180 ? `, so the smaller angle is 360 − that = ${a}°` : ""}.`,
        py: `minute_deg = ${m} * 6\nhour_deg = (${h} % 12) * 30 + ${m} * 0.5\nd = abs(minute_deg - hour_deg) % 360\nanswer = min(d, 360 - d)`,
      };
    },
  },
  {
    key: "meet", d: 2, secs: 60,
    fast: "The minute hand gains 5.5° per minute; between H and H + 1 the hands meet 60H/11 minutes past H.",
    trap: "Answering 5H minutes past H, which ignores the hour hand moving on.",
    make: (r) => {
      const h = int(r, 1, 10);
      const m = (60 * h) / 11;
      return {
        prompt: `Between ${h} o'clock and ${h + 1} o'clock, at how many minutes past ${h} do the hour and minute hands coincide?${D2}`,
        answer: r2(m), tol: 0.02,
        explain: `The minute hand must gain ${30 * h}° at 5.5° per minute: ${30 * h} / 5.5 = 60 × ${h}/11 = ${r2(m)} minutes.`,
        py: `lo, hi = 0.0, 60.0\nfor _ in range(100):\n    mid = (lo + hi) / 2\n    gap = ${h} * 30 + mid * 0.5 - mid * 6\n    lo, hi = (mid, hi) if gap > 0 else (lo, mid)\nanswer = lo`,
      };
    },
  },
  {
    key: "weekday", d: 2, secs: 90,
    fast: "Count odd days: 100 years = 5, 200 = 3, 300 = 1, 400 = 0; each ordinary year 1, leap year 2; then add the months and the date.",
    trap: "Treating 1900 (or 2100) as a leap year: century years are leap only if divisible by 400.",
    make: (r) => {
      const y = int(r, 1901, 2099), m = int(r, 1, 12), d = int(r, 1, daysIn(y, m));
      const w = weekday(y, m, d);
      return {
        prompt: `What day of the week was (or will be) ${d} ${MONTHS[m - 1]} ${y}?`,
        ...dayOptions(r, w),
        explain: `Count the odd days from a known reference, or use the century codes. ${d} ${MONTHS[m - 1]} ${y} is a ${w}.`,
        py: `import datetime\nnames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]\nday = names[datetime.date(${y}, ${m}, ${d}).weekday()]\nopts = OPTS\nanswer = opts.index(day)`,
      };
    },
  },
  {
    key: "shift", d: 2, secs: 60,
    fast: "Count the odd days between the two dates (days mod 7) and move forward that many weekdays.",
    trap: "Forgetting 29 February when the range crosses one.",
    make: (r) => {
      const y = int(r, 1990, 2030), m = int(r, 1, 12), d = int(r, 1, daysIn(y, m));
      const y2 = y + int(r, 1, 6), m2 = int(r, 1, 12), d2 = int(r, 1, daysIn(y2, m2));
      const w1 = weekday(y, m, d), w2 = weekday(y2, m2, d2);
      return {
        prompt: `${d} ${MONTHS[m - 1]} ${y} was a ${w1}. What day of the week is ${d2} ${MONTHS[m2 - 1]} ${y2}?`,
        ...dayOptions(r, w2),
        explain: `Count the days between the dates, take the remainder on dividing by 7, and move that many days on from ${w1}: ${w2}.`,
        py: `import datetime\nnames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]\ngap = (datetime.date(${y2}, ${m2}, ${d2}) - datetime.date(${y}, ${m}, ${d})).days\nday = names[(names.index("${w1}") + gap) % 7]\nopts = OPTS\nanswer = opts.index(day)`,
      };
    },
  },
];

// ───────────────────────── Divisibility, factors, HCF and LCM ─────────────────────────
const DIV: Tpl[] = [
  {
    key: "hcf", d: 1, secs: 45,
    fast: "HCF(a, b, c) = HCF(HCF(a, b), c); use the Euclidean algorithm on the larger pairs.",
    trap: "Taking the smallest common prime factor instead of the product of all common prime powers.",
    make: (r) => {
      const g = int(r, 6, 48), m = [int(r, 2, 15), int(r, 2, 15), int(r, 2, 15)];
      if (new Set(m).size < 3 || gcd(gcd(m[0], m[1]), m[2]) !== 1) return null;
      const n = m.map((x) => x * g);
      return {
        prompt: `What is the HCF of ${n.join(", ")}?`,
        answer: g, tol: 0,
        explain: `${n.join(", ")} = ${g} × ${m.join(", ")} and ${m.join(", ")} share no common factor, so the HCF is ${g}.`,
        py: `nums = [${n.join(", ")}]\nanswer = max(d for d in range(1, min(nums) + 1) if all(x % d == 0 for x in nums))`,
      };
    },
  },
  {
    key: "lcmr", d: 2, secs: 60,
    fast: "Leaves the same remainder r with every divisor → LCM + r.",
    trap: "Answering the LCM itself, or LCM − r.",
    make: (r) => {
      const a = int(r, 4, 18), b = int(r, 4, 18), c = int(r, 4, 18);
      if (new Set([a, b, c]).size < 3) return null;
      const L = lcm(lcm(a, b), c), rem = int(r, 1, Math.min(a, b, c) - 1);
      if (L > 2000) return null;
      return {
        prompt: `What is the least number greater than ${rem} that leaves a remainder of ${rem} when divided by each of ${a}, ${b} and ${c}?`,
        answer: L + rem, tol: 0,
        explain: `LCM(${a}, ${b}, ${c}) = ${L}. The number is ${L} + ${rem} = ${L + rem}.`,
        py: `answer = next(n for n in range(${rem} + 1, 10**6) if all(n % d == ${rem} for d in (${a}, ${b}, ${c})))`,
      };
    },
  },
  {
    key: "ndiv", d: 2, secs: 60,
    fast: "N = p^a q^b r^c has (a + 1)(b + 1)(c + 1) divisors.",
    trap: "Multiplying the exponents themselves without adding 1.",
    make: (r) => {
      const e = [int(r, 0, 5), int(r, 0, 3), int(r, 0, 2), int(r, 0, 1)];
      const N = 2 ** e[0] * 3 ** e[1] * 5 ** e[2] * 7 ** e[3];
      if (N < 60 || N > 50000 || e.filter((x) => x > 0).length < 2) return null;
      const cnt = e.reduce((a, x) => a * (x + 1), 1);
      const fac = [["2", e[0]], ["3", e[1]], ["5", e[2]], ["7", e[3]]].filter(([, x]) => (x as number) > 0).map(([p, x]) => ((x as number) > 1 ? `${p}^${x}` : p)).join(" × ");
      return {
        prompt: `How many positive divisors does ${N.toLocaleString("en-IN")} have?`,
        answer: cnt, tol: 0,
        explain: `${N} = ${fac}. Divisors = ${e.filter((x) => x > 0).map((x) => `(${x} + 1)`).join(" × ")} = ${cnt}.`,
        py: `answer = sum(1 for d in range(1, ${N} + 1) if ${N} % d == 0)`,
      };
    },
  },
  {
    key: "sameRem", d: 3, secs: 75,
    fast: "The greatest number leaving the same remainder divides every difference: HCF of the pairwise differences.",
    trap: "Taking the HCF of the numbers themselves.",
    make: (r) => {
      const g = int(r, 7, 40), rem = int(r, 1, g - 1);
      const ks = [int(r, 2, 40), int(r, 2, 40), int(r, 2, 40)].sort((a, b) => a - b);
      if (new Set(ks).size < 3) return null;
      const n = ks.map((k) => k * g + rem);
      const h = gcd(gcd(n[1] - n[0], n[2] - n[1]), n[2] - n[0]);
      return {
        prompt: `What is the greatest number that divides ${n.join(", ")} leaving the same remainder in each case?`,
        answer: h, tol: 0,
        explain: `Differences: ${n[1] - n[0]}, ${n[2] - n[1]}, ${n[2] - n[0]}. Their HCF is ${h}.`,
        py: `nums = [${n.join(", ")}]\nanswer = next(d for d in range(max(nums), 0, -1) if len({x % d for x in nums}) == 1)`,
      };
    },
  },
];

// ───────────────────────── Remainders, cyclicity, unit digits ─────────────────────────
const REM: Tpl[] = [
  {
    key: "unit", d: 1, secs: 40,
    fast: "Unit digits repeat with period 4 (or 1 or 2). Use b mod 4, with 0 treated as 4.",
    trap: "Using b mod 4 = 0 as the 0th power, which gives 1 instead of the fourth term of the cycle.",
    make: (r) => {
      const a = int(r, 2, 99), b = int(r, 20, 999);
      if (a % 10 === 0 || a % 10 === 1 || a % 10 === 5 || a % 10 === 6) return null;
      let u = 1;
      for (let i = 0; i < ((b - 1) % 4) + 1; i++) u = (u * (a % 10)) % 10;
      return {
        prompt: `What is the unit digit of ${a}^${b}?`,
        answer: u, tol: 0,
        explain: `Only the last digit ${a % 10} matters. Its powers cycle every 4; ${b} mod 4 = ${b % 4 || 4}, giving ${u}.`,
        py: `answer = pow(${a}, ${b}, 10)`,
      };
    },
  },
  {
    key: "powmod", d: 2, secs: 75,
    fast: "Find a small power of a that is ±1 mod m (Fermat: a^(m−1) ≡ 1 for prime m), then reduce the exponent.",
    trap: "Reducing the base but not the exponent, then multiplying out by hand.",
    make: (r) => {
      const m = pick(r, [7, 9, 11, 13]), a = int(r, 2, 40), b = int(r, 50, 500);
      if (a % m === 0 || gcd(a, m) !== 1) return null;
      let x = 1;
      for (let i = 0; i < b; i++) x = (x * a) % m;
      return {
        prompt: `What is the remainder when ${a}^${b} is divided by ${m}?`,
        answer: x, tol: 0,
        explain: `${a} ≡ ${a % m} (mod ${m}). Its powers repeat; reduce ${b} by the cycle length to get ${x}.`,
        py: `answer = pow(${a}, ${b}, ${m})`,
      };
    },
  },
  {
    key: "prod", d: 1, secs: 45,
    fast: "Replace each factor by its remainder, multiply, reduce again.",
    trap: "Multiplying the full numbers first: slow and error-prone.",
    make: (r) => {
      const m = int(r, 7, 19), a = int(r, 100, 999), b = int(r, 100, 999), c = int(r, 100, 999);
      return {
        prompt: `What is the remainder when ${a} × ${b} × ${c} is divided by ${m}?`,
        answer: (((a % m) * (b % m)) % m * (c % m)) % m, tol: 0,
        explain: `Remainders ${a % m}, ${b % m}, ${c % m}. Their product mod ${m} = ${(((a % m) * (b % m)) % m * (c % m)) % m}.`,
        py: `answer = (${a} * ${b} * ${c}) % ${m}`,
      };
    },
  },
  {
    key: "chain", d: 2, secs: 45,
    fast: "If d2 divides d1, the remainder by d2 is (remainder by d1) mod d2.",
    trap: "Answering the same remainder, or saying it cannot be found.",
    make: (r) => {
      const d1 = pick(r, [24, 36, 48, 56, 60, 72, 84, 96]), divs = Array.from({ length: d1 - 2 }, (_, i) => i + 2).filter((x) => d1 % x === 0 && x < d1 && x > 2);
      const d2 = pick(r, divs), r1 = int(r, d2, d1 - 1);
      return {
        prompt: `A number leaves a remainder of ${r1} when divided by ${d1}. What remainder does it leave when divided by ${d2}?`,
        answer: r1 % d2, tol: 0,
        explain: `The number is ${d1}k + ${r1}. ${d2} divides ${d1}, so the remainder is ${r1} mod ${d2} = ${r1 % d2}.`,
        py: `cands = {n % ${d2} for n in range(0, 10000) if n % ${d1} == ${r1}}\nassert len(cands) == 1\nanswer = cands.pop()`,
      };
    },
  },
];

// ───────────────────────── Factorials and powers ─────────────────────────
const legendre = (n: number, p: number) => {
  let e = 0;
  for (let q = p; q <= n; q *= p) e += Math.floor(n / q);
  return e;
};
const FACT: Tpl[] = [
  {
    key: "zeros", d: 1, secs: 40,
    fast: "Trailing zeros of n! = ⌊n/5⌋ + ⌊n/25⌋ + ⌊n/125⌋ + …",
    trap: "Stopping at ⌊n/5⌋: 25, 50, 75 … each contribute an extra 5.",
    make: (r) => {
      const n = int(r, 30, 999);
      return {
        prompt: `How many zeros are at the end of ${n}! ?`,
        answer: legendre(n, 5), tol: 0,
        explain: `Count factors of 5: ${[5, 25, 125, 625].filter((q) => q <= n).map((q) => `⌊${n}/${q}⌋`).join(" + ")} = ${legendre(n, 5)}.`,
        py: `import math\ns = str(math.factorial(${n}))\nanswer = len(s) - len(s.rstrip("0"))`,
      };
    },
  },
  {
    key: "prime", d: 2, secs: 45,
    fast: "Highest power of prime p in n! = Σ ⌊n/p^k⌋ (Legendre).",
    trap: "Using ⌊n/p⌋ alone.",
    make: (r) => {
      const p = pick(r, [2, 3, 7]), n = int(r, 20, 200);
      return {
        prompt: `What is the highest power of ${p} that divides ${n}! ?`,
        answer: legendre(n, p), tol: 0,
        explain: `${[p, p * p, p ** 3, p ** 4, p ** 5, p ** 6, p ** 7].filter((q) => q <= n).map((q) => `⌊${n}/${q}⌋`).join(" + ")} = ${legendre(n, p)}.`,
        py: `import math\nf, e = math.factorial(${n}), 0\nwhile f % ${p} == 0:\n    f //= ${p}\n    e += 1\nanswer = e`,
      };
    },
  },
  {
    key: "comp", d: 3, secs: 75,
    fast: "Factor the composite into primes; find each prime's power in n! and divide by its exponent; the smallest result wins.",
    trap: "Applying Legendre directly with the composite number as if it were prime.",
    make: (r) => {
      const [c, f] = pick(r, [[12, [[2, 2], [3, 1]]], [18, [[2, 1], [3, 2]]], [15, [[3, 1], [5, 1]]], [20, [[2, 2], [5, 1]]], [24, [[2, 3], [3, 1]]]] as const);
      const n = int(r, 20, 150);
      const parts = f.map(([p, k]) => Math.floor(legendre(n, p) / k));
      const ans = Math.min(...parts);
      return {
        prompt: `What is the highest power of ${c} that divides ${n}! ?`,
        answer: ans, tol: 0,
        explain: `${c} = ${f.map(([p, k]) => (k > 1 ? `${p}^${k}` : `${p}`)).join(" × ")}. ${f.map(([p, k], i) => `${p} appears ${legendre(n, p)} times → ${parts[i]}`).join("; ")}. The minimum is ${ans}.`,
        py: `import math\nf, e = math.factorial(${n}), 0\nwhile f % ${c} == 0:\n    f //= ${c}\n    e += 1\nanswer = e`,
      };
    },
  },
  {
    key: "sumfact", d: 2, secs: 60,
    fast: "From some k on, every k! is divisible by m; only the first few terms matter.",
    trap: "Trying to add all the factorials.",
    make: (r) => {
      const m = pick(r, [5, 6, 7, 8, 9, 12]), n = int(r, 10, 60);
      let s = 0, f = 1;
      for (let k = 1; k <= n; k++) {
        f = (f * k) % m;
        s = (s + f) % m;
      }
      return {
        prompt: `What is the remainder when 1! + 2! + 3! + … + ${n}! is divided by ${m}?`,
        answer: s, tol: 0,
        explain: `Once k! contains every prime factor of ${m} enough times, it is divisible by ${m}; add the earlier terms only. Remainder = ${s}.`,
        py: `import math\nanswer = sum(math.factorial(k) for k in range(1, ${n} + 1)) % ${m}`,
      };
    },
  },
];

// MCQ options are only known after generation; substitute them into the Python check.
function finish(items: GenQ[]): GenQ[] {
  return items.map((q) => (q.options ? { ...q, py: q.py.replace("OPTS", JSON.stringify(q.options)) } : q));
}

export const QUANT_TOPICS = {
  pct: "a2-percentages",
  pld: "a2-profit-loss",
  int: "a2-interest",
  ratio: "a2-ratio-partnership",
  mix: "a2-mixtures",
  avg: "a2-averages",
  work: "a2-time-work",
  sdt: "a2-speed-distance",
  clock: "a2-clocks-calendars",
  div: "a2-divisibility-hcf-lcm",
  rem: "a2-remainders",
  fact: "a2-factorials",
} as const;

export const QUANT_ITEMS: GenQ[] = finish([
  ...build(QUANT_TOPICS.pct, "pct", 1101, PCT),
  ...build(QUANT_TOPICS.pld, "pld", 1102, PLD),
  ...build(QUANT_TOPICS.int, "int", 1103, INT),
  ...build(QUANT_TOPICS.ratio, "ratio", 1104, RATIO),
  ...build(QUANT_TOPICS.mix, "mix", 1105, MIX),
  ...build(QUANT_TOPICS.avg, "avg", 1106, AVG),
  ...build(QUANT_TOPICS.work, "work", 1107, WORK),
  ...build(QUANT_TOPICS.sdt, "sdt", 1108, SDT),
  ...build(QUANT_TOPICS.clock, "clock", 1109, CLOCK),
  ...build(QUANT_TOPICS.div, "div", 1110, DIV),
  ...build(QUANT_TOPICS.rem, "rem", 1111, REM),
  ...build(QUANT_TOPICS.fact, "fact", 1112, FACT),
]);
