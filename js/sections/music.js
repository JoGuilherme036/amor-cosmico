/* MÚSICA — vinil girando, onda de áudio real (Web Audio) e a noite do pedido em imagens */
(function () {
  'use strict';
  const AC = window.AC, { $, $$ } = AC;

  AC.initMusic = function () {
    const cover = $('#player-cover'), strip = $('#music-strip');
    const cm = AC.get(AC.CONFIG.musicCover);
    if (cover && cm) { cover.innerHTML = AC.pic(cm, { sizes: '120px', eager: true }); cover.style.setProperty('--ph', cm.color); }
    const sm = AC.getMany(AC.CONFIG.musicStrip);
    if (strip) {
      strip.innerHTML = sm.map((m, i) => `<figure class="tile is-in" data-i="${i}" tabindex="0" role="button" aria-label="Abrir: ${AC.esc(m.caption)}">${AC.ph(m, { sizes: '(min-width:800px) 22vw, 46vw', ratio: false })}${m.type === 'video' ? `<span class="play-badge">${AC.icon('i-play')}</span>` : ''}<figcaption class="tile__over">${AC.esc(m.caption)}</figcaption></figure>`).join('');
      AC.hydrate(strip);
      strip.addEventListener('click', (e) => { const t = e.target.closest('.tile'); if (t) AC.lightbox.open(sm, +t.dataset.i); });
      strip.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('tile')) { e.preventDefault(); e.target.click(); } });
    }

    const play = $('#p-play'), status = $('#player-status'), seek = $('#p-seek'), cur = $('#p-cur'), dur = $('#p-dur'), vol = $('#p-vol'), loop = $('#p-loop');
    const top = $('#btn-music-top'), np = $('#np-text'), cv = $('#wave'), vinyl = $('.player__vinyl');
    let seeking = false;

    const paint = (p) => {
      play.querySelector('use').setAttribute('href', p ? '#i-pause' : '#i-play'); play.setAttribute('aria-label', p ? 'Pausar' : 'Tocar');
      status.textContent = p ? 'Tocando agora' : 'Pausada';
      top.setAttribute('aria-pressed', p); np.textContent = p ? 'Tocando' : 'Música';
    };
    play.addEventListener('click', () => AC.audio.toggleMusic());
    top.addEventListener('click', () => AC.audio.toggleMusic());
    AC.on('music:state', ({ playing }) => paint(playing));
    AC.on('music:meta', ({ duration, track }) => { if (track === AC.audio.track) dur.textContent = AC.fmtTime(duration); });

    // lista de faixas: "Dia, Lugar e Hora" e "Chuva de Arroz"
    const list = $('#tracks'), title = $('#player-title'), artist = $('#player-artist');
    const names = Object.keys(AC.audio.tracks);
    list.innerHTML = names.map((n, i) => { const t = AC.audio.tracks[n]; return `<button type="button" class="track" role="radio" data-track="${n}" aria-checked="false"><span class="track__n">${i + 1}</span><span class="track__t"><b>${AC.esc(t.title)}</b><small>${AC.esc(t.note)}</small></span><span class="eq" aria-hidden="true"><span></span><span></span><span></span></span></button>`; }).join('');
    const paintTrack = () => {
      const t = AC.audio.tracks[AC.audio.track]; title.textContent = t.title; artist.textContent = `${t.artist} • ${t.note}`;
      $$('.track', list).forEach((b) => b.setAttribute('aria-checked', b.dataset.track === AC.audio.track));
      const el = t.el; dur.textContent = el.duration ? AC.fmtTime(el.duration) : '0:00'; cur.textContent = AC.fmtTime(el.currentTime || 0);
    };
    list.addEventListener('click', (e) => { const b = e.target.closest('.track'); if (b) { AC.audio.switchTo(b.dataset.track, { manual: true }); AC.sfx('soft'); } });
    AC.on('music:track', paintTrack); paintTrack();
    AC.on('music:time', ({ t, d }) => { cur.textContent = AC.fmtTime(t); if (d) { dur.textContent = AC.fmtTime(d); if (!seeking) { seek.value = Math.round((t / d) * 1000); seek.style.setProperty('--p', (t / d * 100) + '%'); } } });
    seek.addEventListener('input', () => { seeking = true; seek.style.setProperty('--p', seek.value / 10 + '%'); });
    seek.addEventListener('change', () => { AC.audio.seek(seek.value / 1000); seeking = false; });
    const setVol = (v) => { vol.value = v; vol.style.setProperty('--p', v + '%'); const pv = $('#pref-volume'); if (pv) { pv.value = v; pv.style.setProperty('--p', v + '%'); } };
    vol.addEventListener('input', () => { setVol(vol.value); AC.audio.setVolume(vol.value / 100); });
    setVol(Math.round(AC.prefs.musicVolume * 100));
    loop.addEventListener('click', () => { const on = loop.getAttribute('aria-pressed') !== 'true'; loop.setAttribute('aria-pressed', on); AC.audio.setLoop(on); });
    AC.on('pref:volume', (v) => setVol(Math.round(v * 100)));
    paint(false);

    // onda: só desenha com a seção visível
    const ctx = cv.getContext('2d'); let vis = false, beat = 0;
    const draw = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2), w = cv.clientWidth, h = cv.clientHeight;
      if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
      const n = Math.max(24, Math.floor(w / 9)), lv = AC.audio.levels(n), bw = w / n;
      const g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#00cfff'); g.addColorStop(0.5, '#ff5a9d'); g.addColorStop(1, '#e8c987'); ctx.fillStyle = g;
      let bass = 0;
      for (let i = 0; i < n; i++) {
        const v = lv[i] / 255, bh = Math.max(3, v * h * 0.95); if (i < 6) bass += v;
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(i * bw + 1.5, (h - bh) / 2, bw - 3, bh, 3) : ctx.rect(i * bw + 1.5, (h - bh) / 2, bw - 3, bh); ctx.fill();
      }
      beat += ((bass / 6) - beat) * 0.2;
      vinyl.style.boxShadow = `0 30px 70px -20px rgba(0,0,0,.9),0 0 0 1px rgba(255,255,255,.08),0 0 ${50 + beat * 120}px ${-20 + beat * 18}px rgba(255,90,157,${0.4 + beat * 0.6})`;
      document.documentElement.style.setProperty('--beat', beat.toFixed(3));
    };
    AC.io($('#player'), (el, on) => { if (on && !vis) { vis = true; AC.raf.add(draw); } else if (!on && vis) { vis = false; AC.raf.remove(draw); } }, { threshold: 0.05 });
  };
})();
