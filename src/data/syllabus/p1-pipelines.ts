/**
 * P1 · scikit-learn · Pipelines and leakage (pilot concept).
 * Coding problems live in src/data/problems-p1.ts (category ml/pipelines). The quiz items below are
 * predict-the-output questions: each `check` runs the code in Pyodide and derives the answer.
 */
import { Card_, Item, R, T } from "./build";

const SRC = "Practice: standard scikit-learn pipeline and leakage pattern (Nov 2026)";
const pk = ["scikit-learn"];

T(
  "sk-pipelines-leakage",
  "foundations",
  "scikit-learn",
  "Pipelines and data leakage",
  "Every step that learns from data must learn from the training fold only. A Pipeline makes that automatic.",
  `
**Leakage** is any information about the evaluation data reaching the model during training. The model then scores well in validation and worse in production. It is the most common reason a take-home or OA model looks better than it is.

**The rule.** Anything that is fitted (a scaler's mean, an imputer's median, an encoder's categories, a feature selector's chosen columns, PCA's components) must be fitted on training data only, and separately inside every cross-validation fold.

**Fit, transform, predict.**

- \`fit(X)\` learns parameters from X: for StandardScaler, \`mean_\` and \`scale_\`.
- \`transform(X)\` applies those stored parameters to any data, including the test set.
- \`fit_transform(X)\` does both on the same data: use it on training data only.

**What a Pipeline does.** \`Pipeline([("scale", StandardScaler()), ("clf", LogisticRegression())])\`

- \`pipe.fit(X_train, y_train)\`: fits the scaler on X_train, transforms X_train, fits the model on the result.
- \`pipe.predict(X_test)\`: transforms X_test with the stored training statistics, then predicts. Nothing is refitted.
- \`cross_val_score(pipe, X, y, cv=5)\`: clones the whole pipeline for each fold and fits it on that fold's training part only. With 5 folds the scaler is fitted 5 times.

**ColumnTransformer** routes columns to different steps: scale the numeric ones, one-hot encode the categorical ones, drop IDs. Use \`OneHotEncoder(handle_unknown="ignore")\` so a category first seen in production becomes all zeros instead of an error. Put the ColumnTransformer as the first step of the pipeline.

**The leaks to recognise.**

1. **Preprocessing on all data**, then splitting: scaling, imputing or encoding before \`train_test_split\`.
2. **Feature selection on all data**, then cross-validation. The worst one: on pure noise it can report 75–80% accuracy.
3. **Target leakage**: a feature that is only known after the outcome (refund_issued when predicting fraud; days_in_hospital when predicting admission).
4. **Time leakage**: random splits on time-ordered data, or rolling features that use future rows. Use \`TimeSeriesSplit\`.
5. **Group leakage**: the same user or patient in both train and test. Use \`GroupKFold\`.
6. **Tuning on the test set**: choosing hyperparameters by test score. Tune with cross-validation on training data, then touch the test set once.

**Worked example 1: scaling.** Train values 1, 2, 3 (mean 2, standard deviation 0.816). A test value of 4 scales to (4 − 2) / 0.816 = 2.45. If you fit on all four values instead, the test point becomes 1.34. The model never sees a value that extreme in training, so its behaviour there is untested.

**Worked example 2: selection on noise.** 100 rows, 1,000 random features, random labels. Select the 20 features most correlated with y on all rows, then cross-validate: about 0.78. Put SelectKBest inside the pipeline: about 0.53, which is chance, the truth. With 1,000 features some will correlate with y by luck; selecting on all rows bakes that luck into every fold.

**Worked example 3: grid search through a pipeline.** Parameters are addressed as \`step__param\`: \`GridSearchCV(pipe, {"clf__C": [0.1, 1, 10]}, cv=5)\`. Each candidate is cross-validated with the scaler refitted per fold.

**Worked example 4: a leak in disguise.** Predicting whether a loan defaults, with a feature collections_calls. Calls happen after a missed payment, so the feature is a consequence of the label. Validation AUC near 0.99 is the warning sign. Ask of every feature: is it known at prediction time?
`,
  {
    resources: [
      R("scikit-learn: Common pitfalls and recommended practices", "https://scikit-learn.org/stable/common_pitfalls.html", "The official page on leakage and pipelines; read the data-leakage section"),
      R("scikit-learn: Pipelines and composite estimators", "https://scikit-learn.org/stable/modules/compose.html", "Pipeline, ColumnTransformer, step__param naming"),
    ],
    categories: ["ml/pipelines"],
    interview: [
      {
        q: "What is data leakage? Give two examples you would check for in a new model.",
        answer:
          "Leakage is information about the evaluation data, or about the target itself, reaching the model at training time, so validation scores overstate production performance. Two checks: (1) preprocessing or feature selection fitted on the full dataset before splitting; fix it by putting those steps in a Pipeline so they are fitted per fold. (2) Target leakage: features that are only known after the outcome, such as a refund flag when predicting fraud; fix it by asking of each feature whether it exists at prediction time.",
        rubric: [
          "Defines leakage as information unavailable at prediction time reaching training",
          "Gives a train/test contamination example (preprocessing or selection before the split)",
          "Gives a target-leakage example (a feature caused by the outcome)",
          "Names a fix for each (Pipeline; feature audit against prediction time)",
        ],
      },
      {
        q: "Why use a Pipeline instead of scaling the data first and then calling cross_val_score?",
        answer:
          "Scaling first fits the scaler on all rows, so every validation fold has influenced the mean and variance used to train. With a Pipeline, cross_val_score clones and refits the scaler inside each fold on the training part only, which is how the model will be used in production. It also bundles preprocessing with the model, so the same transformation is applied at prediction time and in grid search (step__param).",
        rubric: [
          "Explains that pre-scaling fits on validation rows too",
          "States that the Pipeline refits preprocessing inside each fold",
          "Mentions the benefit at prediction time or in tuning (one object, step__param)",
        ],
      },
      {
        q: "Your model gets 0.99 AUC in validation on a fraud problem. What do you do before celebrating?",
        answer:
          "Treat it as a bug until proven otherwise. Check feature importances for a feature that is a consequence of fraud (chargeback, account_closed, manual_review). Check that preprocessing and selection are inside the pipeline. Check the split: random splitting on time-ordered transactions, or the same customer on both sides, inflates scores, so use a time-based or grouped split. Then compare with a simple baseline and with performance on a later out-of-time sample.",
        rubric: [
          "Treats a near-perfect score as suspicious",
          "Looks for target leakage through feature importances",
          "Checks the split (time-ordered or grouped data)",
          "Validates on an out-of-time sample or against a baseline",
        ],
      },
      {
        q: "Where do imputation, scaling, one-hot encoding and oversampling (SMOTE) go relative to the train/test split?",
        answer:
          "All of them are fitted after the split, on training data only, as steps of a pipeline. Imputation and scaling for numeric columns, and one-hot encoding for categoricals, sit in a ColumnTransformer at the start of the pipeline. Oversampling must only touch training folds, never validation or test rows, so it needs imblearn's Pipeline, which applies samplers during fit only.",
        rubric: [
          "All four are fitted on training data only",
          "Uses a ColumnTransformer for column-specific preprocessing",
          "Oversampling applied only inside training folds",
          "Names imblearn's Pipeline (or equivalent) for samplers",
        ],
      },
    ],
  },
);

Item({ id: "p1-pl-001", d: 1, secs: 60, prompt: "What does this print? Give 2 decimals.\n\n```\nfrom sklearn.preprocessing import StandardScaler\nsc = StandardScaler().fit([[1], [2], [3]])\nprint(sc.transform([[4]])[0, 0])\n```", answer: 2.45, tol: 0.01,
  explain: "The scaler keeps the training mean 2 and population standard deviation 0.816. (4 − 2) / 0.816 = 2.45.",
  fast: "StandardScaler uses the population standard deviation (divide by n).",
  trap: "Using the sample standard deviation (1.0), which gives 2.00.",
  src: SRC, check: { py: "from sklearn.preprocessing import StandardScaler\nanswer = float(StandardScaler().fit([[1], [2], [3]]).transform([[4]])[0, 0])", packages: pk } });

Item({ id: "p1-pl-002", d: 2, secs: 60, prompt: "This code fits a pipeline on training data, then predicts on new data. Is the scaler refitted on `X_new`?\n\n```\npipe = Pipeline([(\"scale\", StandardScaler()), (\"clf\", LogisticRegression())])\npipe.fit(X_train, y_train)\npipe.predict(X_new)\n```", options: ["No: it transforms X_new with the mean and scale learned from X_train", "Yes: predict calls fit_transform on X_new", "Only if X_new has more rows than X_train"], answer: 0,
  explain: "predict calls transform, never fit. The scaler's mean_ and scale_ stay as learned from X_train.",
  fast: "Only fit (and fit_transform) learn parameters; predict and transform reuse them.",
  trap: "Assuming each call to the pipeline adapts to its input. That would make predictions depend on the batch.",
  src: SRC, check: { py: `import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
X_train = np.array([[0.], [2.], [4.], [6.]]); y_train = np.array([0, 0, 1, 1])
pipe = Pipeline([("scale", StandardScaler()), ("clf", LogisticRegression())]).fit(X_train, y_train)
before = pipe.named_steps["scale"].mean_.copy()
pipe.predict(np.array([[100.], [200.]]))
answer = 0 if np.allclose(pipe.named_steps["scale"].mean_, before) else 1`, packages: pk } });

Item({ id: "p1-pl-003", d: 2, secs: 45, prompt: "How many times is the scaler fitted in total?\n\n```\npipe = Pipeline([(\"scale\", StandardScaler()), (\"clf\", LogisticRegression())])\ncross_val_score(pipe, X, y, cv=5)\n```", answer: 5, tol: 0,
  explain: "cross_val_score clones the pipeline for each of the 5 folds and fits each clone on that fold's training rows.",
  fast: "One fit per fold.",
  trap: "Answering 1 (fitted once on all data, which is the leaky version) or 6.",
  src: SRC, check: { py: `import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score
n = []
class CountingScaler(StandardScaler):
    def fit(self, X, y=None, sample_weight=None):
        n.append(1)
        return super().fit(X, y, sample_weight)
rng = np.random.default_rng(0)
X = rng.normal(size=(50, 3)); y = np.array([0, 1] * 25)
cross_val_score(Pipeline([("scale", CountingScaler()), ("clf", LogisticRegression())]), X, y, cv=5)
answer = len(n)`, packages: pk } });

Item({ id: "p1-pl-004", d: 2, secs: 45, prompt: "A ColumnTransformer standard-scales 2 numeric columns and one-hot encodes 1 categorical column with 3 distinct values (`OneHotEncoder(sparse_output=False)`, no `drop`). Every other column is dropped. How many output columns are there?", answer: 5, tol: 0,
  explain: "2 scaled numeric columns + 3 one-hot columns = 5.",
  fast: "Numeric columns pass through one-to-one; each category becomes one column.",
  trap: "Subtracting one for the reference category; that only happens with drop='first'.",
  src: SRC, check: { py: `import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
df = pd.DataFrame({"a": [1., 2., 3.], "b": [4., 5., 6.], "c": ["x", "y", "z"], "id": [1, 2, 3]})
ct = ColumnTransformer([("n", StandardScaler(), ["a", "b"]), ("c", OneHotEncoder(sparse_output=False), ["c"])])
answer = ct.fit_transform(df).shape[1]`, packages: ["scikit-learn", "pandas"] } });

Item({ id: "p1-pl-005", d: 3, secs: 60, prompt: "`X` is 100 × 1,000 random normal noise and `y` is random 0/1 labels. Someone runs `SelectKBest(f_classif, k=20).fit_transform(X, y)` on all rows, then 5-fold `cross_val_score` with logistic regression on the selected columns. Roughly what mean accuracy do they see?", options: ["About 0.5, because the data is noise", "Well above 0.5 (around 0.7–0.8)", "Exactly 1.0"], answer: 1,
  explain: "Selecting on all rows picks the 20 features that happen to correlate with these labels, including the rows later used for validation. Cross-validation then rewards that luck (about 0.78 with seed 7). Inside a pipeline the score falls to chance.",
  fast: "Any step that looks at y before the split leaks.",
  trap: "Trusting cross-validation by itself. It is only honest if everything that is fitted is inside the folds.",
  src: SRC, check: { py: `import numpy as np
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score
rng = np.random.default_rng(7)
X = rng.normal(size=(100, 1000)); y = rng.integers(0, 2, size=100)
s = cross_val_score(LogisticRegression(max_iter=1000), SelectKBest(f_classif, k=20).fit_transform(X, y), y, cv=5).mean()
answer = 2 if s > 0.99 else 1 if s > 0.62 else 0`, packages: pk } });

Item({ id: "p1-pl-006", d: 1, secs: 30, prompt: "In `GridSearchCV(pipe, param_grid, cv=5)`, where `pipe` has steps `\"scale\"` and `\"clf\"` (LogisticRegression), which key sets the regularisation strength C?", options: ["\"C\"", "\"clf__C\"", "\"clf.C\"", "\"LogisticRegression__C\""], answer: 1,
  explain: "Pipeline parameters are addressed as <step name>__<parameter>.",
  fast: "Step name, two underscores, parameter.",
  trap: "Using a single underscore or a dot, or the class name instead of the step name.",
  src: SRC, check: { py: `from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
keys = Pipeline([("scale", StandardScaler()), ("clf", LogisticRegression())]).get_params().keys()
opts = ["C", "clf__C", "clf.C", "LogisticRegression__C"]
ok = [i for i, o in enumerate(opts) if o in keys]
assert len(ok) == 1
answer = ok[0]`, packages: pk } });

Card_("p1-pl-c1", "The leakage rule", "Anything that is fitted (scaler, imputer, encoder, selector, PCA) is fitted on training data only, inside every CV fold.");
Card_("p1-pl-c2", "What pipe.predict(X_test) does to the scaler", "Nothing is refitted: it transforms X_test with the training mean and scale.");
Card_("p1-pl-c3", "Feature selection before CV on pure noise", "Scores well above chance (about 0.78 in the example). Put the selector inside the pipeline: about 0.5.");
Card_("p1-pl-c4", "Grid search parameter names through a pipeline", "step__param, e.g. clf__C.");
