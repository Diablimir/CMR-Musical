// Pruebas de seguridad por HTTP contra el servidor local (php -S 127.0.0.1:8000) y el Meta simulado (127.0.0.1:8001).
const { execSync } = require('child_process');
const fs = require('fs');
const B = 'http://127.0.0.1:8000';
const ok = [], bad = []; const check = (n, c, d = '') => (c ? ok : bad).push(n + (c ? '' : ` [${d}]`));
class Client {
  constructor(ip) { this.ip = ip; this.jar = {}; }
  async req(path, { method = 'GET', body, headers = {}, raw = false, csrf = true, redirect = 'manual' } = {}) {
    const h = { ...headers, 'X-Forwarded-For': this.ip };
    if (csrf) h['X-Requested-With'] = 'flamo';
    if (body !== undefined && !raw) h['Content-Type'] = 'application/json';
    const ck = Object.entries(this.jar).map(([k, v]) => `${k}=${v}`).join('; '); if (ck) h.Cookie = ck;
    const t = Date.now();
    const r = await fetch(B + path, { method, headers: h, body: body === undefined ? undefined : raw ? body : JSON.stringify(body), redirect });
    for (const c of r.headers.getSetCookie?.() ?? []) { const [kv] = c.split(';'); const i = kv.indexOf('='); this.jar[kv.slice(0, i)] = kv.slice(i + 1); }
    let j = null; const text = await r.text(); try { j = JSON.parse(text); } catch {}
    return { status: r.status, j, text, ms: Date.now() - t, headers: r.headers };
  }
  login(u, p) { return this.req('/api/auth.php?action=login', { method: 'POST', body: { username: u, password: p } }); }
}
const median = (a) => a.sort((x, y) => x - y)[Math.floor(a.length / 2)];
(async () => {
  const admin = new Client('10.0.0.1');
  check('login de admin', (await admin.login('admin', 'Admin-Test-1')).status === 200);

  // ── CSRF ──
  check('CSRF: una escritura sin la cabecera personalizada se rechaza (403)', (await admin.req('/api/data.php?action=sync', { method: 'POST', body: { changes: {} }, csrf: false })).status === 403);

  // ── Roles ──
  check('roles: un rol inventado se rechaza (400)', (await admin.req('/api/users.php', { method: 'POST', body: { username: 'sec-bad', name: 'X', role: 'Hacker', password: 'Password-123' } })).status === 400);
  const mk = await admin.req('/api/users.php', { method: 'POST', body: { username: 'sec-user', name: 'Sec User', role: 'Gestor de Contenido', password: 'Password-123' } });
  check('roles: un rol del catálogo se acepta', mk.status === 201, JSON.stringify(mk.j));
  const list = (await admin.req('/api/users.php')).j.users; const secId = list.find(u => u.username === 'sec-user')?.id;

  // ── Login: sin bloqueo global, límite por usuario+IP, tiempo uniforme ──
  const attacker = new Client('66.6.6.6');
  let last = 0; for (let i = 0; i < 12; i++) last = (await attacker.login('admin', 'mala-' + i)).status;
  check('límite por usuario+IP: tras 10 fallos el atacante recibe 429', last === 429, String(last));
  check('el administrador legítimo (otra IP) NO queda bloqueado por ese ataque', (await new Client('10.0.0.9').login('admin', 'Admin-Test-1')).status === 200);
  const sprayer = new Client('77.7.7.7'); let sp = 0; for (let i = 0; i < 45; i++) sp = (await sprayer.login('usuario' + i, 'x' + i)).status;
  check('límite por IP: 45 usuarios distintos desde una IP terminan en 429', sp === 429, String(sp));
  check('y aun así un usuario legítimo desde otra IP puede entrar (no hay bloqueo global)', (await new Client('10.0.0.10').login('sec-user', 'Password-123')).status === 200);
  const tk = [], tu = []; for (let i = 0; i < 5; i++) { tk.push((await new Client('9.9.9.' + i).login('admin', 'mala')).ms); tu.push((await new Client('8.8.8.' + i).login('no-existe-' + i, 'mala')).ms); }
  check('tiempos de respuesta parecidos con usuario existente e inexistente (no revela usuarios)', Math.abs(median(tk) - median(tu)) < 120, `${median(tk)} vs ${median(tu)} ms`);
  const m1 = (await new Client('5.5.5.5').login('admin', 'mala')).j?.error, m2 = (await new Client('5.5.5.6').login('fantasma', 'mala')).j?.error;
  check('mismo mensaje de error para usuario existente e inexistente', m1 && m1 === m2, `${m1} | ${m2}`);

  // ── Sesiones ──
  const sA = new Client('11.1.1.1'); await sA.login('sec-user', 'Password-123');
  check('sesión activa antes del cambio de contraseña', (await sA.req('/api/data.php')).status === 200);
  await admin.req('/api/users.php?id=' + secId, { method: 'PUT', body: { password: 'Nueva-Clave-456' } });
  check('al cambiar la contraseña, la sesión anterior deja de valer (401)', (await sA.req('/api/data.php')).status === 401);
  check('la contraseña nueva funciona', (await new Client('11.1.1.2').login('sec-user', 'Nueva-Clave-456')).status === 200);
  check('quien cambia su PROPIA contraseña sigue dentro', (await admin.req('/api/users.php?id=' + list.find(u => u.username === 'admin').id, { method: 'PUT', body: { password: 'Admin-Test-1' } })).status === 200 && (await admin.req('/api/data.php')).status === 200);
  // expiración por inactividad: se envejece el archivo de sesión
  const sB = new Client('12.1.1.1'); await sB.login('sec-user', 'Nueva-Clave-456'); const sid = sB.jar['flamo_sid'];
  const f = ['/tmp', require('os').tmpdir(), '/var/lib/php/sessions'].map(d => `${d}/sess_${sid}`).find(fs.existsSync);
  if (f) { fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(/seen\|i:\d+/, 'seen|i:' + (Math.floor(Date.now() / 1000) - 9000))); check('sesión inactiva más de 2 h: se cierra (401)', (await sB.req('/api/data.php')).status === 401); }
  else check('(no se encontró el archivo de sesión para la prueba de inactividad)', false, sid);
  check('un identificador de sesión inventado por el cliente no se acepta', (await (async () => { const c = new Client('13.1.1.1'); c.jar['flamo_sid'] = 'inventadoporelatacante1234567890'; await c.login('sec-user', 'Nueva-Clave-456'); return c.jar['flamo_sid'] !== 'inventadoporelatacante1234567890'; })()));

  // ── Tamaño de cuerpos ──
  check('cuerpo de 13 MB a la sincronización: 413 antes de leerlo', (await admin.req('/api/data.php?action=sync', { method: 'POST', body: 'x'.repeat(13 * 1024 * 1024), raw: true, headers: { 'Content-Type': 'application/json' } })).status === 413);
  check('cuerpo de 3 MB a un endpoint normal: 413', (await admin.req('/api/social.php?action=metric', { method: 'POST', body: 'x'.repeat(3 * 1024 * 1024), raw: true, headers: { 'Content-Type': 'application/json' } })).status === 413);

  // ── Límites de uso de integraciones ──
  const au = new Client('14.1.1.1'); await au.login('sec-user', 'Nueva-Clave-456');
  let st = []; for (let i = 0; i < 14; i++) st.push((await au.req('/api/apify.php?action=scrape', { method: 'POST', body: { platform: 'instagram', handle: 'x' } })).status);
  check('Apify: después de 12 consultas seguidas responde 429', st.slice(0, 12).every(s => s !== 429) && st[12] === 429, st.join(','));
  const ap = await admin.req('/api/apify.php?action=status');
  check('estado de Apify: no revela ni fragmentos del token', ap.j && !('maskedToken' in ap.j) && !('hasToken' in ap.j), JSON.stringify(ap.j));

  // ── Subida de imágenes ──
  const png = (w, h) => execSync(`php -r '$i=imagecreatetruecolor(${w},${h}); imagepng($i,"php://stdout");'`, { maxBuffer: 50 * 1024 * 1024 });
  const up = async (buf, name, type) => { const fd = new FormData(); fd.append('file', new Blob([buf], { type }), name); const c = admin; const h = { 'X-Requested-With': 'flamo', 'X-Forwarded-For': '10.0.0.1', Cookie: Object.entries(c.jar).map(([k, v]) => `${k}=${v}`).join('; ') }; const r = await fetch(B + '/api/upload.php', { method: 'POST', headers: h, body: fd }); return { status: r.status, j: await r.json().catch(() => null) }; };
  const u1 = await up(png(50, 50), 'a.png', 'image/png');
  check('subida de una imagen normal: se recodifica a .jpg', u1.status === 201 && /\.jpg$/.test(u1.j?.url || ''), JSON.stringify(u1));
  const u2 = await up(png(7000, 7000), 'bomba.png', 'image/png');
  check('imagen de 49 megapíxeles (bomba de descompresión): 413', u2.status === 413, JSON.stringify(u2));
  const evil = Buffer.concat([Buffer.from('GIF89a'), Buffer.from('<?php system($_GET["c"]); ?>')]);
  const u3 = await up(evil, 'shell.php.gif', 'image/gif');
  check('archivo falso con código PHP dentro: se rechaza', [413, 415, 422].includes(u3.status), JSON.stringify(u3));
  const u4 = await up(Buffer.from('<?php echo 1; ?>'), 'x.php', 'application/x-php');
  check('un .php se rechaza (415)', u4.status === 415, JSON.stringify(u4));
  const up5 = fs.existsSync('public/uploads/avatars') ? fs.readdirSync('public/uploads/avatars').filter(f => !f.endsWith('.jpg')) : [];
  check('en la carpeta de imágenes solo hay .jpg', up5.length === 0, up5.join(','));

  // ── SSRF (mapas) ──
  const places = async (q) => (await admin.req('/api/places.php', { method: 'POST', body: { query: q } })).status;
  const sres = await Promise.all(['http://127.0.0.1/', 'http://169.254.169.254/latest/meta-data', 'https://google.com.evil.example/maps', 'https://google.com:8443/maps', 'http://www.google.com/maps/place/x', 'https://user:pw@www.google.com/maps'].map(places));
  check('SSRF: IP interna, metadatos de nube, dominio parecido, puerto 8443, http y credenciales se rechazan (400)', sres.every(s => s === 400), sres.join(','));

  // ── Calendario ──
  const cal = await admin.req('/api/calendar.php?action=sync-event', { method: 'POST', body: { event: { name: 'X', date: '2026-13-45' } } });
  check('calendario: una fecha inexistente (2026-13-45) se rechaza (400)', cal.status === 400, String(cal.status));

  // ── Meta: estado de OAuth y secretos fuera de la URL ──
  fs.writeFileSync('/tmp/graph-requests.log', '');
  const mm = new Client('15.1.1.1'); await mm.login('admin', 'Admin-Test-1');
  const art = { id: 'qa-sec', artisticName: 'QA Sec', legalName: '', photo: '', bio: '', genre: 'Rock', subgenres: [], languages: [], startDate: '', city: '', state: '', country: '', label: '', publisher: '', distributor: '', manager: '', bookingAgent: '', socialMedia: { instagram: '@qa.official' }, members: [], pipeline: [], history: [], stage: 'Emergente', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null };
  await mm.req('/api/data.php?action=sync', { method: 'POST', body: { changes: { artists: { upserts: [art] } } } });
  const start = await mm.req('/api/meta.php?action=start', { method: 'POST', body: { artistId: 'qa-sec' } });
  check('Meta: iniciar la conexión devuelve la URL de autorización', /dialog\/oauth\?.*state=/.test(start.j?.url || ''), JSON.stringify(start.j));
  const badState = await mm.req('/api/meta_callback.php?code=FAKECODE&state=falso');
  check('Meta: un «state» falso se rechaza', (badState.headers.get('location') || '').includes('meta=error'));
  const dialog = await fetch(start.j.url, { redirect: 'manual' }); const cbUrl = dialog.headers.get('location');
  const good = await mm.req(cbUrl.replace(/^https?:\/\/[^/]+/, ''));
  check('Meta: el intento falso NO canceló la conexión pendiente: la autorización válida funciona', (good.headers.get('location') || '').includes('meta=ok'), good.headers.get('location'));
  const again = await mm.req(cbUrl.replace(/^https?:\/\/[^/]+/, ''));
  check('Meta: el «state» es de un solo uso (reutilizarlo falla)', (again.headers.get('location') || '').includes('meta=error'));
  const glog = fs.readFileSync('/tmp/graph-requests.log', 'utf8').split('\n').filter(l => /oauth\/access_token|me\/accounts/.test(l));
  const tokLines = glog.filter(l => /oauth\/access_token/.test(l));
  check('Meta: el canje de tokens es POST y el secreto de la app va en el cuerpo, NO en la URL', tokLines.length >= 2 && tokLines.every(l => l.startsWith('POST ') && !/client_secret|fb_exchange_token|code=/.test(l.split(' body=')[0]) && /client_secret/.test(l)), tokLines.join(' | '));
  check('Meta: el token de acceso no viaja en la URL de las consultas (va en la cabecera Authorization)', glog.filter(l => /me\/accounts/.test(l)).every(l => !/access_token/.test(l.split(' body=')[0])), glog.join(' | '));
  const dbTok = execSync(`mariadb flamo_dev -N -e "SELECT token_cifrado FROM artista_conexiones"`).toString();
  check('Meta: el token está cifrado en la base', dbTok.length > 20 && !/LONGTOKEN/.test(dbTok));
  const metaApi = (await mm.req('/api/meta.php?artist_id=qa-sec')).text;
  check('Meta: la API nunca devuelve el token', !/LONGTOKEN|SHORTTOKEN|token_cifrado/.test(metaApi));
  for (let i = 0; i < 14; i++) await mm.req('/api/meta.php?action=sync', { method: 'POST', body: { artistId: 'qa-sec' } });
  check('Meta: sincronizar sin límite está frenado (429)', (await mm.req('/api/meta.php?action=sync', { method: 'POST', body: { artistId: 'qa-sec' } })).status === 429);

  // ── Revisión de Codex: cuota por cuenta resuelta, tope por cuenta, contadores separados, estado ligado al usuario, PUT sin contraseña ──
  const acc = new Client('21.1.1.1'); let q = 0; for (let i = 0; i < 6; i++) { await acc.login('admin', 'x' + i); }
  for (let i = 0; i < 6; i++) q = (await acc.login('admín', 'y' + i)).status;   // «admín» = «admin» para MariaDB (colación sin acentos)
  check('«admín» y «admin» comparten la misma cuota (no se divide con variantes de acento)', q === 429, String(q));
  await admin.req('/api/users.php', { method: 'POST', body: { username: 'sec-cap', name: 'Cap', role: 'Gestor de Contenido', password: 'Password-123' } });
  let cap = 0; for (let i = 0; i < 62; i++) cap = (await new Client('30.2.' + Math.floor(i / 250) + '.' + (i % 250 + 1)).login('sec-cap', 'mala' + i)).status;
  check('tope por cuenta: rotando 62 IPs distintas el atacante igual recibe 429 (no elude el límite cambiando X-Forwarded-For)', cap === 429, String(cap));
  check('…y otra cuenta no se ve afectada', (await new Client('31.1.1.1').login('sec-user', 'Nueva-Clave-456')).status === 200);
  const sd = new Client('32.1.1.1'); await sd.login('sec-user', 'Nueva-Clave-456');
  await admin.req('/api/users.php?id=' + secId, { method: 'PUT', body: { name: 'Sec User Renombrado' } });
  check('un PUT sin contraseña NO toca el hash: la sesión del usuario sigue válida', (await sd.req('/api/data.php')).status === 200);
  let rf = []; for (let i = 0; i < 24; i++) rf.push((await mm.req('/api/social.php?action=refresh', { method: 'POST', body: { artistId: 'qa-sec' } })).status);
  const ft = (await mm.req('/api/social.php?action=fetch', { method: 'POST', body: { artistId: 'qa-sec', platform: 'instagram' } })).status;
  check('contadores separados: agotar «refresh» no consume el cupo de «fetch»', !rf.includes(429) && ft !== 429, `${rf.filter(x => x === 429).length} límites en refresh, fetch=${ft}`);
  const st2 = await mm.req('/api/meta.php?action=start', { method: 'POST', body: { artistId: 'qa-sec' } });
  const swap = new Client('33.1.1.1'); swap.jar = { ...mm.jar }; await swap.login('sec-user', 'Nueva-Clave-456');   // otra cuenta se autentica en el mismo navegador
  const dlg = await fetch(st2.j.url, { redirect: 'manual' }); const cb2 = (dlg.headers.get('location') || '').replace(/^https?:\/\/[^/]+/, '');
  const r2 = await swap.req(cb2);
  check('Meta: un flujo pendiente NO lo hereda otra cuenta que inicia sesión en el mismo navegador', (r2.headers.get('location') || '').includes('meta=error'), r2.headers.get('location'));

  // ── Última protección: no se puede dejar al CRM sin Super Admin ──
  const adminId = list.find(u => u.username === 'admin').id;
  const dl = await admin.req('/api/users.php?id=' + adminId, { method: 'DELETE' });
  check('no se puede borrar tu propia cuenta ni dejar al CRM sin Super Admin', dl.status === 400);
  const dg = await admin.req('/api/users.php?id=' + adminId, { method: 'PUT', body: { role: 'Administrador' } });
  check('ni degradar al único Super Admin', dg.status === 400, JSON.stringify(dg.j));

  console.log('TOTAL ok=' + ok.length + ' bad=' + bad.length); console.log(ok.map(x => '  ✓ ' + x).join('\n')); console.log(bad.length ? 'FALLOS:\n' + bad.map(x => '  ✗ ' + x).join('\n') : 'Sin fallos'); process.exit(bad.length ? 1 : 0);
})();
