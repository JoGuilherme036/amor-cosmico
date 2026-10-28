/* HISTÓRIA — 6 capítulos editoriais, fotos intercaladas, narração palavra a palavra, índice e progresso */
(function () {
  'use strict';
  const AC = window.AC, { $, $$ } = AC;

  /* ---------- Molduras ---------- */
  function frame(m, variant, sizes, extra = '') {
    if (!m) return `<figure class="frame frame--${variant}">${AC.placeholder()}</figure>`;
    const isV = m.type === 'video';
    const vid = isV ? `<video data-src="${m.file}" muted loop playsinline preload="none" aria-label="${AC.esc(m.caption)}"></video>` : '';
    const ph = AC.ph(m, { sizes, ratio: variant === 'polaroid' ? '3/4' : false });
    const withVid = isV ? ph.replace(/<\/div>$/, vid + '</div>') : ph;
    const badge = isV ? `<span class="play-badge">${AC.icon('i-play')}${AC.fmtTime(m.duration)}</span>` : m.live ? `<span class="play-badge play-badge--live">LIVE</span>` : '';
    const cap = variant === 'polaroid' ? `<figcaption>${AC.esc(m.caption.split('•')[0].trim())}</figcaption>` : `<span class="float-cap">${AC.esc(m.caption)}</span>`;
    return `<figure class="frame frame--${variant} ${extra}" data-open="${m.id}" tabindex="0" role="button" aria-label="Abrir: ${AC.esc(m.caption)}">${withVid}${badge}${cap}</figure>`;
  }

  function art(c) {
    // capítulo 1: sem foto "antes de nós" — céu desenhado em código
    const pts = [[18, 70], [34, 40], [52, 56], [70, 24], [84, 52]];
    return `<div class="chapter__media chapter__art" style="background:radial-gradient(70% 60% at 30% 20%,rgba(122,155,255,.5),transparent 70%),radial-gradient(60% 60% at 80% 80%,rgba(122,40,203,.55),transparent 70%),#0b0c1c">
      <svg viewBox="0 0 100 125" style="position:absolute;inset:0;width:100%;height:100%" aria-hidden="true">
        ${pts.slice(1).map((p, i) => `<line x1="${pts[i][0]}" y1="${pts[i][1]}" x2="${p[0]}" y2="${p[1]}" stroke="#bcd0ff" stroke-width=".5" stroke-opacity=".7"/>`).join('')}
        ${pts.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="1.4" fill="#fff"/>`).join('')}
      </svg></div>`;
  }

  function block(b, ctx) {
    if (b.type === 'pair') {
      const [a, c] = AC.getMany(b.items); const v = b.polaroid ? 'polaroid' : 'glass';
      return `<div class="fig fig-pair reveal">${frame(a, v, '(min-width:700px) 45vw, 60vw')}${frame(c, v, '(min-width:700px) 40vw, 56vw')}</div>`;
    }
    if (b.type === 'wide') { const m = AC.get(b.item); return `<div class="fig fig-wide reveal">${frame(m, 'bare', '(min-width:1100px) 1000px, 92vw')}${m ? `<p class="fig-cap">${AC.esc(m.caption)}</p>` : ''}</div>`; }
    const ms = AC.getMany(b.items);
    return `<div class="fig reveal"><div class="fig-strip" aria-label="Galeria do capítulo">${ms.map((m) => frame(m, 'glass', '300px')).join('')}</div></div>`;
  }

  /* ---------- Palco das alianças (3D quando possível; SVG elegante como reserva) ---------- */
  function ringsStage() {
    return `
      <div class="rings3d reveal" data-rings data-song="pedido">
        <svg class="rings3d__fallback" viewBox="0 0 240 160" aria-hidden="true">
          <defs><linearGradient id="rgGold" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#fff4d6"/><stop offset=".45" stop-color="#e8c987"/><stop offset="1" stop-color="#a87a2c"/></linearGradient></defs>
          <ellipse cx="96" cy="88" rx="52" ry="40" fill="none" stroke="url(#rgGold)" stroke-width="9"/>
          <ellipse cx="146" cy="78" rx="48" ry="37" fill="none" stroke="url(#rgGold)" stroke-width="8"/>
          <path d="M146 30l9 10-9 11-9-11z" fill="#f4fbff" stroke="#cfe9ff" stroke-width="1"/>
        </svg>
        <canvas class="rings3d__canvas" aria-hidden="true"></canvas>
        <div class="rings3d__cap"><span class="badge">15.08.2026 • Fortaleza</span><p class="script text-gold">Ela disse sim</p><small>Arraste para girar • toque para brilhar</small></div>
      </div>`;
  }

  /* ---------- Texto em palavras (para destaque da narração) ---------- */
  const WORDS = []; // {el, chars}
  const SENT = [];  // {from,to,text}
  function wrap(text) {
    const parts = text.split(/(\s+)/); let html = '', sentStart = WORDS.length, buf = [];
    parts.forEach((p) => {
      if (!p) return;
      if (/^\s+$/.test(p)) { html += p; return; }
      const idx = WORDS.length; WORDS.push({ chars: p.length + 1, idx });
      html += `<span class="w" data-w="${idx}">${AC.esc(p)}</span>`; buf.push(p);
      if (/[.!?…”"]$/.test(p) && buf.length > 3) { SENT.push({ from: sentStart, to: idx, text: buf.join(' ') }); sentStart = idx + 1; buf = []; }
    });
    if (buf.length) SENT.push({ from: sentStart, to: WORDS.length - 1, text: buf.join(' ') });
    return html;
  }

  function chapterHtml(c) {
    const lists = [c.open, ...c.blocks.flatMap((b) => b.items || [b.item])].filter(Boolean);
    const open = c.open ? AC.get(c.open) : null;
    const media = open
      ? `<div class="chapter__media">${AC.ph(open, { sizes: '(min-width:960px) 44vw, 92vw', ratio: false, eager: c.n === 1 })}${open.type === 'video' ? '' : ''}</div>`
      : art(c);
    const body = c.paragraphs.map((p, i) => {
      const figs = c.blocks.filter((b) => b.after === i).map((b) => block(b)).join('');
      return `<p>${wrap(p)}</p>${figs}`;
    }).join('');
    return `
    <article class="chapter" id="cap-${c.n}" data-chapter="${c.n}" data-sky="${c.sky}"${c.song ? ` data-song="${c.song}"` : ''} data-lightbox-list='${JSON.stringify(lists)}' style="--accent:${c.accent}" aria-labelledby="cap-${c.n}-t">
      <div class="chapter__open">
        <span class="chapter__num" aria-hidden="true">${c.n}</span>
        ${media}
        <div class="chapter__title reveal"><span class="chapter__kicker">Capítulo ${c.n} de ${AC.CHAPTERS.length}</span><span class="badge">${AC.esc(c.badge)}</span><h3 id="cap-${c.n}-t">${AC.esc(c.title)}</h3></div>
      </div>
      ${c.rings ? ringsStage() : ''}
      <div class="chapter__body">
        <p class="milestone-note reveal">${AC.esc(c.milestone)}</p>
        <div class="prose">${body}</div>
        <blockquote class="pull reveal"><p>${AC.esc(c.quote)}</p></blockquote>
      </div>
    </article>`;
  }

  AC.initStory = function () {
    const host = $('#chapters'); if (!host) return;
    host.innerHTML = AC.CHAPTERS.map(chapterHtml).join('');
    AC.hydrate(host);
    // vídeos dentro do capítulo: tocam mudos só quando visíveis
    $$('video[data-src]', host).forEach((v) => AC.autoVideo(v));

    // abrir lightbox: lista = mídias do capítulo
    host.addEventListener('click', (e) => {
      const f = e.target.closest('[data-open]'); if (!f) return;
      const art = f.closest('.chapter'); const list = AC.getMany(JSON.parse(art.dataset.lightboxList));
      AC.lightbox.open(list, Math.max(0, list.findIndex((m) => m.id === f.dataset.open)));
    });
    host.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-open]')) { e.preventDefault(); e.target.click(); } });
    // arrastar horizontalmente com mouse nas faixas
    $$('.fig-strip', host).forEach((s) => {
      let down = false, sx = 0, sl = 0, moved = false;
      s.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = s.scrollLeft; });
      window.addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) moved = true; s.scrollLeft = sl - dx; });
      window.addEventListener('pointerup', () => { down = false; });
      s.addEventListener('click', (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
    });

    /* ---------- índice lateral / chips ---------- */
    const idx = $('#story-index');
    idx.innerHTML = AC.CHAPTERS.map((c) => `<a href="#cap-${c.n}" data-n="${c.n}" aria-label="Capítulo ${c.n}: ${AC.esc(c.title)}">${c.n}<span>${AC.esc(c.title)}</span></a>`).join('');
    const sec = $('#historia'), caps = $$('.chapter', host);
    AC.io(sec, (el, on) => idx.classList.toggle('is-on', on), { threshold: 0.02 });
    AC.io(caps, (el, on) => {
      if (!on) return; const n = el.dataset.chapter;
      $$('a', idx).forEach((a) => { a.classList.toggle('is-current', a.dataset.n === n); a.classList.toggle('is-past', +a.dataset.n < +n); });
    }, { threshold: 0.35 });

    narration();
  };

  /* ---------- Narração: destaque palavra a palavra + legenda fixa ---------- */
  function narration() {
    const btn = $('#btn-narrate'), hud = $('#story-hud'), play = $('#hud-play'), line = $('#hud-line'), bar = $('#hud-bar'), sec = $('#historia');
    const total = WORDS.reduce((a, w) => a + w.chars, 0); const cum = []; let acc = 0; WORDS.forEach((w) => { acc += w.chars; cum.push(acc); });
    const els = $$('.w', sec); let cur = -1, lastUser = 0, lastSent = -1, inStory = true, playingNow = false;
    const hudSync = () => hud.classList.toggle('is-on', playingNow || (cur >= 0 && inStory));
    AC.io(sec, (el, on) => { inStory = on; hudSync(); }, { threshold: 0.02 });
    ['wheel', 'touchmove', 'keydown', 'pointerdown'].forEach((ev) => window.addEventListener(ev, () => { lastUser = performance.now(); }, { passive: true }));

    const setUi = (playing) => {
      btn.setAttribute('aria-pressed', playing); btn.querySelector('span').textContent = playing ? 'Pausar a narração' : 'Ouvir a narração';
      btn.querySelector('svg use').setAttribute('href', playing ? '#i-pause' : '#i-play');
      play.querySelector('svg use').setAttribute('href', playing ? '#i-pause' : '#i-play');
      sec.classList.toggle('story--narrating', playing || cur >= 0);
    };
    const toggle = () => { AC.audio.toggleNarration(); };
    btn.addEventListener('click', toggle); play.addEventListener('click', toggle);
    AC.on('narr:state', (s) => {
      playingNow = s.playing; setUi(s.playing); hudSync();
      if (s.ended) { cur = -1; els.forEach((w) => w.classList.remove('is-said', 'is-now')); sec.classList.remove('story--narrating'); hud.classList.remove('is-on'); bar.style.transform = 'scaleX(0)'; }
      if (s.error) { btn.querySelector('span').textContent = 'Narração indisponível'; }
    });
    AC.on('narr:time', ({ t, d }) => {
      if (!d || !isFinite(d)) return;
      const frac = t / d; bar.style.transform = `scaleX(${frac.toFixed(4)})`;
      const target = frac * total; let k = cum.findIndex((c) => c >= target); if (k < 0) k = WORDS.length - 1;
      if (k === cur) return;
      const dir = k > cur; cur = k;
      els.forEach((w, i) => { w.classList.toggle('is-said', i < k); w.classList.toggle('is-now', i === k); });
      const si = SENT.findIndex((s) => k >= s.from && k <= s.to);
      if (si !== lastSent && si >= 0) { lastSent = si; line.textContent = SENT[si].text; }
      const w = els[k];
      if (w && dir && performance.now() - lastUser > 4000) {
        const r = w.getBoundingClientRect();
        if (r.top < innerHeight * 0.25 || r.bottom > innerHeight * 0.62) w.scrollIntoView({ block: 'center', behavior: AC.reduced() ? 'auto' : 'smooth' });
      }
    });
    // tocar nas palavras: pular para ali
    sec.addEventListener('click', (e) => { const w = e.target.closest('.w'); if (!w || AC.audio.narr.paused || !AC.audio.narr.duration) return; AC.audio.narr.currentTime = (cum[+w.dataset.w] - WORDS[+w.dataset.w].chars / 2) / total * AC.audio.narr.duration; });
  }
})();
