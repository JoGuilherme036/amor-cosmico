# 💫 Amor Cósmico — João Guilherme & Maria Cândida

Álbum interativo do casal: história em 6 capítulos, linha do tempo, galeria com **137 memórias (71 fotos + 66 vídeos, 19 com Live Photo)**, cenas em **3D** (galáxia, alianças, Galáxia de Memórias, iniciais e coração de estrelas), trilha que muda para **"Chuva de Arroz"** no pedido, narração, raspadinha, mural de promessas, cápsula do tempo e um **filme** automático.

**Site publicado:** https://joguilherme036.github.io/amor-cosmico/
**Senha do portão:** você sabe qual é 🤍 (ela não está escrita em nenhum arquivo do projeto)

---

## 1. Como abrir

| Jeito | Como | Observação |
|---|---|---|
| **Link** | abra o endereço acima | pede a senha; com ela, as músicas tocam e o mural sincroniza |
| **Duplo clique** | `index.html` | usa os MP3 de `assets/audio-local/` (só no seu PC); senha opcional |
| **Servidor local** | `cd scripts` → `npm run serve` → http://localhost:8080 | igual ao link (pede a senha) |

Marque **"Lembrar neste aparelho"** no portão para não digitar a senha de novo.

## 2. A trilha

- **"Dia, Lugar e Hora"** é a trilha principal.
- **"Chuva de Arroz"** entra sozinha (com transição suave) quando a história chega ao **pedido de casamento**: capítulo 5, alianças 3D, marco 15.08 da linha do tempo, Surpresa e o modal "Relembrar o nosso sim". No filme, toca no capítulo "O pedido". Ao sair dessas partes, a trilha principal volta.
- Na seção **Música** dá para escolher a faixa na mão. A escolha vale até você entrar ou sair de uma parte do pedido.
- No celular aparece um **mini player** acima da barra de baixo.

### Por que as músicas estão "criptografadas"
O repositório é público, e as músicas são do Luan Santana. Por isso o GitHub guarda só versões **criptografadas** (`assets/audio/*.enc`), que só tocam depois que alguém digita a senha no site. Os MP3 originais ficam em `assets/audio-local/`, fora do Git.

**Trocar a senha ou as músicas:** coloque os MP3 em `assets/audio-local/` (`dia-lugar-e-hora.mp3` e `chuva-de-arroz.mp3`) e rode:
```
cd scripts
npm run encrypt -- --senha "nova senha"
npm run bundle
```
Depois publique (seção 7). Quem marcou "lembrar" vai precisar digitar a senha nova.

### No celular
- A **galáxia 3D de fundo só aparece no computador**. No celular o fundo é um céu leve com poucas estrelas (mais bateria, sem travadas). As alianças, a Galáxia de Memórias e o coração do final continuam.
- No iPhone o volume do navegador não pode ser alterado por código, então lá a troca para "Chuva de Arroz" é um corte limpo (no Android e no computador há transição suave).
- Depois de trocar de música automaticamente, o site espera 7 s antes de poder trocar de novo, para não ficar "pulando" ao rolar rápido.

## 3. Banco de dados (mural, cápsula e curtidas compartilhados)

Sem banco, cada celular guarda só o que escreveu nele. Com o **Supabase** (grátis), o que um escreve aparece para o outro. Leva ~5 minutos:

1. Crie uma conta em **supabase.com** → *New project* (região São Paulo).
2. No projeto: **SQL Editor** → cole todo o conteúdo de **`supabase/schema.local.sql`** (gerado no seu PC pelo `npm run encrypt`, **não está no GitHub**, porque contém a "impressão digital" da senha) → **Run**.
3. **Project Settings → API**: copie a *Project URL* e a chave **anon public** para `js/config.js`:
   ```js
   db: { url: 'https://xxxx.supabase.co', anonKey: 'eyJ...' },
   ```
4. `cd scripts` → `npm run bundle` → publique.

**Segurança:** as tabelas ficam fechadas. O site só fala com o banco por funções que exigem o "token da sala", derivado da senha no navegador. Quem não tem a senha não lê nem escreve nada. A cápsula do tempo só pode ser lida a partir de **15.08.2027**, e as mensagens dela não podem ser apagadas.

## 4. Adicionar uma foto ou vídeo novo (3 passos)

1. Jogue o arquivo em `assets/originais/`.
2. `cd scripts` → `npm run build` → `npm run bundle`.
3. Publique (seção 7).

**Mídia repetida:** para conferir um lote novo contra o que já existe (mesmo arquivo ou a mesma cena regravada), rode `node dedupe.mjs <pasta-do-lote>` em `scripts/` antes de copiar. **Vídeos entram inteiros** (sem corte); os longos ganham compressão maior para não pesar.

Para uma mídia **entrar sempre no filme**, ponha `"film": true` nela em `scripts/curadoria.json`.

Legenda, marco e data ficam em `scripts/curadoria.json` (marcos: `encontro`, `namoro`, `familia`, `rotina`, `jeri`, `pedido`, `outubro`).

## 5. Mudar textos e datas

| O quê | Onde |
|---|---|
| Datas, frases do topo, números, faixas, banco | `js/config.js` |
| Capítulos, linha do tempo, futuro, quiz | `js/data/story.js` |
| Visual (cores, fontes) | `css/tokens.css` |
| Cenas 3D | `src/cosmos/*.js` → `npm run cosmos` |

Depois de editar: `cd scripts` → `npm run bundle`. O `index.html` é **gerado** a partir do `dev.html`. Para editar e ver na hora, sem gerar nada, abra o `dev.html`.

## 6. Comandos (pasta `scripts/`)

| Comando | Faz |
|---|---|
| `npm install` | instala as ferramentas (uma vez; precisa do Node.js LTS) |
| `npm run build` | otimiza fotos/vídeos de `assets/originais` |
| `npm run encrypt -- --senha "..."` | criptografa as músicas e gera o SQL do banco |
| `npm run cosmos` | empacota as cenas 3D (Three.js) |
| `npm run bundle` | gera `index.html` + `build/` (CSS/JS minificados) |
| `npm run serve` | abre em http://localhost:8080 |
| `AC_SENHA="..." node qa/interact.mjs prints 390x844` | testes de aceite (cofre, música, 3D, banco simulado) |
| `node qa/regression.mjs prints 390x844` | testes de regressão (galeria, lightbox, filme…) |
| `AC_SENHA="..." node qa/audio.mjs normal` ou `ios` | testa só a troca de música (celular normal e iPhone simulado) |

## 7. Publicar uma atualização

```
cd scripts && npm run bundle && cd ..
git add -A
git commit -m "o que mudou"
git push
```
O GitHub Pages atualiza o link em ~1 minuto.

## 8. Documentação técnica

- Especificação v2 (requisitos e critérios de aceite): `specs/v2-cosmos/spec.md` e `tasks.md`.
- Estrutura: `dev.html` (modelo) · `css/` · `js/core` (util, store, fx, **vault**, **audio**, **db**, lightbox) · `js/sections` · `src/cosmos` (Three.js) · `supabase/schema.sql` · `scripts/`.

## 9. Privacidade

O repositório é **público**: qualquer pessoa com o endereço consegue ver as fotos e os vídeos (vocês decidiram assim). Só a **música** e o **banco de dados** ficam protegidos pela senha. O site tem `noindex`, então o Google não o lista.
