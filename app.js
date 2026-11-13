// Lesson player: home (overview + roadmap) and lesson view (Learn → Practice → Quiz → Tasks).
// Progress lives in `done` (localStorage, synced to Supabase when signed in):
//   "p.l.k" = task ticked, "r:p.l" = lesson read, "x:p.l" = practice passed, "q:p.l" = quiz passed.

const SUPABASE_URL = "https://ktqpfofzgvnmvwynvbce.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_QvRKnCh6Ez3Kl5r5nDzjWg_rPDbGoeC"; // public by design; RLS protects data

const KEY = "journey-progress-v1";
let done = {};
try { done = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const lk = (p, l) => `${p}.${l}`;
const ALL = DATA.flatMap((P, p) => P.l.map((_, l) => [p, l]));
const content = (p, l) => LESSONS[lk(p, l)];
const lessonGot = (p, l) => DATA[p].l[l].k.filter((_, k) => done[`${p}.${l}.${k}`]).length;
const lessonDone = (p, l) => lessonGot(p, l) === DATA[p].l[l].k.length;
const lessonStarted = (p, l) => lessonGot(p, l) > 0 || ["r", "x", "q"].some(s => done[`${s}:${lk(p, l)}`]);
const phaseGot = p => DATA[p].l.reduce((a, _, l) => a + lessonGot(p, l), 0);
const phaseAll = p => DATA[p].l.reduce((a, L) => a + L.k.length, 0);
const phaseDone = p => DATA[p].l.every((_, l) => lessonDone(p, l));
const nextUp = () => ALL.find(([p, l]) => !lessonDone(p, l)) || null;
const minutes = (p, l) => (content(p, l) && content(p, l).minutes) || 30;

// ---------- Saving & sync ----------
const sb = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
let user = null, timer = null, authMsg = "Not signed in. Progress is saved only in this browser.";
function setAuthMsg(t) { authMsg = t; const w = $("#who"); if (w) w.textContent = t; }
async function push() {
  if (!sb || !user) return;
  const { error } = await sb.from("progress").upsert({ user_id: user.id, done, updated_at: new Date().toISOString() });
  setAuthMsg(error ? `Sync failed: ${error.message}` : `Signed in as ${user.email}. Synced.`);
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(done)); } catch (e) {}
  if (user) { clearTimeout(timer); timer = setTimeout(push, 600); }
}
function mark(k, on = true) { if (on) done[k] = Date.now(); else delete done[k]; save(); }
async function onUser(u) {
  user = u;
  if (!u) { setAuthMsg("Not signed in. Progress is saved only in this browser."); route(); return; }
  setAuthMsg(`Signed in as ${u.email}. Loading…`);
  const { data, error } = await sb.from("progress").select("done").eq("user_id", u.id).maybeSingle();
  if (error) { setAuthMsg(`Load failed: ${error.message}`); return; }
  // ponytail: union merge, so a task unticked on one device can come back from another. Fine for a checklist.
  done = { ...((data && data.done) || {}), ...done };
  save(); route(); push();
}
if (sb) sb.auth.onAuthStateChange((_, s) => {
  const u = (s && s.user) || null;
  if ((u && u.id) !== (user && user.id)) setTimeout(() => onUser(u), 0);
});

// ---------- Shared bits ----------
function topbar() {
  const all = ALL.reduce((a, [p, l]) => a + DATA[p].l[l].k.length, 0);
  const got = ALL.reduce((a, [p, l]) => a + lessonGot(p, l), 0);
  const pct = Math.round(100 * got / all);
  $("#toppct").textContent = `${pct}%`;
  $("#topbar i").style.width = pct + "%";
  return { all, got, pct };
}
const icon = (p, l) => `<span class="ic ${lessonDone(p, l) ? "done" : lessonStarted(p, l) ? "half" : ""}" aria-hidden="true"></span>`;
const resLinks = L => `<p class="res">${L.r.map(([n, u]) => `<a href="${u}" target="_blank" rel="noopener">${esc(n)}</a>`).join("")}</p>`;

// ---------- Home ----------
const homeOpen = new Set();
function renderHome() {
  document.title = "GPU-to-AI Journey";
  const { all, got, pct } = topbar();
  const nx = nextUp();
  const lessonsDone = ALL.filter(([p, l]) => lessonDone(p, l)).length;
  const phasesDone = DATA.filter((_, p) => phaseDone(p)).length;
  const phaseCard = p => {
    const P = DATA[p], isDone = phaseDone(p), cur = nx && nx[0] === p;
    const open = !isDone && (cur || homeOpen.has(p));
    return `<details class="phase card ${isDone ? "complete" : ""} ${cur ? "current" : ""}" data-p="${p}" ${open ? "open" : ""}>
      <summary><span class="num">${isDone ? "✓" : p}</span>
        <div><h3>${esc(P.t)}</h3><p class="why">${esc(P.why)}</p><div class="bar"><i style="width:${100 * phaseGot(p) / phaseAll(p)}%"></i></div></div>
        <span class="side-r"><span class="chip">${isDone ? "Done" : `${P.l.length} lessons`}</span><span class="chev"></span></span></summary>
      <ul class="lrows">${P.l.map((L, l) => `<li><a href="#/l/${lk(p, l)}">${icon(p, l)}<span class="lt">${p}.${l + 1} ${esc(L.t)}</span><span class="lm">${minutes(p, l)} min · ${lessonGot(p, l)}/${L.k.length}</span></a></li>`).join("")}</ul>
      <div class="milestone">${esc(P.m)}</div>
    </details>`;
  };
  const live = DATA.map((_, p) => p).filter(p => !phaseDone(p)), fin = DATA.map((_, p) => p).filter(phaseDone);
  $("#app").innerHTML = `<div class="home">
    <p class="eyebrow">Learning path</p>
    <h1>From Pixels to GPU-Native AI</h1>
    <p class="sub">Built from the skill set in Rameel Malik's profile: graphics, C++/CUDA, deep learning, medical 3-D vision, transformers, LLM serving and agents. Each lesson: read the explanation, practice in the browser, take a quick quiz, then do the hands-on tasks.</p>
    <section class="top card">
      <div class="stats">
        <div class="ring" style="--p:${pct}"><span>${pct}%</span></div>
        <div class="nums">
          <div><b>${got} / ${all}</b><small>tasks done</small></div>
          <div><b>${lessonsDone} / ${ALL.length}</b><small>lessons complete</small></div>
          <div><b>${phasesDone} / ${DATA.length}</b><small>phases complete</small></div>
        </div>
      </div>
      ${nx ? `<a class="continue" href="#/l/${lk(...nx)}"><span><small>${lessonStarted(...nx) ? "Continue" : "Start"} learning</small><b>${nx[0]}.${nx[1] + 1} ${esc(DATA[nx[0]].l[nx[1]].t)}</b></span><span class="go">→</span></a>` : `<p class="continue"><b>All lessons complete. Go build.</b></p>`}
      <form class="auth" id="auth">
        <span id="who">${esc(authMsg)}</span>
        ${user ? `<span class="ctl"><button type="button" id="signout">Sign out</button></span>`
               : `<span class="ctl"><input type="email" id="email" placeholder="you@example.com" required aria-label="Email"><button class="btn-primary">Send login link</button></span>`}
      </form>
    </section>
    <div class="section-h"><h2>Roadmap</h2><span>${live.length} phases left</span></div>
    ${live.map(phaseCard).join("")}
    ${fin.length ? `<div class="section-h"><h2>Completed</h2><span>${fin.length} done</span></div>${fin.map(phaseCard).join("")}` : ""}
    <p class="foot"><button type="button" class="btn-ghost" id="rst">Reset all progress</button></p>
  </div>`;
  document.querySelectorAll("details.phase").forEach(d => d.addEventListener("toggle", () => { const p = +d.dataset.p; d.open ? homeOpen.add(p) : homeOpen.delete(p); }));
  $("#auth").onsubmit = async e => {
    e.preventDefault();
    if (!sb) return setAuthMsg("Sync library failed to load.");
    const email = $("#email").value.trim();
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname } });
    setAuthMsg(error ? `Login failed: ${error.message}` : `Login link sent to ${email}. Open it in this browser.`);
  };
  if ($("#signout")) $("#signout").onclick = () => sb.auth.signOut();
  $("#rst").onclick = e => {
    const b = e.currentTarget;
    if (b.dataset.arm) { done = {}; save(); renderHome(); }
    else { b.dataset.arm = 1; b.textContent = "Click again to erase all progress"; setTimeout(() => { if (b.isConnected) { b.textContent = "Reset all progress"; delete b.dataset.arm; } }, 3000); }
  };
}

// ---------- Lesson view ----------
const STEP_NAMES = { learn: "Learn", practice: "Practice", quiz: "Quiz", tasks: "Tasks" };
const stepsFor = (p, l) => { const c = content(p, l); return ["learn", ...(c && c.practice ? ["practice"] : []), ...(c && c.quiz && c.quiz.length ? ["quiz"] : []), "tasks"]; };
const stepDone = (p, l, s) => s === "learn" ? !!done[`r:${lk(p, l)}`] : s === "practice" ? !!done[`x:${lk(p, l)}`] : s === "quiz" ? !!done[`q:${lk(p, l)}`] : lessonDone(p, l);
const sideOpen = new Set();
let cur = null; // {p, l, step}

function renderSidebar() {
  const { p: cp, l: cl } = cur;
  const group = p => {
    const P = DATA[p], open = p === cp || (!phaseDone(p) && sideOpen.has(p));
    return `<details class="sg ${phaseDone(p) ? "complete" : ""}" data-p="${p}" ${open ? "open" : ""}>
      <summary><span class="snum">${phaseDone(p) ? "✓" : p}</span><span class="st">${esc(P.t)}</span><span class="sc">${phaseGot(p)}/${phaseAll(p)}</span></summary>
      <ul>${P.l.map((L, l) => `<li><a class="${p === cp && l === cl ? "cur" : ""}" href="#/l/${lk(p, l)}">${icon(p, l)}<span>${p}.${l + 1} ${esc(L.t)}</span></a></li>`).join("")}</ul>
    </details>`;
  };
  const ids = DATA.map((_, p) => p), fin = ids.filter(phaseDone);
  $("#side").innerHTML = `<div class="side-h">Course content</div>${ids.filter(p => !phaseDone(p)).map(group).join("")}
    ${fin.length ? `<div class="side-h">Completed</div>${fin.map(group).join("")}` : ""}`;
  $("#side").querySelectorAll("details").forEach(d => d.addEventListener("toggle", () => { const p = +d.dataset.p; d.open ? sideOpen.add(p) : sideOpen.delete(p); }));
}

function renderStepper() {
  const { p, l, step } = cur;
  $("#stepper").innerHTML = stepsFor(p, l).map((s, i) =>
    `<a href="#/l/${lk(p, l)}/${s}" class="${s === step ? "on" : ""} ${stepDone(p, l, s) ? "ok" : ""}"><span class="dot">${stepDone(p, l, s) ? "✓" : i + 1}</span>${STEP_NAMES[s]}</a>`).join("");
}

function refreshChrome() { topbar(); renderSidebar(); renderStepper(); renderPager(); }

function renderPager() {
  const { p, l, step } = cur, steps = stepsFor(p, l), i = steps.indexOf(step), gi = ALL.findIndex(([a, b]) => a === p && b === l);
  const prevHref = i > 0 ? `#/l/${lk(p, l)}/${steps[i - 1]}` : gi > 0 ? `#/l/${lk(...ALL[gi - 1])}/tasks` : null;
  const nextL = ALL[gi + 1];
  const nextHref = i < steps.length - 1 ? `#/l/${lk(p, l)}/${steps[i + 1]}` : nextL ? `#/l/${lk(...nextL)}` : "#/";
  const nextLabel = i < steps.length - 1 ? `Continue to ${STEP_NAMES[steps[i + 1]]}` : nextL ? `Next lesson: ${nextL[0]}.${nextL[1] + 1}` : "Back to home";
  $("#pager").innerHTML = `${prevHref ? `<a class="btn" href="${prevHref}">← Back</a>` : "<span></span>"}<a class="btn btn-primary" id="nextbtn" href="${nextHref}">${esc(nextLabel)} →</a>`;
  $("#nextbtn").onclick = () => { if (step === "learn") mark(`r:${lk(p, l)}`); };
}

function renderLesson(p, l, step) {
  const P = DATA[p], L = P.l[l], c = content(p, l), steps = stepsFor(p, l);
  if (!steps.includes(step)) step = steps.find(s => !stepDone(p, l, s)) || "learn";
  cur = { p, l, step };
  document.title = `${p}.${l + 1} ${L.t} · GPU-to-AI Journey`;
  $("#app").innerHTML = `<div class="layout">
    <aside id="side" class="sidebar"></aside>
    <section class="main">
      <div class="crumbs"><button type="button" class="menu" id="menu">☰ Lessons</button><a href="#/">Home</a><span>/</span><span>Phase ${p} · ${esc(P.t)}</span></div>
      <h1 class="lh">${p}.${l + 1} ${esc(L.t)}</h1>
      <p class="meta">~${minutes(p, l)} min · ${L.k.length} hands-on tasks</p>
      <nav class="stepper" id="stepper"></nav>
      <div class="panel card" id="panel"></div>
      <div class="pager" id="pager"></div>
    </section>
  </div>`;
  $("#menu").onclick = () => document.body.classList.toggle("side-open");
  $("#side").addEventListener("click", e => { if (e.target.closest("a")) document.body.classList.remove("side-open"); });
  topbar(); renderSidebar(); renderStepper(); renderPager();
  const panel = $("#panel");
  if (step === "learn") panel.innerHTML = c
    ? `<div class="prose">${c.learn}</div>`
    : `<div class="prose"><p>${esc(L.how)}</p><p class="muted">Full lesson text for this topic is not written yet. Start from the resources below, then do the tasks.</p></div>${resLinks(L)}`;
  else if (step === "practice") renderPractice(panel, p, l, c.practice);
  else if (step === "quiz") renderQuiz(panel, p, l, c.quiz);
  else renderTasks(panel, p, l);
  window.scrollTo(0, 0);
}

function renderTasks(panel, p, l) {
  const P = DATA[p], L = P.l[l];
  panel.innerHTML = `<div class="prose"><h3>Do it on your machine</h3><p>${esc(L.how)}</p></div>${resLinks(L)}
    <ul class="tasks">${L.k.map((k, i) => { const t = `${p}.${l}.${i}`; return `<li><label><input type="checkbox" data-id="${t}" ${done[t] ? "checked" : ""}><span>${esc(k)}</span></label></li>`; }).join("")}</ul>
    ${l === P.l.length - 1 ? `<div class="milestone">${esc(P.m)}</div>` : ""}`;
}

document.addEventListener("change", e => {
  const t = e.target.dataset && e.target.dataset.id;
  if (!t) return;
  mark(t, e.target.checked);
  if (cur) refreshChrome();
});

// ---------- Practice ----------
const LANG_NAME = { python: "Python 3", cpp: "C++20 · gcc 14.2", rust: "Rust 1.99", cuda: "CUDA · nvcc (no GPU: kernels do not run)", sql: "SQL · SQLite" };
const normOut = s => s.replace(/\r/g, "").split("\n").map(x => x.trimEnd()).join("\n").trim();
const normAns = s => s.trim().toLowerCase().replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\s+/g, " ");

function passedBanner(p, l, key, text) {
  return done[`${key}:${lk(p, l)}`] ? `<div class="banner ok">✓ ${text}</div>` : "";
}

function renderPractice(panel, p, l, pr) {
  if (pr.type === "fill") {
    panel.innerHTML = `${passedBanner(p, l, "x", "Practice passed")}<div class="prose">${pr.prompt}</div>
      <ol class="fill">${pr.items.map((it, i) => `<li><label for="f${i}">${esc(it.q)}</label>
        <div class="frow"><input id="f${i}" class="mono" autocomplete="off" spellcheck="false"><span class="fres" id="fr${i}"></span></div>
        <div class="fhint" id="fh${i}" hidden>Hint: ${esc(it.hint || "")}</div></li>`).join("")}</ol>
      <div class="toolbar"><span class="grow"></span><button class="btn-primary" id="fcheck">Check answers</button></div>`;
    $("#fcheck").onclick = () => {
      let ok = 0;
      pr.items.forEach((it, i) => {
        const good = it.accept.some(a => normAns(a) === normAns($(`#f${i}`).value));
        if (good) ok++;
        $(`#fr${i}`).textContent = good ? "✓" : "✗";
        $(`#fr${i}`).className = "fres " + (good ? "ok" : "bad");
        $(`#fh${i}`).hidden = good || !it.hint;
      });
      if (ok === pr.items.length) { mark(`x:${lk(p, l)}`); refreshChrome(); }
      $("#fcheck").textContent = ok === pr.items.length ? "All correct ✓" : `${ok}/${pr.items.length} correct · check again`;
    };
    return;
  }
  const ck = `journey-code-${lk(p, l)}`;
  let saved = null; try { saved = localStorage.getItem(ck); } catch (e) {}
  panel.innerHTML = `${passedBanner(p, l, "x", "Practice passed")}<div class="prose">${pr.prompt}</div>
    <div class="toolbar"><span class="langtag">${esc(LANG_NAME[pr.lang] || pr.lang)}</span><span class="grow"></span>
      <button type="button" id="creset">Reset</button><button type="button" id="crun">Run</button><button type="button" class="btn-primary" id="csub">Submit</button></div>
    <textarea id="code" class="mono" spellcheck="false" aria-label="Code editor"></textarea>
    ${pr.stdin ? `<label class="stdin">Input (stdin)<textarea id="stdin" class="mono" rows="2" spellcheck="false"></textarea></label>` : ""}
    <div class="outwrap"><div class="h"><span>Output</span><span id="verdict"></span></div><pre id="runout" class="mono">Run to see output. Submit checks it against the expected output. Ctrl+Enter runs.</pre></div>
    <details class="hint"><summary>Hint</summary><p>${esc(pr.hint || "No hint for this one.")}</p></details>
    <details class="hint"><summary>Show solution</summary><pre class="mono"><code>${esc(pr.solution)}</code></pre></details>`;
  const code = $("#code");
  code.value = saved ?? pr.starter;
  if ($("#stdin")) $("#stdin").value = pr.stdin;
  code.oninput = () => { try { localStorage.setItem(ck, code.value); } catch (e) {} };
  code.onkeydown = e => {
    if (e.key === "Tab" && !e.shiftKey) { e.preventDefault(); document.execCommand("insertText", false, "    "); }
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); go(false); }
  };
  $("#creset").onclick = () => { code.value = pr.starter; code.oninput(); };
  $("#crun").onclick = () => go(false);
  $("#csub").onclick = () => go(true);
  async function go(submit) {
    const btns = [$("#crun"), $("#csub")];
    btns.forEach(b => b.disabled = true);
    const v = $("#verdict"); v.textContent = ""; v.className = "";
    let res;
    try { res = await runCode(pr.lang, code.value, $("#stdin") ? $("#stdin").value : pr.stdin || ""); }
    catch (e) { res = { ok: false, out: "Error: " + e.message }; }
    btns.forEach(b => b.disabled = false);
    $("#runout").textContent = res.out || "(no output)";
    if (!submit) return;
    const pass = res.ok && normOut(res.out) === normOut(pr.expected);
    v.textContent = pass ? "✓ Correct" : "✗ Output does not match the expected output";
    v.className = pass ? "ok" : "bad";
    if (pass) { mark(`x:${lk(p, l)}`); refreshChrome(); }
  }
}

// ---------- Quiz ----------
function renderQuiz(panel, p, l, quiz) {
  panel.innerHTML = `${passedBanner(p, l, "q", "Quiz passed")}
    <ol class="quiz">${quiz.map((q, i) => `<li><p class="qq">${esc(q.q)}</p>
      ${q.options.map((o, j) => `<label class="opt"><input type="radio" name="q${i}" value="${j}"><span>${esc(o)}</span></label>`).join("")}
      <p class="why" id="w${i}" hidden></p></li>`).join("")}</ol>
    <div class="toolbar"><span id="qscore"></span><span class="grow"></span><button class="btn-primary" id="qcheck">Check answers</button></div>`;
  $("#qcheck").onclick = () => {
    let ok = 0;
    quiz.forEach((q, i) => {
      const sel = panel.querySelector(`input[name=q${i}]:checked`);
      const good = sel && +sel.value === q.answer;
      if (good) ok++;
      panel.querySelectorAll(`input[name=q${i}]`).forEach(r => r.parentElement.classList.toggle("right", +r.value === q.answer && !!sel));
      if (sel && !good) sel.parentElement.classList.add("wrong");
      panel.querySelectorAll(`input[name=q${i}]`).forEach(r => { if (r !== sel) r.parentElement.classList.remove("wrong"); });
      const w = $(`#w${i}`); w.hidden = !sel; w.textContent = (good ? "✓ " : "✗ ") + q.why; w.className = "why " + (good ? "ok" : "bad");
    });
    $("#qscore").textContent = `${ok} / ${quiz.length} correct`;
    if (ok === quiz.length) { mark(`q:${lk(p, l)}`); refreshChrome(); }
  };
}

// ---------- Code runners ----------
let pyodide = null, SQL = null;
const loadScript = src => new Promise((ok, no) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => no(new Error("Failed to load " + src)); document.head.appendChild(s); });
const say = t => { const o = $("#runout"); if (o) o.textContent = t; };
const CE = { cpp: ["g142", "c++", "-O2 -std=c++20"], rust: ["r1990", "rust", "-O --edition 2021"], cuda: ["nvcc129u1", "cuda", "-O2"] };

async function runCode(lang, code, stdin) {
  if (lang === "python") return runPython(code, stdin);
  if (lang === "sql") return runSQL(code);
  return runRemote(lang, code, stdin);
}
// ponytail: Python runs on the main thread, so an infinite loop freezes the tab. Move Pyodide to a Web Worker if that bites.
async function runPython(code, stdin) {
  if (!pyodide) {
    say("Loading Python (first run only, ~10 MB)…");
    await loadScript("https://cdn.jsdelivr.net/pyodide/v0.28.3/full/pyodide.js");
    pyodide = await loadPyodide();
  }
  let out = "", fed = false;
  say("Running…");
  try {
    // Load imported packages first, silently, so "Loading numpy" never ends up in the program output.
    await pyodide.loadPackagesFromImports(code, { messageCallback: () => {}, errorCallback: () => {} });
    pyodide.setStdout({ batched: s => out += s + "\n" });
    pyodide.setStderr({ batched: s => out += s + "\n" });
    pyodide.setStdin({ stdin: () => fed ? null : (fed = true, stdin) });
    // Fresh globals each run so old variables do not leak between attempts.
    await pyodide.runPythonAsync(code, { globals: pyodide.toPy({}) });
    return { out, ok: true };
  } catch (e) { return { out: out + String(e.message || e), ok: false }; }
}
async function runSQL(code) {
  if (!SQL) {
    say("Loading SQLite…");
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js");
    SQL = await initSqlJs({ locateFile: f => "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/" + f });
  }
  const db = new SQL.Database();
  try {
    const res = db.exec(code);
    if (!res.length) return { out: "(no rows)\n", ok: true };
    return { ok: true, out: res.map(r => [r.columns.join(" | "), ...r.values.map(v => v.join(" | "))].join("\n")).join("\n\n") + "\n" };
  } catch (e) { return { out: "Error: " + e.message, ok: false }; }
  finally { db.close(); }
}
async function runRemote(lang, code, stdin) {
  const [id, l, args] = CE[lang];
  say("Compiling on godbolt.org…");
  const r = await fetch(`https://godbolt.org/api/compiler/${id}/compile`, {
    method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ source: code, lang: l, options: { userArguments: args, executeParameters: { stdin }, compilerOptions: { executorRequest: true }, filters: { execute: true }, tools: [], libraries: [] } })
  });
  if (!r.ok) throw new Error(`Compiler service returned HTTP ${r.status}`);
  const d = await r.json();
  const txt = a => (a || []).map(x => x.text.replace(/\x1b\[[0-9;]*[mK]/g, "")).join("\n");
  if (!d.didExecute) { const b = d.buildResult || {}; return { ok: false, out: "Build failed:\n" + (txt(b.stderr) || txt(d.stderr)) }; }
  const err = txt(d.stderr);
  return { ok: d.code === 0, out: txt(d.stdout) + (err ? "\n[stderr]\n" + err : "") + (d.code !== 0 ? `\n[exit code ${d.code}]` : "") };
}

// ---------- Router ----------
function route() {
  document.body.classList.remove("side-open");
  const m = location.hash.match(/^#\/l\/(\d+)\.(\d+)(?:\/(\w+))?/);
  if (m && DATA[+m[1]] && DATA[+m[1]].l[+m[2]]) renderLesson(+m[1], +m[2], m[3]);
  else { cur = null; renderHome(); }
}
window.addEventListener("hashchange", route);
route();
