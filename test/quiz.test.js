import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filtraDomande, preparaDomanda, controllaRisposta, soluzioneTesto, coppieGiuste } from '../js/core/quiz.js';
import { nuovaPartita, assegna, avanza, classifica, vincitori, puntiRisposta } from '../js/core/squadre.js';
import { creaRng } from '../js/core/utils.js';
import { caricaReali } from './aiuti.js';

/* ----- Punteggio a squadre ----- */
test('squadre: servono da 2 a 4 squadre', () => {
  assert.throws(() => nuovaPartita(['A'], 5));
  assert.throws(() => nuovaPartita(['A', 'B', 'C', 'D', 'E'], 5));
  assert.equal(nuovaPartita(['A', 'B'], 5).squadre.length, 2);
});

test('squadre: risposta giusta = 10 punti, sbagliata = 0, senza timer niente bonus', () => {
  let p = nuovaPartita(['A', 'B'], 3);
  p = assegna(p, 0, true);
  p = assegna(p, 1, false);
  assert.deepEqual(p.squadre.map((s) => s.punti), [10, 0]);
  assert.deepEqual(p.squadre.map((s) => [s.corrette, s.sbagliate]), [[1, 0], [0, 1]]);
});

test('squadre: con il timer c\'è un bonus di rapidità, da 5 a 0', () => {
  assert.equal(puntiRisposta(true, 30, 30), 15);
  assert.equal(puntiRisposta(true, 15, 30), 13); // 5 * 0.5 = 2,5 arrotondato a 3
  assert.equal(puntiRisposta(true, 0, 30), 10);
  assert.equal(puntiRisposta(true, 99, 30), 15); // il tempo rimasto non supera il timer
  assert.equal(puntiRisposta(false, 30, 30), 0);
});

test('squadre: il turno ruota e la partita si conclude dopo l\'ultima domanda', () => {
  let p = nuovaPartita(['A', 'B', 'C'], 3);
  assert.equal(p.turno, 0);
  p = avanza(p); assert.equal(p.turno, 1); assert.equal(p.concluso, false);
  p = avanza(p); assert.equal(p.turno, 2);
  p = avanza(p); assert.equal(p.turno, 0); assert.equal(p.concluso, true);
});

test('squadre: le funzioni non modificano la partita originale', () => {
  const p = nuovaPartita(['A', 'B'], 2);
  const q = assegna(p, 0, true);
  assert.equal(p.squadre[0].punti, 0);
  assert.equal(q.squadre[0].punti, 10);
});

test('squadre: classifica con ex aequo e vincitori', () => {
  let p = nuovaPartita(['A', 'B', 'C'], 5);
  p = assegna(p, 0, true); p = assegna(p, 1, true); // A e B a 10, C a 0
  const c = classifica(p);
  assert.deepEqual(c.map((s) => [s.nome, s.posizione]), [['A', 1], ['B', 1], ['C', 3]]);
  assert.deepEqual(vincitori(p).map((s) => s.nome), ['A', 'B']);
  p = assegna(p, 2, true); p = assegna(p, 2, true);
  assert.equal(vincitori(p)[0].nome, 'C');
});

/* ----- Correzione ----- */
const dScelta = { id: 's', tipo: 'scelta', testo: '?', opzioni: ['a', 'b', 'c', 'd'], corretta: 2, spiegazione: 'x' };
const dCompleta = { id: 'c', tipo: 'completa', testo: 'Il ___', risposta: 'Teodorico', accettate: ['Teodorico il Grande'], spiegazione: 'x' };
const dAbbina = { id: 'a', tipo: 'abbina', testo: '?', coppie: [['1', 'uno'], ['2', 'due'], ['3', 'tre']], spiegazione: 'x' };

test('preparaDomanda mescola le opzioni senza perdere quella giusta', () => {
  for (let seme = 1; seme < 30; seme++) {
    const p = preparaDomanda(dScelta, creaRng(seme));
    assert.equal(p.opzioni[p.corretta], 'c');
    assert.deepEqual([...p.opzioni].sort(), ['a', 'b', 'c', 'd']);
  }
  assert.equal(dScelta.corretta, 2); // originale intatto
});

test('controllaRisposta: scelta, vero/falso, abbinamento', () => {
  assert.equal(controllaRisposta(dScelta, 2), true);
  assert.equal(controllaRisposta(dScelta, 1), false);
  assert.equal(controllaRisposta({ tipo: 'vf', corretta: false }, false), true);
  assert.equal(controllaRisposta({ tipo: 'vf', corretta: false }, true), false);
  assert.equal(controllaRisposta(dAbbina, ['uno', 'due', 'tre']), true);
  assert.equal(controllaRisposta(dAbbina, ['uno', 'tre', 'due']), false);
  assert.equal(coppieGiuste(dAbbina, ['uno', 'tre', 'due']), 1);
});

test('controllaRisposta: completamento ignora maiuscole, accenti e piccoli errori di battitura', () => {
  assert.equal(controllaRisposta(dCompleta, 'teodorico'), true);
  assert.equal(controllaRisposta(dCompleta, '  Teodorico! '), true);
  assert.equal(controllaRisposta(dCompleta, 'Teodoriko'), true); // un errore, parola lunga
  assert.equal(controllaRisposta(dCompleta, 'Teodorico il grande'), true);
  assert.equal(controllaRisposta(dCompleta, 'Odoacre'), false);
  assert.equal(controllaRisposta(dCompleta, ''), false);
  assert.equal(controllaRisposta({ tipo: 'completa', risposta: 'XVI' }, 'XVII'), false); // parola corta: nessuna tolleranza
});

test('soluzioneTesto', () => {
  assert.equal(soluzioneTesto(dScelta), 'c');
  assert.equal(soluzioneTesto({ tipo: 'vf', corretta: true }), 'Vero');
  assert.equal(soluzioneTesto(dCompleta), 'Teodorico');
  assert.match(soluzioneTesto(dAbbina), /1 → uno/);
});

test('filtraDomande per classe, materia, argomento e tipo sui contenuti reali', async () => {
  const c = await caricaReali();
  const tutte = filtraDomande(c);
  assert.equal(tutte.length, c.domande.length);
  const s1 = filtraDomande(c, { classe: 1, materia: 'storia' });
  assert.ok(s1.length > 50 && s1.every((d) => c.argomenti.find((a) => a.id === d.argomento).classe === 1));
  const unArg = filtraDomande(c, { argomenti: ['islam'] });
  assert.ok(unArg.length >= 8 && unArg.every((d) => d.argomento === 'islam'));
  assert.ok(filtraDomande(c, { tipi: ['vf'] }).every((d) => d.tipo === 'vf'));
  assert.equal(filtraDomande(c, { classe: 2, materia: 'geografia' }).length, 0);
});

test('con i contenuti reali ogni domanda ha una sola risposta corretta riconosciuta dalla correzione', async () => {
  const c = await caricaReali();
  for (const d of c.domande) {
    const p = preparaDomanda(d, creaRng(7));
    if (d.tipo === 'scelta') assert.equal(p.opzioni.filter((_, i) => controllaRisposta(p, i)).length, 1, d.id);
    if (d.tipo === 'vf') assert.equal([true, false].filter((v) => controllaRisposta(p, v)).length, 1, d.id);
    if (d.tipo === 'completa') assert.ok(controllaRisposta(p, d.risposta), d.id);
    if (d.tipo === 'abbina') assert.ok(controllaRisposta(p, d.coppie.map((x) => x[1])), d.id);
  }
});
