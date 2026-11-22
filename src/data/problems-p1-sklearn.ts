import type { PythonProblem } from "@/lib/types";

/**
 * P1 · scikit-learn (batch 11): 3 coding problems for each of 7 concepts, run in Pyodide with
 * scikit-learn 1.4.2. Wherever possible a hidden test recomputes the answer a different way
 * (numpy closed form, a property of the split) instead of comparing with the reference solution.
 * scripts/verify-py.mts runs every reference solution against every test in CI.
 */
type T = [name: string, call: string, expected: string, hidden?: boolean];
interface Spec {
  id: string; cat: string; title: string; difficulty: "Easy" | "Medium" | "Hard"; targetMin: number; tags: string[];
  statement: string; starter: string; solution: string; tests: T[]; fixtures?: string; constraints?: string[]; hints?: string[];
  why: string; traps: string[]; followUps: string[];
}
const BASE = "import numpy as np\nimport pandas as pd\n";
const RAISES = "def _raises(f, exc):\n    try:\n        f()\n    except exc:\n        return True\n    return False\n";
const P = (s: Spec): PythonProblem => ({
  id: s.id, kind: "python", title: s.title, pillar: "ml", competency: "ml_llm", category: s.cat, difficulty: s.difficulty,
  source: { kind: "practice" }, tracks: [], tags: ["scikit-learn", ...s.tags], targetMin: s.targetMin, statement: s.statement, constraints: s.constraints,
  starter: s.starter, solution: s.solution, setup: BASE + (s.fixtures ?? ""), packages: ["scikit-learn", "pandas"],
  tests: s.tests.map(([name, call, expected, hidden], i) => ({ id: `t${i + 1}`, name, call, expected, hidden: !!hidden })),
  hints: s.hints, context: { why: s.why, traps: s.traps, followUps: s.followUps },
});
const starter = (imports: string, sig: string) => `import numpy as np\n${imports}\n\ndef ${sig}:\n    pass\n`;

const BLOBS = "from sklearn.datasets import make_blobs\nXB, _ = make_blobs(n_samples=300, centers=4, cluster_std=0.7, random_state=0)\n";

export const P1_SKLEARN_PROBLEMS: PythonProblem[] = [
  // ───────── The estimator API ─────────
  P({
    id: "sk-stratified-split", cat: "sk/api", title: "A stratified, reproducible split", difficulty: "Easy", targetMin: 5, tags: ["train_test_split", "stratify"],
    statement: "Write `split(X, y, test_size, seed)` that returns `(X_train, X_test, y_train, y_test)`, shuffled with `random_state=seed`, so that the test set has the **same class proportions** as `y`. The fixtures `X80`, `Y80` have 80 rows of class 0 and 20 of class 1 (row i has value i, so rows 80–99 are the positives).",
    fixtures: "X80 = np.arange(100).reshape(-1, 1)\nY80 = np.array([0] * 80 + [1] * 20)\n",
    starter: starter("from sklearn.model_selection import train_test_split", "split(X, y, test_size, seed)"),
    solution: `import numpy as np
from sklearn.model_selection import train_test_split

def split(X, y, test_size, seed):
    return train_test_split(X, y, test_size=test_size, random_state=seed, stratify=y)
`,
    tests: [
      ["Test set keeps the 20% positive rate", "int(split(X80, Y80, 0.25, 0)[3].sum())", "5"],
      ["Sizes", "tuple(len(a) for a in split(X80, Y80, 0.25, 0))", "(75, 25, 75, 25)"],
      ["Hidden: same seed, same split", "bool((split(X80, Y80, 0.25, 1)[1] == split(X80, Y80, 0.25, 1)[1]).all())", "True", true],
      ["Hidden: rows stay paired with their labels", "(lambda s: bool(((s[1][:, 0] >= 80) == (s[3] == 1)).all()))(split(X80, Y80, 0.2, 3))", "True", true],
      ["Hidden: a 10% positive rate, half held out", "[int(split(X80, np.array([0] * 90 + [1] * 10), 0.5, s)[3].sum()) for s in range(4)]", "[5, 5, 5, 5]", true],
    ],
    hints: ["train_test_split has a stratify argument: pass the labels."],
    why: "With a rare class, an unstratified split can put noticeably more or fewer positives in the test set than in the data, so the test score moves with the seed. Stratifying removes that noise.",
    traps: ["Forgetting stratify=y: the positive count in the test set then varies with the seed.", "Splitting X and y in two separate calls: the rows no longer line up."],
    followUps: ["Make a train / validation / test split of 60 / 20 / 20, stratified at both steps.", "When would you split by time or by group instead?"],
  }),
  P({
    id: "sk-majority", cat: "sk/api", title: "Write your own estimator", difficulty: "Medium", targetMin: 12, tags: ["BaseEstimator", "ClassifierMixin", "check_is_fitted"],
    statement: "Write a class `MajorityClassifier` that follows the scikit-learn estimator contract:\n\n- `fit(X, y)` learns `classes_` (the sorted distinct labels) and `majority_` (the most common label; on a tie, the smallest), and **returns self**.\n- `predict(X)` returns a numpy array with `majority_` for every row of X, and raises sklearn's `NotFittedError` if called before `fit`.\n- `score(X, y)` should give accuracy without you writing it, and the class must work with `clone` and `cross_val_score`.",
    fixtures: RAISES + "from sklearn.exceptions import NotFittedError\nfrom sklearn.model_selection import cross_val_score\n",
    starter: "import numpy as np\nfrom sklearn.base import BaseEstimator, ClassifierMixin\nfrom sklearn.utils.validation import check_is_fitted\n\nclass MajorityClassifier(ClassifierMixin, BaseEstimator):\n    def fit(self, X, y):\n        pass\n\n    def predict(self, X):\n        pass\n",
    solution: `import numpy as np
from sklearn.base import BaseEstimator, ClassifierMixin
from sklearn.utils.validation import check_is_fitted

class MajorityClassifier(ClassifierMixin, BaseEstimator):
    def fit(self, X, y):
        self.classes_, counts = np.unique(np.asarray(y), return_counts=True)
        self.majority_ = self.classes_[np.argmax(counts)]
        return self

    def predict(self, X):
        check_is_fitted(self)
        return np.full(len(X), self.majority_)
`,
    tests: [
      ["Predicts the most common label", 'MajorityClassifier().fit([[0]] * 5, ["a", "b", "b", "c", "b"]).predict([[1], [2]]).tolist()', '["b", "b"]'],
      ["fit returns self", "type(MajorityClassifier().fit([[0], [1]], [1, 1])).__name__", '"MajorityClassifier"'],
      ["score is accuracy, from ClassifierMixin", "MajorityClassifier().fit([[0]] * 4, [1, 1, 1, 0]).score([[0]] * 4, [1, 1, 0, 0])", "0.5"],
      ["Hidden: a tie goes to the smallest label", "MajorityClassifier().fit([[0]] * 4, [2, 1, 2, 1]).predict([[0]]).tolist()", "[1]", true],
      ["Hidden: NotFittedError before fit", "_raises(lambda: MajorityClassifier().predict([[0]]), NotFittedError)", "True", true],
      ["Hidden: works with cross_val_score", "round(float(cross_val_score(MajorityClassifier(), np.zeros((6, 1)), [0, 0, 0, 0, 1, 1], cv=2).mean()), 4)", "0.6667", true],
    ],
    hints: ["Learned attributes end in an underscore; check_is_fitted(self) looks for them.", "np.unique(y, return_counts=True) gives sorted labels, and argmax picks the first maximum."],
    why: "Interviewers ask this to see whether you know the contract every sklearn object follows: hyperparameters in __init__, learned state in attributes ending in _, fit returning self. It's also how you wrap custom logic so it fits in a Pipeline or a grid search.",
    traps: ["Returning None from fit, which breaks chaining (model.fit(X, y).predict(X)).", "Setting attributes in __init__ from the data, which breaks clone and get_params.", "Returning a Python list from predict instead of an array."],
    followUps: ["Add predict_proba that returns the class frequencies from training.", "Add a hyperparameter strategy='majority' | 'stratified' and check that clone copies it."],
  }),
  P({
    id: "sk-clone-score", cat: "sk/api", title: "Score a model without touching it", difficulty: "Easy", targetMin: 6, tags: ["clone", "fit", "score"],
    statement: "Write `fit_and_score(model, X_tr, y_tr, X_te, y_te)` that fits a **fresh copy** of `model` (the one passed in must stay unfitted) on the training data and returns `(train_accuracy, test_accuracy)` as Python floats. Fixtures `XT, YT, XV, YV` are a small training and test set.",
    fixtures: "from sklearn.tree import DecisionTreeClassifier\nfrom sklearn.linear_model import LogisticRegression\nXT = np.array([[0], [1], [2], [3], [4], [5]]); YT = np.array([0, 0, 0, 1, 1, 1])\nXV = np.array([[2.4], [2.6], [10], [-1]]); YV = np.array([0, 1, 0, 0])\n",
    starter: starter("from sklearn.base import clone", "fit_and_score(model, X_tr, y_tr, X_te, y_te)"),
    solution: `import numpy as np
from sklearn.base import clone

def fit_and_score(model, X_tr, y_tr, X_te, y_te):
    m = clone(model).fit(X_tr, y_tr)
    return float(m.score(X_tr, y_tr)), float(m.score(X_te, y_te))
`,
    tests: [
      ["A depth-1 tree", "fit_and_score(DecisionTreeClassifier(max_depth=1, random_state=0), XT, YT, XV, YV)", "(1.0, 0.75)"],
      ["Logistic regression", "fit_and_score(LogisticRegression(), XT, YT, XV, YV)", "(1.0, 0.75)"],
      ["Hidden: the model passed in stays unfitted", '(lambda m: (fit_and_score(m, XT, YT, XV, YV), hasattr(m, "tree_"))[1])(DecisionTreeClassifier(max_depth=1))', "False", true],
      ["Hidden: Python floats", "[type(v).__name__ for v in fit_and_score(DecisionTreeClassifier(max_depth=1), XT, YT, XV, YV)]", '["float", "float"]', true],
    ],
    hints: ["sklearn.base.clone copies the hyperparameters and none of the learned state.", "Classifiers' score method is accuracy."],
    why: "fit changes the object in place. Code that compares models, or evaluates the same model on several datasets, must clone it, or later results quietly depend on earlier fits.",
    traps: ["Calling model.fit directly: the caller's model is now fitted.", "Using copy.deepcopy on an already-fitted model, which copies the learned state too."],
    followUps: ["Extend it to return the scores of every model in a dict of models.", "Why does cross_val_score clone the estimator for every fold?"],
  }),

  // ───────── Preprocessing ─────────
  P({
    id: "sk-onehot-unknown", cat: "sk/preprocess", title: "One-hot encode with unseen categories", difficulty: "Easy", targetMin: 6, tags: ["OneHotEncoder", "handle_unknown"],
    statement: "Write `encode(train, new)`: learn the categories from the list `train`, then one-hot encode the list `new`. Return a dense 2-D float numpy array with one column per training category, in **sorted** order. A category not seen in training must give a row of zeros, not an error.",
    starter: starter("from sklearn.preprocessing import OneHotEncoder", "encode(train, new)"),
    solution: `import numpy as np
from sklearn.preprocessing import OneHotEncoder

def encode(train, new):
    enc = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    enc.fit(np.array(train).reshape(-1, 1))
    return enc.transform(np.array(new).reshape(-1, 1))
`,
    tests: [
      ["Sample", 'encode(["b", "a", "c", "a"], ["a", "z", "c"])', "np.array([[1., 0., 0.], [0., 0., 0.], [0., 0., 1.]])"],
      ["Columns are sorted", 'encode(["dog", "cat"], ["dog"])', "np.array([[0., 1.]])"],
      ["Hidden: a dense array", 'type(encode(["x"], ["x"])).__name__', '"ndarray"', true],
      ["Hidden: nothing known", 'encode(["p", "q"], ["r", "s"])', "np.zeros((2, 2))", true],
      ["Hidden: repeats don't add columns", 'encode(["a", "a", "b"], ["b"]).shape', "(1, 2)", true],
    ],
    hints: ["OneHotEncoder expects a 2-D input: reshape(-1, 1).", "handle_unknown='ignore' and sparse_output=False."],
    why: "In production a new category always turns up eventually. The default encoder raises an error at prediction time; handle_unknown='ignore' maps it to all zeros, which the model treats as 'none of the known categories'.",
    traps: ["Fitting the encoder on train + new, which adds columns the model never trained on.", "Passing a 1-D list, which raises 'Expected 2D array'.", "Returning a sparse matrix where an array is needed."],
    followUps: ["Group categories seen fewer than 5 times into one 'infrequent' column (min_frequency).", "Why drop='first' matters for unregularised linear regression but not for trees."],
  }),
  P({
    id: "sk-column-prep", cat: "sk/preprocess", title: "Build a ColumnTransformer", difficulty: "Medium", targetMin: 12, tags: ["ColumnTransformer", "SimpleImputer", "StandardScaler"],
    statement: "Write `make_preprocessor(num_cols, cat_cols)` that returns an **unfitted** `ColumnTransformer` which:\n\n- for numeric columns: fills missing values with the column's training **median**, then standardises;\n- for categorical columns: fills missing values with the **most frequent** training value, then one-hot encodes (dense output, unknown categories → all zeros);\n- drops every other column.\n\nThe output has the numeric columns first, then the one-hot columns. Fixtures: `TRAIN` and `NEW` (one unseen row).",
    fixtures: 'TRAIN = pd.DataFrame({"id": [1, 2, 3, 4, 5], "age": [20., 30., np.nan, 40., 90.], "income": [1., 2., 3., 4., 100.], "city": ["P", "D", "P", np.nan, "M"]})\nNEW = pd.DataFrame({"id": [9], "age": [np.nan], "income": [2.], "city": ["Z"]})\n',
    starter: "import numpy as np\nfrom sklearn.compose import ColumnTransformer\nfrom sklearn.pipeline import make_pipeline\nfrom sklearn.impute import SimpleImputer\nfrom sklearn.preprocessing import OneHotEncoder, StandardScaler\n\ndef make_preprocessor(num_cols, cat_cols):\n    pass\n",
    solution: `import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import make_pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder, StandardScaler

def make_preprocessor(num_cols, cat_cols):
    num = make_pipeline(SimpleImputer(strategy="median"), StandardScaler())
    cat = make_pipeline(SimpleImputer(strategy="most_frequent"), OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    return ColumnTransformer([("num", num, num_cols), ("cat", cat, cat_cols)], remainder="drop")
`,
    tests: [
      ["Shape: 2 numeric + 3 cities", 'make_preprocessor(["age", "income"], ["city"]).fit_transform(TRAIN).shape', "(5, 5)"],
      ["Missing age → training median (35), then scaled", 'float(make_preprocessor(["age", "income"], ["city"]).fit(TRAIN).transform(NEW)[0, 0])', "(35 - np.mean([20., 30., 35., 40., 90.])) / np.std([20., 30., 35., 40., 90.])"],
      ["Missing city → most frequent (P)", 'make_preprocessor(["age", "income"], ["city"]).fit_transform(TRAIN)[3, 2:].tolist()', "[0.0, 0.0, 1.0]"],
      ["Hidden: unknown city is all zeros", 'make_preprocessor(["age", "income"], ["city"]).fit(TRAIN).transform(NEW)[0, 2:].tolist()', "[0.0, 0.0, 0.0]", true],
      ["Hidden: scaled with training statistics", 'float(make_preprocessor(["age", "income"], ["city"]).fit(TRAIN).transform(NEW)[0, 1])', "(2 - 22) / np.std([1., 2., 3., 4., 100.])", true],
      ["Hidden: returns an unfitted ColumnTransformer", '(lambda c: (type(c).__name__, hasattr(c, "transformers_")))(make_preprocessor(["age"], ["city"]))', '("ColumnTransformer", False)', true],
    ],
    hints: ["Each branch is a small pipeline: make_pipeline(SimpleImputer(...), ...).", "ColumnTransformer([(name, transformer, columns), ...], remainder='drop')."],
    why: "Real tables mix numeric and categorical columns with gaps in both. Putting all of it in one ColumnTransformer, inside a Pipeline, means every statistic (medians, means, categories) is learned from the training fold only.",
    traps: ["Scaling before imputing: StandardScaler passes NaN through, and the imputer then fills the scaled column.", "remainder='passthrough' keeps the id column, which then leaks into the model as a feature.", "Imputing on the whole dataset before splitting."],
    followUps: ["Add a missing-value indicator column for age (add_indicator=True).", "Wrap it with a LogisticRegression in a Pipeline and grid-search the C value."],
  }),
  P({
    id: "sk-ordinal-order", cat: "sk/preprocess", title: "Ordinal encoding in the right order", difficulty: "Easy", targetMin: 6, tags: ["OrdinalEncoder", "categories"],
    statement: "T-shirt sizes have a natural order: S < M < L < XL. Write `encode_sizes(values)` that maps a list of sizes to integers 0, 1, 2, 3 in that order, and any other value to -1. Return a 1-D integer numpy array. Use `OrdinalEncoder`.",
    starter: starter("from sklearn.preprocessing import OrdinalEncoder", "encode_sizes(values)"),
    solution: `import numpy as np
from sklearn.preprocessing import OrdinalEncoder

ORDER = ["S", "M", "L", "XL"]

def encode_sizes(values):
    enc = OrdinalEncoder(categories=[ORDER], handle_unknown="use_encoded_value", unknown_value=-1)
    enc.fit(np.array(ORDER).reshape(-1, 1))
    return enc.transform(np.array(values).reshape(-1, 1)).ravel().astype(int)
`,
    tests: [
      ["Sample", 'encode_sizes(["M", "S", "XL", "L"]).tolist()', "[1, 0, 3, 2]"],
      ["Unknown size", 'encode_sizes(["XXL", "S"]).tolist()', "[-1, 0]"],
      ["Hidden: not alphabetical", 'encode_sizes(["L", "M"]).tolist()', "[2, 1]", true],
      ["Hidden: integers", 'encode_sizes(["S"]).dtype.kind', '"i"', true],
      ["Hidden: only one size present", 'encode_sizes(["XL", "XL"]).tolist()', "[3, 3]", true],
    ],
    hints: ["By default OrdinalEncoder sorts the categories alphabetically: L, M, S, XL.", "Pass categories=[['S', 'M', 'L', 'XL']] and handle_unknown='use_encoded_value', unknown_value=-1."],
    why: "Ordinal codes are only meaningful if they follow the real order. The alphabetical default gives L = 0 and S = 2, so a linear model learns that small is bigger than large.",
    traps: ["Relying on the default (alphabetical) category order.", "Fitting on the values themselves, so a batch with only XL encodes XL as 0."],
    followUps: ["When would you one-hot encode sizes instead?", "Encode two ordinal columns with different orders in one encoder."],
  }),

  // ───────── Linear models ─────────
  P({
    id: "sk-ridge-path", cat: "sk/linear", title: "Ridge coefficients across alphas", difficulty: "Medium", targetMin: 10, tags: ["Ridge", "alpha", "regularisation"],
    statement: "Write `ridge_coefs(X, y, alphas)` that fits `Ridge(alpha=a)` (with an intercept) for each value in `alphas` and returns a numpy array of shape `(len(alphas), n_features)`, one row of `coef_` per alpha. Fixtures `XR`, `YR` are 40 rows with 3 features.",
    fixtures: "rng = np.random.default_rng(0)\nXR = rng.normal(size=(40, 3))\nYR = XR @ np.array([2., -1., 0.5]) + 3 + rng.normal(scale=0.3, size=40)\n",
    starter: starter("from sklearn.linear_model import Ridge", "ridge_coefs(X, y, alphas)"),
    solution: `import numpy as np
from sklearn.linear_model import Ridge

def ridge_coefs(X, y, alphas):
    return np.array([Ridge(alpha=a).fit(X, y).coef_ for a in alphas])
`,
    tests: [
      ["Shape", "ridge_coefs(XR, YR, [0.1, 1, 10]).shape", "(3, 3)"],
      ["Bigger alpha, smaller coefficients", "bool(np.all(np.diff(np.linalg.norm(ridge_coefs(XR, YR, [0.01, 1, 10, 100]), axis=1)) < 0))", "True"],
      ["alpha near 0 is ordinary least squares", "ridge_coefs(XR, YR, [1e-8])[0]", "np.linalg.lstsq(np.c_[XR, np.ones(40)], YR, rcond=None)[0][:3]"],
      ["Hidden: matches the closed form (XᵀX + αI)⁻¹Xᵀy on centred data", "ridge_coefs(XR, YR, [0.1, 10., 100.])", "np.array([np.linalg.solve((XR - XR.mean(0)).T @ (XR - XR.mean(0)) + a * np.eye(3), (XR - XR.mean(0)).T @ (YR - YR.mean())) for a in [0.1, 10., 100.]])", true],
    ],
    hints: ["Fit one Ridge per alpha and stack the coef_ arrays."],
    why: "Seeing the coefficients shrink as alpha grows is the clearest way to understand regularisation. The closed form also shows why the intercept isn't penalised: sklearn centres X and y first.",
    traps: ["Mixing up alpha (Ridge, Lasso: bigger = stronger) and C (LogisticRegression, SVC: bigger = weaker).", "Forgetting that the penalty depends on feature scale: standardise first when features have different units."],
    followUps: ["Plot the path with a log-scaled alpha axis.", "Use RidgeCV to pick alpha by cross-validation."],
  }),
  P({
    id: "sk-positive-proba", cat: "sk/linear", title: "The right predict_proba column", difficulty: "Easy", targetMin: 6, tags: ["predict_proba", "classes_"],
    statement: "Write `positive_proba(model, X, pos)` that returns a 1-D numpy array with the fitted classifier's probability that each row of X belongs to class `pos`. Don't assume the positive class is column 1: find it in `model.classes_`. Fixtures: `LOGM` (labels 'yes'/'no') and `TRI` (labels 2, 5, 9).",
    fixtures: 'from sklearn.linear_model import LogisticRegression\nXL = np.array([[0.], [1.], [2.], [3.], [4.], [5.]])\nLOGM = LogisticRegression().fit(XL, ["yes", "yes", "yes", "no", "no", "no"])\nTRI = LogisticRegression().fit(XL, [9, 9, 2, 2, 5, 5])\n',
    starter: starter("", "positive_proba(model, X, pos)"),
    solution: `import numpy as np

def positive_proba(model, X, pos):
    col = list(model.classes_).index(pos)
    return model.predict_proba(X)[:, col]
`,
    tests: [
      ['P("yes")', 'positive_proba(LOGM, [[0.], [5.]], "yes")', "LOGM.predict_proba([[0.], [5.]])[:, 1]"],
      ['P("no") is column 0 (classes_ are sorted)', 'positive_proba(LOGM, [[0.], [5.]], "no")', "LOGM.predict_proba([[0.], [5.]])[:, 0]"],
      ["Hidden: low x means yes", 'bool(positive_proba(LOGM, [[0.]], "yes")[0] > 0.5)', "True", true],
      ["Hidden: three classes", "positive_proba(TRI, [[0.], [2.5]], 9)", "TRI.predict_proba([[0.], [2.5]])[:, 2]", true],
      ["Hidden: 1-D", 'positive_proba(LOGM, [[1.]], "no").ndim', "1", true],
    ],
    hints: ["The columns of predict_proba follow model.classes_, which is sorted."],
    why: "predict_proba(X)[:, 1] is only 'the positive class' when the labels are 0/1. With string labels the columns are in sorted order, so 'yes' may be column 1 and 'churn' column 0. Getting this wrong flips every downstream threshold and AUC.",
    traps: ["Hard-coding [:, 1].", "Comparing predict (labels) with a probability threshold."],
    followUps: ["Return the top-2 most likely classes per row.", "Why is roc_auc_score(y, proba[:, 0]) equal to 1 − the correct AUC?"],
  }),
  P({
    id: "sk-lasso-select", cat: "sk/linear", title: "Which features does Lasso keep?", difficulty: "Medium", targetMin: 10, tags: ["Lasso", "StandardScaler", "feature selection"],
    statement: "Write `lasso_features(X, y, names, alpha)` that standardises the features, fits `Lasso(alpha=alpha)`, and returns the list of feature names whose coefficient is not zero, in their original order. Fixtures `XS`, `YS`, `NAMES`: six features on very different scales, of which a, b and d matter.",
    fixtures: 'rng = np.random.default_rng(1)\nXS = rng.normal(size=(200, 6)) * [1, 0.01, 1, 100, 1, 1]\nYS = 3 * XS[:, 0] + 100 * XS[:, 1] + 0.2 * XS[:, 3] + rng.normal(scale=0.5, size=200)\nNAMES = ["a", "b", "c", "d", "e", "f"]\n',
    starter: starter("from sklearn.linear_model import Lasso\nfrom sklearn.pipeline import make_pipeline\nfrom sklearn.preprocessing import StandardScaler", "lasso_features(X, y, names, alpha)"),
    solution: `import numpy as np
from sklearn.linear_model import Lasso
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

def lasso_features(X, y, names, alpha):
    pipe = make_pipeline(StandardScaler(), Lasso(alpha=alpha)).fit(X, y)
    coef = pipe[-1].coef_
    return [n for n, c in zip(names, coef) if c != 0]
`,
    tests: [
      ["alpha = 0.5", "lasso_features(XS, YS, NAMES, 0.5)", '["a", "b", "d"]'],
      ["alpha = 2 drops the weakest", "lasso_features(XS, YS, NAMES, 2.0)", '["a", "d"]'],
      ["Hidden: a huge alpha keeps nothing", "lasso_features(XS, YS, NAMES, 100.0)", "[]", true],
      ["Hidden: a list", "type(lasso_features(XS, YS, NAMES, 0.5)).__name__", '"list"', true],
    ],
    hints: ["make_pipeline(StandardScaler(), Lasso(alpha=alpha)); the fitted Lasso is pipe[-1].", "On standardised features, a's effect is 3, b's is 1 and d's is 20 (coefficient × standard deviation)."],
    why: "The L1 penalty treats every coefficient alike, so a feature measured in tiny units (b) needs a huge coefficient and gets penalised away, even though it matters. Standardising first makes the penalty fair.",
    traps: ["Skipping the scaler: b's raw coefficient is 100 and Lasso zeroes it at alpha = 0.5.", "Reading 'coefficient is zero' as 'feature is useless': with correlated features Lasso keeps one and drops the other."],
    followUps: ["Use LassoCV to pick alpha.", "Two features are copies of each other. What does Lasso do, and what does Ridge do?"],
  }),

  // ───────── Trees and ensembles ─────────
  P({
    id: "sk-best-depth", cat: "sk/trees", title: "Pick a tree's depth on validation data", difficulty: "Easy", targetMin: 8, tags: ["DecisionTreeClassifier", "max_depth", "overfitting"],
    statement: "Write `best_depth(X_tr, y_tr, X_va, y_va, depths)` that fits `DecisionTreeClassifier(max_depth=d, random_state=0)` for each d in `depths` and returns the d with the highest **validation** accuracy (ties → the smallest d). Fixtures: `XM_tr, YM_tr, XM_va, YM_va`, a noisy two-moons dataset.",
    fixtures: "from sklearn.datasets import make_moons\nfrom sklearn.model_selection import train_test_split\nXM, YM = make_moons(n_samples=400, noise=0.3, random_state=0)\nXM_tr, XM_va, YM_tr, YM_va = train_test_split(XM, YM, test_size=0.25, random_state=0)\n",
    starter: starter("from sklearn.tree import DecisionTreeClassifier", "best_depth(X_tr, y_tr, X_va, y_va, depths)"),
    solution: `import numpy as np
from sklearn.tree import DecisionTreeClassifier

def best_depth(X_tr, y_tr, X_va, y_va, depths):
    best, best_acc = None, -1.0
    for d in sorted(depths):
        acc = DecisionTreeClassifier(max_depth=d, random_state=0).fit(X_tr, y_tr).score(X_va, y_va)
        if acc > best_acc:
            best, best_acc = d, acc
    return best
`,
    tests: [
      ["Depths 1 to 12", "best_depth(XM_tr, YM_tr, XM_va, YM_va, range(1, 13))", "5"],
      ["Not the deepest tree", "best_depth(XM_tr, YM_tr, XM_va, YM_va, [2, 30])", "2"],
      ["Hidden: ties go to the smallest depth", "best_depth(XM_tr, YM_tr, XM_va, YM_va, [40, 30, 20])", "20", true],
      ["Hidden: chosen on validation, not training, data", "best_depth(XM_tr, YM_tr, XM_va, YM_va, [3, 25])", "3", true],
    ],
    hints: ["Score on (X_va, y_va), not on the training data: training accuracy always prefers the deepest tree.", "Iterate over the depths in increasing order and only replace the best on a strict improvement."],
    why: "A tree grown to full depth memorises the training noise. Validation accuracy rises, then falls, as depth increases; the peak is where bias and variance balance.",
    traps: ["Choosing by training accuracy (always the deepest tree).", "Breaking ties towards the deeper tree, which is the more complex model for the same score."],
    followUps: ["Do the same with 5-fold cross-validation instead of one validation set.", "Tune min_samples_leaf instead of max_depth."],
  }),
  P({
    id: "sk-perm-top", cat: "sk/trees", title: "Top features by permutation importance", difficulty: "Medium", targetMin: 10, tags: ["permutation_importance", "RandomForest"],
    statement: "Write `top_features(model, X, y, names, k)` that computes permutation importance of the **fitted** `model` on (X, y) with `n_repeats=10, random_state=0` and returns the names of the k features with the largest mean importance, most important first. It must work for any fitted estimator, not only trees. Fixtures: `XP`, `YP` (f0 and f2 drive the label), a fitted `FOREST` and a fitted `LOGP`, both trained on the first 200 rows.",
    fixtures: 'from sklearn.ensemble import RandomForestClassifier\nfrom sklearn.linear_model import LogisticRegression\nrng = np.random.default_rng(2)\nXP = rng.normal(size=(300, 5))\nYP = (2 * XP[:, 0] + XP[:, 2] + 0.3 * rng.normal(size=300) > 0).astype(int)\nFOREST = RandomForestClassifier(n_estimators=50, random_state=0).fit(XP[:200], YP[:200])\nLOGP = LogisticRegression().fit(XP[:200], YP[:200])\nPN = ["f0", "f1", "f2", "f3", "f4"]\n',
    starter: starter("from sklearn.inspection import permutation_importance", "top_features(model, X, y, names, k)"),
    solution: `import numpy as np
from sklearn.inspection import permutation_importance

def top_features(model, X, y, names, k):
    r = permutation_importance(model, X, y, n_repeats=10, random_state=0)
    order = np.argsort(-r.importances_mean, kind="stable")
    return [names[i] for i in order[:k]]
`,
    tests: [
      ["Forest, top 2 on held-out rows", "top_features(FOREST, XP[200:], YP[200:], PN, 2)", '["f0", "f2"]'],
      ["Top 1", "top_features(FOREST, XP[200:], YP[200:], PN, 1)", '["f0"]'],
      ["Hidden: works for a model without feature_importances_", "top_features(LOGP, XP[200:], YP[200:], PN, 2)", '["f0", "f2"]', true],
      ["Hidden: k = 5 returns every name once", "sorted(top_features(FOREST, XP[200:], YP[200:], PN, 5))", "PN", true],
    ],
    hints: ["sklearn.inspection.permutation_importance returns an object with importances_mean.", "np.argsort(-values) sorts from largest to smallest."],
    why: "Impurity-based feature_importances_ exist only for trees, are computed on training data, and favour features with many distinct values. Permutation importance works for any model and, on held-out data, measures what the model actually relies on to generalise.",
    traps: ["Using model.feature_importances_: it doesn't exist for logistic regression and is biased towards high-cardinality features.", "Computing importance on the training rows, which rewards overfitting.", "Sorting ascending."],
    followUps: ["Two features are perfectly correlated. What happens to their permutation importances?", "Report the standard deviation across repeats next to each mean."],
  }),
  P({
    id: "sk-gini-split", cat: "sk/trees", title: "Find a tree's first split by hand", difficulty: "Medium", targetMin: 15, tags: ["Gini", "decision tree", "from scratch"],
    statement: "Write `best_split(x, y)` for one numeric feature x and class labels y. Try every threshold halfway between two consecutive **distinct** sorted values of x, split into x ≤ t and x > t, and return `(t, g)` where g is the weighted Gini impurity of the two sides (weights = share of rows) and t minimises it. On a tie, return the smallest t. This is what `DecisionTreeClassifier(max_depth=1)` does. Gini of a node = 1 − Σ pₖ².",
    fixtures: "from sklearn.tree import DecisionTreeClassifier\nrng = np.random.default_rng(3)\nXG = rng.normal(size=60)\nYG = (XG + rng.normal(scale=0.7, size=60) > 0).astype(int)\n",
    starter: starter("", "best_split(x, y)"),
    solution: `import numpy as np

def _gini(labels):
    _, counts = np.unique(labels, return_counts=True)
    p = counts / counts.sum()
    return 1.0 - float(np.sum(p ** 2))

def best_split(x, y):
    x, y = np.asarray(x, dtype=float), np.asarray(y)
    vals = np.unique(x)
    best = (None, np.inf)
    for t in (vals[:-1] + vals[1:]) / 2:
        left, right = y[x <= t], y[x > t]
        g = (len(left) * _gini(left) + len(right) * _gini(right)) / len(y)
        if g < best[1] - 1e-12:
            best = (float(t), g)
    return best
`,
    tests: [
      ["Clean split", "best_split([1, 2, 3, 4, 5, 6], [0, 0, 0, 1, 1, 1])", "(3.5, 0.0)"],
      ["A tie goes to the smaller threshold", "best_split([1, 2, 3, 4], [0, 1, 0, 1])", "(1.5, 1 / 3)"],
      ["Hidden: unsorted input", "best_split([5, 1, 4, 2], [1, 0, 1, 0])", "(3.0, 0.0)", true],
      ["Hidden: never splits between equal values", "best_split([1, 1, 2, 2], [0, 0, 1, 1])", "(1.5, 0.0)", true],
      ["Hidden: three classes", "best_split([1, 2, 3], [0, 1, 2])", "(1.5, 1 / 3)", true],
      ["Hidden: same threshold as sklearn's stump", "bool(abs(best_split(XG, YG)[0] - DecisionTreeClassifier(max_depth=1).fit(XG.reshape(-1, 1), YG).tree_.threshold[0]) < 1e-6)", "True", true],
    ],
    hints: ["np.unique(x) gives sorted distinct values; midpoints are (v[:-1] + v[1:]) / 2.", "Weighted impurity = (n_left · gini_left + n_right · gini_right) / n."],
    why: "Interviewers often ask how a tree chooses a split. Writing it once makes the greedy search, the impurity measure and the midpoint thresholds concrete, and explains why trees don't need scaled features.",
    traps: ["Using every x value as a threshold, which can split between two equal values.", "Averaging the two sides' Gini without weighting by size.", "Forgetting to sort x first."],
    followUps: ["Use entropy instead of Gini and compare the chosen thresholds.", "Extend it to several features: pick the best (feature, threshold) pair."],
  }),

  // ───────── Cross-validation and tuning ─────────
  P({
    id: "sk-group-splits", cat: "sk/cv", title: "Folds that keep each user together", difficulty: "Easy", targetMin: 6, tags: ["GroupKFold", "leakage"],
    statement: "Several rows belong to the same user. Write `group_splits(X, y, groups, k)` that returns a list of `(train_idx, test_idx)` pairs (numpy integer arrays) for k-fold cross-validation in which **no user appears on both sides** of any split. Fixtures: `XG2`, `YG2`, `GRP` (25 rows from 10 users).",
    fixtures: "GRP = np.repeat(np.arange(10), [3, 1, 4, 2, 2, 5, 1, 3, 2, 2])\nXG2 = np.arange(len(GRP)).reshape(-1, 1).astype(float)\nYG2 = np.arange(len(GRP)) % 2\n",
    starter: starter("from sklearn.model_selection import GroupKFold", "group_splits(X, y, groups, k)"),
    solution: `import numpy as np
from sklearn.model_selection import GroupKFold

def group_splits(X, y, groups, k):
    return list(GroupKFold(n_splits=k).split(X, y, groups))
`,
    tests: [
      ["k folds", "len(group_splits(XG2, YG2, GRP, 5))", "5"],
      ["No user on both sides", "all(set(GRP[tr]).isdisjoint(GRP[te]) for tr, te in group_splits(XG2, YG2, GRP, 5))", "True"],
      ["Hidden: every row is tested exactly once", "np.sort(np.concatenate([te for _, te in group_splits(XG2, YG2, GRP, 4)]))", "np.arange(25)", true],
      ["Hidden: integer indices, not masks", "group_splits(XG2, YG2, GRP, 3)[0][1].dtype.kind", '"i"', true],
    ],
    hints: ["GroupKFold(n_splits=k).split(X, y, groups) yields (train, test) index arrays."],
    why: "If a user's rows are in both train and test, the model can recognise the user rather than learn the pattern, and the CV score is too optimistic. Group splits give the honest estimate for new users.",
    traps: ["Using KFold or StratifiedKFold with shuffle: the same user lands in train and test.", "Passing groups to the GroupKFold constructor instead of to split()."],
    followUps: ["Use StratifiedGroupKFold to also keep the label balance.", "What is the right split for predicting next month's sales per store?"],
  }),
  P({
    id: "sk-grid-tune", cat: "sk/cv", title: "Grid search through a pipeline", difficulty: "Medium", targetMin: 12, tags: ["GridSearchCV", "Pipeline", "StratifiedKFold"],
    statement: "Write `tune(X, y)` that returns a **fitted** `GridSearchCV` over a pipeline with steps named `\"scale\"` (StandardScaler) and `\"clf\"` (`LogisticRegression(max_iter=1000)`), searching C in [0.01, 0.1, 1, 10], scored by ROC AUC, with `StratifiedKFold(5, shuffle=True, random_state=0)`. Fixtures: `XC`, `YC` (one feature is on a scale 1,000 times larger).",
    fixtures: "from sklearn.datasets import make_classification\nXC, YC = make_classification(n_samples=300, n_features=10, n_informative=3, random_state=3)\nXC[:, 0] *= 1000\n",
    starter: "import numpy as np\nfrom sklearn.pipeline import Pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.linear_model import LogisticRegression\nfrom sklearn.model_selection import GridSearchCV, StratifiedKFold\n\ndef tune(X, y):\n    pass\n",
    solution: `import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GridSearchCV, StratifiedKFold

def tune(X, y):
    pipe = Pipeline([("scale", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    cv = StratifiedKFold(5, shuffle=True, random_state=0)
    return GridSearchCV(pipe, {"clf__C": [0.01, 0.1, 1, 10]}, scoring="roc_auc", cv=cv).fit(X, y)
`,
    tests: [
      ["All four values searched", 'len(tune(XC, YC).cv_results_["params"])', "4"],
      ["The scaler is inside the pipeline", "list(tune(XC, YC).best_estimator_.named_steps)", '["scale", "clf"]'],
      ["Best C", 'tune(XC, YC).best_params_["clf__C"]', "0.1"],
      ["Hidden: scored by AUC", "tune(XC, YC).scoring", '"roc_auc"', true],
      ["Hidden: best cross-validated AUC", "round(float(tune(XC, YC).best_score_), 4)", "0.9467", true],
    ],
    hints: ["Parameters inside a pipeline are named step__param: 'clf__C'.", "GridSearchCV(pipe, grid, scoring='roc_auc', cv=StratifiedKFold(...)).fit(X, y)."],
    why: "Tuning the whole pipeline means the scaler is refitted inside every fold, so the scores are leak-free, and the refitted best_estimator_ is ready to use on new data.",
    traps: ["Scaling X before the grid search: the folds' validation data then influenced the scaler.", "Writing {'C': [...]} instead of {'clf__C': [...]}, which raises an invalid-parameter error.", "Reporting best_score_ as the final test score: it was used for selection, so it's optimistic."],
    followUps: ["Use RandomizedSearchCV with a log-uniform distribution for C.", "Wrap tune in an outer cross-validation (nested CV) for an unbiased estimate."],
  }),
  P({
    id: "sk-walk-forward", cat: "sk/cv", title: "Walk-forward splits for time series", difficulty: "Easy", targetMin: 8, tags: ["TimeSeriesSplit", "time series"],
    statement: "Rows 0 … n−1 are in time order. Write `walk_forward(n, k)` that returns the same splits as `TimeSeriesSplit(n_splits=k)`: a list of k `(train, test)` pairs of **Python lists** of row numbers, where each test block has n // (k + 1) rows, the last block ends at row n − 1, and the training rows are everything before the test block.",
    fixtures: "from sklearn.model_selection import TimeSeriesSplit\n",
    starter: starter("from sklearn.model_selection import TimeSeriesSplit", "walk_forward(n, k)"),
    solution: `import numpy as np

def walk_forward(n, k):
    size = n // (k + 1)
    out = []
    for i in range(k):
        start = n - (k - i) * size
        out.append((list(range(start)), list(range(start, start + size))))
    return out
`,
    tests: [
      ["n = 10, k = 3", "walk_forward(10, 3)", "[([0, 1, 2, 3], [4, 5]), ([0, 1, 2, 3, 4, 5], [6, 7]), ([0, 1, 2, 3, 4, 5, 6, 7], [8, 9])]"],
      ["Training always precedes testing", "all(max(tr) < min(te) for tr, te in walk_forward(23, 4))", "True"],
      ["Hidden: an uneven n", "[len(tr) for tr, _ in walk_forward(23, 4)]", "[7, 11, 15, 19]", true],
      ["Hidden: same as TimeSeriesSplit", "[(tr.tolist(), te.tolist()) for tr, te in TimeSeriesSplit(5).split(np.zeros(31))] == walk_forward(31, 5)", "True", true],
      ["Hidden: lists", "type(walk_forward(10, 3)[0][0]).__name__", '"list"', true],
    ],
    hints: ["The test blocks are the last k blocks of size n // (k + 1); anything left over goes to the first training set."],
    why: "A random split lets the model train on the future and test on the past, which a real forecast can never do. Walk-forward validation mimics deployment: train on everything up to a date, test on the next period.",
    traps: ["Shuffling time-ordered rows.", "Putting the leftover rows at the end instead of in the first training set."],
    followUps: ["Add a gap of g rows between train and test (TimeSeriesSplit's gap).", "Use a fixed-size sliding window instead of an expanding one (max_train_size)."],
  }),

  // ───────── Metrics and thresholds ─────────
  P({
    id: "sk-rates", cat: "sk/metrics", title: "Precision, recall, specificity, F1", difficulty: "Easy", targetMin: 8, tags: ["confusion_matrix", "precision", "recall"],
    statement: "Write `rates(y_true, y_pred)` for binary labels (positive = 1) that returns a dict with float values for `\"precision\"`, `\"recall\"`, `\"specificity\"` and `\"f1\"`. Any ratio whose denominator is 0 is 0.0. It must work even when only one class appears in the inputs.",
    starter: starter("from sklearn.metrics import confusion_matrix", "rates(y_true, y_pred)"),
    solution: `import numpy as np
from sklearn.metrics import confusion_matrix

def _div(a, b):
    return float(a / b) if b else 0.0

def rates(y_true, y_pred):
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()
    p, r = _div(tp, tp + fp), _div(tp, tp + fn)
    return {"precision": p, "recall": r, "specificity": _div(tn, tn + fp), "f1": _div(2 * p * r, p + r)}
`,
    tests: [
      ["Sample", "rates([1, 1, 1, 1, 0, 0, 0, 0, 0, 0], [1, 1, 1, 0, 1, 1, 0, 0, 0, 0])", '{"precision": 0.6, "recall": 0.75, "specificity": 4 / 6, "f1": 2 / 3}'],
      ["Recall only counts actual positives", 'rates([1, 0, 0, 0], [1, 1, 1, 1])["recall"]', "1.0"],
      ["Hidden: nothing predicted positive", "rates([1, 0, 1, 0], [0, 0, 0, 0])", '{"precision": 0.0, "recall": 0.0, "specificity": 1.0, "f1": 0.0}', true],
      ["Hidden: only positives present", "rates([1, 1], [1, 1])", '{"precision": 1.0, "recall": 1.0, "specificity": 0.0, "f1": 1.0}', true],
      ["Hidden: floats", "[type(v).__name__ for v in rates([1, 0], [1, 0]).values()]", '["float", "float", "float", "float"]', true],
    ],
    hints: ["confusion_matrix(y, p, labels=[0, 1]).ravel() gives tn, fp, fn, tp in that order.", "Without labels=[0, 1], a single-class input gives a 1×1 matrix."],
    why: "Every classification metric is a ratio of the four confusion-matrix cells. Knowing sklearn's layout (rows = actual, columns = predicted, negatives first) is what lets you read any report correctly.",
    traps: ["Unpacking ravel() as tp, fp, fn, tn.", "Leaving out labels=[0, 1], which breaks on single-class batches.", "Dividing by zero instead of returning 0.0."],
    followUps: ["Add the false positive rate and the negative predictive value.", "Compute the same numbers for every class of a multiclass problem."],
  }),
  P({
    id: "sk-threshold-recall", cat: "sk/metrics", title: "The highest threshold that reaches a recall target", difficulty: "Medium", targetMin: 10, tags: ["precision_recall_curve", "threshold"],
    statement: "A model gives a score per row; you predict positive when score ≥ t. Write `threshold_for_recall(y, scores, target)` that returns (as a float) the **highest** t, among the score values, whose recall is at least `target`. A higher threshold means fewer false positives, so this is the best precision for the required recall.",
    starter: starter("from sklearn.metrics import precision_recall_curve", "threshold_for_recall(y, scores, target)"),
    solution: `import numpy as np
from sklearn.metrics import precision_recall_curve

def threshold_for_recall(y, scores, target):
    _, recall, thr = precision_recall_curve(y, scores)
    return float(thr[recall[:-1] >= target].max())
`,
    tests: [
      ["Recall ≥ 0.75", "threshold_for_recall([0, 0, 1, 1, 0, 1, 1, 0], [0.1, 0.4, 0.35, 0.8, 0.7, 0.9, 0.6, 0.2], 0.75)", "0.6"],
      ["Recall = 1", "threshold_for_recall([0, 0, 1, 1, 0, 1, 1, 0], [0.1, 0.4, 0.35, 0.8, 0.7, 0.9, 0.6, 0.2], 1.0)", "0.35"],
      ["Hidden: recall ≥ 0.5", "threshold_for_recall([0, 0, 1, 1, 0, 1, 1, 0], [0.1, 0.4, 0.35, 0.8, 0.7, 0.9, 0.6, 0.2], 0.5)", "0.8", true],
      ["Hidden: tied scores", "threshold_for_recall([1, 0, 1], [0.5, 0.5, 0.9], 1.0)", "0.5", true],
      ["Hidden: a tiny target allows the top score", "threshold_for_recall([0, 0, 1, 1, 0, 1, 1, 0], [0.1, 0.4, 0.35, 0.8, 0.7, 0.9, 0.6, 0.2], 0.01)", "0.9", true],
    ],
    hints: ["precision_recall_curve returns precision, recall and thresholds; recall[i] belongs to thresholds[i], and recall has one extra entry at the end.", "Or sort the positive scores in descending order and take the ⌈target · P⌉-th one."],
    why: "The default 0.5 threshold is rarely the business choice. Fraud and medical screening start from a recall requirement and then pick the threshold that keeps the most precision.",
    traps: ["Aligning recall and thresholds wrongly (recall is one element longer).", "Taking the lowest qualifying threshold, which gives up precision for nothing.", "Choosing the threshold on the test set and then reporting test metrics at it."],
    followUps: ["Return the threshold that maximises F1 instead.", "Choose the threshold with TunedThresholdClassifierCV (scikit-learn 1.5+)."],
  }),
  P({
    id: "sk-f1-averages", cat: "sk/metrics", title: "Macro, weighted and micro F1", difficulty: "Easy", targetMin: 8, tags: ["f1_score", "average", "multiclass"],
    statement: "Write `f1_averages(y_true, y_pred)` that returns a dict `{\"macro\": …, \"weighted\": …, \"micro\": …}` of F1 scores, each rounded to 4 decimals, over all classes present.",
    starter: starter("from sklearn.metrics import f1_score", "f1_averages(y_true, y_pred)"),
    solution: `import numpy as np
from sklearn.metrics import f1_score

def f1_averages(y_true, y_pred):
    return {a: round(float(f1_score(y_true, y_pred, average=a)), 4) for a in ("macro", "weighted", "micro")}
`,
    tests: [
      ["Three classes", "f1_averages([0, 0, 0, 0, 0, 0, 1, 1, 2, 2], [0, 0, 0, 0, 0, 1, 1, 2, 2, 1])", '{"macro": 0.603, "weighted": 0.7255, "micro": 0.7}'],
      ["Micro F1 is accuracy here", 'f1_averages([0, 1, 2, 2], [0, 2, 2, 2])["micro"]', "0.75"],
      ["Hidden: binary labels still average both classes", "f1_averages([1, 1, 0, 0], [1, 0, 0, 0])", '{"macro": 0.7333, "weighted": 0.7333, "micro": 0.75}', true],
      ["Hidden: floats", '[type(v).__name__ for v in f1_averages([0, 1], [0, 1]).values()]', '["float", "float", "float"]', true],
    ],
    hints: ["f1_score(y, p, average='macro' | 'weighted' | 'micro')."],
    why: "On imbalanced multiclass data the three averages tell different stories: macro treats every class equally (so rare classes count), weighted follows class frequency, and micro equals accuracy when every row has one label.",
    traps: ["Using the default average='binary' on multiclass labels, which raises an error.", "Reporting weighted F1 to hide a rare class the model never gets right."],
    followUps: ["Print classification_report and match each number to these averages.", "Which average would you report for a fraud model with 0.5% positives?"],
  }),

  // ───────── Clustering and PCA ─────────
  P({
    id: "sk-best-k", cat: "sk/unsup", title: "Choose k with the silhouette score", difficulty: "Medium", targetMin: 10, tags: ["KMeans", "silhouette_score", "StandardScaler"],
    statement: "Write `best_k(X, ks)` that standardises X, fits `KMeans(n_clusters=k, n_init=10, random_state=0)` for each k in `ks`, and returns the k with the highest silhouette score (computed on the standardised data). Fixture: `XB`, 300 points from 4 blobs.",
    fixtures: BLOBS,
    starter: starter("from sklearn.cluster import KMeans\nfrom sklearn.metrics import silhouette_score\nfrom sklearn.preprocessing import StandardScaler", "best_k(X, ks)"),
    solution: `import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler

def best_k(X, ks):
    Z = StandardScaler().fit_transform(X)
    scores = {k: silhouette_score(Z, KMeans(n_clusters=k, n_init=10, random_state=0).fit_predict(Z)) for k in ks}
    return int(max(scores, key=scores.get))
`,
    tests: [
      ["Four blobs", "best_k(XB, range(2, 8))", "4"],
      ["An int", "type(best_k(XB, [2, 3])).__name__", '"int"'],
      ["Hidden: one axis in different units", "best_k(XB * [1, 1000], range(2, 8))", "4", true],
    ],
    hints: ["silhouette_score(Z, labels) is between −1 and 1; higher is better.", "Use the same standardised Z for fitting and scoring."],
    why: "The elbow of the inertia curve is often ambiguous; the silhouette compares each point's distance to its own cluster with the nearest other cluster and gives one number to maximise. Scaling matters because k-means uses Euclidean distance.",
    traps: ["Choosing the k with the lowest inertia: inertia always falls as k grows.", "Skipping the scaler, so the feature with the biggest units decides the clusters."],
    followUps: ["Plot inertia against k and compare the elbow with the silhouette's choice.", "Why does the silhouette fail on two concentric rings, and what would you use instead?"],
  }),
  P({
    id: "sk-pca-components", cat: "sk/unsup", title: "How many components for 90% of the variance?", difficulty: "Easy", targetMin: 8, tags: ["PCA", "explained_variance_ratio_"],
    statement: "Write `n_components_for(X, frac)` that standardises X, fits PCA, and returns the smallest number of components whose cumulative explained variance ratio is at least `frac`, as an int. Fixture: `XQ`, 8 features driven by 3 hidden factors, on very different scales.",
    fixtures: "rng = np.random.default_rng(5)\n_Z = rng.normal(size=(200, 3))\nXQ = (_Z @ rng.normal(size=(3, 8)) + 0.3 * rng.normal(size=(200, 8))) * [1, 10, 100, 1, 1, 1000, 1, 1]\n",
    starter: starter("from sklearn.decomposition import PCA\nfrom sklearn.preprocessing import StandardScaler", "n_components_for(X, frac)"),
    solution: `import numpy as np
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

def n_components_for(X, frac):
    pca = PCA().fit(StandardScaler().fit_transform(X))
    return int(np.searchsorted(np.cumsum(pca.explained_variance_ratio_), frac) + 1)
`,
    tests: [
      ["90%", "n_components_for(XQ, 0.9)", "(lambda ev: int(np.searchsorted(np.cumsum(ev) / ev.sum(), 0.9) + 1))(np.sort(np.linalg.eigvalsh(np.corrcoef(XQ, rowvar=False)))[::-1])"],
      ["50%", "n_components_for(XQ, 0.5)", "(lambda ev: int(np.searchsorted(np.cumsum(ev) / ev.sum(), 0.5) + 1))(np.sort(np.linalg.eigvalsh(np.corrcoef(XQ, rowvar=False)))[::-1])"],
      ["Hidden: 99%", "n_components_for(XQ, 0.99)", "(lambda ev: int(np.searchsorted(np.cumsum(ev) / ev.sum(), 0.99) + 1))(np.sort(np.linalg.eigvalsh(np.corrcoef(XQ, rowvar=False)))[::-1])", true],
      ["Hidden: an int", "type(n_components_for(XQ, 0.9)).__name__", '"int"', true],
    ],
    hints: ["np.cumsum(pca.explained_variance_ratio_) and np.searchsorted, or a loop.", "PCA(n_components=0.9) also picks this number for you: look at n_components_."],
    why: "PCA on unscaled data just finds the column with the biggest units. After standardising, PCA works on the correlation matrix, and the cumulative variance curve tells you how many directions carry the signal (here, about 3).",
    traps: ["Forgetting to standardise: the 1000× column alone 'explains' almost everything.", "Off-by-one: searchsorted gives an index, the answer is a count."],
    followUps: ["Check the 90% answer against PCA(n_components=0.9).", "Put the PCA inside a pipeline before a classifier and tune the number of components."],
  }),
  P({
    id: "sk-kmeans-step", cat: "sk/unsup", title: "One k-means iteration by hand", difficulty: "Medium", targetMin: 12, tags: ["k-means", "from scratch", "numpy"],
    statement: "Write `kmeans_step(X, centres)` that performs one Lloyd iteration and returns `(labels, new_centres)`: assign each row to its nearest centre (Euclidean; on a tie, the lower index), then move each centre to the mean of its rows. A centre with no rows stays where it was. Use numpy only. Fixture: `XB` (4 blobs).",
    fixtures: BLOBS + "from sklearn.cluster import KMeans\n",
    starter: starter("", "kmeans_step(X, centres)"),
    solution: `import numpy as np

def kmeans_step(X, centres):
    X, C = np.asarray(X, dtype=float), np.asarray(centres, dtype=float)
    d = ((X[:, None, :] - C[None, :, :]) ** 2).sum(axis=2)
    labels = d.argmin(axis=1)
    new = C.copy()
    for j in range(len(C)):
        if np.any(labels == j):
            new[j] = X[labels == j].mean(axis=0)
    return labels, new
`,
    tests: [
      ["Two clusters", "kmeans_step([[0, 0], [0, 1], [10, 10], [10, 11]], [[0, 0], [10, 10]])", "(np.array([0, 0, 1, 1]), np.array([[0., 0.5], [10., 10.5]]))"],
      ["Hidden: an empty cluster keeps its centre", "kmeans_step([[0, 0], [0, 1], [10, 10], [10, 11]], [[0, 0], [100, 100], [10, 10]])", "(np.array([0, 0, 2, 2]), np.array([[0., 0.5], [100., 100.], [10., 10.5]]))", true],
      ["Hidden: a tie goes to the lower index", "kmeans_step([[5, 0]], [[0, 0], [10, 0]])[0].tolist()", "[0]", true],
      ["Hidden: same centres as sklearn after one iteration", "bool(np.allclose(kmeans_step(XB, XB[:4])[1], KMeans(4, init=XB[:4], n_init=1, max_iter=1).fit(XB).cluster_centers_))", "True", true],
    ],
    hints: ["Broadcast X[:, None, :] − C[None, :, :] to get every row-to-centre difference at once.", "argmin returns the first minimum, which handles ties."],
    why: "k-means is two alternating steps: assign, then average. Writing one step shows why it always lowers inertia, why it can get stuck in a local minimum (hence n_init), and what happens to an empty cluster.",
    traps: ["Updating the centres one row at a time, which changes later assignments.", "Dividing by zero for an empty cluster (NaN centre).", "Using Manhattan distance; the mean minimises squared Euclidean distance."],
    followUps: ["Loop until the labels stop changing and return the inertia.", "Write the k-means++ initialisation."],
  }),
];
