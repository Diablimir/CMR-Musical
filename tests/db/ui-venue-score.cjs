// Comprueba que mover una métrica del venue NO regresa a «Información», que la escala por niveles asigna el valor y que ya no existe «Vaciar datos».
const { chromium } = require('playwright');
const { execSync } = require('child_process');
const q = (sql) => execSync(`mariadb flamo_dev -N -e "${sql}"`).toString().trim();
const ok = [], bad = []; const check = (n, c, d = '') => (c ? ok : bad).push(n + (c ? '' : ` [${d}]`));
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('http://localhost:3000'); await p.waitForSelector('input[type=password]');
  await p.fill('input:not([type=password])', 'admin'); await p.fill('input[type=password]', 'Admin-Test-1'); await p.keyboard.press('Enter'); await p.waitForSelector('text=Inicio'); await p.waitForTimeout(1500);
  const home = await p.evaluate(() => document.body.innerText);
  check('ya no existe «Vaciar Datos»', !home.includes('Vaciar'));
  check('ya no existe el «Modo Dev» ni la pestaña «Esquema & DB»', !home.includes('Modo Dev') && !home.includes('Esquema'));
  await p.getByRole('button', { name: /^\s*Venues/ }).first().click(); await p.waitForTimeout(800);
  await p.getByText('Teatro Metr').first().click(); await p.waitForTimeout(800);
  await p.getByRole('button', { name: /Modalidades/ }).first().click(); await p.waitForTimeout(500);
  const rentBtn = (pct) => p.locator('div:has(> div > div > span:text-matches("^Rentabilidad"))').getByRole('button', { name: new RegExp('^' + pct + '%') }).first();
  await p.getByRole('button', { name: /^60%/ }).first().click(); await p.waitForTimeout(900);
  check('sigue en la pestaña Modalidades tras mover una métrica', (await p.evaluate(() => document.body.innerText)).includes('Modalidades & Score Comercial'));
  await p.getByRole('button', { name: /^80%/ }).first().click(); await p.waitForTimeout(900);
  check('segunda métrica tampoco te saca de la pestaña', (await p.evaluate(() => document.body.innerText)).includes('Modalidades & Score Comercial'));
  const txt = await p.evaluate(() => document.body.innerText);
  check('muestra la descripción del nivel (Rentabilidad 80 %)', txt.includes('Equipo de audio, ingeniero y venta de boletos'), '');
  // NP: dejar fuera la primera métrica (Rentabilidad)
  await p.getByRole('button', { name: /^NP/ }).first().click(); await p.waitForTimeout(900);
  const t2 = await p.evaluate(() => document.body.innerText);
  check('NP: aparece «No aplica» y sigues en Modalidades', t2.includes('NP · No aplica') && t2.includes('Modalidades & Score Comercial'));
  check('NP: el Score se reajusta con las demás (no es 0 por haber quitado una)', t2.includes('sobre 5 de 6 métricas'));
  await p.waitForTimeout(1500);
  check('NP: en la base es NULL', q("SELECT score_rentabilidad IS NULL FROM venues WHERE nombre LIKE 'Teatro Metr%'") === '1');
  await p.reload(); await p.waitForTimeout(1500);
  check('al recargar sigue como NP (no vuelve a 0)', q("SELECT score_rentabilidad IS NULL FROM venues WHERE nombre LIKE 'Teatro Metr%'") === '1');
  await p.screenshot({ path: '/tmp/venue-score.png', fullPage: false });
  check('sin errores JS', errs.length === 0, errs.join('|'));
  console.log(ok.map(x => '  ✓ ' + x).join('\n')); console.log(bad.length ? 'FALLOS:\n' + bad.join('\n') : 'Sin fallos'); await b.close();
})();
