/**
 * v2 NLP & LLMs, part B: Retrieval and NLP evaluation · LLM architecture (attention, block,
 * positions, encoder/decoder). Fixed ids; answers recomputed in Pyodide.
 */
import { iq, lessonWriter } from "./v2-shared";
import { LS as S } from "./v2-llm-src";

const { L, Q, C } = lessonWriter("llm");
const RE = "Retrieval and NLP evaluation";
const AR = "LLM architecture";

// ───────────────────────── Retrieval and NLP evaluation ─────────────────────────

L("llm-bm25", RE, "Sparse retrieval and BM25", "Keyword search done properly: inverted indexes, BM25 scoring, and retrieval metrics.", {
  kind: "concept", mins: 25, prereq: ["llm-tfidf"],
  hook: "A user searches \"form 16 download\". Why do keyword engines still beat embeddings on queries like this?",
  intuition: `
**The situation.** Retrieval comes before any RAG system, chatbot over documents or search box. The first tool is sparse keyword retrieval, and it's still the baseline to beat.

**The idea.** Build an **inverted index**: for each term, the list of documents containing it. At query time, look up only the query terms' lists and score those documents. **BM25** is the standard score, an improved TF-IDF:

- **Term frequency saturates:** the 10th occurrence of "refund" adds much less than the 2nd.
- **Length normalisation:** long documents contain more words by chance, so their counts are discounted.
- **IDF:** rare terms count more.

Sparse retrieval nails exact terms (product codes, names, form numbers, error messages) and needs no training. It misses paraphrases ("money back" vs "refund"), which is where dense retrieval helps; production systems usually combine both.
`,
  maths: `
**In one breath.** $\\text{BM25}(q, d) = \\sum_{t \\in q}\\text{IDF}(t)\\cdot\\frac{f_{t,d}(k_1 + 1)}{f_{t,d} + k_1\\big(1 - b + b\\frac{|d|}{\\text{avgdl}}\\big)}$, with $k_1 \\approx 1.2$, $b \\approx 0.75$, $\\text{IDF}(t) = \\ln\\big(\\frac{N - n_t + 0.5}{n_t + 0.5} + 1\\big)$.

**Worked example.** $N = 1000$, term in $n_t = 10$ docs: IDF $= \\ln(94.24 + 1) = 4.557$. In a document of average length with $f = 3$: saturation factor $3 \\times 2.2/(3 + 1.2) = 1.571$, versus 3 for raw TF. With $f = 30$ it's only 2.11: diminishing returns.

**Retrieval metrics.**

- **Recall@k:** share of relevant documents found in the top $k$ (3 relevant, 2 in top 5 → 0.667). The key metric for RAG retrieval, since the generator can't use what wasn't retrieved.
- **Precision@k:** share of the top $k$ that are relevant.
- **MRR:** mean over queries of 1/rank of the first relevant result (ranks 1, 3, none → (1 + 1/3 + 0)/3 = 0.444).
- **nDCG@k:** graded relevance with a log discount by position.

| | Sparse (BM25) | Dense (embeddings) |
|---|---|---|
| Exact terms, IDs, rare names | strong | weak |
| Paraphrase, synonyms | weak | strong |
| Training needed | none | pretrained model (fine-tuning helps) |
| Index | inverted lists | vector index (ANN) |
| Explainability | term matches | similarity score |
`,
  practice: `
**Tools.** Elasticsearch/OpenSearch, Lucene, or \`rank_bm25\` for prototypes. Tune $k_1$ and $b$ only if you have labelled queries.

**Hybrid retrieval.** Run BM25 and dense retrieval, merge with reciprocal rank fusion, then rerank the top 50–100 with a cross-encoder. This is the default for serious RAG.

**Build an eval set first:** 50–200 real queries with relevant documents marked. Without it you can't tell whether a change helped.
`,
  traps: [
    { trap: "Embeddings make keyword search obsolete.", why: "Dense models struggle with exact identifiers, codes and rare names. Hybrid retrieval beats either alone on most real corpora." },
    { trap: "BM25 is just TF-IDF.", why: "It adds term-frequency saturation and document-length normalisation, which matter a lot for ranking." },
    { trap: "Measure retrieval by the final answer quality only.", why: "Then you can't tell retrieval failures from generation failures. Measure recall@k of retrieval separately." },
  ],
  say: {
    prompt: "Explain BM25 and how you'd evaluate a retrieval system.",
    secs: 45,
    check: ["Inverted index; scores only documents containing query terms", "BM25: IDF × saturating TF with length normalisation (k1, b)", "Strengths (exact terms) and weaknesses (paraphrase)", "Metrics: recall@k, precision@k, MRR, nDCG on a labelled query set", "Hybrid with dense retrieval and reranking"],
    followups: [
      { q: "What do k1 and b control?", a: "k1 controls how fast term frequency saturates (0 = binary presence, large = close to raw counts); b controls length normalisation (0 = none, 1 = full)." },
      { q: "Why is recall@k the key metric for RAG retrieval?", a: "The generator can only use retrieved passages; if the relevant one isn't in the top k, no prompt engineering will recover it. Precision matters second, for context budget and distraction." },
      { q: "How do you combine sparse and dense results?", a: "Reciprocal rank fusion: sum 1/(k + rank) across systems (k ≈ 60), robust because it ignores incomparable raw scores; then optionally rerank with a cross-encoder." },
    ],
    answer: `BM25 scores documents from an inverted index using the query terms. For each term it multiplies an IDF weight, so rare terms count more, by a term-frequency factor that saturates, so the tenth occurrence adds little, and that is normalised by document length relative to the average, controlled by k1 and b. It's training-free and excellent for exact terms like form numbers, product codes and names, but misses paraphrases.

To evaluate retrieval I'd build a set of real queries with relevant documents labelled and measure recall@k, which matters most for RAG, plus MRR or nDCG for ranking quality. In practice I'd combine BM25 with dense retrieval via reciprocal rank fusion and rerank the top results with a cross-encoder.`,
    avoid: ["\u201cBM25 is outdated\u201d", "Evaluating retrieval only through final answers"],
  },
  terms: [["Inverted index", "Term → list of documents containing it."], ["BM25", "Saturating, length-normalised TF × IDF ranking function."], ["Recall@k", "Fraction of relevant documents in the top k."], ["MRR", "Mean of 1/rank of the first relevant result."]],
  sources: [S.slp3],
});
Q({ id: "llm-bm-1", d: 2, secs: 60, prompt: "BM25 IDF = ln((N − n + 0.5)/(n + 0.5) + 1) with N = 1,000 documents and n = 10 containing the term? (3 decimals)", answer: 4.557, tol: 0.002, explain: "ln(989.5/10.5 + 1) = ln(95.24) = 4.557.", py: "import math\nN, n = 1000, 10\nanswer = math.log((N-n+0.5)/(n+0.5) + 1)" });
Q({ id: "llm-bm-2", d: 2, secs: 60, prompt: "BM25 term-frequency factor f(k1+1)/(f + k1) for a document of average length, f = 3, k1 = 1.2? (3 decimals)", answer: 1.571, tol: 0.002, explain: "3 × 2.2/4.2 = 1.571 (with |d| = avgdl the length term is 1).", py: "f, k1 = 3, 1.2\nanswer = f*(k1+1)/(f+k1)" });
Q({ id: "llm-bm-3", d: 1, secs: 30, prompt: "A query has 3 relevant documents; 2 of them appear in the top 5 results. Recall@5? (3 decimals)", answer: 0.667, tol: 0.002, explain: "2/3.", py: "answer = 2/3" });
Q({ id: "llm-bm-4", d: 2, secs: 45, prompt: "Three queries: first relevant result at rank 1, rank 3, and not retrieved. MRR? (3 decimals)", answer: 0.444, tol: 0.002, explain: "(1 + 1/3 + 0)/3.", py: "answer = (1 + 1/3 + 0)/3" });
C("llm-bm-c1", "BM25 vs TF-IDF", "Adds TF saturation (k1) and document-length normalisation (b).");

L("llm-dense-retrieval", RE, "Dense retrieval, embeddings and reranking", "Bi-encoders, contrastive training, vector indexes, hybrid search and cross-encoder reranking.", {
  kind: "concept", mins: 30, prereq: ["llm-bm25", "llm-word-embeddings"],
  hook: "\"How do I get my money back?\" and \"Refund policy\" share no words. How does a retriever match them in milliseconds over 10 million passages?",
  intuition: `
**The situation.** Keyword search misses paraphrases. You want to retrieve by meaning.

**The idea (bi-encoder).** Encode every passage once with a transformer into a vector and store it. At query time, encode the query with the same (or a paired) encoder and find the passages whose vectors are closest (dot product or cosine). Because passages are encoded independently of queries, search is a nearest-neighbour lookup, fast enough for millions of passages with an approximate index.

**Training.** Contrastive learning: pull each query towards its relevant passage and push it away from others. The cheapest negatives are the other passages in the same batch (**in-batch negatives**); **hard negatives** (BM25 results that look relevant but aren't) teach finer distinctions.

**Reranking (cross-encoder).** A bi-encoder never lets query and passage tokens attend to each other. A cross-encoder reads them together and scores relevance much more accurately, but costs one forward pass per pair, so use it only on the top 50–100 candidates.
`,
  maths: `
**In one breath.** Score $s(q, p) = E_q(q)^\\top E_p(p)$; train with InfoNCE $-\\log\\frac{e^{s(q, p^+)/\\tau}}{\\sum_j e^{s(q, p_j)/\\tau}}$ over the batch; retrieve with approximate nearest neighbours (HNSW, IVF-PQ).

**In-batch negatives.** Batch of 32 (query, positive) pairs: each query gets 31 negatives for free. Bigger batches → more negatives → usually better embeddings.

**Storage.** 1M passages × 768 dims × 4 bytes (float32) = 3.07 GB. float16 halves it; product quantisation cuts 10–30× at some recall cost.

**Reciprocal rank fusion.** $\\text{RRF}(d) = \\sum_{\\text{systems}}\\frac{1}{k + \\text{rank}(d)}$, $k = 60$. A document ranked 1st by BM25 and 3rd by dense: $1/61 + 1/63 = 0.0323$.

**Pipeline.**

| Stage | Model | Candidates | Cost |
|---|---|---|---|
| Retrieve | BM25 + bi-encoder (ANN) | millions → 100 | ms |
| Fuse | RRF | 100 | trivial |
| Rerank | cross-encoder | 100 → 5–10 | tens of ms on GPU |
| Generate | LLM | 5–10 passages | most of the latency |
`,
  practice: `
**Choosing an embedding model.** Check a public benchmark for your language and domain, then test on your own labelled queries; domain fine-tuning with hard negatives often gives large gains.

**Chunking.** Retrieval quality depends heavily on passage size and boundaries (covered in the RAG module of AI engineering). Embed the same text you'll show the LLM.

**Freshness and filters.** Re-embed changed documents; combine vector search with metadata filters (date, product, access permissions).

**Changing the embedding model means re-embedding the corpus**: vectors from different models aren't comparable.
`,
  traps: [
    { trap: "A cross-encoder is too slow, so skip reranking.", why: "Reranking only the top 50–100 candidates is cheap and usually gives one of the biggest quality gains in the pipeline." },
    { trap: "Cosine similarity of 0.8 means the passage answers the query.", why: "Similarity scores aren't calibrated relevance; thresholds differ by model and query. Use ranks and a labelled eval set." },
    { trap: "Upgrade the embedding model and keep the old index.", why: "Vector spaces from different models are incompatible; mixing them makes retrieval meaningless. Re-embed everything." },
  ],
  say: {
    prompt: "How does dense retrieval work, and how would you design a retrieval stack for RAG?",
    secs: 60,
    check: ["Bi-encoder: embed passages offline, query online, nearest-neighbour search", "Contrastive training with in-batch and hard negatives", "ANN indexes (HNSW / IVF-PQ) for scale", "Hybrid with BM25 (RRF) and cross-encoder reranking", "Evaluate with recall@k on labelled queries; chunking and re-embedding concerns"],
    followups: [
      { q: "Bi-encoder vs cross-encoder?", a: "Bi-encoders encode query and passage separately, so passages can be pre-computed and searched with ANN: fast but less accurate. Cross-encoders jointly attend over both: more accurate, one forward pass per pair, used for reranking." },
      { q: "What are hard negatives and why do they help?", a: "Passages that look relevant (e.g. high BM25 score) but aren't. Random negatives are too easy; hard ones force the model to learn fine-grained distinctions." },
      { q: "How does HNSW work at a high level?", a: "It builds a layered proximity graph; search starts at a sparse top layer and greedily moves to closer neighbours, descending layers. Approximate but very fast, with recall tunable via search breadth." },
    ],
    answer: `Dense retrieval uses a bi-encoder: a transformer embeds each passage into a vector offline, the query is embedded at request time, and we return the nearest passages by dot product or cosine using an approximate nearest-neighbour index like HNSW. The encoder is trained contrastively, pulling queries towards their relevant passages and away from in-batch and hard negatives.

For RAG I'd run BM25 and dense retrieval in parallel to cover both exact terms and paraphrases, fuse them with reciprocal rank fusion, rerank the top hundred with a cross-encoder, and pass the best five to ten chunks to the LLM. I'd measure recall@k on a labelled query set at each stage, and remember that changing the embedding model means re-embedding the corpus.`,
    avoid: ["Using raw similarity scores as relevance probabilities", "Mixing vectors from different models"],
  },
  terms: [["Bi-encoder", "Separate encodings of query and passage; dot-product scoring."], ["Cross-encoder", "Joint encoding of the pair; accurate reranker."], ["In-batch negatives", "Other examples' positives used as negatives."], ["ANN", "Approximate nearest-neighbour search (HNSW, IVF)."]],
  sources: [S.dpr, S.rag],
});
Q({ id: "llm-dr-1", d: 1, secs: 30, prompt: "Contrastive training with in-batch negatives and batch size 32. How many negatives does each query see?", answer: 31, tol: 0.5, explain: "The other 31 positives in the batch.", py: "answer = 32 - 1" });
Q({ id: "llm-dr-2", d: 1, secs: 45, prompt: "Storage for 1,000,000 passages × 768-dimensional float32 embeddings, in GB (10⁹ bytes)? (2 decimals)", answer: 3.07, tol: 0.01, explain: "1e6 × 768 × 4 bytes = 3.072e9.", py: "answer = 1e6*768*4/1e9" });
Q({ id: "llm-dr-3", d: 2, secs: 60, prompt: "Reciprocal rank fusion with k = 60: a document ranked 1st by BM25 and 3rd by the dense retriever. Fused score? (4 decimals)", answer: 0.0323, tol: 0.0001, explain: "1/61 + 1/63.", py: "answer = 1/61 + 1/63" });
Q({ id: "llm-dr-4", d: 2, secs: 60, prompt: "Query embedding q = (1, 0, 1). Passages: A (1, 1, 0), B (0.9, 0, 1.1), C (0, 1, 1). Which is retrieved first by cosine similarity?", options: ["A", "B", "C"], answer: 1, explain: "B points almost the same way as q (cosine ≈ 0.99).", py: "import numpy as np\nq = np.array([1,0,1.])\nP = np.array([[1,1,0],[0.9,0,1.1],[0,1,1.]])\nanswer = int(np.argmax(P@q/np.linalg.norm(P,axis=1)/np.linalg.norm(q)))", packages: ["numpy"] });
C("llm-dr-c1", "Retrieval pipeline", "BM25 + dense (ANN) → RRF → cross-encoder rerank → LLM.");

L("llm-ner", RE, "Sequence labelling and named entities", "BIO tagging, HMMs and the Viterbi algorithm, CRFs, and transformer token classification.", {
  kind: "concept", mins: 25, prereq: ["llm-text-clf"],
  hook: "Extract names, PAN numbers and loan amounts from 10,000 customer emails. Why is this a different problem from classifying the email?",
  intuition: `
**The situation.** Instead of one label per document, you need a label per token: which words form a person, an organisation, a location, an amount. That's **sequence labelling**, and named-entity recognition (NER) is the classic case.

**BIO tagging.** Mark each token B-TYPE (beginning of an entity), I-TYPE (inside) or O (outside). "Narendra Modi visited New Delhi" → B-PER I-PER O B-LOC I-LOC. Spans are recovered from the tags.

**Why labels interact.** I-LOC can't follow O; tags depend on neighbours. Classical models capture this: **HMMs** model tag transitions and word emissions; **CRFs** score whole tag sequences with rich features. Both decode the best sequence with the **Viterbi** algorithm (dynamic programming).

**Today:** fine-tune a transformer (BERT-style) with a classification head on each token, sometimes with a CRF layer on top; or prompt an LLM to extract structured fields for low-volume or changing schemas.
`,
  maths: `
**In one breath.** HMM: $P(\\text{tags}, \\text{words}) = \\prod_i P(t_i \\mid t_{i-1})P(w_i \\mid t_i)$; Viterbi: $v_i(t) = \\max_{t'} v_{i-1}(t')\\,P(t \\mid t')\\,P(w_i \\mid t)$, $O(nT^2)$.

**Viterbi in words.** For each position and each tag, keep the probability of the best path ending in that tag, plus a back-pointer. At the end take the best final tag and follow pointers back. Greedy left-to-right choices can be wrong; Viterbi is exact for the model.

**Entity-level evaluation.** Score whole spans, not tokens: an entity counts only if boundaries and type both match. 4 gold entities, 5 predicted, 3 exactly right: P = 0.6, R = 0.75, F1 = 0.667. Token accuracy is inflated by the many O tags.

**Subword alignment.** Transformers tokenise "Bhaskar" into pieces; label the first piece and ignore (or copy to) the rest when computing loss.

| Approach | Strength | Weakness |
|---|---|---|
| Rules / regex | exact formats (PAN, IFSC, amounts) | brittle for free text |
| HMM | simple, fast | weak features |
| CRF | rich features, valid transitions | feature engineering |
| BERT token classification | context-aware, strong | needs labelled tokens, GPU |
| LLM extraction | zero-shot, flexible schema | cost, latency, needs validation |
`,
  practice: `
**Hybrid in production.** Regex/validators for structured IDs (PAN format, checksums), a model for free-text entities, and schema validation for LLM outputs.

**Labelling.** Clear guidelines on boundaries ("Dr. Rao" vs "Rao") matter more than model choice; measure inter-annotator agreement.

**Privacy.** NER is often used for PII redaction: optimise recall, and log only redacted text.
`,
  traps: [
    { trap: "Report token accuracy for NER.", why: "Most tokens are O, so accuracy looks high even when entities are missed. Use entity-level precision, recall and F1." },
    { trap: "Choose the most likely tag for each token independently.", why: "That can produce invalid sequences (O then I-LOC). Viterbi decoding over transitions (HMM/CRF) or constrained decoding fixes it." },
    { trap: "Use an LLM for every extraction.", why: "For fixed formats, regex and validators are exact, free and auditable. Use models for genuinely free-form text." },
  ],
  say: {
    prompt: "How would you build an entity extractor for customer emails?",
    secs: 60,
    check: ["Frame as sequence labelling with BIO tags (or span extraction)", "Rules/validators for structured IDs, model for free text", "Model options: CRF, fine-tuned transformer token classifier, LLM extraction", "Entity-level P/R/F1, not token accuracy", "Labelling guidelines; PII and recall considerations"],
    followups: [
      { q: "What problem does Viterbi solve?", a: "Finding the highest-probability tag sequence under a model with tag-transition dependencies, exactly, in O(nT²) instead of trying all Tⁿ sequences." },
      { q: "HMM vs CRF?", a: "HMMs are generative (model words given tags) with limited features; CRFs are discriminative, condition on the whole input and allow arbitrary overlapping features while still decoding with Viterbi." },
      { q: "How do you handle subword tokens in BERT NER?", a: "Assign the word's label to its first subword and mask the rest from the loss (or copy the label); map predictions back to words for evaluation." },
    ],
    answer: `I'd treat it as sequence labelling: each token gets a BIO tag such as B-PER, I-PER or O, and spans are read off the tags. Structured fields like PAN numbers or amounts I'd extract with regex plus validators, because they're exact and auditable. For names and organisations in free text I'd fine-tune a BERT-style token classifier on a few thousand labelled sentences, or start with LLM extraction into a validated JSON schema if volume is low.

I'd evaluate with entity-level precision, recall and F1, since token accuracy is inflated by all the O tags. If this feeds PII redaction, I'd tune for recall, and I'd invest in clear annotation guidelines on boundaries.`,
    avoid: ["Token accuracy as the headline metric", "Regex for names in free text"],
  },
  terms: [["BIO tagging", "B-, I-, O labels marking entity spans."], ["Viterbi", "DP for the most likely tag sequence."], ["CRF", "Conditional random field: discriminative sequence model."], ["Entity-level F1", "Spans must match exactly in boundary and type."]],
  sources: [S.slp3, S.bert],
});
Q({ id: "llm-ner-1", d: 1, secs: 30, prompt: "BIO tags for \"Narendra Modi visited New Delhi\": B-PER I-PER O B-LOC I-LOC. How many entities?", answer: 2, tol: 0.5, explain: "Each B starts an entity: one PER, one LOC.", py: "answer = 'B-PER I-PER O B-LOC I-LOC'.split().count('B-PER') + 'B-PER I-PER O B-LOC I-LOC'.split().count('B-LOC')" });
Q({ id: "llm-ner-2", d: 2, secs: 60, prompt: "4 gold entities, 5 predicted, 3 exactly correct. Entity-level F1? (3 decimals)", answer: 0.667, tol: 0.002, explain: "P = 0.6, R = 0.75, F1 = 2PR/(P + R) = 0.667.", py: "P, R = 3/5, 3/4\nanswer = 2*P*R/(P+R)" });
Q({ id: "llm-ner-3", d: 3, secs: 150, prompt: "HMM with tags N, V. Start: P(N) = 0.6, P(V) = 0.4. Transitions: P(N→N) = 0.3, P(N→V) = 0.7, P(V→N) = 0.8, P(V→V) = 0.2. Emissions for \"fish sleep\": P(fish|N) = 0.6, P(fish|V) = 0.3, P(sleep|N) = 0.1, P(sleep|V) = 0.5. Probability of the best tag sequence (Viterbi)? (4 decimals)", answer: 0.126, tol: 0.0002, explain: "Best is N V: 0.6 × 0.6 × 0.7 × 0.5 = 0.126.", py: "import itertools\nst = {'N':0.6,'V':0.4}; tr = {('N','N'):0.3,('N','V'):0.7,('V','N'):0.8,('V','V'):0.2}\nem = {('fish','N'):0.6,('fish','V'):0.3,('sleep','N'):0.1,('sleep','V'):0.5}\nw = ['fish','sleep']\nbest = 0\nfor t in itertools.product('NV', repeat=2):\n    p = st[t[0]]*em[(w[0],t[0])]*tr[(t[0],t[1])]*em[(w[1],t[1])]\n    best = max(best, p)\nanswer = best" });
Q({ id: "llm-ner-4", d: 1, secs: 30, prompt: "Viterbi over a sentence of n tokens with T tags runs in…", options: ["O(Tⁿ)", "O(nT²)", "O(n²T)", "O(n log T)"], answer: 1, explain: "Each of n positions considers T × T transitions.", py: "answer = 1" });
C("llm-ner-c1", "NER evaluation", "Entity-level P/R/F1 with exact span + type match, not token accuracy.");

L("llm-nlp-metrics", RE, "NLP evaluation: BLEU, ROUGE, exact match and F1", "Overlap metrics for generation and QA, what they reward, and when to use model-based judges instead.", {
  kind: "concept", mins: 25,
  hook: "Your summariser scores ROUGE-L 0.42. Is that good, and would a human agree?",
  intuition: `
**The situation.** Generated text (translations, summaries, answers) has many valid forms. You need cheap automatic metrics to compare systems, knowing what they miss.

**The idea: count overlap with a reference.**

- **BLEU** (translation): precision of the candidate's n-grams (1–4) against the reference(s), with clipping so repeating a word doesn't help, and a brevity penalty for short outputs.
- **ROUGE** (summarisation): recall-oriented overlap; ROUGE-1/2 use unigrams/bigrams, ROUGE-L the longest common subsequence.
- **Exact match and token F1** (extractive QA): did the normalised answer match exactly; if not, how much token overlap?

These metrics reward surface overlap. A correct paraphrase can score low; a fluent answer with one wrong number can score high. Model-based metrics (BERTScore, LLM-as-judge) and human evaluation fill the gap.
`,
  maths: `
**In one breath.** BLEU $= \\text{BP}\\cdot\\exp\\big(\\frac14\\sum_{n=1}^4\\log p_n\\big)$ with clipped n-gram precisions $p_n$ and $\\text{BP} = \\min(1, e^{1 - r/c})$; ROUGE-N recall $= \\frac{\\text{overlapping n-grams}}{\\text{reference n-grams}}$; QA F1 over tokens.

**Clipping.** Candidate "the the the the", reference "the cat is on the mat": "the" appears twice in the reference, so clipped unigram precision = 2/4 = 0.5 (unclipped would be 1.0).

**Brevity penalty.** Candidate 8 tokens, reference 10: BP $= e^{1 - 10/8} = 0.779$.

**ROUGE-1 recall.** Reference has 6 unigrams, 4 appear in the summary: 0.667.

**Token F1 (SQuAD-style).** Gold "eiffel tower", prediction "tower in paris": overlap 1 token, P = 1/3, R = 1/2, F1 = 0.4. Normalise first (lowercase, strip punctuation and articles).

| Metric | Task | Rewards | Blind to |
|---|---|---|---|
| BLEU | translation | n-gram precision | recall, paraphrase |
| ROUGE | summarisation | n-gram / LCS recall | factual errors, fluency |
| EM / F1 | extractive QA | exact / token overlap | correct paraphrases |
| BERTScore | generation | embedding similarity | factual precision |
| LLM-as-judge | open-ended | rubric criteria | judge bias; must be validated |
`,
  practice: `
**Use overlap metrics** for regression tests and comparing similar systems on the same data; report them at corpus level (sentence BLEU is noisy).

**For LLM products** build a rubric-based evaluation (correctness, groundedness, completeness, format), validate an LLM judge against human labels, and keep a human-reviewed sample. Measure factuality separately; overlap metrics won't catch a wrong number.

**Always** compare against a baseline and look at examples behind the numbers.
`,
  traps: [
    { trap: "Higher BLEU/ROUGE means better output.", why: "They reward n-gram overlap with one reference. Correct paraphrases score low and fluent wrong answers can score high; correlation with humans is moderate at best." },
    { trap: "Compute BLEU per sentence and average.", why: "BLEU is designed at corpus level; sentence-level BLEU is unstable (zero higher-order matches). Use corpus BLEU or smoothed variants." },
    { trap: "An LLM judge is objective.", why: "Judges have position, length and self-preference biases. Validate against human labels and randomise order." },
  ],
  say: {
    prompt: "How would you evaluate a summarisation model?",
    secs: 60,
    check: ["ROUGE (1/2/L) for cheap regression comparisons; know it's recall-oriented overlap", "Limits: paraphrase, factuality", "Factual consistency checks against the source", "Rubric-based human and/or validated LLM-judge evaluation", "Look at examples; compare to a baseline"],
    followups: [
      { q: "Why does BLEU have a brevity penalty?", a: "BLEU is precision-based, so a very short output with a few correct words would score high; the penalty lowers scores for candidates shorter than the reference." },
      { q: "Why normalise before exact match?", a: "So trivial differences (case, punctuation, articles) don't count as errors: \u201cThe Eiffel Tower.\u201d and \u201ceiffel tower\u201d should match." },
      { q: "How do you validate an LLM judge?", a: "Label a sample with humans, measure agreement (accuracy, kappa, TPR/TNR) with the judge, fix the rubric/prompt, randomise answer order, and re-check periodically." },
    ],
    answer: `I'd use ROUGE-1, -2 and -L against reference summaries as a cheap way to compare versions and catch regressions, knowing it only measures overlap: a good paraphrase scores low and a fluent summary with a wrong figure can score high.

So I'd add a factual-consistency check against the source document, and a rubric covering faithfulness, coverage of key points, and conciseness, scored by humans on a sample and by an LLM judge that I've validated against those human labels, with randomised order to reduce bias. I'd always read a set of outputs alongside the numbers and compare against a simple baseline like the lead sentences.`,
    avoid: ["Reporting ROUGE alone as quality", "Trusting an unvalidated LLM judge"],
  },
  terms: [["BLEU", "Clipped n-gram precision with brevity penalty."], ["ROUGE", "Recall-oriented n-gram / LCS overlap."], ["Exact match / F1", "Normalised exact answer match / token overlap."], ["LLM-as-judge", "A model scoring outputs against a rubric."]],
  sources: [S.bleu, S.rouge],
});
Q({ id: "llm-met-1", d: 2, secs: 60, prompt: "Candidate \"the the the the\", reference \"the cat is on the mat\". Clipped unigram precision?", answer: 0.5, tol: 0.002, explain: "\"the\" counts at most twice (its reference count): 2/4.", py: "from collections import Counter\nc = Counter('the the the the'.split()); r = Counter('the cat is on the mat'.split())\nanswer = sum(min(n, r[w]) for w, n in c.items())/sum(c.values())" });
Q({ id: "llm-met-2", d: 2, secs: 45, prompt: "BLEU brevity penalty for an 8-token candidate and a 10-token reference? (3 decimals)", answer: 0.779, tol: 0.002, explain: "e^(1 − 10/8) = e^−0.25.", py: "import math\nanswer = math.exp(1 - 10/8)" });
Q({ id: "llm-met-3", d: 2, secs: 60, prompt: "Gold answer \"eiffel tower\", prediction \"tower in paris\". SQuAD-style token F1? (2 decimals)", answer: 0.4, tol: 0.005, explain: "Overlap 1; P = 1/3, R = 1/2; F1 = 0.4.", py: "from collections import Counter\np = 'tower in paris'.split(); g = 'eiffel tower'.split()\nov = sum((Counter(p) & Counter(g)).values())\nP, R = ov/len(p), ov/len(g)\nanswer = 2*P*R/(P+R)" });
Q({ id: "llm-met-4", d: 3, secs: 120, prompt: "ROUGE-L recall: reference \"the cat sat on the mat\", candidate \"the cat lay on a mat\". LCS length / reference length? (3 decimals)", answer: 0.667, tol: 0.002, explain: "LCS = the, cat, on, mat (4 tokens); 4/6.", py: "a = 'the cat sat on the mat'.split(); b = 'the cat lay on a mat'.split()\nD = [[0]*(len(b)+1) for _ in range(len(a)+1)]\nfor i in range(1, len(a)+1):\n    for j in range(1, len(b)+1):\n        D[i][j] = D[i-1][j-1]+1 if a[i-1] == b[j-1] else max(D[i-1][j], D[i][j-1])\nanswer = D[-1][-1]/len(a)" });
C("llm-met-c1", "BLEU vs ROUGE", "BLEU: clipped n-gram precision + brevity penalty. ROUGE: n-gram/LCS recall.");

L("llm-retrieval-practice", RE, "Retrieval and evaluation practice", "Interview scenarios on search, retrieval pipelines, extraction and generation metrics.", {
  kind: "interview", mins: 30, prereq: ["llm-bm25", "llm-dense-retrieval", "llm-ner", "llm-nlp-metrics"],
  hook: "Answer each out loud in about a minute, then open it and tick off the points the interviewer is listening for.",
}, [
  iq("Your RAG assistant gives wrong answers on 20% of questions. How do you find out whether retrieval or generation is at fault?", "Build a labelled set of questions with the passages that contain the answer. Measure retrieval recall@k: if the right passage isn't in the top k, it's retrieval. If it is retrieved but the answer is wrong, it's generation (prompting, context ordering, model). Log intermediate results per question.", ["Separate retrieval and generation", "Labelled question → passage set", "Recall@k diagnosis", "Per-stage logging"]),
  iq("Dense retrieval misses queries containing product codes like 'SKU-48213'. Fix?", "Embeddings blur rare exact identifiers. Add BM25 (or exact-match/metadata filters) and fuse with RRF; route ID-like queries to keyword search; optionally fine-tune the embedder with such examples.", ["Dense models weak on IDs", "Hybrid BM25 + RRF", "Query routing / filters"]),
  iq("Should you rerank with a cross-encoder if you already use a good embedding model?", "Usually yes: the cross-encoder attends jointly over query and passage, which a bi-encoder can't, and reranking only the top 50–100 keeps latency small. Verify with recall/nDCG@k on your eval set and measure added latency.", ["Joint attention is more accurate", "Rerank top-k only", "Measure gain vs latency"]),
  iq("A summariser's ROUGE went up 3 points but users complain about more factual errors. How?", "ROUGE rewards overlap with references, not faithfulness; a model can copy more reference-like phrasing while inventing details. Add factual-consistency checks against the source and a human or validated-judge rubric.", ["Overlap ≠ faithfulness", "Factuality evaluation", "Rubric/human eval"]),
  iq("Design PII redaction for chat logs before they're stored.", "Combine regex/validators for structured PII (phone, PAN, Aadhaar patterns, emails) with an NER model for names and addresses; tune for high recall; replace with typed placeholders; evaluate on a labelled sample with entity-level recall; never log unredacted text.", ["Rules + NER model", "Recall-first", "Placeholders", "Entity-level evaluation"]),
]);

// ───────────────────────── LLM architecture (part 1) ─────────────────────────

L("llm-self-attention", AR, "Self-attention (Q, K, V)", "Scaled dot-product attention, causal masking, and why attention costs grow with the square of the length.", {
  kind: "concept", mins: 30, prereq: ["llm-word-embeddings"],
  hook: "In \"The loan was rejected because it was incomplete\", what does \"it\" refer to, and how does a transformer work that out?",
  intuition: `
**The situation.** A word's meaning depends on other words, sometimes far away. RNNs pass information step by step and forget; attention lets every position look directly at every other position.

**The idea.** Each token produces three vectors from its embedding:

- a **query** (what am I looking for?),
- a **key** (what do I contain?),
- a **value** (what do I pass on if selected?).

Each token compares its query with every token's key (dot product), turns the scores into weights with softmax, and takes the weighted average of the values. "it" can put most of its weight on "loan" (or "application"), pulling that information into its own representation.

**Causal masking.** In a decoder (GPT-style), a token may only attend to itself and earlier tokens, so the model can be trained to predict the next token without seeing it.

**Cost.** Every token attends to every token: $n^2$ scores per head per layer. Double the context, quadruple the attention work, which is why long context is expensive.
`,
  maths: `
**In one breath.** $\\text{Attention}(Q, K, V) = \\text{softmax}\\Big(\\frac{QK^\\top}{\\sqrt{d_k}} + M\\Big)V$, with $Q = XW_Q$, $K = XW_K$, $V = XW_V$ and mask $M$ ($-\\infty$ above the diagonal for causal attention).

**Why divide by $\\sqrt{d_k}$.** If query and key components are independent with variance 1, $q\\cdot k$ has variance $d_k$. With $d_k = 64$ the scores have standard deviation 8, softmax saturates to nearly one-hot, and gradients vanish. Scaling restores unit variance.

**Worked example.** Query $q = (1, 1, 0, 0)$, keys $k_1 = (1, 1, 0, 0)$, $k_2 = (0, 0, 1, 1)$, $d_k = 4$. Scores $2/2 = 1$ and $0$. Softmax: 0.731 and 0.269. With values $v_1 = 10$, $v_2 = 0$ the output is 7.31.

**Causal mask.** For $n = 4$, the allowed (query, key) pairs are the lower triangle including the diagonal: $n(n + 1)/2 = 10$.

**Memory of the score matrix.** $n = 4096$, one head, fp16: $4096^2 \\times 2$ bytes = 33.6 MB, per head per layer, if materialised. FlashAttention avoids storing it by computing attention in tiles in fast on-chip memory, giving the exact result with far less memory traffic.

| | RNN | Self-attention |
|---|---|---|
| Path between distant tokens | O(n) steps | 1 step |
| Parallel over positions | no | yes |
| Cost per layer | O(n·d²) | O(n²·d) |
| Order information | built in | must be added (positions) |
`,
  practice: `
**Where you meet it.** Every transformer layer; cross-attention in encoder–decoder models (queries from the decoder, keys/values from the encoder); retrieval-style "attention over memory".

**Efficiency.** FlashAttention for exact attention with less memory traffic; KV caching at inference (next module); sparse or sliding-window attention for very long contexts.

**Interpretability caveat.** Attention weights show where information is read from in one head; they're not a full explanation of the model's decision.
`,
  traps: [
    { trap: "Q, K and V are the same vectors.", why: "They're three different learned projections of the same input, letting a token search with one representation and offer another." },
    { trap: "The √d scaling is a minor numerical detail.", why: "Without it, dot products grow with dimension, softmax saturates and gradients vanish; training becomes much harder." },
    { trap: "Attention weights explain the prediction.", why: "They show mixing in one head of one layer; outputs depend on values, many heads, residual paths and later layers." },
  ],
  say: {
    prompt: "Explain self-attention as you would in an interview, including the formula.",
    secs: 60,
    check: ["Queries, keys, values as learned projections of each token", "Scores = QKᵀ/√d_k, softmax, weighted sum of V", "Why √d_k: keeps score variance ~1, avoids saturated softmax", "Causal mask for decoders", "O(n²) cost in sequence length; FlashAttention / KV cache mentions"],
    followups: [
      { q: "Why does attention scale quadratically and why does it matter?", a: "Every token scores every other token, giving an n × n matrix per head per layer. Doubling context quadruples that compute and (naively) memory, which limits context length and raises cost." },
      { q: "What does FlashAttention change?", a: "Not the result: it computes exact attention in tiles that fit in on-chip SRAM, never writing the full n × n matrix to GPU memory, so it's much faster and uses linear memory in n." },
      { q: "What's cross-attention?", a: "Attention where queries come from one sequence (e.g. the decoder) and keys/values from another (the encoder output), used in translation and encoder–decoder models." },
    ],
    answer: `Each token's embedding is projected three ways: a query, a key and a value. Each token's query is compared with every token's key by dot product, divided by the square root of the key dimension, passed through a softmax to get weights, and those weights average the value vectors. So softmax of QKᵀ over root d, times V. That lets each token pull in information from whichever tokens are relevant, in one step regardless of distance.

The √d scaling keeps dot products from growing with dimension and saturating the softmax. In a decoder, a causal mask blocks attention to future tokens so the model can learn next-token prediction. The cost is quadratic in sequence length, which is why long contexts are expensive and why tricks like FlashAttention and KV caching matter.`,
    avoid: ["\u201cAttention weights are the explanation\u201d", "Forgetting the causal mask for GPT-style models"],
  },
  terms: [["Query / key / value", "Learned projections used to score and mix tokens."], ["Scaled dot-product attention", "softmax(QKᵀ/√d_k)V."], ["Causal mask", "Blocks attention to future positions."], ["FlashAttention", "Exact attention computed in tiles to cut memory traffic."]],
  sources: [S.attn, S.flash],
});
Q({ id: "llm-sa-1", d: 2, secs: 90, prompt: "q = (1, 1, 0, 0); keys k₁ = (1, 1, 0, 0), k₂ = (0, 0, 1, 1); d_k = 4. Attention weight on k₁? (3 decimals)", answer: 0.731, tol: 0.002, explain: "Scaled scores 1 and 0; softmax gives 0.731 and 0.269.", py: "import numpy as np\nq = np.array([1,1,0,0.]); K = np.array([[1,1,0,0],[0,0,1,1.]])\ns = K@q/np.sqrt(4)\nw = np.exp(s)/np.exp(s).sum()\nanswer = float(w[0])", packages: ["numpy"] });
Q({ id: "llm-sa-2", d: 1, secs: 30, prompt: "Same weights, values v₁ = 10 and v₂ = 0. Attention output? (2 decimals)", answer: 7.31, tol: 0.01, explain: "0.731 × 10 + 0.269 × 0.", py: "import numpy as np\ns = np.array([1.,0.])\nw = np.exp(s)/np.exp(s).sum()\nanswer = float(w@np.array([10.,0.]))", packages: ["numpy"] });
Q({ id: "llm-sa-3", d: 1, secs: 30, prompt: "Causal self-attention over 4 tokens. How many (query, key) pairs are allowed?", answer: 10, tol: 0.5, explain: "Lower triangle with diagonal: 4 × 5/2.", py: "import numpy as np\nanswer = int(np.tril(np.ones((4,4))).sum())", packages: ["numpy"] });
Q({ id: "llm-sa-4", d: 2, secs: 60, prompt: "Memory to materialise one 4,096 × 4,096 attention score matrix in fp16 (2 bytes), in MB (10⁶ bytes)? (1 decimal)", answer: 33.6, tol: 0.1, explain: "4096² × 2 = 33.55e6 bytes, per head per layer.", py: "answer = 4096**2*2/1e6" });
Q({ id: "llm-sa-5", d: 2, secs: 60, prompt: "Query and key components are independent with mean 0 and variance 1, d_k = 64. Standard deviation of the unscaled dot product q·k?", answer: 8, tol: 0.05, explain: "Variance = d_k = 64, so sd = 8; dividing by √64 restores sd 1.", py: "answer = 64**0.5" });
C("llm-sa-c1", "Scaled dot-product attention", "softmax(QKᵀ/√d_k + mask)·V.");
C("llm-sa-c2", "Why √d_k", "q·k has variance d_k; scaling keeps softmax from saturating.");

L("llm-transformer-block", AR, "Multi-head attention and the transformer block", "Heads, residual connections, layer norm, the feed-forward network, and counting parameters.", {
  kind: "concept", mins: 30, prereq: ["llm-self-attention"],
  hook: "A 7B-parameter model has 32 layers. Where do the 7 billion numbers actually live?",
  intuition: `
**The situation.** A transformer is a stack of identical blocks. Knowing what's inside one block lets you reason about capacity, cost and failure modes.

**Inside a (pre-norm, decoder-only) block:**

1. **LayerNorm/RMSNorm** the input.
2. **Multi-head self-attention:** split the model dimension into $h$ heads, each attending with its own Q/K/V projections, so different heads can track different relations (syntax, coreference, position). Concatenate and project back.
3. **Residual add:** add the attention output to the block input.
4. **Norm** again, then a **feed-forward network** applied to each position separately (expand ~4×, non-linearity such as GELU/SwiGLU, project back).
5. **Residual add** again.

The **residual stream** carries information up the stack; each sublayer reads from it and writes an update. Attention moves information between positions; the FFN transforms each position (and stores much of the model's factual knowledge).

**Pre-norm** (norm before each sublayer) trains more stably at depth than the original post-norm layout.
`,
  maths: `
**In one breath.** Per block ≈ $4d^2$ attention parameters ($W_Q, W_K, W_V, W_O$) + $8d^2$ FFN parameters (two $d \\times 4d$ matrices) = $12d^2$; total ≈ $12Ld^2$ + embeddings $V \\cdot d$.

**Multi-head arithmetic.** $d = 4096$, $h = 32$ heads → head dimension 128. Multi-head costs about the same as one big head; it changes what can be represented, not the parameter count.

**Worked example (GPT-2 small).** $d = 768$, $L = 12$, $V = 50{,}257$. Blocks: $12 \\times 12 \\times 768^2 = 84.9$M. Embeddings: $50{,}257 \\times 768 = 38.6$M (tied with the output layer). Total ≈ 123.5M, close to the published 124M (biases and norms make up the rest).

**SwiGLU FFNs** (Llama-style) use three matrices with hidden size ≈ $\\frac{8}{3}d$, keeping roughly the same $8d^2$ budget.

**Compute per token** for a forward pass ≈ $2N$ FLOPs ($N$ = parameters), plus attention's $O(n\\,d)$ per token per layer; training ≈ $6N$ FLOPs per token.

| Component | Role | Params per block |
|---|---|---|
| Attention (Q, K, V, O) | mix information across positions | 4d² |
| FFN (up, down) | per-position transformation, "memory" | 8d² |
| Norms | stabilise activations | ~4d |
| Residuals | gradient highway, information stream | 0 |
`,
  practice: `
**Reading a model card.** From $d$, $L$, $h$, vocabulary and FFN size you can estimate parameters, FLOPs per token, KV-cache size and memory. Interviewers like this arithmetic.

**Design knobs.** Depth vs width (deeper often better at fixed parameters, up to a point), number of KV heads (next lessons), FFN type (SwiGLU), norm type (RMSNorm), and tying input/output embeddings.

**Debugging intuition.** Loss spikes in large runs are often tied to norms, attention logits growing, or learning-rate schedules; pre-norm and QK-normalisation help.
`,
  traps: [
    { trap: "More heads means more parameters.", why: "With head dimension d/h, the total Q/K/V/O size is 4d² regardless of h. Heads split the same budget." },
    { trap: "Attention is where most parameters are.", why: "The FFN has about twice the attention parameters per block (8d² vs 4d²); embeddings matter for small models with big vocabularies." },
    { trap: "Residual connections are just a training trick.", why: "They define the residual stream that every layer reads and writes; removing them breaks both optimisation and the model's information flow." },
  ],
  say: {
    prompt: "Walk me through a transformer decoder block and estimate the parameters of a model with d = 4096 and 32 layers.",
    secs: 60,
    check: ["Norm → multi-head attention → residual; norm → FFN → residual (pre-norm)", "Heads split d; different heads learn different relations", "FFN expands ~4× and is per-position", "≈ 12d² per block → 12 × 32 × 4096² ≈ 6.4B, plus embeddings", "Residual stream; pre-norm stability"],
    followups: [
      { q: "Why pre-norm rather than post-norm?", a: "Normalising the input to each sublayer keeps the residual path an identity, which gives stable gradients in deep stacks and allows higher learning rates without warm-up hacks." },
      { q: "What does the FFN do that attention can't?", a: "Attention only mixes information across positions with weights summing to 1; the FFN applies a non-linear transformation per position, adding capacity and storing much of the model's learned associations." },
      { q: "How many FLOPs to generate one token with a 7B model?", a: "About 2 × 7e9 = 1.4e10 FLOPs for the matrix multiplies (plus attention over the cached context)." },
    ],
    answer: `A pre-norm decoder block normalises its input, runs multi-head causal self-attention, and adds the result back to the input through a residual connection; then it normalises again, runs a position-wise feed-forward network that expands to about four times the width and back with a non-linearity like GELU or SwiGLU, and adds that back too. Heads split the model dimension so different heads can track different relations; attention moves information between positions and the FFN transforms each position.

Attention has about 4d² parameters and the FFN about 8d², so roughly 12d² per block. With d = 4096 and 32 layers that's 12 × 32 × 4096², about 6.4 billion, plus embeddings of vocabulary times d, around 0.13–0.5 billion depending on vocabulary and tying: a "7B" model.`,
    avoid: ["\u201cMore heads add parameters\u201d", "Forgetting embeddings in the count"],
  },
  terms: [["Multi-head attention", "Several attention heads in parallel on slices of d."], ["Residual stream", "The running vector each sublayer adds its update to."], ["Pre-norm", "Normalise before each sublayer."], ["SwiGLU", "Gated FFN variant used in Llama-style models."]],
  sources: [S.attn],
});
Q({ id: "llm-tb-1", d: 1, secs: 30, prompt: "d_model = 4,096 with 32 heads. Head dimension?", answer: 128, tol: 0.5, explain: "4096/32.", py: "answer = 4096//32" });
Q({ id: "llm-tb-2", d: 2, secs: 60, prompt: "Approximate parameters in one transformer block (≈ 12d²) with d = 768?", answer: 7077888, tol: 1, explain: "12 × 768² = 7,077,888.", py: "answer = 12*768**2" });
Q({ id: "llm-tb-3", d: 3, secs: 120, prompt: "GPT-2 small: d = 768, 12 layers, vocabulary 50,257, tied embeddings. Estimate total parameters in millions using 12Ld² + Vd. (1 decimal)", answer: 123.5, tol: 0.2, explain: "84.9M + 38.6M ≈ 123.5M (published: 124M).", py: "d, L, V = 768, 12, 50257\nanswer = (12*L*d*d + V*d)/1e6" });
Q({ id: "llm-tb-4", d: 1, secs: 30, prompt: "Forward-pass FLOPs per token ≈ 2N. For N = 7 × 10⁹, in units of 10¹⁰ FLOPs?", answer: 1.4, tol: 0.01, explain: "2 × 7e9 = 1.4e10.", py: "answer = 2*7e9/1e10" });
C("llm-tb-c1", "Transformer parameter estimate", "≈ 12·L·d² (4d² attention + 8d² FFN per block) + V·d embeddings.");

L("llm-positions", AR, "Positional encodings and RoPE", "Why attention needs position information, and how sinusoidal, learned, RoPE and ALiBi supply it.", {
  kind: "concept", mins: 25, prereq: ["llm-self-attention"],
  hook: "\"Dog bites man\" and \"man bites dog\" contain the same tokens. Without positional information, a transformer can't tell them apart. Why?",
  intuition: `
**The situation.** Self-attention is a weighted average over a set: permute the input tokens and each output is permuted the same way. Order has to be injected.

**Options.**

- **Absolute sinusoidal** (original transformer): add a fixed vector of sines and cosines at different frequencies to each position's embedding.
- **Learned absolute:** a trainable vector per position (BERT, GPT-2). Simple, but no positions beyond the trained maximum.
- **RoPE (rotary):** rotate each query and key, pair of dimensions by pair of dimensions, by an angle proportional to its position. The dot product between a query at $m$ and a key at $n$ then depends only on $m - n$: relative position falls out naturally. Used in Llama, Qwen, Mistral and most current LLMs.
- **ALiBi:** add a penalty to attention scores proportional to distance, per head.

**Long context.** RoPE models trained at 4k tokens degrade beyond it; context extension methods rescale the rotation frequencies (position interpolation, NTK-aware scaling, YaRN) and fine-tune briefly at the longer length.
`,
  maths: `
**In one breath.** Sinusoidal: $PE_{(p, 2i)} = \\sin(p/10000^{2i/d})$, $PE_{(p, 2i+1)} = \\cos(\\cdot)$. RoPE rotates each 2-D pair by angle $p\\,\\theta_i$ with $\\theta_i = 10000^{-2i/d}$, so $\\langle R_m q, R_n k\\rangle = \\langle q, R_{n-m}k\\rangle$.

**Worked examples.**

- Sinusoidal, position 1, first dimension: $\\sin(1) = 0.841$.
- RoPE on a pair $(1, 0)$ with $\\theta = 0.5$ at position 2: rotate by 1 radian → $(\\cos 1, \\sin 1) = (0.540, 0.841)$.
- Relative property: the score between a query at position 5 and key at 3 equals the score between the same vectors at 7 and 5.

**Frequencies.** Pair $i$ rotates with wavelength $2\\pi\\cdot10000^{2i/d}$: early pairs spin fast (fine local position), late pairs spin slowly (coarse long-range position). With $d = 128$, the slowest pair's wavelength is about 54,000 tokens.

| Method | Relative? | Extrapolates? | Used in |
|---|---|---|---|
| Sinusoidal | partly | poorly in practice | original transformer |
| Learned absolute | no | no | BERT, GPT-2 |
| RoPE | yes | with frequency scaling | Llama, most modern LLMs |
| ALiBi | yes (bias) | better | BLOOM, some long-context models |
`,
  practice: `
**When it matters to you.** Choosing or extending a model's context length; understanding why quality drops past the trained length; reading model configs (\`rope_theta\`, \`rope_scaling\`).

**Long-context reality.** A model accepting 128k tokens doesn't use all positions equally well; test retrieval of facts at different depths in your own documents.
`,
  traps: [
    { trap: "Attention already knows word order.", why: "Without positional information self-attention is permutation-equivariant: shuffling tokens just shuffles outputs." },
    { trap: "RoPE adds a position vector to the embeddings.", why: "It rotates queries and keys inside attention; nothing is added to the token embeddings, and values aren't rotated." },
    { trap: "A model trained on 4k tokens works fine at 32k if memory allows.", why: "Unseen rotation angles/positions degrade attention; you need frequency scaling plus some fine-tuning at the longer length." },
  ],
  say: {
    prompt: "Why do transformers need positional encodings, and how does RoPE work?",
    secs: 45,
    check: ["Self-attention is permutation-equivariant; order must be injected", "Absolute options: sinusoidal, learned", "RoPE rotates Q and K by position-dependent angles per dimension pair", "Dot product depends on relative position m − n", "Context extension by rescaling frequencies + fine-tuning"],
    followups: [
      { q: "Why rotate only queries and keys, not values?", a: "Position should affect which tokens attend to which (the scores); values carry content, and rotating them would scramble what's passed on." },
      { q: "What does increasing rope_theta (the base) do?", a: "It slows all rotation frequencies, so larger relative distances map to angles the model can distinguish, which helps long context, typically with fine-tuning." },
      { q: "Learned vs sinusoidal absolute embeddings?", a: "Learned ones fit the data but can't represent positions beyond the training maximum; sinusoidal ones are defined for any position but don't extrapolate well in practice." },
    ],
    answer: `Self-attention treats its input as a set: if you shuffle the tokens, the outputs shuffle the same way, so the model can't tell "dog bites man" from "man bites dog" unless position is injected. The original transformer added sinusoidal vectors to the embeddings; BERT and GPT-2 learned a vector per position.

RoPE, used in most current LLMs, instead rotates each pair of dimensions of the query and key by an angle proportional to the token's position, with different frequencies for different pairs. Because rotations compose, the dot product between a query at position m and a key at n depends only on m − n, so relative position is built into the attention scores. To extend context beyond the training length you rescale the rotation frequencies, as in position interpolation or YaRN, and fine-tune briefly.`,
    avoid: ["\u201cRoPE is added to embeddings\u201d", "Assuming context length extends for free"],
  },
  terms: [["Permutation equivariance", "Shuffling inputs shuffles outputs identically."], ["RoPE", "Rotary position embedding: position-dependent rotations of Q and K."], ["ALiBi", "Distance-proportional bias on attention scores."], ["Position interpolation", "Rescaling positions/frequencies to extend context."]],
  sources: [S.rope, S.attn],
});
Q({ id: "llm-pos-1", d: 1, secs: 30, prompt: "Sinusoidal encoding, position 1, dimension 0: sin(1 / 10000⁰)? (3 decimals)", answer: 0.841, tol: 0.002, explain: "sin(1) = 0.841.", py: "import math\nanswer = math.sin(1/10000**0)" });
Q({ id: "llm-pos-2", d: 2, secs: 60, prompt: "RoPE on a 2-D pair (1, 0) with θ = 0.5 at position 2. First component after rotation? (3 decimals)", answer: 0.54, tol: 0.002, explain: "Rotate by 2 × 0.5 = 1 rad: (cos 1, sin 1) = (0.540, 0.841).", py: "import math\nanswer = math.cos(2*0.5)" });
Q({ id: "llm-pos-3", d: 3, secs: 120, prompt: "With RoPE (θ = 0.3 on a 2-D pair), is the score between q at position 5 and k at 3 equal to the score between the same q at 7 and k at 5?", options: ["Yes", "No"], answer: 0, explain: "Rotations compose: the score depends only on the offset (2 in both cases).", py: "import numpy as np\ndef R(a):\n    return np.array([[np.cos(a), -np.sin(a)], [np.sin(a), np.cos(a)]])\nq = np.array([0.3, 1.2]); k = np.array([-0.7, 0.5]); t = 0.3\ns1 = (R(5*t)@q)@(R(3*t)@k); s2 = (R(7*t)@q)@(R(5*t)@k)\nanswer = 0 if abs(s1 - s2) < 1e-9 else 1", packages: ["numpy"] });
Q({ id: "llm-pos-4", d: 3, secs: 90, prompt: "RoPE with base 10,000 and head dimension 128: wavelength (in tokens) of the slowest-rotating pair, 2π·10000^(126/128)? (nearest 100)", answer: 54400, tol: 200, explain: "10000^0.984 ≈ 8,660; × 2π ≈ 54,400 tokens.", py: "import math\nanswer = 2*math.pi*10000**(126/128)" });
C("llm-pos-c1", "RoPE key property", "⟨R_m q, R_n k⟩ depends only on n − m.");

L("llm-encoder-decoder", AR, "Encoder, decoder and encoder–decoder models", "BERT vs GPT vs T5: training objectives, attention masks and which to use for what.", {
  kind: "concept", mins: 25, prereq: ["llm-self-attention"],
  hook: "For sentence embeddings you'd pick a BERT-style model; for a chatbot, a GPT-style one. What actually differs between them?",
  intuition: `
**The situation.** "Transformer" covers three families that differ in attention mask and training objective, and they suit different jobs.

- **Encoder-only (BERT, RoBERTa):** every token sees the whole input (bidirectional). Trained with **masked language modelling**: hide ~15% of tokens and predict them. Great representations for classification, NER, retrieval embeddings. Not built to generate long text.
- **Decoder-only (GPT, Llama):** causal mask, trained to **predict the next token**. Generates text naturally; with scale and instruction tuning it does almost every task through prompting. The dominant LLM design.
- **Encoder–decoder (T5, BART, original transformer):** an encoder reads the input bidirectionally; a decoder generates the output with causal self-attention plus cross-attention to the encoder. Natural for input → output tasks like translation and summarisation.

Decoder-only won for general LLMs because one objective scales simply, every token gives a training signal, and prompting turns any task into continuation.
`,
  maths: `
**In one breath.** MLM: $-\\sum_{i \\in \\text{masked}}\\log p(x_i \\mid x_{\\setminus\\text{masked}})$; causal LM: $-\\sum_i\\log p(x_i \\mid x_{<i})$; encoder–decoder: $-\\sum_j\\log p(y_j \\mid y_{<j}, x)$.

**BERT masking arithmetic.** 512 tokens × 15% = 76.8 positions selected. Of those, 80% become [MASK] (≈ 61.4), 10% a random token, 10% unchanged, so the model can't rely on seeing [MASK], which never appears at fine-tuning time.

**Training signal.** A causal LM gets a prediction target at every position; MLM only at the ~15% masked positions, so per token of text it learns from fewer targets.

**Masks.**

| Family | Self-attention mask | Objective | Typical use |
|---|---|---|---|
| Encoder | full (bidirectional) | masked LM | classification, NER, embeddings, reranking |
| Decoder | causal | next token | generation, chat, general LLMs |
| Encoder–decoder | full in encoder; causal + cross in decoder | span corruption / seq2seq | translation, summarisation |
`,
  practice: `
**Choosing.**

- Classification/NER/embeddings at low latency and cost → a fine-tuned encoder (or an embedding model built on one).
- Open-ended generation, chat, tool use, few-shot anything → decoder-only LLM.
- High-volume fixed input→output transformations (translation, summarisation) → encoder–decoder can be efficient; decoder-only also works.

**Cost note.** A 100M-parameter fine-tuned encoder classifier can be 100× cheaper per request than calling a large LLM, with similar accuracy on a narrow task.
`,
  traps: [
    { trap: "BERT is just an older, smaller GPT.", why: "Different mask and objective: BERT is bidirectional and trained to fill masks, which suits understanding tasks; it isn't designed to generate text left to right." },
    { trap: "Decoder-only models can't do classification well.", why: "With instruction tuning or a classification head they do; the question is cost and latency versus a small fine-tuned encoder." },
    { trap: "Encoder–decoder models are obsolete.", why: "They remain strong and efficient for input-to-output tasks; they're less common for general chat because decoder-only scales more simply." },
  ],
  say: {
    prompt: "Compare encoder-only, decoder-only and encoder–decoder transformers. When would you use each?",
    secs: 60,
    check: ["Encoder: bidirectional attention, MLM objective (BERT)", "Decoder: causal mask, next-token objective (GPT/Llama)", "Encoder–decoder: encoder + decoder with cross-attention (T5)", "Matches use cases: understanding/embeddings vs generation vs seq2seq", "Why decoder-only dominates LLMs; cost trade-off for narrow tasks"],
    followups: [
      { q: "Why does BERT not always replace masked tokens with [MASK]?", a: "[MASK] never appears at fine-tuning time; replacing 10% with random tokens and leaving 10% unchanged forces the model to build good representations for every token, not only masked ones." },
      { q: "Why did decoder-only become the default for LLMs?", a: "Simple objective with a training signal at every token, natural generation, and with scale plus instruction tuning any task can be phrased as text continuation." },
      { q: "What is cross-attention used for?", a: "Letting the decoder attend to the encoder's representation of the input at each generation step: queries from the decoder, keys and values from the encoder." },
    ],
    answer: `Encoder-only models like BERT use bidirectional attention, so each token sees the whole input, and are trained by masking about 15% of tokens and predicting them. They give strong representations for classification, NER, embeddings and reranking, cheaply. Decoder-only models like GPT and Llama use a causal mask and learn to predict the next token; they generate naturally and, scaled up and instruction-tuned, handle almost any task by prompting, which is why they dominate LLMs. Encoder–decoder models like T5 read the input with an encoder and generate with a decoder that cross-attends to it, which fits translation and summarisation.

For a narrow high-volume task like ticket classification I'd fine-tune a small encoder; for open-ended generation or chat, a decoder-only LLM.`,
    avoid: ["\u201cBERT can generate text like GPT\u201d", "Ignoring cost when choosing an LLM for a narrow task"],
  },
  terms: [["Masked language modelling", "Predict hidden tokens from bidirectional context."], ["Causal language modelling", "Predict the next token from the left context."], ["Cross-attention", "Decoder queries attend to encoder keys/values."]],
  sources: [S.bert, S.gpt3, S.attn],
});
Q({ id: "llm-ed2-1", d: 1, secs: 30, prompt: "BERT selects 15% of a 512-token input for prediction. How many positions? (1 decimal)", answer: 76.8, tol: 0.05, explain: "0.15 × 512.", py: "answer = 0.15*512" });
Q({ id: "llm-ed2-2", d: 2, secs: 45, prompt: "Of those selected positions, 80% are replaced with [MASK]. Expected count? (2 decimals)", answer: 61.44, tol: 0.01, explain: "0.8 × 76.8.", py: "answer = 0.8*0.15*512" });
Q({ id: "llm-ed2-3", d: 1, secs: 30, prompt: "Which family uses a causal (lower-triangular) self-attention mask throughout?", options: ["Encoder-only (BERT)", "Decoder-only (GPT)", "Neither"], answer: 1, explain: "GPT-style decoders mask future tokens; BERT attends bidirectionally.", py: "answer = 1" });
Q({ id: "llm-ed2-4", d: 2, secs: 60, prompt: "On a 1,000-token document, how many prediction targets does a causal LM get versus BERT-style MLM at 15%? Give the ratio (causal / MLM), 2 decimals.", answer: 6.67, tol: 0.02, explain: "~1,000 next-token targets vs 150 masked targets.", py: "answer = 1000/(0.15*1000)" });
C("llm-ed2-c1", "Three transformer families", "Encoder (BERT, MLM) · Decoder (GPT, next token) · Encoder–decoder (T5, seq2seq).");
