import puppeteer from 'puppeteer-core'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..'); const OUT = process.argv[2]; fs.mkdirSync(OUT, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.avif': 'image/avif', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4', '.woff2': 'font/woff2' };
const srv = http.createServer((req, res) => { const p = decodeURIComponent(req.url.split('?')[0]); const f = path.join(ROOT, p === '/' ? 'index.html' : p); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0);
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function open(w, h) { const p = await b.newPage(); await p.setViewport({ width: w, height: h, isMobile: true, hasTouch: true }); await p.goto(`http://localhost:${srv.address().port}/dev.html${process.env.NOGATE?'?portao=0':''}`, { waitUntil: 'load', timeout: 60000 }); await sleep(3500); await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; }); return p; }
let p = await open(390, 844);
await p.evaluate(() => document.querySelector('#btn-more').click()); await sleep(900); await p.screenshot({ path: path.join(OUT, 'x-mais.png') });
await p.evaluate(() => document.querySelector('[data-close-drawer]').click()); await sleep(600);
await p.evaluate(() => document.querySelector('#btn-prefs').click()); await sleep(900); await p.screenshot({ path: path.join(OUT, 'x-prefs.png') });
await p.evaluate(() => document.querySelector('#drawer-prefs [data-close-drawer]').click()); await sleep(500);
await p.evaluate(() => { const el = document.querySelector('#map'); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 100); }); await sleep(4200); await p.screenshot({ path: path.join(OUT, 'x-mapa.png') });
await p.close();
p = await open(844, 390); await p.screenshot({ path: path.join(OUT, 'x-land-hero.png') });
await p.evaluate(() => { const el = document.querySelector('#cap-2'); window.scrollTo(0, el.getBoundingClientRect().top + scrollY + 300); }); await sleep(1500); await p.screenshot({ path: path.join(OUT, 'x-land-story.png') });
console.log('ok'); await b.close(); srv.close();
