// Monta a pasta "dist/" só com o que vai para a internet (sem as fotos originais pesadas),
// com CSS e JS agrupados + minificados (menos pedidos, carrega mais rápido), e cria amor-cosmico-site.zip.
// Uso: cd scripts && npm run pack
// O site "de trabalho" (css/, js/ separados) continua intacto e funcionando por duplo clique.
import fs from 'fs'; import path from 'path'; import { execFileSync } from 'child_process'; import { fileURLToPath } from 'url';
import { transform } from 'esbuild';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const COPY = ['manifest.webmanifest', 'js/data/lqip.js', 'assets/img', 'assets/video', 'assets/audio', 'assets/fonts', 'assets/fx', 'assets/icons', 'assets/og.jpg'];

fs.rmSync(DIST, { recursive: true, force: true });
let bytes = 0, files = 0;
function copy(from, to) {
  const st = fs.statSync(from);
  if (st.isDirectory()) { fs.mkdirSync(to, { recursive: true }); for (const f of fs.readdirSync(from)) copy(path.join(from, f), path.join(to, f)); }
  else { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to); bytes += st.size; files++; }
}
for (const rel of COPY) { const src = path.join(ROOT, rel); if (fs.existsSync(src)) copy(src, path.join(DIST, rel)); else console.warn('  (faltando, ignorado):', rel); }

// ---- HTML: descobre a ordem dos CSS/JS e troca por 1 arquivo de cada ----
let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const cssList = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map((m) => m[1]);
const jsList = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const css = (await transform(cssList.map(read).join('\n'), { loader: 'css', minify: true })).code;
const js = (await transform(jsList.map((f) => `/* ${f} */\n` + read(f)).join(';\n'), { loader: 'js', minify: true, target: 'es2019' })).code;
fs.mkdirSync(path.join(DIST, 'css'), { recursive: true }); fs.mkdirSync(path.join(DIST, 'js'), { recursive: true });
fs.writeFileSync(path.join(DIST, 'css/site.css'), css); fs.writeFileSync(path.join(DIST, 'js/app.js'), js);
html = html.replace(/<link rel="stylesheet" href="[^"]+">\n?/g, '').replace('</head>', '<link rel="stylesheet" href="css/site.css">\n</head>');
html = html.replace(/<script src="[^"]+"><\/script>\n?/g, '').replace('</body>', '<script src="js/app.js"></script>\n</body>');
fs.writeFileSync(path.join(DIST, 'index.html'), html);

// ---- service worker com a lista de arquivos da versão empacotada ----
let sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
sw = sw.replace(/const SHELL = \[[\s\S]*?\];/, "const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'css/site.css', 'js/app.js', 'assets/fx/grain.png', 'assets/icons/icon-192.png', 'assets/og.jpg'];");
fs.writeFileSync(path.join(DIST, 'sw.js'), sw);

// ---- cabeçalhos para Netlify / Cloudflare Pages ----
fs.writeFileSync(path.join(DIST, '_headers'), '/*\n  X-Robots-Tag: noindex, nofollow\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n/sw.js\n  Cache-Control: no-cache\n');

for (const f of ['index.html', 'css/site.css', 'js/app.js', 'sw.js', '_headers']) { const s = fs.statSync(path.join(DIST, f)).size; bytes += s; files++; }
console.log(`dist/ pronto: ${files} arquivos, ${(bytes / 1e6).toFixed(0)} MB  (css ${(css.length / 1024).toFixed(0)} KB, js ${(js.length / 1024).toFixed(0)} KB, html ${(html.length / 1024).toFixed(0)} KB)`);

const zip = path.join(ROOT, 'amor-cosmico-site.zip');
if (!process.argv.includes('--no-zip')) {
  try {
    fs.rmSync(zip, { force: true });
    execFileSync('tar', ['-a', '-c', '-f', zip, '-C', DIST, '.'], { stdio: 'inherit' }); // tar moderno cria .zip com -a
    console.log('ZIP criado:', zip, `(${(fs.statSync(zip).size / 1e6).toFixed(0)} MB)`);
  } catch { console.log('Não consegui criar o .zip automaticamente — compacte a pasta dist/ manualmente.'); }
}
