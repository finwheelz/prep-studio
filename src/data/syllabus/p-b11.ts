/**
 * Batch 11: P1 scikit-learn (7 concepts, joining the pilot's pipelines page), PyTorch (4) and Keras (1).
 * Each page has notes with worked examples, 3–5 resources (videos first), 3 interview questions,
 * 2 cards and 3 checked items.
 * - scikit-learn items are "trace" questions: the check runs the snippet with scikit-learn 1.4 in Pyodide.
 * - PyTorch and Keras can't run in Pyodide, so their items show the PyTorch/Keras code and the check
 *   recomputes the answer with numpy or arithmetic. Every one of those answers was also run once with
 *   real PyTorch 2.x when the batch was written.
 * Coding problems are in problems-p1-sklearn.ts and problems-p1-torch.ts.
 */
import type { InterviewQ, Resource } from "@/lib/types";
import { Card_, Item, R, T } from "./build";

const iq = (q: string, answer: string, rubric: string[]): InterviewQ => ({ q, answer, rubric });
const yt = (id: string, title: string, who: string) => R(`Video: ${title} (${who})`, `https://www.youtube.com/watch?v=${id}`);
const SK = (path: string, label: string) => R(`scikit-learn docs: ${label}`, `https://scikit-learn.org/stable/${path}`);
const PT = (path: string, label: string) => R(`PyTorch docs: ${label}`, `https://pytorch.org/${path}`);
const KE = (path: string, label: string) => R(`Keras docs: ${label}`, `https://keras.io/${path}`);

const SK_SRC = "Practice: trace the code; output checked by running it with scikit-learn 1.4 in Pyodide (Nov 2026)";
const CALC_SRC = "Practice: answer recomputed in Python by CI (Nov 2026)";
const PT_SRC = "Practice: output checked with PyTorch 2.x; CI recomputes it in numpy (Nov 2026)";
const KE_SRC = "Practice: Keras arithmetic; CI recomputes it in Python (Nov 2026)";

const SK_HEAD = "import numpy as np\n";
function trace(id: string, topic: string, d: 1 | 2 | 3, secs: number, code: string, answer: number, explain: string, fast: string, trap: string) {
  const full = SK_HEAD + code;
  Item({
    id, topic, d, secs, prompt: `What does this code print?\n\n\`\`\`\n${full}\n\`\`\``, answer, tol: 0, explain, fast, trap, src: SK_SRC,
    check: {
      py: `import io, contextlib, warnings\n_buf = io.StringIO()\nwith warnings.catch_warnings():\n    warnings.simplefilter("ignore")\n    with contextlib.redirect_stdout(_buf):\n        exec(${JSON.stringify(full)}, {"__name__": "__main__"})\nanswer = float(_buf.getvalue().strip())`,
      packages: ["scikit-learn"],
    },
  });
}
/** A question whose answer CI recomputes with `py` (which must set `answer`). */
function calc(id: string, topic: string, d: 1 | 2 | 3, secs: number, prompt: string, answer: number, tol: number, py: string, explain: string, fast: string, trap: string, src = CALC_SRC) {
  Item({ id, topic, d, secs, prompt, answer, tol, explain, fast, trap, src, check: { py, packages: ["numpy"] } });
}
/** PyTorch code shown to the student; `py` recomputes the printed value without PyTorch. */
function torchq(id: string, topic: string, d: 1 | 2 | 3, secs: number, code: string, answer: number, tol: number, py: string, explain: string, fast: string, trap: string) {
  calc(id, topic, d, secs, `What does this PyTorch code print?\n\n\`\`\`\nimport torch\nimport torch.nn as nn\n${code}\n\`\`\``, answer, tol, py, explain, fast, trap, PT_SRC);
}

const skTopic = (id: string, title: string, summary: string, notes: string, resources: Resource[], category: string, interview: InterviewQ[]) =>
  T(id, "foundations", "scikit-learn", title, summary, notes, { resources, categories: [category], interview });
const ptTopic = (id: string, title: string, summary: string, notes: string, resources: Resource[], category: string, interview: InterviewQ[]) =>
  T(id, "foundations", "PyTorch", title, summary, notes, { resources, categories: [category], interview });

// ───────────────────────── scikit-learn ─────────────────────────
skTopic("sk-api", "The estimator API: fit, predict, transform", "How every scikit-learn object works, how to split data, and why fitted state lives in attributes ending in an underscore.", `
**One interface for everything.** Every scikit-learn object is an **estimator** with the same few methods, so you can swap a model or a preprocessing step without rewriting code.

- \`fit(X, y)\` learns from data and **returns self**, so \`model.fit(X, y).predict(X_new)\` works.
- \`predict(X)\` gives labels or values; classifiers also have \`predict_proba(X)\` and often \`decision_function(X)\`.
- \`transform(X)\` (scalers, encoders, PCA) applies what was learned; \`fit_transform\` does both on the same data.
- \`score(X, y)\` gives accuracy for classifiers and R² for regressors.

**Data shapes.** X is 2-D, shape (n_samples, n_features), even with one feature: use \`x.reshape(-1, 1)\` or \`df[["col"]]\` (double brackets). y is 1-D.

**Hyperparameters vs learned attributes.**
- Hyperparameters go in the constructor (\`LogisticRegression(C=0.5)\`) and are only stored there; \`get_params()\` / \`set_params()\` read and change them.
- What fit learns is stored in attributes ending in **_**: \`coef_\`, \`intercept_\`, \`classes_\`, \`mean_\`, \`n_features_in_\`. If an attribute with an underscore doesn't exist yet, the model hasn't been fitted (\`NotFittedError\`).
- \`clone(model)\` copies the hyperparameters and none of the learned state. Cross-validation and grid search clone your estimator for every fold.

**Splitting.** \`train_test_split(X, y, test_size=0.2, random_state=0, stratify=y)\`.
- \`random_state\` makes the shuffle reproducible.
- \`stratify=y\` keeps the class proportions the same in both parts, which matters with rare classes.
- When test_size is a fraction, the test size is rounded **up**: 25% of 10 rows is 3 rows.
- Time-ordered or grouped data needs a different split (see the cross-validation page).

**Reproducibility.** Anything random (shuffles, forests, k-means starts) takes \`random_state\`. Set it when you need the same result twice, and check that the conclusion doesn't depend on one lucky seed.

**Worked example 1: the contract.** \`sc = StandardScaler().fit([[1.], [3.]])\` learns mean_ = [2] and scale_ = [1]. \`sc.transform([[5.]])\` = (5 − 2) / 1 = 3. Nothing about the test row changes the scaler.

**Worked example 2: rounding.** \`train_test_split(range(10), test_size=0.25)\` gives 7 training and 3 test rows (2.5 rounded up).

**Worked example 3: clone.** \`m = LogisticRegression(C=5).fit(X, y)\`; \`c = clone(m)\` has C = 5 but no coef_: it's a fresh, unfitted copy.

**Worked example 4: a stratified split.** With 80 negatives and 20 positives and test_size = 0.25, stratify=y guarantees exactly 5 positives in the 25 test rows. Without it the count depends on the seed.
`, [yt("hd1W4CyPX58", "Getting started in scikit-learn with the famous iris dataset", "Data School"), yt("RlQuVL6-qe8", "Training a machine learning model with scikit-learn", "Data School"), yt("0B5eIE_1vpU", "Scikit-learn Crash Course", "freeCodeCamp"), SK("getting_started.html", "Getting started"), SK("developers/develop.html", "Developing estimators (the API contract)")], "sk/api", [
  iq("What's the difference between fit, transform, fit_transform and predict?", "fit learns parameters from data and stores them in attributes ending in _ (it returns self). transform applies those stored parameters to any data. fit_transform does both on the same data and is for the training set only. predict uses a fitted model to output labels or values. The test set must only ever be transformed or predicted, never fitted, or its statistics leak into the model.", ["fit learns, stores _ attributes", "transform applies stored parameters", "fit_transform on train only", "Test data never fitted"]),
  iq("Why does scikit-learn have clone, and when does it matter?", "fit mutates the estimator in place. clone builds a new, unfitted estimator with the same hyperparameters. cross_val_score and GridSearchCV clone for every fold and every candidate so no fold sees another's fitted state. In your own code, clone before reusing a model across datasets or comparisons, otherwise results depend on the order of earlier fits.", ["fit mutates in place", "clone = same hyperparameters, no state", "Used by CV and grid search"]),
  iq("When should you stratify a split, and when is a random split wrong altogether?", "Stratify on the label for classification, especially with imbalance, so the test set's class mix matches the data and the score is less noisy. A random split is wrong when rows aren't independent: time-ordered data (train on the past, test on the future), and grouped data like several rows per user or patient (keep each group on one side with GroupKFold or GroupShuffleSplit).", ["Stratify for classification / imbalance", "Time → split by time", "Groups → group split"]),
]);
trace("sk-api-t1", "sk-api", 1, 45, "from sklearn.preprocessing import StandardScaler\nsc = StandardScaler().fit([[1.], [3.]])\nprint(sc.transform([[5.]])[0, 0])", 3,
  "fit learns mean 2 and standard deviation 1 (population formula: values are 1 below and 1 above the mean). (5 − 2) / 1 = 3.", "transform uses the training mean and scale only.", "Refitting on the new value (giving 0), or using the sample standard deviation √2.");
trace("sk-api-t2", "sk-api", 1, 30, "from sklearn.model_selection import train_test_split\ntr, te = train_test_split(list(range(10)), test_size=0.25, random_state=0)\nprint(len(te))", 3,
  "A fractional test_size is rounded up: ceil(0.25 × 10) = 3. Training gets the other 7.", "Test size = ceil(fraction × n).", "Rounding down to 2.");
trace("sk-api-t3", "sk-api", 2, 45, "from sklearn.base import clone\nfrom sklearn.linear_model import LogisticRegression\nm = LogisticRegression(C=5).fit([[0], [1], [2], [3]], [0, 0, 1, 1])\nc = clone(m)\nprint(c.C + hasattr(c, \"coef_\"))", 5,
  "clone copies the hyperparameter C = 5 but none of the fitted attributes, so hasattr(c, 'coef_') is False (0). 5 + 0 = 5.", "clone = same settings, unfitted.", "Thinking clone copies the fitted coefficients too (answer 6).");
Card_("sk-api-c1", "Attributes ending in _ (coef_, mean_, classes_)", "Learned by fit. If they don't exist yet, the estimator isn't fitted.", "sk-api");
Card_("sk-api-c2", "clone(model)", "A new, unfitted estimator with the same hyperparameters; CV and grid search use it for every fold.", "sk-api");

skTopic("sk-preprocess", "Preprocessing: scaling, encoding and imputing", "Which transformer to use for which column, what each one learns, and how they behave on data they haven't seen.", `
**Why preprocess.** Models see numbers only. Distance- and gradient-based models (k-NN, SVM, linear models with a penalty, neural nets, k-means, PCA) also care about **scale**; trees don't.

**Scalers** (each learns its statistics in fit):
- \`StandardScaler\`: (x − mean) / std. The default choice.
- \`MinMaxScaler\`: (x − min) / (max − min) into [0, 1] for the training data. New data can fall outside [0, 1]; it isn't clipped unless you pass clip=True.
- \`RobustScaler\`: (x − median) / IQR; outliers don't distort it.

**Categorical encoders.**
- \`OneHotEncoder\`: one 0/1 column per category, in **sorted** order. Use \`handle_unknown="ignore"\` so an unseen category becomes all zeros instead of an error; \`min_frequency\` groups rare categories; \`drop="first"\` avoids perfectly collinear columns for unregularised linear regression.
- \`OrdinalEncoder\`: one integer per category. The default order is alphabetical (L, M, S, XL), so pass \`categories=[["S", "M", "L", "XL"]]\` when there is a real order. Unknowns: \`handle_unknown="use_encoded_value", unknown_value=-1\`.
- Ordinal codes suit trees; one-hot suits linear models, which would otherwise read the codes as distances.

**Missing values.**
- \`SimpleImputer(strategy="mean" | "median" | "most_frequent" | "constant")\` learns the fill value per column on the training data.
- \`add_indicator=True\` adds a column saying "this was missing", which is often predictive by itself.
- \`HistGradientBoosting\` models accept NaN directly.

**Putting it together.** \`ColumnTransformer([("num", num_pipe, num_cols), ("cat", cat_pipe, cat_cols)])\` routes columns to their own pipelines; \`remainder="drop"\` (the default) drops the rest, such as IDs. Put the whole thing inside a Pipeline with the model; the Pipelines and leakage page explains why.

**Worked example 1.** \`OneHotEncoder(handle_unknown="ignore")\` fitted on a, b, c encodes d as [0, 0, 0] and a as [1, 0, 0].

**Worked example 2.** \`SimpleImputer(strategy="median")\` on 1, NaN, 9, 4 learns the median of 1, 4, 9 = 4 and fills any NaN with 4, including in the test set.

**Worked example 3.** \`MinMaxScaler\` fitted on 0 and 10 maps 15 to 1.5: values outside the training range land outside [0, 1].

**Worked example 4.** Sizes S, M, L, XL with the default OrdinalEncoder become L = 0, M = 1, S = 2, XL = 3. With categories=[["S", "M", "L", "XL"]] they become 0, 1, 2, 3, matching the real order.
`, [yt("irHhDMbw3xo", "How do I encode categorical features using scikit-learn?", "Data School"), SK("modules/preprocessing.html", "Preprocessing data"), SK("modules/impute.html", "Imputation of missing values")], "sk/preprocess", [
  iq("One-hot or ordinal encoding: how do you choose?", "It depends on the model and on whether the categories are ordered. Linear models and neural nets read numbers as magnitudes, so unordered categories need one-hot; truly ordered ones (sizes, ratings) can be ordinal with an explicit order. Trees can split ordinal codes anywhere, so ordinal encoding often works fine for them and keeps the width small. For very high cardinality, consider grouping rare categories, target encoding (with cross-fitting), or embeddings.", ["Linear models: one-hot for unordered", "Ordinal with an explicit order", "Trees cope with ordinal", "High cardinality options"]),
  iq("Which models need feature scaling, and which don't?", "Anything based on distances or dot products, or trained by gradient descent with a penalty: k-NN, SVM, k-means, PCA, regularised linear and logistic regression, neural nets. Without scaling, the feature with the biggest units dominates the distance or the penalty. Tree models (decision trees, random forests, gradient boosting) split on thresholds of one feature at a time, so monotone rescaling doesn't change them.", ["Distance/penalty/gradient models need it", "Biggest units dominate otherwise", "Trees are scale-invariant"]),
  iq("A category appears in production that wasn't in training. What happens and what should happen?", "With OneHotEncoder's default handle_unknown='error', transform raises and the prediction service fails. Set handle_unknown='ignore' so it becomes all zeros (the model treats it as none of the known categories), or 'infrequent_if_exist' together with min_frequency to map it to the infrequent bucket. Monitor how often this happens; a rising rate means the data has drifted and the model needs retraining.", ["Default raises an error", "ignore → all zeros / infrequent bucket", "Monitor for drift"]),
]);
trace("sk-pre-t1", "sk-preprocess", 1, 45, "from sklearn.preprocessing import OneHotEncoder\nenc = OneHotEncoder(handle_unknown=\"ignore\", sparse_output=False).fit([[\"a\"], [\"b\"], [\"c\"]])\nprint(enc.transform([[\"d\"], [\"a\"]]).sum())", 1,
  "d is unknown, so its row is [0, 0, 0]; a is [1, 0, 0]. The total is 1.", "Unknown category → all-zero row.", "Expecting an error, or a fourth column for d.");
trace("sk-pre-t2", "sk-preprocess", 1, 45, "from sklearn.impute import SimpleImputer\nimp = SimpleImputer(strategy=\"median\").fit([[1.], [np.nan], [9.], [4.]])\nprint(imp.transform([[np.nan]])[0, 0])", 4,
  "The median ignores the missing value: median(1, 4, 9) = 4, and that's what fills any NaN later.", "Fill value is learned from the non-missing training values.", "Using the mean (4.67) or counting NaN as a value.");
trace("sk-pre-t3", "sk-preprocess", 1, 30, "from sklearn.preprocessing import MinMaxScaler\nsc = MinMaxScaler().fit([[0.], [10.]])\nprint(sc.transform([[15.]])[0, 0])", 1.5,
  "(15 − 0) / (10 − 0) = 1.5. MinMaxScaler doesn't clip new data to [0, 1] unless clip=True.", "Scaled with the training min and max; no clipping.", "Assuming the output is always within [0, 1].");
Card_("sk-pre-c1", "OneHotEncoder for production", "handle_unknown='ignore' (unseen → all zeros); categories are sorted; sparse_output=False for an array.", "sk-preprocess");
Card_("sk-pre-c2", "OrdinalEncoder's default order", "Alphabetical. Pass categories=[[...]] to give the real order.", "sk-preprocess");

skTopic("sk-linear", "Linear models in scikit-learn", "LinearRegression, Ridge, Lasso and LogisticRegression: what the penalty does, how alpha and C differ, and how to read predict_proba.", `
**The models.**
- \`LinearRegression\`: least squares, no penalty.
- \`Ridge(alpha)\`: adds α‖w‖². Shrinks every coefficient towards 0, never exactly to 0; stable with correlated features.
- \`Lasso(alpha)\`: adds α‖w‖₁. Sets some coefficients exactly to 0, so it also selects features.
- \`ElasticNet(alpha, l1_ratio)\`: a mix of the two.
- \`LogisticRegression(C)\`: a linear model of the log-odds, with an L2 penalty by default.

**alpha vs C.** For Ridge and Lasso, **bigger alpha = stronger penalty**. For LogisticRegression and SVC, **C is the inverse**: bigger C = weaker penalty. The default C = 1 already regularises, which is why sklearn's logistic coefficients differ from statsmodels' unpenalised ones.

**Scale before penalising.** The penalty treats all coefficients alike, but a feature measured in tiny units needs a huge coefficient. Without standardising, the penalty is unfair to it: Lasso can drop an important feature just because of its units. The intercept is never penalised; sklearn centres X and y first.

**Closed form.** On centred data, Ridge's coefficients are w = (XᵀX + αI)⁻¹ Xᵀy. With one feature: w = Σxy / (Σx² + α).

**Reading a logistic model.**
- \`predict_proba(X)\` returns one column per class, in the order of \`model.classes_\`, which is **sorted**. Column 1 is the positive class only for 0/1 labels.
- \`coef_\`: a one-unit increase in feature j multiplies the odds by exp(coef_j), holding the others fixed (on the scale the model saw, so after standardising it's per standard deviation).
- \`predict\` uses a 0.5 probability threshold; choose your own threshold from predict_proba when costs differ (see the metrics page).

**Worked example 1.** x = 1, 2, 3 and y = 2, 4, 6. Centred: x = −1, 0, 1 and y = −2, 0, 2, so Σxy = 4 and Σx² = 2. OLS gives 4/2 = 2. Ridge with α = 2 gives 4/(2 + 2) = 1.

**Worked example 2.** Labels "ham" and "spam": classes_ = ["ham", "spam"], so P(spam) is predict_proba(X)[:, 1]. With labels "yes" and "no", classes_ = ["no", "yes"] and P(no) is column 0.

**Worked example 3.** Lasso with α = 1 on y = 3x₀ + noise and four pure-noise features keeps only x₀, shrunk to about 3 − 1 = 2 (on standardised features).

**Worked example 4.** A logistic coefficient of 0.7 on a standardised feature means each extra standard deviation multiplies the odds by e^0.7 ≈ 2.0.
`, [yt("Q81RR3yKn30", "Regularization Part 1: Ridge (L2) Regression", "StatQuest"), yt("NGf0voTMlcs", "Regularization Part 2: Lasso (L1) Regression", "StatQuest"), yt("yIYKR4sgzI8", "Logistic Regression", "StatQuest"), SK("modules/linear_model.html", "Linear models")], "sk/linear", [
  iq("Ridge vs Lasso: what's the difference and when would you use each?", "Both add a penalty on coefficient size. Ridge's L2 penalty shrinks all coefficients smoothly and keeps them non-zero; it handles correlated features well by spreading weight across them. Lasso's L1 penalty drives some coefficients exactly to zero, giving a sparse, more interpretable model, but with correlated features it picks one somewhat arbitrarily. ElasticNet combines them. Choose the strength (alpha) by cross-validation, and standardise features first.", ["L2 shrinks, L1 zeroes", "Correlated features behaviour", "Tune alpha by CV, scale first"]),
  iq("In scikit-learn's LogisticRegression, what does C do, and why might its coefficients differ from statsmodels'?", "C is the inverse of the regularisation strength: smaller C means a stronger L2 penalty and smaller coefficients. sklearn applies a penalty by default (C = 1), while statsmodels' Logit fits plain maximum likelihood, so their coefficients differ unless you set penalty=None in sklearn. The penalty also makes the coefficients depend on feature scale.", ["C = 1/strength", "Default penalty in sklearn", "penalty=None to match MLE"]),
  iq("How do you interpret a logistic regression coefficient?", "It's the change in log-odds for a one-unit increase in that feature, holding the others fixed; exp(coef) is the odds ratio. On standardised features the unit is one standard deviation. It's an association, not a causal effect, and with correlated features individual coefficients can be unstable even when predictions are good.", ["Change in log-odds", "exp(coef) = odds ratio", "Units / standardisation", "Not causal; collinearity"]),
]);
trace("sk-lin-t1", "sk-linear", 2, 60, "from sklearn.linear_model import Ridge\nm = Ridge(alpha=2.0).fit([[1.], [2.], [3.]], [2., 4., 6.])\nprint(round(float(m.coef_[0]), 4))", 1,
  "Centred x = −1, 0, 1 and y = −2, 0, 2: Σxy = 4, Σx² = 2. Ridge: 4 / (2 + 2) = 1.", "One feature: w = Σxy / (Σx² + α) on centred data.", "Ignoring the penalty and answering the least-squares slope 2.");
trace("sk-lin-t2", "sk-linear", 1, 45, "from sklearn.linear_model import LogisticRegression\nm = LogisticRegression().fit([[0], [1], [2], [3]], [\"spam\", \"spam\", \"ham\", \"ham\"])\nprint(list(m.classes_).index(\"spam\"))", 1,
  "classes_ is sorted: ['ham', 'spam']. So spam is column 1 of predict_proba, even though it appeared first in y.", "predict_proba columns follow sorted classes_.", "Assuming the order of first appearance (answer 0).");
trace("sk-lin-t3", "sk-linear", 2, 60, "from sklearn.linear_model import Lasso\nrng = np.random.default_rng(0)\nX = rng.normal(size=(200, 5))\ny = 3 * X[:, 0] + rng.normal(scale=0.5, size=200)\nprint(int(np.sum(Lasso(alpha=1.0).fit(X, y).coef_ != 0)))", 1,
  "Only feature 0 carries signal. Its coefficient shrinks to about 3 − 1 = 2 but stays non-zero; the four noise features' correlations with y are far below alpha = 1, so they're set exactly to 0.", "Lasso zeroes coefficients whose |correlation with the residual| < alpha.", "Expecting all five to stay non-zero, as with Ridge.");
Card_("sk-lin-c1", "alpha vs C", "Ridge/Lasso alpha: bigger = stronger penalty. LogisticRegression/SVC C: bigger = weaker.", "sk-linear");
Card_("sk-lin-c2", "predict_proba column order", "model.classes_, which is sorted. Look the class up; don't assume [:, 1].", "sk-linear");

skTopic("sk-trees", "Trees and ensembles in scikit-learn", "How a tree chooses splits, how forests and boosting combine trees, the settings that control overfitting, and how to measure feature importance properly.", `
**A decision tree** splits greedily: at each node it tries every feature and every threshold (halfway between consecutive distinct values) and keeps the split that most reduces impurity.
- **Gini** = 1 − Σ pₖ² (sklearn's default); **entropy** = −Σ pₖ log pₖ. A pure node has 0.
- A split is scored by the size-weighted impurity of its two children.
- Trees need no scaling and handle interactions, but a fully grown tree memorises noise.

**Controlling overfitting.** \`max_depth\`, \`min_samples_leaf\`, \`min_samples_split\`, \`max_leaf_nodes\`, or cost-complexity pruning (\`ccp_alpha\`). Choose them on validation data or by cross-validation.

**Random forest** (\`RandomForestClassifier\`): many deep trees, each on a bootstrap sample and considering a random subset of features at each split (\`max_features\`, √p by default for classification). Averaging decorrelated trees cuts **variance**. More trees never overfit; they only cost time. \`oob_score=True\` gives a free validation estimate from the rows each tree didn't see.

**Gradient boosting** (\`GradientBoostingRegressor\`, and the much faster \`HistGradientBoostingClassifier/Regressor\`): shallow trees added one at a time, each fitted to the current residuals (the negative gradient of the loss) and scaled by \`learning_rate\`. It cuts **bias**, can overfit if you add too many trees, and pairs a small learning rate with more trees and early stopping. HistGradientBoosting handles NaN and categorical features natively and is sklearn's answer to XGBoost and LightGBM.

**Feature importance.**
- \`feature_importances_\` (impurity-based): computed on training data, only for trees, and biased towards continuous or high-cardinality features.
- \`permutation_importance(model, X_val, y_val)\`: shuffle one column and measure how much the score drops. Works for any model; use held-out data. Correlated features share importance, so each can look unimportant.

**Worked example 1: Gini.** A node with 6 of class A and 2 of class B: 1 − (0.75² + 0.25²) = 1 − 0.625 = 0.375.

**Worked example 2: a split.** x = 1, 2, 3, 4 with labels 0, 1, 0, 1. Threshold 1.5: left {0} (Gini 0), right {1, 0, 1} (Gini 4/9), weighted 3/4 × 4/9 = 1/3. Threshold 2.5: both sides {0, 1}, weighted 0.5. So 1.5 (or 3.5, also 1/3) beats 2.5.

**Worked example 3: one boosting step.** x = 1, 2, 3, 4 and y = 1, 1, 5, 5. Start from the mean 3; residuals are −2, −2, 2, 2. A stump splits at 2.5 with leaf values −2 and 2. With learning_rate = 0.1, the prediction at x = 4 becomes 3 + 0.1 × 2 = 3.2.

**Worked example 4: depth.** On noisy two-moons data, validation accuracy rises up to a moderate depth and then falls as the tree starts fitting noise, while training accuracy keeps climbing to 1.0.
`, [yt("_L39rN6gz7Y", "Decision and Classification Trees, Clearly Explained", "StatQuest"), yt("J4Wdy0Wc_xQ", "Random Forests Part 1", "StatQuest"), yt("3CC4N4z3GJc", "Gradient Boost Part 1: Regression Main Ideas", "StatQuest"), SK("modules/ensemble.html", "Ensembles: gradient boosting, random forests, bagging"), SK("modules/permutation_importance.html", "Permutation feature importance")], "sk/trees", [
  iq("Random forest vs gradient boosting: how do they differ?", "A random forest trains many deep, independent trees on bootstrap samples with random feature subsets and averages them, which reduces variance; it's robust, parallel and hard to overfit by adding trees. Gradient boosting trains shallow trees sequentially, each correcting the residual errors of the ensemble so far, scaled by a learning rate; it reduces bias and is usually more accurate on tabular data, but it's sequential, more sensitive to hyperparameters, and can overfit with too many rounds, so it uses early stopping.", ["Parallel deep trees vs sequential shallow", "Variance vs bias", "Learning rate, early stopping"]),
  iq("Why can impurity-based feature importance be misleading, and what do you use instead?", "It's computed from the training data, so it rewards splits that fit noise, and it's biased towards continuous and high-cardinality features, which offer many possible split points. It also exists only for tree models. Permutation importance on held-out data measures the actual drop in score when a feature is shuffled, for any model. With correlated features, both methods split credit, so check groups of features or drop-column importance.", ["Training data, high-cardinality bias", "Permutation importance on validation", "Correlated features caveat"]),
  iq("How do you stop a decision tree from overfitting?", "Limit its growth with max_depth, min_samples_leaf, min_samples_split or max_leaf_nodes, or grow it fully and prune with ccp_alpha, choosing the setting by cross-validation. Or don't use a single tree: a random forest averages many deep trees, and gradient boosting uses many shallow ones; both generalise much better.", ["Depth / leaf-size limits", "Cost-complexity pruning", "Tune by CV; ensembles"]),
]);
trace("sk-tre-t1", "sk-trees", 1, 45, "from sklearn.tree import DecisionTreeClassifier\nt = DecisionTreeClassifier(random_state=0).fit([[1], [2], [3], [4]], [0, 0, 1, 1])\nprint(t.get_depth())", 1,
  "One split at x ≤ 2.5 separates the classes perfectly, so both children are pure and the tree stops at depth 1, even with no max_depth.", "A tree stops splitting pure nodes.", "Expecting a deeper tree because max_depth is unlimited.");
calc("sk-tre-i2", "sk-trees", 1, 45, "A tree node holds 6 samples of class A and 2 of class B. What is its Gini impurity?", 0.375, 0.001,
  "p = (6/8, 2/8)\nanswer = 1 - sum(x * x for x in p)",
  "Gini = 1 − (0.75² + 0.25²) = 1 − 0.625 = 0.375.", "1 − Σ p².", "Using entropy (0.811) or forgetting to square.");
trace("sk-tre-t3", "sk-trees", 2, 75, "from sklearn.ensemble import GradientBoostingRegressor\ng = GradientBoostingRegressor(n_estimators=1, learning_rate=0.1, max_depth=1).fit([[1], [2], [3], [4]], [1, 1, 5, 5])\nprint(round(float(g.predict([[4]])[0]), 4))", 3.2,
  "Boosting starts from the mean, 3. The first stump fits the residuals (−2, −2, 2, 2) and gives +2 for x > 2.5. Scaled by the learning rate: 3 + 0.1 × 2 = 3.2.", "Prediction = initial mean + learning_rate × tree output.", "Forgetting the learning rate (answer 5).");
Card_("sk-tre-c1", "Random forest vs boosting", "Forest: deep independent trees averaged, cuts variance. Boosting: shallow trees fitted to residuals in sequence, cuts bias; needs early stopping.", "sk-trees");
Card_("sk-tre-c2", "Feature importance to trust", "permutation_importance on held-out data, not feature_importances_ (training data, biased to high cardinality).", "sk-trees");

skTopic("sk-cv", "Cross-validation and hyperparameter tuning", "How k-fold, stratified, grouped and time-series splits work, and how to tune with GridSearchCV without fooling yourself.", `
**Why cross-validate.** One train/test split gives one noisy number. k-fold cross-validation trains k times, each time holding out a different fold, and reports the mean and spread.

**The splitters.**
- \`KFold(k)\`: consecutive folds (shuffle=True to shuffle first). When n isn't divisible by k, the first n mod k folds get one extra row.
- \`StratifiedKFold(k)\`: each fold keeps the class proportions. It's what \`cv=5\` means for a classifier.
- \`GroupKFold(k)\`: every group (user, patient, store) is in exactly one fold. Use it whenever rows from the same group are similar.
- \`TimeSeriesSplit(k)\`: expanding window; train on everything before each test block. Test blocks have n // (k + 1) rows.
- \`cross_val_score(est, X, y, cv=..., scoring=...)\` returns one score per fold; \`cross_validate\` also returns training scores and times.

**Tuning.**
- \`GridSearchCV(estimator, param_grid, cv=..., scoring=...)\` tries every combination. With a pipeline, parameters are named \`step__param\` (\`"clf__C"\`).
- \`RandomizedSearchCV\` samples n_iter combinations from distributions, which is better when there are many parameters. Use a log scale for C, alpha and learning rates.
- After the search, \`refit=True\` (default) refits the best setting on all the data: \`best_estimator_\`, \`best_params_\`, \`best_score_\`, \`cv_results_\`.
- Fits = candidates × folds, plus 1 for the refit.

**Not fooling yourself.**
- **best_score_ is optimistic**: it's the maximum over candidates, so it was used for selection. Report the score on an untouched test set, or use **nested CV** (the search inside an outer CV loop).
- Put preprocessing inside the pipeline so it's refitted per fold.
- Pick the scoring metric that matches the problem (roc_auc, average_precision, f1, neg_mean_absolute_error); sklearn maximises, so error metrics are negated.

**Worked example 1.** A 3 × 4 grid with cv=5 and refit=True is 12 × 5 + 1 = 61 fits.

**Worked example 2.** KFold(5) on 12 rows gives test folds of 3, 3, 2, 2, 2.

**Worked example 3.** TimeSeriesSplit(4) on 20 rows: test blocks of 20 // 5 = 4 rows, starting at rows 4, 8, 12, 16. The first training set is rows 0–3.

**Worked example 4.** Five users with 10 rows each and KFold(5, shuffle=True): almost every user lands in both train and test, so the model can recognise users. GroupKFold(5) puts each user in exactly one test fold, and the score drops to what you'd see on new users.
`, [yt("fSytzGwwBVw", "Machine Learning Fundamentals: Cross Validation", "StatQuest"), yt("6dbrR-WymjI", "Selecting the best model in scikit-learn using cross-validation", "Data School"), yt("Gol_qOgRqfA", "How to find the best model parameters in scikit-learn", "Data School"), SK("modules/cross_validation.html", "Cross-validation"), SK("modules/grid_search.html", "Tuning hyperparameters")], "sk/cv", [
  iq("Why is GridSearchCV's best_score_ an optimistic estimate, and what do you do about it?", "It's the best of many cross-validated scores, so part of it is luck: selecting the maximum of noisy estimates biases it upwards, more so with more candidates and smaller data. To report performance, evaluate best_estimator_ once on a held-out test set that played no part in tuning, or use nested cross-validation: an outer CV loop with the whole search inside each outer training fold.", ["Max of noisy estimates", "Held-out test set", "Nested CV"]),
  iq("Which cross-validation scheme would you use for (a) imbalanced classes, (b) several rows per customer, (c) daily sales?", "(a) StratifiedKFold, so each fold has the same positive rate. (b) GroupKFold (or StratifiedGroupKFold) on customer ID, so no customer is in both train and test. (c) TimeSeriesSplit or a rolling-origin evaluation, training only on the past, possibly with a gap; never shuffle.", ["Stratified", "Group by customer", "Time-ordered, no shuffle"]),
  iq("Grid search or random search?", "Grid search is exhaustive but its cost multiplies with every parameter, and it wastes evaluations on parameters that don't matter. Random search samples from distributions, covers each important parameter at more distinct values for the same budget, and is usually better beyond two or three parameters. Use log-uniform distributions for scale parameters. For expensive models, successive halving or Bayesian optimisation (e.g. Optuna) does better still.", ["Grid cost explodes", "Random covers important params better", "Log scales; halving / Bayesian"]),
]);
calc("sk-cv-i1", "sk-cv", 1, 45, "GridSearchCV searches 3 values of max_depth × 4 values of learning_rate with cv=5 and refit=True. How many times is a model fitted in total?", 61, 0,
  "answer = 3 * 4 * 5 + 1",
  "12 candidates × 5 folds = 60 fits, plus 1 refit of the best setting on all the data = 61.", "candidates × folds + 1.", "Forgetting the final refit (60).");
trace("sk-cv-t2", "sk-cv", 1, 45, "from sklearn.model_selection import KFold\nprint([len(te) for _, te in KFold(5).split(np.zeros(12))][0])", 3,
  "12 = 5 × 2 + 2, so the first two folds get an extra row: test sizes 3, 3, 2, 2, 2.", "The first n mod k folds have one extra row.", "Answering 2 (12 // 5) for every fold.");
trace("sk-cv-t3", "sk-cv", 2, 60, "from sklearn.model_selection import TimeSeriesSplit\ntr, te = next(TimeSeriesSplit(n_splits=4).split(np.zeros(20)))\nprint(len(tr))", 4,
  "Test blocks have 20 // (4 + 1) = 4 rows and the last ends at row 19, so they start at 4, 8, 12 and 16. The first training set is rows 0–3: 4 rows.", "Test size n // (k + 1); first train = n − k × test size.", "Assuming the first training set is half the data.");
Card_("sk-cv-c1", "Choosing the splitter", "Classes → StratifiedKFold. Repeated users → GroupKFold. Time → TimeSeriesSplit. Never shuffle time.", "sk-cv");
Card_("sk-cv-c2", "best_score_", "Optimistic (chosen as a maximum). Report a held-out test score or nested CV.", "sk-cv");

skTopic("sk-metrics", "Metrics and thresholds in scikit-learn", "Reading the confusion matrix, picking a metric that fits the problem, averaging over classes, and choosing a decision threshold.", `
**The confusion matrix.** \`confusion_matrix(y_true, y_pred)\` has **rows = actual, columns = predicted**, labels in sorted order. For 0/1 labels, \`.ravel()\` gives **tn, fp, fn, tp**. Pass \`labels=[0, 1]\` so a batch with only one class still gives a 2 × 2 matrix.

**Ratios from it.**
- precision = tp / (tp + fp): of the predicted positives, how many are right.
- recall (sensitivity, TPR) = tp / (tp + fn): of the actual positives, how many we caught.
- specificity = tn / (tn + fp); FPR = 1 − specificity.
- F1 = 2PR / (P + R), the harmonic mean, which is low if either is low.

**Threshold-free metrics** need **scores**, not labels: pass \`predict_proba(X)[:, 1]\` or \`decision_function(X)\`.
- \`roc_auc_score\`: the probability that a random positive scores above a random negative. Insensitive to class balance, which can hide poor precision on rare positives.
- \`average_precision_score\` (area under the precision–recall curve): its baseline is the positive rate, so it's the better summary for rare positives.
- \`log_loss\` and \`brier_score_loss\` judge the probabilities themselves (calibration).

**Multiclass averaging** (\`average=\` in f1_score, precision_score, recall_score):
- **macro**: plain mean over classes; every class counts equally, so rare classes matter.
- **weighted**: mean weighted by class frequency.
- **micro**: pool all decisions; for single-label problems it equals accuracy.
- \`classification_report\` prints all of them.

**Imbalance.** With 1% positives, predicting "negative" always scores 99% accuracy. Use recall, precision, PR-AUC, or \`balanced_accuracy_score\` (mean recall over classes; that model gets 0.5).

**Choosing a threshold.** predict uses 0.5, which is rarely the business choice. \`precision_recall_curve(y, scores)\` lists precision and recall at every threshold. Choose on validation data, from a constraint (recall ≥ 0.9) or from costs (flag when p > cost_FP / (cost_FP + cost_FN)), then confirm once on the test set.

**Worked example 1.** y_true = 0, 1, 1, 1, 0, 1 and y_pred = 1, 1, 0, 0, 0, 1 give tn = 1, fp = 1, fn = 2, tp = 2. So cm[1, 0] (actual 1, predicted 0) = 2; precision = 2/3, recall = 1/2.

**Worked example 2.** Labels 0, 0, 1, 1 with scores 0.1, 0.4, 0.35, 0.8. Of the 4 positive-negative pairs, the positive scores higher in 3 (0.35 loses to 0.4), so AUC = 0.75.

**Worked example 3.** 990 negatives, 10 positives, always predict negative: accuracy 0.99, recall 0, balanced accuracy (1 + 0)/2 = 0.5.

**Worked example 4.** Positives score 0.9, 0.8, 0.6 and 0.35. For recall ≥ 0.75 you need 3 of the 4, so the highest usable threshold is 0.6.
`, [yt("Kdsp6soqA7o", "Machine Learning Fundamentals: The Confusion Matrix", "StatQuest"), yt("4jRBRDbJemM", "ROC and AUC, Clearly Explained", "StatQuest"), yt("85dtiMz9tSo", "How to evaluate a classifier in scikit-learn", "Data School"), SK("modules/model_evaluation.html", "Metrics and scoring"), SK("modules/classification_threshold.html", "Tuning the decision threshold")], "sk/metrics", [
  iq("Your fraud model has 99.5% accuracy. Is it good?", "Not necessarily: if 0.5% of transactions are fraud, predicting 'not fraud' for everything scores 99.5%. Look at the confusion matrix, recall (how much fraud we catch) and precision (how many alerts are real), PR-AUC, and the business cost of each error. Then choose a threshold for the trade-off, for example the best precision at the recall the fraud team needs.", ["Baseline = majority class", "Recall / precision / PR-AUC", "Costs and threshold"]),
  iq("ROC-AUC vs PR-AUC: when does it matter which one you report?", "ROC-AUC uses the false positive rate, whose denominator is the (huge) number of negatives, so with rare positives a model can have a high ROC-AUC while most of its alerts are false. PR-AUC uses precision, which directly reflects false alarms among flagged cases, and its baseline equals the positive rate. With balanced classes they tell a similar story; with rare positives, report PR-AUC (and precision at the operating point).", ["FPR denominator dominated by negatives", "Precision shows false alarms", "Baseline = positive rate"]),
  iq("How do you choose the classification threshold?", "Score a validation set with predict_proba, then pick the threshold from the business requirement: a minimum recall or precision, a budget of alerts per day, or expected cost (flag when p > c_FP / (c_FP + c_FN) for calibrated probabilities). Don't tune it on the test set. Check calibration first if you use the cost formula, and revisit the threshold when the base rate shifts.", ["Validation scores", "Constraint or cost-based", "Not on test; calibration"]),
]);
trace("sk-met-t1", "sk-metrics", 1, 60, "from sklearn.metrics import confusion_matrix\ncm = confusion_matrix([0, 1, 1, 1, 0, 1], [1, 1, 0, 0, 0, 1])\nprint(cm[1, 0])", 2,
  "Rows are actual, columns predicted. cm[1, 0] counts actual 1 predicted 0: positions 3 and 4 (1-based), so 2 false negatives.", "Row = truth, column = prediction; ravel() = tn, fp, fn, tp.", "Reading cm[1, 0] as false positives (1).");
trace("sk-met-t2", "sk-metrics", 1, 45, "from sklearn.metrics import roc_auc_score\nprint(roc_auc_score([0, 0, 1, 1], [0.1, 0.4, 0.35, 0.8]))", 0.75,
  "Compare each positive with each negative: 0.35 > 0.1 yes, 0.35 > 0.4 no, 0.8 beats both. 3 of 4 pairs are ordered correctly: AUC = 0.75.", "AUC = share of positive–negative pairs ranked correctly.", "Thresholding the scores at 0.5 first and computing accuracy.");
trace("sk-met-t3", "sk-metrics", 1, 30, "from sklearn.metrics import balanced_accuracy_score\nprint(balanced_accuracy_score([0] * 990 + [1] * 10, [0] * 1000))", 0.5,
  "Balanced accuracy is the mean recall over classes: class 0 → 1.0, class 1 → 0.0, so 0.5, while plain accuracy would be 0.99.", "Mean of per-class recall.", "Answering 0.99, the plain accuracy.");
Card_("sk-met-c1", "confusion_matrix(y, p).ravel()", "tn, fp, fn, tp (rows = actual, columns = predicted). Pass labels=[0, 1].", "sk-metrics");
Card_("sk-met-c2", "macro / weighted / micro", "Macro: every class equal. Weighted: by frequency. Micro: pooled (= accuracy for single-label).", "sk-metrics");

skTopic("sk-unsup", "Clustering and PCA in scikit-learn", "k-means, choosing k, DBSCAN, and PCA: what each optimises, why scaling matters, and how to read the outputs.", `
**k-means** (\`KMeans(n_clusters=k, n_init=10, random_state=0)\`) alternates two steps until nothing changes:
1. Assign each point to its nearest centre.
2. Move each centre to the mean of its points.

It minimises **inertia**, the sum of squared distances to the assigned centre (\`inertia_\`).
- It finds a local minimum, so it runs several random starts (n_init) and keeps the best; k-means++ initialisation spreads the starting centres out.
- It assumes round clusters of similar size and uses Euclidean distance, so **standardise first**.
- Inertia always falls as k grows, so you can't choose k by minimising it.

**Choosing k.**
- The elbow of the inertia curve.
- The **silhouette** \`silhouette_score(X, labels)\`: for each point, a = mean distance to its own cluster, b = mean distance to the nearest other cluster, s = (b − a) / max(a, b). It's between −1 and 1; higher is better.
- Domain sense: k is often a business choice (number of segments a team can act on).

**DBSCAN** (\`DBSCAN(eps, min_samples)\`) grows clusters from dense regions. It finds arbitrary shapes, doesn't need k, and labels sparse points **−1 (noise)**. eps is in the units of the data, so scale first.

**PCA** (\`PCA(n_components)\`) finds orthogonal directions of maximum variance.
- \`explained_variance_ratio_\` is each component's share of the total variance; the cumulative sum tells you how many components you need. \`PCA(n_components=0.95)\` picks that number for you.
- \`components_\` holds the loadings (how much each original feature contributes).
- On unscaled data PCA just finds the column with the largest units. After standardising, it works on the correlation matrix.
- Uses: compression, visualisation, removing collinearity before a linear model. The components are linear and can be hard to interpret.

**Worked example 1.** Points 0, 2, 10 and 12 with k = 2: centres 1 and 11, every point is 1 away, inertia = 4 × 1² = 4.

**Worked example 2.** A point with a = 1 (own cluster) and b = 4 (nearest other cluster) has silhouette (4 − 1)/4 = 0.75.

**Worked example 3.** DBSCAN(eps=1.5, min_samples=2) on 0, 1, 2, 10, 20, 21 finds clusters {0, 1, 2} and {20, 21}; 10 has no neighbour within 1.5 and is noise (−1).

**Worked example 4.** Eight features driven by three hidden factors: after standardising, the first three components explain most of the variance and the cumulative curve flattens after them.
`, [yt("4b5d3muPQmA", "K-means clustering", "StatQuest"), yt("FgakZw6K1QQ", "Principal Component Analysis (PCA), Step-by-Step", "StatQuest"), yt("HMOI_lkzW08", "PCA main ideas in only 5 minutes", "StatQuest"), SK("modules/clustering.html", "Clustering"), SK("modules/decomposition.html", "Decomposing signals (PCA)")], "sk/unsup", [
  iq("How does k-means work, and what are its limitations?", "It alternates assigning each point to the nearest centre and moving each centre to the mean of its points, which never increases the within-cluster sum of squares, so it converges, but only to a local minimum (hence k-means++ and several restarts). It needs k in advance, assumes roughly spherical, similar-sized clusters, uses Euclidean distance (so features must be scaled), and is sensitive to outliers. For other shapes, use DBSCAN, Gaussian mixtures or hierarchical clustering.", ["Assign / update loop", "Local minimum; restarts", "k, spherical, scaling, outliers", "Alternatives"]),
  iq("How do you choose the number of clusters?", "Plot inertia against k and look for an elbow; compute the silhouette score for each k and prefer high values; check stability across seeds and subsamples; and, most importantly, ask whether the clusters are distinct and useful for the decision at hand. Never minimise inertia alone, because it always falls as k grows.", ["Elbow", "Silhouette", "Stability and usefulness", "Inertia always falls"]),
  iq("Why standardise before PCA, and how do you pick the number of components?", "PCA maximises variance, so on raw data a feature in large units (income in rupees) dominates the first component regardless of how informative it is. Standardising puts features on equal footing (PCA on the correlation matrix). Pick the number of components from the cumulative explained variance (e.g. 90–95%), from a scree plot elbow, or by cross-validating the downstream model with the number of components as a hyperparameter.", ["Variance depends on units", "Correlation-matrix PCA", "Cumulative variance / scree / CV"]),
]);
trace("sk-uns-t1", "sk-unsup", 1, 45, "from sklearn.cluster import KMeans\nkm = KMeans(n_clusters=2, n_init=10, random_state=0).fit([[0.], [2.], [10.], [12.]])\nprint(km.inertia_)", 4,
  "The best split is {0, 2} and {10, 12}, with centres 1 and 11. Each point is 1 from its centre: inertia = 4 × 1² = 4.", "Inertia = sum of squared distances to the centres.", "Adding distances instead of squared distances (still 4 here, but not in general), or splitting {0} from {2, 10, 12}.");
calc("sk-uns-i2", "sk-unsup", 1, 45, "For one point, the mean distance to the other points of its own cluster is a = 1 and the mean distance to the points of the nearest other cluster is b = 4. What is its silhouette value?", 0.75, 0.001,
  "a, b = 1, 4\nanswer = (b - a) / max(a, b)",
  "s = (b − a) / max(a, b) = 3 / 4 = 0.75.", "(b − a) / max(a, b).", "Computing a / b (0.25) or b − a (3).");
trace("sk-uns-t3", "sk-unsup", 1, 45, "from sklearn.cluster import DBSCAN\nlab = DBSCAN(eps=1.5, min_samples=2).fit([[0], [1], [2], [10], [20], [21]]).labels_\nprint(int((lab == -1).sum()))", 1,
  "0, 1 and 2 are within 1.5 of each other, as are 20 and 21, so they form two clusters. 10 has no neighbour within 1.5: it's noise, label −1.", "DBSCAN marks points with too few neighbours as −1.", "Forcing every point into a cluster, as k-means would.");
Card_("sk-uns-c1", "Inertia vs silhouette", "Inertia always falls with k. Silhouette (b − a)/max(a, b) peaks at a good k.", "sk-unsup");
Card_("sk-uns-c2", "PCA without scaling", "Finds the column with the biggest units. Standardise first (correlation-matrix PCA).", "sk-unsup");

// ───────────────────────── PyTorch ─────────────────────────
ptTopic("pt-tensors", "Tensors: shapes, dtypes, devices and views", "What a tensor is, how broadcasting and indexing work, the difference between view and reshape, and moving data between numpy and the GPU.", `
**A tensor** is an n-dimensional array, like a numpy array, plus two things numpy doesn't have: it can live on a **GPU** and it can record operations for **autograd**.

**Creating.** \`torch.tensor([[1., 2.], [3., 4.]])\`, \`torch.zeros(3, 4)\`, \`torch.randn(2, 3)\`, \`torch.arange(6)\`, \`torch.from_numpy(a)\` (shares memory with a), \`t.numpy()\` (CPU only; call \`.detach().cpu()\` first if needed).

**dtype.**
- Python floats become float32 (numpy's default is float64), integers become int64.
- Models use float32; class labels for CrossEntropyLoss must be int64 (\`.long()\`).
- \`/\` always gives a float result; \`//\` is floor division.

**device.** \`t.to("cuda")\` or \`t.to(device)\`; the model and all its inputs must be on the same device, or you get "Expected all tensors to be on the same device". \`.item()\` turns a one-element tensor into a Python number.

**Shapes.**
- \`t.shape\`, \`t.numel()\`; \`unsqueeze(d)\` adds a size-1 dimension, \`squeeze(d)\` removes one.
- **Broadcasting** follows numpy's rule: align shapes on the right; sizes must be equal or 1. A (N,) target minus an (N, 1) prediction silently becomes (N, N).
- Images are **(N, C, H, W)** in PyTorch; PIL and OpenCV give (H, W, C). Use \`permute(0, 3, 1, 2)\`, not reshape, to change the layout.

**view vs reshape.**
- \`view\` reinterprets the same memory and needs a contiguous tensor; the result **shares storage**, so writing to it changes the original.
- \`reshape\` returns a view when it can and a copy when it must.
- After \`permute\` or \`.T\` a tensor isn't contiguous; use \`reshape\` or \`.contiguous().view(...)\`.

**Indexing.** Like numpy: \`t[:, 1]\`, boolean masks, \`t[torch.arange(N), targets]\` to pick one entry per row (same as \`gather\`).

**Worked example 1.** (8, 1, 6) + (7, 1) broadcasts to (8, 7, 6): 336 elements.

**Worked example 2.** \`x = torch.arange(6); y = x.view(2, 3); y[0, 0] = 100\` → x[0] is now 100, because y is a view.

**Worked example 3.** \`t = torch.tensor([1, 2, 3])\`: t / 2 = [0.5, 1.0, 1.5] (float), t // 2 = [0, 1, 1].

**Worked example 4.** A batch of 32 RGB images 224 × 224 loaded as (32, 224, 224, 3) becomes \`x.permute(0, 3, 1, 2)\` = (32, 3, 224, 224) for Conv2d.
`, [yt("ORMx45xqWkA", "PyTorch in 100 Seconds", "Fireship"), yt("exaWOE8jvy8", "PyTorch Tutorial 02: Tensor Basics", "Patrick Loeber"), yt("IC0_FRiX-sw", "Introduction to PyTorch", "PyTorch"), PT("tutorials/beginner/basics/tensorqs_tutorial.html", "Tensors tutorial"), PT("docs/stable/notes/broadcasting.html", "Broadcasting semantics")], "pt/tensors", [
  iq("What's the difference between view and reshape in PyTorch?", "view returns a tensor sharing the same storage with a new shape, and works only if the memory layout allows it (contiguous, or compatible strides); otherwise it raises an error. reshape returns a view when possible and silently copies otherwise. Because a view shares memory, writing to it changes the original. After transpose or permute a tensor isn't contiguous, so use reshape or call .contiguous() first.", ["view shares storage, needs contiguity", "reshape may copy", "Writes propagate through views", "permute → non-contiguous"]),
  iq("Your loss is a number but the model doesn't learn. Your prediction has shape (64, 1) and your target (64,). What's wrong?", "Broadcasting: pred − target becomes a (64, 64) matrix of every prediction against every target, so the mean squared error is computed over the wrong pairs and the gradient is meaningless. Fix it by squeezing the prediction (pred.squeeze(1)) or unsqueezing the target so both are (64,) or (64, 1). PyTorch's MSELoss warns about this size mismatch; manual formulas don't.", ["(64,1) − (64,) → (64,64)", "squeeze/unsqueeze to match", "Check shapes before the loss"]),
  iq("How do you move data between numpy and PyTorch, and what are the pitfalls?", "torch.from_numpy(a) creates a tensor sharing memory with the array (changes show up in both); torch.tensor(a) copies. t.numpy() works only for CPU tensors that don't require grad: use t.detach().cpu().numpy(). Watch the dtype: numpy defaults to float64, while models use float32, so convert with .float(); labels for classification need .long().", ["from_numpy shares, tensor copies", "detach().cpu().numpy()", "float64 vs float32; long labels"]),
]);
torchq("pt-ten-i1", "pt-tensors", 1, 45, "x = torch.zeros(8, 1, 6)\ny = torch.zeros(7, 1)\nprint((x + y).numel())", 336, 0,
  "import numpy as np\nanswer = int(np.prod(np.broadcast_shapes((8, 1, 6), (7, 1))))",
  "Align on the right: (8, 1, 6) and (1, 7, 1) → (8, 7, 6). 8 × 7 × 6 = 336 elements.", "Right-align the shapes; each 1 stretches.", "Aligning on the left and calling it an error, or multiplying all the sizes (2,016).");
torchq("pt-ten-i2", "pt-tensors", 1, 45, "x = torch.arange(6)\ny = x.view(2, 3)\ny[0, 0] = 100\nprint(x[0].item())", 100, 0,
  "import numpy as np\nx = np.arange(6)\ny = x.reshape(2, 3)\ny[0, 0] = 100\nanswer = int(x[0])",
  "view shares storage with x, so writing through y changes x: x[0] = 100.", "A view is the same memory with a new shape.", "Thinking view makes a copy (answer 0).");
torchq("pt-ten-i3", "pt-tensors", 1, 45, "t = torch.tensor([1, 2, 3])\nprint((t / 2).sum().item() + (t // 2).sum().item())", 5, 0,
  "import numpy as np\nt = np.array([1, 2, 3])\nanswer = float((t / 2).sum() + (t // 2).sum())",
  "t / 2 is true division: 0.5 + 1.0 + 1.5 = 3.0. t // 2 is floor division: 0 + 1 + 1 = 2. Total 5.0.", "/ always gives floats; // floors.", "Assuming integer tensors divide to integers (answer 4).");
Card_("pt-ten-c1", "view vs reshape", "view shares memory and needs contiguity; reshape copies if it must. After permute, use reshape.", "pt-tensors");
Card_("pt-ten-c2", "Image layout", "PyTorch: (N, C, H, W). PIL/OpenCV: (H, W, C). Change it with permute, never reshape.", "pt-tensors");

ptTopic("pt-autograd", "Autograd: how PyTorch computes gradients", "requires_grad, the computation graph, backward, why gradients accumulate, and when to use no_grad and detach.", `
**The idea.** When a tensor has \`requires_grad=True\`, every operation on it is recorded in a graph. Calling \`loss.backward()\` walks that graph backwards with the chain rule and stores ∂loss/∂x in \`x.grad\` for every leaf tensor x that requires grad (the model's parameters).

**The rules.**
- \`backward()\` needs a scalar (or a gradient argument of the output's shape).
- Gradients **accumulate**: each backward() adds to .grad. That's why every training step starts with \`optimizer.zero_grad()\`. Accumulation is also a feature: summing gradients over several small batches simulates a bigger one.
- The graph is freed after backward(); calling it twice on the same graph needs \`retain_graph=True\`.
- Only leaf tensors keep .grad by default; intermediate results need \`.retain_grad()\`.

**Turning it off.**
- \`with torch.no_grad():\` (or \`torch.inference_mode()\`) for evaluation and for manual weight updates: no graph is built, which saves memory.
- \`t.detach()\` returns the same values cut out of the graph; gradients don't flow through it. Used for targets computed by the model itself (target networks, stop-gradient) and before \`.numpy()\`.

**What backward computes.** For L = mean((Xw + b − y)²) with residual r = Xw + b − y: ∂L/∂w = (2/N) Xᵀr and ∂L/∂b = (2/N) Σr. For cross-entropy on logits: ∂L/∂z = (softmax(z) − onehot(y)) / N. Writing these by hand once, and checking them against a **numerical gradient** ((f(x + ε) − f(x − ε)) / 2ε), is the standard way to debug a custom layer.

**Worked example 1.** x = 3 with requires_grad; y = x² + 2x; y.backward() → x.grad = 2x + 2 = 8.

**Worked example 2.** Calling \`(x * 2).backward()\` three times without zeroing leaves x.grad = 2 + 2 + 2 = 6.

**Worked example 3.** y = w · w.detach() with w = 2: the detached factor is treated as a constant, so dy/dw = w.detach() = 2, not 2w = 4.

**Worked example 4.** For X = [[1, 2], [3, 4], [5, 6]], y = [1, 2, 3], w = [0.1, −0.2], b = 0.5, the residuals are −0.8, −2 and −3.2; w.grad = [−15.2, −19.2] and b.grad = −4.
`, [yt("VMj-3S1tku0", "The spelled-out intro to neural networks and backpropagation: building micrograd", "Andrej Karpathy"), yt("M0fX15_-xrY", "The Fundamentals of Autograd", "PyTorch"), yt("DbeIqrwb_dE", "PyTorch Tutorial 03: Gradient Calculation With Autograd", "Patrick Loeber"), PT("tutorials/beginner/basics/autogradqs_tutorial.html", "Automatic differentiation tutorial"), PT("docs/stable/notes/autograd.html", "Autograd mechanics")], "pt/autograd", [
  iq("Why do you call optimizer.zero_grad() every iteration?", "Because backward() adds the new gradients to whatever is already in each parameter's .grad. Without zeroing, every step would use the sum of all past gradients, so updates grow and training diverges. The accumulation is deliberate: it lets you add up gradients over several mini-batches (gradient accumulation) to simulate a larger batch, then step and zero once.", ["backward accumulates into .grad", "Stale gradients → wrong updates", "Gradient accumulation use case"]),
  iq("What's the difference between torch.no_grad() and .detach()?", "no_grad is a context: nothing computed inside it is recorded, so no graph and no gradients, which saves memory during evaluation or manual parameter updates. detach acts on one tensor: it returns the same data as a new tensor that is cut out of the graph, so gradients won't flow back through it, while the rest of the computation can still be tracked. Use detach for stop-gradient targets and before converting to numpy.", ["no_grad: block of code, no graph", "detach: one tensor cut from graph", "Use cases"]),
  iq("How would you check that a custom layer's backward pass is correct?", "Compare the analytic gradient with a numerical one: perturb each input by ±ε, evaluate the loss, and use (f(x + ε) − f(x − ε)) / 2ε. Do it in float64 with ε around 1e-6, on small inputs, and look at the relative error (around 1e-7 is good; 1e-2 is a bug). torch.autograd.gradcheck automates this.", ["Central differences", "float64, small ε", "Relative error; gradcheck"]),
]);
torchq("pt-ag-i1", "pt-autograd", 1, 45, "x = torch.tensor(3.0, requires_grad=True)\ny = x ** 2 + 2 * x\ny.backward()\nprint(x.grad.item())", 8, 0,
  "x = 3.0\nanswer = 2 * x + 2",
  "dy/dx = 2x + 2 = 8 at x = 3.", "Differentiate, then substitute.", "Printing y (15) instead of the gradient.");
torchq("pt-ag-i2", "pt-autograd", 2, 45, "x = torch.tensor(1.0, requires_grad=True)\nfor _ in range(3):\n    (x * 2).backward()\nprint(x.grad.item())", 6, 0,
  "answer = sum(2.0 for _ in range(3))",
  "Each backward adds d(2x)/dx = 2 to x.grad, and nothing zeroes it: 2 + 2 + 2 = 6.", "Gradients accumulate until you zero them.", "Thinking each backward overwrites .grad (answer 2).");
torchq("pt-ag-i3", "pt-autograd", 2, 60, "w = torch.tensor(2.0, requires_grad=True)\ny = w * w.detach()\ny.backward()\nprint(w.grad.item())", 2, 0,
  "w = 2.0\nanswer = w  # the detached factor is a constant, so dy/dw = w.detach()",
  "w.detach() is treated as the constant 2, so y = 2w as far as autograd knows: dy/dw = 2. Without detach it would be 2w = 4.", "Detached tensors are constants to autograd.", "Differentiating w² (answer 4).");
Card_("pt-ag-c1", "optimizer.zero_grad()", "backward() adds to .grad; zero it every step (or deliberately accumulate over several batches).", "pt-autograd");
Card_("pt-ag-c2", "no_grad vs detach", "no_grad: don't record a block (eval, manual updates). detach: cut one tensor from the graph.", "pt-autograd");

ptTopic("pt-modules", "nn.Module, layers, Dataset and DataLoader", "How to define a model, what its parameters are, the shapes of the common layers, and how data reaches the model in batches.", `
**nn.Module.** Subclass it, create layers in \`__init__\`, and write \`forward\`:
\`\`\`
class MLP(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(nn.Linear(784, 128), nn.ReLU(), nn.Linear(128, 10))
    def forward(self, x):
        return self.net(x)          # raw logits, no softmax
\`\`\`
- Call the model as \`model(x)\`, not \`model.forward(x)\`: the call runs hooks.
- Layers assigned as attributes are registered automatically, so \`model.parameters()\` finds them. A plain Python list of layers is **not** registered; use \`nn.ModuleList\`.
- \`model.to(device)\` moves every parameter; \`model.state_dict()\` is what you save.
- Count parameters with \`sum(p.numel() for p in model.parameters() if p.requires_grad)\`.

**Common layers and their parameters.**
- \`nn.Linear(in, out)\`: weight (out, in), bias (out): y = xWᵀ + b over the last dimension. in · out + out parameters.
- \`nn.Conv2d(in_c, out_c, k, stride, padding)\`: in_c · out_c · k² + out_c parameters, whatever the image size. Output size = ⌊(H + 2p − k) / s⌋ + 1.
- \`nn.BatchNorm1d/2d(C)\`: 2C parameters (γ, β) plus running mean and variance, which are **buffers**, saved in the state_dict but not trained.
- \`nn.Embedding(V, d)\`: a V × d lookup table.
- \`nn.LSTM(in, h)\`: 4 gates × (h · in + h · h + 2h); PyTorch keeps two bias vectors per gate, Keras one.
- ReLU, Dropout, Flatten and pooling have no parameters.

**Data.**
- A \`Dataset\` has \`__len__\` and \`__getitem__(i)\` returning one sample, e.g. (x, y).
- \`DataLoader(ds, batch_size=64, shuffle=True, num_workers=4, drop_last=False)\` batches, shuffles each epoch and loads in parallel.
- len(loader) = ⌈n / batch_size⌉, or ⌊n / batch_size⌋ with drop_last=True.
- Shuffle the training loader, not the validation one.

**Worked example 1.** nn.Linear(20, 5) has 20 × 5 + 5 = 105 parameters.

**Worked example 2.** Conv2d(3, 8, kernel_size=3, stride=2, padding=1) on 32 × 32 images: ⌊(32 + 2 − 3) / 2⌋ + 1 = 16, so the output is (N, 8, 16, 16). Parameters: 3 · 8 · 9 + 8 = 224.

**Worked example 3.** 1,000 samples, batch_size 64: 15 full batches and one of 40, so 16 steps per epoch (15 with drop_last=True).

**Worked example 4.** The MLP above: 784 · 128 + 128 = 100,480 and 128 · 10 + 10 = 1,290, so 101,770 parameters, about 400 KB in float32.
`, [yt("OSqIP-mOWOI", "Building Models with PyTorch", "PyTorch"), yt("PXOzkkB5eH0", "PyTorch Tutorial 09: Dataset and DataLoader", "Patrick Loeber"), PT("tutorials/beginner/basics/buildmodel_tutorial.html", "Build the neural network"), PT("tutorials/beginner/basics/data_tutorial.html", "Datasets and DataLoaders")], "pt/modules", [
  iq("Walk me through defining a model in PyTorch. What does super().__init__() do, and why use nn.ModuleList instead of a list?", "Subclass nn.Module, call super().__init__() first (it sets up the internal registries for parameters, buffers and submodules), create the layers as attributes in __init__, and define forward. Assigning a module as an attribute registers it, so its parameters appear in model.parameters(), move with .to(device) and are saved in state_dict. A plain Python list hides them: the optimiser wouldn't train them. nn.ModuleList and nn.ModuleDict register their contents.", ["Subclass, super().__init__(), forward", "Attribute assignment registers", "List hides params → ModuleList"]),
  iq("What's the difference between a parameter and a buffer?", "Parameters (nn.Parameter) are trained: they require grad and are returned by model.parameters(), so the optimiser updates them. Buffers (register_buffer) are state that moves with the model and is saved in the state_dict but isn't trained, such as BatchNorm's running mean and variance or a fixed positional-encoding table.", ["Parameters: trained", "Buffers: saved, moved, not trained", "BatchNorm running stats example"]),
  iq("Your GPU sits at 30% utilisation during training. What do you check?", "The input pipeline: increase DataLoader num_workers, set pin_memory=True with non_blocking transfers, and move expensive preprocessing out of __getitem__ or cache it. Then the batch size (bigger batches use the GPU better, within memory). Also look for CPU-GPU synchronisation in the loop, such as calling .item() or printing every step, and consider mixed precision.", ["num_workers / pin_memory", "Preprocessing cost; batch size", "Sync points like .item()"]),
]);
torchq("pt-mod-i1", "pt-modules", 1, 30, "layer = nn.Linear(20, 5)\nprint(sum(p.numel() for p in layer.parameters()))", 105, 0,
  "answer = 20 * 5 + 5",
  "weight (5, 20) = 100 values, bias 5: 105.", "in × out + out.", "Forgetting the bias (100).");
torchq("pt-mod-i2", "pt-modules", 2, 60, "conv = nn.Conv2d(3, 8, kernel_size=3, stride=2, padding=1)\nprint(conv(torch.zeros(1, 3, 32, 32)).shape[-1])", 16, 0,
  "H, k, s, p = 32, 3, 2, 1\nanswer = (H + 2 * p - k) // s + 1",
  "⌊(32 + 2 × 1 − 3) / 2⌋ + 1 = ⌊31 / 2⌋ + 1 = 15 + 1 = 16.", "⌊(H + 2p − k) / s⌋ + 1.", "Forgetting the +1 (15) or the padding (15).");
torchq("pt-mod-i3", "pt-modules", 1, 45, "ds = torch.utils.data.TensorDataset(torch.zeros(1000, 4))\nloader = torch.utils.data.DataLoader(ds, batch_size=64)\nprint(len(loader))", 16, 0,
  "import math\nanswer = math.ceil(1000 / 64)",
  "1000 / 64 = 15.6: 15 full batches and a last batch of 40, so 16 batches (drop_last defaults to False).", "⌈n / batch_size⌉ unless drop_last=True.", "Using floor division (15), which is only right with drop_last=True.");
Card_("pt-mod-c1", "nn.Linear(in, out)", "weight shape (out, in), y = x Wᵀ + b; in·out + out parameters.", "pt-modules");
Card_("pt-mod-c2", "Conv2d output size", "⌊(H + 2p − k) / s⌋ + 1; parameters in·out·k² + out, independent of image size.", "pt-modules");

ptTopic("pt-training", "The training loop: losses, optimisers and train/eval", "The five lines of every training step, which loss takes what input, what model.train() and model.eval() change, and how to save and resume.", `
**The step.** For each batch:
\`\`\`
model.train()
for x, y in train_loader:
    x, y = x.to(device), y.to(device)
    optimizer.zero_grad()           # clear old gradients
    loss = loss_fn(model(x), y)     # forward
    loss.backward()                 # gradients into .grad
    optimizer.step()                # update parameters
\`\`\`
Then evaluate:
\`\`\`
model.eval()
with torch.no_grad():
    ...
\`\`\`

**Losses and their inputs.**
- \`nn.CrossEntropyLoss\`: **raw logits** (N, C) and **int64 class indices** (N,). It applies log-softmax itself, so don't add a softmax layer. \`ignore_index\` skips padding; \`label_smoothing\` and \`weight\` are options.
- \`nn.BCEWithLogitsLoss\`: raw logits and float targets for binary or multi-label problems. It's more stable than Sigmoid + BCELoss, and \`pos_weight\` handles imbalance.
- \`nn.MSELoss\` / \`nn.L1Loss\` / \`nn.HuberLoss\` for regression. Make sure prediction and target have the same shape.
- Default reduction is the **mean** over the batch.

**Optimisers.** \`torch.optim.SGD(model.parameters(), lr=0.1, momentum=0.9)\`, \`Adam(lr=1e-3)\`, \`AdamW(lr, weight_decay=0.01)\`, which applies decoupled weight decay and is the standard for transformers. A scheduler (\`StepLR\`, \`CosineAnnealingLR\`, \`OneCycleLR\`) changes the learning rate; call \`scheduler.step()\` after \`optimizer.step()\`.

**train() vs eval()** changes layers that behave differently at inference:
- **Dropout** zeroes activations with probability p in training and scales the survivors by 1/(1 − p) ("inverted dropout"); in eval mode it does nothing.
- **BatchNorm** normalises with the batch's statistics in training and updates running averages (new = 0.9 · old + 0.1 · batch, using the unbiased variance); in eval mode it uses the running averages.
- Forgetting \`model.eval()\` gives noisy, batch-dependent predictions. eval() does **not** turn off gradients; that's no_grad's job.

**Saving and resuming.** \`torch.save({"model": model.state_dict(), "opt": optimizer.state_dict(), "epoch": e}, path)\`, then \`load_state_dict\` for both. Saving the optimiser matters for Adam, whose moment estimates are part of the training state.

**Worked example 1.** Uniform logits over 4 classes: softmax = 0.25 each, loss = −log 0.25 = log 4 ≈ 1.3863. A fresh classifier's first loss should be near log C; if it's much higher, check the initialisation or the labels.

**Worked example 2.** nn.Dropout(0.5) in eval mode on ten 1s returns ten 1s (sum 10). In train mode about half are 0 and the rest are 2, so the expected sum is still 10.

**Worked example 3.** One SGD step on loss = (3w)² with w = 1 and lr = 0.1: the gradient is 18w = 18, so w becomes 1 − 1.8 = −0.8.

**Worked example 4.** Linear regression on x = 1–4, y = 2x + 1, starting from w = b = 0 with lr = 0.05: the losses go 41.0, 1.13, 0.043, … The first loss is mean(y²) = 41, as it must be when the model predicts 0.
`, [yt("jF43_wj_DCQ", "Training with PyTorch", "PyTorch"), yt("VVDHU_TWwUg", "PyTorch Tutorial 06: Training Pipeline: Model, Loss, and Optimizer", "Patrick Loeber"), yt("Z_ikDlimN6A", "Learn PyTorch for deep learning in a day", "Daniel Bourke"), PT("tutorials/beginner/basics/optimization_tutorial.html", "Optimizing model parameters"), R("A Recipe for Training Neural Networks (Andrej Karpathy)", "https://karpathy.github.io/2019/04/25/recipe/", "Debugging habits: overfit one batch, check the initial loss")], "pt/training", [
  iq("Write a PyTorch training loop from memory and explain each line.", "Set model.train(); loop over the DataLoader; move x and y to the device; optimizer.zero_grad() to clear accumulated gradients; out = model(x) for the forward pass; loss = loss_fn(out, y); loss.backward() to compute gradients; optimizer.step() to update; optionally scheduler.step(). Then validate with model.eval() and torch.no_grad(), track the metric, and save the best state_dict. Mention checking shapes and dtypes for the loss.", ["zero_grad, forward, loss, backward, step", "Device transfer", "eval + no_grad for validation", "Checkpoint best"]),
  iq("What do model.train() and model.eval() actually change?", "They set the training flag on every submodule, which matters only for layers with different behaviour at inference: Dropout stops dropping (and scaling), and BatchNorm switches from batch statistics to its running averages and stops updating them. eval() does not disable gradient tracking; wrap inference in torch.no_grad() or inference_mode() for that.", ["Dropout on/off", "BatchNorm batch vs running stats", "Not the same as no_grad"]),
  iq("Your training loss is NaN after a few hundred steps. How do you debug it?", "Check the data for NaN or inf and extreme values; lower the learning rate (the most common cause); make sure the loss gets logits where it expects logits (applying log to a softmax that underflowed to 0 gives inf); add gradient clipping (clip_grad_norm_); in mixed precision use the gradient scaler; look for division by zero or log of zero in custom code; and use torch.autograd.set_detect_anomaly to find the first operation producing NaN. Overfitting a single batch first catches many of these early.", ["Data / LR first", "Logits vs probabilities, log(0)", "Clipping, AMP scaler", "detect_anomaly; overfit one batch"]),
]);
torchq("pt-tr-i1", "pt-training", 1, 45, "loss_fn = nn.CrossEntropyLoss()\nprint(round(loss_fn(torch.zeros(1, 4), torch.tensor([2])).item(), 4))", 1.3863, 0.0001,
  "import math\nanswer = round(math.log(4), 4)",
  "Equal logits → softmax 0.25 for every class → loss −log 0.25 = log 4 ≈ 1.3863, whichever class is the target.", "Uniform prediction over C classes: loss = log C.", "Expecting 0 because the logits are 0, or 0.25.");
torchq("pt-tr-i2", "pt-training", 1, 30, "d = nn.Dropout(p=0.5)\nd.eval()\nprint(d(torch.ones(10)).sum().item())", 10, 0,
  "answer = 10.0",
  "In eval mode Dropout is the identity: the output is ten 1s, sum 10. (In training mode survivors are scaled by 2, so the expected sum is also 10.)", "eval() turns dropout off.", "Expecting about 5, as if dropping still happened without rescaling.");
torchq("pt-tr-i3", "pt-training", 2, 60, "w = torch.tensor(1.0, requires_grad=True)\nopt = torch.optim.SGD([w], lr=0.1)\nopt.zero_grad()\nloss = (w * 3) ** 2\nloss.backward()\nopt.step()\nprint(round(w.item(), 4))", -0.8, 0.0001,
  "w, lr = 1.0, 0.1\ngrad = 2 * 3 * 3 * w  # d(9w^2)/dw = 18w\nanswer = round(w - lr * grad, 4)",
  "loss = 9w², so the gradient is 18w = 18. SGD: w ← 1 − 0.1 × 18 = −0.8.", "w ← w − lr · ∂loss/∂w.", "Forgetting the chain-rule factor 3 (gradient 6 → 0.4).");
Card_("pt-tr-c1", "nn.CrossEntropyLoss input", "Raw logits (N, C) and int64 class indices (N,). No softmax before it.", "pt-training");
Card_("pt-tr-c2", "model.eval()", "Turns off Dropout and makes BatchNorm use running stats. Doesn't stop gradients: add torch.no_grad().", "pt-training");

// ───────────────────────── Keras ─────────────────────────
T("tf-keras", "foundations", "Keras", "Keras: Sequential and functional models, compile and fit", "Building, training and evaluating models in Keras 3, the losses and callbacks you'll use most, and how Keras differs from PyTorch.", `
**Keras 3** is a high-level API that runs on TensorFlow, JAX or PyTorch. Where PyTorch has you write the loop, Keras gives you \`compile\` and \`fit\`.

**Three ways to build a model.**
- **Sequential**, for a plain stack: \`keras.Sequential([keras.Input((784,)), layers.Dense(128, activation="relu"), layers.Dropout(0.2), layers.Dense(10)])\`.
- **Functional**, for branches, several inputs or outputs, and skip connections: \`inp = keras.Input((784,)); h = layers.Dense(128, activation="relu")(inp); out = layers.Dense(10)(h); model = keras.Model(inp, out)\`.
- **Subclassing** \`keras.Model\` with a \`call\` method, as in PyTorch, when you need arbitrary logic.

**compile, fit, evaluate, predict.**
\`\`\`
model.compile(optimizer=keras.optimizers.Adam(1e-3),
              loss=keras.losses.SparseCategoricalCrossentropy(from_logits=True),
              metrics=["accuracy"])
history = model.fit(x, y, batch_size=32, epochs=20, validation_split=0.2,
                    callbacks=[keras.callbacks.EarlyStopping(patience=3, restore_best_weights=True)])
model.evaluate(x_test, y_test); model.predict(x_new)
\`\`\`
- Steps per epoch = ⌈n / batch_size⌉. \`history.history\` holds the per-epoch losses and metrics.
- \`validation_split=0.2\` takes the **last** 20% of the arrays **before** shuffling. If the data is sorted (by date or by class), shuffle it yourself first, or pass \`validation_data\`.

**Choosing the loss.**
- Integer labels → \`sparse_categorical_crossentropy\`; one-hot labels → \`categorical_crossentropy\`.
- Binary → \`binary_crossentropy\`.
- \`from_logits=True\` when the last layer has no softmax or sigmoid (more stable). If the last layer already has an activation, leave it False. Mismatching the two is a common silent bug.

**Callbacks.**
- \`EarlyStopping(monitor="val_loss", patience, min_delta, restore_best_weights)\`: an epoch improves if loss + min_delta < best; training stops after \`patience\` epochs without improvement.
- \`ModelCheckpoint\`, \`ReduceLROnPlateau\`, \`TensorBoard\`.

**Parameters.** \`model.summary()\` lists them.
- Dense(u) after n inputs: (n + 1) · u.
- Conv2D(f, k) on c channels: k · k · c · f + f.
- LSTM(h) on x inputs: 4 · (h(x + h) + h), with one bias per gate (PyTorch has two).
- BatchNormalization has 4 values per feature, but only γ and β are trainable.

**Differences from PyTorch worth knowing.**
- Dense's kernel is (in, out); PyTorch's Linear weight is (out, in).
- Images default to (H, W, C) (channels last).
- BatchNormalization's momentum = 0.99 is the weight on the *old* value (PyTorch's 0.1 is the weight on the new one).
- \`model.fit\` handles train/eval modes for you; when calling the model directly, pass \`training=True/False\`.

**Worked example 1.** Input 10 → Dense(32) → Dense(1): (10 + 1) · 32 + (32 + 1) · 1 = 352 + 33 = 385 parameters.

**Worked example 2.** 1,050 samples with batch_size 32: ⌈1050/32⌉ = 33 steps per epoch (the last has 26 samples).

**Worked example 3.** Conv2D(16, 3) on an RGB image: 3 · 3 · 3 · 16 + 16 = 448 parameters.

**Worked example 4.** EarlyStopping(patience=2) with val_loss 1.0, 0.8, 0.7, 0.72, 0.71: epoch 3 is the best, epochs 4 and 5 don't improve, so training stops after epoch 5. With restore_best_weights=True the model ends with epoch 3's weights.
`, {
  resources: [yt("qFJeN9V1ZsI", "Keras with TensorFlow Course: Python Deep Learning and Neural Networks for Beginners", "freeCodeCamp"), yt("i8NETqtGHms", "TensorFlow in 100 Seconds", "Fireship"), KE("guides/sequential_model/", "The Sequential model"), KE("guides/functional_api/", "The Functional API"), KE("guides/training_with_built_in_methods/", "Training and evaluation with the built-in methods")],
  categories: ["tf/keras"],
  interview: [
    iq("Sequential, functional or subclassed: when do you use each in Keras?", "Sequential for a single linear stack of layers. The functional API for anything graph-shaped: several inputs or outputs, shared layers, residual connections; it's still declarative, so Keras can check shapes, plot it and serialise it. Subclassing keras.Model when the forward pass needs Python control flow or custom training logic, at the cost of less automatic checking and harder serialisation.", ["Sequential: linear stack", "Functional: DAGs, multi-IO, skips", "Subclass: custom logic, trade-offs"]),
    iq("What does from_logits mean in Keras losses, and what goes wrong if you get it wrong?", "It tells the loss whether y_pred is raw scores (True) or probabilities (False). With True, the loss applies the sigmoid or softmax internally in a numerically stable way. If the model outputs logits but from_logits=False, Keras clips the scores into [1e-7, 1 − 1e-7] and treats them as probabilities, so training is poor. If the model already ends in softmax and you set True, it applies softmax twice. Prefer a linear last layer with from_logits=True.", ["Logits vs probabilities", "Mismatch: clipping or double softmax", "Prefer logits + True"]),
    iq("How would you stop training at the right time in Keras?", "Monitor a validation metric with EarlyStopping(monitor='val_loss', patience=k, min_delta=…, restore_best_weights=True), so training stops after k epochs without a real improvement and the best epoch's weights are kept. Make sure the validation data is representative (validation_split takes the last fraction before shuffling), and combine it with ReduceLROnPlateau and a ModelCheckpoint that saves the best model to disk.", ["EarlyStopping with patience, min_delta", "restore_best_weights", "validation_split caveat; checkpoints"]),
  ],
});
calc("tf-ke-i1", "tf-keras", 1, 45, "How many trainable parameters does this Keras model have?\n\n```\nmodel = keras.Sequential([keras.Input((10,)), layers.Dense(32, activation=\"relu\"), layers.Dense(1)])\n```", 385, 0,
  "sizes = [10, 32, 1]\nanswer = sum((a + 1) * b for a, b in zip(sizes, sizes[1:]))",
  "(10 + 1) × 32 = 352 for the first Dense and (32 + 1) × 1 = 33 for the second: 385.", "(inputs + 1) × units per Dense layer.", "Forgetting the biases (320 + 32 = 352).", KE_SRC);
calc("tf-ke-i2", "tf-keras", 1, 30, "model.fit(x, y, batch_size=32, epochs=1) with 1,050 training samples (no validation split). How many steps (batches) does the epoch take?", 33, 0,
  "import math\nanswer = math.ceil(1050 / 32)",
  "1050 / 32 = 32.8: 32 full batches and one of 26, so 33 steps.", "⌈n / batch_size⌉.", "Using floor division (32).", KE_SRC);
calc("tf-ke-i3", "tf-keras", 1, 45, "How many parameters does `layers.Conv2D(16, 3)` have when its input is a 64 × 64 RGB image (3 channels)?", 448, 0,
  "k, c, f = 3, 3, 16\nanswer = k * k * c * f + f",
  "Each of the 16 filters has 3 × 3 × 3 = 27 weights plus a bias: 16 × 28 = 448. The image size doesn't matter.", "k² × in_channels × filters + filters.", "Multiplying by the image size, or forgetting the input channels (160).", KE_SRC);
Card_("tf-ke-c1", "Keras loss for integer labels", "sparse_categorical_crossentropy (one-hot → categorical_). from_logits=True if the last layer has no softmax.", "tf-keras");
Card_("tf-ke-c2", "validation_split", "Takes the last fraction of the data before shuffling. Shuffle sorted data first, or pass validation_data.", "tf-keras");
