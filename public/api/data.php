<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

// Colecciones permitidas (cada una se guarda como un arreglo JSON completo).
const COLLECTIONS = ['venues', 'artists', 'contacts', 'tours', 'events', 'contracts', 'providers', 'recording_projects'];
const MAX_BYTES = 12 * 1024 * 1024;

$user = require_login();
$pdo = db();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $out = array_fill_keys(COLLECTIONS, []);
    foreach ($pdo->query('SELECT name, data FROM collections') as $r) {
        if (!in_array($r['name'], COLLECTIONS, true)) continue;
        $decoded = json_decode($r['data'], true);
        $out[$r['name']] = is_array($decoded) ? $decoded : [];
    }
    respond($out);
}

if ($method === 'PUT') {
    $name = (string)($_GET['c'] ?? '');
    if (!in_array($name, COLLECTIONS, true)) respond(['error' => 'Colección desconocida.'], 400);
    $raw = file_get_contents('php://input');
    if (strlen((string)$raw) > MAX_BYTES) respond(['error' => 'Datos demasiado grandes.'], 413);
    $in = json_decode((string)$raw, true);
    if (!is_array($in) || !isset($in['data']) || !is_array($in['data'])) respond(['error' => 'Formato inválido.'], 400);

    $json = json_encode(array_values($in['data']), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $now = gmdate('Y-m-d\TH:i:s\Z');
    $pdo->beginTransaction();
    $st = $pdo->prepare('UPDATE collections SET data = ?, updated_at = ?, updated_by = ? WHERE name = ?');
    $st->execute([$json, $now, $user['username'], $name]);
    if ($st->rowCount() === 0) {
        $chk = $pdo->prepare('SELECT COUNT(*) FROM collections WHERE name = ?');
        $chk->execute([$name]);
        if ((int)$chk->fetchColumn() === 0) {
            $pdo->prepare('INSERT INTO collections (name, data, updated_at, updated_by) VALUES (?,?,?,?)')
                ->execute([$name, $json, $now, $user['username']]);
        }
    }
    $pdo->commit();
    respond(['ok' => true, 'updated_at' => $now]);
}

respond(['error' => 'Método no permitido.'], 405);
