// Teste de aceite (spec v2) — node qa/interact.mjs <pasta-de-prints> [LxA] [http|file]
// A senha NÃO fica aqui: passe pela variável de ambiente AC_SENHA (sem ela, os testes do cofre são pulados).
// Inclui um "Supabase de mentira" (POST /rest/v1/rpc/*) para testar o banco sem conta.
import puppeteer from 'puppeteer-core'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = process.argv[2]; const [W, H] = (process.argv[3] || '390x844').split('x').map(Number); const mode = process.argv[4] || 'http';
const SENHA = process.env.AC_SENHA || '';
fs.mkdirSync(OUT, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.avif': 'image/avif', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.enc': 'application/octet-stream', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };

// ---- mock do Supabase ----
const DB = { vows: [], hearts: [], capsule: [] }; let nextId = 1; const tokens = new Set();
function rpc(fn, body) {
  if (!body.p_token) return [403, { message: 'acesso negado' }];
  tokens.add(body.p_token);
  if (fn === 'vows_list') return [200, DB.vows.slice().reverse()];
  if (fn === 'vows_add') { const r = { id: nextId++, author: body.p_author, text: body.p_text, created_at: new Date().toISOString() }; DB.vows.push(r); return [200, r]; }
  if (fn === 'vows_delete') { DB.vows = DB.vows.filter((v) => v.id !== body.p_id); return [204, null]; }
  if (fn === 'capsule_add') { DB.capsule.push(body); return [204, null]; }
  if (fn === 'capsule_count') return [200, DB.capsule.length];
  if (fn === 'hearts_add') { DB.hearts.push(body.p_media); return [204, null]; }
  if (fn === 'heart_counts') { const m = {}; DB.hearts.forEach((h) => (m[h] = (m[h] || 0) + 1)); return [200, Object.entries(m).map(([media_id, total]) => ({ media_id, total }))]; }
  if (fn === 'photos_list') return [200, []]; if (fn === 'photos_ids') return [200, []];
  return [404, { message: 'função desconhecida: ' + fn }];
}
const srv = http.createServer((req, res) => {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
  if (req.url.startsWith('/rest/v1/rpc/')) {
    if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
    let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => { const [st, body] = rpc(req.url.split('/').pop(), JSON.parse(b || '{}')); res.writeHead(st, { ...cors, 'Content-Type': 'application/json' }); res.end(body == null ? '' : JSON.stringify(body)); });
    return;
  }
  const p = decodeURIComponent(req.url.split('?')[0]); const f = path.join(ROOT, p === '/' ? 'index.html' : p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  const st = fs.statSync(f), ext = path.extname(f), range = req.headers.range;
  if (range) { const [a, b] = range.replace('bytes=', '').split('-'); const s = +a, e = b ? +b : st.size - 1; res.writeHead(206, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Content-Range': `bytes ${s}-${e}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': e - s + 1 }); fs.createReadStream(f, { start: s, end: e }).pipe(res); }
  else { res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Content-Length': st.size, 'Accept-Ranges': 'bytes' }); fs.createReadStream(f).pipe(res); }
}).listen(0);
const ORIGIN = `http://localhost:${srv.address().port}`;

const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--allow-file-access-from-files', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const log = []; const errs = [];
const ok = (n, v) => log.push((v ? 'OK   ' : 'FALHA') + ' ' + n);
const skip = (n) => log.push('PULO  ' + n);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// modos: http (servidor local + banco simulado) · file (duplo clique) · remote (site publicado em AC_URL, sem banco)
const url = mode === 'file' ? 'file:///' + ROOT.split(path.sep).join('/') + '/index.html' : mode === 'remote' ? process.env.AC_URL : `${ORIGIN}/index.html`;

async function newPage(ctx) {
  const p = await ctx.newPage(); await p.setViewport({ width: W, height: H, isMobile: W < 700, hasTouch: W < 700 });
  p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/favicon|ERR_ABORTED|net::ERR_FILE_NOT_FOUND.*audio-local/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await p.goto(url, { waitUntil: 'networkidle2' });
  if (mode === 'http') await p.evaluate((o) => { AC.CONFIG.db.url = o; AC.CONFIG.db.anonKey = 'chave-de-teste'; }, ORIGIN);
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; }); // rolagem instantânea nos testes
  await sleep(900);
  return p;
}
async function enter(p) {
  const needs = await p.evaluate(() => AC.vault.required);
  if (needs && !SENHA) return false;
  if (needs) {
    await p.type('#gate-code', 'senha-errada'); await p.click('#gate-open');
    await p.waitForFunction(() => /não é a nossa/.test(document.querySelector('#gate-err').textContent), { timeout: 20000 }).catch(() => {});
    ok('cofre: senha errada mantém o portão', await p.evaluate(() => !!document.querySelector('#gate') && !document.querySelector('#gate').classList.contains('is-out')));
    await p.evaluate(() => { document.querySelector('#gate-code').value = ''; });
    await p.type('#gate-code', SENHA);
  }
  await p.click('#gate-open'); await sleep(3500);
  return true;
}

const ctx = await b.createBrowserContext();
const p = await newPage(ctx);
const ev = (f, ...a) => p.evaluate(f, ...a); const shot = (n) => p.screenshot({ path: path.join(OUT, `v2-${W}-${n}.png`) });
await shot('portao');
const entered = await enter(p);
if (!entered) { skip('cofre (defina AC_SENHA)'); await p.goto(url + '?portao=0', { waitUntil: 'networkidle2' }); await sleep(1500); }
else {
  ok('portão saiu', await ev(() => { const g = document.querySelector('#gate'); return !g || g.classList.contains('is-out'); }));
  ok('música tocando', await ev(() => AC.audio.state.playing));
  if (mode !== 'file') ok('cofre: música decifrada (Blob)', await ev(() => (AC.audio.tracks.principal.el.src || '').startsWith('blob:')));
}

// 3D (desktop: carrega logo; celular: só ao chegar perto das alianças/final)
if (W <= 820) { ok('celular: 3D ainda NÃO carregou no início (poupa dados)', await ev(() => !(AC.cosmos && AC.cosmos.ready))); await ev(() => document.querySelector('[data-rings]').scrollIntoView({ block: 'center' })); await sleep(800); }
else { await ev(() => window.scrollTo(0, 400)); await sleep(500); }
for (let i = 0; i < 20 && !(await ev(() => !!(AC.cosmos && AC.cosmos.ready))); i++) await sleep(500);
ok('3D carregou (AC.cosmos.ready)', await ev(() => !!(AC.cosmos && AC.cosmos.ready)));
// desktop: galáxia 3D no fundo · celular/tablet (<= 820 px ou toque): NÃO monta a galáxia (só o céu 2D leve)
if (W <= 820) ok('celular: sem galáxia 3D (céu 2D leve)', await ev(() => !document.querySelector('#cosmos-bg') && getComputedStyle(document.querySelector('#starfield')).display !== 'none'));
else ok('desktop: galáxia 3D no fundo', await ev(() => !!document.querySelector('#cosmos-bg.is-on')));
await ev(() => window.scrollTo(0, 0)); await sleep(1200); await shot('hero');

// troca de música no pedido
if (entered) {
  const until = async (fn, ms = 16000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(fn)) return true; await sleep(300); } return false; };
  await ev(() => document.querySelector('#cap-5').scrollIntoView()); await sleep(600);
  await ev(() => document.querySelector('[data-rings]').scrollIntoView({ block: 'center' }));
  ok('pedido → "Chuva de Arroz"', await until(() => AC.audio.track === 'pedido'));
  ok('alianças 3D montadas', await until(() => !!document.querySelector('[data-rings].is-3d')));
  await shot('aliancas');
  await ev(() => window.scrollTo(0, 0));
  ok('fora do pedido → "Dia, Lugar e Hora"', await until(() => AC.audio.track === 'principal'));
} else skip('troca de música (precisa entrar com som)');

// final
await ev(() => { const f = document.querySelector('#finale3d'); window.scrollTo(0, f.getBoundingClientRect().top + scrollY + (f.offsetHeight - innerHeight) * 0.45); }); await sleep(6000); // meio do patamar das iniciais
ok('final 3D montado', await ev(() => !!document.querySelector('#finale3d.is-3d')));
await shot('final-iniciais');
await ev(() => { const f = document.querySelector('#finale3d'); window.scrollTo(0, f.getBoundingClientRect().top + scrollY + f.offsetHeight - innerHeight - 10); }); await sleep(2200);
await shot('final-coracao');

// galáxia de memórias
await ev(() => document.querySelector('#galeria').scrollIntoView()); await sleep(800);
await ev(() => document.querySelector('#g-starwall').click()); await sleep(3500); await shot('memorias');
const memOk = mode !== 'file' ? await ev(() => !!document.querySelector('.mg.is-on')) : await ev(() => !!document.querySelector('.sw.is-on'));
ok(mode !== 'file' ? 'Galáxia de Memórias 3D abre' : 'Parede de Estrelas 2D abre (file://)', memOk);
await p.keyboard.press('Escape'); await sleep(700);

// layout
ok('sem rolagem horizontal', await ev(() => document.documentElement.scrollWidth <= innerWidth + 1));

// banco (mock): promessa feita aqui aparece em outro "aparelho"
if (mode === 'http' && entered) {
  ok('banco ligado após a senha', await ev(() => AC.db.on));
  await ev(() => document.querySelector('#vows').scrollIntoView()); await sleep(600);
  await p.type('#vow-author', 'Teste'); await p.type('#vow-text', 'Promessa compartilhada'); await p.evaluate(() => document.querySelector('#vow-form button[type=submit]').click()); await sleep(1200);
  ok('promessa foi para o banco', DB.vows.some((v) => v.text === 'Promessa compartilhada'));
  const ctx2 = await b.createBrowserContext(); const p2 = await newPage(ctx2); await enter(p2); await sleep(1500);
  const seen = await p2.evaluate(() => [...document.querySelectorAll('.vow p')].some((e) => e.textContent.includes('Promessa compartilhada')));
  ok('outro aparelho vê a promessa', seen);
  if (!seen) console.log('DEBUG p2', await p2.evaluate(() => JSON.stringify({ on: AC.db.on, tok: !!AC.vault.token, gate: !!document.querySelector('#gate:not(.is-out)'), err: (document.querySelector('#gate-err') || {}).textContent, status: (document.querySelector('#vow-status') || {}).textContent, vows: [...document.querySelectorAll('.vow p')].map((e) => e.textContent.slice(0, 30)) })));
  ok('token igual nos dois aparelhos (mesma senha)', tokens.size === 1);
  await ctx2.close();
} else skip('banco (só no modo http com senha)');

console.log(log.join('\n')); console.log('ERROS:', errs.length ? '\n' + [...new Set(errs)].join('\n') : 'nenhum');
await b.close(); srv.close();
