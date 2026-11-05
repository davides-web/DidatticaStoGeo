// Quiz a squadre per la LIM: domanda a tutto schermo, punteggio, timer opzionale.
import { h, sostituisci } from '../dom.js';
import { controllaRisposta, soluzioneTesto, conVuoto, NOMI_TIPO } from '../core/quiz.js';
import { nuovaPartita, assegna, avanza, classifica, vincitori, puntiRisposta } from '../core/squadre.js';
import { lettera } from '../core/utils.js';

const COLORI = ['#dc2626', '#2563eb', '#16a34a', '#d97706'];

export function avvia(radice, { domande, nomi, timer, esci }) {
  let partita = nuovaPartita(nomi, domande.length, { timer });
  let fase = 'domanda';        // 'domanda' → 'risposta' (dopo la correzione)
  let rispondente = partita.turno;
  let esito = null;            // {giusta, punti, scelta, scaduto}
  let rivelata = false;        // per completamenti e abbinamenti: soluzione mostrata
  let tempo = timer;
  let intervallo = null;

  const schermo = h('div', { class: 'lim', role: 'dialog', 'aria-label': 'Quiz a squadre' });
  document.body.append(schermo);
  document.body.classList.add('lim-aperto');

  const ferma = () => { clearInterval(intervallo); intervallo = null; };
  function avviaTimer() {
    ferma();
    tempo = timer;
    if (!timer) return;
    intervallo = setInterval(() => {
      tempo = Math.max(0, +(tempo - 0.25).toFixed(2));
      aggiornaTimer();
      if (tempo <= 0) {
        ferma();
        const d = domande[partita.indice];
        if (fase === 'domanda' && (d.tipo === 'scelta' || d.tipo === 'vf')) correggi(false, null, true);
      }
    }, 250);
  }
  function aggiornaTimer() {
    const el = schermo.querySelector('.lim-timer');
    if (!el) return;
    el.querySelector('.lim-timer-numero').textContent = Math.ceil(tempo);
    el.querySelector('.lim-timer-barra span').style.width = `${(tempo / timer) * 100}%`;
    el.classList.toggle('urgente', tempo <= 5);
  }

  /** Registra l'esito della domanda per la squadra che risponde. */
  function correggi(giusta, scelta, scaduto = false) {
    if (fase !== 'domanda') return;
    ferma();
    const punti = puntiRisposta(giusta, tempo, timer);
    partita = assegna(partita, rispondente, giusta, tempo);
    esito = { giusta, punti, scelta, scaduto };
    fase = 'risposta';
    disegna();
  }

  function prossima() {
    partita = avanza(partita);
    fase = 'domanda'; esito = null; rivelata = false;
    rispondente = partita.turno;
    if (!partita.concluso) avviaTimer();
    disegna();
  }

  const tasto = (e) => {
    if (e.target.matches('input, select, textarea')) return;
    const d = domande[partita.indice];
    if (partita.concluso) return;
    if (fase === 'risposta' && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight')) { e.preventDefault(); prossima(); return; }
    if (fase === 'domanda' && d.tipo === 'scelta') {
      const i = '1234abcd'.indexOf(e.key.toLowerCase());
      if (i >= 0 && i % 4 < d.opzioni.length) correggi(controllaRisposta(d, i % 4), i % 4);
    }
    if (fase === 'domanda' && d.tipo === 'vf') {
      if (e.key.toLowerCase() === 'v') correggi(controllaRisposta(d, true), true);
      if (e.key.toLowerCase() === 'f') correggi(controllaRisposta(d, false), false);
    }
  };
  document.addEventListener('keydown', tasto);

  const chiudi = () => { ferma(); document.removeEventListener('keydown', tasto); schermo.remove(); document.body.classList.remove('lim-aperto'); if (document.fullscreenElement) document.exitFullscreen?.(); };
  const esciConferma = () => { if (partita.concluso || confirm('Vuoi uscire dal quiz? Il punteggio andrà perso.')) { chiudi(); esci(); } };

  function barraSquadre() {
    return h('div', { class: 'lim-squadre', role: 'group', 'aria-label': 'Punteggi' }, partita.squadre.map((s, i) =>
      h('button', { class: 'lim-squadra' + (i === rispondente && !partita.concluso ? ' corrente' : ''), style: `--colore:${COLORI[i]}`,
        'aria-pressed': String(i === rispondente), disabled: fase !== 'domanda' || partita.concluso,
        title: 'Tocca per far rispondere questa squadra', onclick: () => { rispondente = i; disegna(); } },
        h('span', { class: 'lim-nome' }, s.nome), h('span', { class: 'lim-punti' }, s.punti))));
  }

  function corpo(d) {
    const giaCorretta = fase === 'risposta';
    if (d.tipo === 'scelta') {
      return h('div', { class: 'lim-opzioni' }, d.opzioni.map((o, i) => h('button', {
        class: 'lim-opzione' + (giaCorretta ? (i === d.corretta ? ' giusta' : (esito.scelta === i ? ' sbagliata' : ' spenta')) : ''), disabled: giaCorretta,
        onclick: () => correggi(controllaRisposta(d, i), i) }, h('span', { class: 'lim-lettera' }, lettera(i)), o)));
    }
    if (d.tipo === 'vf') {
      return h('div', { class: 'lim-opzioni vf' }, [true, false].map((v) => h('button', {
        class: 'lim-opzione' + (giaCorretta ? (v === d.corretta ? ' giusta' : (esito.scelta === v ? ' sbagliata' : ' spenta')) : ''), disabled: giaCorretta,
        onclick: () => correggi(controllaRisposta(d, v), v) }, v ? '✔ VERO' : '✘ FALSO')));
    }
    // completa / abbina: la squadra risponde a voce, il docente giudica
    const soluzione = h('div', { class: 'lim-soluzione' }, h('strong', {}, 'Soluzione: '), soluzioneTesto(d));
    return h('div', {},
      d.tipo === 'abbina' ? h('div', { class: 'lim-abbina' }, h('ol', { class: 'lim-lista' }, d.sinistra.map((s) => h('li', {}, s))),
        h('ul', { class: 'lim-lista lettere' }, d.destra.map((x, i) => h('li', { 'data-l': lettera(i) }, x)))) : null,
      !giaCorretta && !rivelata ? h('button', { class: 'btn grande', onclick: () => { rivelata = true; disegna(); } }, '👁 Mostra la soluzione') : null,
      (rivelata || giaCorretta) ? soluzione : null,
      rivelata && !giaCorretta ? h('div', { class: 'azioni' },
        h('button', { class: 'btn ok grande', onclick: () => correggi(true, null) }, '✔ Risposta giusta'),
        h('button', { class: 'btn no grande', onclick: () => correggi(false, null) }, '✘ Risposta sbagliata')) : null);
  }

  function disegna() {
    if (partita.concluso) return schermataFinale();
    const d = domande[partita.indice];
    const sq = partita.squadre[rispondente];
    sostituisci(schermo,
      h('div', { class: 'lim-testata' }, barraSquadre(),
        h('div', { class: 'lim-strumenti' },
          timer ? h('div', { class: 'lim-timer' }, h('span', { class: 'lim-timer-numero' }, Math.ceil(tempo)), h('span', { class: 'lim-timer-barra' }, h('span', { style: `width:${(tempo / timer) * 100}%` }))) : null,
          h('button', { class: 'btn', onclick: () => { document.fullscreenElement ? document.exitFullscreen() : schermo.requestFullscreen?.(); }, 'aria-label': 'Schermo intero' }, '⛶'),
          h('button', { class: 'btn', onclick: esciConferma, 'aria-label': 'Esci dal quiz' }, '✕'))),
      h('div', { class: 'lim-centro' },
        h('p', { class: 'lim-info' }, `Domanda ${partita.indice + 1} di ${partita.totale} · ${NOMI_TIPO[d.tipo]} · risponde: `, h('strong', { style: `color:${COLORI[rispondente]}` }, sq.nome)),
        h('p', { class: 'lim-domanda' }, d.tipo === 'completa' ? conVuoto(d.testo) : d.testo),
        corpo(d),
        fase === 'risposta' ? h('div', { class: 'lim-esito ' + (esito.giusta ? 'successo' : 'errore'), 'aria-live': 'polite' },
          h('strong', {}, esito.giusta ? `✔ Giusto! ${sq.nome} guadagna ${esito.punti} punti.` : esito.scaduto ? '⏰ Tempo scaduto!' : '✘ Risposta sbagliata.'), ' ', d.spiegazione) : null,
        fase === 'risposta' ? h('button', { class: 'btn primario grande', onclick: prossima }, partita.indice + 1 >= partita.totale ? 'Vedi la classifica 🏆' : 'Avanti →') : null));
  }

  function schermataFinale() {
    const cl = classifica(partita);
    const vinc = vincitori(partita);
    sostituisci(schermo, h('div', { class: 'lim-centro lim-finale' },
      h('h2', {}, vinc.length > 1 ? '🤝 Pareggio!' : '🏆 Ha vinto…'),
      h('p', { class: 'lim-vincitore' }, vinc.map((v) => v.nome).join(' e ')),
      h('ol', { class: 'lim-classifica' }, cl.map((s) => h('li', {}, h('span', {}, `${s.posizione}° `), h('strong', {}, s.nome), h('span', {}, ` ${s.punti} punti`), h('span', { class: 'tenue' }, ` (${s.corrette} giuste, ${s.sbagliate} sbagliate)`)))),
      h('div', { class: 'azioni' },
        h('button', { class: 'btn primario grande', onclick: () => { chiudi(); esci(); } }, 'Torna alle impostazioni'))));
  }

  avviaTimer();
  disegna();
  return { smonta: chiudi };
}
