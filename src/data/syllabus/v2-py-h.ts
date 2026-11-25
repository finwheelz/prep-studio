/**
 * v2 Python, part H: scikit-learn — estimator API and pipelines, ColumnTransformer and
 * preprocessing, model selection, metrics, common models and defaults, persistence, interview.
 * Fixed ids (py2-*); answers recomputed in Pyodide with scikit-learn.
 */
import { CHECKED, iq, lessonWriter } from "./v2-shared";

const { L, Q, C } = lessonWriter("python");
const M = "scikit-learn";
const src = (label: string, url: string) => ({ label, url, checked: CHECKED });
const S = {
  start: src("scikit-learn: getting started (estimators, transformers, pipelines)", "https://scikit-learn.org/stable/getting_started.html"),
  compose: src("scikit-learn user guide: pipelines and composite estimators", "https://scikit-learn.org/stable/modules/compose.html"),
  pre: src("scikit-learn user guide: preprocessing data", "https://scikit-learn.org/stable/modules/preprocessing.html"),
  impute: src("scikit-learn user guide: imputation of missing values", "https://scikit-learn.org/stable/modules/impute.html"),
  cv: src("scikit-learn user guide: cross-validation", "https://scikit-learn.org/stable/modules/cross_validation.html"),
  grid: src("scikit-learn user guide: tuning the hyper-parameters of an estimator", "https://scikit-learn.org/stable/modules/grid_search.html"),
  eval: src("scikit-learn user guide: metrics and scoring", "https://scikit-learn.org/stable/modules/model_evaluation.html"),
  lin: src("scikit-learn user guide: linear models", "https://scikit-learn.org/stable/modules/linear_model.html"),
  ens: src("scikit-learn user guide: ensembles (gradient boosting, random forests, bagging, voting, stacking)", "https://scikit-learn.org/stable/modules/ensemble.html"),
  persist: src("scikit-learn: model persistence", "https://scikit-learn.org/stable/model_persistence.html"),
  pitfalls: src("scikit-learn: common pitfalls and recommended practices", "https://scikit-learn.org/stable/common_pitfalls.html"),
};
const SK = ["scikit-learn", "numpy"];
const SKP = ["scikit-learn", "numpy", "pandas"];
const XY = `import numpy as np
from sklearn.datasets import make_classification
X, y = make_classification(n_samples=1000, n_features=8, weights=[0.8], random_state=0)
`;
const CUST = `import numpy as np, pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import make_pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder, OrdinalEncoder
df = pd.DataFrame({
    "age": [25, 32, np.nan, 41, 29, 50],
    "income": [30, 52, 41, np.nan, 38, 90],
    "city": ["Pune", "Delhi", "Pune", "Mumbai", np.nan, "Delhi"],
    "plan": ["basic", "pro", "pro", "basic", "basic", "premium"],
})
pre = ColumnTransformer([
    ("num", make_pipeline(SimpleImputer(strategy="median"), StandardScaler()), ["age", "income"]),
    ("cat", make_pipeline(SimpleImputer(strategy="most_frequent"), OneHotEncoder(handle_unknown="ignore")), ["city"]),
    ("ord", OrdinalEncoder(categories=[["basic", "pro", "premium"]]), ["plan"]),
])
`;
const METRICS = `import numpy as np
from sklearn import metrics as M
y_true = np.array([0, 0, 0, 0, 0, 0, 1, 1, 1, 1])
y_prob = np.array([0.1, 0.2, 0.3, 0.35, 0.4, 0.7, 0.45, 0.6, 0.8, 0.9])
`;
const QMET = "With `y_true = [0,0,0,0,0,0,1,1,1,1]` and `y_prob = [0.1, 0.2, 0.3, 0.35, 0.4, 0.7, 0.45, 0.6, 0.8, 0.9]`, ";

// ───────────────────────── Estimator API and pipelines ─────────────────────────

L("py2-skl-api", M, "The estimator API and pipelines", "fit / predict / transform, fitted attributes with a trailing underscore, train/test splitting, Pipeline and make_pipeline, and get_params / set_params.", {
  kind: "concept", mins: 25, mathsLabel: "Code",
  hook: "Every scikit-learn model, scaler and encoder shares the same three methods. Know them and you can use any of the library's hundreds of estimators without reading its docs first.",
  intuition: `
**The situation.** DS live-coding rounds often say "train a baseline on this data" and then watch how you split, preprocess and evaluate. Clean scikit-learn code signals you won't leak test data.

**The idea.** Everything is an **estimator** with one consistent interface:

- \`fit(X, y)\` learns from data and returns \`self\`. Learned values are stored as attributes ending in \`_\` (\`coef_\`, \`mean_\`, \`classes_\`). Hyperparameters are set in the constructor and stay unchanged.
- **Predictors** add \`predict(X)\` (and \`predict_proba\`, \`decision_function\`, \`score\`).
- **Transformers** add \`transform(X)\` and \`fit_transform(X)\` (scalers, encoders, imputers).
- \`X\` is 2-D (n_samples, n_features), \`y\` is 1-D.

A **Pipeline** chains transformers and a final estimator into one estimator. \`pipe.fit(X_train, y_train)\` fits each step on the training data only and passes the transformed data along; \`pipe.predict(X_test)\` applies the *already fitted* transforms. That is what prevents leakage, and it makes cross-validation and grid search treat preprocessing correctly.
`,
  maths: `
**In one breath.** \`train_test_split(stratify=y, random_state=…)\`; \`fit\` on train only; \`make_pipeline(StandardScaler(), LogisticRegression())\`; \`step__param\` names; \`clone\` gives an unfitted copy.

\`\`\`python
import numpy as np
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.base import clone

X, y = make_classification(n_samples=1000, n_features=8, weights=[0.8], random_state=0)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.25, stratify=y, random_state=0)
print(X_tr.shape, X_te.shape)          # (750, 8) (250, 8)
print(y_tr.mean().round(3), y_te.mean().round(3))   # 0.203 0.204  (stratify keeps the class share)

sc = StandardScaler().fit(X_tr)         # learns mean_ and scale_ from TRAIN only
print(sc.mean_.shape)                   # (8,)
print(sc.transform(X_tr).mean(0)[:2].round(6))   # [0. 0.]  exactly centred
print(sc.transform(X_te).mean(0)[:2].round(3))   # close to 0 but not exactly: that's correct

pipe = make_pipeline(StandardScaler(), LogisticRegression())
pipe.fit(X_tr, y_tr)
print(round(pipe.score(X_te, y_te), 3))          # accuracy, about 0.95
print(pipe.predict_proba(X_te[:2]).round(3))     # one row per sample, columns = classes_
print(list(pipe.named_steps))                    # ['standardscaler', 'logisticregression']
print(pipe.get_params()["logisticregression__C"])   # 1.0
pipe.set_params(logisticregression__C=0.1)       # how grid search changes steps
print(pipe[-1].coef_.shape)                      # (1, 8)

print(hasattr(LogisticRegression(), "coef_"))    # False: not fitted yet
print(hasattr(clone(pipe)[-1], "coef_"))         # False: clone copies params, not learned state
\`\`\`

**Shapes.** One sample must still be 2-D: \`model.predict(x.reshape(1, -1))\` or \`X[[0]]\`. \`predict_proba\` returns (n_samples, n_classes); the positive class is column 1 for binary 0/1 labels (check \`classes_\`).

**Pipeline vs make_pipeline.** \`Pipeline([("scale", StandardScaler()), ("clf", LogisticRegression())])\` names steps yourself; \`make_pipeline\` names them after the lower-cased class.
`,
  practice: `
**Baseline routine.** Split once (stratified, seeded) and keep the test set untouched; build a pipeline; compare against \`DummyClassifier\`; evaluate with cross-validation on the training set; touch the test set once at the end.

**Never** call \`fit\` or \`fit_transform\` on test data. If you see \`scaler.fit_transform(X_test)\` in code review, that's a bug.
`,
  traps: [
    { trap: "Scale the whole dataset first, then split.", why: "The scaler's mean and std then include test rows: leakage. Split first and fit preprocessing on the training set, ideally inside a pipeline." },
    { trap: "`clone(model)` copies a trained model.", why: "clone copies hyperparameters only and returns an unfitted estimator; use copy.deepcopy or pickle for a fitted copy." },
    { trap: "`model.predict(X[0])` predicts one row.", why: "X[0] is 1-D; estimators expect 2-D input and raise. Use X[[0]] or reshape(1, -1)." },
  ],
  say: {
    prompt: "Walk me through training a baseline classifier in scikit-learn so that nothing leaks from the test set.",
    secs: 45,
    check: ["Stratified, seeded train_test_split before anything else", "Pipeline of preprocessing + model, fit on train only", "fit / predict / transform semantics; learned attributes end in _", "Compare with a Dummy baseline; CV on train for model choice", "Test set used once at the end"],
    followups: [
      { q: "What's the difference between fit_transform and transform?", a: "fit_transform learns parameters (e.g. mean and std) and applies them; transform applies parameters already learned. Use fit_transform on train, transform on validation/test." },
      { q: "How do you set a parameter of a step inside a pipeline?", a: "With the step name, two underscores and the parameter: pipe.set_params(logisticregression__C=0.1), the same names grid search uses." },
      { q: "Why does predict_proba have two columns for a binary problem?", a: "One column per class in classes_ order; the positive-class probability is usually [:, 1]." },
    ],
    answer: `I'd split first with train_test_split, stratified on the label and seeded, and set the test set aside. Then I'd build a pipeline, for example make_pipeline(StandardScaler(), LogisticRegression()), so that fit on the training data learns the scaler's mean and standard deviation and the model's coefficients only from training rows, and predict applies the already-fitted transforms. Learned values live in attributes ending in an underscore, like mean_ and coef_. I'd compare against a DummyClassifier, choose settings with cross-validation on the training set, and only score the test set once at the end.`,
    avoid: ["fit_transform on the test set", "Preprocessing before splitting"],
  },
  terms: [["Estimator", "Object with fit; predictors add predict, transformers add transform."], ["Fitted attribute", "Learned value with a trailing underscore (coef_, mean_)."], ["Pipeline", "Chain of transformers plus a final estimator, itself an estimator."], ["clone", "Unfitted copy with the same hyperparameters."]],
  sources: [S.start, S.compose],
});
Q({ id: "py2-ska-1", d: 1, secs: 30, prompt: "`y` has 80 zeros and 20 ones. After `train_test_split(X, y, test_size=0.25, stratify=y, random_state=0)`, how many ones are in `y_test`?", answer: 5, tol: 0.5, explain: "Stratification keeps the 20% share: 25 test rows × 0.2.", py: "import numpy as np\nfrom sklearn.model_selection import train_test_split\ny = np.array([0] * 80 + [1] * 20); X = np.arange(100).reshape(-1, 1)\n_, _, _, y_te = train_test_split(X, y, test_size=0.25, stratify=y, random_state=0)\nanswer = int(y_te.sum())", packages: SK });
Q({ id: "py2-ska-2", d: 1, secs: 30, prompt: "In `make_pipeline(StandardScaler(), LogisticRegression())`, which key sets the model's C?", options: ["C", "LogisticRegression.C", "logisticregression__C", "step2__C"], answer: 2, explain: "make_pipeline names steps after the lower-cased class; parameters are step__param.", py: "from sklearn.pipeline import make_pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.linear_model import LogisticRegression\np = make_pipeline(StandardScaler(), LogisticRegression())\nanswer = ['C', 'LogisticRegression.C', 'logisticregression__C', 'step2__C'].index(next(k for k in p.get_params() if k.endswith('__C')))", packages: SK });
Q({ id: "py2-ska-3", d: 1, secs: 30, prompt: "Which attribute exists on a LogisticRegression only after `fit`?", options: ["C", "coef_", "max_iter", "solver"], answer: 1, explain: "Learned attributes end with an underscore; the others are constructor hyperparameters.", py: XY + "from sklearn.linear_model import LogisticRegression\nopts = ['C', 'coef_', 'max_iter', 'solver']\nm = LogisticRegression()\nbefore = [hasattr(m, o) for o in opts]\nm.fit(X, y)\nafter = [hasattr(m, o) for o in opts]\nanswer = [i for i in range(4) if after[i] and not before[i]][0]", packages: SK });
Q({ id: "py2-ska-4", d: 2, secs: 45, prompt: "Does `model.predict(X[0])` on a fitted classifier (X of shape (1000, 8)) raise an error? (1 = raises, 0 = works)", answer: 1, tol: 0.5, explain: "X[0] has shape (8,); estimators need 2-D input such as X[[0]].", py: XY + "from sklearn.linear_model import LogisticRegression\nm = LogisticRegression().fit(X, y)\ntry:\n    m.predict(X[0]); answer = 0\nexcept ValueError:\n    answer = 1", packages: SK });
Q({ id: "py2-ska-5", d: 2, secs: 45, prompt: "`clone(fitted_pipeline)[-1]` — does it have `coef_`? (1 = yes, 0 = no)", answer: 0, tol: 0.5, explain: "clone copies hyperparameters, not learned state.", py: XY + "from sklearn.base import clone\nfrom sklearn.pipeline import make_pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.linear_model import LogisticRegression\np = make_pipeline(StandardScaler(), LogisticRegression()).fit(X, y)\nanswer = int(hasattr(clone(p)[-1], 'coef_'))", packages: SK });
C("py2-ska-c1", "Estimator contract", "fit(X, y) → self; learned attrs end in _; predict / predict_proba / transform; X is 2-D.");
C("py2-ska-c2", "No-leak baseline", "Split (stratify, seed) → make_pipeline(prep, model).fit(train) → CV on train → test once.");

// ───────────────────────── ColumnTransformer and preprocessing ─────────────────────────

L("py2-skl-preprocess", M, "ColumnTransformer and preprocessing", "Scaling, one-hot and ordinal encoding, imputation, handling unseen categories, and routing each column type through its own steps.", {
  kind: "concept", mins: 25, mathsLabel: "Code",
  hook: "A churn table has numbers with gaps, a city column with a category the test set has never seen, and an ordered plan tier. One object should handle all three — and survive a new city in production.",
  intuition: `
**The situation.** Real tabular data mixes numeric and categorical columns. Interviewers check that you encode categories sensibly, impute without leaking, and don't crash when production sends a new category.

**The idea.** A **ColumnTransformer** sends lists of columns through different transformers and concatenates the outputs side by side:

- **Numeric:** \`SimpleImputer(strategy="median")\` then \`StandardScaler\` (needed for distance- and gradient-based models; trees don't care).
- **Nominal categorical:** \`SimpleImputer(strategy="most_frequent")\` (or a constant "missing") then \`OneHotEncoder(handle_unknown="ignore")\`, so unseen categories become all-zero rows instead of errors.
- **Ordinal:** \`OrdinalEncoder(categories=[[...]])\` with the order spelled out; otherwise it sorts alphabetically.
- **Columns not listed** are dropped by default (\`remainder="drop"\`); use \`"passthrough"\` to keep them.

Put the ColumnTransformer inside a Pipeline with the model, and the whole thing fits and predicts from a raw DataFrame.
`,
  maths: `
**In one breath.** \`ColumnTransformer([(name, transformer, columns), ...], remainder=)\`; numeric = impute + scale; nominal = impute + one-hot(ignore unknown); ordinal = explicit categories; \`get_feature_names_out()\`.

\`\`\`python
import numpy as np, pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import make_pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder, OrdinalEncoder
from sklearn.linear_model import LogisticRegression

df = pd.DataFrame({
    "age": [25, 32, np.nan, 41, 29, 50],
    "income": [30, 52, 41, np.nan, 38, 90],
    "city": ["Pune", "Delhi", "Pune", "Mumbai", np.nan, "Delhi"],
    "plan": ["basic", "pro", "pro", "basic", "basic", "premium"],
})
y = np.array([0, 1, 0, 1, 0, 1])

pre = ColumnTransformer([
    ("num", make_pipeline(SimpleImputer(strategy="median"), StandardScaler()), ["age", "income"]),
    ("cat", make_pipeline(SimpleImputer(strategy="most_frequent"),
                          OneHotEncoder(handle_unknown="ignore")), ["city"]),
    ("ord", OrdinalEncoder(categories=[["basic", "pro", "premium"]]), ["plan"]),
])
Z = pre.fit_transform(df)
print(Z.shape)                                   # (6, 6)
print(pre.get_feature_names_out().tolist())
# ['num__age', 'num__income', 'cat__city_Delhi', 'cat__city_Mumbai', 'cat__city_Pune', 'ord__plan']
print(pre.named_transformers_["num"][0].statistics_)   # [32. 41.]  medians learned on fit

new = pd.DataFrame({"age": [30], "income": [45], "city": ["Chennai"], "plan": ["pro"]})
print(pre.transform(new).round(3))
# [[-0.581 -0.187  0.  0.  0.  1. ]]   unseen 'Chennai' -> all-zero one-hot, no error

model = make_pipeline(pre, LogisticRegression()).fit(df, y)
print(model.predict(new))                        # works end to end from a raw DataFrame
\`\`\`

**Other tools.** \`MinMaxScaler\` (to [0, 1]), \`RobustScaler\` (median/IQR, outlier-resistant), \`OneHotEncoder(drop="first")\` for unregularised linear models, \`min_frequency\`/\`max_categories\` to group rare levels, \`make_column_selector(dtype_include="number")\` to pick columns by dtype, \`FunctionTransformer(np.log1p)\` for custom maths, and \`set_output(transform="pandas")\` to get DataFrames out.

**Cost.** One-hot width = number of categories; a 50,000-level ID column creates 50,000 sparse columns. Group rare levels, target-encode (\`TargetEncoder\`, which cross-fits internally), or let a tree model with native categorical support handle it.
`,
  practice: `
**Which encoding?** Linear/kNN/SVM/neural nets: scale numbers, one-hot nominal categories. Tree ensembles: no scaling; ordinal codes are usually fine, and \`HistGradientBoosting\` accepts categorical features directly. High cardinality: rare-level grouping or target encoding with cross-fitting.

**Production.** Always \`handle_unknown="ignore"\` (or "infrequent_if_exist"); fit imputers inside the pipeline so production uses training medians; keep column names stable and pass a DataFrame so the pipeline checks them.
`,
  traps: [
    { trap: "`OrdinalEncoder()` keeps the natural order of tiers.", why: "Without categories=[...] it sorts alphabetically (basic, premium, pro), scrambling the order. Pass the order explicitly." },
    { trap: "One-hot encode with `pd.get_dummies` on train and test separately.", why: "Different category sets produce different columns. A fitted OneHotEncoder guarantees the same columns and handles unseen values." },
    { trap: "Columns you didn't list in the ColumnTransformer are passed through.", why: "The default remainder='drop' silently drops them. Set remainder='passthrough' if you need them." },
  ],
  say: {
    prompt: "How would you preprocess a table with numeric columns with missing values, a nominal city column and an ordered plan tier for a logistic regression?",
    secs: 45,
    check: ["ColumnTransformer routing columns by type", "Numeric: median imputation + StandardScaler", "Nominal: impute + OneHotEncoder(handle_unknown='ignore')", "Ordinal: OrdinalEncoder with explicit categories", "All inside a Pipeline with the model; fit on train only; remainder behaviour"],
    followups: [
      { q: "What happens when production sends a city the model never saw?", a: "With handle_unknown='ignore' its one-hot columns are all zero, so the model uses only the other features; without it, transform raises." },
      { q: "Do tree models need scaling?", a: "No: splits depend only on order within a feature. They still need categories encoded (or native categorical support)." },
      { q: "How do you handle a city column with 3,000 levels?", a: "Group rare levels (min_frequency), target-encode with cross-fitting, or use a model with native categorical handling; plain one-hot gives 3,000 sparse columns." },
    ],
    answer: `I'd use a ColumnTransformer with three branches. Numeric columns go through SimpleImputer with the median, then StandardScaler, since logistic regression is sensitive to scale. City goes through a most-frequent or constant imputer and then OneHotEncoder with handle_unknown="ignore", so an unseen city becomes an all-zero row instead of an error. The plan tier goes through OrdinalEncoder with the categories listed in order, because otherwise it sorts alphabetically. I'd put the ColumnTransformer and the model in one Pipeline and fit it on the training split, so imputation medians and scaling come only from training data, and I'd remember that unlisted columns are dropped unless remainder="passthrough".`,
    avoid: ["get_dummies separately on train and test", "Scaling one-hot columns without thinking"],
  },
  terms: [["ColumnTransformer", "Applies different transformers to different column subsets."], ["handle_unknown", "OneHotEncoder option for categories unseen at fit time."], ["SimpleImputer", "Fills missing values with a learned statistic or constant."], ["remainder", "What happens to columns not listed (drop or passthrough)."]],
  sources: [S.pre, S.compose, S.impute],
});
Q({ id: "py2-skp-1", d: 2, secs: 45, prompt: "In the lesson's ColumnTransformer (2 numeric columns, city with values Pune/Delhi/Mumbai plus a missing value, ordinal plan), how many output columns does `fit_transform` produce?", answer: 6, tol: 0.5, explain: "2 scaled numbers + 3 one-hot cities (missing imputed to a known city) + 1 ordinal column.", py: CUST + "answer = pre.fit_transform(df).shape[1]", packages: SKP });
Q({ id: "py2-skp-2", d: 1, secs: 30, prompt: "`SimpleImputer(strategy='median')` fitted on age `[25, 32, NaN, 41, 29, 50]`. What value fills the gap?", answer: 32, tol: 0.5, explain: "Median of 25, 29, 32, 41, 50.", py: "import numpy as np\nfrom sklearn.impute import SimpleImputer\nanswer = float(SimpleImputer(strategy='median').fit(np.array([[25], [32], [np.nan], [41], [29], [50]])).statistics_[0])", packages: SK });
Q({ id: "py2-skp-3", d: 2, secs: 45, prompt: "After fitting the lesson's transformer, a new row has city 'Chennai'. What is the sum of its three city one-hot columns?", answer: 0, tol: 0.5, explain: "handle_unknown='ignore' encodes unseen categories as all zeros.", py: CUST + "pre.fit(df)\nnew = pd.DataFrame({'age': [30], 'income': [45], 'city': ['Chennai'], 'plan': ['pro']})\nanswer = float(pre.transform(new)[0, 2:5].sum())", packages: SKP });
Q({ id: "py2-skp-4", d: 2, secs: 45, prompt: "`OrdinalEncoder()` (no categories given) fitted on ['basic', 'pro', 'premium']. What code does 'pro' get?", answer: 2, tol: 0.5, explain: "Alphabetical order: basic 0, premium 1, pro 2. Pass categories to fix the order.", py: "import numpy as np\nfrom sklearn.preprocessing import OrdinalEncoder\ne = OrdinalEncoder().fit(np.array([['basic'], ['pro'], ['premium']]))\nanswer = float(e.transform(np.array([['pro']]))[0, 0])", packages: SK });
Q({ id: "py2-skp-5", d: 1, secs: 30, prompt: "`OneHotEncoder(drop='first')` on a column with 3 categories produces how many columns?", answer: 2, tol: 0.5, explain: "k − 1 columns; the first category becomes the all-zero baseline.", py: "import numpy as np\nfrom sklearn.preprocessing import OneHotEncoder\nanswer = OneHotEncoder(drop='first').fit_transform(np.array([['a'], ['b'], ['c']])).shape[1]", packages: SK });
C("py2-skp-c1", "Mixed-type preprocessing", "ColumnTransformer: num → impute(median) + scale; cat → impute + OneHot(handle_unknown='ignore'); ordinal → explicit categories.");
C("py2-skp-c2", "ColumnTransformer gotchas", "remainder='drop' by default; OrdinalEncoder sorts alphabetically unless told; fit inside the pipeline.");

// ───────────────────────── Model selection ─────────────────────────

L("py2-skl-select", M, "Model selection: cross-validation and hyperparameter search", "KFold vs StratifiedKFold vs GroupKFold vs TimeSeriesSplit, cross_val_score and cross_validate, GridSearchCV and RandomizedSearchCV, and leakage through feature selection.", {
  kind: "concept", mins: 30, mathsLabel: "Code",
  hook: "You pick the 20 best of 5,000 random features on the full data, then cross-validate: 85% accuracy on pure noise. What went wrong, and which scikit-learn object fixes it?",
  intuition: `
**The situation.** "How did you choose your hyperparameters?" is asked in nearly every DS interview. The answer must separate data for fitting, for choosing and for the final estimate.

**The idea.**

- **Cross-validation** splits the training set into k folds, fits on k−1 and scores on the held-out one, k times. The mean estimates performance; the spread shows how stable it is.
- **Choose the splitter to match how data arrives:** \`StratifiedKFold\` keeps class shares (default for classifiers when you pass \`cv=5\`); \`GroupKFold\` keeps all rows of a customer/patient in the same fold; \`TimeSeriesSplit\` always trains on the past and tests on the future.
- **GridSearchCV** tries every combination in a grid, cross-validating each, then refits the best on the whole training set. **RandomizedSearchCV** samples \`n_iter\` combinations: better when there are many parameters.
- **Nested logic.** The CV score of the best grid point is optimistic (you picked the maximum). Keep a final test set, or use nested CV, for an unbiased number.
- **Leakage.** Anything learned from data (scaling, imputation, feature selection, target encoding) must happen inside each training fold, which is automatic if it's in the Pipeline you pass to CV.
`,
  maths: `
**In one breath.** \`cross_val_score(pipe, X, y, cv=StratifiedKFold(5, shuffle=True, random_state=0), scoring="roc_auc")\`; \`GridSearchCV(pipe, {"step__param": [...]}, cv=…)\` → \`best_params_\`, \`best_score_\`, \`best_estimator_\`; fits = combinations × folds (+1 refit).

\`\`\`python
from sklearn.model_selection import (StratifiedKFold, cross_val_score, cross_validate,
                                     GridSearchCV, TimeSeriesSplit, GroupKFold)
from sklearn.feature_selection import SelectKBest, f_classif

pipe = make_pipeline(StandardScaler(), LogisticRegression())
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=0)
scores = cross_val_score(pipe, X_tr, y_tr, cv=cv, scoring="roc_auc")
print(scores.round(3), scores.mean().round(3))   # five fold AUCs, mean about 0.98

grid = GridSearchCV(pipe, {"logisticregression__C": [0.01, 0.1, 1, 10]},
                    cv=cv, scoring="roc_auc")
grid.fit(X_tr, y_tr)                              # 4 settings x 5 folds = 20 fits, + 1 refit
print(grid.best_params_, round(grid.best_score_, 3))
print(round(grid.score(X_te, y_te), 3))           # final, untouched test estimate

r = cross_validate(pipe, X_tr, y_tr, cv=cv, scoring=["roc_auc", "f1"], return_train_score=True)
print(sorted(r))   # ['fit_time', 'score_time', 'test_f1', 'test_roc_auc', 'train_f1', 'train_roc_auc']

for tr, te in TimeSeriesSplit(n_splits=3).split(np.arange(12)):
    print(tr.tolist(), te.tolist())
# [0, 1, 2] [3, 4, 5]
# [0, 1, 2, 3, 4, 5] [6, 7, 8]
# [0, 1, 2, 3, 4, 5, 6, 7, 8] [9, 10, 11]     train always precedes test

# Leakage: feature selection outside vs inside CV, on pure noise
rng = np.random.default_rng(0)
Xn, yn = rng.normal(size=(100, 5000)), rng.integers(0, 2, 100)
sel = SelectKBest(f_classif, k=20).fit(Xn, yn)              # saw all labels
leaky = cross_val_score(LogisticRegression(), sel.transform(Xn), yn, cv=5).mean()
honest = cross_val_score(make_pipeline(SelectKBest(f_classif, k=20), LogisticRegression()),
                         Xn, yn, cv=5).mean()
print(round(leaky, 2), round(honest, 2))   # 0.85 0.48: noise looks predictive when selection leaks
\`\`\`

**Cost.** Grid search cost = (product of grid sizes) × folds × one fit. Four parameters with five values each and 5-fold CV is 3,125 fits; that's when to switch to RandomizedSearchCV or successive halving. \`n_jobs=-1\` parallelises across cores.

**Gotchas.** \`cv=5\` doesn't shuffle; data sorted by class or time then gives odd folds (for classifiers it is stratified, which helps). Shuffling time-ordered or grouped data inflates scores. \`best_score_\` is optimistic.
`,
  practice: `
**What to say.** "I held out a test set, tuned with stratified 5-fold CV inside a pipeline, scored with the metric that matches the business goal, and reported the test score once. For data with repeated customers I'd use GroupKFold; for forecasting, TimeSeriesSplit."

**Search spaces.** Regularisation strengths on a log scale (0.001…100). Use \`loguniform\` distributions with RandomizedSearchCV. Inspect \`cv_results_\` as a DataFrame: if the best value sits on the edge of the grid, extend the grid.
`,
  traps: [
    { trap: "`grid.best_score_` is an unbiased estimate of future performance.", why: "It's the maximum over many settings, so it's optimistic. Report a held-out test score or use nested CV." },
    { trap: "Feature selection before CV is fine because it doesn't use the model.", why: "SelectKBest uses the labels; selecting on all data leaks the validation folds' labels. Put it inside the pipeline." },
    { trap: "Random K-fold is fine for time series if you shuffle.", why: "It trains on the future to predict the past; use TimeSeriesSplit (and a gap if features use lagged windows)." },
  ],
  say: {
    prompt: "How do you tune hyperparameters and estimate the final performance without fooling yourself?",
    secs: 45,
    check: ["Hold out a test set first", "Pipeline so preprocessing/selection refit inside each fold", "Splitter matches the data: Stratified, Group, TimeSeries", "GridSearchCV/RandomizedSearchCV with an appropriate scoring metric; refit", "best_score_ is optimistic → test set once or nested CV"],
    followups: [
      { q: "Grid vs randomised search?", a: "Grid tries every combination, fine for one or two parameters; randomised samples a fixed budget from distributions, much more efficient when only a few of many parameters matter." },
      { q: "When would you use GroupKFold?", a: "When several rows belong to one entity (customer, patient, device), so the same entity never appears in both train and validation." },
      { q: "How many fits does a 3 × 4 grid with 5-fold CV run?", a: "12 settings × 5 folds = 60, plus one refit of the best on the full training set." },
    ],
    answer: `I'd split off a test set first and not touch it. On the training set I'd run GridSearchCV, or RandomizedSearchCV when there are several parameters, over a pipeline that contains all preprocessing, so scaling, imputation or feature selection are refit inside every fold and the validation fold never leaks in. The splitter matches how data arrives: stratified folds for imbalanced classes, GroupKFold when customers repeat, TimeSeriesSplit for forecasting. I'd score with the metric that matches the goal, like ROC AUC or recall at a precision floor. The search refits the best setting on the full training set; its best_score_ is optimistic because it's a maximum, so the number I report is the test score, computed once, or a nested CV estimate.`,
    avoid: ["Tuning on the test set", "Preprocessing outside CV"],
  },
  terms: [["Cross-validation", "Rotate validation folds to estimate generalisation."], ["StratifiedKFold", "Folds keep class proportions."], ["GroupKFold", "Folds keep each group entirely on one side."], ["Nested CV", "Outer CV for estimation around an inner CV for tuning."]],
  sources: [S.cv, S.grid, S.pitfalls],
});
Q({ id: "py2-skcv-1", d: 1, secs: 30, prompt: "`TimeSeriesSplit(n_splits=3)` on 12 ordered samples. How many training samples are in the last split?", answer: 9, tol: 0.5, explain: "Test folds of 3; the last split trains on samples 0–8.", py: "import numpy as np\nfrom sklearn.model_selection import TimeSeriesSplit\nanswer = len(list(TimeSeriesSplit(n_splits=3).split(np.arange(12)))[-1][0])", packages: SK });
Q({ id: "py2-skcv-2", d: 1, secs: 45, prompt: "GridSearchCV with a grid of 4 C values and 5-fold CV, refit=True. How many model fits in total?", answer: 21, tol: 0.5, explain: "4 × 5 = 20 CV fits plus one refit on the full training set.", py: "n_settings, folds = 4, 5\nanswer = n_settings * folds + 1" });
Q({ id: "py2-skcv-3", d: 2, secs: 45, prompt: "y has 80 zeros and 20 ones. With `StratifiedKFold(5)`, how many ones are in each validation fold?", answer: 4, tol: 0.5, explain: "Stratification keeps the 20% share: 20 rows × 0.2.", py: "import numpy as np\nfrom sklearn.model_selection import StratifiedKFold\ny = np.array([0] * 80 + [1] * 20)\nc = [int(y[te].sum()) for _, te in StratifiedKFold(5).split(np.zeros(100), y)]\nanswer = c[0] if len(set(c)) == 1 else -1", packages: SK });
Q({ id: "py2-skcv-4", d: 2, secs: 45, prompt: "12 rows from 6 customers (2 rows each), `GroupKFold(n_splits=3)`. Across all splits, how many customers appear in both train and validation of the same split?", answer: 0, tol: 0.5, explain: "GroupKFold keeps every group entirely on one side.", py: "import numpy as np\nfrom sklearn.model_selection import GroupKFold\ng = np.repeat(np.arange(6), 2)\nanswer = sum(len(set(g[tr]) & set(g[te])) for tr, te in GroupKFold(n_splits=3).split(np.zeros(12), groups=g))", packages: SK });
Q({ id: "py2-skcv-5", d: 3, secs: 90, prompt: "Pure noise: 100 rows, 5,000 random features, random labels. Selecting 20 features with SelectKBest on all data before 5-fold CV vs inside a pipeline. Is the leaky CV accuracy at least 0.2 higher? (1 = yes, 0 = no)", answer: 1, tol: 0.5, explain: "Selection saw the validation labels, so noise features look predictive; inside the pipeline accuracy falls to about chance.", py: "import numpy as np\nfrom sklearn.feature_selection import SelectKBest, f_classif\nfrom sklearn.linear_model import LogisticRegression\nfrom sklearn.model_selection import cross_val_score\nfrom sklearn.pipeline import make_pipeline\nrng = np.random.default_rng(0)\nXn, yn = rng.normal(size=(100, 5000)), rng.integers(0, 2, 100)\nleak = cross_val_score(LogisticRegression(), SelectKBest(f_classif, k=20).fit(Xn, yn).transform(Xn), yn, cv=5).mean()\nhon = cross_val_score(make_pipeline(SelectKBest(f_classif, k=20), LogisticRegression()), Xn, yn, cv=5).mean()\nanswer = 1 if leak - hon >= 0.2 else 0", packages: SK });
C("py2-skcv-c1", "Pick the splitter", "Imbalanced → StratifiedKFold; repeated entities → GroupKFold; time → TimeSeriesSplit; all inside a Pipeline.");
C("py2-skcv-c2", "Search cost and bias", "fits = combos × folds + 1 refit. best_score_ is optimistic → report the test set once.");

// ───────────────────────── Metrics and scoring ─────────────────────────

L("py2-skl-metrics", M, "Metrics and scoring", "Confusion matrix, precision/recall/F1 and thresholds, ROC AUC vs average precision, log loss, regression errors, averaging for multiclass and scoring strings.", {
  kind: "concept", mins: 25, mathsLabel: "Code",
  hook: "Your fraud model has 95% accuracy on data that's 95% legitimate. Which three lines of scikit-learn show the interviewer what it really does?",
  intuition: `
**The situation.** Interviewers give you predictions and ask for the right metric, or ask why a metric moved. You need the definitions and the scikit-learn calls.

**The idea.**

- **Threshold metrics** work on hard labels (\`predict\`, or \`proba >= t\`): \`confusion_matrix\`, accuracy, precision = TP/(TP+FP), recall = TP/(TP+FN), F1 = harmonic mean. Moving the threshold trades precision against recall.
- **Ranking metrics** work on scores (\`predict_proba[:, 1]\`): ROC AUC (probability a random positive scores above a random negative; insensitive to class balance) and average precision (area under the precision-recall curve; focuses on the positive class, better for rare positives).
- **Probability quality:** \`log_loss\` and \`brier_score_loss\` punish confident wrong probabilities; needed when probabilities feed pricing or expected-loss maths.
- **Regression:** MAE (robust, in units), RMSE (punishes big errors), R² (share of variance explained, can be negative).
- **Multiclass averaging:** \`macro\` (each class equal), \`weighted\` (by support), \`micro\` (pool all decisions; equals accuracy for single-label).
- **Scoring strings** for CV/search: \`"roc_auc"\`, \`"average_precision"\`, \`"f1"\`, \`"neg_log_loss"\`, \`"neg_root_mean_squared_error"\`; error metrics are negated so higher is always better.
`,
  maths: `
**In one breath.** \`confusion_matrix(y, ŷ)\` rows = truth, columns = prediction; precision/recall/F1 on labels; \`roc_auc_score\` and \`average_precision_score\` on probabilities; \`neg_\` scorers; \`average=\` for multiclass.

\`\`\`python
import numpy as np
from sklearn.metrics import (confusion_matrix, accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, average_precision_score, log_loss, balanced_accuracy_score,
    mean_absolute_error, mean_squared_error, r2_score)

y_true = np.array([0, 0, 0, 0, 0, 0, 1, 1, 1, 1])
y_prob = np.array([0.1, 0.2, 0.3, 0.35, 0.4, 0.7, 0.45, 0.6, 0.8, 0.9])
y_pred = (y_prob >= 0.5).astype(int)
print(confusion_matrix(y_true, y_pred))
# [[5 1]      TN FP
#  [1 3]]     FN TP
print(accuracy_score(y_true, y_pred), precision_score(y_true, y_pred),
      recall_score(y_true, y_pred), round(f1_score(y_true, y_pred), 3))   # 0.8 0.75 0.75 0.75
low = (y_prob >= 0.4).astype(int)
print(round(precision_score(y_true, low), 3), recall_score(y_true, low))  # 0.667 1.0  lower threshold
print(round(roc_auc_score(y_true, y_prob), 3), round(average_precision_score(y_true, y_prob), 3))
# 0.917 0.887   (22 of 24 positive-negative pairs ranked correctly)
print(round(log_loss(y_true, y_prob), 3))         # 0.447

rare = np.r_[np.zeros(95), np.ones(5)]
print(accuracy_score(rare, np.zeros(100)), balanced_accuracy_score(rare, np.zeros(100)))   # 0.95 0.5

print(f1_score([0, 1, 2, 2], [0, 2, 2, 2], average="macro"),
      f1_score([0, 1, 2, 2], [0, 2, 2, 2], average="micro"))     # 0.6 0.75

yt, yh = np.array([3., 5., 2., 7.]), np.array([2.5, 5., 4., 6.])
print(mean_absolute_error(yt, yh), round(mean_squared_error(yt, yh) ** 0.5, 3), round(r2_score(yt, yh), 3))
# 0.875 1.146 0.644
\`\`\`

**Threshold tuning.** \`precision_recall_curve(y, p)\` gives every threshold's precision and recall; choose the one that meets the business constraint (for example, recall at precision ≥ 0.9) on validation data, not test data. ROC AUC doesn't change with the threshold.

**Gotchas.** Passing hard labels to \`roc_auc_score\` gives a much cruder AUC; pass probabilities. \`precision_score\` with no predicted positives warns and returns 0 (\`zero_division\` controls it). Label order: \`confusion_matrix\` sorts labels unless you pass \`labels=\`.
`,
  practice: `
**Pick by cost.** Missed fraud expensive → recall at a precision floor; false alarms expensive → precision at k; ranking quality on rare positives → average precision; calibrated risk for pricing → log loss / Brier plus a calibration plot; skewed revenue targets → MAE or RMSE on log scale.

**Report.** Confusion matrix at the chosen threshold, the threshold itself, and a baseline (\`DummyClassifier\`) so the number has context.
`,
  traps: [
    { trap: "95% accuracy means the model is good.", why: "On 95/5 data, predicting all negatives gets 95%. Check recall, precision, balanced accuracy or AUC/AP against a dummy baseline." },
    { trap: "ROC AUC is the best metric for rare positives.", why: "With many negatives, ROC can look excellent while precision is poor; average precision (PR AUC) reflects performance on the rare class." },
    { trap: "`scoring='mean_squared_error'` in GridSearchCV.", why: "Scorers must be 'higher is better': use 'neg_mean_squared_error' or 'neg_root_mean_squared_error'." },
  ],
  say: {
    prompt: "You're evaluating a fraud model where 1% of transactions are fraud. Which metrics do you report and why?",
    secs: 45,
    check: ["Accuracy is misleading at 1% prevalence; show a dummy baseline", "Precision, recall, F1 at a chosen threshold; confusion matrix", "Average precision (PR AUC) over ROC AUC for rare positives", "Choose the threshold from business costs on validation data", "Calibration/log loss if probabilities drive decisions"],
    followups: [
      { q: "What does ROC AUC = 0.9 mean?", a: "A randomly chosen positive gets a higher score than a randomly chosen negative 90% of the time." },
      { q: "Macro vs weighted F1?", a: "Macro averages per-class F1 equally, so small classes count fully; weighted averages by class support, so it follows the big classes." },
      { q: "Why are some scorers named neg_…?", a: "scikit-learn maximises scores; error metrics are negated so higher is better." },
    ],
    answer: `At 1% fraud, accuracy is useless because predicting "not fraud" scores 99%, so I'd always show a dummy baseline. For ranking quality I'd report average precision, the area under the precision-recall curve, because ROC AUC is dominated by the huge number of easy negatives and can look great while precision is poor. Then I'd pick an operating threshold from the business trade-off, say the highest recall with precision above some floor, choose it on validation data with precision_recall_curve, and report the confusion matrix, precision and recall at that threshold. If the scores feed expected-loss calculations, I'd also check calibration and log loss.`,
    avoid: ["Leading with accuracy", "Hard labels into roc_auc_score"],
  },
  terms: [["Precision / recall", "TP/(TP+FP) and TP/(TP+FN)."], ["ROC AUC", "Probability a positive outranks a negative."], ["Average precision", "Area under the precision-recall curve."], ["neg_ scorer", "Negated error so higher is better in model selection."]],
  sources: [S.eval],
});
Q({ id: "py2-skm-1", d: 1, secs: 45, prompt: QMET + "what is precision at threshold 0.5?", answer: 0.75, tol: 0.01, explain: "Predicted positives 0.7, 0.6, 0.8, 0.9; three are true.", py: METRICS + "answer = float(M.precision_score(y_true, (y_prob >= 0.5).astype(int)))", packages: SK });
Q({ id: "py2-skm-2", d: 1, secs: 45, prompt: QMET + "what is recall at threshold 0.4?", answer: 1, tol: 0.01, explain: "All four positives (0.45, 0.6, 0.8, 0.9) are at or above 0.4.", py: METRICS + "answer = float(M.recall_score(y_true, (y_prob >= 0.4).astype(int)))", packages: SK });
Q({ id: "py2-skm-3", d: 2, secs: 60, prompt: QMET + "what is the ROC AUC? (3 decimals)", answer: 0.917, tol: 0.002, explain: "Of 24 positive-negative pairs, 22 are ordered correctly (0.45 < 0.7 and 0.6 < 0.7 are the two misses).", py: METRICS + "answer = round(float(M.roc_auc_score(y_true, y_prob)), 3)", packages: SK });
Q({ id: "py2-skm-4", d: 1, secs: 30, prompt: "95 negatives and 5 positives; the model predicts all negatives. What is the balanced accuracy?", answer: 0.5, tol: 0.01, explain: "Recall 1.0 on negatives, 0 on positives; their mean is 0.5 (plain accuracy is 0.95).", py: "import numpy as np\nfrom sklearn.metrics import balanced_accuracy_score\nanswer = float(balanced_accuracy_score(np.r_[np.zeros(95), np.ones(5)], np.zeros(100)))", packages: SK });
Q({ id: "py2-skm-5", d: 2, secs: 60, prompt: "`y_true = [0, 1, 2, 2]`, `y_pred = [0, 2, 2, 2]`. Macro F1? (2 decimals)", answer: 0.6, tol: 0.01, explain: "Per-class F1: class 0 = 1, class 1 = 0, class 2 = 0.8; mean 0.6. Micro F1 = accuracy = 0.75.", py: "from sklearn.metrics import f1_score\nanswer = round(float(f1_score([0, 1, 2, 2], [0, 2, 2, 2], average='macro', zero_division=0)), 2)", packages: SK });
Q({ id: "py2-skm-6", d: 1, secs: 45, prompt: "`y = [3, 5, 2, 7]`, predictions `[2.5, 5, 4, 6]`. RMSE? (3 decimals)", answer: 1.146, tol: 0.002, explain: "Squared errors 0.25, 0, 4, 1 → mean 1.3125 → √ = 1.146.", py: "import numpy as np\nfrom sklearn.metrics import mean_squared_error\nanswer = round(float(np.sqrt(mean_squared_error([3, 5, 2, 7], [2.5, 5, 4, 6]))), 3)", packages: SK });
C("py2-skm-c1", "Confusion matrix layout", "sklearn: rows = truth, cols = prediction → [[TN, FP], [FN, TP]] for labels 0/1.");
C("py2-skm-c2", "Metric by situation", "Rare positives → average precision + recall@precision; ranking → ROC AUC; probabilities → log loss/Brier; CV scorers are 'higher is better' (neg_…).");

// ───────────────────────── Common models and defaults ─────────────────────────

L("py2-skl-models", M, "Common models and their defaults", "What LogisticRegression, Ridge/Lasso, kNN, SVC, decision trees, random forests and HistGradientBoosting do by default, what to tune first, and which need scaling or handle missing values.", {
  kind: "concept", mins: 25, mathsLabel: "Code",
  hook: "'Why did you choose a random forest, and what did you leave at default?' You should be able to name the defaults of the six models you're most likely to use.",
  intuition: `
**The situation.** A take-home usually ends with a model comparison. Interviewers probe whether you know what each model assumes, what its defaults do, and which knob matters.

**The idea.** Know a short list well:

| Model | Key defaults | Tune first | Scale? | NaN OK? |
|---|---|---|---|---|
| \`LogisticRegression\` | L2 penalty, \`C=1.0\` (C = 1/strength), \`max_iter=100\` | C, class_weight | yes | no |
| \`Ridge\` / \`Lasso\` | \`alpha=1.0\` | alpha | yes | no |
| \`KNeighborsClassifier\` | \`n_neighbors=5\`, Euclidean | n_neighbors | yes | no |
| \`SVC\` | RBF kernel, \`C=1.0\`, \`gamma="scale"\` | C, gamma | yes | no |
| \`DecisionTreeClassifier\` | grown until leaves are pure (\`max_depth=None\`) | max_depth, min_samples_leaf | no | yes (1.3+) |
| \`RandomForestClassifier\` | \`n_estimators=100\`, \`max_features="sqrt"\`, full-depth trees | min_samples_leaf, max_features | no | yes (1.4+) |
| \`HistGradientBoostingClassifier\` | \`learning_rate=0.1\`, \`max_iter=100\`, \`max_leaf_nodes=31\`, early stopping when n > 10,000 | learning_rate, max_iter, max_leaf_nodes | no | yes, natively |

Always start with \`DummyClassifier\` (predicts the prior) and a regularised linear model; then a gradient-boosted tree model for tabular data. In recent scikit-learn releases the L1/L2 choice in LogisticRegression is moving from \`penalty\` to \`l1_ratio\`; the default is still L2-style with C=1.
`,
  maths: `
**In one breath.** Dummy → linear (scaled) → HistGradientBoosting; read defaults with \`get_params()\`; trees overfit at default depth; forests reduce variance by averaging; boosting reduces bias by adding small trees.

\`\`\`python
from sklearn.dummy import DummyClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier

X, y = make_classification(n_samples=1000, n_features=8, weights=[0.8], random_state=0)
cv = StratifiedKFold(5, shuffle=True, random_state=0)
models = {
    "dummy":  DummyClassifier(strategy="prior"),
    "logreg": make_pipeline(StandardScaler(), LogisticRegression()),
    "knn":    make_pipeline(StandardScaler(), KNeighborsClassifier()),
    "tree":   DecisionTreeClassifier(random_state=0),
    "rf":     RandomForestClassifier(random_state=0),
    "hgb":    HistGradientBoostingClassifier(random_state=0),
}
for name, m in models.items():
    print(name, round(cross_val_score(m, X, y, cv=cv, scoring="roc_auc").mean(), 3))
# dummy 0.5 | logreg 0.975 | knn 0.964 | tree 0.947 | rf 0.985 | hgb 0.975   (one run, sklearn 1.9)

t = DecisionTreeClassifier(random_state=0).fit(X, y)
print(t.get_depth(), t.get_n_leaves(), t.score(X, y))   # 8 30 1.0  memorises training data
print(RandomForestClassifier().get_params()["n_estimators"])   # 100
print(KNeighborsClassifier().get_params()["n_neighbors"])      # 5

Xm = np.array([[1.0], [np.nan], [3.0], [4.0]])
HistGradientBoostingClassifier().fit(Xm, [0, 0, 1, 1])  # fine: missing values handled natively
# LogisticRegression().fit(Xm, [0, 0, 1, 1])           -> ValueError: Input X contains NaN
\`\`\`

**Interpretation.** Linear models: \`coef_\` (on scaled features) gives direction and size. Trees: \`feature_importances_\` (impurity-based, biased towards high-cardinality features); prefer \`permutation_importance\` on validation data.

**Imbalance.** \`class_weight="balanced"\` on linear models, SVC, trees and forests (and HGB in recent versions) reweights the loss; usually better than resampling, and combine it with threshold tuning.
`,
  practice: `
**Default plan for tabular data.** Dummy → scaled logistic regression (interpretable baseline) → HistGradientBoosting (strong default, handles NaN, fast) → tune learning_rate/max_iter/max_leaf_nodes with early stopping. Random forests are a robust second opinion with little tuning.

**Say why.** "Gradient boosting usually wins on tabular data with non-linear interactions; logistic regression is my calibrated, explainable baseline; if they're close I'd ship the simpler one."
`,
  traps: [
    { trap: "A higher C means stronger regularisation in LogisticRegression and SVC.", why: "C is the inverse of regularisation strength: larger C = weaker regularisation (more fitting)." },
    { trap: "A default DecisionTreeClassifier is a sensible model.", why: "With max_depth=None it grows until leaves are pure and memorises the training set (train accuracy 1.0); limit depth or leaf size." },
    { trap: "Random forest feature_importances_ tell you which features cause the outcome.", why: "They're impurity-based, biased towards high-cardinality features and computed on training data; use permutation importance on held-out data, and importance is never causation." },
  ],
  say: {
    prompt: "Which models would you try on a tabular churn dataset, with what defaults, and what would you tune first?",
    secs: 45,
    check: ["DummyClassifier baseline", "Scaled LogisticRegression (C=1, L2) as interpretable baseline; tune C, class_weight", "HistGradientBoosting: lr 0.1, 100 iterations, 31 leaves, native NaN; tune lr / iterations / leaves with early stopping", "Random forest: 100 trees, sqrt features; little tuning needed", "Which need scaling; C is inverse strength; evaluate with CV and the right metric"],
    followups: [
      { q: "Why does kNN need scaling but a random forest doesn't?", a: "kNN uses distances, so large-range features dominate; tree splits depend only on order within each feature." },
      { q: "Bagging vs boosting?", a: "Bagging (random forests) averages many independent deep trees to cut variance; boosting fits shallow trees sequentially to the previous errors to cut bias." },
      { q: "Ridge vs Lasso?", a: "Ridge (L2) shrinks all coefficients smoothly; Lasso (L1) can set some exactly to zero, doing feature selection. Both use alpha=1.0 by default and need scaled features." },
    ],
    answer: `I'd start with a DummyClassifier so every number has a floor, then a scaled logistic regression, which defaults to L2 regularisation with C equal to 1, where C is the inverse of the strength; I'd tune C on a log scale and maybe class_weight="balanced". Then HistGradientBoostingClassifier, usually the strongest on tabular data: defaults are learning rate 0.1, 100 iterations and 31 leaves per tree, it handles missing values natively, and early stopping kicks in on large data; I'd tune learning rate, iterations and leaf count. A random forest with its 100 trees and sqrt features per split is a robust check that needs little tuning. Linear models and kNN need scaling, trees don't. I'd compare them all with the same stratified CV and the metric that matches the business goal.`,
    avoid: ["Saying larger C = more regularisation", "Shipping a default unpruned tree"],
  },
  terms: [["C", "Inverse regularisation strength (LogisticRegression, SVC)."], ["alpha", "Regularisation strength (Ridge, Lasso)."], ["max_features='sqrt'", "Random forest considers √d features per split."], ["HistGradientBoosting", "Binned gradient boosting; fast, native NaN support."]],
  sources: [S.lin, S.ens],
});
Q({ id: "py2-skmod-1", d: 1, secs: 20, prompt: "Default `n_estimators` of `RandomForestClassifier`?", answer: 100, tol: 0.5, explain: "100 trees since version 0.22.", py: "from sklearn.ensemble import RandomForestClassifier\nanswer = RandomForestClassifier().get_params()['n_estimators']", packages: SK });
Q({ id: "py2-skmod-2", d: 1, secs: 20, prompt: "Default `n_neighbors` of `KNeighborsClassifier`?", answer: 5, tol: 0.5, explain: "Five nearest neighbours, uniform weights.", py: "from sklearn.neighbors import KNeighborsClassifier\nanswer = KNeighborsClassifier().get_params()['n_neighbors']", packages: SK });
Q({ id: "py2-skmod-3", d: 2, secs: 45, prompt: "A default `DecisionTreeClassifier(random_state=0)` fitted on the lesson's 1,000-row dataset. What is its training accuracy?", answer: 1, tol: 0.001, explain: "With no depth limit it grows until leaves are pure and memorises the training data.", py: XY + "from sklearn.tree import DecisionTreeClassifier\nanswer = float(DecisionTreeClassifier(random_state=0).fit(X, y).score(X, y))", packages: SK });
Q({ id: "py2-skmod-4", d: 2, secs: 45, prompt: "Which of these fits on data containing NaN without an imputer?", options: ["LogisticRegression", "KNeighborsClassifier", "HistGradientBoostingClassifier", "SVC"], answer: 2, explain: "HistGradientBoosting learns which side of each split missing values go to.", py: "import numpy as np\nfrom sklearn.linear_model import LogisticRegression\nfrom sklearn.neighbors import KNeighborsClassifier\nfrom sklearn.ensemble import HistGradientBoostingClassifier\nfrom sklearn.svm import SVC\nX = np.array([[1.0], [np.nan], [3.0], [4.0]]); y = [0, 0, 1, 1]\nok = []\nfor m in [LogisticRegression(), KNeighborsClassifier(n_neighbors=1), HistGradientBoostingClassifier(), SVC()]:\n    try:\n        m.fit(X, y); ok.append(True)\n    except ValueError:\n        ok.append(False)\nanswer = ok.index(True) if ok.count(True) == 1 else -1", packages: SK });
Q({ id: "py2-skmod-5", d: 1, secs: 30, prompt: "5-fold ROC AUC of `DummyClassifier(strategy='prior')` on any binary dataset?", answer: 0.5, tol: 0.01, explain: "It gives every row the same score, so it can't rank: AUC 0.5.", py: XY + "from sklearn.dummy import DummyClassifier\nfrom sklearn.model_selection import cross_val_score\nanswer = float(cross_val_score(DummyClassifier(strategy='prior'), X, y, cv=5, scoring='roc_auc').mean())", packages: SK });
C("py2-skmod-c1", "Defaults to remember", "LogReg C=1 (inverse strength, L2) · kNN k=5 · SVC rbf C=1 gamma='scale' · RF 100 trees sqrt features · HGB lr 0.1, 100 iters, 31 leaves, NaN OK · Ridge/Lasso alpha=1.");
C("py2-skmod-c2", "Tabular model ladder", "Dummy → scaled logistic regression → HistGradientBoosting (tune lr/iters/leaves) → RF as a check.");

// ───────────────────────── Saving and serving ─────────────────────────

L("py2-skl-persist", M, "Saving and serving models", "Persisting the whole fitted pipeline with joblib or pickle, version pinning and security, skops and ONNX, and the shape of a simple prediction service.", {
  kind: "concept", mins: 20, mathsLabel: "Code",
  hook: "You saved the model but not the scaler, and production predictions are nonsense. What should you have saved, and what else can break when someone loads it next year?",
  intuition: `
**The situation.** "How would you deploy this?" follows most take-homes. A DS answer doesn't need Kubernetes; it needs to show you save the right thing, can reproduce it and know the risks.

**The idea.**

- **Save the whole fitted pipeline** (preprocessing + model) as one object, so production applies exactly the training transforms. \`joblib.dump(pipe, "model.joblib")\` / \`joblib.load\` (efficient for large NumPy arrays) or \`pickle\`.
- **Pickles are code.** Loading a pickle can execute arbitrary code: only load files you trust. \`skops.io\` offers a safer format that checks types on load; **ONNX** exports to a runtime-independent format for serving without Python scikit-learn.
- **Versions matter.** A pickle should be loaded with the same scikit-learn (and Python, NumPy) versions it was saved with; otherwise you may get \`InconsistentVersionWarning\` or wrong behaviour. Pin versions in requirements and store them with the model.
- **Save metadata:** training date, data snapshot, feature list and order, metric on test data, threshold, library versions, git commit.
- **Serving:** load once at start-up, validate input (columns, dtypes), call \`predict_proba\`, apply the stored threshold, log inputs and outputs for monitoring.
`,
  maths: `
**In one breath.** \`joblib.dump(pipe, path)\`; \`joblib.load(path)\`; save pipeline + threshold + versions; load only trusted pickles; skops/ONNX for safer or cross-runtime formats.

\`\`\`python
import io, json, pickle, joblib, sklearn
pipe = make_pipeline(StandardScaler(), LogisticRegression()).fit(X, y)

joblib.dump(pipe, "churn_v3.joblib")              # whole pipeline, not just the model
loaded = joblib.load("churn_v3.joblib")
print(np.array_equal(loaded.predict(X), pipe.predict(X)))   # True

meta = {"sklearn": sklearn.__version__, "threshold": 0.35,
        "features": [f"x{i}" for i in range(X.shape[1])], "test_auc": 0.95}
json.dump(meta, open("churn_v3.json", "w"))

buf = io.BytesIO(); pickle.dump(pipe, buf)        # in-memory round trip, same idea
restored = pickle.loads(buf.getvalue())
print(np.allclose(restored.predict_proba(X[:3]), pipe.predict_proba(X[:3])))   # True

# Minimal service shape (e.g. FastAPI/Flask): load once, validate, predict, threshold, log
MODEL, META = joblib.load("churn_v3.joblib"), json.load(open("churn_v3.json"))
def score(rows):                                  # rows: list of feature lists
    Xn = np.asarray(rows, dtype=float).reshape(-1, len(META["features"]))
    p = MODEL.predict_proba(Xn)[:, 1]
    return [{"p_churn": round(float(q), 4), "flag": bool(q >= META["threshold"])} for q in p]
print(score([X[0].tolist()]))
\`\`\`

**Cost.** Loading is the slow part (milliseconds to seconds), so load once per process. Prediction for linear models is microseconds per row; tree ensembles scale with number of trees × depth; batch rows when you can.

**Gotchas.** Custom functions inside a pipeline (\`FunctionTransformer(my_func)\`) must be importable where you load the pickle. Lambdas can't be pickled by the standard pickle. A DataFrame-fitted pipeline checks feature names at predict time; keep column names identical.
`,
  practice: `
**Checklist.** Save pipeline + threshold + feature list + versions + metrics; pin dependencies; write a smoke test that loads the artefact and scores a known row; monitor input drift and the score distribution after launch; retrain on a schedule or when drift triggers.

**When to mention ONNX/skops.** Serving in another language or a low-latency runtime (ONNX); sharing models with people who shouldn't run arbitrary pickles (skops).
`,
  traps: [
    { trap: "Save just the classifier; the preprocessing is simple to redo.", why: "Re-fitting a scaler or encoder on production data gives different parameters and silently shifts predictions. Save the fitted pipeline." },
    { trap: "A pickle is a safe data format.", why: "Unpickling can run arbitrary code. Only load trusted files; use skops or ONNX when the source isn't trusted." },
    { trap: "A model pickled with one scikit-learn version loads fine with any other.", why: "Internals change between versions; loading may warn, fail or behave differently. Pin and record versions." },
  ],
  say: {
    prompt: "You've trained a scikit-learn pipeline in a notebook. How do you get it into production safely?",
    secs: 45,
    check: ["Persist the whole fitted pipeline (joblib/pickle)", "Store metadata: versions, features, threshold, metrics, data snapshot", "Pin library versions; smoke-test loading", "Security: only load trusted pickles; skops/ONNX alternatives", "Serve: load once, validate inputs, predict_proba + threshold, log and monitor drift"],
    followups: [
      { q: "joblib vs pickle?", a: "Both serialise Python objects; joblib is more efficient for objects holding large NumPy arrays and supports compression. Same security caveat." },
      { q: "What would you monitor after launch?", a: "Input feature distributions (drift), share of missing/unknown categories, the score distribution, and the business metric once labels arrive." },
      { q: "Why might predictions differ between notebook and production?", a: "Different preprocessing, column order or names, library versions, or production data that differs from training data (drift, new categories)." },
    ],
    answer: `I'd persist the whole fitted pipeline, preprocessing and model together, with joblib.dump, so production applies exactly the training-time imputation, scaling and encoding. Alongside it I'd save metadata: scikit-learn, NumPy and Python versions, the feature list in order, the decision threshold, test metrics and the data snapshot or commit. I'd pin those versions in the serving environment and add a smoke test that loads the file and scores a known row. Pickles can execute code when loaded, so I'd only load artefacts from our own storage, or use skops or ONNX if they come from elsewhere. The service loads the model once, validates the input columns, calls predict_proba, applies the stored threshold and logs inputs and scores so we can monitor drift.`,
    avoid: ["Saving only the estimator", "Ignoring versions and pickle security"],
  },
  terms: [["joblib", "Serialiser efficient for NumPy-heavy objects."], ["Pickle security", "Loading a pickle can execute code."], ["skops", "Safer persistence format for scikit-learn models."], ["ONNX", "Portable model format with its own runtimes."]],
  sources: [S.persist],
});
Q({ id: "py2-sksv-1", d: 1, secs: 30, prompt: "A fitted pipeline is pickled to bytes and loaded back. Do its predictions on X match the original exactly? (1 = yes, 0 = no)", answer: 1, tol: 0.5, explain: "Pickle stores the full fitted state, including the scaler's mean_ and scale_.", py: XY + "import pickle\nfrom sklearn.pipeline import make_pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.linear_model import LogisticRegression\np = make_pipeline(StandardScaler(), LogisticRegression()).fit(X, y)\nanswer = int(np.array_equal(pickle.loads(pickle.dumps(p)).predict(X), p.predict(X)))", packages: SK });
Q({ id: "py2-sksv-2", d: 2, secs: 45, prompt: "Same with `joblib.dump` / `joblib.load` through an in-memory buffer. Are predicted probabilities identical? (1 = yes, 0 = no)", answer: 1, tol: 0.5, explain: "joblib serialises the same fitted object, efficiently for NumPy arrays.", py: XY + "import io, joblib\nfrom sklearn.pipeline import make_pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.linear_model import LogisticRegression\np = make_pipeline(StandardScaler(), LogisticRegression()).fit(X, y)\nb = io.BytesIO(); joblib.dump(p, b); b.seek(0)\nanswer = int(np.array_equal(joblib.load(b).predict_proba(X), p.predict_proba(X)))", packages: ["scikit-learn", "numpy", "joblib"] });
Q({ id: "py2-sksv-3", d: 2, secs: 45, prompt: "You saved only the LogisticRegression and, in production, refit a new StandardScaler on a batch whose feature means are shifted by +2. Do any predictions on that batch differ from the full saved pipeline? (1 = yes, 0 = no)", answer: 1, tol: 0.5, explain: "The refitted scaler re-centres on the new batch, hiding the shift the trained pipeline would have seen.", py: XY + "from sklearn.pipeline import make_pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.linear_model import LogisticRegression\np = make_pipeline(StandardScaler(), LogisticRegression()).fit(X, y)\nXb = X[:200] + 2\nwrong = p[-1].predict(StandardScaler().fit_transform(Xb))\nanswer = int((wrong != p.predict(Xb)).any())", packages: SK });
Q({ id: "py2-sksv-4", d: 1, secs: 30, prompt: "A service receives one customer as a flat list of 8 numbers. What shape must the array passed to `predict_proba` have?", options: ["(8,)", "(1, 8)", "(8, 1)", "(1,)"], answer: 1, explain: "One sample, 8 features: reshape(1, -1).", py: "import numpy as np\nshape = np.asarray(list(range(8)), dtype=float).reshape(1, -1).shape\nanswer = ['(8,)', '(1, 8)', '(8, 1)', '(1,)'].index(str(shape))", packages: SK });
C("py2-sksv-c1", "What to persist", "The fitted pipeline + threshold + feature list + library versions + test metrics.");
C("py2-sksv-c2", "Pickle caveats", "Loading runs code (trusted files only); pin versions; custom functions must be importable; skops/ONNX as alternatives.");

// ───────────────────────── Interview lesson ─────────────────────────

L("py2-skl-practice", M, "scikit-learn practice", "Live-coding and discussion questions on pipelines, validation, metrics and deployment.", {
  kind: "interview", mins: 35, prereq: ["py2-skl-api", "py2-skl-preprocess", "py2-skl-select", "py2-skl-metrics"],
  hook: "Narrate where each number comes from: which data it was fitted on and which data it was scored on.",
}, [
  iq("Here's a DataFrame with numeric, categorical and text-free columns and a binary target. Build a model and report a trustworthy score in 20 minutes.", "Stratified train/test split; ColumnTransformer (median impute + scale numerics; impute + OneHotEncoder(handle_unknown='ignore') categoricals); Pipeline with LogisticRegression as baseline and HistGradientBoosting as the stronger model; DummyClassifier for context; StratifiedKFold CV on train with a metric suited to the class balance; small RandomizedSearchCV; one final test score with the confusion matrix at a chosen threshold.", ["Split first, stratified", "ColumnTransformer inside Pipeline", "Baseline + stronger model", "CV with a justified metric", "Test once, threshold stated"]),
  iq("A colleague's notebook gets 0.99 AUC on churn. List what you'd check before believing it.", "Leakage: features computed after the churn date (e.g. 'days since last login' measured at extraction), target encoded into a feature, preprocessing/feature selection fit on all data, duplicates or the same customer in train and test (use GroupKFold), time ordering (random split on temporal data). Also check the test set was never used for tuning and compare with a dummy and simple models; inspect top features with permutation importance.", ["Temporal / future-information leakage", "Preprocessing outside CV", "Entity overlap → GroupKFold", "Tuning on test", "Feature importance sanity check"]),
  iq("Your model's precision is fine in validation but halves in production. What could explain it?", "Prevalence shift (fewer positives in production lowers precision at the same threshold), data drift or new categories (handle_unknown zeros), preprocessing mismatch (refit scaler, different column order/names), label definition differences, threshold chosen on a non-representative sample, or validation leakage making it look better than it was. Diagnose by comparing feature distributions and score distributions, and recomputing metrics on recent labelled data.", ["Prevalence effect on precision", "Drift / unseen categories", "Pipeline or schema mismatch", "Leakage in validation", "Concrete diagnostics"]),
  iq("Implement a custom transformer that clips numeric columns to the 1st and 99th percentiles learned on training data, usable inside a Pipeline.", "Subclass BaseEstimator and TransformerMixin; __init__ stores lower=0.01, upper=0.99 unchanged; fit computes self.lo_ = np.quantile(X, lower, axis=0), self.hi_ = … and returns self; transform returns np.clip(X, self.lo_, self.hi_). Explain why learned values go in fit (no leakage), trailing underscores, and that get_params works because constructor args are stored as-is.", ["BaseEstimator + TransformerMixin", "Learns quantiles in fit, returns self", "transform uses learned values", "Constructor stores params unchanged", "Usable in CV/grid search"]),
  iq("Explain the difference between `predict`, `predict_proba` and `decision_function`, and how you'd choose a classification threshold.", "predict applies the default rule (0.5 on probability, or 0 on the decision function); predict_proba gives class probabilities (columns in classes_ order); decision_function gives raw scores (margins/log-odds). Choose a threshold on validation data from precision_recall_curve or a cost matrix (expected cost of FP vs FN), then apply it to predict_proba[:, 1]; recent versions offer TunedThresholdClassifierCV. Calibrate first if probabilities are used as risks.", ["Definitions of the three outputs", "Default threshold behaviour", "Threshold from validation data and costs", "Calibration mention"]),
  iq("GridSearchCV over 5 parameters with 6 values each and 5 folds is too slow. What do you do?", "That's 6^5 × 5 = 38,880 fits. Switch to RandomizedSearchCV with log-uniform distributions and a budget (e.g. 60 iterations), or successive halving (HalvingRandomSearchCV); fix parameters that matter little; use n_jobs=-1; use early stopping in boosting instead of tuning iterations; tune on a sample first then refine; cache transformers with Pipeline(memory=...).", ["Computes the fit count", "Randomised / halving search", "Prioritise important parameters", "Parallelism, early stopping, caching"]),
]);
