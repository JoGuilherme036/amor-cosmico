// Amor Cósmico — pipeline de mídia
// Lê assets/originais, gera assets/img + assets/video e escreve js/data/media.js
// Uso: cd scripts && npm install && npm run build   (--force refaz tudo)
import fs from 'fs';
import path from 'path';
import os from 'os';
import sharp from 'sharp';
import exifr from 'exifr';
import { spawn, execFileSync } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import ffprobe from 'ffprobe-static';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'assets/originais');
const IMG = path.join(ROOT, 'assets/img');
const VID = path.join(ROOT, 'assets/video');
const OUT = path.join(ROOT, 'js/data/media.js');
const CURA = path.join(ROOT, 'scripts/curadoria.json');
const FORCE = process.argv.includes('--force');
const WIDTHS = [480, 960, 1600, 2400];
// Vídeos entram INTEIROS (sem corte). Para não pesar, a taxa de bits cai conforme a duração:
//   ≤ 30 s: qualidade alta · 30–120 s: média · > 120 s: orçamento de tamanho (≤ ~70 MB por arquivo; o GitHub recusa arquivos > 100 MB)
const MAX_FILE_MB = 70;
const PHOTO_EXT = ['.jpg', '.jpeg', '.png'];
const VIDEO_EXT = ['.mp4', '.mov'];

fs.mkdirSync(IMG, { recursive: true });
fs.mkdirSync(VID, { recursive: true });
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const cura = fs.existsSync(CURA) ? JSON.parse(fs.readFileSync(CURA, 'utf8')) : {};
const usedIds = new Map();
// id curto e ESTÁVEL; se dois arquivos truncarem igual (ex.: "WhatsApp Video … (1)" e "(2)"), ganha um sufixo curto do nome completo
const slug = (f) => {
  const base = path.basename(f, path.extname(f)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  let id = base.slice(0, 24).replace(/-$/, '');
  const kind = VIDEO_EXT.includes(path.extname(f).toLowerCase()) ? 'v' : 'p'; // foto e vídeo com o mesmo nome têm prefixos diferentes
  const owner = usedIds.get(kind + id);
  if (owner && owner !== f) id = id.slice(0, 18).replace(/-$/, '') + '-' + base.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7).toString(36).slice(0, 5);
  usedIds.set(kind + id, f);
  return id;
};
const exists = (p) => fs.existsSync(p) && fs.statSync(p).size > 0;

// Datas de EXIF vêm "sem fuso"; tratamos como horário de Brasília (UTC-3) a partir do ISO em Z.
function brt(iso) {
  if (!iso) return null;
  const d = new Date(new Date(iso).getTime() - 3 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}
function milestoneFor(d) {
  if (!d) return 'rotina';
  if (d < '2026-05-28') return 'encontro';
  if (d <= '2026-05-31') return 'namoro';
  if (d >= '2026-07-24' && d <= '2026-08-01') return 'jeri';
  if (d >= '2026-08-14' && d <= '2026-08-16') return 'pedido';
  if (d >= '2026-10-01') return 'outubro';
  return 'rotina';
}
const CHAPTER = { encontro: 1, namoro: 3, rotina: 2, jeri: 4, pedido: 5, outubro: 6, familia: 6 };

async function pool(items, n, fn) {
  let i = 0;
  const run = async () => { while (i < items.length) { const k = i++; await fn(items[k], k); } };
  await Promise.all(Array.from({ length: n }, run));
}

function ffmpeg(args) {
  return new Promise((res, rej) => {
    const p = spawn(ffmpegPath, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: ['ignore', 'inherit', 'inherit'] });
    p.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg exit ' + c))));
  });
}
function probe(p) {
  const o = JSON.parse(execFileSync(ffprobe.path, ['-v', 'quiet', '-print_format', 'json', '-show_streams', '-show_format', p], { maxBuffer: 1e8 }).toString());
  const v = o.streams.find((s) => s.codec_type === 'video');
  const rot = Math.abs(Number((v.side_data_list || []).find((x) => x.rotation !== undefined)?.rotation ?? v.tags?.rotate ?? 0));
  const swap = rot === 90 || rot === 270;
  return { w: swap ? v.height : v.width, h: swap ? v.width : v.height, dur: Number(o.format.duration), audio: o.streams.some((s) => s.codec_type === 'audio'), created: o.format.tags?.creation_time || null };
}

const files = fs.readdirSync(SRC).filter((f) => !f.startsWith('.')).sort();
const photos = files.filter((f) => PHOTO_EXT.includes(path.extname(f).toLowerCase()) && !cura[f]?.hidden);
const videos = files.filter((f) => VIDEO_EXT.includes(path.extname(f).toLowerCase()) && !cura[f]?.hidden);
const items = new Map();

// ---------- FOTOS ----------
async function doPhoto(f) {
  const id = 'p-' + slug(f);
  const src = path.join(SRC, f);
  const meta = await sharp(src).rotate().metadata();
  const W = meta.width, H = meta.height;
  const widths = WIDTHS.filter((w) => w <= W);
  if (!widths.length || widths[widths.length - 1] < W && W < 2400 && W > widths[widths.length - 1] * 1.2) widths.push(W);
  for (const w of widths) {
    const base = sharp(src).rotate().resize({ width: w, withoutEnlargement: true });
    const stem = path.join(IMG, `${id}-${w}`);
    if (FORCE || !exists(stem + '.avif')) await base.clone().avif({ quality: 52, effort: 3 }).toFile(stem + '.avif');
    if (FORCE || !exists(stem + '.webp')) await base.clone().webp({ quality: 78 }).toFile(stem + '.webp');
    if (FORCE || !exists(stem + '.jpg')) await base.clone().jpeg({ quality: 80, mozjpeg: true }).toFile(stem + '.jpg');
  }
  const tfile = path.join(IMG, `${id}-t.webp`);
  if (FORCE || !exists(tfile)) await sharp(src).rotate().resize(112, 112, { fit: 'cover', position: sharp.strategy.attention }).webp({ quality: 62 }).toFile(tfile);
  const tiny = await sharp(src).rotate().resize({ width: 24 }).blur(0.6).webp({ quality: 40 }).toBuffer();
  const st = await sharp(src).rotate().resize({ width: 64 }).stats();
  const c = st.dominant;
  let date = null;
  try { const e = await exifr.parse(src, ['DateTimeOriginal', 'CreateDate']); date = brt((e?.DateTimeOriginal || e?.CreateDate)?.toISOString?.()); } catch { /* sem EXIF */ }
  items.set(f, { id, type: 'photo', orig: f, thumb: `assets/img/${id}-t.webp`, base: `assets/img/${id}`, widths, width: W, height: H, date, color: `rgb(${c.r},${c.g},${c.b})`, lqip: 'data:image/webp;base64,' + tiny.toString('base64') });
}

// ---------- VÍDEOS ----------
async function doVideo(f) {
  const id = 'v-' + slug(f);
  const src = path.join(SRC, f);
  const pr = probe(src);
  const out = path.join(VID, id + '.mp4');
  const posterJpg = path.join(VID, id + '-poster.jpg');
  const posterWebp = path.join(VID, id + '-poster.webp');
  const longClip = pr.dur > 120, mid = pr.dur > 30;
  // orçamento para vídeos longos: kbps de vídeo = (MB * 8000 / duração) − áudio
  const budgetK = Math.max(450, Math.floor((MAX_FILE_MB * 8000) / pr.dur) - 64);
  const vk = longClip ? Math.min(2000, budgetK) : mid ? 2000 : 3000;
  const crf = longClip ? '31' : mid ? '29' : '27';
  const portrait = pr.h > pr.w, side = pr.dur > 300 ? 540 : 720; // >5 min: 540p mantém a nitidez com poucos kbps
  const scale = pr.w >= pr.h ? `scale=-2:min(${side}\\,ih)` : `scale=min(${side}\\,iw):-2`; // a barra invertida protege a vírgula no filtro do ffmpeg
  if (FORCE || !exists(out)) {
    const args = ['-i', src, '-vf', scale + ',fps=30,format=yuv420p',
      '-c:v', 'libx264', '-preset', longClip ? 'fast' : 'veryfast', '-crf', crf, '-maxrate', vk + 'k', '-bufsize', vk * 2 + 'k', '-profile:v', 'high', '-movflags', '+faststart',
      ...(pr.audio ? ['-c:a', 'aac', '-b:a', '64k', '-ac', '2'] : ['-an']), out + '.part.mp4'];
    await ffmpeg(args);
    fs.renameSync(out + '.part.mp4', out); // só vira "pronto" se o ffmpeg terminou
  }
  const ss = String(Math.min(1, pr.dur / 3));
  if (FORCE || !exists(posterJpg)) {
    const grab = (t) => ffmpeg(['-ss', t, '-i', out, '-frames:v', '1', '-vf', 'scale=min(960\\,iw):-2', '-q:v', '3', posterJpg]);
    await grab(ss);
    // pôster preto (fade-in)? tenta pontos mais adiante até achar um quadro com luz
    for (const f of [0.25, 0.5]) {
      const mean = (await sharp(posterJpg).stats()).channels.reduce((a, c) => a + c.mean, 0) / 3;
      if (mean > 22) break;
      await grab(String(Math.max(1, pr.dur * f)));
    }
  }
  if (FORCE || !exists(posterWebp)) await sharp(posterJpg).webp({ quality: 76 }).toFile(posterWebp);
  const tfile = path.join(VID, `${id}-t.webp`);
  if (FORCE || !exists(tfile)) await sharp(posterJpg).resize(112, 112, { fit: 'cover', position: sharp.strategy.attention }).webp({ quality: 62 }).toFile(tfile);
  const tiny = await sharp(posterJpg).resize({ width: 24 }).blur(0.6).webp({ quality: 40 }).toBuffer();
  const st = await sharp(posterJpg).resize({ width: 64 }).stats();
  const c = st.dominant;
  const m = await sharp(posterJpg).metadata();
  const created = pr.created ? brt(pr.created) : null;
  items.set(f, { id, type: 'video', orig: f, thumb: `assets/video/${id}-t.webp`, file: `assets/video/${id}.mp4`, poster: `assets/video/${id}-poster`, width: m.width, height: m.height, duration: Math.round(pr.dur), hasAudio: pr.audio, date: created, color: `rgb(${c.r},${c.g},${c.b})`, lqip: 'data:image/webp;base64,' + tiny.toString('base64') });
}

console.log(`Fotos: ${photos.length} · Vídeos: ${videos.length}`);
let done = 0;
const tick = (label) => { done++; process.stdout.write(`\r[${done}/${photos.length + videos.length}] ${label.slice(0, 40).padEnd(40)}`); };
await pool(photos, 2, async (f) => { await doPhoto(f); tick(f); });
await pool(videos, 2, async (f) => { await doVideo(f); tick(f); });
console.log('\nGerando manifesto…');

// ---------- Live Photos: MOV com mesmo nome de uma foto ----------
// (só pares verificados à mão em curadoria.json: foto { "live": "arquivo.MOV" })
const liveOf = new Map(); // foto -> item do vídeo
const consumed = new Set();
for (const [f, c] of Object.entries(cura)) if (c.live && items.has(f) && items.has(c.live)) { liveOf.set(f, items.get(c.live)); consumed.add(c.live); }
const standalone = videos.filter((f) => !consumed.has(f) && !cura[f]?.hidden);

const list = [];
for (const f of [...photos.filter((p) => !cura[p]?.hidden), ...standalone]) {
  const it = { ...items.get(f) };
  const cu = cura[f] || {};
  const live = liveOf.get(f);
  if (live) it.live = live.file;
  const date = cu.date === '' ? null : (cu.date || it.date); // "date": "" = sem data (evita mostrar a data de exportação)
  const milestone = cu.milestone || milestoneFor(date);
  list.push({
    id: it.id, type: it.type, orig: it.orig, thumb: it.thumb,
    ...(it.type === 'photo' ? { base: it.base, widths: it.widths } : { file: it.file, poster: it.poster, duration: it.duration, hasAudio: it.hasAudio }),
    ...(it.live ? { live: it.live } : {}),
    width: it.width, height: it.height, date: date || null, milestone, chapter: cu.chapter ?? CHAPTER[milestone] ?? 2,
    place: cu.place || '', caption: cu.caption || '', alt: cu.alt || '', tags: cu.tags || [], favorite: !!cu.favorite, suggested: !!cu.s, ...(cu.film ? { film: true } : {}),
    focal: cu.focal || [50, it.type === 'photo' ? 40 : 40], hero: !!cu.hero, color: it.color, lqip: it.lqip,
  });
}
list.sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999') || a.id.localeCompare(b.id));
// limpa arquivos gerados de mídias que saíram do manifesto (ocultas/removidas) — compara nomes exatos
const keep = new Set();
const vids = list.filter((i) => i.type === 'video').concat([...liveOf.values()]);
for (const i of list.filter((x) => x.type === 'photo')) { keep.add(`${i.id}-t.webp`); for (const w of i.widths) for (const e of ['avif', 'webp', 'jpg']) keep.add(`${i.id}-${w}.${e}`); }
for (const v of vids) { keep.add(`${v.id}.mp4`); keep.add(`${v.id}-t.webp`); keep.add(`${v.id}-poster.jpg`); keep.add(`${v.id}-poster.webp`); }
for (const dir of [IMG, VID]) for (const f of fs.readdirSync(dir)) if (!keep.has(f)) fs.rmSync(path.join(dir, f));
// blur-up (LQIP) vai num arquivo à parte, carregado só depois da primeira pintura: o manifesto principal fica leve
const lq = {}; for (const i of list) { lq[i.id] = i.lqip; delete i.lqip; }
fs.writeFileSync(OUT, `// GERADO por scripts/build-media.mjs — não edite à mão (edite scripts/curadoria.json)\nwindow.MEDIA = ${JSON.stringify(list)};\n`);
fs.writeFileSync(path.join(path.dirname(OUT), 'lqip.js'), `// GERADO por scripts/build-media.mjs — miniaturas borradas (blur-up)\nwindow.LQIP = ${JSON.stringify(lq)};\n`);
fs.writeFileSync(path.join(ROOT, 'scripts/inventario.json'), JSON.stringify(list, null, 1));
console.log(`OK — ${list.length} itens no manifesto (${list.filter((i) => i.type === 'photo').length} fotos, ${list.filter((i) => i.type === 'video').length} vídeos, ${list.filter((i) => i.live).length} live).`);
