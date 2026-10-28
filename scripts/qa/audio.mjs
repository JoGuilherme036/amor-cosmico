// Teste da troca de música — node qa/audio.mjs [normal|ios] [http|remote]
// "ios" simula o iPhone: element.volume é ignorado (sempre 1) → sem crossfade, só corte limpo.
// A senha vem de AC_SENHA. Regra testada em TODOS os cenários: no fim, exatamente 1 faixa tocando e é a certa.
import puppeteer from 'puppeteer-core'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const kind = process.argv[2] || 'normal', mode = process.argv[3] || 'http', SENHA = process.env.AC_SENHA || '';
if (!SENHA) { console.log('Defina AC_SENHA.'); process.exit(1); }
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.avif': 'image/avif', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.enc': 'application/octet-stream', '.woff2': 'font/woff2' };
const srv = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]); const f = path.join(ROOT, p === '/' ? 'index.html' : p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  const st = fs.statSync(f), ext = path.extname(f), range = req.headers.range;
  if (range) { const [a, b] = range.replace('bytes=', '').split('-'); const s = +a, e = b ? +b : st.size - 1; res.writeHead(206, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Content-Range': `bytes ${s}-${e}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': e - s + 1 }); fs.createReadStream(f, { start: s, end: e }).pipe(res); }
  else { res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Content-Length': st.size, 'Accept-Ranges': 'bytes' }); fs.createReadStream(f).pipe(res); }
}).listen(0);
const url = mode === 'remote' ? process.env.AC_URL : `http://localhost:${srv.address().port}/index.html`;
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
if (kind === 'ios') await p.evaluateOnNewDocument(() => { Object.defineProperty(HTMLMediaElement.prototype, 'volume', { get() { return 1; }, set() {} }); });
const errs = []; p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message)); p.on('console', (m) => { if (m.type() === 'error' && !/favicon|ERR_ABORTED/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
const log = []; const ok = (n, v) => log.push((v ? 'OK   ' : 'FALHA') + ' ' + n);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const ev = (f, ...a) => p.evaluate(f, ...a);
const state = () => ev(() => ({ track: AC.audio.track, playing: AC.audio.state.playing, live: Object.values(AC.audio.tracks).filter((t) => !t.el.paused).map((t) => t.name), vols: Object.values(AC.audio.tracks).map((t) => t.name + ':' + t.el.volume.toFixed(2)) }));
// espera (até 14 s) o estado desejado e confere que ele PERMANECE por mais 1,2 s (sem pisca-pisca)
const settled = async (name, want) => {
  let s = null, good = false; const t0 = Date.now();
  while (Date.now() - t0 < 14000) { s = await state(); good = s.live.length === 1 && s.live[0] === want && s.track === want && s.playing; if (good) break; await sleep(300); }
  if (good) { await sleep(1200); s = await state(); good = s.live.length === 1 && s.live[0] === want && s.track === want; }
  ok(`${name} → só "${want}" tocando`, good); if (!good) console.log('   DEBUG', JSON.stringify(s));
};
const goto = (sel, block = 'start') => ev((s, bl) => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector(s).scrollIntoView({ block: bl }); }, sel, block);

await p.goto(url, { waitUntil: 'networkidle2' }); await sleep(1200);
await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
await p.type('#gate-code', SENHA); await p.tap('#gate-open'); await sleep(4500);
ok('entrou e a música principal toca', await ev(() => AC.audio.state.playing && AC.audio.track === 'principal'));
await settled('início', 'principal');

// 1) rolar até o pedido
await goto('[data-rings]', 'center'); await settled('capítulo do pedido (alianças)', 'pedido');
// 2) rolagem rápida de ida e volta (vai-e-vem) — não pode deixar as duas tocando nem ficar na faixa errada
for (let i = 0; i < 6; i++) { await goto('#galeria'); await sleep(250); await goto('[data-rings]', 'center'); await sleep(250); }
await goto('#galeria'); await settled('vai-e-vem rápido, parando na galeria', 'principal');
// 3) escolha manual no player
await goto('#musica'); await sleep(1500);
await ev(() => document.querySelector('.track[data-track=pedido]').click()); await settled('escolha manual "Chuva de Arroz"', 'pedido');
await ev(() => document.querySelector('.track[data-track=principal]').click()); await settled('escolha manual "Dia, Lugar e Hora"', 'principal');
// 4) pausar / tocar pelo mini player
await ev(() => document.querySelector('#mini-play').click()); await sleep(1200);
await sleep(1200); const paused = await state(); ok('mini player pausa tudo', !paused.playing && paused.live.length === 0);
await ev(() => document.querySelector('#mini-play').click()); await settled('mini player volta a tocar', 'principal');
// 5) pausado, rolar até o pedido: a faixa "da vez" muda mas NÃO começa a tocar sozinha
await ev(() => document.querySelector('#mini-play').click()); await sleep(900);
await goto('[data-rings]', 'center'); await sleep(9000); // dá tempo da zona decidir (1 s) + atraso da renderização 3D por software
const s5 = await state(); ok('pausado: nada toca ao entrar no pedido', !s5.playing && s5.live.length === 0);
ok('pausado: a faixa da vez virou "pedido"', s5.track === 'pedido');
await ev(() => document.querySelector('#mini-play').click()); await settled('tocar depois: começa em "Chuva de Arroz"', 'pedido');
// 6) modal "Relembrar o nosso sim"
await goto('#encerramento'); await sleep(500);
await ev(() => document.querySelector('#btn-proposal').click()); await settled('modal do sim', 'pedido');
await ev(() => document.querySelector('[data-close-modal]').click());
// 7) filme
await ev(() => document.querySelector('#btn-cinema-top').click()); await sleep(2500);
const c = await state(); ok('filme: 1 faixa só tocando', c.live.length === 1);
await p.keyboard.press('Escape'); await sleep(800);

console.log(`== troca de música (${kind}, ${mode})`); console.log(log.join('\n')); console.log('ERROS:', errs.length ? '\n' + [...new Set(errs)].join('\n') : 'nenhum');
await b.close(); srv.close();
