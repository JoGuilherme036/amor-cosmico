/* SURPRESA — raspadinha de poeira estelar: brilho no ponteiro, partículas, vibração, confete e mini-álbum */
(function () {
  'use strict';
  const AC = window.AC, { $ } = AC;

  AC.initScratch = function () {
    const stage = $('#sc-stage'), cv = $('#sc-canvas'); if (!stage || !cv) return;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    const pct = $('#sc-pct'), bar = $('#sc-bar'), photo = $('#sc-photo');
    const m = AC.get(AC.CONFIG.surprisePhoto);
    if (m) { photo.innerHTML = AC.pic(m, { sizes: '(min-width:600px) 520px, 92vw', eager: false }); photo.style.setProperty('--ph', m.color); photo.style.setProperty('--fy', '30%'); }

    const glow = AC.html('<div aria-hidden="true" style="position:absolute;z-index:5;width:90px;height:90px;margin:-45px 0 0 -45px;border-radius:50%;pointer-events:none;opacity:0;transition:opacity .25s;background:radial-gradient(circle,rgba(255,244,214,.55),rgba(232,201,135,.25) 40%,transparent 70%);mix-blend-mode:screen"></div>');
    stage.appendChild(glow);

    let W = 0, H = 0, dpr = 1, revealed = false, down = false, lx = 0, ly = 0, lastCheck = 0, lastVib = 0, covered = false;

    function dust() {
      ctx.globalCompositeOperation = 'source-over';
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#1b1450'); g.addColorStop(0.5, '#3a1a6e'); g.addColorStop(1, '#0f2a5a');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const r = AC.seeded(42);
      for (let i = 0; i < 420; i++) { const x = r() * W, y = r() * H, s = r() * 1.8 + 0.3; ctx.globalAlpha = r() * 0.8 + 0.2; ctx.fillStyle = r() < 0.2 ? '#e8c987' : r() < 0.4 ? '#9fe8ff' : '#fff'; ctx.beginPath(); ctx.arc(x, y, s, 0, 6.283); ctx.fill(); }
      ctx.globalAlpha = 1;
      const neb = ctx.createRadialGradient(W * 0.3, H * 0.3, 10, W * 0.3, H * 0.3, W * 0.7); neb.addColorStop(0, 'rgba(255,90,157,.25)'); neb.addColorStop(1, 'transparent'); ctx.fillStyle = neb; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = `600 ${Math.round(W / 22)}px "Plus Jakarta Sans", sans-serif`; ctx.textAlign = 'center';
      ctx.fillText('✨ Raspe as estrelas ✨', W / 2, H / 2); ctx.font = `${Math.round(W / 30)}px "Plus Jakarta Sans", sans-serif`; ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillText('deslize o dedo para revelar', W / 2, H / 2 + W / 14);
      covered = true;
    }
    function size() {
      const r = stage.getBoundingClientRect(); if (!r.width) return;
      if (covered && Math.abs(Math.round(r.width) - W) < 4 && Math.abs(Math.round(r.height) - H) < 4) return; // evita apagar o progresso por causa da barra do navegador
      dpr = Math.min(devicePixelRatio || 1, 2); W = Math.round(r.width); H = Math.round(r.height);
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!revealed) dust();
    }
    function sparkle(x, y) {
      if (AC.reduced()) return;
      const s = document.createElement('i'); s.setAttribute('aria-hidden', 'true');
      s.style.cssText = `position:absolute;z-index:6;left:${x}px;top:${y}px;width:6px;height:6px;border-radius:50%;background:#fff4d6;box-shadow:0 0 10px 2px rgba(232,201,135,.9);pointer-events:none`;
      stage.appendChild(s);
      const a = s.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${AC.rand(-26, 26)}px,${AC.rand(10, 40)}px) scale(0)`, opacity: 0 }], { duration: AC.rand(500, 900), easing: 'ease-out' });
      a.onfinish = () => s.remove();
    }
    function erase(x, y) {
      ctx.globalCompositeOperation = 'destination-out';
      const r = Math.max(26, W / 11);
      ctx.lineCap = 'round'; ctx.lineWidth = r * 2; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(x, y); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
      lx = x; ly = y;
    }
    function measure() {
      // amostra a transparência em uma grade grossa (barato)
      const step = 14, d = ctx.getImageData(0, 0, cv.width, cv.height).data; let clear = 0, total = 0;
      const sx = Math.round(step * dpr);
      for (let y = 0; y < cv.height; y += sx) for (let x = 0; x < cv.width; x += sx) { total++; if (d[(y * cv.width + x) * 4 + 3] < 40) clear++; }
      const p = Math.round((clear / total) * 100);
      pct.textContent = p + '%'; bar.style.transform = `scaleX(${p / 100})`;
      return p;
    }
    function reveal(instant) {
      if (revealed) return; revealed = true;
      stage.classList.add('is-revealed'); pct.textContent = '100%'; bar.style.transform = 'scaleX(1)';
      AC.sfx('sparkle'); if (navigator.vibrate) navigator.vibrate([20, 40, 20, 40, 60]);
      const r = stage.getBoundingClientRect();
      if (!instant) { AC.confetti(r.left + r.width / 2, r.top + r.height * 0.4, 50); setTimeout(() => AC.confetti(r.left + r.width * 0.25, r.top + r.height * 0.5, 22), 250); setTimeout(() => AC.confetti(r.left + r.width * 0.75, r.top + r.height * 0.5, 22), 450); }
    }
    function pos(e) { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }

    cv.addEventListener('pointerdown', (e) => { if (revealed) return; down = true; cv.setPointerCapture(e.pointerId); [lx, ly] = pos(e); erase(lx, ly); glow.style.opacity = 1; });
    cv.addEventListener('pointermove', (e) => {
      if (revealed) return; const [x, y] = pos(e);
      glow.style.left = x + 'px'; glow.style.top = y + 'px'; glow.style.opacity = 1;
      if (!down) return;
      erase(x, y); if (Math.random() < 0.45) sparkle(x + AC.rand(-14, 14), y + AC.rand(-14, 14));
      const now = performance.now();
      if (navigator.vibrate && now - lastVib > 140) { navigator.vibrate(6); lastVib = now; }
      if (now - lastCheck > 160) { lastCheck = now; if (measure() >= 52) reveal(); }
    });
    const up = () => { down = false; glow.style.opacity = 0; if (!revealed && measure() >= 52) reveal(); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); cv.addEventListener('pointerleave', () => { glow.style.opacity = 0; });

    $('#sc-reveal').addEventListener('click', () => reveal());
    $('#sc-reset').addEventListener('click', () => { revealed = false; stage.classList.remove('is-revealed'); pct.textContent = '0%'; bar.style.transform = 'scaleX(0)'; dust(); });
    $('#sc-album').addEventListener('click', () => {
      const list = AC.MEDIA.filter((x) => x.milestone === 'namoro' || x.milestone === 'pedido').sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      AC.lightbox.open(list, 0);
    });
    if ('ResizeObserver' in window) new ResizeObserver(AC.debounce(size, 150)).observe(stage); else window.addEventListener('resize', AC.debounce(size, 150));
    size();
  };
})();
