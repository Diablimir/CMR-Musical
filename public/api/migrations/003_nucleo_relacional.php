<?php
declare(strict_types=1);

// Migración 003 — Núcleo relacional (Fase 2)
//  · cat_generos + artista_generos           (géneros atómicos, sin listas separadas por comas)
//  · contactos centralizados + correos/teléfonos + puentes venue/artista/proveedor (sin ciclo)
//  · evento_artistas                         (eventos con varios artistas)
//  · tour_artistas                           (giras compartidas)
//  · catálogos: cat_roles_contacto, cat_monedas
// Expansión: las columnas antiguas se conservan (ya no se escriben) hasta la Fase 4.
// down() las vuelve a rellenar a partir de las tablas nuevas y elimina lo añadido.

function mig003_id(): string { return 'con-' . bin2hex(random_bytes(6)); }
function mig003_norm(string $s): string { return trim(preg_replace('/\s+/u', ' ', $s)); }
function mig003_one(): string { return 'CHECK (es_principal IS NULL OR es_principal = 1)'; }

/** Devuelve el id de un catálogo (genero/rol) buscando sin distinguir mayúsculas; lo crea si no existe. */
function mig003_catalog(PDO $pdo, string $table, string $name, array &$cache): int {
    $k = mb_strtolower($name);
    if (isset($cache[$table][$k])) return $cache[$table][$k];
    $st = $pdo->prepare("SELECT id FROM `$table` WHERE nombre = ?"); $st->execute([$name]);
    $id = $st->fetchColumn();
    if ($id === false) { $pdo->prepare("INSERT INTO `$table` (nombre) VALUES (?)")->execute([$name]); $id = $pdo->lastInsertId(); }
    return $cache[$table][$k] = (int)$id;
}

return [
    'id' => 3,
    'name' => 'nucleo_relacional_fase2',
    'description' => 'Géneros, contactos centralizados, eventos con varios artistas, giras compartidas y catálogos',
    'up' => function (PDO $pdo): string {
        $o = ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
        $now = 'DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)';

        // ───────── DDL (idempotente) ─────────
        $pdo->exec("CREATE TABLE IF NOT EXISTS cat_generos (
            id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(80) NOT NULL,
            descripcion VARCHAR(255) NULL,
            UNIQUE KEY uq_generos_nombre (nombre)
        ){$o}");
        $pdo->exec("CREATE TABLE IF NOT EXISTS cat_roles_contacto (
            id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(60) NOT NULL,
            UNIQUE KEY uq_roles_nombre (nombre)
        ){$o}");
        $pdo->exec("CREATE TABLE IF NOT EXISTS cat_monedas (
            codigo CHAR(3) NOT NULL PRIMARY KEY,
            nombre VARCHAR(60) NOT NULL
        ){$o}");
        foreach (['Manager', 'Booking', 'Promotor', 'Técnico', 'Hospitalidad', 'Producción', 'Administración', 'Contacto comercial', 'Contacto'] as $r) $pdo->prepare('INSERT IGNORE INTO cat_roles_contacto (nombre) VALUES (?)')->execute([$r]);
        foreach (['MXN' => 'Peso mexicano', 'USD' => 'Dólar estadounidense', 'EUR' => 'Euro'] as $c => $n) $pdo->prepare('INSERT IGNORE INTO cat_monedas (codigo, nombre) VALUES (?, ?)')->execute([$c, $n]);

        $pdo->exec("CREATE TABLE IF NOT EXISTS artista_generos (
            artista_id VARCHAR(40) NOT NULL,
            genero_id SMALLINT UNSIGNED NOT NULL,
            es_principal TINYINT(1) NULL,
            orden TINYINT UNSIGNED NOT NULL,
            PRIMARY KEY (artista_id, genero_id),
            UNIQUE KEY uq_artista_genero_principal (artista_id, es_principal),
            KEY idx_artista_generos_genero (genero_id),
            CONSTRAINT fk_ag_artista FOREIGN KEY (artista_id) REFERENCES artistas(id) ON DELETE CASCADE,
            CONSTRAINT fk_ag_genero FOREIGN KEY (genero_id) REFERENCES cat_generos(id) ON DELETE RESTRICT,
            CONSTRAINT chk_ag_principal " . mig003_one() . ",
            CONSTRAINT chk_ag_orden CHECK (orden >= 1)
        ){$o}");

        // contactos: la tabla v1 (ligada a un venue) pasa a contactos_legacy; la nueva es independiente
        if (db_col_exists($pdo, 'contactos', 'venue_id') && !db_table_exists($pdo, 'contactos_legacy')) $pdo->exec('RENAME TABLE contactos TO contactos_legacy');
        $pdo->exec("CREATE TABLE IF NOT EXISTS contactos (
            id VARCHAR(40) NOT NULL PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL,
            apellidos VARCHAR(255) NULL,
            version INT NOT NULL DEFAULT 1,
            created_at {$now},
            updated_at {$now},
            KEY idx_contactos_nombre (nombre)
        ){$o}");
        foreach (['correo' => ['contacto_correos', 'correo VARCHAR(255) NOT NULL'], 'telefono' => ['contacto_telefonos', 'telefono VARCHAR(40) NOT NULL']] as $campo => [$tabla, $col]) {
            $pdo->exec("CREATE TABLE IF NOT EXISTS {$tabla} (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                contacto_id VARCHAR(40) NOT NULL,
                {$col},
                etiqueta VARCHAR(30) NULL,
                es_principal TINYINT(1) NULL,
                UNIQUE KEY uq_{$tabla}_valor (contacto_id, {$campo}),
                UNIQUE KEY uq_{$tabla}_principal (contacto_id, es_principal),
                KEY idx_{$tabla}_{$campo} ({$campo}),
                CONSTRAINT fk_{$tabla}_contacto FOREIGN KEY (contacto_id) REFERENCES contactos(id) ON DELETE CASCADE,
                CONSTRAINT chk_{$tabla}_principal " . mig003_one() . "
            ){$o}");
        }
        foreach (['venue_contactos' => ['venue_id', 'venues', 'uq_vc_principal (venue_id, es_principal)'],
                  'proveedor_contactos' => ['proveedor_id', 'proveedores', 'uq_pc_principal (proveedor_id, es_principal)'],
                  'artista_contactos' => ['artista_id', 'artistas', 'uq_ac_principal (artista_id, rol_id, es_principal)']] as $tabla => [$fk, $ref, $uq]) {
            $pdo->exec("CREATE TABLE IF NOT EXISTS {$tabla} (
                {$fk} VARCHAR(40) NOT NULL,
                contacto_id VARCHAR(40) NOT NULL,
                rol_id SMALLINT UNSIGNED NOT NULL,
                es_principal TINYINT(1) NULL,
                PRIMARY KEY ({$fk}, contacto_id, rol_id),
                UNIQUE KEY {$uq},
                KEY idx_{$tabla}_contacto (contacto_id),
                CONSTRAINT fk_{$tabla}_entidad FOREIGN KEY ({$fk}) REFERENCES {$ref}(id) ON DELETE CASCADE,
                CONSTRAINT fk_{$tabla}_contacto FOREIGN KEY (contacto_id) REFERENCES contactos(id) ON DELETE CASCADE,
                CONSTRAINT fk_{$tabla}_rol FOREIGN KEY (rol_id) REFERENCES cat_roles_contacto(id) ON DELETE RESTRICT,
                CONSTRAINT chk_{$tabla}_principal " . mig003_one() . "
            ){$o}");
        }

        $pdo->exec("CREATE TABLE IF NOT EXISTS evento_artistas (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            evento_id VARCHAR(40) NOT NULL,
            artista_id VARCHAR(40) NOT NULL,
            rol VARCHAR(20) NOT NULL DEFAULT 'Artista',
            es_principal TINYINT(1) NULL,
            orden_presentacion SMALLINT UNSIGNED NOT NULL DEFAULT 1,
            hora_inicio TIME NULL,
            hora_fin TIME NULL,
            honorarios DECIMAL(12,2) NULL,
            moneda CHAR(3) NOT NULL DEFAULT 'MXN',
            estado_confirmacion VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
            created_at {$now},
            updated_at {$now},
            UNIQUE KEY uq_ea_presentacion (evento_id, artista_id, orden_presentacion),
            UNIQUE KEY uq_ea_principal (evento_id, es_principal),
            KEY idx_ea_artista (artista_id, evento_id),
            CONSTRAINT fk_ea_evento FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
            CONSTRAINT fk_ea_artista FOREIGN KEY (artista_id) REFERENCES artistas(id) ON DELETE RESTRICT,
            CONSTRAINT fk_ea_moneda FOREIGN KEY (moneda) REFERENCES cat_monedas(codigo) ON DELETE RESTRICT,
            CONSTRAINT chk_ea_principal " . mig003_one() . ",
            CONSTRAINT chk_ea_rol CHECK (rol IN ('Artista','Invitado','Telonero','Soporte','Otro')),
            CONSTRAINT chk_ea_estado CHECK (estado_confirmacion IN ('Pendiente','Confirmado','Cancelado')),
            CONSTRAINT chk_ea_orden CHECK (orden_presentacion >= 1),
            CONSTRAINT chk_ea_honorarios CHECK (honorarios IS NULL OR honorarios >= 0)
        ){$o}");
        $pdo->exec("CREATE TABLE IF NOT EXISTS tour_artistas (
            tour_id VARCHAR(40) NOT NULL,
            artista_id VARCHAR(40) NOT NULL,
            es_principal TINYINT(1) NULL,
            PRIMARY KEY (tour_id, artista_id),
            UNIQUE KEY uq_ta_principal (tour_id, es_principal),
            KEY idx_ta_artista (artista_id),
            CONSTRAINT fk_ta_tour FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE,
            CONSTRAINT fk_ta_artista FOREIGN KEY (artista_id) REFERENCES artistas(id) ON DELETE RESTRICT,
            CONSTRAINT chk_ta_principal " . mig003_one() . "
        ){$o}");

        // columnas que dejan de ser obligatorias (el artista ahora vive en las tablas puente)
        $pdo->exec('ALTER TABLE eventos MODIFY artista_id VARCHAR(40) NULL');
        $pdo->exec('ALTER TABLE tours MODIFY artista_id VARCHAR(40) NULL');

        // utilidad = ingreso − gastos (el ingreso se captura; la utilidad nunca se desajusta)
        $fixed = (int)$pdo->exec('UPDATE eventos SET utilidad = ingreso_total - gastos_totales WHERE utilidad <> ingreso_total - gastos_totales');
        if (!db_constraint_exists($pdo, 'eventos', 'chk_eventos_utilidad')) $pdo->exec('ALTER TABLE eventos ADD CONSTRAINT chk_eventos_utilidad CHECK (utilidad = ingreso_total - gastos_totales)');

        // ───────── Datos (transaccional) ─────────
        $cache = [];
        $pdo->beginTransaction();
        try {
            $n = ['generos' => 0, 'contactos' => 0, 'eventos' => 0, 'giras' => 0];

            // Géneros
            if ((int)$pdo->query('SELECT COUNT(*) FROM artista_generos')->fetchColumn() === 0) {
                $upd = $pdo->prepare('UPDATE artistas SET extra = ? WHERE id = ?');
                $link = $pdo->prepare('INSERT INTO artista_generos (artista_id, genero_id, es_principal, orden) VALUES (?, ?, ?, ?)');
                foreach ($pdo->query('SELECT id, genero, extra FROM artistas')->fetchAll() as $a) {
                    $extra = $a['extra'] ? (json_decode($a['extra'], true) ?: []) : [];
                    $names = [];
                    foreach (preg_split('/,/', (string)$a['genero']) as $g) $names[] = mig003_norm($g);
                    foreach (($extra['subgenres'] ?? []) as $g) if (is_string($g)) $names[] = mig003_norm($g);
                    $seen = []; $orden = 0;
                    foreach ($names as $g) {
                        if ($g === '' || isset($seen[mb_strtolower($g)])) continue;
                        $seen[mb_strtolower($g)] = true; $orden++;
                        $link->execute([$a['id'], mig003_catalog($pdo, 'cat_generos', $g, $cache), $orden === 1 ? 1 : null, $orden]);
                        $n['generos']++;
                    }
                    if (array_key_exists('subgenres', $extra)) { unset($extra['subgenres']); $upd->execute([$extra ? json_encode($extra, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null, $a['id']]); }
                }
            }

            // Contactos de venues (conservan su id)
            if ((int)$pdo->query('SELECT COUNT(*) FROM contactos')->fetchColumn() === 0 && db_table_exists($pdo, 'contactos_legacy')) {
                $insC = $pdo->prepare('INSERT INTO contactos (id, nombre) VALUES (?, ?)');
                $insE = $pdo->prepare('INSERT INTO contacto_correos (contacto_id, correo, es_principal) VALUES (?, ?, 1)');
                $insT = $pdo->prepare('INSERT INTO contacto_telefonos (contacto_id, telefono, es_principal) VALUES (?, ?, 1)');
                $insV = $pdo->prepare('INSERT INTO venue_contactos (venue_id, contacto_id, rol_id, es_principal) VALUES (?, ?, ?, ?)');
                $princ = $pdo->query('SELECT id, contacto_principal_id p FROM venues WHERE contacto_principal_id IS NOT NULL')->fetchAll();
                $principalOf = array_column($princ, 'p', 'id');
                foreach ($pdo->query('SELECT * FROM contactos_legacy ORDER BY id')->fetchAll() as $c) {
                    $insC->execute([$c['id'], mig003_norm((string)$c['nombre']) ?: 'Sin nombre']);
                    if (trim((string)$c['correo']) !== '') $insE->execute([$c['id'], trim($c['correo'])]);
                    if (trim((string)$c['telefono']) !== '') $insT->execute([$c['id'], trim($c['telefono'])]);
                    $rol = mig003_norm((string)$c['rol']) ?: 'Contacto';
                    $insV->execute([$c['venue_id'], $c['id'], mig003_catalog($pdo, 'cat_roles_contacto', $rol, $cache), ($principalOf[$c['venue_id']] ?? null) === $c['id'] ? 1 : null]);
                    $n['contactos']++;
                }
            }

            // Manager / Booking de artistas y contacto de proveedores → contactos
            if ((int)$pdo->query('SELECT COUNT(*) FROM artista_contactos')->fetchColumn() === 0 && (int)$pdo->query('SELECT COUNT(*) FROM proveedor_contactos')->fetchColumn() === 0) {
                $byName = [];
                $newContact = function (string $nombre, ?string $correo = null, ?string $tel = null) use ($pdo, &$n): string {
                    $id = mig003_id();
                    $pdo->prepare('INSERT INTO contactos (id, nombre) VALUES (?, ?)')->execute([$id, $nombre]);
                    if ($correo) $pdo->prepare('INSERT INTO contacto_correos (contacto_id, correo, es_principal) VALUES (?, ?, 1)')->execute([$id, $correo]);
                    if ($tel) $pdo->prepare('INSERT INTO contacto_telefonos (contacto_id, telefono, es_principal) VALUES (?, ?, 1)')->execute([$id, $tel]);
                    $n['contactos']++;
                    return $id;
                };
                $insA = $pdo->prepare('INSERT INTO artista_contactos (artista_id, contacto_id, rol_id, es_principal) VALUES (?, ?, ?, 1)');
                foreach ($pdo->query('SELECT id, manager, booking_agent FROM artistas')->fetchAll() as $a) {
                    foreach (['Manager' => $a['manager'], 'Booking' => $a['booking_agent']] as $rol => $nombre) {
                        $nombre = mig003_norm((string)$nombre);
                        if ($nombre === '') continue;
                        $k = $rol . '|' . mb_strtolower($nombre);
                        $byName[$k] ??= $newContact($nombre);      // misma persona/empresa = mismo contacto
                        $insA->execute([$a['id'], $byName[$k], mig003_catalog($pdo, 'cat_roles_contacto', $rol, $cache)]);
                    }
                }
                $insP = $pdo->prepare('INSERT INTO proveedor_contactos (proveedor_id, contacto_id, rol_id, es_principal) VALUES (?, ?, ?, 1)');
                foreach ($pdo->query('SELECT id, nombre, contacto, telefono, correo FROM proveedores')->fetchAll() as $p) {
                    $c = mig003_norm((string)$p['contacto']); $t = trim((string)$p['telefono']); $e = trim((string)$p['correo']);
                    if ($c === '' && $t === '' && $e === '') continue;
                    $cid = $newContact($c ?: mig003_norm((string)$p['nombre']), $e ?: null, $t ?: null);
                    $insP->execute([$p['id'], $cid, mig003_catalog($pdo, 'cat_roles_contacto', 'Contacto comercial', $cache)]);
                }
            }

            // Eventos y giras
            if ((int)$pdo->query('SELECT COUNT(*) FROM evento_artistas')->fetchColumn() === 0) {
                $n['eventos'] = (int)$pdo->exec("INSERT INTO evento_artistas (evento_id, artista_id, rol, es_principal, orden_presentacion, estado_confirmacion)
                    SELECT id, artista_id, 'Artista', 1, 1, CASE estado WHEN 'Cancelled' THEN 'Cancelado' WHEN 'Draft' THEN 'Pendiente' ELSE 'Confirmado' END
                    FROM eventos WHERE artista_id IS NOT NULL");
            }
            if ((int)$pdo->query('SELECT COUNT(*) FROM tour_artistas')->fetchColumn() === 0) {
                $n['giras'] = (int)$pdo->exec('INSERT INTO tour_artistas (tour_id, artista_id, es_principal) SELECT id, artista_id, 1 FROM tours WHERE artista_id IS NOT NULL');
            }

            // Verificación: nada se perdió
            $chk = [
                ['eventos con artista = filas en evento_artistas', (int)$pdo->query('SELECT COUNT(*) FROM eventos WHERE artista_id IS NOT NULL')->fetchColumn(), (int)$pdo->query('SELECT COUNT(*) FROM evento_artistas WHERE es_principal = 1')->fetchColumn()],
                ['giras con artista = filas en tour_artistas', (int)$pdo->query('SELECT COUNT(*) FROM tours WHERE artista_id IS NOT NULL')->fetchColumn(), (int)$pdo->query('SELECT COUNT(*) FROM tour_artistas WHERE es_principal = 1')->fetchColumn()],
                ['contactos de venue (legacy) = vínculos venue_contactos', db_table_exists($pdo, 'contactos_legacy') ? (int)$pdo->query('SELECT COUNT(*) FROM contactos_legacy')->fetchColumn() : 0, (int)$pdo->query('SELECT COUNT(*) FROM venue_contactos')->fetchColumn()],
            ];
            foreach ($chk as [$what, $a, $b]) if ($a !== $b) throw new RuntimeException("Verificación fallida ($what): $a ≠ $b");
            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            throw $e;
        }
        return sprintf('géneros=%d contactos=%d eventos→evento_artistas=%d giras→tour_artistas=%d utilidades_recalculadas=%d', $n['generos'], $n['contactos'], $n['eventos'], $n['giras'], $fixed);
    },

    'down' => function (PDO $pdo): void {
        // 1) Comprobaciones previas (si algo no se puede revertir sin perder datos, se aborta antes de tocar nada)
        $sinArtista = (int)$pdo->query('SELECT COUNT(*) FROM eventos e WHERE NOT EXISTS (SELECT 1 FROM evento_artistas ea WHERE ea.evento_id = e.id)')->fetchColumn();
        if ($sinArtista > 0) throw new RuntimeException("No se puede revertir: $sinArtista evento(s) no tienen ningún artista (en el esquema anterior era obligatorio). Asígnales un artista o elimínalos.");
        $tourSin = (int)$pdo->query('SELECT COUNT(*) FROM tours t WHERE NOT EXISTS (SELECT 1 FROM tour_artistas ta WHERE ta.tour_id = t.id)')->fetchColumn();
        if ($tourSin > 0) throw new RuntimeException("No se puede revertir: $tourSin gira(s) no tienen ningún artista.");

        // 2) Re-derivar las columnas antiguas
        $pdo->exec('UPDATE eventos e SET artista_id = (SELECT ea.artista_id FROM evento_artistas ea WHERE ea.evento_id = e.id ORDER BY (ea.es_principal IS NULL), ea.orden_presentacion LIMIT 1)');
        $pdo->exec('UPDATE tours t SET artista_id = (SELECT ta.artista_id FROM tour_artistas ta WHERE ta.tour_id = t.id ORDER BY (ta.es_principal IS NULL), ta.artista_id LIMIT 1)');

        $upd = $pdo->prepare('UPDATE artistas SET genero = ?, extra = ? WHERE id = ?');
        foreach ($pdo->query('SELECT id, extra FROM artistas')->fetchAll() as $a) {
            $gs = $pdo->prepare('SELECT g.nombre, ag.es_principal FROM artista_generos ag JOIN cat_generos g ON g.id = ag.genero_id WHERE ag.artista_id = ? ORDER BY ag.orden');
            $gs->execute([$a['id']]);
            $rows = $gs->fetchAll();
            $extra = $a['extra'] ? (json_decode($a['extra'], true) ?: []) : [];
            $principal = ''; $subs = [];
            foreach ($rows as $r) { if ($r['es_principal'] && $principal === '') $principal = $r['nombre']; else $subs[] = $r['nombre']; }
            if ($subs) $extra['subgenres'] = $subs;
            $upd->execute([$principal, $extra ? json_encode($extra, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null, $a['id']]);
        }
        foreach (['Manager' => 'manager', 'Booking' => 'booking_agent'] as $rol => $col) {
            $pdo->exec("UPDATE artistas a SET a.$col = COALESCE((SELECT TRIM(CONCAT(c.nombre, ' ', COALESCE(c.apellidos, ''))) FROM artista_contactos ac JOIN contactos c ON c.id = ac.contacto_id JOIN cat_roles_contacto r ON r.id = ac.rol_id WHERE ac.artista_id = a.id AND r.nombre = '$rol' ORDER BY (ac.es_principal IS NULL) LIMIT 1), '')");
        }
        $pdo->exec("UPDATE proveedores p SET
            p.contacto = COALESCE((SELECT TRIM(CONCAT(c.nombre, ' ', COALESCE(c.apellidos, ''))) FROM proveedor_contactos pc JOIN contactos c ON c.id = pc.contacto_id WHERE pc.proveedor_id = p.id ORDER BY (pc.es_principal IS NULL) LIMIT 1), ''),
            p.telefono = COALESCE((SELECT t.telefono FROM proveedor_contactos pc JOIN contacto_telefonos t ON t.contacto_id = pc.contacto_id AND t.es_principal = 1 WHERE pc.proveedor_id = p.id ORDER BY (pc.es_principal IS NULL) LIMIT 1), ''),
            p.correo = COALESCE((SELECT e.correo FROM proveedor_contactos pc JOIN contacto_correos e ON e.contacto_id = pc.contacto_id AND e.es_principal = 1 WHERE pc.proveedor_id = p.id ORDER BY (pc.es_principal IS NULL) LIMIT 1), '')");

        // 3) Reconstruir contactos_legacy (un contacto → su primer venue) y el contacto principal del venue
        if (!db_table_exists($pdo, 'contactos_legacy')) throw new RuntimeException('Falta contactos_legacy: no se puede revertir.');
        $pdo->exec('UPDATE venues SET contacto_principal_id = NULL');
        $pdo->exec('DELETE FROM contactos_legacy');
        $pdo->exec("INSERT INTO contactos_legacy (id, venue_id, nombre, correo, telefono, rol)
            SELECT c.id, vc.venue_id, TRIM(CONCAT(c.nombre, ' ', COALESCE(c.apellidos, ''))),
                   COALESCE((SELECT e.correo FROM contacto_correos e WHERE e.contacto_id = c.id ORDER BY (e.es_principal IS NULL), e.id LIMIT 1), ''),
                   COALESCE((SELECT t.telefono FROM contacto_telefonos t WHERE t.contacto_id = c.id ORDER BY (t.es_principal IS NULL), t.id LIMIT 1), ''),
                   r.nombre
            FROM contactos c
            JOIN venue_contactos vc ON vc.contacto_id = c.id AND vc.venue_id = (SELECT MIN(v2.venue_id) FROM venue_contactos v2 WHERE v2.contacto_id = c.id)
            JOIN cat_roles_contacto r ON r.id = vc.rol_id");
        $pdo->exec('UPDATE venues v JOIN venue_contactos vc ON vc.venue_id = v.id AND vc.es_principal = 1 JOIN contactos_legacy cl ON cl.id = vc.contacto_id AND cl.venue_id = v.id SET v.contacto_principal_id = vc.contacto_id');

        // 4) Quitar lo añadido
        if (db_constraint_exists($pdo, 'eventos', 'chk_eventos_utilidad')) { db_exec_ignore($pdo, 'ALTER TABLE eventos DROP CONSTRAINT chk_eventos_utilidad'); db_exec_ignore($pdo, 'ALTER TABLE eventos DROP CHECK chk_eventos_utilidad'); }
        foreach (['tour_artistas', 'evento_artistas', 'artista_contactos', 'proveedor_contactos', 'venue_contactos', 'contacto_telefonos', 'contacto_correos', 'artista_generos'] as $t) $pdo->exec("DROP TABLE IF EXISTS `$t`");
        $pdo->exec('DROP TABLE IF EXISTS contactos');
        $pdo->exec('RENAME TABLE contactos_legacy TO contactos');
        foreach (['cat_generos', 'cat_roles_contacto', 'cat_monedas'] as $t) $pdo->exec("DROP TABLE IF EXISTS `$t`");
        $pdo->exec('ALTER TABLE eventos MODIFY artista_id VARCHAR(40) NOT NULL');
        $pdo->exec('ALTER TABLE tours MODIFY artista_id VARCHAR(40) NOT NULL');
    },
];
