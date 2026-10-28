// FINAL — partículas que viajam: galáxia → "JG ♥ MC" → coração, guiadas pela rolagem
// (o palco fica "grudado" na tela enquanto a seção passa).
import * as THREE from 'three';
import { makeRenderer, projScale, whenVisible, POINT_FRAG, lerp, clamp } from './shared.js';

const AC = window.AC;

const VERT = /* glsl */`
  attribute vec3 aB; attribute vec3 aC; attribute float aRand; attribute vec3 aColor;
  uniform float uMorph, uTime, uSize, uScale, uBeat;
  varying vec3 vColor; varying float vAlpha;
  void main() {
    float m1 = smoothstep(0.0, 1.0, clamp(uMorph, 0.0, 1.0));
    float m2 = smoothstep(0.0, 1.0, clamp(uMorph - 1.0, 0.0, 1.0));
    // galáxia gira enquanto ainda é galáxia
    vec3 a = position; float ang = uTime * 0.18 * (1.2 - m1);
    a.xz = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * a.xz;
    vec3 p = mix(mix(a, aB, m1), aC, m2);
    // turbulência durante as transições
    float tr = sin(fract(uMorph) * 3.14159) * (1.0 - step(1.999, uMorph));
    p += vec3(sin(uTime * 1.3 + aRand * 31.0), cos(uTime * 1.1 + aRand * 17.0), sin(uTime * 0.9 + aRand * 11.0)) * (0.018 + tr * 0.45);
    p *= 1.0 + uBeat * m2 * 0.06;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.6 + aRand) * uScale / -mv.z;
    vColor = mix(aColor, vec3(1.0, 0.35, 0.58), m2 * 0.55);
    vAlpha = 0.6 + 0.4 * sin(uTime * 2.0 + aRand * 50.0);
  }`;

// amostra pontos de um texto desenhado num canvas (uma linha no desktop, empilhado no celular em pé)
function textPoints(lines, n, maxW, maxH) {
  const LH = 250, W = 1200, H = LH * lines.length + 80, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '500 230px "Cormorant Garamond", Georgia, serif';
  lines.forEach((l, i) => g.fillText(l, W / 2, 40 + LH * i + LH / 2));
  const d = g.getImageData(0, 0, W, H).data, cand = []; let x0 = W, x1 = 0, y0 = H, y1 = 0;
  for (let y = 0; y < H; y += 3) for (let x = 0; x < W; x += 3) if (d[(y * W + x) * 4 + 3] > 140) { cand.push([x, y]); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const bw = Math.max(1, x1 - x0), bh = Math.max(1, y1 - y0), scale = Math.min(maxW / bw, maxH / bh), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const [x, y] = cand[(Math.random() * cand.length) | 0] || [cx, cy]; out[i * 3] = (x - cx) * scale + (Math.random() - 0.5) * 0.02; out[i * 3 + 1] = -(y - cy) * scale + (Math.random() - 0.5) * 0.02; out[i * 3 + 2] = (Math.random() - 0.5) * 0.12; }
  return out;
}
// coração cheio (curva clássica), com volume
function heartPoints(n, size) {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const t = Math.random() * Math.PI * 2, k = Math.sqrt(Math.random());
    const x = 16 * Math.sin(t) ** 3, y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    out[i * 3] = (x * k * size) / 17; out[i * 3 + 1] = (y * k * size) / 17 + size * 0.1; out[i * 3 + 2] = (Math.random() - 0.5) * size * 0.5 * (1 - k * 0.6);
  }
  return out;
}

export function mountFinale(host, Q) {
  const sticky = host.querySelector('.finale3d__sticky'), canvas = host.querySelector('canvas'), lines = [...host.querySelectorAll('.finale3d__line')];
  const renderer = makeRenderer(canvas, { dpr: Q.dpr });
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100); camera.position.set(0, 0, 10);
  const N = Q.finale, rnd = new Float32Array(N), col = new Float32Array(N * 3), gal = new Float32Array(N * 3);
  const c1 = new THREE.Color('#e8c987'), c2 = new THREE.Color('#ff5a9d'), c3 = new THREE.Color('#9fd8ff'), c = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const r = Math.pow(Math.random(), 1.4) * 4.6, arm = (i % 2) * Math.PI, a = arm + r * 1.1 + (Math.random() - 0.5) * 0.5;
    gal[i * 3] = Math.cos(a) * r; gal[i * 3 + 1] = (Math.random() - 0.5) * 0.35; gal[i * 3 + 2] = Math.sin(a) * r;
    rnd[i] = Math.random(); c.copy(c1).lerp(i % 3 ? c2 : c3, Math.random() * 0.8); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(gal, 3)); geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3)); geo.setAttribute('aRand', new THREE.BufferAttribute(rnd, 1));
  const uniforms = { uMorph: { value: 0 }, uTime: { value: 0 }, uSize: { value: Q.mobile ? 0.052 : 0.05 }, uScale: { value: 1 }, uBeat: { value: 0 } };
  const pts = new THREE.Points(geo, new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: POINT_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  pts.rotation.x = 0.35; scene.add(pts);

  // alvos dependem da largura visível (texto precisa caber no celular em pé)
  function targets() {
    const vh = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z, vw = vh * camera.aspect;
    const portrait = camera.aspect < 0.9;
    geo.setAttribute('aB', new THREE.BufferAttribute(textPoints(portrait ? ['JG', '♥', 'MC'] : ['JG ♥ MC'], N, Math.min(vw * 0.86, 11), vh * (portrait ? 0.62 : 0.4)), 3));
    geo.setAttribute('aC', new THREE.BufferAttribute(heartPoints(N, Math.min(vh * 0.36, vw * 0.4, 3.4)), 3));
  }
  function resize() {
    const w = sticky.clientWidth || innerWidth, h = sticky.clientHeight || innerHeight; // nunca sai sem alvos (aB/aC)
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    uniforms.uScale.value = projScale(h, camera.fov) * renderer.getPixelRatio();
    targets();
  }
  new ResizeObserver(AC.debounce(resize, 120)).observe(sticky);
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(resize);
  resize();

  // progresso da rolagem dentro do palco → morph 0..2
  let morph = 0, morphT = 0, time = 0;
  const progress = () => { const r = host.getBoundingClientRect(); const span = r.height - innerHeight; return span > 0 ? clamp(-r.top / span, 0, 1) : 1; };
  // patamares: cada forma fica parada um trecho da rolagem para dar tempo de ver
  const stage = (p) => p < 0.12 ? 0 : p < 0.32 ? (p - 0.12) / 0.2 : p < 0.58 ? 1 : p < 0.78 ? 1 + (p - 0.58) / 0.2 : 2;
  const paintLines = (p) => lines.forEach((l) => { const at = +l.dataset.at; const on = at === 0 ? p < 0.24 : at === 1 ? p >= 0.24 && p < 0.7 : p >= 0.7; l.classList.toggle('is-on', on); });

  function frame(t, dt) {
    const reduced = AC.reduced(), p = progress();
    morphT = reduced ? 2 : stage(p);
    morph = reduced ? 2 : lerp(morph, morphT, 0.08);
    time += reduced ? 0 : dt / 1000;
    uniforms.uMorph.value = morph; uniforms.uTime.value = time;
    uniforms.uBeat.value = reduced ? 0 : Math.max(0, Math.sin(time * 5.2)) ** 8;
    pts.rotation.x = lerp(0.35, 0, Math.min(1, morph)); pts.rotation.y = morph < 1 ? 0 : Math.sin(time * 0.4) * 0.25 * (morph - 1);
    paintLines(p);
    renderer.render(scene, camera);
  }

  host.classList.add('is-3d');
  let running = false;
  const vis = whenVisible(host, (on) => {
    if (AC.reduced()) { if (on) frame(0, 16); return; }
    if (on && !running) { running = true; AC.raf.add(frame); } else if (!on && running) { running = false; AC.raf.remove(frame); }
  }, '200px');
  return { stop() { vis.stop(); AC.raf.remove(frame); renderer.dispose(); } };
}
