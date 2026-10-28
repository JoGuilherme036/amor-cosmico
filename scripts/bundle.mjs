// Gera a versão de PRODUÇÃO a partir do dev.html:
//   build/site.css + build/app.js (minificados) e index.html apontando para eles,
//   além do sw.js com versão nova (força os celulares a pegarem a atualização).
// dev.html continua carregando os arquivos separados (bom para editar).
// Uso: cd scripts && npm run bundle
import fs from 'fs'; import path from 'path'; import crypto from 'crypto'; import { fileURLToPath } from 'url';
import { transform } from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
let html = read('dev.html');

const cssList = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map((m) => m[1]);
const jsList = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
const css = (await transform(cssList.map(read).join('\n'), { loader: 'css', minify: true })).code;
const js = (await transform(jsList.map((f) => `/* ${f} */\n` + read(f)).join(';\n'), { loader: 'js', minify: true, target: 'es2019' })).code;
// a versão também cobre o que é carregado depois (3D e blur-up), para o celular nunca ficar com cópia velha
const lazy = ['js/vendor/cosmos.js', 'js/data/lqip.js'].map((f) => (fs.existsSync(path.join(ROOT, f)) ? read(f) : '')).join('');
const hash = crypto.createHash('sha1').update(css + js + lazy).digest('hex').slice(0, 10);

fs.mkdirSync(path.join(ROOT, 'build'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'build/site.css'), css);
fs.writeFileSync(path.join(ROOT, 'build/app.js'), `window.AC_BUILD='${hash}';` + js);

html = html.replace(/<link rel="stylesheet" href="[^"]+">\n?/g, '').replace('</head>', `<link rel="stylesheet" href="build/site.css?v=${hash}">\n</head>`);
html = html.replace(/<script src="[^"]+"><\/script>\n?/g, '').replace('</body>', `<script src="build/app.js?v=${hash}"></script>\n</body>`);
html = html.replace('<!doctype html>', '<!doctype html>\n<!-- GERADO por scripts/bundle.mjs a partir de dev.html — edite o dev.html, não este arquivo -->');
fs.writeFileSync(path.join(ROOT, 'index.html'), html);

let sw = read('sw.js').replace(/const V = '[^']*';/, `const V = 'amor-cosmico-${hash}';`);
fs.writeFileSync(path.join(ROOT, 'sw.js'), sw);

console.log(`index.html + build/ prontos (css ${(css.length / 1024).toFixed(0)} KB, js ${(js.length / 1024).toFixed(0)} KB, versão ${hash})`);
