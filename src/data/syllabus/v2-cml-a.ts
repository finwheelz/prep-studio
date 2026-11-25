/**
 * v2 Classical ML, part A: Data and features · Linear models · Trees and ensembles.
 * Fixed ids. Every quiz answer is recomputed in Pyodide (scripts/verify-items.mts).
 */
import { SOURCES as S, lessonWriter } from "./v2-shared";

const { L, Q, C } = lessonWriter("cml");
const F = "Data and features";
const LM = "Linear models";
const TR = "Trees and ensembles";

// ───────────────────────── Data and features ─────────────────────────

L("cml-encoding", F, "Encoding categorical features", "One-hot, ordinal, target and hashing encodings, and which model wants which.", {
  kind: "concept", mins: 20,
  hook: "Your loan data has a 'branch' column with 1,400 values. One-hot it, label-encode it, or something else?",
  intuition: `
**The situation.** Models do arithmetic, and "Mumbai" isn't a number. Every categorical column has to become numbers, and the choice changes what the model can learn.

**The idea.** An encoding is an assumption about the category.

- **One-hot** says: categories are unrelated, each gets its own column and its own weight. Safe for linear models, but 1,400 branches means 1,400 sparse columns.
- **Ordinal** (integer codes) says: categories have an order and equal spacing. True for "low < medium < high". For "city", a linear model would believe Pune is halfway between Delhi and Mumbai.
- **Target encoding** replaces each category with a (shrunk) average of the target for that category. One dense column, great for high cardinality, but it leaks the label unless done out-of-fold.
- **Hashing** maps categories into a fixed number of buckets. Bounded memory, handles unseen values, accepts collisions.

Trees are more forgiving: they can split ordinal codes many times, so integer codes often work fine for them, and some libraries split categories natively.
`,
  maths: `
**In one breath.** One-hot gives $k$ columns (or $k - 1$ with a reference level); target encoding with smoothing uses $\\hat\\mu_c = \\dfrac{n_c\\,\\bar y_c + m\\,\\bar y}{n_c + m}$, fitted out-of-fold.

**One-hot and the dummy trap.** With an intercept, $k$ one-hot columns always sum to 1, which duplicates the intercept: $X^\\top X$ is singular. Drop one level (it becomes the baseline the intercept represents) or regularise. Each remaining weight is "difference from the baseline category".

**Smoothed target encoding.** A category seen 3 times with mean default rate 0.67 shouldn't get 0.67. Shrink towards the global mean $\\bar y$ with strength $m$ (pseudo-counts). Example: $n_c = 20$, $\\bar y_c = 0.30$, $\\bar y = 0.10$, $m = 10$: $\\hat\\mu_c = (20 \\times 0.30 + 10 \\times 0.10)/30 = 0.233$.

**Out-of-fold.** Compute each row's encoding from the other folds only. Otherwise a row's own label is baked into its feature and the model learns to read it.

| Encoding | Columns | Assumes | Good for | Watch out |
|---|---|---|---|---|
| One-hot | $k$ or $k-1$ | no order | linear models, few levels | width, rare levels |
| Ordinal | 1 | order + spacing | genuinely ordered levels; trees | fake order for linear models |
| Target | 1 | target mean is the signal | high cardinality, boosting | leakage; fit out-of-fold |
| Hashing | fixed $b$ | collisions are tolerable | huge or streaming vocabularies | uninterpretable |
| Frequency | 1 | popularity matters | trees | ties between levels |
`,
  practice: `
**Defaults.**

- Few levels (< ~15) and a linear model: one-hot, drop first or regularise.
- Many levels with a tree ensemble: native categorical support (LightGBM, CatBoost, HistGradientBoosting) or target encoding.
- Rare levels: group into "other" below a count threshold before encoding.
- Unseen levels at serving time: \`OneHotEncoder(handle_unknown="ignore")\` or an explicit "unknown" bucket.
- Always inside a \`Pipeline\` / \`ColumnTransformer\`, so encoders are fitted on training folds only.

**Where it shows up.** Credit scorecards use WoE (weight of evidence) binning, which is target encoding on the log-odds scale. Recommenders use embeddings, which are learned encodings.
`,
  traps: [
    { trap: "Label-encode everything; the model will figure it out.", why: "A linear model can't: it gets one weight per column, so codes 0, 1, 2 force the effect of category 2 to be twice category 1's. Trees can partly recover, at the cost of extra splits." },
    { trap: "Target-encode on the full training set, then cross-validate.", why: "Each row's encoding contains its own label, so CV scores are inflated and the model over-trusts the feature. Encode out-of-fold (scikit-learn's TargetEncoder does this in fit_transform)." },
    { trap: "Keep all k dummy columns with an intercept in plain OLS.", why: "Perfect multicollinearity: coefficients aren't identifiable. Drop one level or regularise." },
  ],
  say: {
    prompt: "How would you encode a categorical feature with 5,000 distinct values for a gradient-boosted model?",
    secs: 45,
    check: ["Ruled out one-hot (width, sparsity) and plain ordinal for linear models", "Target encoding with smoothing towards the global mean", "Fitted out-of-fold to avoid leakage", "Alternatives: native categorical support, hashing, frequency encoding", "Rare and unseen categories handled"],
    followups: [
      { q: "Why does target encoding need smoothing?", a: "Categories with few rows have noisy means; shrinking towards the global mean by $m$ pseudo-counts trades a little bias for much less variance, like a Bayesian prior." },
      { q: "What is the dummy-variable trap?", a: "With an intercept, all $k$ one-hot columns sum to the intercept column, so $X^\\top X$ is singular. Drop a reference level or use regularisation." },
      { q: "How do embeddings relate to encodings?", a: "An embedding is a learned dense encoding: each category gets a vector trained with the model, so similar categories end up close. Used for high-cardinality IDs in neural nets." },
    ],
    answer: `One-hot would create 5,000 sparse columns, and plain integer codes impose a meaningless order. For a boosted model I'd use smoothed target encoding: replace each category with its target mean shrunk towards the global mean, computed out-of-fold so a row never sees its own label. I'd group rare categories into "other" and map unseen ones to the global mean. If the library supports native categorical splits (LightGBM, CatBoost), I'd compare that too, and hashing is the fallback for streaming or unbounded vocabularies.`,
    avoid: ["Label-encoding and feeding it to a linear model", "Target encoding computed on the whole training set"],
  },
  terms: [["One-hot", "One 0/1 column per category."], ["Target encoding", "Replace a category with a shrunk mean of the target for that category."], ["Dummy trap", "One-hot columns plus an intercept are perfectly collinear."], ["Hashing trick", "Map categories into a fixed number of buckets by a hash function."]],
  sources: [S.sklPre, S.islr],
});
Q({ id: "cml-enc-1", d: 1, secs: 30, prompt: "A column has 12 categories. How many columns does one-hot encoding with a dropped reference level produce?", answer: 11, tol: 0.5, explain: "k − 1 = 11; the dropped level is absorbed by the intercept.", py: "answer = 12 - 1" });
Q({ id: "cml-enc-2", d: 2, secs: 60, prompt: "Smoothed target encoding: a category has 20 rows with mean 0.30, the global mean is 0.10 and the smoothing strength is m = 10. Encoded value? (3 decimals)", answer: 0.233, tol: 0.002, explain: "(20 × 0.30 + 10 × 0.10)/(20 + 10) = 7/30 = 0.233.", py: "answer = (20*0.30 + 10*0.10)/(20+10)" });
Q({ id: "cml-enc-3", d: 1, secs: 30, prompt: "You integer-encode an unordered 'city' column (Delhi = 0, Pune = 1, Mumbai = 2) and fit linear regression. What have you assumed?", options: ["Nothing; the model learns each city's effect", "Pune's effect is exactly halfway between Delhi's and Mumbai's", "Cities are independent", "Mumbai is the reference category"], answer: 1, explain: "One weight w on the code means effects 0, w, 2w: equally spaced and ordered.", py: "answer = 1" });
Q({ id: "cml-enc-4", d: 2, secs: 60, prompt: "OneHotEncoder (scikit-learn) on columns with 3, 4 and 5 categories, no level dropped. Total output columns?", answer: 12, tol: 0.5, explain: "3 + 4 + 5 = 12.", py: "import pandas as pd\nfrom sklearn.preprocessing import OneHotEncoder\nX = pd.DataFrame({'a': list('abcabcabcabc'), 'b': list('pqrspqrspqrs'), 'c': list('vwxyzvwxyzvw')})\nanswer = OneHotEncoder().fit_transform(X).shape[1]", packages: ["scikit-learn", "pandas"] });
C("cml-enc-c1", "Smoothed target encoding", "(n_c·ȳ_c + m·ȳ)/(n_c + m), computed out-of-fold.");
C("cml-enc-c2", "Encoding by model", "Linear: one-hot. Trees/boosting with many levels: native categorical or target encoding. Huge vocab: hashing.");

L("cml-missing-scaling", F, "Missing values and feature scaling", "Imputation strategies, missingness as signal, and which models need scaled inputs.", {
  kind: "concept", mins: 20,
  hook: "Income is missing for 18% of applicants. Fill with the mean, drop the rows, or something smarter?",
  intuition: `
**The situation.** A credit dataset: income missing for 18% of rows, tenure in months (0–360), loan amount in rupees (10⁴–10⁷). A k-NN model on raw features does terribly.

**Missing values: first ask why.**

- **MCAR** (missing completely at random): a form glitch. Any sensible fill is fine.
- **MAR** (missing at random given other columns): self-employed applicants skip income more. Impute from other columns.
- **MNAR** (missing not at random): people with low income leave it blank. The missingness itself predicts default, so **keep a "was missing" flag**.

**Scaling: does the model use distances or penalties?** k-NN, k-means, SVMs, PCA, and anything regularised (ridge, lasso, neural nets) compare features on one scale. Unscaled, loan amount in rupees dominates every distance. Trees split on thresholds one feature at a time and don't care.
`,
  maths: `
**In one breath.** Standardise $z = (x - \\mu)/\\sigma$, min-max $x' = (x - \\min)/(\\max - \\min)$, robust $(x - \\text{median})/\\text{IQR}$; all statistics come from the training fold only.

**Worked examples.**

- Standardise $x = 85$ with training mean 70 and sd 10: $z = 1.5$.
- Min-max $x = 30$ with training min 10 and max 60: $x' = 0.4$. A test value of 70 maps to 1.2: min-max outputs can leave $[0, 1]$ on new data.
- Median-impute $[3, \\text{NaN}, 7, 1, 100]$: the median of the observed values $\\{1, 3, 7, 100\\}$ is 5 (the mean, 27.75, is dragged by the outlier).

**Imputation options, simplest first.**

| Method | Keeps | Cost |
|---|---|---|
| Drop rows | unbiased only if MCAR | loses data |
| Mean / median / mode | marginal centre | shrinks variance, breaks correlations |
| Median + missing flag | lets the model learn MNAR | one extra column |
| k-NN / iterative (MICE-style) | relationships between columns | slower, must be fitted in the pipeline |
| Native handling (trees, boosting) | learns which branch missing goes to | none |

**Which scaler.** StandardScaler for roughly symmetric data; RobustScaler with outliers; MinMax when a bounded range is needed (images, some neural nets); log transform first for heavy right tails (income, amounts).
`,
  practice: `
**Pipeline rule.** \`Pipeline([("impute", SimpleImputer(strategy="median", add_indicator=True)), ("scale", StandardScaler()), ("model", ...)])\`. Fitting imputers and scalers on all the data before splitting leaks test-set statistics into training.

**Models that need scaling:** k-NN, k-means, SVM (RBF especially), PCA, ridge/lasso/elastic net, logistic regression with regularisation, neural networks, gradient-descent-trained anything. **Don't need it:** decision trees, random forests, gradient-boosted trees.

**Production.** Save the fitted imputer and scaler with the model; at serving time, apply the training statistics, never recompute them on live data.
`,
  traps: [
    { trap: "Mean-impute and move on.", why: "If missingness is informative (MNAR), you've erased the signal. Add a missing indicator; for skewed columns use the median." },
    { trap: "Scale the whole dataset, then split.", why: "The test set's mean and variance leak into training. Small effect for scaling, large for imputers and target encoders; build the habit with pipelines." },
    { trap: "Random forests need standardised inputs.", why: "Tree splits are threshold comparisons on one feature; any monotone rescaling gives identical trees." },
  ],
  say: {
    prompt: "Walk me through how you'd handle missing values and scaling for a credit-risk model.",
    secs: 60,
    check: ["Asked why values are missing (MCAR / MAR / MNAR)", "Median imputation plus a missing-indicator flag (or native handling for trees)", "Fit imputers and scalers inside a pipeline on training data only", "Named which models need scaling and which don't", "Log/robust scaling for skewed amounts"],
    followups: [
      { q: "When is dropping rows acceptable?", a: "When few rows are affected and missingness is unrelated to the target (MCAR). Otherwise you bias the sample, e.g. dropping all self-employed applicants." },
      { q: "Why might a tree model do better with missing values left as NaN?", a: "Modern implementations learn which side of each split missing rows should go to, so missingness can act as its own signal without a fill value distorting the distribution." },
      { q: "StandardScaler vs RobustScaler?", a: "StandardScaler uses mean and sd, which outliers distort; RobustScaler uses median and IQR, so a few extreme values don't squash everyone else." },
    ],
    answer: `First I'd find out why values are missing. If income is missing more for riskier applicants, the missingness is a signal, so I'd median-impute and add a "was missing" flag, or leave NaNs for a boosting model that learns where to send them. If it's random given other fields, an iterative imputer using the other columns is better than a constant.

For scaling, it depends on the model: trees don't need it; logistic regression with regularisation, SVMs, k-NN and neural nets do. I'd log-transform heavy-tailed amounts, standardise (or use a robust scaler with outliers), and put every step in a pipeline fitted on the training folds, saving the fitted transformers for serving.`,
    avoid: ["\u201cI'd drop the rows\u201d without checking the missingness mechanism", "Fitting the scaler on train and test together"],
  },
  terms: [["MCAR / MAR / MNAR", "Missing completely at random / at random given observed data / not at random."], ["Missing indicator", "Binary column flagging that a value was imputed."], ["Standardisation", "z = (x − μ)/σ with training-set statistics."]],
  sources: [S.sklPre, S.islr],
});
Q({ id: "cml-ms-1", d: 1, secs: 20, prompt: "Standardise x = 85 using training mean 70 and standard deviation 10.", answer: 1.5, tol: 0.005, explain: "(85 − 70)/10 = 1.5.", py: "answer = (85-70)/10" });
Q({ id: "cml-ms-2", d: 1, secs: 30, prompt: "Min-max scaling with training min 10 and max 60: what does a new value of 70 map to?", answer: 1.2, tol: 0.005, explain: "(70 − 10)/(60 − 10) = 1.2. Outputs can leave [0, 1] on new data.", py: "answer = (70-10)/(60-10)" });
Q({ id: "cml-ms-3", d: 1, secs: 30, prompt: "Median-impute [3, NaN, 7, 1, 100]. What value fills the NaN?", answer: 5, tol: 0.005, explain: "Median of {1, 3, 7, 100} = (3 + 7)/2 = 5.", py: "import numpy as np\nanswer = float(np.nanmedian([3, np.nan, 7, 1, 100]))", packages: ["numpy"] });
Q({ id: "cml-ms-4", d: 1, secs: 30, prompt: "Which model's predictions are unchanged if you multiply one feature by 1,000?", options: ["k-NN", "Ridge regression", "Random forest", "SVM with RBF kernel"], answer: 2, explain: "Tree splits compare one feature to a threshold, so monotone rescaling gives the same partitions. The others use distances or penalties.", py: "answer = 2" });
C("cml-ms-c1", "Scale or not", "Need scaling: k-NN, k-means, SVM, PCA, regularised linear, neural nets. Don't: trees, forests, boosting.");
C("cml-ms-c2", "Informative missingness (MNAR)", "Impute and add a missing-indicator flag, or let a tree model handle NaN natively.");

L("cml-feature-eng", F, "Feature engineering and selection", "Creating features that expose the signal, and choosing which to keep without leaking.", {
  kind: "concept", mins: 20,
  hook: "Your fraud model uses 'transaction amount' and 'average amount over 30 days'. Why does adding their ratio help more than either alone?",
  intuition: `
**The situation.** Most lift in tabular ML comes from features, not from swapping models. A boosted tree can approximate a ratio with many splits; giving it the ratio directly makes the pattern one split away.

**Creating features: encode what a domain expert would look at.**

- **Ratios and differences:** amount / 30-day average, EMI / income, days since last payment.
- **Aggregates over time windows:** count, sum, max over 7 / 30 / 90 days (compute strictly from the past).
- **Date parts:** day of week, month-end, festival flag; cyclic hour as $\\sin$ / $\\cos$.
- **Interactions and polynomials:** $x_1 x_2$, $x^2$, for linear models that can't make them.
- **Binning:** for linear models, to capture non-linearity; for scorecards, for monotone and explainable effects.

**Selecting features: fewer, better.** Too many weak features add variance and cost. Three families: **filter** (score each feature alone: correlation, mutual information, variance), **wrapper** (search subsets with the model: recursive feature elimination), **embedded** (selection happens during training: lasso, tree importances).
`,
  maths: `
**In one breath.** Polynomial features of degree $d$ in $p$ inputs give $\\binom{p + d}{d} - 1$ columns (no bias); selection must run inside each CV fold.

**Counting features.** Degree 2 with $p = 3$ inputs: $\\binom{5}{2} - 1 = 9$ ($x_1, x_2, x_3, x_1^2, x_2^2, x_3^2, x_1x_2, x_1x_3, x_2x_3$). With $p = 100$: 5,150. Feature explosion is why interactions are usually chosen by hand or left to trees.

**Variance filter.** A binary feature that is 1 in 98% of rows has variance $p(1 - p) = 0.0196$: nearly constant, nearly useless.

**Mutual information** $I(X; Y) = \\sum_{x,y} p(x, y)\\log\\frac{p(x, y)}{p(x)p(y)}$ catches non-linear dependence that correlation misses (e.g. $y = x^2$ with symmetric $x$ has correlation 0 but high MI).

**Why selection leaks.** Pick the 20 features most correlated with $y$ on all 1,000 rows, then cross-validate: with 10,000 pure-noise features, the chosen 20 still look predictive because they were chosen using the validation labels. The CV estimate is optimistic; the real model is useless. Selection is part of the model and must be refitted inside each training fold.

**Cyclic encoding.** Hour $h$ → $(\\sin(2\\pi h/24), \\cos(2\\pi h/24))$, so 23:00 and 00:00 are close.
`,
  practice: `
**Workflow.** Baseline with raw features → add domain features one family at a time, measuring CV gain → prune with importance or lasso → re-check with permutation importance on validation data.

**Importance pitfalls.** Impurity-based importance in trees favours high-cardinality and continuous features; prefer permutation importance or SHAP on held-out data. Correlated features split importance between them, so neither looks important alone.

**Time-based features.** Compute aggregates with a cut-off at prediction time ("as of" joins). A 30-day average that includes the day of the default is leakage.
`,
  traps: [
    { trap: "Select the top features on the full dataset, then cross-validate.", why: "Selection used the labels of the validation folds; the CV score is inflated. Put selection in the pipeline so it's refitted per fold." },
    { trap: "Low correlation with the target means the feature is useless.", why: "Correlation only measures linear relationships. Use mutual information or a tree model to find non-linear and interaction effects." },
    { trap: "Feature importance tells you causal effect.", why: "It tells you what the model used. Correlated proxies, leakage and confounding all produce high importance without causation." },
  ],
  say: {
    prompt: "You have a working baseline model on transaction data. How do you improve it with features?",
    secs: 60,
    check: ["Domain features: ratios, time-window aggregates, recency/frequency", "Time-correct computation (no future information)", "Measured gains with cross-validation, one family at a time", "Feature selection inside the CV loop", "Importance via permutation/SHAP, aware of correlated features"],
    followups: [
      { q: "Filter vs wrapper vs embedded selection?", a: "Filter scores features independently of the model (cheap, ignores interactions). Wrapper searches subsets with the model (expensive, can overfit). Embedded selects during training (lasso zeros, tree splits)." },
      { q: "Why use sin and cos for hour of day?", a: "So the encoding is cyclic: 23:00 and 00:00 end up close in feature space. A single integer would put them 23 apart." },
      { q: "How can a great new feature make production worse?", a: "If it's computed differently at serving time (training/serving skew), uses information not available at prediction time, or is unstable over time." },
    ],
    answer: `I'd add features a domain expert would look at: ratios like amount over the customer's 30-day average, counts and sums over 1, 7 and 30 day windows, time since the last transaction, merchant-level rates, and date parts. All windowed features are computed as of the prediction time, so nothing from the future leaks in.

I'd add one family at a time and keep it only if cross-validated performance improves. Then I'd prune with lasso or permutation importance, with selection inside the CV loop so the estimate stays honest, and check that every feature can be computed the same way at serving time.`,
    avoid: ["Adding hundreds of features without validation", "\u201cImportance shows this feature causes fraud\u201d"],
  },
  terms: [["Filter / wrapper / embedded", "Selection by standalone score / by searching subsets with the model / during training."], ["Mutual information", "Dependence measure that also captures non-linear relationships."], ["Permutation importance", "Drop in validation score when a feature's values are shuffled."]],
  sources: [S.sklPre, S.islr],
});
Q({ id: "cml-fe-1", d: 2, secs: 60, prompt: "PolynomialFeatures(degree=2, include_bias=False) on 3 input features. How many output columns?", answer: 9, tol: 0.5, explain: "C(3 + 2, 2) − 1 = 9: three linear, three squares, three pairwise products.", py: "import numpy as np\nfrom sklearn.preprocessing import PolynomialFeatures\nanswer = PolynomialFeatures(2, include_bias=False).fit_transform(np.ones((2,3))).shape[1]", packages: ["scikit-learn"] });
Q({ id: "cml-fe-2", d: 1, secs: 30, prompt: "A binary feature is 1 in 98% of rows. What is its variance? (4 decimals)", answer: 0.0196, tol: 0.0002, explain: "p(1 − p) = 0.98 × 0.02 = 0.0196.", py: "answer = 0.98*0.02" });
Q({ id: "cml-fe-3", d: 2, secs: 60, prompt: "x is uniform on [−1, 1] and y = x². What is the Pearson correlation between x and y?", answer: 0, tol: 0.01, explain: "Cov(x, x²) = E[x³] − E[x]E[x²] = 0 by symmetry. y is a deterministic function of x, so correlation 0 doesn't mean independence.", py: "import numpy as np\nx = np.linspace(-1, 1, 200001)\nanswer = float(np.corrcoef(x, x**2)[0,1])", packages: ["numpy"] });
Q({ id: "cml-fe-4", d: 2, secs: 45, prompt: "You pick the 20 features most correlated with y using all 1,000 rows, then report 5-fold CV accuracy. The CV estimate is…", options: ["unbiased", "optimistic", "pessimistic", "unaffected because CV re-splits the data"], answer: 1, explain: "The selection used the validation folds' labels, so CV no longer measures performance on unseen data.", py: "answer = 1" });
C("cml-fe-c1", "Feature selection and CV", "Selection is part of the model: refit it inside each training fold.");
C("cml-fe-c2", "Cyclic features", "hour → (sin 2πh/24, cos 2πh/24).");

// ───────────────────────── Linear models ─────────────────────────

L("cml-linreg", LM, "Linear regression", "Least squares, what the coefficients mean, R², and the assumptions interviewers ask about.", {
  kind: "concept", mins: 30,
  hook: "Your regression says each extra year of tenure raises spend by ₹1,200. What must be true for that number to mean anything?",
  intuition: `
**The situation.** You predict monthly spend from tenure, income and city. Linear regression is the first model you'll be asked to explain end to end: the fit, the coefficients, the diagnostics, the assumptions.

**The idea.** Find the flat surface $\\hat y = w_0 + w_1x_1 + \\dots + w_px_p$ that minimises the sum of squared vertical distances to the points. Each coefficient is the change in predicted $y$ for a one-unit change in that feature **holding the other features fixed**.

Squared error makes the problem easy (one closed-form answer, a convex bowl) and makes the prediction the conditional mean. It also makes the fit sensitive to outliers: one point 10 units away costs as much as 100 points 1 unit away.

**Play.** Gradient descent on a squared-error bowl: watch the learning rate decide between crawling, converging and diverging.
`,
  widget: "gradient-descent",
  maths: `
**In one breath.** $\\hat w = (X^\\top X)^{-1}X^\\top y$; one feature: slope $= \\text{Cov}(x, y)/\\text{Var}(x)$, intercept $= \\bar y - \\text{slope}\\cdot\\bar x$; $R^2 = 1 - \\text{SSE}/\\text{SST}$.

**Normal equations.** Minimise $\\|y - Xw\\|^2$. Gradient $-2X^\\top(y - Xw) = 0$ gives $X^\\top X w = X^\\top y$. Geometrically, $\\hat y = Xw$ is the projection of $y$ onto the column space of $X$, and the residuals are orthogonal to every column.

**Worked example.** $x = (1, 2, 3, 4)$, $y = (2, 4, 5, 8)$. $\\bar x = 2.5$, $\\bar y = 4.75$. $S_{xy} = 9.5$, $S_{xx} = 5$, slope $= 1.9$, intercept $= 4.75 - 1.9 \\times 2.5 = 0$.

**Goodness of fit.** $R^2 = 1 - \\text{SSE}/\\text{SST}$: share of variance explained (SSE 20, SST 80 → 0.75). Adding any feature never lowers training $R^2$, so use adjusted $R^2 = 1 - (1 - R^2)\\frac{n - 1}{n - p - 1}$ or validation error. With $n = 50$, $p = 4$, $R^2 = 0.75$: adjusted $= 0.728$.

**Assumptions (for inference, not for prediction).**

| Assumption | Violation looks like | Consequence | Fix |
|---|---|---|---|
| Linearity | curved residual plot | biased predictions | transforms, splines, interactions |
| Independent errors | patterns over time | SEs too small | time-series models, clustered SEs |
| Constant variance | funnel-shaped residuals | SEs wrong | log y, weighted LS, robust SEs |
| Normal errors | heavy-tailed QQ plot | small-sample CIs off | usually fine for large n |
| No perfect collinearity | huge, unstable coefficients | uninterpretable weights | drop/combine features, ridge |

**Multicollinearity.** VIF$_j = 1/(1 - R_j^2)$ where $R_j^2$ comes from regressing $x_j$ on the other features. VIF > 5–10 means the coefficient's variance is inflated; predictions can still be fine.
`,
  practice: `
**When to use it.** As a baseline every time; when you need coefficients a regulator or manager can read; when data is small; inside GLMs (Poisson for counts, logistic for binary).

**Practical defaults.** Look at residual-vs-fitted and QQ plots. Log-transform skewed positive targets (then predictions are geometric means; correct if you need the mean). Use ridge by default when features are many or correlated. Report coefficients with confidence intervals, and only interpret them causally with a design that supports it.

**Solvers.** Closed form is $O(np^2 + p^3)$; for very large $n$ or $p$, use gradient descent / SGD or QR/Cholesky decompositions rather than explicitly inverting $X^\\top X$.
`,
  traps: [
    { trap: "The coefficient on tenure is 1,200, so tenure causes ₹1,200 more spend per year.", why: "It's an association holding other included features fixed. Omitted confounders (age, income growth) can drive both. Causal claims need an experiment or a causal design." },
    { trap: "R² went up when I added features, so the model improved.", why: "Training R² can't go down when you add features, even pure noise. Compare adjusted R² or, better, validation error." },
    { trap: "Linear regression requires normally distributed features.", why: "No assumption is made about the distribution of X. The classical assumptions concern the errors, and normality matters only for exact small-sample inference." },
  ],
  say: {
    prompt: "Explain linear regression: how it's fitted, how you read it, and what can go wrong.",
    secs: 60,
    check: ["Minimise squared error; closed form via normal equations or gradient descent", "Coefficient = change in prediction per unit change, others held fixed", "R² and its limits (adjusted R², validation error)", "Assumptions: linearity, independence, constant variance, (normality), no perfect collinearity", "Association vs causation; residual diagnostics"],
    followups: [
      { q: "What does multicollinearity do to the model?", a: "Predictions are mostly fine, but coefficients become unstable with inflated standard errors and can flip sign. Diagnose with VIF; fix with ridge, dropping or combining features." },
      { q: "Why squared error instead of absolute error?", a: "It's differentiable with a closed-form solution, corresponds to Gaussian maximum likelihood and predicts the conditional mean. Absolute error is more robust to outliers and predicts the median." },
      { q: "Your residuals fan out as predictions grow. What do you do?", a: "That's heteroscedasticity. Log-transform the target, use weighted least squares, or keep OLS with heteroscedasticity-robust standard errors for inference." },
    ],
    answer: `Linear regression predicts y as a weighted sum of the features and picks the weights that minimise the sum of squared residuals, either in closed form from the normal equations or with gradient descent. Each coefficient is how much the prediction changes per unit of that feature with the others held fixed.

I'd judge fit with validation error rather than training R², which always rises with more features. For trustworthy coefficients I'd check the residual plots for curvature and fanning, look at independence over time, and check VIFs for collinearity. And I'd be careful about causation: a coefficient is an association conditional on what's in the model.`,
    avoid: ["\u201cThe features must be normally distributed\u201d", "Reading coefficients causally"],
  },
  terms: [["OLS", "Ordinary least squares: minimise the sum of squared residuals."], ["R²", "1 − SSE/SST, share of variance explained."], ["VIF", "1/(1 − R²_j): variance inflation of coefficient j from collinearity."], ["Heteroscedasticity", "Error variance that changes with the inputs."]],
  sources: [S.sklLin, S.islr],
});
Q({ id: "cml-lr-1", d: 2, secs: 90, prompt: "Fit y = a + bx by least squares to x = (1, 2, 3, 4), y = (2, 4, 5, 8). What is b?", answer: 1.9, tol: 0.005, explain: "b = S_xy/S_xx = 9.5/5 = 1.9 (and a = 4.75 − 1.9 × 2.5 = 0).", py: "import numpy as np\nb, a = np.polyfit([1,2,3,4], [2,4,5,8], 1)\nanswer = float(b)", packages: ["numpy"] });
Q({ id: "cml-lr-2", d: 1, secs: 30, prompt: "SSE = 20 and SST = 80. What is R²?", answer: 0.75, tol: 0.005, explain: "1 − 20/80 = 0.75.", py: "answer = 1 - 20/80" });
Q({ id: "cml-lr-3", d: 2, secs: 60, prompt: "R² = 0.75 with n = 50 rows and p = 4 features. Adjusted R²? (3 decimals)", answer: 0.728, tol: 0.002, explain: "1 − (0.25)(49/45) = 0.728.", py: "answer = 1 - (1-0.75)*(50-1)/(50-4-1)" });
Q({ id: "cml-lr-4", d: 2, secs: 45, prompt: "Regressing feature x₃ on the other features gives R² = 0.9. What is x₃'s VIF?", answer: 10, tol: 0.05, explain: "1/(1 − 0.9) = 10: its coefficient's variance is 10× what it would be with uncorrelated features.", py: "answer = 1/(1-0.9)" });
Q({ id: "cml-lr-5", d: 1, secs: 30, prompt: "Residuals spread out more as fitted values grow (a funnel). Which assumption is violated?", options: ["Linearity", "Independence", "Constant error variance", "No multicollinearity"], answer: 2, explain: "A funnel is heteroscedasticity: non-constant error variance.", py: "answer = 2" });
C("cml-lr-c1", "Simple regression slope", "b = Cov(x, y)/Var(x); a = ȳ − b·x̄.");
C("cml-lr-c2", "Adjusted R²", "1 − (1 − R²)(n − 1)/(n − p − 1).");

L("cml-regularised", LM, "Ridge, lasso and elastic net", "Penalised regression: shrinkage, sparsity, and choosing λ.", {
  kind: "concept", mins: 25, prereq: ["cml-linreg", "gen-bv"],
  hook: "You have 400 rows and 300 features. OLS gives absurd coefficients. What do you add, and how strong?",
  intuition: `
**The situation.** With many or correlated features, least squares fits noise: coefficients get huge and swing from sample to sample (high variance).

**The idea.** Add a price for large weights.

- **Ridge (L2)** charges $\\lambda\\sum w_j^2$: every weight shrinks smoothly towards zero, none reaches it. Correlated features share the weight.
- **Lasso (L1)** charges $\\lambda\\sum |w_j|$: small weights are pushed exactly to zero, so it also selects features. Among correlated features it tends to keep one.
- **Elastic net** mixes the two: sparse like lasso, stable like ridge with correlated groups.

Bigger $\\lambda$ means more bias and less variance. You choose it by cross-validation.

**Play.** Slide λ: ridge shrinks all six coefficients proportionally; lasso subtracts and stops at zero.
`,
  widget: "regularization",
  maths: `
**In one breath.** Ridge: $\\hat w = (X^\\top X + \\lambda I)^{-1}X^\\top y$; with an orthonormal design ridge scales, $\\hat w_j/(1 + \\lambda)$, and lasso soft-thresholds, $\\text{sign}(\\hat w_j)\\max(|\\hat w_j| - \\lambda, 0)$.

**Why L1 gives exact zeros.** The L1 penalty's slope is $\\pm\\lambda$ however small $w$ is, so it keeps pushing until $w = 0$ unless the data's pull exceeds $\\lambda$. The L2 penalty's slope $2\\lambda w$ fades to nothing near zero. Geometrically, the L1 ball has corners on the axes; the loss contours usually touch it there.

**Worked example (1-D ridge, no intercept).** $x = (1, 2, 3)$, $y = (1, 3, 2)$, $\\lambda = 1$: $w = \\sum xy/(\\sum x^2 + \\lambda) = 13/15 = 0.867$ (OLS: $13/14 = 0.929$).

**Worked example (soft-thresholding).** OLS coefficients $(2.0, -1.2, 0.3)$, $\\lambda = 0.5$: lasso $\\to (1.5, -0.7, 0)$; ridge $\\to (1.33, -0.8, 0.2)$.

**Bayesian view.** Ridge = MAP with a Gaussian prior on $w$; lasso = MAP with a Laplace prior.

| | Ridge | Lasso | Elastic net |
|---|---|---|---|
| Penalty | $\\lambda\\|w\\|_2^2$ | $\\lambda\\|w\\|_1$ | $\\lambda(\\alpha\\|w\\|_1 + (1 - \\alpha)\\|w\\|_2^2)$ |
| Exact zeros | no | yes | yes |
| Correlated features | shares weight | picks one, unstable | groups |
| $p > n$ | fine | at most $n$ non-zero | fine |
| Closed form | yes | no (coordinate descent) | no |
`,
  practice: `
**Recipe.** Standardise features (penalties are scale-dependent), don't penalise the intercept, search λ on a log grid with \`RidgeCV\` / \`LassoCV\` / \`ElasticNetCV\`, and use the one-standard-error rule if you want a sparser model.

**Note on naming.** scikit-learn calls λ \`alpha\`; in elastic net, \`l1_ratio\` is the mixing weight. In logistic regression, \`C\` = 1/λ (bigger C = weaker penalty).

**In neural networks** the same idea is weight decay (L2), and in boosting it's the L1/L2 penalties on leaf values.
`,
  traps: [
    { trap: "Lasso picked feature A over correlated feature B, so A is the real driver.", why: "With correlated features lasso's choice is close to arbitrary and changes across bootstrap samples. Report stability (selection frequency) or use elastic net." },
    { trap: "Regularise without scaling.", why: "A feature measured in rupees gets a tiny weight and is barely penalised; one measured in lakhs is heavily penalised. Standardise first." },
    { trap: "Ridge can do feature selection if λ is big enough.", why: "Ridge shrinks weights towards zero but never exactly to zero (except in degenerate cases). For selection use lasso or elastic net." },
  ],
  say: {
    prompt: "Compare ridge and lasso. When would you use each?",
    secs: 45,
    check: ["Both add a penalty to squared error; λ trades bias for variance", "Ridge (L2) shrinks smoothly, handles correlated features, no zeros", "Lasso (L1) gives exact zeros = feature selection; unstable with correlated features", "Elastic net for correlated groups / p > n", "Standardise features; choose λ by cross-validation"],
    followups: [
      { q: "Why does lasso produce zeros but ridge doesn't?", a: "L1's gradient has constant magnitude λ, so it pushes small weights all the way to zero (soft-thresholding). L2's gradient 2λw vanishes near zero, so weights only shrink proportionally." },
      { q: "What's the Bayesian interpretation?", a: "Ridge is the MAP estimate under a Gaussian prior on the weights; lasso under a Laplace prior, whose sharp peak at zero puts mass on sparse solutions." },
      { q: "How does λ relate to the bias–variance trade-off?", a: "λ = 0 is OLS (low bias, high variance). Increasing λ shrinks weights, adding bias and cutting variance. Validation error is U-shaped in λ; pick the minimum by CV." },
    ],
    answer: `Both add a penalty on the weights to the squared-error loss, trading a little bias for less variance, with the strength λ chosen by cross-validation on standardised features.

Ridge uses the squared L2 norm: it shrinks all weights smoothly, never to zero, and spreads weight across correlated features, so it's my default for many correlated predictors. Lasso uses the L1 norm, which sets some weights exactly to zero and so selects features; that's useful when I believe only a few matter or need a compact model, but among correlated features its choice is unstable. Elastic net combines them and is the safe choice with correlated groups or more features than rows.`,
    avoid: ["\u201cRidge does feature selection\u201d", "Choosing λ on the test set"],
  },
  terms: [["Shrinkage", "Pulling coefficients towards zero to reduce variance."], ["Soft-thresholding", "sign(w)·max(|w| − λ, 0): lasso's update."], ["Elastic net", "Weighted mix of L1 and L2 penalties."]],
  sources: [S.sklLin, S.islr],
});
Q({ id: "cml-rg-1", d: 2, secs: 60, prompt: "1-D ridge without intercept: x = (1, 2, 3), y = (1, 3, 2), λ = 1. Fitted w? (3 decimals)", answer: 0.867, tol: 0.002, explain: "w = Σxy/(Σx² + λ) = 13/(14 + 1) = 0.867.", py: "import numpy as np\nx = np.array([1,2,3.]); y = np.array([1,3,2.])\nanswer = float(x@y/(x@x+1))", packages: ["numpy"] });
Q({ id: "cml-rg-2", d: 2, secs: 45, prompt: "Orthonormal design, OLS coefficient −1.2, lasso λ = 0.5. Lasso coefficient?", answer: -0.7, tol: 0.005, explain: "sign(−1.2)·max(1.2 − 0.5, 0) = −0.7.", py: "import math\nw, l = -1.2, 0.5\nanswer = math.copysign(max(abs(w)-l, 0), w)" });
Q({ id: "cml-rg-3", d: 2, secs: 45, prompt: "Orthonormal design, OLS coefficients (2.0, −1.2, 0.3, −0.4), lasso λ = 0.5. How many coefficients are exactly zero?", answer: 2, tol: 0.5, explain: "|0.3| and |−0.4| are below 0.5, so both become 0.", py: "answer = sum(abs(w) <= 0.5 for w in [2.0,-1.2,0.3,-0.4])" });
Q({ id: "cml-rg-4", d: 1, secs: 30, prompt: "In scikit-learn's LogisticRegression, increasing C…", options: ["strengthens regularisation", "weakens regularisation", "switches L2 to L1", "has no effect on coefficients"], answer: 1, explain: "C = 1/λ: larger C means a smaller penalty.", py: "answer = 1" });
C("cml-rg-c1", "Ridge closed form", "w = (XᵀX + λI)⁻¹Xᵀy.");
C("cml-rg-c2", "Ridge vs lasso (orthonormal)", "Ridge: ŵ/(1 + λ). Lasso: sign(ŵ)·max(|ŵ| − λ, 0).");

L("cml-logreg", LM, "Logistic regression", "Modelling probabilities with the sigmoid, reading coefficients as odds ratios, and fitting by log loss.", {
  kind: "concept", mins: 30, prereq: ["cml-linreg"],
  hook: "Why not just fit linear regression to a 0/1 default flag and threshold at 0.5?",
  intuition: `
**The situation.** You predict loan default (1) or not (0). Linear regression on 0/1 gives predictions below 0 and above 1, and one extreme applicant can tilt the whole line.

**The idea.** Keep a linear score $z = w^\\top x + b$, but squash it into a probability with the sigmoid $\\sigma(z) = 1/(1 + e^{-z})$. The score is the **log-odds**: $\\log\\frac{p}{1 - p} = z$. So each coefficient adds to the log-odds, and $e^{w_j}$ is the factor by which the odds multiply per unit of $x_j$.

The decision boundary $p = 0.5$ is where $z = 0$: a straight line (hyperplane). Logistic regression is a linear classifier with calibrated-ish probabilities attached, which is why scorecards, risk models and many baselines use it.
`,
  maths: `
**In one breath.** $p = \\sigma(w^\\top x + b)$; minimise log loss $-\\frac1n\\sum[y\\log p + (1 - y)\\log(1 - p)]$; gradient $\\frac1n X^\\top(p - y)$; odds ratio $e^{w_j}$.

**Why log loss.** It's the negative log-likelihood of Bernoulli outcomes, so minimising it is maximum likelihood. It's convex in $w$ (one optimum), and its gradient $X^\\top(p - y)$ stays large when the model is confidently wrong. Squared error on top of a sigmoid is non-convex and its gradient vanishes there.

**Worked examples.**

- $z = -1 + 0.8 \\times 2.5 = 1$, so $p = \\sigma(1) = 0.731$.
- A coefficient of 0.693 means odds multiply by $e^{0.693} = 2$ per unit.
- True label 1 with $p = 0.8$ costs $-\\log 0.8 = 0.223$; with $p = 0.1$ it costs 2.303.

**No closed form.** Fit by Newton's method / IRLS (small $p$), L-BFGS (default), or SGD (huge data). With perfectly separable data the weights diverge to infinity; regularisation keeps them finite.

**Multiclass.** Softmax regression: $p_k = e^{z_k}/\\sum_j e^{z_j}$ with cross-entropy loss; or one-vs-rest binary models.

**Probabilities.** Logistic regression is usually well calibrated on the training distribution. Class rebalancing or heavy regularisation shifts the probabilities; recalibrate if you'll use them as probabilities.
`,
  practice: `
**Use it when** you need a fast, stable baseline; interpretable effects (odds ratios); probabilities for pricing or expected-loss calculations; regulatory scorecards (often with WoE-binned features).

**Practical.** Scale features; tune \`C\` (= 1/λ) by CV; use \`class_weight="balanced"\` or adjust the threshold for imbalance; add interactions or splines for non-linear effects, or move to boosted trees.

**Thresholds.** 0.5 is not special. Pick the threshold from costs or a precision/recall target (see the threshold lesson).
`,
  traps: [
    { trap: "A coefficient of 0.4 means the probability rises by 0.4 per unit.", why: "It adds 0.4 to the log-odds (odds × e^0.4 ≈ 1.49). The change in probability depends on where you start on the sigmoid." },
    { trap: "Logistic regression is a regression model, not a classifier.", why: "It regresses the log-odds, and it's used as a classifier by thresholding p. Both statements are partly right; say which you mean." },
    { trap: "Perfect separation is great news.", why: "Unregularised, the weights blow up and probabilities become 0/1, which usually means leakage or too many features for the data. Check, and regularise." },
  ],
  say: {
    prompt: "Explain logistic regression and how you'd interpret its coefficients.",
    secs: 45,
    check: ["Linear score passed through a sigmoid → probability", "Score = log-odds; coefficient = change in log-odds; e^w = odds ratio", "Trained by maximising likelihood = minimising log loss (convex)", "Linear decision boundary; threshold chosen by costs", "Regularisation (C = 1/λ), scaling"],
    followups: [
      { q: "Why not use MSE as the loss?", a: "With a sigmoid output MSE is non-convex in the weights and its gradient vanishes when predictions are confidently wrong. Log loss is convex and its gradient is simply X^T(p − y)." },
      { q: "What happens with perfectly separable data?", a: "The likelihood keeps improving as weights grow, so they diverge to infinity. Regularisation (or early stopping) gives a finite solution." },
      { q: "Can logistic regression model non-linear boundaries?", a: "Only through features: polynomial terms, interactions, splines or binning. The boundary is linear in whatever features you give it." },
    ],
    answer: `Logistic regression computes a linear score w·x + b and passes it through a sigmoid to get a probability. The score is the log-odds, so each coefficient is the change in log-odds per unit of its feature, and e to the coefficient is an odds ratio: a weight of 0.69 doubles the odds.

It's fitted by maximum likelihood, which means minimising log loss, a convex problem solved with L-BFGS or Newton's method. The decision boundary is linear, and I'd pick the classification threshold from business costs rather than defaulting to 0.5. I'd regularise via C, scale features, and check calibration before using the probabilities directly.`,
    avoid: ["\u201cThe coefficient is the change in probability\u201d", "Using 0.5 as the threshold without thinking"],
  },
  terms: [["Sigmoid", "σ(z) = 1/(1 + e^−z)."], ["Log-odds (logit)", "log(p/(1 − p)), linear in the features."], ["Odds ratio", "e^w: multiplicative change in odds per unit of x."], ["Log loss", "Bernoulli negative log-likelihood."]],
  sources: [S.sklLin, S.islr],
});
Q({ id: "cml-lg-1", d: 1, secs: 45, prompt: "Intercept −1, coefficient 0.8, x = 2.5. Predicted probability? (3 decimals)", answer: 0.731, tol: 0.002, explain: "z = −1 + 2 = 1; σ(1) = 1/(1 + e^−1) = 0.731.", py: "import math\nanswer = 1/(1+math.exp(-(-1+0.8*2.5)))" });
Q({ id: "cml-lg-2", d: 1, secs: 30, prompt: "A coefficient is 0.693. By what factor do the odds multiply per unit increase?", answer: 2, tol: 0.01, explain: "e^0.693 ≈ 2.", py: "import math\nanswer = math.exp(0.693)" });
Q({ id: "cml-lg-3", d: 1, secs: 30, prompt: "True label 1, predicted p = 0.8. Log loss for this example? (3 decimals)", answer: 0.223, tol: 0.002, explain: "−ln 0.8 = 0.223.", py: "import math\nanswer = -math.log(0.8)" });
Q({ id: "cml-lg-4", d: 3, secs: 90, prompt: "At p = 0.2, a coefficient of 0.5 and a one-unit increase in x. New probability? (3 decimals)", answer: 0.292, tol: 0.002, explain: "Odds 0.25 × e^0.5 = 0.412; p = 0.412/1.412 = 0.292. The same coefficient moves p by different amounts at different starting points.", py: "import math\no = 0.2/0.8*math.exp(0.5)\nanswer = o/(1+o)" });
C("cml-lg-c1", "Logistic regression gradient", "∂L/∂w = (1/n)·Xᵀ(p − y).");
C("cml-lg-c2", "Reading a logistic coefficient", "+w to log-odds; odds × e^w.");

// ───────────────────────── Trees and ensembles ─────────────────────────

L("cml-trees", TR, "Decision trees", "Greedy splitting by impurity, overfitting, pruning, and why trees are the building block of the best tabular models.", {
  kind: "concept", mins: 25,
  hook: "A tree splits first on 'days past due > 30'. How did it pick that question, and why would a depth-25 tree be a bad idea?",
  intuition: `
**The situation.** A credit officer's rule of thumb is a decision tree: "Over 30 days past due? Then if utilisation > 80%, high risk…" Trees learn such rules from data.

**The idea.** Start with all rows. Try every feature and every threshold; pick the split that makes the two children **purest** (most one-class, or lowest variance for regression). Repeat in each child until a stopping rule. Predict with the majority class (or mean) of the leaf.

- Trees handle mixed feature types, need no scaling, capture interactions and non-linearities automatically, and are readable when shallow.
- A fully grown tree can isolate every training row: zero training error, high variance. A tiny change in data can change the top split and everything under it.

So single trees are interpretable but weak; averaged or boosted trees are the strongest tabular models.
`,
  maths: `
**In one breath.** Gini $= 1 - \\sum_k p_k^2$, entropy $= -\\sum_k p_k\\log_2 p_k$; choose the split with the largest drop in weighted child impurity; regression uses variance (MSE).

**Worked example.** Parent: 50 good, 50 bad (Gini 0.5). Split into left [40 good, 10 bad] and right [10 good, 40 bad]. Each child: $1 - (0.8^2 + 0.2^2) = 0.32$. Weighted: 0.32. Gain: $0.5 - 0.32 = 0.18$. Entropy of [5, 5] is 1 bit; of [8, 2] is 0.722 bits.

**Greedy.** Finding the optimal tree is NP-hard, so CART picks the best split one level at a time. It can miss splits that only pay off two levels later (XOR patterns).

**Controlling size.** max_depth, min_samples_leaf, min_samples_split, max_leaf_nodes, or cost-complexity pruning: minimise $R(T) + \\alpha|T|$ (error plus $\\alpha$ per leaf), choosing $\\alpha$ by CV.

**Cost.** Training roughly $O(p\\,n\\log n)$; prediction $O(\\text{depth})$.

| Strength | Weakness |
|---|---|
| no scaling, handles mixed types | high variance (unstable) |
| interactions for free | piecewise constant: can't extrapolate |
| interpretable when shallow | axis-aligned splits: diagonal boundaries need many splits |
| fast prediction | biased importance towards many-valued features |
`,
  practice: `
**Use a single tree** for explanation and segmentation (e.g. rules for an ops team), or as a quick look at interactions. **Use ensembles** for accuracy.

**Settings.** Start shallow (depth 3–5) to understand the data; for prediction tune depth and min_samples_leaf by CV. For imbalance use class weights.

**Extrapolation.** A tree trained on incomes up to ₹50 lakh predicts the same for ₹5 crore as for ₹50 lakh. For trending targets (time series with growth), detrend first or use a linear model.
`,
  traps: [
    { trap: "Trees are interpretable, so a depth-20 tree is fine for explaining decisions.", why: "A depth-20 tree has up to a million leaves. Only shallow trees are interpretable; deep ones also overfit." },
    { trap: "Gini and entropy give very different trees.", why: "They almost always choose the same or similar splits; the choice rarely matters. Depth and leaf size matter much more." },
    { trap: "The tree can predict values beyond what it saw.", why: "Leaves predict training means, so predictions are bounded by the training targets: no extrapolation." },
  ],
  say: {
    prompt: "How does a decision tree decide where to split, and how do you stop it overfitting?",
    secs: 45,
    check: ["Greedy search over features and thresholds", "Impurity: Gini / entropy (classification), variance (regression); weighted child impurity", "Fully grown trees overfit (high variance)", "Depth, min samples per leaf, cost-complexity pruning chosen by CV", "Ensembles (forests, boosting) as the real fix"],
    followups: [
      { q: "Why are trees unstable?", a: "Splits are chosen greedily; a small change in data can change the top split, and everything below changes with it. Averaging many trees (bagging) fixes this." },
      { q: "How do trees handle a categorical feature with many levels?", a: "Implementations differ: one-hot (many shallow splits), ordinal codes (arbitrary order), or native category partitioning. High-cardinality features can be overfitted and get inflated impurity importance." },
      { q: "Why can't a tree extrapolate?", a: "Each leaf predicts the mean of its training rows, so predictions never leave the range of the training targets." },
    ],
    answer: `A tree greedily searches every feature and threshold and picks the split that most reduces impurity: Gini or entropy for classification, variance for regression, weighted by child sizes. It repeats in each child until a stopping rule, and predicts the majority class or mean of the leaf.

Grown fully it memorises the training data, so I'd limit depth and minimum samples per leaf, or prune with a cost-complexity penalty, all chosen by cross-validation. In practice single trees are for interpretation; for accuracy I'd use a random forest or gradient boosting, which fix the variance problem.`,
    avoid: ["\u201cTrees never overfit because they're simple\u201d", "Claiming trees extrapolate trends"],
  },
  terms: [["Gini impurity", "1 − Σ p_k²; probability two random draws disagree."], ["Information gain", "Parent impurity minus weighted child impurity."], ["Cost-complexity pruning", "Minimise error + α × number of leaves."]],
  sources: [S.sklTree, S.islr],
});
Q({ id: "cml-dt-1", d: 1, secs: 30, prompt: "Gini impurity of a node with 40 of one class and 10 of the other?", answer: 0.32, tol: 0.002, explain: "1 − (0.8² + 0.2²) = 0.32.", py: "answer = 1 - (0.8**2 + 0.2**2)" });
Q({ id: "cml-dt-2", d: 2, secs: 60, prompt: "Parent [50, 50] splits into [40, 10] and [10, 40]. Gini gain? (2 decimals)", answer: 0.18, tol: 0.002, explain: "Parent 0.5; each child 0.32; weighted 0.32; gain 0.18.", py: "g = lambda a, b: 1 - (a/(a+b))**2 - (b/(a+b))**2\nanswer = g(50,50) - (50*g(40,10) + 50*g(10,40))/100" });
Q({ id: "cml-dt-3", d: 2, secs: 45, prompt: "Entropy (bits) of a node with class split [8, 2]? (3 decimals)", answer: 0.722, tol: 0.002, explain: "−0.8 log₂ 0.8 − 0.2 log₂ 0.2 = 0.258 + 0.464 = 0.722.", py: "import math\nanswer = -(0.8*math.log2(0.8) + 0.2*math.log2(0.2))" });
Q({ id: "cml-dt-4", d: 2, secs: 60, prompt: "A regression tree is trained on y values between 10 and 50. What is the largest prediction it can make?", answer: 50, tol: 0.5, explain: "Leaves predict means of training targets, so predictions lie within [10, 50].", py: "import numpy as np\nfrom sklearn.tree import DecisionTreeRegressor\nX = np.arange(41).reshape(-1,1); y = np.linspace(10, 50, 41)\nm = DecisionTreeRegressor().fit(X, y)\nanswer = float(m.predict([[1000]])[0])", packages: ["scikit-learn"] });
C("cml-dt-c1", "Gini vs entropy", "Gini 1 − Σp²; entropy −Σ p log₂ p. Nearly always the same splits.");
C("cml-dt-c2", "Trees can't extrapolate", "Leaf = mean of training targets, so predictions stay inside the training range.");

L("cml-forests", TR, "Bagging and random forests", "Averaging decorrelated trees to cut variance, out-of-bag error, and feature importance.", {
  kind: "concept", mins: 25, prereq: ["cml-trees", "gen-bv"],
  hook: "A single deep tree scores 0.78 AUC. Five hundred of them averaged score 0.86. Where did the extra 0.08 come from?",
  intuition: `
**The situation.** Deep trees have low bias and high variance: each one is wrong in a different way. That's the perfect ingredient for averaging.

**Bagging** (bootstrap aggregating): train each tree on a bootstrap sample (n rows drawn with replacement) and average their predictions (or vote). Errors that differ across trees cancel; the shared bias stays.

**Random forest** adds one more trick: at each split, consider only a random subset of features (often $\\sqrt p$ for classification). Otherwise every tree would split on the same strong feature first and the trees would be highly correlated, and averaging correlated trees helps much less.

**Free validation.** Each tree leaves out about 37% of rows. Predict each row using only the trees that didn't see it: the **out-of-bag (OOB)** error, an almost-free estimate of test error.
`,
  maths: `
**In one breath.** Variance of the average of $B$ trees with variance $\\sigma^2$ and pairwise correlation $\\rho$: $\\rho\\sigma^2 + \\frac{1 - \\rho}{B}\\sigma^2$; feature subsampling lowers $\\rho$, more trees kill the second term.

**Out-of-bag fraction.** The chance a given row is never drawn in $n$ draws is $(1 - 1/n)^n \\to e^{-1} \\approx 0.368$. With $n = 1000$: 0.3677.

**Worked example.** $\\sigma^2 = 2$, $\\rho = 0.5$, $B = 100$: variance $= 1 + 0.01 = 1.01$. Going to $B = 1000$ only reaches 1.001; lowering $\\rho$ to 0.2 reaches 0.416. Decorrelation beats more trees.

**Hyperparameters that matter.**

| Parameter | Effect | Default |
|---|---|---|
| n_estimators | more = lower variance, never overfits by itself | a few hundred |
| max_features | lower = less correlated trees, more bias | √p (classif.), 1.0 or p/3 (regr.) |
| min_samples_leaf / max_depth | tree size | grow deep; raise leaf size if noisy |
| bootstrap / max_samples | diversity, speed | True |

**Feature importance.** Mean decrease in impurity is fast but biased towards high-cardinality features and computed on training data. Permutation importance on OOB or validation data is more trustworthy; with correlated features, both split credit.
`,
  practice: `
**When to use.** Strong default for tabular data with little tuning; robust to outliers and unscaled features; parallelises trivially. Usually a little behind tuned gradient boosting in accuracy, but more forgiving.

**Limits.** Large memory and slower prediction with many deep trees; can't extrapolate; probabilities are often under-confident near 0 and 1 (calibrate if needed).

**Extra-trees** randomise thresholds too: even less variance, slightly more bias, faster.
`,
  traps: [
    { trap: "Adding more trees will eventually overfit.", why: "More trees only reduce the variance term; the forest's error levels off. Overfitting comes from the individual trees (depth, leaf size), not their number." },
    { trap: "Bagging reduces bias.", why: "Averaging keeps the bias of a single tree; it attacks variance. That's why bagging uses deep, low-bias trees." },
    { trap: "Impurity-based importance ranks the true drivers.", why: "It favours features with many split points and is computed on training data. Use permutation importance on held-out data, and watch for correlated features sharing credit." },
  ],
  say: {
    prompt: "Explain how a random forest works and why it beats a single tree.",
    secs: 45,
    check: ["Bootstrap samples + many deep trees, averaged / voted", "Random feature subset at each split decorrelates trees", "Reduces variance, not bias; ρσ² + (1 − ρ)σ²/B", "OOB error as built-in validation", "Key hyperparameters: max_features, leaf size; more trees don't overfit"],
    followups: [
      { q: "Random forest vs gradient boosting?", a: "Forests train deep trees independently and average them to cut variance; boosting trains shallow trees sequentially to cut bias. Boosting is usually more accurate when tuned; forests are more robust with defaults and parallelise easily." },
      { q: "What is out-of-bag error?", a: "Each row is predicted only by the trees whose bootstrap sample excluded it (~37% of trees), giving a validation estimate without a separate hold-out." },
      { q: "Why √p features per split?", a: "It's a default that balances decorrelation (fewer candidate features) against tree quality; tune max_features by CV." },
    ],
    answer: `A random forest trains many deep decision trees, each on a bootstrap sample of the rows, and at every split each tree considers only a random subset of features. Predictions are averaged for regression or voted for classification.

Deep trees have low bias but high variance; averaging them cancels much of the variance. The feature subsampling matters because the averaged variance is ρσ² plus (1 − ρ)σ²/B: more trees remove the second term, but only decorrelating the trees reduces the first. A bonus is the out-of-bag error, which validates the model for free. More trees never cause overfitting; tree depth and leaf size are what to tune.`,
    avoid: ["\u201cMore trees cause overfitting\u201d", "\u201cBagging reduces bias\u201d"],
  },
  terms: [["Bootstrap sample", "n rows drawn with replacement from n."], ["Out-of-bag (OOB)", "Rows not in a tree's bootstrap sample, used to validate it."], ["max_features", "Number of features considered at each split."]],
  sources: [S.sklEns, S.islr],
});
Q({ id: "cml-rf-1", d: 2, secs: 60, prompt: "With n = 1,000 rows, what fraction of rows is left out of a given bootstrap sample, in expectation? (4 decimals)", answer: 0.3677, tol: 0.0005, explain: "(1 − 1/1000)^1000 ≈ 0.3677 → e^−1 as n grows.", py: "answer = (1-1/1000)**1000" });
Q({ id: "cml-rf-2", d: 2, secs: 60, prompt: "Each tree has variance 2, pairwise correlation 0.5, and you average 100 trees. Variance of the forest?", answer: 1.01, tol: 0.002, explain: "ρσ² + (1 − ρ)σ²/B = 1 + 0.01 = 1.01.", py: "answer = 0.5*2 + (1-0.5)*2/100" });
Q({ id: "cml-rf-3", d: 1, secs: 30, prompt: "Random forest classifier with 64 features and max_features='sqrt'. How many features are considered at each split?", answer: 8, tol: 0.5, explain: "√64 = 8.", py: "answer = int(64**0.5)" });
Q({ id: "cml-rf-4", d: 2, secs: 45, prompt: "In the averaging formula, which change reduces forest variance more: B from 100 to 1,000 (ρ = 0.5, σ² = 2), or ρ from 0.5 to 0.2 (B = 100)?", options: ["More trees", "Lower correlation", "Same effect"], answer: 1, explain: "More trees: 1.01 → 1.001. Lower ρ: 1.01 → 0.4 + 0.016 = 0.416.", py: "v = lambda r, B: r*2 + (1-r)*2/B\nanswer = 0 if v(0.5,1000) < v(0.2,100) else 1" });
C("cml-rf-c1", "Why random feature subsets", "They decorrelate trees, shrinking the ρσ² term that more trees can't touch.");
C("cml-rf-c2", "OOB fraction", "(1 − 1/n)^n → 1/e ≈ 0.368 of rows per tree.");

L("cml-boosting", TR, "Gradient boosting", "Sequentially fitting trees to residuals: learning rate, depth, early stopping, and XGBoost/LightGBM in interviews.", {
  kind: "concept", mins: 35, prereq: ["cml-trees", "cml-forests"],
  hook: "Boosting adds a small tree that fixes the current model's mistakes, hundreds of times. Why does shrinking each tree's contribution make the final model better?",
  intuition: `
**The situation.** Gradient-boosted trees (XGBoost, LightGBM, CatBoost, scikit-learn's HistGradientBoosting) win most tabular competitions and run most production credit and fraud models.

**The idea.** Start with a constant prediction (the mean, or the log-odds of the base rate). Then repeat:

1. Compute what the model gets wrong: the residuals $y - \\hat y$ (for squared error).
2. Fit a small tree to those residuals.
3. Add a fraction $\\eta$ (the learning rate) of that tree to the model.

Each tree is weak (shallow, high bias). Adding many of them step by step reduces bias. Taking small steps ($\\eta$ = 0.05–0.1) means no single tree commits the model to a direction, which generalises better, at the price of needing more trees. Because later trees keep chasing what's left, too many rounds eventually fit noise, so you stop early using a validation set.
`,
  maths: `
**In one breath.** $F_m(x) = F_{m-1}(x) + \\eta\\,h_m(x)$, where $h_m$ fits the negative gradient of the loss at $F_{m-1}$: residuals $y - F$ for squared error, $y - p$ for log loss.

**Gradient descent in function space.** For any differentiable loss $L(y, F)$, the pseudo-residual is $r_i = -\\partial L/\\partial F(x_i)$. Fitting a tree to $r$ and stepping along it is one gradient-descent step, taken in the space of functions. XGBoost and LightGBM use second-order (Newton) steps: leaf value $= -\\sum g_i / (\\sum h_i + \\lambda)$ with gradients $g$ and Hessians $h$.

**Worked example.** Start at $\\hat y = 10$ for a row with $y = 14$, $\\eta = 0.1$. If each tree fitted the residual exactly, the residual would shrink by a factor $(1 - \\eta)$ per round: $4 \\to 3.6 \\to 3.24 \\dots$, and after 10 rounds $4 \\times 0.9^{10} = 1.39$. Small $\\eta$ = slow, careful progress.

**Regularisation knobs.**

| Knob | Lower variance by | Typical |
|---|---|---|
| learning_rate η | smaller (with more trees) | 0.01–0.1 |
| n_estimators | early stopping on validation | hundreds–thousands |
| max_depth / num_leaves | shallower trees | depth 3–8 / 15–255 leaves |
| min_child_samples / min_child_weight | larger leaves | 20+ |
| subsample, colsample | row/feature subsampling | 0.5–0.9 |
| L1/L2 on leaf values | shrink leaf outputs | λ = 1 |

**Bagging vs boosting.** Bagging: independent deep trees, averaged → variance down. Boosting: sequential shallow trees, added → bias down (and variance controlled by η, subsampling, early stopping).
`,
  practice: `
**Tuning order that works.** Fix η = 0.05–0.1, use early stopping to set the number of trees, tune tree size (depth / leaves, min_child), then subsampling, then lower η and raise trees for the final model.

**Library notes.** LightGBM grows leaf-wise (best leaf first; faster, can overfit small data: limit num_leaves). XGBoost grows level-wise by default. CatBoost uses ordered target statistics for categoricals and symmetric trees. All handle missing values natively.

**Monotonic constraints** (e.g. risk must not fall as days past due rises) are supported and often required for credit models.

**Explaining.** SHAP values (TreeSHAP) give per-prediction attributions that add up to the prediction.
`,
  traps: [
    { trap: "Boosting can't overfit because each tree is weak.", why: "With enough rounds it fits noise; validation error rises after a point. Use early stopping, a small learning rate and subsampling." },
    { trap: "A higher learning rate just trains faster.", why: "It also takes bigger, greedier steps that generalise worse. The best models usually use a small η with more trees." },
    { trap: "Use deep trees, like in random forests.", why: "Boosting relies on weak learners to add bias reduction gradually; deep trees make each step overfit. Depth 3–8 is typical." },
  ],
  say: {
    prompt: "Explain gradient boosting and how you'd tune it.",
    secs: 60,
    check: ["Start from a constant; add trees fitted to residuals / negative gradients", "Learning rate shrinks each tree's contribution", "Shallow trees reduce bias step by step (vs bagging reduces variance)", "Overfits with too many rounds → early stopping on validation", "Tuning: η + n_estimators, depth/leaves, min_child, subsampling, L1/L2"],
    followups: [
      { q: "Why is it called gradient boosting?", a: "Each tree fits the negative gradient of the loss with respect to the current predictions, so adding it is a gradient-descent step in function space. For squared error the negative gradient is just the residual." },
      { q: "XGBoost vs LightGBM?", a: "Both are second-order gradient boosting with regularisation and native missing handling. LightGBM uses histogram binning and leaf-wise growth (faster, needs num_leaves limits); XGBoost defaults to level-wise growth and has strong regularisation defaults." },
      { q: "What's the pseudo-residual for log loss?", a: "y − p, where p is the current predicted probability: the same form as the logistic regression gradient." },
    ],
    answer: `Gradient boosting builds an additive model of small trees. It starts from a constant, computes the negative gradient of the loss at the current predictions (the residuals for squared error, y minus p for log loss), fits a shallow tree to it, and adds that tree scaled by a learning rate. Repeating this hundreds of times steadily reduces bias.

Unlike a random forest, the trees are sequential and weak, and it will overfit if it runs too long, so I use early stopping on a validation set. I tune with a moderate learning rate first, then tree size and minimum leaf size, then row and column subsampling and L2 on leaf values, and finish with a lower learning rate and more trees. XGBoost and LightGBM add second-order steps, histogram splits and native missing-value handling.`,
    avoid: ["\u201cBoosting doesn't overfit\u201d", "Confusing boosting with bagging"],
  },
  terms: [["Pseudo-residual", "Negative gradient of the loss w.r.t. the current prediction."], ["Learning rate (shrinkage)", "Fraction of each new tree added to the model."], ["Early stopping", "Stop adding trees when validation loss stops improving."], ["Leaf-wise growth", "Split the leaf with the largest gain next (LightGBM)."]],
  sources: [S.sklEns, S.xgb],
});
Q({ id: "cml-gb-1", d: 1, secs: 30, prompt: "Squared loss. Current prediction 10, target 14, learning rate 0.1, and the new tree predicts the residual exactly. New prediction?", answer: 10.4, tol: 0.005, explain: "10 + 0.1 × (14 − 10) = 10.4.", py: "answer = 10 + 0.1*(14-10)" });
Q({ id: "cml-gb-2", d: 2, secs: 60, prompt: "Same setup: every round's tree fits the remaining residual exactly, η = 0.1, starting residual 4. Residual after 10 rounds? (3 decimals)", answer: 1.395, tol: 0.002, explain: "Each round leaves (1 − η) of the residual: 4 × 0.9¹⁰ = 1.395.", py: "r = 4.0\nfor _ in range(10):\n    r -= 0.1*r\nanswer = r" });
Q({ id: "cml-gb-3", d: 2, secs: 45, prompt: "Binary log loss, true label 1, current predicted probability 0.3. Pseudo-residual (negative gradient w.r.t. the log-odds)?", answer: 0.7, tol: 0.005, explain: "y − p = 1 − 0.3 = 0.7.", py: "import math\nF = math.log(0.3/0.7)\np = 1/(1+math.exp(-F))\nanswer = 1 - p" });
Q({ id: "cml-gb-4", d: 1, secs: 30, prompt: "You halve the learning rate. To reach similar training loss you typically need…", options: ["about half as many trees", "about the same number", "about twice as many trees", "deeper trees only"], answer: 2, explain: "Each tree contributes half as much, so roughly twice as many rounds; usually with slightly better validation performance.", py: "answer = 2" });
Q({ id: "cml-gb-5", d: 3, secs: 90, prompt: "XGBoost-style leaf value: gradients in a leaf sum to −12, Hessians sum to 5, L2 penalty λ = 1. Leaf weight?", answer: 2, tol: 0.005, explain: "w = −Σg/(Σh + λ) = 12/6 = 2.", py: "answer = -(-12)/(5+1)" });
C("cml-gb-c1", "Boosting update", "F_m = F_{m−1} + η·h_m, h_m fitted to −∂L/∂F.");
C("cml-gb-c2", "Bagging vs boosting", "Bagging: parallel deep trees, cuts variance. Boosting: sequential shallow trees, cuts bias.");
C("cml-gb-c3", "Second-order leaf value", "w = −Σg/(Σh + λ).");
