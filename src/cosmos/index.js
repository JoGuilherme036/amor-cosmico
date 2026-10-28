// COSMOS — ponto de entrada das cenas 3D (Three.js).
// Empacotado por scripts/build-cosmos.mjs em js/vendor/cosmos.js (IIFE, funciona por duplo clique).
// main.js só carrega este arquivo depois da 1ª pintura, se houver WebGL.
import { quality } from './shared.js';
import { createGalaxy } from './galaxy.js';
import { mountRings } from './rings.js';
import { mountFinale } from './finale.js';
import { createMemories } from './memories.js';

const AC = window.AC;
const warn = (what, e) => console.warn(`[cosmos] ${what} indisponível — seguindo sem ele.`, e);

function init() {
  if (!AC || AC.cosmos) return;
  const Q = quality();
  const api = { ready: false, quality: Q, galaxy: null, openMemories: null };
  AC.cosmos = api;

  // 1) galáxia de fundo (no lugar do céu 2D) — só em telas grandes com mouse.
  //    No celular/tablet o céu fica o 2D leve (poucas estrelas): a galáxia pesava e dava travadas.
  const star = document.getElementById('starfield');
  if (!Q.mobile) try {
    const cv = document.createElement('canvas'); cv.id = 'cosmos-bg'; cv.setAttribute('aria-hidden', 'true');
    star.after(cv);
    const g = createGalaxy(cv, Q); api.galaxy = g;
    const on3d = () => { g.start(); cv.classList.add('is-on'); setTimeout(() => { if (cv.classList.contains('is-on')) { AC.sky.stop(); star.style.display = 'none'; } }, 1200); };
    const off3d = () => { g.stop(); cv.classList.remove('is-on'); star.style.display = ''; AC.sky.start(); };
    const setSky = AC.setSky; AC.setSky = (name) => { setSky(name); g.theme(name); };
    const warp = AC.sky.warp; AC.sky.warp = (on) => { warp(on); g.warp(on); };
    AC.on('prefs', () => (AC.reduced() ? off3d() : on3d()));
    if (AC.reduced()) g.renderOnce(); else on3d();
  } catch (e) { warn('galáxia', e); }

  // 2) e 3) alianças e partículas do final: só montam quando chegam perto da tela (economiza CPU/bateria no início)
  const lazy = (el, mount, what) => {
    const io = new IntersectionObserver(([e]) => { if (!e.isIntersecting) return; io.disconnect(); try { mount(el, Q); } catch (err) { warn(what, err); } }, { rootMargin: '900px 0px' });
    io.observe(el);
  };
  document.querySelectorAll('[data-rings]').forEach((st) => lazy(st, mountRings, 'alianças'));
  const fin = document.getElementById('finale3d');
  if (fin) lazy(fin, mountFinale, 'final');

  // 4) Galáxia de Memórias (só http/https — veja memories.js)
  if (!AC.isFile && AC.starwall) {
    try {
      const mem = createMemories(Q); api.openMemories = mem.open;
      const flat = AC.starwall.open;
      AC.starwall.open = (items) => { try { mem.open(items); } catch (e) { warn('galáxia de memórias', e); flat(items); } };
    } catch (e) { warn('galáxia de memórias', e); }
  }

  api.ready = true;
  document.documentElement.dataset.cosmos = 'on';
  AC.emit('cosmos:ready');
}

init();
