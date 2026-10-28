/* ============================================================
   UTIL — DOM, ícones, mídia (picture/srcset/blur-up), observers, rAF
   ============================================================ */
(function () {
  'use strict';
  const AC = window.AC;

  AC.$ = (s, r) => (r || document).querySelector(s);
  AC.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  AC.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  AC.lerp = (a, b, t) => a + (b - a) * t;
  AC.rand = (a, b) => a + Math.random() * (b - a);
  AC.pad = (n, l = 2) => String(n).padStart(l, '0');
  AC.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  AC.html = (str) => { const t = document.createElement('template'); t.innerHTML = str.trim(); return t.content.firstElementChild; };
  AC.seeded = (seed) => () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  AC.debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  AC.icon = (name, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true"><use href="#${name}"/></svg>`;
  AC.reduced = () => document.documentElement.dataset.motion === 'reduced' || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  AC.isFile = location.protocol === 'file:';
  AC.lite = () => { const c = navigator.connection; return !!(c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || ''))); };
  AC.weak = () => (navigator.hardwareConcurrency || 4) <= 4 || (navigator.deviceMemory || 4) <= 2;

  // Executa depois que a página carregou e a 1ª imagem (hero) já foi pintada — mantém o carregamento inicial enxuto
  AC.afterLoad = (fn, delay = 500) => {
    const go = () => setTimeout(fn, delay);
    if (document.readyState === 'complete') go(); else window.addEventListener('load', go, { once: true });
  };

  /* ---------- Eventos simples ---------- */
  const bus = {};
  AC.on = (ev, fn) => { (bus[ev] = bus[ev] || []).push(fn); };
  AC.emit = (ev, d) => (bus[ev] || []).forEach((fn) => { try { fn(d); } catch (e) { console.error(e); } });

  /* ---------- rAF compartilhado (um único loop; pausa com a aba oculta) ---------- */
  const tasks = new Set();
  let raf = 0, last = 0;
  function loop(t) {
    const dt = Math.min(64, t - last || 16); last = t;
    tasks.forEach((fn) => fn(t, dt));
    raf = tasks.size && !document.hidden ? requestAnimationFrame(loop) : 0;
  }
  AC.raf = {
    add(fn) { tasks.add(fn); if (!raf && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(loop); } return fn; },
    remove(fn) { tasks.delete(fn); }
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
    else if (tasks.size && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
    AC.emit('visibility', !document.hidden);
  });

  /* ---------- Datas ---------- */
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  AC.MESES = MESES;
  AC.fmtDate = (iso) => { if (!iso) return ''; const [y, m, d] = iso.split('-').map(Number); return `${d} de ${MESES[m - 1]} de ${y}`; };
  AC.fmtShort = (iso) => { if (!iso) return ''; const [y, m, d] = iso.split('-'); return `${d}.${m}.${y}`; };
  AC.fmtMonth = (iso) => { const [y, m] = iso.split('-').map(Number); return `${MESES[m - 1][0].toUpperCase()}${MESES[m - 1].slice(1)} de ${y}`; };
  // Data exibida: a viagem a Jericoacoara tem data oficial 28.07 mas as fotos são de 25–27/07 → mostramos só o mês
  AC.dispShort = (m) => { if (!m.date) return ''; if (m.milestone === 'jeri') return `${AC.MESES[+m.date.slice(5, 7) - 1].slice(0, 3)}/${m.date.slice(0, 4)}`; return AC.fmtShort(m.date); };
  AC.dispLong = (m) => { if (!m.date) return ''; if (m.milestone === 'jeri') return AC.fmtMonth(m.date); return AC.fmtDate(m.date); };
  AC.fmtTime = (s) => { s = Math.max(0, Math.floor(s || 0)); return `${Math.floor(s / 60)}:${AC.pad(s % 60)}`; };

  /* ---------- Mídia ---------- */
  AC.MEDIA = (window.MEDIA || []).slice();
  const byId = new Map(), byOrig = new Map();
  AC.reindex = () => { byId.clear(); byOrig.clear(); AC.MEDIA.forEach((m) => { byId.set(m.id, m); byOrig.set(m.orig, m); }); };
  AC.reindex();
  AC.get = (k) => byId.get(k) || byOrig.get(k) || null;
  AC.getMany = (arr) => arr.map(AC.get).filter(Boolean);
  AC.MILESTONES = [
    { id: 'encontro', label: 'O começo' }, { id: 'namoro', label: 'Namoro' }, { id: 'familia', label: 'Famílias' },
    { id: 'rotina', label: 'Nossa rotina' }, { id: 'jeri', label: 'Jericoacoara' }, { id: 'pedido', label: 'O pedido' }, { id: 'outubro', label: 'Outubro' }
  ];

  const srcset = (m, ext) => m.widths.map((w) => `${m.base}-${w}.${ext} ${w}w`).join(', ');
  // Maior largura necessária; `sizes` descreve a largura real no layout
  AC.pic = (m, { sizes = '100vw', eager = false, alt, high = false } = {}) => {
    const a = AC.esc(alt != null ? alt : (m.alt || m.caption || ''));
    if (m.src) { // item local (Minhas memórias)
      return m.type === 'video'
        ? `<video src="${m.src}#t=0.5" preload="metadata" muted playsinline aria-label="${a}"></video>`
        : `<img src="${m.src}" alt="${a}" ${eager ? '' : 'loading="lazy"'} decoding="async">`;
    }
    if (m.type === 'video') {
      return `<picture><source type="image/webp" srcset="${m.poster}.webp"><img src="${m.poster}.jpg" alt="${a}" width="${m.width}" height="${m.height}" ${eager ? '' : 'loading="lazy"'} decoding="async"></picture>`;
    }
    const best = m.widths[Math.min(1, m.widths.length - 1)];
    return `<picture><source type="image/avif" srcset="${srcset(m, 'avif')}" sizes="${sizes}"><source type="image/webp" srcset="${srcset(m, 'webp')}" sizes="${sizes}"><img src="${m.base}-${best}.jpg" srcset="${srcset(m, 'jpg')}" sizes="${sizes}" alt="${a}" width="${m.width}" height="${m.height}" ${eager ? '' : 'loading="lazy"'} ${high ? 'fetchpriority="high"' : ''} decoding="async"></picture>`;
  };
  // Bloco .ph: cor dominante + LQIP (blur-up) + proporção reservada
  AC.ph = (m, o = {}) => {
    const fx = (m.focal || [50, 40]);
    const ratio = o.ratio === false ? '' : `aspect-ratio:${o.ratio || (m.width + '/' + m.height)};`;
    const lq = m.lqip || (window.LQIP && window.LQIP[m.id]), bg = lq ? `background-image:url(${lq});` : '';
    return `<div class="ph ${o.cls || ''}" style="--ph:${m.color || '#14152a'};--fx:${fx[0]}%;--fy:${fx[1]}%;${ratio}${bg}">${AC.pic(m, o)}</div>`;
  };
  AC.placeholder = (label = 'foto aqui') => `<div class="ph ph--empty"><div class="ph__empty">${AC.icon('i-image')}${AC.esc(label)}</div></div>`;
  AC.fullSrc = (m) => {
    if (m.src) return m.src;
    if (m.type === 'video') return m.file;
    const w = m.widths[m.widths.length - 1];
    return `${m.base}-${w}.jpg`;
  };
  AC.tileSrc = (m) => m.thumb || AC.thumbSrc(m); // miniatura quadrada 112px (~3 KB)
  AC.thumbSrc = (m) => (m.src ? m.src : m.type === 'video' ? m.poster + '.jpg' : `${m.base}-${m.widths[0]}.jpg`);

  // blur-up: marca .is-loaded quando a imagem chega; slot vazio elegante se faltar arquivo
  document.addEventListener('load', (e) => {
    const t = e.target;
    if (t && (t.tagName === 'IMG' || t.tagName === 'VIDEO')) { const p = t.closest('.ph'); if (p) p.classList.add('is-loaded'); }
  }, true);
  document.addEventListener('loadeddata', (e) => { const p = e.target.closest && e.target.closest('.ph'); if (p) p.classList.add('is-loaded'); }, true);
  document.addEventListener('error', (e) => {
    const t = e.target;
    if (t && t.tagName === 'IMG') {
      const p = t.closest('.ph');
      if (p && !p.classList.contains('ph--empty')) { p.classList.add('ph--empty'); p.style.backgroundImage = 'none'; p.innerHTML = `<div class="ph__empty">${AC.icon('i-image')}foto aqui</div>`; }
    }
  }, true);
  AC.hydrate = (root) => AC.$$('.ph img', root).forEach((im) => { if (im.complete && im.naturalWidth) im.closest('.ph').classList.add('is-loaded'); });

  /* ---------- Observers ---------- */
  AC.io = (els, cb, opts = {}) => {
    const list = els instanceof Element ? [els] : Array.from(els);
    if (!('IntersectionObserver' in window)) { list.forEach((el) => cb(el, true, null)); return null; }
    const o = new IntersectionObserver((entries) => entries.forEach((en) => {
      cb(en.target, en.isIntersecting, en);
      if (opts.once && en.isIntersecting) o.unobserve(en.target);
    }), { threshold: opts.threshold ?? 0.15, rootMargin: opts.margin || '0px' });
    list.forEach((el) => o.observe(el));
    return o;
  };
  // revela .reveal / .divider / cartões ao entrar na viewport
  AC.reveal = (root) => {
    const els = AC.$$('.reveal:not(.is-seen), .divider:not(.is-seen), [data-in]:not(.is-seen)', root);
    els.forEach((el) => el.classList.add('is-seen'));
    AC.io(els, (el, on) => { if (on) el.classList.add('is-in'); }, { once: true, threshold: 0.12, margin: '0px 0px -6% 0px' });
  };

  // vídeo mudo em loop que só toca quando visível (um por vez fora do Modo Cinema)
  let currentAuto = null;
  AC.autoVideo = (video, { max = 40 } = {}) => {
    if (AC.lite()) return;
    video._io = AC.io(video.closest('.ph, .frame') || video, (el, on) => {
      if (on) {
        clearTimeout(video._u);
        if (currentAuto && currentAuto !== video) currentAuto.pause();
        if (video.dataset.src && !video.src) video.src = video.dataset.src;
        video.muted = true; video.loop = true; video.playsInline = true;
        const p = video.play(); if (p && p.catch) p.catch(() => {});
        currentAuto = video;
        video.closest('.ph')?.classList.add('is-playing');
      } else {
        video.pause();
        // iPhone: decodificador de vídeo parado também gasta memória → solta o arquivo depois de alguns segundos fora da tela
        clearTimeout(video._u);
        if (video.dataset.src) video._u = setTimeout(() => { video.removeAttribute('src'); video.load(); const ph = video.closest('.ph'); if (ph) ph.classList.remove('is-playing'); }, 4000);
      }
    }, { threshold: 0.6 });
  };

  /* ---------- Toast ---------- */
  AC.toast = (msg, ms = 3200) => {
    const box = AC.$('#toasts'); if (!box) return;
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; box.appendChild(t);
    while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => { t.classList.add('is-out'); setTimeout(() => t.remove(), 450); }, ms);
  };

  /* ---------- Foco preso em modais/gavetas ---------- */
  AC.trap = (container) => {
    const sel = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
    const onKey = (e) => {
      if (e.key !== 'Tab') return;
      const f = AC.$$(sel, container).filter((x) => x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], lastEl = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
    };
    container.addEventListener('keydown', onKey);
    return () => container.removeEventListener('keydown', onKey);
  };

  /* ---------- Download / compartilhar ---------- */
  AC.download = (m) => {
    const a = document.createElement('a');
    a.href = AC.fullSrc(m);
    a.download = (m.orig || m.id || 'memoria').replace(/\.[^.]+$/, '') + (m.type === 'video' ? '.mp4' : '.jpg');
    document.body.appendChild(a); a.click(); a.remove();
  };
  AC.share = async (data) => {
    const d = Object.assign({ title: 'Amor Cósmico • João Guilherme & Maria Cândida', text: '“Em todos os universos, eu escolheria você.”', url: AC.CONFIG.siteUrl || location.href }, data || {});
    try {
      if (navigator.share) { await navigator.share(d); return; }
      await navigator.clipboard.writeText(d.url);
      AC.toast('Link copiado! Agora é só mandar para ela 💌');
    } catch (e) { if (e && e.name !== 'AbortError') AC.toast('Não consegui compartilhar agora. Copie o endereço da barra do navegador.'); }
  };
})();
