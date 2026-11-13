// Phase 10 lesson content. Generated; verified practice solutions.
Object.assign(LESSONS,{
 "10.0": {
  "minutes": 45,
  "learn": "\n<p>An inference service is a program waiting on a network port. When requests are slow, time out or never arrive, the cause is often the network, not the model. This lesson covers just enough networking to run and debug your own services.</p>\n\n<h3>The layers you actually touch</h3>\n<ul>\n<li><b>IP</b> moves packets between machines, addressed by IP address (e.g. <code>10.0.0.5</code>). It gives no guarantee of delivery or order.</li>\n<li><b>TCP</b> sits on top: a reliable, ordered byte stream between two <b>ports</b>. It retransmits lost data and slows down when the network is congested.</li>\n<li><b>UDP</b> is the alternative: single datagrams, no connection, no retransmit. DNS queries and video calls use it.</li>\n<li><b>HTTP</b> is a text protocol carried over TCP (HTTP/1.1 and HTTP/2) or over QUIC on UDP (HTTP/3). Your FastAPI server speaks HTTP.</li>\n</ul>\n<p>A connection is identified by four numbers: source IP, source port, destination IP, destination port. Ports below 1024 are privileged on Linux; a server usually listens on something like 8000, and the client gets a random high port.</p>\n\n<h3>The TCP three-way handshake</h3>\n<ol>\n<li>Client sends <b>SYN</b> with its initial sequence number.</li>\n<li>Server replies <b>SYN-ACK</b>: its own sequence number plus an acknowledgement of the client's.</li>\n<li>Client sends <b>ACK</b>. The connection is open and data can flow.</li>\n</ol>\n<p>This costs one round trip before the first byte of the request. That is why clients keep connections open and reuse them (HTTP keep-alive, connection pools) instead of opening a new one per request. Closing uses FIN packets from both sides.</p>\n\n<h3>Subnets and CIDR</h3>\n<p>An IPv4 address is 32 bits. CIDR notation <code>192.168.10.77/26</code> means the first 26 bits are the <b>network</b> part and the last 6 bits are the <b>host</b> part. The mask is 26 ones followed by 6 zeros: <code>255.255.255.192</code>.</p>\n<pre><code>network   = ip &amp; mask             # host bits set to 0  -&gt; 192.168.10.64\nbroadcast = network | ~mask       # host bits set to 1  -&gt; 192.168.10.127\nusable    = 2**(32 - prefix) - 2  # minus network and broadcast -&gt; 62</code></pre>\n<p>Two machines are on the same subnet when <code>ip1 &amp; mask == ip2 &amp; mask</code>; only then can they talk without a router. Private ranges you will see in clusters and Docker: <code>10.0.0.0/8</code>, <code>172.16.0.0/12</code>, <code>192.168.0.0/16</code>. <code>127.0.0.1</code> is loopback: this machine only.</p>\n\n<h3>DNS</h3>\n<p>DNS turns names into addresses. <code>dig api.example.com</code> or <code>nslookup</code> shows the answer. An <b>A</b> record maps to an IPv4 address, <b>AAAA</b> to IPv6, <b>CNAME</b> to another name. Answers are cached for their TTL, so a changed record can take a while to reach everyone.</p>\n\n<h3>A TCP echo server in Python</h3>\n<pre><code>import socket\nsrv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\nsrv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)\nsrv.bind((\"127.0.0.1\", 9000))\nsrv.listen()\nwhile True:\n    conn, addr = srv.accept()        # blocks until a client connects\n    with conn:\n        while data := conn.recv(1024):\n            conn.sendall(data)       # echo back\n\n# client\nc = socket.create_connection((\"127.0.0.1\", 9000))\nc.sendall(b\"hello\"); print(c.recv(1024))</code></pre>\n<p>Binding to <code>127.0.0.1</code> accepts only local clients; <code>0.0.0.0</code> accepts from any interface. This difference is the classic reason a server inside a container cannot be reached.</p>\n\n<h3>Looking at HTTP</h3>\n<pre><code>curl -v http://localhost:8000/health</code></pre>\n<p><code>-v</code> prints the connection, the request line and headers (<code>&gt;</code>) and the response status and headers (<code>&lt;</code>). Wireshark with the filter <code>tcp.port == 8000</code> shows the SYN, SYN-ACK, ACK and then the HTTP bytes.</p>\n<blockquote>Common mistake: the server listens on 127.0.0.1 inside Docker. The port mapping works, but the server refuses outside traffic. Listen on 0.0.0.0.</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "python",
   "prompt": "<p>Write a subnet calculator with bit operations (do not use the <code>ipaddress</code> module). For <code>192.168.10.77/26</code> print the mask, network, broadcast and usable host range, then check whether two addresses are inside <code>10.0.5.20/22</code>. Expected output:</p><pre><code>mask=255.255.255.192\nnetwork=192.168.10.64\nbroadcast=192.168.10.127\nhosts=192.168.10.65-192.168.10.126 (62 usable)\n10.0.6.1 in 10.0.5.20/22: True\n10.0.8.1 in 10.0.5.20/22: False</code></pre>",
   "starter": "def ip_to_int(s):\n    # '1.2.3.4' -> 32-bit integer\n    pass\n\ndef int_to_ip(n):\n    # 32-bit integer -> '1.2.3.4'\n    pass\n\ndef mask_of(prefix):\n    # prefix ones followed by (32 - prefix) zeros\n    pass\n\ndef same_subnet(cidr, ip):\n    # TODO\n    pass\n\nip, prefix = '192.168.10.77/26'.split('/')\nprefix = int(prefix)\n# TODO: compute mask, network, broadcast, first and last host\n\nfor other in ['10.0.6.1', '10.0.8.1']:\n    print(f'{other} in 10.0.5.20/22: {same_subnet(\"10.0.5.20/22\", other)}')\n",
   "expected": "mask=255.255.255.192\nnetwork=192.168.10.64\nbroadcast=192.168.10.127\nhosts=192.168.10.65-192.168.10.126 (62 usable)\n10.0.6.1 in 10.0.5.20/22: True\n10.0.8.1 in 10.0.5.20/22: False",
   "solution": "def ip_to_int(s):\n    a, b, c, d = (int(x) for x in s.split('.'))\n    return (a << 24) | (b << 16) | (c << 8) | d\n\ndef int_to_ip(n):\n    return '.'.join(str((n >> sh) & 255) for sh in (24, 16, 8, 0))\n\ndef mask_of(prefix):\n    return (0xFFFFFFFF << (32 - prefix)) & 0xFFFFFFFF\n\ndef same_subnet(cidr, ip):\n    base, p = cidr.split('/')\n    m = mask_of(int(p))\n    return ip_to_int(base) & m == ip_to_int(ip) & m\n\nip, prefix = '192.168.10.77/26'.split('/')\nprefix = int(prefix)\nm = mask_of(prefix)\nnet = ip_to_int(ip) & m\nbcast = net | (~m & 0xFFFFFFFF)\nprint(f'mask={int_to_ip(m)}')\nprint(f'network={int_to_ip(net)}')\nprint(f'broadcast={int_to_ip(bcast)}')\nprint(f'hosts={int_to_ip(net + 1)}-{int_to_ip(bcast - 1)} ({2 ** (32 - prefix) - 2} usable)')\n\nfor other in ['10.0.6.1', '10.0.8.1']:\n    print(f'{other} in 10.0.5.20/22: {same_subnet(\"10.0.5.20/22\", other)}')\n",
   "hint": "Python ints are unbounded, so mask with & 0xFFFFFFFF after shifting or using ~ to keep 32 bits."
  },
  "quiz": [
   {
    "q": "Why do HTTP clients reuse connections instead of opening one per request?",
    "options": [
     "TCP only allows one connection per port",
     "Reused connections are encrypted automatically",
     "Each new TCP connection costs a handshake round trip before any data is sent",
     "Servers reject a second connection from the same IP"
    ],
    "answer": 2,
    "why": "SYN, SYN-ACK, ACK takes a full round trip (plus TLS setup if used). Keep-alive pays it once."
   },
   {
    "q": "How many usable host addresses does a /28 subnet have?",
    "options": [
     "16",
     "28",
     "30",
     "14"
    ],
    "answer": 3,
    "why": "32 − 28 = 4 host bits gives 16 addresses, minus network and broadcast = 14."
   },
   {
    "q": "Your FastAPI app in a container works with curl inside the container but not from the host, even with -p 8000:8000. Most likely cause?",
    "options": [
     "The server is bound to 127.0.0.1 instead of 0.0.0.0",
     "DNS TTL has not expired",
     "UDP is blocked",
     "The subnet mask is wrong"
    ],
    "answer": 0,
    "why": "Loopback inside the container is only reachable from inside it. Bind to 0.0.0.0 so the mapped port reaches the server."
   },
   {
    "q": "Which statement about UDP is correct?",
    "options": [
     "It retransmits lost packets like TCP",
     "It sends independent datagrams with no delivery guarantee",
     "It needs a three-way handshake",
     "It cannot carry DNS queries"
    ],
    "answer": 1,
    "why": "UDP has no connection and no retransmission; reliability, if needed, is up to the application (as QUIC does)."
   }
  ]
 },
 "10.1": {
  "minutes": 55,
  "learn": "\n<p>A model is only useful to others once it sits behind an API that is easy to call, easy to deploy and easy to observe. The standard Python stack is <b>FastAPI</b> for the HTTP layer, <b>Docker</b> for packaging, and <b>Prometheus</b>-style metrics for visibility.</p>\n\n<h3>A FastAPI endpoint with streaming</h3>\n<p>LLM users want tokens as they are produced, not after the whole answer. <code>StreamingResponse</code> sends chunks from a generator as soon as each one is yielded.</p>\n<pre><code>import asyncio\nfrom fastapi import FastAPI\nfrom fastapi.responses import StreamingResponse\nfrom pydantic import BaseModel\n\napp = FastAPI()\n\nclass GenRequest(BaseModel):\n    prompt: str\n    max_tokens: int = 64\n\nasync def generate(prompt: str, max_tokens: int):\n    for i in range(max_tokens):\n        await asyncio.sleep(0.02)        # stand-in for one decode step\n        yield f\"tok{i} \"\n\n@app.get(\"/health\")\ndef health():\n    return {\"ok\": True}\n\n@app.post(\"/generate\")\nasync def gen(req: GenRequest):\n    return StreamingResponse(generate(req.prompt, req.max_tokens),\n                             media_type=\"text/plain\")</code></pre>\n<p>Run it with <code>uvicorn app:app --host 0.0.0.0 --port 8000</code> and test with <code>curl -N -X POST localhost:8000/generate -H \"Content-Type: application/json\" -d '{\"prompt\":\"hi\"}'</code> (<code>-N</code> disables curl's buffering so you see tokens arrive). Pydantic validates the JSON body and returns a 422 error for bad input automatically.</p>\n<p>Inside an <code>async def</code> handler, never call slow blocking code (a synchronous model forward pass, <code>time.sleep</code>): it freezes the event loop and every other request waits. Run blocking work in a thread pool or a separate worker process.</p>\n\n<h3>Containerising with GPU access</h3>\n<pre><code>FROM nvidia/cuda:12.4.1-runtime-ubuntu22.04\nRUN apt-get update &amp;&amp; apt-get install -y python3 python3-pip \\\n    &amp;&amp; rm -rf /var/lib/apt/lists/*\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip3 install --no-cache-dir -r requirements.txt\nCOPY . .\nEXPOSE 8000\nCMD [\"python3\", \"-m\", \"uvicorn\", \"app:app\", \"--host\", \"0.0.0.0\", \"--port\", \"8000\"]</code></pre>\n<pre><code>docker build -t llm-api .\ndocker run --gpus all -p 8000:8000 llm-api</code></pre>\n<p>Copy <code>requirements.txt</code> and install before copying the rest of the code: Docker caches each layer, so editing your code does not reinstall every package. <code>--gpus all</code> requires the NVIDIA Container Toolkit on the host; the host driver must support the CUDA version in the image.</p>\n\n<h3>Batching and queues</h3>\n<p>A GPU processes a batch of 8 requests in not much more time than 1, so servers collect requests briefly and run them together. The classic policy: start a batch when it is <b>full</b> or when the oldest request has waited a <b>maximum time</b>. A bigger batch raises throughput; a longer wait raises latency. Engines like vLLM go further with continuous batching, adding new sequences between decode steps.</p>\n\n<h3>Load testing</h3>\n<pre><code>import asyncio, time, httpx\n\nasync def one(client):\n    t = time.perf_counter()\n    r = await client.post(\"http://localhost:8000/generate\", json={\"prompt\": \"hi\"})\n    return time.perf_counter() - t, r.status_code\n\nasync def main(n=50):\n    async with httpx.AsyncClient(timeout=60) as client:\n        results = await asyncio.gather(*(one(client) for _ in range(n)))\n    lat = sorted(x for x, _ in results)\n    print(\"p50\", lat[n // 2], \"p95\", lat[int(0.95 * n) - 1])\n\nasyncio.run(main())</code></pre>\n\n<h3>Metrics</h3>\n<pre><code>from prometheus_client import Counter, Histogram, Gauge, make_asgi_app\nREQS = Counter(\"requests_total\", \"Requests\", [\"status\"])\nLAT = Histogram(\"request_latency_seconds\", \"Latency\")\nQUEUE = Gauge(\"queue_depth\", \"Requests waiting\")\napp.mount(\"/metrics\", make_asgi_app())</code></pre>\n<p>A <b>counter</b> only goes up (requests, errors), a <b>gauge</b> goes up and down (queue depth, GPU memory), a <b>histogram</b> counts observations into buckets so Prometheus can compute percentiles. Watch p95/p99 latency, not the average: averages hide the slow tail that users actually complain about.</p>\n<blockquote>Common mistake: load-testing with requests sent one after another. That measures single-request latency, not behaviour under concurrency. Send them concurrently.</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "python",
   "prompt": "<p>Simulate a batching server on one GPU, in whole milliseconds. Each tick <code>t</code> from 0 to 299: add requests that arrive at <code>t</code> to the queue, record the queue depth, then, if the GPU is free (<code>t &gt;= busy_until</code>) and the queue is non-empty and either it holds at least <code>MAX_BATCH</code> requests or the oldest one has waited at least <code>MAX_WAIT</code> ms, take up to <code>MAX_BATCH</code> requests from the front. A batch of n takes <code>20 + 5*n</code> ms; each request's latency is finish time minus its arrival time.</p><p>Print each batch, then the mean latency (1 decimal), the max latency and the max queue depth. Expected output:</p><pre><code>batch t=5 size=4 done=45\nbatch t=45 size=2 done=75\nbatch t=75 size=4 done=115\nbatch t=115 size=2 done=145\nmean_latency_ms=52.8\nmax_latency_ms=81\nmax_queue_depth=6</code></pre>",
   "starter": "ARRIVALS = [0, 2, 3, 5, 30, 31, 60, 61, 62, 63, 64, 65]\nMAX_BATCH, MAX_WAIT = 4, 10\n\nqueue = []          # arrival times of waiting requests\nbusy_until = 0\nlatencies = []\nmax_depth = 0\nfor t in range(300):\n    # TODO: enqueue arrivals at t, track max depth\n    # TODO: start a batch if the GPU is free and the batch rule says so\n    pass\n\nprint(f'mean_latency_ms={sum(latencies) / len(latencies):.1f}')\nprint(f'max_latency_ms={max(latencies)}')\nprint(f'max_queue_depth={max_depth}')\n",
   "expected": "batch t=5 size=4 done=45\nbatch t=45 size=2 done=75\nbatch t=75 size=4 done=115\nbatch t=115 size=2 done=145\nmean_latency_ms=52.8\nmax_latency_ms=81\nmax_queue_depth=6",
   "solution": "ARRIVALS = [0, 2, 3, 5, 30, 31, 60, 61, 62, 63, 64, 65]\nMAX_BATCH, MAX_WAIT = 4, 10\n\nqueue = []\nbusy_until = 0\nlatencies = []\nmax_depth = 0\nfor t in range(300):\n    queue += [a for a in ARRIVALS if a == t]\n    max_depth = max(max_depth, len(queue))\n    if t >= busy_until and queue and (len(queue) >= MAX_BATCH or t - queue[0] >= MAX_WAIT):\n        batch, queue = queue[:MAX_BATCH], queue[MAX_BATCH:]\n        done = t + 20 + 5 * len(batch)\n        busy_until = done\n        latencies += [done - a for a in batch]\n        print(f'batch t={t} size={len(batch)} done={done}')\n\nprint(f'mean_latency_ms={sum(latencies) / len(latencies):.1f}')\nprint(f'max_latency_ms={max(latencies)}')\nprint(f'max_queue_depth={max_depth}')\n",
   "hint": "Use slicing: batch, queue = queue[:MAX_BATCH], queue[MAX_BATCH:]. Set busy_until to the batch's finish time."
  },
  "quiz": [
   {
    "q": "Inside an async FastAPI handler you call a synchronous model.forward() that takes 2 s. What happens under load?",
    "options": [
     "FastAPI runs it on the GPU in parallel automatically",
     "Only streaming responses are affected",
     "Pydantic rejects the request",
     "The event loop is blocked, so all other requests wait behind it"
    ],
    "answer": 3,
    "why": "async handlers share one event loop; blocking code stops it. Use a thread pool or a separate worker."
   },
   {
    "q": "Why copy requirements.txt and run pip install before COPY . . in a Dockerfile?",
    "options": [
     "So the dependency layer stays cached when only code changes",
     "Docker requires that order",
     "It makes the image smaller at runtime",
     "It enables GPU support"
    ],
    "answer": 0,
    "why": "Layers are cached until their inputs change; code edits then skip the slow install step."
   },
   {
    "q": "Which metric type fits queue depth?",
    "options": [
     "Counter",
     "Gauge",
     "Histogram",
     "Summary of errors"
    ],
    "answer": 1,
    "why": "Queue depth goes up and down; counters only increase."
   },
   {
    "q": "Raising MAX_WAIT in a batching server usually...",
    "options": [
     "lowers both latency and throughput",
     "has no effect on latency",
     "raises throughput and raises latency for lightly loaded traffic",
     "makes batches smaller"
    ],
    "answer": 2,
    "why": "Waiting longer fills bigger batches (more throughput) but each request may sit longer before starting."
   }
  ]
 },
 "10.2": {
  "minutes": 55,
  "learn": "\n<p>One GPU worker is a single point of failure and a hard throughput ceiling. Production serving puts a <b>router</b> in front of several workers. The router decides, per request, which worker gets it, and refuses to send traffic to anything that has not proven it works.</p>\n\n<h3>Routing policies</h3>\n<ul>\n<li><b>Round-robin</b>: worker 0, 1, 2, 0, 1, 2... Simple and fair in request count, but blind. If some requests are long (a 2,000-token generation vs a 20-token one), one worker can pile up a backlog while another is idle.</li>\n<li><b>Least-queue</b> (least outstanding requests): send to the worker with the fewest requests currently in flight. It reacts to real load and usually cuts tail latency when request sizes vary.</li>\n<li><b>Weighted</b> or <b>cache-aware</b> routing: send more to bigger GPUs, or send requests sharing a prompt prefix to the worker that already has that prefix in its KV cache.</li>\n</ul>\n<pre><code>def pick(workers, policy, i):\n    if policy == \"round_robin\":\n        return workers[i % len(workers)]\n    healthy = [w for w in workers if w.healthy]\n    return min(healthy, key=lambda w: w.in_flight)</code></pre>\n\n<h3>Measuring: p95, not the mean</h3>\n<p>Sort the latencies. The p95 (nearest-rank method) is the value at position <code>ceil(0.95 * n)</code> counting from 1. It tells you what the slowest 5% of users experience. Two routers can have similar mean latency while one has a far worse p95.</p>\n\n<h3>Qualification before serving</h3>\n<p>A new combination of model weights, GPU type, driver and engine version can fail in quiet ways: wrong outputs from a bad quantisation, an out-of-memory crash at long context, half the expected throughput. A <b>qualification test</b> runs before a worker joins the pool:</p>\n<ol>\n<li>Load the model; check it fits with the target batch size and context length.</li>\n<li>Run a fixed set of golden prompts with greedy decoding; compare outputs or scores against stored references.</li>\n<li>Run a short load test; require throughput and p95 latency within limits.</li>\n<li>Only then mark the worker healthy and register it with the router.</li>\n</ol>\n\n<h3>Fallback and rollback</h3>\n<p>Keep the last <b>known-good config</b> (model version, engine version, flags) as data, not as memory in someone's head. When a new config fails qualification, or its live error rate crosses a threshold, the router drains it (stops sending new requests, lets in-flight ones finish) and restarts the worker with the known-good config.</p>\n<pre><code>try:\n    worker.start(new_cfg)\n    qualify(worker)              # raises on failure\nexcept QualificationError:\n    worker.start(known_good_cfg) # automatic rollback\n    alert(\"new config rejected\")</code></pre>\n<p>Roll out gradually (canary): give the new config 5% of traffic first, compare its error rate and latency with the old one, then increase.</p>\n\n<h3>Cost per 1K requests</h3>\n<p>You pay for GPU time whether it is busy or idle:</p>\n<pre><code>cost_per_1k = gpus * price_per_gpu_hour * hours / requests * 1000</code></pre>\n<p>For example, 2 GPUs at $2.50/hour serving 36,000 requests in one hour cost 2 × 2.50 / 36,000 × 1000 ≈ $0.14 per 1K requests. A better router that finishes the same work sooner lets you serve more requests on the same hardware, which lowers this number directly.</p>\n<blockquote>Common mistake: routing on health checks that only return \"process is alive\". A worker can be alive and still return garbage or be out of memory. Health must include real inference.</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "python",
   "prompt": "<p>Two identical workers each process one request at a time (FIFO). A request assigned at arrival time <code>t</code> with service time <code>s</code> starts at <code>max(t, worker's last finish)</code>. Compare two policies over the fixed trace (times in ms):</p><ul><li><b>rr</b>: request i goes to worker <code>i % 2</code>.</li><li><b>lq</b>: go to the worker with the fewest unfinished requests at time t (finish time &gt; t); ties go to worker 0.</li></ul><p>For each policy print p95 latency (nearest-rank), the makespan (last finish time) and the cost per 1K requests, assuming the trace repeats so both GPUs are billed for the makespan at $2.50 per GPU-hour (4 decimals). Expected output:</p><pre><code>rr: p95=190ms makespan=280ms cost_per_1k=$0.0194\nlq: p95=120ms makespan=200ms cost_per_1k=$0.0139</code></pre>",
   "starter": "import math\nTRACE = [(0, 40), (5, 10), (10, 40), (15, 10), (20, 40), (25, 10), (30, 40), (35, 10),\n         (40, 10), (45, 10), (50, 10), (55, 10), (60, 40), (65, 10), (70, 40), (75, 10),\n         (80, 10), (85, 10), (90, 10), (95, 10)]\nPRICE = 2.50   # per GPU-hour\n\ndef simulate(policy):\n    finishes = [[], []]   # finish times per worker\n    lat = []\n    # TODO: assign each request, compute its finish and latency\n    return lat, 0\n\ndef p95(xs):\n    # nearest-rank: sorted value at position ceil(0.95 * n), 1-based\n    pass\n\nfor policy in ['rr', 'lq']:\n    lat, makespan = simulate(policy)\n    cost = 0  # TODO\n    print(f'{policy}: p95={p95(lat)}ms makespan={makespan}ms cost_per_1k=${cost:.4f}')\n",
   "expected": "rr: p95=190ms makespan=280ms cost_per_1k=$0.0194\nlq: p95=120ms makespan=200ms cost_per_1k=$0.0139",
   "solution": "import math\nTRACE = [(0, 40), (5, 10), (10, 40), (15, 10), (20, 40), (25, 10), (30, 40), (35, 10),\n         (40, 10), (45, 10), (50, 10), (55, 10), (60, 40), (65, 10), (70, 40), (75, 10),\n         (80, 10), (85, 10), (90, 10), (95, 10)]\nPRICE = 2.50\n\ndef simulate(policy):\n    finishes = [[], []]\n    lat = []\n    for i, (t, s) in enumerate(TRACE):\n        if policy == 'rr':\n            w = i % 2\n        else:\n            q = [sum(1 for f in fs if f > t) for fs in finishes]\n            w = q.index(min(q))\n        start = max(t, finishes[w][-1] if finishes[w] else 0)\n        finishes[w].append(start + s)\n        lat.append(start + s - t)\n    return lat, max(f for fs in finishes for f in fs)\n\ndef p95(xs):\n    return sorted(xs)[math.ceil(0.95 * len(xs)) - 1]\n\nfor policy in ['rr', 'lq']:\n    lat, makespan = simulate(policy)\n    hours = makespan / 3_600_000\n    cost = 2 * PRICE * hours / len(TRACE) * 1000\n    print(f'{policy}: p95={p95(lat)}ms makespan={makespan}ms cost_per_1k=${cost:.4f}')\n",
   "hint": "Queue length of a worker at time t is the number of its finish times greater than t. Convert ms to hours by dividing by 3,600,000."
  },
  "quiz": [
   {
    "q": "Request lengths vary a lot. Why does round-robin hurt p95 latency?",
    "options": [
     "It ignores current load, so long requests can stack up on one worker while another idles",
     "It sends more requests to faster GPUs",
     "It drops requests when a worker is busy",
     "It needs more GPUs"
    ],
    "answer": 0,
    "why": "Round-robin balances request counts, not work. Least-queue reacts to what each worker actually has in flight."
   },
   {
    "q": "A new engine version passes the 'process alive' health check but returns wrong answers. What would have caught it?",
    "options": [
     "A larger batch size",
     "A qualification test with golden prompts compared to references",
     "Round-robin routing",
     "Lowering the GPU price"
    ],
    "answer": 1,
    "why": "Qualification checks correctness and performance with real inference before the worker gets traffic."
   },
   {
    "q": "2 GPUs at $3/hour serve 60,000 requests per hour. Cost per 1K requests?",
    "options": [
     "$0.05",
     "$0.20",
     "$0.10",
     "$6.00"
    ],
    "answer": 2,
    "why": "2 × 3 = $6/hour; $6 / 60,000 × 1000 = $0.10."
   },
   {
    "q": "What does draining a worker mean?",
    "options": [
     "Killing it immediately",
     "Clearing its KV cache",
     "Moving its weights to CPU",
     "Stopping new requests to it while in-flight ones finish"
    ],
    "answer": 3,
    "why": "Draining avoids failing requests that are already running during a rollback or restart."
   }
  ]
 }
});
