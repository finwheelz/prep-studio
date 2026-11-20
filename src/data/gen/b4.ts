/**
 * Batch 4 generator: algebra, geometry and mensuration, and three logical-reasoning concepts.
 * Quant answers are recomputed in Python by a different route (brute force, numeric roots,
 * coordinates instead of formulas). Reasoning items are verified for uniqueness: the Python check
 * enumerates a family of rules, keeps every rule consistent with the question, and requires all of
 * them to give the same answer.
 */
import { build, gcd, int, pick, type GenQ, type Rng, type Tpl } from "./quant";

const r2 = (x: number) => Math.round(x * 100) / 100;
const isInt = (x: number) => Math.abs(x - Math.round(x)) < 1e-9;
const D2 = " Give 2 decimals if needed.";
function shuffle<T>(a: T[], r: Rng): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
function mcq(r: Rng, correct: string, wrong: string[]) {
  const uniq = [...new Set(wrong.filter((w) => w !== correct))].slice(0, 3);
  const options = shuffle([correct, ...uniq], r);
  return { options, answer: options.indexOf(correct) };
}

// ───────────────────────── Linear equations ─────────────────────────
const LIN: Tpl[] = [
  {
    key: "digits", d: 2, secs: 60,
    fast: "Write the number as 10t + u; reversing changes it by 9(u − t).",
    trap: "Writing the number as t + u, or forgetting the factor 9.",
    make: (r) => {
      const t = int(r, 1, 9), u = int(r, 1, 9);
      if (t === u) return null;
      const diff = 9 * (u - t);
      return {
        prompt: `The digits of a two-digit number add up to ${t + u}. Reversing the digits ${diff > 0 ? "increases" : "decreases"} the number by ${Math.abs(diff)}. What is the number?`,
        answer: 10 * t + u, tol: 0,
        explain: `t + u = ${t + u} and 9(u − t) = ${diff}, so u − t = ${u - t}. Hence t = ${t}, u = ${u}: ${10 * t + u}.`,
        py: `answer = next(n for n in range(10, 100) if n // 10 + n % 10 == ${t + u} and (10 * (n % 10) + n // 10) - n == ${diff})`,
      };
    },
  },
  {
    key: "coins", d: 1, secs: 60,
    fast: "Assume all coins are the cheaper kind; each swap to the dearer kind adds the price difference.",
    trap: "Setting up the equations with the coin counts and values swapped.",
    make: (r) => {
      const a = pick(r, [5, 10]), b = pick(r, [1, 2]), x = int(r, 5, 40), y = int(r, 5, 40);
      return {
        prompt: `A purse holds ${x + y} coins, all ₹${a} or ₹${b} coins, worth ₹${a * x + b * y} in total. How many ₹${a} coins are there?`,
        answer: x, tol: 0,
        explain: `If all ${x + y} were ₹${b} coins: ₹${b * (x + y)}. The extra ₹${a * x + b * y - b * (x + y)} comes from ₹${a - b} per ₹${a} coin: ${x}.`,
        py: `answer = next(x for x in range(0, ${x + y} + 1) if ${a} * x + ${b} * (${x + y} - x) == ${a * x + b * y})`,
      };
    },
  },
  {
    key: "ages", d: 2, secs: 75,
    fast: "Two unknowns, two equations: substitute A = S − B into the 'years ago' equation.",
    trap: "Subtracting the years from only one person's age.",
    make: (r) => {
      const B = int(r, 8, 30), m = int(r, 2, 4), k = int(r, 2, Math.min(7, B - 2));
      const A = m * (B - k) + k;
      if (A > 80) return null;
      return {
        prompt: `A mother and her son are ${A + B} years old in total. ${k} years ago the mother was ${m} times as old as her son. How old is the mother now?`,
        answer: A, tol: 0,
        explain: `M + S = ${A + B} and M − ${k} = ${m}(S − ${k}). Substituting gives S = ${B}, M = ${A}.`,
        py: `answer = next(m for m in range(1, ${A + B}) if m - ${k} == ${m} * ((${A + B} - m) - ${k}))`,
      };
    },
  },
  {
    key: "prices", d: 2, secs: 75,
    fast: "Eliminate one variable: multiply the equations so the notebook terms match, then subtract.",
    trap: "Adding the equations, which does not remove either unknown.",
    make: (r) => {
      const p = int(r, 5, 40), n = int(r, 10, 60), a1 = int(r, 1, 5), b1 = int(r, 1, 5), a2 = int(r, 1, 5), b2 = int(r, 1, 5);
      if (a1 * b2 === a2 * b1) return null;
      return {
        prompt: `${a1} pens and ${b1} notebooks cost ₹${a1 * p + b1 * n}; ${a2} pens and ${b2} notebooks cost ₹${a2 * p + b2 * n}. What does one pen cost, in rupees?`,
        answer: p, tol: 0,
        explain: `Solving ${a1}p + ${b1}n = ${a1 * p + b1 * n} and ${a2}p + ${b2}n = ${a2 * p + b2 * n} gives p = ${p}, n = ${n}.`,
        py: `answer = next(p for p in range(1, 500) for n in range(1, 500) if ${a1} * p + ${b1} * n == ${a1 * p + b1 * n} and ${a2} * p + ${b2} * n == ${a2 * p + b2 * n})`,
      };
    },
  },
];

// ───────────────────────── Quadratics ─────────────────────────
// Values are bound to names first: substituted inline, Python reads -1 ** 2 as -(1 ** 2).
const PY_ROOTS = (a: number, b: number, c: number) => `import cmath\na, b, c = (${a}), (${b}), (${c})\nd = cmath.sqrt(b ** 2 - 4 * a * c)\nr1, r2 = (-b + d) / (2 * a), (-b - d) / (2 * a)`;
const QUAD: Tpl[] = [
  {
    key: "sumsq", d: 2, secs: 60,
    fast: "α² + β² = (α + β)² − 2αβ, read straight from the coefficients.",
    trap: "Squaring the sum of the roots and stopping there.",
    make: (r) => {
      const p = int(r, -9, 9), q = int(r, -9, 9);
      if (p === 0 || q === 0) return null;
      const b = -(p + q), c = p * q;
      return {
        prompt: `α and β are the roots of x² ${b < 0 ? "−" : "+"} ${Math.abs(b)}x ${c < 0 ? "−" : "+"} ${Math.abs(c)} = 0. What is α² + β²?`,
        answer: p * p + q * q, tol: 0,
        explain: `α + β = ${p + q}, αβ = ${c}. α² + β² = ${(p + q) ** 2} − 2(${c}) = ${p * p + q * q}.`,
        py: `${PY_ROOTS(1, b, c)}\nanswer = round((r1 ** 2 + r2 ** 2).real, 9)`,
      };
    },
  },
  {
    key: "larger", d: 2, secs: 60,
    fast: "Factorise: look for two numbers with product ac and sum b, or use the formula.",
    trap: "Forgetting to divide by a when the leading coefficient is not 1.",
    make: (r) => {
      const a = pick(r, [1, 2, 3]), p = int(r, -8, 8), q = int(r, -8, 8);
      if (p === q) return null;
      // a(x - p)(x - q/a)?  keep integer coefficients with roots p and q/a
      const b = -(a * p + q), c = p * q;
      const roots = [p, q / a];
      const big = Math.max(...roots);
      if (!isInt(big * 100)) return null;
      const t = (v: number, s: string) => (v === 0 ? "" : ` ${v < 0 ? "−" : "+"} ${Math.abs(v) === 1 && s ? "" : Math.abs(v)}${s}`);
      return {
        prompt: `What is the larger root of ${a === 1 ? "" : a}x²${t(b, "x")}${t(c, "")} = 0?${D2}`,
        answer: r2(big), tol: 0.01,
        explain: `It factorises as (x ${p < 0 ? "+" : "−"} ${Math.abs(p)})(${a === 1 ? "" : a}x ${q < 0 ? "+" : "−"} ${Math.abs(q)}) = 0, so the roots are ${p} and ${r2(q / a)}; the larger is ${r2(big)}.`,
        py: `${PY_ROOTS(a, b, c)}\nanswer = max(r1.real, r2.real)`,
      };
    },
  },
  {
    key: "nroots", d: 1, secs: 30,
    fast: "Discriminant b² − 4ac: positive → 2 real roots, zero → 1, negative → none.",
    trap: "Forgetting the 4 in 4ac.",
    make: (r) => {
      const a = int(r, 1, 4), b = int(r, -10, 10), c = int(r, -8, 8);
      const D = b * b - 4 * a * c;
      return {
        prompt: `How many distinct real roots does ${a}x² ${b < 0 ? "−" : "+"} ${Math.abs(b)}x ${c < 0 ? "−" : "+"} ${Math.abs(c)} = 0 have?`,
        answer: D > 0 ? 2 : D === 0 ? 1 : 0, tol: 0,
        explain: `Discriminant = ${b}² − 4(${a})(${c}) = ${D}, so ${D > 0 ? "two distinct real roots" : D === 0 ? "one repeated real root" : "no real roots"}.`,
        py: `${PY_ROOTS(a, b, c)}\nreal = {round(z.real, 9) for z in (r1, r2) if abs(z.imag) < 1e-9}\nanswer = len(real)`,
      };
    },
  },
  {
    key: "recip", d: 2, secs: 45,
    fast: "1/α + 1/β = (α + β)/(αβ) = −b/c.",
    trap: "Computing 1/(α + β).",
    make: (r) => {
      const p = int(r, 1, 9), q = int(r, 1, 9);
      if (p === q) return null;
      const b = -(p + q), c = p * q;
      return {
        prompt: `α and β are the roots of x² − ${-b}x + ${c} = 0. What is 1/α + 1/β?${D2}`,
        answer: r2((p + q) / (p * q)), tol: 0.02,
        explain: `(α + β)/(αβ) = ${p + q}/${c} = ${r2((p + q) / c)}.`,
        py: `${PY_ROOTS(1, b, c)}\nanswer = (1 / r1 + 1 / r2).real`,
      };
    },
  },
];

// ───────────────────────── Inequalities and modulus ─────────────────────────
const INEQ: Tpl[] = [
  {
    key: "abs", d: 1, secs: 45,
    fast: "|x − a| ≤ b means a − b ≤ x ≤ a + b: 2b + 1 integers (2b − 1 for strict <).",
    trap: "Forgetting the endpoint or the centre when counting.",
    make: (r) => {
      const a = int(r, -10, 10), b = int(r, 2, 15), strict = r() < 0.5;
      return {
        prompt: `How many integers x satisfy |x ${a < 0 ? "+" : "−"} ${Math.abs(a)}| ${strict ? "<" : "≤"} ${b}?`,
        answer: strict ? 2 * b - 1 : 2 * b + 1, tol: 0,
        explain: `${a - b} ${strict ? "<" : "≤"} x ${strict ? "<" : "≤"} ${a + b}: ${strict ? 2 * b - 1 : 2 * b + 1} integers.`,
        py: `answer = sum(1 for x in range(-100, 101) if abs(x - (${a})) ${strict ? "<" : "<="} ${b})`,
      };
    },
  },
  {
    key: "quadineq", d: 2, secs: 60,
    fast: "(x − p)(x − q) < 0 holds strictly between the roots: q − p − 1 integers.",
    trap: "Taking the region outside the roots.",
    make: (r) => {
      const p = int(r, -8, 6), q = p + int(r, 3, 10);
      const b = -(p + q), c = p * q;
      return {
        prompt: `How many integers x satisfy x² ${b < 0 ? "−" : "+"} ${Math.abs(b)}x ${c < 0 ? "−" : "+"} ${Math.abs(c)} < 0?`,
        answer: q - p - 1, tol: 0,
        explain: `It factorises as (x − ${p})(x − ${q}) < 0, true for ${p} < x < ${q}: ${q - p - 1} integers.`,
        py: `answer = sum(1 for x in range(-100, 101) if x * x + (${b}) * x + (${c}) < 0)`,
      };
    },
  },
  {
    key: "abseq", d: 2, secs: 45,
    fast: "|kx − m| = n splits into kx − m = n and kx − m = −n; the solutions sum to 2m/k.",
    trap: "Keeping only the positive case.",
    make: (r) => {
      const k = int(r, 1, 5), m = int(r, -12, 12), n = int(r, 1, 12);
      return {
        prompt: `What is the sum of all solutions of |${k === 1 ? "" : k}x ${m < 0 ? "+" : "−"} ${Math.abs(m)}| = ${n}?${D2}`,
        answer: r2((2 * m) / k), tol: 0.02,
        explain: `x = (${m} + ${n})/${k} or (${m} − ${n})/${k}; the sum is 2 × ${m}/${k} = ${r2((2 * m) / k)}.`,
        py: `from fractions import Fraction\nsols = {Fraction(${m} + s * ${n}, ${k}) for s in (1, -1)}\nassert all(abs(${k} * x - ${m}) == ${n} for x in sols)\nanswer = float(sum(sols))`,
      };
    },
  },
  {
    key: "minabs", d: 3, secs: 60,
    fast: "Σ|x − aᵢ| is smallest at the median of the aᵢ; for two points it equals their distance.",
    trap: "Taking x at the mean instead of the median.",
    make: (r) => {
      const pts = [int(r, -15, 15), int(r, -15, 15), int(r, -15, 15)].sort((a, b) => a - b);
      if (new Set(pts).size < 3) return null;
      const ans = pts[2] - pts[0];
      return {
        prompt: `What is the minimum value of |x ${pts[0] < 0 ? "+" : "−"} ${Math.abs(pts[0])}| + |x ${pts[1] < 0 ? "+" : "−"} ${Math.abs(pts[1])}| + |x ${pts[2] < 0 ? "+" : "−"} ${Math.abs(pts[2])}| over all real x?`,
        answer: ans, tol: 0,
        explain: `The minimum is at the median, x = ${pts[1]}: ${pts[1] - pts[0]} + 0 + ${pts[2] - pts[1]} = ${ans}.`,
        py: `answer = min(sum(abs(x / 2 - p) for p in (${pts.join(", ")})) for x in range(-100, 101))`,
      };
    },
  },
];

// ───────────────────────── Progressions ─────────────────────────
const PROG: Tpl[] = [
  {
    key: "apterm", d: 1, secs: 30,
    fast: "aₙ = a + (n − 1)d.",
    trap: "Using n d instead of (n − 1) d.",
    make: (r) => {
      const a = int(r, -20, 30), d = int(r, -7, 9), n = int(r, 10, 40);
      if (d === 0) return null;
      return {
        prompt: `What is the ${n}th term of the arithmetic progression ${a}, ${a + d}, ${a + 2 * d}, …?`,
        answer: a + (n - 1) * d, tol: 0,
        explain: `a = ${a}, d = ${d}: ${a} + ${n - 1} × ${d} = ${a + (n - 1) * d}.`,
        py: `seq = [${a}]\nwhile len(seq) < ${n}:\n    seq.append(seq[-1] + (${d}))\nanswer = seq[-1]`,
      };
    },
  },
  {
    key: "apsum", d: 1, secs: 45,
    fast: "Sₙ = n/2 × (first + last) = n/2 × (2a + (n − 1)d).",
    trap: "Multiplying the average of the first two terms by n.",
    make: (r) => {
      const a = int(r, -10, 20), d = int(r, 1, 8), n = int(r, 8, 30);
      return {
        prompt: `What is the sum of the first ${n} terms of the arithmetic progression ${a}, ${a + d}, ${a + 2 * d}, …?`,
        answer: (n * (2 * a + (n - 1) * d)) / 2, tol: 0,
        explain: `${n}/2 × (2 × ${a} + ${n - 1} × ${d}) = ${(n * (2 * a + (n - 1) * d)) / 2}.`,
        py: `answer = sum(${a} + i * ${d} for i in range(${n}))`,
      };
    },
  },
  {
    key: "gpsum", d: 2, secs: 45,
    fast: "Sₙ = a(rⁿ − 1)/(r − 1).",
    trap: "Using rⁿ⁻¹ in the sum formula (that is the last term).",
    make: (r) => {
      const a = int(r, 1, 6), q = pick(r, [2, 3]), n = int(r, 4, q === 2 ? 10 : 7);
      return {
        prompt: `What is the sum of the first ${n} terms of the geometric progression ${a}, ${a * q}, ${a * q * q}, …?`,
        answer: (a * (q ** n - 1)) / (q - 1), tol: 0,
        explain: `${a} × (${q}^${n} − 1)/(${q} − 1) = ${(a * (q ** n - 1)) / (q - 1)}.`,
        py: `t, s = ${a}, 0\nfor _ in range(${n}):\n    s += t\n    t *= ${q}\nanswer = s`,
      };
    },
  },
  {
    key: "howmany", d: 3, secs: 75,
    fast: "Solve n/2 × (2a + (n − 1)d) = S for a positive integer n (a quadratic in n).",
    trap: "Taking the negative root of the quadratic in n.",
    make: (r) => {
      const a = int(r, 1, 15), d = int(r, 1, 6), n = int(r, 6, 25);
      const S = (n * (2 * a + (n - 1) * d)) / 2;
      return {
        prompt: `How many terms of the arithmetic progression ${a}, ${a + d}, ${a + 2 * d}, … must be added to get a sum of ${S}?`,
        answer: n, tol: 0,
        explain: `n/2 × (2 × ${a} + (n − 1) × ${d}) = ${S} gives n = ${n}.`,
        py: `s, n = 0, 0\nwhile s < ${S}:\n    s += ${a} + n * ${d}\n    n += 1\nassert s == ${S}\nanswer = n`,
      };
    },
  },
];

// ───────────────────────── Logs, indices, surds ─────────────────────────
const LOGS: Tpl[] = [
  {
    key: "logsum", d: 1, secs: 45,
    fast: "log_b(bᵏ) = k. Rewrite each argument as a power of its base.",
    trap: "Adding the arguments instead of the logs' values.",
    make: (r) => {
      const b1 = pick(r, [2, 3, 5]), k1 = int(r, 2, b1 === 2 ? 9 : 5), b2 = pick(r, [2, 3, 10]), k2 = int(r, 1, b2 === 10 ? 4 : 6);
      return {
        prompt: `What is log${b1 === 10 ? "" : `_${b1}`}(${b1 ** k1}) + log${b2 === 10 ? "₁₀" : `_${b2}`}(${b2 ** k2})?`,
        answer: k1 + k2, tol: 0,
        explain: `${b1 ** k1} = ${b1}^${k1} and ${b2 ** k2} = ${b2}^${k2}: ${k1} + ${k2} = ${k1 + k2}.`,
        py: `def lg(b, x):\n    k = 0\n    while x > 1:\n        assert x % b == 0\n        x //= b\n        k += 1\n    return k\nanswer = lg(${b1}, ${b1 ** k1}) + lg(${b2}, ${b2 ** k2})`,
      };
    },
  },
  {
    key: "expeq", d: 2, secs: 45,
    fast: "Write both sides with the same base and equate the exponents.",
    trap: "Dividing the numbers instead of comparing exponents.",
    make: (r) => {
      const b = pick(r, [2, 3, 5]), m = int(r, 3, b === 2 ? 10 : 6), k = int(r, -3, 4);
      return {
        prompt: `Solve ${b}^(x ${k < 0 ? "−" : "+"} ${Math.abs(k)}) = ${b ** m} for x.`,
        answer: m - k, tol: 0,
        explain: `${b ** m} = ${b}^${m}, so x + ${k} = ${m}: x = ${m - k}.`,
        py: `answer = next(x for x in range(-50, 51) if ${b} ** (x + (${k})) == ${b ** m})`,
      };
    },
  },
  {
    key: "surd", d: 2, secs: 45,
    fast: "(√a + √b)(√a − √b) = a − b: the roots cancel.",
    trap: "Multiplying out and keeping a cross term.",
    make: (r) => {
      const a = int(r, 3, 40), b = int(r, 2, 30);
      if (a === b || Number.isInteger(Math.sqrt(a)) || Number.isInteger(Math.sqrt(b))) return null;
      return {
        prompt: `Simplify (√${a} + √${b})(√${a} − √${b}).`,
        answer: a - b, tol: 0,
        explain: `Difference of squares: ${a} − ${b} = ${a - b}.`,
        py: `import math\nanswer = round((math.sqrt(${a}) + math.sqrt(${b})) * (math.sqrt(${a}) - math.sqrt(${b})), 9)`,
      };
    },
  },
  {
    key: "indices", d: 2, secs: 45,
    fast: "aᵐ × aⁿ ÷ aᵖ = a^(m + n − p).",
    trap: "Multiplying the exponents when multiplying the powers.",
    make: (r) => {
      const a = pick(r, [2, 3, 5, 7]), m = int(r, 2, 9), n = int(r, 2, 9), p = int(r, 1, m + n - 1);
      return {
        prompt: `${a}^${m} × ${a}^${n} ÷ ${a}^${p} = ${a}^k. What is k?`,
        answer: m + n - p, tol: 0,
        explain: `${m} + ${n} − ${p} = ${m + n - p}.`,
        py: `v = ${a} ** ${m} * ${a} ** ${n} // ${a} ** ${p}\nk = 0\nwhile v > 1:\n    v //= ${a}\n    k += 1\nanswer = k`,
      };
    },
  },
];

// ───────────────────────── Triangles ─────────────────────────
const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41]];
const HERON = [[13, 14, 15, 84], [5, 5, 6, 12], [10, 13, 13, 60], [9, 10, 17, 36], [7, 15, 20, 42], [6, 25, 29, 60]];
const TRI: Tpl[] = [
  {
    key: "pyth", d: 1, secs: 30,
    fast: "Know the triples: 3-4-5, 5-12-13, 8-15-17, 7-24-25 and their multiples.",
    trap: "Adding the legs instead of their squares.",
    make: (r) => {
      const [a, b, c] = pick(r, TRIPLES), k = int(r, 1, 4);
      return {
        prompt: `A right-angled triangle has legs ${a * k} cm and ${b * k} cm. How long is the hypotenuse, in cm?`,
        answer: c * k, tol: 0,
        explain: `√(${a * k}² + ${b * k}²) = ${c * k} (the ${a}-${b}-${c} triple × ${k}).`,
        py: `import math\nanswer = round(math.hypot(${a * k}, ${b * k}), 9)`,
      };
    },
  },
  {
    key: "heron", d: 2, secs: 75,
    fast: "Heron: s = (a + b + c)/2, area = √(s(s − a)(s − b)(s − c)).",
    trap: "Using the full perimeter instead of the semi-perimeter.",
    make: (r) => {
      const [a, b, c, A] = pick(r, HERON), k = int(r, 1, 3);
      return {
        prompt: `What is the area of a triangle with sides ${a * k}, ${b * k} and ${c * k} cm, in cm²?`,
        answer: A * k * k, tol: 0,
        explain: `s = ${((a + b + c) * k) / 2}; Heron's formula gives ${A * k * k}.`,
        py: `import math\na, b, c = ${a * k}, ${b * k}, ${c * k}\ncosC = (a * a + b * b - c * c) / (2 * a * b)\nanswer = round(0.5 * a * b * math.sqrt(1 - cosC ** 2), 6)`,
      };
    },
  },
  {
    key: "angles", d: 1, secs: 30,
    fast: "An exterior angle equals the sum of the two opposite interior angles.",
    trap: "Subtracting from 180° instead of using the exterior-angle rule.",
    make: (r) => {
      const A = int(r, 20, 80), ext = int(r, A + 10, 170);
      return {
        prompt: `In triangle ABC, ∠A = ${A}° and the exterior angle at C is ${ext}°. What is ∠B in degrees?`,
        answer: ext - A, tol: 0,
        explain: `Exterior angle at C = ∠A + ∠B, so ∠B = ${ext} − ${A} = ${ext - A}°.`,
        py: `C = 180 - ${ext}\nanswer = 180 - ${A} - C`,
      };
    },
  },
  {
    key: "similar", d: 2, secs: 60,
    fast: "A line parallel to one side cuts off a similar triangle: DE/BC = AD/AB.",
    trap: "Using AD/DB instead of AD/AB.",
    make: (r) => {
      const p = int(r, 2, 12), q = int(r, 2, 12), bc = int(r, 5, 60);
      const de = (bc * p) / (p + q);
      if (!isInt(de)) return null;
      return {
        prompt: `In triangle ABC, D lies on AB and E on AC with DE ∥ BC. AD = ${p} cm, DB = ${q} cm and BC = ${bc} cm. How long is DE, in cm?`,
        answer: de, tol: 0,
        explain: `Triangles ADE and ABC are similar with ratio AD/AB = ${p}/${p + q}: DE = ${bc} × ${p}/${p + q} = ${de}.`,
        py: `from fractions import Fraction\nanswer = float(Fraction(${bc}) * Fraction(${p}, ${p} + ${q}))`,
      };
    },
  },
];

// ───────────────────────── Circles and polygons ─────────────────────────
const CIRC: Tpl[] = [
  {
    key: "interior", d: 1, secs: 30,
    fast: "Exterior angle = 360/n; interior = 180 − exterior.",
    trap: "Using (n − 2) × 180 alone, which is the sum of all interior angles.",
    make: (r) => {
      const n = int(r, 5, 20);
      return {
        prompt: `What is each interior angle of a regular polygon with ${n} sides, in degrees?${D2}`,
        answer: r2(((n - 2) * 180) / n), tol: 0.02,
        explain: `Exterior = 360/${n} = ${r2(360 / n)}°, interior = 180 − that = ${r2(((n - 2) * 180) / n)}°.`,
        py: `answer = 180 - 360 / ${n}`,
      };
    },
  },
  {
    key: "sides", d: 2, secs: 30,
    fast: "n = 360 / (180 − interior angle).",
    trap: "Dividing 360 by the interior angle.",
    make: (r) => {
      const n = pick(r, [5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36]);
      return {
        prompt: `Each interior angle of a regular polygon is ${((n - 2) * 180) / n}°. How many sides does it have?`,
        answer: n, tol: 0,
        explain: `Exterior angle = 180 − ${((n - 2) * 180) / n} = ${360 / n}°; 360/${360 / n} = ${n}.`,
        py: `answer = next(n for n in range(3, 1000) if (n - 2) * 180 == ${((n - 2) * 180) / n} * n)`,
      };
    },
  },
  {
    key: "sector", d: 2, secs: 45,
    fast: "Sector area = (θ/360) × πr².",
    trap: "Using the arc-length formula (θ/360) × 2πr.",
    make: (r) => {
      const rad = int(r, 3, 14), th = pick(r, [30, 45, 60, 72, 90, 120, 135, 150]);
      const coef = (rad * rad * th) / 360;
      return {
        prompt: `A sector of a circle of radius ${rad} cm has an angle of ${th}°. Its area is kπ cm². What is k?${D2}`,
        answer: r2(coef), tol: 0.02,
        explain: `(${th}/360) × ${rad}² = ${r2(coef)}.`,
        py: `import math\narea = ${th} / 360 * math.pi * ${rad} ** 2\nanswer = area / math.pi`,
      };
    },
  },
  {
    key: "tangent", d: 2, secs: 45,
    fast: "The radius is perpendicular to the tangent: tangent² = d² − r².",
    trap: "Adding r² instead of subtracting.",
    make: (r) => {
      const [a, b, c] = pick(r, TRIPLES), k = int(r, 1, 3);
      return {
        prompt: `A point is ${c * k} cm from the centre of a circle of radius ${a * k} cm. How long is a tangent from the point to the circle, in cm?`,
        answer: b * k, tol: 0,
        explain: `√(${c * k}² − ${a * k}²) = ${b * k}.`,
        py: `import math\nanswer = round(math.sqrt(${c * k} ** 2 - ${a * k} ** 2), 9)`,
      };
    },
  },
];

// ───────────────────────── Coordinate geometry ─────────────────────────
const COORD: Tpl[] = [
  {
    key: "dist", d: 1, secs: 30,
    fast: "Distance = √((x₂ − x₁)² + (y₂ − y₁)²); look for a Pythagorean triple.",
    trap: "Adding the differences instead of squaring them.",
    make: (r) => {
      const [a, b, c] = pick(r, TRIPLES), x1 = int(r, -10, 10), y1 = int(r, -10, 10);
      const sx = pick(r, [1, -1]), sy = pick(r, [1, -1]);
      return {
        prompt: `What is the distance between (${x1}, ${y1}) and (${x1 + sx * a}, ${y1 + sy * b})?`,
        answer: c, tol: 0,
        explain: `Differences ${a} and ${b}: √(${a}² + ${b}²) = ${c}.`,
        py: `import math\nanswer = round(math.dist((${x1}, ${y1}), (${x1 + sx * a}, ${y1 + sy * b})), 9)`,
      };
    },
  },
  {
    key: "section", d: 2, secs: 60,
    fast: "Internal division m : n: ((m x₂ + n x₁)/(m + n), (m y₂ + n y₁)/(m + n)).",
    trap: "Pairing m with the first point's coordinates.",
    make: (r) => {
      const m = int(r, 1, 4), n = int(r, 1, 4), x1 = int(r, -10, 10), y1 = int(r, -10, 10), x2 = int(r, -10, 10), y2 = int(r, -10, 10);
      const px = (m * x2 + n * x1) / (m + n), py = (m * y2 + n * y1) / (m + n);
      if (!isInt(px) || !isInt(py) || (x1 === x2 && y1 === y2) || m === n) return null;
      return {
        prompt: `P divides the segment from A(${x1}, ${y1}) to B(${x2}, ${y2}) internally in the ratio ${m} : ${n} (AP : PB). What is the sum of P's coordinates?`,
        answer: px + py, tol: 0,
        explain: `P = ((${m}·${x2} + ${n}·${x1})/${m + n}, (${m}·${y2} + ${n}·${y1})/${m + n}) = (${px}, ${py}); sum ${px + py}.`,
        py: `from fractions import Fraction\nt = Fraction(${m}, ${m + n})\npx = ${x1} + t * (${x2} - ${x1})\npy = ${y1} + t * (${y2} - ${y1})\nanswer = float(px + py)`,
      };
    },
  },
  {
    key: "area", d: 2, secs: 60,
    fast: "Shoelace: ½ |x₁(y₂ − y₃) + x₂(y₃ − y₁) + x₃(y₁ − y₂)|.",
    trap: "Forgetting the ½ or the absolute value.",
    make: (r) => {
      const p = [int(r, -8, 8), int(r, -8, 8), int(r, -8, 8), int(r, -8, 8), int(r, -8, 8), int(r, -8, 8)];
      const A = Math.abs(p[0] * (p[3] - p[5]) + p[2] * (p[5] - p[1]) + p[4] * (p[1] - p[3])) / 2;
      if (A < 3) return null;
      return {
        prompt: `What is the area of the triangle with vertices (${p[0]}, ${p[1]}), (${p[2]}, ${p[3]}) and (${p[4]}, ${p[5]})?${D2}`,
        answer: A, tol: 0.02,
        explain: `Shoelace: ½ × |${p[0]}(${p[3]} − ${p[5]}) + ${p[2]}(${p[5]} − ${p[1]}) + ${p[4]}(${p[1]} − ${p[3]})| = ${A}.`,
        py: `import math\nP = [(${p[0]}, ${p[1]}), (${p[2]}, ${p[3]}), (${p[4]}, ${p[5]})]\na, b, c = math.dist(P[0], P[1]), math.dist(P[1], P[2]), math.dist(P[2], P[0])\ns = (a + b + c) / 2\nanswer = math.sqrt(max(0.0, s * (s - a) * (s - b) * (s - c)))`,
      };
    },
  },
  {
    key: "intersect", d: 2, secs: 60,
    fast: "Set the two right-hand sides equal and solve for x.",
    trap: "Solving for y and reporting it as x.",
    make: (r) => {
      const x = int(r, -9, 9), m1 = int(r, -5, 5), m2 = int(r, -5, 5), c1 = int(r, -10, 10);
      if (m1 === m2) return null;
      const yv = m1 * x + c1, c2 = yv - m2 * x;
      const f = (m: number, c: number) => `y = ${m === 1 ? "" : m === -1 ? "−" : m}x ${c < 0 ? "−" : "+"} ${Math.abs(c)}`;
      if (m1 === 0 || m2 === 0) return null;
      return {
        prompt: `At what x-coordinate do the lines ${f(m1, c1)} and ${f(m2, c2)} intersect?`,
        answer: x, tol: 0,
        explain: `${m1}x + ${c1} = ${m2}x + ${c2} → ${m1 - m2}x = ${c2 - c1} → x = ${x}.`,
        py: `answer = next(x for x in range(-100, 101) if ${m1} * x + (${c1}) == ${m2} * x + (${c2}))`,
      };
    },
  },
];

// ───────────────────────── Mensuration ─────────────────────────
const CUBOIDS = [[1, 4, 8, 9], [2, 3, 6, 7], [2, 6, 9, 11], [4, 4, 7, 9], [1, 2, 2, 3], [6, 6, 7, 11], [2, 10, 11, 15], [4, 8, 8, 12]];
const MENS: Tpl[] = [
  {
    key: "cyl", d: 1, secs: 30,
    fast: "Cylinder volume = πr²h.",
    trap: "Using the diameter as the radius.",
    make: (r) => {
      const rad = int(r, 2, 12), h = int(r, 3, 20), diam = r() < 0.4;
      return {
        prompt: `A cylinder has ${diam ? `diameter ${2 * rad}` : `radius ${rad}`} cm and height ${h} cm. Its volume is kπ cm³. What is k?`,
        answer: rad * rad * h, tol: 0,
        explain: `r = ${rad}: r²h = ${rad * rad} × ${h} = ${rad * rad * h}.`,
        py: `import math\nv = math.pi * (${rad}) ** 2 * ${h}\nanswer = round(v / math.pi, 6)`,
      };
    },
  },
  {
    key: "cone", d: 2, secs: 45,
    fast: "Slant height l = √(r² + h²); curved surface area = πrl.",
    trap: "Using the vertical height h instead of the slant height l.",
    make: (r) => {
      const [a, b, c] = pick(r, TRIPLES.slice(0, 4)), k = int(r, 1, 3);
      return {
        prompt: `A cone has base radius ${a * k} cm and height ${b * k} cm. Its curved surface area is kπ cm². What is k?`,
        answer: a * k * c * k, tol: 0,
        explain: `l = √(${a * k}² + ${b * k}²) = ${c * k}; rl = ${a * k} × ${c * k} = ${a * k * c * k}.`,
        py: `import math\nl = math.hypot(${a * k}, ${b * k})\nanswer = round(math.pi * ${a * k} * l / math.pi, 6)`,
      };
    },
  },
  {
    key: "diag", d: 2, secs: 45,
    fast: "Space diagonal of a cuboid = √(l² + b² + h²).",
    trap: "Using only two of the three dimensions (a face diagonal).",
    make: (r) => {
      const [l, b, h, dd] = pick(r, CUBOIDS), k = int(r, 1, 3);
      return {
        prompt: `What is the length of the longest rod that fits inside a ${l * k} cm × ${b * k} cm × ${h * k} cm box, in cm?`,
        answer: dd * k, tol: 0,
        explain: `√(${l * k}² + ${b * k}² + ${h * k}²) = ${dd * k}.`,
        py: `import math\nanswer = round(math.sqrt(${l * k} ** 2 + ${b * k} ** 2 + ${h * k} ** 2), 9)`,
      };
    },
  },
  {
    key: "scale", d: 3, secs: 60,
    fast: "Volume scales with the cube of the radius: ((1 + x/100)³ − 1) × 100 %.",
    trap: "Assuming the volume rises by the same percentage as the radius.",
    make: (r) => {
      const x = pick(r, [10, 20, 25, 30, 50, 100]);
      const ans = ((1 + x / 100) ** 3 - 1) * 100;
      return {
        prompt: `The radius of a sphere increases by ${x}%. By what percentage does its volume increase?${D2}`,
        answer: r2(ans), tol: 0.02,
        explain: `(1 + ${x / 100})³ = ${r2((1 + x / 100) ** 3)}, an increase of ${r2(ans)}%.`,
        py: `import math\nv = lambda r: 4 / 3 * math.pi * r ** 3\nanswer = (v(100 * (1 + ${x} / 100)) / v(100) - 1) * 100`,
      };
    },
  },
];

// ───────────────────────── Number series (uniqueness-checked) ─────────────────────────
/** Python: every rule family that fits the shown terms must predict the same next term. */
const PY_SERIES = `from fractions import Fraction as F
def preds(s):
    out = set()
    # polynomial of degree <= 3 (finite differences), needs at least degree + 3 terms to be a real constraint
    for deg in range(0, 4):
        if len(s) < deg + 3:
            break
        rows = [list(s)]
        for _ in range(deg):
            rows.append([b - a for a, b in zip(rows[-1], rows[-1][1:])])
        if len(set(rows[-1])) == 1:
            nxt = rows[-1][-1]
            for row in reversed(rows[:-1]):
                nxt = row[-1] + nxt
            out.add(F(nxt))
    # linear recurrence x[n+1] = p*x[n] + q (p, q rational), fitted from the first three terms
    a, b, c = (F(v) for v in s[:3])
    if b != a:
        p = (c - b) / (b - a); q = b - p * a
        if all(F(s[i + 1]) == p * s[i] + q for i in range(len(s) - 1)):
            out.add(p * s[-1] + q)
    # x[n+1] = x[n] + x[n-1] (Fibonacci-like)
    if all(s[i + 2] == s[i + 1] + s[i] for i in range(len(s) - 2)):
        out.add(F(s[-1] + s[-2]))
    # x[n+1] = x[n] * k + j * (n+1)? skipped; two interleaved arithmetic sequences
    ev, od = s[0::2], s[1::2]
    if len(ev) >= 3 and len(od) >= 3 and len({b - a for a, b in zip(ev, ev[1:])}) == 1 and len({b - a for a, b in zip(od, od[1:])}) == 1:
        nxt = (ev[-1] + (ev[1] - ev[0])) if len(s) % 2 == 0 else (od[-1] + (od[1] - od[0]))
        out.add(F(nxt))
    # x[n+1] = x[n] * m + k*n style: x[n+1] - x[n] grows geometrically
    d = [b - a for a, b in zip(s, s[1:])]
    if len(d) >= 3 and d[0] != 0 and all(d[i] != 0 for i in range(len(d))):
        ratios = {F(d[i + 1], d[i]) for i in range(len(d) - 1)}
        if len(ratios) == 1:
            out.add(F(s[-1]) + F(d[-1]) * ratios.pop())
    return out
`;
const SERIES: Tpl[] = [
  {
    key: "quad", d: 2, secs: 60,
    fast: "Take differences; if the second differences are constant, extend them.",
    trap: "Stopping at the first differences and assuming they are constant.",
    make: (r) => {
      const a = int(r, 1, 3), b = int(r, -4, 5), c = int(r, -5, 10);
      const s = Array.from({ length: 6 }, (_, i) => a * (i + 1) ** 2 + b * (i + 1) + c);
      const nxt = a * 49 + b * 7 + c;
      return {
        prompt: `What comes next: ${s.join(", ")}, ?`,
        answer: nxt, tol: 0,
        explain: `Differences ${s.slice(1).map((v, i) => v - s[i]).join(", ")} rise by ${2 * a} each time; the next difference is ${nxt - s[5]}, so ${nxt}.`,
        py: `${PY_SERIES}\nps = preds([${s.join(", ")}])\nassert len(ps) == 1, ps\nanswer = float(ps.pop())`,
      };
    },
  },
  {
    key: "rec", d: 2, secs: 60,
    fast: "Look for 'multiply by p, then add q': check the ratio of consecutive terms first.",
    trap: "Treating it as a pure geometric series and ignoring the added constant.",
    make: (r) => {
      const p = pick(r, [2, 3]), q = pick(r, [-2, -1, 1, 2, 3]), x0 = int(r, 1, 5);
      const s = [x0];
      while (s.length < 6) s.push(p * s[s.length - 1] + q);
      const nxt = p * s[5] + q;
      return {
        prompt: `What comes next: ${s.join(", ")}, ?`,
        answer: nxt, tol: 0,
        explain: `Each term is ${p} × the previous ${q < 0 ? "−" : "+"} ${Math.abs(q)}: ${p} × ${s[5]} ${q < 0 ? "−" : "+"} ${Math.abs(q)} = ${nxt}.`,
        py: `${PY_SERIES}\nps = preds([${s.join(", ")}])\nassert len(ps) == 1, ps\nanswer = float(ps.pop())`,
      };
    },
  },
  {
    key: "alt", d: 2, secs: 60,
    fast: "If the series zig-zags, split it into odd and even positions.",
    trap: "Looking for one rule across all the terms.",
    make: (r) => {
      const a = int(r, 1, 20), d1 = int(r, 2, 7), b = int(r, 20, 60), d2 = -int(r, 2, 6);
      const s: number[] = [];
      for (let i = 0; i < 7; i++) s.push(i % 2 === 0 ? a + (i / 2) * d1 : b + ((i - 1) / 2) * d2);
      const nxt = b + 3 * d2;
      return {
        prompt: `What comes next: ${s.join(", ")}, ?`,
        answer: nxt, tol: 0,
        explain: `Two interleaved series: ${a}, ${a + d1}, … (+${d1}) and ${b}, ${b + d2}, … (${d2}). The next term belongs to the second: ${nxt}.`,
        py: `${PY_SERIES}\nps = preds([${s.join(", ")}])\nassert len(ps) == 1, ps\nanswer = float(ps.pop())`,
      };
    },
  },
  {
    key: "geodiff", d: 3, secs: 75,
    fast: "If the differences themselves form a geometric series, extend the differences.",
    trap: "Guessing a square or cube pattern from the first few terms.",
    make: (r) => {
      const x0 = int(r, 1, 10), d0 = int(r, 1, 4), m = pick(r, [2, 3]);
      const s = [x0];
      let d = d0;
      while (s.length < 6) { s.push(s[s.length - 1] + d); d *= m; }
      const nxt = s[5] + d;
      return {
        prompt: `What comes next: ${s.join(", ")}, ?`,
        answer: nxt, tol: 0,
        explain: `Differences ${s.slice(1).map((v, i) => v - s[i]).join(", ")} are multiplied by ${m} each time; the next is ${d}: ${nxt}.`,
        py: `${PY_SERIES}\nps = preds([${s.join(", ")}])\nassert len(ps) == 1, ps\nanswer = float(ps.pop())`,
      };
    },
  },
];

// ───────────────────────── Coding–decoding (uniqueness-checked MCQ) ─────────────────────────
const WORDS = ["PLANET", "GARDEN", "MOBILE", "SILVER", "CAMERA", "BRIDGE", "FOREST", "TICKET", "WINTER", "MARKET", "POCKET", "SUMMER", "ORANGE", "DANGER", "FLOWER", "STREAM"];
const sh = (w: string, k: number) => [...w].map((c) => String.fromCharCode(65 + ((c.charCodeAt(0) - 65 + k + 26 * 4) % 26))).join("");
const rev = (w: string) => [...w].reverse().join("");
const atb = (w: string) => [...w].map((c) => String.fromCharCode(155 - c.charCodeAt(0))).join("");
const PY_CODES = `def sh(w, k): return "".join(chr(65 + (ord(c) - 65 + k) % 26) for c in w)
def atb(w): return "".join(chr(155 - ord(c)) for c in w)
RULES = [(f"shift{k}", lambda w, k=k: sh(w, k)) for k in range(-25, 26)]
RULES += [(f"rev-shift{k}", lambda w, k=k: sh(w[::-1], k)) for k in range(-25, 26)]
RULES += [("atbash", atb), ("rev-atbash", lambda w: atb(w[::-1]))]
RULES += [(f"alt{a},{b}", lambda w, a=a, b=b: "".join(sh(c, a if i % 2 == 0 else b) for i, c in enumerate(w))) for a in range(-4, 5) for b in range(-4, 5)]
def predict(example, coded, target):
    fits = {f(target) for name, f in RULES if f(example) == coded}
    assert len(fits) == 1, fits
    return fits.pop()
`;
function codeItem(r: Rng, rule: (w: string) => string, wrongRules: ((w: string) => string)[], name: string) {
  const [ex, tg] = shuffle(WORDS, r).slice(0, 2);
  const correct = rule(tg);
  const opts = mcq(r, correct, wrongRules.map((f) => f(tg)));
  if (opts.options.length < 4) return null;
  return {
    prompt: `In a certain code, ${ex} is written as ${rule(ex)}. How is ${tg} written in that code?`,
    ...opts,
    explain: `Rule: ${name}. Applying it to ${tg} gives ${correct}.`,
    py: `${PY_CODES}\nopts = OPTS\nanswer = opts.index(predict("${ex}", "${rule(ex)}", "${tg}"))`,
  };
}
const CODE: Tpl[] = [
  {
    key: "shift", d: 1, secs: 45,
    fast: "Compare the first letter of the word and its code to find the shift; check one more letter.",
    trap: "Shifting in the wrong direction.",
    make: (r) => {
      const k = pick(r, [-3, -2, -1, 1, 2, 3, 4]);
      return codeItem(r, (w) => sh(w, k), [(w) => sh(w, -k), (w) => sh(w, k + 1), (w) => sh(rev(w), k), (w) => sh(w, k - 1)], `each letter moves ${Math.abs(k)} place${Math.abs(k) > 1 ? "s" : ""} ${k > 0 ? "forward" : "back"} in the alphabet`);
    },
  },
  {
    key: "revshift", d: 2, secs: 60,
    fast: "If the code's last letter matches the word's first letter (after a shift), the word was reversed.",
    trap: "Shifting without reversing.",
    make: (r) => {
      const k = pick(r, [-2, -1, 0, 1, 2]);
      return codeItem(r, (w) => sh(rev(w), k), [(w) => sh(w, k), (w) => sh(rev(w), k + 1), (w) => sh(rev(w), -k - 1), (w) => rev(sh(w, k + 2))], k === 0 ? "the letters are written in reverse order" : `reverse the word, then move each letter ${Math.abs(k)} place${Math.abs(k) > 1 ? "s" : ""} ${k > 0 ? "forward" : "back"}`);
    },
  },
  {
    key: "atbash", d: 2, secs: 60,
    fast: "Opposite letters: A↔Z, B↔Y, … each pair adds up to 27 in position.",
    trap: "Treating it as a fixed shift.",
    make: (r) => codeItem(r, atb, [(w) => sh(w, 1), (w) => rev(atb(w)), (w) => sh(atb(w), 1), (w) => sh(atb(w), -1)], "each letter is replaced by its opposite (A↔Z, B↔Y, C↔X, …)"),
  },
  {
    key: "sum", d: 1, secs: 45,
    fast: "Letter positions: A = 1 … Z = 26. Check whether the code is the sum, the reversed sum (27 − p) or another variant.",
    trap: "Using A = 0.",
    make: (r) => {
      const short = ["CAT", "DOG", "BAT", "SUN", "PEN", "CUP", "BOX", "HAT", "MAP", "KEY", "RAT", "JAM"];
      const [ex, tg] = shuffle(short, r).slice(0, 2);
      const variant = pick(r, ["sum", "rev"] as const);
      const pos = (w: string) => [...w].map((c) => c.charCodeAt(0) - 64);
      const RULES = [
        (w: string) => pos(w).reduce((s, p) => s + p, 0),
        (w: string) => pos(w).reduce((s, p) => s + 27 - p, 0),
        (w: string) => pos(w).reduce((s, p) => s + p, 0) * w.length,
        (w: string) => pos(w).reduce((s, p) => s + p, 0) + w.length,
        (w: string) => pos(w).reduce((s, p) => s + p - 1, 0),
      ];
      const val = RULES[variant === "sum" ? 0 : 1];
      // Every rule that explains the example must give the same code for the target (mirrors the Python check).
      if (new Set(RULES.filter((f) => f(ex) === val(ex)).map((f) => f(tg))).size !== 1) return null;
      return {
        prompt: `If ${ex} is coded as ${val(ex)}, what is ${tg} coded as?`,
        answer: val(tg), tol: 0,
        explain: variant === "sum" ? `The code is the sum of letter positions (A = 1 … Z = 26): ${tg} → ${val(tg)}.` : `The code is the sum of reverse positions (A = 26 … Z = 1): ${tg} → ${val(tg)}.`,
        py: `rules = [lambda w: sum(ord(c) - 64 for c in w), lambda w: sum(27 - (ord(c) - 64) for c in w), lambda w: sum(ord(c) - 64 for c in w) * len(w), lambda w: sum(ord(c) - 64 for c in w) + len(w), lambda w: sum(ord(c) - 65 for c in w)]\nfits = {f("${tg}") for f in rules if f("${ex}") == ${val(ex)}}\nassert len(fits) == 1, fits\nanswer = fits.pop()`,
      };
    },
  },
];

// ───────────────────────── Analogy and odd one out ─────────────────────────
const FN: [string, (n: number) => number, string][] = [
  ["n²", (n) => n * n, "n * n"], ["n² + 1", (n) => n * n + 1, "n * n + 1"], ["n² − 1", (n) => n * n - 1, "n * n - 1"], ["n³", (n) => n ** 3, "n ** 3"],
  ["n³ + 1", (n) => n ** 3 + 1, "n ** 3 + 1"], ["n(n + 1)", (n) => n * (n + 1), "n * (n + 1)"], ["2n + 3", (n) => 2 * n + 3, "2 * n + 3"], ["3n − 1", (n) => 3 * n - 1, "3 * n - 1"],
];
const PY_FAMILY = `FAM = [${FN.map(([, , py]) => `lambda n: ${py}`).join(", ")}, lambda n: n * n + n, lambda n: 2 * n * n, lambda n: n * n + 2 * n, lambda n: n ** 3 - n, lambda n: 4 * n - 2]`;
const PROPS = `import math
def is_prime(n): return n > 1 and all(n % d for d in range(2, int(n ** 0.5) + 1))
PROPS = {
    "prime": is_prime,
    "square": lambda n: math.isqrt(n) ** 2 == n,
    "cube": lambda n: round(n ** (1 / 3)) ** 3 == n,
    "mult7": lambda n: n % 7 == 0,
    "mult11": lambda n: n % 11 == 0,
    "even": lambda n: n % 2 == 0,
    "digitsum9": lambda n: sum(map(int, str(n))) % 9 == 0,
}`;
const isPrime = (n: number) => n > 1 && Array.from({ length: Math.floor(Math.sqrt(n)) - 1 }, (_, i) => i + 2).every((d) => n % d !== 0);
const PROP_TS: Record<string, [string, (n: number) => boolean, (r: Rng) => number]> = {
  prime: ["prime", isPrime, (r) => pick(r, [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97])],
  square: ["a perfect square", (n) => Math.round(Math.sqrt(n)) ** 2 === n, (r) => int(r, 4, 15) ** 2],
  cube: ["a perfect cube", (n) => Math.round(Math.cbrt(n)) ** 3 === n, (r) => int(r, 2, 9) ** 3],
  mult7: ["a multiple of 7", (n) => n % 7 === 0, (r) => 7 * int(r, 3, 20)],
  mult11: ["a multiple of 11", (n) => n % 11 === 0, (r) => 11 * int(r, 2, 12)],
};
const ODD: Tpl[] = [
  {
    key: "numanalogy", d: 2, secs: 60,
    fast: "Test the simplest relations first: square, cube, ±1, n(n + 1), linear.",
    trap: "Fitting a rule to one pair only.",
    make: (r) => {
      const [name, f, py] = pick(r, FN);
      const [a, b, c] = shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 11], r).slice(0, 3);
      return {
        prompt: `Find the missing number: ${a} : ${f(a)} :: ${b} : ${f(b)} :: ${c} : ?`,
        answer: f(c), tol: 0,
        explain: `Each pair is n : ${name}. For ${c}: ${f(c)}.`,
        py: `${PY_FAMILY}\nfits = {g(${c}) for g in FAM if g(${a}) == ${f(a)} and g(${b}) == ${f(b)}}\nassert len(fits) == 1, fits\nassert (lambda n: ${py})(${c}) in fits\nanswer = fits.pop()`,
      };
    },
  },
  {
    key: "letteranalogy", d: 1, secs: 45,
    fast: "Work out the step from each letter of the first group to the matching letter of the second.",
    trap: "Applying the step to the whole group as one block.",
    make: (r) => {
      const start = int(r, 0, 14), step = pick(r, [1, 2, 3]), k = pick(r, [-2, -1, 1, 2, 3]);
      const grp = (s: number) => [0, 1, 2].map((i) => String.fromCharCode(65 + s + i * step)).join("");
      const a = grp(start), b = sh(a, k), c = grp(start + int(r, 3, 8)), ans = sh(c, k);
      if ([...c].some((ch) => ch > "Z")) return null;
      const opts = mcq(r, ans, [sh(c, -k), sh(c, k + 1), rev(ans), sh(c, k - 1)]);
      return {
        prompt: `${a} : ${b} :: ${c} : ?`,
        ...opts,
        explain: `Each letter of ${a} moves ${Math.abs(k)} ${k > 0 ? "forward" : "back"} to give ${b}. Doing the same to ${c} gives ${ans}.`,
        py: `${PY_CODES}\nopts = OPTS\nanswer = opts.index(predict("${a}", "${b}", "${c}"))`,
      };
    },
  },
  {
    key: "oddnum", d: 2, secs: 45,
    fast: "Check common properties in order: prime, square, cube, multiples of 7 or 11.",
    trap: "Picking a number that is odd by a weaker or coincidental property.",
    make: (r) => {
      const keys = Object.keys(PROP_TS);
      const key = pick(r, keys);
      const [desc, test, gen] = PROP_TS[key];
      const good = new Set<number>();
      let guard = 0;
      while (good.size < 4 && guard++ < 100) good.add(gen(r));
      let odd = int(r, 10, 99);
      guard = 0;
      while ((test(odd) || good.has(odd)) && guard++ < 100) odd = int(r, 10, 200);
      if (good.size < 4 || test(odd)) return null;
      const nums = [...good, odd];
      // Mirror the Python check: no other property may single out a number.
      const extra: [string, (n: number) => boolean, boolean][] = [
        ["even", (n) => n % 2 === 0, false],
        ["digitsum9", (n) => [...String(n)].reduce((s, d) => s + +d, 0) % 9 === 0, true],
      ];
      const others: [string, (n: number) => boolean, boolean][] = [...keys.filter((k) => k !== key).map((k) => [k, PROP_TS[k][1], true] as [string, (n: number) => boolean, boolean]), ...extra];
      const singled = new Set<number>([odd]);
      for (const [, test2, singleFitCounts] of others) {
        const out = nums.filter((n) => !test2(n));
        if (out.length === 1) singled.add(out[0]);
        const inn = nums.filter((n) => test2(n));
        if (singleFitCounts && inn.length === 1) singled.add(inn[0]);
      }
      if (singled.size !== 1) return null; // another rule would point at a different number
      const options = shuffle(nums.map(String), r);
      return {
        prompt: `Which number does not belong with the others: ${options.join(", ")}?`,
        options, answer: options.indexOf(String(odd)),
        explain: `All the others are ${desc}; ${odd} is not.`,
        py: `${PROPS}\nopts = [int(o) for o in OPTS]\nodd = set()\nfor name, p in PROPS.items():\n    out = [n for n in opts if not p(n)]\n    if len(out) == 1:\n        odd.add(out[0])\n    inn = [n for n in opts if p(n)]\n    if len(inn) == 1 and name not in ("even",):\n        odd.add(inn[0])\nassert len(odd) == 1, odd\nanswer = opts.index(odd.pop())`,
      };
    },
  },
  {
    key: "oddgroup", d: 2, secs: 45,
    fast: "Find the gap between consecutive letters in each group; one group breaks the pattern.",
    trap: "Comparing only the first letters of each group.",
    make: (r) => {
      const step = pick(r, [1, 2, 3]);
      const groups: string[] = [];
      const used = new Set<number>();
      while (groups.length < 4) {
        const s = int(r, 0, 25 - 2 * step);
        if (used.has(s)) continue;
        used.add(s);
        groups.push([0, 1, 2].map((i) => String.fromCharCode(65 + s + i * step)).join(""));
      }
      const s = int(r, 0, 20);
      const bad = [s, s + step, s + step + (step === 1 ? 2 : step + 1)];
      if (bad[2] > 25) return null;
      const odd = bad.map((v) => String.fromCharCode(65 + v)).join("");
      if (groups.includes(odd)) return null;
      const options = shuffle([...groups, odd], r);
      return {
        prompt: `Which letter group is the odd one out: ${options.join(", ")}?`,
        options, answer: options.indexOf(odd),
        explain: `In the others, consecutive letters are ${step} apart; in ${odd} the gaps are ${step} and ${bad[2] - bad[1]}.`,
        py: `opts = OPTS\ngaps = [tuple(ord(b) - ord(a) for a, b in zip(g, g[1:])) for g in opts]\nfrom collections import Counter\nc = Counter(gaps)\nodd = [g for g, gp in zip(opts, gaps) if c[gp] == 1]\nassert len(odd) == 1 and len(c) == 2, (gaps)\nanswer = opts.index(odd[0])`,
      };
    },
  },
];

function finish(items: GenQ[]): GenQ[] {
  return items.map((q) => (q.options ? { ...q, py: q.py.replace("OPTS", JSON.stringify(q.options)) } : q));
}

export const B4_TOPICS = {
  lin: "a2-linear-equations",
  quad: "a2-quadratics",
  ineq: "a2-inequalities-modulus",
  prog: "a2-progressions",
  logs: "a2-logs-indices-surds",
  tri: "a2-triangles",
  circ: "a2-circles-polygons",
  coord: "a2-coordinate-geometry",
  mens: "a2-mensuration",
  series: "lr2-series",
  code: "lr2-coding-decoding",
  odd: "lr2-analogy-odd-one-out",
} as const;

export const B4_ITEMS: GenQ[] = finish([
  ...build(B4_TOPICS.lin, "lin", 4101, LIN),
  ...build(B4_TOPICS.quad, "quad", 4102, QUAD),
  ...build(B4_TOPICS.ineq, "ineq", 4103, INEQ),
  ...build(B4_TOPICS.prog, "prog", 4104, PROG),
  ...build(B4_TOPICS.logs, "logs", 4105, LOGS),
  ...build(B4_TOPICS.tri, "tri", 4106, TRI),
  ...build(B4_TOPICS.circ, "circ", 4107, CIRC),
  ...build(B4_TOPICS.coord, "coord", 4108, COORD),
  ...build(B4_TOPICS.mens, "mens", 4109, MENS),
  ...build(B4_TOPICS.series, "series", 4110, SERIES),
  ...build(B4_TOPICS.code, "code", 4111, CODE),
  ...build(B4_TOPICS.odd, "odd", 4112, ODD),
]);
void gcd;
