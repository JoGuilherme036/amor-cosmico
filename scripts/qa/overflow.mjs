// Procura rolagem horizontal e elementos que passam da tela em larguras pequenas de celular
import puppeteer from 'puppeteer-core'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.avif': 'image/avif', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4', '.woff2': 'font/woff2' };
const srv = http.createServer((req, res) => { const p = decodeURIComponent(req.url.split('?')[0]); const f = path.join(ROOT, p === '/' ? 'index.html' : p); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0);
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
for (const [w, h] of [[320, 640], [360, 740], [375, 667], [412, 915], [768, 1024]]) {
  const p = await b.newPage(); await p.setViewport({ width: w, height: h, isMobile: true, hasTouch: true });
  await p.goto(`http://localhost:${srv.address().port}/index.html?portao=0`, { waitUntil: 'load', timeout: 60000 }); await new Promise((r) => setTimeout(r, 3500));
  const r = await p.evaluate(() => {
    const W = document.documentElement.clientWidth, bad = [];
    const fixedOrClipped = (e) => { for (let x = e; x && x !== document.body; x = x.parentElement) { const cs = getComputedStyle(x); if (cs.position === 'fixed' || /(auto|scroll|hidden|clip)/.test(cs.overflowX)) return true; } return false; };
    document.querySelectorAll('main *, header *, .footer *').forEach((e) => { const r = e.getBoundingClientRect(); if (r.width > 0 && r.right > W + 2 && !fixedOrClipped(e)) bad.push((e.tagName + '.' + (typeof e.className === 'string' ? e.className.split(' ')[0] : '')) + ' r=' + Math.round(r.right)); });
    return { sw: document.documentElement.scrollWidth, W, bad: [...new Set(bad)].slice(0, 8) };
  });
  console.log(`${w}x${h}`, r.sw <= r.W + 1 ? 'OK' : 'ESTOURO', JSON.stringify(r));
  await p.close();
}
await b.close(); srv.close();
