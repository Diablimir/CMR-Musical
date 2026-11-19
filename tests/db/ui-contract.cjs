const { chromium } = require('playwright');
const { execSync } = require('child_process');
const q = (sql) => execSync(`mariadb flamo_dev -N -e "${sql}"`).toString().trim();
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport:{width:1366,height:900} }); const p = await ctx.newPage();
  const errs=[]; p.on('pageerror', e=>errs.push(e.message)); p.on('dialog', d=>d.accept());
  await p.goto('http://localhost:3000'); await p.waitForSelector('input[type=password]');
  await p.fill('input:not([type=password])','admin'); await p.fill('input[type=password]','Admin-Test-1'); await p.keyboard.press('Enter'); await p.waitForSelector('text=Inicio'); await p.waitForTimeout(1500);
  await p.getByRole('button',{name:/^\s*Legal/}).first().click(); await p.waitForTimeout(600);
  await p.getByRole('button',{name:/Subir Nuevo Contrato/}).first().click(); await p.waitForTimeout(400);
  await p.fill('input[placeholder^="Ej. Contrato de Booking"]','QA Contrato multi');
  const boxes = p.locator('input[type=checkbox]'); const n = await boxes.count(); console.log('checkboxes', n);
  await boxes.nth(0).check(); await boxes.nth(1).check();   // 2 artistas
  await p.getByRole('button',{name:/Confirmar y Guardar/}).click(); await p.waitForTimeout(2000);
  console.log('db', q("SELECT (SELECT COUNT(*) FROM contrato_artistas), (SELECT COUNT(*) FROM contratos WHERE titulo='QA Contrato multi')"));
  const dd = await p.evaluate(()=>fetch('/api/data.php',{headers:{'X-Requested-With':'flamo'}}).then(r=>r.json()));
  const c = dd.contracts.find(c=>c.title==='QA Contrato multi'); console.log('api', JSON.stringify(c&&{a:c.artistIds,aid:c.artistId}));
  await p.reload(); await p.waitForTimeout(1500); await p.getByRole('button',{name:/^\s*Legal/}).first().click(); await p.waitForTimeout(800);
  console.log('visible', (await p.evaluate(()=>document.body.innerText)).includes('QA Contrato multi'), 'errs', errs.length);
  await b.close();
})();
