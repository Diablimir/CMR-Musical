<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/schema.php';
require __DIR__ . '/entities.php';

const MAX_BYTES = 12 * 1024 * 1024;

$user = require_login();
$pdo = db();
try {
    ensure_schema($pdo);
} catch (Throwable $e) {
    respond(['error' => 'No se pudo preparar la base de datos. Revisa los permisos del usuario MySQL.'], 500);
}
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    respond(load_all($pdo));
}

if ($method === 'POST' && ($_GET['action'] ?? '') === 'sync') {
    $raw = file_get_contents('php://input');
    if (strlen((string)$raw) > MAX_BYTES) respond(['error' => 'Datos demasiado grandes.'], 413);
    $in = json_decode((string)$raw, true);
    if (!is_array($in) || !isset($in['changes']) || !is_array($in['changes'])) respond(['error' => 'Formato inválido.'], 400);

    try {
        $stats = apply_changes($pdo, $in['changes']);
        respond(['ok' => true] + $stats);
    } catch (SyncError $e) {
        respond(['error' => $e->getMessage()], $e->httpCode);
    } catch (PDOException $e) {
        $driverCode = (int)($e->errorInfo[1] ?? 0);
        if (($e->errorInfo[0] ?? '') === '23000') {
            $msg = match ($driverCode) {
                1451 => 'No se puede eliminar: hay registros relacionados (por ejemplo, un venue con eventos, o un artista con giras o eventos). Elimina primero lo relacionado.',
                1452 => 'No se pudo guardar: hace referencia a un registro que no existe (artista, venue o gira).',
                default => 'No se pudo guardar por una relación entre datos (por ejemplo, un venue con eventos no se puede eliminar).',
            };
            respond(['error' => $msg], 409);
        }
        respond(['error' => 'Error al guardar en la base de datos.'], 500);
    }
}

respond(['error' => 'Método no permitido.'], 405);
