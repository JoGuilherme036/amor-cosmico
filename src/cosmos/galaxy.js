// GALÁXIA DE FUNDO — espiral de partículas com rotação diferencial, nebulosas,
// cor que segue o tema da seção e câmera que viaja com a rolagem.
import * as THREE from 'three';
import { makeRenderer, projScale, glowTexture, POINT_FRAG, lerp, clamp } from './shared.js';

const AC = window.AC;

// cor do céu por tema (mesmos nomes de data-sky)
const THEMES = {
  default: [0.66, 0.56, 1.0], origem: [0.48, 0.62, 1.0], namoro: [1.0, 0.56, 0.82],
  jeri: [1.0, 0.68, 0.38], pedido: [1.0, 0.84, 0.52], infinito: [0.38, 0.66, 1.0]
};

const VERT = /* glsl */`
  attribute float aScale; attribute float aRand; attribute vec3 aColor;
  uniform float uTime, uSize, uScale, uSpin, uWarp, uMax; uniform vec3 uTint;
  varying vec3 vColor; varying float vAlpha;
  void main() {
    vec4 mp = modelMatrix * vec4(position, 1.0);
    float d = length(mp.xz);
    float ang = atan(mp.x, mp.z) + uSpin * uTime * (0.9 / (d + 0.8));   // centro gira mais rápido
    mp.x = sin(ang) * d; mp.z = cos(ang) * d;
    vec4 mv = viewMatrix * mp;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = min(uSize * aScale * uScale * (1.0 + uWarp * 1.6) / -mv.z, uMax); // nunca vira "bola" atrás do texto
    vColor = mix(aColor, uTint, 0.3) * (0.78 + uWarp * 0.6);
    vAlpha = 0.42 + 0.38 * sin(uTime * (0.8 + aRand * 2.4) + aRand * 40.0); // discreto: o céu não pode brigar com o texto
  }`;

export function createGalaxy(canvas, Q) {
  const renderer = makeRenderer(canvas, { dpr: Q.dpr });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 400);
  camera.position.set(0, 4, 11);

  const uniforms = {
    uTime: { value: 0 }, uSize: { value: Q.mobile ? 0.078 : 0.066 }, uScale: { value: 1 }, uSpin: { value: 1 },
    uWarp: { value: 0 }, uMax: { value: 14 }, uTint: { value: new THREE.Vector3(...THEMES.default) }
  };
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: POINT_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });

  // --- espiral ---
  const N = Q.galaxy, R = 10, ARMS = 4, SPIN = 1.15, RAND = 0.34, POW = 2.6;
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), sc = new Float32Array(N), rnd = new Float32Array(N);
  const inside = new THREE.Color('#ffe0ad'), outs = [new THREE.Color('#5d6bff'), new THREE.Color('#b26bff'), new THREE.Color('#ff6fae'), new THREE.Color('#5fd0ff')];
  const c = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const r = Math.pow(Math.random(), 1.5) * R, arm = ((i % ARMS) / ARMS) * Math.PI * 2, a = arm + r * SPIN * 0.35;
    const off = () => Math.pow(Math.random(), POW) * (Math.random() < 0.5 ? 1 : -1) * RAND * (r + 0.6);
    pos[i * 3] = Math.cos(a) * r + off(); pos[i * 3 + 1] = off() * 0.42; pos[i * 3 + 2] = Math.sin(a) * r + off();
    c.copy(inside).lerp(outs[i % outs.length], Math.min(1, r / R * 1.25));
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    sc[i] = (Math.random() < 0.04 ? 2.6 : 0.6 + Math.random()) * (1.25 - (r / R) * 0.5); rnd[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aScale', new THREE.BufferAttribute(sc, 1)); geo.setAttribute('aRand', new THREE.BufferAttribute(rnd, 1));
  const galaxy = new THREE.Points(geo, mat); galaxy.rotation.x = 0.12; scene.add(galaxy);

  // --- esfera de estrelas distantes (não gira com a espiral) ---
  const M = Q.mobile ? 900 : 1800, sp = new Float32Array(M * 3), scol = new Float32Array(M * 3), ssc = new Float32Array(M), srnd = new Float32Array(M);
  for (let i = 0; i < M; i++) {
    const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, rr = 45 + Math.random() * 60, s = Math.sqrt(1 - u * u);
    sp[i * 3] = Math.cos(th) * s * rr; sp[i * 3 + 1] = u * rr; sp[i * 3 + 2] = Math.sin(th) * s * rr;
    scol[i * 3] = scol[i * 3 + 1] = scol[i * 3 + 2] = 0.9; ssc[i] = 3 + Math.random() * 6; srnd[i] = Math.random();
  }
  const sgeo = new THREE.BufferGeometry();
  sgeo.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sgeo.setAttribute('aColor', new THREE.BufferAttribute(scol, 3));
  sgeo.setAttribute('aScale', new THREE.BufferAttribute(ssc, 1)); sgeo.setAttribute('aRand', new THREE.BufferAttribute(srnd, 1));
  const smat = mat.clone(); smat.uniforms = Object.assign({}, uniforms, { uSpin: { value: 0 } });
  scene.add(new THREE.Points(sgeo, smat));

  // --- nebulosas (sprites suaves) ---
  const nebulas = [['rgba(122,40,203,1)', [-6, 1, -8], 22], ['rgba(0,160,255,1)', [8, -2, -10], 20], ['rgba(255,90,157,1)', [2, 3, -14], 26], ['rgba(255,214,150,1)', [0, 0, 0], 9]].map(([color, p, s], i) => {
    const sm = new THREE.SpriteMaterial({ map: glowTexture(color), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: i === 3 ? 0.32 : 0.22 });
    const sp2 = new THREE.Sprite(sm); sp2.position.set(...p); sp2.scale.set(s, s, 1); scene.add(sp2); return sp2;
  });

  // --- câmera: rolagem + dedo/mouse ---
  let scrollP = 0, px = 0, py = 0, tx = 0, ty = 0, warp = 0, warpT = 0, time = 0;
  const target = new THREE.Vector3(), tint = new THREE.Vector3(...THEMES.default);
  const onScroll = () => { const max = document.documentElement.scrollHeight - innerHeight; scrollP = max > 0 ? clamp(scrollY / max, 0, 1) : 0; };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  addEventListener('pointermove', (e) => { tx = (e.clientX / innerWidth - 0.5) * 2; ty = (e.clientY / innerHeight - 0.5) * 2; }, { passive: true });
  addEventListener('deviceorientation', (e) => { if (e.gamma == null) return; tx = clamp(e.gamma / 30, -1, 1); ty = clamp((e.beta - 45) / 30, -1, 1); }, { passive: true });

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    uniforms.uScale.value = projScale(h, camera.fov) * renderer.getPixelRatio();
    uniforms.uMax.value = 9 * renderer.getPixelRatio();
  }
  addEventListener('resize', resize); resize();

  let skip = 0;
  function frame(t, dt) {
    if (Q.weak && (skip ^= 1)) return;
    const reduced = AC.reduced();
    warp = lerp(warp, warpT, 0.06);
    time += (dt / 1000) * (reduced ? 0 : 1 + warp * 7);
    uniforms.uTime.value = time; uniforms.uWarp.value = warp;
    uniforms.uTint.value.lerp(tint, 0.03);
    // trajetória: começa vendo a galáxia de cima, mergulha perto do núcleo no meio da página e se afasta no final
    const s = Math.sin(scrollP * Math.PI);
    const ang = 0.35 + scrollP * Math.PI * 1.35;
    const dist = lerp(11.5, 7.4, s) - warp * 2.2 + (scrollP > 0.88 ? (scrollP - 0.88) * 40 : 0);
    const hgt = lerp(4.6, 2.4, s) + (scrollP > 0.88 ? (scrollP - 0.88) * 22 : 0);
    px = lerp(px, tx, 0.04); py = lerp(py, ty, 0.04);
    target.set(Math.sin(ang) * dist + px * 0.9, hgt - py * 0.6, Math.cos(ang) * dist);
    camera.position.lerp(target, reduced ? 1 : 0.05);
    camera.lookAt(0, 0, 0);
    nebulas[3].material.opacity = 0.26 + 0.08 * Math.sin(time * 0.7);
    renderer.render(scene, camera);
  }

  let running = false;
  const api = {
    canvas,
    start() { if (!running) { running = true; AC.raf.add(frame); } },
    stop() { running = false; AC.raf.remove(frame); },
    theme(name) { const v = THEMES[name] || THEMES.default; tint.set(v[0], v[1], v[2]); },
    warp(on) { warpT = on ? 1 : 0; },
    renderOnce() { frame(performance.now(), 16); }
  };
  return api;
}
