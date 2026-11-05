// Pagina "Studio": elenco degli argomenti e lettura della sintesi (normale o semplificata).
import { h, sostituisci, aggiungi } from '../dom.js';
import { NOMI_MATERIA, ICONE_MATERIA } from '../core/contenuti.js';
import { leggi, fermaLettura } from '../voce.js';

export function monta(radice, ctx, param) {
  const c = ctx.contenuti;
  const id = param.get('arg');
  const argomento = c.argomenti.find((a) => a.id === id);
  if (argomento) dettaglio(radice, c, argomento);
  else elenco(radice, c);
}

function elenco(radice, c) {
  let filtro = 'tutti';
  const zona = h('div');
  const chip = h('div', { class: 'barra', role: 'group', 'aria-label': 'Filtra per materia e classe' });
  const filtri = [['tutti', 'Tutto'], ['storia-1', 'Storia · prima'], ['storia-2', 'Storia · seconda'], ['geografia-1', 'Geografia · prima'], ['civica', 'Educazione civica']];

  function disegna() {
    sostituisci(chip, filtri.map(([k, t]) =>
      h('button', { class: 'btn' + (filtro === k ? ' attivo' : ''), 'aria-pressed': String(filtro === k), onclick: () => { filtro = k; disegna(); } }, t)));
    const scelti = c.argomenti.filter((a) => filtro === 'tutti' || (filtro === 'civica' ? a.materia === 'civica' : `${a.materia}-${a.classe}` === filtro));
    sostituisci(zona, scelti.length === 0 ? h('div', { class: 'vuoto' }, 'Nessun argomento in questa sezione.') :
      h('div', { class: 'griglia' }, scelti.map((a) =>
        h('a', { class: 'scheda modulo', href: `#/studio?arg=${a.id}` },
          h('span', { class: 'icona', 'aria-hidden': 'true' }, a.icona || ICONE_MATERIA[a.materia]),
          h('strong', {}, a.titolo),
          h('span', { class: 'tenue' }, `${NOMI_MATERIA[a.materia]} · classe ${a.classe}ª`)))));
  }
  disegna();
  aggiungi(radice, [h('h1', {}, 'Studio'), chip, zona]);
}

function dettaglio(radice, c, a) {
  let versione = 'sintesi';
  const testo = h('div');
  const bottoni = h('div', { class: 'barra' });

  const paragrafi = () => (versione === 'sintesi' ? a.sintesi : a.semplificata).split(/\n\s*\n/);

  function disegna() {
    sostituisci(bottoni,
      h('button', { class: 'btn' + (versione === 'sintesi' ? ' attivo' : ''), onclick: () => { versione = 'sintesi'; fermaLettura(); disegna(); } }, 'Sintesi'),
      h('button', { class: 'btn' + (versione === 'semplificata' ? ' attivo' : ''), onclick: () => { versione = 'semplificata'; fermaLettura(); disegna(); } }, 'Versione semplificata'),
      h('button', { class: 'btn', onclick: () => leggi(paragrafi().join(' '), 'it') }, '🔊 Leggi ad alta voce'),
      h('button', { class: 'btn', onclick: fermaLettura }, '⏹ Ferma'));
    sostituisci(testo, h('div', { class: 'testo-studio' + (versione === 'semplificata' ? ' semplificata' : '') }, paragrafi().map((p) => h('p', {}, p))));
  }
  disegna();

  const chiave = [...c.eventi, ...c.concetti].filter((x) => x.argomento === a.id).sort((x, y) => (x.anno ?? 0) - (y.anno ?? 0));
  const collegati = c.argomenti.filter((x) => (a.collegamenti || []).includes(x.id) || (x.collegamenti || []).includes(a.id));
  const ha = (coll) => c[coll].some((x) => x.argomento === a.id);

  aggiungi(radice, [
    h('p', {}, h('a', { href: '#/studio' }, '← Tutti gli argomenti')),
    h('h1', {}, `${a.icona || ''} ${a.titolo}`),
    h('p', { class: 'tenue' }, `${NOMI_MATERIA[a.materia]} · classe ${a.classe}ª`),
    bottoni, testo,
    h('div', { class: 'azioni' },
      ha('eventi') ? h('a', { class: 'btn', href: `#/timeline?arg=${a.id}` }, '⏳ Linea del tempo') : null,
      h('a', { class: 'btn', href: `#/quiz?arg=${a.id}` }, '❓ Quiz'),
      h('a', { class: 'btn', href: `#/glossario?arg=${a.id}` }, '🔤 Glossario')),
    chiave.length ? h('div', { class: 'scheda' }, h('h2', {}, 'Da ricordare'),
      h('ul', { class: 'dsa-lista' }, chiave.map((x) => h('li', {}, h('strong', {}, x.data ? `${x.data} – ${x.titolo}. ` : `${x.titolo}. `), x.descrizione)))) : null,
    collegati.length ? h('div', { class: 'scheda' }, h('h2', {}, 'Collegamenti'),
      h('ul', {}, collegati.map((x) => h('li', {}, h('a', { href: `#/studio?arg=${x.id}` }, x.titolo))))) : null]);
}

export function smonta() { fermaLettura(); }
