# Decisioni di progetto

Dove la richiesta lasciava più strade aperte ho scelto la più semplice. Le scelte sono qui, così il docente può cambiarle.

## Struttura
- **Nessuna libreria, nessun passaggio di "build"**: HTML, CSS e JavaScript (moduli ES) scritti a mano. Si pubblica così com'è su GitHub Pages.
- **Contenuti in "pacchetti" JSON** (`contenuti/storia-1.json`, `storia-2.json`, `geografia-1.json`, `civica.json`). Ogni pacchetto contiene argomenti, domande, eventi/concetti e glossario. L'elenco dei pacchetti è in `contenuti/indice.json`. Il formato è descritto in `contenuti/FORMATO.md`.
- **Offline**: un service worker salva i file nel dispositivo. L'elenco dei file si rigenera con `npm run aggiorna-sw` (i test avvisano se ci si dimentica).
- **Percorsi relativi** ovunque, così l'app funziona sia su `https://utente.github.io/Repo/` sia in locale.
- **Font**: Atkinson Hyperlegible e OpenDyslexic (licenza SIL OFL) inclusi nel repository, nessun caricamento da internet.
- **Impostazioni** (tema, carattere, ecc.) salvate solo nel browser del dispositivo (localStorage). Nessun dato degli alunni viene mai salvato.
