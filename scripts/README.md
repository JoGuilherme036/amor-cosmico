# scripts/ — ferramentas do site

Precisam do **Node.js** (veja o LEIA-ME na raiz para instalar no Windows). Na primeira vez: `npm install`.

| Comando | O que faz |
|---|---|
| `npm run build` | Lê `assets/originais/`, gera `assets/img` (AVIF/WebP/JPG em 480/960/1600/2400 px + miniatura 112 px) e `assets/video` (MP4 H.264 até 720p + pôster), lê a data do EXIF, calcula cor dominante e blur-up (LQIP) e escreve `js/data/media.js`. Só processa o que ainda não existe. `--force` refaz tudo. |
| `npm run assets` | Recria grão de filme, ícones do app e a imagem de compartilhamento (`assets/og.jpg`). |
| `npm run pack` | Cria `dist/` + `amor-cosmico-site.zip` com tudo que vai para a internet (sem `assets/originais`). |
| `npm run qa` | Teste automático (abre o site num Chrome sem janela e percorre portão, galeria, lightbox, cinema, narração, raspadinha, mural e preferências). |

## curadoria.json
Legendas, `alt`, marco (`milestone`), data, favoritas e **pares Live Photo** (foto + `.MOV`). Chave = nome do arquivo original.
`hidden: true` esconde uma mídia. `s: true` marca legenda **sugerida** (ainda não revisada por vocês).

## Observações
* Vídeos com mais de 75 s são cortados em 75 s (o site é um álbum, não um arquivo). Para mudar: `MAX_VIDEO_SECONDS` em `build-media.mjs`.
* Datas: o EXIF das fotos é lido como horário de Brasília. Vídeos exportados costumam trazer a data da exportação, por isso as datas dos vídeos estão em `curadoria.json`.
