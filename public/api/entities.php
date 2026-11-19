<?php
declare(strict_types=1);

// Capa de datos: traduce los objetos de la interfaz ⇄ filas relacionales (esquema v2).
//  · Campos núcleo → columnas reales (con tipos, CHECK y llaves foráneas).
//  · Géneros, contactos, artistas de un evento y artistas de una gira → tablas propias.
//  · Campos anidados que aún no se consultan por separado → columna JSON `extra` (ver DATABASE_AUDIT).
// El formato de los objetos que ve la interfaz no cambia (solo se añaden campos opcionales).

const UPSERT_ORDER = ['artists', 'venues', 'providers', 'contacts', 'tours', 'events', 'contracts', 'recording_projects'];
const DELETE_ORDER = ['contracts', 'events', 'recording_projects', 'tours', 'contacts', 'providers', 'venues', 'artists'];

class SyncError extends RuntimeException {
    public int $httpCode; public string $errCode;
    public function __construct(string $message, int $httpCode = 422, string $errCode = 'validation') { parent::__construct($message); $this->httpCode = $httpCode; $this->errCode = $errCode; }
}
class ConflictError extends SyncError {
    public function __construct(string $message) { parent::__construct($message, 409, 'conflict'); }
}

const ENTITY_LABELS = ['artists' => 'Artista', 'venues' => 'Venue', 'events' => 'Evento', 'tours' => 'Gira', 'contracts' => 'Contrato', 'providers' => 'Proveedor', 'recording_projects' => 'Proyecto', 'contacts' => 'Contacto'];
const FIELD_LABELS = [
    'status' => 'estatus', 'type' => 'tipo', 'category' => 'categoría', 'rating' => 'calificación', 'stage' => 'etapa',
    'scoreRentabilidad' => 'puntaje de rentabilidad', 'scoreResponseTime' => 'puntaje de respuesta', 'scorePuntualidadPago' => 'puntaje de puntualidad de pago',
    'scoreNegociacion' => 'puntaje de negociación', 'scoreProduccion' => 'puntaje de producción', 'scoreHospitalidad' => 'puntaje de hospitalidad',
    'lat' => 'latitud', 'lng' => 'longitud', 'capacity' => 'capacidad', 'attendance' => 'asistencia', 'ticketPrice' => 'precio del boleto',
    'totalIncome' => 'ingreso total', 'expenses' => 'gastos', 'costPerShow' => 'costo por show', 'endDate' => 'fecha de fin', 'startDate' => 'fecha de inicio',
];

function fail(string $key, array $obj, string $msg): never {
    $name = (string)($obj['name'] ?? $obj['artisticName'] ?? $obj['title'] ?? $obj['id'] ?? '');
    throw new SyncError(ENTITY_LABELS[$key] . ($name !== '' ? " «{$name}»" : '') . ': ' . $msg);
}

// ───────── utilidades ─────────
function norm_space(string $s): string { return trim((string)preg_replace('/\s+/u', ' ', $s)); }
function new_contact_id(): string { return 'con-' . bin2hex(random_bytes(6)); }
function iso_to_dt(mixed $v): ?string {
    if (!is_string($v) || trim($v) === '') return null;
    try { return (new DateTimeImmutable($v))->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s.v'); } catch (Throwable $e) { return null; }
}
function dt_to_iso(?string $v): ?string {
    if ($v === null || $v === '') return null;
    return (new DateTimeImmutable($v, new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.v\Z');
}
function to_date(mixed $v): ?string {
    if (!is_string($v) || !preg_match('/^(\d{4}-\d{2}-\d{2})/', $v, $m)) return null;
    return checkdate((int)substr($m[1], 5, 2), (int)substr($m[1], 8, 2), (int)substr($m[1], 0, 4)) ? $m[1] : null;
}
function to_time(mixed $v): ?string {
    if (!is_string($v) || !preg_match('/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/', trim($v), $m)) return null;
    return $m[1] . ':' . $m[2] . ':' . ($m[3] ?? '00');
}
function size_to_bytes(mixed $s): ?int {
    if (!is_string($s) || !preg_match('/^\s*([\d.,]+)\s*(B|KB|MB|GB)?\s*$/i', $s, $m)) return null;
    $mult = ['B' => 1, 'KB' => 1024, 'MB' => 1048576, 'GB' => 1073741824][strtoupper($m[2] ?: 'B')];
    return (int)round((float)str_replace(',', '.', $m[1]) * $mult);
}
function bytes_to_size(?int $b): string {
    if ($b === null) return '';
    if ($b >= 1073741824) return round($b / 1073741824, 1) . ' GB';
    if ($b >= 1048576) return round($b / 1048576, 1) . ' MB';
    if ($b >= 1024) return round($b / 1024, 1) . ' KB';
    return $b . ' B';
}
function q_one(PDO $pdo, string $sql, array $args = []): mixed { $st = $pdo->prepare($sql); $st->execute($args); $v = $st->fetchColumn(); return $v === false ? null : $v; }
function q_all(PDO $pdo, string $sql, array $args = []): array { $st = $pdo->prepare($sql); $st->execute($args); return $st->fetchAll(); }
function q_run(PDO $pdo, string $sql, array $args = []): int { $st = $pdo->prepare($sql); $st->execute($args); return $st->rowCount(); }

/** Catálogo abierto (géneros, roles): busca sin distinguir mayúsculas/acentos y crea si no existe. */
final class CatalogCache { public static array $ids = []; }
function catalog_cache_clear(): void { CatalogCache::$ids = []; }
function catalog_id(PDO $pdo, string $table, string $name, int $max): int {
    $name = mb_substr(norm_space($name), 0, $max);
    $k = $table . '|' . mb_strtolower($name);
    if (isset(CatalogCache::$ids[$k])) return CatalogCache::$ids[$k];
    $id = q_one($pdo, "SELECT id FROM `$table` WHERE nombre = ?", [$name]);
    if ($id === null) { q_run($pdo, "INSERT INTO `$table` (nombre) VALUES (?)", [$name]); $id = $pdo->lastInsertId(); }
    return CatalogCache::$ids[$k] = (int)$id;
}
function role_id(PDO $pdo, string $name): int { return catalog_id($pdo, 'cat_roles_contacto', $name === '' ? 'Contacto' : $name, 60); }

// ───────── definición de entidades ─────────
// cols: campo => [columna, tipo, opciones]   tipos: id s sn i f d dn dt dtn fk fkreq enum stage
function ts3(): array { return ['created_at' => ['created_at', 'dt'], 'updated_at' => ['updated_at', 'dt'], 'deleted_at' => ['deleted_at', 'dtn']]; }

function entity_defs(): array {
    static $defs = null;
    if ($defs !== null) return $defs;
    $score = [0, 100];
    $defs = [
        'artists' => ['table' => 'artistas', 'extra' => false, 'virtual' => ['genre', 'subgenres', 'manager', 'bookingAgent', 'languages', 'socialMedia', 'pipeline', 'history', 'members', 'memberHistory', 'photoStyle'], 'cols' => [
            'id' => ['id', 'id'], 'artisticName' => ['nombre_artistico', 's'], 'legalName' => ['nombre_legal', 's'],
            'stage' => ['etapa_id', 'stage'], 'isrc' => ['isrc_default', 'sn'], 'iswc' => ['iswc_default', 'sn'],
            'pro' => ['sociedad_gestion', 'sn'], 'rfc' => ['rfc', 'sn'], 'city' => ['ciudad', 's'],
            'state' => ['estado', 's'], 'country' => ['pais', 's'], 'photo' => ['foto', 's'],
            'bio' => ['bio', 's'], 'startDate' => ['fecha_inicio', 'd'], 'label' => ['sello', 's'], 'publisher' => ['editorial', 's'], 'distributor' => ['distribuidora', 's'],
        ] + ts3()],
        'venues' => ['table' => 'venues', 'extra' => false, 'virtual' => ['providerIds', 'contactoPrincipalId', 'hours', 'localBands', 'notes'], 'cols' => [
            'id' => ['id', 'id'], 'name' => ['nombre', 's'], 'address' => ['direccion', 's'], 'city' => ['ciudad', 's'],
            'state' => ['estado', 's'], 'country' => ['pais', 's'], 'postalCode' => ['codigo_postal', 's'],
            'lat' => ['latitud', 'f', [-90, 90]], 'lng' => ['longitud', 'f', [-180, 180]], 'rating' => ['rating', 'f', [0, 5]],
            'scoreRentabilidad' => ['score_rentabilidad', 'in', $score], 'scoreResponseTime' => ['score_respuesta', 'in', $score],
            'scorePuntualidadPago' => ['score_puntualidad_pago', 'in', $score], 'scoreNegociacion' => ['score_negociacion', 'in', $score],
            'scoreProduccion' => ['score_produccion', 'in', $score], 'scoreHospitalidad' => ['score_hospitalidad', 'in', $score],
            'website' => ['sitio_web', 's'], 'phone' => ['telefono', 's'], 'userRatingsCount' => ['num_resenas', 'i', [0, null]], 'placeId' => ['place_id', 's'],
            'establishmentType' => ['tipo_establecimiento', 's'], 'instagram' => ['instagram', 'sn'], 'facebook' => ['facebook', 'sn'], 'tiktok' => ['tiktok', 'sn'],
            'whatsapp' => ['whatsapp', 'sn'], 'email' => ['correo', 'sn'], 'youtube' => ['youtube', 'sn'], 'twitter' => ['twitter', 'sn'],
        ] + ts3()],
        'providers' => ['table' => 'proveedores', 'extra' => false, 'virtual' => ['venueIds', 'contactName', 'phone', 'email'], 'cols' => [
            'id' => ['id', 'id'], 'name' => ['nombre', 's'],
            'category' => ['categoria', 'enum', ['Sonido', 'Ingeniero de Audio', 'Iluminación', 'Catering', 'Backline', 'Escenografía', 'Seguridad', 'Personal de Apoyo', 'Otros']],
            'rating' => ['rating', 'f', [0, 5]], 'costPerShow' => ['costo_por_show', 'f', [0, null]], 'notes' => ['notas', 'sn'],
            'created_at' => ['created_at', 'dt'],
        ]],
        'tours' => ['table' => 'tours', 'extra' => false, 'virtual' => ['artistId', 'artistIds'], 'cols' => [
            'id' => ['id', 'id'], 'name' => ['nombre', 's'], 'startDate' => ['fecha_inicio', 'd'], 'endDate' => ['fecha_fin', 'd'],
            'status' => ['status', 'enum', ['Planning', 'Active', 'Completed', 'Cancelled']],
        ] + ts3()],
        'events' => ['table' => 'eventos', 'extra' => false, 'virtual' => ['artistId', 'artists', 'profit', 'feedback', 'guestBands', 'setlist'], 'cols' => [
            'id' => ['id', 'id'], 'name' => ['nombre', 's'], 'venueId' => ['venue_id', 'fkreq'], 'tourId' => ['tour_id', 'fk'],
            'date' => ['fecha', 'd'], 'status' => ['estado', 'enum', ['Draft', 'Confirmed', 'Completed', 'Cancelled']],
            'capacity' => ['capacidad', 'i', [0, null]], 'attendance' => ['asistencia', 'i', [0, null]], 'ticketPrice' => ['precio_boleto', 'f', [0, null]],
            'totalIncome' => ['ingreso_total', 'f', [0, null]], 'expenses' => ['gastos_totales', 'f', [0, null]],
        ] + ts3()],
        'contracts' => ['table' => 'contratos', 'extra' => false, 'virtual' => ['artistId', 'venueId', 'tourId', 'eventId', 'artistIds', 'venueIds', 'providerIds', 'eventIds', 'tourIds'], 'cols' => [
            'id' => ['id', 'id'], 'title' => ['titulo', 's'],
            'type' => ['tipo', 'enum', ['Management', 'Booking', 'Performance', 'Co-production', 'NDA', 'Foro/Arrendamiento', 'Other']],
            'status' => ['estado', 'enum', ['Draft', 'Pending', 'Signed', 'Rejected', 'Active']],
            'fileName' => ['nombre_archivo', 's'], 'fileSize' => ['tamano_bytes', 'size'], 'uploadedAt' => ['fecha_subida', 'dtn'], 'notes' => ['notas', 'sn'],
        ]],
        'recording_projects' => ['table' => 'proyectos_grabacion', 'extra' => false, 'virtual' => ['songs', 'costs', 'payments', 'stages'], 'cols' => [
            'id' => ['id', 'id'], 'title' => ['titulo', 's'], 'artistId' => ['artista_id', 'fk'],
            'status' => ['estado', 'enum', ['Planificación', 'Pre-producción', 'Grabando', 'Mezcla', 'Masterización', 'Completado']],
            'releaseDate' => ['fecha_lanzamiento', 'dn'], 'studio' => ['estudio', 'sn'], 'producer' => ['productor', 'sn'], 'created_at' => ['created_at', 'dt'],
        ]],
    ];
    return $defs;
}

function to_row(string $key, array $def, array $obj): array {
    $row = [];
    foreach ($def['cols'] as $field => $spec) {
        [$col, $type] = $spec; $opt = $spec[2] ?? null;
        $v = $obj[$field] ?? null;
        $label = FIELD_LABELS[$field] ?? $field;
        switch ($type) {
            case 'id':
                if (!is_string($v) || $v === '' || strlen($v) > 40) throw new SyncError("Registro sin identificador válido en «{$key}».");
                $row[$col] = $v; break;
            case 's':  $row[$col] = $v === null ? '' : (string)(is_scalar($v) ? $v : json_encode($v)); break;
            case 'sn': $row[$col] = ($v === null || $v === '') ? null : (string)$v; break;
            case 'i': case 'f': case 'in':
                if ($type === 'in') {   // entero que admite NULL (p. ej. «No aplica»); si el campo ni viene, vale 0
                    if (!array_key_exists($field, $obj)) $v = 0;
                    elseif ($v === null || $v === '') { $row[$col] = null; break; }
                }
                $num = $v === null || $v === '' ? 0 : $v;
                if (!is_numeric($num)) fail($key, $obj, "«{$label}» debe ser un número.");
                $num = $type !== 'f' ? (int)round((float)$num) : (float)$num;
                if ($opt !== null) {
                    [$min, $max] = $opt;
                    if (($min !== null && $num < $min) || ($max !== null && $num > $max)) fail($key, $obj, "«{$label}» debe estar" . ($min !== null && $max !== null ? " entre $min y $max." : ($min !== null ? " en $min o más." : " en $max o menos.")));
                }
                $row[$col] = $num; break;
            case 'd': case 'dn': $row[$col] = to_date($v); break;
            case 'dt':  $row[$col] = iso_to_dt($v) ?? gmdate('Y-m-d H:i:s') . '.000'; break;
            case 'dtn': $row[$col] = iso_to_dt($v); break;
            case 'fk':  $row[$col] = ($v === null || $v === '') ? null : (string)$v; break;
            case 'fkreq':
                if (!is_string($v) || $v === '') fail($key, $obj, 'necesita estar relacionado con un venue.');
                $row[$col] = $v; break;
            case 'enum':
                if (!in_array($v, $opt, true)) fail($key, $obj, "el valor «" . (is_scalar($v) ? $v : '') . "» no es válido para «{$label}». Valores permitidos: " . implode(', ', $opt) . '.');
                $row[$col] = $v; break;
            case 'stage':
                $i = array_search($v, ETAPAS, true);
                if ($i === false) fail($key, $obj, "la etapa «" . (is_scalar($v) ? $v : '') . "» no es válida. Valores permitidos: " . implode(', ', ETAPAS) . '.');
                $row[$col] = $i + 1; break;
            case 'size': $row[$col] = size_to_bytes($v); break;
        }
    }
    if ($key === 'events') {
        $row['utilidad'] = round($row['ingreso_total'] - $row['gastos_totales'], 2);   // derivado: nunca se desajusta
    }
    if ($key === 'artists') {
        $ps = is_array($obj['photoStyle'] ?? null) ? $obj['photoStyle'] : [];
        foreach (['zoom' => ['foto_zoom', 0.0001, 100], 'rotation' => ['foto_rotacion', -3600, 3600], 'contrast' => ['foto_contraste', 0, 1000], 'brightness' => ['foto_brillo', 0, 1000],
                  'grayscale' => ['foto_grises', 0, 1000], 'sepia' => ['foto_sepia', 0, 1000], 'blur' => ['foto_desenfoque', 0, 1000]] as $k => [$col, $min, $max]) {
            $v = $ps[$k] ?? null;
            if ($v === null || $v === '') { $row[$col] = null; continue; }
            if (!is_numeric($v) || $v < $min || $v > $max) fail($key, $obj, "el ajuste de foto «{$k}» está fuera de rango.");
            $row[$col] = (float)$v;
        }
    }
    if ($key === 'events') {
        $fb = is_array($obj['feedback'] ?? null) ? $obj['feedback'] : [];
        $txt = fn($k) => isset($fb[$k]) && trim((string)$fb[$k]) !== '' ? (string)$fb[$k] : null;
        $row['feedback_artista'] = $txt('artistThoughts'); $row['reaccion_publico'] = $txt('crowdReaction'); $row['notas_optimizacion'] = $txt('optimizationNotes');
        $pr = $fb['pacingRating'] ?? null;
        if ($pr !== null && $pr !== '' && (!is_numeric($pr) || $pr < 1 || $pr > 5)) fail($key, $obj, 'la valoración del ritmo debe estar entre 1 y 5.');
        $row['valoracion_ritmo'] = ($pr === null || $pr === '') ? null : (int)round((float)$pr);
    }
    if ($key === 'tours' && $row['fecha_inicio'] !== null && $row['fecha_fin'] !== null && $row['fecha_fin'] < $row['fecha_inicio']) fail($key, $obj, 'la fecha de fin no puede ser anterior a la de inicio.');
    if (!empty($def['extra'])) {
        $extra = array_diff_key($obj, $def['cols'], array_flip($def['virtual']), ['version' => 1]);
        $row['extra'] = $extra ? json_encode($extra, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null;
    }
    return $row;
}

function from_row(array $def, array $row): array {
    $obj = [];
    if (!empty($def['extra']) && !empty($row['extra'])) { $ex = json_decode((string)$row['extra'], true); if (is_array($ex)) $obj = $ex; }
    foreach ($def['cols'] as $field => $spec) {
        [$col, $type] = $spec; $v = $row[$col] ?? null;
        switch ($type) {
            case 'id': case 's': case 'enum': $obj[$field] = (string)($v ?? ''); break;
            case 'd':  $obj[$field] = $v === null ? '' : substr((string)$v, 0, 10); break;
            case 'dn': if ($v !== null) $obj[$field] = substr((string)$v, 0, 10); break;
            case 'sn': case 'fk': if ($v !== null && $v !== '') $obj[$field] = (string)$v; break;
            case 'fkreq': $obj[$field] = (string)($v ?? ''); break;
            case 'i':  $obj[$field] = (int)$v; break;
            case 'in': $obj[$field] = $v === null ? null : (int)$v; break;
            case 'f':  $obj[$field] = (float)$v; break;
            case 'dt': $obj[$field] = dt_to_iso($v) ?? ''; break;
            case 'dtn': $obj[$field] = ($f = dt_to_iso($v)) ; if ($f === null && $field !== 'deleted_at') unset($obj[$field]); break;
            case 'stage': $obj[$field] = ETAPAS[max(0, (int)$v - 1)] ?? ETAPAS[0]; break;
            case 'size': $obj[$field] = bytes_to_size($v === null ? null : (int)$v); break;
        }
    }
    if (array_key_exists('foto_zoom', $row)) {
        $ps = []; foreach (['zoom' => 'foto_zoom', 'rotation' => 'foto_rotacion', 'contrast' => 'foto_contraste', 'brightness' => 'foto_brillo', 'grayscale' => 'foto_grises', 'sepia' => 'foto_sepia', 'blur' => 'foto_desenfoque'] as $k => $c) if ($row[$c] !== null) $ps[$k] = (float)$row[$c];
        if ($ps) $obj['photoStyle'] = $ps;
    }
    if (array_key_exists('feedback_artista', $row)) {
        $fb = []; foreach (['artistThoughts' => 'feedback_artista', 'crowdReaction' => 'reaccion_publico', 'optimizationNotes' => 'notas_optimizacion'] as $k => $c) if ($row[$c] !== null) $fb[$k] = $row[$c];
        if ($row['valoracion_ritmo'] !== null) $fb['pacingRating'] = (int)$row['valoracion_ritmo'];
        if ($fb) $obj['feedback'] = $fb;
    }
    if (array_key_exists('version', $row)) $obj['version'] = (int)$row['version'];
    return $obj;
}

// ───────── lectura ─────────
function group_by(array $rows, string $key): array { $o = []; foreach ($rows as $r) $o[$r[$key]][] = $r; return $o; }
function contact_fullname(array $c): string { return trim($c['nombre'] . ' ' . ($c['apellidos'] ?? '')); }

function load_all(PDO $pdo): array {
    $defs = entity_defs();
    $out = [];
    foreach ($defs as $key => $def) {
        $out[$key] = array_map(fn($r) => from_row($def, $r), $pdo->query("SELECT * FROM {$def['table']} ORDER BY id")->fetchAll());
    }
    // contactos (personas) con sus medios y vínculos
    $contacts = $pdo->query('SELECT * FROM contactos ORDER BY id')->fetchAll();
    $emails = group_by($pdo->query('SELECT * FROM contacto_correos ORDER BY (es_principal IS NULL), id')->fetchAll(), 'contacto_id');
    $phones = group_by($pdo->query('SELECT * FROM contacto_telefonos ORDER BY (es_principal IS NULL), id')->fetchAll(), 'contacto_id');
    $links = [];
    foreach ([['venue', 'venue_contactos', 'venue_id'], ['artist', 'artista_contactos', 'artista_id'], ['provider', 'proveedor_contactos', 'proveedor_id']] as [$type, $table, $fk]) {
        foreach ($pdo->query("SELECT l.*, r.nombre rol FROM $table l JOIN cat_roles_contacto r ON r.id = l.rol_id ORDER BY l.$fk")->fetchAll() as $l)
            $links[$l['contacto_id']][] = ['type' => $type, 'id' => $l[$fk], 'role' => $l['rol'], 'isPrincipal' => $l['es_principal'] !== null];
    }
    $out['contacts'] = [];
    foreach ($contacts as $c) {
        $ls = $links[$c['id']] ?? [];
        $venueLink = null; foreach ($ls as $l) if ($l['type'] === 'venue') { $venueLink = $l; break; }
        $obj = [
            'id' => $c['id'], 'name' => contact_fullname($c), 'firstName' => $c['nombre'], 'lastName' => (string)($c['apellidos'] ?? ''),
            'email' => $emails[$c['id']][0]['correo'] ?? '', 'phone' => $phones[$c['id']][0]['telefono'] ?? '',
            'role' => $venueLink['role'] ?? ($ls[0]['role'] ?? ''), 'venueId' => $venueLink['id'] ?? '',
            'emails' => array_map(fn($e) => ['value' => $e['correo'], 'label' => $e['etiqueta'], 'primary' => $e['es_principal'] !== null], $emails[$c['id']] ?? []),
            'phones' => array_map(fn($t) => ['value' => $t['telefono'], 'label' => $t['etiqueta'], 'primary' => $t['es_principal'] !== null], $phones[$c['id']] ?? []),
            'links' => $ls, 'version' => (int)$c['version'],
        ];
        $out['contacts'][] = $obj;
    }
    // N:M venues ⇄ proveedores y contacto principal del venue
    $byVenue = []; $byProv = [];
    foreach ($pdo->query('SELECT venue_id, proveedor_id FROM venue_proveedores')->fetchAll() as $r) { $byVenue[$r['venue_id']][] = $r['proveedor_id']; $byProv[$r['proveedor_id']][] = $r['venue_id']; }
    $principalVenue = array_column($pdo->query('SELECT venue_id, contacto_id FROM venue_contactos WHERE es_principal = 1')->fetchAll(), 'contacto_id', 'venue_id');
    foreach ($out['venues'] as &$v) { $v['providerIds'] = $byVenue[$v['id']] ?? []; if (isset($principalVenue[$v['id']])) $v['contactoPrincipalId'] = $principalVenue[$v['id']]; }
    unset($v);
    // contacto principal del proveedor
    $cById = []; foreach ($out['contacts'] as $c) $cById[$c['id']] = $c;
    $provContact = [];
    foreach ($pdo->query('SELECT proveedor_id, contacto_id FROM proveedor_contactos ORDER BY (es_principal IS NULL), contacto_id')->fetchAll() as $r) $provContact[$r['proveedor_id']] ??= $r['contacto_id'];
    foreach ($out['providers'] as &$p) {
        $p['venueIds'] = $byProv[$p['id']] ?? [];
        $c = $cById[$provContact[$p['id']] ?? ''] ?? null;
        $p['contactName'] = $c['name'] ?? ''; $p['phone'] = $c['phone'] ?? ''; $p['email'] = $c['email'] ?? '';
    }
    unset($p);
    // géneros, manager y booking de artistas
    $gen = group_by($pdo->query('SELECT ag.artista_id, g.nombre, ag.es_principal FROM artista_generos ag JOIN cat_generos g ON g.id = ag.genero_id ORDER BY ag.artista_id, ag.orden')->fetchAll(), 'artista_id');
    $mgr = [];
    foreach ($pdo->query('SELECT ac.artista_id, r.nombre rol, c.nombre, c.apellidos FROM artista_contactos ac JOIN contactos c ON c.id = ac.contacto_id JOIN cat_roles_contacto r ON r.id = ac.rol_id ORDER BY (ac.es_principal IS NULL), c.id')->fetchAll() as $r)
        $mgr[$r['artista_id']][$r['rol']] ??= contact_fullname($r);
    foreach ($out['artists'] as &$a) {
        $g = $gen[$a['id']] ?? []; $main = ''; $subs = [];
        foreach ($g as $x) { if ($x['es_principal'] && $main === '') $main = $x['nombre']; else $subs[] = $x['nombre']; }
        $a['genre'] = $main; $a['subgenres'] = $subs;
        $a['manager'] = $mgr[$a['id']]['Manager'] ?? ''; $a['bookingAgent'] = $mgr[$a['id']]['Booking'] ?? '';
    }
    unset($a);
    // grupos que antes vivían en JSON
    $G = fn(string $sql) => group_by($pdo->query($sql)->fetchAll(), 'k');
    $idi = $G('SELECT artista_id k, idioma FROM artista_idiomas ORDER BY artista_id, orden');
    $red = $G('SELECT artista_id k, plataforma, enlace, conectado, usuario_conectado FROM artista_redes');
    $pip = $G('SELECT artista_id k, item_id, nombre, categoria, completado FROM artista_pipeline ORDER BY artista_id, orden');
    $hit = $G('SELECT artista_id k, hito_id, fecha, titulo, descripcion, tipo FROM artista_hitos ORDER BY artista_id, orden');
    $int = $G('SELECT artista_id k, integrante_id, nombre, rol, fecha_inicio, fecha_fin, lugar_inicio, activo FROM artista_integrantes ORDER BY artista_id, orden');
    foreach ($out['artists'] as &$a) {
        $id = $a['id'];
        $a['languages'] = array_column($idi[$id] ?? [], 'idioma');
        $sm = []; foreach ($red[$id] ?? [] as $r) { if ($r['enlace'] !== '') $sm[$r['plataforma']] = $r['enlace']; if ($r['conectado']) $sm[$r['plataforma'] . 'Connected'] = true; if ($r['usuario_conectado'] !== null) $sm[$r['plataforma'] . 'ConnectedUser'] = $r['usuario_conectado']; }
        $a['socialMedia'] = $sm ?: new stdClass();
        $a['pipeline'] = array_map(fn($p) => ['id' => $p['item_id'], 'name' => $p['nombre'], 'category' => $p['categoria'], 'completed' => (bool)$p['completado']], $pip[$id] ?? []);
        $a['history'] = array_map(fn($h) => ['id' => $h['hito_id'], 'date' => $h['fecha'] ?? '', 'title' => $h['titulo'], 'description' => $h['descripcion'] ?? '', 'type' => $h['tipo']], $hit[$id] ?? []);
        $a['memberHistory'] = array_map(fn($m) => array_filter(['id' => $m['integrante_id'], 'name' => $m['nombre'], 'role' => $m['rol'], 'startDate' => $m['fecha_inicio'] ?? '', 'endDate' => $m['fecha_fin'], 'venueName' => $m['lugar_inicio'], 'active' => (bool)$m['activo']], fn($v) => $v !== null), $int[$id] ?? []);
        $a['members'] = array_values(array_map(fn($m) => $m['name'] . ' (' . $m['role'] . ')', array_filter($a['memberHistory'], fn($m) => $m['active'])));
    }
    unset($a);
    $hor = $G('SELECT venue_id k, descripcion FROM venue_horarios ORDER BY venue_id, orden');
    $ban = $G('SELECT venue_id k, nombre FROM venue_bandas_locales ORDER BY venue_id, orden');
    try { $vno = $G('SELECT venue_id k, nota_id, fecha, texto, autor, evento_id FROM venue_notas ORDER BY venue_id, fecha, nota_id'); }
    catch (PDOException $e) { if ((int)($e->errorInfo[1] ?? 0) !== 1146) throw $e; $vno = []; }   // esquema anterior a la migración 006
    foreach ($out['venues'] as &$v) {
        $v['hours'] = array_column($hor[$v['id']] ?? [], 'descripcion'); $v['localBands'] = array_column($ban[$v['id']] ?? [], 'nombre');
        $v['notes'] = array_map(fn($n) => array_filter(['id' => $n['nota_id'], 'date' => dt_to_iso($n['fecha']), 'text' => $n['texto'], 'author' => $n['autor'], 'eventId' => $n['evento_id']], fn($q) => $q !== null), $vno[$v['id']] ?? []);
    }
    unset($v);
    $inv = $G('SELECT evento_id k, nombre FROM evento_bandas_invitadas ORDER BY evento_id, orden');
    $set = $G('SELECT evento_id k, item_id, titulo, duracion_seg, tempo, notas_transicion FROM evento_setlist ORDER BY evento_id, orden');
    foreach ($out['events'] as &$e) {
        $e['guestBands'] = array_column($inv[$e['id']] ?? [], 'nombre');
        $e['setlist'] = array_map(fn($x) => array_filter(['id' => $x['item_id'], 'songTitle' => $x['titulo'], 'duration' => bytes_dur($x['duracion_seg'] === null ? null : (int)$x['duracion_seg']), 'tempo' => $x['tempo'], 'transitionNotes' => $x['notas_transicion']], fn($q) => $q !== null), $set[$e['id']] ?? []);
    }
    unset($e);
    $son = $G('SELECT proyecto_id k, cancion_id, titulo, duracion_seg, compositor, estado, progreso, notas FROM proyecto_canciones ORDER BY proyecto_id, orden');
    $cos = $G('SELECT proyecto_id k, costo_id, concepto, categoria, monto, notas FROM proyecto_costos ORDER BY proyecto_id, orden');
    $pag = $G('SELECT proyecto_id k, pago_id, concepto, monto, fecha_vencimiento, estado, notas FROM proyecto_pagos ORDER BY proyecto_id, orden');
    $eta = $G('SELECT proyecto_id k, etapa_id, nombre, estado, fecha_inicio, fecha_fin, notas FROM proyecto_etapas ORDER BY proyecto_id, orden');
    $ins = []; foreach ($pdo->query('SELECT * FROM proyecto_instrumentos ORDER BY proyecto_id, etapa_id, orden')->fetchAll() as $i) $ins[$i['proyecto_id'] . '|' . $i['etapa_id']][] = $i;
    $nn = fn(array $x) => array_filter($x, fn($q) => $q !== null);
    foreach ($out['recording_projects'] as &$r) {
        $id = $r['id'];
        $r['songs'] = array_map(fn($x) => $nn(['id' => $x['cancion_id'], 'title' => $x['titulo'], 'duration' => bytes_dur($x['duracion_seg'] === null ? null : (int)$x['duracion_seg']), 'composer' => $x['compositor'], 'status' => $x['estado'], 'progress' => (int)$x['progreso'], 'notes' => $x['notas']]), $son[$id] ?? []);
        $r['costs'] = array_map(fn($x) => $nn(['id' => $x['costo_id'], 'concept' => $x['concepto'], 'category' => $x['categoria'], 'amount' => (float)$x['monto'], 'notes' => $x['notas']]), $cos[$id] ?? []);
        $r['payments'] = array_map(fn($x) => $nn(['id' => $x['pago_id'], 'concept' => $x['concepto'], 'amount' => (float)$x['monto'], 'dueDate' => $x['fecha_vencimiento'] ?? '', 'status' => $x['estado'], 'notes' => $x['notas']]), $pag[$id] ?? []);
        $r['stages'] = array_map(fn($x) => $nn(['id' => $x['etapa_id'], 'name' => $x['nombre'], 'status' => $x['estado'], 'startDate' => $x['fecha_inicio'], 'endDate' => $x['fecha_fin'], 'notes' => $x['notas'],
            'instruments' => array_map(fn($q) => $nn(['id' => $q['instrumento_id'], 'name' => $q['nombre'], 'status' => $q['estado'], 'musician' => $q['musico']]), $ins[$id . '|' . $x['etapa_id']] ?? [])]), $eta[$id] ?? []);
    }
    unset($r);
    // partes y objeto de los contratos
    $cp = ['artistIds' => ['contrato_artistas', 'artista_id'], 'venueIds' => ['contrato_venues', 'venue_id'], 'providerIds' => ['contrato_proveedores', 'proveedor_id'], 'eventIds' => ['contrato_eventos', 'evento_id'], 'tourIds' => ['contrato_tours', 'tour_id']];
    $links = []; foreach ($cp as $field => [$t, $c]) foreach ($pdo->query("SELECT contrato_id, $c v FROM `$t` ORDER BY contrato_id, $c")->fetchAll() as $l) $links[$field][$l['contrato_id']][] = $l['v'];
    foreach ($out['contracts'] as &$c) {
        foreach (array_keys($cp) as $field) $c[$field] = $links[$field][$c['id']] ?? [];
        foreach (['artistId' => 'artistIds', 'venueId' => 'venueIds', 'eventId' => 'eventIds', 'tourId' => 'tourIds'] as $one => $many) if ($c[$many]) $c[$one] = $c[$many][0];
        if (empty($c['tourId']) && $c['eventIds']) { $tid = q_one($pdo, 'SELECT tour_id FROM eventos WHERE id = ?', [$c['eventIds'][0]]); if ($tid !== null) $c['tourId'] = $tid; }   // la gira se deduce del evento
    }
    unset($c);
    // artistas de giras y de eventos
    $ta = group_by($pdo->query('SELECT tour_id, artista_id, es_principal FROM tour_artistas ORDER BY tour_id, (es_principal IS NULL), artista_id')->fetchAll(), 'tour_id');
    foreach ($out['tours'] as &$t) { $r = $ta[$t['id']] ?? []; $t['artistIds'] = array_column($r, 'artista_id'); $t['artistId'] = $t['artistIds'][0] ?? ''; }
    unset($t);
    $ea = group_by($pdo->query('SELECT * FROM evento_artistas ORDER BY evento_id, orden_presentacion, id')->fetchAll(), 'evento_id');
    foreach ($out['events'] as &$e) {
        $rows = $ea[$e['id']] ?? []; $e['artists'] = []; $e['artistId'] = '';
        foreach ($rows as $r) {
            $e['artists'][] = array_filter([
                'artistId' => $r['artista_id'], 'role' => $r['rol'], 'isPrincipal' => $r['es_principal'] !== null, 'order' => (int)$r['orden_presentacion'],
                'startTime' => $r['hora_inicio'] === null ? null : substr($r['hora_inicio'], 0, 5), 'endTime' => $r['hora_fin'] === null ? null : substr($r['hora_fin'], 0, 5),
                'fee' => $r['honorarios'] === null ? null : (float)$r['honorarios'], 'currency' => $r['moneda'], 'status' => $r['estado_confirmacion'],
            ], fn($x) => $x !== null);
            if ($r['es_principal'] !== null) $e['artistId'] = $r['artista_id'];
        }
        if ($e['artistId'] === '' && $rows) $e['artistId'] = $rows[0]['artista_id'];
        $e['profit'] = round($e['totalIncome'] - $e['expenses'], 2);
    }
    unset($e);
    return $out;
}

// ───────── escritura: utilidades de contactos ─────────
function set_primary_value(PDO $pdo, string $table, string $col, string $cid, string $val): void {
    $val = trim($val);
    $cur = q_all($pdo, "SELECT id, `$col` v FROM `$table` WHERE contacto_id = ? AND es_principal = 1", [$cid])[0] ?? null;
    if ($val === '') { if ($cur) q_run($pdo, "DELETE FROM `$table` WHERE id = ?", [$cur['id']]); return; }
    if ($cur && $cur['v'] === $val) return;
    if ($cur) q_run($pdo, "DELETE FROM `$table` WHERE id = ?", [$cur['id']]);
    q_run($pdo, "DELETE FROM `$table` WHERE contacto_id = ? AND `$col` = ?", [$cid, $val]);
    q_run($pdo, "INSERT INTO `$table` (contacto_id, `$col`, es_principal) VALUES (?, ?, 1)", [$cid, $val]);
}
function create_contact(PDO $pdo, string $nombre, ?string $apellidos = null): string {
    $id = new_contact_id();
    q_run($pdo, 'INSERT INTO contactos (id, nombre, apellidos) VALUES (?, ?, ?)', [$id, mb_substr($nombre, 0, 255) ?: 'Sin nombre', $apellidos ?: null]);
    return $id;
}
function contact_link_count(PDO $pdo, string $cid): int {
    return (int)q_one($pdo, 'SELECT (SELECT COUNT(*) FROM venue_contactos WHERE contacto_id = ?) + (SELECT COUNT(*) FROM artista_contactos WHERE contacto_id = ?) + (SELECT COUNT(*) FROM proveedor_contactos WHERE contacto_id = ?)', [$cid, $cid, $cid]);
}

function set_artist_contact(PDO $pdo, string $artistId, string $rolName, string $full, array &$ctx): void {
    $rol = role_id($pdo, $rolName); $full = norm_space($full);
    $cur = q_all($pdo, "SELECT ac.contacto_id id, TRIM(CONCAT(c.nombre, ' ', COALESCE(c.apellidos, ''))) full FROM artista_contactos ac JOIN contactos c ON c.id = ac.contacto_id WHERE ac.artista_id = ? AND ac.rol_id = ? AND ac.es_principal = 1", [$artistId, $rol])[0] ?? null;
    if ($full === '') { if ($cur) { q_run($pdo, 'DELETE FROM artista_contactos WHERE artista_id = ? AND rol_id = ? AND es_principal = 1', [$artistId, $rol]); $ctx['dirty']['contacts'] = true; } return; }
    if ($cur && mb_strtolower($cur['full']) === mb_strtolower($full)) return;
    $cid = q_one($pdo, "SELECT c.id FROM contactos c JOIN artista_contactos ac ON ac.contacto_id = c.id WHERE ac.rol_id = ? AND TRIM(CONCAT(c.nombre, ' ', COALESCE(c.apellidos, ''))) = ? LIMIT 1", [$rol, $full]);
    $cid = $cid ?? create_contact($pdo, $full);
    if ($cur) q_run($pdo, 'DELETE FROM artista_contactos WHERE artista_id = ? AND rol_id = ? AND es_principal = 1', [$artistId, $rol]);
    if (q_run($pdo, 'UPDATE artista_contactos SET es_principal = 1 WHERE artista_id = ? AND contacto_id = ? AND rol_id = ?', [$artistId, $cid, $rol]) === 0)
        q_run($pdo, 'INSERT INTO artista_contactos (artista_id, contacto_id, rol_id, es_principal) VALUES (?, ?, ?, 1)', [$artistId, $cid, $rol]);
    $ctx['dirty']['contacts'] = true;
}

function set_provider_contact(PDO $pdo, string $provId, string $provName, array $obj, array &$ctx): void {
    $name = norm_space((string)($obj['contactName'] ?? '')); $phone = trim((string)($obj['phone'] ?? '')); $email = trim((string)($obj['email'] ?? ''));
    $cur = q_one($pdo, 'SELECT contacto_id FROM proveedor_contactos WHERE proveedor_id = ? AND es_principal = 1', [$provId]);
    if ($name === '' && $phone === '' && $email === '') { if ($cur) { q_run($pdo, 'DELETE FROM proveedor_contactos WHERE proveedor_id = ? AND es_principal = 1', [$provId]); $ctx['dirty']['contacts'] = true; } return; }
    $nombre = $name !== '' ? $name : $provName;
    if ($cur !== null && contact_link_count($pdo, $cur) === 1) {                       // contacto propio del proveedor: se edita
        $row = q_all($pdo, 'SELECT nombre, apellidos FROM contactos WHERE id = ?', [$cur])[0];
        if (mb_strtolower(contact_fullname($row)) !== mb_strtolower($nombre)) q_run($pdo, 'UPDATE contactos SET nombre = ?, apellidos = NULL, version = version + 1 WHERE id = ?', [mb_substr($nombre, 0, 255), $cur]);
        $cid = $cur;
    } else {                                                                            // compartido o inexistente: contacto nuevo
        if ($cur !== null) q_run($pdo, 'DELETE FROM proveedor_contactos WHERE proveedor_id = ? AND es_principal = 1', [$provId]);
        $cid = create_contact($pdo, $nombre);
        q_run($pdo, 'INSERT INTO proveedor_contactos (proveedor_id, contacto_id, rol_id, es_principal) VALUES (?, ?, ?, 1)', [$provId, $cid, role_id($pdo, 'Contacto comercial')]);
    }
    set_primary_value($pdo, 'contacto_correos', 'correo', $cid, $email);
    set_primary_value($pdo, 'contacto_telefonos', 'telefono', $cid, $phone);
    $ctx['dirty']['contacts'] = true;
}

function upsert_contact(PDO $pdo, array $obj, array &$ctx): int {
    $id = $obj['id'] ?? null;
    if (!is_string($id) || $id === '' || strlen($id) > 40) throw new SyncError('Contacto sin identificador válido.');
    $nombre = isset($obj['firstName']) ? norm_space((string)$obj['firstName']) : norm_space((string)($obj['name'] ?? ''));
    $apellidos = isset($obj['firstName']) ? (norm_space((string)($obj['lastName'] ?? '')) ?: null) : null;
    if ($nombre === '') throw new SyncError('Contacto: el nombre es obligatorio.');
    $cur = q_one($pdo, 'SELECT version FROM contactos WHERE id = ? FOR UPDATE', [$id]);
    if ($cur !== null && isset($obj['version']) && (int)$obj['version'] !== (int)$cur) throw new ConflictError("El contacto «{$nombre}» fue modificado por otra persona. Se cargaron los datos más recientes.");
    $ver = $cur === null ? 1 : (int)$cur + 1;
    q_run($pdo, 'INSERT INTO contactos (id, nombre, apellidos, version) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), apellidos = VALUES(apellidos), version = VALUES(version), updated_at = CURRENT_TIMESTAMP(3)', [$id, mb_substr($nombre, 0, 255), $apellidos === null ? null : mb_substr($apellidos, 0, 255), $ver]);

    // correos y teléfonos: lista completa si viene; si no, solo el principal
    foreach ([['emails', 'email', 'contacto_correos', 'correo'], ['phones', 'phone', 'contacto_telefonos', 'telefono']] as [$listKey, $oneKey, $table, $col]) {
        if (isset($obj[$listKey]) && is_array($obj[$listKey])) {
            q_run($pdo, "DELETE FROM `$table` WHERE contacto_id = ?", [$id]);
            $hasPrimary = false; $seen = [];
            foreach ($obj[$listKey] as $it) {
                $val = trim((string)($it['value'] ?? ''));
                if ($val === '' || isset($seen[mb_strtolower($val)])) continue;
                $seen[mb_strtolower($val)] = true;
                $prim = !empty($it['primary']) && !$hasPrimary; $hasPrimary = $hasPrimary || $prim;
                q_run($pdo, "INSERT INTO `$table` (contacto_id, `$col`, etiqueta, es_principal) VALUES (?, ?, ?, ?)", [$id, mb_substr($val, 0, $col === 'correo' ? 255 : 40), isset($it['label']) ? mb_substr((string)$it['label'], 0, 30) : null, $prim ? 1 : null]);
            }
            if (!$hasPrimary) q_run($pdo, "UPDATE `$table` SET es_principal = 1 WHERE contacto_id = ? ORDER BY id LIMIT 1", [$id]);
        } elseif (array_key_exists($oneKey, $obj)) {
            set_primary_value($pdo, $table, $col, $id, (string)$obj[$oneKey]);
        }
    }

    // vínculos con venues / artistas / proveedores
    $tables = ['venue' => ['venue_contactos', 'venue_id'], 'artist' => ['artista_contactos', 'artista_id'], 'provider' => ['proveedor_contactos', 'proveedor_id']];
    if (isset($obj['links']) && is_array($obj['links'])) {
        foreach ($tables as [$t]) q_run($pdo, "DELETE FROM `$t` WHERE contacto_id = ?", [$id]);
        foreach ($obj['links'] as $l) {
            if (!isset($tables[$l['type'] ?? ''], $l['id'])) continue;
            [$t, $fk] = $tables[$l['type']];
            $rid = role_id($pdo, norm_space((string)($l['role'] ?? '')));
            q_run($pdo, "INSERT IGNORE INTO `$t` ($fk, contacto_id, rol_id) VALUES (?, ?, ?)", [$l['id'], $id, $rid]);
            if (!empty($l['isPrincipal'])) {
                if ($l['type'] === 'artist') q_run($pdo, "UPDATE `$t` SET es_principal = NULL WHERE $fk = ? AND rol_id = ?", [$l['id'], $rid]);
                else q_run($pdo, "UPDATE `$t` SET es_principal = NULL WHERE $fk = ?", [$l['id']]);
                q_run($pdo, "UPDATE `$t` SET es_principal = 1 WHERE $fk = ? AND contacto_id = ? AND rol_id = ?", [$l['id'], $id, $rid]);
                if ($l['type'] === 'venue') $ctx['principalSet'][$l['id']] = true;
            }
        }
    } elseif (array_key_exists('venueId', $obj)) {                                      // formato anterior: un solo venue
        $vid = (string)$obj['venueId'];
        q_run($pdo, 'DELETE FROM venue_contactos WHERE contacto_id = ? AND venue_id <> ?', [$id, $vid]);
        if ($vid !== '') {
            $rid = role_id($pdo, norm_space((string)($obj['role'] ?? '')));
            if (q_run($pdo, 'UPDATE venue_contactos SET rol_id = ? WHERE venue_id = ? AND contacto_id = ?', [$rid, $vid, $id]) === 0 && !q_one($pdo, 'SELECT 1 FROM venue_contactos WHERE venue_id = ? AND contacto_id = ?', [$vid, $id]))
                q_run($pdo, 'INSERT INTO venue_contactos (venue_id, contacto_id, rol_id) VALUES (?, ?, ?)', [$vid, $id, $rid]);
        }
    }
    return $ver;
}

// ───────── escritura: pivotes y tablas hijas ─────────
function replace_pivot(PDO $pdo, string $key, string $id, array $others): void {
    [$mine, $theirs, $theirTable] = $key === 'venues' ? ['venue_id', 'proveedor_id', 'proveedores'] : ['proveedor_id', 'venue_id', 'venues'];
    q_run($pdo, "DELETE FROM venue_proveedores WHERE $mine = ?", [$id]);
    foreach (array_unique(array_filter($others, 'is_string')) as $oid) {
        if (q_one($pdo, "SELECT 1 FROM $theirTable WHERE id = ?", [$oid]) !== null) q_run($pdo, "INSERT INTO venue_proveedores ($mine, $theirs) VALUES (?, ?)", [$id, $oid]);
    }
}

function set_artist_genres(PDO $pdo, string $id, array $obj): void {
    $names = [];
    foreach (explode(',', (string)($obj['genre'] ?? '')) as $g) $names[] = norm_space($g);
    foreach ((array)($obj['subgenres'] ?? []) as $g) if (is_string($g)) $names[] = norm_space($g);
    q_run($pdo, 'DELETE FROM artista_generos WHERE artista_id = ?', [$id]);
    $seen = []; $orden = 0;
    foreach ($names as $n) {
        if ($n === '') continue;
        $gid = catalog_id($pdo, 'cat_generos', $n, 80);
        if (isset($seen[$gid])) continue;
        $seen[$gid] = true; $orden++;
        q_run($pdo, 'INSERT INTO artista_generos (artista_id, genero_id, es_principal, orden) VALUES (?, ?, ?, ?)', [$id, $gid, $orden === 1 ? 1 : null, min($orden, 255)]);
    }
}

function set_tour_artists(PDO $pdo, string $id, array $obj): void {
    $ids = isset($obj['artistIds']) && is_array($obj['artistIds']) ? $obj['artistIds'] : (!empty($obj['artistId']) ? [$obj['artistId']] : []);
    $ids = array_values(array_unique(array_filter($ids, fn($x) => is_string($x) && $x !== '')));
    if (!$ids) fail('tours', $obj, 'necesita al menos un artista.');
    $main = in_array($obj['artistId'] ?? null, $ids, true) ? $obj['artistId'] : $ids[0];
    // los artistas de los eventos de la gira deben seguir en la gira
    $bad = q_all($pdo, 'SELECT e.nombre en, a.nombre_artistico an FROM eventos e JOIN evento_artistas ea ON ea.evento_id = e.id JOIN artistas a ON a.id = ea.artista_id WHERE e.tour_id = ?' . ' AND ea.artista_id NOT IN (' . implode(',', array_fill(0, count($ids), '?')) . ') LIMIT 1', array_merge([$id], $ids));
    if ($bad) fail('tours', $obj, "no se puede quitar a «{$bad[0]['an']}» de la gira: participa en el evento «{$bad[0]['en']}» de esta gira.");
    q_run($pdo, 'DELETE FROM tour_artistas WHERE tour_id = ?', [$id]);
    foreach ($ids as $aid) q_run($pdo, 'INSERT INTO tour_artistas (tour_id, artista_id, es_principal) VALUES (?, ?, ?)', [$id, $aid, $aid === $main ? 1 : null]);
}

function set_event_artists(PDO $pdo, string $id, array $obj): void {
    $list = isset($obj['artists']) && is_array($obj['artists']) && $obj['artists'] ? $obj['artists'] : (!empty($obj['artistId']) ? [['artistId' => $obj['artistId']]] : []);
    if (!$list) fail('events', $obj, 'necesita al menos un artista.');
    $defEstado = ['Cancelled' => 'Cancelado', 'Draft' => 'Pendiente'][$obj['status'] ?? ''] ?? 'Confirmado';
    $rows = []; $seen = []; $principal = null;
    foreach (array_values($list) as $i => $a) {
        $aid = $a['artistId'] ?? null;
        if (!is_string($aid) || $aid === '') fail('events', $obj, 'hay un artista sin identificar en la alineación.');
        $orden = max(1, (int)($a['order'] ?? ($i + 1)));
        if (isset($seen[$aid . '|' . $orden])) fail('events', $obj, 'un artista no puede repetirse con el mismo orden de presentación.');
        $seen[$aid . '|' . $orden] = true;
        $rol = $a['role'] ?? 'Artista';
        if (!in_array($rol, ['Artista', 'Invitado', 'Telonero', 'Soporte', 'Otro'], true)) fail('events', $obj, "el rol «{$rol}» no es válido en la alineación. Valores permitidos: Artista, Invitado, Telonero, Soporte, Otro.");
        $est = $a['status'] ?? $defEstado;
        if (!in_array($est, ['Pendiente', 'Confirmado', 'Cancelado'], true)) fail('events', $obj, "el estado de confirmación «{$est}» no es válido. Valores permitidos: Pendiente, Confirmado, Cancelado.");
        $fee = isset($a['fee']) && $a['fee'] !== '' ? (float)$a['fee'] : null;
        if ($fee !== null && $fee < 0) fail('events', $obj, 'los honorarios no pueden ser negativos.');
        $hi = isset($a['startTime']) && $a['startTime'] !== '' ? to_time($a['startTime']) : null; $hf = isset($a['endTime']) && $a['endTime'] !== '' ? to_time($a['endTime']) : null;
        if ((isset($a['startTime']) && $a['startTime'] !== '' && $hi === null) || (isset($a['endTime']) && $a['endTime'] !== '' && $hf === null)) fail('events', $obj, 'el horario debe tener formato HH:MM.');
        $rows[] = [$aid, $rol, $orden, $hi, $hf, $fee, strtoupper((string)($a['currency'] ?? 'MXN')), $est];
        if ($principal === null && (!empty($a['isPrincipal']) || $aid === ($obj['artistId'] ?? null))) $principal = count($rows) - 1;
    }
    if (isset($obj['artistId']) && $obj['artistId'] !== '') { foreach ($rows as $k => $r) if ($r[0] === $obj['artistId']) { $principal = $k; break; } }
    $principal ??= 0;
    if (!empty($obj['tourId'])) {                                                      // los artistas del evento deben pertenecer a su gira
        $inTour = array_column(q_all($pdo, 'SELECT artista_id FROM tour_artistas WHERE tour_id = ?', [$obj['tourId']]), 'artista_id');
        foreach ($rows as $r) if ($inTour && !in_array($r[0], $inTour, true)) {
            $an = (string)q_one($pdo, 'SELECT nombre_artistico FROM artistas WHERE id = ?', [$r[0]]);
            fail('events', $obj, "el artista «{$an}» no participa en la gira de este evento. Agrégalo a la gira o cambia el evento de gira.");
        }
    }
    q_run($pdo, 'DELETE FROM evento_artistas WHERE evento_id = ?', [$id]);
    foreach ($rows as $k => $r) {
        q_run($pdo, 'INSERT INTO evento_artistas (evento_id, artista_id, rol, es_principal, orden_presentacion, hora_inicio, hora_fin, honorarios, moneda, estado_confirmacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [$id, $r[0], $r[1], $k === $principal ? 1 : null, $r[2], $r[3], $r[4], $r[5], $r[6], $r[7]]);
    }
}

function bytes_dur(?int $s): ?string { return $s === null ? null : intdiv($s, 60) . ':' . str_pad((string)($s % 60), 2, '0', STR_PAD_LEFT); }
function dur_secs(mixed $v): ?int { return is_string($v) && preg_match('/^(\d{1,3}):([0-5]\d)$/', trim($v), $m) ? (int)$m[1] * 60 + (int)$m[2] : null; }
function text_or_null(mixed $v, int $max = 65000): ?string { if ($v === null || is_array($v)) return null; $s = trim((string)$v); return $s === '' ? null : mb_substr($s, 0, $max); }
function must_in(string $key, array $obj, string $label, mixed $v, array $allowed): string {
    if (!in_array($v, $allowed, true)) fail($key, $obj, "el valor «" . (is_scalar($v) ? $v : '') . "» no es válido para «{$label}». Valores permitidos: " . implode(', ', $allowed) . '.');
    return $v;
}
/** id de elemento hijo: se conserva el de la interfaz; si falta o se repite, se genera. */
function child_id(array &$seen, mixed $id, string $prefix, int $i): string {
    $base = is_string($id) && $id !== '' ? mb_substr($id, 0, 40) : $prefix . '-' . ($i + 1);
    $id = $base; $n = 0;
    // Siempre termina: cada intento usa un sufijo distinto (-posición-n) y $seen es finito.
    while (isset($seen[$id])) { $n++; $suf = '-' . $i . '-' . $n; $id = mb_substr($base, 0, 40 - strlen($suf)) . $suf; }
    return $seen[$id] = $id;
}
function replace_rows(PDO $pdo, string $table, string $keyCol, string $id, array $rows): void {
    q_run($pdo, "DELETE FROM `$table` WHERE `$keyCol` = ?", [$id]);
    foreach ($rows as $r) {
        $cols = array_keys($r);
        q_run($pdo, "INSERT INTO `$table` (`$keyCol`, `" . implode('`, `', $cols) . '`) VALUES (?' . str_repeat(', ?', count($cols)) . ')', array_merge([$id], array_values($r)));
    }
}
function nonempty_list(mixed $v): array { return is_array($v) ? array_values($v) : []; }

function set_artist_groups(PDO $pdo, string $id, array $obj): void {
    $k = 'artists';
    $rows = []; $seen = [];
    foreach (nonempty_list($obj['languages'] ?? []) as $i => $l) { $l = text_or_null($l, 60); if ($l !== null && !isset($seen[mb_strtolower($l)])) { $seen[mb_strtolower($l)] = 1; $rows[] = ['idioma' => $l, 'orden' => min(count($rows) + 1, 255)]; } }
    replace_rows($pdo, 'artista_idiomas', 'artista_id', $id, $rows);

    $nets = ['instagram', 'tiktok', 'facebook', 'youtube', 'spotify', 'appleMusic', 'twitter', 'threads', 'whatsapp', 'website'];
    $sm = is_array($obj['socialMedia'] ?? null) ? $obj['socialMedia'] : []; $rows = [];
    foreach ($nets as $net) {
        $link = text_or_null($sm[$net] ?? null, 500); $conn = !empty($sm[$net . 'Connected']); $usr = text_or_null($sm[$net . 'ConnectedUser'] ?? null, 100);
        if ($link === null && !$conn && $usr === null) continue;
        $rows[] = ['plataforma' => $net, 'enlace' => $link ?? '', 'conectado' => $conn ? 1 : 0, 'usuario_conectado' => $usr];
    }
    replace_rows($pdo, 'artista_redes', 'artista_id', $id, $rows);

    $rows = []; $seen = [];
    foreach (nonempty_list($obj['pipeline'] ?? []) as $i => $it) {
        if (!is_array($it)) continue;
        $rows[] = ['item_id' => child_id($seen, $it['id'] ?? null, 'p', $i), 'orden' => $i + 1, 'nombre' => mb_substr((string)($it['name'] ?? ''), 0, 255),
            'categoria' => must_in($k, $obj, 'categoría del pipeline', $it['category'] ?? '', ['Branding', 'Distribución', 'Presencia', 'Booking & Management']), 'completado' => !empty($it['completed']) ? 1 : 0];
    }
    replace_rows($pdo, 'artista_pipeline', 'artista_id', $id, $rows);

    $rows = []; $seen = [];
    foreach (nonempty_list($obj['history'] ?? []) as $i => $it) {
        if (!is_array($it)) continue;
        $rows[] = ['hito_id' => child_id($seen, $it['id'] ?? null, 'h', $i), 'orden' => $i + 1, 'fecha' => to_date($it['date'] ?? null), 'titulo' => mb_substr((string)($it['title'] ?? ''), 0, 255),
            'descripcion' => text_or_null($it['description'] ?? null), 'tipo' => must_in($k, $obj, 'tipo de hito', $it['type'] ?? '', ['milestone', 'release', 'signing', 'tour', 'achievement'])];
    }
    replace_rows($pdo, 'artista_hitos', 'artista_id', $id, $rows);

    // integrantes: memberHistory manda; `members` ("Nombre (Rol)") es derivado y solo se usa si no hay historial
    $rows = []; $seen = []; $hist = array_filter(nonempty_list($obj['memberHistory'] ?? []), 'is_array');
    if ($hist) {
        foreach (array_values($hist) as $i => $it) {
            $nm = text_or_null($it['name'] ?? null, 255); if ($nm === null) continue;
            $fi = to_date($it['startDate'] ?? null); $ff = to_date($it['endDate'] ?? null);
            if ($fi !== null && $ff !== null && $ff < $fi) fail($k, $obj, "el integrante «{$nm}» termina antes de empezar.");
            $rows[] = ['integrante_id' => child_id($seen, $it['id'] ?? null, 'm', $i), 'orden' => count($rows) + 1, 'nombre' => $nm, 'rol' => text_or_null($it['role'] ?? null, 100) ?? 'Músico', 'fecha_inicio' => $fi, 'fecha_fin' => $ff, 'lugar_inicio' => text_or_null($it['venueName'] ?? null, 255), 'activo' => !empty($it['active']) ? 1 : 0];
        }
    } else {
        foreach (nonempty_list($obj['members'] ?? []) as $i => $m) {
            if (!is_string($m) || trim($m) === '') continue;
            $parts = explode('(', $m); $nm = trim($parts[0]); if ($nm === '') continue;
            $rows[] = ['integrante_id' => child_id($seen, null, 'm', $i), 'orden' => count($rows) + 1, 'nombre' => mb_substr($nm, 0, 255), 'rol' => isset($parts[1]) ? (mb_substr(trim(str_replace(')', '', $parts[1])), 0, 100) ?: 'Músico') : 'Músico', 'fecha_inicio' => null, 'fecha_fin' => null, 'lugar_inicio' => null, 'activo' => 1];
        }
    }
    replace_rows($pdo, 'artista_integrantes', 'artista_id', $id, $rows);
}

function event_exists(PDO $pdo, string $id): bool { $st = $pdo->prepare('SELECT 1 FROM eventos WHERE id = ?'); $st->execute([$id]); return (bool)$st->fetchColumn(); }

function set_venue_groups(PDO $pdo, string $id, array $obj): void {
    foreach ([['hours', 'venue_horarios', 'descripcion'], ['localBands', 'venue_bandas_locales', 'nombre']] as [$field, $table, $col]) {
        $rows = []; foreach (nonempty_list($obj[$field] ?? []) as $v) { $v = text_or_null($v, 255); if ($v !== null) $rows[] = ['orden' => count($rows) + 1, $col => $v]; }
        replace_rows($pdo, $table, 'venue_id', $id, $rows);
    }
    // Notas de seguimiento (venue_notas): si el cliente no manda `notes`, se conservan las existentes.
    if (array_key_exists('notes', $obj)) {
        $rows = []; $seen = [];
        foreach (nonempty_list($obj['notes']) as $i => $n) {
            if (!is_array($n)) continue;
            $text = trim((string)($n['text'] ?? '')); if ($text === '') continue;
            $evt = $n['eventId'] ?? null; $evt = (is_string($evt) && $evt !== '' && event_exists($pdo, mb_substr($evt, 0, 40))) ? mb_substr($evt, 0, 40) : null;   // evento inexistente (aún) → sin vínculo, la nota se conserva
            $rows[] = ['nota_id' => child_id($seen, $n['id'] ?? null, 'n', $i), 'fecha' => iso_to_dt($n['date'] ?? null) ?? gmdate('Y-m-d H:i:s') . '.000',
                'texto' => mb_substr($text, 0, 5000), 'autor' => text_or_null($n['author'] ?? null, 100), 'evento_id' => $evt];
        }
        replace_rows($pdo, 'venue_notas', 'venue_id', $id, $rows);
    }
}

function set_event_groups(PDO $pdo, string $id, array $obj): void {
    $rows = []; foreach (nonempty_list($obj['guestBands'] ?? []) as $v) { $v = text_or_null($v, 255); if ($v !== null) $rows[] = ['orden' => count($rows) + 1, 'nombre' => $v]; }
    replace_rows($pdo, 'evento_bandas_invitadas', 'evento_id', $id, $rows);
    $rows = []; $seen = [];
    foreach (nonempty_list($obj['setlist'] ?? []) as $i => $it) {
        if (!is_array($it)) continue;
        $tempo = $it['tempo'] ?? null; if ($tempo !== null && $tempo !== '') must_in('events', $obj, 'tempo', $tempo, ['Lento', 'Medio', 'Rápido']); else $tempo = null;
        $rows[] = ['item_id' => child_id($seen, $it['id'] ?? null, 's', $i), 'orden' => $i + 1, 'titulo' => mb_substr((string)($it['songTitle'] ?? ''), 0, 255), 'duracion_seg' => dur_secs($it['duration'] ?? null), 'tempo' => $tempo, 'notas_transicion' => text_or_null($it['transitionNotes'] ?? null)];
    }
    replace_rows($pdo, 'evento_setlist', 'evento_id', $id, $rows);
}

function set_project_groups(PDO $pdo, string $id, array $obj): void {
    $k = 'recording_projects'; $num = function ($v, string $what) use ($k, $obj) { if ($v === null || $v === '') return 0.0; if (!is_numeric($v) || $v < 0) fail($k, $obj, "$what no puede ser negativo."); return (float)$v; };
    $rows = []; $seen = [];
    foreach (nonempty_list($obj['songs'] ?? []) as $i => $it) { if (!is_array($it)) continue;
        $pr = $it['progress'] ?? 0; if (!is_numeric($pr) || $pr < 0 || $pr > 100) fail($k, $obj, 'el progreso de una canción debe estar entre 0 y 100.');
        $rows[] = ['cancion_id' => child_id($seen, $it['id'] ?? null, 'so', $i), 'orden' => $i + 1, 'titulo' => mb_substr((string)($it['title'] ?? ''), 0, 255), 'duracion_seg' => dur_secs($it['duration'] ?? null), 'compositor' => text_or_null($it['composer'] ?? null, 255),
            'estado' => must_in($k, $obj, 'estado de la canción', $it['status'] ?? '', ['Composición', 'Demo', 'Grabación de Instrumentos', 'Grabación de Voces', 'Mezcla', 'Masterizado', 'Listo']), 'progreso' => (int)round((float)$pr), 'notas' => text_or_null($it['notes'] ?? null)]; }
    replace_rows($pdo, 'proyecto_canciones', 'proyecto_id', $id, $rows);
    $rows = []; $seen = [];
    foreach (nonempty_list($obj['costs'] ?? []) as $i => $it) { if (!is_array($it)) continue;
        $rows[] = ['costo_id' => child_id($seen, $it['id'] ?? null, 'c', $i), 'orden' => $i + 1, 'concepto' => mb_substr((string)($it['concept'] ?? ''), 0, 255),
            'categoria' => must_in($k, $obj, 'categoría del costo', $it['category'] ?? '', ['Estudio/Grabación', 'Músicos de Sesión', 'Mezcla', 'Masterización', 'Arreglos/Producción', 'Otros']), 'monto' => $num($it['amount'] ?? 0, 'un costo'), 'notas' => text_or_null($it['notes'] ?? null)]; }
    replace_rows($pdo, 'proyecto_costos', 'proyecto_id', $id, $rows);
    $rows = []; $seen = [];
    foreach (nonempty_list($obj['payments'] ?? []) as $i => $it) { if (!is_array($it)) continue;
        $rows[] = ['pago_id' => child_id($seen, $it['id'] ?? null, 'pa', $i), 'orden' => $i + 1, 'concepto' => mb_substr((string)($it['concept'] ?? ''), 0, 255), 'monto' => $num($it['amount'] ?? 0, 'un pago'), 'fecha_vencimiento' => to_date($it['dueDate'] ?? null),
            'estado' => must_in($k, $obj, 'estado del pago', $it['status'] ?? 'Pendiente', ['Pendiente', 'Pagado']), 'notas' => text_or_null($it['notes'] ?? null)]; }
    replace_rows($pdo, 'proyecto_pagos', 'proyecto_id', $id, $rows);
    q_run($pdo, 'DELETE FROM proyecto_etapas WHERE proyecto_id = ?', [$id]);   // los instrumentos caen en cascada
    $seen = [];
    foreach (nonempty_list($obj['stages'] ?? []) as $i => $it) { if (!is_array($it)) continue;
        $eid = child_id($seen, $it['id'] ?? null, 'st', $i); $fi = to_date($it['startDate'] ?? null); $ff = to_date($it['endDate'] ?? null);
        if ($fi !== null && $ff !== null && $ff < $fi) fail($k, $obj, 'una etapa termina antes de empezar.');
        q_run($pdo, 'INSERT INTO proyecto_etapas (proyecto_id, etapa_id, orden, nombre, estado, fecha_inicio, fecha_fin, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [$id, $eid, $i + 1, must_in($k, $obj, 'nombre de la etapa', $it['name'] ?? '', ['Pre-producción', 'Grabación', 'Revisión', 'Mezcla', 'Masterización', 'Listo']), must_in($k, $obj, 'estado de la etapa', $it['status'] ?? 'Pendiente', ['Pendiente', 'En Progreso', 'Completado']), $fi, $ff, text_or_null($it['notes'] ?? null)]);
        $seen2 = [];
        foreach (nonempty_list($it['instruments'] ?? []) as $j => $ins) { if (!is_array($ins)) continue;
            q_run($pdo, 'INSERT INTO proyecto_instrumentos (proyecto_id, etapa_id, instrumento_id, orden, nombre, estado, musico) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [$id, $eid, child_id($seen2, $ins['id'] ?? null, 'i', $j), $j + 1, mb_substr((string)($ins['name'] ?? ''), 0, 255), must_in($k, $obj, 'estado del instrumento', $ins['status'] ?? 'Pendiente', ['Pendiente', 'Grabando', 'Listo']), text_or_null($ins['musician'] ?? null, 255)]);
        }
    }
}

/** Partes (artistas, venues, proveedores) y objeto (eventos, giras) del contrato. Las columnas sueltas del formato anterior se aceptan. */
function set_contract_links(PDO $pdo, string $id, array $obj): void {
    $spec = ['artistIds' => ['artistId', 'contrato_artistas', 'artista_id'], 'venueIds' => ['venueId', 'contrato_venues', 'venue_id'], 'providerIds' => [null, 'contrato_proveedores', 'proveedor_id'],
             'eventIds' => ['eventId', 'contrato_eventos', 'evento_id'], 'tourIds' => ['tourId', 'contrato_tours', 'tour_id']];
    foreach ($spec as $many => [$one, $table, $col]) {
        $ids = isset($obj[$many]) && is_array($obj[$many]) ? $obj[$many] : ($one !== null && !empty($obj[$one]) ? [$obj[$one]] : []);
        $ids = array_values(array_unique(array_filter($ids, fn($x) => is_string($x) && $x !== '')));
        q_run($pdo, "DELETE FROM `$table` WHERE contrato_id = ?", [$id]);
        foreach ($ids as $v) q_run($pdo, "INSERT INTO `$table` (contrato_id, `$col`) VALUES (?, ?)", [$id, $v]);
    }
}

function upsert_sql(string $table, array $cols): string {
    $set = implode(', ', array_map(fn($c) => "$c = VALUES($c)", array_filter($cols, fn($c) => $c !== 'id')));
    return "INSERT INTO $table (" . implode(', ', $cols) . ') VALUES (' . implode(', ', array_fill(0, count($cols), '?')) . ") ON DUPLICATE KEY UPDATE $set";
}

/**
 * Aplica cambios por registro: ['coleccion' => ['upserts' => [...], 'deletes' => [ids]]].
 * Todo ocurre en UNA transacción (todo o nada). Cada fila se bloquea con FOR UPDATE y se
 * compara su `version` (bloqueo optimista): si otra persona la cambió antes, se rechaza.
 */
function apply_changes(PDO $pdo, array $changes, bool $lenient = false, bool $dryRun = false): array {
    $defs = entity_defs();
    $stats = ['upserted' => 0, 'deleted' => 0, 'skipped' => 0, 'versions' => [], 'dirty' => []];
    $ctx = ['dirty' => [], 'principalSet' => [], 'principalWanted' => []];
    $pdo->beginTransaction();
    try {
        foreach (UPSERT_ORDER as $key) {
            $ups = $changes[$key]['upserts'] ?? [];
            if (!is_array($ups) || !$ups) continue;
            foreach ($ups as $obj) {
                if (!is_array($obj)) continue;
                if ($lenient) $pdo->exec('SAVEPOINT rec');                              // importación tolerante: un registro malo no tumba el lote
                try {
                    if ($key === 'contacts') { $stats['versions'][$key][$obj['id'] ?? ''] = upsert_contact($pdo, $obj, $ctx); $stats['upserted']++; $ctx['dirty']['contacts'] = $ctx['dirty']['contacts'] ?? false; continue; }
                    $def = $defs[$key];
                    $row = to_row($key, $def, $obj);
                    $cur = q_one($pdo, "SELECT version FROM {$def['table']} WHERE id = ? FOR UPDATE", [$row['id']]);
                    if ($cur !== null && isset($obj['version']) && (int)$obj['version'] !== (int)$cur)
                        throw new ConflictError(ENTITY_LABELS[$key] . ' «' . ($obj['name'] ?? $obj['artisticName'] ?? $obj['title'] ?? $row['id']) . '» fue modificado por otra persona. Se cargaron los datos más recientes; vuelve a aplicar tu cambio.');
                    $row['version'] = $cur === null ? 1 : (int)$cur + 1;
                    q_run($pdo, upsert_sql($def['table'], array_keys($row)), array_values($row));
                    $stats['upserted']++; $stats['versions'][$key][$row['id']] = $row['version'];

                    switch ($key) {
                        case 'artists':
                            set_artist_groups($pdo, $row['id'], $obj);
                            set_artist_genres($pdo, $row['id'], $obj);
                            set_artist_contact($pdo, $row['id'], 'Manager', (string)($obj['manager'] ?? ''), $ctx);
                            set_artist_contact($pdo, $row['id'], 'Booking', (string)($obj['bookingAgent'] ?? ''), $ctx);
                            break;
                        case 'venues':
                            if (isset($obj['providerIds']) && is_array($obj['providerIds'])) replace_pivot($pdo, 'venues', $row['id'], $obj['providerIds']);
                            set_venue_groups($pdo, $row['id'], $obj);
                            $ctx['principalWanted'][$row['id']] = (string)($obj['contactoPrincipalId'] ?? '');
                            break;
                        case 'providers':
                            if (isset($obj['venueIds']) && is_array($obj['venueIds'])) replace_pivot($pdo, 'providers', $row['id'], $obj['venueIds']);
                            set_provider_contact($pdo, $row['id'], $row['nombre'], $obj, $ctx);
                            break;
                        case 'tours':  set_tour_artists($pdo, $row['id'], $obj); break;
                        case 'events': set_event_artists($pdo, $row['id'], $obj); set_event_groups($pdo, $row['id'], $obj); break;
                        case 'contracts': set_contract_links($pdo, $row['id'], $obj); break;
                        case 'recording_projects': set_project_groups($pdo, $row['id'], $obj); break;
                    }
                } catch (SyncError | PDOException $e) {
                    if ($lenient && !($e instanceof ConflictError)) { $pdo->exec('ROLLBACK TO SAVEPOINT rec'); $stats['skipped']++; continue; }
                    throw $e;
                }
            }
        }
        // contacto principal de cada venue (ya existen todos los contactos de esta petición)
        foreach ($ctx['principalWanted'] as $vid => $cid) {
            if (!empty($ctx['principalSet'][$vid])) continue;
            q_run($pdo, 'UPDATE venue_contactos SET es_principal = NULL WHERE venue_id = ?', [$vid]);
            if ($cid !== '') q_run($pdo, 'UPDATE venue_contactos SET es_principal = 1 WHERE venue_id = ? AND contacto_id = ?', [$vid, $cid]);
        }
        foreach (DELETE_ORDER as $key) {
            $del = $changes[$key]['deletes'] ?? [];
            if (!is_array($del) || !$del) continue;
            $table = $key === 'contacts' ? 'contactos' : $defs[$key]['table'];
            foreach ($del as $id) if (is_string($id) && $id !== '') { q_run($pdo, "DELETE FROM `$table` WHERE id = ?", [$id]); $stats['deleted']++; if ($key === 'contacts') $ctx['dirty']['contacts'] = true; }
        }
        if ($dryRun) $pdo->rollBack(); else $pdo->commit();   // validación en seco: se ejecuta todo y se deshace
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }
    $stats['dirty'] = array_keys($ctx['dirty']);
    return $stats;
}

/** Importa los datos del formato más antiguo (tabla `collections` con JSON) una sola vez. */
function migrate_legacy_collections(PDO $pdo): void {
    if (!db_table_exists($pdo, 'collections')) return;
    $rows = $pdo->query('SELECT name, data FROM collections')->fetchAll();
    if (!$rows || (int)$pdo->query('SELECT COUNT(*) FROM artistas')->fetchColumn() > 0) return;
    $changes = [];
    foreach ($rows as $r) {
        $arr = json_decode((string)$r['data'], true);
        if (is_array($arr) && $arr && (isset(entity_defs()[$r['name']]) || $r['name'] === 'contacts')) $changes[$r['name']] = ['upserts' => $arr];
    }
    if ($changes) apply_changes($pdo, $changes, true);
}
