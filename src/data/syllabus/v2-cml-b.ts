/**
 * v2 Classical ML, part B: Other classifiers · Unsupervised learning · Evaluation metrics ·
 * Validation and pitfalls. Fixed ids; answers recomputed in Pyodide.
 */
import { SOURCES as S, lessonWriter } from "./v2-shared";

const { L, Q, C } = lessonWriter("cml");
const OC = "Other classifiers";
const UN = "Unsupervised learning";
const EV = "Evaluation metrics";
const VP = "Validation and pitfalls";

// ───────────────────────── Other classifiers ─────────────────────────

L("cml-knn", OC, "k-nearest neighbours", "Predict from the closest training points: distance, k, scaling and the curse of dimensionality.", {
  kind: "concept", mins: 20, prereq: ["cml-missing-scaling"],
  hook: "k-NN has no training step at all. So where does it pay the cost, and why does it fall apart with 500 features?",
  intuition: `
**The situation.** A new customer arrives; find the 5 most similar past customers and predict what most of them did. That's k-NN: no model, just the data plus a distance.

**The idea.** For a query point, compute its distance to every training point, take the $k$ closest, and vote (classification) or average (regression).

- **k controls the trade-off.** $k = 1$ copies the nearest neighbour: zero training error, very jagged boundary, high variance. Large $k$ averages over a wide neighbourhood: smooth, high bias. $k = n$ predicts the overall majority.
- **Distance is everything.** Unscaled features let the largest-unit feature decide; irrelevant features add noise to every distance.
- **High dimensions break "near".** In hundreds of dimensions, the nearest and farthest points end up at almost the same distance, so neighbours stop being informative.
`,
  maths: `
**In one breath.** $\\hat y(x) = \\text{mode or mean of } \\{y_i : x_i \\in N_k(x)\\}$; Euclidean $\\|x - x'\\|_2$; cost $O(np)$ per query with brute force.

**Distances.** Euclidean $\\sqrt{\\sum (x_j - x'_j)^2}$ (e.g. $(1, 2)$ to $(4, 6)$: 5); Manhattan $\\sum|x_j - x'_j|$ (robust, grid-like); cosine distance $1 - \\cos\\theta$ for text and embeddings (direction, not length).

**Probabilities.** The fraction of neighbours in each class: labels $(1, 1, 0, 1, 0)$ → $\\hat p = 0.6$. Distance-weighted voting (weights $1/d$) gives closer neighbours more say.

**Curse of dimensionality.** To capture 10% of points spread uniformly in a unit hypercube, a sub-cube needs side $0.1^{1/d}$: 0.1 in 1-D, 0.316 in 2-D, 0.794 in 10-D. "Local" neighbourhoods span most of each axis, so they aren't local any more.

**Cost.** Training is $O(1)$ (store the data); prediction is $O(np)$ per query by brute force, about $O(p\\log n)$ with KD-/ball-trees in low dimensions, and approximate nearest-neighbour indexes (HNSW, IVF) at scale; the same indexes power vector search in RAG.
`,
  practice: `
**When to use.** Small to medium data with few, meaningful features; as a baseline; for recommendations and similarity search on embeddings; for imputation (KNNImputer).

**Checklist.** Scale features; choose $k$ by CV (odd $k$ avoids binary ties); consider distance weighting; reduce dimensions (PCA, feature selection) when $p$ is large; use an ANN index for large $n$.
`,
  traps: [
    { trap: "k-NN is fast because there's no training.", why: "The cost moves to prediction: every query scans the training set (or an index). For large n, latency and memory are the problem." },
    { trap: "Larger k always reduces error.", why: "Larger k reduces variance but adds bias by averaging over farther, less similar points. Validation error is U-shaped in k." },
    { trap: "k-NN works the same with 500 raw features.", why: "Distances concentrate in high dimensions and irrelevant features swamp relevant ones. Select features or project to a lower dimension first." },
  ],
  say: {
    prompt: "How does k-NN work, and what are its main weaknesses?",
    secs: 45,
    check: ["Find the k nearest training points by a distance; vote or average", "k trades variance (small k) for bias (large k); choose by CV", "Needs feature scaling; distance choice matters", "Prediction cost O(np); indexes / ANN for scale", "Curse of dimensionality"],
    followups: [
      { q: "Why do distances become less meaningful in high dimensions?", a: "With many independent dimensions, squared distances are sums of many terms and concentrate around their mean, so the ratio of nearest to farthest distance approaches 1. Neighbourhoods must span most of each axis to contain any points." },
      { q: "How would you speed up k-NN for millions of points?", a: "Reduce dimensions, use a tree index for low dimensions, or an approximate nearest-neighbour index (HNSW, IVF-PQ via FAISS) that trades a little recall for orders-of-magnitude speed." },
      { q: "Which distance for text embeddings?", a: "Cosine similarity (or dot product on normalised vectors), because direction carries the meaning and length often reflects frequency or document size." },
    ],
    answer: `k-NN stores the training data and, for a new point, finds the k closest points under a distance such as Euclidean, then takes a majority vote or an average. Small k gives a jagged, high-variance boundary; large k smooths it but adds bias, so I pick k by cross-validation.

Its weaknesses: features must be scaled and relevant, because every feature enters the distance; prediction is expensive since each query compares against the training set, which needs tree or approximate-nearest-neighbour indexes at scale; and in high dimensions distances concentrate, so the nearest neighbours aren't really near.`,
    avoid: ["Using k-NN on unscaled features", "“It's cheap because there's no training”"],
  },
  terms: [["Lazy learner", "Defers all work to prediction time."], ["Curse of dimensionality", "Volume grows so fast that data become sparse and distances concentrate."], ["ANN index", "Approximate nearest-neighbour search structure (HNSW, IVF)."]],
  sources: [S.sklNN, S.islr],
});
Q({ id: "cml-knn-1", d: 1, secs: 20, prompt: "Euclidean distance between (1, 2) and (4, 6)?", answer: 5, tol: 0.005, explain: "√(3² + 4²) = 5.", py: "import math\nanswer = math.dist((1,2),(4,6))" });
Q({ id: "cml-knn-2", d: 1, secs: 20, prompt: "The 5 nearest neighbours have labels 1, 1, 0, 1, 0. Predicted probability of class 1?", answer: 0.6, tol: 0.005, explain: "3 of 5 neighbours.", py: "answer = [1,1,0,1,0].count(1)/5" });
Q({ id: "cml-knn-3", d: 2, secs: 60, prompt: "Points are uniform in a 10-dimensional unit hypercube. What side length must a sub-cube have to contain 10% of the points? (3 decimals)", answer: 0.794, tol: 0.002, explain: "s¹⁰ = 0.1 → s = 0.1^(1/10) = 0.794: the 'neighbourhood' spans 79% of every axis.", py: "answer = 0.1**(1/10)" });
Q({ id: "cml-knn-4", d: 2, secs: 45, prompt: "k-NN with k = 1 evaluated on its own training data (no duplicate points). Training error?", answer: 0, tol: 0.005, explain: "Each point's nearest neighbour is itself, so training error is 0, a sign of maximum variance rather than a good model.", py: "import numpy as np\nfrom sklearn.neighbors import KNeighborsClassifier\nrng = np.random.default_rng(0)\nX = rng.normal(size=(200,3)); y = rng.integers(0,2,200)\nanswer = float(1 - KNeighborsClassifier(1).fit(X,y).score(X,y))", packages: ["scikit-learn"] });
C("cml-knn-c1", "k in k-NN", "Small k: low bias, high variance. Large k: smooth, high bias. Choose by CV.");

L("cml-naive-bayes", OC, "Naive Bayes", "Bayes' rule with a conditional-independence shortcut: fast, strong on text, poorly calibrated.", {
  kind: "concept", mins: 20, prereq: ["cml-logreg"],
  hook: "Naive Bayes assumes words in an email are independent given spam/not-spam, which is obviously false. Why does it still filter spam well?",
  intuition: `
**The situation.** Classify SMS messages as spam with a few thousand examples and a 20,000-word vocabulary. You need something fast that works with little data.

**The idea.** Bayes' rule: $P(\\text{spam} \\mid \\text{words}) \\propto P(\\text{spam})\\,P(\\text{words} \\mid \\text{spam})$. Estimating the joint probability of every word combination is impossible, so assume words are **independent given the class**: $P(\\text{words} \\mid \\text{spam}) = \\prod_j P(w_j \\mid \\text{spam})$. Each factor is just a count ratio.

The independence assumption is wrong, so the probabilities come out too extreme. But classification only needs the **right class to have the highest score**, and that often survives the wrong assumption. Result: a model that trains in one pass, needs little data, and is a strong text baseline.
`,
  maths: `
**In one breath.** $\\hat y = \\arg\\max_c \\big[\\log P(c) + \\sum_j \\log P(x_j \\mid c)\\big]$, with Laplace smoothing $P(w \\mid c) = \\frac{\\text{count}(w, c) + \\alpha}{\\text{total}(c) + \\alpha V}$.

**Worked example (one word).** Prior $P(\\text{spam}) = 0.4$. "Free" appears in 60% of spam and 10% of ham. $P(\\text{spam} \\mid \\text{free}) = \\frac{0.4 \\times 0.6}{0.4 \\times 0.6 + 0.6 \\times 0.1} = 0.24/0.30 = 0.8$.

**Why smoothing.** A word never seen in spam would get $P = 0$, and a single factor of 0 zeroes the whole product. With $\\alpha = 1$, a class with 1,000 words of text and vocabulary $V = 5000$: unseen word $\\to 1/6000 \\approx 0.000167$.

**Log space.** Multiply hundreds of small probabilities and you underflow; sum logs instead.

**Variants.** Multinomial (word counts), Bernoulli (word present/absent; penalises absent words), Gaussian (continuous features, per-class mean and variance), Complement NB (better with imbalanced text).

**Link to logistic regression.** Both are linear in the features (in log space). Naive Bayes is **generative** (models $P(x \\mid y)$), logistic regression is **discriminative** (models $P(y \\mid x)$ directly). NB converges with less data; logistic regression wins with more data.
`,
  practice: `
**When to use.** Text classification baselines (spam, intent, topic), very small data, streaming updates (counts update trivially), many features with limited compute.

**When not to.** When you need calibrated probabilities (use them for ranking only, or calibrate), or when correlated features carry the signal: duplicated evidence is double-counted.
`,
  traps: [
    { trap: "Naive Bayes probabilities are reliable because it's a Bayesian model.", why: "The independence assumption double-counts correlated evidence, pushing probabilities towards 0 and 1. Good for ranking and classification, poor as calibrated probabilities." },
    { trap: "Skip smoothing; zero counts are rare.", why: "With a large vocabulary most words are unseen in some class, and one zero probability vetoes the class. Always smooth." },
    { trap: "Naive Bayes needs independent features to work at all.", why: "It needs the arg-max class to survive the wrong assumption, which it often does. Dependence hurts calibration more than accuracy." },
  ],
  say: {
    prompt: "Explain naive Bayes and why it works despite its 'naive' assumption.",
    secs: 45,
    check: ["Bayes' rule: posterior ∝ prior × likelihood", "Conditional independence of features given the class", "Laplace smoothing; compute in log space", "Classification survives the wrong assumption; probabilities are poorly calibrated", "Generative vs discriminative (vs logistic regression); good for text and small data"],
    followups: [
      { q: "Generative vs discriminative?", a: "Generative models learn P(x | y) and P(y) and use Bayes' rule (naive Bayes, LDA); discriminative models learn P(y | x) or the boundary directly (logistic regression, SVM). Generative models need less data if their assumptions roughly hold; discriminative models usually win with more data." },
      { q: "What is Laplace smoothing?", a: "Adding α pseudo-counts to every feature-class count so unseen words get a small non-zero probability instead of zeroing the product." },
      { q: "Multinomial vs Bernoulli NB?", a: "Multinomial uses word counts and ignores absent words; Bernoulli uses presence/absence and explicitly penalises absent words. Bernoulli can do better on short texts." },
    ],
    answer: `Naive Bayes applies Bayes' rule, posterior proportional to prior times likelihood, and makes the likelihood tractable by assuming features are independent given the class, so it's a product of per-feature probabilities estimated from counts. I'd add Laplace smoothing so unseen words don't zero the product, and work in log space.

The assumption is false for text, but the classifier only needs the right class to score highest, and that's often preserved; what suffers is calibration, so the probabilities are too extreme. It trains in one pass, needs little data, and is a strong text baseline. It's the generative counterpart of logistic regression, which usually wins once there's plenty of data.`,
    avoid: ["Trusting its probabilities as calibrated", "Forgetting smoothing"],
  },
  terms: [["Conditional independence", "P(x₁, x₂ | y) = P(x₁ | y) P(x₂ | y)."], ["Laplace smoothing", "Add α to every count."], ["Generative model", "Models P(x | y) and P(y)."]],
  sources: [S.sklNB, S.islr],
});
Q({ id: "cml-nb-1", d: 2, secs: 60, prompt: "P(spam) = 0.4. A word appears in 60% of spam and 10% of non-spam. P(spam | word)?", answer: 0.8, tol: 0.005, explain: "0.24/(0.24 + 0.06) = 0.8.", py: "answer = 0.4*0.6/(0.4*0.6 + 0.6*0.1)" });
Q({ id: "cml-nb-2", d: 2, secs: 60, prompt: "Laplace smoothing α = 1, a class has 1,000 word tokens, vocabulary 5,000. Smoothed probability of a word never seen in that class? (6 decimals)", answer: 0.000167, tol: 0.000002, explain: "(0 + 1)/(1000 + 5000) = 1/6000.", py: "answer = 1/(1000+5000)" });
Q({ id: "cml-nb-3", d: 3, secs: 90, prompt: "Two words, each with likelihood ratio P(w | spam)/P(w | ham) = 3, prior odds 1:1. Naive Bayes posterior P(spam) if the two words are actually perfect duplicates of each other? (2 decimals)", answer: 0.9, tol: 0.005, explain: "NB multiplies both ratios: odds 9 → p = 0.9. The true posterior uses the evidence once (odds 3 → 0.75): double counting makes NB over-confident.", py: "o = 1*3*3\nanswer = o/(1+o)" });
C("cml-nb-c1", "Naive Bayes rule", "argmax_c log P(c) + Σ log P(x_j | c).");
C("cml-nb-c2", "Naive Bayes calibration", "Correlated features are double-counted, so probabilities are over-confident.");

L("cml-svm", OC, "Support vector machines", "Maximum-margin classifiers, hinge loss, C, and the kernel trick.", {
  kind: "concept", mins: 30, prereq: ["cml-logreg"],
  hook: "Many lines separate two classes perfectly. Which one should you pick, and why does the answer depend on only a few points?",
  intuition: `
**The situation.** Two classes that a straight line can separate. Logistic regression gives one line; the perceptron gives whichever it stumbles onto. SVMs pick the line with the **widest gap** to the nearest points on either side.

**The idea.** A wide margin means small perturbations of the data won't flip predictions, which tends to generalise. Only the points on or inside the margin (the **support vectors**) determine the boundary; points far away could move without changing anything.

Real data overlaps, so the **soft-margin** SVM lets some points violate the margin, paying a penalty. **C** sets the price: large C = few violations allowed, narrow margin, low bias / high variance; small C = wide margin, more violations, more regularisation.

**Non-linear boundaries.** Map inputs to a richer feature space where a linear boundary works. The **kernel trick** computes inner products in that space without building it: the RBF kernel corresponds to an infinite-dimensional space.
`,
  maths: `
**In one breath.** Minimise $\\frac12\\|w\\|^2 + C\\sum_i \\max(0, 1 - y_i(w^\\top x_i + b))$ with $y \\in \\{-1, +1\\}$; margin width $= 2/\\|w\\|$; kernel $K(x, x') = \\phi(x)^\\top\\phi(x')$.

**Margin.** With the scaling $y_i(w^\\top x_i + b) \\ge 1$ for the closest points, the two margin lines are $w^\\top x + b = \\pm 1$, a distance $2/\\|w\\|$ apart. Maximising the margin is minimising $\\|w\\|$. Example: $w = (3, 4)$ → margin $2/5 = 0.4$.

**Hinge loss.** $\\max(0, 1 - y\\,f(x))$: zero for points correctly classified beyond the margin; linear penalty otherwise. $y = +1$, $f = 0.3$ → 0.7; $f = 1.5$ → 0. Compare log loss, which never reaches zero: that's why SVMs ignore far-away points and logistic regression doesn't.

**Kernels.**

| Kernel | $K(x, x')$ | Note |
|---|---|---|
| Linear | $x^\\top x'$ | big sparse data (text); use LinearSVC |
| Polynomial | $(\\gamma x^\\top x' + r)^d$ | interactions up to degree d |
| RBF | $\\exp(-\\gamma\\|x - x'\\|^2)$ | default for non-linear; γ = how local |

RBF with $\\gamma = 0.5$ and $\\|x - x'\\|^2 = 2$: $e^{-1} = 0.368$. Large γ makes each support vector's influence tiny and local (overfit); small γ makes the boundary nearly linear.

**Dual form.** The solution is $f(x) = \\sum_i \\alpha_i y_i K(x_i, x) + b$, with $\\alpha_i > 0$ only for support vectors. Training cost grows between $O(n^2)$ and $O(n^3)$: fine for 10⁴ rows, painful for 10⁶.
`,
  practice: `
**When to use.** Medium-sized data with many features (text, genomics), clear margins, or when a strong non-linear baseline with few hyperparameters is needed.

**Recipe.** Scale features; start with RBF; grid search C and γ on log scales (e.g. $10^{-3}$ to $10^3$); use LinearSVC or SGDClassifier(hinge) for large sparse data; \`class_weight="balanced"\` for imbalance.

**Probabilities.** SVMs output scores, not probabilities; \`probability=True\` adds Platt scaling via internal CV (slow, sometimes inconsistent with predict). Use decision_function for ranking.
`,
  traps: [
    { trap: "Large C means more regularisation.", why: "The opposite: C multiplies the violation penalty. Large C tolerates fewer violations (narrow margin, overfit risk); small C regularises more." },
    { trap: "SVMs give probabilities like logistic regression.", why: "They output distances to the boundary. Probabilities need an extra calibration step (Platt scaling)." },
    { trap: "The kernel trick makes SVMs scale to any data size.", why: "It avoids building features, but the kernel matrix is n × n and training is super-linear in n. For millions of rows use linear SVMs or other models." },
  ],
  say: {
    prompt: "Explain how an SVM works, including the kernel trick.",
    secs: 60,
    check: ["Maximum-margin separating hyperplane; margin = 2/‖w‖", "Support vectors determine the boundary", "Soft margin with hinge loss; C trades margin width vs violations (large C = less regularisation)", "Kernel trick: inner products in a feature space; RBF and γ", "Scaling, cost O(n²)–O(n³), no native probabilities"],
    followups: [
      { q: "SVM vs logistic regression?", a: "Both are linear classifiers with different losses: hinge (zero beyond the margin, so only support vectors matter) vs log loss (every point matters, gives probabilities). Similar accuracy usually; LR for probabilities and scale, SVM with kernels for non-linear medium-sized problems." },
      { q: "What does γ do in an RBF kernel?", a: "It sets how quickly a point's influence decays with distance. High γ: very local, wiggly boundary (overfit). Low γ: smooth, near-linear boundary." },
      { q: "Why is the kernel trick possible?", a: "The dual formulation depends on the data only through inner products x_i·x_j, so replacing them with a kernel function computes inner products in a high-dimensional feature space implicitly." },
    ],
    answer: `An SVM finds the separating hyperplane with the largest margin, the gap to the nearest points of each class, which is 2 over the norm of w, so it minimises ‖w‖. Only the points on or inside the margin, the support vectors, determine it. With overlapping classes it uses a soft margin: hinge-loss penalties for violations, weighted by C. Large C means fewer violations and a narrower margin, so less regularisation.

For non-linear boundaries, the dual problem depends on the data only through inner products, so I can swap in a kernel, typically RBF, which acts like an inner product in a very high-dimensional space without building it. γ controls how local each support vector's influence is. I'd scale features, tune C and γ on a log grid, and remember it's slow beyond tens of thousands of rows and doesn't give probabilities natively.`,
    avoid: ["“Larger C means stronger regularisation”", "Claiming kernels make SVMs scale to huge data"],
  },
  terms: [["Margin", "Distance between the boundary and the closest points; 2/‖w‖ for both sides."], ["Support vectors", "Points on or inside the margin; they define the boundary."], ["Hinge loss", "max(0, 1 − y·f(x))."], ["Kernel trick", "Replace inner products with K(x, x') to work in an implicit feature space."]],
  sources: [S.sklSVM, S.islr],
});
Q({ id: "cml-svm-1", d: 1, secs: 30, prompt: "A linear SVM has w = (3, 4). Total margin width 2/‖w‖?", answer: 0.4, tol: 0.002, explain: "‖w‖ = 5; 2/5 = 0.4.", py: "import math\nanswer = 2/math.hypot(3,4)" });
Q({ id: "cml-svm-2", d: 1, secs: 30, prompt: "Hinge loss for y = +1 and score f(x) = 0.3?", answer: 0.7, tol: 0.002, explain: "max(0, 1 − 0.3) = 0.7: correct side, but inside the margin.", py: "answer = max(0, 1 - 1*0.3)" });
Q({ id: "cml-svm-3", d: 2, secs: 45, prompt: "RBF kernel with γ = 0.5 between two points at squared distance 2. Kernel value? (3 decimals)", answer: 0.368, tol: 0.002, explain: "exp(−0.5 × 2) = e⁻¹ = 0.368.", py: "import math\nanswer = math.exp(-0.5*2)" });
Q({ id: "cml-svm-4", d: 2, secs: 45, prompt: "Hinge loss for y = −1 and score f(x) = 0.4?", answer: 1.4, tol: 0.002, explain: "max(0, 1 − (−1)(0.4)) = 1.4: wrong side of the boundary.", py: "answer = max(0, 1 - (-1)*0.4)" });
C("cml-svm-c1", "C in an SVM", "Large C: few violations, narrow margin, less regularisation. Small C: wide margin, more regularisation.");
C("cml-svm-c2", "RBF γ", "High γ: local, wiggly (overfit). Low γ: smooth, near-linear.");

// ───────────────────────── Unsupervised learning ─────────────────────────

L("cml-kmeans", UN, "k-means clustering", "Lloyd's algorithm, choosing k, k-means++, and when clusters aren't round.", {
  kind: "concept", mins: 25, prereq: ["cml-missing-scaling"],
  hook: "Marketing wants 'customer segments' from transaction data. You run k-means with k = 5. How do you defend 5, and what shapes will it miss?",
  intuition: `
**The situation.** No labels, just customers described by spend, frequency and recency. You want groups whose members look alike.

**The idea (Lloyd's algorithm).** Pick $k$ centres. Repeat: assign every point to its nearest centre; move each centre to the mean of its points. Each step can only lower the total within-cluster squared distance (**inertia**), so it converges, but to a local optimum that depends on the starting centres.

**What k-means assumes.** Clusters are roughly round, similar in size and spread, and separated by distance in the (scaled) feature space. Rings, crescents, very different densities or elongated clusters break it; DBSCAN, Gaussian mixtures or spectral clustering handle those.
`,
  maths: `
**In one breath.** Minimise inertia $\\sum_{k}\\sum_{i \\in C_k}\\|x_i - \\mu_k\\|^2$; alternate assignment and mean update; initialise with k-means++; choose $k$ with the elbow, silhouette or the business use.

**Worked example (1-D).** Points 1, 2, 10, 11, 12; centres 0 and 6. Assign: {1, 2} → 0, {10, 11, 12} → 6. Update: centres 1.5 and 11. Inertia: $0.25 + 0.25 + 1 + 0 + 1 = 2.5$. Next assignment changes nothing: converged.

**k-means++.** Choose the first centre at random, then each next centre with probability proportional to its squared distance from the nearest chosen centre. Spreads the starts out; gives an $O(\\log k)$-approximation in expectation. Still run several restarts (n_init) and keep the lowest inertia.

**Choosing k.**

- **Elbow:** plot inertia against $k$; look for where the drop flattens. Inertia always falls with $k$, so never pick the minimum.
- **Silhouette:** $s = (b - a)/\\max(a, b)$, with $a$ = mean distance to own cluster, $b$ = to the nearest other cluster; ranges −1 to 1, higher is better.
- **Usefulness:** segments the business can act on, stable across resamples.

**Cost.** $O(nkp)$ per iteration; MiniBatchKMeans for large $n$.
`,
  practice: `
**Recipe.** Scale features (or log-transform money); consider PCA first if $p$ is large; k-means++ with n_init ≥ 10; compare a few $k$ with silhouette and stability; profile each cluster (means, sizes) and name it.

**Alternatives.** Gaussian mixture models (soft assignments, elliptical clusters), DBSCAN/HDBSCAN (arbitrary shapes, finds outliers, no $k$), hierarchical clustering (dendrogram, choose the cut later).
`,
  traps: [
    { trap: "Choose the k with the lowest inertia.", why: "Inertia always decreases with k and is 0 when k = n. Look for an elbow, use silhouette, and check usefulness." },
    { trap: "k-means finds the natural groups in any data.", why: "It always returns k convex blobs, even for uniform noise or concentric rings. Check whether the structure is real (stability, silhouette, visualisation)." },
    { trap: "One run is enough.", why: "Results depend on initialisation; use k-means++ and several restarts, keeping the best inertia." },
  ],
  say: {
    prompt: "Explain k-means and how you'd choose the number of clusters.",
    secs: 45,
    check: ["Alternate: assign to nearest centre, recompute means; minimises inertia", "Local optimum: k-means++ and multiple restarts", "Scale features; assumes round, similar-sized clusters", "Choose k: elbow, silhouette, stability, business use", "Alternatives for other shapes: DBSCAN, GMM, hierarchical"],
    followups: [
      { q: "Where does k-means fail?", a: "Non-convex shapes (rings, moons), clusters of very different size or density, elongated clusters, outliers (they drag means), and unscaled features." },
      { q: "k-means vs Gaussian mixture models?", a: "GMMs give soft (probabilistic) assignments and allow elliptical clusters with their own covariance; k-means is the hard-assignment, equal-spherical-variance special case." },
      { q: "How do you evaluate clusters without labels?", a: "Internal metrics (silhouette, Davies–Bouldin), stability across bootstrap samples, and whether the clusters differ in ways that matter for the decision they feed." },
    ],
    answer: `k-means picks k centres and alternates two steps: assign each point to its nearest centre, then move each centre to the mean of its points. That monotonically lowers the within-cluster sum of squares and converges to a local optimum, so I use k-means++ initialisation and several restarts.

It assumes roughly spherical, similar-sized clusters in a scaled feature space, so I scale or log-transform first. For k, inertia always falls as k grows, so I look for an elbow, compare silhouette scores, check stability across resamples, and make sure the segments are actionable. If clusters are irregular or I need outlier detection, I'd use DBSCAN, HDBSCAN or a Gaussian mixture instead.`,
    avoid: ["Picking k by minimum inertia", "Running k-means on unscaled features"],
  },
  terms: [["Inertia", "Within-cluster sum of squared distances to centroids."], ["k-means++", "Seeding that spreads initial centres apart."], ["Silhouette", "(b − a)/max(a, b): how much closer a point is to its own cluster than the next."]],
  sources: [S.sklClu, S.islr],
});
Q({ id: "cml-km-1", d: 2, secs: 90, prompt: "1-D points 1, 2, 10, 11, 12 with initial centres 0 and 6. After one assignment and one centre update, what is the inertia?", answer: 2.5, tol: 0.005, explain: "Clusters {1, 2} and {10, 11, 12}; centres 1.5 and 11; inertia 0.25 + 0.25 + 1 + 0 + 1 = 2.5.", py: "import numpy as np\nx = np.array([1,2,10,11,12.]); c = np.array([0,6.])\na = np.argmin(abs(x[:,None]-c[None]),1)\nc = np.array([x[a==k].mean() for k in range(2)])\nanswer = float(sum((x-c[a])**2))", packages: ["numpy"] });
Q({ id: "cml-km-2", d: 2, secs: 60, prompt: "For a point, mean distance to its own cluster a = 2 and to the nearest other cluster b = 5. Silhouette value?", answer: 0.6, tol: 0.002, explain: "(5 − 2)/max(2, 5) = 0.6.", py: "answer = (5-2)/max(2,5)" });
Q({ id: "cml-km-3", d: 1, secs: 30, prompt: "Which dataset will k-means (k = 2) cluster worst?", options: ["Two well-separated round blobs", "Two concentric rings", "Two blobs of equal size, slightly overlapping", "Two blobs after standardising features"], answer: 1, explain: "Rings aren't convex; k-means splits them down the middle. DBSCAN or spectral clustering recover rings.", py: "answer = 1" });
C("cml-km-c1", "k-means assumptions", "Convex, roughly spherical, similar-sized clusters in a scaled space.");
C("cml-km-c2", "Choosing k", "Elbow in inertia, silhouette, stability, business usefulness. Never minimum inertia.");

L("cml-pca", UN, "Principal component analysis", "Directions of maximum variance, explained variance, and when PCA helps or hurts.", {
  kind: "concept", mins: 25, prereq: ["cml-missing-scaling"],
  hook: "You have 200 correlated bureau variables. PCA keeps 20 components with 95% of the variance. Did you keep 95% of the predictive signal?",
  intuition: `
**The situation.** Many features move together (balances across accounts, utilisation ratios). They add redundancy, slow models, and make k-NN and clustering worse.

**The idea.** Rotate the coordinate system so the first axis points along the direction where the data varies most, the second along the most remaining variance at right angles to the first, and so on. Keep the first few axes and drop the rest. Because the axes are uncorrelated, you get a compact, decorrelated summary.

**What PCA doesn't know.** It never looks at the target. The direction of greatest variance can be useless for prediction, and a low-variance direction can be exactly what separates defaulters. Variance kept ≠ signal kept.
`,
  maths: `
**In one breath.** Centre (and usually standardise) $X$; the principal directions are eigenvectors of the covariance $\\Sigma = \\frac1{n}X^\\top X$; eigenvalue $\\lambda_k$ = variance along direction $k$; explained-variance ratio $\\lambda_k/\\sum_j\\lambda_j$; computed by SVD $X = U S V^\\top$.

**Worked examples.**

- Eigenvalues 4, 2, 1, 0.5, 0.5: the first two explain $6/8 = 75\\%$. To reach 90% you need 4 components (cumulative 50%, 75%, 87.5%, 93.75%).
- Covariance $\\begin{pmatrix}2 & 1\\\\ 1 & 2\\end{pmatrix}$ has eigenvalues 3 and 1; the first direction is $(1, 1)/\\sqrt2$: the two features mostly move together.

**SVD view.** With centred $X = USV^\\top$, columns of $V$ are the directions, scores are $XV = US$, and $\\lambda_k = s_k^2/n$. Keeping $k$ components gives the best rank-$k$ approximation of $X$ in squared error (Eckart–Young).

**Scaling.** PCA on raw features is dominated by large-unit features (rupees vs ratios). Standardise unless the features share units and their scale is meaningful.

**Relatives.** Kernel PCA (non-linear), truncated SVD/LSA (sparse text, no centring), t-SNE and UMAP (non-linear, for visualisation only; distances between far clusters aren't meaningful).
`,
  practice: `
**Use it for** compression before k-NN/clustering, removing multicollinearity for linear models, visualising high-dimensional data in 2-D, denoising, speeding up training.

**Choose the number of components** by cumulative explained variance (e.g. 90–95%), a scree plot elbow, or, best, the downstream validation score.

**Pipeline.** Fit PCA on training folds only (it's a learned transform). Interpretation is harder: each component mixes all features; inspect loadings.
`,
  traps: [
    { trap: "Keeping 95% of the variance keeps 95% of the predictive information.", why: "PCA ignores the target. A small-variance direction can carry the signal. Validate downstream performance, or use supervised reduction (PLS, feature selection)." },
    { trap: "PCA doesn't need scaling because it's just a rotation.", why: "The rotation is chosen by variance, which depends on units. Unscaled, the largest-unit feature dominates PC1." },
    { trap: "Use t-SNE clusters as features or evidence of groups.", why: "t-SNE preserves local neighbourhoods only; cluster sizes and between-cluster distances are artefacts of its settings. Use it to look, not to measure." },
  ],
  say: {
    prompt: "Explain PCA and when you would and wouldn't use it.",
    secs: 45,
    check: ["Orthogonal directions of maximum variance; eigenvectors of the covariance / SVD", "Explained variance ratio = eigenvalue share; choose k by cumulative variance or downstream score", "Standardise first; fit on training data only", "Unsupervised: variance ≠ predictive signal", "Uses: compression, decorrelation, visualisation; loses interpretability"],
    followups: [
      { q: "How is PCA related to SVD?", a: "For centred X = USVᵀ, V's columns are the principal directions, US are the scores, and eigenvalues of the covariance are s²/n. Libraries compute PCA via SVD for numerical stability." },
      { q: "PCA vs feature selection?", a: "PCA builds new features as combinations of all originals (good compression, poor interpretability); feature selection keeps a subset of the originals (interpretable, may lose shared signal)." },
      { q: "Does PCA help tree models?", a: "Rarely. Trees handle correlated features and don't need decorrelation; rotation can even hurt because axis-aligned splits on original features may be more meaningful." },
    ],
    answer: `PCA finds orthogonal directions that capture the most variance in the data, the eigenvectors of the covariance matrix, computed in practice with an SVD of the centred data. Each eigenvalue is the variance along its direction, so I keep the first k components that reach, say, 90–95% cumulative explained variance, or better, the k that gives the best downstream validation score.

I standardise first, because variance depends on units, and fit PCA inside the training pipeline. It's useful for compressing correlated features before k-NN, clustering or linear models, and for 2-D visualisation. The big caveat is that it's unsupervised: the high-variance directions aren't necessarily the predictive ones, and the components are harder to explain than original features.`,
    avoid: ["“PCA keeps the most important features”", "PCA on unscaled mixed-unit data"],
  },
  terms: [["Principal component", "Direction of maximum remaining variance, orthogonal to earlier ones."], ["Explained variance ratio", "λ_k / Σλ."], ["Loadings", "Weights of the original features in a component."], ["Scree plot", "Eigenvalues against component number."]],
  sources: [S.sklDec, S.islr],
});
Q({ id: "cml-pca-1", d: 1, secs: 30, prompt: "Covariance eigenvalues are 4, 2, 1, 0.5, 0.5. Fraction of variance explained by the first two components?", answer: 0.75, tol: 0.002, explain: "(4 + 2)/8 = 0.75.", py: "e = [4,2,1,0.5,0.5]\nanswer = sum(e[:2])/sum(e)" });
Q({ id: "cml-pca-2", d: 2, secs: 45, prompt: "Same eigenvalues (4, 2, 1, 0.5, 0.5). Minimum number of components for at least 90% explained variance?", answer: 4, tol: 0.5, explain: "Cumulative: 50%, 75%, 87.5%, 93.75% → 4.", py: "import numpy as np\ne = np.array([4,2,1,0.5,0.5]); c = np.cumsum(e)/e.sum()\nanswer = int(np.argmax(c >= 0.9) + 1)", packages: ["numpy"] });
Q({ id: "cml-pca-3", d: 2, secs: 60, prompt: "Covariance matrix [[2, 1], [1, 2]]. Largest eigenvalue?", answer: 3, tol: 0.005, explain: "Eigenvalues 2 ± 1 = 3 and 1; direction (1, 1)/√2.", py: "import numpy as np\nanswer = float(max(np.linalg.eigvalsh([[2,1],[1,2]])))", packages: ["numpy"] });
Q({ id: "cml-pca-4", d: 1, secs: 30, prompt: "Features are income (₹, sd ≈ 3,00,000) and age (years, sd ≈ 10). Without scaling, PC1 is essentially…", options: ["age", "income", "an equal mix", "undefined"], answer: 1, explain: "Variance is dominated by income's units, so PC1 ≈ the income axis.", py: "import numpy as np\nrng = np.random.default_rng(0)\nX = np.c_[rng.normal(0,3e5,1000), rng.normal(0,10,1000)]\nX -= X.mean(0)\nv = np.linalg.svd(X, full_matrices=False)[2][0]\nanswer = int(abs(v[0]) > 0.99)", packages: ["numpy"] });
C("cml-pca-c1", "PCA via SVD", "Centred X = USVᵀ: directions V, scores US, variances s²/n.");
C("cml-pca-c2", "PCA caveat", "Unsupervised: variance kept ≠ predictive signal kept. Standardise first.");

// ───────────────────────── Evaluation metrics ─────────────────────────

L("cml-class-metrics", EV, "Classification metrics", "Confusion matrix, precision, recall, F1/Fβ, and macro vs micro averaging.", {
  kind: "concept", mins: 25,
  hook: "Your fraud model is 99% accurate. Fraud is 1% of transactions. Is the model any good?",
  intuition: `
**The situation.** A model that predicts "not fraud" for every transaction is 99% accurate and catches nothing. Accuracy hides what matters when classes are imbalanced or errors have different costs.

**The idea.** Count the four outcomes in a **confusion matrix**: true positives (caught fraud), false positives (false alarms), false negatives (missed fraud), true negatives. Then ask two questions:

- **Precision:** of the alerts, how many were fraud? (Cost of false alarms: ops time, annoyed customers.)
- **Recall:** of the fraud, how much did we catch? (Cost of misses: money lost.)

Raising the threshold usually raises precision and lowers recall. F1 balances them; Fβ weights recall β times as much as precision. The right metric is the one that matches the cost of each error type.
`,
  maths: `
**In one breath.** Precision $= \\frac{TP}{TP + FP}$, recall $= \\frac{TP}{TP + FN}$, $F_1 = \\frac{2PR}{P + R}$, $F_\\beta = \\frac{(1 + \\beta^2)PR}{\\beta^2P + R}$, specificity $= \\frac{TN}{TN + FP}$.

**Worked example.** TP 80, FP 20, FN 40, TN 860. Precision 0.8, recall 0.667, F1 = 0.727, accuracy 0.94, specificity 0.977. $F_2$ (recall-heavy) = 0.690.

| Metric | Question it answers | Use when |
|---|---|---|
| Accuracy | fraction correct | balanced classes, equal costs |
| Precision | how trustworthy are positive predictions | false alarms are costly (manual review queue) |
| Recall (sensitivity, TPR) | how much of the positive class is found | misses are costly (fraud, disease) |
| Specificity (TNR) | how much of the negative class is cleared | screening |
| F1 / Fβ | single number balancing P and R | one threshold, comparing models |
| Balanced accuracy | mean of per-class recall | imbalance, care about all classes |

**Multiclass averaging.** Macro: average per-class scores (each class counts equally; rare classes matter). Weighted: per-class scores weighted by support. Micro: pool all TP/FP/FN (equals accuracy for single-label multiclass).

**Harmonic mean.** F1 is dragged towards the smaller of P and R: P = 1.0, R = 0.1 gives F1 = 0.18, not 0.55.
`,
  practice: `
**Pick from costs.** Ask what one false positive and one false negative cost; that decides whether you optimise precision, recall, Fβ or expected cost (next lesson).

**Report a few, not one.** Confusion matrix at the chosen threshold, precision and recall, plus a threshold-free metric (PR-AUC or ROC-AUC). For multiclass, a per-class table.

**Operating constraints.** "Recall at 95% precision" or "precision at top 1,000 alerts per day" are often what the business actually needs.
`,
  traps: [
    { trap: "99% accuracy, so the model is good.", why: "With 1% positives, predicting all negative scores 99%. Look at recall, precision and the confusion matrix." },
    { trap: "F1 is the right metric for imbalanced problems.", why: "F1 weights precision and recall equally, which is rarely what costs say. Use Fβ or an explicit cost, and remember F1 ignores true negatives." },
    { trap: "Macro and micro F1 are basically the same.", why: "Micro F1 equals accuracy in single-label multiclass and is dominated by large classes; macro F1 weights every class equally and exposes failures on rare ones." },
  ],
  say: {
    prompt: "How would you evaluate a classifier for fraud detection where fraud is 0.5% of transactions?",
    secs: 45,
    check: ["Accuracy is misleading under imbalance", "Confusion matrix; precision and recall defined in context", "Choose by costs: Fβ, expected cost, or recall at a precision/alert-volume constraint", "Threshold-free view: PR-AUC (more informative than ROC-AUC here)", "Report per-segment / over time"],
    followups: [
      { q: "When would you prefer precision over recall?", a: "When acting on a positive is costly or harmful and misses are tolerable: e.g. auto-blocking accounts, or a small manual-review team that can only handle a few alerts." },
      { q: "Why is F1 a harmonic rather than arithmetic mean?", a: "So it's high only when both precision and recall are high; a model with P = 1, R = 0.1 shouldn't score 0.55." },
      { q: "What does balanced accuracy fix?", a: "It averages recall over classes, so a majority-class predictor gets 0.5 in binary problems instead of the base rate." },
    ],
    answer: `Accuracy is useless here: predicting "no fraud" always scores 99.5%. I'd start from the confusion matrix and look at precision, the share of alerts that are real fraud, and recall, the share of fraud we catch. The threshold sets the trade-off, and I'd choose it from costs: a missed fraud costs the transaction amount, a false alarm costs review time and customer friction, so I'd optimise expected cost or recall subject to a precision or alert-volume limit.

To compare models independently of the threshold I'd use PR-AUC rather than ROC-AUC, because with 0.5% positives ROC-AUC looks great even when precision is poor. I'd also break results down by segment and over time.`,
    avoid: ["Quoting accuracy for an imbalanced problem", "“F1 is always the right metric”"],
  },
  terms: [["Precision", "TP/(TP + FP)."], ["Recall / TPR / sensitivity", "TP/(TP + FN)."], ["Specificity / TNR", "TN/(TN + FP)."], ["Fβ", "Weighted harmonic mean; β > 1 favours recall."]],
  sources: [S.sklEval],
});
Q({ id: "cml-cm-1", d: 1, secs: 45, prompt: "TP = 80, FP = 20, FN = 40, TN = 860. F1 score? (3 decimals)", answer: 0.727, tol: 0.002, explain: "P = 0.8, R = 0.667; F1 = 2PR/(P + R) = 0.727 (= 2TP/(2TP + FP + FN) = 160/220).", py: "tp, fp, fn = 80, 20, 40\nanswer = 2*tp/(2*tp+fp+fn)" });
Q({ id: "cml-cm-2", d: 1, secs: 20, prompt: "2% of examples are positive. Accuracy of a model that always predicts negative?", answer: 0.98, tol: 0.002, explain: "It's right on all negatives.", py: "answer = 0.98" });
Q({ id: "cml-cm-3", d: 2, secs: 60, prompt: "Precision 0.8, recall 2/3. F2 score? (3 decimals)", answer: 0.69, tol: 0.002, explain: "F2 = 5PR/(4P + R) = 5(0.5333)/(3.2 + 0.6667) = 0.690.", py: "P, R = 0.8, 2/3\nanswer = 5*P*R/(4*P+R)" });
Q({ id: "cml-cm-4", d: 2, secs: 60, prompt: "Precision 1.0 and recall 0.1. F1? (3 decimals)", answer: 0.182, tol: 0.002, explain: "2(0.1)/(1.1) = 0.182: the harmonic mean is dragged to the weaker metric.", py: "answer = 2*1.0*0.1/(1.0+0.1)" });
Q({ id: "cml-cm-5", d: 2, secs: 60, prompt: "Three classes with per-class F1 0.9, 0.8 and 0.3 and supports 800, 150, 50. Macro F1? (3 decimals)", answer: 0.667, tol: 0.002, explain: "(0.9 + 0.8 + 0.3)/3 = 0.667. Weighted F1 would be 0.855, hiding the weak rare class.", py: "answer = (0.9+0.8+0.3)/3" });
C("cml-cm-c1", "Precision vs recall", "Precision: of predicted positives, how many are right. Recall: of actual positives, how many we found.");
C("cml-cm-c2", "Macro vs micro", "Macro: mean over classes (rare classes count). Micro: pooled counts (= accuracy for single-label multiclass).");

L("cml-roc-pr", EV, "ROC, PR curves and choosing a threshold", "Threshold-free metrics, why PR beats ROC under imbalance, and cost-based thresholds.", {
  kind: "concept", mins: 30, prereq: ["cml-class-metrics"],
  hook: "Two fraud models both have ROC-AUC 0.95. At the threshold you'd actually use, one has 3× the precision of the other. How?",
  intuition: `
**The situation.** A classifier outputs scores. Every threshold gives a different confusion matrix. You want to compare models before choosing a threshold, then choose the threshold well.

**ROC curve:** true positive rate (recall) against false positive rate as the threshold sweeps. **ROC-AUC** is the probability that a random positive gets a higher score than a random negative. It ignores the class ratio.

**PR curve:** precision against recall. With rare positives, a small false-positive *rate* is still a huge *number* of false alarms compared to the few true positives, and precision exposes that. **PR-AUC** (average precision) has a baseline equal to the positive rate, not 0.5.

**Threshold.** Pick it from costs, capacity, or a precision/recall target, never just 0.5.

**Play.** A fraud model with ₹5,000 per miss and ₹100 per false alarm: watch the cost curve and where its minimum is.
`,
  widget: "threshold",
  maths: `
**In one breath.** TPR $= \\frac{TP}{P}$, FPR $= \\frac{FP}{N}$; AUC $= P(s^+ > s^-)$; with calibrated probabilities, flag when $p > \\frac{C_{FP}}{C_{FP} + C_{FN}}$.

**AUC as ranking.** Positives scored (0.9, 0.8, 0.4), negatives (0.7, 0.3, 0.2, 0.1). Of the 12 positive–negative pairs, the positive wins 11: AUC $= 11/12 = 0.917$. It's the normalised Mann–Whitney U statistic.

**Why ROC flatters under imbalance.** 1,000 positives, 99,000 negatives. At TPR 0.8 and FPR 0.02: 800 TP and 1,980 FP. ROC sees FPR 2% (looks excellent); precision is 800/2780 = 0.29.

**Cost-optimal threshold.** Flag when expected cost of letting it go exceeds expected cost of flagging: $p\\,C_{FN} > (1 - p)\\,C_{FP}$ → $p > C_{FP}/(C_{FP} + C_{FN})$. With ₹100 vs ₹5,000: flag anything above 0.0196. Requires calibrated probabilities.

**Baselines.** Random classifier: ROC-AUC 0.5; PR-AUC ≈ positive rate (1% positives → 0.01).

| | ROC-AUC | PR-AUC |
|---|---|---|
| Depends on class ratio | no | yes |
| Random baseline | 0.5 | prevalence |
| Focus | ranking overall | quality of the top of the ranking |
| Use when | balanced, or comparing across datasets | rare positives, alerts / retrieval |
`,
  practice: `
**Choosing thresholds in practice.**

- **Cost-based:** minimise expected cost on validation data (needs calibrated scores; check with a reliability plot, fix with Platt/isotonic).
- **Capacity-based:** the ops team reviews 500 cases a day → threshold = 500th highest score.
- **Constraint-based:** maximise recall subject to precision ≥ 0.9 (or vice versa).

**Report.** PR-AUC and ROC-AUC on validation, then the confusion matrix at the chosen threshold. Re-check thresholds when base rates drift.

**Calibration.** AUC measures ranking only; a model can have great AUC and terrible probabilities. Use Brier score / log loss and calibration curves when probabilities feed decisions.
`,
  traps: [
    { trap: "ROC-AUC 0.95 means the model is excellent for fraud.", why: "ROC uses FPR, which stays tiny when negatives vastly outnumber positives, even with many false alarms. Check PR-AUC and precision at the operating point." },
    { trap: "Use threshold 0.5.", why: "0.5 minimises errors only with equal costs and calibrated probabilities. With ₹5,000 misses vs ₹100 false alarms, the optimal cutoff is about 0.02." },
    { trap: "High AUC means good probabilities.", why: "AUC is invariant to any monotone transform of the scores. Calibration is a separate property; measure it separately." },
  ],
  say: {
    prompt: "When would you use PR-AUC instead of ROC-AUC, and how do you choose a classification threshold?",
    secs: 60,
    check: ["ROC: TPR vs FPR; AUC = P(positive ranked above negative); insensitive to class ratio", "PR: precision vs recall; baseline = prevalence; better for rare positives", "Concrete imbalance example (small FPR, many false positives)", "Threshold from costs: p > C_FP/(C_FP + C_FN), or capacity / precision constraint", "Calibration needed for cost-based thresholds"],
    followups: [
      { q: "What is the probabilistic meaning of ROC-AUC?", a: "The probability that a randomly chosen positive receives a higher score than a randomly chosen negative (ties count half): the normalised Mann–Whitney U statistic." },
      { q: "Can a model with lower ROC-AUC have higher PR-AUC?", a: "Yes. PR-AUC focuses on the top of the ranking; a model that's sharper among its highest scores but worse lower down can win on PR-AUC and lose on ROC-AUC." },
      { q: "How do you calibrate scores?", a: "Fit Platt scaling (a logistic regression on the scores) or isotonic regression on a held-out set; check with a reliability diagram and Brier score." },
    ],
    answer: `ROC plots recall against the false-positive rate, and ROC-AUC is the probability a random positive outranks a random negative. It doesn't depend on class balance, which is good for comparing across datasets, but with rare positives a tiny FPR can still mean thousands of false alarms. PR curves plot precision against recall, their baseline is the prevalence, and they show the quality of the top of the ranking, so I use PR-AUC for fraud, rare-event and retrieval problems.

For the threshold I start from costs: with calibrated probabilities, flag when p exceeds C_FP over C_FP plus C_FN, about 0.02 if a miss costs ₹5,000 and a false alarm ₹100. Otherwise I pick it from review capacity or a precision target on validation data, and revisit it when base rates drift.`,
    avoid: ["“ROC-AUC is always the right metric”", "Defaulting to 0.5"],
  },
  terms: [["ROC-AUC", "Area under TPR-vs-FPR; P(score⁺ > score⁻)."], ["PR-AUC / average precision", "Area under precision-vs-recall; baseline = prevalence."], ["Calibration", "Predicted probabilities match observed frequencies."]],
  sources: [S.sklEval],
});
Q({ id: "cml-roc-1", d: 2, secs: 90, prompt: "Positive scores (0.9, 0.8, 0.4), negative scores (0.7, 0.3, 0.2, 0.1). ROC-AUC? (3 decimals)", answer: 0.917, tol: 0.002, explain: "Positive wins 11 of 12 pairs (0.4 loses to 0.7).", py: "from sklearn.metrics import roc_auc_score\nanswer = roc_auc_score([1,1,1,0,0,0,0], [0.9,0.8,0.4,0.7,0.3,0.2,0.1])", packages: ["scikit-learn"] });
Q({ id: "cml-roc-2", d: 2, secs: 60, prompt: "A false positive costs ₹100 and a false negative ₹5,000. With calibrated probabilities, the cost-optimal threshold is? (4 decimals)", answer: 0.0196, tol: 0.0002, explain: "C_FP/(C_FP + C_FN) = 100/5100 = 0.0196.", py: "answer = 100/(100+5000)" });
Q({ id: "cml-roc-3", d: 2, secs: 60, prompt: "1,000 positives and 99,000 negatives. At TPR 0.8 and FPR 0.02, what is precision? (3 decimals)", answer: 0.288, tol: 0.002, explain: "TP = 800, FP = 1,980; 800/2,780 = 0.288, despite a 'great' 2% FPR.", py: "tp = 0.8*1000; fp = 0.02*99000\nanswer = tp/(tp+fp)" });
Q({ id: "cml-roc-4", d: 1, secs: 30, prompt: "Approximate PR-AUC of a random classifier when 1% of examples are positive?", answer: 0.01, tol: 0.002, explain: "Random precision equals the positive rate at every recall.", py: "import numpy as np\nfrom sklearn.metrics import average_precision_score\nrng = np.random.default_rng(0)\ny = (rng.random(200000) < 0.01).astype(int)\nanswer = float(average_precision_score(y, rng.random(200000)))", packages: ["scikit-learn"] });
Q({ id: "cml-roc-5", d: 1, secs: 30, prompt: "You apply log() to all of a model's scores (all positive). ROC-AUC…", options: ["increases", "decreases", "stays the same", "becomes undefined"], answer: 2, explain: "AUC depends only on the ranking, which a monotone transform preserves.", py: "answer = 2" });
C("cml-roc-c1", "Cost-optimal threshold", "Flag if p > C_FP/(C_FP + C_FN) (calibrated p).");
C("cml-roc-c2", "PR vs ROC", "Rare positives: PR-AUC (baseline = prevalence). ROC-AUC ignores class ratio and flatters.");

// ───────────────────────── Validation and pitfalls ─────────────────────────

L("cml-cv-leakage", VP, "Cross-validation and data leakage", "k-fold, stratified, grouped and time-series splits, nested CV, and the leaks that inflate scores.", {
  kind: "concept", mins: 30, prereq: ["gen-diagnose"],
  hook: "Validation AUC 0.97, production AUC 0.68. Nothing is wrong with the model code. Where did the 0.29 come from?",
  intuition: `
**The situation.** Almost every "too good to be true" model is leakage: information available during training and validation that won't be there at prediction time.

**Cross-validation** estimates performance on unseen data by rotating which part of the data is held out. The rule: **the split must mimic how the model will be used**.

- Rows independent → k-fold (stratified for classification, so each fold has the same class mix).
- Several rows per customer/patient/device → **group** k-fold, so one customer never appears in both train and validation.
- Predicting the future → **time-based** splits: train on the past, validate on a later period.

**Leakage** comes in a few recurring shapes: features computed with future data, features derived from the target, preprocessing fitted on all data, duplicates across the split, and tuning on the test set.
`,
  maths: `
**In one breath.** $k$-fold: train $k$ times on $(k-1)/k$ of the data, average the $k$ scores (report the SD too); nested CV: an inner loop tunes, an outer loop estimates.

**Fold arithmetic.** 5-fold on 1,000 rows: each model trains on 800 and validates on 200. Leave-one-out: $n$ fits, nearly unbiased but high variance and expensive; 5–10 folds is the usual compromise.

**Nested CV.** Tuning on the same folds you report is optimistic (you picked the configuration that got lucky). Outer 5 folds × inner 4 folds × 10 hyperparameter settings = $5 \\times (4 \\times 10 + 1) = 205$ fits (the +1 refits the best setting on each outer training set).

**Leakage taxonomy.**

| Leak | Example | Fix |
|---|---|---|
| Target leakage | "days in collections" in a default model | only features known at prediction time |
| Temporal leakage | 30-day averages that include the future | point-in-time ("as of") features; time splits |
| Preprocessing leakage | scaler / imputer / encoder / feature selection fitted on all rows | everything inside a Pipeline |
| Group leakage | same customer in train and validation | GroupKFold |
| Duplicate leakage | near-duplicate rows across split | deduplicate before splitting |
| Test-set reuse | many tuning rounds on the test set | hold-out touched once; nested CV |
`,
  practice: `
**Recipe.** Split first (decide the unit: row, customer, time). Put every learned transform in a \`Pipeline\`. Use \`GroupKFold\` / \`TimeSeriesSplit\` as needed. Keep a final hold-out (ideally a later time period) touched once.

**Leak hunting.** Suspiciously high scores; one feature dominating importance; a feature whose meaning involves the outcome; performance that collapses on a time-based split; validation better than training.

**Time series.** Expanding or sliding windows; leave a gap between train and validation if labels mature slowly (e.g. 90-day default flags need 90 days to observe).
`,
  traps: [
    { trap: "Shuffle and k-fold everything.", why: "With repeated entities or time dependence, random folds put near-identical rows on both sides. Split by group or time to match deployment." },
    { trap: "I scaled before CV, but scaling is harmless.", why: "Scaling leaks little; imputers, target encoders, oversampling and feature selection fitted outside CV leak a lot. Treat all of them the same way: inside the pipeline." },
    { trap: "The CV score after tuning is my expected production score.", why: "Choosing the best of many configurations on the same folds is optimistic. Use nested CV or a final untouched hold-out." },
  ],
  say: {
    prompt: "Your model has 0.97 validation AUC but 0.68 in production. How do you investigate?",
    secs: 60,
    check: ["Suspect leakage first: target-derived or future-information features", "Check preprocessing fitted outside CV (encoders, imputers, selection, oversampling)", "Check the split: groups/customers or time overlap; duplicates", "Compare training vs serving feature computation (skew) and drift", "Re-validate with a time-based / grouped split and point-in-time features"],
    followups: [
      { q: "Why is nested cross-validation needed?", a: "Because selecting hyperparameters on the same folds you report from picks the luckiest configuration; the outer loop evaluates the whole tuning procedure on data it never saw." },
      { q: "How should you cross-validate a time-series model?", a: "Rolling or expanding windows: train on data up to t, validate on a later window, move forward; never shuffle, and leave a gap if labels take time to mature." },
      { q: "Why stratify folds?", a: "So each fold has the same class proportions; with rare classes, random folds can have very few or no positives, making scores noisy." },
    ],
    answer: `A gap that big is almost always leakage or a mismatch between how I validated and how the model is used. I'd first look at the top features for anything that encodes the outcome or uses information from after the prediction time, like a collections status or an aggregate that includes the future. Then I'd check the pipeline: encoders, imputers, feature selection or oversampling fitted on all data before cross-validation.

Next, the split itself: if the same customers or time periods appear on both sides, random k-fold flatters the model, so I'd redo validation with grouped and time-based splits. Finally I'd compare features computed in training with what's logged at serving time, for skew and drift. Then I'd rebuild with point-in-time features, everything inside a pipeline, and a final hold-out from a later period.`,
    avoid: ["Blaming the model architecture first", "Tuning on the test set to 'fix' the gap"],
  },
  terms: [["Stratified k-fold", "Folds preserve class proportions."], ["GroupKFold", "No group appears in both training and validation."], ["Nested CV", "Inner loop tunes, outer loop estimates."], ["Point-in-time feature", "Computed only from data available at prediction time."]],
  sources: [S.sklCV],
});
Q({ id: "cml-cv-1", d: 1, secs: 20, prompt: "5-fold CV on 1,000 rows. How many rows does each model train on?", answer: 800, tol: 0.5, explain: "4 of 5 folds: 800 rows.", py: "answer = 1000*4/5" });
Q({ id: "cml-cv-2", d: 2, secs: 60, prompt: "Nested CV: 5 outer folds, 4 inner folds, 10 hyperparameter settings, plus one refit of the best setting per outer fold. Total model fits?", answer: 205, tol: 0.5, explain: "5 × (4 × 10 + 1) = 205.", py: "answer = 5*(4*10+1)" });
Q({ id: "cml-cv-3", d: 1, secs: 30, prompt: "Each patient has 10–40 scans. Which splitter avoids leakage?", options: ["KFold(shuffle=True)", "StratifiedKFold", "GroupKFold with patient ID", "LeaveOneOut"], answer: 2, explain: "Scans from one patient are correlated; they must all be in the same fold.", py: "answer = 2" });
Q({ id: "cml-cv-4", d: 3, secs: 120, prompt: "1,000 rows of pure noise (5,000 random features, random labels). You select the 20 features most correlated with the label on all rows, then run 5-fold CV logistic regression. Is mean CV accuracy closer to 0.5 or clearly above it?", options: ["About 0.5", "Clearly above 0.5"], answer: 1, explain: "The selection used every row's label, so the chosen features fit noise that the validation folds share. Inside-CV selection would give ≈ 0.5.", py: "import numpy as np\nfrom sklearn.linear_model import LogisticRegression\nfrom sklearn.model_selection import cross_val_score\nrng = np.random.default_rng(0)\nX = rng.normal(size=(1000,5000)); y = rng.integers(0,2,1000)\nc = np.abs(((X-X.mean(0))*(y-y.mean())[:,None]).sum(0))\nXs = X[:, np.argsort(c)[-20:]]\ns = cross_val_score(LogisticRegression(max_iter=1000), Xs, y, cv=5).mean()\nanswer = 1 if s > 0.55 else 0", packages: ["scikit-learn"] });
C("cml-cv-c1", "Split to match deployment", "Rows: (stratified) k-fold. Entities: GroupKFold. Future: time splits.");
C("cml-cv-c2", "Leakage shapes", "Target-derived, future info, preprocessing outside CV, group overlap, duplicates, test-set reuse.");

L("cml-imbalance", VP, "Class imbalance", "Class weights, resampling, thresholds, metrics, and correcting probabilities after sampling.", {
  kind: "concept", mins: 25, prereq: ["cml-class-metrics", "cml-roc-pr"],
  hook: "Fraud is 0.2% of transactions. Should you SMOTE the data to 50/50, or is there a simpler fix?",
  intuition: `
**The situation.** Rare positives: fraud, default, churn, disease. Models trained naively predict the majority and look accurate.

**The idea.** Imbalance is mostly a problem of **evaluation and decision threshold**, not of learning. A well-specified probabilistic model trained on imbalanced data still ranks well; what goes wrong is that you judge it by accuracy and cut it at 0.5. Fix those first:

1. **Right metric:** PR-AUC, recall at fixed precision, expected cost.
2. **Right threshold:** from costs or capacity.

Then, if the model still underfits the minority class:

3. **Class weights:** make each positive count more in the loss.
4. **Resampling:** undersample negatives (faster training) or oversample positives / SMOTE (synthetic positives). Do it inside training folds only.

Resampling and weights change the model's probabilities; correct them if you need real probabilities.
`,
  maths: `
**In one breath.** Balanced weight for class $c$: $w_c = \\frac{n}{K\\,n_c}$; after keeping a fraction $\\beta$ of negatives, correct probabilities with $p = \\frac{\\beta p_s}{\\beta p_s - p_s + 1}$.

**Class weights.** $n = 10{,}000$, 2 classes, 200 positives: $w_+ = 10000/(2 \\times 200) = 25$, $w_- = 10000/(2 \\times 9800) \\approx 0.51$. Each positive counts like 25 rows.

**Undersampling correction.** Keep all 200 positives and $\\beta = 200/9800$ of the negatives. The model trained on the 50/50 sample says $p_s = 0.5$; the true probability is $p = \\frac{0.0204 \\times 0.5}{0.0204 \\times 0.5 - 0.5 + 1} = 0.02$, the original base rate, as it should be. $p_s = 0.8$ maps to 0.075. Equivalent: shift the log-odds by $\\log\\beta$.

**SMOTE.** For a minority point, pick one of its $k$ minority neighbours and create a synthetic point on the segment between them. Helps some models with very few positives; can blur the boundary and create unrealistic points; must never touch validation data.

| Option | Pros | Cons |
|---|---|---|
| Threshold tuning | free, keeps calibration | needs a decent ranking |
| Class weights | simple, no data change | probabilities shift; tune with CV |
| Undersample majority | fast, big data | discards information; correct probabilities |
| Oversample / SMOTE | more minority signal for some models | overfitting, synthetic artefacts, slower |
| More positive labels | the real fix | costs time/money |
`,
  practice: `
**Recipe.** Stratified splits → PR-AUC / cost metrics → strong baseline (boosting or logistic regression) with no resampling → tune threshold → try class weights (\`class_weight="balanced"\`, \`scale_pos_weight\` in XGBoost ≈ negatives/positives) → resampling only if it improves validation PR-AUC.

**Anomaly framing.** With extremely few or no labelled positives, consider anomaly detection (isolation forest, autoencoders) plus rules.

**Monitoring.** Base rates drift (fraud spikes, policy changes); recheck thresholds and calibration.
`,
  traps: [
    { trap: "Always rebalance to 50/50 before training.", why: "Often unnecessary: the ranking is learnt fine from imbalanced data, and rebalancing distorts probabilities. Fix the metric and threshold first; rebalance only if validation improves." },
    { trap: "SMOTE the whole dataset, then cross-validate.", why: "Synthetic points built from validation rows leak into training, and validation is no longer the real distribution. Resample inside training folds only (imblearn Pipeline)." },
    { trap: "After undersampling, the model's probabilities are the real risk.", why: "They reflect the training ratio. Correct with the β formula or recalibrate on untouched data." },
  ],
  say: {
    prompt: "How do you handle a dataset where only 0.5% of examples are positive?",
    secs: 60,
    check: ["Stratified splits; metrics: PR-AUC, recall at precision, expected cost (not accuracy)", "Threshold from costs / capacity", "Class weights before resampling", "Resampling (under/over/SMOTE) inside training folds only", "Correct or recalibrate probabilities after resampling"],
    followups: [
      { q: "What does class_weight='balanced' do?", a: "It weights each class by n/(K·n_c) in the loss, so the minority class contributes as much total loss as the majority. Equivalent in expectation to oversampling without duplicating rows." },
      { q: "When does SMOTE hurt?", a: "With noisy or overlapping classes (it interpolates into the majority region), high-dimensional or categorical data, and whenever it's applied before splitting. Tree ensembles often gain little from it." },
      { q: "How do you fix probabilities after undersampling?", a: "Adjust each prediction by the sampling rate β: p = βp_s/(βp_s − p_s + 1), i.e. add log β to the log-odds, or recalibrate on an untouched validation set." },
    ],
    answer: `First I'd make sure I'm measuring the right thing: stratified splits, and PR-AUC, recall at a required precision, or expected cost instead of accuracy. A good probabilistic model often ranks rare positives well already, so the next fix is the threshold, chosen from costs or review capacity.

If the model still neglects the minority, I'd try class weights, then resampling: undersampling the majority for speed or oversampling or SMOTE for very few positives, always inside the training folds so validation stays real. Resampling distorts probabilities, so I'd correct them for the sampling rate or recalibrate. And if possible I'd get more labelled positives, which beats any resampling trick.`,
    avoid: ["“I'd SMOTE to 50/50” as the first step", "Resampling before the train/validation split"],
  },
  terms: [["Class weights", "Per-class multipliers in the loss."], ["Undersampling / oversampling", "Removing majority rows / duplicating or synthesising minority rows."], ["SMOTE", "Synthetic minority points interpolated between minority neighbours."]],
  sources: [S.sklEval, S.sklCV],
});
Q({ id: "cml-imb-1", d: 1, secs: 45, prompt: "10,000 rows, 2 classes, 200 positives. Balanced class weight for the positive class?", answer: 25, tol: 0.05, explain: "n/(K·n_pos) = 10000/(2 × 200) = 25.", py: "import numpy as np\nfrom sklearn.utils.class_weight import compute_class_weight\ny = np.r_[np.ones(200), np.zeros(9800)]\nanswer = float(compute_class_weight('balanced', classes=np.array([0.,1.]), y=y)[1])", packages: ["scikit-learn"] });
Q({ id: "cml-imb-2", d: 3, secs: 120, prompt: "You kept all 200 positives and 200 of 9,800 negatives. A model trained on this sample predicts p_s = 0.8. Corrected probability on the original population? (3 decimals)", answer: 0.075, tol: 0.002, explain: "β = 200/9800; p = βp_s/(βp_s − p_s + 1) = 0.01633/0.21633 = 0.075.", py: "b = 200/9800; ps = 0.8\nanswer = b*ps/(b*ps - ps + 1)" });
Q({ id: "cml-imb-3", d: 2, secs: 45, prompt: "XGBoost: 9,800 negatives and 200 positives. A common starting value for scale_pos_weight?", answer: 49, tol: 0.5, explain: "negatives/positives = 49.", py: "answer = 9800/200" });
Q({ id: "cml-imb-4", d: 1, secs: 30, prompt: "When should SMOTE be applied?", options: ["Before splitting into train and validation", "Inside each training fold only", "On the test set too, for consistency", "Only to the validation set"], answer: 1, explain: "Synthetic points must come only from training rows; validation must reflect the real distribution.", py: "answer = 1" });
C("cml-imb-c1", "Imbalance: order of fixes", "Metric → threshold → class weights → resampling (inside folds) → more labels.");
C("cml-imb-c2", "Undersampling correction", "p = βp_s/(βp_s − p_s + 1), β = fraction of negatives kept.");
