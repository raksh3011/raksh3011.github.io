(() => {
  const $ = (s) => document.querySelector(s);
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const REGIONS = [
    ['arabian sea', { lat: [5, 26], lon: [50, 78] }],
    ['bay of bengal', { lat: [5, 24], lon: [78, 100] }],
    ['andaman sea', { lat: [5, 20], lon: [92, 100] }],
    ['mozambique channel', { lat: [-27, -10], lon: [32, 46] }],
    ['western australia', { lat: [-36, -10], lon: [100, 120] }],
    ['equator|equatorial', { lat: [-5, 5] }],
    ['southern indian|south indian|subantarctic', { lat: [-60, -30] }],
    ['tropical', { lat: [-23, 23] }],
    ['north indian', { lat: [0, 30] }],
  ];
  const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const SUGGEST = [
    'Temperature profiles in the Arabian Sea',
    'Compare salinity in the Arabian Sea vs the Bay of Bengal',
    'How many profiles near the equator in the first week?',
    'Where is the thermocline in the Bay of Bengal?',
    'Warmest profile at 100 m',
    'Floats within 500 km of 10N 70E',
    'Low-salinity river-influenced surface water',
  ];

  let DATA, LAND, VIEW = 'T', CUR = { sets: [], sel: null }, B;
  const el = { log: $('#log'), q: $('#q'), pills: $('#pills'), stats: $('#stats'), map: $('#map'), plot: $('#plot'), tip: $('#tip'), cnt: $('#mapcount') };

  // ---------- helpers ----------
  const hav = (a, b, c, d) => {
    const r = Math.PI / 180, x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2;
    return 12742 * Math.asin(Math.sqrt(x));
  };
  const day = (p) => +p.t.slice(8, 10);
  const lvIdx = (m) => DATA.levels.reduce((b, l, i) => (Math.abs(l - m) < Math.abs(DATA.levels[b] - m) ? i : b), 0);
  const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  const q = (arr, f) => { const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(f * (s.length - 1)))]; };
  const fmt = (v, d = 2) => (v == null || isNaN(v) ? '—' : v.toFixed(d));
  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  // ---------- query planner ----------
  function planPart(text) {
    const t = ' ' + text.toLowerCase() + ' ', f = { label: [], lat: null, lon: null, near: null, days: null, depth: null };
    for (const [re, box] of REGIONS) if (new RegExp('\\b(' + re + ')\\b').test(t)) {
      f.lat = box.lat || f.lat; f.lon = box.lon || f.lon; f.label.push(re.split('|')[0].replace(/\b\w/g, (c) => c.toUpperCase()));
    }
    // coordinates like "10N 70E" / "12.5 S, 80 E" / "10 degrees north"
    const lat = t.match(/(-?\d+(?:\.\d+)?)\s*°?\s*(?:deg(?:rees?)?\s*)?([ns])\b/), lon = t.match(/(-?\d+(?:\.\d+)?)\s*°?\s*(?:deg(?:rees?)?\s*)?([ew])\b/);
    if (lat && lon) {
      const la = (lat[2] === 's' ? -1 : 1) * Math.abs(+lat[1]), lo = (lon[2] === 'w' ? -1 : 1) * Math.abs(+lon[1]);
      const km = (t.match(/(?:within|inside|radius(?: of)?)\s*(\d+)\s*km/) || [])[1];
      f.near = { lat: la, lon: lo, km: km ? +km : 500 }; f.label.push(`${Math.abs(la)}°${lat[2].toUpperCase()} ${Math.abs(lo)}°${lon[2].toUpperCase()} ±${f.near.km} km`);
    } else {
      const nth = t.match(/\b(north|south) of (-?\d+(?:\.\d+)?)/);
      if (nth) { const v = +nth[2] * (nth[1] === 'south' && +nth[2] > 0 ? -1 : 1); f.lat = nth[1] === 'north' ? [v, 90] : [-90, v]; f.label.push(`${nth[1]} of ${nth[2]}°`); }
    }
    // dates (data covers Jan 2020, 31 daily files)
    const d1 = t.match(/\b(?:on |from |between )?(?:jan(?:uary)?\s*(\d{1,2})|(\d{1,2})(?:st|nd|rd|th)?\s*(?:of\s*)?jan(?:uary)?)\b/);
    const rng = t.match(/jan(?:uary)?\s*(\d{1,2})\s*(?:-|to|and|–)\s*(?:jan(?:uary)?\s*)?(\d{1,2})/);
    if (rng) { f.days = [+rng[1], +rng[2]]; f.label.push(`Jan ${rng[1]}–${rng[2]}`); }
    else if (d1) { const d = +(d1[1] || d1[2]); f.days = [d, d]; f.label.push(`Jan ${d}`); }
    else if (/first week/.test(t)) { f.days = [1, 7]; f.label.push('first week'); }
    else if (/second week/.test(t)) { f.days = [8, 14]; f.label.push('second week'); }
    else if (/third week/.test(t)) { f.days = [15, 21]; f.label.push('third week'); }
    else if (/(fourth|last) week|end of (the )?month/.test(t)) { f.days = [22, 31]; f.label.push('last week'); }
    else if (/first half/.test(t)) { f.days = [1, 15]; f.label.push('first half'); }
    else if (/second half/.test(t)) { f.days = [16, 31]; f.label.push('second half'); }
    const dep = t.match(/\b(?:at|around|near)\s*(\d{1,4})\s*(?:m|dbar|metres?|meters?)\b/);
    if (dep) f.depth = +dep[1]; else if (/\bsurface\b/.test(t)) f.depth = 0;
    return f;
  }
  const apply = (f) => DATA.profiles.filter((p) =>
    (!f.lat || (p.lat >= f.lat[0] && p.lat <= f.lat[1])) && (!f.lon || (p.lon >= f.lon[0] && p.lon <= f.lon[1])) &&
    (!f.near || hav(f.near.lat, f.near.lon, p.lat, p.lon) <= f.near.km) && (!f.days || (day(p) >= f.days[0] && day(p) <= f.days[1])));

  function plan(text) {
    const t = text.toLowerCase();
    const v = /salin|psal|salt/.test(t) ? 'S' : /temp|warm|cold|hot|thermo|heat/.test(t) ? 'T' : null;
    let intent = 'show';
    if (/\bcompare|\bvs\.?\b|versus|difference between/.test(t)) intent = 'compare';
    else if (/how many|count|number of/.test(t)) intent = 'count';
    else if (/thermocline|mixed layer|mld/.test(t)) intent = 'thermocline';
    else if (/warmest|hottest|highest|saltiest|coldest|coolest|lowest|freshest|extreme/.test(t)) intent = 'extreme';
    else if (/average|mean|typical|median/.test(t)) intent = 'mean';
    else if (/nearest|closest/.test(t)) intent = 'nearest';
    else if (/similar|like|resembl|influenc|river|upwelling|eddy|anomal|water mass|fresh|saline|monsoon|warm pool|stratif/.test(t)) intent = 'semantic';
    const f = planPart(text);
    let sets = null;
    if (intent === 'compare') {
      const parts = text.split(/\s+(?:vs\.?|versus|and|with|to|against|compared (?:to|with))\s+/i).filter((s) => s.trim());
      if (parts.length >= 2) {
        const base = planPart(text);
        sets = parts.slice(0, 2).map((s) => { const g = planPart(s); if (!g.lat && !g.lon && !g.near) { g.lat = null; } if (!g.days) g.days = base.days; if (g.depth == null) g.depth = base.depth; return g; })
          .filter((g) => g.lat || g.lon || g.near);
        if (sets.length < 2) { sets = null; intent = 'show'; }
      } else intent = 'show';
    }
    return { v: v || 'T', vGiven: !!v, intent, f, sets, text: t };
  }

  // ---------- profile math ----------
  const column = (profs, v, i) => profs.map((p) => p[v] && p[v][i]).filter((x) => x != null);
  function mld(p) { // depth where T falls 0.5 °C below the 20 dbar value
    if (!p.T) return null; const r = p.T[1] ?? p.T[0]; if (r == null) return null;
    for (let i = 2; i < p.T.length; i++) if (p.T[i] != null && r - p.T[i] >= 0.5) return DATA.levels[i - 1] + 0;
    return null;
  }
  function thermo(p) { // depth of maximum |dT/dz|
    if (!p.T) return null; let best = 0, at = null;
    for (let i = 1; i < p.T.length; i++) { const a = p.T[i - 1], b = p.T[i]; if (a == null || b == null) continue; const g = Math.abs(b - a); if (g > best) { best = g; at = (DATA.levels[i] + DATA.levels[i - 1]) / 2; } }
    return at;
  }

  // ---------- answer ----------
  function answer(text) {
    const P = plan(text); CUR.sel = null;
    const sets = P.sets ? P.sets.map((f) => ({ f, data: apply(f) })) : [{ f: P.f, data: apply(P.f) }];
    CUR.sets = sets; CUR.P = P;
    const main = sets[0].data, vn = P.v === 'T' ? 'temperature' : 'salinity', unit = P.v === 'T' ? '°C' : 'PSU';
    const di = P.f.depth != null ? lvIdx(P.f.depth) : null, dm = di != null ? DATA.levels[di] : null;
    let msg = '', pills = sets.flatMap((s) => s.f.label), stats = [];
    if (sets.every((s) => !s.data.length)) {
      msg = `I couldn't find profiles matching that. The sample covers the Indian Ocean, <b>January 2020</b> (31 daily files). Try a region like <i>Arabian Sea</i> or <i>Bay of Bengal</i>, or a date like <i>Jan 12</i>.`;
      CUR.sets = []; draw(); el.pills.innerHTML = ''; el.stats.innerHTML = ''; return msg;
    }
    const sd = (d) => (di != null ? column(d, P.v, di) : null);
    switch (P.intent) {
      case 'count': {
        const floats = new Set(main.map((p) => p.wmo)).size;
        msg = `<b>${main.length}</b> profiles from <b>${floats}</b> floats match.`;
        stats = [[main.length, 'Profiles'], [floats, 'Distinct floats'], [fmt(mean(main.map((p) => p.lat)), 1) + '°', 'Mean latitude'], [fmt(mean(main.map((p) => p.lon)), 1) + '°', 'Mean longitude']];
        break; }
      case 'thermocline': {
        const th = main.map((p) => p.f && p.f[3]).filter((x) => x != null), ml = main.map((p) => p.f && p.f[2]).filter((x) => x != null);
        msg = th.length ? `Across <b>${main.length}</b> profiles the sharpest temperature gradient (thermocline) sits at a median <b>${fmt(q(th, .5), 0)} dbar</b> (IQR ${fmt(q(th, .25), 0)}–${fmt(q(th, .75), 0)}). The mixed layer (0.5 °C drop) is ${ml.length ? `about <b>${fmt(q(ml, .5), 0)} dbar</b>` : 'deeper than the sampled range'}.` : 'Not enough temperature data to locate a thermocline.';
        stats = [[th.length ? fmt(q(th, .5), 0) + ' dbar' : '—', 'Median thermocline'], [ml.length ? fmt(q(ml, .5), 0) + ' dbar' : '—', 'Median mixed layer'], [main.length, 'Profiles']];
        P.v = 'T'; break; }
      case 'extreme': {
        const hi = /warmest|hottest|highest|saltiest/.test(P.text), use = di ?? lvIdx(0);
        const ranked = main.filter((p) => p[P.v] && p[P.v][use] != null).sort((a, b) => (hi ? b[P.v][use] - a[P.v][use] : a[P.v][use] - b[P.v][use]));
        if (!ranked.length) { msg = 'No valid readings at that depth for the selection.'; break; }
        const top = ranked[0]; CUR.sel = top;
        msg = `${hi ? 'Highest' : 'Lowest'} ${vn} at ${DATA.levels[use]} dbar: <b>${fmt(top[P.v][use])} ${unit}</b> — float ${top.wmo} at ${fmt(top.lat, 1)}°, ${fmt(top.lon, 1)}° on ${top.t.slice(0, 10)}.`;
        stats = [[fmt(top[P.v][use]) + ' ' + unit, hi ? 'Maximum' : 'Minimum'], [top.wmo, 'Float (WMO)'], [top.t.slice(5, 10), 'Date'], [ranked.length, 'Profiles ranked']]; break; }
      case 'nearest': {
        const f = P.f; if (!f.near) { msg = 'Give me a position, e.g. <i>nearest float to 10N 70E</i>.'; break; }
        const best = [...main.length ? main : DATA.profiles].sort((a, b) => hav(f.near.lat, f.near.lon, a.lat, a.lon) - hav(f.near.lat, f.near.lon, b.lat, b.lon))[0];
        CUR.sel = best; CUR.sets = [{ f, data: [best] }];
        msg = `Nearest profile: float <b>${best.wmo}</b>, ${fmt(hav(f.near.lat, f.near.lon, best.lat, best.lon), 0)} km away, observed ${best.t.slice(0, 10)}.`;
        stats = [[best.wmo, 'Float'], [fmt(hav(f.near.lat, f.near.lon, best.lat, best.lon), 0) + ' km', 'Distance'], [fmt(best.T?.[0]) + ' °C', 'Surface temp'], [fmt(best.S?.[0]) + ' PSU', 'Surface salinity']]; break; }
      case 'compare': {
        const rows = sets.map((s) => { const c = di != null ? column(s.data, P.v, di) : column(s.data, P.v, lvIdx(0)); return { n: s.data.length, m: c.length ? mean(c) : null }; });
        msg = `Comparing <b>${vn}</b> at ${dm ?? 0} dbar: <b>${sets[0].f.label[0] ?? 'A'}</b> averages ${fmt(rows[0].m)} ${unit} (${rows[0].n} profiles) vs <b>${sets[1].f.label[0] ?? 'B'}</b> ${fmt(rows[1].m)} ${unit} (${rows[1].n} profiles)` + (rows[0].m != null && rows[1].m != null ? ` — a difference of <b>${fmt(Math.abs(rows[0].m - rows[1].m))} ${unit}</b>.` : '.');
        stats = rows.map((r, i) => [fmt(r.m) + ' ' + unit, `${sets[i].f.label[0] ?? 'Set ' + (i + 1)} · n=${r.n}`]); break; }
      case 'semantic': {
        CUR.pendingSemantic = { text: P.f, q: text, f: P.f };
        return null; }
      case 'mean': case 'show': default: {
        const use = di ?? lvIdx(0), c = column(main, P.v, use);
        msg = `${main.length} profiles${pills.length ? ' for ' + pills.join(' · ') : ' in the sample'}. ${c.length ? `Mean ${vn} at ${DATA.levels[use]} dbar is <b>${fmt(mean(c))} ${unit}</b> (range ${fmt(Math.min(...c))}–${fmt(Math.max(...c))}).` : ''}`;
        const deep = column(main, P.v, lvIdx(1000));
        stats = [[main.length, 'Profiles'], [new Set(main.map((p) => p.wmo)).size, 'Floats'], [c.length ? fmt(mean(c)) + ' ' + unit : '—', `Mean @ ${DATA.levels[use]} dbar`], [deep.length ? fmt(mean(deep)) + ' ' + unit : '—', 'Mean @ 1000 dbar']];
      }
    }
    if (di != null && P.intent !== 'extreme') msg += ` <small>Depth snapped to the nearest ${dm} dbar level.</small>`;
    if (P.intent === 'show' && !P.vGiven) msg += ` <small>Toggle Temp / Salinity / T–S above the chart to switch variable.</small>`;
    VIEW = P.intent === 'thermocline' ? 'T' : (P.vGiven ? P.v : VIEW === 'TS' ? 'TS' : P.v);
    document.querySelectorAll('#seg button').forEach((b) => b.classList.toggle('on', b.dataset.v === VIEW));
    el.pills.innerHTML = pills.map((x) => `<span class="pill">${esc(x)}</span>`).join('') + `<span class="pill" style="color:var(--mute);border-color:var(--line2);background:none">plan: ${P.intent}${P.vGiven ? ' · ' + P.v : ''}</span>`;
    el.stats.innerHTML = stats.map(([a, b]) => `<div><b>${a}</b><span>${esc(String(b))}</span></div>`).join('');
    draw(); return msg;
  }

  // ---------- drawing ----------
  const fit = (c, h) => { const d = Math.min(devicePixelRatio || 1, 2), r = c.getBoundingClientRect(); c.width = r.width * d; c.height = (h || r.height) * d; const g = c.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0); return { g, w: r.width, h: h || r.height }; };
  const COL = () => [css('--accent'), css('--accent2')];

  function drawMap() {
    const { g, w, h } = fit(el.map), lons = DATA.profiles.map((p) => p.lon), lats = DATA.profiles.map((p) => p.lat);
    const x0 = Math.min(...lons) - 4, x1 = Math.max(...lons) + 4, y0 = Math.min(...lats) - 4, y1 = Math.max(...lats) + 4;
    const s = Math.min(w / (x1 - x0), h / (y1 - y0)), ox = (w - s * (x1 - x0)) / 2, oy = (h - s * (y1 - y0)) / 2;
    const X = (lo) => ox + (lo - x0) * s, Y = (la) => oy + (y1 - la) * s;
    B = { X, Y, s, ox, oy, x0, y1 };
    g.clearRect(0, 0, w, h);
    g.strokeStyle = css('--line'); g.lineWidth = 1; g.fillStyle = css('--mute'); g.font = '10px JetBrains Mono,monospace'; g.globalAlpha = .7;
    for (let lo = Math.ceil(x0 / 20) * 20; lo < x1; lo += 20) { g.beginPath(); g.moveTo(X(lo), 0); g.lineTo(X(lo), h); g.stroke(); g.fillText(lo + '°E', X(lo) + 3, h - 4); }
    for (let la = Math.ceil(y0 / 15) * 15; la < y1; la += 15) { g.beginPath(); g.moveTo(0, Y(la)); g.lineTo(w, Y(la)); g.stroke(); g.fillText(la + '°', 4, Y(la) - 3); }
    g.globalAlpha = 1; g.fillStyle = css('--line'); g.strokeStyle = css('--line2');
    for (const r of LAND) { g.beginPath(); r.forEach(([lo, la], i) => (i ? g.lineTo(X(lo), Y(la)) : g.moveTo(X(lo), Y(la)))); g.closePath(); g.fill(); g.stroke(); }
    const active = new Set(CUR.sets.flatMap((s, i) => s.data.map((p) => p.id))), cols = COL();
    g.fillStyle = css('--dim'); g.globalAlpha = active.size ? .35 : .8;
    for (const p of DATA.profiles) { if (active.has(p.id)) continue; g.beginPath(); g.arc(X(p.lon), Y(p.lat), 1.4, 0, 6.3); g.fill(); }
    g.globalAlpha = 1;
    CUR.sets.forEach((s, i) => { g.fillStyle = cols[i]; s.data.forEach((p) => { g.beginPath(); g.arc(X(p.lon), Y(p.lat), 2.3, 0, 6.3); g.fill(); }); });
    if (CUR.sel) { g.strokeStyle = css('--ink'); g.lineWidth = 2; g.beginPath(); g.arc(X(CUR.sel.lon), Y(CUR.sel.lat), 7, 0, 6.3); g.stroke(); }
    const n = CUR.sets.reduce((a, s) => a + s.data.length, 0);
    el.cnt.textContent = n ? `${n} highlighted of ${DATA.profiles.length}` : `${DATA.profiles.length} profiles`;
  }

  function drawPlot() {
    const { g, w, h } = fit(el.plot), m = { l: 48, r: 16, t: 14, b: 38 }, cols = COL(), L = DATA.levels;
    g.clearRect(0, 0, w, h);
    const view = VIEW, v = view === 'TS' ? null : view;
    const all = CUR.sel ? [{ f: {}, data: [CUR.sel] }] : CUR.sets;
    const ink = css('--mute'), grid = css('--line');
    g.font = '10px JetBrains Mono,monospace'; g.lineWidth = 1;
    if (!all.length) { g.fillStyle = ink; g.textAlign = 'center'; g.fillText('Ask a question to draw profiles', w / 2, h / 2); return; }
    if (view === 'TS') {
      const pts = []; all.forEach((s, si) => s.data.forEach((p) => L.forEach((_, i) => { if (p.T?.[i] != null && p.S?.[i] != null) pts.push([p.S[i], p.T[i], i, si]); })));
      if (!pts.length) return;
      const sx = [Math.min(...pts.map((a) => a[0])) - .1, Math.max(...pts.map((a) => a[0])) + .1], sy = [Math.min(...pts.map((a) => a[1])) - .5, Math.max(...pts.map((a) => a[1])) + .5];
      const X = (a) => m.l + (a - sx[0]) / (sx[1] - sx[0]) * (w - m.l - m.r), Y = (a) => h - m.b - (a - sy[0]) / (sy[1] - sy[0]) * (h - m.t - m.b);
      axes(g, w, h, m, sx, sy, X, Y, 'Salinity (PSU)', 'Temperature (°C)', grid, ink);
      pts.forEach(([s, t, i, si]) => { g.globalAlpha = .5; g.fillStyle = all.length > 1 ? cols[si] : `hsl(${190 - (i / (L.length - 1)) * 160} 70% 55%)`; g.beginPath(); g.arc(X(s), Y(t), 1.6, 0, 6.3); g.fill(); });
      g.globalAlpha = 1; if (all.length === 1) { g.fillStyle = ink; g.textAlign = 'right'; g.fillText('colour = depth (warm→surface, cool→deep)', w - m.r, m.t + 10); }
      return;
    }
    const vals = all.flatMap((s) => s.data.flatMap((p) => (p[v] || []).filter((x) => x != null)));
    if (!vals.length) return;
    const pad = (Math.max(...vals) - Math.min(...vals)) * .06 || 1, vx = [Math.min(...vals) - pad, Math.max(...vals) + pad];
    const X = (a) => m.l + (a - vx[0]) / (vx[1] - vx[0]) * (w - m.l - m.r), Y = (d) => m.t + (d / 1000) * (h - m.t - m.b);
    axes(g, w, h, m, vx, [1000, 0], X, (d) => Y(d), v === 'T' ? 'Temperature (°C)' : 'Salinity (PSU)', 'Depth (dbar)', grid, ink, true);
    all.forEach((s, si) => {
      const col = all.length > 1 ? cols[si] : cols[0], stride = Math.max(1, Math.floor(s.data.length / 60));
      g.strokeStyle = col; g.lineWidth = 1; g.globalAlpha = CUR.sel ? 1 : Math.max(.08, Math.min(.35, 12 / s.data.length));
      if (CUR.sel) g.lineWidth = 2.2;
      s.data.forEach((p, k) => { if (k % stride && !CUR.sel) return; line(g, p[v], X, Y, L); });
      g.globalAlpha = 1;
      if (!CUR.sel && s.data.length > 1) { // mean + p10-p90 band
        const mn = [], lo = [], hi = [];
        L.forEach((_, i) => { const c = column(s.data, v, i); if (c.length > 2) { mn[i] = mean(c); lo[i] = q(c, .1); hi[i] = q(c, .9); } else mn[i] = lo[i] = hi[i] = null; });
        g.fillStyle = col; g.globalAlpha = .13; g.beginPath(); let st = false;
        L.forEach((d, i) => { if (hi[i] == null) return; st ? g.lineTo(X(hi[i]), Y(d)) : g.moveTo(X(hi[i]), Y(d)); st = true; });
        for (let i = L.length - 1; i >= 0; i--) if (lo[i] != null) g.lineTo(X(lo[i]), Y(L[i]));
        g.closePath(); g.fill(); g.globalAlpha = 1; g.strokeStyle = col; g.lineWidth = 2.6; line(g, mn, X, Y, L);
      }
    });
    // legend
    g.textAlign = 'left'; g.font = '10px Inter,sans-serif'; let ly = m.t + 12;
    all.forEach((s, si) => { if (all.length < 2 && !CUR.sel) { g.fillStyle = ink; g.fillText('bold = mean · band = p10–p90', m.l + 8, ly); return; } const lab = CUR.sel ? `float ${CUR.sel.wmo}` : (s.f.label?.[0] || 'set ' + (si + 1)); g.fillStyle = cols[si]; g.fillText('● ' + lab + ` (n=${s.data.length})`, m.l + 8, ly); ly += 14; });
  }
  function line(g, arr, X, Y, L) { if (!arr) return; g.beginPath(); let on = false; arr.forEach((a, i) => { if (a == null) { on = false; return; } on ? g.lineTo(X(a), Y(L[i])) : g.moveTo(X(a), Y(L[i])); on = true; }); g.stroke(); }
  function axes(g, w, h, m, xr, yr, X, Y, xl, yl, grid, ink, depth) {
    g.strokeStyle = grid; g.fillStyle = ink; g.textAlign = 'center'; g.lineWidth = 1;
    const nice = (a, b, n) => { const st = (b - a) / n, p = 10 ** Math.floor(Math.log10(st)), s = [1, 2, 5, 10].find((k) => k * p >= st) * p; const o = []; for (let v = Math.ceil(a / s) * s; v <= b; v += s) o.push(v); return o; };
    nice(xr[0], xr[1], 5).forEach((t) => { g.beginPath(); g.moveTo(X(t), m.t); g.lineTo(X(t), h - m.b); g.stroke(); g.fillText(+t.toFixed(2), X(t), h - m.b + 14); });
    (depth ? [0, 200, 400, 600, 800, 1000] : nice(Math.min(...yr), Math.max(...yr), 5)).forEach((t) => { g.beginPath(); g.moveTo(m.l, Y(t)); g.lineTo(w - m.r, Y(t)); g.stroke(); g.textAlign = 'right'; g.fillText(+t.toFixed(1), m.l - 6, Y(t) + 3); });
    g.textAlign = 'center'; g.fillText(xl, (m.l + w - m.r) / 2, h - 6);
    g.save(); g.translate(11, (m.t + h - m.b) / 2); g.rotate(-Math.PI / 2); g.fillText(yl, 0, 0); g.restore();
  }
  const draw = () => { drawMap(); drawPlot(); };

  // map interaction
  el.map.addEventListener('mousemove', (e) => {
    if (!B) return; const r = el.map.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; let best = null, bd = 12;
    for (const p of DATA.profiles) { const d = Math.hypot(B.X(p.lon) - x, B.Y(p.lat) - y); if (d < bd) { bd = d; best = p; } }
    el.map.style.cursor = best ? 'pointer' : 'default'; el.map._hover = best;
    if (best) { el.tip.hidden = false; el.tip.textContent = `${best.wmo} · ${best.t.slice(5, 10)} · ${fmt(best.lat, 1)}°, ${fmt(best.lon, 1)}°`; el.tip.style.left = Math.min(x + 12, r.width - 190) + 'px'; el.tip.style.top = y + 40 + 'px'; } else el.tip.hidden = true;
  });
  el.map.addEventListener('mouseleave', () => (el.tip.hidden = true));
  el.map.addEventListener('click', () => { const p = el.map._hover; if (!p) return; CUR.sel = CUR.sel === p ? null : p; draw(); if (CUR.sel) say(`Float <b>${p.wmo}</b>, ${p.t.slice(0, 10)}: surface ${fmt(p.T?.[0])} °C / ${fmt(p.S?.[0])} PSU · thermocline ≈ ${fmt(p.f && p.f[3], 0)} dbar, mixed layer ≈ ${fmt(p.f && p.f[2], 0)} dbar.`); });
  document.querySelectorAll('#seg button').forEach((b) => (b.onclick = () => { VIEW = b.dataset.v; document.querySelectorAll('#seg button').forEach((x) => x.classList.toggle('on', x === b)); drawPlot(); }));

  // numeric constraints implied by wording (mirrors floatchat/features.py FACETS): embeddings blur antonyms, so apply them exactly
  const FACETS = [[/low[- ]salinity|fresh(?!est)|freshwater|river|runoff/, 1, '<', 33.8], [/high[- ]salinity|saline|salty|evaporation/, 1, '>=', 36],
    [/warm|warm pool|hot/, 0, '>=', 28], [/cold|cool/, 0, '<=', 22], [/shallow mixed|shallow mld/, 2, '<=', 25], [/deep mixed|deep mld/, 2, '>=', 60]];
  const facetsOf = (t) => FACETS.filter(([rx]) => rx.test(t.toLowerCase())).map(([, i, op, v]) => ({ i, op, v }));
  const passes = (p, fc) => fc.every(({ i, op, v }) => { const x = p.f && p.f[i]; return x != null && (op === '<' ? x < v : op === '<=' ? x <= v : op === '>' ? x > v : x >= v); });
  // ---------- in-browser semantic search (same MiniLM model as the Python backend) ----------
  let EMB, EXT;
  async function semantic(text, pool) {
    if (!EXT) {
      const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2');
      EXT = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    if (!EMB) EMB = new Int8Array(await (await fetch('data/emb.bin')).arrayBuffer());
    const out = await EXT([text], { pooling: 'mean', normalize: true }), q = out.data, D = DATA.dim || 384;
    const fc = facetsOf(text); let ids = pool && pool.length ? pool : DATA.profiles;
    ids = ids.filter((p) => passes(p, fc)); if (!ids.length) throw new Error('no profile satisfies: ' + (fc.length ? 'the numeric constraint in your question' : 'the filters'));
    return ids.map((p) => { let s = 0; const o = p.id * D; for (let i = 0; i < D; i++) s += EMB[o + i] * q[i]; return { p, score: s / 127 }; })
      .sort((a, b) => b.score - a.score).slice(0, 5);
  }

  // chat plumbing
  const add = (cls, html) => { const d = document.createElement('div'); d.className = 'msg ' + cls; d.innerHTML = html; el.log.appendChild(d); el.log.scrollTop = el.log.scrollHeight; };
  const say = (h) => add('a', h);
  const ask = async (text) => {
    text = text.trim(); if (!text) return; add('u', esc(text));
    const r = answer(text);
    if (r !== null) return say(r);
    const P = CUR.P, sp = CUR.pendingSemantic; CUR.pendingSemantic = null;
    const wait = document.createElement('div'); wait.className = 'msg a'; wait.innerHTML = 'Loading the embedding model (≈23 MB, cached after the first time)…'; el.log.appendChild(wait);
    try {
      const hits = await semantic(text, apply(sp.f));
      wait.remove();
      CUR.sets = [{ f: sp.f, data: hits.map((h) => h.p) }]; CUR.sel = hits[0].p; draw();
      el.pills.innerHTML = '<span class="pill">semantic search</span><span class="pill" style="color:var(--mute);border-color:var(--line2);background:none">tool: semantic · MiniLM-L6-v2 · cosine' + (facetsOf(text).length ? ' · hybrid facets' : '') + '</span>';
      el.stats.innerHTML = hits.slice(0, 4).map((h) => `<div><b>${fmt(h.score, 2)}</b><span>float ${h.p.wmo} · ${h.p.t.slice(5, 10)}</span></div>`).join('');
      say(`Closest profiles by meaning to “${esc(text)}”:<br>` + hits.slice(0, 3).map((h, i) => `<small style="display:block;margin-top:8px"><b>${i + 1}.</b> ${esc(h.p.s || '')} <i>(similarity ${fmt(h.score, 2)})</i></small>`).join(''));
    } catch (e) { wait.remove(); say('Semantic search needs to download the embedding model from a CDN and it failed (' + esc(String(e.message || e)) + '). The other question types work offline.'); }
  };
  $('#ask').addEventListener('submit', (e) => { e.preventDefault(); ask(el.q.value); el.q.value = ''; });
  $('#sugg').innerHTML = SUGGEST.map((s) => `<button type="button">${s}</button>`).join('');
  $('#sugg').addEventListener('click', (e) => e.target.tagName === 'BUTTON' && ask(e.target.textContent));
  $('#theme').onclick = () => { const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'), n = cur === 'light' ? 'dark' : 'light'; document.documentElement.dataset.theme = n; try { localStorage.setItem('theme', n); } catch (e) {} draw(); };
  addEventListener('resize', () => DATA && draw());

  Promise.all([fetch('data/profiles.json').then((r) => r.json()), fetch('data/land.json').then((r) => r.json())]).then(([d, l]) => {
    DATA = d; LAND = l;
    say(`Hi — I'm FloatChat. I can answer questions over <b>${d.profiles.length} real Argo profiles</b> from <b>${new Set(d.profiles.map((p) => p.wmo)).size} floats</b> across the Indian Ocean (January 2020). Try a suggestion below, or ask your own.`);
    draw();
    if (location.hash === '#demo') ask(SUGGEST[0]);
  }).catch(() => say('Could not load the dataset. Please refresh.'));
})();
