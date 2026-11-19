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
t_eq($applied, [1, 2, 3, 4, 5], 'se aplican las 5 migraciones en orden');
foreach (['artistas','venues','contactos','contacto_correos','contacto_telefonos','venue_contactos','artista_contactos','proveedor_contactos','evento_artistas','tour_artistas','artista_generos','cat_generos','cat_roles_contacto','cat_monedas','eventos','tours','contratos','proveedores','proyectos_grabacion','venue_proveedores','cat_etapas_desarrollo','schema_migrations'] as $tb) t_ok(db_table_exists($pdo, $tb), "existe la tabla $tb");
t_eq(migrate_up($pdo), [], 'volver a migrar no hace nada (idempotente)');
t_eq($count('SELECT COUNT(*) FROM cat_etapas_desarrollo'), 7, 'catálogo de etapas sembrado');

t_section('2. Migraciones: actualizar desde v1 con datos existentes');
$fresh(); migrate_up($pdo, 1); seed_v1($pdo);
$before = ['art' => $count('SELECT COUNT(*) FROM artistas'), 'ven' => $count('SELECT COUNT(*) FROM venues'), 'evt' => $count('SELECT COUNT(*) FROM eventos'), 'ctr' => $count('SELECT COUNT(*) FROM contratos'), 'con' => $count('SELECT COUNT(*) FROM contactos'), 'prov' => $count('SELECT COUNT(*) FROM proveedores'), 'tour' => $count('SELECT COUNT(*) FROM tours')];
migrate_up($pdo, 4);
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
t_eq(migrate_down($pdo, 1), [4, 3, 2], 'se revierten 4, 3 y 2 en orden inverso');
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
t_eq(migrate_up($pdo, 4), [2, 3, 4], 'se puede volver a subir');
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
t_eq([$count("SELECT COUNT(*) FROM artistas WHERE id='art-1' AND deleted_at IS NOT NULL"), (string)t_scalar($pdo, "SELECT artista_id FROM contrato_artistas WHERE contrato_id='ctr-1'")], [1, 'art-1'], 'desactivar (borrado lógico) un artista conserva su contrato');
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
$p = $plan("SELECT * FROM contrato_eventos WHERE evento_id = 'e5'"); t_ok(!array_filter($p, fn($r) => $r['type'] === 'ALL'), 'contratos de un evento (contrato_eventos) se buscan por índice, sin escaneo completo');

// ═══════════════════════════════════════════════════════════
t_section('17. Fase 3: migración de JSON y contratos a tablas (con datos)');
$fresh(); migrate_up($pdo, 1); seed_v1($pdo); migrate_up($pdo, 3);
$tot = ['hitos' => 0, 'pipeline' => 0, 'songs' => 0];
migrate_up($pdo, 4);
$note = json_decode((string)t_scalar($pdo, 'SELECT notas FROM schema_migrations WHERE version = 4'), true);
t_eq($count("SELECT COUNT(*) FROM artista_integrantes WHERE artista_id='art-1'"), 3, 'integrantes: historial + el que solo estaba en la lista derivada «members»');
t_eq($count("SELECT COUNT(*) FROM artista_idiomas WHERE artista_id='art-1'"), 2, 'idiomas sin duplicados («Español»/«español»)');
t_eq((string)t_scalar($pdo, "SELECT enlace FROM artista_redes WHERE artista_id='art-1' AND plataforma='instagram'") . '|' . $count("SELECT conectado FROM artista_redes WHERE artista_id='art-1' AND plataforma='instagram'"), '@uno|1', 'redes con su estado de conexión');
t_eq($count("SELECT COUNT(*) FROM artista_pipeline WHERE artista_id='art-1'") . '/' . $count("SELECT COUNT(*) FROM artista_hitos WHERE artista_id='art-1'"), '2/2', 'pipeline e hitos pasaron a tablas');
t_eq((string)t_scalar($pdo, "SELECT bio FROM artistas WHERE id='art-1'") . '|' . (string)t_scalar($pdo, "SELECT sello FROM artistas WHERE id='art-1'") . '|' . (string)t_scalar($pdo, "SELECT foto_zoom FROM artistas WHERE id='art-1'"), 'Bío con ñ|Sello X|1.20', 'bio, sello y ajustes de foto pasaron a columnas');
t_eq((string)t_scalar($pdo, "SELECT sitio_web FROM venues WHERE id='ven-1'") . '|' . $count("SELECT num_resenas FROM venues WHERE id='ven-1'") . '|' . $count("SELECT COUNT(*) FROM venue_horarios WHERE venue_id='ven-1'") . '|' . $count("SELECT COUNT(*) FROM venue_bandas_locales WHERE venue_id='ven-1'"), 'https://foro.mx|1200|2|2', 'ficha del venue: columnas + horarios + bandas locales');
t_eq($count("SELECT duracion_seg FROM evento_setlist WHERE item_id='s1'") . '|' . $count("SELECT valoracion_ritmo FROM eventos WHERE id='evt-1'") . '|' . $count("SELECT COUNT(*) FROM evento_bandas_invitadas WHERE evento_id='evt-1'"), '200|4|2', 'setlist (3:20 → 200 s), feedback y bandas invitadas');
t_eq((float)t_scalar($pdo, "SELECT SUM(monto) FROM proyecto_costos WHERE proyecto_id='rec-1'"), 13000.5, 'los costos del proyecto se pueden SUMAR en SQL (antes eran JSON)');
t_eq((float)t_scalar($pdo, "SELECT SUM(monto) FROM proyecto_pagos WHERE proyecto_id='rec-1' AND estado='Pendiente'"), 5000.0, '…y los pagos pendientes también');
t_eq($count('SELECT COUNT(*) FROM proyecto_instrumentos'), 2, 'instrumentos de las etapas');
t_eq(array_map('intval', [$count('SELECT COUNT(*) FROM contrato_artistas'), $count('SELECT COUNT(*) FROM contrato_venues'), $count('SELECT COUNT(*) FROM contrato_eventos'), $count('SELECT COUNT(*) FROM contrato_tours')]), [2, 1, 1, 1], 'contratos → partes y objeto (la gira de ctr-1 se deduce de su evento: no se duplica)');
t_ok(($note['migrado']['c_giras_derivadas'] ?? 0) === 1, 'la migración informa de la redundancia eliminada', json_encode($note));
t_eq((string)t_scalar($pdo, "SELECT COALESCE(extra,'NULL') FROM artistas WHERE id='art-1'"), 'NULL', 'el JSON `extra` queda vacío: todo se modeló');
t_eq($count("SELECT COUNT(*) FROM information_schema.referential_constraints WHERE constraint_schema=DATABASE() AND table_name='proyectos_grabacion' AND delete_rule='RESTRICT'"), 1, 'proyectos: el artista ya no se pierde con SET NULL');
t_eq(migrate_down($pdo, 3), [4], 'rollback de la migración 4');
$ex = json_decode((string)t_scalar($pdo, "SELECT extra FROM artistas WHERE id='art-1'"), true);
t_ok(($ex['bio'] ?? '') === 'Bío con ñ' && count($ex['pipeline'] ?? []) === 2 && count($ex['history'] ?? []) === 2 && ($ex['socialMedia']['instagramConnected'] ?? false) === true, 'el JSON del artista se reconstruye desde las tablas');
t_eq($count("SELECT COUNT(*) FROM contratos WHERE artista_id IS NOT NULL"), 2, 'las columnas de contratos se reconstruyen desde las tablas de partes');
t_eq((string)t_scalar($pdo, "SELECT tour_id FROM contratos WHERE id='ctr-1'"), 'tour-1', '…incluida la gira que se deducía del evento');
t_eq(migrate_up($pdo, 4), [4], 'se vuelve a subir');
t_eq($count('SELECT COUNT(*) FROM proyecto_costos'), 2, '…y los datos regresan a las tablas');

t_section('18. Fase 3: ida y vuelta de TODOS los campos (artista, venue, evento, proyecto)');
$fresh(); migrate_up($pdo); catalog_cache_clear();
$A = $art('art-1', 'Banda Uno', ['genre' => 'Rock', 'subgenres' => ['Pop'], 'languages' => ['Español', 'Inglés'], 'label' => 'Sello', 'publisher' => 'Editorial', 'distributor' => 'Dist', 'startDate' => '2019-05-01',
    'photoStyle' => ['zoom' => 1.5, 'rotation' => 10, 'contrast' => 1.1, 'brightness' => 0.9, 'grayscale' => 0, 'sepia' => 0.2, 'blur' => 1],
    'socialMedia' => ['instagram' => '@uno', 'instagramConnected' => true, 'instagramConnectedUser' => '@uno_of', 'tiktok' => '@t', 'website' => 'https://uno.mx'],
    'pipeline' => [['id' => 'p1', 'name' => 'Logo', 'category' => 'Branding', 'completed' => true], ['id' => 'p2', 'name' => 'EPK', 'category' => 'Presencia', 'completed' => false]],
    'history' => [['id' => 'h1', 'date' => '2020-01-01', 'title' => 'Hito', 'description' => 'Descripción', 'type' => 'milestone']],
    'memberHistory' => [['id' => 'm1', 'name' => 'Ana', 'role' => 'Voz', 'startDate' => '2019-01-01', 'venueName' => 'Foro', 'active' => true], ['id' => 'm2', 'name' => 'Luis', 'role' => 'Batería', 'startDate' => '2019-02-01', 'endDate' => '2022-01-01', 'active' => false]],
    'members' => ['Ana (Voz)']]);
$V = $ven('ven-1', 'Foro', ['website' => 'https://foro.mx', 'phone' => '+52 55', 'userRatingsCount' => 99, 'placeId' => 'ChIJx', 'establishmentType' => 'Teatro', 'hours' => ['L-V 10-18', 'Sáb 12-22'], 'localBands' => ['Local 1'], 'instagram' => '@foro', 'email' => 'f@foro.mx']);
$E = $evt('evt-1', 'art-1', 'ven-1', ['guestBands' => ['G1', 'G2'], 'setlist' => [['id' => 's1', 'songTitle' => 'Canción', 'duration' => '3:20', 'tempo' => 'Rápido', 'transitionNotes' => 'Luz roja'], ['id' => 's2', 'songTitle' => 'Balada']],
    'feedback' => ['artistThoughts' => 'Bien', 'crowdReaction' => 'Cantaron', 'pacingRating' => 4, 'optimizationNotes' => 'Subir tempo']]);
$R = ['id' => 'rec-1', 'title' => 'Álbum', 'artistId' => 'art-1', 'status' => 'Grabando', 'releaseDate' => '2027-01-01', 'studio' => 'E', 'producer' => 'P', 'created_at' => $T,
    'songs' => [['id' => 'so1', 'title' => 'T1', 'duration' => '2:30', 'composer' => 'Yo', 'status' => 'Demo', 'progress' => 40, 'notes' => 'n'], ['id' => 'so2', 'title' => 'T2', 'status' => 'Listo', 'progress' => 100]],
    'costs' => [['id' => 'c1', 'concept' => 'Estudio', 'category' => 'Estudio/Grabación', 'amount' => 10000.5], ['id' => 'c2', 'concept' => 'Mezcla', 'category' => 'Mezcla', 'amount' => 3000, 'notes' => 'x']],
    'payments' => [['id' => 'pa1', 'concept' => 'Anticipo', 'amount' => 5000, 'dueDate' => '2026-12-01', 'status' => 'Pendiente'], ['id' => 'pa2', 'concept' => 'Final', 'amount' => 8000.5, 'dueDate' => '2027-01-15', 'status' => 'Pagado', 'notes' => 'ok']],
    'stages' => [['id' => 'st1', 'name' => 'Grabación', 'status' => 'En Progreso', 'startDate' => '2026-11-01', 'endDate' => '2026-12-01', 'notes' => 'n', 'instruments' => [['id' => 'i1', 'name' => 'Batería', 'status' => 'Listo', 'musician' => 'Luis'], ['id' => 'i2', 'name' => 'Bajo', 'status' => 'Pendiente']]], ['id' => 'st2', 'name' => 'Mezcla', 'status' => 'Pendiente']]];
$sync($up('artists', $A), $up('venues', $V), $up('events', $E), $up('recording_projects', $R));
$all = load_all($pdo);
function jsonable($v) { return json_decode(json_encode($v, JSON_UNESCAPED_UNICODE), true); }
function pick(array $o, array $keys) { return array_intersect_key($o, array_flip($keys)); }
function deep_norm($v) { if (is_array($v)) { if (array_is_list($v)) return array_map('deep_norm', $v); ksort($v); return array_map('deep_norm', $v); } return is_float($v) || is_int($v) ? round((float)$v, 4) : $v; }
function same(array $a, array $b, array $keys): bool { return deep_norm(pick($a, $keys)) === deep_norm(pick($b, $keys)); }
$ra = jsonable($byId($all['artists'], 'art-1'));
foreach (['languages', 'socialMedia', 'pipeline', 'history', 'photoStyle', 'bio', 'label', 'publisher', 'distributor', 'startDate'] as $f) t_ok(deep_norm($ra[$f] ?? null) === deep_norm($A[$f]), "artista · $f idéntico", json_encode([$ra[$f] ?? null, $A[$f]]));
t_ok(deep_norm($ra['memberHistory']) === deep_norm($A['memberHistory']), 'artista · memberHistory idéntico');
t_eq($ra['members'], ['Ana (Voz)'], 'artista · members se deriva de los integrantes activos');
$rv = jsonable($byId($all['venues'], 'ven-1'));
foreach (['website', 'phone', 'userRatingsCount', 'placeId', 'establishmentType', 'hours', 'localBands', 'instagram', 'email'] as $f) t_ok(deep_norm($rv[$f] ?? null) === deep_norm($V[$f]), "venue · $f idéntico");
t_ok(!array_key_exists('facebook', $rv), 'venue · un dato opcional ausente sigue ausente (no aparece vacío)');
$re = jsonable($byId($all['events'], 'evt-1'));
foreach (['guestBands', 'setlist', 'feedback'] as $f) t_ok(deep_norm($re[$f] ?? null) === deep_norm($E[$f]), "evento · $f idéntico", json_encode([$re[$f] ?? null, $E[$f]]));
$rr = jsonable($byId($all['recording_projects'], 'rec-1'));
foreach (['songs', 'costs', 'payments', 'stages'] as $f) {
    $exp = $R[$f]; if ($f === 'stages') foreach ($exp as &$st) $st['instruments'] ??= []; unset($st);   // una etapa sin instrumentos vuelve con lista vacía
    t_ok(deep_norm($rr[$f]) === deep_norm($exp), "proyecto · $f idéntico (con ids, orden e instrumentos)", json_encode([$rr[$f], $exp]));
}
// edición y vaciado de listas
$A2 = array_merge($ra, ['languages' => ['Francés'], 'pipeline' => [], 'socialMedia' => new stdClass(), 'version' => $ra['version']]);
$sync($up('artists', $A2)); $ra2 = jsonable($byId(load_all($pdo)['artists'], 'art-1'));
t_ok($ra2['languages'] === ['Francés'] && $ra2['pipeline'] === [] && $ra2['socialMedia'] === [], 'editar y vaciar listas se refleja (sin restos)');
$sync($up('events', array_merge($re, ['setlist' => [], 'guestBands' => [], 'feedback' => new stdClass(), 'version' => $re['version']])));
t_eq($count("SELECT COUNT(*) FROM evento_setlist WHERE evento_id='evt-1'") + $count("SELECT COUNT(*) FROM evento_bandas_invitadas WHERE evento_id='evt-1'"), 0, 'vaciar el setlist y las invitadas borra sus filas');
t_eq(array_key_exists('feedback', jsonable($byId(load_all($pdo)['events'], 'evt-1'))), false, '…y un feedback vacío no aparece');
$sync(['recording_projects' => ['deletes' => ['rec-1']]]);
t_eq($count('SELECT COUNT(*) FROM proyecto_costos') + $count('SELECT COUNT(*) FROM proyecto_instrumentos') + $count('SELECT COUNT(*) FROM proyecto_etapas'), 0, 'borrar un proyecto borra sus costos, etapas e instrumentos (CASCADE)');

t_section('19. Fase 3: contratos con varias partes y conservación del historial');
$fresh(); migrate_up($pdo); catalog_cache_clear();
$p1 = ['id' => 'prov-1', 'name' => 'Sonido', 'category' => 'Sonido', 'contactName' => '', 'phone' => '', 'email' => '', 'rating' => 0, 'costPerShow' => 0, 'venueIds' => [], 'created_at' => $T];
$sync($up('artists', $art('art-1', 'Uno'), $art('art-2', 'Dos')), $up('venues', $ven('ven-1', 'Foro'), $ven('ven-2', 'Foro 2')), $up('providers', $p1), $up('tours', $tour('tour-1', 'art-1')), $up('events', $evt('evt-1', 'art-1', 'ven-1', ['tourId' => 'tour-1'])));
$sync($up('contracts', $ctr('k-1', ['artistIds' => ['art-1', 'art-2'], 'venueIds' => ['ven-1'], 'providerIds' => ['prov-1'], 'eventIds' => ['evt-1'], 'tourIds' => ['tour-1']])));
$rk = $byId(load_all($pdo)['contracts'], 'k-1');
t_eq([$rk['artistIds'], $rk['venueIds'], $rk['providerIds'], $rk['eventIds'], $rk['tourIds']], [['art-1', 'art-2'], ['ven-1'], ['prov-1'], ['evt-1'], ['tour-1']], 'un contrato con 2 artistas, venue, proveedor, evento y gira');
t_eq([$rk['artistId'], $rk['venueId'], $rk['eventId'], $rk['tourId']], ['art-1', 'ven-1', 'evt-1', 'tour-1'], 'los campos de una sola parte siguen existiendo (compatibilidad con la interfaz)');
t_ok(!db_col_exists($pdo, 'contratos', 'artista_id') && !db_col_exists($pdo, 'contratos', 'evento_id'), 'contratos ya no tiene columnas de una sola parte: todo vive en las tablas de partes');
$sync($up('contracts', $ctr('k-2', ['artistId' => 'art-2', 'venueId' => 'ven-2'])));       // formato anterior
$rk2 = $byId(load_all($pdo)['contracts'], 'k-2'); t_eq([$rk2['artistIds'], $rk2['venueIds'], $rk2['eventIds']], [['art-2'], ['ven-2'], []], 'contrato en formato anterior (artistId/venueId) crea sus filas de parte');
t_eq(array_values(array_filter($byId(load_all($pdo)['contracts'], 'k-1'), fn($v, $k) => $k === 'tourId', ARRAY_FILTER_USE_BOTH)), ['tour-1'], 'la gira se muestra por su relación');
foreach ([['artists', 'art-2', 'artista'], ['venues', 'ven-1', 'venue'], ['providers', 'prov-1', 'proveedor'], ['events', 'evt-1', 'evento'], ['tours', 'tour-1', 'gira']] as [$col, $eid, $name])
    t_throws(fn() => $sync([$col => ['deletes' => [$eid]]]), "no se puede borrar un $name que figura en un contrato");
$a2 = $byId(load_all($pdo)['artists'], 'art-2'); $a2['deleted_at'] = '2026-11-19T00:00:00.000Z'; $sync($up('artists', $a2));
t_eq([$count("SELECT COUNT(*) FROM contrato_artistas WHERE artista_id='art-2'")], [2], 'desactivar (borrado lógico) un artista conserva sus contratos');
$rk = $byId(load_all($pdo)['contracts'], 'k-1'); $rk['artistIds'] = ['art-1']; $rk['version'] = $rk['version'] ?? null;
$sync($up('contracts', $rk));
t_eq($byId(load_all($pdo)['contracts'], 'k-1')['artistIds'], ['art-1'], 'quitar una parte del contrato');
t_throws(fn() => $pdo->exec("INSERT INTO contrato_artistas (contrato_id, artista_id) VALUES ('k-1','art-1')"), 'la misma parte no se repite en un contrato');
t_throws(fn() => $pdo->exec("INSERT INTO contrato_artistas (contrato_id, artista_id) VALUES ('k-1','art-no-existe')"), 'una parte inexistente se rechaza');
$sync(['contracts' => ['deletes' => ['k-1']]]);
t_eq($count("SELECT COUNT(*) FROM contrato_artistas WHERE contrato_id='k-1'") + $count("SELECT COUNT(*) FROM contrato_eventos WHERE contrato_id='k-1'"), 0, 'borrar el contrato borra solo sus vínculos');
t_eq($count("SELECT COUNT(*) FROM eventos WHERE id='evt-1'") + $count("SELECT COUNT(*) FROM artistas WHERE id='art-1'"), 2, '…y no toca a las entidades');

t_section('20. Fase 3: restricciones de los datos que antes eran JSON');
t_throws(fn() => $sync($up('artists', $art('art-x', 'X', ['pipeline' => [['id' => 'p', 'name' => 'n', 'category' => 'Inventada', 'completed' => false]]]))), 'PHP: categoría de pipeline inválida', 'Valores permitidos');
t_throws(fn() => $sync($up('recording_projects', ['id' => 'rec-x', 'title' => 'P', 'status' => 'Grabando', 'created_at' => $T, 'songs' => [['id' => 's', 'title' => 'T', 'status' => 'Demo', 'progress' => 101]]])), 'PHP: progreso de canción > 100', 'progreso');
t_throws(fn() => $sync($up('recording_projects', ['id' => 'rec-y', 'title' => 'P', 'status' => 'Grabando', 'created_at' => $T, 'costs' => [['id' => 'c', 'concept' => 'x', 'category' => 'Otros', 'amount' => -5]]])), 'PHP: costo negativo', 'negativo');
t_throws(fn() => $sync($up('events', $evt('evt-z', 'art-1', 'ven-1', ['feedback' => ['pacingRating' => 9]]))), 'PHP: valoración del ritmo fuera de 1–5', '1 y 5');
t_throws(fn() => $pdo->exec("INSERT INTO proyecto_pagos (proyecto_id, pago_id, orden, concepto, monto, estado) VALUES ('rec-1','x',1,'c',-1,'Pendiente')"), 'la base rechaza un pago negativo (o un proyecto inexistente)');
t_throws(fn() => $pdo->exec("INSERT INTO artista_redes (artista_id, plataforma, enlace) VALUES ('art-1','myspace','x')"), 'la base rechaza una red social fuera del dominio');
t_eq($count("SELECT COUNT(*) FROM artistas WHERE id IN ('art-x')") + $count("SELECT COUNT(*) FROM proyectos_grabacion WHERE id IN ('rec-x','rec-y')"), 0, 'los lotes rechazados no dejan nada a medias');

// ═══════════════════════════════════════════════════════════
t_section('21. Fase 4: contracción (retirar lo obsoleto) con verificación previa y rollback');
$fresh(); migrate_up($pdo, 1); seed_v1($pdo); migrate_up($pdo, 4);
$before = jsonable(load_all($pdo));
t_ok(db_col_exists($pdo, 'artistas', 'genero') && db_table_exists($pdo, 'contactos_legacy'), 'antes de contraer, lo obsoleto sigue existiendo');
t_eq(migrate_up($pdo), [5], 'la migración 005 se aplica');
foreach ([['artistas', 'genero'], ['artistas', 'manager'], ['artistas', 'booking_agent'], ['artistas', 'extra'], ['venues', 'contacto_principal_id'], ['venues', 'extra'], ['proveedores', 'contacto'], ['proveedores', 'telefono'], ['proveedores', 'correo'],
          ['tours', 'artista_id'], ['eventos', 'artista_id'], ['eventos', 'extra'], ['contratos', 'artista_id'], ['contratos', 'venue_id'], ['contratos', 'tour_id'], ['contratos', 'evento_id'], ['proyectos_grabacion', 'extra']] as [$t, $c])
    t_ok(!db_col_exists($pdo, $t, $c), "ya no existe $t.$c");
t_ok(!db_table_exists($pdo, 'contactos_legacy') && !db_table_exists($pdo, 'schema_meta'), 'ya no existen contactos_legacy ni schema_meta');
t_eq(jsonable(load_all($pdo)), $before, 'la API devuelve EXACTAMENTE los mismos datos antes y después de contraer (nada se perdió)');
$nota = (string)t_scalar($pdo, 'SELECT notas FROM schema_migrations WHERE version = 5'); t_ok(str_contains($nota, 'contactos_legacy'), 'la migración deja constancia de lo eliminado', $nota);

// verificación previa: aborta sin cambiar nada
$fresh(); migrate_up($pdo, 1); seed_v1($pdo); migrate_up($pdo, 4);
$pdo->exec("DELETE FROM evento_artistas WHERE evento_id = 'evt-2'");
$m = t_throws(fn() => migrate_up($pdo), 'con un evento sin alineación, la contracción se niega', 'sin alineación');
t_ok(db_col_exists($pdo, 'eventos', 'artista_id') && db_col_exists($pdo, 'artistas', 'genero') && db_table_exists($pdo, 'contactos_legacy'), 'no se tocó nada al abortar');
t_eq((int)t_scalar($pdo, 'SELECT MAX(version) FROM schema_migrations'), 4, 'la versión sigue en 4');
$pdo->exec("INSERT INTO evento_artistas (evento_id, artista_id, es_principal, orden_presentacion) VALUES ('evt-2','art-2',1,1)");
$pdo->exec("UPDATE artistas SET extra = '{\"campo_no_modelado\":1}' WHERE id = 'art-1'");
t_throws(fn() => migrate_up($pdo), 'con datos sin modelar en `extra`, la contracción se niega (no pierde información)', 'extra');
$pdo->exec("UPDATE artistas SET extra = NULL WHERE id = 'art-1'");
t_eq(migrate_up($pdo), [5], 'corregido el problema, la contracción procede');

// rollback completo 5 → 1 → 5 sin perder datos
$sync($up('artists', $art('art-n', 'Nuevo', ['genre' => 'Salsa', 'manager' => 'Manager Nuevo'])));   // dato creado ya en el esquema contraído
$conN = jsonable(load_all($pdo));
t_eq(migrate_down($pdo, 4), [5], 'revertir solo la contracción');
t_ok(db_col_exists($pdo, 'eventos', 'artista_id') && db_table_exists($pdo, 'contactos_legacy'), 'las estructuras antiguas vuelven (vacías)');
t_eq(jsonable(load_all($pdo)), $conN, 'y la API sigue devolviendo lo mismo (los datos viven en las tablas nuevas)');
t_eq(migrate_down($pdo, 1), [4, 3, 2], 'seguir revirtiendo hasta el esquema original v1');
t_eq((string)t_scalar($pdo, "SELECT genero FROM artistas WHERE id='art-n'") . '|' . (string)t_scalar($pdo, "SELECT manager FROM artistas WHERE id='art-n'"), 'Salsa|Manager Nuevo', 'un artista creado DESPUÉS de contraer se reconstruye en el esquema v1 (género y manager)');
t_eq((string)t_scalar($pdo, "SELECT artista_id FROM eventos WHERE id='evt-1'"), 'art-1', 'eventos.artista_id restaurado');
t_eq(migrate_up($pdo), [2, 3, 4, 5], 'se vuelve a subir hasta la 5');
t_eq(array_column(jsonable(load_all($pdo))['artists'], 'artisticName'), array_column($conN['artists'], 'artisticName'), 'los artistas siguen todos ahí tras ida y vuelta completa');

t_done();
