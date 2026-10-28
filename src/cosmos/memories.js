// GALÁXIA DE MEMÓRIAS — cada foto/vídeo vira uma estrela redonda numa esfera.
// Arrastar gira (com inércia), pinça/roda aproxima, tocar abre o lightbox.
// Só em http(s): por duplo clique (file://) o navegador bloqueia texturas de arquivos locais,
// então lá continua a Parede de Estrelas 2D.
import * as THREE from 'three';
import { makeRenderer, circleAlpha, ringTexture, glowTexture, clamp, lerp } from './shared.js';

const AC = window.AC;

export function createMemories(Q) {
  let root = null, state = null;

  function close() {
    if (!root) return;
    const s = state; root.classList.remove('is-on'); document.body.classList.remove('is-locked');
    AC.raf.remove(s.frame); removeEventListener('keydown', s.onKey); removeEventListener('resize', s.resize);
    setTimeout(() => { s.textures.forEach((t) => t.dispose()); s.renderer.dispose(); root.remove(); root = null; }, 450);
    if (s.lastFocus && s.lastFocus.focus) s.lastFocus.focus({ preventScroll: true });
  }

  function open(items) {
    if (root) close();
    const list = (items && items.length ? items : AC.MEDIA).filter((m) => !m.mine).slice(0, 240);
    root = AC.html(`<div class="mg" role="dialog" aria-modal="true" aria-label="Galáxia de Memórias">
      <canvas class="mg__canvas"></canvas>
      <div class="mg__top"><div><span class="eyebrow eyebrow--plain">Galáxia de Memórias</span><p class="mg__hint">Arraste para girar • pinça para aproximar • toque numa estrela</p></div>
        <button type="button" class="btn btn--icon btn--ghost" data-mg="close" aria-label="Fechar">${AC.icon('i-close')}</button></div>
      <div class="mg__cap" aria-live="polite"></div>
    </div>`);
    document.body.appendChild(root); document.body.classList.add('is-locked');
    const canvas = root.querySelector('canvas'), cap = root.querySelector('.mg__cap');
    const renderer = makeRenderer(canvas, { antialias: true, dpr: Q.dpr });
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 200);
    camera.position.set(0, 0, Q.mobile ? 15 : 12.5);

    const group = new THREE.Group(); scene.add(group);
    const alpha = circleAlpha(), ring = ringTexture(), loader = new THREE.TextureLoader(), textures = [alpha, ring];
    const ringMat = new THREE.SpriteMaterial({ map: ring, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.8 });
    const sprites = [], n = list.length, R = Q.mobile ? 6.2 : 6.8, golden = Math.PI * (3 - Math.sqrt(5));
    list.forEach((m, i) => {
      const y = 1 - (i / Math.max(1, n - 1)) * 2, r = Math.sqrt(1 - y * y), th = golden * i;
      const tex = loader.load(AC.tileSrc(m)); tex.colorSpace = THREE.SRGBColorSpace; textures.push(tex);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, alphaMap: alpha, transparent: true, depthWrite: false }));
      const size = 0.95 + (m.favorite ? 0.35 : 0);
      sp.position.set(Math.cos(th) * r * R, y * R, Math.sin(th) * r * R); sp.scale.set(size, size, 1);
      sp.userData = { i, base: size };
      const halo = new THREE.Sprite(ringMat); halo.scale.set(1.12, 1.12, 1); sp.add(halo);
      group.add(sp); sprites.push(sp);
    });
    // núcleo brilhante + poeira de estrelas
    const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,214,150,1)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.5 }));
    core.scale.set(7, 7, 1); group.add(core);
    const D = 1400, dp = new Float32Array(D * 3);
    for (let i = 0; i < D; i++) { const u = Math.random() * 2 - 1, t = Math.random() * 6.283, rr = 14 + Math.random() * 40, s = Math.sqrt(1 - u * u); dp[i * 3] = Math.cos(t) * s * rr; dp[i * 3 + 1] = u * rr; dp[i * 3 + 2] = Math.sin(t) * s * rr; }
    const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
    scene.add(new THREE.Points(dg, new THREE.PointsMaterial({ size: 0.12, color: 0xdfe6ff, transparent: true, opacity: 0.8, depthWrite: false })));

    // --- controles ---
    let rx = 0.2, ry = 0, vx = 0, vy = 0.0025, dist = camera.position.z, distT = dist, hover = null, idle = 0;
    const ptrs = new Map(); let pinch0 = 0, dist0 = dist, moved = 0, last = null;
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    const pick = (x, y) => { ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera); const h = ray.intersectObjects(sprites, false); return h.length ? h[0].object : null; };
    canvas.addEventListener('pointerdown', (e) => { canvas.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved = 0; last = { x: e.clientX, y: e.clientY }; if (ptrs.size === 2) { const p = [...ptrs.values()]; pinch0 = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y); dist0 = distT; } idle = 0; });
    canvas.addEventListener('pointermove', (e) => {
      if (!ptrs.has(e.pointerId)) { if (e.pointerType === 'mouse') { const h = pick(e.clientX, e.clientY); if (h !== hover) { hover = h; canvas.style.cursor = h ? 'pointer' : 'grab'; cap.textContent = h ? list[h.userData.i].caption : ''; } } return; }
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 2) { const p = [...ptrs.values()]; distT = clamp(dist0 * pinch0 / Math.max(20, Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y)), 5, 24); moved += 10; return; }
      const dx = e.clientX - last.x, dy = e.clientY - last.y; last = { x: e.clientX, y: e.clientY }; moved += Math.abs(dx) + Math.abs(dy);
      vy = dx * 0.0042; vx = dy * 0.0032;
    });
    const up = (e) => {
      const had = ptrs.delete(e.pointerId);
      if (had && moved < 8 && !ptrs.size) { const h = pick(e.clientX, e.clientY); if (h) { AC.sfx('soft'); AC.lightbox.open(list, h.userData.i); } }
    };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', (e) => { e.preventDefault(); distT = clamp(distT * (e.deltaY > 0 ? 1.1 : 0.9), 5, 24); }, { passive: false });
    root.querySelector('[data-mg=close]').addEventListener('click', close);
    const onKey = (e) => { if (e.key === 'Escape' && !AC.lightbox.isOpen) close(); };
    addEventListener('keydown', onKey);
    const resize = () => { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); };
    addEventListener('resize', resize); resize();

    let time = 0;
    const frame = (t, dt) => {
      if (AC.lightbox.isOpen) return; // não gasta bateria por trás do lightbox
      time += dt / 1000; idle += dt;
      ry += vy; rx = clamp(rx + vx, -1.1, 1.1);
      vy *= ptrs.size ? 0.7 : 0.96; vx *= 0.9;
      if (idle > 2500 && !AC.reduced()) vy = lerp(vy, 0.0018, 0.02); // gira sozinha quando ninguém mexe
      group.rotation.set(rx, ry, 0);
      dist = lerp(dist, distT, 0.12); camera.position.z = dist;
      sprites.forEach((s) => { const k = s === hover ? 1.35 : 1; const b = s.userData.base * k; s.scale.x = lerp(s.scale.x, b, 0.2); s.scale.y = s.scale.x; });
      core.material.opacity = 0.4 + 0.12 * Math.sin(time * 1.3);
      renderer.render(scene, camera);
    };
    AC.raf.add(frame);
    state = { renderer, textures, frame, onKey, resize, lastFocus: document.activeElement };
    requestAnimationFrame(() => root && root.classList.add('is-on'));
    setTimeout(() => { const b = root && root.querySelector('[data-mg=close]'); if (b) b.focus({ preventScroll: true }); }, 60);
  }

  return { open, close };
}
