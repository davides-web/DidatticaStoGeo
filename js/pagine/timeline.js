// Pagina "Linee del tempo": esplora, confronta due linee, gioco di riordino.
import { h, sostituisci } from '../dom.js';
import { NOMI_MATERIA } from '../core/contenuti.js';
import { formattaAnno, estremi, assegnaCorsie, posizioneX, tacche, eventiDiSelezione, eventiDiLinea,
  scegliPerGioco, controllaOrdine, nomeLinea, ordinaEventi } from '../core/timeline.js';

const ALTEZZA_CORSIA = 86;
let ctxPagina;
let stato;

export function monta(radice, ctx, param) {
  ctxPagina = ctx;
  const c = ctx.contenuti;
  const conEventi = new Set(c.eventi.map((e) => e.argomento));
  const argArg = param.get('arg');
  stato = {
    modo: 'esplora',
    selezione: argArg && conEventi.has(argArg) ? `arg:${argArg}` : 'classe:1',
    zoom: 1,
    nascoste: new Set(), // linee nascoste
    confronto: { a: 'europa', b: 'islam', classe: 1 },
    gioco: { n: 5, eventi: [], controllato: null },
  };
  const zona = h('div');
  const barra = h('div', { class: 'schede-tab', role: 'tablist' });
  const dialogo = h('dialog', { class: 'dialogo-evento', 'aria-labelledby': 'tl-titolo' });
  dialogo.addEventListener('click', (e) => { if (e.target === dialogo) dialogo.close(); });
  stato.dialogo = dialogo;
  stato.ridisegna = () => disegna(barra, zona);
  radice.append(h('h1', {}, 'Linee del tempo'), barra, zona, dialogo);
  if (c.eventi.length === 0) { zona.append(h('div', { class: 'vuoto' }, 'Non ci sono ancora eventi.')); return; }
  disegna(barra, zona);
}

function disegna(barra, zona) {
  const modi = [['esplora', '⏳ Esplora'], ['confronta', '⚖️ Confronta due linee'], ['gioco', '🎮 Gioco: riordina']];
  sostituisci(barra, modi.map(([k, t]) => h('button', { class: 'btn' + (stato.modo === k ? ' attivo' : ''), role: 'tab', 'aria-selected': String(stato.modo === k),
    onclick: () => { stato.modo = k; stato.ridisegna(); } }, t)));
  sostituisci(zona);
  if (stato.modo === 'esplora') esplora(zona);
  else if (stato.modo === 'confronta') confronta(zona);
  else gioco(zona);
}

/** Menu a tendina per scegliere periodo: una classe intera o un singolo argomento. */
function selettorePeriodo(valore, alCambio) {
  const c = ctxPagina.contenuti;
  const conEventi = new Set(c.eventi.map((e) => e.argomento));
  const opzioni = [];
  for (const classe of [1, 2]) {
    opzioni.push(h('optgroup', { label: `Storia – classe ${classe}ª` },
      h('option', { value: `classe:${classe}` }, `Tutta la classe ${classe}ª`),
      c.argomenti.filter((a) => a.materia === 'storia' && a.classe === classe && conEventi.has(a.id))
        .map((a) => h('option', { value: `arg:${a.id}` }, a.titolo))));
  }
  const civ = c.argomenti.filter((a) => a.materia === 'civica' && conEventi.has(a.id));
  if (civ.length) opzioni.push(h('optgroup', { label: 'Educazione civica' }, civ.map((a) => h('option', { value: `arg:${a.id}` }, a.titolo))));
  const sel = h('select', { 'aria-label': 'Periodo', onchange: (e) => alCambio(e.target.value) }, opzioni);
  sel.value = valore;
  return sel;
}

function controlliZoom() {
  const cambia = (f) => { stato.zoom = Math.min(12, Math.max(1, +(stato.zoom * f).toFixed(2))); stato.ridisegna(); };
  return h('div', { class: 'gruppo-btn', role: 'group', 'aria-label': 'Zoom' },
    h('button', { class: 'btn', onclick: () => cambia(1 / 1.5), 'aria-label': 'Riduci' }, '🔍−'),
    h('span', { class: 'etichetta-zoom' }, `Zoom ×${stato.zoom}`),
    h('button', { class: 'btn', onclick: () => cambia(1.5), 'aria-label': 'Ingrandisci' }, '🔍+'),
    h('button', { class: 'btn', onclick: () => { stato.zoom = 1; stato.ridisegna(); } }, 'Adatta'));
}

function esplora(zona) {
  const c = ctxPagina.contenuti;
  const tutti = eventiDiSelezione(c, stato.selezione);
  const linee = [...new Set(tutti.map((e) => e.linea || 'altro'))];
  const visibili = tutti.filter((e) => !stato.nascoste.has(e.linea || 'altro'));
  zona.append(
    h('div', { class: 'barra' }, h('label', {}, 'Periodo: ', selettorePeriodo(stato.selezione, (v) => { stato.selezione = v; stato.nascoste.clear(); stato.ridisegna(); })), controlliZoom()),
    linee.length > 1 ? h('div', { class: 'barra', role: 'group', 'aria-label': 'Linee da mostrare' },
      linee.map((l) => h('label', { class: `chip-linea linea-${l}` }, h('input', { type: 'checkbox', checked: !stato.nascoste.has(l),
        onchange: (e) => { e.target.checked ? stato.nascoste.delete(l) : stato.nascoste.add(l); stato.ridisegna(); } }), nomeLinea(l)))) : null,
    h('p', { class: 'tenue' }, 'Clicca su un evento per leggere la scheda. Scorri a destra per vedere il resto.'),
    visibili.length ? tracciato([{ eventi: visibili }], estremi(tutti)) : h('div', { class: 'vuoto' }, 'Nessun evento da mostrare.'));
}

function confronta(zona) {
  const c = ctxPagina.contenuti;
  const { a, b, classe } = stato.confronto;
  const linee = [...new Set(c.eventi.map((e) => e.linea).filter(Boolean))];
  const sel = (chiave) => {
    const s = h('select', { 'aria-label': `Linea ${chiave}`, onchange: (e) => { stato.confronto[chiave] = e.target.value; stato.ridisegna(); } },
      linee.map((l) => h('option', { value: l }, nomeLinea(l))));
    s.value = stato.confronto[chiave];
    return s;
  };
  const sc = h('select', { 'aria-label': 'Classe', onchange: (e) => { stato.confronto.classe = Number(e.target.value); stato.ridisegna(); } },
    h('option', { value: 1 }, 'Classe 1ª'), h('option', { value: 2 }, 'Classe 2ª'), h('option', { value: 0 }, 'Entrambe'));
  sc.value = String(classe);
  const evA = eventiDiLinea(c, a, classe);
  const evB = eventiDiLinea(c, b, classe);
  zona.append(
    h('div', { class: 'barra' }, h('label', {}, 'Linea in alto: ', sel('a')), h('label', {}, 'Linea in basso: ', sel('b')), h('label', {}, 'Periodo: ', sc), controlliZoom()),
    h('p', { class: 'tenue' }, 'Le due linee usano lo stesso asse del tempo: scorri per confrontare cosa succedeva nello stesso momento.'),
    evA.length + evB.length ? tracciato([{ eventi: evA, titolo: nomeLinea(a) }, { eventi: evB, titolo: nomeLinea(b) }], estremi([...evA, ...evB])) : h('div', { class: 'vuoto' }, 'Nessun evento per queste linee.'));
}

/** Disegna una o più linee del tempo (piste) sullo stesso asse. */
function tracciato(piste, { min, max }) {
  const contenitore = h('div', { class: 'tl-scroll', tabindex: '0', role: 'region', 'aria-label': 'Linea del tempo, scorrevole' });
  // Più eventi = linea più larga (si scorre in orizzontale); lo zoom la allarga ancora
  const totale = piste.reduce((t, x) => t + x.eventi.length, 0);
  const larghezza = Math.max(window.innerWidth - 60, 900, totale * 90) * stato.zoom;
  const margine = 100;
  const canvas = h('div', { class: 'tl-canvas', style: `width:${larghezza}px` });
  for (const pista of piste) {
    const posizionati = assegnaCorsie(pista.eventi, { min, max, larghezza, margine });
    const corsie = Math.max(1, ...posizionati.map((p) => p.corsia + 1));
    const alto = corsie * ALTEZZA_CORSIA + 12;
    const blocco = h('div', { class: 'tl-pista', style: `height:${alto + 8}px` });
    if (pista.titolo) blocco.append(h('div', { class: 'tl-titolo-pista' }, pista.titolo));
    for (const { evento, x, corsia } of posizionati) {
      const top = alto - (corsia + 1) * ALTEZZA_CORSIA;
      blocco.append(
        h('span', { class: 'tl-filo', style: `left:${x}px; top:${top + ALTEZZA_CORSIA - 14}px; height:${alto - top - ALTEZZA_CORSIA + 14}px` }),
        h('button', { class: `tl-evento linea-${evento.linea || 'altro'}`, style: `left:${x}px; top:${top}px`, onclick: () => apriScheda(evento),
          'aria-label': `${evento.data}: ${evento.titolo}` },
          h('span', { class: 'tl-icona', 'aria-hidden': 'true' }, evento.icona || '📌'),
          h('span', { class: 'tl-data' }, evento.data),
          h('span', { class: 'tl-nome' }, evento.titolo)));
    }
    blocco.append(h('span', { class: 'tl-asse' }));
    canvas.append(blocco);
  }
  // Asse con gli anni (tacche), condiviso da tutte le piste
  const asse = h('div', { class: 'tl-righello' });
  for (const a of tacche(min, max, Math.floor(larghezza / 110))) {
    asse.append(h('span', { class: 'tl-tacca', style: `left:${posizioneX(a, min, max, larghezza, margine)}px` }, formattaAnno(a)));
  }
  canvas.append(asse);
  contenitore.append(canvas);
  return contenitore;
}

function apriScheda(e) {
  const c = ctxPagina.contenuti;
  const arg = c.argomenti.find((a) => a.id === e.argomento);
  sostituisci(stato.dialogo, h('div', { class: 'pannello scheda-evento' },
    h('div', { class: 'icona-grande', 'aria-hidden': 'true' }, e.icona || '📌'),
    h('p', { class: 'data-evento' }, e.data),
    h('h2', { id: 'tl-titolo' }, e.titolo),
    h('p', { class: 'descr-evento' }, e.descrizione),
    h('p', { class: 'tenue' }, arg ? `${NOMI_MATERIA[arg.materia]} · ${arg.titolo}` : ''),
    h('div', { class: 'azioni' },
      arg ? h('a', { class: 'btn', href: `#/studio?arg=${arg.id}`, onclick: () => stato.dialogo.close() }, '📖 Studia l\'argomento') : null,
      h('button', { class: 'btn primario', onclick: () => stato.dialogo.close() }, 'Chiudi'))));
  stato.dialogo.showModal();
}

/* ---------- Gioco: riordina gli eventi ---------- */
function gioco(zona) {
  const c = ctxPagina.contenuti;
  const g = stato.gioco;
  const ricomincia = () => {
    g.eventi = scegliPerGioco(eventiDiSelezione(c, stato.selezione), g.n);
    g.controllato = null;
    stato.ridisegna();
  };
  if (g.eventi.length === 0 || !g.eventi.every((e) => eventiDiSelezione(c, stato.selezione).some((x) => x.id === e.id))) {
    g.eventi = scegliPerGioco(eventiDiSelezione(c, stato.selezione), g.n);
    g.controllato = null;
  }
  const lista = h('ol', { class: 'gioco-lista' });
  const riempi = () => sostituisci(lista, g.eventi.map((e, i) => voceGioco(e, i, lista)));
  riempi();
  const sn = h('select', { 'aria-label': 'Numero di eventi', onchange: (ev) => { g.n = Number(ev.target.value); ricomincia(); } },
    [4, 5, 6, 8, 10].map((n) => h('option', { value: n }, `${n} eventi`)));
  sn.value = String(g.n);
  const esito = h('div', { class: 'esito', 'aria-live': 'polite' });
  zona.append(
    h('div', { class: 'barra' }, h('label', {}, 'Periodo: ', selettorePeriodo(stato.selezione, (v) => { stato.selezione = v; ricomincia(); })), h('label', {}, sn),
      h('button', { class: 'btn', onclick: ricomincia }, '🔀 Nuova partita')),
    h('p', {}, 'Trascina le schede (o usa le frecce) per metterle in ordine: dal più ', h('strong', {}, 'antico'), ' in alto al più ', h('strong', {}, 'recente'), ' in basso.'),
    lista, esito,
    h('div', { class: 'azioni' }, h('button', { class: 'btn primario grande', onclick: () => verifica(lista, esito) }, '✔ Controlla')));
}

function voceGioco(e, i, lista) {
  const li = h('li', { class: 'gioco-voce', dataset: { id: e.id } },
    h('span', { class: 'maniglia', 'aria-hidden': 'true', title: 'Trascina' }, '⠿'),
    h('span', { class: 'gioco-icona', 'aria-hidden': 'true' }, e.icona || '📌'),
    h('span', { class: 'gioco-testo' }, h('strong', {}, e.titolo), h('span', { class: 'tenue' }, e.descrizione)),
    h('span', { class: 'gioco-data' }),
    h('span', { class: 'gioco-frecce' },
      h('button', { class: 'btn', 'aria-label': `Sposta su: ${e.titolo}`, onclick: () => { if (li.previousElementSibling) lista.insertBefore(li, li.previousElementSibling); li.querySelector('.btn').focus(); } }, '▲'),
      h('button', { class: 'btn', 'aria-label': `Sposta giù: ${e.titolo}`, onclick: () => { if (li.nextElementSibling) lista.insertBefore(li.nextElementSibling, li); } }, '▼')));
  trascinabile(li, lista);
  return li;
}

/** Trascinamento con mouse, penna e tocco (Pointer Events): riordina le voci della lista. */
function trascinabile(li, lista) {
  const maniglia = li.querySelector('.maniglia');
  maniglia.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    maniglia.setPointerCapture(ev.pointerId);
    const altezza = li.getBoundingClientRect().height;
    const scostamento = ev.clientY - li.getBoundingClientRect().top;
    li.classList.add('trascinata');
    const muovi = (m) => {
      li.style.transform = '';
      const centro = m.clientY - scostamento + altezza / 2;
      // Ripete finché la posizione è stabile (dopo uno spostamento le altre voci cambiano posto)
      for (let giro = 0; giro < lista.children.length; giro++) {
        const altre = [...lista.children].filter((x) => x !== li);
        const nuovoIndice = altre.filter((x) => { const r = x.getBoundingClientRect(); return r.top + r.height / 2 < centro; }).length;
        if ([...lista.children].indexOf(li) === nuovoIndice) break;
        lista.insertBefore(li, altre[nuovoIndice] || null);
      }
      li.style.transform = `translateY(${m.clientY - scostamento - li.getBoundingClientRect().top}px)`;
    };
    const fine = () => {
      li.classList.remove('trascinata');
      li.style.transform = '';
      maniglia.removeEventListener('pointermove', muovi);
      maniglia.removeEventListener('pointerup', fine);
      maniglia.removeEventListener('pointercancel', fine);
    };
    maniglia.addEventListener('pointermove', muovi);
    maniglia.addEventListener('pointerup', fine);
    maniglia.addEventListener('pointercancel', fine);
  });
}

function verifica(lista, esito) {
  const g = stato.gioco;
  const voci = [...lista.children];
  const ids = voci.map((li) => li.dataset.id);
  const r = controllaOrdine(ids, g.eventi);
  voci.forEach((li, i) => {
    li.classList.toggle('giusta', r.giuste[i]);
    li.classList.toggle('sbagliata', !r.giuste[i]);
    const e = g.eventi.find((x) => x.id === li.dataset.id);
    li.querySelector('.gioco-data').textContent = e.data;
  });
  const ordine = ordinaEventi(g.eventi);
  sostituisci(esito, r.completo
    ? h('div', { class: 'successo' }, `🎉 Bravissimo! Tutti gli ${ids.length} eventi sono al posto giusto.`)
    : h('div', { class: 'avviso' }, `${r.corrette} su ${ids.length} al posto giusto. Gli altri sono in rosso: riprova a spostarli! `,
        h('details', {}, h('summary', {}, 'Mostra l\'ordine corretto'), h('ol', {}, ordine.map((e) => h('li', {}, `${e.data} – ${e.titolo}`))))));
}
