// Pagina "Carte mute": le carte sono disegni SVG; si può esplorarle (clic = nome) o fare il quiz.
import { h, svg, sostituisci } from '../dom.js';
import { scegliBersagli, testoDomanda, valutaQuiz, livelliQuiz } from '../core/mappe.js';

const cache = new Map();
let stato;

async function caricaMappa(file) {
  if (!cache.has(file)) {
    const r = await fetch(`mappe/${file}`);
    if (!r.ok) throw new Error(`Carta non trovata: ${file}`);
    cache.set(file, await r.json());
  }
  return cache.get(file);
}

export async function monta(radice, ctx, param) {
  const file = param.get('carta') || stato?.file || 'italia.json';
  const elenco = ctx.contenuti.indice.mappe || [];
  const titoli = await Promise.all(elenco.map(async (f) => [f, (await caricaMappa(f)).titolo]));
  stato = { file, titoli, modo: 'esplora', nomi: false, livelliVisibili: null, selezionato: null, quiz: null };
  stato.radice = radice;
  stato.zona = h('div');
  radice.append(h('h1', {}, 'Carte mute'), stato.zona);
  await apriMappa(file);
}

async function apriMappa(file) {
  stato.file = file;
  stato.mappa = await caricaMappa(file);
  stato.livelliVisibili = new Set(stato.mappa.livelli.map((l) => l.id));
  stato.selezionato = null;
  stato.quiz = null;
  stato.vb = [...(stato.mappa.vistaIniziale || stato.mappa.viewBox)];
  disegnaPagina();
}

function disegnaPagina() {
  const m = stato.mappa;
  const sel = h('select', { 'aria-label': 'Scegli la carta', onchange: (e) => apriMappa(e.target.value) },
    stato.titoli.map(([f, t]) => h('option', { value: f }, t)));
  sel.value = stato.file;
  const modi = h('div', { class: 'gruppo-btn', role: 'tablist' },
    ['esplora', 'quiz'].map((k) => h('button', { class: 'btn' + (stato.modo === k ? ' attivo' : ''), role: 'tab', 'aria-selected': String(stato.modo === k),
      onclick: () => { stato.modo = k; stato.selezionato = null; stato.quiz = null; disegnaPagina(); } }, k === 'esplora' ? '🔎 Esplora' : '🎯 Quiz')));
  stato.pannello = h('div', { class: 'mappa-pannello', 'aria-live': 'polite' });
  stato.svgEl = creaSvg();
  stato.vistaZoom = h('div', { class: 'gruppo-btn zoom-mappa', role: 'group', 'aria-label': 'Zoom della carta' },
    h('button', { class: 'btn', onclick: () => zoomMappa(1 / 1.5), 'aria-label': 'Ingrandisci' }, '🔍+'),
    h('button', { class: 'btn', onclick: () => zoomMappa(1.5), 'aria-label': 'Riduci' }, '🔍−'),
    h('button', { class: 'btn', onclick: () => { stato.vb = [...(m.vistaIniziale || m.viewBox)]; applicaVB(); }, 'aria-label': 'Torna alla vista iniziale' }, '⛶'));
  sostituisci(stato.zona,
    h('div', { class: 'barra' }, h('label', {}, 'Carta: ', sel), modi),
    h('div', { class: 'mappa-layout' },
      h('div', { class: 'mappa-contenitore' }, stato.svgEl, stato.vistaZoom),
      stato.pannello));
  disegnaPannello();
  applicaVB();
}

/* ---------- Disegno della carta ---------- */
function creaSvg() {
  const m = stato.mappa;
  const interattivo = (l) => stato.modo === 'esplora' || (stato.quiz && stato.quiz.livello.id === l.id && !stato.quiz.finito);
  const radiceSvg = svg('svg', { class: 'mappa-svg', viewBox: m.viewBox.join(' '), role: 'img', 'aria-label': m.titolo, preserveAspectRatio: 'xMidYMid meet' });
  const defs = svg('defs');
  const terra = m.sfondo.filter((s) => s.terra);
  if (terra.length) defs.append(svg('clipPath', { id: 'ritaglio-terra' }, terra.map((s) => svg('path', { d: s.d }))));
  radiceSvg.append(defs, svg('rect', { class: 'mappa-mare', x: -2000, y: -2000, width: 6000, height: 6000 }));
  for (const s of m.sfondo) radiceSvg.append(svg('path', { class: s.terra ? 'mappa-terra' : 'mappa-sfondo', d: s.d }));

  for (const l of m.livelli) {
    if (!stato.livelliVisibili.has(l.id)) continue;
    const gruppo = svg('g', { class: `livello livello-${l.tipo}${interattivo(l) ? ' attivo' : ''}` });
    for (const e of l.elementi) {
      const classi = `el${e.colore ? ' colore-' + e.colore : ''}`;
      let figura;
      if (l.tipo === 'aree') figura = svg('path', { class: 'forma', d: e.d, 'clip-path': e.clip ? 'url(#ritaglio-terra)' : null });
      else if (l.tipo === 'linee') figura = svg('g', {}, svg('path', { class: `forma colore-${e.colore || 'f'}`, d: e.d }), svg('path', { class: 'bersaglio-linea', d: e.d }));
      else figura = svg('g', {}, svg('circle', { class: `forma ${e.simbolo === 'monte' ? 'simbolo-monte' : ''}`, cx: e.x, cy: e.y, r: e.simbolo === 'monte' ? 7 : 6 }), svg('circle', { class: 'bersaglio-punto', cx: e.x, cy: e.y, r: 18 }));
      const g = svg('g', { class: classi, dataset: undefined, 'data-liv': l.id, 'data-id': e.id, tabindex: interattivo(l) ? '0' : null, role: interattivo(l) ? 'button' : null,
        'aria-label': interattivo(l) && stato.modo === 'esplora' ? e.nome : (interattivo(l) ? 'Elemento della carta' : null) }, figura);
      if (interattivo(l)) {
        g.addEventListener('click', () => clicElemento(l, e));
        g.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); clicElemento(l, e); } });
      }
      gruppo.append(g);
    }
    radiceSvg.append(gruppo);
  }
  const etichette = svg('g', { class: 'etichette' });
  radiceSvg.append(etichette);
  stato.etichette = etichette;
  abilitaTrascinamento(radiceSvg);
  setTimeout(disegnaEtichette, 0);
  return radiceSvg;
}

/** Scrive i nomi sulla carta (solo in modalità esplora). */
function disegnaEtichette() {
  const et = stato.etichette;
  if (!et || !et.isConnected) return;
  et.replaceChildren();
  if (stato.modo !== 'esplora') return;
  for (const l of stato.mappa.livelli) {
    if (!stato.livelliVisibili.has(l.id)) continue;
    for (const e of l.elementi) {
      const mostra = stato.nomi || (stato.selezionato && stato.selezionato.id === e.id && stato.selezionato.liv === l.id);
      if (!mostra) continue;
      const g = stato.svgEl.querySelector(`[data-liv="${l.id}"][data-id="${e.id}"]`);
      if (!g) continue;
      let x, y;
      if (l.tipo === 'punti') { x = e.x; y = e.y - 12; } else if (e.label) [x, y] = e.label; else { const b = g.getBBox(); x = b.x + b.width / 2; y = b.y + b.height / 2; }
      et.append(svg('text', { class: 'etichetta' + (l.tipo === 'aree' ? ' etichetta-area' : ''), x, y, 'text-anchor': 'middle' }, e.nome));
    }
  }
}

/* ---------- Zoom e spostamento ---------- */
function applicaVB() { stato.svgEl.setAttribute('viewBox', stato.vb.map((n) => Math.round(n * 10) / 10).join(' ')); }
function zoomMappa(f) {
  const [x, y, w, hh] = stato.vb;
  const [, , W, H] = stato.mappa.viewBox;
  const nw = Math.min(W, Math.max(W / 8, w * f)), nh = nw * (hh / w);
  stato.vb = [x + (w - nw) / 2, y + (hh - nh) / 2, nw, nh];
  applicaVB();
}
function abilitaTrascinamento(el) {
  let inizio = null;
  el.addEventListener('pointerdown', (e) => { inizio = { x: e.clientX, y: e.clientY, vb: [...stato.vb], spostato: false, id: e.pointerId }; });
  el.addEventListener('pointermove', (e) => {
    if (!inizio) return;
    const dx = e.clientX - inizio.x, dy = e.clientY - inizio.y;
    if (!inizio.spostato && Math.hypot(dx, dy) < 6) return;
    if (!inizio.spostato) { inizio.spostato = true; el.setPointerCapture(inizio.id); }
    const r = el.getBoundingClientRect();
    const k = Math.max(inizio.vb[2] / r.width, inizio.vb[3] / r.height);
    stato.vb = [inizio.vb[0] - dx * k, inizio.vb[1] - dy * k, inizio.vb[2], inizio.vb[3]];
    applicaVB();
  });
  const fine = () => { if (inizio?.spostato) { stato.appenaTrascinato = true; setTimeout(() => { stato.appenaTrascinato = false; }, 50); } inizio = null; };
  el.addEventListener('pointerup', fine);
  el.addEventListener('pointercancel', fine);
  el.addEventListener('wheel', (e) => { e.preventDefault(); zoomMappa(e.deltaY < 0 ? 1 / 1.2 : 1.2); }, { passive: false });
}

/* ---------- Esplora e quiz ---------- */
function clicElemento(livello, elemento) {
  if (stato.appenaTrascinato) return;
  if (stato.modo === 'esplora') {
    stato.selezionato = { liv: livello.id, id: elemento.id, elemento, livello };
    evidenzia(livello.id, elemento.id, 'selezionato');
    disegnaEtichette();
    disegnaPannello();
  } else if (stato.quiz && !stato.quiz.finito && !stato.quiz.risposto) rispondi(livello, elemento);
}

function evidenzia(liv, id, classe) {
  stato.svgEl.querySelectorAll('.' + classe).forEach((n) => n.classList.remove(classe));
  stato.svgEl.querySelector(`[data-liv="${liv}"][data-id="${id}"]`)?.classList.add(classe);
}

function disegnaPannello() {
  const p = stato.pannello;
  const m = stato.mappa;
  if (stato.modo === 'esplora') {
    const s = stato.selezionato;
    sostituisci(p,
      h('h2', {}, m.titolo), h('p', { class: 'tenue' }, m.descrizione || ''),
      h('fieldset', {}, h('legend', {}, 'Cosa mostrare'),
        m.livelli.map((l) => h('label', { class: 'riga-check' }, h('input', { type: 'checkbox', checked: stato.livelliVisibili.has(l.id),
          onchange: (e) => { e.target.checked ? stato.livelliVisibili.add(l.id) : stato.livelliVisibili.delete(l.id); rinfresca(); } }), l.nome)),
        h('label', { class: 'riga-check' }, h('input', { type: 'checkbox', checked: stato.nomi, onchange: (e) => { stato.nomi = e.target.checked; disegnaEtichette(); } }), 'Mostra tutti i nomi')),
      s ? h('div', { class: 'scheda scheda-nome' }, h('strong', { class: 'nome-grande' }, s.elemento.nome), s.elemento.info ? h('p', {}, s.elemento.info) : null,
            s.livello.nome ? h('p', { class: 'tenue' }, s.livello.nome) : null,
            m.argomento ? h('a', { class: 'btn', href: `#/studio?arg=${m.argomento}` }, '📖 Studia l\'argomento') : null)
        : h('p', { class: 'tenue' }, 'Clicca su un elemento della carta per vedere il suo nome. Trascina per spostarti, usa 🔍 per ingrandire.'));
  } else quizPannello(p);
}

function rinfresca() {
  const nuovo = creaSvg();
  stato.svgEl.replaceWith(nuovo);
  stato.svgEl = nuovo;
  applicaVB();
  if (stato.selezionato) evidenzia(stato.selezionato.liv, stato.selezionato.id, 'selezionato');
}

function quizPannello(p) {
  const m = stato.mappa;
  const q = stato.quiz;
  const livelli = livelliQuiz(m);
  if (!q) {
    let livello = livelli[0];
    let n = 10;
    const sl = h('select', { 'aria-label': 'Che cosa cercare', onchange: (e) => { livello = livelli.find((l) => l.id === e.target.value); } }, livelli.map((l) => h('option', { value: l.id }, l.nome)));
    const sn = h('select', { 'aria-label': 'Numero di domande', onchange: (e) => { n = Number(e.target.value); } }, [5, 10, 15, 20].map((x) => h('option', { value: x, selected: x === 10 }, `${x} domande`)));
    sostituisci(p, h('h2', {}, 'Quiz sulla carta'), h('p', {}, 'Ti dico un nome, tu lo trovi sulla carta.'),
      h('label', { class: 'riga-check' }, 'Che cosa cercare: ', sl), h('label', { class: 'riga-check' }, 'Quante: ', sn),
      h('button', { class: 'btn primario grande', onclick: () => iniziaQuiz(livello, n) }, '▶ Comincia'));
    return;
  }
  if (q.finito) {
    const r = valutaQuiz(q.risposte);
    sostituisci(p, h('h2', {}, 'Risultato'), h('p', { class: 'punteggio-grande' }, `${r.corrette} su ${r.totale}`), h('p', {}, `${r.percentuale}% di risposte esatte`),
      r.corrette < r.totale ? h('details', { open: true }, h('summary', {}, 'Da ripassare'),
        h('ul', {}, q.risposte.filter((x) => x.scelto !== x.bersaglio.id).map((x) => h('li', {}, x.bersaglio.nome)))) : h('div', { class: 'successo' }, '🎉 Perfetto!'),
      h('div', { class: 'azioni' }, h('button', { class: 'btn primario', onclick: () => iniziaQuiz(q.livello, q.bersagli.length) }, '🔁 Rifai'), h('button', { class: 'btn', onclick: () => { stato.quiz = null; rinfresca(); disegnaPannello(); } }, 'Cambia quiz')));
    return;
  }
  const b = q.bersagli[q.indice];
  sostituisci(p, h('p', { class: 'tenue' }, `Domanda ${q.indice + 1} di ${q.bersagli.length} · punti: ${q.risposte.filter((x) => x.scelto === x.bersaglio.id).length}`),
    h('p', { class: 'domanda-mappa' }, testoDomanda(b)),
    q.risposto ? h('div', { class: q.risposto.giusta ? 'successo' : 'errore' },
        q.risposto.giusta ? '✔ Esatto!' : `✘ Hai cliccato: ${q.risposto.nome}. La risposta giusta è evidenziata.`, b.info ? h('p', {}, b.info) : null) : h('p', { class: 'tenue' }, 'Clicca sulla carta.'),
    q.risposto ? h('button', { class: 'btn primario grande', onclick: avanti }, q.indice + 1 === q.bersagli.length ? 'Vedi il risultato' : 'Avanti →') : null,
    h('div', { class: 'azioni' }, h('button', { class: 'btn', onclick: () => { stato.quiz = null; rinfresca(); disegnaPannello(); } }, 'Esci dal quiz')));
}

function iniziaQuiz(livello, n) {
  stato.quiz = { livello, bersagli: scegliBersagli(livello, n), indice: 0, risposte: [], risposto: null, finito: false };
  stato.livelliVisibili = new Set(stato.mappa.livelli.map((l) => l.id));
  rinfresca();
  disegnaPannello();
}

function rispondi(livello, elemento) {
  const q = stato.quiz;
  const b = q.bersagli[q.indice];
  const giusta = elemento.id === b.id;
  q.risposte.push({ bersaglio: b, scelto: elemento.id });
  q.risposto = { giusta, nome: elemento.nome };
  evidenzia(livello.id, b.id, 'giusta');
  if (!giusta) evidenzia(livello.id, elemento.id, 'sbagliata');
  stato.svgEl.querySelectorAll('.sbagliata, .giusta').forEach((n) => n.classList.add('rivelata'));
  disegnaPannello();
}

function avanti() {
  const q = stato.quiz;
  q.risposto = null;
  if (q.indice + 1 >= q.bersagli.length) q.finito = true; else q.indice++;
  rinfresca();
  disegnaPannello();
}
