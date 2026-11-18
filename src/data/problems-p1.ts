import type { PythonProblem } from "@/lib/types";

/**
 * P1 · scikit-learn · Pipelines and leakage (pilot concept). Runs in Pyodide (scikit-learn 1.4.2).
 * Expected values were produced by the reference solutions on the same runtime; scripts/verify-py.mts
 * re-runs every solution against them in CI.
 */
const base = {
  kind: "python" as const,
  pillar: "ml" as const,
  competency: "ml_llm" as const,
  category: "ml/pipelines",
  source: { kind: "practice" as const },
  tracks: [],
  packages: ["scikit-learn", "pandas"],
};

const DATA = `import numpy as np
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
X, y = make_classification(n_samples=300, n_features=8, n_informative=4, random_state=0)
X[:, 0] *= 1000  # one feature on a much larger scale
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.25, random_state=0)
`;

export const P1_PROBLEMS: PythonProblem[] = [
  {
    ...base,
    id: "py-sk-scale-split",
    title: "Scale with training statistics only",
    difficulty: "Easy",
    tags: ["leakage", "StandardScaler", "train/test"],
    targetMin: 6,
    statement: `Write \`scale_split(X_train, X_test)\` that standardises both arrays **using only the training data's mean and standard deviation**, and returns \`(X_train_scaled, X_test_scaled)\` as numpy arrays.

Use \`sklearn.preprocessing.StandardScaler\`. Fit it once; never fit it on the test set or on the two sets combined.`,
    constraints: ["Return a tuple of two numpy arrays.", "The test set's scaled mean will generally not be exactly 0: that is correct."],
    sample: { input: "scale_split(np.array([[1.],[2.],[3.]]), np.array([[4.]]))", output: "(array([[-1.2247], [0.], [1.2247]]), array([[2.4495]]))" },
    starter: `import numpy as np
from sklearn.preprocessing import StandardScaler

def scale_split(X_train, X_test):
    # return (X_train_scaled, X_test_scaled)
    pass
`,
    solution: `import numpy as np
from sklearn.preprocessing import StandardScaler

def scale_split(X_train, X_test):
    sc = StandardScaler().fit(X_train)
    return sc.transform(X_train), sc.transform(X_test)
`,
    setup: "import numpy as np\n",
    tests: [
      { id: "t1", name: "Sample", hidden: false, call: "scale_split(np.array([[1.],[2.],[3.]]), np.array([[4.]]))[1]", expected: "np.array([[ (4 - 2) / np.std([1., 2., 3.]) ]])" },
      { id: "t2", name: "Train is centred", hidden: false, call: "np.round(scale_split(np.array([[1., 10.],[3., 30.],[5., 50.]]), np.array([[0., 0.]]))[0].mean(axis=0), 9)", expected: "np.array([0., 0.])" },
      { id: "t3", name: "Hidden: test uses train statistics", hidden: true, call: "scale_split(np.array([[0.],[10.]]), np.array([[20.],[30.]]))[1]", expected: "np.array([[3.], [5.]])" },
      { id: "t4", name: "Hidden: returns two arrays", hidden: true, call: "[type(a).__name__ for a in scale_split(np.ones((3, 2)) * [[1], [2], [3]], np.ones((1, 2)))]", expected: "['ndarray', 'ndarray']" },
    ],
    hints: ["`StandardScaler().fit(X_train)` learns mean_ and scale_.", "Call `.transform` on both sets with that one fitted scaler."],
    context: {
      why: "The simplest form of leakage: letting test-set statistics into preprocessing. Interviewers ask it as a warm-up before pipelines.",
      traps: ["`fit_transform(X_test)`: rescales the test set with its own statistics.", "Fitting on `np.vstack([X_train, X_test])`: the test set leaks into the mean."],
      followUps: ["Why is a slightly non-zero test mean expected?", "Which other preprocessing steps learn statistics from data?"],
    },
  },
  {
    ...base,
    id: "py-sk-pipeline",
    title: "Scaler and model in one Pipeline",
    difficulty: "Easy",
    tags: ["Pipeline", "StandardScaler", "LogisticRegression"],
    targetMin: 6,
    statement: `Write \`build_model()\` that returns an **unfitted** \`sklearn.pipeline.Pipeline\` with two steps:

1. \`"scale"\`: a \`StandardScaler\`
2. \`"clf"\`: a \`LogisticRegression(max_iter=1000)\`

The fixtures define \`X_tr, X_te, y_tr, y_te\` (one feature is on a scale 1,000 times larger than the rest).`,
    constraints: ["Use exactly these step names.", "Return the pipeline unfitted."],
    starter: `from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

def build_model():
    pass
`,
    solution: `from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

def build_model():
    return Pipeline([("scale", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
`,
    setup: DATA,
    tests: [
      { id: "t1", name: "Step names", hidden: false, call: "[n for n, _ in build_model().steps]", expected: "['scale', 'clf']" },
      { id: "t2", name: "Step types", hidden: false, call: "[type(s).__name__ for _, s in build_model().steps]", expected: "['StandardScaler', 'LogisticRegression']" },
      { id: "t3", name: "Unfitted", hidden: false, call: "hasattr(build_model().named_steps['scale'], 'mean_')", expected: "False" },
      { id: "t4", name: "Hidden: test accuracy", hidden: true, call: "round(build_model().fit(X_tr, y_tr).score(X_te, y_te), 4)", expected: "0.64" },
    ],
    hints: ["`Pipeline([(name, step), ...])`.", "Fitting the pipeline fits the scaler on the training data only, then the model on the scaled data."],
    context: {
      why: "A pipeline makes the train-only rule automatic: everything inside is fitted only on whatever data .fit receives.",
      traps: ["Scaling outside the pipeline, then passing the scaled data into cross-validation.", "Forgetting max_iter and getting a convergence warning on unscaled data."],
      followUps: ["What does pipe.predict(X_te) do to the scaler?", "How do you set C on the classifier in a grid search? (clf__C)"],
    },
  },
  {
    ...base,
    id: "py-sk-columntransformer",
    title: "Preprocess mixed columns with ColumnTransformer",
    difficulty: "Medium",
    tags: ["ColumnTransformer", "OneHotEncoder", "unseen categories"],
    targetMin: 10,
    statement: `Write \`build_preprocessor(num_cols, cat_cols)\` that returns an unfitted \`ColumnTransformer\`:

- numeric columns → \`StandardScaler\`
- categorical columns → \`OneHotEncoder(handle_unknown="ignore", sparse_output=False)\`
- every other column is dropped

The fixture \`df\` has columns \`amount\`, \`age\` (numeric), \`city\` (categorical, values Pune, Delhi, Goa) and \`id\` (drop it). \`df_new\` contains a city the encoder never saw.`,
    constraints: ["Numeric columns first, then the one-hot columns.", "An unseen category must not raise: it becomes all zeros."],
    starter: `from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

def build_preprocessor(num_cols, cat_cols):
    pass
`,
    solution: `from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

def build_preprocessor(num_cols, cat_cols):
    return ColumnTransformer(
        [("num", StandardScaler(), num_cols),
         ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_cols)],
        remainder="drop",
    )
`,
    setup: `import numpy as np
import pandas as pd
df = pd.DataFrame({"id": [1, 2, 3, 4], "amount": [100., 200., 300., 400.], "age": [20., 30., 40., 50.], "city": ["Pune", "Delhi", "Goa", "Pune"]})
df_new = pd.DataFrame({"id": [9], "amount": [235.], "age": [33.5], "city": ["Mumbai"]})
`,
    tests: [
      { id: "t1", name: "Output shape: 2 numeric + 3 one-hot", hidden: false, call: "build_preprocessor(['amount', 'age'], ['city']).fit_transform(df).shape", expected: "(4, 5)" },
      { id: "t2", name: "Numeric columns are standardised", hidden: false, call: "np.round(build_preprocessor(['amount', 'age'], ['city']).fit_transform(df)[:, :2].mean(axis=0), 9)", expected: "np.array([0., 0.])" },
      { id: "t3", name: "Hidden: unseen city is all zeros", hidden: true, call: "build_preprocessor(['amount', 'age'], ['city']).fit(df).transform(df_new)[0, 2:].tolist()", expected: "[0.0, 0.0, 0.0]" },
      { id: "t4", name: "Hidden: id column dropped", hidden: true, call: "build_preprocessor(['amount', 'age'], ['city']).fit(df).transform(df_new)[0, :2].round(4).tolist()", expected: "[-0.1342, -0.1342]" },
    ],
    hints: ["ColumnTransformer takes a list of (name, transformer, columns).", "remainder='drop' is the default, but say it explicitly."],
    context: {
      why: "Real tables mix numbers and categories. Interviewers check that you know where encoding goes and what happens to a category seen only in production.",
      traps: ["pd.get_dummies on the full dataset: the columns depend on the data, and test rows can produce a different set of columns.", "Leaving handle_unknown at 'error': the first new city in production crashes the model."],
      followUps: ["Where does an imputer go relative to the scaler?", "How do you get the output feature names? (get_feature_names_out)"],
    },
  },
  {
    ...base,
    id: "py-sk-selection-leak",
    title: "Feature selection inside cross-validation",
    difficulty: "Hard",
    tags: ["leakage", "SelectKBest", "cross_val_score"],
    targetMin: 12,
    statement: `The fixtures \`X\` (100 rows × 1,000 columns) and \`y\` are **pure noise**: no feature is related to the label, so any honest estimate of accuracy must be near 0.5.

This is the classic mistake:

\`\`\`
X_sel = SelectKBest(f_classif, k=20).fit_transform(X, y)   # sees every label
cross_val_score(LogisticRegression(max_iter=1000), X_sel, y, cv=5).mean()   # far above 0.5
\`\`\`

Write \`honest_cv_accuracy(X, y)\` that returns the mean 5-fold cross-validated accuracy, as a float, of a pipeline that does \`SelectKBest(f_classif, k=20)\` **inside** each fold, followed by \`LogisticRegression(max_iter=1000)\`. Use \`cross_val_score(..., cv=5)\`.`,
    constraints: ["Return a Python float.", "Selection must be refitted in every fold."],
    starter: `from sklearn.pipeline import Pipeline
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score

def honest_cv_accuracy(X, y):
    pass
`,
    solution: `from sklearn.pipeline import Pipeline
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score

def honest_cv_accuracy(X, y):
    pipe = Pipeline([("select", SelectKBest(f_classif, k=20)), ("clf", LogisticRegression(max_iter=1000))])
    return float(cross_val_score(pipe, X, y, cv=5).mean())
`,
    setup: `import numpy as np
rng = np.random.default_rng(7)
X = rng.normal(size=(100, 1000))
y = rng.integers(0, 2, size=100)
`,
    tests: [
      { id: "t1", name: "Returns a float", hidden: false, call: "type(honest_cv_accuracy(X, y)).__name__", expected: "'float'" },
      { id: "t2", name: "Honest: not far above chance", hidden: false, call: "honest_cv_accuracy(X, y) < 0.65", expected: "True" },
      { id: "t3", name: "Hidden: exact value", hidden: true, call: "round(honest_cv_accuracy(X, y), 4)", expected: "0.53" },
    ],
    hints: ["Put SelectKBest and the classifier in one Pipeline.", "Pass the pipeline, not pre-selected data, to cross_val_score."],
    context: {
      why: "This leak produces impressive validation scores on data with no signal at all. It is the leakage question interviewers like most, because it looks harmless.",
      traps: ["Selecting features on the full dataset 'just once to save time'.", "Doing the same with PCA, target encoding or oversampling outside the folds."],
      followUps: ["The leaky version scores about 0.78 on this noise. Why?", "Where does SMOTE go in a pipeline? (imblearn's Pipeline, inside the fold)"],
    },
  },
];
