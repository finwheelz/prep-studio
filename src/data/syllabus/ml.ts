import { C, N, Q, R, T } from "./build";

const NG = R("Andrew Ng: Machine Learning Specialization", "https://www.coursera.org/specializations/machine-learning-introduction", "Regression, classification, trees, clustering");
const CX = R("CampusX: 100 Days of ML", "https://www.youtube.com/playlist?list=PLKnIA16_Rmvbr7zKYQuBfsVkjoLcJgxHH", "Algorithm-by-algorithm, with code");
const SQ = R("StatQuest: machine learning", "https://www.youtube.com/playlist?list=PLblh5JKOoLUICTaGLRoHQDuF_7q2GfuJF", "Each algorithm explained visually");
const SK = R("scikit-learn user guide", "https://scikit-learn.org/stable/user_guide.html", "Authoritative reference for every estimator");
const KG = R("Kaggle Learn: Intro and Intermediate ML", "https://www.kaggle.com/learn", "Hands-on notebooks");
const GML = R("Google ML Crash Course", "https://developers.google.com/machine-learning/crash-course", "Short modules with exercises");

T("ml-foundations", "ml", "Machine learning", "Foundations: the learning problem, bias–variance, validation", "What a model is, how it is trained and how you know it generalises.", `
**Types of learning.** Supervised: labelled data; regression (numeric target) or classification (category). Unsupervised: no labels; clustering, dimensionality reduction, anomaly detection. Semi-supervised and self-supervised: few or automatically generated labels. Reinforcement: an agent learns from rewards.

**The supervised recipe.** Features X, target y, a model family, a loss function measuring error, and an optimiser that picks parameters to minimise loss on training data. Parameters are learned (weights); hyperparameters are set by you (tree depth, learning rate).

**Generalisation.** What matters is error on unseen data.

- **Underfitting (high bias)**: too simple; poor on training and test. Fix: richer features, more complex model, less regularisation, train longer.
- **Overfitting (high variance)**: memorises noise; great on training, poor on test. Fix: more data, simpler model, regularisation, early stopping, dropout, bagging, feature selection, cross-validation.

**Bias–variance decomposition.** Expected test error = bias² + variance + irreducible noise. Increasing complexity lowers bias and raises variance; the best model balances them.

**Data splits.** Train (fit), validation (tune and choose), test (final, used once). Typical 70/15/15 or 80/20 with cross-validation on the training part.

**k-fold cross-validation.** Split training data into k folds; train on k − 1, validate on the last; rotate; average. Stratified k-fold keeps class proportions. Time series: split by time (train on the past, validate on the future), never shuffle. Grouped data (several rows per customer): keep a group in one fold.

**Data leakage.** Information unavailable at prediction time sneaks into training, giving unrealistically good validation scores.

- Target leakage: a feature recorded after or because of the outcome ("collections call made" when predicting default).
- Train–test contamination: fitting a scaler, imputer or encoder on all data before splitting. Fit preprocessing inside a pipeline, on training folds only.
- Duplicates or the same entity on both sides of the split.

Signs: validation performance too good to be true, a single feature with near-perfect importance, a large drop in production.

**Learning curves.** Training and validation error against training-set size. Both high and close: bias. A wide gap: variance.

**Baselines.** Always compare with a trivial model (predict the mean or the majority class) and a simple model (linear or logistic).

**No free lunch.** No algorithm is best for every problem; choose by data size, feature types, interpretability and latency needs.

**Parametric vs non-parametric.** Parametric models have a fixed number of parameters (linear, logistic); non-parametric models grow with the data (k-NN, trees).

**End-to-end project outline** (what "walk me through your project" expects): problem and metric → data and source → cleaning → features → split strategy → baseline → model choice and why → tuning → results vs baseline → error analysis (false positives and negatives) → deployment and monitoring → limitations and next steps.
`, { resources: [NG, GML, CX], categories: ["ml/optimization"] });
Q(1, "Predicting house price from area and location is…", ["classification", "regression", "clustering", "reinforcement learning"], 1, "The target is numeric.");
Q(1, "Training accuracy 99%, test accuracy 70%. The model is…", ["underfitting", "overfitting", "well calibrated", "too simple"], 1, "A large train–test gap is high variance.");
Q(2, "Training error and validation error are both high and close together. This indicates…", ["high variance", "high bias", "data leakage", "a perfect model"], 1, "The model is too simple; more data will not help much.");
Q(2, "Which does NOT reduce overfitting?", ["More training data", "Regularisation", "Adding many more features", "Early stopping"], 2, "Extra features increase capacity.");
Q(2, "Fitting StandardScaler on the whole dataset before the train/test split is…", ["best practice", "data leakage", "required for trees", "harmless always"], 1, "Test-set statistics leak into training. Fit on train only, inside a pipeline.");
Q(2, "For a time series, validation data should be…", ["a random 20% sample", "the most recent period, after the training period", "the oldest period", "duplicated from training"], 1, "Random splits let the model peek at the future.");
N(2, "5-fold cross-validation on 1,000 rows: how many rows are used for training in each fold?", 800, 0, "Four of five folds.");
Q(2, "Tree depth and learning rate are examples of…", ["parameters", "hyperparameters", "features", "labels"], 1, "Set before training, tuned on validation data.");
Q(3, "Predicting loan default with the feature 'number of recovery calls made' is a problem because…", ["it is categorical", "it is known only after default: target leakage", "it has missing values", "it is correlated with age"], 1, "It would not exist at decision time.");
Q(2, "Expected test error decomposes into…", ["bias + variance", "bias² + variance + irreducible noise", "loss + accuracy", "precision + recall"], 1, "The bias–variance decomposition.");
Q(2, "The test set should be used…", ["to tune hyperparameters", "once, for the final estimate", "for feature selection", "for early stopping"], 1, "Reusing it turns it into another validation set.");
Q(3, "Several rows belong to each customer. To avoid optimistic validation you should…", ["shuffle rows", "use group k-fold so a customer is in one fold only", "drop customers", "use more folds"], 1, "Otherwise the model sees the same customer in train and validation.");
C("Underfitting vs overfitting", "High bias: bad on train and test. High variance: good on train, bad on test.");
C("Bias–variance decomposition", "Test error = bias² + variance + irreducible noise.");
C("Three kinds of leakage", "Target leakage; preprocessing fitted on all data; the same entity on both sides of the split.");
C("Train / validation / test", "Fit / tune and select / final one-time estimate.");
C("Project walkthrough order", "Problem → data → cleaning → features → split → baseline → model → tuning → results → errors → deployment → limits.");

T("ml-linear", "ml", "Machine learning", "Linear models, gradient descent and regularisation", "Linear and logistic regression as optimisation problems.", `
**Linear regression.** ŷ = w·x + b. Loss: mean squared error, MSE = (1/n) Σ (y − ŷ)². MSE is convex, so there is one minimum. Closed form (normal equation): w = (XᵀX)⁻¹Xᵀy; impractical for very many features, so use gradient descent.

**Gradient descent.** Repeat w ← w − η ∇L(w), where η is the learning rate.

- Too small: slow. Too large: overshoots or diverges.
- Batch: the whole dataset per step (stable, slow). Stochastic (SGD): one sample (noisy, fast). Mini-batch: a small batch (the usual choice).
- Feature scaling makes the loss surface rounder and convergence faster.
- For MSE with one feature: ∂L/∂w = −(2/n) Σ x (y − ŷ).

**Logistic regression.** p = σ(w·x + b), σ(z) = 1 / (1 + e⁻ᶻ). Loss: log loss (binary cross-entropy) = −[y log p + (1 − y) log(1 − p)], averaged. It is convex and equals the negative log-likelihood. MSE with a sigmoid is non-convex, which is why it is not used. The decision boundary is linear. Multi-class: softmax (multinomial) or one-vs-rest.

**Regularisation** adds a penalty on weight size to reduce variance.

- **L2 (Ridge)**: λ Σ w². Shrinks all weights smoothly, none exactly to zero; handles correlated features by sharing weight.
- **L1 (Lasso)**: λ Σ |w|. Drives some weights exactly to zero: built-in feature selection. Among correlated features it tends to keep one.
- **Elastic net**: both.
- Larger λ: simpler model, more bias, less variance. In scikit-learn's LogisticRegression, C = 1/λ, so smaller C is stronger regularisation.
- Scale features first, and do not penalise the intercept.

Why L1 gives zeros: its constraint region is a diamond with corners on the axes, and the loss contours tend to touch a corner. With orthonormal features, ridge divides each coefficient by (1 + λ) and lasso subtracts λ from its magnitude, stopping at zero (soft-thresholding).

**Polynomial features** let a linear model fit curves; high degrees overfit.

**Interpreting.** Linear: a one-unit increase in x changes ŷ by w, other features fixed. Logistic: changes the log-odds by w; e^w is the odds ratio.

**When linear models are the right choice.** Small or wide data, a need for interpretability and speed, as a baseline, and in regulated settings such as credit scoring where logistic regression scorecards are standard.
`, { resources: [NG, SQ, SK], categories: ["ml/regularization", "ml/optimization"] });
N(1, "w = 2, gradient = 3, learning rate 0.1. Updated w?", 1.7, 0.001, "2 − 0.1 × 3.");
N(2, "Minimising f(w) = w² from w = 4 with learning rate 0.1. w after one step?", 3.2, 0.001, "Gradient 2w = 8; 4 − 0.8.");
Q(2, "A learning rate that is far too large typically causes…", ["slow but steady convergence", "the loss to oscillate or diverge", "underfitting", "perfect accuracy"], 1, "Steps overshoot the minimum.");
Q(1, "Which penalty can set coefficients exactly to zero?", ["L2 (Ridge)", "L1 (Lasso)", "Both", "Neither"], 1, "Lasso performs feature selection.");
Q(2, "Increasing the regularisation strength λ…", ["increases variance", "increases bias and reduces variance", "reduces bias", "has no effect"], 1, "The model becomes simpler.");
Q(2, "Logistic regression uses log loss rather than MSE because…", ["MSE is undefined for probabilities", "log loss is convex for this model and is the maximum-likelihood objective", "MSE is slower to compute", "log loss needs no gradient"], 1, "MSE composed with a sigmoid is non-convex.");
N(2, "σ(0), the sigmoid at zero?", 0.5, 0.001, "1/(1 + 1).");
N(3, "True label 1, predicted probability 0.8. Log loss for this example? (3 decimals, natural log)", 0.223, 0.002, "−ln(0.8).");
Q(2, "In scikit-learn's LogisticRegression, a smaller C means…", ["weaker regularisation", "stronger regularisation", "more iterations", "a larger learning rate"], 1, "C is the inverse of the penalty strength.");
Q(2, "Why scale features before ridge or lasso?", ["Scaling removes outliers", "The penalty depends on coefficient size, which depends on feature units", "It is required by the API", "It increases R²"], 1, "Otherwise features on large scales are penalised less.");
N(3, "Orthonormal design, OLS coefficient 0.8, λ = 0.5. Lasso coefficient?", 0.3, 0.001, "Soft-threshold: 0.8 − 0.5.");
Q(2, "Mini-batch gradient descent is preferred to batch because it…", ["always finds the global minimum", "is cheaper per step and still fairly stable", "needs no learning rate", "avoids scaling"], 1, "A compromise between batch and stochastic.");
N(2, "Predictions 3, 5 and actuals 2, 7. Mean squared error?", 2.5, 0.001, "(1 + 4)/2.");
Q(3, "Two highly correlated features under ridge regression tend to…", ["one gets all the weight", "share the weight between them", "both become zero", "become negative"], 1, "The squared penalty prefers spreading weight.");
C("Gradient descent update", "w ← w − η ∇L(w)");
C("L1 vs L2", "L1: sparse, feature selection. L2: smooth shrinkage, shares weight among correlated features.");
C("Log loss", "−[y ln p + (1 − y) ln(1 − p)]");
C("Batch vs SGD vs mini-batch", "All data per step / one sample / small batch: stable-slow, noisy-fast, the usual compromise.");

T("ml-classifiers", "ml", "Machine learning", "k-NN, Naive Bayes and SVM", "Three classic classifiers and when each fits.", `
**k-nearest neighbours.** Store the training data; to predict, find the k closest points and take a majority vote (classification) or average (regression).

- Distance: Euclidean √Σ(a − b)², Manhattan Σ|a − b|, cosine for text and embeddings.
- Scale features, or large-range features dominate the distance.
- Small k: flexible, noisy (high variance). Large k: smooth (high bias). Choose k by cross-validation; use an odd k for binary problems.
- No training cost but slow prediction and heavy memory; suffers from the curse of dimensionality (in many dimensions all points are far apart).

**Naive Bayes.** Apply Bayes' rule assuming features are conditionally independent given the class:

P(class | x) ∝ P(class) × Π P(xᵢ | class)

- Variants: Gaussian (continuous features), Multinomial (word counts), Bernoulli (binary features).
- Fast, works with little data and many features; a strong baseline for text (spam filtering).
- The independence assumption is rarely true, so the probabilities are poorly calibrated, but the ranking of classes is often right.
- Laplace smoothing adds 1 to counts so an unseen word does not zero out the product.

**Support vector machine.** Find the hyperplane that separates the classes with the largest margin. The points on the margin are the support vectors; only they determine the boundary.

- Soft margin: parameter C trades margin width against misclassification. Small C: wider margin, more regularisation. Large C: fit the training data harder.
- Kernel trick: compute similarities as if in a higher-dimensional space without building it. Kernels: linear, polynomial, RBF (Gaussian). RBF's gamma sets how far one point's influence reaches: high gamma means wiggly boundaries.
- Loss: hinge loss, max(0, 1 − y·f(x)).
- Scale features. Works well on medium-sized, high-dimensional data; slow on very large datasets; not naturally probabilistic.

**Decision boundaries.** Logistic regression and linear SVM: straight lines. k-NN, kernel SVM, trees: non-linear.

**Generative vs discriminative.** Naive Bayes models how each class generates features (P(x | y)) and applies Bayes' rule; logistic regression and SVM model the boundary (P(y | x)) directly.

**Multi-class.** One-vs-rest trains one classifier per class; one-vs-one trains one per pair.
`, { resources: [SQ, SK, CX] });
N(1, "Euclidean distance between (1, 2) and (4, 6)?", 5, 0.001, "√(9 + 16).");
N(1, "Manhattan distance between (1, 2) and (4, 6)?", 7, 0.001, "3 + 4.");
Q(2, "In k-NN, a very small k leads to…", ["high bias", "high variance", "no predictions", "faster training"], 1, "The prediction follows individual noisy points.");
Q(2, "Why must features be scaled for k-NN?", ["The algorithm fails otherwise", "Distances are dominated by features with large ranges", "To reduce the number of neighbours", "It is not necessary"], 1, "Salary in rupees would swamp age in years.");
Q(2, "The 'naive' assumption in Naive Bayes is that…", ["classes are equally likely", "features are conditionally independent given the class", "data are normally distributed", "there are only two classes"], 1, "It lets the likelihood factorise.");
Q(2, "Laplace smoothing in Naive Bayes prevents…", ["overfitting to long documents", "a zero probability for a feature value unseen in training", "class imbalance", "slow training"], 1, "A single zero would wipe out the whole product.");
Q(2, "In an SVM the support vectors are…", ["all training points", "the points lying on or inside the margin", "misclassified test points", "the cluster centres"], 1, "Only they define the boundary.");
Q(2, "The kernel trick lets an SVM…", ["train faster on huge data", "learn non-linear boundaries without explicitly computing high-dimensional features", "output probabilities", "ignore outliers"], 1, "It replaces dot products with kernel functions.");
Q(3, "With an RBF kernel, a very large gamma tends to cause…", ["underfitting", "overfitting", "linear boundaries", "no effect"], 1, "Each point influences only its close neighbourhood.");
N(3, "Spam prior 0.4. P('free' | spam) = 0.5, P('free' | ham) = 0.1. P(spam | 'free')? (3 decimals)", 0.769, 0.002, "0.2 / (0.2 + 0.06).");
Q(2, "Which model is generative?", ["Logistic regression", "Naive Bayes", "Linear SVM", "k-NN"], 1, "It models P(x | y) and P(y).");
Q(2, "k-NN is called a lazy learner because…", ["it is inaccurate", "it does no work at training time and defers computation to prediction", "it uses few features", "it needs no data"], 1, "It simply stores the data.");
C("k in k-NN", "Small k: low bias, high variance. Large k: high bias, low variance. Always scale.");
C("Naive Bayes formula", "P(class | x) ∝ P(class) × Π P(xᵢ | class)");
C("SVM in one line", "Maximum-margin separator; C controls slack; kernels give non-linear boundaries.");
C("Generative vs discriminative", "Model P(x | y)P(y) vs model P(y | x) directly.");

T("ml-trees", "ml", "Machine learning", "Decision trees, random forests and boosting", "Splitting criteria, bagging vs boosting, XGBoost and its relatives.", `
**Decision tree.** Recursively split the data on the feature and threshold that best purify the child nodes; predict the majority class (or mean) of a leaf.

Impurity for a node with class proportions pᵢ:

- Gini = 1 − Σ pᵢ². Range 0 (pure) to 0.5 (binary, 50/50).
- Entropy = −Σ pᵢ log₂ pᵢ. Range 0 to 1 bit for binary.
- Information gain = parent impurity − weighted average impurity of the children. Choose the split with the highest gain.
- Regression trees minimise variance (MSE) within children.

Trees need no scaling, handle non-linearities and interactions, and are easy to explain. A single deep tree overfits. Control with max_depth, min_samples_split, min_samples_leaf, max_leaf_nodes, or cost-complexity pruning.

**Ensembles** combine many models.

**Bagging** (bootstrap aggregating): train models on bootstrap samples (rows drawn with replacement) and average. Reduces variance. Each bootstrap sample leaves out about 37% of rows; these out-of-bag rows give a free validation estimate.

**Random forest** = bagging of deep trees plus a random subset of features at each split (≈ √p for classification). The feature randomness decorrelates the trees, so averaging helps more. Robust, little tuning, parallel. More trees never overfit, they only cost time.

**Boosting** builds trees sequentially, each correcting the errors of the ensemble so far. Reduces bias.

- AdaBoost: re-weights misclassified points.
- Gradient boosting: each new shallow tree fits the negative gradient of the loss (the residuals for MSE), added with a learning rate.
- XGBoost: regularised objective, second-order gradients, built-in handling of missing values, column and row subsampling. LightGBM: histogram-based, leaf-wise growth, very fast. CatBoost: ordered boosting and native categorical handling.
- Key hyperparameters: n_estimators, learning_rate (lower needs more trees), max_depth, subsample, colsample_bytree, min_child_weight, L1/L2 penalties. Use early stopping on a validation set.
- Too many boosting rounds can overfit, unlike a random forest.

**Bagging vs boosting.** Parallel vs sequential; variance vs bias; deep trees vs shallow trees; robust vs needs tuning.

**Stacking.** A meta-model learns to combine the predictions of several base models.

**Feature importance.** Impurity-based importance is biased toward high-cardinality features; permutation importance and SHAP values are more reliable. SHAP attributes each prediction to features and is the usual way to explain boosted models.

**When to use what.** Tabular data with mixed features: gradient boosting is usually the strongest. Need a quick, safe baseline: random forest. Need full transparency: a shallow tree or a linear model.
`, { resources: [SQ, SK, R("XGBoost documentation", "https://xgboost.readthedocs.io/en/stable/tutorials/model.html", "Introduction to boosted trees"), CX] });
N(1, "A node has 6 positives and 2 negatives. Gini impurity? (3 decimals)", 0.375, 0.002, "1 − (0.75² + 0.25²).");
N(2, "Entropy (bits) of a node with 4 positives and 4 negatives?", 1, 0.001, "Maximum for a binary node.");
N(3, "Parent: 10 samples, 5 + / 5 −. Split into a pure child of 4 (all +) and a child of 6 (1 + / 5 −). Information gain using Gini? (3 decimals)", 0.333, 0.003, "Parent 0.5. Right child Gini = 1 − (1/36 + 25/36) = 0.278. Weighted: 0.6 × 0.278 = 0.167. Gain 0.333.");
Q(1, "Random forest reduces which component of error compared with a single tree?", ["bias", "variance", "noise", "none"], 1, "Averaging decorrelated trees lowers variance.");
Q(2, "What makes a random forest different from plain bagging of trees?", ["It uses shallow trees", "It considers a random subset of features at each split", "It trains trees sequentially", "It uses no bootstrap"], 1, "Feature subsampling decorrelates the trees.");
Q(2, "In gradient boosting, each new tree is fitted to…", ["a bootstrap sample of the labels", "the residual errors (negative gradient) of the current ensemble", "random noise", "the original labels only"], 1, "It corrects what the ensemble still gets wrong.");
Q(2, "Lowering the learning rate in boosting generally requires…", ["fewer trees", "more trees", "deeper trees", "no change"], 1, "Each tree contributes less.");
Q(2, "Which statement is true?", ["Adding trees to a random forest causes overfitting", "Adding too many boosting rounds can overfit", "Boosting trains trees in parallel", "Random forests need feature scaling"], 1, "Use early stopping for boosting.");
Q(2, "About what share of rows is left out of each bootstrap sample (out-of-bag)?", ["5%", "37%", "50%", "63%"], 1, "(1 − 1/n)ⁿ → 1/e ≈ 0.368.");
Q(2, "Decision trees do not need feature scaling because…", ["they use distances", "splits depend only on the ordering of values", "they are linear", "scaling is done internally"], 1, "Thresholds are invariant to monotonic transformations.");
Q(3, "Impurity-based feature importance is known to be biased toward…", ["binary features", "features with many distinct values", "the target", "scaled features"], 1, "More split points give more chances to reduce impurity by luck.");
Q(2, "Which library handles categorical features natively with ordered boosting?", ["XGBoost", "CatBoost", "scikit-learn's DecisionTree", "statsmodels"], 1, "CatBoost.");
Q(2, "Bagging mainly reduces ___; boosting mainly reduces ___.", ["bias; variance", "variance; bias", "noise; bias", "variance; noise"], 1, "The standard contrast.");
Q(3, "XGBoost handles missing values by…", ["dropping rows", "learning a default direction for missing values at each split", "imputing the mean", "raising an error"], 1, "Sparsity-aware split finding.");
C("Gini and entropy", "Gini = 1 − Σp². Entropy = −Σ p log₂ p. Information gain = parent − weighted children.");
C("Bagging vs boosting", "Parallel, reduces variance, deep trees vs sequential, reduces bias, shallow trees.");
C("Random forest's two sources of randomness", "Bootstrap rows and a random feature subset at each split.");
C("Key boosting hyperparameters", "n_estimators, learning_rate, max_depth, subsample, colsample_bytree; use early stopping.");
C("Reliable feature importance", "Permutation importance or SHAP, not raw impurity importance.");

T("ml-unsupervised", "ml", "Machine learning", "Clustering, PCA and anomaly detection", "k-means, hierarchical, DBSCAN, dimensionality reduction.", `
**k-means.**

1. Choose k and initial centroids (k-means++ spreads them out).
2. Assign each point to the nearest centroid.
3. Move each centroid to the mean of its points.
4. Repeat until assignments stop changing.

It minimises within-cluster sum of squares (inertia). Scale features. Sensitive to initialisation (run several times) and outliers; assumes roughly spherical, similar-sized clusters; you must choose k.

**Choosing k.** Elbow method: plot inertia against k and look for the bend. Silhouette score: (b − a) / max(a, b) per point, where a is the mean distance to its own cluster and b to the nearest other cluster; ranges from −1 to 1, higher is better. Business sense matters too: can each segment be acted on?

**Hierarchical clustering.** Agglomerative: start with every point as a cluster and repeatedly merge the closest pair. Linkage: single (nearest points), complete (farthest), average, Ward (minimum variance increase). The dendrogram shows the merges; cut it to pick the number of clusters. No need to preset k; O(n²) memory.

**DBSCAN.** Density-based: a core point has at least min_samples neighbours within eps; clusters are connected dense regions; isolated points are labelled noise. Finds arbitrary shapes and outliers and needs no k, but struggles when densities vary.

**Gaussian mixture models.** Soft clustering: each point gets a probability of belonging to each cluster; fitted by expectation–maximisation.

**PCA (principal component analysis).** Finds orthogonal directions of maximum variance.

1. Standardise the features.
2. Compute the covariance matrix.
3. Its eigenvectors are the principal components; the eigenvalues are the variance each explains.
4. Project onto the top components.

Explained variance ratio = eigenvalue / sum of eigenvalues; keep enough components for, say, 95%. Uses: visualisation, noise reduction, speeding up models, removing multicollinearity. Costs: components are linear combinations that are hard to interpret; it is unsupervised, so it may discard variance that mattered for the target.

**t-SNE and UMAP** are non-linear methods for 2-D visualisation; distances between far clusters are not meaningful.

**Anomaly detection.** Z-score or IQR on a single variable; Isolation Forest (anomalies are isolated in few random splits); Local Outlier Factor; one-class SVM; autoencoder reconstruction error. Used for fraud and monitoring.

**Association rules** (market-basket analysis). Support = share of baskets containing the itemset; confidence(A → B) = support(A and B) / support(A); lift = confidence / support(B). Lift above 1 means A and B occur together more than chance.

**Customer segmentation: RFM.** Recency, frequency, monetary value: a simple, explainable segmentation before any clustering.
`, { resources: [SQ, SK, CX] });
Q(1, "k-means requires you to specify…", ["the labels", "the number of clusters", "the distance threshold eps", "nothing"], 1, "k is a hyperparameter.");
Q(2, "The elbow method plots…", ["accuracy vs k", "within-cluster sum of squares vs k", "silhouette vs epochs", "loss vs learning rate"], 1, "Look for the bend where gains level off.");
Q(2, "Why scale features before k-means or PCA?", ["They require integers", "Both depend on distances or variances, which are dominated by large-scale features", "To add clusters", "Scaling is unnecessary"], 1, "Otherwise one feature decides everything.");
Q(2, "Which algorithm can label points as noise and find non-spherical clusters?", ["k-means", "DBSCAN", "PCA", "Linear regression"], 1, "Density-based clustering.");
N(2, "PCA eigenvalues are 4, 2, 1, 1. Variance explained by the first component, in %?", 50, 0.01, "4 / 8.");
N(2, "Same eigenvalues. How many components are needed to explain at least 75% of the variance?", 2, 0, "(4 + 2)/8 = 75%.");
Q(2, "Principal components are…", ["the original features ranked", "orthogonal linear combinations of the features", "cluster centres", "class labels"], 1, "Directions of maximum variance, uncorrelated with each other.");
N(3, "1-D points 1, 2, 9, 10 with initial centroids at 1 and 2. After one assignment and update step, what is the larger centroid?", 7, 0.001, "Point 1 → centroid 1; points 2, 9, 10 → centroid 2, whose mean is 7.");
N(2, "A point has mean intra-cluster distance a = 2 and nearest-cluster distance b = 5. Silhouette value?", 0.6, 0.001, "(5 − 2)/5.");
Q(2, "Lift of 2.0 for the rule bread → butter means…", ["butter is bought half as often with bread", "butter is twice as likely in baskets with bread as overall", "the rule is wrong", "confidence is 2"], 1, "Lift = confidence / support(B).");
N(3, "1,000 baskets: 200 contain A, 100 contain both A and B. Confidence of A → B?", 0.5, 0.001, "100 / 200.");
Q(2, "An Isolation Forest flags anomalies because they…", ["are in dense regions", "are separated from the rest in few random splits", "have high labels", "are duplicated"], 1, "Short average path length.");
Q(3, "A weakness of PCA before a supervised model is that…", ["it increases dimensionality", "it ignores the target, so low-variance but predictive directions may be dropped", "it requires labels", "it cannot be scaled"], 1, "Variance is not the same as predictive power.");
C("k-means loop", "Assign to nearest centroid → recompute centroids → repeat. Minimises within-cluster squared distance.");
C("Choosing k", "Elbow on inertia; silhouette score; whether segments are actionable.");
C("PCA steps", "Standardise → covariance → eigenvectors (components) and eigenvalues (variance) → project.");
C("Support, confidence, lift", "P(A∧B); P(A∧B)/P(A); confidence / P(B).");

T("ml-metrics", "ml", "Machine learning", "Evaluation metrics", "Confusion matrix, precision–recall, ROC, regression and ranking metrics.", `
**Confusion matrix** (binary): TP, FP, FN, TN.

- Accuracy = (TP + TN) / total. Misleading when classes are imbalanced.
- Precision = TP / (TP + FP): of those flagged, how many were right. Matters when false positives are costly (spam filter, blocking a card).
- Recall (sensitivity, TPR) = TP / (TP + FN): of the actual positives, how many were caught. Matters when misses are costly (fraud, disease, default).
- Specificity (TNR) = TN / (TN + FP). False-positive rate = 1 − specificity.
- F1 = 2PR / (P + R): harmonic mean, low if either is low. Fβ weights recall β times as much (F2 for recall-heavy problems).

**Threshold.** Most models output a score; the threshold converts it into a decision. Lowering it raises recall and usually lowers precision. Choose it from the costs: with calibrated probabilities, flag when p > c_FP / (c_FP + c_FN).

**ROC curve.** TPR against FPR over all thresholds. AUC is the probability that a random positive is scored above a random negative: 0.5 is random, 1.0 perfect. It is threshold-free and insensitive to class balance.

**Precision–recall curve.** More informative than ROC under heavy imbalance, because it ignores the large pool of true negatives. A random model's PR-AUC equals the positive rate.

**Log loss** measures the quality of probabilities, penalising confident mistakes heavily. **Calibration**: among cases predicted at 0.8, do 80% happen? Check with a reliability curve; fix with Platt scaling or isotonic regression.

**Multi-class.** Macro average: unweighted mean across classes (treats rare classes equally). Micro: pooled counts. Weighted: by class frequency.

**Credit-risk metrics.** KS = maximum gap between the cumulative distributions of bads and goods across score bands. Gini = 2 × AUC − 1. Lift and gain charts by decile.

**Regression.**
- MAE = mean |error|: robust, in the target's units.
- MSE / RMSE: penalise large errors more.
- MAPE = mean |error / actual|: scale-free; breaks near zero.
- R² = 1 − SS_res / SS_tot.

**Ranking and recommendation.** Precision@k, recall@k, MAP, NDCG.

**Clustering.** Silhouette, inertia; with labels, adjusted Rand index.

**Choosing a metric.** Start from the business cost of each error, pick the metric that reflects it, and report a baseline. Offline metrics are a proxy; the real test is an online experiment.
`, { resources: [SQ, SK, GML], categories: ["ml/metrics", "ml/credit", "python/metrics"] });
N(1, "TP = 40, FP = 10. Precision?", 0.8, 0.001, "40/50.");
N(1, "TP = 40, FN = 20. Recall? (3 decimals)", 0.667, 0.002, "40/60.");
N(2, "Precision 0.8 and recall 0.667. F1? (3 decimals)", 0.727, 0.002, "2PR/(P + R).");
N(2, "TP 30, FP 10, FN 30, TN 930. Accuracy?", 0.96, 0.001, "960/1000.");
Q(2, "A fraud model on data with 0.5% fraud reaches 99.5% accuracy. This…", ["shows an excellent model", "can be achieved by predicting 'no fraud' for everything", "means recall is 99.5%", "means precision is 99.5%"], 1, "Accuracy is uninformative under heavy imbalance.");
Q(2, "For a cancer-screening test, which metric matters most?", ["Precision", "Recall", "Specificity", "Accuracy"], 1, "Missing a case is the costly error.");
Q(2, "Lowering the decision threshold will…", ["increase recall (or leave it unchanged)", "decrease recall", "increase precision always", "not change predictions"], 0, "More cases are flagged positive.");
Q(2, "ROC-AUC of 0.5 means the model…", ["is perfect", "ranks no better than random", "is always wrong", "has 50% accuracy"], 1, "The diagonal.");
Q(2, "Under heavy class imbalance, which curve is more informative?", ["ROC", "Precision–recall", "Learning curve", "Lift is undefined"], 1, "PR focuses on the positive class.");
N(2, "A model has AUC 0.74. Gini coefficient?", 0.48, 0.001, "2 × 0.74 − 1.");
N(2, "Errors are −2, 1, 3. Mean absolute error?", 2, 0.001, "(2 + 1 + 3)/3.");
N(3, "Same errors (−2, 1, 3). RMSE? (2 decimals)", 2.16, 0.01, "√(14/3).");
Q(2, "RMSE compared with MAE…", ["penalises large errors more", "ignores large errors", "is always smaller", "is unit-free"], 0, "Squaring emphasises big misses.");
Q(3, "Missing a fraud costs ₹5,000; a false alarm costs ₹100. With calibrated probabilities the cost-minimising threshold is about…", ["0.50", "0.25", "0.02", "0.98"], 2, "100 / (100 + 5,000) ≈ 0.0196.");
Q(2, "Macro-averaged F1 differs from weighted F1 in that it…", ["weights classes by frequency", "treats every class equally regardless of size", "uses accuracy", "ignores recall"], 1, "It highlights performance on rare classes.");
Q(3, "A model is well calibrated if…", ["its AUC is 1", "among cases predicted with probability p, about a fraction p are positive", "its accuracy is high", "its threshold is 0.5"], 1, "Calibration concerns the probabilities themselves.");
N(2, "TN = 900, FP = 100. Specificity?", 0.9, 0.001, "900/1000.");
C("Precision and recall", "Precision = TP/(TP + FP). Recall = TP/(TP + FN).");
C("When accuracy misleads", "Imbalanced classes: predicting the majority scores high.");
C("ROC-AUC meaning", "Probability a random positive is ranked above a random negative.");
C("Gini from AUC", "Gini = 2·AUC − 1");
C("MAE vs RMSE vs MAPE", "Robust / penalises large errors / scale-free but breaks near zero.");

T("ml-features", "ml", "Machine learning", "Feature engineering, imbalance, tuning and pipelines", "Preparing data properly and building the model without leakage.", `
**Encoding categories.**
- One-hot: a column per level; fine for low cardinality. Drop one level for linear models.
- Ordinal: integers for ordered categories (low < medium < high).
- Target (mean) encoding: replace a level with the average target; powerful for high cardinality but leaks unless computed out-of-fold.
- Frequency encoding; hashing for very many levels.
- Weight of evidence (credit scoring): WoE = ln(% of goods / % of bads) per bin. Information value = Σ (%good − %bad) × WoE; below 0.02 useless, 0.1–0.3 medium, above 0.5 suspicious.

**Scaling.** Standardisation (z-score), min–max to [0, 1], robust scaling (median and IQR). Needed for distance-based and gradient-based models (k-NN, SVM, k-means, PCA, neural nets, regularised linear models); not for trees.

**Transformations.** Log or Box–Cox for skew; binning; polynomial and interaction terms; ratios (debt-to-income); date parts and time since an event; rolling aggregates (spend in the last 30 days); text length and counts.

**Feature selection.** Filter (correlation, chi-square, mutual information), wrapper (recursive feature elimination), embedded (L1, tree importance). Remove near-constant and duplicate features; check multicollinearity for linear models.

**Class imbalance.**
- Use the right metric (PR-AUC, recall at a precision).
- Class weights (class_weight='balanced') make minority errors cost more.
- Resampling: random undersampling of the majority, oversampling of the minority, SMOTE (synthesises minority points between neighbours). Resample the training folds only, never validation or test.
- Threshold tuning after training.
- Stratified splits. For extreme rarity, treat as anomaly detection.

**Hyperparameter tuning.** Grid search (exhaustive), random search (better with many parameters), Bayesian optimisation (Optuna). Tune with cross-validation on training data; keep the test set untouched.

**Pipelines** chain preprocessing and model so that every step is fitted on training folds only:

\`\`\`
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score, roc_auc_score

X, y = df.drop(columns="target"), df["target"]
num = X.select_dtypes("number").columns
cat = X.columns.difference(num)
pre = ColumnTransformer([
    ("num", Pipeline([("imp", SimpleImputer(strategy="median")), ("sc", StandardScaler())]), num),
    ("cat", Pipeline([("imp", SimpleImputer(strategy="most_frequent")),
                      ("oh", OneHotEncoder(handle_unknown="ignore"))]), cat)])
clf = Pipeline([("pre", pre), ("model", LogisticRegression(max_iter=1000, class_weight="balanced"))])
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
clf.fit(X_tr, y_tr)
print(f1_score(y_te, clf.predict(X_te)), roc_auc_score(y_te, clf.predict_proba(X_te)[:, 1]))
grid = GridSearchCV(clf, {"model__C": [0.01, 0.1, 1, 10]}, cv=5, scoring="roc_auc").fit(X_tr, y_tr)
\`\`\`

One reported assessment asked candidates to write this from memory, imports included.

**Explainability.** Coefficients, partial dependence, permutation importance, SHAP. In lending, reason codes for a decline are a regulatory expectation.
`, { resources: [SK, KG, R("Feature Engineering and Selection (free book)", "http://www.feat.engineering/", "Kuhn and Johnson")], categories: ["ml/credit"] });
Q(1, "Which model needs feature scaling the least?", ["k-NN", "SVM", "Random forest", "Neural network"], 2, "Tree splits depend only on ordering.");
Q(2, "One-hot encoding a column with 5,000 distinct values is a problem mainly because…", ["it loses information", "it creates a very wide, sparse matrix", "it changes the target", "it is not allowed"], 1, "Consider target, frequency or hashing encodings.");
Q(2, "Target encoding must be computed out-of-fold because otherwise…", ["it is slow", "each row's own label leaks into its feature", "it produces NaNs", "it removes categories"], 1, "A form of target leakage.");
Q(2, "SMOTE should be applied…", ["to the full dataset before splitting", "to the training folds only", "to the test set", "after prediction"], 1, "Synthetic points must not appear in validation or test.");
Q(2, "`class_weight='balanced'` makes the model…", ["drop majority rows", "penalise errors on the minority class more", "duplicate the test set", "use a lower learning rate"], 1, "Weights are inversely proportional to class frequency.");
N(2, "A bin has 20% of all goods and 60% of all bads. Its weight of evidence? (2 decimals)", -1.1, 0.01, "ln(0.2/0.6).");
N(3, "Two bins: (20% goods, 60% bads) and (80% goods, 40% bads). Information value? (2 decimals)", 0.72, 0.01, "(−0.4)(−1.10) + (0.4)(0.69).");
Q(2, "Random search often beats grid search because…", ["it tries every combination", "it explores more distinct values of the parameters that matter", "it needs no validation", "it is deterministic"], 1, "Grids waste trials on unimportant parameters.");
Q(2, "The main purpose of a scikit-learn Pipeline is to…", ["speed up training", "ensure preprocessing is fitted only on training data within each fold", "remove the need for a test set", "tune the learning rate"], 1, "It prevents leakage and keeps steps together.");
Q(2, "`OneHotEncoder(handle_unknown='ignore')` is needed because…", ["training is faster", "new categories may appear at prediction time", "it removes NaNs", "it scales values"], 1, "Unknown levels become all zeros instead of raising an error.");
Q(2, "`train_test_split(..., stratify=y)` ensures…", ["random order", "the class proportions are preserved in both sets", "no duplicates", "scaling"], 1, "Important for imbalanced data.");
Q(3, "A feature has information value 0.9. The right reaction is…", ["celebrate and ship", "check whether it is recorded after the outcome", "drop it for being weak", "bin it more coarsely"], 1, "Very high IV usually signals leakage.");
Q(2, "A log transform of a right-skewed feature…", ["increases the skew", "compresses the long tail", "removes missing values", "one-hot encodes it"], 1, "It makes the distribution more symmetric.");
C("Which models need scaling?", "Distance- and gradient-based: k-NN, SVM, k-means, PCA, neural nets, regularised linear models. Not trees.");
C("Handling imbalance", "Right metric, class weights, resample training folds only, tune the threshold.");
C("WoE and IV", "WoE = ln(%good / %bad). IV = Σ (%good − %bad) · WoE.");
C("Pipeline + ColumnTransformer", "Impute and scale numerics, impute and one-hot categoricals, then the model: all fitted on training folds only.");

T("ml-timeseries", "ml", "Machine learning", "Time series and forecasting", "Components, smoothing, ARIMA ideas and proper validation.", `
**Components.** Trend (long-term direction), seasonality (fixed-period pattern), cyclical movements (irregular period), and noise. Additive: y = trend + seasonal + residual. Multiplicative: y = trend × seasonal × residual (seasonal swings grow with the level; take logs to make it additive).

**Stationarity.** Constant mean, variance and autocorrelation over time. Many models need it. Make a series stationary by differencing (yₜ − yₜ₋₁), seasonal differencing, or a log transform. Test with the augmented Dickey–Fuller test.

**Smoothing.**
- Moving average of window k: the mean of the last k values. Forecast for the next period = that mean.
- Simple exponential smoothing: Fₜ₊₁ = α yₜ + (1 − α) Fₜ. Larger α reacts faster; smaller α smooths more.
- Holt adds a trend term; Holt–Winters adds seasonality.

**Autoregressive models.**
- AR(p): yₜ = c + φ₁ yₜ₋₁ + … + φₚ yₜ₋ₚ + ε.
- MA(q): depends on past forecast errors.
- ARIMA(p, d, q): AR and MA on a series differenced d times. SARIMA adds seasonal terms.
- ACF (autocorrelation) and PACF plots suggest q and p.

**Seasonal index.** Average for the season / overall average. Deseasonalise by dividing; forecast = trend forecast × index.

**Machine-learning approach.** Turn the series into a table: lag features (yₜ₋₁, yₜ₋₇), rolling means, calendar features (month, weekday, holiday), then use gradient boosting. Prophet fits trend plus seasonality plus holidays with little tuning.

**Validation.** Never shuffle. Use a time-based split or walk-forward (expanding window) validation. Features must use only information available at forecast time.

**Metrics.** MAE, RMSE, MAPE, and comparison against a naive forecast (last value, or the same period last year).

**Residuals** should look like white noise: no pattern left.

**Anomalies in a series.** Points far from a rolling mean in units of rolling standard deviation; sudden level shifts.

**Finance uses.** Volatility is the standard deviation of returns, annualised by × √252 for daily data. Value at risk: the loss not exceeded with a given confidence over a horizon; parametric VaR = z × σ × value.
`, { resources: [R("Forecasting: Principles and Practice (free book)", "https://otexts.com/fpp3/", "Hyndman and Athanasopoulos"), SQ] });
N(1, "Sales: 100, 120, 110. 3-period moving-average forecast for the next period?", 110, 0.001, "330/3.");
N(2, "Exponential smoothing with α = 0.3: previous forecast 100, actual 120. Next forecast?", 106, 0.001, "0.3 × 120 + 0.7 × 100.");
N(2, "AR(1): yₜ = 5 + 0.6 yₜ₋₁. If the last value is 20, the forecast is…", 17, 0.001, "5 + 12.");
N(2, "Quarter 4 averages 150 while the overall quarterly average is 120. Seasonal index for Q4?", 1.25, 0.001, "150/120.");
Q(2, "A series whose seasonal swings grow as the level rises is best modelled as…", ["additive", "multiplicative", "stationary", "white noise"], 1, "Or additive after a log transform.");
Q(2, "Differencing a series is done to…", ["add seasonality", "remove trend and make it stationary", "increase variance", "fill missing values"], 1, "ARIMA's 'I' (integrated) term.");
Q(2, "Correct validation for forecasting:", ["random k-fold", "train on earlier periods, validate on later periods", "validate on the training data", "leave-one-out"], 1, "Walk-forward keeps time order.");
Q(2, "A larger α in exponential smoothing makes forecasts…", ["smoother and slower", "more responsive to recent values", "constant", "seasonal"], 1, "More weight on the latest observation.");
N(3, "Daily return volatility is 1%. Annualised volatility using 252 trading days, in %? (1 decimal)", 15.9, 0.1, "1 × √252.");
N(3, "Portfolio ₹10,00,000, daily volatility 2%. One-day 95% parametric VaR (z = 1.645), in ₹?", 32900, 5, "1.645 × 0.02 × 10,00,000.");
Q(2, "A good naive benchmark for monthly sales with yearly seasonality is…", ["the overall mean", "the value from the same month last year", "zero", "the maximum"], 1, "The seasonal naive forecast.");
N(2, "Actuals 100 and 200; forecasts 110 and 180. MAPE in %?", 10, 0.01, "(10% + 10%)/2.");
C("Exponential smoothing", "Fₜ₊₁ = α·yₜ + (1 − α)·Fₜ");
C("ARIMA(p, d, q)", "p autoregressive lags, d differences, q moving-average error lags.");
C("Time-series validation", "Split by time; walk forward; never shuffle.");
C("Additive vs multiplicative", "Constant seasonal swing vs swing proportional to the level.");

T("dl-basics", "ml", "Deep learning", "Neural network fundamentals", "Neurons, activations, backpropagation, optimisers, regularisation.", `
**Neuron.** a = f(w·x + b): a weighted sum passed through a non-linear activation. Layers of neurons compose into a network; without non-linearities the whole stack collapses to one linear map.

**Activations.**
- Sigmoid 1/(1 + e⁻ᶻ): output in (0, 1); saturates, giving vanishing gradients. Use at the output for binary classification.
- Tanh: output in (−1, 1), zero-centred; still saturates.
- ReLU max(0, z): cheap, no saturation for positive inputs; the default for hidden layers. "Dying ReLU": units stuck at zero. Leaky ReLU and GELU address this.
- Softmax: turns a vector of scores into probabilities summing to 1; multi-class output.

**Loss.** Regression: MSE. Binary: binary cross-entropy. Multi-class: categorical cross-entropy.

**Training.** Forward pass computes predictions and loss. Backpropagation applies the chain rule backwards to get the gradient of the loss with respect to every weight. The optimiser updates the weights.

**Optimisers.** SGD; momentum (accumulates velocity to damp oscillation); RMSProp (per-parameter adaptive step); Adam (momentum plus adaptive step: the usual default). Learning-rate schedules and warm-up help.

**Vocabulary.** Epoch: one pass over the training data. Batch size: samples per update. Iteration: one update. 1,000 samples with batch size 100 gives 10 iterations per epoch.

**Vanishing and exploding gradients.** Gradients shrink or blow up as they pass through many layers. Remedies: ReLU-family activations, careful initialisation (He for ReLU, Xavier/Glorot for tanh), batch normalisation, residual (skip) connections, gradient clipping, LSTM/GRU cells for sequences.

**Regularisation.**
- Dropout: randomly zero a fraction of activations during training; disabled at inference.
- Weight decay (L2).
- Early stopping on validation loss.
- Data augmentation (flips, crops, noise).
- Batch normalisation normalises layer inputs per mini-batch: faster, more stable training with a mild regularising effect.

**Counting parameters.** A dense layer with n inputs and m units has n × m weights + m biases.

**Why deep learning.** It learns features from raw data (images, text, audio) and scales with data and compute. On small tabular datasets, gradient-boosted trees usually win.

**Universal approximation.** A network with one sufficiently wide hidden layer can approximate any continuous function; depth makes this efficient.

**Transfer learning.** Start from a model pre-trained on a large dataset; freeze early layers and fine-tune the last ones on your data.

**PyTorch training loop.**

\`\`\`
for xb, yb in loader:
    optimizer.zero_grad()
    loss = criterion(model(xb), yb)
    loss.backward()
    optimizer.step()
\`\`\`
`, { resources: [R("Andrew Ng: Deep Learning Specialization", "https://www.coursera.org/specializations/deep-learning", "Course 1 covers these fundamentals"), R("3Blue1Brown: neural networks", "https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi", "Intuition for backpropagation"), R("Kaggle: Intro to Deep Learning", "https://www.kaggle.com/learn/intro-to-deep-learning", "Hands-on")] });
Q(1, "The default activation for hidden layers in modern networks is…", ["sigmoid", "ReLU", "softmax", "linear"], 1, "Cheap and does not saturate for positive inputs.");
N(1, "ReLU(−3) + ReLU(2)?", 2, 0.001, "0 + 2.");
Q(2, "Without non-linear activations, a deep network is equivalent to…", ["a decision tree", "a single linear model", "a random forest", "k-means"], 1, "A composition of linear maps is linear.");
Q(2, "Which output activation and loss suit a 5-class classification problem?", ["sigmoid + MSE", "softmax + categorical cross-entropy", "ReLU + MAE", "tanh + hinge"], 1, "Softmax gives a probability distribution over classes.");
N(2, "A dense layer with 10 inputs and 5 units has how many trainable parameters?", 55, 0, "50 weights + 5 biases.");
N(2, "2,000 training samples, batch size 50. Iterations per epoch?", 40, 0, "2000/50.");
Q(2, "Dropout at inference time is…", ["applied with the same rate", "turned off", "doubled", "applied to the outputs only"], 1, "All units are used; activations are scaled appropriately.");
Q(2, "Vanishing gradients are most associated with…", ["ReLU in shallow nets", "sigmoid or tanh in deep networks", "large batch sizes", "dropout"], 1, "Their derivatives are below 1 and multiply across layers.");
Q(2, "Backpropagation computes gradients using…", ["random search", "the chain rule applied from the output back to the inputs", "matrix inversion", "sorting"], 1, "It reuses intermediate derivatives layer by layer.");
Q(2, "Adam combines…", ["dropout and batch norm", "momentum and per-parameter adaptive learning rates", "L1 and L2", "bagging and boosting"], 1, "It tracks running means of gradients and squared gradients.");
Q(2, "Batch normalisation mainly…", ["increases model size", "stabilises and speeds up training by normalising layer inputs", "replaces the loss function", "removes the need for data"], 1, "It also regularises slightly.");
N(3, "Softmax of scores (0, 0): probability of the first class?", 0.5, 0.001, "Equal scores give equal probabilities.");
Q(3, "Residual (skip) connections help very deep networks because they…", ["reduce parameters", "give gradients a direct path, easing vanishing gradients", "remove activations", "replace optimisers"], 1, "The idea behind ResNet.");
Q(2, "On a small tabular dataset the strongest model is usually…", ["a deep neural network", "gradient-boosted trees", "a CNN", "an RNN"], 1, "Deep learning shines on large unstructured data.");
C("Activation functions", "Sigmoid (0,1), tanh (−1,1), ReLU max(0,z), softmax → probabilities.");
C("Epoch / batch / iteration", "One pass over the data / samples per update / one update.");
C("Fixes for vanishing gradients", "ReLU, good initialisation, batch norm, residual connections, LSTM/GRU.");
C("Regularisation in deep learning", "Dropout, weight decay, early stopping, data augmentation, batch norm.");

T("dl-architectures", "ml", "Deep learning", "CNNs, RNNs and sequence models", "Architectures for images and sequences.", `
**Convolutional neural networks (images).**

- A convolution slides a small filter (kernel) across the image, computing dot products to produce a feature map. The same weights are used at every position (parameter sharing), and each output depends on a local patch (local connectivity). This makes CNNs efficient and translation-tolerant.
- Output size per dimension = (W − K + 2P) / S + 1, with input W, kernel K, padding P, stride S.
- Parameters in a conv layer = (K × K × input channels + 1) × number of filters.
- Pooling (max or average) downsamples, reducing size and adding tolerance to small shifts.
- Typical stack: [conv → ReLU → pool] repeated, then flatten and dense layers, then softmax.
- Early layers learn edges and textures; deeper layers learn parts and objects.
- Landmarks: LeNet, AlexNet, VGG (small 3×3 filters stacked), ResNet (skip connections allow very deep nets), EfficientNet.
- Data augmentation (flip, crop, rotate, colour jitter) and transfer learning from ImageNet weights are standard.
- Tasks: classification, object detection (YOLO, Faster R-CNN), segmentation (U-Net).

**Recurrent neural networks (sequences).**

- An RNN processes one element at a time, carrying a hidden state: hₜ = f(W xₜ + U hₜ₋₁).
- Trained by backpropagation through time; long sequences cause vanishing or exploding gradients, so plain RNNs forget long-range context.
- **LSTM** adds a cell state and three gates (forget, input, output) that control what to keep, add and expose. **GRU** is a lighter version with two gates (update, reset).
- Bidirectional RNNs read both directions.
- Encoder–decoder (seq2seq): one network encodes the input into a vector, another generates the output. The single-vector bottleneck motivated attention.

**Attention.** Let the decoder look at all encoder states and weight them by relevance to the current step. Transformers take this further by dropping recurrence entirely (next topic).

**Embeddings.** Dense vectors representing discrete items (words, users, products) so that similar items are close. Learned as part of the model or pre-trained.

**Autoencoders.** An encoder compresses the input to a small code and a decoder reconstructs it; used for dimensionality reduction, denoising and anomaly detection (high reconstruction error).

**Recommendation.** Collaborative filtering (users who liked X also liked Y), matrix factorisation (user and item embeddings whose dot product predicts the rating), content-based methods, and two-tower neural models. Cold start is the problem of new users or items with no history.

**Choosing.** Images: CNN (or vision transformer with lots of data). Text: transformers. Short numeric sequences or small data: LSTM/GRU or boosted trees on lag features. Tabular: boosted trees.
`, { resources: [R("CS231n notes", "https://cs231n.github.io/convolutional-networks/", "Convolutional networks explained"), R("Colah: Understanding LSTMs", "https://colah.github.io/posts/2015-08-Understanding-LSTMs/", "The standard LSTM explainer"), R("Kaggle: Computer Vision", "https://www.kaggle.com/learn/computer-vision", "Hands-on CNNs")] });
N(2, "Input 32×32, kernel 5×5, stride 1, no padding. Output width?", 28, 0, "(32 − 5)/1 + 1.");
N(2, "Input 28×28, kernel 3×3, padding 1, stride 1. Output width?", 28, 0, "(28 − 3 + 2)/1 + 1: 'same' padding.");
N(3, "A conv layer has 16 filters of size 3×3 over 3 input channels. Number of parameters including biases?", 448, 0, "(3 × 3 × 3 + 1) × 16.");
N(2, "A 2×2 max-pool with stride 2 on a 28×28 feature map gives a width of…", 14, 0, "Halves each spatial dimension.");
Q(1, "Parameter sharing in a CNN means…", ["all layers share weights", "the same filter weights are applied at every position of the input", "filters are copied across models", "biases are removed"], 1, "It cuts parameters and gives translation tolerance.");
Q(2, "Max pooling is used to…", ["increase resolution", "downsample and add tolerance to small shifts", "normalise activations", "add non-linearity to the loss"], 1, "It keeps the strongest activation in each window.");
Q(2, "Plain RNNs struggle with long sequences mainly because of…", ["too few parameters", "vanishing or exploding gradients through time", "lack of activations", "pooling"], 1, "LSTM and GRU gates address this.");
Q(2, "The three gates of an LSTM are…", ["read, write, erase", "forget, input, output", "update, reset, new", "encode, decode, attend"], 1, "GRU has update and reset gates.");
Q(2, "The bottleneck that attention was introduced to fix in seq2seq models is…", ["slow convolution", "compressing the whole input into one fixed-length vector", "too many gates", "small vocabulary"], 1, "Attention lets the decoder look back at every input position.");
Q(2, "In matrix-factorisation recommenders, a predicted rating is…", ["the sum of user and item ids", "the dot product of the user and item embedding vectors", "the item's average rating", "random"], 1, "Latent factors.");
Q(2, "The cold-start problem refers to…", ["slow GPUs", "new users or items with no interaction history", "vanishing gradients", "small batch sizes"], 1, "Use content features or popularity as a fallback.");
Q(3, "An autoencoder detects anomalies by flagging inputs with…", ["low reconstruction error", "high reconstruction error", "large embeddings", "missing values"], 1, "It reconstructs normal patterns well and unusual ones badly.");
Q(2, "Transfer learning for an image task typically means…", ["training from scratch", "starting from weights pre-trained on a large dataset and fine-tuning the last layers", "copying labels", "using a smaller image size"], 1, "Needs far less data.");
C("Conv output size", "(W − K + 2P)/S + 1");
C("Conv layer parameters", "(K·K·C_in + 1) × number of filters");
C("LSTM vs GRU", "LSTM: cell state + forget, input, output gates. GRU: update and reset gates, fewer parameters.");
C("Why CNNs for images", "Local connectivity + parameter sharing + pooling → few parameters, translation tolerance.");

T("nlp-llm", "ml", "NLP and GenAI", "NLP, transformers and LLM basics", "Text representation, attention, pre-training, prompting and fine-tuning.", `
**Classical text pipeline.** Lower-case, tokenise, remove stop words, stem (crude suffix chopping) or lemmatise (dictionary base form). Represent documents as bag of words (counts), n-grams, or TF-IDF: term frequency × log(N / document frequency), which down-weights words common to all documents. Then a linear model or Naive Bayes.

**Embeddings.** Word2vec and GloVe give each word one static vector; similar words are close and analogies emerge. Contextual embeddings (BERT and later) give a word a different vector in each sentence. Sentence embeddings represent whole passages. Similarity is usually cosine.

**Tokenisation for LLMs.** Sub-word methods (BPE, WordPiece, SentencePiece) split rare words into pieces, so the vocabulary is fixed and nothing is out of vocabulary. Cost, context limits and speed are measured in tokens; in English a token is roughly three-quarters of a word.

**Transformer.**
- Self-attention: every token builds a query, key and value vector. Attention(Q, K, V) = softmax(QKᵀ / √d) V: each token takes a weighted mix of all tokens' values, with weights from query–key similarity.
- Multi-head attention runs several attention patterns in parallel.
- Positional encodings add order information, since attention itself is order-free.
- Each block: attention, feed-forward layer, residual connections, layer normalisation.
- Processes all tokens in parallel, unlike RNNs, and captures long-range dependencies.

**Model families.**
- Encoder-only (BERT): masked language modelling; good for classification, NER, embeddings.
- Decoder-only (GPT-style): next-token prediction; text generation.
- Encoder–decoder (T5): translation, summarisation.

**Pre-training and fine-tuning.** Pre-train on huge unlabelled text, then adapt. Full fine-tuning updates all weights. Parameter-efficient fine-tuning (LoRA, QLoRA) trains small low-rank adapter matrices while the base model stays frozen. Instruction tuning and preference-based methods (RLHF, DPO) shape behaviour.

**Generation controls.** Temperature scales randomness (0 is near-deterministic; higher is more varied). Top-k and top-p (nucleus) sampling restrict the candidate tokens. Max tokens caps length. The context window is the maximum number of tokens the model can attend to at once.

**Prompting.** Clear instruction and role; context; examples (few-shot); ask for step-by-step reasoning on hard problems; specify the output format (for example a JSON schema); use delimiters around inputs. A system prompt sets standing behaviour. Structured outputs and function calling return machine-readable JSON.

**Hallucination.** Fluent but unsupported output. Reduce with grounding (retrieval), instructions to answer only from the supplied context and to say "not found", citations, lower temperature, constrained outputs, and verification.

**Evaluation.** BLEU and ROUGE (n-gram overlap) for translation and summarisation; perplexity for language models; task accuracy; human review; LLM-as-judge with a rubric, spot-checked by people.

**Classic NLP tasks.** Sentiment and intent classification, named-entity recognition, topic modelling (LDA), summarisation, question answering, speech-to-text.
`, { resources: [R("Jay Alammar: The Illustrated Transformer", "https://jalammar.github.io/illustrated-transformer/", "The clearest walkthrough of attention"), R("Hugging Face LLM Course", "https://huggingface.co/learn/llm-course/chapter1/1", "Tokenisers, transformers, fine-tuning"), R("Microsoft: Generative AI for Beginners", "https://github.com/microsoft/generative-ai-for-beginners", "Lessons 1–8 for the basics"), R("LLM interview questions", "https://github.com/KalyanKS-NLP/LLM-Interview-Questions-and-Answers", "Practise explaining answers aloud")], categories: ["llm/rag"] });
Q(1, "TF-IDF gives a low weight to words that…", ["are rare", "appear in almost every document", "are long", "are nouns"], 1, "The inverse-document-frequency term shrinks them.");
Q(1, "Raising the temperature of an LLM makes its output…", ["more deterministic", "more random and varied", "shorter", "more factual"], 1, "It flattens the next-token distribution.");
Q(2, "Self-attention lets each token…", ["see only the previous token", "weigh every other token in the sequence when building its representation", "skip the feed-forward layer", "be removed"], 1, "Weights come from query–key similarity.");
Q(2, "Transformers need positional encodings because…", ["attention is order-invariant on its own", "tokens are too long", "they use recurrence", "GPUs require it"], 0, "Without them 'dog bites man' and 'man bites dog' look the same.");
Q(2, "BERT is pre-trained mainly by…", ["next-token prediction", "masked language modelling", "image classification", "reinforcement learning"], 1, "It predicts hidden tokens using context on both sides.");
Q(2, "LoRA fine-tuning…", ["updates every weight", "trains small low-rank adapter matrices while the base model stays frozen", "removes layers", "needs no data"], 1, "Far cheaper than full fine-tuning.");
Q(2, "Sub-word tokenisation (BPE) is used because it…", ["makes text shorter", "handles rare and new words with a fixed-size vocabulary", "removes punctuation", "translates text"], 1, "Unknown words are split into known pieces.");
Q(2, "Which is the most direct way to reduce hallucination about company policy?", ["Raise the temperature", "Ground answers in retrieved policy text and require citations", "Use a longer prompt", "Ask twice"], 1, "Grounding supplies the facts.");
Q(2, "Few-shot prompting means…", ["fine-tuning on a few examples", "including a handful of worked examples in the prompt", "using a small model", "limiting tokens"], 1, "The model imitates the pattern in the prompt.");
N(3, "Scaled dot-product attention with two keys scoring 0 and 0 against the query: the attention weight on the first key?", 0.5, 0.001, "Softmax of equal scores is uniform.");
Q(2, "A decoder-only model such as GPT is trained to…", ["fill in masked tokens", "predict the next token", "classify images", "cluster documents"], 1, "Autoregressive generation.");
Q(2, "The context window of an LLM is…", ["the number of GPUs", "the maximum number of tokens it can consider at once", "the size of its vocabulary", "its training set"], 1, "Prompt plus output must fit.");
Q(3, "ROUGE is mainly used to evaluate…", ["classification", "summarisation by n-gram overlap with reference summaries", "retrieval latency", "image quality"], 1, "Recall-oriented overlap.");
Q(3, "In top-p (nucleus) sampling with p = 0.9, the model samples from…", ["the 9 most likely tokens", "the smallest set of tokens whose probabilities sum to at least 0.9", "all tokens equally", "only the top token"], 1, "The candidate set adapts to the distribution.");
C("Attention formula", "softmax(QKᵀ/√d) V");
C("BERT vs GPT", "Encoder, masked-token pre-training, understanding tasks vs decoder, next-token prediction, generation.");
C("Temperature / top-p", "Temperature scales randomness; top-p samples from the smallest set covering probability p.");
C("Ways to reduce hallucination", "Retrieval grounding, answer-only-from-context instruction, citations, low temperature, structured output, verification.");
C("LoRA", "Train low-rank adapters; base weights frozen.");

T("rag-agents", "ml", "NLP and GenAI", "RAG, vector search and agents", "Building LLM applications that use your own data and tools.", `
**Why RAG.** A language model knows only its training data and cannot cite sources. Retrieval-augmented generation fetches relevant passages at question time and passes them to the model as context: fresher, private knowledge, citations, and fewer hallucinations, without retraining.

**Pipeline.**
1. **Ingest**: parse documents (PDF, HTML), keep metadata (source, date, version, access rights).
2. **Chunk**: split into passages, typically a few hundred tokens with overlap. Too small loses context; too large blurs the embedding and wastes the context window. Split on structure (headings, paragraphs) where possible.
3. **Embed**: convert each chunk to a vector with an embedding model.
4. **Index**: store vectors in a vector database (FAISS, pgvector, Chroma, Pinecone, Weaviate). Approximate nearest-neighbour indexes (HNSW, IVF) trade a little recall for speed.
5. **Retrieve**: embed the query, fetch the top-k most similar chunks (cosine similarity), with metadata filters.
6. **Rerank** (optional): a cross-encoder rescores candidates; retrieve 20–50, keep 3–8.
7. **Generate**: prompt = instructions + retrieved context + question; ask for citations and for "I don't know" when the context is insufficient.

**Hybrid search.** Combine dense vectors with keyword search (BM25). Dense retrieval handles paraphrase; keywords handle exact terms, codes and names.

**Query techniques.** Query rewriting, multi-query expansion, HyDE (embed a hypothetical answer), parent–child retrieval (retrieve small chunks, pass the larger parent).

**Evaluation.** Separate retrieval from generation.
- Retrieval: recall@k, precision@k, MRR, context precision and recall.
- Generation: faithfulness (is every claim supported by the context?), answer relevance, correctness against a reference.
- Keep a fixed test set of real questions; run it on every change. Tools: RAGAS, LLM-as-judge with spot checks.

**Failure diagnosis.** Wrong answer with the right chunk retrieved: a generation or prompt problem. Right chunk missing: chunking, embedding or retrieval problem. Outdated answer: stale index or no version filter.

**RAG vs fine-tuning.** RAG for knowledge that changes or must be cited. Fine-tuning for style, format or a narrow skill. They are often combined.

**Agents.** An LLM in a loop that plans, calls tools (search, code, APIs, databases) through function calling, reads the results and decides the next step (the ReAct pattern: reason, act, observe). Components: tools with clear schemas, memory (conversation and long-term), planning, and guardrails. The Model Context Protocol (MCP) standardises how tools and data sources are exposed to models.

**Production concerns.** Latency (retrieval plus generation; stream the output), cost per query (tokens in and out), caching, rate limits and retries, prompt-injection defences (treat retrieved text as data, not instructions), PII handling, access control at retrieval time, logging and monitoring, human fallback.

**Minimal chatbot** (a reported practical round): an endpoint that accepts a message, appends it to the conversation history, calls the LLM API with a system prompt, returns JSON, and handles timeouts and errors. Be ready to explain tokens, temperature and the system prompt.
`, { resources: [R("DeepLearning.AI: LangChain, Chat with Your Data", "https://www.deeplearning.ai/short-courses/langchain-chat-with-your-data/", "Load, split, embed, retrieve, answer"), R("LangChain RAG tutorial", "https://docs.langchain.com/oss/python/langchain/rag", "Build one end to end"), R("RAG interview questions", "https://github.com/KalyanKS-NLP/RAG-Interview-Questions-and-Answers", "Chunking, hybrid search, reranking"), R("Model Context Protocol", "https://modelcontextprotocol.io/", "Introduction to MCP")], categories: ["llm/rag"] });
Q(1, "RAG stands for…", ["Random Answer Generation", "Retrieval-Augmented Generation", "Recursive Attention Graph", "Ranked Agent Group"], 1, "Retrieve relevant text, then generate from it.");
Q(2, "The main reason to use RAG instead of relying on the model alone is…", ["faster generation", "access to current or private knowledge with citations", "smaller prompts", "no need for an LLM"], 1, "The model's own knowledge is fixed at training time.");
Q(2, "Chunks that are too large tend to…", ["lose context", "blur the embedding and waste context window", "improve precision", "speed up retrieval"], 1, "One vector has to represent several topics.");
Q(2, "Hybrid search combines…", ["two LLMs", "dense vector similarity with keyword (BM25) matching", "SQL and NoSQL", "training and inference"], 1, "Keywords catch exact terms that embeddings miss.");
Q(2, "A reranker is applied…", ["before embedding", "after initial retrieval, to reorder candidates more accurately", "after generation", "during ingestion"], 1, "A cross-encoder scores query–passage pairs.");
N(2, "Cosine similarity of a = (1, 2, 2) and b = (2, 1, 2)? (3 decimals)", 0.889, 0.002, "8 / (3 × 3).");
Q(2, "The bot answers wrongly although the correct chunk was retrieved. The first place to look is…", ["the embedding model", "the prompt and generation step", "the vector index", "the chunk size"], 1, "Retrieval succeeded; generation did not use it properly.");
Q(2, "Faithfulness in RAG evaluation asks whether…", ["the answer is long enough", "every claim in the answer is supported by the retrieved context", "retrieval was fast", "the question was clear"], 1, "It measures grounding, separately from correctness of retrieval.");
Q(2, "When is fine-tuning preferable to RAG?", ["When facts change weekly", "When you need a consistent style, format or narrow task behaviour", "When answers need sources", "When data is private"], 1, "Fine-tuning changes behaviour, not knowledge freshness.");
Q(2, "In an agent, function calling lets the model…", ["train itself", "request that a named tool be run with structured arguments", "edit its own weights", "bypass the system prompt"], 1, "The application executes the tool and returns the result.");
Q(3, "Prompt injection through a retrieved document is mitigated by…", ["raising temperature", "treating retrieved text as data, not instructions, and limiting tool permissions", "using larger chunks", "removing citations"], 1, "Never let untrusted content steer the system.");
N(3, "Top-5 retrieval returns relevant chunks at ranks 2 and 4, and there are 4 relevant chunks in total. Recall@5?", 0.5, 0.001, "2 of 4.");
N(3, "Same result. Precision@5?", 0.4, 0.001, "2 of 5.");
Q(2, "HNSW and IVF are…", ["embedding models", "approximate nearest-neighbour index structures", "chunking methods", "LLM architectures"], 1, "They make vector search fast at scale.");
C("RAG pipeline", "Ingest → chunk → embed → index → retrieve → rerank → generate with citations.");
C("Diagnosing a wrong RAG answer", "Check retrieval first. Right chunk present: prompt/generation. Absent: chunking, embedding or search.");
C("RAG vs fine-tuning", "Knowledge that changes or must be cited vs style, format or a narrow skill.");
C("Agent loop (ReAct)", "Reason → act (call a tool) → observe → repeat.");
C("RAG metrics", "Retrieval: recall@k, precision@k, MRR. Generation: faithfulness, relevance, correctness.");

T("ml-ops", "ml", "Systems", "Deployment, MLOps and data engineering", "Serving, monitoring, pipelines and the system-design vocabulary.", `
**Serving patterns.**
- Batch (offline) inference: score many records on a schedule; write to a table. Cheap and simple; fine when predictions need not be instant (weekly churn scores).
- Online (real-time) inference: a model behind an API answers each request within a latency budget (fraud, credit decision, recommendations).
- Streaming: score events as they arrive from a queue.
- Edge: the model runs on the device.

**Packaging.** Serialise the model (joblib, pickle, ONNX), wrap it in an API (FastAPI: endpoint, request schema, validation), containerise with Docker (the image holds code and dependencies; a container is a running instance), deploy on a cloud service. Version the model together with its preprocessing and feature list.

**Release strategies.** Shadow (run alongside, do not act on output), canary (a small share of traffic), A/B test, blue–green (switch between two environments), with a rollback plan.

**Monitoring.**
- Data drift: input distributions change. Population stability index, PSI = Σ (actual% − expected%) × ln(actual% / expected%); below 0.1 stable, 0.1–0.25 watch, above 0.25 significant.
- Concept drift: the relationship between inputs and target changes.
- Prediction distribution, live performance once labels arrive, latency, error rate, data-quality checks.
- Retraining triggers: schedule, drift threshold, or performance drop.

**Training–serving skew.** Features computed differently in training and production. A feature store keeps one definition, served offline (point-in-time correct joins for training) and online (low-latency lookup).

**Experiment tracking.** MLflow records parameters, metrics and artefacts; a model registry tracks versions and stages. Reproducibility: fixed seeds, pinned dependencies, versioned data.

**CI/CD.** Automated tests and builds on every commit; automated deployment. Git: branch, commit, pull request, merge.

**Data engineering.**
- ETL (extract, transform, load) transforms before loading; ELT loads raw data and transforms inside the warehouse.
- Data warehouse (structured, modelled, SQL: BigQuery, Snowflake, Redshift) vs data lake (raw files of any type) vs lakehouse (Databricks, Delta).
- Orchestration: Airflow runs tasks as a DAG (directed acyclic graph) on a schedule with retries.
- Spark: distributed processing. DataFrames are lazily evaluated (transformations build a plan; actions run it); partitions spread work across executors; a broadcast join ships a small table to every executor to avoid a shuffle.
- Partitioning splits a table by a column (usually date) so queries scan less; clustering sorts within partitions.
- Batch vs stream processing (Kafka is the common event log).
- Slowly changing dimensions: Type 1 overwrite, Type 2 add a new row with validity dates (keeps history), Type 3 add a previous-value column.
- Data quality and governance: lineage, validation tests, PII masking, access control.

**System-design vocabulary.** Client → API → service → cache / database → queue / worker. Caching, pagination, rate limiting, load balancing, horizontal scaling, replication, latency vs throughput, p99 latency and SLAs, idempotent retries, timeouts and fallbacks.

**Answering "design an ML system".** Clarify the goal and metric → data and labels → features (batch vs real-time) → model and baseline → offline evaluation → serving path and latency budget → monitoring and retraining → risks and fallbacks.
`, { resources: [R("Made With ML", "https://madewithml.com/", "End-to-end MLOps course"), R("freeCodeCamp: FastAPI", "https://www.youtube.com/watch?v=tLKKmouUams", "Build CRUD endpoints"), R("TechWorld with Nana: Docker", "https://www.youtube.com/watch?v=pg19Z8LL06w", "Containers, images, ports"), R("Google: Rules of ML", "https://developers.google.com/machine-learning/guides/rules-of-ml", "Practical engineering advice")], categories: ["sysdesign/features"] });
Q(1, "Weekly churn scores for a retention campaign are best produced by…", ["real-time inference", "batch inference", "edge inference", "manual scoring"], 1, "No need for instant predictions.");
Q(2, "Data drift means…", ["the model's code changed", "the distribution of input features changed from training", "the labels are wrong", "latency increased"], 1, "Concept drift is a change in the input–target relationship.");
Q(2, "A PSI of 0.3 on a key feature indicates…", ["no change", "a significant shift worth investigating", "a bug in the metric", "perfect stability"], 1, "Above 0.25 is the usual alarm level.");
Q(2, "A feature store mainly prevents…", ["overfitting", "training–serving skew by using one feature definition for both", "slow GPUs", "class imbalance"], 1, "Plus point-in-time correct training data.");
Q(2, "A Docker image is…", ["a running process", "a packaged, immutable snapshot of code and dependencies from which containers are started", "a virtual machine", "a database"], 1, "A container is a running instance of an image.");
Q(2, "A canary release…", ["switches all traffic at once", "sends a small share of traffic to the new version first", "runs only offline", "deletes the old model"], 1, "Problems are caught with limited exposure.");
Q(2, "In Airflow, a DAG is…", ["a database", "a directed acyclic graph of tasks with dependencies", "a model format", "a dashboard"], 1, "It defines what runs and in which order.");
Q(2, "ELT differs from ETL in that…", ["no loading happens", "raw data is loaded first and transformed inside the warehouse", "it uses no SQL", "it is only for streaming"], 1, "Common with cloud warehouses.");
Q(3, "Spark's lazy evaluation means…", ["jobs run slowly", "transformations only build a plan, which runs when an action is called", "data is never cached", "only one executor is used"], 1, "This lets Spark optimise the whole plan.");
Q(3, "A broadcast join in Spark is appropriate when…", ["both tables are huge", "one table is small enough to copy to every executor", "there is no join key", "data is streaming"], 1, "It avoids shuffling the large table.");
Q(2, "SCD Type 2 handles a changed customer address by…", ["overwriting the old value", "adding a new row with validity dates, keeping history", "deleting the customer", "adding a column"], 1, "Type 1 overwrites; Type 3 keeps one previous value in a column.");
Q(2, "p99 latency of 300 ms means…", ["the average is 300 ms", "99% of requests complete within 300 ms", "1% complete within 300 ms", "the maximum is 300 ms"], 1, "Tail latency.");
Q(3, "Offline AUC is high but online performance is poor from day one, with no population change. The most likely cause is…", ["concept drift", "training–serving skew or leakage", "too few trees", "a high learning rate"], 1, "Drift takes time; an immediate gap points to the pipeline.");
N(3, "A feature's bins had expected shares 50% / 50% and now show 60% / 40%. PSI? (3 decimals)", 0.041, 0.002, "0.1 × ln(1.2) + (−0.1) × ln(0.8) = 0.0182 + 0.0223.");
Q(2, "Partitioning a large table by date mainly helps…", ["storage encryption", "queries that filter on date scan far less data", "joins on customer id", "schema changes"], 1, "Partition pruning.");
C("Batch vs online inference", "Scheduled scoring to a table vs an API answering within a latency budget.");
C("Data drift vs concept drift", "Inputs change vs the input–target relationship changes.");
C("PSI thresholds", "< 0.1 stable; 0.1–0.25 watch; > 0.25 significant.");
C("ETL vs ELT", "Transform before loading vs load raw then transform in the warehouse.");
C("SCD types", "1 overwrite; 2 new row with dates (history); 3 previous-value column.");
C("ML system design outline", "Goal and metric → data → features → model → offline eval → serving and latency → monitoring → risks.");
