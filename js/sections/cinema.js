/* MODO CINEMA — "Assistir nosso filme": fotos e vídeos em sequência, Ken Burns, legendas por marco, música, ESC/toque para sair */
(function () {
  'use strict';
  const AC = window.AC, { $ } = AC;

  const CHAPTERS = [
    { ms: ['encontro'], n: 3, date: '26.04.2026', title: 'O começo de tudo', sub: 'Uma história que o universo já conhecia' },
    { ms: ['namoro', 'familia'], n: 3, date: '28.05.2026', title: 'Oficialmente nós dois', sub: 'Flores, aliança e o coração acelerado' },
    { ms: ['rotina'], n: 5, date: 'Dia após dia', title: 'Nosso lugar de paz', sub: 'Os pequenos detalhes que viram tudo' },
    { ms: ['jeri'], n: 7, date: '28.07.2026', title: 'Jericoacoara', sub: 'A nossa primeira viagem juntos' },
    { ms: ['pedido'], n: 7, date: '15.08.2026', title: 'O pedido', sub: 'Fortaleza, música e um sim para a vida toda', song: 'pedido' },
    { ms: ['outubro'], n: 4, date: '13.10.2026', title: 'E a vida segue', sub: 'Noivos, em dias de sol' }
  ];
  const PHOTO_MS = 4800, VIDEO_MS = 6200, TITLE_MS = 3300;

  let root, layerA, steps = [], i = -1, timer = 0, playing = false, openFlag = false, idleT = 0, total = 0, elapsed = 0, t0 = 0, lastFocus = null, cur = null, untrap;

  function build() {
    root = AC.html(`
<div class="cine" role="dialog" aria-modal="true" aria-label="Nosso filme" aria-hidden="true">
  <div class="cine__stage"></div>
  <div class="cine__shade"></div>
  <div class="cine__cap" aria-live="polite"></div>
  <div class="cine__title" aria-live="polite"><div><div class="date"></div><h2></h2><p></p></div></div>
  <div class="cine__top">
    <span class="eyebrow eyebrow--plain">Amor Cósmico • o filme</span>
    <div class="cine__ctrl">
      <button type="button" class="btn btn--icon btn--ghost" data-c="prev" aria-label="Anterior">${AC.icon('i-chev-l')}</button>
      <button type="button" class="btn btn--icon btn--ghost" data-c="play" aria-label="Pausar">${AC.icon('i-pause')}</button>
      <button type="button" class="btn btn--icon btn--ghost" data-c="next" aria-label="Próximo">${AC.icon('i-chev-r')}</button>
      <button type="button" class="btn btn--icon btn--ghost" data-c="close" aria-label="Sair do filme">${AC.icon('i-close')}</button>
    </div>
  </div>
  <div class="cine__prog" aria-hidden="true"><i></i></div>
</div>`);
    document.body.appendChild(root);
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-c]');
      if (b) { const a = b.dataset.c; if (a === 'close') close(); else if (a === 'play') toggle(); else if (a === 'next') go(1); else if (a === 'prev') go(-1); return; }
      wake(); // toque na tela: mostra os controles
    });
    document.addEventListener('keydown', (e) => {
      if (!openFlag) return;
      if (e.key === 'Escape') close(); else if (e.key === 'ArrowRight') go(1); else if (e.key === 'ArrowLeft') go(-1); else if (e.key === ' ') { e.preventDefault(); toggle(); }
    });
    root.addEventListener('pointermove', wake);
  }

  function wake() { root.classList.remove('is-idle'); clearTimeout(idleT); idleT = setTimeout(() => root.classList.add('is-idle'), 3200); }

  /* monta o roteiro */
  function plan() {
    const out = [];
    CHAPTERS.forEach((c) => {
      let pool = AC.MEDIA.filter((m) => c.ms.includes(m.milestone) && !m.mine);
      if (!pool.length) return;
      const score = (m) => (m.favorite ? 3 : 0) + (m.type === 'photo' ? 1 : 0) + (m.type === 'video' && m.duration <= 15 ? 1 : 0);
      pool = pool.slice().sort((a, b) => score(b) - score(a));
      const vids = pool.filter((m) => m.type === 'video').slice(0, Math.min(2, Math.ceil(c.n / 3)));
      const pics = pool.filter((m) => m.type === 'photo').slice(0, c.n - vids.length);
      // mídias marcadas com "film": true em curadoria.json entram SEMPRE no filme (e o capítulo cresce para caber)
      const must = pool.filter((m) => m.film);
      const base = [...pics, ...vids].filter((m) => !m.film).slice(0, Math.max(0, c.n - must.length));
      const picks = [...must, ...base].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      out.push({ type: 'title', date: c.date, title: c.title, sub: c.sub, dur: TITLE_MS, song: c.song });
      picks.forEach((m) => out.push({ type: 'media', m, dur: m.type === 'video' ? VIDEO_MS : PHOTO_MS, ms: c.date, song: c.song }));
    });
    out.push({ type: 'title', date: '', title: 'Em todos os universos, eu escolheria você.', sub: 'João Guilherme & Maria Cândida', dur: 6500, last: true });
    return out;
  }

  function slideFor(m) {
    const el = document.createElement('div'); el.className = 'cine__slide';
    const src = m.type === 'video' ? m.poster + '.jpg' : (m.src || `${m.base}-${m.widths.find((w) => w >= Math.min(innerWidth * (devicePixelRatio || 1), 1600)) || m.widths[m.widths.length - 1]}.webp`);
    const bg = document.createElement('div'); bg.className = 'cine__bg'; bg.innerHTML = `<img alt="" src="${m.thumb || src}">`; el.appendChild(bg);
    let media;
    if (m.type === 'video') { media = document.createElement('video'); media.muted = true; media.playsInline = true; media.preload = 'auto'; media.poster = src; media.src = m.file; media.className = 'cine__media'; }
    else { media = new Image(); media.src = src; media.alt = m.alt || m.caption; media.className = 'cine__media kb'; media.style.setProperty('--kb', (PHOTO_MS + 1800) / 1000 + 's'); media.style.objectPosition = `${(m.focal || [50, 40])[0]}% ${(m.focal || [50, 40])[1]}%`; }
    el.appendChild(media); return el;
  }

  function step(k) {
    clearTimeout(timer);
    i = AC.clamp(k, 0, steps.length - 1);
    const s = steps[i], stage = $('.cine__stage', root), cap = $('.cine__cap', root), title = $('.cine__title', root);
    elapsed = steps.slice(0, i).reduce((a, x) => a + x.dur, 0); t0 = performance.now();
    AC.audio.switchTo(s.song || 'principal'); // "Chuva de Arroz" no capítulo do pedido
    if (s.type === 'title') {
      title.querySelector('.date').textContent = s.date; title.querySelector('h2').textContent = s.title; title.querySelector('p').textContent = s.sub;
      title.classList.add('is-on'); cap.classList.add('is-out');
      if (s.last) AC.confetti(innerWidth / 2, innerHeight * 0.45, 40);
      AC.sfx('soft');
    } else {
      title.classList.remove('is-on');
      const ns = slideFor(s.m); stage.appendChild(ns);
      const v = ns.querySelector('video'); if (v) v.play().catch(() => {});
      requestAnimationFrame(() => requestAnimationFrame(() => ns.classList.add('is-on')));
      const old = cur; cur = ns;
      if (old) { old.classList.remove('is-on'); setTimeout(() => { const ov = old.querySelector('video'); if (ov) ov.pause(); old.remove(); }, 1500); }
      const meta = [s.m.place, s.ms].filter(Boolean).join(' • ');
      cap.classList.add('is-out');
      setTimeout(() => { cap.innerHTML = `${AC.esc(s.m.caption.split('•').pop().trim())}<small>${AC.esc(meta || AC.dispShort(s.m))}</small>`; cap.classList.remove('is-out'); }, 500);
      const nx = steps[i + 1]; if (nx && nx.type === 'media' && nx.m.type === 'photo') { const im = new Image(); im.src = slideFor(nx.m).querySelector('.cine__media').src; }
    }
    if (playing) timer = setTimeout(() => (i < steps.length - 1 ? step(i + 1) : finish()), s.dur);
  }
  function go(d) { const ni = AC.clamp(i + d, 0, steps.length - 1); if (steps[ni]) step(ni); wake(); }
  function toggle() {
    playing = !playing; const b = $('[data-c=play]', root);
    b.innerHTML = AC.icon(playing ? 'i-pause' : 'i-play'); b.setAttribute('aria-label', playing ? 'Pausar' : 'Continuar');
    const v = cur && cur.querySelector('video'); if (v) playing ? v.play().catch(() => {}) : v.pause();
    if (playing) { const s = steps[i]; const left = Math.max(300, s.dur - (performance.now() - t0)); clearTimeout(timer); timer = setTimeout(() => (i < steps.length - 1 ? step(i + 1) : finish()), left); } else clearTimeout(timer);
  }
  function finish() { playing = false; setTimeout(close, 400); AC.celebrate(); }

  // progresso global
  function prog() {
    if (!openFlag) return; const s = steps[i]; if (!s) return;
    const e = elapsed + (playing ? Math.min(s.dur, performance.now() - t0) : 0);
    $('.cine__prog i', root).style.transform = `scaleX(${AC.clamp(e / total, 0, 1).toFixed(4)})`;
  }

  function open() {
    if (!root) build();
    if (openFlag) return;
    steps = plan(); total = steps.reduce((a, s) => a + s.dur, 0); if (!steps.length) { AC.toast('Ainda não há memórias para o filme.'); return; }
    openFlag = true; lastFocus = document.activeElement; i = -1; cur = null; playing = true;
    $('.cine__stage', root).innerHTML = ''; $('[data-c=play]', root).innerHTML = AC.icon('i-pause');
    root.classList.add('is-on'); root.setAttribute('aria-hidden', 'false'); document.body.classList.add('is-locked'); AC.lightbox.isOpen && AC.lightbox.close();
    untrap = AC.trap(root); wake();
    if (!AC.audio.state.playing) AC.audio.playMusic();
    AC.raf.add(prog);
    step(0); setTimeout(() => $('[data-c=close]', root).focus({ preventScroll: true }), 80);
  }
  function close() {
    if (!openFlag) return; openFlag = false; playing = false; clearTimeout(timer); AC.raf.remove(prog);
    root.classList.remove('is-on'); root.setAttribute('aria-hidden', 'true'); document.body.classList.remove('is-locked');
    if (untrap) untrap();
    AC.emit('zone:recheck');
    setTimeout(() => { $('.cine__stage', root).innerHTML = ''; $('.cine__title', root).classList.remove('is-on'); }, 900);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  AC.cinema = { open, close, plan, get isOpen() { return openFlag; } };
})();
