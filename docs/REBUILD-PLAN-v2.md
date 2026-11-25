# Rebuild plan v2: depth rebuild (Python, DSA, maths, ML, DL, LLMs, AI engineering, system design)

Supersedes the concept map in REBUILD-PLAN.md. Benchmark for depth: aimlrounds.com (lesson size, lesson anatomy, practice + quiz per module, role mocks). Their syllabus is used only as a coverage check; all text, examples, widgets and questions here are original.

Deadline unchanged: all content built and verified by **Jan 10, 2027**; your review Jan 10–13; fixes before Jan 27.

## Status

- Nov 25: all eight v2 tracks built in parallel and integrated: Python 79, DSA 59, Maths for ML 65, Classical ML 24, Deep learning 45, NLP & LLMs 38, AI engineering 49, ML system design 29 (388 lessons). 2,577 auto-checked answers verified in CI.
- Nov 25 (later): Classical ML "Time series" module (6 lessons) added, so every planned module now has lessons (394 total, 2,599 verified answers). Mock rounds live at /mock: 3 timed rounds per role drawn from the roadmap, fresh questions each attempt, results saved in the browser.
- Still open: owner's sample review and fixes.

## Scope

In: Python, DSA, maths for ML (linear algebra, calculus and optimisation, probability, statistics, information theory, A/B testing), classical ML, deep learning, NLP and LLMs, AI engineering, ML/AI system design.

Frozen (stay on the site as they are, no new work): SQL, Product, Consulting, aptitude/LR/DILR, Excel/BI, HR.

Phase 2 (only if time is left after Jan 3): interpretability, papers explained, puzzles/guesstimates.

## What changes

1. **Granularity.** One topic = one 15–35 min lesson. The current 134 concepts become ~350 lessons. Existing concepts are not thrown away: P1 Python, P3 probability/statistics and the P4 ML theory notes are split and upgraded; their verified items keep their ids.
2. **Lesson anatomy.** Every concept lesson has the same parts, in this order:
   - Header: type (Concept / Interview / Quiz / Design), minutes, prerequisites, a one-line hook question.
   - **Intuition**: a concrete situation, then the idea in plain words. Widget here where one exists.
   - **Maths** (or **Code** for Python/DSA): "in one breath" summary, derivation or mechanics, worked examples, a comparison table where useful.
   - **In practice**: when to use it, defaults, where it shows up, links to next lessons.
   - **Traps**: the answer that sounds right and why it is wrong, with a worked counter-example.
   - **Say it**: 30–60 s spoken-answer prompt → self-check list → 3 follow-ups with hidden answers → model answer → what not to say.
   - Key terms, sources (with the date they were checked), next lesson.
   - Then the existing Practise (quiz bank, coding problems) and Revise (cards) tabs, unchanged.
3. **Per pillar variation.**
   - Maths/ML/DL/LLM/AI eng: full anatomy above.
   - Python and DSA: Maths tab becomes Code (runnable in Pyodide); Say it asks for complexity, edge cases and alternatives; 4–6 coding problems per lesson with hidden tests.
   - System design: Design lessons with a fixed frame: clarify → metrics → data → features/retrieval → model → serving → evaluation (offline + online) → failure modes → follow-ups.
4. **Module wrap-up.** Every module ends with an Interview lesson (5–8 scenario questions with rubrics) and a Quiz (8–14 items, answers recomputed in CI).
5. **Widgets.** A shared library of ~20 parameterised widgets, reused across lessons rather than one per lesson: polynomial fit / bias–variance (pilot), learning curves, vectors and similarity, matrix as transformation, gradient descent on a surface (exists), threshold / confusion matrix (exists), ROC–PR, regularisation path (exists), decision-tree splits, k-means steps, PCA projection, CLT sampler, power / sample size (exists), activation functions, backprop graph, attention heatmap, softmax temperature / top-p, tokeniser, chunking + retrieval, KV-cache memory calculator.
6. **Role roadmaps and mocks** (last batch). Ordered lesson lists for Data Scientist, ML Engineer, AI Engineer, Data Analyst, plus 3 mock rounds per role built from the Say-it follow-ups, timed and self-graded against the rubric.

## Curriculum map (~350 lessons + module practice and quizzes)

| Track | Modules | Lessons | Reuse from current site |
|---|---|---|---|
| T1 Python | core and data model, functions and OOP, stdlib and collections, errors/files/iterators, numpy, pandas, plotting, scikit-learn, PyTorch, Keras | ~55 | P1 (38 concepts) upgraded |
| T2 DSA | complexity, arrays and hashing, two pointers, sliding window, stack/monotonic stack, binary search, linked lists, trees and BST, heaps, graphs (BFS/DFS, topo sort, union-find, Dijkstra), intervals, greedy, backtracking, DP (1-D, 2-D, knapsack, LIS/LCS, intervals), tries, bits | ~45 | P1 DSA (12) split |
| T3 Maths for ML | linear algebra (~10), calculus and optimisation (~8), probability (~12 + 5 practice sets), statistics (~17), information theory (~4), A/B testing (~12) | ~65 | P3 (29) upgraded |
| T4 Classical ML | data and features, linear models, trees and ensembles, other classifiers, unsupervised, time series, evaluation metrics, generalisation and validation | ~42 | P4 (part) split |
| T5 Deep learning | NN basics, training deep nets, regularisation and debugging, CNNs, sequence models, attention and transformers, vision, representation and generative models | ~37 | P4 (part) split |
| T6 NLP and LLMs | text basics, tokenisation and LMs, retrieval and NLP evals, LLM architecture, pretraining, post-training (SFT, RLHF, DPO, LoRA), generation and decoding, benchmarks | ~32 | P4 transformers split |
| T7 AI engineering | inference and serving, prompting and structured output, RAG, agents and tool use (incl. MCP), applied evals, MLOps, LLMOps | ~54 | new |
| T8 ML/AI system design | the design frame; recsys, feed ranking, search ranking, ads CTR, fraud/credit risk, ETA, notifications, support bot, enterprise RAG, text-to-SQL, document extraction, moderation, voice agent, task agent, eval platform, experimentation platform | ~22 | new |

## Schedule

| Batch | Dates | Content | Lessons |
|---|---|---|---|
| Pilot | Nov 25–26 | T4 "Generalisation": 4 concept lessons + interview lesson + quiz, polynomial-fit widget, new lesson renderer | 6 |
| Review | by Nov 28 | You approve the anatomy (or change it) before anything scales | — |
| B1–B3 | Nov 27–Dec 3 | T4 classical ML | ~42 |
| B4–B6 | Dec 4–Dec 9 | T5 deep learning | ~37 |
| B7–B9 | Dec 10–Dec 15 | T6 NLP and LLMs | ~32 |
| B10–B13 | Dec 16–Dec 21 | T7 AI engineering | ~54 |
| B14–B15 | Dec 22–Dec 24 | T8 system design | ~22 |
| B16–B18 | Dec 25–Dec 28 | T3 maths (new linear algebra, calculus, info theory, A/B; upgrade P3) | ~65 |
| B19–B20 | Dec 29–Dec 31 | T2 DSA split + problems | ~45 |
| B21 | Jan 1–2 | T1 Python upgrades; role roadmaps and mocks | ~55 (mostly upgrades) |
| Buffer | Jan 3–10 | Late batches, fixes from your sample reviews, phase 2 if time | — |

ML-heavy tracks go first because that is where the gap is largest; Python already has the most depth. About 10 lessons a day, below the 12/day reached in batches B9–B11.

## Rules (carried over)

- Every computable item has a `check`; CI recomputes it and only verified items lose [UNVERIFIED].
- Fixed ids for all new content; old topic ids keep working (progress is not lost). Old coarse topics are hidden from the syllabus once their replacement module ships.
- Sources are real and dated; videos only where the link has been checked.
- You review a 10% sample of each batch within 3 days.
