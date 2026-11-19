<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/schema.php';
require __DIR__ . '/social_lib.php';   // incluye meta_lib.php

// Cuenta oficial de Instagram (alcance, demografía, publicaciones).
//   GET  ?action=status            → ¿está configurada la app de Meta en el servidor? (qué falta)
//   GET  ?artist_id=…              → conexión (sin token) + alcance + demografía + publicaciones
//   POST ?action=start             → { url } a donde enviar al usuario a autorizar en Meta
//   POST ?action=sync              → trae de nuevo los datos oficiales
//   POST ?action=disconnect        → borra la conexión (el historial ya guardado se conserva)
$user = require_login();
$pdo = db();
try { ensure_schema($pdo); } catch (Throwable $e) { respond(['error' => 'No se pudo preparar la base de datos.'], 500); }
$method = $_SERVER['REQUEST_METHOD'];
$action = (string)($_GET['action'] ?? '');

function meta_artist_or_404(PDO $pdo, string $id): void {
    $st = $pdo->prepare('SELECT 1 FROM artistas WHERE id = ?'); $st->execute([$id]);
    if (!$st->fetchColumn()) respond(['error' => 'El artista no existe.'], 404);
}

try {
    if ($method === 'GET' && $action === 'status') {
        respond(['configured' => meta_configured(), 'missing' => meta_missing(), 'redirectUri' => meta_redirect_uri()]);
    }
    if ($method === 'GET') {
        $aid = (string)($_GET['artist_id'] ?? '');
        if ($aid === '') respond(['error' => 'Falta artist_id.'], 400);
        meta_artist_or_404($pdo, $aid);
        respond(meta_load($pdo, $aid));
    }
    if ($method !== 'POST') respond(['error' => 'Método no permitido.'], 405);

    $in = body();
    $aid = (string)($in['artistId'] ?? '');
    if ($aid === '') respond(['error' => 'Falta artistId.'], 400);
    meta_artist_or_404($pdo, $aid);

    if ($action === 'start') {
        rate_limit('metastart:' . $user['id'], 20, 600);
        if (!meta_configured()) respond(['error' => 'Falta configurar la app de Meta en el servidor: ' . implode(', ', meta_missing()) . ' (ver HOSTINGER.md).', 'code' => 'meta_not_configured'], 409);
        start_session();
        $state = bin2hex(random_bytes(16));
        $_SESSION['meta_oauth'] = ['state' => $state, 'artist' => $aid, 'at' => time()];
        respond(['url' => meta_auth_url($state)]);
    }
    if ($action === 'sync') {
        rate_limit('meta:' . $user['id'], 12, 600);
        if (!meta_configured()) respond(['error' => 'Falta configurar la app de Meta en el servidor.', 'code' => 'meta_not_configured'], 409);
        set_time_limit(200);
        $r = meta_sync_artist($pdo, $aid);
        if (!$r['ok']) respond(['error' => $r['error']], 422);
        respond(['ok' => true, 'avisos' => $r['avisos'], 'resumen' => $r['resumen']] + ['data' => meta_load($pdo, $aid)]);
    }
    if ($action === 'disconnect') {
        $pdo->prepare("DELETE FROM artista_conexiones WHERE artista_id = ? AND plataforma = 'instagram'")->execute([$aid]);
        respond(['ok' => true, 'data' => meta_load($pdo, $aid)]);
    }
    respond(['error' => 'Acción no válida.'], 400);
} catch (Throwable $e) {
    error_log('meta.php: ' . $e->getMessage());
    respond(['error' => 'No se pudo completar la operación.'], 500);
}
