import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { elencoFile } from '../strumenti/aggiorna-sw.js';

const radice = new URL('..', import.meta.url).pathname;

test('sw.js elenca tutti i file dell\'app (esegui "npm run aggiorna-sw" se fallisce)', () => {
  const sw = readFileSync(radice + 'sw.js', 'utf8');
  const elencati = JSON.parse(sw.match(/const FILE_APP = (\[[\s\S]*?\]);/)[1]);
  for (const f of elencoFile()) assert.ok(elencati.includes(f), `manca in sw.js: ${f}`);
});

test('i file del manifest esistono', () => {
  const m = JSON.parse(readFileSync(radice + 'manifest.webmanifest', 'utf8'));
  for (const i of m.icons) assert.ok(existsSync(radice + i.src), i.src);
});
