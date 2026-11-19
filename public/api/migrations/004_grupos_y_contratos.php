<?php
declare(strict_types=1);

// Migración 004 — Grupos repetidos y contratos con partes (Fase 3)
//  · artistas: idiomas, redes, pipeline, hitos, integrantes, foto/ficha como columnas
//  · venues: datos de ficha como columnas + horarios y bandas locales en tablas
//  · eventos: setlist, bandas invitadas y feedback
//  · proyectos_grabacion: canciones, costos, pagos, etapas e instrumentos (los importes se pueden sumar y consultar)
//  · contratos: partes y objeto en tablas (artistas, venues, proveedores, eventos, giras); el historial no se pierde (RESTRICT)
// Expansión: las columnas JSON `extra` y las de contratos se conservan (sin escribirse) hasta la Fase 4.
// down() reconstruye el JSON y las columnas antiguas desde las tablas nuevas.

function mig004_id(string $prefix, int $i): string { return $prefix . '-' . ($i + 1); }
function mig004_str(mixed $v, int $max): ?string { if ($v === null || is_array($v)) return null; $s = trim((string)$v); return $s === '' ? null : mb_substr($s, 0, $max); }
function mig004_date(mixed $v): ?string {
    if (!is_string($v) || !preg_match('/^(\d{4})-(\d{2})-(\d{2})/', $v, $m)) return null;
    return checkdate((int)$m[2], (int)$m[3], (int)$m[1]) ? "$m[1]-$m[2]-$m[3]" : null;
}
function mig004_secs(mixed $v): ?int {
    if (!is_string($v) || !preg_match('/^(\d{1,3}):([0-5]\d)$/', trim($v), $m)) return null;
    return (int)$m[1] * 60 + (int)$m[2];
}
function mig004_dur(?int $s): ?string { return $s === null ? null : intdiv($s, 60) . ':' . str_pad((string)($s % 60), 2, '0', STR_PAD_LEFT); }
function mig004_num(mixed $v, float $min, ?float $max = null): ?float {
    if (!is_numeric($v)) return null; $n = (float)$v;
    return ($n < $min || ($max !== null && $n > $max)) ? null : $n;
}
function mig004_json(array $a): ?string { return $a ? json_encode($a, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null; }
/** ids únicos por padre: si falta o se repite, se genera uno. */
function mig004_uid(array &$seen, mixed $id, string $prefix, int $i): string {
    $id = is_string($id) && $id !== '' ? mb_substr($id, 0, 40) : mig004_id($prefix, $i);
    while (isset($seen[$id])) $id = mb_substr($id, 0, 36) . '-' . $i . count($seen);
    return $seen[$id] = $id;
}

const MIG004_NETS = ['instagram', 'tiktok', 'facebook', 'youtube', 'spotify', 'appleMusic', 'twitter', 'threads', 'whatsapp', 'website'];
const MIG004_ART_KEYS = ['bio', 'startDate', 'languages', 'label', 'publisher', 'distributor', 'photoStyle', 'members', 'memberHistory', 'socialMedia', 'pipeline', 'history'];
const MIG004_VEN_KEYS = ['website', 'phone', 'userRatingsCount', 'placeId', 'establishmentType', 'hours', 'instagram', 'facebook', 'tiktok', 'whatsapp', 'email', 'youtube', 'twitter', 'localBands'];
const MIG004_EVT_KEYS = ['guestBands', 'setlist', 'feedback'];
const MIG004_REC_KEYS = ['songs', 'costs', 'payments', 'stages'];

return [
    'id' => 4,
    'name' => 'grupos_y_contratos_fase3',
    'description' => 'Idiomas, redes, pipeline, hitos, integrantes, setlist, proyectos y contratos con partes en tablas',
    'up' => function (PDO $pdo): string {
        $o = ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
        $in = fn(array $v) => implode(',', array_map(fn($x) => "'" . str_replace("'", "''", $x) . "'", $v));

        // ───────── columnas nuevas (idempotente) ─────────
        $addCols = [
            'artistas' => ['bio TEXT NULL', 'fecha_inicio DATE NULL', 'sello VARCHAR(255) NULL', 'editorial VARCHAR(255) NULL', 'distribuidora VARCHAR(255) NULL',
                'foto_zoom DECIMAL(6,2) NULL', 'foto_rotacion DECIMAL(6,2) NULL', 'foto_contraste DECIMAL(6,2) NULL', 'foto_brillo DECIMAL(6,2) NULL',
                'foto_grises DECIMAL(6,2) NULL', 'foto_sepia DECIMAL(6,2) NULL', 'foto_desenfoque DECIMAL(6,2) NULL'],
            'venues' => ['sitio_web VARCHAR(500) NULL', 'telefono VARCHAR(60) NULL', 'num_resenas INT NOT NULL DEFAULT 0', 'place_id VARCHAR(120) NULL', 'tipo_establecimiento VARCHAR(120) NULL',
                'instagram VARCHAR(255) NULL', 'facebook VARCHAR(255) NULL', 'tiktok VARCHAR(255) NULL', 'whatsapp VARCHAR(255) NULL', 'correo VARCHAR(255) NULL', 'youtube VARCHAR(255) NULL', 'twitter VARCHAR(255) NULL'],
            'eventos' => ['feedback_artista TEXT NULL', 'reaccion_publico TEXT NULL', 'valoracion_ritmo TINYINT NULL', 'notas_optimizacion TEXT NULL'],
        ];
        foreach ($addCols as $t => $defs) foreach ($defs as $def) {
            $name = explode(' ', $def)[0];
            if (!db_col_exists($pdo, $t, $name)) $pdo->exec("ALTER TABLE `$t` ADD COLUMN $def");
        }
        if (!db_constraint_exists($pdo, 'eventos', 'chk_eventos_ritmo')) $pdo->exec('ALTER TABLE eventos ADD CONSTRAINT chk_eventos_ritmo CHECK (valoracion_ritmo IS NULL OR valoracion_ritmo BETWEEN 1 AND 5)');
        if (!db_constraint_exists($pdo, 'artistas', 'chk_artistas_foto')) $pdo->exec('ALTER TABLE artistas ADD CONSTRAINT chk_artistas_foto CHECK (foto_zoom IS NULL OR foto_zoom > 0)');

        // ───────── tablas hijas ─────────
        $tables = [
"CREATE TABLE IF NOT EXISTS artista_idiomas (
    artista_id VARCHAR(40) NOT NULL, idioma VARCHAR(60) NOT NULL, orden TINYINT UNSIGNED NOT NULL,
    PRIMARY KEY (artista_id, idioma),
    CONSTRAINT fk_ai_artista FOREIGN KEY (artista_id) REFERENCES artistas(id) ON DELETE CASCADE
){$o}",
"CREATE TABLE IF NOT EXISTS artista_redes (
    artista_id VARCHAR(40) NOT NULL, plataforma VARCHAR(20) NOT NULL, enlace VARCHAR(500) NOT NULL DEFAULT '',
    conectado TINYINT(1) NOT NULL DEFAULT 0, usuario_conectado VARCHAR(100) NULL,
    PRIMARY KEY (artista_id, plataforma),
    CONSTRAINT fk_ar_artista FOREIGN KEY (artista_id) REFERENCES artistas(id) ON DELETE CASCADE,
    CONSTRAINT chk_ar_plataforma CHECK (plataforma IN ({$in(MIG004_NETS)}))
){$o}",
"CREATE TABLE IF NOT EXISTS artista_pipeline (
    artista_id VARCHAR(40) NOT NULL, item_id VARCHAR(40) NOT NULL, orden SMALLINT UNSIGNED NOT NULL,
    nombre VARCHAR(255) NOT NULL, categoria VARCHAR(30) NOT NULL, completado TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (artista_id, item_id),
    CONSTRAINT fk_ap_artista FOREIGN KEY (artista_id) REFERENCES artistas(id) ON DELETE CASCADE,
    CONSTRAINT chk_ap_categoria CHECK (categoria IN ('Branding','Distribución','Presencia','Booking & Management'))
){$o}",
"CREATE TABLE IF NOT EXISTS artista_hitos (
    artista_id VARCHAR(40) NOT NULL, hito_id VARCHAR(40) NOT NULL, orden SMALLINT UNSIGNED NOT NULL,
    fecha DATE NULL, titulo VARCHAR(255) NOT NULL, descripcion TEXT NULL, tipo VARCHAR(20) NOT NULL,
    PRIMARY KEY (artista_id, hito_id), KEY idx_ah_fecha (artista_id, fecha),
    CONSTRAINT fk_ah_artista FOREIGN KEY (artista_id) REFERENCES artistas(id) ON DELETE CASCADE,
    CONSTRAINT chk_ah_tipo CHECK (tipo IN ('milestone','release','signing','tour','achievement'))
){$o}",
"CREATE TABLE IF NOT EXISTS artista_integrantes (
    artista_id VARCHAR(40) NOT NULL, integrante_id VARCHAR(40) NOT NULL, orden SMALLINT UNSIGNED NOT NULL,
    nombre VARCHAR(255) NOT NULL, rol VARCHAR(100) NOT NULL DEFAULT 'Músico', fecha_inicio DATE NULL, fecha_fin DATE NULL,
    lugar_inicio VARCHAR(255) NULL, activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (artista_id, integrante_id),
    CONSTRAINT fk_aint_artista FOREIGN KEY (artista_id) REFERENCES artistas(id) ON DELETE CASCADE,
    CONSTRAINT chk_aint_fechas CHECK (fecha_inicio IS NULL OR fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
){$o}",
"CREATE TABLE IF NOT EXISTS venue_horarios (
    venue_id VARCHAR(40) NOT NULL, orden SMALLINT UNSIGNED NOT NULL, descripcion VARCHAR(255) NOT NULL,
    PRIMARY KEY (venue_id, orden),
    CONSTRAINT fk_vh_venue FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
){$o}",
"CREATE TABLE IF NOT EXISTS venue_bandas_locales (
    venue_id VARCHAR(40) NOT NULL, orden SMALLINT UNSIGNED NOT NULL, nombre VARCHAR(255) NOT NULL,
    PRIMARY KEY (venue_id, orden),
    CONSTRAINT fk_vb_venue FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
){$o}",
"CREATE TABLE IF NOT EXISTS evento_bandas_invitadas (
    evento_id VARCHAR(40) NOT NULL, orden SMALLINT UNSIGNED NOT NULL, nombre VARCHAR(255) NOT NULL,
    PRIMARY KEY (evento_id, orden),
    CONSTRAINT fk_ebi_evento FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE
){$o}",
"CREATE TABLE IF NOT EXISTS evento_setlist (
    evento_id VARCHAR(40) NOT NULL, item_id VARCHAR(40) NOT NULL, orden SMALLINT UNSIGNED NOT NULL,
    titulo VARCHAR(255) NOT NULL, duracion_seg INT UNSIGNED NULL, tempo VARCHAR(10) NULL, notas_transicion TEXT NULL,
    PRIMARY KEY (evento_id, item_id), KEY idx_es_orden (evento_id, orden),
    CONSTRAINT fk_es_evento FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
    CONSTRAINT chk_es_tempo CHECK (tempo IS NULL OR tempo IN ('Lento','Medio','Rápido'))
){$o}",
"CREATE TABLE IF NOT EXISTS proyecto_canciones (
    proyecto_id VARCHAR(40) NOT NULL, cancion_id VARCHAR(40) NOT NULL, orden SMALLINT UNSIGNED NOT NULL,
    titulo VARCHAR(255) NOT NULL, duracion_seg INT UNSIGNED NULL, compositor VARCHAR(255) NULL,
    estado VARCHAR(30) NOT NULL, progreso TINYINT UNSIGNED NOT NULL DEFAULT 0, notas TEXT NULL,
    PRIMARY KEY (proyecto_id, cancion_id),
    CONSTRAINT fk_pc_proyecto FOREIGN KEY (proyecto_id) REFERENCES proyectos_grabacion(id) ON DELETE CASCADE,
    CONSTRAINT chk_pc_estado CHECK (estado IN ('Composición','Demo','Grabación de Instrumentos','Grabación de Voces','Mezcla','Masterizado','Listo')),
    CONSTRAINT chk_pc_progreso CHECK (progreso BETWEEN 0 AND 100)
){$o}",
"CREATE TABLE IF NOT EXISTS proyecto_costos (
    proyecto_id VARCHAR(40) NOT NULL, costo_id VARCHAR(40) NOT NULL, orden SMALLINT UNSIGNED NOT NULL,
    concepto VARCHAR(255) NOT NULL, categoria VARCHAR(30) NOT NULL, monto DECIMAL(12,2) NOT NULL DEFAULT 0, notas TEXT NULL,
    PRIMARY KEY (proyecto_id, costo_id),
    CONSTRAINT fk_pco_proyecto FOREIGN KEY (proyecto_id) REFERENCES proyectos_grabacion(id) ON DELETE CASCADE,
    CONSTRAINT chk_pco_categoria CHECK (categoria IN ('Estudio/Grabación','Músicos de Sesión','Mezcla','Masterización','Arreglos/Producción','Otros')),
    CONSTRAINT chk_pco_monto CHECK (monto >= 0)
){$o}",
"CREATE TABLE IF NOT EXISTS proyecto_pagos (
    proyecto_id VARCHAR(40) NOT NULL, pago_id VARCHAR(40) NOT NULL, orden SMALLINT UNSIGNED NOT NULL,
    concepto VARCHAR(255) NOT NULL, monto DECIMAL(12,2) NOT NULL DEFAULT 0, fecha_vencimiento DATE NULL,
    estado VARCHAR(12) NOT NULL DEFAULT 'Pendiente', notas TEXT NULL,
    PRIMARY KEY (proyecto_id, pago_id), KEY idx_pp_vencimiento (fecha_vencimiento),
    CONSTRAINT fk_pp_proyecto FOREIGN KEY (proyecto_id) REFERENCES proyectos_grabacion(id) ON DELETE CASCADE,
    CONSTRAINT chk_pp_estado CHECK (estado IN ('Pendiente','Pagado')),
    CONSTRAINT chk_pp_monto CHECK (monto >= 0)
){$o}",
"CREATE TABLE IF NOT EXISTS proyecto_etapas (
    proyecto_id VARCHAR(40) NOT NULL, etapa_id VARCHAR(40) NOT NULL, orden SMALLINT UNSIGNED NOT NULL,
    nombre VARCHAR(20) NOT NULL, estado VARCHAR(15) NOT NULL DEFAULT 'Pendiente', fecha_inicio DATE NULL, fecha_fin DATE NULL, notas TEXT NULL,
    PRIMARY KEY (proyecto_id, etapa_id),
    CONSTRAINT fk_pe_proyecto FOREIGN KEY (proyecto_id) REFERENCES proyectos_grabacion(id) ON DELETE CASCADE,
    CONSTRAINT chk_pe_nombre CHECK (nombre IN ('Pre-producción','Grabación','Revisión','Mezcla','Masterización','Listo')),
    CONSTRAINT chk_pe_estado CHECK (estado IN ('Pendiente','En Progreso','Completado')),
    CONSTRAINT chk_pe_fechas CHECK (fecha_inicio IS NULL OR fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
){$o}",
"CREATE TABLE IF NOT EXISTS proyecto_instrumentos (
    proyecto_id VARCHAR(40) NOT NULL, etapa_id VARCHAR(40) NOT NULL, instrumento_id VARCHAR(40) NOT NULL, orden SMALLINT UNSIGNED NOT NULL,
    nombre VARCHAR(255) NOT NULL, estado VARCHAR(10) NOT NULL DEFAULT 'Pendiente', musico VARCHAR(255) NULL,
    PRIMARY KEY (proyecto_id, etapa_id, instrumento_id),
    CONSTRAINT fk_pi_etapa FOREIGN KEY (proyecto_id, etapa_id) REFERENCES proyecto_etapas(proyecto_id, etapa_id) ON DELETE CASCADE,
    CONSTRAINT chk_pi_estado CHECK (estado IN ('Pendiente','Grabando','Listo'))
){$o}",
        ];
        foreach (['artistas' => ['artista', 'artistas'], 'venues' => ['venue', 'venues'], 'proveedores' => ['proveedor', 'proveedores'], 'eventos' => ['evento', 'eventos'], 'tours' => ['tour', 'tours']] as $t => [$s, $pl]) {
            // partes (artistas, venues, proveedores) y objeto (eventos, giras) del contrato; el contrato se lleva sus vínculos, pero la parte NO se puede borrar si hay contrato
            $tables[] = "CREATE TABLE IF NOT EXISTS contrato_{$pl} (
                contrato_id VARCHAR(40) NOT NULL, {$s}_id VARCHAR(40) NOT NULL,
                PRIMARY KEY (contrato_id, {$s}_id), KEY idx_c{$pl}_{$s} ({$s}_id),
                CONSTRAINT fk_c{$pl}_contrato FOREIGN KEY (contrato_id) REFERENCES contratos(id) ON DELETE CASCADE,
                CONSTRAINT fk_c{$pl}_{$s} FOREIGN KEY ({$s}_id) REFERENCES {$t}(id) ON DELETE RESTRICT
            ){$o}";
        }
        foreach ($tables as $sql) $pdo->exec($sql);

        // el historial de proyectos tampoco se pierde en silencio
        if (db_constraint_exists($pdo, 'proyectos_grabacion', 'fk_proyectos_artista') === false) {
            foreach (db_fk_names($pdo, 'proyectos_grabacion', 'artistas') as $fk) $pdo->exec("ALTER TABLE proyectos_grabacion DROP FOREIGN KEY `$fk`");
            $pdo->exec('ALTER TABLE proyectos_grabacion ADD CONSTRAINT fk_proyectos_artista FOREIGN KEY (artista_id) REFERENCES artistas(id) ON DELETE RESTRICT');
        }

        // ───────── datos (transaccional) ─────────
        $n = array_fill_keys(['idiomas', 'redes', 'pipeline', 'hitos', 'integrantes', 'horarios', 'bandas', 'invitadas', 'setlist', 'canciones', 'costos', 'pagos', 'etapas', 'instrumentos', 'c_artistas', 'c_venues', 'c_eventos', 'c_giras', 'c_giras_derivadas'], 0);
        $expected = $n; $unknown = 0;
        $pdo->beginTransaction();
        try {
            $count = fn(string $t) => (int)$pdo->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();

            // Artistas
            if ($count('artista_pipeline') + $count('artista_hitos') + $count('artista_integrantes') + $count('artista_redes') + $count('artista_idiomas') === 0) {
                $upA = $pdo->prepare('UPDATE artistas SET bio = ?, fecha_inicio = ?, sello = ?, editorial = ?, distribuidora = ?, foto_zoom = ?, foto_rotacion = ?, foto_contraste = ?, foto_brillo = ?, foto_grises = ?, foto_sepia = ?, foto_desenfoque = ?, extra = ? WHERE id = ?');
                $insI = $pdo->prepare('INSERT INTO artista_idiomas (artista_id, idioma, orden) VALUES (?, ?, ?)');
                $insR = $pdo->prepare('INSERT INTO artista_redes (artista_id, plataforma, enlace, conectado, usuario_conectado) VALUES (?, ?, ?, ?, ?)');
                $insP = $pdo->prepare('INSERT INTO artista_pipeline (artista_id, item_id, orden, nombre, categoria, completado) VALUES (?, ?, ?, ?, ?, ?)');
                $insH = $pdo->prepare('INSERT INTO artista_hitos (artista_id, hito_id, orden, fecha, titulo, descripcion, tipo) VALUES (?, ?, ?, ?, ?, ?, ?)');
                $insM = $pdo->prepare('INSERT INTO artista_integrantes (artista_id, integrante_id, orden, nombre, rol, fecha_inicio, fecha_fin, lugar_inicio, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
                foreach ($pdo->query('SELECT id, extra FROM artistas')->fetchAll() as $a) {
                    $x = $a['extra'] ? (json_decode($a['extra'], true) ?: []) : [];
                    $ps = is_array($x['photoStyle'] ?? null) ? $x['photoStyle'] : [];
                    $upA->execute([mig004_str($x['bio'] ?? null, 65000), mig004_date($x['startDate'] ?? null), mig004_str($x['label'] ?? null, 255), mig004_str($x['publisher'] ?? null, 255), mig004_str($x['distributor'] ?? null, 255),
                        mig004_num($ps['zoom'] ?? null, 0.0001, 100), mig004_num($ps['rotation'] ?? null, -3600, 3600), mig004_num($ps['contrast'] ?? null, 0, 1000), mig004_num($ps['brightness'] ?? null, 0, 1000), mig004_num($ps['grayscale'] ?? null, 0, 1000), mig004_num($ps['sepia'] ?? null, 0, 1000), mig004_num($ps['blur'] ?? null, 0, 1000),
                        mig004_json(array_diff_key($x, array_flip(MIG004_ART_KEYS))), $a['id']]);
                    $unknown += count(array_diff_key($x, array_flip(MIG004_ART_KEYS)));
                    $seen = []; foreach ((array)($x['languages'] ?? []) as $i => $l) { $l = mig004_str($l, 60); $expected['idiomas']++; if ($l !== null && !isset($seen[mb_strtolower($l)])) { $seen[mb_strtolower($l)] = 1; $insI->execute([$a['id'], $l, min($i + 1, 255)]); $n['idiomas']++; } }
                    $sm = is_array($x['socialMedia'] ?? null) ? $x['socialMedia'] : [];
                    foreach (MIG004_NETS as $net) {
                        $link = mig004_str($sm[$net] ?? null, 500); $conn = !empty($sm[$net . 'Connected']); $usr = mig004_str($sm[$net . 'ConnectedUser'] ?? null, 100);
                        if ($link === null && !$conn && $usr === null) continue;
                        $expected['redes']++; $insR->execute([$a['id'], $net, $link ?? '', $conn ? 1 : 0, $usr]); $n['redes']++;
                    }
                    $seen = []; foreach ((array)($x['pipeline'] ?? []) as $i => $it) { if (!is_array($it)) continue; $expected['pipeline']++; $cat = $it['category'] ?? ''; if (!in_array($cat, ['Branding', 'Distribución', 'Presencia', 'Booking & Management'], true)) continue; $insP->execute([$a['id'], mig004_uid($seen, $it['id'] ?? null, 'p', $i), $i + 1, mig004_str($it['name'] ?? '', 255) ?? '', $cat, !empty($it['completed']) ? 1 : 0]); $n['pipeline']++; }
                    $seen = []; foreach ((array)($x['history'] ?? []) as $i => $it) { if (!is_array($it)) continue; $expected['hitos']++; $tipo = $it['type'] ?? ''; if (!in_array($tipo, ['milestone', 'release', 'signing', 'tour', 'achievement'], true)) continue; $insH->execute([$a['id'], mig004_uid($seen, $it['id'] ?? null, 'h', $i), $i + 1, mig004_date($it['date'] ?? null), mig004_str($it['title'] ?? '', 255) ?? '', mig004_str($it['description'] ?? null, 65000), $tipo]); $n['hitos']++; }
                    // integrantes: memberHistory manda; `members` ("Nombre (Rol)") es derivado y solo aporta a quien no esté en el historial
                    $seen = []; $names = []; $i = 0;
                    foreach ((array)($x['memberHistory'] ?? []) as $it) {
                        if (!is_array($it)) continue; $nm = mig004_str($it['name'] ?? '', 255); if ($nm === null) continue;
                        $expected['integrantes']++; $names[mb_strtolower($nm)] = 1;
                        $insM->execute([$a['id'], mig004_uid($seen, $it['id'] ?? null, 'm', $i), ++$i, $nm, mig004_str($it['role'] ?? null, 100) ?? 'Músico', mig004_date($it['startDate'] ?? null), mig004_date($it['endDate'] ?? null), mig004_str($it['venueName'] ?? null, 255), !empty($it['active']) ? 1 : 0]); $n['integrantes']++;
                    }
                    foreach ((array)($x['members'] ?? []) as $m) {
                        if (!is_string($m) || trim($m) === '') continue;
                        $nm = trim(explode('(', $m)[0]); $rol = isset(explode('(', $m)[1]) ? trim(str_replace(')', '', explode('(', $m)[1])) : 'Músico';
                        if ($nm === '' || isset($names[mb_strtolower($nm)])) continue;
                        $expected['integrantes']++; $names[mb_strtolower($nm)] = 1;
                        $insM->execute([$a['id'], mig004_uid($seen, null, 'm', $i), ++$i, mb_substr($nm, 0, 255), mb_substr($rol ?: 'Músico', 0, 100), null, null, null, 1]); $n['integrantes']++;
                    }
                }
            }

            // Venues
            if ($count('venue_horarios') + $count('venue_bandas_locales') === 0) {
                $upV = $pdo->prepare('UPDATE venues SET sitio_web = ?, telefono = ?, num_resenas = ?, place_id = ?, tipo_establecimiento = ?, instagram = ?, facebook = ?, tiktok = ?, whatsapp = ?, correo = ?, youtube = ?, twitter = ?, extra = ? WHERE id = ?');
                $insHo = $pdo->prepare('INSERT INTO venue_horarios (venue_id, orden, descripcion) VALUES (?, ?, ?)');
                $insB = $pdo->prepare('INSERT INTO venue_bandas_locales (venue_id, orden, nombre) VALUES (?, ?, ?)');
                foreach ($pdo->query('SELECT id, extra FROM venues')->fetchAll() as $v) {
                    $x = $v['extra'] ? (json_decode($v['extra'], true) ?: []) : [];
                    $upV->execute([mig004_str($x['website'] ?? null, 500), mig004_str($x['phone'] ?? null, 60), (int)max(0, (float)($x['userRatingsCount'] ?? 0)), mig004_str($x['placeId'] ?? null, 120), mig004_str($x['establishmentType'] ?? null, 120),
                        mig004_str($x['instagram'] ?? null, 255), mig004_str($x['facebook'] ?? null, 255), mig004_str($x['tiktok'] ?? null, 255), mig004_str($x['whatsapp'] ?? null, 255), mig004_str($x['email'] ?? null, 255), mig004_str($x['youtube'] ?? null, 255), mig004_str($x['twitter'] ?? null, 255),
                        mig004_json(array_diff_key($x, array_flip(MIG004_VEN_KEYS))), $v['id']]);
                    $unknown += count(array_diff_key($x, array_flip(MIG004_VEN_KEYS)));
                    $o2 = 0; foreach ((array)($x['hours'] ?? []) as $h) { $expected['horarios']++; $h = mig004_str($h, 255); if ($h !== null) { $insHo->execute([$v['id'], ++$o2, $h]); $n['horarios']++; } }
                    $o2 = 0; foreach ((array)($x['localBands'] ?? []) as $b) { $expected['bandas']++; $b = mig004_str($b, 255); if ($b !== null) { $insB->execute([$v['id'], ++$o2, $b]); $n['bandas']++; } }
                }
            }

            // Eventos
            if ($count('evento_setlist') + $count('evento_bandas_invitadas') === 0) {
                $upE = $pdo->prepare('UPDATE eventos SET feedback_artista = ?, reaccion_publico = ?, valoracion_ritmo = ?, notas_optimizacion = ?, extra = ? WHERE id = ?');
                $insG = $pdo->prepare('INSERT INTO evento_bandas_invitadas (evento_id, orden, nombre) VALUES (?, ?, ?)');
                $insS = $pdo->prepare('INSERT INTO evento_setlist (evento_id, item_id, orden, titulo, duracion_seg, tempo, notas_transicion) VALUES (?, ?, ?, ?, ?, ?, ?)');
                foreach ($pdo->query('SELECT id, extra FROM eventos')->fetchAll() as $e) {
                    $x = $e['extra'] ? (json_decode($e['extra'], true) ?: []) : [];
                    $f = is_array($x['feedback'] ?? null) ? $x['feedback'] : [];
                    $rt = isset($f['pacingRating']) && is_numeric($f['pacingRating']) && $f['pacingRating'] >= 1 && $f['pacingRating'] <= 5 ? (int)round((float)$f['pacingRating']) : null;
                    $upE->execute([mig004_str($f['artistThoughts'] ?? null, 65000), mig004_str($f['crowdReaction'] ?? null, 65000), $rt, mig004_str($f['optimizationNotes'] ?? null, 65000), mig004_json(array_diff_key($x, array_flip(MIG004_EVT_KEYS))), $e['id']]);
                    $unknown += count(array_diff_key($x, array_flip(MIG004_EVT_KEYS)));
                    $o2 = 0; foreach ((array)($x['guestBands'] ?? []) as $b) { $expected['invitadas']++; $b = mig004_str($b, 255); if ($b !== null) { $insG->execute([$e['id'], ++$o2, $b]); $n['invitadas']++; } }
                    $seen = []; foreach ((array)($x['setlist'] ?? []) as $i => $it) {
                        if (!is_array($it)) continue; $expected['setlist']++;
                        $tempo = $it['tempo'] ?? null; if (!in_array($tempo, ['Lento', 'Medio', 'Rápido'], true)) $tempo = null;
                        $insS->execute([$e['id'], mig004_uid($seen, $it['id'] ?? null, 's', $i), $i + 1, mig004_str($it['songTitle'] ?? '', 255) ?? '', mig004_secs($it['duration'] ?? null), $tempo, mig004_str($it['transitionNotes'] ?? null, 65000)]); $n['setlist']++;
                    }
                }
            }

            // Proyectos de grabación
            if ($count('proyecto_canciones') + $count('proyecto_costos') + $count('proyecto_pagos') + $count('proyecto_etapas') === 0) {
                $upR = $pdo->prepare('UPDATE proyectos_grabacion SET extra = ? WHERE id = ?');
                $insSo = $pdo->prepare('INSERT INTO proyecto_canciones (proyecto_id, cancion_id, orden, titulo, duracion_seg, compositor, estado, progreso, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
                $insCo = $pdo->prepare('INSERT INTO proyecto_costos (proyecto_id, costo_id, orden, concepto, categoria, monto, notas) VALUES (?, ?, ?, ?, ?, ?, ?)');
                $insPa = $pdo->prepare('INSERT INTO proyecto_pagos (proyecto_id, pago_id, orden, concepto, monto, fecha_vencimiento, estado, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
                $insEt = $pdo->prepare('INSERT INTO proyecto_etapas (proyecto_id, etapa_id, orden, nombre, estado, fecha_inicio, fecha_fin, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
                $insIn = $pdo->prepare('INSERT INTO proyecto_instrumentos (proyecto_id, etapa_id, instrumento_id, orden, nombre, estado, musico) VALUES (?, ?, ?, ?, ?, ?, ?)');
                $songSt = ['Composición', 'Demo', 'Grabación de Instrumentos', 'Grabación de Voces', 'Mezcla', 'Masterizado', 'Listo'];
                $costCat = ['Estudio/Grabación', 'Músicos de Sesión', 'Mezcla', 'Masterización', 'Arreglos/Producción', 'Otros'];
                $stNames = ['Pre-producción', 'Grabación', 'Revisión', 'Mezcla', 'Masterización', 'Listo'];
                foreach ($pdo->query('SELECT id, extra FROM proyectos_grabacion')->fetchAll() as $r) {
                    $x = $r['extra'] ? (json_decode($r['extra'], true) ?: []) : [];
                    $upR->execute([mig004_json(array_diff_key($x, array_flip(MIG004_REC_KEYS))), $r['id']]);
                    $unknown += count(array_diff_key($x, array_flip(MIG004_REC_KEYS)));
                    $seen = []; foreach ((array)($x['songs'] ?? []) as $i => $it) { if (!is_array($it)) continue; $expected['canciones']++; $st = in_array($it['status'] ?? '', $songSt, true) ? $it['status'] : 'Composición';
                        $insSo->execute([$r['id'], mig004_uid($seen, $it['id'] ?? null, 'so', $i), $i + 1, mig004_str($it['title'] ?? '', 255) ?? '', mig004_secs($it['duration'] ?? null), mig004_str($it['composer'] ?? null, 255), $st, (int)round(mig004_num($it['progress'] ?? 0, 0, 100) ?? 0), mig004_str($it['notes'] ?? null, 65000)]); $n['canciones']++; }
                    $seen = []; foreach ((array)($x['costs'] ?? []) as $i => $it) { if (!is_array($it)) continue; $expected['costos']++; $cat = in_array($it['category'] ?? '', $costCat, true) ? $it['category'] : 'Otros';
                        $insCo->execute([$r['id'], mig004_uid($seen, $it['id'] ?? null, 'c', $i), $i + 1, mig004_str($it['concept'] ?? '', 255) ?? '', $cat, mig004_num($it['amount'] ?? 0, 0) ?? 0, mig004_str($it['notes'] ?? null, 65000)]); $n['costos']++; }
                    $seen = []; foreach ((array)($x['payments'] ?? []) as $i => $it) { if (!is_array($it)) continue; $expected['pagos']++; $st = ($it['status'] ?? '') === 'Pagado' ? 'Pagado' : 'Pendiente';
                        $insPa->execute([$r['id'], mig004_uid($seen, $it['id'] ?? null, 'pa', $i), $i + 1, mig004_str($it['concept'] ?? '', 255) ?? '', mig004_num($it['amount'] ?? 0, 0) ?? 0, mig004_date($it['dueDate'] ?? null), $st, mig004_str($it['notes'] ?? null, 65000)]); $n['pagos']++; }
                    $seen = []; foreach ((array)($x['stages'] ?? []) as $i => $it) {
                        if (!is_array($it) || !in_array($it['name'] ?? '', $stNames, true)) continue; $expected['etapas']++;
                        $eid = mig004_uid($seen, $it['id'] ?? null, 'st', $i); $st = in_array($it['status'] ?? '', ['Pendiente', 'En Progreso', 'Completado'], true) ? $it['status'] : 'Pendiente';
                        $fi = mig004_date($it['startDate'] ?? null); $ff = mig004_date($it['endDate'] ?? null); if ($fi !== null && $ff !== null && $ff < $fi) $ff = null;
                        $insEt->execute([$r['id'], $eid, $i + 1, $it['name'], $st, $fi, $ff, mig004_str($it['notes'] ?? null, 65000)]); $n['etapas']++;
                        $seen2 = []; foreach ((array)($it['instruments'] ?? []) as $j => $ins) { if (!is_array($ins)) continue; $expected['instrumentos']++; $ist = in_array($ins['status'] ?? '', ['Pendiente', 'Grabando', 'Listo'], true) ? $ins['status'] : 'Pendiente';
                            $insIn->execute([$r['id'], $eid, mig004_uid($seen2, $ins['id'] ?? null, 'i', $j), $j + 1, mig004_str($ins['name'] ?? '', 255) ?? '', $ist, mig004_str($ins['musician'] ?? null, 255)]); $n['instrumentos']++; }
                    }
                }
            }

            // Contratos → partes y objeto
            if ($count('contrato_artistas') + $count('contrato_venues') + $count('contrato_eventos') + $count('contrato_tours') === 0) {
                foreach ($pdo->query('SELECT c.id, c.artista_id, c.venue_id, c.evento_id, c.tour_id, e.tour_id etour FROM contratos c LEFT JOIN eventos e ON e.id = c.evento_id')->fetchAll() as $c) {
                    if ($c['artista_id'] !== null) { $pdo->prepare('INSERT INTO contrato_artistas (contrato_id, artista_id) VALUES (?, ?)')->execute([$c['id'], $c['artista_id']]); $n['c_artistas']++; }
                    if ($c['venue_id'] !== null) { $pdo->prepare('INSERT INTO contrato_venues (contrato_id, venue_id) VALUES (?, ?)')->execute([$c['id'], $c['venue_id']]); $n['c_venues']++; }
                    if ($c['evento_id'] !== null) { $pdo->prepare('INSERT INTO contrato_eventos (contrato_id, evento_id) VALUES (?, ?)')->execute([$c['id'], $c['evento_id']]); $n['c_eventos']++; }
                    if ($c['tour_id'] !== null) {
                        if ($c['evento_id'] !== null && $c['etour'] === $c['tour_id']) $n['c_giras_derivadas']++;       // la gira ya se deduce del evento: dato redundante
                        else { $pdo->prepare('INSERT INTO contrato_tours (contrato_id, tour_id) VALUES (?, ?)')->execute([$c['id'], $c['tour_id']]); $n['c_giras']++; }
                    }
                }
            }

            // Verificación: nada se perdió (las filas descartadas por dominio inválido se cuentan aparte)
            $lost = [];
            foreach (['idiomas', 'redes', 'pipeline', 'hitos', 'integrantes', 'horarios', 'bandas', 'invitadas', 'setlist', 'canciones', 'costos', 'pagos', 'etapas', 'instrumentos'] as $k) if ($n[$k] < $expected[$k]) $lost[] = "$k: " . ($expected[$k] - $n[$k]) . ' omitidos';
            $contratosConLigas = (int)$pdo->query('SELECT COUNT(*) FROM contratos WHERE artista_id IS NOT NULL')->fetchColumn();
            if ($contratosConLigas !== $n['c_artistas']) throw new RuntimeException("Verificación fallida: contratos con artista = $contratosConLigas, partes migradas = {$n['c_artistas']}");
            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            throw $e;
        }
        return json_encode(['migrado' => $n, 'omitidos_por_dominio' => $lost, 'claves_json_desconocidas' => $unknown], JSON_UNESCAPED_UNICODE);
    },

    'down' => function (PDO $pdo): void {
        // 1) reconstruir el JSON `extra` y las columnas de contratos desde las tablas nuevas
        $grp = fn(string $sql) => array_reduce($pdo->query($sql)->fetchAll(), function ($c, $r) { $c[$r['k']][] = $r; return $c; }, []);
        $upd = fn(string $t) => $pdo->prepare("UPDATE `$t` SET extra = ? WHERE id = ?");
        $merge = function (?string $extra, array $add): ?string { $x = $extra ? (json_decode($extra, true) ?: []) : []; foreach ($add as $k => $v) $x[$k] = $v; return $x ? json_encode($x, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null; };

        $idi = $grp('SELECT artista_id k, idioma FROM artista_idiomas ORDER BY artista_id, orden');
        $red = $grp('SELECT artista_id k, plataforma, enlace, conectado, usuario_conectado FROM artista_redes');
        $pip = $grp('SELECT artista_id k, item_id, nombre, categoria, completado FROM artista_pipeline ORDER BY artista_id, orden');
        $hit = $grp('SELECT artista_id k, hito_id, fecha, titulo, descripcion, tipo FROM artista_hitos ORDER BY artista_id, orden');
        $int = $grp('SELECT artista_id k, integrante_id, nombre, rol, fecha_inicio, fecha_fin, lugar_inicio, activo FROM artista_integrantes ORDER BY artista_id, orden');
        $u = $upd('artistas');
        foreach ($pdo->query('SELECT * FROM artistas')->fetchAll() as $a) {
            $x = [];
            if ($a['bio'] !== null) $x['bio'] = $a['bio'];
            if ($a['fecha_inicio'] !== null) $x['startDate'] = $a['fecha_inicio'];
            foreach (['label' => 'sello', 'publisher' => 'editorial', 'distributor' => 'distribuidora'] as $k => $c) if ($a[$c] !== null) $x[$k] = $a[$c];
            $ps = []; foreach (['zoom' => 'foto_zoom', 'rotation' => 'foto_rotacion', 'contrast' => 'foto_contraste', 'brightness' => 'foto_brillo', 'grayscale' => 'foto_grises', 'sepia' => 'foto_sepia', 'blur' => 'foto_desenfoque'] as $k => $c) if ($a[$c] !== null) $ps[$k] = (float)$a[$c];
            if ($ps) $x['photoStyle'] = $ps;
            $x['languages'] = array_column($idi[$a['id']] ?? [], 'idioma');
            $sm = []; foreach ($red[$a['id']] ?? [] as $r) { if ($r['enlace'] !== '') $sm[$r['plataforma']] = $r['enlace']; if ($r['conectado']) $sm[$r['plataforma'] . 'Connected'] = true; if ($r['usuario_conectado'] !== null) $sm[$r['plataforma'] . 'ConnectedUser'] = $r['usuario_conectado']; }
            $x['socialMedia'] = $sm ?: new stdClass();
            $x['pipeline'] = array_map(fn($p) => ['id' => $p['item_id'], 'name' => $p['nombre'], 'category' => $p['categoria'], 'completed' => (bool)$p['completado']], $pip[$a['id']] ?? []);
            $x['history'] = array_map(fn($h) => ['id' => $h['hito_id'], 'date' => $h['fecha'] ?? '', 'title' => $h['titulo'], 'description' => $h['descripcion'] ?? '', 'type' => $h['tipo']], $hit[$a['id']] ?? []);
            $mh = []; foreach ($int[$a['id']] ?? [] as $m) $mh[] = array_filter(['id' => $m['integrante_id'], 'name' => $m['nombre'], 'role' => $m['rol'], 'startDate' => $m['fecha_inicio'] ?? '', 'endDate' => $m['fecha_fin'], 'venueName' => $m['lugar_inicio'], 'active' => (bool)$m['activo']], fn($v) => $v !== null);
            $x['memberHistory'] = $mh;
            $x['members'] = array_values(array_map(fn($m) => $m['name'] . ' (' . $m['role'] . ')', array_filter($mh, fn($m) => $m['active'])));
            $u->execute([$merge($a['extra'], $x), $a['id']]);
        }

        $hor = $grp('SELECT venue_id k, descripcion FROM venue_horarios ORDER BY venue_id, orden');
        $ban = $grp('SELECT venue_id k, nombre FROM venue_bandas_locales ORDER BY venue_id, orden');
        $u = $upd('venues');
        foreach ($pdo->query('SELECT * FROM venues')->fetchAll() as $v) {
            $x = ['userRatingsCount' => (int)$v['num_resenas'], 'hours' => array_column($hor[$v['id']] ?? [], 'descripcion'), 'localBands' => array_column($ban[$v['id']] ?? [], 'nombre')];
            foreach (['website' => 'sitio_web', 'phone' => 'telefono', 'placeId' => 'place_id', 'establishmentType' => 'tipo_establecimiento', 'instagram' => 'instagram', 'facebook' => 'facebook', 'tiktok' => 'tiktok', 'whatsapp' => 'whatsapp', 'email' => 'correo', 'youtube' => 'youtube', 'twitter' => 'twitter'] as $k => $c) if ($v[$c] !== null) $x[$k] = $v[$c];
            $u->execute([$merge($v['extra'], $x), $v['id']]);
        }

        $inv = $grp('SELECT evento_id k, nombre FROM evento_bandas_invitadas ORDER BY evento_id, orden');
        $set = $grp('SELECT evento_id k, item_id, titulo, duracion_seg, tempo, notas_transicion FROM evento_setlist ORDER BY evento_id, orden');
        $u = $upd('eventos');
        foreach ($pdo->query('SELECT * FROM eventos')->fetchAll() as $e) {
            $x = ['guestBands' => array_column($inv[$e['id']] ?? [], 'nombre'), 'setlist' => array_map(fn($s) => array_filter(['id' => $s['item_id'], 'songTitle' => $s['titulo'], 'duration' => mig004_dur($s['duracion_seg'] === null ? null : (int)$s['duracion_seg']), 'tempo' => $s['tempo'], 'transitionNotes' => $s['notas_transicion']], fn($v) => $v !== null), $set[$e['id']] ?? [])];
            $fb = array_filter(['artistThoughts' => $e['feedback_artista'], 'crowdReaction' => $e['reaccion_publico'], 'pacingRating' => $e['valoracion_ritmo'] === null ? null : (int)$e['valoracion_ritmo'], 'optimizationNotes' => $e['notas_optimizacion']], fn($v) => $v !== null);
            if ($fb) $x['feedback'] = $fb;
            $u->execute([$merge($e['extra'], $x), $e['id']]);
        }

        $son = $grp('SELECT proyecto_id k, cancion_id, titulo, duracion_seg, compositor, estado, progreso, notas FROM proyecto_canciones ORDER BY proyecto_id, orden');
        $cos = $grp('SELECT proyecto_id k, costo_id, concepto, categoria, monto, notas FROM proyecto_costos ORDER BY proyecto_id, orden');
        $pag = $grp('SELECT proyecto_id k, pago_id, concepto, monto, fecha_vencimiento, estado, notas FROM proyecto_pagos ORDER BY proyecto_id, orden');
        $eta = $grp('SELECT proyecto_id k, etapa_id, nombre, estado, fecha_inicio, fecha_fin, notas FROM proyecto_etapas ORDER BY proyecto_id, orden');
        $ins = []; foreach ($pdo->query('SELECT * FROM proyecto_instrumentos ORDER BY proyecto_id, etapa_id, orden')->fetchAll() as $i) $ins[$i['proyecto_id'] . '|' . $i['etapa_id']][] = $i;
        $nn = fn(array $a) => array_filter($a, fn($v) => $v !== null);
        $u = $upd('proyectos_grabacion');
        foreach ($pdo->query('SELECT id, extra FROM proyectos_grabacion')->fetchAll() as $r) {
            $x = [
                'songs' => array_map(fn($s) => $nn(['id' => $s['cancion_id'], 'title' => $s['titulo'], 'duration' => mig004_dur($s['duracion_seg'] === null ? null : (int)$s['duracion_seg']), 'composer' => $s['compositor'], 'status' => $s['estado'], 'progress' => (int)$s['progreso'], 'notes' => $s['notas']]), $son[$r['id']] ?? []),
                'costs' => array_map(fn($c) => $nn(['id' => $c['costo_id'], 'concept' => $c['concepto'], 'category' => $c['categoria'], 'amount' => (float)$c['monto'], 'notes' => $c['notas']]), $cos[$r['id']] ?? []),
                'payments' => array_map(fn($p) => $nn(['id' => $p['pago_id'], 'concept' => $p['concepto'], 'amount' => (float)$p['monto'], 'dueDate' => $p['fecha_vencimiento'] ?? '', 'status' => $p['estado'], 'notes' => $p['notas']]), $pag[$r['id']] ?? []),
                'stages' => array_map(fn($s) => $nn(['id' => $s['etapa_id'], 'name' => $s['nombre'], 'status' => $s['estado'], 'startDate' => $s['fecha_inicio'], 'endDate' => $s['fecha_fin'], 'notes' => $s['notas'],
                    'instruments' => array_map(fn($i) => $nn(['id' => $i['instrumento_id'], 'name' => $i['nombre'], 'status' => $i['estado'], 'musician' => $i['musico']]), $ins[$r['id'] . '|' . $s['etapa_id']] ?? [])]), $eta[$r['id']] ?? []),
            ];
            $u->execute([$merge($r['extra'], $x), $r['id']]);
        }

        foreach (['artista_id' => ['contrato_artistas', 'artista_id'], 'venue_id' => ['contrato_venues', 'venue_id'], 'evento_id' => ['contrato_eventos', 'evento_id'], 'tour_id' => ['contrato_tours', 'tour_id']] as $col => [$t, $c]) {
            $pdo->exec("UPDATE contratos k SET k.$col = (SELECT MIN(l.$c) FROM `$t` l WHERE l.contrato_id = k.id)");
        }
        $pdo->exec('UPDATE contratos k JOIN eventos e ON e.id = k.evento_id SET k.tour_id = e.tour_id WHERE k.tour_id IS NULL AND e.tour_id IS NOT NULL');   // gira que se deducía del evento

        // 2) quitar lo añadido
        foreach (['contrato_tours', 'contrato_eventos', 'contrato_proveedores', 'contrato_venues', 'contrato_artistas', 'proyecto_instrumentos', 'proyecto_etapas', 'proyecto_pagos', 'proyecto_costos', 'proyecto_canciones', 'evento_setlist', 'evento_bandas_invitadas', 'venue_bandas_locales', 'venue_horarios', 'artista_integrantes', 'artista_hitos', 'artista_pipeline', 'artista_redes', 'artista_idiomas'] as $t) $pdo->exec("DROP TABLE IF EXISTS `$t`");
        foreach (['chk_eventos_ritmo' => 'eventos', 'chk_artistas_foto' => 'artistas'] as $c => $t) if (db_constraint_exists($pdo, $t, $c)) { db_exec_ignore($pdo, "ALTER TABLE `$t` DROP CONSTRAINT `$c`"); db_exec_ignore($pdo, "ALTER TABLE `$t` DROP CHECK `$c`"); }
        foreach ([['artistas', ['bio', 'fecha_inicio', 'sello', 'editorial', 'distribuidora', 'foto_zoom', 'foto_rotacion', 'foto_contraste', 'foto_brillo', 'foto_grises', 'foto_sepia', 'foto_desenfoque']],
                  ['venues', ['sitio_web', 'telefono', 'num_resenas', 'place_id', 'tipo_establecimiento', 'instagram', 'facebook', 'tiktok', 'whatsapp', 'correo', 'youtube', 'twitter']],
                  ['eventos', ['feedback_artista', 'reaccion_publico', 'valoracion_ritmo', 'notas_optimizacion']]] as [$t, $cols]) {
            foreach ($cols as $c) if (db_col_exists($pdo, $t, $c)) $pdo->exec("ALTER TABLE `$t` DROP COLUMN `$c`");
        }
        if (db_constraint_exists($pdo, 'proyectos_grabacion', 'fk_proyectos_artista')) {
            $pdo->exec('ALTER TABLE proyectos_grabacion DROP FOREIGN KEY fk_proyectos_artista');
            $pdo->exec('ALTER TABLE proyectos_grabacion ADD FOREIGN KEY (artista_id) REFERENCES artistas(id) ON DELETE SET NULL');
        }
    },
];
