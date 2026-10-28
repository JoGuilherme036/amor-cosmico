// Compara uma pasta de mídias NOVAS com assets/originais e separa o que é repetido.
// Uso: node dedupe.mjs <pasta-nova>     → escreve <pasta-nova>/../.dedupe.json e imprime o resumo
// Critérios de "repetido": (1) mesmo conteúdo (SHA-1); (2) mesma imagem/cena: hash perceptual (dHash 64 bits) a ≤ 6 bits
// de distância, e — para vídeos — duração próxima (±1,5 s ou o menor é um corte do maior).
import fs from 'fs'; import path from 'path'; import crypto from 'crypto'; import sharp from 'sharp'; import { spawn, execFileSync } from 'child_process';
import ffmpegPath from 'ffmpeg-static'; import ffprobe from 'ffprobe-static'; import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OLD = path.join(ROOT, 'assets/originais'), NEW = path.resolve(process.argv[2]);
const isVid = (f) => /\.(mp4|mov)$/i.test(f), isPic = (f) => /\.(jpe?g|png)$/i.test(f);
const sha = (p) => crypto.createHash('sha1').update(fs.readFileSync(p)).digest('hex'); // arquivos < 100 MB: ok
const tmp = path.join(ROOT, '.tmp-frame.png');

function probe(p) {
  try {
    const o = JSON.parse(execFileSync(ffprobe.path, ['-v', 'quiet', '-print_format', 'json', '-show_streams', '-show_format', p], { maxBuffer: 1e8 }).toString());
    const v = o.streams.find((s) => s.codec_type === 'video'); const rot = Math.abs(Number((v.side_data_list || []).find((x) => x.rotation !== undefined)?.rotation ?? v.tags?.rotate ?? 0));
    return { w: rot === 90 ? v.height : v.width, h: rot === 90 ? v.width : v.height, dur: Number(o.format.duration), size: fs.statSync(p).size };
  } catch { return { w: 0, h: 0, dur: 0, size: fs.statSync(p).size }; }
}
const run = (args) => new Promise((res) => { const c = spawn(ffmpegPath, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'ignore' }); c.on('close', res); });
// dHash: reduz a 9x8 em tons de cinza, compara pixels vizinhos
async function dhash(buf) {
  const { data } = await sharp(buf).rotate().resize(9, 8, { fit: 'fill' }).greyscale().raw().toBuffer({ resolveWithObject: true });
  let bits = ''; for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits += data[y * 9 + x] > data[y * 9 + x + 1] ? '1' : '0'; return bits;
}
const ham = (a, b) => { let d = 0; for (let i = 0; i < 64; i++) if (a[i] !== b[i]) d++; return d; };
async function frameHash(p, dur) { // quadro em ~25% do vídeo (evita fade-in e tela preta)
  await run(['-ss', String(Math.max(0.3, Math.min(dur * 0.25, 20))), '-i', p, '-frames:v', '1', '-vf', 'scale=160:-2', tmp]);
  try { return await dhash(fs.readFileSync(tmp)); } catch { return null; }
}
async function sig(p) {
  if (isPic(p)) { const m = await sharp(p).rotate().metadata(); const o = m.orientation >= 5; return { kind: 'p', hash: await dhash(fs.readFileSync(p)), w: o ? m.height : m.width, h: o ? m.width : m.height, size: fs.statSync(p).size, dur: 0 }; }
  const pr = probe(p); return { kind: 'v', hash: await frameHash(p, pr.dur), ...pr };
}

const oldFiles = fs.readdirSync(OLD).filter((f) => isVid(f) || isPic(f));
console.log(`assinando ${oldFiles.length} originais existentes…`);
const oldSig = {}, oldSha = {};
for (const f of oldFiles) { const p = path.join(OLD, f); oldSha[sha(p)] = f; oldSig[f] = await sig(p); }

const newFiles = fs.readdirSync(NEW).filter((f) => isVid(f) || isPic(f)).sort();
const out = { identicos: [], repetidos: [], melhores: [], novos: [], internos: [] };
const accepted = {}; // assinaturas dos novos já aceitos (para pegar repetidos dentro do próprio zip)
console.log(`comparando ${newFiles.length} novos…`);
for (const f of newFiles) {
  const p = path.join(NEW, f), h = sha(p);
  if (oldSha[h]) { out.identicos.push([f, oldSha[h]]); continue; }
  const s = await sig(p); if (!s.hash) { out.novos.push({ f, nota: 'sem quadro legível' }); accepted[f] = s; continue; }
  let best = null;
  for (const [of, os] of Object.entries(oldSig)) {
    if (os.kind !== s.kind || !os.hash) continue;
    const d = ham(os.hash, s.hash);
    // fotos: só reexportação da MESMA foto (d ≤ 2) — fotos em rajada têm d de 3 a 6 e são tomadas diferentes
    // vídeos: mesma cena (d ≤ 3) E mesma duração (rajadas de Live Photo têm durações um pouco diferentes)
    if (s.kind === 'p' ? d > 2 : (d > 3 || Math.abs(os.dur - s.dur) > Math.max(0.6, 0.02 * Math.max(os.dur, s.dur)))) continue;
    if (!best || d < best.d) best = { of, d, os };
  }
  if (best) {
    // a versão nova é "melhor" se for claramente maior (mais resolução ou mais tempo/arquivo)
    const better = s.kind === 'v' ? (s.w * s.h > best.os.w * best.os.h * 1.3 || s.dur > best.os.dur + 1.5) : (s.w * s.h > best.os.w * best.os.h * 1.3);
    (better ? out.melhores : out.repetidos).push({ f, igualA: best.of, dist: best.d, novo: `${s.w}x${s.h} ${s.dur.toFixed(1)}s ${(s.size / 1e6).toFixed(1)}MB`, antigo: `${best.os.w}x${best.os.h} ${best.os.dur.toFixed(1)}s ${(best.os.size / 1e6).toFixed(1)}MB` });
    continue;
  }
  // repetido dentro do próprio lote?
  let inner = null; for (const [af, as] of Object.entries(accepted)) { if (as.kind !== s.kind || !as.hash) continue; if (s.kind === 'p' ? ham(as.hash, s.hash) <= 2 : (ham(as.hash, s.hash) <= 3 && Math.abs(as.dur - s.dur) <= Math.max(0.6, 0.02 * Math.max(as.dur, s.dur)))) { inner = af; break; } }
  if (inner) { out.internos.push({ f, igualA: inner }); continue; }
  accepted[f] = s; out.novos.push({ f, info: `${s.w}x${s.h} ${s.dur ? s.dur.toFixed(1) + 's ' : ''}${(s.size / 1e6).toFixed(1)}MB` });
}
fs.rmSync(tmp, { force: true });
fs.writeFileSync(path.join(path.dirname(NEW), '.dedupe.json'), JSON.stringify(out, null, 1));
console.log(`\nidênticos (mesmo arquivo): ${out.identicos.length}\nrepetidos (mesma cena, nada a ganhar): ${out.repetidos.length}\nrepetidos dentro do próprio lote: ${out.internos.length}\nversão NOVA melhor que a antiga: ${out.melhores.length}\nNOVOS de verdade: ${out.novos.length}`);
console.log('\n-- melhores:'); out.melhores.forEach((m) => console.log(' ', m.f.slice(0, 40).padEnd(42), 'novo', m.novo, '| antigo', m.antigo));
console.log('\n-- repetidos (ignorados):'); out.repetidos.forEach((m) => console.log(' ', m.f.slice(0, 40).padEnd(42), '≈', m.igualA, `(d=${m.dist})`, m.novo, '|', m.antigo));
console.log('\n-- internos:'); out.internos.forEach((m) => console.log(' ', m.f, '≈', m.igualA));
console.log('\n-- novos:'); out.novos.forEach((m) => console.log(' ', m.f.slice(0, 50).padEnd(52), m.info || m.nota));
