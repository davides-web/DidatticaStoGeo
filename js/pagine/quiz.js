// Pagina "Quiz": scelta di classe, argomenti e modalità; poi parte uno dei tre giochi.
import { h, sostituisci } from '../dom.js';
import { NOMI_MATERIA } from '../core/contenuti.js';
import { filtraDomande, preparaDomanda, NOMI_TIPO } from '../core/quiz.js';
import { NOMI_PREDEFINITI } from '../core/squadre.js';
import { mescola } from '../core/utils.js';

let attivo = null; // modalità in corso (per poterla chiudere quando si cambia pagina)

export function monta(radice, ctx, param) {
  const c = ctx.contenuti;
  const imp = {
    classe: 0, materia: '', argomenti: new Set(param.get('arg') ? [param.get('arg')] : []), tipi: new Set(),
    n: 10, modo: param.get('modo') || 'lim', nomi: [...NOMI_PREDEFINITI], nSquadre: 2, timer: 0, fonte: 'domande',
  };
  const zona = h('div');
  radice.append(h('h1', {}, 'Quiz'), zona);

  function disegna() {
    const argVisibili = c.argomenti.filter((a) => (!imp.classe || a.classe === imp.classe) && (!imp.materia || a.materia === imp.materia));
    const poss = filtraDomande(c, { classe: imp.classe, materia: imp.materia, argomenti: [...imp.argomenti].filter((id) => argVisibili.some((a) => a.id === id)), tipi: [...imp.tipi] });
    const gruppo = (nome, valori, chiave, etichette) => h('div', { class: 'riga-imp colonna' }, h('strong', {}, nome),
      h('div', { class: 'gruppo-btn' }, valori.map((v, i) => h('button', { class: 'btn' + (imp[chiave] === v ? ' attivo' : ''), 'aria-pressed': String(imp[chiave] === v),
        onclick: () => { imp[chiave] = v; disegna(); } }, etichette[i]))));

    sostituisci(zona,
      h('div', { class: 'scheda' },
        gruppo('Modalità', ['lim', 'individuale', 'flashcard'], 'modo', ['🏆 LIM a squadre', '✏️ Individuale', '🃏 Flashcard']),
        imp.modo === 'flashcard' ? gruppo('Cosa ripassare', ['domande', 'glossario'], 'fonte', ['Domande del quiz', 'Termini del glossario']) : null,
        gruppo('Classe', [0, 1, 2], 'classe', ['Tutte', 'Prima', 'Seconda']),
        gruppo('Materia', ['', 'storia', 'geografia', 'civica'], 'materia', ['Tutte', 'Storia', 'Geografia', 'Ed. civica']),
        h('fieldset', {}, h('legend', {}, 'Argomenti (nessuno selezionato = tutti)'),
          h('div', { class: 'azioni' },
            h('button', { class: 'btn', onclick: () => { argVisibili.forEach((a) => imp.argomenti.add(a.id)); disegna(); } }, 'Seleziona tutti'),
            h('button', { class: 'btn', onclick: () => { imp.argomenti.clear(); disegna(); } }, 'Nessuno')),
          h('div', { class: 'elenco-argomenti elenco-colonne' }, argVisibili.map((a) =>
            h('label', {}, h('input', { type: 'checkbox', checked: imp.argomenti.has(a.id), onchange: (e) => { e.target.checked ? imp.argomenti.add(a.id) : imp.argomenti.delete(a.id); disegna(); } }),
              `${a.icona || ''} ${a.titolo}`, h('span', { class: 'tenue piccolo' }, ` · ${NOMI_MATERIA[a.materia]} ${a.classe}ª`))))),
        imp.modo !== 'flashcard' || imp.fonte === 'domande' ? h('fieldset', {}, h('legend', {}, 'Tipi di domanda (nessuno selezionato = tutti)'),
          h('div', { class: 'gruppo-btn' }, Object.entries(NOMI_TIPO).map(([k, t]) =>
            h('label', { class: 'btn' + (imp.tipi.has(k) ? ' attivo' : '') }, h('input', { type: 'checkbox', class: 'solo-lettori', checked: imp.tipi.has(k),
              onchange: (e) => { e.target.checked ? imp.tipi.add(k) : imp.tipi.delete(k); disegna(); } }), t)))) : null,
        h('div', { class: 'barra' }, h('label', {}, 'Numero di domande: ', h('select', { onchange: (e) => { imp.n = Number(e.target.value); } },
          [5, 10, 15, 20, 30, 0].map((n) => h('option', { value: n, selected: imp.n === n }, n ? n : 'tutte'))))),
        imp.modo === 'lim' ? opzioniSquadre(imp, disegna) : null,
        h('p', { class: 'tenue' }, imp.modo === 'flashcard' && imp.fonte === 'glossario' ? '' : `Domande disponibili con questi filtri: ${poss.length}`),
        h('button', { class: 'btn primario grande', disabled: poss.length === 0 && !(imp.modo === 'flashcard' && imp.fonte === 'glossario'),
          onclick: () => avvia(imp, argVisibili, poss) }, '▶ Comincia')));
  }

  async function avvia(imp, argVisibili, poss) {
    const esci = () => { attivo?.smonta?.(); attivo = null; sostituisci(zona); disegna(); zona.hidden = false; };
    const ids = (imp.argomenti.size ? [...imp.argomenti].filter((id) => argVisibili.some((a) => a.id === id)) : argVisibili.map((a) => a.id));
    zona.hidden = true;
    if (imp.modo === 'flashcard' && imp.fonte === 'glossario') {
      let termini = mescola(c.glossario.filter((g) => ids.includes(g.argomento)));
      if (imp.n) termini = termini.slice(0, imp.n);
      const { avvia: av } = await import('../quiz/flashcard.js');
      attivo = av(radice, { carte: termini.map((g) => ({ tipo: 'glossario', g })), esci });
      return;
    }
    let scelte = mescola(poss);
    if (imp.n) scelte = scelte.slice(0, imp.n);
    const domande = scelte.map((d) => preparaDomanda(d));
    if (imp.modo === 'lim') {
      const { avvia: av } = await import('../quiz/lim.js');
      attivo = av(radice, { domande, nomi: imp.nomi.slice(0, imp.nSquadre), timer: imp.timer, esci });
    } else if (imp.modo === 'individuale') {
      const { avvia: av } = await import('../quiz/individuale.js');
      attivo = av(radice, { domande, esci });
    } else {
      const { avvia: av } = await import('../quiz/flashcard.js');
      attivo = av(radice, { carte: domande.map((d) => ({ tipo: 'domanda', d })), esci });
    }
  }

  disegna();
  return { smonta: () => { attivo?.smonta?.(); attivo = null; } };
}

/** Opzioni della modalità a squadre: quante squadre, i loro nomi, il timer. */
function opzioniSquadre(imp, disegna) {
  return h('fieldset', {}, h('legend', {}, 'Squadre'),
    h('div', { class: 'gruppo-btn' }, [2, 3, 4].map((n) => h('button', { class: 'btn' + (imp.nSquadre === n ? ' attivo' : ''), onclick: () => { imp.nSquadre = n; disegna(); } }, `${n} squadre`))),
    h('div', { class: 'griglia-nomi' }, imp.nomi.slice(0, imp.nSquadre).map((nome, i) =>
      h('label', {}, `Squadra ${i + 1}: `, h('input', { type: 'text', value: nome, maxlength: 24, oninput: (e) => { imp.nomi[i] = e.target.value || NOMI_PREDEFINITI[i]; } })))),
    h('label', { class: 'riga-check' }, 'Timer per domanda: ', h('select', { onchange: (e) => { imp.timer = Number(e.target.value); } },
      [[0, 'nessuno'], [15, '15 secondi'], [30, '30 secondi'], [45, '45 secondi'], [60, '1 minuto'], [90, '90 secondi']].map(([v, t]) => h('option', { value: v, selected: imp.timer === v }, t)))));
}
