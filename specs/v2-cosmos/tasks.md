# Tarefas v2 — ordem de execução

| # | Tarefa | Requisito | Verificação | Status |
|---|---|---|---|---|
| T1 | `.gitignore`, índice codegraph | R6.1 | `codegraph status` | ✅ |
| T2 | `scripts/encrypt-audio.mjs` + `assets/audio/*.enc` | R2.1 | arquivos gerados; decifra no QA | ✅ |
| T3 | `js/core/audio.js` v2: 2 faixas, crossfade, zonas, desbloqueio iOS, decifra | R1, R2 | QA zonas + senha | ✅ |
| T4 | Portão com senha (http) / livre (file://) | R2.2, R2.5 | QA | ✅ |
| T5 | Player de 2 faixas + mini-player mobile + aviso de troca | R1.6, R4.2 | prints | ✅ |
| T6 | `src/cosmos/*` (Three.js) → `js/vendor/cosmos.js` (IIFE) | R3 | QA `AC.cosmos.ready` | ✅ |
| T7 | Galáxia de fundo + tema + viagem com rolagem | R3.1 | prints | ✅ |
| T8 | Alianças 3D no capítulo 5 | R3.2 | prints | ✅ |
| T9 | Galáxia de Memórias 3D | R3.3 | QA abre/fecha + toque abre lightbox | ✅ |
| T10 | Partículas do final (galáxia → J♥M → coração) | R3.4 | prints | ✅ |
| T11 | Mobile: filtros em linha, barra inferior, duplo toque curtir | R4 | QA 390 sem overflow | ✅ |
| T12 | Supabase: `supabase/schema.sql`, `js/core/db.js`, mural/cápsula/curtidas | R5 | QA com mock | ✅ |
| T13 | Empacotamento `build/` + `dev.html` + `.nojekyll` | R6.2 | Lighthouse | ✅ |
| T14 | Git + repositório público + Pages | R6 | HTTP 200 no link | ✅ |
| T15 | LEIA-ME atualizado | — | — | ✅ |

## Resultado da verificação (28.10.2026)

- **Aceite** (`qa/interact.mjs`): cofre (senha errada/certa), música decifrada, "Chuva de Arroz" no pedido e volta, 3D (galáxia, alianças, final), Galáxia de Memórias, sem rolagem horizontal, banco (mock: promessa aparece em outro aparelho). Rodado em 390×844 e 1440×900, por http, `file://` e **no site publicado**. Sem erros de console.
- **Regressão** (`qa/regression.mjs`): galeria, filtros, busca, lightbox, filme, narração, raspadinha, mural, quiz, player de 2 faixas, movimento reduzido. 390, 768 e 1440; http e `file://`.
- **Lighthouse mobile no link publicado:** Desempenho ~80 · Acessibilidade 100 · Boas práticas 100 · CLS 0 · LCP ~3,0 s (meta 2,5 s — não atingida).
- **Bugs achados pelos testes e corrigidos:** timer de zona desfazia a escolha manual de faixa; cache do IntersectionObserver atrasado após salto de rolagem; `overflow: hidden` em `body`/`.finale` quebrava o `position: sticky`; `content-visibility` fazia os links do menu errarem o destino; menu não marcava seções altas; download antecipado da música (6 MB) entrava no carregamento inicial.
- **Pendente do dono:** criar o projeto no Supabase e colar URL + chave em `js/config.js` (R5 funciona localmente até lá).
