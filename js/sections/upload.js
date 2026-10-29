/* ENVIAR FOTOS — painel para o João e a Maria adicionarem fotos (vão para o banco e aparecem para os dois) */
(function () {
  'use strict';
  const AC = window.AC, { $, $$ } = AC;

  let modal, untrap, lastFocus, busy = false;

  function note() {
    const el = $('#upload-note'); if (!el) return;
    if (AC.db.on) el.textContent = 'A Maria e o João podem enviar fotos aqui — elas ficam guardadas no banco e aparecem para os dois.';
    else if (AC.db.configured) el.textContent = 'Entre com a senha para as fotos aparecerem nos dois aparelhos. Por enquanto ficam só neste.';
    else el.textContent = 'As fotos ficam guardadas neste aparelho. Para aparecerem no celular do outro, ligue o banco (veja o LEIA-ME).';
  }

  function lead() {
    const el = $('#upload-lead'); if (!el) return;
    el.textContent = AC.db.on ? 'As fotos são reduzidas no seu celular e guardadas no banco — o João e a Maria veem na hora.' : 'O banco não está ligado: as fotos ficam guardadas só neste aparelho (vídeos também).';
  }

  function paintWho() {
    const who = AC.photos.who;
    $$('[data-who]', modal).forEach((b) => b.setAttribute('aria-checked', b.dataset.who === who));
    const pick = $('#upload-pick'); pick.setAttribute('aria-disabled', who ? 'false' : 'true'); pick.classList.toggle('is-off', !who);
    $('#upload-input').disabled = !who;
  }

  function open() {
    lastFocus = document.activeElement; paintWho(); lead(); $('#upload-list').innerHTML = ''; $('#upload-foot').textContent = '';
    modal.classList.add('is-on'); modal.setAttribute('aria-hidden', 'false'); document.body.classList.add('is-locked'); untrap = AC.trap(modal);
    setTimeout(() => { const f = AC.photos.who ? $('#upload-pick') : $('[data-who]', modal); if (f) f.focus({ preventScroll: true }); }, 80);
  }
  function close() {
    if (busy) { AC.toast('Aguarde o envio terminar 🤍'); return; }
    modal.classList.remove('is-on'); modal.setAttribute('aria-hidden', 'true'); document.body.classList.remove('is-locked'); if (untrap) untrap();
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  async function handle(files) {
    if (!files.length || busy) return;
    const who = AC.photos.who; if (!who) { AC.toast('Primeiro diga quem está enviando 🤍'); return; }
    busy = true; $('#upload-pick').classList.add('is-off');
    const list = $('#upload-list'); list.innerHTML = files.map((f, i) => `<li data-i="${i}" class="is-work"><span class="u-name">${AC.esc(f.name)}</span><span class="u-st">Na fila…</span></li>`).join('');
    const caption = $('#upload-caption').value.trim();
    const res = await AC.photos.upload(files, { author: who, caption }, (i, st, msg) => { const li = list.children[i]; if (!li) return; li.className = 'is-' + st; li.querySelector('.u-st').textContent = msg; });
    busy = false; $('#upload-pick').classList.remove('is-off'); $('#upload-input').value = '';
    const parts = []; if (res.remote) parts.push(`${res.remote} ${res.remote === 1 ? 'foto enviada' : 'fotos enviadas'} para o banco`); if (res.local) parts.push(`${res.local} guardada${res.local === 1 ? '' : 's'} neste aparelho`); if (res.failed) parts.push(`${res.failed} com erro`);
    $('#upload-foot').textContent = parts.join(' • ');
    if (res.remote || res.local) { AC.celebrate(); AC.toast(res.remote ? 'Fotos enviadas! Elas já aparecem na galeria ✨' : 'Fotos guardadas neste aparelho ✨'); }
    // leva direto para a galeria filtrada nas fotos enviadas
    if (res.remote) AC.emit('gallery:show-sent');
  }

  AC.initUpload = function () {
    modal = $('#upload-modal'); if (!modal) return;
    note(); AC.on('vault:unlocked', note); AC.on('db:ready', note);
    $('#btn-upload').addEventListener('click', open);
    const prefs = $('#btn-upload-prefs'); if (prefs) prefs.addEventListener('click', () => { AC.emit('drawers:close'); open(); });
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.closest('[data-close-upload]')) { close(); return; }
      const w = e.target.closest('[data-who]'); if (w) { AC.photos.who = w.dataset.who; paintWho(); AC.sfx('soft'); }
    });
    $('#upload-pick').addEventListener('click', (e) => { if (!AC.photos.who) { e.preventDefault(); AC.toast('Primeiro diga quem está enviando 🤍'); } });
    $('#upload-input').addEventListener('change', (e) => handle([...e.target.files]));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('is-on')) close(); });
  };
})();
