// Servidor local de teste: serve o site e finge ser o Supabase (POST /rest/v1/rpc/*).
import http from 'http'; import fs from 'fs'; import path from 'path';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.avif': 'image/avif', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.enc': 'application/octet-stream', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
export function startMock(ROOT) {
const DB = { photos: [], vows: [] }; let next = 1; const tokens = new Set(); const stats = { bodyMax: 0 };
function rpc(fn, b) {
  if (!b.p_token) return [403, { message: 'acesso negado' }]; tokens.add(b.p_token);
  if (fn === 'photos_add') { if (b.p_data.length > 1600000 || b.p_thumb.length > 150000) return [400, { message: 'grande demais' }]; const r = { id: next++, author: b.p_author, caption: b.p_caption, mime: b.p_mime, w: b.p_w, h: b.p_h, thumb: b.p_thumb, data: b.p_data, created_at: new Date().toISOString() }; DB.photos.push(r); return [200, r.id]; }
  if (fn === 'photos_list') return [200, DB.photos.filter((x) => x.id > (b.p_after || 0)).slice(0, 60).map(({ data, ...x }) => x)];
  if (fn === 'photos_ids') return [200, DB.photos.map((x) => x.id)];
  if (fn === 'photos_get') { const r = DB.photos.find((x) => x.id === b.p_id); return [200, r ? r.data : null]; }
  if (fn === 'photos_delete') { DB.photos = DB.photos.filter((x) => x.id !== b.p_id); return [204, null]; }
  if (fn === 'vows_list') return [200, []]; if (fn === 'capsule_count') return [200, 0]; if (fn === 'heart_counts') return [200, []];
  return [404, { message: 'função desconhecida: ' + fn }];
}
const srv = http.createServer((req, res) => {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
  if (req.url.startsWith('/rest/v1/rpc/')) {
    if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
    let body = ''; req.on('data', (c) => (body += c)); req.on('end', () => { stats.bodyMax = Math.max(stats.bodyMax, body.length); const [st, out] = rpc(req.url.split('/').pop(), JSON.parse(body || '{}')); res.writeHead(st, { ...cors, 'Content-Type': 'application/json' }); res.end(out == null ? '' : JSON.stringify(out)); });
    return;
  }
  const p = decodeURIComponent(req.url.split('?')[0]); const f = path.join(ROOT, p === '/' ? 'index.html' : p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  const st = fs.statSync(f), ext = path.extname(f), range = req.headers.range;
  if (range) { const [a, b] = range.replace('bytes=', '').split('-'); const s = +a, e = b ? +b : st.size - 1; res.writeHead(206, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Content-Range': `bytes ${s}-${e}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': e - s + 1 }); fs.createReadStream(f, { start: s, end: e }).pipe(res); }
  else { res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Content-Length': st.size, 'Accept-Ranges': 'bytes' }); fs.createReadStream(f).pipe(res); }
}).listen(0);
const ORIGIN = `http://localhost:${srv.address().port}`;
  return { srv, ORIGIN, DB, tokens, stats };
}


