// Phase 5 lesson content. Generated; verified practice solutions.
Object.assign(LESSONS,{
 "5.0": {
  "minutes": 55,
  "learn": "\n<p>Classical machine learning is still the right tool for small tabular datasets, and it teaches the habits deep learning relies on: honest splits, the right metric, and spotting overfitting. scikit-learn gives every model the same interface.</p>\n\n<h3>The estimator API</h3>\n<p>Every model has <code>fit(X, y)</code> to learn and <code>predict(X)</code> to use it. Classifiers also have <code>predict_proba(X)</code>. <code>X</code> is a 2-D array (samples × features), <code>y</code> a 1-D array of labels.</p>\n<pre><code>from sklearn.datasets import load_breast_cancer\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.pipeline import make_pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.linear_model import LogisticRegression\n\nX, y = load_breast_cancer(return_X_y=True)\nX_tmp, X_test, y_tmp, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=0)\nX_train, X_val, y_train, y_val = train_test_split(X_tmp, y_tmp, test_size=0.25, stratify=y_tmp, random_state=0)\n\nmodel = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))\nmodel.fit(X_train, y_train)\nprint(model.score(X_val, y_val))       # accuracy on validation</code></pre>\n<p>The pipeline matters: the scaler learns its mean and std from the training data only, then applies them to validation and test data. Scaling the whole dataset before splitting leaks test information into training.</p>\n\n<h3>Train, validation, test</h3>\n<ul>\n<li><b>Train</b>: the model learns from it.</li>\n<li><b>Validation</b>: you compare models and tune hyperparameters on it.</li>\n<li><b>Test</b>: used <b>once</b> at the end. If you tune on it, its score is no longer an honest estimate.</li>\n</ul>\n<p><b>k-fold cross-validation</b> uses the data more efficiently: split into k folds, train on k−1 and validate on the remaining one, k times, then average. <code>KFold(n_splits=k)</code> without shuffling gives contiguous folds; when n is not divisible by k, the first <code>n % k</code> folds get one extra sample. For classification, <code>StratifiedKFold</code> keeps class ratios equal in every fold.</p>\n<pre><code>from sklearn.model_selection import cross_val_score, StratifiedKFold\ncv = StratifiedKFold(n_splits=5, shuffle=True, random_state=0)\nscores = cross_val_score(model, X_tmp, y_tmp, cv=cv, scoring=\"f1\")\nprint(scores.mean(), scores.std())</code></pre>\n\n<h3>Metrics from the confusion matrix</h3>\n<p>Count true/false positives/negatives (TP, FP, FN, TN), then:</p>\n<ul>\n<li><b>Accuracy</b> = (TP + TN) / all. Misleading on imbalanced data.</li>\n<li><b>Precision</b> = TP / (TP + FP): of everything flagged, how much was right.</li>\n<li><b>Recall</b> = TP / (TP + FN): of all real positives, how many were found. In screening, a missed case is costly, so recall matters.</li>\n<li><b>F1</b> = 2·P·R / (P + R), the harmonic mean.</li>\n<li><b>ROC-AUC</b>: threshold-free. It equals the probability that a random positive gets a higher score than a random negative (ties count half). 0.5 is random guessing, 1.0 is perfect ranking.</li>\n</ul>\n<pre><code>from sklearn.metrics import classification_report, roc_auc_score\nprint(classification_report(y_val, model.predict(X_val)))\nprint(roc_auc_score(y_val, model.predict_proba(X_val)[:, 1]))</code></pre>\n\n<h3>Comparing and tuning models</h3>\n<p><code>GridSearchCV</code> tries every hyperparameter combination with cross-validation and keeps the best:</p>\n<pre><code>from sklearn.svm import SVC\nfrom sklearn.model_selection import GridSearchCV\ngrid = GridSearchCV(make_pipeline(StandardScaler(), SVC()),\n                    {\"svc__C\": [0.1, 1, 10], \"svc__gamma\": [\"scale\", 0.01]},\n                    cv=5, scoring=\"f1\")\ngrid.fit(X_tmp, y_tmp)\nprint(grid.best_params_, grid.best_score_)</code></pre>\n<p>Random forests need no scaling and are a strong default for tabular data; SVMs need scaled features.</p>\n\n<h3>Overfitting and learning curves</h3>\n<p>A model <b>overfits</b> when it scores much better on training data than on validation data. <code>learning_curve</code> trains on growing subsets and returns both scores. A large gap that stays open means high variance (more data or regularisation helps). Two low curves that meet early mean high bias (a more flexible model helps).</p>\n<blockquote>Common mistake: reporting accuracy on an imbalanced dataset. If 95% of samples are negative, a model that always says \"negative\" scores 95% accuracy and 0% recall.</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "python",
   "prompt": "<p>Implement the core of <code>sklearn.metrics</code> and <code>KFold</code> yourself in plain Python, so you know exactly what the library reports. (Afterwards, check your numbers against <code>confusion_matrix</code>, <code>f1_score</code>, <code>roc_auc_score</code> and <code>KFold</code>, which also run here.)</p><ol><li>Threshold the scores at 0.5 (score ≥ 0.5 means class 1) and count TP, FP, FN, TN.</li><li>Print accuracy, precision, recall and F1 with 3 decimals.</li><li>Compute ROC-AUC as the fraction of (positive, negative) pairs where the positive has the higher score (ties count 0.5).</li><li><code>kfold(n, k)</code>: return the test indices of each fold the way <code>KFold(n_splits=k)</code> does without shuffling (contiguous blocks; the first n % k folds get one extra sample). Print them for n = 10, k = 3.</li></ol><p>Expected output:</p><pre><code>TP=4 FP=2 FN=1 TN=3\naccuracy=0.700\nprecision=0.667\nrecall=0.800\nf1=0.727\nauc=0.880\nfold 0: [0, 1, 2, 3]\nfold 1: [4, 5, 6]\nfold 2: [7, 8, 9]</code></pre>",
   "starter": "y = [1, 0, 1, 1, 0, 0, 1, 0, 1, 0]\nscores = [0.9, 0.4, 0.65, 0.3, 0.2, 0.55, 0.8, 0.1, 0.7, 0.6]\n\npred = [1 if s >= 0.5 else 0 for s in scores]\n# TODO: count TP, FP, FN, TN by comparing pred and y\ntp = fp = fn = tn = 0\nprint(f\"TP={tp} FP={fp} FN={fn} TN={tn}\")\n\n# TODO: metrics\nacc = prec = rec = f1 = 0.0\nprint(f\"accuracy={acc:.3f}\")\nprint(f\"precision={prec:.3f}\")\nprint(f\"recall={rec:.3f}\")\nprint(f\"f1={f1:.3f}\")\n\npos = [s for s, t in zip(scores, y) if t == 1]\nneg = [s for s, t in zip(scores, y) if t == 0]\n# TODO: fraction of correctly ordered (pos, neg) pairs, ties count 0.5\nauc = 0.0\nprint(f\"auc={auc:.3f}\")\n\ndef kfold(n, k):\n    # TODO: list of k lists of test indices\n    return []\n\nfor i, fold in enumerate(kfold(10, 3)):\n    print(f\"fold {i}: {fold}\")\n",
   "expected": "TP=4 FP=2 FN=1 TN=3\naccuracy=0.700\nprecision=0.667\nrecall=0.800\nf1=0.727\nauc=0.880\nfold 0: [0, 1, 2, 3]\nfold 1: [4, 5, 6]\nfold 2: [7, 8, 9]",
   "solution": "y = [1, 0, 1, 1, 0, 0, 1, 0, 1, 0]\nscores = [0.9, 0.4, 0.65, 0.3, 0.2, 0.55, 0.8, 0.1, 0.7, 0.6]\n\npred = [1 if s >= 0.5 else 0 for s in scores]\npairs = list(zip(pred, y))\ntp = pairs.count((1, 1))\nfp = pairs.count((1, 0))\nfn = pairs.count((0, 1))\ntn = pairs.count((0, 0))\nprint(f\"TP={tp} FP={fp} FN={fn} TN={tn}\")\n\nacc = (tp + tn) / len(y)\nprec = tp / (tp + fp)\nrec = tp / (tp + fn)\nf1 = 2 * prec * rec / (prec + rec)\nprint(f\"accuracy={acc:.3f}\")\nprint(f\"precision={prec:.3f}\")\nprint(f\"recall={rec:.3f}\")\nprint(f\"f1={f1:.3f}\")\n\npos = [s for s, t in zip(scores, y) if t == 1]\nneg = [s for s, t in zip(scores, y) if t == 0]\nwins = sum(1.0 if p > q else 0.5 if p == q else 0.0 for p in pos for q in neg)\nauc = wins / (len(pos) * len(neg))\nprint(f\"auc={auc:.3f}\")\n\ndef kfold(n, k):\n    folds, start = [], 0\n    for i in range(k):\n        size = n // k + (1 if i < n % k else 0)\n        folds.append(list(range(start, start + size)))\n        start += size\n    return folds\n\nfor i, fold in enumerate(kfold(10, 3)):\n    print(f\"fold {i}: {fold}\")\n",
   "hint": "zip(pred, y) gives (prediction, truth) pairs; (1, 0) is a false positive. For AUC, loop over every (pos, neg) pair."
  },
  "quiz": [
   {
    "q": "You scale the full dataset with StandardScaler, then split into train and test. What is wrong?",
    "options": [
     "Nothing, scaling never changes results",
     "The test set's statistics leaked into training, so the test score is optimistic",
     "StandardScaler only works on test data",
     "Logistic regression cannot use scaled features"
    ],
    "answer": 1,
    "why": "Fit preprocessing on training data only. A pipeline inside cross-validation does this for you."
   },
   {
    "q": "In a cancer screening model, which metric directly measures how many real cases were missed?",
    "options": [
     "Precision",
     "Accuracy",
     "Recall",
     "ROC-AUC"
    ],
    "answer": 2,
    "why": "Recall = TP / (TP + FN). A low recall means many false negatives, which are missed cases."
   },
   {
    "q": "Training accuracy is 99% and validation accuracy is 78%, and the gap stays wide as you add data. What is happening?",
    "options": [
     "The model overfits (high variance)",
     "The model underfits (high bias)",
     "The validation set is too easy",
     "The learning rate is too low"
    ],
    "answer": 0,
    "why": "A large train/validation gap is the signature of overfitting. Regularise, simplify the model, or get more data."
   },
   {
    "q": "Why should hyperparameters be tuned with cross-validation on the training data, not on the test set?",
    "options": [
     "The test set is too small to train on",
     "GridSearchCV cannot read the test set",
     "Cross-validation is always faster",
     "Tuning on the test set makes its score a biased estimate of real performance"
    ],
    "answer": 3,
    "why": "Whatever you select based on a dataset is fitted to it. Keep the test set untouched until the final evaluation."
   }
  ]
 },
 "5.1": {
  "minutes": 45,
  "learn": "\n<p>Experiment results, labels and metadata usually live in tables. SQL lets you ask questions like \"best run per model\" in one line instead of a loop over CSV files. SQLite is a full SQL database in a single file and ships with Python as <code>sqlite3</code>.</p>\n\n<h3>Tables and SELECT</h3>\n<pre><code>CREATE TABLE runs (\n  run_id    INTEGER PRIMARY KEY,\n  model     TEXT NOT NULL,\n  config_id INTEGER REFERENCES configs(config_id),\n  val_acc   REAL\n);\n\nSELECT model, val_acc FROM runs\nWHERE val_acc &gt; 0.8 AND model != 'mlp'\nORDER BY val_acc DESC\nLIMIT 3;</code></pre>\n<p>Read a query in the order the database runs it: <code>FROM</code> (which table) → <code>WHERE</code> (filter rows) → <code>GROUP BY</code> → <code>HAVING</code> → <code>SELECT</code> (pick columns) → <code>ORDER BY</code> → <code>LIMIT</code>.</p>\n\n<h3>Aggregates and GROUP BY</h3>\n<p><code>COUNT</code>, <code>SUM</code>, <code>AVG</code>, <code>MIN</code>, <code>MAX</code> collapse many rows into one. <code>GROUP BY</code> makes one output row per group:</p>\n<pre><code>SELECT model, MAX(val_acc) AS best, COUNT(*) AS n\nFROM runs\nGROUP BY model\nHAVING COUNT(*) &gt;= 2;        -- HAVING filters groups, WHERE filters rows</code></pre>\n<p>Every column in <code>SELECT</code> should be either in <code>GROUP BY</code> or inside an aggregate. To get the whole best <i>row</i> per model (its run_id too), use a window function:</p>\n<pre><code>SELECT run_id, model, val_acc FROM (\n  SELECT *, ROW_NUMBER() OVER (PARTITION BY model ORDER BY val_acc DESC) AS rk\n  FROM runs)\nWHERE rk = 1;</code></pre>\n\n<h3>JOIN</h3>\n<p>Keep each fact in one place: hyperparameters in <code>configs</code>, results in <code>runs</code>, linked by <code>config_id</code>. A join puts them back together:</p>\n<pre><code>SELECT r.run_id, r.model, c.lr, c.batch, r.val_acc\nFROM runs r\nJOIN configs c ON r.config_id = c.config_id;</code></pre>\n<p><code>JOIN</code> (inner) keeps only rows with a match on both sides. <code>LEFT JOIN</code> keeps every row of the left table and fills missing right-side columns with <code>NULL</code>, which is useful for finding configs that were never run: <code>... LEFT JOIN runs ... WHERE r.run_id IS NULL</code>.</p>\n\n<h3>NULL</h3>\n<p><code>NULL</code> means unknown. Any comparison with it is unknown too, so <code>WHERE val_acc = NULL</code> matches nothing. Use <code>IS NULL</code> / <code>IS NOT NULL</code>. Aggregates like <code>AVG</code> skip NULLs.</p>\n\n<h3>From Python</h3>\n<pre><code>import sqlite3\ndb = sqlite3.connect(\"runs.db\")\ndb.execute(\"INSERT INTO runs (model, config_id, val_acc) VALUES (?, ?, ?)\",\n           (\"cnn\", 2, 0.88))\ndb.commit()\nfor row in db.execute(\"SELECT model, MAX(val_acc) FROM runs GROUP BY model\"):\n    print(row)</code></pre>\n<p>Always pass values with <code>?</code> placeholders, never by formatting them into the SQL string. Placeholders handle quoting and prevent SQL injection. <code>pandas.read_sql(query, db)</code> returns the result as a DataFrame.</p>\n<blockquote>Common mistake: putting an aggregate condition in WHERE, as in <code>WHERE COUNT(*) &gt; 1</code>. WHERE runs before grouping, so aggregates belong in HAVING.</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "sql",
   "prompt": "<p>The starter creates a <code>configs</code> table and a <code>runs</code> table. Write three queries, in this order:</p><ol><li>Per model: the best <code>val_acc</code> as <code>best</code> and the run count as <code>n</code>, best model first.</li><li>Join runs with configs and list <code>run_id, model, lr, batch, val_acc</code> for runs with val_acc ≥ 0.86, highest first.</li><li>Average val_acc per batch size, rounded to 3 decimals, as <code>avg_acc</code>, ordered by batch.</li></ol><p>Expected output:</p><pre><code>model | best | n\nvit | 0.91 | 2\ncnn | 0.88 | 3\nmlp | 0.79 | 2\n\nrun_id | model | lr | batch | val_acc\n6 | vit | 0.003 | 64 | 0.91\n2 | cnn | 0.001 | 32 | 0.88\n7 | vit | 0.001 | 32 | 0.87\n3 | cnn | 0.003 | 64 | 0.86\n\nbatch | avg_acc\n32 | 0.82\n64 | 0.885</code></pre>",
   "starter": "CREATE TABLE configs (config_id INTEGER PRIMARY KEY, lr REAL, batch INTEGER);\nINSERT INTO configs VALUES (1, 0.01, 32), (2, 0.001, 32), (3, 0.003, 64);\n\nCREATE TABLE runs (run_id INTEGER PRIMARY KEY, model TEXT, config_id INTEGER, val_acc REAL);\nINSERT INTO runs VALUES\n  (1, 'cnn', 1, 0.82), (2, 'cnn', 2, 0.88), (3, 'cnn', 3, 0.86),\n  (4, 'mlp', 1, 0.74), (5, 'mlp', 2, 0.79),\n  (6, 'vit', 3, 0.91), (7, 'vit', 2, 0.87);\n\n-- TODO 1: best val_acc and run count per model\n\n-- TODO 2: join runs and configs, val_acc >= 0.86\n\n-- TODO 3: average val_acc per batch size\n",
   "expected": "model | best | n\nvit | 0.91 | 2\ncnn | 0.88 | 3\nmlp | 0.79 | 2\n\nrun_id | model | lr | batch | val_acc\n6 | vit | 0.003 | 64 | 0.91\n2 | cnn | 0.001 | 32 | 0.88\n7 | vit | 0.001 | 32 | 0.87\n3 | cnn | 0.003 | 64 | 0.86\n\nbatch | avg_acc\n32 | 0.82\n64 | 0.885",
   "solution": "CREATE TABLE configs (config_id INTEGER PRIMARY KEY, lr REAL, batch INTEGER);\nINSERT INTO configs VALUES (1, 0.01, 32), (2, 0.001, 32), (3, 0.003, 64);\n\nCREATE TABLE runs (run_id INTEGER PRIMARY KEY, model TEXT, config_id INTEGER, val_acc REAL);\nINSERT INTO runs VALUES\n  (1, 'cnn', 1, 0.82), (2, 'cnn', 2, 0.88), (3, 'cnn', 3, 0.86),\n  (4, 'mlp', 1, 0.74), (5, 'mlp', 2, 0.79),\n  (6, 'vit', 3, 0.91), (7, 'vit', 2, 0.87);\n\nSELECT model, MAX(val_acc) AS best, COUNT(*) AS n\nFROM runs GROUP BY model ORDER BY best DESC;\n\nSELECT r.run_id, r.model, c.lr, c.batch, r.val_acc\nFROM runs r JOIN configs c ON r.config_id = c.config_id\nWHERE r.val_acc >= 0.86 ORDER BY r.val_acc DESC;\n\nSELECT c.batch, ROUND(AVG(r.val_acc), 3) AS avg_acc\nFROM runs r JOIN configs c ON r.config_id = c.config_id\nGROUP BY c.batch ORDER BY c.batch;\n",
   "hint": "Name result columns with AS so the headers match. Query 3 needs the join too, because batch lives in configs."
  },
  "quiz": [
   {
    "q": "Which query returns models that have more than 2 runs?",
    "options": [
     "SELECT model FROM runs WHERE COUNT(*) > 2 GROUP BY model",
     "SELECT model FROM runs GROUP BY model HAVING COUNT(*) > 2",
     "SELECT model FROM runs HAVING model > 2",
     "SELECT COUNT(model > 2) FROM runs"
    ],
    "answer": 1,
    "why": "Conditions on aggregates go in HAVING, which runs after GROUP BY. WHERE filters individual rows before grouping."
   },
   {
    "q": "You want every config, including ones with no runs yet. Which join?",
    "options": [
     "configs JOIN runs",
     "runs JOIN configs",
     "configs LEFT JOIN runs",
     "configs CROSS JOIN runs"
    ],
    "answer": 2,
    "why": "LEFT JOIN keeps all rows of the left table; configs without runs get NULL in the run columns."
   },
   {
    "q": "Why does WHERE val_acc = NULL return no rows even when some val_acc values are missing?",
    "options": [
     "Comparisons with NULL are unknown, never true; use IS NULL",
     "SQLite does not support NULL",
     "NULL values are deleted on insert",
     "You must write 'NULL' in quotes"
    ],
    "answer": 0,
    "why": "NULL means unknown, so = NULL is never true. IS NULL is the correct test."
   },
   {
    "q": "Why use db.execute(\"... VALUES (?, ?)\", (a, b)) instead of an f-string with the values?",
    "options": [
     "f-strings are slower",
     "SQLite rejects f-strings",
     "It is required for SELECT only",
     "Placeholders quote values safely and prevent SQL injection"
    ],
    "answer": 3,
    "why": "Values containing quotes or SQL fragments cannot change the query when passed as parameters."
   }
  ]
 },
 "5.2": {
  "minutes": 35,
  "learn": "\n<p>MATLAB is common in engineering courses, signal processing and imaging labs. If you know NumPy, most of it maps one to one; the differences that bite are indexing and the operators.</p>\n\n<h3>Matrices are the default type</h3>\n<pre><code>A = [1 2 3; 4 5 6]     % 2×3 matrix: spaces/commas separate columns, ; separates rows\nv = 1:5                % row vector [1 2 3 4 5], end value INCLUDED\nw = 0:0.25:1           % start:step:stop\nZ = zeros(3, 4);       % semicolon at the end suppresses printing\nsize(A)                % [2 3]\nnumel(A)               % 6</code></pre>\n\n<h3>Indexing: 1-based and inclusive</h3>\n<pre><code>A(1, 1)       % first element (NumPy: A[0, 0])\nA(2, :)       % whole second row (NumPy: A[1, :])\nA(:, end)     % last column (NumPy: A[:, -1])\nA(1, 2:3)     % columns 2 and 3 (NumPy: A[0, 1:3])\nA(A &gt; 3)      % logical indexing, returns a column vector</code></pre>\n<p>Indexing uses round brackets, the same as function calls. <code>end</code> inside an index means the last position.</p>\n\n<h3>Matrix vs element-wise operators</h3>\n<p>In MATLAB the plain operators are <b>matrix</b> operations. Add a dot for element-wise:</p>\n<table>\n<tr><th>MATLAB</th><th>NumPy</th><th>Meaning</th></tr>\n<tr><td><code>A * B</code></td><td><code>A @ B</code></td><td>matrix multiply</td></tr>\n<tr><td><code>A .* B</code></td><td><code>A * B</code></td><td>element-wise multiply</td></tr>\n<tr><td><code>A ./ B</code></td><td><code>A / B</code></td><td>element-wise divide</td></tr>\n<tr><td><code>A .^ 2</code></td><td><code>A ** 2</code></td><td>element-wise power</td></tr>\n<tr><td><code>A'</code></td><td><code>A.conj().T</code></td><td>conjugate transpose (<code>A.'</code> is a plain transpose)</td></tr>\n</table>\n<p>Reductions work along the first dimension (columns) by default: <code>sum(A)</code> gives column sums, like <code>A.sum(axis=0)</code>. Use <code>sum(A, 2)</code> for row sums and <code>sum(A, 'all')</code> for everything.</p>\n\n<h3>Scripts, functions and control flow</h3>\n<pre><code>function y = relu(x)       % save as relu.m, or at the end of a script\n    y = max(x, 0);\nend\n\nfor k = 1:10\n    if mod(k, 2) == 0\n        fprintf('%d is even\\n', k);\n    end\nend</code></pre>\n<p>Blocks close with <code>end</code>, not indentation. <code>~=</code> means \"not equal\", and comments start with <code>%</code>.</p>\n\n<h3>Images</h3>\n<p>The Image Processing Toolbox covers most lab tasks:</p>\n<pre><code>I = imread('cells.png');          % uint8 array, H×W or H×W×3\nG = rgb2gray(I);\nJ = imgaussfilt(G, 2);            % Gaussian blur, sigma = 2\nK = imfilter(G, fspecial('average', 5));   % 5×5 mean filter\nimshow(J); title('Blurred');\nD = im2double(G);                 % convert to double in [0, 1] before arithmetic</code></pre>\n<p><code>uint8</code> arithmetic saturates: <code>uint8(200) + uint8(100)</code> is 255, not 300. Convert with <code>im2double</code> before doing maths on pixels.</p>\n\n<h3>Porting from NumPy</h3>\n<p>Go line by line: shift every index by one, make ranges inclusive, swap <code>*</code> ↔ <code>.*</code> and <code>@</code> ↔ <code>*</code>, and replace <code>axis=0/1</code> with dimension <code>1/2</code>. Pre-allocate arrays with <code>zeros</code> before filling them in a loop; growing an array inside a loop is slow, and vectorised code is usually fastest, just like in NumPy.</p>\n<blockquote>Common mistake: writing <code>A * B</code> when you meant element-wise. For two 3×3 matrices it silently computes a matrix product; for a 2×3 and a 2×3 it errors.</blockquote>\n",
  "practice": {
   "type": "fill",
   "prompt": "<p>MATLAB does not run in the browser, so translate each task into a MATLAB expression. Write the expression only, without assigning it to a variable (a trailing semicolon is fine).</p>",
   "items": [
    {
     "q": "A 3×4 matrix of zeros.",
     "accept": [
      "zeros(3, 4)",
      "zeros(3, 4);",
      "zeros(3,4)",
      "zeros(3,4);"
     ],
     "hint": "zeros(rows, cols)"
    },
    {
     "q": "The whole second row of matrix A (NumPy: A[1, :]).",
     "accept": [
      "A(2, :)",
      "A(2, :);",
      "A(2,:)",
      "A(2,:);",
      "A(2, 1:end)",
      "A(2, 1:end);",
      "A(2,1:end)",
      "A(2,1:end);"
     ],
     "hint": "1-based, round brackets, colon for all columns"
    },
    {
     "q": "The last column of A (NumPy: A[:, -1]).",
     "accept": [
      "A(:, end)",
      "A(:, end);",
      "A(:,end)",
      "A(:,end);"
     ],
     "hint": "Use the end keyword."
    },
    {
     "q": "Element-wise product of A and B (NumPy: A * B).",
     "accept": [
      "A .* B",
      "A .* B;",
      "A.*B",
      "A.*B;",
      "times(A, B)",
      "times(A, B);",
      "times(A,B)",
      "times(A,B);"
     ],
     "hint": "Dot before the operator."
    },
    {
     "q": "Matrix product of A and B (NumPy: A @ B).",
     "accept": [
      "A * B",
      "A * B;",
      "A*B",
      "A*B;",
      "mtimes(A, B)",
      "mtimes(A, B);",
      "mtimes(A,B)",
      "mtimes(A,B);"
     ],
     "hint": "The plain operator."
    },
    {
     "q": "Row vector of the integers 1 to 10 (NumPy: np.arange(1, 11)).",
     "accept": [
      "1:10",
      "1:10;",
      "[1:10]",
      "[1:10];",
      "(1:10)",
      "(1:10);"
     ],
     "hint": "start:stop, stop is included"
    },
    {
     "q": "Row sums of A (NumPy: A.sum(axis=1)).",
     "accept": [
      "sum(A, 2)",
      "sum(A, 2);",
      "sum(A,2)",
      "sum(A,2);"
     ],
     "hint": "Dimension 2 runs across columns."
    },
    {
     "q": "Gaussian blur of image I with sigma 2 (Image Processing Toolbox).",
     "accept": [
      "imgaussfilt(I, 2)",
      "imgaussfilt(I, 2);",
      "imgaussfilt(I,2)",
      "imgaussfilt(I,2);"
     ],
     "hint": "imgauss..."
    }
   ]
  },
  "quiz": [
   {
    "q": "What does v = 2:5 contain?",
    "options": [
     "[2 3 4]",
     "[2 3 4 5]",
     "[3 4 5]",
     "[2 5]"
    ],
    "answer": 1,
    "why": "MATLAB ranges include the end value."
   },
   {
    "q": "A and B are both 3×3. What does A * B compute in MATLAB?",
    "options": [
     "The matrix product",
     "The element-wise product",
     "An error",
     "The dot product of the first columns"
    ],
    "answer": 0,
    "why": "Plain * is matrix multiplication. Element-wise needs .*"
   },
   {
    "q": "In MATLAB, what does sum(A) return for a 4×3 matrix A?",
    "options": [
     "A single number",
     "A 4×1 column of row sums",
     "A 1×3 row of column sums",
     "A 4×3 matrix"
    ],
    "answer": 2,
    "why": "Reductions work along dimension 1 by default, which gives one sum per column."
   },
   {
    "q": "You add 100 to every pixel of a uint8 image and bright areas turn flat white. Why?",
    "options": [
     "imread loads images upside down",
     "imshow rescales automatically",
     "MATLAB arrays are 1-based",
     "uint8 arithmetic saturates at 255"
    ],
    "answer": 3,
    "why": "Integer image types clip at their maximum. Convert with im2double before doing maths on pixels."
   }
  ]
 }
});
