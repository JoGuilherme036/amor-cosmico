/* PAREDE DE ESTRELAS — cada memória vira uma estrela num céu que se arrasta e dá zoom */
(function () {
  'use strict';
  const AC = window.AC, { $, $$ } = AC;

  let root, sky, list = [], openFlag = false, lastFocus = null, untrap;
  const V = { x: 0, y: 0, s: 1 };
  const ptrs = new Map(); let drag = null, pinch = null, moved = false;

  function build() {
    root = AC.html(`
<div class="sw" role="dialog" aria-modal="true" aria-label="Parede de Estrelas" aria-hidden="true">
  <div class="sw__sky"></div>
  <div class="sw__top"><span class="sw__hint">Arraste o céu • use dois dedos ou a roda para o zoom • toque numa estrela</span>
    <button type="button" class="btn btn--icon btn--ghost" data-w="close" aria-label="Fechar">${AC.icon('i-close')}</button></div>
  <div class="sw__ctrl"><button type="button" class="btn btn--icon" data-w="in" aria-label="Aproximar">${AC.icon('i-plus')}</button><button type="button" class="btn btn--icon" data-w="out" aria-label="Afastar"><svg class="ico" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></button></div>
</div>`);
    document.body.appendChild(root); sky = $('.sw__sky', root);
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-w]');
      if (b) { const a = b.dataset.w; if (a === 'close') close(); else if (a === 'in') zoom(innerWidth / 2, innerHeight / 2, V.s * 1.35); else zoom(innerWidth / 2, innerHeight / 2, V.s / 1.35); return; }
      const st = e.target.closest('.sw__star'); if (st && !moved) AC.lightbox.open(list, +st.dataset.i);
    });
    root.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !AC.lightbox.isOpen) close(); if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('sw__star')) { e.preventDefault(); e.target.click(); } });
    root.addEventListener('pointerdown', (e) => { if (e.target.closest('button[data-w]')) return; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved = false; if (ptrs.size === 2) { pinch = { d: dist(), s: V.s }; drag = null; } else drag = { x: e.clientX, y: e.clientY, vx: V.x, vy: V.y }; root.classList.add('is-drag'); });
    root.addEventListener('pointermove', (e) => {
      if (!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 2 && pinch) { const p = [...ptrs.values()]; zoom((p[0].x + p[1].x) / 2, (p[0].y + p[1].y) / 2, pinch.s * (dist() / pinch.d)); moved = true; return; }
      if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (!moved && Math.abs(dx) + Math.abs(dy) > 6) { moved = true; try { root.setPointerCapture(e.pointerId); } catch (_) {} }
      V.x = drag.vx + dx; V.y = drag.vy + dy; apply();
    });
    const up = (e) => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (!ptrs.size) { drag = null; root.classList.remove('is-drag'); setTimeout(() => { moved = false; }, 30); } };
    root.addEventListener('pointerup', up); root.addEventListener('pointercancel', up);
    root.addEventListener('wheel', (e) => { if (!openFlag) return; e.preventDefault(); zoom(e.clientX, e.clientY, V.s * (e.deltaY < 0 ? 1.12 : 0.89)); }, { passive: false });
  }
  const dist = () => { const p = [...ptrs.values()]; return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y); };
  function apply() { sky.style.transform = `translate3d(${V.x}px,${V.y}px,0) scale(${V.s})`; }
  function zoom(cx, cy, s) { const ns = AC.clamp(s, 0.35, 2.6), k = ns / V.s; V.x = cx - (cx - V.x) * k; V.y = cy - (cy - V.y) * k; V.s = ns; apply(); }

  function open(items) {
    if (!root) build();
    list = (items && items.length ? items : AC.MEDIA).slice(0, 400);
    const r = AC.seeded(5), ga = 2.399963; // ângulo áureo: distribui como uma galáxia
    const step = innerWidth < 640 ? 78 : 104;
    sky.innerHTML = list.map((m, i) => {
      const rad = step * Math.sqrt(i + 1) * 1.15, a = i * ga, sz = Math.round(46 + r() * 38);
      return `<button type="button" class="sw__star" data-i="${i}" aria-label="Abrir: ${AC.esc(m.caption)}" style="left:${(Math.cos(a) * rad).toFixed(0)}px;top:${(Math.sin(a) * rad).toFixed(0)}px;--sz:${sz}px;--tw:${(3 + r() * 4).toFixed(1)}s;animation-delay:${(-r() * 4).toFixed(1)}s"><div class="ph ph--static" style="--ph:${m.color || '#14152a'}"><img src="${AC.tileSrc(m)}" alt="" loading="lazy" decoding="async" style="opacity:1"></div></button>`;
    }).join('');
    V.s = innerWidth < 640 ? 0.8 : 1; V.x = innerWidth / 2; V.y = innerHeight / 2; apply();
    openFlag = true; lastFocus = document.activeElement; root.classList.add('is-on'); root.setAttribute('aria-hidden', 'false'); document.body.classList.add('is-locked');
    untrap = AC.trap(root); setTimeout(() => $('[data-w=close]', root).focus({ preventScroll: true }), 60);
  }
  function close() {
    if (!openFlag) return; openFlag = false; root.classList.remove('is-on'); root.setAttribute('aria-hidden', 'true'); document.body.classList.remove('is-locked');
    if (untrap) untrap(); if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  AC.starwall = { open, close };
  // Galáxia de Memórias: 3D (Three.js) se disponível; senão a Parede de Estrelas 2D. No celular o 3D só baixa na hora do toque.
  AC.galaxy = (items) => {
    const c = AC.cosmos;
    if (c && c.openMemories) { try { c.openMemories(items); return; } catch (_) { /* cai para o 2D */ } }
    if (AC.isFile || !AC.loadCosmos) { open(items); return; }
    AC.toast('Preparando a galáxia…', 2200);
    AC.loadCosmos().then(() => { const c2 = AC.cosmos; if (c2 && c2.openMemories) { try { c2.openMemories(items); return; } catch (_) {} } open(items); }).catch(() => open(items));
  };
})();
