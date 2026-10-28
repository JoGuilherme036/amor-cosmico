/* ============================================================
   MAIN — orquestra tudo: portão, navegação, gavetas, preferências,
   céu por seção, easter eggs, PWA. Cada seção inicia isolada
   (um erro numa não derruba o resto).
   ============================================================ */
(function () {
  'use strict';
  const AC = window.AC, { $, $$ } = AC;

  const SECTIONS = [
    { id: 'inicio', label: 'Início', icon: 'i-home' }, { id: 'universo', label: 'Universo', icon: 'i-star' },
    { id: 'historia', label: 'História', icon: 'i-book' }, { id: 'linha-do-tempo', label: 'Tempo', icon: 'i-clock' },
    { id: 'numeros', label: 'Números', icon: 'i-award' }, { id: 'galeria', label: 'Galeria', icon: 'i-image' },
    { id: 'musica', label: 'Música', icon: 'i-music' }, { id: 'surpresa', label: 'Surpresa', icon: 'i-gift' },
    { id: 'futuro', label: 'Futuro', icon: 'i-infinity' }, { id: 'encerramento', label: 'Sempre', icon: 'i-heart' }
  ];
  const safe = (name, fn) => { try { fn(); } catch (e) { console.error('[amor-cosmico] falha em ' + name, e); } };

  /* ---------- divisores: constelação que se desenha ---------- */
  function dividers() {
    $$('.divider').forEach((d, k) => {
      const r = AC.seeded(k * 13 + 5); const pts = Array.from({ length: 6 }, (_, i) => [10 + i * 100, 10 + Math.round(r() * 36)]);
      d.innerHTML = `<svg viewBox="0 0 520 56" preserveAspectRatio="xMidYMid meet"><path class="line" pathLength="1" d="M${pts.map((p) => p.join(' ')).join(' L')}"/>${pts.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="2.6"/>`).join('')}</svg>`;
    });
  }

  /* ---------- navegação ---------- */
  function nav() {
    $('#dock').innerHTML = SECTIONS.map((s) => `<a href="#${s.id}" data-sec="${s.id}" aria-label="${s.label}">${AC.icon(s.icon)}<span>${s.label}</span></a>`).join('');
    const bottom = [SECTIONS[0], SECTIONS[2], SECTIONS[5], SECTIONS[6]];
    $('#bottom-nav').innerHTML = bottom.map((s) => `<a href="#${s.id}" data-sec="${s.id}">${AC.icon(s.icon)}<span>${s.label}</span></a>`).join('') + `<button type="button" id="btn-more" aria-label="Mais seções">${AC.icon('i-grid')}<span>Mais</span></button>`;
    $('#more-links').innerHTML = SECTIONS.map((s) => `<a href="#${s.id}" data-close-drawer>${AC.icon(s.icon)}${s.label}</a>`).join('');

    const links = $$('[data-sec]');
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean);
    // a seção "atual" é a que cruza a linha do meio da tela (funciona até para seções bem altas)
    AC.io(els, (el, on) => { if (on) links.forEach((a) => a.classList.toggle('is-current', a.dataset.sec === el.id)); }, { threshold: 0, margin: '-49% 0px -50% 0px' });

    // cabeçalho: sombra ao rolar, esconde ao descer
    const header = $('#header'), bar = $('#scroll-progress'); let lastY = 0, tick = false;
    const onScroll = () => {
      tick = false; const y = window.scrollY, max = document.documentElement.scrollHeight - innerHeight;
      header.classList.toggle('is-scrolled', y > 20);
      header.classList.toggle('is-hidden', y > lastY + 6 && y > 320 && !document.body.classList.contains('is-locked'));
      if (y < lastY - 6) header.classList.remove('is-hidden');
      lastY = y; bar.style.transform = `scaleX(${max > 0 ? (y / max).toFixed(4) : 0})`;
    };
    window.addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true }); onScroll();
  }

  /* ---------- cor do céu por seção / capítulo (depois que tudo foi montado) ---------- */
  function skyWatch() {
    const skyEls = $$('main [data-sky]');
    const ratios = new Map();
    if (!('IntersectionObserver' in window)) return;
    const o = new IntersectionObserver((entries) => {
      entries.forEach((en) => ratios.set(en.target, en.isIntersecting ? en.intersectionRatio * Math.min(1, en.boundingClientRect.height / innerHeight + 0.2) : 0));
      let best = null, br = 0; ratios.forEach((r, el) => { if (r > br) { br = r; best = el; } });
      if (best && br > 0.05) AC.setSky(best.dataset.sky);
    }, { threshold: [0, 0.1, 0.25, 0.4, 0.6, 0.8] });
    skyEls.forEach((e) => o.observe(e));
  }

  /* ---------- gavetas (mais / preferências) ---------- */
  let openDrawer = null, untrapD = null, lastFocusD = null;
  function drawer(id) {
    const d = $('#drawer-' + id); if (!d) return;
    closeDrawer(true);
    openDrawer = d; lastFocusD = document.activeElement;
    d.classList.add('is-on'); d.setAttribute('aria-hidden', 'false'); $('#scrim').classList.add('is-on'); document.body.classList.add('is-locked');
    untrapD = AC.trap(d); setTimeout(() => { const f = $('button, a', d); f && f.focus({ preventScroll: true }); }, 80);
  }
  function closeDrawer(silent) {
    if (!openDrawer) return;
    openDrawer.classList.remove('is-on'); openDrawer.setAttribute('aria-hidden', 'true'); $('#scrim').classList.remove('is-on');
    if (!AC.lightbox.isOpen && !AC.cinema.isOpen) document.body.classList.remove('is-locked');
    if (untrapD) untrapD(); openDrawer = null;
    if (!silent && lastFocusD && lastFocusD.focus) lastFocusD.focus({ preventScroll: true });
  }

  /* ---------- modais simples ---------- */
  function modals() {
    const m = $('#proposal-modal');
    const open = () => { m.classList.add('is-on'); m.setAttribute('aria-hidden', 'false'); document.body.classList.add('is-locked'); m._untrap = AC.trap(m); AC.celebrate(); AC.audio.switchTo('pedido'); setTimeout(() => $('[data-close-modal]', m).focus({ preventScroll: true }), 80); };
    const close = () => { m.classList.remove('is-on'); m.setAttribute('aria-hidden', 'true'); document.body.classList.remove('is-locked'); if (m._untrap) m._untrap(); AC.emit('zone:recheck'); };
    $('#btn-proposal').addEventListener('click', open);
    m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-close-modal]')) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (m.classList.contains('is-on')) close(); else if (openDrawer) closeDrawer(); } });
  }

  /* ---------- preferências ---------- */
  function prefsUi() {
    const p = AC.prefs;
    $$('[data-pref]').forEach((sw) => {
      sw.setAttribute('aria-checked', !!p[sw.dataset.pref]);
      sw.addEventListener('click', () => { p[sw.dataset.pref] = !p[sw.dataset.pref]; sw.setAttribute('aria-checked', p[sw.dataset.pref]); AC.savePrefs(); AC.applyPrefs(); });
    });
    $$('[data-pref-seg]').forEach((seg) => {
      const key = seg.dataset.prefSeg;
      const paint = () => $$('button', seg).forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === String(p[key])));
      paint();
      seg.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; p[key] = b.dataset.v; paint(); AC.savePrefs(); AC.applyPrefs(); });
    });
    const vol = $('#pref-volume'); vol.value = Math.round(p.musicVolume * 100); vol.style.setProperty('--p', vol.value + '%');
    vol.addEventListener('input', () => { vol.style.setProperty('--p', vol.value + '%'); AC.audio.setVolume(vol.value / 100); AC.emit('pref:volume', vol.value / 100); });

    // Minhas memórias
    const list = $('#studio-list');
    const paintList = () => {
      const mine = AC.MEDIA.filter((m) => m.mine);
      list.innerHTML = mine.length ? mine.map((m) => `<div class="glass" style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:var(--r-md);font-size:var(--fs-xs)"><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${AC.esc(m.orig)}</span><button type="button" class="btn btn--icon btn--ghost btn--sm" data-rm="${m.id}" aria-label="Remover">${AC.icon('i-trash')}</button></div>`).join('') : '';
    };
    list.addEventListener('click', (e) => { const b = e.target.closest('[data-rm]'); if (b) AC.studio.remove(b.dataset.rm); });
    $('#studio-input').addEventListener('change', async (e) => { const f = [...e.target.files]; e.target.value = ''; if (f.length) { await AC.studio.add(f); AC.toast(`${f.length} ${f.length === 1 ? 'memória adicionada' : 'memórias adicionadas'} ✨`); } });
    AC.on('media:changed', paintList); paintList();
    $('#btn-prefs').addEventListener('click', () => drawer('prefs'));
  }

  /* ---------- botões gerais ---------- */
  function wire() {
    $('#btn-celebrate').addEventListener('click', () => AC.celebrate());
    $('#btn-cinema-top').addEventListener('click', () => AC.cinema.open());
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-more')) { drawer('more'); return; }
      if (e.target.closest('[data-close-drawer]')) { closeDrawer(); return; }
      const a = e.target.closest('[data-act]');
      if (a) { closeDrawer(true); const act = a.dataset.act; if (act === 'cinema') AC.cinema.open(); else if (act === 'starwall') AC.starwall.open(AC.MEDIA); else if (act === 'share') AC.share(); else if (act === 'prefs') drawer('prefs'); }
    });
    $('#scrim').addEventListener('click', () => closeDrawer());
    // toque tátil curtinho na barra inferior (celular)
    $('#bottom-nav').addEventListener('click', (e) => { if (e.target.closest('a, button') && navigator.vibrate) navigator.vibrate(6); });
    $('#cta-story').addEventListener('click', () => { if (!AC.audio.state.playing && AC.prefs.soundOnEntry) AC.audio.playMusic(); });

    // easter egg: 7 toques no logo = chuva de estrelas
    let taps = [];
    $('#logo').addEventListener('click', (e) => { const n = performance.now(); taps = taps.filter((t) => n - t < 3000); taps.push(n); if (taps.length >= 7) { e.preventDefault(); taps = []; AC.starRain(); } });
    // Konami
    const seq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']; let pos = 0;
    document.addEventListener('keydown', (e) => { pos = e.key === seq[pos] ? pos + 1 : (e.key === seq[0] ? 1 : 0); if (pos === seq.length) { pos = 0; AC.starRain(); AC.toast('Mensagem secreta: eu te escolheria em todos os universos. 🤍', 6000); } });
  }

  /* ---------- portão de entrada (senha do casal no link publicado) ---------- */
  function gate() {
    const g = $('#gate'), form = $('#gate-form'), code = $('#gate-code'), err = $('#gate-err'), openBtn = $('#gate-open');
    const remember = $('#gate-remember'), rememberWrap = $('#gate-remember-wrap');
    if (/[?&]portao=0/.test(location.search)) { g.remove(); return Promise.resolve(); }
    document.body.classList.add('is-locked');
    const stop = AC.gateStars();
    const need = AC.vault.required;
    if (window.VAULT) { code.hidden = false; rememberWrap.hidden = false; code.placeholder = need ? AC.CONFIG.gate.hint : 'Senha (opcional)'; }
    if (need) AC.vault.prefetch('principal'); // a música já vai baixando (cifrada) enquanto digitam
    // aparelho já autorizado? entra só com um toque
    AC.vault.restore().then((ok) => { if (ok) { code.hidden = true; rememberWrap.hidden = true; err.textContent = 'Bem-vindos de volta 🤍'; } });
    return new Promise((res) => {
      let busy = false;
      const enter = (withSound) => {
        stop(); g.classList.add('is-out'); document.body.classList.remove('is-locked');
        setTimeout(() => g.remove(), 1400);
        if (withSound && AC.prefs.soundOnEntry) AC.audio.playMusic();
        AC.sfx('sparkle'); res();
      };
      const attempt = async (withSound) => {
        if (busy) return;
        AC.audio.unlockGesture(); // precisa acontecer ainda dentro do toque (iOS)
        const typed = code.value.trim();
        if (!AC.vault.unlocked && (need || typed)) {
          if (!AC.vault.available) { err.textContent = 'Abra pelo link seguro (https) para usar a senha.'; if (need) return; }
          else if (!typed) { err.textContent = 'Digite a senha do nosso universo 🤍'; code.focus(); return; }
          else {
            busy = true; openBtn.disabled = true; err.textContent = 'Abrindo o universo…';
            let ok = false; try { ok = await AC.vault.unlock(typed, remember.checked); } catch (_) { ok = false; }
            busy = false; openBtn.disabled = false;
            if (!ok) { err.textContent = 'Essa senha não é a nossa. Tente de novo 🤍'; code.value = ''; code.focus(); if (navigator.vibrate) navigator.vibrate([30, 40, 30]); return; }
          }
        }
        enter(withSound);
      };
      form.addEventListener('submit', (e) => { e.preventDefault(); attempt(true); });
      $('#gate-silent').addEventListener('click', () => attempt(false));
      setTimeout(() => (need && !code.hidden ? code : openBtn).focus({ preventScroll: true }), 300);
    });
  }

  /* ---------- mini player (celular) + aviso de troca de faixa ---------- */
  function mini() {
    const el = $('#mini'), play = $('#mini-play'), title = $('#mini-title'), note = $('#mini-note');
    let dismissed = false;
    const paint = () => {
      const t = AC.audio.tracks[AC.audio.track]; title.textContent = t.title; note.textContent = t.note;
      const on = AC.audio.state.playing; play.setAttribute('aria-label', on ? 'Pausar a música' : 'Tocar a música');
      play.querySelector('use').setAttribute('href', on ? '#i-pause' : '#i-play');
    };
    play.addEventListener('click', () => { AC.audio.toggleMusic(); if (navigator.vibrate) navigator.vibrate(8); });
    $('#mini-x').addEventListener('click', () => { dismissed = true; el.classList.remove('is-on'); setTimeout(() => (el.hidden = true), 400); });
    AC.on('music:state', ({ playing }) => { paint(); if (playing && !dismissed) { el.hidden = false; requestAnimationFrame(() => el.classList.add('is-on')); } });
    AC.on('music:track', ({ title: tt, manual }) => {
      paint(); el.classList.remove('is-swap'); void el.offsetWidth; el.classList.add('is-swap');
      if (!manual && AC.audio.state.playing && matchMedia('(min-width: 1100px)').matches) AC.toast(`♪ ${tt} — ${AC.audio.tracks[AC.audio.track].note}`, 3600);
    });
    paint();
  }

  /* ---------- 3D (Three.js) — carrega depois de tudo, só onde faz sentido ---------- */
  function loadCosmos() {
    const gl = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (_) { return false; } })();
    if (!gl || AC.lite()) { document.documentElement.dataset.cosmos = 'off'; return; }
    const s = document.createElement('script'); s.src = 'js/vendor/cosmos.js' + (window.AC_BUILD ? '?v=' + window.AC_BUILD : ''); s.async = true;
    s.onerror = () => { document.documentElement.dataset.cosmos = 'off'; };
    document.head.appendChild(s);
  }

  /* ---------- PWA ---------- */
  function pwa() {
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  /* ---------- BOOT ---------- */
  function boot() {
    AC.applyPrefs();
    dividers();
    // blur-up (LQIP) chega depois da 1ª pintura
    AC.afterLoad(() => { const s = document.createElement('script'); s.src = 'js/data/lqip.js' + (window.AC_BUILD ? '?v=' + window.AC_BUILD : ''); document.head.appendChild(s); }, 0);
    // Primeiro o que aparece na tela (portão, nav, hero); o resto entra em fatias para não travar o 1º desenho.
    // o 3D só carrega quando (a) a página terminou de montar e (b) o portão foi aberto — e num momento ocioso
    let gateOpen = false, built = false;
    const maybeCosmos = () => { if (gateOpen && built) (window.requestIdleCallback || ((f) => setTimeout(f, 300)))(() => safe('3D', loadCosmos), { timeout: 2500 }); };
    safe('portão', () => gate().then(() => { AC.startShooters(); gateOpen = true; maybeCosmos(); }));
    safe('nav', nav);
    safe('hero', AC.initHero);
    safe('gavetas', prefsUi);
    safe('modais', modals);
    safe('botões', wire);
    safe('mini player', mini);
    const later = [
      ['universo', AC.initUniverse], ['história', AC.initStory], ['linha do tempo', AC.initTimeline], ['números', AC.initNumbers],
      ['galeria', AC.initGallery], ['música', AC.initMusic], ['surpresa', AC.initScratch], ['futuro', AC.initFuture], ['encerramento', AC.initFinale]
    ];
    const yieldNow = () => new Promise((r) => setTimeout(r, 0));
    (async () => {
      await new Promise((res) => AC.afterLoad(res, 700)); // só depois que o retrato principal já apareceu
      for (const [name, fn] of later) { safe(name, fn); await yieldNow(); }
      safe('studio', () => AC.studio.load());
      safe('revelação', () => AC.reveal(document));
      safe('cursor', AC.initCursor);
      safe('magnético', AC.initMagnetic);
      AC.hydrate(document);
      safe('céu', skyWatch);
      safe('zonas da música', AC.songZones);
      built = true; maybeCosmos();
      document.documentElement.dataset.ready = '1';
      AC.emit('ready');
    })();
    pwa();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
