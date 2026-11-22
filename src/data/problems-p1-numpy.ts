import type { PythonProblem } from "@/lib/types";

/**
 * P1 · NumPy (batch 9): 3 coding problems per concept, run in Pyodide with numpy 1.26.
 * Expected values are written as numpy expressions and compared with the harness's array-aware
 * equality; scripts/verify-py.mts runs every reference solution against every test in CI.
 */
type T = [name: string, call: string, expected: string, hidden?: boolean];
interface Spec {
  id: string; cat: string; title: string; difficulty: "Easy" | "Medium" | "Hard"; targetMin: number; tags: string[];
  statement: string; starter: string; solution: string; tests: T[]; constraints?: string[]; hints?: string[];
  why: string; traps: string[]; followUps: string[];
}
const SETUP = "import numpy as np\n";
const P = (s: Spec): PythonProblem => ({
  id: s.id, kind: "python", title: s.title, pillar: "data", competency: "python_stats", category: s.cat, difficulty: s.difficulty,
  source: { kind: "practice" }, tracks: [], tags: ["numpy", ...s.tags], targetMin: s.targetMin, statement: s.statement, constraints: s.constraints,
  starter: s.starter, solution: s.solution, setup: SETUP, packages: ["numpy"],
  tests: s.tests.map(([name, call, expected, hidden], i) => ({ id: `t${i + 1}`, name, call, expected, hidden: !!hidden })),
  hints: s.hints, context: { why: s.why, traps: s.traps, followUps: s.followUps },
});
const NO_LOOPS = "Use array operations, not Python loops over elements.";

export const P1_NUMPY_PROBLEMS: PythonProblem[] = [
  // ───────── Arrays, dtypes, views ─────────
  P({
    id: "np-checkerboard", cat: "np/arrays", title: "Checkerboard", difficulty: "Easy", targetMin: 5, tags: ["arange", "dtype"],
    statement: "Write `checkerboard(n)` that returns an `n × n` integer array with 1 where the row index plus the column index is odd and 0 elsewhere (so the top-left cell is 0).",
    constraints: [NO_LOOPS, "Return an integer array."],
    starter: "import numpy as np\n\ndef checkerboard(n):\n    pass\n",
    solution: "import numpy as np\n\ndef checkerboard(n):\n    i = np.arange(n)\n    return ((i[:, None] + i[None, :]) % 2).astype(int)\n",
    tests: [
      ["Sample", "checkerboard(3)", "np.array([[0, 1, 0], [1, 0, 1], [0, 1, 0]])"],
      ["One cell", "checkerboard(1)", "np.array([[0]])"],
      ["Hidden: count of ones", "int(checkerboard(4).sum())", "8", true],
      ["Hidden: integer dtype", "checkerboard(2).dtype.kind", "'i'", true],
    ],
    hints: ["A column of row indices plus a row of column indices broadcasts to the full grid of i + j."],
    why: "Building a grid from two 1-D index arrays is the basic broadcasting move behind masks, distance tables and one-hot encodings.",
    traps: ["Returning a float array (np.zeros defaults to float64).", "Filling with nested loops."],
    followUps: ["Return a boolean mask instead.", "Generalise to k × k blocks."],
  }),
  P({
    id: "np-to-grid", cat: "np/arrays", title: "Reshape into rows, padding the last", difficulty: "Easy", targetMin: 7, tags: ["reshape", "zeros"],
    statement: "Write `to_grid(values, ncols)` that lays a 1-D sequence out in rows of `ncols`, padding the last row with zeros if needed, and returns the 2-D array (same dtype as `np.asarray(values)`). An empty input gives shape `(0, ncols)`.",
    starter: "import numpy as np\n\ndef to_grid(values, ncols):\n    pass\n",
    solution: "import numpy as np\n\ndef to_grid(values, ncols):\n    a = np.asarray(values)\n    rows = -(-a.size // ncols)\n    out = np.zeros(rows * ncols, dtype=a.dtype)\n    out[:a.size] = a\n    return out.reshape(rows, ncols)\n",
    tests: [
      ["Sample", "to_grid([1, 2, 3, 4, 5], 2)", "np.array([[1, 2], [3, 4], [5, 0]])"],
      ["Exact fit", "to_grid([1, 2, 3, 4], 2)", "np.array([[1, 2], [3, 4]])"],
      ["Hidden: floats keep dtype", "to_grid(np.arange(7.0), 3).dtype.kind", "'f'", true],
      ["Hidden: shape", "to_grid(np.arange(7), 3).shape", "(3, 3)", true],
      ["Hidden: empty", "to_grid([], 3).shape", "(0, 3)", true],
    ],
    hints: ["Rows needed = ceil(n / ncols) = -(-n // ncols).", "Allocate the padded flat array, copy the values in, then reshape."],
    why: "reshape needs the size to divide exactly; padding first is how you batch a stream into fixed-size blocks.",
    traps: ["Calling reshape(-1, ncols) on a length that doesn't divide.", "Using np.resize, which repeats the data instead of padding with zeros."],
    followUps: ["Pad with NaN instead of 0 (needs a float dtype).", "Lay the values out column by column (order='F')."],
  }),
  P({
    id: "np-zero-border", cat: "np/arrays", title: "Zero the border without touching the input", difficulty: "Easy", targetMin: 6, tags: ["views", "copy", "slicing"],
    statement: "Write `zero_border(a)` that returns a **new** 2-D array equal to `a` but with its first and last rows and columns set to 0. The input array must not change.",
    starter: "import numpy as np\n\ndef zero_border(a):\n    pass\n",
    solution: "import numpy as np\n\ndef zero_border(a):\n    b = a.copy()\n    b[0, :] = 0\n    b[-1, :] = 0\n    b[:, 0] = 0\n    b[:, -1] = 0\n    return b\n",
    tests: [
      ["Sample", "zero_border(np.ones((3, 4), dtype=int))", "np.array([[0, 0, 0, 0], [0, 1, 1, 0], [0, 0, 0, 0]])"],
      ["Hidden: input unchanged", "(lambda a: (zero_border(a), int(a.sum()))[1])(np.ones((3, 3), dtype=int))", "9", true],
      ["Hidden: 1 × 1", "zero_border(np.array([[7]]))", "np.array([[0]])", true],
      ["Hidden: keeps values inside", "zero_border(np.arange(16.0).reshape(4, 4))[1:3, 1:3]", "np.array([[5.0, 6.0], [9.0, 10.0]])", true],
    ],
    hints: ["b = a only creates a second name for the same array; slices are views too. Copy first."],
    why: "Accidentally modifying a caller's array through a view or alias is one of the most common NumPy bugs.",
    traps: ["b = a, then writing to b.", "b = a[:] (still a view of the same memory)."],
    followUps: ["Set a border of width k.", "Do it with np.pad on a[1:-1, 1:-1]."],
  }),

  // ───────── Indexing ─────────
  P({
    id: "np-fill-negatives", cat: "np/indexing", title: "Replace negatives with the mean of the rest", difficulty: "Easy", targetMin: 6, tags: ["boolean mask"],
    statement: "Write `fill_negatives(a)` that returns a float copy of the 1-D array `a` in which every negative value is replaced by the mean of the non-negative values (0.0 if there are none). Don't modify `a`.",
    constraints: [NO_LOOPS],
    starter: "import numpy as np\n\ndef fill_negatives(a):\n    pass\n",
    solution: "import numpy as np\n\ndef fill_negatives(a):\n    out = np.array(a, dtype=float)\n    keep = out[out >= 0]\n    out[out < 0] = keep.mean() if keep.size else 0.0\n    return out\n",
    tests: [
      ["Sample", "fill_negatives(np.array([1, -2, 3, -4]))", "np.array([1.0, 2.0, 3.0, 2.0])"],
      ["No negatives", "fill_negatives(np.array([2.5, 0.0]))", "np.array([2.5, 0.0])"],
      ["Hidden: all negative", "fill_negatives(np.array([-1, -5]))", "np.array([0.0, 0.0])", true],
      ["Hidden: input unchanged", "(lambda a: (fill_negatives(a), a.tolist())[1])(np.array([-1.0, 3.0]))", "[-1.0, 3.0]", true],
    ],
    hints: ["One mask selects the values to average, the other selects the positions to overwrite."],
    why: "Mask, compute, assign through a mask: the standard loop-free way to clean data.",
    traps: ["Including the negatives in the mean.", "Writing into the caller's array (np.asarray doesn't copy).", "mean of an empty array is NaN with a warning."],
    followUps: ["Use the median instead.", "Do the same per column of a 2-D array."],
  }),
  P({
    id: "np-top-k", cat: "np/indexing", title: "Indices of the k largest values", difficulty: "Easy", targetMin: 6, tags: ["argsort"],
    statement: "Write `top_k(a, k)` that returns the indices of the `k` largest values of the 1-D array `a`, largest first. When values tie, the smaller index comes first.",
    starter: "import numpy as np\n\ndef top_k(a, k):\n    pass\n",
    solution: "import numpy as np\n\ndef top_k(a, k):\n    a = np.asarray(a)\n    return np.argsort(-a, kind='stable')[:k]\n",
    tests: [
      ["Sample", "top_k(np.array([4, 9, 1, 7]), 2)", "np.array([1, 3])"],
      ["Ties keep index order", "top_k(np.array([5, 1, 5, 3]), 2)", "np.array([0, 2])"],
      ["Hidden: k = 0", "top_k(np.array([3, 1]), 0).size", "0", true],
      ["Hidden: floats and negatives", "top_k(np.array([-1.5, 2.0, -0.5, 2.0, 0.0]), 3)", "np.array([1, 3, 4])", true],
    ],
    hints: ["Sorting −a ascending is sorting a descending; a stable sort keeps tied indices in order."],
    why: "argsort is how you rank in NumPy; the tie rule tests whether you know that the default sort isn't stable.",
    traps: ["np.argsort(a)[::-1] reverses tied indices too.", "Returning the values instead of the indices."],
    followUps: ["Use np.argpartition for O(n) selection when n is huge and k small."],
  }),
  P({
    id: "np-diagonals", cat: "np/indexing", title: "Sum of both diagonals", difficulty: "Easy", targetMin: 5, tags: ["fancy indexing"],
    statement: "Write `both_diagonals(M)` that returns the sum of the main diagonal and the anti-diagonal of the square array `M`, counting the centre cell only once when the size is odd.",
    constraints: [NO_LOOPS],
    starter: "import numpy as np\n\ndef both_diagonals(M):\n    pass\n",
    solution: "import numpy as np\n\ndef both_diagonals(M):\n    n = len(M)\n    i = np.arange(n)\n    s = M[i, i].sum() + M[i, n - 1 - i].sum()\n    if n % 2:\n        s -= M[n // 2, n // 2]\n    return s\n",
    tests: [
      ["Odd size", "both_diagonals(np.arange(9).reshape(3, 3))", "20"],
      ["Even size", "both_diagonals(np.arange(16).reshape(4, 4))", "60"],
      ["Hidden: 1 × 1", "both_diagonals(np.array([[7]]))", "7", true],
    ],
    hints: ["M[i, i] with i = arange(n) is the diagonal; M[i, n − 1 − i] the anti-diagonal."],
    why: "Paired index arrays select individual cells: the key fact about fancy indexing.",
    traps: ["Double-counting the centre.", "M[i][n - 1 - i] with arrays does something else entirely."],
    followUps: ["Compare with np.trace(M) + np.trace(np.fliplr(M))."],
  }),

  // ───────── Broadcasting ─────────
  P({
    id: "np-standardize", cat: "np/broadcast", title: "Standardise columns", difficulty: "Easy", targetMin: 6, tags: ["broadcasting", "axis"],
    statement: "Write `standardize(X)` that returns `(X − column mean) / column std` for a 2-D float array, using the population standard deviation (NumPy's default). Columns with zero standard deviation become all zeros.",
    constraints: [NO_LOOPS],
    starter: "import numpy as np\n\ndef standardize(X):\n    pass\n",
    solution: "import numpy as np\n\ndef standardize(X):\n    X = np.asarray(X, dtype=float)\n    mu, sd = X.mean(axis=0), X.std(axis=0)\n    return (X - mu) / np.where(sd == 0, 1.0, sd)\n",
    tests: [
      ["Sample", "standardize(np.array([[1.0, 10.0], [3.0, 10.0]]))", "np.array([[-1.0, 0.0], [1.0, 0.0]])"],
      ["Hidden: column means are 0", "standardize(np.array([[1.0, 2.0], [2.0, 4.0], [6.0, 9.0]])).mean(axis=0)", "np.array([0.0, 0.0])", true],
      ["Hidden: column stds are 1", "standardize(np.array([[1.0, 2.0], [2.0, 4.0], [6.0, 9.0]])).std(axis=0)", "np.array([1.0, 1.0])", true],
      ["Hidden: no NaN for a constant column", "bool(np.isnan(standardize(np.array([[5.0], [5.0]]))).any())", "False", true],
    ],
    hints: ["X.mean(axis=0) has shape (n_cols,), which broadcasts against (n_rows, n_cols)."],
    why: "Per-feature scaling with broadcasting is preprocessing step one for most models.",
    traps: ["axis=1 (per row) instead of axis=0.", "Dividing by zero for constant columns."],
    followUps: ["Return the mean and std so the test set can reuse them (fit/transform)."],
  }),
  P({
    id: "np-pairwise", cat: "np/broadcast", title: "Pairwise distances", difficulty: "Medium", targetMin: 10, tags: ["broadcasting", "newaxis"],
    statement: "Write `pairwise_dist(A, B)` that returns the matrix of Euclidean distances between every row of `A` (shape `(m, d)`) and every row of `B` (shape `(n, d)`): entry `[i, j]` is the distance from `A[i]` to `B[j]`.",
    constraints: [NO_LOOPS],
    starter: "import numpy as np\n\ndef pairwise_dist(A, B):\n    pass\n",
    solution: "import numpy as np\n\ndef pairwise_dist(A, B):\n    diff = A[:, None, :] - B[None, :, :]\n    return np.sqrt((diff ** 2).sum(axis=-1))\n",
    tests: [
      ["Sample", "pairwise_dist(np.array([[0.0, 0.0], [3.0, 4.0]]), np.array([[0.0, 0.0]]))", "np.array([[0.0], [5.0]])"],
      ["One to many", "pairwise_dist(np.array([[1.0, 1.0]]), np.array([[1.0, 1.0], [4.0, 5.0]]))", "np.array([[0.0, 5.0]])"],
      ["Hidden: shape", "pairwise_dist(np.ones((5, 3)), np.zeros((7, 3))).shape", "(5, 7)", true],
      ["Hidden: values in 3-D", "pairwise_dist(np.ones((2, 3)), np.zeros((1, 3)))", "np.full((2, 1), np.sqrt(3.0))", true],
    ],
    hints: ["A[:, None, :] has shape (m, 1, d) and B[None, :, :] has (1, n, d); their difference is (m, n, d)."],
    why: "The core of k-NN, k-means and kernel methods, and a classic 'vectorise this' interview task.",
    traps: ["Summing over the wrong axis.", "Forgetting the square root."],
    followUps: ["Avoid the (m, n, d) temporary with ‖a‖² + ‖b‖² − 2 A @ Bᵀ (clip at 0 before sqrt)."],
  }),
  P({
    id: "np-softmax", cat: "np/broadcast", title: "Stable row-wise softmax", difficulty: "Easy", targetMin: 6, tags: ["broadcasting", "keepdims", "numerical stability"],
    statement: "Write `softmax_rows(Z)` that applies softmax to each row of the 2-D array `Z`. It must work for large values such as 1000 without overflowing.",
    constraints: [NO_LOOPS],
    starter: "import numpy as np\n\ndef softmax_rows(Z):\n    pass\n",
    solution: "import numpy as np\n\ndef softmax_rows(Z):\n    E = np.exp(Z - Z.max(axis=1, keepdims=True))\n    return E / E.sum(axis=1, keepdims=True)\n",
    tests: [
      ["Sample", "softmax_rows(np.array([[0.0, 0.0]]))", "np.array([[0.5, 0.5]])"],
      ["Large logits", "softmax_rows(np.array([[1000.0, 1001.0]]))", "np.array([[1 / (1 + np.e), np.e / (1 + np.e)]])"],
      ["Hidden: rows sum to 1", "softmax_rows(np.array([[1.0, 2.0, 3.0], [-5.0, 0.0, 5.0]])).sum(axis=1)", "np.array([1.0, 1.0])", true],
      ["Hidden: rows are independent", "softmax_rows(np.array([[0.0, 0.0], [0.0, 1000.0]]))[0]", "np.array([0.5, 0.5])", true],
    ],
    hints: ["Softmax doesn't change if you subtract the same number from a whole row.", "Use keepdims=True so the row maxima broadcast."],
    why: "Every classifier and attention layer uses it; the max trick is the expected detail.",
    traps: ["Subtracting the global max or summing over the whole array, which mixes rows.", "Overflow from np.exp(1000)."],
    followUps: ["Write log_softmax stably (log-sum-exp)."],
  }),

  // ───────── Reductions ─────────
  P({
    id: "np-best-row", cat: "np/reduce", title: "Row with the largest mean", difficulty: "Easy", targetMin: 4, tags: ["axis", "argmax"],
    statement: "Write `best_row(X)` that returns the index of the row of the 2-D array `X` with the largest mean (the first one if several tie).",
    starter: "import numpy as np\n\ndef best_row(X):\n    pass\n",
    solution: "import numpy as np\n\ndef best_row(X):\n    return int(np.argmax(X.mean(axis=1)))\n",
    tests: [
      ["Sample", "best_row(np.array([[1, 2], [5, 0], [3, 3]]))", "2"],
      ["Tie → first", "best_row(np.array([[2, 2], [1, 3]]))", "0"],
      ["Hidden: one row", "best_row(np.array([[4, 9, 1]]))", "0", true],
    ],
    why: "Picking the axis correctly is most of the work with reductions.",
    traps: ["axis=0 gives column means.", "X.argmax() returns a flattened index of the largest single value."],
    followUps: ["Return the top 3 rows.", "Ignore NaNs (np.nanmean)."],
  }),
  P({
    id: "np-moving-average", cat: "np/reduce", title: "Moving average with cumsum", difficulty: "Easy", targetMin: 7, tags: ["cumsum"],
    statement: "Write `moving_average(x, w)` that returns the averages of every window of `w` consecutive values of the 1-D array `x` (only full windows, so `len(x) − w + 1` values), as floats.",
    constraints: [NO_LOOPS, "It should handle 100,000 values quickly."],
    starter: "import numpy as np\n\ndef moving_average(x, w):\n    pass\n",
    solution: "import numpy as np\n\ndef moving_average(x, w):\n    c = np.cumsum(np.insert(np.asarray(x, dtype=float), 0, 0.0))\n    return (c[w:] - c[:-w]) / w\n",
    tests: [
      ["Sample", "moving_average(np.array([1, 2, 3, 4, 5]), 2)", "np.array([1.5, 2.5, 3.5, 4.5])"],
      ["Window 1", "moving_average(np.array([3, 1]), 1)", "np.array([3.0, 1.0])"],
      ["Hidden: whole array", "moving_average(np.array([2, 4, 9]), 3)", "np.array([5.0])", true],
      ["Hidden: large input", "float(moving_average(np.arange(100000), 100)[-1])", "99949.5", true],
    ],
    hints: ["With c = cumsum of [0, x₀, x₁, …], the sum of x[i:i + w] is c[i + w] − c[i]."],
    why: "The prefix-sum trick from DSA, in vectorised form.",
    traps: ["Off-by-one in the slices.", "Integer division (use floats)."],
    followUps: ["Compare with np.convolve(x, np.ones(w) / w, mode='valid').", "Exponential moving average."],
  }),
  P({
    id: "np-group-means", cat: "np/reduce", title: "Mean per group without pandas", difficulty: "Medium", targetMin: 10, tags: ["unique", "bincount"],
    statement: "Write `group_means(values, labels)` that returns a tuple `(groups, means)`: the sorted unique labels and the mean of `values` for each one, both as numpy arrays.",
    constraints: [NO_LOOPS],
    starter: "import numpy as np\n\ndef group_means(values, labels):\n    pass\n",
    solution: "import numpy as np\n\ndef group_means(values, labels):\n    groups, ids = np.unique(labels, return_inverse=True)\n    sums = np.bincount(ids, weights=values)\n    return groups, sums / np.bincount(ids)\n",
    tests: [
      ["Sample", "group_means(np.array([10.0, 20.0, 30.0, 40.0]), np.array([1, 0, 1, 0]))", "(np.array([0, 1]), np.array([30.0, 20.0]))"],
      ["String labels", "group_means(np.array([1.0, 2.0, 3.0]), np.array(['b', 'a', 'b']))", "(np.array(['a', 'b']), np.array([2.0, 2.0]))"],
      ["Hidden: one group", "group_means(np.array([4.0, 6.0]), np.array([7, 7]))", "(np.array([7]), np.array([5.0]))", true],
      ["Hidden: returns a tuple", "type(group_means(np.array([1.0]), np.array([0]))).__name__", "'tuple'", true],
    ],
    hints: ["np.unique(..., return_inverse=True) turns labels into ids 0..k − 1.", "np.bincount(ids, weights=values) sums the values per id."],
    why: "It's groupby().mean() from first principles, and shows you know unique and bincount.",
    traps: ["Looping over the unique labels with masks (O(n·k)).", "Returning a list instead of a tuple."],
    followUps: ["Add the count per group.", "Group by two label arrays at once."],
  }),

  // ───────── Linear algebra and random ─────────
  P({
    id: "np-fit-line", cat: "np/linalg", title: "Least-squares line", difficulty: "Easy", targetMin: 7, tags: ["lstsq"],
    statement: "Write `fit_line(x, y)` that fits `y ≈ slope · x + intercept` by least squares using `np.linalg.lstsq`, and returns the tuple `(slope, intercept)` as floats.",
    starter: "import numpy as np\n\ndef fit_line(x, y):\n    pass\n",
    solution: "import numpy as np\n\ndef fit_line(x, y):\n    X = np.column_stack([x, np.ones(len(x))])\n    slope, intercept = np.linalg.lstsq(X, y, rcond=None)[0]\n    return float(slope), float(intercept)\n",
    tests: [
      ["Exact line", "fit_line(np.array([0.0, 1.0, 2.0]), np.array([1.0, 3.0, 5.0]))", "(2.0, 1.0)"],
      ["Noisy points", "fit_line(np.array([1.0, 2.0, 3.0, 4.0, 5.0]), np.array([2.0, 4.0, 5.0, 4.0, 5.0]))", "(0.6, 2.2)"],
      ["Hidden: flat", "fit_line(np.array([1.0, 2.0, 3.0]), np.array([4.0, 4.0, 4.0]))", "(0.0, 4.0)", true],
    ],
    hints: ["Add a column of ones to x so the intercept is a coefficient too."],
    why: "Design matrices and lstsq are how linear regression is actually computed.",
    traps: ["Forgetting the column of ones (fits a line through the origin).", "Solving the normal equations with inv(XᵀX)."],
    followUps: ["Fit a quadratic by adding an x² column.", "Add ridge regularisation."],
  }),
  P({
    id: "np-cosine-matrix", cat: "np/linalg", title: "Cosine-similarity matrix", difficulty: "Medium", targetMin: 8, tags: ["norm", "matmul"],
    statement: "Write `cosine_matrix(X)` that returns the `n × n` matrix of cosine similarities between the rows of `X`. A row of all zeros has similarity 0 with every row, including itself.",
    constraints: [NO_LOOPS],
    starter: "import numpy as np\n\ndef cosine_matrix(X):\n    pass\n",
    solution: "import numpy as np\n\ndef cosine_matrix(X):\n    n = np.linalg.norm(X, axis=1, keepdims=True)\n    U = X / np.where(n == 0, 1.0, n)\n    return U @ U.T\n",
    tests: [
      ["Orthogonal", "cosine_matrix(np.array([[1.0, 0.0], [0.0, 2.0]]))", "np.eye(2)"],
      ["Same direction", "cosine_matrix(np.array([[1.0, 1.0], [2.0, 2.0], [1.0, -1.0]]))", "np.array([[1.0, 1.0, 0.0], [1.0, 1.0, 0.0], [0.0, 0.0, 1.0]])"],
      ["Hidden: zero row", "cosine_matrix(np.array([[0.0, 0.0], [3.0, 4.0]]))", "np.array([[0.0, 0.0], [0.0, 1.0]])", true],
    ],
    hints: ["Normalise each row to length 1; then all the cosines are one matrix product."],
    why: "This is what a vector store does for exact search, and the same normalise-then-dot idea as in RAG retrieval.",
    traps: ["Dividing by zero for empty rows.", "Normalising columns instead of rows."],
    followUps: ["Return the top-k most similar rows for each row, excluding itself."],
  }),
  P({
    id: "np-bootstrap", cat: "np/linalg", title: "Bootstrap means with a seeded generator", difficulty: "Medium", targetMin: 8, tags: ["random", "default_rng"],
    statement: "Write `bootstrap_means(x, n_boot, seed)` that draws `n_boot` bootstrap resamples of the 1-D array `x` (each the same length as `x`, drawn with replacement) and returns the array of their means. Use `np.random.default_rng(seed)` so the same seed always gives the same result.",
    constraints: [NO_LOOPS, "Don't use np.random.seed or the global random state."],
    starter: "import numpy as np\n\ndef bootstrap_means(x, n_boot, seed):\n    pass\n",
    solution: "import numpy as np\n\ndef bootstrap_means(x, n_boot, seed):\n    x = np.asarray(x, dtype=float)\n    rng = np.random.default_rng(seed)\n    idx = rng.integers(0, len(x), size=(n_boot, len(x)))\n    return x[idx].mean(axis=1)\n",
    tests: [
      ["Shape", "bootstrap_means(np.arange(10.0), 50, 0).shape", "(50,)"],
      ["Reproducible", "bool(np.array_equal(bootstrap_means(np.arange(10.0), 20, 1), bootstrap_means(np.arange(10.0), 20, 1)))", "True"],
      ["Hidden: constant data", "bootstrap_means(np.full(5, 4.0), 10, 0)", "np.full(10, 4.0)", true],
      ["Hidden: within the data's range", "(lambda m: bool((m >= 2).all() and (m <= 9).all()))(bootstrap_means(np.array([2.0, 5.0, 9.0]), 200, 3))", "True", true],
      ["Hidden: centred on the sample mean", "bool(abs(bootstrap_means(np.arange(100.0), 2000, 0).mean() - 49.5) < 1)", "True", true],
      ["Hidden: seed matters", "bool(np.array_equal(bootstrap_means(np.arange(10.0), 20, 0), bootstrap_means(np.arange(10.0), 20, 1)))", "False", true],
    ],
    hints: ["Draw all the indices at once with shape (n_boot, len(x)); fancy indexing then gives every resample."],
    why: "Seeded generators make experiments reproducible, and vectorised resampling makes bootstrap CIs instant.",
    traps: ["Creating the generator inside a loop with the same seed (every resample identical).", "Sampling without replacement."],
    followUps: ["Return a 95% percentile CI from the means.", "Bootstrap the median."],
  }),
];
