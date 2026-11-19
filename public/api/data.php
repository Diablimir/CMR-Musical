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
    $raw = read_body_limited(MAX_BYTES);   // tope duro: nunca se leen más de MAX_BYTES + 1 bytes, con o sin Content-Length
    $in = json_decode((string)$raw, true);
    if (!is_array($in) || !isset($in['changes']) || !is_array($in['changes'])) respond(['error' => 'Formato inválido.'], 400);

    try {
        $stats = apply_changes($pdo, $in['changes']);
        respond(['ok' => true] + $stats);
    } catch (SyncError $e) {
        respond(['error' => $e->getMessage(), 'code' => $e->errCode], $e->httpCode);
    } catch (PDOException $e) {
        $errno = (int)($e->errorInfo[1] ?? 0);
        $msg = match (true) {
            $errno === 1451 => 'No se puede eliminar: hay registros relacionados que se perderían (por ejemplo, un venue o artista con eventos, giras o contratos). Elimina o reasigna primero lo relacionado.',
            $errno === 1452 => 'No se pudo guardar: hace referencia a un registro que no existe (artista, venue, gira, evento o proveedor).',
            $errno === 1062 => 'No se pudo guardar: ya existe un registro igual (valor duplicado).',
            in_array($errno, [4025, 3819], true) => 'No se pudo guardar: algún valor está fuera del rango o dominio permitido.',
            $errno === 1406 => 'No se pudo guardar: un texto es demasiado largo.',
            $errno === 1213 || $errno === 1205 => 'La base de datos está ocupada. Inténtalo de nuevo en unos segundos.',
            default => null,
        };
        if ($msg !== null) respond(['error' => $msg, 'code' => 'db_' . $errno], in_array($errno, [4025, 3819, 1406], true) ? 422 : 409);
        respond(['error' => 'Error al guardar en la base de datos.', 'code' => 'db_error'], 500);
    }
}

respond(['error' => 'Método no permitido.'], 405);
