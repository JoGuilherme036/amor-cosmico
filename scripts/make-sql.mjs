// Gera supabase/schema.local.sql (com o hash do token) SEM mexer nas músicas nem na senha.
// Uso: cd scripts && npm run sql -- --senha "sua senha"      (ou AC_SENHA="..." npm run sql)
// Lê o "sal" já publicado em js/data/vault.js, então o token é o MESMO que o site usa.
import fs from 'fs'; import path from 'path'; import crypto from 'crypto'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = process.argv.indexOf('--senha'); const raw = arg > 0 ? process.argv[arg + 1] : process.env.AC_SENHA;
if (!raw) { console.error('Informe a senha: npm run sql -- --senha "sua senha"'); process.exit(1); }
const vaultSrc = fs.readFileSync(path.join(ROOT, 'js/data/vault.js'), 'utf8');
const V = JSON.parse(vaultSrc.slice(vaultSrc.indexOf('{'), vaultSrc.lastIndexOf('}') + 1));
const senha = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ''); // mesma normalização do site
const bits = crypto.pbkdf2Sync(senha, Buffer.from(V.salt, 'base64'), V.iter, 64, 'sha256');
// confere se a senha é a certa: tenta decifrar a "prova" do cofre
try {
  const buf = Buffer.from(V.check, 'base64'); const d = crypto.createDecipheriv('aes-256-gcm', bits.subarray(0, 32), buf.subarray(4, 16)); d.setAuthTag(buf.subarray(buf.length - 16));
  Buffer.concat([d.update(buf.subarray(16, buf.length - 16)), d.final()]);
} catch { console.error('Essa senha NÃO é a do cofre do site — o banco ficaria inacessível. Confira a senha.'); process.exit(2); }
const token = bits.subarray(32).toString('hex'), hash = crypto.createHash('sha256').update(token).digest('hex');
fs.writeFileSync(path.join(ROOT, 'supabase/schema.local.sql'), fs.readFileSync(path.join(ROOT, 'supabase/schema.sql'), 'utf8').replaceAll('__ROOM_TOKEN_SHA256__', hash));
console.log('supabase/schema.local.sql gerado (senha conferida). Cole o conteúdo no SQL Editor do Supabase → Run.');
