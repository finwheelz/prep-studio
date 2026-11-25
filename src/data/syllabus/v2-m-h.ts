/**
 * v2 Maths for ML, part H: A/B testing (design, power, analysis, variance reduction). Fixed ids; answers recomputed in Pyodide.
 */
import { CHECKED, lessonWriter } from "./v2-shared";
import { MS } from "./v2-m-src";

const { L, Q, C } = lessonWriter("maths");
const AB = "A/B testing";
const NP = ["numpy"];
const SP = ["numpy", "scipy"];
const src = (label: string, url: string) => ({ label, url, checked: CHECKED });
const DELTA = src("Deng, Knoblich, Lu (2018): Applying the Delta Method in Metric Analytics: A Practical Guide with Novel Ideas", "https://arxiv.org/abs/1803.06336");
const DIRTY = src("Dmitriev, Gupta, Kim, Vaz (2017): A Dirty Dozen: Twelve Common Metric Interpretation Pitfalls in Online Controlled Experiments, KDD", "https://exp-platform.com/Documents/2017-08%20KDDMetricInterpretationPitfalls.pdf");

L("m-ab-units", AB, "Randomisation units and analysis units", "Choosing what to randomise (users, sessions, pages, clusters), keeping assignment consistent, and analysing at the level you randomised.", {
  kind: "concept", mins: 20, prereq: ["m-sampling-dist"],
  hook: "You randomise by session but compute standard errors as if sessions were independent. Why might a 'significant' result be noise?",
  intuition: `
**The situation.** Before any metric or test, you decide *what* gets a coin flip: a user, a device, a session, a page view, a search query, a city.

**Choosing the unit.**

- **User** (logged-in ID or a stable cookie): the default. Consistent experience, and you can measure long-run behaviour like retention.
- **Session or page view**: more units and more power, but one person sees both versions, which is confusing for visible changes and lets effects leak between arms.
- **Cluster** (city, store, social group, seller): needed when units interact (marketplaces, social features). Far fewer units, so less power.

**Rules.**

1. Assignment must be **random and stable**: hash the unit ID with an experiment-specific salt, so a user always lands in the same arm.
2. **Analyse at the randomisation unit** (or use standard errors that account for clustering). If you randomise users but compute a per-page-view metric, page views from one user are correlated.
3. The **analysis unit** can be finer than the randomisation unit (clicks per page view in a user-randomised test), but then you need the delta method or a cluster-robust SE.
`,
  maths: `
**In one breath.** Hash assignment: arm $= h(\\text{salt} \\,\\|\\, \\text{id}) \\bmod 100 < 50$; design effect for $m$ correlated observations per unit with intra-unit correlation $\\rho$: $1 + (m - 1)\\rho$; naive SEs are too small by $\\sqrt{\\text{DEFF}}$.

**Worked example.** Users average 5 sessions; session-level conversion has intra-user correlation 0.3. DEFF $= 1 + 4 \\times 0.3 = 2.2$: a session-level analysis that pretends independence reports SEs $\\sqrt{2.2} = 1.48$ times too small, so its nominal 5% false-positive rate is really about 27% (a $z$ of 1.96 is really $1.96/1.48 = 1.32$).

**Trade-offs.**

| Unit | Units available | Consistency | Interference risk | Typical use |
|---|---|---|---|---|
| user | medium | high | low | most product tests |
| session / page view | high | low | medium (learning carries over) | ranking, latency, invisible changes |
| device / cookie | medium | medium (multi-device) | low | logged-out traffic |
| cluster (city, seller) | low | high | handled | marketplaces, social, pricing |
| time window (switchback) | low–medium | within window | handled | dispatch, pricing algorithms |

**Salt per experiment.** Re-using the same hash across experiments makes the same users the "treatment" every time, so effects carry over and experiments correlate.
`,
  practice: `
**Checklist.** State the randomisation unit, the analysis unit and the metric's denominator together. If they differ, plan the delta method or bootstrap at the randomisation unit. Log assignment at the moment of exposure, not later.

**Triggering.** Analyse only users who could have seen the change (e.g. reached checkout) to cut noise, but decide the trigger condition identically in both arms.
`,
  traps: [
    { trap: "Randomise by user, analyse per page view with an ordinary t-test.", why: "Page views within a user are correlated, so the naive SE is too small and false positives multiply. Use the delta method or aggregate per user." },
    { trap: "Session-level randomisation is always fine because it gives more power.", why: "The same person sees both versions; for visible changes that confuses users and contaminates the comparison (learning carries over)." },
  ],
  say: {
    prompt: "How do you choose the randomisation unit for an experiment, and what goes wrong if analysis and randomisation units differ?",
    secs: 45,
    check: ["Default user (stable hashed ID) for consistency and long-term metrics", "Finer units (session/page) for invisible changes: more power, less consistency", "Clusters or switchbacks when units interfere", "Analyse at the randomisation unit or use delta method / cluster-robust SEs", "Mismatch ⇒ SEs too small ⇒ inflated false positives"],
    followups: [
      { q: "How is assignment usually implemented?", a: "Hash of experiment salt + unit ID, modulo buckets; deterministic and stable." },
      { q: "What if users browse logged out on several devices?", a: "Cookie/device randomisation splits a person across arms; accept dilution or use a logged-in subset." },
      { q: "How much do correlated sessions inflate variance?", a: "Design effect $1 + (m-1)\\rho$; with 5 sessions and ρ = 0.3, 2.2 times." },
    ],
    answer: `I start from what the change touches and who might notice. The default is the user, via a salted hash of a stable ID, so each person always sees the same version and I can measure things like retention. For invisible changes such as ranking or latency, sessions or queries give more units and power. If units affect each other, like buyers and sellers in a marketplace, I randomise clusters or time windows. Whatever the unit, I analyse at that level: if I randomise users but compute a per-session or per-click metric, observations within a user are correlated, the naive standard error is too small and false positives rise, so I'd use the delta method or aggregate per user.`,
    avoid: ["Ignoring the analysis/randomisation mismatch", "Choosing session-level for visible UI changes without caveats"],
  },
  terms: [["Randomisation unit", "The entity that receives the coin flip."], ["Analysis unit", "The denominator of the metric."], ["Salted hash", "Deterministic, experiment-specific assignment."]],
  sources: [MS.kohavi, DELTA],
});
Q({ id: "m-abu-1", d: 2, secs: 45, prompt: "Users have 5 sessions on average; intra-user correlation of the session metric is 0.3. Design effect?", answer: 2.2, tol: 0.01, explain: "1 + (5 − 1) × 0.3.", py: "import numpy as np\nm,r=5,0.3\nS=np.full((m,m),r)+np.eye(m)*(1-r)\nanswer = float(S.sum()/m)", packages: NP });
Q({ id: "m-abu-2", d: 3, secs: 90, prompt: "With that design effect, a session-level analysis that assumes independence uses the 1.96 cut-off. What is its real two-sided false-positive rate? (3 decimals)", answer: 0.186, tol: 0.004, explain: "The true z at the cut-off is 1.96/√2.2 = 1.32; 2(1 − Φ(1.32)) = 0.186.", py: "from scipy import stats\nanswer = float(2*stats.norm.sf(1.96/2.2**0.5))", packages: SP });
Q({ id: "m-abu-3", d: 2, secs: 60, prompt: "Simulate the analysis: 2,000 users × 5 sessions, user effects make ρ = 0.3, no treatment effect. Naive session-level SE divided by the correct user-level SE? (2 decimals)", answer: 0.67, tol: 0.04, explain: "1/√2.2 = 0.674: the naive SE is a third too small.", py: "import numpy as np\nrng=np.random.default_rng(0)\nn,m=2000,5\nratios=[]\nfor _ in range(200):\n    u=rng.normal(0,0.3**0.5,(n,1));y=u+rng.normal(0,0.7**0.5,(n,m))\n    naive=y.std(ddof=1)/np.sqrt(n*m);true=y.mean(1).std(ddof=1)/np.sqrt(n)\n    ratios.append(naive/true)\nanswer = round(float(np.mean(ratios)),2)", packages: NP });
Q({ id: "m-abu-4", d: 1, secs: 30, prompt: "A ride-hailing company tests a new driver-dispatch algorithm. Best randomisation unit?", options: ["Rider", "Ride request", "Time window per city (switchback) or city", "Page view"], answer: 2, explain: "Riders share drivers; randomising riders lets arms interfere. Switch the whole market between algorithms.", py: "answer = 2" });
C("m-abu-c1", "Analyse at the randomisation unit", "Else use delta method / cluster-robust SEs.");
C("m-abu-c2", "Stable assignment", "Salted hash of the unit ID, per experiment.");

L("m-ab-metrics", AB, "Metrics: the OEC, guardrails and sensitivity", "Choosing a primary metric that predicts long-term value, guardrails that stop harm, and metrics that can move in a test's lifetime.", {
  kind: "concept", mins: 20, prereq: ["m-ab-units"],
  hook: "A change raises clicks 8% and lowers revenue 0.5%. Ship it?",
  intuition: `
**The situation.** An experiment can move dozens of numbers. You need to decide in advance which ones drive the decision.

**Three kinds of metric.**

- **Primary / OEC (overall evaluation criterion)**: the one (or a small weighted set) that defines success. It should be *sensitive* enough to move within weeks and *predictive* of long-term value (retention, revenue, satisfaction), not easily gamed.
- **Guardrails**: metrics that must not get worse: latency, crash rate, unsubscribe rate, revenue when testing engagement, and the **trust guardrails** that say the experiment itself is valid (sample ratio, logging rates).
- **Diagnostic / secondary**: help explain *why* the primary moved (click-through by position, funnel steps).

**Good metric properties.** Directional (up is good), sensitive (detectable effect with your traffic), attributable to the change, robust to outliers and bots, cheap and timely to compute.

**Goodhart's law.** Once a metric becomes a target, teams find ways to move it without moving value (clickbait raises CTR). Pair engagement metrics with quality or long-term ones.
`,
  maths: `
**In one breath.** Sensitivity: detectable effect $\\approx 2.8\\,\\sigma/\\sqrt{n}$ per arm (80% power, 5% two-sided) for a difference of means, so lower-variance metrics detect smaller effects; relative MDE $=$ absolute MDE / baseline.

**Variance shapes sensitivity.** Revenue per user is heavy-tailed: coefficient of variation (SD/mean) might be 10, while conversion at 5% has CV $\\sqrt{0.95/0.05} = 4.36$. For the same users, the relative MDE scales with CV, so revenue needs roughly $(10/4.36)^2 = 5.3$ times the traffic to detect the same relative change.

**Capping.** Winsorise revenue at the 99.9th percentile (chosen in advance): it can cut variance a lot at the cost of a small bias.

| Role | Example | Decision rule |
|---|---|---|
| OEC / primary | sessions per user, revenue per user | ship if significantly positive |
| Guardrail | p95 latency, crash rate, unsubscribe | block if significantly worse beyond tolerance |
| Trust guardrail | sample ratio, event-logging rate | invalidate the test if broken |
| Diagnostic | CTR by slot, funnel step rates | explain, not decide |

**Proxy metrics.** If the true goal (12-month retention) is slow, find a short-term metric that, across past experiments, moved in the same direction; validate the proxy, don't assume it.
`,
  practice: `
**Write a metric spec before launch.** Definition, unit and denominator, cap or filtering rule, expected direction, minimum effect of interest, and which metrics are guardrails with what tolerance.

**Too many metrics.** With 50 metrics something moves by chance; the pre-declared primary and guardrails decide, the rest are exploratory.
`,
  traps: [
    { trap: "Pick the metric that moved most after the test finishes.", why: "That's choosing among many tests post hoc: the multiple-comparisons problem. Declare the primary metric first." },
    { trap: "Click-through rate is a good OEC for a feed change.", why: "It is easily gamed (clickbait) and may trade off with satisfaction or long-term retention. Use CTR as a diagnostic and pair it with quality and retention." },
  ],
  say: {
    prompt: "How would you choose the primary metric and guardrails for an experiment on a new recommendation feed?",
    secs: 45,
    check: ["Primary/OEC tied to long-term value but sensitive in weeks (e.g. sessions or engaged time per user, conversions)", "Avoid gameable proxies like raw CTR as the decider", "Guardrails: revenue, latency, hides/complaints, diversity, creator side", "Trust guardrails: SRM, logging", "Pre-register, set tolerances, check variance/sensitivity"],
    followups: [
      { q: "What is Goodhart's law?", a: "When a measure becomes a target it stops being a good measure, because behaviour adapts to move the number." },
      { q: "How do you validate a short-term proxy metric?", a: "Across many past experiments, check that its movements predict movements in the long-term metric." },
      { q: "How do you handle a heavy-tailed metric?", a: "Cap at a pre-set percentile, use CUPED, or analyse a robust transform, and state the estimand." },
    ],
    answer: `For the primary metric I'd want something that tracks long-term value but moves within a few weeks, like engaged sessions or time well spent per user, not raw click-through, which clickbait can inflate. Guardrails would cover what we can't afford to hurt: revenue or ad load, latency, hides and reports, and for a two-sided platform the creator side. I'd add trust guardrails like sample ratio and logging volume that tell me whether the experiment itself is valid. CTR by position and diversity stay as diagnostics. All of that is written down with tolerances before launch, and I'd check that the primary metric's variance allows a meaningful effect to be detected with the traffic we have.`,
    avoid: ["Choosing the metric after seeing results", "Using an easily gamed metric as the decider"],
  },
  terms: [["OEC", "Overall evaluation criterion: the pre-declared success metric."], ["Guardrail metric", "Must not degrade beyond a tolerance."], ["Goodhart's law", "Targeted metrics stop measuring what you meant."]],
  sources: [MS.kohavi, DIRTY],
});
Q({ id: "m-abm-1", d: 2, secs: 45, prompt: "Conversion rate 5%. Coefficient of variation (SD/mean) of the per-user conversion indicator? (2 decimals)", answer: 4.36, tol: 0.01, explain: "√(p(1 − p))/p = √(0.95/0.05).", py: "from scipy import stats\nd=stats.bernoulli(0.05)\nanswer = float(d.std()/d.mean())", packages: SP });
Q({ id: "m-abm-2", d: 2, secs: 45, prompt: "Revenue per user has CV 10; conversion has CV 4.36. For the same relative MDE, how many times more users does revenue need? (1 decimal)", answer: 5.3, tol: 0.1, explain: "Sample size ∝ CV²: (10/4.36)² = 5.26.", py: "import math\ncv_c=math.sqrt(0.95/0.05)\nanswer = round((10/cv_c)**2,1)" });
Q({ id: "m-abm-3", d: 2, secs: 60, prompt: "Simulated revenue: 99% of users spend Exp(mean 20), 1% are whales spending Exp(mean 2,000). By what factor does capping at the 99.5th percentile cut the variance? (nearest whole number)", answer: 7, tol: 1, explain: "A handful of huge values carry most of the variance; capping the top 0.5% cuts it about sevenfold (at the cost of a small, known bias).", py: "import numpy as np\nrng=np.random.default_rng(0)\nn=2_000_000\nw=rng.uniform(size=n)<0.01\nx=np.where(w,rng.exponential(2000,n),rng.exponential(20,n))\nc=np.minimum(x,np.quantile(x,0.995))\nanswer = round(float(x.var()/c.var()))", packages: NP });
Q({ id: "m-abm-4", d: 1, secs: 30, prompt: "Which is a trust guardrail rather than a business guardrail?", options: ["p95 page latency", "Sample ratio between arms", "Revenue per user", "Unsubscribe rate"], answer: 1, explain: "Sample ratio checks whether the experiment itself is valid.", py: "answer = 1" });
C("m-abm-c1", "Metric roles", "Primary (OEC) decides; guardrails block; diagnostics explain.");
C("m-abm-c2", "Sensitivity", "Sample size ∝ variance; heavy tails → cap or CUPED.");

L("m-ab-power", AB, "Power, minimum detectable effect and sample size", "Sizing an experiment before it starts: the formula, the rules of thumb, and how traffic and duration follow.", {
  kind: "concept", mins: 25, prereq: ["m-hypothesis", "m-ab-metrics"],
  hook: "Baseline conversion 10%. You want to detect a lift to 11%. How many users per arm, and how long will that take at 20,000 visitors a day?",
  intuition: `
**The situation.** Too small a test misses real effects (and the significant results it does find are exaggerated); too big wastes traffic and time.

**Four quantities, fix three to get the fourth.**

- Significance level $\\alpha$ (false-positive rate), usually 5% two-sided.
- Power $1 - \\beta$ (chance of detecting the effect if it's real), usually 80%.
- **Minimum detectable effect (MDE)**: the smallest effect worth detecting, set by the business (what lift pays for the change?), not by what you hope for.
- Sample size $n$ per arm.

**How they move.** $n$ grows with variance, and with the inverse *square* of the MDE: halving the MDE quadruples the sample. Rarer conversions and heavier-tailed metrics need more users.

**Duration.** Divide the total sample by eligible daily traffic, then round up to whole weeks to cover weekday/weekend cycles. Don't stop early because it "looks significant".
`,
  maths: `
**In one breath.** Per arm, difference of means: $n = \\frac{(z_{1-\\alpha/2} + z_{1-\\beta})^2\\,2\\sigma^2}{\\delta^2}$; proportions: $n = \\frac{(z_{1-\\alpha/2} + z_{1-\\beta})^2\\,[p_1(1-p_1) + p_2(1-p_2)]}{\\delta^2}$; with $\\alpha = 0.05$, power 0.8: $(1.96 + 0.84)^2 = 7.85$, so $n \\approx 16\\sigma^2/\\delta^2$ (Lehr's rule).

**Worked example.** 10% → 11% ($\\delta = 0.01$): $n = 7.85 \\times (0.09 + 0.0979)/0.0001 = 14{,}748$ per arm, about 29,500 in total. At 20,000 eligible visitors a day: 1.5 days of traffic, so run for at least a full week.

**MDE from a fixed sample.** 10,000 per arm, baseline 20%: $\\text{MDE} \\approx 2.80\\sqrt{2 \\times 0.16/10{,}000} = 0.0158$ (1.6 points, a 7.9% relative lift).

**Power of an existing plan.** 5,000 per arm, 10% → 11%: SE $= 0.00615$; power $= \\Phi(0.01/0.00615 - 1.96) = \\Phi(-0.33) = 0.37$. More likely to miss than to find the effect.

| Change | Effect on $n$ |
|---|---|
| halve MDE | × 4 |
| power 80% → 90% | × 1.34 |
| $\\alpha$ 5% → 1% | × 1.49 |
| CUPED with $\\rho = 0.5$ | × 0.75 |
| unequal split 90/10 | total × 2.8 vs 50/50 |

**Winner's curse.** At low power, the estimates that cross significance are biased upwards; an underpowered "+8%" often replicates as +2%.
`,
  practice: `
**Tools.** Evan Miller's calculator for proportions; \`statsmodels.stats.power\` (\`NormalIndPower\`, \`TTestIndPower\`); or the formula above. Estimate $\\sigma$ from recent pre-period data for the same population and trigger.

**Plan.** Write down MDE, power, $\\alpha$, sample size and run length before launch. If the required run is impossibly long, change the metric (more sensitive), reduce variance (CUPED, capping), target a larger effect, or accept that the test can't answer the question.
`,
  traps: [
    { trap: "Set the MDE to the effect you expect.", why: "MDE should be the smallest effect worth acting on. Optimistic MDEs produce underpowered tests and inflated estimates." },
    { trap: "Run until significant, then stop.", why: "That's peeking: it inflates false positives far above α. Fix the sample in advance or use a sequential design." },
  ],
  say: {
    prompt: "Walk me through sizing an A/B test on conversion rate.",
    secs: 60,
    check: ["Inputs: baseline, MDE (business-driven), α, power", "Formula / ≈ 16σ²/δ² per arm", "n ∝ 1/MDE²", "Convert to duration with eligible traffic; whole weeks", "Levers if too long: variance reduction, better metric, bigger MDE; don't peek"],
    followups: [
      { q: "Users per arm for 10% → 11% at 5%/80%?", a: "About 14,700." },
      { q: "What does 80% power mean?", a: "If the true effect equals the MDE, the test will be significant 80% of the time." },
      { q: "Why run whole weeks?", a: "Behaviour varies by day of week; partial weeks over-weight some days." },
    ],
    answer: `I start from the baseline conversion, here 10%, and the minimum effect worth detecting, which comes from the business case, say one point. With 5% two-sided significance and 80% power the sample per arm is (1.96 + 0.84)² times the sum of the two binomial variances over the effect squared, which is about 14,700 per arm. Sample size scales with one over the effect squared, so halving the MDE quadruples it. Then I divide by eligible daily traffic and round up to whole weeks so weekday patterns are covered. If that's too long I'd look for a more sensitive metric, reduce variance with CUPED or capping, or accept we can only detect bigger effects, and I'd fix the run length up front rather than stopping when it looks significant.`,
    avoid: ["MDE = hoped-for effect", "Stopping at first significance"],
  },
  terms: [["MDE", "Smallest effect the test is designed to detect."], ["Power", "P(significant | true effect = MDE)."], ["Lehr's rule", "n ≈ 16σ²/δ² per arm at 5% / 80%."]],
  sources: [MS.millerSize, MS.kohavi, MS.scipy],
});
const PW = "from scipy import stats\nza=stats.norm.ppf(0.975);zb=stats.norm.ppf(0.8)\n";
Q({ id: "m-abp-1", d: 2, secs: 60, prompt: "Baseline 10%, target 11%, α = 0.05 two-sided, power 80%. Users per arm? (nearest whole number)", answer: 14748, tol: 2, explain: "7.85 × (0.09 + 0.0979)/0.01².", py: PW + "answer = round((za+zb)**2*(0.1*0.9+0.11*0.89)/0.01**2)", packages: SP });
Q({ id: "m-abp-2", d: 2, secs: 45, prompt: "10,000 users per arm, baseline 20%, α = 0.05 two-sided, power 80%. Absolute MDE? (4 decimals)", answer: 0.0158, tol: 0.0002, explain: "2.80 × √(2 × 0.16/10,000).", py: PW + "answer = float((za+zb)*(2*0.16/10000)**0.5)", packages: SP });
Q({ id: "m-abp-3", d: 2, secs: 60, prompt: "5,000 users per arm, true change 10% → 11%, α = 0.05 two-sided. Power? (2 decimals)", answer: 0.37, tol: 0.01, explain: "SE = 0.00615; Φ(1.63 − 1.96).", py: "from scipy import stats\nse=(0.1*0.9/5000+0.11*0.89/5000)**0.5\nanswer = float(stats.norm.cdf(0.01/se-stats.norm.ppf(0.975)))", packages: SP });
Q({ id: "m-abp-4", d: 1, secs: 30, prompt: "Lehr's rule: σ = 10, MDE = 1. Approximate users per arm (16σ²/δ²)?", answer: 1600, tol: 0.5, explain: "16 × 100/1.", py: "answer = 16*10**2/1**2" });
Q({ id: "m-abp-5", d: 1, secs: 30, prompt: "You halve the MDE. The required sample size is multiplied by:", answer: 4, tol: 0.01, explain: "n ∝ 1/δ².", py: PW + "n=lambda d:(za+zb)**2*2/d**2\nanswer = round(n(0.5)/n(1.0),6)", packages: SP });
C("m-abp-c1", "Sample size", "n per arm ≈ 7.85 × 2σ²/δ² (5%, 80%) ≈ 16σ²/δ².");
C("m-abp-c2", "Low power", "Misses effects and inflates the significant ones (winner's curse).");

L("m-ab-reading", AB, "Reading experiment results", "From the readout table to a decision: absolute and relative lift, intervals, practical significance, guardrails and segment slicing.", {
  kind: "concept", mins: 20, prereq: ["m-ab-power", "m-ci"],
  hook: "Treatment conversion 10.6% vs 10.0%, p = 0.002, but the revenue guardrail is −0.4% with p = 0.3. What do you recommend?",
  intuition: `
**The situation.** The test has run its planned course. Now you turn a table of numbers into a decision.

**A reading order.**

1. **Trust first.** Sample ratio, logging volumes, A/A history, the test ran the planned duration. If any fails, stop.
2. **Primary metric.** Absolute and relative lift, confidence interval, p-value. Is the interval above the smallest effect that matters, entirely, partly, or not at all?
3. **Guardrails.** Any significant harm beyond tolerance blocks or forces a trade-off discussion. A non-significant guardrail drop is not proof of no harm: look at its interval.
4. **Segments.** Platforms, new vs returning, countries: look for bugs (a broken Android build), not for a story. Treat segment "wins" as hypotheses because of multiple testing.
5. **Decide.** Ship, iterate, or kill; record the estimate and the uncertainty.

**Relative lift.** Usually reported as $(\\bar y_T - \\bar y_C)/\\bar y_C$; its interval needs the delta method or Fieller because the denominator is random too.
`,
  maths: `
**In one breath.** Absolute lift $\\Delta = \\bar y_T - \\bar y_C$, SE $= \\sqrt{s_T^2/n_T + s_C^2/n_C}$; relative lift $\\Delta/\\bar y_C$ with $\\text{SE}_{\\text{rel}} \\approx \\frac{1}{\\bar y_C}\\sqrt{\\frac{s_T^2}{n_T} + \\frac{\\bar y_T^2}{\\bar y_C^2}\\frac{s_C^2}{n_C}}$ (delta method).

**Worked example.** 50,000 per arm; control 10.0%, treatment 10.6%.

- $\\Delta = 0.006$; SE $= \\sqrt{(0.1 \\times 0.9 + 0.106 \\times 0.894)/50{,}000} = 0.00192$.
- $z = 0.006/0.00192 = 3.12$; 95% CI $0.006 \\pm 0.0038 = (0.22, 0.98)$ points.
- Relative lift 6.0%, delta-method SE 1.98%, so roughly $(2.1\\%, 9.9\\%)$.

**Decision grid** (interval for the lift vs the practical threshold $\\delta^*$):

| Interval | Reading |
|---|---|
| entirely above $\\delta^*$ | clear win |
| above 0, includes $\\delta^*$ | positive, size uncertain: ship if cheap, or extend |
| includes 0, narrow around it | likely no meaningful effect |
| includes 0, wide | inconclusive: underpowered |
| entirely below 0 | harm |

**Guardrail check.** Revenue −0.4% with a 95% interval of (−1.2%, +0.4%) cannot rule out a 1% loss; whether that blocks depends on the pre-set tolerance.

**Twyman's law.** Any figure that looks interesting or different is usually wrong. A +30% lift on a small UI tweak is first a bug hunt.
`,
  practice: `
**Write-up template.** Hypothesis; design (unit, split, dates, triggering); trust checks; primary metric with CI; guardrails with CIs; notable segments (flagged as exploratory); decision and expected impact with uncertainty.

**Long-term impact.** Short tests overestimate or underestimate lasting effects (novelty, learning). Holdbacks (keep 5% on the old version for months) measure the cumulative effect of many launches.
`,
  traps: [
    { trap: "A non-significant guardrail means no harm.", why: "It may be underpowered. Check whether the interval excludes the harm you care about." },
    { trap: "Ship to the segment where the effect was significant.", why: "Slicing many segments guarantees some false 'wins'. Confirm with a targeted follow-up test." },
  ],
  say: {
    prompt: "The primary metric is up 6% with a tight interval, but one guardrail is slightly down and not significant. Walk me through your recommendation.",
    secs: 60,
    check: ["Trust checks first (SRM, logging, duration)", "Primary: interval vs practical threshold", "Guardrail: look at its interval vs tolerance, not just p", "Segments for bugs, treat wins as hypotheses", "Decision with uncertainty; consider holdback / follow-up"],
    followups: [
      { q: "How would you compute the CI of a relative lift?", a: "Delta method (or Fieller / bootstrap), since both numerator and denominator are random." },
      { q: "What is Twyman's law?", a: "Any figure that looks interesting or unusual is probably wrong: check for bugs before celebrating." },
      { q: "What is a holdback?", a: "A small group kept on the old experience after launch to measure long-term cumulative impact." },
    ],
    answer: `First I'd confirm the test is trustworthy: no sample ratio mismatch, normal logging volumes, the planned duration completed. Then the primary metric: a 6% lift whose interval sits clearly above our practical threshold is a real win. For the guardrail, the p-value alone isn't enough; I'd look at its interval. If it rules out any drop larger than our pre-agreed tolerance, we ship. If it's wide enough to include a meaningful loss, I'd quantify the trade-off, or extend the test or run a follow-up focused on that guardrail. I'd scan segments for bugs, but treat any segment-specific win as a hypothesis. Finally I'd recommend a small holdback to check the effect persists.`,
    avoid: ["Ignoring trust checks", "Reading a non-significant guardrail as safe"],
  },
  terms: [["Absolute vs relative lift", "Δ vs Δ/control mean."], ["Twyman's law", "Surprising results are usually errors."], ["Holdback", "Long-running control group after launch."]],
  sources: [MS.kohavi, DIRTY, DELTA],
});
const RD = "import numpy as np\nn=50000;pc=0.10;pt=0.106\nse=np.sqrt(pc*(1-pc)/n+pt*(1-pt)/n);d=pt-pc\n";
Q({ id: "m-abr-1", d: 2, secs: 60, prompt: "50,000 users per arm; control 10.0%, treatment 10.6%. z statistic using each arm's own variance? (2 decimals)", answer: 3.12, tol: 0.02, explain: "0.006/0.00192.", py: RD + "answer = float(d/se)", packages: NP });
Q({ id: "m-abr-2", d: 2, secs: 45, prompt: "Same data. Half-width of the 95% CI for the absolute lift, in percentage points? (2 decimals)", answer: 0.38, tol: 0.01, explain: "1.96 × 0.192 points.", py: RD + "from scipy import stats\nanswer = float(stats.norm.ppf(0.975)*se*100)", packages: SP });
Q({ id: "m-abr-3", d: 3, secs: 90, prompt: "Same data. Delta-method SE of the relative lift (treatment/control − 1), in percent? (2 decimals)", answer: 1.98, tol: 0.02, explain: "(1/0.1) × √(0.0948/50,000 + 1.06² × 0.09/50,000) = 1.98%.", py: RD + "vt=pt*(1-pt)/n;vc=pc*(1-pc)/n\nanswer = float(np.sqrt(vt/pc**2+pt**2*vc/pc**4)*100)", packages: NP });
Q({ id: "m-abr-4", d: 2, secs: 45, prompt: "The lift's 95% CI is (−0.5%, +4.0%) and the smallest effect worth shipping is +1%. Best reading?", options: ["Clear win", "No effect", "Inconclusive: underpowered for the effect that matters", "Clear harm"], answer: 2, explain: "The interval includes both 0 and effects well above the threshold.", py: "lo,hi,thr=-0.5,4.0,1.0\nanswer = 0 if lo>thr else (3 if hi<0 else (2 if lo<0<hi and hi>thr else 1))" });
C("m-abr-c1", "Reading order", "Trust → primary CI vs threshold → guardrails' CIs → segments (bugs) → decide.");
C("m-abr-c2", "Twyman's law", "If it looks too good, look for the bug.");

L("m-ab-delta", AB, "Ratio metrics and the delta method", "Click-through per page view, revenue per session: when the metric's denominator isn't the randomisation unit, and how to get its variance right.", {
  kind: "concept", mins: 25, prereq: ["m-ab-units", "m-sampling-dist"],
  hook: "You randomise users and measure clicks per page view. Treating page views as independent Bernoulli trials gives an SE half the right size. Why, and what's the fix?",
  intuition: `
**The situation.** Many metrics are ratios of two sums: clicks / page views, revenue / sessions, errors / requests. When the denominator is not the randomisation unit, the observations inside one user are correlated, and the denominator itself is random.

**The idea.** Write the metric as a ratio of two per-user means, $R = \\bar X/\\bar Y$ (total clicks over users divided by total page views over users). The per-user pairs $(X_i, Y_i)$ *are* independent. The **delta method** uses a first-order Taylor expansion to turn the variances and covariance of $\\bar X$ and $\\bar Y$ into a variance for $R$.

Alternatives: bootstrap over users (slower, same answer at scale) or a regression of per-page-view outcomes with cluster-robust SEs by user (equivalent).

**Ratio vs average of ratios.** $\\sum X/\\sum Y$ (page-view weighted) and the mean of $X_i/Y_i$ (user weighted) answer different questions; heavy users dominate the first. Choose deliberately.
`,
  maths: `
**In one breath.** For $R = \\bar X/\\bar Y$ with per-user means $\\mu_X, \\mu_Y$:

$$\\text{Var}(R) \\approx \\frac{1}{n\\mu_Y^2}\\left(\\sigma_X^2 - 2R\\,\\sigma_{XY} + R^2\\sigma_Y^2\\right)$$

General delta method: $\\text{Var}(g(\\hat\\theta)) \\approx \\nabla g^\\top\\,\\Sigma\\,\\nabla g$; for $g(x, y) = x/y$, $\\nabla g = (1/\\mu_Y,\\; -\\mu_X/\\mu_Y^2)$.

**Worked example.** Per user: clicks mean 2, page views mean 10, $\\text{Var}(X) = 4$, $\\text{Var}(Y) = 25$, $\\text{Cov} = 6$, $n = 1{,}000$ users. $R = 0.2$.

$$\\text{Var}(R) \\approx \\frac{4 - 2(0.2)(6) + 0.04(25)}{1000 \\times 100} = \\frac{2.6}{100{,}000} = 2.6\\times10^{-5}, \\quad \\text{SE} = 0.0051$$

The naive binomial SE treating 10,000 page views as independent: $\\sqrt{0.2 \\times 0.8/10{,}000} = 0.0040$, about 22% too small here, and far worse when engagement is very uneven across users.

**Relative lift** is also a ratio: $\\bar y_T/\\bar y_C - 1$; independent arms give $\\text{Var} \\approx \\frac{\\text{Var}(\\bar y_T)}{\\mu_C^2} + \\frac{\\mu_T^2\\text{Var}(\\bar y_C)}{\\mu_C^4}$.

| Metric | Numerator / denominator per user | Needs delta method? |
|---|---|---|
| conversion per user | 0/1 per user | no |
| revenue per user | revenue / 1 | no |
| CTR (clicks / page views) | clicks / page views | yes |
| revenue per session | revenue / sessions | yes |
| relative lift | treatment mean / control mean | yes (or Fieller) |
`,
  practice: `
**Implementation.** Aggregate to one row per user with numerator and denominator sums; compute means, variances and covariance; plug into the formula. It's a few lines of SQL plus arithmetic, which is why experimentation platforms use it rather than bootstrapping billions of rows.

**Check.** Run A/A tests on the ratio metric: if roughly 5% are significant at 5%, the variance is right; if far more, something is underestimated.
`,
  traps: [
    { trap: "Treat page views as independent trials for a CTR test.", why: "The randomisation unit is the user; page views within a user are correlated, so the binomial SE is too small and false positives rise." },
    { trap: "Mean of per-user ratios and ratio of sums are the same metric.", why: "They weight users differently. Ratio of sums is dominated by heavy users; mean of ratios counts each user equally. Pick the one matching the question." },
  ],
  say: {
    prompt: "How do you compute the variance of a click-through-rate metric in a user-randomised experiment?",
    secs: 45,
    check: ["Page views are not independent: randomisation unit is the user", "Write CTR as ratio of per-user means X̄/Ȳ", "Delta method: (σx² − 2Rσxy + R²σy²)/(nμy²)", "Alternatives: bootstrap users, cluster-robust regression", "Validate with A/A tests; note ratio-of-sums vs mean-of-ratios"],
    followups: [
      { q: "What does the delta method approximate?", a: "The variance of a smooth function of estimates, via a first-order Taylor expansion: $\\nabla g^\\top\\Sigma\\nabla g$." },
      { q: "When is the approximation poor?", a: "Small samples or a denominator mean near zero, where the ratio is highly non-linear." },
      { q: "How do you get a CI for relative lift?", a: "Delta method on $\\bar y_T/\\bar y_C$, Fieller's theorem, or bootstrap." },
    ],
    answer: `The randomisation unit is the user, so page views from the same user are correlated and I can't treat them as independent Bernoulli trials; that underestimates the variance. Instead I aggregate per user, clicks X and page views Y, and write CTR as the ratio of their means. Those per-user pairs are independent, and the delta method gives the variance: σx² − 2Rσxy + R²σy², all over n times the mean page views squared. A user-level bootstrap or a page-view regression with standard errors clustered by user gives essentially the same answer. I'd validate on A/A tests: about 5% should come out significant at the 5% level.`,
    avoid: ["Binomial SE on page views", "Confusing ratio of sums with mean of ratios"],
  },
  terms: [["Delta method", "Var(g(θ̂)) ≈ ∇gᵀΣ∇g."], ["Ratio metric", "Sum of numerator / sum of denominator across units."], ["Fieller's theorem", "Exact-style interval for a ratio of normal means."]],
  sources: [DELTA, MS.kohavi],
});
Q({ id: "m-abd-1", d: 3, secs: 90, prompt: "Per user: mean clicks 2, mean page views 10, Var(X) = 4, Var(Y) = 25, Cov = 6, n = 1,000. Delta-method SE of CTR = X̄/Ȳ? (4 decimals)", answer: 0.0051, tol: 0.0002, explain: "√((4 − 2.4 + 1)/(1,000 × 100)) = √(2.6 × 10⁻⁵).", py: "import numpy as np\ng=np.array([1/10,-2/10**2]);S=np.array([[4,6],[6,25.]])\nanswer = float(np.sqrt(g@S@g/1000))", packages: NP });
Q({ id: "m-abd-2", d: 2, secs: 45, prompt: "Same setting. Naive binomial SE treating all 10,000 page views as independent with CTR 0.2? (4 decimals)", answer: 0.004, tol: 0.0002, explain: "√(0.2 × 0.8/10,000) = 0.0040: too small.", py: "answer = (0.2*0.8/10000)**0.5" });
Q({ id: "m-abd-3", d: 3, secs: 90, prompt: "Simulation: 4,000 users with very uneven page views (Poisson with a gamma-distributed rate, mean 10) and user-specific CTRs. Ratio of the delta-method SE to the naive page-view binomial SE? (1 decimal)", answer: 2.0, tol: 0.4, explain: "Uneven engagement and per-user CTRs make page views strongly clustered; the correct SE is about twice the naive one.", py: "import numpy as np\nrng=np.random.default_rng(0)\nn=4000\nlam=rng.gamma(0.5,20,n);y=rng.poisson(lam)+1\nctr=rng.beta(2,8,n);x=rng.binomial(y,ctr)\nR=x.sum()/y.sum();S=np.cov(x,y)\nvd=(S[0,0]-2*R*S[0,1]+R*R*S[1,1])/(n*y.mean()**2)\nnaive=R*(1-R)/y.sum()\nanswer = round(float(np.sqrt(vd/naive)),1)", packages: NP });
Q({ id: "m-abd-4", d: 2, secs: 45, prompt: "Which metric needs the delta method (or equivalent) in a user-randomised test?", options: ["Conversion per user", "Revenue per user", "Revenue per session", "Number of users who purchased"], answer: 2, explain: "Sessions are not the randomisation unit; the denominator is random and clustered by user.", py: "answer = 2" });
C("m-abd-c1", "Delta method for X̄/Ȳ", "(σx² − 2Rσxy + R²σy²)/(nμy²).");
C("m-abd-c2", "Ratio of sums vs mean of ratios", "Heavy-user weighted vs user weighted.");

L("m-ab-cuped", AB, "CUPED: variance reduction with pre-experiment data", "Using each user's pre-period metric as a control variate to shrink variance, why it's unbiased, and how much it saves.", {
  kind: "concept", mins: 20, prereq: ["m-ab-power", "m-joint"],
  hook: "A pre-period covariate correlates 0.7 with your metric. Roughly how much smaller can your experiment be?",
  intuition: `
**The situation.** Much of the variation in a user's metric during the test is just who they are: heavy users stay heavy. That variation has nothing to do with treatment, yet it inflates the noise in the comparison.

**The idea.** **CUPED** (Controlled-experiment Using Pre-Experiment Data) subtracts the part of each user's metric predictable from their pre-experiment behaviour:

$$Y^{cv} = Y - \\theta(X - \\bar X)$$

where $X$ is the same metric measured before the experiment and $\\theta$ is the regression slope of $Y$ on $X$. Because $X$ was measured before randomisation, it is independent of treatment, so the adjustment has mean zero in both arms: the estimated effect stays unbiased while variance drops by a factor $1 - \\rho^2$.

It is the experimental version of control variates, and equivalent to regression adjustment (ANCOVA) with the pre-period metric as a covariate.
`,
  maths: `
**In one breath.** $\\theta = \\text{Cov}(Y, X)/\\text{Var}(X)$ (pooled across arms); $\\text{Var}(Y^{cv}) = \\text{Var}(Y)(1 - \\rho^2)$; equivalent sample-size multiplier $1/(1 - \\rho^2)$; $\\Delta^{cv} = \\bar Y^{cv}_T - \\bar Y^{cv}_C$.

**Worked example.** $\\text{Cov}(Y, X) = 30$, $\\text{Var}(X) = 50$: $\\theta = 0.6$. A user with $Y = 120$, $X = 100$, when $\\bar X = 90$: $Y^{cv} = 120 - 0.6 \\times 10 = 114$.

**Savings.**

| $\\rho$ | variance kept $1 - \\rho^2$ | users needed vs no CUPED |
|---|---|---|
| 0.3 | 0.91 | 91% |
| 0.5 | 0.75 | 75% |
| 0.6 | 0.64 | 64% |
| 0.7 | 0.51 | 51% |
| 0.9 | 0.19 | 19% |

With $\\rho = 0.6$ the same users behave like $1/0.64 = 1.56$ times as many.

**Why unbiased.** $E[\\bar X_T - \\bar X_C] = 0$ by randomisation, so $E[\\Delta^{cv}] = E[\\Delta] - \\theta\\cdot 0$. Even a "wrong" $\\theta$ stays unbiased; only the variance reduction is lost.

**New users** have no pre-period data: set $X$ to 0 (or the mean) plus a "has history" indicator; they get no reduction but don't bias anything.
`,
  practice: `
**Choosing X.** The same metric over the 1–4 weeks before the experiment is usually best; any pre-treatment covariate works, and several can be combined by regression (CUPAC uses an ML prediction as the covariate). Never use anything measured after exposure: it may be affected by treatment and then biases the estimate.

**Gains in practice.** Engagement metrics with stable users (sessions, queries) often get 30–50% variance reduction; conversion for new visitors, very little.
`,
  traps: [
    { trap: "Use an in-experiment covariate, like sessions during the test, to reduce variance more.", why: "If treatment affects it, adjusting removes part of the effect and biases the estimate. Covariates must be pre-treatment." },
    { trap: "CUPED changes what you're estimating.", why: "The adjustment has zero mean in both arms, so the effect estimate targets the same difference in means, just with less noise." },
  ],
  say: {
    prompt: "Explain CUPED and why it doesn't bias the treatment effect.",
    secs: 45,
    check: ["Y_cv = Y − θ(X − X̄), X = pre-period metric", "θ = Cov(Y, X)/Var(X), the regression slope", "Variance × (1 − ρ²): sample size savings", "Unbiased because X is pre-treatment, balanced by randomisation", "Covariates must not be affected by treatment; new-user handling"],
    followups: [
      { q: "How much traffic do you save with ρ = 0.7?", a: "Variance falls to 51%, so you need about half the users." },
      { q: "How is CUPED related to regression?", a: "It's equivalent to ANCOVA: regress Y on treatment and the pre-period covariate." },
      { q: "What do you do for new users with no history?", a: "Use a placeholder value plus an indicator; they simply get no reduction." },
    ],
    answer: `CUPED uses each user's pre-experiment value of the metric, X, to explain away variation that has nothing to do with treatment. I compute θ as the slope of Y on X, Cov(Y, X) over Var(X), and analyse Y − θ(X − X̄) instead of Y. The variance shrinks by a factor 1 − ρ², so a correlation of 0.7 roughly halves the users needed. It doesn't bias the effect because X was measured before randomisation, so its mean is the same in both arms in expectation and the adjustment cancels out of the difference. The key rule is that the covariate must be pre-treatment; anything the treatment could affect would bias the result.`,
    avoid: ["Using in-experiment covariates", "Claiming it changes the estimand"],
  },
  terms: [["CUPED", "Pre-period control-variate adjustment."], ["Control variate", "Correlated zero-mean term subtracted to cut variance."], ["ANCOVA", "Regression of outcome on treatment plus covariates."]],
  sources: [MS.cuped, MS.kohavi],
});
Q({ id: "m-abc-1", d: 1, secs: 30, prompt: "Cov(Y, X) = 30, Var(X) = 50. CUPED θ?", answer: 0.6, tol: 0.002, explain: "30/50.", py: "answer = 30/50" });
Q({ id: "m-abc-2", d: 1, secs: 30, prompt: "θ = 0.6, mean pre-period value 90. User with Y = 120, X = 100. Adjusted value?", answer: 114, tol: 0.01, explain: "120 − 0.6 × (100 − 90).", py: "answer = 120-0.6*(100-90)" });
Q({ id: "m-abc-3", d: 2, secs: 45, prompt: "Correlation between metric and pre-period covariate is 0.7. Fraction of the original variance remaining after CUPED?", answer: 0.51, tol: 0.002, explain: "1 − 0.49.", py: "import numpy as np\nrng=np.random.default_rng(0)\nn=1_000_000\nx=rng.normal(size=n);y=0.7*x+np.sqrt(1-0.49)*rng.normal(size=n)\nth=np.cov(y,x)[0,1]/x.var(ddof=1)\nanswer = round(float((y-th*(x-x.mean())).var()/y.var()),2)", packages: NP });
Q({ id: "m-abc-4", d: 2, secs: 60, prompt: "Simulate an A/B test with true effect 1.0, ρ = 0.6 between Y and pre-period X, 5,000 users per arm, 400 repetitions. Ratio of SD of the CUPED estimate to SD of the plain difference? (2 decimals)", answer: 0.8, tol: 0.04, explain: "√(1 − 0.36) = 0.8; the mean of both estimators stays at 1.0.", py: "import numpy as np\nrng=np.random.default_rng(1)\nn=5000;a=[];b=[]\nfor _ in range(400):\n    x=rng.normal(size=2*n);t=np.r_[np.zeros(n),np.ones(n)]\n    y=0.6*x+0.8*rng.normal(size=2*n)+1.0*t\n    th=np.cov(y,x)[0,1]/x.var(ddof=1);yc=y-th*(x-x.mean())\n    a.append(y[t==1].mean()-y[t==0].mean());b.append(yc[t==1].mean()-yc[t==0].mean())\nanswer = round(float(np.std(b)/np.std(a)),2)", packages: NP });
Q({ id: "m-abc-5", d: 2, secs: 45, prompt: "Which covariate is safe to use for CUPED?", options: ["Sessions during the experiment", "Purchases in the 4 weeks before assignment", "Whether the user clicked the new button", "Time spent on the treated page"], answer: 1, explain: "Only pre-treatment covariates are unaffected by treatment.", py: "answer = 1" });
C("m-abc-c1", "CUPED variance", "× (1 − ρ²); ρ = 0.7 ⇒ about half the users.");
C("m-abc-c2", "CUPED rule", "Covariate must be measured before treatment.");
