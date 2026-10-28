// Tira prints de seletores específicos — node qa/shot.mjs <pasta> <LxA> <seletor1,seletor2,...> [http|file]
import puppeteer from 'puppeteer-core'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = process.argv[2]; const [W, H] = process.argv[3].split('x').map(Number); const sels = process.argv[4].split('|');
fs.mkdirSync(OUT, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.avif': 'image/avif', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.enc': 'application/octet-stream', '.woff2': 'font/woff2' };
const srv = http.createServer((req, res) => { const p = decodeURIComponent(req.url.split('?')[0]); const f = path.join(ROOT, p === '/' ? 'index.html' : p); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0);
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: W, height: H, isMobile: W < 700, hasTouch: W < 700, deviceScaleFactor: 1 });
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto(`http://localhost:${srv.address().port}/dev.html?portao=0`, { waitUntil: 'networkidle2' }); await new Promise((r) => setTimeout(r, 2500));
await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
let i = 0;
for (const s of sels) { const [sel, off] = s.split('@'); await p.evaluate((sel, off) => { const el = document.querySelector(sel); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - (+off || 70)); }, sel, off); await new Promise((r) => setTimeout(r, 1500)); await p.screenshot({ path: path.join(OUT, `s-${W}-${++i}.png`) }); }
console.log('prints:', i, 'erros:', errs.length ? errs.join(' | ') : 'nenhum');
await b.close(); srv.close();
