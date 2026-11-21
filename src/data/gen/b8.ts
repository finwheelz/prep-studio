/**
 * Batch 8 generator: the remaining statistics concepts and the first five ML-theory concepts.
 * Python checks: scipy (ANOVA, rank tests, regression, chi-square), statsmodels (multiple testing,
 * CIs for differences), power and sample size by searching n rather than using the formula,
 * scikit-learn (ridge, lasso, losses), and finite differences for every gradient.
 */
import { build, int, pick, type GenQ, type Rng, type Tpl } from "./quant";

const r2 = (x: number) => Math.round(x * 100) / 100;
const r4 = (x: number) => Math.round(x * 10000) / 10000;
const D2 = " Give 2 decimals.";
const D4 = " Give 4 decimals.";
const SP = ["scipy"];
const SK = ["scikit-learn"];
const SM = ["statsmodels"];
function shuffle<T>(a: T[], r: Rng): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
function Phi(z: number) {
  const n = 2000, b = Math.abs(z), h = b / n;
  const f = (x: number) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
  let s = f(0) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(i * h);
  return z >= 0 ? 0.5 + (s * h) / 3 : 0.5 - (s * h) / 3;
}
const Z975 = 1.959963984540054, Z80 = 0.8416212335729143, Z90 = 1.2815515655446004;
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const distinct = (r: Rng, n: number, lo: number, hi: number, used = new Set<number>()) => {
  const out: number[] = [];
  while (out.length < n) { const v = int(r, lo, hi); if (!used.has(v)) { used.add(v); out.push(v); } }
  return out;
};
function mcq(r: Rng, correct: string, pool: string[]) {
  const wrong = shuffle([...new Set(pool.filter((p) => p !== correct))], r).slice(0, 3);
  const options = shuffle([correct, ...wrong], r);
  return { options, answer: options.indexOf(correct) };
}

// ───────────────────────── ANOVA ─────────────────────────
const F95: Record<number, number> = { 12: 3.885, 15: 3.682, 18: 3.555, 21: 3.467, 24: 3.403, 27: 3.354 };
function groups(r: Rng) {
  const n = int(r, 5, 10), shift = [0, int(r, -4, 6), int(r, -4, 6)];
  return shift.map((s) => Array.from({ length: n }, () => 20 + s + int(r, -6, 6)));
}
function anova(g: number[][]) {
  const all = g.flat(), gm = mean(all);
  const ssb = g.reduce((s, x) => s + x.length * (mean(x) - gm) ** 2, 0);
  const ssw = g.reduce((s, x) => { const m = mean(x); return s + x.reduce((u, v) => u + (v - m) ** 2, 0); }, 0);
  const k = g.length, N = all.length;
  return { ssb, ssw, dfb: k - 1, dfw: N - k, F: ssb / (k - 1) / (ssw / (N - k)) };
}
const gtxt = (g: number[][]) => g.map((x, i) => `- Group ${"ABC"[i]}: ${x.join(", ")}`).join("\n");
const ANOVA: Tpl[] = [
  { key: "f", d: 2, secs: 120, fast: "F = (SSB/(k − 1)) / (SSW/(N − k)).", trap: "Dividing SSB by N − 1 instead of k − 1.",
    make: (r) => { const g = groups(r), a = anova(g);
      return { prompt: `Three groups:\n\n${gtxt(g)}\n\nWhat is the one-way ANOVA F statistic?${D2}`, answer: r2(a.F), tol: 0.02, explain: `SSB = ${r2(a.ssb)} (df ${a.dfb}), SSW = ${r2(a.ssw)} (df ${a.dfw}); F = ${r2(a.F)}.`,
        py: `from scipy.stats import f_oneway\nanswer = f_oneway(*${JSON.stringify(g)}).statistic`, packages: SP }; } },
  { key: "ssb", d: 2, secs: 90, fast: "SSB = Σ nᵢ (group mean − grand mean)².", trap: "Forgetting to weight by group size.",
    make: (r) => { const g = groups(r), a = anova(g);
      return { prompt: `Three groups:\n\n${gtxt(g)}\n\nWhat is the between-groups sum of squares (SSB)?${D2}`, answer: r2(a.ssb), tol: 0.02, explain: `Σ nᵢ(ȳᵢ − ȳ)² = ${r2(a.ssb)}.`,
        py: `g = ${JSON.stringify(g)}\nallv = [v for x in g for v in x]\nm = sum(allv) / len(allv)\nsst = sum((v - m) ** 2 for v in allv)\nssw = sum(sum((v - sum(x) / len(x)) ** 2 for v in x) for x in g)\nanswer = sst - ssw` }; } },
  { key: "ms", d: 2, secs: 90, fast: "MSW = SSW/(N − k): the pooled within-group variance.", trap: "Using N − 1 degrees of freedom.",
    make: (r) => { const g = groups(r), a = anova(g);
      return { prompt: `Three groups:\n\n${gtxt(g)}\n\nWhat is the mean square within groups (MSW)?${D2}`, answer: r2(a.ssw / a.dfw), tol: 0.02, explain: `SSW = ${r2(a.ssw)}, df = ${a.dfw}: MSW = ${r2(a.ssw / a.dfw)}.`,
        py: `import statistics\ng = ${JSON.stringify(g)}\nanswer = sum(statistics.variance(x) * (len(x) - 1) for x in g) / (sum(map(len, g)) - len(g))` }; } },
  { key: "decide", d: 2, secs: 120, fast: "Reject H₀ (all means equal) when F exceeds F(0.95; k − 1, N − k).", trap: "Concluding which groups differ from the F test alone (that needs post-hoc tests).",
    make: (r) => { const g = groups(r), a = anova(g), crit = F95[a.dfw];
      if (!crit || Math.abs(a.F - crit) < 0.3) return null;
      const options = ["Reject H₀: at least one group mean differs", "Fail to reject H₀"];
      return { prompt: `Three groups:\n\n${gtxt(g)}\n\nAt α = 0.05 (critical F with ${a.dfb} and ${a.dfw} df = ${crit}), what does one-way ANOVA conclude?`, options, answer: a.F > crit ? 0 : 1, explain: `F = ${r2(a.F)} ${a.F > crit ? ">" : "≤"} ${crit}.`,
        py: `from scipy.stats import f_oneway\nanswer = 0 if f_oneway(*${JSON.stringify(g)}).pvalue < 0.05 else 1`, packages: SP }; } },
];

// ───────────────────────── Non-parametric ─────────────────────────
const NONPAR: Tpl[] = [
  { key: "mwu", d: 2, secs: 90, fast: "U for A = number of (a, b) pairs with a > b.", trap: "Reporting the rank sum instead of U.",
    make: (r) => { const used = new Set<number>(); const a = distinct(r, int(r, 4, 7), 10, 60, used), b = distinct(r, int(r, 4, 7), 10, 60, used);
      const U = a.reduce((s, x) => s + b.filter((y) => x > y).length, 0);
      return { prompt: `Group A: ${a.join(", ")}. Group B: ${b.join(", ")}. What is the Mann–Whitney U statistic for group A (pairs where A's value exceeds B's)?`, answer: U, tol: 0, explain: `Count, for each A value, the B values below it: total ${U}.`,
        py: `from scipy.stats import mannwhitneyu\nanswer = mannwhitneyu(${JSON.stringify(a)}, ${JSON.stringify(b)}).statistic`, packages: SP }; } },
  { key: "wilcoxon", d: 2, secs: 90, fast: "Rank |differences|, then add the ranks of the positive differences: W⁺.", trap: "Ranking the signed differences instead of their absolute values.",
    make: (r) => { const n = int(r, 6, 9), mags = distinct(r, n, 1, 25), d = mags.map((m) => (r() < 0.65 ? m : -m));
      const ranks = new Map([...mags].sort((x, y) => x - y).map((m, i) => [m, i + 1]));
      const W = d.filter((x) => x > 0).reduce((s, x) => s + ranks.get(x)!, 0);
      return { prompt: `Paired differences (after − before): ${d.join(", ")}. What is the Wilcoxon signed-rank statistic W⁺ (sum of ranks of the positive differences)?`, answer: W, tol: 0, explain: `Rank |d| from 1 to ${n}; positive differences have ranks summing to ${W}.`,
        py: `from scipy.stats import wilcoxon\nanswer = wilcoxon(${JSON.stringify(d)}, alternative="greater").statistic`, packages: SP }; } },
  { key: "kw", d: 3, secs: 120, fast: "H = 12/(N(N + 1)) Σ Rᵢ²/nᵢ − 3(N + 1), with Rᵢ the rank sums.", trap: "Using group means instead of rank sums.",
    make: (r) => { const used = new Set<number>(); const g = [distinct(r, int(r, 4, 6), 10, 80, used), distinct(r, int(r, 4, 6), 10, 80, used), distinct(r, int(r, 4, 6), 10, 80, used)];
      const all = g.flat().sort((x, y) => x - y), rank = new Map(all.map((v, i) => [v, i + 1])), N = all.length;
      const H = (12 / (N * (N + 1))) * g.reduce((s, x) => s + x.reduce((u, v) => u + rank.get(v)!, 0) ** 2 / x.length, 0) - 3 * (N + 1);
      return { prompt: `Three groups:\n\n${gtxt(g)}\n\nWhat is the Kruskal–Wallis H statistic?${D2}`, answer: r2(H), tol: 0.02, explain: `Rank all ${N} values, sum ranks per group, apply the formula: H = ${r2(H)}.`,
        py: `from scipy.stats import kruskal\nanswer = kruskal(*${JSON.stringify(g)}).statistic`, packages: SP }; } },
  { key: "ranksum", d: 1, secs: 60, fast: "Combine both groups, rank from smallest (1), add group A's ranks.", trap: "Ranking within each group separately.",
    make: (r) => { const used = new Set<number>(); const a = distinct(r, int(r, 3, 6), 1, 50, used), b = distinct(r, int(r, 3, 6), 1, 50, used);
      const all = [...a, ...b].sort((x, y) => x - y), R = a.reduce((s, v) => s + all.indexOf(v) + 1, 0);
      return { prompt: `Group A: ${a.join(", ")}. Group B: ${b.join(", ")}. Ranking all values together (smallest = 1), what is the sum of group A's ranks?`, answer: R, tol: 0, explain: `Combined ranks of A's values add to ${R}.`,
        py: `from scipy.stats import rankdata\nrk = rankdata(${JSON.stringify([...a, ...b])})\nanswer = sum(rk[:${a.length}])`, packages: SP }; } },
];

// ───────────────────────── Power and sample size ─────────────────────────
const POWER: Tpl[] = [
  { key: "nprop", d: 2, secs: 90, fast: "n per group = (z_{α/2} + z_β)² (p₁q₁ + p₂q₂)/(p₁ − p₂)².", trap: "Using the total sample size as the per-group size.",
    make: (r) => { const p1 = pick(r, [0.05, 0.1, 0.12, 0.2, 0.3]), lift = pick(r, [0.01, 0.02, 0.03, 0.05]), p2 = r4(p1 + lift);
      const n = Math.ceil(((Z975 + Z80) ** 2 * (p1 * (1 - p1) + p2 * (1 - p2))) / (p2 - p1) ** 2);
      return { prompt: `A checkout converts at ${p1 * 100}%. You want 80% power to detect a rise to ${r2(p2 * 100)}% with a two-sided test at α = 0.05 (z = 1.96 and 0.8416). How many users are needed in each group?`, answer: n, tol: 0, explain: `(1.96 + 0.8416)² × (${p1}·${r4(1 - p1)} + ${p2}·${r4(1 - p2)}) / ${lift}² ≈ ${n}.`,
        py: `from scipy.stats import norm\np1, p2 = ${p1}, ${p2}\nz = norm.ppf(0.975)\nv = p1 * (1 - p1) + p2 * (1 - p2)\npower = lambda n: norm.cdf(abs(p2 - p1) / (v / n) ** 0.5 - z)\nlo, hi = 1, 10**8\nwhile lo < hi:\n    mid = (lo + hi) // 2\n    if power(mid) >= 0.8: hi = mid\n    else: lo = mid + 1\nanswer = lo`, packages: SP }; } },
  { key: "nmean", d: 2, secs: 75, fast: "n per group = 2(z_{α/2} + z_β)² σ²/δ².", trap: "Forgetting the factor 2 for two groups.",
    make: (r) => { const s = int(r, 5, 40), d = int(r, 2, 12), pw = pick(r, [80, 90]), zb = pw === 80 ? Z80 : Z90;
      const n = Math.ceil((2 * (Z975 + zb) ** 2 * s * s) / (d * d));
      return { prompt: `Order values have SD ₹${s}. How many customers per group are needed for ${pw}% power to detect a ₹${d} difference in means (two-sided α = 0.05; z = 1.96 and ${pw === 80 ? 0.8416 : 1.2816})?`, answer: n, tol: 0, explain: `2 × (1.96 + ${pw === 80 ? 0.8416 : 1.2816})² × ${s}² / ${d}² ≈ ${n}.`,
        py: `from scipy.stats import norm\nz, target = norm.ppf(0.975), ${pw / 100}\npower = lambda n: norm.cdf(${d} / (${s} * (2 / n) ** 0.5) - z)\nanswer = next(n for n in range(2, 10**7) if power(n) >= target)`, packages: SP }; } },
  { key: "power", d: 2, secs: 75, fast: "Power ≈ Φ(δ/SE − 1.96) + Φ(−δ/SE − 1.96), SE = σ√(2/n).", trap: "Ignoring that SE uses both groups (the √2).",
    make: (r) => { const s = int(r, 5, 30), d = int(r, 1, 10), n = pick(r, [20, 50, 100, 200, 400]);
      const se = s * Math.sqrt(2 / n), pw = Phi(d / se - Z975) + Phi(-d / se - Z975);
      return { prompt: `Two groups of ${n}, SD ${s}, true difference in means ${d}. What is the power of a two-sided z-test at α = 0.05?${D4}`, answer: r4(pw), tol: 0.0002, explain: `SE = ${r4(se)}; power = ${r4(pw)}.`,
        py: `from scipy.stats import norm\nse = ${s} * (2 / ${n}) ** 0.5\nc = norm.ppf(0.975) * se\nanswer = norm.sf(c, ${d}, se) + norm.cdf(-c, ${d}, se)`, packages: SP }; } },
  { key: "mde", d: 3, secs: 75, fast: "MDE ≈ (z_{α/2} + z_β) × σ √(2/n).", trap: "Using only z_{α/2}, which gives 50% power.",
    make: (r) => { const s = int(r, 5, 40), n = pick(r, [50, 100, 200, 500, 1000]);
      const mde = (Z975 + Z80) * s * Math.sqrt(2 / n);
      return { prompt: `With ${n} users per group and SD ${s}, what is the minimum detectable difference in means at 80% power (two-sided α = 0.05; z = 1.96 and 0.8416)?${D2}`, answer: r2(mde), tol: 0.02, explain: `(1.96 + 0.8416) × ${s} × √(2/${n}) = ${r2(mde)}.`,
        py: `from scipy.stats import norm\nse = ${s} * (2 / ${n}) ** 0.5\nz = norm.ppf(0.975)\nlo, hi = 0.0, 1000.0\nfor _ in range(200):\n    mid = (lo + hi) / 2\n    if norm.cdf(mid / se - z) >= 0.8: hi = mid\n    else: lo = mid\nanswer = hi`, packages: SP }; } },
];

// ───────────────────────── A/B testing in practice ─────────────────────────
const AB: Tpl[] = [
  { key: "srm", d: 2, secs: 60, fast: "SRM check: χ² against the planned split; a tiny p-value means the experiment is broken.", trap: "Ignoring an imbalanced split because the difference 'looks small'.",
    make: (r) => { const N = pick(r, [10000, 20000, 50000, 100000]), a = Math.round(N / 2 + int(r, -60, 60) * (N / 10000) * 3), b = N - a;
      const e = N / 2, chi = ((a - e) ** 2 + (b - e) ** 2) / e;
      return { prompt: `An experiment planned a 50/50 split; control got ${a.toLocaleString("en-IN")} users and treatment ${b.toLocaleString("en-IN")}. What is the chi-square statistic for a sample ratio mismatch check?${D2}`, answer: r2(chi), tol: 0.02, explain: `Expected ${e} each: ((${a} − ${e})² + (${b} − ${e})²)/${e} = ${r2(chi)}${chi > 3.841 ? " > 3.841: investigate the assignment before reading results" : ""}.`,
        py: `from scipy.stats import chisquare\nanswer = chisquare([${a}, ${b}]).statistic`, packages: SP }; } },
  { key: "lift", d: 1, secs: 45, fast: "Relative lift = (p_B − p_A)/p_A × 100.", trap: "Reporting the absolute difference in percentage points as the lift.",
    make: (r) => { const nA = pick(r, [5000, 8000, 10000]), nB = nA, xA = Math.round(nA * int(r, 30, 150) / 1000), xB = Math.round(nB * int(r, 30, 150) / 1000);
      const lift = ((xB / nB - xA / nA) / (xA / nA)) * 100;
      return { prompt: `Control: ${xA} conversions from ${nA} users. Treatment: ${xB} from ${nB}. What is the relative lift of treatment over control, in %? Give a negative number for a drop.${D2}`, answer: r2(lift), tol: 0.02, explain: `${r4(xA / nA)} → ${r4(xB / nB)}: (${r4(xB / nB)} − ${r4(xA / nA)})/${r4(xA / nA)} = ${r2(lift)}%.`,
        py: `pa, pb = ${xA} / ${nA}, ${xB} / ${nB}\nanswer = (pb / pa - 1) * 100` }; } },
  { key: "ci", d: 3, secs: 90, fast: "CI for p_B − p_A: difference ± 1.96 √(p_A q_A/n_A + p_B q_B/n_B) (unpooled).", trap: "Using the pooled SE (that is for the test, not the interval).",
    make: (r) => { const n = pick(r, [4000, 5000, 10000]), xA = Math.round(n * int(r, 50, 150) / 1000), xB = Math.round(n * int(r, 50, 150) / 1000);
      const pA = xA / n, pB = xB / n, se = Math.sqrt((pA * (1 - pA)) / n + (pB * (1 - pB)) / n), lo = pB - pA - Z975 * se;
      return { prompt: `Control: ${xA}/${n} converted. Treatment: ${xB}/${n}. What is the lower bound of the 95% confidence interval for p_treatment − p_control (Wald, unpooled)?${D4}`, answer: r4(lo), tol: 0.0002, explain: `Difference ${r4(pB - pA)}, SE ${r4(se)}: ${r4(pB - pA)} − 1.96 × ${r4(se)} = ${r4(lo)}.`,
        py: `from statsmodels.stats.proportion import confint_proportions_2indep\nanswer = confint_proportions_2indep(${xB}, ${n}, ${xA}, ${n}, method="wald", compare="diff")[0]`, packages: SM }; } },
  { key: "days", d: 1, secs: 45, fast: "Days = total users needed / daily eligible traffic, rounded up (and run whole weeks).", trap: "Forgetting that both groups need n users.",
    make: (r) => { const n = int(r, 20, 200) * 100, traffic = int(r, 10, 80) * 100;
      return { prompt: `A test needs ${n.toLocaleString("en-IN")} users per group (two groups). The page gets ${traffic.toLocaleString("en-IN")} eligible users per day, all of whom enter the test. What is the minimum number of whole days to run it?`, answer: Math.ceil((2 * n) / traffic), tol: 0, explain: `2 × ${n} / ${traffic} = ${r2((2 * n) / traffic)} → ${Math.ceil((2 * n) / traffic)} days (in practice round up to whole weeks).`,
        py: `answer = next(d for d in range(1, 10**6) if d * ${traffic} >= 2 * ${n})` }; } },
];

// ───────────────────────── Multiple testing ─────────────────────────
function pvals(r: Rng) {
  const m = int(r, 6, 12);
  return Array.from({ length: m }, () => pick(r, [0.0004, 0.001, 0.002, 0.004, 0.006, 0.008, 0.011, 0.015, 0.02, 0.025, 0.03, 0.04, 0.06, 0.09, 0.2, 0.35, 0.5, 0.71])).sort((a, b) => a - b);
}
const bh = (p: number[], a: number) => { const m = p.length; let k = 0; p.forEach((v, i) => { if (v <= ((i + 1) / m) * a) k = i + 1; }); return k; };
const holm = (p: number[], a: number) => { const m = p.length; let k = 0; for (let i = 0; i < m; i++) { if (p[i] <= a / (m - i)) k++; else break; } return k; };
const MULTI: Tpl[] = [
  { key: "bonf", d: 1, secs: 45, fast: "Bonferroni: reject only p ≤ α/m.", trap: "Comparing each p with α.",
    make: (r) => { const p = pvals(r), m = p.length;
      return { prompt: `${m} hypotheses give p-values ${p.join(", ")}. With a Bonferroni correction at α = 0.05, how many are rejected?`, answer: p.filter((v) => v <= 0.05 / m).length, tol: 0, explain: `Threshold 0.05/${m} = ${r4(0.05 / m)}.`,
        py: `from statsmodels.stats.multitest import multipletests\nanswer = int(sum(multipletests(${JSON.stringify(p)}, alpha=0.05, method="bonferroni")[0]))`, packages: SM }; } },
  { key: "bh", d: 2, secs: 75, fast: "BH: sort p-values; find the largest k with p₍ₖ₎ ≤ (k/m)α; reject the k smallest.", trap: "Stopping at the first p-value that fails, as in Holm.",
    make: (r) => { const p = pvals(r), m = p.length;
      return { prompt: `${m} hypotheses give p-values ${p.join(", ")}. With the Benjamini–Hochberg procedure at FDR 0.05, how many are rejected?`, answer: bh(p, 0.05), tol: 0, explain: `Largest k with p₍ₖ₎ ≤ k × 0.05/${m} is ${bh(p, 0.05)}.`,
        py: `from statsmodels.stats.multitest import multipletests\nanswer = int(sum(multipletests(${JSON.stringify(p)}, alpha=0.05, method="fdr_bh")[0]))`, packages: SM }; } },
  { key: "holm", d: 2, secs: 75, fast: "Holm: compare the i-th smallest p with α/(m − i + 1); stop at the first failure.", trap: "Continuing past the first non-rejection.",
    make: (r) => { const p = pvals(r), m = p.length;
      return { prompt: `${m} hypotheses give p-values ${p.join(", ")}. With Holm's step-down procedure at α = 0.05, how many are rejected?`, answer: holm(p, 0.05), tol: 0, explain: `Compare p₍₁₎ with 0.05/${m}, p₍₂₎ with 0.05/${m - 1}, …; stop at the first failure: ${holm(p, 0.05)} rejected.`,
        py: `from statsmodels.stats.multitest import multipletests\nanswer = int(sum(multipletests(${JSON.stringify(p)}, alpha=0.05, method="holm")[0]))`, packages: SM }; } },
  { key: "fwer", d: 1, secs: 30, fast: "P(at least one false positive in m independent true nulls) = 1 − (1 − α)^m.", trap: "Answering m × α (only an upper bound, and it can exceed 1).",
    make: (r) => { const m = int(r, 2, 40), a = pick(r, [0.01, 0.05, 0.1]);
      return { prompt: `You run ${m} independent tests where every null hypothesis is true, each at α = ${a}. What is the probability of at least one false positive?${D4}`, answer: r4(1 - (1 - a) ** m), tol: 0.0002, explain: `1 − (1 − ${a})^${m} = ${r4(1 - (1 - a) ** m)}.`,
        py: `from scipy.stats import binom\nanswer = 1 - binom.pmf(0, ${m}, ${a})`, packages: SP }; } },
];

// ───────────────────────── Regression inference ─────────────────────────
function regData(r: Rng) {
  const n = int(r, 6, 9), b0 = int(r, -5, 10), b1 = int(r, -30, 30) / 10;
  const x = Array.from({ length: n }, (_, i) => i + 1 + int(r, 0, 1) * 0);
  const y = x.map((v) => r2(b0 + b1 * v + int(r, -30, 30) / 10));
  return { x, y };
}
function ols(x: number[], y: number[]) {
  const mx = mean(x), my = mean(y), sxx = x.reduce((s, v) => s + (v - mx) ** 2, 0), sxy = x.reduce((s, v, i) => s + (v - mx) * (y[i] - my), 0);
  const b1 = sxy / sxx, b0 = my - b1 * mx;
  const sse = y.reduce((s, v, i) => s + (v - b0 - b1 * x[i]) ** 2, 0), sst = y.reduce((s, v) => s + (v - my) ** 2, 0);
  const se = Math.sqrt(sse / (x.length - 2) / sxx);
  return { b0, b1, r2: 1 - sse / sst, t: b1 / se };
}
const pts = (x: number[], y: number[]) => x.map((v, i) => `(${v}, ${y[i]})`).join(", ");
const REG: Tpl[] = [
  { key: "slope", d: 2, secs: 90, fast: "b₁ = Σ(x − x̄)(y − ȳ)/Σ(x − x̄)².", trap: "Dividing by Σ(y − ȳ)².",
    make: (r) => { const { x, y } = regData(r), o = ols(x, y);
      return { prompt: `Fit y = b₀ + b₁x by least squares to the points ${pts(x, y)}. What is b₁?${D4}`, answer: r4(o.b1), tol: 0.0002, explain: `b₁ = Sxy/Sxx = ${r4(o.b1)}.`,
        py: `from scipy.stats import linregress\nanswer = linregress(${JSON.stringify(x)}, ${JSON.stringify(y)}).slope`, packages: SP }; } },
  { key: "intercept", d: 2, secs: 90, fast: "b₀ = ȳ − b₁ x̄.", trap: "Using b₀ = ȳ.",
    make: (r) => { const { x, y } = regData(r), o = ols(x, y);
      return { prompt: `Fit y = b₀ + b₁x by least squares to the points ${pts(x, y)}. What is b₀?${D4}`, answer: r4(o.b0), tol: 0.0002, explain: `b₁ = ${r4(o.b1)}; b₀ = ȳ − b₁x̄ = ${r4(o.b0)}.`,
        py: `from scipy.stats import linregress\nanswer = linregress(${JSON.stringify(x)}, ${JSON.stringify(y)}).intercept`, packages: SP }; } },
  { key: "r2", d: 2, secs: 90, fast: "R² = 1 − SSE/SST (= r² in simple regression).", trap: "Reporting r instead of r².",
    make: (r) => { const { x, y } = regData(r), o = ols(x, y);
      return { prompt: `For the least-squares line through ${pts(x, y)}, what is R²?${D4}`, answer: r4(o.r2), tol: 0.0002, explain: `1 − SSE/SST = ${r4(o.r2)}.`,
        py: `from scipy.stats import linregress\nanswer = linregress(${JSON.stringify(x)}, ${JSON.stringify(y)}).rvalue ** 2`, packages: SP }; } },
  { key: "t", d: 3, secs: 120, fast: "t = b₁ / SE(b₁), SE(b₁) = √(SSE/(n − 2) / Σ(x − x̄)²), df = n − 2.", trap: "Using n − 1 degrees of freedom for the residual variance.",
    make: (r) => { const { x, y } = regData(r), o = ols(x, y);
      return { prompt: `For the least-squares line through ${pts(x, y)}, what is the t statistic for testing H₀: slope = 0? Give a negative number if needed.${D2}`, answer: r2(o.t), tol: 0.02, explain: `t = b₁/SE(b₁) = ${r2(o.t)} with ${x.length - 2} df.`,
        py: `from scipy.stats import linregress\nres = linregress(${JSON.stringify(x)}, ${JSON.stringify(y)})\nanswer = res.slope / res.stderr`, packages: SP }; } },
];

// ───────────────────────── Which test? (decision tree) ─────────────────────────
type Feat = { outcome: "cont" | "bin" | "cat"; design: "one" | "two" | "paired" | "many" | "assoc"; normal: boolean };
const TESTS = ["One-sample t-test", "Wilcoxon signed-rank test", "Welch's two-sample t-test", "Mann–Whitney U test", "Paired t-test", "One-way ANOVA", "Kruskal–Wallis test", "Pearson correlation", "Spearman correlation", "Chi-square test of independence", "Two-proportion z-test", "One-proportion z-test", "Chi-square goodness-of-fit test"];
function whichTest(f: Feat): string {
  if (f.outcome === "cont") {
    if (f.design === "one") return f.normal ? "One-sample t-test" : "Wilcoxon signed-rank test";
    if (f.design === "two") return f.normal ? "Welch's two-sample t-test" : "Mann–Whitney U test";
    if (f.design === "paired") return f.normal ? "Paired t-test" : "Wilcoxon signed-rank test";
    if (f.design === "many") return f.normal ? "One-way ANOVA" : "Kruskal–Wallis test";
    return f.normal ? "Pearson correlation" : "Spearman correlation";
  }
  if (f.outcome === "bin") {
    if (f.design === "one") return "One-proportion z-test";
    if (f.design === "two") return "Two-proportion z-test";
    return "Chi-square test of independence";
  }
  return f.design === "one" ? "Chi-square goodness-of-fit test" : "Chi-square test of independence";
}
const PY_TREE = `def which(f):
    o, d, n = f["outcome"], f["design"], f["normal"]
    if o == "cont":
        table = {"one": ("One-sample t-test", "Wilcoxon signed-rank test"), "two": ("Welch's two-sample t-test", "Mann–Whitney U test"),
                 "paired": ("Paired t-test", "Wilcoxon signed-rank test"), "many": ("One-way ANOVA", "Kruskal–Wallis test"),
                 "assoc": ("Pearson correlation", "Spearman correlation")}
        return table[d][0 if n else 1]
    if o == "bin":
        return {"one": "One-proportion z-test", "two": "Two-proportion z-test"}.get(d, "Chi-square test of independence")
    return "Chi-square goodness-of-fit test" if d == "one" else "Chi-square test of independence"
`;
function scenario(r: Rng, f: Feat): string | null {
  const shape = f.normal ? "roughly normal" : "heavily skewed, with a few extreme values, in a small sample";
  if (f.outcome === "cont") {
    const metric = pick(r, ["session length (minutes)", "order value (₹)", "page load time (ms)", "exam score"]);
    if (f.design === "one") return `You measure ${metric} for 25 users and want to know whether its mean differs from last year's benchmark. The data are ${shape}.`;
    if (f.design === "two") return `You compare ${metric} between two independent groups of users (old vs new design). The data are ${shape}.`;
    if (f.design === "paired") return `You measure ${metric} for the same 20 users before and after a change. The differences are ${shape}.`;
    if (f.design === "many") return `You compare ${metric} across four independent groups of users (four pricing plans). The data are ${shape}.`;
    return `You want to know whether two numeric variables, ${metric} and number of visits, move together for the same users. The relationship looks ${f.normal ? "linear with roughly normal variables" : "monotonic but curved, with outliers"}.`;
  }
  if (f.outcome === "bin") {
    if (f.design === "one") return "You want to test whether your sign-up rate (signed up: yes/no) differs from the industry's 12%, using 2,000 visitors.";
    if (f.design === "two") return "In an A/B test you compare the conversion rate (converted: yes/no) of two independent groups of 10,000 users each.";
    if (f.design === "many") return "You compare the share of users who churn (yes/no) across five independent customer segments.";
    return null;
  }
  if (f.design === "one") return "You check whether customers' choice among four product colours matches the stock mix you planned (40%, 30%, 20%, 10%).";
  if (f.design === "assoc" || f.design === "many") return "You want to know whether the preferred payment method (card, UPI, cash) is related to the customer's city tier (1, 2 or 3).";
  return null;
}
const TREE: Tpl[] = [0, 1, 2, 3].map((k): Tpl => ({
  key: `s${k}`, d: 2, secs: 45,
  fast: "Ask in order: what type is the outcome (numeric, yes/no, category)? How many groups, independent or paired? Is the numeric outcome roughly normal?",
  trap: "Choosing a t-test for yes/no outcomes, or an independent test for paired data.",
  make: (r) => {
    const f: Feat = { outcome: pick(r, ["cont", "cont", "cont", "bin", "cat"] as const), design: pick(r, ["one", "two", "paired", "many", "assoc"] as const), normal: r() < 0.5 };
    const text = scenario(r, f);
    if (!text) return null;
    const ans = whichTest(f);
    const { options, answer } = mcq(r, ans, TESTS);
    return { prompt: `${text} Which test fits best?`, options, answer, explain: `Outcome: ${{ cont: "numeric", bin: "yes/no", cat: "categorical" }[f.outcome]}; design: ${{ one: "one sample vs a reference", two: "two independent groups", paired: "paired measurements", many: "three or more groups", assoc: "association between two variables" }[f.design]}${f.outcome === "cont" ? `; ${f.normal ? "roughly normal" : "not normal → rank-based"}` : ""}. → ${ans}.`,
      py: `${PY_TREE}\nf = ${JSON.stringify(f).replace(/true/g, "True").replace(/false/g, "False")}\nopts = OPTS\nanswer = opts.index(which(f))` };
  },
}));

// ───────────────────────── ML: bias–variance ─────────────────────────
const BV: Tpl[] = [
  { key: "mse", d: 3, secs: 90, fast: "MSE = bias² + variance: for c·x̄, bias = (c − 1)μ and variance = c²σ²/n.", trap: "Assuming the unbiased estimator (c = 1) always has the lowest MSE.",
    make: (r) => { const k = pick(r, [4, 6]), n = pick(r, [2, 3]), c = pick(r, [0.5, 0.8, 0.9, 1, 1.1]);
      const mu = (k + 1) / 2, s2 = (k * k - 1) / 12, mse = ((c - 1) * mu) ** 2 + (c * c * s2) / n;
      return { prompt: `You estimate the mean of a fair ${k}-sided die (faces 1–${k}) by θ̂ = ${c} × x̄ from samples of size ${n} (with replacement). What is the MSE of θ̂?${D4}`, answer: r4(mse), tol: 0.0002, explain: `bias = (${c} − 1) × ${mu} = ${r4((c - 1) * mu)}; variance = ${c}² × ${r4(s2)}/${n} = ${r4((c * c * s2) / n)}; MSE = ${r4(mse)}.`,
        py: `import itertools\nmu = ${mu}\nests = [${c} * sum(s) / ${n} for s in itertools.product(range(1, ${k} + 1), repeat=${n})]\nanswer = sum((e - mu) ** 2 for e in ests) / len(ests)` }; } },
  { key: "bias", d: 2, secs: 60, fast: "Bias = E[θ̂] − θ.", trap: "Confusing bias with variance.",
    make: (r) => { const k = pick(r, [4, 6, 8]), n = pick(r, [2, 3]), c = pick(r, [0.5, 0.7, 0.8, 0.9, 1.2]);
      const mu = (k + 1) / 2;
      return { prompt: `θ̂ = ${c} × x̄ estimates the mean of a fair ${k}-sided die from samples of size ${n}. What is the bias of θ̂? Give a negative number if needed.${D4}`, answer: r4((c - 1) * mu), tol: 0.0002, explain: `E[θ̂] = ${c} × ${mu}; bias = ${r4((c - 1) * mu)}.`,
        py: `import itertools\nests = [${c} * sum(s) / ${n} for s in itertools.product(range(1, ${k} + 1), repeat=${n})]\nanswer = sum(ests) / len(ests) - ${mu}` }; } },
  { key: "var", d: 2, secs: 60, fast: "Var(c·x̄) = c²σ²/n: shrinking towards 0 cuts variance by c².", trap: "Multiplying the variance by c instead of c².",
    make: (r) => { const k = pick(r, [4, 6, 8]), n = pick(r, [2, 3]), c = pick(r, [0.5, 0.7, 0.8, 0.9, 1.2]);
      const s2 = (k * k - 1) / 12;
      return { prompt: `θ̂ = ${c} × x̄ estimates the mean of a fair ${k}-sided die from samples of size ${n}. What is the variance of θ̂?${D4}`, answer: r4((c * c * s2) / n), tol: 0.0002, explain: `${c}² × ${r4(s2)}/${n} = ${r4((c * c * s2) / n)}.`,
        py: `import itertools, statistics\nests = [${c} * sum(s) / ${n} for s in itertools.product(range(1, ${k} + 1), repeat=${n})]\nanswer = statistics.pvariance(ests)` }; } },
  { key: "diagnose", d: 1, secs: 45, fast: "High training error → bias (underfit). Low training error but much higher validation error → variance (overfit).", trap: "Adding more data to fix high bias (it fixes variance).",
    make: (r) => { const target = 5, kind = pick(r, ["bias", "var", "good"] as const);
      const train = kind === "bias" ? int(r, 14, 30) : int(r, 1, 6), val = kind === "bias" ? train + int(r, 0, 3) : kind === "var" ? train + int(r, 9, 25) : train + int(r, 0, 3);
      const options = ["High bias (underfitting)", "High variance (overfitting)", "Reasonable fit"];
      const label = train > 2 * target ? 0 : val - train > target ? 1 : 2;
      return { prompt: `The acceptable error for a task is about ${target}%. A model has ${train}% training error and ${val}% validation error. What is the main problem?`, options, answer: label, explain: `Training error ${train}% vs target ${target}%; gap to validation ${val - train} points → ${options[label].toLowerCase()}.`,
        py: `train, val, target = ${train}, ${val}, ${target}\nanswer = 0 if train > 2 * target else 1 if val - train > target else 2` }; } },
];

// ───────────────────────── ML: regularisation ─────────────────────────
const REGL: Tpl[] = [
  { key: "ridge1d", d: 2, secs: 75, fast: "1-D ridge (no intercept): w = Σxy / (Σx² + λ).", trap: "Adding λ to the numerator.",
    make: (r) => { const n = int(r, 4, 7), x = Array.from({ length: n }, () => int(r, -5, 5) || 1), y = x.map((v) => v * int(r, 1, 3) + int(r, -2, 2)), lam = pick(r, [0.5, 1, 2, 5, 10]);
      const sxy = x.reduce((s, v, i) => s + v * y[i], 0), sxx = x.reduce((s, v) => s + v * v, 0);
      return { prompt: `Ridge regression without an intercept, minimising Σ(y − wx)² + ${lam}w², on x = (${x.join(", ")}), y = (${y.join(", ")}). What is w?${D4}`, answer: r4(sxy / (sxx + lam)), tol: 0.0002, explain: `Σxy = ${sxy}, Σx² = ${sxx}: w = ${sxy}/(${sxx} + ${lam}) = ${r4(sxy / (sxx + lam))}.`,
        py: `import numpy as np\nfrom sklearn.linear_model import Ridge\nm = Ridge(alpha=${lam}, fit_intercept=False).fit(np.array(${JSON.stringify(x)}, float).reshape(-1, 1), np.array(${JSON.stringify(y)}, float))\nanswer = float(m.coef_[0])`, packages: SK }; } },
  { key: "lasso1d", d: 3, secs: 90, fast: "1-D lasso with sklearn's objective (1/2n)Σ(y − wx)² + α|w|: w = S(Σxy/n, α)/(Σx²/n), S = soft-threshold.", trap: "Forgetting the 1/(2n) scaling of sklearn's loss.",
    make: (r) => { const n = int(r, 4, 7), x = Array.from({ length: n }, () => int(r, -5, 5) || 1), y = x.map((v) => v * int(r, -2, 3) + int(r, -3, 3)), a = pick(r, [0.1, 0.5, 1, 2, 4]);
      const z = x.reduce((s, v, i) => s + v * y[i], 0) / n, q = x.reduce((s, v) => s + v * v, 0) / n;
      const w = (Math.sign(z) * Math.max(Math.abs(z) - a, 0)) / q;
      return { prompt: `scikit-learn's Lasso (no intercept) minimises (1/(2n))Σ(y − wx)² + α|w|. With α = ${a}, x = (${x.join(", ")}), y = (${y.join(", ")}), what is w? Give a negative number if needed.${D4}`, answer: r4(w), tol: 0.0002, explain: `Σxy/n = ${r4(z)}, Σx²/n = ${r4(q)}; soft-threshold by ${a}: w = ${r4(w)}.`,
        py: `import numpy as np\nfrom sklearn.linear_model import Lasso\nm = Lasso(alpha=${a}, fit_intercept=False, tol=1e-12, max_iter=100000).fit(np.array(${JSON.stringify(x)}, float).reshape(-1, 1), np.array(${JSON.stringify(y)}, float))\nanswer = float(m.coef_[0])`, packages: SK }; } },
  { key: "zeros", d: 2, secs: 60, fast: "With an orthonormal design, lasso soft-thresholds each OLS coefficient: |w| ≤ λ becomes exactly 0.", trap: "Expecting ridge to produce exact zeros.",
    make: (r) => { const p = int(r, 5, 9), w = Array.from({ length: p }, () => int(r, -40, 40) / 10), lam = pick(r, [0.5, 1, 1.5, 2]);
      if (w.some((v) => Math.abs(Math.abs(v) - lam) < 0.05)) return null;
      return { prompt: `With an orthonormal design, the OLS coefficients are (${w.join(", ")}). Lasso with threshold λ = ${lam} soft-thresholds each one. How many coefficients become exactly zero?`, answer: w.filter((v) => Math.abs(v) <= lam).length, tol: 0, explain: `Coefficients with |w| ≤ ${lam} are set to 0: ${w.filter((v) => Math.abs(v) <= lam).length}.`,
        py: `import numpy as np\nfrom sklearn.linear_model import Lasso\np = ${p}\nX = np.eye(p)\ny = np.array(${JSON.stringify(w)})\nm = Lasso(alpha=${lam} / p, fit_intercept=False, tol=1e-12, max_iter=100000).fit(X, y)\nanswer = int(np.sum(np.abs(m.coef_) < 1e-9))`, packages: SK }; } },
  { key: "shrink", d: 2, secs: 45, fast: "With an orthonormal design, ridge shrinks every OLS coefficient by the same factor: w / (1 + λ).", trap: "Expecting ridge to zero out small coefficients.",
    make: (r) => { const w = int(r, -50, 50) / 10 || 1.5, lam = pick(r, [0.25, 0.5, 1, 2, 4]);
      return { prompt: `With an orthonormal design, an OLS coefficient is ${w}. What does ridge regression with λ = ${lam} (loss ‖y − Xw‖² + λ‖w‖²) give for it?${D4}`, answer: r4(w / (1 + lam)), tol: 0.0002, explain: `${w}/(1 + ${lam}) = ${r4(w / (1 + lam))}.`,
        py: `import numpy as np\nfrom sklearn.linear_model import Ridge\nX = np.eye(3)\ny = np.array([${w}, 1.0, -2.0])\nanswer = float(Ridge(alpha=${lam}, fit_intercept=False).fit(X, y).coef_[0])`, packages: SK }; } },
];

// ───────────────────────── ML: losses ─────────────────────────
const LOSS: Tpl[] = [
  { key: "mse", d: 1, secs: 45, fast: "MSE = mean of squared errors.", trap: "Taking the square root (that's RMSE).",
    make: (r) => { const n = int(r, 4, 6), y = Array.from({ length: n }, () => int(r, 0, 20)), p = y.map((v) => v + int(r, -4, 4));
      return { prompt: `True values ${y.join(", ")}; predictions ${p.join(", ")}. What is the mean squared error?${D4}`, answer: r4(mean(y.map((v, i) => (v - p[i]) ** 2))), tol: 0.0002, explain: `Average of squared errors = ${r4(mean(y.map((v, i) => (v - p[i]) ** 2)))}.`,
        py: `from sklearn.metrics import mean_squared_error\nanswer = mean_squared_error(${JSON.stringify(y)}, ${JSON.stringify(p)})`, packages: SK }; } },
  { key: "mae", d: 1, secs: 45, fast: "MAE = mean of absolute errors; less sensitive to outliers than MSE.", trap: "Letting positive and negative errors cancel.",
    make: (r) => { const n = int(r, 4, 6), y = Array.from({ length: n }, () => int(r, 0, 20)), p = y.map((v) => v + int(r, -6, 6));
      return { prompt: `True values ${y.join(", ")}; predictions ${p.join(", ")}. What is the mean absolute error?${D4}`, answer: r4(mean(y.map((v, i) => Math.abs(v - p[i])))), tol: 0.0002, explain: `Average |error| = ${r4(mean(y.map((v, i) => Math.abs(v - p[i]))))}.`,
        py: `from sklearn.metrics import mean_absolute_error\nanswer = mean_absolute_error(${JSON.stringify(y)}, ${JSON.stringify(p)})`, packages: SK }; } },
  { key: "logloss", d: 2, secs: 75, fast: "Log loss = −mean[y log p + (1 − y) log(1 − p)].", trap: "Using log(p) for the negative examples instead of log(1 − p).",
    make: (r) => { const n = int(r, 4, 6), y = Array.from({ length: n }, () => int(r, 0, 1)), p = y.map(() => int(r, 5, 95) / 100);
      if (new Set(y).size < 2) return null;
      const ll = -mean(y.map((v, i) => (v ? Math.log(p[i]) : Math.log(1 - p[i]))));
      return { prompt: `Labels ${y.join(", ")}; predicted probabilities of class 1: ${p.join(", ")}. What is the binary cross-entropy (log loss, natural log)?${D4}`, answer: r4(ll), tol: 0.0002, explain: `−mean of log(p) for 1s and log(1 − p) for 0s = ${r4(ll)}.`,
        py: `from sklearn.metrics import log_loss\nanswer = log_loss(${JSON.stringify(y)}, ${JSON.stringify(p)})`, packages: SK }; } },
  { key: "softmax", d: 2, secs: 75, fast: "CE = −log softmax(z)_true = log Σ e^z − z_true.", trap: "Applying the loss to raw logits without softmax.",
    make: (r) => { const z = [int(r, -20, 30) / 10, int(r, -20, 30) / 10, int(r, -20, 30) / 10], k = int(r, 0, 2);
      const lse = Math.log(z.reduce((s, v) => s + Math.exp(v), 0));
      return { prompt: `A 3-class model outputs logits (${z.join(", ")}); the true class is ${k + 1}. What is the cross-entropy loss?${D4}`, answer: r4(lse - z[k]), tol: 0.0002, explain: `log Σ e^z = ${r4(lse)}; minus the true logit ${z[k]} = ${r4(lse - z[k])}.`,
        py: `import numpy as np\nfrom scipy.special import log_softmax\nanswer = float(-log_softmax(np.array(${JSON.stringify(z)}))[${k}])`, packages: SP }; } },
];

// ───────────────────────── ML: optimisers ─────────────────────────
const PY_GRAD = (k: number, a: number) => `f = lambda w: ${k} * (w - (${a})) ** 2\ngrad = lambda w, h=1e-6: (f(w + h) - f(w - h)) / (2 * h)`;
const OPT: Tpl[] = [
  { key: "gd1", d: 1, secs: 45, fast: "w ← w − η f′(w).", trap: "Adding the gradient instead of subtracting.",
    make: (r) => { const k = pick(r, [0.5, 1, 2]), a = int(r, -5, 5), w0 = int(r, -10, 10), lr = pick(r, [0.01, 0.05, 0.1, 0.2]);
      return { prompt: `f(w) = ${k}(w − ${a})². Starting at w = ${w0} with learning rate ${lr}, what is w after one gradient descent step?${D4}`, answer: r4(w0 - lr * 2 * k * (w0 - a)), tol: 0.0002, explain: `f′(${w0}) = ${2 * k}(${w0} − ${a}) = ${2 * k * (w0 - a)}; w = ${w0} − ${lr} × ${2 * k * (w0 - a)} = ${r4(w0 - lr * 2 * k * (w0 - a))}.`,
        py: `${PY_GRAD(k, a)}\nanswer = ${w0} - ${lr} * grad(${w0})` }; } },
  { key: "gdn", d: 2, secs: 75, fast: "For a quadratic, each step multiplies the distance to the minimum by (1 − 2kη).", trap: "Assuming a fixed step size in w (the step shrinks as the gradient shrinks).",
    make: (r) => { const k = pick(r, [0.5, 1, 2]), a = int(r, -5, 5), w0 = int(r, -10, 10), lr = pick(r, [0.05, 0.1, 0.2]), n = int(r, 3, 10);
      const wn = a + (w0 - a) * (1 - 2 * k * lr) ** n;
      return { prompt: `f(w) = ${k}(w − ${a})². Starting at w = ${w0} with learning rate ${lr}, what is w after ${n} gradient descent steps?${D4}`, answer: r4(wn), tol: 0.0002, explain: `Distance to ${a} shrinks by (1 − ${2 * k * lr}) per step: ${a} + ${w0 - a} × ${r4(1 - 2 * k * lr)}^${n} = ${r4(wn)}.`,
        py: `${PY_GRAD(k, a)}\nw = ${w0}\nfor _ in range(${n}):\n    w -= ${lr} * grad(w)\nanswer = w` }; } },
  { key: "momentum", d: 3, secs: 90, fast: "Momentum: v ← βv + g, w ← w − ηv (v starts at 0).", trap: "Forgetting to carry the previous velocity into step 2.",
    make: (r) => { const k = 1, a = int(r, -5, 5), w0 = int(r, -10, 10), lr = pick(r, [0.05, 0.1]), b = pick(r, [0.5, 0.9]);
      let w = w0, v = 0;
      for (let i = 0; i < 2; i++) { const g = 2 * k * (w - a); v = b * v + g; w -= lr * v; }
      return { prompt: `f(w) = (w − ${a})². Using momentum (v ← ${b}v + f′(w), w ← w − ${lr}v, v₀ = 0) from w = ${w0}, what is w after 2 steps?${D4}`, answer: r4(w), tol: 0.0002, explain: `Apply the update twice, keeping v between steps: w = ${r4(w)}.`,
        py: `${PY_GRAD(k, a)}\nw, v = ${w0}, 0.0\nfor _ in range(2):\n    v = ${b} * v + grad(w)\n    w = w - ${lr} * v\nanswer = w` }; } },
  { key: "adam", d: 3, secs: 90, fast: "Adam step 1: m̂ = g, v̂ = g², so Δw = −η g/(|g| + ε) ≈ −η sign(g).", trap: "Expecting the first Adam step to scale with the gradient's size.",
    make: (r) => { const a = int(r, -5, 5), w0 = int(r, -10, 10), lr = pick(r, [0.001, 0.01, 0.1]);
      if (w0 === a) return null;
      const g = 2 * (w0 - a), b1 = 0.9, b2 = 0.999, eps = 1e-8;
      const m = (1 - b1) * g, v = (1 - b2) * g * g, mh = m / (1 - b1), vh = v / (1 - b2), w1 = w0 - (lr * mh) / (Math.sqrt(vh) + eps);
      return { prompt: `f(w) = (w − ${a})². One Adam step from w = ${w0} with learning rate ${lr}, β₁ = 0.9, β₂ = 0.999, ε = 10⁻⁸. What is the new w?${D4}`, answer: r4(w1), tol: 0.0002, explain: `g = ${g}; after bias correction m̂ = g and v̂ = g², so the step is ${lr} × sign(g): w = ${r4(w1)}.`,
        py: `${PY_GRAD(1, a)}\nw, m, v = ${w0}, 0.0, 0.0\ng = grad(w)\nm = 0.9 * m + 0.1 * g\nv = 0.999 * v + 0.001 * g * g\nmh, vh = m / (1 - 0.9), v / (1 - 0.999)\nanswer = w - ${lr} * mh / (vh ** 0.5 + 1e-8)` }; } },
];

// ───────────────────────── ML: backpropagation ─────────────────────────
const sig = (z: number) => 1 / (1 + Math.exp(-z));
const BACK: Tpl[] = [
  { key: "sigmoid", d: 2, secs: 60, fast: "d/dw σ(wx + b) = σ(z)(1 − σ(z)) · x.", trap: "Forgetting the inner derivative x.",
    make: (r) => { const w = int(r, -20, 20) / 10, x = int(r, -30, 30) / 10, b = int(r, -10, 10) / 10, z = w * x + b;
      return { prompt: `For y = σ(wx + b) with w = ${w}, x = ${x}, b = ${b} (σ = sigmoid), what is ∂y/∂w?${D4}`, answer: r4(sig(z) * (1 - sig(z)) * x), tol: 0.0002, explain: `z = ${r4(z)}, σ(z) = ${r4(sig(z))}; σ(1 − σ) × x = ${r4(sig(z) * (1 - sig(z)) * x)}.`,
        py: `import math\ny = lambda w: 1 / (1 + math.exp(-(w * ${x} + ${b})))\nh = 1e-6\nanswer = (y(${w} + h) - y(${w} - h)) / (2 * h)` }; } },
  { key: "linear", d: 1, secs: 45, fast: "L = (wx + b − y)² → ∂L/∂w = 2(ŷ − y)x.", trap: "Dropping the factor 2 or the x.",
    make: (r) => { const w = int(r, -20, 20) / 10, x = int(r, -30, 30) / 10, b = int(r, -10, 10) / 10, y = int(r, -30, 30) / 10;
      return { prompt: `A linear neuron ŷ = wx + b has squared-error loss L = (ŷ − y)². With w = ${w}, x = ${x}, b = ${b}, y = ${y}, what is ∂L/∂w?${D4}`, answer: r4(2 * (w * x + b - y) * x), tol: 0.0002, explain: `ŷ = ${r4(w * x + b)}; 2(ŷ − y)x = ${r4(2 * (w * x + b - y) * x)}.`,
        py: `L = lambda w: (w * ${x} + ${b} - ${y}) ** 2\nh = 1e-6\nanswer = (L(${w} + h) - L(${w} - h)) / (2 * h)` }; } },
  { key: "twolayer", d: 3, secs: 90, fast: "Chain rule backwards: ∂L/∂w₁ = 2(ŷ − y) · w₂ · ReLU′(w₁x) · x.", trap: "Using the ReLU's output instead of its derivative (0 or 1).",
    make: (r) => { const w1 = int(r, -20, 20) / 10, w2 = int(r, -20, 20) / 10, x = int(r, -30, 30) / 10, y = int(r, -20, 20) / 10;
      if (Math.abs(w1 * x) < 0.2) return null;
      const h = Math.max(0, w1 * x), yh = w2 * h, g = 2 * (yh - y) * w2 * (w1 * x > 0 ? 1 : 0) * x;
      return { prompt: `h = ReLU(w₁x), ŷ = w₂h, L = (ŷ − y)². With w₁ = ${w1}, w₂ = ${w2}, x = ${x}, y = ${y}, what is ∂L/∂w₁?${D4}`, answer: r4(g), tol: 0.0002, explain: `h = ${r4(h)}, ŷ = ${r4(yh)}; ReLU′ = ${w1 * x > 0 ? 1 : 0}; gradient = ${r4(g)}.`,
        py: `L = lambda w1: (${w2} * max(0.0, w1 * ${x}) - ${y}) ** 2\nh = 1e-6\nanswer = (L(${w1} + h) - L(${w1} - h)) / (2 * h)` }; } },
  { key: "softmax", d: 2, secs: 60, fast: "Softmax + cross-entropy: ∂L/∂z_j = p_j − y_j.", trap: "Differentiating the softmax and the log separately and losing terms.",
    make: (r) => { const z = [int(r, -20, 30) / 10, int(r, -20, 30) / 10, int(r, -20, 30) / 10], k = int(r, 0, 2), j = int(r, 0, 2);
      const e = z.map(Math.exp), S = e.reduce((a, b) => a + b, 0), p = e.map((v) => v / S);
      return { prompt: `Logits (${z.join(", ")}), true class ${k + 1}, loss = cross-entropy of the softmax. What is ∂L/∂z${j + 1}? Give a negative number if needed.${D4}`, answer: r4(p[j] - (j === k ? 1 : 0)), tol: 0.0002, explain: `p = (${p.map(r4).join(", ")}); ∂L/∂z${j + 1} = p${j + 1} − ${j === k ? 1 : 0} = ${r4(p[j] - (j === k ? 1 : 0))}.`,
        py: `import math\nz = ${JSON.stringify(z)}\ndef L(zj):\n    zz = list(z); zz[${j}] = zj\n    return math.log(sum(math.exp(v) for v in zz)) - zz[${k}]\nh = 1e-6\nanswer = (L(z[${j}] + h) - L(z[${j}] - h)) / (2 * h)` }; } },
];

function finish(items: GenQ[]): GenQ[] {
  return items.map((q) => (q.options ? { ...q, py: q.py.replace("OPTS", JSON.stringify(q.options)) } : q));
}

export const B8_TOPICS = {
  anova: "st-anova", nonpar: "st-nonparametric", power: "st-power", ab: "st-ab-testing", multi: "st-multiple-testing", reg: "st-regression", tree: "st-which-test",
  bv: "ml-bias-variance", regl: "ml-regularisation", loss: "ml-losses", opt: "ml-optimisers", back: "ml-backprop",
} as const;

export const B8_ITEMS: GenQ[] = finish([
  ...build(B8_TOPICS.anova, "st-anova", 8101, ANOVA),
  ...build(B8_TOPICS.nonpar, "st-np", 8102, NONPAR),
  ...build(B8_TOPICS.power, "st-power", 8103, POWER),
  ...build(B8_TOPICS.ab, "st-ab", 8104, AB),
  ...build(B8_TOPICS.multi, "st-multi", 8105, MULTI),
  ...build(B8_TOPICS.reg, "st-reg", 8106, REG),
  ...build(B8_TOPICS.tree, "st-tree", 8107, TREE),
  ...build(B8_TOPICS.bv, "ml-bv", 8201, BV),
  ...build(B8_TOPICS.regl, "ml-reg", 8202, REGL),
  ...build(B8_TOPICS.loss, "ml-loss", 8203, LOSS),
  ...build(B8_TOPICS.opt, "ml-opt", 8204, OPT),
  ...build(B8_TOPICS.back, "ml-back", 8205, BACK),
]);
