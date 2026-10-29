/* ============================================================
   STORE — preferências, favoritas, "Minhas memórias" (IndexedDB)
   Tudo com try/catch: modo anônimo do Safari não derruba o site.
   ============================================================ */
(function () {
  'use strict';
  const AC = window.AC;
  const K = AC.CONFIG.storage;

  const read = (key, fallback) => { try { const r = localStorage.getItem(key); return r == null ? fallback : JSON.parse(r); } catch (_) { return fallback; } };
  const write = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (_) { return false; } };
  AC.store = { read, write };

  /* ---------- Preferências ---------- */
  const DEFAULTS = { soundOnEntry: true, musicVolume: 0.85, sfxEnabled: true, motionIntensity: 'full', starDensity: 'medium', focusMode: false };
  AC.prefs = Object.assign({}, DEFAULTS, read(K.prefs, {}));
  AC.savePrefs = () => write(K.prefs, AC.prefs);
  AC.applyPrefs = () => {
    const root = document.documentElement, p = AC.prefs;
    root.dataset.motion = p.motionIntensity === 'reduced' ? 'reduced' : 'full';
    root.dataset.focus = p.focusMode ? 'on' : 'off';
    AC.emit('prefs', p);
  };

  /* ---------- Favoritas ---------- */
  const saved = read(K.favs, null);
  AC.favs = new Set(saved || AC.MEDIA.filter((m) => m.favorite).map((m) => m.id));
  AC.isFav = (id) => AC.favs.has(id);
  AC.toggleFav = (id) => {
    const on = !AC.favs.has(id);
    on ? AC.favs.add(id) : AC.favs.delete(id);
    write(K.favs, Array.from(AC.favs));
    AC.emit('fav', { id, on });
    return on;
  };

  /* ---------- Minhas memórias (IndexedDB) ---------- */
  const DB = 'amor_cosmico_studio', STORE = 'items';
  function open() {
    return new Promise((res, rej) => {
      if (!window.indexedDB) return rej(new Error('sem IndexedDB'));
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: 'id' });
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  const tx = (mode, fn) => open().then((db) => new Promise((res, rej) => {
    const t = db.transaction(STORE, mode), s = t.objectStore(STORE), req = fn(s);
    t.oncomplete = () => res(req && req.result); t.onerror = () => rej(t.error);
  }));

  AC.studio = {
    urls: new Map(),
    async load() {
      try {
        const rows = await tx('readonly', (s) => s.getAll());
        (rows || []).forEach((r) => AC.studio._add(r));
        if (rows && rows.length) { AC.reindex(); AC.emit('media:changed'); }
      } catch (_) { /* sem suporte: segue sem Studio */ }
    },
    _add(r) {
      const url = URL.createObjectURL(r.blob);
      AC.studio.urls.set(r.id, url);
      const isVid = r.kind === 'video';
      AC.MEDIA.push({
        id: r.id, orig: r.name, type: isVid ? 'video' : 'photo', src: url, file: url, poster: null, width: r.w || 3, height: r.h || 4,
        date: r.date, milestone: 'enviadas', chapter: 6, place: '', caption: r.caption || r.name.replace(/\.[^.]+$/, ''), alt: r.caption || r.name,
        tags: ['minhas'], favorite: false, focal: [50, 40], color: '#1a1440', lqip: '', mine: true, duration: r.duration
      });
    },
    async add(files) {
      for (const f of files) {
        const kind = f.type.startsWith('video') ? 'video' : 'image';
        const id = 'u-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const meta = await AC.studio.measure(f, kind);
        const row = { id, name: f.name, kind, blob: f, w: meta.w, h: meta.h, duration: meta.duration, date: new Date().toISOString().slice(0, 10) };
        try { await tx('readwrite', (s) => s.put(row)); } catch (_) { AC.toast('Este navegador não deixou guardar a memória (modo privado?).'); }
        AC.studio._add(row);
      }
      AC.reindex(); AC.emit('media:changed');
    },
    measure(f, kind) {
      return new Promise((res) => {
        const url = URL.createObjectURL(f);
        if (kind === 'video') { const v = document.createElement('video'); v.preload = 'metadata'; v.onloadedmetadata = () => { res({ w: v.videoWidth, h: v.videoHeight, duration: Math.round(v.duration) }); URL.revokeObjectURL(url); }; v.onerror = () => res({ w: 9, h: 16 }); v.src = url; }
        else { const i = new Image(); i.onload = () => { res({ w: i.naturalWidth, h: i.naturalHeight }); URL.revokeObjectURL(url); }; i.onerror = () => res({ w: 3, h: 4 }); i.src = url; }
      });
    },
    async remove(id) {
      try { await tx('readwrite', (s) => s.delete(id)); } catch (_) {}
      const u = AC.studio.urls.get(id); if (u) URL.revokeObjectURL(u);
      AC.MEDIA = AC.MEDIA.filter((m) => m.id !== id);
      AC.reindex(); AC.emit('media:changed');
    }
  };
})();
