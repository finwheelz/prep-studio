import type { PythonProblem } from "@/lib/types";

/**
 * P1 · PyTorch (4 concepts) and Keras (1 concept), batch 11.
 * PyTorch and TensorFlow don't run in the browser's Python (Pyodide), so each problem asks for the same
 * computation in numpy, and the statement names the PyTorch or Keras call it reproduces. The expected
 * values for the numerical problems were produced by PyTorch 2.x (float64) on the reference inputs and
 * pasted in as literals; the early-stopping problem follows Keras 3's EarlyStopping source.
 * scripts/verify-py.mts runs every reference solution against every test in CI.
 */
type T = [name: string, call: string, expected: string, hidden?: boolean];
interface Spec {
  id: string; cat: string; lib: "PyTorch" | "Keras"; title: string; difficulty: "Easy" | "Medium" | "Hard"; targetMin: number; tags: string[];
  statement: string; solution: string; sig: string; tests: T[]; fixtures?: string; constraints?: string[]; hints?: string[];
  why: string; traps: string[]; followUps: string[];
}
const RAISES = "def _raises(f, exc):\n    try:\n        f()\n    except exc:\n        return True\n    return False\n";
const NOTE = "PyTorch doesn't run in the browser, so write it in numpy.";
const P = (s: Spec): PythonProblem => ({
  id: s.id, kind: "python", title: s.title, pillar: "ml", competency: "ml_llm", category: s.cat, difficulty: s.difficulty,
  source: { kind: "practice" }, tracks: [], tags: [s.lib, "numpy", ...s.tags], targetMin: s.targetMin, statement: s.statement,
  constraints: [s.lib === "PyTorch" ? NOTE : "Keras doesn't run in the browser, so write it in numpy.", ...(s.constraints ?? [])],
  starter: `import numpy as np\n\ndef ${s.sig}:\n    pass\n`, solution: s.solution, setup: "import numpy as np\n" + (s.fixtures ?? ""), packages: ["numpy"],
  tests: s.tests.map(([name, call, expected, hidden], i) => ({ id: `t${i + 1}`, name, call, expected, hidden: !!hidden })),
  hints: s.hints, context: { why: s.why, traps: s.traps, followUps: s.followUps },
});

export const P1_TORCH_PROBLEMS: PythonProblem[] = [
  // ───────── Tensors ─────────
  P({
    id: "pt-broadcast", cat: "pt/tensors", lib: "PyTorch", title: "Broadcast two shapes", difficulty: "Easy", targetMin: 8, tags: ["broadcasting", "shapes"],
    statement: "PyTorch and numpy share the same broadcasting rule. Write `broadcast_shape(a, b)` that takes two shapes (tuples of ints) and returns the shape of `x + y` for tensors of those shapes, as a tuple, or raises `ValueError` if they can't broadcast. Don't call `np.broadcast_shapes`; apply the rule: align the shapes on the right; each pair of sizes must be equal or contain a 1; a size of 1 stretches to match the other; missing leading dimensions count as 1.",
    sig: "broadcast_shape(a, b)",
    fixtures: RAISES + "PAIRS = [((3, 1), (1, 4)), ((5, 1, 7), (6, 1)), ((1,), (2, 3)), ((4, 1, 1), (4, 3, 2)), ((2, 1, 3, 1), (5, 1, 6))]\n",
    solution: `import numpy as np

def broadcast_shape(a, b):
    n = max(len(a), len(b))
    a = (1,) * (n - len(a)) + tuple(a)
    b = (1,) * (n - len(b)) + tuple(b)
    out = []
    for x, y in zip(a, b):
        if x != y and 1 not in (x, y):
            raise ValueError(f"cannot broadcast {x} and {y}")
        out.append(y if x == 1 else x)
    return tuple(out)
`,
    tests: [
      ["The documentation's example", "broadcast_shape((8, 1, 6, 1), (7, 1, 5))", "(8, 7, 6, 5)"],
      ["A row vector over a matrix", "broadcast_shape((3,), (4, 3))", "(4, 3)"],
      ["Hidden: incompatible", "_raises(lambda: broadcast_shape((2, 3), (3, 2)), ValueError)", "True", true],
      ["Hidden: a scalar", "broadcast_shape((), (5,))", "(5,)", true],
      ["Hidden: agrees with numpy", "[broadcast_shape(a, b) for a, b in PAIRS] == [np.broadcast_shapes(a, b) for a, b in PAIRS]", "True", true],
      ["Hidden: a zero-sized dimension", "broadcast_shape((0, 1), (1, 3))", "(0, 3)", true],
    ],
    hints: ["Left-pad the shorter shape with 1s, then compare position by position."],
    why: "Most shape bugs in PyTorch are silent broadcasts: a (N,) target minus an (N, 1) prediction gives an (N, N) matrix and a meaningless loss. Being able to work out the result shape in your head prevents that.",
    traps: ["Aligning on the left instead of the right.", "Taking max(x, y): for sizes 0 and 1 the result is 0, because a 1 always stretches to match."],
    followUps: ["Extend it to any number of shapes.", "Why does (N,) − (N, 1) give (N, N), and how do you fix it?"],
  }),
  P({
    id: "pt-gather", cat: "pt/tensors", lib: "PyTorch", title: "Pick each row's target logit", difficulty: "Easy", targetMin: 5, tags: ["indexing", "gather"],
    statement: "`logits` has shape (N, C) and `targets` holds N class indices. Write `pick(logits, targets)` returning a 1-D array of length N with `logits[i, targets[i]]` for every i. In PyTorch this is `logits.gather(1, targets.unsqueeze(1)).squeeze(1)` or `logits[torch.arange(N), targets]`.",
    sig: "pick(logits, targets)",
    constraints: ["No Python loop over rows."],
    solution: `import numpy as np

def pick(logits, targets):
    logits = np.asarray(logits)
    return logits[np.arange(len(logits)), np.asarray(targets)]
`,
    tests: [
      ["Sample", "pick(np.array([[1., 2., 3.], [4., 5., 6.]]), np.array([2, 0]))", "np.array([3., 4.])"],
      ["One row", "pick(np.array([[7., 8.]]), np.array([1]))", "np.array([8.])"],
      ["Hidden: shape (N,), not (N, N)", "pick(np.arange(12.).reshape(4, 3), np.array([0, 1, 2, 0])).shape", "(4,)", true],
      ["Hidden: values", "pick(np.arange(12.).reshape(4, 3), np.array([0, 1, 2, 0]))", "np.array([0., 4., 8., 9.])", true],
    ],
    hints: ["Pair each row number with its target: logits[np.arange(N), targets]."],
    why: "This one line is inside every cross-entropy and policy-gradient loss. Writing logits[:, targets] instead gives an N × N matrix and a loss that still runs.",
    traps: ["logits[:, targets]: selects columns for every row, shape (N, N).", "A Python loop: correct but slow on a GPU."],
    followUps: ["Return the top-2 classes per row (torch.topk).", "Set each row's target logit to −inf (scatter)."],
  }),
  P({
    id: "pt-nchw", cat: "pt/tensors", lib: "PyTorch", title: "From NHWC images to flat NCHW rows", difficulty: "Medium", targetMin: 8, tags: ["permute", "reshape", "layout"],
    statement: "Images loaded with PIL or OpenCV come as (N, H, W, C); PyTorch's Conv2d expects (N, C, H, W). Write `to_nchw_flat(x)` that returns an array of shape (N, C·H·W) where each row is one image laid out channel by channel, i.e. the same as `x.permute(0, 3, 1, 2).reshape(N, -1)` in PyTorch.",
    sig: "to_nchw_flat(x)",
    fixtures: "IMG = np.arange(2 * 2 * 2 * 3).reshape(2, 2, 2, 3)\n",
    solution: `import numpy as np

def to_nchw_flat(x):
    x = np.asarray(x)
    return x.transpose(0, 3, 1, 2).reshape(len(x), -1)
`,
    tests: [
      ["Shape", "to_nchw_flat(IMG).shape", "(2, 12)"],
      ["First image, red channel first", "to_nchw_flat(IMG)[0, :4].tolist()", "[0, 3, 6, 9]"],
      ["Hidden: whole first row", "to_nchw_flat(IMG)[0].tolist()", "[0, 3, 6, 9, 1, 4, 7, 10, 2, 5, 8, 11]", true],
      ["Hidden: second image", "to_nchw_flat(IMG)[1].tolist()", "[12, 15, 18, 21, 13, 16, 19, 22, 14, 17, 20, 23]", true],
    ],
    hints: ["Reorder the axes first (transpose / permute), then reshape.", "x.reshape(N, C, H, W) has the right shape but the wrong contents."],
    why: "reshape only reinterprets memory order; it never moves channels. Reshaping NHWC data straight to NCHW gives tensors of the right shape filled with scrambled pixels, and the model trains on noise without any error.",
    traps: ["Calling reshape(N, C, H, W) instead of permuting.", "In PyTorch, calling .view after .permute: the tensor is no longer contiguous, so use .reshape or .contiguous().view."],
    followUps: ["Write the inverse: flat NCHW rows back to NHWC images.", "Why does x.permute(...).view(...) raise an error while reshape works?"],
  }),

  // ───────── Autograd ─────────
  P({
    id: "pt-mse-grads", cat: "pt/autograd", lib: "PyTorch", title: "Gradients of a linear model's MSE", difficulty: "Easy", targetMin: 10, tags: ["gradients", "backward", "MSE"],
    statement: "For a linear model ŷ = Xw + b with loss L = mean((ŷ − y)²), write `mse_grads(X, y, w, b)` returning `(dL_dw, dL_db)`: an array the shape of w and a float. These are the values PyTorch leaves in `w.grad` and `b.grad` after `loss.backward()`.",
    sig: "mse_grads(X, y, w, b)",
    solution: `import numpy as np

def mse_grads(X, y, w, b):
    X, y, w = np.asarray(X, float), np.asarray(y, float), np.asarray(w, float)
    r = X @ w + b - y
    n = len(y)
    return 2 * X.T @ r / n, float(2 * r.sum() / n)
`,
    tests: [
      ["Sample (from PyTorch)", "mse_grads(np.array([[1., 2.], [3., 4.], [5., 6.]]), np.array([1., 2., 3.]), np.array([0.1, -0.2]), 0.5)", "(np.array([-15.2, -19.2]), -4.0)"],
      ["A perfect fit has zero gradient", "mse_grads(np.array([[1.], [2.]]), np.array([3., 5.]), np.array([2.]), 1.0)", "(np.array([0.]), 0.0)"],
      ["Hidden: matches a numerical derivative", "(lambda X, y, w: bool(np.isclose(mse_grads(X, y, w, 0.3)[0][1], (np.mean((X @ (w + [0, 1e-6, 0]) + 0.3 - y) ** 2) - np.mean((X @ (w - [0, 1e-6, 0]) + 0.3 - y) ** 2)) / 2e-6, rtol=1e-5)))(np.random.default_rng(0).normal(size=(6, 3)), np.arange(6.), np.array([0.5, -1., 2.]))", "True", true],
      ["Hidden: b's gradient is a float", "type(mse_grads(np.ones((2, 1)), np.zeros(2), np.zeros(1), 0.0)[1]).__name__", '"float"', true],
    ],
    hints: ["Let r = Xw + b − y. Then dL/dw = (2/N) Xᵀr and dL/db = (2/N) Σ r."],
    why: "loss.backward() is just the chain rule. Deriving one gradient by hand is the standard interview check that you know what autograd computes, and the 2/N factor from the mean is where people slip.",
    traps: ["Forgetting the 2 from the square or the 1/N from the mean.", "Writing X @ r instead of X.T @ r (wrong shape, or a silent error for square X)."],
    followUps: ["Do the same for L = mean(|ŷ − y|).", "Add an L2 penalty λ‖w‖² and give the new gradient."],
  }),
  P({
    id: "pt-numgrad", cat: "pt/autograd", lib: "PyTorch", title: "A numerical gradient checker", difficulty: "Easy", targetMin: 10, tags: ["gradient check", "finite differences"],
    statement: "Write `numerical_grad(f, x, eps=1e-5)` that estimates the gradient of a scalar function f at the array x with central differences, (f(x + eps·eᵢ) − f(x − eps·eᵢ)) / (2·eps) for each element i. Return an array the same shape as x, and leave x unchanged. (`torch.autograd.gradcheck` uses the same idea.)",
    sig: "numerical_grad(f, x, eps=1e-5)",
    solution: `import numpy as np

def numerical_grad(f, x, eps=1e-5):
    x = np.asarray(x, dtype=float)
    g = np.zeros_like(x)
    for i in np.ndindex(x.shape):
        old = x[i]
        x[i] = old + eps; up = f(x)
        x[i] = old - eps; down = f(x)
        x[i] = old
        g[i] = (up - down) / (2 * eps)
    return g
`,
    tests: [
      ["Sum of squares → 2x", "np.round(numerical_grad(lambda v: float(np.sum(v ** 2)), np.array([1., -2., 3.])), 6)", "np.array([2., -4., 6.])"],
      ["sin → cos", "bool(np.allclose(numerical_grad(lambda v: float(np.sin(v).sum()), np.array([0., 1.])), np.cos([0., 1.]), atol=1e-8))", "True"],
      ["Hidden: x is unchanged", "(lambda x: (numerical_grad(lambda v: float(v.sum()), x), x.tolist())[1])(np.array([1., 2.]))", "[1.0, 2.0]", true],
      ["Hidden: keeps a 2-D shape", "numerical_grad(lambda v: float((v ** 2).sum()), np.ones((2, 3))).shape", "(2, 3)", true],
      ["Hidden: a product", "np.round(numerical_grad(lambda v: float(v[0] * v[1]), np.array([3., 5.])), 6)", "np.array([5., 3.])", true],
    ],
    hints: ["np.ndindex(x.shape) visits every element of an array of any shape.", "Restore the element after each pair of evaluations."],
    why: "When you write a custom layer or loss, comparing its analytic gradient with a numerical one is how you find the bug. Central differences are accurate to O(eps²), one-sided ones only to O(eps).",
    traps: ["One-sided differences, which are much less accurate.", "Modifying the caller's array (forgetting to copy or to restore).", "An eps so small (1e-12) that floating-point error swamps the difference."],
    followUps: ["Report the relative error between this and an analytic gradient.", "Why does gradcheck want float64 inputs?"],
  }),
  P({
    id: "pt-ce-grad", cat: "pt/autograd", lib: "PyTorch", title: "The gradient of cross-entropy", difficulty: "Medium", targetMin: 12, tags: ["softmax", "cross-entropy", "gradients"],
    statement: "For `F.cross_entropy(logits, targets)` (mean over N rows), the gradient with respect to the logits is (softmax(logits) − onehot(targets)) / N. Write `ce_grad(logits, targets)` returning that (N, C) array. It must stay finite for logits in the thousands.",
    sig: "ce_grad(logits, targets)",
    solution: `import numpy as np

def ce_grad(logits, targets):
    z = np.asarray(logits, dtype=float)
    z = z - z.max(axis=1, keepdims=True)
    p = np.exp(z)
    p /= p.sum(axis=1, keepdims=True)
    p[np.arange(len(z)), np.asarray(targets)] -= 1
    return p / len(z)
`,
    tests: [
      ["Sample (from PyTorch)", "ce_grad(np.array([[2., 1., 0.], [0., 0., 3.]]), np.array([0, 2]))", "np.array([[-0.167379522113, 0.122364235527, 0.045015286585], [0.022639250372, 0.022639250372, -0.045278500744]])"],
      ["Each row sums to 0", "np.round(ce_grad(np.array([[0.3, -1., 2.]]), np.array([1])).sum(axis=1), 12)", "np.array([0.])"],
      ["Hidden: large logits stay finite", "ce_grad(np.array([[1000., 0.], [0., 1000.]]), np.array([1, 1]))", "np.array([[0.5, -0.5], [0., 0.]])", true],
      ["Hidden: divided by N", "bool(np.allclose(ce_grad(np.zeros((4, 2)), np.zeros(4, dtype=int)), np.tile([-0.125, 0.125], (4, 1))))", "True", true],
    ],
    hints: ["Subtract each row's max before exp: softmax doesn't change, overflow disappears.", "Subtract 1 at each row's target position, then divide by N."],
    why: "The softmax-plus-cross-entropy gradient is the cleanest result in deep learning (prediction minus truth), and it's why frameworks fuse the two: CrossEntropyLoss takes raw logits.",
    traps: ["Computing exp of raw logits: exp(1000) overflows to inf and the gradient becomes NaN.", "Forgetting the 1/N from the mean reduction."],
    followUps: ["Add label smoothing: the target becomes (1 − ε) on the class and ε / C everywhere.", "Why shouldn't you apply softmax before nn.CrossEntropyLoss?"],
  }),

  // ───────── nn.Module and data ─────────
  P({
    id: "pt-param-count", cat: "pt/modules", lib: "PyTorch", title: "Count a model's parameters", difficulty: "Medium", targetMin: 12, tags: ["nn.Linear", "nn.Conv2d", "parameters"],
    statement: "Write `count_params(layers)` returning the number of trainable parameters, `sum(p.numel() for p in model.parameters())`, for a model described as a list of tuples (all with PyTorch's default bias=True):\n\n- `(\"linear\", in_features, out_features)`\n- `(\"conv2d\", in_channels, out_channels, kernel_size)`, square kernel\n- `(\"batchnorm\", num_features)`\n- `(\"embedding\", num_embeddings, dim)`\n- `(\"lstm\", input_size, hidden_size)`, one layer\n- `(\"relu\",)`, `(\"dropout\", p)`, `(\"flatten\",)`",
    sig: "count_params(layers)",
    solution: `import numpy as np

def count_params(layers):
    total = 0
    for kind, *a in layers:
        if kind == "linear":
            total += a[0] * a[1] + a[1]
        elif kind == "conv2d":
            total += a[0] * a[1] * a[2] ** 2 + a[1]
        elif kind == "batchnorm":
            total += 2 * a[0]
        elif kind == "embedding":
            total += a[0] * a[1]
        elif kind == "lstm":
            total += 4 * (a[1] * a[0] + a[1] * a[1] + 2 * a[1])
    return total
`,
    tests: [
      ["An MLP for MNIST", '[count_params([("linear", 784, 128), ("relu",), ("linear", 128, 10)])]', "[101770]"],
      ["A small CNN", 'count_params([("conv2d", 3, 16, 3), ("batchnorm", 16), ("relu",), ("conv2d", 16, 32, 3), ("flatten",), ("linear", 800, 10)])', "13130"],
      ["Hidden: an LSTM has two bias vectors in PyTorch", 'count_params([("lstm", 10, 20)])', "2560", true],
      ["Hidden: BatchNorm's running statistics aren't parameters", 'count_params([("batchnorm", 50)])', "100", true],
      ["Hidden: an embedding table", 'count_params([("embedding", 1000, 64), ("dropout", 0.1)])', "64000", true],
    ],
    hints: ["Linear: in · out + out. Conv2d: in · out · k² + out (the count doesn't depend on the image size).", "LSTM: 4 gates, each with input weights, hidden weights and PyTorch's two biases (b_ih and b_hh)."],
    why: "Counting parameters checks that you understand what each layer stores, and it's how you estimate memory: 101,770 float32 parameters take about 400 KB, and Adam keeps two more copies.",
    traps: ["Forgetting the bias.", "Making the conv count depend on the input height and width.", "Counting BatchNorm's running mean and variance; they're buffers, not parameters.", "Using Keras's single LSTM bias (2,480 instead of 2,560 for input 10, hidden 20) in a PyTorch question."],
    followUps: ["Add a ('conv2d', in, out, k, groups) option for depthwise convolutions.", "How many bytes do the parameters plus Adam's state take in float32?"],
  }),
  P({
    id: "pt-linear", cat: "pt/modules", lib: "PyTorch", title: "nn.Linear's forward pass", difficulty: "Easy", targetMin: 6, tags: ["nn.Linear", "weight layout"],
    statement: "`nn.Linear(in_features, out_features)` stores `weight` with shape **(out_features, in_features)** and `bias` with shape (out_features,), and computes y = x Wᵀ + b over the last dimension of x, which can have any number of leading dimensions. Write `linear(x, W, b=None)` that does the same (no bias when b is None).",
    sig: "linear(x, W, b=None)",
    solution: `import numpy as np

def linear(x, W, b=None):
    y = np.asarray(x, dtype=float) @ np.asarray(W, dtype=float).T
    return y if b is None else y + b
`,
    tests: [
      ["Sample", "linear(np.array([[1., 2., 3.]]), np.array([[1., 0., 0.], [0., 1., 1.]]), np.array([0.5, -1.]))", "np.array([[1.5, 4.]])"],
      ["No bias", "linear(np.array([[1., 1.]]), np.array([[2., 3.]]))", "np.array([[5.]])"],
      ["Hidden: (batch, seq, features) input", "linear(np.ones((2, 5, 3)), np.ones((4, 3))).shape", "(2, 5, 4)", true],
      ["Hidden: values for a 3-D input", "linear(np.arange(6.).reshape(1, 2, 3), np.array([[1., -1., 0.]]), np.array([10.]))", "np.array([[[9.], [9.]]])", true],
    ],
    hints: ["x @ W.T works for any number of leading dimensions."],
    why: "PyTorch's (out, in) weight layout is the opposite of the x @ W convention in many textbooks and in Keras's Dense kernel (in, out). Porting weights between frameworks or reading a checkpoint requires knowing which is which.",
    traps: ["x @ W, which fails, or silently works when the matrix is square.", "Adding the bias to the wrong axis."],
    followUps: ["Convert a Keras Dense kernel to an nn.Linear weight.", "What does nn.Bilinear compute?"],
  }),
  P({
    id: "pt-batch-sizes", cat: "pt/modules", lib: "PyTorch", title: "What a DataLoader yields", difficulty: "Easy", targetMin: 5, tags: ["DataLoader", "batch_size", "drop_last"],
    statement: "Write `batch_sizes(n, batch_size, drop_last)` returning the list of batch sizes a `DataLoader` yields in one epoch over a dataset of n items. With drop_last=True a final, smaller batch is dropped. `len(loader)` is the length of this list.",
    sig: "batch_sizes(n, batch_size, drop_last)",
    solution: `import numpy as np

def batch_sizes(n, batch_size, drop_last):
    full, rest = divmod(n, batch_size)
    return [batch_size] * full + ([rest] if rest and not drop_last else [])
`,
    tests: [
      ["Keep the last batch", "batch_sizes(10, 4, False)", "[4, 4, 2]"],
      ["Drop it", "batch_sizes(10, 4, True)", "[4, 4]"],
      ["Hidden: divides exactly", "batch_sizes(8, 4, False)", "[4, 4]", true],
      ["Hidden: fewer items than one batch, dropped", "batch_sizes(3, 4, True)", "[]", true],
      ["Hidden: empty dataset", "batch_sizes(0, 4, False)", "[]", true],
      ["Hidden: 1,000 items in batches of 64", "len(batch_sizes(1000, 64, False))", "16", true],
    ],
    hints: ["divmod(n, batch_size) gives the number of full batches and the remainder."],
    why: "Steps per epoch drive learning-rate schedules and logging. drop_last matters with BatchNorm (a batch of 1 has no variance and raises an error in training mode) and when every step must have the same shape.",
    traps: ["Appending a 0-sized batch when n divides exactly.", "Using n // batch_size for len(loader) without drop_last (one too few)."],
    followUps: ["Shuffle the indices with a seed and return the index batches.", "With 4 GPUs and DistributedSampler, how many steps does each GPU take?"],
  }),

  // ───────── The training loop ─────────
  P({
    id: "pt-cross-entropy", cat: "pt/training", lib: "PyTorch", title: "F.cross_entropy from scratch", difficulty: "Medium", targetMin: 12, tags: ["cross-entropy", "log-sum-exp", "ignore_index"],
    statement: "Write `cross_entropy(logits, targets, ignore_index=-100)` that matches `torch.nn.functional.cross_entropy` with its defaults: logits (N, C) are **raw scores**, targets are class indices, the loss per row is −log softmax(logits)[target], and the result is the mean over rows whose target is not `ignore_index`. It must stay finite for logits in the thousands. Return a float.",
    sig: "cross_entropy(logits, targets, ignore_index=-100)",
    solution: `import numpy as np

def cross_entropy(logits, targets, ignore_index=-100):
    z = np.asarray(logits, dtype=float)
    t = np.asarray(targets)
    keep = t != ignore_index
    z, t = z[keep], t[keep]
    m = z.max(axis=1, keepdims=True)
    lse = (m + np.log(np.exp(z - m).sum(axis=1, keepdims=True))).ravel()
    return float(np.mean(lse - z[np.arange(len(z)), t]))
`,
    tests: [
      ["Sample (from PyTorch)", "cross_entropy(np.array([[2., 1., 0.], [0.5, 2.5, 0.]]), np.array([0, 1]))", "0.30217003068199877"],
      ["Uniform logits give log C", "cross_entropy(np.zeros((1, 4)), np.array([3]))", "1.3862943611198906"],
      ["Hidden: ignore_index rows don't count", "cross_entropy(np.array([[2., 1., 0.], [0.5, 2.5, 0.]]), np.array([0, -100]))", "0.4076059644443804", true],
      ["Hidden: large logits", "cross_entropy(np.array([[1000., 0.], [0., 1000.]]), np.array([1, 1]))", "500.0", true],
      ["Hidden: a float", "type(cross_entropy(np.zeros((2, 3)), np.array([0, 1]))).__name__", '"float"', true],
    ],
    hints: ["log softmax(z)ₖ = zₖ − logsumexp(z); compute logsumexp as m + log Σ exp(z − m) with m = max(z).", "Drop the ignored rows before averaging."],
    why: "This is the loss for nearly every classifier and language model. Interviewers ask for it to check that you know it takes logits (not probabilities), how log-sum-exp avoids overflow, and how padding tokens are excluded with ignore_index.",
    traps: ["Applying softmax first and then taking −log of a probability that underflowed to 0 (inf loss).", "Averaging over all rows including the ignored ones.", "Passing probabilities into the real nn.CrossEntropyLoss, which applies log-softmax again."],
    followUps: ["Add reduction='sum' and 'none'.", "Add per-class weights (the weight argument); note that the mean then divides by the sum of weights."],
  }),
  P({
    id: "pt-train-linear", cat: "pt/training", lib: "PyTorch", title: "Write the training loop", difficulty: "Medium", targetMin: 12, tags: ["training loop", "SGD", "zero_grad"],
    statement: "Reproduce this PyTorch loop in numpy, for a linear model with w (shape (d,)) and b starting at 0:\n\n```\nfor epoch in range(epochs):\n    opt.zero_grad()\n    loss = ((X @ w + b - y) ** 2).mean()\n    losses.append(loss.item())\n    loss.backward()\n    opt.step()            # SGD: w -= lr * w.grad; b -= lr * b.grad\n```\n\nWrite `train_linear(X, y, lr, epochs)` returning `(w, b, losses)`, with w an array, b a float and losses a list of floats (each recorded before that epoch's update).",
    sig: "train_linear(X, y, lr, epochs)",
    solution: `import numpy as np

def train_linear(X, y, lr, epochs):
    X, y = np.asarray(X, float), np.asarray(y, float)
    w, b, losses = np.zeros(X.shape[1]), 0.0, []
    for _ in range(epochs):
        r = X @ w + b - y
        losses.append(float(np.mean(r ** 2)))
        gw, gb = 2 * X.T @ r / len(y), 2 * r.sum() / len(y)
        w, b = w - lr * gw, b - lr * gb
    return w, float(b), losses
`,
    fixtures: "XL1 = np.array([[1.], [2.], [3.], [4.]])\nYL1 = np.array([3., 5., 7., 9.])\n",
    tests: [
      ["Three epochs (from PyTorch)", "train_linear(XL1, YL1, 0.05, 3)", "(np.array([2.0837499999999998]), 0.722875, [41.0, 1.1287500000000006, 0.0432718749999998])"],
      ["The first loss is mean(y²) because w = b = 0", "train_linear(XL1, YL1, 0.05, 1)[2]", "[41.0]"],
      ["Hidden: converges to least squares", "(lambda r: bool(np.allclose(np.r_[r[0], r[1]], np.linalg.lstsq(np.c_[XL1, np.ones(4)], YL1, rcond=None)[0], atol=1e-3)))(train_linear(XL1, YL1, 0.05, 3000))", "True", true],
      ["Hidden: two features", "(lambda r: bool(np.allclose(r[0], [1., -2.], atol=1e-3) and abs(r[1] - 0.5) < 1e-3))(train_linear(np.array([[1., 0.], [0., 1.], [1., 1.], [2., 1.], [0., 3.]]), np.array([1.5, -1.5, -0.5, 0.5, -5.5]), 0.1, 3000))", "True", true],
      ["Hidden: types", "(lambda r: (type(r[1]).__name__, type(r[2]).__name__, len(r[2])))(train_linear(XL1, YL1, 0.01, 5))", '("float", "list", 5)', true],
    ],
    hints: ["Each epoch: residual r = Xw + b − y, record mean(r²), gradients (2/N)Xᵀr and (2/N)Σr, then step.", "zero_grad matters in PyTorch because .grad accumulates; in numpy you simply recompute the gradient each epoch."],
    why: "Every PyTorch training script is this loop with a bigger model. Knowing what zero_grad, backward and step each do (clear, compute, apply) is the core of 'write a training loop from memory'.",
    traps: ["Recording the loss after the update (the first value is no longer mean(y²)).", "Forgetting zero_grad in PyTorch: gradients from every earlier step add up and training diverges.", "Updating w before computing b's gradient from the same residual."],
    followUps: ["Add momentum (SGD with momentum=0.9).", "Switch to mini-batches of 2 rows, shuffled each epoch."],
  }),
  P({
    id: "pt-batchnorm", cat: "pt/training", lib: "PyTorch", title: "BatchNorm1d in train and eval mode", difficulty: "Hard", targetMin: 20, tags: ["BatchNorm", "train/eval", "running statistics"],
    statement: "Write `batchnorm1d(x, gamma, beta, running_mean, running_var, training, momentum=0.1, eps=1e-5)` returning `(out, new_running_mean, new_running_var)` like `nn.BatchNorm1d` on an (N, F) input:\n\n- **training=True:** normalise each feature with the batch mean and the **biased** batch variance, out = gamma · (x − mean) / √(var + eps) + beta, and update the running statistics as new = (1 − momentum) · old + momentum · batch statistic, using the **unbiased** variance for running_var.\n- **training=False:** normalise with running_mean and running_var, and return them unchanged.",
    sig: "batchnorm1d(x, gamma, beta, running_mean, running_var, training, momentum=0.1, eps=1e-5)",
    fixtures: "XBN = np.array([[1., 2.], [3., 6.], [5., 10.], [7., 4.]])\nGAM = np.array([1., 2.]); BET = np.array([0., 1.])\n",
    solution: `import numpy as np

def batchnorm1d(x, gamma, beta, running_mean, running_var, training, momentum=0.1, eps=1e-5):
    x = np.asarray(x, dtype=float)
    rm, rv = np.asarray(running_mean, float), np.asarray(running_var, float)
    if training:
        mean, var = x.mean(axis=0), x.var(axis=0)
        n = len(x)
        rm = (1 - momentum) * rm + momentum * mean
        rv = (1 - momentum) * rv + momentum * var * n / (n - 1)
    else:
        mean, var = rm, rv
    out = gamma * (x - mean) / np.sqrt(var + eps) + beta
    return out, rm, rv
`,
    tests: [
      ["Training output (from PyTorch)", "batchnorm1d(XBN, GAM, BET, np.zeros(2), np.ones(2), True)[0]", "np.array([[-1.341639444861, -1.366430560994], [-0.447213148287, 1.338061508713], [0.447213148287, 4.042553578421], [1.341639444861, -0.01418452614]])"],
      ["Running mean after one batch", "batchnorm1d(XBN, GAM, BET, np.zeros(2), np.ones(2), True)[1]", "np.array([0.4, 0.55])"],
      ["Hidden: running variance uses the unbiased estimate", "batchnorm1d(XBN, GAM, BET, np.zeros(2), np.ones(2), True)[2]", "np.array([1.566666666667, 2.066666666667])", true],
      ["Hidden: eval mode uses the running statistics", "batchnorm1d(np.array([[4., 5.]]), GAM, BET, np.array([0.4, 0.55]), np.array([1.5666666666666667, 2.0666666666666664]), False)[0]", "np.array([[2.876158483759, 7.190899280434]])", true],
      ["Hidden: eval mode leaves them unchanged", "batchnorm1d(np.array([[4., 5.]]), GAM, BET, np.array([0.4, 0.55]), np.array([1.5, 2.]), False)[2]", "np.array([1.5, 2.])", true],
    ],
    hints: ["x.var(axis=0) is the biased variance (divides by N); multiply by N / (N − 1) for the unbiased one.", "In eval mode, mean and var are simply the running statistics."],
    why: "Forgetting model.eval() is one of the most common PyTorch bugs: at inference BatchNorm keeps using the statistics of whatever batch it's given, and Dropout keeps dropping. This problem makes the two modes concrete, including PyTorch's biased/unbiased detail.",
    traps: ["Using the unbiased variance to normalise in training (PyTorch uses the biased one there).", "Using the biased variance for the running estimate.", "Updating the running statistics in eval mode.", "Confusing PyTorch's momentum (weight of the new value, 0.1) with Keras's (weight of the old value, 0.99)."],
    followUps: ["Why does a batch of size 1 raise an error in training mode?", "Write the backward pass for gamma and beta."],
  }),

  // ───────── Keras ─────────
  P({
    id: "tf-dense-params", cat: "tf/keras", lib: "Keras", title: "model.summary()'s parameter column", difficulty: "Easy", targetMin: 5, tags: ["Dense", "Sequential", "parameters"],
    statement: "A Keras `Sequential` model takes inputs of size `input_dim` and stacks `Dense(u)` layers with the sizes in `units`. Write `dense_params(input_dim, units)` returning the list of per-layer parameter counts that `model.summary()` shows (each Dense layer has a kernel of shape (inputs, u) and a bias of size u).",
    sig: "dense_params(input_dim, units)",
    solution: `import numpy as np

def dense_params(input_dim, units):
    out, prev = [], input_dim
    for u in units:
        out.append((prev + 1) * u)
        prev = u
    return out
`,
    tests: [
      ["MNIST MLP", "dense_params(784, [128, 64, 10])", "[100480, 8256, 650]"],
      ["One output", "dense_params(10, [1])", "[11]"],
      ["Hidden: no layers", "dense_params(5, [])", "[]", true],
      ["Hidden: total", "sum(dense_params(20, [32, 32, 3]))", "1827", true],
    ],
    hints: ["(inputs + 1) × units: one weight per input per unit, plus one bias per unit."],
    why: "Reading model.summary() quickly tells you where the parameters are: almost always in the first Dense layer after a Flatten. That's the usual reason a model overfits or doesn't fit in memory.",
    traps: ["Using input_dim for every layer instead of the previous layer's units.", "Forgetting the bias."],
    followUps: ["Add a Flatten from a (7, 7, 64) feature map before the first Dense.", "How many parameters does a Dropout layer add?"],
  }),
  P({
    id: "tf-early-stopping", cat: "tf/keras", lib: "Keras", title: "When does EarlyStopping stop?", difficulty: "Medium", targetMin: 12, tags: ["EarlyStopping", "callbacks", "patience"],
    statement: "Simulate `keras.callbacks.EarlyStopping(monitor=\"val_loss\", patience=patience, min_delta=min_delta)`. Write `early_stopping(val_losses, patience, min_delta=0.0)` that returns `(epochs_run, best_epoch)`, both counted from 1, where `val_losses[i]` is the validation loss after epoch i + 1. Keras's rule after each epoch:\n\n- an epoch is an **improvement** if loss + min_delta < best so far (the first epoch always is); an improvement resets the wait counter to 0 and becomes the best epoch;\n- otherwise the wait counter goes up by 1, and training stops after this epoch once wait ≥ patience;\n- if it never stops, all epochs run.\n\nAssume patience ≥ 1.",
    sig: "early_stopping(val_losses, patience, min_delta=0.0)",
    solution: `import numpy as np

def early_stopping(val_losses, patience, min_delta=0.0):
    best, best_epoch, wait = None, 0, 0
    for epoch, loss in enumerate(val_losses):
        if best is None or loss + min_delta < best:
            best, best_epoch, wait = loss, epoch, 0
            continue
        wait += 1
        if wait >= patience:
            return epoch + 1, best_epoch + 1
    return len(val_losses), best_epoch + 1
`,
    tests: [
      ["Patience 2", "early_stopping([1.0, 0.8, 0.7, 0.72, 0.71, 0.75, 0.6], 2)", "(5, 3)"],
      ["Never stops", "early_stopping([1.0, 0.9, 0.8, 0.7], 2)", "(4, 4)"],
      ["Hidden: min_delta makes small gains not count", "early_stopping([1.0, 0.9, 0.88, 0.87, 0.86, 0.5], 3, 0.05)", "(5, 2)", true],
      ["Hidden: an equal loss isn't an improvement", "early_stopping([0.5, 0.5, 0.5, 0.4], 2)", "(3, 1)", true],
      ["Hidden: patience 1", "early_stopping([0.5, 0.6, 0.4], 1)", "(2, 1)", true],
      ["Hidden: the wait resets after an improvement", "early_stopping([1.0, 1.1, 0.9, 1.0, 0.8, 0.85, 0.86], 2)", "(7, 5)", true],
    ],
    hints: ["Keep best, best_epoch and wait; reset wait on improvement, otherwise increment it and compare with patience."],
    why: "EarlyStopping is the standard regulariser for neural networks, and its exact behaviour decides how many epochs you pay for. With restore_best_weights=True, Keras 3 puts back the best epoch's weights at the end of training; without it you keep the last epoch's.",
    traps: ["Counting the improving epoch towards patience.", "Treating an equal loss as an improvement.", "Applying min_delta in the wrong direction (loss − min_delta < best makes tiny gains count)."],
    followUps: ["Add restore_best_weights: which epoch's weights does the model end with?", "Add start_from_epoch: ignore the first k epochs."],
  }),
  P({
    id: "tf-bce", cat: "tf/keras", lib: "Keras", title: "Binary cross-entropy, with and without logits", difficulty: "Medium", targetMin: 10, tags: ["binary_crossentropy", "from_logits", "numerical stability"],
    statement: "Write `binary_crossentropy(y_true, y_pred, from_logits=False)` returning the mean loss as a float, like `keras.losses.BinaryCrossentropy`:\n\n- `from_logits=False`: y_pred are probabilities; clip them to [1e-7, 1 − 1e-7], then loss = −[y·log p + (1 − y)·log(1 − p)].\n- `from_logits=True`: y_pred are raw scores z; use the stable form max(z, 0) − z·y + log(1 + exp(−|z|)), which never overflows.",
    sig: "binary_crossentropy(y_true, y_pred, from_logits=False)",
    solution: `import numpy as np

def binary_crossentropy(y_true, y_pred, from_logits=False):
    y, z = np.asarray(y_true, float), np.asarray(y_pred, float)
    if from_logits:
        loss = np.maximum(z, 0) - z * y + np.log1p(np.exp(-np.abs(z)))
    else:
        p = np.clip(z, 1e-7, 1 - 1e-7)
        loss = -(y * np.log(p) + (1 - y) * np.log(1 - p))
    return float(loss.mean())
`,
    tests: [
      ["Probabilities", "binary_crossentropy([1, 0], [0.9, 0.2])", "float(-(np.log(0.9) + np.log(0.8)) / 2)"],
      ["Logits", "binary_crossentropy([1, 0], [2., -1.], from_logits=True)", "float(-(np.log(1 / (1 + np.exp(-2.))) + np.log(1 - 1 / (1 + np.exp(1.)))) / 2)"],
      ["Hidden: a probability of exactly 0 is clipped", "binary_crossentropy([1], [0.0])", "float(-np.log(1e-7))", true],
      ["Hidden: a huge logit doesn't overflow", "binary_crossentropy([0], [1000.], from_logits=True)", "1000.0", true],
      ["Hidden: logits and probabilities agree", "bool(np.isclose(binary_crossentropy([1, 0, 1], [0.3, -2., 4.], from_logits=True), binary_crossentropy([1, 0, 1], 1 / (1 + np.exp(-np.array([0.3, -2., 4.]))))))", "True", true],
    ],
    hints: ["For logits, don't compute sigmoid then log: use the stable formula given.", "np.log1p(t) is log(1 + t), accurate for small t."],
    why: "Mixing up from_logits is a classic Keras bug: a model whose last layer has no sigmoid, trained with from_logits=False, gets its scores clipped into [1e-7, 1 − 1e-7] and learns poorly. The stable logit form is also what PyTorch's BCEWithLogitsLoss uses.",
    traps: ["sigmoid then log for large |z| gives log(0) = −inf.", "Forgetting the clip, so p = 0 gives an infinite loss.", "Using from_logits=True on outputs that already went through a sigmoid."],
    followUps: ["Add a pos_weight for imbalanced data (as in BCEWithLogitsLoss).", "Show that the gradient with respect to z is sigmoid(z) − y."],
  }),
];
