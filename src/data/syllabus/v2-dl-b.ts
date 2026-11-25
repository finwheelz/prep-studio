/**
 * v2 Deep learning, part B: Training deep nets (second half) · Regularisation and debugging.
 */
import { iq, lessonWriter } from "./v2-shared";
import { D } from "./v2-dl-sources";

const { L, Q, C } = lessonWriter("dl");
const TD = "Training deep nets";
const RD = "Regularisation and debugging";

L("dl-lr-schedules", TD, "Learning-rate schedules and batch size", "Warm-up, step and cosine decay, the linear scaling rule, and finding a good learning rate.", {
  kind: "concept", mins: 20, prereq: ["dl-optimisers"],
  hook: "Training diverges in the first 200 steps, but the same learning rate is fine after step 2,000. What do you add?",
  intuition: `
**The situation.** The learning rate is the most important hyperparameter. One fixed value is rarely right for the whole run: early on, weights and optimiser statistics are poorly calibrated and big steps are dangerous; late in training, big steps bounce around the minimum instead of settling into it.

**The idea.**

- **Warm-up:** start small and ramp up linearly over the first few hundred or thousand steps. Gives Adam's moment estimates and normalisation statistics time to settle; essential for transformers and large batches.
- **Decay:** lower the learning rate as training progresses so the model can settle. Step decay (×0.1 at fixed epochs), **cosine** decay (smooth fall to near zero), or linear decay.
- **Batch size and learning rate are linked.** A bigger batch gives a less noisy gradient, so you can take bigger steps: the **linear scaling rule** multiplies the learning rate by the same factor as the batch size (up to a point, with warm-up).
`,
  maths: `
**In one breath.** Warm-up $\\eta_t = \\eta_{max}\\,t/T_w$; cosine $\\eta_t = \\eta_{min} + \\tfrac12(\\eta_{max} - \\eta_{min})(1 + \\cos(\\pi t/T))$; linear scaling $\\eta \\propto B$.

**Worked examples.**

- Warm-up to $3 \\times 10^{-4}$ over 1,000 steps: at step 250, $\\eta = 7.5 \\times 10^{-5}$.
- Cosine from $10^{-3}$ to 0: halfway through, $\\eta = 5 \\times 10^{-4}$; at the end, 0.
- ResNet recipe lr 0.1 at batch 256 → batch 1,024 uses lr 0.4 (with warm-up).
- Step decay 0.1 → ×0.1 at epochs 30 and 60: epoch 65 uses 0.001.

**Finding the learning rate (LR range test).** Train briefly while increasing the learning rate exponentially each step; plot loss against learning rate; pick a value somewhat below where the loss falls fastest (often ~1/10 of where it starts to blow up).

**Batch-size effects.** Larger batches: better hardware utilisation, fewer steps, but each example is seen fewer times per update and beyond a "critical batch size" returns diminish. Smaller batches: more gradient noise, which can act as regularisation.

| Schedule | Shape | Typical use |
|---|---|---|
| Step | flat, drops ×0.1 | classic CNN recipes |
| Cosine (+ warm-up) | smooth to ~0 | most modern training, LLMs |
| One-cycle | up then down | fast training of CNNs |
| Reduce-on-plateau | drops when validation stalls | small projects |
| Warm restarts (SGDR) | repeated cosine cycles | snapshot ensembles |
`,
  practice: `
**Defaults.** AdamW, warm-up for 1–5% of steps, cosine decay to ~10% of the peak. Retune the peak learning rate when you change batch size, model size or optimiser.

**Signals.** Loss spikes early → longer warm-up or lower peak. Loss plateaus high → learning rate too low or decayed too early. Validation keeps improving at the end of the schedule → train longer.
`,
  traps: [
    { trap: "Find the best learning rate once and reuse it for every batch size.", why: "The best learning rate scales with batch size (roughly linearly, up to a point). Changing one without the other changes training dynamics." },
    { trap: "Warm-up is only for Adam.", why: "It's most important with adaptive optimisers and transformers, but large-batch SGD also needs it (the linear scaling rule breaks early in training without warm-up)." },
    { trap: "Lower learning rates are always safer.", why: "Too low wastes compute, can stall on plateaus and may generalise worse (less noise). Safe means 'stable', not 'tiny'." },
  ],
  say: {
    prompt: "How do you choose and schedule the learning rate for training a deep network?",
    secs: 45,
    check: ["Learning rate as the most important hyperparameter; LR range test", "Warm-up and why (unstable early statistics)", "Decay: cosine/step/linear and why (settling)", "Linear scaling rule with batch size", "Reading loss curves to adjust"],
    followups: [
      { q: "Why does warm-up help transformers?", a: "Early on, Adam's second-moment estimates are based on few steps and the residual stream isn't calibrated, so full-size steps can push weights into unstable regions. Ramping up avoids early divergence." },
      { q: "What is the linear scaling rule and when does it break?", a: "Multiply the learning rate by k when you multiply the batch size by k. It breaks at very large batches (beyond the critical batch size) and early in training without warm-up." },
      { q: "Cosine vs step decay?", a: "Both lower the rate over time; cosine is smooth with no extra hyperparameters for drop epochs and is the modern default. Step decay is the classic ImageNet recipe." },
    ],
    answer: `I'd start with an LR range test: increase the learning rate exponentially over a short run and pick a value a bit below where the loss drops fastest. Then I schedule it: a linear warm-up over the first percent or so of steps, because early on the optimiser statistics and activations aren't calibrated and full-size steps can diverge, followed by cosine decay so the model settles into a minimum at the end.

When I change the batch size I scale the learning rate roughly linearly, with warm-up, and I keep watching the curves: early spikes mean a longer warm-up or lower peak, and a high plateau means the rate is too low or decays too soon.`,
    avoid: ["One fixed learning rate for the whole run", "Changing batch size without retuning"],
  },
  terms: [["Warm-up", "Ramp the learning rate up from ~0 at the start."], ["Cosine decay", "η falls along half a cosine to η_min."], ["Linear scaling rule", "Scale learning rate with batch size."], ["LR range test", "Short run with exponentially increasing LR to find a good value."]],
  sources: [D.smith, D.sgdr, D.csNN3],
});
Q({ id: "dl-lrs-1", d: 1, secs: 45, prompt: "Cosine decay from 0.001 to 0 over T steps. Learning rate at t = T/2? (4 decimals)", answer: 0.0005, tol: 0.00002, explain: "½ × 0.001 × (1 + cos(π/2)) = 0.0005.", py: "import math\nanswer = 0 + 0.5*(1e-3-0)*(1+math.cos(math.pi*0.5))" });
Q({ id: "dl-lrs-2", d: 1, secs: 30, prompt: "Recipe: lr 0.1 at batch 256. Linear scaling rule for batch 1,024?", answer: 0.4, tol: 0.002, explain: "4× the batch → 4× the learning rate.", py: "answer = 0.1*1024/256" });
Q({ id: "dl-lrs-3", d: 1, secs: 30, prompt: "Linear warm-up to 3 × 10⁻⁴ over 1,000 steps. Learning rate at step 250, in units of 10⁻⁵?", answer: 7.5, tol: 0.02, explain: "3e−4 × 250/1000 = 7.5e−5.", py: "answer = 3e-4*250/1000/1e-5" });
Q({ id: "dl-lrs-4", d: 2, secs: 45, prompt: "Step schedule: start 0.1, multiply by 0.1 at epochs 30 and 60. Learning rate at epoch 65? (4 decimals)", answer: 0.001, tol: 0.00002, explain: "Two drops: 0.1 → 0.01 → 0.001.", py: "lr = 0.1\nfor m in [30, 60]:\n    if 65 >= m:\n        lr *= 0.1\nanswer = lr" });
C("dl-lrs-c1", "Default schedule", "Linear warm-up (1–5% of steps) then cosine decay.");
C("dl-lrs-c2", "Linear scaling rule", "Batch × k → learning rate × k (with warm-up, up to a point).");

L("dl-mixed-precision", TD, "Mixed precision and gradient accumulation", "Training in fp16/bf16 safely, loss scaling, and simulating big batches on small GPUs.", {
  kind: "concept", mins: 20, prereq: ["dl-params-flops"],
  hook: "Switching to fp16 doubled your throughput, but the model stopped learning. Many gradients are exactly zero. Why?",
  intuition: `
**The situation.** Modern GPUs do half-precision (16-bit) maths several times faster than 32-bit and halve memory for activations. But 16-bit numbers have limited range and precision.

**fp16** has a small range: values above 65,504 overflow to infinity and tiny values (below ~6e-8) underflow to zero. Small gradients simply disappear. **bf16** keeps fp32's range (8 exponent bits) with less precision, so underflow/overflow is rarely a problem; it's the default on recent hardware.

**Mixed precision** does the heavy maths (matmuls, convolutions) in 16-bit, keeps a 32-bit **master copy** of the weights for updates (tiny updates would otherwise be rounded away), and, for fp16, multiplies the loss by a large **loss scale** before backprop so small gradients stay representable, dividing it out before the update.

**Gradient accumulation** handles the other memory problem: when a big batch doesn't fit, run several small micro-batches, add up their gradients, and step once.
`,
  maths: `
**In one breath.** Effective batch $= \\text{micro-batch} \\times \\text{accumulation steps} \\times \\text{devices}$; fp16 max ≈ 65,504, smallest positive ≈ $6 \\times 10^{-8}$; loss scaling multiplies gradients by $S$ (e.g. $2^{10}$–$2^{16}$) and divides before the optimiser step.

**Worked examples.**

- A gradient of $10^{-8}$ stored in fp16 becomes exactly 0. Scaled by 1,024 it is $\\approx 1.025 \\times 10^{-5}$: representable.
- Micro-batch 8, 16 accumulation steps, 1 GPU: effective batch 128. Divide the loss by 16 (or average) so the gradient matches a true batch of 128.
- fp32 master weights: an update of $10^{-4}$ on a weight of 1.0 is lost in fp16 (its spacing near 1 is ~$10^{-3}$) but kept in fp32.

| Format | Exponent bits | Mantissa bits | Range | Use |
|---|---|---|---|---|
| fp32 | 8 | 23 | ~1e±38 | master weights, optimiser state |
| fp16 | 5 | 10 | ~6e−8 to 65,504 | compute (with loss scaling) |
| bf16 | 8 | 7 | ~1e±38 | compute, no loss scaling needed |
| fp8 / int8 | — | — | small | inference, some cutting-edge training |

**Dynamic loss scaling.** Start with a large scale; if any gradient overflows (inf/NaN), skip the step and halve the scale; after many good steps, double it.
`,
  practice: `
**PyTorch.** \`torch.autocast(device_type="cuda", dtype=torch.bfloat16)\` around the forward pass; with fp16 also use \`GradScaler\`. Keep softmax/normalisation/loss reductions in fp32 (autocast does this).

**Accumulation details.** Call \`optimizer.step()\` and \`zero_grad()\` only every k micro-batches; scale the loss by 1/k; BatchNorm still sees only the micro-batch.
`,
  traps: [
    { trap: "Just cast the whole model to fp16.", why: "Updates and some reductions need fp32: tiny updates round to zero and small gradients underflow. Mixed precision keeps fp32 master weights and uses loss scaling (fp16)." },
    { trap: "Gradient accumulation is identical to a bigger batch.", why: "For the gradient yes (if the loss is averaged correctly), but BatchNorm statistics are still computed per micro-batch, and wall-clock time is longer." },
    { trap: "bf16 needs loss scaling like fp16.", why: "bf16 has the same exponent range as fp32, so underflow of gradients is rarely a problem; loss scaling is usually unnecessary." },
  ],
  say: {
    prompt: "Explain mixed-precision training and the problems it has to solve.",
    secs: 45,
    check: ["16-bit compute for speed/memory; fp32 master weights for updates", "fp16 range: overflow above 65,504, underflow of small gradients", "Loss scaling (dynamic) to keep gradients representable", "bf16: fp32 range, less precision, no scaling needed", "Gradient accumulation for effective batch size"],
    followups: [
      { q: "Why keep fp32 master weights?", a: "Updates are often much smaller than the weights; in 16-bit, w + Δw rounds back to w. Accumulating updates in fp32 preserves them." },
      { q: "What happens when the loss scale is too big?", a: "Gradients overflow to inf/NaN; dynamic scaling detects this, skips the step and halves the scale." },
      { q: "How do you get an effective batch of 512 on a GPU that fits 32?", a: "Accumulate gradients over 16 micro-batches (dividing each loss by 16) before stepping, or combine accumulation with data parallelism across GPUs." },
    ],
    answer: `Mixed precision runs the expensive operations, matrix multiplies and convolutions, in 16-bit for speed and memory, while keeping an fp32 master copy of the weights and optimiser state so small updates aren't rounded away. With fp16 the main problem is range: small gradients underflow to zero and large values overflow, so we multiply the loss by a big scale factor before backprop and divide it out before the update, adjusting the scale dynamically when overflows appear.

bf16 has the same exponent range as fp32, so it usually needs no loss scaling, which is why it's the default on newer GPUs. When a batch doesn't fit at all, gradient accumulation sums gradients over several micro-batches before one optimiser step to get the same effective batch size.`,
    avoid: ["\u201cConvert everything to fp16\u201d", "Ignoring loss scaling with fp16"],
  },
  terms: [["Mixed precision", "16-bit compute, fp32 master weights."], ["Loss scaling", "Multiply loss by S to keep fp16 gradients from underflowing."], ["bf16", "16-bit float with fp32's exponent range."], ["Gradient accumulation", "Sum gradients over micro-batches before stepping."]],
  sources: [D.mixed, D.d2l],
});
Q({ id: "dl-mp-1", d: 1, secs: 30, prompt: "Largest finite fp16 value?", answer: 65504, tol: 0.5, explain: "fp16's maximum is 65,504; beyond it values become inf.", py: "import numpy as np\nanswer = float(np.finfo(np.float16).max)", packages: ["numpy"] });
Q({ id: "dl-mp-2", d: 2, secs: 45, prompt: "A gradient of 1e−8 is stored in fp16. What value results?", answer: 0, tol: 0.0000001, explain: "It's below fp16's smallest subnormal (~6e−8), so it underflows to 0. Loss scaling prevents this.", py: "import numpy as np\nanswer = float(np.float16(1e-8))", packages: ["numpy"] });
Q({ id: "dl-mp-3", d: 2, secs: 60, prompt: "Same gradient with loss scale 1,024, stored in fp16. Value in units of 10⁻⁵? (3 decimals)", answer: 1.025, tol: 0.002, explain: "1.024e−5 is representable (≈ 1.0252e−5 after rounding), so the information survives; divide by 1,024 in fp32 before the update.", py: "import numpy as np\nanswer = float(np.float16(1e-8*1024))*1e5", packages: ["numpy"] });
Q({ id: "dl-mp-4", d: 1, secs: 20, prompt: "Micro-batch 8, accumulate 16 steps, 4 GPUs with data parallelism. Effective batch size?", answer: 512, tol: 0.5, explain: "8 × 16 × 4 = 512.", py: "answer = 8*16*4" });
C("dl-mp-c1", "fp16 vs bf16", "fp16: 5 exponent bits, needs loss scaling. bf16: fp32 range, less precision.");
C("dl-mp-c2", "Effective batch", "micro-batch × accumulation steps × devices.");

L("dl-training-practice", TD, "Training deep nets practice", "Six interview scenarios on initialisation, gradients, normalisation, optimisers and schedules.", {
  kind: "interview", mins: 30, prereq: ["dl-init", "dl-vanishing", "dl-norm", "dl-optimisers", "dl-lr-schedules", "dl-mixed-precision"],
  hook: "Answer each scenario out loud in about a minute, then open it and tick off the points the interviewer is listening for.",
}, [
  iq("A 50-layer plain CNN (no skip connections) trains worse than a 20-layer one, even on training data. Explain and fix.", "This is the degradation problem: deeper plain nets are harder to optimise (gradients through many layers vanish or are poorly conditioned), so training error is higher, which isn't overfitting. Fix with residual connections (identity shortcuts), BatchNorm, He initialisation, and a learning-rate warm-up.", ["Training error higher → optimisation, not overfitting", "Vanishing / poor conditioning through depth", "Residual connections", "Normalisation / init / warm-up"]),
  iq("Your transformer's loss spikes to NaN at random points mid-training. What do you try?", "Check for fp16 overflow (switch to bf16 or dynamic loss scaling), clip the global gradient norm (e.g. 1.0), lower the peak learning rate or lengthen warm-up, use β₂ = 0.95, pre-norm blocks, and check for bad data batches. Log gradient norms and the batch indices around spikes; resume from the last good checkpoint.", ["Precision / loss scaling", "Gradient clipping", "Learning rate / warm-up / β₂", "Pre-norm, bad-data check", "Logging and checkpoint restarts"]),
  iq("You doubled the batch size to speed up training and accuracy dropped. Why, and what do you change?", "With the same learning rate and number of epochs, a bigger batch means half as many updates and less gradient noise. Scale the learning rate (roughly linearly) with warm-up, and possibly train for more steps; check you're not beyond the critical batch size where gains vanish.", ["Fewer updates per epoch", "Linear scaling rule + warm-up", "Generalisation / noise argument", "Critical batch size"]),
  iq("When would you choose SGD with momentum over AdamW?", "For CNNs on vision tasks where well-tuned SGD + momentum with a step or cosine schedule often generalises slightly better and uses less memory (one state vs two). AdamW is the default for transformers and when you want fast, robust convergence with little tuning.", ["Vision CNNs, generalisation", "Memory (1 vs 2 states)", "AdamW for transformers / robustness", "Needs schedule tuning"]),
  iq("BatchNorm model works in training mode but predictions are bad in deployment. Diagnose.", "Inference must use running statistics via model.eval(); check it's called. If it is, the running statistics may be unrepresentative: tiny training batches, a frozen backbone whose BN layers kept updating, or a train/deployment distribution shift. Recompute statistics on representative data, use larger batches or swap to GroupNorm/LayerNorm.", ["model.eval() / running stats", "Small batches → poor estimates", "Fine-tuning with BN in train mode", "Distribution shift; GroupNorm/LN alternatives"]),
  iq("How would you fit a model whose batch of 256 needs 80 GB of activations on a 40 GB GPU?", "Gradient accumulation (two micro-batches of 128, or more), gradient checkpointing to recompute activations, bf16 mixed precision to halve activation memory, and if there are several GPUs, data parallelism or sharding. Keep the effective batch and learning rate consistent.", ["Gradient accumulation", "Activation checkpointing", "Mixed precision", "Multi-GPU parallelism/sharding", "Keep effective batch/LR consistent"]),
]);

// ───────────────────────── Regularisation and debugging ─────────────────────────

L("dl-dropout", RD, "Dropout", "Randomly dropping units during training: inverted scaling, why it regularises, and where it's used now.", {
  kind: "concept", mins: 20, prereq: ["gen-bv", "dl-mlp"],
  hook: "Dropout switches off half the network at random every step. Why does that make the final model better rather than worse?",
  intuition: `
**The situation.** Big networks can memorise training data. Units start relying on very specific combinations of other units (**co-adaptation**) that don't generalise.

**The idea.** During training, set each unit's output to zero with probability $p$, independently on every forward pass. Each step trains a different random sub-network that shares weights with all the others. A unit can't count on any particular partner being present, so it has to learn features that are useful on their own. At test time, use the full network: it behaves like an average over the exponentially many sub-networks, a cheap ensemble.

**Inverted dropout** scales the surviving activations by $1/(1 - p)$ during training, so their expected value matches test time and nothing needs changing at inference.

**Where it's used now.** Classic in MLPs and the classifier heads of CNNs; in transformers on attention weights and residual outputs (often small, 0.0–0.1). Large pretrained LLMs often use little or none, relying on data volume.
`,
  maths: `
**In one breath.** Training: $\\tilde a = a \\odot m/(1 - p)$ with $m_i \\sim \\text{Bernoulli}(1 - p)$; inference: $\\tilde a = a$. Expected value is preserved: $\\mathbb{E}[\\tilde a_i] = a_i$.

**Worked examples.**

- $p = 0.2$ (keep 0.8): a kept activation of 2 becomes $2/0.8 = 2.5$.
- 512 units with $p = 0.5$: about 256 active per step.
- $n$ droppable units define $2^n$ sub-networks; 10 units → 1,024.

**Regularisation view.** For linear regression, dropout on the inputs is equivalent in expectation to an L2 penalty scaled by each feature's variance. More generally it injects multiplicative noise, like data augmentation in feature space.

**MC dropout.** Keep dropout on at inference and average several forward passes: a rough estimate of predictive uncertainty (the spread of predictions).

| Setting | Typical $p$ |
|---|---|
| Fully connected hidden layers | 0.2–0.5 |
| Input layer | ≤ 0.2 |
| Conv layers | small or spatial dropout |
| Transformers (attention, residual) | 0.0–0.1 |
`,
  practice: `
**Rules.** Always call \`model.eval()\` for inference so dropout is off (and \`model.train()\` to turn it back on). Expect training loss to be higher than validation loss with dropout on; that's normal. Combine with weight decay and early stopping; reduce dropout if the model underfits.

**Interaction with BatchNorm.** Dropout before BatchNorm shifts variance between train and test; common practice is to avoid heavy dropout in BN-heavy conv stacks.
`,
  traps: [
    { trap: "Multiply activations by (1 − p) at test time.", why: "That's the original formulation. Modern frameworks use inverted dropout, scaling by 1/(1 − p) during training, so inference uses activations as-is. Doing both double-corrects." },
    { trap: "Training loss above validation loss means something's broken.", why: "With dropout (and augmentation) active only in training, the training loss is measured on a handicapped network. Compare in eval mode if you need a like-for-like number." },
    { trap: "More dropout is always safer.", why: "Too much dropout underfits: high bias, slow training. Tune p like any regulariser." },
  ],
  say: {
    prompt: "How does dropout work and why does it reduce overfitting?",
    secs: 45,
    check: ["Randomly zero units with probability p each training step", "Inverted scaling 1/(1 − p) so inference needs no change; off at eval", "Prevents co-adaptation; implicit ensemble of sub-networks", "Typical rates and where used (MLPs, heads, transformers small)", "Interaction with eval mode / MC dropout for uncertainty"],
    followups: [
      { q: "Why is dropout like an ensemble?", a: "Each step trains a different thinned sub-network with shared weights; using the full network with scaled activations at test time approximates averaging the predictions of all those sub-networks." },
      { q: "What is MC dropout?", a: "Leaving dropout on at inference and averaging many stochastic forward passes; the spread of the predictions gives an estimate of model uncertainty." },
      { q: "Why do large LLMs use little dropout?", a: "They're trained on so much data, often for about one epoch, that overfitting is limited; dropout would slow learning for little gain." },
    ],
    answer: `During training, dropout zeroes each unit's output with probability p, independently on every forward pass, and scales the survivors by 1/(1 − p) so the expected activation is unchanged; at inference it's switched off and the full network is used.

It reduces overfitting because no unit can rely on specific other units being present, so features have to be useful on their own rather than co-adapted, and because each step trains a different sub-network with shared weights, the final network behaves like an average of an enormous ensemble. Typical rates are 0.2–0.5 in dense layers and around 0.1 in transformers, and it needs model.eval() at inference unless you deliberately keep it on for MC-dropout uncertainty estimates.`,
    avoid: ["Forgetting that dropout is off at inference", "Treating higher training loss as a bug"],
  },
  terms: [["Dropout rate p", "Probability a unit is zeroed in training."], ["Inverted dropout", "Scale kept activations by 1/(1 − p) in training."], ["Co-adaptation", "Units relying on specific partners; dropout breaks it."], ["MC dropout", "Dropout at inference, averaged, for uncertainty."]],
  sources: [D.dropout, D.csNN2],
});
Q({ id: "dl-do-1", d: 1, secs: 30, prompt: "Inverted dropout with p = 0.2. A kept activation of 2.0 becomes?", answer: 2.5, tol: 0.002, explain: "2/(1 − 0.2) = 2.5.", py: "answer = 2/(1-0.2)" });
Q({ id: "dl-do-2", d: 2, secs: 60, prompt: "Simulate inverted dropout (p = 0.5) on 100,000 activations all equal to 1. Mean output? (2 decimals)", answer: 1, tol: 0.02, explain: "Expected value is preserved: half are 0, half are 2.", py: "import numpy as np\nrng = np.random.default_rng(0)\nm = rng.random(100000) > 0.5\nanswer = float((np.ones(100000)*m/0.5).mean())", packages: ["numpy"] });
Q({ id: "dl-do-3", d: 1, secs: 20, prompt: "How many distinct sub-networks can dropout produce from 10 droppable units?", answer: 1024, tol: 0.5, explain: "Each unit is on or off: 2¹⁰.", py: "answer = 2**10" });
Q({ id: "dl-do-4", d: 1, secs: 30, prompt: "With inverted dropout, what happens at inference after model.eval()?", options: ["Activations are multiplied by (1 − p)", "Units are still dropped randomly", "Dropout is a no-op; activations pass unchanged", "Activations are divided by (1 − p)"], answer: 2, explain: "Scaling was already done during training.", py: "answer = 2" });
C("dl-do-c1", "Inverted dropout", "Train: zero with prob p, scale by 1/(1 − p). Eval: identity.");

L("dl-weight-decay-es", RD, "Weight decay and early stopping", "Shrinking weights every step and stopping at the best validation point: two regularisers every run uses.", {
  kind: "concept", mins: 20, prereq: ["cml-regularised", "dl-optimisers"],
  hook: "Validation loss bottomed out at epoch 12 and you trained to epoch 40. Which weights do you ship?",
  intuition: `
**The situation.** Two cheap regularisers appear in almost every deep learning recipe.

**Weight decay** shrinks every weight a little towards zero at each step. It's the deep-learning form of ridge regression: it discourages large weights, smoothing the function the network computes. With SGD it's the same as an L2 penalty; with Adam you want the decoupled version (AdamW).

**Early stopping** watches the validation metric during training and keeps the checkpoint with the best value, stopping once it hasn't improved for a set number of evaluations (the **patience**). Training longer lets the model fit noise; stopping at the bottom of the validation curve picks the best point on the bias–variance trade-off without retraining.

Both are cheap, and they combine well with dropout and augmentation.
`,
  maths: `
**In one breath.** Decoupled decay: $w \\leftarrow w - \\eta(\\text{update}) - \\eta\\lambda w$, so with no gradient $w_t = (1 - \\eta\\lambda)^t w_0$; L2 penalty $\\tfrac{\\lambda}{2}\\|w\\|^2$ adds $\\lambda w$ to the gradient (equivalent for SGD, not for Adam).

**Worked example (decay).** $w_0 = 1$, $\\eta = 0.1$, $\\lambda = 0.01$, no gradient: after 100 steps $w = 0.999^{100} = 0.905$.

**Worked example (early stopping, patience 2).** Validation loss by epoch: 0.90, 0.70, 0.65, 0.66, 0.64, 0.65, 0.67, 0.68. Best so far updates at epoch 5 (0.64); epochs 6 and 7 don't improve, so stop after epoch 7 and restore epoch 5.

**Early stopping as regularisation.** For a quadratic loss with gradient descent from small initial weights, stopping after $t$ steps behaves like an L2 penalty with strength roughly $1/(\\eta t)$: fewer steps = stronger regularisation.

| Knob | Typical value |
|---|---|
| AdamW weight decay | 0.01–0.1 |
| SGD weight decay (ResNets) | 1e-4 to 5e-4 |
| Excluded from decay | biases, normalisation γ/β, often embeddings |
| Patience | a few evaluations; larger for noisy metrics |
`,
  practice: `
**Checkpointing.** Save the best validation checkpoint (by the metric you care about, not just loss), plus the latest for resuming. Evaluate often enough to catch the minimum.

**When early stopping misleads.** Noisy validation sets (use patience and smoothing), schedules that lower the learning rate late (validation may improve again after a drop), and very large models where double descent appears over epochs.
`,
  traps: [
    { trap: "Weight decay and L2 regularisation are the same thing in every optimiser.", why: "Equivalent for plain SGD; different for adaptive optimisers like Adam, where L2 in the gradient is rescaled per parameter. Use AdamW's decoupled decay." },
    { trap: "Apply weight decay to every parameter.", why: "Decaying biases and normalisation scales usually hurts or does nothing useful; standard recipes exclude them." },
    { trap: "Early stopping means picking the epoch with the best test score.", why: "That leaks the test set into model selection. Choose by validation; report test once." },
  ],
  say: {
    prompt: "How do weight decay and early stopping regularise a neural network?",
    secs: 45,
    check: ["Weight decay shrinks weights each step (w ← (1 − ηλ)w); like ridge/L2", "Decoupled decay (AdamW) vs L2 with Adam", "Exclude biases/norm parameters", "Early stopping: track validation, patience, restore best checkpoint", "Early stopping ≈ L2-like constraint on how far weights move; select on validation not test"],
    followups: [
      { q: "Why decouple weight decay from Adam's update?", a: "Adam divides gradients by √v̂, so an L2 term added to the gradient is shrunk for parameters with large gradients; decoupling applies the same relative decay to every weight." },
      { q: "How do you set patience?", a: "Large enough to ride out noise in the validation metric (often several evaluations), smaller when evaluation is expensive; combine with saving the best checkpoint so a late stop costs nothing." },
      { q: "Why does early stopping act like L2 regularisation?", a: "Starting from small weights, gradient descent moves weights gradually; stopping early limits how far they travel from the start, similar to a penalty on their size." },
    ],
    answer: `Weight decay shrinks every weight by a small fraction each step, which for SGD is exactly an L2 penalty and, like ridge regression, discourages large weights and over-sensitive functions. With Adam I'd use AdamW, because adding L2 to Adam's gradient gets rescaled per parameter; and I'd exclude biases and normalisation parameters.

Early stopping evaluates on a validation set during training, keeps the best checkpoint, and stops once there's been no improvement for some patience. It limits how far the weights move from initialisation, which behaves much like an L2 constraint, and it selects the point where validation error is lowest, without retraining. The selection must use validation data, never the test set.`,
    avoid: ["Choosing the stopping epoch on test data", "Treating Adam + L2 as AdamW"],
  },
  terms: [["Weight decay", "Shrink weights by ηλw each step."], ["Patience", "Evaluations without improvement before stopping."], ["Best checkpoint", "Weights saved at the best validation score."]],
  sources: [D.adamw, D.csNN2],
});
Q({ id: "dl-wd-1", d: 2, secs: 45, prompt: "Decoupled decay with η = 0.1, λ = 0.01 and no gradient. A weight of 1.0 after 100 steps? (3 decimals)", answer: 0.905, tol: 0.002, explain: "(1 − 0.001)¹⁰⁰ = 0.905.", py: "w = 1.0\nfor _ in range(100):\n    w -= 0.1*0.01*w\nanswer = w" });
Q({ id: "dl-wd-2", d: 2, secs: 60, prompt: "Validation loss by epoch: 0.90, 0.70, 0.65, 0.66, 0.64, 0.65, 0.67, 0.68. Early stopping with patience 2: which epoch's checkpoint is restored (1-indexed)?", answer: 5, tol: 0.5, explain: "Best 0.64 at epoch 5; epochs 6 and 7 don't improve → stop, restore 5.", py: "v = [0.90,0.70,0.65,0.66,0.64,0.65,0.67,0.68]\nbest, be, bad = 1e9, 0, 0\nfor i, x in enumerate(v, 1):\n    if x < best:\n        best, be, bad = x, i, 0\n    else:\n        bad += 1\n        if bad >= 2:\n            break\nanswer = be" });
Q({ id: "dl-wd-3", d: 1, secs: 30, prompt: "Which parameters are usually excluded from weight decay?", options: ["Convolution kernels", "Dense-layer weight matrices", "Biases and normalisation γ/β", "Attention projection matrices"], answer: 2, explain: "Decaying biases and norm scales doesn't regularise usefully and can hurt.", py: "answer = 2" });
C("dl-wd-c1", "Decoupled decay", "w ← w − η·update − ηλw (AdamW).");
C("dl-wd-c2", "Early stopping", "Track validation, keep best checkpoint, stop after `patience` non-improving evaluations.");

L("dl-augmentation", RD, "Data augmentation, mixup and label smoothing", "Making more training signal from the data you have, and softening over-confident targets.", {
  kind: "concept", mins: 20, prereq: ["dl-output-loss"],
  hook: "You have 5,000 product photos. How do you train like you had 50,000, and which augmentations would quietly break the labels?",
  intuition: `
**The situation.** Deep networks are data-hungry. Labelling more data is slow; augmenting the data you have is free.

**Augmentation:** apply label-preserving transformations during training: flips, crops, small rotations, colour jitter, blur for images; noise, time-stretch for audio; synonym swaps or back-translation for text. The model sees a different version every epoch and learns invariances you know are true ("a shoe flipped left-right is still a shoe").

The key word is **label-preserving**. Flipping a '6' upside down makes a '9'; cropping out the defect in a defect-detection image removes the label.

**Mixup / CutMix:** blend two images (or paste a patch of one into another) and blend their labels in the same proportion. Encourages linear behaviour between examples and smoother decision boundaries.

**Label smoothing:** replace one-hot targets with "0.9 for the true class, the rest spread evenly". Stops the model pushing logits to infinity, improves calibration and often accuracy.
`,
  maths: `
**In one breath.** Mixup: $\\tilde x = \\lambda x_i + (1 - \\lambda)x_j$, $\\tilde y = \\lambda y_i + (1 - \\lambda)y_j$, $\\lambda \\sim \\text{Beta}(\\alpha, \\alpha)$; label smoothing with $\\epsilon$ over $K$ classes: $y_{true} = 1 - \\epsilon + \\epsilon/K$, others $\\epsilon/K$.

**Worked examples.**

- Label smoothing $\\epsilon = 0.1$, $K = 10$: true class 0.91, every other class 0.01.
- Mixup with $\\lambda = 0.3$ between class A and class B: label = 0.3 A + 0.7 B.
- With smoothed targets, the best possible prediction is the target itself, and its cross-entropy is the target's entropy: $-(0.91\\ln 0.91 + 9 \\times 0.01\\ln 0.01) = 0.500$, not 0. The model is no longer rewarded for infinite confidence.

**Test-time augmentation (TTA).** Average predictions over a few augmented copies of each test input for a small accuracy boost.

| Domain | Common augmentations | Watch out for |
|---|---|---|
| Images | random resized crop, flip, colour jitter, RandAugment, mixup/CutMix | flips/rotations that change meaning (digits, text, medical laterality) |
| Audio | noise, time/pitch shift, SpecAugment masking | pitch shift for speaker ID |
| Text | back-translation, synonym replacement, token dropout | changing sentiment or entities |
| Tabular | rarely; noise, SMOTE-like for minority | creating impossible records |
`,
  practice: `
**Rules.** Augment training data only (not validation/test, except deliberate TTA). Match augmentations to real-world variation in deployment. Stronger augmentation for small data and big models; tune strength like any regulariser.

**Pipeline.** Apply augmentations on the fly in the data loader (GPU-based for speed at scale).
`,
  traps: [
    { trap: "More augmentation is always better.", why: "Augmentations that change the label or produce unrealistic inputs add label noise. Too-strong augmentation underfits. Pick transformations the label is genuinely invariant to." },
    { trap: "Augment the validation set too so it matches training.", why: "Validation should look like real deployment data; augmenting it measures the wrong thing. Use TTA only as a deliberate inference technique." },
    { trap: "Label smoothing only matters for calibration.", why: "It also regularises: it limits how large logits grow and often improves accuracy. But it can hurt knowledge distillation from that model, because the teacher's 'dark knowledge' gets flattened." },
  ],
  say: {
    prompt: "What data augmentation would you use for an image classifier with limited data, and what are mixup and label smoothing?",
    secs: 45,
    check: ["Label-preserving transforms matched to real variation (crop, flip, colour)", "Examples of augmentations that break labels", "Mixup/CutMix: blend inputs and labels", "Label smoothing: soften one-hot targets; limits over-confidence", "Train-only; tune strength; TTA as optional extra"],
    followups: [
      { q: "Why does label smoothing improve calibration?", a: "One-hot targets reward pushing the true logit to infinity; smoothed targets have a finite optimum, so predicted probabilities stay less extreme and closer to observed accuracy." },
      { q: "How does mixup regularise?", a: "It trains the model on convex combinations of examples with matching label mixtures, encouraging linear behaviour between training points and smoother decision boundaries." },
      { q: "When would you not use horizontal flips?", a: "When orientation carries the label: text and digits, left/right body parts in medical images, road signs with direction." },
    ],
    answer: `I'd apply label-preserving augmentations on the fly: random resized crops, horizontal flips if left-right doesn't matter, colour jitter and mild rotations, ideally chosen to match how real deployment images vary, and only on the training set. I'd be careful with transforms that change the label, like flipping digits or text.

Mixup blends two training images and their labels in the same proportion, which smooths decision boundaries; CutMix pastes a patch instead. Label smoothing replaces one-hot targets with, say, 0.9 on the true class and the rest spread across the others, so the model isn't rewarded for infinitely confident logits; it usually improves calibration and often accuracy. I'd tune augmentation strength on validation like any other regulariser.`,
    avoid: ["Augmenting validation/test data", "Label-changing augmentations"],
  },
  terms: [["Data augmentation", "Label-preserving transformations of training inputs."], ["Mixup", "Convex combination of two inputs and their labels."], ["Label smoothing", "Targets 1 − ε + ε/K and ε/K."], ["TTA", "Averaging predictions over augmented test copies."]],
  sources: [D.mixup, D.inception, D.d2l],
});
Q({ id: "dl-aug-1", d: 1, secs: 30, prompt: "Label smoothing ε = 0.1 with 10 classes. Target value for the true class?", answer: 0.91, tol: 0.002, explain: "1 − 0.1 + 0.1/10 = 0.91.", py: "answer = 1 - 0.1 + 0.1/10" });
Q({ id: "dl-aug-2", d: 1, secs: 30, prompt: "Mixup with λ = 0.3 between an image of class A and one of class B. Weight of class B in the mixed label?", answer: 0.7, tol: 0.002, explain: "ỹ = 0.3·A + 0.7·B.", py: "lam = 0.3\nanswer = 1 - lam" });
Q({ id: "dl-aug-3", d: 3, secs: 90, prompt: "Smoothed target (0.91 true, 0.01 for each of 9 others). The model predicts exactly that distribution. Cross-entropy? (3 decimals)", answer: 0.5, tol: 0.002, explain: "−(0.91 ln 0.91 + 9 × 0.01 ln 0.01) = 0.086 + 0.414 = 0.500: the minimum is no longer 0, so infinite confidence isn't rewarded.", py: "import numpy as np\ny = np.array([0.91]+[0.01]*9)\nanswer = float(-(y*np.log(y)).sum())", packages: ["numpy"] });
Q({ id: "dl-aug-4", d: 1, secs: 30, prompt: "Which augmentation is most likely to corrupt labels for handwritten digit recognition?", options: ["Small random translations", "Slight brightness changes", "180° rotation", "Small elastic distortions"], answer: 2, explain: "Rotating 6 by 180° gives 9.", py: "answer = 2" });
C("dl-aug-c1", "Label smoothing target", "True: 1 − ε + ε/K; others: ε/K.");
C("dl-aug-c2", "Augmentation rule", "Only label-preserving, realistic transforms; training data only.");

L("dl-debugging", RD, "Debugging neural network training", "Sanity checks, reading loss curves, and a systematic order for finding bugs.", {
  kind: "concept", mins: 25, prereq: ["dl-output-loss", "dl-lr-schedules"],
  hook: "Loss starts at 2.30 and stays there for 10 epochs on a 10-class problem. What does 2.30 tell you, and what do you check first?",
  intuition: `
**The situation.** Neural nets fail silently: the code runs, the loss moves a bit, and the model is useless. Most failures are bugs in data or plumbing, not in the architecture.

**A systematic order.**

1. **Check the initial loss.** With $K$ balanced classes and a fresh model, cross-entropy should be about $\\ln K$ (2.30 for 10 classes). Much higher means mis-scaled outputs or labels; exactly $\\ln K$ forever means the model isn't learning anything.
2. **Overfit a tiny batch.** A correct model should drive the loss near zero on 10–100 examples. If it can't, there's a bug (labels misaligned, loss wrong, gradients not flowing, learning rate wrong).
3. **Look at the data going in.** Decode a batch after the full pipeline: shapes, normalisation, label alignment, augmentations.
4. **Then tune:** learning rate (range test), regularisation, capacity, using the train/validation curves.

**Reading curves.** Train and validation both high → underfitting (or a bug). Train low, validation high → overfitting. Validation better than train → regularisation only in training, or leakage. Spikes → learning rate / data / precision issues.
`,
  maths: `
**In one breath.** Expected initial cross-entropy $\\approx \\ln K$ (balanced $K$ classes); binary ≈ $\\ln 2 = 0.693$; a healthy update/weight ratio per step ≈ $10^{-3}$.

**Worked examples.** 10 classes → 2.303; 100 classes → 4.605; binary → 0.693. An initial loss of 15 on a 10-class problem means logits are far too large (bad init or missing normalisation) or the loss receives probabilities where it expects logits/labels.

**Checklist by symptom.**

| Symptom | Common causes |
|---|---|
| Loss stuck at ln K | labels shuffled/misaligned, learning rate ~0, frozen params, no gradient (detached tensor), dead ReLUs |
| Loss decreases then NaN | learning rate too high, log(0), fp16 overflow, bad data |
| Can't overfit one batch | bug in loss/labels, model too small, LR too low, wrong output activation |
| Great train, bad val | overfitting, train/val distribution mismatch, eval mode forgotten |
| Val ≫ train early, then fine | normal with dropout/augmentation |
| Val suspiciously good | leakage (duplicates, future info) |

**Gradient check.** Compare analytic and numerical gradients on a tiny model in float64 when writing custom layers.
`,
  practice: `
**Habits.** Fix seeds; start from a known-good baseline config; change one thing at a time; log loss, metric, learning rate, gradient norms, a few predictions; keep a tiny "smoke test" dataset in CI.

**Data first.** Visualise inputs after preprocessing, check class balance, check label noise on a random sample, confirm train/val/test splits don't overlap.
`,
  traps: [
    { trap: "If the loss is going down, the pipeline is correct.", why: "Loss can fall while labels are misaligned with inputs (model learns the label prior), or while a leak makes the task trivial. Check against baselines and inspect predictions." },
    { trap: "Start debugging by trying a bigger model.", why: "Most failures are data or plumbing bugs. Overfit a tiny batch first; if a small model can't memorise 50 examples, a bigger one won't fix the bug." },
    { trap: "Validation worse than training means overfitting.", why: "It can also be distribution mismatch, forgetting model.eval(), different preprocessing in validation, or simply noise. Diagnose before regularising." },
  ],
  say: {
    prompt: "Your new model trains but performs poorly. How do you debug it?",
    secs: 60,
    check: ["Check initial loss ≈ ln K", "Overfit a tiny batch to rule out bugs", "Inspect data after the pipeline: labels, shapes, normalisation, leaks", "Read train/val curves: underfit vs overfit vs mismatch", "Then tune LR/regularisation/capacity one change at a time, log gradients"],
    followups: [
      { q: "Why should the initial loss be about ln K?", a: "A freshly initialised model with small logits predicts near-uniform probabilities 1/K, and cross-entropy of a uniform prediction is −ln(1/K) = ln K." },
      { q: "What does it mean if you can't overfit 20 examples?", a: "Something is broken: misaligned labels, wrong loss/output activation, gradients not reaching parameters, learning rate far off, or a model far too small. Fix that before anything else." },
      { q: "How do you catch silent data bugs?", a: "Render a decoded batch after preprocessing, compare predictions to labels, run simple baselines, check split overlap and label distributions." },
    ],
    answer: `I'd go from cheap sanity checks to tuning. First the initial loss: for a balanced K-class problem it should be about ln K, 2.3 for ten classes. Then I'd try to overfit a tiny batch of a few dozen examples: if the loss won't go to near zero, there's a bug, typically misaligned labels, the wrong output activation or loss, a detached tensor, or a bad learning rate.

Next I'd inspect the data after the full pipeline, shapes, normalisation, augmentations and labels, and check the splits for leakage. Only then would I read the training and validation curves to decide between underfitting, overfitting and distribution mismatch, and tune the learning rate, regularisation or capacity one change at a time while logging gradient norms.`,
    avoid: ["Jumping straight to a bigger architecture", "Trusting a falling loss as proof of correctness"],
  },
  terms: [["Sanity check", "Cheap test that a correct pipeline must pass (initial loss, overfit one batch)."], ["Update/weight ratio", "‖Δw‖/‖w‖ per step; ~1e-3 is healthy."], ["Smoke test", "Tiny end-to-end run to catch plumbing bugs."]],
  sources: [D.csNN3, D.csNN2],
});
Q({ id: "dl-dbg-1", d: 1, secs: 30, prompt: "Expected initial cross-entropy for a fresh 10-class classifier? (3 decimals)", answer: 2.303, tol: 0.002, explain: "ln 10 = 2.303.", py: "import math\nanswer = math.log(10)" });
Q({ id: "dl-dbg-2", d: 1, secs: 30, prompt: "Expected initial binary cross-entropy for a balanced binary classifier? (3 decimals)", answer: 0.693, tol: 0.002, explain: "ln 2.", py: "import math\nanswer = math.log(2)" });
Q({ id: "dl-dbg-3", d: 2, secs: 45, prompt: "A 100-class model starts at loss 4.6 and stays at 4.6 for 5 epochs while training accuracy is 1%. Most likely?", options: ["Overfitting", "The model isn't learning at all (bug, zero LR, misaligned labels)", "Perfectly normal", "Underfitting due to small model"], answer: 1, explain: "4.6 ≈ ln 100 and 1% = chance: predictions never moved from uniform.", py: "import math\nanswer = 1 if abs(4.6 - math.log(100)) < 0.01 else 0" });
Q({ id: "dl-dbg-4", d: 2, secs: 60, prompt: "Weights have norm 50 and one update step has norm 0.05. Update/weight ratio?", answer: 0.001, tol: 0.00002, explain: "0.05/50 = 1e−3: a healthy order of magnitude.", py: "answer = 0.05/50" });
C("dl-dbg-c1", "First checks", "Initial loss ≈ ln K; overfit a tiny batch; inspect decoded data.");

L("dl-reg-practice", RD, "Regularisation and debugging practice", "Six interview scenarios on overfitting, regularisers and broken training runs.", {
  kind: "interview", mins: 30, prereq: ["dl-dropout", "dl-weight-decay-es", "dl-augmentation", "dl-debugging"],
  hook: "Answer each scenario out loud in about a minute, then open it and tick off the points the interviewer is listening for.",
}, [
  iq("Training accuracy 99%, validation 72% on an image classifier with 8,000 images. List your interventions in order.", "Confirm no data issues (duplicates, distribution mismatch). Then: data augmentation, transfer learning from a pretrained backbone instead of training from scratch, weight decay, dropout in the head, early stopping on validation, smaller model or fewer trainable layers, more data if feasible. Check learning curves to see if more data would help.", ["Check data/mismatch first", "Augmentation", "Pretrained backbone", "Weight decay / dropout / early stopping", "Learning curve for data question"]),
  iq("The loss doesn't decrease at all from the first step. Give five possible causes.", "Learning rate zero or far too small (or far too large → immediate divergence), parameters not passed to the optimiser or frozen, optimizer.step()/zero_grad misplaced, detached graph (e.g. .item()/numpy in forward), labels misaligned or constant, wrong loss/output activation pairing, dead ReLUs from bad init.", ["Learning rate", "Optimiser not seeing parameters / frozen", "Broken graph / detach", "Label/loss mismatch", "Bad init / dead units"]),
  iq("Validation loss starts rising at epoch 10 but validation accuracy keeps improving until epoch 20. Which epoch do you keep?", "The model is becoming over-confident on its mistakes (loss rises) while ranking more examples correctly (accuracy rises). Choose by the metric that matters for deployment: if probabilities feed decisions, prefer the lower-loss checkpoint or recalibrate the later one; if only the label matters, keep the better-accuracy checkpoint. Label smoothing or temperature scaling can reconcile both.", ["Over-confidence vs ranking explanation", "Select on the business metric", "Calibration fix (temperature scaling)", "Label smoothing"]),
  iq("Why might dropout make a model worse?", "When it underfits: small models or small data with heavy dropout lose capacity; in conv layers standard dropout is less effective than spatial dropout; with BatchNorm it can create train/test variance shift; large pretrained LLMs on huge data gain little and train slower.", ["Underfitting / capacity", "Interaction with BatchNorm", "Conv layers: spatial dropout", "Large data regimes"]),
  iq("You suspect a data-pipeline bug. How do you verify the inputs are correct?", "Pull a batch after the full pipeline and visualise or print it with labels; check shapes, dtypes, value ranges and normalisation; confirm augmentations make sense; verify label-to-input alignment on random samples; compare class distributions with the raw data; run a trivial baseline and a tiny-batch overfit test.", ["Visualise decoded batch with labels", "Shapes / ranges / normalisation", "Alignment and class distribution", "Baseline + overfit test"]),
  iq("Your model performs well offline but worse on live traffic each week. Is this a regularisation problem?", "Probably not: it looks like distribution drift or training/serving skew. Compare live feature distributions with training, check preprocessing parity, monitor performance by cohort, and retrain on recent data or adapt. Regularisation helps generalisation within the training distribution, not to a moving one.", ["Drift / skew, not overfitting", "Compare distributions, preprocessing parity", "Monitoring", "Retraining strategy"]),
]);
