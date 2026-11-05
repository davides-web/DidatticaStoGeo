// Funzioni di utilità senza dipendenze dal browser: funzionano anche in Node (test).

/** Generatore di numeri casuali con "seme": stesso seme = stessa sequenza (mulberry32). */
export function creaRng(seme = Date.now()) {
  let a = seme >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Restituisce una COPIA mescolata dell'elenco (Fisher-Yates). */
export function mescola(elenco, rng = Math.random) {
  const copia = [...elenco];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Normalizza un testo per confronti: minuscolo, senza accenti né punteggiatura, spazi singoli. */
export function normalizza(testo) {
  return String(testo ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Lettera per un indice: 0 -> A, 1 -> B ... */
export const lettera = (i) => String.fromCharCode(65 + i);

/** Raggruppa un elenco in base a una funzione chiave. */
export function raggruppa(elenco, chiave) {
  const mappa = new Map();
  for (const x of elenco) {
    const k = chiave(x);
    if (!mappa.has(k)) mappa.set(k, []);
    mappa.get(k).push(x);
  }
  return mappa;
}
