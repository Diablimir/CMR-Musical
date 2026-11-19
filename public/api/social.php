<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/schema.php';
require __DIR__ . '/social_lib.php';

// Historial de redes sociales y acciones de un artista.
//   GET  ?artist_id=…                      → { metrics: [...], actions: [...] }
//   POST ?action=metric                    → guarda/reemplaza la captura (manual) de un día
//   POST ?action=fetch                     → consulta Apify (instagram/tiktok/youtube/facebook) y guarda la captura de hoy
//   POST ?action=refresh                   → actualiza solo lo que aún no tiene captura de hoy (se llama al abrir la pantalla)
//   POST ?action=metric_delete             → borra la captura de un día
//   POST ?action=action_save | action_delete → bitácora de acciones
$user = require_login();
$pdo = db();
try { ensure_schema($pdo); } catch (Throwable $e) { respond(['error' => 'No se pudo preparar la base de datos.'], 500); }
$method = $_SERVER['REQUEST_METHOD'];

function artist_or_404(PDO $pdo, string $id): void {
    $st = $pdo->prepare('SELECT 1 FROM artistas WHERE id = ?'); $st->execute([$id]);
    if (!$st->fetchColumn()) respond(['error' => 'El artista no existe.'], 404);
}
function load_social(PDO $pdo, string $aid): array {
    $m = $pdo->prepare('SELECT plataforma, fecha, seguidores, siguiendo, publicaciones, interaccion, fuente, capturado_en FROM artista_metricas_redes WHERE artista_id = ? ORDER BY fecha, plataforma');
    $m->execute([$aid]);
    $metrics = array_map(fn($r) => ['platform' => $r['plataforma'], 'date' => $r['fecha'], 'followers' => (int)$r['seguidores'],
        'following' => $r['siguiendo'] === null ? null : (int)$r['siguiendo'], 'posts' => $r['publicaciones'] === null ? null : (int)$r['publicaciones'],
        'engagement' => $r['interaccion'] === null ? null : (float)$r['interaccion'], 'source' => $r['fuente'], 'capturedAt' => substr(str_replace(' ', 'T', (string)$r['capturado_en']), 0, 23) . 'Z'], $m->fetchAll());
    $a = $pdo->prepare('SELECT accion_id, fecha, tipo, titulo, notas, plataforma FROM artista_acciones WHERE artista_id = ? ORDER BY fecha, accion_id');
    $a->execute([$aid]);
    $actions = array_map(fn($r) => array_filter(['id' => $r['accion_id'], 'date' => $r['fecha'], 'type' => $r['tipo'], 'title' => $r['titulo'], 'notes' => $r['notas'], 'platform' => $r['plataforma']], fn($v) => $v !== null), $a->fetchAll());
    return ['metrics' => $metrics, 'actions' => $actions];
}

try {
    if ($method === 'GET') {
        $aid = (string)($_GET['artist_id'] ?? '');
        if ($aid === '') respond(['error' => 'Falta artist_id.'], 400);
        artist_or_404($pdo, $aid);
        respond(load_social($pdo, $aid));
    }
    if ($method !== 'POST') respond(['error' => 'Método no permitido.'], 405);

    $in = body();
    $aid = (string)($in['artistId'] ?? '');
    if ($aid === '') respond(['error' => 'Falta artistId.'], 400);
    artist_or_404($pdo, $aid);
    $action = (string)($_GET['action'] ?? '');
    $platform = (string)($in['platform'] ?? '');

    if ($action === 'metric') {
        $date = (string)($in['date'] ?? gmdate('Y-m-d'));
        social_save_snapshot($pdo, $aid, $platform, $date, ['seguidores' => $in['followers'] ?? null, 'siguiendo' => $in['following'] ?? null, 'publicaciones' => $in['posts'] ?? null, 'interaccion' => $in['engagement'] ?? null], 'manual');
        respond(['ok' => true] + load_social($pdo, $aid));
    }
    if ($action === 'fetch') {
        rate_limit('social:' . $user['id'], 20, 600);
        if (!in_array($platform, SOCIAL_NETS, true)) respond(['error' => 'Red social no válida.'], 400);
        $handle = social_handle((string)($in['handle'] ?? ''));
        if ($handle === '') {   // por defecto, el enlace guardado del artista para esa red
            $handle = social_artist_handle($pdo, $aid, $platform);
        }
        $r = social_apify_fetch($platform, $handle);
        if (!$r['ok']) respond(['error' => $r['error']], 422);
        social_save_snapshot($pdo, $aid, $platform, gmdate('Y-m-d'), $r['data'], 'apify');
        respond(['ok' => true, 'handle' => $handle, 'captured' => $r['data']] + load_social($pdo, $aid));
    }
    if ($action === 'refresh') {   // actualización automática al abrir la pantalla (solo lo que aún no tiene captura de hoy)
        rate_limit('social:' . $user['id'], 30, 600);
        set_time_limit(240);
        $r = social_refresh_artist($pdo, $aid, !empty($in['force']));
        respond(['ok' => true] + $r + load_social($pdo, $aid));
    }
    if ($action === 'metric_delete') {
        $st = $pdo->prepare('DELETE FROM artista_metricas_redes WHERE artista_id = ? AND plataforma = ? AND fecha = ?');
        $st->execute([$aid, $platform, (string)($in['date'] ?? '')]);
        respond(['ok' => true] + load_social($pdo, $aid));
    }
    if ($action === 'action_save') {
        $id = (string)($in['id'] ?? ''); if ($id === '') $id = 'acc-' . bin2hex(random_bytes(6));
        if (strlen($id) > 40) respond(['error' => 'Identificador demasiado largo.'], 400);
        $date = (string)($in['date'] ?? ''); $dt = DateTime::createFromFormat('Y-m-d', $date);
        if (!$dt || $dt->format('Y-m-d') !== $date) respond(['error' => 'La fecha de la acción no es válida (AAAA-MM-DD).'], 422);
        $type = (string)($in['type'] ?? ''); if (!in_array($type, ACTION_TYPES, true)) respond(['error' => 'Tipo de acción no válido. Permitidos: ' . implode(', ', ACTION_TYPES) . '.'], 422);
        $title = trim((string)($in['title'] ?? '')); if ($title === '') respond(['error' => 'Escribe un título para la acción.'], 422);
        $plat = ($in['platform'] ?? '') === '' ? null : (string)$in['platform'];
        if ($plat !== null && !in_array($plat, SOCIAL_NETS, true)) respond(['error' => 'Red social no válida.'], 422);
        $notes = isset($in['notes']) && trim((string)$in['notes']) !== '' ? mb_substr(trim((string)$in['notes']), 0, 5000) : null;
        $st = $pdo->prepare('INSERT INTO artista_acciones (artista_id, accion_id, fecha, tipo, titulo, notas, plataforma, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE fecha = VALUES(fecha), tipo = VALUES(tipo), titulo = VALUES(titulo), notas = VALUES(notas), plataforma = VALUES(plataforma)');
        $st->execute([$aid, $id, $date, $type, mb_substr($title, 0, 255), $notes, $plat, gmdate('Y-m-d H:i:s') . '.000']);
        respond(['ok' => true] + load_social($pdo, $aid));
    }
    if ($action === 'action_delete') {
        $st = $pdo->prepare('DELETE FROM artista_acciones WHERE artista_id = ? AND accion_id = ?'); $st->execute([$aid, (string)($in['id'] ?? '')]);
        respond(['ok' => true] + load_social($pdo, $aid));
    }
    respond(['error' => 'Acción no válida.'], 400);
} catch (InvalidArgumentException $e) {
    respond(['error' => $e->getMessage()], 422);
} catch (Throwable $e) {
    error_log('social.php: ' . $e->getMessage());
    respond(['error' => 'No se pudo completar la operación.'], 500);
}
