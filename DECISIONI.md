# Decisioni di progetto

Dove la richiesta lasciava più strade aperte ho scelto la più semplice. Le scelte sono qui, così il docente può cambiarle.

## Struttura
- **Nessuna libreria, nessun passaggio di "build"**: HTML, CSS e JavaScript (moduli ES) scritti a mano. Si pubblica così com'è su GitHub Pages.
- **Contenuti in "pacchetti" JSON** (`contenuti/storia-1.json`, `storia-2.json`, `geografia-1.json`, `civica.json`). Ogni pacchetto contiene argomenti, domande, eventi/concetti e glossario. L'elenco dei pacchetti è in `contenuti/indice.json`. Il formato è descritto in `contenuti/FORMATO.md`.
- **Offline**: un service worker salva i file nel dispositivo. L'elenco dei file si rigenera con `npm run aggiorna-sw` (i test avvisano se ci si dimentica).
- **Percorsi relativi** ovunque, così l'app funziona sia su `https://utente.github.io/Repo/` sia in locale.
- **Font**: Atkinson Hyperlegible e OpenDyslexic (licenza SIL OFL) inclusi nel repository, nessun caricamento da internet.
- **Impostazioni** (tema, carattere, ecc.) salvate solo nel browser del dispositivo (localStorage). Nessun dato degli alunni viene mai salvato.

## Contenuti
- **Quantità**: per ogni argomento ci sono da 8 a 12 domande e da 6 a 10 eventi o concetti (il test dei contenuti lo controlla). Ogni argomento ha 3 termini di glossario.
- **Eventi e concetti**: Storia ha *eventi* con data (per le linee del tempo); Geografia ha *concetti chiave* senza data; Educazione civica ha concetti e, dove serve, eventi (Costituzione, diritti).
- **Argomenti di Educazione civica**: cinque, collegati ai periodi di storia con il campo `collegamenti` (cittadinanza, diritti umani, Costituzione, lavoro e diritti, libertà religiosa e tolleranza). Sono suggerimenti, modificabili.
- **«Rivoluzione americana e francese»**: due argomenti separati (12 argomenti in seconda).
- **Immagini**: «immagine o icona se disponibile con licenza libera» → ho usato soltanto **emoji** come icone. Nessuna immagine di terzi nel repository (si può aggiungere in futuro un campo `immagine`).
- **Linea del tempo**: l'asse è lineare (gli anni sono distanziati in proporzione); con molti eventi la linea si allunga e si scorre. Il confronto tra due linee usa il campo `linea` degli eventi (europa, islam, bizantino, italia, mondo).
- **Gioco di riordino**: si scelgono eventi con anni diversi (l'ordine deve essere univoco); trascinamento con Pointer Events (mouse, penna, dito) più pulsanti ▲▼ per chi non riesce a trascinare.

## Carte
- **Dati**: Natural Earth (Stati d'Europa, terre emerse) e confini ISTAT delle regioni (CC BY 4.0), semplificati e convertiti in SVG da `strumenti/prepara-mappe.mjs`. Fiumi, monti, capoluoghi, capitali, rotte e confini storici sono **disegnati a mano e approssimati**: non sono carte di precisione.
- **Carte storiche semplificate**: «Impero di Carlo Magno», «Italia dei Comuni» (le regioni attuali raggruppate in territori), «Scoperte geografiche». I territori storici disegnati a mano sono ritagliati sulla terraferma.
- **Quiz**: un solo tentativo per domanda; gli Stati minuscoli (Vaticano, Monaco, San Marino…) non sono chiesti nel quiz perché troppo piccoli da cliccare, ma si vedono in «Esplora».

## Quiz
- **Punteggio a squadre**: 10 punti per risposta giusta, 0 per quella sbagliata; con il timer un bonus da 0 a 5 punti in base al tempo rimasto. Il turno ruota tra le squadre, ma il docente può far rispondere un'altra squadra toccandone il nome.
- **Completamenti**: si ignorano maiuscole e accenti e si tollera **un errore di battitura** nelle parole di almeno 6 lettere (per non penalizzare chi ha difficoltà di scrittura).
- **Flashcard**: le carte non sapute tornano in fondo al mazzo; finito il mazzo, si può ricominciare.

## Verifiche
- **Varianti A e B**: stesse domande (stessa difficoltà), **ordine diverso** e opzioni mescolate in modo diverso; nessuna domanda è nella stessa posizione. Le domande sono distribuite in modo equilibrato fra gli argomenti scelti e non si ripetono mai.
- **Versione semplificata**: circa il 60% delle domande (minimo 5); preferisce vero/falso, scelta (3 sole opzioni) e completamenti con «parole aiuto»; abbinamenti ridotti a 4 coppie al massimo; domande raggruppate per tipo con consegne in passi; carattere più grande e interlinea ampia.
- **Codice verifica**: lo stesso numero genera sempre la stessa verifica.
- **Stampa**: i fogli usano il carattere scelto nelle impostazioni (di base Verdana/Arial), sempre nero su bianco, A4, una domanda non viene spezzata tra due pagine.

## Accessibilità
- Carattere ad alta leggibilità (Atkinson Hyperlegible) e OpenDyslexic, inclusi nel repository; interlinea e spaziatura ampie, sfondo crema, alto contrasto, tema chiaro/scuro (automatico di default), testo fino al 200%, righello di lettura, lettura ad alta voce (italiano e inglese).
- Tutte le funzioni si usano anche con la tastiera; pulsanti alti almeno 48 px; testi in HTML (non immagini).

## Editor
- **Bozza** nel `localStorage` del browser (non nel repository): serve a non perdere il lavoro; il docente deve esportare i file e caricarli su GitHub.
- **Domande a scelta**: nel modulo si scrive la risposta giusta e le sbagliate (l'app mescola comunque le opzioni); nel file la risposta giusta viene salvata per prima.
- **Nessuna licenza** è stata aggiunta al repository: la scelta (per codice e testi) spetta al docente.
