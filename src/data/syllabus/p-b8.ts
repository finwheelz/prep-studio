/**
 * Batch 8: the rest of P3 statistics (ANOVA, non-parametric tests, power, A/B testing, multiple
 * testing, regression inference, which-test decision tree) and the first five P4 ML-theory concepts
 * (bias–variance, regularisation, losses, optimisers, backpropagation). Items come from
 * src/data/gen/b8.ts with scipy / statsmodels / scikit-learn / finite-difference checks.
 */
import { B8_ITEMS, B8_TOPICS as B } from "@/data/gen/b8";
import type { InterviewQ, Resource } from "@/lib/types";
import { Card_, Item, R, T } from "./build";

const iq = (q: string, answer: string, rubric: string[]): InterviewQ => ({ q, answer, rubric });
const yt = (id: string, title: string, who = "StatQuest") => R(`Video: ${title} (${who})`, `https://www.youtube.com/watch?v=${id}`);
const st = (id: string, title: string, summary: string, notes: string, resources: Resource[], interview: InterviewQ[]) =>
  T(id, "analyst", "Statistics", title, summary, notes, { resources, interview });
const ml = (id: string, title: string, summary: string, notes: string, resources: Resource[], interview: InterviewQ[]) =>
  T(id, "ml", "ML theory", title, summary, notes, { resources, interview });

// ───────────────────────── Statistics ─────────────────────────
st(B.anova, "One-way ANOVA", "Comparing three or more group means with one test.", `
**Question.** Do k independent groups share the same mean? H₀: μ₁ = μ₂ = … = μ_k. H₁: at least one differs.

**Why not many t-tests?** Three groups need three pairwise tests; at α = 0.05 each, the chance of at least one false positive is about 14%. ANOVA asks one question at one α.

**Decomposition.** Total variation = between groups + within groups.

- SSB = Σ nᵢ(ȳᵢ − ȳ)², df = k − 1.
- SSW = Σ Σ (y − ȳᵢ)², df = N − k.
- F = MSB/MSW = (SSB/(k − 1)) / (SSW/(N − k)). Large F → group means are spread out relative to the noise inside groups.

**Assumptions.** Independent observations, roughly normal residuals, similar group variances (Welch's ANOVA if not). Non-normal or ordinal data → Kruskal–Wallis.

**After a significant F.** It says some mean differs, not which. Use post-hoc tests with multiple-comparison control (Tukey's HSD).

**Worked example.** A: 4, 5, 6 · B: 6, 7, 8 · C: 8, 9, 10. Means 5, 7, 9; grand mean 7.

- SSB = 3(4 + 0 + 4) = 24, df 2, MSB = 12.
- SSW = 2 + 2 + 2 = 6, df 6, MSW = 1.
- F = 12 > F(0.95; 2, 6) = 5.14 → reject H₀.
`, [yt("QUQ6YppWCeg", "Introduction to one-way ANOVA", "jbstatistics"), yt("YllG5Cy6OFw", "ANOVA and F statistics made easy", "Stats with Brian")], [
  iq("Why use ANOVA instead of running t-tests on every pair of groups?", "Multiple t-tests inflate the false-positive rate: with 3 groups and 3 tests at 5%, the chance of at least one false alarm is about 14%. ANOVA tests the single global hypothesis at the chosen α; post-hoc tests with correction then locate the difference.", ["Inflated Type I error", "Single global test", "Post-hoc with correction"]),
  iq("What does the F statistic measure, intuitively?", "The ratio of variation between group means to variation within groups. If groups truly share a mean, both estimate the same noise variance and F ≈ 1; a large F means the means differ by more than noise explains.", ["Between vs within", "≈ 1 under H₀"]),
  iq("ANOVA is significant. What next?", "Find which groups differ with a post-hoc test that controls the family-wise error (Tukey's HSD, or Bonferroni/Holm on pairwise tests), report effect sizes (η²) and check assumptions with residual plots.", ["Post-hoc test", "Error control", "Effect size / diagnostics"]),
]);
Card_("st-anova-c1", "F statistic", "MSB / MSW = (SSB/(k − 1)) / (SSW/(N − k)).", B.anova);

st(B.nonpar, "Non-parametric tests", "Rank-based alternatives when data are skewed, small or ordinal.", `
**Idea.** Replace values by their ranks. Ranks ignore how extreme an outlier is, so the tests don't need normality.

**The pairs to remember.**

- One sample or paired differences: t-test ↔ **Wilcoxon signed-rank**.
- Two independent groups: two-sample t ↔ **Mann–Whitney U** (Wilcoxon rank-sum).
- Three or more groups: ANOVA ↔ **Kruskal–Wallis**.
- Correlation: Pearson ↔ **Spearman** (Pearson on ranks).

**Mann–Whitney U.** U_A = number of (a, b) pairs with a > b (ties count ½). Equivalently U_A = R_A − n_A(n_A + 1)/2, where R_A is A's rank sum in the combined ranking. U_A + U_B = n_A n_B. It tests whether one group tends to produce larger values.

**Wilcoxon signed-rank.** Rank the |differences|, then add the ranks of the positive ones: W⁺.

**Kruskal–Wallis.** H = 12/(N(N + 1)) Σ Rᵢ²/nᵢ − 3(N + 1), compared with χ²(k − 1).

**Trade-off.** Slightly less power than t when data really are normal; much more robust when they are not.

**Worked example 1.** A: 3, 5, 8 · B: 1, 4, 6. Pairs with A > B: 1 + 2 + 3 = 6 = U_A. Combined ranks of A: 2, 4, 6 → R_A = 12; 12 − 6 = 6 ✓.

**Worked example 2.** Differences 3, −1, 5, 2, −4. Ranks of |d|: 3, 1, 5, 2, 4. W⁺ = 3 + 5 + 2 = 10, W⁻ = 5.
`, [yt("LcxB56PzylA", "Mann–Whitney U test, simply explained", "numiqo"), yt("BT1FKd1Qzjw", "How to perform the Mann–Whitney U test by hand", "Eugene O'Loughlin")], [
  iq("When would you use Mann–Whitney instead of a t-test?", "Small samples with skew or outliers, or ordinal data (ratings). It compares the rank distributions — whether one group tends to be larger — and isn't thrown off by a few extreme values like revenue whales.", ["Skew / outliers / ordinal", "Rank-based", "What it tests"]),
  iq("Does Mann–Whitney test whether the medians are equal?", "Only under the extra assumption that both distributions have the same shape. In general it tests P(A > B) = ½ (stochastic equality); two groups with equal medians but different shapes can still differ.", ["Not in general", "Same-shape assumption", "P(A > B)"]),
  iq("What do you lose by using a non-parametric test?", "Some power when the parametric assumptions actually hold, and a less direct effect size (a rank-based measure instead of a difference in means). For large samples the CLT often makes the t-test fine anyway.", ["Power", "Effect size interpretation", "Large n → t OK"]),
]);
Card_("st-np-c1", "Non-parametric pairs", "t ↔ Wilcoxon signed-rank · two-sample t ↔ Mann–Whitney · ANOVA ↔ Kruskal–Wallis · Pearson ↔ Spearman.", B.nonpar);

st(B.power, "Power and sample size", "Planning how much data an experiment needs before running it.", `
**Power** = P(reject H₀ | the effect is real) = 1 − β. Convention: 80%.

**What raises power.** Larger n, larger true effect δ, smaller noise σ, larger α, one-sided tests (when justified).

**Two-sample means (per group).** n = 2(z_{α/2} + z_β)² σ²/δ². With α = 0.05 two-sided (1.96) and 80% power (0.8416): n ≈ 15.7 σ²/δ².

**Two proportions (per group).** n = (z_{α/2} + z_β)² (p₁q₁ + p₂q₂)/(p₁ − p₂)².

**Minimum detectable effect.** For a fixed n: MDE = (z_{α/2} + z_β) σ √(2/n). Halving the MDE needs 4× the users.

**Power of a given design.** SE = σ√(2/n); power ≈ Φ(δ/SE − 1.96) (plus a negligible opposite-tail term).

**Pitfall.** Post-hoc ("observed") power computed from the observed effect adds nothing beyond the p-value. Plan power before the test.

**Worked example 1.** Conversion 10% → 12%: (2.8016)² × (0.09 + 0.1056)/0.02² ≈ 3,839 per group.

**Worked example 2.** σ = 20, δ = 5, 80% power: 2 × 7.849 × 400/25 ≈ 252 per group.

**Worked example 3.** n = 100 per group, σ = 10: MDE = 2.8016 × 10 × √0.02 ≈ 3.96.
`, [yt("Rsc5znwR5FA", "Statistical power, clearly explained"), yt("VX_M3tIyiYk", "Power analysis, clearly explained")], [
  iq("How do you decide the sample size for an A/B test?", "Pick the baseline rate, the minimum effect worth detecting (business-driven), α and power; compute n per group from the formula or a calculator; convert to days using eligible traffic, rounded up to whole weeks.", ["Baseline, MDE, α, power", "Formula / calculator", "Convert to duration"]),
  iq("What happens if your test is underpowered?", "You'll often miss real effects (false negatives), and the effects you do find significant will be exaggerated (winner's curse), because only lucky overestimates cross the threshold.", ["Missed effects", "Exaggerated significant effects"]),
  iq("Why does halving the detectable effect quadruple the sample size?", "n ∝ 1/δ²: the SE shrinks with √n, so to resolve an effect half as big the SE must halve, which needs four times the data.", ["n ∝ 1/δ²", "SE ∝ 1/√n"]),
]);
Card_("st-power-c1", "n per group (means)", "2(z_{α/2} + z_β)² σ²/δ² ≈ 15.7 σ²/δ² at 5% / 80%.", B.power);

st(B.ab, "A/B testing in practice", "Design, sanity checks and reading results for online experiments.", `
**Design.**

- One primary metric decided in advance, plus guardrails (latency, revenue, unsubscribes).
- Randomise the unit you analyse (user, not page view); keep assignment sticky.
- Size the test from the MDE; run whole weeks to cover weekly cycles.

**Sanity checks before reading results.**

- **Sample ratio mismatch (SRM):** a chi-square test of the observed split against the planned one. A tiny p-value means assignment or logging is broken; the results can't be trusted.
- A/A tests and pre-period balance checks.

**Reading results.** Report the absolute difference, the relative lift ((p_B − p_A)/p_A) and a confidence interval (unpooled SE). Decide on the CI versus the practical threshold, not just on p < 0.05.

**Pitfalls.**

- **Peeking:** checking daily and stopping at the first p < 0.05 inflates false positives far above 5%. Fix the duration, or use sequential methods.
- **Novelty and primacy effects:** early behaviour isn't steady state.
- **Network effects / interference** (marketplaces, social): randomise by cluster or region.
- **Many metrics or segments:** correct for multiple testing, or treat findings as hypotheses.
- **Simpson's paradox** when traffic mix changes during the test.

**Worked example 1.** Planned 50/50; observed 25,400 vs 24,600: χ² = (400² + 400²)/25,000 = 12.8 > 3.841 → SRM, investigate.

**Worked example 2.** 5.0% → 5.5%: absolute +0.5 points, relative lift +10%.

**Worked example 3.** 20,000 users per group, 5,000 eligible per day: 8 days minimum → run 14 days (two full weeks).
`, [yt("DUNk4GPZ9bw", "A/B testing in data science interviews", "DataInterview"), R("Evan Miller: How not to run an A/B test (peeking)", "https://www.evanmiller.org/how-not-to-run-an-ab-test.html")], [
  iq("What is peeking, and why is it a problem?", "Repeatedly checking the p-value and stopping as soon as it dips below 0.05. Each look is another chance for noise to cross the line, so the real false-positive rate can be several times 5%. Fix the sample size in advance or use a sequential test designed for monitoring.", ["Definition", "Inflated false positives", "Fixed horizon / sequential"]),
  iq("Your treatment group has 3% more users than control in a 50/50 test. What do you do?", "Run an SRM chi-square test; with a large sample this is highly significant. Don't trust the metric results: look for causes like bot filtering, redirects that drop users, logging bugs or assignment changes mid-test.", ["SRM test", "Don't trust results", "Likely causes"]),
  iq("The test is significant for the primary metric but a guardrail (page latency) got worse. Ship?", "Weigh the trade-off explicitly: quantify both with CIs, check whether the guardrail breach exceeds its agreed tolerance, and consider fixing latency and re-testing. Guardrails exist to block launches that win locally but hurt the product.", ["Quantify both", "Pre-agreed thresholds", "Fix and re-test"]),
]);
Card_("st-ab-c1", "Sample ratio mismatch", "χ² of observed split vs planned; significant → assignment is broken, distrust results.", B.ab);
Card_("st-ab-c2", "Peeking", "Stopping at the first p < 0.05 inflates false positives; fix the horizon or use sequential tests.", B.ab);

st(B.multi, "Multiple testing", "Many hypotheses at once: family-wise error and the false discovery rate.", `
**The problem.** With m independent true nulls at α, P(at least one false positive) = 1 − (1 − α)^m. For 20 tests at 5%: 64%.

**Family-wise error rate (FWER)** — the chance of any false positive.

- **Bonferroni:** reject if p ≤ α/m. Simple, conservative.
- **Holm (step-down):** sort p-values; compare p₍ᵢ₎ with α/(m − i + 1); stop at the first failure. Always at least as powerful as Bonferroni, same guarantee.

**False discovery rate (FDR)** — the expected fraction of false positives among the rejections. Better when you screen many hypotheses (genes, features, segments).

- **Benjamini–Hochberg:** sort p-values; find the largest k with p₍ₖ₎ ≤ (k/m)α; reject the k smallest. Note: a p-value can fail its own threshold and still be rejected if a larger one passes.

**Worked example.** p = 0.001, 0.008, 0.012, 0.04, 0.2 (m = 5, α = 0.05).

- Bonferroni (≤ 0.01): 2 rejected.
- Holm: 0.001 ≤ 0.01 ✓, 0.008 ≤ 0.0125 ✓, 0.012 ≤ 0.0167 ✓, 0.04 ≤ 0.025 ✗ → 3 rejected.
- BH thresholds 0.01, 0.02, 0.03, 0.04, 0.05: the 4th (0.04 ≤ 0.04) is the largest passing → 4 rejected.
`, [yt("K8LQSvtjcEo", "False discovery rates, FDR, clearly explained"), yt("rZKa4tW2NKs", "FDR: Benjamini–Hochberg explained", "TileStats")], [
  iq("You test a new feature on 20 user segments and one shows p = 0.03. What do you conclude?", "Probably nothing yet: with 20 tests, about one false positive at 5% is expected. Correct for multiplicity (Holm or BH) and treat the segment result as a hypothesis to confirm in a new test.", ["Expected false positives", "Correction", "Confirm in a new test"]),
  iq("When would you control FDR instead of FWER?", "FWER when any false positive is costly (a few confirmatory tests, medical claims). FDR when screening many candidates where some false leads are acceptable, as long as their proportion is controlled (feature screens, genomics, many metrics).", ["FWER: any error costly", "FDR: screening many", "Proportion of false discoveries"]),
  iq("Why is Holm preferred to Bonferroni?", "It gives the same FWER guarantee with no extra assumptions but rejects at least as many hypotheses, because the thresholds loosen after each rejection.", ["Same guarantee", "Uniformly more powerful"]),
]);
Card_("st-multi-c1", "Benjamini–Hochberg", "Largest k with p₍ₖ₎ ≤ (k/m)α; reject the k smallest.", B.multi);

st(B.reg, "Regression inference", "Least squares, R², and whether a slope is real.", `
**Simple linear regression.** y = β₀ + β₁x + ε. Least squares:

- b₁ = Σ(x − x̄)(y − ȳ)/Σ(x − x̄)² = r × s_y/s_x.
- b₀ = ȳ − b₁x̄ (the line passes through (x̄, ȳ)).

**Fit.** R² = 1 − SSE/SST: the share of variance in y explained. In simple regression R² = r².

**Inference on the slope.** SE(b₁) = √(SSE/(n − 2) / Σ(x − x̄)²); t = b₁/SE(b₁) with n − 2 df. CI: b₁ ± t × SE.

**Assumptions (LINE).** Linear relationship, Independent errors, Normal errors (for small-sample inference), Equal variance. Check with residual plots.

**Interpretation traps.**

- Correlation is not causation; omitted variables can create or hide relationships.
- In multiple regression, each coefficient is the effect holding the others fixed; correlated predictors (multicollinearity) inflate SEs.
- A high R² doesn't mean the model is right; a low one doesn't mean the slope is useless.

**Worked example.** (1, 2), (2, 4), (3, 5), (4, 4), (5, 5): x̄ = 3, ȳ = 4, Sxy = 6, Sxx = 10.

- b₁ = 0.6, b₀ = 2.2.
- Residuals −0.8, 0.6, 1.0, −0.6, −0.2: SSE = 2.4; SST = 6; R² = 0.6.
- SE(b₁) = √(0.8/10) ≈ 0.283; t ≈ 2.12 with 3 df < 3.182 → not significant at 5%.
`, [yt("7ArmBVF2dCs", "Linear regression, clearly explained"), yt("bMccdk8EdGo", "R-squared, clearly explained")], [
  iq("How do you interpret a regression coefficient in a multiple regression?", "The expected change in y for a one-unit increase in that x, holding the other predictors fixed. It's an association, not a causal effect, unless the design (randomisation) supports that.", ["Per unit change", "Holding others fixed", "Not causal by default"]),
  iq("What are the assumptions of linear regression and how do you check them?", "Linearity, independent errors, constant variance, normal errors (for small-sample inference). Plot residuals vs fitted (patterns, funnels), a Q–Q plot of residuals, and think about the data collection for independence.", ["Lists assumptions", "Residual plots", "Q–Q plot"]),
  iq("What is multicollinearity and why does it matter?", "Strong correlation among predictors. Predictions can still be fine, but individual coefficients become unstable with large standard errors and can flip sign. Detect with VIF; fix by dropping or combining features, or regularising.", ["Definition", "Unstable coefficients / big SEs", "VIF and remedies"]),
]);
Card_("st-reg-c1", "Slope t-test", "t = b₁/SE(b₁), df = n − 2.", B.reg);

st(B.tree, "Which test? A decision tree", "Choosing the right test from the outcome type and the design.", `
**Ask three questions, in order.**

1. What type is the outcome? Numeric, yes/no, or a category with several levels.
2. What's the design? One sample vs a reference value, two independent groups, paired measurements, three or more groups, or association between two variables.
3. For numeric outcomes: roughly normal (or large n)? If not, use the rank-based test.

\`\`\`
Numeric outcome
  one sample vs value ...... one-sample t      | Wilcoxon signed-rank
  two independent groups ... Welch t           | Mann-Whitney U
  paired / before-after .... paired t          | Wilcoxon signed-rank
  3+ groups ................ one-way ANOVA     | Kruskal-Wallis
  two numeric variables .... Pearson r         | Spearman rho
                             (normal)            (skewed / ordinal / outliers)
Yes/no outcome
  one rate vs value ........ one-proportion z
  two groups ............... two-proportion z  (or chi-square 2x2)
  3+ groups ................ chi-square test of independence
Categorical outcome
  vs expected mix .......... chi-square goodness of fit
  vs another category ...... chi-square test of independence (Fisher if counts small)
\`\`\`

**Common mistakes.**

- Using an independent test on paired data (throws away the pairing and power).
- t-tests on yes/no outcomes coded 0/1 with small n (use proportion tests).
- Pearson correlation on curved or outlier-heavy relationships (use Spearman).
- Chi-square on percentages instead of counts.

**Practice.** Every question here describes a scenario; name the test before looking at the options.
`, [yt("rulIUAN0U3w", "Choosing which statistical test to use", "Dr Nic's Maths and Stats"), yt("dYJLUvo0Q6g", "How to choose an appropriate statistical test", "TileStats")], [
  iq("You measured the same users' session time before and after a redesign. Which test, and why not a two-sample t-test?", "A paired t-test on the differences (Wilcoxon signed-rank if the differences are skewed). The two-sample test treats the groups as independent, ignoring that each user is their own control, which wastes power.", ["Paired test", "Wilcoxon alternative", "Why pairing matters"]),
  iq("How do you test whether conversion differs across five marketing channels?", "Chi-square test of independence on the 5 × 2 table of converted / not converted counts; if significant, follow up with pairwise proportion tests with a multiple-testing correction.", ["Chi-square independence", "Counts table", "Post-hoc with correction"]),
  iq("Revenue per user is very skewed. How would you compare two groups?", "With large samples a Welch t-test on means is often fine thanks to the CLT, but check robustness: Mann–Whitney for 'which group tends to spend more', a bootstrap CI for the difference in means, or a log transform if the business cares about multiplicative effects.", ["CLT with large n", "Mann–Whitney / bootstrap", "Match the test to the question"]),
]);
Card_("st-tree-c1", "Three questions to pick a test", "Outcome type → design (one / two / paired / many / association) → normal or not.", B.tree);

// ───────────────────────── ML theory ─────────────────────────
ml(B.bv, "Bias–variance and learning curves", "Why models underfit or overfit, and how to tell which from the errors.", `
**Decomposition.** For squared error, expected test error = bias² + variance + irreducible noise.

- **Bias:** error from wrong assumptions (a line fitted to a curve). Underfitting.
- **Variance:** sensitivity to the particular training sample (a deep tree). Overfitting.

**The same idea for estimators.** MSE(θ̂) = bias² + variance. Shrinking an estimate (θ̂ = c x̄ with c < 1) adds bias but cuts variance by c²; the MSE can go down. Regularisation is this trade-off applied to model weights.

**Diagnosing from errors (compare with the achievable error).**

- High training error, validation close to it → **high bias**: bigger model, more features, less regularisation, train longer.
- Low training error, much higher validation error → **high variance**: more data, regularisation, simpler model, augmentation, early stopping.

**Learning curves** (error vs training-set size). High bias: both curves plateau high and close together — more data won't help. High variance: a big gap that narrows as data grows — more data helps.

**Model complexity curve.** Training error falls steadily with complexity; validation error is U-shaped. Pick the bottom of the U (by cross-validation).

**Worked example.** Estimating a die's mean (σ² = 35/12) from n = 2 rolls: x̄ has MSE 1.4583. θ̂ = 0.9x̄ has bias −0.35 and variance 0.81 × 1.4583 = 1.1813: MSE = 0.1225 + 1.1813 = 1.3038, lower than the unbiased estimate's.
`, [yt("EuBBz3bI-aA", "Machine learning fundamentals: bias and variance")], [
  iq("Explain the bias–variance trade-off.", "Expected error = bias² + variance + noise. Simple models make systematic errors (bias); flexible models fit noise in the particular sample (variance). Increasing flexibility trades bias for variance; the best model minimises their sum, found by validation.", ["Decomposition", "Simple vs flexible", "Choose by validation"]),
  iq("Training error 1%, validation error 15%. What do you do?", "High variance (overfitting). Get more data or augment, add regularisation (weight decay, dropout), simplify the model, use early stopping, and check for leakage between train and validation in the other direction.", ["Diagnosis: variance", "At least three remedies"]),
  iq("Will more data fix an underfitting model?", "No. If training error is already high, the model can't represent the pattern; more data keeps the curves high. Increase capacity, add features, or reduce regularisation.", ["No", "Capacity / features / less regularisation", "Learning curve reasoning"]),
]);
Card_("ml-bv-c1", "High bias vs high variance", "Bias: train error high. Variance: train low, validation much higher.", B.bv);
Card_("ml-bv-c2", "MSE decomposition", "bias² + variance (+ noise for prediction error).", B.bv);

ml(B.regl, "Regularisation: ridge, lasso and friends", "Penalising weights to trade a little bias for a lot less variance.", `
**Ridge (L2).** Minimise ‖y − Xw‖² + λ‖w‖². Closed form w = (XᵀX + λI)⁻¹Xᵀy. Shrinks all weights smoothly towards 0, never exactly 0. Handles correlated features well (spreads weight across them).

**Lasso (L1).** Minimise ‖y − Xw‖² + λ‖w‖₁ (scikit-learn: (1/2n)‖y − Xw‖² + α‖w‖₁). Sets some weights exactly to 0 → built-in feature selection. Among correlated features it tends to pick one.

**Why lasso gives zeros.** With an orthonormal design each coefficient is soft-thresholded: w = sign(ŵ) max(|ŵ| − λ, 0). Ridge instead scales: w = ŵ/(1 + λ). Geometrically the L1 ball has corners on the axes.

**Elastic net** mixes both: sparse like lasso, stable like ridge with correlated features.

**Practical points.**

- Standardise features first: the penalty treats all weights equally, so scale matters.
- Don't penalise the intercept.
- Choose λ by cross-validation. Bigger λ → more bias, less variance.
- Bayesian view: ridge = Gaussian prior on weights, lasso = Laplace prior.
- In neural networks: weight decay (L2), dropout, early stopping, data augmentation.

**Worked example 1.** 1-D, no intercept: x = (1, 2, 3), y = (2, 4, 6), λ = 2. w = Σxy/(Σx² + λ) = 28/16 = 1.75 (OLS gives 2).

**Worked example 2.** Orthonormal OLS coefficients (3, −0.5, 1.2), λ = 1. Lasso → (2, 0, 0.2). Ridge → (1.5, −0.25, 0.6).
`, [yt("Q81RR3yKn30", "Regularization part 1: ridge (L2) regression"), yt("NGf0voTMlcs", "Regularization part 2: lasso (L1) regression"), yt("Xm2C_gTAl8c", "Ridge vs lasso regression, visualized")], [
  iq("Why does L1 produce sparse solutions and L2 doesn't?", "The L1 penalty has a constant gradient (±λ) no matter how small the weight, so it pushes small weights all the way to 0 (soft-thresholding); the L2 gradient 2λw vanishes as w → 0, so weights shrink but don't reach 0. Geometrically, the L1 constraint region has corners on the axes where the loss contours tend to touch.", ["Constant vs vanishing gradient", "Soft-threshold vs scaling", "Geometry"]),
  iq("Why must you scale features before ridge or lasso?", "The penalty applies equally to every weight, but a weight's size depends on its feature's units. Without scaling, features measured in large units get small weights and are barely penalised, while others are over-penalised.", ["Penalty is scale-dependent", "Standardise first"]),
  iq("You have 50 highly correlated features. Lasso or ridge?", "Ridge (or elastic net). Lasso picks one of a correlated group somewhat arbitrarily and is unstable across samples; ridge spreads weight across them. Elastic net gives sparsity with grouping.", ["Ridge / elastic net", "Lasso unstable with correlated features"]),
]);
Card_("ml-reg-c1", "Lasso vs ridge (orthonormal design)", "Lasso: sign(ŵ)max(|ŵ| − λ, 0). Ridge: ŵ/(1 + λ).", B.regl);

ml(B.loss, "Loss functions and maximum likelihood", "Which loss to use, and why each one is a likelihood in disguise.", `
**Regression.**

- **MSE** = mean (y − ŷ)². Penalises big errors heavily; optimum predicts the conditional mean. Equals the negative log-likelihood under Gaussian noise.
- **MAE** = mean |y − ŷ|. Robust to outliers; optimum predicts the median. Laplace noise.
- **Huber:** quadratic for small errors, linear for big ones — a compromise.

**Classification.**

- **Binary cross-entropy (log loss)** = −mean[y log p + (1 − y) log(1 − p)]. The Bernoulli negative log-likelihood. Confident wrong answers are punished hard: p = 0.01 for a true 1 costs 4.6.
- **Categorical cross-entropy** with softmax: L = −log softmax(z)_true = log Σ e^z − z_true. Gradient w.r.t. logits: p − y.
- **Hinge** (SVMs): max(0, 1 − y·score); only cares about the margin.

**Why not MSE for classification?** With a sigmoid output, MSE's gradient vanishes when the model is confidently wrong, and the loss is non-convex in the weights; cross-entropy keeps strong gradients.

**Metrics vs losses.** Accuracy and F1 aren't differentiable; you train on a surrogate (cross-entropy) and evaluate on the metric.

**Worked example 1.** y = (3, 5), ŷ = (2, 7): MSE = (1 + 4)/2 = 2.5; MAE = 1.5.

**Worked example 2.** True label 1: p = 0.9 → loss 0.105; p = 0.1 → 2.303.

**Worked example 3.** Logits (2, 1, 0), true class 1: log(e² + e + 1) − 2 = 2.4076 − 2 = 0.4076.
`, [yt("6ArSys5qHAU", "Neural networks part 6: cross entropy"), yt("XepXtl9YKwc", "Maximum likelihood, clearly explained")], [
  iq("Why is cross-entropy used for classification rather than MSE?", "It's the negative log-likelihood of a Bernoulli/categorical model, so minimising it is maximum likelihood. With sigmoid/softmax outputs its gradient is simply p − y, which stays large when the model is confidently wrong; MSE's gradient gets multiplied by σ′ and vanishes there.", ["NLL / MLE", "Gradient p − y", "MSE vanishing gradient"]),
  iq("What does minimising MSE vs MAE predict?", "MSE → the conditional mean; MAE → the conditional median. So MAE is more robust to outliers, and for skewed targets the two give different answers.", ["Mean vs median", "Outlier robustness"]),
  iq("Connect MSE to maximum likelihood.", "If y = f(x) + ε with Gaussian ε of fixed variance, the log-likelihood is −Σ(y − f(x))²/(2σ²) + const, so maximising likelihood = minimising squared error.", ["Gaussian noise assumption", "Log-likelihood ∝ −SSE"]),
]);
Card_("ml-loss-c1", "Softmax cross-entropy", "L = log Σ e^z − z_true; ∂L/∂z = p − y.", B.loss);
Card_("ml-loss-c2", "Loss ↔ likelihood", "MSE ↔ Gaussian · MAE ↔ Laplace · cross-entropy ↔ Bernoulli/categorical.", B.loss);

ml(B.opt, "Optimisers: gradient descent to Adam", "How weights are updated, and what each refinement fixes.", `
**Gradient descent.** w ← w − η ∇L(w). Learning rate η too small → slow; too big → oscillation or divergence. On f(w) = k(w − a)², each step multiplies the distance to the minimum by (1 − 2kη): it converges only if 0 < η < 1/k.

**Batch vs stochastic.** Full-batch uses all data per step; **SGD / mini-batch** uses a sample. Noisier but much cheaper per step, and the noise can help escape sharp minima.

**Momentum.** v ← βv + ∇L, w ← w − ηv. Accumulates a velocity: speeds up along consistent directions, damps zig-zagging in narrow valleys. β ≈ 0.9.

**RMSProp.** Keeps a running average of squared gradients s ← ρs + (1 − ρ)g²; step = ηg/√(s + ε). Per-parameter step sizes: large gradients get smaller steps.

**Adam = momentum + RMSProp + bias correction.**

- m ← β₁m + (1 − β₁)g, v ← β₂v + (1 − β₂)g² (β₁ = 0.9, β₂ = 0.999).
- m̂ = m/(1 − β₁ᵗ), v̂ = v/(1 − β₂ᵗ) correct the start-at-zero bias.
- w ← w − η m̂/(√v̂ + ε). At step 1, m̂ = g and v̂ = g², so the step is ≈ η × sign(g), whatever the gradient's size.
- **AdamW** decouples weight decay from the adaptive step (standard for transformers).

**Learning-rate schedules.** Warm-up then decay (cosine, step). Warm-up stabilises Adam's early estimates.

**Worked example 1.** f(w) = (w − 3)², w₀ = 0, η = 0.1: g = −6 → w = 0.6. Each step keeps 0.8 of the distance: after n steps w = 3 − 3 × 0.8ⁿ.

**Worked example 2.** Momentum (β = 0.9), same f: step 1 v = −6, w = 0.6; step 2 g = −4.8, v = −10.2, w = 1.62.

**Worked example 3.** Adam, η = 0.01, from w = 0: first step w = 0.01 (η × sign of −g).
`, [yt("sDv4f4s2SB8", "Gradient descent, step-by-step"), yt("vMh0zPT0tLI", "Stochastic gradient descent, clearly explained"), yt("NE88eqLngkg", "Optimization for deep learning: momentum, RMSprop, AdaGrad, Adam", "DeepBean")], [
  iq("Explain Adam in a few sentences.", "Adam keeps an exponential average of gradients (momentum, first moment) and of squared gradients (second moment, like RMSProp), bias-corrects both because they start at 0, and steps by η m̂/(√v̂ + ε). The result is a per-parameter adaptive step that's robust to gradient scale.", ["First and second moments", "Bias correction", "Per-parameter adaptive step"]),
  iq("Your loss is exploding to NaN early in training. What do you check?", "Learning rate too high (lower it, add warm-up), gradient clipping, bad initialisation or missing normalisation, numerically unstable ops (log of 0, softmax without the max trick), and the data (NaNs, unscaled features).", ["Learning rate / warm-up", "Clipping", "Numerical stability", "Data issues"]),
  iq("Why does momentum help?", "In ravines where the gradient zig-zags across a steep direction and creeps along a shallow one, averaging gradients cancels the oscillations and accumulates speed along the consistent direction.", ["Damps oscillation", "Accelerates consistent direction"]),
]);
Card_("ml-opt-c1", "Adam's first step", "m̂ = g, v̂ = g² → Δw ≈ −η sign(g).", B.opt);
Card_("ml-opt-c2", "Momentum update", "v ← βv + g; w ← w − ηv.", B.opt);

ml(B.back, "Backpropagation", "The chain rule, applied efficiently from the loss back to every weight.", `
**Idea.** A network is a composition of simple functions. The chain rule gives each weight's gradient as a product of local derivatives along the path from that weight to the loss. Backprop computes these right-to-left, reusing shared intermediate gradients, so the cost of all gradients is about the cost of one forward pass.

**Forward pass:** compute and cache each layer's input and output. **Backward pass:** start with ∂L/∂ŷ and multiply by each layer's local derivative.

**Local derivatives to know.**

- Linear z = wx + b: ∂z/∂w = x, ∂z/∂x = w, ∂z/∂b = 1. For matrices: ∂L/∂W = δ xᵀ.
- Sigmoid: σ′(z) = σ(z)(1 − σ(z)) (max 0.25 → vanishing gradients in deep sigmoid nets).
- tanh′ = 1 − tanh². ReLU′ = 1 if z > 0 else 0 (dead ReLUs never recover).
- Squared error (ŷ − y)²: 2(ŷ − y). Softmax + cross-entropy together: p − y.

**Vanishing / exploding gradients.** Products of many factors < 1 shrink to 0; > 1 blow up. Remedies: ReLU-family activations, careful initialisation (He/Xavier), normalisation layers, residual connections, gradient clipping.

**Checking gradients.** Compare with finite differences (L(w + h) − L(w − h))/(2h) — this is how every question here is verified.

**Worked example 1.** y = σ(wx + b), w = 0, b = 0, x = 2: σ = 0.5, ∂y/∂w = 0.25 × 2 = 0.5.

**Worked example 2.** h = ReLU(w₁x), ŷ = w₂h, L = (ŷ − y)², with w₁ = 1, w₂ = 2, x = 1, y = 1: h = 1, ŷ = 2. ∂L/∂ŷ = 2, × w₂ = 4, × ReLU′ = 1, × x = 1 → ∂L/∂w₁ = 4. And ∂L/∂w₂ = 2 × h = 2.
`, [yt("Ilg3gGewQ5U", "Backpropagation, intuitively", "3Blue1Brown"), yt("tIeHLnjs5U8", "Backpropagation calculus", "3Blue1Brown"), yt("xBEh66V9gZo", "Neural networks part 7: cross entropy derivatives and backpropagation")], [
  iq("Explain backpropagation to someone who knows calculus.", "The loss is a nested function of all weights. Backprop applies the chain rule from the output backwards: each layer receives ∂L/∂(its output), multiplies by its local derivative to get gradients for its weights and ∂L/∂(its input), and passes that back. Caching forward values and reusing upstream gradients makes it about as cheap as a forward pass.", ["Chain rule", "Backward order and reuse", "Cost ≈ forward pass"]),
  iq("What causes vanishing gradients and how are they fixed?", "Gradients are products of many local derivatives; with sigmoid/tanh (derivative ≤ 0.25 or ≤ 1) they shrink exponentially with depth. Fixes: ReLU-type activations, He/Xavier initialisation, batch/layer norm, residual connections; for RNNs, LSTMs/GRUs.", ["Product of small factors", "Activations", "Init / normalisation / residuals"]),
  iq("How would you check that your hand-written gradient is correct?", "Gradient checking: perturb each parameter by ±h, compute (L(w + h) − L(w − h))/(2h), and compare with the analytic gradient using relative error (≈ 1e-7 is good). Use double precision and avoid kinks like ReLU at 0.", ["Central finite differences", "Relative error", "Precision / kinks"]),
]);
Card_("ml-back-c1", "Sigmoid derivative", "σ(z)(1 − σ(z)), at most 0.25.", B.back);
Card_("ml-back-c2", "Softmax + CE gradient", "∂L/∂z = p − y.", B.back);

for (const g of B8_ITEMS) {
  Item({
    id: g.id, topic: g.topic, d: g.d, secs: g.secs, prompt: g.prompt,
    ...(g.options ? { options: g.options } : {}),
    answer: g.answer,
    ...(g.tol !== undefined && !g.options ? { tol: g.tol } : {}),
    explain: g.explain, fast: g.fast, trap: g.trap,
    src: "Practice: generated; answer recomputed in Python (scipy, statsmodels, scikit-learn, enumeration or finite differences) (Nov 2026)",
    check: { py: g.py, ...(g.packages ? { packages: g.packages } : {}) },
  });
}
