/**
 * v2 NLP & LLMs, part D: Post-training (SFT, RLHF, DPO, LoRA/QLoRA, distillation).
 * Fixed ids; answers recomputed in Pyodide.
 */
import { iq, lessonWriter } from "./v2-shared";
import { LS as S } from "./v2-llm-src";

const { L, Q, C } = lessonWriter("llm");
const PO = "Post-training";

L("llm-sft", PO, "Supervised fine-tuning and instruction tuning", "Turning a base model into an assistant with (prompt, response) examples: data, chat templates, loss masking and pitfalls.", {
  kind: "concept", mins: 25, prereq: ["llm-next-token"],
  hook: "You ask a base model \"What is the capital of France?\" and it replies with three more quiz questions. What fixes that?",
  intuition: `
**The situation.** A base model continues text. Assistants need to follow instructions, answer in a consistent format, refuse some requests and stop when done.

**The idea.** Supervised fine-tuning (SFT): keep the next-token objective, but train on curated (instruction, ideal response) pairs, formatted with a **chat template** (special tokens marking system, user and assistant turns). The model learns the *behaviour* of answering; the knowledge mostly comes from pre-training.

**Key details.**

- **Loss masking:** compute loss only on the assistant's tokens, not on the prompt, so the model learns to respond rather than to imitate users.
- **Quality over quantity:** a few thousand to tens of thousands of carefully written, diverse examples often beat millions of noisy ones.
- **Template consistency:** use the exact chat template at inference that was used in training, or behaviour degrades.
- **Forgetting:** fine-tuning too long or too aggressively on a narrow set erodes general abilities; use low learning rates, few epochs, mixed general data, or parameter-efficient methods.
`,
  maths: `
**In one breath.** Minimise $-\\sum_{t \\in \\text{response}}\\log p_\\theta(y_t \\mid x, y_{<t})$, with prompt tokens masked from the loss.

**Worked examples.**

- A 300-token prompt with a 100-token response: only 100 of 400 tokens (25%) carry loss.
- 50,000 examples averaging 200 response tokens: 10M supervised tokens, tiny compared with pre-training.
- 10,000 examples, batch 64, 3 epochs: ⌈10000/64⌉ = 157 steps per epoch, 471 steps total.

**Typical settings.** Learning rate 1e-5 to 2e-5 for full fine-tuning (1e-4 to 2e-4 for LoRA), 1–3 epochs, cosine decay, sequence packing with per-example loss masks.

| Data source | Pros | Cons |
|---|---|---|
| Human-written | high quality, aligned to your needs | slow, expensive |
| Distilled from a stronger model | cheap, large | inherits its errors; licence/ToS limits |
| Converted from existing tasks | reuses labelled data | narrow style |
| Your product logs (curated) | real distribution | privacy, quality filtering |
`,
  practice: `
**When to fine-tune vs prompt vs RAG.** Prompting first; RAG for knowledge that changes or must be cited; SFT for consistent format, tone, domain style, tool-call syntax, or making a smaller model do a narrow job well.

**Evaluation.** Hold out prompts; compare against the base/instruct model on your task rubric and on general benchmarks to catch forgetting.

**Data hygiene.** Deduplicate, remove eval overlap, check refusals and safety behaviour, and make responses consistent in format.
`,
  traps: [
    { trap: "Fine-tune to teach the model new facts about our products.", why: "SFT on small data is unreliable for injecting facts and goes stale; RAG is better for knowledge. SFT shapes behaviour and format." },
    { trap: "Compute loss on the whole conversation.", why: "The model then also learns to generate user turns; mask prompt tokens so only assistant responses are learned." },
    { trap: "More epochs means better adaptation.", why: "Narrow SFT overfits and erodes general skills quickly. Use 1–3 epochs, low LR, and check general benchmarks." },
  ],
  say: {
    prompt: "What is supervised fine-tuning for LLMs and how would you run it for a support assistant?",
    secs: 60,
    check: ["Next-token loss on curated instruction/response pairs", "Chat template; loss masked to assistant tokens", "Data quality and diversity over volume; sources", "Low LR, few epochs; watch forgetting", "When SFT vs prompting vs RAG; evaluation on held-out prompts"],
    followups: [
      { q: "Why does SFT alone often leave models verbose or sycophantic?", a: "It imitates demonstrations without learning which of several plausible answers people prefer; preference tuning (RLHF/DPO) adds that comparative signal." },
      { q: "What is catastrophic forgetting and how do you limit it?", a: "Losing general abilities while fitting narrow data. Limit with low learning rates, few epochs, mixing general instruction data, and parameter-efficient methods like LoRA." },
      { q: "What breaks if the inference prompt format differs from training?", a: "The model sees token patterns it wasn't trained on: it may ignore the system prompt, fail to stop, or answer in the wrong format." },
    ],
    answer: `SFT keeps the next-token objective but trains on curated pairs of instruction and ideal response, formatted with the model's chat template, and computes loss only on the assistant tokens. It teaches behaviour, how to answer, format, tone and when to stop, while the knowledge mostly comes from pre-training.

For a support assistant I'd first check whether prompting plus RAG over our help docs is enough, because facts change. If I need consistent tone, format or tool calls, I'd collect a few thousand high-quality conversations, from curated logs and expert-written answers, deduplicate them and remove anything in the eval set, then fine-tune an instruct model with a low learning rate for one to three epochs, often with LoRA. I'd evaluate on held-out conversations with a rubric and on general benchmarks to catch forgetting.`,
    avoid: ["Using SFT to store frequently changing facts", "Training on user turns"],
  },
  terms: [["SFT", "Supervised fine-tuning on demonstrations."], ["Chat template", "Special tokens/format for system, user and assistant turns."], ["Loss masking", "Excluding prompt tokens from the loss."], ["Catastrophic forgetting", "Losing prior abilities during fine-tuning."]],
  sources: [S.instructgpt, S.llama2],
});
Q({ id: "llm-sft-1", d: 1, secs: 30, prompt: "A training example has a 300-token prompt and a 100-token response with prompt tokens masked. Fraction of tokens contributing to the loss?", answer: 0.25, tol: 0.002, explain: "100/400.", py: "answer = 100/(300+100)" });
Q({ id: "llm-sft-2", d: 2, secs: 45, prompt: "10,000 examples, batch size 64, 3 epochs (last partial batch kept). Total optimiser steps?", answer: 471, tol: 0.5, explain: "⌈10000/64⌉ = 157 per epoch × 3.", py: "import math\nanswer = math.ceil(10000/64)*3" });
Q({ id: "llm-sft-3", d: 1, secs: 30, prompt: "50,000 examples averaging 200 response tokens each. Supervised tokens, in millions?", answer: 10, tol: 0.05, explain: "50,000 × 200 = 10M.", py: "answer = 50000*200/1e6" });
Q({ id: "llm-sft-4", d: 1, secs: 30, prompt: "Your policy documents change monthly and answers must cite them. Best primary approach?", options: ["Fine-tune monthly on the documents", "RAG over the documents, optionally with SFT for format", "Longer system prompt only", "Pre-train from scratch"], answer: 1, explain: "Retrieval keeps knowledge current and citable; SFT can shape style and format.", py: "answer = 1" });
C("llm-sft-c1", "SFT", "Next-token loss on curated (prompt, response) pairs; loss on assistant tokens only; teaches behaviour, not facts.");

L("llm-rlhf", PO, "Reward models and RLHF", "Learning from human preferences: pairwise comparisons, Bradley–Terry reward models, PPO with a KL penalty, and reward hacking.", {
  kind: "concept", mins: 30, prereq: ["llm-sft"],
  hook: "Writing the perfect answer is hard; saying which of two answers is better is easy. How do you turn those comparisons into a better model?",
  intuition: `
**The situation.** After SFT, the model imitates demonstrations, but many responses are plausible and people prefer some (clear, honest, safe, appropriately concise) over others.

**RLHF in three steps (InstructGPT recipe).**

1. **Collect preferences:** sample two or more responses per prompt; humans pick the better one.
2. **Train a reward model:** a copy of the LM with a scalar head, trained so the preferred response scores higher.
3. **Optimise the policy with RL (PPO):** generate responses, score them with the reward model, and update the policy to increase reward, while a **KL penalty** keeps it close to the SFT model.

**Why the KL penalty.** The reward model is only accurate near the data it was trained on. Without a leash, the policy finds outputs the reward model overrates (**reward hacking**): flattery, excessive length, confident nonsense. The KL term limits how far it can drift.
`,
  maths: `
**In one breath.** Bradley–Terry: $P(A \\succ B) = \\sigma(r(A) - r(B))$; reward-model loss $-\\log\\sigma(r_w - r_l)$; RL objective $\\mathbb{E}[r(x, y)] - \\beta\\,\\text{KL}(\\pi_\\theta\\|\\pi_{\\text{ref}})$.

**Worked examples.**

- $r(A) = 1.5$, $r(B) = 0.5$: $P(A \\succ B) = \\sigma(1) = 0.731$; loss if A was preferred $= -\\ln 0.731 = 0.313$.
- Per-sample penalised reward: $r = 2.0$, $\\beta = 0.1$, summed log-ratio $\\log\\frac{\\pi_\\theta}{\\pi_{\\text{ref}}} = 5$: $2.0 - 0.5 = 1.5$.
- Ranking 4 responses gives $\\binom{4}{2} = 6$ pairwise comparisons from one annotation.

**PPO in one line.** A policy-gradient method that clips how much the probability of each action can change per update, with a learned value function to reduce variance. RLHF with PPO keeps four models around: policy, reference, reward model, value model.

| Problem | Symptom | Mitigation |
|---|---|---|
| Reward hacking | long, flattering, hedging answers | KL penalty, length control, better RM data |
| RM overfitting | RM accuracy high on train, low on new data | more/diverse comparisons, ensembles |
| Annotator disagreement | noisy labels | guidelines, multiple raters |
| Expensive RL loop | instability, compute | DPO-style direct methods |
`,
  practice: `
**Where you'll meet it.** Reading model reports (helpfulness vs harmlessness reward models in Llama 2), designing preference-data collection, or choosing between PPO-style RL and direct methods like DPO for your own fine-tuning.

**Reinforcement learning with verifiable rewards** (maths answers, unit tests) is a related, newer post-training stage for reasoning models: the reward comes from a checker instead of a learned preference model.
`,
  traps: [
    { trap: "The reward model measures truth.", why: "It measures what annotators preferred, which correlates with but isn't the same as correctness. Confident, fluent errors can score high." },
    { trap: "Maximise reward as hard as possible.", why: "The policy then exploits reward-model errors (reward hacking). The KL penalty and early stopping keep it near where the RM is reliable." },
    { trap: "RLHF teaches the model new knowledge.", why: "It mainly reshapes which of the model's existing behaviours are preferred; knowledge comes from pre-training." },
  ],
  say: {
    prompt: "Explain RLHF end to end, including why the KL penalty is there.",
    secs: 60,
    check: ["Start from an SFT model; collect pairwise human preferences", "Reward model trained with Bradley–Terry loss −log σ(r_w − r_l)", "Optimise policy with PPO against the reward", "KL penalty to the reference model to prevent reward hacking/drift", "Costs and alternatives (DPO), reward hacking examples"],
    followups: [
      { q: "Why pairwise comparisons instead of absolute scores?", a: "People are much more consistent judging which of two answers is better than assigning calibrated 1–10 scores; Bradley–Terry turns comparisons into a scalar reward." },
      { q: "What models are in memory during PPO-based RLHF?", a: "Policy, frozen reference (for KL), reward model and value (critic) model: four large models, which is a big part of its cost." },
      { q: "Give an example of reward hacking.", a: "The policy learns that longer, more confident or more flattering answers get higher reward, regardless of correctness, because the reward model latched onto those features." },
    ],
    answer: `RLHF starts from an instruction-tuned model. We sample several responses per prompt and have people say which is better. A reward model, usually the language model with a scalar head, is trained on those pairs with a Bradley–Terry loss, minus log sigmoid of the reward difference, so preferred answers score higher. Then the policy is optimised with PPO to maximise the reward model's score on its own generations.

The reward model is only trustworthy near the data it saw, so the objective subtracts a KL penalty to the reference model; without it the policy drifts into outputs the reward model overrates, like long flattering answers, which is reward hacking. PPO-based RLHF is expensive and finicky, with four models in memory, which is why direct methods like DPO became popular.`,
    avoid: ["“The reward model knows what's true”", "Forgetting the KL term"],
  },
  terms: [["Reward model", "Scores a response; trained on human preferences."], ["Bradley–Terry", "P(A ≻ B) = σ(r_A − r_B)."], ["PPO", "Clipped policy-gradient RL algorithm."], ["Reward hacking", "Exploiting reward-model errors."]],
  sources: [S.instructgpt, S.llama2],
});
Q({ id: "llm-rl-1", d: 1, secs: 30, prompt: "Reward model scores r(A) = 1.5, r(B) = 0.5. Bradley–Terry P(A preferred)? (3 decimals)", answer: 0.731, tol: 0.002, explain: "σ(1).", py: "import math\nanswer = 1/(1+math.exp(-(1.5-0.5)))" });
Q({ id: "llm-rl-2", d: 2, secs: 45, prompt: "Same scores and A was the human-preferred answer. Reward-model loss for this pair? (3 decimals)", answer: 0.313, tol: 0.002, explain: "−ln σ(1) = 0.313.", py: "import math\nanswer = -math.log(1/(1+math.exp(-1)))" });
Q({ id: "llm-rl-3", d: 2, secs: 45, prompt: "Reward 2.0, KL coefficient β = 0.1, summed log-probability ratio (policy vs reference) of 5. KL-penalised reward?", answer: 1.5, tol: 0.002, explain: "2.0 − 0.1 × 5.", py: "answer = 2.0 - 0.1*5" });
Q({ id: "llm-rl-4", d: 1, secs: 30, prompt: "An annotator ranks 4 responses to one prompt. How many pairwise comparisons does that ranking imply?", answer: 6, tol: 0.5, explain: "C(4, 2).", py: "import math\nanswer = math.comb(4,2)" });
C("llm-rl-c1", "RLHF objective", "max E[r(x, y)] − β·KL(π_θ ‖ π_ref); RM loss −log σ(r_w − r_l).");

L("llm-dpo", PO, "DPO and direct preference optimisation", "Training on preference pairs without a reward model or RL loop, and how it compares with RLHF.", {
  kind: "concept", mins: 25, prereq: ["llm-rlhf"],
  hook: "What if you could get most of RLHF's benefit with a loss function you can train like SFT?",
  intuition: `
**The situation.** PPO-based RLHF needs a reward model, sampling, a value model and careful tuning. Many teams just want to use preference pairs (chosen vs rejected answers) to improve a model.

**The idea (DPO).** The KL-regularised RLHF objective has a closed-form optimal policy, which lets the reward be rewritten in terms of the policy itself: the implicit reward of a response is $\\beta$ times how much more likely the policy makes it than the reference model does. Plug that into the Bradley–Terry preference loss and you get a simple classification-style loss on (prompt, chosen, rejected) triples: increase the policy's relative likelihood of the chosen answer versus the rejected one, measured against a frozen reference.

**What you gain:** no reward model, no sampling during training, two models in memory (policy and reference) instead of four, and stable training. **What you give up:** it learns only from the fixed pairs (offline), so it can't explore; quality depends heavily on the preference data; it can over-optimise (e.g. push down both responses' likelihoods).
`,
  maths: `
**In one breath.** $\\mathcal{L}_{\\text{DPO}} = -\\log\\sigma\\Big(\\beta\\Big[\\log\\frac{\\pi_\\theta(y_w)}{\\pi_{\\text{ref}}(y_w)} - \\log\\frac{\\pi_\\theta(y_l)}{\\pi_{\\text{ref}}(y_l)}\\Big]\\Big)$, with implicit reward $\\hat r(y) = \\beta\\log\\frac{\\pi_\\theta(y)}{\\pi_{\\text{ref}}(y)}$.

**Worked example.** $\\beta = 0.1$. Policy log-probs: chosen −10, rejected −14. Reference: chosen −11, rejected −12. Log-ratios: +1 and −2. Margin $= 0.1 \\times (1 - (-2)) = 0.3$; loss $= -\\ln\\sigma(0.3) = 0.554$. Training pushes the margin up.

**β.** Larger β keeps the policy closer to the reference (stronger implicit KL); smaller β allows more movement.

| | PPO-RLHF | DPO |
|---|---|---|
| Reward model | separate, trained first | implicit |
| Sampling during training | yes (online) | no (offline pairs) |
| Models in memory | policy, reference, reward, value | policy, reference |
| Stability / tuning | harder | easier |
| Exploration | yes | no (unless iterated with fresh samples) |

**Variants.** IPO, KTO (works with single thumbs-up/down labels), ORPO (no reference model), and iterated/online DPO that regenerates pairs from the current model.
`,
  practice: `
**When to use.** You have (or can generate) chosen/rejected pairs for your domain and want better tone, safety or format without an RL pipeline. Typical recipe: SFT → DPO on a few thousand to tens of thousands of pairs, β ≈ 0.1, 1–3 epochs, low LR.

**Data.** Pairs should differ in the quality you care about; if the "rejected" answers are obviously terrible, the model learns little. Check for length bias: if chosen answers are always longer, the model learns verbosity.
`,
  traps: [
    { trap: "DPO doesn't need a reference model.", why: "Standard DPO needs the frozen reference policy to compute log-ratios; some variants (ORPO) remove it." },
    { trap: "DPO is just SFT on the chosen answers.", why: "It explicitly contrasts chosen vs rejected relative to the reference; SFT on chosen answers ignores what was rejected." },
    { trap: "DPO is always as good as RLHF.", why: "It's offline and can't explore beyond the given pairs; online RL can do better when a good reward signal exists, especially for reasoning tasks." },
  ],
  say: {
    prompt: "What is DPO and how does it differ from PPO-based RLHF?",
    secs: 45,
    check: ["Trains directly on (prompt, chosen, rejected) pairs", "Loss: −log σ(β × difference of policy/reference log-ratios)", "Derives from the KL-regularised RLHF objective; implicit reward", "No reward model or RL loop; two models in memory; stable", "Offline limitation; data quality/length bias; β meaning"],
    followups: [
      { q: "What does β control in DPO?", a: "How strongly the policy is tied to the reference: it scales the implicit reward, acting like the KL coefficient in RLHF. Larger β = smaller deviations." },
      { q: "Why might DPO make responses longer?", a: "If chosen responses in the data are systematically longer, increasing their relative likelihood also rewards length. Balance the data or add length controls." },
      { q: "When would you still use RL instead?", a: "When you have a reliable reward you can query online (unit tests, verifiable maths answers, a strong reward model) and benefit from exploring new outputs, as in reasoning-model training." },
    ],
    answer: `DPO trains on preference triples, a prompt with a chosen and a rejected answer, without a separate reward model or reinforcement learning. It comes from the fact that the KL-regularised RLHF objective has a closed-form optimal policy, so the reward can be expressed as beta times the log-ratio of the policy to a frozen reference. Plugging that into the Bradley–Terry loss gives minus log sigmoid of beta times the difference between the chosen and rejected log-ratios.

Compared with PPO it's much simpler and more stable: two models in memory instead of four, no sampling, trains like supervised learning. The trade-off is that it's offline, so it only learns from the pairs you give it and can't explore; results depend heavily on pair quality, and it can pick up biases like length. Beta controls how far the model can move from the reference.`,
    avoid: ["“DPO needs no reference model”", "Equating DPO with SFT on chosen answers"],
  },
  terms: [["DPO", "Direct preference optimisation: preference loss on log-ratios vs a reference."], ["Implicit reward", "β·log(π_θ/π_ref)."], ["Offline preference learning", "Learning only from a fixed set of pairs."]],
  sources: [S.dpo],
});
Q({ id: "llm-dpo-1", d: 2, secs: 90, prompt: "β = 0.1. Policy log-probs: chosen −10, rejected −14. Reference: chosen −11, rejected −12. DPO margin β[(log π − log π_ref)_chosen − (…)_rejected]?", answer: 0.3, tol: 0.002, explain: "0.1 × ((−10 + 11) − (−14 + 12)) = 0.1 × 3.", py: "b = 0.1\nanswer = b*((-10+11) - (-14+12))" });
Q({ id: "llm-dpo-2", d: 2, secs: 45, prompt: "DPO loss for that example, −ln σ(0.3)? (3 decimals)", answer: 0.554, tol: 0.002, explain: "σ(0.3) = 0.574; −ln 0.574 = 0.554.", py: "import math\nanswer = -math.log(1/(1+math.exp(-0.3)))" });
Q({ id: "llm-dpo-3", d: 1, secs: 30, prompt: "How many large models must be held in memory for standard DPO training (policy plus …)?", answer: 2, tol: 0.5, explain: "Policy and frozen reference (PPO-RLHF typically needs four).", py: "answer = 2" });
Q({ id: "llm-dpo-4", d: 1, secs: 30, prompt: "Increasing β in DPO tends to…", options: ["let the policy move further from the reference", "keep the policy closer to the reference", "remove the need for preference data", "increase the learning rate"], answer: 1, explain: "β scales the implicit reward/KL strength.", py: "answer = 1" });
C("llm-dpo-c1", "DPO loss", "−log σ(β[log π/π_ref (chosen) − log π/π_ref (rejected)]).");

L("llm-lora", PO, "LoRA and QLoRA: parameter-efficient fine-tuning", "Low-rank adapters, how many parameters they train, 4-bit base models, and when PEFT is enough.", {
  kind: "concept", mins: 25, prereq: ["llm-sft", "llm-training-scale"],
  hook: "Full fine-tuning a 7B model needs over 100 GB of GPU memory. How do people fine-tune it on a single 24 GB card?",
  intuition: `
**The situation.** Full fine-tuning updates every weight and needs gradients and optimiser state for all of them. You also end up with a full copy of the model for every task.

**LoRA.** Freeze the pretrained weights. For selected matrices (usually attention and/or FFN projections) add a trainable low-rank update $\\Delta W = BA$, where $A$ is $r \\times k$ and $B$ is $d \\times r$ with a small rank $r$ (4–64). Only $A$ and $B$ are trained: often well under 1% of the parameters. The hypothesis behind it: the change needed to adapt a model to a task lives in a low-dimensional subspace.

**After training** you can merge $BA$ into $W$ (no extra inference latency) or keep adapters separate and swap them per customer or task on one base model.

**QLoRA.** Store the frozen base model in 4-bit (NF4) to cut its memory ~4×, keep LoRA adapters in 16-bit, and backpropagate through the quantised weights. A 7B model's weights drop to ~3.5 GB, making single-GPU fine-tuning of large models practical.
`,
  maths: `
**In one breath.** $h = Wx + \\frac{\\alpha}{r}BAx$, $W \\in \\mathbb{R}^{d\\times k}$ frozen; trainable params per matrix $= r(d + k)$; $B$ initialised to 0 so training starts from the base model.

**Worked examples.**

- $d = k = 4096$, $r = 8$: $8 \\times 8192 = 65{,}536$ trainable parameters vs $16.8$M for the full matrix: 0.39%.
- Scaling $\\alpha/r$ with $\\alpha = 16$, $r = 8$: updates multiplied by 2.
- QLoRA: 7B × 0.5 bytes (4-bit) ≈ 3.5 GB for base weights, plus adapters, their optimiser state and activations.

**Memory comparison (7B, rough).**

| Method | Trainable | Memory (weights + optimiser) |
|---|---|---|
| Full fine-tune (mixed-precision Adam) | 100% | ~112 GB |
| LoRA on bf16 base | ~0.1–1% | ~14 GB + small |
| QLoRA (4-bit base) | ~0.1–1% | ~3.5 GB + small |

**Rank choice.** Higher $r$ = more capacity; returns diminish fast for style/format tasks; larger shifts (new language, heavy domain) may need higher rank, more target modules, or full fine-tuning.
`,
  practice: `
**Defaults.** Target all linear layers in attention and FFN, $r = 16$, $\\alpha = 32$, LR ~1e-4 to 2e-4, 1–3 epochs. Evaluate against the base model and a full fine-tune if you can afford one.

**Serving.** Merge for a single task; keep separate adapters for multi-tenant serving (load the base once, switch tiny adapters per request).

**Limits.** PEFT matches full fine-tuning on many instruction/style tasks, but can lag on large distribution shifts; quantising the base can cost a little quality.
`,
  traps: [
    { trap: "LoRA adds inference latency.", why: "Only if kept unmerged; merging BA into W gives the original architecture and speed." },
    { trap: "QLoRA trains a 4-bit model.", why: "The base stays frozen in 4-bit; the trained LoRA adapters are in 16-bit, with computation de-quantising weights on the fly." },
    { trap: "Higher rank is always better.", why: "Beyond a modest rank gains flatten and overfitting risk rises; choose by validation." },
  ],
  say: {
    prompt: "Explain LoRA and QLoRA and when you'd choose them over full fine-tuning.",
    secs: 45,
    check: ["Freeze W; learn low-rank BA added to selected matrices", "Parameter count r(d + k) and a percentage example", "Merge for no latency, or swap adapters per task", "QLoRA: 4-bit frozen base + 16-bit adapters", "Trade-offs vs full fine-tuning; rank and target modules"],
    followups: [
      { q: "Why initialise B to zero?", a: "So BA = 0 at the start and the model initially behaves exactly like the pretrained model; training then learns the update from there." },
      { q: "How does multi-adapter serving work?", a: "Load the base model once and keep many small adapters; for each request apply the relevant adapter's BA (batched kernels exist), so many customised variants share one GPU." },
      { q: "When is full fine-tuning worth it?", a: "Large shifts in domain or language, when maximum quality matters and you can afford the compute, or when changing behaviour deeply (e.g. continued pre-training)." },
    ],
    answer: `LoRA freezes the pretrained weights and, for chosen matrices, learns a low-rank update B times A with rank r around 8 to 64, so a 4096 by 4096 matrix trains 65 thousand parameters at rank 8 instead of 16.8 million. That cuts gradient and optimiser memory dramatically, and afterwards you can merge the update into the weights for no extra latency or keep adapters separate and swap them per task on one base model. QLoRA goes further by storing the frozen base model in 4-bit, so a 7B model's weights take about 3.5 GB, while the adapters train in 16-bit.

I'd use them for most instruction, style and domain-format fine-tuning, especially on limited GPUs or when serving many variants; I'd consider full fine-tuning for very large domain or language shifts where adapters underperform.`,
    avoid: ["“LoRA always slows inference”", "“QLoRA trains in 4-bit”"],
  },
  terms: [["LoRA", "Low-rank adaptation: ΔW = BA added to frozen W."], ["Rank r", "Inner dimension of the adapter matrices."], ["QLoRA", "LoRA on a 4-bit quantised frozen base."], ["PEFT", "Parameter-efficient fine-tuning."]],
  sources: [S.lora, S.qlora],
});
Q({ id: "llm-lora-1", d: 1, secs: 30, prompt: "LoRA rank 8 on a 4,096 × 4,096 matrix. Trainable parameters?", answer: 65536, tol: 0.5, explain: "r(d + k) = 8 × 8192.", py: "answer = 8*(4096+4096)" });
Q({ id: "llm-lora-2", d: 2, secs: 45, prompt: "That as a percentage of the full matrix's parameters? (2 decimals)", answer: 0.39, tol: 0.005, explain: "65,536/16,777,216 = 0.39%.", py: "answer = 100*8*(4096+4096)/4096**2" });
Q({ id: "llm-lora-3", d: 1, secs: 30, prompt: "Base weights of a 7B model stored at 4 bits per parameter, in GB?", answer: 3.5, tol: 0.02, explain: "7e9 × 0.5 bytes.", py: "answer = 7e9*0.5/1e9" });
Q({ id: "llm-lora-4", d: 2, secs: 60, prompt: "With B initialised to zero, what is the LoRA model's output difference from the base model before any training step?", answer: 0, tol: 0.001, explain: "BA = 0, so h = Wx exactly.", py: "import numpy as np\nrng = np.random.default_rng(0)\nW = rng.normal(size=(6,6)); A = rng.normal(size=(2,6)); B = np.zeros((6,2)); x = rng.normal(size=6)\nanswer = float(np.abs((W + B@A)@x - W@x).max())", packages: ["numpy"] });
C("llm-lora-c1", "LoRA parameters", "r(d + k) per adapted matrix; merge BA into W for zero added latency.");

L("llm-distillation", PO, "Knowledge distillation", "Training small models from large ones: soft targets, temperature, sequence-level distillation and when it pays off.", {
  kind: "concept", mins: 20, prereq: ["llm-sft"],
  hook: "A 70B model is great at your task but costs too much per call. Can a 7B model learn to do the same job?",
  intuition: `
**The situation.** Big models are accurate but slow and expensive. Most products need a narrow slice of their ability.

**Classic distillation (Hinton et al.).** Train a small **student** to match the large **teacher's** full output distribution, not just the correct label. The teacher's probabilities on wrong answers carry information ("this 7 looks a bit like a 1"), so the student learns more per example. A **temperature** $T > 1$ softens both distributions to expose that information.

**LLM distillation in practice.** Often **sequence-level**: generate high-quality responses (and reasoning) from the teacher on many prompts and fine-tune the student on them (SFT on teacher outputs). With access to teacher logits you can also match token-level distributions.

**Limits.** The student can't exceed the teacher on what it was distilled on and loses breadth outside it. Check licences: some providers forbid using their outputs to train competing models.
`,
  maths: `
**In one breath.** $\\mathcal{L} = (1 - \\lambda)\\,\\text{CE}(y, p_s) + \\lambda\\,T^2\\,\\text{KL}\\big(\\text{softmax}(z_t/T)\\,\\|\\,\\text{softmax}(z_s/T)\\big)$.

**Temperature.** Logits (2, 1, 0): at $T = 1$ the top probability is 0.665; at $T = 2$ it's 0.506, revealing the relative scores of the other classes.

**KL example.** Teacher (0.7, 0.2, 0.1), student (0.5, 0.3, 0.2): $\\text{KL} = 0.7\\ln1.4 + 0.2\\ln\\frac23 + 0.1\\ln0.5 = 0.085$.

**Why $T^2$.** Softening shrinks gradients of the KL term by about $1/T^2$; multiplying by $T^2$ keeps its scale comparable to the hard-label loss ($T = 4$ → ×16).

| Approach | Needs | Notes |
|---|---|---|
| Logit (token-level) distillation | teacher logits | richest signal; same tokeniser helps |
| Sequence-level (SFT on teacher outputs) | teacher generations | easiest with API models; licence check |
| Reasoning distillation | teacher reasoning traces | strong gains on maths/code for small models |
| Task-specific distillation | prompts from your product | best cost/quality for narrow tasks |
`,
  practice: `
**Recipe for a product task.** Collect real prompts → generate teacher answers → filter (automatic checks, rubric, human spot checks) → fine-tune the student (often LoRA) → evaluate against the teacher on held-out prompts, with a fallback to the teacher for low-confidence cases.

**Economics.** Student cost per token roughly scales with parameters: a 7B student is ~10× cheaper to run than a 70B teacher, so distillation pays off at high volume.
`,
  traps: [
    { trap: "The student will be as good as the teacher everywhere.", why: "It approximates the teacher on the distribution you distilled on; outside it, the small model's limits show." },
    { trap: "Only the teacher's top answer matters.", why: "The soft distribution over alternatives carries much of the useful signal, especially at higher temperature." },
    { trap: "Any API model's outputs can be used for training.", why: "Terms of service may prohibit training competing models; check licences before distilling." },
  ],
  say: {
    prompt: "How would you use distillation to cut LLM serving costs for a specific task?",
    secs: 45,
    check: ["Teacher–student framing; soft targets with temperature (or sequence-level outputs)", "Generate and filter teacher outputs on real task prompts", "Fine-tune a smaller student (often LoRA)", "Evaluate vs teacher on held-out prompts; fallback routing", "Cost arithmetic and licence considerations"],
    followups: [
      { q: "Why does temperature help distillation?", a: "At T = 1 the teacher's distribution is peaked and the non-top classes carry tiny probabilities; raising T spreads probability so the student can learn the teacher's relative preferences among alternatives." },
      { q: "What is sequence-level distillation?", a: "Training the student on complete outputs generated by the teacher (rather than matching token distributions), which works even when you only have API access." },
      { q: "How do you decide when to fall back to the teacher?", a: "Use the student's confidence, a verifier or validation rules; send low-confidence or failing cases to the teacher, tuning the threshold for cost vs quality." },
    ],
    answer: `I'd make the big model the teacher and train a small student to imitate it on the task. With access to logits, the student matches the teacher's softened probability distribution at a temperature above one, which carries more information than the single best answer. More often with LLMs, it's sequence-level: run the teacher on a few thousand to hundreds of thousands of real prompts, filter the outputs with checks and spot reviews, and fine-tune a 7B-class student on them, usually with LoRA.

I'd evaluate the student against the teacher on held-out prompts using the task rubric, and route low-confidence cases back to the teacher. A 7B student is roughly ten times cheaper per token than a 70B teacher, so it pays off at volume. I'd also check the teacher's terms allow training on its outputs.`,
    avoid: ["“The student will match the teacher on everything”", "Ignoring licence terms"],
  },
  terms: [["Teacher / student", "Large source model / small model being trained."], ["Soft targets", "Teacher probabilities over all outputs."], ["Temperature", "Logit divisor that softens distributions."], ["Sequence-level distillation", "Fine-tuning on teacher-generated outputs."]],
  sources: [S.distill],
});
Q({ id: "llm-kd-1", d: 2, secs: 60, prompt: "Logits (2, 1, 0) at temperature T = 2. Probability of the top class? (3 decimals)", answer: 0.506, tol: 0.002, explain: "softmax(1, 0.5, 0) → 2.718/(2.718 + 1.649 + 1) = 0.506.", py: "import numpy as np\nz = np.array([2,1,0.])/2\np = np.exp(z)/np.exp(z).sum()\nanswer = float(p[0])", packages: ["numpy"] });
Q({ id: "llm-kd-2", d: 2, secs: 60, prompt: "KL(teacher ‖ student) with teacher (0.7, 0.2, 0.1) and student (0.5, 0.3, 0.2), natural log? (3 decimals)", answer: 0.085, tol: 0.002, explain: "0.7 ln 1.4 + 0.2 ln(2/3) + 0.1 ln 0.5 = 0.085.", py: "import numpy as np\np = np.array([0.7,0.2,0.1]); q = np.array([0.5,0.3,0.2])\nanswer = float((p*np.log(p/q)).sum())", packages: ["numpy"] });
Q({ id: "llm-kd-3", d: 1, secs: 30, prompt: "Distillation temperature T = 4. By what factor is the soft-target loss usually multiplied?", answer: 16, tol: 0.05, explain: "T² keeps gradient scale comparable.", py: "answer = 4**2" });
Q({ id: "llm-kd-4", d: 1, secs: 30, prompt: "Logits (2, 1, 0) at T = 1. Top-class probability? (3 decimals)", answer: 0.665, tol: 0.002, explain: "e²/(e² + e + 1) = 7.389/11.107.", py: "import numpy as np\nz = np.array([2,1,0.])\np = np.exp(z)/np.exp(z).sum()\nanswer = float(p[0])", packages: ["numpy"] });
C("llm-kd-c1", "Distillation loss", "(1 − λ)·CE(y, p_s) + λ·T²·KL(softmax(z_t/T) ‖ softmax(z_s/T)).");

L("llm-posttraining-practice", PO, "Post-training practice", "Interview scenarios on SFT, preference tuning, PEFT and distillation.", {
  kind: "interview", mins: 30, prereq: ["llm-sft", "llm-rlhf", "llm-dpo", "llm-lora", "llm-distillation"],
  hook: "Answer each out loud in about a minute, then open it and tick off the points the interviewer is listening for.",
}, [
  iq("Your fine-tuned support model got friendlier but now invents refund policies. What went wrong and what do you change?", "Fine-tuning shaped tone but can't reliably store policy facts, and may have rewarded confident answers. Move policy knowledge to RAG with citations, add training examples that abstain or ask for clarification when the policy isn't in context, and evaluate factual accuracy separately from tone.", ["Fine-tuning ≠ knowledge store", "RAG with citations", "Abstention examples", "Separate factuality eval"]),
  iq("You have 20k chosen/rejected pairs from user thumbs-up/down. RLHF with PPO or DPO?", "DPO (or KTO for single labels) first: no reward model or RL loop, two models in memory, stable. Check pairs for length and style biases. Consider PPO/online methods only if you have a reliable reward you can query and need exploration.", ["DPO/KTO for offline pairs", "Simplicity and cost", "Data bias checks", "When RL is worth it"]),
  iq("A team wants 40 customer-specific variants of one 8B model. How do you serve them affordably?", "Train a LoRA adapter per customer; serve one base model and load adapters per request (multi-adapter serving), batching requests across adapters. Storage is megabytes per adapter instead of 16 GB per full copy.", ["LoRA per customer", "Shared base, swapped adapters", "Storage/memory arithmetic"]),
  iq("Explain reward hacking with an example and how to detect it.", "The policy exploits flaws in the reward model, e.g. longer answers, flattery or hedging scoring higher regardless of quality. Detect via rising reward with flat or falling human ratings, growing response length, and KL from the reference; mitigate with KL penalties, length normalisation, RM retraining and early stopping.", ["Definition", "Concrete example", "Detection signals", "Mitigations"]),
  iq("Can you distil GPT-class API outputs into your own 7B model for production?", "Technically yes (sequence-level distillation via SFT on teacher outputs), but check the provider's terms, which may prohibit training competing models. Prefer teachers with permissive licences, filter outputs, evaluate the student vs teacher, and keep a fallback.", ["Feasible via SFT on outputs", "Licence/ToS check", "Filtering and evaluation", "Fallback routing"]),
]);
