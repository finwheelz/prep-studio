/**
 * v2 Maths for ML, part I: A/B testing (peeking, trust checks, time effects, interference, bandits) and the module interview.
 */
import { CHECKED, iq, lessonWriter } from "./v2-shared";
import { MS } from "./v2-m-src";

const { L, Q, C } = lessonWriter("maths");
const AB = "A/B testing";
const NP = ["numpy"];
const SP = ["numpy", "scipy"];
const src = (label: string, url: string) => ({ label, url, checked: CHECKED });
const JOHARI = src("Johari, Pekelis, Walsh (2015): Always Valid Inference: Bringing Sequential Analysis to A/B Testing", "https://arxiv.org/abs/1512.04922");
const SRM = src("Fabijan et al. (2019): Diagnosing Sample Ratio Mismatch in Online Controlled Experiments, KDD", "https://exp-platform.com/Documents/2019_KDDFabijanGupchupFuptaOmhoverVermeerDmitriev.pdf");
const RUSSO = src("Russo, Van Roy, Kazerouni, Osband, Wen (2017): A Tutorial on Thompson Sampling", "https://arxiv.org/abs/1707.02038");
const DIRTY = src("Dmitriev, Gupta, Kim, Vaz (2017): A Dirty Dozen: Twelve Common Metric Interpretation Pitfalls in Online Controlled Experiments, KDD", "https://exp-platform.com/Documents/2017-08%20KDDMetricInterpretationPitfalls.pdf");

const TWO_LOOKS = "import numpy as np\nfrom scipy.stats import multivariate_normal as mvn\nr=np.sqrt(0.5);Cv=[[1,r],[r,1]]\nF=lambda a,b:mvn.cdf([a,b],mean=[0,0],cov=Cv)\nwithin=lambda c:F(c,c)-F(-c,c)-F(c,-c)+F(-c,-c)\n";

L("m-ab-peeking", AB, "Peeking and sequential testing", "Why checking results daily and stopping at the first significant one inflates false positives, and the designs that make early stopping valid.", {
  kind: "concept", mins: 25, prereq: ["m-hypothesis", "m-ab-power"],
  hook: "The dashboard turned green on day 3 with p = 0.04. The test was planned for 14 days. Can you stop?",
  intuition: `
**The situation.** Experiment dashboards update continuously and people look. Stopping as soon as $p < 0.05$ feels efficient.

**Why it's wrong.** Under the null, the running z-statistic wanders like a random walk. A fixed-horizon test gives it one chance to cross 1.96; checking daily gives it many. The chance that it crosses *at some point* is much larger than 5%: about 8% with two looks, 19% with ten, and it approaches certainty with continuous monitoring.

**Options.**

1. **Fixed horizon**: decide the sample size, look only at the end (look earlier only for guardrail breakages and bugs).
2. **Group sequential** designs: a few planned interim looks with stricter boundaries. **Pocock** uses the same, higher boundary at each look; **O'Brien–Fleming** uses very strict early boundaries and nearly 1.96 at the end. **Alpha-spending** functions generalise these to flexible look times.
3. **Always-valid** inference (mSPRT, confidence sequences): p-values and intervals that stay valid however often you look, at the cost of some power.
4. **Bayesian** monitoring still needs a stopping rule chosen in advance; it doesn't make peeking free.
`,
  maths: `
**In one breath.** With $k$ looks at boundary $c$, $\\alpha_{\\text{actual}} = P(\\max_j |Z_j| > c)$, where $Z_j$ are correlated ($\\text{Corr}(Z_i, Z_j) = \\sqrt{n_i/n_j}$); Pocock: constant $c_k$ so that this equals $\\alpha$; O'Brien–Fleming: $c_j = c\\sqrt{k/j}$.

**Two looks, half-way and at the end.** $\\text{Corr}(Z_1, Z_2) = \\sqrt{1/2} = 0.707$. Using 1.96 at both: $\\alpha_{\\text{actual}} = 0.083$. Pocock's constant boundary for two looks is 2.178 ($p < 0.029$ at each look).

**Inflation with more looks** (nominal 1.96 at each equally spaced look):

| Looks | Actual false-positive rate |
|---|---|
| 1 | 0.05 |
| 2 | 0.083 |
| 5 | ≈ 0.14 |
| 10 | ≈ 0.19 |
| continuous | → 1 |

**O'Brien–Fleming (5 looks).** Boundaries about 4.56, 3.23, 2.63, 2.28, 2.04: almost impossible to stop early unless the effect is huge, and nearly the fixed-horizon test at the end.

**Cost.** Sequential designs need a somewhat larger maximum sample than a fixed test for the same power, but often stop earlier on large effects.
`,
  practice: `
**Policy.** Precommit to the sample size or a sequential plan; show running results only with sequential-valid intervals, or hide p-values until the end. Monitor guardrails (crashes, revenue collapse) continuously with their own conservative thresholds; stopping for harm is fine.

**Platforms.** Many commercial tools use always-valid (mSPRT-style) statistics so that the dashboard can be watched safely.
`,
  traps: [
    { trap: "Peeking is fine if you only stop when p is very small.", why: "Any stopping rule based on repeated looks at a fixed 0.05 threshold inflates errors; you need boundaries designed for the number and timing of looks." },
    { trap: "Bayesian A/B tests are immune to peeking.", why: "The posterior is valid at each time, but a rule like 'stop when P(B > A) > 95%' still produces more wrong launches under no effect than the 95% suggests." },
  ],
  say: {
    prompt: "A stakeholder wants to stop a test early because it's significant on day 3 of 14. What do you tell them?",
    secs: 45,
    check: ["Repeated looks inflate false positives (random walk crossing)", "Quantify: 2 looks ≈ 8%, 10 looks ≈ 19%", "Early estimates are also exaggerated; weekly cycles not covered", "Options: keep the plan; group sequential (Pocock / O'Brien–Fleming); always-valid tests", "Stopping for harm on guardrails is fine"],
    followups: [
      { q: "What does O'Brien–Fleming do differently from Pocock?", a: "Very strict early boundaries that relax over time, ending near 1.96; Pocock uses one constant boundary." },
      { q: "What is an always-valid p-value?", a: "A p-value process that controls type I error at any data-dependent stopping time, e.g. from mSPRT." },
      { q: "Is it OK to stop early for a guardrail breach?", a: "Yes: stopping for harm protects users; use a conservative boundary for it." },
    ],
    answer: `I'd explain that p = 0.04 on day 3 doesn't mean what it would at the end. If we check every day and stop the first time we cross 0.05, the chance of a false positive is far above 5%: about 8% with two looks and around 19% with ten, because noise gets many chances to cross the line. Early estimates are also inflated and haven't covered a full weekly cycle. So I'd keep to the plan. If the team needs to stop early in future, we should design for it: a group sequential plan with O'Brien–Fleming boundaries, or always-valid statistics that can be monitored continuously. Stopping early for clear harm on a guardrail is a different matter and is fine.`,
    avoid: ["Agreeing to stop on a nominal p-value", "Claiming Bayesian methods remove the issue"],
  },
  terms: [["Peeking", "Repeatedly testing and stopping at the first significant result."], ["Group sequential design", "Planned interim analyses with adjusted boundaries."], ["Always-valid inference", "Statistics valid at any stopping time."]],
  sources: [MS.millerPeek, JOHARI, MS.kohavi],
});
Q({ id: "m-abs-1", d: 3, secs: 90, prompt: "Two equally spaced looks, each tested at |z| > 1.96, no true effect. Actual false-positive rate? (3 decimals)", answer: 0.083, tol: 0.004, explain: "Correlation √½ between the looks; P(max |Z| > 1.96) = 0.083.", py: TWO_LOOKS + "answer = float(1-within(1.96))", packages: SP });
Q({ id: "m-abs-2", d: 3, secs: 90, prompt: "Pocock boundary (same |z| cut-off at both of two equally spaced looks) for overall α = 0.05? (2 decimals)", answer: 2.18, tol: 0.02, explain: "Solve P(max |Z| > c) = 0.05: c ≈ 2.178.", py: TWO_LOOKS + "from scipy.optimize import brentq\nanswer = float(brentq(lambda c:1-within(c)-0.05,1.9,2.6,xtol=1e-4))", packages: SP });
Q({ id: "m-abs-3", d: 2, secs: 60, prompt: "Simulation: 10 equally spaced looks, |z| > 1.96 at any look counts as significant, no true effect. Actual false-positive rate? (2 decimals)", answer: 0.19, tol: 0.02, explain: "Ten chances for a random walk to cross: about 19%.", py: "import numpy as np\nrng=np.random.default_rng(0)\nR=200000\ns=np.cumsum(rng.normal(size=(R,10)),axis=1)\nz=s/np.sqrt(np.arange(1,11))\nanswer = round(float(np.mean((np.abs(z)>1.96).any(1))),2)", packages: NP });
Q({ id: "m-abs-4", d: 2, secs: 45, prompt: "O'Brien–Fleming boundaries for 5 looks are c√(5/j). If the final boundary is 2.04, what is the first-look boundary? (2 decimals)", answer: 4.56, tol: 0.02, explain: "2.04 × √5 = 4.56.", py: "answer = 2.04*5**0.5" });
Q({ id: "m-abs-5", d: 2, secs: 45, prompt: "Which approach lets you watch results continuously and stop any time while controlling false positives?", options: ["Fixed-horizon t-test checked daily", "Bonferroni over an unknown number of looks", "Always-valid inference (e.g. mSPRT)", "Stopping when the Bayesian P(B > A) first exceeds 95%"], answer: 2, explain: "Always-valid p-values/confidence sequences are built for arbitrary stopping times.", py: "answer = 2" });
C("m-abs-c1", "Peeking inflation", "Two looks at 1.96 ≈ 8%; ten ≈ 19%.");
C("m-abs-c2", "Boundaries", "Pocock: constant (2.18 for 2 looks). O'Brien–Fleming: strict early, ≈ 1.96 late.");

L("m-ab-srm-aa", AB, "Sample ratio mismatch and A/A tests", "Trust checks that come before any metric: detecting broken splits, validating the pipeline with A/A tests, and what usually causes failures.", {
  kind: "concept", mins: 20, prereq: ["m-chi-square", "m-hypothesis"],
  hook: "Your 50/50 test has 50.6% of users in treatment out of 400,000. Tiny difference, or a reason to throw the result away?",
  intuition: `
**The situation.** Before reading any metric, check that the experiment is a fair comparison. Two standard checks:

**Sample ratio mismatch (SRM).** If the design is 50/50 but the observed split differs more than chance allows, some users were lost or added in one arm in a way that probably relates to the treatment. A chi-square goodness-of-fit test on arm counts detects it. With large samples, even 50.6/49.4 is decisive. Typical causes: treatment redirects or slower pages that lose users before logging; bot filtering triggered by the new behaviour; assignment that depends on something the treatment changes; data-pipeline joins dropping rows.

**A/A tests.** Split users into two groups that both get the *same* experience. Any "significant" difference is a false positive by definition. Running many A/A tests (or replaying historical data with random splits) checks that:

- about 5% of metrics are significant at 5%;
- p-values are uniform on [0, 1];
- variance formulas (delta method, clustering) are right.

Too many significant A/A results means the platform's standard errors are too small or assignment is broken.
`,
  maths: `
**In one breath.** SRM: $\\chi^2 = \\sum(O - E)^2/E$ on $k - 1$ df; alert at a strict threshold such as $p < 0.001$ (many tests are checked). A/A: number significant among $m$ independent metrics or tests $\\sim \\text{Binomial}(m, \\alpha)$; p-values $\\sim$ Uniform(0, 1).

**SRM example.** 400,000 users, 50/50 design, 202,400 vs 197,600: $\\chi^2 = 2 \\times 2400^2/200{,}000 = 57.6$, $p \\approx 3\\times10^{-14}$. A 0.6-point deviation is huge at this scale.

**Not SRM.** Three equal arms with 3,400, 3,300, 3,300 of 10,000: $\\chi^2 = 2$, $p = 0.37$.

**Unequal design.** 90/10 split, 100,000 users, observed 90,500 / 9,500: $\\chi^2 = 500^2/90{,}000 + 500^2/10{,}000 = 27.8$; SRM.

**A/A calibration.** 100 A/A tests at 5%: expect 5 significant. $P(\\ge 10) = 0.028$; seeing 15 would strongly suggest the variance is underestimated.

| Check | Healthy | Unhealthy suggests |
|---|---|---|
| SRM p-value | not tiny | lost/added users, biased arms |
| A/A false-positive rate | ≈ α | wrong SEs, correlated units, broken hashing |
| A/A p-value histogram | flat | variance errors, peeking |
| pre-period A/A on the same split | no difference | carry-over from earlier experiments |
`,
  practice: `
**When SRM fires.** Don't analyse metrics; segment the imbalance (by day, platform, browser, country, new vs returning) to locate the cause; check where in the funnel assignment is logged relative to the change; fix and rerun.

**Ongoing.** Run A/A tests when launching a new metric, a new platform or a pipeline change, and keep a background A/A to catch drift.
`,
  traps: [
    { trap: "An SRM of half a percent is too small to matter.", why: "With hundreds of thousands of users it's statistically decisive, and the lost users are rarely random: e.g. the slowest devices dropped from treatment." },
    { trap: "If an A/A test shows a significant difference, the randomisation is broken.", why: "One in twenty will be significant by chance. Judge the rate across many A/A tests or metrics, and the shape of the p-value distribution." },
  ],
  say: {
    prompt: "What is sample ratio mismatch, how do you detect it, and what would you do if you found one?",
    secs: 45,
    check: ["Observed split deviates from design beyond chance", "Chi-square goodness of fit on arm counts; strict threshold", "Results invalid: missing users likely treatment-related", "Common causes: redirects, latency, bot filtering, logging, triggers", "Diagnose by segment; fix and rerun; A/A tests for validation"],
    followups: [
      { q: "What should an A/A test show?", a: "About α of tests significant and uniformly distributed p-values." },
      { q: "Why use p < 0.001 for SRM alerts?", a: "Every experiment is checked, so a stricter threshold limits false alarms; real SRMs are usually extreme anyway." },
      { q: "Give a concrete SRM cause.", a: "The treatment adds a redirect; users on slow connections abandon before the logging fires, so treatment loses low-engagement users." },
    ],
    answer: `Sample ratio mismatch is when the share of users in each arm differs from the designed split by more than chance allows. I'd test it with a chi-square goodness-of-fit test on the arm counts, alerting at a strict level such as p < 0.001. If it fires I wouldn't trust any metric, because the missing or extra users are almost never random: a redirect or slower page in treatment loses users before logging, bot filtering behaves differently, or the trigger condition depends on the change. I'd break the imbalance down by day, platform and browser to find the source, fix it and rerun. Separately, regular A/A tests check that about 5% of null comparisons come out significant and the p-values look uniform.`,
    avoid: ["Ignoring a small but significant SRM", "Concluding from a single significant A/A"],
  },
  terms: [["SRM", "Sample ratio mismatch."], ["A/A test", "Both arms get the same experience; validates the pipeline."], ["Trust guardrail", "Check that the experiment itself is valid."]],
  sources: [SRM, MS.kohavi, MS.scipy],
});
Q({ id: "m-abaa-1", d: 2, secs: 45, prompt: "50/50 design, 400,000 users: 202,400 vs 197,600. SRM chi-square statistic?", answer: 57.6, tol: 0.02, explain: "2 × 2,400²/200,000.", py: "from scipy import stats\nanswer = float(stats.chisquare([202400,197600]).statistic)", packages: SP });
Q({ id: "m-abaa-2", d: 1, secs: 45, prompt: "Three equal arms, counts 3,400, 3,300, 3,300. SRM p-value? (3 decimals)", answer: 0.368, tol: 0.002, explain: "χ² = 2 on 2 df: p = e⁻¹.", py: "from scipy import stats\nanswer = float(stats.chisquare([3400,3300,3300]).pvalue)", packages: SP });
Q({ id: "m-abaa-3", d: 2, secs: 60, prompt: "90/10 design, 100,000 users, observed 90,500 and 9,500. Chi-square statistic? (2 decimals)", answer: 27.78, tol: 0.01, explain: "500²/90,000 + 500²/10,000.", py: "from scipy import stats\nanswer = float(stats.chisquare([90500,9500],f_exp=[90000,10000]).statistic)", packages: SP });
Q({ id: "m-abaa-4", d: 2, secs: 45, prompt: "100 independent A/A tests at α = 0.05. If the platform is correct, P(at least 10 come out significant)? (3 decimals)", answer: 0.028, tol: 0.002, explain: "Binomial(100, 0.05) upper tail from 10.", py: "from scipy import stats\nanswer = float(stats.binom.sf(9,100,0.05))", packages: SP });
Q({ id: "m-abaa-5", d: 2, secs: 45, prompt: "Across many A/A tests, the p-values cluster near 0. Most likely cause?", options: ["The platform is working correctly", "Standard errors are underestimated (e.g. correlated units treated as independent)", "Tests are underpowered", "The significance level is too strict"], answer: 1, explain: "Too-small SEs inflate |z|, piling p-values near zero.", py: "import numpy as np\nfrom scipy import stats\nrng=np.random.default_rng(0)\nz=rng.normal(size=20000)*1.5\np=2*stats.norm.sf(abs(z))\nanswer = 1 if np.mean(p<0.05)>0.1 else 0", packages: SP });
C("m-abaa-c1", "SRM response", "Don't read metrics; segment the imbalance; fix; rerun.");
C("m-abaa-c2", "Healthy A/A", "≈ α significant; flat p-value histogram.");

L("m-ab-novelty", AB, "Novelty, primacy and other time effects", "Why short-run lifts fade or grow, how to detect it, and designs that estimate the long-run effect.", {
  kind: "concept", mins: 20, prereq: ["m-ab-reading"],
  hook: "A redesigned home page shows +10% clicks in week 1, +4% in week 2 and +2% in week 3. What's the real effect?",
  intuition: `
**The situation.** Effects aren't always constant over a test.

- **Novelty effect**: existing users explore something new because it's new. Engagement jumps, then decays towards the lasting effect.
- **Primacy (change-aversion) effect**: existing users are used to the old version and initially do worse with the new one; the effect improves as they learn.
- **Learning and ecosystem effects**: users or sellers adapt over weeks (creators change what they post in response to a ranking change).
- **Day-of-week and seasonality**: weekday and weekend users differ; partial weeks bias results.

**Detecting them.**

1. Plot the treatment effect by **day since first exposure** (not calendar day).
2. Compare **new users** (no habit, so no novelty or primacy) with existing ones.
3. Run longer, or keep a **long-term holdout**.

If the effect is still trending at the end of the test, the average over the test period is not the long-run effect.
`,
  maths: `
**A simple model.** Lift on exposure day $t$: $L(t) = L_\\infty + (L_0 - L_\\infty)e^{-t/\\tau}$.

With $L_0 = 10\\%$, $L_\\infty = 2\\%$, $\\tau = 5$ days:

| Day | Lift |
|---|---|
| 0 | 10.0% |
| 5 | 4.9% |
| 10 | 3.1% |
| 20 | 2.1% |

The average lift over days 0–6 is 6.75%, more than three times the lasting 2%. A one-week test would overstate the effect badly.

**Fitting it.** Regress the daily lift on days since exposure; or estimate from the last week only; or compare new-user cohorts, whose lift approximates $L_\\infty$ if novelty is the main driver.

**Primacy** is the mirror image: $L_0 < L_\\infty$, e.g. a new navigation that starts at −3% and settles at +1%. Stopping early would kill a good change.

**Dilution.** If only 30% of users in treatment actually see the change (triggering), the overall lift is 0.3 × the lift among exposed. Analyse the triggered population to avoid diluting the effect.
`,
  practice: `
**Design.** Run at least one or two full weeks; for visible UI changes plan 3–4 weeks or a holdout. Report the effect by exposure-day cohort, and state whether the lift had stabilised.

**Long-term holdouts** (a small percentage kept on the old experience for months) measure the lasting effect of a feature or of a whole quarter's launches, at the cost of some users not getting improvements.
`,
  traps: [
    { trap: "Average the lift over the whole test and report it as the effect.", why: "If the lift is decaying or growing, the average depends on test length and doesn't estimate the long-run effect." },
    { trap: "Plot lift by calendar day to check for novelty.", why: "Users join the test on different days; plot by days since each user's first exposure, otherwise new and old users mix." },
  ],
  say: {
    prompt: "How would you tell whether an experiment's lift is a novelty effect?",
    secs: 45,
    check: ["Define novelty (decays) vs primacy (grows)", "Plot effect by days since first exposure", "Compare new vs existing users", "Run longer / holdout; check stabilisation", "Report long-run estimate, not the test average"],
    followups: [
      { q: "Why do new users help?", a: "They have no prior habit, so novelty and change aversion don't apply; their effect approximates the lasting one." },
      { q: "What is a long-term holdout?", a: "A small group kept on the old experience after launch to measure lasting impact." },
      { q: "What's primacy?", a: "Users initially perform worse on a changed experience because of habit; the effect improves over time." },
    ],
    answer: `Novelty shows up as a lift that's large at first exposure and decays as users get used to the change. I'd plot the treatment effect against days since each user's first exposure, not calendar date, and see whether it's still falling at the end. I'd also compare new users with existing ones: new users have no habit to break, so if their lift is much smaller than existing users' early lift, novelty is likely. If it's decaying, I'd extend the test or use a long-term holdout, and report the stabilised effect rather than the average over the test. The opposite pattern, starting low and improving, is primacy, and it argues against stopping early.`,
    avoid: ["Calendar-day plots", "Reporting the test average as the long-run effect"],
  },
  terms: [["Novelty effect", "Temporary lift from newness."], ["Primacy effect", "Temporary dip from change aversion."], ["Long-term holdout", "Old-experience group kept after launch."]],
  sources: [MS.kohavi, DIRTY],
});
const NOV = "import numpy as np\nL=lambda t:0.02+0.08*np.exp(-t/5)\n";
Q({ id: "m-abn-1", d: 1, secs: 45, prompt: "Lift model L(t) = 2% + 8% × e^(−t/5). Lift on exposure day 10, in percent? (2 decimals)", answer: 3.08, tol: 0.01, explain: "2 + 8e⁻² = 3.08%.", py: NOV + "answer = float(L(10)*100)", packages: NP });
Q({ id: "m-abn-2", d: 2, secs: 60, prompt: "Same model. Average lift over exposure days 0–6, in percent? (2 decimals)", answer: 6.75, tol: 0.01, explain: "Mean of L(0)…L(6): over three times the lasting 2%.", py: NOV + "answer = float(np.mean([L(t) for t in range(7)])*100)", packages: NP });
Q({ id: "m-abn-3", d: 2, secs: 45, prompt: "Only 30% of treatment users trigger the changed page, where the lift is 5%. Lift measured over all users (no lift for the rest), in percent?", answer: 1.5, tol: 0.01, explain: "0.3 × 5% = 1.5%: dilution.", py: "answer = 0.3*5" });
Q({ id: "m-abn-4", d: 2, secs: 45, prompt: "Existing users show +9% in week 1 falling to +2% by week 4; new users show a steady +2%. Most likely explanation?", options: ["Primacy effect", "Novelty effect", "Sample ratio mismatch", "Network interference"], answer: 1, explain: "Decaying lift among habituated users only.", py: "w=[9,6,3,2]\nanswer = 1 if all(a>=b for a,b in zip(w,w[1:])) else 0" });
C("m-abn-c1", "Novelty vs primacy", "Novelty decays; primacy (change aversion) recovers.");
C("m-abn-c2", "Check time effects", "Lift by days since first exposure; new vs existing users.");

L("m-ab-interference", AB, "Interference and network effects", "When treating one unit changes another's outcome: marketplaces, social networks, shared budgets, and the cluster and switchback designs that handle it.", {
  kind: "concept", mins: 25, prereq: ["m-ab-units"],
  hook: "A rider-side discount shows +4% bookings in a rider-randomised test. Launch it to everyone and bookings rise 1%. Where did the other 3% go?",
  intuition: `
**The situation.** Standard A/B analysis assumes **SUTVA** (stable unit treatment value): one unit's outcome depends only on its own treatment. Many products violate it.

- **Marketplaces**: treatment buyers book more and take supply from control buyers. Treatment looks better *and* control looks worse, so the difference overstates the global effect.
- **Social networks**: a treated user's new sharing feature affects their friends in control, shrinking the measured difference (or inflating it).
- **Shared budgets**: ads campaigns, inventory, driver pools.
- **Learning systems**: a ranking model trained on data from both arms leaks treatment behaviour into control.

**Designs.**

- **Cluster randomisation**: randomise groups with few cross-links (cities, graph clusters, seller categories). Fewer units, so less power.
- **Switchback**: alternate a whole market between versions over time windows; effects stay within a window (watch for carry-over between windows).
- **Two-sided / budget-split** designs: split supply or budget too, so each arm has its own market.
- **Ego-network** designs, and measuring spillover by varying the share of treated neighbours.
`,
  maths: `
**Marketplace bias, worked.** Fixed supply. Rider-randomised 50/50 test: treatment riders +3% bookings, control riders −1% (cannibalised). Measured lift $= 3 - (-1) = 4$ points. If launched to everyone the net change in bookings is roughly the average over the market, $(3 + (-1))/2 = 1$ point. The A/B estimate overstates the global effect fourfold.

**Cost of cluster randomisation.** 1,000 clusters × 50 users, intra-cluster correlation 0.02: DEFF $= 1 + 49 \\times 0.02 = 1.98$, effective sample $50{,}000/1.98 = 25{,}253$.

**Switchback units.** 14 days with 2-hour windows: $14 \\times 12 = 168$ randomised windows per city. Effective sample size is the number of windows (times cities), not riders.

| Interference | Bias direction | Design |
|---|---|---|
| competition for shared supply/budget | overstates benefit | cluster, switchback, budget-split |
| positive spillover to friends | understates benefit | graph-cluster randomisation |
| model trained on both arms | understates difference | separate training data per arm |
| carry-over between switchback windows | blurs | buffer periods, longer windows |

**SUTVA formally.** $Y_i(\\mathbf z) = Y_i(z_i)$: unit $i$'s potential outcome depends only on its own assignment.
`,
  practice: `
**Detecting it.** Compare a unit-randomised test with a cluster-randomised one (some platforms run both at once: randomise clusters to "unit-level" or "cluster-level" experiments and compare estimates). Check whether control's metrics move relative to the pre-period.

**Analysis.** Analyse at the cluster or window level, with cluster-robust SEs; with few clusters, use permutation tests across the cluster assignments.
`,
  traps: [
    { trap: "A larger user-randomised test fixes interference bias.", why: "Bias doesn't shrink with sample size; it comes from the design. Change the randomisation unit." },
    { trap: "Interference always makes results look better.", why: "Competition for supply overstates effects; positive spillovers to friends understate them. The direction depends on the mechanism." },
  ],
  say: {
    prompt: "You're testing a pricing change for riders in a ride-hailing marketplace. What could go wrong with a standard user-randomised A/B test, and how would you design it instead?",
    secs: 60,
    check: ["SUTVA violated: riders share drivers", "Treatment gains partly taken from control → overstated effect", "Switchback by city-time windows or city-level randomisation", "Analysis at window/city level; fewer units, less power; carry-over buffers", "Validate: compare designs, watch control vs pre-period"],
    followups: [
      { q: "What's a switchback experiment?", a: "Randomly alternate the whole market between treatment and control over time windows." },
      { q: "What's the main cost of cluster randomisation?", a: "Far fewer independent units, so wider intervals and longer tests." },
      { q: "How can social spillover bias results?", a: "Treated users influence their control friends, making control look more like treatment and shrinking the measured effect." },
    ],
    answer: `In a marketplace riders compete for the same drivers, so the no-interference assumption fails. If cheaper prices make treatment riders book more, they take drivers that control riders would have got, so treatment looks better and control looks worse, and the measured difference overstates what happens when everyone gets the change. I'd randomise at the market level instead: a switchback design that alternates each city between pricing schemes in randomised time windows, with buffers to limit carry-over, or randomise whole cities if there are enough. Analysis is at the window or city level with clustered standard errors, which means fewer units and less power, so I'd plan the duration accordingly and, if possible, compare with a rider-level test to measure the bias.`,
    avoid: ["Ignoring shared supply", "Analysing switchbacks at the rider level as if independent"],
  },
  terms: [["SUTVA", "A unit's outcome depends only on its own treatment."], ["Switchback", "Alternate a whole market between arms over time."], ["Cluster randomisation", "Randomise groups to contain spillovers."]],
  sources: [MS.kohavi, MS.mixtape],
});
Q({ id: "m-abi-1", d: 2, secs: 45, prompt: "Rider-randomised 50/50 test with fixed supply: treatment riders +3% bookings, control −1%. Measured lift (treatment − control), in points?", answer: 4, tol: 0.01, explain: "3 − (−1).", py: "answer = 3-(-1)" });
Q({ id: "m-abi-2", d: 2, secs: 45, prompt: "Same test. Approximate net change in total bookings across the market, in points?", answer: 1, tol: 0.01, explain: "Average over equal halves: (3 − 1)/2.", py: "answer = (3+(-1))/2" });
Q({ id: "m-abi-3", d: 2, secs: 45, prompt: "1,000 clusters × 50 users, intra-cluster correlation 0.02. Effective sample size? (nearest whole number)", answer: 25253, tol: 1, explain: "50,000/(1 + 49 × 0.02).", py: "answer = round(50000/(1+49*0.02))" });
Q({ id: "m-abi-4", d: 1, secs: 30, prompt: "A switchback runs 14 days with 2-hour windows in one city. How many randomised windows?", answer: 168, tol: 0.5, explain: "14 × 12.", py: "answer = 14*24//2" });
Q({ id: "m-abi-5", d: 2, secs: 45, prompt: "A sharing feature is tested with user-level randomisation; treated users' friends in control also share more. The measured effect is most likely:", options: ["Unbiased", "Overstated", "Understated", "Unaffected but noisier"], answer: 2, explain: "Positive spillover lifts control, shrinking the difference.", py: "t,c,spill=5.0,0.0,1.5\nanswer = 2 if (t-(c+spill))<t-c else 1" });
C("m-abi-c1", "SUTVA", "Yᵢ depends only on zᵢ; marketplaces and networks break it.");
C("m-abi-c2", "Interference designs", "Cluster, switchback, budget-split; analyse at that level.");

L("m-ab-bandits", AB, "Multi-armed bandits versus A/B tests", "Exploration versus exploitation, ε-greedy, UCB and Thompson sampling, regret, and when a bandit is the wrong tool.", {
  kind: "concept", mins: 25, prereq: ["m-ab-power", "m-bayes-freq"],
  hook: "Eight headline variants for a news story that matters for 24 hours. A/B test or bandit?",
  intuition: `
**The situation.** An A/B test splits traffic evenly for its whole run, so it keeps sending users to clearly worse variants. Sometimes that cost matters more than a clean estimate.

**The idea.** A **multi-armed bandit** shifts traffic towards arms that look better as evidence accumulates, balancing:

- **Exploitation**: send users to the current best.
- **Exploration**: keep trying others in case the estimate is wrong.

**Algorithms.**

- **ε-greedy**: with probability $\\varepsilon$ pick a random arm, otherwise the best so far. Simple; explores blindly forever.
- **UCB**: pick the arm with the highest optimistic estimate, mean + bonus that shrinks as the arm is tried more.
- **Thompson sampling**: keep a posterior per arm (beta for conversions), draw one sample from each, play the arm with the highest draw. Each arm is chosen with the probability that it is the best. Strong in practice.

**Regret** is the total reward lost compared with always playing the best arm. Good algorithms keep it growing only logarithmically with time.

**When to use which.** Bandits suit short-lived decisions (headlines, promotions), many arms, and ongoing optimisation where you care about reward during the test. A/B tests suit decisions that need an unbiased effect size, several metrics and guardrails, long-term outcomes, or a ship/no-ship call that will last.
`,
  maths: `
**In one breath.** ε-greedy: $P(\\text{best arm}) = 1 - \\varepsilon + \\varepsilon/K$; UCB1 index $\\hat\\mu_a + \\sqrt{2\\ln t/n_a}$; Thompson: $\\theta_a \\sim \\text{Beta}(1 + s_a, 1 + f_a)$, play $\\arg\\max\\theta_a$; regret $R_T = \\sum_t(\\mu^* - \\mu_{a_t})$.

**ε-greedy.** $\\varepsilon = 0.1$, 5 arms: best arm chosen with probability $0.9 + 0.02 = 0.92$ once it is identified.

**UCB bonus.** $t = 100$ rounds, arm tried 10 times: $\\sqrt{2\\ln 100/10} = 0.96$. Rarely tried arms get large bonuses and are revisited.

**Thompson.** A: 10 conversions in 100 (posterior Beta(11, 91)); B: 15 in 100 (Beta(16, 86)). B is played with probability $P(\\theta_B > \\theta_A) = 0.853$.

**Regret.** Best arm converts at 12%; playing a 10% arm for 1,000 users loses about 20 conversions.

| Need | A/B test | Bandit |
|---|---|---|
| unbiased effect estimate, CIs | yes | biased by adaptive allocation |
| guardrails, many metrics | yes | awkward (optimises one reward) |
| short horizon, many arms | wasteful | yes |
| non-stationary rewards | rerun | yes (with discounting) |
| long-term outcomes | yes (holdouts) | poor (needs fast feedback) |

**Contextual bandits** condition on user features (LinUCB, Thompson with a model), moving towards personalisation.
`,
  practice: `
**Pitfalls.** Delayed rewards (conversions arrive days later) confuse bandits; Simpson-style bias when traffic mix changes over time while allocation shifts; adaptive allocation makes naive post-hoc estimates biased (use inverse-propensity weighting). Log the allocation probabilities.

**Practical recipe.** For a headline test: Thompson sampling on click-through with beta priors, a floor on each arm's allocation (e.g. 5%) to keep exploring, and a fixed end time.
`,
  traps: [
    { trap: "Bandits are just faster A/B tests.", why: "They optimise cumulative reward, not inference; the resulting effect estimates are biased and the arms get unequal data. Use them when reward during the test matters more than a precise estimate." },
    { trap: "Use a bandit for a change whose value shows up in 30-day retention.", why: "Bandits need fast feedback to reallocate; with slow outcomes they allocate on noise or on proxies." },
  ],
  say: {
    prompt: "When would you use a multi-armed bandit instead of an A/B test? Explain Thompson sampling.",
    secs: 60,
    check: ["Explore–exploit trade-off; regret", "Bandit when short-lived, many arms, reward during test matters, fast feedback", "A/B when you need unbiased effect, guardrails, long-term metrics", "Thompson: sample from each arm's posterior, play the max", "Pitfalls: delayed rewards, non-stationarity, biased estimates"],
    followups: [
      { q: "What is regret?", a: "Cumulative reward lost relative to always playing the best arm." },
      { q: "How does UCB explore?", a: "It adds an uncertainty bonus $\\sqrt{2\\ln t/n_a}$ to each arm's mean; rarely tried arms look optimistic." },
      { q: "Why are bandit effect estimates biased?", a: "Allocation depends on past outcomes; arms that got lucky early receive more traffic and the sample means are not simple random samples." },
    ],
    answer: `I'd use a bandit when the reward collected during the experiment matters and the decision is short-lived or has many options, like choosing among headlines for a story that matters for a day, and when feedback is fast. I'd stick with an A/B test when I need an unbiased effect size with confidence intervals, guardrails across several metrics, or long-term outcomes, since adaptive allocation biases estimates and needs quick rewards. Thompson sampling keeps a posterior for each arm, a beta distribution for click-through, draws one sample from each, and shows the arm with the highest draw. That plays each arm with the probability it's the best, so it explores uncertain arms and exploits clear winners automatically.`,
    avoid: ["“Bandits are strictly better A/B tests”", "Using bandits for slow outcomes"],
  },
  terms: [["Regret", "Reward lost vs always playing the best arm."], ["UCB", "Mean + exploration bonus."], ["Thompson sampling", "Play the arm whose posterior draw is highest."]],
  sources: [RUSSO, MS.kohavi],
});
Q({ id: "m-abb-1", d: 1, secs: 30, prompt: "ε-greedy with ε = 0.1 over 5 arms. Probability of playing the (identified) best arm?", answer: 0.92, tol: 0.002, explain: "0.9 + 0.1/5.", py: "from fractions import Fraction as F\nanswer = float(1-F(1,10)+F(1,10)/5)" });
Q({ id: "m-abb-2", d: 2, secs: 45, prompt: "UCB1 at round t = 100 for an arm tried 10 times. Exploration bonus √(2 ln t / n)? (3 decimals)", answer: 0.96, tol: 0.002, explain: "√(2 × 4.605/10) = 0.960.", py: "import math\nanswer = math.sqrt(2*math.log(100)/10)" });
Q({ id: "m-abb-3", d: 3, secs: 90, prompt: "Thompson sampling, uniform priors. A: 10/100 conversions, B: 15/100. Probability B is played next? (3 decimals)", answer: 0.853, tol: 0.004, explain: "P(θ_B > θ_A) with Beta(16, 86) vs Beta(11, 91).", py: "from scipy import stats, integrate\nA=stats.beta(11,91);B=stats.beta(16,86)\nanswer = float(integrate.quad(lambda x:B.pdf(x)*A.cdf(x),0,1)[0])", packages: SP });
Q({ id: "m-abb-4", d: 1, secs: 30, prompt: "Best arm converts at 12%. You send 1,000 users to a 10% arm. Expected regret in conversions?", answer: 20, tol: 0.5, explain: "1,000 × 0.02.", py: "answer = round(1000*(0.12-0.10))" });
Q({ id: "m-abb-5", d: 2, secs: 45, prompt: "Which situation favours an A/B test over a bandit?", options: ["Choosing a headline for a 24-hour story", "Ten promotional banners for a weekend sale", "A checkout redesign judged on 30-day retention with revenue guardrails", "Continuously tuning which thumbnail to show"], answer: 2, explain: "Slow outcome, multiple guardrails and a lasting decision need unbiased inference.", py: "answer = 2" });
C("m-abb-c1", "Thompson sampling", "Draw from each arm's posterior; play the max.");
C("m-abb-c2", "Bandit vs A/B", "Bandit: reward during test, fast feedback. A/B: unbiased effect, guardrails, long-term.");

L("m-ab-practice", AB, "A/B testing practice", "Six interview questions covering design, power, analysis and pitfalls.", {
  kind: "interview", mins: 30, prereq: ["m-ab-units", "m-ab-power", "m-ab-cuped", "m-ab-peeking", "m-ab-srm-aa", "m-ab-interference"],
  hook: "Answer each out loud in about a minute, then open it and tick off what the interviewer listens for.",
}, [
  iq("Design an A/B test for a new checkout flow. Walk me through it end to end.", "Hypothesis and OEC (conversion per user) plus guardrails (revenue per user, latency, errors, refunds); user-level hashed randomisation, trigger at checkout entry; size for MDE with 80% power and whole weeks; pre-register; trust checks (SRM, A/A history); analyse with Welch/z and CIs, CUPED; check novelty by exposure day; decide against practical threshold; holdback.", ["Hypothesis, OEC, guardrails", "Unit and triggering", "Power / duration", "Trust checks and analysis plan", "Decision rule, time effects"]),
  iq("Your test shows +2% conversion with p = 0.03, but the test ran only four days. Would you ship?", "Not yet: check it ran the pre-planned sample (if stopped early it's peeking), only a partial week (day-of-week effects), possible novelty. Check SRM and guardrails. Either continue to the planned length or treat as inconclusive; with low power, the 2% is likely inflated.", ["Peeking / planned horizon", "Weekly cycles and novelty", "Trust checks / guardrails", "Winner's curse"]),
  iq("How would you reduce the variance of an experiment metric so you can run shorter tests?", "CUPED with pre-period metric (variance × (1 − ρ²)); cap/winsorise heavy tails; better triggering (analyse exposed users only); choose more sensitive metrics or proxies; stratified randomisation; paired designs where possible.", ["CUPED and formula", "Capping heavy tails", "Triggering", "Metric choice / stratification"]),
  iq("What is sample ratio mismatch and why does it invalidate a test?", "Observed arm proportions deviate from design beyond chance (chi-square test, strict threshold). It means users were lost or added non-randomly, often because of the treatment (redirects, crashes, bot filters), so the arms aren't comparable. Diagnose by segment; don't read metrics.", ["Definition and chi-square", "Non-random loss ⇒ biased comparison", "Example causes", "Response"]),
  iq("Clicks per page view went up but the analyst used page views as independent observations. What's wrong and how do you fix it?", "Randomisation unit is the user; page views within a user are correlated, so the binomial SE is too small and false positives rise. Use the delta method on per-user sums, a user-level bootstrap, or cluster-robust regression; validate with A/A tests.", ["Unit mismatch", "Underestimated variance", "Delta method / bootstrap / clustered SEs", "A/A validation"]),
  iq("How would you test a change to a two-sided marketplace's ranking algorithm?", "SUTVA fails: buyers compete for limited supply and sellers respond. Use cluster (geo/category) or switchback randomisation, or a two-sided/budget-split design; analyse at that level with fewer effective units; monitor both sides' metrics and long-term seller behaviour; compare with a user-level test to gauge bias.", ["Interference identified", "Cluster/switchback/budget split", "Analysis unit and power cost", "Both sides' metrics, long term"]),
]);
