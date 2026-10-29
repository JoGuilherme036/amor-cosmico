/* ============================================================
   LIGHTBOX — swipe, pinch-zoom, setas, pré-carregamento,
   legenda, favoritar/baixar/compartilhar, miniaturas,
   Live Photo e slideshow com Ken Burns + música.
   ============================================================ */
(function () {
  'use strict';
  const AC = window.AC;
  const { $, $$ } = AC;

  let delBtn, delArm = false, root, stage, slide, thumbsEl, capEl, countEl, favBtn, slideBtn, progEl, liveBtn, untrap;
  let items = [], idx = 0, openFlag = false, lastFocus = null, slideTimer = 0, slideOn = false, pushed = false;
  const Z = { s: 1, x: 0, y: 0 };
  const ptrs = new Map();
  let pinch0 = null, drag = null, lastTap = 0;

  function build() {
    root = AC.html(`
<div class="lb" role="dialog" aria-modal="true" aria-label="Visualizador de fotos e vídeos" aria-hidden="true">
  <div class="lb__progress" aria-hidden="true"><i></i></div>
  <div class="lb__top">
    <span class="lb__count" aria-live="polite"></span>
    <div class="lb__tools">
      <button type="button" class="btn btn--icon btn--ghost" data-a="fav" aria-pressed="false" aria-label="Favoritar">${AC.icon('i-heart')}</button>
      <button type="button" class="btn btn--icon btn--ghost" data-a="del" aria-label="Apagar esta foto" hidden>${AC.icon('i-trash')}</button>
      <button type="button" class="btn btn--icon btn--ghost" data-a="dl" aria-label="Baixar">${AC.icon('i-download')}</button>
      <button type="button" class="btn btn--icon btn--ghost" data-a="share" aria-label="Compartilhar">${AC.icon('i-share')}</button>
      <button type="button" class="btn btn--icon btn--ghost" data-a="slide" aria-pressed="false" aria-label="Slideshow">${AC.icon('i-play')}</button>
      <button type="button" class="btn btn--icon btn--ghost" data-a="close" aria-label="Fechar">${AC.icon('i-close')}</button>
    </div>
  </div>
  <div class="lb__stage"></div>
  <div class="lb__bottom"><div class="lb__cap"></div><div class="lb__thumbs" role="tablist" aria-label="Miniaturas"></div></div>
</div>`);
    document.body.appendChild(root);
    stage = $('.lb__stage', root); thumbsEl = $('.lb__thumbs', root); capEl = $('.lb__cap', root); countEl = $('.lb__count', root);
    delBtn = $('[data-a=del]', root); favBtn = $('[data-a=fav]', root); slideBtn = $('[data-a=slide]', root); progEl = $('.lb__progress i', root);
    const prev = AC.html(`<button type="button" class="btn btn--icon lb__nav lb__nav--prev" aria-label="Anterior">${AC.icon('i-chev-l')}</button>`);
    const next = AC.html(`<button type="button" class="btn btn--icon lb__nav lb__nav--next" aria-label="Próxima">${AC.icon('i-chev-r')}</button>`);
    stage.append(prev, next);
    prev.onclick = () => go(-1); next.onclick = () => go(1);

    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      const a = b.dataset.a, m = items[idx];
      if (a === 'close') close();
      else if (a === 'fav') { const on = AC.toggleFav(m.id); favBtn.setAttribute('aria-pressed', on); AC.sfx('soft'); }
      else if (a === 'del') removeCurrent(b, m);
      else if (a === 'dl') AC.download(m);
      else if (a === 'share') AC.share({ title: m.caption || 'Amor Cósmico', text: m.caption || '' });
      else if (a === 'slide') toggleSlideshow();
    });

    // gestos
    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerup', onUp);
    stage.addEventListener('pointercancel', onUp);
    stage.addEventListener('wheel', (e) => { if (!openFlag) return; e.preventDefault(); zoomAt(e.clientX, e.clientY, Z.s * (e.deltaY < 0 ? 1.18 : 0.85)); }, { passive: false });
    document.addEventListener('keydown', onKey);
    window.addEventListener('popstate', () => { if (openFlag && pushed) { pushed = false; close(true); } });
  }

  /* ---------- abrir / fechar ---------- */
  function open(list, i = 0, opts = {}) {
    if (!root) build();
    items = list.filter(Boolean); if (!items.length) return;
    idx = AC.clamp(i, 0, items.length - 1); openFlag = true; lastFocus = document.activeElement;
    root.classList.add('is-on'); root.setAttribute('aria-hidden', 'false'); document.body.classList.add('is-locked');
    untrap = AC.trap(root);
    buildThumbs(); show(0, true);
    try { history.pushState({ lb: 1 }, ''); pushed = true; } catch (_) { pushed = false; }
    setTimeout(() => $('[data-a=close]', root).focus({ preventScroll: true }), 50);
    if (opts.slideshow) toggleSlideshow(true);
  }
  function close(fromPop) {
    if (!openFlag) return;
    stopSlideshow(); openFlag = false;
    root.classList.remove('is-on'); root.setAttribute('aria-hidden', 'true'); document.body.classList.remove('is-locked');
    AC.audio && AC.audio.duck(false);
    if (untrap) untrap();
    setTimeout(() => { if (!openFlag && slide) { slide.remove(); slide = null; } }, 400);
    if (pushed && !fromPop) { pushed = false; try { history.back(); } catch (_) {} }
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  /* ---------- slide atual ---------- */
  const lbSrc = (m) => {
    if (m.src) return m.src;
    const need = Math.min(window.innerWidth * Math.min(window.devicePixelRatio || 1, 2), 1600); // 2x basta: 3x só gastaria memória do iPhone
    const w = m.widths.find((x) => x >= need) || m.widths[m.widths.length - 1];
    return `${m.base}-${w}.webp`;
  };
  function mediaEl(m) {
    if (m.type === 'video') {
      const v = document.createElement('video');
      v.className = 'lb__media'; v.controls = true; v.playsInline = true; v.preload = 'metadata'; v.src = m.file; if (m.poster) v.poster = m.poster + '.jpg';
      v.setAttribute('aria-label', m.caption || 'Vídeo');
      v.addEventListener('play', () => { if (!v.muted) AC.audio.duck(true); });
      v.addEventListener('pause', () => AC.audio.duck(false));
      v.addEventListener('ended', () => { AC.audio.duck(false); if (slideOn) go(1); });
      return v;
    }
    const im = new Image(); im.className = 'lb__media'; im.alt = m.alt || m.caption || ''; im.decoding = 'async'; im.draggable = false; im.src = lbSrc(m);
    // foto enviada: mostra a miniatura na hora e troca pela foto inteira (baixada do banco) assim que chegar
    if (m.remote && !m.full) AC.photos.full(m).then((u) => { if (u) im.src = u; }).catch(() => AC.toast('Não consegui carregar a foto inteira agora.'));
    return im;
  }
  function show(dir, first) {
    const m = items[idx];
    resetZoom();
    const ns = document.createElement('div'); ns.className = 'lb__slide' + (slideOn && m.type !== 'video' && !AC.reduced() ? ' kb' : '');
    const el = mediaEl(m); ns.appendChild(el); stage.appendChild(ns);
    const old = slide; slide = ns;
    if (!first && !AC.reduced()) {
      ns.animate([{ opacity: 0, transform: `translateX(${dir * 6}%)` }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.16,1,.3,1)' });
      if (old) { const a = old.animate([{ opacity: 1 }, { opacity: 0, transform: `translateX(${-dir * 6}%)` }], { duration: 300, fill: 'forwards' }); a.onfinish = () => old.remove(); }
    } else if (old) old.remove();
    if (m.type === 'video') { el.muted = false; const p = el.play(); if (p && p.catch) p.catch(() => { el.muted = true; el.play().catch(() => {}); }); }
    countEl.textContent = `${idx + 1} / ${items.length}`;
    favBtn.setAttribute('aria-pressed', AC.isFav(m.id));
    delBtn.hidden = !(m.remote || m.mine); delBtn.classList.remove('is-confirm'); delArm = false;
    paintCap(m);
    if (liveBtn) { liveBtn.remove(); liveBtn = null; }
    if (m.live) {
      liveBtn = AC.html(`<button type="button" class="btn btn--sm lb__live">${AC.icon('i-sparkles')}Live</button>`);
      liveBtn.onclick = () => playLive(m);
      stage.appendChild(liveBtn);
    }
    $$('.lb__thumb', thumbsEl).forEach((t, k) => { const on = k === idx; t.classList.toggle('is-current', on); t.setAttribute('aria-selected', on); if (on) centerThumb(t, first); });
    // pré-carrega vizinhas
    [1, -1].forEach((d) => { const n = items[(idx + d + items.length) % items.length]; if (n && n.type === 'photo') { const i = new Image(); i.src = lbSrc(n); } });
    if (slideOn) armSlide(m);
  }
  function playLive(m) {
    const cur = slide; if (!cur) return;
    const v = document.createElement('video'); v.className = 'lb__media'; v.src = m.live; v.playsInline = true; v.muted = false; v.style.position = 'absolute';
    v.style.cssText = 'border-radius:6px';
    cur.appendChild(v); v.play().catch(() => { v.muted = true; v.play().catch(() => {}); });
    AC.audio.duck(true);
    v.onended = () => { v.remove(); AC.audio.duck(false); };
  }
  /* ---------- curtidas: duplo toque (celular) ou F; contam no banco quando ele está ligado ---------- */
  function paintCap(m) {
    const meta = [AC.dispLong(m), m.place].filter(Boolean).join(' • ');
    const n = (AC.hearts && AC.hearts[m.id]) || 0;
    capEl.innerHTML = `<b>${AC.esc(m.caption || '')}</b>${meta || n ? `<small>${AC.esc(meta)}${n ? `<span class="lb__hearts">${AC.icon('i-heart')}${n}</span>` : ''}</small>` : ''}`;
  }
  function like() {
    const m = items[idx]; if (!m) return;
    if (!AC.isFav(m.id)) { AC.toggleFav(m.id); favBtn.setAttribute('aria-pressed', 'true'); }
    AC.hearts = AC.hearts || {}; AC.hearts[m.id] = (AC.hearts[m.id] || 0) + 1;
    if (AC.db.on) AC.db.heart(m.id);
    const h = AC.html(`<div class="lb__like" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#i-heart"/></svg></div>`);
    stage.appendChild(h); setTimeout(() => h.remove(), 950);
    AC.sfx('soft'); if (navigator.vibrate) navigator.vibrate(12);
    paintCap(m);
  }
  AC.on('db:ready', async () => { try { AC.hearts = await AC.db.heartCounts(); if (openFlag) paintCap(items[idx]); } catch (_) {} });

  // centraliza a miniatura SÓ dentro da faixa (scrollIntoView dentro de um elemento fixo rola a página inteira no Safari do iPhone)
  function centerThumb(t, instant) { const box = thumbsEl; if (!box) return; box.scrollTo({ left: t.offsetLeft - box.clientWidth / 2 + t.clientWidth / 2, behavior: instant || AC.reduced() ? 'auto' : 'smooth' }); }
  // apagar: 1º toque pede confirmação (sem alert), 2º toque apaga (do banco ou deste aparelho)
  function removeCurrent(btn, m) {
    if (!delArm) { delArm = true; btn.classList.add('is-confirm'); btn.setAttribute('aria-label', 'Toque de novo para apagar'); AC.toast('Toque de novo para apagar esta foto', 3000); setTimeout(() => { delArm = false; btn.classList.remove('is-confirm'); btn.setAttribute('aria-label', 'Apagar esta foto'); }, 3500); return; }
    delArm = false; btn.classList.remove('is-confirm');
    (m.remote ? AC.photos.remove(m) : AC.studio.remove(m.id)).then(() => {
      const k = items.indexOf(m); if (k >= 0) items.splice(k, 1);
      if (!items.length) { close(); AC.toast('Foto apagada'); return; }
      idx = Math.min(idx, items.length - 1); buildThumbs(); show(0, true); AC.toast('Foto apagada');
    }).catch(() => AC.toast('Não consegui apagar agora. Tente de novo.'));
  }
  function go(d) { if (!openFlag) return; idx = (idx + d + items.length) % items.length; show(d); }
  function buildThumbs() {
    thumbsEl.innerHTML = items.map((m, k) => `<button type="button" class="lb__thumb" role="tab" aria-label="Ir para ${k + 1}" data-i="${k}"><div class="ph ph--static" style="--ph:${m.color || '#14152a'}"><img src="${AC.tileSrc(m)}" alt="" loading="lazy" decoding="async" style="opacity:1;position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></div></button>`).join('');
    thumbsEl.style.display = items.length > 1 ? '' : 'none';
    thumbsEl.onclick = (e) => { const b = e.target.closest('.lb__thumb'); if (!b) return; const k = +b.dataset.i; const d = k > idx ? 1 : -1; idx = k; show(d); };
    root.querySelectorAll('.lb__nav').forEach((n) => (n.style.display = items.length > 1 ? '' : 'none'));
  }

  /* ---------- slideshow ---------- */
  function toggleSlideshow(force) { (force === true || (!slideOn && force !== false)) ? startSlideshow() : stopSlideshow(); }
  function startSlideshow() {
    slideOn = true; slideBtn.setAttribute('aria-pressed', 'true'); slideBtn.innerHTML = AC.icon('i-pause');
    if (!AC.audio.state.playing) AC.audio.playMusic();
    show(0, true);
  }
  function stopSlideshow() {
    slideOn = false; clearTimeout(slideTimer);
    if (slideBtn) { slideBtn.setAttribute('aria-pressed', 'false'); slideBtn.innerHTML = AC.icon('i-play'); }
    if (progEl) { progEl.style.transition = 'none'; progEl.style.transform = 'scaleX(0)'; }
    if (slide) slide.classList.remove('kb');
  }
  function armSlide(m) {
    clearTimeout(slideTimer);
    const dur = m.type === 'video' ? Math.min(14, m.duration || 8) * 1000 : 4800;
    progEl.style.transition = 'none'; progEl.style.transform = 'scaleX(0)';
    requestAnimationFrame(() => requestAnimationFrame(() => { progEl.style.transition = `transform ${dur}ms linear`; progEl.style.transform = 'scaleX(1)'; }));
    slideTimer = setTimeout(() => go(1), dur);
  }

  /* ---------- zoom / pan ---------- */
  function apply() { const el = slide && slide.firstElementChild; if (!el) return; el.style.transform = `translate3d(${Z.x}px,${Z.y}px,0) scale(${Z.s})`; stage.classList.toggle('is-zoomed', Z.s > 1.02); }
  function resetZoom() { Z.s = 1; Z.x = 0; Z.y = 0; ptrs.clear(); pinch0 = null; drag = null; if (slide && slide.firstElementChild) slide.firstElementChild.style.transform = ''; stage && stage.classList.remove('is-zoomed'); }
  function zoomAt(cx, cy, s) {
    const el = slide && slide.firstElementChild; if (!el || el.tagName === 'VIDEO') return;
    const r = stage.getBoundingClientRect(), ox = cx - (r.left + r.width / 2), oy = cy - (r.top + r.height / 2);
    const ns = AC.clamp(s, 1, 5), k = ns / Z.s;
    Z.x = (Z.x - ox) * k + ox; Z.y = (Z.y - oy) * k + oy; Z.s = ns;
    if (ns === 1) { Z.x = 0; Z.y = 0; }
    apply();
  }
  const dist = () => { const p = [...ptrs.values()]; return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y); };
  const mid = () => { const p = [...ptrs.values()]; return { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 }; };
  function onDown(e) {
    if (e.target.closest('video, button')) return;
    stage.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2) { pinch0 = { d: dist(), s: Z.s }; drag = null; }
    else drag = { x: e.clientX, y: e.clientY, zx: Z.x, zy: Z.y, t: performance.now(), moved: false };
  }
  function onMove(e) {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2 && pinch0) { const m = mid(); zoomAt(m.x, m.y, pinch0.s * (dist() / pinch0.d)); return; }
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true;
    if (Z.s > 1.02) { Z.x = drag.zx + dx; Z.y = drag.zy + dy; apply(); }
    else if (slide) { slide.style.transform = `translate3d(${dx}px,${Math.max(0, dy) * 0.6}px,0)`; slide.style.opacity = String(1 - Math.min(0.5, Math.abs(dx) / 600, Math.max(0, dy) / 500)); }
  }
  function onUp(e) {
    const had = ptrs.has(e.pointerId); ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch0 = null;
    if (!had || !drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y, dt = performance.now() - drag.t, d = drag; drag = null;
    if (slide) { slide.style.transform = ''; slide.style.opacity = ''; }
    if (Z.s > 1.02) return;
    if (!d.moved && dt < 300) { // toque simples/duplo
      const now = performance.now();
      if (now - lastTap < 320) { if (e.pointerType === 'touch') like(); else zoomAt(e.clientX, e.clientY, 2.6); lastTap = 0; } else lastTap = now;
      return;
    }
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    else if (dy > 110 && Math.abs(dy) > Math.abs(dx)) close();
  }
  function onKey(e) {
    if (!openFlag) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === '+' || e.key === '=') zoomAt(innerWidth / 2, innerHeight / 2, Z.s * 1.3);
    else if (e.key === '-') zoomAt(innerWidth / 2, innerHeight / 2, Z.s / 1.3);
    else if (e.key === '0') { resetZoom(); }
    else if (e.key.toLowerCase() === 'f') favBtn.click();
    else if (e.key === ' ' && !(e.target.tagName === 'VIDEO')) { e.preventDefault(); toggleSlideshow(); }
  }

  AC.lightbox = { open, close, get isOpen() { return openFlag; } };
})();
