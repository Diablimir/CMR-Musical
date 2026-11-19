// Con la política de contenido (CSP) de producción activa, recorre la aplicación y comprueba que NADA se bloquee.
// Requiere: build de producción servido en :4173 (vite preview) con proxy a la API.
const { chromium } = require('playwright');
const fs = require('fs');
const CSP = fs.readFileSync('/tmp/csp.txt', 'utf8').trim();
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } });
  await ctx.route('http://127.0.0.1:4173/', async (route) => { const r = await route.fetch(); await route.fulfill({ response: r, headers: { ...r.headers(), 'content-security-policy': CSP } }); });
  const p = await ctx.newPage(); const viol = [], errs = [];
  p.on('console', m => { if (/Content Security Policy|violat/i.test(m.text())) viol.push(m.text().slice(0, 200)); });
  p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => document.addEventListener('securitypolicyviolation', e => console.error('CSP violación: ' + e.violatedDirective + ' ' + e.blockedURI)));
  await p.goto('http://127.0.0.1:4173/'); await p.waitForSelector('input[type=password]');
  await p.fill('input:not([type=password])', 'admin'); await p.fill('input[type=password]', 'Admin-Test-1'); await p.keyboard.press('Enter'); await p.waitForTimeout(3000);
  for (const t of ['Venues', 'Proveedores', 'Contactos', 'Producción', 'Artistas', 'Finanzas', 'Legal', 'Usuarios', 'Inicio']) { await p.getByRole('button', { name: new RegExp('^\\s*' + t) }).first().click().catch(() => {}); await p.waitForTimeout(900); }
  await p.getByRole('button', { name: /^\s*Artistas/ }).first().click(); await p.waitForTimeout(700);
  await p.locator('text=/QA|Vladimir|Uno/ >> visible=true').first().click().catch(() => {}); await p.waitForTimeout(600);
  await p.getByRole('button', { name: /Audiencia/ }).first().click().catch(() => {}); await p.waitForTimeout(1500);
  await p.getByRole('button', { name: /^\s*Inicio/ }).first().click(); await p.waitForTimeout(2500);
  // la política debe BLOQUEAR una inyección: un manejador inline y un script inline no deben ejecutarse
  const attackViol = []; p.on('console', m => { if (/CSP violación/.test(m.text())) attackViol.push(m.text()); });
  await p.evaluate(() => { document.body.insertAdjacentHTML('beforeend', '<img src="x" onerror="window.__xss1=1">'); const sc = document.createElement('script'); sc.textContent = 'window.__xss2=1'; document.body.appendChild(sc); });
  await p.waitForTimeout(800);
  const xss = await p.evaluate(() => ({ a: window.__xss1 === 1, b: window.__xss2 === 1 }));
  console.log('inyección bloqueada por la CSP:', !xss.a && !xss.b, '(manejador inline:', xss.a ? 'EJECUTÓ' : 'bloqueado', '· script inline:', xss.b ? 'EJECUTÓ' : 'bloqueado', ')');
  if (xss.a || xss.b) { console.log('FALLO: la CSP no bloqueó la inyección'); await b.close(); process.exit(1); }
  viol.length = 0;
  const hasMap = await p.locator('.leaflet-container').count(); const inline = await p.evaluate(() => document.querySelectorAll('script:not([src])').length);
  const loaded = await p.evaluate(() => document.querySelector('main') !== null);
  console.log('mapa:', hasMap, '· scripts inline:', inline, '· app cargada:', loaded, '· violaciones CSP:', viol.length, '· errores JS:', errs.length);
  if (viol.length) console.log(viol.slice(0, 5).join('\n'));
  await b.close(); process.exit(viol.length || errs.length || !loaded ? 1 : 0);
})();
