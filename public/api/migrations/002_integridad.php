<?php
declare(strict_types=1);

// Migración 002 — Integridad (Fase 1)
//  · restricciones CHECK de dominio y rango
//  · columna `version` (bloqueo optimista) en las tablas principales
//  · fechas de auditoría VARCHAR → DATETIME(3) (UTC)
//  · contratos: historial protegido (FK RESTRICT) y tamaño en bytes
//  · índices redundantes retirados
// Reversible: down() restaura el estado anterior sin perder datos.

const MIG002_TS = [
    'artistas' => ['created_at', 'updated_at', 'deleted_at'], 'venues' => ['created_at', 'updated_at', 'deleted_at'],
    'tours' => ['created_at', 'updated_at', 'deleted_at'], 'eventos' => ['created_at', 'updated_at', 'deleted_at'],
    'proveedores' => ['created_at'], 'proyectos_grabacion' => ['created_at'], 'contratos' => ['fecha_subida'],
];
const MIG002_VERSIONED = ['artistas', 'venues', 'tours', 'eventos', 'proveedores', 'contratos', 'proyectos_grabacion'];

function mig002_in(array $v): string { return '(' . implode(',', array_map(fn($x) => "'" . str_replace("'", "''", $x) . "'", $v)) . ')'; }

function mig002_checks(): array {
    $score = fn($c) => "$c BETWEEN 0 AND 100";
    return [
        ['venues', 'chk_venues_scores', implode(' AND ', array_map($score, ['score_rentabilidad', 'score_respuesta', 'score_puntualidad_pago', 'score_negociacion', 'score_produccion', 'score_hospitalidad']))],
        ['venues', 'chk_venues_rating', 'rating BETWEEN 0 AND 5'],
        ['venues', 'chk_venues_coord', '(latitud IS NULL OR latitud BETWEEN -90 AND 90) AND (longitud IS NULL OR longitud BETWEEN -180 AND 180)'],
        ['eventos', 'chk_eventos_estado', 'estado IN ' . mig002_in(['Draft', 'Confirmed', 'Completed', 'Cancelled'])],
        ['eventos', 'chk_eventos_cantidades', 'capacidad >= 0 AND asistencia >= 0 AND precio_boleto >= 0 AND ingreso_total >= 0 AND gastos_totales >= 0'],
        ['tours', 'chk_tours_status', 'status IN ' . mig002_in(['Planning', 'Active', 'Completed', 'Cancelled'])],
        ['tours', 'chk_tours_fechas', '(fecha_inicio IS NULL OR fecha_fin IS NULL OR fecha_fin >= fecha_inicio)'],
        ['contratos', 'chk_contratos_estado', 'estado IN ' . mig002_in(['Draft', 'Pending', 'Signed', 'Rejected', 'Active'])],
        ['contratos', 'chk_contratos_tipo', 'tipo IN ' . mig002_in(['Management', 'Booking', 'Performance', 'Co-production', 'NDA', 'Foro/Arrendamiento', 'Other'])],
        ['contratos', 'chk_contratos_tamano', '(tamano_bytes IS NULL OR tamano_bytes >= 0)'],
        ['proveedores', 'chk_proveedores_categoria', 'categoria IN ' . mig002_in(['Sonido', 'Ingeniero de Audio', 'Iluminación', 'Catering', 'Backline', 'Escenografía', 'Seguridad', 'Personal de Apoyo', 'Otros'])],
        ['proveedores', 'chk_proveedores_valores', 'rating BETWEEN 0 AND 5 AND costo_por_show >= 0'],
        ['proyectos_grabacion', 'chk_proyectos_estado', 'estado IN ' . mig002_in(['Planificación', 'Pre-producción', 'Grabando', 'Mezcla', 'Masterización', 'Completado'])],
    ];
}

function mig002_iso_to_dt(?string $v): ?string {
    if ($v === null || trim($v) === '') return null;
    try { return (new DateTimeImmutable($v))->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s.v'); }
    catch (Throwable $e) { return null; }
}
function mig002_size_to_bytes(?string $s): ?int {
    if ($s === null || !preg_match('/^\s*([\d.,]+)\s*(B|KB|MB|GB)?\s*$/i', $s, $m)) return null;
    $mult = ['B' => 1, 'KB' => 1024, 'MB' => 1048576, 'GB' => 1073741824][strtoupper($m[2] ?: 'B')];
    return (int)round((float)str_replace(',', '.', $m[1]) * $mult);
}
function mig002_bytes_to_size(?int $b): string {
    if ($b === null) return '';
    if ($b >= 1073741824) return round($b / 1073741824, 1) . ' GB';
    if ($b >= 1048576) return round($b / 1048576, 1) . ' MB';
    if ($b >= 1024) return round($b / 1024, 1) . ' KB';
    return $b . ' B';
}

return [
    'id' => 2,
    'name' => 'integridad_fase1',
    'description' => 'CHECK de dominio, version (bloqueo optimista), fechas DATETIME, historial contractual protegido, índices redundantes',
    'up' => function (PDO $pdo): void {
        // 0) Verificación previa: si hay datos fuera de dominio se aborta SIN cambiar nada.
        if (db_col_type($pdo, 'contratos', 'tamano_bytes') === null) { /* aún no existe: se valida el resto */ }
        $bad = [];
        foreach (mig002_checks() as [$t, $name, $cond]) {
            if ($name === 'chk_contratos_tamano' || db_constraint_exists($pdo, $t, $name)) continue;
            $n = (int)$pdo->query("SELECT COUNT(*) FROM `$t` WHERE NOT ($cond)")->fetchColumn();
            if ($n > 0) $bad[] = "$t.$name: $n registro(s) fuera de dominio";
        }
        if ($bad) throw new RuntimeException('Datos que incumplen las nuevas reglas (corrígelos antes de migrar): ' . implode('; ', $bad));

        // 1) version
        foreach (MIG002_VERSIONED as $t) {
            if (!db_col_exists($pdo, $t, 'version')) $pdo->exec("ALTER TABLE `$t` ADD COLUMN version INT NOT NULL DEFAULT 1");
        }

        // 2) fechas de auditoría → DATETIME(3)
        foreach (MIG002_TS as $t => $cols) {
            foreach ($cols as $c) {
                if (db_col_type($pdo, $t, $c) !== 'varchar') continue;
                $tmp = $c . '__dt';
                if (!db_col_exists($pdo, $t, $tmp)) $pdo->exec("ALTER TABLE `$t` ADD COLUMN `$tmp` DATETIME(3) NULL");
                $upd = $pdo->prepare("UPDATE `$t` SET `$tmp` = ? WHERE id = ?");
                foreach ($pdo->query("SELECT id, `$c` v FROM `$t`")->fetchAll() as $r) $upd->execute([mig002_iso_to_dt($r['v']), $r['id']]);
                if ($c === 'created_at' || $c === 'updated_at') $pdo->exec("UPDATE `$t` SET `$tmp` = NOW(3) WHERE `$tmp` IS NULL");
                $pdo->exec("ALTER TABLE `$t` DROP COLUMN `$c`");
                $def = ($c === 'created_at' || $c === 'updated_at') ? 'DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)' : 'DATETIME(3) NULL DEFAULT NULL';
                $pdo->exec("ALTER TABLE `$t` CHANGE `$tmp` `$c` $def");
            }
        }

        // 3) contratos: tamaño en bytes
        if (!db_col_exists($pdo, 'contratos', 'tamano_bytes')) $pdo->exec('ALTER TABLE contratos ADD COLUMN tamano_bytes BIGINT NULL');
        if (db_col_exists($pdo, 'contratos', 'tamano')) {
            $upd = $pdo->prepare('UPDATE contratos SET tamano_bytes = ? WHERE id = ?');
            foreach ($pdo->query('SELECT id, tamano FROM contratos')->fetchAll() as $r) $upd->execute([mig002_size_to_bytes($r['tamano']), $r['id']]);
            $pdo->exec('ALTER TABLE contratos DROP COLUMN tamano');
        }

        // 4) contratos: el historial no se pierde (RESTRICT en lugar de SET NULL)
        foreach (db_fk_names($pdo, 'contratos') as $fk) {
            $st = $pdo->prepare('SELECT delete_rule FROM information_schema.referential_constraints WHERE constraint_schema = DATABASE() AND table_name = ? AND constraint_name = ?');
            $st->execute(['contratos', $fk]);
            if ($st->fetchColumn() === 'SET NULL') $pdo->exec("ALTER TABLE contratos DROP FOREIGN KEY `$fk`");
        }
        foreach (['artista_id' => 'artistas', 'venue_id' => 'venues', 'tour_id' => 'tours', 'evento_id' => 'eventos'] as $col => $ref) {
            $name = 'fk_contratos_' . substr($col, 0, -3);
            if (!db_constraint_exists($pdo, 'contratos', $name)) $pdo->exec("ALTER TABLE contratos ADD CONSTRAINT `$name` FOREIGN KEY ($col) REFERENCES $ref(id) ON DELETE RESTRICT");
        }

        // 5) CHECK de dominio
        foreach (mig002_checks() as [$t, $name, $cond]) {
            if (!db_constraint_exists($pdo, $t, $name)) $pdo->exec("ALTER TABLE `$t` ADD CONSTRAINT `$name` CHECK ($cond)");
        }

        // 6) índices redundantes / sin utilidad (ver DATABASE_AUDIT §7)
        foreach ([['eventos', 'idx_eventos_artista'], ['artistas', 'idx_artistas_deleted']] as [$t, $i]) {
            if (db_index_exists($pdo, $t, $i)) $pdo->exec("ALTER TABLE `$t` DROP INDEX `$i`");
        }
    },

    'down' => function (PDO $pdo): void {
        foreach (array_reverse(mig002_checks()) as [$t, $name]) {
            if (db_constraint_exists($pdo, $t, $name)) { db_exec_ignore($pdo, "ALTER TABLE `$t` DROP CONSTRAINT `$name`"); db_exec_ignore($pdo, "ALTER TABLE `$t` DROP CHECK `$name`"); }
        }
        if (!db_index_exists($pdo, 'eventos', 'idx_eventos_artista')) $pdo->exec('CREATE INDEX idx_eventos_artista ON eventos(artista_id)');
        if (!db_index_exists($pdo, 'artistas', 'idx_artistas_deleted')) $pdo->exec('CREATE INDEX idx_artistas_deleted ON artistas(deleted_at)');

        foreach (['artista_id', 'venue_id', 'tour_id', 'evento_id'] as $col) {
            $name = 'fk_contratos_' . substr($col, 0, -3);
            if (db_constraint_exists($pdo, 'contratos', $name)) $pdo->exec("ALTER TABLE contratos DROP FOREIGN KEY `$name`");
        }
        foreach (['artista_id' => 'artistas', 'venue_id' => 'venues', 'tour_id' => 'tours', 'evento_id' => 'eventos'] as $col => $ref) {
            $pdo->exec("ALTER TABLE contratos ADD FOREIGN KEY ($col) REFERENCES $ref(id) ON DELETE SET NULL");
        }

        if (!db_col_exists($pdo, 'contratos', 'tamano')) $pdo->exec('ALTER TABLE contratos ADD COLUMN tamano VARCHAR(40) NULL');
        if (db_col_exists($pdo, 'contratos', 'tamano_bytes')) {
            $upd = $pdo->prepare('UPDATE contratos SET tamano = ? WHERE id = ?');
            foreach ($pdo->query('SELECT id, tamano_bytes b FROM contratos')->fetchAll() as $r) $upd->execute([mig002_bytes_to_size($r['b'] === null ? null : (int)$r['b']), $r['id']]);
            $pdo->exec('ALTER TABLE contratos DROP COLUMN tamano_bytes');
        }

        foreach (MIG002_TS as $t => $cols) {
            foreach ($cols as $c) {
                if (db_col_type($pdo, $t, $c) !== 'datetime') continue;
                $tmp = $c . '__vc';
                if (!db_col_exists($pdo, $t, $tmp)) $pdo->exec("ALTER TABLE `$t` ADD COLUMN `$tmp` VARCHAR(32) NULL");
                $pdo->exec("UPDATE `$t` SET `$tmp` = CONCAT(DATE_FORMAT(`$c`, '%Y-%m-%dT%H:%i:%s.'), LPAD(FLOOR(MICROSECOND(`$c`) / 1000), 3, '0'), 'Z') WHERE `$c` IS NOT NULL");
                $pdo->exec("ALTER TABLE `$t` DROP COLUMN `$c`");
                $pdo->exec("ALTER TABLE `$t` CHANGE `$tmp` `$c` VARCHAR(32) NULL DEFAULT NULL");
            }
        }
        foreach (MIG002_VERSIONED as $t) {
            if (db_col_exists($pdo, $t, 'version')) $pdo->exec("ALTER TABLE `$t` DROP COLUMN version");
        }
    },
];
