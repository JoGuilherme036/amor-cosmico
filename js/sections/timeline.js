/* LINHA DO TEMPO — espinha luminosa que se preenche no scroll, nós, e carrossel de mídias por marco */
(function () {
  'use strict';
  const AC = window.AC, { $, $$ } = AC;

  function pick(match) {
    const inRange = (m) => (!match.from || (m.date && m.date >= match.from)) && (!match.to || (m.date && m.date <= match.to));
    let list = AC.MEDIA.filter((m) => match.milestones.includes(m.milestone) && inRange(m));
    if (match.extra) { const e = match.extra; list = list.concat(AC.MEDIA.filter((m) => e.milestones.includes(m.milestone) && m.date >= e.from && m.date <= e.to && !list.includes(m))); }
    // abre com a melhor foto; depois cronológico
    list.sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.id.localeCompare(b.id));
    const lead = list.find((m) => m.type === 'photo' && m.favorite) || list.find((m) => m.type === 'photo') || list[0];
    if (lead) list = [lead, ...list.filter((m) => m !== lead)];
    return list.slice(0, 14);
  }

  function itemHtml(t) {
    const list = pick(t.match); t._list = list;
    const thumbs = list.map((m, i) => `
      <button type="button" class="tl-thumb ${i === 0 ? 'tl-thumb--lead' : ''}" data-i="${i}" aria-label="Abrir: ${AC.esc(m.caption)}">
        ${AC.ph(m, { sizes: i === 0 ? '200px' : '115px', ratio: false })}
        ${m.type === 'video' ? `<span class="play-badge">${AC.icon('i-play')}${AC.fmtTime(m.duration)}</span>` : ''}
      </button>`).join('');
    const media = list.length ? `
      <div class="tl-media">
        <div class="tl-scroller" tabindex="0" aria-label="Fotos e vídeos de ${AC.esc(t.title)}">${thumbs}</div>
        <div class="tl-media__foot"><span class="tl-count">${list.length} ${list.length === 1 ? 'memória' : 'memórias'}</span>
          <span class="tl-arrows"><button type="button" class="btn btn--icon btn--ghost btn--sm" data-dir="-1" aria-label="Anteriores">${AC.icon('i-chev-l')}</button><button type="button" class="btn btn--icon btn--ghost btn--sm" data-dir="1" aria-label="Próximas">${AC.icon('i-chev-r')}</button></span>
        </div>
      </div>` : '';
    return `
    <article class="tl-item reveal" id="${t.id}" style="--tl:${t.color}"${t.song ? ` data-song="${t.song}"` : ''}>
      <span class="tl-node" aria-hidden="true">${AC.icon(t.icon)}</span>
      <div class="tl-card ${t.highlight ? 'is-hl' : ''}">
        <time class="tl-date" datetime="${t.iso}">${AC.esc(t.label)}</time>
        <h3>${AC.esc(t.title)}</h3>
        <p>${AC.esc(t.text)}</p>
        <details style="margin-top:10px"><summary style="cursor:pointer;color:var(--tl);font-size:var(--fs-sm);font-weight:600">Ler mais</summary><p style="margin-top:8px">${AC.esc(t.full)}</p></details>
        ${t.place ? `<div class="tl-place">${AC.icon('i-pin')}${AC.esc(t.place)}</div>` : ''}
        ${media}
      </div>
    </article>`;
  }

  AC.initTimeline = function () {
    const host = $('#timeline'); if (!host) return;
    host.innerHTML = `<div class="timeline__spine" aria-hidden="true"><div class="timeline__fill"></div></div>${AC.TIMELINE.map(itemHtml).join('')}`;
    AC.hydrate(host);
    host.addEventListener('click', (e) => {
      const arrow = e.target.closest('[data-dir]');
      if (arrow) { const sc = arrow.closest('.tl-media').querySelector('.tl-scroller'); sc.scrollBy({ left: +arrow.dataset.dir * sc.clientWidth * 0.8, behavior: 'smooth' }); return; }
      const th = e.target.closest('.tl-thumb'); if (!th) return;
      const t = AC.TIMELINE.find((x) => x.id === th.closest('.tl-item').id);
      AC.lightbox.open(t._list, +th.dataset.i);
    });
    // nós acendem; espinha se preenche
    $$('.tl-item', host).forEach((it, i) => it.style.setProperty('--rd', '0ms'));
    AC.io($$('.tl-item', host), (el, on) => el.classList.toggle("is-lit", on), { threshold: 0.3 });
    const fill = host.querySelector('.timeline__fill');
    let tick = false;
    const upd = () => {
      tick = false; const r = host.getBoundingClientRect(), vh = innerHeight;
      const p = AC.clamp((vh * 0.6 - r.top) / (r.height), 0, 1);
      fill.style.transform = `scaleY(${p.toFixed(4)})`; // direto no elemento: uma variável CSS no container seria herdada por todas as miniaturas
    };
    window.addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  };
})();
