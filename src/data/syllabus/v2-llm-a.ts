/**
 * v2 NLP & LLMs, part A: Text basics · Tokenisation and language models.
 * Fixed ids. Every quiz answer is recomputed in Pyodide.
 */
import { iq, lessonWriter } from "./v2-shared";
import { LS as S } from "./v2-llm-src";

const { L, Q, C } = lessonWriter("llm");
const TB = "Text basics";
const TK = "Tokenisation and language models";

// ───────────────────────── Text basics ─────────────────────────

L("llm-preprocessing", TB, "Text preprocessing", "Normalising, splitting and cleaning raw text, and when not to.", {
  kind: "concept", mins: 20,
  hook: "You lowercase, strip punctuation and remove stopwords before a sentiment model. Accuracy drops. What did you throw away?",
  intuition: `
**The situation.** Customer complaints arrive as messy text: emojis, Hinglish, typos, "NOT happy!!!", order IDs, URLs. Before classical models can count anything, text has to become a list of comparable units.

**The idea.** Preprocessing is a chain of choices, each of which merges things you consider "the same":

- **Normalisation:** lowercase, Unicode normalisation (é vs e + accent), strip HTML, map URLs/numbers to placeholders.
- **Tokenisation:** split into words or pieces. "don't" → "do" + "n't"? "New Delhi" → one or two?
- **Stopword removal:** drop very common words ("the", "is").
- **Stemming** (chop suffixes by rule: "studies" → "studi") vs **lemmatisation** (map to the dictionary form: "studies" → "study", "better" → "good").

Each merge shrinks the vocabulary and helps count-based models with little data. Each can also destroy signal: "not" is a stopword in most lists, and "US" lowercased becomes "us".

**Modern LLMs** do almost none of this: they use subword tokenisers on raw text and learn what matters. Heavy preprocessing is for bag-of-words pipelines, search, and small data.
`,
  maths: `
**In one breath.** Vocabulary size $|V|$ and sparsity fall as you normalise; the type–token ratio (unique tokens / total tokens) measures how repetitive the text is.

**Worked example.** "The cat sat on the mat. The mat was flat!" Lowercase, strip punctuation: 10 tokens. Remove stopwords {the, on, was}: cat, sat, mat, mat, flat → 5 tokens, 4 types.

**Type–token ratio.** "to be or not to be": 6 tokens, 4 types, TTR = 0.667. TTR falls as texts get longer (common words repeat), so compare it only between texts of similar length.

**Zipf's law.** Word frequency is roughly proportional to $1/\\text{rank}$: a handful of words make up most tokens, and most types appear once or twice. That's why stopwords dominate counts and why rare words are a modelling problem.

| Step | Shrinks vocabulary by | Risk |
|---|---|---|
| Lowercasing | merging case variants | "US" → "us", "Apple" → "apple" |
| Stopword removal | dropping frequent words | negation ("not"), question words |
| Stemming | crude suffix rules | over-merging ("university"/"universe") |
| Lemmatisation | dictionary forms | needs POS tags, slower |
| Placeholders | URLs, numbers → tokens | lose exact values |
`,
  practice: `
**Defaults.**

- Classical pipeline (TF-IDF + linear model): lowercase, strip markup, light tokenisation; keep negations; try with and without stopwords and pick by validation.
- Search and keyword matching: stemming or lemmatisation improves recall.
- Transformers: feed raw text (after removing junk like HTML); the model's own tokeniser must be used exactly as in pre-training.

**Indian-language and code-mixed text.** Transliteration ("acha", "accha", "achha") and script mixing need normalisation rules or a multilingual subword tokeniser; stopword lists from English libraries don't apply.

**Keep the raw text.** Store it alongside the processed version; preprocessing choices change, labels don't.
`,
  traps: [
    { trap: "Always remove stopwords.", why: "Standard lists include negations and pronouns. For sentiment, “not good” becomes “good”. Validate the choice; for transformers, don't remove them at all." },
    { trap: "Stemming and lemmatisation are the same thing.", why: "Stemming chops by rule and can produce non-words (“studi”); lemmatisation maps to a dictionary form using part of speech (“better” → “good”)." },
    { trap: "Preprocess text the same way before feeding a pretrained LLM.", why: "The model was trained on raw text with its own tokeniser. Lowercasing or stripping punctuation creates inputs it rarely saw and usually hurts." },
  ],
  say: {
    prompt: "How would you preprocess customer reviews for a sentiment classifier?",
    secs: 45,
    check: ["Depends on the model: classical pipeline vs pretrained transformer", "Normalise (case, Unicode, markup, URLs/numbers) and tokenise", "Careful with stopwords: keep negations", "Stemming vs lemmatisation trade-off", "Validate each choice on held-out data; keep raw text"],
    followups: [
      { q: "Why does Zipf's law matter for NLP?", a: "A few words cover most tokens and most words are rare. Counts are dominated by function words, and rare words have unreliable statistics, which motivates stopword handling, smoothing, TF-IDF weighting and subword tokenisation." },
      { q: "When would you lemmatise rather than stem?", a: "When you need real words (interpretability, downstream lookups) or accuracy on irregular forms. Stemming is faster and fine for search recall." },
      { q: "How do you handle emojis?", a: "For sentiment they carry signal: keep them as tokens or map to descriptive tokens (e.g. :angry_face:). Transformer tokenisers usually handle them as bytes." },
    ],
    answer: `It depends on the model. For a TF-IDF plus logistic regression baseline I'd lowercase, strip HTML and URLs, map numbers to a placeholder, and tokenise, but I'd keep negations like "not" even if I remove other stopwords, because they flip sentiment. I might lemmatise to merge word forms, and I'd keep emojis as tokens. Every step I'd keep or drop based on validation score.

For a pretrained transformer I'd do almost nothing beyond removing junk, because the model expects raw text and its own tokeniser. In both cases I'd store the raw text so I can change preprocessing later.`,
    avoid: ["Removing stopwords without checking negations", "Lowercasing input for a pretrained cased model"],
  },
  terms: [["Token / type", "A token is an occurrence; a type is a distinct word."], ["Stemming", "Rule-based suffix stripping."], ["Lemmatisation", "Mapping to the dictionary form."], ["Zipf's law", "Frequency ∝ 1/rank."]],
  sources: [S.slp3],
});
Q({ id: "llm-pre-1", d: 1, secs: 60, prompt: "\"The cat sat on the mat. The mat was flat!\" Lowercase, remove punctuation, drop the stopwords {the, on, was}. How many distinct tokens remain?", answer: 4, tol: 0.5, explain: "cat, sat, mat, mat, flat → 4 types (5 tokens).", py: "import re\nt = re.findall(r'[a-z]+', 'The cat sat on the mat. The mat was flat!'.lower())\nanswer = len({w for w in t if w not in {'the','on','was'}})" });
Q({ id: "llm-pre-2", d: 1, secs: 30, prompt: "Type–token ratio of \"to be or not to be\"? (3 decimals)", answer: 0.667, tol: 0.002, explain: "4 types / 6 tokens.", py: "t = 'to be or not to be'.split()\nanswer = len(set(t))/len(t)" });
Q({ id: "llm-pre-3", d: 1, secs: 30, prompt: "Which is the output of lemmatisation (not stemming) for \"studies\"?", options: ["studi", "study", "stud", "studies"], answer: 1, explain: "Lemmatisation returns the dictionary form; a Porter-style stemmer gives \"studi\".", py: "answer = 1" });
Q({ id: "llm-pre-4", d: 2, secs: 60, prompt: "Under Zipf's law (frequency ∝ 1/rank), how many times more frequent is the rank-1 word than the rank-50 word?", answer: 50, tol: 0.5, explain: "f₁/f₅₀ = 50/1.", py: "answer = (1/1)/(1/50)" });
C("llm-pre-c1", "Stopwords and sentiment", "Standard stopword lists contain “not”: keep negations for sentiment.");
C("llm-pre-c2", "Preprocessing for transformers", "Feed raw text through the model's own tokeniser; no lowercasing or stopword removal.");

L("llm-tfidf", TB, "Bag-of-words, n-grams and TF-IDF", "Turning documents into sparse count vectors and weighting words by how informative they are.", {
  kind: "concept", mins: 20, prereq: ["llm-preprocessing"],
  hook: "\"Refund\" appears in 3% of support tickets and \"the\" in 99%. How should a model weigh them?",
  intuition: `
**The situation.** You need a fast baseline to route support tickets to teams. No GPU, 20,000 labelled tickets.

**The idea.** Ignore word order and represent each document by **counts** of the words it contains: a vector with one slot per vocabulary word, almost all zeros (**bag of words**). Add **n-grams** (pairs, triples of adjacent words) to recover a little order: "not good", "credit card".

Raw counts overweight common words. **TF-IDF** multiplies how often a term appears in this document (**term frequency**) by how rare it is across documents (**inverse document frequency**). "Refund" in a ticket is strong evidence; "the" is nothing.

Linear models on TF-IDF vectors are fast, interpretable and still hard to beat on short, keyword-driven tasks with modest data.
`,
  maths: `
**In one breath.** $\\text{tfidf}(t, d) = \\text{tf}(t, d)\\cdot\\log\\frac{N}{\\text{df}(t)}$, then L2-normalise each document vector; compare documents by cosine similarity.

**Worked example.** $N = 1000$ documents, "refund" appears in 10: idf $= \\ln(100) = 4.605$. In a 100-word ticket with 3 occurrences, tf $= 0.03$, tf-idf $= 0.138$. A word in every document gets idf $\\ln 1 = 0$.

**Variants.** tf as raw count, frequency, or sublinear $1 + \\log(\\text{count})$; smoothed idf $\\ln\\frac{1 + N}{1 + \\text{df}} + 1$ (scikit-learn's default), so terms in every document don't vanish completely.

**n-grams.** A sentence of $n$ tokens has $n - 1$ bigrams and $n - 2$ trigrams. Vocabulary grows fast: cap with min_df / max_features.

**Cosine similarity.** $\\cos(a, b) = \\frac{a\\cdot b}{\\|a\\|\\|b\\|}$: (1, 1, 0) vs (1, 0, 1) → 0.5. Length-normalisation means long documents don't win just by being long.

| Representation | Captures | Misses |
|---|---|---|
| Binary BoW | which words appear | frequency, order |
| Counts / TF | frequency | rarity, order |
| TF-IDF | informativeness | synonyms, order beyond n |
| n-grams | local order, phrases | long-range structure |
| Embeddings | meaning, synonyms | exact keywords (sometimes) |
`,
  practice: `
**Baseline recipe.** \`TfidfVectorizer(ngram_range=(1, 2), min_df=2, sublinear_tf=True)\` → logistic regression or linear SVM. Fit the vectoriser inside the pipeline (idf uses document frequencies, which leak if computed on test data).

**Where it still wins.** Short texts with decisive keywords (routing, spam, intent), very limited compute, needing to explain decisions by listing words, and as a sparse retriever (BM25 is a cousin of TF-IDF).

**Limits.** Synonyms ("refund"/"money back") are unrelated dimensions; word order beyond n-grams is lost; out-of-vocabulary words are ignored.
`,
  traps: [
    { trap: "Fit the TF-IDF vectoriser on all documents, then split.", why: "IDF is computed from document frequencies, so test documents influence training features. Fit inside the pipeline on training folds." },
    { trap: "Bag of words can't handle negation at all.", why: "Unigrams can't, but bigrams like “not good” capture the most common cases cheaply." },
    { trap: "Higher TF-IDF means the word is more important for the label.", why: "TF-IDF measures distinctiveness in the corpus, not predictive value. The classifier's weights tell you what predicts the label." },
  ],
  say: {
    prompt: "Explain TF-IDF and when you'd still use it instead of embeddings.",
    secs: 45,
    check: ["Bag of words: sparse count vectors, order ignored (n-grams add local order)", "TF × IDF: frequent in this doc, rare across docs", "Formula idf = log(N/df); normalisation and cosine similarity", "Use cases: fast baseline, keyword-driven tasks, interpretability, sparse retrieval", "Limits: no synonyms, no long-range order; fit inside pipeline"],
    followups: [
      { q: "Why take the log in IDF?", a: "To dampen the effect: a word in 1 of a million documents shouldn't be a million times more important than a word in every document. The log makes weights grow slowly with rarity." },
      { q: "Why L2-normalise TF-IDF vectors?", a: "So document length doesn't dominate similarity and model scores; cosine similarity then equals a dot product." },
      { q: "How would you handle a 2-million-word vocabulary?", a: "min_df/max_df pruning, max_features, the hashing trick (HashingVectorizer), or move to subword/embedding representations." },
    ],
    answer: `Bag of words represents a document as counts over the vocabulary, ignoring order; adding bigrams captures phrases like "not good". TF-IDF reweights each count by inverse document frequency, log of N over the number of documents containing the word, so words that are frequent here but rare overall get high weight and words like "the" get almost none. Vectors are usually L2-normalised and compared with cosine similarity.

I'd still use it as a first baseline, for short keyword-driven tasks like ticket routing or spam, when compute is tight, when I need to explain decisions by listing words, and for sparse retrieval alongside dense embeddings. Its weaknesses are no notion of synonyms and no word order beyond the n-grams.`,
    avoid: ["“TF-IDF understands meaning”", "Computing IDF on test documents"],
  },
  terms: [["Bag of words", "Document as word counts, order ignored."], ["IDF", "log(N/df): rarity across documents."], ["n-gram", "Sequence of n adjacent tokens."], ["Cosine similarity", "Dot product of normalised vectors."]],
  sources: [S.slp3],
});
Q({ id: "llm-tf-1", d: 1, secs: 45, prompt: "1,000 documents; a term appears in 10 of them. IDF = ln(N/df)? (3 decimals)", answer: 4.605, tol: 0.002, explain: "ln(100) = 4.605.", py: "import math\nanswer = math.log(1000/10)" });
Q({ id: "llm-tf-2", d: 2, secs: 60, prompt: "That term appears 3 times in a 100-word document. TF-IDF with tf = count/length and idf = ln(100)? (3 decimals)", answer: 0.138, tol: 0.002, explain: "0.03 × 4.605 = 0.138.", py: "import math\nanswer = 3/100*math.log(100)" });
Q({ id: "llm-tf-3", d: 1, secs: 20, prompt: "How many bigrams does a 10-token sentence contain?", answer: 9, tol: 0.5, explain: "n − 1 = 9.", py: "t = list(range(10))\nanswer = len(list(zip(t, t[1:])))" });
Q({ id: "llm-tf-4", d: 1, secs: 30, prompt: "Cosine similarity of count vectors (1, 1, 0) and (1, 0, 1)?", answer: 0.5, tol: 0.002, explain: "1/(√2·√2) = 0.5.", py: "import numpy as np\na, b = np.array([1,1,0.]), np.array([1,0,1.])\nanswer = float(a@b/np.linalg.norm(a)/np.linalg.norm(b))", packages: ["numpy"] });
Q({ id: "llm-tf-5", d: 2, secs: 60, prompt: "scikit-learn's smoothed IDF is ln((1 + N)/(1 + df)) + 1. For a term in all N = 9 documents, what is it?", answer: 1, tol: 0.002, explain: "ln(10/10) + 1 = 1: terms in every document keep a small weight instead of zero.", py: "import numpy as np\nfrom sklearn.feature_extraction.text import TfidfVectorizer\nv = TfidfVectorizer().fit(['aa bb']*9)\nanswer = float(v.idf_[v.vocabulary_['aa']])", packages: ["scikit-learn"] });
C("llm-tf-c1", "TF-IDF", "tf(t, d) × log(N/df(t)); then L2-normalise.");

L("llm-text-clf", TB, "Text classification: naive Bayes vs logistic regression", "Strong classical baselines for text, how they differ, and when to move to transformers.", {
  kind: "concept", mins: 25, prereq: ["llm-tfidf", "cml-naive-bayes", "cml-logreg"],
  hook: "You have 300 labelled complaints and a deadline tomorrow. Fine-tune BERT, or something else first?",
  intuition: `
**The situation.** Classify tickets into "fraud", "delivery", "refund", "other". Labelled data is small and you need a baseline today.

**Two classical workhorses.**

- **Multinomial naive Bayes:** count how often each word appears in each class, combine with Bayes' rule. One pass over the data, no tuning, works with very little data.
- **Logistic regression (or linear SVM) on TF-IDF:** learns a weight per word (and bigram) directly for the decision. Needs a bit more data, usually more accurate, handles correlated words better.

Both are **linear in the word features**: each word pushes the score towards one class. That's why they're fast and explainable, and why they miss meaning that depends on context ("not bad at all").

**When to move on.** Fine-tuning a pretrained transformer typically wins when meaning depends on context, labels are subtle, or there are a few thousand examples. With only hundreds, a zero/few-shot LLM or embeddings + logistic regression is often the better next step.
`,
  maths: `
**In one breath.** NB: $\\log P(c) + \\sum_w n_w\\log P(w \\mid c)$; LR: $\\sigma(\\sum_w x_w\\beta_w + b)$ trained by log loss. Both give a linear score in the word features.

**Worked example (NB).** Prior 0.5 each. $P(\\text{great} \\mid +) = 0.05$, $P(\\text{great} \\mid -) = 0.01$, $P(\\text{boring} \\mid +) = 0.002$, $P(\\text{boring} \\mid -) = 0.02$. "great boring": positive score $0.5 \\times 0.05 \\times 0.002 = 10^{-4}$, negative $0.5 \\times 0.01 \\times 0.02 = 2\\times10^{-4}$. $P(+) = 1/3$.

**Parameter counts.** Binary LR on a 20,000-word vocabulary: 20,001 parameters. Multiclass with $K$ classes: $K \\times 20{,}001$ (softmax). NB stores $K \\times |V|$ probabilities plus priors.

**Generative vs discriminative (Ng and Jordan's result in words).** NB reaches its (higher) asymptotic error with fewer examples; LR reaches a lower error with more. Small data: try NB; more data: LR.

| | Naive Bayes | Logistic regression | Fine-tuned transformer |
|---|---|---|---|
| Data needed | tens–hundreds | hundreds–thousands | hundreds–thousands+ |
| Training cost | one pass | seconds–minutes | GPU minutes–hours |
| Context / negation | no | via n-grams | yes |
| Explainability | word likelihoods | word weights | attribution methods |
| Calibrated probs | poor | decent | decent after calibration |
`,
  practice: `
**Order of attack.** Majority-class and keyword baselines → TF-IDF + LR (and NB) with CV → sentence-embedding model + LR → fine-tuned small transformer (DistilBERT-size) → LLM zero/few-shot if labels are scarce or change often.

**Imbalance and multilabel.** Use class weights and PR metrics; for multilabel (a ticket can be "refund" and "delivery"), one-vs-rest binary classifiers with per-label thresholds.

**Error analysis.** Read 50 misclassified examples before changing models; mislabelled data and ambiguous label definitions are common culprits.
`,
  traps: [
    { trap: "Start with a fine-tuned transformer; baselines are a waste of time.", why: "A TF-IDF baseline takes minutes, often gets within a few points, and tells you whether the problem is the model or the labels." },
    { trap: "Naive Bayes and logistic regression make the same predictions since both are linear.", why: "Same model family, different training: NB estimates per-word likelihoods independently (double-counting correlated words); LR fits weights jointly to the labels." },
    { trap: "More labelled data always beats a better model.", why: "Only if labels are consistent. Noisy or ambiguous label definitions cap accuracy for every model; fix the guidelines first." },
  ],
  say: {
    prompt: "You need a ticket classifier with 300 labelled examples. Walk me through your approach.",
    secs: 60,
    check: ["Quick baselines: TF-IDF + NB / logistic regression with cross-validation", "Explain why: little data, fast, interpretable", "Next steps: sentence embeddings + LR, few-shot LLM, fine-tuning when data grows", "Metrics suited to imbalance; per-class view", "Error analysis and label quality"],
    followups: [
      { q: "Why might NB beat LR at 300 examples but lose at 30,000?", a: "NB's strong independence assumption acts like heavy regularisation, so it converges quickly with little data; LR has lower bias and overtakes it as data grows." },
      { q: "How would you use an LLM here?", a: "Zero- or few-shot classification with clear label definitions and examples, measured on a held-out labelled set; or use it to pre-label data for human review, then train a cheaper model." },
      { q: "How do you explain a single prediction from logistic regression on TF-IDF?", a: "Multiply each present feature's value by its weight; the largest contributions are the words driving the decision." },
    ],
    answer: `With 300 examples I'd start with fast baselines: TF-IDF with unigrams and bigrams into logistic regression, and multinomial naive Bayes, evaluated with stratified cross-validation and per-class F1. Naive Bayes often does well with this little data; logistic regression usually wins as data grows, and both are explainable through word weights.

If that's not good enough, the next cheap step is sentence embeddings from a pretrained model with a logistic regression on top, or a few-shot LLM with clear label definitions, scored on the same held-out set. Fine-tuning a small transformer makes sense once there are a few thousand labels. Throughout, I'd read misclassified tickets, because unclear label definitions often limit accuracy more than the model.`,
    avoid: ["Jumping straight to fine-tuning a large model", "Reporting accuracy on imbalanced classes"],
  },
  terms: [["Multinomial NB", "Naive Bayes on word counts."], ["Linear text classifier", "Score = weighted sum of word features."], ["One-vs-rest", "One binary classifier per label."]],
  sources: [S.slp3],
});
Q({ id: "llm-clf-1", d: 2, secs: 90, prompt: "Equal priors. P(great|+) = 0.05, P(great|−) = 0.01, P(boring|+) = 0.002, P(boring|−) = 0.02. Naive Bayes P(+ | \"great boring\")? (3 decimals)", answer: 0.333, tol: 0.002, explain: "Scores 1e-4 vs 2e-4 → 1/3.", py: "p = 0.5*0.05*0.002; n = 0.5*0.01*0.02\nanswer = p/(p+n)" });
Q({ id: "llm-clf-2", d: 1, secs: 30, prompt: "Binary logistic regression on a 20,000-word TF-IDF vocabulary. Number of parameters including the intercept?", answer: 20001, tol: 0.5, explain: "One weight per feature plus the bias.", py: "answer = 20000 + 1" });
Q({ id: "llm-clf-3", d: 2, secs: 45, prompt: "Softmax regression over 5 classes on the same 20,000 features (with intercepts). Parameter count?", answer: 100005, tol: 0.5, explain: "5 × (20,000 + 1).", py: "answer = 5*(20000+1)" });
Q({ id: "llm-clf-4", d: 2, secs: 90, prompt: "Train TF-IDF + logistic regression on ['good movie', 'great film', 'bad movie', 'awful film'] with labels [1, 1, 0, 0]. Predicted label for 'good film'?", answer: 1, tol: 0.5, explain: "\"good\" carries a positive weight and \"film\" appears once in each class, so the prediction is positive.", py: "from sklearn.feature_extraction.text import TfidfVectorizer\nfrom sklearn.linear_model import LogisticRegression\nfrom sklearn.pipeline import make_pipeline\nm = make_pipeline(TfidfVectorizer(), LogisticRegression()).fit(['good movie','great film','bad movie','awful film'], [1,1,0,0])\nanswer = int(m.predict(['good film'])[0])", packages: ["scikit-learn"] });
C("llm-clf-c1", "NB vs LR for text", "NB: wins with tiny data. LR: lower error with more data. Both linear in word features.");

L("llm-word-embeddings", TB, "Word embeddings: word2vec and GloVe", "Dense vectors where similar words sit close together, how they're learned, and their limits.", {
  kind: "concept", mins: 25, prereq: ["llm-tfidf"],
  hook: "\"Refund\" and \"money back\" share no letters. How can a model learn they mean the same thing from raw text alone?",
  intuition: `
**The situation.** In TF-IDF every word is its own axis, so "refund" and "reimbursement" are as different as "refund" and "banana".

**The idea (distributional hypothesis).** Words that appear in similar contexts have similar meanings. Train a model to predict a word's neighbours (or a word from its neighbours); the hidden vector it learns for each word places words with similar contexts close together.

- **word2vec skip-gram:** from a centre word, predict each word within a window around it.
- **CBOW:** predict the centre word from the average of its context.
- **GloVe:** factorise a global word–word co-occurrence matrix so that dot products match log co-occurrence counts.

The result: 100–300-dimensional dense vectors where cosine similarity reflects relatedness, and some relations show up as directions (king − man + woman ≈ queen, though less cleanly than the famous example suggests).

**The big limitation:** one vector per word. "Bank" (river) and "bank" (money) share one vector. Contextual embeddings from transformers fix this.
`,
  maths: `
**In one breath.** Skip-gram maximises $\\sum\\log\\sigma(u_{c}^\\top v_w) + \\sum_{k}\\log\\sigma(-u_{n_k}^\\top v_w)$ (negative sampling) over (word, context) pairs within a window.

**Training pairs.** Window 2 on a 5-word sentence: centre positions have 2, 3, 4, 3, 2 neighbours → 14 (centre, context) pairs.

**Negative sampling.** A full softmax over a 100k vocabulary per pair is expensive. Instead, push up the score of the true context word and push down $k$ (5–20) random "negative" words, sampled with frequency$^{0.75}$.

**Cosine.** $(1, 2, 2)$ vs $(2, 1, 2)$: $8/9 = 0.889$.

**Size.** Vocabulary 50,000 × 300 dimensions = 15 million parameters per embedding matrix (word2vec keeps an input and an output matrix).

**Analogies.** Solve $b - a + c$ and take the nearest word by cosine, excluding $a$, $b$, $c$ themselves (otherwise the answer is often one of the inputs).

| Method | Trains on | Strength |
|---|---|---|
| Skip-gram | (word, context) pairs | rare words |
| CBOW | context → word | faster, frequent words |
| GloVe | global co-occurrence counts | uses corpus statistics directly |
| fastText | character n-grams too | handles misspellings and unseen words |
| Contextual (BERT etc.) | whole sentences | different vector per occurrence |
`,
  practice: `
**Uses today.** Fast features for small models, similarity search over a vocabulary, initialising embeddings for small networks, and teaching intuition for what transformers do at their first layer.

**Choosing.** For most products, sentence-embedding models (pretrained transformers) beat averaged word vectors. Word vectors remain useful offline, on-device, or for domain jargon trained on your own corpus.

**Bias.** Embeddings learn associations in the text, including social stereotypes; audit them if they feed decisions about people.
`,
  traps: [
    { trap: "king − man + woman = queen shows embeddings understand gender.", why: "It works only when you exclude the input words, and many analogies fail. It shows some relations are roughly linear directions, not understanding." },
    { trap: "Word2vec gives each meaning of a word its own vector.", why: "One vector per word type: senses are mixed. Contextual embeddings give one vector per occurrence." },
    { trap: "Average the word vectors of a sentence and you get its meaning.", why: "Averaging loses order and negation (“not good” ≈ “good”) and is dominated by frequent words. It's a baseline, not a sentence encoder." },
  ],
  say: {
    prompt: "How does word2vec learn word meaning, and what are its limitations?",
    secs: 45,
    check: ["Distributional hypothesis: similar contexts → similar meaning", "Skip-gram / CBOW: predict context from word (or reverse) within a window", "Negative sampling instead of full softmax", "Dense vectors; cosine similarity; analogies as directions", "Limits: one vector per word type, no context, bias; contextual embeddings fix this"],
    followups: [
      { q: "Skip-gram vs CBOW?", a: "Skip-gram predicts each context word from the centre word: more training signal per rare word, better for rare words. CBOW predicts the centre from averaged context: faster, smoother for frequent words." },
      { q: "How does fastText handle unseen words?", a: "It represents a word as the sum of its character n-gram vectors, so an unseen or misspelled word still gets a vector from its pieces." },
      { q: "How are these different from BERT embeddings?", a: "BERT produces a vector for each token occurrence that depends on the whole sentence, so “bank” gets different vectors in different contexts." },
    ],
    answer: `Word2vec relies on the distributional hypothesis: words in similar contexts have similar meanings. Skip-gram slides a window over text and trains a shallow network to predict the words around each centre word; CBOW does the reverse. To avoid a softmax over the whole vocabulary, negative sampling scores the true context word against a few random words. The learned vectors place related words close in cosine similarity, and some relations appear as consistent directions.

The limits: one vector per word, so senses like river bank and money bank are mixed; no sentence context; out-of-vocabulary words get nothing unless you use subword methods like fastText; and they absorb biases from the corpus. Contextual embeddings from transformers address the first two.`,
    avoid: ["Claiming analogies prove understanding", "“Word2vec is a deep network” (it's shallow)"],
  },
  terms: [["Distributional hypothesis", "Meaning is reflected in the contexts a word appears in."], ["Skip-gram", "Predict context words from the centre word."], ["Negative sampling", "Contrast the true context word with k random words."]],
  sources: [S.w2v, S.glove, S.slp3],
});
Q({ id: "llm-emb-1", d: 1, secs: 30, prompt: "Cosine similarity of (1, 2, 2) and (2, 1, 2)? (3 decimals)", answer: 0.889, tol: 0.002, explain: "8/(3 × 3).", py: "import numpy as np\na, b = np.array([1,2,2.]), np.array([2,1,2.])\nanswer = float(a@b/np.linalg.norm(a)/np.linalg.norm(b))", packages: ["numpy"] });
Q({ id: "llm-emb-2", d: 2, secs: 60, prompt: "Skip-gram with window 2 on a 5-word sentence. How many (centre, context) training pairs?", answer: 14, tol: 0.5, explain: "Neighbours per position: 2, 3, 4, 3, 2.", py: "n, w = 5, 2\nanswer = sum(1 for i in range(n) for j in range(n) if i != j and abs(i-j) <= w)" });
Q({ id: "llm-emb-3", d: 1, secs: 30, prompt: "Parameters in one embedding matrix for a 50,000-word vocabulary with 300 dimensions?", answer: 15000000, tol: 0.5, explain: "50,000 × 300.", py: "answer = 50000*300" });
Q({ id: "llm-emb-4", d: 3, secs: 90, prompt: "Toy vectors: man (1, 0, 0), woman (1, 1, 0), king (1, 0, 1). Candidates: queen (1, 1, 1), prince (1, 0, 1.2), girl (0.5, 1, 0). Which is nearest (cosine) to king − man + woman?", options: ["queen", "prince", "girl"], answer: 0, explain: "king − man + woman = (1, 1, 1), identical in direction to queen.", py: "import numpy as np\nv = np.array([1,0,1.]) - np.array([1,0,0.]) + np.array([1,1,0.])\nc = [np.array([1,1,1.]), np.array([1,0,1.2]), np.array([0.5,1,0.])]\ns = [float(v@x/np.linalg.norm(v)/np.linalg.norm(x)) for x in c]\nanswer = int(np.argmax(s))", packages: ["numpy"] });
C("llm-emb-c1", "Static vs contextual embeddings", "word2vec/GloVe: one vector per word. Transformers: one vector per occurrence.");

L("llm-text-practice", TB, "Text basics practice", "Interview scenarios on preprocessing, sparse features, classical text classifiers and embeddings.", {
  kind: "interview", mins: 30, prereq: ["llm-preprocessing", "llm-tfidf", "llm-text-clf", "llm-word-embeddings"],
  hook: "Answer each out loud in about a minute, then open it and tick off the points the interviewer is listening for.",
}, [
  iq("Your TF-IDF sentiment model labels \"not bad at all\" as negative. Why, and what would you change?", "Unigram features see \"bad\" (negative) and lose the negation, especially if \"not\" was removed as a stopword. Keep negations, add bigrams/trigrams, or mark negation scope (prefix words after \"not\"). If context matters often, move to sentence embeddings or a fine-tuned transformer.", ["Unigrams lose negation", "Stopword removal dropped \"not\"", "n-grams / negation handling", "Contextual model if common"]),
  iq("How would you build a search box for 50,000 internal policy documents with no labelled data?", "Start with BM25/TF-IDF keyword search for exact terms, add dense retrieval with a pretrained sentence-embedding model for paraphrases, and combine scores (hybrid). Evaluate with a small hand-made set of queries and relevant documents (recall@k, MRR).", ["Sparse keyword baseline", "Dense embeddings for meaning", "Hybrid", "Small labelled eval set and metrics"]),
  iq("Explain why word2vec places \"Mumbai\" and \"Pune\" close together.", "Both appear in similar contexts (\"flights to\", \"office in\", \"rains in\"). Skip-gram learns vectors that predict context words, so words with overlapping contexts get similar vectors. Closeness reflects contextual similarity, not a definition.", ["Distributional hypothesis", "Training objective predicts contexts", "Similarity ≠ synonymy"]),
  iq("A colleague lowercases and removes punctuation before sending text to a pretrained LLM. Good idea?", "Usually not. The model was pre-trained on raw text with its own tokeniser; case and punctuation carry meaning (\"US\" vs \"us\", question marks). Only remove genuine junk such as HTML or boilerplate.", ["Model expects raw text", "Case/punctuation carry signal", "Remove only junk"]),
  iq("You have 2,000 labelled tickets across 30 categories, very imbalanced. What do you build first?", "TF-IDF + logistic regression with class weights as the baseline, stratified CV, macro-F1 and per-class recall. Merge or relabel tiny classes if their definitions overlap. Then compare sentence embeddings + LR; consider an LLM for the rare classes or for pre-labelling more data.", ["Linear baseline with class weights", "Macro metrics, per-class view", "Fix label taxonomy", "Embeddings / LLM as next steps"]),
]);

// ───────────────────────── Tokenisation and language models ─────────────────────────

L("llm-ngram-lm", TK, "N-gram language models", "Predicting the next word from the previous few with counts, and smoothing for unseen sequences.", {
  kind: "concept", mins: 25,
  hook: "Your phone keyboard suggests the next word after \"good\". Before neural networks, how was that done, and why did it break on long contexts?",
  intuition: `
**The situation.** A language model assigns a probability to text, or equivalently predicts the next token given the previous ones. Every LLM is one; n-gram models are the simplest version and set up the vocabulary used everywhere else (context, smoothing, perplexity).

**The idea.** By the chain rule, $P(w_1 \\dots w_n) = \\prod_i P(w_i \\mid w_1 \\dots w_{i-1})$. N-gram models make the **Markov assumption**: only the last $n - 1$ words matter. A bigram model uses one previous word; a trigram uses two. Estimate each probability by counting.

**The problem.** Language is sparse. Most possible trigrams never appear in training, so their count, and probability, is zero, and one zero makes a whole sentence impossible. **Smoothing** moves a little probability mass to unseen events. Even with smoothing, n-grams can't use context beyond a few words, which is exactly what neural LMs fixed.
`,
  maths: `
**In one breath.** MLE bigram: $P(w_i \\mid w_{i-1}) = \\frac{c(w_{i-1}w_i)}{c(w_{i-1})}$; add-one (Laplace): $\\frac{c(w_{i-1}w_i) + 1}{c(w_{i-1}) + V}$; sentence probability is the product of the conditionals.

**Worked examples.**

- "cat" appears 10 times, "cat sat" 3 times: $P(\\text{sat} \\mid \\text{cat}) = 0.3$.
- Add-one with $V = 1000$ for an unseen bigram after "cat": $1/1010 \\approx 0.00099$. Add-one shifts far too much mass to unseen events when $V$ is large; better smoothers do less damage.
- $P(\\text{the} \\mid \\langle s\\rangle) = 0.5$, $P(\\text{cat} \\mid \\text{the}) = 0.2$, $P(\\langle/s\\rangle \\mid \\text{cat}) = 0.1$: $P(\\text{"the cat"}) = 0.01$.

**Sparsity.** With $V = 10{,}000$ there are $10^{12}$ possible trigrams; a billion-word corpus sees a tiny fraction.

**Better smoothing.** Interpolation (mix trigram, bigram and unigram estimates with weights λ), backoff (use the lower order when the higher is unseen), and Kneser–Ney (lower-order estimates based on how many different contexts a word follows: "Francisco" is frequent but almost only after "San").

**Log space.** Multiply many small probabilities and you underflow; sum log probabilities instead.
`,
  practice: `
**Where n-grams still appear.** Spelling correction and keyboard suggestions on device, as features (n-gram overlap in BLEU/ROUGE), in data deduplication and filtering for LLM pre-training (n-gram hashing), and as a sanity-check baseline for perplexity.

**Neural LMs fixed** sparsity (similar contexts share parameters through embeddings) and context length (RNNs, then transformers over thousands of tokens).
`,
  traps: [
    { trap: "An unseen n-gram just gets probability zero; that's fine.", why: "One zero factor makes the whole sentence probability zero and perplexity infinite. Smoothing is required." },
    { trap: "Add-one smoothing is good enough.", why: "With a large vocabulary it gives most of the mass to unseen events and distorts seen ones. Use interpolation or Kneser–Ney." },
    { trap: "Higher n is always better.", why: "Longer contexts are sparser: counts get unreliable fast. Trigrams to 5-grams with good smoothing is the classical sweet spot." },
  ],
  say: {
    prompt: "Explain how an n-gram language model works and its main weaknesses.",
    secs: 45,
    check: ["Chain rule; Markov assumption on the last n − 1 words", "Probabilities from counts (MLE)", "Sparsity → zeros → smoothing (add-one, interpolation, backoff, Kneser–Ney)", "Evaluated by perplexity; log space", "Limits: short context, no sharing between similar words → neural LMs"],
    followups: [
      { q: "What's the intuition behind Kneser–Ney?", a: "A word's lower-order probability should reflect how many distinct contexts it appears after, not its raw count. “Francisco” is frequent but almost only after “San”, so it's a poor guess in new contexts." },
      { q: "How do neural language models solve sparsity?", a: "They map words to embeddings, so similar words and contexts share parameters; a context never seen exactly still gets sensible predictions." },
      { q: "Why compute in log space?", a: "Products of many probabilities underflow floating point; summing logs is stable and turns products into sums." },
    ],
    answer: `A language model assigns probabilities to sequences using the chain rule: each word conditioned on all previous ones. An n-gram model approximates that by conditioning only on the previous n minus 1 words and estimates each probability by counting, for example count of "cat sat" over count of "cat".

The main problem is sparsity: most n-grams never appear, so they'd get zero probability and zero out whole sentences. Smoothing fixes that, from simple add-one to interpolation, backoff and Kneser–Ney. Even smoothed, n-grams only see a few words of context and treat similar words as unrelated, which is what neural language models fixed with embeddings and, later, transformers over long contexts.`,
    avoid: ["Forgetting smoothing", "“Use a 10-gram for more context”"],
  },
  terms: [["Markov assumption", "Next word depends only on the last n − 1 words."], ["MLE estimate", "Relative frequency from counts."], ["Smoothing", "Reserving probability for unseen events."], ["Kneser–Ney", "Smoothing based on continuation counts."]],
  sources: [S.slp3],
});
Q({ id: "llm-ng-1", d: 1, secs: 30, prompt: "\"cat\" occurs 10 times and \"cat sat\" 3 times. MLE estimate of P(sat | cat)?", answer: 0.3, tol: 0.002, explain: "3/10.", py: "answer = 3/10" });
Q({ id: "llm-ng-2", d: 2, secs: 45, prompt: "Add-one smoothing, V = 1,000, count(cat) = 10, the bigram \"cat zebra\" never seen. P(zebra | cat)? (5 decimals)", answer: 0.00099, tol: 0.00001, explain: "(0 + 1)/(10 + 1000) = 0.00099.", py: "answer = 1/(10+1000)" });
Q({ id: "llm-ng-3", d: 1, secs: 30, prompt: "P(the|<s>) = 0.5, P(cat|the) = 0.2, P(</s>|cat) = 0.1. Probability of the sentence \"the cat\"?", answer: 0.01, tol: 0.0002, explain: "0.5 × 0.2 × 0.1.", py: "answer = 0.5*0.2*0.1" });
Q({ id: "llm-ng-4", d: 1, secs: 30, prompt: "With a 10,000-word vocabulary, how many possible trigrams are there? Give log₁₀ of the number.", answer: 12, tol: 0.05, explain: "10,000³ = 10¹².", py: "import math\nanswer = math.log10(10000**3)" });
Q({ id: "llm-ng-5", d: 2, secs: 90, prompt: "Bigram MLE from the corpus \"<s> I am Sam </s> <s> Sam I am </s> <s> I do not like ham </s>\". P(I | <s>)? (3 decimals)", answer: 0.667, tol: 0.002, explain: "<s> appears 3 times, followed by \"I\" twice.", py: "t = '<s> I am Sam </s> <s> Sam I am </s> <s> I do not like ham </s>'.split()\nb = list(zip(t, t[1:]))\nanswer = sum(1 for x in b if x == ('<s>','I')) / sum(1 for x in t[:-1] if x == '<s>')" });
C("llm-ng-c1", "Bigram MLE", "P(w | v) = c(v w)/c(v). Add-one: (c(v w) + 1)/(c(v) + V).");

L("llm-perplexity", TK, "Cross-entropy and perplexity", "How language models are scored, what the numbers mean, and how to compare across tokenisers.", {
  kind: "concept", mins: 20, prereq: ["llm-ngram-lm"],
  hook: "Model A has perplexity 12, model B has 9. Can you say B is better if they use different tokenisers?",
  intuition: `
**The situation.** You train a language model and need one number for how well it predicts held-out text.

**The idea.** Average the negative log probability the model gave to each actual next token: that's the **cross-entropy** (the training loss). **Perplexity** is its exponential: the effective number of equally likely choices the model is hesitating between at each step. A model that spreads probability uniformly over 50,000 tokens has perplexity 50,000; one that always puts probability 1 on the right token has perplexity 1.

Lower is better, but only when comparing on the **same text with the same tokenisation**. A tokeniser that splits text into more, easier tokens gets lower per-token perplexity without being a better model. Per-byte or per-character measures fix that.
`,
  maths: `
**In one breath.** $H = -\\frac1N\\sum_i \\ln p(w_i \\mid w_{<i})$ nats/token; $\\text{PP} = e^{H} = \\big(\\prod_i p_i\\big)^{-1/N}$; bits per byte $= \\frac{H}{\\ln 2}\\cdot\\frac{\\text{tokens}}{\\text{bytes}}$.

**Worked examples.**

- Token probabilities 0.25, 0.5, 0.125, 0.5: product $= 1/128$; PP $= 128^{1/4} = 3.36$.
- Uniform over $V = 50{,}000$: PP = 50,000.
- Loss 2.0 nats/token: PP $= e^2 = 7.39$.
- Same loss with 4 bytes per token on average: $2.0/\\ln 2/4 = 0.721$ bits per byte.

**Why it's the training loss.** Cross-entropy between the data distribution and the model is minimised (equal to the data's entropy) exactly when the model matches the true next-token distribution, so lowering it is maximum likelihood.

**Floors.** Natural text has irreducible uncertainty, so perplexity never reaches 1 on real data. Scaling-law curves approach that entropy floor.
`,
  practice: `
**Use perplexity for** comparing checkpoints of the same model, tracking pre-training, choosing data mixtures, and detecting distribution shift (perplexity spikes on unusual text; also used to filter low-quality data).

**Don't use it for** comparing models with different tokenisers (use bits per byte), or judging chat/instruction quality: a fine-tuned assistant can have higher perplexity on web text and be far more useful.

**Watch for** contamination: if the evaluation text appeared in training data, perplexity is meaninglessly low.
`,
  traps: [
    { trap: "Lower perplexity always means a better model.", why: "Only for the same test text and tokenisation. Different tokenisers change the number of tokens and the difficulty of each one." },
    { trap: "Perplexity measures how good the answers are.", why: "It measures next-token prediction on reference text. Helpfulness, factuality and instruction-following need task evaluations." },
    { trap: "Perplexity and cross-entropy are different metrics.", why: "Perplexity is just exp(cross-entropy) (with matching log base). They always rank models the same way." },
  ],
  say: {
    prompt: "What is perplexity and what are its pitfalls as an evaluation metric?",
    secs: 45,
    check: ["Cross-entropy = average negative log-likelihood per token", "Perplexity = exp(cross-entropy); effective branching factor", "Lower is better; uniform over V gives V", "Only comparable with same tokeniser and test set; bits per byte otherwise", "Doesn't measure task quality; contamination"],
    followups: [
      { q: "Why is cross-entropy the right training loss for LMs?", a: "Minimising it is maximum likelihood; it's minimised when the model's distribution equals the data distribution, and its gradient with softmax is simply p − y." },
      { q: "How would you compare a model with a 32k vocabulary to one with 128k?", a: "Use bits per byte or per character on the same raw text, which removes the dependence on how many tokens each tokeniser produces." },
      { q: "Can perplexity detect data issues?", a: "Yes: unusually low perplexity on a benchmark suggests it leaked into training; unusually high perplexity flags out-of-distribution or garbage text, used for data filtering." },
    ],
    answer: `Cross-entropy is the average negative log probability the model assigns to each actual next token in held-out text; it's also the training loss. Perplexity is its exponential, which you can read as the effective number of choices the model is torn between: uniform over a 50,000-token vocabulary gives 50,000, perfect prediction gives 1.

The pitfalls: numbers are only comparable on the same text with the same tokeniser, because a tokeniser that makes more, easier tokens lowers per-token perplexity; bits per byte fixes that. It measures next-token prediction, not whether answers are helpful or correct, so chat models are judged on tasks. And if test text leaked into training, perplexity is misleadingly low.`,
    avoid: ["Comparing perplexities across tokenisers", "Using perplexity as the only quality metric for an assistant"],
  },
  terms: [["Cross-entropy", "Average negative log-likelihood per token."], ["Perplexity", "exp(cross-entropy)."], ["Bits per byte", "Tokenisation-independent loss: total bits / total bytes."]],
  sources: [S.slp3],
});
Q({ id: "llm-pp-1", d: 2, secs: 60, prompt: "A model assigns the true tokens probabilities 0.25, 0.5, 0.125 and 0.5. Perplexity? (2 decimals)", answer: 3.36, tol: 0.01, explain: "(1/128)^(−1/4) = 128^0.25 = 3.36.", py: "import numpy as np\np = np.array([0.25,0.5,0.125,0.5])\nanswer = float(np.exp(-np.log(p).mean()))", packages: ["numpy"] });
Q({ id: "llm-pp-2", d: 1, secs: 20, prompt: "A model predicts uniformly over a 50,000-token vocabulary. Perplexity?", answer: 50000, tol: 1, explain: "exp(ln 50000) = 50,000.", py: "import math\nanswer = math.exp(-math.log(1/50000))" });
Q({ id: "llm-pp-3", d: 1, secs: 30, prompt: "Validation loss is 2.0 nats per token. Perplexity? (2 decimals)", answer: 7.39, tol: 0.01, explain: "e² = 7.39.", py: "import math\nanswer = math.exp(2.0)" });
Q({ id: "llm-pp-4", d: 2, secs: 60, prompt: "Loss 2.0 nats/token, and the tokeniser averages 4 bytes per token. Bits per byte? (3 decimals)", answer: 0.721, tol: 0.002, explain: "2.0/ln 2 = 2.885 bits/token ÷ 4 = 0.721.", py: "import math\nanswer = 2.0/math.log(2)/4" });
C("llm-pp-c1", "Perplexity", "exp(average negative log-likelihood per token). Uniform over V → V.");

L("llm-subword-tokenisation", TK, "Subword tokenisation: BPE, WordPiece, Unigram", "How LLM vocabularies are built, why they're subwords, and how tokenisation affects cost and behaviour.", {
  kind: "concept", mins: 30, prereq: ["llm-ngram-lm"],
  hook: "Why does an LLM struggle to count the letters in \"strawberry\", and why does the same sentence cost more tokens in Hindi than in English?",
  intuition: `
**The situation.** Word-level vocabularies explode (every name, typo and inflection) and still miss new words. Character-level models make sequences very long. LLMs use **subwords**: frequent words stay whole, rare words split into reusable pieces.

**BPE (byte-pair encoding).** Start from characters (or bytes). Count adjacent pairs in the training corpus, merge the most frequent pair into a new token, repeat until the vocabulary reaches the target size (e.g. 32k–200k). To tokenise new text, apply the learned merges in order.

**WordPiece** (BERT) picks the merge that most increases training-data likelihood, roughly frequency of the pair divided by the frequencies of its parts. **Unigram** (T5, via SentencePiece) starts with a large vocabulary and prunes tokens whose removal hurts likelihood least. **Byte-level** BPE (GPT-2 onwards) starts from 256 bytes, so any input can be encoded and there's no unknown token.

**Consequences.** The model never sees letters inside a token, hence spelling and counting quirks. Languages and scripts under-represented in the tokeniser's training data split into many more tokens: higher cost, shorter effective context, often worse quality.
`,
  maths: `
**In one breath.** BPE: repeatedly merge the most frequent adjacent pair; WordPiece score $= \\frac{\\text{freq}(ab)}{\\text{freq}(a)\\,\\text{freq}(b)}$; vocabulary size trades sequence length against embedding/softmax size.

**Worked example (BPE first merge).** Word counts: hug ×10, pug ×5, pun ×12, bun ×4, hugs ×5. Pair counts: h+u 15, u+g 20, p+u 17, u+n 16, b+u 4, g+s 5. First merge: u+g → "ug".

**Worked example (WordPiece score).** freq(u) = 36, freq(g) = 20, freq(ug) = 20: score $= 20/(36 \\times 20) = 0.028$. A rarer pair that almost always occurs together can score higher than a frequent pair.

**Vocabulary arithmetic.** GPT-2: 256 byte tokens + 50,000 merges + 1 end-of-text = 50,257.

**Fertility.** Tokens per word. At 1.3 tokens/word, a 4,096-token context holds about 3,150 words; at 3 tokens/word (poorly covered script), about 1,365.

| Algorithm | Used by | Builds vocabulary by |
|---|---|---|
| BPE / byte-level BPE | GPT family, Llama | greedy frequent-pair merges |
| WordPiece | BERT family | likelihood-based merges |
| Unigram (SentencePiece) | T5, many multilingual models | pruning a large candidate set |

**Vocabulary size trade-off.** Larger vocabulary → shorter sequences (cheaper attention, longer effective context) but bigger embedding and output matrices and rarer tokens with less training signal.
`,
  practice: `
**Practical consequences.**

- **Cost and limits** are in tokens: estimate with the model's actual tokeniser, not word counts.
- **Never mix tokenisers:** a fine-tuned model must use the tokeniser it was pre-trained with.
- **Numbers and code:** digit splitting affects arithmetic; whitespace handling affects code. Some tokenisers split numbers digit by digit for this reason.
- **Multilingual products:** check fertility for your users' languages; it drives cost and latency.
- **Adding tokens** (domain terms, special tokens) requires resizing embeddings and training them.

**Debugging.** When a model behaves strangely on an input (leading spaces, rare Unicode, glued words), look at the token IDs first.
`,
  traps: [
    { trap: "Token count ≈ word count.", why: "For English it's roughly 1.3 tokens per word; for code, numbers and many non-Latin scripts it can be 2–4×. Measure with the real tokeniser." },
    { trap: "The model sees individual letters, so spelling tasks are easy.", why: "It sees token IDs. “strawberry” may be 2–3 tokens; letter-level questions require knowledge the model can only partly infer." },
    { trap: "A bigger vocabulary is always better.", why: "Shorter sequences, but larger embedding/softmax matrices and rarer tokens with less training signal. It's a trade-off chosen with the data mix." },
  ],
  say: {
    prompt: "Explain how BPE tokenisation works and why LLMs use subwords.",
    secs: 45,
    check: ["Word-level vocabularies explode and miss new words; characters make sequences long", "BPE: start from characters/bytes, repeatedly merge the most frequent pair", "Byte-level base means no unknown tokens", "Mentions WordPiece / Unigram differences", "Consequences: cost in tokens, multilingual fertility, spelling/number quirks"],
    followups: [
      { q: "How does WordPiece choose merges differently from BPE?", a: "It scores a pair by how much merging increases likelihood, roughly freq(ab)/(freq(a)·freq(b)), preferring pairs that co-occur more than chance rather than simply the most frequent pair." },
      { q: "Why do some languages cost more tokens?", a: "If the tokeniser's training data had little of that language, few merges cover it, so words split into many short pieces (high fertility): more tokens per sentence, higher cost, shorter effective context." },
      { q: "What breaks if you fine-tune with a different tokeniser?", a: "Token IDs no longer correspond to the embeddings the model learned, so inputs become meaningless; you must use the original tokeniser or retrain embeddings." },
    ],
    answer: `Word vocabularies are huge and still miss new words, while characters make sequences very long, so LLMs use subwords. BPE starts from characters, or bytes in byte-level BPE, counts adjacent pairs in a corpus, merges the most frequent pair into a new token, and repeats until it reaches the vocabulary size. New text is tokenised by applying those merges, so common words become one token and rare words split into pieces, and with a byte-level base there's never an unknown token. WordPiece and Unigram are variants that choose tokens by likelihood rather than raw frequency.

This matters in practice: cost and context limits are in tokens; languages under-represented in the tokeniser's training data need many more tokens per sentence; and because the model sees token IDs rather than letters, spelling and digit-level tasks can be surprisingly hard.`,
    avoid: ["“Tokens are words”", "Ignoring multilingual cost"],
  },
  terms: [["BPE", "Byte-pair encoding: greedy merges of frequent adjacent pairs."], ["Byte-level BPE", "BPE starting from 256 bytes; no unknown tokens."], ["Fertility", "Average tokens per word."], ["SentencePiece", "Library that tokenises raw text (spaces as ▁) with BPE or Unigram."]],
  sources: [S.hfTok, S.sennrich],
});
Q({ id: "llm-bpe-1", d: 2, secs: 90, prompt: "BPE on word counts hug ×10, pug ×5, pun ×12, bun ×4, hugs ×5 (characters as the start). Which pair is merged first?", options: ["u + g", "p + u", "u + n", "h + u"], answer: 0, explain: "u+g occurs 10 + 5 + 5 = 20 times, more than p+u (17), u+n (16) or h+u (15).", py: "from collections import Counter\nw = {'hug':10,'pug':5,'pun':12,'bun':4,'hugs':5}\nc = Counter()\nfor s, n in w.items():\n    for a, b in zip(s, s[1:]):\n        c[a+b] += n\nanswer = ['ug','pu','un','hu'].index(c.most_common(1)[0][0])" });
Q({ id: "llm-bpe-2", d: 2, secs: 90, prompt: "Same corpus. WordPiece score freq(ug)/(freq(u) × freq(g))? (4 decimals)", answer: 0.0278, tol: 0.0002, explain: "freq(u) = 36, freq(g) = 20, freq(ug) = 20 → 20/720.", py: "w = {'hug':10,'pug':5,'pun':12,'bun':4,'hugs':5}\nfu = sum(n*s.count('u') for s, n in w.items()); fg = sum(n*s.count('g') for s, n in w.items())\nfug = sum(n*s.count('ug') for s, n in w.items())\nanswer = fug/(fu*fg)" });
Q({ id: "llm-bpe-3", d: 1, secs: 30, prompt: "A byte-level BPE vocabulary has 256 byte tokens, 50,000 merges and one end-of-text token. Vocabulary size?", answer: 50257, tol: 0.5, explain: "256 + 50,000 + 1 (GPT-2's vocabulary).", py: "answer = 256 + 50000 + 1" });
Q({ id: "llm-bpe-4", d: 1, secs: 45, prompt: "At 1.3 tokens per word, about how many words fit in a 4,096-token context?", answer: 3151, tol: 2, explain: "4096/1.3 ≈ 3,151.", py: "answer = 4096/1.3" });
C("llm-bpe-c1", "BPE training", "Start from bytes/characters; repeatedly merge the most frequent adjacent pair.");
C("llm-bpe-c2", "Tokeniser trade-off", "Bigger vocab: shorter sequences, bigger embedding/softmax, rarer tokens.");

L("llm-edit-distance", TK, "Edit distance and spelling correction", "Levenshtein distance by dynamic programming and the noisy-channel model for correcting typos.", {
  kind: "concept", mins: 20,
  hook: "A user types \"recieve\". How do you decide they meant \"receive\" and not \"relieve\"?",
  intuition: `
**The situation.** Search queries, addresses and names arrive misspelled. You need to measure how different two strings are and pick the most likely intended word.

**Edit distance.** The minimum number of single-character insertions, deletions and substitutions to turn one string into another (Levenshtein). "kitten" → "sitting" takes 3. It's computed with dynamic programming over a table of prefix-to-prefix distances.

**Noisy-channel correction.** Think of the typo as the intended word passed through a noisy keyboard. Pick the candidate $w$ that maximises $P(w)\\,P(\\text{typo} \\mid w)$: how common the word is (a language model) times how likely that particular error is (an error model, often based on edit distance and keyboard layout). A rare word that's one plausible slip away can lose to a common word that's slightly farther.
`,
  maths: `
**In one breath.** $D[i][j] = \\min(D[i-1][j] + 1,\\; D[i][j-1] + 1,\\; D[i-1][j-1] + [a_i \\ne b_j])$, $O(mn)$ time; correction $\\hat w = \\arg\\max_w P(w)P(x \\mid w)$.

**Worked example.** kitten → sitting: substitute k→s, e→i, insert g: distance 3. "intention" → "execution": 5 with unit substitution cost (8 if substitutions cost 2, as in some textbook versions).

**Noisy channel.** Candidate A: $P(A) = 0.001$, $P(\\text{typo} \\mid A) = 0.01$ → $10^{-5}$. Candidate B: $P(B) = 0.0001$, $P(\\text{typo} \\mid B) = 0.2$ → $2\\times10^{-5}$. B wins despite being 10× rarer.

**Variants.** Damerau–Levenshtein adds transpositions ("recieve" ↔ "receive" in one step); weighted costs reflect keyboard distance; Jaro–Winkler for short strings like names.

| Use | Typical tool |
|---|---|
| Spell correction | noisy channel with LM + error model |
| Fuzzy name matching (KYC, dedup) | Levenshtein / Jaro–Winkler + blocking |
| Evaluating ASR/OCR | word/character error rate = edit distance / reference length |
| DNA, diffs | alignment by the same DP |
`,
  practice: `
**At scale.** Comparing every pair is $O(n^2)$ comparisons each $O(mn)$: use blocking (same first letter, phonetic code), BK-trees, or n-gram indexes to get candidates first.

**Word error rate.** ASR/OCR quality = (substitutions + deletions + insertions)/reference words, an edit distance over words, which can exceed 100%.

**Coding rounds.** Edit distance is a standard DP problem: be ready to write the table version and reduce memory to two rows.
`,
  traps: [
    { trap: "Pick the candidate with the smallest edit distance.", why: "Ignores how common each word is. The noisy channel weighs the word's prior probability against how likely the error is." },
    { trap: "Edit distance is symmetric, so cost choices don't matter.", why: "With unit costs it's symmetric, but weighted costs (e.g. substitution = 2) change the numbers and sometimes the best alignment." },
    { trap: "Word error rate can't exceed 100%.", why: "Insertions count too; a hypothesis with many extra words can exceed 100%." },
  ],
  say: {
    prompt: "How would you build a spelling corrector for search queries?",
    secs: 45,
    check: ["Generate candidates within small edit distance (with transpositions)", "Noisy channel: argmax P(word) × P(typo | word)", "Language model / query logs for P(word); error model for P(typo | word)", "Efficient candidate generation (indexes, blocking)", "Use context (neighbouring words) and evaluate on real typos"],
    followups: [
      { q: "Write the recurrence for edit distance.", a: "D[i][j] = min(D[i−1][j] + 1, D[i][j−1] + 1, D[i−1][j−1] + cost), with cost 0 if characters match else 1; D[i][0] = i, D[0][j] = j." },
      { q: "How do you reduce memory to O(n)?", a: "Each row depends only on the previous row, so keep two rows (or one row and a variable) instead of the full table." },
      { q: "How do you use context?", a: "Score candidates with an n-gram or neural LM over the whole query, so “new yrok times” picks “york” because “new york times” is likely." },
    ],
    answer: `I'd generate candidates within edit distance one or two of the typed word, including transpositions, using an index over the vocabulary so it's fast. Then I'd rank them with the noisy-channel model: the probability of the candidate word, from query logs or a language model, times the probability of that particular error given the word, from an error model based on edit operations and keyboard proximity.

Using the surrounding words as context helps a lot, so I'd score whole-query candidates with a language model. I'd evaluate on real misspellings from logs, measuring how often the top suggestion is right and how often we wrongly "correct" a valid query.`,
    avoid: ["Choosing purely by smallest edit distance", "Correcting valid rare words aggressively"],
  },
  terms: [["Levenshtein distance", "Min insertions, deletions and substitutions."], ["Noisy channel", "Choose w maximising P(w)·P(observed | w)."], ["Word error rate", "Word-level edit distance / reference length."]],
  sources: [S.slp3],
});
Q({ id: "llm-ed-1", d: 2, secs: 90, prompt: "Levenshtein distance (unit costs) between \"kitten\" and \"sitting\"?", answer: 3, tol: 0.5, explain: "k→s, e→i, insert g.", py: "def lev(a, b):\n    D = [[i+j if i*j == 0 else 0 for j in range(len(b)+1)] for i in range(len(a)+1)]\n    for i in range(1, len(a)+1):\n        for j in range(1, len(b)+1):\n            D[i][j] = min(D[i-1][j]+1, D[i][j-1]+1, D[i-1][j-1]+(a[i-1] != b[j-1]))\n    return D[-1][-1]\nanswer = lev('kitten', 'sitting')" });
Q({ id: "llm-ed-2", d: 2, secs: 90, prompt: "Levenshtein distance (unit costs) between \"intention\" and \"execution\"?", answer: 5, tol: 0.5, explain: "5 edits with unit substitution cost.", py: "def lev(a, b):\n    D = [[i+j if i*j == 0 else 0 for j in range(len(b)+1)] for i in range(len(a)+1)]\n    for i in range(1, len(a)+1):\n        for j in range(1, len(b)+1):\n            D[i][j] = min(D[i-1][j]+1, D[i][j-1]+1, D[i-1][j-1]+(a[i-1] != b[j-1]))\n    return D[-1][-1]\nanswer = lev('intention', 'execution')" });
Q({ id: "llm-ed-3", d: 2, secs: 60, prompt: "Candidate A: P(A) = 0.001, P(typo | A) = 0.01. Candidate B: P(B) = 0.0001, P(typo | B) = 0.2. Which does the noisy channel choose?", options: ["A", "B", "Tie"], answer: 1, explain: "A: 1e-5. B: 2e-5.", py: "a = 0.001*0.01; b = 0.0001*0.2\nanswer = 1 if b > a else 0" });
Q({ id: "llm-ed-4", d: 2, secs: 45, prompt: "A 10-word reference transcript; the ASR output has 1 substitution, 1 deletion and 2 insertions. Word error rate?", answer: 0.4, tol: 0.002, explain: "(1 + 1 + 2)/10.", py: "answer = (1+1+2)/10" });
C("llm-ed-c1", "Edit distance DP", "D[i][j] = min(D[i−1][j]+1, D[i][j−1]+1, D[i−1][j−1]+[a_i ≠ b_j]).");

L("llm-tokenisation-practice", TK, "Tokenisation and language models practice", "Interview scenarios on n-grams, perplexity, tokenisers and string distance.", {
  kind: "interview", mins: 30, prereq: ["llm-ngram-lm", "llm-perplexity", "llm-subword-tokenisation", "llm-edit-distance"],
  hook: "Answer each out loud in about a minute, then open it and tick off the points the interviewer is listening for.",
}, [
  iq("Your chatbot's API bill is 2.5× higher for Hindi users than English users with similar conversations. Why?", "Cost is per token, and the tokeniser splits Hindi (Devanagari) into many more tokens per word because it saw less of it during tokeniser training (higher fertility). Options: a model/tokeniser with better Indic coverage, shorter prompts and history summarisation, caching, or transliteration where acceptable.", ["Billing in tokens", "Fertility differs by script/language", "Tokeniser training data coverage", "Mitigations"]),
  iq("Two teams report validation perplexity 8.1 and 10.4 on different tokenisers. Which model is better?", "You can't tell from those numbers. Per-token perplexity depends on the tokenisation. Compare bits per byte (or per character) on the same raw text, plus downstream task metrics.", ["Not comparable across tokenisers", "Bits per byte on same text", "Task evaluations"]),
  iq("Why can't an n-gram model handle \"The keys that the man who lives next door left on the table are…\" well?", "Predicting \"are\" requires agreeing with \"keys\" many words back; an n-gram model only sees the last few words (\"the table\"), and counts for long contexts are too sparse anyway. Neural models with long context and shared representations handle this.", ["Markov window too short", "Sparsity of long n-grams", "Neural / transformer context"]),
  iq("A KYC system must match customer names across two databases with typos and transliteration variants. Approach?", "Normalise (case, punctuation, honorifics, transliteration rules), block candidates (phonetic codes, first letters, DOB), score pairs with edit distance / Jaro–Winkler and other fields, set thresholds from a labelled sample with precision/recall targets, and route borderline cases to human review.", ["Normalisation", "Blocking for scale", "String similarity + other fields", "Thresholds from labelled data; human review"]),
  iq("An LLM fails to count the 'r's in a word but answers harder questions. Explain.", "The model operates on tokens, not characters; the word may be one or two tokens, so letter-level structure isn't directly visible. It must have learned spellings indirectly. Asking it to spell the word out (one letter per token) first usually fixes it.", ["Tokens not characters", "Indirect knowledge of spelling", "Workaround: spell out first"]),
]);
