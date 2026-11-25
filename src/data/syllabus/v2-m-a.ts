/**
 * v2 Maths for ML, part A: Linear algebra. Fixed ids; answers recomputed in Pyodide.
 */
import { iq, lessonWriter } from "./v2-shared";
import { MS } from "./v2-m-src";

const { L, Q, C } = lessonWriter("maths");
const LA = "Linear algebra";
const NP = ["numpy"];

L("m-vectors", LA, "Vectors, dot products and cosine similarity", "Vectors as lists of features, the dot product as alignment, and why search ranks by cosine.", {
  kind: "concept", mins: 20,
  hook: "Two customers spend in the same proportions, but one spends ten times more. Are they 'similar'?",
  intuition: `
**The situation.** Every row in your dataset is a vector: a customer is (monthly spend, transactions, tenure), a sentence is a 768-number embedding. Comparing rows means comparing vectors.

**The idea.** A vector has a **direction** and a **length**. The **dot product** $a \\cdot b$ multiplies matching entries and adds them up. It is large when the vectors point the same way *and* are long. **Cosine similarity** divides out the lengths and keeps only the direction.

- Two customers with the same spending mix but different budgets have cosine similarity 1 and a large Euclidean distance.
- Embedding search usually ranks by cosine (or by dot product on normalised vectors) because direction carries meaning and length often reflects frequency or document size.
`,
  maths: `
**In one breath.** $a \\cdot b = \\sum_i a_i b_i = \\|a\\|\\|b\\|\\cos\\theta$; $\\cos\\theta = \\frac{a \\cdot b}{\\|a\\|\\|b\\|} \\in [-1, 1]$; for unit vectors $\\|a - b\\|^2 = 2 - 2\\cos\\theta$.

**Worked example.** $a = (4, 3)$, $b = (6, 1.5)$. $a \\cdot b = 24 + 4.5 = 28.5$; $\\|a\\| = 5$, $\\|b\\| = 6.185$; $\\cos\\theta = 0.922$; $\\|a - b\\| = \\sqrt{4 + 2.25} = 2.5$.

**Projection.** The component of $a$ along $b$ is $\\frac{a \\cdot b}{\\|b\\|}$, and the projected vector is $\\frac{a \\cdot b}{b \\cdot b}\\, b$. A dot product is "how much of one vector lies along the other", scaled by the other's length.

**Orthogonal** means $a \\cdot b = 0$: the features carry no linear overlap.

| Measure | Cares about | Range | Used in |
|---|---|---|---|
| Dot product | direction and length | $(-\\infty, \\infty)$ | linear models, attention scores |
| Cosine similarity | direction only | $[-1, 1]$ | text/embedding search |
| Euclidean distance | position | $[0, \\infty)$ | k-NN, k-means |

For unit-length vectors all three give the same ranking, which is why many vector databases normalise embeddings once and then use the fast dot product.
`,
  practice: `
**Where it shows up.** Linear models compute $w \\cdot x$; attention scores are dot products of queries and keys (divided by $\\sqrt{d}$ to keep the softmax from saturating); recommenders score user · item embeddings; RAG retrieves by cosine.

**Choosing.** Use the measure the embedding model was trained with. Normalise if you want cosine with dot-product speed. Scale tabular features before using any of these, or the largest-unit feature dominates.
`,
  traps: [
    { trap: "Cosine similarity is a distance, so smaller is closer.", why: "It's a similarity: 1 is identical direction, 0 orthogonal, −1 opposite. Cosine distance is $1 - \\cos\\theta$." },
    { trap: "Dot product and cosine always rank items the same way.", why: "Only for vectors of equal length. A long, loosely aligned vector can beat a short, perfectly aligned one on dot product." },
  ],
  say: {
    prompt: "Dot product vs cosine similarity: what's the difference and when would you use each?",
    secs: 40,
    check: ["Dot product = sum of products = ‖a‖‖b‖cos θ", "Cosine divides out lengths: direction only, range −1 to 1", "Dot rewards length (popularity, frequency); cosine doesn't", "Unit vectors: dot = cosine and Euclidean ranking agrees", "Example: embedding search, attention, recommenders"],
    followups: [
      { q: "Why does attention divide by √d?", a: "With $d$ independent components of unit variance, the dot product has variance $d$; large scores push softmax into saturation with tiny gradients. Dividing by $\\sqrt d$ keeps the variance at 1." },
      { q: "How are cosine and Euclidean distance related?", a: "For unit vectors $\\|a - b\\|^2 = 2 - 2\\cos\\theta$, so ranking by smallest distance equals ranking by largest cosine." },
      { q: "What does orthogonality mean for two features?", a: "Their centred versions have zero dot product, i.e. zero sample covariance: no linear redundancy between them." },
    ],
    answer: `The dot product sums the products of matching entries and equals the lengths times the cosine of the angle, so it grows with both alignment and magnitude. Cosine similarity divides by the lengths, keeping only direction, from −1 to 1.

I'd use cosine when length is a nuisance, like comparing documents or embeddings where length tracks size or frequency, and the raw dot product when magnitude is meaningful, like a linear model's score or a recommender where popularity should count. If vectors are normalised the two give identical rankings, so vector search often normalises once and uses the cheaper dot product.`,
    avoid: ["Calling cosine similarity a distance", "Claiming dot and cosine always agree"],
  },
  terms: [["Dot product", "Σ aᵢbᵢ = ‖a‖‖b‖cos θ."], ["Cosine similarity", "a·b / (‖a‖‖b‖)."], ["Orthogonal", "Dot product zero."]],
  sources: [MS.mml, MS.dlb],
});
Q({ id: "m-vec-1", d: 1, secs: 30, prompt: "Dot product of a = (4, 3) and b = (6, 1.5)?", answer: 28.5, tol: 0.01, explain: "4·6 + 3·1.5 = 24 + 4.5 = 28.5.", py: "import numpy as np\nanswer = float(np.dot([4,3],[6,1.5]))", packages: NP });
Q({ id: "m-vec-2", d: 2, secs: 60, prompt: "Cosine similarity of a = (4, 3) and b = (6, 1.5)? (3 decimals)", answer: 0.922, tol: 0.002, explain: "28.5/(5 × 6.185) = 0.922.", py: "import numpy as np\na=np.array([4,3.]);b=np.array([6,1.5])\nanswer = float(a@b/np.linalg.norm(a)/np.linalg.norm(b))", packages: NP });
Q({ id: "m-vec-3", d: 2, secs: 45, prompt: "Two unit vectors have cosine similarity 0.8. What is their Euclidean distance? (3 decimals)", answer: 0.632, tol: 0.002, explain: "√(2 − 2 × 0.8) = √0.4 = 0.632.", py: "answer = (2-2*0.8)**0.5" });
Q({ id: "m-vec-4", d: 2, secs: 60, prompt: "Project a = (3, 4) onto b = (1, 0)... then onto c = (1, 1). Length of the projection of a onto c? (3 decimals)", answer: 4.95, tol: 0.002, explain: "a·c/‖c‖ = 7/√2 = 4.950.", py: "import numpy as np\na=np.array([3,4.]);c=np.array([1,1.])\nanswer = float(a@c/np.linalg.norm(c))", packages: NP });
Q({ id: "m-vec-5", d: 1, secs: 30, prompt: "Customer A spends (10, 20, 30) across three categories; customer B spends (100, 200, 300). Cosine similarity?", answer: 1, tol: 0.001, explain: "B = 10A: same direction, cosine 1, even though the Euclidean distance is large.", py: "import numpy as np\na=np.array([10,20,30.]);b=10*a\nanswer = float(a@b/np.linalg.norm(a)/np.linalg.norm(b))", packages: NP });
C("m-vec-c1", "Dot, cosine, distance for unit vectors", "‖a − b‖² = 2 − 2cos θ, so all three rank the same.");
C("m-vec-c2", "Why attention divides by √d", "Dot products of d unit-variance components have variance d; scaling keeps softmax out of saturation.");

L("m-norms", LA, "Norms and distances", "L1, L2 and L∞ norms, unit balls, and where each appears in ML.", {
  kind: "concept", mins: 15, prereq: ["m-vectors"],
  hook: "Lasso uses the L1 norm and ridge the L2 norm. Why does that one-character difference zero out coefficients?",
  intuition: `
**The situation.** "How big is this vector?" has more than one answer, and ML uses several: regularisation penalties, distance metrics, gradient clipping, error metrics.

**The idea.** A **norm** measures size. The family $\\|x\\|_p = (\\sum |x_i|^p)^{1/p}$:

- **L2** (Euclidean): straight-line length. Penalising it shrinks everything smoothly.
- **L1** (Manhattan): sum of absolute values. Penalising it pushes small entries to exactly zero.
- **L∞**: the largest absolute entry. Used for worst-case bounds (adversarial perturbations).

Picture the **unit ball** $\\{x : \\|x\\| \\le 1\\}$: L2 is a circle, L1 a diamond with corners on the axes, L∞ a square. A loss's contours tend to first touch the diamond at a corner, where some coordinates are zero. That is lasso's sparsity.
`,
  maths: `
**In one breath.** $\\|x\\|_1 = \\sum|x_i|$, $\\|x\\|_2 = \\sqrt{\\sum x_i^2}$, $\\|x\\|_\\infty = \\max|x_i|$; for any $x$, $\\|x\\|_\\infty \\le \\|x\\|_2 \\le \\|x\\|_1 \\le \\sqrt n\\,\\|x\\|_2$.

**Worked example.** $x = (3, -4, 0, 1)$: $\\|x\\|_1 = 8$, $\\|x\\|_2 = \\sqrt{26} = 5.099$, $\\|x\\|_\\infty = 4$.

**Norm axioms.** $\\|x\\| \\ge 0$ with equality only at 0; $\\|cx\\| = |c|\\|x\\|$; triangle inequality $\\|x + y\\| \\le \\|x\\| + \\|y\\|$. ($p < 1$ breaks the triangle inequality, so "L0", the count of non-zeros, isn't a true norm.)

**Matrix norms.** Frobenius $\\|A\\|_F = \\sqrt{\\sum A_{ij}^2}$ (= square root of the sum of squared singular values); spectral $\\|A\\|_2 = \\sigma_{\\max}$, the most a matrix can stretch a vector.

| Norm | Appears as |
|---|---|
| L2² | ridge / weight decay, MSE |
| L1 | lasso, MAE, Manhattan distance |
| L∞ | adversarial budgets, max error |
| Frobenius | matrix reconstruction error (PCA, low-rank) |
| Spectral | Lipschitz bounds, spectral normalisation |
`,
  practice: `
**Gradient clipping** rescales the gradient when its L2 norm exceeds a threshold: $g \\leftarrow g \\cdot \\min(1, c/\\|g\\|_2)$, preventing exploding updates.

**Distances.** Manhattan distance is more robust to a single large coordinate difference than Euclidean; choose by what "close" means for your features.
`,
  traps: [
    { trap: "L0 'norm' regularisation is just a stronger lasso.", why: "Counting non-zeros is non-convex and combinatorial to optimise; L1 is its convex relaxation, which is why lasso is used instead." },
    { trap: "Ridge uses the L2 norm, so it penalises ‖w‖₂.", why: "Ridge penalises the squared L2 norm ‖w‖₂², which is smooth everywhere; the unsquared norm has a kink at zero." },
  ],
  say: {
    prompt: "Compare the L1 and L2 norms and explain why L1 regularisation gives sparse solutions.",
    secs: 45,
    check: ["Definitions: sum of |x| vs root of sum of squares", "Unit-ball geometry: diamond with corners on the axes vs circle", "Constant-magnitude gradient of L1 pushes small weights to exactly 0", "L2 shrinks proportionally, never exactly zero", "Uses: lasso/MAE vs ridge/MSE"],
    followups: [
      { q: "What is the Frobenius norm?", a: "The square root of the sum of squared entries of a matrix, equal to the root of the sum of squared singular values." },
      { q: "Why does MAE resist outliers more than MSE?", a: "Errors enter linearly, not squared, so one huge residual can't dominate the total." },
      { q: "What does gradient clipping by norm do?", a: "If ‖g‖₂ exceeds c, rescale g to have norm c, keeping its direction but capping the step size." },
    ],
    answer: `The L1 norm adds absolute values; the L2 norm is the square root of the sum of squares, the ordinary length. As penalties, the L2-squared penalty has gradient proportional to the weight, so it shrinks weights smoothly towards zero but never reaches it. The L1 penalty's gradient has constant size, so it keeps pushing small weights until they hit exactly zero. Geometrically the L1 ball is a diamond with corners on the axes, and the loss contours usually touch it at a corner, giving sparse solutions.`,
    avoid: ["Saying ridge penalises the unsquared norm", "Calling L0 a convex norm"],
  },
  terms: [["Lp norm", "(Σ|xᵢ|^p)^(1/p)."], ["Frobenius norm", "√(Σ A_ij²)."], ["Spectral norm", "Largest singular value."]],
  sources: [MS.mml, MS.dlb],
});
Q({ id: "m-nrm-1", d: 1, secs: 30, prompt: "L1 norm of x = (3, −4, 0, 1)?", answer: 8, tol: 0.01, explain: "3 + 4 + 0 + 1 = 8.", py: "import numpy as np\nanswer = float(np.linalg.norm([3,-4,0,1],1))", packages: NP });
Q({ id: "m-nrm-2", d: 1, secs: 30, prompt: "L2 norm of x = (3, −4, 0, 1)? (3 decimals)", answer: 5.099, tol: 0.002, explain: "√(9 + 16 + 0 + 1) = √26.", py: "import numpy as np\nanswer = float(np.linalg.norm([3,-4,0,1]))", packages: NP });
Q({ id: "m-nrm-3", d: 2, secs: 45, prompt: "A gradient (6, 8) is clipped to maximum L2 norm 5. What is its first component after clipping?", answer: 3, tol: 0.01, explain: "‖g‖ = 10; scale by 5/10 → (3, 4).", py: "import numpy as np\ng=np.array([6,8.]);g=g*min(1,5/np.linalg.norm(g))\nanswer = float(g[0])", packages: NP });
Q({ id: "m-nrm-4", d: 2, secs: 60, prompt: "Frobenius norm of [[1, 2], [2, 4]]?", answer: 5, tol: 0.01, explain: "√(1 + 4 + 4 + 16) = 5.", py: "import numpy as np\nanswer = float(np.linalg.norm([[1,2],[2,4]],'fro'))", packages: NP });
Q({ id: "m-nrm-5", d: 2, secs: 45, prompt: "Which is always true for any vector x?", options: ["‖x‖₁ ≤ ‖x‖₂", "‖x‖₂ ≤ ‖x‖₁", "‖x‖∞ ≥ ‖x‖₂", "‖x‖₁ = ‖x‖₂"], answer: 1, explain: "‖x‖∞ ≤ ‖x‖₂ ≤ ‖x‖₁.", py: "import numpy as np\nrng=np.random.default_rng(0)\nok=all(np.linalg.norm(x)<=np.linalg.norm(x,1)+1e-12 for x in rng.normal(size=(1000,5)))\nanswer = 1 if ok else 0", packages: NP });
C("m-nrm-c1", "Norm ordering", "‖x‖∞ ≤ ‖x‖₂ ≤ ‖x‖₁ ≤ √n‖x‖₂.");
C("m-nrm-c2", "Why L1 gives zeros", "Constant-size gradient and a diamond-shaped ball with corners on the axes.");

L("m-matrices", LA, "Matrices as transformations and matrix multiplication", "What a matrix does to space, shape rules, and reading a neural network layer as a matrix.", {
  kind: "concept", mins: 20, prereq: ["m-vectors"],
  hook: "A (32, 512) batch goes through a layer with a (512, 256) weight matrix. What comes out, and what did the matrix 'do'?",
  intuition: `
**The situation.** Every dense layer, every linear regression and every PCA projection is a matrix multiplication. Shape errors are the most common bug in ML code.

**The idea.** A matrix is a function that takes vectors to vectors: it can stretch, rotate, shear, reflect, project or squash space. Its columns tell you where the basis vectors land. Multiplying matrices composes the transformations: $AB$ means "do $B$, then $A$".

**Rows as dot products.** Each entry of $Ax$ is a dot product of a row of $A$ with $x$. A layer $XW$ scores every input row against every column of $W$.
`,
  maths: `
**In one breath.** $(m \\times n)(n \\times p) = (m \\times p)$; $(AB)_{ij} = \\sum_k A_{ik}B_{kj}$; cost $\\approx 2mnp$ flops; $(AB)^\\top = B^\\top A^\\top$; $AB \\ne BA$ in general.

**Worked example.** $A = \\begin{pmatrix}2 & 0\\\\ 0 & 3\\end{pmatrix}$ stretches x by 2 and y by 3; it maps the unit square to area $6 = \\det A$. $R = \\begin{pmatrix}0 & -1\\\\ 1 & 0\\end{pmatrix}$ rotates by 90°. $AR \\ne RA$: rotate-then-stretch differs from stretch-then-rotate.

**Determinant.** The factor by which areas/volumes scale; negative means orientation flips; zero means space is squashed to a lower dimension (not invertible).

**Neural layer.** Input batch $X$ (32 × 512), weights $W$ (512 × 256), bias $b$ (256): $Y = XW + b$ is 32 × 256 (bias broadcast over rows). Parameters: $512 \\times 256 + 256 = 131{,}328$. Multiply cost ≈ $2 \\times 32 \\times 512 \\times 256 \\approx 8.4$ M flops.

| Matrix | Effect |
|---|---|
| Diagonal | scales each axis |
| Orthogonal ($Q^\\top Q = I$) | rotation/reflection, preserves lengths |
| Projection ($P^2 = P$) | flattens onto a subspace |
| Singular ($\\det = 0$) | loses a dimension, not invertible |
`,
  practice: `
**Shape discipline.** Write shapes next to every line; the inner dimensions must match. In numpy, \`@\` is matrix multiply, \`*\` is elementwise; broadcasting aligns trailing dimensions.

**Order of multiplication matters for cost.** $(AB)x$ costs a matrix–matrix product; $A(Bx)$ costs two matrix–vector products. Always multiply vectors in first.
`,
  traps: [
    { trap: "AB = BA, like numbers.", why: "Matrix multiplication isn't commutative; even when both products exist they usually differ (and shapes may not allow both)." },
    { trap: "A * B in numpy is matrix multiplication.", why: "\`*\` multiplies elementwise (with broadcasting). Use \`@\` or np.matmul." },
  ],
  say: {
    prompt: "Explain what a matrix multiplication does geometrically and how shapes work in a neural network layer.",
    secs: 45,
    check: ["Matrix = linear transformation; columns are images of basis vectors", "Product = composition, order matters", "Shape rule (m×n)(n×p) → (m×p)", "Layer: X (batch × in) @ W (in × out) + b", "Determinant as volume scaling; 0 → not invertible"],
    followups: [
      { q: "How many parameters in a dense layer from 512 to 256 units?", a: "512 × 256 weights + 256 biases = 131,328." },
      { q: "What does a determinant of zero tell you?", a: "The transformation collapses space onto a lower-dimensional subspace; the matrix has dependent columns and no inverse." },
      { q: "Why compute A(Bx) instead of (AB)x?", a: "Two matrix–vector products cost O(n²) each; forming AB costs O(n³)." },
    ],
    answer: `A matrix is a linear transformation: its columns are where the basis vectors go, and it can stretch, rotate, shear or project space. Multiplying two matrices composes the transformations, applying the right one first, so order matters. Shapes compose as m×n times n×p gives m×p. In a dense layer, a batch X of shape batch×in times weights in×out gives batch×out, with the bias broadcast across rows; each output entry is a dot product between an input row and a weight column.`,
    avoid: ["Confusing elementwise and matrix products", "Assuming commutativity"],
  },
  terms: [["Linear map", "f(ax + by) = af(x) + bf(y); represented by a matrix."], ["Determinant", "Volume scaling factor of a square matrix."], ["Orthogonal matrix", "QᵀQ = I; preserves lengths and angles."]],
  sources: [MS.mml, MS.dlb],
});
Q({ id: "m-mat-1", d: 1, secs: 30, prompt: "Shape of (32 × 512) @ (512 × 256)? Give the number of output columns.", answer: 256, tol: 0.5, explain: "(m×n)(n×p) → m×p = 32 × 256.", py: "import numpy as np\nanswer = (np.zeros((32,512))@np.zeros((512,256))).shape[1]", packages: NP });
Q({ id: "m-mat-2", d: 1, secs: 30, prompt: "Parameters in a dense layer mapping 512 inputs to 256 outputs, with bias?", answer: 131328, tol: 0.5, explain: "512 × 256 + 256.", py: "answer = 512*256+256" });
Q({ id: "m-mat-3", d: 2, secs: 45, prompt: "Determinant of [[2, 1], [1, 3]]?", answer: 5, tol: 0.01, explain: "2·3 − 1·1 = 5: areas scale by 5.", py: "import numpy as np\nanswer = float(np.linalg.det([[2,1],[1,3]]))", packages: NP });
Q({ id: "m-mat-4", d: 2, secs: 60, prompt: "A = [[1, 2], [0, 1]], B = [[0, 1], [1, 0]]. Entry (1, 1) (top-left) of AB minus the same entry of BA?", answer: 2, tol: 0.01, explain: "AB = [[2, 1], [1, 0]], BA = [[0, 1], [1, 2]]: 2 − 0 = 2. AB ≠ BA.", py: "import numpy as np\nA=np.array([[1,2],[0,1]]);B=np.array([[0,1],[1,0]])\nanswer = float((A@B)[0,0]-(B@A)[0,0])", packages: NP });
Q({ id: "m-mat-5", d: 2, secs: 45, prompt: "In numpy, for 2×2 arrays A and B, which computes the matrix product?", options: ["A * B", "A @ B", "A ** B", "A.dot * B"], answer: 1, explain: "@ (or np.matmul / A.dot(B)); * is elementwise.", py: "import numpy as np\nA=np.array([[1,2],[3,4]]);B=np.array([[5,6],[7,8]])\nanswer = 1 if np.array_equal(A@B, np.matmul(A,B)) and not np.array_equal(A*B, np.matmul(A,B)) else 0", packages: NP });
C("m-mat-c1", "Shape rule", "(m×n)(n×p) = (m×p); cost ≈ 2mnp flops.");
C("m-mat-c2", "(AB)ᵀ", "BᵀAᵀ: transpose reverses the order.");

L("m-rank", LA, "Linear independence, basis and rank", "When features are redundant, what rank measures, and why it breaks regression.", {
  kind: "concept", mins: 15, prereq: ["m-matrices"],
  hook: "You add 'total spend' to a model that already has spend by category. Why does least squares suddenly fail?",
  intuition: `
**The situation.** Total spend is the sum of the category columns. That column adds no new information: it's a linear combination of others.

**The idea.** Vectors are **linearly independent** if none can be built from the others. A **basis** is a minimal independent set that spans the space. The **rank** of a matrix is the number of independent columns (equal to the number of independent rows): the true dimensionality of what it can express.

A data matrix with fewer independent columns than columns is **rank-deficient**; then $X^\\top X$ isn't invertible and the regression coefficients aren't unique: infinitely many weightings give the same predictions.
`,
  maths: `
**In one breath.** rank$(A)$ = dim of column space = dim of row space $\\le \\min(m, n)$; rank–nullity: rank + nullity = number of columns; full column rank $\\iff A^\\top A$ invertible.

**Worked example.** Columns $c_1 = (1, 2, 3)$, $c_2 = (2, 4, 6)$, $c_3 = (1, 0, 1)$. $c_2 = 2c_1$, so rank 2, nullity 1 (the null space contains $(2, -1, 0)$).

**Null space.** Vectors $v$ with $Av = 0$. If $v \\ne 0$ exists, then $w$ and $w + tv$ give identical predictions $Xw$: coefficients are not identifiable.

**Near-dependence.** Exactly dependent columns are rare in real data; *nearly* dependent ones (multicollinearity) give a tiny smallest singular value and huge, unstable coefficients. Rank is computed numerically by counting singular values above a tolerance.

| Situation | Rank | Consequence |
|---|---|---|
| $n$ rows, $p$ independent features, $n \\ge p$ | $p$ | unique OLS |
| one-hot + intercept | $p - 1$ | dummy trap |
| $p > n$ | $\\le n$ | infinite solutions; regularise |
`,
  practice: `
**In practice.** Drop exact duplicates and sums of other columns, drop one dummy level, and use ridge when columns are nearly dependent. Low-rank structure is also an opportunity: PCA, matrix factorisation for recommenders and LoRA all exploit it.
`,
  traps: [
    { trap: "With p > n you can still get unique OLS coefficients if you have enough compute.", why: "Rank ≤ n < p, so there's a null space: infinitely many exact fits. You need regularisation or a minimum-norm choice." },
    { trap: "Full rank means no multicollinearity problems.", why: "A matrix can be technically full rank with a tiny smallest singular value; coefficients are then extremely unstable. Look at the condition number." },
  ],
  say: {
    prompt: "What is matrix rank and why does it matter for linear regression?",
    secs: 40,
    check: ["Rank = number of linearly independent columns (= rows)", "Rank-deficient → XᵀX singular → coefficients not unique", "Null space: directions that don't change predictions", "Examples: dummy trap, total = sum of parts, p > n", "Near-dependence → large condition number; fix with ridge / dropping features"],
    followups: [
      { q: "What is rank–nullity?", a: "For an m×n matrix, rank + dimension of the null space = n." },
      { q: "How do you compute rank numerically?", a: "Count singular values above a tolerance relative to the largest (numpy.linalg.matrix_rank does this)." },
      { q: "How does LoRA use rank?", a: "It learns a weight update ΔW = BA with B (d×r), A (r×k) and small r: a low-rank correction with far fewer parameters." },
    ],
    answer: `Rank is the number of linearly independent columns of a matrix, which equals the number of independent rows: the real dimensionality it spans. For regression, if the design matrix isn't full column rank, say because one feature is the sum of others or all dummy levels sit next to an intercept, XᵀX is singular and there's a null space of weight changes that don't affect predictions, so the coefficients aren't unique. In practice exact dependence is rare but near-dependence is common, giving unstable coefficients, which I'd handle by removing redundant features or using ridge.`,
    avoid: ["Equating full rank with 'no multicollinearity issues'"],
  },
  terms: [["Linear independence", "No vector is a combination of the others."], ["Rank", "Dimension of the column space."], ["Null space", "{v : Av = 0}."]],
  sources: [MS.mml, MS.dlb],
});
Q({ id: "m-rk-1", d: 1, secs: 45, prompt: "Rank of the matrix with columns (1, 2, 3), (2, 4, 6), (1, 0, 1)?", answer: 2, tol: 0.5, explain: "The second column is twice the first.", py: "import numpy as np\nanswer = int(np.linalg.matrix_rank(np.array([[1,2,1],[2,4,0],[3,6,1]])))", packages: NP });
Q({ id: "m-rk-2", d: 2, secs: 45, prompt: "A 100 × 8 design matrix has rank 6. Dimension of its null space?", answer: 2, tol: 0.5, explain: "Rank–nullity: 8 − 6 = 2.", py: "answer = 8-6" });
Q({ id: "m-rk-3", d: 2, secs: 60, prompt: "Maximum possible rank of the product of a 50 × 3 matrix and a 3 × 40 matrix?", answer: 3, tol: 0.5, explain: "rank(AB) ≤ min(rank A, rank B) ≤ 3.", py: "import numpy as np\nrng=np.random.default_rng(0)\nanswer = int(np.linalg.matrix_rank(rng.normal(size=(50,3))@rng.normal(size=(3,40))))", packages: NP });
Q({ id: "m-rk-4", d: 2, secs: 45, prompt: "Intercept plus one-hot columns for all 4 levels of a category (no other features). Rank of the 5-column design (enough rows)?", answer: 4, tol: 0.5, explain: "The 4 dummies sum to the intercept column.", py: "import numpy as np\nlv=np.arange(40)%4\nX=np.c_[np.ones(40), np.eye(4)[lv]]\nanswer = int(np.linalg.matrix_rank(X))", packages: NP });
Q({ id: "m-rk-5", d: 2, secs: 45, prompt: "LoRA replaces a 4096 × 4096 update with B (4096 × r) A (r × 4096), r = 8. How many trainable parameters?", answer: 65536, tol: 0.5, explain: "2 × 4096 × 8 = 65,536, vs 16.8 M for the full matrix.", py: "answer = 2*4096*8" });
C("m-rk-c1", "Rank–nullity", "rank + nullity = number of columns.");
C("m-rk-c2", "rank(AB)", "≤ min(rank A, rank B).");

L("m-projections", LA, "Orthogonality, projections and least squares", "Least squares as projecting y onto the column space, and orthonormal bases.", {
  kind: "concept", mins: 20, prereq: ["m-rank"],
  hook: "Why are least-squares residuals always uncorrelated with every feature in the model?",
  intuition: `
**The situation.** You can't usually solve $Xw = y$ exactly: $y$ has more rows than the model has freedom. So find the closest achievable point.

**The idea.** All achievable predictions $Xw$ form a flat subspace (the column space). The closest point to $y$ in that subspace is the **orthogonal projection**: drop a perpendicular from $y$. The residual $y - \\hat y$ is perpendicular to the whole subspace, so its dot product with every column of $X$ is zero. That's the normal equations, and it's why residuals are uncorrelated with the features (when there's an intercept).
`,
  maths: `
**In one breath.** $\\hat y = Py$ with $P = X(X^\\top X)^{-1}X^\\top$; $P^2 = P$, $P^\\top = P$; $X^\\top(y - \\hat y) = 0$; for orthonormal $Q$, $P = QQ^\\top$.

**Worked example (one direction).** Project $y = (2, 3)$ onto the line through $u = (1, 1)$: $\\hat y = \\frac{y \\cdot u}{u \\cdot u}u = \\frac{5}{2}(1, 1) = (2.5, 2.5)$; residual $(-0.5, 0.5)$ is orthogonal to $u$.

**Hat matrix.** $P$ is called the hat matrix (it puts the hat on $y$). Its diagonal entries $h_{ii}$ are **leverages**; trace$(P)$ = number of parameters $p$.

**Gram–Schmidt / QR.** Turning columns into an orthonormal basis $Q$ makes projections trivial ($QQ^\\top y$) and least squares stable: $X = QR \\Rightarrow w = R^{-1}Q^\\top y$, avoiding the squared condition number of $X^\\top X$.

| Property | Meaning |
|---|---|
| $P^2 = P$ | projecting twice changes nothing |
| $P = P^\\top$ | orthogonal (not oblique) projection |
| $I - P$ | projects onto the residual space |
| tr$(P) = p$ | degrees of freedom used by the fit |
`,
  practice: `
**Uses.** Least squares, PCA (project onto top components), removing a confounder's linear effect (residualising), Gram–Schmidt in QR solvers. **Leverage** identifies points with unusual feature values that can pull the fit.
`,
  traps: [
    { trap: "Residuals are uncorrelated with the features because the model is correct.", why: "It's a mechanical property of least squares (orthogonality), true even for a badly misspecified model. It says nothing about correctness." },
    { trap: "Solve least squares by inverting XᵀX.", why: "Forming XᵀX squares the condition number; QR or SVD solvers are more accurate. Fine for small, well-conditioned problems." },
  ],
  say: {
    prompt: "Explain least squares geometrically.",
    secs: 45,
    check: ["Predictions Xw live in the column space of X", "Best fit = orthogonal projection of y onto that space", "Residual ⟂ every column: Xᵀ(y − Xw) = 0 (normal equations)", "Hat matrix P = X(XᵀX)⁻¹Xᵀ, idempotent, trace p", "Numerical solution via QR/SVD"],
    followups: [
      { q: "What is leverage?", a: "The diagonal h_ii of the hat matrix: how much a point's own y influences its fitted value; high for unusual x values." },
      { q: "Why is the trace of the hat matrix p?", a: "tr(X(XᵀX)⁻¹Xᵀ) = tr((XᵀX)⁻¹XᵀX) = tr(I_p) = p." },
      { q: "Why are residuals orthogonal to the intercept column?", a: "Because the normal equations include the intercept column, residuals sum to zero." },
    ],
    answer: `All possible predictions Xw form the column space of X. Least squares picks the point in that space closest to y, which is the orthogonal projection, so the residual is perpendicular to every column of X. Writing that orthogonality gives the normal equations XᵀXw = Xᵀy, and the projection matrix X(XᵀX)⁻¹Xᵀ is the hat matrix. Numerically I'd solve it with a QR or SVD decomposition rather than inverting XᵀX.`,
    avoid: ["Reading orthogonal residuals as evidence the model is right"],
  },
  terms: [["Orthogonal projection", "Closest point in a subspace; residual perpendicular to it."], ["Hat matrix", "X(XᵀX)⁻¹Xᵀ."], ["Leverage", "Diagonal of the hat matrix."]],
  sources: [MS.mml, MS.islr],
});
Q({ id: "m-prj-1", d: 1, secs: 45, prompt: "Project y = (2, 3) onto the line through (1, 1). First coordinate of the projection?", answer: 2.5, tol: 0.01, explain: "(5/2)(1, 1) = (2.5, 2.5).", py: "import numpy as np\ny=np.array([2,3.]);u=np.array([1,1.])\nanswer = float((y@u/(u@u)*u)[0])", packages: NP });
Q({ id: "m-prj-2", d: 2, secs: 45, prompt: "A regression with intercept and 4 features on 200 rows. Trace of the hat matrix?", answer: 5, tol: 0.01, explain: "trace = number of columns = 5.", py: "import numpy as np\nrng=np.random.default_rng(0)\nX=np.c_[np.ones(200), rng.normal(size=(200,4))]\nP=X@np.linalg.solve(X.T@X, X.T)\nanswer = float(np.trace(P))", packages: NP });
Q({ id: "m-prj-3", d: 2, secs: 60, prompt: "After an OLS fit with intercept, what is the sum of the residuals?", answer: 0, tol: 0.001, explain: "Residuals are orthogonal to the column of ones.", py: "import numpy as np\nrng=np.random.default_rng(1)\nX=np.c_[np.ones(50), rng.normal(size=(50,2))]; y=rng.normal(size=50)\nw=np.linalg.lstsq(X,y,rcond=None)[0]\nanswer = float(np.sum(y-X@w))", packages: NP });
Q({ id: "m-prj-4", d: 2, secs: 45, prompt: "P is a projection matrix. P² equals…", options: ["I", "P", "0", "Pᵀ P⁻¹"], answer: 1, explain: "Idempotent: projecting twice is the same as once.", py: "import numpy as np\nX=np.array([[1,0],[1,1],[1,2.]])\nP=X@np.linalg.inv(X.T@X)@X.T\nanswer = 1 if np.allclose(P@P,P) else 0", packages: NP });
C("m-prj-c1", "Normal equations, geometrically", "Residual ⟂ column space: Xᵀ(y − Xw) = 0.");
C("m-prj-c2", "Hat matrix facts", "P² = P, Pᵀ = P, tr P = p, leverage = h_ii.");

L("m-eigen", LA, "Eigenvalues and eigenvectors", "Directions a matrix only stretches, and why they power PCA, Markov chains and stability analysis.", {
  kind: "concept", mins: 25, prereq: ["m-matrices"],
  hook: "Apply the same transformation to a vector a hundred times. Where does it end up pointing?",
  intuition: `
**The situation.** Most vectors change direction when a matrix acts on them. A few special ones don't: they only get stretched or flipped.

**The idea.** An **eigenvector** $v$ of $A$ satisfies $Av = \\lambda v$: the matrix just scales it by the **eigenvalue** $\\lambda$. If you apply $A$ repeatedly, the component along the eigenvector with the largest $|\\lambda|$ grows fastest and dominates: that's power iteration, PageRank, and the long-run state of a Markov chain.

For a covariance matrix, eigenvectors are the directions of the data's spread and eigenvalues are the variances along them: PCA.
`,
  maths: `
**In one breath.** $Av = \\lambda v$; eigenvalues solve $\\det(A - \\lambda I) = 0$; $\\sum\\lambda_i = \\text{tr}A$, $\\prod\\lambda_i = \\det A$; symmetric $A = Q\\Lambda Q^\\top$ with real $\\lambda$ and orthonormal $Q$.

**Worked example.** $A = \\begin{pmatrix}2 & 1\\\\ 1 & 2\\end{pmatrix}$. $\\det(A - \\lambda I) = (2 - \\lambda)^2 - 1 = 0 \\Rightarrow \\lambda = 3, 1$. Eigenvectors $(1, 1)/\\sqrt2$ and $(1, -1)/\\sqrt2$. Check: trace 4 = 3 + 1, det 3 = 3 × 1.

**Powers.** $A^k = Q\\Lambda^kQ^\\top$: eigen-decomposition turns repeated multiplication into raising numbers to powers. Growth or decay is governed by the largest $|\\lambda|$ (spectral radius): $>1$ explodes, $<1$ vanishes. That's the exploding/vanishing gradient story in RNNs.

**Power iteration.** $v_{k+1} = Av_k/\\|Av_k\\|$ converges to the top eigenvector at rate $|\\lambda_2/\\lambda_1|$.

| Where | Matrix | Eigen-meaning |
|---|---|---|
| PCA | covariance | variance directions |
| Markov chain | transition matrix | stationary distribution (λ = 1) |
| PageRank | link matrix | importance scores |
| Optimisation | Hessian | curvature; all λ > 0 ⇒ local minimum |
| RNNs | recurrent weights | λ > 1 explode, < 1 vanish |
`,
  practice: `
**Numerics.** Use \`np.linalg.eigh\` for symmetric matrices (stable, real, sorted ascending); \`eig\` for general ones (complex values possible). For PCA prefer SVD of the data matrix over eigen-decomposing the covariance.
`,
  traps: [
    { trap: "Every matrix has a full set of real eigenvectors.", why: "Rotations have complex eigenvalues, and defective matrices lack a full eigenbasis. Symmetric matrices are the nice case: real eigenvalues, orthogonal eigenvectors." },
    { trap: "Eigenvectors are unique.", why: "Any non-zero scalar multiple is also an eigenvector, and repeated eigenvalues give whole eigenspaces. Libraries return one normalised choice, sign arbitrary." },
  ],
  say: {
    prompt: "What are eigenvalues and eigenvectors, and where do they show up in ML?",
    secs: 45,
    check: ["Av = λv: direction unchanged, scaled by λ", "Characteristic equation det(A − λI) = 0; trace and determinant identities", "Symmetric matrices: real eigenvalues, orthogonal eigenvectors (spectral theorem)", "Repeated application dominated by the largest |λ|", "Applications: PCA, Markov chains/PageRank, Hessian curvature, RNN stability"],
    followups: [
      { q: "How does PCA use eigenvectors?", a: "The eigenvectors of the covariance matrix are the principal directions; eigenvalues are the variances along them; keep the top k." },
      { q: "What does the Hessian's eigen-spectrum tell you at a critical point?", a: "All positive: local minimum; all negative: maximum; mixed signs: saddle point. The ratio of largest to smallest positive eigenvalue is the condition number that slows gradient descent." },
      { q: "Why do gradients explode in vanilla RNNs?", a: "Backprop multiplies by the recurrent weight matrix repeatedly; components along eigen-directions with |λ| > 1 grow exponentially, those with |λ| < 1 shrink to zero." },
    ],
    answer: `An eigenvector of a matrix is a direction the matrix only stretches, Av = λv, with the eigenvalue λ as the stretch factor. They come from det(A − λI) = 0, and their sum and product equal the trace and determinant. Symmetric matrices, like covariances and Hessians, have real eigenvalues and orthogonal eigenvectors, so A = QΛQᵀ.

In ML: PCA keeps the top eigenvectors of the covariance; a Markov chain's stationary distribution is the eigenvector with eigenvalue 1; the Hessian's eigenvalues describe curvature and tell minima from saddles; and repeated multiplication is dominated by the largest |λ|, which explains exploding and vanishing gradients.`,
    avoid: ["Claiming all real matrices have real eigenvalues"],
  },
  terms: [["Eigenpair", "(λ, v) with Av = λv."], ["Spectral theorem", "Symmetric A = QΛQᵀ, Q orthogonal."], ["Spectral radius", "max |λᵢ|."]],
  sources: [MS.mml, MS.dlb],
});
Q({ id: "m-eig-1", d: 1, secs: 45, prompt: "Largest eigenvalue of [[2, 1], [1, 2]]?", answer: 3, tol: 0.01, explain: "(2 − λ)² = 1 → λ = 3, 1.", py: "import numpy as np\nanswer = float(max(np.linalg.eigvalsh([[2,1],[1,2]])))", packages: NP });
Q({ id: "m-eig-2", d: 2, secs: 45, prompt: "A 3×3 matrix has trace 10 and two eigenvalues 2 and 3. The third eigenvalue?", answer: 5, tol: 0.01, explain: "Eigenvalues sum to the trace: 10 − 2 − 3 = 5.", py: "answer = 10-2-3" });
Q({ id: "m-eig-3", d: 2, secs: 60, prompt: "Eigenvalues of A are 0.9 and 0.5. Largest eigenvalue of A¹⁰? (3 decimals)", answer: 0.349, tol: 0.002, explain: "0.9¹⁰ = 0.349: powers act on eigenvalues.", py: "import numpy as np\nA=np.diag([0.9,0.5])\nanswer = float(max(np.linalg.eigvals(np.linalg.matrix_power(A,10)).real))", packages: NP });
Q({ id: "m-eig-4", d: 2, secs: 45, prompt: "Hessian eigenvalues at a critical point are 4 and −1. The point is a…", options: ["local minimum", "local maximum", "saddle point", "cannot tell"], answer: 2, explain: "Mixed signs: curves up in one direction, down in another.", py: "ev=[4,-1]\nanswer = 0 if min(ev)>0 else (1 if max(ev)<0 else 2)" });
Q({ id: "m-eig-5", d: 3, secs: 90, prompt: "Power iteration on A = [[2, 1], [1, 2]] starting from (1, 0). After 3 iterations (normalising each time), the first component of the unit vector? (3 decimals)", answer: 0.733, tol: 0.002, explain: "Unnormalised iterates: (2, 1) → (5, 4) → (14, 13). Normalised: 14/√365 = 0.733, approaching (1, 1)/√2 ≈ 0.707 as iterations continue.", py: "import numpy as np\nA=np.array([[2,1],[1,2.]]);v=np.array([1,0.])\nfor _ in range(3):\n    v=A@v; v=v/np.linalg.norm(v)\nanswer = float(v[0])", packages: NP });
C("m-eig-c1", "Trace and determinant", "Σλ = tr A; Πλ = det A.");
C("m-eig-c2", "Hessian test", "All λ > 0 min; all < 0 max; mixed saddle.");

L("m-psd", LA, "Symmetric and positive definite matrices", "Covariances, Hessians and kernels: why positive (semi)definiteness keeps showing up.", {
  kind: "concept", mins: 15, prereq: ["m-eigen"],
  hook: "Your custom 'covariance' matrix makes the Gaussian density formula return nonsense. What property is it missing?",
  intuition: `
**The situation.** Covariance matrices, Gram/kernel matrices and the Hessians of convex losses all share a property: they never assign negative "energy" to any direction.

**The idea.** A symmetric matrix $A$ is **positive semidefinite (PSD)** if $x^\\top Ax \\ge 0$ for every $x$, and **positive definite (PD)** if $> 0$ for every non-zero $x$. Equivalently, all eigenvalues are $\\ge 0$ (PSD) or $> 0$ (PD).

- A covariance matrix is PSD because $x^\\top\\Sigma x$ is the variance of $x^\\top X$, and variances can't be negative.
- A PD Hessian means the function curves upward in every direction: a bowl.
- A valid kernel must produce PSD Gram matrices.
`,
  maths: `
**In one breath.** PD $\\iff$ all $\\lambda_i > 0$ $\\iff$ Cholesky $A = LL^\\top$ exists $\\iff$ all leading principal minors $> 0$; $X^\\top X$ is always PSD, PD iff $X$ has full column rank.

**Worked example.** $\\begin{pmatrix}2 & 1\\\\ 1 & 2\\end{pmatrix}$: eigenvalues 3, 1 → PD. $\\begin{pmatrix}1 & 2\\\\ 2 & 1\\end{pmatrix}$: eigenvalues 3, −1 → indefinite; with $x = (1, -1)$, $x^\\top Ax = -2$.

**Why $X^\\top X$ is PSD.** $x^\\top X^\\top Xx = \\|Xx\\|^2 \\ge 0$. Adding $\\lambda I$ (ridge) makes every eigenvalue at least $\\lambda > 0$: always invertible.

**Valid correlation matrix check.** A "correlation matrix" with off-diagonals 0.9, 0.9 and −0.9 among three variables has a negative eigenvalue: no data could produce it.

| Property | Test |
|---|---|
| PSD | all eigenvalues ≥ 0 |
| PD | all eigenvalues > 0, or Cholesky succeeds |
| Indefinite | eigenvalues of both signs |
`,
  practice: `
**In code.** Test PD by attempting \`np.linalg.cholesky\`; it raises if not. Fix nearly-PSD estimated covariances by adding a small jitter to the diagonal or clipping negative eigenvalues. Gaussian processes, Kalman filters and Mahalanobis distances all need PD covariances.
`,
  traps: [
    { trap: "A symmetric matrix with all positive entries is positive definite.", why: "[[1, 2], [2, 1]] has positive entries and a negative eigenvalue. Definiteness is about eigenvalues, not entries." },
    { trap: "Any matrix of pairwise correlations is a valid correlation matrix.", why: "Pairwise values must be jointly consistent: the matrix must be PSD. Estimating correlations pairwise with missing data can break this." },
  ],
  say: {
    prompt: "What does it mean for a matrix to be positive definite and why do covariance matrices have this property?",
    secs: 40,
    check: ["xᵀAx > 0 for all non-zero x (≥ 0 for semidefinite)", "Equivalent: all eigenvalues positive; Cholesky exists", "Covariance: xᵀΣx = Var(xᵀX) ≥ 0", "XᵀX is PSD; + λI makes it PD (ridge)", "Uses: Gaussian density, convexity (Hessian), kernels"],
    followups: [
      { q: "How do you check positive definiteness in practice?", a: "Try a Cholesky factorisation; if it succeeds the matrix is PD. Or check the smallest eigenvalue." },
      { q: "Why does ridge regression always have a solution?", a: "XᵀX + λI has eigenvalues ≥ λ > 0, so it's PD and invertible." },
      { q: "What does a PD Hessian imply?", a: "The function is locally strictly convex: the critical point is a strict local minimum." },
    ],
    answer: `A symmetric matrix is positive definite if xᵀAx is positive for every non-zero x, equivalently all its eigenvalues are positive, equivalently it has a Cholesky factorisation. Semidefinite allows zero. A covariance matrix is PSD because xᵀΣx is the variance of the linear combination xᵀX, which can't be negative; it's PD unless some combination of variables is constant. XᵀX is always PSD, and adding λI in ridge makes it PD. The property matters for Gaussian densities, convexity of losses via the Hessian, and valid kernels.`,
    avoid: ["Judging definiteness from the signs of entries"],
  },
  terms: [["PSD", "xᵀAx ≥ 0 for all x."], ["PD", "xᵀAx > 0 for all x ≠ 0."], ["Cholesky", "A = LLᵀ with L lower-triangular; exists iff A is PD."]],
  sources: [MS.mml, MS.boyd],
});
Q({ id: "m-psd-1", d: 1, secs: 30, prompt: "Smallest eigenvalue of [[1, 2], [2, 1]]?", answer: -1, tol: 0.01, explain: "Eigenvalues 3 and −1: indefinite.", py: "import numpy as np\nanswer = float(min(np.linalg.eigvalsh([[1,2],[2,1]])))", packages: NP });
Q({ id: "m-psd-2", d: 2, secs: 45, prompt: "For A = [[1, 2], [2, 1]] and x = (1, −1), compute xᵀAx.", answer: -2, tol: 0.01, explain: "1 − 2 − 2 + 1 = −2.", py: "import numpy as np\nA=np.array([[1,2],[2,1]]);x=np.array([1,-1])\nanswer = float(x@A@x)", packages: NP });
Q({ id: "m-psd-3", d: 3, secs: 90, prompt: "Is [[1, 0.9, 0.9], [0.9, 1, −0.9], [0.9, −0.9, 1]] a valid correlation matrix?", options: ["Yes", "No"], answer: 1, explain: "Its smallest eigenvalue is negative (−0.8), so it isn't PSD.", py: "import numpy as np\nR=np.array([[1,.9,.9],[.9,1,-.9],[.9,-.9,1]])\nanswer = 0 if min(np.linalg.eigvalsh(R))>=-1e-12 else 1", packages: NP });
Q({ id: "m-psd-4", d: 2, secs: 45, prompt: "XᵀX has eigenvalues 9, 2 and 0. With ridge λ = 0.5, the smallest eigenvalue of XᵀX + λI?", answer: 0.5, tol: 0.01, explain: "Adding λI shifts every eigenvalue by λ.", py: "import numpy as np\nanswer = float(min(np.linalg.eigvalsh(np.diag([9,2,0.])+0.5*np.eye(3))))", packages: NP });
Q({ id: "m-psd-5", d: 2, secs: 45, prompt: "Cholesky factor L of [[4, 2], [2, 2]]: what is L[1][1] (bottom-right)?", answer: 1, tol: 0.01, explain: "L₀₀ = 2, L₁₀ = 1, L₁₁ = √(2 − 1) = 1.", py: "import numpy as np\nanswer = float(np.linalg.cholesky([[4,2],[2,2.]])[1,1])", packages: NP });
C("m-psd-c1", "Why covariances are PSD", "xᵀΣx = Var(xᵀX) ≥ 0.");
C("m-psd-c2", "PD test in code", "np.linalg.cholesky succeeds ⟺ positive definite.");

L("m-svd", LA, "Singular value decomposition and low-rank approximation", "Every matrix as rotate–scale–rotate, the best rank-k approximation, and its uses from PCA to LoRA.", {
  kind: "concept", mins: 25, prereq: ["m-eigen", "m-projections"],
  hook: "A 10,000 × 5,000 ratings matrix is mostly empty. How can 50 numbers per user and per item reconstruct it?",
  intuition: `
**The situation.** Eigen-decomposition needs a square (and ideally symmetric) matrix. Data matrices are rectangular.

**The idea.** **SVD** says every matrix is: rotate, scale along axes, rotate. $A = U\\Sigma V^\\top$ with orthonormal $U$, $V$ and non-negative singular values $\\sigma_1 \\ge \\sigma_2 \\ge \\dots$ on the diagonal of $\\Sigma$. The singular values say how much each direction matters.

Keep only the top $k$ singular values and you get the **best possible rank-$k$ approximation** of $A$. If the singular values drop off fast, a little structure explains most of the matrix: users and items described by a few latent factors, images compressed, noise removed.
`,
  maths: `
**In one breath.** $A = U\\Sigma V^\\top = \\sum_i \\sigma_i u_iv_i^\\top$; $A_k = \\sum_{i \\le k}\\sigma_iu_iv_i^\\top$ minimises $\\|A - B\\|_F$ over rank-$k$ $B$ with error $\\sqrt{\\sum_{i > k}\\sigma_i^2}$ (Eckart–Young); $\\sigma_i^2$ are eigenvalues of $A^\\top A$.

**Link to PCA.** For centred data $X = U\\Sigma V^\\top$: principal directions are columns of $V$, scores are $U\\Sigma$, variance along component $i$ is $\\sigma_i^2/n$.

**Worked example.** Singular values (10, 5, 1): rank-1 approximation keeps $100/(100 + 25 + 1) = 79.4\\%$ of $\\|A\\|_F^2$; its Frobenius error is $\\sqrt{26} = 5.10$.

**Storage.** Rank-$k$ of an $m \\times n$ matrix needs $k(m + n + 1)$ numbers instead of $mn$. 10,000 × 5,000 at $k = 50$: 750,050 vs 50 million.

**Condition number** $\\kappa = \\sigma_{\\max}/\\sigma_{\\min}$: how much relative errors in $b$ can be amplified when solving $Ax = b$.

| Use | What SVD gives |
|---|---|
| PCA | directions and variances |
| Recommenders | latent factors (matrix factorisation) |
| Pseudoinverse | $A^+ = V\\Sigma^+U^\\top$, minimum-norm least squares |
| Compression / denoising | truncate small σ |
| LoRA | low-rank weight updates |
`,
  practice: `
**Code.** \`np.linalg.svd(X, full_matrices=False)\`; truncated/randomised SVD (scikit-learn \`TruncatedSVD\`) for large sparse matrices (LSA on TF-IDF). For missing-value matrices (ratings), use factorisation methods (ALS, SGD) that fit only observed entries rather than plain SVD.
`,
  traps: [
    { trap: "SVD and eigen-decomposition are the same thing.", why: "They coincide only for symmetric PSD matrices. SVD exists for every matrix, including rectangular ones, and singular values are always non-negative." },
    { trap: "Run plain SVD on a ratings matrix with missing entries filled as zero.", why: "Zeros would be treated as real 'hated it' ratings. Use factorisation that fits observed entries only, with regularisation." },
  ],
  say: {
    prompt: "Explain SVD and why it gives the best low-rank approximation.",
    secs: 50,
    check: ["A = UΣVᵀ for any matrix; U, V orthonormal, σ ≥ 0 sorted", "Sum of rank-1 pieces σᵢuᵢvᵢᵀ", "Truncation to top k is optimal (Eckart–Young), error = √Σ_{i>k} σᵢ²", "Link to PCA and to eigenvalues of AᵀA", "Applications: recommenders, compression, pseudoinverse, conditioning"],
    followups: [
      { q: "How do singular values relate to eigenvalues?", a: "σᵢ² are the eigenvalues of AᵀA (and AAᵀ); V and U are their eigenvectors." },
      { q: "What is the condition number and why does it matter?", a: "σ_max/σ_min; it bounds how much relative error in the data can be amplified in the solution. Large κ means unstable least squares." },
      { q: "How is SVD used to compute PCA?", a: "Centre the data, take the SVD; V's columns are principal directions, UΣ are the scores and σ²/n the explained variances." },
    ],
    answer: `SVD factors any matrix into UΣVᵀ: an orthonormal rotation, a scaling by non-negative singular values in decreasing order, and another rotation. Equivalently it's a sum of rank-one pieces σᵢuᵢvᵢᵀ ordered by importance. Keeping the top k gives the best rank-k approximation in Frobenius or spectral norm, with error equal to the root of the sum of the dropped σ² — that's Eckart–Young. It underlies PCA, where V gives the directions and σ²/n the variances, matrix-factorisation recommenders, the pseudoinverse, compression, and the condition number σ_max/σ_min.`,
    avoid: ["Treating missing ratings as zeros"],
  },
  terms: [["Singular values", "Non-negative diagonal of Σ, sorted."], ["Eckart–Young", "Truncated SVD is the best rank-k approximation."], ["Condition number", "σ_max/σ_min."]],
  sources: [MS.mml, MS.dlb],
});
Q({ id: "m-svd-1", d: 2, secs: 45, prompt: "Singular values are 10, 5 and 1. Share of ‖A‖_F² kept by the rank-1 approximation? (3 decimals)", answer: 0.794, tol: 0.002, explain: "100/126.", py: "s=[10,5,1]\nanswer = s[0]**2/sum(x*x for x in s)" });
Q({ id: "m-svd-2", d: 2, secs: 45, prompt: "Same singular values (10, 5, 1). Frobenius error of the best rank-1 approximation? (3 decimals)", answer: 5.099, tol: 0.002, explain: "√(25 + 1).", py: "answer = (25+1)**0.5" });
Q({ id: "m-svd-3", d: 1, secs: 30, prompt: "Numbers needed to store a rank-50 approximation of a 10,000 × 5,000 matrix as U_k, σ_k, V_k?", answer: 750050, tol: 0.5, explain: "k(m + n + 1) = 50 × 15,001.", py: "answer = 50*(10000+5000+1)" });
Q({ id: "m-svd-4", d: 2, secs: 45, prompt: "Largest singular value of [[3, 0], [4, 5]]? (3 decimals)", answer: 6.708, tol: 0.002, explain: "√(largest eigenvalue of AᵀA) = √45 = 6.708.", py: "import numpy as np\nanswer = float(np.linalg.svd([[3,0],[4,5.]])[1][0])", packages: NP });
Q({ id: "m-svd-5", d: 2, secs: 45, prompt: "Condition number of diag(100, 0.01)?", answer: 10000, tol: 0.5, explain: "σ_max/σ_min = 100/0.01.", py: "import numpy as np\nanswer = float(np.linalg.cond(np.diag([100,0.01])))", packages: NP });
C("m-svd-c1", "Eckart–Young", "Best rank-k approximation = top-k SVD; error √(Σ_{i>k} σᵢ²).");
C("m-svd-c2", "SVD ↔ PCA", "Centred X = UΣVᵀ: directions V, scores UΣ, variances σ²/n.");

L("m-solve", LA, "Solving Ax = b: inverses, LU, QR, Cholesky and the pseudoinverse", "How linear systems are actually solved, conditioning, and least squares without inverting.", {
  kind: "concept", mins: 20, prereq: ["m-svd", "m-psd"],
  hook: "Why do numerical libraries almost never compute a matrix inverse, even when your formula has one?",
  intuition: `
**The situation.** Formulas say $w = (X^\\top X)^{-1}X^\\top y$. Code that literally inverts is slower and less accurate than it needs to be.

**The idea.** Factor the matrix into easy pieces, then solve by substitution:

- **LU** (general square): $A = LU$, solve two triangular systems.
- **Cholesky** (symmetric PD): $A = LL^\\top$, about twice as fast as LU, very stable. Used for normal equations and Gaussian processes.
- **QR** (rectangular, least squares): $X = QR$; solve $Rw = Q^\\top y$. Avoids squaring the condition number.
- **SVD / pseudoinverse** (rank-deficient or ill-conditioned): minimum-norm least-squares solution; small singular values can be cut off.

Triangular systems are solved in $O(n^2)$ by back-substitution; the factorisation is the $O(n^3)$ part, done once and reusable for many right-hand sides.
`,
  maths: `
**In one breath.** Solve, don't invert; cost $O(n^3)$ to factor, $O(n^2)$ per solve; $\\kappa(X^\\top X) = \\kappa(X)^2$; pseudoinverse $A^+ = V\\Sigma^+U^\\top$ gives the minimum-norm solution.

**Worked example (back-substitution).** $\\begin{pmatrix}2 & 1\\\\ 0 & 3\\end{pmatrix}w = \\begin{pmatrix}5\\\\ 6\\end{pmatrix}$: $w_2 = 2$, then $2w_1 + 2 = 5 \\Rightarrow w_1 = 1.5$.

**Conditioning.** Relative error in $w$ can be up to $\\kappa$ × relative error in $b$. With $\\kappa(X) = 10^4$, normal equations face $\\kappa = 10^8$; in float32 (≈7 digits) that loses everything; QR on $X$ keeps it at $10^4$.

**Pseudoinverse.** For $X$ of shape $n \\times p$ with rank $r$: $w = X^+y$ is the least-squares solution with the smallest $\\|w\\|$. When $p > n$ it interpolates the data with minimum norm, the solution gradient descent from zero converges to.

| Method | Needs | Typical use |
|---|---|---|
| LU | square, non-singular | general systems |
| Cholesky | symmetric PD | normal equations, GPs, ridge |
| QR | full column rank | stable least squares |
| SVD / pinv | anything | rank-deficient, ill-conditioned, p > n |
| Iterative (CG, SGD) | large/sparse | huge problems |
`,
  practice: `
**Code.** \`np.linalg.solve(A, b)\` (LU), \`scipy.linalg.cho_solve\`, \`np.linalg.lstsq\` (SVD-based), \`np.linalg.pinv\`. In scikit-learn, LinearRegression uses lstsq; Ridge offers cholesky, svd, sparse_cg, sag solvers.
`,
  traps: [
    { trap: "Compute np.linalg.inv(A) @ b — it's the same answer.", why: "Mathematically yes; numerically it's slower and less accurate. Use solve()." },
    { trap: "Normal equations are always fine.", why: "They square the condition number. For ill-conditioned X, use QR or SVD." },
  ],
  say: {
    prompt: "How would you solve a least-squares problem numerically, and why not just invert XᵀX?",
    secs: 45,
    check: ["Factorise instead of invert; triangular solves", "Normal equations square the condition number", "QR for stable least squares; Cholesky when XᵀX is well conditioned / ridge", "SVD / pseudoinverse for rank-deficient: minimum-norm solution", "Iterative methods for very large problems"],
    followups: [
      { q: "What does the pseudoinverse give when p > n?", a: "Among the infinitely many exact fits, the one with smallest ‖w‖₂ — also what gradient descent from zero converges to." },
      { q: "Why is Cholesky faster than LU?", a: "It exploits symmetry, computing one triangular factor: about n³/3 flops vs 2n³/3." },
      { q: "When is an iterative solver better?", a: "When the matrix is huge or sparse and only matrix–vector products are cheap, e.g. conjugate gradient or SGD." },
    ],
    answer: `I'd never form an explicit inverse. For least squares I'd use a QR or SVD-based solver like lstsq: QR solves Rw = Qᵀy and keeps the condition number of X, whereas the normal equations square it, which can wipe out precision for ill-conditioned data. If XᵀX is well conditioned, or I'm doing ridge, a Cholesky solve of the normal equations is fast and fine. For rank-deficient or p > n problems the pseudoinverse via SVD gives the minimum-norm solution, and for very large sparse problems I'd go iterative, like conjugate gradient or SGD.`,
    avoid: ["“Just use inv()”"],
  },
  terms: [["LU / Cholesky / QR", "Triangular and orthogonal factorisations used to solve systems."], ["Pseudoinverse", "A⁺ = VΣ⁺Uᵀ."], ["Back-substitution", "Solving a triangular system from the last row up."]],
  sources: [MS.mml, MS.dlb],
});
Q({ id: "m-slv-1", d: 1, secs: 45, prompt: "Solve [[2, 1], [0, 3]] w = (5, 6). What is w₁?", answer: 1.5, tol: 0.01, explain: "w₂ = 2; 2w₁ + 2 = 5.", py: "import numpy as np\nanswer = float(np.linalg.solve([[2,1],[0,3.]],[5,6.])[0])", packages: NP });
Q({ id: "m-slv-2", d: 2, secs: 45, prompt: "κ(X) = 1,000. Condition number of XᵀX?", answer: 1000000, tol: 1, explain: "κ(XᵀX) = κ(X)².", py: "import numpy as np\nX=np.diag([1000,1.])\nanswer = float(np.linalg.cond(X.T@X))", packages: NP });
Q({ id: "m-slv-3", d: 3, secs: 90, prompt: "Minimum-norm solution of x₁ + x₂ = 2 (one equation, two unknowns). What is x₁?", answer: 1, tol: 0.01, explain: "pinv gives (1, 1): the smallest-norm point on the line.", py: "import numpy as np\nanswer = float((np.linalg.pinv(np.array([[1,1.]]))@np.array([2.]))[0])", packages: NP });
Q({ id: "m-slv-4", d: 2, secs: 45, prompt: "Which factorisation requires a symmetric positive definite matrix?", options: ["LU", "QR", "Cholesky", "SVD"], answer: 2, explain: "Cholesky A = LLᵀ exists only for symmetric PD matrices.", py: "answer = 2" });
C("m-slv-c1", "Solve, don't invert", "Factorise once (LU/Cholesky/QR), then triangular solves.");
C("m-slv-c2", "Normal equations caveat", "κ(XᵀX) = κ(X)²; use QR/SVD when ill-conditioned.");

L("m-la-practice", LA, "Linear algebra practice", "Six interview questions on vectors, rank, eigenvalues and SVD.", {
  kind: "interview", mins: 25, prereq: ["m-vectors", "m-rank", "m-eigen", "m-svd"],
  hook: "Answer each out loud in about a minute, then open it and tick off what the interviewer listens for.",
}, [
  iq("Why do embedding search systems normalise vectors?", "So that the dot product equals cosine similarity: ranking depends only on direction, not on vector length (which often tracks document length or popularity), and the fast inner-product index can be used. For unit vectors Euclidean distance gives the same ranking too.", ["Dot = cosine for unit vectors", "Length as a nuisance", "Same ranking across measures", "Speed of inner-product search"]),
  iq("Your regression coefficients change wildly when you add or drop one feature. What's going on in linear-algebra terms?", "Near-collinearity: the design matrix has a tiny singular value, so XᵀX is ill-conditioned and small data changes move coefficients a lot along that weak direction. Check VIFs or the condition number; fix by dropping or combining features, or ridge (which lifts small eigenvalues by λ).", ["Small singular value / ill-conditioning", "Condition number or VIF", "Ridge lifts eigenvalues", "Predictions may still be fine"]),
  iq("Explain PCA using SVD.", "Centre the data (and usually standardise), take X = UΣVᵀ. Columns of V are the principal directions, UΣ are the component scores, σᵢ²/n the variances. Keep the top k components by explained variance; the truncated reconstruction is the best rank-k approximation.", ["Centre first", "V = directions, UΣ = scores", "σ²/n = variance", "Best rank-k (Eckart–Young)"]),
  iq("What is a positive definite matrix and where do you meet one in ML?", "Symmetric with xᵀAx > 0 for all non-zero x, equivalently positive eigenvalues. Covariance matrices (PSD), Hessians of strictly convex losses, kernel Gram matrices, ridge's XᵀX + λI. Test with Cholesky.", ["Definition / eigenvalue test", "Covariance and Hessian", "Kernels", "Cholesky check"]),
  iq("How many parameters does a 4096 × 4096 linear layer have, and how does LoRA with rank 16 change the trainable count?", "16.8 M weights (plus 4,096 biases). LoRA freezes W and trains B (4096 × 16) and A (16 × 4096): 131,072 parameters, about 0.8%, exploiting the idea that the needed update is low-rank.", ["4096² ≈ 16.8 M", "2 × 4096 × 16 = 131,072", "Low-rank update idea", "W frozen"]),
  iq("Why do vanilla RNNs suffer from exploding or vanishing gradients?", "Backpropagation through time multiplies by the recurrent Jacobian at every step; along eigen-directions with |λ| > 1 the gradient grows exponentially and with |λ| < 1 it shrinks exponentially. LSTMs/GRUs, gradient clipping and careful initialisation address it.", ["Repeated multiplication", "Eigenvalues > 1 / < 1", "Exponential in sequence length", "Remedies"]),
]);
