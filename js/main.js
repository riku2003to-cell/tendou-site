(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ================= menu ================= */
  const menuBtn = $('#menuBtn');
  menuBtn.addEventListener('click', () => {
    const o = document.body.classList.toggle('menu-open');
    menuBtn.setAttribute('aria-expanded', o);
  });
  $$('#nav a').forEach(a => a.addEventListener('click', () => {
    document.body.classList.remove('menu-open'); menuBtn.setAttribute('aria-expanded', false);
  }));

  /* ================= wireframe house ================= */
  const hero = $('#hero'), stage = $('#stage'), cv = $('#cv'), ctx = cv.getContext('2d');
  const M = [];
  let seed = 7; const rnd = (a = 0, b = 1) => { seed = (seed * 16807) % 2147483647; return a + (seed / 2147483647) * (b - a); };
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = a => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const EDGES = []; for (let i = 0; i < 8; i++) for (const bit of [1, 2, 4]) if (!(i & bit)) EDGES.push([i, i | bit]);

  function box(a, b, w, h, kind) {
    const d = sub(b, a), L = Math.hypot(...d), u = norm(d);
    const up = Math.abs(u[1]) > .9 ? [1, 0, 0] : [0, 1, 0];
    const s = norm(cross(u, up)), v = cross(s, u);
    const c = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    const pts = [];
    for (let i = 0; i < 8; i++) {
      const di = (i & 4 ? 1 : -1) * L / 2, si = (i & 2 ? 1 : -1) * w / 2, vi = (i & 1 ? 1 : -1) * h / 2;
      pts.push([u[0] * di + s[0] * si + v[0] * vi, u[1] * di + s[1] * si + v[1] * vi, u[2] * di + s[2] * si + v[2] * vi]);
    }
    M.push({ c, pts, edges: EDGES, kind, top: Math.max(a[1], b[1]) });
  }
  function panel(q, kind) {
    const c = [0, 1, 2].map(k => (q[0][k] + q[1][k] + q[2][k] + q[3][k]) / 4);
    M.push({ c, pts: q.map(p => sub(p, c)), edges: [[0, 1], [1, 2], [2, 3], [3, 0]], fill: true, kind, top: Math.max(...q.map(p => p[1])) });
  }
  // 木造2階建て 軸組（5間 × 4間）
  const X = 4.55, Z = 3.64, F0 = .45, F1 = 3.25, F2 = 6.05, R = 8.0, E = .55, P = .12;
  const xs = [-X, -X / 2, 0, X / 2, X];
  [[-X, -Z, X, -Z], [-X, Z, X, Z], [-X, -Z, -X, Z], [X, -Z, X, Z], [-X, 0, X, 0], [0, -Z, 0, Z]].forEach(([x1, z1, x2, z2]) => box([x1, F0 / 2 - .05, z1], [x2, F0 / 2 - .05, z2], .16, F0 + .1, 'found'));
  [[-X, -Z, X, -Z], [-X, Z, X, Z], [-X, -Z, -X, Z], [X, -Z, X, Z]].forEach(([x1, z1, x2, z2]) => box([x1, F0 + .06, z1], [x2, F0 + .06, z2], P, P, 'sill'));
  xs.forEach(x => [-Z, Z].forEach(z => box([x, F0 + .12, z], [x, F2, z], P, P, 'post')));
  [-X, X, 0].forEach(x => box([x, F0 + .12, 0], [x, F2, 0], P, P, 'post'));
  [F1, F2].forEach(y => {
    box([-X, y, -Z], [X, y, -Z], P, .24, 'beam'); box([-X, y, Z], [X, y, Z], P, .24, 'beam');
    box([-X, y, -Z], [-X, y, Z], P, .24, 'beam'); box([X, y, -Z], [X, y, Z], P, .24, 'beam');
    box([-X, y, 0], [X, y, 0], P, .2, 'beam');
  });
  for (let x = -X + .91; x < X - .1; x += .91) box([x, F1 + .17, -Z], [x, F1 + .17, Z], .06, .1, 'joist');
  [[-X, -X / 2, -Z], [X / 2, X, -Z], [-X / 2, 0, Z], [0, X / 2, Z]].forEach(([x1, x2, z]) => { box([x1, F0 + .15, z], [x2, F1 - .1, z], .05, .09, 'brace'); box([x2, F1 + .15, z], [x1, F2 - .1, z], .05, .09, 'brace'); });
  box([-X, F0 + .15, -Z], [-X, F1 - .1, 0], .05, .09, 'brace'); box([X, F1 + .15, 0], [X, F2 - .1, Z], .05, .09, 'brace');
  xs.forEach(x => box([x, F2 + .12, 0], [x, R, 0], .1, .1, 'strut'));
  box([-X - E, R, 0], [X + E, R, 0], P, .2, 'ridge');
  [-1, 1].forEach(sg => box([-X - E, lerp(F2, R, .5) + .05, sg * Z / 2], [X + E, lerp(F2, R, .5) + .05, sg * Z / 2], .1, .1, 'purlin'));
  const eaveY = F2 - (E / Z) * (R - F2);
  for (let x = -X - E + .2; x <= X + E - .1; x += .455) [-1, 1].forEach(sg => box([x, eaveY + .1, sg * (Z + E)], [x, R + .1, 0], .045, .09, 'rafter'));
  [-1, 1].forEach(sg => panel([[-X - E, eaveY + .2, sg * (Z + E)], [X + E, eaveY + .2, sg * (Z + E)], [X + E, R + .2, 0], [-X - E, R + .2, 0]], 'roof'));
  [[-X, -Z, X, -Z], [X, -Z, X, Z]].forEach(([x1, z1, x2, z2]) => {
    panel([[x1, F0 + .1, z1], [x2, F0 + .1, z2], [x2, F1, z2], [x1, F1, z1]], 'wall');
    panel([[x1, F1, z1], [x2, F1, z2], [x2, F2, z2], [x1, F2, z1]], 'wall');
  });

  // 解体順：屋根材・外装 → 上から躯体 → 土台・基礎
  const maxTop = R + .2;
  M.forEach(m => {
    m.out = norm([m.c[0] + rnd(-1, 1), rnd(-.2, .4), m.c[2] + rnd(-1, 1)]);
    m.dist = rnd(1.4, 3.4); m.rot = [rnd(-1.2, 1.2), rnd(-1.2, 1.2), rnd(-1.2, 1.2)];
    if (m.kind === 'roof' || m.kind === 'wall') { m.start = m.kind === 'roof' ? rnd(.02, .05) : rnd(.06, .11); m.dur = .1; m.dist = rnd(2.5, 4); m.lift = 2; }
    else if (m.kind === 'found' || m.kind === 'sill') { m.start = (m.kind === 'sill' ? .56 : .62) + rnd(0, .07); m.dur = .1; m.sink = true; }
    else { m.start = .15 + (1 - m.top / maxTop) * .36 + rnd(0, .05); m.dur = .1; m.lift = 1; }
  });

  let W = 0, H = 0, DPR = 1, yaw = -.62, yawT = -.62, pitch = .36, introP = reduce ? 0 : 1, pS = 0, mx = 0, my = 0, mxS = 0, myS = 0;
  function size() {
    const w = stage.clientWidth, h = stage.clientHeight;
    const d = Math.min(devicePixelRatio || 1, w < 760 ? 1.5 : 2);
    // スマホはアドレスバーの出入りでも resize が来るので、寸法が変わらなければ canvas を作り直さない
    if (w === W && h === H && d === DPR) return;
    W = w; H = h; DPR = d;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  const easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

  function render(p) {
    ctx.clearRect(0, 0, W, H);
    const mobile = W < 760;
    const cx = mobile ? W * .5 : W * .63, cy = mobile ? H * .33 : H * .5;
    const dist = 26 - p * 3;
    const f = (mobile ? Math.min(W * 1.25, H * .8) : Math.min(W * .7, H * 1.08)) * (dist / 26) * .95;
    const yw = yaw + mxS * .2, cyw = Math.cos(yw), syw = Math.sin(yw);
    const pt = pitch + myS * .06, cp = Math.cos(pt), sp = Math.sin(pt);
    const proj = (x, y, z) => {
      y -= 3.4;
      const x1 = x * cyw - z * syw, z1 = x * syw + z * cyw;
      const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp + dist;
      return [cx + x1 * f / z2, cy - y2 * f / z2, z2];
    };
    // ground grid（910mm モジュール）
    ctx.lineWidth = 1;
    const G = 14, step = .91;
    for (let i = -G; i <= G; i++) {
      const a = .075 * (1 - Math.abs(i) / (G + 1));
      ctx.strokeStyle = `rgba(235,231,224,${a})`;
      const v = i * step, lim = G * step;
      let A = proj(v, 0, -lim), B = proj(v, 0, lim); ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
      A = proj(-lim, 0, v); B = proj(lim, 0, v); ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
    }
    // 敷地境界（更地になると現れる）
    const sp2 = smooth(.74, .95, p);
    if (sp2 > 0) {
      const lot = [[-6.5, -5.5], [6.5, -5.5], [6.5, 5.5], [-6.5, 5.5]];
      ctx.strokeStyle = `rgba(255,123,26,${.9 * sp2})`; ctx.lineWidth = 1.2; ctx.setLineDash([6, 6]);
      ctx.beginPath();
      const total = 4 * sp2;
      for (let k = 0; k < 4 && k < total; k++) {
        const a = lot[k], b = lot[(k + 1) % 4], t = Math.min(1, total - k);
        const P1 = proj(a[0], 0, a[1]), P2 = proj(lerp(a[0], b[0], t), 0, lerp(a[1], b[1], t));
        ctx.moveTo(P1[0], P1[1]); ctx.lineTo(P2[0], P2[1]);
      }
      ctx.stroke(); ctx.setLineDash([]);
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(235,231,224,${.7 * sp2})`; ctx.font = '500 11px "IBM Plex Mono", monospace';
      let L = proj(0, 0, 6.3); ctx.fillText('13,000', L[0], L[1]);
      L = proj(7.3, 0, 0); ctx.fillText('11,000', L[0], L[1]);
      ctx.fillStyle = `rgba(255,123,26,${sp2})`; ctx.font = '500 12px "IBM Plex Mono", monospace';
      L = proj(0, 0, 0); ctx.fillText('SITE CLEARED', L[0], L[1]);
    }
    for (const m of M) {
      const t = clamp((p - m.start) / m.dur);
      if (t >= 1) continue;
      const e = easeIO(t);
      const alpha = 1 - smooth(.35, 1, t);
      const ox = m.out[0] * m.dist * e, oz = m.out[2] * m.dist * e;
      const oy = m.sink ? -e * 1.2 : Math.sin(Math.PI * e) * .9 * m.lift - e * e * 2.2;
      const rx = m.rot[0] * e, ry = m.rot[1] * e, rz = m.rot[2] * e;
      const cxr = Math.cos(rx), sxr = Math.sin(rx), cyr = Math.cos(ry), syr = Math.sin(ry), czr = Math.cos(rz), szr = Math.sin(rz);
      const P2 = m.pts.map(([x, y, z]) => {
        const y1 = y * cxr - z * sxr, z1 = y * sxr + z * cxr;
        const x2 = x * cyr + z1 * syr, z2 = -x * syr + z1 * cyr;
        const x3 = x2 * czr - y1 * szr, y3 = x2 * szr + y1 * czr;
        return proj(x3 + m.c[0] + ox, y3 + m.c[1] + oy, z2 + m.c[2] + oz);
      });
      const depth = clamp(1.3 - (P2[0][2] - dist + 8) / 20, .3, 1);
      const active = t > 0;
      if (m.fill) {
        ctx.fillStyle = active ? `rgba(255,123,26,${.08 * alpha})` : `rgba(235,231,224,${.03 * alpha})`;
        ctx.beginPath(); P2.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fill();
      }
      ctx.strokeStyle = active ? `rgba(255,123,26,${.95 * alpha})` : `rgba(235,231,224,${(m.fill ? .28 : .6) * depth * alpha})`;
      ctx.lineWidth = active ? 1.1 : .75;
      ctx.beginPath();
      for (const [i, j] of m.edges) { ctx.moveTo(P2[i][0], P2[i][1]); ctx.lineTo(P2[j][0], P2[j][1]); }
      ctx.stroke();
    }
  }

  /* drag to rotate (mouse) */
  const tip = $('#dragTip'); let drag = null;
  stage.addEventListener('pointermove', e => {
    const r = stage.getBoundingClientRect();
    mx = (e.clientX - r.left) / r.width - .5; my = (e.clientY - r.top) / r.height - .5;
    if (e.pointerType === 'mouse' && !e.target.closest('a,button,p,h1')) {
      tip.style.opacity = 1; tip.style.transform = `translate(${e.clientX - r.left + 18}px,${e.clientY - r.top + 18}px)`;
    } else tip.style.opacity = 0;
    if (drag) yawT = drag.y0 + (e.clientX - drag.x) * .006;
  });
  stage.addEventListener('pointerleave', () => { tip.style.opacity = 0; mx = my = 0; });
  stage.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.target.closest('a,button')) return;
    drag = { x: e.clientX, y0: yawT }; stage.style.cursor = 'grabbing';
  });
  addEventListener('pointerup', () => { drag = null; stage.style.cursor = ''; });

  /* ================= hero UI ================= */
  const pctEl = $('#pct'), phaseEls = $$('#phases li'), phaseNow = $('#phaseNow');
  const phaseNames = ['屋根材・外装の撤去', '上屋の解体', '基礎の撤去・搬出', '整地・お引渡し'];
  const bounds = [0, .15, .56, .76];
  let lastPhase = -2, lastPct = -1;
  function heroUI(p) {
    const pct = Math.round(p * 100);
    if (pct !== lastPct) { pctEl.firstChild.nodeValue = String(pct).padStart(3, '0'); lastPct = pct; }
    let ph = -1; if (p > .01) for (let i = 0; i < 4; i++) if (p >= bounds[i]) ph = i;
    if (ph !== lastPhase) {
      phaseEls.forEach((li, i) => { li.classList.toggle('on', i === ph); li.classList.toggle('done', i < ph); });
      phaseNow.textContent = ph < 0 ? '建物' : phaseNames[ph];
      lastPhase = ph;
    }
    hero.classList.toggle('cleared', p > .86);
  }

  /* ================= reveals ================= */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.remove('pre'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -10% 0px' });
  if (!reduce) {
    $$('.lines, .rv, .clip, .mega').forEach((el, i) => {
      if (el.closest('.hero')) return;
      if (el.getBoundingClientRect().top > innerHeight * .95) {
        el.classList.add('pre');
        if (el.classList.contains('rv')) el.style.transitionDelay = (i % 3) * 70 + 'ms';
        io.observe(el);
      }
    });
    $$('.mega span').forEach((s, i) => s.style.transitionDelay = i * 60 + 'ms');
  }

  /* ================= process (horizontal) ================= */
  const proc = $('#process'), ptrack = $('#ptrack'), pbar = $('#pbar'), pCount = $('#pCount'), pcards = $$('.pcard');
  const wide = matchMedia('(min-width: 861px)');
  let pDist = 0;
  function sizeProc() {
    if (!wide.matches) { proc.style.height = ''; ptrack.style.transform = ''; return; }
    pDist = Math.max(0, ptrack.scrollWidth - innerWidth);
    proc.style.height = (innerHeight + pDist) + 'px';
  }

  /* ================= marquee ================= */
  const mq = $('#mq'); let mqX = 0, mqHalf = 0, lastY = scrollY, vel = 0;
  const sizeMq = () => { mqHalf = mq.scrollWidth / 2; };

  const pars = $$('[data-par]');
  const hdr = $('#hdr'), callbar = $('#callbar');

  function layout() { size(); sizeProc(); sizeMq(); }
  layout();
  let lastW = innerWidth;
  addEventListener('resize', () => {
    // 幅が同じ（＝アドレスバーの出入りだけ）ならスマホでは組み直さない
    if (!wide.matches && innerWidth === lastW) return;
    lastW = innerWidth;
    clearTimeout(layout.t); layout.t = setTimeout(layout, 120);
  });
  addEventListener('load', layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  if ('ResizeObserver' in window) new ResizeObserver(() => { sizeProc(); sizeMq(); }).observe(ptrack);
  if (wide.addEventListener) wide.addEventListener('change', layout);

  /* ================= intro ================= */
  const t0 = performance.now();
  setTimeout(() => hero.classList.remove('intro-wait'), reduce ? 0 : 700);

  /* ================= main loop ================= */
  let prev = performance.now();
  function loop(now) {
    const dt = Math.min(50, now - prev); prev = now;
    const y = scrollY, vh = innerHeight;
    vel = lerp(vel, y - lastY, .15); lastY = y;

    // 先に位置をまとめて読み、そのあとで書き込む（読み書きが交互になると毎フレーム再レイアウトが走りカクつく）
    const hr = hero.getBoundingClientRect();
    const pr = wide.matches ? proc.getBoundingClientRect() : null;
    const cardMids = wide.matches ? null : pcards.map(c => { const b = c.getBoundingClientRect(); return b.top + b.height / 2; });
    const parRects = reduce ? [] : pars.map(img => img.parentElement.getBoundingClientRect());

    if (!reduce) introP = 1 - easeIO(clamp((now - t0 - 100) / 2600));
    const pRaw = clamp(-hr.top / Math.max(1, hr.height - vh));
    pS = reduce ? pRaw : lerp(pS, pRaw, .1);
    if (Math.abs(pS - pRaw) < .0005) pS = pRaw;
    if (!reduce && !drag) yawT += dt * .00004;
    yaw = lerp(yaw, yawT, .08); mxS = lerp(mxS, mx, .06); myS = lerp(myS, my, .06);
    if (hr.bottom > 0) { render(Math.max(pS, introP * .999)); heroUI(pS); }

    hdr.classList.toggle('solid', hr.bottom < 90);
    callbar.classList.toggle('show', y > vh * .6);

    if (mqHalf) {
      mqX -= (reduce ? 0 : (.6 + Math.min(14, Math.abs(vel)) * .5)) * (dt / 16);
      if (mqX <= -mqHalf) mqX += mqHalf;
      mq.style.transform = `translate3d(${mqX.toFixed(2)}px,0,0) skewX(${reduce ? 0 : clamp(-vel * .25, -10, 10).toFixed(2)}deg)`;
    }

    if (pr) {
      const r = pr;
      if (r.bottom > 0 && r.top < vh) {
        const pp = clamp(-r.top / Math.max(1, r.height - vh));
        ptrack.style.transform = `translate3d(${(-pDist * pp).toFixed(1)}px,0,0)`;
        pbar.style.transform = `scaleX(${pp.toFixed(4)})`;
        const idx = Math.min(4, Math.round(pp * 4));
        pcards.forEach((c, i) => c.classList.toggle('on', i === idx));
        pCount.textContent = '0' + (idx + 1);
      }
    } else {
      let best = -1, bd = 1e9; cardMids.forEach((m, i) => { const d = Math.abs(m - vh * .5); if (d < bd) { bd = d; best = i; } }); pcards.forEach((c, i) => c.classList.toggle('on', i === best));
    }

    if (!reduce) pars.forEach((img, i) => {
      const b = parRects[i];
      if (b.bottom < 0 || b.top > vh) return;
      const k = (b.top + b.height / 2 - vh / 2) / vh;
      img.style.setProperty('--py', (-6.5 - k * 7).toFixed(2) + '%');
    });
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  /* ================= before/after ================= */
  $$('.ba').forEach(b => { const i = $('input', b); i.addEventListener('input', () => b.style.setProperty('--p', i.value + '%')); });

  /* ================= FAQ smooth ================= */
  $$('#faqList details').forEach(d => {
    const s = $('summary', d), a = $('.a', d);
    let busy = false;
    s.addEventListener('click', e => {
      if (reduce || !a.animate) return;
      e.preventDefault(); if (busy) return; busy = true;
      if (d.open) {
        const h = a.offsetHeight;
        a.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 450, easing: 'cubic-bezier(.19,1,.22,1)' }).onfinish = () => { d.open = false; busy = false; };
      } else {
        d.open = true; const h = a.offsetHeight;
        a.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 600, easing: 'cubic-bezier(.19,1,.22,1)' }).onfinish = () => { busy = false; };
      }
    });
  });

  /* ================= copy / presets ================= */
  $$('[data-copy]').forEach(btn => btn.addEventListener('click', () => {
    const done = () => { btn.textContent = 'コピーしました'; setTimeout(() => btn.textContent = '番号をコピー', 1800); };
    const sel = () => { const r = document.createRange(); r.selectNodeContents($('#telNum')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent = '番号を選択しました'; };
    try { navigator.clipboard.writeText(btn.dataset.copy).then(done, sel); } catch (e) { sel(); }
  }));
  $$('[data-kind]').forEach(a => a.addEventListener('click', () => { const r = document.getElementById(a.dataset.kind); if (r) r.checked = true; }));

  /* ================= form ================= */
  const form = $('#form'), status = $('#status');
  form.addEventListener('submit', async e => {
    e.preventDefault(); status.className = 'status';
    const name = $('#name').value.trim(), tel = $('#tel').value.trim();
    if (!name || !tel) { status.className = 'status err'; status.textContent = 'お名前と電話番号を入力してください。'; (!name ? $('#name') : $('#tel')).focus(); return; }
    if (!$('#agree').checked) { status.className = 'status err'; status.textContent = '個人情報の取り扱いへの同意にチェックを入れてください。'; $('#agree').focus(); return; }
    const key = form.access_key.value;
    if (!key || key.startsWith('YOUR_')) { status.className = 'status err'; status.textContent = '現在フォームの送信設定中です。お手数ですが、お電話（090-6164-3039）またはLINEでご連絡ください。'; return; }
    status.textContent = '送信しています…';
    try {
      const res = await fetch(form.action, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) });
      const j = await res.json(); if (!j.success) throw 0;
      form.reset(); status.className = 'status ok'; status.textContent = 'お問い合わせを受け付けました。担当者よりご連絡します。';
    } catch (err) { status.className = 'status err'; status.textContent = '送信できませんでした。お手数ですが、お電話（090-6164-3039）でご連絡ください。'; }
  });
})();
