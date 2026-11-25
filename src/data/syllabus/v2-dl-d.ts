/**
 * v2 Deep learning, part D: Attention and transformers.
 */
import { iq, lessonWriter } from "./v2-shared";
import { D } from "./v2-dl-sources";

const { L, Q, C } = lessonWriter("dl");
const AT = "Attention and transformers";

L("dl-self-attention", AT, "Self-attention (Q, K, V)", "Every token looks at every other token: queries, keys, values, and why scores are divided by √d.", {
  kind: "concept", mins: 25, prereq: ["dl-seq2seq", "dl-output-loss"],
  hook: "In 'The animal didn't cross the road because it was tired', how does the model work out what 'it' refers to, in one layer, without reading left to right?",
  intuition: `
**The situation.** RNNs pass information step by step, so linking distant words takes many steps. Seq2seq attention let a decoder look back at the encoder. **Self-attention** lets every token in a sequence look at every other token directly, in one parallel operation.

**The idea.** Each token produces three vectors by learned linear maps:

- a **query**: "what am I looking for?",
- a **key**: "what do I contain?",
- a **value**: "what will I pass on if you attend to me?".

A token's query is compared (dot product) with every key; the scores go through softmax to become weights; the token's new representation is the weighted average of all values. "it" can put high weight on "animal" because their query and key match, regardless of distance.

**Why divide by √d.** Dot products of $d$-dimensional vectors grow in size with $d$. Large scores make softmax nearly one-hot, with tiny gradients. Dividing by $\\sqrt{d}$ keeps scores at a sensible scale.
`,
  maths: `
**In one breath.** $Q = XW_Q$, $K = XW_K$, $V = XW_V$; $\\text{Attention}(Q, K, V) = \\text{softmax}\\!\\left(\\dfrac{QK^\\top}{\\sqrt{d_k}}\\right)V$; cost $O(n^2d)$ time and $O(n^2)$ memory for the score matrix.

**Why √d.** If $q$ and $k$ have independent components with mean 0 and variance 1, $q \\cdot k$ has variance $d_k$ (std $\\sqrt{d_k}$). With $d_k = 64$, raw scores have std 8; scaling brings them back to std 1.

**Worked example.** $q = (1, 2)$, $k = (3, 1)$, $d_k = 2$: scaled score $= 5/\\sqrt2 = 3.536$.

**Worked example (tiny attention).** Two tokens with scaled scores for token 1 of $(0, \\ln 3)$: weights $(0.25, 0.75)$. Values $v_1 = (1, 0)$, $v_2 = (0, 1)$ → output $(0.25, 0.75)$.

**Cost.** For $n = 4{,}096$ tokens, each head computes $n^2 \\approx 16.8$ million scores per layer. This quadratic term is why long contexts are expensive and why FlashAttention, sparse and linear attention exist.

| | RNN | Self-attention |
|---|---|---|
| Path length between distant tokens | O(n) | O(1) |
| Parallel over positions | no | yes |
| Cost per layer | O(n d²) | O(n² d) |
| Order awareness | built in | needs positional information |
`,
  practice: `
**Masks.** Padding masks (ignore pad tokens) and causal masks (a token can't see the future, for generation) are added to the scores as −∞ before softmax.

**In code.** \`torch.nn.functional.scaled_dot_product_attention\` picks fused kernels (FlashAttention) automatically.
`,
  traps: [
    { trap: "Q, K and V are three different inputs.", why: "In self-attention they're three learned projections of the same input sequence. In cross-attention, Q comes from one sequence and K, V from another." },
    { trap: "Scaling by √d is a minor numerical detail.", why: "Without it, scores grow with dimension, softmax saturates to near one-hot, and gradients vanish. It's what keeps training stable at large d." },
    { trap: "Self-attention knows word order.", why: "It's permutation-equivariant: shuffle the tokens and outputs shuffle the same way. Order comes only from positional encodings." },
  ],
  say: {
    prompt: "Explain self-attention, including what Q, K and V are and why we scale by √d.",
    secs: 60,
    check: ["Q, K, V are learned linear projections of each token", "Scores = QKᵀ, softmax → weights, output = weighted sum of V", "Every token attends to every token in parallel; O(1) path length", "√d scaling keeps score variance ~1 so softmax doesn't saturate", "O(n²) cost; masks; needs positional information"],
    followups: [
      { q: "Why does the dot product's variance grow with d?", a: "It's a sum of d products of independent unit-variance terms, so its variance is d; dividing by √d restores unit variance." },
      { q: "What's the difference between self-attention and cross-attention?", a: "Self-attention takes Q, K, V from the same sequence. Cross-attention takes queries from one sequence (e.g. decoder) and keys/values from another (e.g. encoder output or an image)." },
      { q: "Why is attention quadratic, and what's done about it?", a: "Every token scores every other token: an n×n matrix per head. FlashAttention avoids materialising it (memory), and sparse/sliding-window/linear attention reduce the compute." },
    ],
    answer: `Self-attention lets every token build its new representation from all the tokens in the sequence. Each token is projected three ways: a query for what it's looking for, a key for what it offers, and a value for what it passes on. We take dot products of each query with every key, divide by the square root of the key dimension, softmax across the sequence to get weights, and output the weighted sum of the values.

The √d scaling matters because dot products of d-dimensional vectors have variance proportional to d; without it the softmax saturates and gradients vanish. The result connects any two positions in one step and parallelises across the sequence, at the cost of n-squared time and memory, and since it's order-agnostic it needs positional information added.`,
    avoid: ["\u201cQ, K, V are different inputs\u201d (in self-attention)", "Skipping why √d"],
  },
  terms: [["Query / key / value", "Learned projections: what I seek / what I offer / what I pass on."], ["Scaled dot-product attention", "softmax(QKᵀ/√d_k)V."], ["Causal mask", "Blocks attention to future positions."]],
  sources: [D.vaswani, D.d2l],
});
Q({ id: "dl-sa-1", d: 1, secs: 30, prompt: "q = (1, 2), k = (3, 1), d_k = 2. Scaled attention score? (3 decimals)", answer: 3.536, tol: 0.002, explain: "(3 + 2)/√2 = 3.536.", py: "import math\nanswer = (1*3 + 2*1)/math.sqrt(2)" });
Q({ id: "dl-sa-2", d: 2, secs: 60, prompt: "q and k have 64 independent N(0, 1) components. Standard deviation of q·k (estimate by simulation, nearest integer)?", answer: 8, tol: 0.4, explain: "Variance = d = 64, std = 8; dividing by √64 restores std 1.", py: "import numpy as np\nrng = np.random.default_rng(0)\nq = rng.normal(size=(200000,64)); k = rng.normal(size=(200000,64))\nanswer = float((q*k).sum(1).std())", packages: ["numpy"] });
Q({ id: "dl-sa-3", d: 2, secs: 60, prompt: "Token 1's scaled scores against tokens 1 and 2 are (0, ln 3). Values v₁ = (1, 0), v₂ = (0, 1). Second component of token 1's output?", answer: 0.75, tol: 0.002, explain: "Weights softmax(0, ln 3) = (0.25, 0.75); output = 0.25 v₁ + 0.75 v₂.", py: "import numpy as np\ns = np.array([0, np.log(3)]); w = np.exp(s)/np.exp(s).sum()\nV = np.array([[1,0],[0,1.]])\nanswer = float((w@V)[1])", packages: ["numpy"] });
Q({ id: "dl-sa-4", d: 1, secs: 30, prompt: "Sequence length 4,096. Attention scores per head per layer, in millions? (1 decimal)", answer: 16.8, tol: 0.1, explain: "4096² = 16.8M.", py: "answer = 4096**2/1e6" });
C("dl-sa-c1", "Scaled dot-product attention", "softmax(QKᵀ/√d_k)V.");
C("dl-sa-c2", "Why √d_k", "Var(q·k) = d_k; scaling keeps softmax out of saturation.");

L("dl-multihead", AT, "Multi-head attention", "Several attention patterns in parallel: head dimensions, parameter counts and what heads learn.", {
  kind: "concept", mins: 20, prereq: ["dl-self-attention"],
  hook: "A token needs to track its syntactic head, the entity it refers to, and the previous word, all at once. One softmax can only focus on one pattern. What's the fix?",
  intuition: `
**The situation.** A single attention distribution is one weighted average: it tends to focus on one kind of relationship. Language and images need many at once.

**The idea.** Split the model dimension into $h$ smaller **heads**. Each head has its own Q, K, V projections and computes attention independently, so different heads can specialise (one tracks the previous token, another subject–verb links, another coreference). The heads' outputs are concatenated and mixed by an output projection $W_O$.

Because each head works in dimension $d/h$, multi-head attention costs about the same as one big head but captures several patterns.

**What heads learn.** Interpretability work finds heads that copy the previous token, "induction heads" that complete repeated patterns, and heads aligned with syntax. Many heads can be pruned with little loss, a sign of redundancy.
`,
  maths: `
**In one breath.** $\\text{head}_i = \\text{Attention}(XW_Q^i, XW_K^i, XW_V^i)$, $\\text{MHA}(X) = \\text{Concat}(\\text{head}_1, \\dots, \\text{head}_h)W_O$; $d_{head} = d_{model}/h$; parameters $4d^2$ (+ $4d$ biases).

**Worked examples.**

- $d_{model} = 512$, $h = 8$ → $d_{head} = 64$.
- MHA parameters with biases, $d = 1024$: $4(d^2 + d) = 4{,}198{,}400$.
- Score memory: 8 heads × 2,048² positions ≈ 33.6 million entries per layer per sequence.

**Variants for inference efficiency.**

| Variant | Keys/values | Why |
|---|---|---|
| Multi-head (MHA) | one K, V per head | original |
| Multi-query (MQA) | one K, V shared by all heads | smaller KV cache, faster decoding |
| Grouped-query (GQA) | one K, V per group of heads | middle ground used by many LLMs |

(KV caching and these variants are covered in depth in the LLM track.)
`,
  practice: `
**Defaults.** $d_{head}$ of 64–128; number of heads = $d_{model}/d_{head}$. Keep $d_{model}$ divisible by $h$.

**Debugging.** Visualising attention maps per head is useful for sanity checks (e.g. causal mask working, padding ignored), less so as explanations.
`,
  traps: [
    { trap: "More heads always means more capacity and more cost.", why: "With d fixed, more heads means smaller heads; parameter count stays 4d². Too many tiny heads can hurt because each head's space gets too small." },
    { trap: "Each head sees a different part of the input sequence.", why: "Every head attends over the whole sequence; heads differ in their learned projections, i.e. which relationships they score highly." },
    { trap: "Attention heads are reliable explanations of model behaviour.", why: "Head patterns are suggestive, but many heads are redundant and the downstream MLPs do much of the work. Use proper interpretability methods for claims." },
  ],
  say: {
    prompt: "Why do transformers use multi-head attention instead of a single attention head?",
    secs: 45,
    check: ["One softmax ≈ one pattern; multiple heads capture several relationships", "Split d into h heads of size d/h; same cost as one big head", "Concatenate heads, output projection W_O", "Parameter count 4d² independent of h", "MQA/GQA variants for inference"],
    followups: [
      { q: "How many parameters in an MHA block with d = 512, ignoring biases?", a: "4 × 512² = 1,048,576 (Q, K, V and output projections)." },
      { q: "What is grouped-query attention?", a: "Several query heads share one key/value head, shrinking the KV cache and memory bandwidth during decoding with little quality loss; a compromise between multi-head and multi-query attention." },
      { q: "Does the number of heads change the cost?", a: "Roughly no for fixed d: the projections are still d×d; the attention score computation is h × n² × (d/h)." },
    ],
    answer: `A single attention head produces one softmax distribution per token, which tends to capture one kind of relationship. Multi-head attention splits the model dimension into several smaller heads, each with its own query, key and value projections, so different heads can learn different patterns, like the previous token, syntactic dependencies or coreference, in parallel. Their outputs are concatenated and mixed by an output projection.

Because each head works in d over h dimensions, the cost and the parameter count, four d squared for the projections, are about the same as one big head. For inference, variants like multi-query and grouped-query attention share keys and values across heads to shrink the KV cache.`,
    avoid: ["\u201cEach head looks at a different chunk of the sequence\u201d", "Claiming heads increase parameters"],
  },
  terms: [["Attention head", "One set of Q/K/V projections and its attention."], ["W_O", "Output projection mixing concatenated heads."], ["GQA / MQA", "Share K/V across groups of / all heads."]],
  sources: [D.vaswani, D.d2l],
});
Q({ id: "dl-mha-1", d: 1, secs: 20, prompt: "d_model = 512 with 8 heads. Dimension per head?", answer: 64, tol: 0.5, explain: "512/8.", py: "answer = 512//8" });
Q({ id: "dl-mha-2", d: 2, secs: 45, prompt: "Multi-head attention projections (Q, K, V, O) with biases, d_model = 1,024. Parameters?", answer: 4198400, tol: 0.5, explain: "4 × (1024² + 1024) = 4,198,400, independent of the number of heads.", py: "d = 1024\nanswer = 4*(d*d + d)" });
Q({ id: "dl-mha-3", d: 2, secs: 45, prompt: "8 heads, sequence length 2,048. Attention-score entries per layer per sequence, in millions? (1 decimal)", answer: 33.6, tol: 0.1, explain: "8 × 2048² = 33.55M.", py: "answer = 8*2048**2/1e6" });
Q({ id: "dl-mha-4", d: 1, secs: 30, prompt: "Doubling the number of heads at fixed d_model changes the projection parameter count by a factor of…", answer: 1, tol: 0.02, explain: "Projections stay d×d each; heads just split the dimension differently.", py: "d = 512\nanswer = (4*d*d)/(4*d*d)" });
C("dl-mha-c1", "MHA parameters", "4d² (+4d biases), independent of head count; d_head = d/h.");

L("dl-positional", AT, "Positional encodings, including RoPE", "Giving order-blind attention a sense of position: sinusoidal, learned, rotary and relative schemes.", {
  kind: "concept", mins: 25, prereq: ["dl-self-attention"],
  hook: "Shuffle the words of a sentence and plain self-attention produces the same set of outputs, just shuffled. Where does word order come from?",
  intuition: `
**The situation.** Self-attention treats its input as a set: it's permutation-equivariant. "Dog bites man" and "man bites dog" would look the same.

**The idea.** Inject position information.

- **Sinusoidal (original transformer):** add a fixed vector of sines and cosines at different frequencies to each token embedding. No parameters; each position gets a unique pattern, and relative offsets correspond to simple linear transformations.
- **Learned absolute:** a trainable vector per position (BERT, GPT-2). Simple, but can't go beyond the maximum length seen in training.
- **Relative / ALiBi:** bias attention scores by the distance between tokens, so the model reasons about "how far apart" rather than "where".
- **RoPE (rotary):** rotate query and key vectors by an angle proportional to position. The dot product between a query at position $m$ and a key at $n$ then depends only on $n - m$. Used by most modern LLMs (LLaMA family and others) and can be stretched to longer contexts with scaling tricks.
`,
  maths: `
**In one breath.** Sinusoidal: $PE(p, 2i) = \\sin(p/10000^{2i/d})$, $PE(p, 2i + 1) = \\cos(p/10000^{2i/d})$; RoPE rotates each 2-D pair of $q$, $k$ by angle $p\\theta_i$, so $\\langle R_mq, R_nk\\rangle = \\langle q, R_{n - m}k\\rangle$.

**Worked examples.**

- Sinusoidal, position 1, dimension 0: $\\sin(1) = 0.841$.
- RoPE in 2-D with $\\theta = 0.5$: $q = k = (1, 0)$ at positions $m = 2$, $n = 5$. Rotated dot product $= \\cos((5 - 2) \\times 0.5) = \\cos 1.5 = 0.071$. The same pair at positions 10 and 13 gives the same value: only the offset matters.
- Rotation preserves length, so RoPE doesn't change the size of $q$ or $k$.

| Scheme | Where added | Extrapolates beyond training length | Used in |
|---|---|---|---|
| Sinusoidal | added to embeddings | somewhat | original transformer |
| Learned absolute | added to embeddings | no | BERT, GPT-2 |
| ALiBi | bias on scores | yes (linear penalty) | some LLMs |
| RoPE | rotates q, k | with scaling (PI, NTK, YaRN) | most current LLMs |

**Context extension.** Models trained at 4k tokens can be extended to longer contexts by rescaling RoPE frequencies (position interpolation and variants) plus some fine-tuning (covered in the LLM track).
`,
  practice: `
**Defaults.** For new decoder models: RoPE. For classification encoders: learned absolute is fine. For vision transformers: learned or 2-D sinusoidal patch positions.

**Gotchas.** Learned positions break at longer lengths; changing the maximum sequence length of a pretrained model needs interpolation of positional embeddings (also done for ViTs at new resolutions).
`,
  traps: [
    { trap: "Transformers understand order because they process tokens in sequence.", why: "They process all tokens in parallel; without positional information the model can't tell orderings apart." },
    { trap: "RoPE adds a position vector to the embedding.", why: "It rotates queries and keys inside attention; nothing is added to the embeddings, and values aren't rotated." },
    { trap: "Learned positional embeddings generalise to any length.", why: "Positions beyond the training maximum have no trained embedding; that's a key reason relative schemes and RoPE are preferred for long contexts." },
  ],
  say: {
    prompt: "Why do transformers need positional encodings, and how does RoPE work?",
    secs: 45,
    check: ["Self-attention is permutation-equivariant (order-blind)", "Absolute: sinusoidal (fixed) or learned, added to embeddings", "Relative: bias by distance (ALiBi, relative)", "RoPE: rotate q and k by position-dependent angles → dot product depends on offset", "Length extrapolation / context extension issues"],
    followups: [
      { q: "Why do sinusoidal encodings use many frequencies?", a: "Low frequencies distinguish distant positions, high frequencies nearby ones, like the digits of a clock; together they give each position a unique, smoothly varying code." },
      { q: "Why does RoPE make attention depend on relative position?", a: "Rotating q by mθ and k by nθ makes their dot product equal q · R_{(n−m)θ} k: absolute angles cancel, leaving only the offset." },
      { q: "How do you extend a RoPE model's context window?", a: "Rescale positions or frequencies (position interpolation, NTK-aware scaling, YaRN) so longer positions map into the trained range, then fine-tune briefly on longer sequences." },
    ],
    answer: `Self-attention has no built-in notion of order: permuting the input just permutes the output, so the model would treat "dog bites man" and "man bites dog" the same. Positional encodings fix that. The original transformer added fixed sinusoids at many frequencies to the embeddings; BERT and GPT-2 learned a vector per position, which can't extend past the training length; relative schemes like ALiBi bias the attention scores by distance.

RoPE, used by most current LLMs, rotates each pair of dimensions in the query and key by an angle proportional to the token's position. The dot product between a query at m and a key at n then depends only on n minus m, so attention is naturally relative, lengths are preserved, and the context can be extended by rescaling the rotation frequencies.`,
    avoid: ["\u201cThe model reads tokens in order\u201d", "Saying RoPE adds a vector to embeddings"],
  },
  terms: [["Positional encoding", "Information about token position added to a transformer."], ["RoPE", "Rotary position embedding: rotate q, k by position."], ["ALiBi", "Linear distance penalty added to attention scores."]],
  sources: [D.vaswani, D.rope],
});
Q({ id: "dl-pos-1", d: 1, secs: 30, prompt: "Sinusoidal encoding, position 1, dimension 0: sin(1/10000⁰). Value? (3 decimals)", answer: 0.841, tol: 0.002, explain: "sin(1) = 0.841.", py: "import math\nanswer = math.sin(1/10000**0)" });
Q({ id: "dl-pos-2", d: 3, secs: 120, prompt: "2-D RoPE, θ = 0.5. q = k = (1, 0) placed at positions m = 2 and n = 5. Rotated dot product? (3 decimals)", answer: 0.071, tol: 0.002, explain: "Rotations by 1.0 and 2.5 rad: dot product = cos(2.5 − 1.0) = cos 1.5 = 0.071; depends only on the offset.", py: "import numpy as np\nR = lambda a: np.array([[np.cos(a), -np.sin(a)],[np.sin(a), np.cos(a)]])\nq = np.array([1,0.]); k = np.array([1,0.])\nanswer = float((R(2*0.5)@q) @ (R(5*0.5)@k))", packages: ["numpy"] });
Q({ id: "dl-pos-3", d: 2, secs: 60, prompt: "Same q, k and θ as before but at positions 10 and 13. Rotated dot product? (3 decimals)", answer: 0.071, tol: 0.002, explain: "Offset is still 3, so the value is unchanged: RoPE attention is relative.", py: "import numpy as np\nR = lambda a: np.array([[np.cos(a), -np.sin(a)],[np.sin(a), np.cos(a)]])\nq = np.array([1,0.]); k = np.array([1,0.])\nanswer = float((R(10*0.5)@q) @ (R(13*0.5)@k))", packages: ["numpy"] });
Q({ id: "dl-pos-4", d: 1, secs: 30, prompt: "Without positional information, self-attention applied to a permuted sequence gives…", options: ["identical outputs in the original order", "the same outputs, permuted the same way", "random outputs", "an error"], answer: 1, explain: "Self-attention is permutation-equivariant.", py: "import numpy as np\nrng = np.random.default_rng(0)\nX = rng.normal(size=(5,4)); W = [rng.normal(size=(4,4)) for _ in range(3)]\ndef att(X):\n    Q, K, V = X@W[0], X@W[1], X@W[2]\n    S = Q@K.T/2; A = np.exp(S - S.max(1, keepdims=True)); A /= A.sum(1, keepdims=True)\n    return A@V\np = rng.permutation(5)\nanswer = 1 if np.allclose(att(X[p]), att(X)[p]) else 0", packages: ["numpy"] });
C("dl-pos-c1", "RoPE property", "⟨R_m q, R_n k⟩ depends only on n − m.");

L("dl-transformer-block", AT, "The transformer block", "Attention + feed-forward + residuals + normalisation: the layer every modern model stacks.", {
  kind: "concept", mins: 25, prereq: ["dl-multihead", "dl-norm", "dl-resnet"],
  hook: "A 'transformer' is the same block repeated 12 to 100+ times. What's inside one block, and where do most of its parameters sit?",
  intuition: `
**The situation.** BERT, GPT, ViT, Whisper: all stack one standard block. Knowing it cold answers a large share of deep-learning interview questions.

**The block (pre-norm, as in most modern models).**

1. $x \\leftarrow x + \\text{MultiHeadAttention}(\\text{Norm}(x))$: tokens exchange information.
2. $x \\leftarrow x + \\text{FFN}(\\text{Norm}(x))$: each token is processed independently by a two-layer MLP, usually 4× wider in the middle with GELU (or a gated SwiGLU variant).

**Roles.** Attention mixes information *across* positions; the FFN transforms each position *on its own* (and is where much factual knowledge seems to be stored). Residual connections create a "residual stream" that every sub-layer reads from and writes to; normalisation keeps it well-scaled.

**Where the parameters are.** Attention projections ≈ $4d^2$; FFN ≈ $8d^2$ (two $d \\times 4d$ matrices). So the FFN holds about two-thirds of each layer's parameters.
`,
  maths: `
**In one breath.** Per layer ≈ $12d^2$ parameters (attention $4d^2$ + FFN $8d^2$, ignoring biases/norms); total ≈ $12Ld^2$ + embeddings $Vd$.

**Worked examples.**

- $d = 768$: $12 \\times 768^2 = 7.08$ million per layer. BERT-base has 12 layers: ≈ 85M in the blocks, plus ≈ 23M in the 30k-token embeddings ≈ 110M total.
- FFN hidden size for $d = 768$: $4d = 3{,}072$.
- GPT-style, $d = 4096$, $L = 32$: $12 \\times 32 \\times 4096^2 \\approx 6.4$B: the size class of a "7B" model once embeddings are added.

**FFN variants.** Standard: $W_2\\,\\text{GELU}(W_1x)$. SwiGLU: $W_2(\\text{SiLU}(W_1x) \\odot W_3x)$, with hidden size ≈ $\\tfrac{8}{3}d$ to keep parameters similar; used in LLaMA-family models.

| Component | Mixes across tokens? | Params (approx.) |
|---|---|---|
| Multi-head attention | yes | 4d² |
| Feed-forward (4× wide) | no | 8d² |
| LayerNorm / RMSNorm | no | 2d / d |
| Residual connections | — | 0 |

**Pre-norm vs post-norm.** Post-norm (original): Norm(x + Sublayer(x)). Pre-norm: x + Sublayer(Norm(x)) keeps an untouched residual path, trains deep stacks stably with less warm-up; most modern models use pre-norm plus a final norm.
`,
  practice: `
**Sizing questions.** Know 12d² per layer and 6ND training FLOPs; they answer most "how big / how expensive" questions.

**Where variants differ.** Normalisation type and position, activation (GELU vs SwiGLU), attention variant (MHA/GQA), positional scheme (learned/RoPE), and whether biases are used.
`,
  traps: [
    { trap: "Most of a transformer's parameters are in attention.", why: "With a 4× FFN, the feed-forward layers hold about two-thirds of each block's parameters; attention dominates compute only at long sequence lengths." },
    { trap: "The FFN looks at the whole sequence.", why: "It's applied to each position independently (a 1×1 convolution over the sequence). Only attention mixes positions." },
    { trap: "Pre-norm and post-norm are equivalent.", why: "Post-norm normalises the residual stream itself, which makes deep stacks harder to train; pre-norm keeps a clean identity path and is the modern default." },
  ],
  say: {
    prompt: "Describe a transformer block and where its parameters and compute go.",
    secs: 60,
    check: ["Two sub-layers: multi-head attention then position-wise FFN", "Residual connection + normalisation around each (pre-norm)", "Attention mixes across tokens; FFN per token, 4× wide with GELU/SwiGLU", "Params ≈ 4d² attention + 8d² FFN = 12d² per layer", "Compute: FFN dominates at short context, attention's n² at long context"],
    followups: [
      { q: "How many parameters does BERT-base have and where?", a: "About 110M: ~85M in 12 blocks of ~7M (12 × 768²) and ~23M in the token embeddings (30k × 768), plus position embeddings and norms." },
      { q: "What is the residual stream?", a: "The running vector per token that each sub-layer reads (after normalisation) and adds its output to; it carries information through the depth of the network." },
      { q: "Why is SwiGLU's hidden size about 8/3·d?", a: "It has three matrices instead of two; shrinking the hidden size to ~8d/3 keeps the parameter count close to a standard 4d FFN." },
    ],
    answer: `Each block has two sub-layers, each wrapped in a residual connection with normalisation; in the modern pre-norm form it's x plus attention of norm x, then x plus FFN of norm x. Multi-head self-attention is the only part that mixes information across positions. The feed-forward network is a two-layer MLP applied to each token independently, usually four times wider in the middle with GELU or a gated SwiGLU.

Attention's four projections are about 4d² parameters and the FFN about 8d², so roughly 12d² per layer, with the FFN holding two-thirds; BERT-base's twelve 768-wide layers come to about 85 million plus embeddings. Compute follows the same split at short sequence lengths, but attention's n-squared term dominates for long contexts.`,
    avoid: ["\u201cAttention holds most parameters\u201d", "\u201cThe FFN sees the whole sequence\u201d"],
  },
  terms: [["Residual stream", "Per-token vector updated additively by each sub-layer."], ["Position-wise FFN", "MLP applied to each token independently."], ["Pre-norm", "Normalise before each sub-layer."], ["SwiGLU", "Gated FFN: SiLU(W₁x) ⊙ W₃x then W₂."]],
  sources: [D.vaswani, D.ln],
});
Q({ id: "dl-tb-1", d: 1, secs: 45, prompt: "Approximate parameters per transformer layer (12d²) for d = 768, in millions? (2 decimals)", answer: 7.08, tol: 0.01, explain: "12 × 768² = 7,077,888.", py: "answer = 12*768**2/1e6" });
Q({ id: "dl-tb-2", d: 2, secs: 60, prompt: "Fraction of a standard block's (attention 4d² + FFN 8d²) parameters in the FFN? (3 decimals)", answer: 0.667, tol: 0.002, explain: "8/12.", py: "answer = 8/12" });
Q({ id: "dl-tb-3", d: 2, secs: 60, prompt: "Decoder with d = 4,096 and 32 layers. Block parameters 12Ld², in billions? (2 decimals)", answer: 6.44, tol: 0.01, explain: "12 × 32 × 4096² = 6.44B; add embeddings for the total.", py: "answer = 12*32*4096**2/1e9" });
Q({ id: "dl-tb-4", d: 1, secs: 30, prompt: "Which component of a transformer block mixes information across positions?", options: ["Feed-forward network", "LayerNorm", "Multi-head attention", "Residual connection"], answer: 2, explain: "The FFN and norms act per token.", py: "answer = 2" });
C("dl-tb-c1", "Block parameters", "≈ 12d² per layer: 4d² attention + 8d² FFN.");
C("dl-tb-c2", "Pre-norm block", "x + MHA(Norm(x)); x + FFN(Norm(x)).");

L("dl-enc-dec-variants", AT, "Encoder, decoder and encoder–decoder transformers", "BERT vs GPT vs T5: masking, training objectives, and which to pick for a task.", {
  kind: "concept", mins: 20, prereq: ["dl-transformer-block"],
  hook: "For sentiment classification you'd pick BERT; for a chatbot, GPT; for translation, T5. What's architecturally different about them?",
  intuition: `
**The situation.** The same block is used in three families that differ in **masking** and **training objective**.

- **Encoder-only (BERT, RoBERTa):** bidirectional attention: every token sees the whole input. Trained by **masked language modelling**: hide ~15% of tokens and predict them. Produces strong contextual embeddings for classification, tagging, retrieval. Doesn't generate text naturally.
- **Decoder-only (GPT, LLaMA):** **causal** attention: each token sees only earlier tokens. Trained to predict the next token. Generates text and, at scale, handles most tasks through prompting.
- **Encoder–decoder (original transformer, T5, BART, Whisper):** an encoder reads the input bidirectionally; a decoder generates output causally and attends to the encoder through **cross-attention**. Natural for input → output mappings (translation, summarisation, speech recognition).
`,
  maths: `
**In one breath.** Causal mask: allow attention from position $i$ to $j$ only if $j \\le i$ (lower-triangular, $n(n + 1)/2$ allowed pairs); MLM loss on masked positions only; causal LM loss $-\\sum_t \\log p(x_t \\mid x_{<t})$.

**Worked examples.**

- Causal mask for $n = 4$: $4 \\times 5/2 = 10$ allowed (query, key) pairs out of 16.
- MLM masking 15% of 512 tokens: about 77 prediction targets per sequence (a decoder gets 511 next-token targets from the same sequence, more training signal per example).

**Cross-attention.** Decoder queries $Q = H_{dec}W_Q$; keys and values from the encoder output $K = H_{enc}W_K$, $V = H_{enc}W_V$.

| Family | Attention | Objective | Typical tasks |
|---|---|---|---|
| Encoder-only | bidirectional | masked LM | classification, NER, embeddings, reranking |
| Decoder-only | causal | next token | generation, chat, general-purpose LLMs |
| Encoder–decoder | bidirectional enc + causal dec + cross-attn | span corruption / seq2seq | translation, summarisation, ASR |
`,
  practice: `
**Choosing in practice.** Classification or embeddings with modest compute → fine-tune an encoder. Anything generative or few-shot → a decoder LLM. Structured input → output with a clear source (translation, ASR) → encoder–decoder, though large decoder-only models now do these well too.

**Why decoder-only won for LLMs.** Simple objective on all tokens, scales cleanly, one architecture for every task through prompting, efficient KV-cached generation.
`,
  traps: [
    { trap: "BERT can generate text like GPT.", why: "It's trained to fill masked tokens with bidirectional context, not to predict the next token left to right, so it isn't a natural generator." },
    { trap: "A decoder-only model can't do classification.", why: "It can, via prompting or by putting a classification head on its final hidden state; encoders are just often more efficient for it." },
    { trap: "The causal mask is only needed at generation time.", why: "It's essential during training too: without it, each position could see the token it's supposed to predict, and the model learns to copy." },
  ],
  say: {
    prompt: "Compare encoder-only, decoder-only and encoder–decoder transformers.",
    secs: 45,
    check: ["Encoder-only: bidirectional, masked LM, embeddings/classification", "Decoder-only: causal mask, next-token prediction, generation", "Encoder–decoder: cross-attention from decoder to encoder; seq2seq tasks", "Examples: BERT / GPT, LLaMA / T5, BART, Whisper", "Why decoder-only dominates LLMs"],
    followups: [
      { q: "What is cross-attention?", a: "Attention where queries come from the decoder and keys/values from the encoder output, letting each generated token look at the input sequence." },
      { q: "Why does masked LM give less signal per sequence than next-token prediction?", a: "Only the ~15% masked tokens are predicted, versus every token in causal LM training." },
      { q: "Why must the causal mask be applied in training?", a: "Training processes all positions in parallel; the mask stops each position seeing future tokens, so the next-token task isn't trivially solvable by copying." },
    ],
    answer: `They share the same block but differ in masking and objective. Encoder-only models like BERT use bidirectional attention and are trained with masked language modelling, predicting hidden tokens from both sides, which gives strong contextual representations for classification, tagging and embeddings, but they aren't natural generators. Decoder-only models like GPT and LLaMA use a causal mask so each token sees only the past and are trained to predict the next token, which makes them generators and, at scale, general-purpose through prompting.

Encoder–decoder models like T5, BART or Whisper read the input bidirectionally and generate the output with a causal decoder that cross-attends to the encoder, a natural fit for translation, summarisation and speech recognition. Decoder-only won for LLMs because the objective uses every token, scales simply, and one model handles every task.`,
    avoid: ["\u201cBERT generates text\u201d", "Forgetting cross-attention in encoder–decoder"],
  },
  terms: [["Masked LM", "Predict randomly hidden tokens from context."], ["Causal LM", "Predict each token from the previous ones."], ["Cross-attention", "Decoder queries attend to encoder keys/values."]],
  sources: [D.vaswani, D.d2l],
});
Q({ id: "dl-ed-1", d: 1, secs: 30, prompt: "Causal mask with sequence length 4. How many (query, key) pairs are allowed?", answer: 10, tol: 0.5, explain: "Lower triangle including the diagonal: 4·5/2 = 10.", py: "import numpy as np\nanswer = int(np.tril(np.ones((4,4))).sum())", packages: ["numpy"] });
Q({ id: "dl-ed-2", d: 1, secs: 30, prompt: "MLM masks 15% of a 512-token sequence. Expected number of prediction targets? (1 decimal)", answer: 76.8, tol: 0.1, explain: "0.15 × 512 = 76.8.", py: "answer = 0.15*512" });
Q({ id: "dl-ed-3", d: 1, secs: 30, prompt: "Best default family for building sentence embeddings for semantic search on a modest budget?", options: ["Decoder-only LLM", "Encoder-only (BERT-style)", "Encoder–decoder", "RNN language model"], answer: 1, explain: "Bidirectional encoders give efficient, strong embeddings.", py: "answer = 1" });
C("dl-ed-c1", "Three families", "Encoder: bidirectional, MLM. Decoder: causal, next token. Enc–dec: cross-attention.");

L("dl-attn-practice", AT, "Attention and transformers practice", "Six interview scenarios on attention maths, sizing and architecture choices.", {
  kind: "interview", mins: 30, prereq: ["dl-self-attention", "dl-multihead", "dl-positional", "dl-transformer-block", "dl-enc-dec-variants"],
  hook: "Answer each scenario out loud in about a minute, then open it and tick off the points the interviewer is listening for.",
}, [
  iq("Write out scaled dot-product attention and explain each term.", "Attention(Q, K, V) = softmax(QKᵀ/√d_k)V. Q, K, V are learned projections of the inputs; QKᵀ gives pairwise similarity scores; √d_k keeps their variance ~1; softmax over keys gives weights per query; multiplying by V returns weighted sums. Masks add −∞ to blocked scores before softmax.", ["Correct formula", "Meaning of Q, K, V", "Why √d_k", "Softmax over keys; masking"]),
  iq("Doubling the context length from 4k to 8k makes training 3× slower. Explain.", "Attention compute and score memory scale with n², so that part grows 4×, while FFN and projections scale linearly (2×). The overall slowdown sits between 2× and 4× depending on the share of attention; FlashAttention reduces memory traffic but not the quadratic FLOPs.", ["n² attention vs linear FFN", "Mixed scaling explains 3×", "FlashAttention addresses memory/IO"]),
  iq("Estimate the parameter count of a 24-layer transformer with d = 1,024 and a 50k vocabulary.", "Blocks ≈ 12 × 24 × 1024² ≈ 302M; embeddings ≈ 50,000 × 1,024 ≈ 51M (output layer often tied). Total ≈ 350M.", ["12Ld² for blocks", "Vd for embeddings", "≈ 350M total; weight tying"]),
  iq("Why can't you just use learned absolute position embeddings for a model that must handle 32k-token documents after training on 4k?", "Positions beyond 4k have no trained embeddings, so the model has never seen them. Relative schemes (RoPE with frequency scaling / position interpolation, ALiBi) extrapolate or can be extended with short fine-tuning.", ["Untrained positions", "RoPE scaling / ALiBi", "Need some long-context fine-tuning"]),
  iq("You need to classify support tickets into 20 categories with 10,000 labelled examples and a CPU-only deployment. Which architecture?", "Fine-tune a small encoder-only model (e.g. a distilled BERT-style model) with a classification head; it's accurate with this data size and cheap at inference. Compare with a TF-IDF + linear baseline; an LLM is overkill for latency and cost.", ["Encoder-only fine-tuning", "Small/distilled for CPU", "Strong simple baseline", "LLM overkill reasoning"]),
  iq("What does the feed-forward layer do in a transformer if attention already mixes tokens?", "Attention moves information between positions but is mostly a weighted average; the FFN applies a non-linear transformation to each token's representation independently, adding most of the model's capacity (~2/3 of parameters) and appearing to store much factual knowledge.", ["Per-token non-linear transform", "Most parameters", "Complementary roles"]),
]);
