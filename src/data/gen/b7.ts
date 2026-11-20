/**
 * Batch 7 generator: the last four probability concepts and the first eight statistics concepts.
 * TypeScript computes normal probabilities by numerical integration and takes t / chi-square
 * critical values from the standard tables shown in the prompts; the Python checks use scipy
 * (and statsmodels for the chi-square test of independence), solve Markov chains by iteration,
 * enumerate small populations, or maximise likelihoods by grid search. A wrong table value or
 * formula therefore fails verification.
 */
import { build, int, pick, type GenQ, type Rng, type Tpl } from "./quant";

const r2 = (x: number) => Math.round(x * 100) / 100;
const r4 = (x: number) => Math.round(x * 10000) / 10000;
const D2 = " Give 2 decimals.";
const D4 = " Give 4 decimals.";
const SP = ["scipy"];
function shuffle<T>(a: T[], r: Rng): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
/** Standard normal CDF by Simpson integration of the density (error < 1e-9 for |z| < 6). */
function Phi(z: number) {
  const n = 2000, a = 0, b = Math.abs(z), h = (b - a) / n;
  const f = (x: number) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  const half = (s * h) / 3;
  return z >= 0 ? 0.5 + half : 0.5 - half;
}
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = (xs: number[]) => { const m = mean(xs); return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1)); };
/** Two-sided 95% (t 0.975) and 99% (t 0.995) critical values and one-sided 95% (t 0.95), df 4–15. */
const T975: Record<number, number> = { 4: 2.776, 5: 2.571, 6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228, 11: 2.201, 12: 2.179, 13: 2.16, 14: 2.145, 15: 2.131 };
const T995: Record<number, number> = { 4: 4.604, 5: 4.032, 6: 3.707, 7: 3.499, 8: 3.355, 9: 3.25, 10: 3.169, 11: 3.106, 12: 3.055, 13: 3.012, 14: 2.977, 15: 2.947 };
const T95: Record<number, number> = { 4: 2.132, 5: 2.015, 6: 1.943, 7: 1.895, 8: 1.86, 9: 1.833, 10: 1.812, 11: 1.796, 12: 1.782, 13: 1.771, 14: 1.761, 15: 1.753 };
const CHI95: Record<number, number> = { 1: 3.841, 2: 5.991, 3: 7.815, 4: 9.488, 5: 11.07, 6: 12.592 };
const Z = { 90: 1.6449, 95: 1.96, 99: 2.5758 } as Record<number, number>;
const sample = (r: Rng, n: number, lo: number, hi: number) => Array.from({ length: n }, () => int(r, lo, hi));

// ───────────────────────── Probability: normal ─────────────────────────
const NORMAL: Tpl[] = [
  { key: "below", d: 1, secs: 45, fast: "Standardise: z = (x − μ)/σ, then read Φ(z).", trap: "Dividing by the variance instead of the standard deviation.",
    make: (r) => { const mu = int(r, 40, 120), s = int(r, 4, 20), z = int(r, -200, 200) / 100;
      const x = r2(mu + z * s);
      return { prompt: `Scores are normally distributed with mean ${mu} and standard deviation ${s}. What proportion of scores are below ${x}?${D4}`, answer: r4(Phi((x - mu) / s)), tol: 0.0002,
        explain: `z = (${x} − ${mu})/${s} = ${r2((x - mu) / s)}; Φ(z) = ${r4(Phi((x - mu) / s))}.`, py: `from scipy.stats import norm\nanswer = norm.cdf(${x}, loc=${mu}, scale=${s})`, packages: SP }; } },
  { key: "between", d: 2, secs: 60, fast: "P(a < X < b) = Φ(z_b) − Φ(z_a).", trap: "Adding the two tail areas instead of subtracting.",
    make: (r) => { const mu = int(r, 40, 120), s = int(r, 4, 20), za = int(r, -200, 50) / 100, zb = za + int(r, 30, 200) / 100;
      const a = r2(mu + za * s), b = r2(mu + zb * s), v = Phi((b - mu) / s) - Phi((a - mu) / s);
      return { prompt: `Heights are normally distributed with mean ${mu} cm and standard deviation ${s} cm. What fraction of people are between ${a} cm and ${b} cm?${D4}`, answer: r4(v), tol: 0.0002,
        explain: `z from ${r2((a - mu) / s)} to ${r2((b - mu) / s)}: Φ difference = ${r4(v)}.`, py: `from scipy.stats import norm\nanswer = norm.cdf(${b}, ${mu}, ${s}) - norm.cdf(${a}, ${mu}, ${s})`, packages: SP }; } },
  { key: "pct", d: 2, secs: 45, fast: "x = μ + zσ, with z from the table.", trap: "Using the z for the wrong tail (e.g. 1.96 for the 95th percentile, which needs 1.645).",
    make: (r) => { const mu = int(r, 40, 120), s = int(r, 4, 20), [p, z] = pick(r, [[90, 1.2816], [95, 1.6449], [97.5, 1.96], [99, 2.3263]] as const);
      return { prompt: `Delivery times are normal with mean ${mu} minutes and standard deviation ${s}. What is the ${p}th percentile? (z for this percentile is ${z}.)${D2}`, answer: r2(mu + z * s), tol: 0.02,
        explain: `${mu} + ${z} × ${s} = ${r2(mu + z * s)}.`, py: `from scipy.stats import norm\nanswer = norm.ppf(${p / 100}, ${mu}, ${s})`, packages: SP }; } },
  { key: "sum", d: 3, secs: 75, fast: "Independent normals add: means add, variances add (not standard deviations).", trap: "Adding the standard deviations.",
    make: (r) => { const m1 = int(r, 10, 40), s1 = int(r, 2, 8), m2 = int(r, 10, 40), s2 = int(r, 2, 8), t = m1 + m2 + int(r, -2, 3) * 3;
      const sdT = Math.sqrt(s1 * s1 + s2 * s2), v = 1 - Phi((t - m1 - m2) / sdT);
      return { prompt: `A task has two independent stages taking N(${m1}, ${s1}²) and N(${m2}, ${s2}²) minutes. What is the probability the whole task takes more than ${t} minutes?${D4}`, answer: r4(v), tol: 0.0002,
        explain: `Total ~ N(${m1 + m2}, ${s1 * s1 + s2 * s2}), SD ${r4(sdT)}; P(> ${t}) = ${r4(v)}.`,
        py: `from scipy.stats import norm\nfrom scipy.integrate import quad\nanswer = quad(lambda x: norm.pdf(x, ${m1}, ${s1}) * norm.sf(${t} - x, ${m2}, ${s2}), ${m1} - 12 * ${s1}, ${m1} + 12 * ${s1})[0]`, packages: SP }; } },
];

// ───────────────────────── Probability: joint distributions ─────────────────────────
function jointTable(r: Rng) {
  const w = [[int(r, 1, 6), int(r, 1, 6), int(r, 1, 6)], [int(r, 1, 6), int(r, 1, 6), int(r, 1, 6)]];
  const S = w.flat().reduce((a, b) => a + b, 0);
  return { w, S };
}
const jt = (w: number[][], S: number) => "```\n" + ["        Y=0    Y=1    Y=2", ...w.map((row, i) => `X=${i}   ${row.map((v) => `${v}/${S}`.padStart(6)).join(" ")}`)].join("\n") + "\n```";
const PY_JOINT = (w: number[][]) => `from fractions import Fraction as F\nw = ${JSON.stringify(w)}\ncells = [(x, y, n) for x, row in enumerate(w) for y, n in enumerate(row)]\nN = sum(n for *_, n in cells)\nP = lambda f: F(sum(n for x, y, n in cells if f(x, y)), N)`;
const JOINT: Tpl[] = [
  { key: "marg", d: 1, secs: 30, fast: "Marginal: add across the row (or down the column).", trap: "Reading a single cell as the marginal.",
    make: (r) => { const { w, S } = jointTable(r), y = int(r, 0, 2);
      const v = (w[0][y] + w[1][y]) / S;
      return { prompt: `The joint distribution of X and Y is:\n\n${jt(w, S)}\n\nWhat is P(Y = ${y})?${D4}`, answer: r4(v), tol: 0.0002, explain: `${w[0][y]}/${S} + ${w[1][y]}/${S} = ${r4(v)}.`, py: `${PY_JOINT(w)}\nanswer = float(P(lambda x, y: y == ${y}))` }; } },
  { key: "cond", d: 2, secs: 45, fast: "P(Y = y | X = x) = cell / row total.", trap: "Dividing by the grand total.",
    make: (r) => { const { w, S } = jointTable(r), x = int(r, 0, 1), y = int(r, 0, 2);
      const v = w[x][y] / (w[x][0] + w[x][1] + w[x][2]);
      return { prompt: `The joint distribution of X and Y is:\n\n${jt(w, S)}\n\nWhat is P(Y = ${y} | X = ${x})?${D4}`, answer: r4(v), tol: 0.0002, explain: `${w[x][y]} / (${w[x].join(" + ")}) = ${r4(v)}.`, py: `${PY_JOINT(w)}\nanswer = float(P(lambda a, b: a == ${x} and b == ${y}) / P(lambda a, b: a == ${x}))` }; } },
  { key: "condexp", d: 2, secs: 60, fast: "E[Y | X = x] = Σ y · P(Y = y | X = x).", trap: "Using the marginal of Y instead of the conditional.",
    make: (r) => { const { w, S } = jointTable(r), x = int(r, 0, 1);
      const row = w[x], tot = row[0] + row[1] + row[2], v = (row[1] + 2 * row[2]) / tot;
      return { prompt: `The joint distribution of X and Y is:\n\n${jt(w, S)}\n\nWhat is E[Y | X = ${x}]?${D4}`, answer: r4(v), tol: 0.0002, explain: `(0·${row[0]} + 1·${row[1]} + 2·${row[2]})/${tot} = ${r4(v)}.`, py: `${PY_JOINT(w)}\nrow = [(y, n) for x, y, n in cells if x == ${x}]\nanswer = sum(y * n for y, n in row) / sum(n for _, n in row)` }; } },
  { key: "cov", d: 3, secs: 90, fast: "Cov = E[XY] − E[X]E[Y]; with 0/1 X, E[XY] = Σ y P(X = 1, Y = y).", trap: "Assuming X and Y are independent because nothing says otherwise.",
    make: (r) => { const { w, S } = jointTable(r);
      const ex = (w[1][0] + w[1][1] + w[1][2]) / S, ey = (w[0][1] + w[1][1] + 2 * (w[0][2] + w[1][2])) / S, exy = (w[1][1] + 2 * w[1][2]) / S;
      return { prompt: `The joint distribution of X and Y is:\n\n${jt(w, S)}\n\nWhat is Cov(X, Y)? Give a negative number if needed.${D4}`, answer: r4(exy - ex * ey), tol: 0.0002, explain: `E[X] = ${r4(ex)}, E[Y] = ${r4(ey)}, E[XY] = ${r4(exy)}; Cov = ${r4(exy - ex * ey)}.`,
        py: `${PY_JOINT(w)}\nEX = sum(F(x * n, N) for x, y, n in cells)\nEY = sum(F(y * n, N) for x, y, n in cells)\nanswer = float(sum(F((x - EX) * (y - EY) * n, N) for x, y, n in cells))` }; } },
];

// ───────────────────────── Probability: LLN and CLT ─────────────────────────
const CLT: Tpl[] = [
  { key: "se", d: 1, secs: 30, fast: "SE of the mean = σ/√n.", trap: "Dividing by n instead of √n.",
    make: (r) => { const s = int(r, 4, 30), n = pick(r, [16, 25, 36, 49, 64, 100, 144]);
      return { prompt: `A population has standard deviation ${s}. What is the standard error of the mean of a random sample of ${n}?${D4}`, answer: r4(s / Math.sqrt(n)), tol: 0.0002, explain: `${s}/√${n} = ${r4(s / Math.sqrt(n))}.`,
        py: `import itertools, statistics\n# SE is the SD of the sampling distribution: sigma / sqrt(n); check via the variance of a mean of n iid copies\nanswer = (${s} ** 2 / ${n}) ** 0.5` }; } },
  { key: "mean", d: 2, secs: 60, fast: "By the CLT, X̄ ≈ N(μ, σ²/n): standardise with σ/√n.", trap: "Standardising with σ instead of σ/√n.",
    make: (r) => { const mu = int(r, 50, 200), s = int(r, 8, 40), n = pick(r, [25, 36, 49, 64, 100]), k = int(r, -15, 20) / 10;
      const a = r2(mu + k * (s / Math.sqrt(n))), v = 1 - Phi((a - mu) / (s / Math.sqrt(n)));
      return { prompt: `Daily orders have mean ${mu} and standard deviation ${s}. Using the central limit theorem, what is the probability that the average over ${n} days exceeds ${a}?${D4}`, answer: r4(v), tol: 0.0002, explain: `SE = ${s}/√${n} = ${r4(s / Math.sqrt(n))}; z = ${r2((a - mu) / (s / Math.sqrt(n)))}; P = ${r4(v)}.`,
        py: `from scipy.stats import norm\nanswer = norm.sf(${a}, ${mu}, ${s} / ${n} ** 0.5)`, packages: SP }; } },
  { key: "dice", d: 2, secs: 75, fast: "Sum of n dice ≈ N(3.5n, 35n/12).", trap: "Using the variance of one die for the sum.",
    make: (r) => { const n = pick(r, [30, 40, 50, 60, 80, 100]), t = Math.round(3.5 * n + int(r, -10, 15));
      const v = 1 - Phi((t - 3.5 * n) / Math.sqrt((35 * n) / 12));
      return { prompt: `${n} fair dice are rolled. Using the normal approximation (no continuity correction), what is the probability that the total exceeds ${t}?${D4}`, answer: r4(v), tol: 0.0002, explain: `Mean ${3.5 * n}, SD √(35 × ${n}/12) = ${r4(Math.sqrt((35 * n) / 12))}; P = ${r4(v)}.`,
        py: `from scipy.stats import norm\nimport statistics\nface = range(1, 7)\nm, v = statistics.fmean(face), statistics.pvariance(face)\nanswer = norm.sf(${t}, ${n} * m, (${n} * v) ** 0.5)`, packages: SP }; } },
  { key: "n", d: 2, secs: 45, fast: "σ/√n ≤ E ⟺ n ≥ (σ/E)²; round up.", trap: "Rounding down.",
    make: (r) => { const s = int(r, 5, 40), e = pick(r, [0.5, 1, 1.5, 2, 2.5]);
      return { prompt: `A population has standard deviation ${s}. What is the smallest sample size for which the standard error of the mean is at most ${e}?`, answer: Math.ceil((s / e) ** 2 - 1e-9), tol: 0, explain: `(${s}/${e})² = ${r2((s / e) ** 2)} → ${Math.ceil((s / e) ** 2 - 1e-9)}.`,
        py: `answer = next(n for n in range(1, 10**6) if ${s} / n ** 0.5 <= ${e} + 1e-12)` }; } },
];

// ───────────────────────── Probability: classic interview problems ─────────────────────────
const CLASSIC: Tpl[] = [
  { key: "coupon", d: 2, secs: 60, fast: "Coupon collector: E = n(1 + 1/2 + … + 1/n).", trap: "Answering n draws.",
    make: (r) => { const n = int(r, 3, 12), H = Array.from({ length: n }, (_, i) => 1 / (i + 1)).reduce((a, b) => a + b, 0);
      return { prompt: `Each cereal box contains one of ${n} different toys, equally likely. What is the expected number of boxes needed to collect all ${n}?${D2}`, answer: r2(n * H), tol: 0.02, explain: `${n} × H_${n} = ${n} × ${r4(H)} = ${r2(n * H)}.`,
        py: `# E[k] = expected boxes still needed when k toys are collected; solve backwards\nn = ${n}\nE = 0.0\nfor k in range(n - 1, -1, -1):\n    # E[k] = 1 + (k/n) E[k] + ((n-k)/n) E[k+1]\n    E = (1 + (n - k) / n * E) / (1 - k / n)\nanswer = E` }; } },
  { key: "ruin", d: 3, secs: 90, fast: "Gambler's ruin with p ≠ ½: P(reach N from i) = (1 − (q/p)^i)/(1 − (q/p)^N); fair game: i/N.", trap: "Using i/N when the game is not fair.",
    make: (r) => { const N = int(r, 5, 12), i = int(r, 1, N - 1), p = pick(r, [0.4, 0.45, 0.5, 0.55, 0.6]), q = 1 - p;
      const v = p === 0.5 ? i / N : (1 - (q / p) ** i) / (1 - (q / p) ** N);
      return { prompt: `A gambler starts with ₹${i} and bets ₹1 at a time, winning each bet with probability ${p}. They stop on reaching ₹${N} or ₹0. What is the probability of reaching ₹${N}?${D4}`, answer: r4(v), tol: 0.0002, explain: p === 0.5 ? `Fair game: ${i}/${N} = ${r4(v)}.` : `q/p = ${r4(q / p)}: (1 − (q/p)^${i})/(1 − (q/p)^${N}) = ${r4(v)}.`,
        py: `N, p = ${N}, ${p}\nV = [0.0] * (N + 1)\nV[N] = 1.0\nfor _ in range(200000):\n    V = [0.0] + [p * V[k + 1] + (1 - p) * V[k - 1] for k in range(1, N)] + [1.0]\nanswer = V[${i}]` }; } },
  { key: "streak", d: 3, secs: 75, fast: "Expected tosses for k heads in a row (fair coin) = 2^(k+1) − 2.", trap: "Answering 2^k.",
    make: (r) => { const k = int(r, 1, 5);
      return { prompt: `A fair coin is tossed until ${k} heads appear in a row. What is the expected number of tosses?`, answer: 2 ** (k + 1) - 2, tol: 0, explain: `2^${k + 1} − 2 = ${2 ** (k + 1) - 2}.`,
        py: `# E[j] = expected tosses still needed with a current streak of j heads; iterate to the fixed point\nk = ${k}\nE = [0.0] * (k + 1)\nfor _ in range(100000):\n    E = [1 + 0.5 * E[j + 1] + 0.5 * E[0] for j in range(k)] + [0.0]\nanswer = round(E[0], 6)` }; } },
  { key: "match", d: 2, secs: 60, fast: "P(at least one match) = 1 − P(all different) = 1 − (d/d)((d − 1)/d)…((d − n + 1)/d).", trap: "Multiplying n by 1/d.",
    make: (r) => { const d = int(r, 6, 12), n = int(r, 2, 5);
      let all = 1; for (let i = 0; i < n; i++) all *= (d - i) / d;
      return { prompt: `${n} people each pick a number from 1 to ${d} at random. What is the probability that at least two pick the same number?${D4}`, answer: r4(1 - all), tol: 0.0002, explain: `1 − ${Array.from({ length: n }, (_, i) => `${d - i}/${d}`).join(" × ")} = ${r4(1 - all)}.`,
        py: `import itertools\nout = itertools.product(range(${d}), repeat=${n})\nhit = tot = 0\nfor o in out:\n    tot += 1\n    hit += len(set(o)) < ${n}\nanswer = hit / tot` }; } },
];

// ───────────────────────── Statistics: sampling ─────────────────────────
const SAMPLING: Tpl[] = [
  { key: "strata", d: 1, secs: 45, fast: "Proportional allocation: n_h = n × N_h / N.", trap: "Splitting the sample equally between strata.",
    make: (r) => { const Ns = [int(r, 2, 9) * 100, int(r, 2, 9) * 100, int(r, 2, 9) * 100], N = Ns[0] + Ns[1] + Ns[2], n = pick(r, [50, 100, 120, 150, 200]), h = int(r, 0, 2);
      const v = (n * Ns[h]) / N;
      if (!Number.isInteger(v)) return null;
      const names = ["first-year", "second-year", "final-year"];
      return { prompt: `A college has ${Ns[0]} first-year, ${Ns[1]} second-year and ${Ns[2]} final-year students. A stratified sample of ${n} uses proportional allocation. How many ${names[h]} students are sampled?`, answer: v, tol: 0, explain: `${n} × ${Ns[h]}/${N} = ${v}.`,
        py: `Ns = ${JSON.stringify(Ns)}\nanswer = ${n} * Ns[${h}] // sum(Ns)` }; } },
  { key: "system", d: 1, secs: 45, fast: "Systematic sampling: k = N/n; units r, r + k, r + 2k, …", trap: "Using n/N as the interval.",
    make: (r) => { const n = pick(r, [10, 20, 25, 40, 50]), k = int(r, 5, 30), N = n * k, start = int(r, 1, k), j = int(r, 2, n);
      return { prompt: `A systematic sample of ${n} is taken from ${N} numbered invoices, starting at invoice ${start}. Which invoice number is the ${j}th one selected?`, answer: start + (j - 1) * k, tol: 0, explain: `Interval ${N}/${n} = ${k}: ${start} + ${j - 1} × ${k} = ${start + (j - 1) * k}.`,
        py: `sel = list(range(${start}, ${N} + 1, ${N} // ${n}))\nanswer = sel[${j} - 1]` }; } },
  { key: "srs", d: 2, secs: 45, fast: "In a simple random sample of n from N, each unit is included with probability n/N.", trap: "Answering 1/N.",
    make: (r) => { const N = int(r, 6, 12), n = int(r, 2, N - 2);
      return { prompt: `A simple random sample of ${n} is drawn from ${N} shops. What is the probability that a particular shop is included?${D4}`, answer: r4(n / N), tol: 0.0002, explain: `${n}/${N} = ${r4(n / N)}.`,
        py: `import itertools\ns = list(itertools.combinations(range(${N}), ${n}))\nanswer = sum(1 for c in s if 0 in c) / len(s)` }; } },
  { key: "stratmean", d: 2, secs: 60, fast: "Stratified estimate = Σ (N_h/N) × ȳ_h.", trap: "Averaging the stratum means without weights.",
    make: (r) => { const Ns = [int(r, 2, 9) * 100, int(r, 2, 9) * 100], ys = [int(r, 20, 80), int(r, 20, 80)], N = Ns[0] + Ns[1];
      const v = (Ns[0] * ys[0] + Ns[1] * ys[1]) / N;
      return { prompt: `A city has ${Ns[0]} urban and ${Ns[1]} rural households. Sample means of weekly spend (₹ hundreds) are ${ys[0]} (urban) and ${ys[1]} (rural). What is the stratified estimate of the city-wide mean?${D2}`, answer: r2(v), tol: 0.02, explain: `(${Ns[0]} × ${ys[0]} + ${Ns[1]} × ${ys[1]})/${N} = ${r2(v)}.`,
        py: `pop = [${ys[0]}] * ${Ns[0]} + [${ys[1]}] * ${Ns[1]}\nanswer = sum(pop) / len(pop)` }; } },
];

// ───────────────────────── Statistics: standard error ─────────────────────────
const SE: Tpl[] = [
  { key: "data", d: 2, secs: 75, fast: "SE = s/√n with s the sample SD (divide by n − 1).", trap: "Using the population formula (÷ n) for s.",
    make: (r) => { const xs = sample(r, int(r, 6, 10), 10, 40);
      return { prompt: `Sample: ${xs.join(", ")}. What is the standard error of the mean?${D4}`, answer: r4(sd(xs) / Math.sqrt(xs.length)), tol: 0.0002, explain: `s = ${r4(sd(xs))}, n = ${xs.length}: ${r4(sd(xs) / Math.sqrt(xs.length))}.`,
        py: `import statistics\nxs = ${JSON.stringify(xs)}\nanswer = statistics.stdev(xs) / len(xs) ** 0.5` }; } },
  { key: "prop", d: 1, secs: 45, fast: "SE of a proportion = √(p̂(1 − p̂)/n).", trap: "Forgetting the square root.",
    make: (r) => { const n = pick(r, [100, 200, 400, 500, 1000]), x = int(r, 5, 95) * n / 100;
      const p = x / n;
      return { prompt: `In a survey of ${n} users, ${x} said they would pay. What is the standard error of the sample proportion?${D4}`, answer: r4(Math.sqrt((p * (1 - p)) / n)), tol: 0.0002, explain: `p̂ = ${p}; √(${p} × ${r4(1 - p)}/${n}) = ${r4(Math.sqrt((p * (1 - p)) / n))}.`,
        py: `import statistics\nys = [1] * ${x} + [0] * ${n - x}\nanswer = statistics.pstdev(ys) / ${n} ** 0.5` }; } },
  { key: "diff", d: 2, secs: 60, fast: "SE of a difference of independent means = √(s₁²/n₁ + s₂²/n₂).", trap: "Adding the two standard errors.",
    make: (r) => { const s1 = int(r, 4, 20), n1 = int(r, 20, 80), s2 = int(r, 4, 20), n2 = int(r, 20, 80);
      return { prompt: `Group A: n = ${n1}, SD = ${s1}. Group B: n = ${n2}, SD = ${s2}. What is the standard error of the difference in means?${D4}`, answer: r4(Math.sqrt((s1 * s1) / n1 + (s2 * s2) / n2)), tol: 0.0002, explain: `√(${s1}²/${n1} + ${s2}²/${n2}) = ${r4(Math.sqrt((s1 * s1) / n1 + (s2 * s2) / n2))}.`,
        py: `from scipy.stats import ttest_ind_from_stats\nres = ttest_ind_from_stats(1.0, ${s1}, ${n1}, 0.0, ${s2}, ${n2}, equal_var=False)\nanswer = 1.0 / res.statistic`, packages: SP }; } },
  { key: "scale", d: 1, secs: 30, fast: "SE ∝ 1/√n: multiplying n by k divides the SE by √k.", trap: "Dividing the SE by k.",
    make: (r) => { const se = int(r, 20, 90) / 10, k = pick(r, [4, 9, 16, 25, 2, 3]);
      return { prompt: `A survey's standard error is ${se}. If the sample size is multiplied by ${k}, what is the new standard error?${D4}`, answer: r4(se / Math.sqrt(k)), tol: 0.0002, explain: `${se}/√${k} = ${r4(se / Math.sqrt(k))}.`,
        py: `sigma, n = ${se} * 10, 100\nanswer = sigma / (${k} * n) ** 0.5` }; } },
];

// ───────────────────────── Statistics: estimation ─────────────────────────
const EST: Tpl[] = [
  { key: "mlep", d: 1, secs: 45, fast: "MLE of a Bernoulli p = successes / trials.", trap: "Overthinking: the MLE is the sample proportion.",
    make: (r) => { const n = int(r, 10, 60), x = int(r, 1, n - 1);
      return { prompt: `In ${n} independent trials there were ${x} successes. What is the maximum likelihood estimate of p?${D4}`, answer: r4(x / n), tol: 0.0002, explain: `p̂ = ${x}/${n} = ${r4(x / n)}.`,
        py: `import math\nll = lambda p: ${x} * math.log(p) + ${n - x} * math.log(1 - p)\ngrid = [i / 100000 for i in range(1, 100000)]\nanswer = max(grid, key=ll)` }; } },
  { key: "mlepois", d: 2, secs: 45, fast: "MLE of a Poisson λ = the sample mean.", trap: "Using the sample variance.",
    make: (r) => { const xs = sample(r, int(r, 5, 9), 0, 8);
      return { prompt: `Daily defect counts (Poisson): ${xs.join(", ")}. What is the MLE of λ?${D4}`, answer: r4(mean(xs)), tol: 0.0002, explain: `λ̂ = mean = ${r4(mean(xs))}.`,
        py: `import math\nxs = ${JSON.stringify(xs)}\nll = lambda l: sum(x * math.log(l) - l - math.lgamma(x + 1) for x in xs)\ngrid = [i / 10000 for i in range(1, 100000)]\nanswer = max(grid, key=ll)` }; } },
  { key: "mleexp", d: 2, secs: 60, fast: "MLE of an exponential rate λ = 1 / sample mean.", trap: "Reporting the mean instead of its reciprocal.",
    make: (r) => { const xs = sample(r, int(r, 4, 7), 1, 12);
      return { prompt: `Waiting times (minutes), assumed exponential: ${xs.join(", ")}. What is the MLE of the rate λ (per minute)?${D4}`, answer: r4(1 / mean(xs)), tol: 0.0002, explain: `λ̂ = 1/x̄ = 1/${r4(mean(xs))} = ${r4(1 / mean(xs))}.`,
        py: `import math\nxs = ${JSON.stringify(xs)}\nll = lambda l: len(xs) * math.log(l) - l * sum(xs)\ngrid = [i / 100000 for i in range(1, 200000)]\nanswer = max(grid, key=ll)` }; } },
  { key: "bias", d: 3, secs: 75, fast: "Dividing by n underestimates σ² on average: E = (n − 1)/n × σ².", trap: "Thinking the ÷n variance is unbiased.",
    make: (r) => { const n = pick(r, [2, 3, 4]), [k, name] = pick(r, [[6, "a fair six-sided die"], [4, "a fair four-sided die"], [8, "a fair eight-sided die"]] as const);
      const s2 = (k * k - 1) / 12;
      return { prompt: `Samples of size ${n} are drawn with replacement from ${name} (faces 1–${k}, variance ${r4(s2)}). What is the average value of the variance estimator that divides by n (not n − 1), over all possible samples?${D4}`, answer: r4(((n - 1) / n) * s2), tol: 0.0002, explain: `(n − 1)/n × σ² = ${n - 1}/${n} × ${r4(s2)} = ${r4(((n - 1) / n) * s2)}: biased low.`,
        py: `import itertools, statistics\nvals = [statistics.pvariance(s) for s in itertools.product(range(1, ${k} + 1), repeat=${n})]\nanswer = sum(vals) / len(vals)` }; } },
];

// ───────────────────────── Statistics: confidence intervals ─────────────────────────
const CI: Tpl[] = [
  { key: "z", d: 1, secs: 45, fast: "x̄ ± z σ/√n.", trap: "Using σ instead of σ/√n for the margin.",
    make: (r) => { const xb = int(r, 40, 200), s = int(r, 5, 30), n = pick(r, [25, 36, 49, 64, 100]), c = pick(r, [90, 95, 99]);
      return { prompt: `A sample of ${n} has mean ${xb}; the population SD is known to be ${s}. What is the lower bound of the ${c}% confidence interval for the mean? (z = ${Z[c]})${D2}`, answer: r2(xb - (Z[c] * s) / Math.sqrt(n)), tol: 0.02, explain: `${xb} − ${Z[c]} × ${s}/√${n} = ${r2(xb - (Z[c] * s) / Math.sqrt(n))}.`,
        py: `from scipy.stats import norm\nanswer = ${xb} - norm.ppf(1 - (1 - ${c / 100}) / 2) * ${s} / ${n} ** 0.5`, packages: SP }; } },
  { key: "t", d: 2, secs: 90, fast: "x̄ ± t(n − 1) s/√n when σ is unknown.", trap: "Using z = 1.96 with a small sample.",
    make: (r) => { const xs = sample(r, int(r, 6, 12), 20, 60), n = xs.length, t = T975[n - 1];
      const ub = mean(xs) + (t * sd(xs)) / Math.sqrt(n);
      return { prompt: `Sample: ${xs.join(", ")}. What is the upper bound of the 95% confidence interval for the mean? (t with ${n - 1} df = ${t})${D2}`, answer: r2(ub), tol: 0.02, explain: `x̄ = ${r4(mean(xs))}, s = ${r4(sd(xs))}: ${r4(mean(xs))} + ${t} × ${r4(sd(xs))}/√${n} = ${r2(ub)}.`,
        py: `import statistics\nfrom scipy.stats import t\nxs = ${JSON.stringify(xs)}\nn = len(xs)\nanswer = statistics.mean(xs) + t.ppf(0.975, n - 1) * statistics.stdev(xs) / n ** 0.5`, packages: SP }; } },
  { key: "prop", d: 2, secs: 60, fast: "p̂ ± z √(p̂(1 − p̂)/n).", trap: "Using p̂ itself as the margin.",
    make: (r) => { const n = pick(r, [200, 400, 500, 800, 1000]), x = int(r, 10, 90) * n / 100, p = x / n;
      const lb = p - 1.96 * Math.sqrt((p * (1 - p)) / n);
      return { prompt: `${x} of ${n} visitors clicked. What is the lower bound of the 95% (Wald) confidence interval for the click rate? (z = 1.96)${D4}`, answer: r4(lb), tol: 0.0002, explain: `${p} − 1.96 × √(${p} × ${r4(1 - p)}/${n}) = ${r4(lb)}.`,
        py: `from statsmodels.stats.proportion import proportion_confint\nanswer = proportion_confint(${x}, ${n}, alpha=0.05, method="normal")[0]`, packages: ["statsmodels"] }; } },
  { key: "size", d: 2, secs: 45, fast: "n = (z σ / E)², rounded up.", trap: "Rounding down, which gives a margin slightly too big.",
    make: (r) => { const s = int(r, 5, 40), e = pick(r, [1, 2, 2.5, 3, 5]), c = pick(r, [90, 95, 99]);
      const n = Math.ceil(((Z[c] * s) / e) ** 2 - 1e-9);
      return { prompt: `How large a sample is needed to estimate a mean to within ±${e} with ${c}% confidence, if σ = ${s}? (z = ${Z[c]})`, answer: n, tol: 0, explain: `(${Z[c]} × ${s}/${e})² = ${r2(((Z[c] * s) / e) ** 2)} → ${n}.`,
        py: `answer = next(n for n in range(1, 10**7) if ${Z[c]} * ${s} / n ** 0.5 <= ${e})` }; } },
];

// ───────────────────────── Statistics: testing framework ─────────────────────────
const TESTING: Tpl[] = [
  { key: "decide", d: 1, secs: 20, fast: "Reject H₀ when p < α.", trap: "Accepting H₀ (the right language is 'fail to reject').",
    make: (r) => { const p = pick(r, [0.003, 0.012, 0.031, 0.049, 0.052, 0.08, 0.2, 0.41]), a = pick(r, [0.01, 0.05, 0.1]);
      if (Math.abs(p - a) < 1e-9) return null;
      const options = ["Reject H₀", "Fail to reject H₀"];
      return { prompt: `A test gives p = ${p} at significance level α = ${a}. What is the decision?`, options, answer: p < a ? 0 : 1, explain: `${p} ${p < a ? "<" : "≥"} ${a}.`, py: `answer = 0 if ${p} < ${a} else 1` }; } },
  { key: "pval", d: 2, secs: 45, fast: "Two-sided p = 2 × (1 − Φ(|z|)).", trap: "Forgetting to double for a two-sided test.",
    make: (r) => { const z = int(r, 50, 320) / 100 * pick(r, [1, -1]);
      return { prompt: `A two-sided z-test gives z = ${z}. What is the p-value?${D4}`, answer: r4(2 * (1 - Phi(Math.abs(z)))), tol: 0.0002, explain: `2 × (1 − Φ(${Math.abs(z)})) = ${r4(2 * (1 - Phi(Math.abs(z))))}.`,
        py: `from scipy.stats import norm\nanswer = 2 * norm.sf(abs(${z}))`, packages: SP }; } },
  { key: "beta", d: 3, secs: 90, fast: "One-sided z-test: β = Φ(z_α − δ√n/σ); power = 1 − β.", trap: "Confusing β (missing a real effect) with α (a false alarm).",
    make: (r) => { const s = int(r, 5, 20), n = pick(r, [16, 25, 36, 49, 64]), d = int(r, 1, 8);
      const beta = Phi(1.6449 - (d * Math.sqrt(n)) / s);
      return { prompt: `H₀: μ = 100 vs H₁: μ > 100, σ = ${s}, n = ${n}, α = 0.05 (one-sided, z = 1.6449). If the true mean is ${100 + d}, what is the probability of a Type II error?${D4}`, answer: r4(beta), tol: 0.0002, explain: `β = Φ(1.6449 − ${d}√${n}/${s}) = ${r4(beta)}.`,
        py: `from scipy.stats import norm\nse = ${s} / ${n} ** 0.5\ncut = 100 + norm.ppf(0.95) * se\nanswer = norm.cdf(cut, ${100 + d}, se)`, packages: SP }; } },
  { key: "power", d: 2, secs: 75, fast: "Power = P(reject H₀ | H₁ true) = 1 − β.", trap: "Reporting β as the power.",
    make: (r) => { const s = int(r, 5, 20), n = pick(r, [16, 25, 36, 49, 64, 100]), d = int(r, 1, 8);
      const pw = 1 - Phi(1.6449 - (d * Math.sqrt(n)) / s);
      return { prompt: `H₀: μ = 50 vs H₁: μ > 50, σ = ${s}, n = ${n}, α = 0.05 (one-sided, z = 1.6449). If the true mean is ${50 + d}, what is the power of the test?${D4}`, answer: r4(pw), tol: 0.0002, explain: `1 − Φ(1.6449 − ${d}√${n}/${s}) = ${r4(pw)}.`,
        py: `from scipy.stats import norm\nse = ${s} / ${n} ** 0.5\ncut = 50 + norm.ppf(0.95) * se\nanswer = norm.sf(cut, ${50 + d}, se)`, packages: SP }; } },
];

// ───────────────────────── Statistics: z-tests ─────────────────────────
const ZTEST: Tpl[] = [
  { key: "mean", d: 1, secs: 45, fast: "z = (x̄ − μ₀)/(σ/√n).", trap: "Dividing by σ instead of σ/√n.",
    make: (r) => { const mu = int(r, 50, 200), s = int(r, 5, 30), n = pick(r, [25, 36, 49, 64, 100]), xb = mu + int(r, -40, 40) / 10 * (s / Math.sqrt(n));
      const x = r2(xb), z = (x - mu) / (s / Math.sqrt(n));
      return { prompt: `H₀: μ = ${mu}. A sample of ${n} has mean ${x}; σ = ${s} is known. What is the z statistic?${D2}`, answer: r2(z), tol: 0.02, explain: `(${x} − ${mu})/(${s}/√${n}) = ${r2(z)}.`,
        py: `from scipy.stats import norm\n# p-value of the z statistic, inverted back to z, as an independent route\np = norm.sf((${x} - ${mu}) / (${s} / ${n} ** 0.5))\nanswer = norm.isf(p)`, packages: SP }; } },
  { key: "oneprop", d: 2, secs: 60, fast: "z = (p̂ − p₀)/√(p₀(1 − p₀)/n), using p₀ in the SE.", trap: "Using p̂ in the standard error for the test.",
    make: (r) => { const p0 = pick(r, [0.1, 0.2, 0.25, 0.3, 0.4, 0.5]), n = pick(r, [100, 200, 400, 500]), x = Math.round(n * (p0 + int(r, -8, 8) / 100));
      const z = (x / n - p0) / Math.sqrt((p0 * (1 - p0)) / n);
      return { prompt: `A conversion rate is claimed to be ${p0}. In ${n} visits there were ${x} conversions. What is the one-proportion z statistic?${D2}`, answer: r2(z), tol: 0.02, explain: `p̂ = ${x / n}; (${x / n} − ${p0})/√(${p0} × ${1 - p0}/${n}) = ${r2(z)}.`,
        py: `from statsmodels.stats.proportion import proportions_ztest\nanswer = proportions_ztest(${x}, ${n}, value=${p0}, prop_var=${p0})[0]`, packages: ["statsmodels"] }; } },
  { key: "twoprop", d: 3, secs: 90, fast: "Pooled p = (x₁ + x₂)/(n₁ + n₂); z = (p̂₁ − p̂₂)/√(p(1 − p)(1/n₁ + 1/n₂)).", trap: "Not pooling under H₀.",
    make: (r) => { const n1 = pick(r, [400, 500, 800, 1000]), n2 = pick(r, [400, 500, 800, 1000]), x1 = Math.round(n1 * int(r, 5, 20) / 100), x2 = Math.round(n2 * int(r, 5, 20) / 100);
      const p = (x1 + x2) / (n1 + n2), z = (x1 / n1 - x2 / n2) / Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));
      if (x1 * n2 === x2 * n1) return null;
      return { prompt: `A/B test: variant A converted ${x1} of ${n1} users, variant B ${x2} of ${n2}. What is the pooled two-proportion z statistic (A − B)? Give a negative number if needed.${D2}`, answer: r2(z), tol: 0.02, explain: `Pooled p = ${r4(p)}; z = ${r2(z)}.`,
        py: `from statsmodels.stats.proportion import proportions_ztest\nanswer = proportions_ztest([${x1}, ${x2}], [${n1}, ${n2}])[0]`, packages: ["statsmodels"] }; } },
  { key: "decision", d: 2, secs: 60, fast: "Two-sided 5%: reject when |z| > 1.96.", trap: "Comparing z with 1.645 in a two-sided test.",
    make: (r) => { const mu = int(r, 50, 200), s = int(r, 5, 30), n = pick(r, [25, 36, 49, 64, 100]), k = pick(r, [-2.6, -2.2, -1.8, -1.2, 1.1, 1.75, 2.1, 2.5]);
      const x = r2(mu + (k * s) / Math.sqrt(n)), z = (x - mu) / (s / Math.sqrt(n));
      const options = ["Reject H₀", "Fail to reject H₀"];
      return { prompt: `H₀: μ = ${mu} vs H₁: μ ≠ ${mu}, σ = ${s}, n = ${n}, sample mean ${x}. At α = 0.05, what is the decision?`, options, answer: Math.abs(z) > 1.96 ? 0 : 1, explain: `z = ${r2(z)}; |z| ${Math.abs(z) > 1.96 ? ">" : "≤"} 1.96.`,
        py: `from scipy.stats import norm\nz = (${x} - ${mu}) / (${s} / ${n} ** 0.5)\nanswer = 0 if 2 * norm.sf(abs(z)) < 0.05 else 1`, packages: SP }; } },
];

// ───────────────────────── Statistics: one-sample t ─────────────────────────
const TONE: Tpl[] = [
  { key: "stat", d: 2, secs: 75, fast: "t = (x̄ − μ₀)/(s/√n), df = n − 1.", trap: "Using n instead of n − 1 for s.",
    make: (r) => { const xs = sample(r, int(r, 6, 12), 40, 70), mu = Math.round(mean(xs) + int(r, -6, 6));
      const t = (mean(xs) - mu) / (sd(xs) / Math.sqrt(xs.length));
      return { prompt: `H₀: μ = ${mu}. Sample: ${xs.join(", ")}. What is the one-sample t statistic?${D2}`, answer: r2(t), tol: 0.02, explain: `x̄ = ${r4(mean(xs))}, s = ${r4(sd(xs))}, n = ${xs.length}: t = ${r2(t)}.`,
        py: `from scipy.stats import ttest_1samp\nanswer = ttest_1samp(${JSON.stringify(xs)}, ${mu}).statistic`, packages: SP }; } },
  { key: "decide", d: 2, secs: 75, fast: "Compare |t| with the two-sided critical value for n − 1 df.", trap: "Using the z critical value 1.96 for a small sample.",
    make: (r) => { const xs = sample(r, int(r, 6, 12), 40, 70), mu = Math.round(mean(xs) + int(r, -8, 8));
      const t = (mean(xs) - mu) / (sd(xs) / Math.sqrt(xs.length)), crit = T975[xs.length - 1];
      if (Math.abs(Math.abs(t) - crit) < 0.1) return null;
      const options = ["Reject H₀", "Fail to reject H₀"];
      return { prompt: `H₀: μ = ${mu} vs H₁: μ ≠ ${mu}. Sample: ${xs.join(", ")}. At α = 0.05 (critical t with ${xs.length - 1} df = ${crit}), what is the decision?`, options, answer: Math.abs(t) > crit ? 0 : 1, explain: `t = ${r2(t)}; |t| ${Math.abs(t) > crit ? ">" : "≤"} ${crit}.`,
        py: `from scipy.stats import ttest_1samp\nanswer = 0 if ttest_1samp(${JSON.stringify(xs)}, ${mu}).pvalue < 0.05 else 1`, packages: SP }; } },
  { key: "bracket", d: 2, secs: 60, fast: "Bracket |t| between the table's 0.05 and 0.01 critical values.", trap: "Reading one-sided levels from a two-sided table.",
    make: (r) => { const df = int(r, 5, 15), t = int(r, 120, 520) / 100;
      const c05 = T975[df], c01 = T995[df];
      if (Math.abs(t - c05) < 0.08 || Math.abs(t - c01) < 0.08) return null;
      const options = ["p > 0.05", "0.01 < p < 0.05", "p < 0.01"];
      return { prompt: `A two-sided one-sample t-test with ${df} df gives t = ${t}. Critical values: ${c05} (α = 0.05) and ${c01} (α = 0.01). Which range contains the p-value?`, options, answer: t < c05 ? 0 : t < c01 ? 1 : 2, explain: `${t} is ${t < c05 ? `below ${c05}` : t < c01 ? `between ${c05} and ${c01}` : `above ${c01}`}.`,
        py: `from scipy.stats import t as T\np = 2 * T.sf(${t}, ${df})\nanswer = 0 if p > 0.05 else 1 if p > 0.01 else 2`, packages: SP }; } },
  { key: "onesided", d: 3, secs: 90, fast: "For H₁: μ > μ₀, reject only if t exceeds the one-sided critical value (and is positive).", trap: "Rejecting for a large negative t in a right-tailed test.",
    make: (r) => { const xs = sample(r, int(r, 6, 12), 40, 70), mu = Math.round(mean(xs) + int(r, -8, 4));
      const t = (mean(xs) - mu) / (sd(xs) / Math.sqrt(xs.length)), crit = T95[xs.length - 1];
      if (Math.abs(t - crit) < 0.1) return null;
      const options = ["Reject H₀", "Fail to reject H₀"];
      return { prompt: `H₀: μ = ${mu} vs H₁: μ > ${mu}. Sample: ${xs.join(", ")}. At α = 0.05 (one-sided critical t with ${xs.length - 1} df = ${crit}), what is the decision?`, options, answer: t > crit ? 0 : 1, explain: `t = ${r2(t)}; ${t > crit ? "above" : "not above"} ${crit}.`,
        py: `from scipy.stats import ttest_1samp\nanswer = 0 if ttest_1samp(${JSON.stringify(xs)}, ${mu}, alternative="greater").pvalue < 0.05 else 1`, packages: SP }; } },
];

// ───────────────────────── Statistics: chi-square ─────────────────────────
const CHI: Tpl[] = [
  { key: "gof", d: 2, secs: 75, fast: "χ² = Σ (O − E)²/E, with E = n/k for a fair die.", trap: "Dividing by O instead of E.",
    make: (r) => { const k = 6, n = pick(r, [60, 120, 180, 240]), e = n / k;
      const O = Array.from({ length: k }, () => e + int(r, -Math.floor(e / 3), Math.floor(e / 3)));
      const diff = n - O.reduce((a, b) => a + b, 0); O[0] += diff;
      if (O.some((o) => o < 1)) return null;
      const chi = O.reduce((s, o) => s + (o - e) ** 2 / e, 0);
      return { prompt: `A die is rolled ${n} times. Counts of faces 1–6: ${O.join(", ")}. What is the chi-square goodness-of-fit statistic for a fair die?${D2}`, answer: r2(chi), tol: 0.02, explain: `E = ${e} per face; Σ (O − E)²/E = ${r2(chi)}.`,
        py: `from scipy.stats import chisquare\nanswer = chisquare(${JSON.stringify(O)}).statistic`, packages: SP }; } },
  { key: "gofdecide", d: 2, secs: 75, fast: "df = categories − 1; reject if χ² > critical value.", trap: "Using df = number of categories.",
    make: (r) => { const k = pick(r, [3, 4, 5]), n = pick(r, [60, 120, 150, 200, 300]);
      if (n % k) return null;
      const e = n / k, O = Array.from({ length: k }, () => e + int(r, -Math.floor(e / 2.5), Math.floor(e / 2.5)));
      O[0] += n - O.reduce((a, b) => a + b, 0);
      const chi = O.reduce((s, o) => s + (o - e) ** 2 / e, 0), crit = CHI95[k - 1];
      if (Math.abs(chi - crit) < 0.3 || O.some((o) => o < 1)) return null;
      const options = ["Reject H₀ (the categories are not equally likely)", "Fail to reject H₀"];
      return { prompt: `Customers chose among ${k} plans equally often under H₀. Observed counts: ${O.join(", ")}. At α = 0.05 (critical χ² with ${k - 1} df = ${crit}), what is the decision?`, options, answer: chi > crit ? 0 : 1, explain: `χ² = ${r2(chi)} with ${k - 1} df; ${chi > crit ? ">" : "≤"} ${crit}.`,
        py: `from scipy.stats import chisquare\nanswer = 0 if chisquare(${JSON.stringify(O)}).pvalue < 0.05 else 1`, packages: SP }; } },
  { key: "indep", d: 3, secs: 90, fast: "Expected cell = row total × column total / grand total; χ² = Σ (O − E)²/E, df = (r − 1)(c − 1).", trap: "Applying Yates' correction when the question does not ask for it.",
    make: (r) => { const t = [[int(r, 20, 80), int(r, 20, 80)], [int(r, 20, 80), int(r, 20, 80)]];
      const R = t.map((row) => row[0] + row[1]), C = [t[0][0] + t[1][0], t[0][1] + t[1][1]], N = R[0] + R[1];
      const chi = t.reduce((s, row, i) => s + row.reduce((u, o, j) => u + (o - (R[i] * C[j]) / N) ** 2 / ((R[i] * C[j]) / N), 0), 0);
      return { prompt: `Device vs purchase:\n\n\`\`\`\n          Bought  Didn't\nMobile    ${String(t[0][0]).padStart(6)}  ${String(t[0][1]).padStart(6)}\nDesktop   ${String(t[1][0]).padStart(6)}  ${String(t[1][1]).padStart(6)}\n\`\`\`\n\nWhat is the chi-square statistic for independence (no continuity correction)?${D2}`, answer: r2(chi), tol: 0.02, explain: `Expected counts from the margins; Σ (O − E)²/E = ${r2(chi)}.`,
        py: `from scipy.stats import chi2_contingency\nanswer = chi2_contingency(${JSON.stringify(t)}, correction=False)[0]`, packages: SP }; } },
  { key: "expected", d: 1, secs: 45, fast: "E = row total × column total / grand total.", trap: "Using the observed count of the cell.",
    make: (r) => { const t = [[int(r, 10, 80), int(r, 10, 80), int(r, 10, 80)], [int(r, 10, 80), int(r, 10, 80), int(r, 10, 80)]], i = int(r, 0, 1), j = int(r, 0, 2);
      const R = t.map((row) => row.reduce((a, b) => a + b, 0)), C = [0, 1, 2].map((c) => t[0][c] + t[1][c]), N = R[0] + R[1];
      return { prompt: `Rows are Men and Women; columns are Tea, Coffee and Juice:\n\n\`\`\`\n        Tea  Coffee  Juice\nMen   ${t[0].map((v) => String(v).padStart(5)).join("  ")}\nWomen ${t[1].map((v) => String(v).padStart(5)).join("  ")}\n\`\`\`\n\nUnder independence, what is the expected count for ${["Men", "Women"][i]} choosing ${["Tea", "Coffee", "Juice"][j]}?${D2}`, answer: r2((R[i] * C[j]) / N), tol: 0.02, explain: `${R[i]} × ${C[j]} / ${N} = ${r2((R[i] * C[j]) / N)}.`,
        py: `from scipy.stats import chi2_contingency\nanswer = chi2_contingency(${JSON.stringify(t)}, correction=False)[3][${i}][${j}]`, packages: SP }; } },
];

function finish(items: GenQ[]): GenQ[] {
  return items.map((q) => (q.options ? { ...q, py: q.py.replace("OPTS", JSON.stringify(q.options)) } : q));
}
void shuffle;

export const B7_TOPICS = {
  normal: "pr-normal", joint: "pr-joint", clt: "pr-lln-clt", classic: "pr-classics",
  sampling: "st-sampling", se: "st-standard-error", est: "st-estimation", ci: "st-confidence-intervals",
  testing: "st-testing", ztest: "st-z-tests", tone: "st-one-sample-t", chi: "st-chi-square",
} as const;

export const B7_ITEMS: GenQ[] = finish([
  ...build(B7_TOPICS.normal, "pr-normal", 7101, NORMAL),
  ...build(B7_TOPICS.joint, "pr-joint", 7102, JOINT),
  ...build(B7_TOPICS.clt, "pr-clt", 7103, CLT),
  ...build(B7_TOPICS.classic, "pr-classic", 7104, CLASSIC),
  ...build(B7_TOPICS.sampling, "st-sampling", 7201, SAMPLING),
  ...build(B7_TOPICS.se, "st-se", 7202, SE),
  ...build(B7_TOPICS.est, "st-est", 7203, EST),
  ...build(B7_TOPICS.ci, "st-ci", 7204, CI),
  ...build(B7_TOPICS.testing, "st-test", 7205, TESTING),
  ...build(B7_TOPICS.ztest, "st-z", 7206, ZTEST),
  ...build(B7_TOPICS.tone, "st-t1", 7207, TONE),
  ...build(B7_TOPICS.chi, "st-chi", 7208, CHI),
]);
