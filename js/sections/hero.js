/* HERO — título letra a letra, retrato com parallax, órbita de fotos, relógio, frases */
(function () {
  'use strict';
  const AC = window.AC, { $, $$ } = AC;

  function splitTitle() {
    let n = 0;
    $$('[data-split]').forEach((line) => {
      const text = line.textContent; line.textContent = '';
      text.split(' ').forEach((word, wi, arr) => {
        const w = document.createElement('span'); w.className = 'wd'; w.setAttribute('aria-hidden', 'true');
        [...word].forEach((c) => { const s = document.createElement('span'); s.className = 'ch'; s.style.setProperty('--i', n++); s.textContent = c; w.appendChild(s); });
        line.appendChild(w); if (wi < arr.length - 1) { line.appendChild(document.createTextNode(' ')); n++; }
      });
    });
  }

  function badgeText(m) { return [AC.dispShort(m), m.place ? m.place.split(',')[0] : ''].filter(Boolean).join(' • ') || 'Nosso universo'; }

  function buildOrbit(orbitItems) {
    const ring = $('#orbit-ring'); if (!ring) return;
    const n = orbitItems.length;
    ring.innerHTML = orbitItems.map((m, i) => `
      <div class="orbit__item" style="--a:${(360 / n) * i}deg;--od:${i * 90}ms">
        <button type="button" class="orbit__btn" data-i="${i}" aria-label="Abrir: ${AC.esc(m.caption)}">${AC.ph(m, { sizes: '120px', ratio: '1/1' })}</button>
      </div>`).join('');
    AC.hydrate(ring);
    ring.addEventListener('click', (e) => { const b = e.target.closest('.orbit__btn'); if (b) AC.lightbox.open(orbitItems, +b.dataset.i); });
    const orbit = $('#orbit');
    ['pointerenter', 'focusin'].forEach((ev) => orbit.addEventListener(ev, () => orbit.classList.add('is-paused')));
    ['pointerleave', 'focusout'].forEach((ev) => orbit.addEventListener(ev, () => orbit.classList.remove('is-paused')));
  }

  function heroRotation(rot) {
    const frame = $('#hero-frame'), badge = $('#hero-badge'); let cur = 0;
    frame.dataset.open = '1'; frame.tabIndex = 0; frame.setAttribute('role', 'button');
    const label = () => frame.setAttribute('aria-label', `Abrir retrato do casal: ${badge.textContent}`); // inclui o texto visível do selo
    label();
    const open = () => AC.lightbox.open(rot, cur);
    frame.addEventListener('click', open);
    frame.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    if (rot.length < 2) return;
    const swap = (k) => {
      const m = rot[k]; cur = k;
      const layer = AC.html(AC.ph(m, { sizes: '(min-width:900px) 34vw, 62vw', ratio: false, cls: 'ph--static' }));
      layer.style.cssText += ';position:absolute;inset:0;opacity:0;transition:opacity 1.2s ease;border-radius:inherit';
      layer.querySelector('img').style.opacity = 1;
      frame.insertBefore(layer, badge);
      const old = $$('.ph', frame).filter((p) => p !== layer);
      requestAnimationFrame(() => requestAnimationFrame(() => { layer.style.opacity = 1; }));
      setTimeout(() => old.forEach((o) => o.remove()), 1400);
      badge.textContent = badgeText(m); label();
    };
    setInterval(() => { if (!document.hidden && !AC.lightbox.isOpen) swap((cur + 1) % rot.length); }, 7500);
  }

  function clock() {
    const met = new Date(AC.CONFIG.couple.metDate).getTime();
    const d = $('#ck-d'), h = $('#ck-h'), m = $('#ck-m'), s = $('#ck-s'), next = $('#hero-next');
    const set = (el, v) => { if (el.textContent !== v) { el.textContent = v; el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); } };
    const tick = () => {
      const diff = Math.max(0, Date.now() - met);
      const sec = Math.floor(diff / 1000);
      set(d, String(Math.floor(sec / 86400))); set(h, AC.pad(Math.floor(sec / 3600) % 24)); set(m, AC.pad(Math.floor(sec / 60) % 60)); set(s, AC.pad(sec % 60));
    };
    tick(); setInterval(tick, 1000);
    // próximo "dia 28" (mesversário)
    const now = new Date(); let t = new Date(now.getFullYear(), now.getMonth(), 28);
    if (now.getDate() === 28) next.textContent = 'Hoje é dia 28 — o nosso dia! 🤍';
    else { if (now.getDate() > 28) t = new Date(now.getFullYear(), now.getMonth() + 1, 28); const dd = Math.ceil((t - now) / 86400000); next.textContent = `Dia 28 • Nosso dia chega em ${dd} ${dd === 1 ? 'dia' : 'dias'}`; }
  }

  function phrases() {
    const el = $('#hero-phrase'), list = AC.CONFIG.couple.phrases; let i = 1;
    el.textContent = list[0];
    setInterval(() => {
      if (document.hidden) return;
      el.classList.add('is-out');
      setTimeout(() => { el.textContent = list[i]; i = (i + 1) % list.length; el.classList.remove('is-out'); }, 800);
    }, 6500);
  }

  function parallax() {
    const frame = $('#hero-frame'), halo = $('.orbit__halo'); let tick = false;
    const onScroll = () => {
      if (tick) return; tick = true;
      requestAnimationFrame(() => {
        tick = false; if (AC.reduced()) { frame.style.setProperty('--py', '0px'); return; }
        const y = Math.min(window.scrollY, window.innerHeight);
        frame.style.setProperty('--py', (y * 0.1).toFixed(1) + 'px');
        if (halo) halo.style.transform = `translate3d(0,${(y * 0.04).toFixed(1)}px,0)`;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function warp() {
    const b = $('#btn-warp'); if (!b) return;
    const on = () => AC.sky.warp(true), off = () => AC.sky.warp(false);
    b.addEventListener('pointerdown', on); ['pointerup', 'pointerleave', 'pointercancel', 'blur'].forEach((ev) => b.addEventListener(ev, off));
    b.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') on(); }); b.addEventListener('keyup', off);
  }

  AC.initHero = function () {
    splitTitle();
    const cfg = AC.CONFIG.hero;
    const orbit = AC.getMany(cfg.orbit); AC.afterLoad(() => buildOrbit(orbit), 350); // anel de fotos entra logo após o retrato principal
    heroRotation(AC.getMany(cfg.rotation));
    const m = AC.get(cfg.main); if (m) $('#hero-badge').textContent = badgeText(m);
    clock(); phrases(); parallax(); warp();
    $('#cta-cinema').addEventListener('click', () => AC.cinema.open());
  };
})();
