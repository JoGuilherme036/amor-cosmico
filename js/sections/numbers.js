/* NOSSOS NÚMEROS (contadores configuráveis) + MAPA DA NOSSA HISTÓRIA (rota que se desenha) */
(function () {
  'use strict';
  const AC = window.AC, { $, $$ } = AC;

  function value(n) {
    if (n.value !== 'auto') return n.value;
    if (n.key === 'dias') return Math.max(0, Math.floor((Date.now() - new Date(AC.CONFIG.couple.metDate)) / 86400000));
    if (n.key === 'fotos') return AC.MEDIA.filter((m) => m.type === 'photo').length;
    if (n.key === 'videos') return AC.MEDIA.filter((m) => m.type === 'video').length;
    return 0;
  }

  function counters() {
    const host = $('#numbers'); if (!host) return;
    const nums = AC.CONFIG.numbers.map((n) => ({ ...n, v: value(n) }));
    host.innerHTML = nums.map((n, i) => `<div class="num reveal" style="--rd:${i * 70}ms">${AC.icon(n.icon)}<b data-to="${typeof n.v === 'number' ? n.v : ''}">${typeof n.v === 'number' ? '0' : AC.esc(n.v)}</b><span>${AC.esc(n.label)}</span></div>`).join('');
    AC.io($$('.num', host), (el, on) => {
      if (!on) return;
      const b = el.querySelector('b'), to = +b.dataset.to; if (!b.dataset.to) return;
      if (AC.reduced()) { b.textContent = to; return; }
      const t0 = performance.now(), dur = 1700;
      const step = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); b.textContent = Math.round(to * e); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }, { once: true, threshold: 0.5 });
  }

  function map() {
    const host = $('#map'); if (!host) return;
    const jeri = AC.MEDIA.filter((m) => m.milestone === 'jeri' && m.type === 'photo'), ped = AC.MEDIA.filter((m) => m.milestone === 'pedido' && m.type === 'photo');
    const pj = AC.get('IMG_3956.JPEG') || jeri[0], pf = AC.get('FullSizeRender-6.JPEG') || ped[0];
    const img = (m, id) => (m ? `<clipPath id="${id}"><circle cx="0" cy="-46" r="24"/></clipPath><image href="${AC.thumbSrc(m)}" x="-24" y="-70" width="48" height="48" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>` : '');
    const stars = Array.from({ length: 28 }, (_, i) => { const r = AC.seeded(i * 77 + 3); return `<circle cx="${(r() * 400).toFixed(0)}" cy="${(r() * 250).toFixed(0)}" r="${(r() * 1.2 + 0.3).toFixed(1)}" fill="#fff" opacity="${(r() * 0.5 + 0.2).toFixed(2)}"/>`; }).join('');
    host.innerHTML = `
      <div>
        <span class="eyebrow eyebrow--plain">Mapa da nossa história</span>
        <h3>De Jericoacoara a Fortaleza</h3>
        <p>Nossa primeira viagem juntos e o pedido de casamento aconteceram no Ceará — duas estrelas no mapa da nossa história, ligadas por um caminho de amor.</p>
        <p style="margin-top:10px;font-size:var(--fs-sm);color:var(--t-faint)">Toque nas fotos para reviver cada lugar.</p>
      </div>
      <svg viewBox="0 0 400 250" role="img" aria-label="Mapa estilizado: Jericoacoara e Fortaleza ligadas por uma rota">
        ${stars}
        <path class="coast" d="M0 70 C40 66 56 84 84 96 S150 112 190 124 S230 142 262 156 S340 168 400 166"/>
        <path class="route" pathLength="1" d="M84 100 C130 108 176 122 250 156"/>
        <g class="pin" data-ms="jeri" transform="translate(84 100)" tabindex="0" role="button" aria-label="Jericoacoara, 28.07.2026">
          ${img(pj, 'mp-j')}<line x1="0" y1="-22" x2="0" y2="0" stroke="var(--c-gold)" stroke-width="1"/><circle class="dot" r="4"/>
          <text x="0" y="22" text-anchor="middle">Jericoacoara</text><text class="d" x="0" y="36" text-anchor="middle">28.07.2026</text>
        </g>
        <g class="pin" data-ms="pedido" transform="translate(250 156)" tabindex="0" role="button" aria-label="Fortaleza, 15.08.2026">
          ${img(pf, 'mp-f')}<line x1="0" y1="-22" x2="0" y2="0" stroke="var(--c-gold)" stroke-width="1"/><circle class="dot" r="4"/>
          <text x="0" y="22" text-anchor="middle">Fortaleza</text><text class="d" x="0" y="36" text-anchor="middle">15.08.2026</text>
        </g>
      </svg>`;
    const open = (ms) => { const l = AC.MEDIA.filter((m) => m.milestone === ms); if (l.length) AC.lightbox.open(l, 0); };
    $$('.pin', host).forEach((p) => { p.addEventListener('click', () => open(p.dataset.ms)); p.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(p.dataset.ms); } }); });
    AC.io(host, (el, on) => { if (on) el.classList.add('is-in'); }, { once: true, threshold: 0.4 });
  }

  AC.initNumbers = function () { counters(); map(); };
})();
