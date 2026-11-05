// Flashcard per il ripasso: domande o termini del glossario. Le carte non sapute tornano in fondo al mazzo.
import { h, sostituisci } from '../dom.js';
import { soluzioneTesto, conVuoto } from '../core/quiz.js';
import { leggi, fermaLettura } from '../voce.js';

/** Trasforma una carta in {fronte, retro, extra, lettura}. */
function lati(carta) {
  if (carta.tipo === 'glossario') {
    const g = carta.g;
    return { etichetta: 'Termine', fronte: g.termine, retro: g.definizione, extra: [`🇬🇧 ${g.inglese}: ${g.definizione_en}`, `Esempio: ${g.esempio}`], lettura: [g.termine, g.definizione], en: `${g.inglese}. ${g.definizione_en}` };
  }
  const d = carta.d;
  const fronte = d.tipo === 'completa' ? conVuoto(d.testo) : d.tipo === 'vf' ? `Vero o falso? ${d.testo}` : d.tipo === 'abbina' ? `${d.testo} ${d.sinistra.join(' · ')}` : d.testo;
  return { etichetta: 'Domanda', fronte, retro: soluzioneTesto(d), extra: [d.spiegazione], lettura: [fronte, soluzioneTesto(d)] };
}

export function avvia(radice, { carte, esci }) {
  let coda = [...carte];
  let girata = false;
  let sapute = 0;
  const totale = carte.length;
  const zona = h('div', { class: 'flash' });
  radice.append(zona);
  const chiudi = () => { fermaLettura(); zona.remove(); document.removeEventListener('keydown', tasto); };
  const tasto = (e) => {
    if (e.target.matches('input, select, textarea')) return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); girata = !girata; disegna(); }
    else if (girata && (e.key === 'ArrowRight' || e.key === '1')) segna(true);
    else if (girata && (e.key === 'ArrowLeft' || e.key === '2')) segna(false);
  };
  document.addEventListener('keydown', tasto);

  function segna(saputa) {
    const c = coda.shift();
    if (saputa) sapute++; else coda.push(c);
    girata = false;
    disegna();
  }

  function disegna() {
    fermaLettura();
    if (coda.length === 0) {
      sostituisci(zona, h('div', { class: 'scheda' }, h('h2', {}, '🎉 Hai finito il mazzo!'), h('p', {}, `Hai imparato ${totale} carte.`),
        h('div', { class: 'azioni' }, h('button', { class: 'btn primario', onclick: () => { coda = [...carte]; sapute = 0; girata = false; disegna(); } }, '🔁 Ricomincia'),
          h('button', { class: 'btn', onclick: () => { chiudi(); esci(); } }, 'Impostazioni'))));
      return;
    }
    const l = lati(coda[0]);
    sostituisci(zona,
      h('div', { class: 'barra' }, h('progress', { max: totale, value: sapute, 'aria-label': 'Carte imparate' }), h('span', {}, `Sapute: ${sapute} · ancora da fare: ${coda.length}`),
        h('button', { class: 'btn', onclick: () => { chiudi(); esci(); } }, '✕ Esci')),
      h('button', { class: 'carta' + (girata ? ' girata' : ''), onclick: () => { girata = !girata; disegna(); }, 'aria-label': girata ? 'Carta girata. Tocca per tornare davanti' : 'Tocca per girare la carta' },
        h('span', { class: 'carta-etichetta' }, girata ? 'Risposta' : l.etichetta),
        h('span', { class: 'carta-testo' }, girata ? l.retro : l.fronte),
        girata ? h('span', { class: 'carta-extra' }, l.extra.map((x) => h('span', {}, x))) : h('span', { class: 'tenue' }, 'Tocca per girare')),
      h('div', { class: 'azioni' },
        h('button', { class: 'btn', onclick: () => leggi(girata ? l.lettura[1] : l.lettura[0]) }, '🔊 Leggi'),
        girata && l.en ? h('button', { class: 'btn', onclick: () => leggi(l.en, 'en') }, '🔊 English') : null,
        !girata ? h('button', { class: 'btn primario grande', onclick: () => { girata = true; disegna(); } }, '🔄 Gira la carta') : [
          h('button', { class: 'btn no grande', onclick: () => segna(false) }, '↻ Da ripassare'),
          h('button', { class: 'btn ok grande', onclick: () => segna(true) }, '✔ La so')]));
  }
  disegna();
  return { smonta: chiudi };
}
