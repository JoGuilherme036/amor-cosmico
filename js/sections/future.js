/* FUTURO — Mapa Estelar do casal, mural de promessas, cápsula do tempo e quiz */
(function () {
  'use strict';
  const AC = window.AC, { $, $$ } = AC;
  const K = AC.CONFIG.storage;

  /* ---------- Mapa estelar + cartões ---------- */
  function starmap() {
    const host = $('#starmap'), grid = $('#dreams'); if (!host) return;
    const F = AC.FUTURE;
    const links = F.slice(1).map((s, i) => `<line class="link" pathLength="1" x1="${F[i].x}" y1="${F[i].y * 0.56}" x2="${s.x}" y2="${s.y * 0.56}"/>`).join('');
    const stars = F.map((s, i) => `<g class="st is-${s.status}" data-i="${i}" transform="translate(${s.x} ${s.y * 0.56})" tabindex="0" role="button" aria-label="${AC.esc(s.title)} — ${AC.esc(s.label)}">
      <circle class="pulse" r="3.4" stroke-width=".4"/><circle class="core" r="2.6"/><text class="num" y="1" style="font-size:2.6px">${i + 1}</text><text class="lbl" y="7.4" style="font-size:2.6px">${AC.esc(s.short || s.title)}</text></g>`).join('');
    const field = Array.from({ length: 40 }, (_, i) => { const r = AC.seeded(i * 31 + 7); return `<circle cx="${(r() * 100).toFixed(1)}" cy="${(r() * 56).toFixed(1)}" r="${(r() * 0.35 + 0.1).toFixed(2)}" fill="#fff" opacity="${(r() * 0.6 + 0.2).toFixed(2)}"/>`; }).join('');
    host.innerHTML = `<svg viewBox="0 0 100 56" role="group" aria-label="Mapa estelar do casal">${field}${links}${stars}</svg>
      <div class="legend"><span><i style="background:var(--c-gold)"></i>Vivido</span><span><i style="background:var(--c-blue)"></i>Planejando</span><span><i style="background:var(--c-violet-soft)"></i>Sonho</span></div>`;
    AC.io(host, (el, on) => { if (on) el.classList.add('is-in'); }, { once: true, threshold: 0.35 });

    grid.innerHTML = F.map((s, i) => {
      const m = s.photo && AC.get(s.photo);
      const bg = m ? `<div class="dream__bg">${AC.ph(m, { sizes: '(min-width:1040px) 33vw, 92vw', ratio: false })}</div>` : `<div class="dream__bg dream__bg--art" style="--art-a:${s.art ? s.art[0] : ''};--art-b:${s.art ? s.art[1] : ''}"></div>`;
      const badge = s.status === 'vivido' ? 'badge' : s.status === 'planejando' ? 'badge badge--blue' : 'badge badge--pink';
      return `<article class="dream reveal" id="dream-${i}" style="--pct:${s.pct}%;--rd:${(i % 3) * 90}ms" tabindex="0" role="button" aria-expanded="false" aria-label="${AC.esc(s.title)}. Toque para ver mais.">
        ${bg}<div class="dream__top"><span class="dream__ico">${AC.icon(s.icon)}</span><span class="${badge}">${AC.esc(s.label)}</span></div>
        <h3>${AC.esc(s.title)}</h3><p>${AC.esc(s.text)}</p><div class="dream__bar" aria-hidden="true"><i></i></div><p class="dream__more">${AC.esc(s.more)}</p></article>`;
    }).join('');
    AC.hydrate(grid);
    const toggle = (card) => { const on = card.classList.toggle('is-open'); card.setAttribute('aria-expanded', on); AC.sfx('soft'); };
    grid.addEventListener('click', (e) => { const c = e.target.closest('.dream'); if (c) toggle(c); });
    grid.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('dream')) { e.preventDefault(); toggle(e.target); } });
    AC.io($$('.dream', grid), (el, on) => { if (on) el.classList.add('is-in'); }, { once: true, threshold: 0.3 });
    const go = (st) => { const c = $('#dream-' + st.dataset.i); if (c) { c.scrollIntoView({ block: 'center', behavior: AC.reduced() ? 'auto' : 'smooth' }); setTimeout(() => { c.classList.add('is-open'); c.setAttribute('aria-expanded', 'true'); }, 500); } };
    $$('.st', host).forEach((st) => { st.addEventListener('click', () => go(st)); st.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(st); } }); });
  }

  const today = () => { const d = new Date(); return `${AC.pad(d.getDate())}.${AC.pad(d.getMonth() + 1)}.${d.getFullYear()}`; };
  const fromRow = (r) => ({ id: r.id, author: r.author, text: r.text, date: AC.fmtShort(String(r.created_at).slice(0, 10)) });

  /* ---------- Mural de promessas (banco quando configurado; senão, o aparelho) ---------- */
  function vows() {
    const form = $('#vow-form'), list = $('#vow-list'), status = $('#vow-status'); if (!form) return;
    let data = AC.store.read(K.vows, null) || AC.INITIAL_VOWS.slice();
    let remote = false;
    const save = () => { if (!remote) AC.store.write(K.vows, data); };
    const shown = () => (remote && !data.length ? AC.INITIAL_VOWS.map((v) => Object.assign({ fixed: true }, v)) : data);
    const render = (animateFirst) => {
      list.innerHTML = shown().map((v, i) => `<article class="vow" style="animation-delay:${animateFirst ? 0 : i * 80}ms"><p>${AC.esc(v.text)}</p><footer><span>${AC.esc(v.author)} • ${AC.esc(v.date)}</span>${v.fixed ? '' : `<button type="button" data-del="${i}" aria-label="Apagar promessa">${AC.icon('i-trash')}</button>`}</footer></article>`).join('');
      if (status) status.textContent = remote ? 'Sincronizado entre os nossos aparelhos ✓' : (AC.db.configured ? 'Salvo neste aparelho (entre com a senha para sincronizar)' : 'Salvo neste aparelho');
    };
    const pull = async () => {
      if (!AC.db.on) return;
      try { data = (await AC.db.listVows()).map(fromRow); remote = true; render(); }
      catch (_) { if (status) status.textContent = 'Sem conexão com o banco — mostrando o que está neste aparelho'; }
    };
    render(); pull();
    AC.on('db:ready', pull); AC.on('db:synced', pull);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const author = $('#vow-author').value.trim(), text = $('#vow-text').value.trim(); if (!author || !text) return;
      const btn = form.querySelector('[type=submit]'); btn.disabled = true;
      let item = { author, text, date: today() };
      if (remote) { try { item = fromRow(await AC.db.addVow(author, text)); } catch (_) { AC.toast('Sem internet agora: a promessa será enviada depois 💌'); } }
      data.unshift(item); save(); render(true); form.reset(); btn.disabled = false;
      AC.sfx('sparkle'); AC.toast('Promessa guardada no mural ✨');
      const r = list.getBoundingClientRect(); AC.confetti(r.left + r.width / 2, r.top + 40, 18);
    });
    list.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-del]'); if (!b) return;
      const i = +b.dataset.del, v = data[i]; if (!v) return;
      if (remote && v.id != null) { try { await AC.db.deleteVow(v.id); } catch (_) { AC.toast('Não consegui apagar agora. Tente de novo.'); return; } }
      data.splice(i, 1); save(); render(true);
    });
    $('#vow-export').addEventListener('click', () => {
      const txt = 'MURAL DE PROMESSAS — João Guilherme & Maria Cândida\n\n' + shown().map((v) => `“${v.text}”\n— ${v.author} (${v.date})\n`).join('\n');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain;charset=utf-8' })); a.download = 'promessas-amor-cosmico.txt'; document.body.appendChild(a); a.click(); a.remove();
      AC.toast('Promessas baixadas 💌');
    });
  }

  /* ---------- Cápsula do tempo (no banco, só pode ser lida a partir da data) ---------- */
  function capsule() {
    const host = $('#capsule'); if (!host) return;
    const open = new Date(AC.CONFIG.capsule.openDate + 'T00:00:00'), label = AC.CONFIG.capsule.label;
    let msgs = AC.store.read(K.capsule, []), remoteCount = null;
    const isOpen = () => Date.now() >= open.getTime();
    const render = () => {
      if (isOpen()) {
        host.innerHTML = `<span class="capsule__seal">${AC.icon('i-mail')}</span><h3>A cápsula foi aberta</h3><p>${AC.esc(label)}</p>
          ${msgs.length ? msgs.map((m) => `<div class="vow" style="width:100%;text-align:left"><p>${AC.esc(m.text)}</p><footer><span>${AC.esc(m.author)} • ${AC.esc(m.date)}</span></footer></div>`).join('') : '<p>Nenhuma mensagem foi guardada desta vez.</p>'}`;
        return;
      }
      const days = Math.ceil((open - Date.now()) / 86400000), n = remoteCount != null ? remoteCount : msgs.length;
      host.innerHTML = `<span class="capsule__seal" id="seal">${AC.icon('i-lock')}</span><h3>Cápsula do tempo</h3>
        <p>Escreva uma mensagem para o futuro. Ela fica lacrada e só pode ser lida em <b>${AC.esc(label)}</b> — faltam ${days} dias.</p>
        <p style="font-size:var(--fs-sm);color:var(--t-faint)">${n ? `${n} ${n === 1 ? 'mensagem guardada' : 'mensagens guardadas'} 💌` : 'Nenhuma mensagem guardada ainda.'}${remoteCount != null ? ' • guardadas no nosso banco' : ''}</p>
        <form id="cap-form" autocomplete="off"><div class="field"><label for="cap-text">Para o nosso futuro</label><textarea class="textarea" id="cap-text" maxlength="500" placeholder="Daqui a um ano, eu quero que você lembre…" required></textarea></div>
        <div class="field"><label for="cap-author">De</label><input class="input" id="cap-author" maxlength="40" placeholder="Seu nome" required></div>
        <button class="btn btn--primary" type="submit">${AC.icon('i-lock')}Guardar na cápsula</button></form>`;
      $('#cap-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const author = $('#cap-author').value.trim(), text = $('#cap-text').value.trim();
        if (AC.db.on) { try { await AC.db.addCapsule(author, text); remoteCount = (remoteCount || 0) + 1; } catch (_) { AC.toast('Sem internet: a mensagem será lacrada assim que voltar 💌'); } }
        else { msgs.push({ author, text, date: today() }); AC.store.write(K.capsule, msgs); }
        const seal = $('#seal'); seal.classList.add('is-sealing'); AC.sfx('sparkle'); AC.toast('Mensagem lacrada. Até lá! 🔒');
        setTimeout(render, 1500);
      });
    };
    const pull = async () => {
      if (!AC.db.on) return;
      try {
        if (isOpen()) { msgs = msgs.concat((await AC.db.capsuleList()).map(fromRow)); }
        else remoteCount = await AC.db.capsuleCount();
        render();
      } catch (_) { /* mantém o local */ }
    };
    render(); pull(); AC.on('db:ready', pull);
  }

  /* ---------- Quiz do casal ---------- */
  function quiz() {
    const host = $('#quiz'); if (!host) return;
    let i = 0, score = 0;
    const step = () => {
      if (i >= AC.QUIZ.length) {
        const msg = score === AC.QUIZ.length ? 'Vocês conhecem a própria história de cor. Em todos os universos, é isso. 🤍' : score >= 4 ? 'Quase perfeito! O amor de vocês está nos detalhes. ✨' : 'Que tal reler a nossa história com calma? Ela é linda. 💫';
        host.innerHTML = `<span class="quiz__step">Resultado</span><h3>${score} de ${AC.QUIZ.length}</h3><p class="quiz__q">${msg}</p><button class="btn btn--sm" id="quiz-again">Jogar de novo</button>`;
        $('#quiz-again').onclick = () => { i = 0; score = 0; step(); }; if (score === AC.QUIZ.length) AC.celebrate(); return;
      }
      const q = AC.QUIZ[i];
      host.innerHTML = `<span class="quiz__step">Quiz do casal • ${i + 1}/${AC.QUIZ.length}</span><h3>Vocês sabem?</h3><p class="quiz__q">${AC.esc(q.q)}</p><div class="quiz__opts">${q.a.map((a, k) => `<button type="button" data-k="${k}">${AC.esc(a)}</button>`).join('')}</div>`;
      $$('.quiz__opts button', host).forEach((b) => b.addEventListener('click', () => {
        const k = +b.dataset.k; if (k === q.ok) { score++; b.classList.add('ok'); AC.sfx('chime'); } else { b.classList.add('no'); $$('.quiz__opts button', host)[q.ok].classList.add('ok'); }
        $$('.quiz__opts button', host).forEach((x) => (x.disabled = true)); setTimeout(() => { i++; step(); }, 1100);
      }));
    };
    step();
  }

  AC.initFuture = function () { starmap(); vows(); capsule(); quiz(); };
})();
