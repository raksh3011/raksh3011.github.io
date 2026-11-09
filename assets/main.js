(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  // nav + theme
  const nav = $('#nav');
  addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 8), { passive: true });
  $('#theme').onclick = () => {
    const cur = document.documentElement.dataset.theme ||
      (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    const next = cur === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
  };

  // reveal on scroll
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.12 });
  document.querySelectorAll('.rv').forEach((el) => io.observe(el));

  // helper: run an animation only while its canvas is visible
  const whileVisible = (el, step) => {
    let raf = 0, on = false;
    const loop = (t) => { step(t); raf = requestAnimationFrame(loop); };
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !on) { on = true; raf = requestAnimationFrame(loop); }
      else if (!e.isIntersecting && on) { on = false; cancelAnimationFrame(raf); }
    }).observe(el);
  };
  const fit = (c) => {
    const d = Math.min(devicePixelRatio || 1, 2), r = c.getBoundingClientRect();
    c.width = Math.max(1, r.width * d); c.height = Math.max(1, r.height * d);
    const g = c.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0);
    return { g, w: r.width, h: r.height };
  };

  // ---- hero: slow flow field (ocean-current feel) ----
  const hero = $('#field');
  if (hero) {
    let { g, w, h } = fit(hero);
    const N = innerWidth < 700 ? 260 : 620;
    const P = Array.from({ length: N }, () => ({ x: Math.random() * w, y: Math.random() * h, a: Math.random() }));
    const ang = (x, y, t) => Math.sin(x * 0.0021 + t * 0.00007) * 1.9 + Math.cos(y * 0.0027 - t * 0.00005) * 1.9;
    const draw = (t) => {
      g.fillStyle = css('--bg') + '1f'; // slow fade -> trails
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = 'rgba(0,0,0,0)';
      g.strokeStyle = css('--accent');
      for (const p of P) {
        const a = ang(p.x, p.y, t), nx = p.x + Math.cos(a) * 0.9, ny = p.y + Math.sin(a) * 0.9;
        g.globalAlpha = 0.07 + p.a * 0.18;
        g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(nx, ny); g.stroke();
        p.x = nx; p.y = ny;
        if (p.x < 0 || p.x > w || p.y < 0 || p.y > h || Math.random() < 0.002) { p.x = Math.random() * w; p.y = Math.random() * h; }
      }
      g.globalAlpha = 1;
    };
    // trails: fade by drawing translucent bg over canvas each frame
    const frame = (t) => {
      g.globalAlpha = 0.045; g.fillStyle = css('--bg'); g.fillRect(0, 0, w, h); g.globalAlpha = 1;
      draw(t);
    };
    addEventListener('resize', () => { ({ g, w, h } = fit(hero)); });
    if (reduce) { for (let i = 0; i < 260; i++) frame(i * 16); } else whileVisible(hero, frame);
  }

  // ---- card: FloatChat map from real data ----
  const vf = $('#v-float');
  if (vf) {
    Promise.all([fetch('floatchat/data/land.json').then((r) => r.json()), fetch('floatchat/data/profiles.json').then((r) => r.json())])
      .then(([land, d]) => {
        let { g, w, h } = fit(vf);
        const [x0, x1, y0, y1] = [28, 112, -42, 28];
        const X = (lon) => ((lon - x0) / (x1 - x0)) * w, Y = (lat) => h - ((lat - y0) / (y1 - y0)) * h;
        const paint = (k) => {
          g.clearRect(0, 0, w, h);
          g.fillStyle = css('--line'); g.strokeStyle = css('--line2');
          for (const ring of land) { g.beginPath(); ring.forEach(([lo, la], i) => (i ? g.lineTo(X(lo), Y(la)) : g.moveTo(X(lo), Y(la)))); g.closePath(); g.fill(); g.stroke(); }
          g.fillStyle = css('--accent');
          d.profiles.forEach((p, i) => {
            const on = (i * 7919) % 100 < k;
            g.globalAlpha = on ? 0.85 : 0; if (!on) return;
            g.beginPath(); g.arc(X(p.lon), Y(p.lat), 1.5, 0, 6.3); g.fill();
          });
          g.globalAlpha = 1;
        };
        let k = reduce ? 100 : 0; paint(k);
        if (!reduce) whileVisible(vf, () => { if (k < 100) { k += 1.2; paint(k); } });
        addEventListener('resize', () => { ({ g, w, h } = fit(vf)); paint(100); });
      });
  }

  // ---- card: ORVMS animated vessels on lanes ----
  const vo = $('#v-orvms');
  if (vo) {
    let { g, w, h } = fit(vo);
    const lanes = [
      [[.02, .28], [.3, .34], [.58, .5], [.98, .46]],
      [[.04, .8], [.34, .66], [.6, .58], [.97, .62]],
      [[.2, .02], [.34, .3], [.5, .62], [.62, .98]],
    ];
    const ships = Array.from({ length: 16 }, (_, i) => ({ l: i % 3, t: Math.random(), s: 0.0007 + Math.random() * 0.0012 }));
    const at = (L, t) => {
      const n = L.length - 1, f = Math.min(t, 0.9999) * n, i = Math.floor(f), u = f - i;
      return [(L[i][0] + (L[i + 1][0] - L[i][0]) * u) * w, (L[i][1] + (L[i + 1][1] - L[i][1]) * u) * h];
    };
    const frame = () => {
      g.clearRect(0, 0, w, h);
      g.setLineDash([3, 6]); g.strokeStyle = css('--line2'); g.lineWidth = 1;
      lanes.forEach((L) => { g.beginPath(); L.forEach(([a, b], i) => (i ? g.lineTo(a * w, b * h) : g.moveTo(a * w, b * h))); g.stroke(); });
      g.setLineDash([]);
      // risk zone
      const zx = w * 0.62, zy = h * 0.55, zr = Math.min(w, h) * 0.2;
      g.fillStyle = css('--accent2'); g.globalAlpha = 0.1; g.beginPath(); g.arc(zx, zy, zr, 0, 6.3); g.fill();
      g.globalAlpha = 0.5; g.strokeStyle = css('--accent2'); g.setLineDash([4, 4]); g.beginPath(); g.arc(zx, zy, zr, 0, 6.3); g.stroke(); g.setLineDash([]);
      ships.forEach((s) => {
        s.t += reduce ? 0 : s.s; if (s.t >= 1) s.t = 0;
        const [x, y] = at(lanes[s.l], s.t), hot = Math.hypot(x - zx, y - zy) < zr;
        g.fillStyle = hot ? css('--accent2') : css('--accent'); g.globalAlpha = 0.95;
        g.beginPath(); g.arc(x, y, hot ? 3.6 : 2.6, 0, 6.3); g.fill();
        if (hot) { g.globalAlpha = 0.35; g.beginPath(); g.arc(x, y, 7, 0, 6.3); g.stroke(); }
      });
      g.globalAlpha = 1;
    };
    frame();
    addEventListener('resize', () => { ({ g, w, h } = fit(vo)); frame(); });
    if (!reduce) whileVisible(vo, frame);
  }

  // ---- card: AURA-X trajectory ----
  const va = $('#v-aura');
  if (va) {
    const path = 'M30 290 C 90 250, 110 150, 175 150 S 270 230, 330 120 S 370 60, 375 40';
    va.innerHTML = `
      <defs><pattern id="gd" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="var(--accent2)" stroke-width="1" opacity=".35"/></pattern></defs>
      <g stroke="var(--line)" stroke-width="1" opacity=".7">${Array.from({ length: 9 }, (_, i) => `<line x1="${i * 50}" y1="0" x2="${i * 50}" y2="340"/><line x1="0" y1="${i * 45}" x2="400" y2="${i * 45}"/>`).join('')}</g>
      <ellipse cx="205" cy="190" rx="95" ry="70" fill="url(#gd)" stroke="var(--accent2)" stroke-dasharray="4 4" opacity=".9"/>
      <text x="205" y="196" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="10" fill="var(--accent2)" letter-spacing="1.5">GPS DENIED</text>
      <path d="${path}" fill="none" stroke="var(--line2)" stroke-width="1.5" stroke-dasharray="2 5"/>
      <path id="traj" d="${path}" fill="none" stroke="var(--accent)" stroke-width="2.2" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" from="1" to="0" dur="${reduce ? '0.01s' : '5s'}" fill="freeze" begin="0s"/></path>
      <circle cx="30" cy="290" r="5" fill="var(--bg)" stroke="var(--accent)" stroke-width="2"/>
      <circle cx="375" cy="40" r="5" fill="var(--accent)"/>
      <g id="wing"><path d="M-9 0 L6 -3 L10 0 L6 3Z M-3 -1 L-9 -9 L-6 -9 L1 -1Z M-3 1 L-9 9 L-6 9 L1 1Z" fill="var(--ink)"/>${reduce ? '' : `<animateMotion dur="5s" repeatCount="indefinite" rotate="auto"><mpath href="#traj"/></animateMotion>`}</g>`;
  }
})();
