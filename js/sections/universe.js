/* UNIVERSO — 3 cartões 3D (foto de fundo + constelação que se desenha) e faixa de fotos */
(function () {
  'use strict';
  const AC = window.AC, { $, $$ } = AC;

  function constellation(c) {
    const lines = c.lines.map(([a, b]) => `<line x1="${c.points[a].x}" y1="${c.points[a].y}" x2="${c.points[b].x}" y2="${c.points[b].y}" pathLength="1"/>`).join('');
    const dots = c.points.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="2.2"/>`).join('');
    return `<div class="constel" aria-hidden="true"><svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">${lines}${dots}</svg></div>`;
  }

  AC.initUniverse = function () {
    const grid = $('#universe-cards'); if (!grid) return;
    grid.innerHTML = AC.UNIVERSE.map((c) => {
      const m = AC.get(c.photo);
      // frente: só a miniatura (3 KB) esticada = desfoque natural, sem filter nem imagem pesada; o verso carrega a foto nítida só no 1º toque
      const front = `<div class="ucard__bg">${m ? `<img src="${AC.tileSrc(m)}" alt="" decoding="async" loading="lazy">` : AC.placeholder()}</div><div class="ucard__shade"></div>`;
      const back = `<div class="ucard__bg" data-back></div><div class="ucard__shade"></div>`;
      return `
      <article class="ucard reveal" style="--accent:${c.accent}" tabindex="0" role="button" aria-pressed="false" aria-label="${AC.esc(c.title)}. Toque para virar o cartão.">
        <div class="ucard__inner">
          <div class="ucard__face ucard__face--front">${front}${constellation(c)}
            <span class="ucard__sub">${AC.esc(c.subtitle)}</span><h3>${AC.esc(c.title)}</h3><p>${AC.esc(c.short)}</p><span class="ucard__hint">Toque para virar</span></div>
          <div class="ucard__face ucard__face--back" aria-hidden="true">${back}
            <span class="ucard__sub">${AC.esc(c.title)}</span><p>${AC.esc(c.full)}</p><span class="ucard__hint">Toque para voltar</span></div>
        </div>
      </article>`;
    }).join('');
    AC.hydrate(grid);

    $$('.ucard', grid).forEach((card, i) => {
      card.style.setProperty('--rd', i * 120 + 'ms');
      const c = AC.UNIVERSE[i], m = AC.get(c.photo), backEl = card.querySelector('[data-back]');
      const flip = () => {
        const on = card.classList.toggle('is-flipped'); card.setAttribute('aria-pressed', on); AC.sfx('soft');
        card.querySelector('.ucard__face--front').setAttribute('aria-hidden', on); card.querySelector('.ucard__face--back').setAttribute('aria-hidden', !on);
        if (on && m && !backEl.dataset.ready) { backEl.dataset.ready = '1'; backEl.innerHTML = AC.ph(m, { sizes: '(min-width:960px) 34vw, 92vw', ratio: false }); AC.hydrate(backEl); }
      };
      card.addEventListener('click', flip);
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
      AC.tilt(card);
    });
    AC.io($$('.ucard', grid), (el, on) => { if (on) el.classList.add('is-in'); }, { once: true, threshold: 0.35 });

    // faixa de fotos (marquee) — duplicada para loop contínuo
    const strip = $('#universe-marquee'), items = AC.getMany(AC.UNIVERSE_STRIP);
    if (strip && items.length) {
      const cell = (m, i) => `<button type="button" class="marquee__item" data-i="${i}" aria-label="Abrir foto: ${AC.esc(m.caption)}">${AC.ph(m, { sizes: '180px', ratio: '3/4' })}</button>`;
      const once = items.map(cell).join('');
      strip.innerHTML = `<div class="marquee__track">${once}${once.replace(/<button /g, '<button aria-hidden="true" tabindex="-1" ')}</div>`;
      AC.hydrate(strip);
      strip.addEventListener('click', (e) => { const b = e.target.closest('.marquee__item'); if (b) AC.lightbox.open(items, (+b.dataset.i) % items.length); });
    }
  };
})();
