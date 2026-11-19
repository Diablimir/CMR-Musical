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
  check('ya no existe «Vaciar Datos»', !(await p.evaluate(() => document.body.innerText)).includes('Vaciar'));
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
  await p.waitForTimeout(1500);
  check('el valor se guardó en la base', q("SELECT score_rentabilidad FROM venues WHERE nombre LIKE 'Teatro Metr%'") === '80', q("SELECT score_rentabilidad FROM venues WHERE nombre LIKE 'Teatro Metr%'"));
  await p.screenshot({ path: '/tmp/venue-score.png', fullPage: false });
  check('sin errores JS', errs.length === 0, errs.join('|'));
  console.log(ok.map(x => '  ✓ ' + x).join('\n')); console.log(bad.length ? 'FALLOS:\n' + bad.join('\n') : 'Sin fallos'); await b.close();
})();
