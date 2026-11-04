import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formattaPacchetto, formattaIndice, pulisciVoce } from '../js/core/esporta.js';
import { validaInsieme } from '../js/core/validazione.js';
import { caricaReali } from './aiuti.js';

test('l\'esportazione dei contenuti reali si rilegge identica e resta valida', async () => {
  const c = await caricaReali();
  for (const { nome, dati } of c.pacchetti) {
    const testo = formattaPacchetto(dati);
    assert.deepEqual(JSON.parse(testo), JSON.parse(JSON.stringify(dati)), nome);
    assert.ok(testo.endsWith('\n'));
  }
  const rilette = c.pacchetti.map(({ nome, dati }) => ({ nome, dati: JSON.parse(formattaPacchetto(dati)) }));
  assert.deepEqual(validaInsieme(rilette).errori, []);
});

test('pulisciVoce toglie i campi vuoti ma tiene false e 0', () => {
  assert.deepEqual(pulisciVoce({ a: '', b: [], c: undefined, d: false, e: 0, f: 'x', g: null }), { d: false, e: 0, f: 'x' });
});

test('formattaIndice aggiorna solo l\'elenco dei pacchetti', () => {
  const t = formattaIndice({ versione: 1, pacchetti: ['a.json'], mappe: ['m.json'] }, ['a.json', 'b.json']);
  assert.deepEqual(JSON.parse(t), { versione: 1, pacchetti: ['a.json', 'b.json'], mappe: ['m.json'] });
});
