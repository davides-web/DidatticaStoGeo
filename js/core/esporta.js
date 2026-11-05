// Esportazione dei pacchetti in JSON leggibile: una voce per riga (come i file nel repository).
import { COLLEZIONI } from './validazione.js';

/** Toglie i campi vuoti (stringhe vuote, elenchi vuoti, undefined) da una voce. */
export function pulisciVoce(voce) {
  const r = {};
  for (const [k, v] of Object.entries(voce)) {
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) continue;
    r[k] = v;
  }
  return r;
}

/** Testo JSON di un pacchetto: elenchi nell'ordine abituale, una voce per riga, elenchi vuoti omessi. */
export function formattaPacchetto(pacchetto) {
  const parti = COLLEZIONI.filter((c) => Array.isArray(pacchetto[c]) && pacchetto[c].length > 0)
    .map((c) => `  "${c}": [\n${pacchetto[c].map((v) => '    ' + JSON.stringify(pulisciVoce(v))).join(',\n')}\n  ]`);
  return `{\n${parti.join(',\n')}\n}\n`;
}

/** Testo di contenuti/indice.json con l'elenco aggiornato dei pacchetti. */
export function formattaIndice(indiceAttuale, nomiPacchetti) {
  return JSON.stringify({ ...indiceAttuale, pacchetti: nomiPacchetti }, null, 2) + '\n';
}
