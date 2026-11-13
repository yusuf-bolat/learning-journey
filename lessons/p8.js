// Phase 8 lesson content. Generated; verified practice solutions.
Object.assign(LESSONS,{
 "8.0": {
  "minutes": 55,
  "learn": "\n<p>Attention is the one new idea in the Transformer (Vaswani et al., 2017). Everything else (MLPs, residuals, layer norm, embeddings) you already know. Once you can write attention from memory, a GPT is about 100 lines of PyTorch.</p>\n\n<h3>Queries, keys and values</h3>\n<p>Each token's vector <code>x</code> is projected three ways: a <b>query</b> q (\"what am I looking for?\"), a <b>key</b> k (\"what do I contain?\") and a <b>value</b> v (\"what do I hand over if chosen?\"). The score between token i and token j is the dot product <code>q_i · k_j</code>. Scores go through a softmax so each row becomes weights that sum to 1, and the output for token i is the weighted average of the values.</p>\n<pre><code>Attention(Q, K, V) = softmax(Q Kᵀ / √d_k) V</code></pre>\n\n<h3>Why divide by √d_k?</h3>\n<p>If q and k have independent entries with variance 1, their dot product has variance d_k. For d_k = 64 scores spread over roughly ±8 and the softmax saturates: one weight near 1, the rest near 0, and gradients vanish. Dividing by √d_k brings the variance back to about 1.</p>\n\n<h3>The causal mask</h3>\n<p>A language model predicts token t+1 from tokens 0..t, so token i must not see any j &gt; i. Set those scores to −∞ before the softmax; exp(−∞) = 0, so they get zero weight. The mask is the strict upper triangle of a T×T matrix.</p>\n<pre><code>import torch, torch.nn as nn, torch.nn.functional as F\n\nclass CausalSelfAttention(nn.Module):\n    def __init__(self, d_model, n_head, max_T):\n        super().__init__()\n        self.n_head = n_head\n        self.qkv = nn.Linear(d_model, 3 * d_model)\n        self.proj = nn.Linear(d_model, d_model)\n        mask = torch.tril(torch.ones(max_T, max_T, dtype=torch.bool))\n        self.register_buffer(\"mask\", mask)\n\n    def forward(self, x):                      # x: (B, T, C)\n        B, T, C = x.shape\n        q, k, v = self.qkv(x).split(C, dim=2)\n        # (B, T, C) -&gt; (B, n_head, T, head_dim)\n        q, k, v = [t.view(B, T, self.n_head, C // self.n_head).transpose(1, 2)\n                   for t in (q, k, v)]\n        att = q @ k.transpose(-2, -1) / (k.size(-1) ** 0.5)   # (B, h, T, T)\n        att = att.masked_fill(~self.mask[:T, :T], float(\"-inf\"))\n        att = F.softmax(att, dim=-1)\n        y = att @ v                                          # (B, h, T, head_dim)\n        y = y.transpose(1, 2).contiguous().view(B, T, C)     # concat heads\n        return self.proj(y)</code></pre>\n<p>In real code use <code>F.scaled_dot_product_attention(q, k, v, is_causal=True)</code>, which computes the same thing with a fused kernel.</p>\n\n<h3>Multi-head attention</h3>\n<p>Instead of one attention with width C, split C into h heads of size C/h and run attention in each. Different heads can learn different patterns (previous token, matching bracket, same word earlier). Cost is the same as one wide head; the heads are concatenated and mixed by the output projection.</p>\n\n<h3>The block and the model</h3>\n<pre><code>x = x + attn(ln1(x))      # tokens talk to each other\nx = x + mlp(ln2(x))       # each token thinks on its own (4C hidden, GELU)</code></pre>\n<p>A GPT is: token embedding + position embedding, N such blocks, a final layer norm, and a linear head to vocabulary logits trained with cross-entropy on the next token.</p>\n\n<h3>Tokenisation: BPE in one paragraph</h3>\n<p>Byte-pair encoding starts from raw bytes (256 symbols) and repeatedly merges the most frequent adjacent pair into a new token, recording each merge. Encoding applies the merges in the order they were learned. Karpathy's <i>minbpe</i> implements this in about 100 lines.</p>\n\n<blockquote>Common mistake: applying the softmax over the wrong axis. Weights must sum to 1 over the <b>keys</b> (last axis, dim=-1), one distribution per query row. Check <code>att.sum(-1)</code> is all ones.</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "python",
   "prompt": "<p>Implement causal scaled dot-product attention in NumPy for 3 tokens with d_k = 4. Use a numerically stable softmax (subtract the row max). Print the 3×3 attention weights, the 3×2 output and each weight row's sum. Expected output:</p><pre><code>weights:\n1.0000 0.0000 0.0000\n0.5000 0.5000 0.0000\n0.2741 0.2741 0.4519\noutput:\n1.0000 2.0000\n2.0000 3.0000\n3.3556 4.3556\nrow sums: 1.0 1.0 1.0</code></pre>",
   "starter": "import numpy as np\n\ndef softmax(x):\n    # TODO: subtract the max of each row, exponentiate, divide by the row sum\n    pass\n\ndef attention(Q, K, V):\n    d = Q.shape[-1]\n    # TODO: scores = Q K^T / sqrt(d)\n    # TODO: set scores above the diagonal to -inf (np.triu(..., k=1) gives the mask)\n    # TODO: w = softmax(scores); return w @ V, w\n    pass\n\nQ = np.array([[1., 0, 1, 0], [0, 1, 0, 1], [1, 1, 0, 0]])\nK = np.array([[1., 0, 0, 1], [0, 1, 1, 0], [1, 1, 1, 1]])\nV = np.array([[1., 2], [3, 4], [5, 6]])\nout, w = attention(Q, K, V)\nprint(\"weights:\")\nfor row in w:\n    print(\" \".join(f\"{x:.4f}\" for x in row))\nprint(\"output:\")\nfor row in out:\n    print(\" \".join(f\"{x:.4f}\" for x in row))\nprint(\"row sums: \" + \" \".join(f\"{s:.1f}\" for s in w.sum(axis=1)))\n",
   "expected": "weights:\n1.0000 0.0000 0.0000\n0.5000 0.5000 0.0000\n0.2741 0.2741 0.4519\noutput:\n1.0000 2.0000\n2.0000 3.0000\n3.3556 4.3556\nrow sums: 1.0 1.0 1.0",
   "solution": "import numpy as np\n\ndef softmax(x):\n    x = x - x.max(axis=-1, keepdims=True)\n    e = np.exp(x)\n    return e / e.sum(axis=-1, keepdims=True)\n\ndef attention(Q, K, V):\n    d = Q.shape[-1]\n    scores = Q @ K.T / np.sqrt(d)\n    T = Q.shape[0]\n    mask = np.triu(np.ones((T, T), dtype=bool), k=1)\n    scores = np.where(mask, -np.inf, scores)\n    w = softmax(scores)\n    return w @ V, w\n\nQ = np.array([[1., 0, 1, 0], [0, 1, 0, 1], [1, 1, 0, 0]])\nK = np.array([[1., 0, 0, 1], [0, 1, 1, 0], [1, 1, 1, 1]])\nV = np.array([[1., 2], [3, 4], [5, 6]])\nout, w = attention(Q, K, V)\nprint(\"weights:\")\nfor row in w:\n    print(\" \".join(f\"{x:.4f}\" for x in row))\nprint(\"output:\")\nfor row in out:\n    print(\" \".join(f\"{x:.4f}\" for x in row))\nprint(\"row sums: \" + \" \".join(f\"{s:.1f}\" for s in w.sum(axis=1)))\n",
   "hint": "mask = np.triu(np.ones((T, T), dtype=bool), k=1); scores = np.where(mask, -np.inf, scores). Softmax over axis=-1 with keepdims=True."
  },
  "quiz": [
   {
    "q": "Why are attention scores divided by √d_k?",
    "options": [
     "To make the weights sum to 1",
     "To keep the dot products' variance near 1 so the softmax does not saturate",
     "To make attention O(n) instead of O(n²)",
     "To normalise the value vectors"
    ],
    "answer": 1,
    "why": "Dot products of d_k unit-variance entries have variance d_k; large scores push softmax to one-hot and kill gradients."
   },
   {
    "q": "In a causal mask, which scores are set to −∞?",
    "options": [
     "Those where key position j is greater than query position i",
     "The diagonal",
     "Those where j is less than i",
     "Padding tokens only"
    ],
    "answer": 0,
    "why": "Token i may attend to positions 0..i; future positions j > i are masked so they get zero weight."
   },
   {
    "q": "A model has d_model = 512 and 8 heads. Compared with one head of width 512, multi-head attention…",
    "options": [
     "costs 8× more FLOPs",
     "makes attention linear in sequence length",
     "removes the need for the output projection",
     "uses head_dim 64 and roughly the same FLOPs, but can learn 8 different attention patterns"
    ],
    "answer": 3,
    "why": "Heads split the width; total work is about the same, but each head has its own softmax and pattern."
   },
   {
    "q": "The softmax was applied over dim=-2 instead of dim=-1. What goes wrong?",
    "options": [
     "Nothing, softmax is symmetric",
     "The causal mask is removed",
     "Each key's weights sum to 1 across queries, so a query's output is no longer a weighted average of values",
     "The output shape changes"
    ],
    "answer": 2,
    "why": "Each query row must hold a probability distribution over keys; the wrong axis normalises columns instead."
   }
  ]
 },
 "8.1": {
  "minutes": 60,
  "learn": "\n<p>The 2017 Transformer has been tuned a lot since. Most open LLMs (Llama, Mistral, Qwen, DeepSeek) share the same few changes. Each is small to implement and has a clear reason.</p>\n\n<h3>RoPE: rotary position embeddings</h3>\n<p>Instead of adding a learned position vector to the input, RoPE (Su et al., 2021) <b>rotates</b> q and k inside every attention layer. The head dimension is split into pairs; pair i at position m is rotated by angle <code>m·θ_i</code> with <code>θ_i = base^(−2i/d)</code> (base is usually 10000). Rotations preserve length, and the dot product of a rotated q at position m and a rotated k at position n depends only on <b>m − n</b>. So attention sees relative position for free, and V is not rotated.</p>\n<pre><code>def rope(x, pos, base=10000.0):        # x: (..., T, d), pos: (T,)\n    d = x.shape[-1]\n    theta = base ** (-torch.arange(0, d, 2, device=x.device) / d)   # (d/2,)\n    ang = pos[:, None] * theta[None, :]                              # (T, d/2)\n    cos, sin = ang.cos(), ang.sin()\n    x1, x2 = x[..., 0::2], x[..., 1::2]                              # pairs\n    out = torch.stack([x1 * cos - x2 * sin, x1 * sin + x2 * cos], dim=-1)\n    return out.flatten(-2)</code></pre>\n<p>This uses adjacent pairs (as in the paper). The Hugging Face Llama code pairs dimension i with i + d/2 (\"rotate_half\"). Both are valid; weights trained with one do not work with the other.</p>\n\n<h3>RMSNorm</h3>\n<p>LayerNorm subtracts the mean and divides by the std. RMSNorm (Zhang &amp; Sennrich, 2019) skips the mean: <code>y = x / sqrt(mean(x²) + eps) · g</code>. It is cheaper and works as well in practice. Modern models also use <b>pre-norm</b>: normalise the input of each sub-layer, not its output.</p>\n<pre><code>class RMSNorm(nn.Module):\n    def __init__(self, d, eps=1e-6):\n        super().__init__(); self.eps = eps; self.g = nn.Parameter(torch.ones(d))\n    def forward(self, x):\n        return x * torch.rsqrt(x.pow(2).mean(-1, keepdim=True) + self.eps) * self.g</code></pre>\n\n<h3>SwiGLU MLP</h3>\n<p>The MLP becomes gated (Shazeer, 2020): <code>W2 · (SiLU(W1 x) ⊙ W3 x)</code>. It has three matrices instead of two, so the hidden size is usually cut to about 8/3·d (instead of 4d) to keep the parameter count equal.</p>\n\n<h3>GQA: grouped-query attention</h3>\n<p>During generation every past token's K and V are cached for every layer. The <b>KV cache</b> size is</p>\n<pre><code>bytes = 2 (K and V) × layers × kv_heads × head_dim × seq_len × batch × bytes_per_value</code></pre>\n<p>Multi-query attention (MQA) shares one K/V head across all query heads. GQA (Ainslie et al., 2023) is the middle ground: query heads are split into groups, each group shares one K/V head. With 32 query heads and 8 KV heads the cache shrinks 4×, with quality close to full multi-head. In code you compute K, V with <code>n_kv_head</code> heads and repeat them: <code>k = k.repeat_interleave(n_head // n_kv_head, dim=1)</code>.</p>\n\n<h3>MLA: multi-head latent attention</h3>\n<p>DeepSeek-V2 (2024) goes further: it caches one small <b>latent</b> vector per token, <code>c = W_down x</code>, and reconstructs per-head K and V with up-projections <code>K = W_uk c</code>, <code>V = W_uv c</code>. The cache stores only c (plus a small decoupled RoPE key, because the rotation does not commute with the up-projection). A simplified version for your GPT: one down-projection to rank r, two up-projections, ignore the RoPE detail.</p>\n\n<h3>Comparing variants fairly</h3>\n<p>Match parameter count and training tokens, change one thing at a time, and run at least 3 seeds. A difference smaller than the seed-to-seed spread is not a result.</p>\n<blockquote>Common mistake: applying RoPE to V or to the input embeddings. It goes on q and k only, after the projection and head split, at every layer.</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "python",
   "prompt": "<p>Three pieces of a modern block in NumPy:</p><ol><li><code>rmsnorm(x)</code> without eps or gain. Print it for [3, 4].</li><li><code>rope(x, pos)</code> with adjacent pairs and base 10000. Print the length of a vector before and after rotation, then show that q·k at positions (5, 3) equals q·k at (12, 10).</li><li><code>kv_bytes(layers, kv_heads, head_dim, seq, batch, bytes_per)</code>. For 32 layers, head_dim 128, seq 4096, batch 1, fp16, print the cache size in GiB for MHA (32 KV heads), GQA (8) and MQA (1).</li></ol><p>Expected output:</p><pre><code>rmsnorm: 0.8485 1.1314\nnorm before 2.5000 after 2.5000\nqk(5,3) = -0.5205\nqk(12,10) = -0.5205\nMHA: 2.0000 GiB\nGQA: 0.5000 GiB\nMQA: 0.0625 GiB</code></pre>",
   "starter": "import numpy as np\n\ndef rmsnorm(x):\n    # TODO: x / sqrt(mean(x**2))\n    pass\n\ndef rope(x, pos, base=10000.0):\n    d = x.shape[-1]\n    theta = base ** (-np.arange(0, d, 2) / d)\n    ang = pos * theta\n    # TODO: rotate each pair (x[0::2], x[1::2]) by ang\n    pass\n\ndef kv_bytes(layers, kv_heads, head_dim, seq, batch, bytes_per):\n    # TODO: K and V for every layer, head, position\n    pass\n\nprint(\"rmsnorm: \" + \" \".join(f\"{v:.4f}\" for v in rmsnorm(np.array([3.0, 4.0]))))\nq = np.array([1.0, 2.0, 0.5, -1.0])\nk = np.array([0.5, 1.0, 1.0, 0.0])\nprint(f\"norm before {np.linalg.norm(q):.4f} after {np.linalg.norm(rope(q, 7)):.4f}\")\nprint(f\"qk(5,3) = {rope(q, 5) @ rope(k, 3):.4f}\")\nprint(f\"qk(12,10) = {rope(q, 12) @ rope(k, 10):.4f}\")\nfor name, h in [(\"MHA\", 32), (\"GQA\", 8), (\"MQA\", 1)]:\n    print(f\"{name}: {kv_bytes(32, h, 128, 4096, 1, 2) / 2**30:.4f} GiB\")\n",
   "expected": "rmsnorm: 0.8485 1.1314\nnorm before 2.5000 after 2.5000\nqk(5,3) = -0.5205\nqk(12,10) = -0.5205\nMHA: 2.0000 GiB\nGQA: 0.5000 GiB\nMQA: 0.0625 GiB",
   "solution": "import numpy as np\n\ndef rmsnorm(x):\n    return x / np.sqrt(np.mean(x ** 2))\n\ndef rope(x, pos, base=10000.0):\n    d = x.shape[-1]\n    theta = base ** (-np.arange(0, d, 2) / d)\n    ang = pos * theta\n    c, s = np.cos(ang), np.sin(ang)\n    x1, x2 = x[0::2], x[1::2]\n    out = np.empty_like(x)\n    out[0::2] = x1 * c - x2 * s\n    out[1::2] = x1 * s + x2 * c\n    return out\n\ndef kv_bytes(layers, kv_heads, head_dim, seq, batch, bytes_per):\n    return 2 * layers * kv_heads * head_dim * seq * batch * bytes_per\n\nprint(\"rmsnorm: \" + \" \".join(f\"{v:.4f}\" for v in rmsnorm(np.array([3.0, 4.0]))))\nq = np.array([1.0, 2.0, 0.5, -1.0])\nk = np.array([0.5, 1.0, 1.0, 0.0])\nprint(f\"norm before {np.linalg.norm(q):.4f} after {np.linalg.norm(rope(q, 7)):.4f}\")\nprint(f\"qk(5,3) = {rope(q, 5) @ rope(k, 3):.4f}\")\nprint(f\"qk(12,10) = {rope(q, 12) @ rope(k, 10):.4f}\")\nfor name, h in [(\"MHA\", 32), (\"GQA\", 8), (\"MQA\", 1)]:\n    print(f\"{name}: {kv_bytes(32, h, 128, 4096, 1, 2) / 2**30:.4f} GiB\")\n",
   "hint": "Pair rotation: new_even = x1*cos − x2*sin, new_odd = x1*sin + x2*cos. KV bytes start with a factor 2 for K and V."
  },
  "quiz": [
   {
    "q": "Why does RoPE give attention relative-position information?",
    "options": [
     "It adds the position index to each embedding",
     "It masks tokens that are far apart",
     "Rotating q by mθ and k by nθ makes their dot product depend only on m − n",
     "It rotates V so outputs carry position"
    ],
    "answer": 2,
    "why": "Rotations compose: Rᵀ(m)R(n) = R(n − m), so the score sees only the offset."
   },
   {
    "q": "A model has 32 query heads. Switching from MHA to GQA with 4 KV heads changes the KV cache by…",
    "options": [
     "nothing, the cache depends on query heads",
     "8× smaller",
     "4× smaller",
     "32× smaller"
    ],
    "answer": 1,
    "why": "Cache size scales with KV heads: 32 → 4 is 8× less."
   },
   {
    "q": "What does RMSNorm drop compared with LayerNorm?",
    "options": [
     "Subtracting the mean",
     "The division by a scale",
     "The learned gain",
     "The epsilon"
    ],
    "answer": 0,
    "why": "RMSNorm rescales by the root mean square only; there is no mean-centering (and usually no bias)."
   },
   {
    "q": "You replace a 4d GELU MLP with SwiGLU at hidden size 4d. Is the comparison fair?",
    "options": [
     "Yes, same hidden size",
     "Yes, activations do not affect parameter count",
     "No, SwiGLU has fewer parameters",
     "No, SwiGLU has three matrices, so it has ~1.5× the MLP parameters; use ~8/3·d hidden"
    ],
    "answer": 3,
    "why": "Three d×h matrices vs two; shrinking h to 8/3·d matches parameters."
   }
  ]
 },
 "8.2": {
  "minutes": 55,
  "learn": "\n<p>Full attention compares every token with every other token. For sequence length n that is an n×n score matrix per head per layer: compute and (naively) memory grow as <b>O(n²)</b>. Doubling the context makes attention 4× more expensive, while the MLPs only get 2× more expensive.</p>\n\n<h3>How bad is n²?</h3>\n<p>The score matrix for one head in fp16 takes <code>n² × 2</code> bytes: 2 MiB at 1K tokens, 32 MiB at 4K, 512 MiB at 16K. Multiply by heads and batch and a naive implementation runs out of GPU memory long before the weights do. You measure this yourself with:</p>\n<pre><code>import torch, time\nfor n in [1024, 4096, 16384]:\n    q = k = v = torch.randn(1, 8, n, 64, device=\"cuda\", dtype=torch.float16)\n    torch.cuda.reset_peak_memory_stats(); torch.cuda.synchronize()\n    t = time.perf_counter()\n    att = (q @ k.transpose(-2, -1) / 8).softmax(-1) @ v      # naive\n    torch.cuda.synchronize()\n    print(n, time.perf_counter() - t, torch.cuda.max_memory_allocated() / 2**20, \"MiB\")</code></pre>\n<p>Always call <code>torch.cuda.synchronize()</code> before reading the clock; GPU work is asynchronous.</p>\n\n<h3>FlashAttention: same math, less memory traffic</h3>\n<p>FlashAttention (Dao et al., 2022) does not change the result. It processes K and V in tiles that fit in on-chip SRAM and keeps a running max and running sum for the softmax (\"online softmax\"), so the n×n matrix is never written to GPU memory. FLOPs are still O(n²), but memory is O(n) and it is much faster because attention was limited by memory bandwidth. In PyTorch, <code>F.scaled_dot_product_attention</code> uses a flash kernel when it can.</p>\n\n<h3>Sliding-window attention</h3>\n<p>To cut the FLOPs too, let each token attend only to the last w tokens (itself included). Work becomes O(n·w). Information still travels further than w: after L layers a token can be influenced by tokens about L·w back, like stacked convolutions. Mistral 7B uses a window of 4096.</p>\n<pre><code>i = torch.arange(n)[:, None]; j = torch.arange(n)[None, :]\nallowed = (j &lt;= i) &amp; (i - j &lt; w)            # causal + window\nscores = scores.masked_fill(~allowed, float(\"-inf\"))</code></pre>\n<p>A mask like this still computes the full n×n matrix; it shows the pattern but saves nothing. Real speedups need a kernel that skips masked tiles (FlashAttention supports a window argument).</p>\n\n<h3>Global tokens (Longformer)</h3>\n<p>Longformer (Beltagy et al., 2020) combines a sliding window with a few <b>global</b> positions that every token can attend to (and that attend to everything). For a causal model, add <code>| is_global[j]</code> to the allowed condition so any later token can read the global positions, for example a summary token at the start.</p>\n<pre><code>allowed = (j &lt;= i) &amp; ((i - j &lt; w) | is_global[None, :])</code></pre>\n\n<h3>Testing long-context ability</h3>\n<p>Loss averaged over a long sequence hides whether the model actually uses far-away tokens. A <b>retrieval-copy</b> test does not: put a key and a random token early, filler in between, then ask the model to output that token at the end. Report exact-match accuracy as you increase the distance. A pure sliding-window model should fail once the distance exceeds about layers × w.</p>\n<blockquote>Common mistake: concluding that a sliding-window mask made attention faster. Masking alone changes the output, not the cost. Measure; do not assume.</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "python",
   "prompt": "<p>Build attention masks in NumPy for n = 8 tokens.</p><ol><li><code>sliding_mask(n, w, global_idx)</code>: allowed if causal (j ≤ i) and (i − j &lt; w or j is global). Print the mask for w = 3 with token 0 global, using <code>#</code> for allowed and <code>.</code> for blocked.</li><li>Print how many score entries are allowed vs a plain causal mask.</li><li>Print the fp16 memory of one head's full n×n score matrix for n = 1024, 4096, 16384 in MiB.</li></ol><p>Expected output:</p><pre><code>#.......\n##......\n###.....\n####....\n#.###...\n#..###..\n#...###.\n#....###\nallowed 26 of causal 36\nn=1024: 2 MiB\nn=4096: 32 MiB\nn=16384: 512 MiB</code></pre>",
   "starter": "import numpy as np\n\ndef sliding_mask(n, w, global_idx):\n    i = np.arange(n)[:, None]\n    j = np.arange(n)[None, :]\n    is_global = np.zeros(n, dtype=bool)\n    is_global[global_idx] = True\n    # TODO: return a boolean (n, n) array\n    pass\n\nn = 8\nm = sliding_mask(n, 3, [0])\nfor row in m:\n    print(\"\".join(\"#\" if a else \".\" for a in row))\ncausal = np.tril(np.ones((n, n), dtype=bool))\n# TODO: print allowed count vs causal count\n\nfor size in [1024, 4096, 16384]:\n    mib = 0  # TODO: size*size scores, 2 bytes each, in MiB\n    print(f\"n={size}: {mib} MiB\")\n",
   "expected": "#.......\n##......\n###.....\n####....\n#.###...\n#..###..\n#...###.\n#....###\nallowed 26 of causal 36\nn=1024: 2 MiB\nn=4096: 32 MiB\nn=16384: 512 MiB",
   "solution": "import numpy as np\n\ndef sliding_mask(n, w, global_idx):\n    i = np.arange(n)[:, None]\n    j = np.arange(n)[None, :]\n    is_global = np.zeros(n, dtype=bool)\n    is_global[global_idx] = True\n    return (j <= i) & ((i - j < w) | is_global[None, :])\n\nn = 8\nm = sliding_mask(n, 3, [0])\nfor row in m:\n    print(\"\".join(\"#\" if a else \".\" for a in row))\ncausal = np.tril(np.ones((n, n), dtype=bool))\nprint(f\"allowed {int(m.sum())} of causal {int(causal.sum())}\")\n\nfor size in [1024, 4096, 16384]:\n    mib = size * size * 2 // 2**20\n    print(f\"n={size}: {mib} MiB\")\n",
   "hint": "Combine boolean arrays with & and |, and wrap each comparison in parentheses. Use int(m.sum()) when printing."
  },
  "quiz": [
   {
    "q": "Context length goes from 4K to 16K. Roughly how much more work does naive full attention do per layer?",
    "options": [
     "4×",
     "The same",
     "2×",
     "16×"
    ],
    "answer": 3,
    "why": "Cost is O(n²): 4× the length gives 16× the score entries."
   },
   {
    "q": "What does FlashAttention change?",
    "options": [
     "It approximates attention with a low-rank matrix",
     "It drops distant tokens",
     "It computes exact attention in tiles with an online softmax, never storing the n×n matrix in GPU memory",
     "It reduces FLOPs to O(n)"
    ],
    "answer": 2,
    "why": "Same output, fewer memory reads and writes; FLOPs stay O(n²)."
   },
   {
    "q": "A 32-layer model uses sliding-window attention with w = 4096. Can token 20 000 be influenced by token 0?",
    "options": [
     "No, never: it is outside the window",
     "Yes, information can hop through layers, reaching about layers × w tokens back",
     "Only if token 0 is global",
     "Only with a KV cache"
    ],
    "answer": 1,
    "why": "Each layer moves information up to w tokens; stacking 32 layers covers far more than 20 000."
   },
   {
    "q": "You add a sliding-window mask to naive PyTorch attention and memory use does not drop. Why?",
    "options": [
     "The full n×n score matrix is still computed; masking changes values, not cost",
     "Masks only work on CPU",
     "Softmax ignores masks",
     "The window is too large"
    ],
    "answer": 0,
    "why": "Masked attention still materialises all n² scores. Only a kernel that skips blocked tiles saves memory and time."
   }
  ]
 },
 "8.3": {
  "minutes": 55,
  "learn": "\n<p>Getting a small LM to train is easy. Getting a result you can trust is the skill: fixed configs, a held-out set, a proper schedule, and enough seeds to tell signal from noise. nanoGPT is the reference codebase to read.</p>\n\n<h3>Data</h3>\n<p>Tokenise the corpus once, store token ids as a flat <code>uint16</code> array on disk (fine for vocabularies under 65 536), and sample random windows of <code>block_size + 1</code> tokens: inputs are the first block_size, targets are shifted by one. Split <b>before</b> training into train and validation files and never train on validation.</p>\n<pre><code>data = np.memmap(\"train.bin\", dtype=np.uint16, mode=\"r\")\nix = torch.randint(len(data) - T - 1, (B,))\nx = torch.stack([torch.from_numpy(data[i:i+T].astype(np.int64)) for i in ix])\ny = torch.stack([torch.from_numpy(data[i+1:i+1+T].astype(np.int64)) for i in ix])</code></pre>\n\n<h3>Learning-rate schedule: warmup + cosine</h3>\n<p>At the start the weights are random and Adam's statistics are not settled, so a large LR can blow up. <b>Warmup</b> ramps the LR linearly from near 0 to max_lr. After that a <b>cosine decay</b> lowers it smoothly to min_lr (often max_lr / 10) at the last step.</p>\n<pre><code>def get_lr(step):\n    if step &lt; warmup:\n        return max_lr * (step + 1) / warmup\n    p = (step - warmup) / (total - warmup)          # 0 → 1\n    return min_lr + 0.5 * (max_lr - min_lr) * (1 + math.cos(math.pi * p))\n\nfor g in opt.param_groups: g[\"lr\"] = get_lr(step)</code></pre>\n\n<h3>The training step</h3>\n<pre><code>with torch.autocast(\"cuda\", dtype=torch.bfloat16):\n    logits = model(x)\n    loss = F.cross_entropy(logits.view(-1, logits.size(-1)), y.view(-1))\nloss.backward()\ntorch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)   # gradient clipping\nopt.step(); opt.zero_grad(set_to_none=True)</code></pre>\n<p><b>Gradient clipping</b> rescales the whole gradient if its norm exceeds 1.0, which stops a single bad batch from wrecking training. AdamW with weight decay ≈ 0.1 on the matrices (not on norms and biases) is the standard optimizer.</p>\n\n<h3>Perplexity</h3>\n<p>Cross-entropy loss is the average negative log-probability of the correct next token, in nats. <b>Perplexity = exp(mean loss)</b>: roughly \"the model is as unsure as choosing uniformly among this many tokens\". Average the loss over <b>tokens</b> first, then exponentiate; averaging per-batch perplexities is wrong. Perplexity is only comparable between models with the same tokenizer, because a different vocabulary changes what one \"token\" is.</p>\n\n<h3>Seeds and error bars</h3>\n<p>Two runs that differ only by random seed give different final losses. Before claiming that variant B beats A, run each with 3 seeds and report <b>mean ± std</b> (sample std, ddof = 1). If the gap is smaller than the spread, you have not shown a difference.</p>\n\n<h3>Reproducibility</h3>\n<ul>\n<li>Every run reads one config file (model size, LR, steps, seed, data path) that is saved with the checkpoint.</li>\n<li>Log train and validation loss at fixed step intervals.</li>\n<li>Compare at equal training tokens, not equal wall time.</li>\n</ul>\n<blockquote>Common mistake: evaluating validation loss on a handful of batches with dropout still on. Use <code>model.eval()</code>, <code>torch.no_grad()</code>, and enough batches that the estimate is stable.</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "python",
   "prompt": "<p>Three tools for a training report (plain Python, <code>math</code> only):</p><ol><li><code>get_lr(step)</code>: warmup 100 steps, cosine to the end at step 1000, max_lr 6e-4, min_lr 6e-5. Print the LR at steps 0, 99, 100, 550 and 1000.</li><li>Perplexity from validation batches given as (mean loss, token count): average over tokens, then exp.</li><li>Mean ± sample std of final losses from 3 seeds.</li></ol><p>Expected output:</p><pre><code>step 0: 6.00e-06\nstep 99: 6.00e-04\nstep 100: 6.00e-04\nstep 550: 3.30e-04\nstep 1000: 6.00e-05\nval loss 3.2000 ppl 24.53\nseeds 3.1500 ± 0.0200</code></pre>",
   "starter": "import math\n\nmax_lr, min_lr, warmup, total = 6e-4, 6e-5, 100, 1000\n\ndef get_lr(step):\n    # TODO: linear warmup for step < warmup, then cosine from max_lr to min_lr\n    pass\n\nfor s in [0, 99, 100, 550, 1000]:\n    print(f\"step {s}: {get_lr(s):.2e}\")\n\nbatches = [(3.0, 1000), (3.5, 500), (3.3, 500)]  # (mean loss, tokens)\n# TODO: token-weighted mean loss, then perplexity\nval = 0.0\nprint(f\"val loss {val:.4f} ppl {math.exp(val):.2f}\")\n\nfinal = [3.13, 3.15, 3.17]\n# TODO: mean and sample std (divide by n - 1)\nprint(f\"seeds {0:.4f} ± {0:.4f}\")\n",
   "expected": "step 0: 6.00e-06\nstep 99: 6.00e-04\nstep 100: 6.00e-04\nstep 550: 3.30e-04\nstep 1000: 6.00e-05\nval loss 3.2000 ppl 24.53\nseeds 3.1500 ± 0.0200",
   "solution": "import math\n\nmax_lr, min_lr, warmup, total = 6e-4, 6e-5, 100, 1000\n\ndef get_lr(step):\n    if step < warmup:\n        return max_lr * (step + 1) / warmup\n    p = (step - warmup) / (total - warmup)\n    return min_lr + 0.5 * (max_lr - min_lr) * (1 + math.cos(math.pi * p))\n\nfor s in [0, 99, 100, 550, 1000]:\n    print(f\"step {s}: {get_lr(s):.2e}\")\n\nbatches = [(3.0, 1000), (3.5, 500), (3.3, 500)]\nval = sum(l * n for l, n in batches) / sum(n for _, n in batches)\nprint(f\"val loss {val:.4f} ppl {math.exp(val):.2f}\")\n\nfinal = [3.13, 3.15, 3.17]\nm = sum(final) / len(final)\nsd = math.sqrt(sum((x - m) ** 2 for x in final) / (len(final) - 1))\nprint(f\"seeds {m:.4f} ± {sd:.4f}\")\n",
   "hint": "Progress p = (step − warmup) / (total − warmup). Token-weighted loss = Σ loss·tokens / Σ tokens."
  },
  "quiz": [
   {
    "q": "Why use LR warmup at the start of training?",
    "options": [
     "Random weights and unsettled Adam statistics make large early updates unstable",
     "To save memory",
     "To make the cosine schedule longer",
     "To avoid overfitting"
    ],
    "answer": 0,
    "why": "A full-size LR on step 0 often causes loss spikes or divergence; ramping up avoids it."
   },
   {
    "q": "Validation loss is 2.0 nats per token. What is the perplexity?",
    "options": [
     "2.0",
     "4.0",
     "about 0.69",
     "about 7.39"
    ],
    "answer": 3,
    "why": "Perplexity = e^loss = e² ≈ 7.39."
   },
   {
    "q": "Model A (GPT-2 tokenizer) has perplexity 20, model B (a char-level tokenizer) has perplexity 3. Which is better?",
    "options": [
     "B, lower perplexity",
     "A, larger vocabulary",
     "You cannot tell: perplexity per token depends on the tokenizer",
     "They are equal"
    ],
    "answer": 2,
    "why": "A character is much easier to predict than a subword; compare bits per byte or use the same tokenizer."
   },
   {
    "q": "Variant B beats A by 0.01 loss; seed std is 0.03 for both. What should you report?",
    "options": [
     "B is better",
     "No clear difference: the gap is within seed noise",
     "A is better",
     "Run one more seed and report the best"
    ],
    "answer": 1,
    "why": "A gap smaller than the run-to-run spread is not evidence. Picking the best seed is cherry-picking."
   }
  ]
 }
});
