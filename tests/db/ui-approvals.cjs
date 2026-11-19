// Flujo de aprobación en la interfaz: un Gestor edita → queda pendiente → el Super Admin aprueba/rechaza → el Gestor ve el resultado.
const { chromium } = require('playwright');
const { execSync } = require('child_process');
const RES = { ok: [], bad: [] }; const check = (n, c, d = '') => (c ? RES.ok : RES.bad).push(n + (c ? '' : ` [${d}]`));
const q = (sql) => execSync(`mariadb --default-character-set=utf8mb4 flamo_dev -N -e "${sql}"`).toString().trim();
const login = async (b, user, pass, vp = { width: 1366, height: 900 }) => {
  const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.__errs = []; p.on('pageerror', e => p.__errs.push(e.message));
  await p.goto('http://localhost:3000'); await p.waitForSelector('input[type=password]');
  await p.fill('input:not([type=password])', user); await p.fill('input[type=password]', pass); await p.keyboard.press('Enter'); await p.waitForTimeout(3500); return p;
};
const nav = async (p, name) => { await p.getByRole('button', { name: new RegExp('^\\s*' + name) }).first().click(); await p.waitForTimeout(900); };
(async () => {
  const b = await chromium.launch();
  const adm = await login(b, 'admin', 'Admin-Test-1');
  const T = new Date().toISOString();
  const art = { id: 'qa-appr', artisticName: 'QA Aprobación', legalName: '', photo: '', bio: 'Bio original', genre: 'Rock', subgenres: [], languages: [], startDate: '', city: '', state: '', country: '', label: '', publisher: '', distributor: '', manager: '', bookingAgent: '', socialMedia: {}, members: [], pipeline: [], history: [], stage: 'Emergente', created_at: T, updated_at: T, deleted_at: null };
  const post = (p, path, body) => p.evaluate(async ([path, body]) => { const r = await fetch(path, { method: 'POST', headers: { 'X-Requested-With': 'flamo', 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return r.status; }, [path, body]);
  check('datos de prueba y usuario Gestor creados', (await post(adm, '/api/data.php?action=sync', { changes: { artists: { upserts: [art] } } })) === 200 && (await post(adm, '/api/users.php', { username: 'gestor1', name: 'Gestora Uno', role: 'Gestor de Contenido', password: 'Gestor-Clave-1' })) === 201);
  const g = await login(b, 'gestor1', 'Gestor-Clave-1');
  check('el Gestor ve el aviso «tus cambios no se aplican de inmediato»', await g.getByTestId('approval-banner').isVisible());
  check('el Gestor ve «Mis cambios» (no «Aprobaciones»)', (await g.locator('nav').first().innerText()).includes('Mis cambios') && !(await g.locator('nav').first().innerText()).includes('Aprobaciones'));
  check('el Gestor NO ve la pestaña Usuarios', !(await g.locator('nav').first().innerText()).includes('Usuarios'));
  await nav(g, 'Artistas'); await g.locator('text=QA Aprobación >> visible=true').first().click(); await g.waitForTimeout(600);
  check('el Gestor NO ve botones de eliminar', (await g.locator('[title*="Eliminar"]:visible').count()) === 0);
  await g.getByRole('button', { name: /Editar ficha/ }).click(); await g.getByLabel('Biografía').fill('Bio editada por la gestora'); await g.getByRole('button', { name: /Guardar cambios/ }).click(); await g.waitForTimeout(2500);
  check('al guardar, avisa que quedó pendiente de aprobación', (await g.getByTestId('info-msg').innerText().catch(() => '')).includes('pendiente'));
  check('el dato REAL no cambió (sigue la bio original)', q("SELECT bio FROM artistas WHERE id='qa-appr'") === 'Bio original');
  check('hay 1 propuesta pendiente en la base', q("SELECT COUNT(*) FROM cambios_pendientes WHERE estado='pendiente'") === '1');
  check('el Gestor sigue viendo SU edición en pantalla', (await g.getByTestId('artist-ficha').innerText()).includes('Bio editada por la gestora'));
  await g.reload(); await g.waitForTimeout(3500); await nav(g, 'Artistas'); await g.locator('text=QA Aprobación >> visible=true').first().click(); await g.waitForTimeout(600);
  check('tras recargar, el Gestor sigue viendo su edición pendiente (no la pierde de vista)', (await g.getByTestId('artist-ficha').innerText()).includes('Bio editada por la gestora'));
  check('el menú muestra 1 pendiente', (await g.getByTestId('badge-approvals').innerText()) === '1');
  await nav(g, 'Mis cambios');
  check('«Mis cambios» lista la propuesta como pendiente', (await g.getByTestId('my-change').first().innerText()).includes('Pendiente de aprobación') && (await g.getByTestId('my-change').first().innerText()).includes('QA Aprobación'));
  // ── Super Admin ──
  await adm.reload(); await adm.waitForTimeout(3500);
  check('el Super Admin ve el contador 1 en «Aprobaciones»', (await adm.getByTestId('badge-approvals').innerText()) === '1');
  check('el Super Admin NO ve el aviso de aprobación', (await adm.getByTestId('approval-banner').count()) === 0);
  await nav(adm, 'Aprobaciones');
  const item = adm.getByTestId('pending-item').first();
  const txt = await item.innerText();
  check('muestra quién, qué y el antes/después', txt.includes('Gestora Uno') && txt.includes('QA Aprobación') && txt.includes('Bio original') && txt.includes('Bio editada por la gestora'), txt.slice(0, 200));
  await adm.screenshot({ path: '/tmp/approvals.png' });
  adm.on('dialog', d => d.accept('Motivo de prueba: la bio no es correcta'));
  await item.getByTestId('reject-one').click(); await adm.waitForTimeout(1800);
  check('el Super Admin rechaza: no se aplica y la lista queda vacía', q("SELECT bio FROM artistas WHERE id='qa-appr'") === 'Bio original' && (await adm.getByTestId('pending-item').count()) === 0);
  await nav(g, 'Mis cambios'); await g.getByRole('button', { name: /Actualizar/ }).click(); await g.waitForTimeout(1200);
  const gt = await g.getByTestId('my-change').first().innerText();
  check('el Gestor ve «Rechazado» con el motivo', gt.includes('Rechazado') && gt.includes('la bio no es correcta'), gt);
  // segundo intento → aprobar
  await nav(g, 'Artistas'); await g.locator('text=QA Aprobación >> visible=true').first().click(); await g.waitForTimeout(600);
  await g.getByRole('button', { name: /Editar ficha/ }).click(); await g.getByLabel('Biografía').fill('Bio corregida'); await g.getByRole('button', { name: /Guardar cambios/ }).click(); await g.waitForTimeout(2500);
  await adm.reload(); await adm.waitForTimeout(3500); await nav(adm, 'Aprobaciones');
  await adm.getByTestId('approve-one').first().click(); await adm.waitForTimeout(2000);
  check('el Super Admin aprueba y se aplica', q("SELECT bio FROM artistas WHERE id='qa-appr'") === 'Bio corregida' && (await adm.getByTestId('approvals-notice').innerText()).includes('aprobado'));
  await g.reload(); await g.waitForTimeout(3500); await nav(g, 'Mis cambios');
  check('el Gestor ve «Aprobado»', (await g.getByTestId('my-change').first().innerText()).includes('Aprobado'));
  await nav(g, 'Artistas'); await g.locator('text=QA Aprobación >> visible=true').first().click(); await g.waitForTimeout(500);
  check('y los datos reales ya muestran la bio aprobada', (await g.getByTestId('artist-ficha').innerText()).includes('Bio corregida'));
  // el Super Admin sí puede eliminar
  await nav(adm, 'Artistas'); await adm.locator('text=QA Aprobación >> visible=true').first().click(); await adm.waitForTimeout(500);
  check('el Super Admin SÍ ve el botón de eliminar', (await adm.locator('[title*="Eliminar"]:visible').count()) > 0);
  check('sin errores JS', g.__errs.length === 0 && adm.__errs.length === 0, g.__errs.concat(adm.__errs).join('|'));
  console.log('TOTAL ok=' + RES.ok.length + ' bad=' + RES.bad.length); console.log(RES.ok.map(x => '  ✓ ' + x).join('\n')); console.log(RES.bad.length ? 'FALLOS:\n' + RES.bad.map(x => '  ✗ ' + x).join('\n') : 'Sin fallos'); await b.close(); process.exit(RES.bad.length ? 1 : 0);
})();
