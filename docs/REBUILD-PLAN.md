# Content rebuild plan

Target: every concept below built and verified by **Jan 10, 2027**; your final review Jan 10–13; fixes before Jan 27.
Focus: Python (P1), aptitude (P2), probability and statistics (P3), ML/DL theory (P4).
SQL, Product and Consulting stay on the site exactly as they are; no new content goes into them (you prepare those on your own).

## Rules

- **Nothing is dropped.** No concepts are cut to fund others, and there is no "drop what isn't started" date. If a batch runs late, the buffer (Jan 3–10) absorbs it.
- Each concept gets 2–3 resources (video first where a good one exists), an explanation, about 4 worked examples, practice, 3–5 interview questions with model answers and a rubric, and revision cards.
- Practice per concept: P1 3–5 coding problems; P2 12–20 items (logic sets: about 6 sets of 4 questions); P3 10–15 numeric items; P4 numeric items computed with numpy/autograd plus rubric questions.
- Every item that can be computed carries a `check`, and CI recomputes it (`scripts/verify-items.mts --check`). Only those items lose the [UNVERIFIED] tag.
- You review a 10% sample of each batch.

## Concept map (134 concepts)

**P1 Python (50).** Core 9 · DSA 12 · numpy 5 · pandas 8 · plotting 3 (matplotlib OO API, choosing a chart, seaborn) · scikit-learn 8 · PyTorch 4 · TF/Keras 1.

**P2 Aptitude, LR, DILR (43).** Arithmetic 8 · number systems 3 · algebra 5 · P&C 3 · geometry and mensuration 4 · clocks and calendars 1 · logical reasoning 10 (series, coding-decoding, analogy and odd-one-out, blood relations, directions, syllogisms, linear and circular arrangements, ordering and ranking, data sufficiency, statement and assumption) · DILR 9.

**P3 Probability and statistics (29).** Probability 12 · statistics 17, including the "which test" decision tree linked from every test.

**P4 ML and DL theory (12).** Bias-variance and learning curves · regularisation · losses and MLE · optimisers (SGD, momentum, RMSProp, Adam) · backprop · initialisation and normalisation · bagging and boosting · evaluation and calibration · CNNs · sequence models and attention · transformers and LLMs (tokenisation, positional encoding and RoPE, KV cache, pretraining vs fine-tuning, LoRA) · embeddings and RAG. Pairs with Stanford CME 295 lectures 1–5.

## Schedule

| Batch | Dates | Content | Concepts |
|---|---|---|---|
| Pilot | done Nov 19 | P1 Pipelines + leakage · P2 arrangements · P3 two-sample + paired t | 5 |
| B1 | done Nov 19 | P2 arithmetic, clocks and calendars, number systems | 12 |
| B2 | Nov 24–27 | P1 core Python · P2 P&C | 12 |
| B3 | Nov 28–Dec 1 | P1 DSA | 12 |
| B4 | Dec 2–5 | P2 algebra, geometry · LR series, coding-decoding, analogy | 12 |
| B5 | Dec 6–9 | P2 rest of LR · DILR charts and caselets | 11 |
| B6 | Dec 10–13 | P2 DILR logic sets · P3 probability (first 8) | 12 |
| B7 | Dec 14–17 | P3 probability (last 4) · statistics (8) | 12 |
| B8 | Dec 18–21 | P3 rest of statistics and the decision tree · P4 (first 5) | 12 |
| B9 | Dec 22–25 | P4 (last 7) · P1 numpy | 12 |
| B10 | Dec 26–29 | P1 pandas, plotting | 11 |
| B11 | Dec 30–Jan 2 | P1 rest of scikit-learn, PyTorch, Keras | 11 |
| Buffer | Jan 3–10 | Late batches, fixes from your sample reviews | — |

This is about 12 concepts every 4 days, roughly 10% more per batch than the earlier plan, because nothing was cut.
P4 runs before the pandas and scikit-learn batches so ML theory is not the last thing built.

## Open

- Re-attach the BITS Placement Chronicles and confirm the academic year (the README says AY 2025-26). Until then, sources read "Practice", not "Reported".
