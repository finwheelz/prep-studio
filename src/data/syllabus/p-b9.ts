/**
 * Batch 9: the last seven P4 ML-theory concepts (initialisation and normalisation, bagging and
 * boosting, evaluation and calibration, CNNs, sequence models and attention, transformers and LLMs,
 * embeddings and RAG) and the five P1 NumPy concepts. ML items come from src/data/gen/b9.ts; NumPy
 * quiz items are "what does this print?" snippets whose checks run the code in Pyodide's numpy.
 * NumPy coding problems live in src/data/problems-p1-numpy.ts.
 */
import { B9_ITEMS, B9_TOPICS as B } from "@/data/gen/b9";
import type { InterviewQ, Resource } from "@/lib/types";
import { Card_, Item, R, T } from "./build";

const iq = (q: string, answer: string, rubric: string[]): InterviewQ => ({ q, answer, rubric });
const yt = (id: string, title: string, who: string) => R(`Video: ${title} (${who})`, `https://www.youtube.com/watch?v=${id}`);
const CME = R("Stanford CME 295: Transformers & LLMs (lecture videos and slides)", "https://cme295.stanford.edu/", "Lectures 1–5 pair with these pages");
const ml = (id: string, title: string, summary: string, notes: string, resources: Resource[], interview: InterviewQ[]) =>
  T(id, "ml", "ML theory", title, summary, notes, { resources, interview });

// ───────────────────────── ML theory ─────────────────────────
ml(B.init, "Initialisation and normalisation", "Keeping activations and gradients at a sensible scale through a deep network.", `
**The problem.** Each layer multiplies the signal by its weights. If the weights are too large, activations and gradients grow layer after layer (explode); too small, and they shrink to 0 (vanish). Initialisation sets the starting scale; normalisation layers keep it there during training.

**Variance argument.** For y = Σᵢ wᵢxᵢ with n = fan_in independent terms, Var(y) = n · Var(w) · E[x²]. To keep Var(y) ≈ Var(x):

- **Xavier / Glorot** (tanh, sigmoid, linear): Var(w) = 2/(fan_in + fan_out), a compromise between the forward pass (1/fan_in) and the backward pass (1/fan_out). Uniform version: U(−a, a) with a = √(6/(fan_in + fan_out)), because U(−a, a) has variance a²/3.
- **He / Kaiming** (ReLU): Var(w) = 2/fan_in. ReLU zeroes half its inputs, so E[ReLU(z)²] = Var(z)/2; the 2 puts that back.
- **Never all zeros (or all equal):** every unit in a layer gets the same gradient and they stay identical (no symmetry breaking). Biases can start at 0.

**BatchNorm.** For each feature, normalise across the mini-batch: x̂ = (x − μ_B)/√(σ²_B + ε) (σ² divides by m), then y = γx̂ + β with learned γ, β. At inference it uses running averages of μ and σ² collected in training, so a model must be switched to eval mode. Effects: allows higher learning rates, less sensitive to initialisation, mild regularisation from batch noise. Weak with tiny batches.

**LayerNorm.** Normalise each example across its own features. No batch statistics, identical in training and inference, works for any batch size and sequence length: the default in transformers (usually pre-norm: x + Sublayer(LN(x))). **RMSNorm** drops the mean subtraction (x / RMS(x) × γ), as in Llama.

**Dropout** (related regulariser): in training, zero each unit with probability p and scale survivors by 1/(1 − p) ("inverted dropout") so the expected activation is unchanged; at inference, do nothing.

**Worked example 1.** fan_in = 256, fan_out = 512: Glorot a = √(6/768) = 0.0884.

**Worked example 2.** He std for a ReLU layer with fan_in = 512: √(2/512) = 0.0625.

**Worked example 3.** BatchNorm on the batch 2, 4, 6, 8 (γ = 1, β = 0): μ = 5, σ² = 5 → 8 becomes 3/√5 = 1.3416.

**Worked example 4.** LayerNorm on (1, 2, 3, 6): mean 3, variance 3.5 (sd 1.8708) → (−1.0690, −0.5345, 0, 1.6036).
`, [yt("s2coXdufOzE", "Weight initialization in a deep network", "DeepLearningAI"), yt("tNIpEZLv_eg", "Normalizing activations in a network", "DeepLearningAI"), yt("P6sfmUTpUmc", "Building makemore part 3: activations, gradients and BatchNorm", "Andrej Karpathy")], [
  iq("Why not initialise all weights to zero?", "Every unit in a layer would compute the same output and receive the same gradient, so they stay identical forever: the layer behaves like a single unit. Random initialisation breaks the symmetry. (Biases can be zero because the random weights already differ.)", ["Symmetry", "Identical gradients", "Random init breaks it"]),
  iq("BatchNorm vs LayerNorm: what does each normalise over, and why do transformers use LayerNorm?", "BatchNorm normalises each feature across the examples in a batch and needs running statistics at inference. LayerNorm normalises each example across its features, so it doesn't depend on batch size, behaves identically in training and inference, and handles variable-length sequences and small or per-token batches, which is why transformers use it.", ["BN: across batch, per feature", "LN: across features, per example", "Batch-size independence / inference"]),
  iq("Your model is fine in training but much worse in evaluation, and it uses BatchNorm and dropout. What might be wrong?", "It may still be in training mode at evaluation: BatchNorm then uses the evaluation batch's statistics and dropout keeps dropping units. Call model.eval(). Also check that the running statistics were learned on data like the evaluation data, and that evaluation batches aren't tiny or single-class.", ["Train vs eval mode", "Running statistics", "Dropout at inference"]),
]);
Card_("ml-init-c1", "Xavier vs He variance", "Xavier: 2/(fan_in + fan_out) (tanh). He: 2/fan_in (ReLU).", B.init);
Card_("ml-init-c2", "BatchNorm vs LayerNorm", "BN: per feature across the batch (running stats at inference). LN: per example across features.", B.init);

ml(B.ens, "Bagging and boosting", "Combining many models: averaging to cut variance, or adding them one by one to cut bias.", `
**Why ensembles work.** Averaging B models with variance σ² and pairwise correlation ρ gives variance ρσ² + (1 − ρ)σ²/B. Averaging only helps as much as the members disagree; with ρ = 1 nothing is gained.

**Bagging (bootstrap aggregating).** Train each model on a bootstrap sample (n rows drawn with replacement) and average (regression) or vote (classification). Reduces variance, so it suits high-variance learners like deep trees. A given row is left out of a bootstrap sample with probability (1 − 1/n)ⁿ ≈ 1/e ≈ 36.8%: those **out-of-bag** rows give a free validation estimate.

**Random forest** = bagged trees + a random subset of features at each split (√p for classification is the usual default). The feature sampling decorrelates the trees, lowering ρ.

**Boosting.** Fit models sequentially, each focusing on what the current ensemble gets wrong. Reduces bias; uses shallow trees.

- **AdaBoost:** reweight the examples. A learner with weighted error ε gets vote α = ½ ln((1 − ε)/ε); misclassified points are multiplied by e^α, correct ones by e^{−α}, then normalised (afterwards the misclassified points hold exactly half the weight).
- **Gradient boosting:** each new tree fits the negative gradient of the loss at the current predictions; for squared error that's the residuals y − F. Update F ← F + η × tree with a learning rate (shrinkage) η of 0.01–0.3. XGBoost, LightGBM and CatBoost add second-order steps, regularisation, histogram splits and fast categorical handling.

**Which to use.** Bagging/RF: robust, little tuning, hard to overfit by adding trees. Boosting: usually the most accurate on tabular data but needs tuning (learning rate, depth, number of trees with early stopping) and can overfit noise.

**Stacking.** Train a meta-model on out-of-fold predictions of diverse base models.

**Worked example 1.** n = 10: P(row out-of-bag) = 0.9¹⁰ = 0.3487.

**Worked example 2.** Three independent classifiers at 70%: majority accuracy = 0.7³ + 3 × 0.7² × 0.3 = 0.784.

**Worked example 3.** AdaBoost, ε = 0.2: α = ½ ln 4 = 0.6931.

**Worked example 4.** Gradient boosting, y = 2, 4, 9 → F₀ = 5; residuals −3, −1, 4; with η = 0.1 and a tree that fits them exactly, F₁ = 4.7, 4.9, 5.4.
`, [yt("J4Wdy0Wc_xQ", "Random forests part 1", "StatQuest"), yt("LsK-xG1cLYA", "AdaBoost, clearly explained", "StatQuest"), yt("3CC4N4z3GJc", "Gradient boost part 1: regression main ideas", "StatQuest")], [
  iq("Bagging vs boosting: what does each reduce, and what base learners suit each?", "Bagging trains models independently on bootstrap samples and averages them, reducing variance; it suits low-bias, high-variance learners like deep trees. Boosting trains models sequentially on the current ensemble's errors, reducing bias; it uses weak, shallow learners. Bagging parallelises and rarely overfits by adding models; boosting needs a learning rate and early stopping.", ["Variance vs bias", "Independent vs sequential", "Deep vs shallow learners"]),
  iq("Why does a random forest sample features at each split?", "Bagged trees on the same data tend to pick the same strong features and become correlated, and the variance of an average of correlated models is bounded by ρσ². Restricting each split to a random subset of features decorrelates the trees, so averaging removes more variance.", ["Correlated trees", "Variance of an average", "Decorrelation"]),
  iq("How does gradient boosting relate to gradient descent?", "It's gradient descent in function space: at each round compute the gradient of the loss with respect to the current predictions, fit a tree to the negative gradient (residuals for squared error), and take a small step η in that direction. Any differentiable loss works the same way (log loss for classification).", ["Function-space gradient descent", "Fit negative gradient / residuals", "Learning rate step"]),
]);
Card_("ml-ens-c1", "Out-of-bag fraction", "(1 − 1/n)ⁿ → 1/e ≈ 36.8% of rows per bootstrap sample.", B.ens);
Card_("ml-ens-c2", "AdaBoost learner weight", "α = ½ ln((1 − ε)/ε).", B.ens);

ml(B.evalc, "Evaluation and calibration", "Choosing a metric that matches the decision, and checking that probabilities mean what they say.", `
**Confusion matrix.** Precision = TP/(TP + FP): of what we flagged, how much was right. Recall = TP/(TP + FN): of the real positives, how many we caught. F1 = 2PR/(P + R) = 2TP/(2TP + FP + FN). Accuracy misleads with imbalance: 99% accuracy on 1% fraud by predicting "no" every time.

**Threshold-free metrics.**

- **ROC AUC** = P(a random positive is scored above a random negative). Unaffected by class balance and by any monotone change of the scores.
- **PR AUC / average precision**: better than ROC AUC when positives are rare, because it focuses on the positive class.

**Choosing the threshold.** It's a business decision. With calibrated probabilities and costs C_FP, C_FN, flag when p > C_FP/(C_FP + C_FN). Or fix a precision floor and maximise recall.

**Calibration.** A model is calibrated if, among cases scored 0.8, about 80% are positive. Needed whenever the probability itself is used (pricing, expected cost, risk scores, combining models).

- **Reliability diagram:** bin the predictions, plot mean predicted probability against the fraction positive; the diagonal is perfect.
- **ECE** = Σ_b (n_b/N) |accuracy_b − confidence_b|.
- **Brier score** = mean (p − y)²; **log loss** also rewards calibration.
- **Fixes:** Platt scaling (a logistic regression on the scores), isotonic regression (more flexible, needs more data), temperature scaling for neural networks. Fit them on held-out data, never on the training set.
- Boosted trees and SVM scores are often poorly calibrated; modern deep nets tend to be overconfident.

**Validation design.** Split by time for forecasting, by user/group when rows from one user are correlated (GroupKFold), stratify with imbalance, and keep a final untouched test set.

**Worked example 1.** TP = 40, FP = 10, FN = 20: precision 0.8, recall 0.6667, F1 = 80/110 = 0.7273.

**Worked example 2.** Positives scored 0.9, 0.6; negatives 0.7, 0.2: correctly ordered pairs (0.9 > 0.7, 0.9 > 0.2, 0.6 > 0.2) = 3 of 4 → AUC 0.75.

**Worked example 3.** Labels 1, 0 with p = 0.8, 0.3: Brier = (0.04 + 0.09)/2 = 0.065.

**Worked example 4.** Ten predictions of 0.9 with 6 positives: that bin's gap is |0.6 − 0.9| = 0.3, so the model is overconfident there.
`, [yt("Kdsp6soqA7o", "Machine learning fundamentals: the confusion matrix", "StatQuest"), yt("4jRBRDbJemM", "ROC and AUC, clearly explained", "StatQuest"), R("scikit-learn user guide: probability calibration", "https://scikit-learn.org/stable/modules/calibration.html")], [
  iq("When would you prefer PR AUC to ROC AUC?", "With heavy class imbalance and when the positive class is what matters (fraud, rare disease). ROC AUC counts true negatives through the false-positive rate, so a huge negative class can make a weak model look good; precision exposes the false positives directly.", ["Imbalance", "FPR diluted by many negatives", "Precision focuses on positives"]),
  iq("What does it mean for a model to be calibrated, and how do you check and fix it?", "Its predicted probabilities match observed frequencies: of cases scored 0.7, about 70% are positive. Check with a reliability diagram, ECE or the Brier score on held-out data. Fix with Platt scaling, isotonic regression or temperature scaling fitted on a separate calibration set.", ["Definition", "Reliability diagram / ECE / Brier", "Platt / isotonic / temperature on held-out data"]),
  iq("A fraud model has 99.5% accuracy. Is it good?", "Not necessarily: if 0.5% of transactions are fraud, predicting 'not fraud' always gets 99.5%. Look at precision and recall for the fraud class, PR AUC, and the cost of each error type; then pick the threshold from the costs or the review team's capacity.", ["Baseline accuracy", "Precision / recall / PR AUC", "Cost-based threshold"]),
]);
Card_("ml-eval-c1", "ROC AUC meaning", "P(random positive scored above random negative).", B.evalc);
Card_("ml-eval-c2", "Cost-optimal threshold", "Flag when p > C_FP/(C_FP + C_FN) (needs calibrated p).", B.evalc);

ml(B.cnn, "Convolutional neural networks", "Weight sharing and local connections for images: sizes, parameters and receptive fields.", `
**Convolution layer.** A small kernel (k × k × C_in) slides over the input; at each position, multiply element-wise and sum (deep-learning libraries compute cross-correlation, without flipping the kernel). C_out kernels give C_out output channels.

**Why it works for images.**

- **Local connectivity:** nearby pixels are related.
- **Weight sharing:** the same edge detector is useful everywhere → far fewer parameters and translation equivariance.
- **Hierarchy:** edges → textures → parts → objects as the receptive field grows.

**Sizes.** Output = ⌊(n + 2p − k)/s⌋ + 1. "Same" padding for stride 1 is p = (k − 1)/2.

**Parameters.** (k·k·C_in + 1)·C_out, independent of the image size. A dense layer on a 224×224×3 image with 1,000 units would need 150 million weights.

**Pooling.** Max or average over windows (usually 2×2, stride 2): halves the resolution, adds a little translation invariance, no parameters. Modern nets often use strided convolutions and end with global average pooling.

**Receptive field.** r = 1 + Σₗ (kₗ − 1) × (product of the strides before layer l). Two 3×3 layers see 5×5 and three see 7×7, with fewer parameters and more non-linearities than one 7×7 (the VGG argument).

**Architectures to name.** LeNet, AlexNet (ReLU, dropout, GPUs), VGG (stacks of 3×3), ResNet (skip connections y = F(x) + x make very deep nets trainable), 1×1 convolutions to mix channels cheaply (Inception, MobileNet's depthwise-separable convolutions), U-Net for segmentation, Vision Transformers (patches as tokens).

**Worked example 1.** 32×32 input, 5×5 kernel, stride 1, no padding → 28×28. With padding 2 → 32×32.

**Worked example 2.** 3×3 conv, 64 → 128 channels: (9 × 64 + 1) × 128 = 73,856 parameters.

**Worked example 3.** Input rows (1, 2, 0), (0, 1, 3), (2, 1, 1) and kernel rows (1, 0), (0, −1): top-left output = 1×1 + 2×0 + 0×0 + 1×(−1) = 0.

**Worked example 4.** Layers 3×3 s1, 3×3 s2, 3×3 s1: r = 1 + 2 + 2 + 2×2 = 9.
`, [yt("KuXjwB4LzSA", "But what is a convolution?", "3Blue1Brown"), yt("HGwBXDKFk9I", "Neural networks part 8: image classification with CNNs", "StatQuest"), R("Stanford CS231n notes: convolutional networks", "https://cs231n.github.io/convolutional-networks/")], [
  iq("Why do CNNs need far fewer parameters than fully connected networks on images?", "Each unit connects only to a local patch, and the same kernel weights are reused at every position. A conv layer's parameter count depends on the kernel size and channels, not on the image size; a dense layer needs a weight per pixel per unit.", ["Local connectivity", "Weight sharing", "Independent of image size"]),
  iq("Why use two 3×3 convolutions instead of one 5×5?", "Same 5×5 receptive field, fewer parameters (2 × 9C² = 18C² vs 25C²), and an extra non-linearity between them, which makes the function more expressive.", ["Same receptive field", "Fewer parameters", "Extra non-linearity"]),
  iq("What problem do residual connections solve?", "Very deep plain networks train worse than shallower ones (a degradation problem, partly from vanishing gradients). With y = F(x) + x, a block only has to learn a correction to the identity, and gradients flow straight through the skip path, so networks with hundreds of layers train well.", ["Degradation / vanishing gradients", "Learn a residual", "Gradient highway"]),
]);
Card_("ml-cnn-c1", "Conv output size", "⌊(n + 2p − k)/s⌋ + 1.", B.cnn);
Card_("ml-cnn-c2", "Conv parameters", "(k·k·C_in + 1)·C_out.", B.cnn);

ml(B.seq, "Sequence models and attention", "RNNs, LSTMs, and the attention mechanism that replaced recurrence.", `
**RNN.** hₜ = tanh(W hₜ₋₁ + U xₜ + b), with the same weights at every step. Backpropagation through time multiplies by W (and tanh′) once per step, so gradients vanish or explode over long sequences, and the steps can't be computed in parallel.

**LSTM.** Adds a cell state cₜ updated additively: cₜ = fₜ ⊙ cₜ₋₁ + iₜ ⊙ c̃ₜ, with forget, input and output gates (sigmoids). The additive path lets gradients survive many steps. Four gate blocks → 4 × [h(x + h) + h] parameters. **GRU:** two gates, no separate cell, slightly cheaper.

**Seq2seq bottleneck.** An encoder squeezes the whole input into one vector for the decoder; long inputs lose information. **Attention** (Bahdanau, 2014) lets each decoder step look back at all encoder states with learned weights.

**Scaled dot-product attention.** Attention(Q, K, V) = softmax(QKᵀ/√d_k) V.

- Each query scores every key by a dot product; the softmax turns the scores into weights; the output is the weighted average of the values.
- **Why √d_k:** dot products of random d-dimensional vectors have variance ∝ d; without scaling the softmax saturates and its gradients vanish.
- **Self-attention:** Q, K and V all come from the same sequence (X W_Q, X W_K, X W_V). **Cross-attention:** queries from the decoder, keys and values from the encoder.
- **Causal mask:** set scores for future positions to −∞ before the softmax, so a token only attends to earlier ones.
- **Multi-head:** h heads of size d/h attend in parallel to different relations; concatenate and project with W_O.
- **Cost:** O(n²d) time and O(n²) memory in sequence length n, against O(n) sequential steps for an RNN; but every position is computed in parallel and any two tokens are one step apart.

**Worked example 1.** RNN with h = tanh(0.5h + x), h₀ = 0, inputs 1, 1: h₁ = tanh(1) = 0.7616, h₂ = tanh(1.3808) = 0.8812.

**Worked example 2.** q = (1, 0), keys (1, 0) and (0, 1), d = 2: scores 0.7071 and 0 → weights 0.6698, 0.3302.

**Worked example 3.** Same weights with values 10 and 0: output 6.698.

**Worked example 4.** LSTM with input 32 and hidden 64: 4 × (64 × 96 + 64) = 24,832 parameters.
`, [yt("AsNTP8Kwu80", "Recurrent neural networks, clearly explained", "StatQuest"), yt("YCzL96nL7j0", "Long short-term memory (LSTM), clearly explained", "StatQuest"), yt("PSs6nxngL6k", "Attention for neural networks, clearly explained", "StatQuest"), CME], [
  iq("Why do we scale attention scores by √d_k?", "If query and key components are roughly independent with unit variance, their dot product has variance d_k. Large scores push the softmax into saturation, where one weight is ≈ 1 and gradients are tiny. Dividing by √d_k keeps the scores' variance near 1.", ["Dot-product variance ∝ d", "Softmax saturation", "Gradients"]),
  iq("What advantages do transformers have over RNNs, and what's the cost?", "All positions are processed in parallel (fast training on GPUs) and any two tokens interact in one step, so long-range dependencies don't have to survive many recurrent steps. The cost is O(n²) time and memory in sequence length, and position has to be injected explicitly.", ["Parallelism", "Short path between tokens", "Quadratic cost / position encoding"]),
  iq("How does an LSTM mitigate vanishing gradients?", "Its cell state is updated additively (c = f ⊙ c_prev + i ⊙ c̃) rather than squashed through a matrix multiply and tanh at every step. With the forget gate near 1, the gradient along the cell path is close to 1 per step, so information and gradients persist over long spans.", ["Additive cell update", "Forget gate", "Gradient path ≈ 1"]),
]);
Card_("ml-seq-c1", "Scaled dot-product attention", "softmax(QKᵀ/√d_k) V.", B.seq);
Card_("ml-seq-c2", "LSTM parameters", "4 × [h(x + h) + h].", B.seq);

ml(B.trans, "Transformers and LLMs", "Tokenisation, positions, the decoder block, KV caching, and how LLMs are trained and adapted.", `
**Tokenisation.** Text is split into sub-word tokens by byte-pair encoding (BPE) or similar: start from bytes or characters and repeatedly merge the most frequent adjacent pair. Common words become one token, rare words several. It explains LLM quirks: spelling and arithmetic on digits are hard, other languages cost more tokens, and context limits and prices are counted in tokens.

**Decoder-only transformer block** (GPT, Llama), pre-norm:

- x ← x + MultiHeadCausalSelfAttention(LN(x))
- x ← x + FFN(LN(x)), with the FFN usually 4d wide (or a gated SwiGLU).
- Parameters per block ≈ 12d² (4d² attention + 8d² FFN). Embeddings add vocab × d.

**Position.** Attention ignores order by itself.

- **Sinusoidal** (original paper): PE(pos, 2i) = sin(pos/10000^{2i/d}), PE(pos, 2i + 1) = cos(…), added to the embeddings.
- **Learned absolute** (GPT-2).
- **RoPE** (Llama and most current LLMs): rotate each 2-D pair of q and k by an angle proportional to the position. Then q_m · k_n depends only on the offset n − m, so attention sees relative positions, and the frequencies can be rescaled to extend the context.

**Inference and the KV cache.** Generation is autoregressive: one token at a time. Each token's keys and values never change, so cache them instead of recomputing: memory = 2 × layers × batch × tokens × kv_heads × head_dim × bytes. This dominates serving memory at long context. **Grouped-query / multi-query attention** shares K/V heads across query heads to shrink it.

**Training stages.**

1. **Pretraining:** next-token prediction (cross-entropy) on trillions of tokens. Scaling laws: loss falls predictably with parameters, data and compute; Chinchilla-optimal is about 20 tokens per parameter.
2. **Supervised fine-tuning (SFT)** on instruction–response examples.
3. **Preference tuning:** RLHF (a reward model + PPO) or DPO directly on preference pairs.

**Parameter-efficient fine-tuning.** **LoRA** freezes W and learns ΔW = BA with A: r × d_in and B: d_out × r (r ≈ 4–64), so r(d_in + d_out) parameters per matrix; B starts at 0 so training starts from the base model, and BA can be merged into W for inference. **QLoRA** does this on a 4-bit-quantised base model.

**Decoding.** Greedy, beam search, or sampling with temperature (divide logits by T), top-k, top-p (nucleus).

**Worked example 1.** d = 4096, one block ≈ 12 × 4096² ≈ 201M parameters; 32 blocks ≈ 6.4B, plus embeddings (a 7B-class model).

**Worked example 2.** 32 layers, 8 KV heads × 128, 4,096 tokens, batch 1, fp16: 2 × 32 × 4096 × 1024 × 2 bytes = 0.5 GiB. With 32 KV heads (no GQA): 2 GiB.

**Worked example 3.** LoRA r = 8 on a 4096×4096 matrix: 8 × 8192 = 65,536 parameters, vs 16.8M for the full matrix (0.39%).

**Worked example 4.** PE(pos = 1, dim 0) = sin(1) = 0.8415; dim 1 = cos(1) = 0.5403.
`, [yt("wjZofJX0v4M", "Transformers, the tech behind LLMs", "3Blue1Brown"), yt("eMlx5fFNoYc", "Attention in transformers, step-by-step", "3Blue1Brown"), yt("kCc8FmEb1nY", "Let's build GPT: from scratch, in code", "Andrej Karpathy"), yt("o29P0Kpobz0", "Rotary positional embeddings", "Efficient NLP"), yt("t509sv5MT0w", "LoRA explained", "DeepFindr"), CME], [
  iq("What is the KV cache, and why does it matter for serving?", "During autoregressive decoding each new token attends to all previous tokens. Their keys and values don't change, so they're stored rather than recomputed, making each step O(n) instead of re-running the whole prefix. The cache grows with layers × tokens × batch × KV heads × head size and often limits batch size and context length; GQA/MQA, quantised caches and paged attention reduce it.", ["Avoids recomputation", "Memory formula / growth", "Mitigations"]),
  iq("Explain LoRA and why it works.", "Freeze the pretrained weights and learn a low-rank update ΔW = BA for chosen matrices (often the attention projections). The fine-tuning update tends to have low intrinsic rank, so r of 8–64 captures most of it with well under 1% of the parameters: much less optimiser memory, small adapter files per task, and no extra inference latency once BA is merged into W.", ["Frozen W + low-rank BA", "Parameter count r(d_in + d_out)", "Memory / adapters / mergeable"]),
  iq("How does RoPE encode position, and why is it preferred to absolute position embeddings?", "It rotates each 2-D pair of query and key dimensions by an angle proportional to the token's position, with different frequencies per pair. The dot product of a rotated query and key then depends only on their relative offset, which generalises better and lets context be extended by rescaling the frequencies. It adds no parameters.", ["Rotation by position × frequency", "Relative offset in q·k", "Context extension / no parameters"]),
]);
Card_("ml-tf-c1", "KV cache size", "2 × layers × batch × tokens × kv_heads × head_dim × bytes.", B.trans);
Card_("ml-tf-c2", "LoRA parameters", "r(d_in + d_out) per adapted matrix.", B.trans);
Card_("ml-tf-c3", "Transformer block parameters", "≈ 12d² (4d² attention + 8d² FFN).", B.trans);

ml(B.rag, "Embeddings and retrieval-augmented generation", "Turning text into vectors, searching them, and grounding an LLM's answer in retrieved documents.", `
**Embeddings.** A model maps text to a vector so that similar meanings land close together. word2vec learned word vectors from context; modern sentence embedders are transformer encoders trained with contrastive losses (pull matching pairs together, push other in-batch examples apart).

**Similarity.** Cosine similarity a·b/(‖a‖‖b‖) compares direction; most embedders are meant to be used with it. If vectors are L2-normalised, dot product = cosine and Euclidean distance gives the same ranking.

**Vector search.** Exact search is O(N·d) per query. Approximate nearest-neighbour indexes trade a little recall for speed: HNSW graphs, IVF (cluster, then search a few clusters), product quantisation to compress vectors (FAISS, vector databases).

**RAG pipeline.**

1. **Ingest:** parse documents, split into chunks (a few hundred tokens with some overlap so a fact isn't cut in half), embed and index them with metadata.
2. **Retrieve:** embed the query; take the top-k chunks. **Hybrid search** combines dense vectors with keyword search (BM25), which catches exact names, codes and rare terms.
3. **Rerank:** a cross-encoder scores (query, chunk) pairs jointly; more accurate, used on the top 50–100 only.
4. **Generate:** put the chunks in the prompt with instructions to answer only from them and cite sources.

**Why RAG instead of fine-tuning?** Knowledge that changes or must be attributable: update the index, not the model; you get citations and access control. Fine-tune for style, format or a skill, not for facts.

**Evaluating it.** Retrieval: recall@k, precision@k, MRR (mean of 1/rank of the first relevant hit), nDCG. Generation: faithfulness (is every claim supported by the context?), answer relevance, correctness on a labelled set; LLM-as-judge with spot checks.

**Failure modes.** The right chunk isn't retrieved (bad chunking, vocabulary mismatch → hybrid search, query rewriting); retrieved but ignored or "lost in the middle" of a long context (rerank, fewer and better chunks); the model answers from its own memory (prompting, citations, refusal when the context is insufficient); stale or duplicate documents.

**Worked example 1.** a = (1, 2, 2), b = (2, 0, 1): a·b = 4, ‖a‖ = 3, ‖b‖ = √5 → cosine 0.5963.

**Worked example 2.** First relevant hit at ranks 1, 3 and none: MRR = (1 + 1/3 + 0)/3 = 0.4444.

**Worked example 3.** 2,000 tokens, chunks of 500 with 100 overlap: starts 0, 400, 800, 1200, 1600 → 5 chunks (the last reaches 2,100, past the end).

**Worked example 4.** Query (1, 0); docs (10, 10) and (1, 0.1): the dot product prefers the first (10 vs 1) but cosine prefers the second (0.995 vs 0.707).
`, [yt("viZrOnJclY0", "Word embedding and word2vec, clearly explained", "StatQuest"), yt("T-D1OfcDW1M", "What is retrieval-augmented generation (RAG)?", "IBM Technology"), CME], [
  iq("Your RAG chatbot gives wrong answers. How do you debug it?", "Separate retrieval from generation. Build a small labelled set of questions with their source passages; measure recall@k. If the right chunk isn't retrieved, fix chunking, add hybrid/BM25 search, rewrite queries, or rerank. If it is retrieved but the answer is wrong, look at prompt design, context ordering and length, and check faithfulness to the context.", ["Split retrieval vs generation", "Labelled eval set / recall@k", "Fixes for each side"]),
  iq("When would you use RAG vs fine-tuning?", "RAG for knowledge that is large, changes often, needs citations or per-user access control: you update the index, not the weights. Fine-tuning for behaviour: output format, tone, domain-specific reasoning or a task the base model does poorly. They combine well (a model fine-tuned to use retrieved context).", ["RAG for changing/attributable facts", "Fine-tuning for behaviour/format", "Can combine"]),
  iq("Why combine dense retrieval with keyword search?", "Dense embeddings capture paraphrases and meaning but can miss exact tokens such as product codes, names, error messages or rare terms; BM25 matches them exactly but misses synonyms. Fusing the two ranked lists (e.g. reciprocal rank fusion) improves recall on both kinds of query.", ["Dense: semantics", "Sparse: exact terms", "Fusion"]),
]);
Card_("ml-rag-c1", "MRR", "Mean over queries of 1/(rank of first relevant result).", B.rag);
Card_("ml-rag-c2", "RAG pipeline", "Chunk → embed → index → retrieve (hybrid) → rerank → generate with citations.", B.rag);

for (const g of B9_ITEMS) {
  Item({
    id: g.id, topic: g.topic, d: g.d, secs: g.secs, prompt: g.prompt,
    ...(g.options ? { options: g.options } : {}),
    answer: g.answer,
    ...(g.tol !== undefined && !g.options ? { tol: g.tol } : {}),
    explain: g.explain, fast: g.fast, trap: g.trap,
    src: "Practice: generated; answer recomputed in Python (numpy, scipy, scikit-learn, enumeration or simulation) (Nov 2026)",
    check: { py: g.py, ...(g.packages ? { packages: g.packages } : {}) },
  });
}

// ───────────────────────── NumPy (P1) ─────────────────────────
const NP_SRC = "Practice: trace the code; output checked by running it with numpy in Pyodide (Nov 2026)";
const NP_DOC = (path: string, label: string) => R(`NumPy docs: ${label}`, `https://numpy.org/doc/stable/${path}`);
const FCC = yt("QUT1VHiLmmI", "Python NumPy tutorial for beginners", "freeCodeCamp");
const npTopic = (id: string, title: string, summary: string, notes: string, resources: Resource[], category: string, interview: InterviewQ[]) =>
  T(id, "foundations", "NumPy", title, summary, notes, { resources, categories: [category], interview });
function trace(id: string, topic: string, d: 1 | 2 | 3, secs: number, code: string, answer: number, explain: string, fast: string, trap: string) {
  Item({
    id, topic, d, secs, prompt: `What does this code print?\n\n\`\`\`\nimport numpy as np\n${code}\n\`\`\``, answer, tol: 0, explain, fast, trap, src: NP_SRC,
    check: { py: `import io, contextlib\n_buf = io.StringIO()\nwith contextlib.redirect_stdout(_buf):\n    exec(${JSON.stringify("import numpy as np\n" + code)}, {"__name__": "__main__"})\nanswer = float(_buf.getvalue().strip())`, packages: ["numpy"] },
  });
}

npTopic("np-arrays", "Arrays, dtypes, views and copies", "What an ndarray is, how shape and dtype work, and when two arrays share memory.", `
**An ndarray** is one block of memory holding values of a single dtype, plus a shape and strides that say how to walk it. That's why operations run in compiled loops (fast) and why every element must have the same type.

**Creating arrays.** \`np.array([...])\`, \`np.zeros((r, c))\`, \`np.ones\`, \`np.full\`, \`np.arange(start, stop, step)\` (stop excluded), \`np.linspace(a, b, n)\` (b included), \`np.eye(n)\`, \`rng.random((r, c))\`.

**dtype.** Inferred from the data: ints → an integer dtype, any float → float64. Assigning a float into an int array **truncates silently** (\`a[0] = 2.9\` stores 2). Convert with \`a.astype(float)\`. Watch integer overflow with small dtypes (int8, uint8 images).

**Shape.** \`a.shape\`, \`a.ndim\`, \`a.size\`. \`reshape\` changes the shape without copying when it can; one dimension may be \`-1\` ("whatever fits"). \`ravel\` (view if possible) vs \`flatten\` (always a copy). \`a.T\` reverses the axes. \`np.newaxis\` / \`None\` adds an axis of length 1.

**Views vs copies.** Basic slicing (\`a[1:3]\`, \`a[:, 0]\`), \`reshape\`, \`.T\` and \`ravel\` return **views**: writing through them changes the original. Fancy indexing and boolean masks return **copies**. Use \`.copy()\` when you need independence; \`np.shares_memory(a, b)\` tells you.

**Combining.** \`np.concatenate([a, b], axis=0)\`, \`np.vstack\`, \`np.hstack\`, \`np.stack\` (adds a new axis).

**Worked example 1.** \`np.arange(12).reshape(3, 4)\` has shape (3, 4); \`.reshape(2, -1)\` gives (2, 6).

**Worked example 2.** \`b = a[0]; b[:] = 0\` zeroes row 0 of a too (view). \`b = a[[0]]\` is a copy.

**Worked example 3.** \`np.array([1, 2.5])\` is float64; \`np.array([1, 2])\` is an integer array, and \`a / 2\` still returns floats (true division).

**Worked example 4.** \`np.linspace(0, 1, 5)\` = 0, 0.25, 0.5, 0.75, 1; \`np.arange(0, 1, 0.25)\` stops before 1.
`, [FCC, NP_DOC("user/basics.copies.html", "copies and views"), NP_DOC("user/absolute_beginners.html", "NumPy: the absolute basics for beginners")], "np/arrays", [
  iq("Why is NumPy faster than Python lists for numeric work?", "An array stores raw values of one dtype contiguously, so operations run as compiled C loops over memory, often with SIMD, instead of the interpreter handling one boxed Python object at a time. Lists hold pointers to separate objects, each with type checks and reference counting.", ["Contiguous typed memory", "Compiled loops", "No per-element interpreter overhead"]),
  iq("When does slicing a NumPy array return a view, and why does it matter?", "Basic slices (start:stop:step, integers), reshape and transpose return views sharing memory with the original, so modifying the slice modifies the original. Fancy (integer-array) and boolean indexing return copies. It matters for bugs (unexpected changes) and memory: views are free, copies aren't. Use .copy() when you need an independent array.", ["Basic slice → view", "Fancy/boolean → copy", "Side effects and .copy()"]),
  iq("What does reshape(-1) mean and when does reshape copy?", "-1 tells NumPy to infer that dimension from the total size. reshape returns a view when the existing memory layout allows (e.g. a contiguous array); otherwise (e.g. after a transpose) it must copy.", ["Inferred dimension", "View when layout allows", "Copy otherwise"]),
]);
trace("np-arr-t1", "np-arrays", 2, 60, "a = np.arange(12).reshape(3, 4)\nb = a[:, 1]\nb[0] = 100\nprint(a.sum())", 165,
  "a[:, 1] is a view, so b[0] = 100 changes a[0, 1] from 1 to 100: 66 − 1 + 100 = 165.", "Basic slices are views; writes go through.", "Assuming the slice is a copy and answering 66.");
trace("np-arr-t2", "np-arrays", 1, 45, "a = np.array([1, 2, 3])\na[0] = 2.9\nprint(a.sum())", 7,
  "a has an integer dtype, so 2.9 is truncated to 2: 2 + 2 + 3 = 7.", "Assigning into an int array truncates.", "Expecting the array to become float (7.9).");
trace("np-arr-t3", "np-arrays", 1, 45, "a = np.zeros((2, 3, 4))\nprint(a.reshape(4, -1).shape[1] + a.T.shape[0])", 10,
  "24 elements in 4 rows → 6 columns; .T reverses the axes to (4, 3, 2), so shape[0] = 4: 6 + 4 = 10.", "−1 is inferred; .T reverses all axes.", "Thinking .T only swaps the last two axes.");
Card_("np-arr-c1", "Views vs copies", "Basic slices, reshape, .T → views. Fancy / boolean indexing → copies.", "np-arrays");
Card_("np-arr-c2", "Float into int array", "Silently truncated; use astype(float) first.", "np-arrays");

npTopic("np-indexing", "Indexing: slices, masks and fancy indexing", "Selecting and updating parts of an array without loops.", `
**Basic indexing.** \`a[i, j]\` (not \`a[i][j]\`, which builds an intermediate), slices \`a[1:4, ::2]\`, negative indices, \`a[..., 0]\` (ellipsis = all leading axes). An integer drops that axis; a slice keeps it: \`a[0]\` has shape (4,), \`a[0:1]\` has shape (1, 4).

**Boolean masks.** \`a[a > 0]\` returns a 1-D copy of the matching values. Combine conditions with \`&\`, \`|\`, \`~\` and parentheses: \`a[(a > 0) & (a < 5)]\` (\`and\` / \`or\` raise an error on arrays). Assign through a mask: \`a[a < 0] = 0\`. Count matches with \`(a > 0).sum()\`; \`mask.mean()\` gives the fraction.

**np.where.** \`np.where(cond, x, y)\` picks element-wise (a vectorised if/else). \`np.where(cond)\` alone returns the indices (like \`np.nonzero\`).

**Fancy (integer-array) indexing.** \`a[[2, 0, 2]]\` picks rows in that order, repeats allowed, and returns a copy.

- \`a[[0, 2], [1, 3]]\` pairs the index arrays element-wise: it returns \`a[0, 1]\` and \`a[2, 3]\`, **not** a 2×2 block.
- For the block, use \`a[np.ix_([0, 2], [1, 3])]\` or \`a[[0, 2]][:, [1, 3]]\`.
- \`a[[0, 0]] += 1\` adds 1 only once (buffered); \`np.add.at(a, [0, 0], 1)\` adds twice.

**Sorting and selection.** \`np.sort\` returns a copy; \`a.sort()\` sorts in place. \`np.argsort(a)\` gives the order of indices (\`[::-1]\` for descending); \`np.argpartition(a, -k)[-k:]\` finds the top k in O(n) without fully sorting.

**Worked example 1.** a = [5, −2, 7, −1, 3]: \`a[a > 0]\` = [5, 7, 3]; \`np.where(a > 0, a, 0)\` = [5, 0, 7, 0, 3].

**Worked example 2.** \`np.arange(10)[::3]\` = [0, 3, 6, 9].

**Worked example 3.** M = \`np.arange(9).reshape(3, 3)\`: \`M[[0, 1, 2], [0, 1, 2]]\` is the diagonal [0, 4, 8].

**Worked example 4.** Top 2 indices of [4, 9, 1, 7] in descending order: \`np.argsort(a)[::-1][:2]\` = [1, 3].
`, [FCC, NP_DOC("user/basics.indexing.html", "indexing on ndarrays"), R("Python Data Science Handbook: fancy indexing", "https://jakevdp.github.io/PythonDataScienceHandbook/02.07-fancy-indexing.html")], "np/indexing", [
  iq("What's the difference between a[[0, 2], [1, 3]] and a[[0, 2]][:, [1, 3]]?", "The first pairs the index arrays element-wise and returns two elements, a[0, 1] and a[2, 3]. The second first selects rows 0 and 2, then columns 1 and 3 of those, giving a 2×2 block; np.ix_ does the same in one step.", ["Element-wise pairing", "Block selection", "np.ix_"]),
  iq("How do you replace all negative values in an array with 0 without a loop?", "a[a < 0] = 0 (in place), or np.where(a < 0, 0, a) / np.maximum(a, 0) / np.clip(a, 0, None) for a new array.", ["Boolean mask assignment", "np.where / maximum / clip"]),
  iq("Why does (a > 0) and (a < 5) raise an error, and what should you write?", "Python's and asks for the truth value of a whole array, which is ambiguous for more than one element. Use the element-wise operators with parentheses, because & binds tighter than comparisons: (a > 0) & (a < 5).", ["Ambiguous truth value", "& | ~", "Parentheses / precedence"]),
]);
trace("np-idx-t1", "np-indexing", 1, 30, "a = np.array([5, -2, 7, -1, 3])\nprint(a[a > 0].sum())", 15,
  "The mask keeps 5, 7 and 3: 15.", "a[mask] keeps the True positions.", "Summing the mask itself (3).");
trace("np-idx-t2", "np-indexing", 2, 45, "a = np.arange(10)\nprint(a[[1, 1, 3]].sum() + a[::3].sum())", 23,
  "Fancy indexing may repeat: 1 + 1 + 3 = 5. a[::3] = 0, 3, 6, 9 → 18. Total 23.", "Index arrays may repeat indices; ::3 starts at 0.", "Starting ::3 at index 3, or de-duplicating the fancy index.");
trace("np-idx-t3", "np-indexing", 2, 45, "a = np.arange(9).reshape(3, 3)\nprint(a[[0, 2], [1, 2]].sum())", 9,
  "The index arrays pair up: a[0, 1] = 1 and a[2, 2] = 8 → 9.", "Two index arrays select points, not a block.", "Reading it as the 2×2 block (1 + 2 + 7 + 8 = 18).");
Card_("np-idx-c1", "a[[r1, r2], [c1, c2]]", "Points (r1, c1) and (r2, c2), not a block; block = a[np.ix_(rows, cols)].", "np-indexing");
Card_("np-idx-c2", "Combining masks", "(a > 0) & (a < 5); never and / or.", "np-indexing");

npTopic("np-broadcast", "Broadcasting and vectorisation", "How arrays of different shapes combine, and replacing loops with array expressions.", `
**Vectorisation.** Write the computation on whole arrays (\`x * w + b\`, \`np.exp(z)\`) rather than looping over elements in Python. Typically 10–100× faster, and shorter.

**Broadcasting rules.** Compare shapes from the **right**. Two dimensions are compatible if they are equal or one of them is 1; missing leading dimensions count as 1. The size-1 dimensions are stretched (virtually, without copying).

- (3, 4) + (4,) → (3, 4): the row is added to every row.
- (3, 4) + (3, 1) → (3, 4): the column is added to every column.
- (3, 1) + (1, 4) → (3, 4): an outer sum.
- (2, 3) + (2,) → error: 3 vs 2 on the right. Reshape to (2, 1) first.

**Patterns.**

- Centre columns: \`X - X.mean(axis=0)\`. Centre rows: \`X - X.mean(axis=1, keepdims=True)\` (keepdims keeps shape (n, 1) so it broadcasts).
- Standardise: \`(X - X.mean(0)) / X.std(0)\`.
- Pairwise squared distances between rows of A (m, d) and B (n, d): \`((A[:, None, :] - B[None, :, :]) ** 2).sum(-1)\` → (m, n). Memory m·n·d; for big inputs use ‖a‖² + ‖b‖² − 2a·b.
- Stable softmax per row: \`e = np.exp(Z - Z.max(axis=1, keepdims=True)); e / e.sum(axis=1, keepdims=True)\`.
- One-hot: \`(labels[:, None] == np.arange(k)).astype(int)\`.

**Ufuncs.** Element-wise functions (\`np.exp\`, \`np.maximum\`, \`np.clip\`, \`np.abs\`) broadcast too. Prefer them to \`np.vectorize\`, which is just a Python loop.

**Worked example 1.** \`np.arange(3)[:, None] * np.arange(4)\` is the 3×4 multiplication table; its sum is (0 + 1 + 2)(0 + 1 + 2 + 3) = 18.

**Worked example 2.** X = [[1, 2], [3, 6]]: column means (2, 4); centred X = [[−1, −2], [1, 2]].

**Worked example 3.** A row of logits (1000, 1001): np.exp overflows, but subtracting the max gives exp(−1), exp(0) → softmax (0.2689, 0.7311).

**Worked example 4.** labels [2, 0] with k = 3 → one-hot [[0, 0, 1], [1, 0, 0]].
`, [FCC, NP_DOC("user/basics.broadcasting.html", "broadcasting"), R("Python Data Science Handbook: computation on arrays, broadcasting", "https://jakevdp.github.io/PythonDataScienceHandbook/02.05-computation-on-arrays-broadcasting.html")], "np/broadcast", [
  iq("State NumPy's broadcasting rules.", "Align shapes on the right. Each pair of dimensions must be equal or contain a 1; missing leading dimensions are treated as 1. Dimensions of size 1 are stretched to match. If any pair differs and neither is 1, NumPy raises an error.", ["Right-aligned", "Equal or 1", "Missing dims = 1 / error otherwise"]),
  iq("Compute the pairwise Euclidean distances between two sets of points without loops.", "With A (m, d) and B (n, d): D = np.sqrt(((A[:, None, :] - B[None, :, :]) ** 2).sum(axis=-1)), shape (m, n). For large inputs avoid the (m, n, d) temporary: D² = (A²).sum(1)[:, None] + (B²).sum(1)[None, :] − 2 A @ Bᵀ, clipped at 0 before the square root.", ["Broadcast with new axes", "Sum over the feature axis", "Memory-efficient expansion"]),
  iq("How do you implement a numerically stable softmax in NumPy?", "Subtract the row maximum before exponentiating: e = np.exp(z − z.max(axis=-1, keepdims=True)); return e / e.sum(axis=-1, keepdims=True). Softmax is unchanged by a constant shift, and the largest exponent becomes e⁰ = 1, so nothing overflows.", ["Subtract the max", "Shift invariance", "keepdims for broadcasting"]),
]);
trace("np-bc-t1", "np-broadcast", 2, 45, "a = np.arange(3).reshape(3, 1)\nb = np.arange(4)\nprint((a * b).sum())", 18,
  "(3, 1) × (4,) broadcasts to a 3×4 outer product; its sum is (0 + 1 + 2) × (0 + 1 + 2 + 3) = 18.", "Column × row = outer product.", "Expecting an element-wise product of matching shapes, or an error.");
trace("np-bc-t2", "np-broadcast", 1, 45, "X = np.array([[1., 2.], [3., 6.]])\nZ = X - X.mean(axis=0)\nprint(Z[1, 1])", 2,
  "Column means are (2, 4); Z[1, 1] = 6 − 4 = 2.0.", "axis=0 averages down the rows → one mean per column.", "Using the row mean (4.5) instead.");
trace("np-bc-t3", "np-broadcast", 2, 45, "a = np.ones((2, 3))\nb = np.ones(2)\ntry:\n    a + b\n    print(1)\nexcept ValueError:\n    print(0)", 0,
  "Right-aligned, the shapes compare 3 with 2: neither is 1, so broadcasting fails with a ValueError.", "Compare shapes from the right.", "Aligning from the left and expecting (2,) to match the first axis.");
Card_("np-bc-c1", "Broadcasting rule", "Right-align shapes; each pair equal or 1.", "np-broadcast");
Card_("np-bc-c2", "Row-wise ops", "Use keepdims=True so (n,) stats become (n, 1) and broadcast across columns.", "np-broadcast");

npTopic("np-reductions", "Axes, reductions and aggregation", "sum, mean, argmax, cumsum and unique along the right axis.", `
**Axis meaning.** \`axis=k\` is the axis that gets **collapsed**. For a 2-D array, \`axis=0\` goes down the rows and gives one value per column; \`axis=1\` goes across and gives one value per row. No axis → over everything.

**Reductions.** \`sum\`, \`mean\`, \`std\` (ddof=0 by default, the population formula; pandas defaults to ddof=1), \`var\`, \`min\`, \`max\`, \`prod\`, \`any\`, \`all\`, \`median\`, \`percentile\` / \`quantile\`. NaN-aware versions: \`np.nanmean\` etc. \`keepdims=True\` keeps the collapsed axis with length 1, for broadcasting back.

**Arg-functions.** \`argmax\` / \`argmin\` return positions; without an axis they index the **flattened** array (\`np.unravel_index(i, a.shape)\` converts back). Ties → the first occurrence.

**Cumulative.** \`cumsum\`, \`cumprod\`, \`np.diff\` (n − 1 values). Moving average of width w: \`c = np.cumsum(np.insert(x, 0, 0)); (c[w:] - c[:-w]) / w\`.

**Counting and grouping.**

- \`np.unique(x, return_counts=True)\` → sorted unique values and counts; \`return_inverse=True\` gives each element's group id.
- \`np.bincount(ids, weights=v)\` sums v per group id; divided by \`np.bincount(ids)\` gives group means.
- \`np.histogram(x, bins)\`, \`np.digitize(x, edges)\`.

**Worked example 1.** a = [[1, 5, 2], [7, 0, 3]]: \`a.sum(axis=0)\` = [8, 5, 5]; \`a.sum(axis=1)\` = [8, 10]; \`a.argmax()\` = 3 (the 7 in flattened order).

**Worked example 2.** \`np.std([1, 2, 3, 4])\` = 1.118 (ddof 0); with ddof=1, 1.291.

**Worked example 3.** Moving average of [1, 2, 3, 4, 5] with w = 2: [1.5, 2.5, 3.5, 4.5].

**Worked example 4.** values [10, 20, 30, 40], labels [1, 0, 1, 0]: \`np.bincount(labels, weights=values)\` = [60, 40]; counts [2, 2] → means [30, 20].
`, [FCC, NP_DOC("reference/routines.statistics.html", "statistics routines"), R("Python Data Science Handbook: aggregations", "https://jakevdp.github.io/PythonDataScienceHandbook/02.04-computation-on-arrays-aggregates.html")], "np/reduce", [
  iq("For a 2-D array, what does axis=0 mean in X.mean(axis=0)?", "The axis that is collapsed: the mean runs down the rows, giving one value per column (shape (n_cols,)). It's what you use to get per-feature statistics when rows are samples.", ["Collapsed axis", "One value per column", "Per-feature statistics"]),
  iq("np.std and pandas .std() give different answers on the same data. Why?", "NumPy defaults to ddof=0 (divide by n, the population formula); pandas defaults to ddof=1 (divide by n − 1, the sample estimate). Pass ddof explicitly to make them agree.", ["ddof=0 vs ddof=1", "n vs n − 1", "Pass ddof"]),
  iq("How do you compute the mean of a value per category with NumPy only?", "Map categories to integer ids with np.unique(labels, return_inverse=True), then sums = np.bincount(ids, weights=values), counts = np.bincount(ids), means = sums / counts. It's O(n) and loop-free.", ["unique with return_inverse", "bincount with weights", "Divide by counts"]),
]);
trace("np-red-t1", "np-reductions", 2, 45, "a = np.array([[1, 5, 2], [7, 0, 3]])\nprint(a.argmax() * 10 + a.argmax(axis=1).sum())", 31,
  "Flattened, the max 7 is at index 3 → 30. Per row: argmax is 1 (the 5) and 0 (the 7) → 1. Total 31.", "argmax without an axis indexes the flattened array.", "Expecting argmax() to return a (row, col) pair.");
trace("np-red-t2", "np-reductions", 2, 45, "a = np.array([[1, 2], [3, 4]])\nprint(a.sum(axis=0, keepdims=True).shape[0] + a.cumsum()[-2])", 7,
  "keepdims gives shape (1, 2) → 1. cumsum flattens: 1, 3, 6, 10; [-2] = 6. Total 7.", "keepdims keeps the collapsed axis as length 1; cumsum without an axis flattens.", "Thinking keepdims gives shape (2,).");
trace("np-red-t3", "np-reductions", 1, 45, "x = np.array([3, 1, 3, 2, 1, 3])\nvals, counts = np.unique(x, return_counts=True)\nprint(vals[counts.argmax()] * 100 + counts.max())", 303,
  "unique → values 1, 2, 3 with counts 2, 1, 3. The mode is 3 with count 3: 300 + 3.", "unique(return_counts=True) + argmax = mode.", "Using the index of the max count (2) instead of the value.");
Card_("np-red-c1", "axis=k", "The axis that disappears: axis=0 → one result per column.", "np-reductions");
Card_("np-red-c2", "Group means without pandas", "ids from np.unique(return_inverse=True); bincount(ids, weights) / bincount(ids).", "np-reductions");

npTopic("np-linalg", "Linear algebra and random numbers", "Matrix products, solving systems, least squares, and reproducible randomness.", `
**Products.** \`*\` is element-wise; \`@\` (or \`np.matmul\`) is the matrix product: (m, k) @ (k, n) → (m, n). For 1-D arrays \`a @ b\` is the dot product. \`@\` broadcasts over leading batch dimensions: (B, m, k) @ (B, k, n). \`np.einsum\` writes any contraction explicitly, e.g. \`np.einsum("ij,ij->i", A, B)\` for row-wise dot products.

**Solving and inverting.** For Ax = b use \`np.linalg.solve(A, b)\`, never \`inv(A) @ b\`: it's faster and more accurate. \`np.linalg.det\`, \`np.linalg.inv\` exist but are rarely needed. \`np.linalg.cond(A)\` large → ill-conditioned (small changes in b give big changes in x).

**Least squares.** For more equations than unknowns, \`np.linalg.lstsq(X, y, rcond=None)[0]\` minimises ‖Xw − y‖². Add a column of ones for the intercept: \`X = np.column_stack([np.ones(n), x])\`. Same answer as the normal equations (XᵀX)⁻¹Xᵀy, but numerically safer.

**Decompositions.** \`np.linalg.eig\` / \`eigh\` (symmetric: real eigenvalues, sorted ascending), \`np.linalg.svd\` (PCA: centre X, then the right singular vectors are the principal directions and s²/(n − 1) the variances), \`np.linalg.norm\` (L2 by default; \`axis=1\` for row norms).

**Random numbers.** Use the Generator API: \`rng = np.random.default_rng(seed)\`, then \`rng.random\`, \`rng.normal(mu, sd, size)\`, \`rng.integers(lo, hi, size)\` (hi excluded), \`rng.choice(a, size, replace)\`, \`rng.permutation\`. The same seed gives the same sequence, which makes experiments reproducible. Pass the rng into functions instead of reseeding global state (\`np.random.seed\` is the legacy API).

**Worked example 1.** A = [[2, 0], [1, 3]], B = [[1, 4], [2, 1]]: (A @ B)[1] = [1·1 + 3·2, 1·4 + 3·1] = [7, 7]; (A * B)[1] = [2, 3].

**Worked example 2.** 2x + y = 3, x + 3y = 5 → solve gives x = 0.8, y = 1.4.

**Worked example 3.** Points (0, 1), (1, 3), (2, 5): lstsq on [1, x] gives intercept 1, slope 2.

**Worked example 4.** Bootstrap: \`idx = rng.integers(0, n, size=(B, n)); means = x[idx].mean(axis=1)\` draws B resamples in one shot.
`, [FCC, NP_DOC("reference/routines.linalg.html", "linear algebra (numpy.linalg)"), NP_DOC("reference/random/generator.html", "random Generator")], "np/linalg", [
  iq("Why use np.linalg.solve instead of computing the inverse?", "solve factorises A (LU) and back-substitutes, which costs fewer operations and loses less precision than forming A⁻¹ and multiplying. Explicit inverses amplify rounding errors for ill-conditioned matrices, and you rarely need A⁻¹ itself.", ["Faster", "More accurate / conditioning", "Inverse rarely needed"]),
  iq("How do you make NumPy random results reproducible across a project?", "Create a Generator with np.random.default_rng(seed) once and pass it (or child generators from rng.spawn / SeedSequence) to the functions that need randomness, rather than calling np.random.seed on global state. Record the seed with the results.", ["default_rng(seed)", "Pass the generator around", "Avoid global state"]),
  iq("Explain the difference between *, @ and np.dot.", "* multiplies element-wise with broadcasting. @ is matrix multiplication and broadcasts over leading batch dimensions. np.dot equals @ for 1-D and 2-D arrays, but for higher dimensions it contracts the last axis of a with the second-to-last of b in a different way; prefer @ for clarity.", ["Element-wise", "Matrix product with batching", "dot differs for N-D"]),
]);
trace("np-la-t1", "np-linalg", 1, 60, "A = np.array([[2, 0], [1, 3]])\nB = np.array([[1, 4], [2, 1]])\nprint((A @ B)[1, 1] - (A * B)[1, 1])", 4,
  "(A @ B)[1, 1] = 1·4 + 3·1 = 7; (A * B)[1, 1] = 3·1 = 3; 7 − 3 = 4.", "@ is the matrix product, * is element-wise.", "Treating * as a matrix product.");
trace("np-la-t2", "np-linalg", 2, 60, "A = np.array([[2., 1.], [1., 3.]])\nb = np.array([3., 5.])\nx = np.linalg.solve(A, b)\nprint(round(x[1], 4))", 1.4,
  "2x + y = 3 and x + 3y = 5 → x = 0.8, y = 1.4.", "solve returns x with A @ x = b.", "Solving xA = b (using the transpose).");
trace("np-la-t3", "np-linalg", 1, 30, "rng = np.random.default_rng(0)\na = rng.integers(0, 10, size=5)\nrng2 = np.random.default_rng(0)\nb = rng2.integers(0, 10, size=5)\nprint(int((a == b).all()))", 1,
  "Two generators with the same seed produce the same sequence, so a and b are equal: 1.", "Same seed → same stream.", "Thinking every call is random regardless of the seed.");
Card_("np-la-c1", "Ax = b", "np.linalg.solve(A, b), not inv(A) @ b.", "np-linalg");
Card_("np-la-c2", "Reproducible randomness", "rng = np.random.default_rng(seed); pass rng around.", "np-linalg");
