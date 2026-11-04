// Pagina "Verifiche": genera verifiche A/B, versione semplificata e correttore, pronte per la stampa (A4 / PDF).
import { h, sostituisci } from '../dom.js';
import { NOMI_MATERIA } from '../core/contenuti.js';
import { filtraDomande, conVuoto } from '../core/quiz.js';
import { generaVerifica, soluzioneBreve, puntiTotali, puntiDomanda, CONSEGNE_NORMALI, CONSEGNE_SEMPLIFICATE, ORDINE_SEMPLIFICATA } from '../core/verifica.js';
import { lettera } from '../core/utils.js';

const NOMI_PARTE = { vf: 'Vero o falso', scelta: 'Scelta multipla', completa: 'Completa la frase', abbina: 'Abbina' };

export function monta(radice, ctx, param) {
  const c = ctx.contenuti;
  const imp = {
    classe: 1, materia: '', argomenti: new Set(param.get('arg') ? [param.get('arg')] : []), n: 12, seme: nuovoSeme(),
    fogli: { A: true, B: true, semplificata: true, correttore: true }, titolo: '', scuola: '',
  };
  const comandi = h('div', { class: 'scheda no-stampa' });
  const anteprima = h('div', { class: 'anteprima', 'aria-label': 'Anteprima della verifica' });
  radice.append(h('h1', { class: 'no-stampa' }, 'Verifiche stampabili'), comandi, anteprima);

  function disegna() {
    const argVisibili = c.argomenti.filter((a) => a.classe === imp.classe && (!imp.materia || a.materia === imp.materia));
    const scelti = [...imp.argomenti].filter((id) => argVisibili.some((a) => a.id === id));
    const pool = filtraDomande(c, { classe: imp.classe, materia: imp.materia, argomenti: scelti });
    const scelta = (chiave, valori, etichette, dopo) => h('div', { class: 'gruppo-btn' }, valori.map((v, i) =>
      h('button', { class: 'btn' + (imp[chiave] === v ? ' attivo' : ''), 'aria-pressed': String(imp[chiave] === v), onclick: () => { imp[chiave] = v; dopo?.(); disegna(); } }, etichette[i])));
    sostituisci(comandi,
      h('div', { class: 'riga-imp colonna' }, h('strong', {}, 'Classe'), scelta('classe', [1, 2], ['Prima', 'Seconda'], () => imp.argomenti.clear())),
      h('div', { class: 'riga-imp colonna' }, h('strong', {}, 'Materia'), scelta('materia', ['', 'storia', 'geografia', 'civica'], ['Tutte', 'Storia', 'Geografia', 'Ed. civica'])),
      h('fieldset', {}, h('legend', {}, 'Argomenti (nessuno selezionato = tutti)'),
        h('div', { class: 'azioni' }, h('button', { class: 'btn', onclick: () => { argVisibili.forEach((a) => imp.argomenti.add(a.id)); disegna(); } }, 'Seleziona tutti'),
          h('button', { class: 'btn', onclick: () => { imp.argomenti.clear(); disegna(); } }, 'Nessuno')),
        h('div', { class: 'elenco-argomenti elenco-colonne' }, argVisibili.map((a) => h('label', {}, h('input', { type: 'checkbox', checked: imp.argomenti.has(a.id),
          onchange: (e) => { e.target.checked ? imp.argomenti.add(a.id) : imp.argomenti.delete(a.id); disegna(); } }), `${a.icona || ''} ${a.titolo}`)))),
      h('div', { class: 'barra' },
        h('label', {}, 'Numero di domande: ', h('select', { onchange: (e) => { imp.n = Number(e.target.value); disegna(); } }, [6, 8, 10, 12, 15, 20, 25, 30].map((n) => h('option', { value: n, selected: imp.n === n }, n)))),
        h('label', {}, 'Titolo (facoltativo): ', h('input', { type: 'text', value: imp.titolo, placeholder: 'es. Verifica di storia', oninput: (e) => { imp.titolo = e.target.value; ridisegnaFogli(); } })),
        h('label', {}, 'Scuola / docente (facoltativo): ', h('input', { type: 'text', value: imp.scuola, oninput: (e) => { imp.scuola = e.target.value; ridisegnaFogli(); } }))),
      h('fieldset', {}, h('legend', {}, 'Fogli da stampare'),
        h('div', { class: 'barra' }, [['A', 'Variante A'], ['B', 'Variante B'], ['semplificata', 'Versione semplificata'], ['correttore', 'Correttore con le soluzioni']].map(([k, t]) =>
          h('label', {}, h('input', { type: 'checkbox', checked: imp.fogli[k], onchange: (e) => { imp.fogli[k] = e.target.checked; ridisegnaFogli(); } }), ` ${t}`)))),
      h('div', { class: 'barra' }, h('span', { class: 'tenue' }, `Domande disponibili: ${pool.length}`),
        h('label', {}, 'Codice verifica: ', h('input', { type: 'number', min: 1, max: 999999, value: imp.seme, 'aria-label': 'Codice della verifica',
          onchange: (e) => { imp.seme = Math.max(1, Math.floor(Number(e.target.value) || 1)); ridisegnaFogli(); } })),
        h('button', { class: 'btn', onclick: () => { imp.seme = nuovoSeme(); disegna(); } }, '🔀 Nuove domande'),
        h('button', { class: 'btn primario grande', onclick: () => window.print(), disabled: pool.length === 0 }, '🖨️ Stampa / salva in PDF')),
      h('p', { class: 'tenue' }, 'Il codice permette di ritrovare la stessa verifica (stesse domande e stesso ordine). Nella finestra di stampa scegli «Salva come PDF» oppure la stampante; formato A4.'));
    ridisegnaFogli();
  }

  function ridisegnaFogli() {
    const argVisibili = c.argomenti.filter((a) => a.classe === imp.classe && (!imp.materia || a.materia === imp.materia));
    const scelti = [...imp.argomenti].filter((id) => argVisibili.some((a) => a.id === id));
    const idsUsati = scelti.length ? scelti : argVisibili.map((a) => a.id);
    const pool = filtraDomande(c, { classe: imp.classe, materia: imp.materia, argomenti: scelti });
    if (pool.length === 0) { sostituisci(anteprima, h('div', { class: 'vuoto' }, 'Non ci sono domande con questi filtri.')); return; }
    const v = generaVerifica(pool, { n: imp.n, seme: imp.seme });
    const nomiArg = idsUsati.map((id) => c.argomenti.find((a) => a.id === id)?.titolo).filter(Boolean);
    const materie = [...new Set(argVisibili.filter((a) => idsUsati.includes(a.id)).map((a) => NOMI_MATERIA[a.materia]))].join(' / ');
    const info = { titolo: imp.titolo || `Verifica di ${materie || 'storia e geografia'}`, classe: imp.classe, argomenti: nomiArg, scuola: imp.scuola, seme: imp.seme };
    sostituisci(anteprima,
      imp.fogli.A ? foglioVerifica(v.A, info, 'Variante A', false) : null,
      imp.fogli.B ? foglioVerifica(v.B, info, 'Variante B', false) : null,
      imp.fogli.semplificata ? foglioVerifica(v.semplificata, info, 'Versione semplificata', true) : null,
      imp.fogli.correttore ? foglioCorrettore(v, info, imp.fogli) : null);
  }

  disegna();
}

const nuovoSeme = () => 1 + Math.floor(Math.random() * 99999);

/** Intestazione comune a tutti i fogli. */
function intestazione(info, nome, totale, semplice) {
  return h('header', { class: 'intestazione' },
    h('div', { class: 'int-riga' }, h('strong', { class: 'int-titolo' }, info.titolo), h('span', { class: 'int-variante' }, nome)),
    h('div', { class: 'int-sotto' }, `Classe ${info.classe}ª${info.scuola ? ' · ' + info.scuola : ''} · Argomenti: ${info.argomenti.length > 4 ? info.argomenti.slice(0, 4).join(', ') + '…' : info.argomenti.join(', ')}`),
    h('div', { class: 'int-campi' }, h('span', {}, 'Nome e cognome: ', h('i', { class: 'riga-vuota lunga' })), h('span', {}, 'Classe: ', h('i', { class: 'riga-vuota' })), h('span', {}, 'Data: ', h('i', { class: 'riga-vuota' }))),
    h('div', { class: 'int-campi' }, h('span', {}, `Punteggio: `, h('i', { class: 'riga-vuota corta' }), ` / ${totale}`), semplice ? h('span', {}, 'Leggi con calma. Puoi chiedere aiuto.') : h('span', { class: 'tenue' }, '1 punto per risposta (abbinamenti: 1 punto per coppia)')));
}

/** Un foglio di verifica (variante A, B o semplificata). */
function foglioVerifica(domande, info, nome, semplice) {
  const foglio = h('section', { class: 'foglio' + (semplice ? ' foglio-semplice' : ''), 'aria-label': nome });
  foglio.append(intestazione(info, nome, puntiTotali(domande), semplice));
  let numero = 0;
  if (semplice) {
    for (const tipo of ORDINE_SEMPLIFICATA) {
      const gruppo = domande.filter((d) => d.tipo === tipo);
      if (!gruppo.length) continue;
      foglio.append(h('div', { class: 'parte' },
        h('h2', {}, NOMI_PARTE[tipo]),
        h('ol', { class: 'passi' }, CONSEGNE_SEMPLIFICATE[tipo].map((p) => h('li', {}, p))),
        gruppo.map((d) => domanda(d, ++numero, true))));
    }
  } else {
    foglio.append(...domande.map((d) => domanda(d, ++numero, false)));
  }
  return foglio;
}

/** Una domanda stampabile. */
function domanda(d, n, semplice) {
  const testo = d.tipo === 'completa' ? conVuoto(d.testo, '____________________') : d.testo;
  const corpo = [];
  if (d.tipo === 'scelta') {
    corpo.push(h('ul', { class: 'opzioni-stampa' }, d.opzioni.map((o, i) => h('li', {}, h('span', { class: 'casella' }, '☐'), ` ${lettera(i)}) ${o}`))));
  } else if (d.tipo === 'vf') {
    corpo.push(h('p', { class: 'vf-stampa' }, h('span', { class: 'casella' }, '☐'), ' V (vero)', h('span', { class: 'spazio' }), h('span', { class: 'casella' }, '☐'), ' F (falso)'));
  } else if (d.tipo === 'completa' && d.paroleAiuto) {
    corpo.push(h('p', { class: 'aiuto' }, h('strong', {}, 'Parole aiuto: '), d.paroleAiuto.join('   ·   ')));
  } else if (d.tipo === 'abbina') {
    corpo.push(h('div', { class: 'abbina-stampa' },
      h('ol', {}, d.sinistra.map((s) => h('li', {}, s, h('i', { class: 'riga-vuota corta' })))),
      h('ul', {}, d.destra.map((x, i) => h('li', {}, `${lettera(i)}) ${x}`)))));
  }
  return h('div', { class: 'domanda' },
    h('p', { class: 'testo-domanda' }, h('strong', { class: 'num' }, `${n}. `), testo,
      !semplice ? h('span', { class: 'consegna' }, ` (${CONSEGNE_NORMALI[d.tipo]})`) : null),
    ...corpo);
}

/** Foglio con le soluzioni di tutte le versioni stampate. */
function foglioCorrettore(v, info, fogli) {
  const tabella = (titolo, domande) => h('div', { class: 'blocco-correttore' },
    h('h2', {}, `${titolo} — totale ${puntiTotali(domande)} punti`),
    h('table', { class: 'tabella' }, h('thead', {}, h('tr', {}, h('th', {}, 'N.'), h('th', {}, 'Risposta corretta'), h('th', {}, 'Perché'))),
      h('tbody', {}, domande.map((d, i) => h('tr', {}, h('td', {}, i + 1), h('td', {}, h('strong', {}, soluzioneBreve(d)), puntiDomanda(d) > 1 ? ` (${puntiDomanda(d)} punti)` : ''), h('td', {}, d.spiegazione))))));
  return h('section', { class: 'foglio foglio-correttore', 'aria-label': 'Correttore' },
    h('header', { class: 'intestazione' }, h('div', { class: 'int-riga' }, h('strong', { class: 'int-titolo' }, `Correttore — ${info.titolo}`), h('span', { class: 'int-variante' }, `Codice ${info.seme}`)),
      h('div', { class: 'int-sotto' }, `Classe ${info.classe}ª · Solo per il docente`)),
    fogli.A ? tabella('Variante A', v.A) : null, fogli.B ? tabella('Variante B', v.B) : null, fogli.semplificata ? tabella('Versione semplificata', v.semplificata) : null);
}
