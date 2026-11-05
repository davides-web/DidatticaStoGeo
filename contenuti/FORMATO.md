# Formato dei file di contenuto

Ogni file in `contenuti/` (tranne `indice.json`) è un **pacchetto** con fino a cinque elenchi.
Puoi modificarli a mano oppure con la pagina **Editor** dell'app (che esporta il JSON aggiornato).
I file elencati in `indice.json` sono quelli che l'app carica.

```json
{
  "argomenti": [ ... ], "domande": [ ... ], "eventi": [ ... ], "concetti": [ ... ], "glossario": [ ... ]
}
```

Ogni voce ha un `id` **unico in tutta l'app** (lettere minuscole, numeri e trattini) e, tranne gli argomenti, un campo `argomento` con l'`id` dell'argomento a cui appartiene.

## Argomento
| campo | significato |
|---|---|
| `id` | es. `feudalesimo` |
| `materia` | `storia`, `geografia` oppure `civica` |
| `classe` | `1` o `2` |
| `titolo`, `icona` | nome e emoji |
| `sintesi` | testo breve (paragrafi separati da una riga vuota, `\n\n`) |
| `semplificata` | versione ad alta leggibilità: frasi corte |
| `collegamenti` | (facoltativo) per l'educazione civica: `id` degli argomenti di storia/geografia collegati |

## Domande (`tipo`)
- `scelta`: `opzioni` (3-5 testi), `corretta` (numero dell'opzione giusta, 0 = la prima)
- `vf`: `corretta` = `true` oppure `false` (l'affermazione è nel `testo`)
- `completa`: `testo` con `___` al posto della parola, `risposta`, `accettate` (facoltativo: altre risposte valide), `distrattori` (facoltativo: parole sbagliate per la versione facilitata)
- `abbina`: `coppie` = `[["sinistra","destra"], ...]` (da 3 a 6)

In tutti i tipi: `testo`, `spiegazione` (mostrata dopo la risposta).

## Eventi (per le linee del tempo)
`anno` (numero intero, negativo per a.C., serve a ordinare), `data` (come si legge, es. "476 d.C."), `titolo`, `descrizione`, `icona` (emoji), `linea` (facoltativo: `europa`, `islam`, `bizantino`, `italia`, `mondo`… serve al confronto tra due linee).

## Concetti chiave (geografia, educazione civica)
`titolo`, `descrizione`, `icona`.

## Glossario
`termine`, `definizione` (semplice), `inglese` (traduzione), `definizione_en`, `esempio`.
