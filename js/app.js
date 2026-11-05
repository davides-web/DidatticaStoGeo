// Punto di ingresso dell'app: carica i contenuti, gestisce il menu e le "pagine"
// (indirizzi tipo #/quiz?arg=feudalesimo). Ogni pagina è un modulo in js/pagine/.
import { h, sostituisci } from './dom.js';
import { caricaContenuti } from './core/contenuti.js';
import { inizializza, creaPannello } from './accessibilita.js';
import { fermaLettura } from './voce.js';

const VOCI_MENU = [
  ['studio', '📖', 'Studio'],
  ['timeline', '⏳', 'Linee del tempo'],
  ['mappe', '🗺️', 'Carte mute'],
  ['quiz', '❓', 'Quiz'],
  ['glossario', '🔤', 'Glossario'],
  ['verifiche', '🖨️', 'Verifiche'],
  ['editor', '✏️', 'Editor'],
];

const ctx = { contenuti: null };
const principale = document.getElementById('principale');
let paginaAttuale = null;

/** Legge l'indirizzo: "#/quiz?arg=x" -> { nome: 'quiz', param: URLSearchParams } */
function leggiRotta() {
  const [percorso, query = ''] = location.hash.replace(/^#\/?/, '').split('?');
  return { nome: percorso || 'home', param: new URLSearchParams(query) };
}

function disegnaMenu(nome) {
  sostituisci(document.getElementById('menu'),
    VOCI_MENU.map(([id, icona, testo]) =>
      h('a', { href: `#/${id}`, 'aria-current': id === nome ? 'page' : null }, h('span', { 'aria-hidden': 'true' }, icona), testo)));
}

async function naviga() {
  const { nome, param } = leggiRotta();
  disegnaMenu(nome);
  fermaLettura();
  if (typeof paginaAttuale?.smonta === 'function') paginaAttuale.smonta();
  paginaAttuale = null;
  sostituisci(principale, h('p', { class: 'caricamento' }, 'Caricamento…'));
  try {
    const modulo = await import(`./pagine/${nome}.js`);
    sostituisci(principale);
    paginaAttuale = (await modulo.monta(principale, ctx, param)) || null;
  } catch (e) {
    console.error(e);
    const mancante = e instanceof TypeError || /Failed to fetch|import/i.test(String(e));
    sostituisci(principale,
      h('div', { class: 'errore' }, mancante ? 'Questa pagina non esiste (ancora).' : `Si è verificato un errore: ${e.message}`),
      h('p', {}, h('a', { class: 'btn', href: '#/' }, '← Torna all\'inizio')));
  }
  document.title = (VOCI_MENU.find((v) => v[0] === nome)?.[2] || 'Storia e Geografia') + ' – Didattica';
  window.scrollTo(0, 0);
}

async function avvia() {
  inizializza();
  const pannello = creaPannello();
  document.body.append(pannello);
  document.getElementById('btn-access').addEventListener('click', () => pannello.showModal());

  try {
    ctx.contenuti = await caricaContenuti((p) =>
      fetch(p).then((r) => { if (!r.ok) throw new Error(`${p}: ${r.status}`); return r.json(); }));
  } catch (e) {
    sostituisci(principale, h('div', { class: 'errore' }, `Impossibile caricare i contenuti: ${e.message}`));
    return;
  }
  addEventListener('hashchange', naviga);
  naviga();

  // Funzionamento offline (PWA): il service worker salva i file nel dispositivo.
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Service worker non attivo:', e));
  }
}

avvia();
