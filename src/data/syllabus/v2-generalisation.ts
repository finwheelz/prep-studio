/**
 * v2 pilot: T4 Classical ML → "Generalisation". Four concept lessons, an interview lesson and a
 * module quiz in the v2 lesson anatomy (see docs/REBUILD-PLAN-v2.md). Fixed ids throughout.
 * Numeric and MCQ answers are recomputed in Pyodide by scripts/verify-items.mts.
 */
import type { InterviewQ, Lesson } from "@/lib/types";
import { Card_, Item, T } from "./build";

const MOD = "Generalisation";
const CHECKED = "2026-11-25";
const SRC = "Practice: original; answer recomputed in Python (Nov 2026)";
const iq = (q: string, answer: string, rubric: string[]): InterviewQ => ({ q, answer, rubric });

const S = {
  islr: { label: "James, Witten, Hastie, Tibshirani: An Introduction to Statistical Learning, §2.2 (bias–variance) and §5.1 (cross-validation)", url: "https://www.statlearning.com/", checked: CHECKED },
  sq: { label: "Video: Machine Learning Fundamentals: Bias and Variance (StatQuest)", url: "https://www.youtube.com/watch?v=EuBBz3bI-aA", checked: CHECKED },
  skl: { label: "scikit-learn user guide §3.5: validation curves and learning curves", url: "https://scikit-learn.org/stable/modules/learning_curve.html", checked: CHECKED },
  belkin: { label: "Belkin, Hsu, Ma, Mandal (2019): Reconciling modern machine learning practice and the bias-variance trade-off, PNAS", url: "https://arxiv.org/abs/1812.11118", checked: CHECKED },
};

export const GEN = { bv: "gen-bv", diag: "gen-diagnose", lc: "gen-learning-curves", cap: "gen-capacity", prac: "gen-practice", quiz: "gen-quiz" } as const;

function L(id: string, title: string, summary: string, lesson: Lesson, interview?: InterviewQ[]) {
  T(id, "cml", MOD, title, summary, "", { lesson, ...(interview ? { interview } : {}) });
}

// ───────────────────────── 1. Bias–variance decomposition ─────────────────────────

L(GEN.bv, "The bias–variance decomposition", "Why test error splits into three parts, and which two you control.", {
  kind: "concept",
  mins: 25,
  hook: "Your model's test error is 0.30. How much of that is the model being too simple, how much is it being too jumpy, and how much can no model remove?",
  intuition: `
**The situation.** You are forecasting next week's loan repayments for 20 branches from one feature. A colleague fits a straight line; you fit a degree-12 polynomial. Yours has the lower training error. On next month's data, his wins. The interviewer asks: why?

**The idea.** Imagine re-running your whole pipeline many times, each time on a fresh training sample from the same population. At any input $x$ you get a spread of predictions.

- **Bias** is how far the average of those predictions sits from the truth. A straight line fitted to a curve is wrong in the same direction every time: high bias.
- **Variance** is how much the predictions scatter around their own average. A degree-12 polynomial chases the noise in each particular sample, so each rerun gives a different wiggle: high variance.
- **Noise** is the part of $y$ that $x$ cannot explain. No model touches it.

A flexible model lowers bias and raises variance. Test error is the sum, so it is U-shaped in flexibility.

**Play.** Move the degree. Then turn on the 25 refits at degree 1 and at degree 12. At degree 1 the fits agree with each other and are all wrong. At degree 12 they are right on average and disagree wildly.
`,
  widget: "poly-fit",
  maths: `
**In one breath.** For squared error, with $y = f(x) + \\varepsilon$, $\\mathbb{E}[\\varepsilon] = 0$, $\\operatorname{Var}(\\varepsilon) = \\sigma^2$, and $\\hat f$ trained on a random sample $D$:

$$\\mathbb{E}_{D,\\varepsilon}\\big[(y - \\hat f(x))^2\\big] = \\underbrace{\\big(\\mathbb{E}_D[\\hat f(x)] - f(x)\\big)^2}_{\\text{bias}^2} + \\underbrace{\\mathbb{E}_D\\big[(\\hat f(x) - \\mathbb{E}_D[\\hat f(x)])^2\\big]}_{\\text{variance}} + \\underbrace{\\sigma^2}_{\\text{noise}}$$

**Derivation in four steps.** Write $\\bar f(x) = \\mathbb{E}_D[\\hat f(x)]$.

1. $y - \\hat f = (f - \\bar f) + (\\bar f - \\hat f) + \\varepsilon$.
2. Square and take expectations. The noise $\\varepsilon$ is independent of $D$ and has mean 0, so every cross term with $\\varepsilon$ vanishes.
3. $\\mathbb{E}_D[\\bar f - \\hat f] = 0$ by definition of $\\bar f$, so the cross term $2(f - \\bar f)\\,\\mathbb{E}_D[\\bar f - \\hat f]$ vanishes too ($f - \\bar f$ is a constant once $x$ is fixed).
4. What is left is $(f - \\bar f)^2 + \\mathbb{E}_D[(\\hat f - \\bar f)^2] + \\sigma^2$.

Averaging over $x$ gives the same split for overall test error.

**The same idea for a single estimate.** For an estimator $\\hat\\theta$ of $\\theta$: $\\text{MSE}(\\hat\\theta) = \\text{bias}^2 + \\text{variance}$. Shrinking the sample mean, $\\hat\\theta = c\\bar x$ with $0 < c < 1$, adds bias $(c - 1)\\mu$ but multiplies variance by $c^2$. The MSE is minimised at $c^* = \\mu^2 / (\\mu^2 + \\sigma^2/n)$, which is below 1 whenever the noise is non-zero. Ridge regression is this trade applied to every weight.

**Worked example.** At some $x_0$: true $f(x_0) = 2.0$; across retrainings the predictions average 2.3 with variance 0.16; noise variance is 0.25. Expected squared error $= 0.3^2 + 0.16 + 0.25 = 0.50$. Even a perfect model would score 0.25 here.

**Worked example (from the widget).** True curve $\\sin(2\\pi x)$ on $[0, 1]$, noise $\\sigma = 0.3$. The best constant is 0 with bias² $= \\mathbb{E}[\\sin^2] = 0.5$. The best straight line has slope $-6/\\pi$ and bias² $= 0.5 - 3/\\pi^2 \\approx 0.196$. A cubic gets bias² close to 0, and from there extra degrees only add variance.

| | Bias² | Variance |
|---|---|---|
| Comes from | wrong assumptions about the shape of $f$ | sensitivity to the particular sample |
| Shows up as | high training error | gap between training and validation error |
| Goes down with | more capacity, better features, less regularisation | more data, regularisation, averaging, simpler model |
| Does more data help? | no | yes |
`,
  practice: `
**Where this shows up.**

- **Choosing capacity:** polynomial degree, tree depth, number of neighbours $k$ (bigger $k$ = less variance, more bias), number of layers or epochs.
- **Regularisation** (ridge, lasso, weight decay, dropout, early stopping) deliberately buys a little bias to cut a lot of variance.
- **Bagging and random forests** average many high-variance trees. For $B$ models with variance $\\sigma^2$ and pairwise correlation $\\rho$, the average has variance $\\rho\\sigma^2 + (1 - \\rho)\\sigma^2/B$: averaging kills the second term, and random feature subsets shrink $\\rho$ to attack the first.
- **Boosting** starts from a high-bias weak learner and reduces bias step by step; too many rounds and variance creeps back.

**Defaults that work.** Pick capacity by cross-validation, not by training error. When in doubt between two models with similar CV error, take the simpler one.

**Where to go next.** Diagnosing which of the two you have from train and validation error is the next lesson. Ridge and lasso are covered in the regularisation lesson.
`,
  traps: [
    { trap: "A more complex model is always better if you have the compute.", why: "Only if variance stays small. In the widget, degree 12 has the lowest training error and a test error more than ten times the cubic's. Complexity has to be paid for with data or regularisation." },
    { trap: "Bias and variance always trade off one for one.", why: "Not always. Better features or a better-suited model family (for example, adding $\\sin$ features here) can cut both. More data cuts variance at no cost in bias. The trade-off is along one capacity knob, not a law of nature." },
    { trap: "The decomposition holds for any loss.", why: "The clean three-way split is for squared error. For 0–1 loss or log loss there are decompositions, but bias and variance interact and do not simply add." },
  ],
  say: {
    prompt: "Explain the bias–variance trade-off to an interviewer, with an example.",
    secs: 45,
    check: [
      "Expected test error = bias² + variance + irreducible noise (for squared error)",
      "Defined bias as error of the average model and variance as spread across training sets",
      "Gave a concrete simple-vs-flexible example (line vs high-degree polynomial, shallow vs deep tree)",
      "Said capacity is chosen by validation or cross-validation, not training error",
      "Named at least one way to cut variance without adding much bias (more data, bagging)",
    ],
    followups: [
      { q: "Which models are high-variance by default, and how do practitioners tame them?", a: "Deep decision trees, k-NN with small k, high-degree polynomials and large neural nets. Tamed by pruning or depth limits, larger k, regularisation, dropout, early stopping, bagging (random forests) and more data." },
      { q: "Does bagging reduce bias or variance? What about boosting?", a: "Bagging reduces variance: averaging $B$ models gives variance $\\rho\\sigma^2 + (1 - \\rho)\\sigma^2/B$, and bias stays roughly that of one model. Boosting mainly reduces bias by fitting residuals of a weak learner; it can overfit with too many rounds, which is why shrinkage and early stopping are used." },
      { q: "Why can a biased estimator be better than an unbiased one?", a: "Because MSE = bias² + variance. Shrinking an unbiased estimate towards zero, $c\\bar x$ with $c < 1$, adds bias $(c - 1)\\mu$ but scales variance by $c^2$; for $c$ near 1 the variance saving is first-order and the bias cost second-order, so MSE drops. James–Stein and ridge are examples." },
    ],
    answer: `Expected squared test error splits into three parts: bias², variance and irreducible noise. Bias is how far the average prediction, over many possible training sets, is from the truth; variance is how much the prediction moves when you change the training set; noise is what the inputs can't explain.

A straight line fitted to a curved relationship is wrong in the same way every time: high bias, low variance. A degree-12 polynomial on 20 points fits each sample's noise: low bias, high variance. Adding capacity moves error from bias to variance, so test error is U-shaped and I pick the capacity at the bottom using cross-validation. More data, bagging and regularisation are ways to cut variance without paying much bias.`,
    avoid: [
      "\u201cBias means the model is unfair\u201d (that's a different meaning of bias).",
      "\u201cLow training error means low bias, so the model is good\u201d (it says nothing about variance).",
      "\u201cJust use a bigger model\u201d without mentioning data or regularisation.",
    ],
  },
  terms: [
    ["Bias", "Difference between the average prediction over training sets and the true value."],
    ["Variance", "Expected squared spread of the prediction around its own average, across training sets."],
    ["Irreducible error", "Noise variance σ²: the error even the true function makes."],
    ["Capacity", "How flexible the model family is (degree, depth, parameters, 1/λ)."],
  ],
  sources: [S.islr, S.sq],
});

Item({ id: "g2-bv-1", d: 1, secs: 45, prompt: "At $x_0$ the true value is 2.0. Across retrainings on fresh samples, predictions average 2.3 with variance 0.16. Noise variance is 0.25. What is the expected squared error at $x_0$?", answer: 0.5, tol: 0.005,
  explain: "bias² + variance + noise = 0.3² + 0.16 + 0.25 = 0.09 + 0.16 + 0.25 = 0.50.", fast: "Square the bias first; the other two just add.", trap: "Using the bias (0.3) instead of bias² gives 0.71.", src: SRC,
  check: { py: "answer = (2.3-2.0)**2 + 0.16 + 0.25" } });
Item({ id: "g2-bv-2", d: 3, secs: 120, prompt: "You estimate a mean $\\mu = 1$ from $n = 10$ draws with variance $\\sigma^2 = 4$, using $\\hat\\theta = c\\,\\bar x$. Which $c$ minimises the MSE? (3 decimals)", answer: 0.714, tol: 0.004,
  explain: "MSE(c) = c²σ²/n + (c − 1)²μ² = 0.4c² + (c − 1)². Setting the derivative to 0: 0.8c + 2(c − 1) = 0 → c = 2/2.8 = 0.714. In general c* = μ²/(μ² + σ²/n).", fast: "c* = μ² / (μ² + σ²/n) = 1/1.4.", trap: "Answering c = 1 because the unbiased estimator 'must' be best.", src: SRC,
  check: { py: "from scipy.optimize import minimize_scalar\nr = minimize_scalar(lambda c: c*c*4/10 + (c-1)**2)\nanswer = r.x", packages: ["scipy"] } });
Item({ id: "g2-bv-3", d: 1, secs: 30, prompt: "Which change most directly reduces bias?", options: ["Collecting twice as much training data", "Increasing k in k-NN from 5 to 50", "Moving from a linear model to a gradient-boosted tree ensemble", "Adding dropout to a network"], answer: 2,
  explain: "A more flexible model family can represent the true shape, which lowers bias. More data lowers variance; larger k and dropout both add bias to cut variance.", src: SRC,
  check: { py: "answer = 2" } });
Item({ id: "g2-bv-4", d: 2, secs: 60, prompt: "k-NN regression averages the targets of the $k$ nearest training points. If those targets carry independent noise with variance 0.36, what variance does the noise contribute to a prediction when $k = 9$?", answer: 0.04, tol: 0.001,
  explain: "The prediction is a mean of k independent noisy values, so the noise part of its variance is σ²/k = 0.36/9 = 0.04. Bigger k cuts variance but averages over farther, less similar points, which adds bias.", src: SRC,
  check: { py: "answer = 0.36/9" } });
Item({ id: "g2-bv-5", d: 3, secs: 90, prompt: "A random forest averages $B = 50$ trees. Each tree's prediction has variance 1 and any two trees are correlated with $\\rho = 0.3$. What is the variance of the forest's prediction?", answer: 0.314, tol: 0.002,
  explain: "Var(average) = ρσ² + (1 − ρ)σ²/B = 0.3 + 0.7/50 = 0.314. Adding trees only shrinks the second term; to cut the first you must decorrelate the trees (random feature subsets).", trap: "σ²/B = 0.02 assumes independent trees.", src: SRC,
  check: { py: "import numpy as np\nB, r = 50, 0.3\nC = np.full((B, B), r); np.fill_diagonal(C, 1.0)\nw = np.full(B, 1/B)\nanswer = float(w @ C @ w)", packages: ["numpy"] } });
Card_("g2-bv-c1", "Bias–variance decomposition (squared error)", "E[(y − f̂)²] = (E f̂ − f)² + Var(f̂) + σ²", GEN.bv);
Card_("g2-bv-c2", "Variance of an average of B correlated models", "ρσ² + (1 − ρ)σ²/B. More models kill the second term; decorrelation attacks the first.", GEN.bv);
Card_("g2-bv-c3", "Optimal shrinkage of a mean", "c* = μ² / (μ² + σ²/n) < 1: a little bias buys a lower MSE.", GEN.bv);

// ───────────────────────── 2. Diagnosing under- and overfitting ─────────────────────────

L(GEN.diag, "Diagnosing underfitting and overfitting", "Read train, validation and baseline error to decide what to fix first.", {
  kind: "concept",
  mins: 20,
  prereq: [GEN.bv],
  hook: "Training error 8%, validation error 10%. Is this model overfitting?",
  intuition: `
**The situation.** A default classifier you built has 8% training error and 10% validation error. Your manager wants to collect more data. Is that the right next step?

**The idea.** You can't see bias and variance directly, but three numbers stand in for them:

- **Baseline error**: the best achievable error. Human-expert error, the error of the best known system, or an estimate of the noise. Call it the floor.
- **Avoidable bias** ≈ training error − baseline. How far the model is from the floor on data it has already seen.
- **Variance** ≈ validation error − training error. How much worse it does on data it hasn't seen.

Fix the bigger of the two first. If expert reviewers misclassify 2% of these cases, then 8 − 2 = 6 points are avoidable bias and 10 − 8 = 2 points are variance: more data will barely move it. If the floor were 7.5%, the same 8% / 10% would be a variance problem.

The word overfitting only makes sense relative to the floor. Without one you can't tell "8% is bad" from "8% is as good as it gets".
`,
  maths: `
**In one breath.** Validation error − baseline = (train − baseline) + (validation − train) = avoidable bias + variance. With a mismatch between training and production data, add a fourth split.

**Four-way split with a train-dev set.** Hold out part of the training distribution as a train-dev set, separate from the validation set drawn from the target distribution.

| Gap | Estimates | Typical fix |
|---|---|---|
| train − baseline | avoidable bias | bigger model, better features, train longer, less regularisation |
| train-dev − train | variance | more data, regularisation, augmentation, simpler model |
| validation − train-dev | data mismatch | collect or synthesise data like production, reweight, domain adaptation |
| test − validation | overfitting to the validation set | bigger validation set, fewer rounds of tuning on it |

**Worked example 1.** Baseline 2%, train 8%, validation 10% → avoidable bias 6, variance 2. Work on bias first.

**Worked example 2.** Baseline 1%, train 1%, train-dev 1.5%, validation 9% → bias 0, variance 0.5, mismatch 7.5. More of the same training data does nothing; you need data that looks like production.

**Worked example 3.** Baseline 1%, train 1.5%, train-dev 11%, validation 12% → variance (9.5 points). More data, regularisation or a simpler model.
`,
  practice: `
**Remedies, sorted by which problem they address.**

- **Cut avoidable bias:** more capacity (deeper trees, more layers, higher degree), better or interaction features, a model family that fits the structure (trees for thresholds, CNNs for images), lower regularisation, train longer or with a better optimiser.
- **Cut variance:** more data or augmentation, L2 / L1 / dropout / early stopping, fewer or selected features, bagging, smaller model, more aggressive pruning.
- **Both at once:** better features and fixing label noise.

**What to check before believing the numbers.**

- **Leakage** shows up as a validation error that is suspiciously close to training error, or better than the baseline. Check for features computed from the target, rows from the same customer on both sides, and time travel in time-series splits.
- **Validation set size.** On 500 rows, one error is 0.2 points; a 1-point gap is noise.
- **Distribution.** The validation set should look like production. Otherwise you are tuning for the wrong data.

**Where to go next.** Learning curves show how these gaps move with data size; they answer "will more data help?" directly.
`,
  traps: [
    { trap: "Validation error is higher than training error, so the model is overfitting.", why: "Validation error is almost always higher. What matters is the size of the gap compared with the distance from training error to the floor. 8% / 10% with a 2% floor is mainly a bias problem." },
    { trap: "Training error is 0%, so the model has no bias and the rest is variance.", why: "True for the training set, but a model that memorises can still be the wrong shape. And 0% training error with a noisy target is itself a red flag for memorisation or leakage." },
    { trap: "Add more data: it never hurts.", why: "It rarely hurts, but if avoidable bias dominates it won't help, and if the new data comes from the wrong distribution it can widen the data-mismatch gap. Diagnose first." },
  ],
  say: {
    prompt: "Your model has 3% training error and 12% validation error, and similar systems reach about 2%. Walk me through your next steps.",
    secs: 60,
    check: [
      "Named the floor (2%) and split the error: avoidable bias ≈ 1 point, variance ≈ 9 points",
      "Concluded variance dominates and proposed variance fixes (more data / augmentation, regularisation, simpler model, early stopping, bagging)",
      "Checked whether validation data matches the training distribution (train-dev set)",
      "Mentioned checking for leakage or a too-small validation set before acting",
      "Said they would use learning curves to confirm more data will help",
    ],
    followups: [
      { q: "How would you tell variance apart from a train/production mismatch?", a: "Carve a train-dev set out of the training distribution. If train-dev error is close to training error but validation (production-like) error is much higher, it's data mismatch, not variance." },
      { q: "What if you have no idea what the best achievable error is?", a: "Estimate it: human labellers on a sample, inter-annotator disagreement, the best published or internal system, or a very flexible model trained on lots of data. Without any estimate, compare train and validation trends instead of absolute levels." },
      { q: "Validation error is lower than training error. What's going on?", a: "Possible causes: dropout or augmentation are active during training but not at evaluation; the validation set is easier or tiny; training loss is averaged over an epoch while weights improved; or leakage. Check each before trusting the numbers." },
    ],
    answer: `I compare everything to the 2% floor. Training error is 3%, so avoidable bias is about 1 point; validation is 12%, so the train-to-validation gap is about 9 points. This is mainly a variance problem.

Before changing the model I'd check two things: that the validation set comes from the same distribution as training (I'd hold out a train-dev set to separate variance from data mismatch), and that the validation set is big enough for a 9-point gap to be real. Then I'd go after variance: more data or augmentation, stronger regularisation or early stopping, fewer features, or bagging. I'd plot a learning curve to confirm the gap closes with more data before paying for collection.`,
    avoid: [
      "Jumping to \u201cuse a bigger model\u201d (that targets bias, which is small here).",
      "Calling it overfitting without comparing to the achievable error.",
      "Tuning on the test set to check whether the fix worked.",
    ],
  },
  terms: [
    ["Baseline / Bayes error", "The lowest achievable error for the task; estimated by humans or the best known system."],
    ["Avoidable bias", "Training error minus the baseline error."],
    ["Train-dev set", "A held-out slice of the training distribution, used to separate variance from data mismatch."],
    ["Data mismatch", "Error from training data that doesn't look like the data the model will see in production."],
  ],
  sources: [S.islr, S.skl],
});

Item({ id: "g2-dg-1", d: 1, secs: 40, prompt: "Human reviewers make 2% errors on this task. Your model has 8% training error and 10% validation error. Which should you work on first?", options: ["Variance: get more data", "Avoidable bias: model capacity or features", "Data mismatch: collect production-like data", "Nothing: the gap is small"], answer: 1,
  explain: "Avoidable bias = 8 − 2 = 6 points; variance = 10 − 8 = 2 points. Bias is the bigger gap.", trap: "Seeing validation > train and calling it overfitting.", src: SRC,
  check: { py: "bias, var = 8-2, 10-8\nanswer = 1 if bias > var else 0" } });
Item({ id: "g2-dg-2", d: 2, secs: 50, prompt: "Baseline 1%, training 1%, train-dev 1.5%, validation 9%. Which gap is largest?", options: ["Avoidable bias", "Variance", "Data mismatch", "Overfitting to the validation set"], answer: 2,
  explain: "Bias = 0, variance = 1.5 − 1 = 0.5, mismatch = 9 − 1.5 = 7.5. The model generalises fine within the training distribution; production-like data is the problem.", src: SRC,
  check: { py: "g = [1-1, 1.5-1, 9-1.5]\nanswer = g.index(max(g))" } });
Item({ id: "g2-dg-3", d: 2, secs: 50, prompt: "Baseline 1%, training 1.5%, train-dev 11%, validation 12%. Which of these fixes targets the main problem?", options: ["Train a deeper network for longer", "Add L2 regularisation and data augmentation", "Synthesise production-like data", "Lower the regularisation strength"], answer: 1,
  explain: "Variance = 11 − 1.5 = 9.5 points dominates (bias 0.5, mismatch 1). Regularisation and augmentation cut variance; a deeper network or less regularisation would make it worse.", src: SRC,
  check: { py: "g = {'bias': 0.5, 'var': 11-1.5, 'mis': 12-11}\nanswer = 1 if max(g, key=g.get) == 'var' else -1" } });
Item({ id: "g2-dg-4", d: 2, secs: 60, prompt: "Your validation set has 400 examples and the error rate is about 10%. Roughly what is the standard error of the validation error, in percentage points? (1 decimal)", answer: 1.5, tol: 0.1,
  explain: "SE = √(p(1 − p)/n) = √(0.1 × 0.9 / 400) = 0.015 = 1.5 points. A 1-point difference between two models on this set is within noise.", fast: "√(0.09/400) = 0.3/20.", src: SRC,
  check: { py: "answer = 100*(0.1*0.9/400)**0.5" } });
Card_("g2-dg-c1", "Error split with a train-dev set", "bias = train − floor · variance = train-dev − train · mismatch = val − train-dev · val overfit = test − val", GEN.diag);
Card_("g2-dg-c2", "Validation error below training error", "Check dropout/augmentation on only in training, an easy or tiny validation set, epoch-averaged training loss, leakage.", GEN.diag);

// ───────────────────────── 3. Learning curves ─────────────────────────

L(GEN.lc, "Learning curves", "Plot error against training-set size to see whether more data will help.", {
  kind: "concept",
  mins: 15,
  prereq: [GEN.diag],
  hook: "Labelling 10,000 more examples costs ₹4 lakh. How do you know in advance whether it will help?",
  intuition: `
**The situation.** Your churn model is stuck at 30% error and the business asks whether to pay for more labelled data.

**The idea.** Train on growing subsets (say 10%, 20%, …, 100% of your data), and at each size record training error and validation error. That plot is a **learning curve**.

- With little data the model memorises: training error is low and validation error is high.
- As data grows, training error rises (harder to memorise) and validation error falls. They converge towards the model's best possible error.

Two shapes cover most cases:

- **High bias:** the curves meet quickly and flatten together, above the floor. The model has learnt all it can; more data is wasted money.
- **High variance:** a wide gap that is still closing at your current size. Extending the curves suggests more data will help.

**Play.** Compare the line, the cubic and degree 9. The line flattens at about 0.3 whatever the size. Degree 9 is a mess with little data and good with a lot.
`,
  widget: "learning-curve",
  maths: `
**In one breath.** Validation error as a function of $n$ often follows a power law, $e(n) \\approx e_\\infty + a\\,n^{-b}$, with $b$ roughly 0.3–0.7. Fit it on the points you have and solve for the $n$ that reaches your target.

**Why the curves move the way they do.**

- **Training error rises with $n$:** a fixed-capacity model can fit a few points exactly but not many.
- **Validation error falls with $n$:** variance shrinks, roughly like $1/n$ for many estimators.
- Both approach $e_\\infty$ = bias² + noise for that model family. The gap between them is mostly variance.

**Worked example.** Validation error follows $e(n) = 0.08 + 1.2/\\sqrt n$. Today $n = 900$ gives $e = 0.12$. To reach $e = 0.10$ you need $1.2/\\sqrt n = 0.02$, so $n = 3600$: four times the data for two points. To reach 0.085 you'd need $n = 57{,}600$.

**Building one.**

\`\`\`
from sklearn.model_selection import learning_curve
sizes, tr, va = learning_curve(model, X, y, cv=5,
    train_sizes=[0.1, 0.25, 0.5, 0.75, 1.0], scoring="neg_log_loss")
\`\`\`

Use cross-validation at each size, so the noise in each point is smaller, and a log x-axis.
`,
  practice: `
**How to read a curve in an interview.**

| Shape | Diagnosis | Next step |
|---|---|---|
| Both high, close together, flat | high bias | more capacity or features; more data won't help |
| Train low, validation high, gap closing | high variance | more data will help; meanwhile regularise |
| Train low, validation high, gap flat | variance the data can't fix, or mismatch | regularise, simplify, check the validation distribution |
| Both near the floor | done | ship, or move to a harder metric |

**Practical notes.**

- Plot the metric you care about (log loss, recall at fixed precision), not just accuracy.
- Keep the validation set fixed across sizes; only the training subset changes.
- For time series, grow the training window forward in time and validate on a later period.
- Learning curves over epochs are a different plot: they show over-training and are used for early stopping.

**Where to go next.** Validation curves vary capacity instead of data; the next lesson covers them and where the U-shape breaks down.
`,
  traps: [
    { trap: "The curves are still apart, so more data will close the gap.", why: "Only if the gap is still narrowing at your current size. A flat gap points to something more data can't fix: mismatch between train and validation data, leakage in one direction, or label noise in one set." },
    { trap: "The curves have met, so the model is good.", why: "Meeting means variance is small. If they meet at 30% and the floor is 5%, the model is underfitting badly. Always draw the floor on the plot." },
    { trap: "Plot error against epochs and call it a learning curve.", why: "That's a training curve. It tells you when to stop training, not whether more data would help." },
  ],
  say: {
    prompt: "How would you decide whether it's worth collecting more training data?",
    secs: 45,
    check: [
      "Plot a learning curve: train and validation error against training-set size",
      "Read high bias (curves converge high) vs high variance (gap still closing)",
      "Compare to a baseline or achievable error",
      "Extrapolate (power-law fit) to estimate how much data reaches the target",
      "Mentioned cost: compare the gain to the cost of labelling",
    ],
    followups: [
      { q: "Your curves converge at 25% and the floor is 5%. The PM still wants more data. What do you say?", a: "More data of the same kind won't move it: the model has run out of capacity, not data. Spend the budget on features or a more flexible model, then re-plot. If they still want data, ask for richer data (new fields), not more rows." },
      { q: "How would you build a learning curve for a time-series model?", a: "Fix a validation period at the end, then train on growing windows of history that end before it (or use expanding-window CV). Never shuffle; random subsets leak the future." },
      { q: "Why use a log scale for training size?", a: "Gains come per multiple of data (doubling), not per extra row, and the interesting change happens at small n. A log axis shows the shape and makes the power-law extrapolation close to a straight line." },
    ],
    answer: `I'd plot a learning curve: train on 10%, 25%, 50%, 75% and 100% of the current data with cross-validation, and plot training and validation error against size on a log axis, with the achievable error marked.

If both curves have flattened and met well above the floor, the model is bias-limited and more data is wasted; I'd invest in features or capacity instead. If there's a wide gap that's still narrowing, the model is variance-limited and more data will help. I can fit something like error = e∞ + a·n^(−b) to estimate how much data reaches the target, and compare that gain with the labelling cost before asking for budget.`,
    avoid: [
      "\u201cMore data always helps\u201d without a diagnosis.",
      "Plotting error against epochs and calling it a learning curve.",
      "Shuffling time-series data to build the subsets.",
    ],
  },
  terms: [
    ["Learning curve", "Training and validation error plotted against training-set size."],
    ["Plateau", "Where the validation curve stops improving with more data."],
    ["Power-law fit", "e(n) ≈ e∞ + a·n^(−b), used to extrapolate the curve."],
  ],
  sources: [S.skl, S.islr],
});

Item({ id: "g2-lc-1", d: 2, secs: 75, prompt: "Validation error follows $e(n) = 0.08 + 1.2/\\sqrt{n}$. How many training examples are needed to reach $e = 0.10$?", answer: 3600, tol: 1,
  explain: "1.2/√n = 0.02 → √n = 60 → n = 3600.", src: SRC,
  check: { py: "answer = (1.2/0.02)**2" } });
Item({ id: "g2-lc-2", d: 1, secs: 40, prompt: "Training and validation log loss both flatten at about 0.55 and are within 0.01 of each other at every size from 5k to 50k rows. The best published model gets 0.30. What should you do?", options: ["Collect more data", "Add regularisation", "Increase capacity or add features", "Lower the learning rate"], answer: 2,
  explain: "Converged curves well above the floor mean high bias. More data or more regularisation won't help.", src: SRC,
  check: { py: "gap, above_floor = 0.01, 0.55 - 0.30\nanswer = 2 if gap < 0.05 and above_floor > 0.1 else 0" } });
Item({ id: "g2-lc-3", d: 3, secs: 120, prompt: "You measured validation error 0.20 at $n = 1000$ and 0.15 at $n = 4000$, and assume $e(n) = 0.10 + a\\,n^{-b}$. Estimate $b$ (2 decimals).", answer: 0.5, tol: 0.01,
  explain: "a·1000^(−b) = 0.10 and a·4000^(−b) = 0.05. Dividing: 4^b = 2, so b = 0.5.", src: SRC,
  check: { py: "import math\nanswer = math.log((0.20-0.10)/(0.15-0.10))/math.log(4000/1000)" } });
Item({ id: "g2-lc-4", d: 2, secs: 45, prompt: "At 20k rows: training error 2%, validation error 14%. At 40k: 3% and 13.5%. At 80k: 3% and 13.4%. The floor is about 3%. Most likely?", options: ["High bias", "Variance that more data will fix", "Data mismatch or leakage between train and validation", "The model is finished"], answer: 2,
  explain: "Training error is at the floor and the gap (~10 points) has stopped closing as data doubles. That's not ordinary variance; check whether the validation data comes from a different distribution, or leakage inflating training performance.", src: SRC,
  check: { py: "gaps = [14-2, 13.5-3, 13.4-3]\nclosing = gaps[0]-gaps[-1] > 3\nanswer = 1 if closing else 2" } });
Card_("g2-lc-c1", "Learning curve: high bias", "Train and validation meet early and flatten above the floor. More data won't help.", GEN.lc);
Card_("g2-lc-c2", "Learning curve: high variance", "Big gap that keeps closing as n grows. More data helps.", GEN.lc);

// ───────────────────────── 4. Capacity, validation curves, double descent ─────────────────────────

L(GEN.cap, "Validation curves, capacity and double descent", "Choosing model complexity with cross-validation, and why huge models break the U-shape.", {
  kind: "concept",
  mins: 20,
  prereq: [GEN.bv, GEN.lc],
  hook: "If test error is U-shaped in model size, why do models with billions of parameters generalise?",
  intuition: `
**The situation.** You're tuning a decision tree. Depth 3 is too simple, depth 30 memorises the data. You need a defensible way to pick the depth, and the interviewer will then ask about neural networks that have far more parameters than data points.

**The idea.** A **validation curve** varies one capacity knob and plots cross-validated training and validation error. Training error falls steadily; validation error falls, bottoms out, then rises. Choose the knob near the bottom, preferring the simpler side when the difference is within noise.

Every model has knobs that play this role:

| Model | More capacity means |
|---|---|
| Polynomial / linear with features | higher degree, more features |
| Ridge, lasso | smaller λ |
| Decision tree | deeper, smaller min_samples_leaf |
| k-NN | **smaller** k |
| Gradient boosting | more rounds, deeper trees, higher learning rate |
| Neural network | more width or depth, more epochs, less weight decay or dropout |

**Where the U breaks.** Push capacity past the point where the model can fit the training data exactly (the **interpolation threshold**) and, for many model families, test error peaks and then falls again. This is **double descent**. Among the many models that fit the training data perfectly, training procedures like gradient descent tend to find smooth, small-norm ones, and that hidden preference acts as regularisation.
`,
  widget: "poly-fit",
  maths: `
**In one breath.** Pick capacity by minimising $k$-fold CV error; apply the one-standard-error rule to prefer simpler models; past the interpolation threshold, implicit regularisation can make bigger better again.

**Cross-validated validation curve.** For each knob value $\\lambda$: split into $k$ folds, train on $k - 1$, score on the held-out fold, and average: $\\text{CV}(\\lambda) = \\frac1k\\sum_j e_j(\\lambda)$. The standard error is $\\text{SE}(\\lambda) = \\text{sd}(e_1, \\dots, e_k)/\\sqrt k$.

**One-standard-error rule.** Find $\\lambda^*$ with the lowest CV error. Choose the simplest model whose CV error is at most $\\text{CV}(\\lambda^*) + \\text{SE}(\\lambda^*)$. Differences smaller than one SE are not evidence.

**Worked example.**

| Depth | 2 | 3 | 4 | 5 | 6 | 8 |
|---|---|---|---|---|---|---|
| CV error | 0.210 | 0.172 | 0.158 | 0.151 | 0.149 | 0.156 |
| SE | 0.006 | 0.005 | 0.005 | 0.004 | 0.004 | 0.005 |

The minimum is depth 6 (0.149, SE 0.004), so the threshold is 0.153. The simplest depth at or below it is 5 (0.151).

**Interpolation threshold.** A model with $p$ free parameters can generally fit $n$ points exactly once $p \\ge n$. A polynomial of degree $d$ has $p = d + 1$, so 20 points with distinct $x$ are interpolated from degree 19. Near $p \\approx n$ there is exactly one interpolating solution and it is very wiggly: variance peaks. For $p > n$, minimum-norm least squares (what gradient descent from zero converges to) picks the smoothest interpolant, and test error can fall again. You can see the same effect in data size in the learning-curve widget: degree 9 (10 parameters) is worst around $n = 8$–$16$.
`,
  practice: `
**Practical rules.**

- Tune with \`GridSearchCV\` / \`RandomizedSearchCV\` or \`validation_curve\`, inside a \`Pipeline\` so preprocessing is refit in every fold.
- Use a log grid for scale parameters ($\\lambda$, learning rate, C), and a linear grid for counts (depth, k).
- Tune several knobs together; they interact (boosting rounds and learning rate especially).
- Keep a final test set that no tuning ever touches. Repeated tuning on one validation set overfits to it.
- Early stopping is a validation curve over epochs, read off automatically.

**What double descent changes in practice.**

- For classical models on tabular data the U-shape and CV-based tuning remain the right tools.
- For large neural networks "make it bigger and regularise lightly" often works, but at the threshold (parameters ≈ data points, or epochs at the point of first fitting the data) test error can spike. Moving away in either direction, or adding a little regularisation, fixes it.
- It doesn't overturn the bias–variance decomposition: the decomposition still holds; what changes is how variance behaves as capacity grows.
`,
  traps: [
    { trap: "Pick the hyperparameter with the lowest CV error.", why: "With noisy CV estimates the winner is partly luck. The one-SE rule picks the simplest model that's statistically tied with the best, which tends to generalise better and is cheaper." },
    { trap: "Double descent shows the bias–variance trade-off is wrong.", why: "The decomposition is an identity and still holds. Double descent says variance doesn't keep growing with parameter count once implicit regularisation (minimum-norm solutions, SGD) kicks in." },
    { trap: "Larger k in k-NN means a more complex model.", why: "The opposite. k = 1 memorises the training set (highest variance); k = n predicts the global mean (highest bias)." },
  ],
  say: {
    prompt: "How do you choose model complexity, and how do you square that with very large neural networks generalising well?",
    secs: 60,
    check: [
      "Validation curve via cross-validation over a capacity knob",
      "Pick near the minimum, prefer simpler (one-SE rule), keep a clean test set",
      "Named capacity knobs for at least two model families (and k-NN's direction)",
      "Explained the interpolation threshold and double descent",
      "Gave the implicit-regularisation explanation (minimum-norm / SGD bias) without claiming bias–variance is wrong",
    ],
    followups: [
      { q: "What is the one-standard-error rule and why use it?", a: "Choose the simplest model whose CV error is within one standard error of the best. CV estimates are noisy, so ties within one SE are not real differences, and the simpler model is cheaper and usually more robust." },
      { q: "Where exactly does the test-error peak in double descent happen?", a: "Near the interpolation threshold, where the number of effective parameters is about the number of training points, so there's just one way to fit the data exactly and it's highly sensitive to noise. It can also appear over epochs and over dataset size." },
      { q: "Why can't you tune on the test set if you only do it a few times?", a: "Every choice made by looking at test error leaks information about it, so the final number is optimistically biased. With small test sets even a handful of comparisons can pick a lucky configuration. Use CV or a validation set for choices and look at test once." },
    ],
    answer: `I choose complexity with a validation curve: vary one capacity knob, such as tree depth, λ or the number of boosting rounds, compute cross-validated error at each value, and pick near the minimum. I prefer the simplest model within one standard error of the best, because CV estimates are noisy, and I keep a test set untouched by tuning.

Large networks look like a contradiction because the classical U suggests they should overfit. What happens is double descent: test error peaks near the interpolation threshold, where the model can just fit the training data, and falls again beyond it, because among the many perfect fits, gradient descent finds smooth, low-norm ones. The bias–variance decomposition still holds; the variance just stops growing with parameter count. On tabular problems, CV tuning on the U-shape is still how I work.`,
    avoid: [
      "\u201cDeep learning doesn't overfit\u201d (it does near the threshold and with too little data).",
      "\u201cBias–variance is outdated.\u201d",
      "Choosing hyperparameters by looking at test-set performance.",
    ],
  },
  terms: [
    ["Validation curve", "Cross-validated train and validation error plotted against one hyperparameter."],
    ["One-SE rule", "Pick the simplest model whose CV error is within one standard error of the best."],
    ["Interpolation threshold", "Capacity at which the model can fit every training point exactly."],
    ["Double descent", "Test error falls, peaks near the interpolation threshold, then falls again as capacity grows."],
    ["Implicit regularisation", "The bias of the training algorithm (e.g. SGD towards minimum-norm solutions) that acts like an explicit penalty."],
  ],
  sources: [S.skl, S.islr, S.belkin],
});

Item({ id: "g2-cap-1", d: 2, secs: 60, prompt: "CV errors (SE) for tree depth 2, 3, 4, 5, 6, 8: 0.210 (0.006), 0.172 (0.005), 0.158 (0.005), 0.151 (0.004), 0.149 (0.004), 0.156 (0.005). Which depth does the one-standard-error rule choose?", options: ["3", "4", "5", "6"], answer: 2,
  explain: "Best is depth 6 at 0.149 with SE 0.004, so the threshold is 0.153. The simplest depth at or below it is 5 (0.151); depth 4 at 0.158 is above it.", trap: "Picking 6 (raw minimum) or 4 (adding SE to the wrong row).", src: SRC,
  check: { py: "d = [2,3,4,5,6,8]\ne = [0.210,0.172,0.158,0.151,0.149,0.156]\ns = [0.006,0.005,0.005,0.004,0.004,0.005]\ni = e.index(min(e))\nthr = e[i] + s[i]\npick = min(dd for dd, ee in zip(d, e) if ee <= thr + 1e-12)\nanswer = ['3','4','5','6'].index(str(pick))" } });
Item({ id: "g2-cap-2", d: 1, secs: 30, prompt: "What is the smallest polynomial degree that can pass exactly through 20 points with distinct x values (for any y)?", answer: 19, tol: 0.5,
  explain: "A degree-d polynomial has d + 1 coefficients; matching 20 values needs 20 coefficients, so d = 19.", src: SRC,
  check: { py: "import numpy as np\nrng = np.random.default_rng(0)\nx = np.linspace(-1, 1, 20); y = rng.normal(size=20)\nfor d in range(0, 25):\n    V = np.polynomial.chebyshev.chebvander(x, d)\n    w, *_ = np.linalg.lstsq(V, y, rcond=None)\n    if np.max(np.abs(V @ w - y)) < 1e-8:\n        answer = d; break", packages: ["numpy"] } });
Item({ id: "g2-cap-3", d: 1, secs: 30, prompt: "In k-NN, moving from k = 1 to k = 25 typically…", options: ["raises variance and lowers bias", "lowers variance and raises bias", "lowers both", "changes neither; k only affects speed"], answer: 1,
  explain: "k = 1 memorises the training set. Averaging over more neighbours smooths the prediction (less variance) but uses farther, less similar points (more bias).", src: SRC,
  check: { py: "answer = 1" } });
Item({ id: "g2-cap-4", d: 3, secs: 150, prompt: "Least squares on $n = 10$ points with $p$ random Gaussian features, using the minimum-norm solution. Averaged over many trials, at which $p$ in {2, 5, 10, 20, 80} is the test error highest?", options: ["2", "5", "10", "20", "80"], answer: 2,
  explain: "p = n = 10 is the interpolation threshold: one exact fit, extremely sensitive to noise, so test error spikes. With p = 20 or 80, the minimum-norm interpolant is smoother and test error falls again (double descent).", src: SRC,
  check: { py: "import numpy as np\nrng = np.random.default_rng(1)\nP = [2,5,10,20,80]; err = {p: 0.0 for p in P}\nfor t in range(300):\n    beta = rng.normal(size=80)/np.sqrt(80)\n    X = rng.normal(size=(10,80)); y = X@beta + 0.3*rng.normal(size=10)\n    Xt = rng.normal(size=(500,80)); yt = Xt@beta\n    for p in P:\n        w = np.linalg.pinv(X[:,:p]) @ y\n        err[p] += np.mean((Xt[:,:p]@w - yt)**2)\nanswer = P.index(max(P, key=err.get))", packages: ["numpy"] } });
Card_("g2-cap-c1", "One-standard-error rule", "Simplest model with CV error ≤ best CV error + its SE.", GEN.cap);
Card_("g2-cap-c2", "Double descent", "Test error peaks at the interpolation threshold (params ≈ data points), then falls as implicit regularisation picks smooth interpolants.", GEN.cap);
Card_("g2-cap-c3", "Capacity knobs", "degree↑ · λ↓ · depth↑ · k↓ (k-NN) · rounds↑ · width/depth/epochs↑ · dropout/weight decay↓", GEN.cap);

// ───────────────────────── 5. Interview practice ─────────────────────────

L(GEN.prac, "Generalisation practice", "Six interview scenarios on diagnosing and fixing models that don't generalise.", {
  kind: "interview",
  mins: 30,
  prereq: [GEN.bv, GEN.diag, GEN.lc, GEN.cap],
  hook: "Answer each scenario out loud in about a minute, then open it and tick off the points the interviewer is listening for.",
}, [
  iq("A gradient-boosted model has AUC 0.99 on training data and 0.71 on validation. What do you do, in order?",
    "First rule out leakage: a 0.28 gap is extreme, so check for target-derived features, IDs, duplicate rows across the split and time travel. Then treat it as variance: fewer or shallower trees, a lower learning rate with early stopping on the validation set, subsampling rows and columns, larger min_child_weight, L1/L2 on leaves. Plot a validation curve over the number of rounds and a learning curve to see whether more data would help.",
    ["Leakage check first", "Identified variance", "At least three boosting-specific regularisers", "Early stopping / validation curve", "Learning curve for the data question"]),
  iq("Your model's offline validation error is 6%, but in production it's 15%. Nothing has changed in the code. Why?",
    "Most likely the validation data doesn't represent production: different time period (drift), different population or channel, or features computed differently at serving time (training/serving skew). Less likely: overfitting to the validation set through repeated tuning. Check by comparing feature distributions, building a validation set from recent production-like data, and logging serving-time features to compare with training features.",
    ["Data mismatch / drift", "Training/serving skew", "Validation-set overfitting", "How to check each"]),
  iq("A linear model has 22% train and 23% validation error. Domain experts get about 5%. The PM proposes collecting 3× more data. Respond.",
    "Train and validation are already close, so variance is about 1 point; avoidable bias is about 17 points. Tripling the data will barely move it. I'd spend the effort on features (interactions, non-linear transforms, domain features) or a more flexible model such as boosted trees, then re-check the curves. I'd show a learning curve to make the case.",
    ["Bias ≈ 17, variance ≈ 1", "More data won't help", "Features / more flexible model", "Use a learning curve as evidence"]),
  iq("You have 2,000 rows and 5,000 features. How do you avoid overfitting?",
    "With p ≫ n, unregularised models can fit anything. Use strong regularisation (lasso or elastic net for sparsity, ridge for stability), do feature selection inside cross-validation (never on the full data first), consider dimensionality reduction (PCA inside the pipeline), prefer simpler models, use repeated or nested CV for honest estimates, and get more rows if possible.",
    ["p ≫ n is high variance", "L1 / elastic net / ridge", "Selection inside CV (no leakage)", "Nested or repeated CV"]),
  iq("Explain to a non-technical stakeholder why the model with the best training accuracy was not chosen.",
    "Training accuracy measures how well the model remembers examples it has already seen. What we care about is how it does on new cases. The most accurate-on-training model had essentially memorised quirks of last year's data and did noticeably worse on held-out months; the chosen model is slightly worse on old data and better on new data, which is what it will face.",
    ["Memorising vs generalising", "Held-out data as the test", "No jargon", "Tie to the business outcome"]),
  iq("Your neural net's validation loss decreases, then increases from epoch 12 while training loss keeps falling. Then a colleague trains a 10× larger model for longer and validation loss eventually falls below your best. Explain both.",
    "The first is classic over-training: after epoch 12 the model starts fitting noise, so early stopping at about epoch 12 is the right call for that model. The second is consistent with double descent over model size and epochs: beyond the interpolation regime, a much larger model trained with SGD finds smoother solutions and can generalise better. Neither contradicts the other; it means you should compare models at their best stopping points and watch for a peak around the threshold.",
    ["Over-training → early stopping", "Double descent (size and epochs)", "Implicit regularisation", "Compare at best checkpoints"]),
]);

// ───────────────────────── 6. Module quiz ─────────────────────────

L(GEN.quiz, "Quiz: Generalisation", "Ten mixed questions across the module, timed.", {
  kind: "quiz",
  mins: 15,
  prereq: [GEN.bv, GEN.diag, GEN.lc, GEN.cap],
  hook: "Ten questions on bias, variance, learning curves and capacity. Use the timed mode for interview pace.",
});

const q = (o: Parameters<typeof Item>[0]) => Item({ ...o, topic: GEN.quiz, src: SRC });
q({ id: "g2-qz-1", d: 3, secs: 150, prompt: "$y = \\sin(2\\pi x) + \\varepsilon$ with $x$ uniform on $[0, 1]$. What is the bias² (averaged over $x$) of the best possible straight line $a + bx$? (3 decimals)", answer: 0.196, tol: 0.003,
  explain: "Best slope b = Cov(x, sin 2πx)/Var(x) = (−1/(2π))/(1/12) = −6/π. Bias² = E[sin²] − b²·Var(x) = 0.5 − (36/π²)/12 = 0.5 − 3/π² ≈ 0.196. The constant model's bias² is 0.5, so the line removes only about 60% of it.",
  check: { py: "import numpy as np\nx = (np.arange(200000)+0.5)/200000\nf = np.sin(2*np.pi*x)\nA = np.c_[np.ones_like(x), x]\nw, *_ = np.linalg.lstsq(A, f, rcond=None)\nanswer = float(np.mean((A@w - f)**2))", packages: ["numpy"] } });
q({ id: "g2-qz-2", d: 1, secs: 30, prompt: "Which of these does NOT reduce variance?", options: ["Bagging", "Early stopping", "Increasing tree depth", "Data augmentation"], answer: 2,
  explain: "Deeper trees add capacity and usually raise variance. The others are all variance-reduction tools.",
  check: { py: "answer = 2" } });
q({ id: "g2-qz-3", d: 2, secs: 60, prompt: "Expected test error at a point is 0.50, noise variance is 0.25 and variance is 0.16. What is the absolute bias at that point?", answer: 0.3, tol: 0.005,
  explain: "bias² = 0.50 − 0.25 − 0.16 = 0.09, so |bias| = 0.3.",
  check: { py: "answer = (0.50-0.25-0.16)**0.5" } });
q({ id: "g2-qz-4", d: 2, secs: 45, prompt: "Baseline 4%, training 5%, validation 13%. The largest gap is…", options: ["Avoidable bias", "Variance", "Neither: they're equal"], answer: 1,
  explain: "Bias = 1 point, variance = 8 points.",
  check: { py: "answer = 1 if (13-5) > (5-4) else 0" } });
q({ id: "g2-qz-5", d: 2, secs: 60, prompt: "Ten tree models, each with prediction variance 4, are averaged. If they are independent, what is the variance of the average?", answer: 0.4, tol: 0.005,
  explain: "σ²/B = 4/10 = 0.4. With correlation ρ it would be ρσ² + (1 − ρ)σ²/B, never below ρσ².",
  check: { py: "answer = 4/10" } });
q({ id: "g2-qz-6", d: 1, secs: 30, prompt: "Learning curves for a model converge early at 18% error; the floor is 3%. More data will…", options: ["help a lot", "help a little at best", "make it worse"], answer: 1,
  explain: "Converged curves well above the floor indicate high bias; extra data can't fix the model's shape.",
  check: { py: "answer = 1" } });
q({ id: "g2-qz-7", d: 2, secs: 60, prompt: "Validation error is $e(n) = 0.05 + 0.9\\,n^{-1/2}$. What is it at $n = 8100$? (3 decimals)", answer: 0.06, tol: 0.0005,
  explain: "0.9/√8100 = 0.9/90 = 0.01, so e = 0.06.",
  check: { py: "answer = 0.05 + 0.9/8100**0.5" } });
q({ id: "g2-qz-8", d: 2, secs: 45, prompt: "Ridge regression: as λ increases from 0 to very large, the validation error typically…", options: ["falls steadily", "rises steadily", "falls, then rises", "rises, then falls"], answer: 2,
  explain: "Small λ: low bias, high variance. Large λ shrinks everything towards 0: high bias. Validation error is U-shaped in λ (mirror image of the U in capacity).",
  check: { py: "answer = 2" } });
q({ id: "g2-qz-9", d: 3, secs: 90, prompt: "A model has 101 parameters and is trained to zero training error. Where are you likely to see the worst test error, if training-set size $n$ varies?", options: ["n ≈ 10", "n ≈ 100", "n ≈ 1,000", "n ≈ 10,000"], answer: 1,
  explain: "Test error peaks near the interpolation threshold, where the number of parameters ≈ the number of training points. With n far above it, variance is small; with n far below it, minimum-norm solutions are smooth.",
  check: { py: "p = 101\nopts = [10, 100, 1000, 10000]\nanswer = min(range(4), key=lambda i: abs(opts[i]-p))" } });
q({ id: "g2-qz-10", d: 2, secs: 60, prompt: "A validation set has 2,500 examples and error 20%. What is the standard error of that estimate, in percentage points?", answer: 0.8, tol: 0.05,
  explain: "√(0.2 × 0.8 / 2500) = √0.000064 = 0.008 = 0.8 points.",
  check: { py: "answer = 100*(0.2*0.8/2500)**0.5" } });
