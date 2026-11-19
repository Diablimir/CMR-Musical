<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/schema.php';
require __DIR__ . '/entities.php';
require __DIR__ . '/approvals_lib.php';

// Cambios pendientes de aprobación.
//   GET  ?scope=mine     → mis propuestas (cualquier usuario)
//   GET  ?scope=pending  → todas las pendientes con el registro actual (solo Super Admin)
//   GET  ?scope=count    → cuántas hay pendientes (Super Admin) o cuántas mías (los demás)
//   POST ?action=approve {ids, force?}   → aplica (solo Super Admin)
//   POST ?action=reject  {ids, reason?}  → rechaza con motivo (solo Super Admin)
//   POST ?action=withdraw {ids}          → retira MIS propuestas pendientes (cualquier usuario)
$user = require_login();
$pdo = db();
try { ensure_schema($pdo); } catch (Throwable $e) { respond(['error' => 'No se pudo preparar la base de datos.'], 500); }
$method = $_SERVER['REQUEST_METHOD'];
$isApprover = can_approve($user);

try {
    if ($method === 'GET') {
        $scope = (string)($_GET['scope'] ?? 'mine');
        if ($scope === 'mine') respond(['items' => my_changes($pdo, (string)$user['id'])]);
        if ($scope === 'count') {
            if ($isApprover) respond(['count' => pending_count($pdo)]);
            $c = $pdo->prepare("SELECT COUNT(*) FROM cambios_pendientes WHERE propuesto_por = ? AND estado = 'pendiente'"); $c->execute([$user['id']]);
            respond(['count' => (int)$c->fetchColumn()]);
        }
        if ($scope === 'pending') {
            if (!$isApprover) respond(['error' => 'Solo el Super Admin puede ver y aprobar los cambios pendientes.'], 403);
            $items = list_pending($pdo);
            respond(['items' => $items, 'count' => count($items)]);
        }
        respond(['error' => 'Consulta no válida.'], 400);
    }
    if ($method !== 'POST') respond(['error' => 'Método no permitido.'], 405);
    $in = body();
    if ((string)($_GET['action'] ?? '') === 'withdraw') {   // cualquiera puede retirar SUS propias propuestas pendientes
        $ids0 = is_array($in['ids'] ?? null) ? array_slice(array_map('strval', $in['ids']), 0, 200) : [];
        respond(['ok' => true, 'withdrawn' => withdraw_changes($pdo, $ids0, (string)$user['id'])]);
    }
    if (!$isApprover) respond(['error' => 'Solo el Super Admin puede aprobar o rechazar cambios.'], 403);
    $ids = is_array($in['ids'] ?? null) ? array_slice(array_map('strval', $in['ids']), 0, 200) : [];
    if (!$ids) respond(['error' => 'No se indicó ningún cambio.'], 400);
    $action = (string)($_GET['action'] ?? '');
    if ($action === 'approve') {
        set_time_limit(120);
        $results = approve_changes($pdo, $ids, $user, !empty($in['force']));
        respond(['ok' => true, 'results' => $results, 'approved' => count(array_filter($results, fn($r) => $r['ok'])), 'count' => pending_count($pdo)]);
    }
    if ($action === 'reject') respond(['ok' => true, 'rejected' => reject_changes($pdo, $ids, $user, (string)($in['reason'] ?? '')), 'count' => pending_count($pdo)]);
    respond(['error' => 'Acción no válida.'], 400);
} catch (Throwable $e) {
    error_log('changes.php: ' . $e->getMessage());
    respond(['error' => 'No se pudo completar la operación.'], 500);
}
