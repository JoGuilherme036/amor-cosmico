// A rolagem NÃO pode pular ao abrir/fechar imagem, vídeo, galeria, modais e gavetas (bug do celular).
import puppeteer from 'puppeteer-core'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const mode = process.argv[2] || 'http', W = +(process.argv[3] || 390), H = +(process.argv[4] || 844);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.avif': 'image/avif', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4', '.woff2': 'font/woff2' };
const srv = http.createServer((req, res) => { const p = decodeURIComponent(req.url.split('?')[0]); const f = path.join(ROOT, p === '/' ? 'index.html' : p); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } const st = fs.statSync(f), ext = path.extname(f), range = req.headers.range; if (range) { const [a, b] = range.replace('bytes=', '').split('-'); const s = +a, e = b ? +b : st.size - 1; res.writeHead(206, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Content-Range': `bytes ${s}-${e}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': e - s + 1 }); fs.createReadStream(f, { start: s, end: e }).pipe(res); } else { res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Content-Length': st.size, 'Accept-Ranges': 'bytes' }); fs.createReadStream(f).pipe(res); } }).listen(0);
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage(); await p.setViewport({ width: W, height: H, isMobile: true, hasTouch: true });
let reloads = 0; p.on('load', () => { reloads++; }); // eventos "load" = recarregamentos reais (1 = só o carregamento inicial)
await p.goto(`http://localhost:${srv.address().port}/${mode === 'dev' ? 'dev.html' : 'index.html'}?portao=0`, { waitUntil: 'load', timeout: 60000 }); await new Promise((r) => setTimeout(r, 3500));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const ev = (f, ...a) => p.evaluate(f, ...a); const log = [];
const ok = (n, v, extra = '') => log.push((v ? 'OK   ' : 'FALHA') + ' ' + n + (extra ? '  ' + extra : ''));
await ev(() => { document.documentElement.style.scrollBehavior = 'auto'; });
const near = (a, b) => Math.abs(a - b) < 6;
async function case_(name, y, openFn, closeFn) {
  await ev((y) => window.scrollTo(0, y), y); await sleep(900); const y0 = await ev(() => Math.round(scrollY));
  await openFn(); await sleep(1100); const yOpen = await ev(() => Math.round(scrollY));
  await closeFn(); await sleep(1100); const y1 = await ev(() => Math.round(scrollY));
  ok(name, near(y0, yOpen) && near(y0, y1), `antes ${y0} · aberto ${yOpen} · depois ${y1}`);
}
const tapTile = (sel) => ev((s) => { const el = document.querySelector(s); el.scrollIntoView({ block: 'center' }); }, sel);
// 1) lightbox da galeria (toque real)
await ev(() => document.querySelector('#galeria').scrollIntoView()); await sleep(800);
await ev(() => window.scrollBy(0, 900)); await sleep(1200);
const tile = await ev(() => { const t = [...document.querySelectorAll('#masonry .tile')].find((x) => { const r = x.getBoundingClientRect(); return r.top > 100 && r.bottom < innerHeight - 100 && x.dataset.ready; }); if (!t) return null; const r = t.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, id: t.dataset.id }; });
if (tile) {
  const y0 = await ev(() => Math.round(scrollY)); await p.touchscreen.tap(tile.x, tile.y); await sleep(1300);
  const open = await ev(() => document.querySelector('.lb') && document.querySelector('.lb').classList.contains('is-on')); const yOpen = await ev(() => Math.round(scrollY));
  ok('galeria: abrir foto (toque) não pula', open && near(y0, yOpen), `antes ${y0} · aberto ${yOpen}`);
  await p.touchscreen.tap(W - 40, 40); await sleep(1300); // botão fechar (canto)
  const closed = await ev(() => !document.querySelector('.lb').classList.contains('is-on')); const y1 = await ev(() => Math.round(scrollY));
  ok('galeria: fechar foto volta ao mesmo lugar', closed && near(y0, y1), `antes ${y0} · depois ${y1}`);
  // 2) fechar com o botão "voltar" do celular (popstate)
  await p.touchscreen.tap(tile.x, tile.y); await sleep(1100); await ev(() => history.back()); await sleep(1200);
  const y2 = await ev(() => Math.round(scrollY)); ok('galeria: botão voltar fecha e mantém a posição', near(y0, y2) && await ev(() => !document.querySelector('.lb').classList.contains('is-on')), `depois ${y2}`);
} else ok('galeria: tile visível para o teste', false);
// 3) fotos dos capítulos, linha do tempo, órbita do início, faixa do universo, música, parede de estrelas, modal, gaveta
await case_('história: foto do capítulo', 9000, () => ev(() => { const f = [...document.querySelectorAll('.chapter [data-open]')].find((x) => { const r = x.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; }) || document.querySelector('.chapter [data-open]'); f.click(); }), () => ev(() => AC.lightbox.close()));
await case_('linha do tempo: miniatura', 6000, () => ev(() => document.querySelector('.tl-thumb').click()), () => ev(() => AC.lightbox.close()));
await case_('início: foto da órbita', 0, () => ev(() => document.querySelector('.orbit__btn').click()), () => ev(() => AC.lightbox.close()));
await case_('universo: faixa de fotos', 1500, () => ev(() => document.querySelector('.marquee__item').click()), () => ev(() => AC.lightbox.close()));
await case_('final: botão "Relembrar o nosso sim"', 56000, () => ev(() => document.querySelector('#btn-proposal').click()), () => ev(() => document.querySelector('[data-close-modal]').click()));
await case_('menu "Mais"', 12000, () => ev(() => document.querySelector('#btn-more').click()), () => ev(() => document.querySelector('#drawer-more [data-close-drawer]').click()));
await case_('preferências', 12000, () => ev(() => document.querySelector('#btn-prefs').click()), () => ev(() => document.querySelector('#drawer-prefs [data-close-drawer]').click()));
await case_('filme', 12000, () => ev(() => document.querySelector('#btn-cinema-top').click()), () => ev(() => AC.cinema.close()));
await case_('galáxia/parede de estrelas', 12000, () => ev(() => AC.starwall.open(AC.MEDIA)), () => p.keyboard.press('Escape'));
// 4) página recarregada sozinha (iPhone derruba a aba): volta ao ponto e entra sem pedir nada (precisa de AC_SENHA)
if (process.env.AC_SENHA) {
  const p2 = await b.newPage(); await p2.setViewport({ width: W, height: H, isMobile: true, hasTouch: true });
  let loads = 0; p2.on('load', () => { loads++; });
  await p2.goto(`http://localhost:${srv.address().port}/index.html`, { waitUntil: 'load', timeout: 60000 }); await sleep(1500);
  await p2.type('#gate-code', process.env.AC_SENHA); await p2.tap('#gate-open'); await sleep(5000);
  await p2.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, 24000); }); await sleep(1500);
  await p2.reload({ waitUntil: 'load' });
  let y = 0, gone = false; for (let i = 0; i < 40; i++) { await sleep(500); y = await p2.evaluate(() => Math.round(scrollY)); gone = await p2.evaluate(() => { const g = document.querySelector('#gate'); return !g || g.classList.contains('is-out'); }); if (gone && Math.abs(y - 24000) < 60) break; }
  ok('recarregou: entra sozinho (sem pedir senha de novo)', gone);
  ok('recarregou: volta ao ponto onde estava', Math.abs(y - 24000) < 60, `esperado 24000 · agora ${y}`);
}
console.log(`== rolagem preservada (${mode}, ${W}x${H}) — navegações da página: ${reloads}`); console.log(log.join('\n'));
await b.close(); srv.close();
