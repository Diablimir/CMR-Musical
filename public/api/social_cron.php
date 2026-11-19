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
$rows = $pdo->query("SELECT r.artista_id, r.plataforma, r.enlace FROM artista_redes r JOIN artistas a ON a.id = r.artista_id
    WHERE a.deleted_at IS NULL AND r.plataforma IN ('instagram','tiktok') AND r.enlace <> '' ORDER BY r.artista_id, r.plataforma")->fetchAll();
$out = ['ok' => 0, 'fallidas' => 0, 'detalle' => []];
foreach ($rows as $r) {
    $h = social_handle((string)$r['enlace']);
    $res = social_apify_fetch($r['plataforma'], $h);
    if ($res['ok']) { social_save_snapshot($pdo, $r['artista_id'], $r['plataforma'], gmdate('Y-m-d'), $res['data'], 'apify'); $out['ok']++; }
    else { $out['fallidas']++; $out['detalle'][] = "{$r['artista_id']}/{$r['plataforma']}: {$res['error']}"; }
}
if ($cli) { echo json_encode($out, JSON_UNESCAPED_UNICODE) . "\n"; exit; }
respond($out);
