// Regressão das funções da v1 — node qa/regression.mjs <pasta-de-prints> [LxA] [http|file]
// Entra sem o portão (?portao=0) para testar só as interações.
import puppeteer from 'puppeteer-core'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = process.argv[2]; const [W, H] = (process.argv[3] || '390x844').split('x').map(Number); const mode = process.argv[4] || 'http';
fs.mkdirSync(OUT, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.avif': 'image/avif', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2' };
const srv = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]); const f = path.join(ROOT, p === '/' ? 'index.html' : p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  const st = fs.statSync(f), ext = path.extname(f), range = req.headers.range;
  if (range) { const [a, b] = range.replace('bytes=', '').split('-'); const s = +a, e = b ? +b : st.size - 1; res.writeHead(206, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Content-Range': `bytes ${s}-${e}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': e - s + 1 }); fs.createReadStream(f, { start: s, end: e }).pipe(res); }
  else { res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Content-Length': st.size, 'Accept-Ranges': 'bytes' }); fs.createReadStream(f).pipe(res); }
}).listen(0);
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--allow-file-access-from-files', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: W, height: H, isMobile: W < 700, hasTouch: W < 700 });
const errs = []; p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message)); p.on('console', (m) => { if (m.type() === 'error' && !/audio-local|ERR_FILE_NOT_FOUND/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
const url = (mode === 'file' ? 'file:///' + ROOT.split(path.sep).join('/') + '/index.html' : `http://localhost:${srv.address().port}/index.html`) + '?portao=0';
await p.goto(url, { waitUntil: 'networkidle2' }); await new Promise((r) => setTimeout(r, 2000));
await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; }); // rolagem instantânea: o teste não pode "passar" por outras seções
const log = []; const ok = (n, v) => log.push((v ? 'OK   ' : 'FALHA') + ' ' + n);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const ev = (f, ...a) => p.evaluate(f, ...a);
const shot = (n) => p.screenshot({ path: path.join(OUT, `r-${W}-${n}.png`) });

await ev(() => document.querySelector('#galeria').scrollIntoView()); await sleep(1200); await shot('galeria');
await ev(() => document.querySelector('#masonry .tile').click()); await sleep(900);
ok('lightbox abre', await ev(() => document.querySelector('.lb').classList.contains('is-on')));
await p.keyboard.press('ArrowRight'); await sleep(500);
ok('lightbox avança', await ev(() => /^2 \//.test(document.querySelector('.lb__count').textContent)));
await p.keyboard.press('Escape'); await sleep(600);
ok('lightbox fecha', await ev(() => !document.querySelector('.lb').classList.contains('is-on')));
await ev(() => document.querySelector('#g-milestones [data-ms=jeri]').click()); await sleep(600);
ok('filtro Jericoacoara (29)', await ev(() => document.querySelector('#g-count').textContent.startsWith('29')));
await ev(() => { const i = document.querySelector('#g-search'); i.value = 'portal'; i.dispatchEvent(new Event('input')); }); await sleep(800);
ok('busca "portal"', await ev(() => { const n = document.querySelectorAll('#masonry .tile').length; return n >= 1 && n < 5; }));
await ev(() => { const i = document.querySelector('#g-search'); i.value = ''; i.dispatchEvent(new Event('input')); document.querySelector('#g-milestones [data-ms=all]').click(); }); await sleep(400);
await ev(() => window.scrollTo(0, 0)); await sleep(300);
await ev(() => document.querySelector('#cta-cinema').click()); await sleep(5000); await shot('cinema');
ok('cinema abre', await ev(() => document.querySelector('.cine').classList.contains('is-on')));
await p.keyboard.press('Escape'); await sleep(800);
ok('cinema fecha', await ev(() => !document.querySelector('.cine').classList.contains('is-on')));
await ev(() => document.querySelector('#historia').scrollIntoView()); await sleep(500);
await ev(() => document.querySelector('#btn-narrate').click()); await sleep(2500);
ok('narração toca', await ev(() => !AC.audio.narr.paused));
await ev(() => document.querySelector('#btn-narrate').click()); await sleep(300);
await ev(() => document.querySelector('#surpresa').scrollIntoView()); await sleep(1500); await ev(() => document.querySelector('#surpresa').scrollIntoView()); await sleep(800);
const box = await ev(() => { const r = document.querySelector('#sc-canvas').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
await p.mouse.move(box.x + 10, box.y + 30); await p.mouse.down();
for (let row = 0; row < 12; row++) { const y = box.y + 30 + row * (box.h / 11); await p.mouse.move(box.x + 10, y, { steps: 3 }); await p.mouse.move(box.x + box.w - 10, y, { steps: 12 }); }
await p.mouse.up(); await sleep(1500);
ok('raspadinha revela', await ev(() => document.querySelector('#sc-stage').classList.contains('is-revealed')));
await ev(() => document.querySelector('#vows').scrollIntoView()); await sleep(400);
await p.type('#vow-author', 'Teste'); await p.type('#vow-text', 'Promessa local'); await p.evaluate(() => document.querySelector('#vow-form button[type=submit]').click()); await sleep(500);
ok('promessa (local) adicionada', await ev(() => [...document.querySelectorAll('.vow p')].some((e) => e.textContent.includes('Promessa local'))));
await ev(() => { const o = document.querySelector('.quiz__opts button'); if (o) o.click(); }); await sleep(300);
ok('quiz responde', await ev(() => !!document.querySelector('.quiz__opts button.ok, .quiz__opts button.no')));
await ev(() => document.querySelector('#musica').scrollIntoView()); await sleep(600);
await ev(() => { window.__calls = []; const A = AC.audio; const orig = A.switchTo.bind(A); A.switchTo = (n, o) => { window.__calls.push(n + (o && o.manual ? ' (manual)' : '') + ' @' + Math.round(performance.now()) + ' ' + (new Error().stack.split(String.fromCharCode(10))[2] || '').trim().slice(0, 90)); return orig(n, o); }; });
await ev(() => document.querySelector('.track[data-track=pedido]').click()); await sleep(2500); await shot('musica');
const pk = await ev(() => AC.audio.track === 'pedido' && document.querySelector('.track[data-track=pedido]').getAttribute('aria-checked') === 'true');
ok('player: escolher "Chuva de Arroz"', pk);
if (!pk) console.log('CHAMADAS', await ev(() => JSON.stringify(window.__calls, null, 1)));
if (!pk) console.log('DEBUG player', await ev(() => JSON.stringify({ track: AC.audio.track, zone: AC.audio.state.zone, playing: AC.audio.state.playing, checked: [...document.querySelectorAll('.track')].map((b) => b.dataset.track + ':' + b.getAttribute('aria-checked')), y: scrollY, mus: document.querySelector('#musica').getBoundingClientRect().top, sur: document.querySelector('#surpresa').getBoundingClientRect().top })));
await ev(() => document.querySelector('#btn-prefs').click()); await sleep(600);
await ev(() => document.querySelector('[data-pref-seg=motionIntensity] [data-v=reduced]').click());
ok('movimento reduzido', await ev(() => document.documentElement.dataset.motion === 'reduced'));
ok('sem rolagem horizontal', await ev(() => document.documentElement.scrollWidth <= innerWidth + 1));
console.log(log.join('\n')); console.log('ERROS:', errs.length ? '\n' + [...new Set(errs)].join('\n') : 'nenhum');
await b.close(); srv.close();
