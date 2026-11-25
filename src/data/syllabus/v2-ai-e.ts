/**
 * v2 AI engineering, part E: Applied evals.
 * Fixed ids. Every quiz answer is recomputed in Pyodide (scripts/verify-items.mts).
 */
import { CHECKED, iq, lessonWriter } from "./v2-shared";

const { L, Q, C } = lessonWriter("aieng");
const M = "Applied evals";
const src = (label: string, url: string) => ({ label, url, checked: CHECKED });
const S = {
  tests: src("Claude Platform docs: define success criteria and build evaluations", "https://platform.claude.com/docs/en/test-and-evaluate/develop-tests"),
  judge: src("Zheng et al. (2023): Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena", "https://arxiv.org/abs/2306.05685"),
  ragas: src("Es et al. (2023): Ragas: Automated Evaluation of Retrieval Augmented Generation", "https://arxiv.org/abs/2309.15217"),
  kappa: src("scikit-learn: cohen_kappa_score", "https://scikit-learn.org/stable/modules/generated/sklearn.metrics.cohen_kappa_score.html"),
  bea: src("Anthropic (2024): Building effective AI agents", "https://www.anthropic.com/research/building-effective-agents"),
};

L("ai-eval-basics", M, "Why LLM apps fail and what to evaluate", "Success criteria, the kinds of evals (checks, regression sets, monitors, guardrails) and building a first eval set.", {
  kind: "concept", mins: 20,
  hook: "Your team ships prompt changes on vibes: someone tries five questions and says 'looks better'. What do you replace that with on Monday?",
  intuition: `
**The situation.** LLM outputs vary, fail silently, and break in places you didn't touch. Without evals, every change is a guess.

**Start from success criteria:** specific, measurable targets per dimension that matters: task accuracy, format validity, tone, safety/privacy, latency, cost. "Extracts EMI correctly in ≥ 95% of documents, p95 latency < 2 s".

**Four kinds of evals, by when they run.**

- **Ship checks:** fast assertions run on every change (JSON parses, required fields present, no PII in output).
- **Regression set:** a fixed, versioned set of cases with expected outputs or rubrics, run before release.
- **Online monitors:** sampled grading of live traffic plus user signals, to catch drift and new failure types.
- **Guardrails:** checks in the request path that block or fix bad outputs before users see them.

**First eval set.** Pull 100–300 real inputs from logs (stratified by type, language, channel), add known hard cases and synthetic edge cases, write expected outputs or rubrics. Grade with code where possible, an LLM judge for judgement calls, humans to calibrate both.
`,
  maths: `
**In one breath.** A pass rate $\\hat p$ on $n$ cases has 95% interval $\\approx \\hat p \\pm 1.96\\sqrt{\\hat p(1 - \\hat p)/n}$; to detect a difference $\\delta$ you need roughly $n \\approx 2(z_{\\alpha/2} + z_\\beta)^2 p(1 - p)/\\delta^2$ per arm (unpaired).

**Worked example (interval).** 170/200 pass: $\\hat p = 0.85$, half-width $1.96 \\times \\sqrt{0.85 \\times 0.15/200} = 0.049$: 80–90%.

**Worked example (size).** To detect 85% → 90% ($\\delta = 0.05$) with 80% power at 5% significance, unpaired: $2 \\times (1.96 + 0.84)^2 \\times 0.1275/0.0025 \\approx 800$ cases per arm. Paired comparisons on the same cases need far fewer: focus on disagreements.

**Grader choice.**

| Grader | Speed | Flexibility | Reliability |
|---|---|---|---|
| Code (match, schema, regex) | fastest | low | high |
| LLM judge | fast | high | needs validation |
| Human | slow | highest | gold standard, costly |
`,
  practice: `
**Make evals cheap to run** (one command, under 10 minutes), version them with the prompt/model, and report per slice. Add every production incident as a new case. Prefer many automatically graded cases over a few hand-graded ones, but calibrate automated graders against humans.
`,
  traps: [
    { trap: "Five good-looking examples mean the change works.", why: "Small, hand-picked samples overfit and hide regressions. Use a fixed regression set and look at the whole distribution." },
    { trap: "One overall score is enough.", why: "Averages hide slice failures (a language, a product, long inputs). Report by slice and track must-pass cases separately." },
    { trap: "We'll build evals after launch.", why: "Without a baseline you can't tell whether later changes help. A small eval set at the start is the cheapest one you'll ever build." },
  ],
  say: {
    prompt: "How would you set up evaluation for a new LLM feature?",
    secs: 60,
    check: ["Specific measurable success criteria per dimension", "Eval set from real logs + hard + synthetic cases, stratified", "Types: ship checks, regression set, online monitors, guardrails", "Graders: code first, LLM judge validated against humans", "Statistics: CIs / enough cases; slices; incidents become cases"],
    followups: [
      { q: "170 of 200 pass. 95% CI?", a: "0.85 ± 0.049, roughly 80–90%." },
      { q: "When is a human grader necessary?", a: "To build the gold labels that calibrate automated graders, for subtle quality or safety judgements, and for periodic audits." },
      { q: "How do you make evals part of the team's workflow?", a: "Run them in CI on every prompt/model change, show results in PRs, block on must-pass failures, add incidents as cases." },
    ],
    answer: `I'd start with specific success criteria for each dimension that matters, like extraction accuracy, format validity, tone, safety, latency and cost, with numeric targets. Then I'd build a first eval set from a few hundred real inputs from logs, stratified by type and language, plus known hard cases and synthetic edge cases, with expected outputs or rubrics.

Grading uses code wherever possible, an LLM judge for judgement calls that I validate against human labels, and humans to calibrate. Fast ship checks and the regression set run in CI on every change, online monitors sample live traffic, and guardrails sit in the request path. I report with confidence intervals and by slice, and every production incident becomes a new test case.`,
    avoid: ["Vibe checks on a few examples", "A single averaged score"],
  },
  terms: [["Success criteria", "Measurable targets that define 'good'."], ["Regression set", "Fixed cases re-run on every change."], ["Online monitor", "Sampled grading of production traffic."], ["Guardrail", "Runtime check that blocks or fixes outputs."]],
  sources: [S.tests],
});
Q({ id: "ai-eb-1", d: 2, secs: 60, prompt: "170 of 200 eval cases pass. Half-width of the 95% normal-approximation CI? (3 decimals)", answer: 0.049, tol: 0.002, explain: "1.96 × √(0.85 × 0.15/200) = 0.0495.", py: "answer = 1.96*(0.85*0.15/200)**0.5" });
Q({ id: "ai-eb-2", d: 3, secs: 120, prompt: "Unpaired cases per arm to detect 85% → 90% with 80% power at α = 0.05 (two-sided), using pooled p = 0.875? (nearest 10)", answer: 690, tol: 20, explain: "2 × (1.96 + 0.8416)² × 0.875 × 0.125/0.05² ≈ 687.", py: "from scipy.stats import norm\nz = norm.ppf(0.975) + norm.ppf(0.8)\nanswer = 2*z**2*0.875*0.125/0.05**2", packages: ["scipy"] });
Q({ id: "ai-eb-3", d: 1, secs: 30, prompt: "Which grader should you try first for 'the output is valid JSON with fields emi and tenure'?", options: ["Human review", "LLM judge", "Code-based check", "User feedback"], answer: 2, explain: "Deterministic properties → code checks: fastest and most reliable.", py: "answer = 2" });
C("ai-eb-c1", "Eval types", "Ship checks (every change) · regression set (pre-release) · online monitors (live) · guardrails (in path).");

L("ai-error-analysis", M, "Error analysis: from traces to failure rates", "Reading outputs systematically, building a failure taxonomy, and prioritising fixes.", {
  kind: "concept", mins: 20, prereq: ["ai-eval-basics"],
  hook: "You have 5,000 logged voice-bot conversations and a vague sense that 'it's not great'. Where do you start?",
  intuition: `
**The situation.** Metrics tell you that something is wrong, not what. The fastest way to improve an LLM product is to read outputs and categorise what goes wrong.

**Process.**

1. **Sample** traces (stratified: languages, outcomes, call lengths; oversample complaints and escalations).
2. **Open coding:** for each trace, write a short note on the first thing that went wrong.
3. **Cluster** notes into a failure taxonomy (wrong amount quoted, didn't handle "already paid", language switch failed, too long, hallucinated policy).
4. **Count** how often each occurs, weight by severity, and fix the top ones.
5. **Turn each category into an automated check** where possible, so you can track its rate over time.

Read the **first** error in each trace: later errors are often consequences.
`,
  maths: `
**In one breath.** Failure rate per category = count / traces reviewed; priority ≈ rate × severity × fixability; to estimate a rate within ±$m$ you need $n \\approx 1.96^2 p(1 - p)/m^2$ samples.

**Worked example (priority).** In 200 reviewed calls: wrong amount quoted 18 (severity 5), didn't handle "already paid" 30 (severity 3), too verbose 50 (severity 1). Rate × severity: 0.45, 0.45, 0.25: fix amounts and "already paid" first, verbosity last despite being most common.

**Worked example (sample size).** To estimate a ~10% failure rate within ±3 points: $1.96^2 \\times 0.09/0.0009 \\approx 384$ traces.

**Pareto.** Usually 3–5 categories cover most failures; a taxonomy of 40 tiny categories is a sign of not clustering.
`,
  practice: `
**Tools.** A simple spreadsheet or annotation UI showing input, retrieved context, tool calls and output; one note per trace; tags. Revisit the taxonomy as new failure types appear after fixes.

**Who reads.** Engineers and domain experts together (a collections team lead spots policy errors engineers miss).
`,
  traps: [
    { trap: "Jump straight to an LLM judge that scores 'quality' 1–10.", why: "Generic scores don't tell you what to fix. First find concrete failure types by reading; then build targeted checks for them." },
    { trap: "Log every error in a trace.", why: "Downstream errors are often caused by the first one; counting all inflates some categories. Note the first failure." },
    { trap: "The most frequent failure is the top priority.", why: "Weight by severity and fixability: a rare wrong-amount error can matter more than common verbosity." },
  ],
  say: {
    prompt: "How do you figure out what to fix in an underperforming LLM application?",
    secs: 45,
    check: ["Sample traces (stratified, oversample complaints)", "Open coding: note the first failure per trace", "Cluster into a taxonomy; count rates", "Prioritise by rate × severity (× fixability)", "Convert categories into automated evals; repeat"],
    followups: [
      { q: "How many traces to estimate a 10% failure rate within ±3 points?", a: "About 384." },
      { q: "Why the first failure only?", a: "Later errors are often consequences of the first, so fixing the first can remove them; counting them separately misleads prioritisation." },
      { q: "What do you do with the taxonomy afterwards?", a: "Write targeted checks (code or judge) per category, track rates per release, and add cases to the regression set." },
    ],
    answer: `I'd read before I measure. I sample a few hundred traces, stratified by language and outcome and oversampling complaints, and for each one write a short note on the first thing that went wrong, looking at the input, retrieved context, tool calls and output. Then I cluster the notes into a failure taxonomy, count each category, and prioritise by frequency times severity and how fixable it is, so a rare wrong-amount error can outrank common verbosity.

Each major category then becomes an automated check, code or a targeted judge, so I can track its rate across releases, and I repeat the exercise after fixes because new failure types appear.`,
    avoid: ["Starting with a generic 1–10 quality score", "Prioritising by frequency alone"],
  },
  terms: [["Open coding", "Free-form notes on each sample before categorising."], ["Failure taxonomy", "Clustered categories of observed errors."], ["Trace", "Full record of a request: input, context, tool calls, output."]],
  sources: [S.tests],
});
Q({ id: "ai-ea-1", d: 2, secs: 60, prompt: "Traces needed to estimate a ~10% failure rate within ±3 percentage points (95%)? (nearest whole number)", answer: 384, tol: 1, explain: "1.96² × 0.1 × 0.9/0.03² = 384.2.", py: "answer = 1.96**2*0.1*0.9/0.03**2" });
Q({ id: "ai-ea-2", d: 2, secs: 60, prompt: "In 200 calls: wrong amount 18 (severity 5), 'already paid' mishandled 30 (severity 3), verbose 50 (severity 1). Priority score (rate × severity) of 'verbose'?", answer: 0.25, tol: 0.002, explain: "50/200 × 1 = 0.25 vs 0.45 for the other two.", py: "answer = 50/200*1" });
Q({ id: "ai-ea-3", d: 1, secs: 30, prompt: "During error analysis, which error do you record for each trace?", options: ["Every error", "The first error", "The last error", "Only safety errors"], answer: 1, explain: "Downstream errors often follow from the first.", py: "answer = 1" });
C("ai-ea-c1", "Error analysis loop", "Sample → note first failure → cluster → count → prioritise (rate × severity) → automate checks.");

L("ai-llm-judge", M, "LLM judges and how far to trust them", "Pass/fail and pairwise judges, judge biases, and correcting pass rates with TPR and TNR.", {
  kind: "concept", mins: 25, prereq: ["ai-eval-basics"],
  hook: "Your LLM judge says 80% of bot replies are compliant. The judge itself is 90% sensitive and 85% specific. What's the real compliance rate?",
  intuition: `
**The situation.** Many qualities (polite, compliant with collections guidelines, faithful to the policy) can't be checked with code. An LLM judge reads the output against a rubric and returns a verdict.

**Good judge design.**

- **Binary pass/fail per criterion** beats a 1–10 score: easier to calibrate and act on.
- **Specific rubric** with examples of pass and fail.
- **Reasoning before verdict**, verdict in a fixed field.
- **Pairwise comparison** (A vs B) for preference questions; randomise order.
- A **different model** from the one being judged, where practical.

**Known biases.** Position (prefers the first option), verbosity (prefers longer answers), self-preference (prefers its own model family's style).

**Trust but verify.** Label 100–200 outputs by humans; measure the judge's true positive rate (passes it gives to truly good outputs) and true negative rate (fails it gives to truly bad ones). Then correct the observed pass rate.
`,
  maths: `
**In one breath.** Observed pass rate $o = \\text{TPR}\\cdot\\pi + (1 - \\text{TNR})(1 - \\pi)$, so the true rate is $\\pi = \\frac{o + \\text{TNR} - 1}{\\text{TPR} + \\text{TNR} - 1}$.

**Worked example.** $o = 0.80$, TPR 0.90, TNR 0.85: $\\pi = (0.80 + 0.85 - 1)/(0.90 + 0.85 - 1) = 0.65/0.75 = 0.867$. The judge under-reports here because it fails some good outputs.

**Another.** $o = 0.80$, TPR 0.98, TNR 0.60: $\\pi = 0.40/0.58 = 0.69$. A lenient judge (low TNR) hides real failures; TNR is often the number to improve.

**Measuring TPR/TNR.** On 200 human-labelled outputs: 140 truly pass, judge passes 126 of them (TPR 0.9); 60 truly fail, judge fails 51 (TNR 0.85).

**Uncertainty.** TPR and TNR come from a finite labelled set; bootstrap the corrected rate to get an interval.
`,
  practice: `
**Workflow.** Write rubric → human-label a dev set → iterate the judge prompt until TPR and TNR are acceptable (especially on fails) → freeze it → check on a held-out labelled set → report corrected rates → re-check periodically and after judge-model changes.

**Pairwise judging** for prompt A/B: run both orders and count a win only if consistent.
`,
  traps: [
    { trap: "The judge agrees with me on a few examples, so it's reliable.", why: "Measure TPR and TNR on a labelled set; judges are often lenient (low TNR), which inflates pass rates." },
    { trap: "Use a 1–10 quality score and average it.", why: "Scores drift and are hard to calibrate or act on. Binary verdicts per specific criterion are more reliable." },
    { trap: "Pairwise judging in one order is fine.", why: "Position bias can flip results. Swap orders and only count consistent wins." },
  ],
  say: {
    prompt: "How do you build and validate an LLM-as-a-judge evaluator?",
    secs: 60,
    check: ["Specific rubric, binary verdict per criterion, reasoning before verdict", "Pairwise with order swapping for preferences", "Biases: position, verbosity, self-preference", "Validate on human labels: TPR and TNR on held-out set", "Correct observed pass rates: (o + TNR − 1)/(TPR + TNR − 1); re-validate over time"],
    followups: [
      { q: "Observed 0.80, TPR 0.90, TNR 0.85: true rate?", a: "(0.80 + 0.85 − 1)/(0.90 + 0.85 − 1) ≈ 0.867." },
      { q: "Which matters more for a compliance judge, TPR or TNR?", a: "Usually TNR: missing real violations (calling them pass) is the costly error, and lenient judges hide failures." },
      { q: "How do you reduce verbosity bias?", a: "Rubrics that explicitly ignore length, length-matched comparisons, and checking whether verdicts correlate with length." },
    ],
    answer: `I write a specific rubric with examples and ask for a pass/fail verdict per criterion, with reasoning first and the verdict in a fixed field; for preferences I use pairwise comparison in both orders. Judges have known biases, position, verbosity and preferring their own style, so I use a different model where I can.

Then I validate: humans label a couple of hundred outputs, I iterate the judge until its true positive and true negative rates are good, particularly at catching failures, and check them on a held-out set. When reporting, I correct the observed pass rate with those rates, and I re-validate whenever the judge model or rubric changes.`,
    avoid: ["Trusting judge scores without human calibration", "Averaging 1–10 scores"],
  },
  terms: [["LLM judge", "An LLM grading outputs against a rubric."], ["TPR / TNR", "Judge's pass rate on truly good / fail rate on truly bad outputs."], ["Position bias", "Preference for an answer because of its order."]],
  sources: [S.judge, S.tests],
});
Q({ id: "ai-lj-1", d: 2, secs: 60, prompt: "Judge pass rate 0.80, TPR 0.90, TNR 0.85. Corrected true pass rate? (3 decimals)", answer: 0.867, tol: 0.002, explain: "(0.80 + 0.85 − 1)/(0.90 + 0.85 − 1) = 0.65/0.75.", py: "o, tpr, tnr = 0.8, 0.9, 0.85\nanswer = (o + tnr - 1)/(tpr + tnr - 1)" });
Q({ id: "ai-lj-2", d: 2, secs: 60, prompt: "Judge pass rate 0.80, TPR 0.98, TNR 0.60. Corrected true pass rate? (3 decimals)", answer: 0.69, tol: 0.002, explain: "0.40/0.58 = 0.690: a lenient judge hides failures.", py: "o, tpr, tnr = 0.8, 0.98, 0.6\nanswer = (o + tnr - 1)/(tpr + tnr - 1)" });
Q({ id: "ai-lj-3", d: 1, secs: 45, prompt: "60 outputs are truly failing; the judge fails 51 of them. TNR?", answer: 0.85, tol: 0.002, explain: "51/60.", py: "answer = 51/60" });
Q({ id: "ai-lj-4", d: 2, secs: 60, prompt: "If the true pass rate is 0.7 with TPR 0.9 and TNR 0.85, what pass rate will the judge report? (3 decimals)", answer: 0.675, tol: 0.002, explain: "0.9 × 0.7 + 0.15 × 0.3 = 0.63 + 0.045 = 0.675.", py: "answer = 0.9*0.7 + (1-0.85)*0.3" });
C("ai-lj-c1", "Correcting a judge", "π = (observed + TNR − 1)/(TPR + TNR − 1).");

L("ai-labelling-kappa", M, "Labelling with a team: rubrics and Cohen's kappa", "Writing rubrics people apply consistently, and measuring agreement beyond chance.", {
  kind: "concept", mins: 20, prereq: ["ai-llm-judge"],
  hook: "Two reviewers agree on 85% of bot replies being 'polite'. Is that good agreement?",
  intuition: `
**The situation.** Human labels are the ground truth for judges and evals. If two experts disagree, the label is noise, and so is any metric built on it.

**Rubrics.** Turn vague criteria into checkable statements with examples: "Polite = no threats, no blaming language, uses the borrower's name or 'aap', offers a next step." Include borderline examples and how to label them.

**Agreement.** Raw agreement looks high when one label dominates: if 90% of replies are polite, two reviewers labelling everything polite agree 90% of the time without reading. **Cohen's kappa** corrects for the agreement expected by chance.

**Process.** Two or more people label the same 50–100 items, compute kappa, discuss disagreements, refine the rubric, repeat until agreement is acceptable; then split labelling and keep a small overlap to monitor drift.
`,
  maths: `
**In one breath.** $\\kappa = \\frac{p_o - p_e}{1 - p_e}$, where $p_o$ is observed agreement and $p_e = \\sum_c p_{1c}p_{2c}$ is chance agreement from each rater's label distribution.

**Worked example.** 100 items. Rater 1 says polite 80 times, rater 2 says polite 75 times; they agree on 70 polite and 15 impolite. $p_o = 0.85$; $p_e = 0.8 \\times 0.75 + 0.2 \\times 0.25 = 0.65$; $\\kappa = (0.85 - 0.65)/0.35 = 0.571$: moderate, not great.

**Rough reading.** < 0.4 poor, 0.4–0.6 moderate, 0.6–0.8 substantial, > 0.8 strong (conventions vary). Aim for > 0.6–0.7 on criteria you'll build judges against.

**Judges too.** Treat the LLM judge as another rater: kappa between judge and the human consensus is a single-number summary alongside TPR/TNR.
`,
  practice: `
**Tips.** Fewer, sharper labels beat fine scales; binary criteria agree better than 1–5. Record disagreements and their resolution as rubric examples. Domain experts (collections supervisors) label policy compliance; generalists can label format.
`,
  traps: [
    { trap: "85% raw agreement is high, so labels are reliable.", why: "With imbalanced labels much of that is chance. Kappa can be modest (0.57 in the example). Report kappa." },
    { trap: "Use a 1–10 scale for more nuance.", why: "Fine scales lower agreement and are hard to use consistently. Binary or 3-level labels with clear rubrics work better." },
    { trap: "Once the rubric is agreed, labelling stays consistent.", why: "Labellers drift over time. Keep an overlap sample and recompute agreement periodically." },
  ],
  say: {
    prompt: "How do you make human labels reliable enough to evaluate an LLM system?",
    secs: 45,
    check: ["Rubric with concrete criteria and borderline examples", "Overlap labelling; measure agreement", "Cohen's kappa corrects for chance; raw agreement misleads with imbalance", "Iterate rubric until kappa acceptable; binary/coarse labels", "Monitor drift with ongoing overlap; experts for domain criteria"],
    followups: [
      { q: "p_o = 0.85 and p_e = 0.65. Kappa?", a: "(0.85 − 0.65)/(1 − 0.65) ≈ 0.57." },
      { q: "Why can kappa be low with high raw agreement?", a: "When one label dominates, chance agreement p_e is already high, so the agreement beyond chance is small." },
      { q: "What do you do with persistent disagreements?", a: "Discuss them, add the resolution as a rubric example, or split the criterion if raters mean different things." },
    ],
    answer: `I write a rubric that turns each criterion into checkable statements with pass, fail and borderline examples, prefer binary labels, and have two or more people label the same 50 to 100 items. Raw agreement is misleading when one label dominates, so I compute Cohen's kappa, which subtracts the agreement expected by chance; 85% agreement can be a kappa of only about 0.57.

We discuss disagreements, refine the rubric and repeat until kappa is acceptable, around 0.6–0.7 or better, then split the work, keep an overlap sample to watch for drift, and use domain experts for policy criteria. The same kappa check applies between an LLM judge and the human consensus.`,
    avoid: ["Reporting only raw agreement", "Fine-grained 1–10 labels"],
  },
  terms: [["Cohen's kappa", "Agreement corrected for chance: (p_o − p_e)/(1 − p_e)."], ["Rubric", "Explicit criteria and examples for labelling."], ["Overlap sample", "Items labelled by several raters to measure agreement."]],
  sources: [S.kappa, S.tests],
});
Q({ id: "ai-lk-1", d: 2, secs: 60, prompt: "Observed agreement 0.85, chance agreement 0.65. Cohen's kappa? (3 decimals)", answer: 0.571, tol: 0.002, explain: "(0.85 − 0.65)/(1 − 0.65) = 0.571.", py: "answer = (0.85-0.65)/(1-0.65)" });
Q({ id: "ai-lk-2", d: 2, secs: 90, prompt: "100 items: both 'polite' 70, both 'impolite' 15, only rater 1 says polite 10, only rater 2 says polite 5. Cohen's kappa? (3 decimals)", answer: 0.571, tol: 0.002, explain: "p_o = 0.85; rater 1 polite 80%, rater 2 75%; p_e = 0.8 × 0.75 + 0.2 × 0.25 = 0.65; κ = 0.20/0.35.", py: "from sklearn.metrics import cohen_kappa_score\na = [1]*70 + [0]*15 + [1]*10 + [0]*5\nb = [1]*70 + [0]*15 + [0]*10 + [1]*5\nanswer = float(cohen_kappa_score(a, b))", packages: ["scikit-learn"] });
Q({ id: "ai-lk-3", d: 1, secs: 30, prompt: "Both raters label 90% of items 'polite' independently at random. Chance agreement p_e?", answer: 0.82, tol: 0.002, explain: "0.9 × 0.9 + 0.1 × 0.1 = 0.82.", py: "answer = 0.9*0.9 + 0.1*0.1" });
C("ai-lk-c1", "Cohen's kappa", "κ = (p_o − p_e)/(1 − p_e); p_e from each rater's label mix.");

L("ai-rag-agent-evals", M, "Evaluating RAG systems and agents", "Retrieval, faithfulness and relevance for RAG; end states, pass@k vs pass^k, tool use and cost for agents.", {
  kind: "concept", mins: 25, prereq: ["ai-llm-judge", "ai-retrieval-metrics"],
  hook: "Your agent solves 80% of test tasks on one try. Ops will run it three times a day on every case and needs it to work every time. What's the right metric?",
  intuition: `
**RAG evals: grade each stage.**

- **Context recall / retrieval:** did the gold evidence reach the model (recall@k)?
- **Faithfulness:** are the answer's claims supported by the retrieved context?
- **Answer relevance / correctness:** does it address the question, and is it right versus a reference?

Splitting these tells you which part to fix.

**Agent evals: check outcomes, not just text.**

- **End state:** after the run, is the world in the right state (follow-up created with the right date, nothing else changed)? Check the database, not the agent's claim.
- **Trajectory:** right tools, valid arguments, no forbidden actions, reasonable number of steps.
- **Cost and latency** per task.
- **Consistency:** agents are stochastic; run each task several times.

**pass@k vs pass^k.** pass@k: at least one of k tries succeeds (fine when a human picks the best). pass^k: all k tries succeed (what you need when it runs unattended every time).
`,
  maths: `
**In one breath.** With per-trial success $p$ (independent): pass@k $= 1 - (1 - p)^k$; pass^k $= p^k$.

**Worked example.** $p = 0.8$, $k = 3$: pass@3 = 0.992, pass^3 = 0.512. Same agent, very different story.

**Estimating per task.** Run each task $n$ times; a task with 4 of 5 successes has $\\hat p = 0.8$; average pass^k across tasks using each task's own $\\hat p$, since tasks differ in difficulty.

**Faithfulness score.** Claims supported / claims: 9 of 12 → 0.75.

**Cost per success.** Average cost per run ₹3, success rate 0.75 with retries until success: expected cost per successful task $= 3/0.75 = ₹4$.
`,
  practice: `
**Test environments for agents.** Sandbox copies of systems with seeded data, simulated users for multi-turn tasks, deterministic tool mocks for unit tests, and real-system replays for integration. Grade end states with code; use judges for conversation quality.

**Report** success, pass^k on critical tasks, mean steps, tool-error rate, cost and latency per task, by task type.
`,
  traps: [
    { trap: "Grade the agent by reading its final message.", why: "Agents can claim success without doing the work, or do extra damage. Check the actual end state in the system." },
    { trap: "Report pass@k for an unattended agent.", why: "pass@k assumes you can pick the best of k tries. For unattended runs reliability is pass^k, which can be far lower." },
    { trap: "A single end-to-end RAG score is enough.", why: "It can't tell retrieval failures from generation failures. Evaluate recall, faithfulness and correctness separately." },
  ],
  say: {
    prompt: "How do you evaluate a RAG system and a tool-using agent differently?",
    secs: 60,
    check: ["RAG: retrieval recall, faithfulness, answer relevance/correctness, separately", "Agents: end-state checks in the environment, not the final message", "Trajectory checks: tools, arguments, forbidden actions, steps", "Stochasticity: multiple trials; pass@k vs pass^k", "Cost and latency per task; sandboxes and simulated users"],
    followups: [
      { q: "p = 0.8, k = 3: pass@3 and pass^3?", a: "0.992 and 0.512." },
      { q: "How do you test multi-turn agents?", a: "Simulated users following scripted personas and goals, with end-state and conversation-quality grading, plus replay of real conversations." },
      { q: "What's a forbidden-action check?", a: "Assert the agent never called certain tools or touched certain records (e.g. didn't change loan terms) during the task." },
    ],
    answer: `For RAG I grade the stages separately: did retrieval bring the gold evidence into context, is every claim in the answer supported by that context, and does the answer address the question correctly. That tells me whether to fix retrieval or generation.

For agents I care about what they did, not what they said: I run tasks in a sandbox with seeded data and check the end state with code, check the trajectory for correct tools, valid arguments and no forbidden actions, and track steps, cost and latency. Agents are stochastic, so I run each task several times; if it runs unattended, the right reliability metric is pass^k, all k runs succeed, which at 80% per run is only 51% for three runs.`,
    avoid: ["Trusting the agent's own success message", "Using pass@k for unattended automation"],
  },
  terms: [["pass@k", "Probability at least one of k trials succeeds."], ["pass^k", "Probability all k trials succeed."], ["End-state check", "Verifying system state after an agent run."], ["Faithfulness", "Claims supported by the retrieved context."]],
  sources: [S.ragas, S.bea],
});
Q({ id: "ai-rae-1", d: 1, secs: 30, prompt: "Per-trial success 0.8. pass@3? (3 decimals)", answer: 0.992, tol: 0.002, explain: "1 − 0.2³ = 0.992.", py: "answer = 1 - 0.2**3" });
Q({ id: "ai-rae-2", d: 1, secs: 30, prompt: "Per-trial success 0.8. pass^3? (3 decimals)", answer: 0.512, tol: 0.002, explain: "0.8³ = 0.512.", py: "answer = 0.8**3" });
Q({ id: "ai-rae-3", d: 2, secs: 60, prompt: "Two tasks with per-trial success 1.0 and 0.6. Average pass^3 across them? (3 decimals)", answer: 0.608, tol: 0.002, explain: "(1 + 0.216)/2 = 0.608; using the pooled 0.8 would give 0.512.", py: "answer = (1.0**3 + 0.6**3)/2" });
Q({ id: "ai-rae-4", d: 1, secs: 30, prompt: "Each run costs ₹3 and succeeds 75% of the time; you retry until success. Expected cost per successful task in rupees?", answer: 4, tol: 0.01, explain: "3/0.75 = ₹4.", py: "answer = 3/0.75" });
C("ai-rae-c1", "pass@k vs pass^k", "pass@k = 1 − (1 − p)^k (best of k). pass^k = p^k (all k succeed).");

L("ai-evals-ops", M, "Evals in CI, online evals and model upgrades", "Golden sets as release gates, sampled grading of live traffic, user signals, and switching models safely.", {
  kind: "concept", mins: 20, prereq: ["ai-eval-basics", "ai-llm-judge"],
  hook: "Your provider retires the model you use next month. How do you know the replacement won't break your bot?",
  intuition: `
**Offline evals in CI.** Every change (prompt, model, retrieval, tools) runs the golden regression set automatically. Gates: no must-pass failures, no significant drop overall or on key slices, latency and cost within budget. Results appear in the pull request.

**Online evals.** Offline sets age as traffic changes. In production:

- **Sampled grading:** run judges on a random sample of live outputs (plus all flagged ones).
- **User and business signals:** thumbs, escalations to humans, repeat contacts, payment promised and kept.
- **Guardrail hit rates:** how often outputs are blocked or repaired.
- **Drift:** input mix changes (new product, new language).

**Model upgrades** are releases: run the full suite on the new model, compare paired and by slice, fix prompts where it regresses, shadow it on live traffic, canary, then switch, keeping the old model as fallback until confident.
`,
  maths: `
**In one breath.** Sampling a fraction $f$ of $N$ outputs gives $fN$ graded items; a rate estimate from $n$ graded items has SE $\\sqrt{p(1 - p)/n}$; judge cost = graded items × cost per judgement.

**Worked example.** 1,00,000 conversations/week, 2% sampled: 2,000 graded. A 5% failure rate is estimated within about $\\pm 1.96\\sqrt{0.05 \\times 0.95/2000} = \\pm 0.0096$. At ₹0.40 per judgement: ₹800/week.

**Detecting a rise.** If the failure rate jumps from 5% to 7% between two weeks with 2,000 samples each, the difference SE is $\\sqrt{0.05 \\cdot 0.95/2000 + 0.07 \\cdot 0.93/2000} \\approx 0.0075$; $z = 0.02/0.0075 = 2.66$: detectable.

**Release gate example.** Block if any must-pass case fails, if overall pass drops more than 2 points (paired, significant), or if p95 latency rises more than 20%.
`,
  practice: `
**Plumbing.** Log prompt version, model version, retrieved IDs and tool calls with each output; sample by stratum (language, intent) so small slices get enough graded items; dashboards per slice; alerts on rate changes.

**Close the loop.** Online failures become offline test cases; judge disagreements with humans become rubric fixes.
`,
  traps: [
    { trap: "Passing offline evals means production is fine.", why: "Live traffic shifts and contains cases your set lacks. Online sampling and user signals catch what offline sets miss." },
    { trap: "A newer model is a drop-in upgrade.", why: "Different models respond differently to the same prompt: format, verbosity, refusals and tool use can regress. Re-run the suite and canary." },
    { trap: "Grade a uniform 1% sample.", why: "Small slices (a rare language) get too few graded items to measure. Stratify the sample." },
  ],
  say: {
    prompt: "How do you keep an LLM system's quality under control after launch, including model upgrades?",
    secs: 60,
    check: ["Golden set in CI with release gates (must-pass, slices, latency/cost)", "Online sampled judging + user/business signals + guardrail rates", "Stratified sampling; statistical detection of changes", "Model upgrades as releases: suite, paired/slice comparison, shadow, canary, fallback", "Logging versions; online failures become offline cases"],
    followups: [
      { q: "2% of 1,00,000 weekly conversations graded: CI half-width on a 5% failure rate?", a: "About ±0.96 points (2,000 samples)." },
      { q: "What would you gate a release on?", a: "No must-pass failures, no significant drop overall or on key slices, latency and cost within thresholds." },
      { q: "What's shadow testing?", a: "Running the new model on live inputs in parallel without showing its outputs to users, then comparing graded results." },
    ],
    answer: `Offline, a golden regression set runs in CI on every change to prompts, models, retrieval or tools, and releases are gated on no must-pass failures, no significant drop overall or on key slices, and latency and cost within budget.

Online, I grade a stratified sample of live outputs with validated judges, track user and business signals like escalations and kept payment promises, and watch guardrail hit rates and input drift, with alerts sized so changes are statistically detectable. A model upgrade is treated as a release: full suite with paired and per-slice comparison, prompt fixes where it regresses, shadow traffic, canary, and the old model kept as fallback. Every output logs its prompt and model version, and online failures become new offline cases.`,
    avoid: ["“Offline evals passed, so we're done”", "Swapping models without re-testing"],
  },
  terms: [["Release gate", "Automated criteria a change must pass to ship."], ["Online eval", "Grading a sample of production outputs."], ["Shadow testing", "Running a candidate on live inputs without serving its outputs."]],
  sources: [S.tests, S.judge],
});
Q({ id: "ai-eo-1", d: 1, secs: 30, prompt: "1,00,000 conversations/week; 2% sampled for judging at ₹0.40 each. Weekly judging cost in rupees?", answer: 800, tol: 0.5, explain: "2,000 × 0.40 = ₹800.", py: "answer = 100000*0.02*0.40" });
Q({ id: "ai-eo-2", d: 2, secs: 60, prompt: "2,000 graded items, failure rate 5%. 95% CI half-width? (4 decimals)", answer: 0.0096, tol: 0.0002, explain: "1.96 × √(0.05 × 0.95/2000) = 0.0096.", py: "answer = 1.96*(0.05*0.95/2000)**0.5" });
Q({ id: "ai-eo-3", d: 3, secs: 90, prompt: "Failure rate rises from 5% to 7% between weeks, 2,000 graded items each. z-statistic for the difference? (2 decimals)", answer: 2.66, tol: 0.02, explain: "SE = √(0.05·0.95/2000 + 0.07·0.93/2000) = 0.00752; z = 0.02/0.00752 = 2.66.", py: "se = (0.05*0.95/2000 + 0.07*0.93/2000)**0.5\nanswer = 0.02/se" });
C("ai-eo-c1", "Model upgrade = release", "Full suite → paired/slice comparison → shadow → canary → switch with fallback.");

L("ai-evals-practice", M, "Applied evals practice", "Interview scenarios on building, validating and operating evals.", {
  kind: "interview", mins: 30, prereq: ["ai-eval-basics", "ai-error-analysis", "ai-llm-judge", "ai-labelling-kappa", "ai-rag-agent-evals", "ai-evals-ops"],
  hook: "Answer each scenario out loud in about a minute, then open it and tick off the points the interviewer is listening for.",
}, [
  iq("Design the evaluation plan for a Hindi/English collections voice bot before launch.", "Success criteria (correct amounts/dates, compliant language, handles key intents, latency); eval set from transcripts stratified by language/intent + hard cases; code checks for amounts/format; judges for compliance/politeness validated with supervisor labels (kappa, TPR/TNR); simulated borrower conversations for multi-turn; must-pass compliance cases; online sampling plan after launch.", ["Criteria incl. compliance and latency", "Stratified set by language/intent", "Code + validated judges", "Simulated multi-turn", "Online plan"]),
  iq("Your judge says quality improved 6 points after a prompt change, but complaints went up. Explain.", "Judge may be miscalibrated (low TNR, verbosity bias favouring longer replies), the eval set may not match live traffic, or the change hurt a slice. Re-validate judge against humans on new outputs, check slices and length correlation, compare online signals, read complaint traces.", ["Judge bias/calibration", "Eval-traffic mismatch", "Slices", "Trace reading"]),
  iq("Two annotators labelling 'compliant' agree 92% but kappa is 0.35. What's going on and what do you do?", "Labels are imbalanced (most replies compliant) so chance agreement is high; real agreement on the hard cases is weak. Refine rubric with borderline examples, oversample likely non-compliant cases for labelling, discuss disagreements, re-measure.", ["Chance agreement from imbalance", "Rubric refinement", "Oversample hard cases", "Re-measure"]),
  iq("How would you evaluate an agent that books field-visit appointments?", "Sandbox calendar and CRM with seeded data; scripted tasks and simulated users; end-state checks (correct slot, officer, no double booking, no other changes); trajectory checks; multiple trials and pass^k; cost/latency; edge cases like no slots or reschedules.", ["Sandbox + seeded data", "End-state checks", "pass^k", "Edge cases"]),
  iq("The provider will retire your model in 30 days. Plan the migration.", "Shortlist replacements; run full regression suite with paired comparison by slice; fix prompts for regressions; measure latency/cost; shadow on live traffic with online judging; canary with rollback; switch before retirement with buffer; document.", ["Suite + slices", "Prompt adaptation", "Shadow/canary/rollback", "Timeline with buffer"]),
]);
