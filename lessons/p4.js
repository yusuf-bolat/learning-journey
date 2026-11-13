// Phase 4 lesson content. Generated; verified practice solutions.
Object.assign(LESSONS,{
 "4.0": {
  "minutes": 50,
  "learn": "\n<p>A GPU runs thousands of lightweight threads at once. CUDA lets you write one function, a <b>kernel</b>, that every thread executes on a different piece of data. Your job is to map \"which thread am I?\" to \"which element do I own?\".</p>\n\n<h3>Host, device and the program flow</h3>\n<p>The CPU is the <b>host</b>, the GPU is the <b>device</b>, and each has its own memory. A typical CUDA program does five things:</p>\n<ol>\n<li>Allocate device memory with <code>cudaMalloc</code>.</li>\n<li>Copy inputs host → device with <code>cudaMemcpy</code>.</li>\n<li>Launch a kernel with the <code>&lt;&lt;&lt;grid, block&gt;&gt;&gt;</code> syntax.</li>\n<li>Copy results device → host.</li>\n<li>Free memory with <code>cudaFree</code>.</li>\n</ol>\n\n<h3>Threads, blocks and grids</h3>\n<p>Threads are grouped into <b>blocks</b> (up to 1024 threads each), and blocks form a <b>grid</b>. Inside a kernel, built-in variables tell a thread where it is: <code>threadIdx</code> (position in its block), <code>blockIdx</code> (position of the block in the grid), <code>blockDim</code> (threads per block) and <code>gridDim</code> (blocks per grid). Each has <code>.x</code>, <code>.y</code>, <code>.z</code>.</p>\n<pre><code>__global__ void add(const float* a, const float* b, float* c, int n) {\n    int i = blockIdx.x * blockDim.x + threadIdx.x;   // global index\n    if (i &lt; n) c[i] = a[i] + b[i];                   // bounds check!\n}\n\nint threads = 256;\nint blocks  = (n + threads - 1) / threads;           // round up\nadd&lt;&lt;&lt;blocks, threads&gt;&gt;&gt;(d_a, d_b, d_c, n);</code></pre>\n<p>Because the block count is rounded up, the last block usually has extra threads past the end of the array. The <code>if (i &lt; n)</code> check stops them from writing out of bounds.</p>\n\n<h3>Warps</h3>\n<p>The hardware runs threads in groups of 32 called <b>warps</b>. All threads of a warp issue the same instruction. Block sizes should be a multiple of 32 (128 or 256 is a good default); otherwise part of the last warp sits idle. If threads in one warp take different branches of an <code>if</code>, the warp runs both paths one after the other (<b>divergence</b>).</p>\n\n<h3>2-D kernels for images</h3>\n<p>For images, use 2-D blocks and grids so each thread owns one pixel:</p>\n<pre><code>__global__ void gray(const uchar3* rgb, unsigned char* out, int w, int h) {\n    int x = blockIdx.x * blockDim.x + threadIdx.x;\n    int y = blockIdx.y * blockDim.y + threadIdx.y;\n    if (x &lt; w &amp;&amp; y &lt; h) {\n        uchar3 p = rgb[y * w + x];                  // row-major index\n        out[y * w + x] = 0.299f*p.x + 0.587f*p.y + 0.114f*p.z;\n    }\n}\ndim3 block(16, 16);\ndim3 grid((w + 15) / 16, (h + 15) / 16);\ngray&lt;&lt;&lt;grid, block&gt;&gt;&gt;(d_rgb, d_gray, w, h);</code></pre>\n\n<h3>Error checking</h3>\n<p>CUDA calls return a <code>cudaError_t</code>, and kernel launches fail silently unless you ask. Wrap every call:</p>\n<pre><code>#define CUDA_CHECK(call) do { cudaError_t e = (call); \\\n  if (e != cudaSuccess) { fprintf(stderr, \"%s:%d %s\\n\", __FILE__, __LINE__, \\\n  cudaGetErrorString(e)); exit(1); } } while (0)\n\nCUDA_CHECK(cudaMalloc(&amp;d_a, bytes));\nadd&lt;&lt;&lt;blocks, threads&gt;&gt;&gt;(d_a, d_b, d_c, n);\nCUDA_CHECK(cudaGetLastError());        // launch errors\nCUDA_CHECK(cudaDeviceSynchronize());   // errors while running</code></pre>\n\n<h3>Timing</h3>\n<p>Kernel launches are asynchronous: the CPU continues immediately. Time GPU work with <code>cudaEvent_t</code> (<code>cudaEventRecord</code> before and after, then <code>cudaEventElapsedTime</code>), not with a CPU timer around the launch alone. Run a warm-up launch first; the first launch pays one-time setup costs.</p>\n<blockquote>Common mistake: forgetting the bounds check. With n = 1000 and 256 threads per block you launch 1024 threads, and 24 of them would write past the end of the array.</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "cpp",
   "prompt": "<p>There is no GPU here, so you will simulate a launch on the CPU. Loops over <code>blockIdx</code> and <code>threadIdx</code> play the role of the hardware.</p><ol><li><code>num_blocks(n, threads)</code>: blocks needed (round up). For n = 1000, 256 threads, print blocks, total threads launched and idle threads.</li><li>Fill <code>c</code> by \"launching\" the vector-add kernel body for every (block, thread) pair with a bounds check. Here a[i] = i and b[i] = 2i. Print c[999] and the sum of c.</li><li>For a 70×50 image with 16×16 blocks, print the grid size and block count. Then print the pixel owned by blockIdx (2,1), threadIdx (3,5), with its row-major index.</li></ol><p>Expected output:</p><pre><code>blocks=4 threads=1024 idle=24\nc[999]=2997 sum=1498500\ngrid=5x4 blocks2d=20\npixel x=35 y=21 idx=1505</code></pre>",
   "starter": "#include <cstdio>\n#include <vector>\n\nint num_blocks(int n, int threads) {\n    // TODO: round up n / threads\n    return 0;\n}\n\nint main() {\n    const int n = 1000, threads = 256;\n    int blocks = num_blocks(n, threads);\n    printf(\"blocks=%d threads=%d idle=%d\\n\", blocks, blocks * threads, blocks * threads - n);\n\n    std::vector<long long> a(n), b(n), c(n, 0);\n    for (int i = 0; i < n; i++) { a[i] = i; b[i] = 2 * i; }\n    for (int blockIdx = 0; blockIdx < blocks; blockIdx++)\n        for (int threadIdx = 0; threadIdx < threads; threadIdx++) {\n            // TODO: global index i, bounds check, c[i] = a[i] + b[i]\n        }\n    long long sum = 0;\n    for (long long v : c) sum += v;\n    printf(\"c[999]=%lld sum=%lld\\n\", c[999], sum);\n\n    int w = 70, h = 50, bx = 16, by = 16;\n    int gx = 0, gy = 0;  // TODO: grid size in x and y\n    printf(\"grid=%dx%d blocks2d=%d\\n\", gx, gy, gx * gy);\n\n    int x = 0, y = 0;    // TODO: pixel for blockIdx (2,1), threadIdx (3,5)\n    printf(\"pixel x=%d y=%d idx=%d\\n\", x, y, y * w + x);\n}\n",
   "expected": "blocks=4 threads=1024 idle=24\nc[999]=2997 sum=1498500\ngrid=5x4 blocks2d=20\npixel x=35 y=21 idx=1505",
   "solution": "#include <cstdio>\n#include <vector>\n\nint num_blocks(int n, int threads) {\n    return (n + threads - 1) / threads;\n}\n\nint main() {\n    const int n = 1000, threads = 256;\n    int blocks = num_blocks(n, threads);\n    printf(\"blocks=%d threads=%d idle=%d\\n\", blocks, blocks * threads, blocks * threads - n);\n\n    std::vector<long long> a(n), b(n), c(n, 0);\n    for (int i = 0; i < n; i++) { a[i] = i; b[i] = 2 * i; }\n    for (int blockIdx = 0; blockIdx < blocks; blockIdx++)\n        for (int threadIdx = 0; threadIdx < threads; threadIdx++) {\n            int i = blockIdx * threads + threadIdx;\n            if (i < n) c[i] = a[i] + b[i];\n        }\n    long long sum = 0;\n    for (long long v : c) sum += v;\n    printf(\"c[999]=%lld sum=%lld\\n\", c[999], sum);\n\n    int w = 70, h = 50, bx = 16, by = 16;\n    int gx = num_blocks(w, bx), gy = num_blocks(h, by);\n    printf(\"grid=%dx%d blocks2d=%d\\n\", gx, gy, gx * gy);\n\n    int x = 2 * bx + 3, y = 1 * by + 5;\n    printf(\"pixel x=%d y=%d idx=%d\\n\", x, y, y * w + x);\n}\n",
   "hint": "Round up with (n + threads - 1) / threads. Global index = blockIdx * blockDim + threadIdx, separately for x and y."
  },
  "quiz": [
   {
    "q": "You launch add<<<4, 256>>> for an array of 1000 elements. Why does the kernel need if (i < n)?",
    "options": [
     "CUDA requires every kernel to have an if",
     "1024 threads run, and the last 24 would read and write past the end of the arrays",
     "It makes the kernel faster",
     "Without it, threads run in the wrong order"
    ],
    "answer": 1,
    "why": "The block count is rounded up, so the grid has more threads than elements. Out-of-range threads must do nothing."
   },
   {
    "q": "Why should the block size be a multiple of 32?",
    "options": [
     "Threads run in warps of 32, so other sizes leave lanes of the last warp idle",
     "Memory is allocated in 32-byte pages",
     "The compiler rejects other sizes",
     "It reduces the number of blocks to 32"
    ],
    "answer": 0,
    "why": "The hardware schedules whole warps. A block of 100 threads uses 4 warps (128 lanes), and 28 of those lanes do nothing."
   },
   {
    "q": "You time a kernel with a CPU clock around the launch line only and get almost 0 ms. What is wrong?",
    "options": [
     "The kernel did not compile",
     "The GPU is too fast to measure",
     "The launch is asynchronous, so the CPU timer stops before the kernel finishes",
     "cudaMemcpy was not called"
    ],
    "answer": 2,
    "why": "The launch returns at once. Use CUDA events or call cudaDeviceSynchronize before stopping the timer."
   },
   {
    "q": "In a 2-D kernel over a w×h row-major image, which index does pixel (x, y) use?",
    "options": [
     "x * h + y",
     "x * w + y",
     "y * h + x",
     "y * w + x"
    ],
    "answer": 3,
    "why": "Row-major storage puts rows one after another, each row w pixels long, so you skip y full rows and then move x pixels into the row."
   }
  ]
 },
 "4.1": {
  "minutes": 60,
  "learn": "\n<p>Most CUDA kernels are limited by memory, not arithmetic. A modern GPU can do far more floating-point operations per second than it can load floats from global memory. Fast kernels move less data and move it in the way the hardware likes.</p>\n\n<h3>The hierarchy</h3>\n<table>\n<tr><th>Memory</th><th>Scope</th><th>Speed</th></tr>\n<tr><td>Registers</td><td>one thread</td><td>fastest</td></tr>\n<tr><td>Shared memory (<code>__shared__</code>)</td><td>one block</td><td>on-chip, very fast</td></tr>\n<tr><td>L1 / L2 cache</td><td>SM / whole GPU</td><td>fast, automatic</td></tr>\n<tr><td>Global memory (<code>cudaMalloc</code>)</td><td>all threads + host copies</td><td>slow, high latency</td></tr>\n</table>\n\n<h3>Coalescing</h3>\n<p>When the 32 threads of a warp load from global memory, the hardware groups their addresses into aligned memory segments (transactions of 32-byte sectors, often discussed as 128-byte lines). If thread k reads <code>a[k]</code>, the warp reads 32 consecutive floats = 128 bytes in one line: <b>coalesced</b>. If thread k reads <code>a[k * 32]</code>, every thread hits a different line, so the hardware fetches 32 lines to use 4 bytes of each.</p>\n<pre><code>out[i] = in[i];            // coalesced: neighbours read neighbours\nout[i] = in[i * stride];   // strided: wastes bandwidth as stride grows\nout[i] = M[i * N + col];   // column walk in row-major data: strided!</code></pre>\n<p>Rule: make <code>threadIdx.x</code> move along the <b>fastest-changing</b> (last) index of your array.</p>\n\n<h3>Shared-memory tiling for matmul</h3>\n<p>In a naive matmul each thread computes one <code>C[row][col]</code> and reads a whole row of A and column of B from global memory: 2N loads per output, 2N³ in total. Neighbouring threads read the same values again and again. Tiling loads a T×T tile of A and of B into shared memory once per block, then every thread in the block reuses it:</p>\n<pre><code>__global__ void matmulTiled(const float* A, const float* B, float* C, int N) {\n    __shared__ float As[T][T], Bs[T][T];\n    int row = blockIdx.y * T + threadIdx.y, col = blockIdx.x * T + threadIdx.x;\n    float acc = 0;\n    for (int t = 0; t &lt; N / T; t++) {\n        As[threadIdx.y][threadIdx.x] = A[row * N + t * T + threadIdx.x];\n        Bs[threadIdx.y][threadIdx.x] = B[(t * T + threadIdx.y) * N + col];\n        __syncthreads();                       // tile fully loaded\n        for (int k = 0; k &lt; T; k++) acc += As[threadIdx.y][k] * Bs[k][threadIdx.x];\n        __syncthreads();                       // done before overwrite\n    }\n    C[row * N + col] = acc;\n}</code></pre>\n<p>Global loads drop from 2N³ to 2N³/T. With T = 16 that is 16× less traffic. Both <code>__syncthreads()</code> calls are required: the first so nobody reads a half-loaded tile, the second so nobody overwrites a tile others still use. (This version assumes N is a multiple of T.)</p>\n\n<h3>Reduction with warp shuffles</h3>\n<p>Summing an array in parallel is a tree: pairs add, then pairs of pairs, in log₂ steps. Inside a warp, threads can read each other's registers directly with <code>__shfl_down_sync</code>, with no shared memory needed:</p>\n<pre><code>float v = x;                                  // each lane's value\nfor (int off = 16; off &gt; 0; off /= 2)\n    v += __shfl_down_sync(0xffffffff, v, off);  // lane i gets lane i+off\n// lane 0 now holds the warp's sum</code></pre>\n<p>Each block then combines its warp sums (via shared memory), and one <code>atomicAdd</code> per block adds to the total.</p>\n\n<h3>Pinned memory and streams</h3>\n<p><code>cudaMallocHost</code> allocates <b>pinned</b> (page-locked) host memory. Copies from it are faster, and only pinned memory allows truly asynchronous <code>cudaMemcpyAsync</code>. Split the work into chunks on several <b>streams</b>, so chunk 2 is copying while chunk 1 is computing.</p>\n<p>Measure throughput as GFLOPS = 2N³ / (seconds × 10⁹) for matmul, or effective bandwidth = bytes moved / seconds.</p>\n<blockquote>Common mistake: putting <code>__syncthreads()</code> inside an <code>if</code> that only some threads of a block take. Every thread of the block must reach it, or the kernel can hang or give wrong results.</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "cpp",
   "prompt": "<p>Simulate three memory ideas on the CPU, using a simplified model of 128-byte aligned segments.</p><ol><li><code>segments(stride, offset)</code>: one warp of 32 threads, thread k loads the float at index <code>offset + k * stride</code>. Return how many distinct 128-byte segments are touched (segment = byte address / 128). Print segments and efficiency (128 useful bytes / bytes fetched, as a percentage with 1 decimal) for strides 1, 2, 8, 32. Then print the segment count for stride 1, offset 1.</li><li>Simulate the warp shuffle reduction: lane k holds k+1. For off = 16, 8, 4, 2, 1, each lane adds the value of lane k+off (lanes with k+off ≥ 32 keep their own value, as <code>__shfl_down_sync</code> does). All lanes read the <b>old</b> values of a step. Print lane 0.</li><li>Print global reads of naive matmul (2N³) and tiled (2N³/T) for N = 64, T = 16.</li></ol><p>Expected output:</p><pre><code>stride 1: 1 segments, 100.0% efficient\nstride 2: 2 segments, 50.0% efficient\nstride 8: 8 segments, 12.5% efficient\nstride 32: 32 segments, 3.1% efficient\noffset 1: 2 segments\nwarp sum=528\nnaive reads=524288 tiled reads=32768</code></pre>",
   "starter": "#include <cstdio>\n#include <set>\n\nint segments(int stride, int offset) {\n    std::set<long> segs;\n    for (int k = 0; k < 32; k++) {\n        // TODO: byte address of float index offset + k*stride, insert its segment\n    }\n    return (int)segs.size();\n}\n\nint main() {\n    for (int s : {1, 2, 8, 32}) {\n        int n = segments(s, 0);\n        double eff = 0;  // TODO: 128 useful bytes / (n * 128) * 100\n        printf(\"stride %d: %d segments, %.1f%% efficient\\n\", s, n, eff);\n    }\n    printf(\"offset 1: %d segments\\n\", segments(1, 1));\n\n    int v[32];\n    for (int k = 0; k < 32; k++) v[k] = k + 1;\n    for (int off = 16; off > 0; off /= 2) {\n        // TODO: copy old values, then v[k] += old[k + off] when k + off < 32\n    }\n    printf(\"warp sum=%d\\n\", v[0]);\n\n    long N = 64, T = 16;\n    long naive = 0, tiled = 0;  // TODO\n    printf(\"naive reads=%ld tiled reads=%ld\\n\", naive, tiled);\n}\n",
   "expected": "stride 1: 1 segments, 100.0% efficient\nstride 2: 2 segments, 50.0% efficient\nstride 8: 8 segments, 12.5% efficient\nstride 32: 32 segments, 3.1% efficient\noffset 1: 2 segments\nwarp sum=528\nnaive reads=524288 tiled reads=32768",
   "solution": "#include <cstdio>\n#include <set>\n\nint segments(int stride, int offset) {\n    std::set<long> segs;\n    for (int k = 0; k < 32; k++) {\n        long addr = (long)(offset + k * stride) * 4;\n        segs.insert(addr / 128);\n    }\n    return (int)segs.size();\n}\n\nint main() {\n    for (int s : {1, 2, 8, 32}) {\n        int n = segments(s, 0);\n        double eff = 128.0 / (n * 128) * 100;\n        printf(\"stride %d: %d segments, %.1f%% efficient\\n\", s, n, eff);\n    }\n    printf(\"offset 1: %d segments\\n\", segments(1, 1));\n\n    int v[32];\n    for (int k = 0; k < 32; k++) v[k] = k + 1;\n    for (int off = 16; off > 0; off /= 2) {\n        int old[32];\n        for (int k = 0; k < 32; k++) old[k] = v[k];\n        for (int k = 0; k < 32; k++)\n            if (k + off < 32) v[k] += old[k + off];\n    }\n    printf(\"warp sum=%d\\n\", v[0]);\n\n    long N = 64, T = 16;\n    long naive = 2 * N * N * N, tiled = naive / T;\n    printf(\"naive reads=%ld tiled reads=%ld\\n\", naive, tiled);\n}\n",
   "hint": "A float is 4 bytes, so the byte address is index * 4 and the segment is address / 128. For the shuffle, copy v into old before updating."
  },
  "quiz": [
   {
    "q": "A kernel reads M[threadIdx.x * N + col] from a row-major N×N matrix. What is the access pattern across a warp?",
    "options": [
     "Coalesced, because threadIdx.x is used",
     "Strided by N floats, so each thread touches a different segment",
     "Broadcast, every thread reads the same value",
     "It depends on blockDim.y only"
    ],
    "answer": 1,
    "why": "Neighbouring threads are N elements apart, so they walk down a column. Put threadIdx.x on the last index to coalesce."
   },
   {
    "q": "Why does the tiled matmul need a __syncthreads() after the inner k-loop?",
    "options": [
     "To flush results to global memory",
     "To let the CPU read C",
     "So no thread overwrites a shared tile while others are still reading it",
     "It is not needed; only the first one is"
    ],
    "answer": 2,
    "why": "The next iteration loads new tiles into the same shared arrays. Fast threads must wait until everyone has finished using the current tile."
   },
   {
    "q": "With tile size T, by roughly what factor does tiling cut global memory reads in matmul?",
    "options": [
     "T",
     "2",
     "T²",
     "N"
    ],
    "answer": 0,
    "why": "Each loaded value is reused by T threads of the block, so 2N³ loads become 2N³/T."
   },
   {
    "q": "Why use cudaMallocHost (pinned memory) when overlapping copies with streams?",
    "options": [
     "Pinned memory lives on the GPU",
     "It is the only way to call kernels",
     "It doubles the GPU clock speed",
     "cudaMemcpyAsync can only overlap with compute when the host buffer is page-locked"
    ],
    "answer": 3,
    "why": "Pageable memory has to be staged through a pinned buffer, which makes the copy synchronous in practice. Pinned memory lets the DMA engine copy while kernels run."
   }
  ]
 },
 "4.2": {
  "minutes": 50,
  "learn": "\n<p>Before writing a kernel, check whether a library already does it. NVIDIA's libraries are tuned per GPU generation and are usually faster than a first hand-written version. Then use a profiler to find where the remaining time goes.</p>\n\n<h3>Thrust: the STL for the GPU</h3>\n<p>Thrust (part of CCCL, ships with the CUDA toolkit) gives you containers and parallel algorithms with an STL-like interface.</p>\n<pre><code>#include &lt;thrust/device_vector.h&gt;\n#include &lt;thrust/sort.h&gt;\n#include &lt;thrust/reduce.h&gt;\n\nthrust::host_vector&lt;int&gt; h(10'000'000);\n// ... fill h ...\nthrust::device_vector&lt;int&gt; d = h;          // copies to the GPU\nthrust::sort(d.begin(), d.end());           // parallel radix sort for ints\nlong long s = thrust::reduce(d.begin(), d.end(), 0LL);\nthrust::copy(d.begin(), d.end(), h.begin()); // back to host</code></pre>\n<p>Useful algorithms: <code>sort</code>, <code>sort_by_key</code>, <code>reduce</code>, <code>transform</code>, <code>inclusive_scan</code> / <code>exclusive_scan</code>, <code>lower_bound</code> (vectorised: many searches at once), <code>unique</code>, <code>reduce_by_key</code>. When timing against <code>std::sort</code>, time the device sort alone and also with the copies; for small inputs the copies dominate.</p>\n\n<h3>Building CSR with sort + search</h3>\n<p>Graphs and sparse matrices on the GPU are stored in <b>CSR</b> (compressed sparse row): an array <code>cols</code> with all neighbours grouped by source node, and <code>offsets</code> of length V+1 where the neighbours of node v are <code>cols[offsets[v] .. offsets[v+1])</code>. Building it from an edge list is two library calls:</p>\n<ol>\n<li><code>thrust::sort_by_key</code> the edges by source (stable sort by destination first if you want sorted neighbour lists).</li>\n<li><code>thrust::lower_bound</code> of the values 0..V into the sorted sources gives <code>offsets</code> directly: the first position where source ≥ v.</li>\n</ol>\n<p>The same pattern (sort, then search or scan) replaces many hand-written atomics-based kernels.</p>\n\n<h3>cuBLAS</h3>\n<p>cuBLAS implements BLAS on the GPU. It is <b>column-major</b> like Fortran. A common trick for row-major C = A·B is to ask cuBLAS for Cᵀ = Bᵀ·Aᵀ by swapping the operands:</p>\n<pre><code>cublasHandle_t h; cublasCreate(&amp;h);\nfloat alpha = 1, beta = 0;\n// row-major A (M×K), B (K×N), C (M×N)\ncublasSgemm(h, CUBLAS_OP_N, CUBLAS_OP_N, N, M, K,\n            &amp;alpha, dB, N, dA, K, &amp;beta, dC, N);</code></pre>\n<p>Comparing your tiled kernel's GFLOPS to cuBLAS tells you how much is left on the table.</p>\n\n<h3>Profiling: Nsight Systems and Nsight Compute</h3>\n<ul>\n<li><b>Nsight Systems</b> (<code>nsys profile ./app</code>): a timeline of the whole program. Shows kernels, copies, CPU gaps. Use it first to find which kernel or copy matters.</li>\n<li><b>Nsight Compute</b> (<code>ncu --set full ./app</code>): deep metrics for one kernel. Key sections: <i>Speed Of Light</i> (percent of peak compute and memory throughput), <i>Occupancy</i> (active warps vs the maximum), <i>Memory Workload Analysis</i>.</li>\n</ul>\n<p>Read the Speed Of Light first. If memory throughput is near peak and compute is low, the kernel is <b>memory-bound</b>: reduce or coalesce traffic. If compute is near peak, it is <b>compute-bound</b>. If both are low, the kernel is usually <b>latency-bound</b>: too little parallelism or too few warps to hide memory latency, often from low occupancy caused by too many registers or too much shared memory per block.</p>\n<p><b>Arithmetic intensity</b> = FLOPs / bytes moved. Vector add does 1 FLOP per 12 bytes, so it is always memory-bound. Large matmul has high intensity, so a good implementation becomes compute-bound.</p>\n<blockquote>Common mistake: chasing 100% occupancy. Occupancy only needs to be high enough to hide latency; many fast kernels run at 50% or less because they use more registers per thread.</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "cpp",
   "prompt": "<p>Build a CSR graph from an edge list the way Thrust would, using the C++ equivalents: <code>std::sort</code> (for <code>thrust::sort</code>) and <code>std::lower_bound</code> (for <code>thrust::lower_bound</code>).</p><ol><li>Sort the edges by (source, destination).</li><li>For every v in 0..V (inclusive, V+1 values), <code>offsets[v]</code> = first index in the sorted sources whose value is ≥ v.</li><li>Print offsets, cols, and the neighbours of node 2.</li></ol><p>Expected output:</p><pre><code>offsets: 0 3 4 6 7\ncols: 1 2 3 2 0 1 2\nneighbors(2): 0 1</code></pre>",
   "starter": "#include <algorithm>\n#include <cstdio>\n#include <utility>\n#include <vector>\n\nint main() {\n    const int V = 4;\n    std::vector<std::pair<int,int>> edges = {{2,0},{0,1},{3,2},{0,3},{1,2},{2,1},{0,2}};\n\n    // TODO 1: sort edges (pairs compare by first, then second)\n\n    std::vector<int> src, cols;\n    for (auto& e : edges) { src.push_back(e.first); cols.push_back(e.second); }\n\n    std::vector<int> offsets(V + 1);\n    // TODO 2: offsets[v] = lower_bound position of v in src\n\n    printf(\"offsets:\");\n    for (int o : offsets) printf(\" %d\", o);\n    printf(\"\\ncols:\");\n    for (int c : cols) printf(\" %d\", c);\n    printf(\"\\nneighbors(2):\");\n    // TODO 3: print cols[offsets[2] .. offsets[3])\n    printf(\"\\n\");\n}\n",
   "expected": "offsets: 0 3 4 6 7\ncols: 1 2 3 2 0 1 2\nneighbors(2): 0 1",
   "solution": "#include <algorithm>\n#include <cstdio>\n#include <utility>\n#include <vector>\n\nint main() {\n    const int V = 4;\n    std::vector<std::pair<int,int>> edges = {{2,0},{0,1},{3,2},{0,3},{1,2},{2,1},{0,2}};\n\n    std::sort(edges.begin(), edges.end());\n\n    std::vector<int> src, cols;\n    for (auto& e : edges) { src.push_back(e.first); cols.push_back(e.second); }\n\n    std::vector<int> offsets(V + 1);\n    for (int v = 0; v <= V; v++)\n        offsets[v] = std::lower_bound(src.begin(), src.end(), v) - src.begin();\n\n    printf(\"offsets:\");\n    for (int o : offsets) printf(\" %d\", o);\n    printf(\"\\ncols:\");\n    for (int c : cols) printf(\" %d\", c);\n    printf(\"\\nneighbors(2):\");\n    for (int i = offsets[2]; i < offsets[3]; i++) printf(\" %d\", cols[i]);\n    printf(\"\\n\");\n}\n",
   "hint": "std::lower_bound(src.begin(), src.end(), v) - src.begin() gives the index. For v = V it returns src.size()."
  },
  "quiz": [
   {
    "q": "Nsight Compute shows a kernel at 90% of peak memory throughput and 10% of peak compute. What should you try?",
    "options": [
     "Use more FLOPs per thread to balance it",
     "Reduce or coalesce memory traffic, for example with shared-memory reuse",
     "Increase the block size to 1024",
     "Nothing; 90% means it is compute-bound"
    ],
    "answer": 1,
    "why": "The kernel is memory-bound. Only moving fewer bytes, or moving them more efficiently, will make it faster."
   },
   {
    "q": "In CSR, the neighbours of node v are stored where?",
    "options": [
     "cols[offsets[v] .. offsets[v+1])",
     "cols[v .. v+degree)",
     "offsets[cols[v]]",
     "cols[v * V .. (v+1) * V)"
    ],
    "answer": 0,
    "why": "offsets has V+1 entries; consecutive entries bound each node's slice of cols."
   },
   {
    "q": "thrust::sort on 1,000 ints, including the host-to-device and device-to-host copies, is slower than std::sort. Why?",
    "options": [
     "Thrust is not parallel",
     "The GPU cannot sort integers",
     "For tiny inputs, copy and launch overhead outweigh the parallel speedup",
     "std::sort uses the GPU too"
    ],
    "answer": 2,
    "why": "GPU libraries win on large inputs. Small inputs are dominated by fixed costs."
   },
   {
    "q": "Why can calling cublasSgemm directly on row-major arrays give a wrong (transposed) result?",
    "options": [
     "cuBLAS only supports double",
     "cuBLAS needs pinned memory",
     "cuBLAS requires square matrices",
     "cuBLAS assumes column-major storage"
    ],
    "answer": 3,
    "why": "A row-major matrix read as column-major is its transpose. Swap the operands (compute Cᵀ = Bᵀ·Aᵀ) or pass transpose flags."
   }
  ]
 },
 "4.3": {
  "minutes": 50,
  "learn": "\n<p>A CUDA simulation produces data on the GPU, and OpenGL draws from the GPU. Copying results to the CPU and back every frame wastes two trips over the PCIe bus. <b>Graphics interop</b> lets a CUDA kernel write straight into an OpenGL buffer, so the data never leaves the GPU.</p>\n\n<h3>The lifecycle</h3>\n<ol>\n<li><b>Create</b> an OpenGL buffer object (VBO) the normal way.</li>\n<li><b>Register</b> it with CUDA once: <code>cudaGraphicsGLRegisterBuffer</code>.</li>\n<li>Each frame: <b>map</b> it, get a device pointer, launch the kernel, <b>unmap</b>.</li>\n<li>Draw with OpenGL as usual.</li>\n<li>At shutdown: <code>cudaGraphicsUnregisterResource</code>, then delete the buffer.</li>\n</ol>\n<pre><code>#include &lt;cuda_gl_interop.h&gt;\n\nGLuint vbo;\nglGenBuffers(1, &amp;vbo);\nglBindBuffer(GL_ARRAY_BUFFER, vbo);\nglBufferData(GL_ARRAY_BUFFER, W * H * sizeof(float4), nullptr, GL_DYNAMIC_DRAW);\n\ncudaGraphicsResource* res;\ncudaGraphicsGLRegisterBuffer(&amp;res, vbo, cudaGraphicsMapFlagsWriteDiscard);\n\n// every frame\nfloat4* d_pos; size_t bytes;\ncudaGraphicsMapResources(1, &amp;res, 0);\ncudaGraphicsResourceGetMappedPointer((void**)&amp;d_pos, &amp;bytes, res);\nwave&lt;&lt;&lt;grid, block&gt;&gt;&gt;(d_pos, W, H, t);\ncudaGraphicsUnmapResources(1, &amp;res, 0);\nglDrawArrays(GL_POINTS, 0, W * H);</code></pre>\n<p>While a resource is mapped, CUDA owns it and OpenGL must not use it. Unmapping hands it back and guarantees the kernel's writes are visible to the following GL commands in that stream order. <code>WriteDiscard</code> tells the driver CUDA will overwrite everything, so the old contents need not be preserved.</p>\n\n<h3>The wave kernel</h3>\n<p>Treat the buffer as a W×H grid of vertices. Each thread owns one vertex, converts its grid coordinates to the range [-1, 1], and computes a height:</p>\n<pre><code>__global__ void wave(float4* pos, int W, int H, float t) {\n    int x = blockIdx.x * blockDim.x + threadIdx.x;\n    int z = blockIdx.y * blockDim.y + threadIdx.y;\n    if (x &gt;= W || z &gt;= H) return;\n    float u = x / (float)(W - 1) * 2.0f - 1.0f;\n    float v = z / (float)(H - 1) * 2.0f - 1.0f;\n    float y = 0.5f * sinf(4.0f * u + t) * cosf(4.0f * v + t);\n    pos[z * W + x] = make_float4(u, y, v, 1.0f);\n}</code></pre>\n<p>The vertex layout (here x, y, z, w as a <code>float4</code>) must match what you tell OpenGL with <code>glVertexAttribPointer(0, 4, GL_FLOAT, GL_FALSE, 16, 0)</code>.</p>\n\n<h3>Requirements and pitfalls</h3>\n<ul>\n<li>The OpenGL context must be current on the thread that registers and maps, and the GPU running CUDA should be the one driving the display (on laptops with two GPUs, force the NVIDIA GPU).</li>\n<li>Register once, not every frame. Registration is expensive; map/unmap is cheap.</li>\n<li>Textures work too: <code>cudaGraphicsGLRegisterImage</code>, then <code>cudaGraphicsSubResourceGetMappedArray</code> gives a <code>cudaArray</code> you write via a surface object.</li>\n</ul>\n\n<h3>Measuring the win</h3>\n<p>The non-interop version does: kernel → <code>cudaMemcpy</code> to host → <code>glBufferSubData</code> back to GPU. For a 1024×1024 grid of <code>float4</code> that is 16 MiB per direction per frame. Measure frame time both ways: GPU time with <code>glQueryCounter</code>/CUDA events, and total frame time on the CPU with VSync <b>off</b>, otherwise both versions are capped at the monitor's refresh rate and look identical.</p>\n<blockquote>Common mistake: calling OpenGL draw commands while the buffer is still mapped. Always unmap before <code>glDrawArrays</code>.</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "cpp",
   "prompt": "<p>Simulate one frame of the wave kernel on the CPU. The vertex buffer is a flat array of W×H <code>Float4</code> in row-major order (index z·W + x).</p><ol><li>Write <code>wave_kernel(pos, W, H, t, x, z)</code>: the body one CUDA thread would run, including the bounds check. Use <code>u = x/(W−1)·2−1</code>, <code>v = z/(H−1)·2−1</code>, <code>y = 0.5·sin(4u + t)·cos(4v + t)</code>, and store (u, y, v, 1).</li><li>\"Launch\" it with 2×2 blocks over a 4×3 grid: loop over blocks and threads, computing x and z from the block and thread indices. Some threads fall outside and must do nothing.</li><li>Print the y values row by row with 3 decimals, then the bytes per frame a non-interop copy of a 1024×1024 grid would move in one direction, in MiB with 1 decimal.</li></ol><p>Expected output:</p><pre><code>0.070 0.162 -0.358 0.475\n-0.038 -0.088 0.195 -0.259\n-0.020 -0.046 0.103 -0.136\ncopy per frame: 16.0 MiB</code></pre>",
   "starter": "#include <cmath>\n#include <cstdio>\n#include <vector>\n\nstruct Float4 { double x, y, z, w; };\n\nvoid wave_kernel(std::vector<Float4>& pos, int W, int H, double t, int x, int z) {\n    // TODO: bounds check, compute u, v, y, store at pos[z * W + x]\n}\n\nint main() {\n    const int W = 4, H = 3, BX = 2, BZ = 2;\n    std::vector<Float4> pos(W * H);\n    int gx = (W + BX - 1) / BX, gz = (H + BZ - 1) / BZ;\n    for (int bz = 0; bz < gz; bz++)\n        for (int bx = 0; bx < gx; bx++)\n            for (int tz = 0; tz < BZ; tz++)\n                for (int tx = 0; tx < BX; tx++) {\n                    // TODO: compute x and z, call wave_kernel\n                }\n    for (int z = 0; z < H; z++) {\n        for (int x = 0; x < W; x++) printf(x ? \" %.3f\" : \"%.3f\", pos[z * W + x].y);\n        printf(\"\\n\");\n    }\n    double mib = 0;  // TODO: 1024 * 1024 vertices * 16 bytes, in MiB\n    printf(\"copy per frame: %.1f MiB\\n\", mib);\n}\n",
   "expected": "0.070 0.162 -0.358 0.475\n-0.038 -0.088 0.195 -0.259\n-0.020 -0.046 0.103 -0.136\ncopy per frame: 16.0 MiB",
   "solution": "#include <cmath>\n#include <cstdio>\n#include <vector>\n\nstruct Float4 { double x, y, z, w; };\n\nvoid wave_kernel(std::vector<Float4>& pos, int W, int H, double t, int x, int z) {\n    if (x >= W || z >= H) return;\n    double u = x / (double)(W - 1) * 2 - 1;\n    double v = z / (double)(H - 1) * 2 - 1;\n    double y = 0.5 * std::sin(4 * u + t) * std::cos(4 * v + t);\n    pos[z * W + x] = {u, y, v, 1.0};\n}\n\nint main() {\n    const int W = 4, H = 3, BX = 2, BZ = 2;\n    std::vector<Float4> pos(W * H);\n    int gx = (W + BX - 1) / BX, gz = (H + BZ - 1) / BZ;\n    for (int bz = 0; bz < gz; bz++)\n        for (int bx = 0; bx < gx; bx++)\n            for (int tz = 0; tz < BZ; tz++)\n                for (int tx = 0; tx < BX; tx++) {\n                    int x = bx * BX + tx, z = bz * BZ + tz;\n                    wave_kernel(pos, W, H, 1.0, x, z);\n                }\n    for (int z = 0; z < H; z++) {\n        for (int x = 0; x < W; x++) printf(x ? \" %.3f\" : \"%.3f\", pos[z * W + x].y);\n        printf(\"\\n\");\n    }\n    double mib = 1024.0 * 1024 * 16 / (1024 * 1024);\n    printf(\"copy per frame: %.1f MiB\\n\", mib);\n}\n",
   "hint": "x = bx * BX + tx and z = bz * BZ + tz. With H = 3 and 2-row blocks, the second block row has one row of threads past the end. 1 MiB = 1024 * 1024 bytes."
  },
  "quiz": [
   {
    "q": "What does interop save compared with cudaMemcpy to host plus glBufferSubData?",
    "options": [
     "Kernel compute time",
     "Two transfers over PCIe per frame, because the data stays on the GPU",
     "Shader compile time",
     "Nothing; the driver copies anyway"
    ],
    "answer": 1,
    "why": "CUDA writes into the same GPU memory OpenGL draws from, so the round trip through host memory disappears."
   },
   {
    "q": "Which call should happen only once, not every frame?",
    "options": [
     "cudaGraphicsMapResources",
     "The kernel launch",
     "cudaGraphicsGLRegisterBuffer",
     "cudaGraphicsUnmapResources"
    ],
    "answer": 2,
    "why": "Registration is expensive and done once after creating the buffer; map and unmap are the cheap per-frame steps."
   },
   {
    "q": "You measure frame time with and without interop and both show 16.7 ms. What is the most likely reason?",
    "options": [
     "VSync caps both at the 60 Hz refresh rate",
     "Interop never helps",
     "The kernel did not run",
     "The buffer is too small to register"
    ],
    "answer": 0,
    "why": "With VSync on, frames wait for the display. Turn it off, or time the GPU work directly, to see the difference."
   },
   {
    "q": "The image is garbage and CUDA reports errors when OpenGL draws. What is a likely cause?",
    "options": [
     "Using float4 instead of float3",
     "Too many threads per block",
     "W is not a power of two",
     "Drawing while the resource is still mapped by CUDA"
    ],
    "answer": 3,
    "why": "A mapped resource belongs to CUDA. Unmap before any OpenGL command touches the buffer."
   }
  ]
 }
});
