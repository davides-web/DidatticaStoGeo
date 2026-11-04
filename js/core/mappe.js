// Logica del quiz sulle carte mute (senza browser, testabile in Node).
import { mescola } from './utils.js';

/** Elementi di un livello che si possono chiedere nel quiz (quelli con quiz:false sono esclusi). */
export const bersagliPossibili = (livello) => livello.elementi.filter((e) => e.quiz !== false);

/** Sceglie fino a `n` bersagli diversi, in ordine casuale. */
export function scegliBersagli(livello, n, rng = Math.random) {
  return mescola(bersagliPossibili(livello), rng).slice(0, n);
}

/** Testo della domanda: quello scritto nei dati oppure «Trova: Nome». */
export const testoDomanda = (elemento) => elemento.domanda || `Trova: ${elemento.nome}`;

/** Riepilogo di un quiz: risposte = [{ bersaglio, scelto }] (scelto = id cliccato). */
export function valutaQuiz(risposte) {
  const corrette = risposte.filter((r) => r.scelto === r.bersaglio.id).length;
  const totale = risposte.length;
  return { corrette, totale, percentuale: totale ? Math.round((corrette / totale) * 100) : 0 };
}

/** Livelli che hanno almeno un elemento utilizzabile nel quiz. */
export const livelliQuiz = (mappa) => mappa.livelli.filter((l) => bersagliPossibili(l).length > 0);
