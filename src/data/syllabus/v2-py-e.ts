/**
 * v2 Python, part E: NumPy. Fixed ids (py2-*); answers recomputed in Pyodide.
 */
import { CHECKED, iq, lessonWriter } from "./v2-shared";

const { L, Q, C } = lessonWriter("python");
const M = "NumPy";
const src = (label: string, url: string) => ({ label, url, checked: CHECKED });
const S = {
  basics: src("NumPy: the absolute basics for beginners", "https://numpy.org/doc/stable/user/absolute_beginners.html"),
  idx: src("NumPy user guide: indexing on ndarrays", "https://numpy.org/doc/stable/user/basics.indexing.html"),
  bc: src("NumPy user guide: broadcasting", "https://numpy.org/doc/stable/user/basics.broadcasting.html"),
  la: src("NumPy reference: linear algebra (numpy.linalg)", "https://numpy.org/doc/stable/reference/routines.linalg.html"),
  rng: src("NumPy reference: random Generator", "https://numpy.org/doc/stable/reference/random/generator.html"),
};
const NP = ["numpy"];

// ───────────────────────── Arrays ─────────────────────────

L("py2-np-arrays", M, "Arrays, dtypes and shapes", "Creating ndarrays, dtype rules, shape/ndim/size, reshape, stacking and why arrays beat lists for numbers.", {
  kind: "concept", mins: 20, mathsLabel: "Code",
  hook: "Summing a million numbers: a Python loop takes ~50 ms, `arr.sum()` under 1 ms. What does an ndarray do differently?",
  intuition: `
**The situation.** Every DS library (pandas, scikit-learn, PyTorch) sits on NumPy arrays. Interviews check that you can reason about shapes and dtypes.

**The idea.** An \`ndarray\` is a block of memory holding **one dtype** (e.g. float64) in a fixed **shape** (rows × columns × …). Because every element has the same type and size, operations run as compiled loops over raw memory instead of Python objects one by one.

Key attributes: \`shape\` (tuple of sizes), \`ndim\` (number of axes), \`size\` (number of elements), \`dtype\`. \`reshape\` reinterprets the same data with a new shape (sizes must multiply to the same total; \`-1\` means "infer this one").
`,
  maths: `
**In one breath.** \`np.array\`, \`zeros/ones/full\`, \`arange\` (step) vs \`linspace\` (count); one dtype, upcast on mixing; reshape keeps size; stack/concatenate along an axis.

\`\`\`python
import numpy as np
a = np.array([[1, 2, 3], [4, 5, 6]])
print(a.shape, a.ndim, a.size, a.dtype)   # (2, 3) 2 6 int64
print(np.array([1, 2.5]).dtype)           # float64 (ints upcast)
print(np.array([1, "a"]).dtype)           # <U21 (everything becomes strings!)
print(np.zeros((2, 2)), np.ones(3, dtype=int), np.full((2,), 7))
print(np.arange(0, 1, 0.25))              # [0.   0.25 0.5  0.75]  (stop excluded)
print(np.linspace(0, 1, 5))               # [0.   0.25 0.5  0.75 1.  ]  (5 points incl. end)
b = np.arange(12).reshape(3, -1)          # -1 inferred as 4
print(b.shape)                            # (3, 4)
print(b.T.shape, b.ravel().shape)         # (4, 3) (12,)
print(np.vstack([a, a]).shape, np.hstack([a, a]).shape)   # (4, 3) (2, 6)
print(np.concatenate([a, a], axis=1).shape)               # (2, 6)
x = np.array([1, 2, 3])
print(x[:, None].shape, x[None, :].shape) # (3, 1) (1, 3)  add an axis
print(np.array([1.9, -1.9]).astype(int))  # [ 1 -1]  (truncates)
\`\`\`

**Memory.** \`a.nbytes = a.size * a.itemsize\`: a float64 array of 10⁶ elements is 8 MB; float32 halves it.

**Integer overflow.** Fixed-width ints wrap: \`np.array([2**62]) * 4\` overflows silently (unlike Python ints).
`,
  practice: `
**Habits.** Print \`.shape\` constantly; most bugs are shape bugs. Specify \`dtype\` when memory or exact type matters. Use \`linspace\` for "n points between a and b", \`arange\` for "step of s". Avoid object arrays (mixed types) — they lose all the speed.
`,
  traps: [
    { trap: "`np.arange(0, 1, 0.1)` reliably gives 10 points.", why: "Float steps accumulate rounding error, so the count can be off by one. Use linspace when you know the number of points." },
    { trap: "A NumPy array can hold mixed types like a list.", why: "It holds one dtype; mixing numbers and strings converts everything to strings (or object), killing vectorised maths." },
  ],
  say: {
    prompt: "Why are NumPy arrays faster than Python lists for numerical work?",
    secs: 30,
    check: ["Homogeneous dtype in contiguous memory", "Vectorised operations run in compiled loops", "No per-element Python object overhead", "Shape/ndim/size/dtype attributes; reshape", "Less memory (8 bytes per float64)"],
    followups: [
      { q: "What does reshape(-1) or reshape(3, -1) mean?", a: "-1 tells NumPy to infer that dimension from the total size; reshape(-1) flattens." },
      { q: "arange vs linspace?", a: "arange uses a step (stop excluded, float steps can be inexact); linspace uses a number of points and includes the endpoint by default." },
      { q: "What happens when you put 1 and 2.5 in one array?", a: "NumPy upcasts to a common dtype, float64." },
    ],
    answer: `A NumPy array stores elements of a single dtype in one contiguous block of memory, so an operation like a sum or an elementwise multiply runs as a compiled loop over raw numbers. A Python list holds pointers to separate objects, each with type information, and a Python loop interprets every step. That's why vectorised NumPy code is often tens to hundreds of times faster and uses less memory, about 8 bytes per float64. The trade-off is that arrays have a fixed dtype and shape, so I keep an eye on shape and dtype.`,
    avoid: ["“NumPy is faster because it's multithreaded”"],
  },
  terms: [["ndarray", "N-dimensional homogeneous array."], ["dtype", "Element type, e.g. float64, int32, bool."], ["shape", "Tuple of sizes along each axis."]],
  sources: [S.basics],
});
Q({ id: "py2-npa-1", d: 1, secs: 20, prompt: "What is `np.arange(24).reshape(2, 3, -1).shape[2]`?", answer: 4, tol: 0.5, explain: "24 / (2 × 3) = 4.", py: "import numpy as np\nanswer = np.arange(24).reshape(2, 3, -1).shape[2]", packages: NP });
Q({ id: "py2-npa-2", d: 1, secs: 30, prompt: "How many elements does `np.linspace(0, 1, 11)` contain, and what is its second element? Give the second element.", answer: 0.1, tol: 0.001, explain: "11 points including both ends: step 0.1.", py: "import numpy as np\nanswer = float(np.linspace(0, 1, 11)[1])", packages: NP });
Q({ id: "py2-npa-3", d: 1, secs: 30, prompt: "`a` has shape (2, 3). What is the shape of `np.vstack([a, a, a])`? Give the number of rows.", answer: 6, tol: 0.5, explain: "Stacking vertically concatenates rows: (6, 3).", py: "import numpy as np\na = np.zeros((2, 3))\nanswer = np.vstack([a, a, a]).shape[0]", packages: NP });
Q({ id: "py2-npa-4", d: 2, secs: 30, prompt: "What is `np.array([1.9, -1.9, 2.5]).astype(int).sum()`?", answer: 2, tol: 0.5, explain: "astype(int) truncates towards zero: 1 − 1 + 2 = 2.", py: "import numpy as np\nanswer = int(np.array([1.9, -1.9, 2.5]).astype(int).sum())", packages: NP });
Q({ id: "py2-npa-5", d: 1, secs: 30, prompt: "How many megabytes (10⁶ bytes) does a float64 array of shape (1000, 500) use?", answer: 4, tol: 0.05, explain: "500,000 × 8 bytes = 4,000,000 bytes.", py: "import numpy as np\nanswer = np.zeros((1000, 500)).nbytes / 1e6", packages: NP });
C("py2-npa-c1", "arange vs linspace", "arange(start, stop, step) excludes stop; linspace(a, b, n) gives n points incl. b.");
C("py2-npa-c2", "Add an axis", "x[:, None] → column (n, 1); x[None, :] → row (1, n).");

// ───────────────────────── Indexing, views, copies ─────────────────────────

L("py2-np-indexing", M, "Indexing, slicing, views and copies", "Multi-dimensional indexing, slices as views, and when modifying a slice changes the original.", {
  kind: "concept", mins: 20, mathsLabel: "Code",
  hook: "You take `sub = a[:2, :2]`, set `sub[:] = 0`, and the original array changes. With a Python list it wouldn't. Why?",
  intuition: `
**The situation.** View-vs-copy confusion causes silent data corruption in feature pipelines, and it's the root of pandas' SettingWithCopyWarning.

**The idea.** Index a 2-D array with one bracket and a comma: \`a[row, col]\`. Slices work per axis: \`a[1:3, ::2]\`.

**Basic slicing returns a view**: a new array object that points at the same memory, just with different start/stride information. Writing through the view writes the original. That's what makes slicing cheap (O(1), no copying). **Advanced indexing** (integer lists, boolean masks) always returns a **copy**. Use \`.copy()\` when you want an independent piece.
`,
  maths: `
**In one breath.** \`a[i, j]\`, \`a[r0:r1, c0:c1]\`, \`a[:, j]\` (column), \`a[i]\` (row); slices = views (shared memory), fancy/boolean = copies; \`np.shares_memory\` to check.

\`\`\`python
import numpy as np
a = np.arange(12).reshape(3, 4)
# [[ 0  1  2  3]
#  [ 4  5  6  7]
#  [ 8  9 10 11]]
print(a[1, 2], a[-1, -1])      # 6 11
print(a[1])                    # [4 5 6 7]     row
print(a[:, 1])                 # [1 5 9]       column (1-D!)
print(a[:, 1:2].shape)         # (3, 1)        column kept 2-D
print(a[::2, ::3])             # [[ 0  3] [ 8 11]]

sub = a[:2, :2]                # view
sub[:] = 0
print(a[0])                    # [0 0 2 3]  original changed
print(np.shares_memory(a, sub))   # True

c = a[[0, 2]]                  # fancy indexing -> copy
c[:] = -1
print(a[2])                    # unchanged: [ 8  9 10 11]

safe = a[:2, :2].copy()        # explicit copy
print(a.reshape(4, 3).base is a)  # True: reshape usually returns a view
\`\`\`

**Python list contrast.** \`lst[:2]\` copies; \`arr[:2]\` views.

**Ellipsis.** \`x[..., 0]\` means "all leading axes, index 0 on the last": handy for images (H, W, C).
`,
  practice: `
**Rules.** If you slice and then modify, decide explicitly: \`.copy()\` for independence, or modify in place on purpose. When a function receives an array and shouldn't change it, copy at the top. Keep columns 2-D (\`a[:, [j]]\` or \`a[:, j:j+1]\`) when feeding scikit-learn, which expects (n_samples, n_features).
`,
  traps: [
    { trap: "Slicing a NumPy array copies it like a list slice.", why: "Basic slices are views sharing memory; writes go through to the original. Use .copy()." },
    { trap: "`a[:, 1]` is a column vector of shape (n, 1).", why: "Integer indexing drops the axis, giving shape (n,). Use a[:, 1:2] or a[:, [1]] to keep 2-D." },
  ],
  say: {
    prompt: "Explain views versus copies in NumPy indexing.",
    secs: 30,
    check: ["Basic slicing returns a view sharing memory", "Writes through a view modify the original", "Fancy (integer list) and boolean indexing return copies", ".copy() for independence; np.shares_memory to check", "Contrast with list slicing; pandas SettingWithCopy link"],
    followups: [
      { q: "Why does NumPy return views for slices?", a: "Speed and memory: a slice just changes offset/strides, so it's O(1) and doesn't duplicate data." },
      { q: "Does `a[a > 0] = 0` modify a?", a: "Yes: boolean indexing on the left of an assignment writes in place, even though reading a[a > 0] makes a copy." },
      { q: "How do you select rows 0 and 2 and columns 1 and 3 as a 2×2 block?", a: "`a[np.ix_([0, 2], [1, 3])]`, or `a[[0, 2]][:, [1, 3]]`; `a[[0, 2], [1, 3]]` pairs the indices and returns 2 elements." },
    ],
    answer: `Basic slicing with start:stop:step returns a view: a new array object over the same memory with different offsets and strides, so it's instant but writing through it changes the original. Advanced indexing, with an integer list or a boolean mask, builds a new array, so it's a copy. When I need an independent piece I call .copy(), and np.shares_memory tells me if two arrays overlap. It's the opposite of Python lists, where slicing copies, and it's the same issue behind pandas' SettingWithCopyWarning.`,
    avoid: ["“Slicing always copies”"],
  },
  terms: [["View", "Array sharing another array's memory."], ["Strides", "Bytes to step to the next element along each axis."], ["Fancy indexing", "Indexing with integer arrays/lists; returns a copy."]],
  sources: [S.idx],
});
Q({ id: "py2-npi-1", d: 1, secs: 45, prompt: "```python\na = np.arange(12).reshape(3, 4)\nsub = a[:2, :2]\nsub += 100\nprint(a.sum())\n```\nWhat is printed?", answer: 466, tol: 0.5, explain: "Original sum 66 plus 4 × 100 through the view.", py: "import numpy as np\na = np.arange(12).reshape(3, 4)\nsub = a[:2, :2]\nsub += 100\nanswer = int(a.sum())", packages: NP });
Q({ id: "py2-npi-2", d: 1, secs: 45, prompt: "```python\na = np.arange(12).reshape(3, 4)\nc = a[[0, 2]]\nc += 100\nprint(a.sum())\n```\nWhat is printed?", answer: 66, tol: 0.5, explain: "Fancy indexing returns a copy; a is unchanged.", py: "import numpy as np\na = np.arange(12).reshape(3, 4)\nc = a[[0, 2]]\nc += 100\nanswer = int(a.sum())", packages: NP });
Q({ id: "py2-npi-3", d: 1, secs: 30, prompt: "`a` has shape (5, 3). What is `a[:, 1].ndim`?", answer: 1, tol: 0.5, explain: "An integer index drops that axis: shape (5,).", py: "import numpy as np\nanswer = np.zeros((5, 3))[:, 1].ndim", packages: NP });
Q({ id: "py2-npi-4", d: 2, secs: 45, prompt: "`a = np.arange(12).reshape(3, 4)`. What is `a[[0, 2], [1, 3]].sum()`?", answer: 12, tol: 0.5, explain: "Paired indices pick a[0,1] = 1 and a[2,3] = 11.", py: "import numpy as np\na = np.arange(12).reshape(3, 4)\nanswer = int(a[[0, 2], [1, 3]].sum())", packages: NP });
C("py2-npi-c1", "View vs copy", "Basic slices → views. Integer/boolean indexing → copies. .copy() to be safe.");
C("py2-npi-c2", "Keep a column 2-D", "a[:, [j]] or a[:, j:j+1] → shape (n, 1).");

// ───────────────────────── Boolean and fancy indexing ─────────────────────────

L("py2-np-boolean", M, "Boolean masks, np.where and conditional logic", "Filtering with masks, combining conditions with & | ~, np.where/select, counting and conditional replacement.", {
  kind: "concept", mins: 20, mathsLabel: "Code",
  hook: "Cap all transactions above the 99th percentile and flag negatives, without a single Python loop.",
  intuition: `
**The situation.** Cleaning and feature engineering are mostly "where this condition holds, do that".

**The idea.** A comparison on an array gives a **boolean array** of the same shape (a mask). Use it to:

- **Filter:** \`a[mask]\` returns the matching elements (1-D copy).
- **Assign:** \`a[mask] = value\` writes in place.
- **Count / proportion:** \`mask.sum()\`, \`mask.mean()\` (True counts as 1).
- **Choose element-wise:** \`np.where(cond, x, y)\`, or \`np.select([c1, c2], [v1, v2], default)\` for several cases.

Combine masks with \`&\` (and), \`|\` (or), \`~\` (not), with **parentheses** around each comparison, because these operators bind tighter than \`<\` and \`>\`.
`,
  maths: `
**In one breath.** mask = comparison; \`a[mask]\` filter; \`a[mask] = v\` assign; \`(c1) & (c2)\`; \`np.where\`, \`np.select\`, \`np.clip\`; \`mask.mean()\` = share.

\`\`\`python
import numpy as np
amt = np.array([120, -5, 300, 15000, 80, 0])
mask = amt > 100
print(mask)                         # [ True False  True  True False False]
print(amt[mask], mask.sum(), mask.mean())   # [  120   300 15000] 3 0.5
print(amt[(amt > 0) & (amt < 1000)])        # [120 300  80]
print(amt[~(amt > 0)])                      # [-5  0]

cap = np.percentile(amt, 90)
capped = np.where(amt > cap, cap, amt)      # element-wise if/else
clipped = np.clip(amt, 0, 1000)             # [ 120    0  300 1000   80    0]

band = np.select([amt < 0, amt < 100, amt < 1000], ["refund", "small", "medium"], default="large")
print(band)        # ['medium' 'refund' 'medium' 'large' 'small' 'small']

amt2 = amt.copy(); amt2[amt2 < 0] = 0       # in-place conditional replacement
print(np.where(amt > 1000)[0])              # [3]  indices where True
print(np.any(amt < 0), np.all(amt < 20000)) # True True
\`\`\`

**NaN.** Comparisons with NaN are always False; use \`np.isnan\` (\`a[~np.isnan(a)]\`) and nan-aware reductions (\`np.nanmean\`).
`,
  practice: `
**Patterns.** Winsorise with clip or percentiles; build flags (\`is_large = (amt > t).astype(int)\`); count conditions with \`.sum()\`, rates with \`.mean()\`; bucket with \`np.select\` or \`np.digitize\`. pandas uses the same mask syntax (\`df[(df.a > 0) & (df.b == "x")]\`).
`,
  traps: [
    { trap: "`a[a > 0 and a < 10]` filters a range.", why: "`and` needs a single True/False and raises 'truth value of an array is ambiguous'. Use `(a > 0) & (a < 10)` with parentheses." },
    { trap: "`a > 0 & a < 10` works without parentheses.", why: "`&` binds tighter than comparisons, so it evaluates `0 & a` first. Always parenthesise each condition." },
  ],
  say: {
    prompt: "How do you apply conditional logic to a NumPy array without loops?",
    secs: 30,
    check: ["Comparisons produce boolean masks", "Filter a[mask], assign a[mask] = v", "Combine with & | ~ and parentheses (not and/or)", "np.where for if/else, np.select for multiple cases, np.clip", "mask.sum() counts, mask.mean() proportion; NaN needs isnan"],
    followups: [
      { q: "What does `np.where(cond)` return with a single argument?", a: "A tuple of index arrays where cond is True (like np.nonzero)." },
      { q: "How do you get the share of values above a threshold?", a: "`(a > t).mean()`, since True counts as 1." },
      { q: "How would you bucket values into ranges?", a: "`np.select` with ordered conditions, `np.digitize(a, bins)`, or pandas `pd.cut`." },
    ],
    answer: `A comparison like \`a > 100\` produces a boolean mask of the same shape. I can filter with \`a[mask]\`, assign in place with \`a[mask] = value\`, count matches with \`mask.sum()\` and get a proportion with \`mask.mean()\`. Conditions combine with \`&\`, \`|\` and \`~\`, and each comparison needs parentheses because those operators bind tighter; Python's and/or don't work on arrays. For element-wise if/else I use np.where, np.select for several cases, and np.clip to cap values.`,
    avoid: ["Using and/or on arrays", "Looping over elements"],
  },
  terms: [["Boolean mask", "Array of True/False used to select elements."], ["np.where", "Element-wise choice between two values."], ["np.select", "Element-wise choice among several conditions."]],
  sources: [S.idx, S.basics],
});
Q({ id: "py2-npb-1", d: 1, secs: 30, prompt: "`a = np.array([120, -5, 300, 15000, 80, 0])`. What is `a[(a > 0) & (a < 1000)].sum()`?", answer: 500, tol: 0.5, explain: "120 + 300 + 80.", py: "import numpy as np\na = np.array([120, -5, 300, 15000, 80, 0])\nanswer = int(a[(a > 0) & (a < 1000)].sum())", packages: NP });
Q({ id: "py2-npb-2", d: 1, secs: 30, prompt: "Same `a`. What is `(a > 100).mean()`?", answer: 0.5, tol: 0.005, explain: "3 of 6 values exceed 100.", py: "import numpy as np\na = np.array([120, -5, 300, 15000, 80, 0])\nanswer = float((a > 100).mean())", packages: NP });
Q({ id: "py2-npb-3", d: 1, secs: 30, prompt: "Same `a`. What is `np.clip(a, 0, 1000).sum()`?", answer: 1500, tol: 0.5, explain: "120 + 0 + 300 + 1000 + 80 + 0.", py: "import numpy as np\na = np.array([120, -5, 300, 15000, 80, 0])\nanswer = int(np.clip(a, 0, 1000).sum())", packages: NP });
Q({ id: "py2-npb-4", d: 2, secs: 45, prompt: "```python\nx = np.array([1., np.nan, 3., np.nan])\nprint((x == np.nan).sum() + np.isnan(x).sum())\n```\nWhat is printed?", answer: 2, tol: 0.5, explain: "x == nan is always False (0); isnan finds 2.", py: "import numpy as np\nx = np.array([1., np.nan, 3., np.nan])\nanswer = int((x == np.nan).sum() + np.isnan(x).sum())", packages: NP });
Q({ id: "py2-npb-5", d: 2, secs: 45, prompt: "`np.select([a < 0, a < 100], [-1, 1], default=2)` on `[-3, 50, 100, 7]`. What is the sum of the result?", answer: 3, tol: 0.5, explain: "Values: −1, 1, 2, 1 → 3. The first true condition wins.", py: "import numpy as np\na = np.array([-3, 50, 100, 7])\nanswer = int(np.select([a < 0, a < 100], [-1, 1], default=2).sum())", packages: NP });
C("py2-npb-c1", "Combine masks", "(a > 0) & (a < 10) — parentheses, & | ~, never and/or.");
C("py2-npb-c2", "Count and rate", "mask.sum() = count; mask.mean() = share.");

// ───────────────────────── Broadcasting ─────────────────────────

L("py2-np-broadcasting", M, "Broadcasting", "How arrays of different shapes combine: the trailing-axis rule, standardising columns and pairwise distances.", {
  kind: "concept", mins: 25, mathsLabel: "Code",
  hook: "`X - X.mean(axis=0)` subtracts each column's mean from a (1000, 5) matrix using a (5,) array. Why does that work, and why does `X - X.mean(axis=1)` fail?",
  intuition: `
**The situation.** Standardising features, normalising rows, computing distance matrices: all one line with broadcasting, and a common source of silent shape bugs.

**The idea.** When two arrays have different shapes, NumPy compares their shapes **from the right**. Two dimensions are compatible if they're **equal or one of them is 1**. A missing leading dimension counts as 1. Size-1 dimensions are virtually stretched (no data is copied) to match the other array.

So (1000, 5) with (5,): align right → 5 vs 5 OK, then 1000 vs (missing = 1) OK → result (1000, 5). But (1000, 5) with (1000,): 5 vs 1000 → error. Fix by making the row means a column: shape (1000, 1).
`,
  maths: `
**In one breath.** Align shapes on the right; each pair equal or 1; result takes the max; use \`[:, None]\` or \`keepdims=True\` to make a column.

\`\`\`python
import numpy as np
X = np.arange(12, dtype=float).reshape(4, 3)
col_mean = X.mean(axis=0)                 # shape (3,)
Xc = X - col_mean                         # (4, 3) - (3,) -> (4, 3)
Z = (X - X.mean(0)) / X.std(0)            # standardise columns

row_mean = X.mean(axis=1)                 # shape (4,)
# X - row_mean  -> ValueError: (4,3) vs (4,)
Xr = X - row_mean[:, None]                # (4, 3) - (4, 1) OK
Xr = X - X.mean(axis=1, keepdims=True)    # same

a = np.array([0, 10, 20])
b = np.array([1, 2])
print((a[:, None] + b).shape)             # (3, 2): outer sum
print(a[:, None] * b)                     # outer product table

P = np.array([[0, 0], [3, 4], [6, 8]])    # 3 points in 2-D
D = np.sqrt(((P[:, None, :] - P[None, :, :]) ** 2).sum(-1))   # (3, 3) distance matrix
print(D[0, 1], D[0, 2])                   # 5.0 10.0
\`\`\`

| A shape | B shape | Result |
|---|---|---|
| (4, 3) | (3,) | (4, 3) |
| (4, 3) | (4, 1) | (4, 3) |
| (4, 1) | (1, 3) | (4, 3) |
| (4, 3) | (4,) | error |
| (8, 1, 6) | (7, 1) | (8, 7, 6) |

**Memory.** Broadcasting avoids copies, but the result is full size: a pairwise distance matrix of 50,000 points is 2.5 × 10⁹ entries.
`,
  practice: `
**Uses.** Column standardisation, row normalisation (\`X / X.sum(1, keepdims=True)\`), adding a bias vector to a batch, outer products, pairwise distances for k-NN, and in PyTorch the exact same rules.

**Debugging.** Write the shapes down right-aligned. When a result is unexpectedly (n, n) instead of (n,), an accidental broadcast of (n,) with (n, 1) happened.
`,
  traps: [
    { trap: "`X - X.mean(axis=1)` subtracts each row's mean.", why: "The (n,) means align with the column axis: error (or wrong result if n equals the number of columns). Use keepdims=True or [:, None]." },
    { trap: "`y_true - y_pred` is safe when one is (n,) and the other (n, 1).", why: "They broadcast to (n, n): a silent, huge, wrong result. Flatten both to (n,) first." },
  ],
  say: {
    prompt: "Explain NumPy's broadcasting rules with an example.",
    secs: 45,
    check: ["Compare shapes from the trailing dimension", "Compatible if equal or one is 1; missing dims count as 1", "Size-1 dims stretched without copying", "Example: (n, d) − (d,) column means works; row means need (n, 1)", "Pitfall: (n,) vs (n, 1) → (n, n)"],
    followups: [
      { q: "What does keepdims=True do?", a: "Keeps reduced axes as size 1, e.g. X.mean(axis=1, keepdims=True) has shape (n, 1), which broadcasts back against X." },
      { q: "How do you compute all pairwise differences between two vectors?", a: "a[:, None] - b[None, :] gives a (len a, len b) matrix." },
      { q: "Does broadcasting copy data?", a: "No, it uses zero strides for stretched dimensions; only the output is allocated." },
    ],
    answer: `NumPy lines the two shapes up from the right and compares each pair of dimensions: they must be equal or one of them must be 1, and a missing leading dimension counts as 1. Size-1 dimensions are stretched virtually, without copying, and the result takes the larger size. So subtracting column means of shape (d,) from a (n, d) matrix works, but row means of shape (n,) need to become (n, 1), using keepdims=True or [:, None]. The classic bug is subtracting a (n,) array from a (n, 1) array, which silently produces an n-by-n matrix.`,
    avoid: ["“Broadcasting copies the smaller array”"],
  },
  terms: [["Broadcasting", "Implicit expansion of size-1 dimensions in element-wise operations."], ["keepdims", "Keep reduced axes as length 1."]],
  sources: [S.bc],
});
Q({ id: "py2-npbc-1", d: 1, secs: 30, prompt: "Shapes (8, 1, 6) and (7, 1) broadcast to what shape? Give the middle dimension.", answer: 7, tol: 0.5, explain: "Right-aligned: 6 vs 1 → 6; 1 vs 7 → 7; 8 vs (1) → 8 → (8, 7, 6).", py: "import numpy as np\nanswer = np.broadcast_shapes((8, 1, 6), (7, 1))[1]", packages: NP });
Q({ id: "py2-npbc-2", d: 2, secs: 45, prompt: "`y_true` has shape (100,), `y_pred` has shape (100, 1). How many elements does `y_true - y_pred` have?", answer: 10000, tol: 0.5, explain: "(100,) vs (100, 1) broadcasts to (100, 100): a silent bug.", py: "import numpy as np\nanswer = (np.zeros(100) - np.zeros((100, 1))).size", packages: NP });
Q({ id: "py2-npbc-3", d: 2, secs: 45, prompt: "`X = np.arange(12).reshape(4, 3)`. What is `(X - X.mean(axis=1, keepdims=True))[2].sum()`?", answer: 0, tol: 0.001, explain: "Each row minus its own mean sums to 0.", py: "import numpy as np\nX = np.arange(12).reshape(4, 3)\nanswer = float((X - X.mean(axis=1, keepdims=True))[2].sum())", packages: NP });
Q({ id: "py2-npbc-4", d: 2, secs: 60, prompt: "Points (0, 0), (3, 4), (6, 8). Using the broadcasted distance matrix, what is the sum of all entries?", answer: 40, tol: 0.01, explain: "Distances 5, 10, 5, each counted twice: 2 × 20 = 40.", py: "import numpy as np\nP = np.array([[0, 0], [3, 4], [6, 8]])\nD = np.sqrt(((P[:, None, :] - P[None, :, :]) ** 2).sum(-1))\nanswer = float(D.sum())", packages: NP });
C("py2-npbc-c1", "Broadcasting rule", "Right-align shapes; each pair equal or 1.");
C("py2-npbc-c2", "Row-wise ops", "X - X.mean(axis=1, keepdims=True)");

// ───────────────────────── Axis reductions ─────────────────────────

L("py2-np-axis", M, "Reductions along axes", "sum/mean/max/argmax with axis, cumulative ops, sorting and argsort, unique and counts.", {
  kind: "concept", mins: 20, mathsLabel: "Code",
  hook: "Scores is (students × subjects). Which axis gives each student's total, and which gives each subject's top scorer?",
  intuition: `
**The situation.** Almost every aggregation is "reduce along an axis": per-row totals, per-column means, the index of the best item.

**The idea.** The \`axis\` argument names the axis that **disappears**. For a (rows, cols) array:

- \`axis=0\` collapses rows → one value per **column** (shape (cols,)).
- \`axis=1\` collapses columns → one value per **row** (shape (rows,)).
- No axis → one number for the whole array.

\`argmax\`/\`argmin\` return positions, \`argsort\` returns the order that would sort, \`cumsum\` keeps the axis but accumulates along it.
`,
  maths: `
**In one breath.** axis = the dimension that gets collapsed; argmax for "which"; argsort for ranking; cumsum for running totals; np.unique(return_counts=True) for frequencies.

\`\`\`python
import numpy as np
scores = np.array([[70, 85, 90],     # student 0
                   [88, 92, 60],     # student 1
                   [95, 70, 80]])    # student 2
print(scores.sum(axis=1))            # [245 240 245]  per student
print(scores.mean(axis=0))           # [84.33 82.33 76.67] per subject
print(scores.argmax(axis=0))         # [2 1 0]  top student per subject
print(scores.max(), scores.argmax()) # 95 6  (flat index)
print(np.unravel_index(scores.argmax(), scores.shape))   # (2, 0)

print(np.cumsum([3, 1, 4, 1]))       # [3 4 8 9]
order = np.argsort(-scores[:, 0])    # rank students by subject 0, descending
print(order)                         # [2 1 0]
print(np.sort(scores, axis=1)[:, -1])   # best score per student [90 92 95]

vals, counts = np.unique(np.array([3, 1, 3, 2, 3]), return_counts=True)
print(vals, counts)                  # [1 2 3] [1 1 3]
print(np.percentile(scores, 50), np.median(scores, axis=1))
print(np.nanmean(np.array([1, np.nan, 3])))   # 2.0
\`\`\`

**Ranks.** \`argsort(argsort(x))\` gives each element's rank (0-based). Top-k indices without a full sort: \`np.argpartition(-x, k)[:k]\`.

**Ties in argmax.** The first occurrence wins.
`,
  practice: `
**Map the question to the axis.** "For each row" → axis=1; "for each column/feature" → axis=0. In pandas, \`df.mean()\` defaults to axis=0 (per column) with the same meaning.

**Shapes after reduction.** Reductions drop the axis; add \`keepdims=True\` if you'll broadcast the result back.
`,
  traps: [
    { trap: "`axis=0` means 'along each row'.", why: "axis=0 is collapsed, so you get one result per column. Think 'the axis that disappears'." },
    { trap: "`a.argmax()` on a 2-D array returns (row, col).", why: "Without an axis it returns a flat index; convert with np.unravel_index." },
  ],
  say: {
    prompt: "In NumPy, what does `axis=0` versus `axis=1` mean in `arr.sum(axis=...)` for a 2-D array?",
    secs: 30,
    check: ["axis names the dimension that is collapsed", "axis=0 → one result per column; axis=1 → per row", "argmax/argmin give positions; flat index without axis", "keepdims for broadcasting back", "Same convention in pandas"],
    followups: [
      { q: "How do you find the column index of each row's maximum?", a: "`a.argmax(axis=1)`." },
      { q: "How do you get the top 3 values' indices efficiently?", a: "`np.argpartition(-a, 3)[:3]` (O(n)), then sort those 3 if order matters." },
      { q: "What does cumsum(axis=1) do?", a: "Running totals across each row; the shape is unchanged." },
    ],
    answer: `The axis argument is the dimension that gets collapsed. For a rows-by-columns array, sum(axis=0) adds down the rows and gives one total per column, while sum(axis=1) adds across the columns and gives one value per row. No axis reduces everything to one number. argmax works the same way but returns positions, and without an axis it returns a flat index that I convert with unravel_index. If I need to broadcast a reduction back against the original, I use keepdims=True.`,
    avoid: ["Confusing axis=0 with 'each row'"],
  },
  terms: [["Reduction", "Operation that aggregates along an axis."], ["argmax", "Index of the maximum."], ["argsort", "Indices that would sort the array."]],
  sources: [S.basics],
});
Q({ id: "py2-npax-1", d: 1, secs: 30, prompt: "`s = np.array([[70, 85, 90], [88, 92, 60], [95, 70, 80]])`. What is `s.sum(axis=0)[1]`?", answer: 247, tol: 0.5, explain: "Column 1: 85 + 92 + 70.", py: "import numpy as np\ns = np.array([[70, 85, 90], [88, 92, 60], [95, 70, 80]])\nanswer = int(s.sum(axis=0)[1])", packages: NP });
Q({ id: "py2-npax-2", d: 1, secs: 30, prompt: "Same `s`. What is `s.argmax()` (no axis)?", answer: 6, tol: 0.5, explain: "95 is at row 2, col 0 → flat index 2 × 3 + 0 = 6.", py: "import numpy as np\ns = np.array([[70, 85, 90], [88, 92, 60], [95, 70, 80]])\nanswer = int(s.argmax())", packages: NP });
Q({ id: "py2-npax-3", d: 2, secs: 45, prompt: "Same `s`. What is `s.argmax(axis=1).sum()`?", answer: 3, tol: 0.5, explain: "Row maxima positions: 2, 1, 0.", py: "import numpy as np\ns = np.array([[70, 85, 90], [88, 92, 60], [95, 70, 80]])\nanswer = int(s.argmax(axis=1).sum())", packages: NP });
Q({ id: "py2-npax-4", d: 2, secs: 45, prompt: "`x = np.array([40, 10, 30, 20])`. What is `np.argsort(np.argsort(x))[0]` (the 0-based rank of 40)?", answer: 3, tol: 0.5, explain: "40 is the largest of 4 values: rank 3.", py: "import numpy as np\nx = np.array([40, 10, 30, 20])\nanswer = int(np.argsort(np.argsort(x))[0])", packages: NP });
Q({ id: "py2-npax-5", d: 1, secs: 30, prompt: "`vals, counts = np.unique([3, 1, 3, 2, 3, 2], return_counts=True)`. What is `vals[counts.argmax()]`?", answer: 3, tol: 0.5, explain: "3 appears three times.", py: "import numpy as np\nvals, counts = np.unique([3, 1, 3, 2, 3, 2], return_counts=True)\nanswer = int(vals[counts.argmax()])", packages: NP });
C("py2-npax-c1", "axis meaning", "axis=0 → per column; axis=1 → per row. The named axis disappears.");
C("py2-npax-c2", "Flat index to (row, col)", "np.unravel_index(a.argmax(), a.shape)");

// ───────────────────────── Vectorisation ─────────────────────────

L("py2-np-vectorise", M, "Vectorisation instead of loops", "Rewriting loops as array expressions: ufuncs, diff, cumsum, convolution and why np.vectorize isn't vectorisation.", {
  kind: "concept", mins: 20, mathsLabel: "Code",
  hook: "An interviewer gives you a loop that computes daily returns and a 7-day moving average over 10 million prices. Rewrite it without loops.",
  intuition: `
**The situation.** "Can you vectorise this?" is a standard DS screening follow-up. It tests whether you think in arrays.

**The idea.** Replace per-element Python loops with whole-array operations:

- Arithmetic and **ufuncs** (\`np.exp\`, \`np.log\`, \`np.sqrt\`, \`np.maximum\`) apply element-wise in C.
- Neighbour differences: \`np.diff\`, or slices \`a[1:] - a[:-1]\`.
- Running totals: \`np.cumsum\`; moving windows from cumsum differences or \`np.convolve\`.
- Conditions: masks and \`np.where\` (previous lessons).

\`np.vectorize\` is a convenience wrapper around a Python loop: it doesn't make code faster.
`,
  maths: `
**In one breath.** Think in shifted slices; cumsum turns window sums into O(n); ufuncs beat Python functions; np.vectorize is just a loop.

\`\`\`python
import numpy as np
p = np.array([100, 102, 101, 105, 110, 108], dtype=float)

# loop version
rets = [p[i] / p[i - 1] - 1 for i in range(1, len(p))]
# vectorised
rets = p[1:] / p[:-1] - 1                 # same values, one C loop
logret = np.diff(np.log(p))

k = 3
c = np.cumsum(np.insert(p, 0, 0))
ma = (c[k:] - c[:-k]) / k                 # 3-period moving average, O(n)
print(ma)                                 # [101.     102.667  105.333  107.667]
ma2 = np.convolve(p, np.ones(k) / k, mode="valid")   # same

peak = np.maximum.accumulate(p)           # running max
drawdown = p / peak - 1
print(drawdown.min())                     # about -0.018

x = np.random.default_rng(0).normal(size=1_000_000)
relu = np.maximum(x, 0)                   # ufunc, fast
sigmoid = 1 / (1 + np.exp(-x))
# np.vectorize(lambda v: max(v, 0))(x)    # works but ~100x slower
\`\`\`

**When you can't vectorise.** Sequential dependence where each step depends on the previous output (some simulations, path-dependent logic): use a loop with Numba, or restructure with cumulative operations where possible.
`,
  practice: `
**Recipe.** Identify the per-element formula → express neighbours as shifted slices → turn running/window logic into cumsum/convolve/accumulate → replace if/else with masks or where. Check against the loop on a small input with \`np.allclose\`.

**pandas equivalents.** \`pct_change\`, \`diff\`, \`rolling(k).mean()\`, \`cummax\`.
`,
  traps: [
    { trap: "`np.vectorize` makes a Python function run at C speed.", why: "It's a loop in disguise; useful for broadcasting convenience, not performance." },
    { trap: "A moving average needs a loop over windows (O(n·k)).", why: "With cumulative sums each window is one subtraction: O(n) overall." },
  ],
  say: {
    prompt: "How would you vectorise the computation of returns and a moving average over a price array?",
    secs: 45,
    check: ["Returns as p[1:] / p[:-1] − 1 or np.diff(np.log(p))", "Moving average via cumsum differences or convolve: O(n)", "ufuncs / accumulate (running max)", "np.vectorize is not true vectorisation", "Verify vs loop with np.allclose; pandas equivalents"],
    followups: [
      { q: "How do you compute a running maximum?", a: "`np.maximum.accumulate(a)` (pandas: cummax())." },
      { q: "Why are log returns convenient?", a: "They add over time: the multi-period log return is the sum of single-period ones, so cumsum gives cumulative performance." },
      { q: "What do you do when each step depends on the previous result?", a: "Look for a cumulative formulation; otherwise keep a loop and JIT it (Numba) or accept Python speed for small n." },
    ],
    answer: `Returns are a ratio of neighbours, so I use shifted slices: p[1:] / p[:-1] − 1, or np.diff(np.log(p)) for log returns, one compiled pass with no Python loop. For a k-period moving average I take a cumulative sum with a zero prepended; each window sum is then c[i + k] − c[i], so the whole thing is O(n) instead of O(n·k), or I use np.convolve with a k-length averaging kernel. Running max and drawdown come from np.maximum.accumulate. I'd check the result against the loop with np.allclose. np.vectorize wouldn't help, because it's still a Python loop underneath.`,
    avoid: ["“np.vectorize speeds it up”"],
  },
  terms: [["Vectorisation", "Expressing computation as whole-array operations."], ["ufunc", "Universal function: element-wise compiled operation."], ["accumulate", "ufunc method giving running results (e.g. running max)."]],
  sources: [S.basics],
});
Q({ id: "py2-npv-1", d: 1, secs: 45, prompt: "`p = np.array([100, 110, 99])`. What is `(p[1:] / p[:-1] - 1).sum()`? (2 decimals)", answer: 0, tol: 0.005, explain: "+0.10 and −0.10: sum 0.00.", py: "import numpy as np\np = np.array([100, 110, 99])\nanswer = float((p[1:] / p[:-1] - 1).sum())", packages: NP });
Q({ id: "py2-npv-2", d: 2, secs: 60, prompt: "3-period moving average of `[100, 102, 101, 105, 110, 108]` via cumsum. What is the last value? (2 decimals)", answer: 107.67, tol: 0.01, explain: "(105 + 110 + 108)/3 = 107.67.", py: "import numpy as np\np = np.array([100, 102, 101, 105, 110, 108], dtype=float)\nc = np.cumsum(np.insert(p, 0, 0))\nanswer = float(((c[3:] - c[:-3]) / 3)[-1])", packages: NP });
Q({ id: "py2-npv-3", d: 2, secs: 60, prompt: "Prices `[100, 120, 90, 130, 104]`. What is the maximum drawdown `(p / np.maximum.accumulate(p) - 1).min()`? (2 decimals)", answer: -0.25, tol: 0.005, explain: "From the peak 120 to 90: −25%. (130 → 104 is −20%.)", py: "import numpy as np\np = np.array([100, 120, 90, 130, 104], dtype=float)\nanswer = float((p / np.maximum.accumulate(p) - 1).min())", packages: NP });
Q({ id: "py2-npv-4", d: 1, secs: 30, prompt: "What is `len(np.convolve(np.arange(10), np.ones(4) / 4, mode='valid'))`?", answer: 7, tol: 0.5, explain: "Valid windows: 10 − 4 + 1 = 7.", py: "import numpy as np\nanswer = len(np.convolve(np.arange(10), np.ones(4) / 4, mode='valid'))", packages: NP });
C("py2-npv-c1", "Moving average O(n)", "c = cumsum([0, *p]); ma = (c[k:] − c[:-k]) / k");
C("py2-npv-c2", "Returns", "p[1:] / p[:-1] − 1; log returns: np.diff(np.log(p)).");

// ───────────────────────── Linear algebra ─────────────────────────

L("py2-np-linalg", M, "Linear algebra with NumPy", "dot vs @ vs *, matrix shapes, solving systems, least squares, norms and inverses you shouldn't compute.", {
  kind: "concept", mins: 20, mathsLabel: "Code",
  hook: "Fit linear regression weights with three lines of NumPy, and explain why you'd use `lstsq` rather than inverting XᵀX.",
  intuition: `
**The situation.** ML interviews ask you to implement a model "from scratch with NumPy": linear regression, a forward pass, cosine similarity. That's matrix shapes and a few linalg calls.

**The idea.** \`*\` is element-wise; \`@\` (or \`np.dot\` for 2-D) is **matrix multiplication**: (m, n) @ (n, p) → (m, p), inner dimensions must match. A linear model's predictions for all rows at once are \`X @ w\`.

For solving \`A x = b\`, call \`np.linalg.solve\`; for least squares (more equations than unknowns) call \`np.linalg.lstsq\`. Explicitly inverting a matrix is slower and less numerically stable.
`,
  maths: `
**In one breath.** \`A @ B\` needs A.shape[-1] == B.shape[0]; \`*\` is element-wise; \`solve\` for square systems; \`lstsq\` for regression; \`norm\` for lengths; cosine = a·b / (‖a‖‖b‖).

\`\`\`python
import numpy as np
A = np.array([[1, 2], [3, 4]])
B = np.array([[5, 6], [7, 8]])
print(A * B)          # [[ 5 12] [21 32]]  element-wise
print(A @ B)          # [[19 22] [43 50]]  matrix product

rng = np.random.default_rng(0)
X = np.c_[np.ones(100), rng.normal(size=(100, 2))]   # add intercept column
true_w = np.array([1.0, 2.0, -3.0])
y = X @ true_w + rng.normal(scale=0.1, size=100)
w, *_ = np.linalg.lstsq(X, y, rcond=None)            # least squares
print(w.round(1))                                    # close to [ 1.  2. -3.]
w_ne = np.linalg.solve(X.T @ X, X.T @ y)             # normal equations

M = np.array([[4., 1.], [1., 3.]]); b = np.array([1., 2.])
x = np.linalg.solve(M, b); print(np.allclose(M @ x, b))   # True
print(np.linalg.det(M), np.linalg.eigvalsh(M))       # 11.0, eigenvalues

a, c = np.array([1., 0., 1.]), np.array([1., 1., 0.])
cos = a @ c / (np.linalg.norm(a) * np.linalg.norm(c))
print(round(cos, 2))                                 # 0.5

E = rng.normal(size=(5, 8)); q = rng.normal(size=8)
sims = E @ q / (np.linalg.norm(E, axis=1) * np.linalg.norm(q))   # cosine vs 5 rows
\`\`\`

**Shapes to remember.** (n, d) @ (d,) → (n,); (n, d) @ (d, k) → (n, k); (d,) @ (d,) → scalar.
`,
  practice: `
**From-scratch tasks.** Linear regression (lstsq or gradient descent), logistic regression (sigmoid of X @ w, gradient Xᵀ(p − y)/n), PCA (SVD of centred X), cosine similarity search (normalise rows, one matrix product), a dense layer (X @ W + b).

**Numerics.** Prefer solve/lstsq/SVD over inv; check conditioning (\`np.linalg.cond\`) when features are collinear.
`,
  traps: [
    { trap: "`A * B` multiplies matrices.", why: "* is element-wise (and broadcasts). Use @ or np.matmul for matrix products." },
    { trap: "Compute `inv(X.T @ X) @ X.T @ y` for regression.", why: "Inverting is slower and numerically unstable, especially with collinear features. Use lstsq (or solve on the normal equations)." },
  ],
  say: {
    prompt: "How would you implement linear regression from scratch in NumPy?",
    secs: 45,
    check: ["Add an intercept column; predictions X @ w", "Closed form via lstsq or solve(XᵀX, Xᵀy), not inv", "Shapes: (n, d) @ (d,) → (n,)", "Gradient descent alternative: w −= lr · Xᵀ(Xw − y)/n", "Mentions conditioning / scaling"],
    followups: [
      { q: "What's the difference between `*`, `@` and `np.dot`?", a: "* is element-wise; @ is matrix multiplication (batched for >2-D); np.dot is matrix multiplication for 2-D and has different rules for higher dimensions." },
      { q: "How do you compute cosine similarity between a query and 1M embeddings fast?", a: "Pre-normalise rows to unit length; then similarity is one matrix-vector product E @ q; use argpartition for the top k." },
      { q: "Why might XᵀX be singular?", a: "Perfectly collinear features or more features than rows; use regularisation (ridge adds λI) or lstsq/pinv." },
    ],
    answer: `I'd add a column of ones to X for the intercept, so predictions for all rows are X @ w. For the closed-form fit I'd call np.linalg.lstsq(X, y), or solve the normal equations with np.linalg.solve(X.T @ X, X.T @ y), rather than inverting XᵀX, which is slower and unstable when features are collinear. For large data I'd use gradient descent instead: the gradient of mean squared error is Xᵀ(Xw − y)/n, and I'd update w by a learning rate times that. Checking shapes at each step, (n, d) times (d,) gives (n,), catches most bugs.`,
    avoid: ["Using * for matrix multiplication", "Inverting matrices explicitly"],
  },
  terms: [["Matrix product", "(m, n) @ (n, p) → (m, p)."], ["Least squares", "Minimise ‖Xw − y‖²."], ["Cosine similarity", "a·b / (‖a‖‖b‖)."]],
  sources: [S.la],
});
Q({ id: "py2-npl-1", d: 1, secs: 30, prompt: "`A = [[1, 2], [3, 4]]`, `B = [[5, 6], [7, 8]]` as arrays. What is `(A @ B)[1, 0]`?", answer: 43, tol: 0.5, explain: "Row 1 of A · column 0 of B: 3·5 + 4·7 = 43.", py: "import numpy as np\nA = np.array([[1, 2], [3, 4]]); B = np.array([[5, 6], [7, 8]])\nanswer = int((A @ B)[1, 0])", packages: NP });
Q({ id: "py2-npl-2", d: 1, secs: 30, prompt: "Same A, B. What is `(A * B)[1, 0]`?", answer: 21, tol: 0.5, explain: "Element-wise: 3 × 7.", py: "import numpy as np\nA = np.array([[1, 2], [3, 4]]); B = np.array([[5, 6], [7, 8]])\nanswer = int((A * B)[1, 0])", packages: NP });
Q({ id: "py2-npl-3", d: 1, secs: 30, prompt: "Cosine similarity of (1, 0, 1) and (1, 1, 0)?", answer: 0.5, tol: 0.005, explain: "Dot 1; norms √2 × √2 = 2.", py: "import numpy as np\na, c = np.array([1., 0., 1.]), np.array([1., 1., 0.])\nanswer = float(a @ c / (np.linalg.norm(a) * np.linalg.norm(c)))", packages: NP });
Q({ id: "py2-npl-4", d: 2, secs: 60, prompt: "Solve `4x + y = 1`, `x + 3y = 2` with `np.linalg.solve`. What is y? (3 decimals)", answer: 0.636, tol: 0.002, explain: "x = 1/11, y = 7/11 ≈ 0.636.", py: "import numpy as np\nanswer = float(np.linalg.solve([[4., 1.], [1., 3.]], [1., 2.])[1])", packages: NP });
Q({ id: "py2-npl-5", d: 2, secs: 45, prompt: "X has shape (500, 20) and W has shape (20, 8). What is the shape of `X @ W + b` with b of shape (8,)? Give the number of elements.", answer: 4000, tol: 0.5, explain: "(500, 8) after broadcasting b over rows.", py: "import numpy as np\nanswer = (np.zeros((500, 20)) @ np.zeros((20, 8)) + np.zeros(8)).size", packages: NP });
C("py2-npl-c1", "* vs @", "* element-wise; @ matrix product (inner dims must match).");
C("py2-npl-c2", "Regression in NumPy", "w, *_ = np.linalg.lstsq(X, y, rcond=None) — not inv(XᵀX).");

// ───────────────────────── Random ─────────────────────────

L("py2-np-random", M, "Random numbers and simulation", "default_rng, seeds, sampling, shuffling, and Monte Carlo estimates for probability questions.", {
  kind: "concept", mins: 20, mathsLabel: "Code",
  hook: "An interviewer asks the probability of at least two people sharing a birthday among 23. Answer analytically, then check it with a 5-line simulation.",
  intuition: `
**The situation.** Probability puzzles, bootstrap confidence intervals, A/B test power checks and train/test splits all rely on random sampling that must be reproducible.

**The idea.** Create a generator with a seed, \`rng = np.random.default_rng(42)\`, and draw from it: \`rng.random\`, \`rng.integers\`, \`rng.normal\`, \`rng.choice\`, \`rng.permutation\`. The same seed gives the same sequence, so results are reproducible. Pass the generator into functions instead of relying on global state.

**Monte Carlo:** simulate many trials at once as arrays, then average a boolean outcome. The error shrinks like 1/√n: 100× more trials for 10× more precision.
`,
  maths: `
**In one breath.** \`rng = np.random.default_rng(seed)\`; \`integers(low, high)\` excludes high; \`choice(a, size, replace, p)\`; simulate as arrays, average indicators; standard error √(p(1−p)/n).

\`\`\`python
import numpy as np
rng = np.random.default_rng(42)
print(rng.integers(1, 7, size=5))         # dice rolls, 7 excluded
print(rng.random(3))                      # uniform [0, 1)
print(rng.normal(loc=0, scale=1, size=2))
print(rng.choice(["H", "T"], size=4, p=[0.5, 0.5]))
idx = rng.permutation(10)                 # shuffled indices for a split
train, test = idx[:8], idx[8:]

n = 200_000                                # birthday problem
b = rng.integers(0, 365, size=(n, 23))
s = np.sort(b, axis=1)
shared = (np.diff(s, axis=1) == 0).any(axis=1)
print(shared.mean())                       # ≈ 0.507
exact = 1 - np.prod((365 - np.arange(23)) / 365)
print(round(exact, 3))                     # 0.507

data = rng.exponential(scale=50, size=500) # bootstrap CI for the mean
boots = rng.choice(data, size=(5000, data.size), replace=True).mean(axis=1)
print(np.percentile(boots, [2.5, 97.5]))   # 95% percentile interval
\`\`\`

**Legacy API.** \`np.random.seed\` + \`np.random.rand\` still work but use global state; scikit-learn's \`random_state\` accepts an int or a Generator.
`,
  practice: `
**Use simulation to check** any probability answer you derive in an interview (coin runs, dice sums, expected waiting times). Vectorise trials as rows of a 2-D array. Report the Monte Carlo standard error so you know how many digits to trust.

**Reproducibility.** Fix seeds for experiments, splits and model training; log them.
`,
  traps: [
    { trap: "`rng.integers(1, 6)` simulates a die.", why: "The upper bound is exclusive: it gives 1–5. Use integers(1, 7)." },
    { trap: "10,000 simulations give 3 reliable decimals.", why: "Standard error ≈ √(p(1−p)/n) ≈ 0.005 for p = 0.5: about 2 decimals. Precision grows with √n." },
  ],
  say: {
    prompt: "How would you use NumPy to estimate a probability by simulation, and how accurate is it?",
    secs: 45,
    check: ["Seeded generator default_rng for reproducibility", "Vectorise many trials as an array, compute an indicator, take the mean", "Correct bounds (integers high exclusive), choice/permutation", "Standard error √(p(1−p)/n); precision ∝ √n", "Cross-check with the analytic answer"],
    followups: [
      { q: "How many trials to estimate p ≈ 0.5 within ±0.01 at 95%?", a: "Half-width 1.96·√(0.25/n) ≤ 0.01 → n ≈ 9,604." },
      { q: "How do you sample without replacement?", a: "`rng.choice(a, size=k, replace=False)` or take the first k of `rng.permutation(a)`." },
      { q: "What is a bootstrap confidence interval?", a: "Resample the data with replacement many times, compute the statistic each time, and take percentiles (e.g. 2.5th and 97.5th) of those values." },
    ],
    answer: `I create a seeded generator with np.random.default_rng so the run is reproducible, simulate many trials at once as rows of an array, say a 200,000 by 23 array of birthdays, compute a boolean outcome per row, and take the mean as the probability estimate. The Monte Carlo standard error is about √(p(1−p)/n), so 200,000 trials give roughly ±0.001, and getting ten times more precision costs a hundred times more trials. I'd use it to sanity-check an analytic answer, like 0.507 for the birthday problem.`,
    avoid: ["Unseeded results in reports", "Python loops over trials"],
  },
  terms: [["Generator", "NumPy's random number source (default_rng)."], ["Monte Carlo", "Estimating quantities by random simulation."], ["Bootstrap", "Resampling with replacement to estimate uncertainty."]],
  sources: [S.rng],
});
Q({ id: "py2-npr-1", d: 1, secs: 30, prompt: "What is the largest value `rng.integers(1, 7, size=1000)` can produce?", answer: 6, tol: 0.5, explain: "The high bound is exclusive.", py: "import numpy as np\nrng = np.random.default_rng(0)\nanswer = int(rng.integers(1, 7, size=100000).max())", packages: NP });
Q({ id: "py2-npr-2", d: 2, secs: 60, prompt: "Exact probability that at least two of 23 people share a birthday (365 equally likely days)? (3 decimals)", answer: 0.507, tol: 0.002, explain: "1 − ∏(365 − k)/365 for k = 0..22 ≈ 0.507.", py: "import numpy as np\nanswer = float(1 - np.prod((365 - np.arange(23)) / 365))", packages: NP });
Q({ id: "py2-npr-3", d: 2, secs: 60, prompt: "Monte Carlo estimate of a probability near 0.5 with n = 10,000 trials. Approximate standard error? (3 decimals)", answer: 0.005, tol: 0.0005, explain: "√(0.25/10000) = 0.005.", py: "answer = (0.25 / 10000) ** 0.5" });
Q({ id: "py2-npr-4", d: 2, secs: 60, prompt: "Simulate 2 fair dice 400,000 times with a seeded generator. Estimated P(sum = 7), rounded to 2 decimals?", answer: 0.17, tol: 0.01, explain: "Exact 6/36 = 0.1667; the simulation lands near 0.17.", py: "import numpy as np\nrng = np.random.default_rng(1)\nd = rng.integers(1, 7, size=(400000, 2))\nanswer = float(round((d.sum(1) == 7).mean(), 2))", packages: NP });
C("py2-npr-c1", "Reproducible randomness", "rng = np.random.default_rng(seed); pass rng around.");
C("py2-npr-c2", "Monte Carlo error", "SE ≈ √(p(1−p)/n); 100× trials → 10× precision.");

// ───────────────────────── Interview lesson ─────────────────────────

L("py2-np-practice", M, "NumPy practice", "From-scratch and vectorisation questions asked in DS/ML screens.", {
  kind: "interview", mins: 30, prereq: ["py2-np-broadcasting", "py2-np-vectorise", "py2-np-linalg"],
  hook: "Say the shapes out loud at every step; that's what interviewers listen for.",
}, [
  iq("Implement k-nearest-neighbour classification for 1,000 test points and 50,000 training points in NumPy.", "Compute squared distances with the expansion ‖a‖² + ‖b‖² − 2a·b (shapes (1000, 1) + (1, 50000) − 2 X_test @ X_train.T) to avoid a huge 3-D array; argpartition to get k nearest per row; majority vote via np.apply_along_axis or bincount per row. Process test points in batches if memory is tight.", ["Distance via dot-product expansion", "Shapes stated", "argpartition top-k", "Vote and batching for memory"]),
  iq("Standardise each column of X, then explain what changes if you standardise each row instead.", "Columns: (X − X.mean(0)) / X.std(0), broadcasting a (d,) vector over (n, d). Rows: use mean/std with axis=1 and keepdims=True so they're (n, 1). Mention zero-std columns (division by zero) and that the stats should come from training data only.", ["Correct axes and broadcasting", "keepdims for rows", "Zero-variance guard", "Fit on train only"]),
  iq("Vectorise: for each customer (row), count how many monthly spends exceeded that customer's own average.", "(S > S.mean(axis=1, keepdims=True)).sum(axis=1): a broadcasted comparison against per-row means, then a row-wise count. O(n·m) with no Python loop.", ["Row means with keepdims", "Boolean mask", "Sum along axis=1"]),
  iq("Implement softmax for a (batch, classes) array in a numerically stable way.", "Subtract the row max before exponentiating: z − z.max(axis=1, keepdims=True), exp, divide by the row sum with keepdims. Subtracting the max prevents overflow and doesn't change the result.", ["Row-wise max subtraction", "keepdims shapes", "Explains overflow", "Rows sum to 1"]),
  iq("Why is my loop over a 10M-element array slow, and how do you check the vectorised version is correct?", "Each iteration is interpreted Python with boxed objects; vectorised ops run one compiled loop. Rewrite with slices/ufuncs/cumsum; verify with np.allclose against the loop on a small random input, including edge cases (NaN, empty).", ["Interpreter overhead explanation", "Vectorised rewrite strategy", "np.allclose test on small input", "Edge cases"]),
]);
