// Pagina "Glossario": termini con definizione semplice, traduzione e definizione in inglese, esempio, ascolto.
import { h, sostituisci } from '../dom.js';
import { NOMI_MATERIA } from '../core/contenuti.js';
import { normalizza } from '../core/utils.js';
import { leggi, fermaLettura } from '../voce.js';

export function monta(radice, ctx, param) {
  const c = ctx.contenuti;
  const f = { classe: 0, materia: '', arg: param.get('arg') || '', testo: '', inglese: true, esempi: true };
  const barra = h('div');
  const elenco = h('div', { class: 'griglia griglia-glossario' });
  const dialogo = h('dialog', { class: 'dialogo-evento' });
  dialogo.addEventListener('click', (e) => { if (e.target === dialogo) dialogo.close(); });
  radice.append(h('h1', {}, 'Glossario'), barra, elenco, dialogo);
  const argDi = new Map(c.argomenti.map((a) => [a.id, a]));

  function disegna(ridisegnaBarra = true) {
    const argomenti = c.argomenti.filter((a) => (!f.classe || a.classe === f.classe) && (!f.materia || a.materia === f.materia));
    if (f.arg && !argomenti.some((a) => a.id === f.arg)) f.arg = '';
    if (ridisegnaBarra) {
      const sel = h('select', { 'aria-label': 'Argomento', onchange: (e) => { f.arg = e.target.value; disegna(false); } },
        h('option', { value: '' }, 'Tutti gli argomenti'), argomenti.map((a) => h('option', { value: a.id }, a.titolo)));
      sel.value = f.arg;
      const scelta = (chiave, valori, etichette) => h('div', { class: 'gruppo-btn' }, valori.map((v, i) =>
        h('button', { class: 'btn' + (f[chiave] === v ? ' attivo' : ''), 'aria-pressed': String(f[chiave] === v), onclick: () => { f[chiave] = v; disegna(); } }, etichette[i])));
      const cerca = h('input', { type: 'search', placeholder: 'Cerca un termine…', 'aria-label': 'Cerca', value: f.testo, oninput: (e) => { f.testo = e.target.value; disegna(false); } });
      sostituisci(barra,
        h('div', { class: 'barra' }, scelta('classe', [0, 1, 2], ['Tutte le classi', 'Prima', 'Seconda']), scelta('materia', ['', 'storia', 'geografia', 'civica'], ['Tutte', 'Storia', 'Geografia', 'Ed. civica'])),
        h('div', { class: 'barra' }, sel, cerca,
          h('label', {}, h('input', { type: 'checkbox', checked: f.inglese, onchange: (e) => { f.inglese = e.target.checked; disegna(false); } }), ' Mostra inglese'),
          h('label', {}, h('input', { type: 'checkbox', checked: f.esempi, onchange: (e) => { f.esempi = e.target.checked; disegna(false); } }), ' Mostra esempi')));
    }
    const ids = new Set(argomenti.map((a) => a.id));
    const q = normalizza(f.testo);
    const termini = c.glossario.filter((g) => ids.has(g.argomento) && (!f.arg || g.argomento === f.arg) &&
      (!q || normalizza(`${g.termine} ${g.inglese} ${g.definizione}`).includes(q)))
      .sort((a, b) => a.termine.localeCompare(b.termine, 'it'));
    sostituisci(elenco, termini.length === 0 ? h('div', { class: 'vuoto' }, 'Nessun termine trovato.') : termini.map(scheda));
  }

  function scheda(g) {
    const a = argDi.get(g.argomento);
    return h('article', { class: 'scheda termine' },
      h('div', { class: 'termine-testa' },
        h('h2', {}, g.termine),
        h('div', { class: 'gruppo-btn' },
          h('button', { class: 'btn', onclick: () => leggi(`${g.termine}. ${g.definizione}`, 'it'), 'aria-label': `Ascolta in italiano: ${g.termine}`, title: 'Ascolta in italiano' }, '🔊 IT'),
          f.inglese ? h('button', { class: 'btn', onclick: () => leggi(`${g.inglese}. ${g.definizione_en}`, 'en'), 'aria-label': `Listen in English: ${g.inglese}`, title: 'Listen in English' }, '🔊 EN') : null,
          h('button', { class: 'btn', onclick: () => ingrandisci(g), 'aria-label': `Ingrandisci: ${g.termine}`, title: 'Ingrandisci per la LIM' }, '⛶'))),
      h('p', { class: 'definizione' }, g.definizione),
      f.inglese ? h('p', { class: 'inglese', lang: 'en' }, h('strong', {}, `🇬🇧 ${g.inglese}`), ' — ', g.definizione_en) : null,
      f.esempi ? h('p', { class: 'esempio' }, h('em', {}, `Esempio: ${g.esempio}`)) : null,
      h('p', { class: 'tenue piccolo' }, a ? h('a', { href: `#/studio?arg=${a.id}` }, `${NOMI_MATERIA[a.materia]} · ${a.titolo}`) : ''));
  }

  function ingrandisci(g) {
    sostituisci(dialogo, h('div', { class: 'pannello scheda-evento' },
      h('h2', { class: 'termine-grande' }, g.termine),
      h('p', { class: 'descr-evento' }, g.definizione),
      h('p', { class: 'inglese-grande', lang: 'en' }, h('strong', {}, `🇬🇧 ${g.inglese}`), h('br'), g.definizione_en),
      h('p', { class: 'tenue' }, h('em', {}, g.esempio)),
      h('div', { class: 'azioni' },
        h('button', { class: 'btn', onclick: () => leggi(`${g.termine}. ${g.definizione}`, 'it') }, '🔊 Italiano'),
        h('button', { class: 'btn', onclick: () => leggi(`${g.inglese}. ${g.definizione_en}`, 'en') }, '🔊 English'),
        h('button', { class: 'btn primario', onclick: () => dialogo.close() }, 'Chiudi'))));
    dialogo.showModal();
  }

  disegna();
  return { smonta: fermaLettura };
}
