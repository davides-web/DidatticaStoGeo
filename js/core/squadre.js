// Punteggio del quiz a squadre per la LIM (senza browser, testabile in Node).
// Le funzioni NON modificano la partita ricevuta: ne restituiscono una nuova.

export const PUNTI_RISPOSTA = 10; // punti per una risposta giusta
export const BONUS_MASSIMO = 5;   // bonus rapidità (solo con timer): 5 punti se si risponde subito, 0 a tempo scaduto
export const NOMI_PREDEFINITI = ['Squadra Rossa', 'Squadra Blu', 'Squadra Verde', 'Squadra Gialla'];

/**
 * @param {string[]} nomi nomi delle squadre (da 2 a 4)
 * @param {number} totale numero di domande
 * @param {{timer?: number}} opzioni timer = secondi per domanda (0 = nessun timer)
 */
export function nuovaPartita(nomi, totale, { timer = 0 } = {}) {
  if (nomi.length < 2 || nomi.length > 4) throw new Error('Servono da 2 a 4 squadre');
  return {
    squadre: nomi.map((nome) => ({ nome, punti: 0, corrette: 0, sbagliate: 0 })),
    totale, timer, indice: 0, turno: 0, concluso: false,
  };
}

/** Punti guadagnati per una risposta. */
export function puntiRisposta(corretta, tempoRimasto = 0, timer = 0) {
  if (!corretta) return 0;
  const bonus = timer > 0 ? Math.round(BONUS_MASSIMO * Math.max(0, Math.min(tempoRimasto, timer)) / timer) : 0;
  return PUNTI_RISPOSTA + bonus;
}

/** Registra la risposta di una squadra (non passa ancora alla domanda successiva). */
export function assegna(partita, indiceSquadra, corretta, tempoRimasto = 0) {
  const squadre = partita.squadre.map((s, i) => i !== indiceSquadra ? s : {
    ...s,
    punti: s.punti + puntiRisposta(corretta, tempoRimasto, partita.timer),
    corrette: s.corrette + (corretta ? 1 : 0),
    sbagliate: s.sbagliate + (corretta ? 0 : 1),
  });
  return { ...partita, squadre };
}

/** Passa alla domanda successiva; il turno ruota tra le squadre. */
export function avanza(partita) {
  const indice = partita.indice + 1;
  return { ...partita, indice, turno: (partita.turno + 1) % partita.squadre.length, concluso: indice >= partita.totale };
}

/** Classifica ordinata per punti; a parità di punti la stessa posizione («ex aequo»). */
export function classifica(partita) {
  const ordinate = [...partita.squadre].sort((a, b) => b.punti - a.punti || b.corrette - a.corrette);
  return ordinate.map((s, i) => {
    const prima = ordinate.findIndex((x) => x.punti === s.punti && x.corrette === s.corrette);
    return { ...s, posizione: prima + 1 };
  });
}

/** Squadre al primo posto (più di una in caso di parità). */
export const vincitori = (partita) => classifica(partita).filter((s) => s.posizione === 1);
