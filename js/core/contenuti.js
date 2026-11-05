// Caricamento dei contenuti. La funzione "leggi" viene passata da fuori:
// nel browser usa fetch, nei test legge i file dal disco.
import { validaInsieme } from './validazione.js';

/**
 * @param {(percorso:string)=>Promise<object>} leggi legge un file JSON dato il suo percorso
 * @returns contenuti uniti + elenco di errori e avvisi di validazione
 */
export async function caricaContenuti(leggi) {
  const indice = await leggi('contenuti/indice.json');
  const pacchetti = [];
  const problemi = [];
  for (const file of indice.pacchetti || []) {
    try {
      pacchetti.push({ nome: file, dati: await leggi(`contenuti/${file}`) });
    } catch (e) {
      problemi.push(`Impossibile leggere ${file}: ${e.message}`);
    }
  }
  const { errori, avvisi } = validaInsieme(pacchetti);
  const unisci = (coll) => pacchetti.flatMap((p) => (p.dati && p.dati[coll]) || []);
  const argomenti = unisci('argomenti');
  // Ordine: materia (storia, geografia, civica), classe, ordine di scrittura
  return {
    indice,
    pacchetti,
    argomenti,
    domande: unisci('domande'),
    eventi: unisci('eventi'),
    concetti: unisci('concetti'),
    glossario: unisci('glossario'),
    errori: [...problemi, ...errori],
    avvisi,
  };
}

/** Cerca un argomento per identificatore. */
export const trovaArgomento = (contenuti, id) => contenuti.argomenti.find((a) => a.id === id);

export const NOMI_MATERIA = { storia: 'Storia', geografia: 'Geografia', civica: 'Educazione civica' };
export const ICONE_MATERIA = { storia: '🏛️', geografia: '🌍', civica: '⚖️' };
