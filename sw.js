// Service worker: salva nel dispositivo i file dell'app per farla funzionare senza internet.
// L'elenco dei file e il numero di versione (tra i marcatori) si aggiornano con:  npm run aggiorna-sw
// Strategia: prima la copia salvata (veloce), intanto si scarica quella nuova per la volta dopo.

// <GENERATO>
const VERSIONE = '08738a4031';
const FILE_APP = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/stampa.css",
  "css/stile.css",
  "js/accessibilita.js",
  "js/app.js",
  "js/core/contenuti.js",
  "js/core/utils.js",
  "js/core/validazione.js",
  "js/dom.js",
  "js/pagine/home.js",
  "js/pagine/studio.js",
  "js/voce.js",
  "contenuti/indice.json",
  "contenuti/storia-1.json",
  "fonts/atkinson-hyperlegible-latin-400-normal.woff2",
  "fonts/atkinson-hyperlegible-latin-700-normal.woff2",
  "fonts/opendyslexic-latin-400-normal.woff2",
  "fonts/opendyslexic-latin-700-normal.woff2",
  "icons/icona-192.png",
  "icons/icona-512.png",
  "icons/icona.svg"
];
// </GENERATO>

const CACHE = `didattica-${VERSIONE}`;

self.addEventListener('install', (evento) => {
  evento.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(FILE_APP);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil((async () => {
    for (const nome of await caches.keys()) if (nome !== CACHE) await caches.delete(nome);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (evento) => {
  const richiesta = evento.request;
  if (richiesta.method !== 'GET' || new URL(richiesta.url).origin !== location.origin) return;
  evento.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const salvata = await cache.match(richiesta, { ignoreSearch: true });
    const rete = fetch(richiesta).then((risposta) => {
      if (risposta.ok) cache.put(richiesta, risposta.clone());
      return risposta;
    }).catch(() => null);
    if (salvata) { evento.waitUntil(rete); return salvata; }
    return (await rete) || (richiesta.mode === 'navigate' ? cache.match('./') : Response.error());
  })());
});
