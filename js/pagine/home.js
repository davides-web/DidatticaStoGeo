// Pagina iniziale: i moduli dell'app e un riepilogo dei contenuti.
import { h, aggiungi } from '../dom.js';

const MODULI = [
  ['studio', '📖', 'Studio', 'Sintesi di ogni argomento, anche in versione semplificata, con lettura ad alta voce.'],
  ['timeline', '⏳', 'Linee del tempo', 'Eventi cliccabili, zoom, confronto tra due linee e gioco di riordino.'],
  ['mappe', '🗺️', 'Carte mute', 'Italia, Europa e carte storiche: esplora o fai il quiz.'],
  ['quiz', '❓', 'Quiz', 'Squadre alla LIM, esercizio individuale e flashcard.'],
  ['glossario', '🔤', 'Glossario', 'Termini chiave con traduzione inglese e ascolto.'],
  ['verifiche', '🖨️', 'Verifiche', 'Verifiche A/B, versione semplificata e correttore da stampare.'],
  ['editor', '✏️', 'Editor', 'Crea e modifica domande, eventi e glossario; esporta il JSON.'],
];

export function monta(radice, ctx) {
  const c = ctx.contenuti;
  aggiungi(radice, [
    h('h1', {}, 'Storia e Geografia'),
    h('p', { class: 'tenue' }, 'Scuola secondaria di primo grado · classi prime e seconde'),
    c.errori.length
      ? h('div', { class: 'errore' }, h('strong', {}, `Ci sono ${c.errori.length} problemi nei contenuti. `),
          h('a', { href: '#/editor?controllo=1' }, 'Vedi i dettagli'))
      : null,
    c.argomenti.length === 0
      ? h('div', { class: 'vuoto' }, 'Non ci sono ancora contenuti: aggiungi i file JSON nella cartella "contenuti".')
      : null,
    h('div', { class: 'griglia' }, MODULI.map(([id, icona, titolo, testo]) =>
      h('a', { class: 'scheda modulo', href: `#/${id}` }, h('span', { class: 'icona', 'aria-hidden': 'true' }, icona), h('strong', {}, titolo), h('span', {}, testo)))),
    h('p', { class: 'tenue' },
      `${c.argomenti.length} argomenti · ${c.domande.length} domande · ${c.eventi.length} eventi · ${c.glossario.length} termini nel glossario.`)]);
}
