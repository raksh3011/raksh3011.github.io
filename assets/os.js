(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, attrs = {}, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) k === 'class' ? (e.className = v) : k === 'html' ? (e.innerHTML = v) : k.startsWith('on') ? e.addEventListener(k.slice(2), v) : e.setAttribute(k, v);
    kids.flat().forEach((c) => c != null && e.append(c.nodeType ? c : document.createTextNode(c)));
    return e;
  };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = () => innerWidth <= 760;
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  const icon = (id) => `<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-${id}"/></svg>`;

  // ---- where the live demos run. Edit here when a deployment moves. ----
  const URLS = {
    floatchat: 'floatchat/?embed=1',
    aurax: '',
    orvms: 'orvms/app/',             // static build: the real API runs in the browser tab (see orvms/ case study)
  };
  const LINKS = { github: 'https://github.com/raksh3011', linkedin: 'https://www.linkedin.com/in/rakshak-m-k/', email: 'rakshak.km.3011@gmail.com' };

  // ---------------------------------------------------------------- content
  const doc = (html) => el('div', { class: 'doc', html });
  const PROJECTS = [
    { id: 'aurax', icon: 'uav', name: 'AURAX', blurb: 'GNSS-denied UAV mission stack (simulation): terrain-following 3-D planning, localisation-aware routing, LiDAR+IMU navigation, and a 3-D ground station. Flagship project; case study with measured results.',
      tags: ['C++17', 'Three.js', 'Path planning', 'Navigation'], featured: true, live: false, case: 'aura-x/?embed=1' },
    { id: 'orvms', icon: 'ship', name: 'ORVMS', blurb: 'Multi-tenant maritime risk and supply-chain platform: live AIS, voyage approvals, SLA-driven Coast Guard case desk, billing, signed webhooks. Serverless on Cloudflare; 226 automated tests.',
      tags: ['TypeScript', 'Cloudflare Workers', 'D1', 'Durable Objects'], live: !!URLS.orvms, repo: 'https://github.com/raksh3011/MSA', case: 'orvms/?embed=1' },
    { id: 'floatchat', icon: 'wave', name: 'FloatChat', blurb: 'Ask real Argo ocean-float data questions in plain English. Schema-agnostic NetCDF ingestion, PostgreSQL + pgvector semantic search, a tool-using agent — and a demo that runs entirely in your browser.',
      tags: ['Python', 'PostgreSQL', 'pgvector', 'RAG', 'NetCDF'], live: true, repo: 'https://github.com/raksh3011/FloatChat' },
  ];

  const APPS = {
    readme: { title: 'readme.txt', icon: 'readme', w: 640, h: 540, build: () => doc(`
      <h1>Hi, I'm Rakshak<em>.</em></h1><p class="sub">Software engineer · B.E. CSE, BMSIT&amp;M, Bengaluru</p>
      <p>I build <b>AI-driven, data-intensive systems</b> and care about the unglamorous parts that make them dependable: idempotent pipelines, tests, honest evaluation, clear system design.</p>
      <h3>Start here</h3>
      <ul>
        <li><b>AURAX</b> — flagship: UAV mission stack for GPS-denied terrain. <a href="#aurax" data-open="aurax">Case study</a></li>
        <li><b>ORVMS</b> — maritime risk platform, runs in your browser. <a href="#orvms" data-open="orvms">Open live demo</a></li>
        <li><b>FloatChat</b> — chat with real ocean-float data. <a href="#floatchat" data-open="floatchat">Open live demo</a></li>
      </ul>
      <h3>Right now</h3>
      <dl class="kv"><dt>role</dt><dd>Software Engineer Intern, ApthaAI (Jun 2026 –)</dd><dt>studying</dt><dd>B.E. CSE, CGPA 8.66 (2023 – 2027)</dd><dt>presented</dt><dd>ICMOTA 2026, IIT BHU</dd><dt>looking for</dt><dd>software engineering roles &amp; internships</dd></dl>
      <div class="row"><button class="btn pri" data-open="projects">▸ Projects</button><button class="btn" data-open="terminal">▸ Terminal</button><button class="btn" data-open="resume">▸ Resume (by mail)</button><button class="btn" data-open="contact">▸ Contact</button></div>`) },

    projects: { title: 'Projects', icon: 'folder', w: 820, h: 520, build: () => el('div', { class: 'cards' }, PROJECTS.map((p) => el('article', { class: 'card' },
      el('div', { class: 'live', style: p.featured ? 'color:var(--accent2)' : '' }, p.featured ? '★ flagship · case study' : p.live ? 'live demo' : 'case study'),
      el('h4', {}, p.name), el('p', {}, p.blurb), el('div', { class: 'tags' }, p.tags.map((t) => el('span', {}, t))),
      el('div', { class: 'row' },
        el('button', { class: 'btn pri', 'data-open': p.id }, p.featured ? '▸ Case study' : '▸ Open demo'),
        p.case && !p.featured ? el('button', { class: 'btn', 'data-open': p.id + '-case' }, 'Case study') : null,
        p.repo ? el('a', { class: 'btn', href: p.repo, target: '_blank', rel: 'noopener' }, 'Source ↗') : null)))) },

    career: { title: 'career.log', icon: 'brief', w: 640, h: 560, build: () => doc(`
      <h1>Career &amp; <em>recognition</em></h1>
      <h3>Experience</h3><div class="tl"><div><h4>Software Engineer Intern — ApthaAI</h4><small>Jun 2026 – present</small>
        <p>Contributed to the prototype of an Assurance Platform for AI agents in supply-chain workflows; translated assurance requirements into software components and engineering decisions.</p></div></div>
      <h3>Education</h3><div class="tl"><div><h4>B.E. Computer Science &amp; Engineering — BMSIT&amp;M</h4><small>2023 – 2027 · CGPA 8.66</small></div>
        <div><h4>Pre-University (PCMC) — Smt. Vidya P Hanchinmani PU College</h4><small>2021 – 2023 · 90.83%</small></div></div>
      <h3>Achievements</h3><ul>
        <li><b>ICMOTA 2026, IIT BHU</b> — presented research on robust trajectory optimisation for a flying-wing UAV in GPS-denied environments.</li>
        <li><b>2nd Prize</b>, InCSEption hackathon (team leader).</li>
        <li><b>Consolation Prize</b>, ANVESHANA 3.0 national prototype competition (₹15,000).</li>
        <li>Co-Founder &amp; Chief Secretary, <b>ASTRA Defence Technology Club</b>.</li>
        <li>Oracle Cloud Infrastructure 2025 <b>Certified AI Foundations Associate</b>.</li></ul>`) },

    skills: { title: 'skills.sys', icon: 'chip', w: 560, h: 420, build: () => doc(`
      <h1>Tool<em>box</em></h1>
      <dl class="kv"><dt>languages</dt><dd>C · C++ · Python · TypeScript · SQL</dd><dt>ai / ml</dt><dd>RAG · embeddings · tool-using agents · agent evaluation</dd>
      <dt>data</dt><dd>PostgreSQL · pgvector · MySQL · Cloudflare D1</dd><dt>web</dt><dd>Three.js · REST/WebSocket APIs · Cloudflare Workers</dd>
      <dt>tooling</dt><dd>Git · GitHub Actions · Docker · pytest · Vitest · Claude Code</dd></dl>
      <h3>What I care about</h3><ul><li><b>Correctness you can check</b> — numbers come from tools and tests, not from a model's imagination.</li>
      <li><b>Idempotent, observable pipelines</b> — safe to re-run, easy to explain.</li><li><b>Honest scope</b> — every project says what it does <i>not</i> do.</li></ul>`) },

    contact: { title: 'contact.mail', icon: 'mail', w: 520, h: 380, build: () => doc(`
      <h1>Let's <em>talk</em></h1><p>Open to software engineering roles and internships. Email is fastest.</p>
      <div class="row"><a class="btn pri" href="mailto:${LINKS.email}">✉ ${LINKS.email}</a></div>
      <div class="row"><a class="btn" href="${LINKS.linkedin}" target="_blank" rel="noopener">LinkedIn ↗</a><a class="btn" href="${LINKS.github}" target="_blank" rel="noopener">GitHub ↗</a><a class="btn" href="mailto:${LINKS.email}?subject=R%C3%A9sum%C3%A9%20request">Request résumé</a></div>`) },

    resume: { title: 'resume.txt', icon: 'pdf', w: 520, h: 330, build: () => doc(`
      <h1>Résumé</h1><p>Happy to share my current résumé directly. Send me a short email and I will reply with it, along with anything specific you would like to see.</p>
      <div class="row"><a class="btn pri" href="mailto:${LINKS.email}?subject=R%C3%A9sum%C3%A9%20request&body=Hi%20Rakshak%2C%20could%20you%20please%20share%20your%20r%C3%A9sum%C3%A9%3F">✉ Request résumé by mail</a></div>
      <p style="color:var(--mute);margin-top:14px">${LINKS.email}</p>`) },
    floatchat: { title: 'FloatChat.app', icon: 'wave', w: 1080, h: 660, url: URLS.floatchat, ext: 'floatchat/' },
    aurax: { title: 'AURAX — case study', icon: 'uav', w: 960, h: 700, url: 'aura-x/?embed=1', ext: 'aura-x/' },
    orvms: { title: 'ORVMS.app', icon: 'ship', w: 1080, h: 660, url: URLS.orvms || 'orvms/?embed=1', ext: URLS.orvms || 'orvms/' },
    'aurax-case': { title: 'AURAX — case study', icon: 'uav', w: 900, h: 680, url: 'aura-x/?embed=1', ext: 'aura-x/' },
    'orvms-case': { title: 'ORVMS — case study', icon: 'ship', w: 900, h: 680, url: 'orvms/?embed=1', ext: 'orvms/' },
    'floatchat-case': { title: 'FloatChat — README', icon: 'wave', w: 840, h: 640, url: 'https://github.com/raksh3011/FloatChat#readme', ext: 'https://github.com/raksh3011/FloatChat' },
    terminal: { title: 'terminal', icon: 'term', w: 700, h: 460, build: () => buildTerminal() },
  };
  // desktop icon order
  const ICONS = [['readme', 'readme.txt'], ['projects', 'Projects'], ['aurax', 'AURAX'], ['orvms', 'ORVMS'], ['floatchat', 'FloatChat'], ['career', 'career.log'], ['skills', 'skills.sys'], ['resume', 'Resume'], ['terminal', 'Terminal'], ['contact', 'contact.mail']];

  // ---------------------------------------------------------------- window manager
  const wins = new Map();
  let zTop = 10, cascade = 0;
  const deskEl = $('#desk'), winsEl = $('#wins'), tasksEl = $('#tasks');

  function focus(id) {
    wins.forEach((w, k) => { w.el.classList.toggle('active', k === id); w.task.classList.toggle('on', k === id && !w.el.classList.contains('min')); });
    const w = wins.get(id); if (w) { w.el.style.zIndex = ++zTop; }
  }
  function open(id) {
    id = id.replace(/^#/, '');
    const app = APPS[id]; if (!app) return;
    if (wins.has(id)) { const w = wins.get(id); w.el.classList.remove('min'); focus(id); w.task.classList.remove('m'); return; }
    const dw = deskEl.clientWidth, dh = deskEl.clientHeight;
    const W = Math.min(app.w, dw - 20), H = Math.min(app.h, dh - 20);
    const x = Math.max(8, Math.min(dw - W - 8, 230 + (cascade % 6) * 28)), y = Math.max(8, Math.min(dh - H - 8, 28 + (cascade % 6) * 26)); cascade++;
    const body = el('div', { class: 'body' });
    if (app.url) {
      body.append(el('iframe', { src: app.url, title: app.title, allow: 'fullscreen; clipboard-write' }));
    } else body.append(app.build());
    const btns = [];
    if (app.ext) btns.push(el('button', { title: 'Open in a new tab', 'aria-label': 'Open in a new tab', onclick: () => window.open(app.ext, '_blank', 'noopener') }, '↗'));
    btns.push(el('button', { title: 'Minimise', 'aria-label': 'Minimise', onclick: () => minimise(id) }, '_'),
      el('button', { class: 'mx', title: 'Maximise', 'aria-label': 'Maximise', onclick: () => toggleMax(id) }, '□'),
      el('button', { class: 'x', title: 'Close', 'aria-label': 'Close', onclick: () => close(id) }, '×'));
    const tbar = el('div', { class: 'tbar' }, el('span', { html: icon(app.icon) }), el('h2', {}, app.title), el('div', { class: 'tctl' }, btns));
    const rz = el('div', { class: 'rz', 'aria-hidden': 'true' });
    const w = el('section', { class: 'win opening', role: 'dialog', 'aria-label': app.title, style: `left:${x}px;top:${y}px;width:${W}px;height:${H}px` }, tbar, body, rz);
    winsEl.append(w);
    const task = el('button', { class: 'task', role: 'tab', onclick: () => { const cur = wins.get(id); if (cur.el.classList.contains('min')) open(id); else if (cur.el.classList.contains('active')) minimise(id); else focus(id); } }, app.title.replace(/\.app.*/, ''));
    tasksEl.append(task);
    wins.set(id, { el: w, task, app });
    w.addEventListener('pointerdown', () => focus(id), true);
    dragify(w, tbar, id); resizify(w, rz);
    tbar.addEventListener('dblclick', (e) => { if (!e.target.closest('button')) toggleMax(id); });
    if (small() || id === 'aurax') w.classList.toggle('max', small());
    body.addEventListener('click', onOpenLink);
    focus(id);
    try { history.replaceState(null, '', '#' + id); } catch (e) {}
  }
  function close(id) { const w = wins.get(id); if (!w) return; w.el.remove(); w.task.remove(); wins.delete(id); const last = [...wins.keys()].pop(); if (last) focus(last); try { history.replaceState(null, '', location.pathname); } catch (e) {} }
  function minimise(id) { const w = wins.get(id); w.el.classList.add('min'); w.task.classList.add('m'); w.task.classList.remove('on'); const vis = [...wins].filter(([, v]) => !v.el.classList.contains('min')).pop(); if (vis) focus(vis[0]); }
  function toggleMax(id) { wins.get(id).el.classList.toggle('max'); }
  function onOpenLink(e) { const t = e.target.closest('[data-open]'); if (t) { e.preventDefault(); open(t.dataset.open); } }

  function dragify(w, bar, id) {
    bar.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button') || w.classList.contains('max')) return;
      const ox = e.clientX - w.offsetLeft, oy = e.clientY - w.offsetTop; bar.setPointerCapture(e.pointerId); w.classList.add('dragging');
      const mv = (ev) => { w.style.left = Math.max(-w.offsetWidth + 80, Math.min(deskEl.clientWidth - 80, ev.clientX - ox)) + 'px'; w.style.top = Math.max(0, Math.min(deskEl.clientHeight - 34, ev.clientY - oy)) + 'px'; };
      const up = () => { bar.removeEventListener('pointermove', mv); bar.removeEventListener('pointerup', up); w.classList.remove('dragging'); };
      bar.addEventListener('pointermove', mv); bar.addEventListener('pointerup', up);
    });
  }
  function resizify(w, h) {
    h.addEventListener('pointerdown', (e) => {
      e.preventDefault(); h.setPointerCapture(e.pointerId); w.classList.add('resizing');
      const sx = e.clientX, sy = e.clientY, sw = w.offsetWidth, sh = w.offsetHeight;
      const mv = (ev) => { w.style.width = Math.max(280, sw + ev.clientX - sx) + 'px'; w.style.height = Math.max(160, sh + ev.clientY - sy) + 'px'; };
      const up = () => { h.removeEventListener('pointermove', mv); h.removeEventListener('pointerup', up); w.classList.remove('resizing'); };
      h.addEventListener('pointermove', mv); h.addEventListener('pointerup', up);
    });
  }

  // ---------------------------------------------------------------- desktop icons + start menu
  const iconsEl = $('#icons');
  ICONS.forEach(([id, label]) => {
    const b = el('button', { class: 'ico', 'aria-label': 'Open ' + label, html: icon(APPS[id].icon) + `<span>${label}</span>` });
    const coarse = matchMedia('(pointer: coarse)').matches;
    b.addEventListener('click', () => { iconsEl.querySelectorAll('.ico').forEach((x) => x.classList.remove('sel')); b.classList.add('sel'); if (coarse || small()) open(id); });
    b.addEventListener('dblclick', () => open(id));
    b.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(id); });
    iconsEl.append(b);
  });
  deskEl.addEventListener('pointerdown', (e) => { if (!e.target.closest('.ico')) iconsEl.querySelectorAll('.ico').forEach((x) => x.classList.remove('sel')); });

  const menu = $('#menu'), start = $('#start');
  menu.innerHTML = `<header><b>Rakshak M K</b><span>software engineer</span></header>`;
  [['readme', 'readme', 'readme.txt'], ['folder', 'projects', 'Projects'], ['brief', 'career', 'career.log'], ['chip', 'skills', 'skills.sys'], ['term', 'terminal', 'Terminal'], ['pdf', 'resume', 'Resume'], ['mail', 'contact', 'Contact']]
    .forEach(([ic, id, label]) => menu.append(el('button', { role: 'menuitem', html: icon(ic) + label, onclick: () => { open(id); toggleMenu(false); } })));
  menu.append(el('hr'), el('a', { href: 'classic.html', role: 'menuitem', html: icon('classic') + 'Classic view' }));
  function toggleMenu(on) { const v = on ?? !menu.classList.contains('open'); menu.classList.toggle('open', v); start.setAttribute('aria-expanded', v); }
  start.addEventListener('click', (e) => { e.stopPropagation(); toggleMenu(); });
  addEventListener('pointerdown', (e) => { if (!e.target.closest('#menu, #start')) toggleMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleMenu(false); });

  // theme + CRT
  const setTheme = (t) => { document.documentElement.dataset.theme = t; try { localStorage.setItem('os-theme', t); } catch (e) {} };
  $('#b-theme').onclick = () => setTheme(document.documentElement.dataset.theme === 'paper' ? 'dark' : 'paper');
  const clock = $('#clock'); const tick = () => { clock.textContent = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }) + ' IST'; }; tick(); setInterval(tick, 20000);
  if (!reduce) document.body.classList.add('crt');

  // ---------------------------------------------------------------- terminal
  function buildTerminal() {
    const out = el('div'), input = el('input', { 'aria-label': 'Terminal input', spellcheck: 'false', autocomplete: 'off', autocapitalize: 'off' });
    const line = el('div', { class: 'in' }, el('span', { class: 'p' }, 'guest@rakshak.os:~$'), input);
    const t = el('div', { class: 'term', onclick: () => input.focus() }, out, line);
    const hist = []; let hi = 0;
    const print = (html) => { out.append(el('div', { class: 'o', html })); t.scrollTop = t.scrollHeight; };
    const A = (id, label) => `<a href="#${id}" data-open="${id}">${label || id}</a>`;
    const CMD = {
      help: () => 'commands:\n  about        who I am\n  projects     what I have built\n  experience   work and education\n  skills       the toolbox\n  contact      how to reach me\n  open &lt;app&gt;  floatchat | orvms | aurax | resume | projects | career\n  ls           list the desktop\n  theme        toggle dark/paper\n  clear        clear the screen',
      about: () => "Rakshak M K — software engineer. I build AI-driven, data-intensive systems and care about correctness you can test.\nBMSIT&amp;M CSE (CGPA 8.66) · Software Engineer Intern at ApthaAI · presented at ICMOTA 2026, IIT BHU.",
      projects: () => `1. ${A('aurax', 'AURAX')}       — GNSS-denied UAV mission stack (flagship; case study with measured results)\n2. ${A('orvms', 'ORVMS')}       — multi-tenant maritime risk platform, runs in your browser (226 tests)\n3. ${A('floatchat', 'FloatChat')}  — ask real Argo ocean data questions in English (PostgreSQL + pgvector, tools, browser demo)`,
      experience: () => 'ApthaAI — Software Engineer Intern (Jun 2026 – present): assurance platform prototype for AI agents in supply-chain workflows.\nB.E. CSE, BMSIT&amp;M (2023–2027), CGPA 8.66.',
      skills: () => 'C · C++ · Python · TypeScript · SQL | RAG · embeddings · agents | PostgreSQL · pgvector · D1 | Three.js · Workers | Git · Docker · CI',
      contact: () => `email     <a href="mailto:${LINKS.email}">${LINKS.email}</a>\nlinkedin  <a href="${LINKS.linkedin}" target="_blank" rel="noopener">rakshak-m-k</a>\ngithub    <a href="${LINKS.github}" target="_blank" rel="noopener">raksh3011</a>`,
      ls: () => ICONS.map(([, l]) => l).join('   '),
      theme: () => { setTheme(document.documentElement.dataset.theme === 'paper' ? 'dark' : 'paper'); return 'theme switched.'; },
      whoami: () => 'a recruiter, hopefully :)',
      sudo: () => 'nice try. permission denied.',
      date: () => new Date().toString(),
      clear: () => { out.innerHTML = ''; return null; },
    };
    const run = (cmd) => {
      const [c, ...a] = cmd.trim().split(/\s+/);
      if (!c) return;
      if (c === 'open') { const id = (a[0] || '').toLowerCase(); if (APPS[id]) { open(id); return print('opening ' + id + '…'); } return print(`open: no such app "${esc(a[0] || '')}"`); }
      const f = CMD[c.toLowerCase()];
      if (!f) return print(`command not found: ${esc(c)} — try <b>help</b>`);
      const r = f(); if (r) print(r);
    };
    const esc = (s) => s.replace(/[&<>]/g, (x) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[x]));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { const v = input.value; print(`<span class="p">guest@rakshak.os:~$</span> ${esc(v)}`); if (v.trim()) { hist.push(v); hi = hist.length; } run(v); input.value = ''; }
      else if (e.key === 'ArrowUp') { hi = Math.max(0, hi - 1); input.value = hist[hi] || ''; e.preventDefault(); }
      else if (e.key === 'ArrowDown') { hi = Math.min(hist.length, hi + 1); input.value = hist[hi] || ''; e.preventDefault(); }
    });
    print('<span class="d">terminal — type <b>help</b></span>');
    t.addEventListener('click', onOpenLink);
    setTimeout(() => input.focus(), 50);
    return t;
  }

  // ---------------------------------------------------------------- wallpaper
  const wall = $('#wall'); let wg, ww, wh, pts = [];
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  function wfit() { const d = Math.min(devicePixelRatio || 1, 2), r = deskEl.getBoundingClientRect(); wall.width = r.width * d; wall.height = r.height * d; wg = wall.getContext('2d'); wg.setTransform(d, 0, 0, d, 0, 0); ww = r.width; wh = r.height; pts = Array.from({ length: small() ? 220 : 700 }, () => ({ x: Math.random() * ww, y: Math.random() * wh, a: Math.random() })); wg.clearRect(0, 0, ww, wh); }
  const ang = (x, y, t) => Math.sin(x * 0.0021 + t * 0.00006) * 1.9 + Math.cos(y * 0.0027 - t * 0.00005) * 1.9;
  function wframe(t, still) {
    if (!still) { wg.globalCompositeOperation = 'destination-out'; wg.globalAlpha = 0.035; wg.fillStyle = '#000'; wg.fillRect(0, 0, ww, wh); wg.globalCompositeOperation = 'source-over'; } wg.strokeStyle = css('--accent'); wg.lineWidth = 1.3;
    for (const p of pts) { const a = ang(p.x, p.y, t), nx = p.x + Math.cos(a) * (still ? 2.4 : 1.6), ny = p.y + Math.sin(a) * (still ? 2.4 : 1.6); wg.globalAlpha = 0.25 + p.a * 0.45; wg.beginPath(); wg.moveTo(p.x, p.y); wg.lineTo(nx, ny); wg.stroke(); p.x = nx; p.y = ny; if (p.x < 0 || p.x > ww || p.y < 0 || p.y > wh || Math.random() < 0.002) { p.x = Math.random() * ww; p.y = Math.random() * wh; } }
    wg.globalAlpha = 1;
  }
  wfit(); addEventListener('resize', wfit);
  if (reduce) for (let i = 0; i < 260; i++) wframe(i * 16, true);
  else { const loop = (t) => { if (!document.hidden) wframe(t); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }

  // ---------------------------------------------------------------- boot + startup
  const boot = () => {
    const first = !sessionStorage.getItem('booted');
    try { sessionStorage.setItem('booted', '1'); } catch (e) {}
    if (!first || reduce) return startup();
    const b = el('div', { id: 'boot', role: 'status' }, el('b', {}, 'Rakshak M K'));
    document.body.append(b);
    const lines = ['mounting /projects ............ <span class="ok">ok</span>', 'loading floatchat, orvms, aurax ... <span class="ok">ok</span>', 'starting desktop ............... <span class="ok">ok</span>'];
    lines.forEach((l, i) => setTimeout(() => b.append(el('div', { html: l })), 250 + i * 260));
    b.append(el('small', {}, 'click to skip'));
    const done = () => { if (!b.isConnected) return; b.style.transition = 'opacity .35s'; b.style.opacity = '0'; setTimeout(() => b.remove(), 360); startup(); };
    setTimeout(done, 1300); b.addEventListener('click', done);
  };
  let started = false;
  function startup() {
    if (started) return; started = true;
    const hash = location.hash.slice(1);
    if (hash && APPS[hash]) open(hash);
    else open('readme');
  }
  addEventListener('hashchange', () => { const h = location.hash.slice(1); if (APPS[h]) open(h); });
  deskEl.addEventListener('click', onOpenLink);
  boot();
})();
