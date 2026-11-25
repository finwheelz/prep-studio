/**
 * v2 ML system design, part A: Design framework · Recommendations and ranking.
 * Fixed ids; every quiz answer is recomputed in Pyodide.
 */
import { SOURCES as S, iq, lessonWriter } from "./v2-shared";
import { SD } from "./v2-sd-src";

const { L, Q, C } = lessonWriter("sysdesign");
const FW = "Design framework";
const RR = "Recommendations and ranking";

// ───────────────────────── Design framework ─────────────────────────

L("sd-frame", FW, "The ML system design interview frame", "A repeatable 8-step structure from vague prompt to a defensible design in 45 minutes.", {
  kind: "concept", mins: 25,
  hook: "\"Design a recommendation system for our app.\" You have 45 minutes and a blank whiteboard. What do you say in the first five?",
  intuition: `
**The situation.** ML design rounds are deliberately vague. Interviewers are scoring whether you can turn a fuzzy business goal into a system that can be built, measured and improved, not whether you name the fanciest model.

**The idea: one frame, used every time.**

1. **Clarify the goal and constraints.** Who is the user, what decision does the model make, what does success mean for the business? Scale (users, items, QPS), latency, freshness, cost, regulation.
2. **Frame it as an ML task.** Input, output, and the label you can actually collect. "Recommend videos" becomes "rank candidates by predicted probability of a long watch".
3. **Metrics.** Offline (AUC, NDCG, recall@k) and online (watch time, conversion, complaints), plus guardrails.
4. **Data and labels.** Where labels come from, delays, bias (only shown items get feedback), leakage.
5. **Features.** User, item, context, cross features; how they're computed online vs offline.
6. **Model.** Start with a baseline, then the stage-wise design (retrieve → rank → re-rank) with reasons.
7. **Serving.** Latency budget, caching, feature store, fallbacks.
8. **Evaluation, rollout, monitoring.** Offline replay, A/B test, canary, drift, feedback loops, failure modes.

Spend roughly 5 minutes on 1–3, 25 on 4–7, 10 on 8 and follow-ups. Say the trade-off every time you make a choice.
`,
  maths: `
**In one breath.** Turn the goal into a measurable objective, budget the latency across stages, and size the funnel so the expensive model only sees what it can afford.

**Latency budget (feed, p99 200 ms).** Network and serialisation 40 ms, feature fetch 50 ms, candidate generation 30 ms leaves 80 ms for ranking and re-ranking. Every component needs its own budget and a timeout with a fallback.

**Funnel sizing.** Corpus $10^8$ items → candidate generators return a few thousand → a heavy ranker scores ~500–2,000 → re-ranking picks ~20–50 to show. Example: 4 retrieval sources × 500 candidates with 20% overlap gives $4 \\times 500 \\times 0.8 = 1{,}600$ unique candidates for the ranker.

| Step | Questions to ask | Output |
|---|---|---|
| Goal | what decision, what success, what harm | objective + guardrails |
| Scale | DAU, items, QPS, latency, freshness | numbers to size against |
| Label | what event, how delayed, how biased | training target |
| Model | baseline, stages, why | architecture sketch |
| Serving | online vs batch, budget, fallback | request path |
| Launch | offline → A/B → ramp → monitor | rollout plan |
`,
  practice: `
**Habits that score well.**

- Write the requirements and numbers on the board before any model.
- Name a simple baseline first (popularity, logistic regression, rules) and say what would make you move beyond it.
- Separate the **objective you train on** (clicks) from the **goal** (long-term satisfaction) and add guardrails for the gap.
- Treat data as the hardest part: label definition, delays, position and selection bias, leakage.
- Always mention monitoring, fallbacks and how the model's own decisions change future training data (feedback loops).

**Common prompts** reduce to a few templates: ranking/recommendation (feeds, search, ads), classification under imbalance (fraud, moderation, credit), and LLM applications (RAG, agents). The modules that follow work through each.
`,
  traps: [
    { trap: "Jump straight to \"I'd use a transformer\".", why: "Without the objective, label and constraints, the interviewer can't judge whether the model fits. Clarify, frame and set metrics first; models come fifth." },
    { trap: "Optimise clicks because that's the label you have.", why: "Clicks reward clickbait. Name the real goal (satisfaction, retention, revenue) and use multi-objective scoring plus guardrail metrics." },
    { trap: "Stop at the offline metric.", why: "Offline gains often don't transfer. A design isn't complete without an A/B plan, rollout, monitoring and failure handling." },
  ],
  say: {
    prompt: "Walk me through how you approach any ML system design question.",
    secs: 60,
    check: ["Clarify goal, users, scale, latency and constraints first", "Frame as an ML task with a concrete, collectable label", "Offline and online metrics plus guardrails", "Data/labels/features before model; baseline first, then stages", "Serving budget, A/B rollout, monitoring and feedback loops"],
    followups: [
      { q: "How do you choose between a single model and a multi-stage pipeline?", a: "By the funnel: if the corpus is too large for the best model to score every item within the latency budget, use cheap high-recall retrieval to shortlist, then an expensive ranker on the shortlist." },
      { q: "What do you do when the proxy label conflicts with the business goal?", a: "Combine several predicted outcomes into a weighted score, add negative signals (hides, reports), set guardrail metrics, and validate the weights with online experiments on long-term metrics." },
      { q: "How do you manage time in the interview?", a: "About 5 minutes on requirements and metrics, 25 on data, features, model and serving, 10 on evaluation, rollout and follow-ups; check with the interviewer which part they want to go deep on." },
    ],
    answer: `I use the same structure every time. First I clarify the goal, users, scale, latency and constraints, and write the numbers down. Then I frame it as an ML problem with a label I can actually collect, and choose offline metrics, the online metric the business cares about, and guardrails.

Next comes data: where labels come from, their delay and biases, and features split into user, item, context and cross features. Then the model, starting from a simple baseline and moving to a staged pipeline if the corpus is large, with the latency budget split across stages. I finish with serving and fallbacks, an A/B test and gradual rollout, monitoring for drift and feedback loops, and the main failure modes.`,
    avoid: ["Naming a model before the objective and label", "Ignoring rollout and monitoring"],
  },
  terms: [["Guardrail metric", "Metric that must not get worse (latency, complaints, revenue) while optimising the main one."], ["Funnel", "Sequence of stages that shrink candidates from millions to a handful."], ["Feedback loop", "The model's outputs shape the data it is later trained on."]],
  sources: [SD.rules, SD.debt],
});
Q({ id: "sd-fr-1", d: 1, secs: 30, prompt: "A feed must answer within 200 ms. Network takes 40 ms, feature fetch 50 ms and candidate generation 30 ms. How many ms remain for ranking and re-ranking?", answer: 80, tol: 0.5, explain: "200 − 40 − 50 − 30 = 80 ms.", py: "answer = 200 - 40 - 50 - 30" });
Q({ id: "sd-fr-2", d: 1, secs: 45, prompt: "Four candidate sources return 500 items each and 20% of all returned items are duplicates. How many unique candidates reach the ranker?", answer: 1600, tol: 0.5, explain: "2,000 × (1 − 0.2) = 1,600.", py: "answer = 4*500*(1-0.2)" });
Q({ id: "sd-fr-3", d: 1, secs: 30, prompt: "First thing to do after hearing \"design a recommendation system\"?", options: ["Pick a model architecture", "Clarify the objective, users, scale and constraints", "Estimate GPU cost", "Draw the feature store"], answer: 1, explain: "Everything else depends on the goal and constraints.", py: "answer = 1" });
C("sd-fr-c1", "Design frame", "Clarify → ML framing → metrics → data/labels → features → model → serving → rollout & monitoring.");
C("sd-fr-c2", "Funnel", "Corpus → retrieval (thousands) → ranker (hundreds) → re-rank (tens) → shown.");

L("sd-capacity", FW, "Back-of-envelope capacity estimation", "QPS, storage, compute and cost numbers you should be able to produce in a minute.", {
  kind: "concept", mins: 20, prereq: ["sd-frame"],
  hook: "50 million daily users open the app 20 times a day. Can one ranking cluster handle it, and how big is the embedding table?",
  intuition: `
**The situation.** Interviewers expect rough numbers: they show you understand where the cost and latency go, and they decide architecture (can you score every item? do you need ANN search? batch or online?).

**The idea.** Estimate in powers of ten, state assumptions, round aggressively, and sanity-check.

- **Traffic:** requests/day ÷ 86,400 s = average QPS; peak is typically 2–5× average.
- **Storage:** count × size per item. Embeddings: items × dimensions × bytes per number.
- **Compute:** QPS × candidates per request × cost per candidate.
- **Cost:** hardware-hours × price, or tokens × price per token for LLM systems.

Numbers to remember: 1 day ≈ $10^5$ s; fp32 = 4 bytes, fp16 = 2 bytes; 1 GB = $10^9$ bytes; reading memory at ~1 TB/s on a modern GPU, ~10 GB/s from a fast SSD.
`,
  maths: `
**In one breath.** Peak QPS = DAU × requests per user ÷ 86,400 × peak factor; storage = N × d × bytes; FLOP/s = QPS × candidates × FLOPs per candidate.

**Worked example.** 50M DAU × 20 requests = $10^9$ requests/day → 11,574 average QPS → ~34,700 at a 3× peak.

**Embeddings.** 100M items × 256 dims × 4 bytes = 102.4 GB: too big for one GPU in fp32, fine sharded or in fp16 with product quantisation.

**Ranking compute.** 35k QPS × 1,000 candidates × 2 MFLOPs = $7 \\times 10^{13}$ FLOP/s = 70 TFLOP/s of useful work: a small GPU fleet (allowing for <50% utilisation).

**Logs.** 1B impressions/day × 500 bytes = 500 GB/day of training data before sampling.

| Quantity | Formula | Typical lever |
|---|---|---|
| QPS | requests/day ÷ 86,400 × peak | caching, precomputation |
| Feature storage | entities × features × bytes | TTLs, compression |
| Embedding table | N × d × bytes | fp16/int8, PQ, sharding |
| Ranker compute | QPS × candidates × FLOPs | fewer candidates, distillation |
| Training data | events/day × bytes × days | negative downsampling |
`,
  practice: `
**How to use the numbers.** If scoring the whole corpus per request exceeds the budget, you need retrieval + ranking. If embeddings exceed one machine's memory, you need sharding or quantisation. If labels are only a few per million, you need downsampling and careful calibration. Say these conclusions out loud; the arithmetic is only useful for the decision it drives.

**Sanity checks.** Compare with things you know (a 7B model in fp16 is ~14 GB; a laptop SSD is ~1 TB). If an answer implies thousands of GPUs for a modest app, recheck units.
`,
  traps: [
    { trap: "Use average QPS to size the system.", why: "Traffic peaks at 2–5× the daily average (evenings, festivals, sales). Size for peak with headroom, and autoscale." },
    { trap: "Precision matters, so compute exactly.", why: "Interviewers want order-of-magnitude reasoning and stated assumptions. Exactness wastes time; wrong units or missing factors of 1,000 are the real risk." },
    { trap: "Storage is cheap, so ignore it.", why: "Embedding tables and logged features drive memory, network and training cost; they often decide sharding and sampling strategy." },
  ],
  say: {
    prompt: "Estimate the serving load and embedding storage for a recommendation system with 50M daily users and 100M items.",
    secs: 60,
    check: ["Requests/day → average QPS (÷ 86,400) → peak factor", "Embedding storage = items × dims × bytes, with a dimension assumption", "Ranker compute = QPS × candidates × per-candidate cost", "Turned numbers into design decisions (ANN retrieval, sharding, quantisation)", "Stated assumptions and rounded"],
    followups: [
      { q: "How would you cut the embedding memory by 8×?", a: "Store in fp16 (2×) and apply product quantisation or int8 (another 2–4×); serve from a sharded ANN index; drop or hash long-tail items." },
      { q: "When is batch (offline) scoring better than online scoring?", a: "When predictions don't depend on request-time context and can tolerate hours of staleness, e.g. daily email recommendations; it removes latency constraints and cuts cost." },
      { q: "What's a reasonable peak factor?", a: "2–3× for steady consumer apps, up to 5–10× around events or sales; check historical traffic and design autoscaling plus graceful degradation." },
    ],
    answer: `50M users at 20 requests a day is about a billion requests, so roughly 12,000 QPS on average and about 35,000 at a 3× peak. With 100M items and 256-dimensional fp32 embeddings, the table is about 100 GB, so it needs sharding or fp16 plus quantisation, and scoring all items per request is impossible: I'd use ANN retrieval to get a thousand or so candidates.

Ranking a thousand candidates at 2 MFLOPs each at peak is about 70 TFLOP/s of compute, a modest GPU fleet. Logging a billion impressions a day at ~500 bytes is 500 GB/day, which pushes me to downsample negatives for training.`,
    avoid: ["Sizing on average traffic", "Giving numbers without saying what they imply for the design"],
  },
  terms: [["QPS", "Queries per second."], ["Peak factor", "Ratio of peak to average traffic."], ["Product quantisation", "Compressing vectors into short codes for memory-efficient ANN search."]],
  sources: [SD.rules],
});
Q({ id: "sd-cap-1", d: 2, secs: 60, prompt: "50M daily users × 20 requests each, peak = 3× average. Peak QPS? (nearest whole number)", answer: 34722, tol: 50, explain: "1e9 / 86,400 = 11,574 average; × 3 = 34,722.", py: "answer = 50e6*20/86400*3" });
Q({ id: "sd-cap-2", d: 1, secs: 45, prompt: "100M item embeddings, 256 dimensions, fp32. Storage in GB (10⁹ bytes)?", answer: 102.4, tol: 0.1, explain: "1e8 × 256 × 4 = 1.024e11 bytes = 102.4 GB.", py: "answer = 100e6*256*4/1e9" });
Q({ id: "sd-cap-3", d: 2, secs: 60, prompt: "35,000 QPS × 1,000 candidates × 2 MFLOPs per candidate. Compute needed in TFLOP/s?", answer: 70, tol: 0.5, explain: "3.5e4 × 1e3 × 2e6 = 7e13 FLOP/s = 70 TFLOP/s.", py: "answer = 35000*1000*2e6/1e12" });
Q({ id: "sd-cap-4", d: 1, secs: 30, prompt: "1 billion impressions a day logged at 500 bytes each. GB per day?", answer: 500, tol: 0.5, explain: "1e9 × 500 = 5e11 bytes = 500 GB.", py: "answer = 1e9*500/1e9" });
C("sd-cap-c1", "QPS from DAU", "DAU × requests/user ÷ 86,400 × peak factor (2–5×).");
C("sd-cap-c2", "Embedding table size", "items × dims × bytes (fp32 = 4, fp16 = 2).");

L("sd-eval-rollout", FW, "Offline evaluation, A/B tests and rollout", "Choosing offline metrics, sizing experiments, and launching models safely.", {
  kind: "concept", mins: 25, prereq: ["sd-frame", "cml-roc-pr"],
  hook: "Your new ranker improves offline NDCG by 3%. In the A/B test, engagement is flat. What happened, and how should you have launched it?",
  intuition: `
**The situation.** Offline metrics are computed on logged data generated by the old system; online behaviour depends on what the new system shows. The two can disagree.

**Offline evaluation** checks the model is better on held-out, time-split data: ranking metrics (NDCG, recall@k, MRR), classification metrics (AUC, PR-AUC, log loss, calibration), sliced by segment. It's cheap and catches bugs, but it's biased: users only reacted to what the old model showed (selection and position bias).

**Online evaluation** is the A/B test: randomise users, compare the business metric with a pre-computed sample size and guardrails, then decide.

**Rollout** limits blast radius: shadow mode (score but don't act) → canary (1% traffic) → ramp (5% → 25% → 50%) → full, with automatic rollback triggers.
`,
  maths: `
**In one breath.** NDCG@k $= \\text{DCG}/\\text{IDCG}$ with $\\text{DCG} = \\sum_i \\frac{rel_i}{\\log_2(i + 1)}$; A/B sample size per arm $n \\approx \\frac{(z_{1-\\alpha/2} + z_{1-\\beta})^2\\,2p(1 - p)}{\\delta^2}$.

**NDCG example.** Relevances in ranked order (3, 2, 0, 1): DCG $= 3 + 2/\\log_2 3 + 0 + 1/\\log_2 5 = 4.693$. Ideal order (3, 2, 1, 0): 4.762. NDCG = 0.985.

**Recall@k.** 5 relevant items, 3 of them in the top 10: recall@10 = 0.6.

**Sample size.** Baseline CTR 5%, detect a 2% relative lift (0.1 percentage points), α = 0.05 two-sided, power 80%: about 746,000 users per arm. Small lifts on small base rates need very large tests; that's why variance reduction (CUPED) and sensitive metrics matter.

| Stage | Traffic | Goal | Exit criterion |
|---|---|---|---|
| Offline | none | quality, slices, bugs | beats baseline, no slice regressions |
| Shadow | mirror | latency, errors, prediction diffs | stable, within budget |
| Canary | ~1% | catastrophic failures | no guardrail breach |
| A/B | 5–50% | causal effect | significant win, guardrails OK |
| Ramp / full | 100% | long-term effect | holdback shows effect persists |
`,
  practice: `
**Why offline and online disagree.** Position and selection bias in logs; metric mismatch (NDCG on clicks vs. watch time online); training/serving skew; novelty effects; network effects; the new model changing which data you collect.

**Practical rules.** Time-based splits for offline evaluation. Pre-register the primary metric and sample size; don't peek and stop early without sequential methods. Check sample ratio mismatch. Keep a small long-term holdback to measure lasting effects. Automate rollback on guardrail breaches (latency, error rate, complaint rate).
`,
  traps: [
    { trap: "Offline AUC went up, so ship it.", why: "Offline data reflects the old policy's choices; gains may not transfer. Offline is a filter; the A/B test decides." },
    { trap: "Stop the A/B test as soon as it's significant.", why: "Peeking inflates false positives. Use a fixed horizon from a power calculation, or a sequential test designed for peeking." },
    { trap: "A 50/50 launch is the fastest way to learn.", why: "It maximises blast radius. Shadow and canary first catch crashes, latency and data bugs at 1% exposure." },
  ],
  say: {
    prompt: "How do you evaluate and launch a new ranking model?",
    secs: 60,
    check: ["Offline: time-split data, ranking/calibration metrics, slices", "Know offline–online gap: position/selection bias, metric mismatch", "A/B test with pre-computed sample size, primary metric and guardrails", "Shadow → canary → ramp with rollback triggers", "Long-term holdback / monitor after launch"],
    followups: [
      { q: "Why might a model with better offline NDCG lose online?", a: "Logged labels only cover items the old model showed (selection bias) and top positions (position bias); NDCG on clicks may not track the online goal; features may be computed differently online." },
      { q: "What is a sample ratio mismatch?", a: "When the observed split of users between arms differs significantly from the design (e.g. 50.6/49.4 at large n). It signals a bug in assignment or logging, so results can't be trusted." },
      { q: "What is interleaving?", a: "For rankers: mix results from two models into one list per user and see which model's items get more engagement. Much more sensitive than A/B on aggregate metrics, so it needs far less traffic." },
    ],
    answer: `Offline, I evaluate on a later time period than training with ranking metrics like NDCG and recall@k plus calibration, and I slice by segment to catch regressions. I treat that as a filter, because logs only contain feedback on what the old model showed.

Online, I run an A/B test with a pre-registered primary metric, a sample size from a power calculation, and guardrails like latency and complaints, and I check for sample ratio mismatch. The launch goes shadow first to check latency and prediction diffs, then a 1% canary with automatic rollback, then a ramp, and I keep a small long-term holdback to confirm the effect lasts.`,
    avoid: ["Shipping on offline metrics alone", "Peeking and stopping early"],
  },
  terms: [["NDCG", "Normalised discounted cumulative gain: ranking quality with position discount."], ["Shadow mode", "New model scores live traffic without affecting users."], ["Canary", "Release to a tiny share of traffic first."], ["Holdback", "Users kept on the old system to measure long-term effect."]],
  sources: [SD.kohavi, S.sklEval],
});
Q({ id: "sd-ev-1", d: 2, secs: 90, prompt: "Ranked relevances (3, 2, 0, 1). NDCG over these four positions? (3 decimals)", answer: 0.985, tol: 0.002, explain: "DCG = 3 + 2/log₂3 + 0 + 1/log₂5 = 4.693; IDCG (3, 2, 1, 0) = 4.762; ratio 0.985.", py: "import numpy as np\nr = np.array([3,2,0,1.]); i = np.sort(r)[::-1]\nd = 1/np.log2(np.arange(2,6))\nanswer = float((r*d).sum()/(i*d).sum())", packages: ["numpy"] });
Q({ id: "sd-ev-2", d: 1, secs: 30, prompt: "A user has 5 relevant items; 3 appear in your top 10. Recall@10?", answer: 0.6, tol: 0.005, explain: "3/5.", py: "answer = 3/5" });
Q({ id: "sd-ev-3", d: 3, secs: 120, prompt: "Baseline CTR 5%. Detect a 0.1 percentage-point lift (two-sided α = 0.05, power 0.8). Users per arm, approximately? (nearest thousand)", answer: 745700, tol: 3000, explain: "n ≈ (1.96 + 0.84)² × 2 × 0.05 × 0.95 / 0.001² ≈ 745,700.", py: "from scipy.stats import norm\nz = norm.ppf(0.975) + norm.ppf(0.8)\nanswer = z**2*2*0.05*0.95/0.001**2", packages: ["scipy"] });
Q({ id: "sd-ev-4", d: 1, secs: 30, prompt: "Which launch step exposes users to the new model's decisions the least?", options: ["Canary at 1%", "Shadow mode", "50/50 A/B", "Ramp to 25%"], answer: 1, explain: "Shadow mode scores live traffic but doesn't act on it.", py: "answer = 1" });
C("sd-ev-c1", "Launch ladder", "Offline → shadow → canary (1%) → A/B → ramp → full + holdback.");
C("sd-ev-c2", "Offline ≠ online", "Selection/position bias, metric mismatch, training–serving skew, novelty.");

L("sd-frame-practice", FW, "Design framework practice", "Six scenarios on structuring, sizing and launching ML systems.", {
  kind: "interview", mins: 30, prereq: ["sd-frame", "sd-capacity", "sd-eval-rollout"],
  hook: "Answer each out loud in about a minute, then open it and tick the points the interviewer listens for.",
}, [
  iq("The interviewer says only: \"Design a system to reduce loan defaults.\" What are your first questions?", "Which decision the model drives (approve/decline, limit, pricing, collections priority), which product and customer segment, what counts as default and over what window, volumes and latency (instant digital vs branch), regulatory constraints (explainability, fairness), and what success means (lower loss rate at the same approval rate, or higher approvals at the same loss).", ["Decision the model makes", "Label definition and window", "Scale and latency", "Regulation/explainability", "Success metric framed as a trade-off"]),
  iq("Estimate whether you can score every item for every request in a catalogue of 20M products at 5,000 QPS with a 1 ms-per-item model.", "20M × 1 ms = 20,000 s of compute per request; at 5,000 QPS that's 10⁸ CPU-seconds per second: impossible. You need cheap retrieval (ANN on embeddings, inverted indexes) to shortlist ~1,000 items, then the expensive model on the shortlist: 1 s of compute per request, parallelised, or a cheaper model.", ["Did the arithmetic", "Concluded full scoring is impossible", "Proposed retrieval + ranking", "Sized the shortlist against budget"]),
  iq("Your offline metric improved but the A/B test shows a 1% drop in revenue with p = 0.04. The PM wants to ship because engagement rose 2%. What do you do?", "Treat revenue as a guardrail: a significant drop is a stop unless the trade-off was agreed in advance. Check for SRM, novelty effects and segment effects, look at whether engagement gains translate to long-term value, and consider a variant that recovers revenue (e.g. adjusting ad load or the score weights). Decide with the pre-registered decision rule, not after the fact.", ["Guardrail breached", "Validity checks (SRM, novelty)", "Segment analysis", "Pre-registered decision rule", "Propose a fix rather than ship"]),
  iq("How would you detect that a deployed model has silently broken?", "Monitor inputs (missing features, distribution drift via PSI, schema changes), outputs (score distribution, positive rate, calibration on delayed labels), system health (latency, errors, timeouts/fallback rate), and business metrics. Alert on sharp changes and compare against a shadow or previous model; keep fallbacks.", ["Input monitoring/drift", "Prediction distribution", "Delayed-label performance", "System metrics", "Alerts + fallback"]),
  iq("When would you choose batch predictions over real-time inference?", "When inputs don't change within the request (e.g. daily churn scores, weekly email recs), when slight staleness is acceptable, or to save cost. Real-time is needed when request context matters (current session, location, transaction details) or decisions must be immediate (fraud, search). Hybrids precompute heavy parts and add light real-time features.", ["Staleness tolerance", "Request-time context", "Cost", "Hybrid option"]),
  iq("Name three ways an ML system can create a feedback loop and how you'd mitigate them.", "Recommenders only learn from what they show (popular items get more popular): add exploration and debias with propensity weighting. Credit models only observe repayment for approved applicants: reject inference, small randomised approvals. Fraud models block transactions so their labels disappear: hold out a small random sample for labelling. Monitor diversity and keep holdouts.", ["Recsys exposure loop", "Credit selection bias", "Fraud label censoring", "Exploration / holdouts / propensity weighting"]),
]);

// ───────────────────────── Recommendations and ranking ─────────────────────────

L("sd-feed", RR, "Design a social feed ranking system", "Candidate sources, multi-task ranking, value models and integrity guardrails for a home feed.", {
  kind: "design", mins: 35, prereq: ["sd-frame", "sd-capacity"],
  hook: "Design the ranking for a social app's home feed: 100M daily users, posts from friends, groups and creators.",
  intuition: `
**Clarify.** Goal: long-term user satisfaction and retention, not raw clicks. Scale: 100M DAU, ~10 feed loads per user per day, each needs ~50 posts ranked within ~200 ms. Inventory per user: a few thousand eligible recent posts. Constraints: integrity (no misinformation/harassment boosting), creator fairness, freshness.

**Architecture in words.**

1. **Candidate generation:** gather eligible posts from friends, joined groups, followed creators, plus out-of-network recommendations from an embedding retriever. A few thousand per request.
2. **Light ranker:** a small model trims to ~500.
3. **Heavy ranker:** a multi-task neural model predicts several outcomes for each post: click, like, comment, share, long dwell, hide/report.
4. **Value model:** combine predictions into one score with tuned weights (negative weights on hide/report).
5. **Re-ranking / policy layer:** diversity (no five posts from one author), freshness, integrity demotions, ads insertion.
`,
  maths: `
**Value score.** $V = \\sum_k w_k\\,\\hat p_k$. With $\\hat p_{click} = 0.10$, $\\hat p_{like} = 0.02$, $\\hat p_{comment} = 0.005$, $\\hat p_{hide} = 0.01$ and weights 1, 5, 10, −20: $V = 0.1 + 0.1 + 0.05 - 0.2 = 0.05$.

**Load.** 100M × 10 = $10^9$ feed requests/day ≈ 11.6k QPS average, ~35k peak. Heavy ranker on 500 candidates: ~17.5M post scorings per second at peak.

**Training data.** $2 \\times 10^9$ impressions/day at 3% engagement. Keep all positives, 10% of negatives: $0.03 \\times 2\\times10^9 + 0.97 \\times 2\\times10^9 \\times 0.1 = 2.54 \\times 10^8$ rows/day. Correct the predicted probability for downsampling: $q = p/(p + (1 - p)/w)$ with $w = 0.1$.

| Component | Model | Latency share | Notes |
|---|---|---|---|
| Candidate sources | rules + ANN two-tower | 30 ms | recall, freshness |
| Light ranker | small GBDT/MLP | 20 ms | cut to ~500 |
| Heavy ranker | multi-task DNN | 60 ms | shared bottom, task heads |
| Re-rank | rules + diversity | 10 ms | integrity, ads, dedup |
`,
  practice: `
**Labels.** Implicit feedback per impression: click, like, comment, share, dwell > X seconds, hide, report, unfollow. Survey responses ("Is this worth your time?") as a sparse, high-quality label to calibrate the value weights.

**Features.** Viewer–author affinity (past interactions), post content embeddings (text/image), author quality, post age and engagement velocity, viewer context (device, time, session depth), cross features.

**Model.** Multi-task network with shared embeddings and per-task heads (MMoE if tasks conflict). Log-loss per task; calibrated outputs because they're combined linearly.

**Offline metrics.** Per-task AUC/log loss, calibration; NDCG of the value score against observed engagement.

**Online.** A/B on sessions/DAU, time spent with guardrails on hides/reports, integrity prevalence, creator distribution; long-term holdback for retention.

**Failure modes.** Clickbait/engagement bait (counter with negative signals and integrity classifiers), filter bubbles (diversity, exploration), popularity feedback loops, stale features, latency spikes (fallback to the light ranker's order).
`,
  traps: [
    { trap: "Rank by predicted click-through rate.", why: "Optimises clickbait and outrage. Combine several outcomes, including negative ones, with weights tuned against long-term metrics." },
    { trap: "Train on all impressions without thinking about bias.", why: "Users only see top positions; the model learns position, not quality. Add position as a training feature (set to a constant at serving) or use propensity weighting." },
    { trap: "Diversity can be left to the model.", why: "Pointwise rankers score items independently and will stack similar posts. Diversity, dedup and integrity rules belong in an explicit re-ranking layer." },
  ],
  say: {
    prompt: "Summarise your design for a social feed ranker.",
    secs: 75,
    check: ["Goal = long-term satisfaction; guardrails for integrity and hides", "Candidate sources (in-network + embedding retrieval) → light ranker → heavy ranker → re-rank", "Multi-task model predicting several actions combined by a value model with negative weights", "Labels, negative downsampling and calibration", "A/B on retention/sessions with guardrails; failure modes like clickbait and filter bubbles"],
    followups: [
      { q: "How do you set the value-model weights?", a: "Start from business intuition, then tune with online experiments against long-term metrics (retention, survey satisfaction); some teams regress survey answers on predicted actions to get weights." },
      { q: "How do you handle position bias in training?", a: "Include position as a feature during training and set it to a fixed value at serving, or weight examples by inverse propensity of being examined; randomised exploration slots help estimate propensities." },
      { q: "What if the heavy ranker times out?", a: "Fall back to the light ranker's ordering (or a cached feed) and log the event; never return an empty feed." },
    ],
    answer: `The goal is long-term satisfaction, so I wouldn't rank on clicks alone. For each feed load I gather a few thousand eligible posts from friends, groups and followed creators plus embedding-based recommendations, trim them to about 500 with a light model, then score them with a multi-task network that predicts clicks, likes, comments, shares, dwell and negative actions like hides and reports. A value model combines those probabilities with tuned weights, negative ones for hides and reports, and a re-ranking layer enforces diversity, freshness, integrity demotions and ad slots.

Training uses impression logs with negatives downsampled and probabilities recalibrated, and position bias handled explicitly. I'd validate offline with per-task AUC and calibration, then A/B test on sessions and retention with guardrails on hides, reports and integrity prevalence, and monitor for engagement bait and feedback loops.`,
    avoid: ["“Rank by CTR”", "No re-ranking or integrity layer"],
  },
  terms: [["Value model", "Weighted sum of predicted outcome probabilities used as the final score."], ["Multi-task learning", "One network with shared layers predicting several labels."], ["MMoE", "Multi-gate mixture of experts: per-task gating over shared experts."]],
  sources: [SD.wideDeep, SD.rules, SD.calib],
});
Q({ id: "sd-feed-1", d: 1, secs: 45, prompt: "Predicted probabilities: click 0.10, like 0.02, comment 0.005, hide 0.01. Weights 1, 5, 10, −20. Value score?", answer: 0.05, tol: 0.0005, explain: "0.1 + 0.1 + 0.05 − 0.2 = 0.05.", py: "import numpy as np\nanswer = float(np.dot([0.1,0.02,0.005,0.01],[1,5,10,-20]))", packages: ["numpy"] });
Q({ id: "sd-feed-2", d: 2, secs: 60, prompt: "2 × 10⁹ impressions/day, 3% positive. Keep all positives and 10% of negatives. Training rows per day (in millions)?", answer: 254, tol: 0.5, explain: "60M positives + 194M sampled negatives = 254M.", py: "n = 2e9\nanswer = (0.03*n + 0.97*n*0.1)/1e6" });
Q({ id: "sd-feed-3", d: 3, secs: 90, prompt: "After keeping 10% of negatives (w = 0.1), the model predicts 0.20. Recalibrated probability q = p/(p + (1 − p)/w)? (4 decimals)", answer: 0.0244, tol: 0.0002, explain: "0.2/(0.2 + 0.8/0.1) = 0.2/8.2 = 0.0244.", py: "p, w = 0.2, 0.1\nanswer = p/(p + (1-p)/w)" });
C("sd-feed-c1", "Feed pipeline", "Sources → light ranker → multi-task heavy ranker → value model → re-rank (diversity, integrity, ads).");
C("sd-feed-c2", "Downsampling correction", "q = p/(p + (1 − p)/w), w = fraction of negatives kept.");

L("sd-video-recs", RR, "Design short-video recommendations", "Two-tower retrieval, watch-time objectives and fast feedback for a vertical video app.", {
  kind: "design", mins: 35, prereq: ["sd-feed"],
  hook: "Design recommendations for a short-video app: 50M items, users swipe through ~100 videos a session, and the next video must be chosen in under 100 ms.",
  intuition: `
**Clarify.** One video at a time, full screen, so each choice matters and feedback is instant (watch time, skip, replay, like, share). Goal: satisfying sessions and retention. Corpus 50M videos, 10k+ uploaded per hour, so freshness and cold start matter. Latency ~100 ms per next-batch request.

**Architecture in words.**

1. **Retrieval:** a **two-tower model**: a user tower encodes the user's history and context into a vector, an item tower encodes each video; nearest-neighbour search over item vectors returns candidates. Add retrieval from recent interests, follows, trending and fresh uploads.
2. **Ranking:** a model predicting watch fraction, completion, skip within 2 seconds, like, share, follow.
3. **Re-rank:** diversity across creators and topics, freshness boost, safety filters.
4. **Real-time loop:** session signals (last few swipes) update the user vector or ranking features within seconds; models retrain frequently (hourly incremental).
`,
  maths: `
**Two-tower score.** $s(u, v) = \\mathbf{u}^\\top \\mathbf{v}$. User $(0.2, 0.5, -0.1)$, item $(1, 0.4, 2)$: $0.2 + 0.2 - 0.2 = 0.2$.

**In-batch negatives and popularity bias.** Training with other items in the batch as negatives over-penalises popular items (they appear as negatives more often). The logQ correction scores $s - \\log q(v)$, where $q(v)$ is the item's sampling probability: for $q = 0.001$ the correction adds $-\\ln 0.001 = 6.91$.

**Index size.** 50M items × 128 dims × fp16 = 12.8 GB: fits on one large GPU or a few CPU shards; with product quantisation a few GB.

| Stage | Candidates | Model | Budget |
|---|---|---|---|
| Two-tower ANN + other sources | ~2,000 | dot product | 20 ms |
| Ranker | ~2,000 → 50 | multi-task DNN | 50 ms |
| Re-rank | 50 → 10 | rules + diversity | 10 ms |
`,
  practice: `
**Labels.** Watch fraction (cap at 1, normalise by video length so long videos aren't favoured), completion, rewatch, quick skip (< 2 s) as a negative, likes/shares/follows as sparse strong positives.

**Features.** User: history sequence embedding, long- and short-term interests, device, time. Video: content embeddings (frames, audio, caption), creator, age, early engagement velocity. Context: session position, network.

**Freshness.** New uploads get an exploration budget and content-based embeddings so they can be retrieved before they have interactions (see the cold-start lesson).

**Metrics.** Offline: recall@k for retrieval, AUC/log loss per head, NDCG. Online: watch time per session, sessions/day, retention, skip rate; guardrails on reports and creator diversity.

**Failure modes.** Rabbit holes (repetitive or harmful content: diversity constraints and safety classifiers), popularity bias, stale user vectors, index lag for new uploads.
`,
  traps: [
    { trap: "Optimise total watch time directly.", why: "Favours long videos and compulsive loops. Normalise by length, use completion and satisfaction signals, and guardrail negative outcomes." },
    { trap: "Use the two-tower model for final ranking too.", why: "Two-tower models can't use rich user–item cross features; they're for fast retrieval. A ranker with cross features does the final ordering." },
    { trap: "In-batch negatives are unbiased.", why: "Popular items are over-sampled as negatives; apply logQ correction or mixed negative sampling." },
  ],
  say: {
    prompt: "Summarise your short-video recommendation design.",
    secs: 75,
    check: ["Two-tower retrieval with ANN plus other candidate sources", "Multi-task ranker on watch fraction, completion, skips and explicit actions", "Real-time session signals and frequent retraining", "Cold start / exploration for fresh uploads", "Metrics: session watch time and retention with guardrails; diversity and safety"],
    followups: [
      { q: "Why two towers for retrieval?", a: "Item vectors can be precomputed and indexed, so retrieval is one user-vector computation plus an ANN lookup, which scales to tens of millions of items in milliseconds." },
      { q: "How do you make the feed react within a session?", a: "Feed the last few interactions into the user tower or as ranking features at request time, and refresh candidates every few swipes; train incrementally on fresh logs." },
      { q: "How do you stop the system pushing harmful rabbit holes?", a: "Safety classifiers filter candidates, diversity constraints cap topic concentration, negative signals are weighted, and wellbeing guardrails are monitored in experiments." },
    ],
    answer: `Each request retrieves a couple of thousand candidates, mainly from a two-tower model whose item vectors sit in an ANN index, plus follows, trending and a fresh-upload pool. A multi-task ranker predicts normalised watch fraction, completion, quick skips, likes, shares and follows, combined into one score, and a re-ranker adds creator and topic diversity, freshness and safety filtering.

Because feedback is instant, I'd use the last few swipes as real-time features and retrain incrementally. New videos get content-based embeddings and an exploration budget. I'd measure recall@k and per-head AUC offline, and online watch time per session and retention, with guardrails on skips, reports and diversity.`,
    avoid: ["Ranking purely on raw watch time", "No plan for fresh uploads"],
  },
  terms: [["Two-tower model", "Separate user and item encoders whose dot product scores relevance."], ["ANN", "Approximate nearest-neighbour search."], ["logQ correction", "Subtract log sampling probability to debias in-batch negatives."]],
  sources: [SD.wideDeep, SD.rules],
});
Q({ id: "sd-vid-1", d: 1, secs: 30, prompt: "Two-tower dot product of user (0.2, 0.5, −0.1) and item (1, 0.4, 2)?", answer: 0.2, tol: 0.0005, explain: "0.2 + 0.2 − 0.2 = 0.2.", py: "import numpy as np\nanswer = float(np.dot([0.2,0.5,-0.1],[1,0.4,2]))", packages: ["numpy"] });
Q({ id: "sd-vid-2", d: 1, secs: 45, prompt: "50M item vectors, 128 dimensions, fp16. Index size in GB (10⁹ bytes)?", answer: 12.8, tol: 0.05, explain: "5e7 × 128 × 2 = 1.28e10 bytes.", py: "answer = 50e6*128*2/1e9" });
Q({ id: "sd-vid-3", d: 2, secs: 60, prompt: "logQ correction: an item's in-batch sampling probability is 0.001. How much does subtracting log q add to its logit? (2 decimals)", answer: 6.91, tol: 0.01, explain: "−ln 0.001 = 6.91.", py: "import math\nanswer = -math.log(0.001)" });
C("sd-vid-c1", "Retrieval vs ranking", "Two-tower + ANN for recall at scale; cross-feature ranker for precision.");

L("sd-cold-start", RR, "Design for cold start: new users and new items", "Content features, priors, exploration and onboarding when there's no interaction history.", {
  kind: "design", mins: 30, prereq: ["sd-video-recs"],
  hook: "A marketplace launches 2,000 new listings a day and onboards 50,000 new users. Your collaborative model knows nothing about any of them. Design for it.",
  intuition: `
**Clarify.** Two problems: **new items** (no interactions, so collaborative embeddings are random and they're never retrieved) and **new users** (no history, so personalisation can't start). Plus new categories or markets. Goal: get new items fair exposure fast without hurting user experience; personalise new users within their first session.

**Approach in words.**

- **Content-based representations:** embed items from title, description, images, price, category so similar old items lend their behaviour. A model that maps content features to the collaborative embedding space lets new items be retrieved on day one.
- **Priors and smoothing:** estimate a new item's CTR with a Bayesian prior from its category, updated as data arrives.
- **Exploration:** reserve a small share of impressions for new items, chosen by a bandit (UCB, Thompson sampling) that balances learning and quality.
- **New users:** onboarding questions, context (location, device, referral source), popular-in-segment defaults, then rapid session-based updates.
`,
  maths: `
**Bayesian CTR smoothing.** Beta prior with mean 2% and strength 100: $\\text{Beta}(2, 98)$. A new item with 5 clicks in 50 impressions: posterior mean $= (2 + 5)/(100 + 50) = 0.0467$ (raw 0.10 would over-promote it on thin evidence).

**Exploration budget.** 5% of 10M daily impressions across 2,000 new items = 250 impressions each per day: enough to estimate CTR to roughly ±2.7 points at 5% (SE $\\sqrt{0.05 \\times 0.95/250}$ ≈ 1.4 points).

**UCB score.** $\\bar x + \\sqrt{2\\ln N / n}$. Mean 0.05 after 100 impressions, $N = 10{,}000$ total: $0.05 + \\sqrt{2 \\times 9.21/100} = 0.479$: the uncertainty bonus dominates until data accumulates.

| Problem | Signal available | Technique |
|---|---|---|
| New item | content, category, seller | content embeddings, category priors, exploration slots |
| New user | context, onboarding answers | segment popularity, quick-learning session features |
| New category/market | related categories | transfer from similar categories, shared embeddings |
`,
  practice: `
**Item side.** Generate content embeddings at upload; map them into the collaborative space (train a regressor from content to learned item embeddings on old items). Give new items a boosted exploration pool with quality filters; graduate them once they have enough impressions.

**User side.** 3–5 onboarding choices, use referral campaign or search query as intent, rank by segment popularity, and weight in-session actions heavily for the first sessions.

**Metrics.** Time-to-first-engagement for new items; share of new items reaching N impressions; new-user D1/D7 retention; overall CTR guardrail so exploration doesn't degrade the experience.

**Failure modes.** Exploration wasted on low-quality spam (filter first); popularity bias starving the long tail; new-user defaults that feel generic.
`,
  traps: [
    { trap: "Collaborative filtering will learn new items quickly.", why: "Not if they're never shown: no impressions, no interactions, no embedding. You need content features and deliberate exploration." },
    { trap: "Rank new items by their raw CTR.", why: "With 20 impressions, a 10% CTR is mostly noise. Shrink towards a category prior." },
    { trap: "Exploration is free.", why: "It costs short-term engagement. Budget it explicitly, target it with bandits, and measure the long-term gain in catalogue coverage." },
  ],
  say: {
    prompt: "How would you handle cold start for new items and new users in a recommender?",
    secs: 60,
    check: ["Content-based embeddings for new items (mapped into the collaborative space)", "Bayesian priors / smoothing for thin statistics", "Explicit exploration budget with bandits", "New users: onboarding, context, segment popularity, fast session updates", "Metrics for exploration cost and new-item/new-user outcomes"],
    followups: [
      { q: "UCB vs Thompson sampling?", a: "UCB adds a deterministic confidence bonus that shrinks with impressions; Thompson sampling draws from each item's posterior and picks the best draw. Thompson is often better in practice and handles delayed feedback well." },
      { q: "How do you stop exploration being gamed by spammy listings?", a: "Apply quality and integrity filters before exploration eligibility, cap per-seller exploration, and use content-quality models in the prior." },
      { q: "When does an item 'graduate' from cold start?", a: "When its posterior is tight enough (e.g. enough impressions that the CI on CTR is narrow) or when its collaborative embedding has trained on sufficient interactions." },
    ],
    answer: `For new items I'd lean on content: embed title, description, images and category at upload and map them into the same space as the collaborative embeddings, so new items can be retrieved immediately. Their engagement estimates start from a category prior and update as data arrives, and a fixed exploration budget, allocated with a bandit like Thompson sampling, guarantees each quality-filtered new item enough impressions to learn.

For new users I'd use onboarding choices and context like location and referral source, start from segment popularity, and weight in-session actions heavily. I'd track new-item time to first engagement, new-user D1/D7 retention, and the overall engagement cost of exploration.`,
    avoid: ["“Collaborative filtering handles it”", "Using raw CTR on tiny samples"],
  },
  terms: [["Cold start", "No interaction history for a user or item."], ["Thompson sampling", "Choose the arm with the highest draw from its posterior."], ["UCB", "Mean plus a confidence bonus that shrinks with data."]],
  sources: [SD.rules, SD.wideDeep],
});
Q({ id: "sd-cs-1", d: 2, secs: 60, prompt: "Beta(2, 98) prior on CTR; a new item gets 5 clicks in 50 impressions. Posterior mean CTR? (4 decimals)", answer: 0.0467, tol: 0.0002, explain: "(2 + 5)/(100 + 50) = 7/150 = 0.0467.", py: "answer = (2+5)/(2+98+50)" });
Q({ id: "sd-cs-2", d: 1, secs: 30, prompt: "5% of 10M daily impressions are shared equally among 2,000 new items. Impressions per item per day?", answer: 250, tol: 0.5, explain: "500,000 / 2,000 = 250.", py: "answer = 10e6*0.05/2000" });
Q({ id: "sd-cs-3", d: 3, secs: 90, prompt: "UCB1 score for an item with mean 0.05 after n = 100 pulls when N = 10,000 total pulls: mean + √(2 ln N / n)? (3 decimals)", answer: 0.479, tol: 0.002, explain: "√(2 × 9.2103 / 100) = 0.4292; + 0.05 = 0.479.", py: "import math\nanswer = 0.05 + math.sqrt(2*math.log(10000)/100)" });
C("sd-cs-c1", "Cold start toolkit", "Content embeddings · category priors · exploration budget (bandits) · onboarding/context for users.");

L("sd-notifications", RR, "Design push-notification optimisation", "Deciding whom to notify, about what and when, without burning out users.", {
  kind: "design", mins: 30, prereq: ["sd-feed"],
  hook: "Design the system that decides which push notifications to send to 30M users a day, maximising engagement without driving uninstalls.",
  intuition: `
**Clarify.** Each user is eligible for many candidate notifications (friend activity, new content, reminders, offers). Sending more lifts short-term opens but raises opt-outs and uninstalls, which are permanent. Goal: incremental long-term engagement per notification. Constraints: daily caps, quiet hours, regulatory/consent rules, delivery latency for time-sensitive events.

**Architecture in words.**

1. **Candidate generation:** event triggers and scheduled campaigns create candidates per user.
2. **Scoring:** predict P(open), P(downstream session value), and P(opt-out/disable | send).
3. **Uplift, not just propensity:** what matters is the *extra* engagement caused by sending, versus the user's baseline activity.
4. **Decision:** send if expected incremental value − λ × expected fatigue cost > threshold, subject to per-user caps and timing optimisation.
5. **Timing:** choose the send time from the user's activity pattern.
`,
  maths: `
**Decision rule.** Send if $\\Delta V - \\lambda\\,P(\\text{opt-out}) \\cdot C_{\\text{lost}} > 0$. Example: incremental value 0.04 sessions, opt-out probability 0.002, a lost user costs 30 sessions, λ = 1: $0.04 - 0.06 = -0.02$: don't send.

**Uplift (two-model approach).** $\\hat\\tau(x) = \\hat p(\\text{active} \\mid x, \\text{send}) - \\hat p(\\text{active} \\mid x, \\text{no send})$. A user with 0.62 vs 0.55 has uplift 0.07; a habitual user with 0.95 vs 0.94 has 0.01: high open rates, little impact.

**Volume.** 30M users × average 8 candidates = 240M scorings/day, batchable for scheduled content, real-time for triggered events.
`,
  practice: `
**Data.** Randomised holdouts (users who randomly don't receive a given notification) are essential to learn uplift; log candidate, decision, send time and outcomes.

**Models.** Open-rate and value models (GBDT), uplift models (T-learner, X-learner, or uplift trees), fatigue model on recent volume and past ignores.

**Metrics.** Online: DAU/sessions per user from notifications, opt-out and uninstall rates (guardrails), long-term retention in a holdback. Offline: uplift curves / Qini on randomised data, calibration.

**Failure modes.** Over-sending to responsive users, notification spam during festivals, time-zone bugs, sending stale events.
`,
  traps: [
    { trap: "Send to users with the highest predicted open rate.", why: "Many of them would open the app anyway. Target incremental value (uplift), measured against randomised holdouts." },
    { trap: "More notifications always mean more engagement.", why: "Short-term opens rise, but opt-outs and uninstalls are permanent losses. Model fatigue and cap volume." },
    { trap: "Uplift can be learned from historical sends.", why: "Past sends weren't random (the old system chose them), so outcomes are confounded. You need randomised holdouts." },
  ],
  say: {
    prompt: "Summarise how you'd design notification optimisation.",
    secs: 60,
    check: ["Candidates per user from triggers and campaigns", "Predict incremental value (uplift) rather than raw open rate", "Model fatigue / opt-out cost; caps and quiet hours", "Randomised holdouts to learn and measure uplift", "Guardrails on opt-outs/uninstalls; timing optimisation"],
    followups: [
      { q: "What's a T-learner?", a: "Two models: one trained on treated (sent) users, one on control; uplift = difference of their predictions." },
      { q: "How do you choose send time?", a: "Predict per-hour open probability from the user's activity history and send in the best window that respects quiet hours and event freshness." },
      { q: "How do you evaluate uplift models offline?", a: "On randomised data: sort users by predicted uplift and plot cumulative incremental gain (uplift/Qini curves); higher area means better targeting." },
    ],
    answer: `I'd generate candidate notifications per user from event triggers and campaigns, then score each for the incremental engagement it causes rather than its open rate, because heavy users open the app anyway. Uplift models are trained on randomised holdouts. A fatigue model estimates the chance of opt-out or uninstall from recent volume and ignored notifications, and I'd send only when the expected incremental value beats the expected fatigue cost, within daily caps and quiet hours, at the user's best time.

Success is measured by sessions and retention in a long-term holdback, with opt-out and uninstall rates as guardrails.`,
    avoid: ["Targeting by open rate", "No randomised holdout"],
  },
  terms: [["Uplift", "Causal effect of an action on an individual: outcome with action minus without."], ["T-learner", "Separate outcome models for treated and control."], ["Qini curve", "Cumulative incremental gain from targeting by predicted uplift."]],
  sources: [SD.kohavi, SD.rules],
});
Q({ id: "sd-ntf-1", d: 2, secs: 60, prompt: "Incremental value 0.04 sessions, opt-out probability 0.002, a lost user costs 30 sessions. Net expected value of sending?", answer: -0.02, tol: 0.0005, explain: "0.04 − 0.002 × 30 = −0.02: don't send.", py: "answer = 0.04 - 0.002*30" });
Q({ id: "sd-ntf-2", d: 1, secs: 30, prompt: "P(active | send) = 0.62, P(active | no send) = 0.55. Uplift?", answer: 0.07, tol: 0.0005, explain: "0.62 − 0.55.", py: "answer = 0.62 - 0.55" });
Q({ id: "sd-ntf-3", d: 1, secs: 30, prompt: "Who benefits least from a notification?", options: ["P(active) 0.95 with, 0.94 without", "0.40 with, 0.30 without", "0.62 with, 0.55 without", "0.20 with, 0.12 without"], answer: 0, explain: "Uplift 0.01 vs 0.10, 0.07, 0.08.", py: "u = [0.95-0.94, 0.40-0.30, 0.62-0.55, 0.20-0.12]\nanswer = u.index(min(u))" });
C("sd-ntf-c1", "Notifications", "Target uplift, not open rate; subtract fatigue cost; learn from randomised holdouts.");

L("sd-recs-practice", RR, "Recommendations and ranking practice", "Six interview scenarios on recommenders and feeds.", {
  kind: "interview", mins: 30, prereq: ["sd-feed", "sd-video-recs", "sd-cold-start", "sd-notifications"],
  hook: "Answer each out loud in about a minute, then open it and tick the points the interviewer listens for.",
}, [
  iq("Your recommender's CTR rose 4% after launch but 30-day retention fell slightly. Diagnose.", "Likely optimising a short-term proxy: clickbait or repetitive content, lower diversity, or more low-satisfaction clicks. Check negative signals (hides, quick bounces), diversity metrics, and segment effects; add satisfaction/negative signals to the value model and use retention-based holdbacks to tune weights.", ["Proxy vs long-term goal", "Check negative/diversity signals", "Segment analysis", "Fix the objective/weights"]),
  iq("How would you design the candidate generation layer for an e-commerce homepage?", "Multiple sources merged and deduplicated: two-tower embedding retrieval on user history, item-to-item co-purchase/co-view from recent items, category affinity, trending/popular in segment, and new-item exploration. Each source has a quota; the union (~1–2k) goes to the ranker.", ["Multiple complementary sources", "Embedding retrieval", "Item-to-item", "Popular/trending + exploration", "Quotas and dedup"]),
  iq("What features would your ranking model use for a food-delivery restaurant list?", "User: past orders, cuisine affinity, price sensitivity, time-of-day habits. Restaurant: rating, prep time, price, cuisine, promo, live load. Context: distance/ETA, time, weather, day. Cross: user–cuisine affinity × restaurant cuisine, past orders from this restaurant. Real-time: current delivery ETA and availability.", ["User features", "Item features", "Context (ETA, time)", "Cross features", "Real-time availability"]),
  iq("How do you evaluate a recommender offline when you only have logs from the current system?", "Time-split replay with ranking metrics (recall@k, NDCG) on logged positives, with awareness of selection bias; counterfactual estimators (inverse propensity scoring) using logged propensities if the old policy randomised; interleaving online for faster comparisons.", ["Time split", "Ranking metrics", "Selection bias", "IPS/counterfactual", "Interleaving"]),
  iq("A creator complains their videos never get distributed. How might the system cause this and what would you change?", "Popularity feedback loops starve new or niche creators; cold-start content embeddings may be weak; integrity models may misfire. Add a creator-level exploration budget, check content embeddings and classifier false positives for that creator, and monitor exposure distribution metrics (e.g. Gini of impressions).", ["Feedback loop", "Cold start", "Classifier false positives", "Exploration/fair exposure", "Exposure distribution metric"]),
  iq("When would you use a two-tower model vs a cross-attention model?", "Two-tower for retrieval: item vectors are precomputed and searched with ANN, scaling to huge corpora with millisecond latency, but no rich user–item interactions. Cross-attention or feature-crossing rankers for the final few hundred candidates, where accuracy matters and per-pair compute is affordable.", ["Precomputable item vectors / ANN", "Latency and scale", "Cross features for ranking", "Stage-appropriate choice"]),
]);
