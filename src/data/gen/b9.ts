/**
 * Batch 9 generator: the last seven ML-theory concepts (initialisation and normalisation, ensembles,
 * evaluation and calibration, CNNs, sequence models and attention, transformers and LLMs, embeddings
 * and RAG). Python checks recompute each answer another way where one exists: scipy root-finding and
 * integration for initialisation scales, minimisation for AdaBoost's α, enumeration for majority
 * votes, scikit-learn for boosting and metrics, scipy.signal for convolutions, interval propagation
 * for receptive fields, and vectorised numpy for positional encodings and RoPE.
 */
import { build, int, pick, type GenQ, type Rng, type Tpl } from "./quant";

const r2 = (x: number) => Math.round(x * 100) / 100;
const r4 = (x: number) => Math.round(x * 10000) / 10000;
const D2 = " Give 2 decimals.";
const D4 = " Give 4 decimals.";
const NP = ["numpy"];
const SP = ["scipy"];
const SK = ["scikit-learn"];
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const J = (x: unknown) => JSON.stringify(x);
const choose = (n: number, k: number) => { let c = 1; for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i; return c; };

// ───────────────────────── Initialisation and normalisation ─────────────────────────
const FANS = [64, 128, 256, 300, 512, 784, 1000, 1024];
const INIT: Tpl[] = [
  { key: "xavier", d: 2, secs: 60, fast: "Glorot uniform: a = √(6/(fan_in + fan_out)), so Var(w) = a²/3 = 2/(fan_in + fan_out).", trap: "Using √(1/fan_in) or forgetting that U(−a, a) has variance a²/3, not a².",
    make: (r) => { const fi = pick(r, FANS), fo = pick(r, FANS);
      return { prompt: `A dense layer has fan_in = ${fi} and fan_out = ${fo}. Glorot (Xavier) uniform initialisation draws weights from U(−a, a). What is a?${D4}`, answer: r4(Math.sqrt(6 / (fi + fo))), tol: 0.0002, explain: `Target Var(w) = 2/(${fi} + ${fo}); U(−a, a) has variance a²/3, so a = √(6/${fi + fo}) = ${r4(Math.sqrt(6 / (fi + fo)))}.`,
        py: `from scipy.stats import uniform\nfrom scipy.optimize import brentq\ntarget = 2 / (${fi} + ${fo})\nanswer = brentq(lambda a: uniform(loc=-a, scale=2 * a).var() - target, 1e-9, 10, xtol=1e-14)`, packages: SP }; } },
  { key: "he", d: 2, secs: 60, fast: "He (Kaiming) normal for ReLU: std = √(2/fan_in). The 2 compensates for ReLU zeroing half the inputs.", trap: "Using Xavier's 1/fan_in variance with ReLU, which halves the signal's variance at every layer.",
    make: (r) => { const n = pick(r, [64, 128, 256, 512, 576, 1024, 1152, 2048, 4608]);
      const desc = n === 576 ? "a 3×3 convolution with 64 input channels (fan_in = 576)" : n === 1152 ? "a 3×3 convolution with 128 input channels (fan_in = 1152)" : n === 4608 ? "a 3×3 convolution with 512 input channels (fan_in = 4608)" : `a dense ReLU layer with fan_in = ${n}`;
      return { prompt: `What standard deviation does He (Kaiming) normal initialisation use for ${desc}?${D4}`, answer: r4(Math.sqrt(2 / n)), tol: 0.0002, explain: `Var(w) = 2/fan_in = 2/${n}; std = ${r4(Math.sqrt(2 / n))}.`,
        py: `import math\nfrom scipy.integrate import quad\n# E[ReLU(z)^2] for z ~ N(0, 1); choose Var(w) so that n * Var(w) * E[ReLU(z)^2] = 1\ne2 = quad(lambda z: z * z * math.exp(-z * z / 2) / math.sqrt(2 * math.pi), 0, math.inf)[0]\nanswer = math.sqrt(1 / (${n} * e2))`, packages: SP }; } },
  { key: "bn", d: 2, secs: 90, fast: "BatchNorm (training): ŷ = γ(x − μ_B)/√(σ²_B + ε) + β with the batch's population variance (divide by m).", trap: "Using the sample variance (m − 1), or normalising across features instead of across the batch.",
    make: (r) => { const m = int(r, 4, 6), x = Array.from({ length: m }, () => int(r, -5, 12)), g = pick(r, [0.5, 1, 2]), b = pick(r, [-1, 0, 0.5, 1]), j = int(r, 0, m - 1);
      const mu = mean(x), v = mean(x.map((t) => (t - mu) ** 2));
      if (v < 1) return null;
      const y = (g * (x[j] - mu)) / Math.sqrt(v + 1e-5) + b;
      return { prompt: `One feature takes the values ${x.join(", ")} across a mini-batch of ${m}. BatchNorm in training mode uses γ = ${g}, β = ${b}, ε = 10⁻⁵. What is the output for the value ${x[j]} (item ${j + 1})? Give a negative number if needed.${D4}`, answer: r4(y), tol: 0.0002, explain: `μ = ${r4(mu)}, σ² = ${r4(v)} (divide by ${m}); ${g} × (${x[j]} − ${r4(mu)})/√(${r4(v)} + ε) + ${b} = ${r4(y)}.`,
        py: `import numpy as np\nx = np.array(${J(x)}, float).reshape(-1, 1)  # batch of ${m}, one feature\nxh = (x - x.mean(axis=0)) / np.sqrt(x.var(axis=0) + 1e-5)\nanswer = float((${g} * xh + ${b})[${j}, 0])`, packages: NP }; } },
  { key: "ln", d: 2, secs: 75, fast: "LayerNorm normalises one example across its features: (x − mean(x))/√(var(x) + ε), independent of the batch.", trap: "Normalising each feature across the batch (that is BatchNorm).",
    make: (r) => { const dd = int(r, 4, 6), x = Array.from({ length: dd }, () => int(r, -8, 10)), j = int(r, 0, dd - 1);
      const mu = mean(x), v = mean(x.map((t) => (t - mu) ** 2));
      if (v < 1) return null;
      const y = (x[j] - mu) / Math.sqrt(v + 1e-5);
      return { prompt: `A token's hidden vector is (${x.join(", ")}). LayerNorm with γ = 1, β = 0, ε = 10⁻⁵: what is output feature ${j + 1}? Give a negative number if needed.${D4}`, answer: r4(y), tol: 0.0002, explain: `Mean ${r4(mu)}, variance ${r4(v)} over the ${dd} features; (${x[j]} − ${r4(mu)})/√${r4(v)} = ${r4(y)}.`,
        py: `import numpy as np\nh = np.array([${J(x)}], float)  # one token, ${dd} features\nout = (h - h.mean(axis=-1, keepdims=True)) / np.sqrt(h.var(axis=-1, keepdims=True) + 1e-5)\nanswer = float(out[0, ${j}])`, packages: NP }; } },
];

// ───────────────────────── Bagging and boosting ─────────────────────────
const ENS: Tpl[] = [
  { key: "oob", d: 2, secs: 45, fast: "A bootstrap sample of n from n rows misses a given row with probability (1 − 1/n)ⁿ → e⁻¹ ≈ 0.368.", trap: "Answering 1/n, or forgetting draws are with replacement.",
    make: (r) => { const n = pick(r, [2, 3, 4, 5, 8, 10, 20, 50, 100, 1000]);
      return { prompt: `A random forest draws a bootstrap sample of ${n} rows (with replacement) from a training set of ${n}. What is the probability that a particular row is out-of-bag (never drawn)?${D4}`, answer: r4((1 - 1 / n) ** n), tol: 0.0002, explain: `(1 − 1/${n})^${n} = ${r4((1 - 1 / n) ** n)}; as n grows this tends to 1/e ≈ 0.3679.`,
        py: `from scipy.stats import binom\nanswer = binom.pmf(0, ${n}, 1 / ${n})`, packages: SP }; } },
  { key: "vote", d: 2, secs: 90, fast: "Majority of k independent voters with accuracy p: Σ_{j > k/2} C(k, j) pʲ(1 − p)^{k−j}.", trap: "Assuming real ensemble members are independent; correlated errors give far less gain.",
    make: (r) => { const k = pick(r, [3, 5, 7, 9]), p = pick(r, [0.55, 0.6, 0.65, 0.7, 0.75, 0.8]);
      let acc = 0; for (let j = Math.ceil((k + 1) / 2); j <= k; j++) acc += choose(k, j) * p ** j * (1 - p) ** (k - j);
      return { prompt: `${k} classifiers each have accuracy ${p} and make independent errors. What is the accuracy of their majority vote on a binary task?${D4}`, answer: r4(acc), tol: 0.0002, explain: `P(more than ${(k - 1) / 2} correct) = ${r4(acc)}.`,
        py: `import itertools\np, k = ${p}, ${k}\nanswer = 0.0\nfor votes in itertools.product([0, 1], repeat=k):\n    c = sum(votes)\n    if c > k / 2:\n        answer += p ** c * (1 - p) ** (k - c)` }; } },
  { key: "alpha", d: 2, secs: 60, fast: "AdaBoost weak-learner weight α = ½ ln((1 − ε)/ε): the α that minimises the exponential loss (1 − ε)e^{−α} + εe^{α}.", trap: "Giving a larger α to a learner with a larger error.",
    make: (r) => { const e = pick(r, [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45]);
      return { prompt: `In discrete AdaBoost, a weak learner has weighted error ε = ${e}. What weight α does it get in the final vote (α = ½ ln((1 − ε)/ε))?${D4}`, answer: r4(0.5 * Math.log((1 - e) / e)), tol: 0.0002, explain: `½ ln(${r4(1 - e)}/${e}) = ${r4(0.5 * Math.log((1 - e) / e))}. Misclassified points are then multiplied by e^α and correct ones by e^{−α}.`,
        py: `import math\nfrom scipy.optimize import minimize_scalar\ne = ${e}\nres = minimize_scalar(lambda a: (1 - e) * math.exp(-a) + e * math.exp(a), bounds=(0, 10), method="bounded", options={"xatol": 1e-12})\nanswer = res.x`, packages: SP }; } },
  { key: "gb", d: 3, secs: 90, fast: "Gradient boosting (squared loss): F₀ = mean(y); each tree fits the residuals y − F; F₁ = F₀ + η × tree.", trap: "Adding the full residual and ignoring the learning rate (shrinkage).",
    make: (r) => { const n = int(r, 4, 6), y = Array.from({ length: n }, () => int(r, 1, 30)), lr = pick(r, [0.1, 0.2, 0.3, 0.5]), i = int(r, 0, n - 1);
      if (new Set(y).size < n) return null;
      const f0 = mean(y), f1 = f0 + lr * (y[i] - f0);
      return { prompt: `Gradient boosting for regression (squared error) starts from the mean prediction. The data are x = ${Array.from({ length: n }, (_, k) => k + 1).join(", ")} with y = ${y.join(", ")}. The first tree is grown until every leaf holds one point, and the learning rate is ${lr}. After this one tree, what is the prediction at x = ${i + 1}?${D4}`, answer: r4(f1), tol: 0.0002, explain: `F₀ = ${r4(f0)}; residual at x = ${i + 1} is ${r4(y[i] - f0)}; F₁ = ${r4(f0)} + ${lr} × ${r4(y[i] - f0)} = ${r4(f1)}.`,
        py: `import numpy as np\nfrom sklearn.ensemble import GradientBoostingRegressor\nX = np.arange(1, ${n + 1}, dtype=float).reshape(-1, 1)\nm = GradientBoostingRegressor(n_estimators=1, learning_rate=${lr}, max_depth=None, random_state=0).fit(X, np.array(${J(y)}, float))\nanswer = float(m.predict([[${i + 1}.0]])[0])`, packages: SK }; } },
];

// ───────────────────────── Evaluation and calibration ─────────────────────────
const P_BIN = [0.05, 0.1, 0.15, 0.25, 0.3, 0.35, 0.45, 0.5, 0.55, 0.65, 0.7, 0.75, 0.85, 0.9, 0.95];
const EVAL: Tpl[] = [
  { key: "f1", d: 1, secs: 60, fast: "Precision = TP/(TP + FP), recall = TP/(TP + FN), F1 = 2PR/(P + R) = 2TP/(2TP + FP + FN).", trap: "Including TN in precision or recall.",
    make: (r) => { const tp = int(r, 10, 90), fp = int(r, 2, 40), fn = int(r, 2, 40), tn = int(r, 50, 400);
      return { prompt: `A fraud model's test confusion matrix: TP = ${tp}, FP = ${fp}, FN = ${fn}, TN = ${tn}. What is its F1 score?${D4}`, answer: r4((2 * tp) / (2 * tp + fp + fn)), tol: 0.0002, explain: `Precision ${r4(tp / (tp + fp))}, recall ${r4(tp / (tp + fn))}; F1 = 2TP/(2TP + FP + FN) = ${r4((2 * tp) / (2 * tp + fp + fn))}.`,
        py: `from sklearn.metrics import f1_score\ny_true = [1] * ${tp} + [0] * ${fp} + [1] * ${fn} + [0] * ${tn}\ny_pred = [1] * ${tp} + [1] * ${fp} + [0] * ${fn} + [0] * ${tn}\nanswer = f1_score(y_true, y_pred)`, packages: SK }; } },
  { key: "auc", d: 2, secs: 90, fast: "ROC AUC = P(a random positive scores above a random negative) = fraction of correctly ordered (positive, negative) pairs.", trap: "Computing accuracy at a 0.5 threshold instead.",
    make: (r) => { const used = new Set<number>(), draw = () => { let v; do v = int(r, 1, 99); while (used.has(v)); used.add(v); return v / 100; };
      const pos = Array.from({ length: int(r, 3, 5) }, draw), neg = Array.from({ length: int(r, 3, 5) }, draw);
      const good = pos.reduce((s, p) => s + neg.filter((q) => p > q).length, 0), auc = good / (pos.length * neg.length);
      return { prompt: `Scores for the positive examples: ${pos.join(", ")}. Scores for the negatives: ${neg.join(", ")}. What is the ROC AUC?${D4}`, answer: r4(auc), tol: 0.0002, explain: `${good} of ${pos.length * neg.length} (positive, negative) pairs have the positive scored higher: AUC = ${r4(auc)}.`,
        py: `from sklearn.metrics import roc_auc_score\npos, neg = ${J(pos)}, ${J(neg)}\nanswer = roc_auc_score([1] * len(pos) + [0] * len(neg), pos + neg)`, packages: SK }; } },
  { key: "brier", d: 1, secs: 60, fast: "Brier score = mean (p − y)²: lower is better; it rewards both calibration and sharpness.", trap: "Using log loss, or squaring (1 − p) for every example regardless of the label.",
    make: (r) => { const n = int(r, 4, 6), y = Array.from({ length: n }, () => int(r, 0, 1)), p = y.map(() => int(r, 5, 95) / 100);
      if (new Set(y).size < 2) return null;
      return { prompt: `Labels ${y.join(", ")}; predicted probabilities of class 1: ${p.join(", ")}. What is the Brier score?${D4}`, answer: r4(mean(p.map((v, i) => (v - y[i]) ** 2))), tol: 0.0002, explain: `Mean of (p − y)² = ${r4(mean(p.map((v, i) => (v - y[i]) ** 2)))}.`,
        py: `from sklearn.metrics import brier_score_loss\nanswer = brier_score_loss(${J(y)}, ${J(p)})`, packages: SK }; } },
  { key: "ece", d: 3, secs: 150, fast: "ECE = Σ over bins (n_b/N) × |accuracy_b − mean confidence_b|.", trap: "Averaging the bin gaps without weighting by bin size.",
    make: (r) => { const n = int(r, 8, 10), p = Array.from({ length: n }, () => pick(r, P_BIN)), y = p.map((v) => (r() < v ? 1 : 0));
      let e = 0;
      for (let b = 0; b < 5; b++) { const idx = p.map((v, i) => (Math.floor(v * 5) === b ? i : -1)).filter((i) => i >= 0); if (idx.length) e += (idx.length / n) * Math.abs(mean(idx.map((i) => y[i])) - mean(idx.map((i) => p[i]))); }
      return { prompt: `A model's predicted probabilities are ${p.join(", ")} and the true labels are ${y.join(", ")}. Using 5 equal-width bins ([0, 0.2), [0.2, 0.4), …, [0.8, 1]), what is the expected calibration error (ECE)?${D4}`, answer: r4(e), tol: 0.0002, explain: `For each non-empty bin take |fraction positive − mean probability|, weight by its share of the ${n} predictions and add: ECE = ${r4(e)}.`,
        py: `import numpy as np\np = np.array(${J(p)})\ny = np.array(${J(y)})\nb = np.digitize(p, [0.2, 0.4, 0.6, 0.8])\nanswer = float(sum(np.mean(b == k) * abs(y[b == k].mean() - p[b == k].mean()) for k in np.unique(b)))`, packages: NP }; } },
];

// ───────────────────────── CNNs ─────────────────────────
const mat = (m: number[][]) => "```\n" + m.map((row) => row.map((v) => String(v).padStart(2)).join(" ")).join("\n") + "\n```";
const CNN: Tpl[] = [
  { key: "out", d: 1, secs: 45, fast: "Output size = ⌊(n + 2p − k)/s⌋ + 1.", trap: "Forgetting to count both sides of the padding (2p).",
    make: (r) => { const n = pick(r, [7, 28, 32, 64, 96, 112, 224, 227]), k = pick(r, [1, 3, 5, 7, 11]), s = pick(r, [1, 2, 4]), p = pick(r, [0, 1, 2, 3]);
      if (n + 2 * p < k) return null;
      const o = Math.floor((n + 2 * p - k) / s) + 1;
      return { prompt: `A ${n}×${n} input goes through a ${k}×${k} convolution with stride ${s} and padding ${p}. What is the output's height?`, answer: o, tol: 0, explain: `⌊(${n} + ${2 * p} − ${k})/${s}⌋ + 1 = ${o}.`,
        py: `# count the valid window start positions along one axis of the padded input\nanswer = len(range(0, ${n} + 2 * ${p} - ${k} + 1, ${s}))` }; } },
  { key: "params", d: 1, secs: 45, fast: "Conv parameters = (k × k × C_in + 1) × C_out (one bias per filter); independent of the image size.", trap: "Multiplying by the image's height and width.",
    make: (r) => { const k = pick(r, [1, 3, 5, 7]), ci = pick(r, [1, 3, 16, 32, 64, 128]), co = pick(r, [8, 16, 32, 64, 128, 256]), hw = pick(r, [32, 64, 224]);
      return { prompt: `A conv layer applies ${co} filters of size ${k}×${k} to a ${hw}×${hw}×${ci} input, with a bias per filter. How many trainable parameters does it have?`, answer: (k * k * ci + 1) * co, tol: 0, explain: `(${k}·${k}·${ci} + 1) × ${co} = ${(k * k * ci + 1) * co}. The ${hw}×${hw} size doesn't matter: weights are shared across positions.`,
        py: `import numpy as np\nW = np.zeros((${co}, ${ci}, ${k}, ${k}))  # PyTorch layout: out, in, kh, kw\nb = np.zeros(${co})\nanswer = W.size + b.size`, packages: NP }; } },
  { key: "conv", d: 2, secs: 120, fast: "Deep-learning 'convolution' is cross-correlation: slide the kernel (not flipped), multiply element-wise, sum.", trap: "Flipping the kernel (true convolution) or misplacing the window.",
    make: (r) => { const X = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => int(r, 0, 9))), K = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => int(r, -1, 1)));
      const i = int(r, 0, 2), j = int(r, 0, 2);
      let s = 0; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) s += X[i + a][j + b] * K[a][b];
      return { prompt: `Input (5×5):\n\n${mat(X)}\n\nKernel (3×3):\n\n${mat(K)}\n\nWith stride 1 and no padding (as in deep-learning libraries, no kernel flip), what is the output at row ${i + 1}, column ${j + 1} of the 3×3 output?`, answer: s, tol: 0, explain: `Element-wise product of the kernel with the input window starting at row ${i + 1}, column ${j + 1}, summed: ${s}.`,
        py: `import numpy as np\nfrom scipy.signal import correlate2d\nout = correlate2d(np.array(${J(X)}), np.array(${J(K)}), mode="valid")\nanswer = int(out[${i}, ${j}])`, packages: SP }; } },
  { key: "rf", d: 3, secs: 90, fast: "Receptive field: r = 1; for each layer r += (k − 1) × j, then j *= s (j = product of earlier strides).", trap: "Adding the kernel sizes and ignoring how strides magnify later layers.",
    make: (r) => { const L = int(r, 2, 4), ls = Array.from({ length: L }, () => [pick(r, [3, 3, 5, 7]), pick(r, [1, 1, 2])] as [number, number]);
      let rf = 1, jump = 1; for (const [k, s] of ls) { rf += (k - 1) * jump; jump *= s; }
      return { prompt: `A CNN stacks these layers, in order: ${ls.map(([k, s]) => `${k}×${k} conv (stride ${s})`).join(", ")}. What is the receptive field (in input pixels, along one side) of one unit in the last layer?`, answer: rf, tol: 0, explain: `r = 1${ls.map(([k], idx) => ` + ${k - 1}×${ls.slice(0, idx).reduce((a, [, s]) => a * s, 1)}`).join("")} = ${rf}.`,
        py: `layers = ${J(ls)}\nlo = hi = 0  # input range seen by output unit 0, walking back through the layers\nfor k, s in reversed(layers):\n    lo, hi = lo * s, hi * s + k - 1\nanswer = hi - lo + 1` }; } },
];

// ───────────────────────── Sequence models and attention ─────────────────────────
const SEQ: Tpl[] = [
  { key: "rnn", d: 2, secs: 90, fast: "hₜ = tanh(w·hₜ₋₁ + u·xₜ + b), starting from h₀ = 0; the same weights at every step.", trap: "Resetting h between steps or using different weights per step.",
    make: (r) => { const w = int(r, -9, 9) / 10, u = int(r, -9, 9) / 10, b = int(r, -5, 5) / 10, T = int(r, 2, 3), x = Array.from({ length: T }, () => int(r, -2, 2));
      let h = 0; for (const xt of x) h = Math.tanh(w * h + u * xt + b);
      const sg = (v: number) => (v < 0 ? `− ${-v}` : `+ ${v}`);
      return { prompt: `A scalar RNN uses hₜ = tanh(${w}·hₜ₋₁ ${sg(u)}·xₜ ${sg(b)}) with h₀ = 0. For the input sequence ${x.join(", ")}, what is h${"₀₁₂₃"[T]}? Give a negative number if needed.${D4}`, answer: r4(h), tol: 0.0002, explain: `Apply the update ${T} times, feeding each h into the next step: h${"₀₁₂₃"[T]} = ${r4(h)}.`,
        py: `import numpy as np\nh = np.zeros(1)\nW, U, b = np.array([[${w}]]), np.array([[${u}]]), np.array([${b}])\nfor xt in ${J(x)}:\n    h = np.tanh(W @ h + U @ np.array([xt], float) + b)\nanswer = float(h[0])`, packages: NP }; } },
  { key: "weight", d: 2, secs: 90, fast: "Attention weights = softmax(q·kᵢ/√d) over the keys.", trap: "Forgetting the 1/√d scaling, or normalising by the sum of raw scores.",
    make: (r) => { const d = pick(r, [2, 4]), q = Array.from({ length: d }, () => int(r, -2, 2)), K = Array.from({ length: 3 }, () => Array.from({ length: d }, () => int(r, -2, 2))), j = int(r, 0, 2);
      if (q.every((v) => v === 0)) return null;
      const s = K.map((k) => k.reduce((a, v, t) => a + v * q[t], 0) / Math.sqrt(d)), e = s.map(Math.exp), w = e[j] / e.reduce((a, b) => a + b, 0);
      return { prompt: `Query q = (${q.join(", ")}). Keys: k₁ = (${K[0].join(", ")}), k₂ = (${K[1].join(", ")}), k₃ = (${K[2].join(", ")}). With scaled dot-product attention (d = ${d}), what weight does the query put on k${"₁₂₃"[j]}?${D4}`, answer: r4(w), tol: 0.0002, explain: `Scores q·k/√${d} = (${s.map(r4).join(", ")}); softmax gives ${r4(w)} for k${"₁₂₃"[j]}.`,
        py: `import numpy as np\nfrom scipy.special import softmax\nq, K = np.array(${J(q)}, float), np.array(${J(K)}, float)\nanswer = float(softmax(K @ q / np.sqrt(${d}))[${j}])`, packages: SP }; } },
  { key: "output", d: 2, secs: 120, fast: "Attention output = Σ softmax(q·kᵢ/√d) × vᵢ: a weighted average of the values.", trap: "Weighting the keys instead of the values.",
    make: (r) => { const d = 2, q = [int(r, -2, 2), int(r, -2, 2)], K = Array.from({ length: 3 }, () => [int(r, -2, 2), int(r, -2, 2)]), v = [int(r, -5, 5), int(r, -5, 5), int(r, -5, 5)];
      if (q.every((t) => t === 0) || new Set(v).size < 2) return null;
      const s = K.map((k) => (k[0] * q[0] + k[1] * q[1]) / Math.sqrt(d)), e = s.map(Math.exp), Z = e.reduce((a, b) => a + b, 0), out = e.reduce((a, t, i) => a + (t / Z) * v[i], 0);
      return { prompt: `Query q = (${q.join(", ")}). Keys k₁ = (${K[0].join(", ")}), k₂ = (${K[1].join(", ")}), k₃ = (${K[2].join(", ")}) with scalar values v = (${v.join(", ")}). What is the output of scaled dot-product attention (d = 2)? Give a negative number if needed.${D4}`, answer: r4(out), tol: 0.0002, explain: `Weights softmax(q·k/√2) = (${e.map((t) => r4(t / Z)).join(", ")}); Σ wᵢvᵢ = ${r4(out)}.`,
        py: `import numpy as np\nQ = np.array([${J(q)}], float)\nK = np.array(${J(K)}, float)\nV = np.array(${J(v)}, float).reshape(-1, 1)\nS = Q @ K.T / np.sqrt(2)\nA = np.exp(S - S.max(axis=1, keepdims=True))\nA /= A.sum(axis=1, keepdims=True)\nanswer = float((A @ V)[0, 0])`, packages: NP }; } },
  { key: "params", d: 2, secs: 60, fast: "SimpleRNN: h(x + h) + h parameters. LSTM: 4 gates, so 4 × [h(x + h) + h] (one bias per gate, as in Keras).", trap: "Forgetting the recurrent weights (h × h) or the factor 4 for the LSTM's gates.",
    make: (r) => { const x = pick(r, [8, 16, 32, 50, 64, 100, 128, 300]), h = pick(r, [16, 32, 64, 128, 256]), lstm = r() < 0.6, g = lstm ? 4 : 1;
      return { prompt: `A${lstm ? "n LSTM" : " simple RNN"} layer has input size ${x} and hidden size ${h}, with one bias vector${lstm ? " per gate" : ""} (Keras convention). How many trainable parameters does it have?`, answer: g * (h * (x + h) + h), tol: 0, explain: `${g > 1 ? "4 × " : ""}[${h}·(${x} + ${h}) + ${h}] = ${g * (h * (x + h) + h)}.`,
        py: `import numpy as np\ng, x, h = ${g}, ${x}, ${h}\nkernel = np.zeros((x, g * h))\nrecurrent = np.zeros((h, g * h))\nbias = np.zeros(g * h)\nanswer = kernel.size + recurrent.size + bias.size`, packages: NP }; } },
];

// ───────────────────────── Transformers and LLMs ─────────────────────────
const TRANS: Tpl[] = [
  { key: "kv", d: 3, secs: 90, fast: "KV cache bytes = 2 (K and V) × layers × batch × tokens × kv_heads × head_dim × bytes per value.", trap: "Using the number of query heads when the model uses grouped-query attention.",
    make: (r) => { const L = pick(r, [24, 32, 40, 80]), hd = 128, nh = pick(r, [32, 64]), nkv = pick(r, [nh, 8, 8]), T = pick(r, [2048, 4096, 8192, 32768]), B = pick(r, [1, 4, 8, 16]);
      const gib = (2 * L * B * T * nkv * hd * 2) / 2 ** 30;
      return { prompt: `A decoder has ${L} layers and ${nh} query heads of dimension ${hd}, with ${nkv === nh ? "standard multi-head attention (one K/V head per query head)" : `grouped-query attention using ${nkv} key/value heads`}. In fp16, how much memory does the KV cache need for a batch of ${B} sequences of ${T.toLocaleString("en-IN")} tokens, in GiB (2³⁰ bytes)?${D2}`, answer: r2(gib), tol: 0.02, explain: `2 × ${L} × ${B} × ${T} × ${nkv} × ${hd} × 2 bytes = ${r2(gib)} GiB.`,
        py: `import numpy as np\nshape = (2, ${L}, ${B}, ${T}, ${nkv}, ${hd})  # K/V, layer, batch, token, kv head, head dim\nanswer = int(np.prod(shape, dtype=np.int64)) * np.dtype(np.float16).itemsize / 2 ** 30`, packages: NP }; } },
  { key: "lora", d: 2, secs: 60, fast: "LoRA replaces the update to a d_out × d_in matrix by B·A with A: r × d_in and B: d_out × r, so r(d_in + d_out) trainable parameters.", trap: "Counting r × d (one factor only), or r².",
    make: (r) => { const d = pick(r, [768, 1024, 2048, 4096]), L = pick(r, [12, 24, 32]), rk = pick(r, [4, 8, 16, 64]);
      const lora = L * 2 * rk * (d + d);
      return { prompt: `You fine-tune a ${L}-layer model (hidden size ${d}) with LoRA of rank ${rk} on the query and value projections (each ${d}×${d}) of every layer. How many trainable parameters does LoRA add?`, answer: lora, tol: 0, explain: `Per matrix r(d_in + d_out) = ${rk} × ${2 * d} = ${rk * 2 * d}; × 2 matrices × ${L} layers = ${lora} (vs ${2 * L * d * d} for full fine-tuning of those matrices).`,
        py: `import numpy as np\ntotal = 0\nfor layer in range(${L}):\n    for proj in ("q", "v"):\n        A = np.zeros((${rk}, ${d}), dtype=np.float32)\n        B = np.zeros((${d}, ${rk}), dtype=np.float32)\n        total += A.size + B.size\nanswer = total`, packages: NP }; } },
  { key: "pe", d: 2, secs: 90, fast: "Sinusoidal PE: PE(pos, 2i) = sin(pos/10000^{2i/d}), PE(pos, 2i + 1) = cos(pos/10000^{2i/d}).", trap: "Using the dimension index j instead of 2i (the even index of the pair) in the exponent for odd j.",
    make: (r) => { const d = pick(r, [16, 32, 64, 128, 512]), pos = int(r, 1, 50), j = int(r, 0, 7);
      const i2 = j - (j % 2), ang = pos / 10000 ** (i2 / d), v = j % 2 ? Math.cos(ang) : Math.sin(ang);
      return { prompt: `Sinusoidal positional encoding with d_model = ${d} (dimensions numbered from 0): what is the value at position ${pos}, dimension ${j}? Give a negative number if needed.${D4}`, answer: r4(v), tol: 0.0002, explain: `Pair index 2i = ${i2}; angle = ${pos}/10000^(${i2}/${d}) = ${r4(ang)}; ${j % 2 ? "cos" : "sin"} = ${r4(v)}.`,
        py: `import numpy as np\nd, P = ${d}, ${pos + 1}\npos = np.arange(P)[:, None]\ndiv = np.exp(np.arange(0, d, 2) * -(np.log(10000.0) / d))\npe = np.zeros((P, d))\npe[:, 0::2] = np.sin(pos * div)\npe[:, 1::2] = np.cos(pos * div)\nanswer = float(pe[${pos}, ${j}])`, packages: NP }; } },
  { key: "rope", d: 3, secs: 120, fast: "RoPE rotates each 2-D pair by (position × θ). Then q_m · k_n = q · R((n − m)θ) k: it depends only on the offset n − m.", trap: "Rotating both vectors by the same angle, or adding the positions instead of subtracting.",
    make: (r) => { const q = [int(r, -3, 3), int(r, -3, 3)], k = [int(r, -3, 3), int(r, -3, 3)], th = pick(r, [0.1, 0.25, 0.5, 1]), m = int(r, 0, 12), n = int(r, 0, 12);
      if (q.every((v) => v === 0) || k.every((v) => v === 0) || m === n) return null;
      const a = (n - m) * th, rk = [k[0] * Math.cos(a) - k[1] * Math.sin(a), k[0] * Math.sin(a) + k[1] * Math.cos(a)], dot = q[0] * rk[0] + q[1] * rk[1];
      return { prompt: `With rotary position embeddings, a 2-D query pair q = (${q.join(", ")}) at position ${m} and key pair k = (${k.join(", ")}) at position ${n} are each rotated by (position × ${th}) radians. What is the dot product of the rotated query and rotated key? Give a negative number if needed.${D4}`, answer: r4(dot), tol: 0.0002, explain: `Only the offset matters: rotate k by (${n} − ${m}) × ${th} = ${r4(a)} rad relative to q; dot = ${r4(dot)}.`,
        py: `import numpy as np\nR = lambda t: np.array([[np.cos(t), -np.sin(t)], [np.sin(t), np.cos(t)]])\nq, k = np.array(${J(q)}, float), np.array(${J(k)}, float)\nanswer = float((R(${m} * ${th}) @ q) @ (R(${n} * ${th}) @ k))`, packages: NP }; } },
];

// ───────────────────────── Embeddings and RAG ─────────────────────────
const cos = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0) / (Math.hypot(...a) * Math.hypot(...b));
const RAG: Tpl[] = [
  { key: "cos", d: 1, secs: 60, fast: "cos(a, b) = a·b / (‖a‖‖b‖): direction only, from −1 to 1.", trap: "Reporting the raw dot product, which also grows with vector length.",
    make: (r) => { const dd = int(r, 3, 4), a = Array.from({ length: dd }, () => int(r, -3, 5)), b = Array.from({ length: dd }, () => int(r, -3, 5));
      if (a.every((v) => v === 0) || b.every((v) => v === 0)) return null;
      return { prompt: `Two embeddings: a = (${a.join(", ")}), b = (${b.join(", ")}). What is their cosine similarity? Give a negative number if needed.${D4}`, answer: r4(cos(a, b)), tol: 0.0002, explain: `a·b = ${a.reduce((s, v, i) => s + v * b[i], 0)}, ‖a‖ = ${r4(Math.hypot(...a))}, ‖b‖ = ${r4(Math.hypot(...b))}: ${r4(cos(a, b))}.`,
        py: `from sklearn.metrics.pairwise import cosine_similarity\nanswer = float(cosine_similarity([${J(a)}], [${J(b)}])[0, 0])`, packages: SK }; } },
  { key: "top1", d: 2, secs: 90, fast: "Rank by cosine similarity (or normalise the vectors first, then the dot product gives the same ranking).", trap: "Ranking by raw dot product, which favours long vectors.",
    make: (r) => { const q = [int(r, -2, 4), int(r, -2, 4), int(r, -2, 4)], D = Array.from({ length: 4 }, () => [int(r, -3, 6), int(r, -3, 6), int(r, -3, 6)]);
      if (q.every((v) => v === 0) || D.some((v) => v.every((t) => t === 0))) return null;
      const c = D.map((v) => cos(q, v)), best = c.indexOf(Math.max(...c)), sorted = [...c].sort((x, y) => y - x);
      if (sorted[0] - sorted[1] < 0.03) return null;
      const dots = D.map((v) => v.reduce((s, t, i) => s + t * q[i], 0));
      if (dots.indexOf(Math.max(...dots)) === best && r() < 0.6) return null; // prefer cases where the dot product misleads
      const options = ["Doc A", "Doc B", "Doc C", "Doc D"];
      return { prompt: `Query embedding (${q.join(", ")}). Document embeddings: A = (${D[0].join(", ")}), B = (${D[1].join(", ")}), C = (${D[2].join(", ")}), D = (${D[3].join(", ")}). Which document does cosine-similarity retrieval rank first?`, options, answer: best, explain: `Cosine similarities: ${c.map((v, i) => `${"ABCD"[i]} ${r4(v)}`).join(", ")} → ${options[best]}. (Raw dot products: ${dots.join(", ")}.)`,
        py: `import numpy as np\nq = np.array(${J(q)}, float)\nD = np.array(${J(D)}, float)\nqn = q / np.linalg.norm(q)\nDn = D / np.linalg.norm(D, axis=1, keepdims=True)\nanswer = int(np.argmax(Dn @ qn))`, packages: NP }; } },
  { key: "mrr", d: 2, secs: 90, fast: "MRR = mean over queries of 1/(rank of the first relevant result); 0 if none is retrieved.", trap: "Using the rank of the last relevant result, or skipping queries with no hit.",
    make: (r) => { const nq = int(r, 3, 4), ranks = Array.from({ length: nq }, () => pick(r, [1, 1, 2, 3, 4, 5, 0]));
      const lists = ranks.map((k, qi) => Array.from({ length: 5 }, (_, i) => (i + 1 === k ? `d${qi}r` : `d${qi}${i}`)));
      const m = mean(ranks.map((k) => (k ? 1 / k : 0)));
      return { prompt: `A retriever returns its top 5 for ${nq} queries. The first relevant document appears at rank ${ranks.map((k) => (k ? String(k) : "— (none in the top 5)")).join(", ")} for queries 1 to ${nq} respectively. What is the MRR@5?${D4}`, answer: r4(m), tol: 0.0002, explain: `Reciprocal ranks ${ranks.map((k) => (k ? `1/${k}` : "0")).join(", ")}; mean = ${r4(m)}.`,
        py: `lists = ${J(lists)}  # relevant ids end in "r"\nrr = []\nfor docs in lists:\n    hit = next((i + 1 for i, d in enumerate(docs) if d.endswith("r")), None)\n    rr.append(1 / hit if hit else 0.0)\nanswer = sum(rr) / len(rr)` }; } },
  { key: "chunks", d: 2, secs: 60, fast: "Chunks of size c with overlap o start every c − o tokens: count = ⌈(N − c)/(c − o)⌉ + 1 (for N > c).", trap: "Dividing N by c and ignoring the overlap.",
    make: (r) => { const c = pick(r, [256, 300, 500, 512, 800, 1000]), o = pick(r, [0, 50, 64, 100, 128]), N = int(r, 20, 200) * 50;
      if (o >= c || N <= c) return null;
      const k = Math.ceil((N - c) / (c - o)) + 1;
      return { prompt: `A ${N.toLocaleString("en-IN")}-token document is split into chunks of ${c} tokens with an overlap of ${o} tokens: the first chunk starts at token 0, each next one starts ${c - o} tokens later, and the last chunk is the first one that reaches the end of the document (it may be shorter). How many chunks are there?`, answer: k, tol: 0, explain: `Step ${c - o}; ⌈(${N} − ${c})/${c - o}⌉ + 1 = ${k}.`,
        py: `N, c, o = ${N}, ${c}, ${o}\nstart, count = 0, 0\nwhile True:\n    count += 1\n    if start + c >= N:\n        break\n    start += c - o\nanswer = count` }; } },
];

export const B9_TOPICS = {
  init: "ml-init-norm", ens: "ml-ensembles", evalc: "ml-eval-calibration", cnn: "ml-cnn", seq: "ml-seq-attention", trans: "ml-transformers", rag: "ml-embeddings-rag",
} as const;

export const B9_ITEMS: GenQ[] = [
  ...build(B9_TOPICS.init, "ml-init", 9201, INIT),
  ...build(B9_TOPICS.ens, "ml-ens", 9202, ENS),
  ...build(B9_TOPICS.evalc, "ml-eval", 9203, EVAL),
  ...build(B9_TOPICS.cnn, "ml-cnn", 9204, CNN),
  ...build(B9_TOPICS.seq, "ml-seq", 9205, SEQ),
  ...build(B9_TOPICS.trans, "ml-tf", 9206, TRANS),
  ...build(B9_TOPICS.rag, "ml-rag", 9207, RAG),
];
