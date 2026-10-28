/* ENCERRAMENTO — mosaico de fotos em forma de coração, datas, modal do "sim" */
(function () {
  'use strict';
  const AC = window.AC, { $ } = AC;

  function heartMosaic() {
    const host = $('#heart-mosaic'); if (!host) return;
    const cols = window.innerWidth < 640 ? 17 : 23, rows = Math.round(cols * 0.92);
    const photos = AC.MEDIA.filter((m) => !m.mine);
    // as favoritas primeiro, depois o resto — repete se faltar
    const pool = [...photos.filter((m) => m.favorite), ...photos.filter((m) => !m.favorite)];
    host.style.setProperty('--cols', cols); host.style.gridTemplateColumns = `repeat(${cols}, var(--cell))`;
    const r = AC.seeded(11); let k = 0, html = '';
    const cx = (cols - 1) / 2, cy = (rows - 1) / 2;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const nx = ((x - cx) / cx) * 1.2, ny = (-(y - cy) / cy) * 1.15 + 0.12;
      const inside = Math.pow(nx * nx + ny * ny - 1, 3) - nx * nx * ny * ny * ny <= 0;
      if (!inside) { html += '<i class="hm is-off"></i>'; continue; }
      const m = pool[(k++ * 7 + Math.floor(r() * 3)) % pool.length];
      const d = Math.round(Math.hypot(x - cx, y - cy) * 55);
      html += `<i class="hm" style="--d:${d}"><img src="${AC.tileSrc(m)}" alt="" loading="lazy" decoding="async"></i>`;
    }
    host.innerHTML = html;
    AC.io(host, (el, on) => { if (on) el.classList.add('is-in'); }, { once: true, threshold: 0.3 });
  }

  AC.initFinale = function () {
    heartMosaic();
    const badges = AC.CONFIG.dates.map((d) => `<span class="badge">${AC.esc(d.label)}</span>`).join('');
    $('#finale-dates').innerHTML = badges;
    $('#footer-dates').innerHTML = AC.CONFIG.dates.map((d) => `<span>${AC.esc(d.label)}</span>`).join('');
    $('#btn-top').addEventListener('click', () => { window.scrollTo({ top: 0, behavior: AC.reduced() ? 'auto' : 'smooth' }); AC.sky.shootingStar(); });
    $('#btn-cinema-end').addEventListener('click', () => AC.cinema.open());
    let lastWidth = innerWidth;
    window.addEventListener('resize', AC.debounce(() => { if (Math.abs(innerWidth - lastWidth) > 100) { lastWidth = innerWidth; heartMosaic(); } }, 400));
  };
})();
