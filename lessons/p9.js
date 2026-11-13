// Phase 9 lesson content. Generated; verified practice solutions.
Object.assign(LESSONS,{
 "9.0": {
  "minutes": 50,
  "learn": "\n<p>Training is about throughput over weeks. Inference is about latency per request and cost per token. To optimise it you must know where the time goes, and that starts with the two phases of generation.</p>\n\n<h3>Prefill and decode</h3>\n<ul>\n<li><b>Prefill</b>: the whole prompt (say 1 000 tokens) goes through the model in one forward pass. These are big matrix multiplies, so the GPU is <b>compute-bound</b>. Prefill ends with the first output token.</li>\n<li><b>Decode</b>: then the model produces one token per forward pass, each depending on the previous one. Each step does a matrix-<i>vector</i> multiply per weight matrix.</li>\n</ul>\n\n<h3>The KV cache</h3>\n<p>In decode, the new token's query must attend to the keys and values of all previous tokens. Recomputing them every step would make generating n tokens O(n²) in model passes. Instead, store K and V for every layer as they are computed and append one row per step:</p>\n<pre><code># inside attention, during decode (x is one new token: (B, 1, C))\nq, k, v = self.qkv(x).split(C, dim=2)\nif cache is not None:\n    k = torch.cat([cache.k, k], dim=1)     # (B, t+1, C)\n    v = torch.cat([cache.v, v], dim=1)\ncache.k, cache.v = k, v\natt = q @ k.transpose(-2, -1) / sqrt(d)   # (B, 1, t+1): no causal mask needed</code></pre>\n<p>Size per token = <code>2 × layers × kv_heads × head_dim × bytes</code>. For 32 layers, 8 KV heads, head_dim 128 in fp16 that is 128 KiB per token, or 512 MiB for one 4 096-token sequence. With many concurrent users the KV cache, not the weights, decides how many requests fit.</p>\n\n<h3>Why decode is memory-bound</h3>\n<p>At batch size 1 every weight is read from GPU memory once per token and used for only about 2 FLOPs (one multiply, one add). GPUs can do far more arithmetic per byte than that, so the step is limited by memory bandwidth. A useful bound: <code>tokens/s ≤ bandwidth / bytes_of_weights</code>. A 7B model in fp16 is about 14 GB; on a GPU with 1 TB/s bandwidth that caps batch-1 decode near 70 tokens/s. Batching many requests reuses each weight read for every sequence in the batch, which is why servers batch.</p>\n\n<h3>The metrics</h3>\n<ul>\n<li><b>TTFT</b> (time to first token): request arrival to first token. Dominated by queueing and prefill.</li>\n<li><b>TPOT / inter-token latency</b>: average gap between later tokens. Dominated by decode.</li>\n<li><b>Throughput</b>: total output tokens per second across all requests.</li>\n<li><b>p50 / p95 / p99</b>: latency percentiles. The mean hides the slow tail; users feel the tail.</li>\n</ul>\n<p>Nearest-rank percentile: sort the n values and take the one at position <code>ceil(p/100 · n)</code> (1-based). Measure with streaming output and a wall clock, and run warm-up requests first.</p>\n\n<h3>vLLM and PagedAttention</h3>\n<p>Reserving one contiguous KV buffer of max length per request wastes memory on space that is never used. PagedAttention (Kwon et al., 2023) stores the cache in fixed-size <b>blocks</b> (for example 16 tokens) and keeps a per-sequence <b>block table</b> mapping logical blocks to physical ones, like virtual memory pages. Combined with <b>continuous batching</b> (new requests join the running batch at any decode step) this is how vLLM gets high throughput.</p>\n<pre><code>from vllm import LLM, SamplingParams\nllm = LLM(model=\"Qwen/Qwen2.5-0.5B-Instruct\")\nouts = llm.generate([\"Explain KV cache in one line.\"] * 20, SamplingParams(max_tokens=64))</code></pre>\n<blockquote>Common mistake: reporting tokens/s from one request and calling it throughput. Single-stream speed and server throughput under load are different numbers; report both, plus TTFT and p95.</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "python",
   "prompt": "<p>Do the serving arithmetic in plain Python.</p><ol><li>KV cache per token for 32 layers, 8 KV heads, head_dim 128, fp16 (in KiB); per 4096-token sequence (in MiB); and how many such sequences fit in a 20 GiB budget.</li><li>A request starts at t = 0 ms; tokens arrive at the given times. Print TTFT, TPOT (mean gap after the first token) and decode tokens/s.</li><li>Nearest-rank p50 and p95 and the mean of 20 request latencies.</li></ol><p>Expected output:</p><pre><code>KV per token: 128 KiB\nKV per sequence: 512 MiB\nsequences in 20 GiB: 40\nTTFT 180.0 ms, TPOT 25.0 ms, 40.0 tok/s\np50 135 ms, p95 620 ms, mean 214.6 ms</code></pre>",
   "starter": "import math\n\ndef kv_bytes_per_token(layers, kv_heads, head_dim, bytes_per):\n    # TODO: K and V, every layer and KV head\n    pass\n\nper_tok = kv_bytes_per_token(32, 8, 128, 2)\nper_seq = per_tok * 4096\nprint(f\"KV per token: {per_tok // 1024} KiB\")\nprint(f\"KV per sequence: {per_seq // 2**20} MiB\")\nprint(f\"sequences in 20 GiB: {20 * 2**30 // per_seq}\")\n\ntoken_times = [180.0, 205.0, 229.0, 256.0, 280.0]   # ms since request start\n# TODO: ttft, tpot\nttft = tpot = 1.0\nprint(f\"TTFT {ttft:.1f} ms, TPOT {tpot:.1f} ms, {1000 / tpot:.1f} tok/s\")\n\nlat = [120, 135, 128, 410, 142, 131, 125, 139, 980, 133,\n       127, 145, 138, 129, 150, 136, 141, 132, 620, 130]\n\ndef percentile(xs, p):\n    # TODO: nearest rank: sorted value at 1-based position ceil(p/100 * n)\n    pass\n\nprint(f\"p50 {percentile(lat, 50)} ms, p95 {percentile(lat, 95)} ms, mean {sum(lat) / len(lat):.1f} ms\")\n",
   "expected": "KV per token: 128 KiB\nKV per sequence: 512 MiB\nsequences in 20 GiB: 40\nTTFT 180.0 ms, TPOT 25.0 ms, 40.0 tok/s\np50 135 ms, p95 620 ms, mean 214.6 ms",
   "solution": "import math\n\ndef kv_bytes_per_token(layers, kv_heads, head_dim, bytes_per):\n    return 2 * layers * kv_heads * head_dim * bytes_per\n\nper_tok = kv_bytes_per_token(32, 8, 128, 2)\nper_seq = per_tok * 4096\nprint(f\"KV per token: {per_tok // 1024} KiB\")\nprint(f\"KV per sequence: {per_seq // 2**20} MiB\")\nprint(f\"sequences in 20 GiB: {20 * 2**30 // per_seq}\")\n\ntoken_times = [180.0, 205.0, 229.0, 256.0, 280.0]\nttft = token_times[0]\ntpot = (token_times[-1] - token_times[0]) / (len(token_times) - 1)\nprint(f\"TTFT {ttft:.1f} ms, TPOT {tpot:.1f} ms, {1000 / tpot:.1f} tok/s\")\n\nlat = [120, 135, 128, 410, 142, 131, 125, 139, 980, 133,\n       127, 145, 138, 129, 150, 136, 141, 132, 620, 130]\n\ndef percentile(xs, p):\n    s = sorted(xs)\n    k = max(1, math.ceil(p / 100 * len(s)))\n    return s[k - 1]\n\nprint(f\"p50 {percentile(lat, 50)} ms, p95 {percentile(lat, 95)} ms, mean {sum(lat) / len(lat):.1f} ms\")\n",
   "hint": "TPOT = (last − first token time) / (number of tokens − 1). For p95 of 20 values, ceil(0.95 · 20) = 19, so take the 19th smallest."
  },
  "quiz": [
   {
    "q": "Why is batch-1 decode memory-bound?",
    "options": [
     "The KV cache is stored on CPU",
     "Softmax is slow",
     "Each weight is read once per token but used for only ~2 FLOPs, so bandwidth limits speed",
     "Decode uses fp32"
    ],
    "answer": 2,
    "why": "Matrix-vector work has very low arithmetic intensity; the GPU waits on memory."
   },
   {
    "q": "Which metric is dominated by prompt length and queueing?",
    "options": [
     "TPOT",
     "TTFT",
     "Throughput",
     "p50 inter-token latency"
    ],
    "answer": 1,
    "why": "The first token appears only after prefill of the whole prompt (and any time waiting in the queue)."
   },
   {
    "q": "Mean latency is 215 ms but p95 is 620 ms. What does this tell you?",
    "options": [
     "Most requests are fast, but a slow tail affects about 1 in 20 requests",
     "The measurement is broken",
     "The mean is the better number to report",
     "Throughput is too low"
    ],
    "answer": 0,
    "why": "Percentiles expose the tail that averages hide; users notice the slow requests."
   },
   {
    "q": "What problem does PagedAttention solve?",
    "options": [
     "Attention being O(n²)",
     "Slow tokenisation",
     "Quantisation error",
     "Wasted and fragmented KV-cache memory from contiguous per-request reservations"
    ],
    "answer": 3,
    "why": "Fixed-size blocks plus a block table let memory be allocated on demand, so more sequences fit."
   }
  ]
 },
 "9.1": {
  "minutes": 50,
  "learn": "\n<p>Weights in fp16 or bf16 take 2 bytes per parameter. Storing them in 8 or 4 bits halves or quarters memory, and because decode is memory-bound, fewer bytes per token often means faster generation too. The price is some accuracy, which you must measure.</p>\n\n<h3>Memory arithmetic</h3>\n<pre><code>params × bits / 8 = bytes\n7B × 16 bit = 14 GB     7B × 8 bit = 7 GB     7B × 4 bit = 3.5 GB</code></pre>\n<p>Real 4-bit formats are slightly bigger because they also store scales (and sometimes zero points) for each group of weights.</p>\n\n<h3>Symmetric int8 quantisation</h3>\n<p>Map real values to integers in [−127, 127] with one scale:</p>\n<pre><code>scale = max(|w|) / 127\nq     = clip(round(w / scale), -127, 127)    # stored as int8\nw_hat = q * scale                            # dequantised</code></pre>\n<p>The rounding error per weight is at most scale / 2. So the error depends on the <b>largest</b> value that shares the scale.</p>\n\n<h3>Per-tensor vs per-channel</h3>\n<p>With one scale for a whole matrix, a single large row forces a big scale, and the small rows get rounded to just a few integer levels (or to zero). <b>Per-channel</b> quantisation gives each output channel (each row of a Linear weight of shape <code>(out, in)</code>) its own scale. It costs one extra float per row and usually cuts error a lot. <b>Group-wise</b> quantisation (one scale per 32–128 weights) goes further and is what 4-bit formats use.</p>\n<pre><code>def quant_per_channel(W):                     # W: (out, in) torch tensor\n    scale = W.abs().amax(dim=1, keepdim=True) / 127\n    q = torch.clamp(torch.round(W / scale), -127, 127).to(torch.int8)\n    return q, scale\n\ndef linear_int8(x, q, scale):\n    return (x @ q.float().t()) * scale.t()     # dequantise on the fly</code></pre>\n\n<h3>Weights vs activations</h3>\n<p>Weight-only quantisation (common for LLM inference) stores weights in low bits and dequantises them before or inside the matmul; activations stay in fp16. Quantising activations too (W8A8) is harder because LLM activations have outlier channels with very large values (the LLM.int8() paper, Dettmers et al., 2022, handles them by keeping outlier dimensions in fp16).</p>\n\n<h3>Tools you will use</h3>\n<ul>\n<li><b>bitsandbytes</b> through Hugging Face: <code>BitsAndBytesConfig(load_in_8bit=True)</code> or <code>load_in_4bit=True</code> with NF4.</li>\n<li><b>GPTQ / AWQ</b>: post-training methods that use calibration data to choose rounding that minimises the layer's output error.</li>\n<li><b>llama.cpp / GGUF</b>: CPU-friendly formats such as Q8_0 and Q4_K_M, run with <code>llama-cli -m model.gguf -p \"Hello\"</code>.</li>\n</ul>\n<pre><code>from transformers import AutoModelForCausalLM, BitsAndBytesConfig\nm = AutoModelForCausalLM.from_pretrained(name, quantization_config=BitsAndBytesConfig(load_in_4bit=True))\nprint(m.get_memory_footprint() / 2**30, \"GiB\")</code></pre>\n\n<h3>Measure quality</h3>\n<p>Compute perplexity on the same held-out text with the same tokenizer for each precision, and also run a small task benchmark. Small perplexity changes can hide larger drops on specific tasks.</p>\n<blockquote>Common mistake: computing the scale per column (input channel) when you meant per output channel. For <code>nn.Linear</code> the weight is <code>(out_features, in_features)</code>, so per-output-channel means one scale per <b>row</b>.</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "python",
   "prompt": "<p>Implement symmetric int8 quantisation in NumPy and compare per-tensor with per-channel (one scale per row). The weight matrix has one row with large values. Print the per-channel int8 matrix, the int8 values row 0 gets under a per-tensor scale, the mean absolute error of both methods, and model memory at three precisions.</p><p>Expected output:</p><pre><code>per-channel q:\n25 -63 127 13\n64 -85 30 127\n-127 95 32 -63\nper-tensor q row 0: 1 -2 4 0\nmean abs error per-tensor 0.006483\nmean abs error per-channel 0.002572\n7B params: fp16 14.0 GB, int8 7.0 GB, int4 3.5 GB</code></pre>",
   "starter": "import numpy as np\n\nW = np.array([[0.02, -0.05, 0.10, 0.01],\n              [1.50, -2.00, 0.70, 3.00],\n              [-0.20, 0.15, 0.05, -0.10]])\n\ndef quantize(W, scale):\n    # TODO: round(W / scale), clip to [-127, 127], cast to np.int8\n    pass\n\n# TODO: one scale for the whole matrix\nscale_t = 1.0\n# TODO: one scale per row, shape (3, 1) (use keepdims=True)\nscale_c = np.ones((3, 1))\n\nq_t = quantize(W, scale_t)\nq_c = quantize(W, scale_c)\nprint(\"per-channel q:\")\nfor row in q_c:\n    print(\" \".join(str(int(v)) for v in row))\nprint(\"per-tensor q row 0: \" + \" \".join(str(int(v)) for v in q_t[0]))\n# TODO: dequantise (q * scale) and compute mean |W - W_hat| for both\nerr_t = err_c = 0.0\nprint(f\"mean abs error per-tensor {err_t:.6f}\")\nprint(f\"mean abs error per-channel {err_c:.6f}\")\n\nn = 7e9\n# TODO: bytes = params * bits / 8, print in GB (1e9 bytes)\n",
   "expected": "per-channel q:\n25 -63 127 13\n64 -85 30 127\n-127 95 32 -63\nper-tensor q row 0: 1 -2 4 0\nmean abs error per-tensor 0.006483\nmean abs error per-channel 0.002572\n7B params: fp16 14.0 GB, int8 7.0 GB, int4 3.5 GB",
   "solution": "import numpy as np\n\nW = np.array([[0.02, -0.05, 0.10, 0.01],\n              [1.50, -2.00, 0.70, 3.00],\n              [-0.20, 0.15, 0.05, -0.10]])\n\ndef quantize(W, scale):\n    return np.clip(np.round(W / scale), -127, 127).astype(np.int8)\n\nscale_t = np.abs(W).max() / 127\nscale_c = np.abs(W).max(axis=1, keepdims=True) / 127\n\nq_t = quantize(W, scale_t)\nq_c = quantize(W, scale_c)\nprint(\"per-channel q:\")\nfor row in q_c:\n    print(\" \".join(str(int(v)) for v in row))\nprint(\"per-tensor q row 0: \" + \" \".join(str(int(v)) for v in q_t[0]))\nerr_t = np.abs(W - q_t * scale_t).mean()\nerr_c = np.abs(W - q_c * scale_c).mean()\nprint(f\"mean abs error per-tensor {err_t:.6f}\")\nprint(f\"mean abs error per-channel {err_c:.6f}\")\n\nn = 7e9\nprint(\"7B params: \" + \", \".join(f\"{name} {n * bits / 8 / 1e9:.1f} GB\" for name, bits in [(\"fp16\", 16), (\"int8\", 8), (\"int4\", 4)]))\n",
   "hint": "scale_c = np.abs(W).max(axis=1, keepdims=True) / 127. Dequantise with q.astype(float) * scale (int8 times float gives float)."
  },
  "quiz": [
   {
    "q": "Why does per-channel quantisation usually beat per-tensor?",
    "options": [
     "It uses more bits per weight",
     "It quantises activations too",
     "It avoids rounding",
     "Each row gets a scale fitted to its own range, so one large row does not crush the precision of small rows"
    ],
    "answer": 3,
    "why": "Rounding error is up to scale/2; a smaller scale for small rows means smaller errors."
   },
   {
    "q": "A 13B-parameter model is stored with 4-bit weights. Roughly how much memory do the weights need?",
    "options": [
     "26 GB",
     "13 GB",
     "about 6.5 GB plus a little for scales",
     "3.25 GB"
    ],
    "answer": 2,
    "why": "13e9 × 4 / 8 = 6.5e9 bytes; group scales add a few percent."
   },
   {
    "q": "Why can int8 weights make decode faster, not just smaller?",
    "options": [
     "int8 math is always exact",
     "Decode is memory-bound, so reading half the bytes per token can raise tokens/s",
     "It removes the KV cache",
     "It skips the softmax"
    ],
    "answer": 1,
    "why": "Fewer bytes moved per token is the main lever when bandwidth is the bottleneck."
   },
   {
    "q": "For nn.Linear with weight shape (out_features, in_features), per-output-channel scales have shape…",
    "options": [
     "(out_features, 1)",
     "(1, in_features)",
     "(in_features, out_features)",
     "a single scalar"
    ],
    "answer": 0,
    "why": "One scale per output row; keepdims makes it broadcast over the input dimension."
   }
  ]
 },
 "9.2": {
  "minutes": 55,
  "learn": "\n<p>Triton lets you write GPU kernels in Python syntax. You think in <b>blocks</b> of elements rather than single threads: the compiler handles threads, shared memory and much of the vectorisation. It is the usual route for custom fused kernels in PyTorch (torch.compile itself generates Triton code).</p>\n\n<h3>The programming model</h3>\n<p>You launch a <b>grid</b> of program instances. Each instance gets an id from <code>tl.program_id(axis)</code> and works on one block of data. Inside, <code>tl.arange(0, BLOCK)</code> is a vector of offsets, and loads and stores act on whole blocks. <code>BLOCK</code> must be a compile-time constant (<code>tl.constexpr</code>) and a power of two.</p>\n\n<h3>Vector add</h3>\n<pre><code>import torch, triton, triton.language as tl\n\n@triton.jit\ndef add_kernel(x_ptr, y_ptr, out_ptr, n, BLOCK_SIZE: tl.constexpr):\n    pid = tl.program_id(axis=0)\n    offs = pid * BLOCK_SIZE + tl.arange(0, BLOCK_SIZE)\n    mask = offs &lt; n                         # last block may run past the end\n    x = tl.load(x_ptr + offs, mask=mask)\n    y = tl.load(y_ptr + offs, mask=mask)\n    tl.store(out_ptr + offs, x + y, mask=mask)\n\ndef add(x, y):\n    out = torch.empty_like(x)\n    n = out.numel()\n    grid = lambda meta: (triton.cdiv(n, meta[\"BLOCK_SIZE\"]),)\n    add_kernel[grid](x, y, out, n, BLOCK_SIZE=1024)\n    return out</code></pre>\n<p>The grid has <code>cdiv(n, BLOCK)</code> programs. The <b>mask</b> stops the last program from reading or writing out of bounds; masked-off lanes of a load take the <code>other=</code> value.</p>\n\n<h3>Fused softmax</h3>\n<p>PyTorch's eager softmax may read and write the tensor several times (max, subtract, exp, sum, divide). A fused kernel loads a row once, does everything in registers, and writes once. One program handles one row; the block is the row length rounded up to a power of two, and padding lanes load −∞ so they contribute exp(−∞) = 0.</p>\n<pre><code>@triton.jit\ndef softmax_kernel(out_ptr, in_ptr, stride, n_cols, BLOCK: tl.constexpr):\n    row = tl.program_id(0)\n    offs = tl.arange(0, BLOCK)\n    x = tl.load(in_ptr + row * stride + offs, mask=offs &lt; n_cols, other=-float(\"inf\"))\n    x = x - tl.max(x, axis=0)\n    num = tl.exp(x)\n    y = num / tl.sum(num, axis=0)\n    tl.store(out_ptr + row * stride + offs, y, mask=offs &lt; n_cols)\n\n# launch: softmax_kernel[(n_rows,)](out, x, x.stride(0), n_cols, BLOCK=triton.next_power_of_2(n_cols))</code></pre>\n\n<h3>Matmul, autotuning and benchmarks</h3>\n<p>A matmul kernel uses a 2-D grid: each program computes one <code>BLOCK_M × BLOCK_N</code> tile of C, looping over K in steps of <code>BLOCK_K</code> and calling <code>tl.dot</code> on tiles of A and B. The best tile sizes depend on the GPU and shapes, so wrap the kernel in <code>@triton.autotune(configs=[triton.Config({...}, num_warps=4, num_stages=3), ...], key=[\"M\", \"N\", \"K\"])</code>; Triton times each config the first time it sees a shape. Measure with <code>triton.testing.do_bench(lambda: f(x))</code>, which handles warm-up and synchronisation.</p>\n\n<h3>Toward flash attention</h3>\n<p>The flash-attention forward pass is the same pattern: each program owns a block of queries, loops over blocks of keys and values, and keeps a running max <code>m</code>, running sum <code>l</code> and output accumulator, rescaling them when a new block raises the max. The Triton tutorials include a full version to study.</p>\n<blockquote>Common mistake: forgetting the mask (or the <code>other=</code> value) on the last block. Without it you read garbage past the end, and for softmax a padding value of 0 instead of −∞ silently changes every result in the row.</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "python",
   "prompt": "<p>Triton cannot run in the browser, so simulate its model in NumPy. <code>load</code> and <code>store</code> mimic <code>tl.load</code>/<code>tl.store</code> with a mask. Write the two kernel bodies and the grid sizes; the driver loops over <code>program_id</code> the way the GPU would launch programs.</p><ol><li>Vector add with n = 10, BLOCK = 4. Print each program's offsets and mask, then the result.</li><li>Row softmax, one program per row, n_cols = 5, BLOCK = 8, padding loaded as −∞. Print row 0 and whether it matches a NumPy reference.</li></ol><p>Expected output:</p><pre><code>grid = 3\npid 0: offs 0 1 2 3 mask 1111\npid 1: offs 4 5 6 7 mask 1111\npid 2: offs 8 9 10 11 mask 1100\nout: 10 12 14 16 18 20 22 24 26 28\nsoftmax row 0: 0.0117 0.0317 0.0861 0.2341 0.6364\nmatches numpy: True</code></pre>",
   "starter": "import numpy as np\n\ndef cdiv(a, b):\n    return (a + b - 1) // b\n\ndef load(arr, offs, mask, other=0.0):          # like tl.load\n    out = np.full(offs.shape, other, dtype=float)\n    out[mask] = arr[offs[mask]]\n    return out\n\ndef store(arr, offs, vals, mask):              # like tl.store\n    arr[offs[mask]] = vals[mask]\n\ndef add_kernel(pid, x, y, out, n, BLOCK):\n    # TODO: offs = pid * BLOCK + arange(BLOCK); mask = offs < n\n    # TODO: load x and y, store x + y\n    # return offs, mask so the driver can print them\n    pass\n\nn, BLOCK = 10, 4\nx = np.arange(n, dtype=float)\ny = np.arange(n, dtype=float) + 10\nout = np.zeros(n)\ngrid = 0  # TODO: number of programs\nprint(f\"grid = {grid}\")\nfor pid in range(grid):\n    offs, mask = add_kernel(pid, x, y, out, n, BLOCK)\n    print(f\"pid {pid}: offs {' '.join(str(int(o)) for o in offs)} mask {''.join('1' if m else '0' for m in mask)}\")\nprint(\"out: \" + \" \".join(str(int(v)) for v in out))\n\ndef softmax_kernel(row, inp, out, n_cols, BLOCK):\n    # TODO: offsets of this row inside the flat array; mask cols < n_cols\n    # TODO: load with other=-inf, subtract max, exp, divide by sum, store\n    pass\n\nX = np.arange(15, dtype=float).reshape(3, 5) % 7\nflat_in, flat_out = X.ravel(), np.zeros(X.size)\nfor row in range(X.shape[0]):\n    softmax_kernel(row, flat_in, flat_out, 5, 8)\nY = flat_out.reshape(3, 5)\nprint(\"softmax row 0: \" + \" \".join(f\"{v:.4f}\" for v in Y[0]))\nref = np.exp(X - X.max(1, keepdims=True)); ref /= ref.sum(1, keepdims=True)\nprint(f\"matches numpy: {bool(np.allclose(Y, ref))}\")\n",
   "expected": "grid = 3\npid 0: offs 0 1 2 3 mask 1111\npid 1: offs 4 5 6 7 mask 1111\npid 2: offs 8 9 10 11 mask 1100\nout: 10 12 14 16 18 20 22 24 26 28\nsoftmax row 0: 0.0117 0.0317 0.0861 0.2341 0.6364\nmatches numpy: True",
   "solution": "import numpy as np\n\ndef cdiv(a, b):\n    return (a + b - 1) // b\n\ndef load(arr, offs, mask, other=0.0):\n    out = np.full(offs.shape, other, dtype=float)\n    out[mask] = arr[offs[mask]]\n    return out\n\ndef store(arr, offs, vals, mask):\n    arr[offs[mask]] = vals[mask]\n\ndef add_kernel(pid, x, y, out, n, BLOCK):\n    offs = pid * BLOCK + np.arange(BLOCK)\n    mask = offs < n\n    a = load(x, offs, mask)\n    b = load(y, offs, mask)\n    store(out, offs, a + b, mask)\n    return offs, mask\n\nn, BLOCK = 10, 4\nx = np.arange(n, dtype=float)\ny = np.arange(n, dtype=float) + 10\nout = np.zeros(n)\ngrid = cdiv(n, BLOCK)\nprint(f\"grid = {grid}\")\nfor pid in range(grid):\n    offs, mask = add_kernel(pid, x, y, out, n, BLOCK)\n    print(f\"pid {pid}: offs {' '.join(str(int(o)) for o in offs)} mask {''.join('1' if m else '0' for m in mask)}\")\nprint(\"out: \" + \" \".join(str(int(v)) for v in out))\n\ndef softmax_kernel(row, inp, out, n_cols, BLOCK):\n    cols = np.arange(BLOCK)\n    mask = cols < n_cols\n    offs = row * n_cols + cols\n    v = load(inp, offs, mask, other=-np.inf)\n    v = v - v.max()\n    num = np.exp(v)\n    store(out, offs, num / num.sum(), mask)\n\nX = np.arange(15, dtype=float).reshape(3, 5) % 7\nflat_in, flat_out = X.ravel(), np.zeros(X.size)\nfor row in range(X.shape[0]):\n    softmax_kernel(row, flat_in, flat_out, 5, 8)\nY = flat_out.reshape(3, 5)\nprint(\"softmax row 0: \" + \" \".join(f\"{v:.4f}\" for v in Y[0]))\nref = np.exp(X - X.max(1, keepdims=True)); ref /= ref.sum(1, keepdims=True)\nprint(f\"matches numpy: {bool(np.allclose(Y, ref))}\")\n",
   "hint": "grid = cdiv(n, BLOCK). In the softmax kernel the row starts at row * n_cols (that is the row stride); pass other=-np.inf to load."
  },
  "quiz": [
   {
    "q": "n = 1000 and BLOCK_SIZE = 256. How many programs does the vector-add grid launch, and why is a mask needed?",
    "options": [
     "4; the last program covers 768–1023 and must skip indices ≥ 1000",
     "3; no mask needed",
     "1000; one per element",
     "256; one per lane"
    ],
    "answer": 0,
    "why": "cdiv(1000, 256) = 4, and 4 × 256 = 1024 > 1000, so the last block runs past the end."
   },
   {
    "q": "In the fused softmax kernel, why load padding lanes with −∞ instead of 0?",
    "options": [
     "−∞ is faster to load",
     "To avoid integer overflow",
     "Triton requires it for all loads",
     "exp(−∞) = 0, so padding adds nothing to the max or the sum"
    ],
    "answer": 3,
    "why": "A 0 would contribute exp(0 − max) to the denominator (and could be the max), changing every output."
   },
   {
    "q": "What does @triton.autotune do?",
    "options": [
     "Removes the need for masks",
     "Converts PyTorch code to Triton",
     "Picks the fastest config (block sizes, warps, stages) for each input shape key by timing them",
     "Chooses fp16 or fp32 automatically"
    ],
    "answer": 2,
    "why": "It benchmarks the listed configs the first time it sees a new key (e.g. M, N, K) and caches the winner."
   },
   {
    "q": "Why can a fused softmax beat a sequence of separate PyTorch ops?",
    "options": [
     "It uses fewer FLOPs",
     "It reads and writes each row once from GPU memory instead of once per op",
     "It skips the max subtraction",
     "It runs on the CPU"
    ],
    "answer": 1,
    "why": "Softmax is memory-bound; fusing removes intermediate reads and writes."
   }
  ]
 },
 "9.3": {
  "minutes": 60,
  "learn": "\n<p>A minimal inference runtime has four jobs: load weights, run a forward pass, keep the KV cache, and sample the next token. Writing one in Rust (with your own CUDA kernels) removes Python overhead and shows you exactly what frameworks like vLLM and llama.cpp do.</p>\n\n<h3>Step 1: export weights to safetensors</h3>\n<p>safetensors is a simple format: a JSON header (name, dtype, shape, byte offsets) followed by raw tensor bytes. It loads with no code execution, unlike pickle-based <code>.pt</code> files.</p>\n<pre><code>from safetensors.torch import save_file\nsave_file({k: v.contiguous() for k, v in model.state_dict().items()}, \"gpt.safetensors\")</code></pre>\n\n<h3>Step 2: load in Rust and run on CPU</h3>\n<pre><code>use safetensors::SafeTensors;\n\nlet bytes = std::fs::read(\"gpt.safetensors\")?;\nlet st = SafeTensors::deserialize(&amp;bytes)?;\nlet w = st.tensor(\"lm_head.weight\")?;          // a view: dtype, shape, raw bytes\nprintln!(\"{:?} {:?}\", w.dtype(), w.shape());\nlet data: Vec&lt;f32&gt; = w.data().chunks_exact(4)\n    .map(|b| f32::from_le_bytes(b.try_into().unwrap())).collect();</code></pre>\n<p>Store each matrix as a flat <code>Vec&lt;f32&gt;</code> in row-major order. A decode step is mostly matrix-vector products: for weight <code>(out, in)</code>, <code>y[o] = Σ_i W[o*in + i] · x[i]</code>. Write that loop first, check your logits match PyTorch to about 1e-4, and only then optimise. Libraries like <b>candle</b> give you tensors and ready-made layers if you prefer not to write everything yourself.</p>\n\n<h3>Step 3: your own CUDA kernel from Rust</h3>\n<p><b>cudarc</b> wraps the CUDA driver API: you create a context, copy buffers to the device, compile CUDA C at runtime with NVRTC (or load a PTX file), and launch a kernel with a grid and block size. The exact function names have changed between cudarc versions, so follow the examples for the version you install. The kernel itself is ordinary CUDA:</p>\n<pre><code>// copy one sequence's K rows out of a paged pool into a contiguous buffer\nextern \"C\" __global__ void kv_gather(const float* pool, const int* table,\n                                     float* out, int len, int bs, int d) {\n    int t = blockIdx.x;                  // one block per token\n    int i = threadIdx.x;                 // one thread per element of the row\n    if (t &gt;= len || i &gt;= d) return;\n    int slot = table[t / bs] * bs + t % bs;\n    out[t * d + i] = pool[slot * d + i];\n}</code></pre>\n\n<h3>The paged KV cache</h3>\n<p>As in PagedAttention, the cache is a pool of fixed-size blocks; each sequence has a block table. Token at logical position <code>t</code> lives in physical slot <code>table[t / BS] * BS + t % BS</code>. New tokens go into the next free slot; a new block is taken from a free list when the current one fills. Production kernels read straight from the pool inside attention instead of gathering first, but a separate gather is the easiest version to get correct.</p>\n\n<h3>Benchmark honestly</h3>\n<ul>\n<li>Warm up first (the first launch includes compilation and allocation).</li>\n<li>Synchronise the device before stopping the timer.</li>\n<li>Report decode tokens/s at a fixed prompt length and batch size, next to your PyTorch and Triton numbers.</li>\n</ul>\n<blockquote>Common mistake: mixing up row-major layouts. PyTorch's <code>nn.Linear</code> weight is <code>(out, in)</code> and computes <code>x @ W.T</code>. If your Rust matvec indexes <code>W[i*out + o]</code> the output will be wrong but the right shape, so compare against PyTorch numerically, not just by shape.</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "rust",
   "prompt": "<p>Implement the core of a paged-KV decode step in plain Rust. Block size 4, head dim 2, the sequence's block table is <code>[3, 0, 4]</code>, and it holds 10 tokens. Write <code>slot</code> (logical position to physical slot), <code>gather</code> (copy rows into a contiguous Vec in logical order) and <code>attend</code> (softmax(q·k/√d) weighted sum of v, with max subtraction). Expected output:</p><pre><code>slots: 12 13 14 15 0 1 2 3 16 17\nk[9] = [0.9, 1.0]\nout = [5.0785, 4.9215]</code></pre>",
   "starter": "// Paged KV cache: tokens live in fixed-size physical blocks.\n// A block table maps logical block i of a sequence to a physical block.\nconst BS: usize = 4; // tokens per block\nconst D: usize = 2;  // head dim\n\n// TODO: physical slot index for logical position pos\nfn slot(table: &[usize], pos: usize) -> usize {\n    0\n}\n\n// TODO: gather the D-dim rows for positions 0..len into one contiguous Vec\nfn gather(pool: &[f32], table: &[usize], len: usize) -> Vec<f32> {\n    Vec::new()\n}\n\n// TODO: one decode step for one head:\n// scores_t = q . k_t / sqrt(D); w = softmax(scores); out = sum_t w_t * v_t\nfn attend(q: &[f32; D], k: &[f32], v: &[f32], len: usize) -> [f32; D] {\n    [0.0; D]\n}\n\nfn main() {\n    let num_blocks = 5;\n    let mut k_pool = vec![0.0f32; num_blocks * BS * D];\n    let mut v_pool = vec![0.0f32; num_blocks * BS * D];\n    let table = [3usize, 0, 4];\n    let len = 10;\n    // write token t into its slot: k = [0.1 t, 1], v = [t, 10 - t]\n    for t in 0..len {\n        let s = slot(&table, t);\n        k_pool[s * D] = 0.1 * t as f32;\n        k_pool[s * D + 1] = 1.0;\n        v_pool[s * D] = t as f32;\n        v_pool[s * D + 1] = (10 - t) as f32;\n    }\n    let slots: Vec<String> = (0..len).map(|t| slot(&table, t).to_string()).collect();\n    println!(\"slots: {}\", slots.join(\" \"));\n    let k = gather(&k_pool, &table, len);\n    let v = gather(&v_pool, &table, len);\n    println!(\"k[9] = [{:.1}, {:.1}]\", k[9 * D], k[9 * D + 1]);\n    let out = attend(&[1.0, 0.5], &k, &v, len);\n    println!(\"out = [{:.4}, {:.4}]\", out[0], out[1]);\n}\n",
   "expected": "slots: 12 13 14 15 0 1 2 3 16 17\nk[9] = [0.9, 1.0]\nout = [5.0785, 4.9215]",
   "solution": "// Paged KV cache: tokens live in fixed-size physical blocks.\n// A block table maps logical block i of a sequence to a physical block.\nconst BS: usize = 4; // tokens per block\nconst D: usize = 2;  // head dim\n\nfn slot(table: &[usize], pos: usize) -> usize {\n    table[pos / BS] * BS + pos % BS\n}\n\nfn gather(pool: &[f32], table: &[usize], len: usize) -> Vec<f32> {\n    let mut out = Vec::with_capacity(len * D);\n    for t in 0..len {\n        let s = slot(table, t);\n        out.extend_from_slice(&pool[s * D..s * D + D]);\n    }\n    out\n}\n\nfn attend(q: &[f32; D], k: &[f32], v: &[f32], len: usize) -> [f32; D] {\n    let scale = 1.0 / (D as f32).sqrt();\n    let scores: Vec<f32> = (0..len)\n        .map(|t| (0..D).map(|i| q[i] * k[t * D + i]).sum::<f32>() * scale)\n        .collect();\n    let m = scores.iter().cloned().fold(f32::NEG_INFINITY, f32::max);\n    let e: Vec<f32> = scores.iter().map(|s| (s - m).exp()).collect();\n    let z: f32 = e.iter().sum();\n    let mut out = [0.0f32; D];\n    for t in 0..len {\n        for i in 0..D {\n            out[i] += e[t] / z * v[t * D + i];\n        }\n    }\n    out\n}\n\nfn main() {\n    let num_blocks = 5;\n    let mut k_pool = vec![0.0f32; num_blocks * BS * D];\n    let mut v_pool = vec![0.0f32; num_blocks * BS * D];\n    let table = [3usize, 0, 4];\n    let len = 10;\n    // write token t into its slot: k = [0.1 t, 1], v = [t, 10 - t]\n    for t in 0..len {\n        let s = slot(&table, t);\n        k_pool[s * D] = 0.1 * t as f32;\n        k_pool[s * D + 1] = 1.0;\n        v_pool[s * D] = t as f32;\n        v_pool[s * D + 1] = (10 - t) as f32;\n    }\n    let slots: Vec<String> = (0..len).map(|t| slot(&table, t).to_string()).collect();\n    println!(\"slots: {}\", slots.join(\" \"));\n    let k = gather(&k_pool, &table, len);\n    let v = gather(&v_pool, &table, len);\n    println!(\"k[9] = [{:.1}, {:.1}]\", k[9 * D], k[9 * D + 1]);\n    let out = attend(&[1.0, 0.5], &k, &v, len);\n    println!(\"out = [{:.4}, {:.4}]\", out[0], out[1]);\n}\n",
   "hint": "slot = table[pos / BS] * BS + pos % BS. In gather, extend_from_slice(&pool[s*D..s*D+D]). Subtract the max score before exp."
  },
  "quiz": [
   {
    "q": "Block size is 16 and a sequence's block table is [7, 2]. Where is logical token 20 stored?",
    "options": [
     "Slot 20",
     "Slot 36 (block 2, offset 4)",
     "Slot 116 (block 7, offset 4)",
     "Slot 4"
    ],
    "answer": 1,
    "why": "20 / 16 = 1, so logical block 1 maps to physical block 2; offset 20 % 16 = 4; slot 2·16 + 4 = 36."
   },
   {
    "q": "Why prefer safetensors over a pickled .pt file for a Rust runtime?",
    "options": [
     "It is a plain header plus raw bytes that any language can read, with no code execution on load",
     "It is compressed",
     "It stores the model code too",
     "It is required by CUDA"
    ],
    "answer": 0,
    "why": "Pickle can run arbitrary code and is Python-specific; safetensors is a simple, safe binary layout."
   },
   {
    "q": "Your Rust logits have the right shape but differ from PyTorch everywhere. What is the most likely bug?",
    "options": [
     "Block size too small",
     "Using f32 instead of f16",
     "Missing warm-up",
     "Wrong weight layout or indexing (e.g. treating (out, in) as (in, out))"
    ],
    "answer": 3,
    "why": "A transposed index keeps shapes valid but scrambles every dot product; check one matvec against PyTorch."
   },
   {
    "q": "Why must you synchronise the GPU before stopping a timer?",
    "options": [
     "To free memory",
     "To reset the KV cache",
     "Kernel launches are asynchronous, so without sync you time only the launch, not the work",
     "CUDA requires it after every kernel"
    ],
    "answer": 2,
    "why": "The CPU returns as soon as the launch is queued; the GPU finishes later."
   }
  ]
 }
});
