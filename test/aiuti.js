// Aiuti condivisi dai test: legge i contenuti dal disco come farebbe il browser con fetch.
import { readFile } from 'node:fs/promises';
import { caricaContenuti } from '../js/core/contenuti.js';

const radice = new URL('..', import.meta.url).pathname;
export const leggiDalDisco = async (p) => JSON.parse(await readFile(radice + p, 'utf8'));
export const caricaReali = () => caricaContenuti(leggiDalDisco);
