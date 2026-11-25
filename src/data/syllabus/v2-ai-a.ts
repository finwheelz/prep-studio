/**
 * v2 AI engineering, part A: Inference and serving.
 * Fixed ids. Every quiz answer is recomputed in Pyodide (scripts/verify-items.mts).
 */
import { CHECKED, iq, lessonWriter } from "./v2-shared";

const { L, Q, C } = lessonWriter("aieng");
const M = "Inference and serving";
const src = (label: string, url: string) => ({ label, url, checked: CHECKED });
const S = {
  vllm: src("vLLM documentation", "https://docs.vllm.ai/en/latest/"),
  paged: src("Kwon et al. (2023): Efficient Memory Management for LLM Serving with PagedAttention", "https://arxiv.org/abs/2309.06180"),
  gqa: src("Ainslie et al. (2023): GQA: Training Generalized Multi-Query Transformer Models", "https://arxiv.org/abs/2305.13245"),
  spec: src("Leviathan, Kalman, Matias (2022): Fast Inference from Transformers via Speculative Decoding", "https://arxiv.org/abs/2211.17192"),
  gptq: src("Frantar et al. (2022): GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers", "https://arxiv.org/abs/2210.17323"),
  int8: src("Dettmers et al. (2022): LLM.int8(): 8-bit Matrix Multiplication for Transformers at Scale", "https://arxiv.org/abs/2208.07339"),
};

L("ai-prefill-decode", M, "Prefill vs decode", "Why the first token and every later token are limited by different hardware resources.", {
  kind: "concept", mins: 25,
  hook: "Your voice bot waits 1.4 s before it starts speaking, then talks fast. Which half of inference do you optimise?",
  intuition: `
**The situation.** A collections voice agent sends a 2,000-token prompt (script, borrower history, policy) and gets a 150-token reply. Users complain about the pause before the bot answers, not about how fast it speaks.

**The idea.** Generating a reply has two phases.

- **Prefill:** the model reads the whole prompt in one forward pass, computing keys and values for every prompt token. Thousands of tokens are processed in parallel, so the GPU's arithmetic units are busy: prefill is **compute-bound**. It decides **time to first token (TTFT)**.
- **Decode:** the model produces one token per forward pass, each attending to everything before it. Each step reads all the weights from GPU memory to do very little arithmetic for one token: decode is **memory-bandwidth-bound**. It decides **time per output token (TPOT)**.

So long prompts hurt TTFT, long answers hurt total time, and the fixes are different: shorter or cached prompts for prefill; batching, quantisation and speculative decoding for decode.
`,
  maths: `
**In one breath.** End-to-end latency $\\approx \\text{TTFT} + (n_{out} - 1)\\cdot\\text{TPOT}$; prefill costs about $2P$ FLOPs per prompt token ($P$ = parameters); at batch size 1, decode speed $\\le$ memory bandwidth / bytes of weights.

**Worked example (latency).** TTFT 0.3 s, TPOT 25 ms, 200 output tokens: $0.3 + 199 \\times 0.025 = 5.28$ s. Halving TTFT saves 0.15 s; halving TPOT saves 2.5 s.

**Worked example (decode ceiling).** A 7B model in FP16 is 14 GB of weights. Every decode step reads them all. On a GPU with 2 TB/s of bandwidth, one step takes at least $14/2000 = 7$ ms, so at most about 143 tokens/s for a single sequence, however many FLOPs the GPU has.

**Worked example (prefill).** 2,000 prompt tokens × $2 \\times 7 \\times 10^9$ FLOPs = $2.8 \\times 10^{13}$ FLOPs. At an effective 300 TFLOP/s, about 0.09 s.

**Arithmetic intensity.** FLOPs per byte moved. Prefill: high (many tokens share each weight read). Decode at batch 1: about 1 FLOP per byte, far below what a GPU needs to be compute-bound. Batching many sequences in decode raises intensity, which is why batching is the main throughput lever.

| | Prefill | Decode |
|---|---|---|
| Tokens per pass | whole prompt | 1 per sequence |
| Bottleneck | compute | memory bandwidth |
| Metric | TTFT | TPOT / tokens per second |
| Levers | shorter prompts, prefix caching, chunked prefill | batching, quantisation, speculative decoding, GQA |
`,
  practice: `
**Measure the right thing.** Report TTFT and TPOT separately (p50 and p95), not just average total latency. Voice and chat UX care about TTFT; batch jobs care about tokens per second per GPU.

**Common fixes.**

- Trim and reorder prompts so the static part comes first and can be cached (prefix caching).
- Stream tokens so users see progress.
- Chunked prefill: split long prompts so one big prefill doesn't stall everyone else's decode steps.
- Disaggregated serving: run prefill and decode on different GPU pools when traffic is large.

**Where to go next.** The KV cache is what makes decode possible without recomputing the prompt each step.
`,
  traps: [
    { trap: "A GPU with twice the TFLOPs will generate tokens twice as fast.", why: "Single-stream decode is limited by memory bandwidth, not FLOPs. A faster-compute GPU with the same bandwidth barely changes TPOT." },
    { trap: "Average latency is fine for an SLO.", why: "Users feel tail latency, and TTFT and TPOT degrade differently under load. Track p95/p99 for each." },
    { trap: "Long prompts only cost money, not time.", why: "Prefill time grows with prompt length (and attention cost grows quadratically), so long prompts directly raise TTFT." },
  ],
  say: {
    prompt: "Explain the difference between prefill and decode and how it affects how you optimise an LLM service.",
    secs: 45,
    check: ["Prefill processes the prompt in parallel and is compute-bound; sets TTFT", "Decode generates one token per pass and is memory-bandwidth-bound; sets TPOT", "Latency ≈ TTFT + (n − 1)·TPOT", "Different levers: prompt length / prefix caching vs batching / quantisation / speculative decoding", "Measure p95 TTFT and TPOT separately"],
    followups: [
      { q: "Why is decode memory-bound?", a: "Each step multiplies the weights by one token's activations per sequence, so the GPU reads every weight from memory to do roughly one multiply-add per byte. Bandwidth, not arithmetic, sets the pace unless many sequences are batched." },
      { q: "What is chunked prefill?", a: "Splitting a long prompt's prefill into chunks interleaved with other requests' decode steps, so one long prompt doesn't freeze token generation for everyone else." },
      { q: "How would you cut TTFT for a voice bot with a 2,000-token system prompt?", a: "Put the static part first and enable prefix caching, shorten the prompt, use a smaller or quantised model for the first turn, and stream audio as soon as the first tokens arrive." },
    ],
    answer: `Inference has two phases. Prefill reads the whole prompt in one parallel pass and builds the KV cache; it's compute-bound and determines time to first token. Decode then generates one token per forward pass; each step reads all the weights from memory for one token, so it's memory-bandwidth-bound and determines time per output token. Total latency is roughly TTFT plus output length times TPOT.

That split tells me what to optimise. For TTFT I shorten prompts, put static content first for prefix caching and use chunked prefill. For TPOT and throughput I batch requests, quantise weights and consider speculative decoding. I track p95 TTFT and TPOT separately.`,
    avoid: ["\u201cMore TFLOPs means faster generation\u201d", "Reporting only average latency"],
  },
  terms: [["TTFT", "Time to first token: queueing plus prefill."], ["TPOT", "Time per output token during decode."], ["Arithmetic intensity", "FLOPs per byte of memory traffic."], ["Chunked prefill", "Splitting a long prefill into pieces interleaved with decode."]],
  sources: [S.vllm, S.paged],
});
Q({ id: "ai-pd-1", d: 1, secs: 45, prompt: "TTFT is 0.3 s and TPOT is 25 ms. How long until a 200-token reply finishes? (seconds, 2 decimals)", answer: 5.28, tol: 0.01, explain: "0.3 + 199 × 0.025 = 5.275 s.", py: "answer = 0.3 + 199*0.025" });
Q({ id: "ai-pd-2", d: 2, secs: 60, prompt: "A 7B-parameter model in FP16 runs on a GPU with 2,000 GB/s memory bandwidth. Upper bound on single-sequence decode speed (tokens/s)?", answer: 142.9, tol: 1, explain: "Weights = 14 GB; one step reads them all: 14/2000 s = 7 ms → ≈143 tokens/s.", py: "answer = 2000/(7e9*2/1e9)" });
Q({ id: "ai-pd-3", d: 2, secs: 60, prompt: "Prefill of 2,000 tokens on a 7B model at 2 FLOPs per parameter per token, with 300 TFLOP/s effective. Time in seconds? (3 decimals)", answer: 0.093, tol: 0.002, explain: "2,000 × 2 × 7e9 = 2.8e13 FLOPs / 3e14 FLOP/s ≈ 0.093 s.", py: "answer = 2000*2*7e9/300e12" });
Q({ id: "ai-pd-4", d: 1, secs: 30, prompt: "Users complain about the pause before a chatbot starts answering. Which metric do you target first?", options: ["TPOT", "TTFT", "Tokens per GPU-hour", "Output length"], answer: 1, explain: "The pause before the first token is TTFT (queueing + prefill).", py: "answer = 1" });
C("ai-pd-c1", "Prefill vs decode", "Prefill: whole prompt, compute-bound, TTFT. Decode: one token/step, bandwidth-bound, TPOT.");
C("ai-pd-c2", "Decode speed ceiling (batch 1)", "tokens/s ≤ memory bandwidth / bytes of weights.");

L("ai-kv-cache", M, "The KV cache and PagedAttention", "Sizing the KV cache, why it limits concurrency, and how paging and GQA shrink it.", {
  kind: "concept", mins: 25, prereq: ["ai-prefill-decode"],
  hook: "An 80 GB GPU holds a 14 GB model. Why can it only serve a few dozen long conversations at once?",
  intuition: `
**The situation.** Without caching, generating token 500 would recompute attention keys and values for the 499 tokens before it, every step. The **KV cache** stores each token's keys and values once, so each decode step only computes the new token's.

**The cost.** That cache lives in GPU memory, grows with every token of every active sequence, and is often bigger than the model itself for long contexts. It is usually what caps how many requests a GPU can serve at once.

**Making it smaller and tidier.**

- **Grouped-query / multi-query attention (GQA/MQA):** several query heads share one key/value head, cutting the cache by the sharing factor.
- **PagedAttention (vLLM):** store the cache in fixed-size blocks like OS memory pages instead of one contiguous slab per request sized for the maximum length. Almost no wasted memory, and shared prefixes can point to the same blocks.
- **Quantised KV cache:** store K and V in 8 bits or less.
`,
  maths: `
**In one breath.** KV bytes $= 2 \\times n_{layers} \\times n_{kv\\_heads} \\times d_{head} \\times \\text{bytes} \\times \\text{tokens}$ (the 2 is for K and V).

**Worked example.** 32 layers, 32 KV heads of dimension 128, FP16 (2 bytes): per token $2 \\times 32 \\times 32 \\times 128 \\times 2 = 524{,}288$ bytes = 0.5 MiB. A 4,096-token sequence needs 2 GiB.

**With GQA** (8 KV heads shared by 32 query heads): 4× smaller, 128 KiB per token, 0.5 GiB per 4,096-token sequence.

**Concurrency.** 80 GB GPU, 14 GB of weights, ~6 GB reserved for activations and overhead: about 60 GB for cache. At 2 GiB per 4K sequence: about 27 concurrent full-length sequences; with GQA about 111.

**Fragmentation.** Pre-allocating max length (say 4,096) for a request that ends at 600 tokens wastes 85% of its slot. Paging in blocks of 16 tokens wastes at most 15 token-slots per sequence.

| Lever | Shrinks cache by |
|---|---|
| GQA (h query heads, g KV heads) | h / g |
| MQA | h |
| FP8 / INT8 KV | 2× vs FP16 |
| Paging | removes over-allocation waste |
| Shorter context / sliding window | proportional to tokens dropped |
`,
  practice: `
**Capacity planning.** Compute per-token KV size from the model config, multiply by expected tokens in flight (prompt + output × concurrent requests), and leave headroom. When the cache fills, servers queue or preempt requests (evict and recompute later), which spikes latency.

**Prefix sharing.** Requests with the same system prompt can share cache blocks; with paging this is cheap. That's the basis of prefix caching.

**In interviews**, expect "estimate how many users this GPU can serve": weights + KV per token × tokens per user.
`,
  traps: [
    { trap: "The model weights are what limit concurrency.", why: "Weights are a fixed cost; the KV cache grows with every token of every request and usually becomes the binding limit for long contexts." },
    { trap: "GQA shrinks the cache by reducing the number of query heads.", why: "It keeps all query heads but shares key/value heads among groups; the cache scales with KV heads only." },
    { trap: "Allocate each request its maximum context up front; it's simpler.", why: "Most requests end far short of the maximum, so contiguous pre-allocation wastes most of the memory. Paged allocation fixes this." },
  ],
  say: {
    prompt: "What is the KV cache, how big is it, and how do serving systems manage it?",
    secs: 60,
    check: ["Stores keys and values of past tokens so decode doesn't recompute them", "Size = 2 × layers × KV heads × head dim × bytes × tokens; often exceeds weights at long context", "It limits concurrency / batch size", "GQA/MQA and KV quantisation shrink it", "PagedAttention: block allocation, no fragmentation, prefix sharing"],
    followups: [
      { q: "How much KV cache does a 32-layer model with 8 KV heads of size 128 in FP16 need per token?", a: "2 × 32 × 8 × 128 × 2 bytes = 131,072 bytes = 128 KiB." },
      { q: "What happens when the cache is full?", a: "New requests wait in the queue, or the scheduler preempts running sequences (swapping their cache out or dropping and recomputing it), which raises latency." },
      { q: "Why does PagedAttention help prefix caching?", a: "Cache lives in fixed blocks referenced by a table, so multiple sequences can point at the same blocks for a shared prefix, with copy-on-write when they diverge." },
    ],
    answer: `During decoding each new token attends to all previous tokens, so instead of recomputing their keys and values every step, we cache them. The cache costs 2 × layers × KV heads × head dimension × bytes per value for every token of every active sequence; for a 32-layer, 32-head, 128-dimension FP16 model that's half a megabyte per token, 2 GB for a 4K-token conversation, so it usually caps how many requests a GPU can hold.

Serving systems manage it in three ways: architectural sharing (GQA or MQA cuts KV heads), lower precision for the cache, and smarter allocation. vLLM's PagedAttention stores the cache in small fixed blocks, so nothing is reserved for tokens that never arrive and shared prefixes can reuse the same blocks.`,
    avoid: ["\u201cThe KV cache stores the model weights\u201d", "Ignoring the factor of 2 for keys and values"],
  },
  terms: [["KV cache", "Stored attention keys and values for past tokens."], ["GQA", "Grouped-query attention: query heads share fewer KV heads."], ["PagedAttention", "Block-based KV memory management (vLLM)."], ["Preemption", "Evicting a running sequence's cache under memory pressure."]],
  sources: [S.paged, S.gqa, S.vllm],
});
Q({ id: "ai-kv-1", d: 2, secs: 60, prompt: "32 layers, 32 KV heads, head dimension 128, FP16. KV cache per token in bytes?", answer: 524288, tol: 1, explain: "2 × 32 × 32 × 128 × 2 = 524,288 bytes (0.5 MiB).", py: "answer = 2*32*32*128*2" });
Q({ id: "ai-kv-2", d: 2, secs: 60, prompt: "Same model, 4,096-token sequence. KV cache size in GiB?", answer: 2, tol: 0.01, explain: "524,288 × 4,096 = 2³¹ bytes = 2 GiB.", py: "answer = 2*32*32*128*2*4096/2**30" });
Q({ id: "ai-kv-3", d: 2, secs: 60, prompt: "The model switches to GQA with 8 KV heads (32 query heads). By what factor does the KV cache shrink?", answer: 4, tol: 0.01, explain: "Cache scales with KV heads: 32/8 = 4.", py: "answer = 32/8" });
Q({ id: "ai-kv-4", d: 3, secs: 90, prompt: "60 GiB is free for KV cache. Each 4,096-token sequence needs 2 GiB without GQA. How many full-length sequences fit with the 8-KV-head GQA version?", answer: 120, tol: 0.5, explain: "GQA: 0.5 GiB per sequence → 60/0.5 = 120.", py: "answer = 60 // (2/4)" });
C("ai-kv-c1", "KV cache size", "2 × layers × KV heads × head_dim × bytes × tokens.");
C("ai-kv-c2", "PagedAttention", "KV in fixed blocks: no over-allocation, shared prefixes reuse blocks.");

L("ai-batching", M, "Batching, scheduling and throughput", "Static vs continuous batching, Little's law, and the throughput–latency trade-off.", {
  kind: "concept", mins: 20, prereq: ["ai-prefill-decode", "ai-kv-cache"],
  hook: "Your GPU sits at 15% utilisation serving one request at a time. What do you change, and what does it cost the users?",
  intuition: `
**The situation.** Decode at batch size 1 wastes the GPU: it reads all the weights to produce one token. If 32 requests share that weight read, you get roughly 32 tokens for little more than the cost of one.

**Static batching** waits for a batch to fill, then runs it until every sequence finishes. Short replies sit idle waiting for the longest one, and new requests wait for the whole batch.

**Continuous (in-flight) batching** schedules at the level of single decode steps: when a sequence finishes, its slot is immediately given to a waiting request. The batch stays full, throughput rises several-fold, and short requests leave as soon as they're done.

**The trade-off.** Bigger batches raise total tokens per second but slow each step a little, so each user's TPOT rises. You tune the maximum batch (and KV memory) against your latency SLO.
`,
  maths: `
**In one breath.** Little's law: requests in flight $L = \\lambda W$ (arrival rate × time in system); throughput = batch size / step time; required GPUs = demand / per-GPU throughput.

**Worked example (Little's law).** 20 requests/s, each spends 6 s in the system: 120 requests in flight. If one GPU holds 40 concurrent sequences, you need at least 3 GPUs.

**Worked example (batch throughput).** Step time 30 ms at batch 32: $32/0.03 \\approx 1{,}067$ tokens/s per GPU, each user at 33 tokens/s. At batch 64 the step takes 40 ms: 1,600 tokens/s total, each user at 25 tokens/s.

**Static batching waste.** Replies of length 50, 100 and 400 in a static batch: the slots are busy for $50 + 100 + 400 = 550$ of $3 \\times 400 = 1{,}200$ token-steps, 46% utilisation. Continuous batching refills the idle slots.

| Scheduler setting | Raises | Lowers |
|---|---|---|
| max batch size ↑ | throughput | per-user speed, KV headroom |
| max tokens per step ↑ (chunked prefill) | prefill throughput | decode smoothness |
| priority queues | SLO for interactive traffic | batch-job latency |
`,
  practice: `
**Production defaults.** Use a server with continuous batching (vLLM, TGI, TensorRT-LLM). Set max concurrent sequences from KV-cache capacity. Separate interactive and batch traffic (priorities or separate pools). Load-test with realistic prompt/output length distributions, not fixed lengths.

**Autoscaling** on queue depth or KV-cache utilisation, not CPU.

**Offline jobs** (scoring 10 lakh call transcripts overnight) should use large batches and maximise tokens per GPU-hour; latency doesn't matter.
`,
  traps: [
    { trap: "Batching always hurts latency.", why: "Per-step time rises a little, but without batching requests queue behind each other, which is far worse under load. Continuous batching usually improves p95 latency at realistic traffic." },
    { trap: "Benchmark with fixed 512-in / 128-out requests.", why: "Real traffic has long-tailed lengths; static benchmarks hide scheduling and memory effects. Replay real length distributions." },
    { trap: "Autoscale on GPU utilisation percentage.", why: "Utilisation can be high while latency is fine, or low while the KV cache is full and requests queue. Scale on queue length, KV usage and latency." },
  ],
  say: {
    prompt: "How does continuous batching work and why does it matter for LLM serving?",
    secs: 45,
    check: ["Decode at batch 1 underuses the GPU (memory-bound)", "Static batching waits for the slowest sequence", "Continuous batching swaps sequences in and out each step", "Throughput vs per-user latency trade-off; tune batch size to the SLO", "Capacity math: Little's law, KV memory limits"],
    followups: [
      { q: "How many concurrent requests does a service with 20 req/s and 6 s average latency hold?", a: "Little's law: 20 × 6 = 120 in flight." },
      { q: "How would you serve interactive chat and nightly batch scoring on the same fleet?", a: "Priority scheduling or separate pools; give interactive traffic latency SLOs and let batch jobs fill spare capacity with large batches." },
      { q: "What limits the maximum batch size?", a: "KV-cache memory (tokens in flight) and the per-step latency budget for interactive users." },
    ],
    answer: `At batch size 1, decode reads all the weights to produce one token, so the GPU is mostly idle. Batching lets many sequences share each weight read. Static batching runs a batch until its longest sequence finishes, wasting slots and making new requests wait. Continuous batching schedules per decode step: as soon as a sequence finishes, a waiting request takes its slot, so the batch stays full and throughput rises several times.

The cost is that each step gets a bit slower as the batch grows, so I tune the maximum batch to the latency SLO and the KV-cache capacity, size the fleet with Little's law, and separate interactive and batch traffic.`,
    avoid: ["Equating throughput with per-user speed", "Benchmarking with fixed-length requests only"],
  },
  terms: [["Continuous batching", "Per-step scheduling that refills finished slots immediately."], ["Little's law", "In-flight = arrival rate × time in system."], ["Throughput", "Total tokens (or requests) per second across users."]],
  sources: [S.vllm, S.paged],
});
Q({ id: "ai-bt-1", d: 1, secs: 30, prompt: "20 requests/s arrive and each spends 6 s in the system. Average requests in flight?", answer: 120, tol: 0.5, explain: "Little's law: 20 × 6 = 120.", py: "answer = 20*6" });
Q({ id: "ai-bt-2", d: 2, secs: 60, prompt: "Static batch of three replies with 50, 100 and 400 tokens. Fraction of slot-steps doing useful work? (2 decimals)", answer: 0.46, tol: 0.005, explain: "(50 + 100 + 400)/(3 × 400) = 550/1200 = 0.458.", py: "answer = (50+100+400)/(3*400)" });
Q({ id: "ai-bt-3", d: 2, secs: 60, prompt: "Batch 64 with a 40 ms decode step. Total output tokens per second?", answer: 1600, tol: 1, explain: "64 / 0.04 = 1,600 tokens/s (each user gets 25 tokens/s).", py: "answer = 64/0.04" });
Q({ id: "ai-bt-4", d: 2, secs: 60, prompt: "120 requests in flight are needed and one GPU holds 40 concurrent sequences. Minimum GPUs?", answer: 3, tol: 0.5, explain: "ceil(120/40) = 3; add headroom in practice.", py: "import math\nanswer = math.ceil(120/40)" });
C("ai-bt-c1", "Continuous batching", "Schedule per decode step; finished slots are refilled at once.");
C("ai-bt-c2", "Little's law", "L = λW: in-flight requests = arrival rate × latency.");

L("ai-quantization", M, "Quantisation for LLM inference", "Fewer bits per weight: memory, speed, accuracy, and INT8/INT4/FP8 methods.", {
  kind: "concept", mins: 30, prereq: ["ai-prefill-decode"],
  hook: "A 70B model needs 140 GB in FP16. Can you serve it on one 80 GB GPU, and what do you give up?",
  intuition: `
**The situation.** Weights in 16-bit floats take 2 bytes each. Storing them in 8 or 4 bits halves or quarters the memory, and because decode is bandwidth-bound, fewer bytes to read means faster tokens too.

**The idea.** Map each block of weights to a small set of integer levels with a scale (and sometimes an offset): $w \\approx s \\cdot q$. Rounding introduces error; good methods keep that error where it matters least.

- **Weight-only quantisation** (INT8/INT4, e.g. GPTQ, AWQ): weights stored low-bit, dequantised on the fly; activations stay 16-bit. Best for memory and decode speed.
- **Weight + activation** (W8A8, FP8): both low-bit, uses fast low-precision matrix units; helps compute-bound prefill too.
- **Outliers** are the enemy: a few large values force a big scale and crush the precision of everything else. Per-channel/per-group scales and outlier handling (LLM.int8) fix this.
`,
  maths: `
**In one breath.** Memory $\\approx$ parameters × bits / 8; symmetric INT8 scale $s = \\max|w|/127$, $q = \\text{round}(w/s)$, $\\hat w = s q$; error $\\le s/2$ per weight.

**Worked example (memory).** 13B parameters: FP16 26 GB, INT8 13 GB, INT4 6.5 GB (plus a little for scales). 70B at INT4 ≈ 35 GB: fits one 80 GB GPU with room for KV cache.

**Worked example (rounding).** A group's largest weight is 0.5, so $s = 0.5/127 = 0.003937$. The weight 0.1 becomes $q = \\text{round}(25.4) = 25$, dequantised to 0.0984: error 0.0016, below $s/2 = 0.00197$.

**Why groups.** One huge value (say 8.0) in a group makes $s = 0.063$, and every small weight (0.01) rounds to 0. Splitting into groups of 64–128 weights, each with its own scale, keeps resolution where values are small.

| Format | Bytes/param | Typical use | Risk |
|---|---|---|---|
| FP16/BF16 | 2 | baseline | — |
| FP8 (W8A8) | 1 | prefill + decode speed on new GPUs | needs calibration |
| INT8 weight-only | 1 | safe memory halving | small |
| INT4 (GPTQ/AWQ) | ~0.5 | big models on fewer GPUs | quality drop on hard tasks |
`,
  practice: `
**Process.** Pick the format your serving stack and GPU support; quantise with a small calibration set from your domain; evaluate on your own task evals (not just perplexity), especially reasoning, multilingual and long-context cases; compare cost per million tokens and latency.

**Rules of thumb.** 8-bit is usually near-lossless; 4-bit is usually fine for chat and extraction on large models but can hurt maths, code and small models more. Quantising the KV cache is a separate decision.
`,
  traps: [
    { trap: "INT4 makes everything 4× faster.", why: "It cuts weight memory 4×, speeding bandwidth-bound decode, but dequantisation overhead, compute-bound prefill and KV-cache reads don't shrink the same way." },
    { trap: "Perplexity barely changed, so quality is fine.", why: "Average perplexity hides drops on specific skills (arithmetic, rare languages, long context). Evaluate on your task." },
    { trap: "One scale for the whole matrix is enough.", why: "Outliers dominate a single scale and zero out small weights. Use per-channel or per-group scales." },
  ],
  say: {
    prompt: "How does quantisation speed up LLM inference, and how would you decide whether it's safe to ship?",
    secs: 45,
    check: ["Fewer bits per weight → less memory and less bandwidth per decode step", "Scale/zero-point mapping; rounding error; groups for outliers", "Weight-only vs weight+activation (FP8/W8A8)", "Memory arithmetic (params × bits / 8)", "Validate on task-specific evals, not only perplexity"],
    followups: [
      { q: "Why do outliers matter so much?", a: "A symmetric scale is set by the largest magnitude in the group; one large value inflates it so most small weights round to the same few levels or zero." },
      { q: "GPTQ in one sentence?", a: "Post-training quantisation that rounds weights column by column and adjusts the remaining weights to compensate the error, using second-order (Hessian) information from a calibration set." },
      { q: "When would you not quantise?", a: "When the model already fits comfortably and latency is fine, or the task is sensitive (precise numeric reasoning) and evals show a drop you can't accept." },
    ],
    answer: `Quantisation stores weights, and sometimes activations, in fewer bits: each group of weights gets a scale and is rounded to small integers. Because decode is bandwidth-bound, reading 4-bit instead of 16-bit weights means less memory and faster tokens; a 70B model drops from 140 GB to about 35 GB and fits on one GPU.

The price is rounding error, and outliers make it worse, so methods use per-group scales or special outlier handling, and GPTQ or AWQ choose roundings that minimise output error on calibration data. I'd ship it only after comparing the quantised and full models on my own evals, including hard slices like arithmetic or regional languages, and checking latency and cost gains under real traffic.`,
    avoid: ["\u201cQuantisation is lossless\u201d", "Judging only by perplexity"],
  },
  terms: [["Scale", "Multiplier mapping integers back to real values."], ["Weight-only quantisation", "Low-bit weights, 16-bit activations."], ["Calibration set", "Sample inputs used to choose quantisation parameters."]],
  sources: [S.gptq, S.int8, S.vllm],
});
Q({ id: "ai-qt-1", d: 1, secs: 30, prompt: "Memory for the weights of a 13B-parameter model in INT4, in GB (ignore scales)?", answer: 6.5, tol: 0.05, explain: "13e9 × 4 / 8 bytes = 6.5 GB.", py: "answer = 13e9*4/8/1e9" });
Q({ id: "ai-qt-2", d: 2, secs: 60, prompt: "Symmetric INT8 with max |w| = 0.5 in the group. What is the dequantised value of w = 0.1? (4 decimals)", answer: 0.0984, tol: 0.0002, explain: "s = 0.5/127; q = round(0.1/s) = 25; ŝq = 0.0984.", py: "s = 0.5/127\nanswer = s*round(0.1/s)" });
Q({ id: "ai-qt-3", d: 2, secs: 60, prompt: "Same scheme but the group's max |w| is 8.0. What does w = 0.01 dequantise to?", answer: 0, tol: 0.0001, explain: "s = 8/127 = 0.063; 0.01/s = 0.16 rounds to 0: the outlier wiped out the small weight. Use smaller groups.", py: "s = 8/127\nanswer = s*round(0.01/s)" });
Q({ id: "ai-qt-4", d: 2, secs: 45, prompt: "Decode is bandwidth-bound. Roughly how much faster can single-stream decode get going from FP16 to INT8 weights (ideal case)?", answer: 2, tol: 0.05, explain: "Half the bytes per step → up to 2× tokens/s, minus dequantisation overhead.", py: "answer = 16/8" });
C("ai-qt-c1", "Quantisation memory", "bytes ≈ params × bits / 8.");
C("ai-qt-c2", "Group-wise scales", "Limit the damage of outliers to their own group.");

L("ai-speculative", M, "Speculative decoding and prefix caching", "Getting several tokens per big-model pass, and reusing computation for shared prompts.", {
  kind: "concept", mins: 25, prereq: ["ai-prefill-decode", "ai-kv-cache"],
  hook: "A small model guesses the next 4 tokens and the big model checks them in one pass. How can that be faster and still give exactly the big model's output?",
  intuition: `
**The situation.** Decode is slow because each big-model pass yields one token. But verifying several proposed tokens costs about the same as generating one: it's one forward pass over a few extra positions.

**Speculative decoding.** A cheap **draft** model (or n-gram lookup, or extra heads) proposes $k$ tokens. The **target** model scores all of them in one pass and accepts the longest prefix that agrees with what it would have sampled; at the first disagreement it substitutes its own token. With the right acceptance rule the output distribution is **exactly** the target model's, so quality is unchanged; only speed improves, and only when the draft is usually right.

**Prefix caching.** Many requests start with the same system prompt or document. Keep the KV cache for that prefix and reuse it, skipping its prefill. TTFT drops and providers charge less for cached input tokens.
`,
  maths: `
**In one breath.** With per-token acceptance rate $\\alpha$ and $k$ drafted tokens, expected tokens per target pass $= \\frac{1 - \\alpha^{k+1}}{1 - \\alpha}$; speed-up $\\approx$ that divided by $(1 + k c)$ where $c$ is the draft's cost relative to the target.

**Worked example.** $\\alpha = 0.8$, $k = 4$: $(1 - 0.8^5)/0.2 = 3.36$ tokens per target pass. If each draft step costs 5% of a target step: $3.36/(1 + 4 \\times 0.05) = 2.8\\times$. With $\\alpha = 0.5$: $1.94/1.2 = 1.6\\times$.

**Acceptance rule (sampling).** Accept drafted token $x$ with probability $\\min(1, p(x)/q(x))$ ($p$ target, $q$ draft); on rejection, sample from the normalised $\\max(0, p - q)$. This makes the final tokens distributed exactly as $p$.

**Prefix caching arithmetic.** 1,800 of 2,000 prompt tokens are a shared prefix. With a hit, prefill handles 200 tokens: 90% less prefill compute. If cached input costs 10% of the normal price, input cost per request falls to $0.1 \\times 1800 + 200 = 380$ token-equivalents, 19% of the original.
`,
  practice: `
**When speculative decoding pays.** Predictable text (code, templated replies, extraction), a draft from the same family with the same tokenizer, low batch sizes (at high batch the GPU is already busy, gains shrink). Measure acceptance rate on real traffic.

**Prefix caching hygiene.** Put static content first (system prompt, tool definitions, policy docs), variable content last; keep the static part byte-identical (no timestamps at the top); route requests with the same prefix to the same replica.
`,
  traps: [
    { trap: "Speculative decoding trades quality for speed.", why: "With the standard acceptance rule the output distribution is exactly the target model's. It trades extra compute for latency, not quality." },
    { trap: "A bigger draft model is always better.", why: "A better draft raises α but costs more per step; past a point the draft's cost eats the gain. Small, well-aligned drafts usually win." },
    { trap: "Put the date and user name at the top of the system prompt.", why: "Any change at the start breaks the cached prefix for every request. Keep variable content at the end." },
  ],
  say: {
    prompt: "Explain speculative decoding and when it helps.",
    secs: 45,
    check: ["Draft proposes k tokens; target verifies them in one pass", "Accept the agreeing prefix; rejection sampling keeps the target distribution exactly", "Speed-up depends on acceptance rate and draft cost", "Best at low batch sizes and predictable outputs; same tokenizer", "Mentioned prefix caching as a separate TTFT lever"],
    followups: [
      { q: "What is the expected number of tokens per target pass with α = 0.8 and k = 4?", a: "(1 − 0.8⁵)/(1 − 0.8) ≈ 3.36." },
      { q: "Why does speculative decoding help less at high batch sizes?", a: "At high batch, decode is closer to compute-bound, so the extra positions verified per pass aren't free any more, and draft work competes for the same GPU." },
      { q: "How do you maximise prefix-cache hits?", a: "Stable, byte-identical static prefixes first; variable content last; sticky routing to replicas holding the prefix; enough cache memory to keep hot prefixes." },
    ],
    answer: `Speculative decoding uses a cheap draft model to propose several tokens, then runs the big model once over all of them. The big model accepts the longest prefix it agrees with and replaces the first token it doesn't, using an acceptance rule that keeps the output distribution exactly the same as the big model alone, so quality doesn't change. If the draft is usually right you get several tokens per expensive pass: with 80% acceptance and four drafted tokens about 3.4 tokens per pass, roughly 2.8× faster after the draft's own cost.

It helps most at low batch sizes and on predictable text like code or templated replies. A complementary trick is prefix caching: keep the KV cache of a shared system prompt so its prefill is skipped, which cuts TTFT and input cost.`,
    avoid: ["\u201cIt reduces quality a bit\u201d", "Ignoring the draft model's own cost"],
  },
  terms: [["Draft model", "Small model proposing tokens for verification."], ["Acceptance rate α", "Probability a drafted token is accepted."], ["Prefix caching", "Reusing KV cache for an identical prompt prefix."]],
  sources: [S.spec, S.vllm],
});
Q({ id: "ai-sp-1", d: 2, secs: 60, prompt: "Acceptance rate 0.8, 4 drafted tokens. Expected tokens per target pass? (2 decimals)", answer: 3.36, tol: 0.01, explain: "(1 − 0.8⁵)/(1 − 0.8) = 3.36.", py: "a, k = 0.8, 4\nanswer = (1-a**(k+1))/(1-a)" });
Q({ id: "ai-sp-2", d: 3, secs: 90, prompt: "Same α and k; each draft step costs 5% of a target pass. Approximate speed-up? (2 decimals)", answer: 2.8, tol: 0.01, explain: "3.3616/(1 + 4 × 0.05) = 2.80.", py: "a, k, c = 0.8, 4, 0.05\nanswer = (1-a**(k+1))/(1-a)/(1+k*c)" });
Q({ id: "ai-sp-3", d: 2, secs: 60, prompt: "1,800 of 2,000 prompt tokens hit the prefix cache, billed at 10% of the normal input price. Input cost as a fraction of the uncached cost? (2 decimals)", answer: 0.19, tol: 0.005, explain: "(0.1 × 1800 + 200)/2000 = 380/2000 = 0.19.", py: "answer = (0.1*1800 + 200)/2000" });
Q({ id: "ai-sp-4", d: 1, secs: 30, prompt: "Speculative decoding with the standard acceptance rule changes the output distribution by…", options: ["a small amount, depending on the draft", "nothing: it's identical to the target model's", "making it greedier", "making it more random"], answer: 1, explain: "Rejection sampling makes accepted/replaced tokens follow the target distribution exactly.", py: "answer = 1" });
C("ai-sp-c1", "Speculative decoding yield", "Tokens per target pass = (1 − α^(k+1))/(1 − α).");
C("ai-sp-c2", "Prefix-cache friendly prompts", "Static content first, byte-identical; variable content last.");

L("ai-serving-cost", M, "Serving metrics, SLOs and cost per million tokens", "Turning GPU prices and throughput into unit costs, and setting latency SLOs.", {
  kind: "concept", mins: 20, prereq: ["ai-batching"],
  hook: "The voice-bot pilot works. Finance asks: what does one call cost on an API vs our own GPU, and at what volume does self-hosting win?",
  intuition: `
**The situation.** An LLM feature has three numbers that decide whether it survives: **quality**, **latency**, **cost per unit of work** (per call, per document, per resolved ticket). Cost per million tokens is the common currency.

**Two ways to pay.**

- **API:** pay per input and output token (output is usually priced several times higher). No fixed cost; scales instantly.
- **Self-hosted:** pay for GPU hours whether busy or idle. Unit cost = hourly price / tokens produced per hour, so utilisation is everything.

**SLOs.** Define targets per user-facing metric: p95 TTFT, p95 TPOT, error rate, availability. Design capacity to meet them at peak, not at average load.
`,
  maths: `
**In one breath.** Self-hosted cost per 1M tokens $= \\frac{\\text{GPU cost per hour}}{\\text{tokens/s} \\times 3600} \\times 10^6$ (divide by utilisation); API cost per call $= \\text{in} \\times p_{in} + \\text{out} \\times p_{out}$.

**Worked example (self-hosted).** A GPU at \\$2.50/hour sustaining 2,500 tokens/s: $9 \\times 10^6$ tokens/hour → \\$0.28 per million. At 30% average utilisation: \\$0.93 per million.

**Worked example (API per call).** A call uses 3,000 input and 400 output tokens at \\$0.50 / \\$1.50 per million: $0.0015 + 0.0006 = \\$0.0021$ per call.

**Break-even volume.** A dedicated GPU costs \\$1,800/month. If each call costs \\$0.0021 on the API, self-hosting wins above $1800/0.0021 \\approx 857{,}000$ calls/month, assuming the GPU can actually handle that volume at your SLO.

**Percentiles.** p95 latency is the value 95% of requests beat. With latencies sorted, it's roughly the 95th-percentile order statistic; averages hide the slow tail.
`,
  practice: `
**Unit economics checklist.** Tokens per task (measure, don't guess), input/output split, cache hit rate, retries and tool loops (multiply tokens), utilisation for self-hosting, engineer time for running GPUs.

**Cost levers, cheapest first.** Shorter prompts and outputs → prefix caching → smaller model or routing easy cases to it → batching / quantisation → self-hosting at high steady volume.

**SLO practice.** Alert on p95 TTFT/TPOT and error budget burn; load-test to the peak hour (collections calls cluster in mornings and evenings).
`,
  traps: [
    { trap: "Self-hosting is always cheaper than an API.", why: "Only at high, steady utilisation. Idle GPU hours, ops time and peak headroom often make APIs cheaper at low or spiky volume." },
    { trap: "Cost per call = input tokens × price.", why: "Output tokens usually cost several times more, and agent loops, retries and tool calls multiply token counts. Measure real traces." },
    { trap: "Our average latency meets the target, so the SLO is met.", why: "SLOs are percentile-based; the p95 can be several times the mean under load." },
  ],
  say: {
    prompt: "How would you estimate and reduce the cost per call of an LLM-powered voice agent?",
    secs: 60,
    check: ["Measure tokens per call (input/output split, turns, retries)", "API: in × price_in + out × price_out", "Self-hosted: GPU $/hour ÷ tokens/hour, adjusted for utilisation; break-even volume", "Levers: shorter prompts, caching, smaller model/routing, batching, quantisation", "Keep latency SLOs (p95 TTFT) while cutting cost"],
    followups: [
      { q: "A GPU costs $2.50/hour and does 2,500 tokens/s. Cost per million tokens at full use?", a: "9M tokens/hour → about $0.28 per million." },
      { q: "Why does utilisation matter so much for self-hosting?", a: "You pay for the hour whether it's busy or idle; at 30% utilisation the effective cost per token is 3.3× the full-utilisation figure." },
      { q: "What would you track on a cost dashboard?", a: "Tokens per task split by input/output/cached, cost per successful outcome, cache hit rate, model mix (routing), retries, and GPU utilisation." },
    ],
    answer: `I'd start from real traces: average input, output and cached tokens per call, including every turn, tool call and retry. On an API the cost is input tokens times the input price plus output tokens times the output price; on our own GPUs it's the hourly cost divided by tokens produced per hour, adjusted for actual utilisation, which gives a break-even call volume for self-hosting.

Then I'd cut cost in order of effort: trim and restructure prompts so the static part is cached, cap output length, route simple turns to a smaller model, and only then batch, quantise or self-host. Every change is checked against the quality evals and the p95 time-to-first-token SLO, because a cheaper bot that answers late loses the call.`,
    avoid: ["Ignoring output-token pricing", "Claiming self-hosting is always cheaper"],
  },
  terms: [["Cost per million tokens", "Unit price for comparing APIs and self-hosting."], ["Utilisation", "Share of paid GPU time doing useful work."], ["SLO", "Service level objective, e.g. p95 TTFT < 800 ms."]],
  sources: [S.vllm],
});
Q({ id: "ai-sc-1", d: 1, secs: 45, prompt: "GPU at $2.50/hour sustains 2,500 tokens/s. Cost per million tokens at full utilisation? (3 decimals)", answer: 0.278, tol: 0.002, explain: "2.5 / (2500 × 3600) × 1e6 = $0.278.", py: "answer = 2.5/(2500*3600)*1e6" });
Q({ id: "ai-sc-2", d: 2, secs: 60, prompt: "Same GPU at 30% average utilisation. Effective cost per million tokens? (3 decimals)", answer: 0.926, tol: 0.005, explain: "0.278 / 0.3 = $0.926.", py: "answer = 2.5/(2500*3600)*1e6/0.3" });
Q({ id: "ai-sc-3", d: 1, secs: 45, prompt: "A call uses 3,000 input and 400 output tokens at $0.50 and $1.50 per million. Cost per call in dollars? (4 decimals)", answer: 0.0021, tol: 0.00005, explain: "3000 × 0.5e-6 + 400 × 1.5e-6 = 0.0015 + 0.0006.", py: "answer = 3000*0.5e-6 + 400*1.5e-6" });
Q({ id: "ai-sc-4", d: 2, secs: 60, prompt: "A dedicated GPU costs $1,800/month. API cost is $0.0021 per call. Break-even calls per month (nearest thousand)?", answer: 857000, tol: 1000, explain: "1800/0.0021 ≈ 857,143.", py: "answer = 1800/0.0021" });
Q({ id: "ai-sc-5", d: 2, secs: 45, prompt: "Latencies (s): 0.4, 0.5, 0.5, 0.6, 0.6, 0.7, 0.8, 0.9, 1.2, 3.0. Mean latency? (2 decimals)", answer: 0.92, tol: 0.005, explain: "Sum 9.2 / 10 = 0.92 s, though 9 of 10 requests finish in ≤ 1.2 s and one takes 3 s: the mean hides the tail.", py: "import numpy as np\nanswer = float(np.mean([0.4,0.5,0.5,0.6,0.6,0.7,0.8,0.9,1.2,3.0]))", packages: ["numpy"] });
C("ai-sc-c1", "Self-hosted unit cost", "$/1M tokens = GPU $/hour ÷ (tokens/s × 3600) × 1e6 ÷ utilisation.");
C("ai-sc-c2", "Cost levers in order", "Shorter prompts → caching → smaller model/routing → batching/quantisation → self-host at steady volume.");

L("ai-serving-practice", M, "Inference and serving practice", "Interview scenarios on latency, capacity and cost of LLM serving.", {
  kind: "interview", mins: 35, prereq: ["ai-prefill-decode", "ai-kv-cache", "ai-batching", "ai-quantization", "ai-speculative", "ai-serving-cost"],
  hook: "Answer each scenario out loud in about a minute, then open it and tick off the points the interviewer is listening for.",
}, [
  iq("Your voice bot's p95 time-to-first-token jumped from 600 ms to 2.5 s after a prompt change that added a 1,500-token policy section. Diagnose and fix.", "Longer prompt means longer prefill, and if the new section sits before variable content it may also have broken prefix caching. Check TTFT split into queueing vs prefill, cache hit rate before/after. Fixes: move static policy text to the start so it's cached, trim it or retrieve only the relevant clauses, enable chunked prefill so long prompts don't block others, and add capacity if queueing grew.", ["Prefill grows with prompt length", "Prefix-cache breakage", "Measure queueing vs prefill", "Concrete fixes: reorder, trim/retrieve, chunked prefill"]),
  iq("Estimate how many concurrent 8K-token conversations a 70B model with GQA (80 layers, 8 KV heads, head dim 128, FP16) can hold on two 80 GB GPUs.", "KV per token = 2 × 80 × 8 × 128 × 2 bytes ≈ 320 KiB; 8K tokens ≈ 2.5 GiB per conversation. Weights ≈ 140 GB in FP16 leaves ~10–15 GB after overhead: only ~4–6 conversations. Quantising weights to INT8 (70 GB) frees ~80 GB: ~30 conversations. So quantisation or more GPUs is required.", ["KV formula applied", "Weights eat most memory in FP16", "Headroom for activations", "Quantisation changes the answer"]),
  iq("Throughput is fine in benchmarks but production p95 latency is bad at peak. What do you look at?", "Benchmarks probably used fixed lengths and steady load. Look at queue depth and KV-cache utilisation at peak, preemptions, long-prompt requests blocking others, batch size limits, and traffic burstiness. Fixes: autoscale on queue/KV usage, cap max tokens, chunked prefill, priority for interactive traffic, separate batch jobs.", ["Realistic length distributions", "Queueing/KV saturation/preemption", "Autoscale on the right signal", "Separate interactive and batch"]),
  iq("Would you self-host an open model or use an API for a 12,000-call collections campaign over 9 days?", "About 1,300 calls/day is low and bursty; an API is likely cheaper and faster to ship once you compute cost per call from real token counts. Self-hosting makes sense at steady high volume, strict data residency, or when a smaller fine-tuned model meets quality. Compute break-even, include ops cost and SLO headroom.", ["Volume and utilisation drive the decision", "Cost per call computed from tokens", "Non-cost factors: data residency, latency, control", "Break-even reasoning"]),
  iq("A team wants to switch to INT4 to cut cost. How do you approve or reject?", "Run the task eval suite (including hard slices like Hindi/Marathi turns, numbers, long context) on FP16 vs INT4; check latency/throughput under real load; compare cost per successful outcome. Ship behind a canary with online metrics; reject if quality on critical slices drops beyond an agreed threshold.", ["Task-specific evals, not just perplexity", "Critical slices", "Measure real speed/cost", "Canary rollout with thresholds"]),
]);
