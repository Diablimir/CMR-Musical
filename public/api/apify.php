<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
$me = require_login();
set_time_limit(120);

$action = $_GET['action'] ?? '';

if ($action === 'status') {
    $t = apify_token();
    respond([
        'configured' => $t !== '',
        'message' => $t !== '' ? 'Apify está configurado en el servidor.' : 'Apify no está configurado (falta apify_token en api/config.php).',
    ]);
}

if ($action !== 'scrape' || $_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Acción no válida.'], 400);

// Consulta en vivo de un perfil público. Ya NO existe modo demostración: si Apify no devuelve datos reales, se responde con un error claro.
require __DIR__ . '/social_lib.php';
rate_limit('apify:' . $me['id'], 12, 600);
$in = body();
$platform = (string)($in['platform'] ?? 'instagram');
$handle = social_handle((string)($in['handle'] ?? ''));
if ($handle === '') respond(['error' => 'Se requiere un usuario válido.'], 400);
$r = social_apify_fetch($platform, $handle);
if (!$r['ok']) respond(['success' => false, 'error' => $r['error']], 422);
respond(['success' => true, 'platform' => $platform, 'handle' => '@' . $handle, 'scrapedAt' => gmdate('c'), 'actorUsed' => $r['actor'], 'profile' => $r['data']]);
