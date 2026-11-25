/**
 * v2 AI engineering, part G: LLMOps.
 * Fixed ids. Every quiz answer is recomputed in Pyodide (scripts/verify-items.mts).
 */
import { CHECKED, iq, lessonWriter } from "./v2-shared";

const { L, Q, C } = lessonWriter("aieng");
const M = "LLMOps";
const src = (label: string, url: string) => ({ label, url, checked: CHECKED });
const S = {
  tests: src("Claude Platform docs: define success criteria and build evaluations", "https://platform.claude.com/docs/en/test-and-evaluate/develop-tests"),
  claude: src("Claude Platform docs: prompt engineering overview (incl. guardrail guides)", "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview"),
  owasp: src("OWASP Top 10 for Large Language Model Applications", "https://owasp.org/www-project-top-10-for-large-language-model-applications/"),
  inj: src("Greshake et al. (2023): Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection", "https://arxiv.org/abs/2302.12173"),
  mlflow: src("MLflow documentation (tracing, tracking, registry)", "https://mlflow.org/docs/latest/index.html"),
  debt: src("Sculley et al. (2015): Hidden Technical Debt in Machine Learning Systems, NeurIPS", "https://papers.nips.cc/paper/5656-hidden-technical-debt-in-machine-learning-systems"),
  vllm: src("vLLM documentation", "https://docs.vllm.ai/en/latest/"),
};

L("ai-llmops-intro", M, "LLMOps: what's different from MLOps", "Prompts as artefacts, provider-controlled models, non-determinism, token economics and eval-driven releases.", {
  kind: "concept", mins: 20,
  hook: "You didn't retrain anything, didn't deploy anything, and the bot's behaviour changed overnight. How is that possible?",
  intuition: `
**The situation.** Classical MLOps manages models you train. LLM applications mostly use models you don't control, steered by prompts, retrieval and tools, and the "model" is a whole system.

**What changes.**

- **More artefacts to version:** prompts, tool definitions, retrieval indexes, model name and version, decoding parameters. Any of them changes behaviour.
- **Provider changes:** hosted models get updated and retired on the provider's schedule; aliases can point to new versions.
- **Non-determinism:** the same input can give different outputs; evaluation needs repeated sampling and judgement-based grading.
- **Open-ended outputs:** no single accuracy number; quality is a set of criteria measured by checks and judges.
- **Token economics:** cost scales with prompt and output length, retries and agent steps, not with fixed compute.
- **New risks:** prompt injection, data leakage through prompts or outputs, hallucination.

**Same principles:** version everything, test before release, roll out gradually, monitor, roll back.
`,
  maths: `
**In one breath.** Behaviour = f(model version, prompt version, tools, index version, parameters, input); output variance at temperature > 0 means pass rates must be estimated over repeated samples.

**Worked example (non-determinism).** A case passes in 7 of 10 samples at temperature 0.7: $\\hat p = 0.7$; one run tells you little (pass or fail with probability 0.7/0.3). Averaging over cases and samples gives a stable rate.

**Worked example (cost drift).** Average tokens per conversation rose from 4,000 to 5,200 after a prompt change: +30% cost at constant traffic, before any traffic growth.

**Version matrix.** 3 prompt versions × 2 model versions × 2 index versions = 12 configurations that could explain a behaviour change; log all three with every request.
`,
  practice: `
**Minimum LLMOps.** Pin model versions where possible; store prompts, tool specs and parameters in version control; log versions with every request; eval suite in CI; staged rollouts; cost and latency dashboards per feature; alerts on quality, cost and latency changes; incident runbooks (rollback prompt, switch model, disable feature).
`,
  traps: [
    { trap: "We pinned the code, so behaviour is stable.", why: "Model aliases, retrieval indexes and prompt templates change behaviour without code deploys. Version and log all of them." },
    { trap: "Run the eval once at temperature 0.7.", why: "Outputs vary; a single run can pass or fail by chance. Use temperature 0 where possible or several samples per case." },
    { trap: "LLM costs are fixed per request.", why: "They scale with tokens, retries and agent steps, which drift with prompt changes and user behaviour. Track tokens per task." },
  ],
  say: {
    prompt: "How is operating an LLM application different from operating a classical ML model?",
    secs: 45,
    check: ["Many behaviour-changing artefacts: prompts, tools, index, model version, parameters", "Provider-controlled model updates/retirements", "Non-determinism and open-ended outputs → judge-based, sampled evals", "Token economics: cost per task varies", "New risks (injection, leakage) + same principles (version, test, stage, monitor, roll back)"],
    followups: [
      { q: "3 prompts × 2 models × 2 indexes: how many configurations?", a: "12; log all versions per request to know which ran." },
      { q: "How do you handle a provider model alias silently changing?", a: "Pin explicit versions, monitor online eval rates and output statistics, and treat provider upgrades as releases with the full eval suite." },
      { q: "What's the LLM equivalent of a model rollback?", a: "Reverting the prompt/tool/index version or switching back to the previous pinned model version." },
    ],
    answer: `The core principles are the same, version, test, stage, monitor, roll back, but the system is different. Behaviour depends on many artefacts besides weights: prompts, tool definitions, the retrieval index, decoding parameters and a model version the provider controls and may update or retire. So all of those are versioned and logged with every request.

Outputs are non-deterministic and open-ended, so evaluation uses checks and validated judges over repeated samples rather than one accuracy number. Cost scales with tokens, retries and agent steps, so I track tokens per task. And there are new risks, prompt injection, data leakage and hallucination, that need their own guardrails and monitoring.`,
    avoid: ["“It's just MLOps”", "Ignoring provider-side changes"],
  },
  terms: [["LLMOps", "Operating LLM-based applications in production."], ["Model pinning", "Using an explicit model version, not a moving alias."], ["Prompt versioning", "Treating prompts as versioned, tested artefacts."]],
  sources: [S.tests, S.debt],
});
Q({ id: "ai-lo-1", d: 1, secs: 30, prompt: "3 prompt versions × 2 model versions × 2 index versions. Possible configurations?", answer: 12, tol: 0.5, explain: "3 × 2 × 2.", py: "answer = 3*2*2" });
Q({ id: "ai-lo-2", d: 1, secs: 30, prompt: "Tokens per conversation rise from 4,000 to 5,200 at constant traffic. Cost increase?", answer: 0.3, tol: 0.002, explain: "5,200/4,000 − 1 = 30%.", py: "answer = 5200/4000 - 1" });
Q({ id: "ai-lo-3", d: 2, secs: 60, prompt: "A case passes with probability 0.7 per sample. Probability that a single eval run gets it wrong (fails)?", answer: 0.3, tol: 0.002, explain: "1 − 0.7: single runs are noisy; sample several times.", py: "answer = 1 - 0.7" });
C("ai-lo-c1", "Version everything", "Model version, prompt, tools, index, decoding params: log all per request.");

L("ai-tracing", M, "Tracing and observability for LLM apps and agents", "Spans, token and latency breakdowns, and what to log without leaking data.", {
  kind: "concept", mins: 20, prereq: ["ai-llmops-intro"],
  hook: "A borrower says the bot quoted the wrong EMI on Tuesday's call. What do you need to have logged to find out why in ten minutes?",
  intuition: `
**The situation.** An LLM feature is a chain: input → retrieval → prompt assembly → model call(s) → tool calls → post-processing → output. When something goes wrong, you need the whole chain for that request.

**Tracing.** Each request gets a trace ID; each step is a **span** with start/end time, inputs/outputs (or references to them), token counts, model/prompt versions, errors. Agents produce trees of spans (each tool call, each sub-agent).

**What it enables.** Debugging individual failures (which chunk was retrieved, what the tool returned), latency breakdowns (where the 3 s went), cost attribution (tokens by step and feature), and feeding traces into error analysis and eval sets.

**Privacy.** Traces contain customer data. Redact or tokenise PII before storage, restrict access, set retention limits, and log references (document IDs) rather than full content where possible.
`,
  maths: `
**In one breath.** Request latency = sum of sequential spans (parallel spans contribute their max); storage/day = requests × trace size × sampling rate.

**Worked example (latency).** Spans: ASR 300 ms, retrieval 120 ms, LLM TTFT 650 ms + generation 900 ms, two parallel tool calls 200 and 350 ms, TTS 250 ms. Total = 300 + 120 + 350 + 650 + 900 + 250 = 2,570 ms. The LLM is 60%; TTFT alone is 25%.

**Worked example (storage).** 10 lakh requests/day × 40 KB per full trace = 40 GB/day. Keep 100% of metadata (latency, tokens, versions, errors) and full payloads for 10% plus all errors/flags: about 4 GB/day of payloads.

**Cost attribution.** Tokens by span: system prompt 2,000 (cached), retrieved context 3,000, history 1,500, output 300: retrieved context is the biggest uncached cost.
`,
  practice: `
**Log per span:** trace/span IDs, timestamps, model and prompt version, token counts (input, cached, output), latency, tool name + arguments + status, retrieved document IDs, errors, user/session IDs (pseudonymised), feedback.

**Use it:** dashboards (p95 latency by span, tokens by feature), search by user/session for incidents, sampling into review queues, and replay of traces to test fixes.
`,
  traps: [
    { trap: "Log only the final input and output.", why: "You can't tell whether a wrong answer came from retrieval, a tool result or the model. Trace every step." },
    { trap: "Store full transcripts forever for debugging.", why: "That's a privacy and compliance liability. Redact PII, sample payloads, restrict access and set retention." },
    { trap: "Average latency per request is enough.", why: "Span-level percentiles show which component causes the tail; averages hide it." },
  ],
  say: {
    prompt: "What would you log and monitor for an LLM-powered voice agent in production?",
    secs: 45,
    check: ["Trace per request with spans for each step (ASR, retrieval, LLM, tools, TTS)", "Versions, token counts, latency, errors, retrieved IDs, tool args/results", "Latency and cost breakdown by span; p95 per span", "PII redaction, sampling, access control, retention", "Traces feed error analysis, evals and replay"],
    followups: [
      { q: "Spans 300, 120, LLM 650 + 900, parallel tools 200/350, TTS 250 ms: total?", a: "2,570 ms." },
      { q: "How do you keep trace storage manageable?", a: "Keep all metadata, sample full payloads, always keep errors and flagged cases, compress, and expire after a retention period." },
      { q: "How do traces help evaluation?", a: "Failing or flagged traces become eval cases; sampled traces feed online judges; replays test fixes on real inputs." },
    ],
    answer: `Every call gets a trace with a span for each step: speech recognition, retrieval, prompt assembly, each model call, each tool call and text-to-speech. Each span records timing, token counts including cached tokens, model and prompt versions, retrieved document IDs, tool arguments and results, and errors, with the session pseudonymised.

That lets me answer 'why did it quote the wrong EMI' by opening the trace and seeing whether the tool returned the wrong value or the model misread it, break latency and cost down by span, and feed real traces into error analysis and evals. Because traces contain customer data, PII is redacted, full payloads are sampled except for errors, access is restricted and there's a retention limit.`,
    avoid: ["Logging only final outputs", "Keeping raw transcripts indefinitely"],
  },
  terms: [["Trace", "All steps of one request, linked by an ID."], ["Span", "One timed step within a trace."], ["Redaction", "Removing or masking sensitive data before storage."]],
  sources: [S.mlflow, S.tests],
});
Q({ id: "ai-trc-1", d: 2, secs: 60, prompt: "Sequential spans 300, 120, 650, 900 and 250 ms, plus two parallel tool calls of 200 and 350 ms. Total latency in ms?", answer: 2570, tol: 0.5, explain: "300 + 120 + max(200, 350) + 650 + 900 + 250.", py: "answer = 300 + 120 + max(200,350) + 650 + 900 + 250" });
Q({ id: "ai-trc-2", d: 1, secs: 30, prompt: "10,00,000 requests/day, 40 KB per full trace, full payloads kept for 10%. Payload storage per day in GB?", answer: 4, tol: 0.01, explain: "1e6 × 40 KB × 0.1 = 4e9 bytes.", py: "answer = 1e6*40e3*0.1/1e9" });
Q({ id: "ai-trc-3", d: 1, secs: 30, prompt: "In the latency example (2,570 ms total), what fraction is LLM time (TTFT 650 + generation 900)? (3 decimals)", answer: 0.603, tol: 0.002, explain: "1,550/2,570 = 0.603.", py: "answer = 1550/2570" });
C("ai-trc-c1", "Trace contents", "Span timing, tokens, versions, retrieved IDs, tool args/results, errors; PII redacted.");

L("ai-guardrails", M, "Guardrails and prompt injection", "Input and output checks, jailbreaks and injections, and measuring guardrail trade-offs.", {
  kind: "concept", mins: 25, prereq: ["ai-llmops-intro"],
  hook: "Your PII-leak guardrail blocks 2% of all replies. Is it doing its job, or just annoying customers?",
  intuition: `
**The situation.** Models can be pushed into unsafe or off-policy behaviour (jailbreaks), manipulated by instructions hidden in content they read (prompt injection), or simply make mistakes (leaking an account number, promising a waiver). Guardrails are checks around the model.

**Where they sit.**

- **Input guardrails:** detect injection/jailbreak attempts, off-topic requests, PII that shouldn't be sent to the model.
- **Output guardrails:** check replies for PII, policy violations (threatening language in collections, unauthorised promises), format, groundedness; block, repair or route to a human.
- **Action guardrails:** for agents, code-level limits on tools (covered in agent safety).

**Prompt injection** can't be fully solved by a filter: treat untrusted text as data, limit what the model can do with it, and keep sensitive actions behind code-level checks.

**Every guardrail is a classifier** with false positives (blocking good replies) and false negatives (missing bad ones). Measure both.
`,
  maths: `
**In one breath.** Guardrail recall = bad outputs caught / bad outputs; false-block rate = good outputs blocked / good outputs; blocked volume = N × (bad rate × recall + good rate × FPR).

**Worked example.** 1,00,000 replies/day, 0.5% truly leak PII (500). The guardrail catches 95% (475) and wrongly blocks 1.5% of good replies (1,492.5): it blocks about 1,968 replies (2%), three quarters of them good. Raising precision matters as much as recall.

**Precision of blocks** = 475/1,967.5 = 0.24.

**Layering.** Two independent checks with recall 0.9 each catch $1 - 0.1^2 = 0.99$ of bad outputs, but their false-block rates add up (roughly).
`,
  practice: `
**Build guardrails like models:** labelled sets of good and bad examples (including adversarial and Hinglish phrasings), measured precision/recall, thresholds set by cost of each error, monitoring of block rates. Use deterministic checks (regex for account numbers, allow-lists) where possible, classifiers or LLM judges for nuanced policy.

**Respond gracefully:** repair (mask the number), regenerate with feedback, or hand off to a human rather than a dead end.

**Red-team regularly** with jailbreak and injection suites; add successful attacks to the regression set.
`,
  traps: [
    { trap: "An input filter will stop prompt injection.", why: "Injections are open-ended text; filters miss variants. Limit the model's authority (data vs instructions, least privilege, code-level action checks)." },
    { trap: "A guardrail that blocks a lot is a strong guardrail.", why: "High block rates often mean many false positives. Measure precision and recall on labelled data." },
    { trap: "Put all the safety rules in the system prompt.", why: "Prompts guide behaviour but don't guarantee it. Add independent checks on outputs and actions." },
  ],
  say: {
    prompt: "How would you design guardrails for a customer-facing collections bot?",
    secs: 60,
    check: ["Input checks (injection/jailbreak, PII), output checks (PII, policy/tone, unauthorised promises, grounding)", "Deterministic checks where possible; classifiers/judges for nuance", "Measure precision/recall; thresholds by error costs; monitor block rates", "Injection: treat content as data, limit authority, code-level action checks", "Graceful handling (repair, regenerate, human handoff); red-teaming"],
    followups: [
      { q: "0.5% bad replies, recall 95%, false-block rate 1.5% on 1,00,000 replies: total blocked?", a: "About 1,968 (475 bad + 1,492 good)." },
      { q: "Why can't you filter your way out of prompt injection?", a: "Injected instructions can be phrased endlessly and hidden in normal-looking content; the robust defence is limiting what text can make the system do." },
      { q: "What do you do when the output guardrail fires?", a: "Repair if safe (mask PII), regenerate with the violation as feedback, or hand to a human; log it for analysis." },
    ],
    answer: `I'd put checks on both sides of the model. On input: detect injection and jailbreak attempts and strip PII the model doesn't need. On output: deterministic checks like regexes for account numbers, plus classifiers or validated judges for policy, such as no threatening language, no promises the bot isn't authorised to make, and answers grounded in the policy. When a check fires, the bot repairs, regenerates or hands off to a human rather than failing.

Each guardrail is a classifier, so I measure its recall and false-block rate on labelled data, including Hinglish and adversarial phrasings, set thresholds by the cost of each error, and monitor block rates. For prompt injection I don't rely on filters: retrieved and user content is treated as data, and anything consequential is enforced in code. Red-team results go into the regression set.`,
    avoid: ["“The system prompt handles safety”", "Ignoring false positives"],
  },
  terms: [["Guardrail", "Check on inputs, outputs or actions around the model."], ["Jailbreak", "Input crafted to bypass the model's safety behaviour."], ["Prompt injection", "Instructions smuggled in via user or third-party content."]],
  sources: [S.owasp, S.inj, S.claude],
});
Q({ id: "ai-gd-1", d: 2, secs: 60, prompt: "1,00,000 replies; 0.5% truly leak PII; guardrail recall 0.95, false-block rate 1.5% on good replies. Total replies blocked? (nearest whole number)", answer: 1968, tol: 1, explain: "475 + 0.015 × 99,500 = 475 + 1,492.5 = 1,967.5.", py: "answer = 100000*0.005*0.95 + 100000*0.995*0.015" });
Q({ id: "ai-gd-2", d: 2, secs: 60, prompt: "Same guardrail: what fraction of blocked replies actually leaked PII? (2 decimals)", answer: 0.24, tol: 0.005, explain: "475/1,967.5 = 0.241.", py: "tp = 100000*0.005*0.95\nfp = 100000*0.995*0.015\nanswer = tp/(tp+fp)" });
Q({ id: "ai-gd-3", d: 1, secs: 30, prompt: "Two independent checks each catch 90% of bad outputs. Combined recall?", answer: 0.99, tol: 0.002, explain: "1 − 0.1².", py: "answer = 1 - 0.1**2" });
C("ai-gd-c1", "Guardrails are classifiers", "Measure recall and false-block rate; set thresholds by error costs.");

L("ai-cost-routing", M, "Cost and latency: routing, caching and batching", "Sending each request to the cheapest model that can handle it, and not paying twice for the same work.", {
  kind: "concept", mins: 20, prereq: ["ai-llmops-intro"],
  hook: "70% of voice-bot turns are 'haan', 'kal pay karunga', or 'wrong number'. Why is every one of them going to your most expensive model?",
  intuition: `
**The situation.** Traffic is mixed: many easy requests, some hard ones. Using the biggest model for everything is simple but expensive and slow.

**Levers.**

- **Routing:** a cheap classifier (or small model) decides which model handles each request; easy → small and fast, hard → large. Or a cascade: try the small model, escalate if confidence is low or a check fails.
- **Caching:** exact-match cache for repeated requests; prompt/prefix caching for shared context; semantic caching (similar questions → reuse answer) only where answers don't depend on user-specific data.
- **Batching:** offline jobs through batch APIs or large batches at lower prices.
- **Trimming:** shorter prompts, capped output, compact tool results.

Every lever is checked against quality on the eval set: a cheaper system that fails more costs more in the end.
`,
  maths: `
**In one breath.** Blended cost = Σ share × cost per request (+ router cost); cascade cost = small cost + escalation rate × large cost.

**Worked example (routing).** Large model ₹0.60 per turn, small ₹0.05, router ₹0.005. Route 70% to small: $0.7 \\times 0.05 + 0.3 \\times 0.60 + 0.005 = ₹0.22$, a 63% saving.

**Worked example (cascade).** Every turn tries the small model (₹0.05); 35% escalate to the large (₹0.60): $0.05 + 0.35 \\times 0.60 = ₹0.26$.

**Quality check.** If the small model handles routed-easy turns at 97% vs 99% for the large, and routing sends 2% of hard turns to small by mistake, measure the end-to-end pass rate, not just per-model rates.

**Exact cache.** With a 15% hit rate, cost falls by about 15% on cached requests and latency on hits drops to milliseconds.
`,
  practice: `
**Start by measuring** the traffic mix (intents, lengths) and per-model quality on each slice. Build the router from labelled traffic; monitor routing distribution and escalation rates; fall back to the large model when unsure. Cache keys must include anything that changes the answer (user, language, policy version).
`,
  traps: [
    { trap: "Route by prompt length.", why: "Length is a weak proxy for difficulty. Use intent or a trained router, validated on labelled traffic." },
    { trap: "Semantic caching is free savings.", why: "Similar-looking questions can need different answers (different customer, amount, policy version). Use it only for generic, non-personalised content." },
    { trap: "Measure savings only.", why: "Cost per successful task is what matters. A cheaper path with more failures and retries can cost more overall." },
  ],
  say: {
    prompt: "How would you cut the cost of an LLM feature by half without hurting quality?",
    secs: 45,
    check: ["Measure traffic mix and per-slice quality first", "Routing / cascades to smaller models for easy requests", "Caching: prefix, exact, semantic with care", "Trimming prompts/outputs; batch APIs for offline work", "Validate with evals: cost per successful task"],
    followups: [
      { q: "Router sends 70% to a ₹0.05 model, rest to ₹0.60, router ₹0.005. Blended cost?", a: "₹0.22 per turn." },
      { q: "Routing vs cascade?", a: "Routing decides up front (one model call plus router); a cascade tries the small model first and escalates on low confidence or failed checks (sometimes two calls, but no router needed)." },
      { q: "What must a cache key include?", a: "Everything that changes the right answer: normalised input, user/account context, language, prompt and policy versions." },
    ],
    answer: `I'd first measure where the money goes: traffic mix by intent and length, tokens per step, and how well a smaller model does on each slice. Then routing: a cheap router or a cascade sends easy turns like confirmations to a small fast model and only hard ones to the large model; with 70% of turns routed small, cost per turn drops by about 60%.

I'd add prefix caching for the shared prompt, exact caching for repeated requests, semantic caching only for generic content, trim prompts and outputs, and push offline jobs to batch pricing. Every change is checked on the eval set and in production by cost per successful task, because cheaper but more failures isn't a saving.`,
    avoid: ["Routing on length alone", "Semantic caching of personalised answers"],
  },
  terms: [["Model routing", "Choosing a model per request."], ["Cascade", "Try a cheap model first, escalate when needed."], ["Semantic cache", "Reusing answers for semantically similar inputs."]],
  sources: [S.vllm, S.tests],
});
Q({ id: "ai-cr-1", d: 1, secs: 45, prompt: "Route 70% to a ₹0.05 model and 30% to a ₹0.60 model, router ₹0.005. Blended cost per turn in rupees? (3 decimals)", answer: 0.22, tol: 0.002, explain: "0.035 + 0.18 + 0.005 = 0.220.", py: "answer = 0.7*0.05 + 0.3*0.60 + 0.005" });
Q({ id: "ai-cr-2", d: 1, secs: 45, prompt: "Cascade: every turn tries the ₹0.05 model; 35% escalate to the ₹0.60 model. Cost per turn in rupees?", answer: 0.26, tol: 0.002, explain: "0.05 + 0.35 × 0.60 = 0.26.", py: "answer = 0.05 + 0.35*0.60" });
Q({ id: "ai-cr-3", d: 2, secs: 60, prompt: "Routing (₹0.22/turn) succeeds 97% of the time; all-large (₹0.60) succeeds 99%. Failed turns are redone on the large model. Expected cost per successful turn for routing? (3 decimals)", answer: 0.238, tol: 0.002, explain: "0.22 + 0.03 × 0.60 = 0.238 (assuming the redo succeeds); still far below 0.60/0.99.", py: "answer = 0.22 + 0.03*0.60" });
C("ai-cr-c1", "Routing economics", "Blended cost = Σ share × model cost + router; judge by cost per successful task.");

L("ai-api-reliability", M, "LLM API reliability: rate limits, retries and fallbacks", "Building around a dependency that times out, rate-limits and occasionally goes down.", {
  kind: "concept", mins: 20, prereq: ["ai-llmops-intro"],
  hook: "At 10 a.m., when 3,000 collection calls start at once, the provider starts returning 429s and the bot goes silent. What should have happened?",
  intuition: `
**The situation.** Your app depends on an external API with rate limits (requests and tokens per minute), variable latency, occasional errors and rare outages.

**Patterns.**

- **Timeouts:** never wait forever; set them per call from the latency budget.
- **Retries with exponential backoff and jitter:** retry transient errors (429, 5xx, timeouts) after growing, randomised delays, so clients don't retry in lockstep. Respect "retry-after" headers. Cap attempts.
- **Idempotency:** retries must not double-send an SMS or double-create a record; use idempotency keys for actions.
- **Fallbacks:** a second model or provider, a smaller model, a cached or templated response, or a graceful handoff ("I'll have an officer call you back").
- **Load shaping:** queues, client-side rate limiting, spreading campaign start times, priority for live calls over batch jobs.
- **Circuit breakers:** stop calling a failing dependency for a while instead of piling on.
`,
  maths: `
**In one breath.** Backoff delay $d_k = \\min(\\text{cap}, b \\cdot 2^k)$ (± jitter); availability with an independent fallback $= 1 - (1 - A_1)(1 - A_2)$; success within $r$ tries at per-try success $s$: $1 - (1 - s)^r$.

**Worked example (backoff).** Base 0.5 s: delays 0.5, 1, 2, 4 s; total wait before the 5th attempt = 7.5 s, too long for a live voice turn, fine for a batch job. Live paths need fewer retries and a fast fallback.

**Worked example (availability).** Primary 99.5%, independent fallback 99%: $1 - 0.005 \\times 0.01 = 0.99995$.

**Worked example (rate limit).** Limit 2,00,000 tokens/minute; each turn uses 2,500 tokens: at most 80 turns/minute. 3,000 calls each wanting a turn in the same minute need staggering or a higher limit.
`,
  practice: `
**Checklist.** Per-call timeouts; retry only retryable errors with backoff + jitter + cap; idempotency keys for side effects; fallback chain tested regularly (chaos drills); token-budget aware client-side rate limiting; separate quotas or priorities for interactive vs batch; alert on error rates and fallback rates.
`,
  traps: [
    { trap: "Retry immediately on failure.", why: "Immediate, synchronised retries amplify overload (retry storms). Use exponential backoff with jitter and respect retry-after." },
    { trap: "Retry everything.", why: "Some errors won't succeed on retry (invalid request, content refusal) and some actions aren't safe to repeat. Classify errors; use idempotency keys." },
    { trap: "The fallback model will just work when needed.", why: "Untested fallbacks fail on prompts tuned for the primary. Run evals on the fallback and exercise it regularly." },
  ],
  say: {
    prompt: "How do you make an LLM-powered service resilient to API errors and rate limits?",
    secs: 45,
    check: ["Timeouts from the latency budget", "Retries for transient errors with exponential backoff + jitter, capped, respecting retry-after", "Idempotency for side-effecting actions", "Fallbacks (other model/provider, cached/templated reply, human handoff); circuit breakers", "Load shaping and rate limiting; monitoring of errors and fallback rates"],
    followups: [
      { q: "Backoff base 0.5 s, doubling: total wait before the 5th attempt?", a: "0.5 + 1 + 2 + 4 = 7.5 s." },
      { q: "Primary 99.5% available, independent fallback 99%: combined?", a: "99.995%." },
      { q: "Why add jitter?", a: "So many clients that failed together don't retry at the same instants and re-overload the service." },
    ],
    answer: `I treat the model API as an unreliable dependency. Every call has a timeout derived from the latency budget. Transient errors like 429s, 5xxs and timeouts are retried with capped exponential backoff and jitter, honouring retry-after, while permanent errors aren't retried, and any side-effecting action uses an idempotency key so retries can't double-send an SMS.

Beyond retries there's a tested fallback chain: another model or provider, a smaller model, a templated reply or a human callback. A circuit breaker stops hammering a failing dependency, and load shaping, like staggering a 3,000-call campaign and giving live calls priority over batch jobs, keeps us under token-per-minute limits. I alert on error, retry and fallback rates.`,
    avoid: ["Immediate synchronous retries", "An untested fallback"],
  },
  terms: [["Exponential backoff", "Retry delays that double each attempt."], ["Jitter", "Random variation added to retry delays."], ["Circuit breaker", "Temporarily stops calls to a failing dependency."], ["Idempotency key", "ID that makes a repeated request take effect once."]],
  sources: [S.owasp, S.tests],
});
Q({ id: "ai-ar-1", d: 1, secs: 30, prompt: "Backoff base 0.5 s doubling each retry. Total waiting time before the 5th attempt, in seconds?", answer: 7.5, tol: 0.01, explain: "0.5 + 1 + 2 + 4.", py: "answer = sum(0.5*2**k for k in range(4))" });
Q({ id: "ai-ar-2", d: 2, secs: 45, prompt: "Primary API 99.5% available, independent fallback 99%. Combined availability? (5 decimals)", answer: 0.99995, tol: 0.000005, explain: "1 − 0.005 × 0.01.", py: "answer = 1 - 0.005*0.01" });
Q({ id: "ai-ar-3", d: 1, secs: 30, prompt: "Rate limit 2,00,000 tokens/minute; 2,500 tokens per turn. Maximum turns per minute?", answer: 80, tol: 0.5, explain: "200,000/2,500.", py: "answer = 200000/2500" });
Q({ id: "ai-ar-4", d: 2, secs: 45, prompt: "Each attempt succeeds 90% of the time (independent). Probability of success within 3 attempts? (3 decimals)", answer: 0.999, tol: 0.0005, explain: "1 − 0.1³.", py: "answer = 1 - 0.1**3" });
C("ai-ar-c1", "Resilient API client", "Timeouts, backoff + jitter (capped), idempotency, fallbacks, circuit breaker, rate limiting.");

L("ai-pii-governance", M, "Data privacy and governance in LLM applications", "Keeping customer data out of places it shouldn't go: minimisation, redaction, retention and vendor controls.", {
  kind: "concept", mins: 20, prereq: ["ai-tracing", "ai-guardrails"],
  hook: "A developer pastes 500 real borrower call transcripts into a third-party playground to 'quickly test a prompt'. What went wrong, and what controls would have prevented it?",
  intuition: `
**The situation.** LLM apps move customer data into prompts, logs, eval sets, vendor APIs and sometimes fine-tuning data. Each is a place it can leak or be retained longer than allowed.

**Principles.**

- **Minimise:** send the model only what the task needs (loan ID and amount due, not the full KYC record).
- **Redact/tokenise:** replace names, phone and account numbers with placeholders before sending or logging; re-insert where needed after generation.
- **Control vendors:** approved providers only, under contracts covering data use, retention and region; no training on your data unless agreed.
- **Retention:** keep prompts, outputs and traces only as long as needed; delete on schedule and on request.
- **Access:** role-based access to traces and eval sets; audit logs.
- **Consent and purpose:** use data only for purposes customers were told about; follow applicable regulations for lending and data protection.

**Eval sets and fine-tuning data** are data stores too: anonymise them.
`,
  maths: `
**In one breath.** Leak rate = PII instances missed by redaction / PII instances; expected leaks = volume × PII per item × miss rate; layered detectors multiply miss rates (if independent).

**Worked example.** 1,000 PII instances in a test set; the redactor catches 970: miss rate 3%. Logging 50,000 transcripts/day with ~6 PII instances each: $50{,}000 \\times 6 \\times 0.03 = 9{,}000$ unredacted instances per day in logs.

**Layering.** Add a second, independent detector with 90% recall: miss rate $0.03 \\times 0.1 = 0.003$: 900/day. Better, but not zero, so restrict access and retention too.

**Minimisation effect.** Cutting fields sent to the model from 25 to 6 removes most exposure before any redaction is needed.
`,
  practice: `
**Controls checklist.** Data classification of fields; minimisation in prompt templates; redaction before vendor calls and logging (regex for structured IDs + NER for names/addresses, tested on Indian formats); approved-vendor list and contract terms; retention policies enforced by jobs; anonymised eval and fine-tuning sets; incident process.
`,
  traps: [
    { trap: "The vendor is reputable, so sending full records is fine.", why: "Exposure still grows with every field sent and every place it's retained. Minimise and redact regardless of vendor." },
    { trap: "Regex redaction catches all PII.", why: "Regex handles structured IDs (phone, PAN-like formats) but misses names, addresses and free-text details. Combine methods and measure recall." },
    { trap: "Eval sets are internal, so real transcripts are fine.", why: "Eval sets get copied, shared and pasted into tools. Anonymise them like any other data store." },
  ],
  say: {
    prompt: "How do you handle customer data safely in an LLM application?",
    secs: 45,
    check: ["Minimise what's sent to the model", "Redact/tokenise before vendor calls and logging; measure redaction recall", "Approved vendors with contractual data-use/retention terms", "Retention limits, access control, audit; anonymised eval/fine-tuning data", "Consent/purpose limits and regulatory compliance"],
    followups: [
      { q: "Redaction misses 3%; 50,000 transcripts/day with 6 PII each: daily leaks into logs?", a: "9,000 instances." },
      { q: "Why tokenise rather than delete?", a: "Placeholders preserve structure for the model (\"[NAME] owes [AMOUNT]\") and can be mapped back to real values in your own system after generation." },
      { q: "What would you do about the playground incident?", a: "Treat it as a data incident (assess, notify per policy, request deletion), then block unapproved tools, provide an approved sandbox with redacted data, and train the team." },
    ],
    answer: `I start with minimisation: prompt templates include only the fields the task needs. What does get sent or logged is redacted or tokenised first, with regex for structured identifiers and NER for names and addresses, tested for recall on Indian formats, because even a 3% miss rate leaves thousands of exposures a day at scale.

Only approved vendors under contracts covering data use, retention and region are used. Traces, eval sets and fine-tuning data are treated as sensitive stores with anonymisation, role-based access, audit logs and enforced retention. And use stays within the purpose customers consented to and the applicable lending and data-protection rules, with an incident process for mistakes like pasting real transcripts into an unapproved tool.`,
    avoid: ["“The vendor is trusted, so it's fine”", "Real transcripts in shared eval sets"],
  },
  terms: [["Data minimisation", "Sending and storing only the data a task needs."], ["Tokenisation (privacy)", "Replacing sensitive values with reversible placeholders."], ["Retention policy", "How long data may be kept before deletion."]],
  sources: [S.owasp, S.tests],
});
Q({ id: "ai-pg-1", d: 1, secs: 30, prompt: "A redactor catches 970 of 1,000 PII instances. Miss rate?", answer: 0.03, tol: 0.0005, explain: "30/1,000.", py: "answer = 30/1000" });
Q({ id: "ai-pg-2", d: 2, secs: 45, prompt: "50,000 transcripts/day, ~6 PII instances each, 3% miss rate. Unredacted instances per day?", answer: 9000, tol: 0.5, explain: "50,000 × 6 × 0.03.", py: "answer = 50000*6*0.03" });
Q({ id: "ai-pg-3", d: 2, secs: 45, prompt: "Add an independent second detector with 90% recall. New daily unredacted instances?", answer: 900, tol: 0.5, explain: "Miss rate 0.03 × 0.1 = 0.003 → 900.", py: "answer = 50000*6*0.03*0.1" });
C("ai-pg-c1", "Privacy controls", "Minimise → redact/tokenise → approved vendors → retention & access → anonymised evals.");

L("ai-llmops-practice", M, "LLMOps practice", "Interview scenarios on operating LLM applications in production.", {
  kind: "interview", mins: 35, prereq: ["ai-llmops-intro", "ai-tracing", "ai-guardrails", "ai-cost-routing", "ai-api-reliability", "ai-pii-governance"],
  hook: "Answer each scenario out loud in about a minute, then open it and tick off the points the interviewer is listening for.",
}, [
  iq("The bot's behaviour changed overnight with no deploy. How do you find the cause?", "Check traces for version changes: model alias/version, prompt version, index rebuild, tool/API changes, input mix shift. Compare online eval rates and output stats before/after; replay yesterday's inputs on today's config; pin versions; roll back the changed artefact.", ["Version logging per request", "Model alias/provider change", "Index/tool changes", "Replay and rollback"]),
  iq("Monthly LLM cost doubled while traffic grew 20%. Investigate.", "Tokens per task by span (prompt growth, retrieved context, agent steps, retries), cache hit rate, model mix (routing broke?), output length, retries due to errors/rate limits. Fix the top contributor; add cost alerts per feature.", ["Tokens per task by span", "Cache/routing regressions", "Retries and loops", "Cost alerts"]),
  iq("A jailbreak screenshot of your bot is circulating on social media. What do you do now and next week?", "Now: reproduce from traces, assess harm, hotfix (output guardrail/blocklist, prompt patch), communicate. Next: root cause, add attack to regression/red-team suite, measure guardrail recall/false blocks, review authority of the bot (what it could do), regular red-teaming.", ["Immediate containment", "Trace-based reproduction", "Regression + red-team suite", "Limit authority"]),
  iq("Design the reliability plan for a voice bot that must stay up during a 12,000-call campaign.", "Capacity math vs rate limits; staggered dialing; client rate limiting; timeouts and limited retries for live turns; fallback model/provider and templated responses; circuit breaker; load test beforehand; dashboards for errors, latency, fallback rate; on-call runbook.", ["Capacity vs limits", "Timeouts/retries for live path", "Fallback chain", "Load test + monitoring"]),
  iq("Legal asks whether customer data from calls is sent to the model vendor and kept. How do you answer and what do you change?", "Map the data flow from traces: which fields go to which vendor, retention on vendor and our side, logs and eval sets. Apply minimisation and redaction, confirm vendor terms (no training, retention, region), enforce retention jobs, restrict access, document.", ["Data-flow mapping", "Minimise/redact", "Vendor terms", "Retention/access/documentation"]),
]);
