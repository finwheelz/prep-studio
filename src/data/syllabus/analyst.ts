import { C, N, Q, R, T } from "./build";

const SQ = R("StatQuest", "https://www.youtube.com/@statquest", "Visual explanations of every test and model");
const KA = R("Khan Academy statistics", "https://www.khanacademy.org/math/statistics-probability", "Exercises on probability, sampling and significance");
const DL = R("DataLemur statistics questions", "https://datalemur.com/statistics-interview-questions", "Interview-style prompts");
const OI = R("OpenIntro Statistics (free book)", "https://www.openintro.org/book/os/", "Clear reference text");

T("stats-descriptive", "analyst", "Statistics", "Descriptive statistics", "Centre, spread, shape, percentiles and outliers.", `
**Centre.** Mean (sensitive to outliers), median (robust), mode (most frequent; the only one for categories).

**Spread.** Range. Variance = average squared deviation from the mean; standard deviation (SD) = its square root, in the data's units. Population formulas divide by N; sample formulas divide by n − 1 (Bessel's correction) to give an unbiased estimate. Coefficient of variation = SD / mean compares spread across scales.

**Percentiles and quartiles.** Q1, Q2 (median), Q3 are the 25th, 50th and 75th percentiles. IQR = Q3 − Q1 holds the middle 50%.

**Shape.**
- Right (positive) skew: long right tail, mean > median (incomes, order values).
- Left (negative) skew: mean < median.
- Kurtosis measures tail weight; a normal distribution has kurtosis 3 (excess 0). Fat tails mean extreme values are more common than a normal model predicts.

**Outliers.**
- Z-score: z = (x − mean) / SD; |z| > 3 is the usual flag (assumes roughly normal data).
- IQR rule: below Q1 − 1.5 × IQR or above Q3 + 1.5 × IQR. This is what a box plot's whiskers show.
- Investigate before deleting: data error, or a real and important case? Options: remove, cap (winsorise), transform (log), or use robust statistics.

**Standardisation.** z-scores put variables on a common scale with mean 0 and SD 1.

**Empirical rule** for a normal distribution: about 68% within 1 SD, 95% within 2, 99.7% within 3.

**Linear transformations.** Adding a constant shifts the mean and leaves SD unchanged. Multiplying by k multiplies both the mean and SD by |k| and the variance by k².

**Covariance and correlation.** Covariance shows direction; Pearson correlation r = cov(X, Y) / (SD_X SD_Y) lies in [−1, 1] and measures linear association. Spearman correlation uses ranks and captures monotonic relationships. Correlation is not causation: check for confounders, reverse causality and chance.

**Which summary to report.** Skewed data or outliers: median and IQR. Roughly symmetric: mean and SD.
`, { resources: [SQ, KA, OI] });
Q(1, "Mean is noticeably greater than the median. The distribution is most likely…", ["left-skewed", "right-skewed", "symmetric", "uniform"], 1, "A long right tail pulls the mean up.");
N(1, "Median of 4, 8, 15, 16, 23, 42?", 15.5, 0.001, "Mean of the two middle values.");
N(2, "Population variance of 2, 4, 4, 4, 5, 5, 7, 9?", 4, 0.001, "Mean 5; squared deviations sum to 32; 32/8.");
N(2, "Q1 = 20, Q3 = 50. The upper outlier fence by the IQR rule?", 95, 0.001, "50 + 1.5 × 30.");
N(2, "Mean 70, SD 10. The z-score of 95?", 2.5, 0.001, "(95 − 70)/10.");
Q(2, "Every value in a dataset is multiplied by 3. The standard deviation…", ["is unchanged", "is multiplied by 3", "is multiplied by 9", "increases by 3"], 1, "SD scales with |k|; variance with k².");
Q(2, "Every value is increased by 10. The variance…", ["increases by 10", "increases by 100", "is unchanged", "doubles"], 2, "Shifting does not change spread.");
Q(2, "The sample variance divides by n − 1 because…", ["it is easier to compute", "it corrects the bias from estimating the mean from the same sample", "n is unknown", "it makes the variance smaller"], 1, "Bessel's correction gives an unbiased estimator.");
Q(2, "For delivery times with a few very long delays, the best 'typical' value is the…", ["mean", "median", "mode", "range"], 1, "The median resists outliers.");
Q(2, "Correlation between ice-cream sales and drownings is high. The best explanation is…", ["ice cream causes drowning", "a confounder (hot weather) drives both", "drowning causes ice-cream sales", "the data are wrong"], 1, "A third variable.");
N(2, "In a normal distribution, about what percentage of values lie within 2 SD of the mean?", 95, 0.5, "68–95–99.7 rule.");
Q(3, "A distribution with excess kurtosis well above 0 has…", ["thinner tails than normal", "fatter tails than normal", "no tails", "negative skew"], 1, "Extreme values are more likely.");
C("Mean vs median under skew", "Right skew: mean > median. Left skew: mean < median. Report the median when skewed.");
C("IQR outlier rule", "Below Q1 − 1.5·IQR or above Q3 + 1.5·IQR.");
C("68–95–99.7", "Share of a normal distribution within 1, 2 and 3 SD of the mean.");
C("Effect of y = a + bx on mean and SD", "Mean: a + b·mean. SD: |b|·SD. Variance: b²·variance.");

T("stats-distributions", "analyst", "Statistics", "Probability distributions and expectation", "Bernoulli to normal, expectation and variance rules, CLT.", `
**Random variable**: a number determined by chance. Discrete variables have a probability mass function; continuous ones a density, with probabilities as areas.

**Expectation and variance.** E[X] = Σ x p(x). Var(X) = E[X²] − (E[X])². Rules: E[aX + b] = aE[X] + b; Var(aX + b) = a² Var(X); E[X + Y] = E[X] + E[Y] always; Var(X + Y) = Var(X) + Var(Y) only if independent (otherwise add 2 Cov).

**Discrete distributions.**
- Bernoulli(p): one trial. Mean p, variance p(1 − p).
- Binomial(n, p): successes in n independent trials. Mean np, variance np(1 − p).
- Geometric(p): trials until the first success. Mean 1/p.
- Poisson(λ): count of events in a fixed interval when events are independent and the rate is constant (calls per hour, defects per metre). Mean = variance = λ. Approximates Binomial when n is large and p small, λ = np.

**Continuous distributions.**
- Uniform(a, b): mean (a + b)/2, variance (b − a)²/12.
- Normal(μ, σ²): symmetric bell; standardise with z = (x − μ)/σ.
- Exponential(λ): waiting time between Poisson events. Mean 1/λ. Memoryless.
- Log-normal: the log is normal; right-skewed (incomes, prices).
- t: like the normal with heavier tails; used when σ is estimated from a small sample. Approaches the normal as degrees of freedom grow.
- Chi-square: sum of squared standard normals; used for variance and categorical tests.

**Central limit theorem.** The mean of a large random sample is approximately normal with mean μ and standard error σ/√n, whatever the shape of the population (finite variance; n ≈ 30 is the usual rule of thumb, more for heavy skew). This is why normal-based intervals and tests work for means.

**Law of large numbers.** The sample mean converges to the population mean as n grows.

**Standard error vs standard deviation.** SD describes the spread of individual values; SE describes the spread of an estimate. Quadrupling the sample halves the SE.

**Useful z-values.** 1.645 (90% two-sided / 95% one-sided), 1.96 (95%), 2.576 (99%).

**Bayes.** Posterior ∝ likelihood × prior. P(H | D) = P(D | H) P(H) / P(D).

**Markov chains.** The next state depends only on the current one. A transition matrix P gives one-step probabilities; n-step probabilities are Pⁿ.
`, { resources: [SQ, KA, OI] });
N(1, "X ~ Binomial(10, 0.3). E[X]?", 3, 0.001, "np.");
N(2, "X ~ Binomial(10, 0.3). Var(X)?", 2.1, 0.001, "np(1 − p).");
Q(1, "Calls arriving at a call centre per hour are usually modelled as…", ["Binomial", "Poisson", "Uniform", "Normal"], 1, "Counts of independent events at a constant rate.");
N(2, "Population SD is 20. Standard error of the mean for n = 100?", 2, 0.001, "20/√100.");
Q(2, "The central limit theorem says that, for large n…", ["the population becomes normal", "the sample mean is approximately normal", "the sample variance is zero", "all samples are identical"], 1, "It is about the sampling distribution of the mean.");
N(2, "Var(X) = 4. Var(3X + 5)?", 36, 0.001, "9 × 4; the constant adds nothing.");
N(2, "X and Y independent with variances 9 and 16. SD of X + Y?", 5, 0.001, "√25.");
N(3, "Events follow a Poisson process at 2 per hour. P(no events in an hour)? (3 decimals)", 0.135, 0.002, "e⁻².");
Q(2, "To halve the standard error of a mean you must make the sample…", ["twice as large", "four times as large", "half as large", "ten times as large"], 1, "SE ∝ 1/√n.");
Q(2, "A t-distribution is used instead of a normal when…", ["n is very large", "the population SD is unknown and estimated from a small sample", "data are categorical", "the mean is zero"], 1, "Heavier tails account for the extra uncertainty.");
N(3, "Two-state Markov chain: P(stay in A) = 0.9, P(B → A) = 0.5. Starting in A, P(in A after two steps)?", 0.86, 0.001, "0.9 × 0.9 + 0.1 × 0.5.");
N(2, "A fair die is rolled. Var of the outcome? (2 decimals)", 2.92, 0.01, "E[X²] = 91/6 = 15.17; minus 3.5² = 12.25.");
Q(2, "Which distribution is memoryless?", ["Normal", "Exponential", "Binomial", "Uniform"], 1, "The exponential (and the geometric among discrete ones).");
C("Binomial mean and variance", "np and np(1 − p)");
C("Poisson", "Counts in an interval; mean = variance = λ.");
C("Central limit theorem", "Sample means are approximately normal with SE = σ/√n for large n.");
C("SD vs SE", "SD: spread of data. SE: spread of an estimate = SD/√n.");

T("stats-inference", "analyst", "Statistics", "Confidence intervals and hypothesis testing", "p-values, errors, power, and choosing the right test.", `
**Estimation.** A point estimate is one number; a confidence interval gives a range: estimate ± critical value × standard error. For a mean: x̄ ± 1.96 × s/√n (95%, large n). For a proportion: p̂ ± 1.96 × √(p̂(1 − p̂)/n). A 95% interval means the method captures the true value in 95% of repeated samples; it does not mean a 95% probability for this one interval. Wider for higher confidence, narrower for larger n.

**Hypothesis test.**
1. Null H₀ (no effect) and alternative H₁.
2. Choose α (usually 0.05).
3. Compute a test statistic = (estimate − null value) / standard error.
4. p-value = probability of data at least this extreme if H₀ were true.
5. p < α: reject H₀. Otherwise fail to reject (not "accept").

A p-value is not the probability that H₀ is true, and not the size of the effect.

**Errors.** Type I (false positive): rejecting a true H₀; probability α. Type II (false negative): missing a real effect; probability β. Power = 1 − β. Power rises with sample size, effect size and α, and falls with noise.

**One- vs two-tailed.** Two-tailed tests for any difference; one-tailed only when direction was fixed in advance.

**Which test.**

- One mean vs a value: one-sample t (z if σ known or n large).
- Two independent means: two-sample t (Welch's if variances differ).
- Same units before and after: paired t.
- Three or more means: ANOVA (F test), then post-hoc comparisons.
- Two proportions (conversion rates): two-proportion z.
- Two categorical variables: chi-square test of independence. Observed vs expected counts: chi-square goodness of fit. χ² = Σ (O − E)² / E.
- Non-normal or ordinal data: Mann–Whitney U, Wilcoxon signed-rank, Kruskal–Wallis.
- Linear association: test on the correlation or regression slope.

**Statistical vs practical significance.** With huge samples tiny effects become significant. Report the effect size and interval, and ask whether it matters.

**Multiple comparisons.** Testing many hypotheses inflates false positives; correct with Bonferroni (α / m) or control the false discovery rate.

**Assumptions for t-tests.** Independent observations, roughly normal data or large n, and for the pooled version equal variances.

**Sampling.** Simple random, stratified (random within groups: lower variance), cluster (random groups), systematic (every k-th). Biases: selection, survivorship, non-response, convenience.
`, { resources: [SQ, KA, DL, OI] });
Q(1, "A p-value of 0.03 means…", ["there is a 3% chance the null is true", "if the null were true, data this extreme would occur about 3% of the time", "the effect is 3%", "the test has 97% power"], 1, "It is a statement about the data given the null.");
Q(1, "A Type I error is…", ["missing a real effect", "rejecting a true null hypothesis", "using the wrong test", "a small sample"], 1, "A false positive, with probability α.");
Q(2, "Which test compares mean satisfaction before and after training for the same employees?", ["Two-sample t-test", "Paired t-test", "Chi-square", "ANOVA"], 1, "The same units are measured twice.");
Q(2, "Which test checks whether device type and purchase (yes/no) are related?", ["t-test", "Chi-square test of independence", "ANOVA", "Paired t-test"], 1, "Two categorical variables.");
Q(2, "Comparing mean order value across four cities calls for…", ["four t-tests", "ANOVA", "chi-square", "a z-test"], 1, "ANOVA tests several means at once and controls the false-positive rate.");
N(2, "Sample mean 50, sample SD 10, n = 100. Upper limit of the 95% confidence interval? (2 decimals)", 51.96, 0.01, "50 + 1.96 × 1.");
N(3, "A sample proportion is 0.40 with n = 600. Standard error? (3 decimals)", 0.02, 0.001, "√(0.4 × 0.6 / 600) = 0.02.");
Q(2, "Increasing the sample size, all else equal…", ["raises power", "lowers power", "raises α", "widens the confidence interval"], 0, "Smaller standard error makes real effects easier to detect.");
Q(2, "You run 20 independent tests at α = 0.05 on data with no real effects. Expected number of false positives?", ["0", "1", "5", "20"], 1, "20 × 0.05.");
Q(2, "'Fail to reject H₀' means…", ["H₀ is proven true", "the data are not strong enough evidence against H₀", "H₁ is false", "the test was invalid"], 1, "Absence of evidence is not evidence of absence.");
N(3, "Chi-square: observed counts 30 and 70, expected 50 and 50. χ²?", 16, 0.001, "(20²/50) × 2.");
Q(3, "A/B test: conversion 10.0% vs 10.4%, p = 0.20. Best decision?", ["Ship: it is higher", "Do not conclude; check power and run longer", "Reject the variant as worse", "Lower α to 0.01"], 1, "Not significant; the test may be under-powered for an effect this small.");
Q(2, "Stratified sampling is preferred over simple random sampling when…", ["the population is homogeneous", "important subgroups differ and must each be represented", "the sample is very large", "cost is no concern"], 1, "It lowers variance and guarantees coverage.");
Q(3, "A 95% confidence interval for a difference in means is (−0.5, 3.1). At α = 0.05 the difference is…", ["significant", "not significant, because the interval contains 0", "significant and positive", "impossible to judge"], 1, "Zero is a plausible value.");
C("p-value", "P(data at least this extreme | H₀ true). Not P(H₀ true).");
C("Type I vs Type II", "False positive (α) vs false negative (β). Power = 1 − β.");
C("Test chooser", "2 means: t-test (paired if same units). 3+ means: ANOVA. Categorical vs categorical: chi-square. Proportions: z. Non-normal: Mann–Whitney / Wilcoxon.");
C("95% CI for a mean", "x̄ ± 1.96 · s/√n");
C("What raises power?", "Larger n, larger effect, larger α, less noise.");

T("stats-regression", "analyst", "Statistics", "Regression for analysts", "Linear and logistic regression: interpretation, assumptions, diagnostics.", `
**Simple linear regression.** y = β₀ + β₁x + ε. Least squares chooses the line minimising the sum of squared residuals. β₁ = cov(x, y) / var(x): the expected change in y for a one-unit increase in x. β₀: the expected y at x = 0.

**Multiple regression.** Each coefficient is the effect of its variable holding the others fixed.

**Fit.** R² = 1 − SS_res / SS_tot: the share of variance explained. Adding variables never lowers R²; adjusted R² penalises extra predictors. RMSE is in the units of y. A high R² does not prove the model is right or causal.

**Inference.** Each coefficient has a standard error, t-statistic and p-value (H₀: coefficient = 0). The F-test asks whether the model as a whole explains anything.

**Assumptions (LINE).** Linearity; Independence of errors; Normality of errors (for inference); Equal variance (homoscedasticity). Plus no perfect multicollinearity.

**Diagnostics.**
- Residuals vs fitted: curve → non-linearity; funnel → heteroscedasticity.
- Q–Q plot: normality of residuals.
- Multicollinearity: variance inflation factor above 5–10. Coefficients become unstable and signs may flip; predictions are still fine. Fix by dropping or combining variables or regularising.
- Influential points: leverage, Cook's distance.
- Autocorrelated errors in time series: Durbin–Watson.

**Categorical predictors.** One-hot encode with one level dropped as the reference (the dummy-variable trap).

**Transformations.** Log of a right-skewed outcome stabilises variance; a log–log model's slope is an elasticity (% change in y per 1% change in x). Interaction terms let one variable's effect depend on another.

**Logistic regression** models a binary outcome: log(p / (1 − p)) = β₀ + β₁x. The right-hand side is the log-odds. p = 1 / (1 + e⁻ᶻ). e^β is the odds ratio for a one-unit increase. Fitted by maximum likelihood (log loss), not least squares. Probit uses the normal CDF instead of the logistic; results are usually similar.

Conversions: odds = p / (1 − p); p = odds / (1 + odds). Log-odds 0 ↔ p = 0.5.

**Correlation vs causation.** Regression on observational data shows association. Causal claims need randomisation or a design that handles confounding.
`, { resources: [SQ, OI, R("Penn State STAT 501", "https://online.stat.psu.edu/stat501/", "Regression methods course notes")] });
Q(1, "In y = 20 + 3x, the coefficient 3 means…", ["y is 3 when x is 0", "y rises by 3 on average for each one-unit increase in x", "x explains 3% of y", "the correlation is 3"], 1, "The slope.");
N(2, "SS_res = 40 and SS_tot = 200. R²?", 0.8, 0.001, "1 − 40/200.");
Q(2, "Adding an irrelevant predictor to a linear model makes R²…", ["fall", "stay the same or rise", "become negative", "undefined"], 1, "R² never decreases; adjusted R² can fall.");
Q(2, "A funnel shape in the residuals-vs-fitted plot indicates…", ["non-linearity", "heteroscedasticity", "multicollinearity", "normal errors"], 1, "The error variance changes with the fitted value.");
Q(2, "Multicollinearity mainly harms…", ["predictions", "the stability and interpretation of coefficients", "R²", "the intercept only"], 1, "Standard errors inflate and signs can flip.");
N(2, "A probability of 0.8 corresponds to odds of…", 4, 0.001, "0.8 / 0.2.");
N(2, "Log-odds of 0 corresponds to a probability of…", 0.5, 0.001, "σ(0) = 0.5.");
N(3, "A logistic coefficient is 0.693. The odds ratio for a one-unit increase? (1 decimal)", 2, 0.05, "e^0.693 ≈ 2.");
Q(2, "For a 3-level categorical predictor in a regression with an intercept you create…", ["3 dummies", "2 dummies", "1 dummy", "no dummies"], 1, "Drop one level as the reference to avoid perfect collinearity.");
Q(3, "In log(y) = a + b·log(x), b is interpreted as…", ["the change in y per unit of x", "the % change in y for a 1% change in x", "the correlation", "the intercept"], 1, "An elasticity.");
Q(2, "Logistic regression is fitted by…", ["ordinary least squares", "maximum likelihood (minimising log loss)", "k-means", "gradient boosting"], 1, "There is no closed-form least-squares solution.");
Q(3, "VIF of 12 for a predictor suggests…", ["no problem", "strong multicollinearity with the other predictors", "the predictor is significant", "heteroscedasticity"], 1, "Above about 5–10 is the usual warning level.");
C("R² vs adjusted R²", "R² never falls when you add predictors; adjusted R² penalises them.");
C("LINE assumptions", "Linearity, Independence, Normal errors, Equal variance.");
C("Odds and log-odds", "odds = p/(1 − p); logit = ln(odds); p = 1/(1 + e⁻ᶻ).");
C("Interpreting a logistic coefficient", "e^β is the odds ratio per one-unit increase.");

T("eda-viz", "analyst", "Analysis", "EDA, data cleaning and visualisation", "A repeatable workflow from raw file to insight.", `
**Exploratory data analysis workflow.**

1. **Understand the grain.** What does one row represent? What is the key? Read the data dictionary: column meaning, units, allowed values.
2. **Shape and types.** Rows, columns, dtypes; dates parsed as dates, numbers as numbers.
3. **Quality.** Missing values per column, duplicates, impossible values (negative ages, future dates), inconsistent categories ("Mumbai", "mumbai ", "BOM").
4. **Univariate.** Numeric: histogram, box plot, summary statistics. Categorical: counts and shares.
5. **Bivariate.** Numeric–numeric: scatter and correlation. Numeric–categorical: grouped box plots or means. Categorical–categorical: cross-tab and chi-square.
6. **Time.** Trend, seasonality, sudden breaks.
7. **Segment.** Repeat the key cuts by region, cohort, platform. Watch for Simpson's paradox: a trend in each group can reverse when groups are combined.
8. **Write it down**: what, so what, now what.

**Missing data.** Why is it missing? MCAR (completely at random), MAR (depends on observed data), MNAR (depends on the missing value itself). Options: drop rows (few, MCAR), drop a column (mostly missing), impute the median (skewed) or mean (symmetric) or mode (categorical), group-wise imputation, forward-fill for time series, model-based imputation, and adding a "was missing" flag. Impute using training data only.

**Outliers.** Detect with the IQR rule or z-scores; decide with domain knowledge.

**Feature basics.** Scaling (standardise or min–max), log transforms for skew, binning, date parts (month, weekday), ratios, encoding categories.

**Choosing a chart.**

- Compare categories: bar (sorted; horizontal for long labels).
- Trend over time: line.
- Distribution: histogram, box plot (median, quartiles, outliers), violin.
- Relationship: scatter (add a trend line); bubble for a third variable.
- Composition: stacked bar; pie only for two to four parts.
- Correlation matrix: heatmap.
- Funnel: ordered bars.
- Geography: map.

**Honest charts.** Bars start at zero; label axes and units; one message per chart, stated in the title; highlight the series that matters; avoid dual axes and 3-D.

**Storytelling.** Lead with the answer, then the evidence, then the recommendation. Explain results in plain language: reported interviews stress "interpretation and insights".

**Business metrics an analyst is expected to know.** Cohort retention, churn = customers lost / customers at start, ARPU, LTV = ARPU × gross margin × lifetime (lifetime = 1 / churn), CAC = acquisition spend / new customers, funnel conversion, DAU / MAU, repeat rate, AOV = revenue / orders, NPS = % promoters − % detractors.
`, { resources: [R("Kaggle: Data Visualization", "https://www.kaggle.com/learn/data-visualization", "Chart types with seaborn"), R("CampusX: 100 Days of ML", "https://www.youtube.com/playlist?list=PLKnIA16_Rmvbr7zKYQuBfsVkjoLcJgxHH", "EDA, missing values and outliers lessons"), R("From Data to Viz", "https://www.data-to-viz.com/", "Decision tree for chart choice")] });
Q(1, "Best chart for the distribution of order values?", ["Pie", "Histogram", "Line", "Stacked bar"], 1, "Histograms show shape, centre and spread.");
Q(1, "A box plot's box spans…", ["minimum to maximum", "Q1 to Q3", "mean ± SD", "the 5th to 95th percentile"], 1, "The interquartile range, with the median inside.");
Q(2, "A right-skewed numeric column has 4% missing values. A reasonable simple imputation is the…", ["mean", "median", "zero", "maximum"], 1, "The median is robust to skew.");
Q(2, "Missingness that depends on the unobserved value itself (high earners hide income) is…", ["MCAR", "MAR", "MNAR", "random"], 2, "Missing not at random: the hardest case.");
Q(2, "A treatment looks better in every subgroup but worse overall. This is…", ["the central limit theorem", "Simpson's paradox", "regression to the mean", "survivorship bias"], 1, "Group sizes differ, reversing the aggregate.");
N(2, "Monthly churn is 5%. Expected customer lifetime in months?", 20, 0.001, "1 / 0.05.");
N(2, "ARPU ₹400 a month, gross margin 50%, monthly churn 10%. LTV (₹)?", 2000, 0.5, "400 × 0.5 × 10.");
N(2, "60% promoters, 25% passives, 15% detractors. NPS?", 45, 0.001, "60 − 15.");
Q(2, "Which is the first question to ask of a new table?", ["Which model fits best?", "What does one row represent?", "What colour palette to use?", "How many charts are needed?"], 1, "The grain determines every aggregation.");
Q(2, "Bar charts should start their value axis at zero because…", ["it looks better", "bar length encodes the value, so truncation exaggerates differences", "software requires it", "it saves space"], 1, "Line charts can sometimes truncate; bars should not.");
N(2, "Marketing spent ₹6,00,000 and acquired 1,500 customers. CAC (₹)?", 400, 0.001, "6,00,000 / 1,500.");
Q(2, "To compare a numeric variable across five categories, use…", ["five pie charts", "grouped box plots", "a scatter plot", "a line chart"], 1, "Box plots compare distributions side by side.");
Q(3, "Imputing missing values with the overall mean before a train/test split causes…", ["underfitting", "data leakage from the test set", "no issue", "multicollinearity"], 1, "Compute imputation statistics on the training data only.");
C("EDA order", "Grain → types → quality → univariate → bivariate → time → segments → write-up.");
C("Insight format", "What happened, so what (why it matters), now what (action).");
C("LTV, CAC, churn", "LTV = ARPU × margin × 1/churn. CAC = spend / new customers. Churn = lost / starting customers.");
C("Simpson's paradox", "A trend within every group reverses when the groups are combined.");
