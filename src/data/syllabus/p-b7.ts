/**
 * Batch 7: P3 probability (normal, joint distributions, LLN and CLT, classic problems) and
 * statistics (sampling, standard error, estimation, confidence intervals, testing, z-tests,
 * one-sample t, chi-square). Items come from src/data/gen/b7.ts with scipy/statsmodels checks.
 */
import { B7_ITEMS, B7_TOPICS as B } from "@/data/gen/b7";
import type { InterviewQ, Resource } from "@/lib/types";
import { Card_, Item, R, T } from "./build";

const iq = (q: string, answer: string, rubric: string[]): InterviewQ => ({ q, answer, rubric });
const yt = (id: string, title: string, who = "StatQuest") => R(`Video: ${title} (${who})`, `https://www.youtube.com/watch?v=${id}`);
const pr = (id: string, title: string, summary: string, notes: string, resources: Resource[], interview: InterviewQ[]) =>
  T(id, "analyst", "Probability", title, summary, notes, { resources, interview });
const st = (id: string, title: string, summary: string, notes: string, resources: Resource[], interview: InterviewQ[]) =>
  T(id, "analyst", "Statistics", title, summary, notes, { resources, interview });

// ───────────────────────── Probability ─────────────────────────
pr(B.normal, "The normal distribution", "Standardising, reading Φ, percentiles, and sums of normals.", `
**N(μ, σ²).** Symmetric bell curve; mean = median = mode = μ. Standardise with z = (x − μ)/σ, then use Φ(z) = P(Z ≤ z).

**Rules of thumb.** About 68% within 1σ, 95% within 2σ (1.96σ exactly), 99.7% within 3σ.

**Key z values.** 90th percentile 1.2816 · 95th 1.6449 · 97.5th 1.96 · 99th 2.3263 · 99.5th 2.5758.

**Sums.** Independent normals add: X + Y ~ N(μ₁ + μ₂, σ₁² + σ₂²). Variances add, not standard deviations. aX + b ~ N(aμ + b, a²σ²).

**Why it appears everywhere.** The central limit theorem: sums and averages of many independent pieces are approximately normal.

**Worked example 1.** IQ ~ N(100, 15²): P(X < 130) = Φ(2) ≈ 0.9772.

**Worked example 2.** P(85 < X < 115) = Φ(1) − Φ(−1) ≈ 0.6827.

**Worked example 3.** 95th percentile: 100 + 1.6449 × 15 ≈ 124.67.

**Worked example 4.** X ~ N(30, 3²), Y ~ N(20, 4²) independent: X + Y ~ N(50, 25), SD 5, so P(X + Y > 60) = 1 − Φ(2) ≈ 0.0228.
`, [yt("rzFX5NWojp0", "The normal distribution, clearly explained")], [
  iq("Why do variances add for independent variables but standard deviations don't?", "Var(X + Y) = Var(X) + Var(Y) + 2Cov(X, Y), and the covariance is 0 for independent variables. Standard deviations are square roots, so they combine like the sides of a right triangle: √(σ₁² + σ₂²), not σ₁ + σ₂.", ["Var formula with covariance", "Cov = 0 when independent", "SD combines as √(sum of squares)"]),
  iq("What does the 68-95-99.7 rule say, and when can you use it?", "For a normal distribution, about 68%, 95% and 99.7% of values fall within 1, 2 and 3 standard deviations of the mean. It is only reliable for roughly normal data; skewed or heavy-tailed data can have many more extreme values.", ["States the percentages", "Only for normal data", "Heavy tails caveat"]),
  iq("How would you check whether data are approximately normal?", "Plot a histogram and a Q–Q plot (points near the line → normal); check skewness and kurtosis; a Shapiro–Wilk test exists but rejects trivial departures in large samples, so rely on plots.", ["Q–Q plot", "Histogram", "Formal test and its caveat"]),
]);
Card_("pr-normal-c1", "Sum of independent normals", "Means add, variances add.", B.normal);
Card_("pr-normal-c2", "z for 95th / 97.5th percentile", "1.6449 / 1.96.", B.normal);

pr(B.joint, "Joint, marginal and conditional distributions", "Two variables at once: tables of joint probabilities and what you can read from them.", `
**Joint PMF** p(x, y) = P(X = x, Y = y): a table whose cells sum to 1.

**Marginal.** P(X = x) = Σ_y p(x, y): add across the row. P(Y = y): add down the column.

**Conditional.** P(Y = y | X = x) = p(x, y)/P(X = x): divide the cell by its row total.

**Independence.** X and Y are independent iff every cell equals the product of its marginals.

**Conditional expectation.** E[Y | X = x] = Σ y P(Y = y | X = x). Law of total expectation: E[Y] = Σ E[Y | X = x] P(X = x).

**Covariance from a table.** Cov(X, Y) = E[XY] − E[X]E[Y].

**Worked example.** Joint table with rows X = 0, 1 and columns Y = 0, 1: [[0.2, 0.3], [0.1, 0.4]].

- P(Y = 1) = 0.3 + 0.4 = 0.7.
- P(Y = 1 | X = 0) = 0.3/0.5 = 0.6.
- E[Y | X = 1] = 0.4/0.5 = 0.8.
- E[X] = 0.5, E[Y] = 0.7, E[XY] = 0.4, so Cov = 0.4 − 0.35 = 0.05 (positive: Y = 1 is more likely when X = 1).
`, [yt("SrEmzdOT65s", "Joint, marginal and conditional probability", "zedstatistics")], [
  iq("How do you check independence from a joint table?", "Compute the marginals and check every cell: p(x, y) must equal P(X = x)P(Y = y) for all x and y. One failing cell is enough to show dependence.", ["Every cell = product of marginals", "One counterexample suffices"]),
  iq("What is the law of total expectation, and where is it useful?", "E[Y] = E[E[Y | X]]: average the conditional means, weighted by how likely each X is. Useful for computing overall averages from segment averages (revenue per user by country) and in many probability puzzles.", ["Formula", "Weighted average of conditional means", "Use case"]),
  iq("Can two variables have zero covariance but be dependent?", "Yes. If X is −1, 0 or 1 with equal probability and Y = X², then Cov(X, Y) = E[X³] − E[X]E[X²] = 0, but Y is determined by X.", ["Yes", "Concrete example"]),
]);
Card_("pr-joint-c1", "Conditional from a joint table", "Cell ÷ row (or column) total.", B.joint);

pr(B.clt, "Law of large numbers and the central limit theorem", "Averages settle down, and their distribution becomes normal.", `
**Law of large numbers.** The sample mean X̄ converges to the true mean μ as n grows. It says nothing about the shape of X̄'s distribution, only where it ends up.

**Central limit theorem.** For independent draws with mean μ and finite SD σ, X̄ is approximately N(μ, σ²/n) for large n, whatever the population's shape. Equivalently, the sum is ≈ N(nμ, nσ²).

**Standard error.** SE(X̄) = σ/√n: quadrupling n halves the SE.

**How large is 'large'?** n ≈ 30 is a common rule; skewed populations need more, symmetric ones fewer.

**Gambler's fallacy.** The LLN works by swamping, not by compensating: after 10 heads a fair coin is still 50–50.

**Worked example 1.** σ = 12, n = 36 → SE = 2.

**Worked example 2.** μ = 100, σ = 20, n = 100: P(X̄ > 104) = 1 − Φ(2) ≈ 0.0228.

**Worked example 3.** Sum of 100 dice ≈ N(350, 3500/12): SD ≈ 17.08, so P(sum > 375) ≈ 1 − Φ(1.464) ≈ 0.0716.

**Worked example 4.** σ = 10; for SE ≤ 1 you need n ≥ 100.
`, [yt("YAlJCEDH2uY", "The central limit theorem, clearly explained")], [
  iq("What does the central limit theorem say, and why does it matter in data science?", "The mean (or sum) of many independent, identically distributed values with finite variance is approximately normal with SD σ/√n, regardless of the original distribution. It justifies z- and t-based confidence intervals and A/B test statistics on non-normal metrics like revenue per user.", ["Statement with σ/√n", "Regardless of shape", "Justifies CIs/tests", "Finite variance condition"]),
  iq("What's the difference between the law of large numbers and the CLT?", "LLN: the sample mean converges to the true mean. CLT: describes the distribution of the sample mean around the true mean (approximately normal, shrinking like 1/√n). LLN is about where; CLT about how spread out and what shape.", ["Convergence vs distribution", "1/√n"]),
  iq("When can the CLT fail you in practice?", "Heavy-tailed data (very large outliers, infinite-variance distributions), strong dependence between observations (time series, clustered users), or small samples from skewed data. Revenue metrics with whales are a common case: use larger samples, trimming, or the bootstrap.", ["Heavy tails", "Dependence", "Small skewed samples", "Remedy"]),
]);
Card_("pr-clt-c1", "CLT for the mean", "X̄ ≈ N(μ, σ²/n); SE = σ/√n.", B.clt);

pr(B.classic, "Classic interview probability problems", "Coupon collector, gambler's ruin, waiting for streaks, birthday-style matches.", `
**Coupon collector.** Expected draws to collect all n equally likely types = n(1 + 1/2 + … + 1/n) ≈ n ln n. With k types collected, the next new one takes n/(n − k) draws on average.

**Gambler's ruin.** Start with i, bet 1 unit each round, win with probability p, stop at 0 or N. Fair game: P(reach N) = i/N. Otherwise with r = q/p: P = (1 − rⁱ)/(1 − r^N).

**Waiting for streaks.** Expected fair-coin tosses for k heads in a row = 2^(k+1) − 2 (HH: 6, HHH: 14). Solve with states: E_j = expected tosses still needed with a current streak of j.

**Matching problems.** P(at least two of n pick the same of d options) = 1 − d(d − 1)…(d − n + 1)/dⁿ. With d = 365, n = 23 gives just over 50%.

**Method for any 'expected time' problem.** Define states, write E[state] = 1 + Σ P(next) E[next], solve the linear equations.

**Worked example 1.** 4 toy types: 4(1 + ½ + ⅓ + ¼) ≈ 8.33 boxes.

**Worked example 2.** Fair game, start ₹3, target ₹10: P = 0.3.

**Worked example 3.** HH: E₀ = 1 + ½E₁ + ½E₀ and E₁ = 1 + ½·0 + ½E₀ → E₀ = 6.

**Worked example 4.** Expected rolls of a die until a six: 6 (geometric with p = 1/6).
`, [yt("KLs_7b7SKi4", "Expected values, main ideas"), yt("LZ5Wergp_PA", "Stat 110 lecture 3: birthday problem", "Harvard")], [
  iq("Expected number of tosses to get HT versus HH with a fair coin — why are they different?", "HT takes 4, HH takes 6. After a failed HH attempt (HT) you have to restart from scratch, but after a failed HT attempt (HH) the second H still counts towards HT. Overlap with the pattern's own prefix makes HH slower.", ["HT = 4", "HH = 6", "Explains overlap/restart"]),
  iq("In a fair gambler's ruin starting at i with target N, what's the probability of winning, and why?", "i/N. Your fortune is a martingale (fair game), so its expected value stays i; at the end it is N with probability P or 0 otherwise, so P × N = i.", ["i/N", "Martingale / fair-game argument"]),
  iq("Roughly how many draws to collect all 50 types of a coupon?", "About 50 × H₅₀ ≈ 50 × 4.5 = 225. Most of the time is spent on the last few types: the final one alone takes 50 draws on average.", ["n × H_n ≈ 225", "Last types dominate"]),
]);
Card_("pr-classic-c1", "Coupon collector", "n(1 + 1/2 + … + 1/n).", B.classic);
Card_("pr-classic-c2", "k heads in a row", "2^(k+1) − 2 tosses on average.", B.classic);

// ───────────────────────── Statistics ─────────────────────────
st(B.sampling, "Sampling and bias", "How samples are drawn, and the ways they mislead.", `
**Population vs sample.** We estimate a population quantity (parameter) from a sample (statistic).

**Probability sampling.**

- **Simple random:** every subset of size n equally likely; each unit included with probability n/N.
- **Stratified:** split into strata (e.g. by city), sample within each; proportional allocation n_h = n N_h/N. Estimate = Σ (N_h/N) ȳ_h. Reduces variance when strata differ.
- **Cluster:** sample whole groups (schools, stores). Cheaper, but usually higher variance.
- **Systematic:** every k-th unit after a random start, k = N/n. Dangerous if the list has a period.

**Biases.**

- **Selection / coverage:** some units can't be sampled (online-only survey).
- **Non-response:** people who answer differ from those who don't.
- **Voluntary response:** self-selected, extreme opinions over-represented.
- **Survivorship:** looking only at what survived (successful start-ups, returning bombers).
- **Measurement / response:** leading questions, social desirability.

More data does not fix bias: a biased sample of a million is still biased.

**Worked example 1.** Strata of 300, 500 and 200 with n = 100 → 30, 50, 20.

**Worked example 2.** N = 1,000, n = 50 → k = 20; start at 7 → 7, 27, 47, …

**Worked example 3.** Urban 600 households with mean 40, rural 400 with mean 25 → stratified estimate 34.

**Worked example 4.** WWII bombers: armour the places where returning planes had no holes, because planes hit there didn't return.
`, [yt("Rf-fIpB4D50", "Sampling methods and bias with surveys", "CrashCourse")], [
  iq("Your app survey shows 90% satisfaction. Why might that be misleading?", "Only active users who chose to answer responded: voluntary-response and survivorship bias (unhappy users churned and never saw it). Non-response is likely related to satisfaction. Compare respondents with the user base, weight responses, or sample including churned users.", ["Voluntary response", "Survivorship / churned users", "Non-response related to outcome", "Mitigation"]),
  iq("When would you use stratified sampling instead of simple random sampling?", "When the population has known subgroups that differ on the outcome (regions, plan types). Sampling within each guarantees representation and lowers variance; it also allows reliable estimates per stratum, including small ones you can oversample and reweight.", ["Heterogeneous subgroups", "Lower variance", "Per-stratum estimates / oversampling"]),
  iq("Does a bigger sample fix bias?", "No. A larger sample reduces random error (standard error) but not systematic error. A biased sampling process just gives a more precise wrong answer.", ["No", "Variance vs bias"]),
]);
Card_("st-sampling-c1", "Proportional allocation", "n_h = n × N_h / N.", B.sampling);
Card_("st-sampling-c2", "Survivorship bias", "Only the survivors are observed; the failures that would change the conclusion are missing.", B.sampling);

st(B.se, "Sampling distributions and standard error", "How much a statistic would vary from sample to sample.", `
**Sampling distribution.** The distribution of a statistic (mean, proportion) over repeated samples. Its standard deviation is the **standard error**.

**SD vs SE.** SD describes spread of individual data points; SE describes uncertainty in an estimate. SE shrinks with more data; SD doesn't.

**Formulas.**

- Mean: SE = σ/√n (or s/√n with the sample SD).
- Proportion: SE = √(p̂(1 − p̂)/n).
- Difference of independent means: √(s₁²/n₁ + s₂²/n₂). Difference of proportions: √(p₁(1 − p₁)/n₁ + p₂(1 − p₂)/n₂).

**Scaling.** SE ∝ 1/√n: to halve the SE you need four times the data.

**Worked example 1.** s = 8, n = 16 → SE = 2.

**Worked example 2.** p̂ = 0.3, n = 400 → SE = √(0.21/400) ≈ 0.0229.

**Worked example 3.** s₁ = 10 (n₁ = 50), s₂ = 12 (n₂ = 40): √(2 + 3.6) ≈ 2.366.

**Worked example 4.** SE 4 with n = 100 → with n = 400, SE = 2.
`, [yt("A82brFpdr9g", "Standard deviation vs standard error"), yt("XNgt7F6FqDU", "The standard error, clearly explained")], [
  iq("What's the difference between standard deviation and standard error?", "SD measures how spread out individual observations are; SE measures how precisely a statistic (like the mean) is estimated: SD/√n. More data shrinks the SE but not the SD.", ["Data spread vs estimate precision", "SE = SD/√n", "Effect of n"]),
  iq("Why do you need four times the sample to halve the standard error?", "SE = σ/√n, so it scales with 1/√n; halving it requires √n to double, i.e. n to quadruple. This is why precision gets expensive.", ["1/√n", "Quadruple n"]),
  iq("How do you get the SE of a statistic with no formula, like a median?", "Bootstrap: resample the data with replacement many times, compute the statistic each time, and take the SD of those values.", ["Bootstrap", "Resample with replacement", "SD of resampled statistics"]),
]);
Card_("st-se-c1", "SE of a proportion", "√(p̂(1 − p̂)/n).", B.se);

st(B.est, "Estimation: bias, MSE and maximum likelihood", "What makes an estimator good, and the most common way to build one.", `
**Estimator** θ̂: a rule that turns data into a guess of θ.

- **Bias** = E[θ̂] − θ. **Variance** = how much θ̂ moves between samples.
- **MSE** = E[(θ̂ − θ)²] = bias² + variance. A slightly biased estimator with much lower variance can have lower MSE (the idea behind regularisation).
- **Consistent:** θ̂ → θ as n → ∞.

**Bessel's correction.** Dividing squared deviations by n underestimates σ² on average: E = (n − 1)/n × σ². Dividing by n − 1 gives an unbiased estimate.

**Maximum likelihood.** Choose θ that makes the observed data most probable: maximise L(θ) = Π f(xᵢ | θ), usually via log L.

- Bernoulli p: p̂ = successes/n.
- Poisson λ: λ̂ = x̄.
- Exponential rate: λ̂ = 1/x̄.
- Normal: μ̂ = x̄, σ̂² = (1/n) Σ(xᵢ − x̄)² (biased, but MLE).

MLEs are consistent and, for large n, approximately normal and efficient.

**Worked example 1.** 7 successes in 20 trials → p̂ = 0.35.

**Worked example 2.** Counts 2, 4, 3, 5, 1 → λ̂ = 3.

**Worked example 3.** Waits 2, 4, 6 minutes → λ̂ = 1/4 per minute.

**Worked example 4.** Samples of 2 from a fair die: the ÷n variance averages ½ × 35/12 ≈ 1.4583, half the true 2.9167.
`, [yt("XepXtl9YKwc", "Maximum likelihood, clearly explained"), yt("p3T-_LMrvBc", "Maximum likelihood for the exponential distribution")], [
  iq("Explain the bias–variance trade-off using MSE.", "MSE = bias² + variance. Reducing variance (shrinking estimates towards a constant, regularising) can introduce some bias but lower the total error. Unbiased isn't automatically best.", ["MSE decomposition", "Trade-off", "Regularisation link"]),
  iq("Why do we divide by n − 1 in the sample variance?", "Deviations are measured from x̄, which is fitted to the same data and is closer to the points than μ is, so Σ(xᵢ − x̄)² is too small on average. Dividing by n − 1 corrects that exactly: one degree of freedom is used to estimate the mean.", ["Deviation from x̄ is smaller", "Degrees of freedom", "Makes it unbiased"]),
  iq("What is maximum likelihood, in plain words?", "Pick the parameter value under which the data you actually saw would have been most likely. In practice, write the log-likelihood, differentiate, and set to zero (or optimise numerically). It underlies logistic regression and most ML training losses.", ["Most probable data", "Log-likelihood and optimisation", "Connection to ML losses"]),
]);
Card_("st-est-c1", "MSE", "bias² + variance.", B.est);
Card_("st-est-c2", "MLE of Poisson λ / exponential rate", "x̄ / 1/x̄.", B.est);

st(B.ci, "Confidence intervals", "Estimate ± margin, and what the confidence level actually means.", `
**General form.** estimate ± critical value × SE.

- Mean, σ known: x̄ ± z σ/√n.
- Mean, σ unknown: x̄ ± t(n − 1) s/√n.
- Proportion (Wald): p̂ ± z √(p̂(1 − p̂)/n); prefer Wilson for small n or p near 0 or 1.

**Critical values.** z: 90% 1.645 · 95% 1.96 · 99% 2.576. t is wider for small samples and approaches z as n grows.

**Interpretation.** A 95% CI comes from a procedure that captures the true parameter in 95% of repeated samples. It is **not** "a 95% probability that μ is in this particular interval" (μ is fixed).

**Sample size for a margin E.** n = (zσ/E)², rounded up.

**Bootstrap CI.** Resample with replacement many times, compute the statistic each time, take the 2.5th and 97.5th percentiles. Works for medians, ratios and other statistics without a formula.

**Worked example 1.** x̄ = 50, σ = 10, n = 25, 95%: 50 ± 1.96 × 2 = (46.08, 53.92).

**Worked example 2.** n = 10, x̄ = 20, s = 4: 20 ± 2.262 × 1.265 = (17.14, 22.86).

**Worked example 3.** p̂ = 0.4, n = 600: SE = 0.02, margin 0.0392.

**Worked example 4.** σ = 15, E = 3, 95%: (1.96 × 5)² = 96.04 → n = 97.
`, [yt("TqOeMYtOc1w", "Confidence intervals, clearly explained")], [
  iq("What does a 95% confidence interval mean?", "If we repeated the sampling many times and built an interval each time, about 95% of those intervals would contain the true value. For one computed interval, the parameter is either in it or not; the 95% describes the method's reliability.", ["Repeated-sampling meaning", "Not a probability about a fixed parameter"]),
  iq("When do you use t instead of z for a mean?", "When the population SD is unknown and estimated by s, especially with small samples: t accounts for the extra uncertainty in s with heavier tails. With large n, t ≈ z.", ["σ unknown", "Heavier tails for small n", "Converges to z"]),
  iq("How would you build a confidence interval for a median?", "Bootstrap: resample the data with replacement (e.g. 10,000 times), compute the median each time, and take the 2.5th and 97.5th percentiles of those medians.", ["Bootstrap", "Percentiles of resampled medians"]),
]);
Card_("st-ci-c1", "Sample size for margin E", "n = (zσ/E)², round up.", B.ci);
Card_("st-ci-c2", "95% CI meaning", "95% of intervals from repeated samples contain the true value.", B.ci);

st(B.testing, "Hypothesis testing: p-values, errors and power", "The logic of tests, and the two ways to be wrong.", `
**Setup.** H₀ (no effect) vs H₁ (the effect you're looking for). Choose α (often 0.05) before looking at data.

**p-value.** The probability, assuming H₀ is true, of a result at least as extreme as the one observed. Small p → the data would be surprising under H₀. It is **not** the probability that H₀ is true.

**Decision.** Reject H₀ if p < α; otherwise fail to reject (absence of evidence, not evidence of absence).

**Errors.**

- Type I (false positive): reject a true H₀. Probability α.
- Type II (false negative): miss a real effect. Probability β.
- Power = 1 − β: the chance of detecting a real effect. It rises with n, effect size and α, and falls with noise σ.

**One vs two-sided.** Decide before seeing the data; a one-sided test puts all of α in one tail.

**Statistical vs practical significance.** With huge n, tiny useless effects become 'significant'; always report the effect size and a CI.

**Worked example 1.** p = 0.03, α = 0.05 → reject H₀.

**Worked example 2.** Two-sided z = 2.1 → p = 2(1 − Φ(2.1)) ≈ 0.0357.

**Worked example 3.** σ = 10, n = 25 (SE 2), one-sided α = 0.05: reject when x̄ > 103.29. If the true mean is 104, power = P(x̄ > 103.29) ≈ 0.6387.

**Worked example 4.** The same test's Type II error is 1 − 0.6387 ≈ 0.3613.
`, [yt("vemZtEM63GY", "p-values: what they are and how to interpret them"), yt("JQc3yx0-Q9E", "How to calculate p-values")], [
  iq("Define a p-value precisely. What is it not?", "Assuming the null hypothesis is true, the probability of data at least as extreme as what was observed. It is not the probability that the null is true, not the probability the result is due to chance, and not a measure of effect size.", ["Conditional on H₀", "At least as extreme", "Three common misreadings"]),
  iq("What are Type I and Type II errors in an A/B test, and how do you control them?", "Type I: shipping a change that has no real effect (false positive), controlled by α. Type II: missing a real improvement (false negative), controlled by power through sample size, chosen in advance from the minimum detectable effect.", ["Definitions in context", "α controls Type I", "Sample size / power controls Type II"]),
  iq("A result has p = 0.0001 with 5 million users. Should you ship?", "Not on the p-value alone. Large samples make tiny effects significant; check the effect size and its confidence interval against the cost and the minimum effect worth acting on, plus guardrail metrics.", ["Significance ≠ importance", "Effect size and CI", "Business threshold / guardrails"]),
]);
Card_("st-test-c1", "Type I vs Type II", "False positive (α) vs false negative (β). Power = 1 − β.", B.testing);

st(B.ztest, "z-tests for means and proportions", "When σ is known or n is large: one-sample means, one proportion, two proportions.", `
**One-sample mean (σ known).** z = (x̄ − μ₀)/(σ/√n).

**One proportion.** z = (p̂ − p₀)/√(p₀(1 − p₀)/n). Use p₀ (the null value) in the SE.

**Two proportions (A/B test).** Pool under H₀: p = (x₁ + x₂)/(n₁ + n₂); z = (p̂₁ − p̂₂)/√(p(1 − p)(1/n₁ + 1/n₂)).

**Decisions.** Two-sided α = 0.05: reject if |z| > 1.96. One-sided: z > 1.645 (or < −1.645).

**Conditions.** Independent observations; for proportions, roughly n p₀ ≥ 10 and n(1 − p₀) ≥ 10.

**Worked example 1.** x̄ = 52, μ₀ = 50, σ = 8, n = 64: z = 2/1 = 2.0 → reject at 5% (two-sided).

**Worked example 2.** p₀ = 0.5, 280 of 500: SE = √(0.25/500) ≈ 0.0224, z ≈ 2.68.

**Worked example 3.** A: 120/1000, B: 100/1000; pooled 0.11; SE ≈ 0.0140; z ≈ 1.43 → not significant.

**Worked example 4.** z = −2.3 in a two-sided test → |z| > 1.96 → reject.
`, [yt("vemZtEM63GY", "p-values: what they are and how to interpret them")], [
  iq("Why do you pool the proportions in a two-proportion z-test?", "Under H₀ both groups share one true rate, so the best estimate of it (and of the SE under H₀) uses all the data combined. The unpooled SE is used for confidence intervals, not the test.", ["Common rate under H₀", "Pooled for the test, unpooled for CI"]),
  iq("When can you use a z-test instead of a t-test for means?", "When σ is genuinely known (rare) or n is large enough that s is a precise estimate of σ, so t ≈ z. In practice, t is the safe default for means.", ["Known σ or large n", "t as default"]),
  iq("In an A/B test, A converts at 12% and B at 10% with 1,000 users each. Is A better?", "z ≈ 1.43, p ≈ 0.15: not significant at 5%. The test is underpowered for a 2-point lift; plan the sample size from the minimum detectable effect before running.", ["Computes or estimates z", "Not significant", "Power / sample size"]),
]);
Card_("st-z-c1", "Two-proportion z", "Pooled p under H₀; z = (p̂₁ − p̂₂)/√(p(1 − p)(1/n₁ + 1/n₂)).", B.ztest);

st(B.tone, "One-sample t-test", "Testing a mean when σ is unknown.", `
**Statistic.** t = (x̄ − μ₀)/(s/√n) with n − 1 degrees of freedom.

**Assumptions.** Independent observations; roughly normal data, or n large enough for the CLT. Check for outliers and strong skew with small samples.

**Decision.** Two-sided: reject if |t| > t(0.975, n − 1). One-sided H₁: μ > μ₀: reject if t > t(0.95, n − 1) — a large negative t never supports a right-tailed alternative.

**Common critical values (0.975).** df 4: 2.776 · 5: 2.571 · 9: 2.262 · 15: 2.131 · 30: 2.042 · ∞: 1.96.

**Paired data** is a one-sample t-test on the differences (see the paired-vs-two-sample topic).

**Worked example.** Data 12, 15, 11, 14, 13; H₀: μ = 11. x̄ = 13, s = √(10/4) ≈ 1.581, SE ≈ 0.707, t ≈ 2.83 with 4 df. 2.83 > 2.776 → reject at 5% (p ≈ 0.047).

**Worked example 2.** Same data, H₁: μ > 11 at 5% one-sided (critical 2.132) → reject.

**Worked example 3.** t = 3.4 with 9 df is above the α = 0.01 critical value 3.25 (and the 0.05 value 2.262), so p < 0.01.

**Worked example 4.** t = −2.5 with H₁: μ > μ₀: fail to reject, whatever the size.
`, [yt("VPd8DOL13Iw", "One sample t-test", "Statistics Lectures")], [
  iq("What are the assumptions of the one-sample t-test, and what do you do if they fail?", "Independent observations and approximately normal data (or large n). With small, skewed or outlier-heavy samples, use the Wilcoxon signed-rank test or a bootstrap CI for the mean or median.", ["Independence", "Normality / large n", "Alternatives"]),
  iq("Why does the t distribution have heavier tails than the normal?", "It accounts for estimating σ with s: in small samples s itself varies, sometimes underestimating σ, which makes extreme t values more likely. With more data, s is precise and t → z.", ["Uncertainty in s", "Small n", "Converges to normal"]),
  iq("You run a right-tailed test and get t = −3. What do you conclude?", "Fail to reject H₀. A right-tailed alternative is only supported by large positive t; a negative t is evidence in the opposite direction, which this test was not designed to detect.", ["Fail to reject", "Direction fixed in advance"]),
]);
Card_("st-t1-c1", "One-sample t", "t = (x̄ − μ₀)/(s/√n), df = n − 1.", B.tone);

st(B.chi, "Chi-square tests", "Goodness of fit and independence for counts.", `
**Goodness of fit.** Do observed counts match expected proportions? χ² = Σ (O − E)²/E, df = categories − 1 (minus any parameters estimated from the data).

**Independence (contingency table).** Are two categorical variables related? Expected cell = row total × column total / grand total; df = (rows − 1)(columns − 1).

**Decision.** Reject H₀ when χ² exceeds the critical value (always a right-tailed test). Critical values at 5%: df 1: 3.841 · 2: 5.991 · 3: 7.815 · 4: 9.488 · 5: 11.07.

**Conditions.** Counts, not percentages; independent observations; expected counts mostly ≥ 5 (otherwise combine categories or use Fisher's exact test for 2 × 2).

**Effect size.** Cramér's V = √(χ²/(n(k − 1))), where k is the smaller of rows and columns.

**Worked example 1.** A die rolled 60 times: 8, 9, 12, 11, 6, 14 (E = 10): χ² = (4 + 1 + 4 + 1 + 16 + 16)/10 = 4.2 < 11.07 → consistent with a fair die.

**Worked example 2.** [[30, 20], [20, 30]]: every expected count is 25, χ² = 4 × 25/25 = 4.0 > 3.841 → reject independence.

**Worked example 3.** Expected count for row total 80, column total 50, grand total 200: 80 × 50/200 = 20.

**Worked example 4.** A 3 × 4 table has (3 − 1)(4 − 1) = 6 df.
`, [yt("HKDqlYSLt68", "Chi square test", "The Organic Chemistry Tutor"), yt("7_cs1YlZoug", "Chi-square tests", "CrashCourse")], [
  iq("When do you use a chi-square test of independence, and what does it tell you?", "For two categorical variables (device × purchase): whether their distributions are associated. It doesn't say how strong or in which direction; report Cramér's V and the conditional percentages.", ["Two categorical variables", "Association, not strength", "Effect size"]),
  iq("Why must you use counts, not percentages, in a chi-square test?", "The statistic depends on sample size: (O − E)²/E scales with n. Percentages discard n and give meaningless χ² values.", ["Depends on n", "Percentages lose it"]),
  iq("What if some expected counts are below 5?", "The chi-square approximation becomes unreliable. Combine sparse categories, or for a 2 × 2 table use Fisher's exact test.", ["Approximation breaks", "Combine categories", "Fisher's exact"]),
]);
Card_("st-chi-c1", "Expected count in a contingency table", "row total × column total / grand total.", B.chi);
Card_("st-chi-c2", "df for an r × c table", "(r − 1)(c − 1).", B.chi);

for (const g of B7_ITEMS) {
  Item({
    id: g.id, topic: g.topic, d: g.d, secs: g.secs, prompt: g.prompt,
    ...(g.options ? { options: g.options } : {}),
    answer: g.answer,
    ...(g.tol !== undefined && !g.options ? { tol: g.tol } : {}),
    explain: g.explain, fast: g.fast, trap: g.trap,
    src: "Practice: generated; answer recomputed in Python (scipy/statsmodels, enumeration or iteration) (Nov 2026)",
    check: { py: g.py, ...(g.packages ? { packages: g.packages } : {}) },
  });
}
