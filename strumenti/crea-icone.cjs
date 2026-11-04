// Crea le icone PNG a partire da icons/icona.svg (serve Playwright; si usa una volta sola).
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  const svg = fs.readFileSync('icons/icona.svg', 'utf8');
  for (const n of [192, 512]) {
    const p = await b.newPage({ viewport: { width: n, height: n } });
    await p.setContent(`<body style="margin:0">${svg.replace('<svg ', `<svg width="${n}" height="${n}" `)}</body>`);
    await p.screenshot({ path: `icons/icona-${n}.png` });
  }
  await b.close();
})();
