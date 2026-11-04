import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validaPacchetto, validaInsieme } from '../js/core/validazione.js';
import { caricaContenuti } from '../js/core/contenuti.js';
import { caricaReali } from './aiuti.js';

const arg = { id: 'a1', materia: 'storia', classe: 1, titolo: 'T', sintesi: 's', semplificata: 'p' };
const domScelta = { id: 'd1', argomento: 'a1', tipo: 'scelta', testo: 'Q?', opzioni: ['x', 'y', 'z'], corretta: 1, spiegazione: 'perché' };

test('un pacchetto minimo valido non dà errori', () => {
  const r = validaInsieme([{ nome: 'p', dati: { argomenti: [arg], domande: [domScelta] } }]);
  assert.deepEqual(r.errori, []);
});

test('rileva campi mancanti e valori sbagliati', () => {
  const r = validaPacchetto({ argomenti: [{ id: 'x', materia: 'arte', classe: 3 }] });
  assert.ok(r.errori.some((e) => e.includes('materia')));
  assert.ok(r.errori.some((e) => e.includes('classe')));
  assert.ok(r.errori.some((e) => e.includes('"titolo"')));
});

test('controlla i quattro tipi di domanda', () => {
  const cattive = [
    { ...domScelta, id: 'a', corretta: 7 },
    { ...domScelta, id: 'b', opzioni: ['x', 'x', 'z'] },
    { id: 'c', argomento: 'a1', tipo: 'vf', testo: 'Q', corretta: 'si', spiegazione: 'e' },
    { id: 'd', argomento: 'a1', tipo: 'completa', testo: 'manca il buco', risposta: 'r', spiegazione: 'e' },
    { id: 'e', argomento: 'a1', tipo: 'abbina', testo: 'Q', coppie: [['a', '1'], ['b', '1']], spiegazione: 'e' },
    { id: 'f', argomento: 'a1', tipo: 'indovina', testo: 'Q', spiegazione: 'e' },
  ];
  const r = validaPacchetto({ domande: cattive });
  assert.equal(r.errori.length >= 6, true, r.errori.join('\n'));
});

test('rileva id duplicati e argomenti inesistenti', () => {
  const r = validaInsieme([
    { nome: 'uno', dati: { argomenti: [arg], domande: [domScelta] } },
    { nome: 'due', dati: { domande: [{ ...domScelta, argomento: 'fantasma' }] } },
  ]);
  assert.ok(r.errori.some((e) => e.includes('duplicato')));
  assert.ok(r.errori.some((e) => e.includes('non esiste')));
});

test('gli eventi richiedono un anno intero', () => {
  const ev = { id: 'e1', argomento: 'a1', data: '476', titolo: 't', descrizione: 'd', anno: '476' };
  const r = validaInsieme([{ nome: 'p', dati: { argomenti: [arg], eventi: [ev] } }]);
  assert.ok(r.errori.some((e) => e.includes('anno')));
});

test('il caricatore unisce i pacchetti elencati nell\'indice', async () => {
  const file = { 'contenuti/indice.json': { pacchetti: ['a.json', 'b.json'] },
    'contenuti/a.json': { argomenti: [arg] }, 'contenuti/b.json': { domande: [domScelta] } };
  const c = await caricaContenuti(async (p) => { if (!file[p]) throw new Error('assente'); return file[p]; });
  assert.equal(c.argomenti.length, 1);
  assert.equal(c.domande.length, 1);
  assert.deepEqual(c.errori, []);
});

test('un file mancante viene segnalato senza bloccare tutto', async () => {
  const c = await caricaContenuti(async (p) => { if (p.endsWith('indice.json')) return { pacchetti: ['manca.json'] }; throw new Error('assente'); });
  assert.equal(c.errori.length, 1);
});

test('i contenuti reali del repository sono validi', async () => {
  const c = await caricaReali();
  assert.deepEqual(c.errori, [], c.errori.join('\n'));
});
