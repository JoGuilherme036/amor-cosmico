/* ============================================================
   FX — starfield (canvas), céu por capítulo, confete, estrela
   cadente, SFX (WebAudio), cursor, chuva de estrelas.
   ============================================================ */
(function () {
  'use strict';
  const AC = window.AC;

  /* ---------- Starfield: DPR correto, pausa fora de vista, contagem adaptativa ---------- */
  AC.sky = (function () {
    const cv = AC.$('#starfield'); if (!cv) return {};
    const ctx = cv.getContext('2d');
    let w = 0, h = 0, dpr = 1, stars = [], scrollY = 0, warp = 0, warpTarget = 0, shoot = null;
    const LAYERS = [{ s: 0.4, p: 0.02, a: 0.55 }, { s: 0.8, p: 0.05, a: 0.75 }, { s: 1.4, p: 0.1, a: 1 }];

    function count() {
      const base = Math.round((w * h) / 9000);
      const d = { low: 0.45, medium: 0.8, high: 1.3 }[AC.prefs.starDensity] || 0.8;
      let n = base * d;
      if (AC.weak()) n *= 0.6;
      if (AC.reduced()) n *= 0.7;
      return Math.max(40, Math.min(520, Math.round(n)));
    }
    function build() {
      const n = count(); stars = [];
      for (let i = 0; i < n; i++) {
        const l = LAYERS[i % 3 === 0 ? 2 : i % 3 === 1 ? 1 : 0];
        const hue = Math.random() < 0.18 ? (Math.random() < 0.5 ? 200 : 330) : 45;
        stars.push({ x: Math.random() * w, y: Math.random() * h, r: l.s * (0.6 + Math.random() * 0.8), p: l.p, a: l.a, t: Math.random() * 6.28, sp: 0.5 + Math.random() * 1.5, hue, col: `hsl(${hue} ${hue === 45 ? 30 : 90}% ${hue === 45 ? 92 : 75}%)` });
      }
      stars.sort((a, b) => (a.hue > b.hue) - (a.hue < b.hue)); // agrupa por cor: menos trocas de fillStyle
    }
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }
    let skip = 0; const lowFps = AC.weak();
    function frame(t, dt) {
      if (lowFps && (skip ^= 1)) return; // aparelhos fracos: 30 quadros por segundo bastam para o céu
      warp += (warpTarget - warp) * 0.06;
      ctx.clearRect(0, 0, w, h);
      const still = AC.reduced();
      let col = '';
      for (const s of stars) {
        let y = s.y - scrollY * s.p * 0.6;
        y = ((y % h) + h) % h;
        ctx.globalAlpha = s.a * (still ? 1 : 0.6 + 0.4 * Math.sin(t * 0.001 * s.sp + s.t));
        if (s.col !== col) { col = s.col; ctx.fillStyle = col; }
        if (warp > 0.02) ctx.fillRect(s.x, y, s.r, s.r * (4 + warp * 60 * s.p * 10));
        else if (s.r < 1.25) ctx.fillRect(s.x - s.r, y - s.r, s.r * 2, s.r * 2);
        else { ctx.beginPath(); ctx.arc(s.x, y, s.r, 0, 6.2832); ctx.fill(); }
      }
      ctx.globalAlpha = 1;
      if (shoot) {
        shoot.life += dt;
        const k = shoot.life / shoot.dur;
        if (k >= 1) shoot = null;
        else {
          const x = shoot.x + shoot.vx * shoot.life, y = shoot.y + shoot.vy * shoot.life;
          const g = ctx.createLinearGradient(x, y, x - shoot.vx * 160, y - shoot.vy * 160);
          g.addColorStop(0, 'rgba(255,255,255,' + (1 - k) + ')'); g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - shoot.vx * 160, y - shoot.vy * 160); ctx.stroke();
        }
      }
    }
    let on = false;
    function start() { if (!on) { on = true; AC.raf.add(frame); } }
    function stop() { on = false; AC.raf.remove(frame); }

    window.addEventListener('resize', AC.debounce(() => { if (Math.abs(window.innerWidth - w) > 40 || Math.abs(window.innerHeight - h) > 120) resize(); }, 250));
    window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });
    AC.on('prefs', () => { build(); });

    resize(); start();
    return {
      start, stop, // o Cosmos 3D desliga este céu 2D quando assume
      warp(on) { warpTarget = on ? 1 : 0; },
      shootingStar() { if (AC.reduced()) return; const a = AC.rand(0.4, 0.9); shoot = { x: AC.rand(0, w * 0.7), y: AC.rand(0, h * 0.4), vx: Math.cos(a) * 0.9, vy: Math.sin(a) * 0.9, dur: 900, life: 0 }; },
      rebuild: build
    };
  })();

  /* ---------- Cor do céu por seção/capítulo ---------- */
  AC.setSky = (() => {
    const layers = AC.$$('.sky__layer'); let cur = 'default';
    return (name) => {
      if (!name || name === cur) return; cur = name;
      layers.forEach((l) => l.classList.toggle('is-on', l.dataset.sky === name));
    };
  })();

  /* ---------- SFX sutil (WebAudio) ---------- */
  let actx = null;
  AC.ctx = () => { if (!actx) { const C = window.AudioContext || window.webkitAudioContext; if (C) { try { actx = new C(); } catch (_) {} } } if (actx && actx.state === 'suspended') actx.resume().catch(() => {}); return actx; };
  AC.sfx = (kind = 'chime') => {
    if (!AC.prefs.sfxEnabled) return;
    const c = AC.ctx(); if (!c) return;
    const now = c.currentTime;
    const notes = kind === 'sparkle' ? [1318, 1760, 2093] : kind === 'soft' ? [660] : [784, 1175];
    notes.forEach((f, i) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, now + i * 0.07); g.gain.linearRampToValueAtTime(0.05, now + i * 0.07 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.07 + 0.9);
      o.connect(g).connect(c.destination); o.start(now + i * 0.07); o.stop(now + i * 0.07 + 1);
    });
  };

  /* ---------- Confete de estrelas / corações ---------- */
  const SHAPES = ['<path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.8L5.700 21l1.700-7L2 9.200l7.100-.6z"/>', '<path d="M12 21s-7.500-4.600-9.600-9.200C.9 8.400 2.700 5 6 5c2 0 3.300 1 4.300 2.400h3.400C14.700 6 16 5 18 5c3.300 0 5.100 3.400 3.600 6.800C19.500 16.400 12 21 12 21z"/>'];
  const COLORS = ['#e8c987', '#ff5a9d', '#00cfff', '#b983ff', '#fff4d6'];
  AC.confetti = (x, y, n = 36, host) => {
    if (AC.reduced()) n = Math.min(n, 10);
    const parent = host || document.body;
    for (let i = 0; i < n; i++) {
      const el = document.createElement('div'); el.className = 'confetti';
      el.style.color = COLORS[i % COLORS.length]; const s = AC.rand(8, 20); el.style.width = el.style.height = s + 'px';
      el.innerHTML = `<svg viewBox="0 0 24 24">${SHAPES[i % 2 ? 1 : 0]}</svg>`;
      if (host) { el.style.position = 'absolute'; }
      parent.appendChild(el);
      const a = AC.rand(0, 6.283), v = AC.rand(120, 420), dx = Math.cos(a) * v, dy = Math.sin(a) * v - 120;
      const anim = el.animate([
        { transform: `translate(${x}px,${y}px) scale(0.2) rotate(0)`, opacity: 1 },
        { transform: `translate(${x + dx}px,${y + dy}px) scale(1) rotate(${AC.rand(-240, 240)}deg)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${x + dx * 1.15}px,${y + dy + 340}px) scale(0.6) rotate(${AC.rand(-360, 360)}deg)`, opacity: 0 }
      ], { duration: AC.rand(1400, 2400), easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' });
      anim.onfinish = () => el.remove();
    }
  };
  AC.celebrate = () => {
    AC.sfx('sparkle');
    const w = window.innerWidth, h = window.innerHeight;
    AC.confetti(w * 0.5, h * 0.4, 46); setTimeout(() => AC.confetti(w * 0.25, h * 0.5, 24), 200); setTimeout(() => AC.confetti(w * 0.75, h * 0.5, 24), 380);
    if (navigator.vibrate) navigator.vibrate(30);
  };
  AC.starRain = () => {
    AC.sfx('sparkle');
    const n = AC.reduced() ? 12 : 60, w = window.innerWidth;
    for (let i = 0; i < n; i++) setTimeout(() => AC.confetti(AC.rand(0, w), -20, 1), i * 60);
    AC.toast('Chove estrelas sobre vocês dois ✨');
  };

  /* ---------- Estrela cadente clicável (rara) ---------- */
  AC.startShooters = () => {
    const spawn = () => {
      if (!document.hidden && !AC.reduced() && AC.prefs.focusMode !== true && !document.body.classList.contains('is-locked')) {
        const el = document.createElement('div'); el.className = 'shooter'; el.setAttribute('role', 'button'); el.setAttribute('aria-label', 'Estrela cadente: toque para um recado');
        const rot = AC.rand(18, 38), dist = AC.rand(380, 640);
        el.style.cssText = `left:${AC.rand(10, 70)}%;top:${AC.rand(8, 40)}%;--rot:${rot}deg;--dist:${dist}px`;
        const done = () => el.remove();
        el.addEventListener('animationend', done);
        el.addEventListener('click', (e) => {
          e.stopPropagation(); el.remove(); AC.sfx('chime');
          const arr = AC.CONFIG.compliments; AC.toast(arr[Math.floor(Math.random() * arr.length)], 4200);
          const r = el.getBoundingClientRect(); AC.confetti(r.left, r.top, 14);
        });
        document.body.appendChild(el);
      }
      setTimeout(spawn, AC.rand(28000, 52000));
    };
    setTimeout(spawn, 14000);
  };

  /* ---------- Cursor personalizado (apenas pointer: fine) ---------- */
  AC.initCursor = () => {
    const el = AC.$('#cursor');
    if (!el || !window.matchMedia('(pointer: fine)').matches || AC.reduced()) return;
    let x = 0, y = 0, tx = 0, ty = 0;
    window.addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; el.classList.add('is-on'); }, { passive: true });
    document.addEventListener('pointerleave', () => el.classList.remove('is-on'));
    document.addEventListener('pointerover', (e) => { el.classList.toggle('is-hot', !!e.target.closest('a,button,[data-open],.tile,.ucard,input,select,.chip')); });
    AC.raf.add(() => { x += (tx - x) * 0.22; y += (ty - y) * 0.22; el.style.transform = `translate3d(${x}px,${y}px,0)`; });
  };

  /* ---------- Hover magnético (refinado) ---------- */
  AC.initMagnetic = () => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches || AC.reduced()) return;
    AC.$$('.btn--primary, .btn:not(.btn--icon):not(.btn--sm)').forEach((b) => {
      b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); b.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * 0.12) + 'px'); b.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * 0.22) + 'px'); b.style.transform = 'translate3d(var(--mx),var(--my),0)'; });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  };

  /* ---------- Inclinação 3D (tilt) ---------- */
  AC.tilt = (el, max = 8) => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    el.addEventListener('pointermove', (e) => {
      if (AC.reduced() || el.classList.contains('is-flipped')) return;
      const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(1000px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  };

  /* ---------- Estrelas da tela de entrada ---------- */
  AC.gateStars = () => {
    const cv = AC.$('#gate-stars'); if (!cv) return () => {};
    const ctx = cv.getContext('2d'); let w, h, st = [];
    const rs = () => { const d = Math.min(devicePixelRatio || 1, 2); w = innerWidth; h = innerHeight; cv.width = w * d; cv.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0); st = Array.from({ length: 140 }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.4 + 0.3, s: Math.random() * 2 + 0.5, t: Math.random() * 6 })); };
    rs();
    const f = (t) => { ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#fff'; st.forEach((s) => { ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.0006 * s.s + s.t)); ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill(); }); };
    AC.raf.add(f);
    return () => AC.raf.remove(f);
  };
})();
