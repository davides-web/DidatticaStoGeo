# Storia e Geografia – app didattica per la LIM

Un'app web in italiano per la **scuola secondaria di primo grado** (classi prime e seconde), pensata per la LIM e per i computer della scuola, ma utilizzabile anche dagli alunni a casa.

- ⏳ **Linee del tempo** interattive (zoom, confronto tra due linee, gioco di riordino)
- 🗺️ **Carte mute** (Italia, Europa, carte storiche): esplora oppure fai il quiz
- ❓ **Quiz**: a squadre alla LIM, individuale con correzione, flashcard
- 🔤 **Glossario** con traduzione e definizione in inglese e lettura ad alta voce
- 🖨️ **Verifiche stampabili** (varianti A e B, versione semplificata, correttore) in A4 o PDF
- ✏️ **Editor** per aggiungere e modificare domande, eventi e termini senza toccare il codice
- ♿ **Accessibilità**: carattere ad alta leggibilità e OpenDyslexic, interlinea ampia, sfondo crema, tema chiaro/scuro, alto contrasto, righello di lettura, lettura ad alta voce

**Non c'è nessun server, nessun account e nessun dato degli alunni viene raccolto o salvato.** Funziona anche **senza internet** dopo la prima apertura.

---

## 1. Pubblicare l'app con GitHub Pages (una volta sola)

Serve un account GitHub e questo repository (già pubblico).

1. Se la modifica è in una *pull request*, per prima cosa **uniscila** al ramo `main` (pulsante verde **Merge pull request**).
2. Nel repository, apri **Settings** (Impostazioni) → nel menu a sinistra **Pages**.
3. In **Build and deployment** → **Source** scegli **Deploy from a branch**.
4. In **Branch** scegli **main** e la cartella **/ (root)**, poi premi **Save**.
5. Aspetta uno-due minuti e ricarica la pagina delle impostazioni: in alto comparirà l'indirizzo, del tipo  
   `https://NOME-UTENTE.github.io/NOME-REPOSITORY/`
6. Apri quell'indirizzo: ecco l'app. Salvalo tra i preferiti del browser (e della LIM).

> Se compare «404», aspetta ancora un minuto e controlla di aver scelto `main` e `/ (root)`.

## 2. Usare l'app alla LIM e a scuola

**Prima volta:** apri l'indirizzo con il browser (meglio **Chrome** o **Edge**) **mentre sei collegato a internet**: l'app si salva nel computer e poi funziona anche senza rete. Nei browser compare, nella barra dell'indirizzo, l'icona «Installa»: puoi installarla come un normale programma.

**Consigli per la LIM**
- Premi **F11** per lo schermo intero del browser.
- Il pulsante **Aa Accessibilità** (in alto a destra) permette di scegliere tema chiaro o scuro, ingrandire il testo (A+), cambiare carattere, attivare lo sfondo crema, l'interlinea ampia, l'alto contrasto e il righello di lettura. Le impostazioni restano nel computer in cui le scegli.
- **Studio**: per ogni argomento c'è la sintesi e una **versione semplificata** (frasi corte, carattere grande). Il pulsante 🔊 **Leggi ad alta voce** usa la voce del computer: se non senti niente, controlla che nel sistema sia installata una **voce italiana** (in Windows: Impostazioni → Ora e lingua → Voce).
- **Linee del tempo**: scegli il periodo (una classe intera o un argomento), usa 🔍+ / 🔍− per lo zoom e clicca un evento per aprire la scheda. In «Confronta due linee» metti, per esempio, Europa e Mondo islamico sullo stesso asse del tempo. «Gioco: riordina» chiede di mettere gli eventi in ordine trascinandoli (o con le frecce ▲▼).
- **Carte mute**: «Esplora» mostra il nome al clic; «Quiz» dice un nome e si deve trovare sulla carta. Si trascina per spostarsi e si ingrandisce con 🔍.
- **Quiz → LIM a squadre**: da 2 a 4 squadre, timer facoltativo (con un piccolo bonus per la rapidità), domanda a tutto schermo. Tocca il nome di una squadra per far rispondere proprio lei. Con le domande a scelta si tocca la risposta; con completamenti e abbinamenti si mostra la soluzione e il docente decide se è giusta. Scorciatoie: tasti **1-4** per le opzioni, **V/F** per vero/falso, **Invio** per andare avanti. Il pulsante ⛶ attiva lo schermo intero.
- **Verifiche**: scegli classe, materia, argomenti e numero di domande. Appaiono: Variante A, Variante B (stesse domande in ordine diverso), Versione semplificata e Correttore. Premi **Stampa / salva in PDF** e nella finestra del browser scegli la stampante oppure «Salva come PDF» (formato **A4**). Il **codice verifica** permette di ritrovare esattamente la stessa verifica in un altro momento.

**Aggiornamenti:** quando pubblichi nuovi contenuti, la prima volta che riapri l'app (con internet) vedrai ancora la versione vecchia: **ricarica la pagina una seconda volta** (tasto F5) per vedere la nuova.

## 3. Aggiungere o modificare i contenuti con l'Editor

Tutti i contenuti sono file di testo (JSON) nella cartella **`contenuti/`**. Non serve modificarli a mano: usa la pagina **Editor** dell'app.

1. Apri l'app → **Editor**. Scegli il file (per esempio `storia-1.json`) e il tipo di scheda: *Argomenti, Domande, Eventi, Concetti, Glossario*.
2. Clicca una voce per modificarla, oppure **Nuova…** per crearne una. Scrivi nei campi e premi **💾 Salva la voce**.  
   L'Editor controlla gli errori (campi mancanti, identificatori doppi, risposte sbagliate…) e te li segnala.
3. Il lavoro resta in una **bozza nel tuo browser** (puoi chiudere e riprendere). **Non è ancora online.**
4. Quando hai finito premi **⬇ Esporta questo file (JSON)**: viene scaricato il file aggiornato (per esempio `storia-1.json`). Se hai lavorato su più file, esporta ciascuno.
5. **Caricalo nel repository**, su GitHub:
   - apri la cartella `contenuti` del repository,
   - **Add file → Upload files**, trascina il file scaricato (stesso nome del vecchio: lo sostituisce),
   - in fondo scrivi una breve descrizione (per esempio «Nuove domande sul feudalesimo») e premi **Commit changes**.
6. Dopo uno-due minuti il sito è aggiornato (ricarica due volte, vedi sopra).

**Per creare un file nuovo** (per esempio per la classe terza): in Editor premi **➕ Nuovo file**, scrivi il nome (es. `storia-3.json`), aggiungi argomenti e schede, esporta il file **e anche `indice.json`** (pulsante **⬇ Esporta indice.json**), poi carica entrambi nella cartella `contenuti`.

**Esempi rapidi**
- *Una nuova domanda a scelta*: Domande → Nuova domanda → tipo «Scelta multipla» → scrivi il testo, la **risposta giusta** e le **risposte sbagliate** (una per riga; l'app le mescola ogni volta) → scrivi la spiegazione → Salva.
- *Un nuovo evento*: Eventi → Nuovo evento. Il campo **Anno** serve a ordinare (numero intero, negativo per gli anni a.C.); il campo **Data** è quello che si legge (per esempio «circa 1000»). La **Linea** (europa, islam, bizantino, italia, mondo…) serve al confronto tra due linee.
- *Un termine del glossario*: Glossario → Nuovo termine; scrivi termine, definizione, traduzione inglese, definizione in inglese ed esempio.

Il formato dei file è spiegato in **[contenuti/FORMATO.md](contenuti/FORMATO.md)**. Il pulsante **✔ Controlla i contenuti** dell'Editor mostra eventuali errori in tutti i file.

> **Attenzione:** i contenuti di partenza sono stati scritti con cura ma vanno verificati dal docente. In **[DA_VERIFICARE.md](DA_VERIFICARE.md)** trovi le affermazioni da controllare (date convenzionali, cifre, semplificazioni).

## 4. Come è fatto il repository

| Cartella / file | A cosa serve |
|---|---|
| `index.html`, `css/`, `js/` | L'app (HTML, CSS e JavaScript scritti a mano, commentati in italiano, nessuna libreria) |
| `contenuti/` | I contenuti in JSON (modificabili) e `indice.json` con l'elenco dei file |
| `mappe/` | I disegni delle carte (dati cartografici con licenza libera, vedi [CREDITI.md](CREDITI.md)) |
| `fonts/`, `icons/` | Caratteri (Atkinson Hyperlegible, OpenDyslexic) e icone dell'app |
| `sw.js`, `manifest.webmanifest` | Funzionamento offline e installazione come app |
| `test/` | Test automatici |
| `strumenti/` | Piccoli programmi di servizio (per chi sviluppa) |
| [DECISIONI.md](DECISIONI.md) | Le scelte fatte dove la richiesta lasciava più strade |

## 5. Per chi sviluppa

Serve Node.js 20 o successivo (nessuna dipendenza da installare).

```bash
npm test                 # esegue i test automatici
npm run aggiorna-sw      # aggiorna l'elenco dei file offline e la versione in sw.js
python3 -m http.server   # prova in locale su http://localhost:8000
```

I test verificano: caricamento e validazione dei JSON dei contenuti, generazione delle verifiche A/B senza domande duplicate, punteggio del quiz a squadre, ordinamento della linea del tempo, correzione delle risposte, esportazione dell'Editor, struttura delle carte e dei file offline.

**Prima di pubblicare** modifiche al codice o ai file in `mappe/`: esegui `npm run aggiorna-sw` e poi `npm test` (il test dei file offline avvisa se ci si dimentica). Per cambiare solo i contenuti JSON non serve: l'app aggiorna comunque i dati alla riapertura.

Le carte si rigenerano con `strumenti/prepara-mappe.mjs` (istruzioni nel file).

## Problemi comuni

- **Dopo un aggiornamento vedo ancora i vecchi contenuti** → ricarica la pagina una seconda volta (F5 o Ctrl+F5).
- **Il pulsante di lettura ad alta voce non fa nulla** → manca una voce italiana nel sistema; controlla le impostazioni di lingua/voce del computer.
- **L'Editor mi dice che un identificatore è doppio** → ogni scheda deve avere un `id` diverso da tutte le altre dello stesso tipo, anche in file diversi.
- **Voglio ricominciare da zero con l'Editor** → nella barra gialla «bozza» premi *Scarta la bozza e ricomincia dai file originali*.
- **La stampa taglia la pagina** → nella finestra di stampa scegli formato A4, margini «Predefiniti» e togli «Intestazioni e piè di pagina» se non li vuoi.

## Licenza e crediti

Dati cartografici, caratteri e strumenti di terzi: vedi **[CREDITI.md](CREDITI.md)**. I testi sono originali, scritti per questa app.
