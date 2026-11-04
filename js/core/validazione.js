// Validazione dei file JSON dei contenuti.
// Restituisce SEMPRE due elenchi di messaggi in italiano:
//  - errori: cose da correggere (l'app potrebbe non funzionare);
//  - avvisi: suggerimenti (es. troppe poche domande per un argomento).

export const MATERIE = ['storia', 'geografia', 'civica'];
export const TIPI_DOMANDA = ['scelta', 'vf', 'completa', 'abbina'];
export const COLLEZIONI = ['argomenti', 'domande', 'eventi', 'concetti', 'glossario'];

const stringa = (v) => typeof v === 'string' && v.trim() !== '';

/** Controlla che i campi indicati siano stringhe non vuote. */
function richiediTesti(oggetto, campi, dove, errori) {
  for (const c of campi) {
    if (!stringa(oggetto[c])) errori.push(`${dove}: manca il campo "${c}"`);
  }
}

function validaDomanda(d, dove, errori) {
  richiediTesti(d, ['id', 'argomento', 'testo', 'spiegazione'], dove, errori);
  if (!TIPI_DOMANDA.includes(d.tipo)) {
    errori.push(`${dove}: tipo "${d.tipo}" non valido (ammessi: ${TIPI_DOMANDA.join(', ')})`);
    return;
  }
  if (d.tipo === 'scelta') {
    if (!Array.isArray(d.opzioni) || d.opzioni.length < 3 || d.opzioni.length > 5 || !d.opzioni.every(stringa)) {
      errori.push(`${dove}: "opzioni" deve contenere da 3 a 5 testi`);
    } else {
      if (new Set(d.opzioni).size !== d.opzioni.length) errori.push(`${dove}: ci sono opzioni uguali`);
      if (!Number.isInteger(d.corretta) || d.corretta < 0 || d.corretta >= d.opzioni.length) {
        errori.push(`${dove}: "corretta" deve essere il numero dell'opzione giusta (0 = la prima)`);
      }
    }
  } else if (d.tipo === 'vf') {
    if (typeof d.corretta !== 'boolean') errori.push(`${dove}: "corretta" deve essere true o false`);
  } else if (d.tipo === 'completa') {
    if (!stringa(d.testo) || !d.testo.includes('___')) errori.push(`${dove}: il testo deve contenere ___ al posto della parola mancante`);
    if (!stringa(d.risposta)) errori.push(`${dove}: manca "risposta"`);
    for (const campo of ['accettate', 'distrattori']) {
      if (d[campo] !== undefined && !(Array.isArray(d[campo]) && d[campo].every(stringa))) {
        errori.push(`${dove}: "${campo}" deve essere un elenco di testi`);
      }
    }
  } else if (d.tipo === 'abbina') {
    const ok = Array.isArray(d.coppie) && d.coppie.length >= 3 && d.coppie.length <= 6 &&
      d.coppie.every((c) => Array.isArray(c) && c.length === 2 && stringa(c[0]) && stringa(c[1]));
    if (!ok) {
      errori.push(`${dove}: "coppie" deve contenere da 3 a 6 coppie [sinistra, destra]`);
    } else {
      if (new Set(d.coppie.map((c) => c[0])).size !== d.coppie.length) errori.push(`${dove}: elementi di sinistra ripetuti`);
      if (new Set(d.coppie.map((c) => c[1])).size !== d.coppie.length) errori.push(`${dove}: elementi di destra ripetuti`);
    }
  }
}

/** Controllo dei campi di ogni tipo di scheda. */
const CONTROLLI = {
  argomenti(a, dove, errori) {
    richiediTesti(a, ['id', 'titolo', 'sintesi', 'semplificata'], dove, errori);
    if (!MATERIE.includes(a.materia)) errori.push(`${dove}: materia "${a.materia}" non valida (ammesse: ${MATERIE.join(', ')})`);
    if (![1, 2].includes(a.classe)) errori.push(`${dove}: "classe" deve essere 1 o 2`);
    if (a.collegamenti !== undefined && !(Array.isArray(a.collegamenti) && a.collegamenti.every(stringa))) {
      errori.push(`${dove}: "collegamenti" deve essere un elenco di identificatori di argomenti`);
    }
  },
  domande: validaDomanda,
  eventi(e, dove, errori) {
    richiediTesti(e, ['id', 'argomento', 'data', 'titolo', 'descrizione'], dove, errori);
    if (!Number.isInteger(e.anno)) errori.push(`${dove}: "anno" deve essere un numero intero (negativo per a.C.)`);
  },
  concetti(c, dove, errori) {
    richiediTesti(c, ['id', 'argomento', 'titolo', 'descrizione'], dove, errori);
  },
  glossario(g, dove, errori) {
    richiediTesti(g, ['id', 'argomento', 'termine', 'definizione', 'inglese', 'definizione_en', 'esempio'], dove, errori);
  },
};

/**
 * Valida un singolo pacchetto (il contenuto di un file JSON).
 * @param {object} pacchetto
 * @param {string} nome nome del file, usato nei messaggi
 */
export function validaPacchetto(pacchetto, nome = 'pacchetto') {
  const errori = [];
  const avvisi = [];
  if (!pacchetto || typeof pacchetto !== 'object' || Array.isArray(pacchetto)) {
    return { errori: [`${nome}: il file non contiene un oggetto JSON`], avvisi };
  }
  for (const coll of COLLEZIONI) {
    if (pacchetto[coll] === undefined) continue;
    if (!Array.isArray(pacchetto[coll])) {
      errori.push(`${nome}: "${coll}" deve essere un elenco`);
      continue;
    }
    pacchetto[coll].forEach((voce, i) => {
      const dove = `${nome} › ${coll}[${i}]${voce && voce.id ? ` (${voce.id})` : ''}`;
      if (!voce || typeof voce !== 'object') errori.push(`${dove}: voce non valida`);
      else CONTROLLI[coll](voce, dove, errori);
    });
  }
  return { errori, avvisi };
}

/**
 * Valida l'insieme di tutti i pacchetti: identificatori unici, riferimenti agli
 * argomenti esistenti, numero consigliato di domande ed eventi per argomento.
 * @param {{nome:string, dati:object}[]} pacchetti
 */
export function validaInsieme(pacchetti) {
  const errori = [];
  const avvisi = [];
  const argomenti = new Map();
  for (const { nome, dati } of pacchetti) {
    const r = validaPacchetto(dati, nome);
    errori.push(...r.errori);
    avvisi.push(...r.avvisi);
  }
  // Identificatori unici (per ogni tipo di scheda, in tutti i file)
  for (const coll of COLLEZIONI) {
    const visti = new Map();
    for (const { nome, dati } of pacchetti) {
      for (const voce of (dati && dati[coll]) || []) {
        if (!voce || !voce.id) continue;
        if (visti.has(voce.id)) errori.push(`Identificatore "${voce.id}" duplicato in ${coll} (${visti.get(voce.id)} e ${nome})`);
        visti.set(voce.id, nome);
        if (coll === 'argomenti') argomenti.set(voce.id, voce);
      }
    }
  }
  // Riferimenti agli argomenti
  const conteggi = new Map();
  for (const { nome, dati } of pacchetti) {
    for (const coll of ['domande', 'eventi', 'concetti', 'glossario']) {
      for (const voce of (dati && dati[coll]) || []) {
        if (!voce) continue;
        if (voce.argomento && !argomenti.has(voce.argomento)) {
          errori.push(`${nome} › ${coll} (${voce.id}): l'argomento "${voce.argomento}" non esiste`);
        }
        if (coll === 'domande' || coll === 'eventi' || coll === 'concetti') {
          const k = `${voce.argomento}|${coll === 'domande' ? 'd' : 'e'}`;
          conteggi.set(k, (conteggi.get(k) || 0) + 1);
        }
      }
    }
    for (const a of (dati && dati.argomenti) || []) {
      for (const c of (a && a.collegamenti) || []) {
        if (!argomenti.has(c)) errori.push(`${nome} › argomento ${a.id}: il collegamento "${c}" non esiste`);
      }
    }
  }
  // Quantità consigliate
  for (const id of argomenti.keys()) {
    const nd = conteggi.get(`${id}|d`) || 0;
    const ne = conteggi.get(`${id}|e`) || 0;
    if (nd < 8 || nd > 12) avvisi.push(`Argomento "${id}": ${nd} domande (consigliate da 8 a 12)`);
    if (ne < 6 || ne > 10) avvisi.push(`Argomento "${id}": ${ne} eventi/concetti (consigliati da 6 a 10)`);
  }
  return { errori, avvisi };
}
