// Prueba de extremo a extremo de la interfaz contra la base relacional (requiere el stack local: php -S + npm run dev + MariaDB flamo_dev).
const { chromium } = require('playwright');
const { execSync } = require('child_process');
const q = (sql) => execSync(`mariadb --default-character-set=utf8mb4 flamo_dev -N -e "${sql.replace(/"/g, '\\"')}"`).toString().trim();
const ok = [], bad = [];
const check = (name, cond, detail='') => { (cond ? ok : bad).push(name + (cond ? '' : '  [' + detail + ']')); };
async function login(b) { const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } }); const p = await ctx.newPage(); p.on('dialog', d => d.accept()); p.on('pageerror', e => bad.push('PAGEERROR ' + e.message.slice(0,120)));
  await p.goto('http://localhost:3000'); await p.waitForSelector('input[type=password]'); await p.fill('input:not([type=password])','admin'); await p.fill('input[type=password]','Admin-Test-1'); await p.keyboard.press('Enter'); await p.waitForSelector('text=Inicio'); await p.waitForTimeout(1500); return p; }
const tab = async (p, t) => { await p.getByRole('button', { name: new RegExp('^\\s*' + t) }).first().click(); await p.waitForTimeout(800); };
const newArtist = async (p, name, genre, subs, manager, booking) => {
  await tab(p, 'Artistas'); await p.getByRole('button',{name:/Agregar Nuevo Artista/}).first().click();
  await p.fill('input[placeholder^="Ej. Vladimir"]', name); await p.fill('input[placeholder="Ej. Indie Rock"]', genre); await p.fill('input[placeholder="Ej. Pop, Urbano"]', subs);
  await p.fill('input[placeholder^="Ej. Andrés"]', manager); await p.fill('input[placeholder="Persona o agencia"]', booking);
  await p.getByRole('button',{name:/Guardar Artista/}).click(); await p.waitForSelector(`text=${name}`); await p.waitForTimeout(1600); };
(async () => {
  const b = await chromium.launch(); const A = await login(b);
  const dd = await A.evaluate(() => fetch('/api/data.php',{headers:{'X-Requested-With':'flamo'}}).then(r=>r.json()));
  check('sin datos inventados (label/publisher vacíos, sin contacto «Flamo Booking»)', dd.artists.every(a => a.publisher === '' && a.label === '') && q(`SELECT COUNT(*) FROM contactos WHERE nombre LIKE '%Flamo Booking%'`) === '0');
  check('un objeto vacío vuelve como {} (no como [])', dd.artists.every(a => a.socialMedia && !Array.isArray(a.socialMedia)));
  await newArtist(A, 'QA Uno', 'Indie Rock', 'Pop, Urbano', 'Andrés Mendoza', 'Ana Booking');
  await newArtist(A, 'QA Dos', 'Jazz', '', 'andrés mendoza', '');
  check('géneros normalizados en tablas', q("SELECT GROUP_CONCAT(CONCAT(g.nombre,IF(ag.es_principal=1,'*','')) ORDER BY ag.orden SEPARATOR ',') FROM artista_generos ag JOIN cat_generos g ON g.id=ag.genero_id JOIN artistas a ON a.id=ag.artista_id WHERE a.nombre_artistico='QA Uno'") === 'Indie Rock*,Pop,Urbano');
  check('el mismo manager es UN contacto', q("SELECT COUNT(DISTINCT ac.contacto_id) FROM artista_contactos ac JOIN cat_roles_contacto r ON r.id=ac.rol_id WHERE r.nombre='Manager'") === '1');
  check('booking vacío no crea contacto', q("SELECT COUNT(*) FROM artista_contactos ac JOIN cat_roles_contacto r ON r.id=ac.rol_id WHERE r.nombre='Booking'") === '1');

  check('versión inicial 1', q("SELECT version FROM artistas WHERE nombre_artistico='QA Uno'") === '1');
  await A.getByText('QA Uno').first().click(); await A.waitForTimeout(500);
  const body = await A.evaluate(() => document.body.innerText);
  check('el perfil muestra género principal y subgéneros', body.includes('Indie Rock') && body.includes('Pop') && body.includes('Urbano'));
  check('el perfil muestra el manager (leído desde contactos)', body.includes('Andrés Mendoza'));

  // ── venue
  await tab(A, 'Venues'); await A.locator('input[placeholder^="Ej. Teatro"]').fill('Teatro Metropolitan, Ciudad de México'); await A.getByRole('button',{name:/Autocompletar/}).click();
  await A.waitForSelector('button[title="Eliminar Recinto"]',{timeout:40000}); await A.waitForTimeout(1500); await A.keyboard.press('Escape'); await A.waitForTimeout(500);
  check('venue guardado', q("SELECT COUNT(*) FROM venues") === '1');

  // ── contactos: directorio con varios medios y vínculos
  await tab(A, 'Contactos'); await A.getByRole('button',{name:/Nuevo contacto/}).click();
  await A.getByLabel('Nombre *').fill('María'); await A.getByLabel('Apellidos').fill('García');
  const emailInputs = A.locator('input[placeholder="correo@dominio.com"]'); await emailInputs.first().fill('maria@foro.com');
  await A.getByRole('button',{name:/\+ Añadir$/}).first().click(); await A.locator('input[placeholder="correo@dominio.com"]').nth(1).fill('maria.personal@x.com');
  await A.locator('input[placeholder="+52 55 0000 0000"]').first().fill('+52 55 1111 2222');
  await A.getByRole('button',{name:/\+ Añadir vínculo/}).click();
  const row = A.locator('.grid-cols-12').first(); await row.locator('select').nth(1).selectOption({ index: 1 }); await row.locator('input[list]').fill('Hospitalidad'); await row.locator('input[type=checkbox]').check();
  await A.getByRole('button',{name:/\+ Añadir vínculo/}).click();
  const row2 = A.locator('.grid-cols-12').nth(1); await row2.locator('select').first().selectOption('artist'); await row2.locator('select').nth(1).selectOption({ label: 'QA Uno' }); await row2.locator('input[list]').fill('Promotor');
  await A.getByRole('button',{name:/Guardar contacto/}).click(); await A.waitForTimeout(1800);
  check('contacto con apellidos', q("SELECT CONCAT(nombre,'|',apellidos) FROM contactos WHERE nombre='María'") === 'María|García');
  check('2 correos (1 principal) y 1 teléfono', q("SELECT CONCAT(COUNT(*),'/',SUM(es_principal=1)) FROM contacto_correos c JOIN contactos x ON x.id=c.contacto_id WHERE x.nombre='María'") === '2/1' && q("SELECT COUNT(*) FROM contacto_telefonos t JOIN contactos x ON x.id=t.contacto_id WHERE x.nombre='María'") === '1');
  check('vinculado a un venue Y a un artista (misma persona)', q("SELECT (SELECT COUNT(*) FROM venue_contactos vc JOIN contactos x ON x.id=vc.contacto_id WHERE x.nombre='María') + (SELECT COUNT(*) FROM artista_contactos ac JOIN contactos x ON x.id=ac.contacto_id WHERE x.nombre='María')") === '2');
  check('contacto principal del venue', q("SELECT COUNT(*) FROM venue_contactos vc JOIN contactos x ON x.id=vc.contacto_id WHERE x.nombre='María' AND vc.es_principal=1") === '1');
  const dirText = await A.evaluate(() => document.body.innerText);
  check('el directorio lista a María con sus vínculos', dirText.includes('María García') && dirText.includes('Hospitalidad') && dirText.includes('Promotor'));

  // ── evento con dos artistas e ingreso capturado
  await tab(A, 'Inicio'); await A.getByRole('button',{name:/Planificar Show/}).first().click(); await A.waitForSelector('text=Programar Show');
  const modal = A.locator('.fixed.inset-0').last();
  await modal.locator('input[type=text]').first().fill('QA Festival'); await modal.locator('input[type=date]').first().fill('2026-12-20');
  await modal.getByRole('button',{name:/\+ Añadir artista/}).click();
  const lr = modal.locator('.grid-cols-12').first(); await lr.locator('select').first().selectOption({ label: 'QA Dos' }); await lr.locator('select').nth(1).selectOption('Telonero');
  await modal.locator('input[placeholder="Vacío = asistencia × precio del boleto"]').fill('250000');
  const cb = modal.locator('input[type=checkbox]'); if (await cb.count()) await cb.first().uncheck().catch(()=>{});
  await modal.locator('input[type=number]').filter({ hasNot: A.locator('[title]') }).first().waitFor().catch(()=>{});
  await A.getByRole('button',{name:/Programar Show/}).click(); await A.waitForTimeout(2500);
  check('evento con 2 artistas en evento_artistas', q("SELECT COUNT(*) FROM evento_artistas ea JOIN eventos e ON e.id=ea.evento_id WHERE e.nombre='QA Festival'") === '2');
  check('roles y principal', q("SELECT GROUP_CONCAT(CONCAT(a.nombre_artistico,':',ea.rol,':',IF(ea.es_principal=1,'P','-')) ORDER BY ea.orden_presentacion SEPARATOR ',') FROM evento_artistas ea JOIN artistas a ON a.id=ea.artista_id JOIN eventos e ON e.id=ea.evento_id WHERE e.nombre='QA Festival'").includes('QA Dos:Telonero:-') );
  check('ingreso capturado (250000) y utilidad calculada', q("SELECT CONCAT(ingreso_total,'/',utilidad) FROM eventos WHERE nombre='QA Festival'") === '250000.00/150000.00', q("SELECT CONCAT(ingreso_total,'/',utilidad) FROM eventos WHERE nombre='QA Festival'"));
  check('eventos ya no tiene artista_id (Fase 4): todo vive en evento_artistas', q("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='eventos' AND column_name='artista_id'") === '0');

  // ── integridad desde la pantalla: venue con evento
  await tab(A, 'Venues'); await A.locator('tr', { hasText: 'Metropólitan' }).first().click(); await A.waitForSelector('button[title="Eliminar Recinto"]');
  await A.locator('button[title="Eliminar Recinto"]').click(); await A.waitForTimeout(2500);
  const alerts = await A.locator('[role=alert]').allInnerTexts();
  check('borrar venue con evento: aviso claro y no se borra', alerts.join(' ').includes('No se puede eliminar') && q("SELECT COUNT(*) FROM venues") === '1', JSON.stringify(alerts));

  // ── concurrencia entre dos personas sobre el mismo contacto
  const B = await login(b); await tab(B, 'Contactos'); await tab(A, 'Contactos');
  await A.locator('tr', { hasText: 'María García' }).getByTitle('Editar').click(); await A.getByLabel('Apellidos').fill('García Ruiz'); await A.getByRole('button',{name:/Guardar contacto/}).click(); await A.waitForTimeout(1800);
  await B.locator('tr', { hasText: 'María García' }).getByTitle('Editar').click(); await B.getByLabel('Apellidos').fill('García Soto'); await B.getByRole('button',{name:/Guardar contacto/}).click(); await B.waitForTimeout(2500);
  const bAlerts = (await B.locator('[role=alert]').allInnerTexts()).join(' ');
  check('conflicto: la segunda persona recibe aviso', bAlerts.includes('modificado por otra persona'), bAlerts);
  check('no se pisó el cambio de la primera persona', q("SELECT apellidos FROM contactos WHERE nombre='María'") === 'García Ruiz');
  await B.waitForTimeout(1200); check('la pantalla de la segunda persona se recargó con el dato vigente', (await B.evaluate(() => document.body.innerText)).includes('García Ruiz'));

  // ── regresión: todas las pestañas cargan sin error
  for (const t of ['Inicio','Venues','Proveedores','Contactos','Producción','Artistas','Finanzas','Legal','Usuarios']) { await tab(A, t); }
  check('recorrido de pestañas sin errores JS', !bad.some(x => x.startsWith('PAGEERROR')));
  console.log(ok.map(x => '  ✓ ' + x).join('\n')); console.log(bad.length ? '\nFALLOS:\n' + bad.map(x => '  ✗ ' + x).join('\n') : '\nSin fallos'); await b.close();
})().catch(e => { console.error('FAIL', e.message.split('\n').slice(0,4).join(' | ')); console.log('FALLOS PREVIOS:', bad.join(' ; ')); process.exit(1); });
