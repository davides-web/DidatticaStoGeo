// Quiz individuale: una domanda alla volta, correzione immediata e spiegazione.
import { h, sostituisci } from '../dom.js';
import { controllaRisposta, soluzioneTesto, conVuoto, coppieGiuste, NOMI_TIPO } from '../core/quiz.js';
import { lettera, mescola } from '../core/utils.js';
import { leggi, fermaLettura } from '../voce.js';

export function avvia(radice, { domande, esci }) {
  let elenco = domande;
  let indice = 0;
  let risultati = []; // {d, giusta, parziali}
  let risposta = null; // {giusta, ...} dopo la correzione
  const zona = h('div', { class: 'quiz-ind' });
  radice.append(zona);
  const chiudi = () => { fermaLettura(); zona.remove(); };

  function disegna() {
    fermaLettura();
    if (indice >= elenco.length) return riepilogo();
    const d = elenco[indice];
    const risp = h('div', { class: 'quiz-risposte' });
    corpoDomanda(d, risp);
    sostituisci(zona,
      h('div', { class: 'barra' }, h('progress', { max: elenco.length, value: indice, 'aria-label': 'Avanzamento' }), h('span', {}, `Domanda ${indice + 1} di ${elenco.length}`),
        h('button', { class: 'btn', onclick: () => { chiudi(); esci(); } }, '✕ Esci')),
      h('div', { class: 'scheda' },
        h('p', { class: 'tenue' }, NOMI_TIPO[d.tipo]),
        h('p', { class: 'quiz-testo' }, d.tipo === 'completa' ? conVuoto(d.testo) : d.testo,
          h('button', { class: 'btn', onclick: () => leggi(d.tipo === 'completa' ? conVuoto(d.testo, 'spazio vuoto') : d.testo), 'aria-label': 'Leggi la domanda ad alta voce' }, '🔊')),
        risp,
        risposta ? feedback(d) : null));
  }

  /** Costruisce i controlli di risposta in base al tipo di domanda. */
  function corpoDomanda(d, dove) {
    const fatto = !!risposta;
    if (d.tipo === 'scelta' || d.tipo === 'vf') {
      const voci = d.tipo === 'scelta' ? d.opzioni.map((o, i) => [i, o]) : [[true, 'Vero'], [false, 'Falso']];
      dove.append(h('div', { class: 'quiz-opzioni' }, voci.map(([val, testo], i) => {
        const giusta = val === d.corretta;
        return h('button', { class: 'btn quiz-opzione' + (fatto ? (giusta ? ' ok' : (risposta.scelta === val ? ' no' : '')) : ''), disabled: fatto,
          onclick: () => rispondi(d, val, controllaRisposta(d, val)) }, d.tipo === 'scelta' ? h('span', { class: 'lim-lettera' }, lettera(i)) : null, testo);
      })));
    } else if (d.tipo === 'completa') {
      const campo = h('input', { type: 'text', 'aria-label': 'La tua risposta', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', disabled: fatto, value: fatto ? risposta.scelta : '' });
      campo.addEventListener('keydown', (e) => { if (e.key === 'Enter' && campo.value.trim()) rispondi(d, campo.value, controllaRisposta(d, campo.value)); });
      dove.append(h('div', { class: 'barra' }, campo, fatto ? null : h('button', { class: 'btn primario', onclick: () => { if (campo.value.trim()) rispondi(d, campo.value, controllaRisposta(d, campo.value)); } }, 'Controlla')),
        d.distrattori && !fatto ? h('p', { class: 'tenue' }, 'Aiuto: la parola è una tra ', mescola([d.risposta, ...d.distrattori]).map((p, i, a) => h('strong', {}, p, i < a.length - 1 ? ' · ' : '')), '') : null);
      if (!fatto) setTimeout(() => campo.focus(), 0);
    } else if (d.tipo === 'abbina') {
      const scelte = d.sinistra.map((s, i) => h('select', { 'aria-label': `Abbinamento per ${s}`, disabled: fatto },
        h('option', { value: '' }, '— scegli —'), d.destra.map((x) => h('option', { value: x, selected: fatto && risposta.scelta[i] === x }, x))));
      dove.append(h('div', { class: 'quiz-abbina' }, d.sinistra.map((s, i) => h('label', {}, h('strong', {}, `${i + 1}. ${s}`), scelte[i]))),
        fatto ? null : h('button', { class: 'btn primario', onclick: () => {
          const r = scelte.map((sel) => sel.value);
          if (r.some((x) => !x)) { alert('Completa tutti gli abbinamenti.'); return; }
          rispondi(d, r, controllaRisposta(d, r));
        } }, 'Controlla'));
      if (fatto) scelte.forEach((sel, i) => sel.classList.add(risposta.scelta[i] === d.coppie[i][1] ? 'esatta' : 'errata'));
    }
  }

  function rispondi(d, scelta, giusta) {
    risposta = { scelta, giusta };
    risultati.push({ d, giusta, parziali: d.tipo === 'abbina' ? coppieGiuste(d, scelta) : null });
    disegna();
  }

  function feedback(d) {
    return h('div', { class: 'quiz-feedback ' + (risposta.giusta ? 'successo' : 'errore'), 'aria-live': 'polite' },
      h('strong', {}, risposta.giusta ? '✔ Esatto!' : '✘ Non proprio.'),
      !risposta.giusta ? h('p', {}, h('strong', {}, 'Risposta giusta: '), soluzioneTesto(d)) : null,
      h('p', {}, d.spiegazione, ' ', h('button', { class: 'btn', onclick: () => leggi(d.spiegazione), 'aria-label': 'Leggi la spiegazione' }, '🔊')),
      h('button', { class: 'btn primario grande', onclick: () => { risposta = null; indice++; disegna(); } }, indice + 1 >= elenco.length ? 'Vedi il risultato' : 'Avanti →'));
  }

  function riepilogo() {
    const giuste = risultati.filter((r) => r.giusta).length;
    const sbagliate = risultati.filter((r) => !r.giusta);
    const perc = Math.round((giuste / risultati.length) * 100);
    sostituisci(zona, h('div', { class: 'scheda' },
      h('h2', {}, 'Risultato'),
      h('p', { class: 'punteggio-grande' }, `${giuste} su ${risultati.length}`),
      h('progress', { max: 100, value: perc, 'aria-label': 'Percentuale' }), h('p', {}, `${perc}% di risposte esatte. ${perc >= 80 ? 'Ottimo lavoro! 🌟' : perc >= 60 ? 'Bene, ancora un ripasso! 👍' : 'Rivedi gli argomenti e riprova: ce la puoi fare! 💪'}`),
      sbagliate.length ? h('details', { open: true }, h('summary', {}, `Da ripassare (${sbagliate.length})`),
        h('ul', { class: 'dsa-lista' }, sbagliate.map((r) => h('li', {}, h('strong', {}, r.d.tipo === 'completa' ? conVuoto(r.d.testo) : r.d.testo), h('br'), `→ ${soluzioneTesto(r.d)}`, h('br'), h('span', { class: 'tenue' }, r.d.spiegazione))))) : h('div', { class: 'successo' }, '🎉 Nessun errore!'),
      h('div', { class: 'azioni' },
        sbagliate.length ? h('button', { class: 'btn primario', onclick: () => { elenco = sbagliate.map((r) => r.d); indice = 0; risultati = []; risposta = null; disegna(); } }, '🔁 Rifai solo gli errori') : null,
        h('button', { class: 'btn', onclick: () => { chiudi(); esci(); } }, 'Nuovo quiz'))));
  }

  disegna();
  return { smonta: chiudi };
}
