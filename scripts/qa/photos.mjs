// Fotos enviadas por vocês: Maria envia → banco → João vê (outro aparelho) → abre inteira → apaga.
// Uso: AC_SENHA="..." node qa/photos.mjs [LxA]      (usa um Supabase de mentira local)
import puppeteer from 'puppeteer-core'; import fs from 'fs'; import path from 'path'; import os from 'os'; import sharp from 'sharp'; import { fileURLToPath } from 'url'; import { startMock } from './mock-supabase.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const [W, H] = (process.argv[2] || '390x844').split('x').map(Number); const SENHA = process.env.AC_SENHA || '';
if (!SENHA) { console.log('Defina AC_SENHA.'); process.exit(1); }

const { srv, ORIGIN, DB, tokens, stats } = startMock(ROOT);
// foto "de celular": 3000x4000 com ruído (pesada de propósito) e orientação EXIF 6 (em pé)
const tmp = path.join(os.tmpdir(), 'ac-foto-teste.jpg');
const noise = Buffer.alloc(3000 * 4000 * 3); for (let i = 0; i < noise.length; i += 3) { const v = (Math.sin(i / 90000) * 60 + 128 + Math.random() * 40) | 0; noise[i] = v; noise[i + 1] = (v + 30) & 255; noise[i + 2] = 255 - v; }
await sharp(noise, { raw: { width: 3000, height: 4000, channels: 3 } }).jpeg({ quality: 92 }).withMetadata({ orientation: 1 }).toFile(tmp);
const origSize = fs.statSync(tmp).size;

const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const log = []; const errs = []; const ok = (n, v, x = '') => log.push((v ? 'OK   ' : 'FALHA') + ' ' + n + (x ? '  ' + x : '')); const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function device(name) {
  const ctx = await b.createBrowserContext(); const p = await ctx.newPage(); await p.setViewport({ width: W, height: H, isMobile: true, hasTouch: true });
  p.on('pageerror', (e) => errs.push(name + ' PAGEERROR ' + e.message)); p.on('console', (m) => { if (m.type() === 'error' && !/favicon|ERR_ABORTED/.test(m.text())) errs.push(name + ' CONSOLE ' + m.text()); });
  await p.goto(`${ORIGIN}/index.html`, { waitUntil: 'load', timeout: 60000 }); await sleep(1000);
  await p.evaluate((o) => { AC.CONFIG.db.url = o; AC.CONFIG.db.anonKey = 'chave-de-teste'; document.documentElement.style.scrollBehavior = 'auto'; }, ORIGIN);
  await p.type('#gate-code', SENHA); await p.tap('#gate-open');
  await p.waitForFunction(() => { const g = document.querySelector('#gate'); return !g || g.classList.contains('is-out'); }, { timeout: 30000 });
  await p.waitForFunction(() => document.documentElement.dataset.ready === '1', { timeout: 30000 }); await sleep(800);
  return { ctx, p };
}
const SHOTS = process.env.SHOTS; if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const snap = async (p, n) => { if (SHOTS) await p.screenshot({ path: path.join(SHOTS, n + '.png') }); };
const until = async (p, fn, ms = 15000, ...a) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn, ...a)) return true; await sleep(300); } return false; };

// ===== Aparelho da MARIA =====
const maria = await device('maria'); const pm = maria.p;
ok('banco ligado após a senha', await pm.evaluate(() => AC.db.on));
await pm.evaluate(() => { document.querySelector('#galeria').scrollIntoView(); }); await sleep(600);
ok('cartão "Enviar fotos" aparece na galeria', await pm.evaluate(() => !!document.querySelector('#btn-upload') && /banco/.test(document.querySelector('#upload-note').textContent)));
await snap(pm, '1-cartao'); await pm.evaluate(() => document.querySelector('#btn-upload').click()); await sleep(500); await snap(pm, '2-painel');
ok('painel de envio abre', await pm.evaluate(() => document.querySelector('#upload-modal').classList.contains('is-on')));
ok('sem dizer quem é, o botão fica travado', await pm.evaluate(() => document.querySelector('#upload-input').disabled === true));
await pm.evaluate(() => document.querySelector('[data-who="Maria"]').click()); await sleep(300);
ok('escolher "Maria" libera o envio', await pm.evaluate(() => document.querySelector('#upload-input').disabled === false && AC.photos.who === 'Maria'));
await pm.type('#upload-caption', 'Nosso domingo'); await snap(pm, '3-quem');
await (await pm.$('#upload-input')).uploadFile(tmp);
const sent = await until(pm, () => document.querySelectorAll('#upload-list .is-ok').length === 1, 40000);
await snap(pm, '4-enviada'); ok('foto comprimida e enviada ao banco', sent && DB.photos.length === 1);
if (DB.photos[0]) { const r = DB.photos[0]; const kb = Math.round(r.data.length * 0.75 / 1024); ok('foto reduzida (original ' + Math.round(origSize / 1024) + ' KB → ' + kb + ' KB no banco)', kb <= 560 && kb < origSize / 1024 / 3, `miniatura ${Math.round(r.thumb.length * 0.75 / 1024)} KB · ${r.w}x${r.h} · ${r.mime}`); ok('autor e legenda gravados', r.author === 'Maria' && r.caption === 'Nosso domingo'); }
ok('maior requisição ao banco coube no limite (~1 MB)', stats.bodyMax < 1100000, `${Math.round(stats.bodyMax / 1024)} KB`);
ok('aparece na galeria da própria Maria', await pm.evaluate(() => AC.MEDIA.some((m) => m.remote) && !!document.querySelector('#g-milestones [data-ms="enviadas"]')));
await pm.evaluate(() => document.querySelector('[data-close-upload]').click()); await sleep(500);

// ===== Aparelho do JOÃO (outro contexto = outro celular) =====
const joao = await device('joao'); const pj = joao.p;
ok('João vê a foto da Maria (sincronizou do banco)', await until(pj, () => AC.MEDIA.some((m) => m.remote && m.author === 'Maria'), 20000));
await pj.evaluate(() => { document.querySelector('#galeria').scrollIntoView(); }); await sleep(600);
await pj.evaluate(() => document.querySelector('#g-milestones [data-ms="enviadas"]').click()); await sleep(1200);
await snap(pj, '5-galeria-joao'); ok('filtro "Enviadas por nós" mostra 1 foto', await pj.evaluate(() => document.querySelectorAll('#masonry .tile').length === 1));
await pj.evaluate(() => document.querySelector('#masonry .tile').click()); await sleep(1200);
ok('abre no visualizador', await pj.evaluate(() => document.querySelector('.lb').classList.contains('is-on')));
await snap(pj, '6-visualizador'); ok('baixou a foto INTEIRA do banco (blob)', await until(pj, () => /^blob:/.test((document.querySelector('.lb__slide img') || {}).src || ''), 15000));
ok('legenda mostra "Nosso domingo"', await pj.evaluate(() => /Nosso domingo/.test(document.querySelector('.lb__cap').textContent)));
ok('botão de apagar disponível', await pj.evaluate(() => !document.querySelector('[data-a=del]').hidden));
await pj.evaluate(() => document.querySelector('[data-a=del]').click()); await sleep(400);
ok('1º toque só pede confirmação (nada apagado)', DB.photos.length === 1);
await pj.evaluate(() => document.querySelector('[data-a=del]').click()); await sleep(1500);
ok('2º toque apaga do banco', DB.photos.length === 0);
ok('João vê a galeria sem a foto', await pj.evaluate(() => !AC.MEDIA.some((m) => m.remote)));

// ===== Maria percebe que foi apagada =====
await pm.evaluate(() => AC.photos.sync()); await sleep(1500);
ok('Maria também deixa de ver a foto apagada', await pm.evaluate(() => !AC.MEDIA.some((m) => m.remote)));
ok('os dois aparelhos usam o mesmo token (mesma senha)', tokens.size === 1);

console.log(`== fotos enviadas (${W}x${H})`); console.log(log.join('\n')); console.log('ERROS:', errs.length ? '\n' + [...new Set(errs)].join('\n') : 'nenhum');
await b.close(); srv.close(); fs.rmSync(tmp, { force: true });
