/**
 * v2 Maths for ML, part E: Statistics (description, sampling, estimation, tests). Fixed ids; answers recomputed in Pyodide.
 */
import { CHECKED, lessonWriter } from "./v2-shared";
import { MS } from "./v2-m-src";

const { L, Q, C } = lessonWriter("maths");
const ST = "Statistics";
const NP = ["numpy"];
const SP = ["numpy", "scipy"];
const src = (label: string, url: string) => ({ label, url, checked: CHECKED });
const SRM = src("Fabijan et al. (2019): Diagnosing Sample Ratio Mismatch in Online Controlled Experiments, KDD", "https://exp-platform.com/Documents/2019_KDDFabijanGupchupFuptaOmhoverVermeerDmitriev.pdf");

L("m-descriptive", ST, "Descriptive statistics: centre, spread, shape and outliers", "Mean versus median, sample versus population variance, quartiles and IQR, skew, and robust summaries.", {
  kind: "concept", mins: 20,
  hook: "Average order value is ₹9,700 but the typical customer spends ₹500. Which number goes on the dashboard?",
  intuition: `
**The situation.** Before modelling or testing anything, you summarise: what's typical, how spread out, what shape, any oddities.

**Centre.** The **mean** uses every value and is pulled by extremes. The **median** is the middle value and ignores how extreme the tails are. In right-skewed data (income, revenue, latency) the mean sits above the median; report both, or the median with a high percentile.

**Spread.** **Variance** is the average squared deviation; **standard deviation** is its square root, in the data's units. The **IQR** (Q3 − Q1) covers the middle half and, like the median, resists outliers. **MAD** (median absolute deviation) is the robust cousin of the SD.

**Shape.** Skew (long right or left tail) and kurtosis (heavy tails). A histogram or box plot tells you more than any single number.

**Outliers.** The box-plot rule flags points beyond $Q1 - 1.5\\,\\text{IQR}$ or $Q3 + 1.5\\,\\text{IQR}$. Investigate before removing: a whale customer is real data.
`,
  maths: `
**In one breath.** $\\bar x = \\frac1n\\sum x_i$; $s^2 = \\frac{1}{n-1}\\sum(x_i - \\bar x)^2$ (sample), $\\sigma^2 = \\frac1N\\sum(x_i - \\mu)^2$ (population); IQR $= Q_3 - Q_1$; fences $Q_1 - 1.5\\,\\text{IQR}$, $Q_3 + 1.5\\,\\text{IQR}$; $z = (x - \\bar x)/s$.

**Worked example.** Orders (₹ hundreds): 2, 3, 3, 5, 7, 8, 40.

| Statistic | Value |
|---|---|
| Mean | 68/7 = 9.71 |
| Median | 5 |
| Sample SD | 13.54 |
| Q1, Q3 (linear interpolation) | 3, 7.5 |
| IQR | 4.5 |
| Upper fence | 7.5 + 6.75 = 14.25, so 40 is flagged |

Drop the 40 and the mean falls to 4.67 while the median moves only to 4. That is robustness.

**Why $n - 1$?** Deviations are measured from $\\bar x$, which is fitted to the same data, so they're slightly too small on average. Dividing by $n - 1$ (one degree of freedom used up) makes $s^2$ unbiased. For 2, 4, 4, 4, 5, 5, 7, 9: sum of squares 32; $s^2 = 32/7 = 4.57$, $\\sigma^2 = 32/8 = 4$.

**Skew rule of thumb.** Mean > median → right skew; mean < median → left skew (usually, not always).
`,
  practice: `
**Code.** \`np.var(x)\` divides by $n$ by default (\`ddof=0\`); \`pandas.Series.var\` divides by $n - 1$. \`np.percentile\` and \`pandas.quantile\` use linear interpolation by default; other definitions give slightly different quartiles.

**Dashboards.** For skewed metrics show the median, p90/p99 and the mean (the mean still matters for totals: revenue = users × mean revenue). Log-transform for plotting.
`,
  traps: [
    { trap: "np.var gives the sample variance.", why: "It defaults to ddof=0 (divide by n). Pass ddof=1 for the unbiased sample variance; pandas defaults to ddof=1." },
    { trap: "Remove outliers beyond 3 SD before analysis.", why: "The outliers inflate the SD that defines the cut-off, and they may be the most important users. Use robust rules (IQR, MAD), investigate, cap or use robust methods rather than silently delete." },
  ],
  say: {
    prompt: "When would you report the median instead of the mean, and how would you summarise spread for the same data?",
    secs: 40,
    check: ["Skewed or outlier-prone data → median", "Mean pulled by tails; still needed for totals", "Spread: IQR or MAD with the median; SD with the mean", "Mention percentiles (p90, p99)", "Look at the distribution (histogram / box plot)"],
    followups: [
      { q: "Why divide by n − 1 for sample variance?", a: "The mean is estimated from the same data, which uses one degree of freedom; dividing by n − 1 removes the downward bias." },
      { q: "In a right-skewed distribution, which is larger: mean or median?", a: "Usually the mean." },
      { q: "What is the 1.5 × IQR rule?", a: "Points below Q1 − 1.5 IQR or above Q3 + 1.5 IQR are flagged as potential outliers." },
    ],
    answer: `I'd use the median when the data are skewed or have extreme values, like income, order value or latency, because the mean is pulled towards the long tail and stops describing a typical case. I'd pair it with the IQR or MAD for spread, and add high percentiles such as p90 or p99 if the tail matters. The mean still matters whenever you need totals, since revenue is users times mean revenue, so on a dashboard I'd often show both, and I'd always look at a histogram first.`,
    avoid: ["Deleting outliers without investigating", "Using np.var without ddof=1 for a sample"],
  },
  terms: [["Median", "Middle value; robust to outliers."], ["IQR", "Q3 − Q1; middle 50%."], ["Degrees of freedom", "Independent pieces of information left after estimating parameters."]],
  sources: [MS.seeing, MS.islr],
});
const ORD = "import numpy as np\nx=np.array([2,3,3,5,7,8,40.])\n";
Q({ id: "m-des-1", d: 1, secs: 30, prompt: "Orders: 2, 3, 3, 5, 7, 8, 40. Mean? (2 decimals)", answer: 9.71, tol: 0.01, explain: "68/7.", py: ORD + "answer = float(x.mean())", packages: NP });
Q({ id: "m-des-2", d: 1, secs: 30, prompt: "Same data. Median?", answer: 5, tol: 0.01, explain: "4th of 7 sorted values.", py: ORD + "answer = float(np.median(x))", packages: NP });
Q({ id: "m-des-3", d: 2, secs: 45, prompt: "Same data. IQR using linear interpolation (numpy default)?", answer: 4.5, tol: 0.01, explain: "Q1 = 3, Q3 = 7.5.", py: ORD + "q1,q3=np.percentile(x,[25,75])\nanswer = float(q3-q1)", packages: NP });
Q({ id: "m-des-4", d: 2, secs: 45, prompt: "Data 2, 4, 4, 4, 5, 5, 7, 9. Sample variance (divide by n − 1)? (2 decimals)", answer: 4.57, tol: 0.01, explain: "Sum of squares 32; 32/7.", py: "import numpy as np\nanswer = float(np.var([2,4,4,4,5,5,7,9],ddof=1))", packages: NP });
Q({ id: "m-des-5", d: 1, secs: 30, prompt: "A distribution has mean 9.7 and median 5. It is most likely:", options: ["Symmetric", "Right-skewed", "Left-skewed", "Uniform"], answer: 1, explain: "A long right tail pulls the mean above the median.", py: ORD + "answer = 1 if x.mean()>np.median(x) else 2", packages: NP });
C("m-des-c1", "ddof defaults", "numpy var/std: ddof=0; pandas: ddof=1.");
C("m-des-c2", "Box-plot outlier rule", "Beyond Q1 − 1.5 IQR or Q3 + 1.5 IQR.");

L("m-sampling", ST, "Sampling designs and sampling bias", "Simple random, stratified and cluster samples; selection, survivorship, non-response and other biases that sample size can't fix.", {
  kind: "concept", mins: 20,
  hook: "You survey your app's users about satisfaction and get 50,000 responses. Why might that be worse than 500 random ones?",
  intuition: `
**The situation.** You almost never see the whole population. Whatever you conclude is only as good as the process that chose your data.

**Designs.**

- **Simple random sample (SRS)**: every unit equally likely; the baseline that standard formulas assume.
- **Stratified**: split into groups (region, plan type) and sample within each. Guarantees coverage and usually lowers variance.
- **Cluster**: sample whole groups (schools, stores, households). Cheaper, but units in a cluster are similar, so you learn less per unit.
- **Systematic, convenience, snowball**: practical; convenience samples are where bias lives.

**Biases** make an estimate systematically wrong, and more data doesn't help:

- **Selection bias**: who gets in depends on the outcome (only engaged users answer surveys).
- **Survivorship**: you only see the ones that made it (successful funds, planes that returned).
- **Non-response**: people who don't reply differ from those who do.
- **Measurement bias**: leading questions, instruments that drift.
`,
  maths: `
**In one breath.** SRS: $\\text{SE}(\\bar x) = \\frac{s}{\\sqrt n}\\sqrt{\\frac{N-n}{N-1}}$ (finite-population correction); stratified: $\\bar x_{st} = \\sum_h W_h\\bar x_h$, $\\text{Var} = \\sum_h W_h^2 s_h^2/n_h$; cluster design effect $\\text{DEFF} = 1 + (m - 1)\\rho$, effective $n = n/\\text{DEFF}$.

**Proportional allocation.** Strata of 6,000, 3,000 and 1,000 people, total sample 500: take 300, 150, 50.

**Finite-population correction.** Sampling 200 of 1,000 multiplies the SE by $\\sqrt{800/999} = 0.895$. Negligible once $n/N < 5\\%$.

**Cluster sampling cost.** 100 stores × 20 customers = 2,000 people, intra-cluster correlation 0.05: DEFF $= 1 + 19 \\times 0.05 = 1.95$, effective sample about 1,026.

**Bias vs variance.** $\\text{MSE} = \\text{bias}^2 + \\text{variance}$. Variance falls like $1/n$; bias doesn't fall at all. A huge biased sample gives a precise wrong answer (the 1936 *Literary Digest* poll had 2.4 million responses and called the US election for the loser).

| Bias | Example | Fix |
|---|---|---|
| Selection | survey only active users | random sampling frame, weighting |
| Survivorship | analyse only surviving firms | include failures / full cohort |
| Non-response | 10% reply | follow-up, weighting, compare early vs late responders |
| Leakage (ML) | future info in features | time-based splits |
`,
  practice: `
**In ML.** Training data are a sample: if labels exist only for approved loans, the model never sees outcomes of rejected applicants (reject inference). Stratified train/test splits keep class balance. Group-aware splits (\`GroupKFold\`) handle clustered data such as several rows per user.

**In experiments.** Randomise at the right unit; analyse with standard errors that respect clustering.
`,
  traps: [
    { trap: "A bigger sample fixes a biased one.", why: "Size reduces variance only. A biased process gives a more confident wrong answer." },
    { trap: "Cluster samples can use SRS standard errors.", why: "Units within a cluster are correlated; the effective sample is smaller by the design effect, so naive SEs are too small." },
  ],
  say: {
    prompt: "What's selection bias? Give an example from a product or ML setting and how you'd deal with it.",
    secs: 45,
    check: ["Definition: inclusion depends on something related to the outcome", "Concrete example (survey responders, approved loans, survivors)", "Bigger n doesn't help", "Fixes: random sampling, weighting, collect missing group, design", "Mention checking: compare sample with population on known variables"],
    followups: [
      { q: "What is survivorship bias?", a: "Analysing only cases that survived some filter, e.g. returning planes or still-trading funds, which overstates success." },
      { q: "When is stratified sampling better than SRS?", a: "When strata differ in the outcome; stratifying removes between-strata variation from the error and guarantees small groups are covered." },
      { q: "What is a design effect?", a: "The variance inflation from clustering: $1 + (m - 1)\\rho$." },
    ],
    answer: `Selection bias is when the way units end up in your data is related to the outcome you're measuring, so the sample systematically misrepresents the population. A lending example: a default model trained only on approved loans never sees how rejected applicants would have behaved, so it can be badly wrong at the margin where approval decisions are made. More data of the same kind doesn't help. I'd fix it at the source where possible, by randomly approving a small slice or sampling properly; otherwise reweight by known population margins or use reject-inference methods, and always compare the sample with the population on variables I know.`,
    avoid: ["Claiming large n cancels bias", "Giving no fix"],
  },
  terms: [["Stratified sampling", "Sample separately within groups."], ["Design effect", "Variance inflation from clustering, 1 + (m − 1)ρ."], ["Selection bias", "Inclusion depends on the outcome or its causes."]],
  sources: [MS.islr, MS.seeing],
});
Q({ id: "m-smp-1", d: 1, secs: 30, prompt: "Strata of 6,000, 3,000 and 1,000 people; total sample 500 with proportional allocation. How many from the second stratum?", answer: 150, tol: 0.5, explain: "500 × 3,000/10,000.", py: "N=[6000,3000,1000]\nanswer = round(500*N[1]/sum(N))" });
Q({ id: "m-smp-2", d: 2, secs: 45, prompt: "Sampling 200 people without replacement from 1,000. Finite-population correction factor on the SE? (3 decimals)", answer: 0.895, tol: 0.002, explain: "√((N − n)/(N − 1)) = √(800/999).", py: "import numpy as np\nN,n=1000,200\nanswer = float(np.sqrt((N-n)/(N-1)))", packages: NP });
Q({ id: "m-smp-3", d: 2, secs: 60, prompt: "100 stores × 20 customers each; intra-cluster correlation 0.05. Effective sample size? (nearest whole number)", answer: 1026, tol: 1, explain: "DEFF = 1 + 19 × 0.05 = 1.95; 2,000/1.95 = 1,025.6.", py: "answer = round(2000/(1+19*0.05))" });
Q({ id: "m-smp-4", d: 1, secs: 30, prompt: "Studying only funds still trading today overstates average fund returns. This is:", options: ["Non-response bias", "Survivorship bias", "Measurement bias", "Recall bias"], answer: 1, explain: "Closed (usually poor) funds are missing.", py: "answer = 1" });
Q({ id: "m-smp-5", d: 2, secs: 60, prompt: "Two strata with weights 0.7 and 0.3, sample SDs 10 and 30, and 70 and 30 units sampled. Standard error of the stratified mean? (3 decimals)", answer: 1.844, tol: 0.002, explain: "√(0.7² × 100/70 + 0.3² × 900/30) = √(0.7 + 2.7) = 1.844.", py: "import numpy as np\nW=np.array([.7,.3]);s=np.array([10,30.]);n=np.array([70,30.])\nanswer = float(np.sqrt(np.sum(W**2*s**2/n)))", packages: NP });
C("m-smp-c1", "Bias vs size", "n shrinks variance, never bias.");
C("m-smp-c2", "Design effect", "1 + (m − 1)ρ; effective n = n/DEFF.");

L("m-sampling-dist", ST, "Sampling distributions and standard errors", "What a statistic would do across repeated samples, the standard errors you need from memory, and where the t and chi-square come from.", {
  kind: "concept", mins: 20, prereq: ["m-lln-clt"],
  hook: "Conversion is 10% in control and 12% in treatment with 1,000 users each. Is a 2-point gap large? You need its standard error.",
  intuition: `
**The situation.** Any number computed from a sample (a mean, a proportion, a difference, a regression slope) would come out differently on a different sample.

**The idea.** The **sampling distribution** is the distribution of that statistic over all the samples you might have drawn. Its standard deviation is the **standard error** (SE). Everything in inference (intervals, tests, power) is "estimate ± a few SEs".

- For means and proportions, the CLT makes the sampling distribution approximately normal.
- When you estimate the SD from the data, the standardised mean follows a **t distribution** with $n - 1$ degrees of freedom: like the normal, with heavier tails for small $n$.
- The sample variance scaled by $(n-1)/\\sigma^2$ follows a **chi-square** with $n - 1$ degrees of freedom (for normal data).
`,
  maths: `
**In one breath.**

| Statistic | Standard error |
|---|---|
| Mean | $s/\\sqrt n$ |
| Proportion | $\\sqrt{\\hat p(1-\\hat p)/n}$ |
| Difference of independent means | $\\sqrt{s_1^2/n_1 + s_2^2/n_2}$ |
| Difference of proportions | $\\sqrt{\\hat p_1(1-\\hat p_1)/n_1 + \\hat p_2(1-\\hat p_2)/n_2}$ |
| Slope in simple regression | $\\hat\\sigma/\\sqrt{\\sum(x_i - \\bar x)^2}$ |

**Worked examples.**

- $s = 12$, $n = 36$: SE of the mean $= 2$.
- $\\hat p = 0.2$, $n = 400$: SE $= \\sqrt{0.16/400} = 0.02$.
- 10% vs 12%, 1,000 each: SE of the difference $= \\sqrt{0.09/1000 + 0.1056/1000} = 0.0140$, so the gap is 1.43 SEs: not convincing on its own.
- Means of 25 draws from $N(50, 10^2)$: SE 2; $P(\\bar x > 53) = P(Z > 1.5) = 0.067$.

**Variance of $s^2$.** $(n-1)s^2/\\sigma^2 \\sim \\chi^2_{n-1}$: with $n = 20$, $P(s^2 > 1.5\\sigma^2) = P(\\chi^2_{19} > 28.5) = 0.074$. Sample variances are noisy for small $n$.

**t vs z.** $t_{0.975}$ is 2.776 at 4 df, 2.064 at 24, 2.009 at 49, 1.984 at 99, approaching 1.96.
`,
  practice: `
**Which SE?** Independent groups: add variances. Paired data: SE of the differences. Clustered data (sessions within users): cluster-robust SEs, or aggregate to the user. Ratios (revenue per session): delta method or bootstrap.

**Simulate to understand.** Draw many samples, compute the statistic each time, look at the histogram: that is the sampling distribution, and its SD is the SE.
`,
  traps: [
    { trap: "Standard deviation and standard error are interchangeable.", why: "SD describes spread of the data; SE describes uncertainty of an estimate and shrinks with $\\sqrt n$." },
    { trap: "SE of a difference = SE₁ − SE₂ (or SE₁ + SE₂).", why: "For independent estimates, variances add: $\\sqrt{\\text{SE}_1^2 + \\text{SE}_2^2}$." },
  ],
  say: {
    prompt: "What's the difference between a standard deviation and a standard error? Give the SE for a difference in conversion rates.",
    secs: 40,
    check: ["SD: spread of individual observations", "SE: SD of an estimator's sampling distribution", "SE shrinks with √n, SD doesn't", "Difference of proportions: √(p₁q₁/n₁ + p₂q₂/n₂)", "Use: intervals and tests are estimate ± multiples of SE"],
    followups: [
      { q: "Why does the t distribution have heavier tails than the normal?", a: "It accounts for the extra uncertainty from estimating σ with s; with few observations s can be badly off." },
      { q: "How do you get an SE for a median?", a: "Bootstrap, or an asymptotic formula involving the density at the median." },
      { q: "What if users contribute many sessions?", a: "Sessions aren't independent; use cluster-robust SEs or analyse per user." },
    ],
    answer: `The standard deviation describes how spread out individual observations are; it doesn't shrink with more data. The standard error is the standard deviation of an estimate across hypothetical repeated samples, so it measures how uncertain the estimate is, and it shrinks with the square root of n. For a difference in conversion rates between two independent groups, variances add: the SE is the square root of p₁(1 − p₁)/n₁ plus p₂(1 − p₂)/n₂. With 10% and 12% on 1,000 users each that's about 1.4 points, so a 2-point gap is only about 1.4 standard errors.`,
    avoid: ["Using SD where SE is meant", "Subtracting standard errors"],
  },
  terms: [["Sampling distribution", "Distribution of a statistic across repeated samples."], ["Standard error", "SD of the sampling distribution."], ["t distribution", "Standardised mean with estimated σ; df = n − 1."]],
  sources: [MS.seeing, MS.islr, MS.scipy],
});
Q({ id: "m-sdist-1", d: 1, secs: 30, prompt: "Sample SD 12, n = 36. Standard error of the mean?", answer: 2, tol: 0.01, explain: "12/6.", py: "answer = 12/36**0.5" });
Q({ id: "m-sdist-2", d: 1, secs: 30, prompt: "p̂ = 0.2 from n = 400. Standard error?", answer: 0.02, tol: 0.0002, explain: "√(0.2 × 0.8/400).", py: "answer = (0.2*0.8/400)**0.5" });
Q({ id: "m-sdist-3", d: 2, secs: 60, prompt: "Conversion 10% (n = 1,000) vs 12% (n = 1,000). Standard error of the difference? (4 decimals)", answer: 0.014, tol: 0.0002, explain: "√(0.09/1000 + 0.1056/1000) = 0.01399.", py: "import numpy as np\nanswer = float(np.sqrt(.1*.9/1000+.12*.88/1000))", packages: NP });
Q({ id: "m-sdist-4", d: 2, secs: 45, prompt: "Samples of n = 25 from N(50, 10²). P(sample mean > 53)? (3 decimals)", answer: 0.067, tol: 0.002, explain: "SE 2, z = 1.5.", py: "from scipy import stats\nanswer = float(stats.norm.sf(53,50,10/5))", packages: SP });
Q({ id: "m-sdist-5", d: 3, secs: 90, prompt: "Normal data, n = 20. P(sample variance exceeds 1.5 × the true variance)? (3 decimals)", answer: 0.074, tol: 0.002, explain: "(n − 1)s²/σ² ~ χ²₁₉; P(χ²₁₉ > 28.5) = 0.074.", py: "from scipy import stats\nanswer = float(stats.chi2.sf(19*1.5,19))", packages: SP });
Q({ id: "m-sdist-6", d: 1, secs: 30, prompt: "Two-sided 95% critical value of the t distribution with 24 degrees of freedom? (3 decimals)", answer: 2.064, tol: 0.002, explain: "Heavier tails than 1.96.", py: "from scipy import stats\nanswer = float(stats.t.ppf(0.975,24))", packages: SP });
C("m-sdist-c1", "SD vs SE", "SD: spread of data. SE: uncertainty of an estimate, ∝ 1/√n.");
C("m-sdist-c2", "SE of a difference", "√(SE₁² + SE₂²) for independent estimates.");

L("m-ci", ST, "Confidence intervals", "Building intervals for means and proportions, what '95%' does and doesn't mean, and better intervals for small counts.", {
  kind: "concept", mins: 25, prereq: ["m-sampling-dist"],
  hook: "'There's a 95% probability the true conversion rate is between 9% and 11%.' What's wrong with that sentence?",
  intuition: `
**The situation.** A point estimate alone hides how uncertain it is. An interval says how far off it might plausibly be.

**The idea.** A 95% **confidence interval** comes from a procedure that, over repeated samples, captures the true value 95% of the time. For any one computed interval, the true value is either in it or not; the 95% describes the method's hit rate.

**The recipe.** estimate ± critical value × SE. Wider for more confidence, narrower with more data (width ∝ $1/\\sqrt n$).

**Better intervals for proportions.** The textbook Wald interval $\\hat p \\pm 1.96\\sqrt{\\hat p(1-\\hat p)/n}$ breaks down for small $n$ or $\\hat p$ near 0 or 1 (0 successes gives the absurd interval [0, 0]). **Wilson** and **Clopper–Pearson** (exact) intervals behave well. The **rule of three**: with 0 events in $n$ trials, a 95% upper bound is about $3/n$.
`,
  maths: `
**In one breath.** Mean: $\\bar x \\pm t_{n-1, 0.975}\\,s/\\sqrt n$. Proportion (Wald): $\\hat p \\pm z\\sqrt{\\hat p(1-\\hat p)/n}$. Wilson: $\\frac{\\hat p + z^2/2n \\pm z\\sqrt{\\hat p(1-\\hat p)/n + z^2/4n^2}}{1 + z^2/n}$. Width $\\propto 1/\\sqrt n$.

**Worked example: mean.** $\\bar x = 50$, $s = 10$, $n = 25$: $t_{24} = 2.064$, half-width $2.064 \\times 2 = 4.13$; interval (45.9, 54.1).

**Worked example: proportion.** 150 of 500 (30%): half-width $1.96\\sqrt{0.21/500} = 0.040$; (26.0%, 34.0%).

**Zero events.** 0 defects in 20: Wald gives [0, 0]. Wilson upper 0.161; Clopper–Pearson upper 0.168; rule of three $3/20 = 0.15$ (one-sided 95%).

**Duality with tests.** A 95% interval contains exactly the null values a two-sided 5% test would not reject.

| Want | Change |
|---|---|
| Halve the width | 4× the sample |
| 99% instead of 95% | critical value 2.576 instead of 1.96 (about 31% wider) |
| Small counts | Wilson or exact |
| Skewed statistic | bootstrap or transform (log, logit) |

**Overlap rule.** Two 95% intervals that overlap can still show a significant difference; compare the interval of the *difference*.
`,
  practice: `
**Code.** \`scipy.stats.t.interval(0.95, df, loc, scale)\`; \`scipy.stats.binomtest(k, n).proportion_ci(method="wilson")\`; \`scipy.stats.bootstrap\` for anything else.

**Reporting.** Give the interval for the quantity the decision depends on (the lift, not each arm), in business units, and say what's practically significant.
`,
  traps: [
    { trap: "There's a 95% probability the true value is in this interval.", why: "In the frequentist sense the parameter is fixed; 95% is the long-run coverage of the procedure. A Bayesian credible interval supports the probability statement." },
    { trap: "Overlapping intervals mean no significant difference.", why: "Two intervals can overlap while the difference's interval excludes zero. Build the interval for the difference." },
  ],
  say: {
    prompt: "Interpret a 95% confidence interval correctly, and tell me how you'd compute one for a conversion rate with very few conversions.",
    secs: 45,
    check: ["Procedure covers the true value 95% of the time in repeated sampling", "Not a probability statement about this interval (frequentist)", "Estimate ± critical value × SE; width ∝ 1/√n", "Wald fails for small counts / p near 0", "Use Wilson or Clopper–Pearson; rule of three for zero events"],
    followups: [
      { q: "How much more data to halve the width?", a: "Four times as much." },
      { q: "0 failures in 300 trials: rough 95% upper bound on the failure rate?", a: "Rule of three: 3/300 = 1%." },
      { q: "What is the link between intervals and tests?", a: "The 95% interval contains every null value that a two-sided 5% test would not reject." },
    ],
    answer: `A 95% confidence interval comes from a procedure that would contain the true value in 95% of repeated samples. For the interval I actually computed, the true value is either inside or not; the 95% is about the method's reliability, not a probability for this particular interval, which would need a Bayesian credible interval.

For a conversion rate with few conversions I wouldn't use the normal-approximation Wald interval, because it can go below zero or collapse to [0, 0] with no successes. I'd use a Wilson or Clopper–Pearson interval, and for zero events the rule of three gives a quick 95% upper bound of 3/n.`,
    avoid: ["“95% chance the parameter is in here”", "Wald interval with 0 successes"],
  },
  terms: [["Confidence level", "Long-run coverage of the interval procedure."], ["Wilson interval", "Proportion interval from inverting the score test; good for small n."], ["Rule of three", "0 events in n ⇒ 95% upper bound ≈ 3/n."]],
  sources: [MS.seeing, MS.scipy, MS.islr],
});
Q({ id: "m-ci-1", d: 1, secs: 45, prompt: "x̄ = 50, s = 10, n = 25. Half-width of the 95% t-interval? (2 decimals)", answer: 4.13, tol: 0.01, explain: "2.064 × 10/5.", py: "from scipy import stats\nlo,hi=stats.t.interval(0.95,24,loc=50,scale=2)\nanswer = float((hi-lo)/2)", packages: SP });
Q({ id: "m-ci-2", d: 1, secs: 45, prompt: "150 conversions out of 500. Half-width of the 95% Wald interval? (3 decimals)", answer: 0.04, tol: 0.002, explain: "1.96 × √(0.3 × 0.7/500) = 0.0402.", py: "from scipy import stats\nimport math\nanswer = float(stats.norm.ppf(0.975)*math.sqrt(0.3*0.7/500))", packages: SP });
Q({ id: "m-ci-3", d: 2, secs: 60, prompt: "0 defects in 20 items. Upper end of the 95% Wilson interval? (3 decimals)", answer: 0.161, tol: 0.002, explain: "z²/(n + z²) = 3.84/23.84.", py: "from scipy import stats\nanswer = float(stats.binomtest(0,20).proportion_ci(method='wilson').high)", packages: SP });
Q({ id: "m-ci-4", d: 2, secs: 60, prompt: "0 defects in 20 items. Upper end of the 95% Clopper–Pearson (exact) interval? (3 decimals)", answer: 0.168, tol: 0.002, explain: "1 − 0.025^(1/20) = 0.168.", py: "from scipy import stats\nanswer = float(stats.binomtest(0,20).proportion_ci(method='exact').high)", packages: SP });
Q({ id: "m-ci-5", d: 1, secs: 30, prompt: "To halve a confidence interval's width, multiply the sample size by:", answer: 4, tol: 0.01, explain: "Width ∝ 1/√n.", py: "answer = (1/0.5)**2" });
Q({ id: "m-ci-6", d: 2, secs: 45, prompt: "Which statement about a computed 95% confidence interval (frequentist) is correct?", options: ["The parameter has a 95% probability of lying in it", "95% of the data lie in it", "The procedure captures the true value in 95% of repeated samples", "A repeat study's estimate has a 95% chance of falling in it"], answer: 2, explain: "Coverage is a property of the method.", py: "import numpy as np\nfrom scipy import stats\nrng=np.random.default_rng(1)\nx=rng.normal(10,2,(20000,15))\nm=x.mean(1);s=x.std(1,ddof=1);h=stats.t.ppf(.975,14)*s/np.sqrt(15)\ncov=np.mean((m-h<10)&(10<m+h))\nanswer = 2 if abs(cov-0.95)<0.01 else 0", packages: SP });
C("m-ci-c1", "CI recipe", "Estimate ± critical value × SE; width ∝ 1/√n.");
C("m-ci-c2", "Small counts", "Wilson or Clopper–Pearson; rule of three: 3/n.");

L("m-bootstrap", ST, "The bootstrap", "Resampling your own data to get standard errors and intervals for statistics without formulas, and when it fails.", {
  kind: "concept", mins: 20, prereq: ["m-sampling-dist", "m-ci"],
  hook: "You need a confidence interval for the median session length, or for AUC. There's no textbook formula. Now what?",
  intuition: `
**The situation.** Formulas for standard errors exist for means and proportions. For medians, percentiles, ratios, AUC or a model's F1, they're messy or don't exist.

**The idea.** You can't redraw from the population, but your sample is the best picture of it you have. So **resample from the sample**: draw $n$ observations *with replacement*, recompute the statistic, repeat thousands of times. The spread of those bootstrap statistics approximates the sampling distribution.

- **SE**: the SD of the bootstrap statistics.
- **Percentile interval**: the 2.5th and 97.5th percentiles of them.
- **BCa interval**: corrects for bias and skew; scipy's default.

Each bootstrap sample contains about 63% of the distinct original points; the rest are repeats. Those left out (out-of-bag, about 37%) are what random forests use for free validation.
`,
  maths: `
**In one breath.** $\\hat\\theta^{*b} = \\theta(x^{*b})$ for $b = 1..B$, $x^{*b}$ drawn with replacement; $\\widehat{\\text{SE}} = \\text{sd}(\\hat\\theta^*)$; percentile CI $[q_{0.025}, q_{0.975}]$; $P(\\text{point } i \\notin x^*) = (1 - 1/n)^n \\to e^{-1} = 0.368$.

**Exact bootstrap, tiny example.** Data 1, 2, 3, 4, 10 ($n = 5$). All $5^5 = 3{,}125$ resamples are equally likely. For the mean, the ideal bootstrap SE equals $\\sqrt{\\hat\\sigma^2/n}$ with $\\hat\\sigma^2 = \\frac1n\\sum(x - \\bar x)^2 = 50/5 = 10$: SE $= \\sqrt{2} = 1.414$. In practice you sample $B$ resamples instead of enumerating.

**Counting.** The number of distinct bootstrap samples (as multisets) is $\\binom{2n-1}{n}$: 126 for $n = 5$.

**How many resamples?** $B \\approx 1{,}000$ for an SE, $5{,}000$–$10{,}000$ for percentile intervals.

| Works well | Struggles |
|---|---|
| means, medians, quantiles in the middle | extremes (max, min) |
| ratios, correlations, AUC, F1 | very small $n$ (under ~20) |
| regression coefficients (resample rows) | dependent data unless you resample blocks / clusters |
`,
  practice: `
**Code.** \`scipy.stats.bootstrap((x,), np.median, n_resamples=9999, method="BCa", random_state=0)\`. For A/B metrics, resample users within each arm independently. For time series use a block bootstrap; for clustered data resample clusters.

**Model evaluation.** Bootstrap the test set to put an interval on AUC or accuracy differences between two models (resample rows once, score both models on the same resample: paired).
`,
  traps: [
    { trap: "The bootstrap creates new information, so it works for any n.", why: "It only re-uses the sample. With tiny samples the empirical distribution is a poor stand-in for the population and intervals are too narrow." },
    { trap: "Resample individual rows even when users have many rows.", why: "That treats correlated rows as independent and underestimates the SE. Resample the independent unit (users, clusters, time blocks)." },
  ],
  say: {
    prompt: "How does the bootstrap work, and when would you not trust it?",
    secs: 45,
    check: ["Resample n with replacement from the data", "Recompute the statistic B times", "SE = SD of replicates; percentile or BCa interval", "Use when no formula: median, AUC, ratios", "Fails: tiny n, extremes, dependent data unless resampling the right unit"],
    followups: [
      { q: "What fraction of original points appear in a bootstrap sample?", a: "About 63.2% (1 − 1/e) for large n." },
      { q: "How do you bootstrap a time series?", a: "Resample contiguous blocks (moving-block or stationary bootstrap) to keep the dependence." },
      { q: "How would you compare two models' AUCs with the bootstrap?", a: "Resample test rows, compute both AUCs on each resample, and take the interval of the difference (paired)." },
    ],
    answer: `The bootstrap treats the sample as a stand-in for the population. I draw n observations with replacement, compute the statistic, and repeat a few thousand times; the spread of those replicates approximates the sampling distribution, so their SD is the standard error and their percentiles give an interval, ideally bias-corrected (BCa). It's great when there's no simple formula, like a median, a ratio metric or AUC. I wouldn't trust it with very small samples, for extreme statistics like a maximum, or with dependent data unless I resample the independent unit, such as users, clusters or time blocks.`,
    avoid: ["Saying it adds information", "Resampling correlated rows"],
  },
  terms: [["Bootstrap", "Resampling with replacement to approximate a sampling distribution."], ["Percentile interval", "Quantiles of the bootstrap replicates."], ["Out-of-bag", "Points not drawn in a resample, ≈ 36.8%."]],
  sources: [MS.scipy, MS.seeing, MS.islr],
});
Q({ id: "m-boot-1", d: 1, secs: 30, prompt: "n = 10. Probability a particular observation is absent from one bootstrap sample? (3 decimals)", answer: 0.349, tol: 0.002, explain: "(1 − 1/10)¹⁰ = 0.349.", py: "answer = (1-1/10)**10" });
Q({ id: "m-boot-2", d: 2, secs: 45, prompt: "For large n, what fraction of the distinct original observations appears in a bootstrap sample? (3 decimals)", answer: 0.632, tol: 0.002, explain: "1 − e⁻¹.", py: "import numpy as np\nrng=np.random.default_rng(0)\nn=100000\nfrac=np.mean([len(np.unique(rng.integers(0,n,n)))/n for _ in range(20)])\nanswer = round(float(frac),3)", packages: NP });
Q({ id: "m-boot-3", d: 2, secs: 45, prompt: "How many distinct bootstrap samples (as multisets) can be drawn from 5 distinct values?", answer: 126, tol: 0.5, explain: "C(2n − 1, n) = C(9, 5).", py: "from itertools import combinations_with_replacement\nanswer = len(list(combinations_with_replacement(range(5),5)))" });
Q({ id: "m-boot-4", d: 3, secs: 90, prompt: "Data 1, 2, 3, 4, 10. Ideal (exact) bootstrap standard error of the mean? (3 decimals)", answer: 1.414, tol: 0.002, explain: "Enumerate all 5⁵ resamples, or use √(σ̂²/n) with σ̂² = 10.", py: "import numpy as np\nfrom itertools import product\nx=[1,2,3,4,10]\nm=np.array([np.mean(r) for r in product(x,repeat=5)])\nanswer = float(m.std())", packages: NP });
Q({ id: "m-boot-5", d: 2, secs: 45, prompt: "For which statistic is the ordinary bootstrap least reliable?", options: ["The mean", "The median", "The sample maximum", "A regression slope"], answer: 2, explain: "Resamples can never exceed the observed max, so the bootstrap distribution of the max is badly wrong.", py: "import numpy as np\nrng=np.random.default_rng(0)\nx=rng.uniform(0,1,50)\nb=np.array([rng.choice(x,50).max() for _ in range(4000)])\nanswer = 2 if np.mean(b==x.max())>0.5 else 0", packages: NP });
C("m-boot-c1", "Bootstrap recipe", "Resample n with replacement, recompute, SD = SE, percentiles = interval.");
C("m-boot-c2", "Resample the right unit", "Users, clusters or time blocks, not correlated rows.");

L("m-hypothesis", ST, "Hypothesis testing, p-values, errors and power", "The logic of a test, what a p-value is and isn't, Type I and II errors, and power.", {
  kind: "concept", mins: 25, prereq: ["m-sampling-dist"],
  hook: "p = 0.03. Your manager says 'so there's a 97% chance the new feature works'. How do you correct that in one sentence?",
  intuition: `
**The situation.** You see a difference and need to judge whether it could easily be noise.

**The logic.** Assume nothing is going on (the **null hypothesis** $H_0$). Ask how surprising the data would be in that world. If very surprising, reject $H_0$.

- **Test statistic**: how far the estimate is from the null, in SEs.
- **p-value**: the probability, *assuming $H_0$ is true*, of a result at least as extreme as the one observed. It is not the probability that $H_0$ is true.
- **Significance level $\\alpha$**: the false-alarm rate you accept, fixed in advance (often 0.05).

**Two ways to be wrong.**

| | $H_0$ true | $H_0$ false |
|---|---|---|
| Reject | Type I error ($\\alpha$) | correct (power, $1 - \\beta$) |
| Don't reject | correct | Type II error ($\\beta$) |

**Power** is the chance of detecting a real effect of a given size. It rises with effect size, sample size and $\\alpha$, and falls with noise. Low-powered studies miss real effects and, when they do find one, exaggerate it.
`,
  maths: `
**In one breath.** $z = (\\hat\\theta - \\theta_0)/\\text{SE}$; two-sided $p = 2(1 - \\Phi(|z|))$; power (one-sided) $= \\Phi\\big(\\frac{\\delta}{\\text{SE}} - z_{1-\\alpha}\\big)$; "fail to reject" is not "accept".

**Worked examples.**

- $z = 1.8$: one-sided $p = 0.036$, two-sided $0.072$.
- $z = 2.5$: two-sided $p = 0.012$.
- 60 heads in 100 tosses: exact two-sided binomial $p = 0.057$. Suggestive, not significant at 5%.
- Power: true effect is 2.5 SEs, one-sided $\\alpha = 0.05$ ($z = 1.645$): power $= \\Phi(2.5 - 1.645) = \\Phi(0.855) = 0.80$.

**One- vs two-sided.** Use one-sided only if an effect in the other direction would genuinely lead to the same action as no effect, and decide before seeing the data.

**Statistical vs practical significance.** With millions of users a 0.01% lift is "significant" and worthless; with 200 users a 10% lift can be "not significant" and important. Report the effect size and interval.

**Under the null, p is uniform.** That's why 1 in 20 null tests gives $p < 0.05$, and why running many tests produces false positives.
`,
  practice: `
**Write it down first.** Hypotheses, metric, $\\alpha$, one- or two-sided, minimum effect of interest, sample size. Changing any after seeing the data invalidates the p-value.

**Code.** \`scipy.stats.norm.sf\`, \`scipy.stats.binomtest\`, \`ttest_ind\`, \`chi2_contingency\`; they return statistics and p-values.
`,
  traps: [
    { trap: "p = 0.03 means a 97% chance the effect is real.", why: "The p-value is P(data this extreme | H₀), not P(H₀ | data). The latter needs a prior: Bayes again." },
    { trap: "p > 0.05 shows there is no effect.", why: "Absence of evidence: the test may simply lack power. Look at the confidence interval; if it includes meaningful effects, the result is inconclusive." },
  ],
  say: {
    prompt: "Explain what a p-value is to a product manager, and what it isn't.",
    secs: 45,
    check: ["Assume no effect (null)", "p = chance of a result at least this extreme under the null", "Not P(null true) or P(effect real)", "Small p → data surprising if no effect; threshold α set in advance", "Pair with effect size / interval; non-significant ≠ no effect"],
    followups: [
      { q: "What is statistical power?", a: "The probability of rejecting H₀ when a specified true effect exists: 1 − β." },
      { q: "Why is a p-value uniform under the null?", a: "By construction P(p ≤ α | H₀) = α for every α, which is the uniform CDF." },
      { q: "What makes power go up?", a: "Larger effect, larger sample, lower variance (e.g. CUPED), higher α, one-sided test where justified." },
    ],
    answer: `I'd say: suppose the change did nothing at all. The p-value is how often we'd see a difference at least as big as this one just from random variation. A p of 0.03 means that would happen about 3% of the time, so the result is hard to explain as pure noise. What it isn't is the probability the feature works or that the result is a fluke; that needs prior information. And a large p-value doesn't prove there's no effect, it may mean the test was too small. That's why I always report the size of the effect with a confidence interval alongside it.`,
    avoid: ["“97% chance it works”", "Treating non-significance as proof of no effect"],
  },
  terms: [["Null hypothesis", "The no-effect baseline the test assumes."], ["p-value", "P(result at least this extreme | H₀)."], ["Power", "P(reject H₀ | specified effect is real)."]],
  sources: [MS.seeing, MS.scipy, MS.islr],
});
Q({ id: "m-hyp-1", d: 1, secs: 30, prompt: "z = 1.8. One-sided p-value? (3 decimals)", answer: 0.036, tol: 0.002, explain: "1 − Φ(1.8) = 0.0359.", py: "from scipy import stats\nanswer = float(stats.norm.sf(1.8))", packages: SP });
Q({ id: "m-hyp-2", d: 1, secs: 30, prompt: "z = 2.5. Two-sided p-value? (4 decimals)", answer: 0.0124, tol: 0.0002, explain: "2(1 − Φ(2.5)).", py: "from scipy import stats\nanswer = float(2*stats.norm.sf(2.5))", packages: SP });
Q({ id: "m-hyp-3", d: 2, secs: 45, prompt: "60 heads in 100 tosses. Exact two-sided binomial p-value for a fair coin? (3 decimals)", answer: 0.057, tol: 0.002, explain: "binomtest(60, 100): 0.0569.", py: "from scipy import stats\nanswer = float(stats.binomtest(60,100,0.5).pvalue)", packages: SP });
Q({ id: "m-hyp-4", d: 2, secs: 60, prompt: "One-sided z-test at α = 0.05. The true effect equals 2.5 standard errors. Power? (3 decimals)", answer: 0.804, tol: 0.002, explain: "Φ(2.5 − 1.645) = Φ(0.855).", py: "from scipy import stats\nanswer = float(stats.norm.cdf(2.5-stats.norm.ppf(0.95)))", packages: SP });
Q({ id: "m-hyp-5", d: 2, secs: 45, prompt: "If H₀ is true and the test is valid, the p-value is distributed:", options: ["Normally around 0.05", "Uniformly on [0, 1]", "Concentrated near 0", "Concentrated near 1"], answer: 1, explain: "P(p ≤ α) = α for all α.", py: "import numpy as np\nfrom scipy import stats\nrng=np.random.default_rng(0)\nz=rng.normal(size=200000)\np=2*stats.norm.sf(abs(z))\nanswer = 1 if stats.kstest(p,'uniform').pvalue>0.001 else 0", packages: SP });
C("m-hyp-c1", "p-value", "P(at least this extreme | H₀); not P(H₀ | data).");
C("m-hyp-c2", "Type I / II", "Type I: false alarm (α). Type II: miss (β). Power = 1 − β.");

L("m-z-t-tests", ST, "z-tests and t-tests: one-sample, two-sample (Welch) and paired", "Choosing the right comparison of means or proportions and computing it from summary statistics.", {
  kind: "concept", mins: 25, prereq: ["m-hypothesis"],
  hook: "Same 6 stores, sales before and after a promotion. Run a two-sample t-test and you might miss a clear effect. Why?",
  intuition: `
**The situation.** Most comparisons in analytics are "is this mean (or rate) different from that one?"

**Which test?**

1. **Proportions with large samples** → two-proportion **z-test** (or chi-square, equivalent for 2 × 2).
2. **Means, σ unknown** (almost always) → **t-test**.
3. Same units measured twice, or matched pairs → **paired t-test**: a one-sample t-test on the differences. It removes between-unit variation, often a huge gain.
4. Different units → **two-sample t-test**. Default to **Welch's** version, which doesn't assume equal variances; the pooled (Student) version only when you have reason to.
5. Three or more groups → ANOVA, not repeated t-tests.

The t-test assumes the *means* are roughly normal (CLT helps), observations are independent, and for pooled tests equal variances. Strongly skewed small samples → a non-parametric test or the bootstrap.
`,
  maths: `
**In one breath.** One-sample $t = \\frac{\\bar x - \\mu_0}{s/\\sqrt n}$, df $n - 1$. Welch $t = \\frac{\\bar x_1 - \\bar x_2}{\\sqrt{s_1^2/n_1 + s_2^2/n_2}}$, df by Welch–Satterthwaite. Paired $t = \\frac{\\bar d}{s_d/\\sqrt n}$. Two-proportion $z = \\frac{\\hat p_2 - \\hat p_1}{\\sqrt{\\hat p(1-\\hat p)(1/n_1 + 1/n_2)}}$ with pooled $\\hat p$.

**One-sample.** $\\bar x = 52$, $\\mu_0 = 50$, $s = 5$, $n = 16$: $t = 2/1.25 = 1.6$, df 15, two-sided $p = 0.130$.

**Welch.** Group 1: mean 48.2, SD 6.1, $n = 12$; group 2: 43.5, 9.4, 15. SE $= \\sqrt{3.10 + 5.89} = 3.00$; $t = 1.57$; df ≈ 24.1; $p = 0.130$.

**Paired.** Differences 2, 4, −1, 3, 5, 1: $\\bar d = 2.33$, $s_d = 2.16$, $t = 2.65$, df 5, $p = 0.046$. Analysed as two independent groups, the store-to-store variation would swamp this.

**Two proportions.** 200/2,000 vs 240/2,000: pooled $\\hat p = 0.11$, SE $= \\sqrt{0.11 \\times 0.89 \\times 0.001} = 0.0099$, $z = 2.02$, $p = 0.043$.

| Design | Test | scipy |
|---|---|---|
| one mean vs a value | one-sample t | \`ttest_1samp\` |
| two independent means | Welch t | \`ttest_ind(..., equal_var=False)\` |
| before/after, matched | paired t | \`ttest_rel\` |
| two proportions | z / chi-square | \`chi2_contingency(..., correction=False)\` |
| summary stats only | Welch from stats | \`ttest_ind_from_stats\` |
`,
  practice: `
**In A/B tests** with thousands of users per arm, t and z coincide; Welch is the safe default for means. For conversion rates use the two-proportion z (or the equivalent chi-square). Make sure the unit of analysis matches the randomisation unit.

**Check pairing.** If the same users appear in both conditions (within-subject designs, before/after), a two-sample test throws away the pairing and power.
`,
  traps: [
    { trap: "Use a two-sample t-test on before/after data from the same units.", why: "It ignores that each 'after' belongs with a 'before', leaving between-unit variance in the error. Use the paired test on the differences." },
    { trap: "Use the pooled-variance t-test by default.", why: "If variances and sample sizes differ, its false-positive rate can be far from α. Welch's test costs almost nothing when variances are equal." },
  ],
  say: {
    prompt: "How do you decide between a paired t-test, Welch's t-test and a z-test for proportions?",
    secs: 45,
    check: ["Paired: same/matched units, test differences", "Welch: independent groups, unequal variances allowed (default)", "z-test for proportions with large n (≡ chi-square 2 × 2)", "Assumptions: independence, approx. normal means", "3+ groups → ANOVA; skewed small samples → non-parametric / bootstrap"],
    followups: [
      { q: "Why does pairing increase power?", a: "Differencing removes the between-unit variation, which is often most of the variance." },
      { q: "When are t and z the same?", a: "With large samples the t distribution is essentially normal." },
      { q: "What's the relation between a 2 × 2 chi-square and the two-proportion z-test?", a: "Without continuity correction, χ² = z² and the p-values match." },
    ],
    answer: `First, are the observations paired? If the same units are measured twice, or units are matched, I take differences and run a paired t-test, which removes between-unit variation and is much more powerful. If the groups are independent and I'm comparing means, I use Welch's t-test, which doesn't assume equal variances and costs nothing when they are equal. If the metric is a proportion and samples are large, the two-proportion z-test, which is the same as a 2 × 2 chi-square. I'd check independence and the unit of analysis, switch to ANOVA for more than two groups, and to a non-parametric test or bootstrap for small, very skewed samples.`,
    avoid: ["Two-sample test on paired data", "Pooled variance by default"],
  },
  terms: [["Welch's t-test", "Two-sample t without equal-variance assumption."], ["Paired t-test", "One-sample t on within-unit differences."], ["Pooled proportion", "Combined rate used in the two-proportion z-test under H₀."]],
  sources: [MS.scipy, MS.seeing, MS.islr],
});
Q({ id: "m-zt-1", d: 1, secs: 45, prompt: "x̄ = 52, μ₀ = 50, s = 5, n = 16. Two-sided one-sample t-test p-value? (3 decimals)", answer: 0.13, tol: 0.002, explain: "t = 1.6, df 15: p = 0.130.", py: "from scipy import stats\nanswer = float(2*stats.t.sf(2/(5/4),15))", packages: SP });
Q({ id: "m-zt-2", d: 2, secs: 60, prompt: "Group 1: mean 48.2, SD 6.1, n = 12. Group 2: mean 43.5, SD 9.4, n = 15. Welch t statistic? (2 decimals)", answer: 1.57, tol: 0.01, explain: "4.7/√(6.1²/12 + 9.4²/15) = 4.7/3.00.", py: "from scipy import stats\nanswer = float(stats.ttest_ind_from_stats(48.2,6.1,12,43.5,9.4,15,equal_var=False).statistic)", packages: SP });
Q({ id: "m-zt-3", d: 2, secs: 60, prompt: "Paired differences (after − before) for 6 stores: 2, 4, −1, 3, 5, 1. Two-sided paired t-test p-value? (3 decimals)", answer: 0.046, tol: 0.002, explain: "d̄ = 2.33, s_d = 2.16, t = 2.65, df 5.", py: "from scipy import stats\nanswer = float(stats.ttest_1samp([2,4,-1,3,5,1],0).pvalue)", packages: SP });
Q({ id: "m-zt-4", d: 2, secs: 60, prompt: "Control 200/2,000 conversions, treatment 240/2,000. Two-proportion z statistic (pooled)? (2 decimals)", answer: 2.02, tol: 0.01, explain: "0.02/√(0.11 × 0.89 × 2/2000) = 2.02.", py: "from scipy import stats\nchi2=stats.chi2_contingency([[200,1800],[240,1760]],correction=False)[0]\nanswer = float(chi2**0.5)", packages: SP });
Q({ id: "m-zt-5", d: 1, secs: 30, prompt: "Each of 30 users is timed on the old and the new checkout. Which test fits?", options: ["Welch's two-sample t-test", "Paired t-test", "Chi-square test of independence", "One-way ANOVA"], answer: 1, explain: "Same users in both conditions: test the within-user differences.", py: "import numpy as np\nfrom scipy import stats\nrng=np.random.default_rng(0)\nu=rng.normal(60,15,30);old=u+rng.normal(0,2,30);new=u-1.5+rng.normal(0,2,30)\nanswer = 1 if stats.ttest_rel(old,new).pvalue < stats.ttest_ind(old,new,equal_var=False).pvalue else 0", packages: SP });
C("m-zt-c1", "Default two-sample test", "Welch (equal_var=False).");
C("m-zt-c2", "Paired = one-sample on differences", "Removes between-unit variance.");

L("m-chi-square", ST, "Chi-square tests: goodness of fit and independence", "Comparing observed with expected counts, degrees of freedom, expected-count rules, and the sample-ratio check in A/B tests.", {
  kind: "concept", mins: 20, prereq: ["m-hypothesis"],
  hook: "Your 50/50 A/B test has 10,200 users in one arm and 9,800 in the other. Bad luck, or a broken experiment?",
  intuition: `
**The situation.** Data are counts in categories: die faces, plan types by region, users per experiment arm. Are they what you'd expect?

**The idea.** Compute what each cell *should* hold under the null, measure how far observed counts are from that, scaled by the expected count, and add up:

$$\\chi^2 = \\sum \\frac{(O - E)^2}{E}$$

Large values mean the counts don't fit the null.

- **Goodness of fit**: one categorical variable against a specified distribution (a fair die; a 50/50 split).
- **Independence** (contingency table): two categorical variables; expected counts come from the margins, row total × column total / grand total.

**SRM check.** In A/B testing, a chi-square goodness-of-fit test on the arm sizes detects **sample ratio mismatch**: when the split is off from its design, something in assignment or logging is broken and the results can't be trusted.
`,
  maths: `
**In one breath.** $\\chi^2 = \\sum(O - E)^2/E$; goodness of fit df $= k - 1$ (minus estimated parameters); independence df $= (r - 1)(c - 1)$, $E_{ij} = R_iC_j/N$; rule of thumb: expected counts ≥ 5, otherwise Fisher's exact test or merge cells.

**Goodness of fit: a die.** 60 rolls: 5, 8, 9, 8, 10, 20; expected 10 each. $\\chi^2 = (25 + 4 + 1 + 4 + 0 + 100)/10 = 13.4$, df 5, $p = 0.020$.

**Independence: 2 × 2.**

| | Converted | Not | Total |
|---|---|---|---|
| A | 30 | 70 | 100 |
| B | 45 | 55 | 100 |
| Total | 75 | 125 | 200 |

Expected for (A, converted): $100 \\times 75/200 = 37.5$. $\\chi^2 = 4.8$, df 1, $p = 0.028$ (no continuity correction). For 2 × 2 tables $\\chi^2 = z^2$ from the two-proportion test.

**SRM.** 10,200 vs 9,800 with a 50/50 design: $\\chi^2 = 2 \\times 200^2/10{,}000 = 8$, $p = 0.0047$. With 20,000 users a 51/49 split is very unlikely by chance; investigate before reading any metric.

**df intuition.** In a table, once the margins are fixed, only $(r-1)(c-1)$ cells are free; the rest are determined.
`,
  practice: `
**Code.** \`scipy.stats.chisquare(observed, f_exp)\` for goodness of fit; \`chi2_contingency(table)\` for independence (applies Yates' continuity correction to 2 × 2 by default; pass \`correction=False\` to match the z-test); \`fisher_exact\` for small 2 × 2 tables.

**Effect size.** Cramér's $V = \\sqrt{\\chi^2/(N(\\min(r, c) - 1))}$: with big data everything is significant; $V$ says how strong the association is.
`,
  traps: [
    { trap: "Run chi-square on percentages or means.", why: "It needs raw counts. Percentages lose the sample size, which the test depends on." },
    { trap: "A 51/49 split is close enough to 50/50.", why: "With 20,000 users it's $p \\approx 0.005$. Sample ratio mismatch usually signals a bug (redirects, bots, logging) that biases the metrics." },
  ],
  say: {
    prompt: "How would you check whether an A/B test's traffic split is healthy, and what would you do if it isn't?",
    secs: 45,
    check: ["Chi-square goodness of fit on arm counts vs design ratio", "Compute expected counts, χ² = Σ(O − E)²/E", "Small p (often < 0.001 threshold) ⇒ SRM", "Don't trust metrics; investigate assignment, redirects, bots, logging, triggers", "Check segments / days to localise"],
    followups: [
      { q: "Degrees of freedom for a 3 × 4 contingency table?", a: "(3 − 1)(4 − 1) = 6." },
      { q: "What if expected counts are below 5?", a: "Use Fisher's exact test or merge categories." },
      { q: "Why is SRM so serious?", a: "The mechanism that lost or added users is usually related to the treatment, so the arms are no longer comparable." },
    ],
    answer: `I'd run a chi-square goodness-of-fit test on the user counts per arm against the designed ratio. For a 50/50 test with 10,200 and 9,800 users the expected count is 10,000 each, χ² = 8 and p ≈ 0.005, which is a sample ratio mismatch. Many teams alert at p < 0.001 because they check every experiment. If it fires I wouldn't read any metric: SRM usually means assignment or logging is broken, for instance a redirect that loses slow users in one arm, bot filtering, or a trigger condition affected by the treatment. I'd break the counts down by day, platform and browser to find where the imbalance comes from.`,
    avoid: ["Shrugging off a 51/49 split at large n", "Reading the metrics anyway"],
  },
  terms: [["Goodness of fit", "Observed counts vs a specified distribution."], ["Contingency table", "Counts cross-classified by two categorical variables."], ["Sample ratio mismatch", "Arm sizes deviate significantly from the designed split."]],
  sources: [MS.scipy, SRM],
});
Q({ id: "m-chi-1", d: 2, secs: 60, prompt: "60 die rolls give counts 5, 8, 9, 8, 10, 20. Chi-square goodness-of-fit statistic against a fair die?", answer: 13.4, tol: 0.01, explain: "Σ(O − 10)²/10 = 134/10.", py: "from scipy import stats\nanswer = float(stats.chisquare([5,8,9,8,10,20]).statistic)", packages: SP });
Q({ id: "m-chi-2", d: 2, secs: 45, prompt: "Same die data. p-value? (3 decimals)", answer: 0.02, tol: 0.002, explain: "χ² = 13.4 on 5 df: p = 0.0199.", py: "from scipy import stats\nanswer = float(stats.chisquare([5,8,9,8,10,20]).pvalue)", packages: SP });
Q({ id: "m-chi-3", d: 2, secs: 60, prompt: "Table A: 30 converted, 70 not; B: 45 converted, 55 not. Chi-square statistic without continuity correction?", answer: 4.8, tol: 0.01, explain: "Expected 37.5/62.5 per row; Σ(O − E)²/E = 4.8.", py: "from scipy import stats\nanswer = float(stats.chi2_contingency([[30,70],[45,55]],correction=False)[0])", packages: SP });
Q({ id: "m-chi-4", d: 1, secs: 30, prompt: "Degrees of freedom for a chi-square test of independence on a 3 × 4 table?", answer: 6, tol: 0.5, explain: "(3 − 1)(4 − 1).", py: "import numpy as np\nfrom scipy import stats\nanswer = int(stats.chi2_contingency(np.arange(1,13).reshape(3,4)+10)[2])", packages: SP });
Q({ id: "m-chi-5", d: 2, secs: 45, prompt: "A 50/50 A/B test has 10,200 and 9,800 users. SRM chi-square p-value? (4 decimals)", answer: 0.0047, tol: 0.0002, explain: "χ² = 8 on 1 df.", py: "from scipy import stats\nanswer = float(stats.chisquare([10200,9800]).pvalue)", packages: SP });
C("m-chi-c1", "Expected count in a table", "Row total × column total / grand total.");
C("m-chi-c2", "SRM check", "Chi-square goodness of fit on arm counts; alert at small p.");
