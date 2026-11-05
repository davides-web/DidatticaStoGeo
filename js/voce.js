// Lettura ad alta voce con la sintesi vocale del browser (speechSynthesis).
// Nessun servizio esterno: usa le voci installate nel dispositivo.

const disponibile = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

/** Sceglie una voce per la lingua ("it" o "en"); preferisce le voci locali. */
function scegliVoce(lingua) {
  const voci = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith(lingua));
  return voci.find((v) => v.localService) || voci[0] || null;
}

/** Spezza un testo lungo in frasi: alcuni browser interrompono le letture lunghe. */
function inFrasi(testo) {
  return testo.replace(/\s+/g, ' ').match(/[^.!?;:]+[.!?;:]?/g)?.map((s) => s.trim()).filter(Boolean) || [testo];
}

export function vocePronta() {
  return disponibile();
}

export function fermaLettura() {
  if (disponibile()) speechSynthesis.cancel();
}

/**
 * Legge un testo ad alta voce.
 * @param {string} testo
 * @param {'it'|'en'} lingua
 * @param {number} velocita 1 = normale (0.7 = lenta)
 */
export function leggi(testo, lingua = 'it', velocita = 0.9) {
  if (!disponibile()) {
    alert('Questo browser non supporta la lettura ad alta voce.');
    return;
  }
  speechSynthesis.cancel();
  const voce = scegliVoce(lingua);
  for (const frase of inFrasi(testo)) {
    const u = new SpeechSynthesisUtterance(frase);
    u.lang = lingua === 'en' ? 'en-GB' : 'it-IT';
    if (voce) u.voice = voce;
    u.rate = velocita;
    speechSynthesis.speak(u);
  }
}

// Alcuni browser caricano le voci in ritardo: le richiediamo subito.
if (disponibile()) speechSynthesis.getVoices();
