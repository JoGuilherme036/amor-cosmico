/* ============================================================
   CONFIGURAÇÃO — tudo que é "do casal" e muda sem mexer em código.
   (Datas, frases, áudio, números, portão de senha, cápsula.)
   ============================================================ */
window.AC = window.AC || {};

AC.CONFIG = {
  couple: {
    partner1: 'João Guilherme',
    partner2: 'Maria Cândida',
    nickname: 'Bonequinha',
    metDate: '2026-04-26T00:00:00',
    datingDate: '2026-05-28T00:00:00',
    tripDate: '2026-07-28T00:00:00',
    engagementDate: '2026-08-15T00:00:00',
    octoberDate: '2026-10-13T00:00:00',
    phrases: [
      '“Uma história que o universo já conhecia.”',
      '“Você se tornou minha Bonequinha, minha melhor companhia e meu lugar de paz.”',
      '“Em Fortaleza, no show do Luan Santana, eu te pedi em casamento.”',
      '“E o mais bonito de tudo é saber que isso é só o começo da nossa vida juntos.”'
    ]
  },

  // As 5 datas oficiais (rodapé e encerramento)
  dates: [
    { iso: '2026-04-26', label: '26.04.2026 • O Começo' },
    { iso: '2026-05-28', label: '28.05.2026 • Namoro' },
    { iso: '2026-07-28', label: '28.07.2026 • Jericoacoara' },
    { iso: '2026-08-15', label: '15.08.2026 • O Pedido' },
    { iso: '2026-10-13', label: '13.10.2026 • Outubro' }
  ],

  // Trilha: duas faixas. No link publicado tocam as versões CRIPTOGRAFADAS (assets/audio/*.enc, abrem com a
  // senha do portão). Por duplo clique / servidor local tocam os MP3 de assets/audio-local/ (fora do Git).
  // "pedido" toca automaticamente nas partes do pedido de casamento (elementos com data-song="pedido").
  audio: {
    tracks: {
      principal: { title: 'Dia, Lugar e Hora', artist: 'Luan Santana', note: 'a nossa trilha', local: 'assets/audio-local/dia-lugar-e-hora.mp3' },
      pedido: { title: 'Chuva de Arroz', artist: 'Luan Santana • acústico', note: 'a trilha do pedido', local: 'assets/audio-local/chuva-de-arroz.mp3' }
    },
    narration: 'assets/audio/narracao.mp3'
  },

  // Banco de dados (Supabase). Deixe vazio para salvar só no aparelho.
  // Painel do Supabase → Project Settings → API: copie "Project URL" e a chave "anon public".
  db: { url: '', anonKey: '' },

  // Quais mídias aparecem onde (nomes dos arquivos ORIGINAIS — veja scripts/curadoria.json)
  hero: {
    main: 'IMG_3842.JPG',
    rotation: ['IMG_3842.JPG', 'FullSizeRender-11.JPEG', 'IMG_3929.JPEG'],
    orbit: ['IMG_3865.JPG', 'FullSizeRender-6.JPEG', 'IMG_1084.JPEG', 'IMG_3956.JPEG', 'FullSizeRender-8.JPEG', 'IMG_0758.JPEG', 'FullSizeRender-2.JPEG', 'IMG_3972.JPEG', '3EC12588-6F74-4E07-ACCC-D5CF0A904C10.jpg']
  },
  surprisePhoto: 'FullSizeRender-6.JPEG',
  musicStrip: ['FullSizeRender-6.JPEG', 'FullSizeRender-2.JPEG', 'FullSizeRender-1.JPEG', 'FullSizeRender-7.JPEG'],
  musicCover: 'FullSizeRender-6.JPEG',

  // Nossos Números (valores editáveis; "auto" = calculado)
  numbers: [
    { key: 'dias', label: 'Dias juntos', value: 'auto', icon: 'i-heart' },
    { key: 'fotos', label: 'Fotos', value: 'auto', icon: 'i-image' },
    { key: 'videos', label: 'Vídeos', value: 'auto', icon: 'i-film' },
    { key: 'viagens', label: 'Viagens', value: 1, icon: 'i-umbrella' },
    { key: 'shows', label: 'Show do Luan', value: 1, icon: 'i-music' },
    { key: 'cidades', label: 'Cidades', value: 2, icon: 'i-pin' },
    { key: 'sins', label: 'Vezes que ela disse sim', value: 2, icon: 'i-ring' },
    { key: 'infinito', label: 'Capítulos por escrever', value: '∞', icon: 'i-infinity' }
  ],

  // Cápsula do tempo: abre no 1º aniversário de noivado
  capsule: { openDate: '2027-08-15', label: '15.08.2027 — nosso primeiro aniversário de noivado' },

  // Portão: no link publicado pede a senha do casal (ela NÃO fica no código — veja scripts/encrypt-audio.mjs).
  gate: { hint: 'Senha do nosso universo' },

  // Em site público, defina a URL final para o cartão de compartilhamento (OG) funcionar.
  siteUrl: '',

  // Elogios para a estrela cadente  [sugestão — edite à vontade]
  compliments: [
    'Você é o meu lugar de paz. 🤍',
    'Em todos os universos, eu escolheria você.',
    'Minha Bonequinha, você ilumina qualquer céu. ✨',
    'Que sorte a minha ter você.',
    'O meu sim favorito é o seu.',
    'Cada dia com você é o meu dia favorito.'
  ],

  storage: { prefs: 'amor_cosmico_prefs_v4', favs: 'amor_cosmico_favs_v3', vows: 'amor_cosmico_vows_v1', capsule: 'amor_cosmico_capsule_v1', time: 'amor_cosmico_music_pos_v1' }
};
