/**
 * P3 · Statistics · Two-sample vs paired t-tests (pilot concept).
 * Every numeric answer carries a `check` that scripts/verify-items.mts recomputes with scipy in Pyodide.
 */
import { Card_, Item, R, T } from "./build";

const SRC = "Practice: standard two-sample and paired t-test pattern (Nov 2026)";
const PAIRED = `before = [62, 70, 55, 68, 74, 60]; after = [66, 75, 57, 71, 80, 61]`;
const DATA_A = "Six students take a mock test, attend one coaching session, then take a second mock test. Scores, same students in the same order:\n\n- Before: 62, 70, 55, 68, 74, 60\n- After: 66, 75, 57, 71, 80, 61";
const DATA_B = "A checkout redesign is tested on two separate groups of users. Minutes to complete checkout:\n\n- New design: n = 12, mean 48.2, standard deviation 6.1\n- Old design: n = 15, mean 43.5, standard deviation 9.4";
const PY_A = `import numpy as np
from scipy import stats
${PAIRED}
b = np.array(before); a = np.array(after); d = a - b`;
const PY_B = `import numpy as np
from scipy import stats
m1, s1, n1 = 48.2, 6.1, 12
m2, s2, n2 = 43.5, 9.4, 15
v1, v2 = s1**2 / n1, s2**2 / n2`;
const pk = ["scipy"];

T(
  "st-ttest-paired-vs-two",
  "analyst",
  "Hypothesis tests",
  "Two-sample vs paired t-test",
  "Same units measured twice, or two separate groups? The answer decides the test, and getting it wrong can flip the conclusion.",
  `
**The question that decides it.** Is each value in group 1 linked to one specific value in group 2? The same person before and after, the same store in two weeks, twins, left and right eye. If yes, the data is **paired**. If the groups are separate units, it is **two-sample** (independent).

**Which test? Node 1 of the decision tree.**

1. Comparing means of a numeric outcome across exactly two conditions?
2. Same or matched units in both conditions → **paired t-test** (if the differences are badly non-normal and n is small → Wilcoxon signed-rank).
3. Different units → **two-sample t-test**. Default to **Welch** (unequal variances). Use pooled only with a reason to believe the variances are equal.
4. Three or more groups → ANOVA, not repeated t-tests (later node).

**Paired t-test.** Work with the differences $d_i = x_{\\text{after},i} - x_{\\text{before},i}$. It is a one-sample t-test on $d$:

$$t = \\frac{\\bar d}{s_d / \\sqrt{n}}, \\qquad \\text{df} = n - 1$$

**Two-sample, Welch.**

$$t = \\frac{\\bar x_1 - \\bar x_2}{\\sqrt{s_1^2/n_1 + s_2^2/n_2}}, \\qquad \\text{df} = \\frac{(s_1^2/n_1 + s_2^2/n_2)^2}{\\frac{(s_1^2/n_1)^2}{n_1-1} + \\frac{(s_2^2/n_2)^2}{n_2-1}}$$

**Two-sample, pooled.** $s_p^2 = \\frac{(n_1-1)s_1^2 + (n_2-1)s_2^2}{n_1+n_2-2}$, then $t = \\frac{\\bar x_1 - \\bar x_2}{s_p\\sqrt{1/n_1 + 1/n_2}}$ with $n_1 + n_2 - 2$ df.

**Why pairing gives more power.** $\\text{Var}(X_1 - X_2) = \\sigma_1^2 + \\sigma_2^2 - 2\\,\\text{Cov}(X_1, X_2)$. Scores of the same person are positively correlated, so the covariance term removes the person-to-person spread, and only the change is left. An independent test keeps all that spread in the denominator.

**Worked example 1: paired.** Coaching data: before 62, 70, 55, 68, 74, 60; after 66, 75, 57, 71, 80, 61. Differences 4, 5, 2, 3, 6, 1. $\\bar d = 3.5$, $s_d = 1.871$, standard error $1.871/\\sqrt 6 = 0.764$, so $t = 4.58$ on 5 df. Two-sided $p \\approx 0.006$: the session helped.

**Worked example 2: the same data, wrong test.** Treat before and after as two independent groups: means 64.8 and 68.3, but the groups' standard deviations are 7.1 and 8.7, because students differ a lot from each other. Welch $t = 0.77$, $p \\approx 0.46$: "no effect". Same numbers, opposite conclusion. The pairing is information; throwing it away buries a consistent +3.5 under person-to-person variation.

**Worked example 3: Welch from summary statistics.** New design n = 12, mean 48.2, sd 6.1; old design n = 15, mean 43.5, sd 9.4. Standard error $\\sqrt{6.1^2/12 + 9.4^2/15} = 3.00$, $t = 4.7/3.00 = 1.57$, Welch df ≈ 24.1. With a critical value of about 2.06, do not reject at 5%.

**Worked example 4: pooled on the same summary.** $s_p = 8.12$, $t = 4.7 / (8.12\\sqrt{1/12 + 1/15}) = 1.50$ on 25 df. Close to Welch here, but pooled assumes the variances are equal, and 9.4 vs 6.1 is a variance ratio of 2.4. When the smaller group has the larger variance, pooled t becomes too liberal, so default to Welch.

**Effect size.** For paired data report $d_z = \\bar d / s_d$ (1.87 in example 1) alongside the p-value. A p-value says the effect is unlikely to be zero; it does not say it is large.

**Assumptions.** Paired: the differences are roughly normal (or n is large enough for the CLT), and the pairs are independent of each other. Two-sample: both groups are roughly normal or large, and the observations are independent within and between groups.
`,
  {
    resources: [
      R("Penn State STAT 500, Lesson 7: comparing two population parameters", "https://online.stat.psu.edu/stat500/Lesson07.html", "Paired and independent tests side by side, with worked examples"),
      R("SciPy: scipy.stats.ttest_rel", "https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.ttest_rel.html", "The paired test in code"),
      R("SciPy: scipy.stats.ttest_ind", "https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.ttest_ind.html", "equal_var=False gives Welch"),
    ],
    interview: [
      {
        q: "When would you use a paired t-test instead of a two-sample t-test? Give an example from product analytics.",
        answer:
          "When every observation in one condition is linked to one specific observation in the other, so the comparison is within a unit. Example: the same 200 stores' weekly revenue before and after a pricing change, or the same users' session length on the old and new app version in a crossover test. If the conditions were given to different users, as in a normal A/B test, the samples are independent and a two-sample (Welch) test applies.",
        rubric: [
          "Defines pairing as a one-to-one link between observations (same or matched unit)",
          "Gives a concrete paired example (before/after on the same units, or matched pairs)",
          "Contrasts it with a standard A/B test on separate users, which is independent",
          "Mentions that the paired test analyses the differences (a one-sample t on d)",
        ],
      },
      {
        q: "Why does a paired design usually have more power than an independent one with the same number of measurements?",
        answer:
          "Because Var(X1 − X2) = Var(X1) + Var(X2) − 2·Cov(X1, X2). Measurements on the same unit are positively correlated, so the covariance term cancels the unit-to-unit spread and the standard error of the mean difference shrinks. An independent test keeps that spread in its denominator. The cost: n − 1 df instead of about 2n − 2, which matters only when n is tiny.",
        rubric: [
          "Writes or describes the variance of a difference including the covariance term",
          "Says the correlation within pairs is positive, so the variance drops",
          "Connects the smaller variance to a smaller standard error and a larger t",
          "Notes the trade-off in degrees of freedom",
        ],
      },
      {
        q: "Welch or pooled two-sample t-test: which do you use by default, and why?",
        answer:
          "Welch. It does not assume equal variances, it loses almost no power when the variances are in fact equal, and pooled t can be badly wrong when the variances differ, especially when the smaller group has the larger variance. Pooling only makes sense with a strong prior reason the variances are equal. Testing for equal variances first and then choosing is not recommended, because that pre-test changes the error rates of the final test.",
        rubric: [
          "Chooses Welch as the default",
          "Explains that pooled assumes equal variances and fails when they differ, especially with unequal n",
          "Notes Welch costs little when the variances are equal",
          "Bonus: warns against pre-testing variances to pick the test",
        ],
      },
      {
        q: "You ran a paired t-test on 8 pairs and the differences look skewed, with one large outlier. What do you do?",
        answer:
          "With n = 8 the CLT cannot be relied on, and one outlier can dominate the mean and standard deviation of the differences. First check the data: is the outlier an error? If it is real, use the Wilcoxon signed-rank test, which uses ranks of the differences, or a bootstrap confidence interval for the mean difference, and report the result both with and without the outlier. Do not delete it silently.",
        rubric: [
          "Recognises that normality of the differences matters at small n",
          "Checks whether the outlier is a data error before acting",
          "Names Wilcoxon signed-rank (or a bootstrap/permutation test) as the alternative",
          "Says to report a sensitivity analysis rather than drop the point silently",
        ],
      },
    ],
  },
);

// ───── Numeric and computed items: answers recomputed by scripts/verify-items.mts ─────

Item({ id: "p3-tt-001", d: 1, secs: 60, prompt: `${DATA_A}\n\nWhat is the mean of the differences (after − before)?`, answer: 3.5, tol: 0.01,
  explain: "Differences: 4, 5, 2, 3, 6, 1. Sum 21, divided by 6 = 3.5.",
  fast: "Subtract pair by pair first, then average the six differences.",
  trap: "Averaging each column separately is fine here, but only the differences feed the paired test, so get used to computing them.",
  src: SRC, check: { py: `${PY_A}\nanswer = d.mean()`, packages: pk } });

Item({ id: "p3-tt-002", d: 2, secs: 120, prompt: `${DATA_A}\n\nWhat is the sample standard deviation of the differences? Give 3 decimals.`, answer: 1.871, tol: 0.01,
  explain: "Deviations from 3.5: 0.5, 1.5, −1.5, −0.5, 2.5, −2.5. Squares sum to 17.5. Divide by n − 1 = 5: 3.5. Square root: 1.871.",
  fast: "Square the deviations from 3.5; the sum 17.5 divides cleanly by 5.",
  trap: "Dividing by n = 6 gives the population sd (1.708). A sample sd divides by n − 1.",
  src: SRC, check: { py: `${PY_A}\nanswer = d.std(ddof=1)`, packages: pk } });

Item({ id: "p3-tt-003", d: 2, secs: 150, prompt: `${DATA_A}\n\nWhat is the paired t statistic? Give 2 decimals.`, answer: 4.58, tol: 0.02,
  explain: "Standard error = 1.871 / √6 = 0.764. t = 3.5 / 0.764 = 4.58.",
  fast: "t = mean difference ÷ (sd of differences ÷ √n).",
  trap: "Using √(n − 1) or the sum of the two columns' standard deviations in the denominator.",
  src: SRC, check: { py: `${PY_A}\nanswer = stats.ttest_rel(a, b).statistic`, packages: pk } });

Item({ id: "p3-tt-004", d: 1, secs: 20, prompt: `${DATA_A}\n\nHow many degrees of freedom does the paired t-test have?`, answer: 5, tol: 0,
  explain: "A paired test is a one-sample test on the 6 differences: df = 6 − 1 = 5.",
  fast: "Number of pairs minus one.",
  trap: "Counting 12 observations and using 10 df, as an independent test would.",
  src: SRC, check: { py: `${PY_A}\nanswer = len(d) - 1`, packages: pk } });

Item({ id: "p3-tt-005", d: 2, secs: 120, prompt: `${DATA_A}\n\nUsing the critical value t(0.975, 5) = 2.571, what is the lower bound of the 95% confidence interval for the mean improvement? Give 2 decimals.`, answer: 1.54, tol: 0.01,
  explain: "3.5 − 2.571 × 0.764 = 3.5 − 1.964 = 1.54. The interval is about (1.54, 5.46). It excludes 0, consistent with rejecting H0 at 5%.",
  fast: "Mean ± t* × standard error, using the standard error you already have from the t statistic.",
  trap: "Using z = 1.96 with n = 6 makes the interval too narrow.",
  src: SRC, check: { py: `${PY_A}\nse = d.std(ddof=1) / np.sqrt(len(d))\nanswer = d.mean() - stats.t.ppf(0.975, len(d) - 1) * se`, packages: pk } });

Item({ id: "p3-tt-006", d: 1, secs: 30, prompt: `${DATA_A}\n\nA two-sided paired t-test at α = 0.05: what is the decision?`, options: ["Reject H0: the mean change is not zero", "Fail to reject H0"], answer: 0,
  explain: "t = 4.58 on 5 df is beyond the critical value 2.571 (p ≈ 0.006).",
  fast: "Compare |t| with t(0.975, df).",
  trap: "Running an independent test on these columns (next question) gives the opposite answer.",
  src: SRC, check: { py: `${PY_A}\nanswer = 0 if stats.ttest_rel(a, b).pvalue < 0.05 else 1`, packages: pk } });

Item({ id: "p3-tt-007", d: 3, secs: 180, prompt: `${DATA_A}\n\nSomeone ignores the pairing and runs Welch's two-sample t-test on the before and after columns. What t statistic do they get? Give 2 decimals.`, answer: 0.77, tol: 0.02,
  explain: "Means 64.83 and 68.33; standard deviations 7.05 and 8.66 with n = 6 each. Standard error = √(7.05²/6 + 8.66²/6) = 4.56. t = 3.5 / 4.56 = 0.77.",
  fast: "The numerator is still 3.5; the denominator now carries the between-student spread, which is far larger.",
  trap: "Expecting a similar t. The pairing removed person-to-person variation; ignoring it puts that variation back.",
  src: SRC, check: { py: `${PY_A}\nanswer = stats.ttest_ind(a, b, equal_var=False).statistic`, packages: pk } });

Item({ id: "p3-tt-008", d: 2, secs: 30, prompt: `${DATA_A}\n\nWith that unpaired Welch test at α = 0.05 (two-sided), what is the decision?`, options: ["Reject H0", "Fail to reject H0"], answer: 1,
  explain: "t = 0.77 gives p ≈ 0.46. The wrong test turns a clear effect into 'no evidence'.",
  fast: "|t| < 1 is never significant at 5%.",
  trap: "Thinking more observations (12 instead of 6 differences) means more power. Here the correct test has fewer df and far more power.",
  src: SRC, check: { py: `${PY_A}\nanswer = 0 if stats.ttest_ind(a, b, equal_var=False).pvalue < 0.05 else 1`, packages: pk } });

Item({ id: "p3-tt-009", d: 2, secs: 150, prompt: `${DATA_B}\n\nWhat is Welch's t statistic for new minus old? Give 2 decimals.`, answer: 1.57, tol: 0.02,
  explain: "Standard error = √(6.1²/12 + 9.4²/15) = √(3.101 + 5.891) = 2.999. t = (48.2 − 43.5) / 2.999 = 1.57.",
  fast: "Compute s²/n for each group, add them, take the square root.",
  trap: "Dividing by the difference of the standard deviations, or forgetting to square them.",
  src: SRC, check: { py: `${PY_B}\nanswer = stats.ttest_ind_from_stats(m1, s1, n1, m2, s2, n2, equal_var=False).statistic`, packages: pk } });

Item({ id: "p3-tt-010", d: 3, secs: 240, prompt: `${DATA_B}\n\nWhat are the Welch–Satterthwaite degrees of freedom? Give 1 decimal.`, answer: 24.1, tol: 0.2,
  explain: "(3.101 + 5.891)² / (3.101²/11 + 5.891²/14) = 80.85 / (0.874 + 2.479) = 24.1.",
  fast: "Reuse the two s²/n terms from the t statistic; the formula only needs those two numbers and n − 1 for each group.",
  trap: "Using n1 + n2 − 2 = 25, which is the pooled df.",
  src: SRC, check: { py: `${PY_B}\nanswer = (v1 + v2) ** 2 / (v1 ** 2 / (n1 - 1) + v2 ** 2 / (n2 - 1))`, packages: pk } });

Item({ id: "p3-tt-011", d: 2, secs: 150, prompt: `${DATA_B}\n\nWhat is the pooled standard deviation $s_p$? Give 2 decimals.`, answer: 8.12, tol: 0.02,
  explain: "s_p² = (11 × 37.21 + 14 × 88.36) / 25 = (409.31 + 1237.04) / 25 = 65.85. s_p = 8.12.",
  fast: "Weight each variance by its df, not by n.",
  trap: "Averaging the two standard deviations: (6.1 + 9.4) / 2 = 7.75.",
  src: SRC, check: { py: `${PY_B}\nanswer = np.sqrt(((n1 - 1) * s1**2 + (n2 - 1) * s2**2) / (n1 + n2 - 2))`, packages: pk } });

Item({ id: "p3-tt-012", d: 2, secs: 120, prompt: `${DATA_B}\n\nWhat is the pooled two-sample t statistic? Give 2 decimals.`, answer: 1.5, tol: 0.02,
  explain: "Standard error = 8.12 × √(1/12 + 1/15) = 8.12 × 0.387 = 3.143. t = 4.7 / 3.143 = 1.50.",
  fast: "s_p × √(1/n1 + 1/n2) is the standard error.",
  trap: "Using √(1/n1 + 1/n2) without multiplying by s_p.",
  src: SRC, check: { py: `${PY_B}\nanswer = stats.ttest_ind_from_stats(m1, s1, n1, m2, s2, n2, equal_var=True).statistic`, packages: pk } });

Item({ id: "p3-tt-013", d: 2, secs: 60, prompt: `${DATA_A}\n\nWhat is the paired effect size $d_z = \\bar d / s_d$? Give 2 decimals.`, answer: 1.87, tol: 0.02,
  explain: "3.5 / 1.871 = 1.87: a large effect in standardised terms.",
  fast: "It is t / √n: 4.58 / 2.449 = 1.87.",
  trap: "Dividing by the standard error instead of the standard deviation gives t, not an effect size.",
  src: SRC, check: { py: `${PY_A}\nanswer = d.mean() / d.std(ddof=1)`, packages: pk } });

Item({ id: "p3-tt-014", d: 2, secs: 45, prompt: `${DATA_A}\n\nThe paired t statistic is 4.58 on 5 df. Which range contains the two-sided p-value?`, options: ["Below 0.001", "0.001 to 0.01", "0.01 to 0.05", "Above 0.05"], answer: 1,
  explain: "Two-sided critical values on 5 df: 4.032 at 0.01 and 6.869 at 0.001. 4.58 lies between them, so 0.001 < p < 0.01 (p ≈ 0.006).",
  fast: "Bracket |t| between two rows of a t table, then read off the two-sided levels.",
  trap: "Reading one-sided levels from the table, which halves the p-value.",
  src: SRC, check: { py: `${PY_A}\np = stats.ttest_rel(a, b).pvalue\nanswer = 0 if p < 0.001 else 1 if p < 0.01 else 2 if p < 0.05 else 3`, packages: pk } });

Card_("p3-tt-c1", "Paired or two-sample?", "Paired when each value in one condition is linked to one value in the other (same or matched unit). Otherwise two-sample, and default to Welch.");
Card_("p3-tt-c2", "Paired t statistic and df", "t = d̄ / (s_d / √n) on the differences; df = number of pairs − 1.");
Card_("p3-tt-c3", "Why pairing adds power", "Var(X1 − X2) = σ1² + σ2² − 2Cov. Positive within-pair correlation removes unit-to-unit spread from the standard error.");
Card_("p3-tt-c4", "Welch vs pooled", "Welch by default: no equal-variance assumption and little power lost. Pooled fails when the variances and group sizes differ.");
