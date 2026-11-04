// Piccolo aiuto per costruire elementi HTML da JavaScript, senza librerie.
// Esempio: h('button', { class: 'btn', onclick: () => alert('ciao') }, 'Premi')

export function h(tag, attrs = {}, ...figli) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'value') el.value = v;
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  aggiungi(el, figli);
  return el;
}

/** Aggiunge figli (testi, nodi o elenchi annidati) a un elemento. */
export function aggiungi(el, figli) {
  for (const f of figli.flat(Infinity)) {
    if (f === null || f === undefined || f === false) continue;
    el.append(f instanceof Node ? f : document.createTextNode(String(f)));
  }
  return el;
}

/** Svuota un elemento e ci mette dentro i nuovi figli. */
export function sostituisci(el, ...figli) {
  el.replaceChildren();
  return aggiungi(el, figli);
}

/** Crea un elemento SVG (namespace corretto). */
export function svg(tag, attrs = {}, ...figli) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v);
  }
  aggiungi(el, figli);
  return el;
}

/** Scarica un file di testo (usato dall'Editor per esportare i JSON). */
export function scaricaTesto(nomeFile, testo, tipo = 'application/json') {
  const url = URL.createObjectURL(new Blob([testo], { type: `${tipo};charset=utf-8` }));
  const a = h('a', { href: url, download: nomeFile });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
