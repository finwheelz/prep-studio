/**
 * v2 AI engineering, part C: RAG.
 * Fixed ids. Every quiz answer is recomputed in Pyodide (scripts/verify-items.mts).
 */
import { CHECKED, iq, lessonWriter } from "./v2-shared";

const { L, Q, C } = lessonWriter("aieng");
const M = "RAG";
const src = (label: string, url: string) => ({ label, url, checked: CHECKED });
const S = {
  rag: src("Lewis et al. (2020): Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks", "https://arxiv.org/abs/2005.11401"),
  ragS: src("Gao et al. (2023): Retrieval-Augmented Generation for Large Language Models: A Survey", "https://arxiv.org/abs/2312.10997"),
  dpr: src("Karpukhin et al. (2020): Dense Passage Retrieval for Open-Domain Question Answering", "https://arxiv.org/abs/2004.04906"),
  sbert: src("Reimers and Gurevych (2019): Sentence-BERT", "https://arxiv.org/abs/1908.10084"),
  hnsw: src("Malkov and Yashunin (2016): Efficient and robust approximate nearest neighbor search using HNSW graphs", "https://arxiv.org/abs/1603.09320"),
  colbert: src("Khattab and Zaharia (2020): ColBERT: Efficient and Effective Passage Search via Contextualized Late Interaction over BERT", "https://arxiv.org/abs/2004.12832"),
  lim: src("Liu et al. (2023): Lost in the Middle: How Language Models Use Long Contexts", "https://arxiv.org/abs/2307.03172"),
  ragas: src("Es et al. (2023): Ragas: Automated Evaluation of Retrieval Augmented Generation", "https://arxiv.org/abs/2309.15217"),
  inj: src("Greshake et al. (2023): Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection", "https://arxiv.org/abs/2302.12173"),
};

L("ai-rag-e2e", M, "RAG end to end", "The retrieve-then-generate pipeline, and splitting failures into retrieval vs generation.", {
  kind: "concept", mins: 25,
  hook: "Field officers ask the policy bot 'Can we restructure a loan that's 75 days past due?' It answers confidently and wrongly. Was it retrieval or generation?",
  intuition: `
**The situation.** An LLM doesn't know your internal credit policy, and it changes monthly. RAG gives the model the relevant passages at question time so it can answer from them.

**The pipeline.**

1. **Ingest (offline):** parse documents, split into chunks, embed each chunk, store vectors plus text and metadata (source, date, access level).
2. **Retrieve (online):** embed the question, find the most similar chunks (often combined with keyword search), optionally rerank.
3. **Generate:** put the top chunks in the prompt with instructions to answer only from them and cite sources; say "not found" otherwise.

**Two failure points.** Either the right passage never reached the model (**retrieval failure**), or it did and the model misread, ignored or contradicted it (**generation failure**). Debugging starts by checking which: look at what was retrieved for the failing question.
`,
  maths: `
**In one breath.** End-to-end accuracy $\\approx P(\\text{evidence retrieved}) \\times P(\\text{correct} \\mid \\text{evidence})$; recall@k = share of questions whose evidence is in the top $k$.

**Worked example.** Retrieval recall@5 = 0.80; given the evidence, the model answers correctly 90% of the time; without it, 10% (lucky or general knowledge). Overall: $0.8 \\times 0.9 + 0.2 \\times 0.1 = 0.74$. Raising recall to 0.95 gives $0.855 + 0.005 = 0.86$; perfecting the generator (1.0) with recall 0.80 gives 0.82. Here retrieval is the bigger lever.

**Failure attribution on 100 wrong answers.** Label each: evidence missing from top-k (retrieval), evidence present but answer wrong (generation), question unanswerable from the corpus (coverage). Fix the biggest bucket first.

| Stage | Metric | Typical fix |
|---|---|---|
| Ingest | parse quality, chunk coherence | better parsing, chunking |
| Retrieve | recall@k, MRR | hybrid search, query rewriting, reranking |
| Generate | faithfulness, answer correctness | prompt, citations, model |
| Corpus | coverage | add documents |
`,
  practice: `
**Build order.** Small labelled question set with gold source passages → measure retrieval alone (recall@k) → then end-to-end answers → add complexity (reranking, rewriting) only where measured failures point.

**Prompt for generation.** "Answer only from the passages below; cite passage IDs; if the answer isn't there, say so." Include document date and version so the model can prefer current policy.
`,
  traps: [
    { trap: "The answer is wrong, so switch to a bigger LLM.", why: "If the right passage wasn't retrieved, no model can answer from it. Check retrieval first; it's often the larger lever." },
    { trap: "Evaluate RAG only on final answers.", why: "End-to-end scores mix retrieval and generation failures. Measure retrieval (recall@k) separately with gold passages." },
    { trap: "RAG eliminates hallucination.", why: "It reduces it when evidence is retrieved and the model is told to stay grounded, but models can still ignore or misread passages. Measure faithfulness." },
  ],
  say: {
    prompt: "Walk me through a RAG system and how you'd debug wrong answers.",
    secs: 60,
    check: ["Ingest: parse, chunk, embed, store with metadata", "Retrieve: embed query, similarity/hybrid search, rerank", "Generate: grounded prompt, citations, 'not found' behaviour", "Debug by splitting retrieval vs generation failures (inspect retrieved chunks, recall@k)", "Labelled question set with gold passages"],
    followups: [
      { q: "Recall@5 is 0.8, conditional accuracy 0.9, and 0.1 without evidence. End-to-end accuracy?", a: "0.8 × 0.9 + 0.2 × 0.1 = 0.74." },
      { q: "How do you build a RAG eval set quickly?", a: "Sample real user questions, have experts mark the answering passages and expected answer; supplement with synthetic questions generated from passages, then filter for quality." },
      { q: "What metadata would you store with chunks?", a: "Source document, section, version/effective date, access level, language, and IDs to cite and to delete or update chunks." },
    ],
    answer: `RAG has an offline and an online half. Offline, I parse documents, split them into coherent chunks, embed them and store vectors with the text and metadata like source, effective date and access level. Online, I embed the question, retrieve the most similar chunks, usually combined with keyword search and a reranker, and put the top few in a prompt that tells the model to answer only from them, cite passage IDs and say when the answer isn't there.

To debug, I take the failing questions and check whether the right passage was retrieved. If not, it's a retrieval problem: chunking, embeddings, hybrid search, query rewriting. If it was, it's generation: prompting, ordering, or the model. Measuring recall@k separately from end-to-end accuracy tells me which lever matters more.`,
    avoid: ["“Use a bigger model” as the first fix", "Only measuring final answers"],
  },
  terms: [["Recall@k", "Share of queries whose relevant passage is in the top k."], ["Grounding", "Answering only from provided evidence."], ["Gold passage", "Labelled passage that contains the answer."]],
  sources: [S.rag, S.ragS],
});
Q({ id: "ai-re-1", d: 2, secs: 60, prompt: "Recall@5 = 0.80, accuracy given evidence 0.90, accuracy without evidence 0.10. End-to-end accuracy?", answer: 0.74, tol: 0.002, explain: "0.8 × 0.9 + 0.2 × 0.1 = 0.74.", py: "answer = 0.8*0.9 + 0.2*0.1" });
Q({ id: "ai-re-2", d: 2, secs: 60, prompt: "Same system: which gives higher accuracy, recall → 0.95 (generator unchanged) or generator → 1.0 (recall 0.80)?", options: ["Better retrieval", "Perfect generator", "Equal"], answer: 0, explain: "0.95 × 0.9 + 0.05 × 0.1 = 0.86 vs 0.8 × 1.0 + 0.2 × 0.1 = 0.82.", py: "a = 0.95*0.9 + 0.05*0.1\nb = 0.8*1.0 + 0.2*0.1\nanswer = 0 if a > b else 1" });
Q({ id: "ai-re-3", d: 1, secs: 30, prompt: "Of 100 wrong answers, 55 had no gold passage in the top 5, 35 had it but answered wrong, 10 were unanswerable from the corpus. Share due to retrieval?", answer: 0.55, tol: 0.002, explain: "55/100.", py: "answer = 55/100" });
C("ai-re-c1", "RAG accuracy decomposition", "P(correct) ≈ recall@k × P(correct | evidence) + (1 − recall@k) × P(correct | no evidence).");

L("ai-chunking", M, "Parsing and chunking", "Turning documents into retrievable units: chunk size, overlap, structure and metadata.", {
  kind: "concept", mins: 20, prereq: ["ai-rag-e2e"],
  hook: "The restructuring rule is in a table split across two chunks, and neither chunk alone answers the question. How should you have chunked it?",
  intuition: `
**The situation.** Retrieval returns chunks, not documents. If a chunk cuts a rule in half, mixes two topics, or loses its heading, retrieval and generation both suffer.

**Parsing first.** PDFs, scans and slides need good extraction: tables kept as tables, headings detected, page headers/footers removed, OCR for scans. Bad parsing is the most common silent RAG failure.

**Chunking choices.**

- **Size:** small chunks match questions precisely but lose context; large chunks keep context but dilute the embedding and cost more tokens.
- **Overlap:** repeating a little text between neighbours reduces the chance a fact is cut in two.
- **Boundaries:** split on structure (sections, paragraphs, table rows) rather than fixed character counts.
- **Context enrichment:** prepend the document title and section path to each chunk ("Credit Policy v12 > Restructuring > Eligibility"); or retrieve small chunks but give the model the surrounding parent section.
`,
  maths: `
**In one breath.** With chunk size $c$ and overlap $o$, stride $s = c - o$; number of chunks $\\approx \\lceil (N - c)/s \\rceil + 1$; index size $\\approx$ chunks × (vector bytes + text).

**Worked example.** A 10,000-token document, 500-token chunks, 100-token overlap: stride 400, chunks $= \\lceil 9{,}500/400 \\rceil + 1 = 25$. Overlap adds 25% more chunks than the no-overlap 20.

**Worked example (tokens per answer).** Top-5 retrieval of 500-token chunks puts 2,500 tokens in the prompt; 1,500-token chunks put 7,500. Bigger chunks multiply generation cost.

| Strategy | Good for | Watch out |
|---|---|---|
| Fixed size + overlap | quick baseline | cuts mid-sentence or mid-table |
| Structure-aware (headings, paragraphs) | policies, manuals | uneven sizes |
| Small-to-big (retrieve small, return parent) | precise matching + context | more plumbing |
| Contextual headers | ambiguous sections ("Eligibility") | slightly longer chunks |
`,
  practice: `
**Tune with your eval.** Try 2–3 chunk sizes and strategies, measure recall@k and end-to-end accuracy on the labelled set; there's no universal best size. Keep tables intact (row groups with header repeated). Store chunk metadata: source, section path, page, effective date, access level.

**Updating.** Chunk IDs derived from document + section let you re-index only what changed.
`,
  traps: [
    { trap: "Smaller chunks are always more precise.", why: "Too small loses the context that makes a chunk answerable (the heading, the condition). Precision of matching ≠ usefulness of the passage." },
    { trap: "Parsing is a solved step; focus on embeddings.", why: "Broken tables, merged columns and missing headings ruin retrieval no matter how good the embedding model is. Inspect parsed output." },
    { trap: "Overlap is free.", why: "It increases the number of chunks, index size and duplicate retrieval results. Use modest overlap and deduplicate." },
  ],
  say: {
    prompt: "How do you choose a chunking strategy for a RAG system over policy documents?",
    secs: 45,
    check: ["Parsing quality first (tables, headings, OCR)", "Size trade-off: precision vs context and cost", "Overlap to avoid cut facts; structure-aware boundaries", "Contextual headers / small-to-big retrieval", "Choose by measuring recall@k on a labelled set"],
    followups: [
      { q: "How many chunks does a 10,000-token document make with 500-token chunks and 100 overlap?", a: "Stride 400: ceil(9,500/400) + 1 = 25." },
      { q: "What is small-to-big retrieval?", a: "Index small chunks for precise matching, but pass the larger parent section (or neighbouring chunks) to the model for context." },
      { q: "How do you chunk tables?", a: "Keep rows together with the header repeated in each chunk, or convert to a textual key-value format, so each chunk is self-describing." },
    ],
    answer: `I start with parsing, because broken tables and lost headings ruin everything downstream: I check the extracted text, keep tables intact and strip page furniture. Then I chunk along the document's structure, sections and paragraphs, with a size that balances precise matching against enough context to be answerable, a small overlap so rules aren't cut in half, and each chunk prefixed with its document and section path.

Often I retrieve small chunks and give the model the parent section. I store metadata like source, section, effective date and access level. Then I compare two or three strategies on recall@k and answer accuracy from the labelled question set, because the right size depends on the documents and questions.`,
    avoid: ["“512 tokens is the right size” with no measurement", "Ignoring parsing"],
  },
  terms: [["Chunk overlap", "Tokens shared between consecutive chunks."], ["Small-to-big", "Retrieve small units, return their larger parent."], ["Contextual header", "Document/section path prepended to a chunk."]],
  sources: [S.ragS],
});
Q({ id: "ai-ch-1", d: 2, secs: 60, prompt: "10,000-token document, 500-token chunks, 100-token overlap. Number of chunks?", answer: 25, tol: 0.5, explain: "Stride 400; ceil((10000 − 500)/400) + 1 = 25.", py: "import math\nanswer = math.ceil((10000-500)/400) + 1" });
Q({ id: "ai-ch-2", d: 1, secs: 30, prompt: "Top-5 retrieval with 1,500-token chunks. Retrieved tokens per question?", answer: 7500, tol: 0.5, explain: "5 × 1,500 = 7,500.", py: "answer = 5*1500" });
Q({ id: "ai-ch-3", d: 2, secs: 45, prompt: "Same document without overlap (500-token chunks). How many more chunks does the 100-token overlap create, as a fraction of the no-overlap count?", answer: 0.25, tol: 0.002, explain: "25 vs 20 chunks: 25% more.", py: "import math\na = math.ceil((10000-500)/400)+1\nb = 10000//500\nanswer = (a-b)/b" });
C("ai-ch-c1", "Chunk count", "stride = size − overlap; chunks ≈ ceil((N − size)/stride) + 1.");

L("ai-embeddings-index", M, "Embeddings and vector indexes", "Dense embeddings, similarity, and approximate nearest-neighbour indexes at scale.", {
  kind: "concept", mins: 25, prereq: ["ai-chunking"],
  hook: "Ten lakh chunks, 768-dimension embeddings, 50 ms latency budget. Brute force, HNSW or IVF-PQ?",
  intuition: `
**The situation.** Dense retrieval turns each chunk and query into a vector so that similar meanings end up close together, even with no shared words ("EMI bounce" ≈ "instalment not paid").

**Embedding models.** Bi-encoders (Sentence-BERT, DPR-style) embed query and passage separately, so passages can be embedded once offline. Similarity is usually cosine (or dot product on normalised vectors). Use the same model and normalisation for queries and documents.

**Searching fast.** Comparing the query to every vector is exact but scales linearly. Approximate nearest-neighbour (ANN) indexes trade a little recall for big speed-ups:

- **HNSW:** a layered graph; search walks from coarse to fine layers. Fast, high recall, memory-hungry.
- **IVF:** cluster vectors; search only the nearest few clusters.
- **PQ (product quantisation):** compress vectors into short codes to save memory, with some accuracy loss.
`,
  maths: `
**In one breath.** $\\cos(q, d) = \\frac{q \\cdot d}{\\|q\\|\\|d\\|}$; raw index memory = vectors × dimensions × bytes; brute force cost ∝ vectors × dimensions per query.

**Worked example (cosine).** $q = (1, 2, 2)$, $d = (2, 1, 2)$: $q \\cdot d = 8$, $\\|q\\| = \\|d\\| = 3$, cosine $= 8/9 = 0.889$.

**Worked example (memory).** 10 lakh × 768 dims × 4 bytes (float32) = 3.07 GB. In float16: 1.54 GB. PQ with 96 one-byte codes per vector: 96 MB, about 32× smaller.

**Worked example (brute force).** $10^6 \\times 768 \\approx 7.7 \\times 10^8$ multiply-adds per query: tens of milliseconds on a CPU, fine for small QPS; at 200 QPS you want an ANN index or a GPU.

**Recall vs speed knobs.** HNSW: M (graph degree), efSearch (candidates explored). IVF: nlist (clusters), nprobe (clusters searched). Raise efSearch/nprobe for recall, lower for speed. Measure ANN recall against brute force on a sample.
`,
  practice: `
**Choosing an embedding model.** Evaluate on your own queries (Hindi/English mix, abbreviations like DPD, NACH); domain mismatch hurts. Check max input length, dimension (cost), languages.

**Operations.** Re-embedding the whole corpus is needed when you change embedding models; version indexes. Filter by metadata (access level, date) inside the search, not after, or top-k may be empty after filtering.

**Small corpora** (under ~1 lakh chunks) often need nothing more than brute force in memory.
`,
  traps: [
    { trap: "Mix embeddings from two models in one index.", why: "Vectors from different models live in different spaces; similarities across them are meaningless. Re-embed everything when you switch." },
    { trap: "ANN search returns exactly the nearest neighbours.", why: "It's approximate: recall < 1 by design. Measure it against brute force and tune efSearch/nprobe." },
    { trap: "Filter by permissions after retrieving top-10.", why: "If most of the top-10 are filtered out, the user gets nothing even though allowed matches exist. Use pre-filtering or filtered search." },
  ],
  say: {
    prompt: "How does dense retrieval work, and how do you make it fast at millions of documents?",
    secs: 45,
    check: ["Bi-encoder embeddings; passages embedded offline; same model for queries", "Cosine / dot product on normalised vectors", "ANN indexes: HNSW, IVF, PQ; recall–speed–memory trade-offs", "Memory arithmetic (n × d × bytes)", "Evaluate embedding model and ANN recall on own data; metadata filtering"],
    followups: [
      { q: "Memory for 10 lakh 768-dim float32 vectors?", a: "10⁶ × 768 × 4 bytes ≈ 3.07 GB." },
      { q: "When is brute-force search fine?", a: "Small corpora or low query rates: exact, simple, no tuning; ANN only when latency or cost requires it." },
      { q: "Why do bi-encoders scale better than cross-encoders for retrieval?", a: "Passages are embedded once offline and compared with a cheap dot product; a cross-encoder must run the model on every query–passage pair." },
    ],
    answer: `Dense retrieval uses an embedding model to map each chunk and each query to a vector so that similar meanings are close, and ranks chunks by cosine similarity. Because it's a bi-encoder, chunks are embedded once offline and only the query is embedded at request time.

At millions of chunks, comparing against every vector gets slow and memory-heavy: a million 768-dimension float vectors is about 3 GB. So I'd use an approximate index, HNSW for high recall and speed if memory allows, or IVF with product quantisation to compress vectors, and tune the search breadth against measured recall versus brute force. I'd choose the embedding model by testing on our own queries, filter by access level inside the search, and version the index because changing models means re-embedding everything.`,
    avoid: ["Calling ANN exact", "Mixing embedding models"],
  },
  terms: [["Bi-encoder", "Encodes query and document separately into vectors."], ["HNSW", "Hierarchical navigable small-world graph index."], ["Product quantisation", "Compressing vectors into short codes."], ["ANN recall", "Share of true nearest neighbours an approximate index returns."]],
  sources: [S.sbert, S.dpr, S.hnsw],
});
Q({ id: "ai-ei-1", d: 1, secs: 45, prompt: "Cosine similarity of q = (1, 2, 2) and d = (2, 1, 2)? (3 decimals)", answer: 0.889, tol: 0.002, explain: "8/(3 × 3) = 0.889.", py: "import numpy as np\nq = np.array([1,2,2.]); d = np.array([2,1,2.])\nanswer = float(q@d/np.linalg.norm(q)/np.linalg.norm(d))", packages: ["numpy"] });
Q({ id: "ai-ei-2", d: 1, secs: 30, prompt: "Memory for 10,00,000 vectors of dimension 768 in float32, in GB? (2 decimals)", answer: 3.07, tol: 0.01, explain: "1e6 × 768 × 4 = 3.072e9 bytes.", py: "answer = 1e6*768*4/1e9" });
Q({ id: "ai-ei-3", d: 2, secs: 45, prompt: "PQ stores each 768-dim float32 vector as 96 bytes. Compression ratio?", answer: 32, tol: 0.05, explain: "768 × 4 / 96 = 32.", py: "answer = 768*4/96" });
Q({ id: "ai-ei-4", d: 2, secs: 60, prompt: "An ANN index returns 9 of the true top-10 neighbours on average. What is its recall@10?", answer: 0.9, tol: 0.002, explain: "9/10. Tune efSearch or nprobe to raise it.", py: "answer = 9/10" });
C("ai-ei-c1", "Vector index memory", "n × d × bytes (float32 = 4). PQ shrinks to a few bytes per subvector.");

L("ai-retrieval-metrics", M, "Retrieval metrics: recall@k, MRR and nDCG", "Measuring whether the right passages come back, and how high they rank.", {
  kind: "concept", mins: 20, prereq: ["ai-rag-e2e"],
  hook: "Two retrievers both find the right passage for 90% of questions within the top 10. One puts it first, the other at position 8. Which metric tells them apart?",
  intuition: `
**The situation.** You need retrieval metrics you can compute without running the LLM, so you can iterate on chunking, embeddings and rerankers quickly.

**The main metrics.**

- **Recall@k:** did any relevant passage make the top $k$? Matches RAG directly: the model can only use what's in the top $k$ you pass.
- **Precision@k:** what fraction of the top $k$ is relevant? Matters when irrelevant passages distract the model or cost tokens.
- **MRR (mean reciprocal rank):** average of $1/\\text{rank}$ of the first relevant result. Rewards putting it first.
- **nDCG@k:** uses graded relevance and discounts lower positions logarithmically, normalised by the ideal ranking.

Pick the metric that mirrors how results are used: recall@k for "is it in the context window", MRR/nDCG when order matters (rerankers, lost-in-the-middle).
`,
  maths: `
**In one breath.** MRR $= \\frac1{|Q|}\\sum_q \\frac{1}{\\text{rank}_q}$ (0 if not found); DCG@k $= \\sum_{i=1}^{k}\\frac{\\text{rel}_i}{\\log_2(i + 1)}$, nDCG = DCG / ideal DCG.

**Worked example (MRR).** First relevant results at ranks 1, 3, 2 and not found: $(1 + 1/3 + 1/2 + 0)/4 = 0.458$.

**Worked example (nDCG).** Relevances in returned order (3, 0, 2): DCG $= 3/1 + 0 + 2/\\log_2 4 = 4$. Ideal (3, 2, 0): $3 + 2/\\log_2 3 = 4.262$. nDCG $= 0.939$.

**Recall@k.** 100 questions; the gold passage is in the top 5 for 82: recall@5 = 0.82.

| Metric | Order-aware | Graded relevance | Use for |
|---|---|---|---|
| Recall@k | no | no | what reaches the LLM |
| Precision@k | no | no | noise in context |
| MRR | first hit only | no | single-answer lookup |
| nDCG@k | yes | yes | rerankers, search UX |
`,
  practice: `
**Labelling.** For each eval question, mark the passages that answer it (more than one may). Synthetic questions from passages give cheap labels but are easier than real queries; mix both.

**Report** recall@k for the k you actually use, plus MRR or nDCG for ordering, broken down by question type and language.
`,
  traps: [
    { trap: "Recall@10 is high, so the RAG answers will be good.", why: "Only if you pass 10 passages to the model and it uses them well. If you pass 3, recall@3 is what counts, and order still matters." },
    { trap: "MRR captures everything about ranking quality.", why: "It only looks at the first relevant result; questions needing several passages (multi-hop) need recall@k or nDCG." },
    { trap: "Evaluate only on synthetic questions generated from the passages.", why: "They share wording with the passage and overstate dense and keyword retrieval quality. Include real user questions." },
  ],
  say: {
    prompt: "How would you evaluate the retrieval part of a RAG system?",
    secs: 45,
    check: ["Labelled set: questions with gold passages (real + synthetic)", "Recall@k at the k actually passed to the LLM", "MRR / nDCG for ranking order; precision for noise", "Slices: question types, languages", "Use it to compare chunking, embeddings, hybrid, reranking without running the LLM"],
    followups: [
      { q: "Ranks of first relevant result: 1, 3, 2, missing. MRR?", a: "(1 + 1/3 + 1/2 + 0)/4 ≈ 0.458." },
      { q: "When is nDCG better than MRR?", a: "When several passages matter, relevance is graded, or the order of the whole list matters." },
      { q: "How do you get gold labels cheaply?", a: "Generate questions from passages with an LLM and filter, mine real queries with clicked or cited sources, and have experts label a smaller high-quality set." },
    ],
    answer: `I'd build a labelled set of real and synthetic questions with the passages that answer them, then evaluate retrieval on its own. The headline metric is recall at the k I actually pass to the model: is a gold passage in the context at all. For ranking quality I add MRR, which rewards putting the first relevant passage high, or nDCG when several passages matter or relevance is graded, and precision when irrelevant passages are distracting the model.

I report by slice, like question type and language, and use these metrics to compare chunking, embedding models, hybrid search and rerankers quickly before running end-to-end answer evals.`,
    avoid: ["Only evaluating final answers", "Reporting recall@100 when the model sees 5"],
  },
  terms: [["MRR", "Mean of 1/rank of the first relevant result."], ["nDCG", "Discounted cumulative gain normalised by the ideal ranking."], ["Precision@k", "Fraction of the top k that is relevant."]],
  sources: [S.dpr, S.ragas],
});
Q({ id: "ai-rm-1", d: 1, secs: 45, prompt: "First relevant result at ranks 1, 3, 2, and not found for a 4th query. MRR? (3 decimals)", answer: 0.458, tol: 0.002, explain: "(1 + 1/3 + 1/2 + 0)/4 = 0.458.", py: "answer = (1 + 1/3 + 1/2 + 0)/4" });
Q({ id: "ai-rm-2", d: 2, secs: 90, prompt: "Returned relevances in order (3, 0, 2). nDCG@3? (3 decimals)", answer: 0.939, tol: 0.002, explain: "DCG = 3 + 0 + 2/log₂4 = 4; ideal (3, 2, 0) = 3 + 2/log₂3 = 4.262; 4/4.262 = 0.939.", py: "import numpy as np\nfrom sklearn.metrics import ndcg_score\nanswer = float(ndcg_score([[3,0,2]], [[3,2,1]]))", packages: ["scikit-learn"] });
Q({ id: "ai-rm-3", d: 1, secs: 30, prompt: "Top 5 results contain 2 relevant passages. Precision@5?", answer: 0.4, tol: 0.002, explain: "2/5.", py: "answer = 2/5" });
Q({ id: "ai-rm-4", d: 1, secs: 30, prompt: "The gold passage is in the top 5 for 82 of 100 questions. Recall@5?", answer: 0.82, tol: 0.002, explain: "82/100.", py: "answer = 82/100" });
C("ai-rm-c1", "Retrieval metrics", "Recall@k: in context? MRR: first hit high? nDCG: whole order, graded.");

L("ai-hybrid-rerank", M, "Hybrid search, reranking and query rewriting", "Combining keyword and dense retrieval, reranking with cross-encoders, and fixing bad queries.", {
  kind: "concept", mins: 25, prereq: ["ai-embeddings-index", "ai-retrieval-metrics"],
  hook: "Dense search can't find 'Circular RBI/2024-25/56' and keyword search can't find 'EMI bounced'. How do you get both?",
  intuition: `
**The situation.** Dense retrieval understands paraphrases but fumbles exact identifiers, codes and rare terms. Keyword search (BM25) nails exact matches but misses synonyms. Users ask both kinds of question.

**Hybrid search.** Run both and fuse the ranked lists. Reciprocal rank fusion (RRF) is the simplest robust choice: it uses ranks, so you don't need to calibrate BM25 scores against cosine scores.

**Reranking.** Retrieve a generous candidate set (say 50) cheaply, then score each query–passage pair with a more accurate but slower model: a **cross-encoder** reads query and passage together; **late-interaction** models (ColBERT) compare token-level embeddings. Keep the top 5 for the LLM.

**Query rewriting.** Real queries are short, misspelt, multilingual or depend on chat history ("what about for gold loans?"). An LLM can rewrite them into a standalone query, expand abbreviations, or generate several variants (multi-query) whose results are fused.
`,
  maths: `
**In one breath.** RRF score $= \\sum_{\\text{lists}} \\frac{1}{k + \\text{rank}}$ with $k \\approx 60$; reranking cost = candidates × per-pair latency (batched).

**Worked example (RRF).** Passage A is rank 1 in BM25 and rank 3 in dense: $1/61 + 1/63 = 0.03227$. Passage B is rank 2 in both: $2/62 = 0.03226$. A edges ahead. A passage found by only one list at rank 1 scores $1/61 = 0.0164$.

**Worked example (rerank latency).** 50 candidates, a cross-encoder at 2 ms per pair batched 25 at a time with 15 ms per batch: 2 batches = 30 ms. Reranking 500 candidates would cost 300 ms: candidate count is the latency knob.

**Why rerank.** First-stage retrievers are optimised for recall at large k; rerankers optimise the top few positions, raising MRR/nDCG and what fits in the context.

| Stage | Model | Cost | Optimises |
|---|---|---|---|
| Candidates | BM25 + bi-encoder | ms, scales to millions | recall@50 |
| Rerank | cross-encoder / ColBERT | ms per pair | precision@5, MRR |
| Generation | LLM | most expensive | answer |
`,
  practice: `
**Default recipe.** BM25 + dense with RRF → top 30–100 → cross-encoder rerank → top 3–8 to the LLM. Measure each stage's contribution with recall@k and MRR.

**Rewriting.** Make queries standalone using chat history; expand domain abbreviations (DPD, NPA, NACH) with a glossary; for code-mixed Hindi–English queries, test whether translating or rewriting helps. Log original and rewritten queries.
`,
  traps: [
    { trap: "Add BM25 scores and cosine scores directly.", why: "They're on different, unbounded scales; the sum is dominated by whichever is larger. Use rank-based fusion (RRF) or normalise carefully." },
    { trap: "Rerank the top 5 from dense search.", why: "A reranker can only reorder what it's given; if the right passage isn't in the candidates, reranking can't help. Feed it a larger candidate set." },
    { trap: "Query rewriting is always an improvement.", why: "Rewrites can drift from the user's intent or drop key terms like IDs. Evaluate rewriting and keep the original query in the mix." },
  ],
  say: {
    prompt: "Your RAG retrieval misses exact policy codes and some paraphrased questions. How do you fix it?",
    secs: 45,
    check: ["Hybrid: BM25 for exact terms + dense for semantics", "Rank fusion (RRF), not raw score addition", "Retrieve wide, rerank with a cross-encoder / late interaction", "Query rewriting: standalone queries, abbreviation expansion, multi-query", "Measure each stage (recall@k, MRR) and latency"],
    followups: [
      { q: "Compute the RRF score for ranks 1 and 3 with k = 60.", a: "1/61 + 1/63 ≈ 0.0323." },
      { q: "Cross-encoder vs bi-encoder?", a: "A cross-encoder reads query and passage together and is more accurate but must run per pair at query time; a bi-encoder embeds them separately so passages can be precomputed." },
      { q: "How do you handle a follow-up like 'what about gold loans?'", a: "Rewrite it with the conversation into a standalone query, e.g. 'restructuring eligibility for gold loans at 75 DPD', before retrieval." },
    ],
    answer: `I'd make retrieval hybrid: BM25 catches exact identifiers like circular numbers and product codes, dense embeddings catch paraphrases, and I'd merge the two ranked lists with reciprocal rank fusion so I don't have to calibrate their scores. Then I'd retrieve a wide candidate set, say 50, and rerank with a cross-encoder or ColBERT-style model that reads the query and passage together, passing only the top few to the LLM.

On the query side I'd rewrite follow-ups into standalone queries, expand abbreviations with a glossary, and maybe generate a few query variants. Each change is measured with recall@k and MRR on the labelled set, and I'd watch the reranking latency because cost grows with the number of candidates.`,
    avoid: ["Summing BM25 and cosine scores", "Reranking only a tiny candidate list"],
  },
  terms: [["BM25", "Keyword relevance score using term frequency and inverse document frequency."], ["Reciprocal rank fusion", "Σ 1/(k + rank) across ranked lists."], ["Cross-encoder", "Model scoring a query–passage pair jointly."], ["Late interaction", "Token-level embedding matching (ColBERT)."]],
  sources: [S.colbert, S.dpr, S.ragS],
});
Q({ id: "ai-hr-1", d: 2, secs: 60, prompt: "RRF with k = 60: a passage ranked 1st by BM25 and 3rd by dense. Score? (5 decimals)", answer: 0.03227, tol: 0.00002, explain: "1/61 + 1/63 = 0.016393 + 0.015873 = 0.032266.", py: "answer = 1/61 + 1/63" });
Q({ id: "ai-hr-2", d: 2, secs: 60, prompt: "Same fusion: passage A (ranks 1 and 3) vs passage B (rank 2 in both). Which ranks higher?", options: ["A", "B", "Tie"], answer: 0, explain: "A = 0.032266, B = 2/62 = 0.032258: A by a hair.", py: "a = 1/61 + 1/63\nb = 2/62\nanswer = 0 if a > b else (1 if b > a else 2)" });
Q({ id: "ai-hr-3", d: 1, secs: 45, prompt: "Reranking 50 candidates in batches of 25 at 15 ms per batch. Reranking latency in ms?", answer: 30, tol: 0.5, explain: "2 batches × 15 ms.", py: "import math\nanswer = math.ceil(50/25)*15" });
C("ai-hr-c1", "Hybrid retrieval recipe", "BM25 + dense → RRF → rerank top ~50 → top 3–8 to the LLM.");

L("ai-grounding", M, "Grounded answers, permissions and keeping the index current", "Citations, refusing when unsupported, access control, poisoning, and index freshness.", {
  kind: "concept", mins: 25, prereq: ["ai-rag-e2e"],
  hook: "The bot quotes last year's restructuring policy, cites an HR document a field officer shouldn't see, and once followed instructions hidden in an uploaded PDF. Three separate bugs: what are they?",
  intuition: `
**Grounded answers.** Tell the model to answer only from the provided passages, cite passage IDs for each claim, and say "I couldn't find this in the policy" when the evidence isn't there. When passages conflict, prefer the most recent effective date and say so. Check citations automatically: does the cited passage actually support the sentence?

**Permissions.** The retriever must only return chunks the user is allowed to see: filter by access level inside the search, using the user's identity, not a flag the model controls.

**Poisoning and indirect injection.** Retrieved text is untrusted input. A document can contain "ignore previous instructions…". Mark retrieved content as data, never let it trigger actions without checks, and control what gets indexed.

**Freshness.** Policies change. Track document versions and effective dates, re-index changed documents promptly, delete superseded chunks (or mark them), and show the date in citations.
`,
  maths: `
**In one breath.** Faithfulness = supported claims / total claims; citation precision = citations that support their sentence / citations; staleness = time between a source change and its index update.

**Worked example (faithfulness).** An answer makes 8 claims; 6 are supported by the cited passages, 1 is unsupported, 1 contradicts them: faithfulness 0.75.

**Worked example (freshness).** Policy updates land on the 1st; the index refreshes weekly on Sundays. Worst-case staleness is about 7 days; daily incremental re-indexing cuts it to about 1 day.

**Worked example (permissions).** If 30% of chunks are restricted and you post-filter a top-10, the expected number of allowed results is 7, but for a user who can only see 10% of the corpus it's 1, and often 0. Pre-filtering returns 10 allowed results.
`,
  practice: `
**Answer format.** Short answer, then bullets each with [doc, section, effective date]. "Not found" is a valid, tested outcome: include unanswerable questions in your eval.

**Security.** Separate system instructions from retrieved data; strip or flag instruction-like text in documents; never let retrieved content choose tools or recipients; log which chunks informed each answer.

**Freshness pipeline.** Change detection (hashes, timestamps) → re-parse and re-embed changed docs → delete old chunk IDs → eval smoke test.
`,
  traps: [
    { trap: "Tell the model not to reveal restricted documents.", why: "The model can't enforce access control reliably. Restricted chunks must never be retrieved for that user: filter at the retrieval layer by identity." },
    { trap: "Retrieved documents are trusted because they're ours.", why: "Uploaded or external documents can carry injected instructions or wrong content. Treat retrieved text as data and limit what it can trigger." },
    { trap: "If an answer has citations, it's grounded.", why: "Models sometimes cite passages that don't support the claim. Check citation support automatically or by sampling." },
  ],
  say: {
    prompt: "How do you make a RAG system's answers trustworthy and safe in production?",
    secs: 60,
    check: ["Grounding prompt, per-claim citations, explicit 'not found'", "Measure faithfulness / citation support", "Access control enforced in retrieval by user identity", "Retrieved text is untrusted: indirect prompt injection, poisoning controls", "Freshness: versions, effective dates, incremental re-indexing, deleting superseded chunks"],
    followups: [
      { q: "8 claims, 6 supported. Faithfulness?", a: "6/8 = 0.75." },
      { q: "How do you handle conflicting passages?", a: "Prefer the newest effective version, mention the conflict and cite both, or escalate to a human when policies disagree." },
      { q: "Why is post-filtering by permission a problem?", a: "Top-k may be mostly restricted chunks, leaving few or no allowed results; filter inside the search so k allowed results come back." },
    ],
    answer: `For trust, the prompt makes the model answer only from the passages, cite a passage for each claim and say when the answer isn't there, and I measure faithfulness and whether citations actually support their sentences, including unanswerable questions in the eval. Conflicts are resolved by effective date and surfaced.

For safety, permissions are enforced in retrieval using the user's identity, so restricted chunks never reach the model, and retrieved text is treated as untrusted data: instruction-like content can't trigger actions, and I control what gets indexed. For freshness, every chunk carries a version and effective date, changed documents are re-indexed incrementally, and superseded chunks are deleted, so the bot doesn't quote last year's policy.`,
    avoid: ["“The prompt tells it not to leak” as access control", "Assuming citations are always correct"],
  },
  terms: [["Faithfulness", "Share of answer claims supported by the provided context."], ["Indirect prompt injection", "Malicious instructions embedded in retrieved or external content."], ["Pre-filtering", "Applying metadata/permission filters inside the vector search."]],
  sources: [S.ragas, S.inj, S.lim],
});
Q({ id: "ai-gr-1", d: 1, secs: 30, prompt: "An answer makes 8 claims; 6 are supported by its citations. Faithfulness?", answer: 0.75, tol: 0.002, explain: "6/8.", py: "answer = 6/8" });
Q({ id: "ai-gr-2", d: 2, secs: 60, prompt: "A user can see 10% of chunks (independently). Post-filtering a top-10: probability that none are allowed? (3 decimals)", answer: 0.349, tol: 0.002, explain: "0.9¹⁰ = 0.349: a third of queries return nothing. Pre-filter instead.", py: "answer = 0.9**10" });
Q({ id: "ai-gr-3", d: 1, secs: 30, prompt: "Where must document-level access control be enforced in RAG?", options: ["In the system prompt", "In the retrieval/search layer using the user's identity", "By asking the model to check", "In the UI only"], answer: 1, explain: "Restricted chunks must never be retrieved for that user.", py: "answer = 1" });
C("ai-gr-c1", "Trustworthy RAG", "Cite per claim, 'not found' is valid, permission-filtered retrieval, retrieved text = untrusted, re-index on change.");

L("ai-rag-practice", M, "RAG practice", "Interview scenarios on designing and debugging retrieval-augmented systems.", {
  kind: "interview", mins: 35, prereq: ["ai-rag-e2e", "ai-chunking", "ai-embeddings-index", "ai-retrieval-metrics", "ai-hybrid-rerank", "ai-grounding"],
  hook: "Answer each scenario out loud in about a minute, then open it and tick off the points the interviewer is listening for.",
}, [
  iq("Design a policy Q&A assistant for 2,000 field officers over 300 policy PDFs that change monthly, in English and Hindi.", "Parse PDFs (tables, headings), structure-aware chunks with section path and effective date; hybrid BM25 + multilingual embeddings, rerank; grounded prompt with citations and 'not found'; access control by role in retrieval; incremental re-indexing on change; eval set of real officer questions with gold passages in both languages; monitor recall@k, faithfulness, feedback.", ["Ingestion with metadata", "Hybrid + rerank, multilingual", "Grounding/citations", "Permissions + freshness", "Eval and monitoring"]),
  iq("Users say answers are 'confident but wrong'. Where do you look first?", "Sample failing questions, check whether gold evidence was retrieved: if not, retrieval (chunking, hybrid, rewriting); if yes, generation (prompt grounding, order, conflicting versions). Check for stale or superseded documents and citation support. Add 'not found' behaviour and confidence cues.", ["Retrieval vs generation split", "Stale/conflicting docs", "Citation verification", "Abstention"]),
  iq("Latency is 4 s and the budget is 1.5 s. How do you cut it?", "Profile stages: query rewriting call, embedding, search, rerank, generation (TTFT/output). Options: drop or cache rewriting, smaller reranker or fewer candidates, ANN tuning, fewer/shorter chunks in context, prefix caching for the system prompt, streaming, smaller generator for simple questions.", ["Measure per stage", "Rerank candidate count", "Context size and caching", "Model routing/streaming"]),
  iq("How would you know if switching embedding models is worth it?", "Offline: recall@k/MRR on the labelled set including Hindi and abbreviations, ANN recall, latency and index size; end-to-end answer accuracy on a sample. Cost of re-embedding the corpus and index migration. Then shadow/A-B with online feedback.", ["Offline retrieval metrics", "Language/domain slices", "Re-embedding cost", "Online validation"]),
  iq("A competitor's PDF uploaded by a user caused the bot to recommend their product. What happened and how do you prevent it?", "Indirect prompt injection or content poisoning via retrieved text. Restrict indexing sources and uploads, scope user uploads to that user's session, mark retrieved text as data, detect instruction-like content, don't let retrieved text drive actions, and add evals with adversarial documents.", ["Indirect injection / poisoning", "Source control and scoping", "Data vs instructions", "Adversarial evals"]),
]);
