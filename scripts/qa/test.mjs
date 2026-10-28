// Teste de fumaça (uso interno): abre o site num Chrome headless, coleta erros e tira prints.
import puppeteer from 'puppeteer-core'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = process.argv[2]; const mode = process.argv[3] || 'http'; const vp = (process.argv[4] || '390x844').split('x').map(Number);
const only = process.argv[5] ? process.argv[5].split(',') : null;
fs.mkdirSync(OUT, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.avif': 'image/avif', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]); const f = path.join(ROOT, p === '/' ? 'index.html' : p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  const st = fs.statSync(f), ext = path.extname(f), range = req.headers.range;
  if (range) { const [a, b] = range.replace('bytes=', '').split('-'); const s = +a, e = b ? +b : st.size - 1; res.writeHead(206, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Content-Range': `bytes ${s}-${e}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': e - s + 1 }); fs.createReadStream(f, { start: s, end: e }).pipe(res); }
  else { res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Content-Length': st.size, 'Accept-Ranges': 'bytes' }); fs.createReadStream(f).pipe(res); }
}).listen(0);
const port = srv.address().port;
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--allow-file-access-from-files'] });
const page = await browser.newPage();
await page.setViewport({ width: vp[0], height: vp[1], deviceScaleFactor: 1, isMobile: vp[0] < 700, hasTouch: vp[0] < 700 });
const errs = []; const failed = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message));
page.on('requestfailed', (r) => failed.push(r.url().slice(-80) + ' ' + (r.failure() || {}).errorText));
page.on('response', (r) => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url().slice(-80)); });
const url = mode === 'file' ? 'file:///' + ROOT.split(path.sep).join('/') + '/index.html?portao=0' : `http://localhost:${port}/index.html?portao=0`;
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 2500));
const shots = [['hero', 0], ['universo', '#universo'], ['historia', '#historia'], ['cap1', '#cap-1'], ['cap4', '#cap-4'], ['cap5', '#cap-5'], ['tempo', '#linha-do-tempo'], ['numeros', '#numeros'], ['galeria', '#galeria'], ['musica', '#musica'], ['surpresa', '#surpresa'], ['futuro', '#futuro'], ['vows', '#vows'], ['final', '#encerramento']];
for (const [name, target] of shots) {
  if (only && !only.includes(name)) continue;
  await page.evaluate((t) => { if (t === 0) window.scrollTo(0, 0); else { const el = document.querySelector(t); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 40); } }, target);
  await new Promise((r) => setTimeout(r, 1800));
  await page.screenshot({ path: path.join(OUT, `${vp[0]}-${name}.png`) });
}
const info = await page.evaluate(() => ({ tiles: document.querySelectorAll('.tile').length, overflowX: document.documentElement.scrollWidth > innerWidth + 1, sw: document.documentElement.scrollWidth, imgsBroken: [...document.images].filter((i) => i.complete && !i.naturalWidth && i.src && !i.closest('.ph--empty')).length, empties: document.querySelectorAll('.ph--empty').length, h: document.documentElement.scrollHeight }));
console.log(JSON.stringify(info));
console.log('ERROS:', errs.length ? '\n' + [...new Set(errs)].join('\n') : 'nenhum');
console.log('FALHAS DE REDE:', failed.length ? '\n' + [...new Set(failed)].slice(0, 20).join('\n') : 'nenhuma');
await browser.close(); srv.close();
