// Phase 6 lesson content. Generated; verified practice solutions.
Object.assign(LESSONS,{
 "6.0": {
  "minutes": 55,
  "learn": "\n<p>PyTorch's <code>loss.backward()</code> is not magic. It records every operation you do, then walks that record backwards applying the chain rule. Build a tiny version yourself once and every PyTorch error message about gradients starts to make sense.</p>\n\n<h3>The computation graph</h3>\n<p>Every value in a network is produced by an operation on earlier values. <code>e = a * b</code>, <code>d = e + c</code>, <code>L = d * f</code> form a graph: inputs at the leaves, the loss at the root. Training needs <code>∂L/∂x</code> for every leaf x (the weights).</p>\n\n<h3>Local derivatives plus the chain rule</h3>\n<p>Each operation only needs to know its own local derivative:</p>\n<ul>\n<li><code>out = a + b</code>: <code>∂out/∂a = 1</code>, <code>∂out/∂b = 1</code>. Addition copies the gradient to both inputs.</li>\n<li><code>out = a * b</code>: <code>∂out/∂a = b</code>, <code>∂out/∂b = a</code>. Multiplication swaps the inputs.</li>\n<li><code>out = tanh(a)</code>: <code>∂out/∂a = 1 − out²</code>.</li>\n<li><code>out = relu(a)</code>: gradient passes if <code>a &gt; 0</code>, else 0.</li>\n</ul>\n<p>The chain rule says: gradient arriving at a node (<code>out.grad</code>) times local derivative gives the gradient for each input. If a value is used twice, its gradients <b>add up</b>, which is why autograd uses <code>+=</code>.</p>\n\n<h3>A micrograd-style Value</h3>\n<pre><code>class Value:\n    def __init__(self, data, parents=()):\n        self.data, self.grad = data, 0.0\n        self._parents, self._backward = parents, lambda: None\n\n    def __mul__(self, other):\n        out = Value(self.data * other.data, (self, other))\n        def _backward():\n            self.grad  += other.data * out.grad\n            other.grad += self.data  * out.grad\n        out._backward = _backward\n        return out\n\n    def backward(self):\n        order, seen = [], set()\n        def visit(v):                 # topological sort\n            if v not in seen:\n                seen.add(v)\n                for p in v._parents: visit(p)\n                order.append(v)\n        visit(self)\n        self.grad = 1.0               # dL/dL = 1\n        for v in reversed(order):\n            v._backward()</code></pre>\n<p>The topological order guarantees a node's gradient is complete before it is pushed to its parents.</p>\n\n<h3>The same thing in PyTorch</h3>\n<pre><code>import torch\na = torch.tensor(2.0, requires_grad=True)\nb = torch.tensor(-3.0, requires_grad=True)\nL = (a * b + 10) * -2\nL.backward()\nprint(a.grad, b.grad)      # tensor(6.) tensor(-4.)</code></pre>\n<p>Compare your hand-built gradients with these to verify your autograd.</p>\n\n<h3>Softmax and cross-entropy</h3>\n<p>For classification the network outputs raw scores (logits) <code>z</code>. Softmax turns them into probabilities: <code>p_i = exp(z_i) / Σ exp(z_j)</code>. Cross-entropy for true class y is <code>−log p_y</code>. Two facts worth memorising:</p>\n<ul>\n<li>Subtract <code>max(z)</code> before <code>exp</code>. The result is identical but it cannot overflow.</li>\n<li>The gradient of cross-entropy with respect to the logits is simply <code>p − onehot(y)</code>.</li>\n</ul>\n<pre><code>import torch.nn.functional as F\nlogits = torch.tensor([[2.0, 1.0, 0.1]])\nloss = F.cross_entropy(logits, torch.tensor([0]))   # takes logits, not probabilities</code></pre>\n<blockquote>Common mistake: applying softmax yourself and then passing the probabilities to <code>F.cross_entropy</code>. It already applies log-softmax internally, so you would apply it twice and training gets slow and wrong.</blockquote>\n<blockquote>Common mistake: forgetting to zero gradients. Because gradients accumulate with <code>+=</code>, a second backward pass adds to the first. In PyTorch that is <code>optimizer.zero_grad()</code>.</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "python",
   "prompt": "<p>Finish a tiny scalar autograd. Implement <code>__add__</code>, <code>__mul__</code> and <code>tanh</code> with their backward functions. The program builds a single neuron <code>out = tanh(x1*w1 + x2*w2 + b)</code>, calls <code>backward()</code> and prints values and gradients. Then it checks softmax + cross-entropy and its gradient <code>p − onehot</code> in NumPy. Expected output:</p><pre><code>out=0.7071\nx1.grad=-1.5000\nw1.grad=1.0000\nx2.grad=0.5000\nw2.grad=0.0000\nloss=0.4170\ngrad=[-0.341, 0.242, 0.099]</code></pre>",
   "starter": "import math\nimport numpy as np\n\nclass Value:\n    def __init__(self, data, parents=()):\n        self.data, self.grad = data, 0.0\n        self._parents, self._backward = parents, lambda: None\n\n    def __add__(self, other):\n        out = Value(self.data + other.data, (self, other))\n        # TODO: define _backward: both inputs get out.grad\n        return out\n\n    def __mul__(self, other):\n        out = Value(self.data * other.data, (self, other))\n        # TODO: define _backward: self gets other.data * out.grad, and vice versa\n        return out\n\n    def tanh(self):\n        t = math.tanh(self.data)\n        out = Value(t, (self,))\n        # TODO: define _backward: local derivative is 1 - t**2\n        return out\n\n    def backward(self):\n        order, seen = [], set()\n        def visit(v):\n            if v not in seen:\n                seen.add(v)\n                for p in v._parents:\n                    visit(p)\n                order.append(v)\n        visit(self)\n        self.grad = 1.0\n        for v in reversed(order):\n            v._backward()\n\nx1, x2 = Value(2.0), Value(0.0)\nw1, w2 = Value(-3.0), Value(1.0)\nb = Value(6.881373587019543)\nout = (x1 * w1 + x2 * w2 + b).tanh()\nout.backward()\nprint(f\"out={out.data:.4f}\")\nfor name, v in [(\"x1\", x1), (\"w1\", w1), (\"x2\", x2), (\"w2\", w2)]:\n    print(f\"{name}.grad={v.grad:.4f}\")\n\n# softmax + cross-entropy for logits z and true class y\nz = np.array([2.0, 1.0, 0.1])\ny = 0\np = None      # TODO: stable softmax (subtract z.max())\nloss = 0.0    # TODO: -log p[y]\ngrad = None   # TODO: p - onehot(y)\nprint(f\"loss={loss:.4f}\")\nprint(\"grad=[\" + \", \".join(f\"{g:.3f}\" for g in grad) + \"]\")\n",
   "expected": "out=0.7071\nx1.grad=-1.5000\nw1.grad=1.0000\nx2.grad=0.5000\nw2.grad=0.0000\nloss=0.4170\ngrad=[-0.341, 0.242, 0.099]",
   "solution": "import math\nimport numpy as np\n\nclass Value:\n    def __init__(self, data, parents=()):\n        self.data, self.grad = data, 0.0\n        self._parents, self._backward = parents, lambda: None\n\n    def __add__(self, other):\n        out = Value(self.data + other.data, (self, other))\n        def _backward():\n            self.grad += out.grad\n            other.grad += out.grad\n        out._backward = _backward\n        return out\n\n    def __mul__(self, other):\n        out = Value(self.data * other.data, (self, other))\n        def _backward():\n            self.grad += other.data * out.grad\n            other.grad += self.data * out.grad\n        out._backward = _backward\n        return out\n\n    def tanh(self):\n        t = math.tanh(self.data)\n        out = Value(t, (self,))\n        def _backward():\n            self.grad += (1 - t ** 2) * out.grad\n        out._backward = _backward\n        return out\n\n    def backward(self):\n        order, seen = [], set()\n        def visit(v):\n            if v not in seen:\n                seen.add(v)\n                for p in v._parents:\n                    visit(p)\n                order.append(v)\n        visit(self)\n        self.grad = 1.0\n        for v in reversed(order):\n            v._backward()\n\nx1, x2 = Value(2.0), Value(0.0)\nw1, w2 = Value(-3.0), Value(1.0)\nb = Value(6.881373587019543)\nout = (x1 * w1 + x2 * w2 + b).tanh()\nout.backward()\nprint(f\"out={out.data:.4f}\")\nfor name, v in [(\"x1\", x1), (\"w1\", w1), (\"x2\", x2), (\"w2\", w2)]:\n    print(f\"{name}.grad={v.grad:.4f}\")\n\nz = np.array([2.0, 1.0, 0.1])\ny = 0\ne = np.exp(z - z.max())\np = e / e.sum()\nloss = -math.log(p[y])\ngrad = p.copy()\ngrad[y] -= 1\nprint(f\"loss={loss:.4f}\")\nprint(\"grad=[\" + \", \".join(f\"{g:.3f}\" for g in grad) + \"]\")\n",
   "hint": "Each _backward multiplies out.grad by the local derivative and adds (+=) it to the input's grad. For softmax: e = np.exp(z - z.max()); p = e / e.sum()."
  },
  "quiz": [
   {
    "q": "In out = a * b, with a = 3, b = 5 and out.grad = 2, what gradient does a receive?",
    "options": [
     "2",
     "6",
     "10",
     "15"
    ],
    "answer": 2,
    "why": "The local derivative of a*b with respect to a is b = 5; times the incoming gradient 2 gives 10."
   },
   {
    "q": "Why does autograd accumulate gradients with += instead of =?",
    "options": [
     "It is faster",
     "A value used in several places gets a gradient contribution from each use, and these must be summed",
     "To support integers",
     "Because PyTorch requires it for the GPU"
    ],
    "answer": 1,
    "why": "Multivariable chain rule: total derivative is the sum over all paths. This is also why you must zero gradients between steps."
   },
   {
    "q": "What should you pass to F.cross_entropy?",
    "options": [
     "Raw logits and integer class labels",
     "Softmax probabilities and one-hot labels",
     "Log-probabilities and probabilities",
     "Sigmoid outputs"
    ],
    "answer": 0,
    "why": "F.cross_entropy applies log-softmax itself; passing probabilities applies softmax twice."
   },
   {
    "q": "What is the gradient of softmax cross-entropy with respect to the logits?",
    "options": [
     "−log p",
     "p · (1 − p)",
     "onehot(y) / p",
     "p − onehot(y)"
    ],
    "answer": 3,
    "why": "The combined derivative simplifies to predicted probabilities minus the one-hot target."
   }
  ]
 },
 "6.1": {
  "minutes": 55,
  "learn": "\n<p>Almost every PyTorch project, from MNIST to Faster R-CNN, uses the same five-line inner loop. Write it from memory until you can do it half asleep; frameworks like Lightning only hide it.</p>\n\n<h3>Data: Dataset and DataLoader</h3>\n<p>A <code>Dataset</code> answers two questions: how many samples (<code>__len__</code>) and what is sample i (<code>__getitem__</code>). A <code>DataLoader</code> batches, shuffles and loads in background workers.</p>\n<pre><code>from torch.utils.data import DataLoader\nfrom torchvision import datasets, transforms\ntf = transforms.ToTensor()\ntrain_ds = datasets.MNIST(\"data\", train=True, download=True, transform=tf)\ntrain_dl = DataLoader(train_ds, batch_size=64, shuffle=True, num_workers=2)</code></pre>\n\n<h3>The loop</h3>\n<pre><code>model = nn.Sequential(nn.Flatten(), nn.Linear(784, 128), nn.ReLU(), nn.Linear(128, 10)).to(device)\nopt = torch.optim.Adam(model.parameters(), lr=1e-3)\nfor epoch in range(epochs):\n    model.train()\n    for x, y in train_dl:\n        x, y = x.to(device), y.to(device)\n        logits = model(x)                    # 1. forward\n        loss = F.cross_entropy(logits, y)    # 2. loss\n        opt.zero_grad()                      # 3. clear old gradients\n        loss.backward()                      # 4. backward\n        opt.step()                           # 5. update weights</code></pre>\n\n<h3>Validation, early stopping, checkpoints</h3>\n<pre><code>    model.eval()\n    with torch.no_grad():                    # no graph, less memory\n        val_loss = sum(F.cross_entropy(model(x.to(device)), y.to(device)).item()\n                       for x, y in val_dl) / len(val_dl)\n    if val_loss &lt; best:\n        best, bad_epochs = val_loss, 0\n        torch.save({\"model\": model.state_dict(), \"opt\": opt.state_dict(), \"epoch\": epoch}, \"best.pt\")\n    else:\n        bad_epochs += 1\n        if bad_epochs &gt;= patience:\n            break</code></pre>\n<p><code>model.eval()</code> switches dropout off and makes batch norm use its running statistics. <code>torch.no_grad()</code> stops autograd recording. They do different things; you usually want both.</p>\n<p>Early stopping keeps the weights from the epoch with the best <b>validation</b> loss, not the last epoch. Training loss keeps going down while the model overfits; validation loss turns back up.</p>\n\n<h3>Devices, seeds and resuming</h3>\n<p>Pick the device once with <code>device = \"cuda\" if torch.cuda.is_available() else \"cpu\"</code> and move both the model and every batch to it; a mismatch raises \"Expected all tensors to be on the same device\". For runs you can compare, set <code>torch.manual_seed(0)</code> (and the NumPy and Python seeds) at the top of the script. To resume after a crash, load the checkpoint with <code>ckpt = torch.load(\"best.pt\")</code>, then call <code>model.load_state_dict(ckpt[\"model\"])</code> and <code>opt.load_state_dict(ckpt[\"opt\"])</code>. Saving the optimizer state matters for Adam, which keeps running averages of gradients for each parameter.</p>\n\n<h3>Mixed precision</h3>\n<p>On modern GPUs, float16/bfloat16 matmuls are much faster. <code>autocast</code> picks the precision per operation; <code>GradScaler</code> scales the fp16 loss so small gradients do not underflow to zero.</p>\n<pre><code>scaler = torch.amp.GradScaler()\nwith torch.autocast(device_type=\"cuda\", dtype=torch.float16):\n    loss = F.cross_entropy(model(x), y)\nopt.zero_grad()\nscaler.scale(loss).backward()\nscaler.step(opt)\nscaler.update()</code></pre>\n\n<h3>Logging and profiling</h3>\n<pre><code>from torch.utils.tensorboard import SummaryWriter\nw = SummaryWriter(\"runs/mlp\")\nw.add_scalar(\"loss/val\", val_loss, epoch)      # view with: tensorboard --logdir runs\n\nfrom torch.profiler import profile, ProfilerActivity\nwith profile(activities=[ProfilerActivity.CPU, ProfilerActivity.CUDA]) as prof:\n    train_one_epoch()\nprint(prof.key_averages().table(sort_by=\"cuda_time_total\", row_limit=10))</code></pre>\n<p>If the GPU sits idle while the profiler shows time in data loading, raise <code>num_workers</code> or set <code>pin_memory=True</code>.</p>\n<blockquote>Common mistake: logging <code>loss</code> instead of <code>loss.item()</code>. The tensor keeps the whole graph alive, and memory grows every step.</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "python",
   "prompt": "<p>Write the training loop by hand in NumPy for a linear model <code>y = w·x + b</code> with MSE loss. Each epoch: forward on the training set, compute gradients, update with learning rate 0.02, then compute validation loss. Keep the best validation loss and the (w, b) at that epoch (your \"checkpoint\"). Stop early if validation loss has not improved for <code>patience = 3</code> epochs. Print the loss every 10 epochs, then the result. Expected output:</p><pre><code>epoch 0 train=21.2575 val=18.4547\nepoch 10 train=0.5431 val=0.5000\nepoch 20 train=0.0210 val=0.0196\nepoch 30 train=0.0076 val=0.0031\nepoch 40 train=0.0072 val=0.0020\nepoch 50 train=0.0071 val=0.0019\nstopped at epoch 52\nbest val=0.0019 w=2.024 b=0.979</code></pre><p>MSE gradients: <code>dw = 2·mean((pred − y)·x)</code>, <code>db = 2·mean(pred − y)</code>.</p>",
   "starter": "import numpy as np\n\nx_tr = np.array([0.0, 1.0, 2.0, 3.0])\ny_tr = np.array([1.1, 2.9, 5.0, 7.1])\nx_va = np.array([1.5, 2.5])\ny_va = np.array([4.0, 6.1])\n\nw, b, lr = 0.0, 0.0, 0.02\nbest, best_wb, bad, patience = float(\"inf\"), None, 0, 3\n\nfor epoch in range(1000):\n    # TODO 1. forward on train, 2. train loss (MSE)\n    # TODO 3. gradients dw, db   4. update w, b\n    # TODO 5. validation loss with the updated w, b\n    train_loss, val_loss = 0.0, 0.0\n    if epoch % 10 == 0:\n        print(f\"epoch {epoch} train={train_loss:.4f} val={val_loss:.4f}\")\n    # TODO 6. checkpoint if val improved, else count bad epochs and break at patience\n\nprint(f\"stopped at epoch {epoch}\")\nprint(f\"best val={best:.4f} w={best_wb[0]:.3f} b={best_wb[1]:.3f}\")\n",
   "expected": "epoch 0 train=21.2575 val=18.4547\nepoch 10 train=0.5431 val=0.5000\nepoch 20 train=0.0210 val=0.0196\nepoch 30 train=0.0076 val=0.0031\nepoch 40 train=0.0072 val=0.0020\nepoch 50 train=0.0071 val=0.0019\nstopped at epoch 52\nbest val=0.0019 w=2.024 b=0.979",
   "solution": "import numpy as np\n\nx_tr = np.array([0.0, 1.0, 2.0, 3.0])\ny_tr = np.array([1.1, 2.9, 5.0, 7.1])\nx_va = np.array([1.5, 2.5])\ny_va = np.array([4.0, 6.1])\n\nw, b, lr = 0.0, 0.0, 0.02\nbest, best_wb, bad, patience = float(\"inf\"), None, 0, 3\n\nfor epoch in range(1000):\n    pred = w * x_tr + b\n    err = pred - y_tr\n    train_loss = float(np.mean(err ** 2))\n    dw = 2 * float(np.mean(err * x_tr))\n    db = 2 * float(np.mean(err))\n    w -= lr * dw\n    b -= lr * db\n    val_loss = float(np.mean((w * x_va + b - y_va) ** 2))\n    if epoch % 10 == 0:\n        print(f\"epoch {epoch} train={train_loss:.4f} val={val_loss:.4f}\")\n    if val_loss < best:\n        best, best_wb, bad = val_loss, (w, b), 0\n    else:\n        bad += 1\n        if bad >= patience:\n            break\n\nprint(f\"stopped at epoch {epoch}\")\nprint(f\"best val={best:.4f} w={best_wb[0]:.3f} b={best_wb[1]:.3f}\")\n",
   "hint": "Compute err = pred - y_tr once and reuse it for the loss and both gradients. Reset bad to 0 whenever you save a new best."
  },
  "quiz": [
   {
    "q": "What goes wrong if you remove opt.zero_grad() from the loop?",
    "options": [
     "Nothing, step() clears gradients",
     "Gradients from every previous batch keep adding up, so updates become wrong and grow",
     "The loss is not computed",
     "The model is moved to CPU"
    ],
    "answer": 1,
    "why": "PyTorch accumulates into .grad; without zeroing, each step uses the sum of all past gradients."
   },
   {
    "q": "During validation you call torch.no_grad() but forget model.eval(). What still behaves differently from inference?",
    "options": [
     "Nothing",
     "The optimizer still updates weights",
     "Dropout stays active and batch norm uses batch statistics",
     "Gradients are still recorded"
    ],
    "answer": 2,
    "why": "no_grad only stops graph recording; train/eval mode controls dropout and batch norm."
   },
   {
    "q": "Early stopping should restore which weights?",
    "options": [
     "From the epoch with the lowest validation loss",
     "From the last epoch",
     "From the epoch with the lowest training loss",
     "Randomly initialised weights"
    ],
    "answer": 0,
    "why": "Validation loss estimates generalisation; the last epoch may already be overfitting."
   },
   {
    "q": "Why is GradScaler used with float16 autocast?",
    "options": [
     "To make the model smaller on disk",
     "To scale the loss so tiny gradients do not underflow to zero in fp16",
     "To normalise the input images",
     "To choose the learning rate"
    ],
    "answer": 1,
    "why": "fp16 has a small range; scaling the loss up before backward and unscaling before step keeps small gradients representable."
   }
  ]
 },
 "6.2": {
  "minutes": 55,
  "learn": "\n<p>Convolutional networks dominated image tasks for a decade and are still the default for medical imaging with limited data. You need three things: how a convolution layer works, why residual connections made deep networks trainable, and how to fine-tune a pretrained model.</p>\n\n<h3>The convolution layer</h3>\n<p>A conv layer slides small learned filters (for example 3×3) over the image. At each position it computes a dot product between the filter and the patch under it. Deep learning \"convolution\" is actually <b>cross-correlation</b>: the kernel is not flipped. The same filter is reused at every position (weight sharing), so a layer has far fewer parameters than a fully connected one.</p>\n<p>Output size along one dimension, for input size <code>n</code>, kernel <code>k</code>, padding <code>p</code>, stride <code>s</code>:</p>\n<pre><code>out = floor((n + 2p − k) / s) + 1</code></pre>\n<p>A 3×3 conv with <code>padding=1, stride=1</code> keeps the size; <code>stride=2</code> roughly halves it. Parameters of <code>nn.Conv2d(C_in, C_out, k)</code>: <code>C_out · C_in · k · k + C_out</code> (the last term is the bias).</p>\n<pre><code>import torch.nn as nn\nconv = nn.Conv2d(3, 64, kernel_size=7, stride=2, padding=3)   # ResNet stem\nx = torch.randn(1, 3, 224, 224)\nprint(conv(x).shape)            # torch.Size([1, 64, 112, 112])</code></pre>\n\n<h3>A small CNN</h3>\n<pre><code>net = nn.Sequential(\n    nn.Conv2d(3, 32, 3, padding=1), nn.BatchNorm2d(32), nn.ReLU(), nn.MaxPool2d(2),   # 32→16\n    nn.Conv2d(32, 64, 3, padding=1), nn.BatchNorm2d(64), nn.ReLU(), nn.MaxPool2d(2),  # 16→8\n    nn.Flatten(), nn.Linear(64 * 8 * 8, 10))</code></pre>\n<p>With augmentation (random crop, horizontal flip) a network like this reaches around 70–80% on CIFAR-10.</p>\n\n<h3>ResNet: residual connections</h3>\n<p>Before ResNet, stacking more layers often made <i>training</i> accuracy worse: gradients struggled to pass through many layers. ResNet's fix is to let each block learn a correction added to its input: <code>y = F(x) + x</code>. If a block is not useful it can learn <code>F ≈ 0</code>, and the identity path gives gradients a direct route back.</p>\n<pre><code>class BasicBlock(nn.Module):\n    def __init__(self, cin, cout, stride=1):\n        super().__init__()\n        self.c1 = nn.Conv2d(cin, cout, 3, stride, 1, bias=False); self.b1 = nn.BatchNorm2d(cout)\n        self.c2 = nn.Conv2d(cout, cout, 3, 1, 1, bias=False);     self.b2 = nn.BatchNorm2d(cout)\n        self.skip = nn.Identity()\n        if stride != 1 or cin != cout:       # shapes differ: project with 1x1 conv\n            self.skip = nn.Sequential(nn.Conv2d(cin, cout, 1, stride, bias=False), nn.BatchNorm2d(cout))\n    def forward(self, x):\n        out = F.relu(self.b1(self.c1(x)))\n        out = self.b2(self.c2(out))\n        return F.relu(out + self.skip(x))</code></pre>\n<p>ResNet-18 is a stem, four stages of two BasicBlocks each (64, 128, 256, 512 channels), global average pooling and one linear layer.</p>\n\n<h3>EfficientNet</h3>\n<p>EfficientNet's key idea is <b>compound scaling</b>: instead of only making a network deeper, scale depth, width (channels) and input resolution together with fixed ratios. Its blocks are MBConv: depthwise-separable convolutions with squeeze-and-excitation. EfficientNet-B0 has about 5.3M parameters, versus about 25.6M for ResNet-50, at similar ImageNet accuracy.</p>\n\n<h3>Fine-tuning pretrained models</h3>\n<pre><code>from torchvision.models import resnet50, ResNet50_Weights\nw = ResNet50_Weights.DEFAULT\nmodel = resnet50(weights=w)\nmodel.fc = nn.Linear(model.fc.in_features, num_classes)   # new head\npreprocess = w.transforms()                               # the normalisation it was trained with</code></pre>\n<p>Typical recipe: freeze the backbone and train only the head for a few epochs, then unfreeze everything with a smaller learning rate (for example 1e-4).</p>\n<blockquote>Common mistake: feeding a pretrained model images without the ImageNet mean/std normalisation it was trained on. It still runs, but accuracy drops sharply.</blockquote>\n<p>Afterwards, a confusion matrix (<code>sklearn.metrics.confusion_matrix</code>) tells you <i>which</i> classes get mixed up; look at the actual misclassified images before changing the model.</p>\n",
  "practice": {
   "type": "code",
   "lang": "python",
   "prompt": "<p>Three parts, in NumPy:</p><ol><li><code>out_size(n, k, p, s)</code> using the conv formula. Print output sizes for a 224 input through a 7×7/stride 2/pad 3 conv, a 3×3/stride 2/pad 1 max-pool after it, and a 3×3/stride 1/pad 1 conv.</li><li><code>conv_params(cin, cout, k)</code> with bias. Print params of Conv2d(3, 64, 7) and Conv2d(64, 128, 3).</li><li><code>conv2d(x, k)</code>: a manual 2-D cross-correlation (no padding, stride 1) using two loops over output positions. Apply a vertical-edge kernel to a 4×5 image and print each output row.</li></ol><p>Expected output:</p><pre><code>112 56 56\n9472 73856\n[0, 3, 3]\n[0, 3, 3]</code></pre>",
   "starter": "import numpy as np\n\ndef out_size(n, k, p, s):\n    # floor((n + 2p - k) / s) + 1\n    pass\n\ndef conv_params(cin, cout, k):\n    # weights + bias\n    pass\n\ndef conv2d(x, k):\n    kh, kw = k.shape\n    H, W = x.shape[0] - kh + 1, x.shape[1] - kw + 1\n    out = np.zeros((H, W), dtype=int)\n    # TODO: out[i, j] = sum of x[i:i+kh, j:j+kw] * k\n    return out\n\na = out_size(224, 7, 3, 2)\nb = out_size(a, 3, 1, 2)\nc = out_size(b, 3, 1, 1)\nprint(a, b, c)\nprint(conv_params(3, 64, 7), conv_params(64, 128, 3))\n\nimg = np.array([[0, 0, 0, 1, 1],\n                [0, 0, 0, 1, 1],\n                [0, 0, 0, 1, 1],\n                [0, 0, 0, 1, 1]])\nkern = np.array([[-1, 0, 1],\n                 [-1, 0, 1],\n                 [-1, 0, 1]])\nfor row in conv2d(img, kern):\n    print([int(v) for v in row])\n",
   "expected": "112 56 56\n9472 73856\n[0, 3, 3]\n[0, 3, 3]",
   "solution": "import numpy as np\n\ndef out_size(n, k, p, s):\n    return (n + 2 * p - k) // s + 1\n\ndef conv_params(cin, cout, k):\n    return cout * cin * k * k + cout\n\ndef conv2d(x, k):\n    kh, kw = k.shape\n    H, W = x.shape[0] - kh + 1, x.shape[1] - kw + 1\n    out = np.zeros((H, W), dtype=int)\n    for i in range(H):\n        for j in range(W):\n            out[i, j] = np.sum(x[i:i + kh, j:j + kw] * k)\n    return out\n\na = out_size(224, 7, 3, 2)\nb = out_size(a, 3, 1, 2)\nc = out_size(b, 3, 1, 1)\nprint(a, b, c)\nprint(conv_params(3, 64, 7), conv_params(64, 128, 3))\n\nimg = np.array([[0, 0, 0, 1, 1],\n                [0, 0, 0, 1, 1],\n                [0, 0, 0, 1, 1],\n                [0, 0, 0, 1, 1]])\nkern = np.array([[-1, 0, 1],\n                 [-1, 0, 1],\n                 [-1, 0, 1]])\nfor row in conv2d(img, kern):\n    print([int(v) for v in row])\n",
   "hint": "Use integer division // for the floor. In conv2d, slice the patch x[i:i+kh, j:j+kw], multiply elementwise by k and sum."
  },
  "quiz": [
   {
    "q": "A 3×3 conv with stride 1 and padding 0 is applied to a 32×32 input. What is the output size?",
    "options": [
     "32×32",
     "31×31",
     "30×30",
     "16×16"
    ],
    "answer": 2,
    "why": "(32 + 0 − 3)/1 + 1 = 30. Use padding=1 to keep 32."
   },
   {
    "q": "What problem did residual connections mainly solve?",
    "options": [
     "Very deep plain networks were hard to optimise, so even training accuracy got worse with depth",
     "CNNs used too much memory",
     "Images had to be square",
     "Batch norm was too slow"
    ],
    "answer": 0,
    "why": "The identity path lets a block default to doing nothing and gives gradients a direct route, so deeper networks train well."
   },
   {
    "q": "In a ResNet block where the stride is 2 and channels go 64→128, why is a 1×1 conv put on the skip path?",
    "options": [
     "To add more parameters",
     "To replace batch norm",
     "So the skip tensor has the same shape as F(x) and they can be added",
     "To apply dropout"
    ],
    "answer": 2,
    "why": "Addition needs equal shapes; the 1×1 stride-2 conv matches channels and spatial size."
   },
   {
    "q": "What is EfficientNet's compound scaling?",
    "options": [
     "Only adding more layers",
     "Scaling depth, width and input resolution together with fixed ratios",
     "Training on several datasets at once",
     "Using larger kernels everywhere"
    ],
    "answer": 1,
    "why": "Balancing all three dimensions gives better accuracy per parameter than scaling one alone."
   }
  ]
 },
 "6.3": {
  "minutes": 60,
  "learn": "\n<p>Classification says <i>what</i> is in an image. Detection says what and <i>where</i>: a set of boxes, each with a class and a score. Faster R-CNN is a two-stage detector and the model torchvision's detection tutorial uses. It is a good fit for nodule detection later.</p>\n\n<h3>The two stages</h3>\n<ol>\n<li><b>Backbone + FPN</b>: a CNN (for example ResNet-50) produces feature maps. The Feature Pyramid Network combines them at several scales so small and large objects are both visible.</li>\n<li><b>Region Proposal Network (RPN)</b>: at every feature-map position it places a set of <b>anchors</b>, fixed reference boxes of several sizes and aspect ratios. For each anchor it predicts an objectness score and four offsets that adjust the anchor into a better box. The top few thousand proposals survive non-max suppression.</li>\n<li><b>RoI head</b>: each proposal is cut out of the feature map with <b>RoI Align</b> (a fixed-size, for example 7×7, bilinearly sampled crop; the original paper used RoI Pooling, which rounds coordinates). A small network classifies the crop and refines the box again.</li>\n</ol>\n\n<h3>IoU: the basic measure</h3>\n<p>Intersection over Union compares two boxes <code>(x1, y1, x2, y2)</code>:</p>\n<pre><code>ix1, iy1 = max(a.x1, b.x1), max(a.y1, b.y1)\nix2, iy2 = min(a.x2, b.x2), min(a.y2, b.y2)\ninter = max(0, ix2 - ix1) * max(0, iy2 - iy1)\niou = inter / (area(a) + area(b) - inter)</code></pre>\n<p>IoU is used three times: to assign anchors to ground-truth boxes in training, in non-max suppression, and to decide whether a prediction counts as a hit when computing mAP.</p>\n\n<h3>Non-max suppression (NMS)</h3>\n<p>Detectors fire many overlapping boxes on the same object. NMS keeps the best one: sort by score, keep the top box, drop every remaining box whose IoU with it is above a threshold (often 0.5), repeat. NMS is done per class. In PyTorch: <code>torchvision.ops.nms(boxes, scores, 0.5)</code>.</p>\n\n<h3>Running and fine-tuning in torchvision</h3>\n<pre><code>from torchvision.models.detection import fasterrcnn_resnet50_fpn, FasterRCNN_ResNet50_FPN_Weights\nfrom torchvision.models.detection.faster_rcnn import FastRCNNPredictor\nmodel = fasterrcnn_resnet50_fpn(weights=FasterRCNN_ResNet50_FPN_Weights.DEFAULT)\nmodel.eval()\npred = model([img_tensor])[0]           # dict: boxes, labels, scores\n\n# fine-tune: replace the box predictor (num_classes includes background)\nin_f = model.roi_heads.box_predictor.cls_score.in_features\nmodel.roi_heads.box_predictor = FastRCNNPredictor(in_f, num_classes=2)\nmodel.train()\nlosses = model(images, targets)          # targets: [{\"boxes\": Tensor[N,4], \"labels\": Tensor[N]}]\nloss = sum(losses.values())</code></pre>\n<p>In train mode the model returns a dict of losses (RPN objectness, RPN box, classifier, box regression); in eval mode it returns predictions. Images are a <i>list</i> of tensors because they may have different sizes.</p>\n\n<h3>Evaluation: precision, recall, AP</h3>\n<p>Sort predictions by score. Walk down the list: a prediction is a true positive if it matches an unmatched ground-truth box with IoU ≥ 0.5, otherwise a false positive. This gives a precision–recall curve; <b>AP</b> is the area under it, and <b>mAP</b> is AP averaged over classes. COCO-style mAP also averages over IoU thresholds 0.5 to 0.95. For screening, recall at a fixed number of false positives per image often matters more than mAP.</p>\n<blockquote>Common mistake: forgetting that class 0 is background in torchvision detection models. With one object type you need <code>num_classes=2</code>, and your labels must start at 1.</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "python",
   "prompt": "<p>Implement <code>iou(a, b)</code> for boxes <code>(x1, y1, x2, y2)</code> and greedy <code>nms(boxes, scores, thr)</code> that returns the kept indices in score order. Then count true positives at IoU ≥ 0.5 against one ground-truth box (each GT box can be matched only once) and print recall and precision. Expected output:</p><pre><code>iou(0,1)=0.818\niou(0,2)=0.000\nkept=[0, 2, 3]\nTP=1 FP=2 recall=1.00 precision=0.33</code></pre>",
   "starter": "import numpy as np\n\ndef iou(a, b):\n    # TODO: intersection rectangle, clamp at 0, divide by union\n    pass\n\ndef nms(boxes, scores, thr):\n    order = list(np.argsort(-scores))\n    keep = []\n    # TODO: take best, keep it, drop the rest with iou > thr, repeat\n    return keep\n\nboxes = np.array([[10, 10, 50, 50],\n                  [12, 12, 52, 48],\n                  [60, 60, 90, 90],\n                  [11, 30, 50, 70]], dtype=float)\nscores = np.array([0.9, 0.8, 0.7, 0.6])\nprint(f\"iou(0,1)={iou(boxes[0], boxes[1]):.3f}\")\nprint(f\"iou(0,2)={iou(boxes[0], boxes[2]):.3f}\")\nkept = nms(boxes, scores, 0.5)\nprint(\"kept=\" + str([int(i) for i in kept]))\n\ngt = [np.array([10, 10, 50, 50], dtype=float)]\n# TODO: for each kept box in score order, TP if it matches an unused gt with iou >= 0.5\ntp, fp = 0, 0\nprint(f\"TP={tp} FP={fp} recall={tp / len(gt):.2f} precision={tp / (tp + fp):.2f}\")\n",
   "expected": "iou(0,1)=0.818\niou(0,2)=0.000\nkept=[0, 2, 3]\nTP=1 FP=2 recall=1.00 precision=0.33",
   "solution": "import numpy as np\n\ndef iou(a, b):\n    ix1, iy1 = max(a[0], b[0]), max(a[1], b[1])\n    ix2, iy2 = min(a[2], b[2]), min(a[3], b[3])\n    inter = max(0.0, ix2 - ix1) * max(0.0, iy2 - iy1)\n    area = lambda r: (r[2] - r[0]) * (r[3] - r[1])\n    return float(inter / (area(a) + area(b) - inter))\n\ndef nms(boxes, scores, thr):\n    order = list(np.argsort(-scores))\n    keep = []\n    while order:\n        i = order.pop(0)\n        keep.append(i)\n        order = [j for j in order if iou(boxes[i], boxes[j]) <= thr]\n    return keep\n\nboxes = np.array([[10, 10, 50, 50],\n                  [12, 12, 52, 48],\n                  [60, 60, 90, 90],\n                  [11, 30, 50, 70]], dtype=float)\nscores = np.array([0.9, 0.8, 0.7, 0.6])\nprint(f\"iou(0,1)={iou(boxes[0], boxes[1]):.3f}\")\nprint(f\"iou(0,2)={iou(boxes[0], boxes[2]):.3f}\")\nkept = nms(boxes, scores, 0.5)\nprint(\"kept=\" + str([int(i) for i in kept]))\n\ngt = [np.array([10, 10, 50, 50], dtype=float)]\nused = [False] * len(gt)\ntp, fp = 0, 0\nfor i in kept:\n    hit = False\n    for g in range(len(gt)):\n        if not used[g] and iou(boxes[i], gt[g]) >= 0.5:\n            used[g] = hit = True\n            break\n    if hit:\n        tp += 1\n    else:\n        fp += 1\nprint(f\"TP={tp} FP={fp} recall={tp / len(gt):.2f} precision={tp / (tp + fp):.2f}\")\n",
   "hint": "Intersection width is max(0, min(x2s) - max(x1s)). In NMS, after popping the best index, rebuild the list keeping only boxes with iou <= thr."
  },
  "quiz": [
   {
    "q": "What is an anchor in Faster R-CNN?",
    "options": [
     "A ground-truth box",
     "A fixed reference box at a feature-map position that the RPN scores and adjusts",
     "The final predicted box",
     "A pixel on the object boundary"
    ],
    "answer": 1,
    "why": "Anchors of several sizes and aspect ratios tile the image; the RPN predicts objectness and offsets for each."
   },
   {
    "q": "Two boxes of area 100 overlap with intersection area 50. What is their IoU?",
    "options": [
     "0.50",
     "0.25",
     "0.75",
     "0.33"
    ],
    "answer": 3,
    "why": "Union = 100 + 100 − 50 = 150, so IoU = 50/150 ≈ 0.33."
   },
   {
    "q": "Why is NMS needed?",
    "options": [
     "To remove duplicate overlapping detections of the same object",
     "To speed up the backbone",
     "To compute the loss",
     "To resize images"
    ],
    "answer": 0,
    "why": "Neighbouring anchors fire on the same object; NMS keeps the highest-scoring one."
   },
   {
    "q": "You fine-tune torchvision Faster R-CNN to detect only nodules. What should num_classes be?",
    "options": [
     "1",
     "0",
     "2",
     "91"
    ],
    "answer": 2,
    "why": "torchvision reserves class 0 for background, so one object class means num_classes = 2."
   }
  ]
 }
});
