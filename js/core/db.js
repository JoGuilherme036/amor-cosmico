/* ============================================================
   BANCO (Supabase) — mural, cápsula e curtidas compartilhados.
   • Sem SDK: chama as funções RPC via fetch (POST /rest/v1/rpc/<nome>).
   • Toda chamada leva o token da sala (derivado da senha do portão).
   • Sem configuração ou sem senha → AC.db.on === false e o site usa
     só o aparelho, como antes. Falhas de rede vão para uma fila e são
     reenviadas depois (evento "online" ou próxima visita).
   ============================================================ */
(function () {
  'use strict';
  const AC = window.AC;
  const C = AC.CONFIG.db || {};
  const OUTBOX = 'amor_cosmico_outbox_v1';

  async function rpc(fn, args = {}) {
    const r = await fetch(`${C.url.replace(/\/$/, '')}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { apikey: C.anonKey, Authorization: `Bearer ${C.anonKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ p_token: AC.vault.token }, args))
    });
    if (!r.ok) { const e = new Error(`db ${fn} ${r.status}`); e.status = r.status; throw e; }
    const txt = await r.text();
    return txt ? JSON.parse(txt) : null;
  }

  const queue = () => AC.store.read(OUTBOX, []);
  const enqueue = (fn, args) => { const q = queue(); q.push({ fn, args, at: Date.now() }); AC.store.write(OUTBOX, q.slice(-100)); };
  async function flush() {
    if (!AC.db.on) return; const q = queue(); if (!q.length) return;
    const left = [];
    for (const it of q) { try { await rpc(it.fn, it.args); } catch (e) { if (e.status === 401 || e.status === 403) continue; left.push(it); } }
    AC.store.write(OUTBOX, left);
    if (left.length < q.length) AC.emit('db:synced');
  }
  // escrita: tenta já; se a rede falhar, guarda para depois
  async function write(fn, args) {
    try { return await rpc(fn, args); } catch (e) { if (!e.status || e.status >= 500) enqueue(fn, args); throw e; }
  }

  AC.db = {
    get configured() { return !!(C.url && C.anonKey); },
    get on() { return this.configured && !!AC.vault.token; },
    listVows: () => rpc('vows_list'),
    addVow: (author, text) => write('vows_add', { p_author: author, p_text: text }),
    deleteVow: (id) => rpc('vows_delete', { p_id: id }),
    addCapsule: (author, text) => write('capsule_add', { p_author: author, p_text: text }),
    capsuleCount: () => rpc('capsule_count'),
    capsuleList: () => rpc('capsule_list'),
    heart: (mediaId) => write('hearts_add', { p_media: mediaId }).catch(() => {}),
    async heartCounts() { const rows = await rpc('heart_counts'); const m = {}; (rows || []).forEach((r) => { m[r.media_id] = Number(r.total); }); return m; },
    // fotos enviadas por vocês (sem fila offline: são grandes demais para o localStorage)
    listPhotos: (after = 0) => rpc('photos_list', { p_after: after }),
    photoIds: () => rpc('photos_ids'),
    getPhoto: (id) => rpc('photos_get', { p_id: id }),
    addPhoto: (o) => rpc('photos_add', { p_author: o.author, p_caption: o.caption || '', p_mime: o.mime, p_w: o.w, p_h: o.h, p_thumb: o.thumb, p_data: o.data }),
    deletePhoto: (id) => rpc('photos_delete', { p_id: id }),
    flush
  };

  window.addEventListener('online', flush);
  AC.on('vault:unlocked', () => { if (AC.db.on) { AC.emit('db:ready'); flush(); } });
})();
