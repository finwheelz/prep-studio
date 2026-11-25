/**
 * v2 AI engineering, part F: MLOps.
 * Fixed ids. Every quiz answer is recomputed in Pyodide (scripts/verify-items.mts).
 */
import { CHECKED, iq, lessonWriter } from "./v2-shared";

const { L, Q, C } = lessonWriter("aieng");
const M = "MLOps";
const src = (label: string, url: string) => ({ label, url, checked: CHECKED });
const S = {
  debt: src("Sculley et al. (2015): Hidden Technical Debt in Machine Learning Systems, NeurIPS", "https://papers.nips.cc/paper/5656-hidden-technical-debt-in-machine-learning-systems"),
  rules: src("Zinkevich: Rules of Machine Learning (Google for Developers)", "https://developers.google.com/machine-learning/guides/rules-of-ml"),
  mlflow: src("MLflow documentation: experiment tracking and model registry", "https://mlflow.org/docs/latest/index.html"),
};

L("ai-serving-skew", M, "Training/serving skew and feature stores", "Why a model that validated well breaks in production, and how point-in-time features prevent it.", {
  kind: "concept", mins: 20,
  hook: "Your default model scored 0.80 AUC offline and 0.66 in its first month live. The code didn't change. Where do you look?",
  intuition: `
**The situation.** Offline, features are computed in a notebook from a warehouse snapshot. Online, an API computes them from live systems. If the two computations differ, the model sees different inputs than it was trained on: **training/serving skew**.

**Common causes.**

- Different code paths (SQL in training, Java in serving) that disagree on edge cases (nulls, time zones, rounding).
- Features in training that used information not available at decision time (bureau data that arrives a week later, a "days past due" computed after the application date).
- Stale or missing data at serving time (a feed that lags).
- Different preprocessing (scaling fitted on a different period).

**Feature stores** centralise feature definitions so the same logic produces training data (with **point-in-time correct** joins: feature values as they were at each historical decision time) and serves online values with low latency.
`,
  maths: `
**In one breath.** Skew rate = share of requests where the logged serving feature differs from the recomputed training-pipeline value; point-in-time join: for each event at time $t$, use the latest feature value with timestamp $\\le t$ (and $\\le t - $ known availability lag).

**Worked example (skew audit).** Log 10,000 live requests with their serving features; recompute them with the training pipeline. 'months_since_last_delinquency' differs in 1,800 rows: 18% skew, mostly where serving returns 0 for "never delinquent" and training returns null.

**Worked example (availability lag).** Bureau pulls land 3 days after the application. A training join that uses bureau data dated up to the application date includes data the live model won't have: use data dated $\\le t - 3$ days, or model the lag explicitly.

**Impact.** If a top feature is wrong in 18% of live requests, the live score distribution shifts and ranking quality drops, which matches the AUC fall.
`,
  practice: `
**Prevention.** One feature definition used for both training and serving (feature store or shared library); log the exact features the model saw at serving time and train the next model on those logs; point-in-time joins with availability lags; contract tests comparing offline and online values on the same entities daily.

**Detection.** Skew dashboards per feature (null rate, mean, distribution) offline vs online; alerts on divergence.
`,
  traps: [
    { trap: "The validation set was held out, so production will match it.", why: "Held-out data shares the training pipeline's features. Production uses a different pipeline and different data timing; skew isn't visible offline." },
    { trap: "Join features as of the snapshot date.", why: "That uses values from after many historical decisions (leakage). Join as of each event's timestamp, minus availability lags." },
    { trap: "Re-implement features in the serving language for speed.", why: "Two implementations drift. Share one definition, or at least test them against each other continuously." },
  ],
  say: {
    prompt: "What is training/serving skew and how do you prevent it?",
    secs: 45,
    check: ["Features computed differently (or with different data timing) offline vs online", "Causes: separate code paths, leakage of not-yet-available data, stale feeds, preprocessing differences", "Feature store / shared definitions; point-in-time joins with availability lags", "Log serving features and train on them", "Skew monitoring: compare offline vs online values per feature"],
    followups: [
      { q: "What is a point-in-time join?", a: "For each training event at time t, attach the latest feature value known before t (accounting for data arrival lags), never values from after t." },
      { q: "How do you detect skew after launch?", a: "Recompute features offline for a sample of logged requests and compare with the values served; monitor per-feature null rates and distributions online vs offline." },
      { q: "Why train on logged serving features?", a: "They are exactly what the model will see, so skew between pipelines can't creep in." },
    ],
    answer: `Training/serving skew is when the model sees different feature values in production than it was trained on, because features are computed by different code or with different data timing. Typical causes are a SQL training pipeline and a separate serving implementation that disagree on nulls or time zones, training features that used data that only arrives after the decision, and stale feeds.

I prevent it with one feature definition shared by training and serving, usually a feature store, point-in-time joins that respect data arrival lags, logging the exact features served and training future models on those logs, and daily checks that compare offline and online values for the same customers, with alerts per feature.`,
    avoid: ["Blaming the model before checking features", "Snapshot-date joins"],
  },
  terms: [["Training/serving skew", "Mismatch between features at training and inference time."], ["Feature store", "Central system serving consistent features offline and online."], ["Point-in-time join", "Feature values as of each event's timestamp."]],
  sources: [S.debt, S.rules],
});
Q({ id: "ai-sk-1", d: 1, secs: 30, prompt: "A feature differs between serving logs and recomputation in 1,800 of 10,000 requests. Skew rate?", answer: 0.18, tol: 0.002, explain: "1,800/10,000.", py: "answer = 1800/10000" });
Q({ id: "ai-sk-2", d: 2, secs: 60, prompt: "Bureau data arrives 3 days after application. For an application on day 100, what is the latest bureau-data day a point-in-time join may use?", answer: 97, tol: 0.5, explain: "Only data available at decision time: dated ≤ 100 − 3.", py: "answer = 100 - 3" });
Q({ id: "ai-sk-3", d: 1, secs: 30, prompt: "Best single fix for two separately coded feature pipelines drifting apart?", options: ["Retrain more often", "One shared feature definition used by both training and serving", "Bigger model", "More validation data"], answer: 1, explain: "Remove the duplication that causes the skew.", py: "answer = 1" });
C("ai-sk-c1", "Avoiding skew", "Shared feature definitions, point-in-time joins with lags, train on logged serving features.");

L("ai-inference-modes", M, "Batch, online and streaming inference", "Choosing when predictions are computed, and sizing each mode.", {
  kind: "concept", mins: 20,
  hook: "Collections wants a daily risk-priority list; underwriting wants a decision while the applicant waits; fraud wants to stop a UPI payment mid-flight. One model, three serving modes?",
  intuition: `
**Batch inference.** Score everything on a schedule (nightly), write results to a table. Simple, cheap, easy to audit; predictions can be up to a day stale. Fits: collections prioritisation, marketing lists, portfolio risk.

**Online (request-response) inference.** A service scores on demand with a latency budget (say 200 ms). Fresh inputs, but needs always-on infrastructure, low-latency feature lookup and fallbacks. Fits: loan application decisions.

**Streaming inference.** Score events as they flow through a stream (Kafka), with features computed over recent windows (transactions in the last 10 minutes). Fits: fraud, real-time alerts.

Hybrids are common: precompute heavy features in batch, combine with a few real-time features online.
`,
  maths: `
**In one breath.** Batch throughput needed = items / window; online capacity = peak QPS × latency (Little's law) concurrent requests; freshness = schedule interval + processing time.

**Worked example (batch).** Score 10 lakh loans in a 4-hour nightly window: $10^6/(4 \\times 3600) = 69.4$ predictions/s, trivial for a tree model on one machine.

**Worked example (online).** Peak 300 applications/s, 150 ms per request: $300 \\times 0.15 = 45$ requests in flight; with 10 concurrent requests per instance, 5 instances plus headroom.

**Worked example (freshness).** Nightly batch on data snapshotted at 2 a.m.: predictions used at 6 p.m. reflect data 16 hours old; anything that happened that day is invisible.

| Mode | Latency | Freshness | Cost/complexity | Example |
|---|---|---|---|---|
| Batch | hours | schedule interval | low | daily collections list |
| Online | ms–s | real time | medium | application decision |
| Streaming | ms–s | real time, windowed | high | payment fraud |
`,
  practice: `
**Choose the simplest mode that meets the freshness requirement.** Ask: how stale can a prediction be before it changes a decision? Online services need timeouts and fallbacks (rules or last batch score) when the model or feature store is slow.

**LLM workloads** follow the same split: nightly transcript summarisation in batch (cheaper, large batches), live voice turns online.
`,
  traps: [
    { trap: "Real-time is always better.", why: "It costs more and adds failure modes. If decisions happen once a day, batch is simpler and equally good." },
    { trap: "Online serving just wraps the training notebook in an API.", why: "Needs low-latency feature retrieval, timeouts, fallbacks, versioning and monitoring; notebook code often recomputes features slowly or differently (skew)." },
    { trap: "Streaming features can be computed the same way as batch features.", why: "Windowed aggregates over late, out-of-order events need event-time logic and watermarks; naive versions disagree with batch recomputations." },
  ],
  say: {
    prompt: "How do you decide between batch, online and streaming inference?",
    secs: 45,
    check: ["Driven by how fresh predictions must be for the decision", "Batch: scheduled, cheap, stale; online: on request, latency budget; streaming: event-driven, windowed features", "Sizing: items/window, QPS × latency", "Fallbacks and timeouts for online", "Hybrids: batch-precomputed + real-time features"],
    followups: [
      { q: "Throughput needed to score 10 lakh items in 4 hours?", a: "About 69 per second." },
      { q: "What's the fallback if the online model times out?", a: "A simple rule or the latest batch score, with the event logged and alerting if fallback rates rise." },
      { q: "Why is streaming harder than batch?", a: "Events arrive late and out of order, state must be maintained for windows, and results must match batch recomputation." },
    ],
    answer: `I start from how fresh a prediction has to be to change the decision. If it's acted on once a day, like a collections priority list, batch scoring on a schedule is cheapest and easiest to audit; ten lakh loans in a four-hour window is only about 70 predictions a second. If a person is waiting, like a loan application, it's an online service with a latency budget, low-latency features, timeouts and a fallback. If you must act on events as they happen, like stopping a fraudulent payment, it's streaming with windowed features.

Hybrids are common: heavy features precomputed in batch, a few real-time features online. I choose the simplest mode that meets the freshness requirement.`,
    avoid: ["“Always real-time”", "Serving without fallbacks"],
  },
  terms: [["Batch inference", "Scheduled scoring of many items."], ["Online inference", "On-demand scoring per request."], ["Streaming inference", "Scoring events from a stream, often with windowed features."]],
  sources: [S.rules, S.debt],
});
Q({ id: "ai-im-1", d: 1, secs: 30, prompt: "Score 10,00,000 loans in a 4-hour window. Required predictions per second? (1 decimal)", answer: 69.4, tol: 0.1, explain: "1e6/(4 × 3600) = 69.4.", py: "answer = 1e6/(4*3600)" });
Q({ id: "ai-im-2", d: 2, secs: 60, prompt: "Peak 300 requests/s, 150 ms each, 10 concurrent requests per instance. Minimum instances?", answer: 5, tol: 0.5, explain: "300 × 0.15 = 45 in flight → ceil(45/10) = 5.", py: "import math\nanswer = math.ceil(300*0.15/10)" });
Q({ id: "ai-im-3", d: 1, secs: 30, prompt: "A nightly batch scores data snapshotted at 2 a.m. How many hours old is that data when a collector uses the score at 6 p.m.?", answer: 16, tol: 0.5, explain: "2 a.m. to 6 p.m. is 16 hours; events since the snapshot are invisible to the score.", py: "answer = 18 - 2" });
C("ai-im-c1", "Choosing inference mode", "Freshness need decides: batch (daily), online (request), streaming (event).");

L("ai-deploy-patterns", M, "Deployment patterns: shadow, canary, A/B and rollback", "Releasing a new model with controlled risk, and deciding from evidence.", {
  kind: "concept", mins: 25,
  hook: "The new underwriting model is better offline. Do you switch 100% of applications to it tomorrow?",
  intuition: `
**The situation.** Offline gains don't guarantee production gains (skew, drift, interactions with policy). A bad model in lending costs money and fairness before anyone notices.

**Patterns, from least to most exposure.**

- **Shadow:** the new model scores live requests in parallel; its decisions aren't used. Compare score distributions, latency, errors and agreement with the current model. Zero business risk.
- **Canary:** route a small share (1–5%) of traffic to the new model, watch technical and business guardrails, ramp up gradually.
- **A/B test:** randomised split with a pre-registered metric and sample size, to measure impact (approval rate, early delinquency, revenue).
- **Champion–challenger:** the standing practice in credit: challenger runs on a slice continuously; promoted only if it beats the champion.
- **Rollback:** always possible in minutes; keep the previous model deployed and switchable.

**Outcome delay.** In lending, the real outcome (default) appears months later, so early decisions rely on proxies (score distributions, approval rates, first-payment defaults).
`,
  maths: `
**In one breath.** Canary error-rate check: two-proportion test; shadow agreement = share of requests where both models make the same decision.

**Worked example (shadow).** Over 20,000 shadowed applications, the two models make the same approve/decline decision on 18,600: 93% agreement. Review the 1,400 "swap-ins/swap-outs" by segment before any live traffic.

**Worked example (canary).** Baseline error rate 0.5%. Canary at 5% of 2,00,000 daily requests = 10,000 requests. If the canary shows 1.0% errors (100 errors) vs baseline 0.5% on 1,90,000: SE $\\approx \\sqrt{0.01 \\times 0.99/10{,}000 + 0.005 \\times 0.995/190{,}000} = 0.00101$; $z \\approx 4.9$: roll back.

**Sizing an A/B.** Detecting a 1-point change in first-payment default (3% → 2%) at 80% power needs about 3,800 loans per arm; at 1,000 loans/day per arm that's about 4 days of booking plus the time to observe first payments.
`,
  practice: `
**Release checklist.** Shadow first (distribution, latency, errors) → canary with automatic rollback triggers (errors, latency, approval rate out of band) → A/B or champion–challenger for business impact → full rollout → keep the old model warm.

**Guardrails** are pre-agreed: e.g. approval rate within ±3 points, p95 latency < 300 ms, no segment's approval rate dropping > 5 points (fairness check).
`,
  traps: [
    { trap: "Offline AUC improved, so ship to everyone.", why: "Skew, drift and policy interactions only show in production. Shadow and canary first, with rollback ready." },
    { trap: "Canary looks fine after an hour, ramp to 100%.", why: "Low traffic and time-of-day effects hide problems; in lending the true outcome is months away. Ramp in steps with proxy metrics and pre-agreed guardrails." },
    { trap: "Shadow mode measures business impact.", why: "Shadow decisions aren't acted on, so you can't see their outcomes. It validates behaviour; impact needs A/B or champion–challenger." },
  ],
  say: {
    prompt: "How would you roll out a new credit-risk model to production?",
    secs: 60,
    check: ["Shadow: compare distributions, agreement, latency, errors without risk", "Canary with automatic rollback triggers and gradual ramp", "A/B or champion–challenger for business impact; outcome delay → proxies", "Pre-agreed guardrails incl. segment/fairness checks", "Previous model kept warm for instant rollback"],
    followups: [
      { q: "Two models agree on 18,600 of 20,000 decisions. Agreement rate?", a: "93%; review the 1,400 disagreements by segment." },
      { q: "How do you handle months-long outcome delay?", a: "Use early proxies (first-payment default, early DPD, score distributions, approval rates), run champion–challenger long enough, and confirm with vintage analysis later." },
      { q: "What would trigger an automatic rollback?", a: "Error or latency over thresholds, approval rate outside the agreed band, or a segment's approval rate moving more than the fairness limit." },
    ],
    answer: `I'd start in shadow mode: the new model scores live applications without its decisions being used, and I compare score distributions, decision agreement, latency and errors, reviewing disagreements by segment. Then a canary on a few percent of traffic with pre-agreed guardrails, like approval rate band, latency, errors and segment-level approval changes, and automatic rollback, ramping up in steps.

Because default outcomes take months, impact is measured through an A/B or champion–challenger split using early proxies like first-payment default, confirmed later with vintage analysis. The previous model stays deployed and switchable throughout, so rollback takes minutes.`,
    avoid: ["Big-bang switch", "Treating shadow results as impact"],
  },
  terms: [["Shadow deployment", "New model runs on live inputs without affecting decisions."], ["Canary", "Small share of live traffic to the new model."], ["Champion–challenger", "Ongoing comparison where a challenger must beat the incumbent."]],
  sources: [S.rules, S.debt],
});
Q({ id: "ai-dp-1", d: 1, secs: 30, prompt: "Shadow comparison: same decision on 18,600 of 20,000 applications. Agreement rate?", answer: 0.93, tol: 0.002, explain: "18,600/20,000.", py: "answer = 18600/20000" });
Q({ id: "ai-dp-2", d: 3, secs: 120, prompt: "Canary: 100 errors in 10,000 requests; baseline 950 errors in 1,90,000. z-statistic for the difference (unpooled)? (1 decimal)", answer: 4.9, tol: 0.2, explain: "p₁ = 0.01, p₀ = 0.005; SE = √(0.01·0.99/10000 + 0.005·0.995/190000) = 0.00101; z ≈ 4.9.", py: "p1, n1, p0, n0 = 0.01, 10000, 0.005, 190000\nse = (p1*(1-p1)/n1 + p0*(1-p0)/n0)**0.5\nanswer = (p1-p0)/se" });
Q({ id: "ai-dp-3", d: 3, secs: 120, prompt: "Loans per arm to detect first-payment default 3% → 2% at α = 0.05 (two-sided), 80% power, normal approximation? (nearest 100)", answer: 3800, tol: 100, explain: "n = (1.96 + 0.84)² × (0.03·0.97 + 0.02·0.98)/0.01² ≈ 3,822.", py: "from scipy.stats import norm\nz = norm.ppf(0.975) + norm.ppf(0.8)\nanswer = z**2*(0.03*0.97 + 0.02*0.98)/0.01**2", packages: ["scipy"] });
C("ai-dp-c1", "Release ladder", "Shadow → canary (auto-rollback) → A/B or champion–challenger → full, old model kept warm.");

L("ai-tracking-registry", M, "Experiment tracking, reproducibility and the model registry", "Recording what produced each model, and managing which version is live.", {
  kind: "concept", mins: 20,
  hook: "An auditor asks which data, code and parameters produced the model that declined an applicant in March. Can you answer in an hour?",
  intuition: `
**The situation.** Models are produced by data + code + configuration + randomness. If any is unrecorded, you can't reproduce, explain or safely roll back. In regulated lending you must be able to.

**Experiment tracking.** Every training run logs: code version (git commit), data version (snapshot ID or hash), parameters, metrics, artefacts (model file, plots), environment (library versions), random seeds. Tools like MLflow record this automatically.

**Model registry.** A catalogue of trained models with versions and stages (candidate → staging → production → archived), approvals, and links back to the runs that produced them. Serving loads "the production version of model X" from the registry, so promotion and rollback are a registry change, not a code change.

**Reproducibility.** Pin library versions, version data, fix seeds, and record everything needed to rerun.
`,
  maths: `
**In one breath.** Grid size = product of options per hyperparameter; wall time = runs × time per run / parallel workers; seed variance tells you whether a difference is real.

**Worked example (grid).** 4 learning rates × 3 depths × 5 regularisation values = 60 runs at 12 minutes each: 12 hours serially, 2 hours with 6 workers. A random search of 20 runs often finds an equally good configuration in 40 minutes.

**Worked example (seed variance).** Five seeds of the same configuration give AUC 0.801, 0.797, 0.804, 0.799, 0.800: mean 0.8002, SD 0.0026. A new configuration at 0.803 on one seed is within noise.

**Lineage.** For any production prediction: model version → run ID → git commit + data snapshot + parameters + feature definitions.
`,
  practice: `
**Minimum standard.** Every run tracked automatically; training data snapshots immutable and referenced by ID; models promoted only through the registry with a recorded approval and validation report; serving logs the model version with each prediction.

**Documentation.** A model card per production version: purpose, data, metrics by segment, limitations, owner.
`,
  traps: [
    { trap: "The notebook and the pickle file are enough.", why: "Without the exact data snapshot, code version, parameters and environment, you can't reproduce or explain the model." },
    { trap: "A 0.003 AUC gain on one run means the new config is better.", why: "Seed-to-seed variation can be that large. Compare across several seeds or folds." },
    { trap: "Deploy by copying the model file to the server.", why: "Manual copies lose lineage and make rollback error-prone. Promote and roll back through a registry." },
  ],
  say: {
    prompt: "How do you make ML experiments reproducible and models auditable?",
    secs: 45,
    check: ["Track every run: code commit, data version, params, metrics, artefacts, environment, seeds", "Model registry with versions, stages, approvals; serving loads from registry", "Lineage from prediction back to data and code", "Seed variance before claiming improvements", "Model cards / documentation; log model version per prediction"],
    followups: [
      { q: "60 runs at 12 minutes with 6 workers: wall time?", a: "2 hours." },
      { q: "What is a model registry for?", a: "Versioning trained models, tracking their stage (staging, production), approvals and lineage, and letting serving fetch the current production version so promotion and rollback are controlled." },
      { q: "How do you version data?", a: "Immutable snapshots or tables with IDs/hashes, referenced from each training run (or a data-versioning tool)." },
    ],
    answer: `Every training run should be logged automatically: the git commit, an immutable data snapshot ID, parameters, seeds, environment versions, metrics and artefacts, which tools like MLflow handle. Trained models go into a registry with versions, stages and recorded approvals, and serving loads the current production version from it, so promotion and rollback are controlled changes.

That gives lineage: from any prediction, which carries its model version, back to the run, the data and the code. Before claiming an improvement I check variation across seeds or folds, and each production model has a model card with its purpose, data, segment metrics and limitations, which is exactly what an auditor asks for.`,
    avoid: ["“It's in my notebook”", "Manual model file copies"],
  },
  terms: [["Experiment tracking", "Recording parameters, code, data and metrics of each run."], ["Model registry", "Versioned catalogue of models with stages and approvals."], ["Lineage", "Trace from a prediction back to model, data and code."]],
  sources: [S.mlflow, S.debt],
});
Q({ id: "ai-tr-1", d: 1, secs: 30, prompt: "Grid of 4 × 3 × 5 configurations at 12 minutes each, 6 parallel workers. Wall time in hours?", answer: 2, tol: 0.01, explain: "60 × 12 = 720 minutes / 6 = 120 minutes.", py: "answer = 4*3*5*12/6/60" });
Q({ id: "ai-tr-2", d: 2, secs: 60, prompt: "Five seeds give AUC 0.801, 0.797, 0.804, 0.799, 0.800. Sample standard deviation? (4 decimals)", answer: 0.0026, tol: 0.0002, explain: "ddof = 1: ≈ 0.0026.", py: "import numpy as np\nanswer = float(np.std([0.801,0.797,0.804,0.799,0.800], ddof=1))", packages: ["numpy"] });
Q({ id: "ai-tr-3", d: 1, secs: 30, prompt: "Which record lets you rerun a training job exactly?", options: ["Model file only", "Metrics dashboard", "Code commit + data snapshot + parameters + environment + seed", "The final AUC"], answer: 2, explain: "All inputs to training must be pinned.", py: "answer = 2" });
C("ai-tr-c1", "Reproducible run", "Code commit, data snapshot ID, params, seed, environment, metrics, artefacts.");

L("ai-drift-monitoring", M, "Drift detection and monitoring without labels", "Data drift, concept drift, PSI, and estimating performance before outcomes arrive.", {
  kind: "concept", mins: 25, prereq: ["ai-serving-skew"],
  hook: "Default labels take 90 days to arrive. How do you know your model is degrading this week?",
  intuition: `
**The situation.** The world changes: new customer segments, a festival season, a policy change, an economic shock. The model doesn't.

**Kinds of drift.**

- **Data (covariate) drift:** input distributions change (more first-time borrowers). The model may still be right for each input but sees regions it learnt less about.
- **Prediction drift:** the score distribution shifts.
- **Concept drift:** the relationship between inputs and outcome changes (the same profile now defaults more). Only visible with labels.

**Monitoring ladder.** Data quality (nulls, ranges, schema) → input drift per feature → score distribution → proxy outcomes (early DPD) → true outcomes when they mature. Alert on meaningful changes, not every wiggle.

**Without labels**, you can still watch inputs and scores; if the model is well calibrated, the average predicted default rate is an estimate of the expected default rate, to compare with early outcomes as they arrive.
`,
  maths: `
**In one breath.** Population stability index $\\text{PSI} = \\sum_i (a_i - e_i)\\ln\\frac{a_i}{e_i}$ over bins ($e$ = expected/training share, $a$ = actual share); rules of thumb: < 0.1 stable, 0.1–0.25 moderate shift, > 0.25 major shift.

**Worked example.** Score bins with training shares (0.25, 0.25, 0.25, 0.25) and current shares (0.20, 0.25, 0.25, 0.30): PSI $= (-0.05)\\ln 0.8 + 0 + 0 + 0.05\\ln 1.2 = 0.01116 + 0.00912 = 0.0203$: stable.

**Shares (0.10, 0.20, 0.30, 0.40):** PSI $\\approx 0.228$: moderate shift, investigate.

**Expected performance without labels.** If predicted default probabilities are calibrated, expected default rate = mean predicted PD. This month's mean PD 4.2% vs 3.1% at training: expect more defaults; check whether that's mix (fine) or miscalibration (when early labels come in).
`,
  practice: `
**Setup.** Reference window (training or validation period); daily/weekly PSI per key feature and the score; data-quality checks before drift checks; segment-level views; alerts with thresholds tuned to avoid fatigue; a runbook (investigate → decide retrain, recalibrate, or policy change).

**LLM systems** drift too: new intents, new languages, new document templates. Track input-type mix and online eval rates.
`,
  traps: [
    { trap: "Input drift means the model is broken.", why: "The model may handle the new mix fine. Drift is a prompt to check performance (proxies, early labels), not proof of failure." },
    { trap: "No labels yet, so nothing to monitor.", why: "Data quality, input and score distributions, and calibrated expected outcomes are all available immediately." },
    { trap: "Alert on any statistically significant change.", why: "With large volumes, tiny irrelevant shifts are significant. Use effect-size thresholds like PSI and business relevance." },
  ],
  say: {
    prompt: "How do you monitor a credit model in production when labels arrive months later?",
    secs: 60,
    check: ["Data quality checks first (nulls, ranges, schema)", "Input and score drift (PSI per feature/score) vs a reference window", "Distinguish data drift vs concept drift; drift ≠ failure", "Proxies and early outcomes; calibrated expected default rate", "Segment views, thresholds, runbook (retrain/recalibrate)"],
    followups: [
      { q: "Compute PSI for expected (0.25 ×4) vs actual (0.2, 0.25, 0.25, 0.3).", a: "≈ 0.020: stable." },
      { q: "What is concept drift?", a: "A change in P(outcome | inputs): the same inputs now lead to different outcomes; only detectable with outcomes or proxies." },
      { q: "What would you do after a PSI of 0.3 on the score?", a: "Check data quality and pipelines first, identify which features and segments moved, check early outcomes and calibration, then decide on recalibration, retraining or policy adjustment." },
    ],
    answer: `I'd monitor in layers. First data quality: schema, nulls and ranges on incoming features, because many 'drift' alarms are broken feeds. Then input drift and score drift against a reference window, with PSI per key feature and on the score, by segment. Drift isn't failure, it's a reason to look closer.

Since defaults take months, I'd use proxies like early DPD and first-payment default, and if the model is calibrated, the mean predicted default rate tells me what to expect from the current mix. When outcomes mature I'd check discrimination and calibration by vintage to catch concept drift. Alerts use effect-size thresholds and a runbook that decides between fixing data, recalibrating or retraining.`,
    avoid: ["“We wait for defaults to know”", "Treating every drift alert as a model failure"],
  },
  terms: [["Data drift", "Change in input distribution."], ["Concept drift", "Change in the input–outcome relationship."], ["PSI", "Population stability index over binned distributions."]],
  sources: [S.rules, S.debt],
});
Q({ id: "ai-dr-1", d: 2, secs: 60, prompt: "PSI for expected bin shares (0.25, 0.25, 0.25, 0.25) and actual (0.20, 0.25, 0.25, 0.30)? (4 decimals)", answer: 0.0203, tol: 0.0002, explain: "(−0.05)ln(0.8) + 0.05 ln(1.2) = 0.0112 + 0.0091.", py: "import numpy as np\ne = np.array([.25,.25,.25,.25]); a = np.array([.2,.25,.25,.3])\nanswer = float(np.sum((a-e)*np.log(a/e)))", packages: ["numpy"] });
Q({ id: "ai-dr-2", d: 2, secs: 60, prompt: "PSI for expected (0.25 each) and actual (0.10, 0.20, 0.30, 0.40)? (3 decimals)", answer: 0.228, tol: 0.002, explain: "Σ (a − e) ln(a/e) ≈ 0.228: moderate shift.", py: "import numpy as np\ne = np.full(4, .25); a = np.array([.1,.2,.3,.4])\nanswer = float(np.sum((a-e)*np.log(a/e)))", packages: ["numpy"] });
Q({ id: "ai-dr-3", d: 1, secs: 30, prompt: "A calibrated model's predicted default probabilities this month average 4.2%. Expected default rate for this month's bookings (if calibration holds)?", answer: 0.042, tol: 0.0005, explain: "Calibrated → mean predicted PD estimates the default rate.", py: "answer = 0.042" });
C("ai-dr-c1", "PSI", "Σ (actual − expected) · ln(actual/expected); <0.1 stable, 0.1–0.25 moderate, >0.25 major.");

L("ai-retraining-feedback", M, "Retraining pipelines and feedback loops", "When to retrain, champion–challenger promotion, and how a model's own decisions bias its future training data.", {
  kind: "concept", mins: 25, prereq: ["ai-drift-monitoring", "ai-deploy-patterns"],
  hook: "Your model declines 40% of applicants. Next year you retrain on outcomes. What do you know about the people you declined?",
  intuition: `
**Retraining.** Models decay as the world drifts. Options: scheduled retraining (monthly/quarterly), triggered retraining (drift or performance alerts), or continuous training. Each new model is a challenger: it must beat the current champion on recent, held-out, time-later data before promotion through the deployment ladder.

**Feedback loops.** The model changes the data it will later learn from:

- **Selection bias (credit):** you only observe repayment for approved applicants. Declined applicants have no labels, so the next model learns only from the approved population (reject inference problem).
- **Intervention effects (collections):** if the model sends high-risk borrowers to intensive follow-up, their outcomes improve because of the treatment, and a naive retrain learns they're lower risk.
- **Recommendation loops:** items shown more get more clicks and get shown more.

**Mitigations.** Small randomised exploration (approve a small random sample within policy limits, or randomise treatments), log the decision and treatment, model outcomes conditional on treatment, and reject-inference techniques with care.
`,
  maths: `
**In one breath.** Labelled fraction = approval rate; with exploration rate $\\epsilon$ on declines, labels from the declined region = declines × $\\epsilon$; promotion needs the challenger's gain to exceed noise on time-later data.

**Worked example (selection).** 10,000 applicants/month, 60% approved: 6,000 get outcomes, 4,000 never do. With 2% exploration on declines: 80 labelled declines/month, about 960/year to learn from the region the model rejects.

**Worked example (treatment effect).** Without follow-up, high-risk borrowers roll forward 30% of the time; with intensive follow-up, 18%. A retrain that ignores the treatment would think high-risk borrowers roll 18%: underestimating risk by 12 points.

**Promotion rule.** Challenger AUC 0.792 vs champion 0.785 on an out-of-time sample; bootstrap CI of the difference [0.002, 0.012] excludes 0: promote (subject to stability and fairness checks).
`,
  practice: `
**Pipeline.** Data snapshot → feature computation (same definitions as serving) → train → validate out-of-time and by segment → compare with champion → register → shadow/canary → promote. Automate, but keep a human approval for regulated models.

**Log decisions and treatments** with every prediction so future training can account for them.
`,
  traps: [
    { trap: "Retrain on all available labelled data and you're done.", why: "Labels exist only where the model let them exist (approved loans, treated customers). The training data is biased by past decisions." },
    { trap: "Retrain on a fixed schedule regardless of evidence.", why: "Unneeded retrains add risk; needed ones may come early. Combine a schedule with drift/performance triggers and champion–challenger checks." },
    { trap: "Validate the retrained model on a random split.", why: "Random splits leak time; validate on a later period to mimic deployment." },
  ],
  say: {
    prompt: "How would you set up retraining for a credit model, and what feedback-loop issues worry you?",
    secs: 60,
    check: ["Schedule + drift/performance triggers; automated pipeline with same feature definitions", "Out-of-time validation; challenger must beat champion; registry and deployment ladder", "Selection bias: no labels for declined applicants (reject inference)", "Treatment effects (collections interventions) bias outcomes", "Mitigations: exploration/randomisation, logging decisions and treatments"],
    followups: [
      { q: "60% approval on 10,000 monthly applicants: how many outcomes do you never see?", a: "4,000 per month." },
      { q: "What is reject inference?", a: "Methods for estimating how declined applicants would have performed (e.g. bureau performance on other loans, small randomised approvals, parcelling), so models aren't trained only on approvals." },
      { q: "How do treatments distort labels in collections?", a: "If high-risk accounts get extra follow-up and therefore pay more, their outcomes look better than their untreated risk; the model must include treatment or be trained on randomised data." },
    ],
    answer: `I'd automate a pipeline that snapshots data, computes features with the same definitions used in serving, trains, and validates on a later time period and by segment. It runs on a schedule and on drift or performance triggers, and the result is a challenger that must beat the current champion with a margin bigger than noise before it goes through the registry, shadow and canary.

The feedback loops worry me most. We only see repayment for people we approved, so each new model learns from a population shaped by the old one, and in collections our interventions change outcomes, so high-risk accounts that got intensive follow-up look safer than they are. Mitigations are a small randomised exploration budget within policy, logging every decision and treatment, modelling outcomes conditional on treatment, and careful reject inference.`,
    avoid: ["Ignoring selection bias from past decisions", "Random-split validation"],
  },
  terms: [["Champion–challenger", "New model must beat the incumbent before promotion."], ["Selection bias", "Labels observed only for cases the system selected."], ["Reject inference", "Estimating outcomes for declined applicants."]],
  sources: [S.debt, S.rules],
});
Q({ id: "ai-rt-1", d: 1, secs: 30, prompt: "10,000 applicants/month, 60% approved. Applicants per month with no observed outcome?", answer: 4000, tol: 0.5, explain: "40% of 10,000.", py: "answer = 10000*0.4" });
Q({ id: "ai-rt-2", d: 1, secs: 30, prompt: "2% of declined applicants are approved for exploration. Labelled declines per year?", answer: 960, tol: 0.5, explain: "4,000 × 0.02 × 12 = 960.", py: "answer = 4000*0.02*12" });
Q({ id: "ai-rt-3", d: 2, secs: 45, prompt: "High-risk accounts roll forward 30% untreated and 18% with intensive follow-up (all were treated). By how many percentage points does a treatment-blind retrain underestimate their untreated risk?", answer: 12, tol: 0.05, explain: "30 − 18 = 12 points.", py: "answer = 30-18" });
C("ai-rt-c1", "Feedback loops", "Approved-only labels (reject inference), treatment effects, exposure loops → explore, log decisions/treatments.");

L("ai-mlops-practice", M, "MLOps practice", "Interview scenarios on deploying, monitoring and maintaining ML models.", {
  kind: "interview", mins: 35, prereq: ["ai-serving-skew", "ai-inference-modes", "ai-deploy-patterns", "ai-tracking-registry", "ai-drift-monitoring", "ai-retraining-feedback"],
  hook: "Answer each scenario out loud in about a minute, then open it and tick off the points the interviewer is listening for.",
}, [
  iq("Design the production setup for a new early-warning model that flags borrowers likely to miss next month's EMI.", "Batch scoring daily/weekly (decision cadence), features from a feature store with point-in-time training joins, registry-managed model versions, shadow then champion–challenger, monitoring (data quality, PSI, score drift, early outcomes), retraining pipeline with out-of-time validation, logging of interventions taken on flagged accounts.", ["Inference mode from decision cadence", "Point-in-time features / feature store", "Safe rollout", "Monitoring ladder", "Treatment logging"]),
  iq("Offline AUC 0.80, live AUC 0.68 after one month. Walk through your investigation.", "Check skew (recompute features for logged requests), data feeds and nulls, leakage in training (future info), population drift (PSI by feature/segment), label definition differences, time-based validation. Fix pipeline, retrain on logged features if needed.", ["Skew audit", "Leakage check", "Drift by segment", "Label/validation mismatch"]),
  iq("PSI on the score jumped to 0.35 this week. What do you do?", "Data-quality first (feed failures, schema changes), identify drifting features and segments, check for business changes (new product, campaign), check early outcomes/calibration, then decide: fix data, recalibrate, retrain, or adjust policy; communicate with risk team.", ["Data quality first", "Locate drift", "Business context", "Decision runbook"]),
  iq("How do you make sure you can explain a decision made by last year's model?", "Registry with version history, run lineage (code commit, data snapshot, params), logged features and model version per decision, model cards, immutable storage of artefacts and data snapshots, reproducible environment.", ["Registry + lineage", "Per-decision logging", "Immutable data/artefacts", "Model cards"]),
  iq("Your collections model sends high-risk accounts to intensive calling. After retraining, the model rates those profiles as lower risk. Why?", "Treatment effect: intensive follow-up reduced their roll rates, and the retrain learned from treated outcomes without knowing about treatment. Fix: log treatments, model treatment explicitly or train on randomised holdout data, estimate uplift instead of raw risk.", ["Feedback loop / treatment effect", "Logging treatment", "Randomised holdout", "Uplift framing"]),
]);
