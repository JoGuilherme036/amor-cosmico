/* Service worker — o site abre offline depois da 1ª visita.
   Camadas: (1) casca do site = pré-cache; (2) imagens/fontes/scripts = guardados ao serem vistos;
   (3) vídeos e músicas = só rede (arquivos grandes, com "range").
   A versão (V) é trocada automaticamente pelo scripts/bundle.mjs a cada publicação. */
const V = 'amor-cosmico-2f7e581450';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'build/site.css', 'build/app.js', 'assets/fx/grain.png', 'assets/icons/icon-192.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))).catch(() => {}).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== location.origin) return;
  if (/\.(mp4|mp3|mov|enc)$/i.test(u.pathname) || r.headers.has('range')) return; // mídia pesada: rede
  // páginas: rede primeiro (pega atualização), cache se estiver offline
  if (r.mode === 'navigate') { e.respondWith(fetch(r).then((res) => { const cp = res.clone(); caches.open(V).then((c) => c.put(r, cp)); return res; }).catch(() => caches.match(r).then((h) => h || caches.match('index.html')))); return; }
  if (/\.(woff2|css|js|webp|avif|jpg|png|webmanifest)$/i.test(u.pathname)) {
    e.respondWith(caches.match(r).then((hit) => hit || fetch(r).then((res) => { if (res.ok) { const cp = res.clone(); caches.open(V).then((c) => c.put(r, cp)); } return res; })));
  }
});
