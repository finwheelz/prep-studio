/**
 * v2 NLP & LLMs, part E: Generation and decoding (decoding strategies, in-context learning and
 * chain-of-thought, hallucination, benchmarks). Fixed ids; answers recomputed in Pyodide.
 */
import { iq, lessonWriter } from "./v2-shared";
import { LS as S } from "./v2-llm-src";

const { L, Q, C } = lessonWriter("llm");
const GD = "Generation and decoding";

L("llm-decoding", GD, "Decoding: greedy, beam, temperature, top-k and top-p", "How the next token is chosen from the model's distribution, and which settings suit which tasks.", {
  kind: "concept", mins: 25, prereq: ["llm-perplexity"],
  hook: "Same model, same prompt: one setting gives repetitive text, another gives creative nonsense. What changed?",
  intuition: `
**The situation.** The model outputs a probability for every token in the vocabulary. **Decoding** is the rule for picking one, repeated token by token.

- **Greedy:** always take the most likely token. Deterministic, but often bland and prone to loops.
- **Beam search:** keep the $b$ best partial sequences by total probability. Good for translation and short constrained outputs; for open-ended text it produces generic, repetitive output.
- **Sampling with temperature:** divide logits by $T$ before softmax. $T < 1$ sharpens (more conservative), $T > 1$ flattens (more random), $T \\to 0$ is greedy.
- **Top-k:** sample only from the $k$ most likely tokens.
- **Top-p (nucleus):** sample from the smallest set of tokens whose probabilities sum to at least $p$; adapts the candidate set to how confident the model is.
- **Min-p:** keep tokens with probability at least a fraction of the top token's.

Plus **repetition/frequency penalties**, **stop sequences**, max tokens, and **constrained decoding** (forcing valid JSON or a grammar).
`,
  maths: `
**In one breath.** $p_i \\propto \\exp(z_i/T)$; top-k keeps the $k$ largest; top-p keeps the smallest prefix of sorted probabilities with cumulative mass $\\ge p$; renormalise and sample.

**Worked examples.**

- Logits (2, 1, 0) at $T = 0.5$: top probability $e^4/(e^4 + e^2 + 1) = 0.867$ (vs 0.665 at $T = 1$).
- Probabilities (0.5, 0.3, 0.15, 0.05), top-p = 0.9: cumulative 0.5, 0.8, 0.95 → nucleus = 3 tokens; first token renormalised to $0.5/0.95 = 0.526$.
- Same, top-k = 2: second token renormalised to $0.3/0.8 = 0.375$.

**Why beam search degenerates.** Maximising total probability favours short, generic, repetitive continuations: human text is not the most probable text, it's typical text. Nucleus sampling was proposed to fix this (Holtzman et al.).

| Task | Typical decoding |
|---|---|
| Extraction, classification, JSON, code fixes | T = 0 (greedy) + constrained decoding/stop sequences |
| Factual Q&A, support answers | T 0–0.3 |
| Creative writing, brainstorming | T 0.7–1.0 with top-p 0.9–0.95 |
| Translation, short seq2seq | beam search (b = 4–5) |
| Self-consistency / best-of-n | T 0.7–1.0, several samples |
`,
  practice: `
**Production tips.** Keep settings fixed and logged per use case; evaluate with the same settings you'll ship; for structured outputs use JSON mode / grammar-constrained decoding plus validation and retry; note that "T = 0" may still not be perfectly deterministic due to batching and floating-point effects.

**Speed.** Decoding choices barely affect cost per token; output length does. Ask for concise outputs and set max tokens.
`,
  traps: [
    { trap: "Temperature 0 makes the model more accurate.", why: "It makes it deterministic (greedy). For factual tasks that's usually good, but greedy can loop or miss better completions; it doesn't add knowledge." },
    { trap: "Beam search gives the best text.", why: "It finds high-probability sequences, which for open-ended generation are bland and repetitive. Use it for constrained tasks like translation." },
    { trap: "Top-k and top-p do the same thing.", why: "Top-k keeps a fixed number of tokens; top-p keeps a variable number based on cumulative probability, shrinking when the model is confident." },
  ],
  say: {
    prompt: "Explain the main decoding strategies and how you'd set them for a JSON extraction task versus a marketing-copy generator.",
    secs: 45,
    check: ["Greedy, beam, temperature sampling, top-k, top-p defined", "Temperature effect on the distribution", "Why beam/greedy are bland for open-ended text", "Extraction: T = 0, constrained decoding/JSON mode, validation", "Creative: higher T with top-p; evaluate with shipped settings"],
    followups: [
      { q: "What does temperature do mathematically?", a: "Divides logits by T before softmax: T < 1 exaggerates differences (sharper), T > 1 shrinks them (flatter); T → 0 approaches argmax." },
      { q: "Why is top-p adaptive?", a: "When the model is confident a few tokens reach p, so few candidates; when uncertain, many tokens are needed, allowing variety exactly where alternatives are plausible." },
      { q: "How do you guarantee valid JSON?", a: "Constrained decoding against a schema/grammar (or the provider's structured-output mode), then parse and validate; retry or repair on failure." },
    ],
    answer: `At each step the model gives a distribution over tokens and decoding picks one. Greedy takes the top token; beam search keeps the best few partial sequences; sampling draws from the distribution after dividing logits by a temperature, where below one sharpens and above one flattens it; top-k restricts sampling to the k most likely tokens, and top-p to the smallest set covering probability p, which adapts to the model's confidence.

For JSON extraction I'd use temperature zero with constrained decoding or a structured-output mode, stop sequences, and validation with a retry. For marketing copy I'd sample at temperature around 0.8 with top-p 0.9 to 0.95 and maybe generate several options to choose from. Beam search I'd keep for constrained tasks like translation, because for open-ended text it produces bland, repetitive output.`,
    avoid: ["\u201cT = 0 makes answers correct\u201d", "Using beam search for chat"],
  },
  terms: [["Temperature", "Logit divisor controlling randomness."], ["Top-k", "Sample from the k most likely tokens."], ["Top-p (nucleus)", "Sample from the smallest set with cumulative probability ≥ p."], ["Constrained decoding", "Restricting tokens so output follows a grammar/schema."]],
  sources: [S.nucleus],
});
Q({ id: "llm-dec-1", d: 2, secs: 60, prompt: "Logits (2, 1, 0), temperature 0.5. Probability of the top token? (3 decimals)", answer: 0.867, tol: 0.002, explain: "softmax(4, 2, 0) → 54.6/(54.6 + 7.39 + 1).", py: "import numpy as np\nz = np.array([2,1,0.])/0.5\np = np.exp(z)/np.exp(z).sum()\nanswer = float(p[0])", packages: ["numpy"] });
Q({ id: "llm-dec-2", d: 1, secs: 45, prompt: "Probabilities (0.5, 0.3, 0.15, 0.05), top-p = 0.9. How many tokens are in the nucleus?", answer: 3, tol: 0.5, explain: "Cumulative 0.5, 0.8, 0.95: three tokens needed to reach 0.9.", py: "import numpy as np\np = np.array([0.5,0.3,0.15,0.05])\nanswer = int(np.searchsorted(np.cumsum(p), 0.9) + 1)", packages: ["numpy"] });
Q({ id: "llm-dec-3", d: 2, secs: 45, prompt: "Same distribution with top-p = 0.9. Renormalised probability of the top token? (3 decimals)", answer: 0.526, tol: 0.002, explain: "0.5/0.95.", py: "answer = 0.5/(0.5+0.3+0.15)" });
Q({ id: "llm-dec-4", d: 1, secs: 30, prompt: "Same distribution with top-k = 2. Renormalised probability of the second token? (3 decimals)", answer: 0.375, tol: 0.002, explain: "0.3/0.8.", py: "answer = 0.3/(0.5+0.3)" });
C("llm-dec-c1", "Decoding defaults", "Extraction/JSON: T = 0 + constraints. Creative: T ≈ 0.8, top-p ≈ 0.9. Translation: beam.");

L("llm-icl-cot", GD, "In-context learning and chain-of-thought", "Few-shot prompting, step-by-step reasoning, self-consistency and when they help.", {
  kind: "concept", mins: 25, prereq: ["llm-decoding"],
  hook: "Adding \"Let's think step by step\" or a few worked examples changes accuracy without changing any weights. Why?",
  intuition: `
**The situation.** You want a model to do a task without fine-tuning: classify, extract, solve word problems.

**In-context learning (ICL).** Put instructions and a few input→output examples in the prompt. The model infers the task and format from them and continues the pattern. No weights change; the "learning" lives in the forward pass, conditioned on the context. Example choice, order, label balance and format all matter.

**Chain-of-thought (CoT).** Ask for (or show) intermediate reasoning before the final answer. Multi-step problems become a sequence of easier next-token predictions, and each step's output becomes context for the next. Gains are largest on multi-step maths and logic, mainly for capable models.

**Self-consistency.** Sample several reasoning paths at non-zero temperature and take the majority final answer. Independent errors rarely agree, so the vote is more accurate than one sample, at proportionally higher cost.

**Reasoning models** are trained (often with RL on verifiable rewards) to produce long internal reasoning by default, trading more output tokens ("test-time compute") for accuracy.
`,
  maths: `
**In one breath.** Majority vote over $n$ independent samples with per-sample accuracy $p > 0.5$: $P(\\text{correct}) = \\sum_{k > n/2}\\binom{n}{k}p^k(1-p)^{n-k}$, which rises with $n$.

**Worked example.** $p = 0.6$, $n = 5$: $P = \\binom53 0.6^3 0.4^2 + \\binom54 0.6^4 0.4 + 0.6^5 = 0.683$. With $n = 15$ it's about 0.79. Real samples are correlated, so gains are smaller, and if $p < 0.5$ voting makes things worse.

**Prompt cost.** 8 examples × 150 tokens = 1,200 extra input tokens on every call; CoT adds output tokens (often hundreds), and output tokens are slower and pricier than input.

| Technique | Helps most when | Cost |
|---|---|---|
| Zero-shot instructions | task is clear and common | lowest |
| Few-shot examples | format/labels are specific | more input tokens |
| Chain-of-thought | multi-step reasoning | more output tokens, latency |
| Self-consistency | single answer can be checked by vote | × n samples |
| Reasoning model | hard maths/code/planning | many output tokens |
`,
  practice: `
**Prompt hygiene.** Clear instructions first; diverse, representative examples; balanced labels; consistent format; ask for the final answer in a parseable field. Evaluate prompt variants on a labelled set; small wording changes can swing accuracy.

**When to stop prompting.** If you need many examples to get stable behaviour, or latency/cost from long prompts matters, fine-tune (or distil) instead.

**CoT and products.** Reasoning text can be wrong even when the answer is right (and vice versa); don't treat it as a faithful explanation; consider hiding it from users.
`,
  traps: [
    { trap: "Few-shot examples teach the model new knowledge.", why: "They mostly specify the task and format; the knowledge must already be in the model or in retrieved context." },
    { trap: "Chain-of-thought always helps.", why: "Gains concentrate on multi-step tasks and capable models; for simple lookups it adds cost and can even hurt." },
    { trap: "The written reasoning explains how the model got the answer.", why: "CoT text is generated output, not a faithful trace of the computation; answers can be right with wrong reasoning and vice versa." },
  ],
  say: {
    prompt: "Explain in-context learning and chain-of-thought, and how you'd decide between prompting and fine-tuning.",
    secs: 60,
    check: ["ICL: instructions + examples in the prompt; no weight updates", "Example selection/order/format effects", "CoT: intermediate steps help multi-step reasoning; self-consistency voting", "Costs: input/output tokens, latency", "Fine-tune/distil when prompts get long, unstable or costly at volume"],
    followups: [
      { q: "Why does self-consistency improve accuracy?", a: "Different reasoning paths make different mistakes; if each path is right more often than any single wrong answer, the majority vote concentrates on the correct one." },
      { q: "How do you choose few-shot examples?", a: "Representative, diverse, label-balanced, consistently formatted; retrieve the most similar examples per input (dynamic few-shot); validate on a labelled set." },
      { q: "What are reasoning models doing differently?", a: "They're trained to generate long reasoning before answering, often with RL on verifiable rewards, so they spend more test-time compute; better on hard problems, slower and costlier per answer." },
    ],
    answer: `In-context learning means specifying a task inside the prompt, with instructions and a few input–output examples, and letting the model continue the pattern; no weights change, so example choice, order, label balance and format matter a lot. Chain-of-thought asks the model to write intermediate steps before the answer, which turns a multi-step problem into easier steps and helps most on maths and logic with capable models. Self-consistency samples several reasoning paths and takes the majority answer, buying accuracy with more tokens.

I'd start with prompting because it's fast to iterate, and evaluate variants on a labelled set. If I need long prompts with many examples to get stable results, or the volume makes those tokens expensive, I'd fine-tune or distil a model so the behaviour is in the weights.`,
    avoid: ["\u201cFew-shot examples add knowledge\u201d", "Treating CoT text as a faithful explanation"],
  },
  terms: [["In-context learning", "Task specified by prompt examples; no weight updates."], ["Chain-of-thought", "Generating intermediate reasoning before the answer."], ["Self-consistency", "Majority vote over sampled reasoning paths."], ["Test-time compute", "Spending more inference tokens to improve answers."]],
  sources: [S.gpt3, S.cot, S.selfcons],
});
Q({ id: "llm-icl-1", d: 2, secs: 90, prompt: "Each sampled answer is independently correct with probability 0.6. Probability the majority of 5 samples is correct? (3 decimals)", answer: 0.683, tol: 0.002, explain: "Σ_{k=3}^{5} C(5,k) 0.6^k 0.4^(5−k) = 0.6826.", py: "from scipy.stats import binom\nanswer = float(binom.sf(2, 5, 0.6))", packages: ["scipy"] });
Q({ id: "llm-icl-2", d: 2, secs: 60, prompt: "Same setup with per-sample accuracy 0.4. Majority-of-5 accuracy? (3 decimals)", answer: 0.317, tol: 0.002, explain: "Voting amplifies whichever side is more likely: below 0.5 it gets worse.", py: "from scipy.stats import binom\nanswer = float(binom.sf(2, 5, 0.4))", packages: ["scipy"] });
Q({ id: "llm-icl-3", d: 1, secs: 30, prompt: "A prompt carries 8 examples of 150 tokens each. Extra input tokens per call?", answer: 1200, tol: 0.5, explain: "8 × 150.", py: "answer = 8*150" });
Q({ id: "llm-icl-4", d: 1, secs: 30, prompt: "Chain-of-thought prompting gives the largest gains on…", options: ["single-fact lookups", "multi-step maths and logic problems", "sentiment of short reviews", "spelling correction"], answer: 1, explain: "Benefits concentrate on tasks that need several dependent steps.", py: "answer = 1" });
C("llm-icl-c1", "Self-consistency", "Sample several CoT paths at T > 0; majority-vote the final answer.");

L("llm-hallucination", GD, "Hallucination and calibration", "Why LLMs produce fluent falsehoods, the types of hallucination, and how to reduce and measure them.", {
  kind: "concept", mins: 25, prereq: ["llm-next-token", "llm-decoding"],
  hook: "Asked about a regulation that doesn't exist, the model cites a section number with confidence. Why would a next-token predictor do that?",
  intuition: `
**The situation.** LLMs sometimes state false things fluently: invented citations, wrong numbers, nonexistent APIs, details not in the provided document.

**Why it happens.**

- **The objective rewards plausible text**, not truth: a confident citation-shaped string is very likely text after "according to Section".
- **Knowledge gaps and staleness:** rare facts are weakly learned; anything after the training cutoff is unknown.
- **Training incentives:** evaluations and preference data often reward an answer over "I don't know", so guessing pays.
- **Decoding:** sampling can pick a low-probability wrong token, and once written it becomes context.
- **Long or conflicting context:** the model may ignore or misread retrieved text.

**Types.** **Factuality** errors (contradict the world) vs **faithfulness** errors (contradict or go beyond the given source). For RAG and summarisation, faithfulness is the one you can measure directly.

**Mitigations.** Ground answers in retrieved sources with citations; instruct and train the model to abstain; lower temperature for factual tasks; verify with tools (search, calculators, code); check claims against sources; use calibrated confidence to route to humans.
`,
  maths: `
**In one breath.** Calibration means predicted confidence matches accuracy; expected calibration error $\\text{ECE} = \\sum_b\\frac{n_b}{n}|\\text{acc}_b - \\text{conf}_b|$.

**Worked example.** Two bins of 50 answers: confidence 0.9 with accuracy 0.7, confidence 0.6 with accuracy 0.6. ECE $= 0.5 \\times 0.2 + 0.5 \\times 0 = 0.10$: over-confident at the top.

**Selective answering.** 1,000 questions. Answering all at 75% accuracy: 250 errors. Answering only the 700 most confident at 90% accuracy (abstaining on 300): 70 errors, 180 fewer, at the cost of 30% coverage. Pick the threshold from the cost of a wrong answer vs an escalation.

| Mitigation | Reduces | Cost |
|---|---|---|
| RAG with citations | factual gaps, staleness | retrieval quality becomes critical |
| Abstention prompts/training | guessing | lower coverage |
| Low temperature | sampling errors | less diversity |
| Tool use (search, calculator, code) | arithmetic, lookups | latency, integration |
| Claim verification / NLI checks | unsupported statements | extra model calls |
| Human review for low confidence | high-stakes errors | people time |
`,
  practice: `
**Measuring.** Build a labelled set with known answers (including unanswerable questions); measure accuracy, abstention rate and, for RAG, faithfulness (every claim supported by retrieved text) and citation accuracy. Track separately from fluency or helpfulness.

**Product design.** Show sources, make "I couldn't find this" an acceptable answer, and route high-stakes or low-confidence cases to people.
`,
  traps: [
    { trap: "RAG eliminates hallucination.", why: "It reduces factual gaps, but models can still ignore, misread or go beyond the retrieved text, and retrieval can return the wrong passage. Measure faithfulness." },
    { trap: "A confident tone means the model is likely right.", why: "Verbal confidence is poorly calibrated; LLMs often sound certain when wrong. Use measured calibration, verification or abstention." },
    { trap: "Hallucination is a bug that the next model version will fix.", why: "It follows from generating plausible text under uncertainty; rates fall with better models and grounding but don't reach zero, so systems need checks." },
  ],
  say: {
    prompt: "Why do LLMs hallucinate, and how would you reduce hallucinations in a customer-facing assistant?",
    secs: 60,
    check: ["Objective rewards plausible text; knowledge gaps/cutoff; incentives to guess; sampling", "Factuality vs faithfulness distinction", "Grounding with RAG + citations; abstention; low temperature; tools", "Verification of claims against sources; human routing", "Measure: labelled set with unanswerable questions, faithfulness, calibration"],
    followups: [
      { q: "How do you check faithfulness automatically?", a: "Split the answer into claims and check each against the retrieved passages with an NLI model or a validated LLM judge; report the share of supported claims and citation accuracy." },
      { q: "What is calibration and why does it matter here?", a: "Whether stated confidence matches accuracy. With calibrated scores you can abstain or escalate below a threshold and trade coverage for error rate deliberately." },
      { q: "Why does preference training sometimes increase hallucination?", a: "If raters prefer complete, confident answers over \u201cI don't know\u201d, the model learns to guess; including rewarded abstentions in the data counters it." },
    ],
    answer: `LLMs are trained to produce likely continuations, not true ones, so when they lack a fact, because it's rare, after the cutoff, or simply not learned, a plausible-looking answer is still the likely continuation. Training and evaluations often reward answering over saying "I don't know", and sampling can pick a wrong token that the rest of the answer then builds on. It's useful to separate factuality errors, against the world, from faithfulness errors, going beyond the provided sources.

For a customer assistant I'd ground answers in retrieved company documents with citations, instruct and give examples of abstaining when the answer isn't in context, use low temperature, call tools for numbers and lookups, and run a claim-check against the sources before showing high-stakes answers, routing low-confidence cases to a human. I'd measure on a labelled set that includes unanswerable questions, tracking accuracy, faithfulness and how often it correctly abstains.`,
    avoid: ["\u201cRAG solves hallucination\u201d", "Trusting the model's stated confidence"],
  },
  terms: [["Factuality hallucination", "Contradicts real-world facts."], ["Faithfulness hallucination", "Not supported by (or contradicts) the given source."], ["Calibration", "Confidence matches accuracy."], ["Abstention", "Declining to answer when unsure."]],
  sources: [S.halluc, S.rag],
});
Q({ id: "llm-hal-1", d: 2, secs: 60, prompt: "Two equal-size bins: confidence 0.9 with accuracy 0.7, and confidence 0.6 with accuracy 0.6. Expected calibration error?", answer: 0.1, tol: 0.002, explain: "0.5 × 0.2 + 0.5 × 0.", py: "answer = 0.5*abs(0.9-0.7) + 0.5*abs(0.6-0.6)" });
Q({ id: "llm-hal-2", d: 2, secs: 60, prompt: "1,000 questions. Answering all gives 75% accuracy. Answering only the 700 most confident gives 90% accuracy on those. How many fewer wrong answers?", answer: 180, tol: 0.5, explain: "250 errors vs 70 errors.", py: "answer = 1000*0.25 - 700*0.10" });
Q({ id: "llm-hal-3", d: 1, secs: 30, prompt: "A summary adds a figure that isn't in the source document, though it happens to be true. What kind of error is it for a summariser?", options: ["Faithfulness error", "No error", "Tokenisation error", "Calibration error"], answer: 0, explain: "It isn't supported by the source; summarisers must be faithful to the input.", py: "answer = 0" });
Q({ id: "llm-hal-4", d: 2, secs: 60, prompt: "An answer has 8 atomic claims; 6 are supported by the retrieved passages. Faithfulness score (supported fraction)?", answer: 0.75, tol: 0.002, explain: "6/8.", py: "answer = 6/8" });
C("llm-hal-c1", "Hallucination mitigations", "Ground with RAG + citations, abstain, low T, tools, claim verification, human routing.");

L("llm-benchmarks", GD, "LLM benchmarks and evaluation", "What public benchmarks measure, pass@k, contamination, LLM-as-judge, and building your own evals.", {
  kind: "concept", mins: 25, prereq: ["llm-nlp-metrics"],
  hook: "A new model tops the leaderboard. Will it be better for your product?",
  intuition: `
**The situation.** Model releases quote benchmark numbers: knowledge (MMLU), maths (GSM8K, MATH), code (HumanEval), reasoning, chat preference leaderboards. You need to know what they mean and what they don't.

**What benchmarks are good for:** coarse comparison of general capability, tracking progress, and sanity checks. **What they miss:** your domain, your users' phrasing, your format and latency constraints, and safety in your context.

**Pitfalls.** **Contamination** (test questions in training data), **saturation** (top models all near the ceiling), **prompt sensitivity** (few-shot format and wording shift scores by points), and **metric mismatch** (multiple-choice accuracy ≠ quality of open-ended answers).

**Your own eval set** is what decides: 100–500 real or realistic inputs with expected outputs or rubrics, covering edge cases and failure modes, run on every model or prompt change.

**LLM-as-judge** scales rubric grading for open-ended outputs, but must be validated against human labels and controlled for position, length and self-preference bias.
`,
  maths: `
**In one breath.** pass@k $= 1 - \\binom{n - c}{k}/\\binom{n}{k}$ (unbiased estimate from $n$ samples with $c$ correct); accuracy SE $= \\sqrt{p(1-p)/N}$.

**Worked examples.**

- $n = 10$ samples, $c = 3$ pass the tests: pass@1 = 0.3; pass@5 $= 1 - \\binom75/\\binom{10}5 = 1 - 21/252 = 0.917$.
- 500-question benchmark at 70% accuracy: SE $= \\sqrt{0.7 \\times 0.3/500} = 2.05$ points; a 1-point difference is noise.
- Random guessing on 4-option multiple choice: 25% (the floor, not 0%).

| Benchmark type | Example | Measures | Watch for |
|---|---|---|---|
| Knowledge MCQ | MMLU | breadth of knowledge | contamination, saturation |
| Maths | GSM8K, MATH | multi-step reasoning | answer extraction, contamination |
| Code | HumanEval-style | functional correctness (pass@k) | test coverage |
| Chat preference | arena-style | human preference | style/length bias |
| Your eval set | product tasks | what you ship | must be maintained |
`,
  practice: `
**Eval workflow.** Collect real inputs (with consent) → define pass/fail checks or rubrics → automate deterministic checks (format, schema, exact answers) → LLM judge for open-ended criteria, validated on a human-labelled sample → track scores per model/prompt version → review failures by category.

**Decisions.** Compare candidates on your eval, cost per request and latency, not on leaderboard rank alone.
`,
  traps: [
    { trap: "Higher leaderboard score means better for our use case.", why: "Benchmarks may not reflect your domain or format and may be contaminated. Test on your own eval set." },
    { trap: "A 1-point benchmark gain is a real improvement.", why: "With a few hundred questions the standard error is ~2 points; prompt wording changes can shift scores more than that." },
    { trap: "LLM-as-judge removes the need for human labels.", why: "Judges have biases; you need human-labelled samples to validate and recalibrate them." },
  ],
  say: {
    prompt: "How would you choose between three LLMs for your product?",
    secs: 60,
    check: ["Public benchmarks only as a coarse filter; contamination/saturation caveats", "Build a task-specific eval set from real inputs with rubrics/checks", "Automated checks + validated LLM judge + human sample", "Report uncertainty; compare cost and latency", "Re-run on every model or prompt change"],
    followups: [
      { q: "What is pass@k and why not just sample k times and check?", a: "The probability at least one of k samples passes. Estimating it from n ≥ k samples with the combinatorial formula is unbiased and lower-variance than drawing exactly k." },
      { q: "How do you detect benchmark contamination?", a: "Check n-gram overlap between training data and test items, compare performance on original vs perturbed/new items, and look for verbatim completion of test questions." },
      { q: "How big should an eval set be?", a: "Enough that differences you care about exceed noise: a few hundred items gives about ±2–3 points at 95% confidence; stratify by important categories." },
    ],
    answer: `I'd use public benchmarks only to shortlist, knowing they can be contaminated, saturated and sensitive to prompt format, and may not match my domain. The decision comes from my own eval set: a few hundred real or realistic inputs covering common cases and edge cases, with expected answers or rubrics.

I'd run all three models with the prompts I'd actually ship, score deterministic things automatically, like schema validity and exact answers, use an LLM judge for open-ended criteria after validating it against human labels, and have people review a sample. I'd report scores with their uncertainty and weigh them against cost per request and latency, then keep the eval set as a regression test for future model and prompt changes.`,
    avoid: ["Choosing by leaderboard rank alone", "Ignoring statistical noise"],
  },
  terms: [["Contamination", "Test items present in training data."], ["pass@k", "Probability at least one of k samples is correct."], ["LLM-as-judge", "Model grading outputs against a rubric."], ["Saturation", "Benchmark near ceiling, no longer discriminative."]],
  sources: [S.mmlu, S.gpt3],
});
Q({ id: "llm-bench-1", d: 2, secs: 60, prompt: "10 samples per problem, 3 pass. Unbiased pass@5 = 1 − C(7,5)/C(10,5)? (3 decimals)", answer: 0.917, tol: 0.002, explain: "1 − 21/252 = 0.917.", py: "import math\nn, c, k = 10, 3, 5\nanswer = 1 - math.comb(n-c, k)/math.comb(n, k)" });
Q({ id: "llm-bench-2", d: 1, secs: 20, prompt: "Same: pass@1?", answer: 0.3, tol: 0.002, explain: "c/n.", py: "import math\nanswer = 1 - math.comb(7,1)/math.comb(10,1)" });
Q({ id: "llm-bench-3", d: 2, secs: 45, prompt: "A 500-question benchmark at 70% accuracy. Standard error in percentage points? (2 decimals)", answer: 2.05, tol: 0.01, explain: "√(0.7 × 0.3/500) = 0.0205.", py: "answer = 100*(0.7*0.3/500)**0.5" });
Q({ id: "llm-bench-4", d: 1, secs: 20, prompt: "Expected accuracy of random guessing on a 4-option multiple-choice benchmark?", answer: 0.25, tol: 0.002, explain: "1/4.", py: "answer = 1/4" });
C("llm-bench-c1", "pass@k", "1 − C(n − c, k)/C(n, k) from n samples with c correct.");

L("llm-generation-practice", GD, "Generation and decoding practice", "Interview scenarios on decoding, prompting, hallucination and evaluation.", {
  kind: "interview", mins: 30, prereq: ["llm-decoding", "llm-icl-cot", "llm-hallucination", "llm-benchmarks"],
  hook: "Answer each out loud in about a minute, then open it and tick off the points the interviewer is listening for.",
}, [
  iq("Your extraction prompt returns invalid JSON 3% of the time. Fix it.", "Use structured-output / JSON mode or grammar-constrained decoding against the schema, temperature 0, stop sequences; validate with a parser and retry (or repair) on failure; log failures to improve the prompt. Consider a fine-tuned small model if volume is high.", ["Constrained decoding / JSON mode", "T = 0", "Validate + retry", "Logging; fine-tune at volume"]),
  iq("Responses are repetitive and loop on long outputs. What do you change?", "Avoid greedy/beam for open-ended text; use sampling with moderate temperature and top-p; add frequency/repetition penalties; set max tokens and stop sequences; check whether the prompt or context invites repetition.", ["Greedy/beam cause loops", "Sampling with top-p", "Penalties", "Max tokens/stop"]),
  iq("Accuracy on your maths word problems is 55%. Options without fine-tuning?", "Chain-of-thought prompting with worked examples; self-consistency voting over several samples; tool use (have the model write and run Python for arithmetic); a reasoning model; verify answers where possible. Measure cost and latency for each.", ["CoT + few-shot", "Self-consistency", "Code/calculator tools", "Reasoning models; cost trade-off"]),
  iq("A vendor claims their model scores 88 on MMLU versus 85 for yours. Does that settle it?", "No: possible contamination, prompt-format sensitivity, and MMLU may not reflect your tasks; 3 points may be within noise depending on setup. Run both on your own eval set with the same prompts, plus cost and latency.", ["Contamination/format caveats", "Relevance to task", "Own eval set", "Cost/latency"]),
  iq("How would you reduce made-up citations in a research assistant?", "Retrieve real sources and require citations to retrieved IDs only; verify each cited source exists and supports the claim; instruct and allow abstention; lower temperature; show sources to users; measure citation precision on a labelled set.", ["Cite only retrieved sources", "Automatic citation verification", "Abstention", "Measure citation precision"]),
]);
