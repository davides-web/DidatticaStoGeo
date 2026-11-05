import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generaVerifica, selezionaDomande, soluzioneBreve, puntiTotali } from '../js/core/verifica.js';
import { filtraDomande, controllaRisposta } from '../js/core/quiz.js';
import { creaRng } from '../js/core/utils.js';
import { caricaReali } from './aiuti.js';

const ids = (lista) => lista.map((d) => d.id);
const senzaDoppioni = (lista) => new Set(ids(lista)).size === lista.length && new Set(lista.map((d) => d.testo)).size === lista.length;

test('verifiche A e B: nessuna domanda duplicata, stesso insieme, ordine diverso', async () => {
  const c = await caricaReali();
  const pool = filtraDomande(c, { classe: 1, materia: 'storia' });
  for (const n of [5, 10, 15, 20, 30]) {
    for (const seme of [1, 2, 3, 42, 999]) {
      const v = generaVerifica(pool, { n, seme });
      assert.equal(v.A.length, n);
      assert.equal(v.B.length, n);
      assert.ok(senzaDoppioni(v.A), `A con duplicati (n=${n}, seme=${seme})`);
      assert.ok(senzaDoppioni(v.B), `B con duplicati (n=${n}, seme=${seme})`);
      assert.deepEqual(ids(v.A).sort(), ids(v.B).sort());
      assert.notDeepEqual(ids(v.A), ids(v.B), 'le due varianti devono avere ordine diverso');
      assert.ok(ids(v.A).every((id, i) => id !== ids(v.B)[i]), 'nessuna domanda nella stessa posizione');
    }
  }
});

test('se le domande sono poche, la verifica ne contiene meno senza ripeterle', async () => {
  const c = await caricaReali();
  const pool = filtraDomande(c, { argomenti: ['islam'] });
  const v = generaVerifica(pool, { n: 50, seme: 5 });
  assert.equal(v.A.length, pool.length);
  assert.ok(senzaDoppioni(v.A));
});

test('le domande sono distribuite in modo equilibrato tra gli argomenti', async () => {
  const c = await caricaReali();
  const pool = filtraDomande(c, { argomenti: ['islam', 'feudalesimo', 'crociate'] });
  const sel = selezionaDomande(pool, 9, creaRng(11));
  const conta = {};
  for (const d of sel) conta[d.argomento] = (conta[d.argomento] || 0) + 1;
  assert.deepEqual(Object.values(conta), [3, 3, 3]);
});

test('stesso seme = stessa verifica; seme diverso = verifica diversa', async () => {
  const c = await caricaReali();
  const pool = filtraDomande(c, { classe: 2 });
  assert.deepEqual(ids(generaVerifica(pool, { n: 10, seme: 7 }).A), ids(generaVerifica(pool, { n: 10, seme: 7 }).A));
  assert.notDeepEqual(ids(generaVerifica(pool, { n: 10, seme: 7 }).A), ids(generaVerifica(pool, { n: 10, seme: 8 }).A));
});

test('versione semplificata: meno domande, tre opzioni, parole aiuto, abbinamenti ≤ 4 coppie, senza duplicati', async () => {
  const c = await caricaReali();
  const pool = filtraDomande(c, { classe: 1 });
  const v = generaVerifica(pool, { n: 20, seme: 3 });
  assert.ok(v.semplificata.length < v.A.length && v.semplificata.length >= 5);
  assert.ok(senzaDoppioni(v.semplificata));
  const idsA = new Set(ids(v.A));
  for (const d of v.semplificata) {
    assert.ok(idsA.has(d.id), 'la semplificata usa domande della verifica');
    if (d.tipo === 'scelta') { assert.equal(d.opzioni.length, 3); assert.ok(controllaRisposta(d, d.corretta)); }
    if (d.tipo === 'completa') assert.ok(d.paroleAiuto.includes(d.risposta));
    if (d.tipo === 'abbina') assert.ok(d.coppie.length <= 4 && d.destra.length === d.coppie.length);
  }
  // raggruppate per tipo: una volta cambiato tipo non si torna indietro
  const tipi = v.semplificata.map((d) => d.tipo);
  assert.deepEqual(tipi, [...tipi].sort((a, b) => ['vf', 'scelta', 'completa', 'abbina'].indexOf(a) - ['vf', 'scelta', 'completa', 'abbina'].indexOf(b)));
});

test('le soluzioni del correttore corrispondono alle domande mostrate', async () => {
  const c = await caricaReali();
  const v = generaVerifica(filtraDomande(c, { classe: 1, materia: 'storia' }), { n: 30, seme: 21 });
  for (const d of [...v.A, ...v.B, ...v.semplificata]) {
    const s = soluzioneBreve(d);
    assert.ok(s, d.id);
    if (d.tipo === 'scelta') assert.ok(s.endsWith(d.opzioni[d.corretta]));
    if (d.tipo === 'abbina') {
      // ogni "n→L" deve puntare alla lettera della destra che contiene la coppia giusta
      for (const m of s.matchAll(/(\d+)→([A-Z])/g)) {
        assert.equal(d.destra[m[2].charCodeAt(0) - 65], d.coppie[Number(m[1]) - 1][1]);
      }
    }
  }
  assert.ok(puntiTotali(v.A) >= v.A.length);
});
