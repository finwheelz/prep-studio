/**
 * v2 ML system design, part B: Search and ads · Fraud and risk · LLM apps and RAG systems (first two designs).
 * Fixed ids; every quiz answer is recomputed in Pyodide.
 */
import { iq, lessonWriter } from "./v2-shared";
import { SD } from "./v2-sd-src";

const { L, Q, C } = lessonWriter("sysdesign");
const SA = "Search and ads";
const FR = "Fraud and risk";
const LA = "LLM apps and RAG systems";

// ───────────────────────── Search and ads ─────────────────────────

L("sd-search-rank", SA, "Design e-commerce search ranking", "Query understanding, hybrid retrieval and learning-to-rank for product search.", {
  kind: "design", mins: 35, prereq: ["sd-frame", "sd-eval-rollout", "llm-dense-retrieval"],
  hook: "Design product search for a marketplace with 100M listings and 40M searches a day. Results must come back within 300 ms at p99.",
  intuition: `
**Clarify.** What is the business goal: purchases per search, GMV per search, or simply finding the right item? Assume conversion per search, with relevance as a guardrail so the system doesn't push expensive but irrelevant items. Query mix: a head of popular queries ("iphone 15"), a long tail of rare ones, misspellings, Hinglish and transliteration ("kurti for ladies cotton"). Filters such as price, brand, in stock and deliverable to the user's pincode. Scale: 100M listings, 40M searches/day, p99 300 ms.

**Architecture in words.**

1. **Query understanding:** normalise, correct spelling, detect language and script, classify the query into categories, extract attributes (brand, colour, size), expand with synonyms.
2. **Retrieval (hybrid):** a lexical inverted index (BM25) for exact terms, model numbers and brands, plus a dense two-tower retriever for meaning ("shoes for running in rain"). Apply hard filters (stock, delivery, category) here. Union of ~1–2k candidates.
3. **First-stage ranker:** gradient-boosted trees trained with a ranking loss (LambdaMART) on cheap features, cutting to ~200.
4. **Second-stage ranker:** a heavier neural model or distilled cross-encoder that reads query and item text together, on the top ~200.
5. **Business re-rank:** sponsored slots, de-duplication of near-identical listings, seller diversity, out-of-stock removal.
`,
  maths: `
**Traffic.** 40M searches/day ÷ 86,400 = 463 QPS average; a 4× evening/sale peak is ~1,850 QPS. Head queries are heavily repeated, so a result cache for the top queries absorbs a large share.

**Latency budget (p99 300 ms).** Query understanding 20 ms, retrieval 60 ms, first-stage ranker 40 ms, second-stage ranker 80 ms, re-rank 20 ms, network and serialisation 80 ms.

**Candidate union.** Lexical returns 1,000 and dense returns 1,000 with 300 in common: $1{,}000 + 1{,}000 - 300 = 1{,}700$ unique candidates.

**Dense index size.** 100M items × 768 dims × 2 bytes (fp16) = 153.6 GB; product quantisation to 64 bytes per vector gives 6.4 GB, which fits in memory on a few shards.

**Ranking metrics.** Mean reciprocal rank (MRR) averages $1/\\text{rank}$ of the first relevant result: first relevant at ranks 1, 3, none, 2 over four queries gives $(1 + 1/3 + 0 + 1/2)/4 = 0.458$. NDCG@10 uses graded relevance (purchase > add to cart > click > skip).

| Component | Model / store | Candidates | Budget |
|---|---|---|---|
| Query understanding | spell model, category classifier, NER | 1 query | 20 ms |
| Lexical retrieval | sharded inverted index, BM25 | ~1,000 | 60 ms (parallel) |
| Dense retrieval | two-tower + ANN (PQ) | ~1,000 | 60 ms (parallel) |
| Stage-1 ranker | LambdaMART (GBDT) | 1,700 → 200 | 40 ms |
| Stage-2 ranker | DNN / distilled cross-encoder | 200 → 50 | 80 ms |
| Re-rank | rules, ads, diversity | 50 → 40 shown | 20 ms |
`,
  practice: `
**Data and labels.** Search logs give query, shown results with positions, clicks, add-to-carts and purchases. Turn them into graded labels (purchase 3, cart 2, click 1, shown but skipped 0). Clicks are position-biased, so either model examination probability (click models), use inverse propensity weights estimated from small randomised swaps, or include position as a training feature set to a constant at serving. Human relevance ratings on a sample of queries give an unbiased check, especially for the tail.

**Features.** Query–item text match (BM25 score, field matches on title/brand, embedding cosine), item quality (rating, returns rate, seller score), behaviour (query–item historical CTR and conversion, smoothed), price relative to the query's typical price, freshness and stock, light personalisation (brand and price affinity), context (device, location).

**Models per stage.** BM25 plus a two-tower retriever trained on query–purchase pairs with in-batch negatives; LambdaMART for stage 1 because it is fast and strong on tabular features; a cross-encoder distilled into a smaller model for stage 2.

**Serving.** Sharded index replicas, parallel lexical and dense calls with timeouts, online feature store for item counters, cache for head queries, fallback to stage-1 order if stage 2 times out.

**Offline metrics.** Recall@1,000 for retrieval, NDCG@10 and MRR for ranking on held-out later days, plus NDCG on human ratings; slice by head/torso/tail and by language.

**Online metrics.** Conversion per search, GMV per search, zero-result rate, reformulation rate (user immediately searches again), time to first click; guardrails on latency and seller concentration. Interleaving is a sensitive way to compare two rankers before a full A/B test.

**Monitoring.** Zero-result and low-result queries, new trending queries, index freshness lag, feature null rates, stage timeouts.

**Failure modes.** Popularity domination (the same bestsellers for every query), exact-match failures when dense retrieval misses model numbers, out-of-stock items ranking high, spam listings stuffing keywords, and no results for over-specific queries (relax filters step by step).
`,
  traps: [
    { trap: "Rank by historical clicks for the query.", why: "Clicks mostly reflect position and past ranking, so you entrench whatever was shown before. Debias for position and add relevance labels from raters." },
    { trap: "Dense retrieval makes the inverted index obsolete.", why: "Embeddings blur exact tokens: SKUs, model numbers and brand names. Hybrid retrieval keeps lexical precision and adds semantic recall." },
    { trap: "Optimise GMV per search directly.", why: "The ranker learns to push expensive items regardless of fit. Keep relevance as a guardrail and measure reformulation and returns." },
  ],
  say: {
    prompt: "Summarise your design for e-commerce product search.",
    secs: 75,
    check: ["Clarified goal (conversion per search) with relevance guardrail and scale", "Query understanding: spelling, language, category, attributes", "Hybrid retrieval (BM25 + dense) with filters, then staged rankers (LambdaMART → neural)", "Graded labels from logs with position-bias correction plus human ratings", "Offline recall/NDCG/MRR; online conversion, zero-result and reformulation rate; latency fallbacks"],
    followups: [
      { q: "How do you handle a query with zero results?", a: "Spell-correct and transliterate, drop the least important attribute filters one at a time, fall back to category-level results, and log the query for synonym mining." },
      { q: "Why LambdaMART for the first stage?", a: "It optimises a ranking metric (NDCG) through pairwise gradients, handles heterogeneous tabular features without scaling, and scores thousands of items in a few milliseconds on CPU." },
      { q: "How do you get labels for tail queries?", a: "Human relevance ratings on sampled tail queries, transfer from similar head queries via embeddings, and LLM-assisted rating checked against human agreement." },
    ],
    answer: `I'd aim at conversion per search with relevance as a guardrail. Each query first goes through understanding: spelling, script and language, category and attribute extraction, synonyms. Retrieval is hybrid: BM25 on a sharded inverted index for exact terms and a two-tower dense retriever for meaning, both with stock and delivery filters, giving around 1,700 candidates. A LambdaMART ranker cuts that to about 200 using match, quality, behaviour and price features, and a distilled cross-encoder orders the top 50 before a business layer adds ads, de-duplication and diversity.

Labels come from purchases, carts and clicks, graded and corrected for position bias, with human ratings for the tail. I'd measure recall@1,000 and NDCG@10 offline, sliced by head and tail, then A/B test on conversion per search with zero-result rate, reformulation rate and p99 latency as guardrails.`,
    avoid: ["Only embeddings, no lexical retrieval", "Training on raw clicks with no bias correction"],
  },
  terms: [["BM25", "Lexical relevance score from term frequency, inverse document frequency and length normalisation."], ["LambdaMART", "Gradient-boosted trees trained with LambdaRank gradients to optimise ranking metrics."], ["MRR", "Mean of 1/rank of the first relevant result."], ["Reformulation rate", "Share of searches followed quickly by another search: a sign the first failed."]],
  sources: [SD.lambdamart, SD.dpr, SD.rules],
});
Q({ id: "sd-srch-1", d: 1, secs: 45, prompt: "40M searches a day with a 4× peak factor. Peak QPS? (nearest whole number)", answer: 1852, tol: 2, explain: "40e6 / 86,400 = 463 average; × 4 = 1,852.", py: "answer = 40e6/86400*4" });
Q({ id: "sd-srch-2", d: 1, secs: 45, prompt: "A query has 10 relevant items. Lexical retrieval finds 6, dense finds 5, and 3 are found by both. Recall of the union?", answer: 0.8, tol: 0.005, explain: "Union = 6 + 5 − 3 = 8; 8/10 = 0.8.", py: "answer = (6 + 5 - 3)/10" });
Q({ id: "sd-srch-3", d: 2, secs: 60, prompt: "Four queries: first relevant result at rank 1, rank 3, not in the list, and rank 2. MRR? (4 decimals)", answer: 0.4583, tol: 0.0002, explain: "(1 + 1/3 + 0 + 1/2)/4 = 0.4583.", py: "import numpy as np\nanswer = float(np.mean([1, 1/3, 0, 1/2]))", packages: ["numpy"] });
Q({ id: "sd-srch-4", d: 1, secs: 30, prompt: "100M item vectors compressed with product quantisation to 64 bytes each. Index size in GB (10⁹ bytes)?", answer: 6.4, tol: 0.05, explain: "1e8 × 64 = 6.4e9 bytes.", py: "answer = 100e6*64/1e9" });
C("sd-srch-c1", "Search pipeline", "Query understanding → hybrid retrieval (BM25 + dense, filters) → LambdaMART → neural ranker → business re-rank.");
C("sd-srch-c2", "Search online metrics", "Conversion/GMV per search, zero-result rate, reformulation rate, latency.");

L("sd-ads-ctr", SA, "Design ad click prediction and the auction", "pCTR models, calibration, eCPM ranking and second-price pricing for an ads system.", {
  kind: "design", mins: 35, prereq: ["sd-feed", "cml-roc-pr"],
  hook: "Design the ad ranking system for a feed: 5,000 ad requests per second, 1M active ads, advertisers pay per click.",
  intuition: `
**Clarify.** Three parties: users (relevance, not too many ads), advertisers (return on spend, budgets respected) and the platform (revenue). Pricing: cost per click (CPC) here; also ask about CPM and optimised bidding for conversions. Latency ~100 ms for the whole ad request. Budgets and pacing: advertisers set daily budgets that should be spent smoothly. Frequency caps and policy checks.

**Architecture in words.**

1. **Eligibility and targeting:** filter ads by audience targeting, budget left, frequency caps, policy approval, placement.
2. **Candidate retrieval:** a few thousand eligible ads, narrowed by a light model or embedding retrieval to ~500.
3. **Prediction:** a pCTR model (and pCVR for conversion-optimised campaigns) per ad for this user and context.
4. **Auction:** rank by expected value per impression, $\\text{eCPM} = \\text{bid} \\times \\text{pCTR} \\times 1000$, often plus a quality or user-experience term.
5. **Pricing:** generalised second price (GSP): the winner pays the minimum bid that would keep its position.
6. **Pacing and feedback:** budget pacing throttles bids through the day; clicks and conversions flow back for training within minutes.

Because the price charged depends directly on the predicted probability, **calibration** matters as much as ranking quality.
`,
  maths: `
**eCPM ranking.** Ad A: bid ₹20 per click, pCTR 2.0% → eCPM ₹400. Ad B: ₹50, 0.6% → ₹300. Ad C: ₹10, 3.5% → ₹350. Order: A, C, B.

**GSP price for A per click.** Smallest bid that keeps A above C: $\\text{eCPM}_C / (\\text{pCTR}_A \\times 1000) = 350 / 20 = ₹17.5$.

**Calibration.** If the model predicts 2,400 clicks over a segment and 2,000 happen, the calibration ratio is 1.2: the model over-predicts by 20%, which over-ranks those ads and over-charges or misallocates.

**Normalised entropy (NE).** Log loss divided by the entropy of the background CTR. Log loss 0.09 at a 2% base rate: entropy $= -(0.02\\ln 0.02 + 0.98\\ln 0.98) = 0.098$, so NE = 0.918 (lower is better; 1.0 means no better than predicting the average).

**Load.** 5,000 requests/s × 500 candidates = 2.5M predictions per second, so the model must cost microseconds per ad. Logs: $10^9$ impressions/day at 1% CTR is $10^7$ clicks/day.

| Component | Model / method | Budget | Notes |
|---|---|---|---|
| Eligibility | index + rules | 10 ms | targeting, budget, caps |
| Retrieval | light model / embeddings | 15 ms | ~500 ads |
| pCTR / pCVR | GBDT+LR or embedding DNN (DLRM-style) | 30 ms | calibrated |
| Auction | eCPM sort, GSP pricing, reserve prices | 5 ms | quality term |
| Pacing | budget controller | async | smooth spend |
`,
  practice: `
**Data and labels.** Impression → click within the session for pCTR. Conversions arrive days later within an attribution window, so pCVR needs delayed-feedback handling (wait for mature labels, or model the delay). Negatives are downsampled for training and probabilities recalibrated afterwards.

**Features.** User (interests, past ad interactions, demographics where permitted), ad (advertiser, creative embedding, category, historical CTR smoothed), context (placement, position, time, device), and crosses. Sparse IDs (user, ad, advertiser) become learned embeddings.

**Models.** A strong classic baseline is boosted trees feeding a logistic regression (the Facebook ads paper); modern systems use embedding-heavy DNNs such as DLRM with explicit feature interactions. Train continuously or at least daily: freshness has a measurable effect on accuracy. Calibrate with isotonic or Platt scaling per segment after training.

**Serving.** Precomputed ad embeddings and counters in an online store; model inference batched across candidates; strict timeouts with a fallback to historical CTR.

**Offline metrics.** NE/log loss, AUC, calibration ratio by segment (advertiser, placement, new vs old ads).

**Online metrics.** Revenue per thousand impressions, CTR, advertiser conversions and cost per acquisition, budget delivery; user guardrails such as ad hides, session time and ad load. Experiments split users (and sometimes advertisers' budgets) to avoid interference.

**Monitoring.** Calibration drift by segment, spend anomalies, click spam and bot traffic, feature freshness.

**Failure modes.** Miscalibrated new ads (cold start: use priors and exploration), feedback loops where ads never shown never learn, budget exhaustion early in the day without pacing, fraudulent clicks inflating CTR.
`,
  traps: [
    { trap: "AUC is the metric that matters.", why: "AUC only measures ordering. Prices and eCPM use the probability itself, so log loss/NE and calibration are just as important." },
    { trap: "Rank ads by bid.", why: "A high bid with a tiny CTR earns little and annoys users. Rank by expected value: bid × pCTR (plus quality)." },
    { trap: "Retrain the CTR model weekly.", why: "Ad inventory, campaigns and user behaviour change daily; stale models lose accuracy quickly. Use online or frequent incremental training." },
  ],
  say: {
    prompt: "Walk me through an ad ranking and auction system.",
    secs: 75,
    check: ["Three-sided goals: users, advertisers, platform; budgets and pacing", "Eligibility → retrieval → pCTR/pCVR → auction", "eCPM = bid × pCTR and GSP pricing", "Calibration and NE/log loss, not just AUC", "Fresh training, delayed conversions, guardrails on ad load and user experience"],
    followups: [
      { q: "How does GSP pricing work?", a: "Ads are ranked by eCPM; each winner pays the smallest bid that would still keep its slot, i.e. the next ad's eCPM divided by the winner's pCTR, plus a small increment." },
      { q: "How do you handle conversions that arrive days later?", a: "Train pCVR only on impressions whose attribution window has closed, or model the conversion delay explicitly so recent examples aren't treated as negatives." },
      { q: "How do you stop new ads being starved?", a: "Start their CTR from an advertiser or category prior, give them an exploration budget, and use content features of the creative so the model can generalise." },
    ],
    answer: `I'd filter ads by targeting, budget, frequency caps and policy, retrieve about 500 candidates, and score each with a calibrated pCTR model, plus pCVR for conversion campaigns. The auction ranks by eCPM, bid times pCTR, with a quality term, and charges a generalised second price: the minimum bid that keeps the winner's slot. A pacing controller spreads each advertiser's budget through the day.

The model is embedding-heavy, like DLRM, or boosted trees feeding logistic regression as a baseline, trained continuously because freshness matters. Since price depends on the probability, I'd watch normalised entropy and calibration by segment as well as AUC. Online I'd track revenue per thousand impressions and advertiser outcomes, with ad hides and session time as guardrails.`,
    avoid: ["Ranking by bid alone", "Ignoring calibration"],
  },
  terms: [["eCPM", "Expected revenue per thousand impressions: bid × pCTR × 1,000 for CPC ads."], ["GSP", "Generalised second-price auction: pay the minimum needed to keep your position."], ["Normalised entropy", "Log loss divided by the entropy of the average CTR."], ["Pacing", "Controlling bid participation so a budget lasts the day."]],
  sources: [SD.fbCtr, SD.adTrenches, SD.dlrm, SD.gsp],
});
Q({ id: "sd-ads-1", d: 1, secs: 45, prompt: "Ads: A bids ₹20 with pCTR 2%, B bids ₹50 with pCTR 0.6%, C bids ₹10 with pCTR 3.5%. Which ad wins the top slot by eCPM?", options: ["A", "B", "C", "Tie between A and C"], answer: 0, explain: "eCPM: A 400, B 300, C 350.", py: "e = [20*0.02, 50*0.006, 10*0.035]\nanswer = e.index(max(e))" });
Q({ id: "sd-ads-2", d: 2, secs: 60, prompt: "Under GSP, A (pCTR 2%) wins and the next ad's eCPM is ₹350. Price A pays per click, in ₹?", answer: 17.5, tol: 0.05, explain: "350 / (0.02 × 1000) = 17.5.", py: "answer = 350/(0.02*1000)" });
Q({ id: "sd-ads-3", d: 3, secs: 90, prompt: "Log loss 0.09 at a background CTR of 2%. Normalised entropy? (3 decimals)", answer: 0.918, tol: 0.002, explain: "Entropy = −(0.02 ln 0.02 + 0.98 ln 0.98) = 0.0980; 0.09/0.0980 = 0.918.", py: "import math\np = 0.02\nH = -(p*math.log(p) + (1-p)*math.log(1-p))\nanswer = 0.09/H" });
Q({ id: "sd-ads-4", d: 1, secs: 30, prompt: "The model predicts 2,400 clicks in a segment and 2,000 occur. Calibration ratio (predicted ÷ observed)?", answer: 1.2, tol: 0.005, explain: "2,400 / 2,000 = 1.2: 20% over-prediction.", py: "answer = 2400/2000" });
C("sd-ads-c1", "Ad auction", "Rank by eCPM = bid × pCTR × 1000; GSP price = next eCPM ÷ (own pCTR × 1000).");
C("sd-ads-c2", "Why calibration in ads", "Prices and rankings use the probability itself; track NE and predicted/observed by segment.");

L("sd-autocomplete", SA, "Design query autocomplete", "Prefix candidates, fast ranking and safety filters for search suggestions on every keystroke.", {
  kind: "design", mins: 30, prereq: ["sd-search-rank"],
  hook: "Design search suggestions for a shopping app: 40M searches a day, a request on each keystroke, suggestions shown within 50 ms.",
  intuition: `
**Clarify.** Goals: save typing, steer users to queries that return good results, and lift search conversion. Constraints: very tight latency per keystroke, mobile networks, misspellings and transliterated Hindi, nothing offensive or legally risky, trends that appear within hours (a new phone launch, a festival). Personalisation is useful but light.

**Architecture in words.**

1. **Client:** debounce keystrokes (~100 ms), cache suggestions per prefix, cancel stale requests.
2. **Candidate generation:** an in-memory prefix structure (trie or finite-state transducer) built from cleaned historical queries, storing the top ~50 completions per prefix; fuzzy matching for typos; a fresh "trending" store updated every few minutes; the user's own recent queries.
3. **Ranking:** a light model reorders the ~50 candidates using popularity with time decay, conversion rate of the completed query, trend velocity, user history and context.
4. **Filters:** blocklists and a policy classifier on candidates, removal of queries with zero results.
5. **Offline pipeline:** aggregate query logs, drop rare and personal queries (privacy), rebuild the prefix index hourly or daily.
`,
  maths: `
**Traffic.** Debounced to ~6 requests per search: 40M × 6 = 240M requests/day ≈ 2,780 QPS average, ~8,300 at a 3× peak. Short prefixes (1–3 characters) are a tiny set and can be served from a CDN or edge cache.

**Index size.** Keep queries seen at least 5 times: say 10M queries × 25 bytes ≈ 250 MB of strings, plus top-k lists per prefix. Fits in memory on every serving node, so there are no network hops for candidates.

**Time decay.** Score = count × $0.5^{\\text{age}/h}$. 1,000 searches two days ago with a one-day half-life count as $1{,}000 \\times 0.25 = 250$; trends rise fast and fade fast.

**Keystrokes saved.** Average query 18 characters; on 40% of searches the user picks a suggestion after 6 characters: $0.4 \\times (18 - 6) = 4.8$ characters saved per search on average.

| Component | Method | Budget |
|---|---|---|
| Client debounce/cache | 100 ms debounce, prefix cache | 0 ms server |
| Candidates | trie/FST top-50 + fuzzy + trending + personal | 5 ms |
| Ranker | small GBDT | 5 ms |
| Filters | blocklist + policy classifier (precomputed) | 1 ms |
| Network | mobile round trip | 30–40 ms |
`,
  practice: `
**Data and labels.** Log each impression: prefix, suggestions shown with positions, and which one (if any) was selected, plus the final query and its downstream outcome (results clicked, purchase). Selected-suggestion is the label; position bias applies here too.

**Features.** Prefix–query match type (exact prefix, fuzzy, transliteration), global and segment popularity with decay, trend velocity, completed query's zero-result rate and conversion rate, user's own history and category affinity, location and time.

**Model.** Popularity ranking is the baseline; a small LambdaMART on ~50 candidates per prefix beats it while staying within a few milliseconds.

**Serving.** Replicated in-memory index on every node, versioned builds with atomic swaps, trending store refreshed every few minutes, personalisation merged at request time.

**Offline metrics.** MRR of the selected suggestion, success@k (final query appears in the top k), keystrokes saved.

**Online metrics.** Suggestion acceptance rate, keystrokes per search, search conversion, zero-result rate for searches that started from a suggestion, latency; guardrail on reports of offensive suggestions.

**Monitoring and failures.** Offensive or defamatory completions (blocklists, classifiers, human review of trending items), coordinated manipulation of trending (rate-limit by unique users, not raw counts), stale trends after an event, privacy leaks of rare personal queries (minimum-count thresholds).
`,
  traps: [
    { trap: "Rank completions by raw all-time frequency.", why: "Old popular queries crowd out new trends and seasonal intent. Use time decay and trend velocity." },
    { trap: "Every keystroke should hit the ranking service.", why: "Debounce on the client, cache short prefixes at the edge, and keep candidate lookup in memory; otherwise latency and cost explode." },
    { trap: "Show whatever users type most.", why: "Logs contain offensive, personal and manipulated queries. Apply minimum-count thresholds, blocklists and policy classifiers before anything is suggested." },
  ],
  say: {
    prompt: "How would you design search autocomplete?",
    secs: 60,
    check: ["Latency per keystroke drives design: debounce, client cache, in-memory prefix index", "Candidates from trie/FST, fuzzy match, trending and personal history", "Light ranker with decayed popularity, conversion of completed query, personalisation", "Safety: blocklists, classifier, minimum counts for privacy", "Metrics: MRR/success@k offline; acceptance, keystrokes saved, conversion online"],
    followups: [
      { q: "How do you handle typos in the prefix?", a: "Fuzzy matching with an edit-distance bound on the prefix structure, plus a learned spelling model for common errors and transliteration variants." },
      { q: "How quickly can a new trend appear?", a: "A streaming job counts recent queries by unique users and refreshes a trending store every few minutes; candidates from it merge with the static index at request time." },
      { q: "How do you stop people gaming trending suggestions?", a: "Count unique users or devices rather than raw requests, cap influence per account and IP, and require review for fast-rising new terms." },
    ],
    answer: `Latency dominates, so the client debounces and caches prefixes, and each server keeps an in-memory trie or FST of cleaned historical queries with the top 50 completions per prefix. Candidates also come from fuzzy matches, a trending store refreshed every few minutes, and the user's recent searches. A small GBDT reranks them using time-decayed popularity, the completed query's conversion and zero-result rate, trend velocity and the user's history, all in a few milliseconds.

Before anything is shown, blocklists, a policy classifier and minimum-count thresholds remove offensive, manipulated or private queries. I'd evaluate offline with MRR and success@k, and online with acceptance rate, keystrokes saved and search conversion, watching latency and offensive-suggestion reports as guardrails.`,
    avoid: ["No safety filtering", "Server round trip with heavy model per keystroke"],
  },
  terms: [["Trie", "Prefix tree: each node is a prefix, so all completions of a prefix sit beneath it."], ["FST", "Finite-state transducer: a compact prefix structure used by search engines."], ["Debounce", "Wait for a short pause in typing before sending a request."]],
  sources: [SD.lambdamart, SD.rules],
});
Q({ id: "sd-ac-1", d: 1, secs: 45, prompt: "40M searches/day, 6 suggestion requests per search after debouncing, 3× peak. Peak QPS? (nearest whole number)", answer: 8333, tol: 2, explain: "240M / 86,400 = 2,778; × 3 = 8,333.", py: "answer = 40e6*6/86400*3" });
Q({ id: "sd-ac-2", d: 1, secs: 45, prompt: "A query had 1,000 searches two days ago. With a one-day half-life, what is its decayed count?", answer: 250, tol: 0.5, explain: "1,000 × 0.5² = 250.", py: "answer = 1000*0.5**(2/1)" });
Q({ id: "sd-ac-3", d: 2, secs: 60, prompt: "Average query is 18 characters. On 40% of searches the user picks a suggestion after typing 6 characters; otherwise they type it all. Average characters saved per search?", answer: 4.8, tol: 0.01, explain: "0.4 × (18 − 6) = 4.8.", py: "answer = 0.4*(18-6)" });
C("sd-ac-c1", "Autocomplete stack", "Debounce + cache → in-memory trie/FST + trending + personal → small ranker → safety filters.");

L("sd-search-practice", SA, "Search and ads practice", "Six interview scenarios on search ranking, ads and suggestions.", {
  kind: "interview", mins: 30, prereq: ["sd-search-rank", "sd-ads-ctr", "sd-autocomplete"],
  hook: "Answer each out loud in about a minute, then open it and tick the points the interviewer listens for.",
}, [
  iq("Search conversion fell 3% the day after a new ranker launched, but offline NDCG had improved. How do you investigate?", "Check whether the drop is real (SRM, logging changes, a holiday), then slice by query segment (head vs tail, language, category), latency (did p99 rise and cause timeouts to fall back?), and training–serving skew (compare online feature values with training). Look at examples of queries where the ranking changed most. Roll back if a guardrail is breached while you investigate.", ["Validity checks first", "Slice by segment", "Latency/fallback", "Training–serving skew", "Inspect changed queries / roll back"]),
  iq("How would you add ads into organic search results without hurting users?", "Treat ads as candidates in a blended auction with a relevance threshold: only ads above a quality bar are eligible, the score combines eCPM with predicted user value, and the number and position of ad slots adapt per query. Guardrails: organic CTR, reformulation rate, session conversion. Run experiments on ad load.", ["Relevance threshold", "Blend eCPM with user value", "Adaptive ad load/positions", "User guardrails", "Experiment on ad load"]),
  iq("Your pCTR model's AUC improved but revenue dropped in the A/B test. Why might that happen?", "The new model may be less calibrated: probabilities shifted, changing eCPM rankings and second prices. It could over-predict for cheap ads or under-predict for high bidders. Check calibration by segment and NE, recalibrate, and check that pacing and reserve prices still behave.", ["Calibration vs ranking", "Prices depend on pCTR", "Segment calibration", "Recalibrate / NE"]),
  iq("How do you estimate the effect of position on clicks so you can debias search training data?", "Run small randomised experiments that swap results between adjacent positions (or randomise the top few) and compare CTR of the same item at different positions; fit an examination model. Then weight training clicks by inverse examination probability, or train with position as a feature fixed at serving.", ["Randomised swaps", "Examination propensity", "Inverse propensity weighting", "Position feature trick"]),
  iq("A seller complains that their listing never appears even for exact title searches. What could cause it?", "Indexing lag or failure, filters (stock, delivery pincode, category misclassification), spam or quality classifiers demoting it, dedup collapsing it into another listing, or low behavioural features as a new item. Debug by tracing the query through each stage and checking where the item drops out.", ["Index/freshness", "Filters/classification", "Quality or dedup demotion", "Cold start", "Trace through stages"]),
  iq("How would you design learning-to-rank labels when you have both human ratings and click logs?", "Use human ratings as the trustworthy but small set for evaluation and for tail queries; use debiased behavioural labels (graded by purchase, cart, click) for scale. Train on behaviour, evaluate on both, and check they agree; distil a cross-encoder trained on ratings into the production ranker.", ["Ratings: small, unbiased", "Clicks: large, biased", "Graded labels", "Evaluate on both", "Distillation option"]),
]);

// ───────────────────────── Fraud and risk ─────────────────────────

L("sd-card-fraud", FR, "Design real-time card and UPI fraud detection", "Streaming features, cost-based thresholds and delayed labels for payment fraud.", {
  kind: "design", mins: 35, prereq: ["sd-frame", "cml-roc-pr"],
  hook: "Score every card and UPI payment for fraud on a payments app doing 50M transactions a day, with a fraud rate of about 0.05%. The decision must be made inline in under 100 ms.",
  intuition: `
**Clarify.** What decisions can we take: approve, decline, step-up (extra OTP or PIN challenge), or hold for review? Who bears the loss: issuer, merchant or customer? Trade-off: fraud loss against friction for genuine users (false declines lose sales and trust). Latency: the payment authorisation path allows ~100 ms total, so the model gets ~20 ms. Labels: chargebacks arrive weeks later; UPI fraud often comes as customer complaints, and many scams are authorised by the genuine user (social engineering), so payee-side signals matter. Attackers adapt within days.

**Architecture in words.**

1. **Event stream:** every payment attempt enters a stream (Kafka).
2. **Real-time features:** a streaming job (Flink) maintains velocity counts and aggregates per card, device, account, payee and IP over sliding windows (1 minute to 30 days), written to an online feature store.
3. **Rules engine:** hard blocks (known bad devices, sanctioned accounts), regulatory checks, and fast reactive rules for new attacks.
4. **Model:** a gradient-boosted tree model scores the transaction using real-time, profile and graph features (shared devices, mule-account clusters computed in near real time).
5. **Decision policy:** thresholds per segment and amount, set from costs: approve, step-up, review or decline.
6. **Case management and labels:** analysts review queued cases; confirmed outcomes, chargebacks and complaints flow back as labels.
`,
  maths: `
**Traffic.** 50M/day ÷ 86,400 = 579 TPS average; salary days and festival sales can reach 5× ≈ 2,900 TPS.

**Fraud volume.** 0.05% × 50M = 25,000 fraudulent transactions per day; a random split puts only a few thousand positives in a test set, so use weeks of data.

**Cost-based threshold.** Decline when $p \\cdot C_{FN} > (1 - p) \\cdot C_{FP}$, i.e. $p^* = C_{FP} / (C_{FP} + C_{FN})$. False decline costs ₹50 (lost margin and goodwill); missed fraud costs ₹5,000: $p^* = 50/5{,}050 = 0.0099$. Thresholds therefore depend on amount: higher-value payments get lower thresholds.

**Precision at a working point.** Flag 0.5% of transactions (250,000/day) and catch 80% of fraud (20,000): precision = 20,000/250,000 = 8%. Step-up authentication rather than outright decline keeps the friction cost of those false positives low.

**Review capacity.** 200 analysts × 300 cases/day = 60,000 reviews/day, so only the highest-risk, highest-value slice can go to humans.

| Component | Technology / model | Budget | Notes |
|---|---|---|---|
| Stream + features | Kafka, Flink, online store | 10 ms read | velocity, windows |
| Rules | rules engine | 2 ms | hard blocks, fast response |
| Model | GBDT (plus graph features) | 15 ms | calibrated score |
| Policy | cost-based thresholds by segment | 1 ms | approve/step-up/review/decline |
| Case management | analyst queue | async | labels, rule ideas |
`,
  practice: `
**Data and labels.** Positives: chargebacks, confirmed fraud reports, analyst-confirmed cases. Labels mature slowly, so train on transactions old enough for most fraud to be reported (e.g. 60+ days) and use faster proxies (customer disputes, analyst decisions) for monitoring. Declined transactions have no outcome: the model censors its own labels. Keep a small, carefully bounded random sample of medium-risk payments that are stepped up rather than blocked, or reviewed, to learn what would have happened.

**Features.** Velocity (payments in the last minute/hour per card, device, payee), amount relative to the user's history, new payee or new device, time since last password/SIM change, geolocation and IP risk, merchant category and merchant risk embeddings, device fingerprint consistency, graph features (how many accounts share this device or beneficiary; payee account age and inbound flow pattern for mule detection).

**Models.** GBDT is the workhorse for tabular data; retrain weekly or faster; anomaly detection for unseen patterns; rules for known attacks with quick deployment. Calibrate scores so thresholds map to costs.

**Serving.** Feature reads under 10 ms; model under 20 ms at p99; if the model times out, fall back to rules, failing open for small low-risk payments and closed for large high-risk ones.

**Offline metrics.** PR-AUC (not ROC-AUC alone, given 0.05% positives), recall at a fixed false-positive rate, value-weighted recall (₹ of fraud caught), calibration. Always use out-of-time validation.

**Online metrics.** Fraud loss in basis points of volume, false-decline rate, step-up rate and step-up completion, customer complaints. Champion–challenger on a slice of traffic; label delay means early reads use proxies.

**Monitoring.** Score distributions, feature drift and null rates, rule hit rates, sudden spikes by merchant or region (attack waves), analyst queue size.

**Failure modes.** Adversarial adaptation (fraudsters probe thresholds with small amounts), label delay hiding a degraded model, authorised push-payment scams where all user-side signals look normal, mule networks, and outages in the feature pipeline.
`,
  traps: [
    { trap: "99.95% accuracy shows the model is excellent.", why: "Predicting \"not fraud\" for everything scores 99.95%. Use PR-AUC, recall at fixed FPR and value-weighted loss." },
    { trap: "Validate with a random train/test split.", why: "Fraud patterns drift and features leak across time. Use out-of-time splits that mimic deployment." },
    { trap: "Blocked transactions were fraud, so label them positive.", why: "Blocked payments have no observed outcome; treating them as fraud reinforces the model's own mistakes. Use confirmed labels and small exploration samples." },
  ],
  say: {
    prompt: "Summarise your real-time payment fraud design.",
    secs: 75,
    check: ["Decisions (approve/step-up/review/decline) and cost trade-off: fraud loss vs false declines", "Streaming velocity and graph features in an online store within a tight latency budget", "Rules + GBDT, cost-based thresholds per segment/amount", "Delayed and censored labels; out-of-time validation; PR-AUC and value-weighted recall", "Monitoring for drift and attacks; fallbacks; champion–challenger"],
    followups: [
      { q: "How do you set the decline threshold?", a: "From the costs: decline when p > C_FP/(C_FP + C_FN), with C_FN tied to the amount, so thresholds fall as amounts rise; then tune with analyst capacity and step-up options." },
      { q: "How do you detect money mules?", a: "Graph features on payee accounts: account age, many unrelated payers, rapid inbound-then-outbound flows, shared devices with known mules; community detection on the payment graph run near real time." },
      { q: "How do you react to a new attack within hours?", a: "Analysts add targeted rules through the rules engine with immediate deployment, while labelled cases feed the next model retrain; monitoring by merchant and region spots the spike." },
    ],
    answer: `Every payment flows through a stream where a Flink job keeps velocity and profile aggregates per card, device, account and payee, plus graph features for mule detection, in an online store. Inline, within about 20 ms, a rules engine applies hard blocks and a calibrated gradient-boosted model scores the transaction. A policy turns the score into approve, step-up, review or decline, using cost-based thresholds that drop as the amount rises.

Labels come from chargebacks, fraud reports and analyst decisions; they are delayed and censored by our own declines, so I train on mature data, validate out of time, and keep small exploration samples. I'd judge models on PR-AUC, recall at a fixed false-positive rate and rupees of fraud caught, and track fraud loss in basis points against false declines online, with drift and attack-spike monitoring and rule-based fallbacks.`,
    avoid: ["Quoting accuracy", "Random splits"],
  },
  terms: [["Velocity feature", "Count or sum of events for an entity over a recent window."], ["Step-up authentication", "Extra verification (OTP, PIN) instead of a hard decline."], ["Money mule", "Account used to receive and move fraudulent funds."], ["Chargeback", "Reversal of a card payment disputed by the cardholder."]],
  sources: [SD.radar, SD.calib, SD.rules],
});
Q({ id: "sd-frd-1", d: 2, secs: 60, prompt: "False decline cost ₹50, missed fraud cost ₹5,000. Decline when p exceeds C_FP/(C_FP + C_FN). Threshold? (4 decimals)", answer: 0.0099, tol: 0.0002, explain: "50/5,050 = 0.0099.", py: "answer = 50/(50+5000)" });
Q({ id: "sd-frd-2", d: 1, secs: 45, prompt: "You flag 250,000 transactions a day and 20,000 of them are fraud. Precision?", answer: 0.08, tol: 0.001, explain: "20,000/250,000 = 0.08.", py: "answer = 20000/250000" });
Q({ id: "sd-frd-3", d: 1, secs: 45, prompt: "50M transactions a day with a 5× peak factor. Peak transactions per second? (nearest whole number)", answer: 2894, tol: 2, explain: "50e6/86,400 = 578.7; × 5 = 2,894.", py: "answer = 50e6/86400*5" });
Q({ id: "sd-frd-4", d: 2, secs: 60, prompt: "Scores: fraud cases [0.9, 0.7, 0.4], genuine cases [0.8, 0.3, 0.2, 0.1]. Average precision (area under PR curve, sklearn definition)? (3 decimals)", answer: 0.806, tol: 0.002, explain: "Ranked: F, G, F, F, … Precision at each fraud: 1, 2/3, 3/4; mean = 0.806.", py: "import numpy as np\ny = [1,1,1,0,0,0,0]; s = [0.9,0.7,0.4,0.8,0.3,0.2,0.1]\no = np.argsort(s)[::-1]; ys = np.array(y)[o]\nhits = np.cumsum(ys)\nanswer = float(np.mean([hits[i]/(i+1) for i in range(len(ys)) if ys[i]]))", packages: ["numpy"] });
C("sd-frd-c1", "Fraud threshold", "Decline if p > C_FP/(C_FP + C_FN); C_FN grows with amount, so thresholds fall for large payments.");
C("sd-frd-c2", "Fraud label problems", "Delayed (chargebacks), censored (declines have no outcome), adversarial drift.");

L("sd-credit-decision", FR, "Design NBFC credit decisioning and limit setting", "Scorecards, affordability, reject inference and monitoring for instant lending decisions.", {
  kind: "design", mins: 40, prereq: ["sd-frame", "cml-roc-pr"],
  hook: "Design instant credit decisioning for a digital NBFC: 200,000 applications a month for small unsecured loans. Decide approve or decline, the loan limit and the price within two minutes.",
  intuition: `
**Clarify.** Product (unsecured personal loans of ₹10k–₹2 lakh, or microfinance group loans), the decisions (approve/decline, limit, tenure, rate), the objective (expected profit, or minimum loss at a target approval rate), and the label: "bad" = 90+ days past due within 12 months on book. Data: credit bureau report, bank statements through the Account Aggregator framework, application and KYC data. Regulation: reasons for decline must be explainable, data must be consent-based, limits cannot be raised automatically without the borrower's consent, fair treatment across groups. Latency: bureau and AA calls take seconds, so the budget is minutes, not milliseconds.

**Architecture in words.**

1. **KYC and fraud checks:** identity verification, device and application-fraud signals, duplicate and synthetic-identity checks.
2. **Policy rules:** hard knock-outs (age, recent write-offs, too many recent enquiries, negative pincodes) applied before any model.
3. **Application scorecard:** a probability-of-default (PD) model on bureau, bank-statement and application features.
4. **Risk bands and cut-off:** PD maps to bands; the cut-off comes from the profit curve and risk appetite.
5. **Limit and pricing:** limit = minimum of affordability (income minus existing obligations), a PD-based exposure cap and the product cap; rate by band.
6. **Decision service:** returns the decision with reason codes, logs everything for audit, and supports champion–challenger splits.
7. **Lifecycle:** a behavioural scorecard on repayment data later drives limit increases (with consent) and early collections.
`,
  maths: `
**Expected loss.** $EL = PD \\times LGD \\times EAD$. PD 4%, LGD 65%, EAD ₹50,000: ₹1,300. A loan is worth making if expected interest and fees exceed EL plus funding and operating costs.

**Affordability limit (FOIR).** Monthly income ₹30,000, existing EMIs ₹6,000, maximum fixed-obligation-to-income ratio 50%: room for ₹9,000 EMI. At 2% a month over 24 months the loan supported is
$$P = \\text{EMI} \\times \\frac{1 - (1 + r)^{-n}}{r} = 9{,}000 \\times 18.91 = ₹1{,}70{,}225.$$

**Scorecard scaling.** Points $= \\text{offset} + \\text{factor} \\times \\ln(\\text{odds})$ with factor $= \\text{PDO}/\\ln 2$; with 20 points to double the odds, factor = 28.85.

**Discrimination.** Gini $= 2\\,\\text{AUC} - 1$: AUC 0.75 → Gini 0.50. KS is the largest gap between cumulative good and bad distributions.

**Stability.** Population stability index $\\text{PSI} = \\sum (a_i - e_i) \\ln(a_i/e_i)$ over score bands. Expected shares (25%, 25%, 25%, 25%) vs actual (20%, 25%, 30%, 25%): PSI = 0.020 (below 0.1 is usually treated as stable, above 0.25 as a significant shift).

| Component | Method | Output |
|---|---|---|
| KYC / fraud | verification APIs, device and identity checks | pass / refer |
| Policy rules | knock-out rules | eligible or decline reason |
| Scorecard | WoE logistic regression (champion), monotone GBDT (challenger) | calibrated PD + reason codes |
| Cut-off | profit curve by band | approve / decline |
| Limit & price | min(FOIR capacity, PD cap, product cap); rate by band | offer |
| Monitoring | PSI/CSI, vintages, roll rates | alerts, recalibration |
`,
  practice: `
**Data and labels.** Observation point = application date; performance window = 12 months; bad = 90+ DPD (or written off, or restructured) within the window. Use vintages so every loan has a full window. Only approved applicants have outcomes, so the training data is biased: use reject inference (bureau outcomes of rejected applicants on loans taken elsewhere, parcelling) and, within risk appetite, small randomised approvals just below the cut-off to learn the true bad rate there.

**Features.** Bureau: enquiries in the last 3/6 months, credit utilisation, past delinquency, age of oldest account, number of active unsecured loans. Bank statements: income level and stability, bounced EMIs, average balance, salary regularity. Application: employment type, tenure at job and address. For microfinance: group and centre repayment history, field-officer data, overlapping lender count (over-indebtedness). Avoid proxies for protected traits and check pincode effects for fairness.

**Models.** Logistic regression on weight-of-evidence bins is the usual champion: stable, monotone, easy to explain and to turn into reason codes. A monotone-constrained GBDT as challenger often gains a few Gini points; explain it with SHAP-based reason codes. Calibrate PD to observed bad rates by band.

**Serving.** A decision engine orchestrates bureau and AA calls with retries, applies rules and models, and logs inputs, versions and outputs for audit. Fall back to manual underwriting if a data source is down.

**Offline metrics.** AUC/Gini, KS, calibration by band, rank ordering of bad rate across bands, stability across vintages and segments, approval rate at the cut-off.

**Online metrics.** Approval rate, early delinquency as a leading indicator (first-payment default, 30+ DPD at 3 months on book), then vintage loss curves; champion–challenger on a random share of applications; fairness metrics by segment.

**Monitoring.** PSI on the score and characteristic stability (CSI) on inputs, roll rates between buckets, bad rate by band versus expected, bureau data format changes.

**Failure modes.** Macro or local shocks (pandemic, floods in a lending region), fraud rings causing first-payment defaults, borrowers taking loans from many lenders at once, label drift from collections policy changes, and over-reliance on one data source.
`,
  traps: [
    { trap: "The model is unbiased because it was validated on a holdout.", why: "The holdout contains only approved applicants. Performance on the full through-the-door population is unknown without reject inference or randomised approvals." },
    { trap: "Set the limit from PD alone.", why: "Low PD doesn't mean the borrower can afford a large EMI. Limits need an affordability check (income minus obligations) as well as a risk cap." },
    { trap: "Use the most accurate black-box model.", why: "Lenders need reason codes, stability and regulator review. Prefer a scorecard or a monotone GBDT with explanations, and compare gains honestly." },
  ],
  say: {
    prompt: "Walk me through an instant credit decisioning system for an NBFC.",
    secs: 90,
    check: ["Clear label (90+ DPD in 12 months), performance window and objective (profit/loss vs approval)", "Pipeline: KYC/fraud → policy rules → PD scorecard → cut-off → limit and price", "Limit = min(affordability via FOIR, PD-based cap, product cap)", "Reject inference / randomised approvals for selection bias; explainable models with reason codes", "Monitoring: PSI/CSI, early delinquency, vintages; champion–challenger"],
    followups: [
      { q: "What is reject inference?", a: "Estimating outcomes for rejected applicants, who have no repayment data with us, so the model is trained on the whole applicant population: using their bureau performance elsewhere, parcelling them into good/bad by score, or small randomised approvals." },
      { q: "How would you choose the cut-off?", a: "Plot expected profit (interest and fees minus expected loss and costs) and approval rate against score; choose the band that maximises profit within risk appetite and capital limits, and review with business and risk teams." },
      { q: "How do you know the model is degrading before 12-month labels arrive?", a: "Monitor PSI/CSI on inputs and scores, and early-delinquency indicators such as first-payment default and 30+ DPD at three months on book by score band versus expectations." },
    ],
    answer: `I'd define bad as 90+ days past due within 12 months and aim for maximum expected profit at an agreed risk appetite. An application first goes through KYC and fraud checks and hard policy rules, then a PD scorecard built on bureau, bank-statement and application features, usually a weight-of-evidence logistic regression with a monotone GBDT challenger, both calibrated and producing reason codes. The PD maps to a band, the cut-off comes from the profit curve, and the limit is the minimum of what the borrower can afford, using a FOIR cap on EMIs, a PD-based exposure cap and the product cap. The rate is priced by band.

Because we only see outcomes for approved loans, I'd use reject inference and small randomised approvals near the cut-off. I'd validate on Gini, KS and calibration by band across vintages, launch through champion–challenger, and monitor PSI, early delinquency and vintage curves, with limit increases later driven by a behavioural score and the borrower's consent.`,
    avoid: ["No label definition or performance window", "Ignoring selection bias from past approvals"],
  },
  terms: [["PD / LGD / EAD", "Probability of default, loss given default, exposure at default."], ["FOIR", "Fixed obligations to income ratio: share of income already committed to EMIs."], ["WoE", "Weight of evidence: log ratio of good to bad share in a bin."], ["PSI", "Population stability index: shift between expected and actual distributions."], ["Vintage", "Cohort of loans booked in the same period, tracked over time."]],
  sources: [SD.calib, SD.rules, SD.debt],
});
Q({ id: "sd-cr-1", d: 1, secs: 30, prompt: "PD 4%, LGD 65%, EAD ₹50,000. Expected loss in ₹?", answer: 1300, tol: 0.5, explain: "0.04 × 0.65 × 50,000 = 1,300.", py: "answer = 0.04*0.65*50000" });
Q({ id: "sd-cr-2", d: 3, secs: 120, prompt: "Income ₹30,000/month, existing EMIs ₹6,000, FOIR cap 50%. At 2% per month for 24 months, what loan principal does the spare EMI support? (nearest ₹)", answer: 170225, tol: 50, explain: "EMI room = 15,000 − 6,000 = 9,000; P = 9,000 × (1 − 1.02⁻²⁴)/0.02 = 1,70,225.", py: "emi = 0.5*30000 - 6000\nr, n = 0.02, 24\nanswer = emi*(1-(1+r)**-n)/r" });
Q({ id: "sd-cr-3", d: 2, secs: 90, prompt: "Expected score-band shares (0.25, 0.25, 0.25, 0.25), actual (0.20, 0.25, 0.30, 0.25). PSI = Σ(a − e)·ln(a/e)? (4 decimals)", answer: 0.0203, tol: 0.0002, explain: "(−0.05)·ln 0.8 + 0 + 0.05·ln 1.2 + 0 = 0.0112 + 0.0091 = 0.0203.", py: "import numpy as np\ne = np.full(4, 0.25); a = np.array([0.20,0.25,0.30,0.25])\nanswer = float(np.sum((a-e)*np.log(a/e)))", packages: ["numpy"] });
Q({ id: "sd-cr-4", d: 1, secs: 30, prompt: "A scorecard has AUC 0.75. Gini coefficient?", answer: 0.5, tol: 0.005, explain: "Gini = 2 × 0.75 − 1 = 0.5.", py: "answer = 2*0.75 - 1" });
C("sd-cr-c1", "Credit decision pipeline", "KYC/fraud → policy rules → PD scorecard → cut-off by profit → limit = min(affordability, PD cap, product cap) → price.");
C("sd-cr-c2", "Credit monitoring", "PSI/CSI on score and inputs; early delinquency (FPD, 30+ at 3 MOB); vintage curves; bad rate by band.");

L("sd-collections", FR, "Design collections prioritisation", "Uplift-based allocation of calls, messages and field visits under capacity and conduct rules.", {
  kind: "design", mins: 35, prereq: ["sd-credit-decision", "sd-notifications"],
  hook: "An NBFC has 300,000 accounts 1–30 days past due each month and 400 collection agents. Decide whom to contact, through which channel, and when.",
  intuition: `
**Clarify.** Goal: maximise amount recovered and reduce roll-forward into later buckets, net of contact cost, within agent capacity. Channels: SMS/WhatsApp reminders, automated voice calls, human calls, field visits, restructuring offers. Conduct rules: calls only within permitted hours (8 am–7 pm), no harassment or threats, contact only the borrower, record calls, handle hardship fairly. Data refresh: payments post daily or intraday.

**The key idea.** Prioritise by **incremental** recovery, not by risk. Many early-bucket borrowers pay anyway (they missed a salary date), so calling them wastes capacity; some will not pay whatever you do. The best targets are accounts where contact changes the outcome, weighted by the amount at stake.

**Architecture in words.**

1. **Daily snapshot:** delinquent accounts with balances, DPD, history and contactability.
2. **Models:** P(cure without contact), P(cure | channel) for each channel, best time to reach, P(complaint).
3. **Value per action:** expected incremental recovery = balance × uplift − channel cost.
4. **Allocation:** assign the best action per account subject to agent and field capacity (greedy by value per unit of capacity, or a linear programme), with conduct constraints.
5. **Execution:** queues to the dialler, voice bot and field app; payments remove accounts from queues in near real time.
6. **Learning loop:** randomised holdouts per channel measure uplift; outcomes (promise to pay, payment) retrain models.
`,
  maths: `
**Incremental value.** Account A: balance ₹40,000, P(cure | call) 0.55 vs 0.45 without: $40{,}000 \\times 0.10 = ₹4{,}000$. Account B: ₹10,000, 0.60 vs 0.20: also ₹4,000. Account C: ₹60,000, 0.30 vs 0.28: ₹1,200, despite the largest balance.

**Capacity.** 400 agents × 80 dial attempts/day × 22 working days = 704,000 attempts/month; at a 40% connect rate that is ~281,600 conversations for 300,000 accounts, so channel mix matters: cheap digital nudges for likely self-cures, humans where uplift is large.

**Roll rate.** A ₹150 crore bucket rolling forward at 20% means ₹30 crore moves to the next bucket; cutting the roll rate to 17% keeps ₹4.5 crore back.

| Component | Method | Cadence |
|---|---|---|
| Snapshot + features | warehouse batch + payment stream | daily, intraday updates |
| Self-cure / cure models | GBDT per channel | daily scoring |
| Uplift | T-/X-learner on randomised holdouts | retrain monthly |
| Time-to-contact | contact propensity by hour | daily |
| Allocation | greedy or LP under capacity and rules | daily |
| Execution | dialler, voice bot, field app | real time |
`,
  practice: `
**Data and labels.** Outcome per account-cycle: cured (back to current) within the cycle, amount paid in 30 days, promise to pay kept. Past contact decisions were not random (high-risk accounts were always called), so historical data confounds uplift: keep randomised holdouts by channel (e.g. 5% of accounts get only SMS) to learn and measure incremental effect.

**Features.** DPD and bucket history, payment patterns (always pays on day 5 after salary), EMI-to-income, past promises and whether they were kept, contactability (number valid, best answer hour, language), channel responsiveness, bureau signals (new loans elsewhere, other delinquencies), for group loans the centre's repayment behaviour.

**Models.** GBDT for cure probabilities, uplift models per channel, a contact-time model; simple and explainable enough for operations teams to trust.

**Serving.** Batch scoring early each morning, queue generation, intraday removal of paid accounts, and agent apps that show the reason for each assignment.

**Offline metrics.** Qini/uplift curves on randomised data, AUC and calibration for cure models, simulated recovery under capacity.

**Online metrics.** Recovered amount per rupee of collection cost, roll rates and cure rates by bucket, PTP kept rate, complaints and conduct breaches (hard guardrails, target zero), customer hardship referrals. A/B with account-level randomisation.

**Monitoring.** Score drift, queue sizes versus capacity, connect rates, agent-level outcomes, payment-posting lags.

**Failure modes.** Calling customers who already paid because of posting lags, conduct violations, ignoring genuine hardship (offer restructuring or a pause), agents cherry-picking easy accounts, and models learning the old policy's biases.
`,
  traps: [
    { trap: "Call the highest-risk accounts first.", why: "Risk is not responsiveness. Some high-PD accounts won't pay whatever you do, and low-risk ones self-cure. Rank by balance × uplift − cost." },
    { trap: "More contact attempts always recover more.", why: "Beyond a point they add cost, complaints and regulatory risk with little gain. Cap attempts and respect conduct rules." },
    { trap: "Learn uplift from last year's logs.", why: "Who got called was decided by the old policy, so outcomes are confounded. Use randomised holdouts." },
  ],
  say: {
    prompt: "How would you prioritise collections for early-delinquency accounts?",
    secs: 75,
    check: ["Objective: incremental recovery net of cost under capacity, plus conduct rules", "Uplift per channel (self-cure vs contacted), not raw PD", "Allocation optimisation across channels with capacity constraints", "Randomised holdouts to learn and measure uplift", "Metrics: recovery per cost, roll/cure rates, complaints as hard guardrails"],
    followups: [
      { q: "How do you pick the channel for each account?", a: "Estimate uplift and cost per channel, compute value per unit of scarce capacity, assign the best feasible channel; cheap digital nudges for likely self-cures, human calls or field visits where uplift × balance is high." },
      { q: "What if a borrower says they've lost their job?", a: "Route to a hardship process with a human: restructuring, payment holidays or reduced EMIs within policy. Record it so automated contact pauses." },
      { q: "How do you stop calling people who already paid?", a: "Stream payment events to remove accounts from queues intraday, refresh the dialler list before each session, and reconcile posting lags with payment gateways." },
    ],
    answer: `The goal is the most incremental recovery per rupee of contact cost, within agent capacity and conduct rules. Each morning I'd score every delinquent account for its chance of curing with no contact and with each channel: SMS, voice bot, human call, field visit. The value of an action is balance times uplift minus cost, and an allocator assigns the best feasible action per account under capacity, so self-curers get a nudge and humans go where they change outcomes. A contact-time model picks when to call within permitted hours.

Because past contacts weren't random, I'd learn uplift from randomised holdouts by channel. Success is recovered amount per cost and lower roll rates, with complaints and conduct breaches as hard guardrails, and payments stream in to clear queues intraday.`,
    avoid: ["Ranking purely by PD or balance", "No randomised holdout"],
  },
  terms: [["Roll rate", "Share of balance moving from one delinquency bucket to the next."], ["Cure", "Delinquent account returning to current."], ["PTP", "Promise to pay: a committed payment date from the borrower."], ["DPD", "Days past due."]],
  sources: [SD.kohavi, SD.rules],
});
Q({ id: "sd-col-1", d: 1, secs: 45, prompt: "Balance ₹60,000, P(cure | call) 0.30, P(cure | no call) 0.28. Expected incremental recovery from calling, in ₹?", answer: 1200, tol: 0.5, explain: "60,000 × 0.02 = 1,200.", py: "answer = 60000*(0.30-0.28)" });
Q({ id: "sd-col-2", d: 1, secs: 45, prompt: "400 agents × 80 attempts/day × 22 days, 40% connect rate. Connected conversations per month?", answer: 281600, tol: 1, explain: "704,000 × 0.4 = 281,600.", py: "answer = 400*80*22*0.4" });
Q({ id: "sd-col-3", d: 2, secs: 60, prompt: "Accounts with (balance ₹, uplift): (40,000, 0.10), (10,000, 0.40), (60,000, 0.02), (25,000, 0.12), (80,000, 0.03). Each call costs ₹30. You can call two. Total expected net value of the best two, in ₹?", answer: 7940, tol: 1, explain: "Net values 3,970, 3,970, 1,170, 2,970, 2,370; top two = 7,940.", py: "acc = [(40000,0.10),(10000,0.40),(60000,0.02),(25000,0.12),(80000,0.03)]\nv = sorted((b*u - 30 for b,u in acc), reverse=True)\nanswer = v[0] + v[1]" });
Q({ id: "sd-col-4", d: 1, secs: 30, prompt: "A ₹150 crore bucket's roll rate drops from 20% to 17%. How many ₹ crore fewer roll forward?", answer: 4.5, tol: 0.01, explain: "150 × 0.03 = 4.5.", py: "answer = 150*(0.20-0.17)" });
C("sd-col-c1", "Collections value", "Action value = balance × (P(cure | action) − P(cure | none)) − cost; allocate under capacity.");

L("sd-risk-practice", FR, "Fraud and risk practice", "Six interview scenarios on fraud, credit and collections systems.", {
  kind: "interview", mins: 30, prereq: ["sd-card-fraud", "sd-credit-decision", "sd-collections"],
  hook: "Answer each out loud in about a minute, then open it and tick the points the interviewer listens for.",
}, [
  iq("Your fraud model's precision at the current threshold has dropped from 10% to 5% in two weeks. What do you check?", "Whether fraud prevalence changed (precision falls when base rate falls, even with the same model), score distribution and feature drift, pipeline breaks (null or stale velocity features), a new merchant or region driving false positives, and label delay (recent fraud not yet reported, so precision looks lower). Compare by segment and with the champion model.", ["Base-rate effect", "Feature/pipeline issues", "Segment analysis", "Label delay", "Compare with champion"]),
  iq("How would you design features to catch UPI scams where the genuine user authorises the payment?", "User-side signals look normal, so focus on context and payee: first-time payee, payee account age and inbound pattern, mule-network graph features, unusual amount for the user, payment shortly after an inbound call or a new device login, remarks text, and requests that are collect-request driven. Add friction such as warnings for risky first-time payees.", ["Payee-side features", "Graph/mule signals", "Behavioural context", "Targeted friction/warnings"]),
  iq("The business wants to raise the approval rate from 40% to 50% without increasing losses. How do you approach it?", "Find better-separating data (bank statements via Account Aggregator, alternative data) and a stronger model to rank the marginal applicants; estimate their bad rates using reject inference and small randomised approvals; use smaller starting limits and pricing for the new band, then grow limits with behaviour. Track early delinquency closely.", ["Better data/model", "Learn marginal bad rate", "Limit/pricing as levers", "Monitor early delinquency"]),
  iq("Explain how you'd validate a new credit scorecard before launch.", "Out-of-time validation on a later vintage; Gini/KS; calibration and bad-rate rank ordering by band; stability (PSI) versus the development sample; segment and fairness checks; comparison against the champion on the same applicants (swap-set analysis: who gets approved or declined differently); reason-code sanity; sign-off from risk and compliance; champion–challenger on a slice.", ["Out-of-time", "Discrimination and calibration", "Stability/PSI", "Swap-set analysis", "Governance + champion–challenger"]),
  iq("In microfinance group lending, what extra risks and features would you consider?", "Joint liability within groups, centre-level repayment culture, field officer quality, overlapping lenders and over-indebtedness, local shocks (crop failure, floods) that hit whole areas at once, and borrower income seasonality. Features at group, centre and branch level; monitoring concentration by geography.", ["Group/centre effects", "Over-indebtedness", "Correlated local shocks", "Seasonality", "Geographic concentration"]),
  iq("How do label definitions affect your fraud or credit model, and how do you pick one?", "The label decides what the model learns: 30+ vs 90+ DPD, 6 vs 12 months, confirmed fraud vs any dispute. Short windows give faster feedback but noisier labels; long windows match losses but delay learning. Choose with business owners based on what drives loss, check roll rates to see if early labels predict later ones, and keep it fixed across model versions for comparability.", ["Label shapes model", "Speed vs accuracy trade-off", "Roll-rate check", "Business alignment and consistency"]),
]);

// ───────────────────────── LLM apps and RAG systems ─────────────────────────

L("sd-rag-enterprise", LA, "Design enterprise RAG over internal documents", "Ingestion, permission-aware hybrid retrieval, cited generation and evaluation for a company knowledge assistant.", {
  kind: "design", mins: 40, prereq: ["sd-frame", "ai-rag-e2e"],
  hook: "Design an assistant that answers employees' questions over 2 million internal documents (policies, wikis, PDFs, slide decks), with citations and existing access controls respected.",
  intuition: `
**Clarify.** Users and questions: policy lookups ("What is the travel allowance for Pune?"), how-to guides, multi-document synthesis. Corpus: 2M documents, mixed formats, thousands updated daily. Access control: each document has an ACL and the assistant must never reveal content the user can't open. Quality: answers grounded in sources with citations; say "I don't know" rather than guess. Latency: first token within ~2 s. Cost and data residency constraints.

**Architecture in words.**

*Ingestion (offline, incremental):*
1. Connectors to document stores with change feeds; deletions honoured.
2. Parsing: PDF text and layout, tables to structured text, OCR for scans, slide notes.
3. Chunking along structure (headings, sections, ~300–800 tokens with small overlap), carrying title, section path, date, owner and ACL as metadata.
4. Indexing: dense embeddings in a vector index plus a BM25 index, both filterable by ACL and metadata.

*Query path (online):*
1. Rewrite the question using conversation history into a standalone query; optionally expand.
2. Hybrid retrieval with an ACL pre-filter; fuse rankings with reciprocal rank fusion (RRF).
3. Cross-encoder reranking of the top ~50 to the best ~8 chunks; prefer newer versions of the same policy.
4. Generation with instructions to answer only from the provided chunks and cite them; abstain if they don't answer.
5. Post-checks: citations point to retrieved chunks, groundedness check, PII filters. Stream the answer with links.
`,
  maths: `
**Corpus size.** 2M docs × 5 pages × 500 tokens = $5 \\times 10^9$ tokens; at 500 tokens per chunk that is $10^7$ chunks.

**Vector storage.** $10^7$ × 1,024 dims × 4 bytes = 41 GB in fp32 (20 GB in fp16; less with quantisation). One-off embedding cost at $0.02 per million tokens: 5,000 × 0.02 = $100; re-embedding daily changes is cheap.

**Query cost.** Prompt = 8 chunks × 500 + 500 instructions = 4,500 input tokens, ~400 output. At $3 per million input and $15 per million output: $0.0135 + 0.006 = $0.0195$ per query. 5,000 employees × 6 queries/day = 30,000 queries → ~$585/day. Load is only a few QPS at peak, so latency, not throughput, drives the design.

**Reciprocal rank fusion.** $\\text{RRF}(d) = \\sum_r 1/(k + \\text{rank}_r(d))$ with $k = 60$. A chunk ranked 1st by dense and 3rd by BM25: $1/61 + 1/63 = 0.0323$.

**Latency budget (first token ~2 s).** Rewrite 300 ms, retrieval 150 ms, rerank 200 ms, LLM time to first token 800 ms, overhead 300 ms.

| Component | Choice | Notes |
|---|---|---|
| Parsing | layout-aware PDF parser, OCR, table extraction | biggest quality lever |
| Chunking | structure-aware, 300–800 tokens, metadata | keep section titles |
| Retrieval | BM25 + dense, ACL pre-filter, RRF | hybrid beats either alone |
| Rerank | cross-encoder top 50 → 8 | precision at the top |
| Generation | instructed to cite and abstain | short context, best chunks first |
| Checks | citation validity, groundedness, PII | block or flag |
`,
  practice: `
**Data and labels.** A golden set of a few hundred real questions with the correct source chunks and reference answers written with subject experts; synthetic questions generated from chunks to widen coverage; production logs with thumbs up/down and follow-up rephrasings.

**Retrieval evaluation.** Recall@k and MRR against gold chunks, per document type and department. Most RAG failures are retrieval failures, so measure them separately.

**Generation evaluation.** Faithfulness (every claim supported by the cited chunks), answer correctness against references, citation precision, abstention when the answer is absent. Use LLM-as-judge with rubrics, calibrated against human labels on a sample.

**Online metrics.** Answer acceptance (thumbs up, no immediate rephrase), ticket deflection to HR/IT, time saved, abstention rate, latency and cost per query; guardrails: zero permission leaks, low hallucination rate in audits.

**Security.** Enforce ACLs at retrieval time with the user's identity, never by asking the model to withhold. Treat document text as untrusted data (prompt injection hidden in a wiki page). Redact or restrict sensitive data.

**Monitoring.** Index freshness lag, parse failures, empty-retrieval rate, topic drift in questions, cost per query, judge-scored faithfulness on sampled traffic.

**Failure modes.** Old policy versions retrieved (use dates, versioning and dedup), tables parsed into nonsense, relevant chunk buried in the middle of a long context, answers stitched from incompatible documents, citations to chunks that don't support the claim.
`,
  traps: [
    { trap: "Long-context models make retrieval unnecessary.", why: "Two million documents don't fit, cost scales with tokens, and models use information in the middle of long contexts poorly. Retrieval selects a short, relevant context." },
    { trap: "Filter restricted content after generation.", why: "Once a restricted chunk reaches the prompt it can leak through paraphrase. Apply ACL filters in retrieval, using the user's identity." },
    { trap: "Evaluate by reading a few answers.", why: "You can't tell retrieval failures from generation failures. Measure recall@k on gold chunks and faithfulness/correctness separately on a fixed golden set." },
  ],
  say: {
    prompt: "Summarise your enterprise RAG design.",
    secs: 90,
    check: ["Clarified corpus, ACLs, citations/abstention, latency and cost", "Ingestion: parsing, structure-aware chunking with metadata, incremental updates", "Hybrid retrieval with ACL pre-filter, RRF, cross-encoder rerank", "Grounded generation with citations and abstention; injection and PII handling", "Separate retrieval and generation evals on a golden set; online acceptance and deflection"],
    followups: [
      { q: "How do you handle a question whose answer spans several documents?", a: "Decompose the question into sub-queries, retrieve for each, rerank the union, and ask the model to synthesise with a citation per claim; or use an agentic loop that retrieves iteratively within a step limit." },
      { q: "How do you keep the index fresh?", a: "Use connector change feeds to re-parse and re-embed changed documents within minutes, delete removed ones, keep version metadata, and monitor freshness lag." },
      { q: "How do you choose chunk size?", a: "Empirically on the golden set: smaller chunks raise precision but lose context; follow document structure, add section titles, and sometimes retrieve small chunks but pass their parent section." },
    ],
    answer: `Ingestion pulls documents through connectors with change feeds, parses layout, tables and scans, and splits along headings into chunks of a few hundred tokens that carry title, date and ACL metadata. Those go into both a vector index and a BM25 index. At query time I rewrite the question into a standalone query, retrieve from both indexes with an ACL filter for that user, fuse with reciprocal rank fusion, and rerank the top 50 with a cross-encoder to about eight chunks. The model answers only from those chunks, cites each claim, and abstains when the answer isn't there. Post-checks verify citations and redact PII.

At ten million chunks the index is tens of GB and each answer costs about two cents. I'd evaluate retrieval with recall@k on a golden set and generation with faithfulness and correctness judged by a calibrated LLM judge, then track acceptance, deflection, latency and permission-leak audits online.`,
    avoid: ["Permission checks after generation", "No separate retrieval metric"],
  },
  terms: [["RRF", "Reciprocal rank fusion: combine rankings by summing 1/(k + rank)."], ["Cross-encoder", "Model that reads query and passage together to score relevance."], ["Faithfulness", "Whether every claim in the answer is supported by the retrieved context."], ["ACL", "Access control list: who may read a document."]],
  sources: [SD.rag, SD.dpr, SD.lostMiddle, SD.ragas],
});
Q({ id: "sd-rag-1", d: 1, secs: 45, prompt: "2M documents × 5 pages × 500 tokens per page, split into 500-token chunks. Number of chunks, in millions?", answer: 10, tol: 0.05, explain: "5e9 tokens / 500 = 1e7 chunks.", py: "answer = 2e6*5*500/500/1e6" });
Q({ id: "sd-rag-2", d: 1, secs: 45, prompt: "10M chunks with 1,024-dimensional fp32 embeddings. Storage in GB (10⁹ bytes)? (2 decimals)", answer: 40.96, tol: 0.02, explain: "1e7 × 1,024 × 4 = 4.096e10 bytes.", py: "answer = 10e6*1024*4/1e9" });
Q({ id: "sd-rag-3", d: 2, secs: 60, prompt: "4,500 input tokens at $3 per million and 400 output tokens at $15 per million. Cost per query in $? (4 decimals)", answer: 0.0195, tol: 0.0002, explain: "0.0135 + 0.006 = 0.0195.", py: "answer = 4500*3/1e6 + 400*15/1e6" });
Q({ id: "sd-rag-4", d: 2, secs: 60, prompt: "RRF with k = 60: a chunk is ranked 1st by dense retrieval and 3rd by BM25. Fused score? (4 decimals)", answer: 0.0323, tol: 0.0002, explain: "1/61 + 1/63 = 0.0323.", py: "answer = 1/(60+1) + 1/(60+3)" });
C("sd-rag-c1", "Enterprise RAG path", "Rewrite → hybrid retrieval with ACL pre-filter → RRF → cross-encoder rerank → cite-or-abstain generation → checks.");
C("sd-rag-c2", "RAG evaluation split", "Retrieval: recall@k/MRR on gold chunks. Generation: faithfulness, correctness, citation precision.");

L("sd-support-bot", LA, "Design a customer support chatbot", "Intent routing, RAG, read-only tools, guardrails and human handoff for a multilingual fintech support assistant.", {
  kind: "design", mins: 35, prereq: ["sd-rag-enterprise", "ai-agent-safety"],
  hook: "Design a support assistant for a lending app with 1M active users: 40,000 conversations a day in English, Hindi and Hinglish, covering FAQs, loan status and escalations to human agents.",
  intuition: `
**Clarify.** Which intents: general FAQs (interest rates, foreclosure charges), account-specific questions (next EMI, payment not reflected, NOC status), actions (update address, request statement), complaints and disputes. Channels: in-app chat and WhatsApp. Languages and scripts, including romanised Hindi. Goal: resolve correctly without a human, with high satisfaction; a wrong answer about money is worse than a handoff. Compliance: authenticate before account data, no promises outside policy (fee waivers), grievance escalation rules, PII protection.

**Architecture in words.**

1. **Session and authentication:** the app passes a verified customer identity; WhatsApp needs an OTP step before account data.
2. **Router:** a small fine-tuned classifier (or small LLM) assigns intent, language and risk; complaints, fraud reports and legal threats go straight to humans.
3. **Answer paths:** (a) RAG over the help centre and policy documents; (b) read-only tools for account data (loan summary, EMI schedule, payment status); (c) actions through structured forms or confirmed tool calls handled by backend services, never free-form; (d) handoff to an agent with a conversation summary.
4. **Guardrails:** input checks (PII redaction for logs, abuse, prompt injection), output checks (policy classifier: no waivers or legal claims, numbers must come from tool results), language matching.
5. **Memory and logging:** conversation state in a store; full traces for audit and evaluation.
`,
  maths: `
**Load.** 40,000 conversations × 6 turns = 240,000 model calls/day. If 12% of traffic falls in the peak hour: 28,800 calls/hour = 8 per second, so throughput is modest; latency and quality matter more.

**Cost per turn.** 3,000 input tokens (instructions, retrieved snippets, tool results, history) and 200 output on a small model at $0.25 and $1.25 per million: $0.00075 + 0.00025 = $0.001$; ~$240/day.

**Value.** A human-handled chat costs about ₹60. Correct containment of 60% saves $40{,}000 \\times 0.6 \\times 60 = ₹14.4$ lakh a day, but if 1% of contained chats are wrong that is 240 customers a day with a bad answer about money: track and audit it.

**Latency budget (first token ~1.5 s).** Router 150 ms, retrieval 200 ms, account API 300 ms, model time to first token 600 ms, guardrails 150 ms.

| Component | Choice | Notes |
|---|---|---|
| Router | fine-tuned small classifier | cheap, testable, sends risky intents to humans |
| Knowledge | RAG over help centre and policies | versioned, cited |
| Account data | read-only tools via backend APIs | authenticated, scoped to the user |
| Actions | forms / confirmed calls handled by services | no free-text writes |
| Guardrails | PII, injection, policy and number checks | block or hand off |
| Handoff | summary + intent to agent desk | SLA tracking |
`,
  practice: `
**Data and labels.** Historical chat transcripts and tickets: cluster to find intents and their volumes, mine answers from good agent replies, collect agent macros. Label a sample per intent and language. Outcome labels: resolved, escalated, reopened within 7 days, CSAT.

**Models.** Router as a small classifier for speed and predictability; a mid-sized LLM for answers; a policy/safety classifier on outputs. Generate replies in the user's language and script; translation can be in-model.

**Offline evaluation.** Intent accuracy and confusion between risky and benign intents; answer correctness on a golden set per language; tool-call accuracy (right tool, right arguments) and use of tool numbers; policy-violation rate on a red-team set (waiver requests, injection attempts, other customers' data).

**Online metrics.** True resolution (no repeat contact within 7 days), CSAT, escalation rate and escalation quality (did the agent have what they needed), average handling time for escalated cases, cost per resolved conversation. A/B by user.

**Monitoring.** Sampled human audits of contained conversations, new intents appearing, language-specific quality, latency, tool error rates, cost.

**Failure modes.** False containment (the user gives up, so it looks resolved), invented numbers or policies, prompt injection asking for waivers, leaking another customer's data through a mis-scoped tool, wrong language or tone with distressed borrowers.
`,
  traps: [
    { trap: "Maximise containment rate.", why: "Users who give up count as contained. Measure true resolution: no repeat contact, good CSAT, and audit samples." },
    { trap: "Give the model write access to account APIs.", why: "One injection or hallucination could change customer data or grant waivers. Keep tools read-only and route actions through validated forms or backend workflows with confirmation." },
    { trap: "One giant prompt handles every intent.", why: "Hard to test and debug, and expensive. A router plus focused prompts and tools per intent is cheaper and evaluable." },
  ],
  say: {
    prompt: "How would you design a support chatbot for a lending app?",
    secs: 75,
    check: ["Intents, languages, authentication and compliance clarified", "Router → RAG for policies, read-only account tools, controlled actions, human handoff", "Guardrails: PII, injection, policy checks, numbers from tools only", "Offline: intent accuracy, golden-set correctness by language, red-team violations", "Online: true resolution (no repeat contact), CSAT, escalation quality, cost"],
    followups: [
      { q: "When should the bot hand off to a human?", a: "Complaints, fraud, legal threats or hardship; low router confidence; repeated failure to answer; user request; anything requiring a decision outside policy. Pass a summary so the user doesn't repeat themselves." },
      { q: "How do you handle Hinglish?", a: "Include romanised Hindi and code-mixed examples in router training and evaluation, let the model reply in the user's script, and measure quality per language separately." },
      { q: "How do you stop the bot inventing EMI amounts?", a: "Any number about the user's account must come from a tool result; an output check compares numbers in the reply against tool outputs and blocks mismatches." },
    ],
    answer: `After authentication, a small router classifies intent, language and risk, and sends complaints, fraud and hardship straight to humans. FAQs are answered with RAG over versioned help-centre and policy documents with citations. Account questions use read-only, user-scoped tools such as loan summary and payment status, and any change goes through validated forms or backend workflows rather than free-form model calls. Guardrails redact PII, resist injection, block replies that promise anything outside policy, and check that every account number in a reply came from a tool. Escalations carry a summary to the agent.

It's about 8 calls a second at peak and a tenth of a cent a turn, so quality is the constraint. Offline I'd test intent accuracy, golden-set correctness per language and red-team violations; online, true resolution without repeat contact, CSAT and escalation quality, with sampled audits.`,
    avoid: ["Containment as the only metric", "Unrestricted write tools"],
  },
  terms: [["Containment", "Share of conversations finished without a human."], ["Router", "Classifier that picks the intent and the path that handles it."], ["Handoff", "Transfer to a human agent with context."]],
  sources: [SD.rag, SD.agents, SD.judge],
});
Q({ id: "sd-bot-1", d: 1, secs: 45, prompt: "240,000 model calls a day with 12% in the peak hour. Calls per second at peak?", answer: 8, tol: 0.01, explain: "28,800 / 3,600 = 8.", py: "answer = 240000*0.12/3600" });
Q({ id: "sd-bot-2", d: 2, secs: 60, prompt: "Per turn: 3,000 input tokens at $0.25/M and 200 output tokens at $1.25/M; 240,000 turns a day. Daily cost in $?", answer: 240, tol: 0.5, explain: "$0.001 per turn × 240,000.", py: "answer = 240000*(3000*0.25/1e6 + 200*1.25/1e6)" });
Q({ id: "sd-bot-3", d: 2, secs: 60, prompt: "40,000 chats/day, 60% contained, 1% of contained chats are wrong. How many customers a day get a wrong contained answer?", answer: 240, tol: 0.5, explain: "40,000 × 0.6 × 0.01 = 240.", py: "answer = 40000*0.6*0.01" });
C("sd-bot-c1", "Support bot shape", "Auth → router → RAG (policies) / read-only tools (account) / forms (actions) / handoff → guardrails.");
