/* ============================================================
   COFRE — a senha do casal abre as músicas criptografadas e o banco.
   • A senha não fica no código: é validada decifrando VAULT.check.
   • Da senha (PBKDF2-SHA256, 310 mil iterações) saem 64 bytes:
     32 = chave AES-GCM dos áudios · 32 = token da sala (banco de dados).
   • Opcional: lembrar neste aparelho (guarda só os bytes derivados).
   ============================================================ */
(function () {
  'use strict';
  const AC = window.AC;
  const V = window.VAULT || null;
  const REMEMBER = 'amor_cosmico_vault_v1';
  const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const hex = (u8) => Array.from(u8, (b) => b.toString(16).padStart(2, '0')).join('');
  const subtle = window.crypto && window.crypto.subtle;
  // mesma normalização de scripts/encrypt-audio.mjs
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, '');

  let key = null; const buffers = {}; const urls = {};

  async function fromBits(bits) {
    key = await subtle.importKey('raw', bits.slice(0, 32), 'AES-GCM', false, ['decrypt']);
    AC.vault.token = hex(bits.slice(32));
  }
  async function open(u8) { // "ACE1" | iv(12) | cifra+tag
    if (u8[0] !== 65 || u8[1] !== 67 || u8[2] !== 69 || u8[3] !== 49) throw new Error('formato inválido');
    return new Uint8Array(await subtle.decrypt({ name: 'AES-GCM', iv: u8.slice(4, 16) }, key, u8.slice(16)));
  }

  AC.vault = {
    token: null,
    get available() { return !!(V && subtle); },
    // no link publicado a senha é obrigatória; por duplo clique (file://) ela é opcional
    get required() { return !!V && !AC.isFile; },
    get unlocked() { return !!key; },
    hasTrack: (name) => !!(V && V.tracks && V.tracks[name]),

    async unlock(password, remember = true) {
      if (!this.available) throw new Error('sem-crypto');
      const pw = norm(password); if (!pw) return false;
      const base = await subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
      const bits = new Uint8Array(await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: b64(V.salt), iterations: V.iter }, base, 512));
      await fromBits(bits);
      try { if (new TextDecoder().decode(await open(b64(V.check))) !== 'amor-cosmico-ok') throw 0; }
      catch (_) { key = null; this.token = null; return false; }
      if (remember) AC.store.write(REMEMBER, { salt: V.salt, bits: btoa(String.fromCharCode(...bits)) });
      AC.emit('vault:unlocked');
      return true;
    },
    // destrava sem digitar, se este aparelho já foi autorizado (e a senha não mudou)
    async restore() {
      const r = AC.store.read(REMEMBER, null);
      if (!r || !V || !subtle || r.salt !== V.salt) return false;
      try { await fromBits(b64(r.bits)); new TextDecoder().decode(await open(b64(V.check))); AC.emit('vault:unlocked'); return true; }
      catch (_) { key = null; this.token = null; return false; }
    },
    forget() { try { localStorage.removeItem(REMEMBER); } catch (_) {} },

    // baixa o arquivo cifrado cedo (enquanto o portão está aberto)
    prefetch(name) {
      if (AC.isFile || !this.hasTrack(name) || buffers[name]) return buffers[name];
      buffers[name] = fetch(V.tracks[name]).then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); });
      buffers[name].catch(() => { delete buffers[name]; });
      return buffers[name];
    },
    // devolve uma URL tocável (Blob) da faixa decifrada
    async trackUrl(name) {
      if (urls[name]) return urls[name];
      if (!key || !this.hasTrack(name)) return null;
      const buf = await this.prefetch(name);
      const plain = await open(new Uint8Array(buf));
      urls[name] = URL.createObjectURL(new Blob([plain], { type: 'audio/mpeg' }));
      return urls[name];
    }
  };
})();
