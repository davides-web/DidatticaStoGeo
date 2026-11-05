// Logica dei quiz (senza browser, testabile in Node): filtri, mescolamento, correzione.
import { mescola, normalizza } from './utils.js';

/**
 * Filtra le domande.
 * @param contenuti {argomenti, domande}
 * @param filtri {classe: 0|1|2, materia: ''|'storia'|..., argomenti: string[] (vuoto = tutti), tipi: string[] (vuoto = tutti)}
 */
export function filtraDomande(contenuti, { classe = 0, materia = '', argomenti = [], tipi = [] } = {}) {
  const ammessi = new Set(contenuti.argomenti
    .filter((a) => (!classe || a.classe === classe) && (!materia || a.materia === materia) && (argomenti.length === 0 || argomenti.includes(a.id)))
    .map((a) => a.id));
  return contenuti.domande.filter((d) => ammessi.has(d.argomento) && (tipi.length === 0 || tipi.includes(d.tipo)));
}

/**
 * Prepara una domanda per essere mostrata: mescola le opzioni (scelta) o la colonna di destra (abbina).
 * Restituisce una COPIA; per le domande a scelta `corretta` viene aggiornata alla nuova posizione.
 */
export function preparaDomanda(d, rng = Math.random) {
  if (d.tipo === 'scelta') {
    const giusta = d.opzioni[d.corretta];
    const opzioni = mescola(d.opzioni, rng);
    return { ...d, opzioni, corretta: opzioni.indexOf(giusta) };
  }
  if (d.tipo === 'abbina') {
    return { ...d, sinistra: d.coppie.map((c) => c[0]), destra: mescola(d.coppie.map((c) => c[1]), rng) };
  }
  return { ...d };
}

/** Distanza di Levenshtein (numero minimo di modifiche tra due parole). */
function distanza(a, b) {
  const riga = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prec = riga[0];
    riga[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = riga[j];
      riga[j] = Math.min(riga[j] + 1, riga[j - 1] + 1, prec + (a[i - 1] === b[j - 1] ? 0 : 1));
      prec = tmp;
    }
  }
  return riga[b.length];
}

/**
 * Controlla una risposta.
 *  - scelta: risposta = numero dell'opzione scelta
 *  - vf: risposta = true/false
 *  - completa: risposta = testo scritto (accenti e maiuscole non contano; un solo errore di battitura
 *    è tollerato nelle parole di almeno 6 lettere, per non penalizzare chi ha difficoltà di scrittura)
 *  - abbina: risposta = elenco dei testi di destra scelti, nell'ordine dei testi di sinistra
 */
export function controllaRisposta(d, risposta) {
  switch (d.tipo) {
    case 'scelta':
    case 'vf':
      return risposta === d.corretta;
    case 'completa': {
      const data = normalizza(risposta);
      if (!data) return false;
      return [d.risposta, ...(d.accettate || [])].some((ok) => {
        const n = normalizza(ok);
        return data === n || (n.length >= 6 && distanza(data, n) <= 1);
      });
    }
    case 'abbina':
      return Array.isArray(risposta) && risposta.length === d.coppie.length && d.coppie.every((c, i) => risposta[i] === c[1]);
    default:
      return false;
  }
}

/** Quante coppie sono giuste in una risposta a una domanda di abbinamento. */
export const coppieGiuste = (d, risposta) => d.coppie.filter((c, i) => risposta[i] === c[1]).length;

/** La soluzione scritta in forma di testo (per correttore, flashcard, spiegazioni). */
export function soluzioneTesto(d) {
  switch (d.tipo) {
    case 'scelta': return d.opzioni[d.corretta];
    case 'vf': return d.corretta ? 'Vero' : 'Falso';
    case 'completa': return d.risposta;
    case 'abbina': return d.coppie.map((c) => `${c[0]} → ${c[1]}`).join(' · ');
    default: return '';
  }
}

/** Testo della domanda con il vuoto evidenziato (per completamenti): «Il re ___ governò». */
export const conVuoto = (testo, riempimento = '______') => testo.replace('___', riempimento);

export const NOMI_TIPO = { scelta: 'Scelta multipla', vf: 'Vero o falso', completa: 'Completamento', abbina: 'Abbinamento' };
