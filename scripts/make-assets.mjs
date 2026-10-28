// Gera arquivos "de apoio": grão de filme, ícones do PWA e imagem de compartilhamento (OG 1200x630).
import fs from 'fs'; import path from 'path'; import sharp from 'sharp'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FX = path.join(ROOT, 'assets/fx'), IC = path.join(ROOT, 'assets/icons');
fs.mkdirSync(FX, { recursive: true }); fs.mkdirSync(IC, { recursive: true });

// grão
const S = 160, buf = Buffer.alloc(S * S); // cinza 8 bits: ~20 KB
for (let i = 0; i < S * S; i++) buf[i] = Math.random() * 255 | 0;
await sharp(buf, { raw: { width: S, height: S, channels: 1 } }).png({ compressionLevel: 9 }).toFile(path.join(FX, 'grain.png'));

const hero = path.join(ROOT, 'assets/img/p-img-3842-1600.jpg');
// ícones
for (const [n, size, pad] of [['icon-192', 192, 0], ['icon-512', 512, 0], ['icon-maskable-512', 512, 64]]) {
  const inner = size - pad * 2;
  const photo = await sharp(hero).resize(inner, inner, { fit: 'cover', position: 'attention' }).png().toBuffer();
  const ring = Buffer.from(`<svg width="${size}" height="${size}"><rect width="100%" height="100%" fill="#05050a"/><rect x="${pad + 6}" y="${pad + 6}" width="${inner - 12}" height="${inner - 12}" rx="${inner * 0.22}" fill="none" stroke="#e8c987" stroke-width="${Math.max(3, size / 64)}"/></svg>`);
  const mask = Buffer.from(`<svg width="${inner}" height="${inner}"><rect width="100%" height="100%" rx="${inner * 0.22}"/></svg>`);
  const rounded = await sharp(photo).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: '#05050a' } }).composite([{ input: rounded, left: pad, top: pad }, { input: ring }]).png().toFile(path.join(IC, n + '.png'));
}

// OG 1200x630
const W = 1200, H = 630;
const bg = Buffer.from(`<svg width="${W}" height="${H}"><defs><radialGradient id="a" cx="20%" cy="20%" r="80%"><stop offset="0" stop-color="#3a1a8a" stop-opacity=".9"/><stop offset="1" stop-color="#05050a"/></radialGradient><radialGradient id="b" cx="90%" cy="90%" r="60%"><stop offset="0" stop-color="#ff5a9d" stop-opacity=".35"/><stop offset="1" stop-color="#05050a" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="#05050a"/><rect width="100%" height="100%" fill="url(#a)"/><rect width="100%" height="100%" fill="url(#b)"/>${Array.from({ length: 70 }, () => `<circle cx="${Math.random() * W | 0}" cy="${Math.random() * H | 0}" r="${(Math.random() * 1.6 + 0.4).toFixed(1)}" fill="#fff" opacity="${(Math.random() * 0.7 + 0.2).toFixed(2)}"/>`).join('')}</svg>`);
const pw = 400, ph = 560;
const photo = await sharp(hero).resize(pw, ph, { fit: 'cover', position: 'attention' }).png().toBuffer();
const pmask = Buffer.from(`<svg width="${pw}" height="${ph}"><rect width="100%" height="100%" rx="28"/></svg>`);
const prounded = await sharp(photo).composite([{ input: pmask, blend: 'dest-in' }]).png().toBuffer();
const frame = Buffer.from(`<svg width="${W}" height="${H}"><rect x="${W - pw - 80}" y="${(H - ph) / 2}" width="${pw}" height="${ph}" rx="28" fill="none" stroke="#e8c987" stroke-width="3"/></svg>`);
const text = Buffer.from(`<svg width="${W}" height="${H}"><style>.t{font-family:Georgia,'Times New Roman',serif;fill:#f8f6f2}.g{fill:#e8c987}</style>
<text x="80" y="150" class="t g" font-size="22" letter-spacing="8" font-family="Arial">AMOR CÓSMICO</text>
<text x="80" y="270" class="t" font-size="84" font-weight="600">João Guilherme</text>
<text x="80" y="350" class="t g" font-size="64" font-style="italic">&amp;</text>
<text x="80" y="440" class="t" font-size="84" font-weight="600">Maria Cândida</text>
<text x="80" y="525" class="t" font-size="30" font-style="italic" opacity=".8">“Em todos os universos, eu escolheria você.”</text></svg>`);
await sharp(bg).composite([{ input: prounded, left: W - pw - 80, top: (H - ph) / 2 }, { input: frame }, { input: text }]).jpeg({ quality: 86 }).toFile(path.join(ROOT, 'assets/og.jpg'));
console.log('assets de apoio gerados');
