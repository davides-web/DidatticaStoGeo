import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { scegliBersagli, valutaQuiz, testoDomanda, livelliQuiz } from '../js/core/mappe.js';
import { creaRng } from '../js/core/utils.js';
import { leggiDalDisco } from './aiuti.js';

const radice = new URL('..', import.meta.url).pathname;

test('le carte elencate nell\'indice esistono e hanno la struttura giusta', async () => {
  const indice = await leggiDalDisco('contenuti/indice.json');
  assert.ok(indice.mappe.length >= 5);
  const contenuti = await Promise.all(indice.pacchetti.map((p) => leggiDalDisco('contenuti/' + p)));
  const argomenti = new Set(contenuti.flatMap((c) => (c.argomenti || []).map((a) => a.id)));
  for (const file of indice.mappe) {
    const m = JSON.parse(await readFile(`${radice}mappe/${file}`, 'utf8'));
    assert.ok(m.titolo && Array.isArray(m.viewBox) && m.viewBox.length === 4, file);
    if (m.argomento) assert.ok(argomenti.has(m.argomento), `${file}: argomento ${m.argomento} inesistente`);
    const ids = new Set();
    for (const l of m.livelli) {
      assert.ok(['aree', 'punti', 'linee'].includes(l.tipo), `${file}/${l.id}: tipo`);
      assert.ok(l.elementi.length > 0, `${file}/${l.id} vuoto`);
      for (const e of l.elementi) {
        assert.ok(e.id && e.nome, `${file}/${l.id}: elemento senza id o nome`);
        assert.ok(!ids.has(l.id + e.id), `${file}: id doppio ${e.id}`);
        ids.add(l.id + e.id);
        if (l.tipo === 'punti') {
          assert.ok(e.x >= 0 && e.x <= m.viewBox[2] && e.y >= 0 && e.y <= m.viewBox[3], `${file}: ${e.nome} fuori dalla carta`);
        } else assert.ok(e.d && e.d.length > 10, `${file}: ${e.nome} senza disegno`);
      }
    }
  }
});

test('l\'Italia ha 20 regioni e 20 capoluoghi; l\'Europa ha gli Stati e le capitali', async () => {
  const it = JSON.parse(await readFile(radice + 'mappe/italia.json', 'utf8'));
  assert.equal(it.livelli.find((l) => l.id === 'regioni').elementi.length, 20);
  assert.equal(it.livelli.find((l) => l.id === 'capoluoghi').elementi.length, 20);
  const eu = JSON.parse(await readFile(radice + 'mappe/europa.json', 'utf8'));
  assert.ok(eu.livelli.find((l) => l.id === 'stati').elementi.length >= 40);
});

test('scegliBersagli: numero richiesto, senza doppioni, esclude gli elementi quiz:false', () => {
  const livello = { elementi: Array.from({ length: 10 }, (_, i) => ({ id: 'e' + i, nome: 'N' + i, quiz: i === 0 ? false : undefined })) };
  const s = scegliBersagli(livello, 5, creaRng(3));
  assert.equal(s.length, 5);
  assert.equal(new Set(s.map((e) => e.id)).size, 5);
  assert.ok(!s.some((e) => e.id === 'e0'));
  assert.equal(scegliBersagli(livello, 50).length, 9);
});

test('valutaQuiz e testoDomanda', () => {
  const r = valutaQuiz([{ bersaglio: { id: 'a' }, scelto: 'a' }, { bersaglio: { id: 'b' }, scelto: 'x' }, { bersaglio: { id: 'c' }, scelto: 'c' }]);
  assert.deepEqual(r, { corrette: 2, totale: 3, percentuale: 67 });
  assert.equal(testoDomanda({ nome: 'Umbria' }), 'Trova: Umbria');
  assert.equal(testoDomanda({ nome: 'Roma', domanda: 'Trova la capitale' }), 'Trova la capitale');
  assert.equal(livelliQuiz({ livelli: [{ elementi: [{ id: 'a', quiz: false }] }, { elementi: [{ id: 'b' }] }] }).length, 1);
});
