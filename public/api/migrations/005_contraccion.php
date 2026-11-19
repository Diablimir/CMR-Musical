<?php
declare(strict_types=1);

// Migración 005 — Contracción (Fase 4): retira las estructuras que las migraciones 003 y 004 reemplazaron.
//   artistas.genero/manager/booking_agent/extra · venues.contacto_principal_id/extra · contactos_legacy
//   proveedores.contacto/telefono/correo · tours.artista_id · eventos.artista_id/extra
//   contratos.artista_id/venue_id/tour_id/evento_id · proyectos_grabacion.extra · tablas collections y schema_meta (formatos anteriores)
// Antes de tocar nada se verifica que el reemplazo esté completo; si no, ABORTA sin cambios.
// down() vuelve a crear las columnas/tablas (vacías): los datos viven en las tablas nuevas y se re-derivan
// al seguir revirtiendo (004 y 003), que es como se comprobó en las pruebas.

const MIG005_DROP_COLS = [
    'artistas' => ['genero', 'manager', 'booking_agent', 'extra'],
    'venues' => ['contacto_principal_id', 'extra'],
    'proveedores' => ['contacto', 'telefono', 'correo'],
    'tours' => ['artista_id'],
    'eventos' => ['artista_id', 'extra'],
    'contratos' => ['artista_id', 'venue_id', 'tour_id', 'evento_id'],
    'proyectos_grabacion' => ['extra'],
];

return [
    'id' => 5,
    'name' => 'contraccion_fase4',
    'description' => 'Retira columnas y tablas obsoletas ya reemplazadas (genero, manager, contactos_legacy, artista_id de eventos/giras, ids de contratos, extra JSON…)',
    'up' => function (PDO $pdo): string {
        // ───────── Verificación previa (sin cambios si algo falta) ─────────
        $problems = [];
        $n = fn(string $sql) => (int)$pdo->query($sql)->fetchColumn();
        if (db_col_exists($pdo, 'eventos', 'artista_id')) {
            $x = $n('SELECT COUNT(*) FROM eventos e WHERE NOT EXISTS (SELECT 1 FROM evento_artistas ea WHERE ea.evento_id = e.id)');
            if ($x) $problems[] = "$x evento(s) sin alineación en evento_artistas";
            $x = $n('SELECT COUNT(*) FROM tours t WHERE NOT EXISTS (SELECT 1 FROM tour_artistas ta WHERE ta.tour_id = t.id)');
            if ($x) $problems[] = "$x gira(s) sin artistas en tour_artistas";
        }
        foreach (['artistas', 'venues', 'eventos', 'proyectos_grabacion'] as $t) {
            if (db_col_exists($pdo, $t, 'extra')) {
                $x = $n("SELECT COUNT(*) FROM `$t` WHERE extra IS NOT NULL AND extra <> '' AND extra <> '[]' AND extra <> '{}'");
                if ($x) $problems[] = "$x fila(s) de $t con datos en el JSON `extra` que no se modelaron (se perderían)";
            }
        }
        if (db_table_exists($pdo, 'collections') && $n('SELECT COUNT(*) FROM artistas') === 0) {
            foreach ($pdo->query('SELECT name, data FROM collections')->fetchAll() as $r) {
                $d = json_decode((string)$r['data'], true);
                if (is_array($d) && $d) { $problems[] = "la colección «{$r['name']}» del formato anterior tiene datos sin importar"; break; }
            }
        }
        if ($problems) throw new RuntimeException('No se puede contraer todavía: ' . implode('; ', $problems) . '. No se cambió nada.');

        // ───────── Contracción (idempotente por paso) ─────────
        $dropped = [];
        // llaves foráneas y tabla antigua de contactos
        if (db_constraint_exists($pdo, 'venues', 'fk_venues_principal_contact')) $pdo->exec('ALTER TABLE venues DROP FOREIGN KEY fk_venues_principal_contact');
        if (db_table_exists($pdo, 'contactos_legacy')) { $pdo->exec('DROP TABLE contactos_legacy'); $dropped[] = 'contactos_legacy'; }
        foreach (['tours' => 'artistas', 'eventos' => 'artistas'] as $t => $ref) {
            if (!db_col_exists($pdo, $t, 'artista_id')) continue;
            foreach (db_fk_names($pdo, $t, $ref) as $fk) $pdo->exec("ALTER TABLE `$t` DROP FOREIGN KEY `$fk`");
        }
        foreach (['fk_contratos_artista', 'fk_contratos_venue', 'fk_contratos_tour', 'fk_contratos_evento'] as $fk) {
            if (db_constraint_exists($pdo, 'contratos', $fk)) $pdo->exec("ALTER TABLE contratos DROP FOREIGN KEY `$fk`");
        }
        // índices que quedarían huérfanos o redundantes
        foreach ([['eventos', 'idx_eventos_artista_fecha'], ['tours', 'idx_tours_artista'], ['venues', 'idx_venues_contacto_principal'],
                  ['contratos', 'idx_contratos_artista'], ['contratos', 'idx_contratos_evento']] as [$t, $i]) {
            if (db_index_exists($pdo, $t, $i)) $pdo->exec("ALTER TABLE `$t` DROP INDEX `$i`");
        }
        foreach (MIG005_DROP_COLS as $t => $cols) foreach ($cols as $c) {
            if (db_col_exists($pdo, $t, $c)) { $pdo->exec("ALTER TABLE `$t` DROP COLUMN `$c`"); $dropped[] = "$t.$c"; }
        }
        foreach (['collections', 'schema_meta'] as $t) if (db_table_exists($pdo, $t)) { $pdo->exec("DROP TABLE `$t`"); $dropped[] = $t; }
        return 'eliminado: ' . implode(', ', $dropped);
    },

    'down' => function (PDO $pdo): void {
        $o = ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
        $add = [
            'artistas' => ['genero VARCHAR(150)', 'manager VARCHAR(255)', 'booking_agent VARCHAR(255)', 'extra LONGTEXT'],
            'venues' => ['contacto_principal_id VARCHAR(40) NULL', 'extra LONGTEXT'],
            'proveedores' => ['contacto VARCHAR(255)', 'telefono VARCHAR(60)', 'correo VARCHAR(255)'],
            'tours' => ['artista_id VARCHAR(40) NULL'],
            'eventos' => ['artista_id VARCHAR(40) NULL', 'extra LONGTEXT'],
            'contratos' => ['artista_id VARCHAR(40) NULL', 'venue_id VARCHAR(40) NULL', 'tour_id VARCHAR(40) NULL', 'evento_id VARCHAR(40) NULL'],
            'proyectos_grabacion' => ['extra LONGTEXT'],
        ];
        foreach ($add as $t => $defs) foreach ($defs as $d) { $name = explode(' ', $d)[0]; if (!db_col_exists($pdo, $t, $name)) $pdo->exec("ALTER TABLE `$t` ADD COLUMN $d"); }
        $pdo->exec("CREATE TABLE IF NOT EXISTS contactos_legacy (
            id VARCHAR(40) NOT NULL PRIMARY KEY, venue_id VARCHAR(40) NOT NULL, nombre VARCHAR(255) NOT NULL, correo VARCHAR(255), telefono VARCHAR(60), rol VARCHAR(150),
            KEY idx_contactos_venue (venue_id), KEY idx_contactos_correo (correo),
            CONSTRAINT contactos_legacy_ibfk_1 FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
        ){$o}");
        if (!db_constraint_exists($pdo, 'venues', 'fk_venues_principal_contact')) $pdo->exec('ALTER TABLE venues ADD CONSTRAINT fk_venues_principal_contact FOREIGN KEY (contacto_principal_id) REFERENCES contactos_legacy(id) ON DELETE SET NULL');
        foreach (['tours' => 'fk_tours_artista_v1', 'eventos' => 'fk_eventos_artista_v1'] as $t => $fk) {
            if (!db_constraint_exists($pdo, $t, $fk)) $pdo->exec("ALTER TABLE `$t` ADD CONSTRAINT `$fk` FOREIGN KEY (artista_id) REFERENCES artistas(id) ON DELETE RESTRICT");
        }
        foreach (['artista_id' => ['artistas', 'artista'], 'venue_id' => ['venues', 'venue'], 'tour_id' => ['tours', 'tour'], 'evento_id' => ['eventos', 'evento']] as $col => [$ref, $nm]) {
            if (!db_constraint_exists($pdo, 'contratos', "fk_contratos_$nm")) $pdo->exec("ALTER TABLE contratos ADD CONSTRAINT `fk_contratos_$nm` FOREIGN KEY ($col) REFERENCES $ref(id) ON DELETE RESTRICT");
        }
        if (!db_index_exists($pdo, 'eventos', 'idx_eventos_artista_fecha')) $pdo->exec('CREATE INDEX idx_eventos_artista_fecha ON eventos(artista_id, fecha)');
        if (!db_index_exists($pdo, 'tours', 'idx_tours_artista')) $pdo->exec('CREATE INDEX idx_tours_artista ON tours(artista_id)');
    },
];
