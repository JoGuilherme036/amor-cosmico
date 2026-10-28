// Empacota as cenas 3D (src/cosmos/*.js + Three.js) num único script clássico: js/vendor/cosmos.js
// Uso: cd scripts && npm run cosmos   (rode de novo sempre que mexer em src/cosmos)
import { build } from 'esbuild'; import path from 'path'; import fs from 'fs'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '..');
const out = path.join(ROOT, 'js/vendor/cosmos.js');
await build({
  entryPoints: [path.join(ROOT, 'src/cosmos/index.js')],
  bundle: true, format: 'iife', minify: true, target: 'es2020', outfile: out,
  nodePaths: [path.join(HERE, 'node_modules')], // "three" mora em scripts/node_modules
  legalComments: 'eof', logLevel: 'warning',
  banner: { js: '/* Amor Cósmico — cenas 3D (gerado por scripts/build-cosmos.mjs a partir de src/cosmos). Three.js © mrdoob e colaboradores, licença MIT. */' }
});
console.log(`js/vendor/cosmos.js  ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
