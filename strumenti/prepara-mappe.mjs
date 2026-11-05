// Prepara le carte mute (cartella mappe/) a partire da dati cartografici con licenza libera.
// Si usa UNA VOLTA, quando si vogliono rigenerare le carte; l'app non lo richiede per funzionare.
//
//   npm install --no-save world-atlas@2.0.2 topojson-client topojson-server topojson-simplify d3-geo
//   node strumenti/prepara-mappe.mjs percorso/limits_IT_regions.geojson
//
// Fonti (vedi CREDITI.md):
//  - Natural Earth (dominio pubblico), tramite il pacchetto npm "world-atlas": Stati d'Europa e terre emerse
//  - Confini delle regioni italiane ISTAT (CC BY 4.0), nella versione di openpolis/geojson-italy
//  - Fiumi, monti, capoluoghi, capitali e rotte: coordinate approssimate scritte a mano qui sotto
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { feature, merge } from 'topojson-client';
import { topology } from 'topojson-server';
import { presimplify, simplify, quantile } from 'topojson-simplify';
import { geoPath, geoConicConformal, geoNaturalEarth1, geoArea } from 'd3-geo';

const require = createRequire(import.meta.url);
const file = process.argv[2];
if (!file) { console.error('Indica il file GeoJSON delle regioni italiane (limits_IT_regions.geojson)'); process.exit(1); }
mkdirSync('mappe', { recursive: true });

const r1 = (n) => Math.round(n * 10) / 10;
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Semplifica un insieme di geometrie condividendo i confini (percentuale di punti da togliere). */
function semplifica(collezione, quota) {
  let t = topology({ x: collezione });
  t = presimplify(t);
  t = simplify(t, quantile(t, 1 - quota)); // quantile(p) = quota di punti da TENERE
  return { topo: t, fc: feature(t, t.objects.x) };
}

/** Punto dove scrivere il nome di un'area: il centro del poligono più grande (ignora isole e territori lontani). */
function etichetta(path, f) {
  let g = f.geometry || f;
  if (g.type === 'MultiPolygon') {
    const migliore = g.coordinates.reduce((a, b) => (geoArea({ type: 'Polygon', coordinates: b }) > geoArea({ type: 'Polygon', coordinates: a }) ? b : a));
    g = { type: 'Polygon', coordinates: migliore };
  }
  const [x, y] = path.centroid(g);
  return Number.isFinite(x) ? [r1(x), r1(y)] : undefined;
}

/** Curva morbida (Catmull-Rom → Bézier) per fiumi e rotte. punti = [[x,y],...] */
function curva(p) {
  if (p.length < 3) return 'M' + p.map(([x, y]) => `${r1(x)} ${r1(y)}`).join('L');
  let d = `M${r1(p[0][0])} ${r1(p[0][1])}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${r1(c1[0])} ${r1(c1[1])} ${r1(c2[0])} ${r1(c2[1])} ${r1(p2[0])} ${r1(p2[1])}`;
  }
  return d;
}
const punto = (proj, lon, lat) => { const [x, y] = proj([lon, lat]); return [r1(x), r1(y)]; };
const linea = (proj, coords) => curva(coords.map(([lon, lat]) => proj([lon, lat])));

/** Poligono storico disegnato a mano (lon/lat): archi sferici, corretto il verso se serve. */
function poligono(proj, path, anello, W, H) {
  const chiudi = [...anello, anello[0]];
  for (const ring of [chiudi, [...chiudi].reverse()]) {
    const g = { type: 'Polygon', coordinates: [ring] };
    const [[x0, y0], [x1, y1]] = path.bounds(g);
    if ((x1 - x0) * (y1 - y0) < W * H * 0.95) return path(g);
  }
  throw new Error('Poligono non valido');
}

/* ===================== DATI A MANO ===================== */
const REGIONI_NOMI = { "Valle d'Aosta/Vallée d'Aoste": "Valle d'Aosta", 'Trentino-Alto Adige/Südtirol': 'Trentino-Alto Adige' };
const CAPOLUOGHI = [
  ['Torino', 'Piemonte', 7.69, 45.07], ['Aosta', "Valle d'Aosta", 7.32, 45.74], ['Milano', 'Lombardia', 9.19, 45.46],
  ['Trento', 'Trentino-Alto Adige', 11.12, 46.07], ['Venezia', 'Veneto', 12.32, 45.44], ['Trieste', 'Friuli-Venezia Giulia', 13.78, 45.65],
  ['Genova', 'Liguria', 8.93, 44.41], ['Bologna', 'Emilia-Romagna', 11.34, 44.49], ['Firenze', 'Toscana', 11.25, 43.77],
  ['Perugia', 'Umbria', 12.39, 43.11], ['Ancona', 'Marche', 13.52, 43.62], ['Roma', 'Lazio', 12.5, 41.9],
  ["L'Aquila", 'Abruzzo', 13.4, 42.35], ['Campobasso', 'Molise', 14.66, 41.56], ['Napoli', 'Campania', 14.27, 40.85],
  ['Bari', 'Puglia', 16.87, 41.12], ['Potenza', 'Basilicata', 15.8, 40.64], ['Catanzaro', 'Calabria', 16.59, 38.91],
  ['Palermo', 'Sicilia', 13.36, 38.12], ['Cagliari', 'Sardegna', 9.12, 39.22],
];
const FIUMI = [
  ['Po', 'Il fiume più lungo d\'Italia: attraversa la Pianura Padana', [[7.1, 44.7], [7.69, 45.08], [8.45, 45.13], [9.15, 45.08], [9.7, 45.05], [10.03, 45.12], [10.58, 44.9], [11.14, 45.07], [11.6, 44.95], [12.2, 44.98], [12.5, 44.95]]],
  ['Adige', 'Nasce in Alto Adige e passa da Bolzano, Trento e Verona', [[10.5, 46.83], [11.16, 46.67], [11.35, 46.5], [11.12, 46.07], [11.04, 45.89], [10.99, 45.44], [11.3, 45.19], [12.08, 45.14], [12.3, 45.13]]],
  ['Tevere', 'Nasce in Appennino e attraversa Roma', [[12.07, 43.8], [12.14, 43.57], [12.4, 43.0], [12.39, 42.46], [12.47, 41.9], [12.28, 41.73]]],
  ['Arno', 'Passa da Firenze e Pisa', [[11.7, 43.87], [11.88, 43.45], [11.25, 43.77], [10.95, 43.72], [10.4, 43.72], [10.28, 43.68]]],
  ['Piave', 'Il «fiume sacro alla Patria» della Grande Guerra', [[12.6, 46.62], [12.22, 46.14], [12.05, 45.78], [12.3, 45.7], [12.72, 45.5]]],
  ['Volturno', 'Il principale fiume del Sud Italia continentale', [[14.05, 41.62], [14.2, 41.2], [13.92, 41.03]]],
];
const MONTI = [
  ['Monte Bianco', 'La vetta più alta delle Alpi (circa 4.800 m)', 6.865, 45.833], ['Monte Rosa', 'Seconda vetta delle Alpi', 7.867, 45.937],
  ['Cervino', 'Inconfondibile punta piramidale', 7.658, 45.976], ['Marmolada', 'La «regina delle Dolomiti»', 11.85, 46.434],
  ['Monviso', 'Dalle sue pendici nasce il Po', 7.092, 44.667], ['Gran Sasso', 'Corno Grande: la vetta più alta degli Appennini (2.912 m)', 13.566, 42.469],
  ['Vesuvio', 'Vulcano vicino a Napoli', 14.426, 40.821], ['Etna', 'Vulcano attivo più alto d\'Europa', 14.995, 37.751], ['Stromboli', 'Vulcano delle isole Eolie', 15.213, 38.789],
];
const NOMI_STATI = { Albania: 'Albania', Andorra: 'Andorra', Austria: 'Austria', Belarus: 'Bielorussia', Belgium: 'Belgio', 'Bosnia and Herz.': 'Bosnia ed Erzegovina', Bulgaria: 'Bulgaria', Croatia: 'Croazia', Cyprus: 'Cipro', Czechia: 'Repubblica Ceca', Denmark: 'Danimarca', Estonia: 'Estonia', Finland: 'Finlandia', France: 'Francia', Germany: 'Germania', Greece: 'Grecia', Hungary: 'Ungheria', Iceland: 'Islanda', Ireland: 'Irlanda', Italy: 'Italia', Kosovo: 'Kosovo', Latvia: 'Lettonia', Liechtenstein: 'Liechtenstein', Lithuania: 'Lituania', Luxembourg: 'Lussemburgo', Malta: 'Malta', Moldova: 'Moldavia', Monaco: 'Monaco', Montenegro: 'Montenegro', Netherlands: 'Paesi Bassi', Macedonia: 'Macedonia del Nord', Norway: 'Norvegia', Poland: 'Polonia', Portugal: 'Portogallo', Romania: 'Romania', Russia: 'Russia', 'San Marino': 'San Marino', Serbia: 'Serbia', Slovakia: 'Slovacchia', Slovenia: 'Slovenia', Spain: 'Spagna', Sweden: 'Svezia', Switzerland: 'Svizzera', Ukraine: 'Ucraina', 'United Kingdom': 'Regno Unito', Vatican: 'Città del Vaticano' };
const PICCOLI = new Set(['Andorra', 'Liechtenstein', 'Malta', 'Monaco', 'San Marino', 'Vatican', 'Luxembourg', 'Cyprus', 'Kosovo']);
const CAPITALI = { Portugal: ['Lisbona', -9.14, 38.72], Spain: ['Madrid', -3.7, 40.42], France: ['Parigi', 2.35, 48.86], 'United Kingdom': ['Londra', -0.13, 51.51], Ireland: ['Dublino', -6.26, 53.35], Belgium: ['Bruxelles', 4.35, 50.85], Netherlands: ['Amsterdam', 4.9, 52.37], Luxembourg: ['Lussemburgo', 6.13, 49.61], Germany: ['Berlino', 13.4, 52.52], Switzerland: ['Berna', 7.45, 46.95], Austria: ['Vienna', 16.37, 48.21], Italy: ['Roma', 12.5, 41.9], Czechia: ['Praga', 14.44, 50.08], Poland: ['Varsavia', 21.01, 52.23], Hungary: ['Budapest', 19.04, 47.5], Slovakia: ['Bratislava', 17.11, 48.15], Slovenia: ['Lubiana', 14.51, 46.06], Croatia: ['Zagabria', 15.98, 45.81], 'Bosnia and Herz.': ['Sarajevo', 18.41, 43.86], Serbia: ['Belgrado', 20.45, 44.79], Montenegro: ['Podgorica', 19.26, 42.44], Albania: ['Tirana', 19.82, 41.33], Macedonia: ['Skopje', 21.43, 42.0], Bulgaria: ['Sofia', 23.32, 42.7], Romania: ['Bucarest', 26.1, 44.43], Greece: ['Atene', 23.73, 37.98], Moldova: ['Chisinau', 28.86, 47.01], Ukraine: ['Kiev', 30.52, 50.45], Belarus: ['Minsk', 27.57, 53.9], Lithuania: ['Vilnius', 25.28, 54.69], Latvia: ['Riga', 24.11, 56.95], Estonia: ['Tallinn', 24.75, 59.44], Finland: ['Helsinki', 24.94, 60.17], Sweden: ['Stoccolma', 18.07, 59.33], Norway: ['Oslo', 10.75, 59.91], Denmark: ['Copenaghen', 12.57, 55.68], Iceland: ['Reykjavík', -21.94, 64.15], Russia: ['Mosca', 37.62, 55.76], Cyprus: ['Nicosia', 33.36, 35.17], Malta: ['La Valletta', 14.51, 35.9], Liechtenstein: ['Vaduz', 9.52, 47.14], Monaco: ['Monaco', 7.42, 43.74], 'San Marino': ['San Marino', 12.45, 43.94], Vatican: ['Città del Vaticano', 12.45, 41.9], Andorra: ['Andorra la Vella', 1.52, 42.51], Kosovo: ['Pristina', 21.17, 42.67] };

/* ===================== EUROPA / TERRE EMERSE ===================== */
const mondo50 = JSON.parse(readFileSync(require.resolve('world-atlas/countries-50m.json'), 'utf8'));
const paesiFC = feature(mondo50, mondo50.objects.countries);
// Si tengono solo i Paesi che interessano la zona (per non portarsi dietro tutto il mondo)
const ZONA = (f) => { const [[a, b], [c, d]] = geoPath().bounds(f); return c > -40 && a < 70 && d > 20 && b < 85; };
const vicini = { type: 'FeatureCollection', features: paesiFC.features.filter(ZONA) };
const { topo: topoEu, fc: euFC } = semplifica(vicini, 0.9);

function disegnaEuropa(proj, W, H, quota = 'tutto') {
  proj.clipExtent([[-500, -500], [W + 500, H + 500]]);
  const path = geoPath(proj).digits(1);
  return { path };
}

// ---- Europa politica ----
{
  const W = 1000, H = 860;
  const proj = geoConicConformal().rotate([-14, 0]).center([0, 52]).parallels([40, 62]).scale(930).translate([W / 2 + 40, H / 2 + 40]);
  const { path } = disegnaEuropa(proj, W, H);
  const stati = [], sfondo = [], capitali = [];
  for (const f of euFC.features) {
    const nome = f.properties.name; const d = path(f); if (!d) continue;
    if (NOMI_STATI[nome]) {
      stati.push({ id: slug(NOMI_STATI[nome]), nome: NOMI_STATI[nome], d, label: etichetta(path, f), ...(PICCOLI.has(nome) ? { quiz: false } : {}) });
      const c = CAPITALI[nome];
      if (c) {
        const [x, y] = punto(proj, c[1], c[2]);
        if (x > 0 && x < W && y > 0 && y < H) capitali.push({ id: 'cap-' + slug(c[0]), nome: c[0], x, y, info: `Capitale: ${NOMI_STATI[nome]}`, domanda: `Trova la capitale: ${c[0]}`, ...(PICCOLI.has(nome) && !['Cyprus', 'Kosovo', 'Luxembourg'].includes(nome) ? { quiz: false } : {}) });
      }
    } else sfondo.push({ d });
  }
  const mappa = { id: 'europa', titolo: 'Europa: Stati e capitali', descrizione: 'Clicca su uno Stato o su una capitale per leggerne il nome.', viewBox: [0, 0, W, H],
    sfondo, livelli: [{ id: 'stati', nome: 'Stati', tipo: 'aree', elementi: stati }, { id: 'capitali', nome: 'Capitali', tipo: 'punti', elementi: capitali }] };
  writeFileSync('mappe/europa.json', JSON.stringify(mappa));
  console.log('europa.json', stati.length, 'Stati', capitali.length, 'capitali');
}

// ---- Terra emersa semplificata (per le carte storiche) ----
function terraEmersa(path) {
  const unione = merge(topoEu, topoEu.objects.x.geometries);
  return path({ type: 'Feature', geometry: unione });
}

// ---- Impero di Carlo Magno ----
{
  const W = 1000, H = 780;
  const proj = geoConicConformal().rotate([-12, 0]).center([0, 46]).parallels([38, 54]).scale(1250).translate([W / 2 - 40, H / 2 + 20]);
  const { path } = disegnaEuropa(proj, W, H);
  const impero = [[-1.9, 43.7], [-8, 46.5], [-7, 48.5], [-3, 50.0], [1.0, 50.4], [1.45, 50.85], [2.3, 51.3], [3.5, 51.8], [5.5, 53.9], [8.0, 54.35], [10.0, 54.35], [11.0, 54.4], [10.9, 53.9], [10.9, 53.5], [11.6, 52.2], [12.0, 51.3], [12.4, 50.5], [12.9, 49.7], [13.8, 48.8], [15.6, 48.6], [16.9, 47.8], [17.3, 46.5], [16.2, 45.9], [15.0, 45.2], [14.3, 45.4], [13.0, 44.7], [14.0, 43.4], [14.9, 42.45], [13.4, 41.3], [12.5, 40.8], [9.9, 41.8], [9.5, 41.31], [8.0, 41.31], [6.0, 42.0], [3.4, 41.9], [2.5, 41.1], [1.4, 41.4], [0.8, 42.0], [-0.4, 42.3], [-1.6, 42.7]];
  const chiesa = [[11.4, 42.0], [11.4, 42.9], [12.3, 43.5], [12.0, 44.7], [12.9, 44.1], [13.8, 43.4], [14.0, 42.7], [13.3, 41.9], [13.4, 41.3], [12.6, 40.9]];
  const luoghi = [['Aquisgrana', 'Capitale dell\'impero di Carlo Magno', 6.08, 50.78], ['Parigi', 'Città dei Franchi sulla Senna', 2.35, 48.86], ['Roma', 'Qui Carlo Magno fu incoronato imperatore (800)', 12.5, 41.9],
    ['Pavia', 'Capitale del regno longobardo, conquistata nel 774', 9.16, 45.19], ['Ravenna', 'Antica capitale bizantina in Italia', 12.2, 44.42], ['Barcellona', 'Capoluogo della Marca Hispanica', 2.17, 41.39],
    ['Roncisvalle', 'Qui nel 778 la retroguardia di Carlo fu sconfitta dai Baschi', -1.32, 43.01], ['Verdun', 'Nell\'843 il trattato divise l\'impero', 5.39, 49.16],
    ['Cordova', 'Capitale dell\'Emirato omayyade di Spagna', -4.78, 37.89], ['Costantinopoli', 'Capitale dell\'Impero bizantino', 28.98, 41.01], ['Benevento', 'Ducato longobardo del Sud, rimasto indipendente', 14.78, 41.13]];
  const mappa = { id: 'carlo-magno', titolo: 'L\'impero di Carlo Magno', argomento: 'franchi-carlo-magno', descrizione: 'Carta storica semplificata: i confini sono approssimati.', viewBox: [0, 0, W, H], vistaIniziale: [60, 40, 620, 500],
    sfondo: [{ d: terraEmersa(path), terra: true }],
    livelli: [
      { id: 'territori', nome: 'Territori', tipo: 'aree', elementi: [
        { id: 'impero', nome: 'Impero carolingio (814)', d: poligono(proj, path, impero, W, H), label: punto(proj, 6, 49.2), clip: true, colore: 'a', info: 'L\'impero alla morte di Carlo Magno, approssimato.', domanda: 'Trova l\'Impero carolingio' },
        { id: 'chiesa', nome: 'Stato della Chiesa', d: poligono(proj, path, chiesa, W, H), label: punto(proj, 12.6, 42.6), clip: true, colore: 'b', info: 'Nato con la Donazione di Pipino (756).', domanda: 'Trova lo Stato della Chiesa' }] },
      { id: 'luoghi', nome: 'Luoghi', tipo: 'punti', elementi: luoghi.map(([nome, info, lon, lat]) => { const [x, y] = punto(proj, lon, lat); return { id: slug(nome), nome, info, x, y }; }) }] };
  writeFileSync('mappe/carlo-magno.json', JSON.stringify(mappa));
  console.log('carlo-magno.json');
}

/* ===================== ITALIA ===================== */
{
  const W = 600, H = 740;
  const grezzo = JSON.parse(readFileSync(file, 'utf8'));
  const { fc: regioni } = semplifica({ type: 'FeatureCollection', features: grezzo.features.map((f) => ({ type: 'Feature', properties: { nome: REGIONI_NOMI[f.properties.reg_name] || f.properties.reg_name }, geometry: f.geometry })) }, 0.9);
  const proj = geoConicConformal().rotate([-12.5, 0]).center([0, 42]).parallels([37, 46]);
  proj.fitExtent([[25, 20], [W - 25, H - 20]], regioni);
  proj.clipExtent([[-500, -500], [W + 500, H + 500]]);
  const path = geoPath(proj).digits(1);
  const elRegioni = regioni.features.map((f) => ({ id: slug(f.properties.nome), nome: f.properties.nome, d: path(f), label: etichetta(path, f), regione: f.properties.nome }));
  const cap = CAPOLUOGHI.map(([nome, reg, lon, lat]) => { const [x, y] = punto(proj, lon, lat); return { id: 'cap-' + slug(nome), nome, x, y, info: `Capoluogo: ${reg}`, domanda: `Trova il capoluogo: ${nome}` }; });
  const sfondo = [{ d: terraEmersa(path), terra: true }];
  const base = { sfondo, viewBox: [0, 0, W, H] };
  const italia = { id: 'italia', titolo: 'Italia: regioni, capoluoghi, fiumi e monti', argomento: 'italia-fisica-regioni', descrizione: 'Clicca su una regione, un capoluogo, un fiume o un monte.', ...base,
    livelli: [
      { id: 'regioni', nome: 'Regioni', tipo: 'aree', elementi: elRegioni },
      { id: 'capoluoghi', nome: 'Capoluoghi', tipo: 'punti', elementi: cap },
      { id: 'fiumi', nome: 'Fiumi', tipo: 'linee', elementi: FIUMI.map(([nome, info, pts]) => ({ id: slug(nome), nome, info, d: linea(proj, pts), label: punto(proj, ...pts[Math.floor(pts.length / 2)]), domanda: `Trova il fiume: ${nome}` })) },
      { id: 'monti', nome: 'Monti e vulcani', tipo: 'punti', elementi: MONTI.map(([nome, info, lon, lat]) => { const [x, y] = punto(proj, lon, lat); return { id: slug(nome), nome, info, x, y, simbolo: 'monte', domanda: `Trova: ${nome}` }; }) }] };
  writeFileSync('mappe/italia.json', JSON.stringify(italia));
  console.log('italia.json');

  // ---- Italia dei Comuni: le regioni sono raggruppate in "territori" (semplificazione didattica) ----
  const dReg = Object.fromEntries(elRegioni.map((r) => [r.id, r.d]));
  const gruppo = (ids) => ids.map((i) => dReg[i]).join('');
  const lab = (id) => elRegioni.find((r) => r.id === id).label;
  const comuni = [['Milano', 9.19, 45.46, 'Il più grande dei Comuni lombardi'], ['Venezia', 12.32, 45.44, 'Repubblica marinara'], ['Genova', 8.93, 44.41, 'Repubblica marinara'], ['Pisa', 10.4, 43.72, 'Repubblica marinara'],
    ['Firenze', 11.25, 43.77, 'Comune ricco di mercanti e banchieri'], ['Bologna', 11.34, 44.49, 'Sede di una delle prime università'], ['Siena', 11.33, 43.32, 'Comune toscano rivale di Firenze'], ['Verona', 10.99, 45.44, 'Comune veneto'],
    ['Legnano', 8.92, 45.6, 'Qui nel 1176 la Lega Lombarda sconfisse il Barbarossa'], ['Pontida', 9.57, 45.74, 'Secondo la tradizione, luogo del giuramento della Lega Lombarda'], ['Canossa', 10.45, 44.58, 'Qui nel 1077 Enrico IV chiese perdono al Papa'],
    ['Roma', 12.5, 41.9, 'Sede del Papa'], ['Napoli', 14.27, 40.85, 'Città del Regno di Sicilia'], ['Palermo', 13.36, 38.12, 'Capitale del Regno di Sicilia'], ['Amalfi', 14.6, 40.63, 'Repubblica marinara']];
  const storica = { id: 'italia-comuni', titolo: 'L\'Italia dei Comuni (XII secolo)', argomento: 'comuni', descrizione: 'Carta storica semplificata: i territori sono approssimati con le regioni attuali.', ...base,
    livelli: [
      { id: 'territori', nome: 'Territori', tipo: 'aree', elementi: [
        { id: 'comuni', nome: 'Italia dei Comuni', d: gruppo(['piemonte', 'lombardia', 'veneto', 'liguria', 'emilia-romagna', 'toscana']), label: lab('emilia-romagna'), colore: 'a', info: 'Le città del Centro-Nord si governano da sole.', domanda: 'Trova l\'area dei Comuni del Centro-Nord' },
        { id: 'chiesa', nome: 'Stato della Chiesa', d: gruppo(['lazio', 'umbria', 'marche']), label: lab('umbria'), colore: 'b', info: 'Territori governati dal Papa.', domanda: 'Trova lo Stato della Chiesa' },
        { id: 'regno-sicilia', nome: 'Regno di Sicilia', d: gruppo(['abruzzo', 'molise', 'campania', 'puglia', 'basilicata', 'calabria', 'sicilia']), label: lab('basilicata'), colore: 'c', info: 'Regno dei Normanni e poi degli Svevi (Federico II).', domanda: 'Trova il Regno di Sicilia' },
        { id: 'altri', nome: 'Altri territori dell\'Impero', d: gruppo(['valle-d-aosta', 'trentino-alto-adige', 'friuli-venezia-giulia']), label: lab('trentino-alto-adige'), colore: 'd', info: 'Territori di confine legati all\'Impero.', domanda: 'Trova i territori di confine dell\'Impero' },
        { id: 'sardegna', nome: 'Sardegna (Giudicati)', d: gruppo(['sardegna']), label: lab('sardegna'), colore: 'e', info: 'Divisa in quattro giudicati.', domanda: 'Trova la Sardegna dei Giudicati' }] },
      { id: 'luoghi', nome: 'Città e luoghi', tipo: 'punti', elementi: comuni.map(([nome, lon, lat, info]) => { const [x, y] = punto(proj, lon, lat); return { id: slug(nome), nome, info, x, y }; }) }] };
  writeFileSync('mappe/italia-comuni.json', JSON.stringify(storica));
  console.log('italia-comuni.json');
}

/* ===================== SCOPERTE GEOGRAFICHE ===================== */
{
  const W = 1000, H = 520;
  const mondo = JSON.parse(readFileSync(require.resolve('world-atlas/land-110m.json'), 'utf8'));
  const terra = feature(mondo, mondo.objects.land);
  const proj = geoNaturalEarth1().fitExtent([[5, 5], [W - 5, H - 5]], { type: 'Sphere' });
  const path = geoPath(proj).digits(1);
  const ROTTE = [
    ['Cristoforo Colombo (1492)', 'Dalla Spagna ai Caraibi, credendo di arrivare in Asia', 'a', [[[-6.9, 37.2], [-17.1, 28.1], [-40, 26], [-60, 25], [-74.5, 24.1]]]],
    ['Vasco da Gama (1497-1498)', 'Dal Portogallo all\'India, passando dal Capo di Buona Speranza', 'b', [[[-9.1, 38.7], [-23.5, 15], [-15, -10], [-5, -30], [18.5, -35.5], [32, -28], [40.7, -15], [40.1, -3.2], [60, 5], [75.8, 11.3]]]],
    ['Ferdinando Magellano (1519-1522)', 'Il primo giro del mondo: parte Magellano, lo completa Elcano', 'c', [[[-6.35, 36.8], [-16.3, 28.3], [-23.5, 15], [-35, 0], [-43.2, -22.9], [-56.5, -35], [-67.7, -49.3], [-70, -53.3], [-76, -50], [-110, -30], [-150, -15], [-180, -8]], [[180, -8], [144.7, 13.4], [123.9, 10.3], [127.4, 0.7], [124, -9.5], [100, -20], [60, -30], [18.5, -35.5], [0, -20], [-23.5, 15], [-6.35, 36.8]]]],
    ['Giovanni Caboto (1497)', 'Dall\'Inghilterra alle coste del Nord America (Terranova)', 'd', [[[-2.6, 51.45], [-20, 52], [-40, 50], [-52.7, 47.5]]]],
  ];
  const LUOGHI = [['Lisbona', 'Partenza di Vasco da Gama', -9.14, 38.72], ['Siviglia', 'Porto di partenza di Magellano', -5.98, 37.39], ['Palos', 'Porto da cui partì Colombo', -6.89, 37.2], ['San Salvador', 'Prima isola raggiunta da Colombo (12 ottobre 1492)', -74.5, 24.1],
    ['Capo di Buona Speranza', 'Estremità meridionale dell\'Africa', 18.47, -34.36], ['Calicut', 'Città dell\'India raggiunta da Vasco da Gama nel 1498', 75.78, 11.25], ['Stretto di Magellano', 'Passaggio tra Atlantico e Pacifico', -70, -53.5],
    ['Tenochtitlan', 'Capitale azteca (oggi Città del Messico), conquistata da Cortés nel 1521', -99.13, 19.43], ['Cusco', 'Capitale dell\'impero inca', -71.97, -13.53], ['Filippine', 'Dove morì Magellano nel 1521', 123.9, 10.3], ['Terranova', 'Raggiunta da Caboto nel 1497', -52.7, 47.5]];
  const mappa = { id: 'scoperte-geografiche', titolo: 'Le scoperte geografiche', argomento: 'scoperte-geografiche', descrizione: 'Le grandi rotte dei navigatori del Quattrocento e Cinquecento (semplificate).', viewBox: [0, 0, W, H],
    sfondo: [{ d: path(terra), terra: true }],
    livelli: [
      { id: 'rotte', nome: 'Rotte', tipo: 'linee', elementi: ROTTE.map(([nome, info, colore, segmenti]) => ({ id: slug(nome), nome, info, colore, d: segmenti.map((s) => linea(proj, s)).join(''), label: punto(proj, ...segmenti[0][Math.floor(segmenti[0].length / 2)]), domanda: `Trova la rotta: ${nome}` })) },
      { id: 'luoghi', nome: 'Luoghi', tipo: 'punti', elementi: LUOGHI.map(([nome, info, lon, lat]) => { const [x, y] = punto(proj, lon, lat); return { id: slug(nome), nome, info, x, y }; }) }] };
  writeFileSync('mappe/scoperte-geografiche.json', JSON.stringify(mappa));
  console.log('scoperte-geografiche.json');
}
