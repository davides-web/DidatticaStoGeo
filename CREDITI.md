# Crediti e licenze

Questa app non carica nulla da internet mentre è in uso: tutti i dati e i caratteri qui elencati sono inclusi nel repository.

## Dati cartografici (cartella `mappe/`)

| Dato | Fonte | Licenza |
|---|---|---|
| Stati d'Europa e terre emerse (carte «Europa», «Impero di Carlo Magno», «Le scoperte geografiche», e lo sfondo delle carte dell'Italia) | [Natural Earth](https://www.naturalearthdata.com/) (scala 1:50 milioni e 1:110 milioni), distribuito in formato TopoJSON dal pacchetto npm [`world-atlas`](https://github.com/topojson/world-atlas) v2.0.2 | Dominio pubblico (Natural Earth); il pacchetto `world-atlas` è sotto licenza ISC |
| Confini delle regioni italiane | ISTAT, *Confini delle unità amministrative a fini statistici*, nella versione GeoJSON di [openpolis/geojson-italy](https://github.com/openpolis/geojson-italy) | **CC BY 4.0** – © ISTAT. Dati semplificati (meno punti) e riproiettati per questa app |
| Strumenti di elaborazione (solo per rigenerare le carte, non inclusi nell'app) | `d3-geo` (ISC), `topojson-client`, `topojson-server`, `topojson-simplify` (ISC) | ISC |

Le carte sono state elaborate con lo script `strumenti/prepara-mappe.mjs`: semplificazione dei contorni e conversione in tracciati SVG.

Dati disegnati a mano per questa app (**approssimati, a scopo didattico**): posizione dei capoluoghi di regione e delle capitali, percorso dei fiumi, posizione dei monti e dei vulcani, rotte dei navigatori, confini dei territori storici (Impero carolingio, Stato della Chiesa). Non vanno usati come carte di precisione.

## Caratteri (cartella `fonts/`)

| Carattere | Autore | Licenza |
|---|---|---|
| Atkinson Hyperlegible | Braille Institute of America, Inc. | SIL Open Font License 1.1 (`fonts/LICENSE-AtkinsonHyperlegible.txt`) |
| OpenDyslexic | Abbie Gonzalez | SIL Open Font License 1.1 (`fonts/LICENSE-OpenDyslexic.txt`) |

I file sono quelli del progetto [Fontsource](https://fontsource.org/) (sottoinsieme latino, formato WOFF2).

## Immagini e icone

Le «immagini» delle schede degli eventi sono **emoji** del sistema operativo: nessuna fotografia o illustrazione di terzi è inclusa. L'icona dell'app (`icons/icona.svg`) è stata disegnata per questo progetto.

## Testi

Tutti i testi (sintesi, versioni semplificate, domande, eventi, glossario) sono stati scritti appositamente per questa app, **senza copiare da manuali**. Vedi `DA_VERIFICARE.md` per i punti che il docente dovrebbe controllare.
