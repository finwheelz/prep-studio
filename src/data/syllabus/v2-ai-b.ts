/**
 * v2 AI engineering, part B: Prompting and structured output.
 * Fixed ids. Every quiz answer is recomputed in Pyodide (scripts/verify-items.mts).
 */
import { CHECKED, iq, lessonWriter } from "./v2-shared";

const { L, Q, C } = lessonWriter("aieng");
const M = "Prompting and structured output";
const src = (label: string, url: string) => ({ label, url, checked: CHECKED });
const S = {
  claude: src("Claude Platform docs: prompt engineering overview", "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview"),
  cot: src("Wei et al. (2022): Chain-of-Thought Prompting Elicits Reasoning in Large Language Models", "https://arxiv.org/abs/2201.11903"),
  sc: src("Wang et al. (2022): Self-Consistency Improves Chain of Thought Reasoning in Language Models", "https://arxiv.org/abs/2203.11171"),
  so: src("OpenAI API docs: structured model outputs", "https://developers.openai.com/api/docs/guides/structured-outputs"),
  lim: src("Liu et al. (2023): Lost in the Middle: How Language Models Use Long Contexts", "https://arxiv.org/abs/2307.03172"),
  ragS: src("Gao et al. (2023): Retrieval-Augmented Generation for Large Language Models: A Survey", "https://arxiv.org/abs/2312.10997"),
};

L("ai-prompt-patterns", M, "Prompt engineering patterns", "Clear instructions, examples, structure and decomposition: the patterns that reliably move quality.", {
  kind: "concept", mins: 20,
  hook: "Your loan-document extractor gets the borrower's name right 95% of the time but the EMI amount only 70%. Is the fix more words in the prompt?",
  intuition: `
**The situation.** A prompt is the program for an LLM feature. Most failures trace to the model not knowing what you want, not to the model being incapable.

**Patterns that work, in rough order of payoff.**

- **Say exactly what you want:** the task, the audience, the output format, what to do when information is missing ("write null, don't guess").
- **Give context the model can't know:** your definitions ("EMI = monthly instalment excluding charges"), policies, edge cases.
- **Show examples (few-shot):** 2–5 diverse input→output pairs, including a tricky one. Examples fix format and resolve ambiguity faster than paragraphs of rules.
- **Structure the prompt:** separate instructions, reference material and the input with clear delimiters (e.g. XML-style tags), so the model can't confuse a document's text with your instructions.
- **Decompose:** split a big task into steps or chained calls (extract → validate → summarise) instead of one mega-prompt.
- **Let it think when the task needs reasoning** (next lesson).

**The process matters more than any trick:** define success criteria, build a small eval set, change one thing at a time, measure.
`,
  maths: `
**In one breath.** Every prompt token is paid on every call: added cost $= \\Delta\\text{tokens} \\times \\text{calls} \\times \\text{input price}$; compare it with the error cost it removes.

**Worked example (few-shot cost).** 5 examples × 120 tokens = 600 extra input tokens. At 1 lakh calls/month and \\$0.50 per million input tokens: $600 \\times 10^5 \\times 0.5 / 10^6 = \\$30$/month. If it lifts EMI extraction from 70% to 90% and each manual correction costs ₹20, it pays for itself many times over.

**Measuring a change.** On an eval set of $n$ cases, a pass rate $\\hat p$ has standard error $\\sqrt{\\hat p(1 - \\hat p)/n}$. With $n = 100$ and $\\hat p = 0.8$: 0.04, so a 3-point gain is within noise. Use 300+ cases or paired comparisons (same cases, both prompts).

**Prompt anatomy (one reasonable order).**

| Part | Content |
|---|---|
| Role / task | what the model is doing and for whom |
| Rules | constraints, what to do when unsure |
| Reference | definitions, policy, retrieved text (in tags) |
| Examples | 2–5 input → output pairs |
| Input | the actual document or message (in tags) |
| Output spec | format, schema, length |
`,
  practice: `
**Workflow.** Write success criteria → collect 50–200 real inputs with expected outputs → baseline prompt → read failures → fix the most common failure → re-run the whole set (catch regressions) → version the prompt in git with its eval score.

**Few-shot tips.** Cover the edge cases; vary the examples so the model doesn't copy surface features; keep them consistent with your rules.

**Debugging.** Ask the model to quote the evidence for each extracted field; failures often show it read the wrong section.
`,
  traps: [
    { trap: "Add a long list of rules in capital letters.", why: "Shouting rarely helps modern models and long rule lists conflict with each other. Clear, specific instructions plus examples of the hard cases work better." },
    { trap: "The new prompt fixed the three examples I tried, so ship it.", why: "Hand-picked examples overfit. Re-run the whole eval set: fixes for one case often break others." },
    { trap: "Paste the user's document straight into the instructions.", why: "Without delimiters, text in the document can be read as instructions (accidentally or as an injection). Wrap inputs in clearly marked sections." },
  ],
  say: {
    prompt: "How do you go about improving a prompt for a production extraction task?",
    secs: 60,
    check: ["Success criteria and an eval set before editing", "Clear task, definitions, and what to do when unsure", "Few-shot examples covering edge cases; structured sections/delimiters", "Change one thing at a time; re-run the full set to catch regressions", "Version prompts; weigh token cost against quality gain"],
    followups: [
      { q: "When do few-shot examples hurt?", a: "When they're unrepresentative or inconsistent: the model copies their surface patterns (length, wording, a particular value) or follows the examples over the rules." },
      { q: "How big should the eval set be?", a: "Big enough that the differences you care about exceed noise: with pass rates near 80%, 100 cases gives ±8 points (95% CI); several hundred, or paired comparison on the same cases, is better." },
      { q: "Why split one prompt into a chain?", a: "Each step is simpler and testable on its own, failures are easier to locate, and you can use cheaper models or code for some steps." },
    ],
    answer: `I start with success criteria and a set of real inputs with expected outputs, so I can measure. Then I write a clear prompt: the task, the definitions the model can't know, what to do when a field is missing, the exact output format, and two to five examples that include the tricky cases, with instructions, reference text and the input in clearly separated sections.

I run the eval, read the failures, fix the most common one, and re-run everything to catch regressions, changing one thing at a time. Prompts are versioned with their scores. If one prompt is doing too much, I split it into a chain of simpler steps. And I weigh extra prompt tokens against the errors they remove.`,
    avoid: ["\u201cI tweak until it looks right on a few examples\u201d", "Prompt changes with no eval"],
  },
  terms: [["Few-shot prompting", "Including worked input→output examples in the prompt."], ["Delimiters", "Markers (e.g. tags) separating instructions, references and inputs."], ["Prompt chaining", "Splitting a task into sequential LLM calls."]],
  sources: [S.claude],
});
Q({ id: "ai-pp-1", d: 1, secs: 45, prompt: "5 few-shot examples of 120 tokens each, 1,00,000 calls/month, $0.50 per million input tokens. Added monthly cost in dollars?", answer: 30, tol: 0.05, explain: "600 × 100,000 × 0.5 / 1e6 = $30.", py: "answer = 5*120*100000*0.5/1e6" });
Q({ id: "ai-pp-2", d: 2, secs: 60, prompt: "A prompt passes 80% of a 100-case eval. Standard error of that pass rate? (2 decimals)", answer: 0.04, tol: 0.002, explain: "√(0.8 × 0.2 / 100) = 0.04.", py: "answer = (0.8*0.2/100)**0.5" });
Q({ id: "ai-pp-3", d: 2, secs: 60, prompt: "To get the standard error at 80% pass rate down to 0.02, how many eval cases do you need?", answer: 400, tol: 0.5, explain: "n = p(1 − p)/SE² = 0.16/0.0004 = 400.", py: "answer = round(0.8*0.2/0.02**2)" });
Q({ id: "ai-pp-4", d: 1, secs: 30, prompt: "Which change most directly stops text inside a pasted document from being treated as instructions?", options: ["Adding 'IMPORTANT' to the rules", "Wrapping the document in clearly marked tags and saying it is data", "Raising temperature", "Adding more few-shot examples"], answer: 1, explain: "Clear separation of data from instructions is the basic defence (not sufficient alone against deliberate injection).", py: "answer = 1" });
C("ai-pp-c1", "Prompt improvement loop", "Criteria → eval set → change one thing → re-run all → version.");

L("ai-reasoning-prompts", M, "Reasoning: chain of thought, self-consistency and thinking budgets", "When letting the model think helps, and how sampling and voting buy accuracy.", {
  kind: "concept", mins: 20, prereq: ["ai-prompt-patterns"],
  hook: "Asking the model to 'think step by step' raised accuracy on EMI calculations from 60% to 85%. It also tripled the output tokens. When is that worth it?",
  intuition: `
**The situation.** Multi-step tasks (arithmetic, eligibility rules, multi-hop questions) go wrong when the model jumps straight to an answer.

**Chain of thought (CoT).** Letting the model write intermediate steps before the final answer gives it "scratch space": each generated token conditions the next, so intermediate results become available for later steps. It helps on reasoning tasks and does little for simple lookups.

**Self-consistency.** Sample several independent reasoning paths (temperature > 0) and take the majority answer. Different paths make different mistakes; the right answer tends to recur.

**Reasoning models and thinking budgets.** Newer models do this internally with a configurable thinking budget. Higher budgets cost tokens and latency; give them to hard cases, not every request.

**Rule of thumb:** use reasoning where accuracy matters and the task has steps; keep the reasoning out of the user-facing output (or in a separate field), and verify numbers with code where possible.
`,
  maths: `
**In one breath.** If each sample is independently correct with probability $p > 0.5$, the majority of $n$ samples is correct with probability $\\sum_{k > n/2}\\binom{n}{k}p^k(1 - p)^{n-k}$, rising with $n$; cost rises linearly in $n$.

**Worked example.** $p = 0.6$, $n = 5$: $P(\\ge 3 \\text{ correct}) = 0.6826$. With $n = 15$: 0.787. Diminishing returns, linear cost; and real samples are correlated, so gains are smaller than this independent-sample estimate.

**When it fails.** If $p < 0.5$ for a question (systematic error), voting makes it worse: majority accuracy falls towards 0 as $n$ grows.

**Cost.** CoT adding 300 output tokens at \\$1.50/M is \\$0.00045 per call; self-consistency with 5 samples multiplies the whole generation cost by 5.

| Technique | Helps when | Cost |
|---|---|---|
| CoT | multi-step reasoning | more output tokens, latency |
| Self-consistency | answer can be voted on (numbers, labels) | × number of samples |
| Thinking budget | hard problems for reasoning models | tokens ∝ budget |
| Tool use (calculator, code) | exact arithmetic, lookups | a tool call |
`,
  practice: `
**Practical patterns.** Ask for reasoning in a scratchpad section and the final answer in a fixed field; parse only the field. For arithmetic, have the model write an expression and compute it in code. Use self-consistency for offline or high-stakes classification, not real-time voice turns.

**Routing.** Classify difficulty first; send easy cases to a fast path and hard cases to a reasoning model or more samples.
`,
  traps: [
    { trap: "Always add 'think step by step'.", why: "For simple extraction or lookups it adds cost and latency without accuracy gains, and can even introduce errors. Measure per task." },
    { trap: "More self-consistency samples always help.", why: "Only when the model is right more often than wrong on that item; systematic errors get reinforced by voting. Returns diminish quickly." },
    { trap: "The written reasoning explains why the model answered.", why: "The reasoning text may not faithfully reflect the computation that produced the answer. Treat it as a useful scratchpad, not a guaranteed explanation." },
  ],
  say: {
    prompt: "When would you use chain-of-thought or self-consistency, and what are the costs?",
    secs: 45,
    check: ["CoT gives intermediate steps that later tokens condition on; helps multi-step tasks", "Little benefit for simple lookups/extraction", "Self-consistency: sample several paths, majority vote; needs p > 0.5 per item", "Costs: output tokens, latency, × samples; route hard cases only", "Verify arithmetic with tools; parse only the final answer field"],
    followups: [
      { q: "With per-sample accuracy 0.6, what's 5-sample majority accuracy (independent)?", a: "About 0.68: P(at least 3 of 5 correct) = 0.6826." },
      { q: "Why might the voted accuracy be lower in practice?", a: "Samples from the same model are correlated: they share blind spots, so effective independence is lower than the binomial calculation assumes." },
      { q: "How would you use a thinking budget in a voice bot?", a: "Keep it small or zero for live turns (latency), and use larger budgets for offline tasks like post-call summaries or eligibility checks." },
    ],
    answer: `Chain of thought means letting the model write out intermediate steps before the answer, which helps on multi-step tasks like calculations or applying several policy rules, because each step is available when generating the next. Self-consistency samples several reasoning paths and takes the majority answer; if each path is right more often than wrong, the vote is more accurate, with diminishing returns.

The costs are output tokens, latency and, for voting, a multiple of the whole generation, and they're wasted on simple lookups. So I'd measure per task, route only hard cases to reasoning or more samples, keep the final answer in a fixed field, and do exact arithmetic in code rather than trusting the model's sums.`,
    avoid: ["\u201cCoT always improves accuracy\u201d", "Treating the reasoning text as a faithful explanation"],
  },
  terms: [["Chain of thought", "Generating intermediate reasoning before the answer."], ["Self-consistency", "Majority vote over several sampled reasoning paths."], ["Thinking budget", "Token allowance for a reasoning model's internal deliberation."]],
  sources: [S.cot, S.sc, S.claude],
});
Q({ id: "ai-rs-1", d: 2, secs: 90, prompt: "Each sample is independently correct with p = 0.6. Probability the majority of 5 samples is correct? (4 decimals)", answer: 0.6826, tol: 0.0002, explain: "Σ_{k=3..5} C(5,k) 0.6^k 0.4^(5−k) = 0.3456 + 0.2592 + 0.0778 = 0.6826.", py: "from scipy.stats import binom\nanswer = float(binom.sf(2, 5, 0.6))", packages: ["scipy"] });
Q({ id: "ai-rs-2", d: 2, secs: 90, prompt: "Same p = 0.6 with 15 samples. Majority accuracy? (3 decimals)", answer: 0.787, tol: 0.002, explain: "P(X ≥ 8), X ~ Bin(15, 0.6) = 0.787. Three times the cost for ~10 more points.", py: "from scipy.stats import binom\nanswer = float(binom.sf(7, 15, 0.6))", packages: ["scipy"] });
Q({ id: "ai-rs-3", d: 2, secs: 60, prompt: "On a question where each sample is correct with p = 0.4, majority-of-5 accuracy? (4 decimals)", answer: 0.3174, tol: 0.0002, explain: "P(X ≥ 3), X ~ Bin(5, 0.4) = 0.3174: voting makes a systematic error worse.", py: "from scipy.stats import binom\nanswer = float(binom.sf(2, 5, 0.4))", packages: ["scipy"] });
Q({ id: "ai-rs-4", d: 1, secs: 30, prompt: "CoT adds 300 output tokens per call at $1.50 per million output tokens. Extra cost per 1,00,000 calls in dollars?", answer: 45, tol: 0.05, explain: "300 × 100,000 × 1.5/1e6 = $45.", py: "answer = 300*100000*1.5/1e6" });
C("ai-rs-c1", "Self-consistency math", "Majority of n samples helps only if per-sample p > 0.5; cost × n.");

L("ai-structured-output", M, "Structured output and constrained decoding", "Getting valid JSON every time: schemas, constrained decoding, validation and retries.", {
  kind: "concept", mins: 20, prereq: ["ai-prompt-patterns"],
  hook: "Your pipeline parses the model's JSON with json.loads. One in 40 calls crashes it. What are the three layers of defence?",
  intuition: `
**The situation.** Downstream code needs machine-readable output: \`{"emi": 12450, "tenure_months": 24, "language": "hi"}\`. Free-text generation sometimes adds commentary, misses a brace, invents a field or puts a string where a number belongs.

**Three layers.**

1. **Ask clearly:** give the exact schema and an example; say what to do for unknown values (null).
2. **Constrain decoding:** the serving system only allows tokens that keep the output valid for the JSON schema or grammar. At each step, invalid tokens get probability zero and the rest are renormalised. Output is guaranteed to parse and match the schema's structure.
3. **Validate and handle failure:** check business rules the schema can't express (EMI > 0, tenure in {6, 12, 18, 24}), and on failure retry with the error message or fall back.

**What constraints can't do.** They guarantee the shape, not the truth. A schema-valid EMI can still be the wrong number.
`,
  maths: `
**In one breath.** Constrained decoding: $p'(t) = \\frac{p(t)\\,\\mathbb{1}[t \\text{ allowed}]}{\\sum_{u\\,\\text{allowed}} p(u)}$; with independent retries at per-attempt success $s$, success within $r$ attempts is $1 - (1 - s)^r$ and expected attempts $\\sum_{i=0}^{r-1}(1 - s)^i$.

**Worked example (masking).** Next-token probabilities: \`"\` 0.5, \`}\` 0.2, \`Sure\` 0.3. If only \`"\` and \`}\` are valid here, renormalise: 0.5/0.7 = 0.714 and 0.2/0.7 = 0.286.

**Worked example (retries).** Unconstrained output passes validation 95% of the time. With up to 3 attempts: $1 - 0.05^3 = 0.999875$ success; expected attempts $1 + 0.05 + 0.0025 = 1.0525$, i.e. about 5% extra cost.

**Schema design.** Use enums for categorical fields, explicit nullable fields for "not found", flat structures where possible, and descriptions on fields. Putting a short "reasoning" or "evidence" field before the answer fields lets the model think inside the structure.
`,
  practice: `
**Implementation.** Use the provider's structured-output / JSON-schema mode or a server-side grammar (supported by vLLM and others); define schemas with Pydantic/Zod and validate on receipt; log every validation failure with the raw output; keep a fallback (default value, human queue).

**Field order matters.** The model generates left to right: if the "decision" field comes before the "evidence" field, it decides first and justifies later.
`,
  traps: [
    { trap: "With JSON mode on, I don't need validation.", why: "JSON mode guarantees syntax (or schema shape), not correct values or business rules. Validate ranges, consistency and cross-field logic." },
    { trap: "Retry until it's valid.", why: "Unbounded retries hide systematic prompt problems and blow up latency and cost. Cap retries, pass the validation error back, and log failures." },
    { trap: "Ask for the answer first and the explanation after.", why: "Generation is left to right: the answer is committed before any reasoning. Put evidence/reasoning fields first if you want them to inform the answer." },
  ],
  say: {
    prompt: "How do you make an LLM return reliable structured data for a production pipeline?",
    secs: 45,
    check: ["Clear schema with examples; null for unknowns; enums", "Constrained decoding / JSON-schema mode masks invalid tokens", "Validation of business rules beyond the schema", "Bounded retries with error feedback, fallbacks, logging", "Shape ≠ correctness; field order (evidence before answer)"],
    followups: [
      { q: "How does constrained decoding work?", a: "At each step the decoder tracks the grammar/schema state and sets the probability of tokens that would make the output invalid to zero, renormalising the rest, so every completed output parses." },
      { q: "Can constrained decoding hurt quality?", a: "Yes, if the schema forces awkward formats or no room to express uncertainty; the model may be pushed into a valid but wrong value. Allow nulls and evidence fields." },
      { q: "What's the success rate after 3 attempts if each succeeds 95% of the time?", a: "1 − 0.05³ = 99.99%." },
    ],
    answer: `I use three layers. First, a clear schema with field descriptions, enums for categories, an explicit null for anything not found, and an example. Second, constrained decoding through the provider's JSON-schema mode or a server-side grammar, which masks tokens that would break the schema so the output always parses. Third, validation of the business rules a schema can't express, like EMI ranges or tenure values, with a bounded retry that feeds back the error and a fallback to a human queue.

Constraints guarantee shape, not truth, so I still evaluate field accuracy, and I put an evidence field before the answer fields so the model grounds its values before committing to them.`,
    avoid: ["\u201cJSON mode solves it\u201d", "Unbounded retries"],
  },
  terms: [["Constrained decoding", "Masking tokens that would violate a grammar or schema."], ["JSON schema", "Declarative description of allowed JSON structure."], ["Validation", "Checking values and business rules after parsing."]],
  sources: [S.so],
});
Q({ id: "ai-so-1", d: 2, secs: 45, prompt: "Next-token probabilities: '\"' 0.5, '}' 0.2, 'Sure' 0.3. Only the first two are valid. Probability of '\"' after masking? (3 decimals)", answer: 0.714, tol: 0.002, explain: "0.5/(0.5 + 0.2) = 0.714.", py: "answer = 0.5/(0.5+0.2)" });
Q({ id: "ai-so-2", d: 2, secs: 60, prompt: "Each attempt is valid with probability 0.95, up to 3 attempts. Probability of ending with valid output? (6 decimals)", answer: 0.999875, tol: 0.000001, explain: "1 − 0.05³.", py: "answer = 1 - 0.05**3" });
Q({ id: "ai-so-3", d: 2, secs: 60, prompt: "Same setup. Expected number of attempts? (4 decimals)", answer: 1.0525, tol: 0.0001, explain: "1 + 0.05 + 0.05² = 1.0525.", py: "answer = sum(0.05**i for i in range(3))" });
Q({ id: "ai-so-4", d: 1, secs: 30, prompt: "Schema-constrained output guarantees which of these?", options: ["The values are correct", "The output parses and matches the schema's structure", "No hallucination", "Business rules are satisfied"], answer: 1, explain: "Shape only; values and rules still need validation.", py: "answer = 1" });
C("ai-so-c1", "Reliable structured output", "Schema + constrained decoding + validation & bounded retry.");

L("ai-prompt-testing", M, "Testing and versioning prompts", "Treating prompts like code: regression sets, paired comparisons and safe rollout.", {
  kind: "concept", mins: 20, prereq: ["ai-prompt-patterns"],
  hook: "Prompt v7 scores 82% and v6 scored 78% on the same 200 cases. Is v7 actually better?",
  intuition: `
**The situation.** Prompts change weekly, and each change can silently break something that used to work. Without tests, you find out from users.

**The idea.** Treat a prompt like code:

- **Version it** (git), with the model name and parameters it was tested with.
- **Regression set:** a fixed set of cases with expected outputs or grading rules, covering common traffic and known hard cases. Every change runs against it.
- **Compare paired:** both prompts on the same cases. What matters is the cases where they disagree: how many v7 fixed and how many it broke.
- **Roll out gradually:** shadow or canary traffic with online metrics before full release.
- **Pin model versions:** a provider model update is a change too; re-run the suite.
`,
  maths: `
**In one breath.** Paired comparison with McNemar's test: $b$ = cases only the new prompt gets right, $c$ = only the old gets right; $\\chi^2 = \\frac{(|b - c| - 1)^2}{b + c}$ with 1 degree of freedom (3.84 = 5% threshold).

**Worked example.** 200 cases: v6 78%, v7 82%. Suppose v7 fixed 18 cases and broke 10 ($b = 18$, $c = 10$; net +8 = 4 points). $\\chi^2 = (8 - 1)^2/28 = 1.75$, p ≈ 0.19: not convincing. Also, 10 broken cases need reading: were they important?

**Why paired beats unpaired.** Two independent 200-case samples at 78% vs 82% have a difference SE of about $\\sqrt{0.78 \\times 0.22/200 + 0.82 \\times 0.18/200} \\approx 0.040$; pairing removes the shared case difficulty and focuses on the disagreements.

**Rule.** Require both an aggregate improvement and no regressions on must-pass cases (safety, compliance phrasing).
`,
  practice: `
**Suite structure.** Must-pass cases (exact rules), graded cases (rubric or LLM judge), and slices (language, product, channel). Report per slice; a +4 overall can hide −15 on Marathi calls.

**Tooling.** Store prompts as templates with variables, test in CI, log prompt version on every production call so incidents can be traced.
`,
  traps: [
    { trap: "82% beats 78%, ship it.", why: "On 200 cases that gap can be noise, and the cases it broke may matter more than those it fixed. Look at paired disagreements and must-pass cases." },
    { trap: "The model didn't change, so last month's scores still hold.", why: "Provider models get updated or retired; pin versions where possible and re-run the suite on any change." },
    { trap: "Only test the overall pass rate.", why: "Slices matter: improvements on common cases can hide regressions on a language, product or user segment." },
  ],
  say: {
    prompt: "How do you decide whether a new prompt version is better than the current one?",
    secs: 45,
    check: ["Fixed regression set with must-pass cases and slices", "Paired comparison on the same cases; count fixes vs breaks", "Statistical check (McNemar or bootstrap) / enough cases", "Inspect regressions; per-slice results", "Gradual rollout and pinned model versions; log prompt version"],
    followups: [
      { q: "b = 18, c = 10 on 200 cases. Significant at 5%?", a: "McNemar χ² = (|18 − 10| − 1)²/28 = 1.75 < 3.84, so no." },
      { q: "What belongs in must-pass cases?", a: "Compliance statements, safety refusals, PII handling, critical formats, and previously fixed production bugs." },
      { q: "How do you handle a provider model update?", a: "Treat it as a release: run the full suite on the new version, compare per slice, canary it, and keep the old version pinned until it passes." },
    ],
    answer: `I run both versions on the same fixed regression set: common traffic, hard cases, slices by language and product, plus must-pass cases like compliance wording. Instead of comparing two percentages, I look at the disagreements: how many cases the new prompt fixed and how many it broke, and test that with McNemar or a bootstrap. 82% vs 78% on 200 cases with 18 fixes and 10 breaks isn't significant.

I read the regressions, require no must-pass failures and no slice that gets much worse, then canary the new prompt with online metrics. Prompts live in version control with the model version they were tested on, and every production call logs the prompt version.`,
    avoid: ["Comparing two aggregate percentages only", "Testing on a handful of hand-picked examples"],
  },
  terms: [["Regression set", "Fixed test cases run on every change."], ["McNemar's test", "Paired test on disagreement counts b and c."], ["Canary", "Release to a small share of traffic first."]],
  sources: [S.claude],
});
Q({ id: "ai-pt-1", d: 2, secs: 60, prompt: "New prompt fixes 18 cases and breaks 10 (paired). McNemar χ² with continuity correction? (2 decimals)", answer: 1.75, tol: 0.005, explain: "(|18 − 10| − 1)²/(18 + 10) = 49/28 = 1.75.", py: "b, c = 18, 10\nanswer = (abs(b-c)-1)**2/(b+c)" });
Q({ id: "ai-pt-2", d: 2, secs: 60, prompt: "Is that result significant at the 5% level (critical value 3.84)?", options: ["Yes", "No"], answer: 1, explain: "1.75 < 3.84.", py: "answer = 0 if (abs(18-10)-1)**2/28 > 3.84 else 1" });
Q({ id: "ai-pt-3", d: 3, secs: 90, prompt: "McNemar p-value for b = 30, c = 12 (continuity-corrected χ², 1 df)? (3 decimals)", answer: 0.009, tol: 0.002, explain: "χ² = (18 − 1)²/42 = 6.88; p ≈ 0.0087.", py: "from scipy.stats import chi2\nanswer = float(chi2.sf((abs(30-12)-1)**2/42, 1))", packages: ["scipy"] });
C("ai-pt-c1", "Comparing prompts", "Same cases, count fixes (b) vs breaks (c); McNemar (|b − c| − 1)²/(b + c).");

L("ai-context-eng", M, "Long context and context engineering", "What to put in the window, in what order, and why more context can make answers worse.", {
  kind: "concept", mins: 20, prereq: ["ai-prompt-patterns"],
  hook: "The model has a 200K-token window. Why not paste all 300 pages of the credit policy into every call?",
  intuition: `
**The situation.** Long-context models tempt you to include everything. But cost and prefill latency grow with every token, and accuracy doesn't reliably improve: models can miss information buried in the middle of long inputs, and irrelevant text distracts them.

**Context engineering** is deciding what the model sees for each call:

- **Select:** retrieve or filter to the relevant parts instead of dumping everything.
- **Order:** put stable content first (cacheable), the most relevant material where the model attends well (often near the start or end), and the question close to the material.
- **Compress:** summarise old conversation turns, drop resolved tool outputs, keep IDs instead of full records.
- **Budget:** reserve room for the output and for future turns.

For agents, context grows every step (tool results, observations), so managing it is a core design task, not an afterthought.
`,
  maths: `
**In one breath.** Budget: chunks that fit $= \\lfloor(\\text{window} - \\text{system} - \\text{reserved output} - \\text{question})/\\text{chunk size}\\rfloor$; prefill cost grows at least linearly with tokens.

**Worked example (budget).** 128,000-token window, 3,000-token system prompt, 4,000 reserved for output, 500-token question, 800-token chunks: $\\lfloor 120{,}500/800 \\rfloor = 150$ chunks. That you can fit 150 doesn't mean you should.

**Worked example (cost).** 150,000 input tokens per call at \\$0.50/M is \\$0.075 per call; 10 targeted chunks (8,000 tokens) cost \\$0.004: about 19× cheaper, and often more accurate.

**Position effect.** In multi-document QA experiments, accuracy is typically highest when the relevant passage is at the start or end of the context and lower in the middle. Put the best evidence near the edges, and keep the total short enough that position matters less.

**Conversation memory.** Keep the last few turns verbatim, a running summary of older turns, and structured facts (borrower ID, promised payment date) in a fixed slot.
`,
  practice: `
**Checklist.** Measure accuracy vs context size on your own eval (often it peaks and then declines); retrieve and rerank instead of stuffing; label sources inside the context with IDs so answers can cite them; trim tool outputs to the fields needed; for long chats, summarise with care for numbers and commitments.

**Caching interaction.** Stable content first maximises prefix-cache hits; per-call retrieved chunks go after it.
`,
  traps: [
    { trap: "A bigger context window means you can skip retrieval.", why: "Cost and latency scale with tokens, and accuracy often drops with long, noisy contexts. Selection still matters." },
    { trap: "Where the key fact sits in the prompt doesn't matter.", why: "Models often use information at the beginning and end of long inputs better than the middle. Order and length both matter." },
    { trap: "Summarise the conversation freely to save tokens.", why: "Summaries can drop or distort numbers, dates and promises. Keep critical facts in structured fields verbatim." },
  ],
  say: {
    prompt: "With a very long context window available, how do you decide what goes into the prompt?",
    secs: 45,
    check: ["Cost and TTFT grow with tokens; window size isn't a target", "Select/retrieve relevant content; measure accuracy vs context length", "Order: stable first (cache), evidence near the question/edges; lost-in-the-middle", "Compress history; keep critical facts structured", "Reserve output budget; label sources for citation"],
    followups: [
      { q: "What is 'lost in the middle'?", a: "The finding that models answer best when the relevant information is near the beginning or end of a long context, and worse when it's in the middle." },
      { q: "How would you manage context for a 40-turn collections call?", a: "Keep recent turns verbatim, a running summary of earlier ones, and structured slots for amounts, dates and commitments; drop or compress old tool outputs." },
      { q: "When is putting a whole document in context reasonable?", a: "When it's short relative to the window, used for many questions (cacheable), and the task needs global understanding (e.g. summarising the whole document)." },
    ],
    answer: `Window size is a ceiling, not a target. Every token costs money and prefill time, and models often get worse with long, noisy contexts, especially for facts buried in the middle. So I select: retrieve and rerank the relevant parts, trim tool outputs, and keep long conversations as recent turns plus a summary plus structured facts like amounts and dates.

Then I order deliberately: stable system content first so it's cached, then the selected evidence labelled with IDs for citation, with the question close to it, and I reserve space for the output. I'd plot accuracy against context size on our eval to find where adding more stops helping.`,
    avoid: ["\u201cJust put everything in; the window is big enough\u201d", "Ignoring cost and latency"],
  },
  terms: [["Context engineering", "Selecting, ordering and compressing what the model sees."], ["Lost in the middle", "Weaker use of information placed mid-context."], ["Context budget", "Token allocation across system, evidence, history and output."]],
  sources: [S.lim, S.claude],
});
Q({ id: "ai-ce-1", d: 1, secs: 45, prompt: "128,000-token window; system 3,000, reserved output 4,000, question 500; chunks of 800 tokens. Maximum whole chunks?", answer: 150, tol: 0.5, explain: "floor(120,500/800) = 150.", py: "answer = (128000-3000-4000-500)//800" });
Q({ id: "ai-ce-2", d: 1, secs: 45, prompt: "Input price $0.50 per million. Cost ratio of a 150,000-token call to an 8,000-token call?", answer: 18.75, tol: 0.01, explain: "150,000/8,000 = 18.75×.", py: "answer = 150000/8000" });
Q({ id: "ai-ce-3", d: 1, secs: 30, prompt: "Where should the most relevant evidence go in a long prompt, given the lost-in-the-middle effect?", options: ["Exactly in the middle", "Near the start or end, close to the question", "Anywhere; position doesn't matter", "Split across the whole prompt"], answer: 1, explain: "Models tend to use information at the edges of long contexts better.", py: "answer = 1" });
C("ai-ce-c1", "Context engineering", "Select → order (stable first, evidence near question) → compress → reserve output.");

L("ai-prompt-rag-ft", M, "Prompting vs RAG vs fine-tuning", "Choosing how to give a model knowledge or behaviour, by what changes and how often.", {
  kind: "concept", mins: 20, prereq: ["ai-prompt-patterns", "ai-context-eng"],
  hook: "The voice bot must follow a 40-page collections policy that changes monthly and speak in a specific polite Hindi register. Prompt, RAG or fine-tune?",
  intuition: `
**The situation.** You can change what a model knows or how it behaves in three ways, with very different costs.

- **Prompting:** instructions and examples in context. Instant to change, no training, but limited by context length and paid on every call.
- **RAG:** retrieve relevant documents at query time and put them in context. Best for **knowledge** that is large, changes often, or needs citations and access control.
- **Fine-tuning:** update model weights on examples. Best for **behaviour**: format, tone, style, domain phrasing, or a narrow task done cheaply by a small model. Bad at injecting fast-changing facts (they go stale and are hard to cite or delete).

**Decision rule.** Start with prompting; add RAG when the knowledge doesn't fit or changes; fine-tune when you have hundreds to thousands of good examples of a behaviour that prompting can't reliably produce, or to shrink cost and latency. They combine: a fine-tuned small model with RAG is common.

For the voice bot: policy → RAG (changes monthly, needs exact clauses); polite Hindi register → prompt with examples first, fine-tune a smaller model if it's not consistent or too expensive.
`,
  maths: `
**In one breath.** Compare total monthly cost: prompt tokens × calls × price vs one-off fine-tune + cheaper per-call cost; and freshness: a fine-tune is only as current as its training data.

**Worked example.** A 3,500-token instruction block is sent on 10 lakh calls/month at \\$0.50/M: \\$1,750/month. A fine-tuned model that no longer needs it costs \\$3,000 to train and saves \\$1,750/month: payback in under 2 months, if quality holds and the behaviour is stable.

**Knowledge freshness.** Policy updated monthly: fine-tuning would need monthly retraining plus evals; RAG only needs re-indexing the changed pages.

| Need | Prompt | RAG | Fine-tune |
|---|---|---|---|
| Large / changing knowledge | ✕ | ✓ | ✕ |
| Citations, access control | partial | ✓ | ✕ |
| Consistent format/tone | ✓ (examples) | — | ✓✓ |
| Lower per-call cost/latency | — | — | ✓ (smaller model) |
| Time to change | minutes | hours | days |
`,
  practice: `
**Before fine-tuning:** exhaust prompt improvements; collect high-quality examples (often from logged, corrected outputs); hold out an eval set; compare against the best prompted baseline including cost.

**Parameter-efficient fine-tuning** (adapters such as LoRA) trains a small number of extra weights; cheaper and easy to swap per task.

**Watch for:** fine-tunes that forget general skills, and RAG pipelines where retrieval, not the model, is the failing part.
`,
  traps: [
    { trap: "Fine-tune the model on our policy documents so it knows them.", why: "Fine-tuning is weak at reliable fact injection: facts get blurred, go stale and can't be cited or removed. Use RAG for knowledge." },
    { trap: "RAG fixes tone and format problems.", why: "Retrieval supplies information, not behaviour. Tone and format are prompt or fine-tuning problems." },
    { trap: "Fine-tuning is the advanced option, so it's better.", why: "It's slower to iterate, needs data and evals, and often loses to a good prompt plus retrieval. Use it for a specific, measured gap." },
  ],
  say: {
    prompt: "How do you choose between prompt engineering, RAG and fine-tuning?",
    secs: 45,
    check: ["Prompting first: fastest iteration", "RAG for large/changing knowledge, citations, permissions", "Fine-tuning for behaviour (format, tone), narrow tasks, cheaper smaller models", "Cost/freshness arithmetic; combinations are common", "Decide with evals against the best baseline"],
    followups: [
      { q: "Why is fine-tuning bad for fast-changing facts?", a: "Each change needs retraining and re-evaluation; old facts persist in the weights; answers can't cite a source or be updated or deleted per document." },
      { q: "What data do you need to fine-tune for tone?", a: "Hundreds to a few thousand high-quality input→ideal-output pairs, ideally from real traffic, reviewed for the target style, plus a held-out set." },
      { q: "Can you combine them?", a: "Yes: e.g. a fine-tuned small model for format and tone, RAG for current policy, and a prompt for task instructions." },
    ],
    answer: `I start with prompting because it's the fastest to iterate. If the model needs knowledge that's large, changes often, or must be cited and permissioned, like a monthly-updated credit policy, I add RAG. Fine-tuning is for behaviour rather than facts: consistent format or tone, a narrow task, or getting a small cheap model to do what a big prompted model does, and it needs hundreds to thousands of good examples.

I decide with evals against the best prompted baseline and with cost arithmetic: a long fixed instruction block on millions of calls can justify a fine-tune, while monthly-changing facts can't. They often combine, like a fine-tuned small model plus retrieval.`,
    avoid: ["\u201cFine-tune it on the documents\u201d for knowledge", "Fine-tuning before trying a good prompt"],
  },
  terms: [["RAG", "Retrieval-augmented generation: retrieved documents in context."], ["Fine-tuning", "Updating weights on task examples."], ["Parameter-efficient fine-tuning", "Training small adapter weights instead of the full model."]],
  sources: [S.ragS, S.claude],
});
Q({ id: "ai-prf-1", d: 1, secs: 45, prompt: "A 3,500-token instruction block on 10,00,000 calls/month at $0.50/M input. Monthly cost in dollars?", answer: 1750, tol: 0.5, explain: "3,500 × 1e6 × 0.5/1e6 = $1,750.", py: "answer = 3500*1e6*0.5/1e6" });
Q({ id: "ai-prf-2", d: 2, secs: 45, prompt: "A fine-tune costs $3,000 once and removes that $1,750/month. Payback in months? (2 decimals)", answer: 1.71, tol: 0.01, explain: "3000/1750 = 1.71.", py: "answer = 3000/1750" });
Q({ id: "ai-prf-3", d: 1, secs: 30, prompt: "The collections policy changes monthly and agents must quote the exact clause. Best approach?", options: ["Fine-tune monthly", "RAG over the current policy", "Longer system prompt with all 40 pages", "Increase temperature"], answer: 1, explain: "Changing knowledge with citations → retrieval.", py: "answer = 1" });
C("ai-prf-c1", "Knowledge vs behaviour", "Knowledge (changing, citable) → RAG. Behaviour (format, tone, narrow task) → prompt, then fine-tune.");

L("ai-prompting-practice", M, "Prompting practice", "Interview scenarios on prompt design, structured output and choosing techniques.", {
  kind: "interview", mins: 35, prereq: ["ai-prompt-patterns", "ai-reasoning-prompts", "ai-structured-output", "ai-prompt-testing", "ai-context-eng", "ai-prompt-rag-ft"],
  hook: "Answer each scenario out loud in about a minute, then open it and tick off the points the interviewer is listening for.",
}, [
  iq("A prompt fix for one customer complaint broke three other flows in production. How do you stop this from happening again?", "Build a regression suite from real traffic and past incidents with must-pass cases and slices; run it in CI for every prompt change; compare paired results; canary new prompts; version prompts and log the version per call so incidents trace to a change.", ["Regression suite incl. past incidents", "CI gate on prompt changes", "Paired comparison / slices", "Canary + versioning"]),
  iq("Your extraction model returns valid JSON but the 'loan_amount' is wrong in 8% of documents. What do you do?", "Shape isn't the problem; accuracy is. Look at failures: wrong section read, units (lakh vs rupees), OCR noise. Add an evidence/quote field before the value, definitions and examples for units, validation rules (amount vs EMI × tenure consistency), and possibly a second-pass verifier or code check; measure on a labelled set.", ["Error analysis first", "Evidence field before value", "Definitions/examples for units", "Cross-field validation / verifier"]),
  iq("When would you turn on a reasoning model or chain of thought for a live voice agent?", "Only for turns needing multi-step reasoning (payment plan calculation, eligibility), since it adds latency to TTFT. Route by intent: fast model for small talk and confirmations, reasoning or a tool call for calculations; or do reasoning offline (post-call). Measure accuracy gain vs latency.", ["Latency cost in voice", "Route hard turns only", "Tools for arithmetic", "Measure trade-off"]),
  iq("A PM wants to fine-tune a model on all past call transcripts so it 'knows' the company. Respond.", "Clarify the goal: knowledge vs behaviour. For policy facts use RAG (fresh, citable). For style and handling patterns, fine-tuning on curated good transcripts can help, but raw transcripts include bad agent behaviour and PII. Start with prompting + RAG, collect a curated dataset, compare with evals.", ["Knowledge vs behaviour", "Data quality and PII", "RAG for facts", "Eval-driven decision"]),
  iq("Your prompt is 9,000 tokens and growing. How do you bring it under control?", "Audit what each section does with ablation on the eval set; move reference material to retrieval; replace rule lists with a few examples; split into a router + specialised prompts or a chain; keep static parts first for caching; track cost and accuracy per change.", ["Ablation on evals", "Retrieval for reference text", "Decompose / route", "Caching and cost tracking"]),
]);
