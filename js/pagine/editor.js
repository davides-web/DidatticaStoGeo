// Pagina "Editor": crea e modifica argomenti, domande, eventi, concetti e glossario dall'interfaccia.
// Il lavoro resta SOLO in questo browser (bozza); per pubblicarlo si esporta il file JSON e lo si
// carica nel repository (vedi README). Il modulo è guidato da una descrizione dei campi di ogni tipo di scheda.
import { h, sostituisci, scaricaTesto } from '../dom.js';
import { validaInsieme, MATERIE } from '../core/validazione.js';
import { formattaPacchetto, formattaIndice, pulisciVoce } from '../core/esporta.js';
import { NOMI_MATERIA } from '../core/contenuti.js';
import { NOMI_TIPO } from '../core/quiz.js';
import { nomeLinea } from '../core/timeline.js';

const CHIAVE_BOZZA = 'didattica-bozza-editor';
const clona = (x) => JSON.parse(JSON.stringify(x));
const PREFISSO_ID = { argomenti: '', domande: 'q', eventi: 'e', concetti: 'c', glossario: 'g' };
const NOMI_COLL = { argomenti: 'Argomenti', domande: 'Domande', eventi: 'Eventi', concetti: 'Concetti', glossario: 'Glossario' };

/* ---------- Descrizione dei campi per ogni tipo di scheda ---------- */
// t = tipo di campo: testo | area | numero | scelta | righe | coppie
const ARG = { k: 'argomento', t: 'argomento', et: 'Argomento' };
const ID = { k: 'id', t: 'testo', et: 'Identificatore', aiuto: 'Solo lettere minuscole, numeri e trattini, senza spazi. Deve essere unico.' };

function campi(coll, v) {
  switch (coll) {
    case 'argomenti': return [ID, { k: 'titolo', t: 'testo', et: 'Titolo' }, { k: 'materia', t: 'scelta', et: 'Materia', opz: MATERIE.map((m) => [m, NOMI_MATERIA[m]]) },
      { k: 'classe', t: 'scelta', et: 'Classe', num: true, opz: [[1, 'Prima'], [2, 'Seconda']] }, { k: 'icona', t: 'testo', et: 'Icona (emoji)' },
      { k: 'sintesi', t: 'area', et: 'Sintesi', aiuto: 'Separa i paragrafi con una riga vuota.', righe: 10 },
      { k: 'semplificata', t: 'area', et: 'Versione semplificata', aiuto: 'Frasi corte, una idea per paragrafo.', righe: 8 },
      { k: 'collegamenti', t: 'righe', et: 'Collegamenti (facoltativo)', aiuto: 'Un identificatore di argomento per riga (per Educazione civica).' }];
    case 'domande': {
      const comuni = [ID, ARG, { k: 'tipo', t: 'scelta', et: 'Tipo di domanda', opz: Object.entries(NOMI_TIPO), ricarica: true },
        { k: 'testo', t: 'area', et: 'Testo della domanda', righe: 3, aiuto: v.tipo === 'completa' ? 'Scrivi ___ (tre trattini bassi) al posto della parola da completare.' : '' }];
      const specifici = {
        scelta: [{ k: 'giusta', t: 'testo', et: 'Risposta giusta' }, { k: 'sbagliate', t: 'righe', et: 'Risposte sbagliate', aiuto: 'Una per riga (da 2 a 4). L\'app le mescola ogni volta.' }],
        vf: [{ k: 'corretta', t: 'scelta', et: 'L\'affermazione è', bool: true, opz: [['true', 'Vera'], ['false', 'Falsa']] }],
        completa: [{ k: 'risposta', t: 'testo', et: 'Parola da inserire' }, { k: 'accettate', t: 'righe', et: 'Altre risposte accettate (facoltativo)', aiuto: 'Una per riga.' },
          { k: 'distrattori', t: 'righe', et: 'Parole sbagliate di aiuto (facoltativo)', aiuto: 'Servono alla versione semplificata della verifica.' }],
        abbina: [{ k: 'coppie', t: 'coppie', et: 'Coppie da abbinare', aiuto: 'Una per riga, nel formato  sinistra = destra  (da 3 a 6 coppie, senza ripetizioni).' }],
      }[v.tipo || 'scelta'];
      return [...comuni, ...specifici, { k: 'spiegazione', t: 'area', et: 'Spiegazione (mostrata dopo la risposta)', righe: 3 }];
    }
    case 'eventi': return [ID, ARG, { k: 'titolo', t: 'testo', et: 'Titolo' }, { k: 'anno', t: 'numero', et: 'Anno (per l\'ordine)', aiuto: 'Numero intero; negativo per gli anni a.C. (es. -44).' },
      { k: 'data', t: 'testo', et: 'Data come si legge', aiuto: 'Es. «476 d.C.», «14 luglio 1789», «circa 1000».' }, { k: 'descrizione', t: 'area', et: 'Descrizione breve', righe: 3 },
      { k: 'icona', t: 'testo', et: 'Icona (emoji)' }, { k: 'linea', t: 'testo', et: 'Linea (per il confronto)', aiuto: 'europa, islam, bizantino, italia, mondo… (o una nuova)', lista: 'linee' }];
    case 'concetti': return [ID, ARG, { k: 'titolo', t: 'testo', et: 'Titolo' }, { k: 'descrizione', t: 'area', et: 'Descrizione', righe: 3 }, { k: 'icona', t: 'testo', et: 'Icona (emoji)' }];
    case 'glossario': return [ID, ARG, { k: 'termine', t: 'testo', et: 'Termine' }, { k: 'definizione', t: 'area', et: 'Definizione semplice', righe: 3 },
      { k: 'inglese', t: 'testo', et: 'Traduzione in inglese' }, { k: 'definizione_en', t: 'area', et: 'Definizione in inglese', righe: 3 }, { k: 'esempio', t: 'area', et: 'Esempio d\'uso', righe: 2 }];
    default: return [];
  }
}

/** Dalla voce salvata ai valori mostrati nel modulo (la scelta multipla diventa «giusta» + «sbagliate»). */
function perModulo(coll, v) {
  const r = clona(v);
  if (coll === 'domande' && v.tipo === 'scelta') { r.giusta = v.opzioni[v.corretta]; r.sbagliate = v.opzioni.filter((_, i) => i !== v.corretta); }
  return r;
}
/** Dai valori del modulo alla voce da salvare. */
function daModulo(coll, valori) {
  const r = { ...valori };
  if (coll === 'domande' && r.tipo === 'scelta') { r.opzioni = [r.giusta, ...(r.sbagliate || [])]; r.corretta = 0; delete r.giusta; delete r.sbagliate; }
  if (coll === 'domande') for (const k of ['opzioni', 'corretta', 'risposta', 'accettate', 'distrattori', 'coppie']) { /* i campi di altri tipi non vengono scritti */ if (!campi('domande', r).some((c) => c.k === k) && !(r.tipo === 'scelta' && (k === 'opzioni' || k === 'corretta'))) delete r[k]; }
  return pulisciVoce(r);
}

/* ---------- Pagina ---------- */
export function monta(radice, ctx, param) {
  const c0 = ctx.contenuti;
  let lavoro = c0.pacchetti.map((p) => ({ nome: p.nome, dati: clona(p.dati) }));
  let bozzaAttiva = false;
  try {
    const salvata = JSON.parse(localStorage.getItem(CHIAVE_BOZZA) || 'null');
    if (salvata && Array.isArray(salvata.pacchetti)) { lavoro = salvata.pacchetti; bozzaAttiva = true; }
  } catch { /* nessuna bozza */ }

  const s = { file: lavoro[0]?.nome, coll: 'domande', filtroArg: '', cerca: '', voce: null, indice: -1, errori: [], esito: null, controllo: param.get('controllo') === '1' };
  const zona = h('div');
  radice.append(h('h1', {}, 'Editor dei contenuti'), zona);

  const pacchetto = () => lavoro.find((p) => p.nome === s.file);
  const tuttiArg = () => lavoro.flatMap((p) => p.dati.argomenti || []);
  const salvaBozza = () => { try { localStorage.setItem(CHIAVE_BOZZA, JSON.stringify({ pacchetti: lavoro })); bozzaAttiva = true; } catch { alert('Impossibile salvare la bozza in questo browser: esporta subito il file.'); } };

  function disegna() {
    const p = pacchetto();
    const eleco = (p?.dati[s.coll] || []).map((voce, i) => ({ voce, i }))
      .filter(({ voce }) => (!s.filtroArg || voce.argomento === s.filtroArg || voce.id === s.filtroArg) &&
        (!s.cerca || JSON.stringify(voce).toLowerCase().includes(s.cerca.toLowerCase())));
    const selFile = h('select', { 'aria-label': 'File di contenuto', onchange: (e) => { s.file = e.target.value; s.voce = null; s.filtroArg = ''; disegna(); } },
      lavoro.map((x) => h('option', { value: x.nome }, x.nome)));
    selFile.value = s.file;
    const selArg = h('select', { 'aria-label': 'Filtra per argomento', onchange: (e) => { s.filtroArg = e.target.value; disegna(); } },
      h('option', { value: '' }, 'Tutti gli argomenti'), tuttiArg().map((a) => h('option', { value: a.id }, a.titolo)));
    selArg.value = s.filtroArg;

    sostituisci(zona,
      bozzaAttiva ? h('div', { class: 'avviso' }, '📝 Stai lavorando su una bozza salvata in questo browser. Le modifiche NON sono ancora nel repository: ',
        h('strong', {}, 'esporta i file'), ' quando hai finito. ', h('button', { class: 'btn', onclick: scartaBozza }, 'Scarta la bozza e ricomincia dai file originali')) : null,
      h('div', { class: 'barra' }, h('label', {}, 'File: ', selFile),
        h('button', { class: 'btn', onclick: nuovoPacchetto }, '➕ Nuovo file'),
        h('button', { class: 'btn primario', onclick: esporta }, '⬇ Esporta questo file (JSON)'),
        h('button', { class: 'btn', onclick: esportaIndice }, '⬇ Esporta indice.json'),
        h('label', { class: 'btn' }, '⬆ Carica un file JSON', h('input', { type: 'file', accept: '.json,application/json', class: 'solo-lettori', onchange: carica })),
        h('button', { class: 'btn', onclick: () => { s.controllo = !s.controllo; disegna(); } }, '✔ Controlla i contenuti')),
      s.controllo ? rapporto() : null,
      h('div', { class: 'schede-tab', role: 'tablist' }, Object.entries(NOMI_COLL).map(([k, t]) =>
        h('button', { class: 'btn' + (s.coll === k ? ' attivo' : ''), role: 'tab', 'aria-selected': String(s.coll === k), onclick: () => { s.coll = k; s.voce = null; s.indice = -1; disegna(); } }, `${t} (${(p?.dati[k] || []).length})`))),
      h('div', { class: 'editor-layout' },
        h('div', { class: 'editor-elenco' },
          h('div', { class: 'barra' }, selArg, h('input', { type: 'search', placeholder: 'Cerca…', value: s.cerca, 'aria-label': 'Cerca', oninput: (e) => { s.cerca = e.target.value; aggiornaElenco(); } })),
          h('button', { class: 'btn primario', onclick: () => nuova() }, `➕ Nuov${s.coll === 'domande' || s.coll === 'eventi' ? 'a' : 'o'} ${NOMI_COLL[s.coll].toLowerCase().replace(/i$/, 'o').replace(/e$/, 'a')}`),
          h('ul', { class: 'editor-lista', id: 'editor-lista' }, vociElenco(eleco))),
        h('div', { class: 'editor-form', id: 'editor-form' })));
    disegnaForm();
  }

  const titoloVoce = (coll, v) => ({ argomenti: v.titolo, domande: `${v.tipo === 'vf' ? '✔✘' : v.tipo === 'completa' ? '…' : v.tipo === 'abbina' ? '⇄' : '◉'} ${v.testo}`, eventi: `${v.data} – ${v.titolo}`, concetti: v.titolo, glossario: v.termine }[coll] || v.id);
  function vociElenco(elenco) {
    if (!elenco.length) return [h('li', { class: 'tenue' }, 'Nessuna voce.')];
    return elenco.map(({ voce, i }) => h('li', {}, h('button', { class: 'editor-voce' + (s.indice === i ? ' attiva' : ''), onclick: () => { s.indice = i; s.voce = perModulo(s.coll, voce); s.errori = []; s.esito = null; disegna(); } },
      h('span', { class: 'ev-titolo' }, titoloVoce(s.coll, voce)), h('span', { class: 'tenue piccolo' }, voce.id))));
  }
  function aggiornaElenco() {
    const p = pacchetto();
    const elenco = (p?.dati[s.coll] || []).map((voce, i) => ({ voce, i })).filter(({ voce }) => (!s.filtroArg || voce.argomento === s.filtroArg || voce.id === s.filtroArg) && (!s.cerca || JSON.stringify(voce).toLowerCase().includes(s.cerca.toLowerCase())));
    sostituisci(document.getElementById('editor-lista'), vociElenco(elenco));
  }

  /* ----- Modulo di una voce ----- */
  function nuova(base = {}) {
    const p = pacchetto();
    const arg = s.filtroArg || p.dati.argomenti?.[0]?.id || tuttiArg()[0]?.id || '';
    const v = { argomento: arg, ...base };
    if (s.coll === 'domande') v.tipo = v.tipo || 'scelta';
    if (s.coll === 'argomenti') { v.materia = 'storia'; v.classe = 1; } else v.id = idLibero(v.argomento || arg);
    s.voce = v; s.indice = -1; s.errori = []; s.esito = null;
    disegna();
  }
  function idLibero(arg) {
    const usati = new Set(lavoro.flatMap((p) => (p.dati[s.coll] || []).map((x) => x.id)));
    for (let n = 1; ; n++) { const id = `${arg}-${PREFISSO_ID[s.coll]}${n}`; if (!usati.has(id)) return id; }
  }

  let leggiCampi = () => ({});
  function disegnaForm() {
    const dove = document.getElementById('editor-form');
    if (!dove) return;
    if (!s.voce) { sostituisci(dove, h('p', { class: 'tenue' }, 'Scegli una voce dall\'elenco oppure creane una nuova.')); return; }
    const elenchiCampi = campi(s.coll, s.voce);
    const letture = [];
    const righe = elenchiCampi.map((f) => {
      const val = s.voce[f.k];
      const idc = `campo-${f.k}`;
      let el;
      if (f.t === 'testo' || f.t === 'numero') {
        el = h('input', { type: f.t === 'numero' ? 'number' : 'text', id: idc, value: val ?? '', list: f.lista ? `lista-${f.lista}` : null });
        letture.push([f.k, () => (f.t === 'numero' ? (el.value === '' ? undefined : Number(el.value)) : el.value.trim())]);
      } else if (f.t === 'area' || f.t === 'righe' || f.t === 'coppie') {
        const testo = f.t === 'righe' ? (val || []).join('\n') : f.t === 'coppie' ? (val || []).map((c) => `${c[0]} = ${c[1]}`).join('\n') : (val ?? '');
        el = h('textarea', { id: idc, rows: f.righe || (f.t === 'area' ? 4 : 4) }, testo);
        letture.push([f.k, () => {
          const t = el.value.replace(/\r/g, '');
          if (f.t === 'area') return t.trim();
          const linee = t.split('\n').map((x) => x.trim()).filter(Boolean);
          return f.t === 'righe' ? linee : linee.map((l) => { const i = l.indexOf('='); return i < 0 ? [l, ''] : [l.slice(0, i).trim(), l.slice(i + 1).trim()]; });
        }]);
      } else if (f.t === 'scelta' || f.t === 'argomento') {
        const opz = f.t === 'argomento' ? tuttiArg().map((a) => [a.id, `${a.titolo} (${NOMI_MATERIA[a.materia]} ${a.classe}ª)`]) : f.opz;
        el = h('select', { id: idc }, opz.map(([k, t]) => h('option', { value: k }, t)));
        el.value = String(val ?? opz[0][0]);
        if (f.ricarica) el.addEventListener('change', () => { s.voce = { ...leggiTutto(), tipo: el.value }; disegnaForm(); });
        letture.push([f.k, () => (f.bool ? el.value === 'true' : f.num ? Number(el.value) : el.value)]);
      }
      return h('div', { class: 'campo' }, h('label', { for: idc }, f.et), el, f.aiuto ? h('small', { class: 'tenue' }, f.aiuto) : null);
    });
    const leggiTutto = () => Object.fromEntries(letture.map(([k, fn]) => [k, fn()]));
    leggiCampi = leggiTutto;
    const linee = [...new Set(lavoro.flatMap((p) => (p.dati.eventi || []).map((e) => e.linea).filter(Boolean)))];
    sostituisci(dove,
      h('h2', {}, s.indice >= 0 ? 'Modifica' : 'Nuova voce'),
      h('datalist', { id: 'lista-linee' }, linee.map((l) => h('option', { value: l }, nomeLinea(l)))),
      ...righe,
      s.errori.length ? h('div', { class: 'errore' }, h('strong', {}, 'Da correggere:'), h('ul', {}, s.errori.map((e) => h('li', {}, e)))) : null,
      s.esito ? h('div', { class: 'successo' }, s.esito) : null,
      h('div', { class: 'azioni' },
        h('button', { class: 'btn primario grande', onclick: salvaVoce }, '💾 Salva la voce'),
        s.indice >= 0 ? h('button', { class: 'btn', onclick: () => nuova(perModulo(s.coll, { ...daModulo(s.coll, leggiTutto()), id: undefined })) }, '⎘ Duplica') : null,
        s.indice >= 0 ? h('button', { class: 'btn no', onclick: elimina }, '🗑 Elimina') : null,
        h('button', { class: 'btn', onclick: () => { s.voce = null; s.indice = -1; disegna(); } }, 'Chiudi')));
  }

  function salvaVoce() {
    const nuovaVoce = daModulo(s.coll, leggiCampi());
    const p = pacchetto();
    const prova = lavoro.map((x) => x === p ? { nome: x.nome, dati: { ...x.dati, [s.coll]: provaElenco(x.dati[s.coll] || [], nuovaVoce) } } : x);
    const { errori } = validaInsieme(prova);
    const mie = errori.filter((e) => e.includes(`(${nuovaVoce.id})`) || e.includes(`"${nuovaVoce.id}"`));
    if (!nuovaVoce.id || !/^[a-z0-9-]+$/.test(nuovaVoce.id)) mie.unshift('L\'identificatore deve contenere solo lettere minuscole, numeri e trattini.');
    if (mie.length) { s.errori = mie; s.esito = null; s.voce = { ...s.voce, ...perModulo(s.coll, nuovaVoce) }; disegnaForm(); return; }
    p.dati[s.coll] = provaElenco(p.dati[s.coll] || [], nuovaVoce);
    s.indice = p.dati[s.coll].findIndex((x) => x.id === nuovaVoce.id);
    s.voce = perModulo(s.coll, nuovaVoce);
    s.errori = []; s.esito = '✔ Voce salvata nella bozza. Ricordati di esportare il file.';
    salvaBozza();
    disegna();
  }
  const provaElenco = (elenco, voce) => (s.indice >= 0 ? elenco.map((x, i) => (i === s.indice ? voce : x)) : [...elenco, voce]);

  function elimina() {
    if (!confirm('Eliminare questa voce?')) return;
    pacchetto().dati[s.coll].splice(s.indice, 1);
    s.voce = null; s.indice = -1; salvaBozza(); disegna();
  }

  /* ----- File, esportazione, controllo ----- */
  function esporta() { scaricaTesto(s.file, formattaPacchetto(pacchetto().dati)); }
  function esportaIndice() { scaricaTesto('indice.json', formattaIndice(c0.indice, lavoro.map((p) => p.nome))); }
  function nuovoPacchetto() {
    const nome = (prompt('Nome del nuovo file (es. storia-3.json)') || '').trim();
    if (!nome) return;
    const finale = /\.json$/.test(nome) ? nome : nome + '.json';
    if (!/^[a-z0-9-]+\.json$/.test(finale)) return alert('Usa solo lettere minuscole, numeri e trattini.');
    if (lavoro.some((p) => p.nome === finale)) return alert('Esiste già un file con questo nome.');
    lavoro.push({ nome: finale, dati: { argomenti: [], domande: [], eventi: [], concetti: [], glossario: [] } });
    s.file = finale; s.voce = null; salvaBozza(); disegna();
  }
  async function carica(e) {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const dati = JSON.parse(await f.text());
      const nome = f.name;
      const i = lavoro.findIndex((p) => p.nome === nome);
      if (i >= 0) { if (!confirm(`Sostituire il contenuto di ${nome} con il file caricato?`)) return; lavoro[i].dati = dati; } else lavoro.push({ nome, dati });
      s.file = nome; s.voce = null; salvaBozza(); disegna();
    } catch (err) { alert(`File non valido: ${err.message}`); }
  }
  function scartaBozza() {
    if (!confirm('Scartare la bozza? Le modifiche non esportate andranno perse.')) return;
    try { localStorage.removeItem(CHIAVE_BOZZA); } catch { /* niente */ }
    lavoro = c0.pacchetti.map((p) => ({ nome: p.nome, dati: clona(p.dati) })); bozzaAttiva = false; s.voce = null; s.file = lavoro[0]?.nome; disegna();
  }
  function rapporto() {
    const { errori, avvisi } = validaInsieme(lavoro);
    return h('div', { class: 'scheda' }, h('h2', {}, 'Controllo dei contenuti'),
      errori.length ? h('div', { class: 'errore' }, h('strong', {}, `${errori.length} errori`), h('ul', {}, errori.map((x) => h('li', {}, x)))) : h('div', { class: 'successo' }, '✔ Nessun errore: i file sono validi.'),
      avvisi.length ? h('details', {}, h('summary', {}, `${avvisi.length} suggerimenti`), h('ul', {}, avvisi.map((x) => h('li', {}, x)))) : null);
  }

  disegna();
}
