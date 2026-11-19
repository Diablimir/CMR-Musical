// Legibilidad y uso táctil en teléfono (iPhone 13, 390 px): criterios medibles de buenas prácticas.
const { chromium, devices } = require('playwright');
const ok = [], bad = []; const check = (n, c, d = '') => (c ? ok : bad).push(n + (c ? '' : ` [${d}]`));
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:3000'); await p.waitForSelector('input[type=password]');
  await p.fill('input:not([type=password])', 'admin'); await p.fill('input[type=password]', 'Admin-Test-1'); await p.keyboard.press('Enter'); await p.waitForTimeout(3500);
  const audit = () => p.evaluate(() => {
    const vis = (e) => { const s = getComputedStyle(e); const r = e.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
    const tiny = []; document.querySelectorAll('body *').forEach(el => { if (!vis(el) || el.closest('.leaflet-container')) return; if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return; if (parseFloat(getComputedStyle(el).fontSize) < 13) tiny.push(el.textContent.trim().slice(0, 20)); });
    const ctrls = [...document.querySelectorAll('button, a, input:not([type=checkbox]):not([type=radio]):not([type=range]), select, textarea')].filter(e => vis(e) && !e.closest('.leaflet-container'));
    const smallTap = ctrls.filter(e => e.getBoundingClientRect().height < 40).map(e => (e.innerText || e.getAttribute('aria-label') || e.tagName).trim().slice(0, 20));
    const smallInput = [...document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=range]), select, textarea')].filter(e => vis(e) && parseFloat(getComputedStyle(e).fontSize) < 16).length;
    return { overflow: document.documentElement.scrollWidth > innerWidth, tiny, smallTap, smallInput };
  });
  const screens = [['Inicio', null], ['Venues', /Venues/], ['Artistas', /Artistas/]];
  for (const [name, nav] of screens) {
    if (nav) { await p.getByRole('button', { name: nav }).last().click(); await p.waitForTimeout(1500); }
    const a = await audit();
    check(`${name}: sin desplazamiento horizontal de la página`, !a.overflow);
    check(`${name}: ningún texto por debajo de 13 px`, a.tiny.length === 0, a.tiny.slice(0, 5).join(' | '));
    check(`${name}: botones y enlaces de al menos 40 px de alto`, a.smallTap.length === 0, a.smallTap.slice(0, 5).join(' | '));
    check(`${name}: campos de formulario a 16 px (sin zoom de iOS)`, a.smallInput === 0, String(a.smallInput));
  }
  // la barra inferior no tapa el final del contenido
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(400);
  const covered = await p.evaluate(() => { const nav = [...document.querySelectorAll('nav')].find(n => getComputedStyle(n).position === 'fixed' && n.getBoundingClientRect().height > 0); const f = document.querySelector('footer'); if (!nav || !f) return false; const r = document.createRange(); r.selectNodeContents(f); const rects = [...r.getClientRects()].filter(x => x.height > 0); const textBottom = Math.max(...rects.map(x => x.bottom)); return textBottom > nav.getBoundingClientRect().top; });
  check('el último contenido no queda debajo de la barra de navegación', !covered);
  check('sin errores JS', errs.length === 0, errs.join('|'));
  console.log(ok.map(x => '  ✓ ' + x).join('\n')); console.log(bad.length ? 'FALLOS:\n' + bad.join('\n') : 'Sin fallos'); await b.close();
})();
