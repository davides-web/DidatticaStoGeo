// Aggiorna in sw.js l'elenco dei file da salvare offline e il numero di versione
// (calcolato dal contenuto dei file: se cambia qualcosa, la cache si rinnova).
// Uso:  npm run aggiorna-sw
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

const radice = new URL('..', import.meta.url).pathname;
const CARTELLE = ['css', 'js', 'contenuti', 'mappe', 'fonts', 'icons'];
const FILE_RADICE = ['index.html', 'manifest.webmanifest'];

export function elencoFile() {
  const trovati = [...FILE_RADICE];
  const visita = (dir) => {
    for (const nome of readdirSync(dir).sort()) {
      const p = join(dir, nome);
      if (statSync(p).isDirectory()) visita(p);
      else if (!nome.endsWith('.txt') && !nome.endsWith('.md')) trovati.push(relative(radice, p));
    }
  };
  for (const c of CARTELLE) { try { visita(join(radice, c)); } catch { /* cartella assente */ } }
  return trovati;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const file = elencoFile();
  const hash = createHash('sha1');
  for (const f of file) hash.update(f).update(readFileSync(join(radice, f)));
  const versione = hash.digest('hex').slice(0, 10);
  const blocco = `// <GENERATO>\nconst VERSIONE = '${versione}';\nconst FILE_APP = ${JSON.stringify(['./', ...file], null, 2)};\n// </GENERATO>`;
  const sw = readFileSync(join(radice, 'sw.js'), 'utf8').replace(/\/\/ <GENERATO>[\s\S]*?\/\/ <\/GENERATO>/, blocco);
  writeFileSync(join(radice, 'sw.js'), sw);
  console.log(`sw.js aggiornato: ${file.length} file, versione ${versione}`);
}
