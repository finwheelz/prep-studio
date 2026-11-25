/**
 * v2 Maths for ML, part G: Information theory. Fixed ids; answers recomputed in Pyodide.
 */
import { CHECKED, iq, lessonWriter } from "./v2-shared";
import { MS } from "./v2-m-src";

const { L, Q, C } = lessonWriter("maths");
const IT = "Information theory";
const NP = ["numpy"];
const SP = ["numpy", "scipy"];
const SHANNON = { label: "Shannon (1948): A Mathematical Theory of Communication", url: "https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf", checked: CHECKED };

L("m-entropy", IT, "Entropy: measuring uncertainty", "Surprise, entropy in bits and nats, why the uniform distribution maximises it, and what it means for coding and prediction.", {
  kind: "concept", mins: 20, prereq: ["m-random-vars"],
  hook: "A fair coin carries 1 bit per toss. How many bits does a coin that lands heads 90% of the time carry?",
  intuition: `
**The situation.** You want a single number for "how unpredictable is this variable?". It underlies cross-entropy loss, decision-tree splits, perplexity and compression.

**The idea.** The **surprise** of an outcome with probability $p$ is $-\\log p$: certain events surprise you not at all, rare ones a lot. **Entropy** is the average surprise:

$$H(X) = -\\sum_x p(x)\\log p(x)$$

- With $\\log_2$ the unit is **bits**; with $\\ln$, **nats** (1 nat = 1.443 bits). ML losses use nats.
- It is 0 when the outcome is certain and largest, $\\log k$, when all $k$ outcomes are equally likely.
- Shannon's coding theorem: $H$ is the minimum average number of bits per symbol for any lossless code. A fair coin needs 1 bit per toss; a 90/10 coin, compressed over long runs, needs only 0.47.
`,
  maths: `
**In one breath.** $H(X) = -\\sum p\\log p = E[-\\log p(X)]$; $0 \\le H \\le \\log k$; binary entropy $H(p) = -p\\log p - (1-p)\\log(1-p)$; joint $H(X, Y) = H(X) + H(Y\\mid X)$; independent ⇒ $H(X, Y) = H(X) + H(Y)$.

**Worked examples (bits).**

| Distribution | Entropy |
|---|---|
| fair coin (½, ½) | 1 |
| biased coin (0.9, 0.1) | 0.469 |
| (½, ¼, ¼) | 1.5 |
| fair die | $\\log_2 6 = 2.585$ |
| uniform over 8 | 3 |

For (½, ¼, ¼): $\\tfrac12(1) + \\tfrac14(2) + \\tfrac14(2) = 1.5$. An optimal prefix code (0, 10, 11) achieves exactly 1.5 bits per symbol.

**Why uniform maximises it.** Maximise $-\\sum p_i\\ln p_i$ subject to $\\sum p_i = 1$: the Lagrange condition $-\\ln p_i - 1 = \\lambda$ forces all $p_i$ equal.

**Conditional entropy.** $H(Y\\mid X) = \\sum_x p(x)H(Y\\mid X = x)$: the uncertainty left about $Y$ once you know $X$. Knowing more never increases expected uncertainty: $H(Y\\mid X) \\le H(Y)$.

**Differential entropy** (continuous): $h(X) = -\\int f\\ln f$; for $N(\\mu, \\sigma^2)$ it is $\\tfrac12\\ln(2\\pi e\\sigma^2)$. It can be negative and isn't invariant to rescaling, so compare it carefully.
`,
  practice: `
**Where it shows up.** Decision trees (split to reduce entropy), the entropy bonus in reinforcement learning (keeps policies exploring), calibration and uncertainty (entropy of a classifier's predicted distribution flags uncertain inputs for active learning), and compression.

**Code.** \`scipy.stats.entropy(p, base=2)\` (normalises \`p\` for you); pass \`base=None\` for nats.
`,
  traps: [
    { trap: "Entropy depends on the outcome values.", why: "It depends only on the probabilities. Relabel outcomes 1, 2, 3 as 10, 200, 3,000 and the entropy is unchanged; variance is what cares about values." },
    { trap: "Mixing bits and nats when comparing numbers.", why: "PyTorch's cross-entropy is in nats; information-theory examples are often in bits. Divide nats by ln 2 to get bits." },
  ],
  say: {
    prompt: "What is entropy, intuitively and mathematically, and where does it appear in ML?",
    secs: 45,
    check: ["Average surprise −Σ p log p", "0 for certainty, max log k for uniform", "Units: bits vs nats", "Coding interpretation: min average bits per symbol", "ML uses: tree splits, cross-entropy loss, RL entropy bonus, uncertainty sampling"],
    followups: [
      { q: "Entropy of a coin with P(heads) = 0.9?", a: "About 0.469 bits." },
      { q: "Which distribution on k outcomes has maximum entropy?", a: "The uniform, with entropy log k." },
      { q: "What is conditional entropy?", a: "$H(Y\\mid X)$: expected remaining uncertainty in $Y$ after observing $X$." },
    ],
    answer: `Entropy measures how unpredictable a random variable is. Each outcome's surprise is minus the log of its probability, and entropy is the average surprise, −Σ p log p. It's zero when one outcome is certain and largest for a uniform distribution, log k for k outcomes. In bits it's the minimum average code length, so a fair coin needs 1 bit and a 90/10 coin about 0.47. In ML it appears in decision trees, which choose splits that reduce entropy, in cross-entropy loss, as an entropy bonus that keeps reinforcement-learning policies exploring, and as an uncertainty score for active learning.`,
    avoid: ["Saying entropy depends on outcome values", "Mixing bits and nats"],
  },
  terms: [["Entropy", "−Σ p log p; average surprise."], ["Bit / nat", "Units with log₂ / ln; 1 nat = 1.443 bits."], ["Conditional entropy", "H(Y | X) = Σ p(x) H(Y | X = x)."]],
  sources: [SHANNON, MS.dlb, MS.mml],
});
Q({ id: "m-ent-1", d: 1, secs: 45, prompt: "Entropy in bits of a coin with P(heads) = 0.9? (3 decimals)", answer: 0.469, tol: 0.002, explain: "−0.9 log₂ 0.9 − 0.1 log₂ 0.1.", py: "from scipy.stats import entropy\nanswer = float(entropy([0.9,0.1],base=2))", packages: SP });
Q({ id: "m-ent-2", d: 1, secs: 30, prompt: "Entropy in bits of the distribution (½, ¼, ¼)?", answer: 1.5, tol: 0.01, explain: "½ × 1 + ¼ × 2 + ¼ × 2.", py: "from scipy.stats import entropy\nanswer = float(entropy([.5,.25,.25],base=2))", packages: SP });
Q({ id: "m-ent-3", d: 1, secs: 30, prompt: "Entropy in bits of one roll of a fair die? (3 decimals)", answer: 2.585, tol: 0.002, explain: "log₂ 6.", py: "from scipy.stats import entropy\nanswer = float(entropy([1/6]*6,base=2))", packages: SP });
Q({ id: "m-ent-4", d: 2, secs: 45, prompt: "Entropy of a fair coin measured in nats? (3 decimals)", answer: 0.693, tol: 0.002, explain: "ln 2: 1 bit = 0.693 nats.", py: "from scipy.stats import entropy\nanswer = float(entropy([.5,.5]))", packages: SP });
Q({ id: "m-ent-5", d: 2, secs: 45, prompt: "Two independent fair dice. Joint entropy of the pair in bits? (3 decimals)", answer: 5.17, tol: 0.002, explain: "Independent ⇒ H(X, Y) = H(X) + H(Y) = 2 log₂ 6 = log₂ 36.", py: "from scipy.stats import entropy\nanswer = float(entropy([1/36]*36,base=2))", packages: SP });
C("m-ent-c1", "Entropy bounds", "0 ≤ H ≤ log k; max at uniform.");
C("m-ent-c2", "Bits ↔ nats", "bits = nats / ln 2.");

L("m-cross-entropy-kl", IT, "Cross-entropy and KL divergence", "The cost of coding with the wrong distribution, why minimising cross-entropy is maximum likelihood, and KL's asymmetry.", {
  kind: "concept", mins: 25, prereq: ["m-entropy", "m-mle"],
  hook: "Cross-entropy loss, KL divergence in a VAE, and the KL penalty in RLHF: three names for closely related quantities. How are they related?",
  intuition: `
**The situation.** You have a true distribution $p$ (the labels, the data) and a model's distribution $q$. You need a measure of how wrong $q$ is.

**Cross-entropy** $H(p, q) = -\\sum p\\log q$: the average surprise when outcomes come from $p$ but you assign probabilities with $q$. In classification, $p$ is the one-hot label, so cross-entropy is just $-\\log q(\\text{true class})$: the log loss.

**KL divergence** $D_{KL}(p\\,\\|\\,q) = \\sum p\\log\\frac pq$ is the *extra* surprise from using $q$ instead of $p$:

$$H(p, q) = H(p) + D_{KL}(p\\,\\|\\,q)$$

Because $H(p)$ doesn't depend on the model, minimising cross-entropy and minimising KL give the same model, and both equal maximum likelihood.

**Properties.** $D_{KL} \\ge 0$, zero only when $q = p$. It is **not symmetric** and not a distance. $D_{KL}(p\\|q)$ blows up if $q$ puts near-zero probability where $p$ has mass, so it punishes a model for missing anything real (mass-covering); the reverse $D_{KL}(q\\|p)$ punishes $q$ for putting mass where $p$ has none (mode-seeking).
`,
  maths: `
**In one breath.** $H(p, q) = -\\sum p\\log q$; $D_{KL}(p\\|q) = \\sum p\\log(p/q) = H(p, q) - H(p) \\ge 0$ (Gibbs' inequality, from Jensen); $\\frac1n\\sum -\\log q_\\theta(x_i) \\to H(p, q_\\theta)$, so MLE minimises KL from data to model.

**Worked example (bits).** $p = (0.5, 0.5)$, $q = (0.9, 0.1)$:

- $H(p, q) = -0.5\\log_2 0.9 - 0.5\\log_2 0.1 = 0.076 + 1.661 = 1.737$
- $H(p) = 1$, so $D_{KL}(p\\|q) = 0.737$
- $D_{KL}(q\\|p) = 0.9\\log_2 1.8 + 0.1\\log_2 0.2 = 0.763 - 0.232 = 0.531$: different, so asymmetric.

**Log loss.** True class predicted with probability 0.8: loss $-\\ln 0.8 = 0.223$ nats. With 0.01: 4.6 nats. Confidently wrong predictions dominate the average.

**Gaussians.** $D_{KL}(N(\\mu_1, \\sigma_1^2)\\,\\|\\,N(\\mu_2, \\sigma_2^2)) = \\ln\\frac{\\sigma_2}{\\sigma_1} + \\frac{\\sigma_1^2 + (\\mu_1 - \\mu_2)^2}{2\\sigma_2^2} - \\frac12$. The VAE term with $N(1, 1)$ against $N(0, 1)$: $0 + \\frac{1 + 1}{2} - \\frac12 = 0.5$ nats.

| Where | Which KL / CE |
|---|---|
| classifier training | cross-entropy with one-hot labels |
| knowledge distillation | CE (or KL) to the teacher's soft probabilities |
| VAE | $D_{KL}(q(z\\mid x)\\,\\|\\,N(0, I))$ regulariser |
| RLHF / PPO | $D_{KL}(\\pi\\,\\|\\,\\pi_{\\text{ref}})$ penalty keeps the policy near the reference |
| t-SNE | $D_{KL}(P\\|Q)$ between neighbour distributions |
`,
  practice: `
**Code.** \`scipy.stats.entropy(p, q)\` computes $D_{KL}(p\\|q)$; \`scipy.special.rel_entr\` elementwise. In PyTorch, \`F.cross_entropy\` takes logits; \`F.kl_div\` expects *log*-probabilities as its first argument and computes KL(target‖input), an easy place to get the direction wrong.

**Label smoothing** mixes the one-hot target with a uniform distribution, so the cross-entropy minimum is no longer at infinite logits; it improves calibration and generalisation in many classifiers.
`,
  traps: [
    { trap: "KL divergence is a distance between distributions.", why: "It's asymmetric and fails the triangle inequality. Use Jensen–Shannon divergence or Wasserstein distance when you need symmetry." },
    { trap: "Minimising cross-entropy and minimising KL give different models.", why: "They differ by $H(p)$, which doesn't depend on the model, so they have the same minimiser." },
  ],
  say: {
    prompt: "What is the relationship between cross-entropy loss, KL divergence and maximum likelihood?",
    secs: 45,
    check: ["H(p, q) = −Σ p log q", "H(p, q) = H(p) + KL(p‖q)", "H(p) fixed ⇒ same minimiser", "Average NLL on data estimates H(p_data, q) ⇒ MLE", "KL ≥ 0, asymmetric; direction matters (VAE, RLHF)"],
    followups: [
      { q: "What is the cross-entropy loss for a one-hot label?", a: "$-\\log q(\\text{true class})$." },
      { q: "Mass-covering vs mode-seeking?", a: "Minimising KL(p‖q) over q covers all of p's mass; minimising KL(q‖p) lets q lock onto one mode of p." },
      { q: "Why is KL non-negative?", a: "Jensen's inequality on the concave log: $-D_{KL} = \\sum p\\log(q/p) \\le \\log\\sum q = 0$." },
    ],
    answer: `Cross-entropy H(p, q) is the average surprise when data come from p but you score them with model q. It splits into the entropy of p plus the KL divergence from p to q, the extra cost of using the wrong distribution. The entropy of the data doesn't depend on the model, so minimising cross-entropy and minimising KL pick the same model. And the average negative log-likelihood on a sample is an estimate of the cross-entropy between the data distribution and the model, so all three, cross-entropy, KL and maximum likelihood, are the same objective. KL is non-negative and asymmetric, so the direction matters, for example in the VAE prior term and the RLHF penalty.`,
    avoid: ["Calling KL a distance", "Getting KL's direction backwards"],
  },
  terms: [["Cross-entropy", "−Σ p log q."], ["KL divergence", "Σ p log(p/q); extra cost of q over p."], ["Label smoothing", "Mix one-hot targets with uniform."]],
  sources: [MS.dlb, MS.mml, SHANNON],
});
const PQ = "import numpy as np\nfrom scipy.stats import entropy\np=np.array([.5,.5]);q=np.array([.9,.1])\n";
Q({ id: "m-kl-1", d: 2, secs: 60, prompt: "p = (0.5, 0.5), q = (0.9, 0.1). Cross-entropy H(p, q) in bits? (3 decimals)", answer: 1.737, tol: 0.002, explain: "−0.5 log₂ 0.9 − 0.5 log₂ 0.1.", py: PQ + "answer = float(-(p*np.log2(q)).sum())", packages: SP });
Q({ id: "m-kl-2", d: 2, secs: 45, prompt: "Same p and q. KL(p‖q) in bits? (3 decimals)", answer: 0.737, tol: 0.002, explain: "H(p, q) − H(p) = 1.737 − 1.", py: PQ + "answer = float(entropy(p,q,base=2))", packages: SP });
Q({ id: "m-kl-3", d: 2, secs: 45, prompt: "Same p and q. KL(q‖p) in bits? (3 decimals)", answer: 0.531, tol: 0.002, explain: "0.9 log₂ 1.8 + 0.1 log₂ 0.2: not equal to KL(p‖q).", py: PQ + "answer = float(entropy(q,p,base=2))", packages: SP });
Q({ id: "m-kl-4", d: 1, secs: 30, prompt: "A classifier gives the true class probability 0.8. Cross-entropy loss in nats? (3 decimals)", answer: 0.223, tol: 0.002, explain: "−ln 0.8.", py: "import numpy as np\nanswer = float(-np.log(0.8))", packages: NP });
Q({ id: "m-kl-5", d: 2, secs: 60, prompt: "KL(N(1, 1) ‖ N(0, 1)) in nats?", answer: 0.5, tol: 0.002, explain: "ln 1 + (1 + 1)/2 − ½.", py: "from scipy import stats, integrate\nimport numpy as np\nf=stats.norm(1,1);g=stats.norm(0,1)\nanswer = float(integrate.quad(lambda x:f.pdf(x)*(f.logpdf(x)-g.logpdf(x)),-20,20)[0])", packages: SP });
C("m-kl-c1", "CE decomposition", "H(p, q) = H(p) + KL(p‖q).");
C("m-kl-c2", "KL asymmetry", "KL(p‖q) ≠ KL(q‖p); not a distance.");

L("m-mutual-info", IT, "Mutual information", "How much knowing one variable tells you about another, why it catches non-linear dependence, and its uses in feature selection.", {
  kind: "concept", mins: 20, prereq: ["m-entropy", "m-joint"],
  hook: "Y = X² with X symmetric: correlation zero. Mutual information is not. What does MI measure that correlation misses?",
  intuition: `
**The situation.** Correlation detects only linear relationships. For feature screening and for understanding dependence you want something that catches any relationship.

**The idea.** **Mutual information** is the reduction in uncertainty about $Y$ from knowing $X$:

$$I(X; Y) = H(Y) - H(Y\\mid X) = H(X) + H(Y) - H(X, Y)$$

- It is symmetric: $X$ tells you as much about $Y$ as $Y$ tells you about $X$.
- $I = 0$ exactly when $X$ and $Y$ are independent, any kind of dependence makes it positive.
- Equivalently, it is the KL divergence between the joint distribution and the product of marginals: how far the pair is from independent.

For jointly Gaussian variables there is a direct link: $I = -\\tfrac12\\ln(1 - \\rho^2)$.
`,
  maths: `
**In one breath.** $I(X;Y) = \\sum_{x,y}p(x,y)\\log\\frac{p(x,y)}{p(x)p(y)} = D_{KL}(p_{XY}\\,\\|\\,p_Xp_Y) \\ge 0$; $I(X;X) = H(X)$; Gaussian $I = -\\frac12\\ln(1-\\rho^2)$.

**Worked example (bits).** Joint table $p(0,0) = 0.4$, $p(0,1) = 0.1$, $p(1,0) = 0.2$, $p(1,1) = 0.3$; marginals $p_X = (0.5, 0.5)$, $p_Y = (0.6, 0.4)$.

$$I = 0.4\\log_2\\tfrac{0.4}{0.3} + 0.1\\log_2\\tfrac{0.1}{0.2} + 0.2\\log_2\\tfrac{0.2}{0.3} + 0.3\\log_2\\tfrac{0.3}{0.2} = 0.125$$

**Extremes.** $Y = X$ for a fair bit: $I = H(X) = 1$ bit. Independent: 0.

**Non-linear example.** $X$ uniform on $\\{-1, 0, 1\\}$, $Y = X^2$: $\\rho = 0$, but $H(Y) = H(1/3, 2/3) = 0.918$ bits and $H(Y\\mid X) = 0$, so $I = 0.918$ bits.

**Gaussian link.** $\\rho = 0.8$: $I = -\\frac12\\ln 0.36 = 0.511$ nats.

**Data-processing inequality.** If $X \\to Y \\to Z$ is a chain, $I(X; Z) \\le I(X; Y)$: processing can't create information about $X$. This is the intuition behind information bottleneck views of representations.

| Measure | Captures | Range |
|---|---|---|
| Pearson $\\rho$ | linear | $[-1, 1]$ |
| Spearman | monotone | $[-1, 1]$ |
| Mutual information | any dependence | $[0, \\infty)$ (≤ min entropy for discrete) |
`,
  practice: `
**Feature selection.** \`sklearn.feature_selection.mutual_info_classif\` / \`mutual_info_regression\` estimate MI with nearest-neighbour methods; useful to rank features, including non-linear ones. Estimates for continuous variables are noisy and sample-hungry.

**Elsewhere.** Normalised MI and adjusted MI compare clusterings; contrastive learning (InfoNCE) maximises a lower bound on MI between views; word association (pointwise MI, PMI) in NLP.
`,
  traps: [
    { trap: "Zero correlation means zero mutual information.", why: "MI catches non-linear dependence: $Y = X^2$ has $\\rho = 0$ but positive MI." },
    { trap: "MI estimates from a few hundred continuous samples are reliable.", why: "Plug-in and k-NN estimators are biased and noisy at small n; compare features with the same estimator and use permutation baselines." },
  ],
  say: {
    prompt: "What is mutual information, and why might you use it instead of correlation for feature selection?",
    secs: 40,
    check: ["I(X;Y) = H(Y) − H(Y | X): uncertainty reduction", "Equals KL(joint ‖ product of marginals)", "Zero iff independent; catches non-linear dependence", "Correlation only linear (Y = X² example)", "Estimation caveats for continuous data"],
    followups: [
      { q: "What is I(X; X)?", a: "H(X)." },
      { q: "MI of jointly Gaussian variables with correlation ρ?", a: "$-\\frac12\\ln(1 - \\rho^2)$ nats." },
      { q: "What is pointwise mutual information?", a: "$\\log\\frac{p(x,y)}{p(x)p(y)}$ for a single pair of outcomes, used for word co-occurrence." },
    ],
    answer: `Mutual information measures how much knowing X reduces uncertainty about Y: H(Y) minus H(Y given X). Equivalently it's the KL divergence between the joint distribution and the product of the marginals, so it's zero exactly when the variables are independent and positive for any kind of dependence. Correlation only sees linear relationships: if Y = X² with X symmetric, correlation is zero, yet Y is completely determined by X and MI is large. So for screening features that may relate non-linearly to the target, MI is a better ranking signal, though for continuous data its estimates are noisy and need enough samples.`,
    avoid: ["Equating zero correlation with independence", "Ignoring estimation noise"],
  },
  terms: [["Mutual information", "H(X) + H(Y) − H(X, Y)."], ["Data-processing inequality", "Processing can't increase information about the source."], ["PMI", "log p(x, y)/(p(x)p(y))."]],
  sources: [MS.dlb, SHANNON, MS.mml],
});
Q({ id: "m-mi-1", d: 2, secs: 60, prompt: "Joint p(0,0) = 0.4, p(0,1) = 0.1, p(1,0) = 0.2, p(1,1) = 0.3. Mutual information in bits? (3 decimals)", answer: 0.125, tol: 0.002, explain: "Σ p(x, y) log₂[p(x, y)/(p(x)p(y))] = 0.1245.", py: "import numpy as np\nfrom scipy.stats import entropy\nP=np.array([[.4,.1],[.2,.3]])\nanswer = float(entropy(P.sum(1),base=2)+entropy(P.sum(0),base=2)-entropy(P.ravel(),base=2))", packages: SP });
Q({ id: "m-mi-2", d: 1, secs: 30, prompt: "X is a fair bit and Y = X. Mutual information in bits?", answer: 1, tol: 0.01, explain: "I(X; X) = H(X).", py: "import numpy as np\nP=np.array([[.5,0],[0,.5]]);px=P.sum(1);py_=P.sum(0)\nm=P>0\nanswer = float((P[m]*np.log2(P[m]/np.outer(px,py_)[m])).sum())", packages: NP });
Q({ id: "m-mi-3", d: 2, secs: 60, prompt: "X uniform on {−1, 0, 1}, Y = X². Mutual information in bits? (3 decimals)", answer: 0.918, tol: 0.002, explain: "H(Y) = H(⅓, ⅔) and H(Y | X) = 0.", py: "from collections import Counter\nfrom fractions import Fraction as F\nimport math\nxs=[-1,0,1]\npy_=Counter(x*x for x in xs)\nHY=-sum(float(F(c,3))*math.log2(c/3) for c in py_.values())\nanswer = HY" });
Q({ id: "m-mi-4", d: 2, secs: 45, prompt: "Jointly Gaussian X and Y with correlation 0.8. Mutual information in nats? (3 decimals)", answer: 0.511, tol: 0.002, explain: "−½ ln(1 − 0.64).", py: "import numpy as np\nS=np.array([[1,.8],[.8,1]])\nh=lambda C:0.5*np.log((2*np.pi*np.e)**C.shape[0]*np.linalg.det(C))\nanswer = float(h(S[:1,:1])+h(S[1:,1:])-h(S))", packages: NP });
Q({ id: "m-mi-5", d: 1, secs: 30, prompt: "Mutual information between two variables is zero exactly when they are:", options: ["Uncorrelated", "Independent", "Identically distributed", "Normally distributed"], answer: 1, explain: "I = KL(joint ‖ product of marginals) = 0 iff the joint factorises.", py: "import numpy as np\nP=np.outer([.3,.7],[.6,.4])\nI=(P*np.log(P/np.outer(P.sum(1),P.sum(0)))).sum()\nanswer = 1 if abs(I)<1e-12 else 0", packages: NP });
C("m-mi-c1", "MI identities", "H(Y) − H(Y | X) = H(X) + H(Y) − H(X, Y) = KL(p_XY ‖ p_X p_Y).");
C("m-mi-c2", "MI vs correlation", "MI catches any dependence; ρ only linear.");

L("m-info-gain", IT, "Information gain, log loss and perplexity", "Entropy-based tree splits versus Gini, log loss as a scoring rule, and perplexity for language models.", {
  kind: "concept", mins: 20, prereq: ["m-entropy", "m-cross-entropy-kl"],
  hook: "A language model's validation loss is 2.0 nats per token. What does 'perplexity 7.4' mean in plain words?",
  intuition: `
**The situation.** Three everyday ML numbers are entropy in disguise.

**Information gain (decision trees).** A split is good if it makes the children purer. Information gain is the parent's entropy minus the size-weighted entropy of the children; it is exactly the mutual information between the split and the label in that node. Gini impurity, $1 - \\sum p_k^2$, is a cheaper cousin and usually picks similar splits.

**Log loss (classifiers).** The average cross-entropy between labels and predicted probabilities. It is a **proper scoring rule**: you minimise it in expectation only by reporting your true beliefs, so it rewards calibration as well as ranking. It punishes confident mistakes heavily.

**Perplexity (language models).** $\\exp(\\text{average cross-entropy per token in nats})$. It is the effective number of equally likely choices the model is torn between at each step: perplexity 7.4 means "as uncertain as choosing uniformly among about 7 tokens".
`,
  maths: `
**In one breath.** $\\text{IG} = H(\\text{parent}) - \\sum_c \\frac{n_c}{n}H(c)$; Gini $G = 1 - \\sum_k p_k^2$; log loss $= -\\frac1n\\sum[y\\ln\\hat p + (1-y)\\ln(1-\\hat p)]$; perplexity $= e^{\\text{CE}_{\\text{nats}}} = 2^{\\text{CE}_{\\text{bits}}}$.

**Worked split.** Node: 5 positive, 5 negative ($H = 1$ bit, $G = 0.5$). Split into left (4+, 0−) and right (1+, 5−).

| | Left | Right | Weighted |
|---|---|---|---|
| Entropy (bits) | 0 | $H(1/6) = 0.650$ | $0.6 \\times 0.650 = 0.390$ |
| Gini | 0 | $1 - (1/36 + 25/36) = 0.278$ | $0.167$ |

Information gain $= 1 - 0.390 = 0.610$ bits; Gini decrease $= 0.5 - 0.167 = 0.333$.

**Log loss baselines.** Predicting 0.5 for a balanced binary problem: $\\ln 2 = 0.693$. Predicting the base rate $\\pi$ always: $H(\\pi)$ in nats. A model is only useful if it beats that.

**Perplexity.** CE 2.0 nats: $e^2 = 7.39$. A uniform model over a 50,000-token vocabulary has perplexity 50,000. Perplexities are only comparable with the same tokeniser, since per-token loss depends on what a token is.

**Gain ratio.** Information gain favours splits with many values (an ID column gives perfect purity); C4.5 divides by the split's own entropy to correct this.
`,
  practice: `
**Trees.** scikit-learn \`criterion="gini"\` (default), \`"entropy"\` or \`"log_loss"\`; differences in accuracy are usually small. Gradient-boosted trees split on gradient statistics of the loss instead.

**Evaluation.** Report log loss (or Brier score) when probabilities drive decisions; AUC alone ignores calibration. Clip predicted probabilities away from 0 and 1 to avoid infinite loss from a single confident error.
`,
  traps: [
    { trap: "A lower perplexity model is better, whatever the tokeniser.", why: "Per-token perplexity depends on token granularity. Compare with the same tokeniser and data, or normalise per character or byte (bits per byte)." },
    { trap: "Information gain is a safe criterion for high-cardinality features.", why: "It is biased towards features with many distinct values; use gain ratio, regularisation or minimum leaf sizes." },
  ],
  say: {
    prompt: "What is perplexity, how does it relate to cross-entropy, and what are its pitfalls when comparing models?",
    secs: 45,
    check: ["Perplexity = exp(mean token cross-entropy in nats)", "Interpretation: effective branching factor / number of equally likely choices", "Lower is better on the same data", "Depends on tokeniser and test set; not comparable across vocabularies", "Doesn't directly measure usefulness; complement with task evals"],
    followups: [
      { q: "Perplexity of a uniform model over V tokens?", a: "V." },
      { q: "How is information gain related to mutual information?", a: "It is the mutual information between the split variable and the label within the node." },
      { q: "Why is log loss a proper scoring rule?", a: "Its expected value is minimised only by reporting the true probability, so it rewards honest, calibrated forecasts." },
    ],
    answer: `Perplexity is the exponential of the average cross-entropy per token, measured in nats. If the validation loss is 2.0 nats per token, perplexity is e² ≈ 7.4, meaning the model is on average as uncertain as if it were choosing uniformly among about seven tokens; a uniform model over a vocabulary of V tokens has perplexity V. Lower is better, but only on the same test data and tokeniser, since a model with smaller tokens makes more, easier predictions. And it measures how well the model predicts text, not whether it is useful, so I'd pair it with task-based evaluations.`,
    avoid: ["Comparing perplexity across tokenisers", "Forgetting the exp / units link"],
  },
  terms: [["Information gain", "Parent entropy − weighted child entropy."], ["Gini impurity", "1 − Σ pₖ²."], ["Perplexity", "exp(cross-entropy per token)."]],
  sources: [MS.dlb, MS.islr, SHANNON],
});
Q({ id: "m-ig-1", d: 2, secs: 60, prompt: "Node with 5 positive, 5 negative splits into (4+, 0−) and (1+, 5−). Information gain in bits? (3 decimals)", answer: 0.61, tol: 0.002, explain: "1 − 0.6 × H(1/6) = 1 − 0.6 × 0.650.", py: "from scipy.stats import entropy\nanswer = float(entropy([5,5],base=2)-0.4*entropy([4,0],base=2)-0.6*entropy([1,5],base=2))", packages: SP });
Q({ id: "m-ig-2", d: 2, secs: 45, prompt: "Same split. Decrease in Gini impurity? (3 decimals)", answer: 0.333, tol: 0.002, explain: "0.5 − 0.6 × (1 − 1/36 − 25/36).", py: "g=lambda a,b:1-(a/(a+b))**2-(b/(a+b))**2\nanswer = g(5,5)-0.4*g(4,0)-0.6*g(1,5)" });
Q({ id: "m-ig-3", d: 1, secs: 30, prompt: "Validation cross-entropy 2.0 nats per token. Perplexity? (2 decimals)", answer: 7.39, tol: 0.01, explain: "e².", py: "import math\nanswer = math.exp(2.0)" });
Q({ id: "m-ig-4", d: 1, secs: 30, prompt: "Balanced binary labels; a model always predicts 0.5. Log loss in nats? (3 decimals)", answer: 0.693, tol: 0.002, explain: "−ln 0.5 = ln 2.", py: "import numpy as np\ny=np.array([0,1]*50);p=np.full(100,0.5)\nanswer = float(-np.mean(y*np.log(p)+(1-y)*np.log(1-p)))", packages: NP });
Q({ id: "m-ig-5", d: 2, secs: 45, prompt: "Labels are 10% positive. Log loss (nats) of a model that always predicts 0.1? (3 decimals)", answer: 0.325, tol: 0.002, explain: "The entropy of Bernoulli(0.1) in nats: the baseline to beat.", py: "from scipy.stats import entropy\nanswer = float(entropy([0.1,0.9]))", packages: SP });
C("m-ig-c1", "Perplexity", "exp(CE in nats); uniform over V ⇒ V.");
C("m-ig-c2", "Log-loss baseline", "Always predicting the base rate π scores H(π).");

L("m-info-practice", IT, "Information theory practice", "Five interview questions linking entropy, cross-entropy, KL and mutual information to ML.", {
  kind: "interview", mins: 20, prereq: ["m-entropy", "m-cross-entropy-kl", "m-mutual-info", "m-info-gain"],
  hook: "Answer each out loud in about a minute, then open it and tick off what the interviewer listens for.",
}, [
  iq("Why do we train classifiers with cross-entropy rather than accuracy?", "Accuracy is piecewise constant in the parameters (zero gradient almost everywhere) and ignores confidence. Cross-entropy is the negative log-likelihood: smooth, convex for linear models, proper (rewards calibrated probabilities), and its gradient with softmax is p − y.", ["Accuracy has no useful gradient", "CE = NLL / MLE", "Proper scoring rule, calibration", "p − y gradient"]),
  iq("Explain KL divergence and why its direction matters in variational inference.", "KL(p‖q) = Σ p log(p/q) ≥ 0, asymmetric. VI minimises KL(q‖p), which is tractable (expectation under q) and mode-seeking: q fits one mode and underestimates variance. KL(p‖q) (as in MLE) is mass-covering.", ["Definition and non-negativity", "Asymmetry", "VI uses reverse KL: mode-seeking", "Forward KL mass-covering"]),
  iq("How would you use mutual information for feature selection, and what are its limits?", "Estimate MI between each feature and the target (k-NN estimators for continuous), rank, keep the top features. Captures non-linear relevance. Limits: univariate (misses interactions and redundancy), noisy estimates, depends on discretisation; use mRMR or model-based selection for redundancy.", ["Rank by MI with target", "Non-linear advantage", "Univariate: misses interactions/redundancy", "Estimation noise"]),
  iq("What is the KL penalty in RLHF for?", "It adds −β KL(π‖π_ref) to the reward so the fine-tuned policy stays close to the reference model: prevents reward hacking and degenerate text, keeps fluency. β trades reward against drift.", ["Penalty definition", "Keeps policy near reference", "Prevents reward hacking / collapse", "β trade-off"]),
  iq("A model's log loss is 0.30 on a problem where 10% of labels are positive. Is that good?", "The constant base-rate predictor scores H(0.1) ≈ 0.325 nats, so 0.30 is only slightly better: the model has little signal. Compare with baselines, check calibration and look at AUC/PR-AUC too.", ["Compute baseline H(0.1)", "≈ 0.325", "Slight improvement only", "Look at calibration / ranking metrics"]),
]);
