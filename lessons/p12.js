// Phase 12 lesson content. Generated; verified practice solutions.
Object.assign(LESSONS,{
 "12.0": {
  "minutes": 40,
  "learn": "\n<p>Research moves through papers. Reading them fast and writing them clearly are skills you can train like any other. The goal of this lesson: read one paper a week without drowning, and turn your own project into a paper someone else could check.</p>\n\n<h3>The three-pass method</h3>\n<p>From S. Keshav's short note <i>How to Read a Paper</i>. Do not read front to back on the first go.</p>\n<ol>\n<li><b>Pass 1 (5–10 minutes): the bird's-eye view.</b> Read the title, abstract and introduction, the section and subsection headings, and the conclusion. Glance at the references you recognise. Afterwards answer the <b>five Cs</b>: <i>Category</i> (what kind of paper: a new method, a measurement, a system?), <i>Context</i> (which work does it build on?), <i>Correctness</i> (do the assumptions look valid?), <i>Contributions</i> (what is new?), <i>Clarity</i> (is it well written?). Many papers stop here, and that is fine.</li>\n<li><b>Pass 2 (up to an hour): the content.</b> Read carefully but skip proofs and derivations. Study figures and tables: are axes labelled, are there error bars, is the baseline sensible? Mark references you should read. You should be able to explain the main idea, with evidence, to someone else.</li>\n<li><b>Pass 3 (several hours): virtual re-implementation.</b> Re-create the work in your head (or in code) from the paper's assumptions. Compare your version with theirs to find hidden assumptions, missing details and weak experiments.</li>\n</ol>\n<p>A five-line summary per paper works well: problem, key idea, evidence, weakness, what you would try next.</p>\n\n<h3>The shape of a paper</h3>\n<ul>\n<li><b>Abstract</b>: problem, approach, main result with a number, why it matters. Four to six sentences.</li>\n<li><b>Introduction</b>: the gap, your idea, and an explicit bullet list of contributions.</li>\n<li><b>Related work</b>: how you differ from the closest papers, not a list of everything.</li>\n<li><b>Method</b>: enough detail to re-implement.</li>\n<li><b>Experiments</b>: setup (data, baselines, hardware, seeds), results, ablations that remove one component at a time.</li>\n<li><b>Limitations</b>: what you did not test, where the method fails, what the numbers do not show.</li>\n<li><b>Conclusion</b>: short; no new claims.</li>\n</ul>\n\n<h3>LaTeX basics</h3>\n<pre><code>\\documentclass{article}\n\\usepackage{graphicx, booktabs, amsmath}\n\\begin{document}\n\\title{Faster KV Caching on One GPU}\n\\author{Your Name}\n\\maketitle\n\\begin{abstract} ... \\end{abstract}\n\\section{Introduction}\nTransformers~\\cite{vaswani2017} ...\n\\begin{figure}[t]\n  \\centering \\includegraphics[width=\\linewidth]{latency.pdf}\n  \\caption{p95 latency vs batch size. Error bars: std over 3 seeds.}\n  \\label{fig:lat}\n\\end{figure}\nAs Figure~\\ref{fig:lat} shows ...\n\\bibliographystyle{plain}\n\\bibliography{refs}      % refs.bib holds the BibTeX entries\n\\end{document}</code></pre>\n<p>Write in Overleaf or locally with <code>latexmk -pdf main.tex</code>. Conferences provide their own templates; use them from the start so page limits are real.</p>\n\n<h3>Writing like a researcher</h3>\n<ul>\n<li>Every claim gets evidence: a number, a figure or a citation. \"Significantly faster\" needs a test or should become \"1.4× faster (mean of 3 runs)\".</li>\n<li>Captions should make a figure readable on its own.</li>\n<li>A limitations section that names real weaknesses builds trust. Reviewers find the weaknesses anyway.</li>\n</ul>\n\n<h3>Sharing: arXiv or a blog</h3>\n<p>arXiv hosts preprints for free. First-time submitters in a category may need an <b>endorsement</b> from an established author. Submissions are moderated, become public and permanent: you can post new versions, but old ones stay visible. Check whether the venue you target allows preprints. A clear blog post with code is a fine alternative for engineering results.</p>\n<blockquote>Common mistake: reading every paper in full on the first pass. You will read three papers a month instead of ten, and remember less of each.</blockquote>\n",
  "practice": {
   "type": "fill",
   "prompt": "<p>Answer each question with a short word or command.</p>",
   "items": [
    {
     "q": "In which pass of the three-pass method do you study figures carefully but skip proofs? (number)",
     "accept": [
      "2",
      "second",
      "pass 2",
      "the second",
      "two"
     ],
     "hint": "Not the 5-minute one, not the re-implementation."
    },
    {
     "q": "The five Cs are category, context, correctness, contributions and ...?",
     "accept": [
      "clarity"
     ],
     "hint": "Is it well written?"
    },
    {
     "q": "Which section of a paper should name every weak point of your work?",
     "accept": [
      "limitations",
      "limitations section",
      "limitation",
      "the limitations section"
     ],
     "hint": "It comes before the conclusion."
    },
    {
     "q": "Write the LaTeX command that cites the BibTeX entry with key vaswani2017.",
     "accept": [
      "\\cite{vaswani2017}",
      "~\\cite{vaswani2017}",
      "\\citep{vaswani2017}",
      "\\citet{vaswani2017}"
     ],
     "hint": "\\something{key}"
    },
    {
     "q": "What file extension holds BibTeX references?",
     "accept": [
      ".bib",
      "bib"
     ],
     "hint": "Three letters."
    },
    {
     "q": "What does a first-time arXiv submitter in some categories need from an established author?",
     "accept": [
      "endorsement",
      "an endorsement",
      "endorse"
     ],
     "hint": "Starts with e."
    }
   ]
  },
  "quiz": [
   {
    "q": "After the first pass you decide the paper is not relevant. What should you do?",
    "options": [
     "Finish reading it anyway",
     "Skip to the proofs",
     "Stop; the first pass did its job",
     "Re-implement it to be sure"
    ],
    "answer": 2,
    "why": "Pass 1 exists to filter. Most papers you encounter need nothing more."
   },
   {
    "q": "Which sentence is the strongest claim for a results section?",
    "options": [
     "Our method is significantly faster.",
     "Our method is much better than prior work.",
     "Our method is state of the art.",
     "Our method reduces p95 latency from 210 ms to 150 ms (mean of 3 seeds, std 6 ms)."
    ],
    "answer": 3,
    "why": "It gives the metric, both numbers, the number of runs and the spread, so a reader can judge it."
   },
   {
    "q": "What is an ablation study?",
    "options": [
     "Removing one component at a time to see how much each contributes",
     "Testing on a larger dataset",
     "Comparing to the newest paper",
     "Running the same experiment twice"
    ],
    "answer": 0,
    "why": "Ablations show which parts of the method actually cause the improvement."
   },
   {
    "q": "Why can a limitations section make a paper more convincing?",
    "options": [
     "It makes the paper longer",
     "It shows you understand the scope of your evidence, so the remaining claims are more credible",
     "Reviewers ignore it",
     "It is required on arXiv"
    ],
    "answer": 1,
    "why": "Stating what you did not test sets honest boundaries; overclaiming is what reviewers punish."
   }
  ]
 },
 "12.1": {
  "minutes": 50,
  "learn": "\n<p>A benchmark number is a claim. Honest benchmarking means a reader can trust that the claim would survive someone else re-running it. Most published improvements that later fail to replicate fail for a small set of predictable reasons. Avoid them on purpose.</p>\n\n<h3>Seeds and spread</h3>\n<p>Training and even inference results change with the random seed (initialisation, data order, dropout, sampling). One run is an anecdote. Run at least 3 seeds, preferably 5 or more, and report <b>mean ± standard deviation</b> with the number of runs:</p>\n<pre><code>import statistics as st\nacc = [81.2, 80.4, 82.0, 79.8, 81.6]\nprint(f\"{st.mean(acc):.2f} ± {st.stdev(acc):.2f} (n={len(acc)})\")   # sample std, n-1</code></pre>\n<p>If your improvement is smaller than the spread between seeds, you have not shown an improvement.</p>\n\n<h3>Matched baselines</h3>\n<ul>\n<li>Same data, same splits, same preprocessing.</li>\n<li>Same <b>tuning budget</b>: if you tried 50 learning rates for your method, try 50 for the baseline too. An untuned baseline is the most common way to \"win\".</li>\n<li>Same compute and hardware for speed numbers; same batch size and sequence lengths; warm-up runs excluded from timing.</li>\n<li>Include a strong, simple baseline. If logistic regression is within 1 point of your network, say so.</li>\n</ul>\n\n<h3>Held-out data</h3>\n<p>Choose hyperparameters on a validation set. Touch the test set once, at the end. Every time you look at test results and change something, the test set becomes part of training and the number becomes optimistic. For medical data, split by patient, not by image, or the same patient leaks into both sides.</p>\n\n<h3>Paired comparisons</h3>\n<p>When both methods run on the same seeds, compare the <b>per-seed differences</b>. Seed effects cancel, so the test is more sensitive. A simple exact test for small n is the sign-flip (permutation) test: if the two methods were equivalent, each difference would be equally likely to be positive or negative. Flip signs in all 2ⁿ ways and count how often the mean difference is at least as large (in absolute value) as the one you observed.</p>\n<pre><code>p = (# sign patterns with |mean| &gt;= |observed mean|) / 2**n</code></pre>\n<p>Note the floor: with 5 seeds the smallest possible two-sided p-value is 2/32 = 0.0625. Five seeds cannot reach p &lt; 0.05 with this test no matter how large the gain. Either run more seeds or report the effect size and spread without claiming significance.</p>\n<p>The <b>bootstrap</b> is the general tool for confidence intervals: resample the test examples with replacement many times, recompute the metric, and take the 2.5th and 97.5th percentiles. Fix the resampling seed so the interval is reproducible.</p>\n\n<h3>Report the losses too</h3>\n<p>Your method will usually be worse at something: latency, memory, a subgroup, a metric you did not optimise. Put it in the main table. A table where you win every column on every dataset invites suspicion.</p>\n\n<h3>Reproducibility</h3>\n<ul>\n<li>Publish the scripts that produce every number and figure, with one command per table.</li>\n<li>Pin versions (<code>requirements.txt</code> with exact versions, CUDA and driver versions, GPU model).</li>\n<li>Record seeds, configs and the git commit with each result.</li>\n</ul>\n<blockquote>Common mistake: reporting the best of several seeds as \"the result\". Report all runs, or the mean and spread.</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "python",
   "prompt": "<p>Both methods ran on the same 5 seeds. Print mean ± sample std (2 decimals) for each method and metric, which method wins each metric (higher accuracy is better, lower latency is better), then an exact two-sided sign-flip test on the paired accuracy differences: count sign patterns (out of 2⁵) whose |mean difference| is at least the observed one (use a 1e-9 tolerance). Write the spread as <code>+/-</code>. Expected output:</p><pre><code>accuracy ours=81.00 +/- 0.89 base=80.16 +/- 0.72 winner=ours\nlatency_ms ours=41.40 +/- 1.14 base=35.20 +/- 0.84 winner=base\nmean_diff=0.84 p=4/32=0.125</code></pre><p>Ours wins accuracy by 0.84 points on every seed but one, yet p = 0.125: with 5 seeds this test cannot go below 0.0625.</p>",
   "starter": "import itertools, statistics as st\n\nRESULTS = {\n    'accuracy':   {'ours': [81.2, 80.4, 82.0, 79.8, 81.6], 'base': [80.1, 80.6, 80.9, 79.0, 80.2]},\n    'latency_ms': {'ours': [41, 42, 40, 43, 41],           'base': [35, 36, 34, 35, 36]},\n}\nHIGHER_IS_BETTER = {'accuracy': True, 'latency_ms': False}\n\nfor metric, r in RESULTS.items():\n    # TODO: mean and st.stdev for each, decide winner\n    pass\n\n# TODO: paired differences ours - base for accuracy, exact sign-flip test\n",
   "expected": "accuracy ours=81.00 +/- 0.89 base=80.16 +/- 0.72 winner=ours\nlatency_ms ours=41.40 +/- 1.14 base=35.20 +/- 0.84 winner=base\nmean_diff=0.84 p=4/32=0.125",
   "solution": "import itertools, statistics as st\n\nRESULTS = {\n    'accuracy':   {'ours': [81.2, 80.4, 82.0, 79.8, 81.6], 'base': [80.1, 80.6, 80.9, 79.0, 80.2]},\n    'latency_ms': {'ours': [41, 42, 40, 43, 41],           'base': [35, 36, 34, 35, 36]},\n}\nHIGHER_IS_BETTER = {'accuracy': True, 'latency_ms': False}\n\nfor metric, r in RESULTS.items():\n    mo, mb = st.mean(r['ours']), st.mean(r['base'])\n    ours_wins = (mo > mb) == HIGHER_IS_BETTER[metric]\n    print(f\"{metric} ours={mo:.2f} +/- {st.stdev(r['ours']):.2f} base={mb:.2f} +/- {st.stdev(r['base']):.2f} winner={'ours' if ours_wins else 'base'}\")\n\nd = [a - b for a, b in zip(RESULTS['accuracy']['ours'], RESULTS['accuracy']['base'])]\nobs = abs(sum(d) / len(d))\ncount = 0\nfor signs in itertools.product([1, -1], repeat=len(d)):\n    m = abs(sum(s * x for s, x in zip(signs, d)) / len(d))\n    if m >= obs - 1e-9:\n        count += 1\ntotal = 2 ** len(d)\nprint(f\"mean_diff={sum(d) / len(d):.2f} p={count}/{total}={count / total:.3f}\")\n",
   "hint": "itertools.product([1, -1], repeat=5) yields all 32 sign patterns. statistics.stdev is the sample (n-1) standard deviation."
  },
  "quiz": [
   {
    "q": "You tuned your model's learning rate over 40 values and used the baseline's default. What is wrong?",
    "options": [
     "Nothing, defaults are standard",
     "You should have tuned fewer values",
     "Learning rate does not matter for baselines",
     "The tuning budgets are not matched, so the comparison favours your method"
    ],
    "answer": 3,
    "why": "Give the baseline the same tuning effort or the gap partly measures tuning, not the method."
   },
   {
    "q": "Your gain is 0.3 points; the std across seeds is 0.8. What can you honestly say?",
    "options": [
     "The difference is within seed-to-seed variation; no clear improvement shown",
     "Our method is better",
     "The baseline is better",
     "Std does not matter if the mean is higher"
    ],
    "answer": 0,
    "why": "A difference smaller than the run-to-run spread can easily be noise."
   },
   {
    "q": "With 5 paired seeds, what is the smallest two-sided p-value an exact sign-flip test can give?",
    "options": [
     "0.01",
     "0.0625",
     "0.05",
     "0.001"
    ],
    "answer": 1,
    "why": "Only the all-positive and all-negative patterns are as extreme as a uniform gain: 2 of 32."
   },
   {
    "q": "Why split medical images by patient rather than by image?",
    "options": [
     "It makes the test set bigger",
     "Patients have different file formats",
     "Images of the same patient in both train and test leak information and inflate scores",
     "It is faster"
    ],
    "answer": 2,
    "why": "The model can recognise patient-specific features; the test then no longer measures generalisation to new patients."
   }
  ]
 },
 "12.2": {
  "minutes": 45,
  "learn": "\n<p>Most early startups fail because they build something nobody needs badly enough to pay for. The cure is cheap: talk to potential users before writing code, and measure what they do, not what they say.</p>\n\n<h3>Customer interviews that tell the truth</h3>\n<p>Rob Fitzpatrick's book <i>The Mom Test</i> gives three rules: talk about <b>their life</b> instead of your idea; ask about <b>specifics in the past</b> instead of generics or opinions about the future; <b>talk less and listen more</b>. Everyone will tell you your idea is great to be polite. Facts about what they already did are hard to fake.</p>\n<table>\n<tr><th>Bad question</th><th>Better question</th></tr>\n<tr><td>Would you use a tool that cuts GPU costs?</td><td>What did you spend on GPUs last month? How do you know?</td></tr>\n<tr><td>Do you think inference is too expensive?</td><td>Tell me about the last time inference cost became a problem. What did you do?</td></tr>\n<tr><td>How much would you pay for this?</td><td>What have you already tried to fix it? What did that cost?</td></tr>\n</table>\n<p>Signals that matter: they already spend money or engineering time on a workaround; they can name numbers; they ask when they can try it; they introduce you to a colleague or agree to a follow-up (a real <b>commitment</b>). Compliments, \"I would definitely use that\", and hypothetical prices are noise.</p>\n<p>Take notes right after each call. Tag each pain you heard. After five interviews, count: which pain came up most, and how many people showed evidence of spending on it?</p>\n\n<h3>The one-page problem/solution memo</h3>\n<ol>\n<li><b>Who</b>: the specific user (for example \"ML engineers at 10–50 person startups serving their own models\").</li>\n<li><b>Problem</b>: in their words, with quotes from interviews.</li>\n<li><b>Current workaround</b> and what it costs them.</li>\n<li><b>Your solution</b>: the smallest version that removes the pain.</li>\n<li><b>Why you</b>: your unfair advantage (skills, access, insight).</li>\n<li><b>Riskiest assumption</b> and the cheapest test for it.</li>\n</ol>\n\n<h3>Landing page and sign-ups</h3>\n<p>A landing page tests whether the problem statement resonates with strangers. Keep it to one headline naming the pain, two or three lines on the outcome, and <b>one</b> call to action (email sign-up or \"book a call\"). Send traffic from the places your users already are: relevant communities, your interviewees' colleagues, a post about what you learned.</p>\n<p>Measure conversion per traffic source: <code>sign-ups / unique visitors</code>. Twenty sign-ups from the right people, each followed by a conversation, is worth more than hundreds from a general audience who will never use the product.</p>\n\n<h3>Incubators and accelerators</h3>\n<p>An <b>incubator</b> usually offers space, mentors and a network, often with little or no investment. An <b>accelerator</b> runs a fixed-length programme with a cohort, typically invests a small amount for equity, and ends with a demo day for investors. Read the terms: how much equity, for how much money, on what conditions. Applications ask the same things as your memo: the problem, evidence that users want it, why your team, and what progress you made. Interview notes, sign-up numbers and a working prototype are the evidence.</p>\n<blockquote>Common mistake: pitching your idea during an interview. Once you pitch, people respond to you instead of telling you about their problem.</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "python",
   "prompt": "<p>Analyse five interview notes and a landing-page funnel. For interviews, count how often each pain tag appears (most common first, ties alphabetical) and how many interviewees showed past spending (<code>spent</code> is True); ignore the <code>said</code> field, it is only opinions. For the funnel, print the conversion per source as a percentage with 1 decimal, sorted by conversion, then the total sign-ups and whether the goal of 20 is reached. Expected output:</p><pre><code>pain cold_starts: 3\npain gpu_cost: 3\npain idle_gpus: 2\npain vendor_lock_in: 1\nevidence_of_spend: 3/5\nsource interviews: 6/40 = 15.0%\nsource community: 12/150 = 8.0%\nsource social: 3/400 = 0.8%\ntotal_signups=21 goal_met=True</code></pre>",
   "starter": "INTERVIEWS = [\n    {'pains': ['gpu_cost', 'idle_gpus'], 'spent': True,  'said': 'would totally use it'},\n    {'pains': ['cold_starts'],           'spent': False, 'said': 'sounds cool'},\n    {'pains': ['gpu_cost', 'cold_starts'], 'spent': True, 'said': ''},\n    {'pains': ['vendor_lock_in', 'gpu_cost'], 'spent': False, 'said': 'I would pay $100/month'},\n    {'pains': ['cold_starts', 'idle_gpus'], 'spent': True, 'said': ''},\n]\nFUNNEL = {'community': (150, 12), 'social': (400, 3), 'interviews': (40, 6)}   # visitors, signups\nGOAL = 20\n\n# TODO: count pains, print sorted by (-count, name)\n# TODO: evidence_of_spend\n# TODO: conversion per source sorted by conversion, highest first\n# TODO: total_signups and goal_met\n",
   "expected": "pain cold_starts: 3\npain gpu_cost: 3\npain idle_gpus: 2\npain vendor_lock_in: 1\nevidence_of_spend: 3/5\nsource interviews: 6/40 = 15.0%\nsource community: 12/150 = 8.0%\nsource social: 3/400 = 0.8%\ntotal_signups=21 goal_met=True",
   "solution": "from collections import Counter\n\nINTERVIEWS = [\n    {'pains': ['gpu_cost', 'idle_gpus'], 'spent': True,  'said': 'would totally use it'},\n    {'pains': ['cold_starts'],           'spent': False, 'said': 'sounds cool'},\n    {'pains': ['gpu_cost', 'cold_starts'], 'spent': True, 'said': ''},\n    {'pains': ['vendor_lock_in', 'gpu_cost'], 'spent': False, 'said': 'I would pay $100/month'},\n    {'pains': ['cold_starts', 'idle_gpus'], 'spent': True, 'said': ''},\n]\nFUNNEL = {'community': (150, 12), 'social': (400, 3), 'interviews': (40, 6)}\nGOAL = 20\n\npains = Counter(p for i in INTERVIEWS for p in i['pains'])\nfor name, n in sorted(pains.items(), key=lambda kv: (-kv[1], kv[0])):\n    print(f'pain {name}: {n}')\nprint(f\"evidence_of_spend: {sum(i['spent'] for i in INTERVIEWS)}/{len(INTERVIEWS)}\")\nfor src, (v, s) in sorted(FUNNEL.items(), key=lambda kv: -kv[1][1] / kv[1][0]):\n    print(f'source {src}: {s}/{v} = {100 * s / v:.1f}%')\ntotal = sum(s for _, s in FUNNEL.values())\nprint(f'total_signups={total} goal_met={total >= GOAL}')\n",
   "hint": "sorted(FUNNEL.items(), key=lambda kv: -kv[1][1] / kv[1][0]) sorts sources by signups/visitors, highest first."
  },
  "quiz": [
   {
    "q": "Which interview question follows the Mom Test?",
    "options": [
     "What did you do the last time your inference bill spiked?",
     "Would you pay for a tool that lowers GPU bills?",
     "Do you like my idea?",
     "How much would you pay per month?"
    ],
    "answer": 0,
    "why": "It asks about a specific past event, which reveals real behaviour instead of polite opinions."
   },
   {
    "q": "An interviewee says 'I would definitely buy this.' How much weight should it get?",
    "options": [
     "High: it is a clear buying signal",
     "Little: it is a hypothetical about the future, not a commitment",
     "It proves product-market fit",
     "It is worth one sign-up"
    ],
    "answer": 1,
    "why": "Future promises cost nothing to make. Commitments (time, money, introductions) and past spending count."
   },
   {
    "q": "Social posts brought 400 visitors and 3 sign-ups; a niche community brought 150 and 12. What does that suggest?",
    "options": [
     "Do more social posts, they bring more traffic",
     "The landing page is broken",
     "The niche community matches your target users far better (8% vs under 1%)",
     "Conversion rates do not matter"
    ],
    "answer": 2,
    "why": "Conversion shows which audience actually has the problem; raw traffic hides it."
   },
   {
    "q": "What does an accelerator typically offer that a plain incubator often does not?",
    "options": [
     "Office chairs",
     "Free GPUs forever",
     "Guaranteed customers",
     "A fixed-term cohort programme with a small investment for equity and a demo day"
    ],
    "answer": 3,
    "why": "Accelerators are time-boxed, invest for equity and end with an investor demo day; incubators are usually looser support."
   }
  ]
 }
});
