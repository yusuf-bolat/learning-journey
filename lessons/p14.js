// Phase 14 lesson content. Generated; verified practice solutions.
Object.assign(LESSONS,{
 "14.0": {
  "minutes": 50,
  "learn": "\n<p>A pretrained language model is a general next-token predictor. Your workflow wants something narrower: answers from <i>your</i> documents, correct multi-step maths, a house writing style, or a reliable \"approve / reject / escalate\" decision. Adapting a model means changing some part of the system until it does that one job well. This phase works through it from first principles: <b>what the task demands, which part of the system to change, how to measure it, and what it costs</b>.</p>\n\n<h3>The parts you can change</h3>\n<p>Every LLM system has the same parts, and each adaptation technique changes one of them:</p>\n<ul>\n<li><b>Context</b> (prompt, examples, instructions): free to change, no training.</li>\n<li><b>Knowledge source</b> (retrieval over a corpus): changes what facts the model can see at answer time.</li>\n<li><b>Weights</b> (fine-tuning: full, LoRA, QLoRA): changes behaviour, format and skill.</li>\n<li><b>Objective</b> (next-token loss, preference loss, reward): changes <i>what \"good\" means</i> during training.</li>\n<li><b>Decoding</b> (temperature, sampling, number of samples, verifiers): changes how output is produced from the same weights.</li>\n<li><b>Serving</b> (quantisation, batching, caching): changes cost and latency, not quality (ideally).</li>\n</ul>\n\n<h3>The ladder: climb only as high as needed</h3>\n<ol>\n<li><b>Prompting.</b> Clear instructions, a few worked examples, an output schema. Always the baseline.</li>\n<li><b>RAG.</b> If the model fails because it <i>does not know</i> something (private, recent or long-tail facts), give it the facts at query time.</li>\n<li><b>Fine-tuning.</b> If it fails because of <i>behaviour</i>: wrong format, wrong tone, ignores context, poor tool calls, a skill it does almost right. Usually LoRA on a few hundred to a few thousand examples.</li>\n<li><b>Training / continued pretraining.</b> Only for a new language or domain vocabulary with lots of raw text, and real budget.</li>\n</ol>\n<p>The key diagnostic question is: <b>is this a knowledge problem or a behaviour problem?</b> Fine-tuning is a poor way to add facts (they are hard to update, and the model may confidently blend them); retrieval is a poor way to fix format. Many systems use both.</p>\n\n<h3>Build the eval set first</h3>\n<p>Before changing anything, write 50 real inputs with what a good output looks like, plus a scoring rule (exact match, a regex, a unit test, or a rubric for a judge). Without it you cannot tell whether a rung helped. Keep it frozen; never train on it.</p>\n<pre><code>EVAL = [{\"input\": \"Refund for order 1182, item arrived broken\", \"expect\": {\"action\": \"refund\", \"reason\": \"damaged\"}}, ...]\n\ndef score(pred, expect):\n    return float(pred.get(\"action\") == expect[\"action\"])\n\nacc = sum(score(run_system(x[\"input\"]), x[\"expect\"]) for x in EVAL) / len(EVAL)</code></pre>\n\n<h3>LoRA from first principles</h3>\n<p>Full fine-tuning updates every weight matrix <code>W</code> (size <code>d_out x d_in</code>) and needs optimizer state for each. LoRA (Hu et al., 2021) observes that the <i>change</i> needed for a task is usually low-rank, so it freezes <code>W</code> and learns <code>W' = W + (alpha/r) * B A</code>, where <code>A</code> is <code>r x d_in</code> and <code>B</code> is <code>d_out x r</code> with small <code>r</code> (4 to 64). Trainable parameters per matrix drop from <code>d_out*d_in</code> to <code>r*(d_in + d_out)</code>.</p>\n<p><code>B</code> is initialised to zero, so at step 0 the model is <i>exactly</i> the base model: training starts from known behaviour. After training, <code>BA</code> can be merged into <code>W</code>, so inference costs nothing extra.</p>\n<pre><code>import torch, torch.nn as nn\n\nclass LoRALinear(nn.Module):\n    def __init__(self, base: nn.Linear, r=8, alpha=16):\n        super().__init__()\n        self.base = base\n        for p in self.base.parameters():\n            p.requires_grad = False                     # frozen W\n        self.A = nn.Parameter(torch.randn(r, base.in_features) * 0.01)\n        self.B = nn.Parameter(torch.zeros(base.out_features, r))   # zero init\n        self.scale = alpha / r\n\n    def forward(self, x):\n        return self.base(x) + (x @ self.A.T @ self.B.T) * self.scale</code></pre>\n<p>In practice you use PEFT, which wraps the named modules for you:</p>\n<pre><code>from transformers import AutoModelForCausalLM\nfrom peft import LoraConfig, get_peft_model\n\nmodel = AutoModelForCausalLM.from_pretrained(\"Qwen/Qwen2.5-0.5B-Instruct\", torch_dtype=torch.bfloat16)\ncfg = LoraConfig(r=16, lora_alpha=32, lora_dropout=0.05,\n                 target_modules=[\"q_proj\", \"k_proj\", \"v_proj\", \"o_proj\"], task_type=\"CAUSAL_LM\")\nmodel = get_peft_model(model, cfg)\nmodel.print_trainable_parameters()   # a small fraction of a percent of all weights</code></pre>\n\n<h3>Why memory drops so much</h3>\n<p>A common rule of thumb for mixed-precision Adam is about 16 bytes per <i>trainable</i> parameter: 2 (bf16 weight) + 2 (gradient) + 4 (fp32 master copy) + 8 (two Adam moments). Frozen parameters need only their storage: 2 bytes in bf16, about 0.5 bytes in 4-bit (QLoRA). Activations come on top and depend on batch and sequence length. So a 7B model needs over 100 GB to fully fine-tune but roughly 15 GB with LoRA, and less with QLoRA. The practice computes these numbers.</p>\n\n<blockquote>Common mistake: fine-tuning to teach the model facts (\"our refund window is 30 days\"). It may learn the sentence but not when to use it, and you must retrain every time the policy changes. Put facts in retrieval; use fine-tuning for how to answer.</blockquote>\n\n<h3>How to evaluate it</h3>\n<p>Run base, prompted and LoRA models on the same frozen eval set and report the same metric, plus cost (tokens per answer, latency). Keep a few general prompts too, to catch the model forgetting other skills. A rung is worth it only if it beats the cheaper rung below it by more than the noise between runs.</p>\n",
  "practice": {
   "type": "code",
   "lang": "python",
   "prompt": "<p>A 7B-parameter model has 32 layers with <code>d_model = 4096</code>. LoRA (rank 16) is applied to the four attention projections q, k, v, o in every layer, each a 4096 x 4096 matrix. Compute (1) the parameters in those target matrices and the LoRA parameters (with percentage), (2) training memory in GB (1 GB = 1e9 bytes, weights + gradients + optimizer only) using 16 bytes per trainable parameter, 2 bytes per frozen bf16 parameter and 0.5 bytes per frozen 4-bit parameter, for full fine-tune, LoRA and QLoRA. (3) In NumPy, show that with <code>B = 0</code> the LoRA weight equals <code>W</code>, and that after setting <code>B</code> the update <code>B @ A</code> has rank at most <code>r</code>. Use the deterministic matrices in the starter.</p><p>Expected output:</p><pre><code>target params: 2,147,483,648\nLoRA params:   16,777,216 (0.781% of targets)\nfull fine-tune: 112.0 GB\nLoRA (bf16):    14.27 GB\nQLoRA (4-bit):  3.77 GB\nB=0: max|W_lora - W| = 0.0\nupdate rank = 2 (r = 2), full rank would be 5\nmax|update| = 2.757</code></pre>",
   "starter": "import numpy as np\n\nP_TOTAL = 7_000_000_000\nLAYERS, D, R, MATS = 32, 4096, 16, 4\n\n# (1) parameter counts\nfull_targets = 0      # TODO: params in all q,k,v,o matrices\nlora = 0              # TODO: r*(d_in+d_out) per matrix, all matrices\nprint(f\"target params: {full_targets:,}\")\nprint(f\"LoRA params:   {lora:,} ({0:.3f}% of targets)\")\n\n# (2) memory in GB\n# TODO: full = all params trainable; LoRA = frozen bf16 + trainable LoRA; QLoRA = frozen 4-bit + trainable LoRA\n\n# (3) tiny LoRA in NumPy\nd_out, d_in, r, alpha = 6, 5, 2, 4\nW = np.arange(d_out * d_in, dtype=float).reshape(d_out, d_in) / 10\nA = np.cos(np.arange(r * d_in, dtype=float)).reshape(r, d_in)\nB = np.zeros((d_out, r))\n# TODO: W_lora = W + (alpha/r) * B @ A ; print max abs difference to W\nB = np.sin(np.arange(d_out * r, dtype=float) + 1).reshape(d_out, r)\n# TODO: print rank of the update and max abs entry of the scaled update\n",
   "expected": "target params: 2,147,483,648\nLoRA params:   16,777,216 (0.781% of targets)\nfull fine-tune: 112.0 GB\nLoRA (bf16):    14.27 GB\nQLoRA (4-bit):  3.77 GB\nB=0: max|W_lora - W| = 0.0\nupdate rank = 2 (r = 2), full rank would be 5\nmax|update| = 2.757",
   "solution": "import numpy as np\n\nP_TOTAL = 7_000_000_000\nLAYERS, D, R, MATS = 32, 4096, 16, 4\n\nfull_targets = LAYERS * MATS * D * D\nlora = LAYERS * MATS * R * (D + D)\nprint(f\"target params: {full_targets:,}\")\nprint(f\"LoRA params:   {lora:,} ({100 * lora / full_targets:.3f}% of targets)\")\n\nfull_gb = P_TOTAL * 16 / 1e9\nlora_gb = (P_TOTAL * 2 + lora * 16) / 1e9\nqlora_gb = (P_TOTAL * 0.5 + lora * 16) / 1e9\nprint(f\"full fine-tune: {full_gb:.1f} GB\")\nprint(f\"LoRA (bf16):    {lora_gb:.2f} GB\")\nprint(f\"QLoRA (4-bit):  {qlora_gb:.2f} GB\")\n\nd_out, d_in, r, alpha = 6, 5, 2, 4\nW = np.arange(d_out * d_in, dtype=float).reshape(d_out, d_in) / 10\nA = np.cos(np.arange(r * d_in, dtype=float)).reshape(r, d_in)\nB = np.zeros((d_out, r))\nW_lora = W + (alpha / r) * B @ A\nprint(f\"B=0: max|W_lora - W| = {float(np.abs(W_lora - W).max()):.1f}\")\nB = np.sin(np.arange(d_out * r, dtype=float) + 1).reshape(d_out, r)\ndelta = (alpha / r) * B @ A\nprint(f\"update rank = {int(np.linalg.matrix_rank(delta))} (r = {r}), full rank would be {min(d_out, d_in)}\")\nprint(f\"max|update| = {float(np.abs(delta).max()):.3f}\")\n",
   "hint": "Per matrix LoRA adds A (r x d_in) and B (d_out x r). For memory, only LoRA parameters pay the 16 bytes; the 7B frozen weights pay 2 or 0.5 bytes."
  },
  "quiz": [
   {
    "q": "Your support bot gives answers in the right format but quotes last year's refund policy. Which rung fixes the root cause?",
    "options": [
     "Full fine-tune on this year's policy",
     "Lower the temperature",
     "Retrieval over the current policy documents",
     "Increase LoRA rank"
    ],
    "answer": 2,
    "why": "It is a knowledge problem, and the facts change. Retrieval supplies current facts at query time; fine-tuning would bake in another version that also goes stale."
   },
   {
    "q": "Why is LoRA's B matrix initialised to zero?",
    "options": [
     "So BA = 0 and the adapted model starts exactly equal to the base model",
     "To save memory",
     "Because zero gradients make training stable",
     "So the rank of BA is zero forever"
    ],
    "answer": 0,
    "why": "With B = 0 the update is zero at step 0, so training starts from the base model's behaviour. Gradients to B are non-zero because A is random, so it learns."
   },
   {
    "q": "Why does LoRA cut training memory far more than it cuts the forward-pass compute?",
    "options": [
     "LoRA skips the attention layers",
     "LoRA uses 1-bit weights",
     "LoRA removes activations",
     "Gradients and Adam state are kept only for the small trainable matrices, while the frozen weights still run in every forward pass"
    ],
    "answer": 3,
    "why": "Optimizer state and gradients (about 14 of the 16 bytes per parameter) disappear for frozen weights. The full forward and backward through W still happen."
   },
   {
    "q": "What should exist before you try any adaptation rung?",
    "options": [
     "A GPU cluster",
     "A frozen eval set with a scoring rule and a prompting baseline",
     "A reward model",
     "A 10,000-example training set"
    ],
    "answer": 1,
    "why": "Without a fixed eval set and baseline you cannot tell whether RAG or fine-tuning helped, or by how much."
   }
  ]
 },
 "14.1": {
  "minutes": 55,
  "learn": "\n<p>Once you have decided to fine-tune, most of the quality comes from three things: data in exactly the format the model will see at inference, a loss on the right tokens, and a small careful sweep with early stopping on held-out loss.</p>\n\n<h3>Format the data with the model's chat template</h3>\n<p>Instruction-tuned models were trained with special tokens marking system, user and assistant turns. If you fine-tune with a different layout than you serve with, the model sees a distribution it was never trained on. Let the tokenizer build the string:</p>\n<pre><code>from transformers import AutoTokenizer\ntok = AutoTokenizer.from_pretrained(\"Qwen/Qwen2.5-0.5B-Instruct\")\n\nexample = [{\"role\": \"system\", \"content\": \"Answer in one JSON object.\"},\n           {\"role\": \"user\", \"content\": \"Order 1182 arrived broken.\"},\n           {\"role\": \"assistant\", \"content\": '{\"action\": \"refund\", \"reason\": \"damaged\"}'}]\ntext = tok.apply_chat_template(example, tokenize=False)\nprompt = tok.apply_chat_template(example[:-1], tokenize=False, add_generation_prompt=True)</code></pre>\n\n<h3>Put the loss on the answer, not the prompt</h3>\n<p>Supervised fine-tuning (SFT) is still next-token cross-entropy. But you want the model to learn to <i>produce</i> answers, not to predict the user's question. Set the label of every prompt token to <code>-100</code>, which PyTorch's cross-entropy ignores:</p>\n<pre><code>ids = tok(text)[\"input_ids\"]\nn_prompt = len(tok(prompt)[\"input_ids\"])\nlabels = [-100] * n_prompt + ids[n_prompt:]</code></pre>\n<p>TRL's <code>SFTTrainer</code> can do this for you (completion-only or assistant-only loss); check the option names for your TRL version.</p>\n\n<h3>The hyperparameters that matter</h3>\n<ul>\n<li><b>Learning rate</b>: the biggest lever. LoRA typically uses a larger rate than full fine-tuning (often around 1e-4 to 2e-4 versus 1e-5 or lower), because only small matrices move. Too low underfits; too high gives spikes or collapse.</li>\n<li><b>LoRA rank r and alpha</b>: capacity of the update. Higher r fits more but overfits small data sooner. Many people keep alpha = 2r.</li>\n<li><b>Epochs</b>: with a few hundred examples, 1 to 3 epochs; watch held-out loss.</li>\n<li><b>Effective batch</b> = per-device batch x gradient accumulation x GPUs. Use accumulation when memory is tight.</li>\n<li><b>Warmup and schedule</b>: a short warmup then cosine or linear decay.</li>\n</ul>\n<pre><code>from trl import SFTConfig, SFTTrainer\nfrom transformers import EarlyStoppingCallback\n\nargs = SFTConfig(output_dir=\"out\", learning_rate=2e-4, num_train_epochs=3,\n                 per_device_train_batch_size=4, gradient_accumulation_steps=4,\n                 lr_scheduler_type=\"cosine\", warmup_ratio=0.03,\n                 eval_strategy=\"steps\", eval_steps=50, save_steps=50,\n                 load_best_model_at_end=True, metric_for_best_model=\"eval_loss\")\ntrainer = SFTTrainer(model=model, args=args, train_dataset=train, eval_dataset=val,\n                     peft_config=cfg, callbacks=[EarlyStoppingCallback(early_stopping_patience=2)])\ntrainer.train()</code></pre>\n\n<h3>Sweeps: small and careful beats guessing</h3>\n<p>Hold out 10 to 20% of examples as a validation split (separate from the frozen eval set). Sweep the learning rate on a log scale and a few ranks. Optuna samples configurations and keeps the best:</p>\n<pre><code>import optuna\n\ndef objective(trial):\n    lr = trial.suggest_float(\"lr\", 5e-5, 5e-4, log=True)\n    r = trial.suggest_categorical(\"r\", [8, 16, 32, 64])\n    return train_and_eval(lr=lr, r=r)        # returns best validation loss\n\nstudy = optuna.create_study(direction=\"minimize\")\nstudy.optimize(objective, n_trials=8)\nprint(study.best_params)</code></pre>\n<p><b>Early stopping</b>: track validation loss after each epoch (or every N steps). When it has not improved for <code>patience</code> evaluations, stop and keep the best checkpoint. Training loss falling while validation loss rises is the signature of overfitting.</p>\n\n<h3>QLoRA: fine-tuning in 4-bit</h3>\n<p>QLoRA (Dettmers et al., 2023) stores the frozen base in 4-bit NormalFloat (NF4), dequantises on the fly for each matmul in bf16, and trains LoRA adapters on top. It adds double quantisation of the scale constants and paged optimizers to survive memory spikes. Quality is usually close to 16-bit LoRA, at a fraction of the memory, but each step is slower because of dequantisation.</p>\n<pre><code>from transformers import BitsAndBytesConfig\nfrom peft import prepare_model_for_kbit_training\n\nbnb = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type=\"nf4\",\n                         bnb_4bit_use_double_quant=True, bnb_4bit_compute_dtype=torch.bfloat16)\nmodel = AutoModelForCausalLM.from_pretrained(name, quantization_config=bnb, device_map=\"auto\")\nmodel = prepare_model_for_kbit_training(model)\nprint(torch.cuda.max_memory_allocated() / 1e9, \"GB\")</code></pre>\n\n<h3>Merge and serve</h3>\n<pre><code>from peft import AutoPeftModelForCausalLM\nm = AutoPeftModelForCausalLM.from_pretrained(\"out/best\", torch_dtype=torch.bfloat16)\nm = m.merge_and_unload()              # W := W + (alpha/r) B A\nm.save_pretrained(\"merged\"); tok.save_pretrained(\"merged\")</code></pre>\n<p>Merge into a bf16 copy of the base, not into the 4-bit weights. A merged model serves like any other (vLLM, TGI). Keeping adapters separate instead lets one server host many adapters over one base.</p>\n\n<blockquote>Common mistake: picking the configuration with the best score on the frozen eval set after trying many. That set is now part of training. Choose on the validation split; report on the eval set once.</blockquote>\n\n<h3>How to evaluate it</h3>\n<p>Validation loss tells you when to stop; it does not tell you whether the task works. After choosing a checkpoint, run the task metric on the eval set and compare with the prompted baseline. Record peak memory and step time for LoRA vs QLoRA, and check that the merged model gives the same outputs as base plus adapter on a few prompts.</p>\n",
  "practice": {
   "type": "code",
   "lang": "python",
   "prompt": "<p>Training runs are replaced by a deterministic toy function <code>val_loss(lr, rank, epoch)</code> (low learning rates fit slowly, high rates overfit sooner, larger rank overfits more, and lr 5e-4 adds instability). Grid-search lr in <code>[5e-5, 1e-4, 2e-4, 5e-4]</code> and rank in <code>[8, 32]</code>. For each trial, run epochs 1..10 with early stopping (patience 2: stop once the loss has not improved on the best for 2 consecutive epochs). Print one line per trial with the best epoch, best loss (4 decimals) and the epoch you stopped at, then the best configuration.</p><p>Expected output:</p><pre><code>lr=5e-05 r=8  best_epoch=10 best_loss=1.1750 stopped=10\nlr=5e-05 r=32 best_epoch=10 best_loss=1.1942 stopped=10\nlr=1e-04 r=8  best_epoch=8  best_loss=1.0949 stopped=10\nlr=1e-04 r=32 best_epoch=6  best_loss=1.1799 stopped=8\nlr=2e-04 r=8  best_epoch=4  best_loss=1.0949 stopped=6\nlr=2e-04 r=32 best_epoch=3  best_loss=1.1799 stopped=5\nlr=5e-04 r=8  best_epoch=2  best_loss=1.2618 stopped=4\nlr=5e-04 r=32 best_epoch=1  best_loss=1.3442 stopped=3\nbest: lr=1e-04 r=8 loss=1.0949</code></pre>",
   "starter": "import math\n\ndef val_loss(lr, rank, epoch):\n    s = lr / 1e-4\n    fit = 1.0 + 1.6 * math.exp(-0.45 * s * epoch)\n    over = 0.0008 * rank * max(0.0, s * epoch - 4.0) ** 1.5\n    unstable = 0.15 if s > 4 else 0.0\n    return fit + over + unstable\n\nLRS, RANKS, MAX_EPOCHS, PATIENCE = [5e-5, 1e-4, 2e-4, 5e-4], [8, 32], 10, 2\n\ndef train_with_early_stopping(lr, rank):\n    # TODO: return (best_epoch, best_loss, stopped_epoch)\n    pass\n\nresults = []\nfor lr in LRS:\n    for rank in RANKS:\n        # TODO: run, print \"lr=... r=... best_epoch=.. best_loss=.... stopped=..\", collect\n        pass\n# TODO: print \"best: lr=... r=... loss=....\"\n",
   "expected": "lr=5e-05 r=8  best_epoch=10 best_loss=1.1750 stopped=10\nlr=5e-05 r=32 best_epoch=10 best_loss=1.1942 stopped=10\nlr=1e-04 r=8  best_epoch=8  best_loss=1.0949 stopped=10\nlr=1e-04 r=32 best_epoch=6  best_loss=1.1799 stopped=8\nlr=2e-04 r=8  best_epoch=4  best_loss=1.0949 stopped=6\nlr=2e-04 r=32 best_epoch=3  best_loss=1.1799 stopped=5\nlr=5e-04 r=8  best_epoch=2  best_loss=1.2618 stopped=4\nlr=5e-04 r=32 best_epoch=1  best_loss=1.3442 stopped=3\nbest: lr=1e-04 r=8 loss=1.0949",
   "solution": "import math\n\ndef val_loss(lr, rank, epoch):\n    s = lr / 1e-4\n    fit = 1.0 + 1.6 * math.exp(-0.45 * s * epoch)\n    over = 0.0008 * rank * max(0.0, s * epoch - 4.0) ** 1.5\n    unstable = 0.15 if s > 4 else 0.0\n    return fit + over + unstable\n\nLRS, RANKS, MAX_EPOCHS, PATIENCE = [5e-5, 1e-4, 2e-4, 5e-4], [8, 32], 10, 2\n\ndef train_with_early_stopping(lr, rank):\n    best_loss, best_epoch, bad = float(\"inf\"), 0, 0\n    for epoch in range(1, MAX_EPOCHS + 1):\n        loss = val_loss(lr, rank, epoch)\n        if loss < best_loss:\n            best_loss, best_epoch, bad = loss, epoch, 0\n        else:\n            bad += 1\n            if bad >= PATIENCE:\n                return best_epoch, best_loss, epoch\n    return best_epoch, best_loss, MAX_EPOCHS\n\nresults = []\nfor lr in LRS:\n    for rank in RANKS:\n        be, bl, st = train_with_early_stopping(lr, rank)\n        print(f\"lr={lr:.0e} r={rank:<2} best_epoch={be:<2} best_loss={bl:.4f} stopped={st}\")\n        results.append((bl, lr, rank))\nbl, lr, rank = min(results)\nprint(f\"best: lr={lr:.0e} r={rank} loss={bl:.4f}\")\n",
   "hint": "Keep best_loss and a counter of epochs without improvement; reset the counter on improvement and stop when it reaches patience. min() over (loss, lr, rank) tuples picks the best."
  },
  "quiz": [
   {
    "q": "Why set the labels of prompt tokens to -100 during SFT?",
    "options": [
     "To make sequences shorter",
     "-100 marks padding for the tokenizer",
     "So cross-entropy ignores them and the model learns to produce answers, not to predict user prompts",
     "To prevent the model from reading the prompt"
    ],
    "answer": 2,
    "why": "The model still attends to the prompt; it just is not graded on predicting it. Loss goes only on the tokens you want it to generate."
   },
   {
    "q": "Training loss keeps falling, validation loss has risen for 3 evaluations. What is happening and what do you do?",
    "options": [
     "Overfitting; keep the best earlier checkpoint (early stopping), and consider lower rank or fewer epochs",
     "Underfitting; raise the learning rate",
     "The tokenizer is broken",
     "Normal; keep training to convergence"
    ],
    "answer": 0,
    "why": "Diverging train and validation loss is the classic overfitting signature. Early stopping keeps the checkpoint with the lowest validation loss."
   },
   {
    "q": "What does QLoRA quantise to 4-bit?",
    "options": [
     "The LoRA adapters",
     "The gradients",
     "The activations and the KV cache",
     "The frozen base weights (NF4), while adapters and computation stay in higher precision"
    ],
    "answer": 3,
    "why": "Base weights are stored in 4-bit NormalFloat and dequantised per matmul; LoRA adapters are trained in bf16 on top."
   },
   {
    "q": "You tried 20 configurations and picked the one with the best score on your frozen eval set. What is wrong?",
    "options": [
     "Nothing, that is what the eval set is for",
     "The reported score is optimistically biased because the eval set was used for selection; select on a validation split instead",
     "20 is too few trials",
     "You should have used grid search"
    ],
    "answer": 1,
    "why": "Selecting on a set leaks it into the training process. Use a separate validation split for selection and report on the eval set once."
   }
  ]
 },
 "14.2": {
  "minutes": 60,
  "learn": "\n<p>Phase 11 built retrieval with BM25 and embeddings. Here we treat RAG as a <i>trainable system</i>: what the task demands, which component to improve, and how to measure each one.</p>\n\n<h3>What a RAG task demands</h3>\n<p>The answer must come from a corpus that the model was not trained on and that changes: product docs, a codebase, contracts. That breaks into three requirements, each owned by a different component:</p>\n<ol>\n<li><b>Find</b> the right passages (retriever: embedder + index, plus a reranker).</li>\n<li><b>Use</b> them: answer from the context, not from memory, and ignore distractors (generator).</li>\n<li><b>Show</b> where the answer came from, and say \"not found\" when it is not there (generator + prompt + UI).</li>\n</ol>\n<p>The original RAG paper (Lewis et al., 2020) trained retriever and generator jointly. In practice teams optimise each part separately, then end to end, because failures are easier to locate.</p>\n\n<h3>Step 1: measure the retriever alone</h3>\n<p>Build (question, gold passage id) pairs. For each question, rank passages by similarity and record:</p>\n<ul>\n<li><b>recall@k</b>: fraction of questions whose gold passage is in the top k. If the gold passage is not retrieved, no generator can answer.</li>\n<li><b>MRR</b> (mean reciprocal rank): average of 1/rank of the gold passage. Rewards putting it first.</li>\n</ul>\n<pre><code>from sentence_transformers import SentenceTransformer\nemb = SentenceTransformer(\"BAAI/bge-small-en-v1.5\")\nD = emb.encode(passages, normalize_embeddings=True)\nQ = emb.encode(questions, normalize_embeddings=True)\nranks = (-(Q @ D.T)).argsort(axis=1)            # cosine similarity, best first\nrecall5 = sum(g in r[:5] for g, r in zip(gold, ranks)) / len(gold)</code></pre>\n\n<h3>Step 2: fine-tune the embedder with contrastive loss</h3>\n<p>A bi-encoder maps query and passage to vectors independently, so the index can be built once. Training pulls each query towards its positive passage and pushes it away from negatives. The standard objective is InfoNCE: for query q with positive p+ and negatives p-,</p>\n<pre><code>loss = -log( exp(s(q,p+)/tau) / sum over all candidates c of exp(s(q,c)/tau) )</code></pre>\n<p>where <code>s</code> is cosine similarity and <code>tau</code> a temperature. With <b>in-batch negatives</b> every other positive in the batch is a free negative. Random negatives are easy, so the loss is near zero and teaches little. <b>Hard negatives</b>, passages that look relevant but are wrong (same product, different version), give the useful gradient.</p>\n<pre><code>from sentence_transformers import SentenceTransformerTrainer, losses\nfrom sentence_transformers.util import mine_hard_negatives\nfrom datasets import Dataset\n\npairs = Dataset.from_dict({\"anchor\": questions, \"positive\": gold_passages})\ntrain = mine_hard_negatives(pairs, emb, num_negatives=1, range_min=5, range_max=50)\nloss = losses.MultipleNegativesRankingLoss(emb)          # InfoNCE with in-batch negatives\nSentenceTransformerTrainer(model=emb, train_dataset=train, loss=loss).train()</code></pre>\n<p>Skip the very top-ranked candidates when mining (<code>range_min</code>): some are actually correct but unlabelled (\"false negatives\"), and pushing them away hurts.</p>\n\n<h3>Step 3: add a cross-encoder reranker</h3>\n<p>A cross-encoder reads query and passage <i>together</i>, so it can compare them token by token. It is far more accurate but too slow for the whole corpus, so retrieve 50 with the bi-encoder and rerank to 5:</p>\n<pre><code>from sentence_transformers import CrossEncoder\nrr = CrossEncoder(\"cross-encoder/ms-marco-MiniLM-L-6-v2\")\nscores = rr.predict([(q, passages[i]) for i in top50])\ntop5 = [top50[i] for i in scores.argsort()[::-1][:5]]</code></pre>\n\n<h3>Step 4: train the generator to use context (RAFT)</h3>\n<p>Even with perfect retrieval, a model may answer from memory or be distracted by irrelevant passages. RAFT (Zhang et al., 2024) fine-tunes the generator on examples that contain the question, the oracle passage <i>mixed with distractors</i> (and in some examples no oracle at all), with a target answer that quotes the relevant passage and reasons from it. The model learns to find and cite the useful passage and to ignore the rest. Add examples where the right answer is \"The documents do not say\", so abstaining is learned too.</p>\n<pre><code>{\"messages\": [\n  {\"role\": \"system\", \"content\": \"Answer only from the passages. Cite as [id]. If absent, say so.\"},\n  {\"role\": \"user\", \"content\": \"[d3] ...distractor...\\n[d7] Refunds within 30 days...\\n\\nQ: How long is the refund window?\"},\n  {\"role\": \"assistant\", \"content\": \"The refund window is 30 days [d7].\"}]}</code></pre>\n\n<blockquote>Real-world example (self-reported, Rameel Malik's portfolio): FACTR-I, a local desktop agent, shows the source passage alongside its answers, so a user can check grounding directly rather than trusting the generated text.</blockquote>\n\n<blockquote>Common mistake: fine-tuning the generator when answers are wrong, without checking recall@k first. If the gold passage is not in the top 5, the fix is in the retriever, chunking or reranker.</blockquote>\n\n<h3>How to evaluate it</h3>\n<p>Evaluate per stage, then end to end. Retriever: recall@k and MRR before and after fine-tuning and reranking. Generator: <b>faithfulness</b> (is every claim supported by the retrieved passages?), <b>answer correctness</b>, <b>citation accuracy</b> (does the cited passage contain the claim?) and correct abstention on unanswerable questions. Tools like Ragas automate faithfulness with an LLM judge; spot-check 30 by hand. Serving priorities follow: retrieval latency, long prompts (prefill cost), and an index that updates when documents change.</p>\n",
  "practice": {
   "type": "code",
   "lang": "python",
   "prompt": "<p>Five passages and three queries have small fixed embeddings. (1) Normalise the vectors, rank passages by cosine similarity for each query and print the ranking, then recall@1, recall@3 and MRR (gold ids are given). (2) Compute the InfoNCE loss for query 0 (tau = 0.1) against its positive plus two easy negatives (passages 3 and 4), then against the positive plus a hard negative (passage 1). The hard negative should give a much larger loss: that is where learning happens.</p><p>Expected output:</p><pre><code>q0 ranking: [0, 1, 4, 2, 3]\nq1 ranking: [3, 2, 0, 4, 1]\nq2 ranking: [4, 1, 3, 2, 0]\nrecall@1 = 0.667\nrecall@3 = 1.000\nMRR = 0.833\nInfoNCE q0 easy negatives [3, 4]: 0.0094\nInfoNCE q0 hard negative [1]:     0.6680</code></pre>",
   "starter": "import numpy as np\n\nQ = np.array([[1.0, 0.2, 0.0, 0.1], [0.0, 1.0, 0.3, 0.0], [0.1, 0.0, 0.2, 1.0]])\nD = np.array([[0.9, 0.3, 0.1, 0.0],    # p0  gold for q0\n              [1.0, 0.1, 0.0, 0.3],    # p1  hard negative for q0 (looks similar)\n              [0.1, 0.8, 0.6, 0.0],    # p2  gold for q1\n              [0.0, 1.0, 0.0, 0.2],    # p3\n              [0.4, 0.0, 0.5, 0.6]])   # p4  gold for q2\nGOLD = [0, 2, 4]\nTAU = 0.1\n\ndef normalize(X):\n    # TODO\n    pass\n\n# TODO: S = cosine similarity matrix; ranks per query, best first\n# TODO: print \"q0 ranking: [...]\" for each query\n# TODO: recall@1, recall@3, MRR (3 decimals)\n\ndef info_nce(q, pos, negs, tau=TAU):\n    # TODO: -log softmax of the positive among [pos] + negs\n    pass\n\n# TODO: print easy and hard InfoNCE losses (4 decimals)\n",
   "expected": "q0 ranking: [0, 1, 4, 2, 3]\nq1 ranking: [3, 2, 0, 4, 1]\nq2 ranking: [4, 1, 3, 2, 0]\nrecall@1 = 0.667\nrecall@3 = 1.000\nMRR = 0.833\nInfoNCE q0 easy negatives [3, 4]: 0.0094\nInfoNCE q0 hard negative [1]:     0.6680",
   "solution": "import numpy as np\n\nQ = np.array([[1.0, 0.2, 0.0, 0.1], [0.0, 1.0, 0.3, 0.0], [0.1, 0.0, 0.2, 1.0]])\nD = np.array([[0.9, 0.3, 0.1, 0.0],    # p0  gold for q0\n              [1.0, 0.1, 0.0, 0.3],    # p1  hard negative for q0 (looks similar)\n              [0.1, 0.8, 0.6, 0.0],    # p2  gold for q1\n              [0.0, 1.0, 0.0, 0.2],    # p3\n              [0.4, 0.0, 0.5, 0.6]])   # p4  gold for q2\nGOLD = [0, 2, 4]\nTAU = 0.1\n\ndef normalize(X):\n    return X / np.linalg.norm(X, axis=1, keepdims=True)\n\nQn, Dn = normalize(Q), normalize(D)\nS = Qn @ Dn.T\nranks = [[int(i) for i in np.argsort(-S[q])] for q in range(len(Q))]\nfor q, r in enumerate(ranks):\n    print(f\"q{q} ranking: {r}\")\npos = [r.index(g) + 1 for r, g in zip(ranks, GOLD)]\nfor k in (1, 3):\n    print(f\"recall@{k} = {sum(p <= k for p in pos) / len(pos):.3f}\")\nprint(f\"MRR = {sum(1 / p for p in pos) / len(pos):.3f}\")\n\ndef info_nce(q, pos, negs, tau=TAU):\n    sims = np.array([Qn[q] @ Dn[pos]] + [Qn[q] @ Dn[n] for n in negs]) / tau\n    return float(-(sims[0] - np.log(np.exp(sims).sum())))\n\nprint(f\"InfoNCE q0 easy negatives [3, 4]: {info_nce(0, 0, [3, 4]):.4f}\")\nprint(f\"InfoNCE q0 hard negative [1]:     {info_nce(0, 0, [1]):.4f}\")\n",
   "hint": "Normalise rows so the dot product is cosine similarity. The rank of the gold passage is its index in the sorted list plus 1. InfoNCE is cross-entropy over [positive] + negatives with logits sims / tau."
  },
  "quiz": [
   {
    "q": "Answers are often wrong. recall@5 is 0.55. What do you fix first?",
    "options": [
     "Fine-tune the generator on more answers",
     "Raise the temperature",
     "The retrieval side: chunking, embedder fine-tuning with hard negatives, or a reranker",
     "Use a bigger generator"
    ],
    "answer": 2,
    "why": "In 45% of questions the gold passage never reaches the generator. No generator can answer from passages it does not see."
   },
   {
    "q": "Why do hard negatives help embedder training more than random negatives?",
    "options": [
     "Random negatives already score low, so the loss and gradient are near zero; hard negatives are confusable and produce a large, informative gradient",
     "They are cheaper to compute",
     "They increase the batch size",
     "They remove the need for positives"
    ],
    "answer": 0,
    "why": "The practice shows it: easy negatives give a tiny InfoNCE loss, a look-alike negative gives a large one. Training effort goes where the model is confused."
   },
   {
    "q": "Why use a bi-encoder for first-stage retrieval and a cross-encoder only for reranking?",
    "options": [
     "Cross-encoders cannot score text pairs",
     "Bi-encoders are always more accurate",
     "Cross-encoders need labelled data and bi-encoders do not",
     "Bi-encoder passage vectors can be precomputed and indexed; a cross-encoder must run once per (query, passage) pair, which is accurate but too slow for the whole corpus"
    ],
    "answer": 3,
    "why": "Cost scales with corpus size for the cross-encoder, so you apply it to a short candidate list."
   },
   {
    "q": "What does RAFT add to generator training compared with plain SFT on (question, passage, answer)?",
    "options": [
     "A reward model",
     "Distractor passages, and some examples without the oracle passage, so the model learns to find and cite the right passage and ignore noise",
     "Longer answers",
     "A larger vocabulary"
    ],
    "answer": 1,
    "why": "Retrieval at test time returns noise along with signal. Training with distractors teaches the model to use context selectively and to quote it."
   }
  ]
 },
 "14.3": {
  "minutes": 60,
  "learn": "\n<p>Reasoning tasks (maths, logic, code, planning) have a property chat and RAG lack: the final answer can usually be <b>checked</b>. A number matches or it does not; tests pass or they fail. That one fact shapes everything: you can spend more compute at inference to search for a correct answer, and you can train with rewards that need no human labels.</p>\n\n<h3>What the task demands</h3>\n<ul>\n<li>Several dependent steps, where one early error ruins the answer.</li>\n<li>Room to compute: a model that emits the answer as its first token has done all the work in one forward pass.</li>\n<li>Robustness: the same model should solve a problem reliably, not by luck.</li>\n</ul>\n\n<h3>Lever 1: chain of thought (decoding/prompting)</h3>\n<p>Chain-of-thought prompting (Wei et al., 2022) asks the model to write intermediate steps before the answer. Each generated token is another forward pass that can use the previous ones, so the model gets more serial computation. The cost is tokens: answers become much longer. Put the final answer in a fixed format so it can be extracted:</p>\n<pre><code>prompt = q + \"\\nThink step by step, then give the final answer on the last line as: #### &lt;number&gt;\"</code></pre>\n\n<h3>Lever 2: self-consistency and verifiers (test-time compute)</h3>\n<p>Self-consistency (Wang et al., 2022) samples several reasoning paths at temperature &gt; 0 and takes a <b>majority vote</b> over final answers. Different wrong paths tend to disagree; correct paths tend to agree. Accuracy usually rises with the number of samples and then flattens: if the model is wrong more often than right on a problem, more votes do not help. Cost grows linearly with samples.</p>\n<p>A stronger version is <b>best-of-N with a verifier</b>: score each sample with a checker (unit tests, a symbolic solver) or a learned reward model, and keep the best. Two kinds of learned verifiers:</p>\n<ul>\n<li><b>Outcome reward model (ORM)</b>: scores the final answer only.</li>\n<li><b>Process reward model (PRM)</b>: scores each step, so it can reject a solution that reached the right number by a wrong route, and guide search step by step. Step labels cost more to collect.</li>\n</ul>\n\n<h3>Lever 3: train on reasoning traces (SFT / distillation)</h3>\n<p>Generate many solutions with a strong model or with sampling, keep the ones whose final answer is correct (rejection sampling), and fine-tune on them. DeepSeek-R1 used this to distil reasoning into much smaller models, which is often the cheapest way to get a small reasoning model.</p>\n\n<h3>Lever 4: RL with verifiable rewards (GRPO)</h3>\n<p>The objective changes from \"imitate this text\" to \"maximise reward\". GRPO, introduced in DeepSeekMath (Shao et al., 2024), works like this for each prompt:</p>\n<ol>\n<li>Sample a <b>group</b> of G completions from the current policy.</li>\n<li>Score each with a reward function (e.g. 1 if the extracted answer is correct, else 0, sometimes plus a small format reward).</li>\n<li>Advantage of completion i: <code>A_i = (r_i - mean(r)) / (std(r) + eps)</code>. Better-than-group completions get pushed up, worse ones down.</li>\n<li>Update with a PPO-style clipped ratio objective plus a KL penalty to a reference model.</li>\n</ol>\n<p>The group mean replaces PPO's learned value network, which saves memory. Note the consequence: if all G completions get the same reward (all right or all wrong), every advantage is zero and the prompt teaches nothing. Prompts should be hard enough that the model sometimes fails and sometimes succeeds.</p>\n<p>DeepSeek-R1 (2025) showed that RL with rule-based accuracy and format rewards, applied to a strong base model (R1-Zero), produced long chains of thought with self-checking. The released R1 added a small \"cold-start\" SFT set for readability before RL.</p>\n<pre><code>import re\nfrom trl import GRPOConfig, GRPOTrainer\n\ndef correctness(completions, answer, **kw):       # dataset column \"answer\" arrives as a kwarg\n    out = []\n    for c, a in zip(completions, answer):\n        m = re.search(r\"####\\s*(-?\\d+(?:\\.\\d+)?)\\s*$\", c)\n        out.append(1.0 if m and float(m.group(1)) == float(a) else 0.0)\n    return out\n\nargs = GRPOConfig(output_dir=\"grpo\", num_generations=8, max_completion_length=512,\n                  learning_rate=1e-6, beta=0.04, temperature=1.0)\ntrainer = GRPOTrainer(model=\"Qwen/Qwen2.5-0.5B-Instruct\", reward_funcs=[correctness],\n                      args=args, train_dataset=ds)   # ds has \"prompt\" and \"answer\"\ntrainer.train()</code></pre>\n\n<blockquote>Common mistake: a loose reward function. If the extractor accepts any number anywhere in the text, the policy learns to print many numbers. RL optimises exactly what you reward (\"reward hacking\"); test the reward function on hand-written good and bad completions before training.</blockquote>\n\n<h3>Decoding and serving</h3>\n<p>Reasoning outputs are long, so serving is <b>decode-bound</b>: many output tokens, a growing KV cache, high latency per request. Set a generous but capped max length, batch for throughput, and report token budgets. Sampling settings matter: greedy for a single answer, temperature around 0.6 to 1.0 for voting and RL.</p>\n\n<h3>How to evaluate it</h3>\n<p>Report accuracy <i>together with</i> tokens spent: accuracy alone rewards whoever spent most compute. Useful views are pass@1 (one sample), maj@k (majority of k) and pass@k (any of k correct, an upper bound for a verifier), and a plot of accuracy vs tokens. Check problems for contamination (seen in training data), and read some traces: a correct answer with nonsense steps is a warning sign.</p>\n",
  "practice": {
   "type": "code",
   "lang": "python",
   "prompt": "<p>(1) Self-consistency: each of four problems has seven sampled final answers (in sampling order). For n in 1, 3, 5, 7, take a majority vote over the first n samples (ties go to the answer that appeared first) and print accuracy and total tokens (each sample of problem j costs <code>TOKENS[j]</code>). (2) Write a verifiable reward: 1.0 if the last line matches <code>#### &lt;number&gt;</code> and the number equals the gold answer, else 0.0. Score the six completions in the group. (3) Compute GRPO advantages <code>(r - mean) / (std + 1e-4)</code> (population std) for that group, and for a group where every completion is correct.</p><p>Expected output:</p><pre><code>n=1 acc=0.25 tokens=1080\nn=3 acc=0.50 tokens=3240\nn=5 acc=0.75 tokens=5400\nn=7 acc=0.75 tokens=7560\nrewards: 1.0 0.0 0.0 1.0 0.0 1.0\nadvantages: 1.000 -1.000 -1.000 1.000 -1.000 1.000\nall-correct advantages: 0.000 0.000 0.000 0.000 0.000 0.000</code></pre>",
   "starter": "from collections import Counter\nimport re\nimport numpy as np\n\nGOLD = [\"12\", \"7\", \"30\", \"100\"]\nSAMPLES = [[\"12\", \"12\", \"15\", \"12\", \"9\", \"12\", \"12\"],\n           [\"5\", \"7\", \"7\", \"5\", \"7\", \"3\", \"7\"],\n           [\"24\", \"30\", \"24\", \"30\", \"30\", \"24\", \"30\"],\n           [\"90\", \"80\", \"100\", \"90\", \"70\", \"90\", \"100\"]]\nTOKENS = [150, 220, 310, 400]\n\ndef majority(answers):\n    # TODO: most common answer; ties -> earliest\n    pass\n\n# TODO: for n in (1, 3, 5, 7): print \"n=1 acc=0.25 tokens=1080\"\n\ndef reward(completion, gold):\n    # TODO: regex on the last line, compare as floats\n    pass\n\nGROUP = [\"3 + 4 = 7\\n#### 7\", \"4 + 4 = 8\\n#### 8\", \"the answer is 7\",\n         \"7 apples total\\n#### 7.0\", \"#### 7\\nwait, it is 5\\n#### 5\", \"so we get\\n#### 7\"]\n# TODO: print rewards and advantages (3 decimals each)\n# TODO: advantages for an all-correct group of 6\n",
   "expected": "n=1 acc=0.25 tokens=1080\nn=3 acc=0.50 tokens=3240\nn=5 acc=0.75 tokens=5400\nn=7 acc=0.75 tokens=7560\nrewards: 1.0 0.0 0.0 1.0 0.0 1.0\nadvantages: 1.000 -1.000 -1.000 1.000 -1.000 1.000\nall-correct advantages: 0.000 0.000 0.000 0.000 0.000 0.000",
   "solution": "from collections import Counter\nimport re\nimport numpy as np\n\nGOLD = [\"12\", \"7\", \"30\", \"100\"]\nSAMPLES = [[\"12\", \"12\", \"15\", \"12\", \"9\", \"12\", \"12\"],\n           [\"5\", \"7\", \"7\", \"5\", \"7\", \"3\", \"7\"],\n           [\"24\", \"30\", \"24\", \"30\", \"30\", \"24\", \"30\"],\n           [\"90\", \"80\", \"100\", \"90\", \"70\", \"90\", \"100\"]]\nTOKENS = [150, 220, 310, 400]\n\ndef majority(answers):\n    return Counter(answers).most_common(1)[0][0]   # Counter keeps first-seen order on ties\n\nfor n in (1, 3, 5, 7):\n    acc = sum(majority(s[:n]) == g for s, g in zip(SAMPLES, GOLD)) / len(GOLD)\n    print(f\"n={n} acc={acc:.2f} tokens={n * sum(TOKENS)}\")\n\ndef reward(completion, gold):\n    last = completion.strip().split(\"\\n\")[-1]\n    m = re.fullmatch(r\"####\\s*(-?\\d+(?:\\.\\d+)?)\\s*\", last)\n    return 1.0 if m and float(m.group(1)) == float(gold) else 0.0\n\nGROUP = [\"3 + 4 = 7\\n#### 7\", \"4 + 4 = 8\\n#### 8\", \"the answer is 7\",\n         \"7 apples total\\n#### 7.0\", \"#### 7\\nwait, it is 5\\n#### 5\", \"so we get\\n#### 7\"]\n\ndef advantages(r):\n    r = np.array(r)\n    return (r - r.mean()) / (r.std() + 1e-4)\n\nr = [reward(c, \"7\") for c in GROUP]\nprint(\"rewards:\", \" \".join(f\"{x:.1f}\" for x in r))\nprint(\"advantages:\", \" \".join(f\"{float(a):.3f}\" for a in advantages(r)))\nprint(\"all-correct advantages:\", \" \".join(f\"{float(a):.3f}\" for a in advantages([1.0] * 6)))\n",
   "hint": "Counter(...).most_common(1) breaks ties by first appearance. For the reward, look only at the last line and use re.fullmatch so text after the answer is not accepted."
  },
  "quiz": [
   {
    "q": "In GRPO, a prompt's 8 completions all get reward 1.0. What does this prompt contribute to the update?",
    "options": [
     "A large positive update",
     "A negative update",
     "Nothing from the reward term: every advantage is (1 - 1)/std = 0",
     "It doubles the KL penalty"
    ],
    "answer": 2,
    "why": "Advantages are relative to the group mean. With no variation there is no signal; prompts that are always solved (or never) are wasted compute."
   },
   {
    "q": "Accuracy with self-consistency goes 0.25, 0.50, 0.75, 0.75 for 1, 3, 5, 7 samples. Why does it stop rising?",
    "options": [
     "On the remaining problem the model's most frequent answer is wrong, so more votes reinforce the wrong answer",
     "The vote is computed wrongly",
     "Temperature is too low",
     "Tokens ran out"
    ],
    "answer": 0,
    "why": "Voting helps when the correct answer is the plurality of samples. It cannot fix problems the model gets wrong more often than right; a verifier or training is needed."
   },
   {
    "q": "What is the difference between a process and an outcome reward model?",
    "options": [
     "PRMs are rule-based; ORMs are learned",
     "ORMs need step labels; PRMs do not",
     "There is no difference",
     "PRMs score each reasoning step; ORMs score only the final result"
    ],
    "answer": 3,
    "why": "A PRM can catch a wrong step even when the final answer is right, and can guide search step by step, at the price of costlier step-level labels."
   },
   {
    "q": "Model A scores 70% with 400 tokens per problem, model B 74% with 3,000 tokens. How should you report this?",
    "options": [
     "B is better, end of story",
     "As accuracy vs tokens (or cost), because B spends far more compute; compare at matched budgets",
     "Report only A because it is cheaper",
     "Average the two"
    ],
    "answer": 1,
    "why": "Reasoning accuracy can be bought with test-time compute. Without the token cost the comparison is misleading."
   }
  ]
 },
 "14.4": {
  "minutes": 55,
  "learn": "\n<p>Generation and chat tasks are open-ended: an email, a summary, an explanation. There is no single right answer to check, and quality means things people judge: helpful, correct, the right length and tone, safe. That changes what you train on and how you measure.</p>\n\n<h3>Three stages, three jobs</h3>\n<ol>\n<li><b>Pretraining</b> gives knowledge and fluency: next-token prediction on huge text. You almost never redo this.</li>\n<li><b>Supervised fine-tuning (SFT)</b> teaches format and instruction following from (prompt, good response) examples. It imitates; it cannot tell a good answer from a slightly better one.</li>\n<li><b>Preference tuning</b> teaches quality from <i>comparisons</i>: \"response A is better than B for this prompt.\" People rank far more easily and consistently than they write ideal answers.</li>\n</ol>\n\n<h3>RLHF: the InstructGPT recipe</h3>\n<p>InstructGPT (Ouyang et al., 2022) did SFT, then trained a <b>reward model</b> on human rankings (a Bradley-Terry loss: <code>-log sigmoid(r(chosen) - r(rejected))</code>), then optimised the policy with PPO to maximise reward minus a KL penalty to the SFT model. The KL term keeps the policy from drifting into text that fools the reward model. It works, but needs four models in memory (policy, reference, reward, value) and is finicky.</p>\n\n<h3>DPO: preference tuning without a reward model</h3>\n<p>DPO (Rafailov et al., 2023) shows that the KL-regularised RLHF objective has a closed-form optimal policy, which turns it into a simple classification-style loss on preference pairs. With policy <code>pi</code>, frozen reference <code>ref</code> and strength <code>beta</code>:</p>\n<pre><code>margin = beta * ((log pi(y_w|x) - log ref(y_w|x)) - (log pi(y_l|x) - log ref(y_l|x)))\nloss   = -log(sigmoid(margin))</code></pre>\n<p><code>y_w</code> is the chosen response, <code>y_l</code> the rejected one, and each log-prob is summed over the response tokens. The loss falls when the policy raises the chosen response's probability <i>relative to the reference</i> more than the rejected one's. <code>beta * (log pi - log ref)</code> acts as an implicit reward. Larger beta keeps the policy closer to the reference.</p>\n<pre><code>from datasets import Dataset\nfrom trl import DPOConfig, DPOTrainer\n\npairs = Dataset.from_list([\n  {\"prompt\": [{\"role\": \"user\", \"content\": \"Summarise this ticket: ...\"}],\n   \"chosen\": [{\"role\": \"assistant\", \"content\": \"Customer reports a broken item; wants a refund.\"}],\n   \"rejected\": [{\"role\": \"assistant\", \"content\": \"Thank you for reaching out! There are many aspects...\"}]},\n])\nargs = DPOConfig(output_dir=\"dpo\", beta=0.1, learning_rate=5e-7, num_train_epochs=1)\ntrainer = DPOTrainer(model=model, ref_model=None, args=args,\n                     train_dataset=pairs, processing_class=tok)   # ref_model=None: TRL makes a frozen copy\ntrainer.train()</code></pre>\n<p>Good pairs differ in the quality you care about and little else. Sources: human labels, two samples from your model judged by a stronger model, or a good answer vs a deliberately degraded one.</p>\n\n<h3>Decoding: same weights, very different text</h3>\n<p>The model outputs logits <code>z</code> over the vocabulary. Decoding turns them into a choice:</p>\n<ul>\n<li><b>Greedy</b>: always the top token. Deterministic, often repetitive in long text.</li>\n<li><b>Temperature T</b>: sample from <code>softmax(z / T)</code>. T &lt; 1 sharpens towards the top token, T &gt; 1 flattens.</li>\n<li><b>Top-p (nucleus)</b>: keep the smallest set of top tokens whose probability sums to at least p, renormalise, sample. Cuts the long tail of junk tokens while staying varied.</li>\n<li><b>Top-k</b>, <b>repetition penalty</b>: further controls.</li>\n</ul>\n<pre><code>out = model.generate(**tok(prompt, return_tensors=\"pt\"), max_new_tokens=200,\n                     do_sample=True, temperature=0.7, top_p=0.9)</code></pre>\n\n<h3>Which part to change, by symptom</h3>\n<ul>\n<li><b>Ignores the requested format or length</b>: SFT on 200 to 1,000 examples in that format, or a stricter system prompt first.</li>\n<li><b>Correct but bland, rambling or preachy</b>: preference pairs that contrast exactly that, then DPO with a small learning rate.</li>\n<li><b>Repetitive or generic wording</b>: decoding first (temperature, top-p, repetition penalty) before any training.</li>\n<li><b>Makes up facts</b>: not a style problem; add retrieval (lesson 14.2).</li>\n</ul>\n<p>The ordering mirrors the ladder: cheapest fix first, and change one thing at a time so the eval tells you what helped.</p>\n\n<blockquote>Common mistake: trusting a single LLM judge's win rate. Judges are known to prefer the answer shown first and longer answers. Swap the order of each pair and average, cap or report length, and DPO on judge-labelled pairs will otherwise learn to be verbose.</blockquote>\n\n<h3>How to evaluate it</h3>\n<p>Use <b>pairwise win rate</b> against the previous model on held-out prompts, judged by humans or a strong model with a written rubric, each pair judged in both orders. Track average length next to it. Then check <b>regressions</b>: run the model on held-out tasks from other skills (maths, coding, facts) because preference tuning can trade those away. For serving, chat cares about time to first token and streaming; temperature and top-p are product settings to tune on the eval, not defaults to leave alone.</p>\n",
  "practice": {
   "type": "code",
   "lang": "python",
   "prompt": "<p>(1) For the logits over five candidate tokens, print the sampling distribution at temperatures 0.5, 1.0 and 1.5 (3 decimals), then the top-p = 0.9 nucleus at T = 1.0: the kept tokens and their renormalised probabilities. (2) Compute the DPO loss (beta = 0.1) for three preference pairs given summed log-probs <code>(policy_chosen, policy_rejected, ref_chosen, ref_rejected)</code>. Print each margin and loss (3 decimals), the mean loss and the preference accuracy (fraction of pairs with positive margin).</p><p>Expected output:</p><pre><code>T=0.5: 0.829 0.112 0.041 0.015 0.002\nT=1.0: 0.563 0.207 0.126 0.076 0.028\nT=1.5: 0.439 0.225 0.161 0.116 0.059\ntop-p 0.9 keeps: the=0.579 a=0.213 one=0.129 this=0.078\npair 1: margin=0.200 loss=0.598\npair 2: margin=0.000 loss=0.693\npair 3: margin=-0.200 loss=0.798\nmean DPO loss = 0.696\npreference accuracy = 0.33</code></pre>",
   "starter": "import numpy as np\n\nTOKENS = [\"the\", \"a\", \"one\", \"this\", \"banana\"]\nLOGITS = np.array([2.0, 1.0, 0.5, 0.0, -1.0])\n\ndef softmax(z):\n    # TODO: numerically stable softmax\n    pass\n\n# TODO: print \"T=0.5: 0.xxx 0.xxx ...\" for T in (0.5, 1.0, 1.5)\n\ndef top_p(probs, p):\n    # TODO: return list of (token, renormalised prob), highest first\n    pass\n\n# TODO: print \"top-p 0.9 keeps: the=0.xxx a=0.xxx ...\"\n\nPAIRS = [(-12.0, -15.0, -13.0, -14.0),\n         (-20.0, -18.0, -20.0, -18.0),\n         (-9.0, -8.0, -8.0, -9.0)]\nBETA = 0.1\n# TODO: per pair print \"pair 1: margin=0.200 loss=0.598\", then mean loss and accuracy\n",
   "expected": "T=0.5: 0.829 0.112 0.041 0.015 0.002\nT=1.0: 0.563 0.207 0.126 0.076 0.028\nT=1.5: 0.439 0.225 0.161 0.116 0.059\ntop-p 0.9 keeps: the=0.579 a=0.213 one=0.129 this=0.078\npair 1: margin=0.200 loss=0.598\npair 2: margin=0.000 loss=0.693\npair 3: margin=-0.200 loss=0.798\nmean DPO loss = 0.696\npreference accuracy = 0.33",
   "solution": "import numpy as np\n\nTOKENS = [\"the\", \"a\", \"one\", \"this\", \"banana\"]\nLOGITS = np.array([2.0, 1.0, 0.5, 0.0, -1.0])\n\ndef softmax(z):\n    e = np.exp(z - z.max())\n    return e / e.sum()\n\nfor T in (0.5, 1.0, 1.5):\n    print(f\"T={T}: \" + \" \".join(f\"{float(x):.3f}\" for x in softmax(LOGITS / T)))\n\ndef top_p(probs, p):\n    order = np.argsort(-probs)\n    kept, total = [], 0.0\n    for i in order:\n        kept.append(int(i))\n        total += float(probs[i])\n        if total >= p:\n            break\n    return [(TOKENS[i], float(probs[i]) / total) for i in kept]\n\nprint(\"top-p 0.9 keeps: \" + \" \".join(f\"{t}={q:.3f}\" for t, q in top_p(softmax(LOGITS), 0.9)))\n\nPAIRS = [(-12.0, -15.0, -13.0, -14.0),\n         (-20.0, -18.0, -20.0, -18.0),\n         (-9.0, -8.0, -8.0, -9.0)]\nBETA = 0.1\nlosses, margins = [], []\nfor k, (pc, pr, rc, rr) in enumerate(PAIRS, 1):\n    m = BETA * ((pc - rc) - (pr - rr))\n    loss = -np.log(1 / (1 + np.exp(-m)))\n    margins.append(m); losses.append(float(loss))\n    print(f\"pair {k}: margin={m:.3f} loss={float(loss):.3f}\")\nprint(f\"mean DPO loss = {sum(losses) / len(losses):.3f}\")\nprint(f\"preference accuracy = {sum(m > 0 for m in margins) / len(margins):.2f}\")\n",
   "hint": "Divide logits by T before softmax. For top-p, sort descending and stop as soon as the cumulative sum reaches p. The DPO margin is beta times the difference of the two policy-minus-reference log-prob gaps."
  },
  "quiz": [
   {
    "q": "What can preference tuning (RLHF or DPO) teach that SFT on good answers cannot?",
    "options": [
     "New facts",
     "Tokenisation",
     "Which of two acceptable answers is better, using comparisons rather than demonstrations",
     "Longer context"
    ],
    "answer": 2,
    "why": "SFT imitates single targets. Preference data says A beats B, which carries quality information that is hard to write down as one ideal answer."
   },
   {
    "q": "In DPO, what does the reference model do?",
    "options": [
     "It anchors the implicit reward: the loss uses how much the policy changed each response's log-prob relative to the reference, which keeps the policy from drifting far",
     "It generates the rejected responses",
     "It is the reward model",
     "It is only used at inference"
    ],
    "answer": 0,
    "why": "DPO's loss depends on log pi - log ref for chosen and rejected. This is the closed form of the KL-regularised RLHF objective."
   },
   {
    "q": "With top-p = 0.9 and token probabilities 0.563, 0.207, 0.126, 0.076, 0.028, which tokens can be sampled?",
    "options": [
     "Only the first",
     "The first three",
     "All five",
     "The first four"
    ],
    "answer": 3,
    "why": "The first three sum to 0.896, still below 0.9, so the fourth is added (0.972). The kept probabilities are then renormalised to sum to 1."
   },
   {
    "q": "Your DPO model wins 70% against the old model by an LLM judge, but answers are twice as long. What should you check?",
    "options": [
     "Nothing; 70% is a clear win",
     "Judge position and length bias: rerun with swapped order and compare at similar lengths, and check held-out tasks for regressions",
     "Lower beta to 0",
     "Switch to greedy decoding"
    ],
    "answer": 1,
    "why": "LLM judges tend to prefer longer and first-shown answers. A length-controlled, order-swapped comparison tells you whether quality really improved."
   }
  ]
 },
 "14.5": {
  "minutes": 60,
  "learn": "\n<p>A decision task picks one action from a fixed set: route a ticket, approve a claim, flag a scan, call a tool with arguments. Fluent text is irrelevant. What matters is that the action is correct, that the system knows <b>how sure</b> it is, and that it can step aside when unsure. Agents are sequences of such decisions.</p>\n\n<h3>What the task demands</h3>\n<ul>\n<li><b>Accuracy</b> on a closed label set, often with asymmetric error costs (a missed fraud costs more than a false alarm).</li>\n<li><b>Calibration</b>: among cases where the model says 90%, about 90% should be right. Downstream rules depend on this.</li>\n<li><b>Abstention</b>: below some confidence, hand the case to a person or a slower path.</li>\n<li><b>Valid actions</b>: a tool call must parse and match the schema, every time.</li>\n</ul>\n\n<h3>Classifier head vs prompted LLM</h3>\n<p>For a fixed label set with a few thousand examples, a fine-tuned encoder with a classification head is often the strongest and cheapest option: one forward pass, logits for every class, easy to calibrate.</p>\n<pre><code>from transformers import AutoModelForSequenceClassification, AutoTokenizer\ntok = AutoTokenizer.from_pretrained(\"microsoft/deberta-v3-base\")\nclf = AutoModelForSequenceClassification.from_pretrained(\"microsoft/deberta-v3-base\", num_labels=3)\n# train with Trainer and cross-entropy on (text, label); at inference:\nprobs = clf(**tok(texts, return_tensors=\"pt\", padding=True)).logits.softmax(-1)</code></pre>\n<p>A prompted LLM needs no training data and can explain itself, but its verbal confidence is not a probability. If you use an LLM, read the probabilities of the label tokens (or sample several times) rather than asking \"how confident are you?\".</p>\n\n<h3>Calibration: measure with ECE, fix with temperature scaling</h3>\n<p>Modern deep networks are often overconfident (Guo et al., 2017). <b>Expected calibration error</b> groups predictions into confidence bins and averages the gap between confidence and accuracy:</p>\n<pre><code>ECE = sum over bins b of (n_b / n) * |accuracy_b - mean_confidence_b|</code></pre>\n<p><b>Temperature scaling</b> divides all logits by one scalar T &gt; 0, fitted on a validation set by minimising negative log-likelihood. T &gt; 1 softens overconfident predictions. Because dividing by T does not change which logit is largest, <b>accuracy is unchanged</b>; only the confidences move.</p>\n<pre><code>import torch, torch.nn.functional as F\nlogT = torch.zeros(1, requires_grad=True)           # T = exp(logT) stays positive\nopt = torch.optim.LBFGS([logT], lr=0.1, max_iter=100)\ndef closure():\n    opt.zero_grad()\n    loss = F.cross_entropy(val_logits / logT.exp(), val_labels)\n    loss.backward()\n    return loss\nopt.step(closure)\nT = logT.exp().item()</code></pre>\n\n<h3>Selective prediction: accuracy vs coverage</h3>\n<p>With calibrated confidence, choose a threshold: act when confidence is at least t, otherwise abstain. <b>Coverage</b> is the fraction of cases you act on; <b>selective accuracy</b> is accuracy on those. Raising t trades coverage for accuracy. Pick t from the error costs, on validation data.</p>\n\n<h3>Agents: decisions in a loop</h3>\n<p>An agent repeatedly decides the next action given the history. ReAct (Yao et al., 2022) interleaves reasoning text with actions and observations, which helps the model plan and recover. Toolformer (Schick et al., 2023) taught a model to insert API calls by self-supervision: it kept only the sampled calls whose results made the following text easier to predict. In practice, you improve tool use by fine-tuning on <b>successful traces</b> in the exact chat-template tool format you serve with:</p>\n<pre><code>tools = [{\"type\": \"function\", \"function\": {\"name\": \"get_order\", \"description\": \"Look up an order\",\n          \"parameters\": {\"type\": \"object\", \"properties\": {\"order_id\": {\"type\": \"string\"}}, \"required\": [\"order_id\"]}}}]\ntext = tok.apply_chat_template(trace_messages, tools=tools, tokenize=False)   # one training example</code></pre>\n<p>Decode tool calls at low temperature, validate every call against its JSON schema (or use constrained decoding), and return errors to the model as observations rather than crashing.</p>\n\n<blockquote>Real-world examples (self-reported, Rameel Malik's portfolio): his lung-cancer pipeline is a decision task split into stages, a Faster R-CNN detector followed by an EfficientNet-B0 subtype classifier, evaluated on subject-disjoint splits so no patient appears in both training and test data. FACTR-I is an agent whose actions are checkable: it edits code, shows the diff and runs the tests; over 1,067 tasks it used 34–57% fewer tokens than two comparison harnesses.</blockquote>\n\n<blockquote>Common mistake: random train/test splits when several examples come from the same person, document or session. The model recognises the source rather than learning the decision, and the score is inflated. Split by subject.</blockquote>\n\n<h3>How to evaluate it</h3>\n<p>Classification: accuracy or per-class F1, a confusion matrix weighted by error cost, ECE before and after temperature scaling, and an accuracy-vs-coverage curve. Agents: <b>task success rate</b> in a sandbox with automatic checks (tests pass, database in the expected state), plus invalid-call rate, steps and tokens per task, and wall-clock time. Serving priorities: low and predictable latency, deterministic decoding, logging every action for audit.</p>\n",
  "practice": {
   "type": "code",
   "lang": "python",
   "prompt": "<p>Sixteen validation examples have 3-class logits from an overconfident model. (1) Print accuracy, NLL and ECE (5 equal-width confidence bins on [0, 1], confidence = max softmax probability). (2) Grid-search temperature T over 0.5, 0.6, ..., 5.0 minimising NLL; print the best T and the new NLL, ECE and accuracy. (3) Using calibrated confidences, print coverage and selective accuracy for thresholds 0.5, 0.6 and 0.7. All values to 3 decimals.</p><p>Expected output:</p><pre><code>before: acc=0.688 NLL=1.060 ECE=0.257\nafter T=3.1: acc=0.688 NLL=0.623 ECE=0.153\nthreshold 0.5: coverage=1.000 selective_acc=0.688\nthreshold 0.6: coverage=0.750 selective_acc=0.833\nthreshold 0.7: coverage=0.562 selective_acc=0.889</code></pre>",
   "starter": "import numpy as np\n\nLOGITS = np.array([[12, 2, 0], [10, 0, 2], [0, 12, 2], [2, 10, 0], [0, 2, 12], [2, 0, 10],\n                   [10, 2, 0], [0, 6, 4], [4, 0, 6],\n                   [8, 6, 0], [6, 8, 0], [0, 6, 8], [4, 2, 6], [0, 8, 4], [6, 0, 4], [2, 4, 8]], dtype=float)\nLABELS = np.array([0, 0, 1, 1, 2, 2, 1, 2, 0, 0, 0, 2, 0, 1, 0, 2])\n\ndef softmax(z):\n    # TODO: row-wise stable softmax\n    pass\n\ndef nll(probs, y):\n    # TODO\n    pass\n\ndef ece(probs, y, bins=5):\n    # TODO: bin by confidence, weighted |acc - conf|\n    pass\n\n# TODO: before scaling: acc, NLL, ECE\n# TODO: grid search T; after scaling: T, NLL, ECE, acc\n# TODO: thresholds 0.5, 0.6, 0.7 -> coverage, selective accuracy\n",
   "expected": "before: acc=0.688 NLL=1.060 ECE=0.257\nafter T=3.1: acc=0.688 NLL=0.623 ECE=0.153\nthreshold 0.5: coverage=1.000 selective_acc=0.688\nthreshold 0.6: coverage=0.750 selective_acc=0.833\nthreshold 0.7: coverage=0.562 selective_acc=0.889",
   "solution": "import numpy as np\n\nLOGITS = np.array([[12, 2, 0], [10, 0, 2], [0, 12, 2], [2, 10, 0], [0, 2, 12], [2, 0, 10],\n                   [10, 2, 0], [0, 6, 4], [4, 0, 6],\n                   [8, 6, 0], [6, 8, 0], [0, 6, 8], [4, 2, 6], [0, 8, 4], [6, 0, 4], [2, 4, 8]], dtype=float)\nLABELS = np.array([0, 0, 1, 1, 2, 2, 1, 2, 0, 0, 0, 2, 0, 1, 0, 2])\n\ndef softmax(z):\n    e = np.exp(z - z.max(axis=1, keepdims=True))\n    return e / e.sum(axis=1, keepdims=True)\n\ndef nll(probs, y):\n    return float(-np.log(probs[np.arange(len(y)), y]).mean())\n\ndef ece(probs, y, bins=5):\n    conf = probs.max(axis=1)\n    correct = probs.argmax(axis=1) == y\n    idx = np.minimum((conf * bins).astype(int), bins - 1)\n    total = 0.0\n    for b in range(bins):\n        m = idx == b\n        if m.any():\n            total += m.mean() * abs(correct[m].mean() - conf[m].mean())\n    return float(total)\n\ndef acc(probs, y):\n    return float((probs.argmax(axis=1) == y).mean())\n\np = softmax(LOGITS)\nprint(f\"before: acc={acc(p, LABELS):.3f} NLL={nll(p, LABELS):.3f} ECE={ece(p, LABELS):.3f}\")\ngrid = [round(0.5 + 0.1 * i, 1) for i in range(46)]\nbest_T = min(grid, key=lambda T: nll(softmax(LOGITS / T), LABELS))\npc = softmax(LOGITS / best_T)\nprint(f\"after T={best_T}: acc={acc(pc, LABELS):.3f} NLL={nll(pc, LABELS):.3f} ECE={ece(pc, LABELS):.3f}\")\nconf, correct = pc.max(axis=1), pc.argmax(axis=1) == LABELS\nfor t in (0.5, 0.6, 0.7):\n    keep = conf >= t\n    print(f\"threshold {t}: coverage={keep.mean():.3f} selective_acc={correct[keep].mean():.3f}\")\n",
   "hint": "Confidence is the row max of the softmax. Bin index = min(int(conf * 5), 4). Temperature divides the logits before softmax; argmax does not change, so accuracy stays the same."
  },
  "quiz": [
   {
    "q": "Temperature scaling with T = 2.1 is fitted on validation data. What happens to accuracy?",
    "options": [
     "It rises",
     "It falls",
     "It stays exactly the same, because dividing all logits by a positive constant does not change the argmax",
     "It depends on the number of classes"
    ],
    "answer": 2,
    "why": "Only confidences change. That is why temperature scaling is safe: it fixes calibration without changing any argmax decision."
   },
   {
    "q": "Why read the label-token probabilities instead of asking an LLM 'how confident are you from 0 to 100'?",
    "options": [
     "Verbal confidence is generated text, not a probability, and is often poorly calibrated; token probabilities can be measured and calibrated",
     "Token probabilities are always perfect",
     "Asking costs too many tokens",
     "LLMs refuse to answer"
    ],
    "answer": 0,
    "why": "Calibration needs numbers whose frequencies you can check and correct, such as logits or vote fractions."
   },
   {
    "q": "You raise the abstain threshold from 0.6 to 0.8. What do you expect?",
    "options": [
     "Higher coverage and higher accuracy",
     "No change",
     "Lower accuracy on acted cases",
     "Lower coverage, and (with calibrated confidence) higher accuracy on the cases you act on"
    ],
    "answer": 3,
    "why": "Fewer cases clear a stricter bar, and those that do are more often right. Choose the point from the cost of errors vs the cost of handing off."
   },
   {
    "q": "Which metric best tells you whether a coding agent improved after tool-call fine-tuning?",
    "options": [
     "Perplexity on the traces",
     "Task success rate in a sandbox with automatic checks (tests pass), alongside invalid-call rate and tokens per task",
     "BLEU against reference diffs",
     "Average response length"
    ],
    "answer": 1,
    "why": "Agents are judged by outcomes. Text similarity can reward a plausible but broken edit; running the checks measures what the user needs."
   }
  ]
 },
 "14.6": {
  "minutes": 50,
  "learn": "\n<p>The previous lessons each took one task type. This lesson puts them side by side so you can design a new feature quickly: start from what the task demands, read across the table, and only then pick techniques.</p>\n\n<h3>Four questions that classify a task</h3>\n<ol>\n<li><b>Does it act?</b> If the output is an action (a label, a route, a tool call), it is a <b>decision/agent</b> task: calibration, valid actions and success rate dominate.</li>\n<li><b>Does it need knowledge the model does not have</b> (private, changing, long-tail)? Then <b>RAG</b> is required, whatever else you do.</li>\n<li><b>Can the answer be checked automatically?</b> Then treat it as <b>reasoning</b>: spend test-time compute, use verifiers, and train with verifiable rewards.</li>\n<li>Otherwise it is <b>generation/chat</b>: quality is human judgement, so use preferences and pairwise evaluation.</li>\n</ol>\n<p>Real products combine them. A coding agent acts (agent), needs the repository (RAG over code) and has a checker (tests, so reasoning-style verification). Pick the <i>primary</i> type for the evaluation that decides launches, and add the components of the others.</p>\n\n<h3>The comparison table</h3>\n\n<table>\n<tr><th></th><th>RAG</th><th>Reasoning</th><th>Generation / chat</th><th>Decisions / agents</th></tr>\n<tr><td><b>What the task demands</b></td><td>Answers grounded in a changing corpus, with sources</td><td>Correct multi-step answers that can be checked</td><td>Open-ended text people judge as helpful, safe, well styled</td><td>The right action from a fixed set, with known confidence; valid tool calls</td></tr>\n<tr><td><b>Base model choice</b></td><td>Good instruction follower with long context; small embedder + cross-encoder</td><td>Strongest base you can afford (RL amplifies what is there) or a distilled reasoning model</td><td>Instruct/chat model sized for latency</td><td>Encoder classifier for closed labels; tool-calling instruct model for agents</td></tr>\n<tr><td><b>Training data</b></td><td>(question, gold passage) pairs + hard negatives; RAFT examples with distractors and unanswerable cases</td><td>Problems with checkable answers; correct traces (rejection-sampled or distilled)</td><td>Instruction-response pairs (SFT); chosen/rejected pairs (preferences)</td><td>Labelled decisions, split by subject; successful tool-use traces</td></tr>\n<tr><td><b>Objective / loss</b></td><td>Contrastive InfoNCE (embedder); cross-entropy on cited answers (generator)</td><td>SFT cross-entropy; RL on verifiable reward (GRPO) with KL</td><td>Cross-entropy; DPO or reward model + PPO</td><td>Cross-entropy on labels; SFT on traces; post-hoc temperature scaling</td></tr>\n<tr><td><b>Key components</b></td><td>Chunker, embedder, index, reranker, citation format</td><td>CoT format, answer extractor, verifier or reward model, sampler</td><td>Chat template, system prompt, safety filters</td><td>Calibrated scores, abstain threshold, tool schemas and validator, sandbox</td></tr>\n<tr><td><b>Decoding settings</b></td><td>Low temperature; answer only from context</td><td>Long max length; greedy for one answer, T around 0.6 to 1.0 for voting/RL</td><td>Temperature + top-p tuned for the product</td><td>Temperature 0 or constrained decoding; one forward pass for classifiers</td></tr>\n<tr><td><b>Evaluation metrics</b></td><td>recall@k, MRR; faithfulness, answer correctness, citation accuracy, abstention</td><td>pass@1, maj@k, pass@k vs tokens; contamination checks</td><td>Pairwise win rate (order-swapped, length-aware); held-out regressions</td><td>Accuracy/F1, cost-weighted errors, ECE, accuracy vs coverage; task success rate</td></tr>\n<tr><td><b>Serving priorities</b></td><td>Retrieval latency, long prompts (prefill), prefix caching, fresh index</td><td>Decode throughput, KV-cache memory, token budget caps</td><td>Time to first token, streaming, cost per user</td><td>Predictable low latency, determinism, audit logs, safe execution</td></tr>\n<tr><td><b>Typical failure modes</b></td><td>Gold passage not retrieved; answer from memory; wrong citation</td><td>Reward hacking; overlong thinking; right answer, wrong steps</td><td>Verbosity, sycophancy, judge bias, forgetting other skills</td><td>Overconfidence, leaky splits, invalid or unsafe actions, loops</td></tr>\n</table>\n\n<h3>Reading the table: the differences that matter</h3>\n<p><b>Where the signal comes from.</b> RAG and decision tasks have labels (gold passages, correct actions). Reasoning has checkers, so rewards are free and RL works. Chat has only human judgement, so it uses comparisons. The kind of signal decides the objective: contrastive and cross-entropy, verifiable-reward RL, or preference losses.</p>\n<p><b>Which part of the system changes.</b> RAG improves mostly <i>outside</i> the generator (retriever, reranker, chunking). Reasoning changes decoding (more samples, longer outputs) and then weights. Chat changes weights with preferences and tunes decoding for style. Decisions change the output layer (a head, calibration, a threshold) and the action interface.</p>\n<p><b>Where the cost goes.</b> RAG prompts are long and outputs short: prefill-heavy, so prefix caching and context length matter. Reasoning prompts are short and outputs long: decode-heavy, so throughput and KV-cache memory matter. Chat is interactive: time to first token. Agents make many calls per task: total tokens and wall-clock time per task.</p>\n<pre><code># one way to estimate serving cost per task type\nprice_in, price_out = 0.50, 1.50          # $ per million tokens (example)\ncost = lambda tin, tout: (tin * price_in + tout * price_out) / 1e6</code></pre>\n\n<h3>An eval suite per type</h3>\n<ul>\n<li><b>RAG</b>: 50 questions with gold passages (recall@5, MRR), 30 answers graded for faithfulness and citations, 10 unanswerable questions.</li>\n<li><b>Reasoning</b>: 50 problems with exact answers, scored at several sample counts, with tokens logged.</li>\n<li><b>Chat</b>: 50 held-out prompts, pairwise vs the previous model in both orders, plus a regression set from other skills.</li>\n<li><b>Decisions/agents</b>: a subject-disjoint labelled set (accuracy, ECE, coverage curve) and 20 sandbox tasks with automatic success checks.</li>\n</ul>\n<p>Shared benchmarks such as Stanford HELM report many metrics per model (accuracy, calibration, robustness, efficiency), which is the same idea at scale; Ragas packages RAG-specific metrics.</p>\n\n<h3>A design doc template</h3>\n<pre><code>Feature: ...\nPrimary task type: RAG | reasoning | generation | decision/agent  (why)\nSecondary components: ...\nRung on the ladder: prompt / RAG / LoRA / RL  (evidence from baseline)\nData: source, size, split rule\nObjective: ...\nDecoding: ...\nEval: metrics, thresholds for launch, regression set\nServing: latency target, throughput, cost per 1k requests\nRisks: failure modes from the table and how each is detected</code></pre>\n\n<blockquote>Real-world example (self-reported, Rameel Malik's portfolio): FACTR-I mixes the types. It retrieves and shows the source passage for answers (RAG), and when it edits code it shows the diff and runs the tests (agent with an automatic checker). Its headline metric is a cost one: 34–57% fewer tokens than two comparison harnesses over 1,067 tasks.</blockquote>\n\n<blockquote>Common mistake: one metric for everything. A chat-style win rate on a RAG feature rewards fluent unsupported answers; accuracy alone on a reasoning feature hides a tenfold token bill. Each type needs its own metrics.</blockquote>\n\n<h3>How to evaluate it</h3>\n<p>Evaluate the design, not just the model: for each change you make, write which row of the table it targets and which metric should move. If the metric does not move, the change was aimed at the wrong part of the system.</p>\n",
  "practice": {
   "type": "code",
   "lang": "python",
   "prompt": "<p>Write <code>choose(spec)</code> that classifies a task with the four questions in order (acts, then fresh knowledge, then checkable, else generation) and returns the primary type plus extra components: <code>+retrieval</code> if it needs fresh knowledge but is not primarily RAG, <code>+verifier</code> if it is checkable but not primarily reasoning. Then estimate cost per 1,000 requests from typical (input, output) tokens per type at $0.50 / $1.50 per million tokens, and say whether serving is prefill-heavy (input &gt; output) or decode-heavy. Print one line per task.</p><p>Expected output:</p><pre><code>support bot over product docs: rag | recall@k + faithfulness | $1.95/1k | prefill-heavy\ncompetition math tutor: reasoning | accuracy vs tokens | $4.65/1k | decode-heavy\nmarketing copy writer: generation | pairwise win rate | $0.85/1k | decode-heavy\ninvoice approval router: agent | success rate / ECE | $5.80/1k | prefill-heavy\ncoding agent on a repo: agent +retrieval +verifier | success rate / ECE | $5.80/1k | prefill-heavy</code></pre>",
   "starter": "TASKS = [\n    (\"support bot over product docs\", dict(acts=False, fresh=True, checkable=False)),\n    (\"competition math tutor\", dict(acts=False, fresh=False, checkable=True)),\n    (\"marketing copy writer\", dict(acts=False, fresh=False, checkable=False)),\n    (\"invoice approval router\", dict(acts=True, fresh=False, checkable=False)),\n    (\"coding agent on a repo\", dict(acts=True, fresh=True, checkable=True)),\n]\nTOKENS = {\"rag\": (3000, 300), \"reasoning\": (300, 3000), \"generation\": (200, 500), \"agent\": (8000, 1200)}\nMETRIC = {\"rag\": \"recall@k + faithfulness\", \"reasoning\": \"accuracy vs tokens\",\n          \"generation\": \"pairwise win rate\", \"agent\": \"success rate / ECE\"}\nPRICE_IN, PRICE_OUT = 0.50, 1.50\n\ndef choose(spec):\n    # TODO: return (primary, extras_list)\n    pass\n\ndef cost_per_1k(tin, tout):\n    # TODO: dollars for 1000 requests\n    pass\n\n# TODO: print \"name: primary [extras] | metric | $x.xx/1k | prefill-heavy\"\n",
   "expected": "support bot over product docs: rag | recall@k + faithfulness | $1.95/1k | prefill-heavy\ncompetition math tutor: reasoning | accuracy vs tokens | $4.65/1k | decode-heavy\nmarketing copy writer: generation | pairwise win rate | $0.85/1k | decode-heavy\ninvoice approval router: agent | success rate / ECE | $5.80/1k | prefill-heavy\ncoding agent on a repo: agent +retrieval +verifier | success rate / ECE | $5.80/1k | prefill-heavy",
   "solution": "TASKS = [\n    (\"support bot over product docs\", dict(acts=False, fresh=True, checkable=False)),\n    (\"competition math tutor\", dict(acts=False, fresh=False, checkable=True)),\n    (\"marketing copy writer\", dict(acts=False, fresh=False, checkable=False)),\n    (\"invoice approval router\", dict(acts=True, fresh=False, checkable=False)),\n    (\"coding agent on a repo\", dict(acts=True, fresh=True, checkable=True)),\n]\nTOKENS = {\"rag\": (3000, 300), \"reasoning\": (300, 3000), \"generation\": (200, 500), \"agent\": (8000, 1200)}\nMETRIC = {\"rag\": \"recall@k + faithfulness\", \"reasoning\": \"accuracy vs tokens\",\n          \"generation\": \"pairwise win rate\", \"agent\": \"success rate / ECE\"}\nPRICE_IN, PRICE_OUT = 0.50, 1.50\n\ndef choose(spec):\n    if spec[\"acts\"]:\n        primary = \"agent\"\n    elif spec[\"fresh\"]:\n        primary = \"rag\"\n    elif spec[\"checkable\"]:\n        primary = \"reasoning\"\n    else:\n        primary = \"generation\"\n    extras = []\n    if spec[\"fresh\"] and primary != \"rag\":\n        extras.append(\"+retrieval\")\n    if spec[\"checkable\"] and primary != \"reasoning\":\n        extras.append(\"+verifier\")\n    return primary, extras\n\ndef cost_per_1k(tin, tout):\n    return 1000 * (tin * PRICE_IN + tout * PRICE_OUT) / 1e6\n\nfor name, spec in TASKS:\n    primary, extras = choose(spec)\n    tin, tout = TOKENS[primary]\n    shape = \"prefill-heavy\" if tin > tout else \"decode-heavy\"\n    ex = (\" \" + \" \".join(extras)) if extras else \"\"\n    print(f\"{name}: {primary}{ex} | {METRIC[primary]} | ${cost_per_1k(tin, tout):.2f}/1k | {shape}\")\n",
   "hint": "Check the questions in order with if/elif. Extras come from the flags that did not decide the primary type. Cost = 1000 * (tin * 0.5 + tout * 1.5) / 1e6."
  },
  "quiz": [
   {
    "q": "Which task type is decode-heavy at serving time, so throughput and KV-cache memory matter most?",
    "options": [
     "RAG over long documents",
     "A single-label classifier",
     "Reasoning with long chains of thought",
     "Embedding search"
    ],
    "answer": 2,
    "why": "Short prompts, long outputs: most time and memory go into generating many tokens."
   },
   {
    "q": "Why does RL with verifiable rewards fit reasoning tasks better than chat?",
    "options": [
     "Reasoning answers can be checked automatically, giving cheap, reliable rewards; chat quality needs human or judge preferences",
     "Chat models cannot be trained with RL",
     "Reasoning tasks have shorter outputs",
     "RL needs a retriever"
    ],
    "answer": 0,
    "why": "The source of the training signal decides the objective. A checker is a free reward; open-ended quality is not checkable by a rule."
   },
   {
    "q": "A team reports a 75% win rate for their new RAG answerer against the old one, judged on fluency. What is missing?",
    "options": [
     "Nothing",
     "A larger sample",
     "A latency benchmark only",
     "RAG-specific metrics: retrieval recall@k, faithfulness to the passages and citation accuracy"
    ],
    "answer": 3,
    "why": "A fluency win rate can reward fluent unsupported answers. RAG must be judged on grounding."
   },
   {
    "q": "A coding agent needs the repo and has unit tests. How should you describe its design?",
    "options": [
     "Pure RAG",
     "Primary type agent, with retrieval over the repo and tests as an automatic verifier",
     "Pure generation",
     "Pure reasoning, since tests exist"
    ],
    "answer": 1,
    "why": "It acts (edits and runs), so success rate in a sandbox is the launch metric; retrieval and the verifier are supporting components from the other rows."
   }
  ]
 }
});
