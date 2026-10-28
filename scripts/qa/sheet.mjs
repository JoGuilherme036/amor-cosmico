// Contact sheet de mídias (curadoria). Uso: node qa/sheet.mjs <saida.jpg> <id1,id2,...>
import fs from 'fs'; import path from 'path'; import sharp from 'sharp'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ids = process.argv[3].split(','); const W = 190, H = 300, COLS = 5, rows = Math.ceil(ids.length / COLS);
const find = (id) => { const v = path.join(ROOT, 'assets/video', id + '-poster.jpg'); if (fs.existsSync(v)) return v; return path.join(ROOT, 'assets/img', id + '-480.jpg'); };
const comps = [];
for (let i = 0; i < ids.length; i++) {
  const x = (i % COLS) * W, y = Math.floor(i / COLS) * (H + 20);
  comps.push({ input: await sharp(find(ids[i])).rotate().resize(W - 4, H, { fit: 'contain', background: '#111' }).toBuffer(), left: x + 2, top: y + 20 });
  comps.push({ input: Buffer.from(`<svg width="${W}" height="20"><text x="2" y="14" font-size="12" fill="#fff" font-family="Arial">${i + 1}. ${ids[i].replace(/^[pv]-/, '').slice(0, 24)}</text></svg>`), left: x, top: y });
}
await sharp({ create: { width: W * COLS, height: (H + 20) * rows, channels: 3, background: '#000' } }).composite(comps).jpeg({ quality: 80 }).toFile(process.argv[2]);
