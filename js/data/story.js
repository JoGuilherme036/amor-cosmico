/* ============================================================
   DADOS DA HISTÓRIA — textos pessoais (idênticos aos originais).
   Mídias são referenciadas pelo NOME DO ARQUIVO ORIGINAL.
   ============================================================ */
window.AC = window.AC || {};

AC.UNIVERSE = [
  {
    id: 'destino', accent: '#00CFFF', photo: 'FullSizeRender-12.JPEG',
    subtitle: 'Fragmento I • A Coincidência & O Começo', title: 'O Destino',
    short: 'Nossas famílias já se conheciam há anos e, no dia 26 de abril de 2026, nossa primeira ficada deu início a tudo.',
    full: 'Nossas famílias já se conheciam havia muitos anos — era apenas uma questão de tempo até nossos caminhos se cruzarem de verdade. Deus sabia exatamente o momento certo: no dia 26 de abril de 2026 tivemos a nossa primeira ficada, e ali nasceu uma conexão que cresceu com naturalidade, carinho e vontade de estar perto um do outro.',
    points: [{ x: 25, y: 75 }, { x: 48, y: 35 }, { x: 78, y: 25 }, { x: 70, y: 68 }], lines: [[0, 1], [1, 2], [1, 3]]
  },
  {
    id: 'encaixe', accent: '#B983FF', photo: 'IMG_0758.JPEG',
    subtitle: 'Fragmento II • O Príncipe & A Bonequinha', title: 'O Encaixe Perfeito',
    short: 'Com histórias diferentes, nos tornamos a dupla perfeita: eu sou o seu príncipe e você é a minha eterna Bonequinha e meu lugar de paz.',
    full: 'Com histórias completamente diferentes, nos tornamos a dupla perfeita. Eu sou o seu príncipe, e você se tornou minha eterna Bonequinha, minha melhor companhia e meu lugar de paz. Nossa relação é construída nos pequenos detalhes: nas conversas leves, no cuidado quando um está cansado e na alegria de compartilhar cada conquista.',
    points: [{ x: 20, y: 50 }, { x: 50, y: 22 }, { x: 80, y: 50 }, { x: 50, y: 78 }], lines: [[0, 1], [1, 2], [2, 3], [3, 0], [1, 3]]
  },
  {
    id: 'certeza', accent: '#FF5A9D', photo: 'IMG_3865.JPG',
    subtitle: 'Fragmento III • Namoro, Jeri & Noivado', title: 'A Nossa Certeza',
    short: 'Do pedido de namoro em 28/05 e nossa viagem a Jericoacoara em 28/07 ao pedido de casamento em Fortaleza em 15/08/2026.',
    full: 'Em tão pouco tempo, vivemos sentimentos capazes de preencher um universo inteiro: oficializamos nosso namoro em 28 de maio de 2026, fizemos nossa primeira viagem juntos para Jericoacoara em 28 de julho e, em 15 de agosto de 2026, no show do Luan Santana em Fortaleza, eu te pedi em casamento.',
    points: [{ x: 18, y: 62 }, { x: 38, y: 30 }, { x: 62, y: 30 }, { x: 82, y: 62 }, { x: 50, y: 78 }], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]]
  }
];

AC.UNIVERSE_STRIP = ['IMG_3842.JPG', 'IMG_1084.JPEG', 'FullSizeRender-8.JPEG', 'IMG_3956.JPEG', 'FullSizeRender-2.JPEG', 'IMG_0759.JPEG', 'IMG_3929.JPEG', 'FullSizeRender-4.JPEG', 'IMG_3868.JPG', 'D3751707-EA42-4C48-8B95-AD31CFD2D762.JPEG'];

/* Capítulos. `open` = mídia de abertura; `blocks` = figuras intercaladas depois do parágrafo `after`.
   Tipos de bloco: pair (2 fotos, uma sobreposta à outra), wide (1 mídia larga), strip (galeria arrastável). */
AC.CHAPTERS = [
  {
    n: 1, sky: 'origem', accent: '#7A9BFF', open: null,
    title: 'Antes de nós: O Príncipe e a Bonequinha', badge: 'Destinos cruzados',
    milestone: 'A preparação do universo antes do nosso dia 26 de abril de 2026.',
    quote: 'Talvez ainda não fosse a hora certa. Talvez ambos precisassem amadurecer suas dores antes de viver algo tão intenso.',
    paragraphs: [
      'Era uma vez um príncipe que passou grande parte da vida acreditando que o amor verdadeiro talvez não tivesse sido feito para ele. Depois de tantas frustrações, decepções e cicatrizes deixadas pelo passado, seu coração havia aprendido a sentir medo. Medo de se entregar, medo de criar expectativas e, principalmente, medo de sofrer novamente.',
      'E em algum lugar do mundo existia uma pequena Bonequinha. Ela era delicada por fora, mas carregava dentro de si uma força enorme. Também tinha seus receios. Por ser mais velha, sentia que sobre seus ombros existiam responsabilidades, julgamentos e uma pressão constante sobre cada escolha que fazia. Se envolver com alguém parecia assustador. Amar alguém parecia ainda mais.',
      'Os dois já se conheciam havia bastante tempo. Já tinham cruzado caminhos antes, já tinham ouvido falar um do outro, mas nunca haviam permitido que seus corações realmente se aproximassem. Talvez porque ainda não fosse a hora certa. Talvez porque ambos precisassem amadurecer suas dores antes de viver algo tão intenso.'
    ],
    blocks: [
      { after: 1, type: 'pair', polaroid: true, items: ['IMG_0559.JPEG', 'IMG_0560.JPEG'] },
      { after: 2, type: 'wide', item: 'IMG_0564.JPEG' }
    ]
  },
  {
    n: 2, sky: 'origem', accent: '#00CFFF', open: 'D3751707-EA42-4C48-8B95-AD31CFD2D762.JPEG',
    title: 'O começo e o nosso espaço seguro', badge: '26 de abril de 2026 • Primeira ficada',
    milestone: '26.04.2026 • O dia da nossa primeira ficada, onde tudo ganhou cor e nasceu nossa conexão.',
    quote: 'O príncipe encontrou nela uma paz que não sentia havia muito tempo. Já a Bonequinha encontrou nele um cuidado diferente de tudo que já tinha conhecido.',
    paragraphs: [
      'Até que um dia começaram a conversar de verdade. E foi estranho… porque parecia fácil. Natural. Como se aquelas conversas sempre tivessem existido. O príncipe encontrou nela uma paz que não sentia havia muito tempo. Já a Bonequinha encontrou nele um cuidado diferente de tudo que já tinha conhecido. E, sem perceber, os dois começaram a criar um espaço seguro um no outro.',
      'Quando finalmente ficaram juntos pela primeira vez, no dia 26 de abril de 2026, algo mudou completamente. Talvez naquele momento não desse para imaginar a dimensão que tudo isso teria, mas foi ali que nasceu uma conexão que foi crescendo com naturalidade, carinho e vontade de estar perto um do outro.',
      'Os dias passaram a ter mais cor. As horas pareciam curtas demais. E eles começaram a se ver todos os dias, como se a presença um do outro tivesse se tornado necessária para que tudo fizesse sentido.'
    ],
    blocks: [
      { after: 0, type: 'pair', items: ['IMG_0975.JPEG', '443E5DA5-24D0-4CCA-8690-9A93168B0165.jpg'] },
      { after: 1, type: 'wide', item: 'copy_C884640A-3432-4DA5-8EAA-E2AE107FB92A.MP4' }
    ]
  },
  {
    n: 3, sky: 'namoro', accent: '#FF8FBF', open: 'IMG_0974.JPEG',
    title: 'O medo vencido pelo amor e o encontro das famílias', badge: 'A coincidência do destino',
    milestone: 'Nossas famílias já se conheciam há anos — a prova de que nada entre nós era por acaso.',
    quote: 'Como se a vida inteira o universo estivesse deixando pistas silenciosas de que aquelas duas almas nasceram para se encontrar.',
    paragraphs: [
      'Mesmo assim, o medo ainda existia. A Bonequinha tinha receio de se entregar totalmente. Pensava demais, sentia a pressão das diferenças, da idade, das responsabilidades e de tudo que as pessoas poderiam falar. O príncipe também escondia inseguranças causadas pelas dores do passado. Às vezes tentava proteger o próprio coração fingindo ser mais forte do que realmente era.',
      'Mas existia uma coisa impossível de negar: o amor crescia mais a cada dia. Crescia nas conversas longas, nos abraços apertados, na saudade mesmo depois de poucas horas separados e nos pequenos detalhes que só quem ama consegue perceber. Era um sentimento tão verdadeiro que nenhum medo conseguia apagar.',
      'Então chegou um dos momentos que mais assustava os dois: apresentar suas famílias. Mas o destino, mais uma vez, mostrou que já estava escrevendo aquela história muito antes deles perceberem. Por uma coincidência quase inacreditável, as famílias deles já se conheciam havia muitos anos — como se Deus tivesse conectado seus caminhos muito antes do primeiro abraço ou do primeiro “eu te amo”. E foi naquele momento que ambos entenderam: nada daquilo era acaso.'
    ],
    blocks: [
      { after: 0, type: 'pair', polaroid: true, items: ['IMG_0759.JPEG', 'IMG_1252.JPEG'] },
      { after: 1, type: 'wide', item: 'IMG_0763.JPEG' },
      { after: 2, type: 'strip', items: ['FullSizeRender-12.JPEG', 'FullSizeRender-9.MOV', 'IMG_0761.JPEG', 'IMG_6180.MP4'] }
    ]
  },
  {
    n: 4, sky: 'jeri', accent: '#FFB454', open: 'IMG_3865.JPG',
    title: 'Nós dois, minha Bonequinha e o pôr do sol em Jericoacoara', badge: '28.05.2026 (Namoro) & 28.07.2026 (Jeri)',
    milestone: '28/05/2026: Pedido de namoro no carro • 28/07/2026: Nossa primeira viagem juntos para Jericoacoara - CE.',
    quote: 'Não importa o que aconteça… eu sempre serei seu príncipe. E você será para sempre minha Bonequinha.',
    paragraphs: [
      'Talvez o amor deles fosse improvável para o mundo, mas deu certo. Porque algumas pessoas chegam na nossa vida exatamente quando precisamos ser salvos do vazio que existia dentro da gente. E a Bonequinha salvou o príncipe, assim como o príncipe também salvou sua Bonequinha. No dia 28 de maio de 2026, dentro do carro, entre flores, uma aliança e o coração acelerado, o príncipe fez a pergunta que mudaria tudo. A Bonequinha disse sim — e a partir dali era sobre escolher um ao outro, dividir a rotina e apoiar os sonhos.',
      'Com o tempo, você se tornou minha Bonequinha, minha melhor companhia e meu lugar de paz. Nossa relação foi sendo construída nos pequenos detalhes: nas conversas que fazem o dia ficar mais leve, no cuidado quando um de nós está cansado, no apoio durante os momentos importantes e na alegria de poder compartilhar cada conquista.',
      'E no dia 28 de julho de 2026, vivemos a nossa primeira viagem juntos, para Jericoacoara, no Ceará. Mais do que conhecer um lugar bonito, foi especial porque era nós dois vivendo uma experiência nova, criando memórias que vão ficar guardadas para sempre. Cada passeio, cada paisagem e cada momento ao seu lado deixaram aquela viagem ainda mais inesquecível.'
    ],
    blocks: [
      { after: 0, type: 'pair', items: ['IMG_1084.JPEG', '3EC12588-6F74-4E07-ACCC-D5CF0A904C10.jpg'] },
      { after: 1, type: 'wide', item: 'IMG_1083.JPEG' },
      { after: 2, type: 'strip', items: ['IMG_3842.JPG', 'IMG_3837.MOV', 'IMG_3929.JPEG', 'IMG_3956.JPEG', 'IMG_3844.JPG', 'FullSizeRender-11.JPEG', 'IMG_3972.JPEG'] }
    ]
  },
  {
    n: 5, sky: 'pedido', accent: '#E8C987', open: 'FullSizeRender-4.JPEG', song: 'pedido', rings: true,
    title: 'O Pedido de Casamento em Fortaleza', badge: '15 de agosto de 2026 • Show do Luan Santana',
    milestone: '15.08.2026 • O dia em que o Príncipe pediu a sua Bonequinha em casamento no show do Luan Santana em Fortaleza.',
    quote: 'Foi um momento cheio de emoção, música, amor e a confirmação de tudo o que eu já sentia: eu quero viver a minha vida com você.',
    paragraphs: [
      'Hoje, quando o príncipe olha para ela, entende finalmente o que significa amar alguém de verdade. E dentro do seu coração existe apenas uma certeza: ela foi, é e sempre será o amor da vida dele.',
      'E então chegou o dia 15 de agosto de 2026, um dos dias mais marcantes da nossa história. Em Fortaleza, durante o show do Luan Santana, eu te pedi em casamento. Foi um momento cheio de emoção, música, amor e a confirmação de tudo o que eu já sentia: eu quero viver a minha vida com você.'
    ],
    blocks: [
      { after: 0, type: 'pair', polaroid: true, items: ['FullSizeRender-2.JPEG', 'FullSizeRender-7.JPEG'] },
      { after: 1, type: 'wide', item: 'IMG_4947.MP4' },
      { after: 1, type: 'strip', items: ['FullSizeRender-6.JPEG', 'FullSizeRender-1.JPEG', 'IMG_4879.MP4', '092604e1-3d36-4d25-b935-56bb243468a0.mp4', 'FullSizeRender-5.MOV'] }
    ]
  },
  {
    n: 6, sky: 'infinito', accent: '#5FB8FF', open: 'IMG_3929.JPEG',
    title: 'O Nosso Para Sempre', badge: 'Casamento, nossa casa & futuro',
    milestone: 'O nosso casamento, a nossa casa, nossos sonhos, nossas vitórias e todos os capítulos que ainda vamos escrever juntos.',
    quote: 'A nossa história é especial porque é verdadeira, porque é nossa e porque todos os dias escolhemos caminhar lado a lado. E isso é só o começo da nossa vida juntos.',
    paragraphs: [
      'Hoje, quando olho para a nossa história, vejo que ela foi feita de momentos simples que se transformaram em algo enorme. Vejo uma história de amor, companheirismo, cuidado e planos. Temos muito a viver ainda: o nosso casamento, a nossa casa, nossos sonhos, nossas vitórias e todos os capítulos que ainda vamos escrever juntos.',
      'Maria Cândida, eu amo você e amo a vida que estamos construindo. A nossa história não é perfeita porque é feita por pessoas perfeitas; ela é especial porque é verdadeira, porque é nossa e porque todos os dias nós escolhemos continuar caminhando lado a lado. E o mais bonito de tudo é saber que isso é só o começo da nossa vida juntos.'
    ],
    blocks: [
      { after: 0, type: 'pair', polaroid: true, items: ['IMG_3954.JPEG', 'FullSizeRender-8.JPEG'] },
      { after: 1, type: 'strip', items: ['FullSizeRender-10.JPEG', 'FullSizeRender-3.JPEG', 'IMG_6451.JPEG', 'IMG_1861.JPEG', '77763a6f-6a76-49c2-839c-3153e57b4edb.jpg', '579a183a-6bbf-41dc-97b0-95fd40477862.jpg'] }
    ]
  }
];

/* Linha do tempo: `match` escolhe as mídias do manifesto por marco e/ou intervalo de datas. */
AC.TIMELINE = [
  { id: 'tl-1', iso: '2026-04-26', label: '26 de abril de 2026', title: 'O Começo de Tudo', color: '#00CFFF', icon: 'i-sparkles',
    text: 'Tivemos a nossa primeira ficada. Foi ali que nasceu uma conexão que cresceu com naturalidade, carinho e vontade de estar perto um do outro.',
    full: 'A nossa história começou no dia 26 de abril de 2026, na nossa primeira ficada. Talvez naquele momento não desse para imaginar a dimensão que tudo isso teria, mas foi ali que nasceu a nossa conexão.',
    match: { milestones: ['encontro'] } },
  { id: 'tl-2', iso: '2026-05-28', label: '28 de maio de 2026', title: 'Oficialmente Nós Dois & Encontro das Famílias', color: '#FF5A9D', icon: 'i-heart',
    text: 'Oficializamos o nosso namoro e descobrimos que nossas famílias já se conheciam há anos — a prova de que nada era por acaso.',
    full: 'No dia 28 de maio de 2026, dentro do carro, com flores e aliança, oficializamos o nosso namoro. E ao apresentarmos nossas famílias, vimos que o universo já havia cruzado nossos destinos há muitos anos.',
    match: { milestones: ['namoro', 'familia'] } },
  { id: 'tl-3', iso: '2026-06-12', label: '12 de junho de 2026', title: 'Nosso Primeiro Dia dos Namorados', color: '#B983FF', icon: 'i-gift',
    text: 'Sintonia tão grande que praticamente demos os mesmos presentes um para o outro sem combinar: vestido e pulseira para você; camisa e colar para mim.',
    full: 'No nosso primeiro Dia dos Namorados, a nossa conexão apareceu até nos presentes escolhidos sem combinar — rimos, comemoramos e guardamos mais um momento leve e especial.',
    match: { milestones: ['rotina'], from: '2026-06-01', to: '2026-06-15' } },
  { id: 'tl-4', iso: '2026-06-28', label: '28 de junho de 2026', title: 'Nosso Primeiro Mês & Nosso Lugar de Paz', color: '#00CFFF', icon: 'i-clock',
    text: 'Um mês construindo nosso lugar de paz nos pequenos detalhes, nas conversas leves e no cuidado diário um com o outro.',
    full: 'Celebramos o primeiro mês de namoro com ainda mais proximidade, alegria e companheirismo, fortalecendo o cuidado que transforma nossa rotina.',
    match: { milestones: ['rotina'], from: '2026-06-16', to: '2026-08-14' } },
  { id: 'tl-5', iso: '2026-07-28', label: '28 de julho de 2026', title: 'Nossa Viagem para Jericoacoara', color: '#FBBF24', icon: 'i-umbrella', place: 'Jericoacoara, CE',
    text: 'Vivemos a nossa primeira viagem juntos, para Jericoacoara, no Ceará. Cada passeio, paisagem e sorriso ao seu lado ficou guardado para sempre.',
    full: 'No dia 28 de julho de 2026, comemorando dois meses de namoro, viajamos juntos pela primeira vez para Jericoacoara, no Ceará. Mais do que o cenário incrível, foi inesquecível por vivermos cada instante lado a lado.',
    match: { milestones: ['jeri'] } },
  { id: 'tl-6', song: 'pedido', iso: '2026-08-15', label: '15 de agosto de 2026 • Fortaleza', title: 'O Pedido de Casamento no Show do Luan', color: '#E8C987', icon: 'i-ring', place: 'Fortaleza, CE', highlight: true,
    text: 'Em Fortaleza, durante o show do Luan Santana, eu te pedi em casamento. Emoção, música, amor e a certeza: eu quero viver a minha vida com você.',
    full: 'O dia 15 de agosto de 2026 é um dos marcos mais emocionantes da nossa vida. Em Fortaleza, ao som de Luan Santana, eu te pedi em casamento — selando a certeza de que queremos construir o nosso casamento, a nossa casa e o nosso para sempre juntos.',
    match: { milestones: ['pedido'] } },
  { id: 'tl-7', iso: '2026-10-13', label: '13 de outubro de 2026 • Novos registros', title: 'Vivendo o Nosso Noivado & Dias de Sol', color: '#00CFFF', icon: 'i-camera',
    text: 'Novos registros: cumplicidade, jantares, sol e a alegria de viver cada capítulo depois do nosso sim em Fortaleza.',
    full: 'Seguimos colecionando novos sorrisos, fotos e vídeos especiais — celebrando a certeza do nosso noivado e construindo, dia após dia, os planos para o nosso casamento e a nossa casa.',
    match: { milestones: ['outubro'], extra: { milestones: ['rotina', 'familia'], from: '2026-08-17', to: '2026-12-31' } } }
];

/* Futuro — Mapa Estelar. `pct` é só visual (progresso). [sugestão] ajuste à vontade. */
AC.FUTURE = [
  { title: 'Jericoacoara & Primeiras Viagens', status: 'vivido', label: 'Sonho vivido', icon: 'i-umbrella', pct: 100, photo: 'IMG_3956.JPEG', x: 12, y: 62,
    text: 'Nossa primeira viagem juntos em 28 de julho de 2026 para Jericoacoara, criando memórias inesquecíveis no Ceará.',
    more: 'Vivemos cada passeio e cada pôr do sol em Jericoacoara como o primeiro de muitos destinos que vamos conhecer de mãos dadas.' },
  { title: 'O Pedido no Show do Luan', status: 'vivido', label: 'Sonho vivido', icon: 'i-ring', pct: 100, photo: 'FullSizeRender-6.JPEG', x: 30, y: 28,
    text: '15 de agosto de 2026, em Fortaleza: o pedido de casamento cheio de emoção e música.',
    more: 'Ao som de Luan Santana em Fortaleza, demos o passo mais emocionante da nossa história até aqui: o nosso noivado.' },
  { title: 'O Nosso Casamento', status: 'planejando', label: 'Planejando', icon: 'i-glass', pct: 45, art: ['rgba(232,201,135,.5)', 'rgba(255,90,157,.4)'], x: 52, y: 70,
    text: 'Celebrar a nossa união cercados de amor, oficializando no altar a escolha que fazemos todos os dias.',
    more: 'Cada detalhe do nosso casamento será a celebração de um amor verdadeiro, maduro e construído com companheirismo.' },
  { title: 'A Nossa Casa', status: 'sonho', label: 'Nosso lar', icon: 'i-home2', pct: 15, art: ['rgba(0,207,255,.4)', 'rgba(122,40,203,.5)'], x: 70, y: 32,
    text: 'Construir o nosso próprio lar, cheio de paz, cuidado, risadas e o aconchego que encontramos um no outro.',
    more: 'Um lugar onde cada canto tenha a nossa cara, para dividirmos a rotina, o descanso e todos os nossos planos.' },
  { title: 'Nossas Vitórias e Conquistas', status: 'planejando', label: 'Crescendo juntos', icon: 'i-award', pct: 55, art: ['rgba(185,131,255,.5)', 'rgba(0,207,255,.3)'], x: 84, y: 66,
    text: 'Apoiar cada sonho, vibrar com cada conquista e caminhar lado a lado em todas as fases.',
    more: 'Nossa relação é feita de parceria: comemorar cada vitória pessoal e profissional sabendo que temos um ao outro.' },
  { title: 'Todos os Capítulos Que Virão', status: 'sonho', label: 'Para sempre', icon: 'i-infinity', pct: 8, art: ['rgba(122,40,203,.55)', 'rgba(255,90,157,.45)'], x: 94, y: 24,
    text: 'Porque o mais bonito de tudo é saber que isso é só o começo da nossa vida juntos.',
    more: 'Em todos os universos, continuar escolhendo um ao outro todos os dias, escrevendo nossa história com amor e verdade.' }
];

AC.INITIAL_VOWS = [
  { author: 'João Guilherme 🤍', date: '15.08.2026', text: 'Eu prometo ser sempre o seu lugar de paz, cuidar do seu coração e construir o nosso casamento e a nossa casa com todo o meu amor.' },
  { author: 'Para Minha Bonequinha ✨', date: '13.10.2026', text: 'Em todos os universos e em todos os dias que virão, a minha melhor escolha sempre será caminhar ao seu lado.' }
];

/* Quiz do casal — [sugestão] de perguntas a partir dos fatos oficiais */
AC.QUIZ = [
  { q: 'Em que dia foi a nossa primeira ficada?', a: ['26 de abril de 2026', '28 de maio de 2026', '15 de agosto de 2026'], ok: 0 },
  { q: 'Onde foi o pedido de namoro?', a: ['Na praia', 'Dentro do carro, com flores e aliança', 'Em um restaurante'], ok: 1 },
  { q: 'Para onde foi a nossa primeira viagem juntos?', a: ['Fortaleza', 'Jericoacoara', 'Natal'], ok: 1 },
  { q: 'Em que show aconteceu o pedido de casamento?', a: ['Luan Santana, em Fortaleza', 'Um festival em Jeri', 'Um show em casa'], ok: 0 },
  { q: 'Como ele chama ela, carinhosamente?', a: ['Estrelinha', 'Bonequinha', 'Princesa'], ok: 1 },
  { q: 'Qual é a música da nossa trilha?', a: ['Dia, Lugar e Hora', 'Meteoro', 'Sinais'], ok: 0 }
];
