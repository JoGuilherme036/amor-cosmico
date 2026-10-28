// Criptografa as músicas para o repositório PÚBLICO (só tocam com a senha do casal).
// Uso: cd scripts && npm run encrypt -- --senha "sua senha"
//
// Entrada:  assets/audio-local/dia-lugar-e-hora.mp3 e chuva-de-arroz.mp3 (fora do Git)
// Saída:    js/data/vault.js (sal + iterações + "prova" cifrada — público, sem a senha)
//           assets/audio/principal.enc, pedido.enc (AES-256-GCM)
//           supabase/schema.local.sql (SQL do banco já com o hash do token — NÃO vai para o Git)
//
// A senha nunca é gravada. Da senha (PBKDF2-SHA256) saem 64 bytes:
//   32 primeiros = chave AES dos áudios · 32 últimos = "token da sala" usado no banco de dados.
import fs from 'fs'; import path from 'path'; import crypto from 'crypto'; import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCAL = path.join(ROOT, 'assets/audio-local'), OUT = path.join(ROOT, 'assets/audio');
const ITER = 310000;
const TRACKS = [['principal', 'dia-lugar-e-hora.mp3'], ['pedido', 'chuva-de-arroz.mp3']];

const arg = process.argv.indexOf('--senha');
const raw = arg > 0 ? process.argv[arg + 1] : process.env.AC_SENHA;
if (!raw) { console.error('Informe a senha: npm run encrypt -- --senha "sua senha"'); process.exit(1); }
// mesma normalização do navegador (js/core/vault.js): minúsculas, sem acentos, sem espaços
const senha = raw.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, '');
if (senha.length < 8) { console.error('Use uma senha com pelo menos 8 caracteres.'); process.exit(1); }

const salt = crypto.randomBytes(16);
const bits = crypto.pbkdf2Sync(senha, salt, ITER, 64, 'sha256');
const key = bits.subarray(0, 32), token = bits.subarray(32).toString('hex');
const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

const seal = (buf) => {
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([c.update(buf), c.final()]);
  return Buffer.concat([Buffer.from('ACE1'), iv, enc, c.getAuthTag()]); // formato: "ACE1" | iv(12) | cifra | tag(16)
};

fs.mkdirSync(OUT, { recursive: true });
// vault.js é um script clássico (funciona até por duplo clique, onde fetch() de arquivo local é bloqueado)
const vault = { v: 1, salt: salt.toString('base64'), iter: ITER, check: seal(Buffer.from('amor-cosmico-ok')).toString('base64'), tracks: {} };
for (const [name, file] of TRACKS) {
  const src = path.join(LOCAL, file);
  if (!fs.existsSync(src)) { console.warn(`  (faltando ${path.relative(ROOT, src)} — pulei "${name}")`); continue; }
  const out = seal(fs.readFileSync(src));
  fs.writeFileSync(path.join(OUT, name + '.enc'), out);
  vault.tracks[name] = `assets/audio/${name}.enc`;
  console.log(`  ${name}.enc  ${(out.length / 1e6).toFixed(1)} MB`);
}

fs.writeFileSync(path.join(ROOT, 'js/data/vault.js'), `// GERADO por scripts/encrypt-audio.mjs — dados PÚBLICOS para validar a senha (a senha não está aqui)
window.VAULT = ${JSON.stringify(vault)};
`);

// SQL do banco com o hash do token (arquivo local, ignorado pelo Git)
const schema = path.join(ROOT, 'supabase/schema.sql');
if (fs.existsSync(schema)) {
  fs.writeFileSync(path.join(ROOT, 'supabase/schema.local.sql'), fs.readFileSync(schema, 'utf8').replaceAll('__ROOM_TOKEN_SHA256__', tokenHash));
  console.log('  supabase/schema.local.sql gerado (cole no SQL Editor do Supabase)');
}
console.log('Pronto. Áudios criptografados; a senha não foi salva em lugar nenhum.');
