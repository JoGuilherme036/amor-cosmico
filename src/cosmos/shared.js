// Utilitários comuns às cenas 3D.
import * as THREE from 'three';

const AC = window.AC;

// Qualidade adaptativa: celular/fraco desenha menos partículas e com menos pixels.
export function quality() {
  const mobile = matchMedia('(max-width: 820px)').matches || matchMedia('(pointer: coarse)').matches;
  const weak = AC.weak();
  const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75);
  return {
    mobile, weak, dpr,
    galaxy: weak ? 5000 : mobile ? 9000 : 18000,
    finale: weak ? 1800 : mobile ? 2800 : 9000,
    hearts: mobile ? 36 : 70
  };
}

// Renderer padrão (transparente, sRGB, tone mapping cinematográfico)
export function makeRenderer(canvas, { antialias = false, dpr = 1 } = {}) {
  const r = new THREE.WebGLRenderer({ canvas, antialias, alpha: true, powerPreference: 'high-performance', premultipliedAlpha: true });
  r.setPixelRatio(dpr);
  r.setClearColor(0x000000, 0);
  r.outputColorSpace = THREE.SRGBColorSpace;
  return r;
}

// Tamanho de projeção (px por unidade a distância 1) — usado para o tamanho dos pontos
export const projScale = (h, fov) => h / (2 * Math.tan((fov * Math.PI) / 360));

// Só anima quando o elemento está na tela (e a aba está visível)
export function whenVisible(el, onChange, margin = '120px') {
  let on = false;
  const io = new IntersectionObserver(([e]) => { on = e.isIntersecting; onChange(on); }, { rootMargin: margin });
  io.observe(el);
  return { get on() { return on; }, stop: () => io.disconnect() };
}

// Texturas desenhadas em canvas (sem baixar nada)
function canvasTex(size, draw) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export const glowTexture = (inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') => canvasTex(128, (g, s) => {
  const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, inner); gr.addColorStop(0.25, inner.replace(/[\d.]+\)$/, '0.55)')); gr.addColorStop(1, outer);
  g.fillStyle = gr; g.fillRect(0, 0, s, s);
});
export const heartTexture = () => canvasTex(128, (g, s) => {
  g.translate(s / 2, s / 2 + 6); g.scale(s / 40, s / 40);
  g.beginPath();
  for (let i = 0; i <= 64; i++) { const t = (i / 64) * Math.PI * 2; const x = 16 * Math.sin(t) ** 3, y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)); i ? g.lineTo(x, y) : g.moveTo(x, y); }
  const gr = g.createRadialGradient(-4, -6, 1, 0, 0, 18); gr.addColorStop(0, '#ffe3ef'); gr.addColorStop(0.5, '#ff5a9d'); gr.addColorStop(1, '#c2185b');
  g.fillStyle = gr; g.shadowColor = 'rgba(255,90,157,.9)'; g.shadowBlur = 6; g.fill();
});
export const circleAlpha = () => canvasTex(128, (g, s) => { g.fillStyle = '#000'; g.fillRect(0, 0, s, s); g.fillStyle = '#fff'; g.beginPath(); g.arc(s / 2, s / 2, s / 2 - 3, 0, Math.PI * 2); g.fill(); });
export const ringTexture = () => canvasTex(128, (g, s) => {
  g.strokeStyle = 'rgba(232,201,135,1)'; g.lineWidth = 6; g.shadowColor = 'rgba(232,201,135,1)'; g.shadowBlur = 10;
  g.beginPath(); g.arc(s / 2, s / 2, s / 2 - 10, 0, Math.PI * 2); g.stroke();
});

// Shader de pontos brilhantes (estrela suave, aditivo)
export const POINT_FRAG = /* glsl */`
  varying vec3 vColor; varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = pow(1.0 - smoothstep(0.0, 0.5, d), 2.4) * vAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor, a); // AdditiveBlending: cor * alfa somada ao fundo
  }`;

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
