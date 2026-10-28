# Spec v2 — "Cosmos": 3D, trilha que muda no pedido, mobile, banco e publicação

Status: **implementada e testada** (QA automático: `scripts/qa`) · Dono: João Guilherme · Data: 28.10.2026
Base: v1 (site estático modular, pipeline de mídia, QA automatizado).

## 1. Objetivo
Elevar o álbum a uma experiência cinematográfica em 3D (Three.js), com a trilha trocando para
**"Chuva de Arroz"** no momento do pedido, melhor no celular, com dados compartilhados (Supabase)
e publicado num link (GitHub Pages) que **só o casal consegue ouvir/usar** (senha).

## 2. Restrições (não negociáveis)
- C1. Textos pessoais, nomes e datas idênticos aos atuais.
- C2. Continua abrindo por **duplo clique** (`file://`) — nada de módulos ES em runtime; 3D vem num bundle IIFE.
- C3. Nada crítico em CDN. Three.js é empacotado localmente.
- C4. Os MP3 de terceiros **nunca** ficam em claro no repositório público: só versão criptografada (AES-GCM, chave derivada da senha com PBKDF2). A senha **não** fica no código.
- C5. `prefers-reduced-motion` / "movimento reduzido" e aparelhos sem WebGL caem para o céu 2D atual, sem erro.
- C6. Sem erros no console nos 3 tamanhos (390×844, 768×1024, 1440×900), por http e `file://`.

## 3. Requisitos e critérios de aceite

### R1 — Trilha dupla com troca automática no pedido
- R1.1 Duas faixas: `principal` ("Dia, Lugar e Hora") e `pedido` ("Chuva de Arroz").
- R1.2 Zonas `[data-song="pedido"]` (capítulo 5, palco das alianças, marco 15.08 da linha do tempo, Surpresa, modal "nosso sim") tocam `pedido`; fora delas, `principal`.
- R1.3 Troca com **crossfade** (~1,6 s) e histerese (a zona precisa dominar a tela por ~0,9 s) — sem "pisca-pisca" ao rolar na fronteira.
- R1.4 Se a música estiver pausada, a troca só muda a faixa "da vez" (não toca sozinha).
- R1.5 Cada faixa guarda a própria posição; "Chuva de Arroz" começa do início na 1ª entrada.
- R1.6 Um aviso discreto ("♪ Chuva de Arroz") aparece na troca; o player da seção Música vira uma lista de 2 faixas com seleção manual.
- R1.7 Modo Cinema toca `pedido` no capítulo "O pedido" e `principal` no resto.
- **Aceite:** teste automático rola até `#cap-5` e verifica `AC.audio.track === 'pedido'`; volta ao topo e verifica `'principal'`.

### R2 — Áudio protegido por senha no site público
- R2.1 `npm run encrypt` gera `assets/audio/*.enc` (sal+iv+cifra) e `assets/audio/check.enc` a partir dos MP3 locais.
- R2.2 Em http(s), o portão exige a senha; ela é validada **decifrando** `check.enc` (sem guardar a senha). Senha errada → mensagem amigável.
- R2.3 Com a senha certa, os MP3 são decifrados no navegador (WebCrypto) e tocados via Blob URL. O download dos `.enc` começa enquanto o portão está aberto.
- R2.4 iOS: o elemento de áudio é "destravado" no toque do portão (antes de qualquer `await`), para a música poder começar depois de decifrar.
- R2.5 Em `file://` usa os MP3 em claro, se existirem; sem eles, fundo sintetizado (como hoje).
- **Aceite:** teste http com senha errada mantém o portão; com a certa, `AC.audio.state.playing === true`.

### R3 — Cenas 3D (Three.js)
- R3.1 **Galáxia** de fundo (substitui o céu 2D quando há WebGL): espiral de partículas com brilho, nebulosas, cor que segue o tema da seção, câmera que viaja com a rolagem, parallax do dedo/mouse/giroscópio, "viagem estelar" ao segurar o botão.
- R3.2 **Alianças 3D** no capítulo do pedido: duas alianças de ouro entrelaçadas com diamante, reflexos realistas, partículas de coração; arrastar gira; toque dá um giro + brilho.
- R3.3 **Galáxia de Memórias** (substitui a Parede de Estrelas em 3D): fotos numa esfera/espiral, arrastar/pinçar para girar e aproximar, toque abre o lightbox.
- R3.4 **Final**: partículas que se transformam galáxia → "J ♥ M" → coração conforme a rolagem.
- R3.5 Performance: DPR ≤ 1,75 (celular), contagem de partículas adaptativa, cada cena só renderiza quando visível e pausa com a aba oculta; o bundle 3D carrega **depois** da 1ª pintura.
- **Aceite:** QA confirma `AC.cosmos.ready === true` e canvas WebGL presentes, sem erros; com movimento reduzido nenhuma cena 3D anima.

### R4 — Mobile
- R4.1 Filtros da galeria numa linha rolável (sem ocupar meia tela); ferramentas compactas.
- R4.2 Mini-player flutuante acima da barra inferior com faixa atual e play/pause.
- R4.3 Indicador animado na barra inferior; alvos de toque ≥ 44 px; vibração curta nos toques principais.
- R4.4 Duplo toque numa foto do lightbox = curtir (coração animado).
- R4.5 Sem rolagem horizontal; safe-areas respeitadas.
- **Aceite:** QA 390×844 sem `overflowX`, prints revisados.

### R5 — Banco de dados (Supabase)
- R5.1 Tabelas: `vows` (mural), `capsule` (cápsula), `hearts` (curtidas). SQL versionado em `supabase/schema.sql`.
- R5.2 Segurança: tabelas fechadas (RLS sem políticas); acesso só por funções RPC que recebem o token da sala (derivado da senha) e comparam o **SHA-256**. A cápsula só pode ser lida a partir de 15.08.2027 e nunca é apagada pela API; promessas podem ser apagadas por quem tem o token.
- R5.3 Cliente leve (fetch REST, sem SDK). Sem configuração → funciona como hoje (localStorage). Com falha de rede → mantém o local e sincroniza depois.
- **Aceite:** QA com um mock da API REST: promessa enviada aparece em outro "aparelho" (contexto limpo).

### R6 — Publicação
- R6.1 Repositório público `amor-cosmico` no GitHub de JoGuilherme036, sem originais, sem MP3 em claro, sem `node_modules`.
- R6.2 GitHub Pages servindo a raiz do branch `main` (com `.nojekyll`), carregando CSS/JS empacotados (`build/`). `dev.html` carrega os fontes separados.
- R6.3 Link final testado (HTTP 200 nas páginas e mídias).

## 4. Fora do escopo
Cartas e playlist (sem conteúdo fornecido), cidade de origem no mapa, contas/login individuais.
