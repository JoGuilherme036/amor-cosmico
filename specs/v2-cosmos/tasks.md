# Tarefas v2 — ordem de execução

| # | Tarefa | Requisito | Verificação |
|---|---|---|---|
| T1 | `.gitignore`, índice codegraph | R6.1 | `codegraph status` |
| T2 | `scripts/encrypt-audio.mjs` + `assets/audio/*.enc` | R2.1 | arquivos gerados; decifra no QA |
| T3 | `js/core/audio.js` v2: 2 faixas, crossfade, zonas, desbloqueio iOS, decifra | R1, R2 | QA zonas + senha |
| T4 | Portão com senha (http) / livre (file://) | R2.2, R2.5 | QA |
| T5 | Player de 2 faixas + mini-player mobile + aviso de troca | R1.6, R4.2 | prints |
| T6 | `src/cosmos/*` (Three.js) → `js/vendor/cosmos.js` (IIFE) | R3 | QA `AC.cosmos.ready` |
| T7 | Galáxia de fundo + tema + viagem com rolagem | R3.1 | prints |
| T8 | Alianças 3D no capítulo 5 | R3.2 | prints |
| T9 | Galáxia de Memórias 3D | R3.3 | QA abre/fecha + toque abre lightbox |
| T10 | Partículas do final (galáxia → J♥M → coração) | R3.4 | prints |
| T11 | Mobile: filtros em linha, barra inferior, duplo toque curtir | R4 | QA 390 sem overflow |
| T12 | Supabase: `supabase/schema.sql`, `js/core/db.js`, mural/cápsula/curtidas | R5 | QA com mock |
| T13 | Empacotamento `build/` + `dev.html` + `.nojekyll` | R6.2 | Lighthouse |
| T14 | Git + repositório público + Pages | R6 | HTTP 200 no link |
| T15 | LEIA-ME atualizado | — | — |
