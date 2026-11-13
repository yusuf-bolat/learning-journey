// Phase 0 lesson content. Generated; verified practice solutions.
Object.assign(LESSONS,{
 "0.0": {
  "minutes": 35,
  "learn": "\n<p>The shell is a program that runs commands you type. Almost every tool in this course (compilers, CUDA, Git, Docker, training scripts) is driven from it, so fluency here pays off every day.</p>\n\n<h3>Paths and moving around</h3>\n<p>The file system is a tree. <code>/</code> is the root, <code>~</code> is your home folder, <code>.</code> is the current folder and <code>..</code> is the parent. A path that starts with <code>/</code> is <b>absolute</b>; anything else is <b>relative</b> to where you are.</p>\n<pre><code>pwd                 # print working directory\nls -la              # list all files, including hidden ones, with details\ncd ~/projects       # change directory\nmkdir -p a/b/c      # make nested folders\ncp file.txt backup/ # copy\nmv old.txt new.txt  # move or rename\nrm -r build/        # delete a folder (no undo!)</code></pre>\n\n<h3>Reading and searching</h3>\n<pre><code>cat notes.txt             # print a file\nless big.log              # scroll a big file (q to quit)\nhead -n 20 data.csv       # first 20 lines\ngrep -n \"error\" app.log   # lines containing \"error\", with line numbers\nfind . -name \"*.py\"       # all Python files below here</code></pre>\n\n<h3>Pipes and redirection</h3>\n<p>Each program reads <b>stdin</b> and writes <b>stdout</b>. The pipe <code>|</code> connects one program's stdout to the next one's stdin. <code>&gt;</code> writes stdout to a file (overwrite), <code>&gt;&gt;</code> appends.</p>\n<pre><code>cat app.log | grep error | wc -l     # count error lines\npython train.py &gt; run.log 2&gt;&amp;1     # save stdout and stderr together</code></pre>\n\n<h3>Git: the mental model</h3>\n<p>Git stores <b>snapshots</b> of your project called commits. Your files move through three places:</p>\n<ol>\n<li><b>Working tree</b>: the files you edit.</li>\n<li><b>Staging area</b>: changes you picked for the next commit (<code>git add</code>).</li>\n<li><b>History</b>: saved commits (<code>git commit</code>).</li>\n</ol>\n<p>A <b>branch</b> is just a movable name pointing at a commit. <code>main</code> is a branch like any other.</p>\n<pre><code>git init                       # start a repo\ngit status                     # what changed?\ngit add file.py                # stage\ngit commit -m \"Add loader\"     # snapshot\ngit switch -c feature          # new branch and switch to it\ngit merge feature              # bring feature into current branch\ngit push origin main           # upload to GitHub</code></pre>\n\n<h3>Merge conflicts</h3>\n<p>If two branches change the same lines, Git stops and marks the file:</p>\n<pre><code>&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD\nlr = 0.001\n=======\nlr = 0.01\n&gt;&gt;&gt;&gt;&gt;&gt;&gt; feature</code></pre>\n<p>Edit the file to the version you want, delete the markers, then <code>git add</code> and <code>git commit</code>.</p>\n<blockquote>Common mistake: <code>rm -rf</code> with a typo in the path. Run <code>ls</code> on the same path first.</blockquote>\n",
  "practice": {
   "type": "fill",
   "prompt": "<p>Type the command that does each job. Several correct forms are accepted.</p>",
   "items": [
    {
     "q": "Show the full path of the folder you are in.",
     "accept": [
      "pwd"
     ],
     "hint": "print working directory"
    },
    {
     "q": "List all files in the current folder, including hidden ones, in long format.",
     "accept": [
      "ls -la",
      "ls -al",
      "ls -l -a",
      "ls -a -l"
     ],
     "hint": "ls with two flags"
    },
    {
     "q": "Print only the lines of app.log that contain the word error.",
     "accept": [
      "grep error app.log",
      "grep \"error\" app.log",
      "grep 'error' app.log",
      "cat app.log | grep error"
     ],
     "hint": "grep PATTERN FILE"
    },
    {
     "q": "Stage the file train.py for the next commit.",
     "accept": [
      "git add train.py"
     ],
     "hint": "git ___ file"
    },
    {
     "q": "Create a new branch called fix and switch to it in one command.",
     "accept": [
      "git switch -c fix",
      "git checkout -b fix"
     ],
     "hint": "switch with -c"
    }
   ]
  },
  "quiz": [
   {
    "q": "What does the pipe in `cat a.txt | wc -l` do?",
    "options": [
     "Writes a.txt into a file called wc",
     "Sends cat's output as wc's input",
     "Runs both commands at the same time on a.txt separately",
     "Appends the line count to a.txt"
    ],
    "answer": 1,
    "why": "A pipe connects stdout of the left program to stdin of the right one."
   },
   {
    "q": "You edited model.py and ran git commit, but the change is not in the commit. Why?",
    "options": [
     "You forgot git push",
     "You forgot git add, so the change was not staged",
     "Git ignores .py files",
     "Commits only save new files"
    ],
    "answer": 1,
    "why": "Commits record only staged changes. Stage with git add first."
   },
   {
    "q": "What is a Git branch?",
    "options": [
     "A full copy of the project folder",
     "A movable pointer to a commit",
     "A backup on GitHub",
     "A list of changed files"
    ],
    "answer": 1,
    "why": "Branches are cheap: just a name pointing at a commit that moves forward when you commit."
   }
  ]
 },
 "0.1": {
  "minutes": 40,
  "learn": "\n<p>Python is the glue language of ML: training scripts, data prep, tooling and quick experiments. You need to write it without looking things up.</p>\n\n<h3>Core data structures</h3>\n<pre><code>nums = [3, 1, 4]            # list: ordered, mutable\nnums.append(5)\npoint = (2, 3)              # tuple: ordered, immutable\nages = {\"ana\": 31, \"li\": 27} # dict: key → value\nseen = {1, 2, 3}            # set: unique items, fast membership test</code></pre>\n\n<h3>Loops and comprehensions</h3>\n<p>A comprehension builds a list in one expression. Read it left to right as \"make this, for each item, if condition\".</p>\n<pre><code>squares = [x * x for x in range(10) if x % 2 == 0]   # [0, 4, 16, 36, 64]\nlengths = {w: len(w) for w in [\"gpu\", \"cuda\"]}       # {'gpu': 3, 'cuda': 4}</code></pre>\n\n<h3>Functions and input</h3>\n<pre><code>def mean(xs):\n    return sum(xs) / len(xs)\n\nline = input()                       # one line from stdin\nnums = [float(t) for t in line.split()]\nprint(f\"mean={mean(nums):.2f}\")      # f-string with 2 decimals</code></pre>\n\n<h3>Files</h3>\n<pre><code>with open(\"data.csv\") as f:          # closes the file for you\n    for row in f:\n        cols = row.strip().split(\",\")</code></pre>\n\n<h3>Virtual environments</h3>\n<p>Each project gets its own packages so versions never clash:</p>\n<pre><code>python -m venv .venv\nsource .venv/bin/activate      # Windows: .venv\\Scripts\\activate\npip install numpy matplotlib</code></pre>\n\n<h3>NumPy: think in arrays</h3>\n<p>Python loops are slow, about 50–100× slower than the same work in C. NumPy runs the loop in C for you. Replace loops with whole-array operations (<b>vectorisation</b>).</p>\n<pre><code>import numpy as np\nx = np.array([1.0, 2.0, 3.0])\nx * 2            # array([2., 4., 6.])  no loop\nx.mean(), x.std()\nm = np.ones((3, 4))\nm + np.arange(4) # broadcasting: the row is added to every row of m</code></pre>\n<blockquote>Rule of thumb: if you write a <code>for</code> loop over array elements, there is usually a NumPy one-liner.</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "python",
   "prompt": "<p>Read numbers separated by spaces from one line of stdin. Print their mean and population standard deviation with 2 decimals, without NumPy:</p><pre><code>mean=5.00\nstd=2.00</code></pre><p>Population std: square root of the average of squared differences from the mean.</p>",
   "starter": "nums = [float(t) for t in input().split()]\n\n# compute mean and std here\n\nprint(f\"mean={0:.2f}\")\nprint(f\"std={0:.2f}\")\n",
   "stdin": "2 4 4 4 5 5 7 9",
   "expected": "mean=5.00\nstd=2.00",
   "solution": "nums = [float(t) for t in input().split()]\nm = sum(nums) / len(nums)\nvar = sum((x - m) ** 2 for x in nums) / len(nums)\nprint(f\"mean={m:.2f}\")\nprint(f\"std={var ** 0.5:.2f}\")\n",
   "hint": "First compute the mean m, then average (x - m) ** 2 over all x, then take ** 0.5."
  },
  "quiz": [
   {
    "q": "What does [x * 2 for x in range(4) if x > 1] produce?",
    "options": [
     "[0, 2, 4, 6]",
     "[4, 6]",
     "[2, 3]",
     "[1, 2, 3]"
    ],
    "answer": 1,
    "why": "range(4) is 0..3; keep x > 1 gives 2 and 3; doubled gives 4 and 6."
   },
   {
    "q": "Why use a virtual environment?",
    "options": [
     "It makes Python faster",
     "It isolates each project's packages and versions",
     "It is required to run NumPy",
     "It encrypts your code"
    ],
    "answer": 1,
    "why": "Different projects need different versions; a venv keeps them apart."
   },
   {
    "q": "Why is a NumPy expression like x * 2 faster than a Python loop?",
    "options": [
     "NumPy uses the GPU automatically",
     "The loop runs in compiled C code over contiguous memory",
     "Python caches the result",
     "It is not faster"
    ],
    "answer": 1,
    "why": "Vectorised operations avoid per-element Python interpreter overhead."
   }
  ]
 },
 "0.2": {
  "minutes": 45,
  "learn": "\n<p>Linear algebra is the language of graphics and deep learning. A neural network layer is a matrix multiply; a camera transform is a matrix multiply; attention is matrix multiplies. You need intuition, not proofs.</p>\n\n<h3>Vectors</h3>\n<p>A vector is a list of numbers, like a point or a direction: <code>v = [3, 4]</code>. Its length is <code>√(3² + 4²) = 5</code>.</p>\n\n<h3>Dot product</h3>\n<p><code>a · b = a₁b₁ + a₂b₂ + …</code>. It measures how much two vectors point the same way: <code>a · b = |a||b|cos θ</code>. Positive means same direction, zero means perpendicular, negative means opposite. Attention scores in transformers are dot products between a query and keys.</p>\n\n<h3>Matrices and matrix multiply</h3>\n<p>For <code>C = A × B</code>, entry <code>C[i][j]</code> is the dot product of <b>row i of A</b> with <b>column j of B</b>. A is n×k, B is k×m, C is n×m. The inner sizes must match.</p>\n<pre><code>[1 2]   [5 6]   [1·5+2·7  1·6+2·8]   [19 22]\n[3 4] × [7 8] = [3·5+4·7  3·6+4·8] = [43 50]</code></pre>\n<p>Matrix multiply is <b>not commutative</b>: A×B ≠ B×A in general.</p>\n\n<h3>Matrices as transformations</h3>\n<p>Multiplying a point by a matrix moves it. A 2-D rotation by angle θ:</p>\n<pre><code>R = [cos θ  -sin θ]\n    [sin θ   cos θ]</code></pre>\n<p>Rotating <code>[1, 0]</code> by 90° gives <code>[0, 1]</code>. In OpenGL you will chain model, view and projection matrices exactly like this.</p>\n\n<h3>Eigenvectors (intuition)</h3>\n<p>An eigenvector of A is a direction that A only stretches, not rotates: <code>A v = λ v</code>. λ is the stretch factor. They appear in PCA, stability analysis and mesh smoothing.</p>\n\n<h3>Cost of matmul</h3>\n<p>Multiplying two n×n matrices takes about <b>2n³</b> floating-point operations. For n = 4096 that is ~137 GFLOP. This is why GPUs exist and why you will write tiled matmul kernels in the CUDA phase.</p>\n",
  "practice": {
   "type": "code",
   "lang": "python",
   "prompt": "<p>Implement <code>matmul(A, B)</code> with plain loops (no NumPy) and <code>dot(a, b)</code>. The program prints each row of A×B, then the dot product. Expected output:</p><pre><code>[19, 22]\n[43, 50]\n32</code></pre>",
   "starter": "def dot(a, b):\n    # sum of a[i] * b[i]\n    pass\n\ndef matmul(A, B):\n    # C[i][j] = dot(row i of A, column j of B)\n    pass\n\nA = [[1, 2], [3, 4]]\nB = [[5, 6], [7, 8]]\nfor row in matmul(A, B):\n    print(row)\nprint(dot([1, 2, 3], [4, 5, 6]))\n",
   "expected": "[19, 22]\n[43, 50]\n32",
   "solution": "def dot(a, b):\n    return sum(x * y for x, y in zip(a, b))\n\ndef matmul(A, B):\n    cols = list(zip(*B))\n    return [[dot(row, col) for col in cols] for row in A]\n\nA = [[1, 2], [3, 4]]\nB = [[5, 6], [7, 8]]\nfor row in matmul(A, B):\n    print(row)\nprint(dot([1, 2, 3], [4, 5, 6]))\n",
   "hint": "zip(*B) gives you the columns of B."
  },
  "quiz": [
   {
    "q": "A is 3×5 and B is 5×2. What is the shape of A×B?",
    "options": [
     "5×5",
     "3×2",
     "2×3",
     "Not defined"
    ],
    "answer": 1,
    "why": "Inner sizes (5) match and disappear; the result is outer sizes 3×2."
   },
   {
    "q": "The dot product of two non-zero vectors is 0. What does that mean?",
    "options": [
     "They are equal",
     "They are perpendicular",
     "One is longer",
     "They point in opposite directions"
    ],
    "answer": 1,
    "why": "a·b = |a||b|cos θ, which is 0 when θ = 90°."
   },
   {
    "q": "Roughly how many FLOPs does an n×n by n×n matmul need?",
    "options": [
     "n",
     "n²",
     "2n³",
     "2ⁿ"
    ],
    "answer": 2,
    "why": "n² outputs, each a dot product of length n (n multiplies + n adds)."
   }
  ]
 },
 "0.3": {
  "minutes": 45,
  "learn": "\n<p>Training a neural network is calculus (gradients) plus probability (losses, noise, evaluation). These are the only parts you need.</p>\n\n<h3>Derivatives</h3>\n<p>The derivative <code>f'(x)</code> is the slope of f at x: how much f changes for a tiny change in x. Key rules:</p>\n<ul>\n<li><code>(xⁿ)' = n·xⁿ⁻¹</code></li>\n<li>Product: <code>(f·g)' = f'·g + f·g'</code></li>\n<li><b>Chain rule</b>: <code>f(g(x))' = f'(g(x)) · g'(x)</code>. Backpropagation is the chain rule applied layer by layer.</li>\n</ul>\n<p>Check any derivative numerically: <code>(f(x+h) − f(x−h)) / 2h</code> with h ≈ 1e-5.</p>\n\n<h3>Gradients and gradient descent</h3>\n<p>With many inputs, the gradient ∇f is the vector of partial derivatives. It points uphill. To minimise a loss, step downhill:</p>\n<pre><code>x = x - lr * grad(x)</code></pre>\n<p><b>lr</b> (learning rate) sets step size. Too big: you overshoot and diverge. Too small: training crawls.</p>\n\n<h3>Probability basics</h3>\n<ul>\n<li><b>Expectation</b> E[X]: the long-run average.</li>\n<li><b>Variance</b>: average squared distance from the mean; std is its square root.</li>\n<li><b>Normal distribution</b>: ~95% of values lie within 2 std of the mean.</li>\n</ul>\n\n<h3>Bayes' rule</h3>\n<pre><code>P(A|B) = P(B|A) · P(A) / P(B)</code></pre>\n<p>Medical example: a disease affects 1% of people. A test catches 99% of sick people but also flags 5% of healthy people. If you test positive, the chance you are sick is only about 17%, because healthy people vastly outnumber sick ones. This matters for your screening project: accuracy alone hides this.</p>\n<pre><code>P(+) = 0.99·0.01 + 0.05·0.99 = 0.0594\nP(sick|+) = 0.0099 / 0.0594 ≈ 0.1667</code></pre>\n",
  "practice": {
   "type": "code",
   "lang": "python",
   "prompt": "<p>Two parts:</p><ol><li>Minimise <code>f(x) = (x − 3)²</code> with gradient descent: start at x = 0, learning rate 0.1, 50 steps. Print x with 4 decimals.</li><li>Use Bayes' rule with prior 0.01, sensitivity 0.99 and false-positive rate 0.05. Print P(sick | positive) with 4 decimals.</li></ol><p>Expected output:</p><pre><code>3.0000\n0.1667</code></pre>",
   "starter": "def grad(x):\n    # derivative of (x - 3) ** 2\n    pass\n\nx = 0.0\nlr = 0.1\nfor _ in range(50):\n    pass  # update x\nprint(f\"{x:.4f}\")\n\nprior, sens, fpr = 0.01, 0.99, 0.05\n# compute posterior\nposterior = 0\nprint(f\"{posterior:.4f}\")\n",
   "expected": "3.0000\n0.1667",
   "solution": "def grad(x):\n    return 2 * (x - 3)\n\nx = 0.0\nlr = 0.1\nfor _ in range(50):\n    x -= lr * grad(x)\nprint(f\"{x:.4f}\")\n\nprior, sens, fpr = 0.01, 0.99, 0.05\np_pos = sens * prior + fpr * (1 - prior)\nposterior = sens * prior / p_pos\nprint(f\"{posterior:.4f}\")\n",
   "hint": "The derivative of (x − 3)² is 2(x − 3). P(+) = sens·prior + fpr·(1 − prior)."
  },
  "quiz": [
   {
    "q": "What is the derivative of sin(x²)?",
    "options": [
     "cos(x²)",
     "2x·cos(x²)",
     "2x·sin(x)",
     "cos(2x)"
    ],
    "answer": 1,
    "why": "Chain rule: outer derivative cos(x²) times inner derivative 2x."
   },
   {
    "q": "Your training loss explodes to NaN after a few steps. What is the most likely first fix?",
    "options": [
     "Increase the learning rate",
     "Lower the learning rate",
     "Train for more epochs",
     "Add more data"
    ],
    "answer": 1,
    "why": "A learning rate that is too big overshoots and diverges."
   },
   {
    "q": "A test is 99% sensitive, but the disease is rare. Why can most positives still be false?",
    "options": [
     "The test is broken",
     "Healthy people far outnumber sick people, so their small false-positive rate adds up",
     "Sensitivity is measured wrongly",
     "Bayes' rule does not apply to tests"
    ],
    "answer": 1,
    "why": "Base rates dominate: 5% of 99% healthy is far more people than 99% of 1% sick."
   }
  ]
 }
});
