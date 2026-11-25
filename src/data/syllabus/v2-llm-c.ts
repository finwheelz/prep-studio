/**
 * v2 NLP & LLMs, part C: LLM architecture (KV cache, MQA/GQA, mixture of experts, practice) ·
 * Pre-training. Fixed ids; answers recomputed in Pyodide.
 */
import { iq, lessonWriter } from "./v2-shared";
import { LS as S } from "./v2-llm-src";

const { L, Q, C } = lessonWriter("llm");
const AR = "LLM architecture";
const PT = "Pre-training";

// ───────────────────────── LLM architecture (part 2) ─────────────────────────

L("llm-kv-cache", AR, "KV cache, multi-query and grouped-query attention", "Why generation is memory-bound, how the KV cache works, and how MQA/GQA shrink it.", {
  kind: "concept", mins: 25, prereq: ["llm-self-attention", "llm-transformer-block"],
  hook: "A 7B model fits on one GPU, yet serving 50 users with long chats runs out of memory. What is eating it?",
  intuition: `
**The situation.** Generating text means producing one token at a time, and each new token attends to every previous token.

**The KV cache.** Recomputing keys and values for all earlier tokens at every step would be wasteful, since they don't change. So the model stores them: the **KV cache**. Each new token only computes its own query, key and value, appends its K and V to the cache, and attends over the cache.

**Two phases.**

- **Prefill:** process the whole prompt in parallel, filling the cache. Compute-bound, like training.
- **Decode:** one token at a time. Each step reads all the weights and the whole cache for very little arithmetic, so it's **memory-bandwidth-bound**.

**The cache gets big:** it grows with layers × KV heads × head size × sequence length × batch. For long contexts and many users it can exceed the model weights.

**MQA and GQA.** Multi-query attention shares one K/V head across all query heads; grouped-query attention shares each K/V head across a group (e.g. 32 query heads, 8 KV heads). The cache shrinks by that factor with little quality loss, which is why most current models use GQA.
`,
  maths: `
**In one breath.** KV bytes per token $= 2 \\times L \\times n_{kv} \\times d_{head} \\times \\text{bytes}$; total $=$ that × sequence length × batch.

**Worked example (Llama-2-7B-like, fp16).** $L = 32$, $n_{kv} = 32$, $d_{head} = 128$: $2 \\times 32 \\times 32 \\times 128 \\times 2 = 524{,}288$ bytes = 512 KiB per token. A 4,096-token context: 2.15 GB per sequence. Batch of 16 such chats: 34 GB, more than the 14 GB of fp16 weights.

**With GQA (8 KV heads):** 4× smaller, 128 KiB per token.

**Why decode is bandwidth-bound.** Generating one token with a 7B fp16 model reads ~14 GB of weights for ~14 GFLOPs: about 1 FLOP per byte, far below what GPUs can compute per byte of memory bandwidth. Batching many sequences reuses each weight read, which is why serving systems batch aggressively.

| Variant | KV heads | Cache size | Quality |
|---|---|---|---|
| Multi-head (MHA) | h | 1× | baseline |
| Grouped-query (GQA) | g (e.g. 8) | g/h | ≈ MHA |
| Multi-query (MQA) | 1 | 1/h | small drop |
`,
  practice: `
**Serving implications.** KV-cache memory decides how many concurrent requests fit; paged KV caches (vLLM's PagedAttention) avoid fragmentation; prefix caching reuses the cache for shared system prompts; KV quantisation (8-bit, 4-bit) trades a little quality for capacity.

**Sizing questions** in interviews almost always reduce to: weights memory + KV cache per token × tokens × batch, and tokens/second ≈ memory bandwidth / bytes read per step.
`,
  traps: [
    { trap: "If the weights fit in GPU memory, serving is fine.", why: "The KV cache grows with context and concurrency and often exceeds the weights. Size both." },
    { trap: "Decoding is slow because it needs lots of compute.", why: "Each step does little compute per byte read; it's limited by memory bandwidth. More FLOPs don't help; batching and smaller caches do." },
    { trap: "MQA/GQA reduce the number of attention heads.", why: "Query heads stay the same; only the number of distinct key/value heads shrinks, cutting cache size and bandwidth." },
  ],
  say: {
    prompt: "What is the KV cache, how big does it get, and how do GQA/MQA help?",
    secs: 60,
    check: ["Store past keys/values so each step computes only the new token", "Prefill compute-bound vs decode memory-bandwidth-bound", "Size = 2 × layers × KV heads × head dim × bytes × tokens × batch", "Concrete number (e.g. ~0.5 MB/token for a 7B MHA model in fp16)", "GQA/MQA share K/V heads across query heads → smaller cache, small quality cost"],
    followups: [
      { q: "What is PagedAttention?", a: "Storing the KV cache in fixed-size blocks like virtual-memory pages, so sequences don't need contiguous memory; it removes fragmentation and enables sharing prefixes, raising batch sizes." },
      { q: "Why does batching speed up decoding?", a: "Weights are read once per step regardless of batch size, so serving more sequences per read uses the GPU's spare compute; throughput rises until compute or KV memory becomes the limit." },
      { q: "How does prefix caching help a chatbot?", a: "The KV cache for a shared system prompt (or earlier conversation turns) is computed once and reused, cutting prefill time and cost for every request that shares it." },
    ],
    answer: `During generation each new token attends to all previous tokens, whose keys and values don't change, so the model stores them in a KV cache and computes only the new token's query, key and value each step. The prompt is processed in parallel in the prefill phase, which is compute-bound; token-by-token decoding reads all the weights and the cache for little arithmetic, so it's memory-bandwidth-bound.

The cache is 2 × layers × KV heads × head dimension × bytes per token: for a 7B model with 32 layers, 32 heads of 128 in fp16 that's about half a megabyte per token, 2 GB for a 4k context, so with many users it exceeds the weights. Grouped-query attention shares each key/value head across several query heads, say 8 KV heads for 32 query heads, cutting the cache 4× with almost no quality loss; multi-query goes to a single KV head.`,
    avoid: ["\u201cDecode is compute-bound\u201d", "Sizing serving by weights alone"],
  },
  terms: [["KV cache", "Stored keys/values of past tokens reused during decoding."], ["Prefill / decode", "Parallel prompt processing / token-by-token generation."], ["GQA", "Groups of query heads share one key/value head."], ["MQA", "All query heads share one key/value head."]],
  sources: [S.mqa, S.gqa],
});
Q({ id: "llm-kv-1", d: 2, secs: 60, prompt: "KV cache per token in KiB for 32 layers, 32 KV heads, head dim 128, fp16 (2 bytes)?", answer: 512, tol: 0.5, explain: "2 × 32 × 32 × 128 × 2 = 524,288 bytes = 512 KiB.", py: "answer = 2*32*32*128*2/1024" });
Q({ id: "llm-kv-2", d: 2, secs: 60, prompt: "Same model, one sequence of 4,096 tokens. KV cache in GB (10⁹ bytes)? (2 decimals)", answer: 2.15, tol: 0.01, explain: "524,288 × 4,096 = 2.147e9 bytes.", py: "answer = 2*32*32*128*2*4096/1e9" });
Q({ id: "llm-kv-3", d: 1, secs: 30, prompt: "32 query heads share 8 KV heads (GQA). By what factor does the KV cache shrink versus full multi-head attention?", answer: 4, tol: 0.05, explain: "32/8.", py: "answer = 32/8" });
Q({ id: "llm-kv-4", d: 2, secs: 60, prompt: "Decoding a 7B fp16 model reads ~14 GB per step. With 2 TB/s memory bandwidth and batch size 1, approximate upper bound on tokens per second?", answer: 143, tol: 2, explain: "2,000/14 ≈ 143 steps/s; batching shares each read across sequences.", py: "answer = 2000/14" });
C("llm-kv-c1", "KV cache size", "2 × layers × KV heads × head_dim × bytes × tokens × batch.");
C("llm-kv-c2", "Prefill vs decode", "Prefill: parallel, compute-bound. Decode: one token/step, memory-bandwidth-bound.");

L("llm-moe", AR, "Mixture of experts", "Sparse expert layers, routers, total vs active parameters, and load balancing.", {
  kind: "concept", mins: 25, prereq: ["llm-transformer-block"],
  hook: "A model has 47B parameters but each token only uses 13B. How, and what does that buy you?",
  intuition: `
**The situation.** Bigger models know more, but compute per token grows with parameters. Mixture-of-experts (MoE) decouples the two.

**The idea.** Replace the feed-forward network in some blocks with $E$ separate FFNs ("experts") and a small **router**. For each token the router scores the experts and sends the token to the top $k$ (often 1 or 2). Only those experts run. The model has many parameters in total (capacity, knowledge) but each token uses only a fraction (compute, latency).

**Costs.** All experts must sit in memory, so serving needs as much memory as a dense model of the total size. Routing must be **balanced**: if most tokens pick the same experts, those are overloaded and others never learn. Training adds an auxiliary load-balancing loss and caps how many tokens an expert accepts (capacity factor). Experts tend to specialise in token types or syntax more than neat human topics.
`,
  maths: `
**In one breath.** $y = \\sum_{i \\in \\text{top-}k}g_i(x)\\,E_i(x)$, with $g = \\text{softmax}$ over the selected router logits; active params $=$ shared $+ k \\times$ expert size.

**Worked example.** 2B shared parameters (attention, embeddings) and 8 experts of 5B each: total 42B. Top-2 routing: active 2 + 2 × 5 = 12B per token, so compute like a 12B dense model, memory like a 42B one.

**Router weights.** Logits (2, 1, 0.5, 0), top-2 picks experts 1 and 2; renormalised softmax over (2, 1): 0.731 and 0.269.

**Capacity.** 1,000 tokens, 8 experts, top-1, capacity factor 1.25: each expert accepts at most 156 tokens; overflow tokens skip the layer (pass through the residual).

**Load-balancing loss (Switch-style).** $\\alpha E\\sum_i f_i P_i$ where $f_i$ is the fraction of tokens sent to expert $i$ and $P_i$ the mean router probability for it; minimised when both are uniform.

| | Dense | MoE |
|---|---|---|
| Compute per token | all params | shared + k experts |
| Memory | all params | all params |
| Training stability | simpler | routing collapse, load balancing |
| Serving | simple | expert parallelism, all-to-all communication |
`,
  practice: `
**Why labs use it.** Better quality per training FLOP and per inference FLOP; the catch is memory and communication.

**Serving.** Experts are spread across GPUs (expert parallelism), tokens are exchanged all-to-all; batch sizes need to be large enough that every expert gets work. On a single small GPU an MoE's memory footprint often makes a dense model the better choice.

**Fine-tuning** MoE models is more delicate (router drift, imbalance); many teams freeze the router.
`,
  traps: [
    { trap: "An MoE with 12B active parameters needs the memory of a 12B model.", why: "All experts must be loaded because any token may route to any expert; memory scales with total parameters." },
    { trap: "Each expert specialises in a human topic like maths or law.", why: "Specialisation is mostly by token type and syntax patterns; topic-level experts are not what typically emerges." },
    { trap: "The router just needs to pick the best expert.", why: "Without load balancing a few experts get most tokens (collapse), others stop learning and throughput drops. Auxiliary losses and capacity limits are required." },
  ],
  say: {
    prompt: "How does a mixture-of-experts LLM work, and what are its trade-offs?",
    secs: 45,
    check: ["Several expert FFNs per MoE layer; router picks top-k per token", "Total vs active parameters; compute like the active size", "Memory like the total size", "Load balancing loss, capacity factor, routing collapse", "Serving: expert parallelism, communication"],
    followups: [
      { q: "Why top-2 rather than top-1?", a: "Top-2 gives smoother gradients to the router and more capacity per token at modest extra compute; Switch Transformers showed top-1 can work with careful balancing and is cheaper." },
      { q: "What happens to tokens over an expert's capacity?", a: "They're dropped from that layer (passed through the residual connection) or routed to the next choice, depending on implementation." },
      { q: "When would you pick a dense model over an MoE for deployment?", a: "When memory is the binding constraint (single GPU, edge), batch sizes are small, or operational simplicity matters more than per-FLOP quality." },
    ],
    answer: `In an MoE model some feed-forward layers are replaced by several expert networks plus a router. For each token the router scores the experts and sends it to the top one or two, and their outputs are combined with the router weights. So a model with, say, 47 billion parameters might use only 13 billion per token: compute and latency like a 13B model, knowledge capacity closer to the larger one.

The trade-offs: every expert must be in memory, so serving memory is like the full model; routing must be balanced with an auxiliary loss and capacity limits or a few experts get everything; and spreading experts across GPUs adds all-to-all communication. It pays off at scale with big batches; on a single small GPU a dense model is often more practical.`,
    avoid: ["\u201cMemory needed is just the active parameters\u201d", "Ignoring load balancing"],
  },
  terms: [["Expert", "One of several FFNs in an MoE layer."], ["Router / gate", "Scores experts and selects top-k per token."], ["Active parameters", "Parameters used for one token."], ["Capacity factor", "Max tokens per expert relative to an even split."]],
  sources: [S.switch],
});
Q({ id: "llm-moe-1", d: 2, secs: 60, prompt: "2B shared parameters plus 8 experts of 5B each, top-2 routing. Active parameters per token, in billions?", answer: 12, tol: 0.05, explain: "2 + 2 × 5.", py: "answer = 2 + 2*5" });
Q({ id: "llm-moe-2", d: 1, secs: 30, prompt: "Same model: total parameters in billions?", answer: 42, tol: 0.05, explain: "2 + 8 × 5.", py: "answer = 2 + 8*5" });
Q({ id: "llm-moe-3", d: 2, secs: 60, prompt: "Router logits (2, 1, 0.5, 0), top-2 routing with softmax renormalised over the chosen two. Weight on the top expert? (3 decimals)", answer: 0.731, tol: 0.002, explain: "softmax(2, 1) = (0.731, 0.269).", py: "import numpy as np\nz = np.array([2,1,0.5,0.])\nt = np.sort(z)[-2:][::-1]\nw = np.exp(t)/np.exp(t).sum()\nanswer = float(w[0])", packages: ["numpy"] });
Q({ id: "llm-moe-4", d: 2, secs: 45, prompt: "1,000 tokens, 8 experts, top-1 routing, capacity factor 1.25. Maximum tokens per expert? (2 decimals)", answer: 156.25, tol: 0.01, explain: "1000/8 × 1.25.", py: "answer = 1000/8*1.25" });
C("llm-moe-c1", "MoE trade-off", "Compute ∝ active params; memory ∝ total params; needs load balancing.");

L("llm-architecture-practice", AR, "LLM architecture practice", "Interview scenarios on attention, transformer blocks, positions, model families and inference memory.", {
  kind: "interview", mins: 35, prereq: ["llm-self-attention", "llm-transformer-block", "llm-positions", "llm-encoder-decoder", "llm-kv-cache", "llm-moe"],
  hook: "Answer each out loud in about a minute, then open it and tick off the points the interviewer is listening for.",
}, [
  iq("Estimate the GPU memory to serve a 13B-parameter model in fp16 for 8 concurrent users with 4k-token contexts (40 layers, 40 heads of 128, no GQA).", "Weights: 13e9 × 2 bytes = 26 GB. KV per token: 2 × 40 × 40 × 128 × 2 = 819 KB; × 4,096 tokens × 8 users ≈ 26.8 GB. Total ≈ 53 GB plus activations and overhead → an 80 GB GPU, or quantise weights/KV, or use a GQA model.", ["Weights = params × bytes", "KV formula with numbers", "Total and headroom", "Mitigations (quantisation, GQA, paging)"]),
  iq("Why does a transformer need positional information, and what would happen without it?", "Self-attention is permutation-equivariant: without positions the model sees a bag of tokens and can't distinguish orderings like \"dog bites man\" from \"man bites dog\". Positional encodings (learned, sinusoidal, RoPE) inject order; RoPE makes attention depend on relative distance.", ["Permutation equivariance", "Example", "How encodings fix it", "RoPE relative property"]),
  iq("You need to classify 50 million short texts per day into 20 categories. GPT-style LLM or BERT-style encoder?", "A fine-tuned small encoder: bidirectional representations suit classification, it's orders of magnitude cheaper and faster per request, and accuracy on a narrow task is usually comparable. Use an LLM to bootstrap labels or for rare/ambiguous cases.", ["Encoder fits classification", "Cost/latency at volume", "LLM for labelling / edge cases"]),
  iq("Explain why the attention score is divided by √d_k.", "With unit-variance components the dot product of query and key has variance d_k; large scores push softmax towards one-hot, producing tiny gradients. Dividing by √d_k keeps scores at unit scale so attention stays trainable.", ["Variance grows with d_k", "Softmax saturation", "Vanishing gradients", "Scaling fixes it"]),
  iq("A 47B MoE model has 13B active parameters. Your manager expects it to run on the same GPU as your 13B dense model. Respond.", "Compute per token is similar to a 13B model, but all 47B parameters must be in memory because any token can route to any expert: ~94 GB in fp16 vs 26 GB. It needs more or larger GPUs (or aggressive quantisation); benefits show up in quality per FLOP and throughput at scale.", ["Active vs total parameters", "Memory scales with total", "Concrete numbers", "When MoE pays off"]),
  iq("Generation latency is dominated by decode, not prefill, for long answers. Why, and what helps?", "Decode produces one token per step and each step reads all weights and the KV cache: memory-bandwidth-bound. Helps: batching (continuous batching), smaller weights (quantisation), smaller KV (GQA, KV quantisation), speculative decoding, and shorter outputs.", ["Sequential steps", "Bandwidth-bound", "Batching", "Quantisation / GQA / speculative decoding"]),
]);

// ───────────────────────── Pre-training ─────────────────────────

L("llm-next-token", PT, "The next-token objective and what pre-training learns", "Self-supervised learning on text, teacher forcing, base vs chat models, and the FLOPs of a training run.", {
  kind: "concept", mins: 25, prereq: ["llm-perplexity", "llm-encoder-decoder"],
  hook: "Nobody labels data for pre-training. So where does a model learn grammar, facts and arithmetic from?",
  intuition: `
**The situation.** A base LLM is trained on trillions of tokens of text with one task: predict the next token.

**Why that's enough to learn a lot.** To predict the next token of a news article you need grammar; of a Wikipedia article, facts; of a solved maths problem, some arithmetic; of code, syntax and semantics. The labels come free from the text itself (**self-supervised**), so data scales almost without limit.

**Teacher forcing.** During training the model always conditions on the true previous tokens, and all positions in a sequence are predicted in parallel thanks to the causal mask. One sequence of 2,048 tokens gives 2,048 training targets.

**Base vs chat.** A base model continues text; asked a question it may answer, continue with more questions, or ramble. Post-training (SFT, preference tuning) turns it into an assistant. Most knowledge comes from pre-training; post-training mostly shapes behaviour and format.
`,
  maths: `
**In one breath.** Minimise $-\\frac1T\\sum_t\\log p_\\theta(x_t \\mid x_{<t})$ over the corpus; training compute $\\approx 6ND$ FLOPs ($N$ parameters, $D$ tokens).

**Starting point.** A randomly initialised model predicting uniformly over $V = 32{,}000$ tokens has loss $\\ln 32000 = 10.37$; good 7B models reach roughly 1.5–2 nats/token on web text.

**Tokens per step.** Batch 512 sequences × 2,048 tokens = 1,048,576 tokens/step (≈1M). Training on 1T tokens: about 954k steps.

**Compute.** $6ND$: 2 FLOPs per parameter per token forward, 4 backward. 7B parameters on 2T tokens: $6 \\times 7\\times10^9 \\times 2\\times10^{12} = 8.4\\times10^{22}$ FLOPs. On GPUs sustaining $0.4\\times10^{15}$ FLOP/s each (40% of a $10^{15}$ peak): $8.4\\times10^{22}/4\\times10^{14} = 2.1\\times10^{8}$ GPU-seconds ≈ 58,000 GPU-hours.

**Packing.** Short documents are concatenated with separator tokens into full-length sequences so no compute is wasted on padding (with attention masks or accepted cross-document leakage).
`,
  practice: `
**What you'll do in practice** is rarely pre-train from scratch: continued pre-training on domain text (legal, financial, Indic languages) is the realistic version, followed by instruction tuning.

**Signals to watch.** Training loss, validation loss on held-out domains, downstream evals at checkpoints, loss spikes (learning rate, data glitches), and throughput (tokens/s, utilisation).
`,
  traps: [
    { trap: "Pre-training needs labelled data.", why: "The next token is the label: text supervises itself, which is why it scales to trillions of tokens." },
    { trap: "A base model is a chatbot that hasn't been polished.", why: "It's a text continuer. It may not follow instructions at all; post-training creates assistant behaviour." },
    { trap: "Post-training is where the model learns most of its knowledge.", why: "Knowledge comes overwhelmingly from pre-training; post-training mainly shapes format, helpfulness and safety (and can make knowledge easier to elicit)." },
  ],
  say: {
    prompt: "What does an LLM learn during pre-training, and how expensive is it?",
    secs: 45,
    check: ["Self-supervised next-token prediction on large text corpora", "Teacher forcing; every position is a target in parallel", "Learns grammar, facts, reasoning patterns as a by-product", "Base vs chat model distinction", "Compute ≈ 6ND with a worked number"],
    followups: [
      { q: "Where does the 6 in 6ND come from?", a: "A forward pass costs about 2 FLOPs per parameter per token (multiply and add); the backward pass costs about twice the forward, so ≈ 6 in total." },
      { q: "What's continued pre-training and when is it worth it?", a: "Further next-token training of a base model on domain text. Worth it when the domain has lots of unlabelled text and vocabulary or knowledge the base model lacks; follow with instruction tuning." },
      { q: "What is exposure bias?", a: "With teacher forcing the model always sees true previous tokens in training but its own (possibly wrong) tokens at generation time, so errors can compound." },
    ],
    answer: `Pre-training is self-supervised: the model sees huge amounts of text and learns to predict each next token, with the true previous tokens as context, and every position in a sequence is a training target at once because of the causal mask. To do that well it has to pick up grammar, facts, coding patterns and some reasoning, so those come out as by-products.

The result is a base model that continues text; instruction tuning and preference training later turn it into an assistant, but most knowledge comes from pre-training. Cost is roughly 6 × parameters × tokens in FLOPs: a 7B model on 2 trillion tokens is about 8 × 10²² FLOPs, tens of thousands of GPU-hours on modern accelerators.`,
    avoid: ["\u201cPre-training uses labelled question–answer pairs\u201d", "Confusing base and chat models"],
  },
  terms: [["Self-supervised", "Labels derived from the data itself."], ["Teacher forcing", "Condition on true previous tokens during training."], ["Base model", "Pre-trained model before instruction/preference tuning."], ["6ND", "Approximate training FLOPs."]],
  sources: [S.gpt3, S.kaplan],
});
Q({ id: "llm-nt-1", d: 1, secs: 30, prompt: "Initial loss of a model predicting uniformly over 32,000 tokens? (2 decimals, nats)", answer: 10.37, tol: 0.01, explain: "ln 32000.", py: "import math\nanswer = math.log(32000)" });
Q({ id: "llm-nt-2", d: 2, secs: 60, prompt: "Batches of 512 sequences × 2,048 tokens. Steps to train on 10¹² tokens? (nearest thousand)", answer: 953674, tol: 1000, explain: "1e12/1,048,576 ≈ 953,674.", py: "answer = 1e12/(512*2048)" });
Q({ id: "llm-nt-3", d: 2, secs: 60, prompt: "Training FLOPs ≈ 6ND for N = 7 × 10⁹ parameters and D = 2 × 10¹² tokens. Answer in units of 10²² FLOPs.", answer: 8.4, tol: 0.01, explain: "6 × 7e9 × 2e12 = 8.4e22.", py: "answer = 6*7e9*2e12/1e22" });
Q({ id: "llm-nt-4", d: 3, secs: 90, prompt: "That run on GPUs sustaining 0.4 × 10¹⁵ FLOP/s each. GPU-hours needed? (nearest thousand)", answer: 58333, tol: 1000, explain: "8.4e22 / 4e14 = 2.1e8 s = 58,333 GPU-hours.", py: "answer = 8.4e22/(0.4e15)/3600" });
C("llm-nt-c1", "Training compute", "≈ 6 × parameters × tokens FLOPs (2 forward + 4 backward).");

L("llm-pretraining-data", PT, "Pre-training data: deduplication, filtering and mixtures", "Where pre-training text comes from and how it's cleaned, deduplicated, mixed and checked for contamination.", {
  kind: "concept", mins: 25, prereq: ["llm-next-token"],
  hook: "Two labs train the same architecture on the same compute. One model is clearly better. The difference is usually not the code. What is it?",
  intuition: `
**The situation.** Model quality depends heavily on what text goes in. Web crawls are huge and mostly low quality: boilerplate, spam, duplicates, machine-generated junk.

**The pipeline.**

1. **Collect:** web crawl (Common Crawl), books, code, papers, encyclopaedias, multilingual sources, licensed data.
2. **Extract and clean:** strip HTML and boilerplate, identify language, remove PII where required.
3. **Filter for quality:** heuristics (length, symbol ratios, repeated lines), classifiers trained to recognise "reference-like" text, perplexity filters, toxicity filters.
4. **Deduplicate:** exact (hashes) and near-duplicate (MinHash/LSH on n-gram shingles). Duplicates waste compute and encourage memorisation.
5. **Mix:** choose proportions of web, code, maths, books, languages, and possibly upsample high-quality sources for more than one epoch.
6. **Decontaminate:** remove text overlapping evaluation benchmarks so scores mean something.
`,
  maths: `
**In one breath.** Near-duplicates are found by Jaccard similarity of shingle sets $J(A, B) = \\frac{|A \\cap B|}{|A \\cup B|}$, estimated with MinHash: the probability that two documents share a MinHash value equals $J$.

**Worked examples.**

- Shingles A = {a, b, c, d}, B = {b, c, d, e}: $J = 3/5 = 0.6$. With 128 MinHash functions, expect about 77 matching signature entries.
- LSH banding: split 128 hashes into 16 bands of 8; two documents become candidates if any band matches entirely. Probability $1 - (1 - J^8)^{16}$: high for $J = 0.9$, low for $J = 0.5$, giving a sharp threshold.
- Mixture: 20% code in a 1T-token run = 200B code tokens.
- Repetition: a 100B-token high-quality corpus upsampled to 400B training tokens = 4 epochs; returns diminish after a few epochs.

| Step | Removes | Risk if skipped |
|---|---|---|
| Boilerplate extraction | menus, footers | model learns junk patterns |
| Quality filtering | spam, gibberish | worse fluency, wasted compute |
| Deduplication | repeated docs | memorisation, privacy leaks, wasted compute |
| Toxicity/PII filtering | harmful, personal data | unsafe outputs, legal issues |
| Decontamination | benchmark text | inflated, meaningless eval scores |
`,
  practice: `
**For your own work** (continued pre-training or fine-tuning datasets), the same rules apply at smaller scale: deduplicate, filter quality, check overlap with your eval set, and track data provenance and licences.

**Data mixture ablations** at small scale (e.g. 1B models on 20B tokens) are the standard way to choose mixtures before a big run.
`,
  traps: [
    { trap: "More data is always better, so keep everything.", why: "Low-quality and duplicated text wastes compute and can hurt quality; filtered data often beats more raw data at equal compute." },
    { trap: "Exact-hash deduplication is enough.", why: "Most web duplication is near-duplicate (templates, mirrored pages with small edits); you need MinHash/LSH-style fuzzy dedup." },
    { trap: "Benchmark scores show general ability.", why: "If benchmark text leaked into pre-training, the model may have memorised answers. Decontaminate and use held-out or fresh evals." },
  ],
  say: {
    prompt: "How is pre-training data prepared, and why does it matter so much?",
    secs: 60,
    check: ["Sources and mixture (web, code, books, maths, languages)", "Cleaning and quality filtering (heuristics, classifiers, perplexity)", "Exact and near deduplication (MinHash/LSH)", "Safety/PII filtering and licensing", "Decontamination against evals; mixture chosen by small-scale ablations"],
    followups: [
      { q: "How does MinHash estimate Jaccard similarity?", a: "Apply a random hash to every shingle and keep the minimum; the chance two documents share that minimum equals their Jaccard similarity. Many hash functions give an estimate; LSH banding finds candidate pairs without comparing all pairs." },
      { q: "Why does duplication hurt beyond wasted compute?", a: "Repeated text is memorised, increasing verbatim regurgitation (including private data) and skewing the model towards over-represented content." },
      { q: "How would you pick the share of code in the mixture?", a: "Run small-scale ablations with different shares and measure both coding and general benchmarks; code tends to help reasoning, but too much can hurt natural-language quality." },
    ],
    answer: `Data is probably the biggest quality lever. Labs gather web crawl, code, books, papers and multilingual text, extract clean text from HTML, then filter for quality with heuristics like length and symbol ratios plus classifiers that recognise reference-quality text. They deduplicate both exactly, with hashes, and fuzzily, with MinHash and locality-sensitive hashing over n-gram shingles, because near-duplicates waste compute and cause memorisation. They filter PII and toxic content, decide the mixture of sources, usually by small-scale ablations, and remove anything overlapping evaluation benchmarks so scores aren't inflated.

The same principles apply when I build smaller datasets for continued pre-training or fine-tuning: dedupe, filter, track provenance, and check overlap with my evals.`,
    avoid: ["\u201cJust use all of Common Crawl\u201d", "Ignoring contamination"],
  },
  terms: [["Near-duplicate detection", "Finding documents with high shingle overlap (MinHash/LSH)."], ["Data mixture", "Proportions of each source in training."], ["Decontamination", "Removing eval-set text from training data."], ["Quality classifier", "Model scoring documents for reference-like quality."]],
  sources: [S.gpt3, S.chinchilla],
});
Q({ id: "llm-pd-1", d: 1, secs: 30, prompt: "Jaccard similarity of shingle sets {a, b, c, d} and {b, c, d, e}?", answer: 0.6, tol: 0.002, explain: "3 shared / 5 total.", py: "A, B = set('abcd'), set('bcde')\nanswer = len(A & B)/len(A | B)" });
Q({ id: "llm-pd-2", d: 2, secs: 45, prompt: "With 128 MinHash functions and true Jaccard 0.6, expected number of matching signature entries? (1 decimal)", answer: 76.8, tol: 0.05, explain: "Each entry matches with probability J: 128 × 0.6.", py: "answer = 128*0.6" });
Q({ id: "llm-pd-3", d: 3, secs: 90, prompt: "LSH with 16 bands of 8 rows. Probability two documents with Jaccard 0.9 become a candidate pair: 1 − (1 − J⁸)¹⁶? (3 decimals)", answer: 1, tol: 0.002, explain: "0.9⁸ = 0.43; 1 − 0.57¹⁶ ≈ 0.99988 ≈ 1.000.", py: "J = 0.9\nanswer = 1 - (1 - J**8)**16" });
Q({ id: "llm-pd-4", d: 2, secs: 60, prompt: "Same banding, Jaccard 0.5. Candidate probability? (3 decimals)", answer: 0.061, tol: 0.002, explain: "0.5⁸ = 0.0039; 1 − (1 − 0.0039)¹⁶ ≈ 0.061: the banding creates a sharp threshold.", py: "J = 0.5\nanswer = 1 - (1 - J**8)**16" });
C("llm-pd-c1", "MinHash", "P(min-hash values equal) = Jaccard similarity of shingle sets.");

L("llm-scaling-laws", PT, "Scaling laws: Kaplan vs Chinchilla", "How loss falls with parameters, data and compute, and how to split a compute budget between them.", {
  kind: "concept", mins: 25, prereq: ["llm-next-token"],
  hook: "You have a fixed compute budget. Train a 70B model on 300B tokens, or a smaller model on far more tokens?",
  intuition: `
**The situation.** Training runs cost millions. Labs need to predict, before spending, how good a model will be and how to divide compute between model size and data.

**The idea.** Test loss falls smoothly, roughly as a **power law**, in model size $N$, data $D$ and compute $C$, across many orders of magnitude. That makes it predictable from small experiments.

- **Kaplan et al. (2020)** concluded that for a fixed compute budget you should grow model size much faster than data: big models, relatively few tokens.
- **Chinchilla (Hoffmann et al., 2022)** redid the analysis with better-tuned learning-rate schedules and found parameters and tokens should grow **in equal proportion**: about **20 tokens per parameter**. Their 70B model trained on 1.4T tokens beat much larger models trained on fewer tokens with the same compute.

**After Chinchilla.** Compute-optimal is about training cost only. Because smaller models are cheaper to serve, labs now often train well past 20 tokens/parameter ("over-training"), e.g. 8B models on 15T tokens: more training compute, much cheaper inference.
`,
  maths: `
**In one breath.** $C \\approx 6ND$; Chinchilla-optimal $D \\approx 20N$, so $N \\approx \\sqrt{C/120}$ and $D \\approx \\sqrt{C \\cdot 20/6}$; loss $L(N, D) \\approx E + \\frac{A}{N^\\alpha} + \\frac{B}{D^\\beta}$.

**Worked example.** $C = 10^{23}$ FLOPs: $N = \\sqrt{10^{23}/120} = 2.9\\times10^{10}$ (≈ 29B parameters), $D = 20N \\approx 577$B tokens.

**Chinchilla itself.** 70B parameters × 1.4T tokens: ratio 20; compute $6 \\times 70\\times10^9 \\times 1.4\\times10^{12} = 5.9\\times10^{23}$ FLOPs.

**Reading the loss form.** $E$ is the irreducible entropy of text; the other terms shrink as $N$ or $D$ grow. Doubling only $N$ while holding $D$ fixed eventually stops helping because the data term dominates.

| View | Optimises | Typical ratio (tokens/param) |
|---|---|---|
| Kaplan 2020 | training loss per compute | ~1–2 for big models |
| Chinchilla 2022 | training loss per compute | ~20 |
| Inference-aware | total cost incl. serving | 100–2,000 (small models trained long) |
`,
  practice: `
**How it's used.** Fit scaling curves on a ladder of small runs, extrapolate to choose model size, token count and hyperparameters for the big run; also to compare architectures or data mixtures by their curves rather than one point.

**Caveats.** Laws describe pre-training loss, not every downstream ability; some benchmarks improve smoothly in loss but appear to jump when measured with thresholded metrics. Data quality shifts the curves; repeated data helps less than fresh data.
`,
  traps: [
    { trap: "Bigger models are always the better use of compute.", why: "At fixed compute, an undertrained big model loses to a smaller model trained on more tokens (Chinchilla's result)." },
    { trap: "Chinchilla-optimal is what everyone should train.", why: "It minimises training compute for a target loss. If the model will serve billions of tokens, training a smaller model longer is cheaper overall." },
    { trap: "Scaling laws predict exactly which abilities appear.", why: "They predict loss well; specific task metrics can behave less smoothly, especially with thresholded scoring." },
  ],
  say: {
    prompt: "Explain the Chinchilla scaling result and how you'd allocate a fixed training budget.",
    secs: 60,
    check: ["Loss follows power laws in N, D, C; C ≈ 6ND", "Kaplan favoured bigger models; Chinchilla: scale N and D equally (~20 tokens/param)", "Worked allocation from a compute budget", "Inference cost motivates over-training smaller models", "Use small-run ladders to fit and extrapolate"],
    followups: [
      { q: "Why did Kaplan and Chinchilla disagree?", a: "Mainly experimental setup: Kaplan's runs used learning-rate schedules not matched to the number of training tokens, which underestimated the benefit of more data; Chinchilla tuned schedules per run length." },
      { q: "Why do labs train 8B models on 15T tokens?", a: "Serving cost scales with model size; spending extra training compute to make a small model better saves far more at inference over its lifetime." },
      { q: "What limits scaling data?", a: "The supply of high-quality text; repeated epochs give diminishing returns, so labs invest in filtering, synthetic data and new domains like code and maths." },
    ],
    answer: `Pre-training loss falls as a smooth power law in parameters, tokens and compute, and compute is about 6 × parameters × tokens. Kaplan's 2020 analysis suggested putting most extra compute into model size, but Chinchilla in 2022 found that parameters and tokens should grow together, about 20 tokens per parameter; their 70B model on 1.4 trillion tokens beat much larger, under-trained models at the same compute.

For a 10²³ FLOP budget that suggests roughly a 29B model on about 580B tokens. In practice I'd also count inference: if the model will serve a lot of traffic, I'd train a smaller model on many more tokens than Chinchilla-optimal, which costs more to train and much less to run. I'd decide by fitting curves on a ladder of small runs.`,
    avoid: ["\u201cAlways train the biggest model you can\u201d", "Treating 20 tokens/param as a law for deployment decisions"],
  },
  terms: [["Scaling law", "Power-law relation of loss to N, D or C."], ["Compute-optimal", "Allocation minimising loss for given training FLOPs."], ["Over-training", "Training past compute-optimal tokens to get a smaller model for cheaper inference."]],
  sources: [S.kaplan, S.chinchilla],
});
Q({ id: "llm-sl-1", d: 2, secs: 90, prompt: "Compute budget 10²³ FLOPs, C ≈ 6ND and D ≈ 20N. Compute-optimal parameters, in billions? (1 decimal)", answer: 28.9, tol: 0.1, explain: "N = √(C/120) = 2.89e10.", py: "import math\nanswer = math.sqrt(1e23/120)/1e9" });
Q({ id: "llm-sl-2", d: 1, secs: 30, prompt: "Chinchilla: 70B parameters trained on 1.4T tokens. Tokens per parameter?", answer: 20, tol: 0.05, explain: "1.4e12/7e10.", py: "answer = 1.4e12/70e9" });
Q({ id: "llm-sl-3", d: 2, secs: 60, prompt: "Training compute for Chinchilla (6ND), in units of 10²³ FLOPs? (2 decimals)", answer: 5.88, tol: 0.01, explain: "6 × 7e10 × 1.4e12 = 5.88e23.", py: "answer = 6*70e9*1.4e12/1e23" });
Q({ id: "llm-sl-4", d: 2, secs: 60, prompt: "An 8B model trained on 15T tokens. How many times the Chinchilla-optimal token count (20 per parameter)? (1 decimal)", answer: 93.8, tol: 0.1, explain: "15e12/(20 × 8e9) = 93.75.", py: "answer = 15e12/(20*8e9)" });
C("llm-sl-c1", "Chinchilla rule", "≈ 20 tokens per parameter for compute-optimal training; C ≈ 6ND.");

L("llm-training-scale", PT, "Training at scale: precision, memory and parallelism", "Mixed precision, where training memory goes, data/tensor/pipeline parallelism, ZeRO/FSDP and checkpointing.", {
  kind: "concept", mins: 30, prereq: ["llm-next-token"],
  hook: "A 7B model is 14 GB in bf16. Why can't you fine-tune it fully on a single 80 GB GPU with plain Adam?",
  intuition: `
**The situation.** Training memory isn't just the weights. With Adam you also store gradients and two optimiser moments, usually in higher precision, plus activations for the backward pass.

**Mixed precision.** Do matrix multiplies in 16-bit (bf16 or fp16) for speed and memory, keep an fp32 master copy of weights and optimiser state for accurate updates. bf16 has fp32's exponent range, so it rarely needs loss scaling; fp16 needs loss scaling to avoid underflowing gradients.

**Splitting the work across GPUs.**

- **Data parallel:** every GPU holds a full model copy, processes different data, and gradients are averaged. Simple; memory per GPU unchanged.
- **ZeRO / FSDP:** shard optimiser state, gradients and even parameters across data-parallel GPUs, gathering them only when needed.
- **Tensor parallel:** split individual matrix multiplies across GPUs (within a node, fast links).
- **Pipeline parallel:** put different layers on different GPUs and stream micro-batches through.

**Activation checkpointing** stores only some activations and recomputes the rest during the backward pass, trading ~30% more compute for much less memory.
`,
  maths: `
**In one breath.** Mixed-precision Adam ≈ 16 bytes/parameter: 2 (bf16 weights) + 2 (bf16 grads) + 4 (fp32 master) + 4 + 4 (Adam m, v); ZeRO-3 divides that by the number of GPUs.

**Worked examples.**

- 7B parameters × 16 bytes = 112 GB before activations: doesn't fit one 80 GB GPU.
- ZeRO-3 / FSDP over 8 GPUs: 14 GB each for model and optimiser state.
- Inference only, bf16: 14 GB. 4-bit quantised: ~3.5 GB.
- Global batch 1,024 sequences, micro-batch 8 per GPU, 16 GPUs: 1024/(8 × 16) = 8 gradient-accumulation steps.

**Communication.** Data parallel all-reduces gradients every step (≈ 2× parameter bytes per GPU); tensor parallel communicates inside every layer, so it's kept within a node; pipeline parallel has "bubbles" of idle time, reduced with more micro-batches.

| Technique | Saves | Costs |
|---|---|---|
| bf16 mixed precision | memory, time | fp32 master copy |
| ZeRO-1/2/3, FSDP | optimiser/grad/param memory | extra communication |
| Tensor parallel | per-layer memory | intra-layer communication |
| Pipeline parallel | per-GPU layers | pipeline bubbles |
| Activation checkpointing | activation memory | ~30% recompute |
| Gradient accumulation | large effective batch | more steps per update |
`,
  practice: `
**Fine-tuning reality.** Full fine-tuning a 7B model needs multiple GPUs with FSDP/ZeRO or memory tricks; LoRA/QLoRA (post-training module) cut memory enough for a single GPU.

**Throughput metric.** Model FLOPs utilisation (MFU): achieved FLOPs / peak FLOPs; 35–55% is good for large runs.

**Stability.** Large runs see loss spikes; mitigations include learning-rate warm-up and decay, gradient clipping, bf16 instead of fp16, QK-norm/z-loss, and restarting from a checkpoint skipping bad batches.
`,
  traps: [
    { trap: "Memory needed = parameters × 2 bytes.", why: "That's inference weights only. Training with Adam needs ~16 bytes/param plus activations." },
    { trap: "Data parallelism lets you train bigger models.", why: "Plain data parallelism replicates the full model on every GPU; it increases throughput, not the maximum model size. Use ZeRO/FSDP or model parallelism." },
    { trap: "fp16 and bf16 are interchangeable.", why: "fp16 has a narrow exponent range and needs loss scaling; bf16 keeps fp32's range with less mantissa, which is why it's preferred for training." },
  ],
  say: {
    prompt: "Where does memory go when training an LLM, and how do you fit a large model across GPUs?",
    secs: 60,
    check: ["Weights, gradients, optimiser state (Adam m, v), fp32 master copy, activations", "≈ 16 bytes/param for mixed-precision Adam with an example", "Data parallel vs ZeRO/FSDP sharding vs tensor vs pipeline parallel", "Activation checkpointing and gradient accumulation", "bf16 vs fp16 (loss scaling)"],
    followups: [
      { q: "What do ZeRO stages 1, 2 and 3 shard?", a: "Stage 1: optimiser state. Stage 2: plus gradients. Stage 3: plus parameters (gathered layer by layer when needed), equivalent in spirit to FSDP." },
      { q: "Why keep tensor parallelism within a node?", a: "It communicates inside every layer's forward and backward pass; that needs very high bandwidth like NVLink, while slower cross-node links suit data or pipeline parallelism." },
      { q: "How does gradient accumulation relate to batch size?", a: "Sum gradients over several micro-batches before one optimiser step, giving a large effective batch without the memory of processing it at once." },
    ],
    answer: `Training memory has five parts: the weights, the gradients, the optimiser state (Adam keeps two moments per parameter, usually in fp32), an fp32 master copy of the weights in mixed precision, and activations saved for the backward pass. That's about 16 bytes per parameter before activations, so a 7B model needs about 112 GB, more than one 80 GB GPU, even though inference weights are only 14 GB in bf16.

To fit it, I'd shard optimiser state, gradients and parameters across GPUs with ZeRO-3 or FSDP, use activation checkpointing to trade recompute for memory, and gradient accumulation to reach the batch size I want. For very large models, tensor parallelism splits layers within a node and pipeline parallelism splits the stack across nodes. bf16 is preferred over fp16 because its exponent range avoids loss scaling.`,
    avoid: ["\u201cJust parameters × 2 bytes\u201d", "\u201cData parallelism fits bigger models\u201d"],
  },
  terms: [["Mixed precision", "16-bit compute with fp32 master weights."], ["ZeRO / FSDP", "Sharding optimiser state, gradients and parameters across GPUs."], ["Tensor / pipeline parallel", "Splitting within layers / across layers."], ["Activation checkpointing", "Recompute activations in backward to save memory."]],
  sources: [S.mixed, S.zero],
});
Q({ id: "llm-ts-1", d: 1, secs: 30, prompt: "Mixed-precision Adam at ~16 bytes per parameter. Memory for a 7B model's weights, gradients and optimiser state, in GB?", answer: 112, tol: 0.5, explain: "7e9 × 16 bytes.", py: "answer = 7e9*16/1e9" });
Q({ id: "llm-ts-2", d: 1, secs: 30, prompt: "That state sharded with ZeRO-3 across 8 GPUs. GB per GPU?", answer: 14, tol: 0.05, explain: "112/8.", py: "answer = 7e9*16/8/1e9" });
Q({ id: "llm-ts-3", d: 2, secs: 45, prompt: "Global batch 1,024 sequences, micro-batch 8 per GPU, 16 GPUs data-parallel. Gradient-accumulation steps?", answer: 8, tol: 0.5, explain: "1024/(8 × 16).", py: "answer = 1024/(8*16)" });
Q({ id: "llm-ts-4", d: 2, secs: 60, prompt: "Which 16-bit format usually needs loss scaling to avoid gradient underflow?", options: ["bf16", "fp16", "Both", "Neither"], answer: 1, explain: "fp16's 5-bit exponent has a narrow range; bf16 keeps fp32's 8-bit exponent.", py: "import numpy as np\nanswer = 1 if np.float16(1e-8) == 0 else 0", packages: ["numpy"] });
C("llm-ts-c1", "Training memory (mixed-precision Adam)", "≈ 16 bytes/param: 2 weights + 2 grads + 4 master + 8 Adam moments, plus activations.");

L("llm-pretraining-practice", PT, "Pre-training practice", "Interview scenarios on objectives, data, scaling and training infrastructure.", {
  kind: "interview", mins: 30, prereq: ["llm-next-token", "llm-pretraining-data", "llm-scaling-laws", "llm-training-scale"],
  hook: "Answer each out loud in about a minute, then open it and tick off the points the interviewer is listening for.",
}, [
  iq("Your company wants an LLM that knows Indian tax law well. Pre-train from scratch, continue pre-training, or fine-tune?", "Not from scratch (cost, data). If there is a large unlabelled corpus of statutes, circulars and rulings, continued pre-training of a strong open base model adds domain knowledge and vocabulary; then instruction-tune on Q&A. If the corpus is small or changes often, RAG over the documents plus light fine-tuning for format is cheaper and easier to update.", ["Rules out scratch", "Continued pre-training when lots of domain text", "Instruction tuning after", "RAG for changing knowledge"]),
  iq("A benchmark score jumps 15 points after you add a new web crawl. What do you check?", "Contamination: n-gram overlap between the new data and the benchmark; compare to held-out or freshly written test items; check other benchmarks for consistency. Remove overlapping documents and re-evaluate.", ["Suspect contamination", "Overlap check", "Fresh/held-out evals", "Decontaminate and re-run"]),
  iq("You have 10²² FLOPs. Roughly what model size and token count would Chinchilla suggest, and would you follow it?", "N = √(C/120) ≈ 9B parameters, D ≈ 20N ≈ 180B tokens. If the model will be served heavily, train a smaller model (e.g. 3–4B) on more tokens instead, trading training efficiency for cheaper inference; check data availability.", ["Uses C ≈ 6ND and 20 tokens/param", "Numbers", "Inference-aware adjustment", "Data supply"]),
  iq("Training loss suddenly spikes and doesn't recover at step 120k. What do you do?", "Roll back to a checkpoint before the spike, inspect the batches around it for bad data, lower the learning rate or skip those batches, check for fp16 overflow / attention logit growth (switch to bf16, add QK-norm or z-loss), and verify gradient clipping. Monitor gradient norms going forward.", ["Roll back to checkpoint", "Inspect data", "LR / skip batches", "Numerical stability fixes", "Monitor grad norms"]),
  iq("Why can't you full fine-tune a 13B model on one 80 GB GPU, and what are your options?", "Mixed-precision Adam needs ~16 bytes/param ≈ 208 GB plus activations. Options: shard across GPUs with FSDP/ZeRO-3, CPU/NVMe offloading, 8-bit optimisers, or parameter-efficient fine-tuning (LoRA/QLoRA) on one GPU.", ["16 bytes/param arithmetic", "Sharding / offload", "8-bit optimisers", "LoRA/QLoRA"]),
]);
