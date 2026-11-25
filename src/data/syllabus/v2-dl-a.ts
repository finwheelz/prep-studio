/**
 * v2 Deep learning, part A: Neural network basics · Training deep nets (first half).
 * Fixed ids. Every quiz answer is recomputed in Pyodide (scripts/check-v2.mts, verify-items.mts).
 */
import { iq, lessonWriter } from "./v2-shared";
import { D } from "./v2-dl-sources";

const { L, Q, C } = lessonWriter("dl");
const NB = "Neural network basics";
const TD = "Training deep nets";

// ───────────────────────── Neural network basics ─────────────────────────

L("dl-mlp", NB, "From perceptron to multilayer perceptron", "Neurons, layers, why non-linearity matters, and what 'universal approximation' does and doesn't promise.", {
  kind: "concept", mins: 20, prereq: ["cml-logreg"],
  hook: "Stack ten linear layers and you still have a linear model. What exactly does the activation function buy you?",
  intuition: `
**The situation.** Logistic regression draws one straight boundary. Many real problems (XOR, images, text) need curved, multi-part boundaries. A neural network builds them by composing many simple units.

**The idea.** A **neuron** computes a weighted sum plus bias, then applies a non-linear function: $a = \\phi(w^\\top x + b)$. A **layer** is many neurons reading the same input. A **multilayer perceptron (MLP)** stacks layers: each layer re-describes the data in new features, and the last layer is an ordinary linear (or logistic/softmax) model on those learned features.

- Without the non-linearity, layers collapse: $W_2(W_1x) = (W_2W_1)x$, one linear map.
- With it, each layer can bend and fold the space, so the final linear layer can separate what was inseparable.

**The perceptron** (one neuron, step activation) learns any linearly separable problem but famously fails on XOR. One hidden layer of two units solves XOR. That's the whole story of deep learning in miniature: learned intermediate features.
`,
  maths: `
**In one breath.** $h^{(l)} = \\phi(W^{(l)}h^{(l-1)} + b^{(l)})$, output $\\hat y = g(W^{(L)}h^{(L-1)} + b^{(L)})$ with $g$ = identity, sigmoid or softmax; parameters per dense layer $= n_{in}n_{out} + n_{out}$.

**Perceptron rule.** For labels $y \\in \\{-1, +1\\}$: if $y(w^\\top x + b) \\le 0$, update $w \\leftarrow w + \\eta yx$, $b \\leftarrow b + \\eta y$. Converges in finitely many steps if the data are linearly separable; never converges on XOR.

**Worked example (perceptron).** $w = (0, 0)$, $b = 0$, $x = (1, 2)$, $y = +1$, $\\eta = 1$: score 0, so update to $w = (1, 2)$, $b = 1$. Now $x' = (2, 1)$ scores $2 + 2 + 1 = 5$.

**Counting parameters.** MLP 784 → 256 → 10: $784 \\times 256 + 256 + 256 \\times 10 + 10 = 203{,}530$.

**Universal approximation.** One hidden layer with enough units can approximate any continuous function on a bounded domain arbitrarily well. It says nothing about how many units, how to find the weights, or how well it generalises. In practice **depth** is more parameter-efficient: deep networks reuse features hierarchically (edges → textures → parts → objects).

| | Wide and shallow | Deep and narrow |
|---|---|---|
| Expressiveness per parameter | lower | higher (compositional) |
| Optimisation | easier | needs init, normalisation, residuals |
| Typical use | small tabular nets | vision, language, speech |
`,
  practice: `
**When an MLP is the right tool.** Embedding-heavy tabular models, the heads of bigger networks, the feed-forward block inside every transformer layer. For plain tabular data, gradient-boosted trees usually beat MLPs; say so in interviews.

**Defaults.** ReLU/GELU hidden activations, He initialisation, Adam(W), a few hidden layers of 128–1024 units, dropout or weight decay, early stopping.

**Where to go next.** Activation functions, then backpropagation (how the weights are actually learned).
`,
  traps: [
    { trap: "More layers always means a more powerful model.", why: "Only with non-linear activations, and only if you can train it. Without activations the stack is one linear map; without good init/normalisation/residuals deep nets may not train at all." },
    { trap: "Universal approximation means an MLP can learn anything from data.", why: "It's an existence result about representation. It promises nothing about the number of units, finding the weights with gradient descent, or generalising from finite data." },
    { trap: "Neural networks are the best model for every tabular problem.", why: "On typical tabular data, gradient-boosted trees are usually as good or better, faster and need less tuning. Neural nets shine on images, text, audio and very large or embedding-rich data." },
  ],
  say: {
    prompt: "Explain what a multilayer perceptron is and why it needs non-linear activations.",
    secs: 45,
    check: ["Neuron = weighted sum + bias + non-linearity; layers stack", "Without activations layers collapse to one linear map", "Hidden layers learn intermediate features (XOR example)", "Universal approximation: existence, not learnability or generalisation", "Depth is more parameter-efficient; needs care to train"],
    followups: [
      { q: "Why can't a single perceptron learn XOR?", a: "XOR's positive points (0,1) and (1,0) can't be separated from (0,0) and (1,1) by one straight line, and a perceptron only draws one line. A hidden layer creates features (e.g. OR and AND) in which XOR is linear." },
      { q: "Why prefer depth over width?", a: "Deep networks compose features, so they can represent many functions with exponentially fewer units than a shallow network. The cost is harder optimisation, which residual connections and normalisation address." },
      { q: "How many parameters does a 100 → 50 dense layer have?", a: "100 × 50 weights + 50 biases = 5,050." },
    ],
    answer: `An MLP is a stack of layers of neurons. Each neuron takes a weighted sum of its inputs plus a bias and passes it through a non-linear activation like ReLU. The hidden layers learn new features of the input and the output layer is an ordinary linear, logistic or softmax model on top of those features.

The non-linearity is essential: without it, two linear layers multiply out to one linear layer, so any depth gives you just linear regression. With it, the network can represent curved boundaries; XOR, which no single linear boundary solves, becomes easy with one hidden layer. Universal approximation says one wide hidden layer can approximate any continuous function, but in practice deeper networks are far more parameter-efficient, provided we can train them.`,
    avoid: ["\u201cNeurons work like the brain\u201d as the explanation", "Claiming universal approximation guarantees good learning"],
  },
  terms: [["Neuron", "a = φ(wᵀx + b)."], ["Hidden layer", "A layer between input and output whose features are learned."], ["Universal approximation", "One hidden layer can approximate any continuous function on a compact set, given enough units."]],
  sources: [D.csNN1, D.d2l],
});
Q({ id: "dl-mlp-1", d: 1, secs: 45, prompt: "Parameters (weights + biases) in an MLP 784 → 256 → 10?", answer: 203530, tol: 0.5, explain: "784·256 + 256 + 256·10 + 10 = 203,530.", py: "answer = 784*256 + 256 + 256*10 + 10" });
Q({ id: "dl-mlp-2", d: 2, secs: 60, prompt: "Perceptron, η = 1, start w = (0, 0), b = 0. Example x = (1, 2), y = +1 triggers one update. What score does the updated perceptron give x′ = (2, 1)?", answer: 5, tol: 0.005, explain: "Score 0 ≤ 0 so update: w = (1, 2), b = 1. Score of x′ = 2 + 2 + 1 = 5.", py: "import numpy as np\nw = np.zeros(2); b = 0.0\nx = np.array([1,2.]); y = 1\nif y*(w@x+b) <= 0:\n    w += y*x; b += y\nanswer = float(w@np.array([2,1.]) + b)", packages: ["numpy"] });
Q({ id: "dl-mlp-3", d: 1, secs: 30, prompt: "Two linear layers with no activation: W₁ = [[1, 2], [0, 1]] then W₂ = [[1, 0], [1, 1]]. The combined map is W₂W₁. Its bottom-right entry?", answer: 3, tol: 0.005, explain: "W₂W₁ = [[1, 2], [1, 3]]: still a single linear map.", py: "import numpy as np\nanswer = float((np.array([[1,0],[1,1]]) @ np.array([[1,2],[0,1]]))[1,1])", packages: ["numpy"] });
Q({ id: "dl-mlp-4", d: 1, secs: 30, prompt: "Which problem can a single perceptron NOT learn?", options: ["AND", "OR", "XOR", "NOT"], answer: 2, explain: "XOR isn't linearly separable.", py: "answer = 2" });
C("dl-mlp-c1", "Why activations", "Without them, stacked linear layers = one linear layer (W₂W₁x).");
C("dl-mlp-c2", "Dense layer parameters", "n_in·n_out + n_out.");

L("dl-activations", NB, "Activation functions", "Sigmoid, tanh, ReLU and its variants, GELU/SiLU: shapes, gradients, and failure modes.", {
  kind: "concept", mins: 20, prereq: ["dl-mlp"],
  hook: "Swapping sigmoid for ReLU let networks go from a few layers to dozens. What changed about the gradient?",
  intuition: `
**The situation.** Every hidden layer applies an activation. Its shape decides two things: what functions the network can make cheaply, and how gradients flow backwards during training.

**The idea.** Gradients get multiplied by the activation's derivative at every layer.

- **Sigmoid** squashes to (0, 1); its slope is at most 0.25 and near zero for large |z| (**saturation**). Many sigmoid layers multiply many small numbers: gradients vanish. Its output isn't zero-centred either.
- **tanh** is a zero-centred sigmoid (slope up to 1) but still saturates.
- **ReLU** $= \\max(0, z)$: slope exactly 1 for positive inputs, so gradients pass through unchanged; cheap to compute. Downside: units stuck at negative inputs get zero gradient forever (**dead ReLU**).
- **Leaky ReLU / PReLU** keep a small slope for negatives. **GELU** and **SiLU/Swish** are smooth ReLU-like curves used in transformers and modern CNNs.

Output layers are a separate choice: identity for regression, sigmoid for binary/multi-label, softmax for multiclass.
`,
  maths: `
**In one breath.** $\\sigma'(z) = \\sigma(z)(1 - \\sigma(z)) \\le 0.25$; $\\tanh'(z) = 1 - \\tanh^2 z \\le 1$; ReLU$'(z) = 1$ for $z > 0$, else 0; GELU$(z) = z\\,\\Phi(z)$.

| Activation | Formula | Range | Max slope | Main issue |
|---|---|---|---|---|
| Sigmoid | $1/(1 + e^{-z})$ | (0, 1) | 0.25 | saturation, not zero-centred |
| tanh | $\\tanh z$ | (−1, 1) | 1 | saturation |
| ReLU | $\\max(0, z)$ | [0, ∞) | 1 | dead units |
| Leaky ReLU | $\\max(\\alpha z, z)$ | ℝ | 1 | extra hyperparameter α |
| GELU | $z\\Phi(z)$ | ≈ [−0.17, ∞) | ≈ 1.13 | slightly costlier |
| SiLU / Swish | $z\\sigma(z)$ | ≈ [−0.28, ∞) | ≈ 1.1 | slightly costlier |

**Worked examples.** $\\sigma'(0) = 0.25$. Ten sigmoid layers, even at their steepest point, scale the gradient by at most $0.25^{10} \\approx 10^{-6}$. GELU$(1) = 1 \\times \\Phi(1) = 0.841$; GELU$(-1) = -0.159$.

**Dead ReLU.** If a unit's pre-activation is negative for every input (e.g. after a large update pushes its bias very negative), its gradient is 0 for every example and it never recovers. High learning rates make this more likely; Leaky ReLU, careful init and lower learning rates help.
`,
  practice: `
**Defaults.** ReLU for CNNs and MLPs; GELU (or SwiGLU) inside transformers; tanh inside LSTM/GRU gates' candidate states; sigmoid for gates and binary outputs; softmax for multiclass outputs.

**Diagnose.** Monitor the fraction of ReLUs that are zero across a batch; > 50–90% persistently zero suggests dead units. Saturated sigmoids show activations piled at 0 and 1.
`,
  traps: [
    { trap: "ReLU isn't differentiable at 0, so you can't train with it.", why: "It's differentiable everywhere except one point, which inputs essentially never hit exactly; frameworks use a subgradient (0 or 1). Training works fine." },
    { trap: "Use sigmoid in hidden layers because outputs are probabilities.", why: "Hidden activations aren't probabilities. Sigmoid's small, saturating gradient slows deep training; use ReLU/GELU in hidden layers and sigmoid only where a probability is needed." },
    { trap: "Dead ReLUs fix themselves as training continues.", why: "A unit whose input is negative on all data gets zero gradient, so nothing ever moves it. Prevention (init, learning rate, Leaky ReLU) is the fix." },
  ],
  say: {
    prompt: "Compare sigmoid, tanh and ReLU as hidden-layer activations.",
    secs: 45,
    check: ["Sigmoid: max slope 0.25, saturates, not zero-centred → vanishing gradients", "tanh: zero-centred, slope up to 1, still saturates", "ReLU: slope 1 for positives, cheap, sparse; dead units", "Variants: Leaky ReLU, GELU, SiLU and where they're used", "Output activations chosen by the task"],
    followups: [
      { q: "What is a dead ReLU and how do you prevent it?", a: "A unit whose pre-activation is negative for all inputs, so its gradient is always 0 and it never updates. Prevent with sensible init, lower learning rates, Leaky ReLU/PReLU or normalisation." },
      { q: "Why do transformers use GELU instead of ReLU?", a: "It's a smooth curve that weights inputs by their probability of being positive under a Gaussian; empirically it trains slightly better in transformers. Gated variants like SwiGLU are now common." },
      { q: "Why does a non-zero-centred activation slow training?", a: "If all inputs to a neuron are positive, the gradients on its weights all share a sign, so updates zig-zag instead of moving diagonally. Zero-centred activations or normalisation avoid this." },
    ],
    answer: `The activation's derivative multiplies the gradient at every layer, so its shape matters for training. Sigmoid has a maximum slope of 0.25 and flattens out for large inputs, so in a deep stack gradients shrink towards zero; it also isn't zero-centred. tanh is zero-centred with slope up to 1, but still saturates.

ReLU passes gradients through unchanged for positive inputs, is cheap and gives sparse activations, which is why it made deep networks trainable. Its failure mode is dead units that are negative for every input and never update, which Leaky ReLU, careful initialisation and moderate learning rates prevent. In transformers, smooth variants like GELU or SwiGLU are standard. Output activations are a separate choice: identity, sigmoid or softmax depending on the target.`,
    avoid: ["\u201cReLU can't be trained because it's not differentiable at 0\u201d", "Using sigmoid in hidden layers by default"],
  },
  terms: [["Saturation", "Flat regions of an activation where the gradient ≈ 0."], ["Dead ReLU", "Unit that outputs 0 for all inputs and gets no gradient."], ["GELU", "z·Φ(z): smooth ReLU-like activation."]],
  sources: [D.csNN1, D.he, D.d2l],
});
Q({ id: "dl-act-1", d: 1, secs: 30, prompt: "Derivative of the sigmoid at z = 0?", answer: 0.25, tol: 0.002, explain: "σ(0)(1 − σ(0)) = 0.5 × 0.5 = 0.25, its maximum.", py: "import math\ns = 1/(1+math.exp(0))\nanswer = s*(1-s)" });
Q({ id: "dl-act-2", d: 2, secs: 45, prompt: "Upper bound on the factor by which 5 sigmoid layers (activation derivatives only, weights = 1) can scale a gradient? (6 decimals)", answer: 0.000977, tol: 0.00001, explain: "0.25⁵ = 0.000977.", py: "answer = 0.25**5" });
Q({ id: "dl-act-3", d: 2, secs: 60, prompt: "GELU(z) = z·Φ(z), Φ the standard normal CDF. GELU(1)? (3 decimals)", answer: 0.841, tol: 0.002, explain: "Φ(1) = 0.8413.", py: "from scipy.stats import norm\nanswer = 1*norm.cdf(1)", packages: ["scipy"] });
Q({ id: "dl-act-4", d: 1, secs: 30, prompt: "Derivative of tanh at z = 0?", answer: 1, tol: 0.002, explain: "1 − tanh²(0) = 1.", py: "import math\nanswer = 1 - math.tanh(0)**2" });
C("dl-act-c1", "Sigmoid derivative", "σ(z)(1 − σ(z)), at most 0.25: deep sigmoid stacks vanish gradients.");
C("dl-act-c2", "Activation defaults", "Hidden: ReLU (CNN/MLP), GELU/SwiGLU (transformers). Output: identity / sigmoid / softmax.");

L("dl-output-loss", NB, "Output layers, softmax and cross-entropy", "Matching the output activation and loss to the task, and computing them stably.", {
  kind: "concept", mins: 20, prereq: ["dl-activations", "cml-logreg"],
  hook: "Your model outputs NaN after a few steps, and only on confident examples. What did you compute in the wrong order?",
  intuition: `
**The situation.** The last layer turns features into a prediction, and the loss scores it. Getting this pair wrong is one of the most common bugs in deep learning code.

**The idea.** Pick the output and loss from the target type:

- **Regression:** linear output + MSE (or MAE/Huber for outliers).
- **Binary classification:** one logit + sigmoid + binary cross-entropy.
- **Multiclass (one label):** $K$ logits + softmax + categorical cross-entropy.
- **Multi-label (several labels can be true):** $K$ logits + an independent sigmoid each + binary cross-entropy summed over labels.

The network outputs **logits** (raw scores). Softmax turns them into probabilities that sum to 1. Cross-entropy is minus the log of the probability given to the true class. Libraries fuse softmax and log into one stable operation, which is why you pass logits, not probabilities, to \`CrossEntropyLoss\` / \`BCEWithLogitsLoss\`.
`,
  maths: `
**In one breath.** $p_k = \\dfrac{e^{z_k}}{\\sum_j e^{z_j}}$; $L = -\\log p_y = \\log\\sum_j e^{z_j} - z_y$; $\\partial L/\\partial z = p - \\text{onehot}(y)$.

**Worked example.** Logits $(2, 1, 0)$: $p = (0.665, 0.245, 0.090)$. If the true class is 0, $L = -\\log 0.665 = 0.408$.

**Stability (log-sum-exp).** $e^{1000}$ overflows. Use $\\log\\sum_j e^{z_j} = m + \\log\\sum_j e^{z_j - m}$ with $m = \\max_j z_j$. Example: logits $(1000, 1000)$ give $1000 + \\log 2 = 1000.693$. Softmax is unchanged by adding a constant to every logit, so subtracting the max is free.

**Why the gradient is so clean.** For softmax + cross-entropy, the gradient with respect to the logits is just predicted minus true probabilities. That's the same form as logistic regression's $X^\\top(p - y)$ and keeps gradients large exactly when the model is confidently wrong.

**Temperature.** $\\text{softmax}(z/T)$: $T < 1$ sharpens, $T > 1$ flattens. Used in distillation and sampling from language models.

| Task | Output | Loss (PyTorch) |
|---|---|---|
| Regression | linear | MSELoss / HuberLoss |
| Binary | 1 logit | BCEWithLogitsLoss |
| Multiclass | K logits | CrossEntropyLoss (takes logits) |
| Multi-label | K logits | BCEWithLogitsLoss |
`,
  practice: `
**Bugs to check first.** Softmax applied before \`CrossEntropyLoss\` (double softmax: training is slow and probabilities squashed). Sigmoid before \`BCEWithLogitsLoss\`. Softmax used for multi-label targets (forces labels to compete). Labels as one-hot floats vs class indices mismatched with the loss.

**Imbalance.** Class weights in the loss, or focal loss (down-weights easy examples) for dense detection-style problems.
`,
  traps: [
    { trap: "Apply softmax in the model, then pass the probabilities to CrossEntropyLoss.", why: "CrossEntropyLoss already includes log-softmax. Applying softmax twice flattens the distribution and weakens gradients. Pass raw logits." },
    { trap: "Use softmax for multi-label tagging.", why: "Softmax forces probabilities to sum to 1, so labels compete. With several true labels, use an independent sigmoid per label with binary cross-entropy." },
    { trap: "Compute log(softmax(z)) directly; it's mathematically the same.", why: "Numerically it isn't: exp overflows or the probability underflows to 0 and log gives −inf/NaN. Use the fused log-softmax with the max-subtraction trick." },
  ],
  say: {
    prompt: "How do you choose the output layer and loss for a neural network, and why is cross-entropy paired with softmax?",
    secs: 45,
    check: ["Regression → linear + MSE; binary → sigmoid + BCE; multiclass → softmax + CE; multi-label → per-label sigmoid + BCE", "CE = −log probability of the true class (maximum likelihood)", "Gradient w.r.t. logits = p − y", "Numerical stability: fused log-softmax / log-sum-exp, pass logits", "Temperature or class weights where relevant"],
    followups: [
      { q: "Why subtract the max logit before softmax?", a: "Softmax is invariant to adding a constant to every logit, and subtracting the max keeps every exponent ≤ 0, preventing overflow without changing the result." },
      { q: "What does temperature do to softmax?", a: "Dividing logits by T > 1 flattens the distribution (softer targets, more random sampling); T < 1 sharpens it towards the arg-max." },
      { q: "Multiclass vs multi-label: what changes?", a: "Multiclass has exactly one true class: softmax + CE. Multi-label allows several: K independent sigmoids with BCE, and per-label thresholds." },
    ],
    answer: `I match them to the target: a linear output with MSE for regression, one logit with sigmoid and binary cross-entropy for binary classification, K logits with softmax and cross-entropy for single-label multiclass, and K independent sigmoids with binary cross-entropy for multi-label problems.

Cross-entropy is the negative log-probability of the true class, so minimising it is maximum likelihood, and paired with softmax its gradient with respect to the logits is simply predicted minus true probabilities, which stays large when the model is confidently wrong. In code I pass raw logits to the fused loss, which uses the log-sum-exp trick so large logits don't overflow.`,
    avoid: ["Applying softmax before CrossEntropyLoss", "Using softmax for multi-label"],
  },
  terms: [["Logits", "Raw, unnormalised scores before softmax/sigmoid."], ["Softmax", "e^{z_k}/Σ e^{z_j}."], ["Log-sum-exp trick", "Subtract the max logit before exponentiating."], ["Temperature", "Divide logits by T to sharpen or flatten softmax."]],
  sources: [D.csNN2, D.d2l],
});
Q({ id: "dl-out-1", d: 1, secs: 45, prompt: "Softmax of logits (2, 1, 0): probability of the first class? (3 decimals)", answer: 0.665, tol: 0.002, explain: "e²/(e² + e + 1) = 7.389/11.107 = 0.665.", py: "import numpy as np\nz = np.array([2,1,0.]); p = np.exp(z)/np.exp(z).sum()\nanswer = float(p[0])", packages: ["numpy"] });
Q({ id: "dl-out-2", d: 2, secs: 45, prompt: "Same logits (2, 1, 0), true class 0. Cross-entropy loss? (3 decimals)", answer: 0.408, tol: 0.002, explain: "log(e² + e + 1) − 2 = 2.408 − 2 = 0.408.", py: "import numpy as np\nz = np.array([2,1,0.])\nanswer = float(np.log(np.exp(z).sum()) - z[0])", packages: ["numpy"] });
Q({ id: "dl-out-3", d: 2, secs: 45, prompt: "log-sum-exp of logits (1000, 1000)? (3 decimals)", answer: 1000.693, tol: 0.002, explain: "1000 + log(e⁰ + e⁰) = 1000 + ln 2.", py: "from scipy.special import logsumexp\nanswer = float(logsumexp([1000., 1000.]))", packages: ["scipy"] });
Q({ id: "dl-out-4", d: 2, secs: 45, prompt: "Softmax output p = (0.7, 0.2, 0.1), true class 1. Gradient of the cross-entropy w.r.t. the logit of class 1?", answer: -0.8, tol: 0.002, explain: "p − y: 0.2 − 1 = −0.8.", py: "answer = 0.2 - 1" });
Q({ id: "dl-out-5", d: 1, secs: 30, prompt: "A photo can be tagged 'beach', 'sunset' and 'people' at once. Output and loss?", options: ["Softmax + cross-entropy", "Per-label sigmoid + binary cross-entropy", "Linear + MSE", "Single sigmoid + BCE"], answer: 1, explain: "Multi-label: labels don't compete, so independent sigmoids.", py: "answer = 1" });
C("dl-out-c1", "Softmax + CE gradient", "∂L/∂z = p − onehot(y).");
C("dl-out-c2", "Stable softmax", "Subtract max logit; pass logits to fused losses (CrossEntropyLoss, BCEWithLogitsLoss).");

L("dl-backprop", NB, "Backpropagation", "The chain rule on a computation graph: how every weight's gradient is computed in one backward pass.", {
  kind: "concept", mins: 25, prereq: ["dl-mlp", "dl-output-loss"],
  hook: "A network has 100 million weights. How do you get all 100 million gradients for about the cost of two forward passes?",
  intuition: `
**The situation.** Gradient descent needs $\\partial L/\\partial w$ for every weight. Perturbing each weight separately (finite differences) would take one forward pass per weight: impossible at scale.

**The idea.** Write the computation as a graph of simple operations (multiply, add, ReLU). Each node knows its **local** derivative. Run forward once, storing intermediate values. Then go **backwards** from the loss: each node receives "how much does the loss change if my output changes" (the upstream gradient), multiplies by its local derivative, and passes the result to its inputs. That's the chain rule, organised so every intermediate gradient is computed once and reused.

Patterns to remember:

- **Add** gate: copies the upstream gradient to both inputs.
- **Multiply** gate: each input gets the upstream gradient times the *other* input.
- **Max / ReLU** gate: routes the gradient to the input that won (or zero).
- Where a value fans out to several places, its gradients **add**.
`,
  maths: `
**In one breath.** For $z^{(l)} = W^{(l)}a^{(l-1)} + b^{(l)}$, $a^{(l)} = \\phi(z^{(l)})$: $\\delta^{(l)} = (W^{(l+1)\\top}\\delta^{(l+1)}) \\odot \\phi'(z^{(l)})$, $\\partial L/\\partial W^{(l)} = \\delta^{(l)}a^{(l-1)\\top}$, $\\partial L/\\partial b^{(l)} = \\delta^{(l)}$.

**Worked example (graph).** $f = (x + y)\\,z$ with $x = -2$, $y = 5$, $z = -4$. Forward: $q = 3$, $f = -12$. Backward: $\\partial f/\\partial z = q = 3$, $\\partial f/\\partial q = z = -4$, and the add gate passes $-4$ to both $x$ and $y$.

**Worked example (one weight).** $L = (wx - y)^2$, $w = 2$, $x = 3$, $y = 5$: $\\partial L/\\partial w = 2(wx - y)x = 6$.

**Output layer.** With softmax + cross-entropy, $\\delta^{(L)} = p - y$, so backprop starts from that simple error vector.

**Cost.** Backward ≈ 2× the forward compute (one matmul for the input gradient, one for the weight gradient), so a training step ≈ 3× a forward pass. Memory is the catch: activations from the forward pass must be stored for the backward pass. **Gradient checkpointing** recomputes some of them to save memory.

**Autodiff.** Frameworks build the graph as you run code (PyTorch) and apply reverse-mode differentiation automatically; reverse mode is efficient because there's one scalar loss and many parameters.

**Gradient checking.** Compare analytic gradients to centred differences $\\frac{f(w + h) - f(w - h)}{2h}$ on a few weights with small $h$; relative error around $10^{-7}$ is good in float64.
`,
  practice: `
**Why you still need to know it.** Debugging NaNs and vanishing/exploding gradients, writing custom layers, reasoning about memory (activations dominate training memory), and interview questions that ask you to backprop through a tiny network by hand.

**Practical tools.** \`loss.backward()\` accumulates into \`.grad\` (call \`zero_grad()\` each step); \`torch.no_grad()\` for evaluation; hooks or \`register_hook\` to inspect gradients; gradient-norm logging per layer.
`,
  traps: [
    { trap: "Backprop is a different algorithm from the chain rule.", why: "It is the chain rule, applied in reverse order on the computation graph with intermediate results cached so nothing is recomputed." },
    { trap: "Forgetting zero_grad() doesn't matter much.", why: "PyTorch accumulates gradients across backward calls, so every step adds the previous gradients: effectively a growing learning rate and wrong updates." },
    { trap: "Memory during training is mostly the weights.", why: "For large batches and deep nets, stored activations usually dominate. That's why batch size, sequence length and checkpointing drive memory." },
  ],
  say: {
    prompt: "Explain backpropagation as you would to an interviewer.",
    secs: 60,
    check: ["Computation graph; forward pass stores intermediate values", "Backward pass applies the chain rule from the loss, multiplying upstream gradients by local derivatives", "Gradients of fan-out are summed; gate patterns (add, multiply, ReLU)", "Layer formulas: δ, ∂L/∂W = δ aᵀ", "Cost ≈ 2× forward; activation memory; autodiff / gradient checking"],
    followups: [
      { q: "Why reverse mode rather than forward mode?", a: "Reverse mode costs one backward pass per scalar output, giving gradients for all parameters at once. Forward mode costs one pass per input/parameter direction. With one loss and millions of parameters, reverse wins." },
      { q: "What is gradient checkpointing?", a: "Storing only some activations in the forward pass and recomputing the rest during the backward pass, trading roughly one extra forward pass for much lower memory." },
      { q: "How do you verify a hand-written gradient?", a: "Compare it to a centred finite difference (f(w + h) − f(w − h))/2h for a few random parameters in double precision; the relative error should be tiny (around 1e-7)." },
    ],
    answer: `Backpropagation is the chain rule applied to the network's computation graph in reverse. In the forward pass we compute and store every intermediate value. In the backward pass we start with the derivative of the loss, and at each operation multiply the incoming gradient by that operation's local derivative and send it to its inputs: an add passes it through unchanged, a multiply scales it by the other input, a ReLU passes it only where the input was positive. Where a value feeds several places, the gradients add.

For a dense layer this gives δ for each layer from the layer above, and the weight gradient is δ times the previous activation transposed. The whole backward pass costs about twice the forward pass, so we get every gradient for roughly three forward passes, but we must store the activations, which is what dominates training memory.`,
    avoid: ["Describing it as finite differences", "\u201cIt only works for sigmoid networks\u201d"],
  },
  terms: [["Computation graph", "DAG of operations from inputs to loss."], ["Upstream gradient", "∂L/∂(node output), passed backwards."], ["Reverse-mode autodiff", "Computes all ∂L/∂θ in one backward pass."], ["Gradient checkpointing", "Recompute activations in backward to save memory."]],
  sources: [D.csBP, D.d2l],
});
Q({ id: "dl-bp-1", d: 1, secs: 45, prompt: "f = (x + y)·z with x = −2, y = 5, z = −4. ∂f/∂x?", answer: -4, tol: 0.005, explain: "∂f/∂q = z = −4, and the add gate passes it unchanged to x.", py: "x, y, z, h = -2.0, 5.0, -4.0, 1e-6\nf = lambda x: (x+y)*z\nanswer = (f(x+h)-f(x-h))/(2*h)" });
Q({ id: "dl-bp-2", d: 1, secs: 45, prompt: "L = (wx − y)² with w = 2, x = 3, y = 5. ∂L/∂w?", answer: 6, tol: 0.005, explain: "2(wx − y)x = 2(1)(3) = 6.", py: "w, x, y, h = 2.0, 3.0, 5.0, 1e-6\nL = lambda w: (w*x-y)**2\nanswer = (L(w+h)-L(w-h))/(2*h)" });
Q({ id: "dl-bp-3", d: 3, secs: 120, prompt: "One neuron ŷ = σ(wx + b) with binary cross-entropy. x = 2, w = 0.5, b = −1, true y = 1. ∂L/∂w? (3 decimals)", answer: -1, tol: 0.002, explain: "z = 0, p = 0.5; ∂L/∂z = p − y = −0.5; ∂L/∂w = −0.5 × x = −1.", py: "import math\nx, b, y, h = 2.0, -1.0, 1, 1e-6\ndef L(w):\n    p = 1/(1+math.exp(-(w*x+b)))\n    return -(y*math.log(p) + (1-y)*math.log(1-p))\nanswer = (L(0.5+h)-L(0.5-h))/(2*h)" });
Q({ id: "dl-bp-4", d: 2, secs: 60, prompt: "A value feeds two branches whose upstream gradients are 3 and −1. Its gradient?", answer: 2, tol: 0.005, explain: "Gradients from fan-out branches add: 3 + (−1) = 2.", py: "x, h = 1.5, 1e-6\nf = lambda x: 3*x + (-1)*x\nanswer = (f(x+h)-f(x-h))/(2*h)" });
C("dl-bp-c1", "Gate patterns", "Add: copy gradient. Multiply: gradient × other input. ReLU/max: route to winner. Fan-out: sum.");
C("dl-bp-c2", "Dense layer backprop", "δˡ = (Wˡ⁺¹ᵀδˡ⁺¹) ⊙ φ′(zˡ); ∂L/∂Wˡ = δˡ aˡ⁻¹ᵀ.");

L("dl-params-flops", NB, "Parameters, memory and compute", "Counting parameters, FLOPs and training memory: the back-of-envelope maths interviewers expect.", {
  kind: "concept", mins: 20, prereq: ["dl-backprop"],
  hook: "Can you fine-tune a 7-billion-parameter model on one 24 GB GPU? Answer with arithmetic, not vibes.",
  intuition: `
**The situation.** Interviewers for ML engineering roles routinely ask you to size models: how many parameters, how much GPU memory, how long to train. The answers come from a few multiplication rules.

**The idea.**

- **Parameters** come from layer shapes: a dense layer is in × out (+ out biases), a conv layer is $k \\times k \\times C_{in} \\times C_{out}$ (+ $C_{out}$).
- **Compute**: a matrix multiply of an $m \\times n$ by $n \\times p$ costs about $2mnp$ FLOPs (a multiply and an add). Training ≈ 3× forward.
- **Memory** for training = weights + gradients + optimiser state + activations. Adam keeps two extra numbers per parameter, so optimiser state alone is often bigger than the weights.

These rules tell you whether something fits before you try it, and they explain why tricks like mixed precision, LoRA and gradient checkpointing exist.
`,
  maths: `
**In one breath.** Dense params $= n_{in}n_{out} + n_{out}$; conv params $= (k^2C_{in} + 1)C_{out}$; matmul FLOPs $\\approx 2mnp$; training FLOPs $\\approx 6ND$ for $N$ parameters and $D$ tokens; mixed-precision Adam ≈ 16 bytes per parameter before activations.

**Worked examples.**

- Conv 3×3, 64 → 128 channels: $(9 \\times 64 + 1) \\times 128 = 73{,}856$ parameters.
- Dense layer on a batch: $32 \\times 1024$ input times $1024 \\times 4096$ weights: $2 \\times 32 \\times 1024 \\times 4096 \\approx 0.268$ GFLOPs.
- A 1B-parameter model trained on 20B tokens: $6 \\times 10^9 \\times 2 \\times 10^{10} = 1.2 \\times 10^{20}$ FLOPs.
- 7B parameters in fp16 = 14 GB just for weights.

**Training memory per parameter (mixed precision with Adam).**

| Item | Bytes/param |
|---|---|
| fp16/bf16 weights | 2 |
| fp16/bf16 gradients | 2 |
| fp32 master weights | 4 |
| Adam m and v (fp32) | 8 |
| **Total** | **16** |

So full fine-tuning of 7B ≈ 112 GB plus activations: not on one 24 GB GPU. Options: LoRA (train a tiny adapter; frozen weights in 4-bit ≈ 3.5 GB), optimiser sharding (ZeRO/FSDP), CPU offload.

**Inference memory.** Weights + activations + (for transformers) the KV cache, which grows with batch × sequence length.
`,
  practice: `
**Back-of-envelope habit.** Before training: params → weight memory → ×(roughly 8 for fp32 Adam weights+grads+states, or 16 bytes total in mixed precision) → add activations (scale with batch × sequence × hidden × layers). If it doesn't fit: smaller batch with gradient accumulation, mixed precision, checkpointing, sharding, or parameter-efficient fine-tuning.

**Throughput.** Achieved FLOPs/s are usually 30–60% of a GPU's peak (model FLOPs utilisation). Time ≈ total FLOPs / (peak × utilisation).
`,
  traps: [
    { trap: "A 7B model is 7 GB because it has 7B parameters.", why: "That's only true at 1 byte per parameter (8-bit). In fp16 it's 14 GB, in fp32 28 GB, and training with Adam needs several times more." },
    { trap: "Conv layers have few parameters, so they're cheap.", why: "Parameters are shared across positions, but compute scales with output height × width. Early high-resolution conv layers can dominate FLOPs while holding few parameters." },
    { trap: "Halving the batch size halves total training compute.", why: "Total compute depends on data processed (≈ 6ND). Smaller batches reduce memory per step but need more steps; compute stays about the same." },
  ],
  say: {
    prompt: "Estimate the GPU memory needed to fully fine-tune a 7B model with Adam, and what you'd do if it doesn't fit.",
    secs: 60,
    check: ["Weights 7B × 2 bytes = 14 GB in bf16", "Mixed-precision Adam ≈ 16 bytes/param → ~112 GB + activations", "Activations scale with batch × sequence × layers", "Fixes: LoRA/QLoRA, ZeRO/FSDP sharding, checkpointing, accumulation, offload", "Uses rules like 2mnp FLOPs / 6ND"],
    followups: [
      { q: "Why does Adam need so much memory?", a: "It keeps first and second moment estimates for every parameter, usually in fp32 (8 bytes), plus fp32 master weights in mixed precision: optimiser state exceeds the weights themselves." },
      { q: "Rough training FLOPs for N parameters and D tokens?", a: "About 6ND: 2ND for the forward pass and 4ND for the backward pass." },
      { q: "How does gradient accumulation help?", a: "It splits a large logical batch into several micro-batches, summing gradients before one optimiser step, so the effective batch size stays large while activation memory per step is small." },
    ],
    answer: `In bf16 the weights alone are 7 billion times 2 bytes, 14 GB. Full fine-tuning with Adam in mixed precision needs roughly 16 bytes per parameter: 2 for weights, 2 for gradients, 4 for fp32 master weights and 8 for Adam's two moment estimates, so about 112 GB before activations, which then scale with batch size, sequence length and depth.

That doesn't fit on a single 24 GB card. I'd use parameter-efficient fine-tuning like LoRA or QLoRA, keeping the base model frozen in 4-bit so the trainable state is tiny, plus gradient checkpointing and small micro-batches with gradient accumulation. With several GPUs, FSDP or ZeRO can shard the weights, gradients and optimiser state instead.`,
    avoid: ["\u201c7 billion parameters means 7 GB\u201d", "Forgetting optimiser state and activations"],
  },
  terms: [["FLOPs", "Floating-point operations; matmul ≈ 2mnp."], ["Mixed precision", "fp16/bf16 compute with fp32 master weights."], ["Gradient accumulation", "Sum gradients over micro-batches before stepping."], ["6ND", "Approximate training compute for N params and D tokens."]],
  sources: [D.mixed, D.csCNN],
});
Q({ id: "dl-pf-1", d: 1, secs: 45, prompt: "Parameters in a 3×3 conv layer from 64 to 128 channels, with bias?", answer: 73856, tol: 0.5, explain: "(3·3·64 + 1)·128 = 73,856.", py: "answer = (3*3*64 + 1)*128" });
Q({ id: "dl-pf-2", d: 2, secs: 60, prompt: "FLOPs (multiply + add) for a (32 × 1024) by (1024 × 4096) matrix multiply, in GFLOPs? (3 decimals)", answer: 0.268, tol: 0.002, explain: "2 × 32 × 1024 × 4096 = 268,435,456 ≈ 0.268 GFLOPs.", py: "answer = 2*32*1024*4096/1e9" });
Q({ id: "dl-pf-3", d: 2, secs: 60, prompt: "Mixed-precision Adam at ~16 bytes per parameter: training-state memory for a 7B model, in GB (10⁹ bytes)?", answer: 112, tol: 0.5, explain: "7 × 10⁹ × 16 = 112 × 10⁹ bytes, before activations.", py: "answer = 7e9*16/1e9" });
Q({ id: "dl-pf-4", d: 2, secs: 45, prompt: "Approximate training compute (6ND) for a 1B-parameter model on 20B tokens, in units of 10²⁰ FLOPs?", answer: 1.2, tol: 0.005, explain: "6 × 10⁹ × 2 × 10¹⁰ = 1.2 × 10²⁰.", py: "answer = 6*1e9*2e10/1e20" });
C("dl-pf-c1", "Training memory (mixed-precision Adam)", "≈ 16 bytes/param + activations.");
C("dl-pf-c2", "Compute rules", "Matmul 2mnp; training ≈ 3× forward ≈ 6ND.");

L("dl-basics-practice", NB, "Neural network basics practice", "Six interview scenarios on MLPs, activations, losses, backprop and sizing.", {
  kind: "interview", mins: 30, prereq: ["dl-mlp", "dl-activations", "dl-output-loss", "dl-backprop", "dl-params-flops"],
  hook: "Answer each scenario out loud in about a minute, then open it and tick off the points the interviewer is listening for.",
}, [
  iq("Your network's loss is NaN after 200 steps. Walk through what you check.", "Look for numerical instability first: logits passed through softmax then log separately (use fused losses), log of zero, division by a zero variance, too high a learning rate causing exploding weights, fp16 overflow without loss scaling, and bad inputs (NaN/inf in the data). Log gradient norms per layer, lower the learning rate, add gradient clipping, and reproduce on one batch.", ["Fused/stable loss (logits)", "Learning rate / exploding gradients → clipping", "Mixed-precision overflow / loss scaling", "Check data for NaN/inf", "Gradient-norm logging, reproduce on a small batch"]),
  iq("Backprop by hand: y = ReLU(w·x + b), L = (y − t)². x = 2, w = 1, b = −1, t = 3. Give ∂L/∂w and ∂L/∂b.", "Forward: z = 1, y = 1, L = 4. ∂L/∂y = 2(y − t) = −4. ReLU passes it (z > 0): ∂L/∂z = −4. ∂L/∂w = −4 × x = −8; ∂L/∂b = −4.", ["Forward values z = 1, y = 1", "∂L/∂y = −4", "ReLU passes gradient since z > 0", "∂L/∂w = −8, ∂L/∂b = −4"]),
  iq("When would you choose a neural network over gradient boosting for a tabular problem?", "Default to boosting for typical tabular data. Prefer a network when there are high-cardinality IDs that benefit from embeddings, when the data are huge and can feed a big model, when you need to combine tabular with text/images, need multi-task outputs, or end-to-end training with other networks. Always benchmark against a tuned GBM.", ["Boosting is the default on tabular", "Embeddings for high-cardinality IDs", "Multimodal / multi-task / end-to-end", "Benchmark both"]),
  iq("Why do deep networks with sigmoid activations train slowly, and what fixed it historically?", "Sigmoid's derivative is at most 0.25 and near zero when saturated, so gradients shrink multiplicatively through layers (vanishing gradients), and its outputs aren't zero-centred. ReLU-family activations, better initialisation (Xavier/He), normalisation layers and residual connections fixed it.", ["Derivative ≤ 0.25, saturation", "Multiplicative shrinkage through depth", "ReLU, He/Xavier init", "Normalisation and residual connections"]),
  iq("A model outputs probabilities that don't sum to 1 across 5 mutually exclusive classes. What's wrong?", "It's using independent sigmoids (multi-label set-up) or no output activation instead of softmax. For mutually exclusive classes use K logits with softmax and categorical cross-entropy (passing logits to the fused loss).", ["Identify sigmoid vs softmax mix-up", "Mutually exclusive → softmax + CE", "Pass logits to fused loss"]),
  iq("Estimate the parameters of an MLP 1000 → 500 → 500 → 10 and say whether parameter count or activation memory dominates training at batch size 4096.", "Params ≈ 1000·500 + 500 + 500·500 + 500 + 500·10 + 10 = 756,010 (~3 MB in fp32, ~12 MB with Adam state). Activations per example ≈ 500 + 500 + 10 values per layer output (plus pre-activations), ~2,000 floats, × 4096 ≈ 8 million floats ≈ 33 MB. At this batch size activations are comparable to or larger than the weight-related memory.", ["Correct parameter count (~756K)", "Weight + optimiser memory estimate", "Activation memory ∝ batch", "Comparison and conclusion"]),
]);

// ───────────────────────── Training deep nets (part 1) ─────────────────────────

L("dl-init", TD, "Weight initialisation", "Why zero init fails, and how Xavier and He scale random weights to keep signals stable through depth.", {
  kind: "concept", mins: 20, prereq: ["dl-backprop"],
  hook: "Initialise every weight to 0 and the network trains, but every hidden unit stays identical forever. Why?",
  intuition: `
**The situation.** Before the first gradient step, the weights decide whether signals and gradients survive a forward and backward pass through dozens of layers.

**Two failure modes.**

- **Symmetry.** If all weights in a layer start equal (e.g. 0), every unit computes the same thing and receives the same gradient, so they stay identical: a 512-unit layer behaves like one unit. Random initialisation breaks the symmetry.
- **Scale.** Each layer sums $n$ inputs. With weights too large, activations (and gradients) grow layer by layer and explode; too small and they shrink to nothing. The right scale keeps the variance of activations roughly constant from layer to layer.

**The rules.** Choose the weight variance from the number of inputs (fan-in): about $1/n$ for tanh/linear (Xavier/Glorot, which also averages in fan-out) and $2/n$ for ReLU (He), because ReLU zeroes half of its inputs.
`,
  maths: `
**In one breath.** For $y = \\sum_{i=1}^{n} w_ix_i$ with independent zero-mean terms, $\\text{Var}(y) = n\\,\\text{Var}(w)\\,\\text{Var}(x)$; keep it equal to $\\text{Var}(x)$ by $\\text{Var}(w) = 1/n$ (linear/tanh), $2/n_{in}$ for ReLU (He), $2/(n_{in} + n_{out})$ (Xavier, balancing forward and backward).

**Worked examples.**

- He normal, fan-in 512: std $= \\sqrt{2/512} = 0.0625$.
- Xavier uniform $U(-a, a)$ with $a = \\sqrt{6/(n_{in} + n_{out})}$: for 256 → 256, $a = \\sqrt{6/512} = 0.108$.
- Unit-variance inputs, fan-in 1,000, weights with variance $1/1000$: output variance ≈ 1. With variance 0.01 instead: ≈ 10 per layer, so $10^{20}$ after 20 layers.

**Why the factor 2 for ReLU.** ReLU outputs zero for half its inputs, which halves the second moment; doubling the weight variance compensates.

| Scheme | Var(w) | Use with |
|---|---|---|
| Xavier / Glorot | $2/(n_{in} + n_{out})$ | tanh, sigmoid, linear |
| He / Kaiming | $2/n_{in}$ | ReLU, Leaky ReLU (adjusted) |
| Small normal (0.02) | 0.0004 | transformers (with normalisation and scaled residuals) |

**Biases** usually start at 0 (sometimes a small positive value for ReLU, or 1 for LSTM forget gates).
`,
  practice: `
**Defaults.** Frameworks already use sensible defaults (PyTorch's Linear/Conv use a Kaiming-uniform variant). Override when you change activations, build very deep stacks, or implement architectures from papers (e.g. zero-initialising the last layer of each residual branch so blocks start as identity).

**Check it.** Log the mean and standard deviation of each layer's activations at initialisation on a batch; they should stay roughly constant through depth.
`,
  traps: [
    { trap: "Zero initialisation is fine because gradients will move the weights.", why: "All units in a layer get identical gradients and stay identical forever, so the layer has the capacity of one unit. Biases can be zero; weights can't all be equal." },
    { trap: "Any small random numbers will do.", why: "The scale must match fan-in: too small vanishes, too big explodes, and the effect compounds with depth. Use Xavier/He." },
    { trap: "With batch norm, initialisation doesn't matter at all.", why: "Normalisation makes training far less sensitive, but symmetry still has to be broken, and residual/transformer models still use specific init tricks for stability." },
  ],
  say: {
    prompt: "Why does weight initialisation matter, and what are Xavier and He initialisation?",
    secs: 45,
    check: ["Symmetry breaking: equal weights → identical units", "Variance preservation: Var(y) = n·Var(w)·Var(x)", "Xavier: 2/(fan_in + fan_out) for tanh/linear", "He: 2/fan_in for ReLU (ReLU halves the variance)", "Too small → vanishing, too large → exploding, compounding with depth"],
    followups: [
      { q: "Why does He initialisation use 2/n instead of 1/n?", a: "ReLU zeroes negative inputs, halving the second moment of the activations; doubling the weight variance keeps the signal's variance constant from layer to layer." },
      { q: "Can biases be initialised to zero?", a: "Yes. Symmetry is broken by random weights; zero biases are standard. LSTM forget-gate biases are often set to 1 so the cell remembers by default." },
      { q: "Why zero-initialise the last layer of a residual block?", a: "Then each block starts as the identity mapping, so a very deep network begins as a shallow one and trains stably." },
    ],
    answer: `Initialisation has two jobs. First, break symmetry: if all weights in a layer are equal, every unit gets the same gradient and they stay identical, so we use random values. Second, keep the scale right: each layer sums n inputs, so the output variance is n times the weight variance times the input variance. If that product isn't about 1, activations and gradients grow or shrink geometrically with depth.

Xavier initialisation sets the weight variance to 2 over fan-in plus fan-out, which suits tanh and linear layers. He initialisation uses 2 over fan-in for ReLU, because ReLU discards half the signal. Normalisation layers reduce the sensitivity, but deep residual and transformer models still rely on careful initialisation for stable training.`,
    avoid: ["\u201cInitialise to zero and let training fix it\u201d", "Not linking the variance to fan-in"],
  },
  terms: [["Fan-in / fan-out", "Number of inputs / outputs of a unit or layer."], ["Xavier (Glorot)", "Var(w) = 2/(fan_in + fan_out)."], ["He (Kaiming)", "Var(w) = 2/fan_in, for ReLU."]],
  sources: [D.he, D.csNN2],
});
Q({ id: "dl-init-1", d: 1, secs: 30, prompt: "He normal initialisation with fan-in 512. Standard deviation of the weights? (4 decimals)", answer: 0.0625, tol: 0.0002, explain: "√(2/512) = 0.0625.", py: "answer = (2/512)**0.5" });
Q({ id: "dl-init-2", d: 2, secs: 45, prompt: "Xavier uniform for a 256 → 256 layer: the weights are U(−a, a). a? (3 decimals)", answer: 0.108, tol: 0.002, explain: "a = √(6/(256 + 256)) = 0.108.", py: "answer = (6/512)**0.5" });
Q({ id: "dl-init-3", d: 3, secs: 120, prompt: "Simulate 20 linear layers of width 1,000 with unit-variance input and weight variance 1/1000. Final activation variance is closest to…", options: ["≈ 0", "≈ 1", "≈ 20", "≈ 10²⁰"], answer: 1, explain: "Var(w)·n = 1 keeps variance constant layer to layer.", py: "import numpy as np\nrng = np.random.default_rng(0)\nx = rng.normal(size=(200,1000))\nfor _ in range(20):\n    x = x @ rng.normal(0, (1/1000)**0.5, size=(1000,1000))\nv = x.var()\nanswer = [0, 1, 20, 1e20].index(min([0, 1, 20, 1e20], key=lambda c: abs(np.log10(v+1e-30) - np.log10(c+1e-30))))", packages: ["numpy"] });
Q({ id: "dl-init-4", d: 1, secs: 30, prompt: "All weights in a hidden layer start at exactly 0.5. After training, the hidden units are…", options: ["diverse, like random init", "identical to each other", "all dead", "random"], answer: 1, explain: "Identical weights receive identical gradients, so the units never differentiate.", py: "answer = 1" });
C("dl-init-c1", "Variance rule", "Var(y) = n·Var(w)·Var(x); choose Var(w) ≈ 1/n (Xavier) or 2/n (He, ReLU).");

L("dl-vanishing", TD, "Vanishing and exploding gradients", "Why gradients shrink or blow up through depth and time, and the toolbox that fixes it.", {
  kind: "concept", mins: 25, prereq: ["dl-init", "dl-activations"],
  hook: "Your first layers' weights barely change while the last layer learns fine. Where did the gradient go?",
  intuition: `
**The situation.** Backprop multiplies the gradient by one Jacobian per layer (or per time step in an RNN). A product of many factors tends to shrink towards 0 or blow up, unless each factor is close to 1 in size.

- **Vanishing:** factors < 1 (saturated sigmoids, small weights). Early layers get tiny gradients and learn nothing; RNNs forget long-range dependencies.
- **Exploding:** factors > 1 (large weights, long sequences). Updates become huge, loss spikes, NaNs appear.

**The fixes all aim to keep each factor near 1:** ReLU-family activations (slope 1), Xavier/He initialisation, normalisation layers, **residual connections** (an identity path whose Jacobian is exactly I), gating in LSTMs/GRUs, and **gradient clipping** for explosions.
`,
  maths: `
**In one breath.** $\\dfrac{\\partial L}{\\partial h^{(1)}} = \\dfrac{\\partial L}{\\partial h^{(L)}}\\prod_{l=2}^{L}\\dfrac{\\partial h^{(l)}}{\\partial h^{(l-1)}}$; if each factor has norm $\\approx \\gamma$, the gradient scales like $\\gamma^{L}$.

**Worked examples.** $\\gamma = 0.5$ over 20 layers: $0.5^{20} \\approx 9.5 \\times 10^{-7}$. $\\gamma = 1.1$ over 50 steps: $1.1^{50} \\approx 117$.

**Residual connections.** $h^{(l)} = h^{(l-1)} + F(h^{(l-1)})$ gives $\\partial h^{(l)}/\\partial h^{(l-1)} = I + \\partial F/\\partial h$: the identity term gives gradients a path that doesn't shrink.

**Gradient clipping by norm.** If $\\|g\\| > c$, rescale $g \\leftarrow c\\,g/\\|g\\|$. Direction unchanged, size capped. Example: $g = (3, 4)$, $c = 1$ → $(0.6, 0.8)$.

**RNNs.** The same recurrent matrix $W$ is multiplied at each step, so the behaviour is governed by its largest singular value: below 1 → vanishing, above 1 → exploding. LSTMs add an additive cell-state path (like a residual through time).

| Symptom | Likely cause | Fix |
|---|---|---|
| Early-layer gradient norms ≪ late layers | vanishing | ReLU, He init, normalisation, residuals |
| Loss spikes / NaN | exploding | gradient clipping, lower LR, warm-up, normalisation |
| RNN ignores long context | vanishing through time | LSTM/GRU, attention, truncated BPTT |
`,
  practice: `
**Monitor.** Log per-layer gradient norms (and update/weight ratios ≈ 1e-3 is healthy). Watch for spikes.

**Defaults.** Clip global gradient norm at 1.0 for transformers and RNNs; use warm-up for the learning rate; pre-norm transformer blocks (normalise before each sub-layer) for stability.
`,
  traps: [
    { trap: "Increase the learning rate to fix vanishing gradients.", why: "A bigger learning rate scales all updates, blowing up the layers that already had healthy gradients, and doesn't fix the shrinking product. Fix the factors (activations, init, normalisation, residuals)." },
    { trap: "Gradient clipping fixes vanishing gradients too.", why: "Clipping only caps large gradients. It does nothing for gradients that are too small." },
    { trap: "Residual connections are just for making networks deeper.", why: "Their main effect is on optimisation: the identity path keeps gradients flowing, which is why deeper nets become trainable." },
  ],
  say: {
    prompt: "What causes vanishing and exploding gradients, and how do you deal with each?",
    secs: 60,
    check: ["Gradient = product of per-layer (or per-step) Jacobians; scales like γᴸ", "Vanishing: saturating activations, small weights, long RNNs", "Exploding: large weights/long sequences → spikes/NaN", "Fixes: ReLU, He/Xavier init, normalisation, residual connections, LSTM/GRU", "Gradient clipping for exploding; monitor gradient norms"],
    followups: [
      { q: "Why do residual connections help?", a: "The Jacobian of h + F(h) is I + ∂F/∂h, so there's always an identity path for the gradient: it can't vanish just because F's Jacobian is small." },
      { q: "Clip by value or by norm?", a: "Usually by global norm: it rescales the whole gradient vector, preserving its direction. Clipping each element by value changes the direction." },
      { q: "How do LSTMs mitigate vanishing gradients?", a: "Their cell state is updated additively, gated by the forget gate; when the forget gate is near 1, the gradient flows across many steps nearly unchanged." },
    ],
    answer: `Backprop multiplies the gradient by one Jacobian per layer, or per time step in an RNN, so the gradient at early layers is a long product. If those factors are typically smaller than one, from saturated sigmoids or small weights, the product shrinks exponentially and early layers stop learning; if larger than one, it blows up and the loss spikes or goes NaN.

For vanishing gradients I'd use ReLU-family activations, He or Xavier initialisation, normalisation layers and residual connections, which add an identity path, and LSTMs or GRUs or attention for sequences. For exploding gradients I'd clip the global gradient norm, lower the learning rate or add warm-up. Either way I'd log per-layer gradient norms to see which one I have.`,
    avoid: ["\u201cRaise the learning rate\u201d for vanishing gradients", "Saying clipping fixes vanishing gradients"],
  },
  terms: [["Vanishing gradient", "Gradients shrink exponentially with depth/time."], ["Exploding gradient", "Gradients grow exponentially; unstable updates."], ["Gradient clipping", "Rescale the gradient when its norm exceeds a threshold."], ["Residual connection", "h + F(h): identity path for signal and gradient."]],
  sources: [D.pascanu, D.resnet, D.csNN3],
});
Q({ id: "dl-van-1", d: 1, secs: 30, prompt: "Each of 20 layers scales the gradient by 0.5. Overall factor? (scientific: give the value × 10⁷, 2 decimals)", answer: 9.54, tol: 0.01, explain: "0.5²⁰ = 9.54 × 10⁻⁷.", py: "answer = 0.5**20 * 1e7" });
Q({ id: "dl-van-2", d: 1, secs: 30, prompt: "Each of 50 RNN steps scales the gradient by 1.1. Overall factor? (1 decimal)", answer: 117.4, tol: 0.2, explain: "1.1⁵⁰ ≈ 117.4.", py: "answer = 1.1**50" });
Q({ id: "dl-van-3", d: 2, secs: 45, prompt: "Gradient g = (3, 4), clip global norm to 1. First component after clipping?", answer: 0.6, tol: 0.002, explain: "‖g‖ = 5 > 1, so g × 1/5 = (0.6, 0.8).", py: "import numpy as np\ng = np.array([3,4.]); c = 1.0\nn = np.linalg.norm(g)\nif n > c:\n    g = g*c/n\nanswer = float(g[0])", packages: ["numpy"] });
Q({ id: "dl-van-4", d: 1, secs: 30, prompt: "Which does NOT help with vanishing gradients?", options: ["Residual connections", "He initialisation with ReLU", "Gradient clipping", "Batch/layer normalisation"], answer: 2, explain: "Clipping only limits large gradients.", py: "answer = 2" });
C("dl-van-c1", "Gradient through depth", "Product of Jacobians ≈ γᴸ: γ < 1 vanishes, γ > 1 explodes.");
C("dl-van-c2", "Clip by norm", "If ‖g‖ > c: g ← c·g/‖g‖ (direction kept).");

L("dl-norm", TD, "BatchNorm, LayerNorm and RMSNorm", "What each normalises over, train vs eval behaviour, and why transformers use LayerNorm/RMSNorm.", {
  kind: "concept", mins: 25, prereq: ["dl-vanishing"],
  hook: "Your CNN scores 92% in training mode and 60% after model.eval(). Which layer behaves differently?",
  intuition: `
**The situation.** As weights change, the distribution of each layer's inputs shifts, and very deep networks become hard to optimise. Normalisation layers rescale activations to a standard range at every layer, which allows higher learning rates and smoother training.

**The idea: subtract a mean, divide by a standard deviation, then let the network rescale with learned $\\gamma$, $\\beta$.** The variants differ in *what* they average over.

- **BatchNorm:** per feature/channel, averaged over the **batch** (and spatial positions). Needs reasonably large batches; behaves differently in training (batch statistics) and evaluation (running averages). Standard in CNNs.
- **LayerNorm:** per example, averaged over the **features**. No dependence on batch size, same in training and inference. Standard in transformers and RNNs.
- **RMSNorm:** LayerNorm without subtracting the mean: divide by the root-mean-square only. Cheaper, works as well; used in most recent LLMs.
`,
  maths: `
**In one breath.** $\\hat x = \\dfrac{x - \\mu}{\\sqrt{\\sigma^2 + \\epsilon}}$, $y = \\gamma\\hat x + \\beta$; BatchNorm takes $\\mu, \\sigma^2$ over the batch per feature; LayerNorm over the features per example; RMSNorm uses $y = \\gamma\\,x/\\sqrt{\\text{mean}(x^2) + \\epsilon}$.

**Worked examples.**

- BatchNorm on a batch of one feature $(1, 2, 3, 4)$ ($\\epsilon = 0$): $\\mu = 2.5$, $\\sigma^2 = 1.25$; the value 4 becomes $1.5/\\sqrt{1.25} = 1.342$.
- RMSNorm of $(3, 4)$: RMS $= \\sqrt{12.5} = 3.536$, output $(0.849, 1.131)$ before $\\gamma$.
- LayerNorm over $d = 512$ features has $2 \\times 512 = 1024$ learnable parameters ($\\gamma$ and $\\beta$); RMSNorm has 512.

**Train vs eval (BatchNorm).** Training uses the current batch's statistics and updates running averages; \`model.eval()\` switches to the running averages. Forgetting \`eval()\`, tiny batches, or a train/test distribution shift make BatchNorm misbehave.

| | BatchNorm | LayerNorm | RMSNorm |
|---|---|---|---|
| Statistics over | batch (+ spatial), per channel | features, per example | features, per example (no mean) |
| Batch-size dependent | yes | no | no |
| Train ≠ eval | yes (running stats) | no | no |
| Typical use | CNNs | transformers, RNNs | modern LLMs |

**Pre-norm vs post-norm transformers.** Pre-norm ($x + F(\\text{Norm}(x))$) keeps a clean residual path and trains deep stacks stably; post-norm (the original) can give slightly better results but needs warm-up and care.
`,
  practice: `
**Defaults.** CNNs: Conv → BatchNorm → ReLU, batch ≥ 16–32 per device (or GroupNorm for tiny batches). Transformers: pre-norm with LayerNorm or RMSNorm.

**Bugs.** Not calling \`model.eval()\` at inference; batch size 1 in training with BatchNorm; freezing a pretrained CNN but leaving BatchNorm in train mode (running stats drift); applying weight decay to normalisation $\\gamma$/$\\beta$ (usually excluded).
`,
  traps: [
    { trap: "BatchNorm works because it removes internal covariate shift.", why: "That was the original motivation, but later work suggests the main benefit is a smoother optimisation landscape allowing larger learning rates. Say 'it stabilises and speeds up training' and mention the debate." },
    { trap: "LayerNorm and BatchNorm are interchangeable.", why: "BatchNorm's batch statistics break with small or variable batches and sequence padding, which is why transformers use LayerNorm/RMSNorm." },
    { trap: "Normalisation layers don't affect inference.", why: "BatchNorm uses running statistics at inference; if they're stale or never set (no eval()), predictions change dramatically." },
  ],
  say: {
    prompt: "Compare batch normalisation and layer normalisation. Why do transformers use LayerNorm?",
    secs: 60,
    check: ["Both normalise then apply learned γ, β", "BatchNorm: statistics over the batch per feature; running averages at eval", "LayerNorm: over features per example; batch-independent; same at train and eval", "Transformers: variable lengths, small/sequential batches → LayerNorm/RMSNorm", "RMSNorm: no mean subtraction; pre-norm for stability"],
    followups: [
      { q: "What goes wrong with BatchNorm at batch size 2?", a: "The batch mean and variance are extremely noisy estimates, so the normalisation is erratic and running statistics are poor. Use GroupNorm/LayerNorm or larger effective batches (synced BatchNorm)." },
      { q: "What is RMSNorm and why use it?", a: "LayerNorm without mean-centring: divide by the root-mean-square of the features and scale by γ. It's cheaper and performs as well in transformers." },
      { q: "Why does BatchNorm act as a regulariser?", a: "Each example's normalisation depends on the other examples in its batch, which injects noise during training, similar in effect to dropout." },
    ],
    answer: `Both subtract a mean, divide by a standard deviation and then apply a learned scale and shift; they differ in what they average over. BatchNorm computes statistics per feature across the batch, so during training it depends on the batch and at inference it switches to running averages, which is a classic source of bugs. LayerNorm computes statistics per example across its features, so it's independent of batch size and behaves identically in training and inference.

Transformers process variable-length sequences with padding and often small per-device batches, and they need the same behaviour at generation time, so LayerNorm fits; most recent LLMs use RMSNorm, which drops the mean subtraction for efficiency, in a pre-norm arrangement for stable training of deep stacks.`,
    avoid: ["\u201cThey're the same thing\u201d", "Stating covariate shift as settled fact"],
  },
  terms: [["BatchNorm", "Normalise each feature with batch statistics; running averages at eval."], ["LayerNorm", "Normalise each example across its features."], ["RMSNorm", "Divide by root-mean-square; no centring."], ["Pre-norm", "x + F(Norm(x)) in residual blocks."]],
  sources: [D.bn, D.ln, D.rms],
});
Q({ id: "dl-norm-1", d: 2, secs: 60, prompt: "BatchNorm (ε = 0, γ = 1, β = 0) on a batch with feature values (1, 2, 3, 4). Output for the value 4? (3 decimals)", answer: 1.342, tol: 0.002, explain: "μ = 2.5, σ² = 1.25 (population variance); (4 − 2.5)/√1.25 = 1.342.", py: "import numpy as np\nx = np.array([1,2,3,4.])\nanswer = float((x[3]-x.mean())/np.sqrt(x.var()))", packages: ["numpy"] });
Q({ id: "dl-norm-2", d: 2, secs: 45, prompt: "RMSNorm (γ = 1, ε = 0) of the vector (3, 4). First output component? (3 decimals)", answer: 0.849, tol: 0.002, explain: "RMS = √((9 + 16)/2) = 3.536; 3/3.536 = 0.849.", py: "import numpy as np\nx = np.array([3,4.])\nanswer = float(x[0]/np.sqrt((x**2).mean()))", packages: ["numpy"] });
Q({ id: "dl-norm-3", d: 1, secs: 30, prompt: "Learnable parameters in a LayerNorm over 512 features (γ and β)?", answer: 1024, tol: 0.5, explain: "512 scales + 512 shifts.", py: "answer = 2*512" });
Q({ id: "dl-norm-4", d: 1, secs: 30, prompt: "At inference after model.eval(), BatchNorm normalises using…", options: ["the current test batch's statistics", "running averages collected during training", "per-example statistics", "no normalisation"], answer: 1, explain: "eval() switches to the running mean and variance.", py: "answer = 1" });
C("dl-norm-c1", "BatchNorm vs LayerNorm", "BN: over batch per feature, running stats at eval. LN: over features per example, same in train/eval.");
C("dl-norm-c2", "RMSNorm", "y = γ·x/√(mean(x²) + ε): LayerNorm without centring.");

L("dl-optimisers", TD, "Optimisers: SGD, momentum, Adam and AdamW", "How each update rule works, what problem it solves, and the defaults to quote.", {
  kind: "concept", mins: 30, prereq: ["dl-backprop"],
  hook: "Adam converges fast on your transformer, but SGD with momentum gives the best ResNet. What's different about the updates?",
  intuition: `
**The situation.** Gradient descent says "step downhill". Real loss surfaces are noisy (mini-batches), have narrow ravines (directions with very different curvature) and plateaus. Optimisers modify the raw gradient step to cope.

- **SGD:** step along the mini-batch gradient. Simple, noisy, and the noise helps generalisation.
- **Momentum:** keep a running velocity of past gradients. Speeds up along consistent directions and damps zig-zagging across ravines.
- **RMSProp / Adam:** divide each parameter's step by a running estimate of its gradient's size, so every parameter moves at a similar pace regardless of gradient scale. Adam adds momentum and a bias correction for the first steps.
- **AdamW:** Adam with weight decay applied directly to the weights rather than mixed into the adaptive gradient. Standard for transformers.

**Play.** On a simple bowl, the learning rate alone decides between crawling, converging and diverging. Optimisers are ways of choosing a better step for every direction.
`,
  widget: "gradient-descent",
  maths: `
**In one breath.** SGD $w \\leftarrow w - \\eta g$; momentum $v \\leftarrow \\beta v + g$, $w \\leftarrow w - \\eta v$; Adam $m \\leftarrow \\beta_1 m + (1 - \\beta_1)g$, $v \\leftarrow \\beta_2 v + (1 - \\beta_2)g^2$, $\\hat m = m/(1 - \\beta_1^t)$, $\\hat v = v/(1 - \\beta_2^t)$, $w \\leftarrow w - \\eta\\,\\hat m/(\\sqrt{\\hat v} + \\epsilon)$; AdamW adds $-\\eta\\lambda w$ separately.

**Worked examples.**

- Momentum with $\\beta = 0.9$ and gradients 1, 1: $v = 1$, then $v = 1.9$; with a constant gradient $v$ approaches $1/(1 - \\beta) = 10$: momentum effectively multiplies the learning rate by up to 10 in consistent directions.
- Adam's first step: $\\hat m = g$, $\\hat v = g^2$, so the step is $\\eta\\,g/|g| = \\eta \\cdot \\text{sign}(g)$, whatever the gradient's size (e.g. $\\eta = 0.001$ → step 0.001).
- Without bias correction at $t = 1$, $v = 0.001g^2$ would be 1000× too small; the correction factor $1/(1 - 0.999)$ is 1000.

**Why AdamW.** L2 regularisation adds $\\lambda w$ to the gradient, which Adam then divides by $\\sqrt{\\hat v}$: parameters with large gradients get less decay than intended. AdamW decays weights directly, so the regularisation strength is what you set.

| Optimiser | Memory per param | Strengths | Typical use |
|---|---|---|---|
| SGD + momentum | 1 extra | good generalisation, simple | CNNs (with schedule) |
| Adam | 2 extra | fast, robust to scale, little tuning | default for prototyping |
| AdamW | 2 extra | correct decoupled weight decay | transformers, LLMs |

**Defaults.** Adam(W): $\\beta_1 = 0.9$, $\\beta_2 = 0.999$ (0.95 for large LLMs), $\\epsilon = 10^{-8}$, lr $10^{-4}$–$10^{-3}$, weight decay 0.01–0.1. SGD: momentum 0.9, lr 0.1 for ResNets with batch 256, with a schedule.
`,
  practice: `
**Choosing.** Start with AdamW and a warm-up + cosine schedule. For CNNs on vision benchmarks, tuned SGD + momentum often generalises slightly better. Very large-batch training uses layer-wise variants (LARS/LAMB).

**Diagnose with the update/weight ratio** (‖η·update‖ / ‖w‖ ≈ 1e-3 per step is a healthy rule of thumb).
`,
  traps: [
    { trap: "Adam doesn't need a learning rate schedule.", why: "Adam adapts per-parameter scale, but the global learning rate still matters: warm-up and decay improve stability and final accuracy, especially for transformers." },
    { trap: "Adam with L2 regularisation is the same as AdamW.", why: "With Adam, an L2 term in the gradient gets divided by the adaptive denominator, so decay varies by parameter. AdamW applies decay directly to weights, which works as intended." },
    { trap: "Momentum just makes training faster.", why: "It also changes the path: it damps oscillations across steep directions and helps cross small bumps. Too much momentum with a high learning rate overshoots." },
  ],
  say: {
    prompt: "Walk me through SGD, momentum and Adam, and explain why AdamW exists.",
    secs: 60,
    check: ["SGD: mini-batch gradient step; noise", "Momentum: velocity accumulates consistent directions, damps oscillation", "Adam: per-parameter step from running first and second moments; bias correction", "AdamW: decoupled weight decay vs L2 in the gradient", "Defaults / when SGD vs Adam; schedules still matter"],
    followups: [
      { q: "Why does Adam need bias correction?", a: "m and v start at zero, so early moving averages are biased towards zero (by factors 1 − β₁ᵗ, 1 − β₂ᵗ). Dividing by those factors corrects the first steps; otherwise the effective learning rate would be wrong early on." },
      { q: "Why might SGD generalise better than Adam?", a: "One argument: SGD's noise and uniform scaling bias it towards flatter minima, while Adam's per-parameter scaling can converge to sharper ones. In practice the gap depends on tuning and weight decay; AdamW narrows it." },
      { q: "What does β₂ = 0.95 instead of 0.999 do?", a: "A shorter memory for squared gradients, so the denominator reacts faster to gradient spikes. Large LLM runs use it for stability." },
    ],
    answer: `Plain SGD steps along the mini-batch gradient; it's noisy but that noise often helps generalisation. Momentum keeps a velocity, a running sum of past gradients, so steps grow along directions that are consistently downhill and oscillations across steep directions cancel out.

Adam keeps running averages of the gradient and of the squared gradient for each parameter, bias-corrects them because they start at zero, and divides one by the square root of the other, so each parameter takes a step of roughly the learning rate regardless of its gradient's scale. AdamW exists because adding L2 regularisation to Adam's gradient gets rescaled by that denominator, so heavily updated parameters are decayed less; AdamW applies weight decay directly to the weights instead. I'd default to AdamW with warm-up and cosine decay, and try SGD with momentum for CNNs.`,
    avoid: ["\u201cAdam needs no tuning\u201d", "Equating AdamW with Adam + L2"],
  },
  terms: [["Momentum", "Velocity v = βv + g used for the step."], ["Adam", "Adaptive moments: m̂/(√v̂ + ε) step."], ["Bias correction", "Divide by 1 − βᵗ to undo zero-initialised averages."], ["AdamW", "Adam with decoupled weight decay."]],
  sources: [D.adam, D.adamw, D.csNN3],
});
Q({ id: "dl-opt-1", d: 1, secs: 45, prompt: "Momentum v ← 0.9v + g, starting at v = 0. Gradients are 1 then 1. Value of v after the second step?", answer: 1.9, tol: 0.002, explain: "v = 1, then 0.9 + 1 = 1.9.", py: "v = 0.0\nfor g in [1, 1]:\n    v = 0.9*v + g\nanswer = v" });
Q({ id: "dl-opt-2", d: 2, secs: 60, prompt: "Adam, learning rate 0.001, β₁ = 0.9, β₂ = 0.999, ε = 1e−8. First-step gradient 0.5. Size of the first update? (4 decimals)", answer: 0.001, tol: 0.00002, explain: "m̂ = 0.5, v̂ = 0.25, step = 0.001 × 0.5/0.5 ≈ 0.001: about η·sign(g).", py: "g, lr, b1, b2, eps = 0.5, 1e-3, 0.9, 0.999, 1e-8\nm = (1-b1)*g; v = (1-b2)*g*g\nmh = m/(1-b1); vh = v/(1-b2)\nanswer = lr*mh/(vh**0.5+eps)" });
Q({ id: "dl-opt-3", d: 2, secs: 45, prompt: "With β = 0.9 and a constant gradient, momentum's velocity approaches what multiple of the gradient?", answer: 10, tol: 0.05, explain: "Geometric series 1/(1 − β) = 10.", py: "v = 0.0\nfor _ in range(500):\n    v = 0.9*v + 1\nanswer = v" });
Q({ id: "dl-opt-4", d: 2, secs: 45, prompt: "Adam keeps two fp32 state values per parameter. Optimiser-state memory for a 1B-parameter model, in GB (10⁹ bytes)?", answer: 8, tol: 0.05, explain: "2 × 4 bytes × 10⁹ = 8 GB.", py: "answer = 2*4*1e9/1e9" });
C("dl-opt-c1", "Adam update", "m̂/(√v̂ + ε) with bias-corrected moments; first step ≈ η·sign(g).");
C("dl-opt-c2", "AdamW vs Adam + L2", "AdamW decays weights directly; L2-in-gradient gets rescaled by Adam's denominator.");
