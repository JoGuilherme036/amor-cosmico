/* ============================================================
   FOTOS DE VOCÊS — a Maria (ou o João) envia fotos pelo celular e elas
   aparecem na galeria dos dois, guardadas no banco (Supabase).
   • Compressão no próprio aparelho: foto ≤ 1600 px (~400 KB) + miniatura ≤ 480 px (~30 KB).
   • A lista traz só miniaturas; a foto inteira é baixada ao abrir a imagem.
   • Sem banco configurado/sem senha: a foto fica só neste aparelho (IndexedDB) e o site avisa.
   • Vídeos: ficam só neste aparelho (grandes demais para o banco gratuito).
   ============================================================ */
(function () {
  'use strict';
  const AC = window.AC;
  const WHO = 'amor_cosmico_who_v1';
  const MAX_SIDE = 1600, THUMB_SIDE = 480, MAX_BYTES = 520 * 1024;
  const known = new Map(); // id remoto → item de mídia
  let lastId = 0, timer = 0, syncing = false;

  const canvasType = (() => { try { const c = document.createElement('canvas'); c.width = c.height = 1; return c.toDataURL('image/webp').indexOf('data:image/webp') === 0 ? 'image/webp' : 'image/jpeg'; } catch (_) { return 'image/jpeg'; } })();
  const toBlob = (cv, type, q) => new Promise((res) => cv.toBlob((b) => res(b), type, q));
  const b64 = (blob) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });

  function loadImage(file) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file), im = new Image();
      im.onload = () => { URL.revokeObjectURL(url); res(im); };
      im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Não consegui abrir essa imagem.')); };
      im.src = url; // o navegador aplica a orientação EXIF (foto de celular em pé)
    });
  }
  function draw(im, side) {
    const w0 = im.naturalWidth, h0 = im.naturalHeight, k = Math.min(1, side / Math.max(w0, h0));
    const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(w0 * k)); cv.height = Math.max(1, Math.round(h0 * k));
    cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); return cv;
  }
  async function compress(file) {
    const im = await loadImage(file);
    let side = MAX_SIDE, q = 0.82, blob = null, cv = null;
    let type = canvasType;
    for (let i = 0; i < 6; i++) {
      cv = draw(im, side); blob = await toBlob(cv, type, q);
      // alguns navegadores ignoram o formato pedido (ex.: devolvem PNG, enorme): nesse caso força JPEG
      if (blob && type !== 'image/jpeg' && blob.type !== type) { type = 'image/jpeg'; blob = await toBlob(cv, type, q); }
      if (blob && blob.size <= MAX_BYTES) break;
      q = Math.max(0.5, q - 0.1); if (q <= 0.52) { side = Math.round(side * 0.85); q = 0.78; }
    }
    if (!blob) throw new Error('Não consegui comprimir essa imagem.');
    const tcv = draw(im, THUMB_SIDE), tb = await toBlob(tcv, 'image/jpeg', 0.72);
    return { mime: blob.type === 'image/webp' ? 'image/webp' : 'image/jpeg', w: cv.width, h: cv.height, data: await b64(blob), thumb: await b64(tb), bytes: blob.size };
  }

  const mediaFrom = (row) => {
    const rid = Number(row.id), thumb = 'data:image/jpeg;base64,' + row.thumb;
    return {
      id: 'r-' + rid, rid, orig: 'enviada-' + rid, type: 'photo', remote: true, author: row.author, rmime: row.mime,
      src: thumb, thumb, width: row.w || 3, height: row.h || 4, date: String(row.created_at).slice(0, 10), milestone: 'enviadas', chapter: 6, place: '',
      caption: row.caption || `Enviada por ${row.author}`, alt: row.caption || `Foto enviada por ${row.author}`, tags: ['enviadas', String(row.author).toLowerCase()],
      favorite: false, focal: [50, 40], color: '#1a1440'
    };
  };
  function put(items) {
    if (!items.length) return;
    items.forEach((m) => { known.set(m.rid, m); AC.MEDIA.push(m); lastId = Math.max(lastId, m.rid); });
    AC.reindex(); AC.emit('media:changed'); AC.emit('photos:changed');
  }

  async function sync() {
    if (!AC.db.on || syncing) return; syncing = true;
    try {
      // 1) novas
      for (let guard = 0; guard < 10; guard++) {
        const rows = await AC.db.listPhotos(lastId); if (!rows || !rows.length) break;
        put(rows.filter((r) => !known.has(Number(r.id))).map(mediaFrom)); if (rows.length < 60) break;
      }
      // 2) apagadas (por qualquer um dos dois)
      const ids = new Set((await AC.db.photoIds()).map(Number)), gone = [...known.keys()].filter((id) => !ids.has(id));
      if (gone.length) { gone.forEach((id) => known.delete(id)); AC.MEDIA = AC.MEDIA.filter((m) => !(m.remote && gone.includes(m.rid))); AC.reindex(); AC.emit('media:changed'); AC.emit('photos:changed'); }
    } catch (e) { /* sem internet agora: tenta de novo no próximo ciclo */ }
    syncing = false;
  }
  const loop = () => { clearInterval(timer); timer = setInterval(() => { if (!document.hidden) sync(); }, 25000); };

  AC.photos = {
    get who() { try { return localStorage.getItem(WHO) || ''; } catch (_) { return ''; } },
    set who(v) { try { localStorage.setItem(WHO, v); } catch (_) {} },
    get count() { return known.size; },
    sync, compress,
    // devolve a URL da foto INTEIRA (baixa do banco na 1ª vez e guarda como Blob)
    async full(m) {
      if (!m.remote || m.full) return m.src;
      if (!m.fullP) m.fullP = AC.db.getPhoto(m.rid).then((b) => {
        const bin = atob(b), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        m.src = URL.createObjectURL(new Blob([u8], { type: m.rmime || 'image/jpeg' })); m.full = true; return m.src;
      }).catch((e) => { m.fullP = null; throw e; });
      return m.fullP;
    },
    async remove(m) {
      if (!m.remote) return false;
      await AC.db.deletePhoto(m.rid); known.delete(m.rid); AC.MEDIA = AC.MEDIA.filter((x) => x !== m); AC.reindex(); AC.emit('media:changed'); AC.emit('photos:changed'); return true;
    },
    // envia vários arquivos; onProgress(i, estado, mensagem). Fotos → banco (se ligado); vídeos/sem banco → só neste aparelho.
    async upload(files, { author, caption = '' }, onProgress = () => {}) {
      const out = { remote: 0, local: 0, failed: 0 };
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        try {
          if (f.type.startsWith('video')) { onProgress(i, 'work', 'Guardando o vídeo neste aparelho…'); await AC.studio.add([f]); out.local++; onProgress(i, 'ok', 'Vídeo guardado neste aparelho'); continue; }
          if (!AC.db.on) { onProgress(i, 'work', 'Guardando neste aparelho…'); await AC.studio.add([f]); out.local++; onProgress(i, 'ok', 'Guardada neste aparelho'); continue; }
          onProgress(i, 'work', 'Reduzindo a foto…'); const c = await compress(f);
          onProgress(i, 'work', `Enviando (${Math.round(c.bytes / 1024)} KB)…`);
          const id = await AC.db.addPhoto({ author, caption, mime: c.mime, w: c.w, h: c.h, thumb: c.thumb, data: c.data });
          put([mediaFrom({ id, author, caption, mime: c.mime, w: c.w, h: c.h, thumb: c.thumb, created_at: new Date().toISOString() })]);
          out.remote++; onProgress(i, 'ok', 'Enviada ✓');
        } catch (e) {
          // não perde a foto: guarda neste aparelho
          try { if (!f.type.startsWith('video')) await AC.studio.add([f]); out.local++; onProgress(i, 'warn', 'Sem conexão com o banco — guardei neste aparelho'); }
          catch (_) { out.failed++; onProgress(i, 'err', (e && e.message) || 'Não deu certo'); }
        }
      }
      return out;
    },
    start() { if (AC.db.on) { sync(); loop(); } }
  };
  AC.on('db:ready', () => AC.photos.start());
  document.addEventListener('visibilitychange', () => { if (!document.hidden) sync(); });
})();
