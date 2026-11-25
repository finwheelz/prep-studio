/**
 * v2 Deep learning, part F: Generative models (representation learning, VAEs, GANs, diffusion, contrastive).
 */
import { iq, lessonWriter } from "./v2-shared";
import { D } from "./v2-dl-sources";

const { L, Q, C } = lessonWriter("dl");
const GM = "Generative models";

L("dl-embeddings", GM, "Embeddings and representation learning", "Dense vectors for words, items and users: how they're learned, compared and used.", {
  kind: "concept", mins: 20, prereq: ["dl-mlp", "cml-knn"],
  hook: "One-hot vectors make 'king' and 'queen' exactly as different as 'king' and 'banana'. What representation fixes that, and where does it come from?",
  intuition: `
**The situation.** Words, products, users and merchants are categories with huge vocabularies. One-hot encodings are enormous and treat every pair as equally unrelated.

**The idea.** Give each item a learned dense vector (an **embedding**) of a few dozen to a few thousand numbers, so that similar items end up close together. An embedding layer is just a lookup table: row $i$ is item $i$'s vector, trained like any other weights.

How the vectors get their meaning depends on the training signal:

- **Supervised by a task:** user and item embeddings in a recommender trained to predict clicks.
- **Self-supervised from co-occurrence:** word2vec learns word vectors by predicting nearby words; items bought together get close vectors.
- **From a pretrained model:** a transformer's hidden states give contextual embeddings for sentences or images, used for search, clustering and RAG.
- **Metric learning:** losses like triplet or contrastive loss directly pull matching pairs together and push others apart (face recognition, retrieval).
`,
  maths: `
**In one breath.** Embedding = row lookup $e_i = E[i]$ with $E \\in \\mathbb{R}^{V \\times d}$ ($Vd$ parameters); compare with cosine similarity $\\cos(a, b) = \\frac{a \\cdot b}{\\|a\\|\\|b\\|}$; triplet loss $\\max(0, d(a, p) - d(a, n) + m)$.

**Worked examples.**

- Cosine similarity of $(1, 2, 2)$ and $(2, 1, 2)$: $8/9 = 0.889$.
- A 50,000-word vocabulary with 300-d embeddings: 15 million parameters.
- Triplet loss with $d(a, p) = 0.5$, $d(a, n) = 0.8$, margin 0.5: $\\max(0, 0.5 - 0.8 + 0.5) = 0.2$: the negative isn't yet far enough away.

**word2vec (skip-gram with negative sampling).** For each (word, context word) pair seen in text, increase $\\sigma(v_w \\cdot u_c)$; for a few random "negative" words, decrease it. Words with similar contexts end up with similar vectors, giving analogies like king − man + woman ≈ queen (roughly, not reliably).

| Use | How embeddings help |
|---|---|
| Recommenders | user/item vectors, dot-product scoring, ANN retrieval |
| Search / RAG | query and document embeddings, nearest neighbours |
| Tabular deep learning | entity embeddings for high-cardinality categoricals |
| Clustering, dedup | distances in embedding space |
`,
  practice: `
**Choosing embeddings.** Use a pretrained sentence/image embedding model before training your own; fine-tune with contrastive pairs from your domain if retrieval quality matters. Normalise vectors and use cosine/dot product consistently with how the model was trained.

**Serving.** Store vectors in an approximate nearest-neighbour index (FAISS, HNSW); refresh when the model changes (old and new embeddings aren't comparable).
`,
  traps: [
    { trap: "Embeddings from two different models can be compared directly.", why: "Each model has its own space; vectors from different models (or versions) aren't aligned. Re-embed everything when you switch." },
    { trap: "Word analogies prove embeddings understand meaning.", why: "They capture co-occurrence statistics; analogy results are cherry-picked and fragile, and embeddings also absorb social biases from the text." },
    { trap: "Euclidean and cosine distance always rank the same.", why: "Only for normalised vectors. With unnormalised embeddings, vector length (often frequency or popularity) changes Euclidean rankings." },
  ],
  say: {
    prompt: "What are embeddings and how are they learned?",
    secs: 45,
    check: ["Dense learned vectors; lookup table of V × d parameters", "Similar items close (cosine/dot product)", "Learned from a task, co-occurrence (word2vec), pretrained models, or metric learning", "Uses: recommenders, search/RAG, entity embeddings", "Pitfalls: model-specific spaces, normalisation, bias"],
    followups: [
      { q: "How does word2vec learn embeddings?", a: "Skip-gram with negative sampling: raise the score σ(v_w·u_c) for words that appear together in a window and lower it for randomly sampled words, so words with similar contexts get similar vectors." },
      { q: "What is triplet loss?", a: "max(0, d(anchor, positive) − d(anchor, negative) + margin): pushes each anchor closer to a matching example than to a non-matching one by at least the margin." },
      { q: "Why normalise embeddings before search?", a: "So cosine similarity equals the dot product and vector length (often popularity or document length) doesn't dominate rankings; ANN indexes then work with inner product." },
    ],
    answer: `An embedding maps each item, a word, product or user, to a learned dense vector, implemented as a lookup table of vocabulary size times dimension, trained like any other weights. The point is geometry: items that behave similarly end up close, so similarity becomes a cosine or dot product, unlike one-hot vectors where everything is equally far apart.

They can be learned from a downstream task, like user and item vectors in a click model; from co-occurrence, like word2vec predicting context words; from a pretrained model's hidden states, which is how sentence embeddings for search and RAG work; or directly with metric-learning losses like triplet or contrastive loss. In practice I'd start from a pretrained embedding model, normalise vectors, serve them from an ANN index, and remember that vectors from different models aren't comparable.`,
    avoid: ["Comparing embeddings across models", "Treating analogies as proof of understanding"],
  },
  terms: [["Embedding", "Learned dense vector for a discrete item."], ["Cosine similarity", "a·b/(‖a‖‖b‖)."], ["Negative sampling", "Contrast true pairs with random negatives."], ["Triplet loss", "max(0, d(a, p) − d(a, n) + m)."]],
  sources: [D.w2v, D.facenet, D.d2l],
});
Q({ id: "dl-emb-1", d: 1, secs: 45, prompt: "Cosine similarity of (1, 2, 2) and (2, 1, 2)? (3 decimals)", answer: 0.889, tol: 0.002, explain: "8/(3 × 3).", py: "import numpy as np\na = np.array([1,2,2.]); b = np.array([2,1,2.])\nanswer = float(a@b/np.linalg.norm(a)/np.linalg.norm(b))", packages: ["numpy"] });
Q({ id: "dl-emb-2", d: 1, secs: 30, prompt: "Embedding table for 50,000 tokens at 300 dimensions. Parameters, in millions?", answer: 15, tol: 0.02, explain: "50,000 × 300 = 15M.", py: "answer = 50000*300/1e6" });
Q({ id: "dl-emb-3", d: 1, secs: 30, prompt: "Triplet loss with d(a, p) = 0.5, d(a, n) = 0.8, margin 0.5?", answer: 0.2, tol: 0.002, explain: "max(0, 0.5 − 0.8 + 0.5) = 0.2.", py: "answer = max(0, 0.5 - 0.8 + 0.5)" });
Q({ id: "dl-emb-4", d: 2, secs: 60, prompt: "Vectors a = (1, 0), b = (10, 1), c = (0.9, 0.5). Which is nearer to a under Euclidean distance but less similar to a under cosine similarity?", options: ["b", "c"], answer: 1, explain: "c is much closer in Euclidean distance (0.51 vs 9.06), but b points almost the same way as a (cos 0.995 vs 0.874).", py: "import numpy as np\na = np.array([1,0.]); b = np.array([10,1.]); c = np.array([0.9,0.5])\ncos = lambda u, v: u@v/np.linalg.norm(u)/np.linalg.norm(v)\nnear_c = np.linalg.norm(a-c) < np.linalg.norm(a-b)\nless_cos_c = cos(a,c) < cos(a,b)\nanswer = 1 if (near_c and less_cos_c) else 0", packages: ["numpy"] });
C("dl-emb-c1", "Embedding layer", "Lookup table V × d; similarity by cosine/dot product.");

L("dl-vae", GM, "Autoencoders and VAEs", "Compress-and-reconstruct models, and how the variational autoencoder turns that into a generator.", {
  kind: "concept", mins: 25, prereq: ["dl-embeddings", "cml-pca"],
  hook: "An autoencoder reconstructs faces perfectly, but decoding a random point in its latent space gives garbage. What does the VAE add so random points decode into plausible faces?",
  intuition: `
**The situation.** You want to compress data into a small code (for denoising, anomaly detection or generation).

**Autoencoder.** An encoder maps $x$ to a low-dimensional code $z$; a decoder maps $z$ back to $\\hat x$; train to minimise reconstruction error. The bottleneck forces the code to keep what matters. A linear autoencoder with squared error learns the same subspace as PCA. Uses: denoising (train to reconstruct clean from noisy inputs), anomaly detection (high reconstruction error = unusual), compression, pretraining.

But the code space has holes: nothing says what a random $z$ means, so it isn't a good generator.

**Variational autoencoder (VAE).** The encoder outputs a **distribution** over codes, $q(z \\mid x) = \\mathcal{N}(\\mu, \\sigma^2)$, and training adds a penalty (KL divergence) pulling every such distribution towards a standard normal. The latent space becomes smooth and filled in, so sampling $z \\sim \\mathcal{N}(0, I)$ and decoding gives new, plausible samples. The **reparameterisation trick** ($z = \\mu + \\sigma\\epsilon$) lets gradients flow through the sampling step.
`,
  maths: `
**In one breath.** Maximise the ELBO: $\\mathbb{E}_{q(z \\mid x)}[\\log p(x \\mid z)] - \\text{KL}(q(z \\mid x)\\,\\|\\,p(z))$; for Gaussians $\\text{KL} = \\tfrac12\\sum_j(\\sigma_j^2 + \\mu_j^2 - 1 - \\ln\\sigma_j^2)$; reparameterise $z = \\mu + \\sigma \\odot \\epsilon$, $\\epsilon \\sim \\mathcal{N}(0, I)$.

**Worked examples.**

- $\\mu = 1$, $\\sigma = 1$ (one dimension): KL $= \\tfrac12(1 + 1 - 1 - 0) = 0.5$.
- $\\mu = 0$, $\\sigma = 0.5$: KL $= \\tfrac12(0.25 - 1 - \\ln 0.25) = 0.318$: being too certain is also penalised.
- Reparameterisation: $\\mu = 2$, $\\sigma = 0.5$, $\\epsilon = -1$ → $z = 1.5$.

**The trade-off.** The reconstruction term wants informative, precise codes; the KL term wants codes indistinguishable from the prior. Weighting KL more ($\\beta$-VAE) gives smoother, more disentangled but blurrier results. **Posterior collapse:** a powerful decoder ignores $z$ and KL goes to 0.

| Model | Latent | Generates? | Typical use |
|---|---|---|---|
| Autoencoder | deterministic code | poorly | compression, denoising, anomaly detection |
| VAE | Gaussian per input, KL to prior | yes (often blurry) | generation, latent spaces, compression in latent diffusion |
| VQ-VAE | discrete codebook | yes (with a prior model) | tokenising images/audio |
`,
  practice: `
**Where VAEs matter today.** As the image compressor inside latent diffusion models (Stable Diffusion encodes images to a VAE latent, diffuses there, decodes back), and VQ-style tokenisers for multimodal models.

**Anomaly detection recipe.** Train an autoencoder on normal data only; flag inputs whose reconstruction error exceeds a threshold chosen on validation data.
`,
  traps: [
    { trap: "An autoencoder can generate new data by decoding random codes.", why: "Its latent space is unstructured; random codes usually decode to nonsense. The VAE's KL term to a prior is what makes sampling work." },
    { trap: "Sampling z blocks backpropagation, so VAEs can't be trained end to end.", why: "The reparameterisation trick writes z = μ + σε with external noise ε, so gradients flow to μ and σ." },
    { trap: "VAE samples are blurry because the network is too small.", why: "Largely because of the Gaussian likelihood/MSE reconstruction, which averages over plausible outputs. GANs and diffusion produce sharper samples." },
  ],
  say: {
    prompt: "Explain the difference between an autoencoder and a variational autoencoder.",
    secs: 60,
    check: ["Autoencoder: encoder → bottleneck code → decoder; reconstruction loss", "Uses: compression, denoising, anomaly detection; linear AE ≈ PCA", "VAE: encoder outputs μ, σ; KL to N(0, I) regularises latent space", "ELBO = reconstruction − KL; reparameterisation trick", "Sampling from prior generates; blurriness, posterior collapse, latent diffusion use"],
    followups: [
      { q: "What is the reparameterisation trick?", a: "Write the sample as z = μ + σ·ε with ε ~ N(0, I) drawn independently, making z a differentiable function of μ and σ so gradients can flow through the sampling step." },
      { q: "What is posterior collapse?", a: "When the decoder is powerful enough to model the data without z, the encoder's q(z|x) matches the prior (KL → 0) and the latent carries no information. Mitigated with KL annealing or weaker decoders." },
      { q: "How do you use an autoencoder for anomaly detection?", a: "Train it on normal data only; anomalies reconstruct poorly, so flag inputs whose reconstruction error exceeds a threshold set on validation data." },
    ],
    answer: `An autoencoder compresses each input to a small code with an encoder and reconstructs it with a decoder, trained on reconstruction error. The bottleneck forces it to keep the important structure, which is useful for compression, denoising and anomaly detection, but its code space has no structure, so decoding random codes doesn't produce realistic samples.

A VAE makes the encoder output a Gaussian, a mean and variance, for each input, and adds a KL-divergence penalty pulling those Gaussians towards a standard normal prior. Training maximises the ELBO, reconstruction minus KL, using the reparameterisation trick so gradients pass through the sampling. The result is a smooth, filled-in latent space: sample from the prior, decode, and you get new data, though often blurrier than GANs or diffusion. Today VAEs are best known as the latent compressor inside latent diffusion models.`,
    avoid: ["“Autoencoders are generative models like GANs”", "Forgetting the reparameterisation trick"],
  },
  terms: [["Bottleneck", "Low-dimensional code between encoder and decoder."], ["ELBO", "Evidence lower bound: reconstruction − KL."], ["Reparameterisation trick", "z = μ + σε."], ["Posterior collapse", "Latent ignored; KL → 0."]],
  sources: [D.vae, D.d2l],
});
Q({ id: "dl-vae-1", d: 1, secs: 45, prompt: "KL(N(μ, σ²) ‖ N(0, 1)) for μ = 1, σ = 1?", answer: 0.5, tol: 0.002, explain: "½(σ² + μ² − 1 − ln σ²) = ½(1 + 1 − 1 − 0) = 0.5.", py: "import math\nm, s = 1.0, 1.0\nanswer = 0.5*(s*s + m*m - 1 - math.log(s*s))" });
Q({ id: "dl-vae-2", d: 2, secs: 60, prompt: "Same KL for μ = 0, σ = 0.5? (3 decimals)", answer: 0.318, tol: 0.002, explain: "½(0.25 − 1 − ln 0.25) = ½(0.25 − 1 + 1.386) = 0.318.", py: "import math\nm, s = 0.0, 0.5\nanswer = 0.5*(s*s + m*m - 1 - math.log(s*s))" });
Q({ id: "dl-vae-3", d: 3, secs: 90, prompt: "Check the closed-form KL numerically: Monte Carlo estimate of E_q[log q(z) − log p(z)] for q = N(1, 1), p = N(0, 1) with 400,000 samples. Nearest to?", options: ["0.25", "0.5", "1.0", "2.0"], answer: 1, explain: "Monte Carlo agrees with ½(σ² + μ² − 1 − ln σ²) = 0.5.", py: "import numpy as np\nfrom scipy.stats import norm\nrng = np.random.default_rng(0)\nz = rng.normal(1, 1, 400000)\nkl = float((norm.logpdf(z, 1, 1) - norm.logpdf(z, 0, 1)).mean())\nopts = [0.25, 0.5, 1.0, 2.0]\nanswer = min(range(4), key=lambda i: abs(opts[i]-kl))", packages: ["numpy", "scipy"] });
Q({ id: "dl-vae-4", d: 1, secs: 30, prompt: "Reparameterised sample with μ = 2, σ = 0.5 and ε = −1?", answer: 1.5, tol: 0.002, explain: "z = μ + σε = 2 − 0.5.", py: "answer = 2 + 0.5*(-1)" });
C("dl-vae-c1", "Gaussian KL to N(0,1)", "½Σ(σ² + μ² − 1 − ln σ²).");
C("dl-vae-c2", "ELBO", "E_q[log p(x|z)] − KL(q(z|x) ‖ p(z)).");

L("dl-gans", GM, "Generative adversarial networks", "A generator and a discriminator in a two-player game: the objective, training tricks and failure modes.", {
  kind: "concept", mins: 25, prereq: ["dl-output-loss"],
  hook: "Two networks train against each other and neither has a target to match. What does the generator's loss even measure, and why do GANs so often collapse to producing one kind of image?",
  intuition: `
**The situation.** You want sharp, realistic samples, not the blurry averages squared-error reconstructions produce.

**The idea.** A **generator** $G$ turns random noise $z$ into a fake sample. A **discriminator** $D$ tries to tell real samples from fakes. Train them in alternation: $D$ improves at spotting fakes; $G$ improves at fooling $D$. If both are strong enough and training converges, $G$'s samples become indistinguishable from real data.

Because the generator is judged by a learned critic rather than pixel-wise error, it's pushed towards sharp, realistic details.

**Why it's hard.**

- **Instability:** it's a game, not a minimisation; losses oscillate and may not converge.
- **Mode collapse:** $G$ finds a few outputs that fool $D$ and produces only those, losing diversity.
- **Vanishing generator gradient:** early on $D$ easily rejects fakes; the original loss gives $G$ almost no gradient. The **non-saturating** loss fixes this.

GANs powered StyleGAN-quality faces and image-to-image translation; diffusion models have since taken over most generation tasks because they train more stably and cover the data distribution better.
`,
  maths: `
**In one breath.** $\\min_G\\max_D\\; \\mathbb{E}_{x}[\\log D(x)] + \\mathbb{E}_{z}[\\log(1 - D(G(z)))]$; optimal discriminator $D^*(x) = \\dfrac{p_{data}(x)}{p_{data}(x) + p_g(x)}$; non-saturating generator loss $-\\mathbb{E}_z[\\log D(G(z))]$.

**Worked examples.**

- At a point where $p_{data} = 0.6$ and $p_g = 0.2$: $D^* = 0.75$.
- At equilibrium ($p_g = p_{data}$), $D^* = 0.5$ everywhere and the value is $\\log 0.5 + \\log 0.5 = -\\log 4 = -1.386$; the objective then equals $2\\,\\text{JSD}(p_{data} \\| p_g) - \\log 4$.
- Early training, $D(G(z)) = 0.1$: the non-saturating loss $-\\log 0.1 = 2.303$ gives a strong gradient, whereas $\\log(1 - 0.1)$ is nearly flat.

**Stabilisers.** Non-saturating loss, Wasserstein loss with gradient penalty (WGAN-GP), spectral normalisation, two-time-scale learning rates, minibatch discrimination, progressive growing (StyleGAN), careful architecture (DCGAN rules).

| Failure | Symptom | Mitigation |
|---|---|---|
| Mode collapse | low diversity, repeated outputs | WGAN-GP, minibatch features, unrolled GANs |
| D too strong | G gradient vanishes | non-saturating loss, lower D capacity/LR |
| Oscillation | losses swing, quality fluctuates | spectral norm, TTUR, EMA of G weights |

**Evaluation.** FID (Fréchet Inception Distance) compares feature statistics of real and generated images (lower is better); precision/recall for generative models separates quality from diversity.
`,
  practice: `
**When GANs still make sense.** Fast single-step generation (real-time super-resolution, image-to-image translation), and as an adversarial loss term inside other models (e.g. the decoder of a latent diffusion VAE).

**Don't trust the loss curves.** GAN losses don't track sample quality; monitor FID and look at samples regularly.
`,
  traps: [
    { trap: "A lower generator loss means better images.", why: "Losses reflect the current balance between G and D, not sample quality. Use FID and visual checks." },
    { trap: "Mode collapse means the generator outputs exactly one image.", why: "Usually it's partial: a few modes are over-represented and others missing. Measure diversity (recall) to detect it." },
    { trap: "GANs learn an explicit density you can evaluate.", why: "They're implicit models: you can sample but can't compute p(x), unlike VAEs (bound) or normalising flows (exact)." },
  ],
  say: {
    prompt: "Explain how GANs work and why they're hard to train.",
    secs: 60,
    check: ["Generator from noise vs discriminator real/fake; adversarial min-max", "Optimal D = p_data/(p_data + p_g); equilibrium at D = 0.5 (JSD)", "Non-saturating generator loss for early gradients", "Instability and mode collapse; WGAN-GP, spectral norm", "Evaluation with FID; diffusion largely replaced GANs"],
    followups: [
      { q: "Why use the non-saturating generator loss?", a: "Early on D confidently rejects fakes, so log(1 − D(G(z))) is flat and gives tiny gradients; maximising log D(G(z)) instead has the same fixed point but strong gradients when G is bad." },
      { q: "What is mode collapse and how do you detect it?", a: "The generator covers only a few modes of the data. Detect via low sample diversity, recall-style metrics or by checking class coverage with a pretrained classifier." },
      { q: "What does FID measure?", a: "The Fréchet distance between Gaussian fits to Inception features of real and generated images: sensitive to both quality and diversity; lower is better." },
    ],
    answer: `A GAN trains two networks against each other. The generator maps random noise to samples; the discriminator classifies inputs as real or generated. The discriminator is trained to tell them apart and the generator to fool it, a min-max game whose ideal end point is a generator matching the data distribution, where the best discriminator outputs one half everywhere. Because the generator is judged by a learned critic rather than pixel error, its samples are sharp.

Training is hard because it's a game, not a minimisation: losses oscillate, a too-strong discriminator starves the generator of gradient, which is why we use the non-saturating loss, and the generator can collapse onto a few modes. Fixes include Wasserstein losses with gradient penalty, spectral normalisation and tuned learning rates, and we judge progress by FID and samples rather than loss curves. Diffusion models have largely replaced GANs for high-quality generation because they're more stable and cover the distribution better.`,
    avoid: ["Judging GANs by loss values", "Claiming GANs give likelihoods"],
  },
  terms: [["Generator / discriminator", "Sample maker / real-vs-fake classifier."], ["Mode collapse", "Generator covers only part of the data distribution."], ["Non-saturating loss", "G maximises log D(G(z))."], ["FID", "Fréchet Inception Distance between real and generated features."]],
  sources: [D.gan, D.d2l],
});
Q({ id: "dl-gan-1", d: 1, secs: 30, prompt: "At some x, p_data = 0.6 and p_g = 0.2. Optimal discriminator output D*(x)?", answer: 0.75, tol: 0.002, explain: "0.6/(0.6 + 0.2).", py: "answer = 0.6/(0.6+0.2)" });
Q({ id: "dl-gan-2", d: 2, secs: 45, prompt: "GAN value function at equilibrium (D = 0.5 everywhere): log 0.5 + log 0.5? (3 decimals)", answer: -1.386, tol: 0.002, explain: "−log 4.", py: "import math\nanswer = 2*math.log(0.5)" });
Q({ id: "dl-gan-3", d: 2, secs: 60, prompt: "D(G(z)) = 0.1. Compare gradient magnitudes w.r.t. D's output: d/dD[−log D] vs d/dD[log(1 − D)]. Ratio (non-saturating / original)?", answer: 9, tol: 0.02, explain: "|−1/D| = 10 vs |−1/(1 − D)| = 1.11: ratio 9. The non-saturating loss gives a far stronger signal when fakes are easily spotted.", py: "D = 0.1\nanswer = (1/D)/(1/(1-D))" });
Q({ id: "dl-gan-4", d: 1, secs: 30, prompt: "Generated faces are realistic but nearly all look like the same few people. This is…", options: ["overfitting", "mode collapse", "vanishing gradients in D", "posterior collapse"], answer: 1, explain: "The generator covers only a few modes.", py: "answer = 1" });
C("dl-gan-c1", "Optimal discriminator", "D* = p_data/(p_data + p_g); equilibrium D = 0.5.");

L("dl-diffusion", GM, "Diffusion models", "Learning to reverse a noising process: forward/backward steps, the noise-prediction loss, latent diffusion and guidance.", {
  kind: "concept", mins: 30, prereq: ["dl-vae"],
  hook: "Diffusion models generate an image by starting from pure noise and denoising it 20–1,000 times. What exactly is the network trained to predict at each step?",
  intuition: `
**The situation.** Image, video and audio generation today is mostly diffusion. Interviewers ask for the core idea and the training objective.

**Forward process (fixed, no learning).** Take a real image and add a little Gaussian noise, many times, until it's pure noise. There's a closed form to jump straight to any step $t$.

**Reverse process (learned).** Train a network to undo one step: given a noisy image $x_t$ and the step $t$, predict the noise that was added. Training is simple supervised regression: pick a real image, pick a random $t$, add noise $\\epsilon$, ask the network to predict $\\epsilon$, use squared error.

**Generation.** Start from random noise and repeatedly subtract the predicted noise (plus a bit of fresh noise), step by step, until an image appears. Faster samplers (DDIM, DPM-Solver) use 20–50 steps instead of 1,000.

**Practical upgrades.** **Latent diffusion** runs the process in a VAE's compressed latent space (much cheaper), and **classifier-free guidance** steers generation towards a text prompt by extrapolating between conditional and unconditional predictions.
`,
  maths: `
**In one breath.** $x_t = \\sqrt{\\bar\\alpha_t}\\,x_0 + \\sqrt{1 - \\bar\\alpha_t}\\,\\epsilon$ with $\\bar\\alpha_t = \\prod_{s \\le t}(1 - \\beta_s)$; loss $\\mathbb{E}\\|\\epsilon - \\epsilon_\\theta(x_t, t)\\|^2$; guidance $\\hat\\epsilon = \\epsilon_u + w(\\epsilon_c - \\epsilon_u)$.

**Worked examples.**

- $\\bar\\alpha = 0.64$, $x_0 = 1$, $\\epsilon = 0.5$: $x_t = 0.8 + 0.6 \\times 0.5 = 1.1$.
- Constant $\\beta = 0.02$ for 10 steps: $\\bar\\alpha_{10} = 0.98^{10} = 0.817$.
- Signal-to-noise ratio $\\bar\\alpha/(1 - \\bar\\alpha)$ at $\\bar\\alpha = 0.8$: 4. It falls towards 0 as $t$ grows.
- Classifier-free guidance with $\\epsilon_u = 0.2$, $\\epsilon_c = 0.5$, $w = 3$: $0.2 + 3 \\times 0.3 = 1.1$, pushing harder in the direction the prompt implies.

**Architecture.** A U-Net with timestep embeddings (and cross-attention to text embeddings), or a transformer on latent patches (DiT) in newer systems.

| | GAN | VAE | Diffusion |
|---|---|---|---|
| Training | adversarial, unstable | ELBO, stable | denoising regression, stable |
| Sample quality | sharp | blurrier | sharp, diverse |
| Mode coverage | can collapse | good | good |
| Sampling speed | 1 step | 1 step | many steps (distillation reduces) |
`,
  practice: `
**Know the knobs.** Number of sampling steps (speed vs quality), guidance scale (prompt adherence vs diversity/artefacts), sampler choice, resolution/latent size, negative prompts.

**Speed-ups.** Fewer-step samplers, distillation into few-step models (consistency models), latent diffusion, caching.
`,
  traps: [
    { trap: "The network learns to generate an image in one forward pass.", why: "It learns to denoise one step (predict the noise at a given noise level); generation chains many of these steps." },
    { trap: "Higher guidance scale always gives better images.", why: "It increases prompt adherence but reduces diversity and can oversaturate or distort images; there's a sweet spot." },
    { trap: "Diffusion operates on raw pixels in Stable Diffusion.", why: "Latent diffusion works in a VAE latent space (e.g. 8× downsampled), then decodes to pixels: far cheaper." },
  ],
  say: {
    prompt: "Explain how diffusion models are trained and how they generate images.",
    secs: 60,
    check: ["Forward process adds Gaussian noise over T steps (closed form x_t = √ᾱ x₀ + √(1 − ᾱ) ε)", "Network predicts the added noise given x_t and t; MSE loss", "Sampling: start from noise, iteratively denoise; fast samplers", "Latent diffusion in VAE space; text conditioning via cross-attention", "Classifier-free guidance; comparison to GANs/VAEs"],
    followups: [
      { q: "Why predict the noise rather than the clean image?", a: "It's an equivalent reparameterisation that gives a well-scaled target at every noise level and worked better empirically; the clean image can be recovered from the noise estimate." },
      { q: "What is classifier-free guidance?", a: "Train the same model with and without the condition (dropping the prompt sometimes); at sampling, extrapolate ε_u + w(ε_c − ε_u) to follow the prompt more strongly." },
      { q: "Why are diffusion models slow and how is that fixed?", a: "Generation needs many sequential network evaluations. Better ODE solvers (DDIM, DPM-Solver), distillation to few-step models and working in latent space cut the cost." },
    ],
    answer: `Diffusion models define a fixed forward process that gradually adds Gaussian noise to data until it's pure noise; there's a closed form for jumping to any step, x_t equals root ᾱ times x₀ plus root one minus ᾱ times noise. The model, usually a U-Net or transformer conditioned on the timestep, is trained to predict the noise that was added, with a simple squared-error loss, at randomly chosen noise levels.

To generate, you start from random noise and apply the learned denoiser repeatedly, removing predicted noise step by step; modern samplers need 20 to 50 steps. Stable Diffusion-style systems do this in a VAE's latent space for efficiency, condition on text through cross-attention, and use classifier-free guidance, extrapolating between prompted and unprompted predictions, to follow the prompt. Compared with GANs, training is stable and covers the data distribution well; the cost is slower sampling.`,
    avoid: ["“It generates the image in one pass”", "Confusing the fixed forward process with the learned reverse one"],
  },
  terms: [["Forward (noising) process", "Fixed Gaussian corruption over T steps."], ["ᾱ_t", "Product of (1 − β_s): remaining signal fraction."], ["Classifier-free guidance", "ε_u + w(ε_c − ε_u)."], ["Latent diffusion", "Diffusion in a VAE latent space."]],
  sources: [D.ddpm, D.d2l],
});
Q({ id: "dl-dif-1", d: 1, secs: 45, prompt: "ᾱ_t = 0.64, x₀ = 1, ε = 0.5. Noised value x_t?", answer: 1.1, tol: 0.002, explain: "0.8·1 + 0.6·0.5 = 1.1.", py: "import math\nab = 0.64\nanswer = math.sqrt(ab)*1 + math.sqrt(1-ab)*0.5" });
Q({ id: "dl-dif-2", d: 2, secs: 45, prompt: "Constant β = 0.02 for 10 steps. ᾱ₁₀? (3 decimals)", answer: 0.817, tol: 0.002, explain: "0.98¹⁰ = 0.817.", py: "import numpy as np\nanswer = float(np.prod([1-0.02]*10))", packages: ["numpy"] });
Q({ id: "dl-dif-3", d: 1, secs: 30, prompt: "Signal-to-noise ratio ᾱ/(1 − ᾱ) at ᾱ = 0.8?", answer: 4, tol: 0.005, explain: "0.8/0.2 = 4.", py: "answer = 0.8/0.2" });
Q({ id: "dl-dif-4", d: 2, secs: 45, prompt: "Classifier-free guidance: ε_u = 0.2, ε_c = 0.5, w = 3. Guided noise estimate?", answer: 1.1, tol: 0.002, explain: "0.2 + 3(0.5 − 0.2) = 1.1.", py: "eu, ec, w = 0.2, 0.5, 3\nanswer = eu + w*(ec-eu)" });
C("dl-dif-c1", "Diffusion training", "Sample t, ε; x_t = √ᾱ x₀ + √(1 − ᾱ)ε; minimise ‖ε − ε_θ(x_t, t)‖².");
C("dl-dif-c2", "Classifier-free guidance", "ε̂ = ε_u + w(ε_c − ε_u).");

L("dl-contrastive", GM, "Contrastive learning: SimCLR and CLIP", "Learning representations without labels by pulling matching pairs together and pushing others apart.", {
  kind: "concept", mins: 25, prereq: ["dl-embeddings", "dl-augmentation"],
  hook: "CLIP classifies images into categories it was never trained on, just from their names. What training objective makes that possible?",
  intuition: `
**The situation.** Labels are expensive; unlabelled images and image–caption pairs are abundant. Contrastive learning turns "these two things belong together" into a training signal.

**SimCLR (images only).** Take an image, make two random augmentations of it (crop, colour jitter, blur). Encode both. Train so the two views' embeddings are similar to each other and dissimilar to every other image in the batch. The network learns features invariant to the augmentations, i.e. about object content. Linear classifiers on top then work well with few labels.

**CLIP (image + text).** Encode images with one network and their captions with another into the same space. In a batch of $N$ pairs, the $N$ true pairs should score higher than the $N^2 - N$ mismatched pairs, in both directions. Result: a shared space where you can classify zero-shot by embedding prompts like "a photo of a {label}" and picking the closest, and power text–image search.

**Key ingredients.** Large batches (many negatives), strong augmentations (SimCLR), a temperature that sharpens the softmax, normalised embeddings.
`,
  maths: `
**In one breath.** InfoNCE for anchor $i$ with positive $j$: $L_i = -\\log\\dfrac{\\exp(\\text{sim}(z_i, z_j)/\\tau)}{\\sum_{k \\ne i}\\exp(\\text{sim}(z_i, z_k)/\\tau)}$, with cosine similarity and temperature $\\tau$; CLIP applies cross-entropy over the $N \\times N$ similarity matrix along rows and columns.

**Worked example.** Similarities: positive 0.9, negatives 0.1 and 0.2, $\\tau = 0.5$. Scaled logits 1.8, 0.2, 0.4; probability of the positive $= e^{1.8}/(e^{1.8} + e^{0.2} + e^{0.4}) = 0.690$; loss $= 0.371$.

**Counting.** SimCLR with batch $N = 256$ images makes $2N = 512$ views; each anchor has 1 positive and $2N - 2 = 510$ negatives. CLIP with $N = 32{,}768$ pairs computes $N^2 \\approx 1.07$ billion similarities per step.

**Temperature.** Smaller $\\tau$ sharpens the distribution, focusing on hard negatives; too small makes training unstable. CLIP learns $\\tau$.

| Method | Pairs | Negatives | Output |
|---|---|---|---|
| SimCLR | two augmentations of one image | other images in batch | image encoder |
| MoCo | same | queue of past embeddings | image encoder (smaller batches) |
| CLIP | image–caption | other pairs in batch | aligned image + text encoders |
| BYOL / DINO | augmentations | none (self-distillation) | image encoder |
`,
  practice: `
**Where used.** Pretrained visual backbones, zero-shot classification and retrieval (CLIP), the text encoder for diffusion models, embedding models for RAG (contrastively fine-tuned sentence encoders), recommendation two-tower models (in-batch negatives).

**Pitfalls.** False negatives in the batch (two captions describing similar images) and dataset biases inherited by zero-shot classifiers.
`,
  traps: [
    { trap: "Contrastive learning needs labels to define positives.", why: "Positives come from the data itself: two augmentations of one image, or an image and its caption. That's what makes it self-supervised." },
    { trap: "Batch size is just a speed setting here.", why: "In-batch methods use other batch items as negatives; larger batches give more (and harder) negatives and usually better representations." },
    { trap: "CLIP's zero-shot accuracy means it understands images like humans.", why: "It matches images to text patterns seen in web data; prompt wording matters a lot, and it fails on counting, fine-grained or out-of-distribution concepts." },
  ],
  say: {
    prompt: "How does contrastive learning work, and how does CLIP enable zero-shot classification?",
    secs: 60,
    check: ["Positives from the data (augmented views / image–caption pairs), negatives from the batch", "InfoNCE: softmax over similarities with temperature", "SimCLR augmentations → invariant features; big batches", "CLIP: image and text encoders in one space; symmetric loss over N×N matrix", "Zero-shot: embed 'a photo of a {label}' prompts, pick nearest"],
    followups: [
      { q: "What does the temperature do in InfoNCE?", a: "It scales similarities before the softmax: lower temperature sharpens the distribution, emphasising hard negatives; too low destabilises training. CLIP learns it." },
      { q: "Why does SimCLR depend so much on augmentation?", a: "The model learns whatever is shared between the two views; augmentations define what it should be invariant to (crop position, colour). Weak augmentations let it cheat on low-level cues." },
      { q: "How do BYOL/DINO avoid needing negatives?", a: "A student network predicts the output of a slowly updated teacher (momentum copy) for another view; architectural asymmetry and the moving-average teacher prevent collapse." },
    ],
    answer: `Contrastive learning trains an encoder so that matching pairs end up close in embedding space and non-matching ones far apart, without labels: the pairs come from the data. In SimCLR, the two members of a pair are different augmentations of the same image, and every other image in the batch is a negative; the InfoNCE loss is a softmax over cosine similarities divided by a temperature, so it's like classifying which item in the batch is your partner. The model learns features invariant to the augmentations, and large batches help because they supply more negatives.

CLIP applies the same idea across modalities: an image encoder and a text encoder trained on hundreds of millions of image–caption pairs so that, in each batch, true pairs outscore all mismatched ones in both directions. Because images and text share one space, you can classify zero-shot by embedding prompts like "a photo of a dog" for each class and picking the class whose text is closest to the image.`,
    avoid: ["“It needs labelled positives”", "Ignoring temperature/batch size"],
  },
  terms: [["InfoNCE", "Softmax cross-entropy picking the positive among negatives."], ["Temperature τ", "Scales similarities before softmax."], ["Zero-shot classification", "Classify by similarity to text prompts of class names."], ["In-batch negatives", "Other examples in the batch used as negatives."]],
  sources: [D.simclr, D.clip],
});
Q({ id: "dl-con-1", d: 2, secs: 60, prompt: "InfoNCE with similarities: positive 0.9, negatives 0.1 and 0.2, τ = 0.5. Loss? (3 decimals)", answer: 0.371, tol: 0.002, explain: "Logits 1.8, 0.2, 0.4; p = e^1.8/(e^1.8 + e^0.2 + e^0.4) = 0.690; −ln 0.690 = 0.371.", py: "import numpy as np\ns = np.array([0.9,0.1,0.2])/0.5\nanswer = float(-np.log(np.exp(s[0])/np.exp(s).sum()))", packages: ["numpy"] });
Q({ id: "dl-con-2", d: 1, secs: 30, prompt: "SimCLR with 256 images per batch (two views each). Negatives per anchor?", answer: 510, tol: 0.5, explain: "2N − 2 = 510.", py: "N = 256\nanswer = 2*N - 2" });
Q({ id: "dl-con-3", d: 1, secs: 30, prompt: "CLIP batch of 32,768 pairs. Similarities computed per step, in billions? (2 decimals)", answer: 1.07, tol: 0.01, explain: "32,768² ≈ 1.07 × 10⁹.", py: "answer = 32768**2/1e9" });
Q({ id: "dl-con-4", d: 2, secs: 60, prompt: "Same similarities as the first question but τ = 0.1. Loss? (4 decimals)", answer: 0.0012, tol: 0.0002, explain: "Logits 9, 1, 2: the positive dominates; −ln(e⁹/(e⁹ + e + e²)) ≈ 0.0012. Lower temperature sharpens the softmax.", py: "import numpy as np\ns = np.array([0.9,0.1,0.2])/0.1\nanswer = float(-np.log(np.exp(s[0])/np.exp(s).sum()))", packages: ["numpy"] });
C("dl-con-c1", "InfoNCE", "−log(exp(sim⁺/τ)/Σ exp(sim/τ)); negatives from the batch.");
C("dl-con-c2", "CLIP zero-shot", "Embed 'a photo of a {class}' for each class; pick the nearest to the image embedding.");

L("dl-gen-practice", GM, "Generative models practice", "Six interview scenarios on embeddings, VAEs, GANs, diffusion and contrastive learning.", {
  kind: "interview", mins: 30, prereq: ["dl-embeddings", "dl-vae", "dl-gans", "dl-diffusion", "dl-contrastive"],
  hook: "Answer each scenario out loud in about a minute, then open it and tick off the points the interviewer is listening for.",
}, [
  iq("Compare VAEs, GANs and diffusion models.", "VAE: encoder–decoder trained on the ELBO, stable, smooth latent space, blurrier samples. GAN: generator vs discriminator, sharp samples in one step but unstable training and mode collapse. Diffusion: learn to denoise over many steps, stable and diverse with top quality, but slow sampling (mitigated by fewer-step samplers, latent diffusion, distillation).", ["VAE: ELBO, smooth latent, blurry", "GAN: adversarial, sharp, unstable/mode collapse", "Diffusion: denoising, quality/diversity, slow", "Speed/quality trade-offs"]),
  iq("Build a product image search where users type text queries.", "Use a CLIP-style dual encoder: embed catalogue images offline, normalise, store in an ANN index; embed the text query at runtime and retrieve nearest neighbours; optionally rerank with a cross-encoder or business signals; fine-tune contrastively on query–click pairs; evaluate recall@k and click-through.", ["Dual encoder (CLIP)", "Offline embeddings + ANN index", "Reranking", "Domain fine-tuning with clicks", "Metrics"]),
  iq("How would you detect fraudulent transactions with no fraud labels, using deep learning?", "Train an autoencoder (or VAE) on normal transactions; score new ones by reconstruction error (or ELBO); calibrate a threshold on a small reviewed sample; combine with rules and feedback loops to collect labels; monitor drift. Compare with isolation forest.", ["Autoencoder on normal data", "Reconstruction-error scoring", "Threshold calibration with review", "Feedback loop / drift", "Classical baseline"]),
  iq("Your diffusion model ignores parts of the prompt. What knobs do you try?", "Raise classifier-free guidance scale (watch for artefacts), improve prompt phrasing/negative prompts, more sampling steps or a better sampler, use a stronger text encoder or fine-tune on similar captions, check training captions' quality.", ["Guidance scale trade-off", "Prompting / negative prompts", "Sampler / steps", "Text encoder / data quality"]),
  iq("Explain the reparameterisation trick and why it's needed.", "Sampling z ~ N(μ, σ²) is not differentiable with respect to μ and σ. Writing z = μ + σε with ε ~ N(0, 1) moves the randomness to an input, so z is a deterministic, differentiable function of μ and σ and backprop works.", ["Sampling isn't differentiable", "z = μ + σε", "Gradients flow to μ, σ"]),
  iq("Why do contrastive methods use large batches, and what if you can't afford them?", "In-batch negatives: bigger batches give more and harder negatives, which improves representations. Alternatives: a memory queue of past embeddings (MoCo), hard-negative mining, or negative-free methods like BYOL/DINO; gradient caching techniques for dual encoders.", ["More/harder negatives", "MoCo queue", "Negative-free methods", "Hard-negative mining"]),
]);
