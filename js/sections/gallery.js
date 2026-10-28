/* GALERIA — masonry de verdade, carregamento em lotes, filtros (marco, tipo, favoritas, mês), busca, embaralhar, lightbox */
(function () {
  'use strict';
  const AC = window.AC, { $, $$ } = AC;
  // Os tiles reservam a proporção (aspect-ratio) e as imagens são lazy, então renderizar tudo de uma vez não pesa
  // e evita 'pulos' de layout ao usar os links de âncora. Acima de BATCH itens, entra em lotes.
  const BATCH = 400;
  const S = { ms: 'all', type: 'all', fav: false, month: 'all', q: '', shuffle: false };
  let view = [], shown = 0, order = null, host, sentinel, sio;

  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const msLabel = (id) => (AC.MILESTONES.find((m) => m.id === id) || {}).label || '';
  const hay = (m) => norm([m.caption, m.place, msLabel(m.milestone), (m.tags || []).join(' '), m.date ? AC.fmtMonth(m.date) : ''].join(' '));

  function compute() {
    const q = norm(S.q.trim());
    let list = AC.MEDIA.filter((m) =>
      (S.ms === 'all' || m.milestone === S.ms) &&
      (S.type === 'all' || (S.type === 'photo' ? m.type === 'photo' : m.type === 'video')) &&
      (!S.fav || AC.isFav(m.id)) &&
      (S.month === 'all' || (m.date || '').startsWith(S.month)) &&
      (!q || hay(m).includes(q)));
    list = list.slice().sort((a, b) => (a.date || '9').localeCompare(b.date || '9') || a.id.localeCompare(b.id));
    if (S.shuffle) { if (!order) order = AC.seeded(Date.now() % 9973); const r = AC.seeded(Date.now() % 9973); list.sort(() => r() - 0.5); }
    return list;
  }

  // Esqueleto leve (só a caixa com a proporção + blur-up). O conteúdo entra quando o tile chega perto da tela.
  function skeleton(m, i) {
    const lq = m.lqip || (window.LQIP && window.LQIP[m.id]), bg = lq ? `background-image:url(${lq});` : '';
    return `<figure class="tile" data-id="${m.id}" tabindex="0" role="button" aria-label="Abrir ${m.type === 'video' ? 'vídeo' : 'foto'}: ${AC.esc(m.caption)}" style="aspect-ratio:${m.width}/${m.height};background-color:${m.color || '#14152a'};${bg}transition-delay:${(i % 4) * 60}ms"></figure>`;
  }
  function fill(el) {
    const m = AC.get(el.dataset.id); if (!m || el.dataset.ready) return; el.dataset.ready = '1';
    const vid = m.type === 'video' && (m.duration || 0) <= 12 && !m.src ? `<video data-src="${m.file}" muted loop playsinline preload="none" aria-hidden="true"></video>` : '';
    const ph = AC.ph(m, { sizes: '(min-width:1000px) 25vw, (min-width:640px) 33vw, 50vw', ratio: false });
    const body = vid ? ph.replace(/<\/div>$/, vid + '</div>') : ph;
    const badge = m.type === 'video' ? `<span class="play-badge">${AC.icon('i-play')}${m.duration ? AC.fmtTime(m.duration) : ''}</span>` : m.live ? `<span class="play-badge play-badge--live">LIVE</span>` : '';
    const meta = [AC.dispShort(m), m.place ? m.place.split(',')[0] : ''].filter(Boolean).join(' • ');
    el.innerHTML = `${body}${badge}
      <button type="button" class="tile__fav" aria-pressed="${AC.isFav(m.id)}" aria-label="Favoritar" data-fav="${m.id}">${AC.icon('i-heart')}</button>
      <figcaption class="tile__over">${AC.esc(m.caption)}${meta ? `<br><small style="color:var(--c-gold)">${AC.esc(meta)}</small>` : ''}</figcaption>`;
    AC.hydrate(el);
    const v = el.querySelector('video[data-src]'); if (v) AC.autoVideo(v);
  }

  function renderMore() {
    if (shown >= view.length) return;
    const from = shown, chunk = view.slice(from, from + BATCH); shown += chunk.length;
    const tpl = document.createElement('div'); tpl.innerHTML = chunk.map((m, i) => skeleton(m, i)).join('');
    const els = Array.from(tpl.children); els.forEach((e) => host.appendChild(e));
    AC.io(els, (el, on) => { if (on) { fill(el); el.classList.add('is-in'); } }, { once: true, threshold: 0, margin: '600px 0px 600px 0px' });
  }

  function render() {
    view = compute(); shown = 0;
    host.innerHTML = ''; $('#g-empty').hidden = view.length > 0;
    const p = view.filter((m) => m.type === 'photo').length, v = view.length - p;
    $('#g-count').textContent = view.length ? `${view.length} memórias • ${p} fotos • ${v} vídeos` : '';
    renderMore();
    // se o sentinela já estiver na tela, o observer cuida do resto
    if (sio) { sio.disconnect(); sio.observe(sentinel); }
  }

  function chips() {
    const ms = $('#g-milestones'), counts = {}; AC.MEDIA.forEach((m) => { counts[m.milestone] = (counts[m.milestone] || 0) + 1; });
    const defs = [{ id: 'all', label: 'Todas', n: AC.MEDIA.length }].concat(AC.MILESTONES.filter((m) => counts[m.id]).map((m) => ({ ...m, n: counts[m.id] })));
    ms.innerHTML = defs.map((d) => `<button type="button" class="chip" data-ms="${d.id}" aria-pressed="${S.ms === d.id}">${AC.esc(d.label)} <span class="n">${d.n}</span></button>`).join('')
      + `<button type="button" class="chip" data-fav="1" aria-pressed="${S.fav}">${AC.icon('i-heart')} Favoritas <span class="n" id="fav-n">${AC.favs.size}</span></button>`;
    $('#g-types').innerHTML = [['all', 'Tudo'], ['photo', 'Fotos'], ['video', 'Vídeos']].map(([id, l]) => `<button type="button" class="chip" data-type="${id}" aria-pressed="${S.type === id}">${l}</button>`).join('');
    const months = [...new Set(AC.MEDIA.map((m) => (m.date || '').slice(0, 7)).filter(Boolean))].sort();
    $('#g-month').innerHTML = `<option value="all">Todos os meses</option>` + months.map((mo) => `<option value="${mo}">${AC.fmtMonth(mo + '-01')}</option>`).join('');
    $('#g-month').value = S.month;
  }

  AC.initGallery = function () {
    host = $('#masonry'); sentinel = $('#masonry-sentinel'); if (!host) return;
    chips(); render();
    sio = AC.io(sentinel, (el, on) => { if (on) renderMore(); }, { threshold: 0, margin: '900px 0px' });

    const tools = $('#gallery-tools');
    tools.addEventListener('click', (e) => {
      const c = e.target.closest('.chip'); if (!c) return;
      if (c.dataset.ms) { S.ms = c.dataset.ms; }
      else if (c.dataset.type) { S.type = c.dataset.type; }
      else if (c.dataset.fav) { S.fav = !S.fav; }
      $$('#g-milestones .chip').forEach((b) => { if (b.dataset.ms) b.setAttribute('aria-pressed', b.dataset.ms === S.ms); else b.setAttribute('aria-pressed', S.fav); });
      $$('#g-types .chip').forEach((b) => b.setAttribute('aria-pressed', b.dataset.type === S.type));
      render();
    });
    $('#g-month').addEventListener('change', (e) => { S.month = e.target.value; render(); });
    $('#g-search').addEventListener('input', AC.debounce((e) => { S.q = e.target.value; render(); }, 220));
    $('#g-shuffle').addEventListener('click', (e) => { S.shuffle = !S.shuffle; e.currentTarget.classList.toggle('is-active', S.shuffle); e.currentTarget.querySelector('.lbl').textContent = S.shuffle ? 'Ordem do tempo' : 'Embaralhar universo'; e.currentTarget.querySelector('.lbl-s').textContent = S.shuffle ? 'Ordem' : 'Embaralhar'; AC.sfx('sparkle'); render(); });
    $('#g-starwall').addEventListener('click', () => AC.starwall.open(view.length ? view : AC.MEDIA));
    $('#g-slideshow').addEventListener('click', () => { if (view.length) AC.lightbox.open(view, 0, { slideshow: true }); });

    host.addEventListener('click', (e) => {
      const fav = e.target.closest('[data-fav]');
      if (fav) { e.stopPropagation(); AC.toggleFav(fav.dataset.fav); AC.sfx('soft'); return; }
      const t = e.target.closest('.tile'); if (!t) return;
      AC.lightbox.open(view, view.findIndex((m) => m.id === t.dataset.id));
    });
    host.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('tile')) { e.preventDefault(); e.target.click(); } });

    AC.on('fav', ({ id, on }) => {
      $$(`[data-fav="${id}"]`, host).forEach((b) => b.setAttribute('aria-pressed', on));
      const n = $('#fav-n'); if (n) n.textContent = AC.favs.size;
      if (S.fav) render();
    });
    AC.on('media:changed', () => { chips(); render(); });
  };
})();
