// Generazione delle verifiche (senza browser, testabile in Node).
// Da un insieme di domande si ottengono: variante A, variante B (stesse domande, ordine e opzioni
// diversi), versione semplificata e soluzioni. A parità di "seme" il risultato è sempre lo stesso.
import { creaRng, mescola, normalizza, lettera, raggruppa } from './utils.js';
import { preparaDomanda } from './quiz.js';

/** Ordine dei tipi nella versione semplificata (dal più facile) con le consegne «spezzate». */
export const CONSEGNE_SEMPLIFICATE = {
  vf: ['Leggi la frase.', 'Metti una X su V (vero) o su F (falso).'],
  scelta: ['Leggi la domanda.', 'Leggi le tre risposte.', 'Metti una X sulla risposta giusta.'],
  completa: ['Leggi la frase.', 'Scegli la parola giusta dalle parole aiuto.', 'Scrivila sulla riga.'],
  abbina: ['Guarda i numeri a sinistra.', 'Guarda le lettere a destra.', 'Scrivi la lettera giusta accanto a ogni numero.'],
};
export const ORDINE_SEMPLIFICATA = ['vf', 'scelta', 'completa', 'abbina'];

export const CONSEGNE_NORMALI = {
  scelta: 'Scegli la risposta giusta (una sola).',
  vf: 'Indica se l\'affermazione è vera (V) o falsa (F).',
  completa: 'Completa la frase con la parola mancante.',
  abbina: 'Abbina ogni elemento della colonna di sinistra a quello giusto della colonna di destra (scrivi la lettera).',
};

/**
 * Sceglie `n` domande distribuendole in modo equilibrato tra gli argomenti.
 * Non restituisce mai due volte la stessa domanda (né due domande con lo stesso testo).
 */
export function selezionaDomande(domande, n, rng = Math.random) {
  const viste = new Set();
  const uniche = domande.filter((d) => {
    const chiave = `${d.tipo}|${normalizza(d.testo)}`;
    if (viste.has(d.id) || viste.has(chiave)) return false;
    viste.add(d.id); viste.add(chiave);
    return true;
  });
  const gruppi = [...raggruppa(uniche, (d) => d.argomento).values()].map((g) => mescola(g, rng));
  const ordineGruppi = mescola(gruppi, rng);
  const scelte = [];
  for (let giro = 0; scelte.length < n; giro++) {
    let preso = false;
    for (const g of ordineGruppi) {
      if (g[giro] && scelte.length < n) { scelte.push(g[giro]); preso = true; }
    }
    if (!preso) break; // domande finite
  }
  return scelte;
}

/** Mescola `elenco` finché nessun elemento è nella stessa posizione di `riferimento` (se possibile). */
function mescolaDiverso(elenco, riferimento, rng) {
  let prova = mescola(elenco, rng);
  for (let i = 0; i < 30 && prova.some((d, k) => riferimento[k] && riferimento[k].id === d.id); i++) prova = mescola(elenco, rng);
  if (prova.some((d, k) => riferimento[k] && riferimento[k].id === d.id) && prova.length > 1) prova = [...prova.slice(1), prova[0]];
  return prova;
}

/** Versione semplificata: meno domande, tipi facili, tre sole opzioni, parole aiuto, coppie ridotte. */
export function versioneSemplificata(selezione, rng, massimo) {
  const peso = { vf: 0, scelta: 1, completa: 2, abbina: 3 };
  const preferite = [...selezione].sort((a, b) => peso[a.tipo] - peso[b.tipo]);
  const scelte = preferite.slice(0, massimo);
  const trasformate = scelte.map((d) => {
    if (d.tipo === 'scelta') {
      const giusta = d.opzioni[d.corretta];
      const sbagliate = mescola(d.opzioni.filter((_, i) => i !== d.corretta), rng).slice(0, 2);
      const opzioni = mescola([giusta, ...sbagliate], rng);
      return { ...d, opzioni, corretta: opzioni.indexOf(giusta), semplice: true };
    }
    if (d.tipo === 'completa') {
      const aiuto = mescola([d.risposta, ...(d.distrattori || []).slice(0, 2)], rng);
      return { ...d, paroleAiuto: aiuto, semplice: true };
    }
    if (d.tipo === 'abbina') {
      const coppie = mescola(d.coppie, rng).slice(0, 4);
      return { ...d, coppie, sinistra: coppie.map((c) => c[0]), destra: mescola(coppie.map((c) => c[1]), rng), semplice: true };
    }
    return { ...d, semplice: true };
  });
  // raggruppa per tipo, dal più facile
  return ORDINE_SEMPLIFICATA.flatMap((t) => trasformate.filter((d) => d.tipo === t));
}

/**
 * Genera la verifica completa.
 * @param {object[]} domande domande tra cui scegliere (già filtrate per classe/argomenti)
 * @param {{n:number, seme:number}} opzioni
 * @returns {{seme:number, A:object[], B:object[], semplificata:object[]}}
 */
export function generaVerifica(domande, { n = 10, seme = 1 } = {}) {
  const rng = creaRng(seme);
  const selezione = selezionaDomande(domande, n, rng);
  const ordineA = mescola(selezione, rng);
  const ordineB = mescolaDiverso(selezione, ordineA, rng);
  const A = ordineA.map((d) => preparaDomanda(d, rng));
  const B = ordineB.map((d) => preparaDomanda(d, rng));
  const massimo = Math.min(selezione.length, Math.max(5, Math.round(selezione.length * 0.6)));
  const semplificata = versioneSemplificata(mescola(selezione, rng), rng, massimo);
  return { seme, A, B, semplificata };
}

/** Soluzione in forma breve, come si scrive nel correttore (le lettere seguono le opzioni mostrate). */
export function soluzioneBreve(d) {
  switch (d.tipo) {
    case 'scelta': return `${lettera(d.corretta)}) ${d.opzioni[d.corretta]}`;
    case 'vf': return d.corretta ? 'V (vero)' : 'F (falso)';
    case 'completa': return d.risposta;
    case 'abbina': return d.sinistra.map((_, i) => `${i + 1}→${lettera(d.destra.indexOf(d.coppie[i][1]))}`).join('   ');
    default: return '';
  }
}

/** Punti di una domanda: 1, tranne gli abbinamenti (1 per coppia). */
export const puntiDomanda = (d) => (d.tipo === 'abbina' ? d.coppie.length : 1);
export const puntiTotali = (elenco) => elenco.reduce((t, d) => t + puntiDomanda(d), 0);
