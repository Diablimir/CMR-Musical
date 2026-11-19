// Conexión oficial con Instagram contra un Meta SIMULADO (tests/db/fake-graph.php en 127.0.0.1:8001).
const { chromium } = require('playwright');
const { execSync } = require('child_process');
const fs = require('fs');
const q = (sql) => execSync(`mariadb --default-character-set=utf8mb4 flamo_dev -N -e "${sql}"`).toString().trim();
const ok = [], bad = []; const check = (n, c, d = '') => (c ? ok : bad).push(n + (c ? '' : ` [${d}]`));
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1366, height: 1000 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('http://localhost:3000'); await p.waitForSelector('input[type=password]');
  await p.fill('input:not([type=password])', 'admin'); await p.fill('input[type=password]', 'Admin-Test-1'); await p.keyboard.press('Enter'); await p.waitForSelector('text=Inicio'); await p.waitForTimeout(1500);
  const T = new Date().toISOString();
  const art = { id: 'qa-m1', artisticName: 'QA Oficial', legalName: '', photo: '', bio: '', genre: 'Rock', subgenres: [], languages: [], startDate: '', city: '', state: '', country: '', label: '', publisher: '', distributor: '', manager: '', bookingAgent: '', socialMedia: { instagram: '@qa.official' }, members: [], pipeline: [], history: [], stage: 'Emergente', created_at: T, updated_at: T, deleted_at: null };
  await p.evaluate(async (a) => (await fetch('/api/data.php?action=sync', { method: 'POST', headers: { 'X-Requested-With': 'flamo', 'Content-Type': 'application/json' }, body: JSON.stringify({ changes: { artists: { upserts: [a] } } }) })).status, art);
  await p.reload(); await p.waitForSelector('text=Inicio'); await p.waitForTimeout(1500);
  await p.getByRole('button', { name: /^\s*Artistas/ }).first().click(); await p.waitForTimeout(700); await p.getByText('QA Oficial').first().click(); await p.waitForTimeout(500);
  await p.getByRole('button', { name: /Audiencia/ }).first().click(); await p.waitForTimeout(2500);

  check('sin conectar: se ofrece «Conectar Instagram oficial»', await p.getByTestId('meta-connect').isVisible());
  // ───── flujo OAuth completo: ida a Meta (simulado) y regreso ─────
  await p.getByRole('button', { name: /Conectar Instagram oficial/ }).click();
  await p.waitForURL(/meta=ok|meta=error/, { timeout: 20000 }).catch(() => {});
  await p.waitForSelector('text=Audiencia', { timeout: 15000 }); await p.waitForTimeout(3500);
  check('regresa a la pestaña «Audiencia & Captación» del artista y la URL queda limpia', (await p.getByTestId('social-metrics').count()) === 1 && !p.url().includes('meta='), p.url());
  const body = await p.getByTestId('social-metrics').innerText();
  check('avisa que Instagram quedó conectado', /Instagram conectado: @qa\.official/.test(body), body.slice(0, 200));
  check('muestra la cuenta conectada y su vencimiento', (await p.getByTestId('meta-conn').innerText()).includes('@qa.official') && (await p.getByTestId('meta-conn').innerText()).includes('vence'));
  check('seguidores oficiales: 2,500 con etiqueta «API oficial de Instagram»', (await p.getByTestId('net-instagram').innerText()).includes('2,500') && (await p.getByTestId('net-instagram').innerText()).includes('API oficial de Instagram'));
  check('alcance: 30 barras', (await p.getByTestId('reach-chart').locator('rect').count()) === 30);
  const dem = await p.getByTestId('official-instagram').innerText();
  check('demografía por género: Mujeres 52.0 %, Hombres 44.0 %', /Mujeres[\s\S]*52\.0 %/.test(dem) && /Hombres[\s\S]*44\.0 %/.test(dem), dem.slice(0, 400));
  check('demografía por edad, ciudad y país', dem.includes('25-34') && dem.includes('Guadalajara, Jalisco') && /M[eé]xico/.test(dem));
  const rows = await p.getByTestId('post-row').allInnerTexts();
  check('3 publicaciones', rows.length === 3, String(rows.length));
  const r1 = rows.find(r => r.includes('Nuevo sencillo'));
  check('publicación 1: alcance 1,000 e interacción 38.00 %', r1 && /1,000/.test(r1) && /38\.00 %/.test(r1), r1);
  const r3 = rows.find(r => r.includes('sin texto'));
  check('publicación 3 (Meta no dio insights): alcance e interacción «—», sin inventar', r3 && !/%/.test(r3) && (r3.match(/—/g) || []).length >= 4, r3);
  // ───── seguridad ─────
  const tokRow = q("SELECT token_cifrado FROM artista_conexiones WHERE artista_id='qa-m1'");
  check('en la base el token está cifrado (no aparece LONGTOKEN)', tokRow.length > 20 && !tokRow.includes('LONGTOKEN'));
  const api = await p.evaluate(async () => { const r = await fetch('/api/meta.php?artist_id=qa-m1', { headers: { 'X-Requested-With': 'flamo' } }); return await r.text(); });
  check('la API hacia el navegador no incluye el token', !/LONGTOKEN|SHORTTOKEN|token/i.test(api));
  const cb = await p.evaluate(async () => { const r = await fetch('/api/meta_callback.php?code=FAKECODE&state=falso', { redirect: 'manual', headers: { 'X-Requested-With': 'flamo' } }); return { type: r.type, status: r.status }; });
  const bad1 = await (await b.newContext()).request.get('http://localhost:3000/api/meta_callback.php?code=FAKECODE&state=falso', { maxRedirects: 0 });
  check('el retorno con «state» falso o sin sesión se rechaza (redirige con error)', (bad1.headers()['location'] || '').includes('meta=error'), bad1.headers()['location']);
  // ───── actualizar y auto-refresh ─────
  await p.getByRole('button', { name: 'Actualizar', exact: true }).click(); await p.waitForTimeout(4000);
  check('«Actualizar» vuelve a leer los datos oficiales', (await p.getByTestId('social-metrics').innerText()).includes('Datos oficiales actualizados'));
  const r = await p.evaluate(async () => (await (await fetch('/api/social.php?action=refresh', { method: 'POST', headers: { 'X-Requested-With': 'flamo', 'Content-Type': 'application/json' }, body: JSON.stringify({ artistId: 'qa-m1' }) })).json()));
  check('la actualización diaria omite Instagram si ya hay captura oficial de hoy (no usa Apify)', (r.skipped || []).includes('instagram') && !(r.errors || {}).instagram, JSON.stringify([r.skipped, r.errors]));
  // ───── token vencido ─────
  const enc = execSync(`php -r "require 'public/api/meta_lib.php'; function config(){return [];} echo meta_encrypt('EXPIRED','clave-local-de-pruebas-0123456789');"`).toString().trim();
  q(`UPDATE artista_conexiones SET token_cifrado='${enc}' WHERE artista_id='qa-m1'`);
  await p.getByRole('button', { name: 'Actualizar', exact: true }).click(); await p.waitForTimeout(3500);
  check('token vencido: error claro y botón «Reconectar»', (await p.getByTestId('meta-error').innerText()).includes('venció') && (await p.getByTestId('meta-conn-error').innerText()).includes('Reconectar'));
  // ───── desconectar ─────
  await p.getByRole('button', { name: /Desconectar/ }).click(); await p.waitForTimeout(2000);
  check('desconectar: vuelve a ofrecer conectar', await p.getByTestId('meta-connect').isVisible());
  check('el historial se conserva tras desconectar', q("SELECT COUNT(*) FROM artista_metricas_redes WHERE artista_id='qa-m1'") === '1' && q("SELECT COUNT(*) FROM artista_conexiones") === '0');
  // ───── sin configurar ─────
  fs.writeFileSync('public/api/config.php', fs.readFileSync('public/api/config.php', 'utf8').replace(/'meta_app_id'=>'app123',/, ''));
  await p.reload(); await p.waitForSelector('text=Inicio'); await p.waitForTimeout(1500);
  await p.getByRole('button', { name: /^\s*Artistas/ }).first().click(); await p.waitForTimeout(700); await p.getByText('QA Oficial').first().click(); await p.waitForTimeout(500);
  await p.getByRole('button', { name: /Audiencia/ }).first().click(); await p.waitForTimeout(2500);
  const nc = await p.getByTestId('meta-not-configured').innerText();
  check('sin claves de Meta en el servidor: explica qué falta y no deja conectar', nc.includes('meta_app_id') && await p.getByRole('button', { name: /Conectar Instagram oficial/ }).isDisabled());
  await p.screenshot({ path: '/tmp/meta-notcfg.png', fullPage: true });
  fs.copyFileSync('/tmp/config.full.php', 'public/api/config.php');
  check('sin errores JS', errs.length === 0, errs.join('|'));
  console.log(ok.map(x => '  ✓ ' + x).join('\n')); console.log(bad.length ? 'FALLOS:\n' + bad.join('\n') : 'Sin fallos'); await b.close();
})();
