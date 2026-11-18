<?php
declare(strict_types=1);

// Capa de datos: traduce los objetos de la interfaz ⇄ filas relacionales.
// Los campos «núcleo» (los que se filtran, ordenan o relacionan) son columnas reales con llaves foráneas;
// el resto de campos anidados se guarda en la columna JSON `extra`.

const UPSERT_ORDER = ['artists', 'venues', 'contacts', 'providers', 'tours', 'events', 'contracts', 'recording_projects'];
const DELETE_ORDER = ['contracts', 'events', 'recording_projects', 'tours', 'contacts', 'providers', 'venues', 'artists'];

function ts_cols(): array {
    return ['created_at' => ['created_at', 'ts'], 'updated_at' => ['updated_at', 'ts'], 'deleted_at' => ['deleted_at', 'tn']];
}

function entity_defs(): array {
    static $defs = null;
    if ($defs !== null) return $defs;
    $defs = [
        'artists' => ['table' => 'artistas', 'extra' => true, 'cols' => [
            'id' => ['id', 'id'], 'artisticName' => ['nombre_artistico', 's'], 'legalName' => ['nombre_legal', 's'],
            'genre' => ['genero', 's'], 'stage' => ['etapa_id', 'stage'], 'manager' => ['manager', 's'],
            'bookingAgent' => ['booking_agent', 's'], 'isrc' => ['isrc_default', 'sn'], 'iswc' => ['iswc_default', 'sn'],
            'pro' => ['sociedad_gestion', 'sn'], 'rfc' => ['rfc', 'sn'], 'city' => ['ciudad', 's'],
            'state' => ['estado', 's'], 'country' => ['pais', 's'], 'photo' => ['foto', 's'],
        ] + ts_cols()],
        'venues' => ['table' => 'venues', 'extra' => true, 'pivot' => 'providerIds', 'cols' => [
            'id' => ['id', 'id'], 'name' => ['nombre', 's'], 'address' => ['direccion', 's'], 'city' => ['ciudad', 's'],
            'state' => ['estado', 's'], 'country' => ['pais', 's'], 'postalCode' => ['codigo_postal', 's'],
            'lat' => ['latitud', 'f'], 'lng' => ['longitud', 'f'], 'rating' => ['rating', 'f'],
            'scoreRentabilidad' => ['score_rentabilidad', 'i'], 'scoreResponseTime' => ['score_respuesta', 'i'],
            'scorePuntualidadPago' => ['score_puntualidad_pago', 'i'], 'scoreNegociacion' => ['score_negociacion', 'i'],
            'scoreProduccion' => ['score_produccion', 'i'], 'scoreHospitalidad' => ['score_hospitalidad', 'i'],
            'contactoPrincipalId' => ['contacto_principal_id', 'fk'],
        ] + ts_cols()],
        'contacts' => ['table' => 'contactos', 'extra' => false, 'cols' => [
            'id' => ['id', 'id'], 'venueId' => ['venue_id', 'fkreq'], 'name' => ['nombre', 's'],
            'email' => ['correo', 's'], 'phone' => ['telefono', 's'], 'role' => ['rol', 's'],
        ]],
        'providers' => ['table' => 'proveedores', 'extra' => false, 'pivot' => 'venueIds', 'cols' => [
            'id' => ['id', 'id'], 'name' => ['nombre', 's'], 'category' => ['categoria', 's'], 'contactName' => ['contacto', 's'],
            'phone' => ['telefono', 's'], 'email' => ['correo', 's'], 'rating' => ['rating', 'f'],
            'costPerShow' => ['costo_por_show', 'f'], 'notes' => ['notas', 'sn'], 'created_at' => ['created_at', 'ts'],
        ]],
        'tours' => ['table' => 'tours', 'extra' => false, 'cols' => [
            'id' => ['id', 'id'], 'name' => ['nombre', 's'], 'artistId' => ['artista_id', 'fkreq'],
            'startDate' => ['fecha_inicio', 'd'], 'endDate' => ['fecha_fin', 'd'], 'status' => ['status', 's'],
        ] + ts_cols()],
        'events' => ['table' => 'eventos', 'extra' => true, 'cols' => [
            'id' => ['id', 'id'], 'name' => ['nombre', 's'], 'artistId' => ['artista_id', 'fkreq'], 'venueId' => ['venue_id', 'fkreq'],
            'tourId' => ['tour_id', 'fk'], 'date' => ['fecha', 'd'], 'status' => ['estado', 's'],
            'capacity' => ['capacidad', 'i'], 'attendance' => ['asistencia', 'i'], 'ticketPrice' => ['precio_boleto', 'f'],
            'totalIncome' => ['ingreso_total', 'f'], 'expenses' => ['gastos_totales', 'f'], 'profit' => ['utilidad', 'f'],
        ] + ts_cols()],
        'contracts' => ['table' => 'contratos', 'extra' => false, 'cols' => [
            'id' => ['id', 'id'], 'title' => ['titulo', 's'], 'artistId' => ['artista_id', 'fk'], 'venueId' => ['venue_id', 'fk'],
            'tourId' => ['tour_id', 'fk'], 'eventId' => ['evento_id', 'fk'], 'type' => ['tipo', 's'], 'status' => ['estado', 's'],
            'fileName' => ['nombre_archivo', 's'], 'fileSize' => ['tamano', 's'], 'uploadedAt' => ['fecha_subida', 's'],
            'notes' => ['notas', 'sn'],
        ]],
        'recording_projects' => ['table' => 'proyectos_grabacion', 'extra' => true, 'cols' => [
            'id' => ['id', 'id'], 'title' => ['titulo', 's'], 'artistId' => ['artista_id', 'fk'], 'status' => ['estado', 's'],
            'releaseDate' => ['fecha_lanzamiento', 'dn'], 'studio' => ['estudio', 'sn'], 'producer' => ['productor', 'sn'],
            'created_at' => ['created_at', 'ts'],
        ]],
    ];
    return $defs;
}

class SyncError extends RuntimeException {
    public int $httpCode;
    public function __construct(string $message, int $httpCode = 422) { parent::__construct($message); $this->httpCode = $httpCode; }
}

function to_date(mixed $v): ?string {
    if (!is_string($v) || !preg_match('/^(\d{4}-\d{2}-\d{2})/', $v, $m)) return null;
    return checkdate((int)substr($m[1], 5, 2), (int)substr($m[1], 8, 2), (int)substr($m[1], 0, 4)) ? $m[1] : null;
}

function to_row(string $key, array $def, array $obj): array {
    $row = [];
    $now = gmdate('Y-m-d\TH:i:s\Z');
    foreach ($def['cols'] as $field => [$col, $type]) {
        $v = $obj[$field] ?? null;
        switch ($type) {
            case 'id':
                if (!is_string($v) || $v === '' || strlen($v) > 40) throw new SyncError("Registro sin identificador válido en «{$key}».");
                $row[$col] = $v; break;
            case 's':   $row[$col] = $v === null ? '' : (string)(is_scalar($v) ? $v : json_encode($v)); break;
            case 'sn':  $row[$col] = ($v === null || $v === '') ? null : (string)$v; break;
            case 'i':   $row[$col] = (int)round((float)($v ?? 0)); break;
            case 'f':   $row[$col] = (float)($v ?? 0); break;
            case 'd':   $row[$col] = to_date($v); break;
            case 'dn':  $row[$col] = to_date($v); break;
            case 'fk':  $row[$col] = ($v === null || $v === '') ? null : (string)$v; break;
            case 'fkreq':
                if (!is_string($v) || $v === '') throw new SyncError("El registro «" . ($obj['name'] ?? $obj['id'] ?? $key) . "» ($key) necesita estar relacionado con un " . ($field === 'venueId' ? 'venue' : 'artista') . '.');
                $row[$col] = $v; break;
            case 'ts':  $row[$col] = is_string($v) && $v !== '' ? substr($v, 0, 32) : $now; break;
            case 'tn':  $row[$col] = (is_string($v) && $v !== '') ? substr($v, 0, 32) : null; break;
            case 'stage': $i = array_search($v, ETAPAS, true); $row[$col] = $i === false ? 1 : $i + 1; break;
        }
    }
    if (!empty($def['extra'])) {
        $extra = array_diff_key($obj, $def['cols']);
        if (isset($def['pivot'])) unset($extra[$def['pivot']]);
        if ($key === 'venues' && !empty($obj['contactoPrincipalId'])) $extra['contactoPrincipalId'] = $obj['contactoPrincipalId'];
        $row['extra'] = $extra ? json_encode($extra, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null;
    }
    return $row;
}

function from_row(array $def, array $row): array {
    $obj = [];
    if (!empty($def['extra']) && !empty($row['extra'])) {
        $ex = json_decode((string)$row['extra'], true);
        if (is_array($ex)) $obj = $ex;
    }
    foreach ($def['cols'] as $field => [$col, $type]) {
        $v = $row[$col] ?? null;
        switch ($type) {
            case 'id': case 's': case 'ts': $obj[$field] = (string)($v ?? ''); break;
            case 'd':  $obj[$field] = $v === null ? '' : substr((string)$v, 0, 10); break;
            case 'dn': if ($v !== null) $obj[$field] = substr((string)$v, 0, 10); break;
            case 'sn': case 'fk': if ($v !== null && $v !== '') $obj[$field] = (string)$v; elseif (!isset($obj[$field])) { /* omitido */ } break;
            case 'fkreq': $obj[$field] = (string)($v ?? ''); break;
            case 'i':  $obj[$field] = (int)$v; break;
            case 'f':  $obj[$field] = (float)$v; break;
            case 'tn': $obj[$field] = ($v === null || $v === '') ? null : (string)$v; break;
            case 'stage': $obj[$field] = ETAPAS[max(0, (int)$v - 1)] ?? ETAPAS[0]; break;
        }
    }
    return $obj;
}

function upsert_sql(PDO $pdo, string $table, array $cols): string {
    $names = implode(', ', $cols);
    $ph = implode(', ', array_fill(0, count($cols), '?'));
    $upd = array_filter($cols, fn($c) => $c !== 'id');
    if (schema_driver($pdo) === 'mysql') {
        $set = implode(', ', array_map(fn($c) => "$c = VALUES($c)", $upd));
        return "INSERT INTO $table ($names) VALUES ($ph) ON DUPLICATE KEY UPDATE $set";
    }
    $set = implode(', ', array_map(fn($c) => "$c = excluded.$c", $upd));
    return "INSERT INTO $table ($names) VALUES ($ph) ON CONFLICT(id) DO UPDATE SET $set";
}

function load_all(PDO $pdo): array {
    $defs = entity_defs();
    $out = [];
    foreach ($defs as $key => $def) {
        $objs = [];
        foreach ($pdo->query("SELECT * FROM {$def['table']} ORDER BY id")->fetchAll() as $r) $objs[] = from_row($def, $r);
        $out[$key] = $objs;
    }
    // Relación N:M venues ⇄ proveedores
    $byVenue = []; $byProv = [];
    foreach ($pdo->query('SELECT venue_id, proveedor_id FROM venue_proveedores')->fetchAll() as $r) {
        $byVenue[$r['venue_id']][] = $r['proveedor_id'];
        $byProv[$r['proveedor_id']][] = $r['venue_id'];
    }
    foreach ($out['venues'] as &$v) $v['providerIds'] = $byVenue[$v['id']] ?? [];
    foreach ($out['providers'] as &$p) $p['venueIds'] = $byProv[$p['id']] ?? [];
    unset($v, $p);
    return $out;
}

function id_exists(PDO $pdo, string $table, string $id): bool {
    $st = $pdo->prepare("SELECT 1 FROM $table WHERE id = ?");
    $st->execute([$id]);
    return (bool)$st->fetchColumn();
}

function replace_pivot(PDO $pdo, string $key, string $id, array $others): void {
    [$mine, $theirs, $theirTable] = $key === 'venues'
        ? ['venue_id', 'proveedor_id', 'proveedores'] : ['proveedor_id', 'venue_id', 'venues'];
    $pdo->prepare("DELETE FROM venue_proveedores WHERE $mine = ?")->execute([$id]);
    $ins = $pdo->prepare("INSERT INTO venue_proveedores ($mine, $theirs) VALUES (?, ?)");
    foreach (array_unique(array_filter($others, 'is_string')) as $oid) {
        if (id_exists($pdo, $theirTable, $oid)) $ins->execute([$id, $oid]);
    }
}

/** venue.contactoPrincipalId apunta a un contacto que se guarda después: se completa al final. */
function fix_principal_contacts(PDO $pdo, array $venueIds): void {
    $sel = $pdo->prepare('SELECT extra FROM venues WHERE id = ?');
    $upd = $pdo->prepare('UPDATE venues SET contacto_principal_id = ? WHERE id = ?');
    foreach (array_unique($venueIds) as $vid) {
        $sel->execute([$vid]);
        $extra = json_decode((string)$sel->fetchColumn(), true);
        $cid = is_array($extra) ? ($extra['contactoPrincipalId'] ?? null) : null;
        if (is_string($cid) && $cid !== '' && id_exists($pdo, 'contactos', $cid)) $upd->execute([$cid, $vid]);
    }
}

/**
 * Aplica cambios por registro: ['collection' => ['upserts' => [...], 'deletes' => [ids]]].
 * Todo ocurre en una transacción; si algo falla, no se guarda nada.
 */
function apply_changes(PDO $pdo, array $changes, bool $lenient = false): array {
    $defs = entity_defs();
    $stats = ['upserted' => 0, 'deleted' => 0, 'skipped' => 0];
    $pdo->beginTransaction();
    try {
        $touchedVenues = [];
        foreach (UPSERT_ORDER as $key) {
            $ups = $changes[$key]['upserts'] ?? [];
            if (!is_array($ups) || !$ups) continue;
            $def = $defs[$key];
            foreach ($ups as $obj) {
                if (!is_array($obj)) continue;
                try { $row = to_row($key, $def, $obj); }
                catch (SyncError $e) { if ($lenient) { $stats['skipped']++; continue; } throw $e; }

                if ($key === 'venues') {
                    $cid = $row['contacto_principal_id'];
                    if ($cid !== null && !id_exists($pdo, 'contactos', $cid)) $row['contacto_principal_id'] = null;
                    $touchedVenues[] = $row['id'];
                }
                if ($key === 'contacts') $touchedVenues[] = $row['venue_id'];

                $cols = array_keys($row);
                $pdo->prepare(upsert_sql($pdo, $def['table'], $cols))->execute(array_values($row));
                $stats['upserted']++;

                if (isset($def['pivot']) && array_key_exists($def['pivot'], $obj) && is_array($obj[$def['pivot']])) {
                    replace_pivot($pdo, $key, $row['id'], $obj[$def['pivot']]);
                }
            }
            if ($key === 'contacts' && $touchedVenues) fix_principal_contacts($pdo, $touchedVenues);
        }
        foreach (DELETE_ORDER as $key) {
            $del = $changes[$key]['deletes'] ?? [];
            if (!is_array($del) || !$del) continue;
            $st = $pdo->prepare("DELETE FROM {$defs[$key]['table']} WHERE id = ?");
            foreach ($del as $id) {
                if (is_string($id) && $id !== '') { $st->execute([$id]); $stats['deleted']++; }
            }
        }
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }
    return $stats;
}

/** Importa los datos del formato anterior (tabla `collections` con JSON) una sola vez. */
function migrate_legacy_collections(PDO $pdo): void {
    try { $rows = $pdo->query('SELECT name, data FROM collections')->fetchAll(); }
    catch (Throwable $e) { return; }                       // no existía el formato anterior
    if (!$rows) return;
    if ((int)$pdo->query('SELECT COUNT(*) FROM artistas')->fetchColumn() > 0) return;

    $changes = [];
    foreach ($rows as $r) {
        $arr = json_decode((string)$r['data'], true);
        if (is_array($arr) && $arr && isset(entity_defs()[$r['name']])) $changes[$r['name']] = ['upserts' => $arr];
    }
    if (!$changes) return;

    $driver = schema_driver($pdo);
    if ($driver === 'mysql') $pdo->exec('SET FOREIGN_KEY_CHECKS = 0'); else $pdo->exec('PRAGMA foreign_keys = OFF');
    try { apply_changes($pdo, $changes, true); }
    finally { if ($driver === 'mysql') $pdo->exec('SET FOREIGN_KEY_CHECKS = 1'); else $pdo->exec('PRAGMA foreign_keys = ON'); }
}
