// ALIANÇAS 3D — duas alianças de ouro entrelaçadas (uma com diamante),
// reflexos de estúdio (RoomEnvironment), brilhos e corações subindo.
// Arrastar gira; tocar dá um giro + chuva de brilho.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { makeRenderer, whenVisible, heartTexture, glowTexture, lerp, clamp } from './shared.js';

const AC = window.AC;

// aliança "conforto": seção elíptica girada em torno do eixo Y
function bandGeometry(radius, thick, width) {
  const pts = [];
  for (let i = 0; i <= 48; i++) { const a = (i / 48) * Math.PI * 2; pts.push(new THREE.Vector2(radius + thick / 2 + Math.cos(a) * thick / 2, Math.sin(a) * width / 2)); }
  const g = new THREE.LatheGeometry(pts, 160); g.computeVertexNormals(); return g;
}
// diamante lapidado (coroa + pavilhão), facetado
function diamondGeometry(s) {
  const pts = [[0.001, -0.62], [0.5, -0.04], [0.52, 0], [0.5, 0.05], [0.33, 0.22], [0.001, 0.22]].map(([x, y]) => new THREE.Vector2(x * s, y * s));
  return new THREE.LatheGeometry(pts, 16);
}

export function mountRings(stage, Q) {
  const canvas = stage.querySelector('.rings3d__canvas');
  const renderer = makeRenderer(canvas, { antialias: !Q.mobile, dpr: Math.min(window.devicePixelRatio || 1, Q.mobile ? 1.5 : 2) }); // celular: sem antialias e menos pixels (memória)
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60); camera.position.set(0, -0.45, 7.2); // câmera um pouco abaixo: as alianças sobem e não encostam na legenda
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const gold = new THREE.MeshPhysicalMaterial({ color: 0xffc766, metalness: 1, roughness: 0.17, clearcoat: 0.45, clearcoatRoughness: 0.12, envMapIntensity: 1.35 });
  const gold2 = gold.clone(); gold2.color = new THREE.Color(0xf6d692); gold2.roughness = 0.13;
  const stone = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0, ior: 2.42, iridescence: 1, iridescenceIOR: 1.7, clearcoat: 1, envMapIntensity: 4, flatShading: true });

  const rig = new THREE.Group(); scene.add(rig);
  // aliança dele (no plano XY)
  const A = new THREE.Mesh(bandGeometry(1.0, 0.17, 0.34), gold); A.rotation.x = Math.PI / 2; A.position.set(-0.36, -0.12, 0);
  // aliança dela (no plano YZ, deslocada — as duas ficam entrelaçadas) com diamante no topo
  const B = new THREE.Group(); B.position.set(0.36, 0.33, 0);
  const bRing = new THREE.Mesh(bandGeometry(0.86, 0.14, 0.26), gold2); bRing.rotation.z = Math.PI / 2; B.add(bRing);
  const setting = new THREE.Group(); setting.position.set(0, 0.86 + 0.14 + 0.06, 0); B.add(setting);
  const gem = new THREE.Mesh(diamondGeometry(0.42), stone); gem.position.y = 0.2; setting.add(gem);
  for (let k = 0; k < 4; k++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, 0.32, 8), gold2); const a = (k / 4) * Math.PI * 2 + Math.PI / 4; p.position.set(Math.cos(a) * 0.2, 0.16, Math.sin(a) * 0.2); p.rotation.z = Math.cos(a) * 0.35; p.rotation.x = -Math.sin(a) * 0.35; setting.add(p); }
  rig.add(A, B); rig.rotation.set(0.28, -0.5, 0.08);

  scene.add(new THREE.AmbientLight(0xffffff, 0.25));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(3, 4, 5); scene.add(key);
  const warm = new THREE.PointLight(0xffb36b, 18, 12); warm.position.set(-3, -1, 3); scene.add(warm);

  // brilhos ao redor do diamante
  const sparkMat = new THREE.SpriteMaterial({ map: glowTexture('rgba(255,250,235,1)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  const sparks = Array.from({ length: 7 }, () => { const s = new THREE.Sprite(sparkMat.clone()); s.userData.p = Math.random() * 6; setting.add(s); return s; });
  // corações subindo
  const hearts = new THREE.Group(); scene.add(hearts);
  const hmat = new THREE.SpriteMaterial({ map: heartTexture(), depthWrite: false, transparent: true });
  const H = Q.hearts, hs = [];
  const resetHeart = (h, first) => { h.position.set((Math.random() - 0.5) * 6, first ? (Math.random() - 0.5) * 5 : -2.8 - Math.random(), (Math.random() - 0.5) * 3 - 0.5); h.userData.v = 0.004 + Math.random() * 0.008; h.userData.w = Math.random() * 6; const s = 0.08 + Math.random() * 0.16; h.scale.set(s, s, 1); };
  for (let i = 0; i < H; i++) { const h = new THREE.Sprite(hmat.clone()); resetHeart(h, true); hearts.add(h); hs.push(h); }

  // interação: arrastar gira, tocar dá um giro e acende os brilhos
  let vy = 0, vx = 0, dragging = false, lx = 0, ly = 0, moved = 0, burst = 0;
  canvas.addEventListener('pointerdown', (e) => { dragging = true; moved = 0; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => { if (!dragging) return; const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY; moved += Math.abs(dx) + Math.abs(dy); vy = dx * 0.008; vx = dy * 0.005; if (AC.reduced()) draw(); });
  const up = (e) => {
    if (!dragging) return; dragging = false;
    if (moved < 8) { vy += 0.28; burst = 1; AC.sfx('sparkle'); if (navigator.vibrate) navigator.vibrate(18); const r = canvas.getBoundingClientRect(); AC.confetti(e.clientX || r.left + r.width / 2, e.clientY || r.top + r.height / 2, 14); }
  };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);

  function resize() {
    const r = stage.getBoundingClientRect(); if (!r.width) return;
    renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height;
    camera.position.z = r.width < 520 ? 8.6 : 7.2; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage); resize();

  let time = 0;
  function draw() { renderer.render(scene, camera); }
  function frame(t, dt) {
    const reduced = AC.reduced(); const k = dt / 16.7;
    time += dt / 1000;
    rig.rotation.y += (reduced ? 0 : 0.0045 * k) + vy; rig.rotation.x = clamp(rig.rotation.x + vx, -0.6, 0.9);
    vy *= dragging ? 0.6 : 0.95; vx *= 0.9;
    rig.position.y = reduced ? 0 : Math.sin(time * 0.9) * 0.06;
    burst = lerp(burst, 0, 0.02);
    sparks.forEach((s, i) => { const ph = time * 2.2 + s.userData.p; const a = Math.max(0, Math.sin(ph)) ** 6; const sc = (0.12 + a * 0.5) * (1 + burst * 2); s.scale.set(sc, sc, 1); s.material.opacity = Math.min(1, a + burst * 0.8); s.position.set(Math.cos(i * 2.1) * 0.24, 0.2 + Math.sin(i * 1.7) * 0.18, Math.sin(i * 2.1) * 0.24); });
    hs.forEach((h) => { h.position.y += h.userData.v * k * (1 + burst * 3); h.position.x += Math.sin(time + h.userData.w) * 0.002; h.material.opacity = clamp(1.4 - Math.abs(h.position.y) / 2.2, 0, 0.9); if (h.position.y > 2.8) resetHeart(h); });
    draw();
  }

  stage.classList.add('is-3d');
  let running = false;
  const vis = whenVisible(stage, (on) => {
    if (AC.reduced()) { if (on) { resize(); draw(); } return; }
    if (on && !running) { running = true; AC.raf.add(frame); } else if (!on && running) { running = false; AC.raf.remove(frame); }
  });
  return { stop() { vis.stop(); AC.raf.remove(frame); renderer.dispose(); } };
}
