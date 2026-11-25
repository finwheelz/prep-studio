/**
 * v2 Maths for ML, part B: Calculus and optimisation. Fixed ids; answers recomputed in Pyodide.
 */
import { CHECKED, iq, lessonWriter } from "./v2-shared";
import { MS } from "./v2-m-src";

const { L, Q, C } = lessonWriter("maths");
const CO = "Calculus and optimisation";
const NP = ["numpy"];
const SP = ["numpy", "scipy"];
const src = (label: string, url: string) => ({ label, url, checked: CHECKED });
const ADAM = src("Kingma and Ba (2014): Adam: A Method for Stochastic Optimization", "https://arxiv.org/abs/1412.6980");
const RUDER = src("Ruder (2016): An overview of gradient descent optimization algorithms", "https://arxiv.org/abs/1609.04747");

L("m-derivatives", CO, "Derivatives, gradients and the chain rule", "Slopes, the gradient as the direction of steepest ascent, and the chain rule that backpropagation is built on.", {
  kind: "concept", mins: 20,
  hook: "Backprop is 'just the chain rule'. Can you differentiate a logistic loss by hand in under a minute?",
  intuition: `
**The situation.** Training a model means nudging parameters to reduce a loss. To nudge sensibly you need to know how the loss changes when each parameter moves a little.

**The idea.** The **derivative** $f'(x)$ is the slope of $f$ at $x$: change $x$ by a small $h$ and $f$ changes by about $f'(x)\\,h$. With many inputs, the **gradient** $\\nabla f$ stacks the slope in every coordinate. It points in the direction of steepest increase, so $-\\nabla f$ is the steepest way down.

The **chain rule** says slopes multiply through a composition: if $L$ depends on $z$ and $z$ depends on $w$, then $\\frac{dL}{dw} = \\frac{dL}{dz}\\frac{dz}{dw}$. A neural network is a long composition, and backpropagation applies the chain rule from the loss backwards, reusing each intermediate result once.
`,
  maths: `
**In one breath.** $f'(x) = \\lim_{h\\to 0}\\frac{f(x+h)-f(x)}{h}$; $\\nabla f = (\\partial f/\\partial x_1, \\dots, \\partial f/\\partial x_n)$; $(f\\circ g)' = f'(g)\\,g'$; $f(x+\\delta) \\approx f(x) + \\nabla f^\\top\\delta$.

**Rules you need.**

| Function | Derivative |
|---|---|
| $x^n$ | $n x^{n-1}$ |
| $e^x$ | $e^x$ |
| $\\ln x$ | $1/x$ |
| $\\sigma(z) = 1/(1+e^{-z})$ | $\\sigma(z)(1-\\sigma(z))$ |
| $\\tanh z$ | $1 - \\tanh^2 z$ |
| $\\max(0, z)$ | $1$ if $z>0$, else $0$ |

**Worked example: logistic loss.** One example, $z = wx$, $p = \\sigma(z)$, $L = -[y\\ln p + (1-y)\\ln(1-p)]$.

$$\\frac{\\partial L}{\\partial p} = -\\frac{y}{p} + \\frac{1-y}{1-p}, \\quad \\frac{\\partial p}{\\partial z} = p(1-p), \\quad \\frac{\\partial z}{\\partial w} = x$$

Multiply: $\\frac{\\partial L}{\\partial w} = (p - y)\\,x$. The messy terms cancel, which is why sigmoid pairs with cross-entropy. With $w = 0$, $x = 2$, $y = 1$: $p = 0.5$, gradient $= -1$.

**Gradient example.** $f(x, y) = x^2y + 3y$: $\\nabla f = (2xy,\\; x^2 + 3)$. At $(1, 2)$: $(4, 4)$, length $\\sqrt{32} = 5.66$.

**Why the gradient is steepest.** The directional derivative along unit vector $u$ is $\\nabla f^\\top u = \\|\\nabla f\\|\\cos\\theta$, largest when $u$ points along $\\nabla f$.
`,
  practice: `
**Where it shows up.** Every training loop: forward pass computes the loss, backward pass computes the gradient by the chain rule (reverse-mode automatic differentiation), the optimiser steps along $-\\nabla L$.

**Autodiff, not symbolic or numeric.** Frameworks record operations and apply the chain rule backwards; one backward pass costs a small constant times one forward pass, whatever the number of parameters. Use finite differences only to *check* a gradient.
`,
  traps: [
    { trap: "The gradient points towards the minimum.", why: "It points in the direction of steepest local increase. Its negative is the steepest local decrease, which on a curved or badly scaled surface can be far from the direction to the minimum." },
    { trap: "ReLU isn't differentiable, so it can't be trained by gradients.", why: "It fails only at the single point $z = 0$; frameworks use a subgradient (0 or 1) there, which works in practice." },
  ],
  say: {
    prompt: "Derive the gradient of the logistic regression loss for one example and explain how the chain rule is used.",
    secs: 60,
    check: ["Set up z = wᵀx, p = σ(z), L = cross-entropy", "σ′ = σ(1 − σ)", "Chain: ∂L/∂p · ∂p/∂z · ∂z/∂w", "Result (p − y)x: error times input", "Link to backprop: same rule applied layer by layer"],
    followups: [
      { q: "Why does the gradient have such a simple form?", a: "Cross-entropy is the negative log-likelihood of a Bernoulli whose natural parameter is $z$; for canonical link functions the gradient is always (prediction − target) × input." },
      { q: "What is the gradient for MSE with a linear model?", a: "For $L = \\frac{1}{2}(w^\\top x - y)^2$ it is $(w^\\top x - y)\\,x$: again error times input." },
      { q: "Why is reverse mode used for neural nets rather than forward mode?", a: "Reverse mode gets the gradient of one scalar output with respect to all parameters in one backward pass; forward mode needs one pass per input direction." },
    ],
    answer: `For one example, z = wᵀx, p = σ(z) and the loss is −[y log p + (1 − y) log(1 − p)]. The chain rule multiplies three local derivatives: ∂L/∂p = −y/p + (1 − y)/(1 − p), ∂p/∂z = p(1 − p), and ∂z/∂w = x. The first two multiply to p − y, so the gradient is (p − y)x: the prediction error times the input.

Backprop does exactly this through every layer: each node multiplies the gradient flowing in from above by its own local derivative and passes it down, so one backward pass gives all gradients.`,
    avoid: ["Saying the gradient points to the minimum", "Forgetting the σ(1 − σ) factor cancels"],
  },
  terms: [["Gradient", "Vector of partial derivatives; direction of steepest ascent."], ["Chain rule", "(f∘g)′ = f′(g)·g′."], ["Autodiff", "Mechanical application of the chain rule to recorded operations."]],
  sources: [MS.mml, MS.dlb],
});
Q({ id: "m-drv-1", d: 1, secs: 30, prompt: "f(x) = x³ − 2x. What is f′(2)?", answer: 10, tol: 0.01, explain: "f′(x) = 3x² − 2 = 12 − 2 = 10.", py: "f=lambda x:x**3-2*x\nh=1e-5\nanswer = (f(2+h)-f(2-h))/(2*h)" });
Q({ id: "m-drv-2", d: 2, secs: 45, prompt: "f(x) = ln(1 + e^(2x)). What is f′(0)?", answer: 1, tol: 0.01, explain: "Chain rule: f′ = 2e^(2x)/(1 + e^(2x)) = 2σ(2x); at 0 that is 2 × 0.5 = 1.", py: "import math\nf=lambda x:math.log(1+math.exp(2*x))\nh=1e-5\nanswer = (f(h)-f(-h))/(2*h)" });
Q({ id: "m-drv-3", d: 2, secs: 60, prompt: "Logistic regression, one example: w = 0, x = 2, y = 1. What is ∂L/∂w for the cross-entropy loss?", answer: -1, tol: 0.01, explain: "(σ(0) − 1) × 2 = −0.5 × 2 = −1.", py: "import math\ns=lambda z:1/(1+math.exp(-z))\nL=lambda w:-math.log(s(w*2))\nh=1e-5\nanswer = (L(h)-L(-h))/(2*h)" });
Q({ id: "m-drv-4", d: 2, secs: 60, prompt: "f(x, y) = x²y + 3y. Length of the gradient at (1, 2)? (2 decimals)", answer: 5.66, tol: 0.01, explain: "∇f = (2xy, x² + 3) = (4, 4); length √32 = 5.66.", py: "import math\nf=lambda x,y:x*x*y+3*y\nh=1e-5\ngx=(f(1+h,2)-f(1-h,2))/(2*h);gy=(f(1,2+h)-f(1,2-h))/(2*h)\nanswer = math.hypot(gx,gy)" });
Q({ id: "m-drv-5", d: 1, secs: 30, prompt: "σ(z) is the sigmoid. What is σ′(0)?", answer: 0.25, tol: 0.002, explain: "σ(0)(1 − σ(0)) = 0.5 × 0.5 = 0.25, the largest the sigmoid's slope ever gets.", py: "import math\ns=lambda z:1/(1+math.exp(-z))\nh=1e-5\nanswer = (s(h)-s(-h))/(2*h)" });
C("m-drv-c1", "Logistic loss gradient", "(p − y)·x: prediction error times input.");
C("m-drv-c2", "σ′(z)", "σ(z)(1 − σ(z)); at most 0.25, at z = 0.");

L("m-jacobians", CO, "Partial derivatives, Jacobians and backprop shapes", "The Jacobian as the matrix of all partial derivatives, and how vector–Jacobian products make backprop cheap.", {
  kind: "concept", mins: 20, prereq: ["m-derivatives", "m-matrices"],
  hook: "A layer maps 512 numbers to 256. How many partial derivatives does that involve, and why does backprop never build the matrix?",
  intuition: `
**The situation.** Real layers take vectors in and send vectors out. One slope per input is no longer enough: each output depends on each input.

**The idea.** A **partial derivative** $\\partial f/\\partial x_i$ holds every other input fixed. For $f: \\mathbb{R}^n \\to \\mathbb{R}^m$, the **Jacobian** $J$ is the $m \\times n$ grid of all of them: row $i$ is the gradient of output $i$. It is the best linear approximation of $f$ near a point: $f(x + \\delta) \\approx f(x) + J\\delta$.

The chain rule for vector functions multiplies Jacobians. Backprop starts with the scalar loss, so it only ever needs a row vector times a Jacobian (a **vector–Jacobian product**), which is usually far cheaper than forming the Jacobian.
`,
  maths: `
**In one breath.** $J_{ij} = \\partial f_i/\\partial x_j$, shape (outputs × inputs); $J_{f\\circ g} = J_f J_g$; backprop computes $\\bar x = J^\\top \\bar y$ where $\\bar y = \\partial L/\\partial y$.

**Worked example.** $f(x, y) = (xy,\\; x + y^2)$:

$$J = \\begin{pmatrix} y & x \\\\ 1 & 2y \\end{pmatrix}, \\quad J(2, 3) = \\begin{pmatrix} 3 & 2 \\\\ 1 & 6 \\end{pmatrix}, \\quad \\det J = 16$$

The determinant is the local area-scaling factor (used in normalising flows).

**Common layers.**

| Layer | Jacobian | Backward pass |
|---|---|---|
| $y = Wx$ | $W$ | $\\bar x = W^\\top \\bar y$, $\\bar W = \\bar y x^\\top$ |
| elementwise $y = \\phi(x)$ | $\\text{diag}(\\phi'(x))$ | $\\bar x = \\phi'(x) \\odot \\bar y$ |
| softmax $p = \\text{softmax}(z)$ | $\\text{diag}(p) - pp^\\top$ | $\\bar z = p \\odot (\\bar p - p^\\top \\bar p)$ |
| softmax + cross-entropy | — | $\\bar z = p - y$ |

For $p = (0.5, 0.5)$, the softmax Jacobian is $\\begin{pmatrix}0.25 & -0.25\\\\ -0.25 & 0.25\\end{pmatrix}$: raising one logit raises its probability and lowers the other by the same amount.

**Cost.** A 512 → 256 dense layer has a $256 \\times 512$ Jacobian (131,072 entries) for one input, but $W^\\top\\bar y$ costs one matrix–vector product. Elementwise layers have diagonal Jacobians, so backprop never stores the zeros.
`,
  practice: `
**Shape check.** The gradient of a scalar loss with respect to a tensor has the tensor's shape. If $W$ is (in × out) and the batch $X$ is (B × in), then $\\bar W = X^\\top \\bar Y$ is (in × out): sums over the batch fall out of the matrix product.

**Jacobian-vector vs vector-Jacobian.** \`torch.func.jvp\` (forward mode) is cheap when there are few inputs; \`vjp\` (reverse mode) when there is one scalar output, as in training.
`,
  traps: [
    { trap: "The Jacobian of f: ℝⁿ → ℝᵐ is n × m.", why: "Convention is outputs × inputs, $m \\times n$, so that $J\\delta$ maps an input change to an output change. The gradient of a scalar is the transpose of its $1 \\times n$ Jacobian." },
    { trap: "Backprop materialises every layer's Jacobian.", why: "It only computes vector–Jacobian products; for a dense layer that's $W^\\top \\bar y$, for elementwise layers a pointwise multiply." },
  ],
  say: {
    prompt: "What is a Jacobian, and how does backpropagation use it without ever building it?",
    secs: 45,
    check: ["Matrix of partials, outputs × inputs", "Best linear approximation f(x + δ) ≈ f(x) + Jδ", "Chain rule = product of Jacobians", "Backprop is vector–Jacobian products from the scalar loss", "Dense: Wᵀȳ; elementwise: diagonal"],
    followups: [
      { q: "What is the softmax Jacobian?", a: "$\\text{diag}(p) - pp^\\top$: diagonal entries $p_i(1-p_i)$, off-diagonal $-p_ip_j$." },
      { q: "What is the gradient of the loss with respect to W in y = Wx?", a: "The outer product $\\bar y\\, x^\\top$, summed over the batch." },
      { q: "Where is the Jacobian determinant used?", a: "Change of variables for densities, e.g. normalising flows: $p_x(x) = p_z(z)\\,|\\det J|$." },
    ],
    answer: `For a function from n inputs to m outputs, the Jacobian is the m × n matrix of partial derivatives: row i is the gradient of output i. It's the local linear approximation of the function, and the chain rule says the Jacobian of a composition is the product of Jacobians.

Backprop starts from a scalar loss, so it carries a gradient row vector and multiplies it by each layer's Jacobian in turn. That vector–Jacobian product is cheap: for a dense layer it's Wᵀ times the incoming gradient, for an elementwise activation it's a pointwise multiply. The full matrices are never formed.`,
    avoid: ["Getting the Jacobian's shape backwards", "Saying backprop stores full Jacobians"],
  },
  terms: [["Partial derivative", "Slope in one coordinate with the others held fixed."], ["Jacobian", "m × n matrix of ∂fᵢ/∂xⱼ."], ["VJP", "Vector–Jacobian product; what reverse-mode autodiff computes."]],
  sources: [MS.mml, MS.dlb],
});
Q({ id: "m-jac-1", d: 2, secs: 60, prompt: "f(x, y) = (xy, x + y²). What is det J at (2, 3)?", answer: 16, tol: 0.01, explain: "J = [[y, x], [1, 2y]] = [[3, 2], [1, 6]]; det = 18 − 2 = 16.", py: "import numpy as np\nf=lambda v:np.array([v[0]*v[1], v[0]+v[1]**2])\nx=np.array([2.,3.]);h=1e-6\nJ=np.column_stack([(f(x+h*e)-f(x-h*e))/(2*h) for e in np.eye(2)])\nanswer = float(np.linalg.det(J))", packages: NP });
Q({ id: "m-jac-2", d: 1, secs: 30, prompt: "A dense layer maps 512 inputs to 256 outputs. How many rows does its Jacobian (outputs w.r.t. inputs) have?", answer: 256, tol: 0.5, explain: "Outputs × inputs: 256 × 512.", py: "import numpy as np\nW=np.zeros((256,512))\nanswer = W.shape[0]", packages: NP });
Q({ id: "m-jac-3", d: 2, secs: 60, prompt: "Softmax of logits z = (0, 0). What is ∂p₁/∂z₁?", answer: 0.25, tol: 0.002, explain: "p₁(1 − p₁) = 0.5 × 0.5.", py: "import numpy as np\nsm=lambda z:np.exp(z)/np.exp(z).sum()\nh=1e-6\nanswer = float((sm(np.array([h,0.]))[0]-sm(np.array([-h,0.]))[0])/(2*h))", packages: NP });
Q({ id: "m-jac-4", d: 2, secs: 60, prompt: "y = Wx with W = [[1, 2], [3, 4]] and upstream gradient ∂L/∂y = (1, 1). First component of ∂L/∂x?", answer: 4, tol: 0.01, explain: "Wᵀȳ = (1 + 3, 2 + 4) = (4, 6).", py: "import numpy as np\nW=np.array([[1,2],[3,4.]])\nanswer = float((W.T@np.array([1,1.]))[0])", packages: NP });
Q({ id: "m-jac-5", d: 2, secs: 45, prompt: "Softmax followed by cross-entropy, logits z, one-hot target y. Gradient of the loss w.r.t. z?", options: ["y − p", "p − y", "p(1 − p)", "−log p"], answer: 1, explain: "The softmax Jacobian and the −1/p from the log cancel to p − y.", py: "import numpy as np\nz=np.array([0.3,-1.2,2.0]);y=np.array([0,1.,0])\nsm=lambda z:np.exp(z)/np.exp(z).sum()\nL=lambda z:-np.log(sm(z)@y)\nh=1e-6\ng=np.array([(L(z+h*e)-L(z-h*e))/(2*h) for e in np.eye(3)])\nanswer = 1 if np.allclose(g, sm(z)-y, atol=1e-5) else 0", packages: NP });
C("m-jac-c1", "Jacobian shape", "Outputs × inputs; row i is ∇fᵢ.");
C("m-jac-c2", "Dense-layer backward", "x̄ = Wᵀȳ, W̄ = ȳxᵀ.");

L("m-hessian", CO, "Hessians, curvature and convexity", "Second derivatives, telling minima from saddles, and why convex losses are easy to optimise.", {
  kind: "concept", mins: 20, prereq: ["m-derivatives", "m-psd"],
  hook: "The gradient is zero. Is it a minimum, a maximum or a saddle, and how would you tell?",
  intuition: `
**The situation.** A zero gradient means the surface is flat in every direction, but flat at the bottom of a bowl, at the top of a hill and on a horse's saddle all look the same to the gradient.

**The idea.** The **Hessian** $H$ is the matrix of second derivatives: how the gradient itself changes. Its eigenvalues are the curvatures along its eigenvector directions.

- All eigenvalues positive: bowl, local minimum.
- All negative: hill top, local maximum.
- Mixed signs: saddle point.

A function is **convex** if its Hessian is positive semidefinite everywhere: a single bowl with no false bottoms. Any local minimum of a convex function is a global minimum. Linear regression, logistic regression and SVMs have convex losses; neural networks do not.
`,
  maths: `
**In one breath.** $H_{ij} = \\partial^2 f/\\partial x_i\\partial x_j$ (symmetric for smooth $f$); $f(x+\\delta) \\approx f(x) + \\nabla f^\\top\\delta + \\tfrac12\\delta^\\top H\\delta$; convex $\\iff H \\succeq 0$ everywhere; condition number $\\kappa = \\lambda_{\\max}/\\lambda_{\\min}$ governs how hard gradient descent finds it.

**Worked example.** $f(x, y) = x^2 + 3xy + y^2$: $H = \\begin{pmatrix}2 & 3\\\\ 3 & 2\\end{pmatrix}$, eigenvalues $5$ and $-1$. Mixed signs, so the origin is a saddle. Change to $x^2 + xy + y^2$: $H = \\begin{pmatrix}2 & 1\\\\ 1 & 2\\end{pmatrix}$, eigenvalues 3 and 1, convex.

**Convexity definition.** $f(\\theta a + (1-\\theta)b) \\le \\theta f(a) + (1-\\theta)f(b)$: the chord lies above the curve.

| Loss | Hessian | Convex? |
|---|---|---|
| MSE, linear model | $\\frac{2}{n}X^\\top X$ | yes (strictly if full rank) |
| Logistic | $X^\\top S X$, $S = \\text{diag}(p_i(1-p_i))$ | yes |
| Ridge | $X^\\top X + \\lambda I$ | strictly |
| Neural network | indefinite in places | no |

**Newton's method.** Minimise the quadratic approximation: $x_{\\text{new}} = x - H^{-1}\\nabla f$. On an exact quadratic it lands on the minimum in one step; for $f(x) = x^4$ from $x = 1$: $1 - 4/12 = 0.667$.
`,
  practice: `
**In high dimensions saddles dominate.** For a random critical point in a million dimensions, all-positive curvature is rare; most critical points of neural-net losses are saddles, and noisy gradient methods escape them.

**Why second-order methods are rare in deep learning.** The Hessian has $p^2$ entries; with $p = 10^8$ parameters that is unstorable. L-BFGS works for small models (scikit-learn's default logistic regression solver); deep learning uses first-order methods with adaptive per-parameter scaling (Adam) as a cheap diagonal stand-in.
`,
  traps: [
    { trap: "A zero gradient means you've reached a minimum.", why: "It is a critical point; check the Hessian. In deep nets most are saddles." },
    { trap: "Convex means the Hessian is positive definite.", why: "Positive semidefinite is enough ($f(x) = x$ is convex with $H = 0$). Positive definite everywhere gives strict convexity and a unique minimum." },
  ],
  say: {
    prompt: "What does the Hessian tell you, and why do we care whether a loss is convex?",
    secs: 45,
    check: ["Matrix of second derivatives = curvature", "Eigenvalues classify min / max / saddle", "Convex ⇔ PSD Hessian; local min = global min", "Examples: linear/logistic regression convex, neural nets not", "Condition number → GD speed; Newton uses H⁻¹"],
    followups: [
      { q: "Why is logistic regression's loss convex?", a: "Its Hessian $X^\\top SX$ with $S$ diagonal and positive is PSD for any data." },
      { q: "Why don't we use Newton's method for deep nets?", a: "The Hessian is $p \\times p$; storing or inverting it is impossible at scale, and it is indefinite so a raw Newton step can head towards saddles." },
      { q: "What does a high condition number do to gradient descent?", a: "The surface is a long narrow valley; a learning rate safe for the steep direction crawls along the flat one, so convergence takes about $\\kappa$ times more steps." },
    ],
    answer: `The Hessian is the matrix of second derivatives, so it describes curvature. At a point where the gradient is zero its eigenvalues classify it: all positive is a minimum, all negative a maximum, mixed a saddle. A function is convex if the Hessian is positive semidefinite everywhere, and then any local minimum is global, so gradient methods can't get stuck. Linear and logistic regression are convex; neural networks aren't, and in high dimensions most of their critical points are saddles. The ratio of largest to smallest curvature, the condition number, also tells you how slowly plain gradient descent will converge.`,
    avoid: ["Equating zero gradient with a minimum", "Requiring strict positive definiteness for convexity"],
  },
  terms: [["Hessian", "Matrix of second partial derivatives."], ["Convex function", "Chord above the curve; PSD Hessian."], ["Saddle point", "Critical point with curvature of both signs."]],
  sources: [MS.mml, MS.boyd, MS.dlb],
});
Q({ id: "m-hes-1", d: 2, secs: 60, prompt: "f(x, y) = x² + 3xy + y². Smallest eigenvalue of its Hessian?", answer: -1, tol: 0.01, explain: "H = [[2, 3], [3, 2]] has eigenvalues 5 and −1: a saddle.", py: "import numpy as np\nanswer = float(np.linalg.eigvalsh([[2,3],[3,2.]]).min())", packages: NP });
Q({ id: "m-hes-2", d: 1, secs: 30, prompt: "Which function is not convex on the real line?", options: ["x²", "|x|", "eˣ", "sin x"], answer: 3, explain: "sin x has negative second derivative on (0, π).", py: "import numpy as np\nx=np.linspace(-5,5,2001)\nfs=[x**2,np.abs(x),np.exp(x),np.sin(x)]\nnonconvex=[i for i,f in enumerate(fs) if (f[:-2]+f[2:]-2*f[1:-1]).min()< -1e-12]\nanswer = nonconvex[0]", packages: NP });
Q({ id: "m-hes-3", d: 2, secs: 45, prompt: "One Newton step on f(x) = x⁴ starting from x = 1. Where do you land? (3 decimals)", answer: 0.667, tol: 0.002, explain: "x − f′/f″ = 1 − 4/12 = 2/3.", py: "x=1.0\nanswer = x-(4*x**3)/(12*x**2)" });
Q({ id: "m-hes-4", d: 2, secs: 45, prompt: "A quadratic loss has Hessian eigenvalues 0.5 and 200. What is its condition number?", answer: 400, tol: 0.5, explain: "κ = 200 / 0.5 = 400: a long, narrow valley.", py: "import numpy as np\nanswer = float(np.linalg.cond(np.diag([0.5,200.])))", packages: NP });
Q({ id: "m-hes-5", d: 2, secs: 45, prompt: "Newton's method on f(x) = (x − 3)² + 1, starting from x = 10. Where is x after one step?", answer: 3, tol: 0.01, explain: "A quadratic is its own second-order approximation: one step lands on the minimum.", py: "x=10.0\nanswer = x-(2*(x-3))/2" });
C("m-hes-c1", "Classify a critical point", "Hessian eigenvalues: all + min, all − max, mixed saddle.");
C("m-hes-c2", "Convex", "PSD Hessian everywhere ⇒ every local minimum is global.");

L("m-gd", CO, "Gradient descent and learning rates", "The update rule, why the learning rate must sit below 2 over the curvature, and what ill-conditioning does.", {
  kind: "concept", mins: 20, prereq: ["m-derivatives", "m-hessian"],
  hook: "Your loss explodes to NaN in the first 100 steps. Halve the learning rate, or something else?",
  intuition: `
**The situation.** You can compute the gradient but can't solve $\\nabla L = 0$ in closed form (or it would cost too much). So you walk downhill.

**The idea.** Repeat $\\theta \\leftarrow \\theta - \\eta\\nabla L(\\theta)$. The **learning rate** $\\eta$ sets the step size.

- Too small: slow, wasted compute.
- Just right: steady fall.
- Too big: each step overshoots the valley floor by more than it started, and the loss oscillates and blows up.

The safe size depends on **curvature**: in a steep, sharply curved direction a big step overshoots. When some directions are steep and others flat (ill-conditioning), the step must suit the steepest one, and progress in the flat ones is painfully slow. That is why feature scaling speeds up training.
`,
  widget: "gradient-descent",
  maths: `
**In one breath.** $\\theta_{t+1} = \\theta_t - \\eta\\nabla L$; on $L = \\tfrac{a}{2}x^2$ the update is $x_{t+1} = (1 - \\eta a)x_t$, stable iff $0 < \\eta < 2/a$; with curvatures in $[\\mu, L]$ the best fixed step is $2/(L+\\mu)$ and the error shrinks by $\\frac{\\kappa-1}{\\kappa+1}$ per step.

**One dimension, exactly.** $f(x) = x^2$ ($a = 2$), $\\eta = 0.1$, $x_0 = 5$: each step multiplies by $1 - 0.2 = 0.8$, so $x_3 = 5 \\times 0.8^3 = 2.56$.

| $\\eta$ on $f = x^2$ | factor $1 - 2\\eta$ | behaviour |
|---|---|---|
| 0.1 | 0.8 | smooth convergence |
| 0.5 | 0 | lands on the minimum in one step |
| 0.9 | −0.8 | oscillates, converges |
| 1.0 | −1 | bounces forever |
| 1.1 | −1.2 | diverges |

**Many dimensions.** Along each Hessian eigenvector the factor is $1 - \\eta\\lambda_i$. Stability needs $\\eta < 2/\\lambda_{\\max}$; the flattest direction then shrinks by $1 - \\eta\\lambda_{\\min}$ per step. With $\\lambda \\in [1, 100]$ the best rate gives factor $99/101 = 0.980$: about 350 steps per thousandfold error reduction. Rescale so $\\kappa = 1$ and one step suffices.

**Convergence guarantees.** For convex $L$ with $L$-Lipschitz gradient and $\\eta = 1/L$: $f(\\theta_t) - f^* \\le \\frac{L\\|\\theta_0 - \\theta^*\\|^2}{2t}$. Strong convexity makes it linear (geometric).
`,
  practice: `
**Diagnosing.** Loss rising or NaN: rate too high (or a bug, e.g. log of 0). Loss flat: rate too low, dead units, or vanishing gradients. Loss zig-zagging: high-curvature direction; lower the rate or add momentum.

**Defaults.** Run a short learning-rate range test (increase $\\eta$ exponentially, pick about a tenth of where the loss blows up). Use warm-up then cosine or step decay for deep nets. Standardise features for linear models.
`,
  traps: [
    { trap: "A smaller learning rate is always safer.", why: "It avoids divergence but can stall progress in flat directions and, in deep nets, settle into sharper minima. The goal is the largest stable rate, then decay." },
    { trap: "Gradient descent is invariant to feature scaling.", why: "Scaling changes the Hessian's eigenvalues and so the condition number; unscaled features make a narrow valley and slow convergence. Newton's method is scale-invariant; gradient descent is not." },
  ],
  say: {
    prompt: "How do you choose a learning rate, and what goes wrong if it is too large or too small?",
    secs: 45,
    check: ["Update θ ← θ − η∇L", "Stability bound η < 2/λ_max (curvature)", "Too big: oscillation, divergence, NaN", "Too small: slow, stalls in flat directions", "Ill-conditioning and scaling; schedules, warm-up, range test"],
    followups: [
      { q: "Why does feature scaling speed up gradient descent?", a: "It makes the loss contours rounder (lower condition number), so one learning rate suits every direction." },
      { q: "What is a learning-rate warm-up for?", a: "Early in training curvature and Adam's variance estimates are unreliable; ramping $\\eta$ up avoids early blow-ups." },
      { q: "What is the stable range of η for f(x) = 2x²?", a: "$f'' = 4$, so $0 < \\eta < 0.5$." },
    ],
    answer: `Gradient descent steps θ ← θ − η∇L. On a quadratic each direction's error is multiplied by 1 − ηλ, where λ is the curvature, so the step is stable only if η is below 2 over the largest curvature. Too large and it overshoots, oscillates and diverges, often showing as NaN; too small and the flat directions barely move. When curvatures differ a lot, the condition number is large and convergence is slow, so I'd scale features and, for deep nets, use a range test to find the largest stable rate, add warm-up and decay it over training.`,
    avoid: ["“Smaller is always safer”", "No mention of curvature or scaling"],
  },
  terms: [["Learning rate", "Step size η."], ["Condition number", "λ_max/λ_min of the Hessian."], ["Learning-rate schedule", "Changing η over training (warm-up, decay)."]],
  sources: [MS.mml, MS.boyd, RUDER],
});
Q({ id: "m-gd-1", d: 1, secs: 45, prompt: "Gradient descent on f(x) = x² with η = 0.1, starting at x = 5. Value of x after 3 steps?", answer: 2.56, tol: 0.01, explain: "Each step multiplies x by 1 − 2η = 0.8: 5 × 0.8³.", py: "x=5.0\nfor _ in range(3): x-=0.1*2*x\nanswer = x" });
Q({ id: "m-gd-2", d: 2, secs: 45, prompt: "f(x) = 2x². Above what learning rate does gradient descent diverge?", answer: 0.5, tol: 0.01, explain: "f″ = 4; stable iff η < 2/4.", py: "import numpy as np\netas=np.round(np.arange(0.01,1.0,0.01),2)\ndef ok(e):\n    x=1.0\n    for _ in range(500): x-=e*4*x\n    return abs(x)<1\nanswer = float(min(e for e in etas if not ok(e)))", packages: NP });
Q({ id: "m-gd-3", d: 3, secs: 90, prompt: "A quadratic has Hessian eigenvalues 1 and 100. With the best fixed learning rate 2/(λmin + λmax), by what factor does the error shrink per step? (3 decimals)", answer: 0.98, tol: 0.002, explain: "(κ − 1)/(κ + 1) = 99/101 = 0.980.", py: "eta=2/101\nanswer = max(abs(1-eta*1), abs(1-eta*100))" });
Q({ id: "m-gd-4", d: 2, secs: 45, prompt: "Gradient descent on f(x) = x² with η = 1.0 from x = 3. What is x after 5 steps?", answer: -3, tol: 0.01, explain: "Factor 1 − 2 = −1: it bounces between 3 and −3 forever.", py: "x=3.0\nfor _ in range(5): x-=1.0*2*x\nanswer = x" });
Q({ id: "m-gd-5", d: 2, secs: 45, prompt: "Training loss jumps to NaN within the first few hundred steps. Most likely first fix?", options: ["Increase the learning rate", "Lower the learning rate or add warm-up", "Add more layers", "Remove feature scaling"], answer: 1, explain: "Divergence is the classic sign of a step size above the stability limit.", py: "x=1.0\nfor _ in range(100): x-=1.2*2*x\nanswer = 1 if abs(x)>1e6 else 0" });
C("m-gd-c1", "Stable learning rate", "η < 2/λ_max of the Hessian.");
C("m-gd-c2", "Ill-conditioning", "Per-step factor (κ − 1)/(κ + 1); scale features to shrink κ.");

L("m-optimisers", CO, "SGD, momentum, RMSProp and Adam", "Mini-batch noise, momentum as a running average of gradients, and Adam's per-parameter step sizes.", {
  kind: "concept", mins: 25, prereq: ["m-gd"],
  hook: "Adam with β₁ = 0.9, β₂ = 0.999. What do those numbers do, and why does the first step have size about η whatever the gradient?",
  intuition: `
**The situation.** Full-batch gradients over millions of examples are too expensive per step, and plain gradient descent crawls in narrow valleys.

**The ideas.**

- **SGD**: estimate the gradient from a mini-batch. Unbiased but noisy; the noise shrinks like $1/\\sqrt{B}$ and can help escape saddles and sharp minima.
- **Momentum**: keep a running average of past gradients and step along it. Oscillations across a valley cancel; consistent movement along it accumulates, like a ball rolling downhill.
- **RMSProp**: divide each parameter's step by a running root-mean-square of its gradients, so steep, noisy coordinates take smaller steps and flat ones larger.
- **Adam**: momentum plus RMSProp, with bias correction for the zero initialisation.
- **AdamW**: Adam with weight decay applied directly to the weights instead of mixed into the gradient.
`,
  maths: `
**In one breath.** Momentum $v \\leftarrow \\beta v + g$, $\\theta \\leftarrow \\theta - \\eta v$ (effective step $\\eta/(1-\\beta)$ for a constant gradient). Adam: $m \\leftarrow \\beta_1 m + (1-\\beta_1)g$, $v \\leftarrow \\beta_2 v + (1-\\beta_2)g^2$, $\\hat m = m/(1-\\beta_1^t)$, $\\hat v = v/(1-\\beta_2^t)$, $\\theta \\leftarrow \\theta - \\eta\\,\\hat m/(\\sqrt{\\hat v} + \\epsilon)$.

**Momentum, worked.** Constant gradient $g = 2$, $\\beta = 0.9$, $v_0 = 0$: $v_1 = 2$, $v_2 = 3.8$, $v_3 = 5.42$, tending to $g/(1-\\beta) = 20$. Momentum amplifies a consistent direction tenfold.

**Exponential moving averages.** An EMA with factor $\\beta$ averages over roughly the last $1/(1-\\beta)$ steps: 10 for 0.9, 1,000 for 0.999.

**Adam's first step.** $m_1 = 0.1g$, $v_1 = 0.001g^2$; bias-corrected $\\hat m = g$, $\\hat v = g^2$; step $= \\eta\\,g/|g| = \\pm\\eta$. Adam's step is roughly scale-free: multiplying the loss by 1,000 hardly changes it.

**Mini-batch noise.** Gradient variance scales as $\\sigma^2/B$. Going from $B = 32$ to $128$ halves the standard deviation. The "linear scaling rule" raises $\\eta$ in proportion to $B$ (with warm-up) to keep training dynamics similar.

| Optimiser | Memory per parameter | Typical use |
|---|---|---|
| SGD + momentum | 1 extra | CNNs, when tuned carefully |
| Adam / AdamW | 2 extra | transformers, default for most deep learning |
| L-BFGS | history of $k$ vectors | small, smooth, full-batch problems |
`,
  practice: `
**Defaults.** AdamW, $\\eta \\approx 10^{-3}$ for small nets and $10^{-4}$ to $3\\times10^{-4}$ for transformers, $\\beta = (0.9, 0.999)$ (0.95 for $\\beta_2$ in many LLM runs), weight decay 0.01–0.1, warm-up then cosine decay. SGD with momentum 0.9 is still competitive for vision with a good schedule.

**Memory.** Adam stores two extra numbers per parameter: a 7 B-parameter model in float32 needs 56 GB just for the optimiser state.
`,
  traps: [
    { trap: "Adam with L2 regularisation is the same as AdamW.", why: "Adding $\\lambda\\theta$ to the gradient gets divided by $\\sqrt{\\hat v}$, so heavily updated weights are barely decayed. AdamW subtracts $\\eta\\lambda\\theta$ directly, which regularises as intended." },
    { trap: "Bias correction is a minor detail.", why: "Without it, $m$ and $v$ start near zero; early steps are tiny or wildly mis-scaled, since $\\hat v$ is underestimated by a factor of about 1,000 at step 1 with $\\beta_2 = 0.999$." },
  ],
  say: {
    prompt: "Walk me from SGD to Adam. What does each piece fix?",
    secs: 60,
    check: ["SGD: mini-batch estimate, unbiased, noise ∝ 1/√B", "Momentum: EMA of gradients, damps oscillation, accelerates consistent directions", "RMSProp: per-parameter scaling by RMS of gradients", "Adam = both + bias correction", "AdamW decoupled weight decay; memory cost 2× params"],
    followups: [
      { q: "What does β₂ = 0.999 mean?", a: "The squared-gradient average spans about 1,000 steps." },
      { q: "Why might SGD generalise better than Adam in some vision tasks?", a: "Adam's per-parameter scaling can converge to sharper solutions; tuned SGD with momentum often finds flatter minima. With good tuning the gap is small." },
      { q: "What happens to gradient noise when you quadruple the batch?", a: "Variance falls by 4, standard deviation by 2; you can usually raise the learning rate." },
    ],
    answer: `SGD replaces the full gradient with a mini-batch estimate: cheap and unbiased, with noise that falls like one over root batch size. Momentum keeps an exponential average of gradients, so zig-zags across a valley cancel and steady directions build up speed, roughly by 1/(1 − β). RMSProp divides each coordinate by a running RMS of its gradients, giving each parameter its own step size. Adam combines the two and corrects the bias from initialising the averages at zero, which makes its early steps about η in size. In practice I'd use AdamW, which applies weight decay directly to the weights rather than through the adaptive scaling.`,
    avoid: ["Saying Adam needs no learning-rate tuning", "Treating L2 in Adam as AdamW"],
  },
  terms: [["Momentum", "EMA of gradients used as the step direction."], ["Adam", "Momentum + per-parameter RMS scaling + bias correction."], ["AdamW", "Adam with decoupled weight decay."]],
  sources: [ADAM, RUDER, MS.dlb],
});
Q({ id: "m-opt-1", d: 1, secs: 45, prompt: "Momentum v ← 0.9v + g with constant g = 2 and v₀ = 0. What is v after 2 steps?", answer: 3.8, tol: 0.01, explain: "v₁ = 2, v₂ = 1.8 + 2 = 3.8.", py: "v=0.0\nfor _ in range(2): v=0.9*v+2\nanswer = v" });
Q({ id: "m-opt-2", d: 2, secs: 60, prompt: "Adam (β₁ = 0.9, β₂ = 0.999, ε = 1e−8), η = 0.001, first step with gradient g = 50. Size of the parameter update? (4 decimals)", answer: 0.001, tol: 0.00002, explain: "Bias-corrected m̂ = 50, v̂ = 2500, step = η × 50/50 = η.", py: "g=50.0;b1=0.9;b2=0.999\nm=(1-b1)*g;v=(1-b2)*g*g\nmh=m/(1-b1);vh=v/(1-b2)\nanswer = 0.001*mh/(vh**0.5+1e-8)" });
Q({ id: "m-opt-3", d: 1, secs: 30, prompt: "Roughly how many recent steps does an EMA with β = 0.99 average over?", answer: 100, tol: 1, explain: "1/(1 − β) = 100.", py: "answer = round(1/(1-0.99))" });
Q({ id: "m-opt-4", d: 2, secs: 45, prompt: "Batch size goes from 32 to 128. By what factor does the standard deviation of the mini-batch gradient change?", answer: 0.5, tol: 0.01, explain: "SD ∝ 1/√B: √(32/128) = 0.5.", py: "import numpy as np\nrng=np.random.default_rng(0)\ng=rng.normal(size=2_000_000)\ns32=g[:len(g)//32*32].reshape(-1,32).mean(1).std()\ns128=g[:len(g)//128*128].reshape(-1,128).mean(1).std()\nanswer = round(float(s128/s32),1)", packages: NP });
Q({ id: "m-opt-5", d: 2, secs: 45, prompt: "What does AdamW change compared with Adam plus an L2 penalty in the loss?", options: ["It removes bias correction", "It applies weight decay directly to the weights, outside the adaptive scaling", "It uses a larger β₂", "It replaces momentum with Nesterov momentum"], answer: 1, explain: "Decoupled weight decay: θ ← θ − ηλθ separately from the Adam step.", py: "answer = 1" });
C("m-opt-c1", "Momentum amplification", "Constant gradient: steady-state step η·g/(1 − β); 10× for β = 0.9.");
C("m-opt-c2", "Adam first step", "Bias correction makes it ≈ η·sign(g).");

L("m-lagrange", CO, "Constrained optimisation, Lagrange multipliers and KKT", "Optimising subject to constraints, what the multiplier means, and where it appears in SVMs and maximum entropy.", {
  kind: "concept", mins: 20, prereq: ["m-derivatives"],
  hook: "Maximise xy subject to x + y = 10. Easy. Now explain what the multiplier λ = 5 means.",
  intuition: `
**The situation.** Many ML problems have constraints: probabilities must sum to 1, an SVM's margins must hold, a portfolio's weights must sum to 1, a budget can't be exceeded.

**The idea.** At a constrained optimum you can't improve $f$ without breaking the constraint. Geometrically, the contour of $f$ just touches the constraint surface, so their gradients are parallel: $\\nabla f = \\lambda\\nabla g$.

The multiplier $\\lambda$ is a **shadow price**: how much the best achievable $f$ improves per unit you relax the constraint.

**Inequalities (KKT).** For $h(x) \\le 0$, either the constraint is slack and its multiplier is zero, or it binds and the multiplier is positive. That "one or the other" (**complementary slackness**) is why only the support vectors have non-zero multipliers in an SVM.
`,
  maths: `
**In one breath.** Lagrangian $\\mathcal{L}(x, \\lambda) = f(x) - \\lambda g(x)$; solve $\\nabla_x\\mathcal{L} = 0$, $g(x) = 0$; $\\lambda = \\partial f^*/\\partial c$ for constraint $g(x) = c$. KKT for $\\min f$ s.t. $h_i \\le 0$: stationarity, primal feasibility, $\\mu_i \\ge 0$, $\\mu_i h_i = 0$.

**Worked example 1.** Maximise $xy$ s.t. $x + y = 10$: $y = \\lambda$, $x = \\lambda$, so $x = y = 5$, $f^* = 25$, $\\lambda = 5$. Check the shadow price: with budget 10.1, $f^* = 5.05^2 = 25.5025$, an increase of about $0.5 = \\lambda \\times 0.1$.

**Worked example 2.** Minimise $x^2 + y^2$ s.t. $x + 2y = 5$ (closest point on a line to the origin): $2x = \\lambda$, $2y = 2\\lambda$, so $x = \\lambda/2$, $y = \\lambda$; $\\lambda/2 + 2\\lambda = 5 \\Rightarrow \\lambda = 2$; point $(1, 2)$, value 5.

**Maximum entropy.** Maximise $-\\sum p_i\\ln p_i$ s.t. $\\sum p_i = 1$: $-\\ln p_i - 1 = \\lambda$ gives every $p_i$ equal, the uniform distribution. Add a mean constraint and you get the exponential family (softmax form).

| Problem | Constraint | Multiplier meaning |
|---|---|---|
| SVM | $y_i(w^\\top x_i + b) \\ge 1$ | $\\alpha_i > 0$ only for support vectors |
| Ridge as constrained | $\\|w\\|^2 \\le t$ | $\\lambda$ in the penalised form |
| Max entropy | $\\sum p = 1$, moments fixed | gives softmax / Gibbs form |
| Portfolio (Markowitz) | weights sum to 1, target return | marginal risk of more return |
`,
  practice: `
**Penalty vs constraint.** Ridge "minimise loss + $\\lambda\\|w\\|^2$" and "minimise loss s.t. $\\|w\\|^2 \\le t$" have the same solutions for matched $\\lambda$ and $t$: the penalty is the Lagrangian form. Lasso's diamond picture comes from the constrained form.

**Solvers.** \`scipy.optimize.minimize(method="SLSQP")\` with \`constraints=\` handles small problems; cvxpy for convex ones. Projected gradient descent (step, then project back onto the feasible set) is common in ML.
`,
  traps: [
    { trap: "Set the gradient of f to zero and then check the constraint.", why: "The constrained optimum usually has $\\nabla f \\ne 0$; it is where $\\nabla f$ is parallel to $\\nabla g$." },
    { trap: "Every inequality constraint gets a non-zero multiplier.", why: "Complementary slackness: inactive constraints have zero multipliers. In an SVM only points on or inside the margin get $\\alpha_i > 0$." },
  ],
  say: {
    prompt: "Explain Lagrange multipliers and give an ML example where they matter.",
    secs: 45,
    check: ["At optimum ∇f ∥ ∇g (contour tangent to constraint)", "Lagrangian f − λg, solve stationarity + constraint", "λ = shadow price, sensitivity of optimum to constraint", "KKT for inequalities, complementary slackness", "Example: SVM support vectors, max entropy → softmax, penalised = constrained"],
    followups: [
      { q: "What is complementary slackness?", a: "For each inequality, $\\mu_i h_i(x) = 0$: either the constraint binds or its multiplier is zero." },
      { q: "How does ridge relate to a constrained problem?", a: "Minimising loss + $\\lambda\\|w\\|^2$ is the Lagrangian of minimising the loss subject to $\\|w\\|^2 \\le t$; each $\\lambda$ matches some $t$." },
      { q: "Which distribution maximises entropy on n outcomes with no other constraint?", a: "The uniform distribution, entropy $\\ln n$." },
    ],
    answer: `To optimise f subject to g(x) = c, at the optimum the contour of f must be tangent to the constraint, so their gradients are parallel: ∇f = λ∇g. I form the Lagrangian f − λ(g − c), set its derivatives to zero and solve with the constraint. λ tells you how much the optimal value changes if you relax the constraint by one unit, a shadow price.

For inequality constraints the KKT conditions add that multipliers are non-negative and zero for slack constraints. In an SVM that's why only support vectors have non-zero dual weights, and in maximum entropy the multipliers produce the softmax form.`,
    avoid: ["Setting ∇f = 0 under a constraint", "No interpretation of λ"],
  },
  terms: [["Lagrangian", "f(x) − λ(g(x) − c)."], ["KKT conditions", "Stationarity, feasibility, μ ≥ 0, complementary slackness."], ["Shadow price", "Rate of change of the optimum as the constraint is relaxed."]],
  sources: [MS.boyd, MS.mml],
});
Q({ id: "m-lag-1", d: 1, secs: 45, prompt: "Maximise xy subject to x + y = 10. What is the maximum?", answer: 25, tol: 0.01, explain: "x = y = 5.", py: "from scipy.optimize import minimize\nr=minimize(lambda v:-v[0]*v[1],[1,9],constraints=[{'type':'eq','fun':lambda v:v[0]+v[1]-10}],method='SLSQP')\nanswer = round(-r.fun,4)", packages: SP });
Q({ id: "m-lag-2", d: 2, secs: 60, prompt: "Minimise x² + y² subject to x + 2y = 5. What is the minimum value?", answer: 5, tol: 0.01, explain: "Point (1, 2), the foot of the perpendicular from the origin; 1 + 4 = 5.", py: "from scipy.optimize import minimize\nr=minimize(lambda v:v[0]**2+v[1]**2,[0,0],constraints=[{'type':'eq','fun':lambda v:v[0]+2*v[1]-5}],method='SLSQP')\nanswer = round(r.fun,4)", packages: SP });
Q({ id: "m-lag-3", d: 2, secs: 60, prompt: "In the previous problem (min x² + y² s.t. x + 2y = 5), what is λ in ∇f = λ∇g?", answer: 2, tol: 0.01, explain: "2x = λ, 2y = 2λ, x + 2y = 5 ⇒ λ = 2. Also d(f*)/dc: f*(c) = c²/5, derivative 2c/5 = 2 at c = 5.", py: "fstar=lambda c:c*c/5\nh=1e-6\nanswer = (fstar(5+h)-fstar(5-h))/(2*h)" });
Q({ id: "m-lag-4", d: 2, secs: 45, prompt: "Maximise entropy −Σ pᵢ ln pᵢ over 4 outcomes with Σ pᵢ = 1. What is p₁ at the optimum?", answer: 0.25, tol: 0.002, explain: "Stationarity gives equal pᵢ: uniform.", py: "import numpy as np\nfrom scipy.optimize import minimize\nr=minimize(lambda p:np.sum(p*np.log(p)),[0.1,0.2,0.3,0.4],bounds=[(1e-9,1)]*4,constraints=[{'type':'eq','fun':lambda p:p.sum()-1}],method='SLSQP')\nanswer = round(float(r.x[0]),3)", packages: SP });
Q({ id: "m-lag-5", d: 2, secs: 45, prompt: "In a hard-margin SVM, which training points have non-zero Lagrange multipliers?", options: ["All of them", "Only misclassified points", "Only points on the margin (support vectors)", "Only points far from the boundary"], answer: 2, explain: "Complementary slackness: αᵢ > 0 only where the margin constraint binds.", py: "answer = 2" });
C("m-lag-c1", "Lagrange condition", "∇f = λ∇g at the constrained optimum; λ = shadow price.");
C("m-lag-c2", "Complementary slackness", "μᵢhᵢ(x) = 0: slack constraint ⇒ zero multiplier.");

L("m-mle", CO, "Maximum likelihood as optimisation", "Turning 'which parameters best explain the data' into minimising a negative log-likelihood, and how MSE and cross-entropy fall out.", {
  kind: "concept", mins: 20, prereq: ["m-derivatives"],
  hook: "Why is MSE the 'right' loss for regression and cross-entropy for classification? Both come from one recipe.",
  intuition: `
**The situation.** You've chosen a model family with parameters $\\theta$. Which $\\theta$?

**The idea.** **Maximum likelihood**: pick the $\\theta$ under which the observed data would have been most probable. Products of probabilities are awkward and underflow, so take logs (sums) and flip the sign to get a loss to minimise: the **negative log-likelihood** (NLL).

- Assume Gaussian noise around the prediction → NLL is MSE (plus constants).
- Assume Bernoulli labels with probability $\\sigma(w^\\top x)$ → NLL is binary cross-entropy.
- Assume Laplace noise → NLL is MAE.

So choosing a loss is choosing a noise model. Adding a prior and maximising the posterior instead (**MAP**) adds a regulariser: a Gaussian prior gives ridge, a Laplace prior gives lasso.
`,
  maths: `
**In one breath.** $\\hat\\theta = \\arg\\max_\\theta \\prod_i p(x_i\\mid\\theta) = \\arg\\min_\\theta -\\sum_i \\ln p(x_i\\mid\\theta)$; set the derivative of the log-likelihood to zero.

**Bernoulli.** $k$ successes in $n$: $\\ell(p) = k\\ln p + (n-k)\\ln(1-p)$; $\\ell'(p) = k/p - (n-k)/(1-p) = 0 \\Rightarrow \\hat p = k/n$.

**Exponential.** $\\ell(\\lambda) = n\\ln\\lambda - \\lambda\\sum x_i \\Rightarrow \\hat\\lambda = 1/\\bar x$.

**Gaussian.** $\\hat\\mu = \\bar x$, $\\hat\\sigma^2 = \\frac1n\\sum(x_i - \\bar x)^2$ (divides by $n$, so biased low; the unbiased estimator divides by $n - 1$). For $2, 4, 6, 8$: $\\hat\\mu = 5$, $\\hat\\sigma^2 = 20/4 = 5$.

**Regression.** $y_i = f_\\theta(x_i) + \\varepsilon$, $\\varepsilon \\sim N(0, \\sigma^2)$:

$$-\\ln L = \\frac{1}{2\\sigma^2}\\sum_i (y_i - f_\\theta(x_i))^2 + \\frac n2\\ln(2\\pi\\sigma^2)$$

so maximising likelihood is minimising squared error.

| Noise / label model | NLL loss |
|---|---|
| Gaussian | MSE |
| Laplace | MAE |
| Bernoulli | binary cross-entropy |
| Categorical | softmax cross-entropy |
| Poisson | Poisson deviance ($\\hat y - y\\ln\\hat y$) |

**Properties.** Under regularity conditions the MLE is consistent, asymptotically normal with variance from the inverse Fisher information, and invariant: the MLE of $g(\\theta)$ is $g(\\hat\\theta)$.
`,
  practice: `
**Choosing a loss.** Counts → Poisson loss; heavy-tailed errors → MAE or Huber; probabilities → log loss. Most libraries name these by distribution (\`objective="poisson"\` in LightGBM/XGBoost).

**No closed form?** Logistic regression's likelihood equation has no closed-form solution; it is solved iteratively (Newton/IRLS, L-BFGS). Separable data makes the MLE infinite, which regularisation fixes.
`,
  traps: [
    { trap: "The MLE of a Gaussian variance divides by n − 1.", why: "The MLE divides by $n$; $n - 1$ gives the unbiased estimator. They differ, noticeably for small $n$." },
    { trap: "MLE always exists and is finite.", why: "Perfectly separable data sends logistic-regression weights to infinity; a zero count gives $\\hat p = 0$ and infinite log loss on any later success. Priors or regularisation fix both." },
  ],
  say: {
    prompt: "Show that minimising MSE is maximum likelihood under an assumption, and say what that assumption is.",
    secs: 45,
    check: ["Define likelihood; take negative log", "Assume y = f(x) + Gaussian noise with constant variance", "NLL = sum of squares / 2σ² + constant", "So argmin MSE = MLE", "Other pairings: Bernoulli → cross-entropy, Laplace → MAE; MAP → regularisation"],
    followups: [
      { q: "What does MAP with a Gaussian prior on weights give?", a: "Ridge regression: the log prior adds $\\frac{1}{2\\tau^2}\\|w\\|^2$ to the loss." },
      { q: "MLE of a Poisson rate from counts 3, 5, 4?", a: "The sample mean, 4." },
      { q: "Why take logs?", a: "Products become sums (easy derivatives), numerical underflow is avoided, and the argmax is unchanged because log is increasing." },
    ],
    answer: `Assume each target is the model's prediction plus independent Gaussian noise with constant variance. The likelihood is a product of Gaussian densities; its negative log is the sum of squared residuals over 2σ² plus a constant that doesn't depend on the parameters. So the parameters that maximise likelihood are exactly those that minimise MSE. The same recipe with Bernoulli labels gives binary cross-entropy, Laplace noise gives MAE, and adding a prior and maximising the posterior adds a regulariser: Gaussian prior gives ridge, Laplace prior gives lasso.`,
    avoid: ["Not stating the Gaussian, constant-variance, independence assumption", "Confusing MLE variance (÷n) with the unbiased one (÷(n − 1))"],
  },
  terms: [["Likelihood", "p(data | θ) viewed as a function of θ."], ["NLL", "−Σ ln p(xᵢ | θ); the loss form of MLE."], ["MAP", "Maximise likelihood × prior; adds a regulariser."]],
  sources: [MS.mml, MS.dlb, MS.islr],
});
Q({ id: "m-mle-1", d: 1, secs: 30, prompt: "7 heads in 10 tosses. MLE of P(heads)?", answer: 0.7, tol: 0.002, explain: "k/n.", py: "from scipy.optimize import minimize_scalar\nimport math\nr=minimize_scalar(lambda p:-(7*math.log(p)+3*math.log(1-p)),bounds=(1e-6,1-1e-6),method='bounded',options={'xatol':1e-9})\nanswer = round(r.x,4)", packages: SP });
Q({ id: "m-mle-2", d: 2, secs: 45, prompt: "Waiting times 2, 4, 6 minutes are modelled as exponential with rate λ. MLE of λ?", answer: 0.25, tol: 0.002, explain: "1/x̄ = 1/4.", py: "from scipy import stats\nloc,scale=stats.expon.fit([2,4,6],floc=0)\nanswer = round(1/scale,6)", packages: SP });
Q({ id: "m-mle-3", d: 2, secs: 45, prompt: "Data 2, 4, 6, 8 modelled as Gaussian. MLE of the variance?", answer: 5, tol: 0.01, explain: "Divide by n: (9 + 1 + 1 + 9)/4 = 5. (The unbiased estimate is 20/3.)", py: "from scipy import stats\nmu,sd=stats.norm.fit([2,4,6,8])\nanswer = round(sd**2,6)", packages: SP });
Q({ id: "m-mle-4", d: 2, secs: 45, prompt: "Bernoulli model, 7 successes in 10, evaluated at the MLE. Total negative log-likelihood (natural log, 3 decimals)?", answer: 6.109, tol: 0.002, explain: "−(7 ln 0.7 + 3 ln 0.3) = 2.497 + 3.612 = 6.109.", py: "from scipy import stats\nimport numpy as np\nanswer = float(-np.sum(stats.bernoulli.logpmf([1]*7+[0]*3,0.7)))", packages: SP });
Q({ id: "m-mle-5", d: 1, secs: 30, prompt: "Minimising MAE is maximum likelihood under which noise distribution?", options: ["Gaussian", "Laplace", "Poisson", "Uniform"], answer: 1, explain: "Laplace density ∝ exp(−|ε|/b), so NLL ∝ Σ|ε|.", py: "import numpy as np\nfrom scipy import stats\ny=np.array([1.,2,3,10,11]);g=np.linspace(0,12,12001)\nnll=[-stats.laplace.logpdf(y,loc=m).sum() for m in g]\nanswer = 1 if abs(g[int(np.argmin(nll))]-np.median(y))<1e-6 else 0", packages: SP });
C("m-mle-c1", "Loss = noise model", "Gaussian → MSE, Laplace → MAE, Bernoulli → log loss.");
C("m-mle-c2", "MAP", "Gaussian prior → ridge; Laplace prior → lasso.");

L("m-numerics", CO, "Numerical issues: overflow, log-sum-exp and gradient checks", "Floating-point limits, stable softmax and log loss, cancellation, and checking gradients with finite differences.", {
  kind: "concept", mins: 20, prereq: ["m-derivatives"],
  hook: "softmax([1000, 1001]) returns NaN in numpy. Fix it in one line, and say why the fix is exact.",
  intuition: `
**The situation.** Maths on paper uses real numbers; code uses floating point with a limited range and about 7 (float32) or 16 (float64) significant digits. Losses that are fine on paper produce inf, NaN or garbage.

**The ideas.**

- **Overflow/underflow**: $e^{1000}$ is inf; $e^{-1000}$ is 0, and then $\\ln 0 = -\\infty$.
- **Shift invariance**: softmax doesn't change if you subtract the same constant from every logit, so subtract the max. This is the **log-sum-exp trick**.
- **Work in log space**: compute log-probabilities directly; frameworks fuse softmax and cross-entropy (and sigmoid and BCE) for this reason.
- **Catastrophic cancellation**: subtracting nearly equal numbers loses digits (e.g. one-pass variance $E[x^2] - E[x]^2$).
- **Check your gradients**: compare analytic gradients with a central finite difference.
`,
  maths: `
**In one breath.** $\\text{LSE}(z) = \\ln\\sum e^{z_i} = m + \\ln\\sum e^{z_i - m}$ with $m = \\max z$; $\\text{softmax}(z) = \\text{softmax}(z - m)$; float32 $\\epsilon = 2^{-23} \\approx 1.19\\times10^{-7}$, max $\\approx 3.4\\times10^{38}$ ($e^{88.7}$); central difference error $O(h^2)$, forward $O(h)$.

**Worked example.** $z = (1000, 1001)$: shifted $z - m = (-1, 0)$, softmax $= (1/(1+e), e/(1+e)) = (0.269, 0.731)$. $\\text{LSE}(1000, 1000) = 1000 + \\ln 2 = 1000.693$.

**Stable log loss.** $\\ln\\sigma(z) = -\\text{softplus}(-z) = -\\ln(1 + e^{-z})$, computed with \`log1p\` and branching on the sign of $z$; never take $\\ln$ of a probability that has already rounded to 0.

**Gradient check.** $g_{\\text{num}} = \\frac{f(x+h) - f(x-h)}{2h}$ with $h \\approx 10^{-5}$ (float64); compare by relative error $\\frac{|g - g_{\\text{num}}|}{\\max(|g|, |g_{\\text{num}}|)}$: below $10^{-7}$ is fine, above $10^{-3}$ is a bug.

| Format | Significand bits | Max | Typical use |
|---|---|---|---|
| float64 | 52 | $1.8\\times10^{308}$ | classical stats, gradient checks |
| float32 | 23 | $3.4\\times10^{38}$ | default training |
| bfloat16 | 7 | $3.4\\times10^{38}$ | mixed-precision training, same range as float32 |
| float16 | 10 | 65,504 | inference; training needs loss scaling |

**Variance cancellation.** Values around $10^8$ with spread 1: $E[x^2] - E[x]^2$ subtracts two numbers near $10^{16}$ and float64's 16 digits leave nothing. Welford's algorithm or centring first avoids it.
`,
  practice: `
**Use the fused functions.** PyTorch \`CrossEntropyLoss\` takes logits, \`BCEWithLogitsLoss\` takes logits; \`scipy.special.logsumexp\`, \`np.log1p\`, \`np.expm1\`. Clip probabilities (e.g. to $[10^{-15}, 1 - 10^{-15}]$) only when you are handed probabilities.

**Mixed precision.** float16's small range underflows small gradients; dynamic loss scaling multiplies the loss before backward and divides after. bfloat16 keeps float32's range, so it rarely needs scaling.
`,
  traps: [
    { trap: "Apply softmax, then take the log, then pass to NLL.", why: "Tiny probabilities round to 0 and the log gives −inf. Use log-softmax (or a loss on logits), which computes $z_i - \\text{LSE}(z)$ stably." },
    { trap: "Use a very small h, like 1e-12, for finite differences.", why: "Rounding error grows like $\\epsilon/h$ as truncation error shrinks; around $10^{-5}$ to $10^{-6}$ balances the two in float64." },
  ],
  say: {
    prompt: "Why does a naive softmax overflow, and how do libraries compute softmax and cross-entropy stably?",
    secs: 45,
    check: ["exp of large logits overflows (float32 above ~88)", "Softmax is shift-invariant: subtract the max", "Log-sum-exp: m + log Σ exp(z − m)", "Fuse softmax + log + NLL on logits; log-softmax", "Mention precision formats or gradient checking"],
    followups: [
      { q: "Why is subtracting the max exact, not an approximation?", a: "The constant $e^{-m}$ appears in numerator and denominator and cancels." },
      { q: "How would you check a hand-written gradient?", a: "Central finite differences on a few random coordinates in float64, comparing relative error." },
      { q: "Why does bfloat16 need less loss scaling than float16?", a: "It keeps float32's 8-bit exponent and range, trading away mantissa precision instead." },
    ],
    answer: `Softmax exponentiates the logits, and in float32 anything above about 88 overflows to infinity, giving inf over inf, which is NaN. Because softmax is unchanged when you subtract the same constant from every logit, libraries subtract the maximum first, so the largest exponent is e⁰ = 1 and nothing overflows. For the loss they never compute probabilities and then take logs; they compute log-softmax as z minus log-sum-exp(z), using the same max shift, and fuse it with the negative log-likelihood. That's why PyTorch's cross-entropy takes logits.`,
    avoid: ["Clipping logits as the main fix", "Taking log of an already-rounded probability"],
  },
  terms: [["Log-sum-exp", "m + log Σ exp(zᵢ − m)."], ["Machine epsilon", "Gap between 1 and the next float: 2⁻²³ for float32."], ["Catastrophic cancellation", "Loss of significant digits when subtracting close numbers."]],
  sources: [MS.dlb, MS.mml],
});
Q({ id: "m-num-1", d: 1, secs: 45, prompt: "log-sum-exp of (1000, 1000), natural log? (3 decimals)", answer: 1000.693, tol: 0.002, explain: "1000 + ln 2.", py: "from scipy.special import logsumexp\nanswer = float(logsumexp([1000.,1000.]))", packages: SP });
Q({ id: "m-num-2", d: 2, secs: 45, prompt: "Softmax of logits (1000, 1001): probability of the first class? (3 decimals)", answer: 0.269, tol: 0.002, explain: "Shift to (−1, 0): 1/(1 + e) = 0.269.", py: "from scipy.special import softmax\nanswer = float(softmax([1000.,1001.])[0])", packages: SP });
Q({ id: "m-num-3", d: 2, secs: 45, prompt: "Largest integer x for which exp(x) is finite in float32?", answer: 88, tol: 0.5, explain: "float32 max ≈ 3.4 × 10³⁸ = e^88.7.", py: "import numpy as np\nwith np.errstate(over='ignore'):\n    answer = max(x for x in range(200) if np.isfinite(np.exp(np.float32(x))))", packages: NP });
Q({ id: "m-num-4", d: 2, secs: 45, prompt: "Largest k such that 1 + 2⁻ᵏ ≠ 1 in float32?", answer: 23, tol: 0.5, explain: "float32 has 23 explicit significand bits: ε = 2⁻²³.", py: "import numpy as np\nanswer = max(k for k in range(60) if np.float32(1)+np.float32(2.0**-k)!=np.float32(1))", packages: NP });
Q({ id: "m-num-5", d: 2, secs: 45, prompt: "Error order of the central difference (f(x + h) − f(x − h))/2h for smooth f?", options: ["O(h)", "O(h²)", "O(h³)", "O(1/h)"], answer: 1, explain: "The h² terms of the Taylor expansions cancel; error ∝ h².", py: "import math\ne=lambda h:abs((math.sin(1+h)-math.sin(1-h))/(2*h)-math.cos(1))\nr=math.log(e(1e-2)/e(1e-3),10)\nanswer = 1 if abs(r-2)<0.1 else 0" });
C("m-num-c1", "Stable softmax", "Subtract max(z) first; exact because e^(−m) cancels.");
C("m-num-c2", "Gradient check", "Central difference, h ≈ 1e−5 in float64, relative error < 1e−7.");

L("m-calc-practice", CO, "Calculus and optimisation practice", "Six interview questions on gradients, convexity, optimisers and numerical stability.", {
  kind: "interview", mins: 25, prereq: ["m-derivatives", "m-hessian", "m-gd", "m-optimisers", "m-mle"],
  hook: "Answer each out loud in about a minute, then open it and tick off what the interviewer listens for.",
}, [
  iq("Derive the gradient of MSE for linear regression and say when you'd use gradient descent instead of the closed form.", "L = (1/n)‖Xw − y‖², ∇L = (2/n)Xᵀ(Xw − y). Setting it to zero gives the normal equations XᵀXw = Xᵀy. The direct solve costs about np² + p³; use (stochastic) gradient descent when n or p is huge, data streams, or you want early stopping, and scale features first.", ["Correct gradient (2/n)Xᵀ(Xw − y)", "Normal equations", "Cost of closed form", "When GD wins; scaling"]),
  iq("Your training loss oscillates wildly and occasionally spikes. Walk through what you'd check.", "Learning rate too high for the sharpest curvature (lower it, add warm-up), missing gradient clipping (RNNs/transformers), bad batches or outliers, numerical issues (log of 0, float16 overflow), and data shuffling. Plot gradient norm alongside loss.", ["Learning rate vs curvature", "Warm-up / clipping", "Numerical stability", "Data issues; monitor gradient norm"]),
  iq("Why is logistic regression's loss convex but a neural network's is not? Does it matter in practice?", "Logistic NLL has Hessian XᵀSX, PSD for any data. A network composes non-linearities, so the loss has permutation symmetries, saddles and many minima. In practice SGD finds good minima; saddles are escaped by noise, and over-parameterisation makes many minima equally good.", ["XᵀSX PSD", "Symmetries / saddles in NNs", "SGD noise escapes saddles", "Many good minima"]),
  iq("Explain Adam to someone who knows SGD. What are its hyperparameters and their defaults?", "Adam keeps an EMA of gradients (momentum, β₁ = 0.9) and of squared gradients (β₂ = 0.999), bias-corrects both, and steps η·m̂/(√v̂ + ε), ε ≈ 1e−8. Each parameter gets its own step size. Use AdamW for weight decay; η around 1e−3 for small nets, lower for transformers.", ["Two EMAs", "Bias correction", "Per-parameter step", "Defaults; AdamW"]),
  iq("Why is cross-entropy preferred to MSE for classification with a sigmoid output?", "Cross-entropy is the Bernoulli NLL and gives gradient (p − y)x, which stays large when the model is confidently wrong. MSE through a sigmoid has gradient (p − y)p(1 − p)x, which vanishes when p saturates near 0 or 1, so learning stalls; MSE + sigmoid is also non-convex in w.", ["Bernoulli NLL", "(p − y)x", "MSE gradient has p(1 − p) factor → vanishes", "Non-convexity"]),
  iq("What is the log-sum-exp trick and where else does it appear?", "log Σ eᶻ = m + log Σ e^(z − m) with m = max z; exact, avoids overflow. Appears in softmax/cross-entropy, log-likelihoods of mixtures, the forward algorithm in HMMs/CRFs, and attention implementations (online softmax in FlashAttention).", ["Formula and exactness", "Overflow reason", "Two or more other uses"]),
]);
