// Impostazioni di accessibilità e tema. Si salvano SOLO nel browser del dispositivo
// (localStorage): niente account, niente dati degli alunni.
import { h, sostituisci } from './dom.js';

const CHIAVE = 'didattica-impostazioni';
const PREDEFINITE = { tema: 'auto', crema: false, font: 'standard', interlinea: false, dimensione: 100, contrasto: false };
let imp = { ...PREDEFINITE };

function carica() {
  try {
    imp = { ...PREDEFINITE, ...JSON.parse(localStorage.getItem(CHIAVE) || '{}') };
  } catch { imp = { ...PREDEFINITE }; }
}
function salva() {
  try { localStorage.setItem(CHIAVE, JSON.stringify(imp)); } catch { /* storage non disponibile: pazienza */ }
}

/** Applica le impostazioni alla pagina (classi sull'elemento <html>). */
export function applicaImpostazioni() {
  const r = document.documentElement;
  const scuro = imp.tema === 'scuro' || (imp.tema === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  r.dataset.tema = scuro ? 'scuro' : 'chiaro';
  r.classList.toggle('crema', imp.crema);
  r.classList.toggle('interlinea', imp.interlinea);
  r.classList.toggle('contrasto', imp.contrasto);
  r.dataset.font = imp.font;
  r.style.fontSize = `${imp.dimensione}%`;
}

export function inizializza() {
  carica();
  applicaImpostazioni();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applicaImpostazioni);
}

function cambia(chiave, valore) {
  imp[chiave] = valore;
  salva();
  applicaImpostazioni();
}

/** Costruisce il pannello (finestra di dialogo) con tutti gli interruttori. */
export function creaPannello() {
  const dlg = h('dialog', { id: 'pannello-access', 'aria-labelledby': 'titolo-access' });
  const contenuto = h('div', { class: 'pannello' });
  dlg.append(contenuto);

  function disegna() {
    const interruttore = (chiave, etichetta, aiuto) =>
      h('label', { class: 'riga-imp' },
        h('input', { type: 'checkbox', checked: imp[chiave], onchange: (e) => { cambia(chiave, e.target.checked); } }),
        h('span', {}, h('strong', {}, etichetta), aiuto ? h('small', {}, aiuto) : null));
    const scelta = (chiave, etichetta, opzioni) =>
      h('div', { class: 'riga-imp colonna' },
        h('strong', {}, etichetta),
        h('div', { class: 'gruppo-btn' }, opzioni.map(([val, testo]) =>
          h('button', { class: 'btn' + (imp[chiave] === val ? ' attivo' : ''), 'aria-pressed': String(imp[chiave] === val),
            onclick: () => { cambia(chiave, val); disegna(); } }, testo))));

    sostituisci(contenuto,
      h('h2', { id: 'titolo-access' }, 'Accessibilità e aspetto'),
      scelta('tema', 'Tema', [['auto', 'Automatico'], ['chiaro', 'Chiaro'], ['scuro', 'Scuro']]),
      scelta('font', 'Carattere', [['standard', 'Standard'], ['leggibile', 'Alta leggibilità'], ['dislessia', 'OpenDyslexic']]),
      h('div', { class: 'riga-imp colonna' },
        h('strong', {}, `Grandezza del testo: ${imp.dimensione}%`),
        h('div', { class: 'gruppo-btn' },
          h('button', { class: 'btn', onclick: () => { cambia('dimensione', Math.max(80, imp.dimensione - 10)); disegna(); } }, 'A−  Più piccolo'),
          h('button', { class: 'btn', onclick: () => { cambia('dimensione', 100); disegna(); } }, 'Normale'),
          h('button', { class: 'btn', onclick: () => { cambia('dimensione', Math.min(200, imp.dimensione + 10)); disegna(); } }, 'A+  Più grande'))),
      interruttore('interlinea', 'Interlinea ampia', 'Più spazio tra righe e lettere'),
      interruttore('crema', 'Sfondo color crema', 'Meno abbagliante, utile per la dislessia'),
      interruttore('contrasto', 'Alto contrasto', 'Testo nero/bianco e bordi marcati'),
      h('div', { class: 'azioni' },
        h('button', { class: 'btn', onclick: () => { imp = { ...PREDEFINITE }; salva(); applicaImpostazioni(); disegna(); } }, 'Ripristina'),
        h('button', { class: 'btn primario', onclick: () => dlg.close() }, 'Chiudi')));
  }
  disegna();
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  return dlg;
}
