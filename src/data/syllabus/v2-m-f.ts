/**
 * v2 Maths for ML, part F: Statistics (more tests, regression inference, causality, Bayes) and the module interview.
 */
import { iq, lessonWriter } from "./v2-shared";
import { MS } from "./v2-m-src";

const { L, Q, C } = lessonWriter("maths");
const ST = "Statistics";
const NP = ["numpy"];
const SP = ["numpy", "scipy"];

L("m-anova", ST, "ANOVA: comparing several means", "Splitting variation into between-group and within-group parts, the F statistic, and what to do after a significant result.", {
  kind: "concept", mins: 20, prereq: ["m-z-t-tests"],
  hook: "Four landing pages, six pairwise t-tests at 5% each. What's the real false-positive rate, and what's the alternative?",
  intuition: `
**The situation.** More than two groups: three pricing tiers, four page designs, five regions.

**Why not pairwise t-tests?** Four groups make six pairs; each test has a 5% false-alarm rate, so the chance of at least one false positive is far above 5%.

**The idea.** **One-way ANOVA** asks one question: are all the group means equal? It compares two estimates of noise:

- **Between groups**: how far group means are from the grand mean.
- **Within groups**: how spread out observations are inside each group.

If the groups really share a mean, both measure the same noise and their ratio, **F**, is around 1. If group means differ, the between part grows and F gets large.

A significant ANOVA says *some* means differ, not which. Follow with **post-hoc** comparisons that control the error rate (Tukey's HSD, or pairwise tests with Holm/Bonferroni).
`,
  maths: `
**In one breath.** $\\text{SST} = \\text{SSB} + \\text{SSW}$; $\\text{SSB} = \\sum_g n_g(\\bar x_g - \\bar x)^2$, df $k - 1$; $\\text{SSW} = \\sum_g\\sum_i(x_{gi} - \\bar x_g)^2$, df $N - k$; $F = \\frac{\\text{SSB}/(k-1)}{\\text{SSW}/(N-k)}$; $\\eta^2 = \\text{SSB}/\\text{SST}$.

**Worked example.** Groups (4, 5, 6), (6, 7, 8), (8, 9, 10): means 5, 7, 9; grand mean 7.

| Source | SS | df | MS | F |
|---|---|---|---|---|
| Between | $3(4 + 0 + 4) = 24$ | 2 | 12 | 12 |
| Within | $2 + 2 + 2 = 6$ | 6 | 1 | |
| Total | 30 | 8 | | |

$p = P(F_{2,6} > 12) = 0.008$; $\\eta^2 = 24/30 = 0.8$: group explains 80% of the variance.

**Link to regression.** ANOVA is linear regression on group dummy variables; the F-test is the test that all dummy coefficients are zero. With two groups, $F = t^2$ (pooled t-test).

**Assumptions.** Independence, roughly normal residuals, equal variances. Unequal variances → Welch's ANOVA; non-normal small samples → Kruskal–Wallis.

**Pairwise count.** $k$ groups give $\\binom k2$ pairs: 6 for 4 groups, 10 for 5.
`,
  practice: `
**Code.** \`scipy.stats.f_oneway(*groups)\`; \`scipy.stats.tukey_hsd(*groups)\` for post-hoc; \`scipy.stats.kruskal\` as the rank-based alternative. In statsmodels, \`ols("y ~ C(group)").fit()\` then \`anova_lm\`.

**In experiments.** Multi-arm A/B tests often skip the omnibus F and compare each treatment against control with a multiple-comparison correction, since that's the decision being made.
`,
  traps: [
    { trap: "A significant ANOVA tells you which groups differ.", why: "It only rejects 'all means equal'. Use post-hoc tests with error-rate control to locate the differences." },
    { trap: "Run all pairwise t-tests at 5% instead.", why: "The family-wise error rate inflates with the number of pairs; with 6 independent-ish tests it's around 26%." },
  ],
  say: {
    prompt: "Explain one-way ANOVA and why you'd use it instead of multiple t-tests.",
    secs: 45,
    check: ["Tests H₀: all group means equal", "Partition variance: between vs within", "F = MS_between / MS_within, ≈ 1 under H₀", "Avoids inflated false-positive rate from many pairwise tests", "Post-hoc (Tukey/Holm); assumptions and alternatives (Welch, Kruskal–Wallis)"],
    followups: [
      { q: "What is F when there are exactly two groups?", a: "The square of the pooled two-sample t statistic." },
      { q: "What does η² measure?", a: "The proportion of total variance explained by group membership, SSB/SST." },
      { q: "What if the variances are very unequal?", a: "Use Welch's ANOVA or a Games–Howell post-hoc test." },
    ],
    answer: `One-way ANOVA tests whether several groups share the same mean. It splits the total variation into variation between group means and variation within groups. Under the null both estimate the same noise, so their ratio, the F statistic, is around 1; a large F says the group means are further apart than noise explains. I'd use it instead of all pairwise t-tests because running many tests inflates the chance of a false positive. A significant F only says some means differ, so I'd follow with Tukey's HSD or Holm-corrected comparisons, and check independence, residual normality and equal variances, falling back to Welch's ANOVA or Kruskal–Wallis.`,
    avoid: ["Saying ANOVA identifies which group differs", "Pairwise t-tests without correction"],
  },
  terms: [["F statistic", "Between-group mean square / within-group mean square."], ["Post-hoc test", "Follow-up comparisons with error control (Tukey, Holm)."], ["η²", "SSB/SST, effect size for ANOVA."]],
  sources: [MS.scipy, MS.seeing, MS.islr],
});
const G3 = "from scipy import stats\ng=[[4,5,6],[6,7,8],[8,9,10]]\n";
Q({ id: "m-anv-1", d: 2, secs: 60, prompt: "Groups (4, 5, 6), (6, 7, 8), (8, 9, 10). One-way ANOVA F statistic?", answer: 12, tol: 0.01, explain: "MSB = 24/2 = 12; MSW = 6/6 = 1.", py: G3 + "answer = float(stats.f_oneway(*g).statistic)", packages: SP });
Q({ id: "m-anv-2", d: 2, secs: 45, prompt: "Same groups. p-value? (3 decimals)", answer: 0.008, tol: 0.0005, explain: "P(F₂,₆ > 12).", py: G3 + "answer = float(stats.f_oneway(*g).pvalue)", packages: SP });
Q({ id: "m-anv-3", d: 2, secs: 45, prompt: "Same groups. η² (proportion of variance explained by group)?", answer: 0.8, tol: 0.002, explain: "SSB/SST = 24/30.", py: "import numpy as np\ng=[np.array(x,float) for x in [[4,5,6],[6,7,8],[8,9,10]]]\nall_=np.concatenate(g);m=all_.mean()\nssb=sum(len(x)*(x.mean()-m)**2 for x in g);sst=((all_-m)**2).sum()\nanswer = float(ssb/sst)", packages: NP });
Q({ id: "m-anv-4", d: 1, secs: 30, prompt: "4 groups of 10 observations. Within-groups degrees of freedom?", answer: 36, tol: 0.5, explain: "N − k = 40 − 4.", py: "answer = 40-4" });
Q({ id: "m-anv-5", d: 1, secs: 30, prompt: "How many pairwise comparisons among 5 groups?", answer: 10, tol: 0.5, explain: "C(5, 2).", py: "from itertools import combinations\nanswer = len(list(combinations(range(5),2)))" });
Q({ id: "m-anv-6", d: 2, secs: 45, prompt: "With exactly two groups, the one-way ANOVA F equals:", options: ["The Welch t statistic", "The square of the pooled t statistic", "The chi-square statistic", "The correlation coefficient"], answer: 1, explain: "F = t² for the pooled two-sample t-test.", py: "from scipy import stats\na=[3,5,6,8];b=[7,9,10,12,13]\nF=stats.f_oneway(a,b).statistic;t=stats.ttest_ind(a,b).statistic\nanswer = 1 if abs(F-t*t)<1e-9 else 0", packages: SP });
C("m-anv-c1", "F under H₀", "≈ 1: both mean squares estimate the same noise.");
C("m-anv-c2", "After a significant ANOVA", "Post-hoc tests (Tukey HSD, Holm) to find which means differ.");

L("m-nonparametric", ST, "Non-parametric tests: ranks, signs and permutations", "Mann–Whitney, Wilcoxon signed-rank, Kruskal–Wallis, the sign test and permutation tests, and what each actually tests.", {
  kind: "concept", mins: 20, prereq: ["m-z-t-tests"],
  hook: "Twelve users, wildly skewed session times, one user at 9 hours. Is a t-test still OK? What would you run instead?",
  intuition: `
**The situation.** Small samples, heavy skew, outliers or ordinal data (ratings 1–5) undermine tests built on means and normal approximations.

**The idea.** Replace values with **ranks** or **signs**, or build the null distribution directly by **permutation**. These make far fewer assumptions.

| Situation | Parametric | Non-parametric |
|---|---|---|
| two independent groups | Welch t | Mann–Whitney U (Wilcoxon rank-sum) |
| paired / before–after | paired t | Wilcoxon signed-rank, sign test |
| 3+ independent groups | one-way ANOVA | Kruskal–Wallis |
| any statistic, exchangeable labels | — | permutation test |

**What they test.** Mann–Whitney asks whether a random value from one group tends to exceed one from the other ($P(X > Y) \\ne 0.5$). It is *not* a test of medians unless the two distributions have the same shape.

**Permutation tests.** If treatment did nothing, the labels are arbitrary. Shuffle them every possible way (or many random ways), recompute the difference, and see where the observed one falls. Exact, and works for any statistic.
`,
  maths: `
**In one breath.** Mann–Whitney $U_1 = \\#\\{(i, j): x_i > y_j\\}$ (ties ½), $E[U] = n_1n_2/2$; signed-rank $W$ = sum of ranks of $|d|$ with positive sign; sign test = binomial on the number of positive differences; permutation $p = \\#\\{\\text{perm stat} \\ge \\text{observed}\\}/\\#\\text{perms}$.

**Mann–Whitney.** $x = (1, 3, 5)$, $y = (2, 4, 6, 7)$: pairs with $x > y$: 0 + 1 + 2 = 3 out of 12, so $U = 3$ and the common-language effect $3/12 = 0.25$. Exact two-sided $p = 0.40$.

**Sign test.** 9 of 10 users improved: two-sided binomial $p = 0.021$.

**Signed-rank.** Differences 1.5, −0.5, 2.0, 3.0, −1.0, 2.5; ranks of $|d|$: 3, 1, 4, 6, 2, 5. Negative ranks sum to 3 ($W^- = 3$, $W^+ = 18$); exact two-sided $p = 0.156$.

**Exact permutation test.** Treatment (12, 14, 15), control (10, 11, 13). Observed difference in means 2.33 (treatment sum 41). Of $\\binom63 = 20$ relabelings, only {13, 14, 15} (42) and {12, 14, 15} (41) reach 41: one-sided $p = 2/20 = 0.10$.

**AUC link.** $U/(n_1n_2)$ is exactly the ROC AUC of using the value to separate the groups.
`,
  practice: `
**Code.** \`scipy.stats.mannwhitneyu\`, \`wilcoxon\`, \`kruskal\`, \`binomtest\` (sign test), \`permutation_test\` (exact when the number of permutations is small).

**When to prefer them.** Small $n$ with skew or outliers, ordinal data, or when you want a test of stochastic dominance. With large $n$ the t-test on means is usually fine (CLT) and tests the thing the business sums: the mean.
`,
  traps: [
    { trap: "Mann–Whitney compares medians.", why: "It tests whether one distribution tends to produce larger values. Two groups with equal medians but different shapes can give a significant result." },
    { trap: "Non-parametric tests have no assumptions.", why: "They still assume independence, and permutation tests assume exchangeability under the null (e.g. similar spreads if you interpret the result as a location shift)." },
  ],
  say: {
    prompt: "When would you use a Mann–Whitney test instead of a t-test, and what exactly does it test?",
    secs: 40,
    check: ["Small, skewed or outlier-heavy samples, ordinal data", "Rank-based; robust to extreme values", "Tests P(X > Y) ≠ ½ (stochastic ordering)", "Not a median test unless shapes match", "Large n: t-test on means often fine and tests the business metric"],
    followups: [
      { q: "How does Mann–Whitney relate to AUC?", a: "AUC = U/(n₁n₂)." },
      { q: "What is a permutation test?", a: "Recompute the statistic under all (or many random) relabelings of the groups to build its null distribution." },
      { q: "Non-parametric alternative to one-way ANOVA?", a: "Kruskal–Wallis." },
    ],
    answer: `I'd use Mann–Whitney when the samples are small and skewed or have outliers, or the data are ordinal like ratings, so the t-test's reliance on the mean and normal approximations is shaky. It ranks all observations together and tests whether a random value from one group tends to be larger than one from the other, i.e. P(X > Y) ≠ ½. It's often described as a median test, but that's only true if the two distributions have the same shape. With large samples I'd usually still test the mean, because that's the quantity the business adds up and the CLT makes the t-test reliable.`,
    avoid: ["Calling it a test of medians without qualification", "Claiming no assumptions"],
  },
  terms: [["Mann–Whitney U", "Count of cross-group pairs where x > y."], ["Wilcoxon signed-rank", "Ranks of |differences| with signs, for paired data."], ["Permutation test", "Null distribution from relabelings."]],
  sources: [MS.scipy, MS.seeing],
});
Q({ id: "m-np-1", d: 2, secs: 60, prompt: "x = (1, 3, 5), y = (2, 4, 6, 7). Mann–Whitney U for x (pairs with x > y)?", answer: 3, tol: 0.01, explain: "0 + 1 + 2.", py: "from scipy import stats\nanswer = float(stats.mannwhitneyu([1,3,5],[2,4,6,7]).statistic)", packages: SP });
Q({ id: "m-np-2", d: 1, secs: 45, prompt: "9 of 10 users improved after a change (no ties). Two-sided sign-test p-value? (3 decimals)", answer: 0.021, tol: 0.002, explain: "Binomial(10, ½): 2 × 11/1024 = 0.0215.", py: "from scipy import stats\nanswer = float(stats.binomtest(9,10,0.5).pvalue)", packages: SP });
Q({ id: "m-np-3", d: 2, secs: 60, prompt: "Treatment (12, 14, 15), control (10, 11, 13). Exact one-sided permutation p-value for the difference in means?", answer: 0.1, tol: 0.002, explain: "2 of 20 relabelings give a treatment sum ≥ 41.", py: "from itertools import combinations\nv=[12,14,15,10,11,13]\nobs=sum(v[:3])\nc=list(combinations(v,3))\nanswer = sum(sum(t)>=obs for t in c)/len(c)" });
Q({ id: "m-np-4", d: 2, secs: 60, prompt: "Paired differences 1.5, −0.5, 2.0, 3.0, −1.0, 2.5. Wilcoxon signed-rank statistic (smaller rank sum)?", answer: 3, tol: 0.01, explain: "Negative differences have ranks 1 and 2.", py: "from scipy import stats\nanswer = float(stats.wilcoxon([1.5,-0.5,2.0,3.0,-1.0,2.5]).statistic)", packages: SP });
Q({ id: "m-np-5", d: 2, secs: 45, prompt: "x = (1, 3, 5), y = (2, 4, 6, 7). AUC of using the value to rank x above y? (2 decimals)", answer: 0.25, tol: 0.01, explain: "U/(n₁n₂) = 3/12.", py: "from scipy import stats\nanswer = float(stats.mannwhitneyu([1,3,5],[2,4,6,7]).statistic/12)", packages: SP });
Q({ id: "m-np-6", d: 1, secs: 30, prompt: "Rank-based alternative to one-way ANOVA?", options: ["Wilcoxon signed-rank", "Kruskal–Wallis", "Fisher's exact test", "Sign test"], answer: 1, explain: "Kruskal–Wallis generalises Mann–Whitney to k groups.", py: "from scipy import stats\nr=stats.kruskal([1,2,3],[4,5,6]);m=stats.mannwhitneyu([1,2,3],[4,5,6],method='asymptotic',use_continuity=False)\nanswer = 1 if abs(r.pvalue-m.pvalue)<1e-9 else 0", packages: SP });
C("m-np-c1", "Mann–Whitney tests", "P(X > Y) ≠ ½, not medians in general.");
C("m-np-c2", "U and AUC", "AUC = U/(n₁n₂).");

L("m-regression-inference", ST, "Inference in linear regression", "Coefficient standard errors, t-tests and intervals, R² and adjusted R², and the assumptions that make them valid.", {
  kind: "concept", mins: 25, prereq: ["m-z-t-tests", "m-projections"],
  hook: "The coefficient on 'discount' is 2.4 with SE 0.8. Significant? And what has to be true for that SE to mean anything?",
  intuition: `
**The situation.** A regression gives coefficients, but they're estimates from one sample. You want to know which are reliably non-zero, how precisely they're pinned down, and how much the model explains.

**The idea.** Each coefficient has a **standard error**; $t = \\hat\\beta/\\text{SE}$ tests whether it is zero (holding the other predictors fixed), and $\\hat\\beta \\pm t_{\\text{crit}}\\,\\text{SE}$ gives an interval.

**$R^2$** is the share of variance explained. It never falls when you add predictors, so **adjusted $R^2$** penalises extra terms.

**Assumptions (for the SEs)**: linear mean, independent errors, constant error variance (homoscedasticity), and for small samples normal errors. Violations don't necessarily bias $\\hat\\beta$, but they break the SEs:

- Heteroscedasticity → robust (HC) standard errors.
- Clustered data → cluster-robust SEs.
- Multicollinearity → inflated SEs (VIF), unstable signs.
- Omitted confounders → biased $\\hat\\beta$ itself.
`,
  maths: `
**In one breath.** $\\hat\\beta = (X^\\top X)^{-1}X^\\top y$; $\\text{Var}(\\hat\\beta) = \\sigma^2(X^\\top X)^{-1}$, $\\hat\\sigma^2 = \\text{SSE}/(n - p - 1)$; $t_j = \\hat\\beta_j/\\text{SE}_j$ on $n - p - 1$ df; $R^2 = 1 - \\text{SSE}/\\text{SST}$; $\\bar R^2 = 1 - (1 - R^2)\\frac{n-1}{n-p-1}$; $\\text{VIF}_j = 1/(1 - R_j^2)$.

**Worked example.** $\\hat\\beta = 2.4$, SE 0.8, $n = 50$, $p = 2$ predictors: $t = 3.0$ on 47 df, $p = 0.0043$; 95% CI $2.4 \\pm 2.012 \\times 0.8 = (0.79, 4.01)$.

**$R^2$.** SSE 30, SST 120: $R^2 = 0.75$; adjusted with $n = 50$, $p = 2$: $1 - 0.25 \\times 49/47 = 0.739$.

**Simple regression by hand.** $x = 1..5$, $y = 2, 4, 5, 4, 5$: slope 0.6, intercept 2.2, slope SE 0.283, $t = 2.12$, $p = 0.124$ with only 3 df.

**Multicollinearity.** If a predictor is explained by the others with $R_j^2 = 0.9$, its VIF is 10: its variance is 10 times what it would be with uncorrelated predictors (SE $\\sqrt{10} \\approx 3.2$ times).

**F-test.** Compares nested models: are the extra coefficients jointly zero? Handy when individual t-tests are weak because predictors are correlated.
`,
  practice: `
**Code.** statsmodels \`sm.OLS(y, sm.add_constant(X)).fit()\`, \`.summary()\`; robust SEs with \`.fit(cov_type="HC3")\`; cluster with \`cov_type="cluster"\`. \`scipy.stats.linregress\` for one predictor. scikit-learn gives coefficients but no inference.

**Reading coefficients.** "Holding the other predictors fixed" is doing a lot of work; with correlated predictors it can describe a situation that never occurs in the data. Causal readings need a design, not just a regression.
`,
  traps: [
    { trap: "A high R² means the model is right.", why: "R² measures fit, not correctness. Trending time series give high R² for unrelated variables; a correct model of a noisy process can have low R²." },
    { trap: "A non-significant coefficient means the variable doesn't matter.", why: "It may be collinear with others (inflated SE) or the study underpowered. Check VIFs and joint F-tests." },
  ],
  say: {
    prompt: "How do you test whether a regression coefficient is significant, and what assumptions does that rely on?",
    secs: 45,
    check: ["t = β̂/SE on n − p − 1 df; CI β̂ ± t·SE", "Interpretation: holding other predictors fixed", "Assumptions: linearity, independence, homoscedasticity, (normal errors small n)", "Fixes: robust / cluster SEs, transformations", "Multicollinearity inflates SEs (VIF); omitted variables bias β̂"],
    followups: [
      { q: "What does a VIF of 10 mean?", a: "The coefficient's variance is 10 times what it would be if that predictor were uncorrelated with the others." },
      { q: "Why use adjusted R²?", a: "Plain R² never decreases when you add predictors; the adjustment penalises extra parameters." },
      { q: "What are heteroscedasticity-robust SEs?", a: "Sandwich estimators (HC0–HC3) that stay valid when error variance changes with x." },
    ],
    answer: `Each coefficient has a standard error from σ²(XᵀX)⁻¹; dividing the estimate by it gives a t statistic on n − p − 1 degrees of freedom, and the estimate plus or minus about two standard errors gives a 95% interval. It tests whether the coefficient is zero holding the other predictors fixed. Those SEs assume the mean is linear, errors are independent with constant variance, and, in small samples, roughly normal. If variance changes with x I'd use robust standard errors; if observations cluster, cluster-robust ones. I'd also check VIFs, because collinearity inflates SEs, and remember that an omitted confounder biases the coefficient itself, which no SE fixes.`,
    avoid: ["Equating high R² with a correct model", "Reading a non-significant coefficient as no effect"],
  },
  terms: [["Standard error of β̂", "√ of the diagonal of σ̂²(XᵀX)⁻¹."], ["Adjusted R²", "R² penalised for the number of predictors."], ["VIF", "1/(1 − R²ⱼ); variance inflation from collinearity."]],
  sources: [MS.islr, MS.scipy],
});
Q({ id: "m-reg-1", d: 2, secs: 45, prompt: "β̂ = 2.4, SE 0.8, n = 50 with 2 predictors plus intercept. Two-sided p-value? (4 decimals)", answer: 0.0043, tol: 0.0002, explain: "t = 3 on 47 df.", py: "from scipy import stats\nanswer = float(2*stats.t.sf(2.4/0.8,47))", packages: SP });
Q({ id: "m-reg-2", d: 2, secs: 45, prompt: "Same coefficient. Half-width of its 95% confidence interval? (3 decimals)", answer: 1.609, tol: 0.002, explain: "t₀.₉₇₅,₄₇ = 2.012; × 0.8.", py: "from scipy import stats\nanswer = float(stats.t.ppf(0.975,47)*0.8)", packages: SP });
Q({ id: "m-reg-3", d: 1, secs: 45, prompt: "SSE = 30, SST = 120, n = 50, 2 predictors. Adjusted R²? (3 decimals)", answer: 0.739, tol: 0.002, explain: "1 − 0.25 × 49/47.", py: "r2=1-30/120\nanswer = 1-(1-r2)*(50-1)/(50-2-1)" });
Q({ id: "m-reg-4", d: 1, secs: 30, prompt: "A predictor has R² = 0.9 when regressed on the other predictors. Its VIF?", answer: 10, tol: 0.01, explain: "1/(1 − 0.9).", py: "import numpy as np\nrng=np.random.default_rng(0)\nn=400000\nz=rng.normal(size=n);x=3*z+rng.normal(size=n)\nr2=np.corrcoef(x,z)[0,1]**2\nanswer = round(float(1/(1-r2)))", packages: NP });
Q({ id: "m-reg-5", d: 2, secs: 60, prompt: "x = 1, 2, 3, 4, 5; y = 2, 4, 5, 4, 5. Standard error of the OLS slope? (3 decimals)", answer: 0.283, tol: 0.002, explain: "σ̂ = √(SSE/3) = √(2.4/3); Sxx = 10; SE = √(0.08) = 0.283.", py: "from scipy import stats\nanswer = float(stats.linregress([1,2,3,4,5],[2,4,5,4,5]).stderr)", packages: SP });
C("m-reg-c1", "Coefficient test", "t = β̂/SE on n − p − 1 df.");
C("m-reg-c2", "VIF", "1/(1 − R²ⱼ); 10 ⇒ SE about 3.2× larger.");

L("m-multiple-testing", ST, "Multiple testing: Bonferroni, Holm and false discovery rate", "Why running many tests manufactures significance, and how FWER and FDR corrections differ.", {
  kind: "concept", mins: 20, prereq: ["m-hypothesis"],
  hook: "Your A/B dashboard shows 20 metrics and 5 segments. Something is 'significant' every week. Is anything real?",
  intuition: `
**The situation.** Each test at $\\alpha = 0.05$ has a 5% false-alarm rate. Run 20 tests where nothing is happening and you expect one hit; the chance of at least one is 64%.

**Two targets.**

- **Family-wise error rate (FWER)**: the chance of *any* false positive. Controlled by **Bonferroni** (test each at $\\alpha/m$) or the uniformly better **Holm** step-down. Right when one false claim is costly (a launch decision, a clinical claim).
- **False discovery rate (FDR)**: the expected *share* of false positives among your discoveries. Controlled by **Benjamini–Hochberg**. Right when screening many candidates (genes, features, many metrics) and a few false leads are acceptable.

**Better than correcting: test less.** Pre-register one primary metric, a few guardrails, and treat everything else as exploratory to be confirmed in a follow-up.
`,
  maths: `
**In one breath.** $P(\\ge 1 \\text{ false positive}) = 1 - (1-\\alpha)^m$ (independent); Bonferroni: reject if $p_i \\le \\alpha/m$; Holm: sort $p_{(1)} \\le \\dots$, reject while $p_{(k)} \\le \\alpha/(m - k + 1)$; BH: largest $k$ with $p_{(k)} \\le k\\alpha/m$, reject $1..k$.

**Worked example.** Eight p-values: 0.001, 0.008, 0.039, 0.041, 0.042, 0.060, 0.074, 0.205; $\\alpha = q = 0.05$, $m = 8$.

| Rank $k$ | $p_{(k)}$ | Holm threshold $\\alpha/(m-k+1)$ | BH threshold $k\\alpha/m$ |
|---|---|---|---|
| 1 | 0.001 | 0.00625 ✓ | 0.00625 ✓ |
| 2 | 0.008 | 0.00714 ✗ stop | 0.0125 ✓ |
| 3 | 0.039 | | 0.01875 ✗ |
| 4 | 0.041 | | 0.025 ✗ |

Unadjusted: 5 "significant". Holm: 1. BH: 2 (the largest $k$ meeting its threshold is 2). BH-adjusted p-values: 0.008, 0.032, 0.067, …

**Expected false positives.** 1,000 true nulls at 0.05: about 50.

**Bonferroni is conservative** when tests are positively correlated (overlapping metrics); it still controls FWER, just with lost power.

| Method | Controls | Power | Use |
|---|---|---|---|
| none | nothing | highest | exploration only |
| Bonferroni | FWER | lowest | few tests, high stakes |
| Holm | FWER | ≥ Bonferroni | default FWER choice |
| Benjamini–Hochberg | FDR | higher | screening many hypotheses |
`,
  practice: `
**Code.** \`scipy.stats.false_discovery_control(p, method="bh")\` returns BH-adjusted p-values (\`"by"\` for arbitrary dependence); statsmodels \`multipletests\` covers Holm and Bonferroni.

**Hidden multiplicity.** Peeking repeatedly, slicing by many segments, trying several metrics or outlier rules and reporting the best: all multiple testing, even if only one p-value is shown.
`,
  traps: [
    { trap: "Correct only the tests you report.", why: "The multiplicity comes from every test you ran or could have chosen among; selecting the best one is the problem." },
    { trap: "FDR control at 5% means each discovery has a 5% chance of being false.", why: "It bounds the *expected proportion* of false discoveries across the list, not each item's probability." },
  ],
  say: {
    prompt: "You test 50 metrics in an experiment and 4 come out significant at 5%. How do you interpret that?",
    secs: 45,
    check: ["Expected ≈ 2.5 false positives if nothing changed", "P(≥ 1 FP) ≈ 92% at 50 independent tests", "FWER (Holm/Bonferroni) vs FDR (BH) and when to use each", "Primary metric pre-registered; others exploratory", "Confirm with a follow-up test"],
    followups: [
      { q: "Holm vs Bonferroni?", a: "Holm is a step-down version that rejects at least as much as Bonferroni while still controlling FWER." },
      { q: "When would you prefer BH?", a: "Screening many hypotheses where a known fraction of false leads is acceptable." },
      { q: "Is peeking a multiple-testing problem?", a: "Yes: each look is another test; use sequential methods with alpha spending." },
    ],
    answer: `If the treatment did nothing, 50 tests at 5% would give about two and a half significant results on average, and the chance of at least one is over 90%, so four hits is barely above noise. I'd first look at the pre-registered primary metric and guardrails, which should be judged on their own. For the rest, I'd apply a correction: Holm if any single false claim is costly, or Benjamini–Hochberg if I'm screening for leads and can tolerate a known share of false ones. Anything that survives only as an exploratory finding goes into a follow-up test before we act on it.`,
    avoid: ["Taking the 4 at face value", "Confusing FDR with per-result error"],
  },
  terms: [["FWER", "P(at least one false positive)."], ["FDR", "Expected share of false positives among rejections."], ["Holm", "Step-down Bonferroni; controls FWER."]],
  sources: [MS.scipy, MS.islr],
});
const PV = "p=[0.001,0.008,0.039,0.041,0.042,0.060,0.074,0.205]\n";
Q({ id: "m-mt-1", d: 1, secs: 30, prompt: "20 independent tests at α = 0.05, all nulls true. P(at least one false positive)? (3 decimals)", answer: 0.642, tol: 0.002, explain: "1 − 0.95²⁰.", py: "answer = 1-0.95**20" });
Q({ id: "m-mt-2", d: 1, secs: 30, prompt: "Bonferroni threshold for 10 tests with family-wise α = 0.05?", answer: 0.005, tol: 0.0002, explain: "0.05/10.", py: "answer = 0.05/10" });
Q({ id: "m-mt-3", d: 2, secs: 60, prompt: "p-values 0.001, 0.008, 0.039, 0.041, 0.042, 0.060, 0.074, 0.205. How many does Benjamini–Hochberg reject at q = 0.05?", answer: 2, tol: 0.5, explain: "Largest k with p₍ₖ₎ ≤ k × 0.05/8 is k = 2.", py: "from scipy import stats\n" + PV + "answer = int((stats.false_discovery_control(p)<=0.05).sum())", packages: SP });
Q({ id: "m-mt-4", d: 2, secs: 60, prompt: "Same p-values. How many does Holm reject at α = 0.05?", answer: 1, tol: 0.5, explain: "0.001 ≤ 0.05/8, but 0.008 > 0.05/7: stop.", py: PV + "s=sorted(p);m=len(s);k=0\nwhile k<m and s[k]<=0.05/(m-k): k+=1\nanswer = k" });
Q({ id: "m-mt-5", d: 2, secs: 45, prompt: "Same p-values. BH-adjusted p-value of the second-smallest? (3 decimals)", answer: 0.032, tol: 0.002, explain: "min over j ≥ 2 of 8p₍ⱼ₎/j = 8 × 0.008/2.", py: "from scipy import stats\n" + PV + "answer = float(sorted(stats.false_discovery_control(p))[1])", packages: SP });
Q({ id: "m-mt-6", d: 1, secs: 30, prompt: "1,000 true-null hypotheses each tested at α = 0.05. Expected number of false positives?", answer: 50, tol: 0.5, explain: "1,000 × 0.05.", py: "answer = round(1000*0.05)" });
C("m-mt-c1", "FWER vs FDR", "FWER: any false positive (Holm). FDR: share of false discoveries (BH).");
C("m-mt-c2", "BH rule", "Largest k with p₍ₖ₎ ≤ kq/m; reject the k smallest.");

L("m-correlation-causation", ST, "Correlation versus causation: confounding, reverse causation, colliders and Simpson's paradox", "The ways an association can mislead, with the kidney-stone reversal worked through.", {
  kind: "concept", mins: 20, prereq: ["m-joint"],
  hook: "Users who use feature X retain 30% better. Should you force everyone into feature X?",
  intuition: `
**The situation.** Observational data are full of associations. Most of the interesting business questions are causal: what happens *if we change* something?

**Why an association can mislead.**

- **Confounding**: a third variable drives both. Engaged users use more features *and* retain better; ice-cream sales and drownings both follow hot weather.
- **Reverse causation**: the outcome drives the "cause". Healthy people exercise more, but also being healthy makes exercise easier.
- **Selection / collider bias**: conditioning on a common *effect* creates an association. Among admitted students, test scores and interview scores look negatively related, because you needed one or the other to get in.
- **Chance**: with enough variables, something correlates.

**Simpson's paradox.** A trend in every subgroup reverses in the pooled data because the subgroups are mixed in different proportions. Which answer is right depends on the causal structure: you adjust for a confounder, not for a mediator or a collider.
`,
  maths: `
**Kidney stones (classic data).**

| | Treatment A | Treatment B |
|---|---|---|
| Small stones | 81/87 = 93.1% | 234/270 = 86.7% |
| Large stones | 192/263 = 73.0% | 55/80 = 68.8% |
| Overall | 273/350 = 78.0% | 289/350 = 82.6% |

A wins in both strata but loses overall, because doctors gave A mostly to the hard (large-stone) cases. Stone size affects both treatment choice and outcome: a confounder, so adjust.

**Adjusted (standardised) rates.** Weight each stratum by its share of all patients (small 357/700, large 343/700): A $= 0.51 \\times 0.931 + 0.49 \\times 0.730 = 0.833$; B $= 0.779$. A is better by 5.4 points.

**Partial correlation.** Remove a variable's linear influence: $r_{xy\\cdot z} = \\frac{r_{xy} - r_{xz}r_{yz}}{\\sqrt{(1 - r_{xz}^2)(1 - r_{yz}^2)}}$. With $r_{xy} = 0.5$, $r_{xz} = 0.6$, $r_{yz} = 0.7$: $0.08/0.571 = 0.14$. Most of the $x$–$y$ association ran through $z$.

**Correlation from shared noise.** If $y = x + \\varepsilon$ with $\\text{Var}(\\varepsilon) = \\text{Var}(x)$, $r = 1/\\sqrt2 = 0.71$.

| Structure | Picture | Adjust for Z? |
|---|---|---|
| Confounder | X ← Z → Y | yes |
| Mediator | X → Z → Y | no (for the total effect) |
| Collider | X → Z ← Y | no: conditioning creates bias |
`,
  practice: `
**In product analytics.** "Users who do X retain better" is nearly always confounded by engagement. To learn the effect of X, randomise exposure (A/B test), or use a quasi-experiment. When you only have observational data, state the confounders you adjusted for and the ones you couldn't.

**In ML.** Models learn correlations, including confounded ones (hospital-specific scanner tags predicting disease). Feature importance is not causal effect.
`,
  traps: [
    { trap: "Control for every available variable to be safe.", why: "Adjusting for a mediator removes part of the effect you want; adjusting for a collider creates spurious associations. Choose adjustments from the causal structure." },
    { trap: "The pooled result in Simpson's paradox is always wrong.", why: "It depends on the structure. When the grouping variable is a confounder, use the stratified answer; when it's caused by the treatment, the pooled answer can be the right one." },
  ],
  say: {
    prompt: "Users who use feature X have 30% higher retention. A PM wants to push everyone into X. What do you say?",
    secs: 45,
    check: ["Association, not causation", "Likely confounder: engagement/intent drives both", "Possible reverse causation or selection", "Best: randomised test (e.g. promote X to a random half)", "Otherwise: adjust for pre-period engagement, matching, quasi-experiments; state limits"],
    followups: [
      { q: "Explain Simpson's paradox with an example.", a: "Kidney stones: A wins for small and large stones but loses overall because it was given mostly to large stones." },
      { q: "What is collider bias?", a: "Conditioning on a common effect of X and Y induces an association between them, e.g. analysing only hired candidates." },
      { q: "How could you test the PM's idea cheaply?", a: "Randomly promote feature X to half of new users and compare retention between the randomised groups (intention-to-treat)." },
    ],
    answer: `That's an association, and the most likely explanation is a confounder: users who are already engaged or have high intent both discover feature X and stick around, so X may not cause any of the retention gap. There could also be reverse causation, since people who plan to stay are the ones who invest in features. Forcing everyone into X could do nothing or even annoy people. I'd propose a randomised test: promote X to a random half of users and compare retention between the two randomised groups. If that isn't possible, I'd compare users with similar pre-period engagement, and be explicit about what remains unadjusted.`,
    avoid: ["Accepting the causal claim", "Controlling for everything without thinking"],
  },
  terms: [["Confounder", "Common cause of treatment and outcome."], ["Collider", "Common effect; conditioning on it induces bias."], ["Simpson's paradox", "Subgroup trends reverse when pooled."]],
  sources: [MS.mixtape, MS.islr],
});
const KS = "from fractions import Fraction as F\nA=[(81,87),(192,263)];B=[(234,270),(55,80)]\nw=[F(87+270,700),F(263+80,700)]\n";
Q({ id: "m-cc-1", d: 1, secs: 30, prompt: "Kidney stones: A succeeds 273 of 350 overall, B 289 of 350. Overall success rate of B minus A? (3 decimals)", answer: 0.046, tol: 0.002, explain: "0.826 − 0.780.", py: KS + "answer = float(F(sum(a for a,_ in B),350)-F(sum(a for a,_ in A),350))" });
Q({ id: "m-cc-2", d: 2, secs: 60, prompt: "A: small 81/87, large 192/263; B: small 234/270, large 55/80. Standardised success rate of A using the overall stone mix (357 small, 343 large of 700)? (3 decimals)", answer: 0.833, tol: 0.002, explain: "0.51 × 0.931 + 0.49 × 0.730.", py: KS + "answer = float(sum(wi*F(a,n) for wi,(a,n) in zip(w,A)))" });
Q({ id: "m-cc-3", d: 2, secs: 60, prompt: "Same data. Standardised rate of A minus standardised rate of B? (3 decimals)", answer: 0.054, tol: 0.002, explain: "0.833 − 0.779: A is better once stone size is adjusted for.", py: KS + "sa=sum(wi*F(a,n) for wi,(a,n) in zip(w,A));sb=sum(wi*F(a,n) for wi,(a,n) in zip(w,B))\nanswer = float(sa-sb)" });
Q({ id: "m-cc-4", d: 2, secs: 60, prompt: "r(x, y) = 0.5, r(x, z) = 0.6, r(y, z) = 0.7. Partial correlation of x and y given z? (3 decimals)", answer: 0.14, tol: 0.002, explain: "(0.5 − 0.42)/√(0.64 × 0.51).", py: "import numpy as np\nR=np.array([[1,.5,.6],[.5,1,.7],[.6,.7,1]])\nP=np.linalg.inv(R)\nanswer = float(-P[0,1]/np.sqrt(P[0,0]*P[1,1]))", packages: NP });
Q({ id: "m-cc-5", d: 2, secs: 45, prompt: "Among hired candidates, test score and interview score are negatively correlated, though they're unrelated in all applicants. This is:", options: ["Confounding", "Reverse causation", "Collider (selection) bias", "Regression to the mean"], answer: 2, explain: "Hiring depends on both scores; conditioning on it induces a negative association.", py: "import numpy as np\nrng=np.random.default_rng(0)\nt=rng.normal(size=200000);i=rng.normal(size=200000)\nh=(t+i)>1.5\nanswer = 2 if np.corrcoef(t[h],i[h])[0,1] < -0.2 else 0", packages: NP });
Q({ id: "m-cc-6", d: 1, secs: 45, prompt: "y = x + ε with ε independent of x and Var(ε) = Var(x). Correlation of x and y? (3 decimals)", answer: 0.707, tol: 0.002, explain: "Cov = Var x; SD(y) = √2 SD(x): r = 1/√2.", py: "import numpy as np\nS=np.array([[1,1],[1,2.]])\nanswer = float(S[0,1]/np.sqrt(S[0,0]*S[1,1]))", packages: NP });
C("m-cc-c1", "Adjust or not", "Confounder: yes. Mediator: not for total effect. Collider: never.");
C("m-cc-c2", "Simpson's paradox", "Unequal subgroup mix reverses the pooled trend.");

L("m-causal-inference", ST, "Causal inference basics: potential outcomes, DAGs and quasi-experiments", "What a causal effect is, why randomisation identifies it, and the main tools when you can't randomise.", {
  kind: "concept", mins: 25, prereq: ["m-correlation-causation"],
  hook: "You can't A/B test a price change in one city. How would you still estimate its effect?",
  intuition: `
**The situation.** You want "what would have happened otherwise", but each unit only shows you one version of reality.

**Potential outcomes.** Each unit has $Y(1)$ (treated) and $Y(0)$ (untreated). The individual effect $Y(1) - Y(0)$ is never observed (the fundamental problem). The **average treatment effect** $\\text{ATE} = E[Y(1) - Y(0)]$ can be estimated if treated and untreated groups are comparable.

**Randomisation** makes them comparable by design: treatment is independent of potential outcomes, so the difference in means is unbiased.

**Without randomisation** you need assumptions:

- **Adjustment (back-door)**: measure all confounders and compare like with like (stratify, regress, match, inverse-propensity weighting). Assumes no unmeasured confounding.
- **Difference-in-differences**: compare the change in a treated group with the change in a control group. Assumes parallel trends.
- **Instrumental variables**: a variable that shifts treatment but affects the outcome only through it.
- **Regression discontinuity**: treatment assigned by a cut-off; compare just above and just below.
- **Synthetic control**: build a weighted combination of untreated units that tracks the treated one before the change.
`,
  maths: `
**In one breath.** $\\text{ATE} = E[Y(1)] - E[Y(0)]$; naive difference $= \\text{ATE} + \\text{selection bias}$; back-door adjustment $E[Y(t)] = \\sum_z E[Y\\mid T = t, Z = z]P(z)$; IPW weight $1/e(x)$ for treated, $1/(1 - e(x))$ for control; DiD $= (\\bar Y_{T,\\text{post}} - \\bar Y_{T,\\text{pre}}) - (\\bar Y_{C,\\text{post}} - \\bar Y_{C,\\text{pre}})$; IV (Wald) $= \\frac{\\text{effect of } Z \\text{ on } Y}{\\text{effect of } Z \\text{ on } T}$.

**DiD example.** Weekly orders (thousands): treated city 10 → 15, control city 8 → 10. DiD $= 5 - 2 = 3$. The control's change estimates what would have happened anyway.

**IPW example.** A treated user had a 20% propensity to be treated; it stands in for $1/0.2 = 5$ similar users. Extreme propensities give huge weights: trim or use overlap weights.

**IV example.** An encouragement email raises adoption by 0.5 (50 points) and revenue by ₹2.0 per user; the effect of adoption on revenue among compliers is $2.0/0.5 = ₹4$.

**Selection bias decomposition.** $E[Y\\mid T=1] - E[Y\\mid T=0] = \\underbrace{E[Y(1) - Y(0)\\mid T=1]}_{\\text{effect on treated}} + \\underbrace{E[Y(0)\\mid T=1] - E[Y(0)\\mid T=0]}_{\\text{selection bias}}$.

| Method | Key assumption | Typical use |
|---|---|---|
| Randomised experiment | correct randomisation, no interference | A/B tests |
| Regression / matching / IPW | no unmeasured confounders, overlap | observational product data |
| Difference-in-differences | parallel trends | city or market roll-outs |
| Instrumental variables | exclusion, relevance | encouragement designs |
| Regression discontinuity | no manipulation at the cut-off | credit score thresholds |
| Synthetic control | pre-period fit carries forward | one treated region |
`,
  practice: `
**Workflow.** Draw the DAG; list confounders; decide whether you can randomise; if not, pick the design whose assumption is most believable and test it (pre-trends for DiD, balance after matching, density at the RDD cut-off).

**Tools.** DoWhy and EconML (Python), statsmodels for DiD regressions with fixed effects. Report sensitivity analyses: how strong would an unmeasured confounder have to be to erase the effect?
`,
  traps: [
    { trap: "Adding more controls to a regression makes the estimate causal.", why: "Only if they block all back-door paths and include no mediators or colliders; unmeasured confounders still bias it." },
    { trap: "DiD works whenever you have before/after data for two groups.", why: "It relies on parallel trends: without treatment, both groups would have changed by the same amount. Check pre-period trends." },
  ],
  say: {
    prompt: "You launched a price change in one city but not others. How would you estimate its effect on orders?",
    secs: 60,
    check: ["Counterfactual framing: what would the city have done anyway", "Difference-in-differences with comparable control cities", "Parallel-trends assumption; check pre-period", "Synthetic control as an alternative for one treated unit", "Inference: few clusters, placebo tests; caveats (spillovers, concurrent events)"],
    followups: [
      { q: "How do you check parallel trends?", a: "Plot both groups before the change; test leads in an event-study regression." },
      { q: "What is a propensity score?", a: "The probability of treatment given covariates; matching or weighting on it balances observed confounders." },
      { q: "What makes a good instrument?", a: "It strongly moves the treatment (relevance) and affects the outcome only through the treatment (exclusion)." },
    ],
    answer: `The question is what orders in that city would have been without the change. I'd pick control cities with similar size and, crucially, similar pre-launch order trends, and use difference-in-differences: the treated city's change minus the controls' change, which strips out seasonality and market-wide shifts. The key assumption is parallel trends, which I'd check by plotting the weeks before launch and running an event-study with leads. With one treated city, synthetic control is often better: weight several untreated cities so they track the treated city closely before launch. I'd use placebo tests, such as pretending other cities were treated, to get a sense of the noise, and look out for spillovers or other events in that city.`,
    avoid: ["Simple before/after comparison", "No mention of parallel trends"],
  },
  terms: [["Potential outcomes", "Y(1), Y(0): outcomes under each treatment."], ["Difference-in-differences", "Change in treated minus change in control."], ["Propensity score", "P(treated | covariates)."]],
  sources: [MS.mixtape, MS.kohavi],
});
Q({ id: "m-cau-1", d: 1, secs: 30, prompt: "Treated city: 10 → 15 (thousand orders). Control city: 8 → 10. Difference-in-differences estimate?", answer: 3, tol: 0.01, explain: "(15 − 10) − (10 − 8).", py: "import numpy as np\ny=np.array([10,15,8,10.]);treat=np.array([1,1,0,0.]);post=np.array([0,1,0,1.])\nX=np.column_stack([np.ones(4),treat,post,treat*post])\nanswer = float(np.linalg.lstsq(X,y,rcond=None)[0][3])", packages: NP });
Q({ id: "m-cau-2", d: 1, secs: 30, prompt: "A treated unit had propensity score 0.2. Its inverse-propensity weight for estimating E[Y(1)]?", answer: 5, tol: 0.01, explain: "1/0.2.", py: "answer = 1/0.2" });
Q({ id: "m-cau-3", d: 2, secs: 45, prompt: "An encouragement email raises adoption by 0.5 and revenue by ₹2.0 per user. IV (Wald) estimate of adoption's effect on revenue?", answer: 4, tol: 0.01, explain: "2.0/0.5.", py: "import numpy as np\nrng=np.random.default_rng(0)\nn=400000\nz=rng.integers(0,2,n);u=rng.normal(size=n)\nt=(rng.uniform(size=n)<0.2+0.5*z).astype(float)\ny=4*t+2*u+rng.normal(size=n)\nanswer = round(float((y[z==1].mean()-y[z==0].mean())/(t[z==1].mean()-t[z==0].mean())))", packages: NP });
Q({ id: "m-cau-4", d: 2, secs: 60, prompt: "Potential outcomes for 4 users (Y(1), Y(0)): (5, 3), (4, 4), (6, 2), (3, 3). Users 1 and 3 were treated. Naive difference in observed means minus the true ATE?", answer: 0.5, tol: 0.01, explain: "Naive: (5 + 6)/2 − (4 + 3)/2 = 2. True ATE = (2 + 0 + 4 + 0)/4 = 1.5. The gap of 0.5 = (effect on treated 3 − ATE 1.5) + selection bias (−1).", py: "Y1=[5,4,6,3];Y0=[3,4,2,3];T=[1,0,1,0]\nnaive=sum(y for y,t in zip(Y1,T) if t)/2-sum(y for y,t in zip(Y0,T) if not t)/2\nate=sum(a-b for a,b in zip(Y1,Y0))/4\nanswer = naive-ate" });
Q({ id: "m-cau-5", d: 2, secs: 45, prompt: "Which assumption does difference-in-differences rely on?", options: ["No unmeasured confounders at all", "Parallel trends in the absence of treatment", "Random assignment of treatment", "A valid instrument"], answer: 1, explain: "The control group's change must stand in for the treated group's counterfactual change.", py: "answer = 1" });
C("m-cau-c1", "Fundamental problem", "Y(1) and Y(0) are never both observed for one unit.");
C("m-cau-c2", "DiD assumption", "Parallel trends; check the pre-period.");

L("m-bayes-freq", ST, "Bayesian versus frequentist inference", "Priors and posteriors, credible versus confidence intervals, conjugate beta–binomial updates, and when each school is the practical choice.", {
  kind: "concept", mins: 20, prereq: ["m-bayes", "m-ci"],
  hook: "Stakeholders keep asking 'what's the probability B is better than A?'. Which framework can actually answer that?",
  intuition: `
**The situation.** Two schools answer different questions.

- **Frequentist**: parameters are fixed, data are random. Methods are judged by long-run behaviour: a 95% interval procedure covers the truth 95% of the time; a 5% test is wrong 5% of the time under the null.
- **Bayesian**: parameters are uncertain and described by distributions. Start with a **prior**, multiply by the **likelihood** of the data, get a **posterior**. You can then say "P(B > A | data) = 0.95" directly.

**Practical differences.**

- Priors add information (or regularisation); with lots of data the likelihood dominates and the two usually agree.
- A **credible interval** contains the parameter with 95% posterior probability: the sentence people mistakenly say about confidence intervals.
- Bayesian answers are natural for decisions (expected loss, probability of being best) and for small data with real prior knowledge; frequentist ones give guarantees that don't depend on a prior and are the norm in regulated settings.
- Neither fixes peeking or multiple comparisons on its own.
`,
  maths: `
**In one breath.** $p(\\theta\\mid x) \\propto p(x\\mid\\theta)\\,p(\\theta)$; Beta$(\\alpha, \\beta)$ prior + $k$ successes in $n$ → Beta$(\\alpha + k, \\beta + n - k)$; posterior mean $\\frac{\\alpha + k}{\\alpha + \\beta + n}$; MAP with flat prior = MLE.

**Worked example: conversion rate.** Uniform prior Beta(1, 1), 7 of 10 convert: posterior Beta(8, 4), mean $8/12 = 0.667$ (the MLE is 0.7; the prior pulls slightly to 0.5). Equal-tailed 95% credible interval: (0.39, 0.89).

**Informative prior.** Beta(2, 2) (mild belief near 0.5), 3 of 10: posterior Beta(5, 9), mean $5/14 = 0.357$. The prior acts like 2 extra successes and 2 extra failures.

**P(B > A).** A: 20 of 100, B: 30 of 100, uniform priors → Beta(21, 81) and Beta(31, 71). $P(p_B > p_A) = \\int f_B(x)F_A(x)\\,dx = 0.948$.

| Question | Frequentist | Bayesian |
|---|---|---|
| Interval | confidence interval (coverage) | credible interval (posterior probability) |
| Test | p-value, reject at α | P(hypothesis \\| data), Bayes factor |
| Prior knowledge | design, not inference | explicit prior |
| Small data | wide intervals, exact tests | prior stabilises (shrinkage) |
| Decision | power, error rates | expected loss, P(best) |

**Shrinkage link.** Ridge regression is MAP with a Gaussian prior; empirical Bayes shrinks noisy group estimates (small-store conversion rates) towards the overall mean.
`,
  practice: `
**Code.** \`scipy.stats.beta(a, b)\` for conjugate updates and intervals (\`.interval(0.95)\`, \`.ppf\`); simulate \`P(B > A)\` by drawing from both posteriors. PyMC or Stan for anything non-conjugate.

**In A/B testing.** Bayesian dashboards report P(B better) and expected loss; they still need a pre-set stopping rule and a sensible prior, and with weak priors the decisions match frequentist ones closely.
`,
  traps: [
    { trap: "Bayesian testing makes peeking safe.", why: "Posteriors are valid at any time, but stopping as soon as P(B > A) crosses a threshold still inflates the rate of wrong launches under a null. Decide the rule in advance." },
    { trap: "A credible and a confidence interval are the same thing with different names.", why: "They answer different questions and can differ, especially with small data or informative priors; with flat priors and large n they often coincide numerically." },
  ],
  say: {
    prompt: "Compare Bayesian and frequentist approaches to an A/B test result.",
    secs: 45,
    check: ["Frequentist: fixed parameter, p-values and CIs with long-run guarantees", "Bayesian: prior × likelihood → posterior; P(B > A | data)", "Credible vs confidence interval meaning", "Large n: usually similar answers; prior matters for small n", "Neither fixes peeking/multiplicity; choose by the decision and stakeholders"],
    followups: [
      { q: "Posterior for a conversion rate with a Beta(1, 1) prior and 7/10?", a: "Beta(8, 4), mean 0.667." },
      { q: "What is a conjugate prior?", a: "One for which the posterior is in the same family, e.g. beta prior with binomial likelihood." },
      { q: "When would you prefer Bayesian methods?", a: "Small samples with real prior information, hierarchical structure, or when decisions need probabilities or expected losses." },
    ],
    answer: `A frequentist analysis treats the true lift as fixed and asks how surprising the data would be if there were no lift, giving a p-value and a confidence interval whose guarantee is about long-run error rates. A Bayesian analysis puts a prior on the conversion rates, updates it with the data, and gives a posterior, so you can say directly that there's, say, a 95% probability B beats A, or compute the expected loss of launching. With large samples and weak priors the two usually point the same way. Bayesian methods shine with small samples and real prior knowledge, or when the decision needs a probability. Neither removes the need to fix the stopping rule and the primary metric in advance.`,
    avoid: ["Saying Bayesian makes peeking free", "Treating the two intervals as identical"],
  },
  terms: [["Prior", "Belief about θ before the data."], ["Posterior", "Prior × likelihood, normalised."], ["Credible interval", "Interval with given posterior probability."]],
  sources: [MS.seeing, MS.scipy, MS.mml],
});
Q({ id: "m-bvf-1", d: 1, secs: 30, prompt: "Beta(1, 1) prior, 7 conversions in 10. Posterior mean? (3 decimals)", answer: 0.667, tol: 0.002, explain: "Beta(8, 4): 8/12.", py: "from scipy import stats\nanswer = float(stats.beta(1+7,1+3).mean())", packages: SP });
Q({ id: "m-bvf-2", d: 1, secs: 45, prompt: "Beta(2, 2) prior, 3 conversions in 10. Posterior mean? (3 decimals)", answer: 0.357, tol: 0.002, explain: "Beta(5, 9): 5/14.", py: "from scipy import stats\nanswer = float(stats.beta(2+3,2+7).mean())", packages: SP });
Q({ id: "m-bvf-3", d: 2, secs: 45, prompt: "Posterior Beta(8, 4). Lower end of the equal-tailed 95% credible interval? (3 decimals)", answer: 0.39, tol: 0.002, explain: "beta.ppf(0.025, 8, 4).", py: "from scipy import stats\nanswer = float(stats.beta.ppf(0.025,8,4))", packages: SP });
Q({ id: "m-bvf-4", d: 3, secs: 90, prompt: "A: 20/100, B: 30/100, uniform priors. P(p_B > p_A) under the posteriors? (3 decimals)", answer: 0.948, tol: 0.004, explain: "∫ f_B(x) F_A(x) dx with Beta(21, 81) and Beta(31, 71).", py: "from scipy import stats, integrate\nA=stats.beta(21,81);B=stats.beta(31,71)\nanswer = float(integrate.quad(lambda x:B.pdf(x)*A.cdf(x),0,1)[0])", packages: SP });
Q({ id: "m-bvf-5", d: 2, secs: 45, prompt: "Which statement can only be made in a Bayesian analysis?", options: ["The test rejects H₀ at the 5% level", "The procedure covers the truth 95% of the time", "There is a 95% probability the parameter lies in this interval", "The p-value is 0.03"], answer: 2, explain: "Probability statements about the parameter need a posterior.", py: "answer = 2" });
C("m-bvf-c1", "Beta–binomial update", "Beta(α, β) + k of n → Beta(α + k, β + n − k).");
C("m-bvf-c2", "Credible vs confidence", "Credible: posterior probability. Confidence: long-run coverage.");

L("m-stats-practice", ST, "Statistics practice", "Six interview questions on tests, intervals, multiple testing and causality.", {
  kind: "interview", mins: 25, prereq: ["m-ci", "m-hypothesis", "m-z-t-tests", "m-multiple-testing", "m-correlation-causation"],
  hook: "Answer each out loud in about a minute, then open it and tick off what the interviewer listens for.",
}, [
  iq("Explain a p-value and a confidence interval to a non-technical stakeholder, and how they relate.", "p-value: if there were no real difference, how often we'd see one at least this big by chance. CI: range of effect sizes consistent with the data; the procedure captures the truth 95% of the time. A 95% CI excludes zero exactly when the two-sided p < 0.05. Lead with the CI in business units.", ["Correct p-value definition", "Correct CI interpretation", "Duality", "Effect size in business terms"]),
  iq("You have revenue per user for two groups, heavily skewed with a few whales. How do you test for a difference?", "Mean is the business metric; with large n Welch's t-test works via the CLT. Check influence of whales: winsorise/cap at a pre-set percentile, bootstrap the difference, or use a log transform (changes the estimand). Mann–Whitney tests stochastic ordering, not the mean. CUPED to reduce variance.", ["Keep the mean as estimand", "Welch + CLT at large n", "Capping / bootstrap", "Caveat on Mann–Whitney / log estimand"]),
  iq("What's the difference between Type I and Type II errors, and how do you trade them off when planning a test?", "Type I: false positive at rate α; Type II: missing a real effect at rate β, power = 1 − β. Fix α (e.g. 5%), choose the minimum effect worth detecting, and size the sample for 80% power. Trade-off depends on costs: a risky launch warrants lower α; cheap reversible changes can accept more.", ["Definitions", "Power and MDE", "Sample size planning", "Cost-based trade-off"]),
  iq("Why can't you just run t-tests for every pair among 5 variants?", "10 pairs; FWER inflates to roughly 40% at α = 0.05. Use ANOVA then post-hoc (Tukey) or compare each variant with control with Holm/Dunnett correction; pre-specify comparisons.", ["Count pairs (10)", "Inflated FWER", "ANOVA / post-hoc or corrected comparisons", "Pre-specification"]),
  iq("Users who received a promo email spent more. How would you find out whether the email caused it?", "Likely selection: targeted users differ. Ideal: randomised holdout. If observational: adjust for pre-period spend and engagement (regression, matching, IPW), check overlap; or quasi-experiments (DiD if roll-out timing varied, RDD if a score threshold chose recipients). State remaining confounding.", ["Identify selection/confounding", "Randomised holdout", "Observational adjustment", "Quasi-experiment and caveats"]),
  iq("When would you use the bootstrap, and how would you bootstrap a metric in an A/B test where users have many sessions?", "No closed-form SE (median, ratio, percentile, AUC) or doubtful assumptions. Resample users (the randomisation unit) with replacement within each arm, recompute the metric per resample, take percentile/BCa interval of the difference. Resampling sessions understates variance.", ["When: no formula / non-standard statistic", "Resample the independent unit (users)", "Within each arm", "Interval of the difference; session-level caveat"]),
]);
