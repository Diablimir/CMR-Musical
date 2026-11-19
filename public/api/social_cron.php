<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/schema.php';
require __DIR__ . '/social_lib.php';

// Captura diaria automática (como Metricool): recorre los artistas con Instagram/TikTok y guarda la captura de hoy.
// Se programa en hPanel → Avanzado → Cron Jobs, 1 vez al día, con:   php /home/USUARIO/domains/DOMINIO/public_html/api/social_cron.php
// o por URL con token:   https://DOMINIO/api/social_cron.php?token=TU_CRON_TOKEN   (define 'cron_token' en api/config.php).
$cli = PHP_SAPI === 'cli';
if (!$cli) {
    $tok = (string)(config()['cron_token'] ?? '');
    if (strlen($tok) < 16 || !hash_equals($tok, (string)($_GET['token'] ?? ''))) respond(['error' => 'No autorizado.'], 403);
}
set_time_limit(280);
$pdo = db(); ensure_schema($pdo);
$ids = $pdo->query("SELECT DISTINCT r.artista_id FROM artista_redes r JOIN artistas a ON a.id = r.artista_id
    WHERE a.deleted_at IS NULL AND r.plataforma IN ('instagram','tiktok','youtube','facebook') AND (r.enlace <> '' OR r.usuario_conectado IS NOT NULL) ORDER BY r.artista_id")->fetchAll(PDO::FETCH_COLUMN);
$out = ['ok' => 0, 'fallidas' => 0, 'detalle' => []];
foreach ($ids as $aid) {
    $r = social_refresh_artist($pdo, (string)$aid);
    $out['ok'] += count($r['refreshed']); $out['fallidas'] += count($r['errors']);
    foreach ($r['errors'] as $plat => $msg) $out['detalle'][] = "$aid/$plat: $msg";
}
if ($cli) { echo json_encode($out, JSON_UNESCAPED_UNICODE) . "\n"; exit; }
respond($out);
