/* ============================================================
   ÁUDIO v2 — duas faixas com crossfade, troca automática no pedido,
   narração, analisador real e fallback sintetizado.
   • principal = "Dia, Lugar e Hora" · pedido = "Chuva de Arroz"
   • Fontes: cofre (link publicado, decifrado com a senha) ou MP3 local
     (duplo clique / servidor local).
   • iOS: unlockGesture() é chamado no toque do portão, ANTES de qualquer
     await, para os elementos poderem tocar depois de decifrar.
   • Em file:// o Chrome zera o áudio de MediaElementSource → lá a onda
     é só visual (o som continua normal).
   ============================================================ */
(function () {
  'use strict';
  const AC = window.AC;
  const A = AC.CONFIG.audio, K = AC.CONFIG.storage;
  const NAMES = Object.keys(A.tracks); // ['principal', 'pedido']

  // WAV mudo de 0,05 s para "destravar" os elementos no iOS
  const SILENT = (() => {
    const n = 400, b = new Uint8Array(44 + n), v = new DataView(b.buffer);
    const s = (o, t) => [...t].forEach((c, i) => (b[o + i] = c.charCodeAt(0)));
    s(0, 'RIFF'); v.setUint32(4, 36 + n, true); s(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); s(36, 'data'); v.setUint32(40, n, true); b.fill(128, 44);
    return 'data:audio/wav;base64,' + btoa(String.fromCharCode(...b));
  })();

  // iPhone/iPad ignoram element.volume (fica sempre 1): lá não existe crossfade — a troca é um corte limpo
  const VOL_OK = (() => { try { const a = new Audio(); a.volume = 0.5; return a.volume === 0.5; } catch (_) { return false; } })();
  let gen = 0; // "geração" da operação atual: operações antigas (async) que chegam atrasadas se abortam

  const T = {};
  NAMES.forEach((name) => {
    const el = new Audio(); el.preload = 'none'; el.loop = true; el.volume = 0;
    T[name] = { name, el, ready: false, failed: false, loading: null, ...A.tracks[name] };
  });
  const narr = new Audio(); narr.preload = 'none'; narr.src = A.narration;

  const S = { playing: false, narrating: false, track: 'principal', zone: 'principal' };
  let synth = null, analyser = null, bins = null, ducked = false, warned = false, unlocked = false;
  const pos = Object.assign({}, AC.store.read(K.time, {}));

  const fade = (el, to, ms = 600, done) => {
    cancelAnimationFrame(el._f);
    if (!VOL_OK) { if (to === 0 && done) done(); return; } // sem controle de volume: só executa o "depois"
    const from = el.volume, t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / ms); el.volume = AC.clamp(from + (to - from) * k, 0, 1);
      if (k < 1) el._f = requestAnimationFrame(step); else if (done) done();
    };
    el._f = requestAnimationFrame(step);
  };
  const targetVol = () => AC.prefs.musicVolume * (S.narrating || ducked ? 0.22 : 1);
  const cur = () => T[S.track];

  /* ---------- fallback sintetizado (pad suave) ---------- */
  function startSynth() {
    const c = AC.ctx(); if (!c || synth) return;
    const master = c.createGain(); master.gain.value = 0; master.connect(c.destination);
    const chords = [[220, 261.6, 329.6], [174.6, 220, 261.6], [261.6, 329.6, 392], [196, 246.9, 293.7]];
    const oscs = [0, 1, 2].map((i) => { const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = chords[0][i]; const g = c.createGain(); g.gain.value = 0.35; o.connect(g).connect(master); o.start(); return o; });
    let k = 0; const id = setInterval(() => { k = (k + 1) % chords.length; oscs.forEach((o, i) => o.frequency.setTargetAtTime(chords[k][i], c.currentTime, 1.2)); }, 5000);
    master.gain.setTargetAtTime(0.12 * AC.prefs.musicVolume, c.currentTime, 1.5);
    synth = { master, oscs, id };
  }
  function stopSynth() {
    if (!synth) return; const c = AC.ctx();
    synth.master.gain.setTargetAtTime(0, c.currentTime, 0.4);
    const s = synth; synth = null; clearInterval(s.id);
    setTimeout(() => s.oscs.forEach((o) => { try { o.stop(); } catch (_) {} }), 1200);
  }

  function connectAnalyser(t) {
    if (AC.isFile || t.connected) return;
    const c = AC.ctx(); if (!c) return;
    try {
      if (!analyser) { analyser = c.createAnalyser(); analyser.fftSize = 128; analyser.smoothingTimeConstant = 0.82; analyser.connect(c.destination); bins = new Uint8Array(analyser.frequencyBinCount); }
      c.createMediaElementSource(t.el).connect(analyser); t.connected = true;
    } catch (_) { /* segue sem analisador */ }
  }

  /* ---------- carregar a fonte de cada faixa ---------- */
  function load(t) {
    if (t.ready) return Promise.resolve(true);
    if (t.loading) return t.loading;
    t.loading = (async () => {
      let src = null;
      if (AC.vault.unlocked && AC.vault.hasTrack(t.name)) { try { src = await AC.vault.trackUrl(t.name); } catch (_) { src = null; } }
      if (!src) src = t.local; // duplo clique / servidor local com os MP3
      return new Promise((res) => {
        let done = false;
        const finish = (good) => { if (done) return; done = true; t.el.removeEventListener('canplay', onOk); t.el.removeEventListener('error', onBad); clearTimeout(tm); if (!good) { t.failed = true; t.loading = null; } else t.ready = true; res(good); };
        const onOk = () => finish(true), onBad = () => finish(false);
        t.el.addEventListener('canplay', onOk, { once: true }); t.el.addEventListener('error', onBad, { once: true });
        // posição salva + duração: quando os metadados chegarem (se chegarem)
        t.el.addEventListener('loadedmetadata', () => { const p = pos[t.name]; if (p > 2 && p < (t.el.duration || 0) - 8) { try { t.el.currentTime = p; } catch (_) {} } AC.emit('music:meta', { duration: t.el.duration, track: t.name }); }, { once: true });
        // iOS só baixa de verdade ao dar play(): não espere por "canplay" mais que ~0,7 s
        const tm = setTimeout(() => finish(true), 700);
        t.el.preload = 'auto'; t.el.src = src; t.el.load();
      });
    })();
    return t.loading;
  }

  let lastSave = 0;
  NAMES.forEach((name) => {
    const t = T[name];
    t.el.addEventListener('timeupdate', () => {
      pos[name] = t.el.currentTime;
      if (name === S.track) AC.emit('music:time', { t: t.el.currentTime, d: t.el.duration, track: name });
      if (performance.now() - lastSave > 3000) { lastSave = performance.now(); AC.store.write(K.time, pos); }
    });
  });

  function setState(p) { S.playing = p; document.body.classList.toggle('is-music-on', p); AC.emit('music:state', { playing: p, track: S.track }); }
  function useSynth() {
    if (!warned) { warned = true; AC.toast(AC.vault.required && !AC.vault.unlocked ? 'A música abre com a senha do portão 🔒' : 'Não achei a música — tocando um fundo suave no lugar.', 5200); }
    startSynth();
  }

  // só a faixa atual pode estar tocando — chamado depois de qualquer troca/pausa para garantir isso
  function settle() {
    NAMES.forEach((n) => { const el = T[n].el; if (el.paused) return; if (!S.playing || n !== S.track) { cancelAnimationFrame(el._f); el.pause(); } });
  }

  async function startTrack(t, fromStart, g) {
    if (t.unlocking) await t.unlocking; // o "destravar" do iOS termina ANTES de a faixa real começar (senão ele a pausaria)
    const ok = await load(t);
    if (g !== gen) return false; // chegou atrasada: outra troca/pausa já aconteceu
    if (!ok) { useSynth(); return false; }
    connectAnalyser(t);
    if (fromStart && !t.played) { try { t.el.currentTime = 0; } catch (_) {} }
    if (VOL_OK) t.el.volume = 0;
    try {
      await t.el.play();
      if (g !== gen) { t.el.pause(); return false; }
      t.played = true; fade(t.el, targetVol(), 1400); return true;
    } catch (e) {
      if (e && e.name === 'NotAllowedError') AC.toast('Toque em ▶ para ouvir a nossa música 🎶');
      return false;
    }
  }

  AC.audio = {
    music: T.principal.el, narr, state: S, tracks: T,
    get track() { return S.track; },
    // chamado dentro do toque do usuário (portão): libera tocar depois, mesmo após await
    unlockGesture() {
      AC.ctx();
      if (unlocked) return; unlocked = true;
      NAMES.forEach((n) => { const t = T[n], el = t.el; if (el.src) return; el.src = SILENT; const p = el.play(); t.unlocking = p ? p.then(() => el.pause()).catch(() => {}).then(() => { t.unlocking = null; }) : null; });
      narr.load();
    },
    async playMusic() {
      AC.ctx(); const g = ++gen;
      setState(true); // otimista: a interface responde na hora
      const ok = await startTrack(cur(), S.track === 'pedido', g);
      if (g !== gen) return;
      if (!ok && !synth) setState(false);
      settle();
      // a outra faixa já vai baixando em segundo plano
      NAMES.filter((n) => n !== S.track).forEach((n) => { if (AC.vault.unlocked) AC.vault.prefetch(n); });
    },
    pauseMusic() {
      gen++;
      if (synth) stopSynth();
      NAMES.forEach((n) => { const el = T[n].el; if (!el.paused) { if (VOL_OK) fade(el, 0, 500, () => { if (!S.playing) el.pause(); }); else el.pause(); } });
      setState(false);
    },
    toggleMusic() { return S.playing ? this.pauseMusic() : this.playMusic(); },
    // troca de faixa (auto = pelas zonas da página; manual = player). Com volume: crossfade; no iOS: corte limpo.
    async switchTo(name, { manual = false } = {}) {
      if (!T[name]) return;
      if (name === S.track) { if (manual) { AC.emit('music:track', { track: name, title: T[name].title, manual }); if (!S.playing) this.playMusic(); } return; }
      const prev = cur(); S.track = name; const g = ++gen;
      AC.emit('music:track', { track: name, title: T[name].title, manual });
      if (!S.playing) { if (manual) this.playMusic(); return; }
      if (synth) return; // sem MP3: o fundo sintetizado segue
      if (VOL_OK) fade(prev.el, 0, 1600, () => { if (S.track !== prev.name || !S.playing) prev.el.pause(); });
      else prev.el.pause();
      await startTrack(T[name], name === 'pedido', g);
      if (g === gen) settle();
    },
    setZone(name) { S.zone = name; return this.switchTo(name); },
    setVolume(v) {
      AC.prefs.musicVolume = AC.clamp(v, 0, 1); AC.savePrefs();
      if (synth) synth.master.gain.value = 0.12 * AC.prefs.musicVolume;
      else if (S.playing) cur().el.volume = targetVol();
    },
    setLoop(b) { NAMES.forEach((n) => (T[n].el.loop = !!b)); },
    seek(frac) { const el = cur().el; if (el.duration) el.currentTime = frac * el.duration; },
    duck(on) { ducked = !!on; if (S.playing && !synth) fade(cur().el, targetVol(), 500); },
    levels(n = 48) {
      const out = new Array(n);
      if (analyser && S.playing && !synth) {
        analyser.getByteFrequencyData(bins);
        for (let i = 0; i < n; i++) out[i] = bins[Math.floor((i / n) * bins.length * 0.8)] || 0;
        return out;
      }
      const t = performance.now() * 0.002, on = S.playing ? 1 : 0.15;
      for (let i = 0; i < n; i++) out[i] = on * (110 + 90 * Math.sin(t * (1 + i * 0.07) + i * 0.6) * Math.sin(t * 0.7 + i * 0.2)) * (1 - i / (n * 1.4));
      return out;
    },

    /* ---------- Narração ---------- */
    async playNarration() {
      narr.preload = 'auto'; AC.ctx();
      try { await narr.play(); S.narrating = true; if (S.playing && !synth) fade(cur().el, targetVol(), 600); AC.emit('narr:state', { playing: true }); return true; }
      catch (e) { AC.toast('A narração não pôde tocar agora. Confira assets/audio/narracao.mp3.', 4800); AC.emit('narr:state', { playing: false }); return false; }
    },
    pauseNarration() { narr.pause(); S.narrating = false; if (S.playing && !synth) fade(cur().el, targetVol(), 800); AC.emit('narr:state', { playing: false }); },
    toggleNarration() { return narr.paused ? this.playNarration() : this.pauseNarration(); }
  };
  narr.addEventListener('ended', () => { S.narrating = false; if (S.playing && !synth) fade(cur().el, targetVol(), 800); AC.emit('narr:state', { playing: false, ended: true }); });
  narr.addEventListener('timeupdate', () => AC.emit('narr:time', { t: narr.currentTime, d: narr.duration }));
  narr.addEventListener('error', () => { AC.emit('narr:state', { playing: false, error: true }); });

  /* ============================================================
     ZONAS — "Chuva de Arroz" toca quando o pedido domina a tela.
     Histerese: o estado precisa se manter ~0,9 s antes de trocar.
     Escolha manual no player vale até a próxima mudança de zona.
     ============================================================ */
  AC.songZones = function () {
    const zones = AC.$$('[data-song="pedido"]'); if (!zones.length || !('IntersectionObserver' in window)) return;
    // mede na hora (são poucos elementos): o cache do IntersectionObserver pode estar atrasado após um salto de rolagem
    const stateNow = () => {
      if (AC.$('#proposal-modal.is-on')) return 'pedido';
      let cover = 0;
      zones.forEach((z) => { const r = z.getBoundingClientRect(); cover += Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)); });
      return cover / innerHeight >= 0.38 ? 'pedido' : 'principal';
    };
    let timer = 0, pending = null, lastState = null, lock = null, lastSwitch = 0;
    const DWELL = 1100, COOLDOWN = 7000; // precisa ficar ~1 s na zona; e depois de trocar, espera 7 s antes de poder trocar de novo (sem vai-e-vem)
    const cancel = () => { clearTimeout(timer); timer = 0; pending = null; };
    const evaluate = () => {
      const want = stateNow();
      if (lock !== null) { if (want === lock) return; lock = null; } // a escolha manual vale até a próxima mudança real de zona
      if (want === lastState) { cancel(); return; }
      if (pending === want) return; // já tem um cronômetro para esse destino: não reinicia (reavaliações frequentes não podem atrasar a troca)
      cancel(); pending = want;
      const wait = Math.max(DWELL, lastSwitch + COOLDOWN - performance.now());
      timer = setTimeout(() => {
        pending = null;
        if (lock !== null || stateNow() !== want) { evaluate(); return; } // mudou no meio do caminho: reavalia
        lastState = want;
        if (AC.cinema && AC.cinema.isOpen) return;
        if (want !== AC.audio.track) lastSwitch = performance.now(); // a espera só vale quando a faixa MUDA de verdade (o estado inicial não conta)
        AC.audio.setZone(want);
      }, wait);
    };
    const io = new IntersectionObserver(evaluate, { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1] });
    zones.forEach((z) => io.observe(z));
    AC.on('music:track', (d) => { if (d.manual) { cancel(); lock = stateNow(); lastState = d.track; lastSwitch = performance.now(); } });
    AC.on('zone:recheck', () => { lastState = null; lastSwitch = 0; evaluate(); });
    addEventListener('scroll', AC.debounce(evaluate, 250), { passive: true }); // garante reavaliar quando a rolagem para (o observer sozinho pode perder um salto)
  };
})();
