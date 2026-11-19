<?php
declare(strict_types=1);
// Pruebas automatizadas de la base de datos de FLAMO CRM.
// Uso:  php tests/db/run.php        (requiere MySQL/MariaDB; ver tests/db/lib.php)
require __DIR__ . '/lib.php';
require API . '/schema.php';
require API . '/entities.php';
require __DIR__ . '/seed_v1.php';

$pdo = t_pdo();
$fresh = function () use ($pdo): void { t_reset($pdo); catalog_cache_clear(); };
$T = '2026-11-18T12:00:00.000Z';
$art = fn(string $id, string $name, array $x = []) => $x + ['id' => $id, 'artisticName' => $name, 'legalName' => "$name SA", 'photo' => '', 'bio' => 'Bío con ñ 🎸', 'genre' => 'Rock', 'subgenres' => [], 'languages' => ['Español'], 'startDate' => '2019-05-01', 'city' => 'CDMX', 'state' => 'CDMX', 'country' => 'México', 'members' => ['A'], 'manager' => '', 'bookingAgent' => '', 'label' => '', 'publisher' => '', 'distributor' => '', 'stage' => 'Emergente', 'socialMedia' => ['instagram' => '@x'], 'pipeline' => [], 'history' => [], 'created_at' => $GLOBALS['T'], 'updated_at' => $GLOBALS['T'], 'deleted_at' => null];
$ven = fn(string $id, string $name, array $x = []) => $x + ['id' => $id, 'name' => $name, 'address' => 'Calle 1', 'city' => 'CDMX', 'state' => 'CDMX', 'country' => 'México', 'postalCode' => '06000', 'lat' => 19.4326, 'lng' => -99.1332, 'website' => '', 'phone' => '', 'rating' => 4.5, 'userRatingsCount' => 10, 'placeId' => '', 'establishmentType' => 'Teatro', 'hours' => ['L-V'], 'scoreRentabilidad' => 80, 'scoreResponseTime' => 70, 'scorePuntualidadPago' => 60, 'scoreNegociacion' => 50, 'scoreProduccion' => 90, 'scoreHospitalidad' => 85, 'providerIds' => [], 'created_at' => $GLOBALS['T'], 'updated_at' => $GLOBALS['T'], 'deleted_at' => null];
$evt = fn(string $id, string $aid, string $vid, array $x = []) => $x + ['id' => $id, 'name' => "Show $id", 'artistId' => $aid, 'venueId' => $vid, 'date' => '2026-12-20', 'capacity' => 500, 'attendance' => 450, 'ticketPrice' => 350.5, 'totalIncome' => 160000, 'expenses' => 50000, 'profit' => 110000, 'status' => 'Confirmed', 'created_at' => $GLOBALS['T'], 'updated_at' => $GLOBALS['T'], 'deleted_at' => null];
$tour = fn(string $id, string $aid, array $x = []) => $x + ['id' => $id, 'name' => "Gira $id", 'artistId' => $aid, 'startDate' => '2026-03-01', 'endDate' => '2026-06-01', 'status' => 'Active', 'created_at' => $GLOBALS['T'], 'updated_at' => $GLOBALS['T'], 'deleted_at' => null];
$ctr = fn(string $id, array $x = []) => $x + ['id' => $id, 'title' => "Contrato $id", 'fileName' => 'c.pdf', 'fileSize' => '2.4 MB', 'status' => 'Signed', 'uploadedAt' => $GLOBALS['T'], 'type' => 'Booking'];
$up = fn(string $key, array ...$objs) => [$key => ['upserts' => $objs]];
$sync = fn(array ...$parts) => apply_changes($pdo, array_merge_recursive(...$parts));
$count = fn(string $sql, array $a = []) => (int)t_scalar($pdo, $sql, $a);

// ═══════════════════════════════════════════════════════════
t_section('1. Migraciones: instalación nueva');
$fresh();
$applied = migrate_up($pdo);
t_eq($applied, [1, 2, 3], 'se aplican las 3 migraciones en orden');
foreach (['artistas','venues','contactos','contacto_correos','contacto_telefonos','venue_contactos','artista_contactos','proveedor_contactos','evento_artistas','tour_artistas','artista_generos','cat_generos','cat_roles_contacto','cat_monedas','eventos','tours','contratos','proveedores','proyectos_grabacion','venue_proveedores','cat_etapas_desarrollo','schema_migrations'] as $tb) t_ok(db_table_exists($pdo, $tb), "existe la tabla $tb");
t_eq(migrate_up($pdo), [], 'volver a migrar no hace nada (idempotente)');
t_eq($count('SELECT COUNT(*) FROM cat_etapas_desarrollo'), 7, 'catálogo de etapas sembrado');

t_section('2. Migraciones: actualizar desde v1 con datos existentes');
$fresh(); migrate_up($pdo, 1); seed_v1($pdo);
$before = ['art' => $count('SELECT COUNT(*) FROM artistas'), 'ven' => $count('SELECT COUNT(*) FROM venues'), 'evt' => $count('SELECT COUNT(*) FROM eventos'), 'ctr' => $count('SELECT COUNT(*) FROM contratos'), 'con' => $count('SELECT COUNT(*) FROM contactos'), 'prov' => $count('SELECT COUNT(*) FROM proveedores'), 'tour' => $count('SELECT COUNT(*) FROM tours')];
migrate_up($pdo);
t_eq($count('SELECT COUNT(*) FROM artistas'), $before['art'], 'no se pierden artistas');
t_eq($count('SELECT COUNT(*) FROM venues'), $before['ven'], 'no se pierden venues');
t_eq($count('SELECT COUNT(*) FROM eventos'), $before['evt'], 'no se pierden eventos');
t_eq($count('SELECT COUNT(*) FROM contratos'), $before['ctr'], 'no se pierden contratos');
t_eq($count('SELECT COUNT(*) FROM proveedores'), $before['prov'], 'no se pierden proveedores');
t_eq($count('SELECT COUNT(*) FROM tours'), $before['tour'], 'no se pierden giras');
t_eq($count('SELECT COUNT(*) FROM venue_contactos'), $before['con'], 'cada contacto de venue queda vinculado a su venue');
t_eq(array_column($pdo->query("SELECT g.nombre FROM artista_generos ag JOIN cat_generos g ON g.id=ag.genero_id WHERE artista_id='art-1' ORDER BY orden")->fetchAll(), 'nombre'), ['Indie Rock', 'Pop', 'Urbano', 'Indie'], 'géneros separados y sin duplicados («Pop» no se repite)');
t_eq($count("SELECT COUNT(*) FROM artista_generos WHERE artista_id='art-1' AND es_principal=1"), 1, 'un solo género principal');
t_eq($count("SELECT COUNT(DISTINCT contacto_id) FROM artista_contactos ac JOIN cat_roles_contacto r ON r.id=ac.rol_id WHERE r.nombre='Manager'"), 1, 'mismo manager («Andrés Mendoza»/«andrés mendoza») = un contacto');
t_eq($count("SELECT COUNT(*) FROM cat_roles_contacto WHERE nombre IN ('Booking','booking')"), 1, 'los roles «Booking» y «booking» se unifican');
t_eq($count("SELECT COUNT(*) FROM venue_contactos WHERE venue_id='ven-1' AND es_principal=1"), 1, 'el contacto principal del venue se conserva');
t_eq((string)t_scalar($pdo, "SELECT contacto_id FROM venue_contactos WHERE venue_id='ven-1' AND es_principal=1"), 'con-1', '…y es el mismo (con-1)');
t_eq($count("SELECT COUNT(*) FROM contacto_correos WHERE contacto_id='con-1' AND correo='ana@foro.com'"), 1, 'el correo del contacto pasó a contacto_correos');
t_eq($count("SELECT COUNT(*) FROM evento_artistas WHERE es_principal=1"), 3, 'cada evento tiene su artista principal en evento_artistas');
t_eq($count("SELECT COUNT(*) FROM tour_artistas WHERE es_principal=1"), 1, 'la gira tiene su artista en tour_artistas');
t_eq((int)t_scalar($pdo, "SELECT tamano_bytes FROM contratos WHERE id='ctr-1'"), 2516582, 'el tamaño del contrato pasó a bytes');
t_eq((string)t_scalar($pdo, "SELECT DATE_FORMAT(created_at,'%Y-%m-%d %H:%i') FROM artistas WHERE id='art-1'"), '2026-03-01 10:00', 'las fechas ISO pasaron a DATETIME');
t_ok($count("SELECT COUNT(*) FROM proveedor_contactos") === 1, 'el contacto del proveedor pasó a contactos (el proveedor sin datos no genera contacto vacío)');
$notes = (string)t_scalar($pdo, 'SELECT notas FROM schema_migrations WHERE version = 3'); t_ok(str_contains($notes, 'eventos→evento_artistas=3'), 'la migración deja constancia de lo migrado', $notes);

t_section('3. Migraciones: idempotencia por paso y reanudación');
$migs = load_migrations(); $snapshot = $count('SELECT COUNT(*) FROM artista_generos') . '|' . $count('SELECT COUNT(*) FROM contactos') . '|' . $count('SELECT COUNT(*) FROM evento_artistas');
foreach ([2, 3] as $id) { try { ($migs[$id]['up'])($pdo); t_ok(true, "ejecutar de nuevo la migración $id no falla ni duplica"); } catch (Throwable $e) { t_ok(false, "migración $id repetida", $e->getMessage()); } }
t_eq($count('SELECT COUNT(*) FROM artista_generos') . '|' . $count('SELECT COUNT(*) FROM contactos') . '|' . $count('SELECT COUNT(*) FROM evento_artistas'), $snapshot, 'los conteos no cambian tras repetir');

t_section('4. Migraciones: rollback sin pérdida de datos');
t_eq(migrate_down($pdo, 1), [3, 2], 'se revierten 3 y 2 en orden inverso');
t_eq((string)t_scalar($pdo, "SELECT artista_id FROM eventos WHERE id='evt-3'"), 'art-1', 'eventos.artista_id restaurado desde evento_artistas');
t_eq((string)t_scalar($pdo, "SELECT genero FROM artistas WHERE id='art-1'"), 'Indie Rock', 'artistas.genero restaurado (género principal)');
t_eq((string)t_scalar($pdo, "SELECT manager FROM artistas WHERE id='art-1'"), 'Andrés Mendoza', 'artistas.manager restaurado');
t_eq($count('SELECT COUNT(*) FROM contactos'), 3, 'contactos legacy restaurados (3)');
t_eq((string)t_scalar($pdo, "SELECT contacto_principal_id FROM venues WHERE id='ven-1'"), 'con-1', 'contacto principal del venue restaurado');
t_eq((string)t_scalar($pdo, "SELECT correo FROM contactos WHERE id='con-1'"), 'ana@foro.com', 'correo del contacto restaurado');
t_eq((string)t_scalar($pdo, "SELECT contacto FROM proveedores WHERE id='prov-1'"), 'Luis Sonido', 'contacto del proveedor restaurado');
t_eq((string)t_scalar($pdo, "SELECT tamano FROM contratos WHERE id='ctr-1'"), '2.4 MB', 'tamaño legible del contrato restaurado');
t_eq((string)t_scalar($pdo, "SELECT created_at FROM artistas WHERE id='art-1'"), '2026-03-01T10:00:00.000Z', 'fecha ISO restaurada');
t_ok(!db_table_exists($pdo, 'evento_artistas') && !db_table_exists($pdo, 'cat_generos'), 'las tablas nuevas desaparecen');
t_eq(migrate_up($pdo), [2, 3], 'se puede volver a subir');
t_eq($count('SELECT COUNT(*) FROM evento_artistas'), 3, '…y los datos se vuelven a migrar');

t_section('5. Migraciones: datos fuera de dominio abortan sin cambiar nada');
$fresh(); migrate_up($pdo, 1); seed_v1($pdo);
$pdo->exec("UPDATE eventos SET estado = 'Cualquier cosa' WHERE id = 'evt-2'");
$msg = t_throws(fn() => migrate_up($pdo), 'la migración 002 se niega a correr', 'fuera de dominio');
t_ok(!db_col_exists($pdo, 'artistas', 'version'), 'no quedó ningún cambio a medias');
t_eq(array_map('intval', array_column($pdo->query('SELECT version FROM schema_migrations')->fetchAll(), 'version')), [1], 'solo la línea base figura como aplicada');

t_section('6. Compatibilidad con el formato JSON más antiguo (colección única)');
$fresh(); migrate_up($pdo, 1);
$pdo->exec('CREATE TABLE collections (name VARCHAR(40) NOT NULL PRIMARY KEY, data LONGTEXT NOT NULL, updated_at VARCHAR(25) NOT NULL, updated_by VARCHAR(64) NOT NULL)');
$ins = $pdo->prepare('INSERT INTO collections VALUES (?,?,?,?)');
$ins->execute(['artists', json_encode([$art('art-9', 'Legacy', ['genre' => 'Cumbia, Pop'])]), $T, 'admin']);
$ins->execute(['venues', json_encode([$ven('ven-9', 'Foro Legacy')]), $T, 'admin']);
$ins->execute(['events', json_encode([$evt('evt-9', 'art-9', 'ven-9'), $evt('evt-huerfano', 'art-9', 'ven-inexistente')]), $T, 'admin']);
ensure_schema($pdo);
$all = load_all($pdo);
t_eq(count($all['artists']), 1, 'el artista del JSON antiguo se importó');
t_eq($all['artists'][0]['genre'], 'Cumbia', '…con su género principal');
t_eq($all['artists'][0]['subgenres'], ['Pop'], '…y su subgénero');
t_eq(count($all['events']), 1, 'el evento válido se importó y el huérfano se descartó (sin romper la importación)');

// ═══════════════════════════════════════════════════════════
t_section('7. API: ida y vuelta de objetos (compatibilidad con la interfaz)');
$fresh(); migrate_up($pdo);
$a1 = $art('art-1', 'Banda Uno', ['genre' => 'Indie Rock, Pop', 'subgenres' => ['Urbano'], 'manager' => 'Andrés Mendoza', 'bookingAgent' => 'Ana Booking']);
$a2 = $art('art-2', 'Banda Dos', ['genre' => 'Jazz', 'manager' => 'andrés mendoza']);
$v1 = $ven('ven-1', 'Foro Uno', ['providerIds' => ['prov-1'], 'contactoPrincipalId' => 'con-1']);
$p1 = ['id' => 'prov-1', 'name' => 'Sonido SA', 'category' => 'Sonido', 'contactName' => 'Luis Sonido', 'phone' => '555-9', 'email' => 'luis@sonido.com', 'rating' => 4.5, 'costPerShow' => 15000.5, 'notes' => 'ok', 'venueIds' => ['ven-1'], 'created_at' => $T];
$c1 = ['id' => 'con-1', 'name' => 'Ana López', 'email' => 'ana@foro.com', 'phone' => '555-0001', 'role' => 'Booking', 'venueId' => 'ven-1'];
$stats = apply_changes($pdo, ['artists' => ['upserts' => [$a1, $a2]], 'venues' => ['upserts' => [$v1]], 'providers' => ['upserts' => [$p1]], 'contacts' => ['upserts' => [$c1]]]);
$all = load_all($pdo);
$byId = fn(array $arr, string $id) => current(array_filter($arr, fn($x) => $x['id'] === $id));
$ra = $byId($all['artists'], 'art-1');
t_eq([$ra['genre'], $ra['subgenres']], ['Indie Rock', ['Pop', 'Urbano']], 'género: principal + subgéneros');
t_eq([$ra['manager'], $ra['bookingAgent']], ['Andrés Mendoza', 'Ana Booking'], 'manager y booking salen como texto (desde contactos)');
t_eq($count('SELECT COUNT(DISTINCT contacto_id) FROM artista_contactos ac JOIN cat_roles_contacto r ON r.id=ac.rol_id WHERE r.nombre=?', ['Manager']), 1, 'dos artistas con el mismo manager comparten un solo contacto');
t_ok(isset($ra['version']) && $ra['version'] === 1, 'cada registro trae su versión (1)');
t_eq($ra['bio'], 'Bío con ñ 🎸', 'los campos anidados (bio con ñ y emoji) se conservan');
$rc = $byId($all['contacts'], 'con-1');
t_eq([$rc['name'], $rc['email'], $rc['phone'], $rc['role'], $rc['venueId']], ['Ana López', 'ana@foro.com', '555-0001', 'Booking', 'ven-1'], 'contacto en formato anterior: mismos campos');
t_eq($byId($all['venues'], 'ven-1')['contactoPrincipalId'], 'con-1', 'el contacto principal del venue se conserva');
t_eq($byId($all['venues'], 'ven-1')['providerIds'], ['prov-1'], 'venue ↔ proveedor (N:M)');
$rp = $byId($all['providers'], 'prov-1');
t_eq([$rp['contactName'], $rp['phone'], $rp['email'], $rp['venueIds']], ['Luis Sonido', '555-9', 'luis@sonido.com', ['ven-1']], 'proveedor: contacto y venues');
t_ok(in_array('contacts', $stats['dirty'], true), 'la respuesta avisa que los contactos cambiaron en el servidor (se crearon contactos)');

t_section('8. Eventos con varios artistas y giras compartidas');
$tr = $tour('tour-1', 'art-1', ['artistIds' => ['art-1', 'art-2']]);
$e1 = $evt('evt-1', 'art-1', 'ven-1', ['tourId' => 'tour-1', 'artists' => [
    ['artistId' => 'art-2', 'role' => 'Telonero', 'order' => 1, 'startTime' => '20:00', 'endTime' => '21:00', 'fee' => 5000, 'currency' => 'USD', 'status' => 'Confirmado'],
    ['artistId' => 'art-1', 'role' => 'Artista', 'order' => 2, 'isPrincipal' => true, 'startTime' => '21:30', 'fee' => 25000.5],
    ['artistId' => 'art-2', 'role' => 'Invitado', 'order' => 3]]]);   // mismo artista, segunda presentación
$sync($up('tours', $tr), $up('events', $e1));
$all = load_all($pdo); $re = $byId($all['events'], 'evt-1'); $rt = $byId($all['tours'], 'tour-1');
t_eq($re['artistId'], 'art-1', 'artistId = artista principal');
t_eq(array_map(fn($x) => [$x['artistId'], $x['role'], $x['order']], $re['artists']), [['art-2', 'Telonero', 1], ['art-1', 'Artista', 2], ['art-2', 'Invitado', 3]], 'alineación con orden y roles; un artista puede presentarse dos veces');
t_eq([$re['artists'][0]['startTime'], $re['artists'][0]['fee'], $re['artists'][0]['currency']], ['20:00', 5000.0, 'USD'], 'horario, honorarios y moneda');
t_eq($rt['artistIds'], ['art-1', 'art-2'], 'gira con dos artistas (principal primero)');
t_eq($re['profit'], 110000.0, 'utilidad = ingreso − gastos (calculada)');
$e1b = $e1; $e1b['profit'] = 999; $e1b['version'] = $re['version']; $sync($up('events', $e1b));
t_eq($byId(load_all($pdo)['events'], 'evt-1')['profit'], 110000.0, 'una utilidad enviada a mano se ignora (no se desajusta)');
t_eq((float)t_scalar($pdo, "SELECT ingreso_total FROM eventos WHERE id='evt-1'"), 160000.0, 'el ingreso se captura aparte (puede no ser asistencia × precio)');
// formato antiguo: solo artistId
$sync($up('events', $evt('evt-2', 'art-2', 'ven-1')));
$re2 = $byId(load_all($pdo)['events'], 'evt-2');
t_eq([$re2['artistId'], count($re2['artists']), $re2['artists'][0]['role']], ['art-2', 1, 'Artista'], 'un evento con solo artistId (interfaz anterior) crea su fila en evento_artistas');
$sync($up('tours', $tour('tour-2', 'art-1')));
t_eq($byId(load_all($pdo)['tours'], 'tour-2')['artistIds'], ['art-1'], 'una gira con solo artistId (interfaz anterior) también funciona');

t_section('9. Contactos centralizados');
$ct = ['id' => 'con-2', 'name' => 'María García', 'firstName' => 'María', 'lastName' => 'García', 'emails' => [['value' => 'm@x.com', 'primary' => true], ['value' => 'm2@x.com', 'label' => 'personal']], 'phones' => [['value' => '555-1', 'label' => 'Móvil', 'primary' => true]],
       'links' => [['type' => 'venue', 'id' => 'ven-1', 'role' => 'Hospitalidad'], ['type' => 'artist', 'id' => 'art-1', 'role' => 'Manager'], ['type' => 'provider', 'id' => 'prov-1', 'role' => 'Contacto comercial']]];
$sync($up('contacts', $ct));
$rc = $byId(load_all($pdo)['contacts'], 'con-2');
t_eq([count($rc['emails']), count($rc['phones']), count($rc['links'])], [2, 1, 3], 'un contacto con 2 correos, 1 teléfono y 3 vínculos (venue, artista, proveedor)');
t_eq([$rc['lastName'], $rc['email'], $rc['venueId']], ['García', 'm@x.com', 'ven-1'], 'apellidos separados; el correo principal y venueId compatibles');
t_eq($count("SELECT COUNT(*) FROM venue_contactos WHERE contacto_id='con-2'") + $count("SELECT COUNT(*) FROM artista_contactos WHERE contacto_id='con-2'") + $count("SELECT COUNT(*) FROM proveedor_contactos WHERE contacto_id='con-2'"), 3, 'el mismo contacto existe en las tres entidades sin duplicarse');
// cambiar contacto principal del venue
$v1b = $byId(load_all($pdo)['venues'], 'ven-1'); $v1b['contactoPrincipalId'] = 'con-2'; $sync($up('venues', $v1b));
t_eq((string)t_scalar($pdo, "SELECT contacto_id FROM venue_contactos WHERE venue_id='ven-1' AND es_principal=1"), 'con-2', 'cambiar el contacto principal del venue');
t_eq($count("SELECT COUNT(*) FROM venue_contactos WHERE venue_id='ven-1' AND es_principal=1"), 1, '…y sigue habiendo uno solo');
// borrar el venue no borra al contacto (es independiente)
$sync(['contacts' => ['upserts' => [array_merge($ct, ['id' => 'con-3', 'name' => 'Solo en venue', 'firstName' => 'Solo', 'lastName' => 'en venue', 'emails' => [], 'phones' => [], 'links' => [['type' => 'venue', 'id' => 'ven-2', 'role' => 'Booking']]])]], 'venues' => ['upserts' => [$ven('ven-2', 'Foro Dos')]]]);
$sync(['venues' => ['deletes' => ['ven-2']]]);
t_eq([$count("SELECT COUNT(*) FROM contactos WHERE id='con-3'"), $count("SELECT COUNT(*) FROM venue_contactos WHERE contacto_id='con-3'")], [1, 0], 'al borrar el venue se elimina el vínculo, no la persona');

// ═══════════════════════════════════════════════════════════
t_section('10. Restricciones de unicidad');
$pdo->exec("INSERT INTO cat_generos (nombre) VALUES ('Salsa')"); $gid = (int)$pdo->lastInsertId();
t_throws(fn() => $pdo->exec("INSERT INTO cat_generos (nombre) VALUES ('salsa')"), 'género duplicado en el catálogo (sin distinguir mayúsculas)');
t_throws(fn() => $pdo->exec("INSERT INTO artista_generos (artista_id, genero_id, es_principal, orden) VALUES ('art-1', (SELECT id FROM cat_generos WHERE nombre='Indie Rock'), NULL, 9)"), 'el mismo género dos veces en un artista');
$pdo->exec("INSERT INTO artista_generos (artista_id, genero_id, es_principal, orden) VALUES ('art-2', $gid, NULL, 9)");
t_throws(fn() => $pdo->exec("UPDATE artista_generos SET es_principal = 1 WHERE artista_id='art-2' AND genero_id=$gid"), 'un segundo género principal en el mismo artista');
t_throws(fn() => $pdo->exec("INSERT INTO evento_artistas (evento_id, artista_id, orden_presentacion) VALUES ('evt-1','art-2',1)"), 'participación duplicada (mismo evento, artista y orden)');
t_ok($pdo->exec("INSERT INTO evento_artistas (evento_id, artista_id, orden_presentacion, rol) VALUES ('evt-1','art-2',4,'Soporte')") === 1, 'el mismo artista con otro orden sí se permite (varias presentaciones)');
t_throws(fn() => $pdo->exec("UPDATE evento_artistas SET es_principal = 1 WHERE evento_id='evt-1' AND artista_id='art-2' AND orden_presentacion=4"), 'un segundo artista principal en el evento');
t_throws(fn() => $pdo->exec("INSERT INTO venue_contactos (venue_id, contacto_id, rol_id, es_principal) VALUES ('ven-1','con-1',(SELECT id FROM cat_roles_contacto WHERE nombre='Booking'),1)"), 'un segundo contacto principal en el venue');
t_throws(fn() => $pdo->exec("INSERT INTO contacto_correos (contacto_id, correo) VALUES ('con-2','m@x.com')"), 'el mismo correo dos veces en un contacto');
t_ok($pdo->exec("INSERT INTO contacto_correos (contacto_id, correo) VALUES ('con-1','m@x.com')") === 1, 'un mismo correo en dos personas distintas sí se permite (buzón compartido)');
t_throws(fn() => $pdo->exec("INSERT INTO tour_artistas (tour_id, artista_id) VALUES ('tour-1','art-1')"), 'artista repetido en la misma gira');

t_section('11. Restricciones de dominio (CHECK) y validación en PHP');
foreach ([['venues', "UPDATE venues SET score_rentabilidad = 500 WHERE id='ven-1'", 'puntaje 500'], ['venues', "UPDATE venues SET rating = 9.9 WHERE id='ven-1'", 'rating 9.9'],
          ['eventos', "UPDATE eventos SET estado = 'Cualquier cosa' WHERE id='evt-1'", 'estado de evento inventado'], ['eventos', "UPDATE eventos SET asistencia = -1 WHERE id='evt-1'", 'asistencia negativa'],
          ['tours', "UPDATE tours SET fecha_fin = '2020-01-01' WHERE id='tour-1'", 'gira que termina antes de empezar'], ['eventos', "UPDATE eventos SET utilidad = 1 WHERE id='evt-1'", 'utilidad ≠ ingreso − gastos'],
          ['evento_artistas', "UPDATE evento_artistas SET honorarios = -5 WHERE evento_id='evt-1' AND orden_presentacion=1", 'honorarios negativos'], ['evento_artistas', "UPDATE evento_artistas SET rol = 'Rey' WHERE evento_id='evt-1' AND orden_presentacion=1", 'rol inválido']] as [$t, $sql, $name])
    t_throws(fn() => $pdo->exec($sql), "la base rechaza: $name");
t_throws(fn() => $sync($up('events', $evt('evt-x', 'art-1', 'ven-1', ['status' => 'Cualquier cosa']))), 'PHP: estado inválido con mensaje claro', 'Valores permitidos');
t_throws(fn() => $sync($up('venues', $ven('ven-x', 'X', ['rating' => 7]))), 'PHP: rating fuera de rango', 'calificación');
t_throws(fn() => $sync($up('contracts', $ctr('c-x', ['type' => 'Inventado']))), 'PHP: tipo de contrato inválido', 'tipo');
t_throws(fn() => $sync($up('events', $evt('evt-y', 'art-1', 'ven-1', ['artists' => [['artistId' => 'art-1', 'role' => 'Rey']]]))), 'PHP: rol de alineación inválido', 'rol');
t_throws(fn() => $sync($up('events', $evt('evt-z', 'art-1', 'ven-1', ['artists' => [['artistId' => 'art-1', 'order' => 1], ['artistId' => 'art-1', 'order' => 1]]]))), 'PHP: el mismo artista con el mismo orden', 'mismo orden');
t_throws(fn() => $sync($up('events', $evt('evt-w', '', 'ven-1', ['artists' => []]))), 'PHP: evento sin artistas', 'al menos un artista');

t_section('12. Integridad referencial e historial contractual');
$sync($up('contracts', $ctr('ctr-1', ['artistId' => 'art-1', 'venueId' => 'ven-1', 'tourId' => 'tour-1', 'eventId' => 'evt-1'])));
t_throws(fn() => $sync(['venues' => ['deletes' => ['ven-1']]]), 'no se puede borrar un venue con eventos/contratos', 'constraint');
t_throws(fn() => $sync(['events' => ['deletes' => ['evt-1']]]), 'no se puede borrar un evento con contrato (el historial no se pierde por cascada)');
t_eq($count("SELECT COUNT(*) FROM contratos WHERE id='ctr-1'"), 1, 'el contrato sigue ahí tras los intentos de borrado');
t_throws(fn() => $sync(['artists' => ['deletes' => ['art-2']]]), 'no se puede borrar un artista que participa en eventos o giras');
t_throws(fn() => $sync($up('events', $evt('evt-ghost', 'art-1', 'ven-inexistente'))), 'evento con venue inexistente');
$art1 = $byId(load_all($pdo)['artists'], 'art-1'); $art1['deleted_at'] = '2026-11-19T00:00:00.000Z'; $sync($up('artists', $art1));
t_eq([$count("SELECT COUNT(*) FROM artistas WHERE id='art-1' AND deleted_at IS NOT NULL"), (string)t_scalar($pdo, "SELECT artista_id FROM contratos WHERE id='ctr-1'")], [1, 'art-1'], 'desactivar (borrado lógico) un artista conserva su contrato');
t_throws(fn() => $sync($up('events', $evt('evt-t', 'art-1', 'ven-1', ['tourId' => 'tour-1', 'artists' => [['artistId' => 'art-1'], ['artistId' => 'art-3']]]))), 'un evento no puede incluir artistas ajenos a su gira (art-3 no está en la gira)');
$a3 = $art('art-3', 'Tercero'); $sync($up('artists', $a3));
$msg = t_throws(fn() => $sync($up('tours', $tour('tour-1', 'art-1', ['artistIds' => ['art-1'], 'version' => $byId(load_all($pdo)['tours'], 'tour-1')['version']]))), 'no se puede quitar de la gira a un artista que tiene eventos en ella', 'no se puede quitar');
$sync($up('tours', $tour('tour-3', 'art-1'))); $sync(['tours' => ['deletes' => ['tour-3']]]);
$sync(['events' => ['upserts' => [$byId(load_all($pdo)['events'], 'evt-2')]]]);   // sin cambios
$sync(['contracts' => ['deletes' => ['ctr-1']]]); $sync(['events' => ['deletes' => ['evt-2']]]);
t_eq($count("SELECT COUNT(*) FROM evento_artistas WHERE evento_id='evt-2'"), 0, 'al borrar un evento se borra su alineación (CASCADE)');
$sync(['events' => ['deletes' => ['evt-1']]]); $sync(['tours' => ['deletes' => ['tour-1']]]);
t_eq($count("SELECT COUNT(*) FROM tour_artistas WHERE tour_id='tour-1'"), 0, 'al borrar una gira se borran sus artistas (CASCADE)');

// ═══════════════════════════════════════════════════════════
t_section('13. Atomicidad (todo o nada)');
$fresh(); migrate_up($pdo);
$sync($up('artists', $art('art-1', 'Base')), $up('venues', $ven('ven-1', 'Foro')));
$n0 = [$count('SELECT COUNT(*) FROM artistas'), $count('SELECT COUNT(*) FROM venues'), $count('SELECT COUNT(*) FROM eventos')];
t_throws(fn() => $sync($up('artists', $art('art-new', 'Nuevo')), $up('events', $evt('evt-ok', 'art-1', 'ven-1'), $evt('evt-bad', 'art-1', 'ven-1', ['status' => 'Inventado']))), 'lote con un registro inválido al final');
t_eq([$count('SELECT COUNT(*) FROM artistas'), $count('SELECT COUNT(*) FROM venues'), $count('SELECT COUNT(*) FROM eventos')], $n0, 'ROLLBACK completo: no quedó ni el artista nuevo ni el evento válido');
t_throws(fn() => $sync($up('artists', $art('art-new2', 'Nuevo2')), $up('events', $evt('evt-fk', 'art-1', 'ven-fantasma'))), 'lote con violación de llave foránea');
t_eq($count("SELECT COUNT(*) FROM artistas WHERE id='art-new2'"), 0, 'ROLLBACK ante error de la base');
t_throws(fn() => $sync($up('artists', $art('art-new3', 'Nuevo3'), $art('art-bad', 'Mal', ['stage' => 'Inventada']))), 'lote con etapa inválida');
t_eq($count("SELECT COUNT(*) FROM artistas WHERE id='art-new3'"), 0, 'ROLLBACK: el artista válido anterior no se guarda');
// fallo en una fila hija (a mitad de la operación compuesta de un evento)
t_throws(fn() => $sync($up('events', $evt('evt-half', 'art-1', 'ven-1', ['artists' => [['artistId' => 'art-1'], ['artistId' => 'art-no-existe']]]))), 'evento cuya alineación falla a la mitad');
t_eq([$count("SELECT COUNT(*) FROM eventos WHERE id='evt-half'"), $count("SELECT COUNT(*) FROM evento_artistas WHERE evento_id='evt-half'")], [0, 0], 'ROLLBACK: no queda el evento ni media alineación');
t_ok(!$pdo->inTransaction(), 'no quedan transacciones abiertas');
$sync($up('events', $evt('evt-p', 'art-1', 'ven-1')));
$other = t_pdo();
t_eq((int)$other->query("SELECT COUNT(*) FROM eventos WHERE id='evt-p'")->fetchColumn(), 1, 'DURABILIDAD: lo confirmado lo ve otra conexión');
t_ok(in_array((string)($pdo->query("SHOW VARIABLES WHERE Variable_name IN ('transaction_isolation','tx_isolation')")->fetch()['Value'] ?? ''), ['REPEATABLE-READ', 'READ-COMMITTED', 'SERIALIZABLE']), 'nivel de aislamiento: ' . ($pdo->query("SHOW VARIABLES WHERE Variable_name IN ('transaction_isolation','tx_isolation')")->fetch()['Value'] ?? '?'));

t_section('14. Concurrencia');
$cur = $byId(load_all($pdo)['artists'], 'art-1');                         // dos personas cargan la misma versión
$mine = $cur; $mine['bio'] = 'Cambio de Ana';
$theirs = $cur; $theirs['bio'] = 'Cambio de Luis';
$r = $sync($up('artists', $mine));
t_eq($r['versions']['artists']['art-1'], $cur['version'] + 1, 'la primera escritura sube la versión');
$m = t_throws(fn() => $sync($up('artists', $theirs)), 'la segunda escritura (versión vieja) se rechaza', 'modificado por otra persona');
t_eq($byId(load_all($pdo)['artists'], 'art-1')['bio'], 'Cambio de Ana', 'no se pisó el cambio de la primera persona (sin actualizaciones perdidas)');
$theirs['version'] = $cur['version'] + 1; $sync($up('artists', $theirs));
t_eq($byId(load_all($pdo)['artists'], 'art-1')['bio'], 'Cambio de Luis', 'con la versión actual, la segunda persona sí puede guardar');
// bloqueo de fila: otra conexión mantiene la fila bloqueada
$lock = t_pdo(); $lock->beginTransaction(); $lock->query("SELECT id FROM artistas WHERE id='art-1' FOR UPDATE")->fetchAll();
$pdo->exec('SET SESSION innodb_lock_wait_timeout = 2');
$cur2 = $byId(load_all($pdo)['artists'], 'art-1'); $cur2['bio'] = 'espera';
$t0 = microtime(true); $thrown = null; try { apply_changes($pdo, $up('artists', $cur2)); } catch (PDOException $e) { $thrown = (int)($e->errorInfo[1] ?? 0); }
t_ok($thrown === 1205 && (microtime(true) - $t0) >= 1.5, 'AISLAMIENTO: una escritura espera al bloqueo de la fila y expira con error 1205 (no se mezcla)', "errno=$thrown");
t_ok(!$pdo->inTransaction(), '…y no deja transacción abierta');
$lock->rollBack(); $pdo->exec('SET SESSION innodb_lock_wait_timeout = 50');
$sync($up('artists', array_merge($cur2, ['version' => $byId(load_all($pdo)['artists'], 'art-1')['version']])));
t_eq($byId(load_all($pdo)['artists'], 'art-1')['bio'], 'espera', 'liberado el bloqueo, la escritura prospera');
// dos registros distintos al mismo tiempo no se pisan
$x = $byId(load_all($pdo)['venues'], 'ven-1'); $y = $byId(load_all($pdo)['artists'], 'art-1');
$x['name'] = 'Foro editado'; $y['bio'] = 'otra'; $sync($up('venues', $x)); $sync($up('artists', $y));
t_eq([$byId(load_all($pdo)['venues'], 'ven-1')['name'], $byId(load_all($pdo)['artists'], 'art-1')['bio']], ['Foro editado', 'otra'], 'cambios simultáneos en registros distintos se conservan ambos');

// ═══════════════════════════════════════════════════════════
t_section('15. Índices: cobertura y sobreindexación');
$idx = [];
foreach ($pdo->query("SELECT table_name t, index_name i, GROUP_CONCAT(column_name ORDER BY seq_in_index) cols FROM information_schema.statistics WHERE table_schema = DATABASE() GROUP BY table_name, index_name")->fetchAll() as $r) $idx[$r['t']][$r['i']] = $r['cols'];
$fkcols = $pdo->query("SELECT table_name t, column_name c FROM information_schema.key_column_usage WHERE table_schema = DATABASE() AND referenced_table_name IS NOT NULL AND ordinal_position = 1")->fetchAll();
$missing = []; foreach ($fkcols as $f) { $ok = false; foreach ($idx[$f['t']] ?? [] as $cols) if (str_starts_with($cols . ',', $f['c'] . ',')) $ok = true; if (!$ok) $missing[] = $f['t'] . '.' . $f['c']; }
t_eq($missing, [], 'toda llave foránea tiene un índice que la cubre');
$redundant = []; foreach ($idx as $t => $list) foreach ($list as $a => $ca) foreach ($list as $b => $cb) if ($a !== $b && $ca !== $cb && str_starts_with($cb . ',', $ca . ',')) $redundant[] = "$t.$a ⊂ $b";
t_eq($redundant, [], 'no hay índices redundantes (prefijo de otro)');
t_ok(!isset($idx['eventos']['idx_eventos_artista']) && !isset($idx['artistas']['idx_artistas_deleted']), 'los índices retirados en la auditoría no existen');

t_section('16. Rendimiento: EXPLAIN con 20 000 eventos');
$pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
$pdo->exec("INSERT INTO artistas (id, nombre_artistico, etapa_id) SELECT CONCAT('a', n), CONCAT('Artista ', n), 1 FROM (SELECT a.N + b.N * 10 + c.N * 100 + 1 n FROM (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) a, (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) b, (SELECT 0 N UNION SELECT 1 UNION SELECT 2) c) x WHERE n <= 300");
$pdo->exec("INSERT INTO venues (id, nombre) SELECT CONCAT('v', n), CONCAT('Foro ', n) FROM (SELECT a.N + b.N * 10 + c.N * 100 + 1 n FROM (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) a, (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) b, (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) c) x WHERE n <= 1000");
$seq = "(SELECT a.N + b.N * 10 + c.N * 100 + d.N * 1000 + e.N * 10000 + 1 n FROM (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) a, (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) b, (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) c, (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) d, (SELECT 0 N UNION SELECT 1) e) s WHERE n <= 20000";
$pdo->exec("INSERT INTO eventos (id, nombre, venue_id, fecha, estado) SELECT CONCAT('e', n), CONCAT('Show ', n), CONCAT('v', 1 + n % 1000), DATE_ADD('2024-01-01', INTERVAL n % 1000 DAY), 'Draft' FROM $seq");
$pdo->exec("INSERT INTO evento_artistas (evento_id, artista_id, es_principal, orden_presentacion) SELECT CONCAT('e', n), CONCAT('a', 1 + n % 300), 1, 1 FROM $seq");
$pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
$pdo->query('ANALYZE TABLE eventos, evento_artistas, artistas, venues')->fetchAll();
$plan = fn(string $sql) => $pdo->query("EXPLAIN $sql")->fetchAll();
$uses = fn(array $p, string $name) => (bool)array_filter($p, fn($r) => ($r['key'] ?? '') === $name || str_contains((string)($r['key'] ?? ''), $name));
t_ok($uses($plan("SELECT * FROM eventos WHERE fecha BETWEEN '2025-03-01' AND '2025-03-31'"), 'idx_eventos_fecha'), 'eventos de un mes usan idx_eventos_fecha');
t_ok($uses($plan("SELECT * FROM eventos WHERE venue_id = 'v5'"), 'idx_eventos_venue'), 'eventos de un venue usan idx_eventos_venue');
$p = $plan("SELECT e.* FROM evento_artistas ea JOIN eventos e ON e.id = ea.evento_id WHERE ea.artista_id = 'a5'");
t_ok($uses($p, 'idx_ea_artista') && !array_filter($p, fn($r) => $r['type'] === 'ALL'), 'eventos de un artista usan idx_ea_artista (sin escaneo completo)');
$p = $plan("SELECT e.* FROM evento_artistas ea JOIN eventos e ON e.id = ea.evento_id WHERE ea.artista_id = 'a5' AND e.fecha BETWEEN '2025-01-01' AND '2025-12-31'");
t_ok(!array_filter($p, fn($r) => $r['type'] === 'ALL'), 'eventos de un artista en un año: sin escaneo completo');
$p = $plan("SELECT * FROM contratos WHERE evento_id = 'e5'"); t_ok($uses($p, 'fk_contratos_evento') || $uses($p, 'evento'), 'contratos de un evento usan el índice de la llave foránea');

t_done();
