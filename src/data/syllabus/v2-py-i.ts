/**
 * v2 Python, part I: PyTorch (tensors and autograd, nn.Module and the training loop, data loading,
 * devices and debugging, interview) and Keras (Sequential/functional APIs, compile/fit/callbacks,
 * saving and transfer learning, interview). Fixed ids (py2-*). Checks recompute shapes, parameter
 * counts and gradients in plain Python/NumPy (no torch or tensorflow in Pyodide).
 */
import { CHECKED, iq, lessonWriter } from "./v2-shared";

const { L, Q, C } = lessonWriter("python");
const PT = "PyTorch";
const KR = "Keras";
const src = (label: string, url: string) => ({ label, url, checked: CHECKED });
const S = {
  tensors: src("PyTorch tutorials: tensors", "https://docs.pytorch.org/tutorials/beginner/basics/tensorqs_tutorial.html"),
  autograd: src("PyTorch tutorials: automatic differentiation with torch.autograd", "https://docs.pytorch.org/tutorials/beginner/basics/autogradqs_tutorial.html"),
  build: src("PyTorch tutorials: build the neural network", "https://docs.pytorch.org/tutorials/beginner/basics/buildmodel_tutorial.html"),
  optim: src("PyTorch tutorials: optimizing model parameters", "https://docs.pytorch.org/tutorials/beginner/basics/optimization_tutorial.html"),
  data: src("PyTorch tutorials: datasets and dataloaders", "https://docs.pytorch.org/tutorials/beginner/basics/data_tutorial.html"),
  dataApi: src("PyTorch docs: torch.utils.data", "https://docs.pytorch.org/docs/2.15/data.html"),
  cuda: src("PyTorch docs: CUDA semantics", "https://docs.pytorch.org/docs/2.15/notes/cuda.html"),
  tuning: src("PyTorch tutorials: performance tuning guide", "https://docs.pytorch.org/tutorials/recipes/recipes/tuning_guide.html"),
  saving: src("PyTorch tutorials: saving and loading models", "https://docs.pytorch.org/tutorials/beginner/saving_loading_models.html"),
  kSeq: src("Keras guide: the Sequential model", "https://keras.io/guides/sequential_model/"),
  kFunc: src("Keras guide: the functional API", "https://keras.io/guides/functional_api/"),
  kTrain: src("Keras guide: training and evaluation with the built-in methods", "https://keras.io/guides/training_with_built_in_methods/"),
  kFitApi: src("Keras API: model training APIs (compile, fit, evaluate)", "https://keras.io/api/models/model_training_apis/"),
  kCb: src("Keras API: callbacks", "https://keras.io/api/callbacks/"),
  kES: src("Keras API: EarlyStopping callback", "https://keras.io/api/callbacks/early_stopping/"),
  kSave: src("Keras guide: save, serialize and export models", "https://keras.io/guides/serialization_and_saving/"),
  kTL: src("Keras guide: transfer learning and fine-tuning", "https://keras.io/guides/transfer_learning/"),
};
const NP = ["numpy"];

// ═════════════════════════ PyTorch ═════════════════════════

// ───────────────────────── Tensors and autograd ─────────────────────────

L("py2-pt-tensors", PT, "Tensors and autograd", "Creating tensors, dtypes and shapes, reshape vs view, broadcasting, the NumPy bridge, requires_grad, backward, gradient accumulation, no_grad and detach.", {
  kind: "concept", mins: 25, mathsLabel: "Code",
  hook: "You call `loss.backward()` twice and the gradient doubles. Bug or feature — and what single line fixes your training loop?",
  intuition: `
**The situation.** ML engineer screens ask you to write a small PyTorch model live, and the first follow-ups are about shapes and gradients.

**The idea.** A **tensor** is PyTorch's ndarray: one dtype, a shape, and a **device** (CPU or GPU). Floats default to \`float32\` (NumPy defaults to float64); integers to \`int64\`. Most NumPy habits carry over: slicing, broadcasting, \`@\` for matrix multiply, \`sum(dim=…)\` instead of \`axis=\`.

**Autograd.** Set \`requires_grad=True\` on a tensor (model parameters have it already) and PyTorch records every operation on it in a graph. \`loss.backward()\` walks that graph backwards with the chain rule and **adds** ∂loss/∂param into each parameter's \`.grad\`. Three consequences:

- Gradients **accumulate** across backward calls, so you zero them every step (\`optimizer.zero_grad()\`). Accumulation is also a feature: it lets you simulate a bigger batch.
- \`backward()\` needs a scalar (or an explicit gradient argument); you reduce the loss with \`mean()\` first.
- Operations you don't want tracked (evaluation, metric maths, updating weights by hand) go inside \`torch.no_grad()\`, and \`detach()\` gives a view that is cut from the graph.
`,
  maths: `
**In one breath.** \`torch.tensor\`, \`zeros\`, \`randn\`, \`arange\`; \`shape\`, \`dtype\`, \`device\`; \`reshape\` (copies if needed) vs \`view\` (needs contiguous memory); \`from_numpy\` shares memory; \`requires_grad\` → \`backward()\` → \`.grad\` (accumulates); \`no_grad\`, \`detach\`, \`.item()\`.

\`\`\`python
import numpy as np, torch
x = torch.tensor([[1., 2.], [3., 4.]])
print(x.shape, x.dtype)                     # torch.Size([2, 2]) torch.float32
print(torch.tensor([1, 2]).dtype)           # torch.int64
print((x @ x).tolist())                     # [[7.0, 10.0], [15.0, 22.0]]   matrix product
print((x * x).tolist())                     # [[1.0, 4.0], [9.0, 16.0]]     element-wise
print(x.sum(dim=0).tolist(), x.mean().item())   # [4.0, 6.0] 2.5
print((torch.ones(2, 1) + torch.tensor([10., 20., 30.])).shape)   # torch.Size([2, 3]) broadcast

t = torch.arange(6).reshape(2, 3).T          # transpose: same data, non-contiguous
print(t.reshape(-1).tolist())               # [0, 3, 1, 4, 2, 5]
# t.view(-1)  -> RuntimeError: view needs contiguous memory; use reshape or t.contiguous().view(-1)

a = np.zeros(3); shared = torch.from_numpy(a); a[0] = 5
print(shared[0].item())                     # 5.0  from_numpy shares memory (torch.tensor(a) copies)

w = torch.tensor(2.0, requires_grad=True)
y = w ** 2 + 3 * w                          # y = 10
y.backward()
print(w.grad.item())                        # 7.0  dy/dw = 2w + 3
(w ** 2 + 3 * w).backward()
print(w.grad.item())                        # 14.0  accumulated, not replaced
w.grad.zero_()

with torch.no_grad():
    z = w * 3
print(z.requires_grad, w.detach().requires_grad)   # False False

X = torch.randn(5, 3); wv = torch.zeros(3, requires_grad=True)
loss = ((X @ wv - 1) ** 2).mean()           # scalar
loss.backward()
print(wv.grad.shape)                        # torch.Size([3]) = -2/5 * X.T @ ones(5)
\`\`\`

**Cost.** The graph stores intermediate activations until \`backward()\` runs; that's why training needs far more memory than inference, and why evaluation goes inside \`no_grad()\` (or \`torch.inference_mode()\`).

**Gotchas.** In-place ops on tensors needed for backward (\`x += 1\`, \`relu_\`) can raise "modified by an inplace operation". \`.numpy()\` fails on tensors that require grad or live on the GPU: use \`t.detach().cpu().numpy()\`. Mixing float64 NumPy data with float32 weights raises dtype errors; convert with \`torch.as_tensor(a, dtype=torch.float32)\`.
`,
  practice: `
**Shape discipline.** Write the shape next to every line while live coding: (batch, features) → (batch, hidden) → (batch, classes). Most PyTorch bugs are shape or dtype bugs.

**When interviewers ask "implement X from scratch".** Use tensors with \`requires_grad\` and a manual update inside \`no_grad()\`: \`w -= lr * w.grad; w.grad.zero_()\`. That shows you know what the optimiser does.
`,
  traps: [
    { trap: "`backward()` overwrites `.grad` with the new gradient.", why: "It adds to .grad. Without zero_grad each step, gradients from earlier batches pile up." },
    { trap: "`view` and `reshape` are the same.", why: "view never copies and fails on non-contiguous tensors (e.g. after .T); reshape returns a view when possible and copies otherwise." },
    { trap: "`torch.from_numpy(a)` makes an independent copy.", why: "It shares memory with the array; changing one changes the other. torch.tensor(a) copies." },
  ],
  say: {
    prompt: "Explain how autograd works in PyTorch and why we call zero_grad every step.",
    secs: 45,
    check: ["requires_grad tensors record operations into a graph", "backward applies the chain rule from a scalar loss", "Gradients are added into .grad (accumulate)", "zero_grad clears them each step; accumulation can simulate bigger batches", "no_grad / detach for evaluation and manual updates; graph memory"],
    followups: [
      { q: "Why must the loss be a scalar for backward()?", a: "backward computes the gradient of one number; for a non-scalar you must pass the upstream gradient (a vector-Jacobian product), so we reduce with mean or sum." },
      { q: "What does detach do?", a: "Returns a tensor sharing the same data but outside the graph, so no gradients flow through it." },
      { q: "no_grad vs model.eval()?", a: "no_grad stops graph recording (memory and speed); eval switches layers like dropout and batch norm to inference behaviour. Evaluation needs both." },
    ],
    answer: `When a tensor has requires_grad set, as model parameters do, PyTorch records each operation applied to it, building a graph from the parameters to the loss. Calling loss.backward() on the scalar loss walks that graph backwards with the chain rule and adds the gradient of the loss with respect to each parameter into its .grad attribute. Because it adds rather than overwrites, gradients from the previous batch would still be there, so each training step calls optimizer.zero_grad() before backward. The accumulation is useful when you deliberately want it, for example summing gradients over several small batches before one optimiser step. For evaluation or manual weight updates I use torch.no_grad() so nothing is recorded, which also saves memory.`,
    avoid: ["Saying backward replaces gradients", "Forgetting the loss must be scalar"],
  },
  terms: [["Tensor", "n-dimensional array with dtype, shape and device."], ["Autograd", "Automatic differentiation by recording operations."], ["Gradient accumulation", ".grad sums over backward calls until zeroed."], ["detach", "Same data, cut from the graph."]],
  sources: [S.tensors, S.autograd],
});
Q({ id: "py2-ptt-1", d: 1, secs: 30, prompt: "`w = torch.tensor(2.0, requires_grad=True)`, `y = w**2 + 3*w`, `y.backward()`. What is `w.grad`?", answer: 7, tol: 0.01, explain: "dy/dw = 2w + 3 = 7.", py: "f = lambda w: w ** 2 + 3 * w\nh = 1e-6\nanswer = round((f(2 + h) - f(2 - h)) / (2 * h), 4)" });
Q({ id: "py2-ptt-2", d: 1, secs: 30, prompt: "With `w = 2.0`, you build `y = 3 * w` and call `backward()`, then build it again and call `backward()` again without zeroing. What is `w.grad`?", answer: 6, tol: 0.01, explain: "Each backward adds 3; gradients accumulate.", py: "grad = 0.0\nfor _ in range(2):\n    grad += 3.0\nanswer = grad" });
Q({ id: "py2-ptt-3", d: 1, secs: 30, prompt: "`torch.ones(4, 1) + torch.ones(3)` — how many elements does the result have?", answer: 12, tol: 0.5, explain: "Broadcasting (4, 1) with (3,) gives (4, 3); same rules as NumPy.", py: "import numpy as np\nanswer = (np.ones((4, 1)) + np.ones(3)).size", packages: NP });
Q({ id: "py2-ptt-4", d: 2, secs: 60, prompt: "`X = [[1, 0], [0, 1], [1, 1]]`, `w = zeros(2, requires_grad=True)`, `loss = ((X @ w - 1) ** 2).mean()`. After `backward()`, what is `w.grad[0]`? (3 decimals)", answer: -1.333, tol: 0.002, explain: "∂/∂w = (2/n) Xᵀ(Xw − 1) = (2/3) Xᵀ(−1, −1, −1) = (−4/3, −4/3).", py: "import numpy as np\nX = np.array([[1., 0.], [0., 1.], [1., 1.]]); w = np.zeros(2)\ng = 2 / len(X) * X.T @ (X @ w - 1)\nanswer = round(float(g[0]), 3)", packages: NP });
Q({ id: "py2-ptt-5", d: 1, secs: 30, prompt: "How many bytes does one element of a default floating-point PyTorch tensor (`torch.randn`) take?", answer: 4, tol: 0.5, explain: "PyTorch's default float dtype is float32; NumPy's is float64 (8 bytes).", py: "import numpy as np\nanswer = np.dtype('float32').itemsize", packages: NP });
C("py2-ptt-c1", "Autograd in one line", "requires_grad → ops recorded → loss.backward() ADDS dloss/dparam into .grad → zero_grad each step.");
C("py2-ptt-c2", "Tensor gotchas", "Default float32 · view needs contiguous (reshape doesn't) · from_numpy shares memory · .detach().cpu().numpy().");

// ───────────────────────── nn.Module and the training loop ─────────────────────────

L("py2-pt-module", PT, "nn.Module and the training loop", "Defining models with nn.Module, counting parameters, losses that expect logits, optimisers, the five-line training step, train vs eval mode and checkpointing.", {
  kind: "concept", mins: 30, mathsLabel: "Code",
  hook: "Write a training loop from memory: forward, loss, zero_grad, backward, step. Now — where do model.train() and model.eval() go, and why does validation accuracy jump around if you forget them?",
  intuition: `
**The situation.** "Write a training loop for this model" is the PyTorch equivalent of FizzBuzz in ML interviews. Order mistakes and missing mode switches are what interviewers look for.

**The idea.**

- **nn.Module.** Subclass it, create layers in \`__init__\` (so their parameters are registered), and define the computation in \`forward\`. Call the model as \`model(x)\`, not \`model.forward(x)\`, so hooks run. \`nn.Sequential\` stacks simple layers.
- **Outputs are logits.** \`nn.CrossEntropyLoss\` applies log-softmax itself and takes raw scores of shape (batch, classes) plus integer class indices (int64) of shape (batch,). \`nn.BCEWithLogitsLoss\` is the binary version. Don't add a softmax/sigmoid before them.
- **Optimiser.** \`torch.optim.AdamW(model.parameters(), lr=1e-3)\` holds references to the parameters and updates them from \`.grad\`.
- **One training step:** forward → loss → \`zero_grad\` → \`backward\` → \`step\` (zeroing at the start of the step works too; it just has to happen before backward).
- **Modes.** \`model.train()\` turns on dropout and batch-norm batch statistics; \`model.eval()\` turns dropout off and uses running statistics. Evaluation = \`eval()\` + \`no_grad()\`.
`,
  maths: `
**In one breath.** Layers in \`__init__\`, maths in \`forward\`; Linear(in, out) has in·out + out parameters; CrossEntropyLoss(logits, long targets); \`train()\` / \`eval()\`; save \`state_dict()\`.

\`\`\`python
import torch
from torch import nn

class MLP(nn.Module):
    def __init__(self, d_in, d_hidden, n_classes, p=0.2):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(d_in, d_hidden), nn.ReLU(), nn.Dropout(p),
            nn.Linear(d_hidden, n_classes),
        )
    def forward(self, x):            # x: (batch, d_in)
        return self.net(x)           # (batch, n_classes) raw logits

model = MLP(784, 128, 10)
print(sum(p.numel() for p in model.parameters()))   # 101770 = 784*128 + 128 + 128*10 + 10
loss_fn = nn.CrossEntropyLoss()
opt = torch.optim.AdamW(model.parameters(), lr=1e-3)
print(round(loss_fn(torch.tensor([[2., 1., 0.]]), torch.tensor([0])).item(), 4))   # 0.4076

def train_epoch(model, loader):
    model.train()                    # dropout on
    total = 0.0
    for xb, yb in loader:
        logits = model(xb)
        loss = loss_fn(logits, yb)
        opt.zero_grad()
        loss.backward()
        opt.step()
        total += loss.item() * len(xb)       # .item(): a float, not a graph
    return total / len(loader.dataset)

@torch.no_grad()
def evaluate(model, loader):
    model.eval()                     # dropout off, BN uses running stats
    correct = 0
    for xb, yb in loader:
        correct += (model(xb).argmax(dim=1) == yb).sum().item()
    return correct / len(loader.dataset)

for epoch in range(10):
    tr_loss = train_epoch(model, train_dl)
    val_acc = evaluate(model, val_dl)

torch.save({"model": model.state_dict(), "opt": opt.state_dict(), "epoch": epoch}, "ckpt.pt")
ckpt = torch.load("ckpt.pt")
model.load_state_dict(ckpt["model"]); opt.load_state_dict(ckpt["opt"])
\`\`\`

**Cost.** One step costs about 3× a forward pass (forward + backward is roughly 2× forward). Memory: parameters + gradients + optimiser state (Adam keeps two extra tensors per parameter) + activations, which grow with batch size.

**Gotchas.** \`total += loss\` (without \`.item()\`) keeps every batch's graph alive and leaks memory. Layers stored in a plain Python list aren't registered: use \`nn.ModuleList\`. Schedulers step after the optimiser (\`opt.step(); scheduler.step()\`).
`,
  practice: `
**Sanity checks before a long run.** Initial loss ≈ log(n_classes) for balanced classes (2.30 for 10); overfit a single batch to near-zero loss; check that \`model.parameters()\` is non-empty and that loss decreases in the first hundred steps.

**Saving.** Save the \`state_dict\` (the recommended way) plus the optimiser state and epoch for resuming; rebuild the model class and \`load_state_dict\` to restore; call \`eval()\` before inference.
`,
  traps: [
    { trap: "Add `softmax` at the end of the model before `CrossEntropyLoss`.", why: "CrossEntropyLoss applies log-softmax internally; a second softmax squashes the logits and slows learning. Output raw logits." },
    { trap: "Calling `model.eval()` stops gradient tracking.", why: "eval() only changes layer behaviour (dropout, batch norm). Use torch.no_grad() to stop tracking." },
    { trap: "`total_loss += loss` is a harmless way to log the loss.", why: "It keeps the computation graph of every batch alive. Use loss.item()." },
  ],
  say: {
    prompt: "Write and explain a minimal PyTorch training and validation loop for a classifier.",
    secs: 60,
    check: ["nn.Module with layers in __init__ and forward returning logits", "CrossEntropyLoss on logits + int64 targets", "Step order: forward, loss, zero_grad, backward, step", "model.train() for training; model.eval() + no_grad() for validation", "loss.item() for logging; save state_dict"],
    followups: [
      { q: "What should the initial loss be for 10 balanced classes?", a: "About ln 10 ≈ 2.30, because a fresh model predicts roughly uniform probabilities." },
      { q: "Why use state_dict instead of torch.save(model)?", a: "state_dict is a plain mapping of tensors, robust to code refactors; saving the whole model pickles the class path and breaks when code moves." },
      { q: "How do you add a learning-rate schedule?", a: "Create e.g. torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max) and call scheduler.step() after opt.step() (per epoch or per step, as designed)." },
    ],
    answer: `I'd define an nn.Module whose __init__ creates the layers and whose forward returns raw logits of shape batch by classes. The loss is nn.CrossEntropyLoss, which takes those logits and integer class labels and applies log-softmax itself. The optimiser is AdamW over model.parameters(). Each epoch I call model.train(), then for every batch: compute logits, compute the loss, optimizer.zero_grad(), loss.backward(), optimizer.step(), and accumulate loss.item() for logging. For validation I call model.eval() so dropout and batch norm behave for inference, wrap the loop in torch.no_grad() so no graph is built, and count argmax predictions that match. I'd checkpoint the model and optimiser state_dicts.`,
    avoid: ["Softmax before CrossEntropyLoss", "Forgetting eval() or no_grad() in validation"],
  },
  terms: [["nn.Module", "Base class; registers parameters and sub-modules."], ["Logits", "Raw, unnormalised class scores."], ["state_dict", "Mapping of parameter and buffer names to tensors."], ["train()/eval()", "Switch dropout and batch-norm behaviour."]],
  sources: [S.build, S.optim, S.saving],
});
Q({ id: "py2-ptm-1", d: 1, secs: 45, prompt: "How many parameters does `nn.Sequential(nn.Linear(784, 128), nn.ReLU(), nn.Linear(128, 10))` have?", answer: 101770, tol: 0.5, explain: "784·128 + 128 + 128·10 + 10.", py: "layers = [(784, 128), (128, 10)]\nanswer = sum(i * o + o for i, o in layers)" });
Q({ id: "py2-ptm-2", d: 2, secs: 60, prompt: "`nn.CrossEntropyLoss()(torch.tensor([[2., 1., 0.]]), torch.tensor([0]))`? (4 decimals)", answer: 0.4076, tol: 0.0002, explain: "−log softmax: log(e² + e¹ + e⁰) − 2 = 2.4076 − 2.", py: "import numpy as np\nz = np.array([2., 1., 0.])\nanswer = round(float(np.log(np.exp(z).sum()) - z[0]), 4)", packages: NP });
Q({ id: "py2-ptm-3", d: 1, secs: 30, prompt: "Expected initial cross-entropy loss of a fresh model on 10 balanced classes? (2 decimals)", answer: 2.3, tol: 0.01, explain: "Uniform predictions give −log(1/10) = ln 10 ≈ 2.30.", py: "import math\nanswer = round(math.log(10), 2)" });
Q({ id: "py2-ptm-4", d: 1, secs: 30, prompt: "Which order is correct inside one training step?", options: ["backward, zero_grad, step, loss", "loss, step, backward, zero_grad", "loss, zero_grad, backward, step", "zero_grad, step, loss, backward"], answer: 2, explain: "Gradients must be cleared before backward fills them, and step uses them afterwards.", py: "opts = [['backward', 'zero_grad', 'step', 'loss'], ['loss', 'step', 'backward', 'zero_grad'], ['loss', 'zero_grad', 'backward', 'step'], ['zero_grad', 'step', 'loss', 'backward']]\ndef ok(o):\n    i = {s: k for k, s in enumerate(o)}\n    return i['loss'] < i['backward'] and i['zero_grad'] < i['backward'] < i['step']\nanswer = [k for k, o in enumerate(opts) if ok(o)][0]" });
Q({ id: "py2-ptm-5", d: 2, secs: 45, prompt: "Plain SGD, lr = 0.1. A weight is 1.0 and its gradient is 0.5 on each of 3 steps, but you forgot `zero_grad`. What is the weight after the 3 steps?", answer: 0.7, tol: 0.001, explain: "Accumulated gradients are 0.5, 1.0, 1.5; updates 0.05 + 0.1 + 0.15 = 0.3. With zeroing it would be 0.85.", py: "w, g, lr = 1.0, 0.0, 0.1\nfor _ in range(3):\n    g += 0.5\n    w -= lr * g\nanswer = round(w, 4)" });
C("py2-ptm-c1", "Training step", "model.train(); logits = model(xb); loss = loss_fn(logits, yb); opt.zero_grad(); loss.backward(); opt.step()");
C("py2-ptm-c2", "Evaluation", "model.eval() + torch.no_grad(); argmax on logits; no softmax needed for CrossEntropyLoss.");

// ───────────────────────── Data loading ─────────────────────────

L("py2-pt-data", PT, "Dataset, DataLoader and batching", "Writing a Dataset, what DataLoader's batch_size, shuffle, drop_last, num_workers and pin_memory do, splitting, and padding variable-length sequences with collate_fn.", {
  kind: "concept", mins: 20, mathsLabel: "Code",
  hook: "1,000 samples, batch size 64: how many steps per epoch, how big is the last batch, and why might your GPU sit idle half the time?",
  intuition: `
**The situation.** Data loading is the part of PyTorch interviewers expect you to write without help, and the usual cause of slow training.

**The idea.**

- A **Dataset** answers two questions: how many samples (\`__len__\`) and what is sample i (\`__getitem__\`). Do expensive work (reading images, tokenising) lazily in \`__getitem__\`, or once in \`__init__\` if it fits in memory. \`TensorDataset(X, y)\` covers in-memory tensors.
- A **DataLoader** wraps a Dataset and yields **batches**: it picks indices (shuffled if \`shuffle=True\`), calls \`__getitem__\` for each, and **collates** the samples into stacked tensors.
  - \`batch_size\`: samples per step; the epoch has ⌈n / batch_size⌉ steps, the last one smaller unless \`drop_last=True\`.
  - \`shuffle=True\` for training, False for validation/test.
  - \`num_workers>0\`: load batches in parallel processes so the GPU isn't waiting; \`pin_memory=True\` speeds CPU→GPU copies.
  - \`collate_fn\`: custom batching, e.g. padding sequences of different lengths.
- **Splitting.** \`random_split(ds, [n_train, n_val], generator=…)\` for i.i.d. data; for time or grouped data, split indices yourself and use \`Subset\`.
`,
  maths: `
**In one breath.** \`__len__\` + \`__getitem__\`; steps per epoch = ceil(n / bs); last batch = n − (steps − 1)·bs; shuffle train only; workers for throughput; \`collate_fn\` for padding.

\`\`\`python
import numpy as np, torch
from torch import nn
from torch.utils.data import Dataset, DataLoader, random_split

class Tabular(Dataset):
    def __init__(self, X, y):
        self.X = torch.as_tensor(X, dtype=torch.float32)
        self.y = torch.as_tensor(y, dtype=torch.long)
    def __len__(self):
        return len(self.X)
    def __getitem__(self, i):
        return self.X[i], self.y[i]

ds = Tabular(np.random.rand(1000, 8), np.random.randint(0, 2, 1000))
train_ds, val_ds = random_split(ds, [800, 200], generator=torch.Generator().manual_seed(0))
train_dl = DataLoader(train_ds, batch_size=64, shuffle=True, num_workers=2, pin_memory=True)
val_dl = DataLoader(val_ds, batch_size=256, shuffle=False)
print(len(train_dl), len(val_dl))     # 13 1    (800 / 64 = 12.5 -> 13 steps; last batch 32)
xb, yb = next(iter(train_dl))
print(xb.shape, yb.shape)             # torch.Size([64, 8]) torch.Size([64])

def pad_collate(batch):               # batch: list of (token_tensor, label)
    seqs, labels = zip(*batch)
    lengths = torch.tensor([len(s) for s in seqs])
    padded = nn.utils.rnn.pad_sequence(seqs, batch_first=True, padding_value=0)
    return padded, lengths, torch.tensor(labels)   # padded: (batch, max_len_in_batch)

text_dl = DataLoader(text_ds, batch_size=32, shuffle=True, collate_fn=pad_collate)
\`\`\`

**Cost.** Padding wastes compute on pad tokens: a batch padded to its longest sequence costs batch × max_len. Sorting or bucketing by length cuts the waste. Workers cost RAM (each holds a copy of the Dataset object).

**Gotchas.** On Windows/macOS, \`num_workers>0\` needs the training code under \`if __name__ == "__main__":\`. Random augmentations in workers need proper seeding (\`worker_init_fn\` or the generator). Returning NumPy float64 from \`__getitem__\` gives float64 batches that clash with float32 weights.
`,
  practice: `
**Is loading the bottleneck?** Time an epoch with the model replaced by a no-op; if it's close to the full epoch time, add workers, pre-process once and cache, or move augmentation to the GPU.

**Batch size choices.** Largest that fits in memory is not always best; with larger batches scale the learning rate (roughly linearly for SGD) and use warm-up. When memory limits you, accumulate gradients over k mini-batches for an effective batch of k × bs.
`,
  traps: [
    { trap: "`shuffle=True` on the validation loader is harmless and safer.", why: "It doesn't change aggregate metrics but makes per-batch outputs non-reproducible and misaligns saved predictions with rows. Shuffle training only." },
    { trap: "`len(loader)` is the number of samples.", why: "It's the number of batches; len(loader.dataset) is the number of samples. Average losses over samples, not batches, when the last batch is smaller." },
    { trap: "Pad every sequence to the dataset's maximum length.", why: "Padding per batch (collate_fn) to the longest in the batch is far cheaper; bucketing by length cuts it further." },
  ],
  say: {
    prompt: "How do you feed a dataset of variable-length text into a PyTorch model efficiently?",
    secs: 45,
    check: ["Dataset with __len__ and __getitem__ returning token tensors and labels", "DataLoader with batch_size, shuffle for train only", "collate_fn that pads to the batch max and returns lengths/mask", "num_workers / pin_memory for throughput", "Bucket by length to reduce padding; mask pads in the model/loss"],
    followups: [
      { q: "How many steps per epoch for 50,000 samples at batch size 128?", a: "ceil(50000 / 128) = 391; the last batch has 80 samples unless drop_last=True." },
      { q: "When would you set drop_last=True?", a: "When a tiny last batch hurts (e.g. batch norm with one sample) or when shapes must be constant, such as some compiled or distributed setups." },
      { q: "How do you split time-ordered data?", a: "By index ranges (past for train, later for validation) with Subset, not random_split." },
    ],
    answer: `I'd write a Dataset whose __getitem__ returns the token IDs for one example as a tensor plus its label, and __len__ the number of examples. The DataLoader shuffles the training set only and uses a collate_fn that pads each batch to the longest sequence in that batch with pad_sequence, returning the padded tensor of shape batch by max length, the lengths or an attention mask, and the labels. The model then ignores pad positions using the mask. To cut wasted computation I'd bucket examples of similar length into the same batch, and I'd use several workers with pin_memory so the GPU isn't waiting for data.`,
    avoid: ["Padding everything to the global maximum", "Confusing len(loader) with dataset size"],
  },
  terms: [["Dataset", "Indexable collection: __len__ and __getitem__."], ["DataLoader", "Batches, shuffles and parallel-loads a Dataset."], ["collate_fn", "Function that merges samples into a batch."], ["drop_last", "Discard the final incomplete batch."]],
  sources: [S.data, S.dataApi],
});
Q({ id: "py2-ptd-1", d: 1, secs: 30, prompt: "1,000 samples, `batch_size=64`, `drop_last=False`. How many batches per epoch?", answer: 16, tol: 0.5, explain: "ceil(1000 / 64) = 16.", py: "import math\nanswer = math.ceil(1000 / 64)" });
Q({ id: "py2-ptd-2", d: 1, secs: 30, prompt: "Same loader: how many samples are in the last batch?", answer: 40, tol: 0.5, explain: "1000 − 15 × 64 = 40.", py: "n, bs = 1000, 64\nanswer = n - (n // bs) * bs if n % bs else bs" });
Q({ id: "py2-ptd-3", d: 1, secs: 30, prompt: "Same data with `drop_last=True`, trained for 10 epochs. How many optimiser steps in total?", answer: 150, tol: 0.5, explain: "15 full batches per epoch × 10.", py: "answer = (1000 // 64) * 10" });
Q({ id: "py2-ptd-4", d: 2, secs: 45, prompt: "A batch has sequences of lengths 3, 7, 5 and 2, padded to the batch maximum. What fraction of the padded tensor is padding? (3 decimals)", answer: 0.393, tol: 0.002, explain: "4 × 7 = 28 slots, 17 real tokens: 11 / 28.", py: "lens = [3, 7, 5, 2]\nslots = len(lens) * max(lens)\nanswer = round((slots - sum(lens)) / slots, 3)" });
Q({ id: "py2-ptd-5", d: 2, secs: 45, prompt: "GPU memory fits batch 16, but you want an effective batch of 64. How many mini-batches do you accumulate gradients over before each `optimizer.step()`?", answer: 4, tol: 0.5, explain: "64 / 16; divide each mini-batch loss by 4 so the sum matches a mean over 64.", py: "answer = 64 // 16" });
C("py2-ptd-c1", "Batch arithmetic", "steps/epoch = ceil(n / bs); last batch = n − (steps − 1)·bs; drop_last → floor(n / bs).");
C("py2-ptd-c2", "Variable-length batches", "collate_fn: pad_sequence to batch max + lengths/mask; bucket by length; shuffle train only.");

// ───────────────────────── Devices and debugging ─────────────────────────

L("py2-pt-devices", PT, "GPUs, devices and debugging", "Moving models and data to a device, asynchronous CUDA and timing, mixed precision, memory budgeting, reproducibility, and a checklist for the common PyTorch errors.", {
  kind: "concept", mins: 25, mathsLabel: "Code",
  hook: "'Expected all tensors to be on the same device', 'mat1 and mat2 shapes cannot be multiplied', 'CUDA out of memory', loss = nan. Which line do you change for each?",
  intuition: `
**The situation.** Interviewers for ML roles ask how you'd debug a training run that crashes or doesn't learn, and how you'd make it fit on a GPU.

**The idea.**

- **Devices.** Every tensor lives on a device. Pick one (\`"cuda"\`, \`"mps"\` on Apple silicon, or \`"cpu"\`), call \`model.to(device)\` once and move every batch with \`xb.to(device)\`. Operations need all inputs on the same device.
- **Asynchrony.** GPU kernels are queued and the Python line returns before the work finishes. Timing without \`torch.cuda.synchronize()\` measures only the queuing; errors may surface on a later line (set \`CUDA_LAUNCH_BLOCKING=1\` to make them appear at the true line).
- **Mixed precision.** \`torch.autocast\` runs matrix multiplies in float16/bfloat16 (faster, half the activation memory); with float16 a \`GradScaler\` scales the loss to stop small gradients underflowing. bfloat16 usually needs no scaler.
- **Memory budget for training.** Roughly: parameters + gradients + optimiser state + activations. With fp32 Adam that's about 16 bytes per parameter before activations (4 weights + 4 grads + 8 for two moment estimates). Activations grow with batch size × sequence length × width.
- **Debugging order.** Shapes and dtypes → devices → can it overfit one batch? → learning rate → data/labels → numerical issues (NaN).
`,
  maths: `
**In one breath.** \`device = "cuda" if available\`; \`model.to(device)\`, \`xb.to(device)\`; synchronise before timing; \`autocast\` + \`GradScaler\` (fp16); memory ≈ 16 B/param for fp32 Adam + activations; overfit one batch first.

\`\`\`python
import time, torch
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = model.to(device)

for xb, yb in train_dl:
    xb, yb = xb.to(device, non_blocking=True), yb.to(device, non_blocking=True)
    with torch.autocast(device_type=device.type, dtype=torch.bfloat16):
        loss = loss_fn(model(xb), yb)
    opt.zero_grad(); loss.backward(); opt.step()

# float16 instead needs a GradScaler
scaler = torch.amp.GradScaler("cuda")
with torch.autocast(device_type="cuda", dtype=torch.float16):
    loss = loss_fn(model(xb), yb)
opt.zero_grad(); scaler.scale(loss).backward(); scaler.step(opt); scaler.update()

# Timing GPU work correctly
torch.cuda.synchronize(); t0 = time.perf_counter()
out = model(xb)
torch.cuda.synchronize(); print(time.perf_counter() - t0)

# Overfit one batch: if loss won't go near 0, the bug is in the model/loss, not the data size
xb, yb = next(iter(train_dl))
for step in range(200):
    loss = loss_fn(model(xb.to(device)), yb.to(device))
    opt.zero_grad(); loss.backward(); opt.step()

torch.manual_seed(0)    # reproducibility: also seed NumPy/random and DataLoader generators
\`\`\`

| Symptom | Likely cause | Fix |
|---|---|---|
| "same device" error | a batch or a new tensor left on CPU | \`.to(device)\`; create tensors with \`device=\` |
| "mat1 and mat2 shapes" | wrong \`in_features\` or missing flatten | print shapes; \`nn.Flatten()\` |
| "expected scalar type Long" | float targets for CrossEntropyLoss | \`yb.long()\` |
| CUDA out of memory | batch too big, graphs kept alive | smaller batch, autocast, \`loss.item()\`, \`no_grad\` in eval, gradient accumulation |
| loss nan / inf | LR too high, log(0), fp16 overflow | lower LR, clip gradients, stable losses, GradScaler/bf16 |
| loss flat | LR too low or too high, frozen params, labels shuffled | LR sweep; check \`requires_grad\`; overfit one batch |

**Gradient clipping.** \`torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)\` between \`backward()\` and \`step()\` stops single bad batches from blowing up the weights.
`,
  practice: `
**Memory maths out loud.** "A 1-billion-parameter model in fp32 is 4 GB of weights; training with Adam needs about 16 GB before activations, so on a 24 GB GPU I'd use bf16 autocast, a smaller batch with gradient accumulation, and activation checkpointing if needed."

**Profiling.** If the GPU is under-used, the DataLoader is usually the bottleneck (workers, pinned memory); \`torch.profiler\` shows where time goes.
`,
  traps: [
    { trap: "`model.to(device)` also moves the batches.", why: "It moves the model's parameters only; every batch (and any tensor you create inside forward) must be moved or created on the device." },
    { trap: "Timing `model(x)` with `time.time()` measures GPU speed.", why: "CUDA calls are asynchronous; synchronise before reading the clock, or you time only kernel launches." },
    { trap: "If the loss is NaN, the data must be bad.", why: "Commonly it's a too-high learning rate, log of zero, or fp16 overflow. Lower the LR, clip gradients, use numerically stable losses (logits versions) and check inputs with torch.isfinite." },
  ],
  say: {
    prompt: "Your PyTorch model trains but the loss doesn't go down. How do you debug it?",
    secs: 60,
    check: ["Check shapes/dtypes/devices and the initial loss (≈ ln C)", "Overfit a single batch; if it can't, the bug is in model/loss/optimiser", "Verify zero_grad/backward/step order and that parameters are in the optimiser and require grad", "Learning-rate sweep; gradient norms; clipping", "Data/labels sanity (alignment, normalisation, shuffle), train/eval modes"],
    followups: [
      { q: "How much GPU memory does training a 100M-parameter model with Adam in fp32 need, ignoring activations?", a: "About 16 bytes per parameter: 1.6 GB." },
      { q: "bf16 vs fp16 autocast?", a: "bf16 keeps fp32's exponent range, so it rarely overflows and needs no GradScaler; fp16 has more mantissa precision but a small range, so it needs loss scaling." },
      { q: "Why do CUDA errors sometimes point at the wrong line?", a: "Kernels run asynchronously; the error is reported at the next synchronising call. CUDA_LAUNCH_BLOCKING=1 makes launches synchronous for debugging." },
    ],
    answer: `I'd start with the cheap checks: print shapes, dtypes and devices for one batch, and confirm the initial loss is about the log of the number of classes. Then I'd try to overfit a single small batch for a couple of hundred steps; if the loss won't approach zero, the bug is in the model, the loss or the update, not the amount of data. There I'd check the step order, that zero_grad is called, that the optimiser got model.parameters() and those require grad, that I'm not applying softmax before CrossEntropyLoss, and that the model is in train mode. If one batch overfits, I'd do a learning-rate sweep, look at gradient norms and clip them, and then check the data itself: labels aligned with inputs, features normalised, shuffling on.`,
    avoid: ["Jumping to a bigger model", "Changing many things at once"],
  },
  terms: [["Device", "Where a tensor lives: CPU, CUDA GPU, MPS."], ["Autocast", "Runs selected ops in lower precision automatically."], ["GradScaler", "Scales the fp16 loss to prevent gradient underflow."], ["Overfit one batch", "Sanity test that the model can learn at all."]],
  sources: [S.cuda, S.tuning],
});
Q({ id: "py2-ptg-1", d: 1, secs: 30, prompt: "How many GB do the weights of a 7-billion-parameter model take in fp16 (2 bytes each, 1 GB = 10⁹ bytes)?", answer: 14, tol: 0.05, explain: "7 × 10⁹ × 2 bytes.", py: "answer = 7e9 * 2 / 1e9" });
Q({ id: "py2-ptg-2", d: 2, secs: 45, prompt: "Training a 100M-parameter model in fp32 with Adam: weights + gradients + two moment buffers, ignoring activations. How many GB?", answer: 1.6, tol: 0.01, explain: "4 tensors × 4 bytes × 10⁸ = 1.6 × 10⁹ bytes.", py: "import numpy as np\nanswer = 4 * np.dtype('float32').itemsize * 100e6 / 1e9", packages: NP });
Q({ id: "py2-ptg-3", d: 1, secs: 30, prompt: "`nn.CrossEntropyLoss` raises 'expected scalar type Long but found Float'. What do you change?", options: ["Cast the logits to long", "Cast the targets to int64 class indices", "Add a softmax to the model", "Move the loss to the GPU"], answer: 1, explain: "CrossEntropyLoss wants float logits and integer (int64) class-index targets.", py: "import numpy as np\ny = np.array([0.0, 2.0, 1.0])\nanswer = 1 if y.astype(np.int64).dtype == np.int64 else 0", packages: NP });
Q({ id: "py2-ptg-4", d: 2, secs: 45, prompt: "fp16's largest finite value is about 65,504. Does a logit of 12 overflow when you compute `exp` of it in fp16? (1 = overflows, 0 = fine)", answer: 1, tol: 0.5, explain: "e¹² ≈ 162,755 > 65,504, giving inf; that's why losses take logits and use log-sum-exp in higher precision.", py: "import numpy as np\nwith np.errstate(over='ignore'):\n    v = np.exp(np.float16(12))\nanswer = int(np.isinf(v))", packages: NP });
Q({ id: "py2-ptg-5", d: 2, secs: 45, prompt: "`nn.Linear(128, 10)` receives a batch shaped (32, 8, 16) after a conv layer. After `nn.Flatten()` (which keeps the batch dimension), how many features per sample, and does it now match in_features = 128? Answer the feature count.", answer: 128, tol: 0.5, explain: "8 × 16 = 128 features per sample, so (32, 128) feeds Linear(128, 10).", py: "import numpy as np\nanswer = int(np.prod((32, 8, 16)[1:]))", packages: NP });
C("py2-ptg-c1", "Device rule", "model.to(device) once; every batch .to(device); create new tensors with device=...; synchronise before timing.");
C("py2-ptg-c2", "Training memory", "fp32 Adam ≈ 16 bytes/param (weights 4 + grads 4 + moments 8) + activations ∝ batch size.");

// ───────────────────────── PyTorch interview ─────────────────────────

L("py2-pt-practice", PT, "PyTorch practice", "Live-coding and debugging questions asked in ML engineer and DS screens that use PyTorch.", {
  kind: "interview", mins: 35, prereq: ["py2-pt-tensors", "py2-pt-module", "py2-pt-data", "py2-pt-devices"],
  hook: "Say the tensor shape after every line; it's the fastest way to find your own bugs and the thing interviewers check first.",
}, [
  iq("Implement logistic regression in PyTorch from scratch (no nn.Linear, no optimiser) and train it with gradient descent.", "w = torch.zeros(d, requires_grad=True), b = torch.zeros(1, requires_grad=True); loop: logits = X @ w + b (shape (n,)); loss = F.binary_cross_entropy_with_logits(logits, y.float()); loss.backward(); with torch.no_grad(): w -= lr * w.grad; b -= lr * b.grad; w.grad.zero_(); b.grad.zero_(). Explain why no_grad (don't track the update) and why zeroing (accumulation). Mention the stable logits loss instead of sigmoid then log.", ["Parameters with requires_grad", "Correct shapes", "Stable BCE-with-logits", "Update in no_grad and zero grads", "Explains each choice"]),
  iq("This training loop's validation accuracy fluctuates wildly and memory grows every epoch. Find the bugs: no model.eval(), `total += loss`, validation not under no_grad.", "Missing model.eval() leaves dropout on (and batch norm using batch stats), so validation predictions are noisy; add eval() for validation and train() back for training. `total += loss` keeps every batch's graph alive → use loss.item(). Validation without no_grad builds graphs needlessly → wrap in torch.no_grad(). Also check the scheduler/optimiser order.", ["eval/train modes", "loss.item() memory leak", "no_grad in validation", "Explains symptoms from causes"]),
  iq("Write a Dataset and DataLoader for a CSV of 10 million rows that doesn't fit in memory.", "Options: convert once to a memory-mapped format (NumPy memmap/Parquet/Arrow) and index rows in __getitem__; or an IterableDataset that streams chunks, with per-worker sharding via get_worker_info so workers don't duplicate rows; shuffle with a buffer; num_workers and pin_memory for throughput; batch-level reading to avoid per-row overhead.", ["Recognises memory limit", "memmap / columnar format or IterableDataset", "Worker sharding", "Shuffling strategy", "Throughput settings"]),
  iq("Your model trains fine on CPU but crashes on GPU with 'Expected all tensors to be on the same device'. Where do you look?", "Batches not moved (.to(device) in the loop), tensors created inside forward without device= (e.g. torch.zeros(...) for a mask or positional encoding; use x.new_zeros or register_buffer so .to moves it), loss weights (class_weight tensor) left on CPU, model moved after creating the optimiser (fine for .to on parameters, but check custom state), and metrics mixing GPU tensors with CPU NumPy.", ["Batches", "Tensors created in forward / register_buffer", "Loss weights", "Metrics and .cpu()"]),
  iq("Explain what happens, in order, during one call to optimizer.step() for Adam, and what state it keeps.", "For each parameter with a grad: update first moment m = β1 m + (1 − β1) g and second moment v = β2 v + (1 − β2) g²; bias-correct both by 1 − βᵗ; update p −= lr · m̂ / (√v̂ + ε); AdamW additionally applies decoupled weight decay p −= lr · λ · p. State per parameter: m, v (same shape as p) and the step count, which is why Adam doubles parameter memory beyond gradients.", ["Moment updates", "Bias correction", "Parameter update rule", "Decoupled weight decay in AdamW", "Memory implication"]),
  iq("You need to fine-tune a 300M-parameter model on a 16 GB GPU and you hit out-of-memory at batch size 32. List what you'd try, in order.", "Estimate: fp32 Adam ≈ 16 B/param ≈ 4.8 GB, so activations are the problem. Try bf16 autocast (halves activations), smaller micro-batch with gradient accumulation to keep the effective batch, activation (gradient) checkpointing, shorter sequences or bucketing, freezing lower layers or parameter-efficient fine-tuning (LoRA), an 8-bit optimiser; make sure evaluation runs under no_grad and you log loss.item().", ["Memory estimate", "Mixed precision", "Gradient accumulation", "Checkpointing / shorter inputs", "Freezing / PEFT / optimiser memory"]),
]);

// ═════════════════════════ Keras ═════════════════════════

// ───────────────────────── Sequential and functional APIs ─────────────────────────

L("py2-keras-api", KR, "Keras models: Sequential, functional and subclassing", "Building models with keras.Sequential and the functional API, reading summary() and parameter counts, multi-input and residual models, and when to subclass.", {
  kind: "concept", mins: 20, mathsLabel: "Code",
  hook: "A churn model needs both 10 numeric features and a sequence of support-ticket tokens. Sequential can't express it — what does the functional version look like, and how many parameters does each layer add?",
  intuition: `
**The situation.** Teams on TensorFlow (and Keras 3, which also runs on JAX or PyTorch backends) ask Keras questions in DS and ML rounds: build a model, read its \`summary()\`, explain the parameter counts.

**The idea.** Three ways to build a model, from simplest to most flexible:

- **Sequential:** a plain stack, one input and one output per layer. Start it with \`keras.Input(shape=...)\` (shape excludes the batch dimension) so it builds immediately and \`summary()\` works.
- **Functional API:** call layers on tensors to wire a graph: \`x = layers.Dense(64)(inputs)\`, then \`keras.Model(inputs, outputs)\`. Supports multiple inputs/outputs, shared layers and residual or branching connections, and checks shapes as you connect layers.
- **Subclassing \`keras.Model\`:** write \`call()\` yourself for dynamic behaviour (loops, conditionals); most flexible, least inspectable.

**Parameter counts** come from the layer maths: Dense(units) on d inputs = d·units + units; Conv2D(filters, k×k) on c channels = k·k·c·filters + filters; Embedding(vocab, dim) = vocab·dim; Dropout, pooling and flatten have none.
`,
  maths: `
**In one breath.** \`keras.Sequential([keras.Input(shape), layers...])\`; functional: \`Input\` → layers called on tensors → \`keras.Model(inputs, outputs)\`; params: Dense = d·u + u, Conv2D = k²·c·f + f, Embedding = V·d.

\`\`\`python
import keras
from keras import layers

seq = keras.Sequential([
    keras.Input(shape=(20,)),
    layers.Dense(64, activation="relu"),     # 20*64 + 64 = 1,344
    layers.Dropout(0.2),                     # 0
    layers.Dense(1, activation="sigmoid"),   # 64 + 1 = 65
])
seq.summary()                                # Total params: 1,409

# Functional: numeric features + token sequence -> one churn probability
num_in = keras.Input(shape=(10,), name="num")
tok_in = keras.Input(shape=(None,), dtype="int32", name="tokens")    # variable length
e = layers.Embedding(input_dim=10_000, output_dim=32)(tok_in)        # 320,000 params
e = layers.GlobalAveragePooling1D()(e)                               # (None, 32)
n = layers.Dense(16, activation="relu")(num_in)                      # 10*16 + 16 = 176
x = layers.concatenate([n, e])                                       # (None, 48)
out = layers.Dense(1, activation="sigmoid", name="churn")(x)         # 48 + 1 = 49
model = keras.Model(inputs=[num_in, tok_in], outputs=out)            # 320,225 params
# model.fit({"num": X_num, "tokens": X_tok}, y, ...)

# Residual block: only the functional API (or subclassing) can express it
inp = keras.Input(shape=(32, 32, 3))
a = layers.Conv2D(32, 3, padding="same", activation="relu")(inp)    # 3*3*3*32 + 32 = 896
b = layers.Conv2D(32, 3, padding="same", activation="relu")(a)      # 3*3*32*32 + 32 = 9,248
x = layers.add([a, b])                                               # skip connection
res = keras.Model(inp, layers.GlobalAveragePooling2D()(x))
\`\`\`

**Shapes.** \`padding="valid"\` (default) shrinks spatial size: output = (n − k)/stride + 1, so 28 → 26 for a 3×3 kernel; \`"same"\` keeps it (for stride 1). Shapes in \`summary()\` show \`None\` for the batch dimension.

**Gotchas.** \`Input(shape=20)\` must be a tuple \`(20,)\`. Reusing one layer object on two inputs shares its weights (intentional for siamese models, a bug otherwise). Without an \`Input\`, a Sequential model isn't built until it sees data, so \`summary()\` fails.
`,
  practice: `
**Pick the API.** Single stack → Sequential. Multiple inputs/outputs, skips, shared layers → functional (the default for most real models). Custom loops or dynamic control flow → subclass.

**Read summary() aloud.** Check output shapes layer by layer and sanity-check one parameter count by hand; interviewers often ask for exactly that.
`,
  traps: [
    { trap: "Dense layers have units × inputs parameters.", why: "Each unit also has a bias: d·u + u (unless use_bias=False)." },
    { trap: "Sequential can handle two inputs if you concatenate inside.", why: "Sequential layers take exactly one input tensor; multiple inputs or branches need the functional API or subclassing." },
    { trap: "`keras.Input(shape=(batch, 20))` declares the batch size.", why: "shape excludes the batch dimension; use shape=(20,). (batch_size is a separate, rarely needed argument.)" },
  ],
  say: {
    prompt: "When would you use Keras's Sequential API versus the functional API, and how do you check a model's parameter count?",
    secs: 45,
    check: ["Sequential: single-input single-output linear stack", "Functional: multi-input/output, shared layers, residual/branching graphs", "Subclassing for dynamic behaviour", "summary(): shapes with None batch dim and params", "Hand formula: Dense d·u + u, Conv k²·c·f + f, Embedding V·d"],
    followups: [
      { q: "How many parameters does Conv2D(64, 3×3) add on a 32-channel input?", a: "3·3·32·64 + 64 = 18,496." },
      { q: "How do you share weights between two inputs?", a: "Create the layer once and call the same instance on both inputs (functional API)." },
      { q: "What does Keras 3 change?", a: "It's multi-backend: the same model code runs on TensorFlow, JAX or PyTorch, chosen via the KERAS_BACKEND setting." },
    ],
    answer: `Sequential is for a plain stack of layers with one input and one output, like an MLP; I start it with keras.Input so it's built and summary() works. As soon as I need two inputs, two outputs, a skip connection or a shared layer, I switch to the functional API: create Input tensors, call layers on them to wire the graph, and wrap it in keras.Model(inputs, outputs); it also catches shape mismatches as I connect layers. Subclassing is for dynamic logic. To check parameters I read summary(), where output shapes show None for the batch, and verify one by hand: a Dense layer has inputs times units plus units, a Conv2D has kernel height times width times input channels times filters plus filters, and an Embedding has vocabulary size times dimension.`,
    avoid: ["Forgetting biases in parameter counts", "Including batch size in Input shape"],
  },
  terms: [["Sequential", "Linear stack of single-input layers."], ["Functional API", "Models as graphs of layers called on tensors."], ["keras.Input", "Symbolic input; shape excludes the batch dimension."], ["Shared layer", "One layer instance used on several inputs (shared weights)."]],
  sources: [S.kSeq, S.kFunc],
});
Q({ id: "py2-kra-1", d: 1, secs: 30, prompt: "Parameters in `layers.Dense(64)` applied to an input of shape (20,)?", answer: 1344, tol: 0.5, explain: "20 × 64 weights + 64 biases.", py: "d, u = 20, 64\nanswer = d * u + u" });
Q({ id: "py2-kra-2", d: 1, secs: 30, prompt: "Parameters in `layers.Conv2D(32, 3)` applied to a 3-channel image?", answer: 896, tol: 0.5, explain: "3 × 3 × 3 × 32 + 32.", py: "k, c, f = 3, 3, 32\nanswer = k * k * c * f + f" });
Q({ id: "py2-kra-3", d: 1, secs: 30, prompt: "A 28×28 input through `Conv2D(16, 3)` with the default `padding='valid'` and stride 1. What is the output height?", answer: 26, tol: 0.5, explain: "(28 − 3)/1 + 1 = 26.", py: "n, k, s = 28, 3, 1\nanswer = (n - k) // s + 1" });
Q({ id: "py2-kra-4", d: 2, secs: 60, prompt: "The lesson's two-input model: Embedding(10,000, 32) → average pooling, Dense(16) on 10 numeric features, concatenate, Dense(1). Total parameters?", answer: 320225, tol: 0.5, explain: "320,000 + 176 + (48 + 1).", py: "emb = 10000 * 32\nnum = 10 * 16 + 16\nhead = (16 + 32) * 1 + 1\nanswer = emb + num + head" });
Q({ id: "py2-kra-5", d: 1, secs: 30, prompt: "Which model needs the functional API (or subclassing) rather than Sequential?", options: ["Dense → Dropout → Dense", "Conv2D → MaxPool → Flatten → Dense", "A block whose output is added to its own input (residual)", "Embedding → LSTM → Dense"], answer: 2, explain: "A skip connection gives a layer two inputs; Sequential layers take exactly one.", py: "single_input_chains = [True, True, False, True]\nanswer = single_input_chains.index(False)" });
C("py2-kra-c1", "Parameter formulas", "Dense: d·u + u · Conv2D: k·k·c·f + f · Embedding: V·d · Dropout/Pool/Flatten: 0.");
C("py2-kra-c2", "Which Keras API", "Sequential = one-in one-out stack; functional = graphs (multi-IO, skips, sharing); subclass = dynamic call().");

// ───────────────────────── compile, fit, callbacks ─────────────────────────

L("py2-keras-fit", KR, "compile, fit and callbacks", "Choosing loss and output activation, metrics, validation_split vs validation_data, reading History, and EarlyStopping, ModelCheckpoint and ReduceLROnPlateau.", {
  kind: "concept", mins: 25, mathsLabel: "Code",
  hook: "Your 10-class model with integer labels throws a shape error with 'categorical_crossentropy'. One word fixes it. Then: how do you stop training at the best epoch automatically?",
  intuition: `
**The situation.** Keras makes training one call, so interviews probe the choices inside that call: loss/activation pairing, validation, and callbacks.

**The idea.**

- **compile(optimizer, loss, metrics)** fixes how the model learns. Match the loss to the output layer and label format:

| Task | Output layer | Labels | Loss |
|---|---|---|---|
| Binary | Dense(1, sigmoid) | 0/1 | \`binary_crossentropy\` |
| Multiclass | Dense(C, softmax) | integers 0..C−1 | \`sparse_categorical_crossentropy\` |
| Multiclass | Dense(C, softmax) | one-hot | \`categorical_crossentropy\` |
| Any, raw scores | no activation | as above | the loss object with \`from_logits=True\` |
| Regression | Dense(1) | real | \`mse\` / \`mae\` / \`huber\` |

- **fit(x, y, batch_size, epochs, validation_data | validation_split, callbacks)** returns a **History** with per-epoch \`loss\`, metrics and their \`val_\` versions. \`validation_split\` takes the **last** fraction of the arrays **before** shuffling, so sorted data gives a biased validation set; pass \`validation_data\` explicitly when order matters.
- **Callbacks** run at epoch/batch boundaries: \`EarlyStopping\` (stop after \`patience\` epochs without improvement; \`restore_best_weights=True\` to roll back, default False), \`ModelCheckpoint\` (save the best model), \`ReduceLROnPlateau\` (cut the learning rate when progress stalls), \`CSVLogger\`, \`TensorBoard\`.
`,
  maths: `
**In one breath.** Loss matches output and label format; \`validation_split\` = last fraction, unshuffled; steps/epoch = ceil(n_train / batch_size); EarlyStopping stops at best_epoch + patience; monitor a \`val_\` metric with the right \`mode\`.

\`\`\`python
import keras
model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=1e-3),
    loss="binary_crossentropy",
    metrics=["accuracy", keras.metrics.AUC(name="auc")],
)
callbacks = [
    keras.callbacks.EarlyStopping(monitor="val_auc", mode="max", patience=3,
                                  restore_best_weights=True),
    keras.callbacks.ModelCheckpoint("best.keras", monitor="val_auc", mode="max",
                                    save_best_only=True),
    keras.callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=2),
]
history = model.fit(X_train, y_train, validation_data=(X_val, y_val),
                    epochs=50, batch_size=32, callbacks=callbacks)
print(sorted(history.history))
# ['auc', 'accuracy', 'learning_rate', 'loss', 'val_accuracy', 'val_auc', 'val_loss']  (roughly)
best_epoch = int(np.argmax(history.history["val_auc"])) + 1
model.evaluate(X_test, y_test)          # once, at the end

# Integer labels, 10 classes, raw logits from the last layer
model.compile(optimizer="adam",
              loss=keras.losses.SparseCategoricalCrossentropy(from_logits=True),
              metrics=["accuracy"])

# Steps per epoch with validation_split=0.2 on 10,000 rows and batch_size=32:
# 8,000 training rows -> ceil(8000 / 32) = 250 steps
\`\`\`

**EarlyStopping arithmetic.** With patience p, training stops p epochs after the last improvement. If the best val_auc is at epoch 5 and nothing beats it, training ends after epoch 8 with patience 3; without \`restore_best_weights=True\` you keep epoch 8's weights.

**Class imbalance.** \`fit(..., class_weight={0: 1.0, 1: 5.0})\` reweights the loss; track AUC or precision/recall, not accuracy.
`,
  practice: `
**A sensible default run.** Adam 1e-3; EarlyStopping on a validation metric with \`restore_best_weights=True\`; ModelCheckpoint for the best model; ReduceLROnPlateau; explicit \`validation_data\` from a proper split; plot \`history.history\` loss vs val_loss to diagnose over- or under-fitting.

**Data pipelines.** For large data pass a \`tf.data.Dataset\` or a \`keras.utils.PyDataset\` instead of arrays; then \`batch_size\` belongs to the dataset, and \`validation_split\` isn't available.
`,
  traps: [
    { trap: "Use `categorical_crossentropy` for any multiclass problem.", why: "It expects one-hot labels. With integer labels use sparse_categorical_crossentropy." },
    { trap: "`validation_split=0.2` takes a random 20%.", why: "It takes the last 20% of the arrays before any shuffling; if data is sorted by date or class, validation is biased. Shuffle first or pass validation_data." },
    { trap: "EarlyStopping leaves you with the best model.", why: "restore_best_weights defaults to False, so you keep the last epoch's weights. Set it to True or reload the checkpoint." },
  ],
  say: {
    prompt: "Walk me through compiling and training a Keras binary classifier so it stops at the right time and you can trust the validation numbers.",
    secs: 45,
    check: ["Sigmoid output + binary_crossentropy (or from_logits=True with no activation)", "Metrics beyond accuracy (AUC, precision/recall) for imbalance", "Proper validation set: validation_data, or validation_split only on shuffled data", "EarlyStopping on a val_ metric with mode and restore_best_weights=True; ModelCheckpoint", "Read History curves; evaluate on test once"],
    followups: [
      { q: "What does from_logits=True mean?", a: "The model outputs raw scores and the loss applies sigmoid/softmax internally, which is more numerically stable." },
      { q: "How do you diagnose overfitting from History?", a: "Training loss keeps falling while val_loss bottoms out and rises; the gap widens after the best epoch." },
      { q: "What does ReduceLROnPlateau(factor=0.5, patience=2) do?", a: "Halves the learning rate whenever the monitored metric hasn't improved for 2 epochs." },
    ],
    answer: `For binary classification the last layer is Dense(1) with a sigmoid and the loss is binary_crossentropy, or no activation with BinaryCrossentropy(from_logits=True), which is more stable. I'd compile with Adam at 1e-3 and track AUC alongside accuracy. For validation I'd pass validation_data from a proper split; validation_split takes the last fraction of the arrays before shuffling, so it's only safe on shuffled data. Callbacks: EarlyStopping monitoring val_auc with mode="max", a patience of a few epochs and restore_best_weights=True, because the default keeps the last epoch's weights; ModelCheckpoint to save the best model; ReduceLROnPlateau to halve the learning rate when it stalls. Then I'd plot loss against val_loss from History and evaluate on the test set once.`,
    avoid: ["Monitoring a metric without setting mode", "Trusting validation_split on sorted data"],
  },
  terms: [["compile", "Sets optimiser, loss and metrics."], ["History", "Per-epoch training and validation metrics returned by fit."], ["EarlyStopping", "Stops training after patience epochs without improvement."], ["from_logits", "Loss applies the final activation itself."]],
  sources: [S.kTrain, S.kFitApi, S.kCb, S.kES],
});
Q({ id: "py2-krf-1", d: 1, secs: 30, prompt: "10,000 rows, `validation_split=0.2`, `batch_size=32`. Training steps per epoch?", answer: 250, tol: 0.5, explain: "8,000 training rows / 32.", py: "import math\nanswer = math.ceil(10000 * (1 - 0.2) / 32)" });
Q({ id: "py2-krf-2", d: 2, secs: 45, prompt: "val_auc by epoch: 0.80, 0.84, 0.86, 0.87, 0.88, 0.879, 0.878, 0.875, 0.874, 0.873. EarlyStopping(patience=3, mode='max'). After which epoch does training stop?", answer: 8, tol: 0.5, explain: "Best at epoch 5; epochs 6, 7, 8 don't improve, so it stops after epoch 8.", py: "v = [0.80, 0.84, 0.86, 0.87, 0.88, 0.879, 0.878, 0.875, 0.874, 0.873]\nbest, wait, stop = -1, 0, len(v)\nfor e, x in enumerate(v, 1):\n    if x > best:\n        best, wait = x, 0\n    else:\n        wait += 1\n        if wait >= 3:\n            stop = e\n            break\nanswer = stop" });
Q({ id: "py2-krf-3", d: 1, secs: 30, prompt: "10 classes, integer labels 0–9, softmax output. Which loss?", options: ["binary_crossentropy", "categorical_crossentropy", "sparse_categorical_crossentropy", "mse"], answer: 2, explain: "Sparse categorical cross-entropy takes integer class indices; categorical expects one-hot.", py: "import numpy as np\ny = np.array([3, 0, 9])\nis_integer_labels = y.ndim == 1 and np.issubdtype(y.dtype, np.integer)\nanswer = 2 if is_integer_labels else 1", packages: NP });
Q({ id: "py2-krf-4", d: 2, secs: 45, prompt: "`ReduceLROnPlateau(factor=0.5)` starting at lr = 0.001 triggers twice. New learning rate? (scientific is fine; give the decimal)", answer: 0.00025, tol: 0.000001, explain: "0.001 × 0.5 × 0.5.", py: "answer = 0.001 * 0.5 ** 2" });
Q({ id: "py2-krf-5", d: 2, secs: 45, prompt: "Labels are sorted: 8,000 zeros then 2,000 ones. With `validation_split=0.2`, what share of the validation set is class 1?", answer: 1, tol: 0.01, explain: "validation_split takes the last 20% before shuffling: all 2,000 ones.", py: "import numpy as np\ny = np.r_[np.zeros(8000), np.ones(2000)]\nval = y[int(len(y) * (1 - 0.2)):]\nanswer = float(val.mean())", packages: NP });
C("py2-krf-c1", "Loss pairing", "sigmoid + binary_crossentropy · softmax + sparse_categorical (int labels) / categorical (one-hot) · no activation → from_logits=True.");
C("py2-krf-c2", "Callbacks", "EarlyStopping(monitor='val_…', mode, patience, restore_best_weights=True) · ModelCheckpoint(save_best_only) · ReduceLROnPlateau(factor, patience).");

// ───────────────────────── Saving and transfer learning ─────────────────────────

L("py2-keras-save", KR, "Saving models and transfer learning", "The .keras format, weights-only saving, loading for inference, and the freeze-train-unfreeze-fine-tune recipe with pretrained models, including the batch-norm caveat.", {
  kind: "concept", mins: 25, mathsLabel: "Code",
  hook: "You have 2,000 labelled product photos. Training a CNN from scratch overfits. How do you get a strong classifier in an afternoon, and why does unfreezing everything at the default learning rate destroy it?",
  intuition: `
**The situation.** Small labelled datasets are the norm in industry projects; transfer learning is the standard answer and a common interview topic for DS and CV roles.

**The idea.**

**Saving.** \`model.save("name.keras")\` stores architecture, weights, compile settings and optimiser state in one file; \`keras.models.load_model\` restores it. \`save_weights("name.weights.h5")\` stores weights only (you rebuild the architecture in code). Custom layers need to be registered (or passed via \`custom_objects\`) to load.

**Transfer learning recipe.**

1. Load a pretrained base without its classifier head: \`keras.applications.MobileNetV2(include_top=False, weights="imagenet")\`.
2. **Freeze** it: \`base.trainable = False\`.
3. Build a new head with the functional API and call the base with \`training=False\`, so batch-norm layers stay in inference mode.
4. Compile and train the head only (a few epochs, normal learning rate).
5. **Fine-tune:** set \`base.trainable = True\` (or unfreeze only the top layers), **recompile** with a very low learning rate (about 1e-5), and train a few more epochs while watching validation loss.

Why the low learning rate: the head starts random, and big gradients through an unfrozen base wreck the pretrained features. Why \`training=False\`: batch-norm statistics from your small dataset would replace the robust ImageNet ones.
`,
  maths: `
**In one breath.** \`.keras\` for whole models, \`.weights.h5\` for weights; freeze → new head → train → unfreeze → recompile at ~1e-5 → fine-tune; base called with \`training=False\`; trainable params of a frozen-base model = the head only.

\`\`\`python
import keras
from keras import layers

base = keras.applications.MobileNetV2(input_shape=(224, 224, 3), include_top=False,
                                      weights="imagenet")
base.trainable = False                                    # freeze all base weights

inputs = keras.Input(shape=(224, 224, 3))
x = keras.applications.mobilenet_v2.preprocess_input(inputs)   # the base's own scaling
x = base(x, training=False)                               # BN in inference mode, even later
x = layers.GlobalAveragePooling2D()(x)                    # (None, 1280)
x = layers.Dropout(0.2)(x)
outputs = layers.Dense(1)(x)                              # 1280 + 1 = 1,281 trainable params
model = keras.Model(inputs, outputs)

model.compile(optimizer=keras.optimizers.Adam(1e-3),
              loss=keras.losses.BinaryCrossentropy(from_logits=True),
              metrics=[keras.metrics.BinaryAccuracy(threshold=0.0)])   # logits: threshold 0
model.fit(train_ds, validation_data=val_ds, epochs=10)

base.trainable = True                                     # or: unfreeze only the top N layers
for layer in base.layers[:-20]:
    layer.trainable = False
model.compile(optimizer=keras.optimizers.Adam(1e-5),      # recompile so the change takes effect
              loss=keras.losses.BinaryCrossentropy(from_logits=True),
              metrics=[keras.metrics.BinaryAccuracy(threshold=0.0)])
model.fit(train_ds, validation_data=val_ds, epochs=5)

model.save("product_clf.keras")
restored = keras.models.load_model("product_clf.keras")
model.save_weights("product_clf.weights.h5")              # weights only
\`\`\`

**Cost.** Training only the head is cheap (forward through the base, backward through a tiny head); you can even precompute base features once and train the head on them, at the cost of losing data augmentation. Fine-tuning costs a full backward pass through the unfrozen layers.

**Gotchas.** Preprocess inputs the way the base was trained (each application has its own \`preprocess_input\`). Changing \`trainable\` after compile has no effect until you compile again. With logits output, accuracy metrics need threshold 0, not 0.5.
`,
  practice: `
**When to fine-tune.** Small dataset similar to ImageNet → head only, maybe the top block. Larger or different domain (medical, satellite) → unfreeze more, still with a low learning rate. Tiny dataset → precomputed features + a simple classifier (even logistic regression).

**Augmentation.** Add \`RandomFlip\`, \`RandomRotation\`, \`RandomZoom\` layers before the base; they are active only during training.
`,
  traps: [
    { trap: "After unfreezing the base, keep training with the same optimiser settings.", why: "You must recompile for trainable changes to apply, and use a much lower learning rate (≈1e-5) or the pretrained features are destroyed." },
    { trap: "Batch-norm layers should adapt to your data during fine-tuning.", why: "With small batches and data, updating BN statistics hurts. Calling the base with training=False keeps them in inference mode even when unfrozen." },
    { trap: "`save_weights` is enough to reload a model anywhere.", why: "It stores weights only; you need the exact architecture code to rebuild it. model.save('.keras') stores everything." },
  ],
  say: {
    prompt: "Describe how you'd build an image classifier from 2,000 labelled images with Keras.",
    secs: 60,
    check: ["Pretrained base (include_top=False, ImageNet weights) and the base's preprocessing", "Freeze base, new head (pooling, dropout, dense), base called with training=False", "Train head first at a normal learning rate", "Unfreeze (top layers), recompile at ~1e-5, fine-tune while watching val loss", "Augmentation, early stopping, save as .keras"],
    followups: [
      { q: "Why recompile after changing trainable?", a: "compile captures which weights are trainable; changes take effect only after compiling again." },
      { q: "How many trainable parameters does a Dense(5) head on 1,280 pooled features have?", a: "1280 × 5 + 5 = 6,405." },
      { q: ".keras vs .weights.h5?", a: ".keras saves architecture, weights, compile config and optimiser state; .weights.h5 saves weights only." },
    ],
    answer: `I'd use transfer learning. Load a pretrained base like MobileNetV2 or EfficientNet with include_top=False and ImageNet weights, freeze it with trainable=False, and build a functional model: augmentation layers, the base's own preprocess_input, the base called with training=False so batch norm stays in inference mode, global average pooling, dropout and a Dense output. I'd train only the head for several epochs at about 1e-3 with early stopping. Then I'd unfreeze the top layers of the base, recompile, because trainable changes only apply after compiling, with a much lower learning rate around 1e-5, and fine-tune a few epochs while watching validation loss. Finally I'd save it with model.save to a .keras file and evaluate on a held-out test set.`,
    avoid: ["Training from scratch on 2,000 images", "Fine-tuning everything at 1e-3"],
  },
  terms: [["include_top", "Whether to keep the pretrained classifier head."], ["Freezing", "trainable=False: weights not updated."], ["Fine-tuning", "Unfreezing pretrained layers and training at a low learning rate."], [".keras format", "Single file with architecture, weights and training config."]],
  sources: [S.kTL, S.kSave],
});
Q({ id: "py2-krs-1", d: 1, secs: 30, prompt: "Frozen base outputs 1,280 pooled features; the head is Dropout then Dense(1). How many trainable parameters?", answer: 1281, tol: 0.5, explain: "1,280 weights + 1 bias; Dropout has none and the base is frozen.", py: "answer = 1280 * 1 + 1" });
Q({ id: "py2-krs-2", d: 1, secs: 30, prompt: "Same frozen base with a Dense(5) softmax head for 5 product categories. Trainable parameters?", answer: 6405, tol: 0.5, explain: "1280 × 5 + 5.", py: "answer = 1280 * 5 + 5" });
Q({ id: "py2-krs-3", d: 2, secs: 45, prompt: "A base has 154 layers. You unfreeze only the last 20 with `for layer in base.layers[:-20]: layer.trainable = False`. How many layers stay frozen?", answer: 134, tol: 0.5, explain: "Slicing [:-20] selects all but the last 20.", py: "layers = list(range(154))\nanswer = len(layers[:-20])" });
Q({ id: "py2-krs-4", d: 1, secs: 30, prompt: "Which learning rate is a typical choice for the fine-tuning stage after unfreezing the base?", options: ["1e-1", "1e-3", "1e-5", "10"], answer: 2, explain: "Fine-tuning uses a rate one or two orders of magnitude below head training (≈1e-3) to avoid destroying pretrained features.", py: "rates = [1e-1, 1e-3, 1e-5, 10]\nhead_lr = 1e-3\nanswer = [i for i, r in enumerate(rates) if 1e-6 <= r <= head_lr / 50][0]" });
Q({ id: "py2-krs-5", d: 2, secs: 45, prompt: "The output layer emits logits (no sigmoid). A sample has logit −0.3. With `BinaryAccuracy(threshold=0.0)`, is it predicted positive? (1 = yes, 0 = no) And does a sigmoid probability agree?", answer: 0, tol: 0.5, explain: "−0.3 < 0, and sigmoid(−0.3) ≈ 0.43 < 0.5: both say negative. A logit threshold of 0 equals a probability threshold of 0.5.", py: "import math\nz = -0.3\nlogit_pos = z >= 0.0\nprob_pos = 1 / (1 + math.exp(-z)) >= 0.5\nanswer = int(logit_pos) if logit_pos == prob_pos else -1" });
C("py2-krs-c1", "Transfer recipe", "Pretrained base (include_top=False) → freeze → head; base(x, training=False) → train head → unfreeze top → recompile at ~1e-5 → fine-tune.");
C("py2-krs-c2", "Keras saving", "model.save('m.keras') = everything; save_weights('m.weights.h5') = weights only; load_model to restore.");

// ───────────────────────── Keras interview ─────────────────────────

L("py2-keras-practice", KR, "Keras practice", "Build-and-explain questions for DS and ML rounds on teams that use Keras or TensorFlow.", {
  kind: "interview", mins: 30, prereq: ["py2-keras-api", "py2-keras-fit", "py2-keras-save"],
  hook: "Pair every architecture choice with the loss and metric it implies, and say which numbers come from validation data.",
}, [
  iq("Build a Keras model for tabular churn data (30 numeric features, 15% churners) and explain each choice.", "Sequential or functional: Input(shape=(30,)) → Normalization layer adapted on training data → Dense(64, relu) → Dropout(0.2) → Dense(32, relu) → Dense(1, sigmoid). Compile with Adam(1e-3), binary_crossentropy, metrics AUC and precision/recall. fit with explicit validation_data, class_weight or threshold tuning for the 15% class, EarlyStopping on val_auc (mode='max', restore_best_weights=True). Note that gradient-boosted trees are often a stronger baseline for tabular data.", ["Normalisation adapted on train only", "Sigmoid + binary cross-entropy", "Imbalance-aware metrics/weights", "Early stopping on a val metric", "Mentions tree baseline"]),
  iq("Read this summary: Dense layers 784→256→128→10. Compute the parameter count and say where most parameters are.", "784·256 + 256 = 200,960; 256·128 + 128 = 32,896; 128·10 + 10 = 1,290; total 235,146. Most are in the first layer because it connects the wide input; that's where regularisation (dropout, L2) or a narrower first layer cuts the most.", ["Correct per-layer counts with biases", "Correct total", "Identifies the first layer", "Links to regularisation"]),
  iq("Validation loss starts rising after epoch 6 while training loss keeps falling. What do you do?", "Overfitting. Use EarlyStopping with restore_best_weights=True (or the checkpoint from epoch 6); add regularisation: dropout, L2 weight decay, data augmentation, smaller model; get more data; lower learning rate later in training (ReduceLROnPlateau). Confirm the validation set is representative (validation_split takes the last rows, unshuffled).", ["Names overfitting", "Early stopping with restore", "Regularisation options", "Validation set sanity"]),
  iq("Explain how you'd fine-tune a pretrained image model in Keras and the two most common mistakes.", "Freeze base, call it with training=False, train a new head, then unfreeze top layers, recompile with lr ≈ 1e-5 and fine-tune. Mistakes: not recompiling after changing trainable (no effect), and fine-tuning at a high learning rate or letting batch-norm statistics update on small data, which wrecks pretrained features. Also: wrong preprocess_input for the base.", ["Freeze → head → unfreeze recipe", "Recompile after trainable change", "Low LR and BN inference mode", "Correct preprocessing"]),
  iq("Your Keras multiclass model reaches 10% accuracy on 10 balanced classes and the loss is stuck at 2.30. List likely causes.", "It's predicting uniformly (ln 10 = 2.30). Check: loss/label mismatch (categorical_crossentropy with integer labels, or from_logits mismatch: softmax output with from_logits=True or vice versa); labels misaligned or shuffled separately from inputs; inputs not normalised; learning rate too high or too low; a frozen model (trainable=False everywhere); a final layer with the wrong number of units or a ReLU instead of softmax/no activation.", ["Recognises uniform-prediction loss", "Loss/label/from_logits mismatches", "Data alignment and normalisation", "LR and frozen layers", "Output layer configuration"]),
]);
