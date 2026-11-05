import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ordinaEventi, formattaAnno, controllaOrdine, scegliPerGioco, assegnaCorsie, tacche, eventiDiSelezione, eventiDiLinea, posizioneX } from '../js/core/timeline.js';
import { creaRng } from '../js/core/utils.js';
import { caricaReali } from './aiuti.js';

const ev = (id, anno, titolo = id) => ({ id, anno, titolo, data: String(anno), descrizione: 'd', argomento: 'a' });

test('ordinaEventi ordina per anno, anche con anni a.C.', () => {
  const o = ordinaEventi([ev('c', 476), ev('a', -44), ev('b', 313)]);
  assert.deepEqual(o.map((e) => e.id), ['a', 'b', 'c']);
});

test('ordinaEventi non modifica l\'elenco originale e a parità di anno ordina per titolo', () => {
  const orig = [ev('z', 800, 'Zeta'), ev('y', 800, 'Alfa'), ev('x', 700)];
  const o = ordinaEventi(orig);
  assert.deepEqual(o.map((e) => e.id), ['x', 'y', 'z']);
  assert.equal(orig[0].id, 'z');
});

test('formattaAnno', () => {
  assert.equal(formattaAnno(476), '476 d.C.');
  assert.equal(formattaAnno(-44), '44 a.C.');
});

test('controllaOrdine riconosce l\'ordine giusto e quello sbagliato', () => {
  const eventi = [ev('a', 100), ev('b', 200), ev('c', 300)];
  assert.equal(controllaOrdine(['a', 'b', 'c'], eventi).completo, true);
  const r = controllaOrdine(['b', 'a', 'c'], eventi);
  assert.equal(r.completo, false);
  assert.deepEqual(r.giuste, [false, false, true]);
  assert.equal(r.corrette, 1);
});

test('controllaOrdine accetta qualunque ordine tra eventi dello stesso anno', () => {
  const eventi = [ev('a', 100), ev('b', 200), ev('c', 200)];
  assert.equal(controllaOrdine(['a', 'c', 'b'], eventi).completo, true);
});

test('scegliPerGioco: anni diversi, numero richiesto, mai già in ordine', () => {
  const eventi = Array.from({ length: 12 }, (_, i) => ev('e' + i, 1000 + (i % 6) * 10));
  for (let seme = 1; seme <= 20; seme++) {
    const s = scegliPerGioco(eventi, 5, creaRng(seme));
    assert.equal(s.length, 5);
    assert.equal(new Set(s.map((e) => e.anno)).size, 5);
    assert.equal(s.every((e, i) => i === 0 || s[i - 1].anno <= e.anno), false);
  }
});

test('assegnaCorsie: due eventi vicini finiscono su corsie diverse, lontani sulla stessa', () => {
  const eventi = [ev('a', 1000), ev('b', 1001), ev('c', 1500)];
  const r = assegnaCorsie(eventi, { min: 1000, max: 1500, larghezza: 2000 });
  assert.notEqual(r[0].corsia, r[1].corsia);
  assert.equal(r[2].corsia, 0);
  // nessuna sovrapposizione nella stessa corsia
  for (const x of r) for (const y of r) if (x !== y && x.corsia === y.corsia) assert.ok(Math.abs(x.x - y.x) >= 170);
});

test('tacche e posizioneX', () => {
  assert.deepEqual(tacche(0, 100, 10), [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
  assert.equal(posizioneX(150, 100, 200, 1000), 500);
  assert.equal(posizioneX(5, 5, 5, 1000), 500);
});

test('con i contenuti reali: ogni classe ha eventi in ordine cronologico e le linee di confronto non sono vuote', async () => {
  const c = await caricaReali();
  for (const classe of [1, 2]) {
    const e = eventiDiSelezione(c, `classe:${classe}`);
    assert.ok(e.length > 20);
    assert.ok(e.every((x, i) => i === 0 || e[i - 1].anno <= x.anno));
  }
  assert.ok(eventiDiLinea(c, 'europa', 1).length > 10);
  assert.ok(eventiDiLinea(c, 'islam', 1).length >= 6);
});
