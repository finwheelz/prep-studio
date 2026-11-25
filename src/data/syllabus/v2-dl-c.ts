/**
 * v2 Deep learning, part C: CNNs · Sequence models.
 */
import { iq, lessonWriter } from "./v2-shared";
import { D } from "./v2-dl-sources";

const { L, Q, C } = lessonWriter("dl");
const CN = "CNNs";
const SQ = "Sequence models";

// ───────────────────────── CNNs ─────────────────────────

L("dl-conv", CN, "Convolution and receptive field", "Local filters with shared weights: why convolutions suit images, and how far each unit can 'see'.", {
  kind: "concept", mins: 25, prereq: ["dl-mlp"],
  hook: "A 224×224 colour image fed to one dense layer of 1,000 units needs 150 million weights. A conv layer does better with under 2,000. What is it assuming?",
  intuition: `
**The situation.** Images have structure a dense layer ignores: nearby pixels are related, and a pattern (an edge, an eye) means the same thing wherever it appears.

**The idea.** A **filter** (kernel) is a small grid of weights, say 3×3 across all input channels. Slide it over the image; at each position take the dot product with the patch underneath. The result is a **feature map** showing where that pattern appears. A conv layer learns many filters, producing many output channels.

Two assumptions make this efficient:

- **Local connectivity:** each output looks only at a small neighbourhood.
- **Weight sharing:** the same filter is used at every position, so the number of weights doesn't depend on image size.

Together they give **translation equivariance**: shift the input and the feature map shifts the same way. Pooling or global averaging later adds (approximate) invariance.

**Receptive field.** Stacking layers lets deeper units see larger areas: two 3×3 layers see 5×5 of the input, three see 7×7, with fewer parameters and more non-linearity than one 7×7 filter.
`,
  maths: `
**In one breath.** $y_{c'}(i, j) = b_{c'} + \\sum_{c}\\sum_{u, v} W_{c', c}(u, v)\\,x_c(i + u, j + v)$; parameters $(k^2C_{in} + 1)C_{out}$; receptive field of $n$ stacked $k \\times k$ stride-1 layers $= n(k - 1) + 1$.

**Worked examples.**

- 5×5 conv, 3 → 16 channels: $(25 \\times 3 + 1) \\times 16 = 1{,}216$ parameters.
- Three stacked 3×3 layers: receptive field $3 \\times 2 + 1 = 7$. With 64 channels throughout: $3 \\times 9 \\times 64^2 = 110{,}592$ weights vs one 7×7 layer's $49 \\times 64^2 = 200{,}704$.
- A 2×2 input patch $\\begin{pmatrix}1 & 2\\\\3 & 4\\end{pmatrix}$ with kernel $\\begin{pmatrix}1 & 0\\\\0 & -1\\end{pmatrix}$: $1 - 4 = -3$ (a diagonal-difference detector).

**Strided and dilated convolutions** grow the receptive field faster: stride skips positions (downsampling), dilation spaces the kernel taps apart without extra weights.

**Convolution vs cross-correlation.** Deep learning "convolution" doesn't flip the kernel (it's cross-correlation); since kernels are learned, it doesn't matter.

| | Dense layer | Conv layer |
|---|---|---|
| Connectivity | every input | local patch |
| Weights | per input-output pair | shared across positions |
| Parameters depend on image size | yes | no |
| Built-in prior | none | locality, translation equivariance |
`,
  practice: `
**Defaults.** 3×3 kernels, padding "same", channels doubling as spatial size halves (64 → 128 → 256 …), BatchNorm + ReLU after each conv, global average pooling before the classifier.

**Beyond images.** 1-D convolutions for audio, sensor and time series; text CNNs; convolutions inside some speech and vision transformers.
`,
  traps: [
    { trap: "CNNs are translation invariant.", why: "Convolution is translation equivariant (features move with the input). Invariance comes partly from pooling and global averaging, and strides/padding break it slightly." },
    { trap: "Bigger kernels see more, so use 7×7 everywhere.", why: "Stacked 3×3 layers reach the same receptive field with fewer parameters and more non-linearities. Large kernels are used sparingly (first layer, some modern designs)." },
    { trap: "A conv layer's parameter count grows with image resolution.", why: "Parameters depend on kernel size and channels only; compute and activation memory grow with resolution." },
  ],
  say: {
    prompt: "Why do convolutional layers work well on images?",
    secs: 45,
    check: ["Local connectivity + weight sharing → few parameters", "Filters detect patterns anywhere; feature maps", "Translation equivariance (invariance via pooling)", "Receptive field grows with depth; stacked 3×3", "Parameter count formula independent of image size"],
    followups: [
      { q: "What's the receptive field of four stacked 3×3 stride-1 convolutions?", a: "4 × 2 + 1 = 9 pixels on each side: 9×9." },
      { q: "Equivariance vs invariance?", a: "Equivariant: shifting the input shifts the output the same way (convolution). Invariant: the output doesn't change (e.g. after global pooling, the class prediction)." },
      { q: "How do you enlarge the receptive field without more parameters?", a: "Strided convolutions or pooling (downsampling), and dilated convolutions, which space kernel taps apart." },
    ],
    answer: `Images have local structure and the same patterns appear in different places. A convolutional layer exploits both: each output looks only at a small patch, and the same small filter is slid across the whole image, so a 3×3 filter needs nine weights per input channel however big the image is, and finds its pattern wherever it occurs. The output is a feature map that moves when the input moves, which is translation equivariance; pooling and global averaging then make the final prediction largely invariant to position.

Stacking layers grows the receptive field: three 3×3 layers see a 7×7 region with fewer parameters and more non-linearity than a single 7×7 filter, so deeper layers detect larger, more abstract patterns, edges into textures into parts into objects.`,
    avoid: ["“CNNs are translation invariant” without qualification", "“More pixels means more parameters”"],
  },
  terms: [["Filter / kernel", "Small learned weight grid slid over the input."], ["Feature map", "Output of one filter across positions."], ["Receptive field", "Input region that affects a unit."], ["Weight sharing", "Same filter used at every position."]],
  sources: [D.csCNN, D.d2l],
});
Q({ id: "dl-conv-1", d: 1, secs: 30, prompt: "Parameters in a 5×5 conv layer from 3 to 16 channels, with bias?", answer: 1216, tol: 0.5, explain: "(25·3 + 1)·16 = 1,216.", py: "answer = (5*5*3+1)*16" });
Q({ id: "dl-conv-2", d: 1, secs: 30, prompt: "Receptive field (side length) of three stacked 3×3 stride-1 convolutions?", answer: 7, tol: 0.5, explain: "3 × (3 − 1) + 1 = 7.", py: "r = 1\nfor _ in range(3):\n    r += 3 - 1\nanswer = r" });
Q({ id: "dl-conv-3", d: 2, secs: 60, prompt: "Valid cross-correlation of input [[1, 2, 0], [3, 4, 1], [0, 1, 2]] with kernel [[1, 0], [0, −1]]. Top-left output value?", answer: -3, tol: 0.005, explain: "1·1 + 2·0 + 3·0 + 4·(−1) = −3.", py: "import numpy as np\nfrom scipy.signal import correlate2d\nx = np.array([[1,2,0],[3,4,1],[0,1,2.]]); k = np.array([[1,0],[0,-1.]])\nanswer = float(correlate2d(x, k, mode='valid')[0,0])", packages: ["numpy", "scipy"] });
Q({ id: "dl-conv-4", d: 2, secs: 60, prompt: "Weights (no bias) in three stacked 3×3 conv layers, 64 channels in and out each?", answer: 110592, tol: 0.5, explain: "3 × 9 × 64 × 64 = 110,592, versus 200,704 for one 7×7 layer with the same receptive field.", py: "answer = 3*9*64*64" });
C("dl-conv-c1", "Conv parameters", "(k²·C_in + 1)·C_out, independent of image size.");
C("dl-conv-c2", "Receptive field", "n stacked k×k stride-1 layers: n(k − 1) + 1.");

L("dl-cnn-shapes", CN, "Padding, stride, pooling and output shapes", "Computing tensor shapes through a CNN, pooling, and 1×1 convolutions.", {
  kind: "concept", mins: 20, prereq: ["dl-conv"],
  hook: "Your model crashes with 'mat1 and mat2 shapes cannot be multiplied (32×12544 and 4096×10)'. Where did 12,544 come from?",
  intuition: `
**The situation.** Half of CNN bugs are shape bugs. Interviewers ask you to compute output sizes by hand.

**The idea.** Three knobs set the output size of a conv or pooling layer:

- **Padding $P$:** zeros added around the border so edge pixels get processed and the size can be preserved ("same" padding: $P = (F - 1)/2$ for odd $F$ at stride 1).
- **Stride $S$:** how far the filter moves each step; stride 2 halves the size.
- **Filter size $F$.**

**Pooling** downsamples each channel independently: max pooling keeps the strongest response in each window (some robustness to small shifts); average pooling smooths. **Global average pooling** collapses each channel to one number, so the classifier works for any input size and has few parameters.

**1×1 convolutions** mix channels at each pixel without looking at neighbours: cheap channel reduction or expansion (bottlenecks, Inception, MobileNet).
`,
  maths: `
**In one breath.** $W_{out} = \\left\\lfloor \\dfrac{W - F + 2P}{S} \\right\\rfloor + 1$, same for height; channels out = number of filters; pooling has no parameters.

**Worked examples.**

- 224 input, $F = 7$, $S = 2$, $P = 3$: $\\lfloor(224 - 7 + 6)/2\\rfloor + 1 = 112$ (ResNet stem).
- 32 input, $F = 3$, $S = 1$, $P = 1$: 32 ("same").
- 2×2 max pool, stride 2, on 56: 28.
- 1×1 conv 256 → 64 with bias: $256 \\times 64 + 64 = 16{,}448$ parameters.
- The error above: a 7×7×256 feature map flattened is $7 \\times 7 \\times 256 = 12{,}544$ features, but the dense layer expected 4,096.

**Tracing a small network.** 32×32×3 → conv 3×3, 32 filters, same → 32×32×32 → max pool 2 → 16×16×32 → conv 3×3, 64, same → 16×16×64 → pool → 8×8×64 → flatten 4,096 → dense 10.

| Layer | Changes H, W | Changes channels | Parameters |
|---|---|---|---|
| Conv (stride 1, same) | no | yes | yes |
| Conv stride 2 | halves | yes | yes |
| Max / avg pool | downsamples | no | no |
| 1×1 conv | no | yes | yes (cheap) |
| Global average pool | → 1×1 | no | no |
`,
  practice: `
**Avoid hard-coded flatten sizes.** Use global average pooling or \`nn.AdaptiveAvgPool2d(1)\` before the classifier, or compute the size with a dummy forward pass.

**Modern trend.** Strided convolutions instead of pooling for downsampling; global average pooling instead of large dense heads (fewer parameters, less overfitting).
`,
  traps: [
    { trap: "Pooling layers have learnable weights.", why: "Max and average pooling have no parameters; they're fixed operations. Only their window and stride are settings." },
    { trap: "Padding just keeps the size the same, so it doesn't matter.", why: "Without padding, every layer shrinks the map and border pixels contribute to fewer outputs. Padding preserves size and edge information." },
    { trap: "Flatten → big dense layer is the standard classifier head.", why: "That was the AlexNet/VGG pattern and holds most of their parameters. Modern CNNs use global average pooling and one small linear layer." },
  ],
  say: {
    prompt: "How do padding, stride and pooling affect a CNN, and how do you compute output shapes?",
    secs: 45,
    check: ["Formula (W − F + 2P)/S + 1", "'Same' padding preserves size; stride downsamples", "Pooling: max vs average, no parameters, downsampling", "1×1 conv for channel mixing / bottlenecks", "Global average pooling for classifier heads"],
    followups: [
      { q: "What does a 1×1 convolution do?", a: "A per-pixel linear map across channels (a small dense layer applied at every position). Used to reduce or expand channels cheaply and to add non-linearity." },
      { q: "Why global average pooling instead of flatten + dense?", a: "Far fewer parameters (less overfitting), works for any input resolution, and each channel acts as a class-evidence map." },
      { q: "Output size for 64×64 input, 5×5 filter, stride 1, no padding?", a: "(64 − 5)/1 + 1 = 60." },
    ],
    answer: `Each conv or pooling layer's output width is (W − F + 2P)/S + 1, and the number of output channels equals the number of filters. Padding adds zeros around the border so edge pixels are used and, with P = (F − 1)/2 at stride 1, the size is preserved. Stride greater than 1 skips positions and downsamples.

Pooling downsamples each channel with a fixed operation, max or average, and has no parameters; max pooling also adds a little robustness to small shifts. 1×1 convolutions mix channels at each pixel and are the cheap way to shrink or grow channel counts, and global average pooling at the end turns each channel into one number, so the classifier is small and the network accepts any input size.`,
    avoid: ["Saying pooling layers learn weights", "Hard-coding flatten sizes"],
  },
  terms: [["Padding", "Zeros around the border."], ["Stride", "Step size of the sliding window."], ["Global average pooling", "Average each channel to one value."], ["1×1 convolution", "Per-pixel linear mix of channels."]],
  sources: [D.csCNN],
});
Q({ id: "dl-shp-1", d: 1, secs: 45, prompt: "Input 224×224, conv F = 7, stride 2, padding 3. Output width?", answer: 112, tol: 0.5, explain: "⌊(224 − 7 + 6)/2⌋ + 1 = 112.", py: "answer = (224 - 7 + 2*3)//2 + 1" });
Q({ id: "dl-shp-2", d: 1, secs: 30, prompt: "Parameters in a 1×1 conv from 256 to 64 channels, with bias?", answer: 16448, tol: 0.5, explain: "256·64 + 64 = 16,448.", py: "answer = 256*64 + 64" });
Q({ id: "dl-shp-3", d: 2, secs: 60, prompt: "32×32×3 → conv 3×3 (32, same) → maxpool 2 → conv 3×3 (64, same) → maxpool 2 → flatten. Flattened length?", answer: 4096, tol: 0.5, explain: "32 → 16 → 8 spatially, 64 channels: 8 × 8 × 64 = 4,096.", py: "s = 32\ns = (s - 3 + 2)//1 + 1; s = s//2\ns = (s - 3 + 2)//1 + 1; s = s//2\nanswer = s*s*64" });
Q({ id: "dl-shp-4", d: 1, secs: 30, prompt: "Output width for 64-wide input, 5×5 filter, stride 1, no padding?", answer: 60, tol: 0.5, explain: "(64 − 5)/1 + 1 = 60.", py: "answer = (64-5)//1 + 1" });
C("dl-shp-c1", "Output size", "⌊(W − F + 2P)/S⌋ + 1.");

L("dl-resnet", CN, "ResNets and skip connections", "Residual learning, bottleneck blocks, and why very deep networks became trainable.", {
  kind: "concept", mins: 20, prereq: ["dl-vanishing", "dl-conv"],
  hook: "A 56-layer plain CNN has higher training error than a 20-layer one. It should at least be able to copy the 20-layer net and add identity layers. Why can't it?",
  intuition: `
**The situation (degradation).** Adding layers to a plain network beyond ~20 made *training* error go up. Not overfitting: the optimiser simply couldn't find good weights. Even learning "do nothing" (identity) with a stack of conv + ReLU layers is hard.

**The idea.** Make each block learn a **correction** to its input instead of a whole new representation: $y = x + F(x)$. If identity is best, the block just pushes $F$ to zero, which is easy. The **skip connection** also gives gradients a direct path backwards, so they don't vanish through depth.

This one change made 50-, 101- and 152-layer networks train well, won ImageNet 2015, and the same pattern (residual stream + sub-layer) is the backbone of every transformer.

**Bottleneck block.** For deep ResNets, each block uses 1×1 (reduce channels) → 3×3 (process) → 1×1 (expand back), which is much cheaper than two full-width 3×3 convolutions.
`,
  maths: `
**In one breath.** $y = x + F(x; W)$, $\\dfrac{\\partial y}{\\partial x} = I + \\dfrac{\\partial F}{\\partial x}$; when shapes differ, use a projection shortcut $y = W_sx + F(x)$ (1×1 conv, stride 2).

**Gradient path.** If $\\partial F/\\partial x$ is tiny (say 0.01), a plain layer passes 0.01 of the gradient; a residual block passes $1.01$. Over 50 blocks, the identity terms keep the gradient alive.

**Worked example (bottleneck parameters, no bias).** 256 channels: 1×1 256→64 ($16{,}384$) + 3×3 64→64 ($36{,}864$) + 1×1 64→256 ($16{,}384$) = $69{,}632$. Two 3×3 256→256 convs: $2 \\times 589{,}824 = 1{,}179{,}648$, about 17× more.

**Ensemble view.** A ResNet behaves somewhat like an ensemble of many shallower paths (each block is either taken or skipped); deleting one block hurts only slightly.

| Block | Layers | Use |
|---|---|---|
| Basic | 3×3 → 3×3, + skip | ResNet-18/34 |
| Bottleneck | 1×1 → 3×3 → 1×1, + skip | ResNet-50/101/152 |
| Pre-activation | BN-ReLU-conv, + skip | very deep variants |
| Transformer residual | x + Attention(Norm(x)), x + MLP(Norm(x)) | every transformer layer |
`,
  practice: `
**Defaults.** ResNet-50 is still a strong, well-understood vision baseline and a common pretrained backbone. Zero-initialise the last BatchNorm γ in each residual branch so blocks start as identity.

**Recognise residuals everywhere.** U-Net skips (concatenation rather than addition), DenseNet (concatenate all previous layers), transformers (residual stream).
`,
  traps: [
    { trap: "Deeper plain networks failed because they overfit.", why: "Their training error was higher too. It was an optimisation problem (degradation), which residual connections fix." },
    { trap: "Skip connections just add the input to the output, so they don't change what the block can represent.", why: "They change what's easy to learn: identity becomes the default and gradients flow directly. Representation capacity is similar; trainability is far better." },
    { trap: "U-Net skips and ResNet skips are the same.", why: "ResNet adds the input to the block output (same shape). U-Net concatenates encoder features with decoder features to recover spatial detail." },
  ],
  say: {
    prompt: "What problem do residual connections solve, and how?",
    secs: 45,
    check: ["Degradation: deeper plain nets had higher training error (optimisation, not overfitting)", "y = x + F(x): learn a residual; identity is easy", "Gradient ∂y/∂x = I + ∂F/∂x keeps gradients flowing", "Projection shortcuts when shapes change; bottleneck blocks", "Same pattern in transformers"],
    followups: [
      { q: "What's a bottleneck block and why use it?", a: "1×1 to reduce channels, 3×3 on the reduced width, 1×1 to restore: much cheaper than full-width 3×3 convolutions, enabling 50+ layer ResNets." },
      { q: "What happens when the shortcut's shape doesn't match?", a: "Use a projection shortcut (1×1 conv with stride) to match channels and spatial size, or zero-pad channels." },
      { q: "Why zero-initialise the last BN in a residual branch?", a: "So F(x) starts at 0 and each block is initially the identity: the deep network starts as a shallow one and training is more stable." },
    ],
    answer: `Before ResNets, plain networks deeper than about twenty layers had higher training error than shallower ones, the degradation problem. That's an optimisation failure, not overfitting: a deeper net could in principle copy the shallower one plus identity layers, but gradient descent couldn't find that solution.

A residual block computes x plus F of x, so it only has to learn a correction, and if the identity is best it just drives F towards zero. The skip connection also means the Jacobian is the identity plus the branch's Jacobian, so gradients reach early layers without vanishing. Projection shortcuts handle shape changes, bottleneck blocks keep deep ResNets cheap, and the same residual stream idea is in every transformer layer.`,
    avoid: ["“Deep plain nets overfit”", "Confusing addition skips with concatenation skips"],
  },
  terms: [["Residual block", "y = x + F(x)."], ["Degradation problem", "Deeper plain nets train worse."], ["Projection shortcut", "1×1 conv on the skip to match shapes."], ["Bottleneck", "1×1 → 3×3 → 1×1 block."]],
  sources: [D.resnet, D.csCNN],
});
Q({ id: "dl-res-1", d: 2, secs: 60, prompt: "Bottleneck block on 256 channels (1×1 256→64, 3×3 64→64, 1×1 64→256), weights only. Total?", answer: 69632, tol: 0.5, explain: "16,384 + 36,864 + 16,384 = 69,632.", py: "answer = 256*64 + 9*64*64 + 64*256" });
Q({ id: "dl-res-2", d: 1, secs: 30, prompt: "y = x + F(x) where ∂F/∂x = 0.01 (scalar). ∂y/∂x?", answer: 1.01, tol: 0.002, explain: "1 + 0.01: the identity path carries the gradient.", py: "h = 1e-6\nF = lambda x: 0.01*x\ny = lambda x: x + F(x)\nanswer = (y(1+h)-y(1-h))/(2*h)" });
Q({ id: "dl-res-3", d: 2, secs: 60, prompt: "50 blocks each scale the gradient by their branch Jacobian 0.9 (plain) versus 1 + 0.9 ≥ 1 never shrinks (residual, simplified). Plain-network gradient factor? (4 decimals)", answer: 0.0052, tol: 0.0002, explain: "0.9⁵⁰ = 0.0052 for the plain stack.", py: "answer = 0.9**50" });
Q({ id: "dl-res-4", d: 1, secs: 30, prompt: "A 56-layer plain net has higher TRAINING error than a 20-layer one. This is…", options: ["overfitting", "the degradation (optimisation) problem", "label noise", "data leakage"], answer: 1, explain: "Higher training error points to optimisation, not overfitting.", py: "answer = 1" });
C("dl-res-c1", "Residual gradient", "∂(x + F(x))/∂x = I + ∂F/∂x: identity path keeps gradients alive.");

L("dl-cnn-architectures", CN, "CNN architectures: from AlexNet to ConvNeXt", "The ideas each landmark network introduced, and efficient designs for mobile.", {
  kind: "concept", mins: 20, prereq: ["dl-resnet", "dl-cnn-shapes"],
  hook: "Name one idea each from AlexNet, VGG, Inception, ResNet and MobileNet that's still used today.",
  intuition: `
**The situation.** Interviewers like the history because each architecture added one reusable idea.

- **LeNet (1998):** conv → pool → conv → pool → dense; the template.
- **AlexNet (2012):** the same idea at scale on GPUs with ReLU, dropout and data augmentation; started the deep learning boom on ImageNet.
- **VGG (2014):** only 3×3 convolutions, stacked deep; simple and uniform, but heavy (most parameters in the dense head).
- **Inception/GoogLeNet (2014):** parallel branches with different kernel sizes, 1×1 bottlenecks to keep it cheap, global average pooling.
- **ResNet (2015):** residual connections; depth 50–152 trains reliably.
- **MobileNet / EfficientNet (2017–19):** depthwise separable convolutions for efficiency; compound scaling of depth, width and resolution together.
- **ConvNeXt (2022):** a ResNet modernised with transformer-era choices (larger kernels, LayerNorm, GELU, fewer activations); matches vision transformers.
`,
  maths: `
**In one breath.** Depthwise separable conv = per-channel $k \\times k$ (depthwise, $k^2C_{in}$ weights) + 1×1 pointwise ($C_{in}C_{out}$); cost ratio vs standard ≈ $1/C_{out} + 1/k^2$.

**Worked example.** 3×3, 64 → 128 channels, no bias. Standard: $9 \\times 64 \\times 128 = 73{,}728$. Depthwise separable: $9 \\times 64 + 64 \\times 128 = 576 + 8{,}192 = 8{,}768$, about 12% of the standard cost.

**Compound scaling (EfficientNet).** FLOPs grow roughly with depth × width² × resolution². Doubling width alone ≈ 4× FLOPs; scaling all three moderately gives better accuracy per FLOP than pushing one.

| Network | Key idea | Still used for |
|---|---|---|
| AlexNet | ReLU + GPU + dropout at scale | history |
| VGG | stacks of 3×3 | perceptual losses, teaching |
| Inception | multi-branch, 1×1 bottlenecks | ideas in many designs |
| ResNet | residual connections | default backbone |
| MobileNet | depthwise separable convs | mobile / edge |
| EfficientNet | compound scaling | accuracy/compute trade-offs |
| ConvNeXt | modernised ResNet | strong CNN baseline vs ViT |
`,
  practice: `
**Choosing a backbone.** ResNet-50 or ConvNeXt-T for a solid general baseline; EfficientNet/MobileNet for latency or edge devices; a ViT when data or pretraining scale is large. Always start from pretrained weights.

**Measure what matters.** Parameters ≠ latency: depthwise convs have few FLOPs but can be memory-bound on GPUs. Benchmark on target hardware.
`,
  traps: [
    { trap: "VGG is efficient because it only uses small 3×3 filters.", why: "Its 3×3 stacks are parameter-efficient per receptive field, but VGG-16 has ~138M parameters, mostly in its huge dense layers, and is slow. Efficiency came later (Inception, ResNet, MobileNet)." },
    { trap: "Fewer FLOPs always means faster inference.", why: "Depthwise convolutions have low arithmetic intensity and can be memory-bound; actual latency depends on hardware and kernels." },
    { trap: "CNNs are obsolete since vision transformers.", why: "Modern CNNs (ConvNeXt, EfficientNet) match ViTs at similar compute, train well on less data, and dominate edge deployment." },
  ],
  say: {
    prompt: "Walk me through the key CNN architectures and what each contributed.",
    secs: 60,
    check: ["AlexNet: ReLU, GPUs, dropout/augmentation at scale", "VGG: uniform 3×3 stacks; heavy dense head", "Inception: multi-branch + 1×1 bottlenecks + global pooling", "ResNet: residual connections for depth", "MobileNet/EfficientNet: depthwise separable + compound scaling; ConvNeXt modernisation"],
    followups: [
      { q: "What is a depthwise separable convolution?", a: "A k×k convolution applied to each channel separately (depthwise), followed by a 1×1 convolution to mix channels (pointwise). Cuts parameters and FLOPs by roughly k² for wide layers." },
      { q: "What did ConvNeXt change?", a: "It modernised ResNet with design choices from transformers: patchify stem, larger depthwise kernels, inverted bottlenecks, LayerNorm, GELU and fewer normalisation/activation layers, matching Swin transformers." },
      { q: "Why scale depth, width and resolution together?", a: "Each saturates on its own; balancing them gives more accuracy per FLOP (EfficientNet's compound scaling)." },
    ],
    answer: `AlexNet showed that a convolutional net trained on GPUs with ReLU, dropout and augmentation could win ImageNet by a wide margin. VGG showed that depth matters, using only stacked 3×3 convolutions, though its dense head made it huge. Inception used parallel branches with 1×1 bottlenecks and global average pooling to get depth cheaply. ResNet added residual connections, making 50 to 150 layers trainable, and is still the default backbone.

For efficiency, MobileNet introduced depthwise separable convolutions, roughly a k-squared reduction in cost, and EfficientNet scaled depth, width and resolution together. ConvNeXt then modernised ResNet with transformer-era design choices and showed CNNs can match vision transformers at similar compute.`,
    avoid: ["Claiming CNNs are obsolete", "Equating parameter count with latency"],
  },
  terms: [["Depthwise separable conv", "Per-channel spatial conv + 1×1 channel mix."], ["Compound scaling", "Scale depth, width, resolution together."], ["Backbone", "Pretrained feature extractor reused for tasks."]],
  sources: [D.csCNN, D.resnet, D.d2l],
});
Q({ id: "dl-arch-1", d: 2, secs: 60, prompt: "Depthwise separable 3×3 conv, 64 → 128 channels, no bias. Parameters?", answer: 8768, tol: 0.5, explain: "Depthwise 9·64 = 576, pointwise 64·128 = 8,192; total 8,768.", py: "answer = 9*64 + 64*128" });
Q({ id: "dl-arch-2", d: 2, secs: 60, prompt: "Same layer as a standard 3×3 conv (73,728 weights). Ratio separable/standard? (3 decimals)", answer: 0.119, tol: 0.002, explain: "8,768/73,728 = 0.119 ≈ 1/128 + 1/9.", py: "answer = (9*64 + 64*128)/(9*64*128)" });
Q({ id: "dl-arch-3", d: 1, secs: 30, prompt: "Conv FLOPs scale roughly with width². Doubling every layer's channel count multiplies FLOPs by about?", answer: 4, tol: 0.05, explain: "Each layer's FLOPs ∝ C_in·C_out, both doubled.", py: "answer = 2*2" });
Q({ id: "dl-arch-4", d: 1, secs: 30, prompt: "Which architecture introduced residual (skip) connections for image classification?", options: ["VGG", "Inception", "ResNet", "AlexNet"], answer: 2, explain: "He et al., 2015.", py: "answer = 2" });
C("dl-arch-c1", "One idea each", "AlexNet: GPU+ReLU. VGG: 3×3 stacks. Inception: 1×1 bottlenecks. ResNet: skips. MobileNet: depthwise separable.");

L("dl-transfer", CN, "Transfer learning and fine-tuning", "Reusing pretrained networks: feature extraction vs fine-tuning, learning rates, and pitfalls.", {
  kind: "concept", mins: 20, prereq: ["dl-cnn-architectures"],
  hook: "You have 2,000 labelled X-ray images. Training a ResNet from scratch reaches 70%. What gets you to 90% in an afternoon?",
  intuition: `
**The situation.** Big models need big data. Most real projects have thousands, not millions, of labelled examples.

**The idea.** A network pretrained on a large dataset (ImageNet, or a big self-supervised corpus) has already learned general features: early layers detect edges and textures, later ones object parts. Reuse them:

- **Feature extraction:** freeze the pretrained backbone, replace the head, train only the head. Fast, little data needed, good when your images resemble the pretraining data.
- **Fine-tuning:** start from the pretrained weights and update some or all layers with a small learning rate. Better when you have more data or your domain differs (medical images, satellite).

Early layers are the most general and change least; later layers are the most task-specific.
`,
  maths: `
**In one breath.** New head parameters $= d_{feat} \\times K + K$; fine-tune with a learning rate ~10–100× smaller than from-scratch training; optional layer-wise (discriminative) rates decreasing towards the input.

**Worked examples.**

- ResNet-50's pooled features are 2,048-dimensional. A new 10-class head: $2048 \\times 10 + 10 = 20{,}490$ trainable parameters in feature-extraction mode (vs ~25M in the full network).
- Discriminative learning rates: head $10^{-3}$, each earlier group ÷10: the third group gets $10^{-5}$.

**Decision guide.**

| Your data | Similar to pretraining | Different from pretraining |
|---|---|---|
| Small | feature extraction (train head) | fine-tune top layers carefully, heavy augmentation |
| Large | fine-tune all layers | fine-tune all layers (or train longer); pretrained init still helps |

**Recipe.** (1) Train the new head with the backbone frozen for a few epochs. (2) Unfreeze the top blocks (or everything) and continue with a lower learning rate, warm-up, and early stopping.
`,
  practice: `
**Gotchas.** Use the same input preprocessing (resize, normalisation mean/std) as the pretrained model. Decide what to do with BatchNorm: with small batches, keep BN layers in eval mode (frozen statistics). Watch for **catastrophic forgetting** if fine-tuning too aggressively.

**Beyond vision.** The same pattern drives NLP (BERT, LLM fine-tuning, LoRA) and audio; parameter-efficient fine-tuning updates small adapters instead of all weights.
`,
  traps: [
    { trap: "Fine-tune with the same learning rate you'd use from scratch.", why: "Large steps destroy the useful pretrained features (catastrophic forgetting). Use a much smaller learning rate, often with warm-up, and train the new head first." },
    { trap: "Pretrained ImageNet features are useless for medical images.", why: "Low-level features (edges, textures) transfer surprisingly well; pretrained initialisation usually beats random even for distant domains, though fine-tuning more layers matters." },
    { trap: "Forget about preprocessing; the network will adapt.", why: "Pretrained weights expect specific input statistics. Mismatched normalisation or channel order silently hurts accuracy." },
  ],
  say: {
    prompt: "You have a small labelled image dataset. How would you use transfer learning?",
    secs: 45,
    check: ["Start from a pretrained backbone; replace the head", "Feature extraction (frozen) vs fine-tuning; depends on data size/similarity", "Train head first, then unfreeze with a smaller learning rate / discriminative LRs", "Match preprocessing; handle BatchNorm; augmentation", "Watch for catastrophic forgetting; early stopping"],
    followups: [
      { q: "Why do early layers transfer better than late ones?", a: "Early layers learn generic features (edges, colours, textures) common to most images; later layers encode dataset-specific concepts (ImageNet classes)." },
      { q: "What is catastrophic forgetting?", a: "Fine-tuning with large updates overwrites pretrained knowledge, losing general features; mitigated by small learning rates, freezing, regularising towards the original weights or parameter-efficient methods." },
      { q: "How do you handle BatchNorm when fine-tuning with batch size 8?", a: "Keep BN layers in eval mode with frozen running statistics (or replace with GroupNorm), so tiny noisy batches don't corrupt them." },
    ],
    answer: `I'd start from a backbone pretrained on a large dataset, say a ResNet or ConvNeXt on ImageNet, replace its classifier with a new head for my classes, and use exactly the preprocessing it was trained with. First I'd freeze the backbone and train only the head; with a small dataset similar to the pretraining data that may be enough.

Then I'd unfreeze the top blocks, or the whole network if there's more data or the domain is different, and fine-tune with a learning rate ten to a hundred times smaller, possibly smaller still for early layers, with warm-up, augmentation and early stopping. With small batches I'd keep BatchNorm statistics frozen. This typically beats training from scratch by a wide margin on a few thousand images.`,
    avoid: ["Same learning rate as from-scratch training", "Ignoring input preprocessing"],
  },
  terms: [["Feature extraction", "Freeze backbone, train new head."], ["Fine-tuning", "Continue training pretrained weights at low LR."], ["Discriminative learning rates", "Smaller LR for earlier layers."], ["Catastrophic forgetting", "Losing pretrained knowledge during fine-tuning."]],
  sources: [D.csTL, D.d2l],
});
Q({ id: "dl-tl-1", d: 1, secs: 30, prompt: "New linear head on 2,048-d pooled features for 10 classes. Trainable parameters?", answer: 20490, tol: 0.5, explain: "2048·10 + 10.", py: "answer = 2048*10 + 10" });
Q({ id: "dl-tl-2", d: 1, secs: 30, prompt: "Head LR 10⁻³; each earlier layer group gets ÷10. LR of the third group (head = group 1), in units of 10⁻⁵?", answer: 1, tol: 0.02, explain: "1e−3 → 1e−4 → 1e−5.", py: "lr = 1e-3\nfor _ in range(2):\n    lr /= 10\nanswer = lr/1e-5" });
Q({ id: "dl-tl-3", d: 1, secs: 30, prompt: "800 labelled photos of everyday objects, similar to ImageNet. Best first approach?", options: ["Train a ResNet from scratch", "Freeze a pretrained backbone and train a new head", "Fine-tune all layers with a large learning rate", "Use k-NN on raw pixels"], answer: 1, explain: "Small, similar data: feature extraction first.", py: "answer = 1" });
C("dl-tl-c1", "Transfer recipe", "Train new head (frozen backbone) → unfreeze top/all at 10–100× lower LR.");

L("dl-cnn-practice", CN, "CNNs practice", "Six interview scenarios on convolutions, shapes, architectures and transfer learning.", {
  kind: "interview", mins: 30, prereq: ["dl-conv", "dl-cnn-shapes", "dl-resnet", "dl-cnn-architectures", "dl-transfer"],
  hook: "Answer each scenario out loud in about a minute, then open it and tick off the points the interviewer is listening for.",
}, [
  iq("Compute the output shape and parameter count: input 64×64×3, conv 3×3 with 16 filters, stride 2, padding 1.", "Width = ⌊(64 − 3 + 2)/2⌋ + 1 = 32, so 32×32×16. Parameters = (3·3·3 + 1)·16 = 448.", ["Correct formula", "32×32×16", "448 parameters (with bias)"]),
  iq("Why are CNNs better than MLPs for images, and when might an MLP or transformer be preferable?", "CNNs bake in locality and translation equivariance with shared weights: far fewer parameters, better sample efficiency. MLPs ignore spatial structure. Transformers (ViT) drop most of the inductive bias, which pays off with very large data/pretraining and when global context matters.", ["Locality + weight sharing", "Equivariance / sample efficiency", "MLP lacks spatial prior", "ViT with large data"]),
  iq("A defect-detection model trained on images from factory A performs poorly on factory B. What do you do?", "Domain shift: different lighting, cameras, backgrounds. Collect some labelled B data and fine-tune; use augmentations that mimic B's variation (colour, blur, lighting); normalise per-camera; consider domain adaptation; monitor per-site metrics.", ["Identify domain shift", "Fine-tune with some target data", "Targeted augmentation / normalisation", "Per-site evaluation"]),
  iq("Explain how you'd make a CNN fast enough for a mobile phone.", "Choose an efficient architecture (MobileNet/EfficientNet-lite) with depthwise separable convs, lower input resolution, prune or distil a larger teacher into a small student, quantise to int8, and benchmark latency on the actual device (FLOPs don't equal latency).", ["Efficient architecture", "Resolution / width trade-offs", "Distillation, pruning, quantisation", "Measure on device"]),
  iq("Your fine-tuned ResNet does worse than the frozen-backbone version. Why?", "Likely too high a learning rate or too many epochs (catastrophic forgetting/overfitting on small data), BatchNorm statistics corrupted by small batches, no warm-up, or mismatched preprocessing. Fix with lower/discriminative LRs, freeze BN stats, fewer unfrozen layers, early stopping.", ["Learning rate / forgetting", "Overfitting small data", "BatchNorm with small batches", "Fixes"]),
  iq("Why does ResNet use 1×1 convolutions in its bottleneck blocks?", "To reduce channels before the expensive 3×3 convolution and expand afterwards, cutting parameters and FLOPs (~17× for a 256-channel block) so very deep networks stay affordable, while still mixing channel information.", ["Reduce → 3×3 → expand", "Cost reduction (quantified)", "Enables depth"]),
]);

// ───────────────────────── Sequence models ─────────────────────────

L("dl-rnn", SQ, "Recurrent neural networks and backprop through time", "A hidden state carried across time steps, how it's trained, and why plain RNNs forget.", {
  kind: "concept", mins: 20, prereq: ["dl-vanishing"],
  hook: "To predict the next word you need what came before, but sentences have different lengths. How does one fixed-size network read a sequence of any length?",
  intuition: `
**The situation.** Text, speech, transactions and sensor streams are sequences: order matters and lengths vary.

**The idea.** Process the sequence one step at a time with the **same** weights, carrying a **hidden state** $h_t$ that summarises everything seen so far: $h_t = \\tanh(W_x x_t + W_h h_{t-1} + b)$. The hidden state is the network's memory. Outputs can be produced at every step (tagging, language modelling) or only at the end (classification).

**Training: backprop through time (BPTT).** Unroll the recurrence into a deep network with one layer per time step (shared weights) and backpropagate. The gradient flowing from step $t$ back to step $t - k$ is multiplied by $W_h$ (and tanh derivatives) $k$ times, so it vanishes or explodes over long gaps. Plain RNNs therefore struggle to remember beyond ~10–20 steps.

**Truncated BPTT** backpropagates only through the last $k$ steps to save memory and compute.
`,
  maths: `
**In one breath.** $h_t = \\phi(W_xx_t + W_hh_{t-1} + b)$, $y_t = W_yh_t$; parameters $d_xd_h + d_h^2 + d_h$ (+ output layer); $\\partial h_t/\\partial h_{t-k} = \\prod \\text{diag}(\\phi')W_h$.

**Worked examples.**

- Input 64, hidden 128: $64 \\times 128 + 128 \\times 128 + 128 = 24{,}704$ parameters, whatever the sequence length.
- Scalar RNN, $w_x = 0.5$, $w_h = 1$, $b = 0$, $h_0 = 0$, inputs $(2, 0)$: $h_1 = \\tanh(1) = 0.762$, $h_2 = \\tanh(0.762) = 0.642$. Memory fades even with $w_h = 1$ because tanh shrinks.
- Per-step gradient factor 0.9 over 30 steps: $0.9^{30} = 0.042$.

**Variants.** Bidirectional RNNs (read left-to-right and right-to-left; not for generation), stacked RNNs (several layers), and encoder–decoder set-ups for sequence-to-sequence tasks.

| | RNN | CNN (1-D) | Transformer |
|---|---|---|---|
| Sequential computation | yes (slow on GPUs) | no | no |
| Long-range memory | weak (better with LSTM) | limited by receptive field | direct via attention |
| Cost in length n | O(n) | O(n) | O(n²) attention |
`,
  practice: `
**Where RNNs still appear.** Streaming and on-device models with tight memory (constant state per step), some time-series forecasting, and the history behind modern state-space models (Mamba) which revive recurrence with better training.

**Practical.** Gradient clipping is mandatory; use LSTM/GRU rather than vanilla cells; pack padded sequences; truncate BPTT for long streams.
`,
  traps: [
    { trap: "RNNs have more parameters for longer sequences.", why: "The same weights are reused at every step; parameter count is independent of length. Compute and activation memory grow with length." },
    { trap: "Bidirectional RNNs are always better.", why: "They need the whole sequence up front, so they can't be used for real-time generation or streaming prediction." },
    { trap: "Vanilla RNNs can learn long dependencies with enough training.", why: "Vanishing/exploding gradients through time make long gaps very hard to learn; that's why LSTM/GRU and attention exist." },
  ],
  say: {
    prompt: "How does an RNN process a sequence, and why does it struggle with long-range dependencies?",
    secs: 45,
    check: ["Hidden state updated each step with shared weights", "Variable length handled; outputs per step or at end", "Trained with BPTT on the unrolled network", "Gradient is a product over time steps → vanishing/exploding", "Fixes: LSTM/GRU, clipping, attention; truncated BPTT"],
    followups: [
      { q: "What is truncated BPTT?", a: "Backpropagating through only the last k time steps (carrying the hidden state forward but cutting the gradient), trading long-range credit assignment for memory and speed." },
      { q: "Why are RNNs slow to train on GPUs?", a: "Each step depends on the previous hidden state, so time steps can't be parallelised within a sequence, unlike convolutions or attention." },
      { q: "When can't you use a bidirectional RNN?", a: "When predictions must be made before the future is seen: streaming speech, language generation, real-time forecasting." },
    ],
    answer: `An RNN reads a sequence one element at a time and keeps a hidden state: at each step it combines the current input with the previous hidden state through the same weight matrices and a non-linearity, so one fixed-size network handles any length and the hidden state acts as memory. It can output at every step or only at the end.

It's trained by unrolling over time and backpropagating, BPTT. The gradient from a late step to an early one is multiplied by the recurrent Jacobian once per step, so over long gaps it vanishes or explodes and the network effectively forgets beyond a few dozen steps. Gradient clipping handles explosions; gated cells like LSTMs and GRUs, and ultimately attention, handle the forgetting.`,
    avoid: ["“Longer sequences mean more parameters”", "Ignoring the vanishing gradient issue"],
  },
  terms: [["Hidden state", "Vector carried across time steps as memory."], ["BPTT", "Backprop through the time-unrolled network."], ["Truncated BPTT", "Backprop only through the last k steps."]],
  sources: [D.pascanu, D.d2l],
});
Q({ id: "dl-rnn-1", d: 1, secs: 45, prompt: "Vanilla RNN, input size 64, hidden size 128, with bias (no output layer). Parameters?", answer: 24704, tol: 0.5, explain: "64·128 + 128·128 + 128 = 24,704.", py: "answer = 64*128 + 128*128 + 128" });
Q({ id: "dl-rnn-2", d: 2, secs: 60, prompt: "Scalar RNN h_t = tanh(0.5·x_t + 1.0·h_{t−1}), h₀ = 0, inputs (2, 0). h₂? (3 decimals)", answer: 0.642, tol: 0.002, explain: "h₁ = tanh(1) = 0.762; h₂ = tanh(0.762) = 0.642.", py: "import math\nh = 0.0\nfor x in [2, 0]:\n    h = math.tanh(0.5*x + 1.0*h)\nanswer = h" });
Q({ id: "dl-rnn-3", d: 1, secs: 30, prompt: "Gradient factor 0.9 per time step over 30 steps? (3 decimals)", answer: 0.042, tol: 0.002, explain: "0.9³⁰ = 0.042.", py: "answer = 0.9**30" });
C("dl-rnn-c1", "RNN update", "h_t = tanh(W_x x_t + W_h h_{t−1} + b); same weights every step.");

L("dl-lstm-gru", SQ, "LSTM and GRU", "Gated recurrent cells: how gates control memory and keep gradients alive over long sequences.", {
  kind: "concept", mins: 25, prereq: ["dl-rnn"],
  hook: "An LSTM can remember a word from 200 steps ago. Which single design choice makes that possible?",
  intuition: `
**The situation.** Vanilla RNNs overwrite their memory every step and their gradients vanish over long gaps.

**The idea: gates.** A gate is a sigmoid output between 0 and 1 that multiplies something, deciding how much passes through.

- **LSTM** keeps a separate **cell state** $c_t$, a conveyor belt of memory updated additively:
  - **forget gate** $f$: how much of the old cell to keep,
  - **input gate** $i$: how much of the new candidate $g$ to write,
  - **output gate** $o$: how much of the cell to expose as the hidden state.
- **GRU** merges the cell and hidden state and uses two gates (update and reset). Fewer parameters, similar performance on many tasks.

**Why it works.** The cell update is $c_t = f \\odot c_{t-1} + i \\odot g$. When the forget gate is near 1, the cell (and its gradient) passes through almost unchanged: an additive, residual-like path through time.
`,
  maths: `
**In one breath.** $f, i, o = \\sigma(W[h_{t-1}, x_t] + b)$, $g = \\tanh(W_g[h_{t-1}, x_t] + b_g)$, $c_t = f \\odot c_{t-1} + i \\odot g$, $h_t = o \\odot \\tanh(c_t)$; parameters $4(d_h(d_x + d_h) + d_h)$ for LSTM, $3(\\cdot)$ for GRU.

**Worked examples.**

- Cell update: $f = 0.9$, $c_{t-1} = 2$, $i = 0.5$, $g = 0.4$: $c_t = 1.8 + 0.2 = 2.0$.
- Gradient along the cell over 50 steps with $f = 0.99$: $0.99^{50} = 0.605$, compared with a vanilla RNN factor like $0.9^{50} = 0.005$.
- Input 64, hidden 128: LSTM $4(128 \\times 192 + 128) = 98{,}816$; GRU $3(128 \\times 192 + 128) = 74{,}112$ (one-bias convention).

**GRU equations.** $z = \\sigma(\\cdot)$ (update), $r = \\sigma(\\cdot)$ (reset), $\\tilde h = \\tanh(W[r \\odot h_{t-1}, x_t])$, $h_t = (1 - z) \\odot h_{t-1} + z \\odot \\tilde h$.

| | LSTM | GRU |
|---|---|---|
| States | cell c + hidden h | hidden h only |
| Gates | forget, input, output | update, reset |
| Parameters | 4 blocks | 3 blocks |
| Typical use | long sequences, default | smaller/faster, similar accuracy |

**Init trick.** Set forget-gate biases to 1 so the cell remembers by default early in training.
`,
  practice: `
**Today.** Transformers replaced LSTMs for most NLP, but LSTMs/GRUs remain useful for streaming, small on-device models and some time-series problems, and they're common interview material.

**Practical.** Clip gradients; use packed sequences for padding; try GRU when data or compute is small; bidirectional LSTMs for tagging when the full sequence is available.
`,
  traps: [
    { trap: "LSTMs completely solve vanishing gradients.", why: "They greatly mitigate it via the additive cell path, but over very long sequences (thousands of steps) memory still decays; attention handles long-range dependencies more directly." },
    { trap: "The forget gate forgets when it's 1.", why: "It multiplies the old cell: 1 keeps everything, 0 erases. The name describes what it controls, not the value's meaning." },
    { trap: "GRUs are always worse than LSTMs because they're simpler.", why: "Empirically they perform comparably on many tasks with fewer parameters; neither dominates." },
  ],
  say: {
    prompt: "Explain how an LSTM works and why it handles long sequences better than a vanilla RNN.",
    secs: 60,
    check: ["Cell state as additive memory path", "Forget, input, output gates (sigmoids) and candidate (tanh)", "c_t = f⊙c_{t−1} + i⊙g; h_t = o⊙tanh(c_t)", "Forget gate ≈ 1 → gradient flows across many steps", "GRU as a lighter variant; still limits vs attention"],
    followups: [
      { q: "Why set the forget-gate bias to 1?", a: "So f starts near σ(1) ≈ 0.73 or higher, keeping memory by default; otherwise early training forgets aggressively and long dependencies are harder to learn." },
      { q: "How does a GRU differ from an LSTM?", a: "It merges cell and hidden state and uses update and reset gates (no output gate), giving fewer parameters with similar accuracy on many tasks." },
      { q: "Why did transformers replace LSTMs in NLP?", a: "Attention connects any two positions directly (no long gradient path), and transformers parallelise across the sequence during training, scaling far better on GPUs." },
    ],
    answer: `An LSTM adds a cell state, a separate memory vector, and three sigmoid gates. The forget gate decides how much of the previous cell to keep, the input gate how much of a new tanh candidate to write, and the output gate how much of the cell to expose as the hidden state. The key equation is c_t equals f times c_{t−1} plus i times g: memory is updated additively rather than overwritten.

That additive path is why it works: when the forget gate is near one, both the stored information and its gradient pass across many steps almost unchanged, instead of being squashed by a matrix and tanh every step as in a vanilla RNN. GRUs do something similar with two gates and fewer parameters. Over very long ranges both still fade, which is part of why attention took over.`,
    avoid: ["“Forget gate = 1 means forget”", "“LSTMs fully solve long-range memory”"],
  },
  terms: [["Cell state", "LSTM's additive memory vector."], ["Forget gate", "σ(·) multiplying the old cell state."], ["GRU", "Gated unit with update and reset gates."]],
  sources: [D.gru, D.d2l],
});
Q({ id: "dl-lstm-1", d: 1, secs: 30, prompt: "LSTM cell update: f = 0.9, c_{t−1} = 2, i = 0.5, g = 0.4. c_t?", answer: 2, tol: 0.002, explain: "0.9·2 + 0.5·0.4 = 1.8 + 0.2 = 2.0.", py: "answer = 0.9*2 + 0.5*0.4" });
Q({ id: "dl-lstm-2", d: 2, secs: 60, prompt: "LSTM with input size 64 and hidden size 128, one bias per gate block. Parameters?", answer: 98816, tol: 0.5, explain: "4 × (128 × (64 + 128) + 128) = 98,816.", py: "answer = 4*(128*(64+128) + 128)" });
Q({ id: "dl-lstm-3", d: 2, secs: 45, prompt: "Gradient along the cell state over 50 steps with forget gate 0.99 throughout? (3 decimals)", answer: 0.605, tol: 0.002, explain: "0.99⁵⁰ = 0.605, vs 0.9⁵⁰ = 0.005 for a typical vanilla factor.", py: "answer = 0.99**50" });
Q({ id: "dl-lstm-4", d: 1, secs: 30, prompt: "Which LSTM component decides how much of the previous cell state is kept?", options: ["Input gate", "Output gate", "Forget gate", "Candidate (tanh) layer"], answer: 2, explain: "c_t = f ⊙ c_{t−1} + …", py: "answer = 2" });
C("dl-lstm-c1", "LSTM cell", "c_t = f⊙c_{t−1} + i⊙g; h_t = o⊙tanh(c_t).");

L("dl-seq2seq", SQ, "Sequence-to-sequence and attention", "Encoder–decoder models, the bottleneck problem, Bahdanau attention, teacher forcing and beam search.", {
  kind: "concept", mins: 25, prereq: ["dl-lstm-gru", "dl-output-loss"],
  hook: "Squeeze a 50-word sentence into one vector, then translate from it. What breaks, and what idea from 2014 fixed it and later became the transformer?",
  intuition: `
**The situation.** Translation, summarisation and speech recognition map an input sequence to an output sequence of a different length.

**Encoder–decoder.** An encoder RNN reads the input and produces a final hidden state; a decoder RNN starts from it and generates the output one token at a time, feeding each prediction back in. Problem: everything must fit in one fixed-size vector (the **bottleneck**), so long inputs degrade badly.

**Attention.** Keep all encoder hidden states. At every decoding step, score each encoder state for relevance to what the decoder needs now, turn the scores into weights with softmax, and take the weighted average (the **context vector**). The decoder can "look back" at the relevant input words; the weights even show an alignment between source and target words.

**Training and decoding.**

- **Teacher forcing:** during training, feed the true previous token rather than the model's own prediction: faster, stable, but creates **exposure bias** (at test time the model sees its own mistakes).
- **Decoding:** greedy (pick the top token), **beam search** (keep the best $k$ partial sequences), or sampling.
`,
  maths: `
**In one breath.** Scores $e_{t,i} = \\text{score}(s_{t-1}, h_i)$, weights $\\alpha_{t,i} = \\text{softmax}_i(e_{t,i})$, context $c_t = \\sum_i \\alpha_{t,i}h_i$; Bahdanau (additive) score $v^\\top\\tanh(W s + U h)$, Luong (multiplicative) $s^\\top W h$.

**Worked example.** Scores $(1, 2, 3)$ → weights $(0.090, 0.245, 0.665)$. Encoder states $h_1 = (1, 0)$, $h_2 = (0, 1)$, $h_3 = (1, 1)$ with weights $(0.2, 0.3, 0.5)$: context $= (0.7, 0.8)$.

**Beam search cost.** Beam width $k$ and vocabulary $V$: each step scores $k \\times V$ candidate extensions and keeps the top $k$. With $k = 3$, $V = 10{,}000$: 30,000 candidates per step. Beam search maximises sequence log-probability; length normalisation stops it favouring short outputs.

| Decoding | Keeps | Pros | Cons |
|---|---|---|---|
| Greedy | 1 best token | fast | can miss better sequences |
| Beam (k) | k best prefixes | better likelihood for translation | bland, repetitive for open text |
| Sampling (temperature/top-p) | random draws | diverse | can drift |

**From here to transformers.** Transformers keep the attention and drop the recurrence: every position attends to every other position, in parallel.
`,
  practice: `
**Where it's used.** Machine translation, summarisation, speech-to-text and image captioning, now mostly with transformer encoders/decoders (T5, Whisper), but the vocabulary (encoder, decoder, cross-attention, teacher forcing, beam search) is identical.

**Evaluation.** BLEU/ROUGE/chrF for translation and summarisation, WER for speech, plus human evaluation.
`,
  traps: [
    { trap: "Attention weights explain the model's reasoning.", why: "They show where the model looked, which often aligns with intuition, but they're not a faithful explanation of why it produced an output." },
    { trap: "Beam search always gives better outputs than sampling.", why: "For tasks with one right answer (translation) beam search helps; for open-ended generation it produces bland, repetitive text, so sampling is preferred." },
    { trap: "Teacher forcing has no downside.", why: "Training only on gold prefixes means the model never learns to recover from its own errors (exposure bias); scheduled sampling or sequence-level training can help." },
  ],
  say: {
    prompt: "Explain encoder–decoder models and how attention improved them.",
    secs: 60,
    check: ["Encoder reads input; decoder generates output token by token", "Fixed-vector bottleneck degrades on long inputs", "Attention: score encoder states, softmax weights, context vector each step", "Teacher forcing and exposure bias", "Decoding: greedy / beam / sampling; link to transformers"],
    followups: [
      { q: "Additive vs multiplicative attention?", a: "Additive (Bahdanau) scores with a small MLP v·tanh(Ws + Uh); multiplicative (Luong) uses a (bilinear) dot product sᵀWh. Dot-product forms are faster and are what transformers use (scaled)." },
      { q: "What is exposure bias?", a: "The mismatch between training (conditioning on true previous tokens) and inference (conditioning on the model's own predictions), so errors compound at test time." },
      { q: "Why length-normalise beam search scores?", a: "Log-probabilities add negative terms per token, so longer sequences score lower; dividing by length (or a length penalty) stops beam search favouring short outputs." },
    ],
    answer: `An encoder–decoder model reads the input with an encoder, originally an RNN, and generates the output one token at a time with a decoder conditioned on what the encoder produced, which handles different input and output lengths. The original version passed only the encoder's final hidden state, a single vector bottleneck, so quality collapsed on long inputs.

Attention fixed that: at every decoding step the decoder scores all encoder states for relevance, softmaxes the scores into weights and takes a weighted average as context, so it can look directly at the relevant source words. Training uses teacher forcing, feeding the true previous tokens, which causes some exposure bias, and decoding uses greedy, beam search or sampling. Transformers took this attention idea and removed the recurrence entirely.`,
    avoid: ["“Attention weights are explanations”", "Beam search as universally best"],
  },
  terms: [["Encoder–decoder", "Encode input sequence, decode output sequence."], ["Context vector", "Attention-weighted sum of encoder states."], ["Teacher forcing", "Feed gold previous tokens during training."], ["Beam search", "Keep the k most likely partial outputs."]],
  sources: [D.seq2seq, D.bahdanau, D.d2l],
});
Q({ id: "dl-s2s-1", d: 1, secs: 45, prompt: "Attention scores (1, 2, 3). Softmax weight on the third position? (3 decimals)", answer: 0.665, tol: 0.002, explain: "e³/(e + e² + e³) = 0.665.", py: "import numpy as np\ne = np.exp([1,2,3.])\nanswer = float(e[2]/e.sum())", packages: ["numpy"] });
Q({ id: "dl-s2s-2", d: 1, secs: 45, prompt: "Encoder states (1, 0), (0, 1), (1, 1) with attention weights (0.2, 0.3, 0.5). First component of the context vector?", answer: 0.7, tol: 0.002, explain: "0.2·1 + 0.3·0 + 0.5·1 = 0.7.", py: "import numpy as np\nH = np.array([[1,0],[0,1],[1,1.]]); a = np.array([0.2,0.3,0.5])\nanswer = float((a@H)[0])", packages: ["numpy"] });
Q({ id: "dl-s2s-3", d: 1, secs: 30, prompt: "Beam width 3, vocabulary 10,000. Candidate extensions scored per decoding step?", answer: 30000, tol: 0.5, explain: "k × V = 30,000; keep the best 3.", py: "answer = 3*10000" });
Q({ id: "dl-s2s-4", d: 1, secs: 30, prompt: "The mismatch caused by training with gold previous tokens but generating from the model's own outputs is called…", options: ["catastrophic forgetting", "exposure bias", "label smoothing", "covariate shift"], answer: 1, explain: "Exposure bias.", py: "answer = 1" });
C("dl-s2s-c1", "Attention (seq2seq)", "weights = softmax(scores), context = Σ αᵢhᵢ, recomputed every decoder step.");

L("dl-seq-practice", SQ, "Sequence models practice", "Five interview scenarios on RNNs, LSTMs, seq2seq and decoding.", {
  kind: "interview", mins: 25, prereq: ["dl-rnn", "dl-lstm-gru", "dl-seq2seq"],
  hook: "Answer each scenario out loud in about a minute, then open it and tick off the points the interviewer is listening for.",
}, [
  iq("Would you use an LSTM or a transformer for next-day sales forecasting from two years of daily data per store?", "With short histories and tabular covariates, start with strong baselines (seasonal naive, gradient boosting with lag features). Between the two neural options, an LSTM or temporal CNN is lighter and works with little data; transformers need more data and care. Choose by validation on a time-based split.", ["Baselines first (GBM with lags)", "Data size vs model capacity", "LSTM lighter for small data", "Time-based validation"]),
  iq("Why are RNNs slower to train than transformers on GPUs, even with fewer FLOPs?", "Each time step depends on the previous hidden state, so steps within a sequence run sequentially; transformers compute all positions in parallel with large matrix multiplies, using GPUs efficiently.", ["Sequential dependency", "Parallelism across positions in transformers", "Hardware utilisation"]),
  iq("Your seq2seq summariser produces repetitive phrases. What do you try?", "Change decoding: sampling with temperature/top-p instead of pure beam, repetition penalties or n-gram blocking, length penalties. Model-side: coverage mechanisms, more data, label smoothing. Check training for exposure bias.", ["Decoding changes", "Repetition / n-gram blocking", "Coverage / model fixes", "Exposure bias awareness"]),
  iq("Explain BPTT and what truncation trades off.", "Unroll the RNN over time and backpropagate through all steps with shared weights. Truncated BPTT only backpropagates k steps: lower memory and faster, but the model can't learn dependencies longer than k through gradients (state still carries forward).", ["Unrolled graph, shared weights", "Truncation saves memory/compute", "Limits learnable dependency length"]),
  iq("How would you classify the sentiment of long product reviews with an LSTM, and what's a better modern alternative?", "Tokenise, embed, run a (bidirectional) LSTM, pool hidden states (last state or attention pooling), dense + sigmoid/softmax; pad/pack sequences and clip gradients. Better: fine-tune a pretrained transformer encoder (e.g. a BERT-style model), which typically wins substantially with little labelled data.", ["Embedding → BiLSTM → pooling → classifier", "Padding/packing, clipping", "Pretrained transformer fine-tuning as alternative"]),
]);
