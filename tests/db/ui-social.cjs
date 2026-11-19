// Audiencia & Captación (historial real de redes + acciones + cruce) y Resumen 360 editable.
const { chromium } = require('playwright');
const { execSync } = require('child_process');
const q = (sql) => execSync(`mariadb --default-character-set=utf8mb4 flamo_dev -N -e "${sql}"`).toString().trim();
const ok = [], bad = []; const check = (n, c, d = '') => (c ? ok : bad).push(n + (c ? '' : ` [${d}]`));
const day = (off) => new Date(Date.now() + off * 86400000).toISOString().slice(0, 10);
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1366, height: 1000 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('http://localhost:3000'); await p.waitForSelector('input[type=password]');
  await p.fill('input:not([type=password])', 'admin'); await p.fill('input[type=password]', 'Admin-Test-1'); await p.keyboard.press('Enter'); await p.waitForSelector('text=Inicio'); await p.waitForTimeout(1500);
  const T = new Date().toISOString();
  const art = { id: 'qa-a1', artisticName: 'QA Banda', legalName: '', photo: '', bio: '', genre: 'Rock', subgenres: [], languages: [], startDate: '', city: '', state: '', country: '', label: '', publisher: '', distributor: '', manager: '', bookingAgent: '', socialMedia: { instagram: '@qa.band' }, members: [], pipeline: [], history: [], stage: 'Emergente', created_at: T, updated_at: T, deleted_at: null };
  const ven = { id: 'qa-v1', name: 'QA Foro', address: 'Calle 1', city: 'CDMX', state: 'CDMX', country: 'México', postalCode: '', lat: 19.4, lng: -99.1, created_at: T, updated_at: T, deleted_at: null };
  const evt = { id: 'qa-e1', name: 'QA Show Agenda', artistId: 'qa-a1', venueId: 'qa-v1', date: day(-5), capacity: 100, attendance: 90, ticketPrice: 100, totalIncome: 9000, expenses: 1000, profit: 8000, status: 'Completed', created_at: T, updated_at: T, deleted_at: null };
  const st = await p.evaluate(async ([art, ven, evt]) => (await fetch('/api/data.php?action=sync', { method: 'POST', headers: { 'X-Requested-With': 'flamo', 'Content-Type': 'application/json' }, body: JSON.stringify({ changes: { artists: { upserts: [art] }, venues: { upserts: [ven] }, events: { upserts: [evt] } } }) })).status, [art, ven, evt]);
  check('datos de prueba creados', st === 200, String(st));
  await p.reload(); await p.waitForSelector('text=Inicio'); await p.waitForTimeout(1500);
  await p.getByRole('button', { name: /^\s*Artistas/ }).first().click(); await p.waitForTimeout(800);
  await p.getByText('QA Banda').first().click().catch(() => {}); await p.waitForTimeout(600);

  // ───── Resumen 360 editable ─────
  const t360 = await p.evaluate(() => document.body.innerText);
  check('360: lo vacío dice «Sin dato» (no inventa «Independiente» / «Pendiente»)', t360.includes('Sin dato') && !t360.includes('Independiente') && !t360.includes('Pendiente') && !t360.includes('Activa'), '');
  await p.getByRole('button', { name: /Editar ficha/ }).click();
  await p.getByLabel('Biografía').fill('Banda de rock de CDMX.');
  await p.getByLabel('Manager').fill('Laura Pérez');
  await p.getByLabel('Sello').fill('Sello QA');
  await p.getByLabel('Subgéneros').fill('Punk, Garage');
  await p.getByRole('button', { name: /Guardar cambios/ }).click(); await p.waitForTimeout(2200);
  check('360: la ficha editada se muestra', (await p.getByTestId('artist-ficha').innerText()).includes('Laura Pérez') && (await p.getByTestId('artist-ficha').innerText()).includes('Garage'));
  check('360: se guardó en la base (bio, sello y manager como contacto)', q("SELECT bio, sello FROM artistas WHERE id='qa-a1'") === 'Banda de rock de CDMX.\tSello QA' && q("SELECT COUNT(*) FROM artista_contactos ac JOIN contactos c ON c.id=ac.contacto_id WHERE ac.artista_id='qa-a1' AND c.nombre LIKE 'Laura%'") === '1', q("SELECT bio, sello FROM artistas WHERE id='qa-a1'"));
  await p.reload(); await p.waitForSelector('text=Inicio'); await p.waitForTimeout(1500);
  await p.getByRole('button', { name: /^\s*Artistas/ }).first().click(); await p.waitForTimeout(800); await p.getByText('QA Banda').first().click().catch(() => {}); await p.waitForTimeout(600);
  check('360: tras recargar sigue ahí', (await p.getByTestId('artist-ficha').innerText()).includes('Sello QA'));

  // ───── Audiencia & Captación ─────
  await p.getByRole('button', { name: /Audiencia/ }).first().click(); await p.waitForTimeout(1200);
  const s0 = await p.getByTestId('social-metrics').innerText();
  check('sin capturas: dice «Sin datos» y NO muestra cifras inventadas', s0.includes('Sin datos') && !/54\s*%|42\s*%|50\.?0?K|132/.test(s0), s0.slice(0, 200));
  await p.waitForTimeout(2500);
  check('al abrir la pantalla se intenta conectar solo (sin pedir datos) y, sin Apify, el error sale en la tarjeta', (await p.getByTestId('net-error-instagram').innerText()).includes('Apify no está configurado') && q('SELECT COUNT(*) FROM artista_metricas_redes') === '0');
  check('la tarjeta ofrece «Reintentar» y dice que se actualiza sola', (await p.getByTestId('net-instagram').innerText()).includes('Reintentar') && (await p.getByTestId('net-instagram').innerText()).includes('Se actualiza sola'));
  // agregar una red nueva: solo usuario o enlace, sin números
  await p.getByLabel('Agregar red').selectOption('tiktok');
  check('al elegir la red pide SOLO el usuario o enlace (no seguidores)', await p.getByLabel('Usuario o enlace de la nueva red').isVisible() && !(await p.getByTestId('manual-form').count()));
  await p.getByLabel('Usuario o enlace de la nueva red').fill('https://www.tiktok.com/@qa.tt');
  await p.getByRole('button', { name: 'Conectar', exact: true }).click(); await p.waitForTimeout(2500);
  check('la red queda guardada con su enlace y aparece su tarjeta', q("SELECT enlace FROM artista_redes WHERE artista_id='qa-a1' AND plataforma='tiktok'") === 'https://www.tiktok.com/@qa.tt' && (await p.getByTestId('net-tiktok').count()) === 1);
  check('intentó conectarse sola (error de Apify en la tarjeta, sin pedir captura manual)', (await p.getByTestId('net-error-tiktok').innerText()).includes('Apify no está configurado'));
  // artista con el usuario que quedó de la conexión anterior
  // capturas manuales: hace 14, 7 y 0 días
  for (const [off, n] of [[-14, 1000], [-7, 1100], [0, 1250]]) {
    await p.getByTestId('net-instagram').getByRole('button', { name: /capturar a mano/i }).click();
    await p.getByTestId('manual-form').locator('input[type=date]').fill(day(off));
    await p.getByLabel('Seguidores', { exact: true }).fill(String(n));
    await p.getByRole('button', { name: /Guardar captura/ }).click(); await p.waitForTimeout(900);
  }
  check('3 capturas guardadas en la base', q("SELECT COUNT(*) FROM artista_metricas_redes WHERE artista_id='qa-a1' AND plataforma='instagram'") === '3');
  const card = await p.getByTestId('net-instagram').innerText();
  check('la tarjeta muestra el último dato y el cambio vs la captura anterior (+150)', card.includes('1,250') || card.includes('1250'), card.slice(0, 160));
  check('el cambio dice +150 (+13.6 %)', /\+150/.test(card) && /13\.6/.test(card), card);
  check('fuente «Manual»', card.includes('Manual'));
  // captura inválida
  await p.getByTestId('net-instagram').getByRole('button', { name: /capturar a mano/i }).click();
  await p.getByTestId('manual-form').locator('input[type=date]').fill(day(-3)); await p.getByLabel('Seguidores', { exact: true }).fill('-5');
  await p.getByRole('button', { name: /Guardar captura/ }).click(); await p.waitForTimeout(500);
  check('un valor negativo no se guarda', q("SELECT COUNT(*) FROM artista_metricas_redes WHERE artista_id='qa-a1'") === '3');
  await p.getByRole('button', { name: /Cancelar/ }).first().click().catch(() => {});
  // gráfica
  check('la gráfica dibuja 3 puntos', (await p.getByTestId('social-chart').locator('circle').count()) >= 3);
  check('la gráfica marca el show de la agenda', (await p.getByTestId('chart-mark').count()) >= 1);
  // acción
  await p.getByLabel('Título de la acción').fill('Sencillo nuevo');
  await p.getByTestId('action-form').locator('input[type=date]').first().fill(day(-10));
  await p.getByTestId('action-form').locator('select').first().selectOption('Lanzamiento');
  await p.getByRole('button', { name: 'Agregar acción' }).click(); await p.waitForTimeout(1000);
  check('la acción se guardó', q("SELECT titulo FROM artista_acciones WHERE artista_id='qa-a1'") === 'Sencillo nuevo');
  const rows = await p.getByTestId('crossing-row').allInnerTexts();
  const rl = rows.find(r => r.includes('Sencillo nuevo')), rs = rows.find(r => r.includes('QA Show Agenda'));
  check('cruce de la acción: antes 1,000 → después 1,250 = +250 (+25.0 %)', rl && /1,000/.test(rl) && /1,250/.test(rl) && /\+250/.test(rl) && /25\.0/.test(rl), rl);
  check('cruce del show de la agenda (hace 5 días): antes 1,100 → después 1,250 = +150', rs && /1,100/.test(rs) && /1,250/.test(rs) && /\+150/.test(rs), rs);
  check('resumen por tipo (Lanzamiento y Show)', (await p.getByTestId('crossing-summary').innerText()).includes('Lanzamiento') && (await p.getByTestId('crossing-summary').innerText()).includes('Show'));
  // una acción sin capturas posteriores no se inventa
  await p.getByLabel('Título de la acción').fill('Campaña futura');
  await p.getByTestId('action-form').locator('input[type=date]').first().fill(day(0));
  await p.getByRole('button', { name: 'Agregar acción' }).click(); await p.waitForTimeout(1000);
  const rows2 = await p.getByTestId('crossing-row').allInnerTexts(); const rf = rows2.find(r => r.includes('Campaña futura'));
  check('acción de hoy sin capturas posteriores: «Falta una captura…», sin cifra inventada', rf && /Falta una captura/.test(rf) && !/%/.test(rf), rf);
  // persistencia al recargar
  await p.reload(); await p.waitForSelector('text=Inicio'); await p.waitForTimeout(1500);
  await p.getByRole('button', { name: /^\s*Artistas/ }).first().click(); await p.waitForTimeout(800); await p.getByText('QA Banda').first().click().catch(() => {}); await p.waitForTimeout(500);
  await p.getByRole('button', { name: /Audiencia/ }).first().click(); await p.waitForTimeout(1200);
  check('tras recargar, el historial sigue ahí', (await p.getByTestId('net-instagram').innerText()).includes('1,250'));
  // eliminar acción
  const del = p.getByTitle('Eliminar acción').first(); await del.click(); await p.waitForTimeout(900);
  check('se puede eliminar una acción', q("SELECT COUNT(*) FROM artista_acciones WHERE artista_id='qa-a1'") === '1');
  // artista cuyo único dato de Instagram es el usuario que quedó de la conexión anterior
  const art2 = { ...art, id: 'qa-a2', artisticName: 'QA Heredado', socialMedia: { instagramConnectedUser: '@qa.heredado' } };
  await p.evaluate(async (a) => (await fetch('/api/data.php?action=sync', { method: 'POST', headers: { 'X-Requested-With': 'flamo', 'Content-Type': 'application/json' }, body: JSON.stringify({ changes: { artists: { upserts: [a] } } }) })).status, art2);
  await p.reload(); await p.waitForSelector('text=Inicio'); await p.waitForTimeout(1500);
  await p.getByRole('button', { name: /^\s*Artistas/ }).first().click(); await p.waitForTimeout(800); await p.getByText('QA Heredado').first().click(); await p.waitForTimeout(500);
  await p.getByRole('button', { name: /Audiencia/ }).first().click(); await p.waitForTimeout(2500);
  check('usuario heredado: la tarjeta de Instagram aparece ya conectada con @qa.heredado', (await p.getByTestId('net-instagram').count()) === 1 && (await p.getByLabel('Usuario o enlace de Instagram').inputValue()) === '@qa.heredado');
  check('y la consulta automática se intentó con ese usuario', (await p.getByTestId('net-error-instagram').innerText()).includes('Apify'));
  await p.screenshot({ path: '/tmp/social.png', fullPage: true });
  check('sin errores JS', errs.length === 0, errs.join('|'));
  console.log(ok.map(x => '  ✓ ' + x).join('\n')); console.log(bad.length ? 'FALLOS:\n' + bad.join('\n') : 'Sin fallos'); await b.close();
})();
