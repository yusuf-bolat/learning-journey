// Phase 11 lesson content. Generated; verified practice solutions.
Object.assign(LESSONS,{
 "11.0": {
  "minutes": 55,
  "learn": "\n<p>An <b>agent</b> is a loop: send the conversation to a model, and if the model asks to use a tool, run the tool, append the result, and call the model again. Build this loop by hand once. Every agent framework is a wrapper around it.</p>\n\n<h3>One API call</h3>\n<p>Chat APIs are <b>stateless</b>: each call sends the whole conversation as a list of messages with roles <code>user</code> and <code>assistant</code>. The example uses the Anthropic Python SDK; other providers have the same shape with different field names.</p>\n<pre><code>import anthropic\nclient = anthropic.Anthropic()        # reads ANTHROPIC_API_KEY from the environment\nMODEL = \"...\"                         # pick a current model id from the provider docs\n\nresp = client.messages.create(\n    model=MODEL, max_tokens=512,\n    messages=[{\"role\": \"user\", \"content\": \"Explain KV caching in one paragraph.\"}])\nprint(resp.content[0].text)\nprint(resp.usage.input_tokens, resp.usage.output_tokens)</code></pre>\n\n<h3>Streaming</h3>\n<pre><code>with client.messages.stream(model=MODEL, max_tokens=512,\n        messages=[{\"role\": \"user\", \"content\": \"Write a haiku about GPUs.\"}]) as stream:\n    for text in stream.text_stream:\n        print(text, end=\"\", flush=True)</code></pre>\n<p>Under the hood this is server-sent events over one HTTP response: the same idea as the FastAPI <code>StreamingResponse</code> from the serving phase.</p>\n\n<h3>Tools and the loop</h3>\n<p>You describe each tool with a name, a description and a JSON Schema for its input. The model never runs anything itself: it returns a <code>tool_use</code> block and stops with <code>stop_reason == \"tool_use\"</code>. Your code runs the tool and sends back a <code>tool_result</code> with the matching id.</p>\n<pre><code>tools = [{\n    \"name\": \"calculator\",\n    \"description\": \"Evaluate an arithmetic expression such as 12*7+3\",\n    \"input_schema\": {\"type\": \"object\",\n                     \"properties\": {\"expr\": {\"type\": \"string\"}},\n                     \"required\": [\"expr\"]},\n}]\nmessages = [{\"role\": \"user\", \"content\": \"What is 12*7+3?\"}]\nfor step in range(10):                          # always cap the steps\n    resp = client.messages.create(model=MODEL, max_tokens=1024,\n                                  tools=tools, messages=messages)\n    messages.append({\"role\": \"assistant\", \"content\": resp.content})\n    if resp.stop_reason != \"tool_use\":\n        break\n    results = []\n    for block in resp.content:\n        if block.type == \"tool_use\":\n            out = run_tool(block.name, block.input)\n            results.append({\"type\": \"tool_result\",\n                            \"tool_use_id\": block.id, \"content\": out})\n    messages.append({\"role\": \"user\", \"content\": results})\nprint(\"\".join(b.text for b in resp.content if b.type == \"text\"))</code></pre>\n\n<h3>Tools are an attack surface</h3>\n<p>Treat tool inputs as untrusted: the model may be confused, or a document it read may contain injected instructions. For file tools, resolve the path and check it stays inside a workspace folder:</p>\n<pre><code>import posixpath\ndef safe_path(p, root=\"workspace\"):\n    full = posixpath.normpath(posixpath.join(root, p))\n    if full != root and not full.startswith(root + \"/\"):\n        raise ValueError(\"path escapes workspace\")\n    return full</code></pre>\n<p><code>normpath</code> collapses <code>..</code>, and joining an absolute path like <code>/etc/passwd</code> discards the root, so both fail the check. On a real file system also resolve symlinks (<code>os.path.realpath</code>). Never pass model output to <code>eval</code> or a shell without a strict allow-list.</p>\n<p>Return errors to the model as tool results instead of crashing. Models often recover when told what went wrong.</p>\n\n<h3>Tokens and cost</h3>\n<p>Because the full history is resent every call, input tokens grow with each step of the loop. Cost per task is the sum over all calls:</p>\n<pre><code>cost = sum(in_tok) / 1e6 * price_in + sum(out_tok) / 1e6 * price_out</code></pre>\n<p>Log both counts per call. A 10-step agent can easily use ten times the input tokens of a single question.</p>\n<blockquote>Common mistake: forgetting to append the assistant's tool_use message before the tool_result. The API requires each tool_result to answer a tool_use from the previous assistant turn.</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "python",
   "prompt": "<p>The starter contains a scripted fake model (no network). Write the agent loop: call <code>fake_model(messages)</code>, append its reply as an assistant message, and for each <code>tool_use</code> block run the tool, print a log line and send a <code>tool_result</code>. Stop at <code>end_turn</code> or after 10 steps. Tools:</p><ul><li><code>calculator</code>: evaluate <code>expr</code> only if every character is in <code>0123456789+-*/(). </code>.</li><li><code>read_file</code>: reject paths that leave <code>workspace</code> with <code>ERROR: path escapes workspace</code>; otherwise return <code>FILES[path]</code>.</li></ul><p>Sum the usage (input, output) of every call and print the cost with 6 decimals. Expected output:</p><pre><code>tool calculator {'expr': '12*7+3'} -&gt; 87\ntool read_file {'path': '../secrets.txt'} -&gt; ERROR: path escapes workspace\ntool read_file {'path': '/etc/passwd'} -&gt; ERROR: path escapes workspace\ntool read_file {'path': 'notes/todo.txt'} -&gt; buy more GPUs\nfinal: 12*7+3 = 87. Your todo says: buy more GPUs.\ncalls=5 in=1140 out=118 cost=$0.005190</code></pre>",
   "starter": "SCRIPT = [\n    {\"stop_reason\": \"tool_use\", \"usage\": (120, 25),\n     \"content\": [{\"type\": \"tool_use\", \"id\": \"t1\", \"name\": \"calculator\", \"input\": {\"expr\": \"12*7+3\"}}]},\n    {\"stop_reason\": \"tool_use\", \"usage\": (180, 22),\n     \"content\": [{\"type\": \"tool_use\", \"id\": \"t2\", \"name\": \"read_file\", \"input\": {\"path\": \"../secrets.txt\"}}]},\n    {\"stop_reason\": \"tool_use\", \"usage\": (230, 20),\n     \"content\": [{\"type\": \"tool_use\", \"id\": \"t3\", \"name\": \"read_file\", \"input\": {\"path\": \"/etc/passwd\"}}]},\n    {\"stop_reason\": \"tool_use\", \"usage\": (280, 21),\n     \"content\": [{\"type\": \"tool_use\", \"id\": \"t4\", \"name\": \"read_file\", \"input\": {\"path\": \"notes/todo.txt\"}}]},\n    {\"stop_reason\": \"end_turn\", \"usage\": (330, 30),\n     \"content\": [{\"type\": \"text\", \"text\": \"12*7+3 = 87. Your todo says: buy more GPUs.\"}]},\n]\nFILES = {\"workspace/notes/todo.txt\": \"buy more GPUs\"}   # fake file system\n\ndef fake_model(messages):\n    # scripted \"LLM\": the reply depends only on how many assistant turns exist\n    turn = sum(1 for m in messages if m[\"role\"] == \"assistant\")\n    return SCRIPT[turn]\n\nPRICE_IN, PRICE_OUT = 3.00, 15.00   # example $ per million tokens\n\nimport posixpath\n\ndef safe_path(p, root=\"workspace\"):\n    # TODO: normpath(join(root, p)) must stay inside root\n    pass\n\ndef run_tool(name, args):\n    # TODO: calculator and read_file; return a string, errors as \"ERROR: ...\"\n    pass\n\nmessages = [{\"role\": \"user\", \"content\": \"Compute 12*7+3 and read my todo.\"}]\ntok_in = tok_out = calls = 0\nfor step in range(10):\n    resp = fake_model(messages)\n    # TODO: count usage, append assistant message, stop on end_turn,\n    #       otherwise run tools, print log lines, append tool_results\n    break\n\nprint(f\"calls={calls} in={tok_in} out={tok_out} cost=${0:.6f}\")\n",
   "expected": "tool calculator {'expr': '12*7+3'} -> 87\ntool read_file {'path': '../secrets.txt'} -> ERROR: path escapes workspace\ntool read_file {'path': '/etc/passwd'} -> ERROR: path escapes workspace\ntool read_file {'path': 'notes/todo.txt'} -> buy more GPUs\nfinal: 12*7+3 = 87. Your todo says: buy more GPUs.\ncalls=5 in=1140 out=118 cost=$0.005190",
   "solution": "SCRIPT = [\n    {\"stop_reason\": \"tool_use\", \"usage\": (120, 25),\n     \"content\": [{\"type\": \"tool_use\", \"id\": \"t1\", \"name\": \"calculator\", \"input\": {\"expr\": \"12*7+3\"}}]},\n    {\"stop_reason\": \"tool_use\", \"usage\": (180, 22),\n     \"content\": [{\"type\": \"tool_use\", \"id\": \"t2\", \"name\": \"read_file\", \"input\": {\"path\": \"../secrets.txt\"}}]},\n    {\"stop_reason\": \"tool_use\", \"usage\": (230, 20),\n     \"content\": [{\"type\": \"tool_use\", \"id\": \"t3\", \"name\": \"read_file\", \"input\": {\"path\": \"/etc/passwd\"}}]},\n    {\"stop_reason\": \"tool_use\", \"usage\": (280, 21),\n     \"content\": [{\"type\": \"tool_use\", \"id\": \"t4\", \"name\": \"read_file\", \"input\": {\"path\": \"notes/todo.txt\"}}]},\n    {\"stop_reason\": \"end_turn\", \"usage\": (330, 30),\n     \"content\": [{\"type\": \"text\", \"text\": \"12*7+3 = 87. Your todo says: buy more GPUs.\"}]},\n]\nFILES = {\"workspace/notes/todo.txt\": \"buy more GPUs\"}   # fake file system\n\ndef fake_model(messages):\n    # scripted \"LLM\": the reply depends only on how many assistant turns exist\n    turn = sum(1 for m in messages if m[\"role\"] == \"assistant\")\n    return SCRIPT[turn]\n\nPRICE_IN, PRICE_OUT = 3.00, 15.00   # example $ per million tokens\n\nimport posixpath\n\ndef safe_path(p, root=\"workspace\"):\n    full = posixpath.normpath(posixpath.join(root, p))\n    if full != root and not full.startswith(root + \"/\"):\n        raise ValueError(\"path escapes workspace\")\n    return full\n\ndef run_tool(name, args):\n    try:\n        if name == \"calculator\":\n            expr = args[\"expr\"]\n            if not all(c in \"0123456789+-*/(). \" for c in expr):\n                return \"ERROR: bad characters\"\n            return str(eval(expr))\n        if name == \"read_file\":\n            return FILES.get(safe_path(args[\"path\"]), \"ERROR: no such file\")\n        return \"ERROR: unknown tool\"\n    except ValueError as e:\n        return f\"ERROR: {e}\"\n\nmessages = [{\"role\": \"user\", \"content\": \"Compute 12*7+3 and read my todo.\"}]\ntok_in = tok_out = calls = 0\nfor step in range(10):\n    resp = fake_model(messages)\n    calls += 1\n    tok_in += resp[\"usage\"][0]\n    tok_out += resp[\"usage\"][1]\n    messages.append({\"role\": \"assistant\", \"content\": resp[\"content\"]})\n    if resp[\"stop_reason\"] != \"tool_use\":\n        print(\"final:\", \"\".join(b[\"text\"] for b in resp[\"content\"] if b[\"type\"] == \"text\"))\n        break\n    results = []\n    for b in resp[\"content\"]:\n        if b[\"type\"] == \"tool_use\":\n            out = run_tool(b[\"name\"], b[\"input\"])\n            print(f\"tool {b['name']} {b['input']} -> {out}\")\n            results.append({\"type\": \"tool_result\", \"tool_use_id\": b[\"id\"], \"content\": out})\n    messages.append({\"role\": \"user\", \"content\": results})\n\ncost = tok_in / 1e6 * PRICE_IN + tok_out / 1e6 * PRICE_OUT\nprint(f\"calls={calls} in={tok_in} out={tok_out} cost=${cost:.6f}\")\n",
   "hint": "fake_model counts assistant messages, so you must append the assistant reply each turn or it will repeat the first answer forever."
  },
  "quiz": [
   {
    "q": "Who executes a tool call in an LLM tool-use loop?",
    "options": [
     "The model provider's servers",
     "The model, inside its forward pass",
     "Your code, after the model returns a tool_use block",
     "The browser"
    ],
    "answer": 2,
    "why": "The model only emits a structured request. Your program decides whether and how to run it, then returns the result."
   },
   {
    "q": "Why does input token usage grow with each loop step?",
    "options": [
     "The model gets slower",
     "Tool schemas get longer",
     "Streaming adds tokens",
     "The API is stateless, so the full history including previous tool results is sent every call"
    ],
    "answer": 3,
    "why": "Each call resends all messages; the history grows by one assistant turn and one tool-result turn per step."
   },
   {
    "q": "Which path passes the check normpath(join('workspace', p)).startswith('workspace/')?",
    "options": [
     "notes/../todo.txt",
     "../workspace2/a.txt",
     "/etc/passwd",
     "notes/../../x"
    ],
    "answer": 0,
    "why": "notes/../todo.txt normalises to workspace/todo.txt. The others escape: an absolute path replaces the root, and the .. paths climb out."
   },
   {
    "q": "A tool raises an exception. What is usually the best handling?",
    "options": [
     "Crash the agent",
     "Return the error message as the tool_result so the model can react",
     "Silently skip the tool_result",
     "Retry the same call forever"
    ],
    "answer": 1,
    "why": "Every tool_use needs a tool_result, and models often correct themselves when they see the error."
   }
  ]
 },
 "11.1": {
  "minutes": 55,
  "learn": "\n<p>A model only knows what was in its training data and what is in its prompt. <b>Retrieval</b> finds the right passages from your own documents and puts them in the prompt. The requirement for this lesson: every answer cites the exact passage it came from, so a reader can check it.</p>\n\n<h3>Chunking</h3>\n<p>Split documents into pieces small enough to fit many in a prompt but large enough to make sense alone: a paragraph, or a few hundred tokens, with a small overlap between neighbours so a sentence cut at a boundary still appears whole somewhere. Splitting at headings and paragraphs beats fixed character counts. Give every chunk a stable id like <code>serving.md#3</code>: that id is the citation.</p>\n\n<h3>Keyword search with SQLite FTS5</h3>\n<pre><code>CREATE VIRTUAL TABLE chunks USING fts5(doc, chunk_id, body);\nINSERT INTO chunks VALUES ('serving.md', 0, 'The KV cache stores keys ...');\n\nSELECT doc, chunk_id, snippet(chunks, 2, '[', ']', '...', 12) AS hit\nFROM chunks WHERE chunks MATCH 'kv AND cache'\nORDER BY bm25(chunks) LIMIT 5;</code></pre>\n<p>FTS5 builds an inverted index (word → chunks containing it). <code>bm25()</code> returns a score where <b>lower is better</b>, so you sort ascending.</p>\n\n<h3>How BM25 scores</h3>\n<p>For each query term that appears in a chunk:</p>\n<pre><code>idf(t)  = ln((N - n_t + 0.5) / (n_t + 0.5) + 1)\nscore  += idf(t) * f * (k1 + 1) / (f + k1 * (1 - b + b * len / avg_len))</code></pre>\n<p><code>N</code> is the number of chunks, <code>n_t</code> how many contain the term, <code>f</code> its count in this chunk. Rare words weigh more (idf), repeated words help with diminishing returns (k1 ≈ 1.2–2), and long chunks are penalised (b ≈ 0.75). Common words like \"the\" score almost nothing.</p>\n\n<h3>Embedding search</h3>\n<p>An embedding model maps text to a vector; similar meanings get similar vectors. Rank chunks by cosine similarity to the query vector:</p>\n<pre><code>import numpy as np\nE = embed(chunks)                 # shape (n, d), rows L2-normalised\nq = embed([query])[0]\ntop = np.argsort(-(E @ q))[:5]    # dot product = cosine for unit vectors</code></pre>\n<p>Embeddings find paraphrases (\"reduce VRAM\" matches \"save GPU memory\") that keyword search misses; keyword search wins on exact names, error codes and rare identifiers. Many systems run both and merge the rankings (hybrid search). Compare them on a small set of questions where you know the right chunk.</p>\n\n<h3>Answers with citations</h3>\n<pre><code>Answer using only the passages below. After each claim, cite the\npassage id in brackets, e.g. [serving.md#0]. If the passages do not\ncontain the answer, say so.\n\n[serving.md#0] The KV cache stores keys and values ...\n[memory.md#0] Paged attention splits the KV cache ...</code></pre>\n<p>Then <b>verify</b> in code: every cited id must be one you actually provided, and any quoted text must be a substring of that passage. Show the passage next to the answer.</p>\n\n<h3>Long-term memory</h3>\n<p>Agent memory is the same machinery pointed at the agent's own history. At the end of a session, store short facts (\"user prefers PyTorch\", with a date) in a table. At the start of the next one, retrieve the facts relevant to the new request and add them to the prompt. Let newer facts override older ones.</p>\n<blockquote>Common mistake: trusting citations the model wrote without checking them. Models can cite an id that does not support the claim, or one that does not exist.</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "python",
   "prompt": "<p>Implement BM25 (k1 = 1.5, b = 0.75, idf formula from the lesson) over five chunks. Tokenise by lowercasing and taking runs of letters and digits (<code>re.findall(r'[a-z0-9]+', text.lower())</code>). Print the top 3 chunks with scores to 3 decimals, then an answer line that cites the best chunk and quotes it. Expected output:</p><pre><code>memory.md#0 4.387\nserving.md#0 3.026\nmemory.md#1 0.958\nanswer: see [memory.md#0] &quot;Paged attention splits the KV cache into fixed blocks, which cuts memory fragmentation.&quot;</code></pre>",
   "starter": "CHUNKS = {\n    \"serving.md#0\": \"The KV cache stores keys and values of past tokens so decoding does not recompute attention for the prompt.\",\n    \"serving.md#1\": \"Continuous batching adds new requests between decode steps and keeps the GPU busy.\",\n    \"memory.md#0\": \"Paged attention splits the KV cache into fixed blocks, which cuts memory fragmentation.\",\n    \"memory.md#1\": \"Quantising weights to 4 bits reduces memory but can lower accuracy.\",\n    \"routing.md#0\": \"A router sends each request to the worker with the shortest queue.\",\n}\nQUERY = \"how does the kv cache affect memory fragmentation\"\n\nimport math, re\n\ndef tok(text):\n    return re.findall(r\"[a-z0-9]+\", text.lower())\n\ndef bm25_scores(query, chunks, k1=1.5, b=0.75):\n    # TODO: return {chunk_id: score}\n    pass\n\nscores = bm25_scores(QUERY, CHUNKS)\n# TODO: print the top 3 as \"chunk_id score\", then the answer line\n",
   "expected": "memory.md#0 4.387\nserving.md#0 3.026\nmemory.md#1 0.958\nanswer: see [memory.md#0] \"Paged attention splits the KV cache into fixed blocks, which cuts memory fragmentation.\"",
   "solution": "CHUNKS = {\n    \"serving.md#0\": \"The KV cache stores keys and values of past tokens so decoding does not recompute attention for the prompt.\",\n    \"serving.md#1\": \"Continuous batching adds new requests between decode steps and keeps the GPU busy.\",\n    \"memory.md#0\": \"Paged attention splits the KV cache into fixed blocks, which cuts memory fragmentation.\",\n    \"memory.md#1\": \"Quantising weights to 4 bits reduces memory but can lower accuracy.\",\n    \"routing.md#0\": \"A router sends each request to the worker with the shortest queue.\",\n}\nQUERY = \"how does the kv cache affect memory fragmentation\"\n\nimport math, re\n\ndef tok(text):\n    return re.findall(r\"[a-z0-9]+\", text.lower())\n\ndef bm25_scores(query, chunks, k1=1.5, b=0.75):\n    docs = {cid: tok(t) for cid, t in chunks.items()}\n    N = len(docs)\n    avg = sum(len(d) for d in docs.values()) / N\n    scores = {}\n    for cid, d in docs.items():\n        s = 0.0\n        for t in set(tok(query)):\n            n = sum(1 for x in docs.values() if t in x)\n            f = d.count(t)\n            if f == 0:\n                continue\n            idf = math.log((N - n + 0.5) / (n + 0.5) + 1)\n            s += idf * f * (k1 + 1) / (f + k1 * (1 - b + b * len(d) / avg))\n        scores[cid] = s\n    return scores\n\nscores = bm25_scores(QUERY, CHUNKS)\nranked = sorted(scores, key=lambda c: -scores[c])\nfor cid in ranked[:3]:\n    print(f\"{cid} {scores[cid]:.3f}\")\nbest = ranked[0]\nprint(f\"answer: see [{best}] \\\"{CHUNKS[best]}\\\"\")\n",
   "hint": "Loop over set(tok(query)) so a repeated query word is not counted twice. n is the number of chunks containing the term."
  },
  "quiz": [
   {
    "q": "Why does BM25 give a query word like 'the' almost no weight?",
    "options": [
     "It is removed by the tokenizer",
     "Short words are ignored",
     "BM25 only uses nouns",
     "It appears in almost every chunk, so its idf is near zero"
    ],
    "answer": 3,
    "why": "idf falls as the fraction of chunks containing the term rises."
   },
   {
    "q": "A user searches for error code 'CUDA_ERROR_ILLEGAL_ADDRESS'. Which retrieval is most reliable?",
    "options": [
     "Keyword search (BM25 / FTS5)",
     "Embedding search only",
     "Random sampling",
     "Asking the model without retrieval"
    ],
    "answer": 0,
    "why": "Exact rare identifiers are what keyword search does best; embeddings can blur them with similar-looking text."
   },
   {
    "q": "What should you check in code after the model answers with citations?",
    "options": [
     "That the answer is long enough",
     "That every cited id was in the provided passages and quotes are substrings of them",
     "That it used markdown",
     "Nothing, the prompt asked for citations"
    ],
    "answer": 1,
    "why": "Citations are model output and can be wrong; verify them against the passages you supplied."
   },
   {
    "q": "Why add overlap between neighbouring chunks?",
    "options": [
     "To make the index smaller",
     "Because FTS5 requires it",
     "So text cut at a boundary still appears complete in some chunk",
     "To speed up embedding"
    ],
    "answer": 2,
    "why": "Without overlap a key sentence split across two chunks may match neither well."
   }
  ]
 },
 "11.2": {
  "minutes": 60,
  "learn": "\n<p>A coding agent is the tool loop from the first lesson with three specific tools: read code, propose an edit, run tests. This lesson builds one that runs entirely on your machine, so you can measure it honestly and pay nothing per token.</p>\n\n<h3>A local model with Ollama</h3>\n<pre><code>ollama pull qwen2.5-coder:7b     # download a model (pick one that fits your VRAM)\nollama run qwen2.5-coder:7b      # chat in the terminal</code></pre>\n<p>Ollama also serves an HTTP API on <code>localhost:11434</code>, including an OpenAI-compatible endpoint, so the same client code works locally and in the cloud:</p>\n<pre><code>import requests\nr = requests.post(\"http://localhost:11434/api/chat\", json={\n    \"model\": \"qwen2.5-coder:7b\", \"stream\": False,\n    \"messages\": [{\"role\": \"user\", \"content\": \"Write a Python add function.\"}]})\nprint(r.json()[\"message\"][\"content\"])</code></pre>\n<p>A 7B model quantised to 4 bits needs roughly 4–5 GB of memory for the weights, plus the KV cache, which grows with context length.</p>\n\n<h3>Edits as unified diffs</h3>\n<p>Asking the model to rewrite whole files wastes tokens and silently drops lines. Ask for a <b>unified diff</b> instead:</p>\n<pre><code>--- a/calc.py\n+++ b/calc.py\n@@ -1,2 +1,2 @@\n def add(a, b):\n-    return a - b\n+    return a + b</code></pre>\n<ul>\n<li><code>@@ -1,2 +1,2 @@</code>: this hunk starts at line 1 and covers 2 lines in the old file and 2 in the new one.</li>\n<li>A leading space marks a <b>context</b> line (unchanged), <code>-</code> a removed line, <code>+</code> an added line.</li>\n</ul>\n<p>Context lines are the safety check: if they do not match the real file, the model was looking at a stale or imagined version, and the patch must be rejected, not forced. Apply with <code>git apply --check patch.diff</code> (dry run) then <code>git apply patch.diff</code>. Show the diff to the user before applying: it is short and reviewable.</p>\n\n<h3>The edit-test-retry loop</h3>\n<pre><code>for attempt in range(1, 4):\n    diff = ask_model(task, code, feedback)\n    try:\n        code = apply_diff(code, diff)\n    except PatchError as e:\n        feedback = f\"Patch did not apply: {e}\"\n        continue\n    ok, log = run_tests()            # e.g. subprocess.run([\"pytest\", \"-q\"])\n    if ok:\n        break\n    feedback = \"Tests failed:\\n\" + log[-2000:]   # tail of the output\n    code = original                  # retry from a clean state</code></pre>\n<p>Feed the exact error back. Revert failed attempts so mistakes do not stack. Cap the attempts: a model that fails three times usually needs a better prompt or more context, not a fourth try. Run tests in a sandbox (a container or at least a temporary copy of the repo): model-written code is untrusted.</p>\n\n<h3>Benchmarking the agent</h3>\n<p>Pick 20 small tasks with tests that decide success. For each run, record:</p>\n<ul>\n<li><b>pass@1</b>: fraction of tasks solved within the attempt limit.</li>\n<li><b>tokens</b> in and out per task (Ollama returns <code>prompt_eval_count</code> and <code>eval_count</code>).</li>\n<li><b>peak memory</b>: VRAM from <code>nvidia-smi</code>, or max RSS from <code>/usr/bin/time -v</code> on CPU.</li>\n<li><b>cost</b>: API prices for hosted models; for local ones, power draw × time × electricity price.</li>\n</ul>\n<blockquote>Common mistake: counting a patch as a success because it applied. Applying proves only that the context matched; the tests decide whether it is correct.</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "python",
   "prompt": "<p>Write <code>apply_diff(source, diff)</code> for single-file unified diffs: parse each <code>@@ -start,count +start,count @@</code> hunk, check that every context and removed line matches the source at that position (raise <code>ValueError(f'context mismatch at line {n}')</code> with the 1-based line number otherwise), and build the new text. Then run the retry loop over the fake agent's three proposals: on a patch error print it and try the next; if it applies, run the tests with <code>exec</code>; stop when all pass. Each attempt starts from the original source. Expected output:</p><pre><code>attempt 1: patch failed: context mismatch at line 1\nattempt 2: applied, tests 1/3 passed\nattempt 3: applied, tests 3/3 passed\ndef add(a, b):\n    return a + b</code></pre><p>The last two lines are the first two lines of the fixed file.</p>",
   "starter": "SOURCE = \"\"\"def add(a, b):\n    return a - b\n\ndef mul(a, b):\n    return a * b\n\"\"\"\n\nPROPOSALS = [   # what the fake agent proposes on attempts 1, 2, 3\n\"\"\"--- a/calc.py\n+++ b/calc.py\n@@ -1,2 +1,2 @@\n def add(x, y):\n-    return x - y\n+    return x + y\n\"\"\",\n\"\"\"--- a/calc.py\n+++ b/calc.py\n@@ -1,2 +1,2 @@\n def add(a, b):\n-    return a - b\n+    return b - a\n\"\"\",\n\"\"\"--- a/calc.py\n+++ b/calc.py\n@@ -1,2 +1,2 @@\n def add(a, b):\n-    return a - b\n+    return a + b\n\"\"\",\n]\n\nTESTS = [(\"add(2, 3)\", 5), (\"add(-1, 1)\", 0), (\"mul(3, 4)\", 12)]\n\nimport re\n\ndef apply_diff(source, diff):\n    lines = source.split(\"\\n\")\n    out, pos = [], 0          # pos: 0-based index into lines\n    # TODO: for each hunk header, copy lines up to the hunk start,\n    #       then walk the hunk lines (' ', '-', '+')\n    return \"\\n\".join(out)\n\ndef run_tests(code):\n    env = {}\n    exec(code, env)\n    return sum(1 for expr, want in TESTS if eval(expr, env) == want)\n\nfor attempt, diff in enumerate(PROPOSALS, 1):\n    pass  # TODO\n",
   "expected": "attempt 1: patch failed: context mismatch at line 1\nattempt 2: applied, tests 1/3 passed\nattempt 3: applied, tests 3/3 passed\ndef add(a, b):\n    return a + b",
   "solution": "SOURCE = \"\"\"def add(a, b):\n    return a - b\n\ndef mul(a, b):\n    return a * b\n\"\"\"\n\nPROPOSALS = [   # what the fake agent proposes on attempts 1, 2, 3\n\"\"\"--- a/calc.py\n+++ b/calc.py\n@@ -1,2 +1,2 @@\n def add(x, y):\n-    return x - y\n+    return x + y\n\"\"\",\n\"\"\"--- a/calc.py\n+++ b/calc.py\n@@ -1,2 +1,2 @@\n def add(a, b):\n-    return a - b\n+    return b - a\n\"\"\",\n\"\"\"--- a/calc.py\n+++ b/calc.py\n@@ -1,2 +1,2 @@\n def add(a, b):\n-    return a - b\n+    return a + b\n\"\"\",\n]\n\nTESTS = [(\"add(2, 3)\", 5), (\"add(-1, 1)\", 0), (\"mul(3, 4)\", 12)]\n\nimport re\n\ndef apply_diff(source, diff):\n    lines = source.split(\"\\n\")\n    out, pos = [], 0\n    for line in diff.split(\"\\n\"):\n        m = re.match(r\"@@ -(\\d+)(?:,\\d+)? \\+\\d+(?:,\\d+)? @@\", line)\n        if m:\n            start = int(m.group(1)) - 1\n            out += lines[pos:start]\n            pos = start\n        elif line.startswith((\"---\", \"+++\")) or line == \"\":\n            continue\n        elif line[0] in \" -\":\n            if pos >= len(lines) or lines[pos] != line[1:]:\n                raise ValueError(f\"context mismatch at line {pos + 1}\")\n            if line[0] == \" \":\n                out.append(lines[pos])\n            pos += 1\n        elif line[0] == \"+\":\n            out.append(line[1:])\n    return \"\\n\".join(out + lines[pos:])\n\ndef run_tests(code):\n    env = {}\n    exec(code, env)\n    return sum(1 for expr, want in TESTS if eval(expr, env) == want)\n\nfor attempt, diff in enumerate(PROPOSALS, 1):\n    try:\n        code = apply_diff(SOURCE, diff)\n    except ValueError as e:\n        print(f\"attempt {attempt}: patch failed: {e}\")\n        continue\n    passed = run_tests(code)\n    print(f\"attempt {attempt}: applied, tests {passed}/{len(TESTS)} passed\")\n    if passed == len(TESTS):\n        print(\"\\n\".join(code.split(\"\\n\")[:2]))\n        break\n",
   "hint": "Keep pos as the index of the next unread source line. Context and '-' lines must equal lines[pos] and advance pos; only context and '+' lines go into the output."
  },
  "quiz": [
   {
    "q": "In a unified diff, what does a line starting with a space mean?",
    "options": [
     "A context line that must already exist unchanged",
     "A line to delete",
     "A comment",
     "A line to add at the end"
    ],
    "answer": 0,
    "why": "Context lines anchor the hunk; a mismatch means the patch was made against different code."
   },
   {
    "q": "The patch applies cleanly. What does that prove?",
    "options": [
     "The fix is correct",
     "Only that the context and removed lines matched the file",
     "The tests pass",
     "The model understood the task"
    ],
    "answer": 1,
    "why": "Correctness is decided by tests (and review), not by whether the diff applies."
   },
   {
    "q": "Why revert to the original code before each retry?",
    "options": [
     "Git requires it",
     "To save tokens",
     "So failed attempts do not stack up and later diffs match a known file state",
     "It makes the model faster"
    ],
    "answer": 2,
    "why": "Starting from a known state keeps diffs applicable and keeps one bad attempt from poisoning the next."
   },
   {
    "q": "Why ask a coding model for diffs instead of full rewritten files?",
    "options": [
     "Diffs are required by Ollama",
     "Full files cannot be tested",
     "Diffs run faster",
     "Diffs use fewer output tokens and make accidental deletions visible"
    ],
    "answer": 3,
    "why": "Rewriting a whole file costs many tokens and the model may quietly drop or alter unrelated lines."
   }
  ]
 },
 "11.3": {
  "minutes": 55,
  "learn": "\n<p>The final project is a small event app that real people use: accounts, a database, one AI feature that saves effort, a referral loop, and a deployment. Everything before this phase was a component; this is a product.</p>\n\n<h3>Auth: do the boring parts right</h3>\n<ul>\n<li>Never store passwords. Store a slow, salted hash (argon2 or bcrypt via a library such as <code>argon2-cffi</code> or <code>passlib</code>).</li>\n<li>After login, set a session cookie with <code>HttpOnly</code> (JavaScript cannot read it), <code>Secure</code> (HTTPS only) and <code>SameSite=Lax</code>.</li>\n<li>Or use a hosted auth provider or \"magic link\" email login, which removes password handling entirely. For a first product this is often the better choice.</li>\n<li>Check permissions on the server for every request: \"can this user edit event 42?\". Hiding a button is not security.</li>\n</ul>\n\n<h3>The data model</h3>\n<pre><code>CREATE TABLE users (\n  id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL,\n  ref_code TEXT UNIQUE NOT NULL, referred_by INTEGER REFERENCES users(id));\nCREATE TABLE events (\n  id INTEGER PRIMARY KEY, owner_id INTEGER NOT NULL REFERENCES users(id),\n  title TEXT NOT NULL, starts_at TEXT NOT NULL);</code></pre>\n<p>SQLite is fine for the first hundreds of users; Postgres when you need several app servers writing at once. Use parameterised queries (<code>?</code> placeholders) everywhere, never string formatting, to prevent SQL injection.</p>\n\n<h3>AI-assisted event creation</h3>\n<p>The user types \"board games next Friday 7pm at the library, max 12 people\". The model turns it into structured fields; your code validates them; the user confirms a pre-filled form.</p>\n<pre><code>from pydantic import BaseModel, Field\nfrom datetime import datetime\n\nclass EventDraft(BaseModel):\n    title: str = Field(max_length=80)\n    starts_at: datetime\n    location: str | None = None\n    capacity: int | None = Field(default=None, ge=1, le=10000)\n\nprompt = (f\"Today is {today}. Extract an event from the text as JSON with keys \"\n          f\"title, starts_at (ISO 8601), location, capacity. Text: {text}\")\ndraft = EventDraft.model_validate_json(llm(prompt))   # raises on bad output</code></pre>\n<p>Pass today's date: the model cannot know what \"next Friday\" means otherwise. Many APIs can force JSON output or a tool call with a schema; still validate. On a validation error, retry once with the error message, then fall back to an empty form. Never save AI output without the user confirming it.</p>\n\n<h3>Referral links</h3>\n<ol>\n<li>Each user gets a unique random <code>ref_code</code>; their link is <code>https://yourapp.com/join?ref=ANA1</code>.</li>\n<li>On the landing page, store the code (cookie or form field) until signup completes.</li>\n<li>At signup, look up the referrer and set <code>referred_by</code>. Ignore unknown codes and self-referrals.</li>\n<li>Measure what matters: not just signups per referrer, but how many referred users became <b>active</b> (created an event).</li>\n</ol>\n<pre><code>SELECT r.email, COUNT(u.id) AS signups\nFROM users u JOIN users r ON u.referred_by = r.id\nGROUP BY r.id ORDER BY signups DESC;</code></pre>\n<p>A self-join: the same table appears twice, once as the referred user <code>u</code> and once as the referrer <code>r</code>.</p>\n\n<h3>Deploying</h3>\n<p>Put secrets (API keys, the session secret, the database URL) in environment variables, never in the repo. Use a platform that gives you HTTPS and a managed database, add basic error logging, and back up the database. Then find five real users: people who would create an event this month anyway. Watch them use it and write down where they get stuck.</p>\n<blockquote>Common mistake: counting \"users\" who signed up and never came back. Track one action that means real use (here: created an event).</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "sql",
   "prompt": "<p>The schema and data for users and events are in the starter. Write two queries:</p><ol><li><b>Referral leaderboard</b>: each referrer's email and number of signups they referred, as <code>email | signups</code>, most signups first (ties by email).</li><li><b>Active referrals</b>: for each referrer, how many of their referred users created at least one event, as <code>email | active</code>, same ordering by active then email, including referrers with 0.</li></ol><p>Expected output:</p><pre><code>email | signups\nana@x.io | 3\nben@x.io | 2\n\nemail | active\nana@x.io | 2\nben@x.io | 1</code></pre>",
   "starter": "CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, ref_code TEXT UNIQUE NOT NULL, referred_by INTEGER REFERENCES users(id));\nCREATE TABLE events (id INTEGER PRIMARY KEY, owner_id INTEGER NOT NULL REFERENCES users(id), title TEXT NOT NULL, starts_at TEXT NOT NULL);\nINSERT INTO users VALUES (1, 'ana@x.io', 'ANA1', NULL), (2, 'ben@x.io', 'BEN2', 1), (3, 'cy@x.io', 'CY3', 1), (4, 'dee@x.io', 'DEE4', 2), (5, 'eli@x.io', 'ELI5', 1), (6, 'fay@x.io', 'FAY6', 2), (7, 'gus@x.io', 'GUS7', NULL);\nINSERT INTO events VALUES (1, 1, 'GPU meetup', '2026-12-01 18:00'), (2, 2, 'CUDA study group', '2026-12-03 19:00'), (3, 3, 'Paper club', '2026-12-04 18:30'), (4, 2, 'Hack night', '2026-12-10 20:00'), (5, 6, 'Demo day', '2026-12-12 17:00');\n\n-- 1. referral leaderboard: email | signups\n-- (self-join users u with users r on u.referred_by = r.id)\n\n-- 2. active referrals: email | active\n-- (count referred users that have at least one event, use EXISTS or COUNT(DISTINCT ...))\n",
   "expected": "email | signups\nana@x.io | 3\nben@x.io | 2\n\nemail | active\nana@x.io | 2\nben@x.io | 1",
   "solution": "CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, ref_code TEXT UNIQUE NOT NULL, referred_by INTEGER REFERENCES users(id));\nCREATE TABLE events (id INTEGER PRIMARY KEY, owner_id INTEGER NOT NULL REFERENCES users(id), title TEXT NOT NULL, starts_at TEXT NOT NULL);\nINSERT INTO users VALUES (1, 'ana@x.io', 'ANA1', NULL), (2, 'ben@x.io', 'BEN2', 1), (3, 'cy@x.io', 'CY3', 1), (4, 'dee@x.io', 'DEE4', 2), (5, 'eli@x.io', 'ELI5', 1), (6, 'fay@x.io', 'FAY6', 2), (7, 'gus@x.io', 'GUS7', NULL);\nINSERT INTO events VALUES (1, 1, 'GPU meetup', '2026-12-01 18:00'), (2, 2, 'CUDA study group', '2026-12-03 19:00'), (3, 3, 'Paper club', '2026-12-04 18:30'), (4, 2, 'Hack night', '2026-12-10 20:00'), (5, 6, 'Demo day', '2026-12-12 17:00');\n\nSELECT r.email, COUNT(u.id) AS signups\nFROM users u JOIN users r ON u.referred_by = r.id\nGROUP BY r.id ORDER BY signups DESC, r.email;\n\nSELECT r.email, SUM(EXISTS (SELECT 1 FROM events e WHERE e.owner_id = u.id)) AS active\nFROM users u JOIN users r ON u.referred_by = r.id\nGROUP BY r.id ORDER BY active DESC, r.email;\n",
   "hint": "Both queries use the same self-join. For the second, EXISTS(...) is 1 or 0 per referred user, so SUM it per referrer."
  },
  "quiz": [
   {
    "q": "How should passwords be stored?",
    "options": [
     "Encrypted with a key in the config file",
     "As a slow salted hash such as argon2 or bcrypt",
     "In plain text in a separate table",
     "Base64-encoded"
    ],
    "answer": 1,
    "why": "Hashes cannot be reversed, salts stop precomputed attacks, and slowness makes brute force expensive."
   },
   {
    "q": "The model turns 'dinner next Friday' into the wrong date. What fix addresses the cause?",
    "options": [
     "Use a bigger model",
     "Ask the user to type ISO dates",
     "Include today's date in the prompt and validate the parsed datetime",
     "Lower the temperature"
    ],
    "answer": 2,
    "why": "Relative dates need a reference date; the model cannot know today otherwise. Validation catches what remains."
   },
   {
    "q": "Why is 'active referred users' a better metric than signups per referrer?",
    "options": [
     "It is easier to compute",
     "Referral signups are not stored",
     "SQL cannot count signups",
     "Signups can be empty accounts; activity shows the referral brought real users"
    ],
    "answer": 3,
    "why": "A referral loop only matters if the referred people actually use the product."
   },
   {
    "q": "Where should the session secret and API keys live in a deployed app?",
    "options": [
     "In environment variables or a secrets manager",
     "In the Git repo for easy setup",
     "In the frontend JavaScript",
     "In the database users table"
    ],
    "answer": 0,
    "why": "Secrets in the repo or frontend leak; environment variables keep them out of code and history."
   }
  ]
 }
});
