// Unisce più file parziali in un solo pacchetto, scrivendo una voce per riga (più leggibile da modificare).
// Uso: node strumenti/unisci-pacchetto.js uscita.json parte1.json parte2.json ...
import { readFileSync, writeFileSync } from 'node:fs';

const [uscita, ...parti] = process.argv.slice(2);
const unito = {};
for (const p of parti) {
  const dati = JSON.parse(readFileSync(p, 'utf8'));
  for (const [coll, voci] of Object.entries(dati)) (unito[coll] ||= []).push(...voci);
}
const ordine = ['argomenti', 'domande', 'eventi', 'concetti', 'glossario'].filter((c) => unito[c]);
const righe = ordine.map((c) => `  "${c}": [\n${unito[c].map((v) => '    ' + JSON.stringify(v)).join(',\n')}\n  ]`);
writeFileSync(uscita, `{\n${righe.join(',\n')}\n}\n`);
console.log(`${uscita}: ` + ordine.map((c) => `${unito[c].length} ${c}`).join(', '));
