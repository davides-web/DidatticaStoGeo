// Logica delle linee del tempo (senza browser, quindi testabile in Node).
import { mescola } from './utils.js';

/** Nomi leggibili delle "linee" (campo `linea` degli eventi). Le altre compaiono con il loro nome. */
export const NOMI_LINEE = {
  europa: 'Europa occidentale',
  islam: 'Mondo islamico',
  bizantino: 'Impero bizantino',
  italia: 'Italia',
  mondo: 'Resto del mondo',
};
export const nomeLinea = (l) => NOMI_LINEE[l] || (l ? l[0].toUpperCase() + l.slice(1) : 'Altro');

/** 476 -> "476 d.C.", -44 -> "44 a.C." */
export function formattaAnno(anno) {
  return anno < 0 ? `${-anno} a.C.` : `${anno} d.C.`;
}

/** Copia degli eventi ordinata dal più antico al più recente (a parità di anno, per titolo). */
export function ordinaEventi(eventi) {
  return [...eventi].sort((a, b) => a.anno - b.anno || a.titolo.localeCompare(b.titolo, 'it'));
}

/** Anno minimo e massimo di un elenco di eventi. */
export function estremi(eventi) {
  if (eventi.length === 0) return { min: 0, max: 0 };
  const anni = eventi.map((e) => e.anno);
  return { min: Math.min(...anni), max: Math.max(...anni) };
}

/** Posizione orizzontale (in pixel) di un anno su una scala da min a max. */
export function posizioneX(anno, min, max, larghezza, margine = 0) {
  if (max === min) return larghezza / 2;
  return margine + ((anno - min) / (max - min)) * (larghezza - 2 * margine);
}

/**
 * Assegna una "corsia" (riga) a ogni evento in modo che le schede non si sovrappongano.
 * @returns {{evento, x:number, corsia:number}[]} nello stesso ordine cronologico
 */
export function assegnaCorsie(eventi, { min, max, larghezza, margine = 90, larghezzaScheda = 170 }) {
  const fineCorsia = []; // fino a dove (in px) è occupata ogni corsia
  return ordinaEventi(eventi).map((evento) => {
    const x = posizioneX(evento.anno, min, max, larghezza, margine);
    let corsia = fineCorsia.findIndex((fine) => x - larghezzaScheda / 2 >= fine);
    if (corsia === -1) corsia = fineCorsia.length;
    fineCorsia[corsia] = x + larghezzaScheda / 2 + 8;
    return { evento, x, corsia };
  });
}

/** Anni "tondi" da disegnare sull'asse (circa `maxTacche` al massimo). */
export function tacche(min, max, maxTacche = 10) {
  const passi = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
  const passo = passi.find((p) => (max - min) / p <= maxTacche) || 1000;
  const risultato = [];
  for (let a = Math.ceil(min / passo) * passo; a <= max; a += passo) risultato.push(a);
  return risultato;
}

/** Eventi che appartengono a una linea (es. 'islam') con eventuale filtro di classe. */
export function eventiDiLinea(contenuti, linea, classe = 0) {
  const classeDi = new Map(contenuti.argomenti.map((a) => [a.id, a.classe]));
  return ordinaEventi(contenuti.eventi.filter((e) => e.linea === linea && (!classe || classeDi.get(e.argomento) === classe)));
}

/**
 * Eventi di una selezione: "arg:<id>" (un argomento) oppure "classe:<n>" (tutta la storia di quella classe).
 */
export function eventiDiSelezione(contenuti, selezione) {
  const [tipo, valore] = selezione.split(':');
  if (tipo === 'arg') return ordinaEventi(contenuti.eventi.filter((e) => e.argomento === valore));
  const ids = new Set(contenuti.argomenti.filter((a) => a.materia === 'storia' && a.classe === Number(valore)).map((a) => a.id));
  return ordinaEventi(contenuti.eventi.filter((e) => ids.has(e.argomento)));
}

/**
 * Sceglie `n` eventi per il gioco del riordino. Evita eventi con lo stesso anno
 * (l'ordine non sarebbe univoco) e li restituisce MESCOLATI.
 */
export function scegliPerGioco(eventi, n, rng = Math.random) {
  const unici = [];
  const visti = new Set();
  for (const e of mescola(eventi, rng)) {
    if (!visti.has(e.anno)) { visti.add(e.anno); unici.push(e); }
  }
  const scelti = unici.slice(0, Math.min(n, unici.length));
  // Mescola di nuovo finché non è già in ordine (altrimenti il gioco sarebbe banale)
  let mescolati = mescola(scelti, rng);
  for (let i = 0; i < 10 && scelti.length > 1 && staInOrdine(mescolati); i++) mescolati = mescola(scelti, rng);
  return mescolati;
}

const staInOrdine = (eventi) => eventi.every((e, i) => i === 0 || eventi[i - 1].anno <= e.anno);

/**
 * Controlla l'ordine dato dal giocatore.
 * @param {string[]} ids identificatori degli eventi nell'ordine scelto
 * @returns {{giuste:boolean[], corrette:number, completo:boolean}}
 *   giuste[i] è vero se in posizione i c'è un evento dell'anno giusto.
 */
export function controllaOrdine(ids, eventi) {
  const perId = new Map(eventi.map((e) => [e.id, e]));
  const anniGiusti = ordinaEventi(ids.map((id) => perId.get(id))).map((e) => e.anno);
  const giuste = ids.map((id, i) => perId.get(id).anno === anniGiusti[i]);
  const corrette = giuste.filter(Boolean).length;
  return { giuste, corrette, completo: corrette === ids.length };
}
