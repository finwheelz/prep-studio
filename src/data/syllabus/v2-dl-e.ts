/**
 * v2 Deep learning, part E: Computer vision.
 */
import { iq, lessonWriter } from "./v2-shared";
import { D } from "./v2-dl-sources";

const { L, Q, C } = lessonWriter("dl");
const CV = "Computer vision";

L("dl-vit", CV, "Vision transformers", "Treating an image as a sequence of patches: how ViT works and when it beats a CNN.", {
  kind: "concept", mins: 20, prereq: ["dl-transformer-block", "dl-conv"],
  hook: "ViT throws away the convolution's built-in assumptions about images. Why does it still win at scale, and lose on small datasets?",
  intuition: `
**The situation.** Transformers dominated text. Could the same architecture, with almost no image-specific design, work for vision?

**The idea.** Cut the image into fixed-size patches (e.g. 16×16 pixels), flatten each patch and project it linearly to a $d$-dimensional token, add learned position embeddings, prepend a learnable **[CLS]** token, and run a standard transformer encoder. The final [CLS] representation (or the mean of patch tokens) feeds a classifier.

**Inductive bias trade-off.** CNNs assume locality and translation equivariance, which helps a lot with limited data. ViT assumes almost nothing: attention can relate any two patches from the first layer, so it must learn spatial structure from data. Trained on ImageNet alone it underperforms comparable CNNs; pretrained on much larger datasets (or with strong augmentation, distillation, self-supervised pretraining) it matches or beats them and scales well.
`,
  maths: `
**In one breath.** $N = (H/P)(W/P)$ patches; patch embedding $= P^2C \\times d$ (+ $d$ bias); sequence length $N + 1$; attention cost $\\propto N^2$.

**Worked examples.**

- 224×224 image, 16×16 patches: $14 \\times 14 = 196$ patches; with [CLS], 197 tokens.
- Patch embedding to $d = 768$ for RGB: $16 \\times 16 \\times 3 \\times 768 + 768 = 590{,}592$ parameters (equivalent to a 16×16 conv with stride 16).
- Fine-tuning at 384×384 with the same patch size: 576 patches; attention cost grows by $(576/196)^2 \\approx 8.6×$. Position embeddings are interpolated to the new grid.

| | CNN | ViT |
|---|---|---|
| Inductive bias | locality, equivariance | minimal (patches, positions) |
| Small-data performance | strong | weaker without tricks |
| Large-scale pretraining | good | excellent, scales smoothly |
| Global context | grows with depth | from layer 1 |
| Cost vs resolution | linear in pixels | quadratic in patches |

**Hybrids and successors.** Swin Transformer (windowed attention, hierarchical, linear in image size), DeiT (data-efficient training with distillation), and self-supervised ViTs (DINO, MAE) used as general visual backbones; CLIP's image encoder is usually a ViT.
`,
  practice: `
**Choosing.** Small dataset, edge device → CNN (or a small pretrained ViT). Large pretrained backbone available, rich downstream tasks → ViT/Swin/DINO features. Multimodal (image + text) → ViT encoders are standard.

**Fine-tuning tips.** Lower learning rates, layer-wise decay, strong augmentation (RandAugment, mixup), interpolate position embeddings for new resolutions.
`,
  traps: [
    { trap: "ViTs are strictly better than CNNs.", why: "Without large-scale pretraining or strong regularisation they generalise worse than CNNs on mid-sized datasets. At similar compute, modern CNNs (ConvNeXt) remain competitive." },
    { trap: "ViT has no convolution at all.", why: "The patch embedding is exactly a convolution with kernel = stride = patch size; after that it's a standard transformer." },
    { trap: "Changing input resolution is free for ViTs.", why: "More patches means quadratically more attention cost, and the learned position embeddings must be interpolated to the new grid." },
  ],
  say: {
    prompt: "How does a vision transformer work, and how does it compare to a CNN?",
    secs: 45,
    check: ["Split into patches, linear projection to tokens, position embeddings, [CLS]", "Standard transformer encoder; classify from [CLS]/pooled tokens", "Weak inductive bias: needs large data / strong augmentation / pretraining", "Global attention from layer 1; quadratic in patch count", "Swin/DeiT/DINO/CLIP as context"],
    followups: [
      { q: "Why does ViT need more data than a CNN?", a: "It lacks built-in locality and translation equivariance, so it has to learn those regularities from data; CNNs get them for free, which acts as a strong prior on small datasets." },
      { q: "What is the [CLS] token?", a: "A learnable token prepended to the patch sequence whose final representation aggregates information from all patches and is used for classification; mean-pooling patch tokens is a common alternative." },
      { q: "How does Swin reduce cost?", a: "It computes attention within local windows (shifted between layers so windows communicate) and builds a hierarchy by merging patches, giving cost linear in image size." },
    ],
    answer: `A vision transformer splits the image into fixed patches, say 16 by 16, flattens and linearly projects each one into a token, adds learned position embeddings and a learnable class token, and runs a standard transformer encoder; the class token's final state goes to a classifier. A 224 image gives 196 patch tokens.

Compared with a CNN it has almost no built-in assumptions about images, so attention can relate distant patches from the first layer, but it has to learn locality from data. On ImageNet alone it trails good CNNs; with large-scale or self-supervised pretraining, strong augmentation or distillation it matches or beats them and scales better. Its cost is quadratic in the number of patches, which is why windowed variants like Swin exist.`,
    avoid: ["“ViTs always beat CNNs”", "Ignoring the data requirement"],
  },
  terms: [["Patch embedding", "Linear projection of flattened patches (a stride-P conv)."], ["[CLS] token", "Learnable token summarising the sequence for classification."], ["Inductive bias", "Built-in assumptions that guide learning."]],
  sources: [D.vit, D.d2l],
});
Q({ id: "dl-vit-1", d: 1, secs: 30, prompt: "224×224 image with 16×16 patches. Number of patch tokens?", answer: 196, tol: 0.5, explain: "(224/16)² = 14² = 196.", py: "answer = (224//16)**2" });
Q({ id: "dl-vit-2", d: 2, secs: 45, prompt: "Patch-embedding parameters for 16×16 RGB patches projected to d = 768, with bias?", answer: 590592, tol: 0.5, explain: "16·16·3·768 + 768 = 590,592.", py: "answer = 16*16*3*768 + 768" });
Q({ id: "dl-vit-3", d: 2, secs: 60, prompt: "Going from 224 to 384 resolution at patch size 16, by what factor does the attention score count grow? (2 decimals)", answer: 8.64, tol: 0.01, explain: "Patches 196 → 576; (576/196)² = 8.64.", py: "a = (224//16)**2; b = (384//16)**2\nanswer = (b/a)**2" });
Q({ id: "dl-vit-4", d: 1, secs: 30, prompt: "Trained only on a mid-sized dataset from scratch, a ViT typically…", options: ["beats a comparable ResNet easily", "underperforms a comparable CNN", "performs identically", "cannot be trained"], answer: 1, explain: "Weak inductive bias needs more data or pretraining.", py: "answer = 1" });
C("dl-vit-c1", "ViT tokens", "N = (H/P)(W/P) patches + [CLS]; patch embedding = stride-P conv.");

L("dl-detection", CV, "Object detection", "Boxes and classes: IoU, anchors, non-maximum suppression, one- vs two-stage detectors and mAP.", {
  kind: "concept", mins: 25, prereq: ["dl-cnn-architectures"],
  hook: "Your detector outputs 30 overlapping boxes around one car. Which step is missing, and how does it decide which box survives?",
  intuition: `
**The situation.** Classification says *what*; detection says *what and where*, for every object, as bounding boxes with class labels and confidence scores.

**The building blocks.**

- **IoU (intersection over union):** overlap between two boxes, from 0 to 1. Used to match predictions to ground truth and to remove duplicates.
- **Anchors / priors:** a set of reference boxes of several sizes and shapes at each location; the network predicts offsets from them and an objectness/class score. (Anchor-free detectors predict boxes from points or centres instead.)
- **Non-maximum suppression (NMS):** sort boxes by score; keep the best; drop others of the same class with IoU above a threshold (e.g. 0.5); repeat.

**Two families.**

- **Two-stage (Faster R-CNN):** a region proposal network suggests candidate boxes, a second stage classifies and refines them. Accurate, slower.
- **One-stage (YOLO, SSD, RetinaNet):** predict boxes and classes densely in one pass. Fast; class imbalance (mostly background) handled with focal loss. **DETR** uses a transformer with set prediction and no NMS.
`,
  maths: `
**In one breath.** IoU $= \\dfrac{|A \\cap B|}{|A \\cup B|}$; a prediction is a true positive if IoU with an unmatched ground-truth box ≥ threshold; AP = area under the precision–recall curve per class; mAP = mean over classes (COCO averages IoU thresholds 0.5–0.95).

**Worked examples.**

- Boxes (0, 0, 2, 2) and (1, 1, 3, 3): intersection 1, union 4 + 4 − 1 = 7, IoU = 0.143.
- Original YOLO output: $S \\times S \\times (B \\times 5 + C)$ with $S = 7$, $B = 2$, $C = 20$: 1,470 numbers.
- NMS (threshold 0.5) on boxes A (0.9), B (0.8, IoU with A = 0.7), C (0.7, IoU with A = 0.1, with B = 0.05): keep A, drop B, keep C → 2 boxes.

**Box regression.** Predict offsets $(t_x, t_y, t_w, t_h)$ relative to an anchor (log-scale for width/height); losses like smooth L1 or IoU-based (GIoU, DIoU) losses.

| | Two-stage | One-stage | DETR-style |
|---|---|---|---|
| Example | Faster R-CNN | YOLO, RetinaNet | DETR, RT-DETR |
| Speed | slower | real-time | varies |
| Duplicates | NMS | NMS | set matching, no NMS |
| Strength | accuracy, small objects | speed | end-to-end, simple pipeline |
`,
  practice: `
**Practical choices.** Real-time on edge → a YOLO-family model; best accuracy offline → two-stage or modern transformer detectors; start from COCO-pretrained weights and fine-tune.

**Data and evaluation.** Consistent box annotation rules, class balance, small-object coverage; evaluate mAP@0.5 and mAP@[0.5:0.95], plus per-class AP and latency on target hardware. Tune the score threshold and NMS IoU for the use case.
`,
  traps: [
    { trap: "Accuracy is the right metric for a detector.", why: "Detection needs localisation and confidence ranking: use precision–recall, AP per class and mAP at IoU thresholds." },
    { trap: "A higher NMS IoU threshold removes more duplicates.", why: "The opposite: boxes are only suppressed if they overlap more than the threshold, so a higher threshold keeps more overlapping boxes (fewer suppressed)." },
    { trap: "One-stage detectors are always less accurate.", why: "With focal loss and modern designs, one-stage detectors match two-stage accuracy on many benchmarks while being much faster." },
  ],
  say: {
    prompt: "Explain how a modern object detector works and how it's evaluated.",
    secs: 60,
    check: ["Predicts boxes + classes + scores; anchors or anchor-free", "IoU for matching and NMS for de-duplication", "Two-stage (proposals + refinement) vs one-stage (dense) vs DETR", "Box regression and class imbalance (focal loss)", "Evaluation: precision–recall, AP per class, mAP at IoU thresholds"],
    followups: [
      { q: "How does NMS work?", a: "Sort detections by confidence; take the top one; remove remaining boxes of the same class whose IoU with it exceeds a threshold; repeat with what's left." },
      { q: "What problem does focal loss solve?", a: "Dense detectors evaluate tens of thousands of mostly-background locations; focal loss down-weights easy, well-classified examples so the rare hard ones drive learning." },
      { q: "How does DETR avoid NMS?", a: "It predicts a fixed set of boxes with a transformer and trains with bipartite (Hungarian) matching to ground truth, so each object is predicted once." },
    ],
    answer: `A detector predicts, for each object, a bounding box, a class and a confidence. Most detectors place reference boxes, anchors, of several shapes across a feature map and predict class scores and offsets from them; anchor-free ones predict boxes from points directly. Two-stage detectors like Faster R-CNN first propose regions and then classify and refine them; one-stage detectors like YOLO or RetinaNet predict everything densely in one pass, using focal loss to cope with the flood of background locations.

Many raw boxes overlap the same object, so non-maximum suppression keeps the highest-scoring one and removes others whose IoU with it exceeds a threshold. Evaluation matches predictions to ground truth by IoU, builds a precision–recall curve per class and reports average precision, with mAP averaged over classes and, for COCO, over IoU thresholds from 0.5 to 0.95.`,
    avoid: ["Using accuracy for detection", "Getting the NMS threshold direction backwards"],
  },
  terms: [["IoU", "Intersection over union of two boxes."], ["NMS", "Suppress lower-scored boxes overlapping a kept box above an IoU threshold."], ["Anchor", "Reference box the network predicts offsets from."], ["mAP", "Mean average precision across classes (and IoU thresholds)."]],
  sources: [D.frcnn, D.yolo],
});
Q({ id: "dl-det-1", d: 1, secs: 45, prompt: "IoU of boxes (x1, y1, x2, y2) = (0, 0, 2, 2) and (1, 1, 3, 3)? (3 decimals)", answer: 0.143, tol: 0.002, explain: "Intersection 1; union 4 + 4 − 1 = 7; 1/7.", py: "def iou(a, b):\n    ix = max(0, min(a[2],b[2]) - max(a[0],b[0])); iy = max(0, min(a[3],b[3]) - max(a[1],b[1]))\n    inter = ix*iy\n    area = lambda r: (r[2]-r[0])*(r[3]-r[1])\n    return inter/(area(a)+area(b)-inter)\nanswer = iou((0,0,2,2),(1,1,3,3))" });
Q({ id: "dl-det-2", d: 1, secs: 30, prompt: "Original YOLO output size S·S·(B·5 + C) with S = 7, B = 2, C = 20?", answer: 1470, tol: 0.5, explain: "49 × 30 = 1,470.", py: "answer = 7*7*(2*5+20)" });
Q({ id: "dl-det-3", d: 2, secs: 90, prompt: "NMS at IoU 0.5 on boxes (score): A = (0, 0, 10, 10) 0.9, B = (1, 1, 11, 11) 0.8, C = (20, 20, 30, 30) 0.7. How many boxes remain?", answer: 2, tol: 0.5, explain: "IoU(A, B) = 81/119 = 0.68 > 0.5 → drop B. C doesn't overlap → keep. A and C remain.", py: "def iou(a, b):\n    ix = max(0, min(a[2],b[2]) - max(a[0],b[0])); iy = max(0, min(a[3],b[3]) - max(a[1],b[1]))\n    inter = ix*iy\n    area = lambda r: (r[2]-r[0])*(r[3]-r[1])\n    return inter/(area(a)+area(b)-inter)\nboxes = [((0,0,10,10),.9),((1,1,11,11),.8),((20,20,30,30),.7)]\nboxes.sort(key=lambda t: -t[1]); keep = []\nwhile boxes:\n    b = boxes.pop(0); keep.append(b)\n    boxes = [x for x in boxes if iou(x[0], b[0]) <= 0.5]\nanswer = len(keep)" });
Q({ id: "dl-det-4", d: 1, secs: 30, prompt: "Raising the NMS IoU threshold from 0.5 to 0.7 generally…", options: ["suppresses more boxes", "suppresses fewer boxes", "has no effect", "removes all low-score boxes"], answer: 1, explain: "Only boxes overlapping more than the threshold are suppressed.", py: "answer = 1" });
C("dl-det-c1", "NMS", "Sort by score, keep best, drop same-class boxes with IoU > threshold, repeat.");
C("dl-det-c2", "Detection metric", "AP per class from the PR curve; mAP over classes (and IoU 0.5–0.95 on COCO).");

L("dl-segmentation", CV, "Image segmentation", "Labelling every pixel: semantic, instance and panoptic segmentation, U-Net, and Dice/IoU losses.", {
  kind: "concept", mins: 20, prereq: ["dl-cnn-shapes", "dl-detection"],
  hook: "A tumour occupies 1% of a scan. Your pixel-accuracy is 99% and the model predicts no tumour anywhere. What metric and loss should you have used?",
  intuition: `
**The situation.** Some tasks need pixel-level answers: tumour boundaries, road vs pavement for a car, crop fields from satellites.

**Three flavours.**

- **Semantic segmentation:** a class for every pixel (all cars are "car").
- **Instance segmentation:** separate masks for each object (car #1, car #2), e.g. Mask R-CNN.
- **Panoptic segmentation:** both: every pixel gets a class, and countable objects get instance IDs.

**Architecture idea: encoder–decoder.** An encoder (CNN or ViT) downsamples to capture context; a decoder upsamples back to full resolution. **U-Net** adds skip connections that *concatenate* encoder features into the decoder at each scale, recovering fine spatial detail lost by downsampling. Upsampling uses transposed convolutions or interpolation + conv.

**Imbalance.** Background dominates most images, so plain pixel accuracy and cross-entropy reward predicting background. Overlap-based metrics and losses (IoU, Dice) focus on the object.
`,
  maths: `
**In one breath.** IoU $= \\dfrac{TP}{TP + FP + FN}$; Dice $= \\dfrac{2TP}{2TP + FP + FN} = \\dfrac{2\\,\\text{IoU}}{1 + \\text{IoU}}$; soft Dice loss $= 1 - \\dfrac{2\\sum p\\,g + \\epsilon}{\\sum p + \\sum g + \\epsilon}$.

**Worked examples.**

- TP = 80, FP = 20, FN = 20 pixels: Dice = 160/200 = 0.8; IoU = 80/120 = 0.667.
- IoU 0.5 corresponds to Dice 0.667.
- 10,000-pixel image with a 100-pixel tumour: predicting all background gives 99% pixel accuracy, IoU/Dice 0 for the tumour class.

**mIoU.** Mean IoU over classes, the standard semantic segmentation metric.

| Method | Type | Key idea |
|---|---|---|
| FCN | semantic | fully convolutional, upsample predictions |
| U-Net | semantic (medical) | symmetric encoder–decoder with concatenation skips |
| DeepLab | semantic | dilated convolutions, multi-scale context |
| Mask R-CNN | instance | detector + per-box mask head |
| SAM-style models | promptable | segment anything from points/boxes |
`,
  practice: `
**Losses.** Cross-entropy + Dice (combined) is a robust default for imbalanced masks; focal loss for very rare classes. Evaluate per-class IoU/Dice, not pixel accuracy.

**Data.** Masks are expensive to label: use pretrained backbones, augmentation applied identically to image and mask, and promptable models (SAM) to speed up annotation.
`,
  traps: [
    { trap: "Pixel accuracy is a good segmentation metric.", why: "With dominant background, a model predicting background everywhere scores highly. Use IoU/Dice per class and mIoU." },
    { trap: "U-Net skips add encoder features to the decoder like ResNet.", why: "U-Net concatenates them along the channel axis, preserving both high-resolution detail and decoder context." },
    { trap: "Augment the image only.", why: "Geometric augmentations (flip, crop, rotate) must be applied identically to the mask, or labels no longer match pixels." },
  ],
  say: {
    prompt: "How would you build and evaluate a model to segment tumours in medical scans?",
    secs: 60,
    check: ["Semantic segmentation; U-Net-style encoder–decoder with skip connections", "Pretrained encoder; augmentation applied to image and mask together", "Loss for imbalance: Dice / cross-entropy + Dice / focal", "Metrics: Dice/IoU per class (not pixel accuracy)", "Validation by patient; clinical error analysis"],
    followups: [
      { q: "Dice vs IoU?", a: "Both measure overlap; Dice = 2·IoU/(1 + IoU), so it's always ≥ IoU and weights true positives twice. Rankings of models are the same." },
      { q: "What do U-Net skip connections recover?", a: "Fine spatial detail (edges, small structures) lost during downsampling, by concatenating high-resolution encoder features into the decoder at each scale." },
      { q: "Instance vs semantic segmentation?", a: "Semantic labels each pixel with a class only; instance separates individual objects of the same class with their own masks." },
    ],
    answer: `I'd treat it as semantic segmentation with a U-Net-style model: a pretrained encoder that downsamples to capture context, a decoder that upsamples back to full resolution, and skip connections that concatenate encoder features at each scale to recover fine boundaries. Augmentations like flips, crops and intensity changes would be applied identically to the scan and its mask.

Because the tumour is a tiny fraction of the pixels, I'd train with cross-entropy plus Dice loss, or focal loss, and evaluate with Dice and IoU for the tumour class rather than pixel accuracy, which would reward predicting background everywhere. I'd split train and validation by patient to avoid leakage, and review failure cases with clinicians, especially small or low-contrast lesions.`,
    avoid: ["Reporting pixel accuracy", "Augmenting images without masks"],
  },
  terms: [["Semantic / instance / panoptic", "Class per pixel / separate object masks / both."], ["Dice coefficient", "2TP/(2TP + FP + FN)."], ["mIoU", "Mean IoU over classes."], ["U-Net", "Encoder–decoder with concatenation skip connections."]],
  sources: [D.unet, D.d2l],
});
Q({ id: "dl-seg-1", d: 1, secs: 30, prompt: "TP = 80, FP = 20, FN = 20 pixels. Dice coefficient?", answer: 0.8, tol: 0.002, explain: "2·80/(160 + 20 + 20) = 0.8.", py: "tp, fp, fn = 80, 20, 20\nanswer = 2*tp/(2*tp+fp+fn)" });
Q({ id: "dl-seg-2", d: 1, secs: 30, prompt: "Same counts. IoU? (3 decimals)", answer: 0.667, tol: 0.002, explain: "80/120.", py: "tp, fp, fn = 80, 20, 20\nanswer = tp/(tp+fp+fn)" });
Q({ id: "dl-seg-3", d: 2, secs: 45, prompt: "A model has IoU 0.5 on a class. Its Dice score? (3 decimals)", answer: 0.667, tol: 0.002, explain: "Dice = 2·IoU/(1 + IoU) = 1/1.5.", py: "i = 0.5\nanswer = 2*i/(1+i)" });
Q({ id: "dl-seg-4", d: 2, secs: 45, prompt: "10,000-pixel image, 100 tumour pixels, model predicts all background. Pixel accuracy?", answer: 0.99, tol: 0.002, explain: "9,900/10,000 correct, yet tumour Dice/IoU = 0.", py: "answer = (10000-100)/10000" });
C("dl-seg-c1", "Dice vs IoU", "Dice = 2TP/(2TP + FP + FN) = 2·IoU/(1 + IoU).");

L("dl-interpret-adversarial", CV, "Interpreting networks and adversarial examples", "Saliency and Grad-CAM, and why tiny input changes can fool a classifier.", {
  kind: "concept", mins: 20, prereq: ["dl-backprop", "dl-conv"],
  hook: "Adding noise invisible to humans turns a panda into a 'gibbon' with 99% confidence. And a heat-map shows your X-ray model looking at the hospital's text marker. How are both found?",
  intuition: `
**The situation.** Vision models are hard to inspect, yet you need to know *what* they rely on (shortcuts, spurious cues) and *how fragile* they are.

**Interpretation.** Gradients tell you which input pixels most affect the output.

- **Saliency maps:** magnitude of $\\partial(\\text{class score})/\\partial(\\text{pixel})$. Noisy but quick.
- **Grad-CAM:** weight the last conv layer's feature maps by the average gradient of the class score, sum, apply ReLU, upsample: a coarse heat-map of where the evidence is. Widely used for sanity checks (is the model looking at the lesion or at a ruler?).
- **Occlusion:** slide a grey patch over the image and watch the score drop.

**Adversarial examples.** The same gradients show how to *change* the prediction: nudge every pixel slightly in the direction that increases the loss. In high dimensions, many tiny changes add up to a big change in the output, even though each pixel barely moves. **FGSM** does this in one step.

**Defences.** Adversarial training (train on attacked examples), input preprocessing, certified methods; none is free.
`,
  maths: `
**In one breath.** FGSM: $x' = x + \\epsilon\\,\\text{sign}(\\nabla_x L(x, y))$; for a linear score $w^\\top x$, the change is $\\epsilon\\|w\\|_1$, which grows with dimension; Grad-CAM $= \\text{ReLU}\\big(\\sum_k \\alpha_kA^k\\big)$ with $\\alpha_k = \\text{mean}_{ij}\\,\\partial y^c/\\partial A^k_{ij}$.

**Worked examples.**

- FGSM with $\\epsilon = 0.1$ on $x = (0.5, 0.5)$ with gradient signs $(+, -)$: $x' = (0.6, 0.4)$.
- Linear model with 1,000 inputs, each $|w_i| = 0.01$, perturbation $\\epsilon = 0.01$ per input aligned with $\\text{sign}(w)$: score changes by $1000 \\times 0.01 \\times 0.01 = 0.1$, while each input moved only 0.01. At image scale (150,000 inputs) the same per-pixel nudge moves the score 150× more.

| Method | Uses | Output |
|---|---|---|
| Saliency | input gradients | pixel heat-map |
| Grad-CAM | gradients at last conv layer | coarse class heat-map |
| Occlusion | repeated forward passes | region importance |
| Integrated gradients | gradient path integral | attribution with axioms |
`,
  practice: `
**Use interpretation for debugging, not proof.** Check that the model attends to sensible regions; look for shortcuts (watermarks, borders, scanner IDs). Saliency methods can look plausible even for random networks; run sanity checks.

**Robustness checks.** Evaluate on corrupted/shifted data (blur, noise, lighting), and on adversarial attacks if the setting is security-relevant (fraud, content moderation, autonomous driving).
`,
  traps: [
    { trap: "Adversarial examples mean the model is badly overfit.", why: "They arise largely from models being too linear in high dimensions: many tiny aligned changes add up. Even well-generalising models are vulnerable." },
    { trap: "A Grad-CAM heat-map proves why the model decided.", why: "It shows where gradients are large at one layer, a useful hint, not a causal explanation. Confirm with interventions like occlusion or counterfactual edits." },
    { trap: "Adversarial training is a free robustness upgrade.", why: "It's expensive (attacks inside the training loop) and usually lowers clean accuracy somewhat." },
  ],
  say: {
    prompt: "How would you check what a vision model is looking at, and what are adversarial examples?",
    secs: 45,
    check: ["Saliency / Grad-CAM / occlusion to locate evidence", "Use to find shortcuts and spurious cues; not proof", "Adversarial example: tiny perturbation that flips the prediction", "FGSM: x + ε·sign(∇ₓL); high-dimensional linearity explanation", "Defences: adversarial training (cost), robustness testing"],
    followups: [
      { q: "How does Grad-CAM work?", a: "Take the gradient of the class score with respect to the last conv layer's feature maps, average it per channel to get weights, take the weighted sum of the maps, ReLU it and upsample to the image size." },
      { q: "Why are high-dimensional models vulnerable to small perturbations?", a: "A perturbation of size ε per input aligned with the weights changes a linear score by ε‖w‖₁, which grows with the number of inputs; images have hundreds of thousands." },
      { q: "What is a shortcut and how do you catch it?", a: "A spurious cue correlated with the label in training (hospital markers, backgrounds). Catch it with attribution maps, slice-based evaluation and testing on data from new sources." },
    ],
    answer: `To see what a vision model relies on, I'd use gradient-based attribution: saliency maps or, better, Grad-CAM, which weights the last convolutional feature maps by the average gradient of the class score to give a heat-map of the evidence, plus occlusion tests that grey out regions and watch the score. These are great for catching shortcuts, like a model reading a hospital's text marker instead of the lung, though they're hints, not proof.

Adversarial examples are inputs changed by an imperceptible amount that flip the prediction. FGSM, for example, moves every pixel by epsilon in the sign of the loss gradient; because models are fairly linear in very high dimensions, those tiny aligned changes add up to a large change in the output. Adversarial training improves robustness but costs compute and usually some clean accuracy.`,
    avoid: ["“Heat-maps explain the decision”", "Blaming adversarial vulnerability purely on overfitting"],
  },
  terms: [["Saliency map", "|∂score/∂pixel|."], ["Grad-CAM", "Gradient-weighted class activation map."], ["FGSM", "x + ε·sign(∇ₓL)."], ["Shortcut learning", "Relying on spurious cues correlated with labels."]],
  sources: [D.fgsm, D.csCNN],
});
Q({ id: "dl-adv-1", d: 1, secs: 30, prompt: "FGSM with ε = 0.1 on x = (0.5, 0.5) when the loss gradient has signs (+, −). First component of x′?", answer: 0.6, tol: 0.002, explain: "0.5 + 0.1·(+1) = 0.6 (second becomes 0.4).", py: "import numpy as np\nx = np.array([.5,.5]); g = np.array([2.0,-3.0])\nanswer = float((x + 0.1*np.sign(g))[0])", packages: ["numpy"] });
Q({ id: "dl-adv-2", d: 2, secs: 60, prompt: "Linear score wᵀx with 1,000 inputs, each |w_i| = 0.01. Perturbation δ = 0.01·sign(w). Change in score?", answer: 0.1, tol: 0.002, explain: "ε‖w‖₁ = 0.01 × 1000 × 0.01 = 0.1.", py: "import numpy as np\nw = np.full(1000, 0.01)*np.where(np.arange(1000)%2, 1, -1)\nanswer = float(w @ (0.01*np.sign(w)))", packages: ["numpy"] });
Q({ id: "dl-adv-3", d: 2, secs: 60, prompt: "Same per-input change (0.01, aligned) but 150,000 inputs with |w_i| = 0.01. Change in score?", answer: 15, tol: 0.02, explain: "0.01 × 150,000 × 0.01 = 15: dimension amplifies tiny perturbations.", py: "answer = 0.01*150000*0.01" });
Q({ id: "dl-adv-4", d: 1, secs: 30, prompt: "Grad-CAM weights each feature map of the last conv layer by…", options: ["its mean activation", "the average gradient of the class score w.r.t. that map", "a random value", "the input pixel gradient"], answer: 1, explain: "α_k = spatial mean of ∂y^c/∂A^k.", py: "answer = 1" });
C("dl-adv-c1", "FGSM", "x′ = x + ε·sign(∇ₓL); linear score shifts by ε‖w‖₁.");

L("dl-cv-practice", CV, "Computer vision practice", "Five interview scenarios on ViTs, detection, segmentation and robustness.", {
  kind: "interview", mins: 25, prereq: ["dl-vit", "dl-detection", "dl-segmentation", "dl-interpret-adversarial"],
  hook: "Answer each scenario out loud in about a minute, then open it and tick off the points the interviewer is listening for.",
}, [
  iq("Design a system to count people in CCTV frames for store analytics.", "Use a pretrained one-stage detector (YOLO-family) fine-tuned on in-store footage, NMS tuned for crowded scenes (or density-map counting for very crowded areas), tracking across frames to avoid double counting, privacy (no face storage, on-device processing), and evaluation with counting error plus detection mAP per camera.", ["Detector choice and fine-tuning", "Crowding: NMS / density estimation", "Tracking across frames", "Privacy and deployment", "Metrics per camera"]),
  iq("Your skin-lesion classifier scores 95% in validation but 70% at a new clinic. What happened and what do you do?", "Domain shift: different cameras, lighting, skin tones or a shortcut (rulers, markers) the model learned. Use Grad-CAM to check what it looks at, evaluate by site/subgroup, collect data from the new clinic, augment for lighting/colour, fine-tune, and validate per site before deployment.", ["Domain shift / shortcut", "Attribution check", "Subgroup/site evaluation", "Collect + fine-tune, augmentation"]),
  iq("When would you choose a ViT over a CNN for a new vision task?", "When strong pretrained ViT backbones (CLIP, DINO) suit the domain, data is plentiful, global context matters, or the task is multimodal. Prefer CNNs for small data, edge latency or high-resolution dense tasks without good pretrained ViTs; benchmark both.", ["Pretraining availability / data size", "Global context / multimodal", "CNNs for edge/small data", "Benchmark"]),
  iq("Explain mAP@0.5 vs mAP@[0.5:0.95].", "mAP@0.5 counts a detection correct if IoU ≥ 0.5, rewarding finding objects; COCO mAP averages AP over IoU thresholds 0.5 to 0.95 in steps of 0.05, rewarding precise localisation too. Report both; which matters depends on whether tight boxes are needed.", ["IoU threshold meaning", "Averaging over thresholds", "Localisation precision"]),
  iq("How do you make a vision model robust for a self-driving perception stack?", "Diverse data (weather, night, geographies), corruption and shift testing, adversarial/robustness evaluation for safety-critical classes, uncertainty estimates and fallbacks, sensor fusion, continuous monitoring and data collection from failure cases (active learning).", ["Coverage of conditions", "Robustness testing", "Uncertainty + fallback", "Monitoring and data flywheel"]),
]);
